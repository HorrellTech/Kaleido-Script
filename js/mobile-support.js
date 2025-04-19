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
        if (editorPanel && outputPanel) {
            editorPanel.style.height = '40vh';
            outputPanel.style.height = 'auto';
        }
        
        // Make sure CodeMirror refreshes
        if (window.editor) {
            setTimeout(() => {
                window.editor.refresh();
            }, 100);
        }
    }
    
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            setupMobileLayout();
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
                editorPanel.style.width = '50%';
                editorPanel.style.height = '100%';
                outputPanel.style.width = '50%';
            }
            
            // Hide mobile menu button in desktop mode
            if (mobileMenuButton) {
                mobileMenuButton.style.display = 'none';
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
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Delay initialization slightly to ensure other components are loaded
        setTimeout(initMobileSupport, 500);
    });
    
    // Make functions available globally
    window.mobileSupport = {
        init: initMobileSupport,
        toggleMenu: toggleMobileMenu
    };
})();