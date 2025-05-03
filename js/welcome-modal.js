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
                                src="https://www.youtube.com/embed/2wzBDQ4Mdl8?si=7DJNqkrSS6_8C5BK" 
                                title="KaleidoScript Examples" 
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

                            <button id="show-prompt-button" class="welcome-button secondary-button">
                                Show AI Visualizer Prompt (Paste into AI then request a visualizer)
                            </button>
                        </div>
                    </div>
                    
                    <div class="welcome-section">
                        <!--h3>Learn More</h3>
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
                        </div-->
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
                        <!--button id="open-block-composer" class="welcome-button secondary-button">
                            Open Block Composer
                        </button-->
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
        const blockComposerButton = document.getElementById('open-block-composer');
        const dontShowCheckbox = document.getElementById('dont-show-welcome');
        const showPromptButton = document.getElementById('show-prompt-button');  // This was missing

        
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

        if (blockComposerButton) {
            blockComposerButton.addEventListener('click', () => {
                this.close();
                setTimeout(() => {
                    if (window.openBlockComposer && typeof window.openBlockComposer === 'function') {
                        window.openBlockComposer();
                    } else {
                        console.error('openBlockComposer function not available');
                    }
                }, 100);
            });
        }
        
        if (dontShowCheckbox) {
            dontShowCheckbox.addEventListener('change', (e) => {
                this.dontShowAgain = e.target.checked;
            });
        }

        if (showPromptButton) {
            showPromptButton.addEventListener('click', () => {
                this.showPromptModal();
            });
        }
    }

    async showPromptModal() {
        // Fetch the prompt template from the file
        let promptText = '';
        try {
            const response = await fetch('prompt-template.txt');
            promptText = await response.text();
        } catch (e) {
            promptText = `You are helping to create a new audio-reactive visualizer for the KaleidoScript app. This app lets users write JavaScript code to draw and animate visualizations that react to music or microphone input. The app provides a set of drawing and audio functions, and each visualizer is a function (or set of functions) that uses these APIs.

    How the App Works:
    
    The main functions are setup() (runs once) and draw(time) (runs every animation frame, with time in ms).
    You can use drawing functions like circle(x, y, radius), rect(x, y, w, h), line(x1, y1, x2, y2), fill(r, g, b, a), stroke(r, g, b, a), and more.
    The canvas size is available as width and height.
    Audio-reactive data is available via:
    audioVolume() – returns the current audio volume (0 to 1).
    audiohz(freq) – returns the amplitude at a specific frequency (e.g., audiohz(60) for bass).
    You can load images with loadImage(path) and audio with loadAudio(path).
    To play audio: playAudio().
    There are built-in visualizer helpers like visualCircular(...), visualBar(...), etc.

    Math functions should have 'Math.' prefix (e.g., Math.sin, Math.cos).
    You can use the built-in color functions like color(r, g, b) and color(r, g, b, a) for RGBA colors.

    You can use the built-in random(min, max) function to generate random numbers.

    You can use the built-in noise(x, y) function to generate Perlin noise.
    You can use the built-in map(value, start1, stop1, start2, stop2) function to map a value from one range to another.
    
    You can also define a const settings = {} object at the top of your code to store easily changeable parameters, such as colors, sizes, or other options. Use these settings throughout your visualizer for easy customization.
    
    Example Visualizer:
    
    const settings = {
        bgColor: [10, 10, 30],
        circleColor: [255, 100, 200, 0.7],
        bassFreq: 60,
        baseRadius: 100,
        radiusScale: 200
    };
    
    function setup() {
        loadAudio("Music/song.mp3");
        playAudio();
    }
    
    function draw(time) {
        background(...settings.bgColor);
        let bass = audiohz(settings.bassFreq);
        fill(...settings.circleColor);
        circle(width/2, height/2, settings.baseRadius + bass * settings.radiusScale);
    }`;
        }
    
        // Add CSS for the prompt modal if it doesn't exist
        if (!document.getElementById('prompt-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'prompt-modal-styles';
            style.textContent = `
                .prompt-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }
                
                .prompt-modal-content {
                    background-color: #202330;
                    color: #fff;
                    width: 80%;
                    max-width: 800px;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                }
                
                .prompt-modal-content h3 {
                    margin-top: 0;
                    color: #61dafb;
                }
                
                #ai-prompt-textarea {
                    background-color: #11121b;
                    color: #f0f0f0;
                    font-family: monospace;
                    border: 1px solid #444;
                    padding: 10px;
                    border-radius: 4px;
                    outline: none;
                }
                
                .prompt-modal .welcome-button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                    border: none;
                    font-weight: bold;
                }
                
                .prompt-modal .primary-button {
                    background-color: #61dafb;
                    color: #202330;
                }
                
                .prompt-modal .secondary-button {
                    background-color: #3d3d3d;
                    color: #ffffff;
                }
            `;
            document.head.appendChild(style);
        }
    
        // Create the modal
        const modal = document.createElement('div');
        modal.className = 'prompt-modal';
        modal.innerHTML = `
            <div class="prompt-modal-content">
                <h3>AI Visualizer Prompt</h3>
                <p>Copy this prompt and paste it into ChatGPT or another AI chatbot, then ask it to create a visualization for you.</p>
                <textarea id="ai-prompt-textarea" style="width:100%;height:300px;resize:vertical;">${promptText}</textarea>
                <div style="margin-top:10px;text-align:right;">
                    <button id="copy-prompt-btn" class="welcome-button primary-button">Copy Prompt</button>
                    <button id="close-prompt-btn" class="welcome-button secondary-button">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    
        // Copy to clipboard
        modal.querySelector('#copy-prompt-btn').onclick = () => {
            const textarea = modal.querySelector('#ai-prompt-textarea');
            textarea.select();
            document.execCommand('copy');
            alert('Prompt copied to clipboard! Paste it into ChatGPT or another AI chatbot.');
        };
    
        // Close modal
        modal.querySelector('#close-prompt-btn').onclick = () => {
            document.body.removeChild(modal);
        };
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
            else {
                localStorage.setItem('kaleidoScript.welcomeShown', 'false');
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