/**
 * Mobile support functionality for KaleidoScript
 */

(function() {
    // Elements
    let mobileMenuButton;
    let sidePanel;
    let mobileOverlay;
    let editorPanel;
    let outputPanel;
    let workspaceEl;
    
    // Initialize mobile support
    function initMobileSupport() {
        mobileMenuButton = document.getElementById('mobile-menu-button');
        sidePanel = document.getElementById('side-panel');
        mobileOverlay = document.getElementById('mobile-overlay');
        editorPanel = document.querySelector('.editor-panel');
        outputPanel = document.querySelector('.output-panel');
        workspaceEl = document.querySelector('.workspace');
        
        // Initial visibility setup
        updateMenuButtonVisibility();
        updateFooterVisibility();
        
        // Check if we're on mobile
        if (window.innerWidth <= 768) {
            setupMobileLayout();
        }
        
        // Add listener for orientation changes and resize
        window.addEventListener('resize', handleResize);
        
        // Add menu button functionality
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', toggleMobileMenu);
        }
        
        // Add overlay click handling
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }
        
        // Add listener for sidebar collapse button to update mobile menu button visibility
        const collapseButton = document.getElementById('collapse-button');
        if (collapseButton) {
            collapseButton.addEventListener('click', function() {
                // Small delay to allow the sidebar animation to complete
                setTimeout(updateMenuButtonVisibility, 100);
            });
        }
    
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            @media (max-width: 768px) {
                #side-panel.mobile-visible {
                    left: 0 !important;
                    visibility: visible !important;
                    transform: translateX(0) !important;
                    z-index: 2000;
                }
                
                #mobile-overlay.visible {
                    display: block;
                    opacity: 1;
                    z-index: 1999;
                }
                
                .mobile-menu-open {
                    overflow: hidden;
                }
    
                .editor-action-buttons {
                    position: absolute;
                    top: 2px;
                    right: 10px;
                    z-index: 100;
                    display: flex;
                    gap: 8px;
                }
                
                .editor-action-btn {
                    background-color: #61dafb;
                    border: none;
                    border-radius: 4px;
                    color: #000;
                    padding: 2px 8px;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                .editor-action-btn:hover {
                    background-color: #4db8e5;
                }
                
                .editor-action-btn i {
                    margin-right: 4px;
                }
            }
        `;
        document.head.appendChild(mobileStyles);
        
        // Add editor toggle button for mobile
        addMobileEditorToggle();
        
        // Add editor action buttons (clear & paste)
        addEditorActionButtons();
    }
    
    function addMobileEditorToggle() {
        if (window.innerWidth > 768) {
            return; // Not mobile
        }
        
        // First, remove any existing mobile toggle buttons
        const existingToggle = document.getElementById('mobile-editor-toggle');
        if (existingToggle) {
            existingToggle.parentNode.removeChild(existingToggle);
        }
        
        // Create toggle button for editor panel
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobile-editor-toggle';
        toggleBtn.className = 'mobile-editor-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-code"></i> Show Editor';
        toggleBtn.title = 'Toggle editor panel';
        
        // Position above the fixed footer
        // Fixed position 50px from bottom to account for footer height
        Object.assign(toggleBtn.style, {
            position: 'fixed',
            bottom: '50px',
            right: '15px',
            zIndex: '1000',
            padding: '8px 12px',
            borderRadius: '20px',
            backgroundColor: '#61dafb',
            color: '#000',
            border: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });
        
        // Add event listener
        toggleBtn.addEventListener('click', toggleEditorPanel);
        
        // Add to document
        document.body.appendChild(toggleBtn);
    }
    
    // Toggle editor panel visibility on mobile
    function toggleEditorPanel() {
        // Use the toggleEditor function from mobile-editor.js if available
        if (typeof window.toggleEditorPanel === 'function') {
            const wasHandled = window.toggleEditorPanel();
            if (wasHandled) return;
        }
        
        // Fallback implementation if mobile-editor.js not loaded or not in mobile view
        if (!editorPanel) return;
        
        // Check current state
        const isVisible = editorPanel.style.display !== 'none';
        
        if (isVisible) {
            // Hide editor panel
            editorPanel.style.display = 'none';
            outputPanel.style.height = 'calc(100vh - 100px)'; // Adjust height to fill available space
            
            // Update toggle button
            const toggleBtn = document.getElementById('mobile-editor-toggle');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-code"></i> Show Editor';
            }
        } else {
            // Show editor panel with full width
            editorPanel.style.display = 'flex';
            editorPanel.style.width = '100%';
            editorPanel.style.height = '40vh'; // Adjust height as needed
            outputPanel.style.height = 'calc(60vh - 100px)';
            
            // Update toggle button
            const toggleBtn = document.getElementById('mobile-editor-toggle');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-code"></i> Hide Editor';
            }
            
            // Force editor to take 100% width by setting inline style
            if (editorPanel.querySelector('.CodeMirror')) {
                editorPanel.querySelector('.CodeMirror').style.width = '100%';
                // force editor to take 100% height minus 30% for the hint box
                editorPanel.querySelector('.CodeMirror').style.height = 'calc(70%)';
            }
            
            // Make sure CodeMirror refreshes
            if (window.editor) {
                setTimeout(() => window.editor.refresh(), 100);
            }
        }
        
        // Force workspace to column layout in mobile
        if (workspaceEl) {
            workspaceEl.style.flexDirection = 'column';
        }
        
        // Update position of editor action buttons
        positionEditorActionButtons();
    }

    function positionEditorActionButtons() {
        const buttonContainer = document.querySelector('.editor-action-buttons');
        if (!buttonContainer) return;
        
        // For mobile-editor.js fullscreen mode
        if (window.isEditorVisible && window.isEditorVisible()) {
            const mobileContainer = document.getElementById('mobile-editor-container');
            if (mobileContainer) {
                const wrapper = mobileContainer.querySelector('.mobile-editor-wrapper');
                if (wrapper) {
                    wrapper.appendChild(buttonContainer);
                    return;
                }
            }
        }
        
        // Default placement in regular editor
        const editorPanel = document.querySelector('.editor-panel');
        if (editorPanel) {
            editorPanel.appendChild(buttonContainer);
        }
    }

    function addEditorActionButtons() {
        // Find the editor container or editor header where we'll place buttons
        const editorContainer = document.querySelector('.editor-panel');
        if (!editorContainer) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'editor-action-buttons';
        
        // Create clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'editor-action-btn';
        clearButton.title = 'Clear editor';
        clearButton.innerHTML = '<i class="fas fa-trash"></i> Clear';
        
        // Create paste button 
        const pasteButton = document.createElement('button');
        pasteButton.className = 'editor-action-btn';
        pasteButton.title = 'Paste from clipboard';
        pasteButton.innerHTML = '<i class="fas fa-paste"></i> Paste';
        
        // Add event listeners
        clearButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear the editor?')) {
                if (window.editor) {
                    window.editor.setValue('');
                }
            }
        });
        
        pasteButton.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                if (window.editor) {
                    window.editor.replaceSelection(text);
                    window.editor.focus();
                }
            } catch (err) {
                console.error('Failed to read clipboard:', err);
                alert('Could not access clipboard. Please check browser permissions.');
            }
        });
        
        // Add buttons to container
        buttonContainer.appendChild(clearButton);
        buttonContainer.appendChild(pasteButton);
        
        // Add container to editor
        editorContainer.appendChild(buttonContainer);
    }
    
    function setupMobileLayout() {
        // Hide the side panel by default on mobile
        if (sidePanel) {
            sidePanel.classList.remove('mobile-visible');
            
            // Show mobile menu button only when sidebar is closed
            if (mobileMenuButton) {
                mobileMenuButton.style.display = 'flex';
            }
        }
        
        // Adjust editor and output panels for mobile
        if (editorPanel && outputPanel && workspaceEl) {
            // Force column layout
            workspaceEl.style.flexDirection = 'column';
            
            // Initially hide the editor panel in mobile view
            editorPanel.style.display = 'none';
            
            // Make editor panel full width when shown
            editorPanel.style.width = '100%';
            editorPanel.style.height = '40vh';
            
            // Make output panel full width
            outputPanel.style.width = '100%';
            outputPanel.style.height = 'calc(100vh - 100px)';
            
            // Force CodeMirror to take full width
            const cmElement = editorPanel.querySelector('.CodeMirror');
            if (cmElement) {
                cmElement.style.width = '100%';
            }
        }
        
        // Add editor toggle button if it doesn't exist
        addMobileEditorToggle();
        
        // Make sure CodeMirror refreshes if editor is visible
        if (window.editor && editorPanel.style.display !== 'none') {
            setTimeout(() => {
                window.editor.refresh();
            }, 100);
        }

        positionEditorActionButtons();
    }
    
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            setupMobileLayout();
            
            // Reposition the toggle button in case footer size changed
            const toggleBtn = document.getElementById('mobile-editor-toggle');
            if (toggleBtn) {
                const footer = document.querySelector('.app-footer');
                const footerHeight = footer ? footer.offsetHeight : 0;
                const bottomMargin = footerHeight + 60; // 60px above the footer
                toggleBtn.style.bottom = bottomMargin + 'px';
            }
        } else {
            // Reset to desktop layout
            if (sidePanel) {
                sidePanel.style.left = '0';
            }
            
            if (mobileOverlay) {
                mobileOverlay.classList.remove('visible');
            }
            
            // Restore desktop layout dimensions
            if (editorPanel && outputPanel && workspaceEl) {
                workspaceEl.style.flexDirection = 'row';
                editorPanel.style.display = 'flex'; // Make sure it's visible
                editorPanel.style.width = '50%';
                editorPanel.style.height = '100%';
                outputPanel.style.width = '50%';
                outputPanel.style.height = '100%';
                
                // Reset CodeMirror width
                const cmElement = editorPanel.querySelector('.CodeMirror');
                if (cmElement) {
                    cmElement.style.width = ''; // Reset to CSS default
                }
            }
            
            // Hide mobile menu button in desktop mode
            if (mobileMenuButton) {
                mobileMenuButton.style.display = 'none';
            }
            
            // Remove toggle button if it exists
            const toggleBtn = document.getElementById('mobile-editor-toggle');
            if (toggleBtn) {
                toggleBtn.parentNode.removeChild(toggleBtn);
            }
            
            // Refresh CodeMirror
            if (window.editor) {
                setTimeout(() => {
                    window.editor.refresh();
                }, 100);
            }
        }
        
        // Update footer visibility
        updateFooterVisibility();

        // Position editor action buttons
        positionEditorActionButtons();
    }

    function updateFooterVisibility() {
        const footer = document.querySelector('.app-footer');
        if (footer) {
            footer.style.display = 'block'; // Always show the footer
        }
    }
    
    function toggleMobileMenu() {
        if (sidePanel && mobileOverlay) {
            // Toggle the 'mobile-visible' class on the side panel 
            const isVisible = sidePanel.classList.toggle('mobile-visible');
            
            // Toggle the 'visible' class on the mobile overlay
            mobileOverlay.classList.toggle('visible');
            
            // Ensure the side panel has the proper inline style to make it visible
            if (isVisible) {
                // Show the panel by setting explicit styles
                sidePanel.style.left = '0';
                sidePanel.style.visibility = 'visible';
                sidePanel.style.transform = 'translateX(0)';
                
                // Add a class to body to prevent scrolling while menu is open
                document.body.classList.add('mobile-menu-open');
            } else {
                // Hide the panel
                sidePanel.style.left = '';
                sidePanel.style.visibility = '';
                sidePanel.style.transform = '';
                
                // Remove the body class
                document.body.classList.remove('mobile-menu-open');
            }
            
            // Hide the menu button when sidebar is visible
            if (mobileMenuButton) {
                mobileMenuButton.style.display = isVisible ? 'none' : 'flex';
            }
        }
    }
    
    function closeMobileMenu() {
        if (sidePanel && mobileOverlay) {
            sidePanel.classList.remove('mobile-visible');
            mobileOverlay.classList.remove('visible');
            
            // Reset panel styles
            sidePanel.style.left = '';
            sidePanel.style.visibility = '';
            sidePanel.style.transform = '';
            
            // Remove the body class
            document.body.classList.remove('mobile-menu-open');
            
            // Show the button again
            if (mobileMenuButton && window.innerWidth <= 768) {
                mobileMenuButton.style.display = 'flex';
            }
        }
    }

    function updateMenuButtonVisibility() {
        if (!mobileMenuButton) return;
        
        const isMobile = window.innerWidth <= 768;
        const isSidebarVisible = sidePanel && sidePanel.classList.contains('mobile-visible');
        
        // Only show the button on mobile AND when sidebar is hidden
        mobileMenuButton.style.display = (isMobile && !isSidebarVisible) ? 'flex' : 'none';
    }
    
    // Check if the toggle button needs repositioning (e.g., on orientation change)
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            const toggleBtn = document.getElementById('mobile-editor-toggle');
            if (toggleBtn) {
                const footer = document.querySelector('.app-footer');
                const footerHeight = footer ? footer.offsetHeight : 0;
                const bottomMargin = footerHeight + 60; // 60px above the footer
                toggleBtn.style.bottom = bottomMargin + 'px';
            }
        }, 300); // Small delay to allow layout to settle
    });
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Delay initialization slightly to ensure other components are loaded
        setTimeout(initMobileSupport, 500);
    });
    
    // Make functions available globally
    window.mobileSupport = {
        init: initMobileSupport,
        toggleMenu: toggleMobileMenu,
        toggleEditor: toggleEditorPanel
    };
})();