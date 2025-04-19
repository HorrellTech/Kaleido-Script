/**
 * StandalonePixiRenderer - A clean implementation of PixiJS renderer
 * This version focuses on stability and working WebGL support
 */
class StandalonePixiRenderer {
    constructor(canvasId) {
        console.log('Creating new StandalonePixiRenderer');
        
        // Identify the canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        
        // Initialize properties
        this.isRunning = false;
        this.fps = 30;
        this.duration = 0;
        this.startTime = 0;
        this.drawFunction = null;
        this.interpreter = null;
        this.animationFrame = null;
        this.currentPath = [];
        this.pathStarted = false;
        
        // Simple WebGL detection (without relying on PIXI's detection)
        const gl = this.canvas.getContext('webgl') || 
                  this.canvas.getContext('experimental-webgl');
        const hasWebGL = !!gl;
        
        console.log('Native WebGL check result:', hasWebGL);
        
        // Create renderer options
        const rendererOptions = {
            view: this.canvas,
            width: this.canvas.width || 800,
            height: this.canvas.height || 600,
            backgroundColor: 0x000000,
            antialias: true,
            resolution: 1,
            // Set this based on our own test, not PIXI's detection
            forceCanvas: !hasWebGL
        };
        
        try {
            // Create renderer and stage
            this.renderer = new PIXI.Renderer(rendererOptions);
            this.stage = new PIXI.Container();
            
            console.log('Successfully created PIXI renderer:', 
                        this.renderer.type === PIXI.RENDERER_TYPE.WEBGL ? 'WebGL' :
                        this.renderer.type === PIXI.RENDERER_TYPE.WEBGL2 ? 'WebGL2' : 'Canvas');
            
            // Create graphics and text containers
            this.graphics = new PIXI.Graphics();
            this.textContainer = new PIXI.Container();
            this.stage.addChild(this.graphics);
            this.stage.addChild(this.textContainer);
            
            // Set up the ticker
            this.ticker = new PIXI.Ticker();
            this.ticker.add(() => {
                if (this.isRunning) {
                    this.renderFrame();
                }
                this.renderer.render(this.stage);
            });
            this.ticker.start();
            
            // Store state for compatibility with Canvas API
            this.state = {
                fillStyle: 0xFFFFFF,
                strokeStyle: 0xFFFFFF,
                lineWidth: 1,
                globalAlpha: 1,
                font: '16px Arial',
                textAlign: 'left',
                textBaseline: 'alphabetic'
            };
            
            // Create Canvas-compatible context
            this.context = this.createContextCompatibilityLayer();
            
            // Add renderer type indicator
            this.addRendererIndicator();
            
            console.log('StandalonePixiRenderer initialization complete');
            
        } catch (error) {
            console.error('Error creating PIXI renderer:', error);
            throw new Error('Failed to initialize PIXI renderer: ' + error.message);
        }
    }
    
    // Show renderer type indicator
    addRendererIndicator() {
        const existingIndicator = document.querySelector('.renderer-indicator');
        if (existingIndicator) {
            existingIndicator.parentNode.removeChild(existingIndicator);
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'renderer-indicator pixi';
        
        let rendererType = 'Canvas';
        let color = 'rgba(33, 150, 243, 0.7)';
        
        if (this.renderer.type === PIXI.RENDERER_TYPE.WEBGL) {
            rendererType = 'WebGL';
            color = 'rgba(76, 175, 80, 0.7)';
        } else if (this.renderer.type === PIXI.RENDERER_TYPE.WEBGL2) {
            rendererType = 'WebGL2';
            color = 'rgba(76, 175, 80, 0.7)';
        }
        
        indicator.textContent = rendererType;
        indicator.title = `Using PixiJS ${rendererType} Renderer`;
        
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
        
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            canvasContainer.appendChild(indicator);
        }
    }
    
    // Create a Canvas-compatible API
    createContextCompatibilityLayer() {
        const context = {
            canvas: this.canvas,
            fillStyle: '#FFFFFF',
            strokeStyle: '#FFFFFF',
            lineWidth: 1,
            globalAlpha: 1,
            font: '16px Arial',
            textAlign: 'left',
            textBaseline: 'alphabetic',
            
            clearRect: (x, y, width, height) => {
                this.graphics.clear();
                while (this.textContainer.children.length > 0) {
                    this.textContainer.removeChildAt(0);
                }
                this.currentPath = [];
                this.pathStarted = false;
            },
            
            fillRect: (x, y, width, height) => {
                this.graphics.beginFill(this.hexColorToNumber(context.fillStyle), context.globalAlpha);
                this.graphics.drawRect(x, y, width, height);
                this.graphics.endFill();
            },
            
            strokeRect: (x, y, width, height) => {
                this.graphics.lineStyle(context.lineWidth, this.hexColorToNumber(context.strokeStyle), context.globalAlpha);
                this.graphics.drawRect(x, y, width, height);
            },
            
            beginPath: () => {
                this.currentPath = [];
                this.pathStarted = true;
                this.graphics.lineStyle(context.lineWidth, this.hexColorToNumber(context.strokeStyle), context.globalAlpha);
            },
            
            moveTo: (x, y) => {
                if (!this.pathStarted) context.beginPath();
                this.currentPath.push({ type: 'moveTo', x, y });
                this.graphics.moveTo(x, y);
            },
            
            lineTo: (x, y) => {
                if (!this.pathStarted) {
                    context.beginPath();
                    context.moveTo(x, y);
                    return;
                }
                this.currentPath.push({ type: 'lineTo', x, y });
                this.graphics.lineTo(x, y);
            },
            
            arc: (x, y, radius, startAngle, endAngle, counterclockwise = false) => {
                if (!this.pathStarted) context.beginPath();
                this.currentPath.push({ type: 'arc', x, y, radius, startAngle, endAngle, counterclockwise });
                if (Math.abs(endAngle - startAngle) >= Math.PI * 2) {
                    this.graphics.drawCircle(x, y, radius);
                } else {
                    this.graphics.arc(x, y, radius, startAngle, endAngle, counterclockwise);
                }
            },
            
            fill: () => {
                if (!this.pathStarted) return;
                this.graphics.beginFill(this.hexColorToNumber(context.fillStyle), context.globalAlpha);
                this.redrawCurrentPath();
                this.graphics.endFill();
            },
            
            stroke: () => {
                if (!this.pathStarted) return;
                this.graphics.lineStyle(context.lineWidth, this.hexColorToNumber(context.strokeStyle), context.globalAlpha);
                this.redrawCurrentPath();
            },
            
            closePath: () => {
                if (!this.pathStarted) return;
                this.currentPath.push({ type: 'closePath' });
                this.graphics.closePath();
            },
            
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
                
                if (context.textAlign === 'center') textSprite.anchor.x = 0.5;
                else if (context.textAlign === 'right') textSprite.anchor.x = 1;
                
                if (context.textBaseline === 'middle') textSprite.anchor.y = 0.5;
                else if (context.textBaseline === 'bottom') textSprite.anchor.y = 1;
                
                this.textContainer.addChild(textSprite);
            },
            
            save: () => {
                if (!this._savedStates) this._savedStates = [];
                this._savedStates.push({...this.state});
                for (const prop in context) {
                    if (typeof context[prop] !== 'function') {
                        this.state[prop] = context[prop];
                    }
                }
            },
            
            restore: () => {
                if (this._savedStates && this._savedStates.length > 0) {
                    const savedState = this._savedStates.pop();
                    for (const prop in savedState) {
                        if (typeof savedState[prop] !== 'function') {
                            context[prop] = savedState[prop];
                        }
                    }
                    this.state = {...savedState};
                }
            },
            
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
                this.graphics.setTransform(1, 0, 0, 1, 0, 0);
                this.textContainer.setTransform(1, 0, 0, 1, 0, 0);
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
                        this.graphics.arc(cmd.x, cmd.y, cmd.radius, cmd.startAngle, cmd.endAngle, cmd.counterclockwise);
                    }
                    break;
                case 'closePath':
                    this.graphics.closePath();
                    break;
            }
        }
    }
    
    // Color conversion helper
    hexColorToNumber(color) {
        if (typeof color === 'number') return color;
        
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
    
    // Standard renderer interface methods to match the original Renderer
    
    resizeCanvas(width, height) {
        this.renderer.resize(width, height);
        
        const maxWidth = this.canvas.parentElement.clientWidth - 20;
        const maxHeight = this.canvas.parentElement.clientHeight - 20;
        
        const scale = Math.min(maxWidth / width, maxHeight / height);
        
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
        this.ticker.maxFPS = fps;
    }
    
    setDuration(duration) {
        this.duration = duration;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now() / 1000;
        
        if (window.logToConsole) {
            window.logToConsole('Animation started (StandalonePixi renderer)');
        }
    }
    
    pause() {
        this.isRunning = false;
    }
    
    stop() {
        this.pause();
        this.graphics.clear();
        while (this.textContainer.children.length > 0) {
            this.textContainer.removeChildAt(0);
        }
    }
    
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
    
    reset() {
        this.graphics.clear();
        while (this.textContainer.children.length > 0) {
            this.textContainer.removeChildAt(0);
        }
        this.currentPath = [];
        this.pathStarted = false;
        
        this.state = {
            fillStyle: 0xFFFFFF,
            strokeStyle: 0xFFFFFF,
            lineWidth: 1,
            globalAlpha: 1,
            font: '16px Arial',
            textAlign: 'left',
            textBaseline: 'alphabetic'
        };
        
        this.graphics.setTransform(1, 0, 0, 1, 0, 0);
        this.textContainer.setTransform(1, 0, 0, 1, 0, 0);
        
        this.isRunning = false;
        this.startTime = 0;
        
        return this;
    }
    
    play() {
        try {
            const editorCode = window.editor ? window.editor.getValue() : '';
            if (!editorCode) {
                if (window.logToConsole) {
                    window.logToConsole('No code to execute', 'warning');
                }
                return;
            }
            
            if (!this.interpreter) {
                if (window.interpreter) {
                    this.interpreter = window.interpreter;
                } else {
                    this.interpreter = new Interpreter(this);
                    window.interpreter = this.interpreter;
                }
            }
            
            this.interpreter.reset();
            const success = this.interpreter.evaluate(editorCode);
            
            if (success) {
                if (window.logToConsole) {
                    window.logToConsole('Code evaluated successfully');
                }
                this.start();
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
    
    // Implement simple shape drawing functions
    circle(x, y, radius, outline = false) {
        if (outline) {
            this.graphics.lineStyle(this.context.lineWidth, this.hexColorToNumber(this.context.strokeStyle), this.context.globalAlpha);
            this.graphics.drawCircle(x, y, radius);
        } else {
            this.graphics.beginFill(this.hexColorToNumber(this.context.fillStyle), this.context.globalAlpha);
            this.graphics.drawCircle(x, y, radius);
            this.graphics.endFill();
        }
    }
    
    rect(x, y, width, height, outline = false) {
        if (outline) {
            this.graphics.lineStyle(this.context.lineWidth, this.hexColorToNumber(this.context.strokeStyle), this.context.globalAlpha);
            this.graphics.drawRect(x, y, width, height);
        } else {
            this.graphics.beginFill(this.hexColorToNumber(this.context.fillStyle), this.context.globalAlpha);
            this.graphics.drawRect(x, y, width, height);
            this.graphics.endFill();
        }
    }
    
    line(x1, y1, x2, y2) {
        this.graphics.lineStyle(this.context.lineWidth, this.hexColorToNumber(this.context.strokeStyle), this.context.globalAlpha);
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
    }
    
    // Clean up resources
    destroy() {
        if (this.ticker) this.ticker.destroy();
        if (this.renderer) this.renderer.destroy(true);
        this.graphics = null;
        this.textContainer = null;
        this.stage = null;
    }
}