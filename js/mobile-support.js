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
    }
    
    function setupMobileLayout() {
        // Hide the side panel by default on mobile
        if (sidePanel) {
            sidePanel.classList.remove('mobile-visible');
        }
        
        // Show mobile menu button
        if (mobileMenuButton) {
            mobileMenuButton.style.display = 'flex';
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
            if (mobileMenuButton) {
                mobileMenuButton.style.display = 'none';
            }
            
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
            
            // Refresh CodeMirror
            if (window.editor) {
                setTimeout(() => {
                    window.editor.refresh();
                }, 100);
            }
        }
    }
    
    function toggleMobileMenu() {
        if (sidePanel && mobileOverlay) {
            sidePanel.classList.toggle('mobile-visible');
            mobileOverlay.classList.toggle('visible');
        }
    }
    
    function closeMobileMenu() {
        if (sidePanel && mobileOverlay) {
            sidePanel.classList.remove('mobile-visible');
            mobileOverlay.classList.remove('visible');
        }
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