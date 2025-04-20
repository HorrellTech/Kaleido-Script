/**
 * Keywords for KaleidoScript Code Editor
 * Organized by category for easier management
 */

// Global canvas/renderer functions
const canvasFunctions = {
    width: {
        name: 'width',
        description: 'Returns the current canvas width in pixels.',
        example: 'const w = width; // Get canvas width',
        category: 'canvas'
    },
    height: {
        name: 'height',
        description: 'Returns the current canvas height in pixels.',
        example: 'const h = height; // Get canvas height',
        category: 'canvas'
    },
    size: {
        name: 'size(width, height)',
        description: 'Resizes the canvas to the specified dimensions.',
        example: 'size(800, 600); // Set canvas to 800x600 pixels',
        category: 'canvas'
    },
    context: {
        name: 'context',
        description: 'Returns the canvas 2D rendering context.',
        example: 'const ctx = context; // Get raw drawing context',
        category: 'canvas'
    },
    canvas: {
        name: 'canvas',
        description: 'Returns the canvas DOM element.',
        example: 'const cnv = canvas; // Get canvas element',
        category: 'canvas'
    }
};

// Mouse input functions 
const mouseFunctions = {
    mouseX: {
        name: 'mouseX()',
        description: 'Returns the current mouse X position relative to the canvas.',
        example: 'circle(mouseX(), mouseY(), 20); // Draw circle at mouse position',
        category: 'input'
    },
    mouseY: {
        name: 'mouseY()',
        description: 'Returns the current mouse Y position relative to the canvas.',
        example: 'circle(mouseX(), mouseY(), 20); // Draw circle at mouse position',
        category: 'input'
    }
};

// Drawing functions
const drawingFunctions = {
    // Basic shapes
    circle: {
        name: 'circle(x, y, radius, [outline])',
        description: 'Draws a circle at position (x,y) with the specified radius.',
        example: 'circle(400, 300, 50); // Draw filled circle at center',
        category: 'shapes'
    },
    rect: {
        name: 'rect(x, y, width, height, [outline])',
        description: 'Draws a rectangle with top-left corner at (x,y).',
        example: 'rect(100, 100, 200, 150); // Draw filled rectangle',
        category: 'shapes'
    },
    line: {
        name: 'line(x1, y1, x2, y2)',
        description: 'Draws a line from point (x1,y1) to point (x2,y2).',
        example: 'line(100, 100, 300, 300); // Draw diagonal line',
        category: 'shapes'
    },

    text: { // text(content, x, y, size = 16, font = "Arial", align = "left", color = null)
        name: 'text(content, x, y, size, font, align, color)',
        description: 'Draws text at position (x,y) with specified size and font.',
        example: 'text("Hello World", 200, 200, 32, "Arial", "center", "black");',
        category: 'shapes'
    },

    // Color and style
    background: {
        name: 'background(r, g, b)',
        description: 'Sets the background color using RGB values (0-255).',
        example: 'background(20, 20, 40); // Dark blue background',
        category: 'color'
    },
    color: {
        name: 'color(value)',
        description: 'Sets the current drawing color. Can use names, hex, or RGB.',
        example: 'color(\'red\'); // or color(\'#FF0000\');',
        category: 'color'
    },
    fill: {
        name: 'fill(r, g, b, [alpha])',
        description: 'Sets the fill color using RGB values (0-255).',
        example: 'fill(255, 0, 0); // Red fill color',
        category: 'color'
    },
    stroke: {
        name: 'stroke(r, g, b, [alpha])',
        description: 'Sets the stroke color using RGB values (0-255).',
        example: 'stroke(0, 0, 0); // Black stroke color',
        category: 'color'
    },
    brush: {
        name: 'brush(r, g, b, [alpha])',
        description: 'Sets the brush color using RGB values (0-255).',
        example: 'brush(0, 0, 0); // Black stroke color',
        category: 'color'
    },
    lineWidth: {
        name: 'lineWidth(width)',
        description: 'Sets the line width for strokes and outlines.',
        example: 'lineWidth(3); // 3 pixel line width',
        category: 'color'
    },
    clear: {
        name: 'clear()',
        description: 'Clears the entire canvas.',
        example: 'clear(); // Clear everything',
        category: 'utility'
    },

    // Gglow and motion blur functions
    glowStart: {
        name: 'glowStart(color, size)',
        description: 'Starts a glow effect for all subsequent shapes until glowEnd() is called.',
        example: 'glowStart("orange", 15); // Orange glow with size 15',
        category: 'effects'
    },
    glowEnd: {
        name: 'glowEnd()',
        description: 'Ends the glow effect started with glowStart().',
        example: 'glowEnd(); // Turn off glow effect',
        category: 'effects'
    },
    motionBlurStart: {
        name: 'motionBlurStart(alpha, composite)',
        description: 'Starts a motion blur effect for subsequent shapes, with alpha transparency and blend mode.',
        example: 'motionBlurStart(0.2, "lighter"); // Light motion trails',
        category: 'effects'
    },
    motionBlurEnd: {
        name: 'motionBlurEnd()',
        description: 'Ends the motion blur effect started with motionBlurStart().',
        example: 'motionBlurEnd(); // Turn off motion blur',
        category: 'effects'
    },
    loadImage: {
        name: 'loadImage(imagePath)',
        description: 'Loads an image from the specified path.',
        example: 'var image = loadImage("image.png"); // Load image file',
        category: 'color'
    },
};

// Turtle graphics functions
const turtleFunctions = {
    beginTurtle: {
        name: 'beginTurtle(x, y)',
        description: 'Creates a new turtle at the specified position (x,y).',
        example: 'beginTurtle(width/2, height/2);',
        category: 'turtle'
    },
    forward: {
        name: 'forward(distance)',
        description: 'Moves the turtle forward by the specified distance.',
        example: 'forward(100);',
        category: 'turtle'
    },
    turn: {
        name: 'turn(degrees)',
        description: 'Rotates the turtle by the specified degrees (positive = clockwise).',
        example: 'turn(90); // Turn right',
        category: 'turtle'
    },
    setTurtleColor: {
        name: 'setTurtleColor(color)',
        description: 'Sets the color of the turtle\'s path. Takes a color name, hex code, or rgb/rgba value.',
        example: 'setTurtleColor("#ff0000"); // Red path',
        category: 'turtle'
    },
    endTurtle: {
        name: 'endTurtle()',
        description: 'Ends the turtle drawing mode and closes the current path.',
        example: 'endTurtle();',
        category: 'turtle'
    }
};

// Audio functions
const audioFunctions = {
    loadAudio: {
        name: 'loadAudio(filename)',
        description: 'Loads an audio file that was imported into the project.',
        example: 'loadAudio("music.mp3");',
        category: 'audio'
    },
    playAudio: {
        name: 'playAudio()',
        description: 'Plays the currently loaded audio file.',
        example: 'playAudio();',
        category: 'audio'
    },
    pauseAudio: {
        name: 'pauseAudio()',
        description: 'Pauses the currently playing audio.',
        example: 'pauseAudio();',
        category: 'audio'
    },
    audioLoad: {
        name: 'audioLoad(filename)',
        description: 'Loads an audio file that was imported into the project.',
        example: 'audioLoad("music.mp3");',
        category: 'audio'
    },
    audioPlay: {
        name: 'audioPlay()',
        description: 'Plays the currently loaded audio file.',
        example: 'audioPlay();',
        category: 'audio'
    },
    audioPause: {
        name: 'audioPause()',
        description: 'Pauses the currently playing audio.',
        example: 'audioPause();',
        category: 'audio'
    },
    audioFromMic: {
        name: 'audioFromMic(enable)',
        description: 'Enables or disables audio input from the microphone for visualization.',
        example: 'audioFromMic(true); // Enable microphone input',
        category: 'audio'
    },
    audioVolume: {
        name: 'audioVolume(value)',
        description: 'Sets the volume level of the audio.',
        example: 'audioVolume(80); // Set current volume',
        category: 'audio'
    },
    getAudioVolume: {
        name: 'getAudioVolume()',
        description: 'Gets the current volume level of the audio.',
        example: 'let volume = getAudioVolume(); // Get current volume',
        category: 'audio'
    },
    audioFromDevice: {
        name: 'audioFromDevice(enable)',
        description: 'Enables or disables system audio capture (what\'s playing on your device) for visualization. Requires screen sharing permission with "Share system audio" checked.',
        example: 'audioFromDevice(true); // Enable system audio capture',
        category: 'audio'
    },
    audiohz: {
        name: 'audiohz(frequency)',
        description: 'Gets the amplitude at a specific frequency from audio.',
        example: 'let bass = audiohz(100); // Get bass frequency amplitude',
        category: 'audio'
    }
};

// Math functions that are useful for animations
const mathFunctions = {
    sin: {
        name: 'Math.sin(angle)',
        description: 'Returns the sine of an angle (in radians).',
        example: 'Math.sin(time); // Oscillating value between -1 and 1',
        category: 'math'
    },
    cos: {
        name: 'Math.cos(angle)',
        description: 'Returns the cosine of an angle (in radians).',
        example: 'Math.cos(time); // Oscillating value between -1 and 1',
        category: 'math'
    },
    random: {
        name: 'Math.random()',
        description: 'Returns a random number between 0 (inclusive) and 1 (exclusive).',
        example: 'Math.random() * 100; // Random number between 0-100',
        category: 'math'
    },
    PI: {
        name: 'Math.PI',
        description: 'Mathematical constant representing π (pi), approximately 3.14159.',
        example: 'Math.sin(time * Math.PI); // Full oscillation every 2 seconds',
        category: 'math'
    }
};

// Audio visualizer functions
const visualizerFunctions = {
    visualBackgroundImage: {
        name: 'visualBackgroundImage(imagePath, mode, reactivity, pulseColor)',
        description: 'Sets a background image with options for sizing and audio reactivity. mode: "fill", "fit", "stretch", "tile". Reactivity: 0-1 (0 = no reactivity, 1 = full reactivity).',
        example: 'backgroundImage("landscape.jpg", "fill", 0.3, "#FF5500");',
        category: 'visualizer'
    },
    visualCenterImage: {
        name: 'visualCenterImage(imagePath, size, reactivity, glowColor)',
        description: 'Draws a circular image centered on the canvas that pulses with audio. The image is cropped to fit in a circle.',
        example: 'visualCenterImage("album-cover.jpg", 200, 0.5, "#FFFFFF");',
        category: 'visualizer'
    },
    visualCircular: {
        name: 'visualCircular(x, y, minRadius, maxRadius, pointCount, freqStart, freqEnd, rotation, glow)',
        description: 'Creates a circular audio visualizer that expands and contracts with sound.',
        example: 'visualCircular(width/2, height/2, 100, 200, 64, 20, 2000, time*0.001, true);',
        category: 'visualizer'
    },
    visualBar: {
        name: 'visualBar(x, y, width, height, barCount, spacing, minHeight, rotation, mirror, glow)',
        description: 'Creates classic equalizer-style bars that react to audio frequencies.',
        example: 'visualBar(0, height/2, width, 200, 32, 2, 5, 0, true, true);',
        category: 'visualizer'
    },
    visualWaveform: {
        name: 'visualWaveform(x, y, width, height, detail, lineWidth, glow)',
        description: 'Displays audio frequencies as a continuous waveform line.',
        example: 'visualWaveform(0, height/2, width, 100, 100, 2, true);',
        category: 'visualizer'
    },
    visualSpiral: {
        name: 'visualSpiral(x, y, startRadius, spacing, turns, pointCount, freqStart, freqEnd, rotation, glow)',
        description: 'Creates a spiral pattern that rotates and reacts to audio frequencies.',
        example: 'visualSpiral(width/2, height/2, 20, 10, 5, 100, 20, 2000, time*0.001, true);',
        category: 'visualizer'
    },
    visualParticle: {
        name: 'visualParticle(x, y, width, height, particleCount, freqStart, freqEnd, glow)',
        description: 'Creates floating particles that move and pulse with the music.',
        example: 'visualParticle(0, 0, width, height, 100, 20, 2000, true);',
        category: 'visualizer'
    },
    visualBubble: {
        name: 'visualBubble(x, y, width, height, bubbleCount, minSize, maxSize, freqStart, freqEnd, glow)',
        description: 'Generates rising bubbles that change size and color with audio.',
        example: 'visualBubble(0, 0, width, height, 20, 10, 50, 20, 2000, true);',
        category: 'visualizer'
    },
    visualEyes: {
        name: 'visualEyes(x, y, width, height, eyeCount, eyeSize, fadeSpeed, freqStart, freqEnd)',
        description: 'Creates spooky eyes that fade in/out and look around based on audio.',
        example: 'visualEyes(0, 0, width, height, 5, 30, 0.02, 20, 2000);',
        category: 'visualizer'
    },
    visualDna: {
        name: 'visualDna(x, y, width, height, strandCount, detail, spacing, freqStart, freqEnd, rotation, glow)',
        description: 'Generates a DNA helix pattern that twists and morphs with audio.',
        example: 'visualDna(0, 0, width, height, 10, 50, 20, 20, 2000, time*0.001, true);',
        category: 'visualizer'
    },
    visualConstellation: {
        name: 'visualConstellation(x, y, width, height, starCount, connectionRadius, freqStart, freqEnd, glow)',
        description: 'Creates a network of stars that connect and pulse with the music.',
        example: 'visualConstellation(0, 0, width, height, 30, 100, 20, 2000, true);',
        category: 'visualizer'
    },
    visualFlame: {
        name: 'visualFlame(x, y, width, height, flameCount, freqStart, freqEnd, glow)',
        description: 'Generates dynamic flames that dance and flicker with audio.',
        example: 'visualFlame(0, 0, width, height, 50, 20, 2000, true);',
        category: 'visualizer'
    },
    visualLightning: {
        name: 'visualLightning(x, y, width, height, boltCount, branchCount, freqStart, freqEnd, glow)',
        description: 'Creates electric arcs that spark and branch with audio peaks.',
        example: 'visualLightning(0, 0, width, height, 3, 4, 20, 2000, true);',
        category: 'visualizer'
    },
    visualRipple: {
        name: 'visualRipple(x, y, width, height, rippleCount, freqStart, freqEnd, glow)',
        description: 'Generates expanding circular waves that pulse with the music.',
        example: 'visualRipple(0, 0, width, height, 5, 20, 2000, true);',
        category: 'visualizer'
    },
    visualTree: {
        name: 'visualTree(x, y, length, angle, depth, freqStart, freqEnd, glow)',
        description: 'Creates a recursive tree pattern that grows and sways with audio.',
        example: 'visualTree(width/2, height, 100, Math.PI/2, 8, 20, 2000, true);',
        category: 'visualizer'
    },
    visualVortex: {
        name: 'visualVortex(x, y, radius, rings, pointsPerRing, freqStart, freqEnd, rotation, glow)',
        description: 'Generates a swirling vortex pattern that rotates and warps with sound.',
        example: 'visualVortex(width/2, height/2, 200, 5, 20, 20, 2000, time*0.001, true);',
        category: 'visualizer'
    },
    visualMatrix: {
        name: 'visualMatrix(x, y, width, height, columns, freqStart, freqEnd, glow)',
        description: 'Creates Matrix-style falling characters that react to audio.',
        example: 'visualMatrix(0, 0, width, height, 30, 20, 2000, true);',
        category: 'visualizer'
    },
    visualSnake: {
        name: 'visualSnake(x, y, width, height, snakeCount, appleCount, freqStart, freqEnd, glow)',
        description: 'Creates audio-reactive snakes that chase apples and respond to music intensity.',
        example: 'visualSnake(0, 0, width, height, 8, 5, 20, 2000, true);',
        category: 'visualizer'
    },
    // Add new visualizers
    visualPlanetAndMoons: {
        name: 'visualPlanetAndMoons(x, y, planetSize, moonCount, minMoonSize, maxMoonSize, minOrbitRadius, maxOrbitRadius, planetColor, moonColors, bassFreq, highFreqStart, highFreqEnd, glow)',
        description: 'Creates a planet with orbiting moons that respond to audio frequencies.',
        example: 'visualPlanetAndMoons(width/2, height/2, 70, 8, 5, 15, 100, 250, "#ff9900", null, 60, 500, 2000, true);',
        category: 'visualizer'
    },
    visualFog: {
        name: 'visualFog(x, y, width, height, cloudCount, minSize, maxSize, speedFactor, freqStart, freqEnd, density, color, glow)',
        description: 'Creates a dynamic fog effect that responds to audio.',
        example: 'visualFog(0, 0, width, height, 15, 80, 200, 1, 20, 200, 0.5, "rgba(255, 255, 255, 0.3)", false);',
        category: 'visualizer'
    },
    visualNebular: {
        name: 'visualNebular(x, y, width, height, density, starCount, hue, freqStart, freqEnd, glow)',
        description: 'Creates a cosmic nebula with stars that shift and glow with audio.',
        example: 'visualNebular(0, 0, width, height, 5, 100, 240, 20, 2000, true);',
        category: 'visualizer'
    },
    visualFishPond: {
        name: 'visualFishPond(x, y, width, height, fishCount, pondColor, shoreColor, glow)',
        description: 'Creates an interactive fish pond ecosystem with fish that eat each other and a fisherman who tries to catch them.',
        example: 'visualFishPond(0, 0, width, height, 20, [20, 80, 120], [194, 178, 128], true);',
        category: 'visualizer'
    },
    visual3DSphere: {
        name: 'visual3DSphere(x, y, z, minRadius, maxRadius, particleCount, freqStart, freqEnd, glow)',
        description: 'Creates a 3D sphere of particles that reacts to audio.',
        example: 'visual3DSphere(0, 0, 0, 100, 200, 150, 20, 2000, true);',
        category: 'visualizer'
    },
    visual3DCircularBars: {
        name: 'visual3DCircularBars(centerX, centerY, centerZ, radius, barCount, minHeight, maxHeight, barWidth, freqStart, freqEnd, rotationX, rotationY, rotationZ, colorStart, colorEnd, glow)',
        description: 'Creates a 3D circular arrangement of bars that react to audio frequencies. Can be rotated in any direction.',
        example: 'visual3DCircularBars(0, 0, 0, 200, 32, 5, 100, 5, 60, 5000, Math.sin(time/2), time/5, 0, "#FF0000", "#0000FF", true);',
        category: 'visualizer'
    }
};

// Animation lifecycle functions
const lifecycleFunctions = {
    draw: {
        name: 'function draw(t)',
        description: 'The main animation loop. Parameter "t" is elapsed time in seconds.',
        example: 'function draw(t) {\n  // Animation code here using "t" for time\n}',
        category: 'lifecycle'
    }
};

// 3D functions
const threeDFunctions = {
    cameraPosition: {
        name: 'cameraPosition(x, y, z)',
        description: 'Sets the camera position in 3D space.',
        example: 'cameraPosition(0, 0, -500); // Position the camera',
        category: '3d'
    },
    cameraLookAt: {
        name: 'cameraLookAt(x, y, z)',
        description: 'Sets the point the camera is looking at in 3D space.',
        example: 'cameraLookAt(0, 0, 0); // Look at the origin',
        category: '3d'
    },
    cameraFov: {
        name: 'cameraFov(degrees)',
        description: 'Sets the camera field of view in degrees.',
        example: 'cameraFov(75); // 75 degree field of view',
        category: '3d'
    },
    cameraZoom: {
        name: 'cameraZoom(factor)',
        description: 'Sets the camera zoom factor.',
        example: 'cameraZoom(1.5); // Zoom in 1.5x',
        category: '3d'
    },
    point3D: {
        name: 'point3D(x, y, z, size, color)',
        description: 'Creates a 3D point at the specified coordinates.',
        example: 'point3D(0, 0, 0, 3, "#FFFFFF"); // White point at origin',
        category: '3d'
    },
    clear3D: {
        name: 'clear3D()',
        description: 'Clears all 3D points.',
        example: 'clear3D(); // Remove all 3D points',
        category: '3d'
    },
    draw3D: {
        name: 'draw3D()',
        description: 'Draws all created 3D points on the canvas.',
        example: 'draw3D(); // Draw all 3D points',
        category: '3d'
    },
    line3D: {
        name: 'line3D(point1, point2, color, lineWidth)',
        description: 'Draws a line between two 3D points.',
        example: 'line3D({x:0,y:0,z:0}, {x:100,y:100,z:100}, "#FFFFFF", 2);',
        category: '3d'
    },
    grid3D: {
        name: 'grid3D(size, divisions, colorMajor, colorMinor)',
        description: 'Creates a 3D grid on the XZ plane.',
        example: 'grid3D(200, 10, "#444444", "#222222");',
        category: '3d'
    },
    axes3D: {
        name: 'axes3D(size)',
        description: 'Draws XYZ coordinate axes.',
        example: 'axes3D(150); // Draw XYZ axes with length 150',
        category: '3d'
    },
    cube3D: {
        name: 'cube3D(x, y, z, size, color, wireframe)',
        description: 'Creates a 3D cube centered at the specified coordinates.',
        example: 'cube3D(0, 0, 0, 100, "#FFFFFF", true); // Wireframe cube',
        category: '3d'
    },
    sphere3D: {
        name: 'sphere3D(x, y, z, radius, detail, color)',
        description: 'Creates a 3D sphere centered at the specified coordinates.',
        example: 'sphere3D(0, 0, 0, 50, 15, "#AAAAFF"); // Blue sphere',
        category: '3d'
    },
    visualize3D: {
        name: 'visualize3D(x, y, z, size, detail, freqStart, freqEnd)',
        description: 'Creates a 3D audio visualization at the specified coordinates.',
        example: 'visualize3D(0, 0, 0, 200, 32, 20, 2000);',
        category: '3d'
    },
    orbitCamera: {
        name: 'orbitCamera(angleX, angleY, distance)',
        description: 'Positions the camera in an orbit around its look-at point.',
        example: 'orbitCamera(time * 10, Math.sin(time) * 30, 500);',
        category: '3d'
    }
};

// Color Utilities
const colorUtilityFunctions = {
    generatePalette: {
        name: 'generatePalette(baseColor, count, mode)',
        description: 'Generates a color palette based on a base color. Modes: analogous, complementary, monochromatic, triadic.',
        example: 'const colors = generatePalette("#3498db", 5, "analogous"); // Generate 5 related colors',
        category: 'color'
    },
    getColorAtPosition: {
        name: 'getColorAtPosition(color1, color2, position)',
        description: 'Generates a color at the specified position (0-1) in a gradient between two colors.',
        example: 'const midColor = getColorAtPosition("#FF0000", "#0000FF", 0.5); // Purple color halfway between',
        category: 'color'
    }
};

// Layout Functions
const layoutFunctions = {
    gridPosition: {
        name: 'gridPosition(row, col, rows, cols, margin)',
        description: 'Calculates positions for grid-based layouts. Returns {x, y, width, height, centerX, centerY}.',
        example: 'const pos = gridPosition(1, 2, 3, 3, 10); // Get position for row 1, col 2 in a 3x3 grid',
        category: 'utility'
    },
    circularLayout: {
        name: 'circularLayout(index, total, centerX, centerY, radius)',
        description: 'Calculates positions in a circular arrangement. Returns {x, y, angle}.',
        example: 'const pos = circularLayout(i, 12, width/2, height/2, 100); // Position in a circle of 12 items',
        category: 'utility' 
    },
    responsiveSize: {
        name: 'responsiveSize(baseSize)',
        description: 'Calculates a size that scales with the canvas dimensions.',
        example: 'const size = responsiveSize(50); // Size scaled to current canvas',
        category: 'utility'
    }
};

// Audio Analysis Functions
const audioAnalysisFunctions = {
    getAudioBands: {
        name: 'getAudioBands(bandCount)',
        description: 'Gets audio spectrum divided into frequency bands. Returns array of values 0-1.',
        example: 'const bands = getAudioBands(4); // Get 4 frequency bands (bass, low-mid, high-mid, treble)',
        category: 'audio'
    },
    detectBeat: {
        name: 'detectBeat(threshold, frequency)',
        description: 'Detects beats in audio at specified frequency with dynamic threshold.',
        example: 'if (detectBeat(0.7, 60)) { /* do something on beat */ }',
        category: 'audio'
    },
    getBPM: {
        name: 'getBPM()',
        description: 'Gets the detected BPM (beats per minute) from the audio.',
        example: 'const bpm = getBPM(); // Get current beat detection',
        category: 'audio'
    },
    getBeatPhase: {
        name: 'getBeatPhase(time)',
        description: 'Gets current position in the beat cycle (0-1).',
        example: 'const phase = getBeatPhase(time); // 0 at beat start, 1 just before next beat',
        category: 'audio'
    },
    isOnBeat: {
        name: 'isOnBeat(time, threshold)',
        description: 'Returns true if current time is on a beat.',
        example: 'if (isOnBeat(time, 0.1)) { /* do something on beat */ }',
        category: 'audio'
    },
    registerBeat: {
        name: 'registerBeat(time)',
        description: 'Manually register a beat at the current time for BPM detection.',
        example: 'if (bassKick > 0.8) registerBeat(time);',
        category: 'audio'
    }
};

// Animation Functions
const animationFunctions = {
    animate: {
        name: 'animate(startValue, endValue, duration, elapsedTime, easingFunc)',
        description: 'Animates between values using specified easing function.',
        example: 'const y = animate(0, 100, 2, time % 2, easing.easeOutBounce); // Bounce animation',
        category: 'animation'
    },
    easing: {
        name: 'easing',
        description: 'Object containing easing functions: linear, easeInQuad, easeOutQuad, easeInOutQuad, etc.',
        example: 'const y = animate(0, 100, 1, t, easing.easeOutElastic); // Elastic easing',
        category: 'animation'
    },
};

// Transition Functions
const transitionFunctions = {
    startTransition: {
        name: 'startTransition(type, duration, options)',
        description: 'Starts a transition effect. Types: fade, wipe, pixelate.',
        example: 'startTransition("wipe", 2.0, {direction: "right"}); // Right wipe transition',
        category: 'effects'
    },
    applyTransition: {
        name: 'applyTransition(time)',
        description: 'Applies the current transition effect. Call in draw() function.',
        example: 'applyTransition(time);',
        category: 'effects'
    },
    endTransition: {
        name: 'endTransition()',
        description: 'Manually ends the current transition effect.',
        example: 'endTransition();',
        category: 'effects'
    }
};

// Layer Management Functions
const layerFunctions = {
    createLayer: {
        name: 'createLayer(name, zIndex)',
        description: 'Creates a new layer for organizing visual elements.',
        example: 'createLayer("background", 0); // Create background layer',
        category: 'utility'
    },
    addToLayer: {
        name: 'addToLayer(layerName, drawFunction)',
        description: 'Adds a drawing function to specified layer.',
        example: 'addToLayer("stars", (t) => { /* draw stars */ });',
        category: 'utility'
    },
    clearLayer: {
        name: 'clearLayer(name)',
        description: 'Clears all elements from the specified layer.',
        example: 'clearLayer("particles");',
        category: 'utility'
    },
    drawLayers: {
        name: 'drawLayers(time)',
        description: 'Draws all layers in order of z-index.',
        example: 'drawLayers(time); // Call in draw() function',
        category: 'utility'
    }
};

// Particle System Class
const particleSystemFunctions = {
    ParticleSystem: {
        name: 'new ParticleSystem(options)',
        description: 'Creates a new particle system with specified options: x, y, particleCount, speed, etc.',
        example: 'const particles = new ParticleSystem({x: width/2, y: height/2, particleCount: 100, reactive: true});',
        category: 'effects'
    },
    'ParticleSystem.emit': {
        name: 'particleSystem.emit(count)',
        description: 'Emits specified number of particles immediately.',
        example: 'particles.emit(20); // Emit 20 particles at once',
        category: 'effects'
    },
    'ParticleSystem.update': {
        name: 'particleSystem.update(deltaTime, audioValue)',
        description: 'Updates particle positions and lifetimes.',
        example: 'particles.update(0.016, bassAmplitude); // Update with 60fps timing and audio reactivity',
        category: 'effects'
    },
    'ParticleSystem.draw': {
        name: 'particleSystem.draw(audioValue)',
        description: 'Draws all active particles.',
        example: 'particles.draw(midAmplitude); // Draw with audio reactivity',
        category: 'effects'
    }
};

// Create a flat list of all keywords for the autocomplete
const allKeywords = [
    ...Object.keys(drawingFunctions),
    ...Object.keys(turtleFunctions),
    ...Object.keys(audioFunctions),
    ...Object.keys(mathFunctions),
    ...Object.keys(lifecycleFunctions),
    ...Object.keys(visualizerFunctions), 
    ...Object.keys(threeDFunctions),
    ...Object.keys(colorUtilityFunctions),
    ...Object.keys(layoutFunctions),
    ...Object.keys(audioAnalysisFunctions),
    ...Object.keys(animationFunctions),
    ...Object.keys(transitionFunctions),
    ...Object.keys(layerFunctions),
    ...Object.keys(particleSystemFunctions),
    ...Object.keys(canvasFunctions),
    ...Object.keys(mouseFunctions),
    // Add JavaScript keywords
    'function', 'return', 'if', 'else', 'for', 'while', 'let', 'const', 'var',
    'true', 'false', 'null', 'undefined', 'Math'
]; 

/*, 'generatePalette', 'getColorAtPosition',
'gridPosition', 'circularLayout', 'responsiveSize',
'getAudioBands', 'detectBeat', 'getBPM', 'getBeatPhase', 'isOnBeat', 'registerBeat',
'animate', 'easing',
'startTransition', 'applyTransition', 'endTransition',
'createLayer', 'addToLayer', 'clearLayer', 'drawLayers',
'ParticleSystem'*///

// Create a comprehensive info object with all functions
const keywordInfo = {
    ...drawingFunctions,
    ...turtleFunctions,
    ...audioFunctions,
    ...mathFunctions,
    ...lifecycleFunctions,
    ...visualizerFunctions,
    ...threeDFunctions,

    ...colorUtilityFunctions,
    ...layoutFunctions,
    ...audioAnalysisFunctions,
    ...animationFunctions,
    ...transitionFunctions,
    ...layerFunctions,
    ...particleSystemFunctions,
    ...canvasFunctions,
    ...mouseFunctions
};

// Export for use in editor.js
window.editorKeywords = allKeywords;
window.keywordInfo = keywordInfo;