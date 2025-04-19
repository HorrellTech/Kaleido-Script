class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id '${canvasId}' not found`);
            return;
        }
    
        this.context = this.canvas.getContext('2d');
        this.isRunning = false;
        this.fps = 30;
        this.duration = 0; // 0 means infinite
        this.startTime = 0;
        this.animationFrame = null;
        this.drawFunction = null;
        this.interpreter = null;
        
        // Set initial canvas size
        this.resizeCanvas(800, 600);
        
        // Add a Canvas indicator 
        //this.addRendererIndicator();
    }

    addRendererIndicator() {
        // Remove any existing indicator
        const existingIndicator = document.querySelector('.renderer-indicator');
        if (existingIndicator) {
            existingIndicator.parentNode.removeChild(existingIndicator);
        }
        
        // Create a new indicator
        const indicator = document.createElement('div');
        indicator.className = 'renderer-indicator canvas';
        indicator.textContent = 'Canvas';
        indicator.title = 'Using Standard Canvas Renderer';
        
        // Style the indicator
        indicator.style.position = 'absolute';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(33, 150, 243, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '4px 8px';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '1000';
        
        // Add to canvas container
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            canvasContainer.appendChild(indicator);
        }
    }
    
    resizeCanvas(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Adjust canvas display size if needed
        const maxWidth = this.canvas.parentElement.clientWidth - 20;
        const maxHeight = this.canvas.parentElement.clientHeight - 20;
        
        const scale = Math.min(
            maxWidth / width,
            maxHeight / height
        );
        
        if (scale < 1) {
            this.canvas.style.width = `${width * scale}px`;
            this.canvas.style.height = `${height * scale}px`;
        } else {
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
        }
    }
    
    setFPS(fps) {
        this.fps = fps;
    }
    
    setDuration(duration) {
        this.duration = duration;
    }
    
    start() {
        if (this.isRunning) {
            console.log("Animation already running, not starting again");
            return;
        }
        
        // Setup is now called by the interpreter's evaluate method
        // We don't need to call it again here
        
        this.isRunning = true;
        this.startTime = performance.now() / 1000;
        this.animate();
        
        if (window.logToConsole) {
            window.logToConsole('Animation started');
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    stop() {
        this.pause();
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    play() {
        try {
            // Get editor code
            const editorCode = window.editor ? window.editor.getValue() : '';
            if (!editorCode) {
                if (window.logToConsole) {
                    window.logToConsole('No code to execute', 'warning');
                }
                return;
            }
            
            // Initialize the interpreter if it doesn't exist
            if (!this.interpreter) {
                if (window.interpreter) {
                    this.interpreter = window.interpreter;
                } else {
                    this.interpreter = new Interpreter(this);
                    window.interpreter = this.interpreter;
                }
            }
            
            // Reset the interpreter and evaluate the code
            this.interpreter.reset();
            const success = this.interpreter.evaluate(editorCode);
            
            if (success) {
                if (window.logToConsole) {
                    window.logToConsole('Code evaluated successfully');
                }
                
                // Start the animation
                this.start();
                
                // Debug - verify the drawFunction is set
                if (this.drawFunction) {
                    console.log('Draw function available and will be used for animation');
                } else {
                    console.error('Draw function is not available after evaluation');
                    if (window.logToConsole) {
                        window.logToConsole('Draw function not found. Animation may not work properly.', 'warning');
                    }
                }
            } else {
                if (window.logToConsole) {
                    window.logToConsole('Failed to evaluate code', 'error');
                }
            }
        } catch (error) {
            console.error("Error executing code:", error);
            if (window.logToConsole) {
                window.logToConsole(`Error: ${error.message}`, 'error');
            }
        }
    }
    
    setCode(code) {
        if (!window.interpreter) {
            // Interpreter not initialized yet, log a warning
            console.warn("Interpreter not initialized, code cannot be evaluated yet.");
            return;
        }
        
        if (!this.interpreter && window.interpreter) {
            this.interpreter = window.interpreter;
        }
        
        try {
            this.interpreter.reset();
            this.interpreter.evaluate(code);
        } catch (error) {
            console.error("Error setting code:", error);
            logToConsole(`Error: ${error.message}`, 'error');
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - this.startTime;
        
        // Check if we've exceeded the duration (if set)
        if (this.duration > 0 && elapsedTime >= this.duration) {
            this.pause();

            // Auto-stop recording if it's active when animation ends
            if (window.isRecording && window.mediaRecorder) {
                toggleRecording(this);
            }
            return;
        }
    
        if (this.interpreter) {
            this.interpreter.updateFps();
        }
    
        // Only clear if auto-clear isn't disabled (needed for motion blur)
        if (!window.disableAutoClear) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw the user's animation frame
        if (typeof this.drawFunction === 'function') {
            try {
                this.drawFunction(elapsedTime);
            } catch (error) {
                console.error("Error in draw function:", error);
                if (window.logToConsole) {
                    window.logToConsole(`Error: ${error.message}`, 'error');
                }
                this.pause();
            }
        }
        
        // Apply motion blur if active (must be done after drawing)
        if (this.interpreter && this.interpreter.motionBlurActive) {
            this.interpreter.applyMotionBlur();
        }

        // Show a watermark
        this.context.font = '12px Arial';
        this.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.context.textAlign = 'left';
        this.context.textBaseline = 'bottom';
        this.context.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.context.shadowBlur = 2;
        this.context.shadowOffsetX = 1;
        this.context.shadowOffsetY = 1;
        this.context.fillText('Kaleido-Script - JavaScript based Animation and Audio Visualization', 10, this.canvas.height - 10);
        // Reset shadow properties after drawing text
        this.context.shadowColor = 'transparent';
        this.context.shadowBlur = 0;
        this.context.shadowOffsetX = 0;
        this.context.shadowOffsetY = 0;
        
        // Schedule the next frame
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    // Remove the duplicate renderFrame logic or make it just call into the draw function
    renderFrame() {
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - this.startTime;
        
        if (this.duration > 0 && elapsedTime >= this.duration) {
            this.pause();
            return;
        }
        
        if (this.interpreter) {
            this.interpreter.updateFps();
        }
        
        // Clear graphics and text container if auto-clear is not disabled
        if (!window.disableAutoClear) {
            this.graphics.clear();
            while (this.textContainer.children.length > 0) {
                this.textContainer.removeChildAt(0);
            }
            this.currentPath = [];
            this.pathStarted = false;
        }
        
        // Use the draw function from either this renderer or global storage
        const drawFn = this.drawFunction || window.drawFunction;
        if (typeof drawFn === 'function') {
            try {
                drawFn(elapsedTime);
            } catch (error) {
                console.error("Error in draw function:", error);
                if (window.logToConsole) {
                    window.logToConsole(`Error: ${error.message}`, 'error');
                }
                this.pause();
            }
        } else {
            console.warn("No draw function available");
        }
    }

    logToConsole(message, type = 'info') {
        const consoleOutput = document.getElementById('console-output');
        if (!consoleOutput) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `console-${type}`;
        
        // Check if message contains error with line/column information
        if (type === 'error' && message.includes('Error:')) {
            // Try to extract line and column info from error message
            const lineMatch = message.match(/line (\d+)/i);
            const colMatch = message.match(/column (\d+)/i) || message.match(/position (\d+)/i);
            
            if (lineMatch || colMatch) {
                const lineInfo = lineMatch ? `Line ${lineMatch[1]}` : '';
                const colInfo = colMatch ? `Col ${colMatch[1]}` : '';
                const position = [lineInfo, colInfo].filter(Boolean).join(', ');
                
                if (position) {
                    message = `${message} (${position})`;
                }
            }
        }
        
        logEntry.textContent = message;
        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}
