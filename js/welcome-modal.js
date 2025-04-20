/**
 * Welcome Modal for KaleidoScript
 * Shows a welcome message with helpful information for users
 */

class WelcomeModal {
    constructor() {
        this.modalElement = null;
        this.hasShownBefore = localStorage.getItem('kaleidoScript.welcomeShown') === 'true';
        this.dontShowAgain = false;
    }
    
    createModal() {
        // Create the modal element
        const modal = document.createElement('div');
        modal.className = 'welcome-modal';
        modal.id = 'welcome-modal';
        
        // Create the content
        modal.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-header">
                    <h2>Welcome to KaleidoScript!</h2>
                    <button class="welcome-close" id="welcome-close">×</button>
                </div>
                <div class="welcome-body">
                    <div class="welcome-section">
                        <h3>Create Interactive Audio Visualizers</h3>
                        <p>
                            KaleidoScript is a creative coding environment for building awesome audio 
                            visualizations that respond to sound. Whether you're a beginner or an experienced developer,
                            you can create stunning visual effects with just a few lines of code.
                        </p>
                        
                        <div class="youtube-container">
                            <iframe width="560" height="315" 
                                src="https://www.youtube.com/embed/VIDEO_ID" 
                                title="KaleidoScript Tutorial" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                    
                    <div class="welcome-section">
                        <h3>Get Started Quickly</h3>
                        <p>
                            You have two ways to create visualizations:
                        </p>
                        
                        <div class="welcome-features">
                            <div class="feature-card">
                                <h4>Visual Composer</h4>
                                <p>
                                    The easiest way to start! Use the drag-and-drop Visual Composer to build 
                                    visualizers without writing code. Perfect for beginners.
                                </p>
                                <p>
                                    Press <span class="shortcut-key">Ctrl</span> + <span class="shortcut-key">Shift</span> + <span class="shortcut-key">V</span> to open the Visual Composer.
                                </p>
                            </div>
                            
                            <div class="feature-card">
                                <h4>Code Editor</h4>
                                <p>
                                    For advanced users, write custom JavaScript code using our powerful API. Use 
                                    <code>audioHz(frequency)</code> to access audio data and create visualizations 
                                    that respond to sound.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="welcome-section">
                        <h3>Learn More</h3>
                        <p>
                            Check out the tutorials and resources below to learn more about creating visualizations with KaleidoScript:
                        </p>
                        
                        <div class="welcome-links">
                            <a href="https://example.com/tutorial" target="_blank" class="welcome-link">
                                <i class="fas fa-graduation-cap"></i> Beginner Tutorial
                            </a>
                            <a href="https://example.com/api" target="_blank" class="welcome-link">
                                <i class="fas fa-code"></i> API Documentation
                            </a>
                            <a href="https://example.com/examples" target="_blank" class="welcome-link">
                                <i class="fas fa-lightbulb"></i> Example Gallery
                            </a>
                            <a href="https://youtube.com/playlist?list=PLAYLIST_ID" target="_blank" class="welcome-link">
                                <i class="fab fa-youtube"></i> Video Tutorials
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="welcome-footer">
                    <label class="dont-show-again">
                        <input type="checkbox" id="dont-show-welcome">
                        Don't show this again
                    </label>
                    
                    <div class="welcome-buttons">
                        <button id="open-visual-composer" class="welcome-button secondary-button">
                            Open Visual Composer
                        </button>
                        <button id="get-started-button" class="welcome-button primary-button">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modalElement = modal;
        
        // Add event listeners
        this.setupEventListeners();
        
        return modal;
    }
    
    setupEventListeners() {
        const closeButton = document.getElementById('welcome-close');
        const getStartedButton = document.getElementById('get-started-button');
        const visualComposerButton = document.getElementById('open-visual-composer');
        const dontShowCheckbox = document.getElementById('dont-show-welcome');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }
        
        if (getStartedButton) {
            getStartedButton.addEventListener('click', () => this.close());
        }
        
        if (visualComposerButton) {
            visualComposerButton.addEventListener('click', () => {
                this.close();
                setTimeout(() => {
                    if (window.openVisualComposer && typeof window.openVisualComposer === 'function') {
                        window.openVisualComposer();
                    } else {
                        console.error('openVisualComposer function not available');
                    }
                }, 100);
            });
        }
        
        if (dontShowCheckbox) {
            dontShowCheckbox.addEventListener('change', (e) => {
                this.dontShowAgain = e.target.checked;
            });
        }
    }
    
    show() {
        // Create the modal if it doesn't exist yet
        if (!this.modalElement) {
            this.createModal();
        }
        
        // Make sure the modal is in the DOM
        if (!document.getElementById('welcome-modal')) {
            document.body.appendChild(this.modalElement);
        }
        
        // Show the modal with a slight delay for better animation
        setTimeout(() => {
            this.modalElement.classList.add('visible');
        }, 100);
    }
    
    close() {
        if (this.modalElement) {
            this.modalElement.classList.remove('visible');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentNode) {
                    this.modalElement.parentNode.removeChild(this.modalElement);
                }
            }, 300);
            
            // Save preference if user checked "don't show again"
            if (this.dontShowAgain) {
                localStorage.setItem('kaleidoScript.welcomeShown', 'true');
            }
        }
    }
}

// Create a global instance for direct access
window.welcomeModal = new WelcomeModal();

// Add click event to the app title
document.addEventListener('DOMContentLoaded', () => {
    // Add click event to the app title to show welcome screen
    const appTitle = document.querySelector('header h1');
    if (appTitle) {
        // Add a cursor style to indicate it's clickable
        appTitle.style.cursor = 'pointer';
        
        // Add hover effect with CSS
        const style = document.createElement('style');
        style.textContent = `
            header h1 {
                transition: color 0.2s ease, transform 0.2s ease;
            }
            header h1:hover {
                color: #61dafb;
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);
        
        // Add click event
        appTitle.addEventListener('click', () => {
            if (window.welcomeModal) {
                window.welcomeModal.show();
            }
        });
        
        // Add title attribute for tooltip
        appTitle.title = "Click for help & information";
    }
    
    // Initialize after a delay to ensure the application has loaded
    setTimeout(() => {
        // Only show automatically if the user hasn't chosen to hide it
        if (!window.welcomeModal.hasShownBefore) {
            // Only show if the loading screen is gone
            const loadingInterval = setInterval(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (!loadingScreen || loadingScreen.classList.contains('fade-out')) {
                    clearInterval(loadingInterval);
                    window.welcomeModal.show();
                }
            }, 200);
        }
    }, 1000);
});

// Export a function to show the welcome modal from anywhere
window.showWelcomeModal = function() {
    if (window.welcomeModal) {
        window.welcomeModal.show();
    } else {
        window.welcomeModal = new WelcomeModal();
        window.welcomeModal.show();
    }
};