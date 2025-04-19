/**
 * PixiRenderer - A PixiJS adapter for the KaleidoScript graphics system
 * This adapter implements the Canvas API used in the interpreter but uses PixiJS/WebGL
 * 
 * DO NOT USE THIS VERSION! USE STAND ALONE PIXI RENDERER INSTEAD.
 * This version is for reference only and may not work as expected.
 */
class PixiRenderer {
    constructor(canvasId, options = {}) {
        window.logToConsole('Initializing PixiJS renderer');
        
        try {
            // Check if PIXI is available
            if (typeof PIXI === 'undefined') {
                throw new Error('PixiJS library not available');
            }
            
            this.canvasId = canvasId;
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }
            
            // Define renderer options with safe defaults
            const rendererOptions = {
                view: this.canvas,
                width: this.canvas.width || 800,
                height: this.canvas.height || 600,
                backgroundColor: 0x000000,
                antialias: true,
                transparent: false,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                // Don't force Canvas - let PIXI decide if WebGL is available
                forceCanvas: false,
                // Use legacy mode for more stable behavior
                legacy: true
            };
            
            // In PixiJS v5, this is more reliable for detecting WebGL support
            const isWebGLSupported = PIXI.utils.isWebGLSupported();
            console.log('WebGL support check:', isWebGLSupported);
            
            if (!isWebGLSupported) {
                console.warn('WebGL not supported by browser, forcing Canvas mode');
                rendererOptions.forceCanvas = true;
            }
            
            // Clear existing renderer if needed
            if (globalPixiRendererInstance && globalPixiRendererInstance !== this) {
                try {
                    globalPixiRendererInstance.app.destroy(true);
                } catch (e) {
                    console.error('Error cleaning up previous renderer:', e);
                }
                globalPixiRendererInstance = null;
            }
            
            // Create the application
            console.log('Creating PIXI Application with options:', rendererOptions);
            this.app = new PIXI.Application(rendererOptions);
            
            // Register this instance globally for reuse
            globalPixiRendererInstance = this;
            
            // Log renderer type
            const rendererType = this.app.renderer.type;
            if (rendererType === PIXI.RENDERER_TYPE.WEBGL) {
                console.log('Successfully created WebGL renderer');
                window.logToConsole('Using WebGL renderer');
            } else if (rendererType === PIXI.RENDERER_TYPE.WEBGL2) {
                console.log('Successfully created WebGL2 renderer');
                window.logToConsole('Using WebGL2 renderer');
            } else {
                console.log('Using Canvas renderer');
                window.logToConsole('Using Canvas renderer (WebGL unavailable)', 'warning');
            }
            
            // Rest of your initialization
            this.graphics = new PIXI.Graphics();
            this.app.stage.addChild(this.graphics);
            
            this.textContainer = new PIXI.Container();
            this.app.stage.addChild(this.textContainer);
            
            // Rest of existing code...
        } catch (err) {
            console.error('Error initializing PixiRenderer:', err);
            throw err;
        }
    }

    // Make sure the render indicator implementation is complete
    addRendererIndicator() {
        // Remove any existing indicator
        const existingIndicator = document.querySelector('.renderer-indicator');
        if (existingIndicator) {
            existingIndicator.parentNode.removeChild(existingIndicator);
        }
        
        // Create a new indicator
        const indicator = document.createElement('div');
        indicator.className = 'renderer-indicator pixi';
        
        // Determine the actual renderer type
        let rendererType = 'Canvas';
        let color = 'rgba(33, 150, 243, 0.7)'; // Blue for Canvas
        
        if (this.app && this.app.renderer) {
            // Check for both v6 and v7 constants
            const WEBGL_TYPE = PIXI.RENDERER_TYPE ? PIXI.RENDERER_TYPE.WEBGL : 1;
            const WEBGL2_TYPE = PIXI.RENDERER_TYPE ? PIXI.RENDERER_TYPE.WEBGL2 : 2;
            
            if (this.app.renderer.type === WEBGL2_TYPE) {
                rendererType = 'WebGL2';
                color = 'rgba(76, 175, 80, 0.7)'; // Green for WebGL2
            } else if (this.app.renderer.type === WEBGL_TYPE) {
                rendererType = 'WebGL';
                color = 'rgba(76, 175, 80, 0.7)'; // Green for WebGL
            }
        }
        
        indicator.textContent = rendererType;
        indicator.title = `Using PixiJS ${rendererType} Renderer`;
        
        // Style the indicator
        indicator.style.position = 'absolute';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = color;
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
    
    createContextCompatibilityLayer() {
        // Create a compatibility layer that mimics the Canvas 2D context
        const context = {
            canvas: this.canvas,
            fillStyle: '#FFFFFF',
            strokeStyle: '#FFFFFF',
            lineWidth: 1,
            globalAlpha: 1, 
            globalCompositeOperation: 'source-over',
            shadowBlur: 0,
            shadowColor: '#000000',
            font: '16px Arial',
            textAlign: 'left',
            textBaseline: 'alphabetic',
            
            // Clear all graphics
            clearRect: (x, y, width, height) => {
                this.graphics.clear();
                
                // Also clear text container
                while (this.textContainer.children.length > 0) {
                    this.textContainer.removeChildAt(0);
                }
                
                // Clear any stored paths
                this.currentPath = [];
                this.pathStarted = false;
            },
            
            // Fill rectangle
            fillRect: (x, y, width, height) => {
                this.graphics.beginFill(this.hexColorToNumber(context.fillStyle), context.globalAlpha);
                this.graphics.drawRect(x, y, width, height);
                this.graphics.endFill();
            },
            
            // Stroke rectangle
            strokeRect: (x, y, width, height) => {
                this.graphics.lineStyle(context.lineWidth, this.hexColorToNumber(context.strokeStyle), context.globalAlpha);
                this.graphics.drawRect(x, y, width, height);
            },
            
            // Begin a new path
            beginPath: () => {
                this.currentPath = [];
                this.pathStarted = true;
                this.graphics.lineStyle(
                    context.lineWidth, 
                    this.hexColorToNumber(context.strokeStyle),
                    context.globalAlpha
                );
            },
            
            // Move to a point (start a subpath)
            moveTo: (x, y) => {
                if (!this.pathStarted) {
                    context.beginPath();
                }
                this.currentPath.push({ type: 'moveTo', x, y });
                this.graphics.moveTo(x, y);
            },
            
            // Draw line to a point
            lineTo: (x, y) => {
                if (!this.pathStarted) {
                    context.beginPath();
                    context.moveTo(x, y);
                    return;
                }
                this.currentPath.push({ type: 'lineTo', x, y });
                this.graphics.lineTo(x, y);
            },
            
            // Draw an arc
            arc: (x, y, radius, startAngle, endAngle, counterclockwise = false) => {
                if (!this.pathStarted) {
                    context.beginPath();
                }
                
                this.currentPath.push({ 
                    type: 'arc', 
                    x, y, radius, startAngle, endAngle, counterclockwise 
                });
                
                // Full circle optimization
                if (Math.abs(endAngle - startAngle) >= Math.PI * 2) {
                    this.graphics.drawCircle(x, y, radius);
                } else {
                    // Handle arcs - PixiJS arc uses different parameters
                    this.graphics.arc(
                        x, y, 
                        radius, 
                        startAngle, 
                        endAngle,
                        counterclockwise
                    );
                }
            },
            
            // Fill the current path
            fill: () => {
                if (!this.pathStarted) return;
                
                this.graphics.beginFill(
                    this.hexColorToNumber(context.fillStyle), 
                    context.globalAlpha
                );
                
                // Redraw the path for filling
                this.redrawCurrentPath();
                
                this.graphics.endFill();
            },
            
            // Stroke the current path
            stroke: () => {
                if (!this.pathStarted) return;
                
                this.graphics.lineStyle(
                    context.lineWidth,
                    this.hexColorToNumber(context.strokeStyle),
                    context.globalAlpha
                );
                
                // Redraw the path for stroking (if not already drawn)
                this.redrawCurrentPath();
            },
            
            // Close the current path
            closePath: () => {
                if (!this.pathStarted) return;
                this.currentPath.push({ type: 'closePath' });
                this.graphics.closePath();
            },
            
            // Draw text
            fillText: (text, x, y) => {
                const style = new PIXI.TextStyle({
                    fontFamily: this.extractFontFamily(context.font),
                    fontSize: this.extractFontSize(context.font),
                    fill: context.fillStyle,
                    align: context.textAlign
                });
                
                const textSprite = new PIXI.Text(text, style);
                textSprite.x = x;
                textSprite.y = y;
                textSprite.alpha = context.globalAlpha;
                
                // Handle text alignment
                if (context.textAlign === 'center') {
                    textSprite.anchor.x = 0.5;
                } else if (context.textAlign === 'right') {
                    textSprite.anchor.x = 1;
                }
                
                // Handle baseline alignment
                if (context.textBaseline === 'middle') {
                    textSprite.anchor.y = 0.5;
                } else if (context.textBaseline === 'bottom') {
                    textSprite.anchor.y = 1;
                }
                
                this.textContainer.addChild(textSprite);
            },
            
            // Store current state
            save: () => {
                if (!this._savedStates) this._savedStates = [];
                this._savedStates.push({...this.state});
                
                // Copy all current context properties to state
                for (const prop in context) {
                    if (typeof context[prop] !== 'function') {
                        this.state[prop] = context[prop];
                    }
                }
            },
            
            // Restore previous state
            restore: () => {
                if (this._savedStates && this._savedStates.length > 0) {
                    const savedState = this._savedStates.pop();
                    
                    // Copy saved state back to context
                    for (const prop in savedState) {
                        if (typeof savedState[prop] !== 'function') {
                            context[prop] = savedState[prop];
                        }
                    }
                    
                    // Update current state
                    this.state = {...savedState};
                }
            },
            
            // Transform operations
            translate: (x, y) => {
                this.graphics.position.x += x;
                this.graphics.position.y += y;
                this.textContainer.position.x += x;
                this.textContainer.position.y += y;
            },
            
            rotate: (angle) => {
                this.graphics.rotation += angle;
                this.textContainer.rotation += angle;
            },
            
            scale: (x, y) => {
                this.graphics.scale.x *= x;
                this.graphics.scale.y *= y;
                this.textContainer.scale.x *= x;
                this.textContainer.scale.y *= y;
            },
            
            setTransform: (a, b, c, d, e, f) => {
                // Reset transform
                this.graphics.setTransform(1, 0, 0, 1, 0, 0);
                this.textContainer.setTransform(1, 0, 0, 1, 0, 0);
                
                // Apply new transform (a,b,c,d,e,f = a,c,b,d,tx,ty in PixiJS)
                const matrix = new PIXI.Matrix(a, b, c, d, e, f);
                this.graphics.transform.setFromMatrix(matrix);
                this.textContainer.transform.setFromMatrix(matrix);
            }
        };
        
        return context;
    }
    
    // Helper to redraw the current path
    redrawCurrentPath() {
        if (this.currentPath.length === 0) return;
        
        // PixiJS doesn't have a direct equivalence to Canvas paths
        // so we need to replay the path commands
        let started = false;
        
        for (const cmd of this.currentPath) {
            switch (cmd.type) {
                case 'moveTo':
                    this.graphics.moveTo(cmd.x, cmd.y);
                    started = true;
                    break;
                case 'lineTo':
                    if (!started) {
                        this.graphics.moveTo(cmd.x, cmd.y);
                        started = true;
                    } else {
                        this.graphics.lineTo(cmd.x, cmd.y);
                    }
                    break;
                case 'arc':
                    if (Math.abs(cmd.endAngle - cmd.startAngle) >= Math.PI * 2) {
                        this.graphics.drawCircle(cmd.x, cmd.y, cmd.radius);
                    } else {
                        this.graphics.arc(
                            cmd.x, cmd.y, 
                            cmd.radius, 
                            cmd.startAngle, 
                            cmd.endAngle,
                            cmd.counterclockwise
                        );
                    }
                    break;
                case 'closePath':
                    this.graphics.closePath();
                    break;
            }
        }
    }
    
    // Helper methods
    hexColorToNumber(color) {
        if (typeof color === 'number') return color;
        
        // Handle different color formats
        if (color.startsWith('#')) {
            return parseInt(color.slice(1), 16);
        } else if (color.startsWith('rgba')) {
            const rgba = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (rgba) {
                const r = parseInt(rgba[1]);
                const g = parseInt(rgba[2]);
                const b = parseInt(rgba[3]);
                return (r << 16) + (g << 8) + b;
            }
        } else if (color.startsWith('rgb')) {
            const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgb) {
                const r = parseInt(rgb[1]);
                const g = parseInt(rgb[2]);
                const b = parseInt(rgb[3]);
                return (r << 16) + (g << 8) + b;
            }
        }
        
        // Default to white if parsing fails
        return 0xFFFFFF;
    }
    
    extractFontSize(fontString) {
        const match = fontString.match(/(\d+)px/);
        return match ? parseInt(match[1]) : 16;
    }
    
    extractFontFamily(fontString) {
        const match = fontString.match(/\d+px\s+(.+)/);
        return match ? match[1] : 'Arial';
    }
    
    // Implement standard renderer interface methods to match the original Renderer
    
    resizeCanvas(width, height) {
        this.app.renderer.resize(width, height);
        
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
        // Update PixiJS ticker if needed
        this.app.ticker.maxFPS = fps;
    }
    
    setDuration(duration) {
        this.duration = duration;
    }
    
    start() {
        if (this.isRunning) {
            console.log("Animation already running, not starting again");
            return;
        }
        
        this.isRunning = true;
        this.startTime = performance.now() / 1000;
        
        // Use PixiJS ticker instead of requestAnimationFrame
        this.app.ticker.add(this.animate, this);
        this.app.ticker.start();
        
        if (window.logToConsole) {
            window.logToConsole('Animation started (PixiJS renderer)');
        }
    }
    
    pause() {
        this.isRunning = false;
        this.app.ticker.remove(this.animate, this);
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    stop() {
        this.pause();
        this.graphics.clear();
        while (this.textContainer.children.length > 0) {
            this.textContainer.removeChildAt(0);
        }
    }
    
    animate(delta) {
        if (!this.isRunning) return;
        
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - this.startTime;
        
        // Check if we've exceeded the duration (if set)
        if (this.duration > 0 && elapsedTime >= this.duration) {
            this.pause();
            return;
        }
        
        if (this.interpreter) {
            this.interpreter.updateFps();
        }
        
        // Only clear if auto-clear isn't disabled (needed for motion blur)
        if (!window.disableAutoClear) {
            this.graphics.clear();
            while (this.textContainer.children.length > 0) {
                this.textContainer.removeChildAt(0);
            }
            this.currentPath = [];
            this.pathStarted = false;
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
        
        // Apply motion blur if active
        if (this.motionBlurActive) {
            this.applyMotionBlur();
        }
    }
    
    renderFrame(time) {
        if (typeof this.drawFunction === 'function') {
            this.graphics.clear();
            while (this.textContainer.children.length > 0) {
                this.textContainer.removeChildAt(0);
            }
            this.drawFunction(time);
        }
    }

    reset() {
        console.log('Resetting PixiRenderer state');
        
        // Clear all graphics
        this.graphics.clear();
        
        // Clear text container
        while (this.textContainer.children.length > 0) {
            this.textContainer.removeChildAt(0);
        }
        
        // Reset path tracking
        this.currentPath = [];
        this.pathStarted = false;
        
        // Reset state
        this.state = {
            fillStyle: 0xFFFFFF,
            strokeStyle: 0xFFFFFF,
            lineWidth: 1,
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            shadowBlur: 0,
            shadowColor: 0x000000,
            font: '16px Arial',
            textAlign: 'left',
            textBaseline: 'alphabetic'
        };
        
        // Reset transformation matrix
        this.graphics.setTransform(1, 0, 0, 1, 0, 0);
        this.textContainer.setTransform(1, 0, 0, 1, 0, 0);
        
        // Reset animation state
        this.isRunning = false;
        this.startTime = 0;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Clear motion blur
        if (this.motionBlurActive) {
            this.motionBlurEnd();
        }
        
        // Reset glow filter
        if (this.graphics.filters) {
            this.graphics.filters = null;
            this.textContainer.filters = null;
        }
        
        return this;
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
    
    // Implement motion blur for PixiJS
    motionBlurStart(strength = 0.8, fade = 0.2) {
        this.motionBlurActive = true;
        this.motionBlurStrength = Math.max(0.1, Math.min(0.95, strength));
        this.motionBlurFade = Math.max(0.01, Math.min(0.5, fade));
        
        // Create a blur sprite if it doesn't exist
        if (!this.blurSprite) {
            const renderTexture = PIXI.RenderTexture.create({
                width: this.app.renderer.width,
                height: this.app.renderer.height
            });
            
            this.blurSprite = new PIXI.Sprite(renderTexture);
            this.blurContainer.addChild(this.blurSprite);
        }
        
        // Disable auto-clear
        window.disableAutoClear = true;
        
        if (window.logToConsole) {
            window.logToConsole(`Motion blur activated (PixiJS): strength=${this.motionBlurStrength}, fade=${this.motionBlurFade}`);
        }
    }
    
    motionBlurEnd() {
        this.motionBlurActive = false;
        
        // Re-enable auto-clear
        window.disableAutoClear = false;
        
        // Clear the blur sprite
        if (this.blurSprite) {
            this.blurSprite.texture.destroy(true);
            this.blurContainer.removeChild(this.blurSprite);
            this.blurSprite = null;
        }
        
        if (window.logToConsole) {
            window.logToConsole('Motion blur deactivated (PixiJS)');
        }
    }
    
    applyMotionBlur() {
        if (!this.motionBlurActive || !this.blurSprite) return;
        
        // Create a new render texture
        const renderTexture = PIXI.RenderTexture.create({
            width: this.app.renderer.width,
            height: this.app.renderer.height
        });
        
        // Render the current stage to the texture
        this.app.renderer.render(this.app.stage, { renderTexture });
        
        // Apply the motion blur effect
        this.blurSprite.alpha = this.motionBlurStrength;
        this.blurSprite.texture = renderTexture;
    }
    
    // Implement glow effect for PixiJS
    glowStart(color = null, size = 15) {
        // Parse the color if provided
        let glowColor = color;
        if (!glowColor) {
            glowColor = this.context.fillStyle;
        }
        
        // Setup the glow filter
        this.glowFilter.blur = size;
        this.glowFilter.color = this.hexColorToNumber(glowColor);
        
        // Apply the filter to graphics and text
        this.graphics.filters = [this.glowFilter];
        this.textContainer.filters = [this.glowFilter];
    }
    
    glowEnd() {
        // Remove the glow filter
        this.graphics.filters = null;
        this.textContainer.filters = null;
    }
    
    // Method to handle logging
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
    
    // Add these methods to support circle, rect functions directly
    circle(x, y, radius, outline = false) {
        if (outline) {
            this.graphics.lineStyle(
                this.context.lineWidth,
                this.hexColorToNumber(this.context.strokeStyle),
                this.context.globalAlpha
            );
            this.graphics.drawCircle(x, y, radius);
        } else {
            this.graphics.beginFill(
                this.hexColorToNumber(this.context.fillStyle),
                this.context.globalAlpha
            );
            this.graphics.drawCircle(x, y, radius);
            this.graphics.endFill();
        }
    }
    
    rect(x, y, width, height, outline = false) {
        if (outline) {
            this.graphics.lineStyle(
                this.context.lineWidth,
                this.hexColorToNumber(this.context.strokeStyle),
                this.context.globalAlpha
            );
            this.graphics.drawRect(x, y, width, height);
        } else {
            this.graphics.beginFill(
                this.hexColorToNumber(this.context.fillStyle),
                this.context.globalAlpha
            );
            this.graphics.drawRect(x, y, width, height);
            this.graphics.endFill();
        }
    }
    
    line(x1, y1, x2, y2) {
        this.graphics.lineStyle(
            this.context.lineWidth,
            this.hexColorToNumber(this.context.strokeStyle),
            this.context.globalAlpha
        );
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
    }
}