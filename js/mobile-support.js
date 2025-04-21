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
        
        // Add editor toggle button for mobile
        addMobileEditorToggle();
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
        
        // Calculate footer height for proper positioning
        const footer = document.querySelector('.app-footer');
        const footerHeight = footer ? footer.offsetHeight : 0;
        const bottomMargin = footerHeight + 60; // 60px above the footer for better visibility
        
        // Style the button
        Object.assign(toggleBtn.style, {
            position: 'fixed',
            bottom: bottomMargin + 'px', // Position well above the footer
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
    }

    function updateFooterVisibility() {
        const footer = document.querySelector('.app-footer');
        if (footer) {
            footer.style.display = 'block'; // Always show the footer
        }
    }
    
    function toggleMobileMenu() {
        if (sidePanel && mobileOverlay) {
            const isVisible = sidePanel.classList.toggle('mobile-visible');
            mobileOverlay.classList.toggle('visible');
            
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