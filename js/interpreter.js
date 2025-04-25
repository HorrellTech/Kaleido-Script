/*
    * Interpreter class for handling drawing and audio processing.
*/
class Interpreter {
    constructor(renderer) {
        this.renderer = renderer;
        this.context = renderer.context;
        this.variables = {};
        this.functions = {};
        this.turtles = {};
        this.audioData = null;
        this.audioContext = null;
        this.analyser = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlayingAudio = false;
        this.loopStates = {}; // Add this to track loop states
        this.audioFiles = {}; // Add this to store registered audio files

        // Initialize mouse position tracking with underscore prefix to distinguish from methods
        this._mouseX = renderer.canvas ? renderer.canvas.width / 2 : 0;
        this._mouseY = renderer.canvas ? renderer.canvas.height / 2 : 0;
        
        // Set up mouse event listeners
        if (renderer.canvas) {
            renderer.canvas.addEventListener('mousemove', (event) => {
                const rect = renderer.canvas.getBoundingClientRect();
                this._mouseX = event.clientX - rect.left;
                this._mouseY = event.clientY - rect.top;
            });
            
            // Handle mouse leaving the canvas
            renderer.canvas.addEventListener('mouseout', () => {
                // When mouse leaves, set position to center of canvas
                this._mouseX = renderer.canvas.width / 2;
                this._mouseY = renderer.canvas.height / 2;
            });
        }

        // Initialize 3D system
        this.init3DSystem();

        // Initialize depth buffer
        this.initDepthBuffer();

        // Initialize the visualizers with this interpreter
        this.visualizers = new Visualizers(this);
    }

    // Initialize 3D system with camera and projection setup
    init3DSystem() {
        // 3D camera properties - modified so Z is up
        this.camera = {
            position: { x: 0, y: -500, z: 0 },  // Camera position (y is now depth)
            target: { x: 0, y: 0, z: 0 },       // Look-at point
            up: { x: 0, y: 0, z: 1 },           // Up vector is now Z axis
            fov: 75,                           // Field of view in degrees
            near: 0.1,                         // Near clipping plane
            far: 10000,                        // Far clipping plane
            zoom: 1                            // Camera zoom factor
        };
        
        // 3D points store
        this.points3D = [];
        this.lineRenderQueue = [];
        
        // Projection matrices
        this.projectionMatrix = null;
        this.updateProjectionMatrix();
    }

    // Update the projection matrix based on canvas dimensions and camera properties
    updateProjectionMatrix() {
        if (!this.renderer || !this.renderer.canvas) return;
        
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        const aspect = width / height;
        const fovRad = this.camera.fov * Math.PI / 180;
        
        // Create a simple perspective projection matrix
        this.projectionMatrix = {
            fov: fovRad,
            aspect: aspect,
            near: this.camera.near,
            far: this.camera.far
        };
    }

    // Project a 3D point to 2D screen coordinates
    projectPoint(point) {
        if (!this.projectionMatrix) this.updateProjectionMatrix();
        if (!this.renderer || !this.renderer.canvas) return { x: 0, y: 0, z: 0, visible: false };

        const NEAR_PLANE_EPSILON = 0.0001; // Small offset for near plane checks
        
        // Vector from camera to point
        const dx = point.x - this.camera.position.x;
        const dy = point.y - this.camera.position.y;
        const dz = point.z - this.camera.position.z;
        
        // Calculate view space vectors
        // Direction the camera is looking (forward vector)
        const forward = {
            x: this.camera.target.x - this.camera.position.x,
            y: this.camera.target.y - this.camera.position.y,
            z: this.camera.target.z - this.camera.position.z
        };
        
        // Normalize forward vector
        const forwardLength = Math.sqrt(forward.x * forward.x + forward.y * forward.y + forward.z * forward.z);
        if (forwardLength === 0) {
            // Avoid division by zero if camera target and position are the same
            return { x: this.renderer.canvas.width / 2, y: this.renderer.canvas.height / 2, z: 0, visible: false };
        }
        
        forward.x /= forwardLength;
        forward.y /= forwardLength;
        forward.z /= forwardLength;
        
        // For Z-up system, calculate right vector as forward × up
        const worldUp = { x: 0, y: 0, z: 1 }; // Z-up system
        
        // right = forward × worldUp (cross product)
        const right = {
            x: forward.y * worldUp.z - forward.z * worldUp.y,
            y: forward.z * worldUp.x - forward.x * worldUp.z,
            z: forward.x * worldUp.y - forward.y * worldUp.x
        };
        
        // Normalize right vector
        let rightLength = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z);
        
        // If camera is looking straight up/down, choose an arbitrary right vector
        if (rightLength < 0.0001) {
            // Check if looking straight down Z
            if (Math.abs(forward.x) < 0.0001 && Math.abs(forward.y) < 0.0001) {
                 right.x = 1; right.y = 0; right.z = 0; // Use X as right if looking along Z
            } else {
                 // Otherwise, use cross product with a slightly different up vector (e.g., X-axis)
                 const tempUp = { x: 1, y: 0, z: 0 };
                 right.x = forward.y * tempUp.z - forward.z * tempUp.y;
                 right.y = forward.z * tempUp.x - forward.x * tempUp.z;
                 right.z = forward.x * tempUp.y - forward.y * tempUp.x;
                 rightLength = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z);
                 if (rightLength < 0.0001) { // Still failing? Default to X axis
                     right.x = 1; right.y = 0; right.z = 0;
                 } else {
                     right.x /= rightLength; right.y /= rightLength; right.z /= rightLength;
                 }
            }
        } else {
            right.x /= rightLength;
            right.y /= rightLength;
            right.z /= rightLength;
        }
        
        // Calculate camera up vector as right × forward
        const up = {
            x: right.y * forward.z - right.z * forward.y,
            y: right.z * forward.x - right.x * forward.z,
            z: right.x * forward.y - right.y * forward.x
        };
        
        // Transform point to view space
        const viewX = dx * right.x + dy * right.y + dz * right.z;
        const viewY = dx * up.x + dy * up.y + dz * up.z;
        const viewZ = dx * forward.x + dy * forward.y + dz * forward.z;

        // Calculate screen coordinates even if behind near plane, but mark visibility
        let screenX = 0;
        let screenY = 0;
        let visible = false;

        // Only calculate projection if not too far behind near plane
        // Use effectiveZ for projection calculation, guarding against zero/negative
        const effectiveZ = Math.max(viewZ, NEAR_PLANE_EPSILON); // Use epsilon here too

        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        const aspect = width / height;
        const fov = this.camera.fov * Math.PI / 180;
        const scale = this.camera.zoom / Math.tan(fov / 2);

        // Calculate NDC coordinates (-1 to 1)
        const ndcX = (viewX / effectiveZ) * scale;
        const ndcY = (viewY / effectiveZ) * scale;

        // Map to screen space
        screenX = (ndcX * aspect + 1) * 0.5 * width;
        screenY = (1 - ndcY) * 0.5 * height;

        // Determine visibility based on viewZ and frustum checks
        // Point must be AT or IN FRONT of the near plane and within far plane
        visible = (viewZ >= this.camera.near - NEAR_PLANE_EPSILON &&
                   viewZ < this.camera.far);
                   // We can add screen bounds checks here too if needed, but clipping handles lines partially off-screen
                   // && screenX >= -margin && screenX <= width + margin ... etc.

        return {
            x: screenX,
            y: screenY,
            z: viewZ,    // Return viewZ for depth and clipping calculations
            visible: visible
        };
    }

    // Initialize depth buffer for 3D rendering
    initDepthBuffer() {
        if (!this.renderer || !this.renderer.canvas) return;
        
        // Create depth buffer with same dimensions as canvas
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        
        // Allocate buffer with Float32Array for precise depth values
        this.depthBuffer = {
            width: width,
            height: height,
            data: new Float32Array(width * height),
            clear: function() {
                // Initialize all depths to "infinity" (far away)
                this.data.fill(Infinity);
            }
        };
        
        // Initially clear the buffer
        this.depthBuffer.clear();
    }

    // Update depth buffer dimensions when canvas changes
    updateDepthBuffer() {
        if (!this.renderer || !this.renderer.canvas || !this.depthBuffer) return;
        
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        
        // Only recreate if dimensions changed
        if (this.depthBuffer.width !== width || this.depthBuffer.height !== height) {
            this.depthBuffer = {
                width: width,
                height: height,
                data: new Float32Array(width * height),
                clear: function() {
                    this.data.fill(Infinity);
                }
            };
            this.depthBuffer.clear();
        }
    }

    reset() {
        this.variables = {};
        this.functions = {};
        this.turtles = {};
        this.loopStates = {}; // Reset loop states too
        
        // Reset the canvas context
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);

        // Reset 3D system
        this.points3D = [];
        this.init3DSystem();

        // Initialize/reset depth buffer
        this.initDepthBuffer();
        
        // Stop any playing audio
        this.stopAudio();

        // Clean up microphone stream if active
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
            this.micSource = null;
        }

        // Clean up device audio stream if active
        if (this.deviceStream) {
            this.deviceStream.getTracks().forEach(track => track.stop());
            this.deviceStream = null;
            this.deviceSource = null;
        }
        
        // Reset AudioProcessor if available
        if (window.audioProcessor) {
            window.audioProcessor.stop(); // Stop and reset to beginning
            window.audioProcessor.isPlaying = false;
        }
        
        // Reset visualizer data
        this.visualizers.reset();
    }

    evaluate(code) {
        // Now process javascript code
        try {
            // Store current settings if they exist
            const previousSettings = this.variables.settings;

            // Clear previous state
            this.reset();

            // Setup Math shortcuts to make math functions available without Math. prefix
            this.setupMathShortcuts();

            // Restore settings if they existed
            if (previousSettings) {
                this.variables.settings = previousSettings;
            }

            // Create the function context
            const functionBody = `
                with (this.variables) {
                    ${code}
                }
            `;

            // Create and execute the function
            const drawFunction = new Function(functionBody).bind(this);
            drawFunction();

            // Store the draw function for animation
            if (window.renderer) {
                window.renderer.drawFunction = (time) => {
                    this.variables.time = time;
                    drawFunction();
                };
            }
            
            // Define the drawing API functions in the global scope
            window.import = (modulePath) => this.importModule(modulePath);

            window.loadImage = (imagePath) => this.loadImage(imagePath);

            window.width = () => this.width();
            window.height = () => this.height();
            window.size = (width, height) => this.renderer.resize(width, height);

            window.context = () => this.renderer.context;
            window.ctx = () => this.renderer.context;
            window.canvas = () => this.renderer.canvas;
            window.getCanvas = () => this.renderer.canvas;
            window.getContext = () => this.renderer.context;
            window.getWidth = () => this.renderer.canvas.width;
            window.getHeight = () => this.renderer.canvas.height;
    
            window.circle = (x, y, radius, outline = false) => this.circle(x, y, radius, outline);
            window.ellipse = (x, y, radiusX, radiusY, rotation = 0, outline = false) => 
                this.ellipse(x, y, radiusX, radiusY, rotation, outline);
            window.rect = (x, y, width, height, outline = false) => this.rect(x, y, width, height, outline);
            window.line = (x1, y1, x2, y2) => this.line(x1, y1, x2, y2);
            window.background = (r, g, b) => this.background(r, g, b);
            window.clear = () => this.clear();
            window.fill = (r, g, b, a = 1) => this.fill(r, g, b, a);
            window.stroke = (r, g, b, a = 1) => this.stroke(r, g, b, a);
            window.brush = (r, g, b, a = 1) => this.brush(r, g, b, a);
            window.color = (r, g, b, a = 1) => this.color(r, g, b, a);
            window.lineWidth = (width) => this.lineWidth(width);
            window.drawImage = (image, x, y, width, height) => this.drawImage(image, x, y, width, height);

            window.noise = (x, y, z) => this.noise(x, y, z);
            window.noiseMap = (nx, ny, scale, octaves, persistence, lacunarity) => 
                this.noiseMap(nx, ny, scale, octaves, persistence, lacunarity);
            window.noiseSeed = (seed) => this.initNoise(seed);

            window.visualCenterImage = (imagePath, size = 200, reactivity = 0.5, glowColor = null) =>
                this.visualCenterImage(imagePath, size, reactivity, glowColor);

            window.visualBackgroundImage = (imagePath, mode = 'fill', reactivity = 0.2, pulseColor = null) =>
                this.backgroundImage(imagePath, mode, reactivity, pulseColor);

            window.adjustColorBrightness = (color, factor) => this.adjustColorBrightness(color, factor);
            
            // Turtle functions
            window.beginTurtle = (x, y) => this.beginTurtle(x, y);
            window.forward = (distance) => this.turtleForward(distance);
            window.turn = (angle) => this.turtleTurn(angle);
            window.setTurtleColor = (color) => this.setTurtleColor(color);
            window.endTurtle = () => this.endTurtle();

            // Add new glow and motion blur functions
            window.glowStart = (color = null, size = 15) => this.glowStart(color, size);
            window.glowEnd = () => this.glowEnd();
            window.motionBlurStart = (alpha = 0.2, composite = 'lighter') => this.motionBlurStart(alpha, composite);
            window.motionBlurEnd = () => this.motionBlurEnd();


            // Audio Visualizers
            window.visualCircular = (x, y, minRadius, maxRadius, pointCount, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) => 
                this.visualCircular(x, y, minRadius, maxRadius, pointCount, freqStart, freqEnd, rotation, glow);

            window.visualBar = (x, y, width, height, barCount, spacing = 2, minHeight = 5, rotation = 0, mirror = false, glow = false) => 
                this.visualBar(x, y, width, height, barCount, spacing, minHeight, rotation, mirror, glow);

            window.visualWaveform = (x, y, width, height, detail = 100, lineWidth = 2, glow = false) => 
                this.visualWaveform(x, y, width, height, detail, lineWidth, glow);

            window.visualSpiral = (x, y, startRadius, spacing, turns, pointCount, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) => 
                this.visualSpiral(x, y, startRadius, spacing, turns, pointCount, freqStart, freqEnd, rotation, glow);

            window.visualParticle = (x, y, width, height, particleCount = 100, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualParticle(x, y, width, height, particleCount, freqStart, freqEnd, glow);

            window.visualBubble = (x, y, width, height, bubbleCount = 20, minSize = 10, maxSize = 50, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualBubble(x, y, width, height, bubbleCount, minSize, maxSize, freqStart, freqEnd, glow);

            window.visualEyes = (x, y, width, height, eyeCount = 5, eyeSize = 30, fadeSpeed = 0.02, freqStart = 20, freqEnd = 2000) => 
                this.visualEyes(x, y, width, height, eyeCount, eyeSize, fadeSpeed, freqStart, freqEnd);

            window.visualDna = (x, y, width, height, strandCount = 10, detail = 50, spacing = 20, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) => 
                this.visualDna(x, y, width, height, strandCount, detail, spacing, freqStart, freqEnd, rotation, glow);
            
            window.visualConstellation = (x, y, width, height, starCount = 30, connectionRadius = 100, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualConstellation(x, y, width, height, starCount, connectionRadius, freqStart, freqEnd, glow);
            
            window.visualFlame = (x, y, width, height, flameCount = 50, freqStart = 20, freqEnd = 2000, glow = true) => 
                this.visualFlame(x, y, width, height, flameCount, freqStart, freqEnd, glow);

            window.visualLightning = (x, y, width, height, boltCount = 3, branchCount = 4, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualLightning(x, y, width, height, boltCount, branchCount, freqStart, freqEnd, glow);
            
            window.visualRipple = (x, y, width, height, rippleCount = 5, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualRipple(x, y, width, height, rippleCount, freqStart, freqEnd, glow);

            window.visualTree = (x, y, length = 100, angle = Math.PI/2, depth = 8, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualTree(x, y, length, angle, depth, freqStart, freqEnd, glow);
            
            window.visualVortex = (x, y, radius = 200, rings = 5, pointsPerRing = 20, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) => 
                this.visualVortex(x, y, radius, rings, pointsPerRing, freqStart, freqEnd, rotation, glow);
            
            window.visualMatrix = (x, y, width, height, columns = 30, freqStart = 20, freqEnd = 2000, glow = false) => 
                this.visualMatrix(x, y, width, height, columns, freqStart, freqEnd, glow);

            window.visualSnake = (x, y, width, height, snakeCount = 8, appleCount = 5, freqStart = 20, freqEnd = 2000, glow = true) => 
                this.visualSnake(x, y, width, height, snakeCount, appleCount, freqStart, freqEnd, glow);
            
            window.visualPlanetAndMoons = (x, y, planetSize = 50, moonCount = 5, minMoonSize = 5, maxMoonSize = 15, minOrbitRadius = 70, maxOrbitRadius = 150, planetColor = '#ff9900', moonColors = null, bassFreq = 60, highFreqStart = 500, highFreqEnd = 2000, glow = true) => 
                this.visualPlanetAndMoons(x, y, planetSize, moonCount, minMoonSize, maxMoonSize, minOrbitRadius, maxOrbitRadius, planetColor, moonColors, bassFreq, highFreqStart, highFreqEnd, glow);
            
            window.visualFog = (x, y, width, height, cloudCount = 15, minSize = 80, maxSize = 200, speedFactor = 1, freqStart = 20, freqEnd = 200, density = 0.5, color = 'rgba(255, 255, 255, 0.3)', glow = false) => 
                this.visualFog(x, y, width, height, cloudCount, minSize, maxSize, speedFactor, freqStart, freqEnd, density, color, glow);
            
            window.visualNebular = (x, y, width, height, density = 5, starCount = 100, hue = 240, freqStart = 20, freqEnd = 2000, glow = true) => 
                this.visualNebular(x, y, width, height, density, starCount, hue, freqStart, freqEnd, glow);

            window.visualFishPond = (x, y, width, height, fishCount = 20, pondColor = [20, 80, 120], shoreColor = [194, 178, 128], glow = false) => 
                this.visualFishPond(x, y, width, height, fishCount, pondColor, shoreColor, glow);            

            window.visualRacingCars = (x, y, width, height, carCount = 4, turnFreq = 100, driftFreq = 300, speedFreq = 60, glow = false) =>
                this.visualRacingCars(x, y, width, height, carCount, turnFreq, driftFreq, speedFreq, glow);

            window.visual3DCircularBars = (x, y, z, radius, barCount, minHeight, maxHeight, barWidth, freqStart = 60, freqEnd = 5000, rotationX = 0, rotationY = 0, rotationZ = 0, colorStart = '#FF0000', colorEnd = '#0000FF', glow = false) =>
                this.visualizers.visualCircularBar3D(x, y, z, radius, barCount, minHeight, maxHeight, barWidth, freqStart, freqEnd, rotationX, rotationY, rotationZ, colorStart, colorEnd, glow);

            window.visual3DSphere = (x, y, z, minRadius, maxRadius, particleCount, freqStart, freqEnd, glow) => 
                this.visualizers.sphere3DAudioVisualizer(x, y, z, minRadius, maxRadius, particleCount, freqStart, freqEnd, glow);

            window.visualLavaLamp = (x, y, width, height, blobCount = 8, minSize = 30, maxSize = 100, freqStart = 40, freqEnd = 200, 
                colorStart = '#FF2200', colorEnd = '#FF9900', glow = true) =>
                this.visualizers.visualLavaLamp(x, y, width, height, blobCount, minSize, maxSize, freqStart, freqEnd, 
                    colorStart, colorEnd, glow);
        
            // Audio functions
            window.loadAudio = (url) => this.loadAudio(url);
            window.playAudio = () => this.playAudio();
            window.pauseAudio = () => this.pauseAudio();
            window.audioLoad = (url) => this.loadAudio(url);
            window.audioPlay = () => this.playAudio();
            window.audioPause = () => this.pauseAudio();
            window.audiohz = (freq) => this.getAudioFrequency(freq);
            window.audioVolume = () => this.audioVolume();
            window.setAudioVolume = (volume) => this.setAudioVolume(volume);

            window.audioFromMic = (enable = true) => this.audioFromMic(enable);
            window.audioFromDevice = (enable = true) => this.audioFromDevice(enable);

            window.mouseX = () => this.mouseX;
            window.mouseY = () => this.mouseY;

            window.map = (value, inMin, inMax, outMin, outMax) => 
                this.map(value, inMin, inMax, outMin, outMax);

            window.constrain = (value, min, max) => this.constrain(value, min, max);

            // 3D functions
            window.cameraPosition = (x, y, z) => this.cameraPosition(x, y, z);
            window.cameraLookAt = (x, y, z) => this.cameraLookAt(x, y, z);
            window.cameraFov = (degrees) => this.cameraFov(degrees);
            window.cameraZoom = (factor) => this.cameraZoom(factor);
            window.projectPoint = (point) => this.projectPoint(point);
            window.point3D = (x, y, z, size = 3, color = null) => this.point3D(x, y, z, size, color);
            window.clear3D = () => this.clear3D();
            window.draw3D = () => this.draw3D();
            window.line3D = (point1, point2, color = null, lineWidth = 1) => this.line3D(point1, point2, color, lineWidth);
            window.grid3D = (size = 100, divisions = 10, colorMajor = '#444444', colorMinor = '#222222') => this.grid3D(size, divisions, colorMajor, colorMinor);
            window.axes3D = (size = 100) => this.axes3D(size);
            window.cube3D = (x = 0, y = 0, z = 0, size = 100, color = '#FFFFFF', wireframe = true) => this.cube3D(x, y, z, size, color, wireframe);
            window.triangle3D = (p1, p2, p3, color = null) => this.triangle3D(p1, p2, p3, color);
            window.sphere3D = (x = 0, y = 0, z = 0, radius = 50, detail = 15, color = '#FFFFFF') => this.sphere3D(x, y, z, radius, detail, color);
            window.visualize3D = (x = 0, y = 0, z = 0, size = 200, detail = 15, freqStart = 20, freqEnd = 2000) => this.visualize3D(x, y, z, size, detail, freqStart, freqEnd);
            window.orbitCamera = (angleX, angleY, distance) => this.orbitCamera(angleX, angleY, distance);

            window.text = (content, x, y, size = 16, font = "Arial", align = "left", color = null) => 
                this.text(content, x, y, size, font, align, color);
            window.getFps = () => this.getFps();

            window.generateSeededRandom = (seed) => this.generateSeededRandom(seed);
            window.random = (min = 0, max = 1, seed = null) => this.random(min, max, seed);
            window.randomInt = (min, max, seed = null) => this.randomInt(min, max, seed);
            
    
            // Bind logToConsole to the renderer instance
            window.log = (message, type = 'info') => {
                if (this.renderer && this.renderer.logToConsole) {
                    this.renderer.logToConsole(message, type);
                }
            };
    
            // Pre-process the code to ensure draw and setup functions are defined globally
            // Check for all function definition patterns
            let modifiedCode = code;
    
            // Handle function expressions: draw = function(time) {...}
            modifiedCode = modifiedCode.replace(/\b(draw|setup)\s*=\s*function\s*\(/g, 'window.$1 = function(');
            
            // Handle arrow functions: draw = (time) => {...}
            modifiedCode = modifiedCode.replace(/\b(draw|setup)\s*=\s*\(\s*(\w*)\s*\)\s*=>/g, 'window.$1 = ($2) =>');
            
            // Handle function declarations without window prefix
            modifiedCode = modifiedCode.replace(/function\s+(draw|setup)\s*\(/g, 'window.$1 = function(');

            // Handle replace console.log with log
            modifiedCode = modifiedCode.replace(/console\.log/g, 'log');
    
            // Set up the final code to evaluate
            const finalCode = `
                const canvas = this.renderer.canvas;
                const context = this.renderer.context;
                const ctx = this.renderer.context;
                const width = canvas.width;
                const height = canvas.height;
                ${modifiedCode}`;
            
            // Evaluate the user's code
            eval(finalCode);
            
            // Debug what functions are available
            console.log("After evaluation - draw defined:", typeof window.draw === 'function');
            console.log("After evaluation - setup defined:", typeof window.setup === 'function');
            
            // Now check if the draw function is properly defined
            if (typeof window.draw === 'function') {
                console.log('Saving draw function to all contexts');
                this.drawFunction = window.draw;
                this.renderer.drawFunction = window.draw; 
                window.drawFunction = window.draw;
            }
            
            // Execute setup if present
            if (typeof window.setup === 'function') {
                try {
                    console.log('Executing setup function from interpreter');
                    window.setup();
                } catch (setupError) {
                    console.error('Error in setup function:', setupError);
                    window.logToConsole(`Error in setup(): ${setupError.message}`, 'error');
                    return false;
                }
            }
    
            return true;
        } catch (error) {
            if (this.renderer && this.renderer.logToConsole) {
                const lineInfo = error.lineNumber ? `line ${error.lineNumber}` : '';
                const columnInfo = error.columnNumber ? `, character ${error.columnNumber}` : '';
                const locationInfo = lineInfo || columnInfo ? ` (${lineInfo}${columnInfo})` : '';
                this.renderer.logToConsole(`Error evaluating code${locationInfo}: ${error.message}`, 'error');
            }
            return false;
        }
    }

    width() {
        return this.renderer.canvas.width;
    }

    height() {
        return this.renderer.canvas.height;
    }

    mouseX() {
        return this.mouseX;
    }

    mouseY() {
        return this.mouseY;
    }

    adjustColorBrightness(color, factor) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
        }
        
        // Handle rgb/rgba colors
        if (color.startsWith('rgb')) {
            const values = color.match(/\d+/g);
            if (values && values.length >= 3) {
                const r = parseInt(values[0]);
                const g = parseInt(values[1]);
                const b = parseInt(values[2]);
                const a = values.length > 3 ? parseFloat(values[3]) : 1;
                
                return `rgba(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))}, ${a})`;
            }
        }
        
        // Default case - return original color
        return color;
    }

    parseTurtleCommands(code) {
        const lines = code.split('\n');
        const commands = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('--')) continue;
            
            // Parse forward command
            if (trimmed.startsWith('forward')) {
                const distance = parseFloat(trimmed.substring(7).trim());
                commands.push({ type: 'forward', distance });
            }
            // Parse turn command
            else if (trimmed.startsWith('turn')) {
                const angle = parseFloat(trimmed.substring(4).trim());
                commands.push({ type: 'turn', angle });
            }
            // Parse color command
            else if (trimmed.startsWith('color')) {
                const color = trimmed.substring(5).trim();
                commands.push({ type: 'color', value: color });
            }
        }
        
        return commands;
    }

    executeBlock(blockName, args = []) {
        const block = this.functions[blockName];
        if (!block) return null;
        
        // Handle object-style blocks with parameters
        if (typeof block === 'object' && block.params) {
            // Create a new scope with parameters
            const blockVars = {};
            for (let i = 0; i < block.params.length; i++) {
                blockVars[block.params[i]] = args[i];
            }
            
            // Store previous variables and restore them after execution
            const prevVars = {...this.variables};
            this.variables = {...prevVars, ...blockVars};
            
            // Execute the block
            const result = this.executeBlockCode(block.code);
            
            // Restore previous variables
            this.variables = prevVars;
            
            return result;
        }
        
        // Simple string-style blocks
        return this.executeBlockCode(block);
    }
    
    executeBlockCode(code) {
        const lines = code.split('\n');
        let result = null;
        let loopStack = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('--')) continue;
            
            // Handle loops
            if (trimmed.match(/^loop\s+(\d+)\s+times\s*:/)) {
                const loopCount = parseInt(RegExp.$1);
                const loopId = `loop_${i}_${Date.now()}`;
                loopStack.push({
                    id: loopId,
                    count: loopCount,
                    start: i + 1,
                    iterations: 0
                });
                
                // Initialize the loop counter variable for this loop
                this.variables.loopIndex = 0;
                this.loopStates[loopId] = { index: 0 };
                continue;
            }
            
            // Handle end of loop
            if (trimmed === 'end loop' && loopStack.length > 0) {
                const currentLoop = loopStack[loopStack.length - 1];
                currentLoop.iterations++;
                
                // Update the loop counter variable
                this.loopStates[currentLoop.id].index++;
                this.variables.loopIndex = this.loopStates[currentLoop.id].index;
                
                if (currentLoop.iterations < currentLoop.count) {
                    // Jump back to start of loop
                    i = currentLoop.start - 1;
                } else {
                    // Loop completed
                    delete this.loopStates[currentLoop.id]; // Clean up this loop's state
                    loopStack.pop();
                    
                    // Update the current loop index to the parent loop's index (if any)
                    if (loopStack.length > 0) {
                        const parentLoop = loopStack[loopStack.length - 1];
                        this.variables.loopIndex = this.loopStates[parentLoop.id].index;
                    } else {
                        // No more loops, remove the loop index variable
                        delete this.variables.loopIndex;
                    }
                }
                continue;
            }
            
            // Execute drawing commands
            if (trimmed.startsWith('color')) {
                const color = trimmed.substring(5).trim();
                this.setColor(color);
            }
            else if (trimmed.startsWith('circle')) {
                const params = this.parseParameters(trimmed.substring(6).trim());
                if (params.length >= 3) {
                    this.circle(params[0], params[1], params[2], params[3] || false);
                }
            }
            else if (trimmed.startsWith('rect')) {
                const params = this.parseParameters(trimmed.substring(4).trim());
                if (params.length >= 4) {
                    this.rect(params[0], params[1], params[2], params[3], params[4] || false);
                }
            }
            else if (trimmed.startsWith('line')) {
                const params = this.parseParameters(trimmed.substring(4).trim());
                if (params.length >= 4) {
                    this.line(params[0], params[1], params[2], params[3]);
                }
            }
            else if (trimmed.startsWith('background')) {
                const params = this.parseParameters(trimmed.substring(10).trim());
                if (params.length >= 3) {
                    this.background(params[0], params[1], params[2]);
                }
            }
            else if (trimmed.startsWith('loadAudio')) {
                const url = trimmed.match(/loadAudio\s+["'](.+?)["']/);
                if (url && url[1]) {
                    this.loadAudio(url[1]);
                }
            }
            else if (trimmed.startsWith('playAudio')) {
                this.playAudio();
            }
            else if (trimmed.startsWith('pauseAudio')) {
                this.pauseAudio();
            }
            // Variable assignments
            else if (trimmed.match(/^(\w+)\s*=\s*(.+)$/)) {
                const varName = RegExp.$1;
                const varValue = this.evaluateExpression(RegExp.$2);
                this.variables[varName] = varValue;
            }
        }
        
        return result;
    }
    
    evaluateExpression(expr) {
        // Replace variables with their values
        for (const varName in this.variables) {
            expr = expr.replace(new RegExp(`\\b${varName}\\b`, 'g'), this.variables[varName]);
        }
        
        // Special case for loopIndex
        if (expr.includes('loopIndex') && this.variables.loopIndex !== undefined) {
            expr = expr.replace(/\bloopIndex\b/g, this.variables.loopIndex);
        }
        
        // Handle audiohz function
        expr = expr.replace(/audiohz\s*\(\s*(\d+)\s*\)/g, (match, freq) => {
            return this.getAudioFrequency(parseInt(freq));
        });
        
        // Evaluate the expression
        try {
            return eval(expr);
        } catch (e) {
            console.error("Error evaluating expression:", e);
            return 0;
        }
    }
    
    executeTurtleCommands() {
        for (const turtleId in this.turtles) {
            const turtle = this.turtles[turtleId];
            
            this.context.save();
            this.context.beginPath();
            this.context.moveTo(turtle.x, turtle.y);
            
            let currentX = turtle.x;
            let currentY = turtle.y;
            let currentAngle = turtle.angle;
            
            for (const cmd of turtle.commands) {
                if (cmd.type === 'forward') {
                    const radians = currentAngle * Math.PI / 180;
                    const newX = currentX + Math.cos(radians) * cmd.distance;
                    const newY = currentY + Math.sin(radians) * cmd.distance;
                    
                    this.context.lineTo(newX, newY);
                    
                    currentX = newX;
                    currentY = newY;
                }
                else if (cmd.type === 'turn') {
                    currentAngle += cmd.angle;
                }
                else if (cmd.type === 'color') {
                    this.context.stroke(); // Finish current path
                    this.setColor(cmd.value);
                    
                    // Start a new path from current position
                    this.context.beginPath();
                    this.context.moveTo(currentX, currentY);
                }
            }
            
            this.context.stroke();
            this.context.restore();
        }
    }

    parseParameters(paramsStr) {
        if (!paramsStr) return [];
        
        // Replace any variable references with their values
        for (const varName in this.variables) {
            paramsStr = paramsStr.replace(new RegExp(`\\b${varName}\\b`, 'g'), this.variables[varName]);
        }
        
        // Handle audio reactive functions
        paramsStr = paramsStr.replace(/audiohz\s*\(\s*(\d+)\s*\)/g, (match, freq) => {
            return this.getAudioFrequency(parseInt(freq));
        });
        
        // Normalize commas
        paramsStr = paramsStr.replace(/\s*,\s*/g, ',');
        
        // Try to parse parameters separated by spaces or commas
        try {
            // If it looks like a comma-separated list, treat it as such
            if (paramsStr.includes(',')) {
                return eval(`[${paramsStr}]`);
            }
            // Otherwise split by spaces
            else {
                return paramsStr.split(/\s+/).map(param => {
                    try {
                        return eval(param);
                    } catch (e) {
                        return param;
                    }
                });
            }
        } catch (e) {
            console.error("Error parsing parameters:", e);
            return [];
        }
    }

    // Generate a deterministic random value from a seed
    generateSeededRandom(seed) {
        // Simple seeded random number generator
        const hash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        };
        
        // Convert seed to a number if it's not already
        const seedNum = typeof seed === 'string' ? hash(seed) : Math.abs(seed || Date.now());
        
        // Return a function that generates deterministic random numbers
        return () => {
            // LCG parameters
            const a = 1664525;
            const c = 1013904223;
            const m = Math.pow(2, 32);
            
            // Update seed
            let next = (a * seedNum + c) % m;
            
            // Update for next call
            this.lastSeed = next;
            
            // Return value between 0 and 1
            return next / m;
        };
    }

    // If seed is provided, generates deterministic random numbers
    // Otherwise uses Math.random for true randomness
    random(min = 0, max = 1, seed = null) {
        // If only one argument is provided, treat it as max with min=0
        if (arguments.length === 1) {
            max = min;
            min = 0;
        }
        
        if (seed !== null) {
            // Use seeded random for deterministic output
            const randomFunc = this.generateSeededRandom(seed);
            return min + randomFunc() * (max - min);
        } else {
            // Use standard Math.random for true randomness
            return min + Math.random() * (max - min);
        }
    }

    randomInt(min, max, seed = null) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random(min, max + 1, seed));
    }

    /**
     * Constrains a value between a minimum and maximum value.
     * @param {number} value - The value to constrain
     * @param {number} min - The minimum limit
     * @param {number} max - The maximum limit
     * @returns {number} The constrained value
     */
    constrain(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Automatically wraps common Math functions so they can be used without the Math. prefix
     * This augments the global scope with direct access to mathematical functions
     */
    setupMathShortcuts() {
        // List of common Math functions to expose globally
        const mathFunctions = [
            'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'atan2',
            'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
            'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2',
            'max', 'min', 'pow', 'round', 'sign', 'sin', 'sinh', 'sqrt',
            'tan', 'tanh', 'trunc'
        ];
        
        // Create window-level aliases for each Math function
        mathFunctions.forEach(funcName => {
            if (typeof Math[funcName] === 'function' && !window[funcName]) {
                window[funcName] = (...args) => Math[funcName](...args);
            }
        });
        
        // Also expose common Math constants
        if (!window.PI) window.PI = Math.PI;
        if (!window.E) window.E = Math.E;
        if (!window.TAU) window.TAU = Math.PI * 2; // Useful constant for circular calculations
    }

    /**
     * Maps a value from one range to another.
     * @param {number} value - The value to map
     * @param {number} inMin - The minimum of the input range
     * @param {number} inMax - The maximum of the input range
     * @param {number} outMin - The minimum of the output range
     * @param {number} outMax - The maximum of the output range
     * @returns {number} The mapped value
     */
    map(value, inMin, inMax, outMin, outMax) {
        // First constrain the value to the input range
        const constrainedValue = Math.max(inMin, Math.min(inMax, value));
        
        // Calculate how far (proportionally) the value is in the input range
        const percentage = (constrainedValue - inMin) / (inMax - inMin);
        
        // Apply that percentage to the output range
        return outMin + percentage * (outMax - outMin);
    }

    setColor(color) {
        if (!color) return;
        
        try {
            if (color.startsWith('#')) {
                // Hex color
                this.context.strokeStyle = color;
                this.context.fillStyle = color;
            } else if (color.match(/^rgb/)) {
                // RGB/RGBA color
                this.context.strokeStyle = color;
                this.context.fillStyle = color;
            } else {
                // Named color
                this.context.strokeStyle = color;
                this.context.fillStyle = color;
            }
        } catch (e) {
            console.error("Error setting color:", e);
        }
    }

    // Drawing functions
    background(r, g, b) {
        const prevFill = this.context.fillStyle;
        this.context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.context.fillRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
        this.context.fillStyle = prevFill;
    }

    backgroundImage(imagePath, mode = 'fill', reactivity = 0.2, pulseColor = null) {
        // Load the image
        const image =imagePath;

        if (!image || !this.context || !this.renderer || !this.renderer.canvas) {
            window.logToConsole(`Failed to load background image: ${imagePath}`, 'warning');
            // Use a free default image from Unsplash
           // const defaultImage = this.loadImage('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop');
            
            // If even the default image fails, give up
            //if (!defaultImage) {
               // window.logToConsole(`Failed to load any background image`, 'error');
            //    return false;
            //} else {
                //image = defaultImage;
            //}
        }
        
        // Get canvas dimensions
        const canvasWidth = this.renderer.canvas.width;
        const canvasHeight = this.renderer.canvas.height;
        
        // Get audio reactivity if specified
        const bassResponse = (this.getAudioFrequency(60) || 0) * reactivity;
        
        // Save context state for later restoration
        this.context.save();
        
        // Apply pulse effect if a pulse color was specified
        if (pulseColor && bassResponse > 0.1) {
            // Apply a colored overlay with opacity based on bass
            this.context.fillStyle = pulseColor;
            this.context.globalAlpha = Math.min(0.6, bassResponse * 0.8);
            this.context.fillRect(0, 0, canvasWidth, canvasHeight);
            this.context.globalAlpha = 1.0; // Reset alpha
        }
        
        // Apply a subtle scaling based on bass response
        const pulseScale = 1 + (bassResponse * 0.05);
        
        // Calculate dimensions based on the specified mode
        let drawWidth, drawHeight, drawX, drawY;
        
        switch (mode.toLowerCase()) {
            case 'stretch': // Stretch to fill canvas completely
                drawWidth = canvasWidth;
                drawHeight = canvasHeight;
                drawX = 0;
                drawY = 0;
                break;
                
            case 'fill': // Scale to fill canvas, maintain aspect ratio, may crop
                const fillScaleX = canvasWidth / image.width;
                const fillScaleY = canvasHeight / image.height;
                const fillScale = Math.max(fillScaleX, fillScaleY) * pulseScale;
                
                drawWidth = image.width * fillScale;
                drawHeight = image.height * fillScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
                break;
                
            case 'fit': // Fit entire image in canvas, maintain aspect ratio, may have borders
                const fitScaleX = canvasWidth / image.width;
                const fitScaleY = canvasHeight / image.height;
                const fitScale = Math.min(fitScaleX, fitScaleY) * pulseScale;
                
                drawWidth = image.width * fitScale;
                drawHeight = image.height * fitScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
                break;
                
            case 'center': // Center image at original size
                drawWidth = image.width * pulseScale;
                drawHeight = image.height * pulseScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
                break;
                
            default: // Default to 'fill'
                const defaultScaleX = canvasWidth / image.width;
                const defaultScaleY = canvasHeight / image.height;
                const defaultScale = Math.max(defaultScaleX, defaultScaleY) * pulseScale;
                
                drawWidth = image.width * defaultScale;
                drawHeight = image.height * defaultScale;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = (canvasHeight - drawHeight) / 2;
        }
        
        // Draw the image with calculated dimensions
        try {
            this.context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        } catch (error) {
            console.error("Error drawing background image:", error);
            window.logToConsole(`Error drawing background image: ${error.message}`, 'error');
            // default to a free url image if available
        }
        
        // Apply a post-processing effect based on bass response if requested
        if (reactivity > 0 && bassResponse > 0.2) {
            // Apply a subtle brightness/contrast adjustment based on bass
            const contrastFactor = Math.min(0.3, bassResponse * 0.4);
            
            if (contrastFactor > 0.05) {
                // Use a composite operation to enhance the image
                this.context.globalCompositeOperation = 'overlay';
                this.context.globalAlpha = contrastFactor;
                this.context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
                this.context.globalCompositeOperation = 'source-over';
                this.context.globalAlpha = 1.0;
            }
        }
        
        // Restore context to original state
        this.context.restore();
        return true;
    }

    clear() {
        this.context.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
    }

    circle(x, y, radius, outline = false) {
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        if (outline) {
            this.context.stroke();
        } else {
            this.context.fill();
        }
    }

    ellipse(x, y, radiusX, radiusY, rotation = 0, outline = false) {
        this.context.beginPath();
        this.context.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
        if (outline) {
            this.context.stroke();
        } else {
            this.context.fill();
        }
    }

    rect(x, y, width, height, outline = false) {
        if (outline) {
            this.context.strokeRect(x, y, width, height);
        } else {
            this.context.fillRect(x, y, width, height);
        }
    }

    line(x1, y1, x2, y2) {
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
    }

    fill(r, g, b, a = 1) {
        this.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    stroke(r, g, b, a = 1) {
        this.context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    brush(r, g, b, a = 1) {
        this.context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    lineWidth(width) {
        this.context.lineWidth = width;
    }

    createTurtle(x, y) {
        const turtleId = `runtime_turtle_${Date.now()}`;
        this.turtles[turtleId] = {
            x: x,
            y: y,
            angle: 0,
            commands: []
        };
        return this.turtles[turtleId];
    }

    // Add the turtle methods (simplified)
    beginTurtle(x, y) {
        this.turtle = {
            x: x,
            y: y,
            angle: 0,
            penDown: true,
            color: this.context.strokeStyle
        };
        this.context.beginPath();
        this.context.moveTo(x, y);

        window.logToConsole(`Turtle started at (${x}, ${y})`);
    }

    turtleForward(distance) {
        if (!this.turtle) return;
        
        const radians = this.turtle.angle * Math.PI / 180;
        const newX = this.turtle.x + Math.cos(radians) * distance;
        const newY = this.turtle.y + Math.sin(radians) * distance;
        
        if (this.turtle.penDown) {
            this.context.lineTo(newX, newY);
            this.context.stroke();
        }
        
        this.turtle.x = newX;
        this.turtle.y = newY;

        window.logToConsole(`Turtle moved to (${newX}, ${newY})`);
    }

    turtleTurn(angle) {
        if (!this.turtle) return;
        this.turtle.angle += angle;

        window.logToConsole(`Turtle turned to ${this.turtle.angle} degrees`);
    }

    setTurtleColor(color) {
        if (!this.turtle) return;
        this.turtle.color = color;
        this.context.strokeStyle = color;

        window.logToConsole(`Turtle color set to ${color}`);
    }

    endTurtle() {
        this.turtle = null;
        this.context.closePath();

        window.logToConsole("Turtle ended");
    }

    // Perlin Noise implementation
    initNoise(seed = Math.random()) {
        // Initialize noise with optional seed
        this.noiseSeed = seed;
        this.noisePermutation = new Array(512);
        this.noiseGrad = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        
        // Create permutation table
        const p = new Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Fisher-Yates shuffle
        for (let i = 255; i > 0; i--) {
            const seededRandom = Math.abs(Math.sin(i * this.noiseSeed * 43758.5453123)) % 1;
            const j = Math.floor(seededRandom * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Extend with a copy of the array
        for (let i = 0; i < 256; i++) {
            this.noisePermutation[i] = p[i];
            this.noisePermutation[i + 256] = p[i];
        }
        
        window.logToConsole("Noise initialized with seed: " + this.noiseSeed);
    }

    noise(x, y = 0, z = 0) {
        // Initialize noise if not already
        if (!this.noisePermutation) {
            this.initNoise();
        }
        
        // Find unit cube that contains point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        // Find relative x, y, z of point in cube
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        // Compute fade curves for each x, y, z
        const u = this.noiseFade(x);
        const v = this.noiseFade(y);
        const w = this.noiseFade(z);
        
        // Hash coordinates of the 8 cube corners
        const A = this.noisePermutation[X] + Y;
        const AA = this.noisePermutation[A] + Z;
        const AB = this.noisePermutation[A + 1] + Z;
        const B = this.noisePermutation[X + 1] + Y;
        const BA = this.noisePermutation[B] + Z;
        const BB = this.noisePermutation[B + 1] + Z;
        
        // Add blended results from 8 corners of cube
        const result = this.noiseLerp(w, 
            this.noiseLerp(v, 
                this.noiseLerp(u, 
                    this.noiseGrad3(this.noisePermutation[AA], x, y, z),
                    this.noiseGrad3(this.noisePermutation[BA], x-1, y, z)
                ),
                this.noiseLerp(u, 
                    this.noiseGrad3(this.noisePermutation[AB], x, y-1, z),
                    this.noiseGrad3(this.noisePermutation[BB], x-1, y-1, z)
                )
            ),
            this.noiseLerp(v, 
                this.noiseLerp(u, 
                    this.noiseGrad3(this.noisePermutation[AA+1], x, y, z-1),
                    this.noiseGrad3(this.noisePermutation[BA+1], x-1, y, z-1)
                ),
                this.noiseLerp(u, 
                    this.noiseGrad3(this.noisePermutation[AB+1], x, y-1, z-1),
                    this.noiseGrad3(this.noisePermutation[BB+1], x-1, y-1, z-1)
                )
            )
        );
        
        // Return in range [-1, 1]
        return result;
    }
    
    noiseFade(t) {
        // Fade function as defined by Ken Perlin
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    noiseLerp(t, a, b) {
        // Linear interpolation
        return a + t * (b - a);
    }
    
    noiseGrad3(hash, x, y, z) {
        // Convert low 4 bits of hash code into 12 gradient directions
        const h = hash & 15;
        const grad = this.noiseGrad[h % 12];
        return grad[0] * x + grad[1] * y + grad[2] * z;
    }
    
    noiseMap(nx, ny, scale, octaves = 1, persistence = 0.5, lacunarity = 2.0) {
        // Get noise but map to [0,1] range with multiple octaves
        // nx, ny: normalized coordinates (0-1)
        // scale: feature size scale factor
        // octaves: number of detail layers
        // persistence: how much each octave contributes to the overall shape
        // lacunarity: how much detail is added at each octave
        
        let amplitude = 1;
        let frequency = 1;
        let noiseSum = 0;
        let amplitudeSum = 0; // Used for normalizing result to [0, 1]
        
        // Add successively smaller, higher-frequency details
        for (let i = 0; i < octaves; i++) {
            // Get noise value
            const sampleX = nx * scale * frequency;
            const sampleY = ny * scale * frequency;
            const noiseVal = this.noise(sampleX, sampleY);
            
            noiseSum += noiseVal * amplitude;
            
            // Keep track of the maximum possible amplitude sum
            amplitudeSum += amplitude;
            
            // Update values for next octave
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        // Normalize to [0, 1]
        let normalizedNoise = (noiseSum / amplitudeSum) * 0.5 + 0.5;
        
        // Ensure we stay in [0, 1] range
        return Math.max(0, Math.min(1, normalizedNoise));
    }

    // Audio reactive functions
    loadAudio(path) {
        const defaultAudio = "sounds/default-music.mp3";
        const fallbackURL = "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3";
    
        // First try the provided path
        return this.tryLoadAudio(path)
            .then(audioData => {
                window.logToConsole(`Successfully loaded audio: ${path}`, 'info');
                return audioData;
            })
            .catch(error => {
                window.logToConsole(`Failed to load audio ${path}, trying default...`, 'warning');
                // Try default audio
                return this.tryLoadAudio(defaultAudio)
                    .then(audioData => {
                        window.logToConsole(`Loaded default audio instead`, 'info');
                        return audioData;
                    })
                    .catch(error => {
                        window.logToConsole(`Failed to load default audio, using fallback...`, 'warning');
                        // Finally try fallback URL
                        return this.tryLoadAudio(fallbackURL);
                    });
            });
    }
    
    tryLoadAudio(path) {
        // If audio is already loaded and ready, don't reload it
        if (window.audioProcessor && 
            window.audioProcessor.audioBuffer && 
            window.audioProcessor.audioData &&
            window.audioProcessor.audioData.name === path) {
            
            window.logToConsole(`Using already loaded audio: ${path}`, 'info');
            this.audioBuffer = window.audioProcessor.audioBuffer;
            this.audioData = window.audioProcessor.audioData;
            return Promise.resolve(this.audioData);
        }
        
        // Try to use the audio processor if available
        if (window.audioProcessor) {
            if (window.audioProcessor.audioFiles && window.audioProcessor.audioFiles[path]) {
                return window.audioProcessor.loadAudioFromURL(path, 
                    window.audioProcessor.audioFiles[path]);
            }
        }
        
        // Try to use the file system manager to resolve paths
        if (window.fileSystemManager) {
            const file = window.fileSystemManager.getFileByPath(path);
            if (file && file.url) {
                return window.audioProcessor.loadAudioFromURL(path, file.url);
            }
        }
        
        // Fall back to direct URL loading if it looks like a URL
        if (path.startsWith('http') || path.startsWith('blob:')) {
            return window.audioProcessor.loadAudioFromURL(path, path);
        }
        
        return Promise.reject(new Error(`Audio file not found: ${path}`));
    }

    loadImage(path) {
        // Check if we have a fileSystemManager that can resolve paths
        if (window.fileSystemManager) {
            const file = window.fileSystemManager.getFileByPath(path);
            if (file && file.url) {
                // Return the image if it's already loaded
                if (window.imageProcessor && window.imageProcessor.images && 
                    window.imageProcessor.images[file.url]) {
                    return window.imageProcessor.images[file.url];
                }
                
                // Otherwise load it into a new Image object
                const img = new Image();
                img.src = file.url;
                
                // Store it for future use
                if (window.imageProcessor && window.imageProcessor.images) {
                    window.imageProcessor.images[file.url] = img;
                }
                
                return img;
            }
        }
        
        // Try direct path (may be URL, data URI or relative path)
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
            // Return the image if it's already loaded
            if (window.imageProcessor && window.imageProcessor.images && 
                window.imageProcessor.images[path]) {
                return window.imageProcessor.images[path];
            }
            
            const img = new Image();
            img.src = path;
            
            // Store it for future use
            if (window.imageProcessor && window.imageProcessor.images) {
                window.imageProcessor.images[path] = img;
            }
            
            return img;
        }
        
        // Fallback to direct lookup if path resolution fails
        if (window.imageProcessor && window.imageProcessor.images) {
            return window.imageProcessor.images[path];
        }
        
        window.logToConsole(`Image not found: ${path}`, 'error');
        return null;
    }
    
    async loadAudioLegacy(url) {
        // Original implementation as fallback
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
            }
            
            // Fetch the audio file
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            // Decode the audio data
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Set up data array for frequency analysis
            this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            
            logToConsole(`Loaded audio: ${url}`);
            return true;
        } catch (error) {
            console.error("Error loading audio:", error);
            logToConsole(`Error loading audio: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Enables or disables microphone audio input with improved permission handling
     * @param {boolean} enable - Whether to enable microphone input
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async audioFromMic(enable = true) {
        try {
            // If disabling, clean up existing mic stream
            if (!enable && this.micStream) {
                this.micStream.getTracks().forEach(track => track.stop());
                this.micStream = null;
                this.micSource = null;
                window.logToConsole('Microphone input stopped');
                return true;
            }
            
            // First check if we already have permission
            let hasPermission = false;
            
            // Check permissions if the API is available
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                    
                    if (permissionStatus.state === 'granted') {
                        hasPermission = true;
                    } else if (permissionStatus.state === 'denied') {
                        throw new Error('Microphone permission has been denied. Please reset permissions in your browser settings.');
                    } else if (permissionStatus.state === 'prompt') {
                        // Will need to request permission - notify user
                        window.logToConsole('Waiting for microphone permission...', 'info');
                    }
                    
                    // Set up permission change handler
                    permissionStatus.onchange = () => {
                        if (permissionStatus.state === 'granted') {
                            window.logToConsole('Microphone permission granted!', 'success');
                        } else if (permissionStatus.state === 'denied') {
                            window.logToConsole('Microphone permission denied. Please enable in browser settings to use this feature.', 'error');
                        }
                    };
                } catch (err) {
                    console.warn('Permission query not supported', err);
                    // Will try getUserMedia directly
                }
            }

            // Initialize audio context if needed - must happen in response to user gesture
            if (!this.audioContext) {
                this.initAudioContext();
                
                // If audio context is still suspended (common in some browsers), 
                // we need to resume it based on user interaction
                if (this.audioContext.state === 'suspended') {
                    window.logToConsole('Audio context is suspended. Attempting to resume...', 'info');
                    try {
                        await this.audioContext.resume();
                        window.logToConsole('Audio context resumed successfully!', 'success');
                    } catch (err) {
                        window.logToConsole('Could not resume audio context. Try clicking something first.', 'warning');
                    }
                }
            }

            // Display an informative message if we're about to request permissions
            if (!hasPermission) {
                window.logToConsole('Requesting microphone permission... (Please allow access when prompted)', 'info');
            }

            // Request microphone access
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });

            // Create media source from mic stream
            this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
            
            // Create analyzer if needed
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            // Connect mic source to analyzer
            this.micSource.connect(this.analyser);
            
            // Don't connect to destination to avoid feedback loop
            // this.analyser.connect(this.audioContext.destination);
            
            this.isPlayingAudio = true;
            window.logToConsole('Microphone input enabled! Your visualizations will now react to your microphone.', 'success');
            return true;
        } catch (error) {
            console.error('Error setting up microphone:', error);
            
            // Provide more helpful error messages based on error type
            if (error.name === 'NotAllowedError') {
                window.logToConsole('Microphone access denied. Please allow microphone access in your browser settings and try again.', 'error');
            } else if (error.name === 'NotFoundError') {
                window.logToConsole('No microphone detected. Please connect a microphone and try again.', 'error');
            } else if (error.name === 'NotReadableError') {
                window.logToConsole('Your microphone is busy or unavailable. Is another application using it?', 'error');
            } else {
                window.logToConsole(`Microphone error: ${error.message}. Make sure to grant microphone permissions.`, 'error');
            }
            return false;
        }
    }

        /**
     * Enables or disables system audio capture with improved permission handling
     * @param {boolean} enable - Whether to enable system audio capture
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async audioFromDevice(enable = true) {
        try {
            // If disabling, clean up existing device stream
            if (!enable && this.deviceStream) {
                this.deviceStream.getTracks().forEach(track => track.stop());
                this.deviceStream = null;
                this.deviceSource = null;
                window.logToConsole('System audio capture stopped');
                return true;
            }

            // Initialize audio context if needed
            if (!this.audioContext) {
                this.initAudioContext();
                
                // If audio context is suspended, try to resume it
                if (this.audioContext.state === 'suspended') {
                    window.logToConsole('Audio context is suspended. Attempting to resume...', 'info');
                    try {
                        await this.audioContext.resume();
                        window.logToConsole('Audio context resumed successfully!', 'success');
                    } catch (err) {
                        window.logToConsole('Could not resume audio context. Try clicking something first.', 'warning');
                    }
                }
            }

            // Check if getDisplayMedia is available (required for system audio)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('System audio capture not supported in this browser. Please use Chrome, Edge, or Opera.');
            }

            // Provide clear instructions for the user before showing the permission dialog
            window.logToConsole('You will be prompted to share your screen...', 'info');
            window.logToConsole('Important: Check "Share system audio" in the dialog to capture audio playing on your device!', 'warning');
            
            // Short delay to ensure user sees instructions
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Request system audio access with screen sharing
            this.deviceStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "never",
                    displaySurface: "monitor" // Prefer capturing entire monitor
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Check if audio track exists (user may have declined audio sharing)
            const audioTracks = this.deviceStream.getAudioTracks();
            if (audioTracks.length === 0) {
                // Stop video tracks if they exist since we don't need them
                this.deviceStream.getVideoTracks().forEach(track => track.stop());
                throw new Error('No audio track available. Did you check "Share system audio"?');
            }

            // Stop video track if it exists (we only need audio)
            const videoTracks = this.deviceStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => track.stop());
            }

            // Create media source from device stream
            this.deviceSource = this.audioContext.createMediaStreamSource(this.deviceStream);
            
            // Create analyzer if needed
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            // Connect device source to analyzer
            this.deviceSource.connect(this.analyser);
            
            this.isPlayingAudio = true;
            window.logToConsole('System audio capture enabled! Your visualizations will now react to audio playing on your device.', 'success');
            return true;
        } catch (error) {
            console.error('Error setting up system audio capture:', error);
            
            // Provide more helpful error messages based on error type
            if (error.name === 'NotAllowedError') {
                window.logToConsole('Screen sharing was denied. System audio capture requires screen sharing permission.', 'error');
            } else if (error.message.includes('Share system audio')) {
                window.logToConsole('System audio sharing was not enabled. Please try again and check "Share system audio" in the dialog.', 'error');
            } else {
                window.logToConsole(`System audio error: ${error.message}`, 'error');
            }
            
            // If we have a partial stream, make sure to clean it up
            if (this.deviceStream) {
                this.deviceStream.getTracks().forEach(track => track.stop());
                this.deviceStream = null;
            }
            
            return false;
        }
    }

    setAudioVolume(value) {
        if (window.audioProcessor && window.audioProcessor.audioElement) {
            window.audioProcessor.audioElement.volume = value;
            return true;
        }
    }

    audioVolume() {
        if (window.audioProcessor && window.audioProcessor.audioElement) {
            return window.audioProcessor.audioElement.volume;
        }
        return 0;
    }

    visualCenterImage(image, size = 200, reactivity = 0.5, glowColor = null) {
        // Calculate dimensions based on size parameter
        const width = size;
        const height = size;
        
        // Draw the reactive center image
        return this.drawCenterImage(image, width, height, reactivity, glowColor);
    }

    drawCenterImage(imagePath, width, height, reactivity = 0.5, glowColor = null) {
        // Load the image
        const image = imagePath;//this.loadImage(imagePath);

        /*if (!image || !this.context || !this.renderer || !this.renderer.canvas) {
            window.logToConsole(`Failed to load center image: ${imagePath}, using a default free image`, 'warning');
            // Use a free default image from Unsplash
            const defaultImage = this.loadImage('https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600&auto=format&fit=crop');
            
            // If even the default image fails, give up
            if (!defaultImage) {
                window.logToConsole(`Failed to load any center image`, 'error');
                return false;
            }// else {
            //    return this.drawCenterImageWithImage(defaultImage, width, height, reactivity, glowColor);
            //}
        }*/
        
        if (image) {
            // Calculate center position
            const centerX = this.renderer.canvas.width / 2;
            const centerY = this.renderer.canvas.height / 2;
            
            // Get bass response for reactivity
            const bassResponse = (this.getAudioFrequency(60) || 0) * reactivity;
            const pulseSize = 1 + bassResponse * 0.3; // Scale factor based on bass
            
            // Calculate scaled dimensions with bass reactivity
            const scaledWidth = width * pulseSize;
            const scaledHeight = height * pulseSize;
            
            // Calculate position to center the image
            const x = centerX - scaledWidth / 2;
            const y = centerY - scaledHeight / 2;
            
            // Save context state before modifications
            this.context.save();
            
            // Apply glow effect if specified
            if (glowColor) {
                this.glowStart(glowColor, 15 + bassResponse * 20);
            }
            
            // Create circular clipping path
            this.context.beginPath();
            const clipRadius = Math.min(scaledWidth, scaledHeight) / 2;
            this.context.arc(centerX, centerY, clipRadius, 0, Math.PI * 2);
            this.context.clip();
            
            // Draw the image scaled to requested dimensions and centered
            this.context.drawImage(image, x, y, scaledWidth, scaledHeight);
            
            // End glow effect if applied
            if (glowColor) {
                this.glowEnd();
            }
            
            // Restore context to remove clipping and other changes
            this.context.restore();
            
            return true;
        }
        
        return false;
    }
    
    playAudio(requestedFile = null) {
        // Try to use audioProcessor if available
        if (window.audioProcessor) {
            console.log("Playing audio through audioProcessor", requestedFile ? `(requested: ${requestedFile})` : '');
            
            // If a specific file was requested, make sure it's loaded
            if (requestedFile && requestedFile !== window.audioProcessor.currentAudioName) {
                window.logToConsole(`Loading requested audio: ${requestedFile}`, 'info');
                
                // Load the requested audio file and then play it
                this.loadAudio(requestedFile)
                    .then(() => {
                        // Make sure audio processor has clean connections before playing
                        if (window.audioProcessor.ensureAudioConnections) {
                            window.audioProcessor.ensureAudioConnections();
                        }
                        
                        window.audioProcessor.play();
                        this.isPlayingAudio = true;
                        window.logToConsole(`Now playing: ${requestedFile}`, 'success');
                    })
                    .catch(err => {
                        window.logToConsole(`Failed to load requested audio: ${err.message}`, 'error');
                    });
                
                return true;
            }
            
            // Check if we have audio loaded already
            if (!window.audioProcessor.audioBuffer && !window.audioProcessor.audioElement.src) {
                window.logToConsole("No audio loaded, loading default audio...", 'info');
                
                // Load default audio and then play it
                this.loadAudio("sounds/default-music.mp3")
                    .then(() => {
                        // Make sure audio processor has clean connections before playing
                        if (window.audioProcessor.ensureAudioConnections) {
                            window.audioProcessor.ensureAudioConnections();
                        }
                        
                        window.audioProcessor.play();
                        this.isPlayingAudio = true;
                        window.logToConsole("Default audio loaded and playing", 'success');
                    })
                    .catch(err => {
                        window.logToConsole(`Failed to load and play audio: ${err.message}`, 'error');
                    });
                
                return true;
            }
            
            this.isPlayingAudio = true;
            
            // Make sure audio processor has clean connections before playing
            if (window.audioProcessor.ensureAudioConnections) {
                window.audioProcessor.ensureAudioConnections();
            }
            
            // Don't reset if already playing - this avoids the split-second issue
            if (!window.audioProcessor.isPlaying) {
                // Only reset the time if it's at the end, otherwise just resume
                if (window.audioProcessor.audioElement && 
                    window.audioProcessor.audioElement.currentTime >= window.audioProcessor.audioElement.duration - 0.1) {
                    window.audioProcessor.audioElement.currentTime = 0;
                }
                
                // Play the audio
                window.audioProcessor.play();
            }
            return true;
        }
        
        // Fall back to original implementation
        if (!this.audioBuffer) {
            // Try to load default audio
            window.logToConsole("No audio loaded, loading default audio...", 'info');
            
            this.loadAudio("sounds/default-music.mp3")
                .then(() => {
                    // Now play the audio
                    this.playAudioInternal();
                })
                .catch(err => {
                    window.logToConsole(`Failed to load and play audio: ${err.message}`, 'error');
                });
                
            return true;
        }
        
        return this.playAudioInternal();
    }

    playAudioInternal() {
        // Disconnect any existing audio source
        if (this.audioSource) {
            try {
                this.audioSource.disconnect();
            } catch (e) {
                // Ignore errors when disconnecting
            }
            this.audioSource = null;
        }
        
        try {
            // Create and connect audio source
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Start playing
            this.audioSource.start();
            this.isPlayingAudio = true;
            
            window.logToConsole('Playing audio');
            return true;
        } catch (error) {
            console.error("Error playing audio:", error);
            window.logToConsole(`Error playing audio: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Enables or disables system audio capture (what's playing on the device)
     * @param {boolean} enable - Whether to enable system audio capture
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async audioFromDevice(enable = true) {
        try {
            // If disabling, clean up existing device stream
            if (!enable && this.deviceStream) {
                this.deviceStream.getTracks().forEach(track => track.stop());
                this.deviceStream = null;
                this.deviceSource = null;
                window.logToConsole('System audio capture stopped');
                return true;
            }

            // Initialize audio context if needed
            if (!this.audioContext) {
                this.initAudioContext();
            }

            // Check if getDisplayMedia is available (required for system audio)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('System audio capture not supported in this browser');
            }

            // Request system audio access - this will prompt the user to share their screen
            // with the "share system audio" option that needs to be checked
            this.deviceStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "never"
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Check if audio track exists (user may have declined audio sharing)
            const audioTracks = this.deviceStream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio track available. Did you check "Share system audio"?');
            }

            // Stop video track if it exists (we only need audio)
            const videoTracks = this.deviceStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => track.stop());
            }

            // Create media source from device stream
            this.deviceSource = this.audioContext.createMediaStreamSource(this.deviceStream);
            
            // Create analyzer if needed
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            // Connect device source to analyzer
            this.deviceSource.connect(this.analyser);
            
            this.isPlayingAudio = true;
            window.logToConsole('System audio capture enabled');
            return true;
        } catch (error) {
            console.error('Error setting up system audio capture:', error);
            window.logToConsole(`System audio error: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Initialize audio context and analyzer if needed
     */
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            console.log('Audio context initialized');
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    pauseAudio() {
        // Try to use audioProcessor if available
        if (window.audioProcessor && window.audioProcessor.audioElement) {
            window.audioProcessor.audioElement.pause();
            return true;
        }
        
        // Original implementation
        if (!this.isPlayingAudio || !this.audioSource) return false;
        
        try {
            this.audioSource.stop();
            this.isPlayingAudio = false;
            logToConsole('Paused audio');
            return true;
        } catch (error) {
            console.error("Error pausing audio:", error);
            return false;
        }
    }
    
    stopAudio() {
        // Use audioProcessor if available
        if (window.audioProcessor) {
            window.audioProcessor.stop();
            this.isPlayingAudio = false;
            return;
        }
        
        // Otherwise use internal audio handling
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
            this.audioSource = null;
        }
        
        this.isPlayingAudio = false;
    }

    pause() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Also pause audio if it's playing
        if (window.audioProcessor && window.audioProcessor.isPlaying) {
            window.audioProcessor.pause();
        } else if (this.interpreter && this.interpreter.isPlayingAudio) {
            this.interpreter.pauseAudio();
        }
        
        if (window.logToConsole) {
            window.logToConsole('Animation paused');
        }
    }

    drawImage(image, x, y, width = null, height = null) {
        if (!this.context) return;

        if (image) {
            // Load the image if it's a path
            if (typeof image === 'string') {
                image = this.loadImage(image);
            }

            if (image) {
                // Calculate dimensions if not provided
                if (!width) {
                    width = image.width;
                }
                if (!height) {
                    height = image.height;
                }
                // Draw the image at the specified position and size
                this.context.drawImage(image, x, y, width, height);
            } else {
                window.logToConsole(`Failed to load image: ${image}`, 'error');
            }
        } else {
            window.logToConsole(`Invalid image path: ${image}`, 'error');
        }
    }

    // Text rendering function
    text(content, x, y, size = 16, font = "Arial", align = "left", color = null) {
        if (!this.context) return;
        
        // Save current text settings
        const prevFont = this.context.font;
        const prevAlign = this.context.textAlign;
        const prevBaseline = this.context.textBaseline;
        const prevFillStyle = this.context.fillStyle;
        
        // Set new text properties
        this.context.font = `${size}px ${font}`;
        this.context.textAlign = align;
        this.context.textBaseline = "middle";
        
        // Use provided color or current fill style
        if (color) {
            this.context.fillStyle = color;
        }
        
        // Draw the text
        this.context.fillText(content, x, y);
        
        // Restore previous settings
        this.context.font = prevFont;
        this.context.textAlign = prevAlign;
        this.context.textBaseline = prevBaseline;
        this.context.fillStyle = prevFillStyle;
    }

    // FPS counter and retrieval
    initFpsCounter() {
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = performance.now();
    }
    
    updateFps() {
        // Initialize if needed
        if (this.frameCount === undefined) {
            this.initFpsCounter();
        }
        
        // Increment frame count
        this.frameCount++;
        
        // Update FPS approximately once per second
        const now = performance.now();
        const elapsed = now - this.lastFpsUpdate;
        
        if (elapsed >= 1000) {
            // Calculate fps: frames / elapsed time in seconds
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            
            // Reset for next update
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    getFps() {
        return this.fps || 0;
    }

    getAudioFrequency(targetFreq) {
        // Try to use audioProcessor if available
        if (window.audioProcessor) {
            return window.audioProcessor.getAudioFrequency(targetFreq);
        }
        
        // Original implementation
        if (!this.audioData || !this.analyser || !this.isPlayingAudio) return 0;
        
        try {
            // Get current audio data
            this.analyser.getByteFrequencyData(this.audioData);
            
            // Map the target frequency to an index in the frequency data
            const nyquist = this.audioContext.sampleRate / 2;
            const index = Math.round((targetFreq / nyquist) * this.audioData.length);
            
            // Return normalized value (0-1)
            return this.audioData[Math.min(index, this.audioData.length - 1)] / 255;
        } catch (e) {
            console.error("Error getting audio frequency:", e);
            return 0;
        }
    }

    // EFFECTS
    glowStart(color = null, size = 15) {
        if (!this.context) return;
        
        // Save the current shadow state to restore later
        this.savedShadowState = {
            blur: this.context.shadowBlur,
            color: this.context.shadowColor
        };
        
        // Set the new shadow properties
        this.context.shadowBlur = size;
        
        // Use provided color or default to current stroke/fill style
        if (color) {
            this.context.shadowColor = color;
        } else if (this.context.strokeStyle && this.context.strokeStyle !== '#000000') {
            this.context.shadowColor = this.context.strokeStyle;
        } else {
            this.context.shadowColor = this.context.fillStyle;
        }
        
        //window.logToConsole(`Glow started with color: ${this.context.shadowColor}, size: ${size}`);
    }
    
    glowEnd() {
        if (!this.context) return;
        
        // Restore the previous shadow state
        if (this.savedShadowState) {
            this.context.shadowBlur = this.savedShadowState.blur;
            this.context.shadowColor = this.savedShadowState.color;
            this.savedShadowState = null;
        } else {
            // If no saved state, just turn off shadow
            this.context.shadowBlur = 0;
        }
        
        //window.logToConsole('Glow ended');
    }
    
    // Add motion blur functions
    motionBlurStart(strength = 0.8, fade = 0.2) {
        if (!this.context) return;
        
        // Create a blur canvas if it doesn't exist
        if (!this.blurCanvas) {
            this.blurCanvas = document.createElement('canvas');
            this.blurCanvas.width = this.renderer.canvas.width;
            this.blurCanvas.height = this.renderer.canvas.height;
            this.blurContext = this.blurCanvas.getContext('2d');
        }
        
        // Save current rendering state
        this.savedCompositeState = {
            alpha: this.context.globalAlpha,
            composite: this.context.globalCompositeOperation
        };
        
        // Set motion blur properties
        this.motionBlurStrength = Math.max(0.1, Math.min(0.95, strength)); // Clamp between 0.1 and 0.95
        this.motionBlurFade = Math.max(0.01, Math.min(0.5, fade));        // Clamp between 0.01 and 0.5
        
        // Enable motion blur
        this.motionBlurActive = true;
        
        // Disable auto-clear in the renderer
        window.disableAutoClear = true;
        
        // Log activation
        console.log(`Motion blur activated: strength=${this.motionBlurStrength}, fade=${this.motionBlurFade}`);
    }
        
    motionBlurEnd() {
        if (!this.context) return;
        
        // Restore previous state
        if (this.savedCompositeState) {
            this.context.globalAlpha = this.savedCompositeState.alpha;
            this.context.globalCompositeOperation = this.savedCompositeState.composite;
            this.savedCompositeState = null;
        }
        
        // Disable motion blur
        this.motionBlurActive = false;
        
        // Re-enable auto-clear in the renderer
        window.disableAutoClear = false;
        
        // Clear the blur canvas
        if (this.blurContext) {
            this.blurContext.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
        }
        
        console.log("Motion blur deactivated");
    }
        
    // Rewritten apply function for more effective motion blur
    applyMotionBlur() {
        if (!this.motionBlurActive || !this.blurContext || !this.context) return;
    
        // Step 1: Capture the current frame before we modify anything
        const currentFrame = document.createElement('canvas');
        currentFrame.width = this.renderer.canvas.width;
        currentFrame.height = this.renderer.canvas.height;
        const currentContext = currentFrame.getContext('2d');
        currentContext.drawImage(this.renderer.canvas, 0, 0);
        
        // Step 2: Fade the current main canvas with the fade value
        this.context.fillStyle = `rgba(0,0,0,${this.motionBlurFade})`;
        this.context.globalCompositeOperation = "destination-out";
        this.context.fillRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
        this.context.globalCompositeOperation = "source-over";
        
        // Step 3: Capture this faded state to the blur canvas
        this.blurContext.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
        this.blurContext.drawImage(this.renderer.canvas, 0, 0);
        
        // Step 4: Clear the main canvas and draw the current frame
        this.context.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
        this.context.globalAlpha = 1.0;
        this.context.drawImage(this.blurCanvas, 0, 0); // Draw the faded previous frames
        this.context.drawImage(currentFrame, 0, 0);    // Draw the current frame on top
    }

    // Visualizers
    // Delegate visualizer methods to the visualizers class
    visualCircular(...args) {
        return this.visualizers.circularVisualizer(...args);
    }

    visualBar(...args) {
        return this.visualizers.barVisualizer(...args);
    }

    visualWaveform(...args) {
        return this.visualizers.waveformVisualizer(...args);
    }

    visualSpiral(...args) {
        return this.visualizers.spiralVisualizer(...args);
    }

    visualParticle(...args) {
        return this.visualizers.particleVisualizer(...args);
    }

    visualBubble(...args) {
        return this.visualizers.bubbleVisualizer(...args);
    }

    visualEyes(...args) {
        return this.visualizers.eyesVisualizer(...args);
    }

    visualDna(...args) {
        return this.visualizers.dnaVisualizer(...args);
    }

    visualConstellation(...args) {
        return this.visualizers.constellationVisualizer(...args);
    }

    visualFlame(...args) {
        return this.visualizers.flameVisualizer(...args);
    }

    visualLightning(...args) {
        return this.visualizers.lightningVisualizer(...args);
    }

    visualRipple(...args) {
        return this.visualizers.rippleVisualizer(...args);
    }

    visualTree(...args) {
        return this.visualizers.fractualTreeVisualizer(...args);
    }

    visualVortex(...args) {
        return this.visualizers.vortexVisualizer(...args);
    }

    visualMatrix(...args) {
        return this.visualizers.matrixVisualizer(...args);
    }

    visualSnake(...args) {
        return this.visualizers.snakeVisualizer(...args);
    }

    // Add the new visualizers we've implemented
    visualPlanetAndMoons(...args) {
        return this.visualizers.planetSystemVisualizer(...args);
    }

    visualFog(...args) {
        return this.visualizers.fogVisualizer(...args);
    }

    visualNebular(...args) {
        return this.visualizers.nebulaVisualizer(...args);
    }

    visualFishPond(...args) {
        return this.visualizers.fishPondVisualizer(...args);
    }

    visualRacingCars(...args) {
        return this.visualizers.racingCarsVisualizer(...args);
    }

    visual3DCircularBars(...args) {
        return this.visualizers.visualCircularBar3D(...args);
    }

    visualLavaLamp(...args) {
        return this.visualizers.visualLavaLamp(...args);
    }

    // 3D FUNCTIONS
    // Set camera position
    cameraPosition(x, y, z) {
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
    }
    
    // Set camera look-at target
    cameraLookAt(x, y, z) {
        this.camera.target.x = x;
        this.camera.target.y = y;
        this.camera.target.z = z;
    }
    
    // Set camera field of view
    cameraFov(degrees) {
        this.camera.fov = Math.max(1, Math.min(180, degrees));
        this.updateProjectionMatrix();
    }
    
    // Set camera zoom
    cameraZoom(factor) {
        this.camera.zoom = Math.max(0.1, factor);
    }
    
    // Create a 3D point
    point3D(x, y, z, size = 3, color = null) {
        const point = { x, y, z, size, color };
        this.points3D.push(point);
        return point;
    }
    
    // Clear all 3D points and render queues
    clear3D() {
        this.points3D = [];
        this.lineRenderQueue = []; // Clear any pending 3D lines
        
        // Reset depth buffer
        if (this.depthBuffer) {
            this.depthBuffer.clear();
        }
    }

    draw3D() {
        if (!this.context || !this.renderer || !this.renderer.canvas) return;
        
        // Draw all points with depth testing
        this.drawPoints3D();
        
        // Process and draw all lines and other 3D objects
        this.processRenderQueue();
    }

    drawPoints3D() {
        if (!this.context || !this.renderer || !this.renderer.canvas) return;
        
        // Update depth buffer if needed
        this.updateDepthBuffer();
        
        // Clear depth buffer for points
        this.depthBuffer.clear();
        
        const ctx = this.context;
        ctx.save();
        
        // Sort points by z-depth (far to near)
        const sortedPoints = [...this.points3D].sort((a, b) => {
            const projA = this.projectPoint(a);
            const projB = this.projectPoint(b);
            return projB.z - projA.z;
        });
        
        // Draw points with depth testing
        for (const point of sortedPoints) {
            const projected = this.projectPoint(point);
            
            if (projected.visible) {
                // Calculate size based on z-distance
                const size = point.size * (this.camera.far / (projected.z + this.camera.near));
                
                // Set color if specified
                if (point.color) ctx.fillStyle = point.color;
                
                // Draw the point
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    // Connect 3D points with lines
    line3D(point1, point2, color = null, lineWidth = 1) {
        if (!this.context || !this.renderer) return;
        
        // Validate input points
        if (!point1 || !point2 || 
            typeof point1.x !== 'number' || typeof point1.y !== 'number' || typeof point1.z !== 'number' ||
            typeof point2.x !== 'number' || typeof point2.y !== 'number' || typeof point2.z !== 'number') {
            console.warn('Invalid points provided to line3D', point1, point2);
            return;
        }
        
        // Project both points to screen space
        const proj1 = this.projectPoint(point1);
        const proj2 = this.projectPoint(point2);

        const NEAR_PLANE_EPSILON = 0.0001;
        
        // Use z-coordinate relative to near plane for clipping checks
        const p1_behind = proj1.z <= this.camera.near;
        const p2_behind = proj2.z <= this.camera.near;

        // Both points are behind or exactly on the near plane - completely clipped
        if (p1_behind && p2_behind) {
            return;
        }

        let p1 = proj1;
        let p2 = proj2;

        // Clip the line segment if one point is behind/on the near plane and the other is in front
        if (p1_behind && !p2_behind) { // Point 1 needs clipping
            p1 = this.clipLineToNearPlane(point1, point2); // Pass original 3D points
            if (!p1 || isNaN(p1.x) || isNaN(p1.y)) return; // Check if clipping failed
        } else if (!p1_behind && p2_behind) { // Point 2 needs clipping
            p2 = this.clipLineToNearPlane(point2, point1); // Pass original 3D points
            if (!p2 || isNaN(p2.x) || isNaN(p2.y)) return; // Check if clipping failed
        }
        // If neither needed clipping, p1 and p2 remain proj1 and proj2

        // Skip lines with invalid screen coordinates after potential clipping
        if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) {
            // console.warn("Skipping line with NaN coordinates after clipping:", p1, p2);
            return;
        }
        
        // Additional bounds check - skip lines that are way off screen
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        const margin = Math.max(width, height) * 2; // Allow generous margin
        
        // Check if both points are way outside the margin
        const p1_out = p1.x < -margin || p1.x > width + margin || p1.y < -margin || p1.y > height + margin;
        const p2_out = p2.x < -margin || p2.x > width + margin || p2.y < -margin || p2.y > height + margin;

        if (p1_out && p2_out) {
             // console.log("Skipping line far off screen");
             return; // Skip if both points are far off-screen
        }
        
        // Calculate Z-depth for sorting (use midpoint of original Z values before clipping for stability)
        const avgZ = (proj1.z + proj2.z) / 2; // Use original projected Z for depth sorting
        
        // Add to render queue
        this.lineRenderQueue = this.lineRenderQueue || [];
        this.lineRenderQueue.push({
            type: 'line',
            point1: p1, // Use potentially clipped screen coordinates
            point2: p2, // Use potentially clipped screen coordinates
            color: color,
            lineWidth: lineWidth,
            z: avgZ // Use average original depth for sorting
        });
    }

    clipLineToNearPlane(behindPoint, visiblePoint) {
        // Ensure we have valid parameters
        if (!behindPoint || !visiblePoint) {
            console.warn("clipLineToNearPlane received invalid points");
            return null;
        }
        
        try {
            // Camera forward vector - direction the camera is looking
            const forward = {
                x: this.camera.target.x - this.camera.position.x,
                y: this.camera.target.y - this.camera.position.y,
                z: this.camera.target.z - this.camera.position.z
            };
            
            // Normalize forward vector
            const forwardLength = Math.sqrt(
                forward.x * forward.x + 
                forward.y * forward.y + 
                forward.z * forward.z
            );
            
            if (forwardLength < 0.0001) {
                console.warn("clipLineToNearPlane: Invalid camera setup (target == position)");
                return null; // Invalid camera setup
            }
            
            forward.x /= forwardLength;
            forward.y /= forwardLength;
            forward.z /= forwardLength;
            
            // Vector from camera to behind point
            const camToBehind = {
                x: behindPoint.x - this.camera.position.x,
                y: behindPoint.y - this.camera.position.y,
                z: behindPoint.z - this.camera.position.z
            };
            
            // Vector from camera to visible point
            const camToVisible = {
                x: visiblePoint.x - this.camera.position.x,
                y: visiblePoint.y - this.camera.position.y,
                z: visiblePoint.z - this.camera.position.z
            };
            
            // Calculate dot products with camera forward (distance along camera view direction)
            const behindDist = camToBehind.x * forward.x + camToBehind.y * forward.y + camToBehind.z * forward.z;
            const visibleDist = camToVisible.x * forward.x + camToVisible.y * forward.y + camToVisible.z * forward.z;
            
            // If visible point is actually behind or on near plane, something is wrong
            if (visibleDist <= this.camera.near) {
                 console.warn("clipLineToNearPlane: 'visiblePoint' is not actually beyond near plane.", visibleDist, this.camera.near);
                 return null;
            }
            // If behind point is actually in front of near plane, something is wrong
            if (behindDist >= this.camera.near) {
                 console.warn("clipLineToNearPlane: 'behindPoint' is not actually behind near plane.", behindDist, this.camera.near);
                 // It might be exactly on the plane, try projecting it directly
                 const projBehind = this.projectPoint(behindPoint);
                 if (!isNaN(projBehind.x) && !isNaN(projBehind.y)) return projBehind;
                 return null;
            }

            // Calculate interpolation factor 't' where the line intersects the near plane
            // t = (NearPlaneDist - BehindDist) / (VisibleDist - BehindDist)
            const t = (this.camera.near - behindDist) / (visibleDist - behindDist);
            
            // Safety bounds check for t parameter (should be between 0 and 1)
            if (t < -0.0001 || t > 1.0001) { // Allow small tolerance
                console.warn("clipLineToNearPlane: Invalid interpolation factor t:", t);
                return null; // Intersection outside line segment
            }
            
            // Clamp t to [0, 1] just in case
            const clampedT = Math.max(0, Math.min(1, t));

            // Calculate intersection point in world space by interpolating original points
            const intersection = {
                x: behindPoint.x + (visiblePoint.x - behindPoint.x) * clampedT,
                y: behindPoint.y + (visiblePoint.y - behindPoint.y) * clampedT,
                z: behindPoint.z + (visiblePoint.z - behindPoint.z) * clampedT
            };
            
            // Project the calculated intersection point
            const projected = this.projectPoint(intersection);
            
            // Final safety check for the projected point
            if (isNaN(projected.x) || isNaN(projected.y)) {
                console.warn("clipLineToNearPlane: Projection of intersection resulted in NaN.", intersection, projected);
                return null;
            }
            
            // Return the projected screen coordinates {x, y, z, visible}
            return projected;
            
        } catch (e) {
            console.error("Error in clipLineToNearPlane:", e);
            return null;
        }
    }
    
    // Create a 3D grid
    grid3D(size = 100, divisions = 10, colorMajor = '#444444', colorMinor = '#222222') {
        const halfSize = size / 2;
        const step = size / divisions;
        
        // Create grid lines on XY plane (with Z=0)
        for (let i = -halfSize; i <= halfSize; i += step) {
            const isMajor = Math.abs(i) < 0.001 || Math.abs(Math.abs(i) - halfSize) < 0.001;
            const color = isMajor ? colorMajor : colorMinor;
            
            // X-axis grid lines
            const p1x = { x: -halfSize, y: i, z: 0 };
            const p2x = { x: halfSize, y: i, z: 0 };
            this.line3D(p1x, p2x, color, isMajor ? 1.5 : 0.5);
            
            // Y-axis grid lines
            const p1y = { x: i, y: -halfSize, z: 0 };
            const p2y = { x: i, y: halfSize, z: 0 };
            this.line3D(p1y, p2y, color, isMajor ? 1.5 : 0.5);
        }
    }
    
    // Create a 3D axis visualization
    axes3D(size = 100) {
        const origin = { x: 0, y: 0, z: 0 };
        
        // X-axis (red)
        const xAxis = { x: size, y: 0, z: 0 };
        this.line3D(origin, xAxis, '#FF0000', 2);
        
        // Y-axis (green) - now forward/back
        const yAxis = { x: 0, y: size, z: 0 };
        this.line3D(origin, yAxis, '#00FF00', 2);
        
        // Z-axis (blue) - now up/down
        const zAxis = { x: 0, y: 0, z: size };
        this.line3D(origin, zAxis, '#0000FF', 2);
    }

    // Draw a 3D triangle with depth testing
    triangle3D(point1, point2, point3, color = null) {
        if (!this.context || !this.renderer) return;
        
        const proj1 = this.projectPoint(point1);
        const proj2 = this.projectPoint(point2);
        const proj3 = this.projectPoint(point3);
        
        // Skip if any point is behind the camera
        if (!proj1.visible || !proj2.visible || !proj3.visible) return;
        
        // Calculate average depth for sorting
        const avgZ = (proj1.z + proj2.z + proj3.z) / 3;
        
        // Add to render queue
        this.lineRenderQueue = this.lineRenderQueue || [];
        this.lineRenderQueue.push({
            type: 'triangle',
            points: [proj1, proj2, proj3],
            color: color,
            z: avgZ
        });
    }
    
    // Create a 3D cube with proper depth testing
    cube3D(x = 0, y = 0, z = 0, size = 100, color = '#FFFFFF', wireframe = true) {
        const halfSize = size / 2;
        
        // Define the 8 vertices of the cube
        const vertices = [
            { x: x - halfSize, y: y - halfSize, z: z - halfSize }, // 0: bottom-left-back
            { x: x + halfSize, y: y - halfSize, z: z - halfSize }, // 1: bottom-right-back
            { x: x + halfSize, y: y + halfSize, z: z - halfSize }, // 2: top-right-back
            { x: x - halfSize, y: y + halfSize, z: z - halfSize }, // 3: top-left-back
            { x: x - halfSize, y: y - halfSize, z: z + halfSize }, // 4: bottom-left-front
            { x: x + halfSize, y: y - halfSize, z: z + halfSize }, // 5: bottom-right-front
            { x: x + halfSize, y: y + halfSize, z: z + halfSize }, // 6: top-right-front
            { x: x - halfSize, y: y + halfSize, z: z + halfSize }  // 7: top-left-front
        ];
        
        if (wireframe) {
            // Define the 12 edges of the cube as pairs of vertex indices
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0], // back face
                [4, 5], [5, 6], [6, 7], [7, 4], // front face
                [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
            ];
            
            // Draw wireframe by connecting vertices with lines
            for (const [i, j] of edges) {
                this.line3D(vertices[i], vertices[j], color, 1);
            }
        } else {
            // Define the 6 faces of the cube
            const faces = [
                [0, 1, 2, 3], // back face
                [4, 5, 6, 7], // front face
                [0, 3, 7, 4], // left face
                [1, 2, 6, 5], // right face
                [0, 1, 5, 4], // bottom face
                [3, 2, 6, 7]  // top face
            ];
            
            // Calculate a simple lighting factor for each face
            const lightDir = { x: 0.5, y: -0.7, z: 0.5 }; // Light direction
            
            // Create triangles for each face for depth sorting
            const triangles = [];
            
            // Process each face
            for (const face of faces) {
                const faceVertices = face.map(idx => vertices[idx]);
                
                // Calculate face normal
                const v1 = {
                    x: faceVertices[1].x - faceVertices[0].x,
                    y: faceVertices[1].y - faceVertices[0].y,
                    z: faceVertices[1].z - faceVertices[0].z
                };
                
                const v2 = {
                    x: faceVertices[2].x - faceVertices[0].x,
                    y: faceVertices[2].y - faceVertices[0].y,
                    z: faceVertices[2].z - faceVertices[0].z
                };
                
                // Cross product for normal
                const normal = {
                    x: v1.y * v2.z - v1.z * v2.y,
                    y: v1.z * v2.x - v1.x * v2.z,
                    z: v1.x * v2.y - v1.y * v2.x
                };
                
                // Normalize
                const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
                if (len > 0) {
                    normal.x /= len;
                    normal.y /= len;
                    normal.z /= len;
                }
                
                // Face center point
                const center = {
                    x: (faceVertices[0].x + faceVertices[1].x + faceVertices[2].x + faceVertices[3].x) / 4,
                    y: (faceVertices[0].y + faceVertices[1].y + faceVertices[2].y + faceVertices[3].y) / 4,
                    z: (faceVertices[0].z + faceVertices[1].z + faceVertices[2].z + faceVertices[3].z) / 4
                };
                
                // Vector from face center to camera
                const toCam = {
                    x: this.camera.position.x - center.x,
                    y: this.camera.position.y - center.y,
                    z: this.camera.position.z - center.z
                };
                
                // Normalize
                const camDist = Math.sqrt(toCam.x * toCam.x + toCam.y * toCam.y + toCam.z * toCam.z);
                if (camDist > 0) {
                    toCam.x /= camDist;
                    toCam.y /= camDist;
                    toCam.z /= camDist;
                }
                
                // Backface culling - only show faces that face the camera
                const facingCamera = normal.x * toCam.x + normal.y * toCam.y + normal.z * toCam.z;
                
                if (facingCamera > 0) {
                    // Calculate lighting
                    let dotProduct = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;
                    dotProduct = Math.max(0.2, dotProduct); // Ambient light at 0.2
                    
                    // Parse color
                    let r, g, b;
                    if (color.startsWith('#')) {
                        r = parseInt(color.slice(1, 3), 16);
                        g = parseInt(color.slice(3, 5), 16);
                        b = parseInt(color.slice(5, 7), 16);
                    } else {
                        r = g = b = 255; // Default white
                    }
                    
                    // Apply lighting
                    const shadedColor = `rgb(${Math.floor(r * dotProduct)}, ${Math.floor(g * dotProduct)}, ${Math.floor(b * dotProduct)})`;
                    
                    // For now we still just draw the outlines since we don't have filled polygon rendering
                    // But we properly sort and depth test
                    for (let i = 0; i < faceVertices.length; i++) {
                        const j = (i + 1) % faceVertices.length;
                        this.line3D(faceVertices[i], faceVertices[j], shadedColor, 1);
                    }
                    
                    // Store the triangle data for future solid rendering
                    triangles.push({
                        vertices: faceVertices,
                        center: center,
                        normal: normal,
                        color: shadedColor,
                        depth: camDist
                    });
                }
            }
        }
    }
    
    // Create a 3D sphere approximation using points
    sphere3D(x = 0, y = 0, z = 0, radius = 50, detail = 15, color = '#FFFFFF') {
        // Create points on a sphere using spherical coordinates
        for (let i = 0; i <= detail; i++) {
            const theta = (i / detail) * Math.PI; // latitude
            
            for (let j = 0; j <= detail; j++) {
                const phi = (j / detail) * 2 * Math.PI; // longitude
                
                // Convert spherical to cartesian coordinates
                const px = x + radius * Math.sin(theta) * Math.cos(phi);
                const py = y + radius * Math.sin(theta) * Math.sin(phi);
                const pz = z + radius * Math.cos(theta);
                
                // Add the point
                this.point3D(px, py, pz, 1, color);
            }
        }
    }
    
    // 3D audio visualizer
    visualize3D(x = 0, y = 0, z = 0, size = 200, detail = 15, freqStart = 20, freqEnd = 2000) {
        // Check for audio processor
        if (!window.audioProcessor) return;
        
        // Set step size
        const step = (freqEnd - freqStart) / detail;
        
        for (let i = 0; i <= detail; i++) {
            const freq = freqStart + i * step;
            const amplitude = window.audioProcessor.getAudioFrequency(freq) * size;
            
            // Convert to 3D coordinates - creating a ring of points
            const theta = (i / detail) * Math.PI * 2;
            const px = x + amplitude * Math.cos(theta);
            const py = y + amplitude * Math.sin(theta);
            const pz = z;
            
            // Color based on frequency (low frequency = red, high frequency = blue)
            const hue = 240 * (i / detail);
            const color = `hsl(${hue}, 100%, 50%)`;
            
            // Add the point
            this.point3D(px, py, pz, 3, color);
        }
    }

    // Process the line render queue with depth sorting
    processRenderQueue() {
        if (!this.lineRenderQueue || this.lineRenderQueue.length === 0) return;
        
        // Sort by depth, far to near
        this.lineRenderQueue.sort((a, b) => b.z - a.z);
        
        // Draw in sorted order
        for (const item of this.lineRenderQueue) {
            this.drawLine3D(item);
        }
        
        // Clear queue after drawing
        this.lineRenderQueue = [];
    }

    // Draw a single 3D line from the render queue
    drawLine3D(lineItem) {
        if (!this.context) return;
        
        const { point1, point2, color, lineWidth } = lineItem;
        
        // Skip invalid lines
        if (!point1 || !point2 || 
            isNaN(point1.x) || isNaN(point1.y) || isNaN(point2.x) || isNaN(point2.y)) {
            return;
        }
        
        // Skip lines that are likely errors (extremely long lines that would go to corner of screen)
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;
        const maxAllowedLength = Math.max(width, height) * 2; // Allow reasonably long lines
        
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const lineLength = Math.sqrt(dx*dx + dy*dy);
        
        if (lineLength > maxAllowedLength) {
            // console.log("Skipping suspiciously long line:", lineLength, point1, point2);
            return;
        }
        
        const ctx = this.context;
        ctx.save();
        
        if (color) ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth || 1;
        
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Function for orbiting the camera around a target point
    orbitCamera(angleX, angleY, distance) {
        // Convert angles to radians
        const radX = (angleX % 360) * Math.PI / 180;
        const radY = Math.max(-89, Math.min(89, angleY)) * Math.PI / 180;
        
        // For Z-up system with correct math:
        // X = distance * cos(angleY) * sin(angleX)
        // Y = distance * cos(angleY) * cos(angleX)
        // Z = distance * sin(angleY)
        const x = this.camera.target.x + distance * Math.cos(radY) * Math.sin(radX);
        const y = this.camera.target.y + distance * Math.cos(radY) * Math.cos(radX);
        const z = this.camera.target.z + distance * Math.sin(radY);
        
        // Update camera position
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
        
        // Update projection matrix
        this.updateProjectionMatrix();
    }

    // Add a new method to register audio files
    registerAudioFile(name, url) {
        if (!this.audioFiles) {
            this.audioFiles = {};
        }
        this.audioFiles[name] = url;
    }
}
