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
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.92)', // Nearly opaque dark background
            zIndex: '2000', // Very high z-index to be on top of everything
            display: 'flex',
            flexDirection: 'column',
            transition: 'opacity 0.3s ease',
            opacity: '0',
            visibility: 'hidden', // Initially hidden
            padding: '10px',
            boxSizing: 'border-box'
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
            height: 'calc(100% - 40px)',
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
            // Reversed from previous logic for more intuitive control
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
        // Find the editor container's direct children
        if (!editorPanel) return;
        
        const cmContainer = editorPanel.querySelector('.CodeMirror');
        const hintsPanel = editorPanel.querySelector('.editor-hints');
        
        if (!cmContainer || !hintsPanel) {
            console.error("Could not find CodeMirror or hints panel");
            return;
        }
        
        // Calculate percentages
        const editorPercentage = 100 - hintsPercentage;
        
        // Update heights with !important to override any inline styles
        cmContainer.style.cssText += `height: ${editorPercentage}% !important; width: 100% !important; display: block !important;`;
        hintsPanel.style.cssText += `height: ${hintsPercentage}% !important; width: 100% !important; display: block !important;`;
        
        // Position the resize handle
        if (resizeHandle) {
            // The handle should appear at the boundary between editor and hints
            const editorHeight = editorPanel.clientHeight * (editorPercentage / 100);
            resizeHandle.style.top = `${editorHeight - 16}px`;
        }
        
        // Force CodeMirror to refresh its layout
        if (window.editor) {
            setTimeout(() => window.editor.refresh(), 10);
        }
        
        console.log(`Updated layout - Editor: ${editorPercentage}%, Hints: ${hintsPercentage}%`);
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
        workspace.style.flexDirection = 'column';
        
        // Move editor panel to the new container
        if (editorPanel && editorPanel.parentNode === workspace) {
            // Get the editor wrapper
            const editorWrapper = editorContainer.querySelector('.mobile-editor-wrapper');
            if (!editorWrapper) return;
            
            console.log("Activating mobile layout");
            
            // Make sure editorPanel is visible before moving
            editorPanel.style.display = 'flex';
            
            // Move the editor panel into the wrapper
            editorWrapper.appendChild(editorPanel);
            
            // Add resize handle directly to editor wrapper for absolute positioning
            editorWrapper.appendChild(resizeHandle);
            
            // Set output panel to take full width
            if (outputPanel) {
                outputPanel.style.width = '100%';
            }
            
            // Make sure it's initially hidden
            isEditorCollapsed = true;
            setVisibility(false);
            
            // Make editor panel take full width and height
            editorPanel.style.width = '100%';
            editorPanel.style.height = '100%';
            editorPanel.style.display = 'flex';
            editorPanel.style.flexDirection = 'column';
            
            // Force a layout update to correctly position elements
            setTimeout(updateEditorLayout, 50);
            
            // Update the toggle button state
            updateToggleButtonState(false);
        }
    }
    
    function restoreDesktopLayout() {
        // Restore original layout
        if (editorContainer && editorPanel && editorContainer.contains(editorPanel)) {
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
                workspace.insertBefore(editorPanel, outputPanel);
                
                // Reset editor panel styles
                editorPanel.style.width = '';
                editorPanel.style.height = '';
                editorPanel.style.display = 'flex';
                editorPanel.style.flexDirection = '';
                
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
            workspace.style.flexDirection = '';
            if (outputPanel) {
                outputPanel.style.width = '';
            }
            
            // Reset state
            isEditorCollapsed = true;
            
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
})();