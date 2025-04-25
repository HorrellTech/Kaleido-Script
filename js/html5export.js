// HTML5 Export Module
// This module provides functionality to export the current visualization as a standalone HTML5 package

/**
 * Export the current animation as a ZIP package containing HTML5 player and assets
 * @param {Renderer} renderer - The current renderer
 */
function exportToHTML5(renderer) {
    try {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library is required for HTML5 export');
        }

        showExportProgress('Preparing HTML5 export...', true);

        // Create a new ZIP file
        const zip = new JSZip();
        
        // Get the current script and renderer settings
        const scriptCode = window.editor ? window.editor.getValue() : '';
        const width = renderer.canvas.width;
        const height = renderer.canvas.height;
        
        if (!scriptCode) {
            throw new Error('No script code found to export');
        }
        
        // Assets to collect
        const assets = {
            images: [],
            audio: []
        };
        
        // Create the HTML template
        collectAssets(scriptCode, assets)
            .then(() => {
                // Update progress
                updateExportProgress(20);
                showExportProgress('Creating HTML5 package...');
                
                // Add core files to zip
                const html = createHTML5Template(scriptCode, width, height);
                zip.file('index.html', html);
                
                // Add visualizer, interpreter and renderer as separate files
                zip.file('js/visualizer.js', getVisualizerCode());
                zip.file('js/interpreter.js', getInterpreterCode());
                zip.file('js/renderer.js', getRendererCode());
                
                // Add assets with progress updates
                let processed = 0;
                const totalAssets = assets.images.length + assets.audio.length;
                
                // Add a small CSS file
                zip.file('css/player.css', getPlayerCssCode());
                
                // Process assets and show progress
                const processPromises = [];
                
                // Process image assets
                assets.images.forEach(image => {
                    const promise = getFileFromSource(image.source)
                        .then(blob => {
                            zip.file(`assets/images/${image.filename}`, blob);
                            processed++;
                            updateExportProgress(20 + Math.floor((processed / totalAssets) * 70));
                        })
                        .catch(err => {
                            console.warn(`Failed to process image asset: ${image.filename}`, err);
                        });
                    processPromises.push(promise);
                });
                
                // Process audio assets
                assets.audio.forEach(audio => {
                    const promise = getFileFromSource(audio.source)
                        .then(blob => {
                            zip.file(`assets/audio/${audio.filename}`, blob);
                            processed++;
                            updateExportProgress(20 + Math.floor((processed / totalAssets) * 70));
                        })
                        .catch(err => {
                            console.warn(`Failed to process audio asset: ${audio.filename}`, err);
                        });
                    processPromises.push(promise);
                });
                
                return Promise.all(processPromises);
            })
            .then(() => {
                // Update progress
                updateExportProgress(90);
                showExportProgress('Generating ZIP file...');
                
                // Generate the ZIP file
                return zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                });
            })
            .then(blob => {
                // Download the ZIP file
                updateExportProgress(100);
                showExportProgress('Export complete!');
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'kaleido-animation.zip';
                link.click();
                
                // Clean up
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                    hideExportProgress();
                }, 2000);
            })
            .catch(err => {
                hideExportProgress();
                window.logToConsole(`HTML5 export failed: ${err.message}`, 'error');
                alert(`Export failed: ${err.message}`);
                console.error('HTML5 export error:', err);
            });
    } catch (error) {
        hideExportProgress();
        window.logToConsole(`HTML5 export failed: ${error.message}`, 'error');
        alert(`Export failed: ${error.message}`);
        console.error('HTML5 export error:', error);
    }
}

/**
 * Helper function to get code from visualizers.js
 * @returns {string} Visualizer code
 */
function getVisualizerCode() {
    // This would fetch or reference the actual visualizers.js content
    // For this implementation, we'll assume there's a global reference or fetch
    if (window.visualizerCode) {
        return window.visualizerCode;
    }
    
    // Fetch visualizer.js if not already available
    return fetch('js/visualizers.js')
        .then(response => response.text())
        .catch(error => {
            console.error('Failed to load visualizer.js', error);
            return '// Visualizer code could not be loaded';
        });
}

/**
 * Helper function to get code from interpreter.js
 * @returns {string} Interpreter code
 */
function getInterpreterCode() {
    // Similar to visualizer code retrieval
    if (window.interpreterCode) {
        return window.interpreterCode;
    }
    
    return fetch('js/interpreter.js')
        .then(response => response.text())
        .catch(error => {
            console.error('Failed to load interpreter.js', error);
            return '// Interpreter code could not be loaded';
        });
}

/**
 * Helper function to get code from renderer.js
 * @returns {string} Renderer code
 */
function getRendererCode() {
    // Similar to visualizer code retrieval
    if (window.rendererCode) {
        return window.rendererCode;
    }
    
    return fetch('js/renderer.js')
        .then(response => response.text())
        .catch(error => {
            console.error('Failed to load renderer.js', error);
            return '// Renderer code could not be loaded';
        });
}

/**
 * Get CSS code for the player
 * @returns {string} CSS code
 */
function getPlayerCssCode() {
    return `
        body {
            margin: 0;
            padding: 0;
            background-color: #0f0f0f;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        
        .player-container {
            position: relative;
        }
        
        canvas {
            display: block;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .player-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            padding: 0 15px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .player-container:hover .player-controls {
            opacity: 1;
        }
        
        .control-button {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 5px 10px;
            margin-right: 5px;
        }
        
        .control-button:hover {
            color: #61dafb;
        }
        
        .player-info {
            color: white;
            margin-left: auto;
            font-size: 12px;
        }
        
        .loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1e1e2e;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(97, 218, 251, 0.3);
            border-radius: 50%;
            border-top-color: #61dafb;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
}

// Create HTML5 template for the standalone player
function createHTML5Template(scriptCode, width, height) {
    // Generate a unique ID for the player
    const playerId = 'kp_' + Math.random().toString(36).substr(2, 9);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KaleidoScript Animation</title>
    <link rel="stylesheet" href="css/player.css">
</head>
<body>
    <div class="player-container" id="${playerId}">
        <canvas width="${width}" height="${height}" id="${playerId}_canvas"></canvas>
        <div class="player-controls">
            <button class="control-button" id="${playerId}_play_pause">⏯️</button>
            <button class="control-button" id="${playerId}_reset">🔄</button>
            <div class="player-info">KaleidoScript Animation</div>
        </div>
        <div class="loading-screen" id="${playerId}_loading">
            <div class="loading-spinner"></div>
            <p>Loading animation...</p>
        </div>
    </div>

    <script src="js/visualizer.js"></script>
    <script src="js/interpreter.js"></script>
    <script src="js/renderer.js"></script>
    
    <script>
    // KaleidoScript Player
    (function() {
        // User script
        const userScript = \`${scriptCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
        
        // Initialize player
        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('${playerId}_canvas');
            const loadingScreen = document.getElementById('${playerId}_loading');
            const playPauseBtn = document.getElementById('${playerId}_play_pause');
            const resetBtn = document.getElementById('${playerId}_reset');
            
            // Initialize renderer
            const renderer = new Renderer(canvas);
            
            // Initialize interpreter
            const interpreter = new Interpreter(userScript, renderer);
            
            // Load assets and start
            interpreter.initialize()
                .then(() => {
                    // Hide loading screen
                    loadingScreen.style.display = 'none';
                    
                    // Start renderer
                    renderer.start();
                    
                    // Setup controls
                    playPauseBtn.addEventListener('click', () => {
                        if (renderer.isRunning) {
                            renderer.pause();
                            playPauseBtn.textContent = '▶️';
                        } else {
                            renderer.start();
                            playPauseBtn.textContent = '⏸️';
                        }
                    });
                    
                    resetBtn.addEventListener('click', () => {
                        interpreter.reset();
                    });
                })
                .catch(error => {
                    console.error('Error initializing animation:', error);
                    loadingScreen.innerHTML = '<p>Error loading animation</p>';
                });
        });
    })();
    </script>
</body>
</html>`;
}

// All remaining helper functions from export.js would go here