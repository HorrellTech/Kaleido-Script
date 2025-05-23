let loadingSteps = [
    { name: 'Initializing application', weight: 10 },
    { name: 'Loading interface components', weight: 15 },
    { name: 'Setting up renderer', weight: 25 },
    { name: 'Initializing audio system', weight: 20 },
    { name: 'Configuring editor', weight: 20 },
    { name: 'Loading examples', weight: 10 }
];

let currentLoadingStep = 0;
let totalLoadingWeight = loadingSteps.reduce((sum, step) => sum + step.weight, 0);

// Function to update loading progress
function updateLoadingProgress(step, message = null) {
    const progressBar = document.getElementById('loading-progress-bar');
    const loadingText = document.querySelector('.loading-text');
    
    if (!progressBar || !loadingText) return;
    
    // Calculate cumulative weight up to this step
    let cumulativeWeight = 0;
    for (let i = 0; i < step; i++) {
        cumulativeWeight += loadingSteps[i].weight;
    }
    
    // Add half of the current step's weight (showing we're in the middle of this step)
    cumulativeWeight += loadingSteps[step].weight / 2;
    
    // Calculate percentage
    const percentage = (cumulativeWeight / totalLoadingWeight) * 100;
    
    // Update progress bar
    progressBar.style.width = `${percentage}%`;
    
    // Update text if provided
    if (message) {
        loadingText.textContent = message;
    } else {
        loadingText.textContent = loadingSteps[step].name;
    }
    
    currentLoadingStep = step;
}

// Function to hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        // First ensure progress bar is at 100%
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        // Add fade out class
        loadingScreen.classList.add('fade-out');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // First loading step - Initializing application
    updateLoadingProgress(0);
    
    // Set up global console logging function first
    window.logToConsole = function(message, type = 'info') {
        const consoleOutput = document.getElementById('console-output');
        if (!consoleOutput) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `console-${type}`;
        logEntry.textContent = message;
        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    // Loading step 1 - Loading interface components
    setTimeout(() => {
        updateLoadingProgress(1);
        initResolutionSettings();
        
        // Add the global beforeunload event listener
        window.addEventListener('beforeunload', () => {
            // Clean up PixiJS renderer on page unload
            if (globalPixiRendererInstance) {
                try {
                    globalPixiRendererInstance.app.destroy(true);
                    globalPixiRendererInstance = null;
                } catch (err) {
                    console.error('Error cleaning up PixiJS renderer:', err);
                }
            }
        });
        
        // Loading step 2 - Setting up renderer
        setTimeout(() => {
            updateLoadingProgress(2, "Initializing renderer...");
            
            // Initialize renderer first (others will need it)
            const renderer = new Renderer('output-canvas');
            window.renderer = renderer;  // Make it globally accessible
            
            // Initialize interpreter after renderer
            const interpreter = new Interpreter(renderer);
            window.interpreter = interpreter;
            renderer.interpreter = interpreter;
            
            // Loading step 3 - Initializing audio system
            setTimeout(() => {
                updateLoadingProgress(3, "Setting up audio system...");
                
                // Audio initialization happens in the background
                
                // Loading step 4 - Configuring editor
                setTimeout(() => {
                    updateLoadingProgress(4, "Configuring code editor...");
                    
                    // Initialize editor
                    initEditor();
                    
                    try {
                        const fileManager = initFileManager();
                        initResizers();
                        
                        // Loading step 5 - Loading examples
                        setTimeout(() => {
                            updateLoadingProgress(5, "Loading example scripts...");
                            
                            // Check if examples organizer exists before calling
                            if (typeof organizeExamples === 'function') {
                                organizeExamples();
                            } else {
                                console.warn('Examples organizer not found');
                            }
                            
                            // Initialize file system manager if it exists
                            if (typeof FileSystemManager === 'function') {
                                window.fileSystemManager = new FileSystemManager();
                            }
                            
                            // Finally, initialize all remaining UI components
                            setTimeout(() => {
                                initializeUI();
                                
                                // Hide loading screen when everything is ready
                                hideLoadingScreen();
                                
                                logToConsole('KaleidoScript initialized and ready!');
                            }, 500);
                        }, 300);
                    } catch (error) {
                        console.error('Error during initialization:', error);
                        window.logToConsole('Error during initialization: ' + error.message, 'error');
                        hideLoadingScreen();
                    }
                }, 400);
            }, 300);
        }, 300);
    }, 200);
});

// Move all UI initialization code to this function
function initializeUI() {
    // Set up UI controls - with null checks for each element
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');
    const btnRenderImage = document.getElementById('btn-render-image'); 
    const btnRecord = document.getElementById('btn-record');
    const fpsInput = document.getElementById('fps-input');
    const durationInput = document.getElementById('duration-input');
    const exportPNG = document.getElementById('export-png');
    const exportGIF = document.getElementById('export-gif');
    const exportMP4 = document.getElementById('export-mp4');
    const clearConsole = document.getElementById('clear-console');
    const applySettings = document.getElementById('apply-settings');

    // Set up video quality settings UI - with null checks
    const videoQualitySelector = document.getElementById('video-quality');
    const customBitrateDiv = document.querySelector('.custom-bitrate');
    
    if (videoQualitySelector && customBitrateDiv) {
        videoQualitySelector.addEventListener('change', function() {
            if (this.value === 'custom') {
                customBitrateDiv.style.display = 'block';
            } else {
                customBitrateDiv.style.display = 'none';
            }
        });
    }

    // Set up copy embed code button - with null check
    const copyEmbedCodeBtn = document.getElementById('copy-embed-code');
    if (copyEmbedCodeBtn) {
        copyEmbedCodeBtn.addEventListener('click', () => {
            // Get current canvas dimensions
            const width = parseInt(document.getElementById('canvas-width')?.value, 10) || 800;
            const height = parseInt(document.getElementById('canvas-height')?.value, 10) || 600;
            
            // Generate embed code with current dimensions
            const embedCode = `<iframe 
src="path/to/extracted/files/index.html" 
width="${width}" 
height="${height + 50}" 
frameborder="0" 
allowfullscreen
></iframe>`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(embedCode).then(() => {
                // Show success message
                const originalText = copyEmbedCodeBtn.innerHTML;
                copyEmbedCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyEmbedCodeBtn.innerHTML = originalText;
                }, 2000);
                
                if (window.logToConsole) window.logToConsole('Embed code copied to clipboard', 'success');
            }).catch(err => {
                console.error('Failed to copy embed code:', err);
                if (window.logToConsole) window.logToConsole('Failed to copy embed code', 'error');
            });
        });
    }
    
    // Set up audio quality settings UI - with null check
    const audioQualitySelector = document.getElementById('audio-quality');
    const customAudioBitrateDiv = document.querySelector('.custom-audio-bitrate');
    
    if (audioQualitySelector && customAudioBitrateDiv) {
        audioQualitySelector.addEventListener('change', function() {
            if (this.value === 'custom') {
                customAudioBitrateDiv.style.display = 'block';
            } else {
                customAudioBitrateDiv.style.display = 'none';
            }
        });
    }
    
    // Set up tab navigation - with null check
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                if (!tabName) return;
                
                // Deactivate all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                
                // Activate selected tab
                button.classList.add('active');
                const tabContent = document.getElementById(`${tabName}-tab`);
                if (tabContent) tabContent.classList.add('active');
            });
        });
    }
    
    // Toggle side panel collapse/expand - with null check
    const collapseButton = document.getElementById('collapse-button');
    const sidePanel = document.getElementById('side-panel');
    if (collapseButton && sidePanel) {
        collapseButton.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            const icon = collapseButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-left');
                icon.classList.toggle('fa-chevron-right');
            }
        });
    }
    
    // Apply theme change - with null check
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            if (typeof updateEditorTheme === 'function') {
                updateEditorTheme(theme);
            }
        });
    }

    // Add fullscreen button handler - with null check
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn && typeof toggleFullscreen === 'function') {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // Initialize the record button - with null check
    if (btnRecord) {
        // Reset state on page load
        window.isRecording = false;
        window.mediaRecorder = null;
        window.recordedChunks = [];
        
        btnRecord.classList.remove('recording');
        btnRecord.title = 'Record Video';
        
        btnRecord.addEventListener('click', () => {
            console.log('Record button clicked', window.isRecording ? '(recording)' : '(not recording)');
            if (typeof toggleRecording === 'function' && window.renderer) {
                toggleRecording(window.renderer);
            }
        });
        
        // Check if recording is supported
        if (typeof checkRecordingSupport === 'function' && !checkRecordingSupport()) {
            console.warn('Recording not supported, disabling button');
            btnRecord.disabled = true;
            btnRecord.title = 'Recording not supported in this browser';
            btnRecord.style.opacity = '0.5';
        } else {
            console.log('Recording is supported');
        }
    }
    
    // Button event listeners - with null checks
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            try {
                // Make sure we have code to evaluate
                const editorCode = window.editor ? window.editor.getValue() : '';
                if (!editorCode) {
                    window.logToConsole('No code to run', 'warning');
                    return;
                }
                
                // Initialize the interpreter if needed
                if (!window.interpreter) {
                    window.logToConsole('Initializing interpreter...', 'info');
                    if (window.renderer) {
                        window.interpreter = new Interpreter(window.renderer);
                    } else {
                        window.logToConsole('Renderer not available', 'error');
                        return;
                    }
                }

                if (window.renderer) {
                    window.renderer.play();
                }
                
                // Reset the interpreter and evaluate the code
                if (window.interpreter) {
                    // Instead of explicitly stopping audio here, let the reset handle it
                    // and then let the interpreter handle loading/playing audio
                    window.interpreter.reset();
                    const success = window.interpreter.evaluate(editorCode);
                    
                    if (success) {
                        window.logToConsole('Script started successfully', 'success');
                        
                        // We don't need to manually call playAudio here - the interpreter
                        // will handle loading and playing audio if needed
                    } else {
                        window.logToConsole('Script evaluation failed', 'error');
                    }
                }
            } catch (error) {
                console.error('Error starting animation:', error);
                if (window.logToConsole) {
                    window.logToConsole(`Error: ${error.message}`, 'error');
                }
            }
        });
    }
    
    
    // Continue with the rest of the initialization with null checks for each element

    // New render image button (just renders a single frame) - with null check
    if (btnRenderImage && typeof logToConsole === 'function') {
        btnRenderImage.addEventListener('click', () => {
            try {
                logToConsole('Rendering single image...');
                
                // Get editor code
                const editorCode = window.editor ? window.editor.getValue() : '';
                if (!editorCode) {
                    logToConsole('No code to execute', 'warning');
                    return;
                }
                
                // Reset the interpreter
                if (window.interpreter) {
                    window.interpreter.reset();
                    const success = window.interpreter.evaluate(editorCode);
                    
                    if (success && window.renderer) {
                        // Render a single frame at time 0
                        window.renderer.renderFrame(0);
                        logToConsole('Image rendered successfully');
                    } else {
                        logToConsole('Failed to render image', 'error');
                    }
                }
            } catch (error) {
                logToConsole(`Error rendering image: ${error.message}`, 'error');
                console.error(error);
            }
        });
    }
    
    if (btnPause && window.renderer) {
        btnPause.addEventListener('click', () => {
            window.renderer.pause();
            
            // Also pause audio if it's playing
            if (window.audioProcessor && window.audioProcessor.isAudioPlaying) {
                window.audioProcessor.pause();
            }
            
            if (typeof logToConsole === 'function') logToConsole('Animation paused');
        });
    }
    
    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (window.renderer) window.renderer.stop();
            
            // Stop any playing audio
            if (window.audioProcessor) {
                window.audioProcessor.stop();
            }
            
            // Also stop recording if active
            if (window.isRecording && typeof toggleRecording === 'function' && window.renderer) {
                console.log('Stopping recording due to stop button');
                toggleRecording(window.renderer);
            }
            
            if (window.logToConsole) window.logToConsole('Animation stopped');
        });
    }
    
    if (fpsInput && window.renderer) {
        fpsInput.addEventListener('change', () => {
            window.renderer.setFPS(parseInt(fpsInput.value, 10));
        });
    }
    
    if (durationInput && window.renderer) {
        durationInput.addEventListener('change', () => {
            window.renderer.setDuration(parseInt(durationInput.value, 10));
        });
    }

    // Set up the export dropdown functionality properly
    const exportButton = document.getElementById('export-button');
    if (exportButton) {
        // Remove any existing click handlers
        const newButton = exportButton.cloneNode(true);
        exportButton.parentNode.replaceChild(newButton, exportButton);
        
        // Add click handler to the new button
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the dropdown menu
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                // Toggle visibility
                if (dropdownMenu.style.display === 'block') {
                    dropdownMenu.style.display = 'none';
                } else {
                    dropdownMenu.style.display = 'block';
                    
                    // Position it correctly
                    const buttonRect = newButton.getBoundingClientRect();
                    dropdownMenu.style.position = 'absolute';
                    dropdownMenu.style.top = buttonRect.bottom + 'px';
                    dropdownMenu.style.right = '0';
                }
                console.log('Export dropdown visibility:', dropdownMenu.style.display);
            }
        });
        
        // Add document click handler to close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!e.target.matches('#export-button') && !e.target.closest('#export-button')) {
                const dropdownMenu = document.querySelector('.dropdown-menu');
                if (dropdownMenu && dropdownMenu.style.display === 'block') {
                    dropdownMenu.style.display = 'none';
                }
            }
        });
    }
    
    if (exportPNG && typeof exportToPNG === 'function') {
        exportPNG.addEventListener('click', () => exportToPNG(window.renderer));
    }
    
    if (exportGIF && typeof exportToGIF === 'function') {
        exportGIF.addEventListener('click', () => exportToGIF(window.renderer));
    }
    
    if (exportMP4 && typeof exportToMP4 === 'function') {
        exportMP4.addEventListener('click', () => exportToMP4(window.renderer));
    }
    
    const exportHTML5 = document.getElementById('export-html5');
    if (exportHTML5 && typeof exportToHTML5 === 'function') {
        exportHTML5.addEventListener('click', () => exportToHTML5(window.renderer));
    }
    
    if (clearConsole) {
        clearConsole.addEventListener('click', () => {
            const consoleOutput = document.getElementById('console-output');
            if (consoleOutput) consoleOutput.innerHTML = '';
        });
    }
    
    if (applySettings) {
        applySettings.addEventListener('click', () => {
            const widthInput = document.getElementById('canvas-width');
            const heightInput = document.getElementById('canvas-height');
            const width = widthInput ? parseInt(widthInput.value, 10) : 800;
            const height = heightInput ? parseInt(heightInput.value, 10) : 600;
            
            if (window.renderer) window.renderer.resizeCanvas(width, height);

            // Save aspect ratio lock setting
            const lockAspectRatioInput = document.getElementById('lock-aspect-ratio');
            if (lockAspectRatioInput) {
                const lockAspectRatio = lockAspectRatioInput.checked;
                localStorage.setItem('kaleidoScript.lockAspectRatio', lockAspectRatio);
            }
        });
    }
    
    // Handle image import - with null check
    const importImageBtn = document.getElementById('import-image-btn');
    if (importImageBtn && typeof importImage === 'function') {
        importImageBtn.addEventListener('click', () => {
            importImage((image) => {
                if (typeof addImageToLibrary === 'function') addImageToLibrary(image);
            });
        });
    }
    
    // Handle audio import - with null check
    const importAudioBtn = document.getElementById('import-audio-btn');
    if (importAudioBtn && typeof importAudio === 'function') {
        importAudioBtn.addEventListener('click', () => {
            importAudio((audioFile) => {
                if (typeof addAudioToLibrary === 'function') addAudioToLibrary(audioFile);
            });
        });
    }
    
    // Load initial code - with null check
    if (window.fileManager && window.fileManager.files && window.fileManager.files['main.js']) {
        const initialCode = window.fileManager.files['main.js'];
        if (window.editor) {
            window.editor.setValue(initialCode);
            if (typeof updateHints === 'function') updateHints(initialCode);
            if (window.logToConsole) window.logToConsole('Initial script loaded');
        }
    }

    // Fix dropdown menus - with null check
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    if (dropdownToggles && dropdownToggles.length > 0) {
        dropdownToggles.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = button.nextElementSibling;
                if (menu) menu.classList.toggle('show');
            });
        });
    }

    // Close dropdown when clicking outside - with null check
    document.addEventListener('click', () => {
        const dropdownMenus = document.querySelectorAll('.dropdown-menu');
        if (dropdownMenus && dropdownMenus.length > 0) {
            dropdownMenus.forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Check recording support and disable the button if not supported
    if (typeof checkRecordingSupport === 'function' && !checkRecordingSupport() && btnRecord) {
        btnRecord.disabled = true;
        btnRecord.title = 'Recording not supported in this browser';
        btnRecord.style.opacity = '0.5';
    }

    if (typeof initEditorCanvasResizing === 'function') {
        initEditorCanvasResizing();
    }

    // Load settings and initialize renderer
    if (typeof loadSettings === 'function') {
        loadSettings();
    }
    
    console.log('UI initialization completed successfully');
}

// Common resolution presets with their aspect ratios
const resolutionPresets = [
    { name: 'Custom', width: 800, height: 600, ratio: 800/600 },
    { name: 'HD (1280×720)', width: 1280, height: 720, ratio: 16/9 },
    { name: 'Full HD (1920×1080)', width: 1920, height: 1080, ratio: 16/9 },
    { name: '2K (2560×1440)', width: 2560, height: 1440, ratio: 16/9 },
    { name: '4K (3840×2160)', width: 3840, height: 2160, ratio: 16/9 },
    { name: 'Square (800×800)', width: 800, height: 800, ratio: 1/1 },
    { name: 'Instagram (1080×1080)', width: 1080, height: 1080, ratio: 1/1 },
    { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920, ratio: 9/16 },
    { name: 'Twitter (1200×675)', width: 1200, height: 675, ratio: 16/9 },
    { name: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720, ratio: 16/9 },
    { name: 'Banner (1500×500)', width: 1500, height: 500, ratio: 3/1 }
];

// Store current aspect ratio
let currentAspectRatio = 800/600; // Default
let lockAspectRatio = false;

// Initialize resolution settings
function initResolutionSettings() {
    // Get references to form elements
    const resolutionSelect = document.getElementById('resolution-preset');
    const widthInput = document.getElementById('canvas-width');
    const heightInput = document.getElementById('canvas-height');
    const lockRatioCheckbox = document.getElementById('lock-aspect-ratio');
    
    // If elements don't exist, exit early
    if (!resolutionSelect || !widthInput || !heightInput || !lockRatioCheckbox) {
        console.error('Resolution settings elements not found');
        return;
    }
    
    // Populate resolution presets dropdown
    resolutionPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = `${preset.width}x${preset.height}`;
        option.textContent = preset.name;
        resolutionSelect.appendChild(option);
    });
    
    // Set initial aspect ratio based on current width/height
    const currentWidth = parseInt(widthInput.value) || 800;
    const currentHeight = parseInt(heightInput.value) || 600;
    currentAspectRatio = currentWidth / currentHeight;
    
    // Get saved lock ratio preference
    lockAspectRatio = localStorage.getItem('kaleidoScript.lockAspectRatio') === 'true';
    lockRatioCheckbox.checked = lockAspectRatio;
    
    // Event listener for preset selection
    resolutionSelect.addEventListener('change', function() {
        if (this.value === 'custom') return;
        
        const [width, height] = this.value.split('x').map(Number);
        
        if (width && height) {
            widthInput.value = width;
            heightInput.value = height;
            currentAspectRatio = width / height;
        }
    });
    
    // Event listener for width changes
    widthInput.addEventListener('input', function() {
        if (lockAspectRatio) {
            const newWidth = parseInt(this.value) || 0;
            if (newWidth > 0) {
                // Calculate height based on aspect ratio
                const newHeight = Math.round(newWidth / currentAspectRatio);
                heightInput.value = newHeight;
            }
        } else {
            // Update current aspect ratio
            const width = parseInt(this.value) || 0;
            const height = parseInt(heightInput.value) || 0;
            if (width > 0 && height > 0) {
                currentAspectRatio = width / height;
                // Set dropdown to "Custom" when manually changing
                resolutionSelect.value = "custom";
            }
        }
    });
    
    // Event listener for height changes
    heightInput.addEventListener('input', function() {
        if (lockAspectRatio) {
            const newHeight = parseInt(this.value) || 0;
            if (newHeight > 0) {
                // Calculate width based on aspect ratio
                const newWidth = Math.round(newHeight * currentAspectRatio);
                widthInput.value = newWidth;
            }
        } else {
            // Update current aspect ratio
            const width = parseInt(widthInput.value) || 0;
            const height = parseInt(this.value) || 0;
            if (width > 0 && height > 0) {
                currentAspectRatio = width / height;
                // Set dropdown to "Custom" when manually changing
                resolutionSelect.value = "custom";
            }
        }
    });
    
    // Event listener for lock aspect ratio checkbox
    lockRatioCheckbox.addEventListener('change', function() {
        lockAspectRatio = this.checked;
        localStorage.setItem('kaleidoScript.lockAspectRatio', lockAspectRatio);
        
        // Update current aspect ratio when enabling lock
        if (lockAspectRatio) {
            const width = parseInt(widthInput.value) || 0;
            const height = parseInt(heightInput.value) || 0;
            if (width > 0 && height > 0) {
                currentAspectRatio = width / height;
            }
        }
    });
}

function initEditorCanvasResizing() {
    // Get the editor panel and output panel elements
    const editorPanel = document.querySelector('.editor-panel');
    const outputPanel = document.querySelector('.output-panel');
    
    // Check if elements exist
    if (!editorPanel || !outputPanel) return;
    
    // Load saved editor/output proportions or use default (50/50)
    const savedEditorPercent = localStorage.getItem('kaleidoScript.editorPanelPercent') || 50;
    
    // Set initial proportions
    editorPanel.style.flexBasis = `${savedEditorPercent}%`;
    outputPanel.style.flexBasis = `${100 - savedEditorPercent}%`;
    
    // Make sure CodeMirror reflects this
    if (window.editor) {
        setTimeout(() => window.editor.refresh(), 100);
    }
}

document.getElementById('apply-settings').addEventListener('click', () => {
    const width = parseInt(document.getElementById('canvas-width').value, 10) || 800;
    const height = parseInt(document.getElementById('canvas-height').value, 10) || 600;
    const graphicsEngine = document.getElementById('graphics-engine').value;
    
    // Get recording quality settings
    const videoQuality = document.getElementById('video-quality').value;
    const videoBitrate = document.getElementById('video-bitrate').value;
    const audioQuality = document.getElementById('audio-quality').value;
    const audioBitrate = document.getElementById('audio-bitrate').value;
    const recordingCodec = document.getElementById('recording-codec').value;
    
    // Save settings to localStorage
    localStorage.setItem('kaleidoScript.canvasWidth', width);
    localStorage.setItem('kaleidoScript.canvasHeight', height);
    localStorage.setItem('kaleidoScript.graphicsEngine', graphicsEngine);
    localStorage.setItem('kaleidoScript.videoQuality', videoQuality);
    localStorage.setItem('kaleidoScript.videoBitrate', videoBitrate);
    localStorage.setItem('kaleidoScript.audioQuality', audioQuality);
    localStorage.setItem('kaleidoScript.audioBitrate', audioBitrate);
    localStorage.setItem('kaleidoScript.recordingCodec', recordingCodec);
    
    // Reinitialize renderer with new engine if changed
    if (window.renderer && 
        ((graphicsEngine === 'pixi' && !(window.renderer instanceof PixiRenderer)) || 
         (graphicsEngine === 'canvas' && !(window.renderer instanceof Renderer)))) {
        initializeRenderer(graphicsEngine);
    } else {
        // Just resize if the engine didn't change
        window.renderer.resizeCanvas(width, height);
    }
    
    window.logToConsole('Settings applied successfully');
});

function initFileManager() {
    // Check if file manager elements exist
    const fileListElement = document.querySelector('.file-list');
    
    // If no file list is found, create a simplified file manager that works with just main.js
    if (!fileListElement) {
        console.log('Running in simplified mode with only main.js');
        
        // Create a minimal file manager with just the main.js file
        const fileManager = {
            files: { 'main.js': getDefaultCode() },
            currentFile: 'main.js',
            initialize: function() {
                console.log('Initialized simplified file manager');
            },
            saveCurrentFile: function() {
                // Just save the current editor content to our files object
                if (window.editor) {
                    this.files['main.js'] = window.editor.getValue();
                    if (window.logToConsole) {
                        window.logToConsole('Saved main.js');
                    }
                }
            },
            loadFile: function() {
                // Nothing to do in simplified mode
                console.log('Load file operation not supported in simplified mode');
            },
            createNewFile: function() {
                // Nothing to do in simplified mode
                console.log('Create file operation not supported in simplified mode');
            },
            switchFile: function() {
                // Nothing to do in simplified mode
                console.log('Switch file operation not supported in simplified mode');
            }
        };
        
        window.fileManager = fileManager;
        return fileManager;
    }
    
    // Otherwise, create the regular file manager with UI
    const fileManager = new FileManager();
    fileManager.initialize();
    window.fileManager = fileManager;
    
    // Set up file buttons if they exist
    const newFileBtn = document.getElementById('new-file-btn');
    const saveFileBtn = document.getElementById('save-file-btn');
    const loadFileBtn = document.getElementById('load-file-btn');
    
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            const filename = prompt('Enter filename (will add .js if needed):');
            if (filename) {
                fileManager.createNewFile(filename);
            }
        });
    }
    
    if (saveFileBtn) {
        saveFileBtn.addEventListener('click', () => {
            fileManager.saveCurrentFile();
        });
    }
    
    if (loadFileBtn) {
        loadFileBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.ks,.txt,.js';
            input.onchange = (e) => {
                if (e.target.files[0]) {
                    fileManager.loadFile(e.target.files[0]);
                }
            };
            input.click();
        });
    }
    
    return fileManager;
}

function initExampleList() {
    const examplesList = document.querySelector('.examples-list');
    
    // Example snippets
        
    examples.forEach(example => {
        const exampleItem = document.createElement('div');
        exampleItem.className = 'example-item';
        
        const button = document.createElement('button');
        button.className = 'example-button';
        button.textContent = example.name;
        button.onclick = () => {
            if (window.editor) {
                window.editor.setValue(example.code);
                logToConsole(`Loaded example: ${example.name}`);
            }
        };
        
        exampleItem.appendChild(button);
        examplesList.appendChild(exampleItem);
    });
}

// Function to create and initialize the appropriate renderer based on settings
// Global renderer instance store
let globalPixiRendererInstance = null;

function initializeRenderer(engineType = 'canvas') {
    console.log('initializeRenderer called with engineType:', engineType);
    
    // Clean up existing renderer if it exists
    if (window.renderer) {
        console.log('Cleaning up existing renderer');
        try {
            // Handle PixiJS cleanup
            if (window.renderer.destroy && typeof window.renderer.destroy === 'function') {
                window.renderer.destroy();
            } else if (window.renderer.app && typeof window.renderer.app.destroy === 'function') {
                window.renderer.app.destroy(true);
            }
        } catch (err) {
            console.error('Error cleaning up renderer:', err);
        }
        window.renderer = null;
    }
    
    // Get the canvas container
    const canvasContainer = document.querySelector('.canvas-container');
    const oldCanvas = document.getElementById('output-canvas');
    
    // Create a completely new canvas element to avoid context issues
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'output-canvas';
    newCanvas.width = oldCanvas ? oldCanvas.width : 800;
    newCanvas.height = oldCanvas ? oldCanvas.height : 600;
    newCanvas.style.width = oldCanvas ? oldCanvas.style.width : '800px';
    newCanvas.style.height = oldCanvas ? oldCanvas.style.height : '600px';
    
    // Replace the old canvas with the new one
    if (oldCanvas) {
        canvasContainer.replaceChild(newCanvas, oldCanvas);
    } else {
        canvasContainer.appendChild(newCanvas);
    }
    
    console.log('Created new canvas element with ID: output-canvas');
    
    // Create the new renderer based on the selected engine
    try {
        if (engineType === 'pixi') {
            window.logToConsole('Attempting to initialize PixiJS renderer');
            
            // First, verify that PIXI is actually available
            if (typeof PIXI === 'undefined') {
                throw new Error('PixiJS library not found');
            }
            
            // Log PIXI version to help with debugging
            window.logToConsole('Found PIXI version: ' + PIXI.VERSION);
            
            try {
                // Create our standalone PixiJS renderer with the new canvas
                window.renderer = new StandalonePixiRenderer('output-canvas');
                window.logToConsole('Created new PixiJS renderer');
                
                console.log('PixiJS renderer initialized successfully');
            } catch (pixiError) {
                console.error('PixiJS initialization error:', pixiError);
                throw new Error('Failed to initialize PixiJS: ' + pixiError.message);
            }
        } 
        
        // If not PixiJS or if fallback needed, use Canvas renderer
        if (!window.renderer) {
            console.log('Initializing Canvas renderer');
            window.renderer = new Renderer('output-canvas');
            window.logToConsole('Using standard Canvas renderer');
        }
    } catch (error) {
        console.error('Error initializing renderer:', error);
        window.logToConsole('Error initializing ' + engineType + ' renderer: ' + error.message, 'error');
        
        // Fall back to Canvas renderer
        if (!window.renderer) {
            console.log('Falling back to Canvas renderer');
            window.renderer = new Renderer('output-canvas');
            window.logToConsole('Falling back to standard Canvas renderer', 'warning');
            
            // Update the graphics engine dropdown to match
            const engineSelect = document.getElementById('graphics-engine');
            if (engineSelect) engineSelect.value = 'canvas';
            
            // Also update localStorage setting
            localStorage.setItem('kaleidoScript.graphicsEngine', 'canvas');
        }
    }
    
    // Initialize interpreter after renderer
    console.log('Creating new interpreter with the renderer');
    const interpreter = new Interpreter(window.renderer);
    window.interpreter = interpreter;
    window.renderer.interpreter = interpreter;
    
    // CRITICAL FIX: Make sure any existing draw function is preserved and transferred to the new renderer
    if (window.drawFunction) {
        window.renderer.drawFunction = window.drawFunction;
    }
    
    // Restore canvas size from settings
    const width = parseInt(document.getElementById('canvas-width').value, 10) || 800;
    const height = parseInt(document.getElementById('canvas-height').value, 10) || 600;
    window.renderer.resizeCanvas(width, height);
    
    return window.renderer;
}

// Helper functions for importing files
function importImage(callback) {
    // If we have a filesystem manager, use that instead
    if (window.fileSystemManager) {
        window.fileSystemManager.importFile();
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    if (callback) callback({
                        name: file.name,
                        element: img,
                        url: event.target.result
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function importAudio(callback) {
    // If we have a filesystem manager, use that instead
    if (window.fileSystemManager) {
        window.fileSystemManager.importFile();
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (callback) callback({
                    name: file.name,
                    url: event.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function addImageToLibrary(image) {
    const imageList = document.querySelector('.image-list');
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const thumbnail = document.createElement('img');
    thumbnail.src = image.url;
    thumbnail.alt = image.name;
    
    const imageName = document.createElement('div');
    imageName.className = 'image-name';
    imageName.textContent = image.name;
    
    imageItem.appendChild(thumbnail);
    imageItem.appendChild(imageName);
    imageList.appendChild(imageItem);
    
    // Add click event to insert image code at cursor
    imageItem.addEventListener('click', () => {
        if (window.editor) {
            const code = `loadImage("${image.name}")`;
            window.editor.replaceSelection(code);
            logToConsole(`Image ${image.name} inserted`);
        }
    });
    
    logToConsole(`Imported image: ${image.name}`);
}

function addAudioToLibrary(audio) {
    // Get audio list
    const audioList = document.querySelector('.audio-list');
    if (!audioList) return;
    
    // Create a blob URL
    const blob = dataURItoBlob(audio.url);
    const objectURL = URL.createObjectURL(blob);
    
    // Display audio player
    const audioPlayer = document.querySelector('.audio-player');
    if (audioPlayer) {
        audioPlayer.style.display = 'block';
    }
    
    // Set the audio preview
    const audioPreview = document.getElementById('audio-preview');
    if (audioPreview) {
        audioPreview.src = objectURL;
    }
    
    // Create audio item element
    const audioItem = document.createElement('div');
    audioItem.className = 'audio-item';
    audioItem.dataset.filename = audio.name;
    
    const audioIcon = document.createElement('i');
    audioIcon.className = 'fas fa-music';
    
    const audioName = document.createElement('div');
    audioName.className = 'audio-name';
    audioName.textContent = audio.name;
    
    const audioActions = document.createElement('div');
    audioActions.className = 'audio-actions';
    
    const playBtn = document.createElement('button');
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    playBtn.title = 'Play';
    playBtn.onclick = (e) => {
        e.stopPropagation();
        audioPreview.src = objectURL;
        audioPreview.play();
    };
    
    const insertBtn = document.createElement('button');
    insertBtn.innerHTML = '<i class="fas fa-code"></i>';
    insertBtn.title = 'Insert code';
    insertBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.editor) {
            const code = `loadAudio("${audio.name}")`;
            window.editor.replaceSelection(code);
            logToConsole(`Code for audio ${audio.name} inserted`);
        }
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        audioList.removeChild(audioItem);
        if (audioPreview.src === objectURL) {
            audioPreview.src = '';
            audioPreview.pause();
            if (audioPlayer) {
                audioPlayer.style.display = 'none';
            }
        }
        URL.revokeObjectURL(objectURL);
        
        // Remove from interpreter and audioProcessor
        if (window.interpreter && window.interpreter.audioFiles) {
            delete window.interpreter.audioFiles[audio.name];
        }
        if (window.audioProcessor && window.audioProcessor.audioFiles) {
            delete window.audioProcessor.audioFiles[audio.name];
        }
    };
    
    audioActions.appendChild(playBtn);
    audioActions.appendChild(insertBtn);
    audioActions.appendChild(deleteBtn);
    
    audioItem.appendChild(audioIcon);
    audioItem.appendChild(audioName);
    audioItem.appendChild(audioActions);
    
    // Add click event to insert audio code at cursor
    audioItem.addEventListener('click', () => {
        if (window.editor) {
            const code = `loadAudio("${audio.name}");`;
            window.editor.replaceSelection(code);
            logToConsole(`Audio ${audio.name} inserted`);
        }
    });
    
    audioList.appendChild(audioItem);
    
    logToConsole(`Imported audio: ${audio.name}`);
    
    // Make it available for the interpreter
    if (window.interpreter) {
        window.interpreter.registerAudioFile(audio.name, objectURL);
    }
    
    // Register with audioProcessor
    if (window.audioProcessor) {
        window.audioProcessor.audioFiles = window.audioProcessor.audioFiles || {};
        window.audioProcessor.audioFiles[audio.name] = objectURL;
    }
}

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], {type: mimeString});
}

function loadSettings() {
    // Load saved settings or use defaults
    const width = parseInt(localStorage.getItem('kaleidoScript.canvasWidth'), 10) || 800;
    const height = parseInt(localStorage.getItem('kaleidoScript.canvasHeight'), 10) || 600;
    const graphicsEngine = localStorage.getItem('kaleidoScript.graphicsEngine') || 'canvas';
    const theme = localStorage.getItem('kaleidoScript.theme') || 'monokai';
    
    // Load recording quality settings
    const videoQuality = localStorage.getItem('kaleidoScript.videoQuality') || 'medium';
    const videoBitrate = localStorage.getItem('kaleidoScript.videoBitrate') || '5';
    const audioQuality = localStorage.getItem('kaleidoScript.audioQuality') || 'medium';
    const audioBitrate = localStorage.getItem('kaleidoScript.audioBitrate') || '128';
    const recordingCodec = localStorage.getItem('kaleidoScript.recordingCodec') || 'vp8';
    
    // Apply settings to form
    document.getElementById('canvas-width').value = width;
    document.getElementById('canvas-height').value = height;
    document.getElementById('graphics-engine').value = graphicsEngine;
    document.getElementById('theme-select').value = theme;
    
    // Apply recording settings to form
    const videoQualitySelect = document.getElementById('video-quality');
    const audioQualitySelect = document.getElementById('audio-quality');
    const recordingCodecSelect = document.getElementById('recording-codec');
    const customBitrateDiv = document.querySelector('.custom-bitrate');
    const customAudioBitrateDiv = document.querySelector('.custom-audio-bitrate');
    
    if (videoQualitySelect) {
        videoQualitySelect.value = videoQuality;
        if (videoQuality === 'custom' && customBitrateDiv) {
            customBitrateDiv.style.display = 'block';
            document.getElementById('video-bitrate').value = videoBitrate;
        }
    }
    
    if (audioQualitySelect) {
        audioQualitySelect.value = audioQuality;
        if (audioQuality === 'custom' && customAudioBitrateDiv) {
            customAudioBitrateDiv.style.display = 'block';
            document.getElementById('audio-bitrate').value = audioBitrate;
        }
    }
    
    if (recordingCodecSelect) {
        recordingCodecSelect.value = recordingCodec;
    }
    
    // Initialize the appropriate renderer
    initializeRenderer(graphicsEngine);
    
    // Apply theme
    updateEditorTheme(theme);
}

// RECORDING
function toggleRecording(renderer) {
    console.log('Toggle recording called');
    
    const btnRecord = document.getElementById('btn-record');
    if (!btnRecord) {
        console.error('Record button not found');
        return;
    }
    
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
    }
    
    if (!window.isRecording) {
        // First check if we already have audio to record
        let hasAudio = false;
        if (window.audioProcessor && window.audioProcessor.audioElement && 
            window.audioProcessor.audioElement.src) {
            hasAudio = true;
        }

        if (!hasAudio) {
            const proceed = confirm('No audio is loaded. Recording will not include audio. Continue?');
            if (!proceed) {
                return;
            }
        }
        
        // Start recording with a slight delay to ensure all initialization is complete
        console.log('Attempting to start recording');
        
        // Show a preparation message
        window.logToConsole('Preparing to record...', 'info');
        
        // Update button appearance immediately to give user feedback
        btnRecord.classList.add('recording');
        btnRecord.title = 'Stop Recording';
        
        // Add recording indicator
        let indicator = document.getElementById('recording-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'recording-indicator';
            indicator.innerHTML = '<i class="fas fa-circle"></i> REC';
            canvasContainer.appendChild(indicator);
        }
        
        // Use a small delay before actually starting the recording
        // This helps avoid the race condition
        setTimeout(() => {
            const success = startRecording(renderer);
            
            if (success) {
                window.isRecording = true;
                window.logToConsole('Recording started', 'info');
                
                // Make sure the animation is running while recording
                if (renderer && !renderer.isAnimating) {
                    renderer.start();
                }
                
                // Make sure audio is playing if available
                if (hasAudio && window.audioProcessor && 
                    typeof window.audioProcessor.play === 'function' &&
                    !window.audioProcessor.isPlaying) {
                    window.audioProcessor.play();
                }
            } else {
                // Revert UI changes if recording failed
                btnRecord.classList.remove('recording');
                btnRecord.title = 'Record Video';
                
                if (indicator && indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
                
                window.logToConsole('Failed to start recording', 'error');
            }
        }, 200);
    } else {
        // Stop recording
        console.log('Stopping recording');
        
        // We need to be careful here - make sure the recording had time to actually start
        if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
            stopRecording();
            
            // Update button appearance
            btnRecord.classList.remove('recording');
            btnRecord.title = 'Record Video';
            
            // Remove recording indicator
            const indicator = document.getElementById('recording-indicator');
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
            
            window.logToConsole('Recording stopped. Processing video...', 'info');
        } else {
            console.warn('MediaRecorder not in recording state when trying to stop');
            window.logToConsole('Error: Recording was not properly started', 'warning');
            
            // Reset the recording state and UI
            window.isRecording = false;
            btnRecord.classList.remove('recording');
            btnRecord.title = 'Record Video';
            
            const indicator = document.getElementById('recording-indicator');
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }
    }
}

function startRecording(renderer) {
    console.log('Start recording called');
    
    if (!renderer || !renderer.canvas) {
        console.error('No renderer or canvas available');
        return false;
    }
    
    try {
        // Reset any previous recording state
        window.recordedChunks = [];
        
        // Get the canvas stream with appropriate framerate
        const fps = renderer.fps || 30;
        const canvasStream = renderer.canvas.captureStream(fps);
        console.log(`Canvas stream created at ${fps} fps`);
        
        // Get audio stream if available
        let audioStream = null;
        let audioContext = null;
        let audioSource = null;
        
        // Set up audio capture
        if (window.audioProcessor && window.audioProcessor.audioElement && 
            window.audioProcessor.audioElement.src) {
            console.log('Setting up audio stream from audio element');
            
            try {
                // Create audio context if it doesn't exist
                if (!window.audioProcessor.audioContext) {
                    window.audioProcessor.initAudioContext();
                }
                
                // Get the audio context
                audioContext = window.audioProcessor.audioContext;
                
                if (audioContext) {
                    // Create a gain node for the recording (helps with volume control)
                    window.recordingGainNode = audioContext.createGain();
                    window.recordingGainNode.gain.value = 1.0; // Normal volume
                    
                    // Connect the audio source to our recording gain node
                    if (!window.audioProcessor.audioSource) {
                        window.audioProcessor.ensureAudioConnections();
                    }
                    
                    // If we have an audio source, connect it to the recording gain node
                    if (window.audioProcessor.audioSource) {
                        try {
                            audioSource = window.audioProcessor.audioSource;
                            audioSource.connect(window.recordingGainNode);
                            window.recordingGainNode.connect(audioContext.destination);
                            
                            // Get the audio stream from the gain node
                            const audioDestination = audioContext.createMediaStreamDestination();
                            window.recordingGainNode.connect(audioDestination);
                            audioStream = audioDestination.stream;
                            
                            console.log('Audio stream created successfully');
                        } catch (e) {
                            console.error('Error connecting audio for recording:', e);
                        }
                    } else {
                        console.warn('No audio source available for recording');
                    }
                }
            } catch (e) {
                console.error('Error setting up audio for recording:', e);
                window.logToConsole('Could not capture audio for recording', 'warning');
            }
        } else {
            console.log('No audio element or source available for recording');
            window.logToConsole('Recording without audio', 'info');
        }
        
        // Combine video and audio streams
        let combinedStream;
        if (audioStream && audioStream.getAudioTracks().length > 0) {
            const videoTracks = canvasStream.getVideoTracks();
            const audioTracks = audioStream.getAudioTracks();
            combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
            console.log('Combined video and audio streams');
        } else {
            combinedStream = canvasStream;
            console.log('Using video-only stream');
        }
        
        // Get user quality settings
        let videoBitsPerSecond = 5000000; // Default: 5 Mbps
        let audioBitsPerSecond = 128000;  // Default: 128 kbps
        let selectedCodec = 'vp8';        // Default: VP8
        
        // Get video quality setting
        const videoQuality = document.getElementById('video-quality')?.value || 'medium';
        if (videoQuality === 'high') {
            videoBitsPerSecond = 8000000; // 8 Mbps
        } else if (videoQuality === 'low') {
            videoBitsPerSecond = 2500000; // 2.5 Mbps
        } else if (videoQuality === 'custom') {
            const customBitrate = document.getElementById('video-bitrate')?.value || '5';
            videoBitsPerSecond = parseFloat(customBitrate) * 1000000;
        }
        
        // Get audio quality setting
        const audioQuality = document.getElementById('audio-quality')?.value || 'medium';
        if (audioQuality === 'high') {
            audioBitsPerSecond = 256000; // 256 kbps
        } else if (audioQuality === 'low') {
            audioBitsPerSecond = 64000; // 64 kbps
        } else if (audioQuality === 'custom') {
            const customBitrate = document.getElementById('audio-bitrate')?.value || '128';
            audioBitsPerSecond = parseFloat(customBitrate) * 1000;
        }
        
        // Get codec preference
        selectedCodec = document.getElementById('recording-codec')?.value || 'vp8';
        
        // Set up MediaRecorder with appropriate options based on user settings
        const mimeType = getSupportedMimeType(selectedCodec);
        console.log('Using MIME type:', mimeType);
        
        const options = {
            mimeType: mimeType,
            videoBitsPerSecond: videoBitsPerSecond,
            audioBitsPerSecond: audioBitsPerSecond
        };
        
        window.mediaRecorder = new MediaRecorder(combinedStream, options);
        console.log('MediaRecorder created with options:', options);
        window.logToConsole(`Recording with video bitrate: ${Math.round(videoBitsPerSecond/1000000)} Mbps, audio: ${Math.round(audioBitsPerSecond/1000)} kbps`);
        
        // Set up event handlers
        window.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                window.recordedChunks.push(e.data);
                console.log(`Recorded chunk: ${e.data.size} bytes`);
            }
        };
        
        window.mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped, processing video...');
            processRecordedVideo();
        };
        
        window.mediaRecorder.onerror = (e) => {
            console.error('MediaRecorder error:', e);
            window.logToConsole(`Recording error: ${e.error.message}`, 'error');
        };
        
        // Start recording - request data more frequently to avoid missing chunks
        window.mediaRecorder.start(500); // Collect data every 500ms
        console.log('MediaRecorder started');
        
        return true;
    } catch (error) {
        console.error('Error starting recording:', error);
        window.logToConsole(`Error starting recording: ${error.message}`, 'error');
        return false;
    }
}

function stopRecording() {
    console.log('Stop recording called');
    
    if (!window.mediaRecorder) {
        console.error('No media recorder found');
        window.logToConsole('No active recording to stop', 'warning');
        window.isRecording = false;
        return;
    }
    
    try {
        console.log(`Current MediaRecorder state: ${window.mediaRecorder.state}`);
        
        // Request a final data chunk before stopping
        if (window.mediaRecorder.state === 'recording') {
            try {
                // Request the final chunk of data
                window.mediaRecorder.requestData();
                
                // Give the recorder a moment to process before stopping
                setTimeout(() => {
                    console.log('Stopping MediaRecorder after final data request');
                    window.mediaRecorder.stop();
                }, 300);
            } catch (reqError) {
                console.error('Error requesting final data:', reqError);
                // Still try to stop the recorder
                window.mediaRecorder.stop();
            }
        } else if (window.recordedChunks && window.recordedChunks.length > 0) {
            // We have recorded chunks but recorder is not in recording state
            // This might happen if the recorder was stopped by other means
            processRecordedVideo();
        }
        
        window.isRecording = false;
        
        // Clean up event listeners
        if (window.audioProcessor && window.audioProcessor.audioElement) {
            window.audioProcessor.audioElement.removeEventListener('play', window.captureAudioEvent);
            window.audioProcessor.audioElement.removeEventListener('pause', window.captureAudioEvent);
            window.captureAudioEvent = null;
        }
        
        // Clean up gain node if it exists
        if (window.recordingGainNode) {
            try {
                window.recordingGainNode.disconnect();
                window.recordingGainNode = null;
            } catch (e) {
                console.error('Error disconnecting gain node:', e);
            }
        }
    } catch (error) {
        console.error('Error stopping recording:', error);
        window.logToConsole(`Error stopping recording: ${error.message}`, 'error');
    }
}

function processRecordedVideo() {
    console.log(`Processing recorded video with ${window.recordedChunks ? window.recordedChunks.length : 0} chunks`);
    
    if (!window.recordedChunks || window.recordedChunks.length === 0) {
        window.logToConsole('No recorded data available', 'warning');
        return;
    }
    
    try {
        // Check if we have any valid data
        if (!hasValidRecordingData()) {
            window.logToConsole('No valid recording data found', 'error');
            return;
        }
        
        // Create a blob from the recorded chunks
        const blob = new Blob(window.recordedChunks, {
            type: window.mediaRecorder.mimeType || 'video/webm'
        });
        
        // Create object URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Generate a filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `kaleidoscript-recording-${timestamp}.webm`;
        
        // Create a download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Trigger the download
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Reset the recorded chunks
        window.recordedChunks = [];
        
        // Notify the user
        window.logToConsole(`Video saved as ${filename}`, 'info');
    } catch (error) {
        console.error('Error processing video:', error);
        window.logToConsole(`Error processing video: ${error.message}`, 'error');
    }
}

function checkRecordingSupport() {
    // Check for MediaRecorder API
    if (!window.MediaRecorder) {
        console.warn('MediaRecorder API not supported');
        window.logToConsole('Warning: Recording feature is not supported in this browser.', 'warning');
        return false;
    }
    
    // Check for captureStream support on canvas
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.captureStream) {
        console.warn('Canvas captureStream not supported');
        window.logToConsole('Warning: Canvas recording is not supported in this browser.', 'warning');
        return false;
    }
    
    return true;
}

function hasValidRecordingData() {
    if (!window.recordedChunks || window.recordedChunks.length === 0) {
        return false;
    }
    
    // Check if we have any chunks with actual data
    return window.recordedChunks.some(chunk => chunk.size > 0);
}

function ensureAudioSync() {
    // This function ensures audio is properly synchronized with the video recording
    if (window.isRecording) {
        console.log('Ensuring audio sync for recording');
        
        // If we have a recording audio element and it exists, make sure it's in sync with the main audio
        if (window.recordingAudioElement && window.audioProcessor && window.audioProcessor.audioElement) {
            // Set the recording audio element's time to match the main audio element
            const mainAudio = window.audioProcessor.audioElement;
            
            try {
                // If the main audio is playing, make sure recording audio is also playing
                if (!mainAudio.paused) {
                    if (window.recordingAudioElement.paused || 
                        Math.abs(window.recordingAudioElement.currentTime - mainAudio.currentTime) > 0.3) {
                        window.recordingAudioElement.currentTime = mainAudio.currentTime;
                        window.recordingAudioElement.play().catch(e => console.error('Error playing cloned audio:', e));
                    }
                } else {
                    // If main audio is paused, pause the recording audio too
                    if (!window.recordingAudioElement.paused) {
                        window.recordingAudioElement.pause();
                    }
                }
            } catch (e) {
                console.error('Error syncing audio elements:', e);
            }
        }
    }
}

function getSupportedMimeType(preferredCodec = 'vp8') {
    if (!window.MediaRecorder) {
        return null;
    }
    
    // Create codec-specific mime type options
    const mimeTypes = {
        'vp9': [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp9'
        ],
        'vp8': [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp8'
        ],
        'h264': [
            'video/webm;codecs=h264,opus',
            'video/mp4;codecs=h264,aac',
            'video/mp4'
        ]
    };
    
    // First try the preferred codec
    if (preferredCodec && mimeTypes[preferredCodec]) {
        for (const mimeType of mimeTypes[preferredCodec]) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }
    }
    
    // If preferred codec isn't supported, try all options
    const allMimeTypes = [
        // VP8 options (most compatible)
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        // VP9 options (better quality)
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        // H.264 options (hardware acceleration on some devices)
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=h264,aac',
        // Generic fallbacks
        'video/webm',
        'video/mp4'
    ];
    
    for (const mimeType of allMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            console.log(`Found supported mime type: ${mimeType}`);
            return mimeType;
        }
    }
    
    console.warn('No supported MIME type found, using default');
    return 'video/webm';
}