/**
 * Mobile Editor Handler for KaleidoScript
 * Makes the editor panel collapsible on mobile devices
 */

(function() {
    // Elements and state
    let editorContainer;
    let isEditorCollapsed = true; // Start collapsed/hidden
    let isMobileView = false;
    let resizeHandle;
    let hintsPercentage = 30; // Default percentage for hints panel
    
    // Store original DOM structure
    let workspace;
    let editorPanel;
    let outputPanel;
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', () => {
        setupMobileEditor();
        window.addEventListener('resize', checkViewportSize);
        
        // Wait a bit to ensure all scripts are loaded
        setTimeout(checkViewportSize, 500);
    });
    
    function setupMobileEditor() {
        // Store references to original elements
        workspace = document.querySelector('.workspace');
        editorPanel = document.querySelector('.editor-panel');
        outputPanel = document.querySelector('.output-panel');
        
        if (!workspace || !editorPanel || !outputPanel) {
            console.error('Required elements not found for mobile editor');
            return;
        }
        
        // Create new container for editor in mobile view
        editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        editorContainer.id = 'mobile-editor-container';
        
        // Style the container
        Object.assign(editorContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100vw',  // Use viewport width instead of %
            height: '100vh', // Use viewport height instead of %
            backgroundColor: 'rgba(0, 0, 0, 0.95)', // Nearly opaque dark background
            zIndex: '2000', // Very high z-index to be on top of everything
            display: 'flex',
            flexDirection: 'column',
            transition: 'opacity 0.3s ease, visibility 0.3s ease',
            opacity: '0',
            visibility: 'hidden', // Initially hidden
            padding: '10px',
            boxSizing: 'border-box',
            overflowX: 'hidden', // Prevent horizontal scrolling
            overflowY: 'hidden'  // Control vertical scrolling
        });
        
        // Create a close button for the editor
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.className = 'mobile-editor-close';
        
        // Style the close button
        Object.assign(closeButton.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#61dafb',
            color: '#000',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: '2001',
            fontSize: '18px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        });
        
        // Add click event to close button
        closeButton.addEventListener('click', closeEditor);
        
        // Create editor wrapper (will contain the actual editor)
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'mobile-editor-wrapper';
        
        // Style the wrapper
        Object.assign(editorWrapper.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '40px', // Leave room for close button
            boxSizing: 'border-box',
            width: '100%',
            height: 'calc(100vh - 60px)', // Account for padding and button
            minHeight: '0', // Important for nested flex containers
            overflow: 'hidden',
            position: 'relative' // For absolute positioning of the resize handle
        });
        
        // Create resize handle
        resizeHandle = document.createElement('div');
        resizeHandle.className = 'mobile-resize-handle';
        
        // Style the resize handle
        Object.assign(resizeHandle.style, {
            position: 'absolute',
            width: '32px',
            height: '32px',
            backgroundColor: '#61dafb',
            borderRadius: '50%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2001',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'row-resize',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            touchAction: 'none' // Prevent scrolling when dragging
        });
        
        // Add grip icon
        resizeHandle.innerHTML = '<i class="fas fa-grip-lines" style="color: #000;"></i>';
        
        // Add components to container
        editorContainer.appendChild(closeButton);
        editorContainer.appendChild(editorWrapper);
        
        // Add to document
        document.body.appendChild(editorContainer);
        
        // Set up resize functionality
        setupResizeHandle();
    }
    
    function setupResizeHandle() {
        let startY;
        let startPercentage;
        let editorHeight;
        
        const onDragStart = function(e) {
            e.preventDefault();
            
            // Get starting position
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            startPercentage = hintsPercentage;
            editorHeight = editorContainer.clientHeight;
            
            // Add move and end events
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('mouseup', onDragEnd);
            document.addEventListener('touchend', onDragEnd);
        };
        
        const onDragMove = function(e) {
            e.preventDefault();
            
            // Calculate new position
            const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = y - startY;
            
            // Convert to percentage (negative deltaY means make hints area bigger)
            const deltaPercent = (-deltaY / editorHeight) * 100;
            let newPercent = startPercentage + deltaPercent;
            
            // Clamp to reasonable range (15% to 60%)
            newPercent = Math.min(Math.max(newPercent, 15), 60);
            hintsPercentage = newPercent;
            
            // Update layout
            updateEditorLayout();
        };
        
        const onDragEnd = function() {
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('touchmove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            document.removeEventListener('touchend', onDragEnd);
        };
        
        // Add drag start event listeners
        resizeHandle.addEventListener('mousedown', onDragStart);
        resizeHandle.addEventListener('touchstart', onDragStart, { passive: false });
    }
    
    function updateEditorLayout() {
        if (!editorPanel) return;
        
        const cmContainer = editorPanel.querySelector('.CodeMirror');
        const hintsPanel = editorPanel.querySelector('.editor-hints');
        
        if (!cmContainer || !hintsPanel) {
            console.error("Could not find CodeMirror or hints panel");
            return;
        }
        
        // Calculate percentages
        const editorPercentage = 100 - hintsPercentage;
        
        // First, ensure editor panel takes full height
        editorPanel.style.cssText = `
            height: 100% !important;
            min-height: 100% !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            position: relative !important;
            flex: 1 !important;
        `;
        
        // Update CodeMirror container
        cmContainer.style.cssText = `
            height: ${editorPercentage}% !important;
            min-height: ${editorPercentage}% !important;
            width: 100% !important;
            display: flex !important;
            flex: ${editorPercentage} 0 0 !important;
            position: relative !important;
            overflow: hidden !important;
        `;
        
        // Update hints panel
        hintsPanel.style.cssText = `
            height: ${hintsPercentage}% !important;
            min-height: ${hintsPercentage}% !important;
            width: 100% !important;
            display: flex !important;
            flex: ${hintsPercentage} 0 0 !important;
            position: relative !important;
            overflow: auto !important;
        `;
        
        // Ensure the CodeMirror editor itself fills its container
        const cmElement = cmContainer.querySelector('.CodeMirror-wrap');
        if (cmElement) {
            cmElement.style.cssText = `
                height: 100% !important;
                min-height: 100% !important;
                width: 100% !important;
                position: absolute !important;
                left: 0 !important;
                right: 0 !important;
                top: 0 !important;
                bottom: 0 !important;
                display: flex !important;
                flex-direction: column !important;
            `;
        }
        
        // Position the resize handle
        if (resizeHandle) {
            const editorRect = cmContainer.getBoundingClientRect();
            const bottomY = editorRect.bottom;
            resizeHandle.style.top = `${bottomY - 16}px`;
        }
        
        // Force CodeMirror to refresh its layout
        if (window.editor) {
            window.editor.refresh();
            // Double refresh to ensure proper rendering
            setTimeout(() => {
                window.editor.refresh();
                // Force a redraw by accessing offsetHeight
                editorPanel.offsetHeight;
            }, 50);
        }
    }
    
    function checkViewportSize() {
        const isMobile = window.innerWidth <= 768;
        
        // Only make changes when view mode changes
        if (isMobile !== isMobileView) {
            isMobileView = isMobile;
            
            if (isMobile) {
                activateMobileLayout();
            } else {
                restoreDesktopLayout();
            }
        }
    }
    
    function activateMobileLayout() {
        // Make sure workspace is in column layout
        if (workspace) workspace.style.flexDirection = 'column';
        
        // Move editor panel to the new container
        if (editorPanel && editorPanel.parentNode === workspace) {
            const editorWrapper = editorContainer.querySelector('.mobile-editor-wrapper');
            if (!editorWrapper) return;
            
            console.log("Activating mobile layout");
            
            // Ensure editor panel is properly styled before moving
            editorPanel.style.cssText = `
                width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                position: relative !important;
            `;
            
            // Move the editor panel into the wrapper
            editorWrapper.appendChild(editorPanel);
            editorWrapper.appendChild(resizeHandle);
            
            // Set output panel to take full width
            if (outputPanel) {
                outputPanel.style.width = '100%';
                outputPanel.style.maxWidth = '100%';
            }
            
            // Initially hidden
            isEditorCollapsed = true;
            setVisibility(false);
            
            // Force layout updates
            setTimeout(() => {
                updateEditorLayout();
                if (window.editor) window.editor.refresh();
            }, 50);
            
            updateToggleButtonState(false);
        }
    }
    
    function restoreDesktopLayout() {
        // Restore original layout
        if (editorContainer && editorPanel) {
            // Find the wrapper
            const editorWrapper = editorContainer.querySelector('.mobile-editor-wrapper');
            
            if (editorWrapper && editorWrapper.contains(editorPanel)) {
                console.log("Restoring desktop layout");
                
                // Hide the resize handle
                if (resizeHandle && resizeHandle.parentNode) {
                    resizeHandle.parentNode.removeChild(resizeHandle);
                }
                
                // Remove editor panel from wrapper
                editorWrapper.removeChild(editorPanel);
                
                // Insert back into workspace before output panel
                if (workspace && outputPanel) {
                    workspace.insertBefore(editorPanel, outputPanel);
                } else if (workspace) {
                    workspace.appendChild(editorPanel);
                }
                
                // Reset editor panel styles
                editorPanel.style.width = '';
                editorPanel.style.height = '';
                editorPanel.style.maxHeight = '';
                editorPanel.style.display = 'flex';
                editorPanel.style.flexDirection = '';
                editorPanel.style.overflow = '';
                
                // Reset CodeMirror and hints panel
                const cmElement = editorPanel.querySelector('.CodeMirror');
                const hintsPanel = editorPanel.querySelector('.editor-hints');
                
                if (cmElement) {
                    cmElement.style.cssText = '';
                }
                
                if (hintsPanel) {
                    hintsPanel.style.cssText = '';
                }
            }
            
            // Reset styles
            if (workspace) workspace.style.flexDirection = '';
            if (outputPanel) {
                outputPanel.style.width = '';
                outputPanel.style.maxWidth = '';
            }
            
            // Reset state
            isEditorCollapsed = true;
            
            // Make sure container is hidden
            editorContainer.style.visibility = 'hidden';
            editorContainer.style.opacity = '0';
            
            // Refresh editor in desktop mode
            if (window.editor) {
                setTimeout(() => window.editor.refresh(), 100);
            }
        }
    }
    
    function updateToggleButtonState(isVisible) {
        const toggleBtn = document.getElementById('mobile-editor-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = isVisible ? 
                '<i class="fas fa-code"></i> Hide Editor' : 
                '<i class="fas fa-code"></i> Show Editor';
        }
    }
    
    function setVisibility(visible) {
        if (!editorContainer) return;
        
        if (visible) {
            console.log("Showing mobile editor");
            editorContainer.style.opacity = '1';
            editorContainer.style.visibility = 'visible';
            document.body.style.overflow = 'hidden'; // Prevent body scrolling
            
            // Make sure editor panel is visible when showing container
            if (editorPanel) {
                editorPanel.style.display = 'flex';
                
                // Force a layout update immediately after showing
                setTimeout(updateEditorLayout, 50);
            }
            
            updateToggleButtonState(true);
            
            // Refresh CodeMirror when made visible
            if (window.editor) {
                setTimeout(() => {
                    window.editor.refresh();
                }, 150);
            }
        } else {
            console.log("Hiding mobile editor");
            editorContainer.style.opacity = '0';
            editorContainer.style.visibility = 'hidden';
            document.body.style.overflow = ''; // Restore body scrolling
            updateToggleButtonState(false);
        }
    }
    
    function openEditor() {
        if (!editorContainer || !isMobileView) return;
        
        isEditorCollapsed = false;
        setVisibility(true);
    }
    
    function closeEditor() {
        if (!editorContainer || !isMobileView) return;
        
        isEditorCollapsed = true;
        setVisibility(false);
    }
    
    function toggleEditor() {
        if (!editorContainer || !isMobileView) return false;
        
        if (isEditorCollapsed) {
            openEditor();
        } else {
            closeEditor();
        }
        
        return true; // Handled
    }
    
    // Expose to global scope
    window.toggleEditorPanel = toggleEditor;
    window.isEditorVisible = function() {
        return isMobileView && !isEditorCollapsed;
    };
    window.closeEditorPanel = closeEditor;  // Add this function for external access
})();