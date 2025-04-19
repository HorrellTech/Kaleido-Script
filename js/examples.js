// Example snippets
const examples = [
    {
      name: "Basic Center Image",
      group: "Beginner",
      description: "A beginner-friendly visualizer showing center image with reactivity",
      code: `/**
function setup() {
  loadAudio("Music/audioFile.wav");
  playAudio();
}

function draw(time) {
  // Set background
  background(10, 5, 15);
    
  // Draw circular visualizer around the image
  visualCircular(width/2, height/2, 160, 300, 100, 20, 2000, time, true);
    
  // Add center image that pulses with the beat
  // Parameters: path, size, reactivity, glowColor
  visualCenterImage("Images/centerImage.png", 280, 0.7, "#FF5500");
    
  // Add other visualizers to complement the image
  visualVortex(width/2, height/2, 350, 3, 30, 60, 5000, time * 0.2);
}`},
{
  name: "Classic Music Player",
  group: "Beginner",
  description: "A complete visualizer with background, center image, circular visualizer, and responsive bars",
  code: `/**
* Classic Music Player
* A sleek music player with album art and multiple audio reactive elements
*/

// User settings - easy to customize
const settings = {
  // Audio
  audioFile: "Music/electronic_beat.mp3",
  
  // Visuals
  backgroundImage: "Images/background.jpg",
  albumArtImage: "Images/album-cover.jpg",
  albumSize: 250,           // Size of the center album art
  
  // Colors
  primaryColor: "#00AAFF", // Main highlight color
  accentColor: "#FF3366",  // Secondary color for effects
  
  // Audio reactivity
  reactivity: 1.2         // Overall audio reactivity multiplier
};

function setup() {
  // Load and play audio file
  loadAudio(settings.audioFile);
  playAudio();
}

function draw(time) {
  // Create a dark background
  background(10, 5, 15);
  
  // Add background image with subtle reactivity
  backgroundImage(settings.backgroundImage, "fill", 0.2, settings.primaryColor);
  
  // Get audio levels for reactivity
  const bass = audiohz(60) * settings.reactivity;
  const mids = audiohz(500) * settings.reactivity;
  const highs = audiohz(2000) * settings.reactivity;
  
  // Add fog in the background
  visualFog(0, 0, width(), height(), 8, 120, 250, 0.3, 50, 150, 0.15, 
    'rgba(100, 150, 255, 0.1)', false);
  
  // Add some particles that respond to mids
  fill(255, 255, 255, 0.4);
  visualParticle(0, 0, width(), height(), 20, 500, 2000, false);
  
  // Draw circular visualizer around the album art
  stroke(settings.primaryColor);
  lineWidth(2 + bass * 3);
  glowStart(settings.primaryColor, 10);
  visualCircular(
    width()/2, height()/2,    // Center position
    settings.albumSize/2,     // Min radius (size of album)
    settings.albumSize/2 + 80 + bass * 50, // Max radius
    64,                      // Points count
    20, 2000,                // Frequency range
    time * 0.001,            // Rotation speed
    false                    // Already using glow
  );
  glowEnd();
  
  // Add secondary circular visualizer with different color and rotation
  stroke(settings.accentColor);
  lineWidth(1.5);
  glowStart(settings.accentColor, 5);
  visualCircular(
    width()/2, height()/2,
    settings.albumSize/2 + 100,
    settings.albumSize/2 + 150 + mids * 50,
    48,
    500, 5000,
    -time * 0.0005,
    false
  );
  glowEnd();
  
  // Add center album art with bass reactivity
  visualCenterImage(
    settings.albumArtImage, 
    settings.albumSize + bass * 15, // Size with slight pulse
    0.3,                           // Reactivity
    settings.primaryColor          // Glow color
  );
  
  // Add bar visualizer across the bottom
  fill(settings.primaryColor);
  glowStart(settings.primaryColor, 10);
  visualBar(
    0, height(),            // Position at bottom
    width(), 120,           // Size
    64,                     // Bar count
    2,                      // Spacing
    3,                      // Min height
    0,                      // No rotation
    false,                  // Don't mirror
    false                   // Already using glow
  );
  glowEnd();
  
  // Create a vortex effect for more visual interest
  lineWidth(1);
  stroke(settings.accentColor);
  visualVortex(
    width()/2, height()/2,      // Position
    350,                        // Size
    3,                          // Rings
    20,                         // Points per ring
    50, 3000,                   // Frequency range
    time * 0.0003,              // Rotation
    true                        // Enable glow
  );
  
  // Add song title and info
  fill(255, 255, 255, 0.9);
  text("SONG TITLE", width()/2, 50, 24, "Arial", "center");
  text("Artist Name", width()/2, 80, 16, "Arial", "center");
  
  // Add audio level indicators in corner
  drawAudioLevels(30, height() - 80, bass, mids, highs);
}

// Helper function to draw audio level indicators
function drawAudioLevels(x, y, bass, mids, highs) {
  const width = 30;
  const height = 16;
  const spacing = 8;
  
  fill(255, 255, 255, 0.7);
  text("BASS", x, y, 12);
  text("MIDS", x, y + spacing + height, 12);
  text("HIGH", x, y + (spacing + height) * 2, 12);
  
  // Draw level bars
  const levels = [bass, mids, highs];
  const colors = ["#FF5500", "#00AA55", "#00AAFF"];
  
  for (let i = 0; i < 3; i++) {
    const yPos = y - height/2 + i * (spacing + height);
    
    // Bar background
    fill(30, 30, 40);
    rect(x + 50, yPos, 100, height);
    
    // Level indicator
    fill(colors[i]);
    rect(x + 50, yPos, 100 * levels[i], height);
  }
}`
},
    {
      name: "Simple Audio Visualizer",
      group: "Beginner",
      description: "A beginner-friendly audio visualizer with circular and bar visualizers, plus simple effects.",
      code: `/**
 * Simple Audio Visualizer
 * A basic introduction to audio visualization with KaleidoScript.
 */

// Global variables
let colors;

function setup() {
  // Load and play music
  loadAudio("sounds/demo_music.mp3");
  playAudio();
  
  // Simple color scheme
  colors = {
    background: [10, 10, 30],   // Dark blue background
    primary: "#00aaff",         // Bright blue
    accent: "#ff3366"           // Pink accent
  };
}

function draw(time) {
  // Create a dark background
  background(...colors.background);
  
  // Get some audio frequency data for effects
  const bassLevel = audiohz(60);    // Low bass frequency
  const midLevel = audiohz(500);    // Mid-range frequency
  const highLevel = audiohz(2000);  // High frequency
  
  // Add subtle fog in the background
  visualFog(0, 0, width, height, 5, 100, 200, 0.3, 50, 150, 0.2, 
    'rgba(0, 100, 255, 0.1)', false);
  
  // Center point of the screen
  const centerX = width/2;
  const centerY = height/2;
  
  // 1. CIRCLE VISUALIZER IN CENTER
  // Set up styling for circle visualizer
  stroke(colors.primary);
  lineWidth(2 + bassLevel * 3);  // Line thickness reacts to bass
  
  // Add glow effect when bass is strong
  if (bassLevel > 0.4) {
    glowStart(colors.primary, 15);
  }
  
  // Draw circular audio visualizer
  visualCircular(
    centerX, centerY,       // Position in center
    100, 200,               // Min and max radius
    64,                     // Number of points
    20, 2000,               // Frequency range
    time * 0.0005,          // Rotation based on time
    true                    // Enable glow
  );
  
  // End glow if we started it
  if (bassLevel > 0.4) {
    glowEnd();
  }
  
  // 2. PARTICLES THAT REACT TO MID FREQUENCIES
  fill(colors.accent);
  visualParticle(0, 0, width, height, 30, 200, 1000, true);
  
  // 3. BAR VISUALIZER ALONG BOTTOM
  fill(colors.primary);
  
  // Add glow to bars
  glowStart(colors.primary, 10);
  
  // Draw bar visualizer at the bottom of the screen
  visualBar(
    0, height,               // Position at bottom
    width, 100,              // Size
    32,                      // Number of bars
    4,                       // Space between bars
    3,                       // Minimum height
    0,                       // No rotation
    false,                   // Don't mirror
    true                     // Enable glow
  );
  
  glowEnd();
  
  // 4. SIMPLE CENTRAL CIRCLE THAT PULSES TO BEAT
  // This gives a focal point that clearly shows the beat
  fill(colors.accent);
  
  // Add stronger glow to beat circle when there's bass
  glowStart(colors.accent, 20 * bassLevel);
  
  // Draw circle with size based on bass
  circle(centerX, centerY, 30 + bassLevel * 50);
  
  glowEnd();
  
  // Display simple instructions
  fill(255, 255, 255, 0.7);
  text("Simple Audio Visualizer", 20, 30, 24);
  text("Try modifying colors and parameters!", 20, 60, 16);
}`
    },
    {
        name: "Motion Blur Demo",
        group: "Demo",
        description: "Showcases the motion blur effect with a moving circle.",
        code: `// Motion Blur Demo
// This example demonstrates the motion blur effect with a moving circle.
// Make sure to set the background in the setup function, and then at the 
// Start of the draw function, use a semi-transparent background.

let circleX = 400;
let circleY = 300;
let velocityX = 8;
let velocityY = 5;

function setup() {
  // Start with a black background
  background(0, 0, 0);
  
  // Enable motion blur with custom strength and fade values
  // First parameter: persistence strength (0.1-0.95)
  // Second parameter: fade amount (0.01-0.5)
  motionBlurStart(0.85, 0.1);
  
  log("Motion blur started. Moving circle will leave trails.");
}

function draw(time) {
  // Use a semi-transparent background to create fading effect
  fill(0, 0, 0, 0.2);  // Very low alpha for gentle fade
  rect(0, 0, width, height);
  
  // Update circle position
  circleX += velocityX;
  circleY += velocityY;
  
  // Bounce off edges
  if (circleX < 0 || circleX > width) {
    velocityX *= -1;
  }
  
  if (circleY < 0 || circleY > height) {
    velocityY *= -1;
  }
  
  // Draw the moving circle with a gradient of colors based on time
  const hue = (time * 50) % 360;
  fill(
    127 + 127 * Math.sin(hue * Math.PI / 180),
    127 + 127 * Math.sin((hue + 120) * Math.PI / 180),
    127 + 127 * Math.sin((hue + 240) * Math.PI / 180)
  );
  
  // Enable glow for extra effect
  glowStart(null, 20);
  circle(circleX, circleY, 30);
  glowEnd();
}`
    },
    {
      name: "Neon Pulse",
      group: "Minimal",
      description: "A hypnotic neon visualization with minimal code that creates a striking visual effect.",
      code: `/**
* Neon Pulse
* Minimal code for maximum impact using layered circular visualizers
*/

function setup() {
    loadAudio("neon_beats.mp3");
    playAudio();
}

function draw(time) {
    // Dark background with subtle fade effect
    background(0, 0, 10);
    
    // Get audio levels
    const bass = audiohz(60) * 1.5;
    const mids = audiohz(500);
    
    // Set up neon effect with glow
    stroke(0, 255, 255);
    lineWidth(3);
    glowStart("cyan", 20);
    
    // Create 3 offset circular visualizers
    for (let i = 0; i < 3; i++) {
        const hue = (i * 120) % 360;
        stroke(\`hsl(\${hue}, 100%, 60%)\`);
        visualCircular(
            width/2, height/2,
            100, 200 + bass * 100,
            32, 20, 2000,
            time * 0.001 + i * Math.PI/3,
            true
        );
    }
    
    glowEnd();
    
    // Add central pulsing circle
    fill(255, 50, 150);
    glowStart("magenta", 25 * bass);
    circle(width/2, height/2, 50 + bass * 100);
    glowEnd();
}`
  },
  {
      name: "Geometric Beats",
      group: "Minimal",
      description: "Simple rotating geometric patterns that transform with the music.",
      code: `/**
* Geometric Beats
* Clean minimal design with powerful geometric impact
*/

function setup() {
    loadAudio("minimal_techno.mp3");
    playAudio();
}

function draw(time) {
    // Create a clean dark background
    background(10, 10, 15);
    
    // Audio reactive values
    const bass = audiohz(80);
    const mids = audiohz(800);
    
    // Center of canvas
    const cx = width/2;
    const cy = height/2;
    
    // Set up drawing
    lineWidth(2 + bass * 3);
    
    // Rotation angle based on time
    const angle = time * 0.001;
    
    // Draw audio-reactive concentric polygons
    for (let i = 0; i < 6; i++) {
        // Color shifts based on frequencies
        const hue = (time * 0.01 + i * 60) % 360;
        stroke(\`hsl(\${hue}, 80%, 60%)\`);
        glowStart(\`hsl(\${hue}, 80%, 60%)\`, 10);
        
        // Draw polygon
        const sides = 3 + i;
        const size = 50 + i * 40 + bass * 100;
        
        // Draw the shape
        context.beginPath();
        for (let j = 0; j < sides; j++) {
            const a = angle + j * (Math.PI * 2 / sides);
            const x = cx + Math.cos(a) * size;
            const y = cy + Math.sin(a) * size;
            
            if (j === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        context.stroke();
        
        glowEnd();
    }
}`
  },
  {
    name: "Neon Grid Lines",
    group: "Minimal",
    description: "Dynamic neon grid lines that move and pulse to the beat.",
    code: `/**
* Neon Grid Lines
* Dynamic neon grid lines that move and pulse to the beat.
* Compact yet striking visualization.
*/

function setup() {
    loadAudio("retrowave.mp3");
    playAudio();
}

function draw(time) {
    // Dark background
    background(10, 5, 20);
    
    // Audio reactivity
    const bass = audiohz(60);
    const mids = audiohz(500); 
    
    // Set up drawing style for grid lines
    lineWidth(1 + bass * 3);
    glowStart("rgba(120, 0, 255, 0.7)", 10);
    
    // Draw horizontal grid lines
    for (let i = 0; i <= 12; i++) {
        // Calculate y-position with animation
        const baseY = height * (i / 12);
        const y = baseY + Math.sin(time * 0.2 + i) * 10 * mids;
        
        // Color shifts based on position and audio
        const hue = (time * 0.01 + i * 30) % 360;
        stroke(\`hsla(\${hue}, 100%, 60%, \${0.5 + bass * 0.5})\`);
        
        // Draw the line
        line(0, y, width, y);
    }
    
    // Draw vertical grid lines
    for (let i = 0; i <= 18; i++) {
        // Calculate x-position with animation
        const baseX = width * (i / 18);
        const x = baseX + Math.cos(time * 0.3 + i) * 10 * bass;
        
        // Color shifts based on position
        const hue = (time * 0.01 + i * 20 + 180) % 360;
        stroke(\`hsla(\${hue}, 100%, 70%, \${0.5 + bass * 0.5})\`);
        
        // Draw the line
        line(x, 0, x, height);
    }
    
    glowEnd();
    
    // Add a pulsing sun/circle
    const sunSize = 50 + bass * 100;
    const sunY = height * 0.4;
    
    fill(255, 100, 100, 0.7);
    glowStart("rgba(255, 50, 50, 0.8)", 20 + bass * 30);
    circle(width/2, sunY, sunSize);
    glowEnd();
}`
},
{
  name: "Geometric Rhythm",
  group: "Minimal",
  description: "Minimalist geometric shapes that rotate and pulse with the music.",
  code: `/**
* Geometric Rhythm
* Minimalist geometric shapes that rotate and pulse with the music
*/

function setup() {
  loadAudio("minimal_electronic.mp3");
  playAudio();
}

function draw(time) {
  // Dark background with fade for light trails
  background(10, 10, 15, 0.2);
  
  // Audio reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(3000);
  
  // Center of canvas
  const cx = width/2;
  const cy = height/2;
  
  // Draw rotating polygons
  lineWidth(2);
  
  // Outer shape (more sides)
  const outerSides = 6;
  const outerSize = 200 + bass * 100;
  const outerRotation = time * 0.0002;
  
  // Inner shape (fewer sides)
  const innerSides = 3;
  const innerSize = 100 + mids * 80;
  const innerRotation = time * -0.0005;
  
  // Draw shapes
  drawShape(cx, cy, outerSides, outerSize, outerRotation, "rgba(50, 200, 255, 0.8)", bass);
  drawShape(cx, cy, innerSides, innerSize, innerRotation, "rgba(255, 100, 200, 0.8)", mids);
  
  // Add connecting lines between shapes that react to high frequencies
  if (highs > 0.4) {
      stroke("rgba(255, 255, 255, 0.4)");
      lineWidth(1);
      
      for (let i = 0; i < Math.min(outerSides, innerSides); i++) {
          const outerAngle = outerRotation + (i / outerSides) * Math.PI * 2;
          const innerAngle = innerRotation + (i / innerSides) * Math.PI * 2;
          
          const outerX = cx + Math.cos(outerAngle) * outerSize;
          const outerY = cy + Math.sin(outerAngle) * outerSize;
          
          const innerX = cx + Math.cos(innerAngle) * innerSize;
          const innerY = cy + Math.sin(innerAngle) * innerSize;
          
          line(outerX, outerY, innerX, innerY);
      }
  }
}

function drawShape(x, y, sides, size, rotation, color, intensity) {
  // Draw a regular polygon with glow
  stroke(color);
  glowStart(color, 10 + intensity * 20);
  
  context.beginPath();
  for (let i = 0; i < sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2;
      const pointX = x + Math.cos(angle) * size;
      const pointY = y + Math.sin(angle) * size;
      
      if (i === 0) {
          context.moveTo(pointX, pointY);
      } else {
          context.lineTo(pointX, pointY);
      }
  }
  context.closePath();
  context.stroke();
  
  glowEnd();
}`
},
{
  name: "Dynamic Dots",
  group: "Minimal",
  description: "Minimalist pattern of dots that move and scale with the music.",
  code: `/**
* Dynamic Dots
* Minimalist pattern of dots that move and scale with the music.
*/

function setup() {
  loadAudio("electronic_minimal.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(10, 15, 25);
  
  // Audio reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(3000);
  
  // Grid parameters
  const gridSize = 12;
  const spacing = Math.min(width, height) / gridSize;
  
  // Enable glow for all dots
  glowStart("rgba(100, 200, 255, 0.5)", 10 * bass);
  
  // Draw dots in a grid
  for (let x = 1; x < gridSize; x++) {
      for (let y = 1; y < gridSize; y++) {
          // Calculate position with slight movement
          const posX = spacing * x + Math.sin(time * 0.001 + x * y * 0.05) * spacing * 0.2 * mids;
          const posY = spacing * y + Math.cos(time * 0.0015 + x * 0.1) * spacing * 0.2 * bass;
          
          // Calculate dot size based on audio and position
          const distanceToCenter = Math.sqrt(
              Math.pow((posX - width/2) / width, 2) + 
              Math.pow((posY - height/2) / height, 2)
          );
          
          // Each dot responds to a different frequency range
          const freq = 100 + ((x + y * gridSize) % 20) * 150;
          const energy = audiohz(freq);
          
          // Size based on audio energy and position
          const size = (spacing * 0.2) + 
                      (mids * spacing * 0.2) +
                      (energy * spacing * 0.4);
                      
          // Color based on position and audio
          const hue = (time * 0.01 + x * 10 + y * 10) % 360;
          const brightness = 50 + energy * 50;
          
          // Draw dot
          fill(\`hsl(\${hue}, 80%, \${brightness}%)\`);
          circle(posX, posY, size);
      }
  }
  
  glowEnd();
  
  // Add central pulse on heavy bass hits
  if (bass > 0.7) {
      fill("rgba(255, 255, 255, 0.3)");
      glowStart("white", 40 * bass);
      circle(width/2, height/2, bass * 100);
      glowEnd();
  }
}`
},
  {
      name: "Liquid Sound",
      group: "Minimal",
      description: "Create a fluid, liquid-like visualization with just a few lines of code.",
      code: `/**
* Liquid Sound
* Creates fluid-like audio visualization with minimal code
*/

function setup() {
    loadAudio("ambient_liquid.mp3");
    playAudio();
}

function draw(time) {
    // Fade background for motion trails
    background(0, 10, 20, 0.1);
    
    // Audio levels
    const bass = audiohz(60);
    const highs = audiohz(3000);
    
    // Enable motion blur for fluid look
    motionBlurStart(0.6, "screen");
    
    // Draw ripple effects at different positions
    for (let i = 0; i < 3; i++) {
        // Calculate position based on audio and time
        const x = width/2 + Math.sin(time * 0.001 + i) * width/4 * bass;
        const y = height/2 + Math.cos(time * 0.0015 + i) * height/4;
        
        // Color based on position
        const hue = (time * 0.02 + i * 120) % 360;
        stroke(\`hsla(\${hue}, 100%, 70%, 0.7)\`);
        lineWidth(1 + bass * 3);
        
        // Draw ripple effect
        glowStart(\`hsla(\${hue}, 100%, 50%, 0.5)\`, 15);
        visualRipple(x, y, 100 + bass * 200, 100 + bass * 200, 3 + Math.floor(highs * 5), 20, 2000, true);
        glowEnd();
    }
    
    // End motion blur
    motionBlurEnd();
}`
  },
  {
      name: "Laser Grid",
      group: "Minimal",
      description: "Creates a striking laser grid that pulses with the music.",
      code: `/**
* Laser Grid
* A retro-futuristic laser grid that pulses with the beat
*/

function setup() {
    loadAudio("synthwave_beat.mp3");
    playAudio();
}

function draw(time) {
    // Black background
    background(0, 0, 0);
    
    // Audio levels
    const bass = audiohz(60) * 1.5;
    const mids = audiohz(500);
    
    // Set up laser effect
    lineWidth(1 + bass * 2);
    
    // Draw horizontal laser lines
    for (let i = 0; i <= 20; i++) {
        // Calculate y position with perspective effect
        const y = (i / 20) * height;
        const alpha = (1 - i/25) * (0.3 + bass * 0.7);
        
        // Color shifts based on position and audio
        const hue = (time * 0.01 + i * 5) % 360;
        stroke(\`hsla(\${hue}, 100%, 60%, \${alpha})\`);
        
        // Add glow for laser effect
        glowStart(\`hsla(\${hue}, 100%, 60%, \${alpha})\`, 10);
        
        // Distort lines based on audio
        const waveHeight = mids * 50;
        const waveFreq = 0.01;
        
        context.beginPath();
        for (let x = 0; x < width; x += 5) {
            const distortion = Math.sin(x * waveFreq + time * 0.001) * waveHeight;
            context.lineTo(x, y + distortion);
        }
        context.stroke();
        
        glowEnd();
    }
    
    // Add a central sun/radar
    fill(255, 50, 50);
    glowStart("red", 20 * bass);
    circle(width/2, height * 0.3, 30 + bass * 50);
    glowEnd();
}`
  },
    {
        name: "Psychedelic Mindwarp",
        group: "Beginner",
        description: "DO NOT USE! THERE IS NO POINT IN THIS EXAMPLE. ONLY A TEMPLATE",
        code: `/**
* Psychedelic Mindwarp
* A compact but visually intense audio-reactive experience
* that combines multiple trippy effects
*/

function setup() {
    // Load a psychedelic track
    loadAudio("psychedelic.mp3");
    playAudio();
}

function draw(time) {
    // Base background
    background(0, 0, 0);
    
    // Get audio levels with exaggerated response
    const bass = audiohz(60) * 1.8;
    const mids = audiohz(500);
    const highs = audiohz(3000);
    
    // Create colorful shifting nebula backdrop
    visualNebular(0, 0, width, height, 4, 40, (time * 0.01) % 360, 20, 2000, true);
    
    // Add audio-reactive spiral that responds to mids
    stroke(255, 50, 255);
    lineWidth(2 + mids * 4);
    visualSpiral(width/2, height/2, 20, 8, 5, 100, 500, 2000, time * 0.001, true);
    
    // Add vortex that pulsates with the bass
    stroke(0, 200, 255);
    lineWidth(1.5);
    visualVortex(width/2, height/2, 100 + bass * 100, 3, 15, 20, 2000, time * 0.002, true);
    
    // Add psychedelic eyes that follow the music
    visualEyes(0, 0, width, height, 3 + Math.floor(highs * 5), 30, 0.05, 100, 3000);
    
    // Motion blur effect for trippy visuals during intense parts
    if (bass > 0.5) {
        motionBlurStart(0.2, "lighter");
        fill(255, 100, 255);
        visualParticle(0, 0, width, height, 20, 1000, 4000, true);
        motionBlurEnd();
    }
}`
    },
    {
        name: "Cosmic Nebula Explorer",
        group: "Advanced",
        description: "A space-themed music visualizer that uses layered visualizers to create a rich cosmic experience.",
        code: `/**
 * Cosmic Nebula Explorer
 * A space-themed music visualizer that uses layered visualizers
 * to create a rich cosmic experience.
 */
var stars;
var palette;

function setup() {
  // Load and play the music
  loadAudio("sounds/space_ambient.mp3");
  playAudio();
  
  // Set initial variables
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 2,
      speed: 0.2 + Math.random() * 0.8
    });
  }
  
  // Color palette
  palette = {
    background: [5, 2, 20],
    nebula: 260, // Base hue
    planet: '#ff9900',
    moons: ['#88ccff', '#ffff99', '#aaffaa', '#ffaacc']
  };
}

function draw(time) {
  // Create dark space background
  background(...palette.background);
  
  // Add subtle motion blur for smooth trails
  motionBlurStart(0.3, 'screen');
  
  // Draw the nebula backdrop
  visualNebular(0, 0, width, height, 5, 150, palette.nebula, 20, 2000, true);
  
  // Add some atmospheric fog for depth
  visualFog(0, 0, width, height, 8, 120, 300, 0.5, 50, 150, 0.2, 'rgba(100, 50, 255, 0.15)', true);
  
  // Draw stars in the background with subtle movement
  drawStars(time);
  
  // Add some dynamic lightning for energy bursts
  fill(255, 255, 255);
  glowStart('#ffffff', 20);
  if (audiohz(500) > 0.5) {
    visualLightning(0, 0, width, height, 2, 3, 500, 2000, true);
  }
  glowEnd();
  
  // Central planetary system that reacts to bass
  visualPlanetAndMoons(
    width/2, height/2,
    70,                      // planet size
    5,                       // moon count
    5, 15,                   // min/max moon size
    100, 250,                // min/max orbit radius
    palette.planet,          // planet color
    palette.moons,           // moon colors
    60,                      // bass frequency
    500, 2000,               // high frequency range
    true                     // glow effect
  );
  
  // End motion blur
  motionBlurEnd();
  
  // Add constellation effect in the foreground
  stroke(255, 255, 255, 0.3);
  visualConstellation(0, 0, width, height, 20, 150, 200, 1000, true);
}

// Helper function to draw and animate stars
function drawStars(time) {
  fill(255, 255, 255);
  glowStart('#ffffff', 5);
  
  stars.forEach((star, i) => {
    // Move stars slowly across screen
    star.x -= star.speed * (1 + audiohz(i * 20) * 2);
    
    // Wrap around when they go off screen
    if (star.x < 0) {
      star.x = width;
      star.y = Math.random() * height;
    }
    
    // Draw star with subtle audio reactive size
    const pulseSize = star.size * (1 + audiohz(i + 500) * 0.5);
    circle(star.x, star.y, pulseSize);
  });
  
  glowEnd();
}`
    },
    {
        name: "Fiery Rhythm Analyzer",
        group: "Semi-Advanced",
        description: "A blazing music visualizer that responds to beat and rhythm.",
        code: `/**
* Fiery Rhythm Analyzer
* A blazing music visualizer that responds to beat and rhythm.
*/
var colors;
var bassDropActive;
var lastBassLevel;
var cumulativeBassEnergy;

function setup() {
  // Load and play the music
  loadAudio("sounds/electronic_beat.mp3");
  playAudio();
  
  // Color palette
  colors = {
    background: [10, 5, 0],
    fire: {
      start: 0,     // Red hue
      end: 40       // Yellow-orange hue
    },
    glow: '#ff6600'
  };
  
  // Store whether we're in a bass drop
  bassDropActive = false;
  lastBassLevel = 0;
  cumulativeBassEnergy = 0;
}

function draw(time) {
  // Create dark background
  background(...colors.background);
  
  // Calculate bass energy
  const bassLevel = audiohz(60);
  const midLevel = audiohz(500);
  const highLevel = audiohz(2000);
  
  // Detect bass drops by analyzing energy changes
  cumulativeBassEnergy = cumulativeBassEnergy * 0.95 + bassLevel * 0.05;
  if (bassLevel > lastBassLevel * 1.5 && bassLevel > 0.7) {
    bassDropActive = true;
    setTimeout(() => { bassDropActive = false; }, 1000);
  }
  lastBassLevel = bassLevel;
  
  // Apply motion blur for smoother animation
  motionBlurStart(0.15, 'screen');
  
  // Central flame visualization
  fill(255, 255, 255);
  glowStart(colors.glow, 30);
  visualFlame(0, height/2, width, height/2, 100, 20, 500, true);
  glowEnd();
  
  // Add circular visualizer in the middle that reacts to mid frequencies
  const centerX = width/2;
  const centerY = height/2;
  
  // Draw pulsing center circle
  fill(255, 100, 0, 0.7);
  glowStart('#ff9900', 20);
  circle(centerX, centerY, 100 + midLevel * 50);
  glowEnd();
  
  // Circular audio visualizer rings
  stroke(255, 200, 50, 0.8);
  lineWidth(3);
  glowStart('#ffcc00', 15);
  visualCircular(
    centerX, centerY, 
    120, 200, 
    64, 
    200, 2000, 
    time * 0.001, 
    true
  );
  glowEnd();
  
  // Add secondary ring that moves in opposite direction
  stroke(255, 100, 0, 0.6);
  lineWidth(2);
  glowStart('#ff6600', 10);
  visualCircular(
    centerX, centerY, 
    220, 280, 
    48, 
    500, 5000, 
    -time * 0.0005, 
    true
  );
  glowEnd();
  
  // During bass drops, add ripple effects
  if (bassDropActive || cumulativeBassEnergy > 0.6) {
    stroke(255, 255, 200, 0.5);
    lineWidth(4);
    glowStart('#ffffff', 20);
    visualRipple(centerX, centerY, 300, 300, 3, 30, 80, true);
    glowEnd();
  }
  
  // Bar visualizers at the bottom that react to the full frequency spectrum
  fill(255, 170, 0);
  glowStart('#ff5500', 15);
  visualBar(0, height, width, 150, 64, 4, 5, 0, false, true);
  glowEnd();
  
  // End motion blur
  motionBlurEnd();
  
  // When high frequencies are active, add some sparks
  if (highLevel > 0.6) {
    stroke(255, 255, 200);
    lineWidth(1);
    glowStart('#ffffff', 10);
    visualLightning(0, 0, width, height/2, 3, 4, 2000, 5000, true);
    glowEnd();
  }
}`
    },
    {
        name: "Digital Dreamscape",
        group: "Semi-Advanced",
        description: "A cyberpunk-inspired music visualization with digital elements and futuristic aesthetics.",
        code: `/**
* Digital Dreamscape
* A cyberpunk-inspired music visualization with digital elements
* and futuristic aesthetics.
*/

// Global variables
let palette;
let lastGridUpdate;
let gridLines;

function setup() {
  // Load and play ambient electronic music
  loadAudio("sounds/cyberpunk_ambient.mp3");
  playAudio();
  
  // Initialize color palette and state
  palette = {
    background: [0, 10, 20],
    matrix: [0, 255, 100],
    grid: [0, 200, 255],
    accent: [200, 0, 255]
  };
  
  // Track time for various animations
  lastGridUpdate = 0;
  gridLines = [];
  
  // Create initial grid
  updateGrid();
}

function draw(time) {
  // Create dark background with subtle pulse
  const bassLevel = audiohz(60);
  const bgBrightness = 10 + bassLevel * 10;
  background(0, bgBrightness, bgBrightness * 2);
  
  // Update grid periodically or with strong bass hits
  if (time - lastGridUpdate > 5000 || bassLevel > 0.7) {
    updateGrid();
    lastGridUpdate = time;
  }
  
  // Apply subtle motion blur
  motionBlurStart(0.2, 'screen');
  
  // Draw the digital grid backdrop
  drawGrid(time);
  
  // Matrix rain effect in the background
  fill(palette.matrix[0], palette.matrix[1], palette.matrix[2]);
  visualMatrix(0, 0, width, height, 40, 20, 2000, true);
  
  // Add some particle effects that react to mid frequencies
  fill(palette.accent[0], palette.accent[1], palette.accent[2], 0.7);
  glowStart('rgb(' + palette.accent.join(',') + ')', 10);
  visualParticle(0, 0, width, height, 50, 500, 2000, true);
  glowEnd();
  
  // Centered circular visualizer that pulses with the music
  stroke(palette.grid[0], palette.grid[1], palette.grid[2], 0.8);
  lineWidth(2);
  glowStart('rgb(' + palette.grid.join(',') + ')', 15);
  
  // Double spiral effect
  visualSpiral(
    width/2, height/2,
    50, 5,
    5, 200,
    100, 5000,
    time * 0.0005,
    true
  );
  glowEnd();
  
  // Add waveform at the bottom
  stroke(255, 255, 255, 0.7);
  lineWidth(3);
  glowStart('#ffffff', 10);
  visualWaveform(0, height - 100, width, 80, 128, 2, true);
  glowEnd();
  
  // End motion blur
  motionBlurEnd();
  
  // Add digital HUD elements
  drawHUD(time);
}

// Create grid of lines for the backdrop
function updateGrid() {
  gridLines = [];
  const spacing = 50 + Math.random() * 100;
  
  // Horizontal lines
  for (let y = 0; y < height; y += spacing) {
    gridLines.push({
      x1: 0,
      y1: y,
      x2: width,
      y2: y,
      alpha: 0.2 + Math.random() * 0.3
    });
  }
  
  // Vertical lines
  for (let x = 0; x < width; x += spacing) {
    gridLines.push({
      x1: x,
      y1: 0,
      x2: x,
      y2: height,
      alpha: 0.2 + Math.random() * 0.3
    });
  }
}

// Draw the grid with audio reactivity
function drawGrid(time) {
  const midLevel = audiohz(500);
  
  stroke(palette.grid[0], palette.grid[1], palette.grid[2]);
  lineWidth(1);
  
  gridLines.forEach((line, i) => {
    // Make lines pulse with the music
    const freq = 200 + i * 10;
    const energy = audiohz(freq);
    const alpha = line.alpha * (0.5 + energy * 1.5);
    
    stroke(palette.grid[0], palette.grid[1], palette.grid[2], alpha);
    
    if (energy > 0.7) {
      glowStart('rgba(' + palette.grid.join(',') + ',' + alpha + ')', 5);
    }
    
    line(line.x1, line.y1, line.x2, line.y2);
    
    if (energy > 0.7) {
      glowEnd();
    }
  });
}

// Draw HUD elements around the edge of the screen
function drawHUD(time) {
  const highLevel = audiohz(2000);
  
  fill(palette.accent[0], palette.accent[1], palette.accent[2]);
  glowStart('rgb(' + palette.accent.join(',') + ')', 5);
  
  // Top-left corner
  drawHUDElement(20, 20, 100, 50, highLevel);
  
  // Top-right corner
  drawHUDElement(width - 120, 20, 100, 50, highLevel);
  
  // Bottom-left corner
  drawHUDElement(20, height - 70, 100, 50, highLevel);
  
  // Bottom-right corner
  drawHUDElement(width - 120, height - 70, 100, 50, highLevel);
  
  glowEnd();
}

// Helper to draw a single HUD element
function drawHUDElement(x, y, width, height, reactivity) {
  // Outer rectangle
  stroke(palette.grid[0], palette.grid[1], palette.grid[2], 0.8);
  lineWidth(2);
  rect(x, y, width, height, true);
  
  // Inner bar that reacts to audio
  const barWidth = width * (0.2 + reactivity * 0.8);
  fill(palette.accent[0], palette.accent[1], palette.accent[2], 0.7);
  rect(x + 5, y + height/2 - 5, barWidth, 10);
}`
    },
    {
        name: "Planet Hopper",
        group: "Semi-Advanced",
        description: "Explore multiple planetary systems that pulse and move with the music.",
        code: `/**
* Planet Hopper
* Explore multiple planetary systems that pulse and move with the music.
*/
var planets;
var stars;

function setup() {
  // Load and play space-themed music
  loadAudio("sounds/space_journey.mp3");
  playAudio();
  
  // Initialize planet systems
  planets = [
    { 
      x: width * 0.25, 
      y: height * 0.35,
      size: 60,
      moons: 4,
      color: '#ffaa22',
      moonColors: ['#aaddff', '#ffddaa']
    },
    { 
      x: width * 0.75, 
      y: height * 0.65,
      size: 80,
      moons: 6,
      color: '#ff5588',
      moonColors: ['#aaffaa', '#ffffaa']
    },
    { 
      x: width * 0.5, 
      y: height * 0.8,
      size: 40,
      moons: 3,
      color: '#22ccff',
      moonColors: ['#ffaaff', '#aaeeff']
    }
  ];
  
  // Create star field
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 1.5,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function draw(time) {
  // Dark space background
  background(5, 0, 15);
  
  // Draw starfield first
  drawStars(time);
  
  // Draw nebula in the background
  glowStart('rgba(100, 50, 200, 0.3)', 30);
  visualNebular(0, 0, width, height, 4, 50, 280, 20, 200, true);
  glowEnd();
  
  // Add some subtle fog
  visualFog(0, 0, width, height, 5, 200, 400, 0.2, 30, 100, 0.15, 
    'rgba(40, 10, 80, 0.2)', false);
  
  // Apply motion blur for smooth movement
  motionBlurStart(0.15, 'screen');
  
  // Draw planet systems
  planets.forEach(planet => {
    // Calculate audio reactivity specific to this planet
    const bassFreq = 40 + (planet.size % 50);
    const bassEnergy = audiohz(bassFreq);
    
    // Move planets slightly based on audio
    const moveAmount = bassEnergy * 10;
    planet.x += Math.sin(time * 0.001) * moveAmount;
    planet.y += Math.cos(time * 0.0015) * moveAmount;
    
    // Keep planets within bounds
    planet.x = Math.max(planet.size, Math.min(width - planet.size, planet.x));
    planet.y = Math.max(planet.size, Math.min(height - planet.size, planet.y));
    
    // Draw the planet system
    visualPlanetAndMoons(
      planet.x, planet.y,
      planet.size,
      planet.moons,
      5, 12,
      planet.size * 1.5, planet.size * 3.5,
      planet.color,
      planet.moonColors,
      bassFreq,
      500, 3000,
      true
    );
  });
  
  // End motion blur
  motionBlurEnd();
  
  // Add constellation effect to connect planets
  stroke(200, 230, 255, 0.3);
  lineWidth(1);
  
  // Connect planets with lines based on audio
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const freq = 500 + ((i * j) % 1000);
      const energy = audiohz(freq);
      
      if (energy > 0.3) {
        const alpha = energy * 0.5;
        stroke(200, 230, 255, alpha);
        
        if (energy > 0.6) {
          glowStart('rgba(200, 230, 255, 0.5)', 5);
        }
        
        line(planets[i].x, planets[i].y, planets[j].x, planets[j].y);
        
        if (energy > 0.6) {
          glowEnd();
        }
      }
    }
  }
  
  // Add ripples around a planet when bass hits hard
  const mainBass = audiohz(40);
  if (mainBass > 0.7) {
    // Choose random planet for the effect
    const planet = planets[Math.floor(Math.random() * planets.length)];
    
    // Create ripple
    stroke(255, 255, 255, 0.6);
    lineWidth(2);
    glowStart('rgba(255, 255, 255, 0.5)', 10);
    visualRipple(planet.x, planet.y, planet.size * 6, planet.size * 6, 2, 40, 100, true);
    glowEnd();
  }
}

// Function to draw and animate the star field
function drawStars(time) {
  fill(255, 255, 255);
  
  stars.forEach((star, i) => {
    // Calculate twinkle effect
    star.twinkle += 0.02;
    const twinkleFactor = 0.5 + Math.sin(star.twinkle) * 0.5;
    
    // Make some stars audio reactive
    const freq = 5000 + (i % 20) * 200;
    const energy = audiohz(freq) * 0.5;
    
    // Draw star with combined twinkle and audio reactivity
    const size = star.size * (twinkleFactor + energy);
    
    if (size > star.size * 1.3) {
      glowStart('#ffffff', size * 2);
    }
    
    circle(star.x, star.y, size);
    
    if (size > star.size * 1.3) {
      glowEnd();
    }
  });
}`
    },
    {
      name: "Aurora Beats",
      group: "Minimal",
      description: "Northern lights-inspired visualization that dances to the music with just a few lines of code.",
      code: `/**
* Aurora Beats
* Northern lights that pulse with the beat
*/

function setup() {
  loadAudio("ambient_chill.mp3");
  playAudio();
}

function draw(time) {
  // Fade the background for trailing effect
  background(0, 5, 10, 0.1);
  
  // Get audio levels
  const bass = audiohz(60);
  const mids = audiohz(400);
  
  // Enable motion blur for smooth trails
  motionBlurStart(0.7, "lighter");
  
  // Draw 3 aurora waves at different heights
  for (let i = 0; i < 3; i++) {
      // Calculate wave parameters based on audio
      const yPos = height * (0.5 + i * 0.15);
      const amplitude = 50 + bass * 100;
      const frequency = 0.002 + mids * 0.003;
      
      // Aurora color shifts with the music
      const hue = (180 + time * 0.01 + i * 30) % 360;
      const saturation = 80 + bass * 20;
      const lightness = 50 + mids * 20;
      
      // Draw the wave
      context.beginPath();
      context.moveTo(0, yPos);
      
      for (let x = 0; x < width; x += 5) {
          const y = yPos + Math.sin(x * frequency + time * 0.001) * amplitude;
          context.lineTo(x, y);
      }
      
      // Complete the shape to the bottom of the screen
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      
      // Fill with gradient
      const gradient = context.createLinearGradient(0, yPos - amplitude, 0, height);
      gradient.addColorStop(0, \`hsla(\${hue}, \${saturation}%, \${lightness}%, 0.7)\`);
      gradient.addColorStop(1, \`hsla(\${hue}, \${saturation}%, 10%, 0)\`);
      context.fillStyle = gradient;
      context.fill();
  }
  
  motionBlurEnd();
  
  // Add stars that twinkle with high frequencies
  fill(255, 255, 255);
  glowStart("white", 5);
  visualParticle(0, 0, width, height * 0.6, 30, 2000, 5000, true);
  glowEnd();
}`
  },
  
  {
      name: "Fractal Pulse",
      group: "Minimal",
      description: "Hypnotic fractal-like patterns that evolve with the music.",
      code: `/**
* Fractal Pulse
* Simple code creates complex fractal-like patterns
*/

function setup() {
  loadAudio("electronic_ambient.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(0, 0, 0, 0.2);
  
  // Audio reactive values
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(3000);
  
  // Center of canvas
  const cx = width/2;
  const cy = height/2;
  
  // Create multiple layers of rotating shapes
  for (let layer = 1; layer <= 5; layer++) {
      // Layer-specific parameters
      const rotSpeed = 0.0003 * layer * (1 + bass);
      const numShapes = 3 + layer * 2;
      const radius = layer * 50 + bass * 100;
      
      // Color based on audio and layer
      const hue = (time * 0.02 + layer * 30) % 360;
      const alpha = 0.5 + highs * 0.2;
      
      // Set up drawing style
      stroke(\`hsla(\${hue}, 100%, 60%, \${alpha})\`);
      lineWidth(1 + mids * 2);
      glowStart(\`hsla(\${hue}, 100%, 60%, \${alpha})\`, 10);
      
      // Draw shape
      context.beginPath();
      for (let i = 0; i < numShapes; i++) {
          const angle1 = time * rotSpeed + (i / numShapes) * Math.PI * 2;
          const angle2 = time * rotSpeed * 1.5 + ((i+1) / numShapes) * Math.PI * 2;
          
          const x1 = cx + Math.cos(angle1) * radius;
          const y1 = cy + Math.sin(angle1) * radius;
          const x2 = cx + Math.cos(angle2) * (radius * (0.5 + mids * 0.8));
          const y2 = cy + Math.sin(angle2) * (radius * (0.5 + mids * 0.8));
          
          if (i === 0) context.moveTo(x1, y1);
          context.lineTo(x1, y1);
          context.lineTo(x2, y2);
      }
      context.closePath();
      context.stroke();
      glowEnd();
  }
  
  // Add central pulsating circle
  fill(\`rgba(255, 255, 255, \${bass * 0.7})\`);
  glowStart("white", 20 * bass);
  circle(cx, cy, 20 + bass * 60);
  glowEnd();
}`
  },
  
  {
      name: "Neon Waveform",
      group: "Minimal",
      description: "Elegant waveform visualization with minimal code but maximum impact.",
      code: `/**
* Neon Waveform
* Simple yet striking waveform visualization
*/

function setup() {
  loadAudio("synthwave_track.mp3");
  playAudio();
}

function draw(time) {
  // Black background
  background(0, 0, 0, 0.3);
  
  // Audio levels
  const bass = audiohz(60);
  const mids = audiohz(500);
  
  // Center line position
  const centerY = height * 0.5;
  
  // Motion blur for smoother animation
  motionBlurStart(0.4, "screen");
  
  // Draw reflected waveform
  lineWidth(2 + bass * 5);
  
  // Top waveform (pink/purple)
  stroke(\`rgba(255, 50, 200, \${0.7 + bass * 0.3})\`);
  glowStart("magenta", 15);
  visualWaveform(0, 0, width, centerY, 200, 3, true);
  glowEnd();
  
  // Bottom waveform (cyan/blue) - reflection
  stroke(\`rgba(50, 200, 255, \${0.7 + bass * 0.3})\`);
  glowStart("cyan", 15);
  visualWaveform(0, centerY, width, height - centerY, 200, 3, true);
  glowEnd();
  
  // Horizontal dividing line with glow
  stroke(\`rgba(255, 255, 255, \${0.3 + mids * 0.7})\`);
  lineWidth(1 + mids * 2);
  glowStart("white", 10);
  line(0, centerY, width, centerY);
  glowEnd();
  
  // Add subtle grid lines
  lineWidth(0.5);
  for (let i = 1; i < 10; i++) {
      const y = height * (i / 10);
      stroke(\`rgba(255, 255, 255, \${0.1 + (i === 5 ? mids * 0.2 : 0)})\`);
      line(0, y, width, y);
  }
  
  motionBlurEnd();
}`
  },
  
  {
      name: "DNA Sequence",
      group: "Minimal",
      description: "Visualizes music as a rotating DNA helix that reacts to different frequencies.",
      code: `/**
* DNA Sequence
* Music visualized as audio-reactive DNA structure
*/

function setup() {
  loadAudio("science_ambient.mp3");
  playAudio();
}

function draw(time) {
  // Dark blue background
  background(0, 5, 20);
  
  // Audio levels
  const bass = audiohz(80);
  const mids = audiohz(500);
  const highs = audiohz(3000);
  
  // DNA helix parameters
  const pairs = 20;
  const radius = 80 + bass * 50;
  const height = 600;
  const rotation = time * 0.0005;
  
  // Set up drawing style
  lineWidth(2 + mids * 3);
  
  // Create simplified DNA visualization
  for (let i = 0; i < pairs; i++) {
      // Position along the DNA strand
      const yPos = height * 0.1 + (i / pairs) * height * 0.8;
      const angleOffset = (i / pairs) * Math.PI * 4 + rotation;
      
      // Calculate strand positions
      const x1 = width/2 + Math.cos(angleOffset) * radius;
      const x2 = width/2 + Math.cos(angleOffset + Math.PI) * radius;
      
      // Calculate audio reactivity for this segment
      const segFreq = 100 + (i * 200);
      const energy = audiohz(segFreq);
      
      // Draw connecting rung with audio-reactive color
      const hue = (i * 15 + time * 0.01) % 360;
      stroke(\`hsl(\${hue}, 100%, \${50 + energy * 50}%)\`);
      glowStart(\`hsl(\${hue}, 100%, 70%)\`, 10 * energy);
      
      line(x1, yPos, x2, yPos);
      glowEnd();
      
      // Draw strand points
      fill(\`hsl(\${(hue + 180) % 360}, 100%, 70%)\`);
      glowStart(\`hsl(\${(hue + 180) % 360}, 100%, 70%)\`, 10);
      circle(x1, yPos, 6 + energy * 10);
      circle(x2, yPos, 6 + energy * 10);
      glowEnd();
  }
  
  // Add subtle particle background
  if (highs > 0.4) {
      fill(\`rgba(255, 255, 255, \${highs * 0.3})\`);
      visualParticle(0, 0, width, height, 20, 2000, 5000, false);
  }
}`
  },
  
  {
      name: "Circuit Beats",
      group: "Minimal",
      description: "Visualizes music as electronic circuitry with pulses of energy flowing through the connections.",
      code: `/**
* Circuit Beats
* Electronic circuit visualization that pulses with the music
*/

function setup() {
  loadAudio("electronic_glitch.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(5, 10, 15);
  
  // Audio levels
  const bass = audiohz(60);
  const mids = audiohz(800);
  const highs = audiohz(3000);
  
  // Create a grid of connection points
  const gridSize = 6;
  const points = [];
  
  // Generate grid points
  for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
          points.push({
              x: width * (0.15 + 0.7 * x/(gridSize-1)),
              y: height * (0.15 + 0.7 * y/(gridSize-1)),
              value: Math.sin(x * y + time * 0.0005) * 0.5 + 0.5
          });
      }
  }
  
  // Draw connections first
  lineWidth(1.5);
  for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      
      // Connect to nearby points
      for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Only connect nearby points
          if (dist < width * 0.2) {
              // Calculate energy in this connection
              const freq = 100 + (i * j) % 1000;
              const energy = audiohz(freq);
              
              if (energy > 0.2) {
                  const alpha = 0.3 + energy * 0.7;
                  const pulsePos = (time * 0.0001 * (1 + energy) + i * 0.1) % 1;
                  const pulseSize = 5 + energy * 10;
                  
                  // Draw the connection line
                  stroke(\`rgba(100, 200, 255, \${alpha})\`);
                  glowStart(\`rgba(100, 200, 255, \${alpha})\`, 3);
                  line(p1.x, p1.y, p2.x, p2.y);
                  glowEnd();
                  
                  // Draw pulse moving along the line
                  const pulseX = p1.x + dx * pulsePos;
                  const pulseY = p1.y + dy * pulsePos;
                  
                  fill(\`rgba(200, 255, 255, \${energy * 0.8})\`);
                  glowStart("white", 15 * energy);
                  circle(pulseX, pulseY, pulseSize);
                  glowEnd();
              }
          }
      }
  }
  
  // Draw nodes
  for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const freq = 200 + i * 50;
      const energy = audiohz(freq);
      
      // Node size based on energy and bass
      const size = 3 + p.value * 5 + energy * 8;
      
      // Draw node
      fill(\`rgba(50, 200, 255, \${0.5 + energy * 0.5})\`);
      glowStart("cyan", 10 * energy);
      circle(p.x, p.y, size);
      glowEnd();
  }
}`
  },
  {
    name: "Kaleidoscope",
    group: "Minimal",
    description: "Hypnotizing symmetric patterns that transform with the music.",
    code: `/**
* Kaleidoscope
* Creates symmetrical patterns that evolve with the music
*/

function setup() {
  loadAudio("electronic_ambient.mp3");
  playAudio();
}

function draw(time) {
  // Fade background for trails
  background(0, 0, 0, 0.1);
  
  // Audio levels
  const bass = audiohz(60);
  const mids = audiohz(800);
  const highs = audiohz(3000);
  
  // Center point
  const cx = width/2;
  const cy = height/2;
  
  // Settings
  const segments = 8;
  const maxPoints = 5;
  const radius = 100 + bass * 200;
  
  // Apply motion blur
  motionBlurStart(0.5, "lighter");
  
  // Create points for this frame
  for (let s = 0; s < segments; s++) {
      // Calculate base angle for this segment
      const segmentAngle = (s / segments) * Math.PI * 2;
      
      // Draw each point with its mirror
      for (let i = 0; i < maxPoints; i++) {
          // Point parameters
          const pointAngle = segmentAngle + time * (0.2 + i * 0.1) * (0.5 + bass);
          const dist = (i + 1) * radius / maxPoints * (0.5 + mids * 0.5);
          
          // Calculate position
          const x = cx + Math.cos(pointAngle) * dist;
          const y = cy + Math.sin(pointAngle) * dist;
          
          // Color based on segment and audio
          const hue = (s * 45 + time * 10) % 360;
          const size = 5 + highs * 15;
          
          // Draw points with glow
          fill(\`hsl(\${hue}, 100%, 60%)\`);
          glowStart(\`hsl(\${hue}, 100%, 60%)\`, 10 + bass * 20);
          circle(x, y, size);
          glowEnd();
          
          // Connect points with lines
          if (i > 0) {
              stroke(\`hsla(\${hue}, 100%, 70%, 0.6)\`);
              lineWidth(1 + bass * 3);
              const prevDist = (i) * radius / maxPoints * (0.5 + mids * 0.5);
              const px = cx + Math.cos(pointAngle - 0.1) * prevDist;
              const py = cy + Math.sin(pointAngle - 0.1) * prevDist;
              line(px, py, x, y);
          }
      }
  }
  
  motionBlurEnd();
}`
},

{
    name: "Cosmic Dust",
    group: "Minimal",
    description: "A mesmerizing particle system that forms cosmic dust clouds responsive to audio.",
    code: `/**
* Cosmic Dust
* Particle system that forms cosmic clouds
*/

function setup() {
    loadAudio("ambient_space.mp3");
    playAudio();
}

function draw(time) {
    // Fade background for particle trails
    background(5, 5, 15, 0.2);
    
    // Audio levels
    const bass = audiohz(60);
    const mids = audiohz(500);
    
    // Create dynamic orbital field
    const cx = width/2;
    const cy = height/2;
    const particleCount = 100;
    
    // Set blend mode for cosmic effect
    motionBlurStart(0.7, "screen");
    
    // Draw particles
    for (let i = 0; i < particleCount; i++) {
        // Calculate particle parameters
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.1;
        const orbitRadius = 100 + i * 2 + Math.sin(time * 0.2 + i * 0.1) * 50 * bass;
        const orbitSpeed = 0.0003 * (i % 5 + 1) * (1 + mids);
        
        // Calculate positions with orbit
        const x = cx + Math.cos(time * orbitSpeed + angle) * orbitRadius;
        const y = cy + Math.sin(time * orbitSpeed * 1.5 + angle) * orbitRadius * 0.6;
        
        // Color based on position
        const hue = (i * 3 + time * 5) % 360;
        const size = 2 + (i % 5) + bass * 5;
        
        // Draw particle with glow
        fill(\`hsla(\${hue}, 80%, 70%, \${0.3 + bass * 0.5})\`);
        glowStart(\`hsla(\${hue}, 80%, 60%, 0.5)\`, 10);
        circle(x, y, size);
        glowEnd();
    }
    
    motionBlurEnd();
    
    // Add central light source
    fill(255, 255, 200, 0.8);
    glowStart("rgba(255, 255, 200, 0.5)", 30 * (0.5 + bass * 0.5));
    circle(cx, cy, 20 + bass * 30);
    glowEnd();
}`
},

{
    name: "Neon Lines",
    group: "Minimal",
    description: "Simple animated pattern of bright neon lines that pulse with the beat.",
    code: `/**
* Neon Lines
* Simple pulsating neon lines that sync with music
*/

function setup() {
    loadAudio("synthwave.mp3");
    playAudio();
}

function draw(time) {
    // Dark background
    background(5, 0, 10);
    
    // Audio reactivity
    const bass = audiohz(60);
    const mids = audiohz(500);
    
    // Grid parameters
    const lines = 12;
    const spacing = height / (lines - 1);
    
    // Draw horizontal lines
    for (let i = 0; i < lines; i++) {
        // Calculate line parameters
        const y = spacing * i;
        const phase = i / lines * Math.PI * 2;
        
        // Animate width based on audio and time
        const amp = 0.5 + Math.sin(time * 0.5 + phase) * 0.5 * (0.5 + mids);
        const w = width * amp;
        
        // Calculate hue and intensity
        const hue = (i * 20 + time * 10) % 360;
        const lineThickness = 2 + bass * 8 * (1 + Math.sin(phase + time)) / 2;
        
        // Draw the line with glow
        lineWidth(lineThickness);
        stroke(\`hsl(\${hue}, 100%, 60%)\`);
        glowStart(\`hsl(\${hue}, 100%, 60%)\`, 10);
        
        line((width - w)/2, y, (width + w)/2, y);
        glowEnd();
    }
    
    // Add center circle that pulses with bass
    fill(255, 255, 255, 0.7);
    glowStart("white", 15 * bass);
    circle(width/2, height/2, 30 + bass * 70);
    glowEnd();
}`
},

{
    name: "Plasma Wave",
    group: "Minimal",
    description: "Colorful fluid-like plasma waves that respond to music frequencies.",
    code: `/**
* Plasma Wave
* Fluid-like plasma effect that reacts to music
*/

function setup() {
    loadAudio("ambient_electronic.mp3");
    playAudio();
}

function draw(time) {
    // Clear with slight fade for trails
    background(0, 0, 0, 0.2);
    
    // Get audio levels
    const bass = audiohz(60);
    const mids = audiohz(500);
    
    // Enable smooth blending
    motionBlurStart(0.5, "screen");
    
    // Draw plasma elements
    const cellSize = 30;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    
    // Draw each plasma cell
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Calculate position
            const posX = x * cellSize;
            const posY = y * cellSize;
            
            // Calculate plasma value using multiple sine waves
            const v1 = Math.sin(x * 0.1 + time * 0.5 * (1 + bass * 0.5));
            const v2 = Math.sin(y * 0.1 + time * 0.3);
            const v3 = Math.sin((x+y) * 0.1 + time * 0.7 * (1 + mids * 0.5));
            const v4 = Math.sin(Math.sqrt(x*x + y*y) * 0.1 + time * 0.2);
            
            // Combine waves
            const plasma = (v1 + v2 + v3 + v4) / 4;
            
            // Map to color with audio reactivity
            const hue = (plasma * 360 + time * 10) % 360;
            const size = cellSize * (0.5 + plasma * 0.5) * (1 + bass * 0.5);
            
            // Draw with glow effect
            fill(\`hsla(\${hue}, 100%, 60%, 0.5)\`);
            glowStart(\`hsla(\${hue}, 100%, 60%, 0.3)\`, 10);
            circle(posX, posY, size);
            glowEnd();
        }
    }
    
    motionBlurEnd();
}`
},

{
    name: "Star Field",
    group: "Minimal",
    description: "A simple but immersive star field that reacts to music with minimal code.",
    code: `/**
* Star Field
* Simple space travel effect that reacts to music
*/

function setup() {
    loadAudio("space_ambient.mp3");
    playAudio();
}

function draw(time) {
    // Space background
    background(0, 0, 10);
    
    // Audio levels
    const bass = audiohz(60);
    const highs = audiohz(3000);
    
    // Settings
    const stars = 200;
    const centerX = width / 2;
    const centerY = height / 2;
    const speedFactor = 0.5 + bass * 2;
    
    // Draw stars
    for (let i = 0; i < stars; i++) {
        // Star parameters based on index and time
        const angle = Math.sin(i * 100) * Math.PI * 2;
        const radius = ((time * (20 + i * 0.1) * speedFactor) % (width * 0.7)) + 1;
        
        // Calculate position with outward motion
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Skip if outside canvas
        if (x < 0 || x > width || y < 0 || y > height) continue;
        
        // Size and brightness increase with distance
        const size = 1 + (radius / width) * 5;
        const brightness = 50 + (radius / width) * 200;
        
        // Make some stars twinkle with high frequencies
        const twinkle = (i % 5 === 0) ? highs : 0;
        
        // Draw star with glow
        fill(\`rgb(\${brightness}, \${brightness}, \${brightness + 20})\`);
        glowStart("white", size * (1 + twinkle * 3));
        circle(x, y, size);
        glowEnd();
    }
    
    // Add central light flare on bass hits
    if (bass > 0.7) {
        fill(100, 150, 255, 0.3);
        glowStart("rgba(100, 150, 255, 0.3)", 50);
        circle(centerX, centerY, 50 + bass * 100);
        glowEnd();
    }
}`
},
{
  name: "Instrument Spectrum",
  group: "Advanced",
  description: "A clean visualization showing different instruments reacting to their specific frequency ranges.",
  code: `/**
* Instrument Spectrum
* Visualizes different instruments based on their frequency ranges
*/
var instruments = [];

function setup() {
  loadAudio("full_band.mp3");
  playAudio();
  
  // Define instrument frequency ranges and properties
  instruments = [
  {
      name: "Kick Drum",
      freqLow: 40,
      freqHigh: 100,
      color: "#FF3434",
      x: width * 0.2,
      y: height * 0.7,
      size: 80,
      lastEnergy: 0
  },
  {
      name: "Snare",
      freqLow: 120,
      freqHigh: 250,
      color: "#34FF34",
      x: width * 0.4,
      y: height * 0.5,
      size: 70,
      lastEnergy: 0
  },
  {
      name: "Hi-Hat",
      freqLow: 8000,
      freqHigh: 15000,
      color: "#FFFF34",
      x: width * 0.6,
      y: height * 0.3,
      size: 60,
      lastEnergy: 0
  },
  {
      name: "Bass",
      freqLow: 60,
      freqHigh: 200,
      color: "#3434FF",
      x: width * 0.8,
      y: height * 0.6,
      size: 90,
      lastEnergy: 0
  },
  {
      name: "Vocals",
      freqLow: 300,
      freqHigh: 2000,
      color: "#FF34FF",
      x: width * 0.5,
      y: height * 0.4,
      size: 70,
      lastEnergy: 0
  }
  ];
}

function draw(time) {
  // Dark background with fade for trails
  background(5, 5, 20, 0.2);
  
  // Create grid background
  createGrid(time);
  
  // Apply motion blur for smooth animations
  motionBlurStart(0.4, "screen");
  
  // Update and draw each instrument
  instruments.forEach(instrument => {
      // Get frequency energy for this instrument's range
      const energy = getFrequencyRangeEnergy(instrument.freqLow, instrument.freqHigh);
      
      // Apply smoothing for more natural visualization
      instrument.lastEnergy = instrument.lastEnergy * 0.7 + energy * 0.3;
      
      // Extract color components
      const color = hexToRgb(instrument.color);
      
      // Draw the instrument visualization
      drawInstrument(instrument, instrument.lastEnergy, time, color);
      
      // Add connecting lines between instruments
      drawConnections(instrument, time);
  });
  
  motionBlurEnd();
}

// Draw each instrument as a unique visualization
function drawInstrument(instrument, energy, time, color) {
  const { x, y, name, size } = instrument;
  const reactiveSize = size * (1 + energy * 1.5);
  const alpha = 0.7 + energy * 0.3;
  
  // Different visualization for each instrument type
  if (name === "Kick Drum") {
      // Kick drum as expanding rings
      for (let i = 0; i < 3; i++) {
          const ringSize = reactiveSize * (0.5 + i * 0.25) * (1 + energy * i);
          const ringAlpha = alpha * (1 - i * 0.2);
          
          lineWidth(2 + energy * 5);
          stroke(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${ringAlpha})\`);
          glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${ringAlpha * 0.7})\`, 10 * energy);
          circle(x, y, ringSize);
          glowEnd();
      }
      
      // Center impact
      fill(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`, 15 * energy);
      circle(x, y, reactiveSize * 0.3);
      glowEnd();
  } 
  else if (name === "Snare") {
      // Snare as crossing lines
      const crossSize = reactiveSize * 0.7;
      
      lineWidth(2 + energy * 6);
      stroke(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.7})\`, 8 * energy);
      
      // Draw crossed lines that vibrate with energy
      for (let i = 0; i < 3; i++) {
          const angle = (Math.PI / 3) * i + time * 0.001;
          const vibration = energy * 10;
          
          // Draw a pair of crossed lines
          line(
              x - crossSize * Math.cos(angle) + Math.random() * vibration, 
              y - crossSize * Math.sin(angle) + Math.random() * vibration,
              x + crossSize * Math.cos(angle) + Math.random() * vibration, 
              y + crossSize * Math.sin(angle) + Math.random() * vibration
          );
      }
      
      glowEnd();
      
      // Center circle
      fill(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.7})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.5})\`, 5 * energy);
      circle(x, y, reactiveSize * 0.2);
      glowEnd();
  }
  else if (name === "Hi-Hat") {
      // Hi-hat as small particles
      const particleCount = 15;
      const particleSize = 2 + energy * 4;
      
      fill(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.7})\`, 5 * energy);
      
      for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const dist = reactiveSize * 0.5 * (0.5 + Math.random() * 0.5 * energy);
          const px = x + Math.cos(angle) * dist;
          const py = y + Math.sin(angle) * dist;
          
          circle(px, py, particleSize);
      }
      
      glowEnd();
      
      // Circular outline
      lineWidth(1 + energy * 3);
      stroke(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.7})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.5})\`, 5 * energy);
      circle(x, y, reactiveSize * 0.7);
      glowEnd();
  }
  else if (name === "Bass") {
      // Bass as waves
      const waveCount = 5;
      const waveHeight = reactiveSize * 0.4 * energy;
      
      lineWidth(2 + energy * 5);
      stroke(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.7})\`, 10 * energy);
      
      for (let i = 0; i < waveCount; i++) {
          const waveY = y + ((i - waveCount/2) * reactiveSize * 0.25);
          
          context.beginPath();
          for (let wx = -reactiveSize; wx <= reactiveSize; wx += 10) {
              const sineFreq = 0.02 * (i + 1);
              const yOffset = Math.sin((wx + time * 0.05) * sineFreq) * waveHeight;
              context.lineTo(x + wx, waveY + yOffset);
          }
          context.stroke();
      }
      
      glowEnd();
      
      // Center point
      fill(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`, 10 * energy);
      circle(x, y, reactiveSize * 0.15);
      glowEnd();
  }
  else if (name === "Vocals") {
      // Vocals as ripples and waveform
      const maxRadius = reactiveSize * (0.5 + energy * 0.5);
      
      // Circular ripples
      lineWidth(1 + energy * 3);
      stroke(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.8})\`);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha * 0.6})\`, 8 * energy);
      
      for (let i = 1; i <= 3; i++) {
          const rippleRadius = maxRadius * (i/3) * (0.5 + (Math.sin(time * 0.003 * i) + 1) * 0.25);
          circle(x, y, rippleRadius);
      }
      glowEnd();
      
      // Central vocal waveform
      const waveWidth = reactiveSize * 0.8;
      const waveHeight = reactiveSize * 0.3 * energy;
      
      lineWidth(2 + energy * 3);
      glowStart(\`rgba(\${color.r}, \${color.g}, \${color.b}, \${alpha})\`, 8 * energy);
      
      context.beginPath();
      context.moveTo(x - waveWidth/2, y);
      
      for (let i = 0; i <= 20; i++) {
          const wx = x - waveWidth/2 + (waveWidth * (i / 20));
          const wy = y + Math.sin((i / 2) + time * 0.01) * waveHeight;
          context.lineTo(wx, wy);
      }
      
      context.stroke();
      glowEnd();
  }
  
  // Draw instrument label
  text(name, x, y + reactiveSize * 0.6 + 10, 14);
}

// Draw connections between instruments based on audio synchronization
function drawConnections(instrument, time) {
  instruments.forEach(other => {
      if (instrument === other) return;
      
      // Calculate correlation between instruments
      const freqA = (instrument.freqLow + instrument.freqHigh) / 2;
      const freqB = (other.freqLow + other.freqHigh) / 2;
      const energyA = instrument.lastEnergy;
      const energyB = other.lastEnergy;
      
      // Draw connection if both instruments are active
      if (energyA > 0.3 && energyB > 0.3) {
          const alpha = Math.min(energyA, energyB) * 0.5;
          const colorA = hexToRgb(instrument.color);
          const colorB = hexToRgb(other.color);
          
          // Gradient connection
          const gradient = context.createLinearGradient(
              instrument.x, instrument.y, other.x, other.y
          );
          gradient.addColorStop(0, \`rgba(\${colorA.r}, \${colorA.g}, \${colorA.b}, \${alpha})\`);
          gradient.addColorStop(1, \`rgba(\${colorB.r}, \${colorB.g}, \${colorB.b}, \${alpha})\`);
          
          context.strokeStyle = gradient;
          lineWidth(1 + (energyA + energyB) * 2);
          
          // Draw connecting line with dots
          context.beginPath();
          context.moveTo(instrument.x, instrument.y);
          
          // Add wave-like pattern to the connection
          const dx = other.x - instrument.x;
          const dy = other.y - instrument.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const steps = Math.floor(dist / 20);
          
          for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const wave = Math.sin(t * Math.PI * 4 + time * 0.002) * 10 * (energyA + energyB) * 0.5;
              const nx = instrument.x + dx * t;
              const ny = instrument.y + dy * t + wave;
              
              context.lineTo(nx, ny);
              
              // Add pulse dots along the connection
              if (i % 3 === 0 && Math.random() < (energyA + energyB) * 0.3) {
                  const pulseSize = 2 + (energyA + energyB) * 4;
                  fill(\`rgba(\${colorA.r}, \${colorA.g}, \${colorA.b}, \${alpha})\`);
                  circle(nx, ny, pulseSize);
              }
          }
          
          context.lineTo(other.x, other.y);
          context.stroke();
      }
  });
}

// Create subtle grid background
function createGrid(time) {
  stroke("rgba(100, 100, 255, 0.15)");
  lineWidth(0.5);
  
  // Horizontal lines
  for (let y = 0; y < height; y += 40) {
      line(0, y, width, y);
  }
  
  // Vertical lines
  for (let x = 0; x < width; x += 40) {
      line(x, 0, x, height);
  }
}

// Get energy in specific frequency range
function getFrequencyRangeEnergy(freqLow, freqHigh) {
  let totalEnergy = 0;
  let samples = 0;
  
  // Sample several points in the range
  for (let freq = freqLow; freq <= freqHigh; freq += (freqHigh - freqLow) / 5) {
      totalEnergy += audiohz(freq);
      samples++;
  }
  
  return samples > 0 ? totalEnergy / samples : 0;
}

// Helper to convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : {r: 255, g: 255, b: 255};
}`
},
{
  name: "PixiJS Demo (WebGL)",
  group: "PixiJS",
  description: "A demo showcasing PixiJS rendering capabilities",
  code: `// PixiJS WebGL Demo - Switch to PixiJS renderer in Settings tab
// This demo shows off improved performance with many particles

let particles = [];
const PARTICLE_COUNT = 1000;
const GLOW_STRENGTH = 45;
const COLORS = [
  [255, 50, 0],   // Red
  [255, 150, 0],  // Orange
  [255, 255, 0],  // Yellow
  [0, 255, 0],    // Green
  [0, 100, 255],  // Blue
  [150, 0, 255]   // Purple
];

function setup() {
  // Start with a black background
  background(0, 0, 0);

  loadAudio("blob:https://suno.com/cd852eb3-95a6-46e5-b2dd-3c653e8d9cd6");
  playAudio();

  // Enable motion blur and glow for nice effects
  motionBlurStart(0.8, 0.1);

  // Create initial particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createParticle();
  }
}

function createParticle() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  particles.push({
    x: width/2,
    y: height/2,
    vx: -5 + Math.random() * 10,
    vy: -5 + Math.random() * 10,
    radius: 1 + Math.random() * 3,
    color: color,
    life: 100 + Math.random() * 100
  });
}

function draw(time) {
  // Set semi-transparent background for trails
  fill(0, 0, 0, 0.1);
  rect(0, 0, width, height);

  // Enable glow effect
  glowStart(null, GLOW_STRENGTH);

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Apply gravity towards mouse or center
    const targetX = mouseX || width/2;
    const targetY = mouseY || height/2;
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 5) {
      p.vx += dx / dist * 0.2;
      p.vy += dy / dist * 0.2;
    }

    // Add some chaos with sine waves
    p.vx += Math.sin(time/1000 + p.y/30) * 0.05;
    p.vy += Math.cos(time/1000 + p.x/30) * 0.05;

    // Limit velocity
    const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if (speed > 10) {
      p.vx = (p.vx / speed) * 10;
      p.vy = (p.vy / speed) * 10;
    }

    // Draw particle
    fill(p.color[0], p.color[1], p.color[2], 0.2);
    circle(p.x, p.y, p.radius + audiohz(2000) * 20);

    // Reduce life and remove if dead
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
      createParticle();
    }
	}

  // End glow effect
  glowEnd();

  // Draw FPS and renderer info
  fill(255, 255, 255);
  const fps = Math.round(getFps());
  text("FPS: " + fps, 10, 20, 14);
  text("particle count: " + Math.round(particles.length), 10, 40, 14);
}`
},
{
  name: "Particles, layers, BPM detection and more",
  group: "Advanced",
  description: "A demo showcasing some advanced features like BPM detection and particle systems",
  code: `const settings = {
    // Visual settings
    baseHue: 220,          // Base color (blue)
    particleCount: 100,    // Number of particles
    layerCount: 3,         // Number of visual layers
    beatSensitivity: 0.65, // Beat detection sensitivity (0-1)
    
    // Audio frequencies to monitor
    bassFreq: 60,          // Bass frequency
    midFreq: 500,          // Mid frequency
    highFreq: 2000,        // High frequency
    
    // Animation settings
    rotationSpeed: 0.5,    // Base rotation speed
    pulseStrength: 1.2,    // Pulse effect strength
    transitionTime: 2.0,   // Transition duration in seconds
};

// Store particle systems, one per layer
let particleSystems = [];
let lastBeatTime = 0;
let currentPalette = [];
let transitionActive = false;
let currentScene = 0;
let sceneStartTime = 0;
let sceneDuration = 15; // 15 seconds per scene

function setup() {
    // Load audio and start playback
    loadAudio("Music/Inner Light.wav");
    playAudio();
    
    // Create our visual layers
    createLayer("background", 0);
    createLayer("midground", 10);
    createLayer("foreground", 20);
    
    // Generate initial color palette
    updateColorPalette();
    
    // Create particle systems for each layer
    const layers = ["background", "midground", "foreground"];
    for (let i = 0; i < settings.layerCount; i++) {
        particleSystems.push(new ParticleSystem({
            x: width / 2,
            y: height / 2,
            particleCount: 0,
            particleLifespan: 3 + i,
            particleSize: 3 + i * 2,
            particleColor: currentPalette,
            gravity: -0.02 * i,
            speed: 0.5 + i * 0.5,
            directionSpread: Math.PI * (2 - i * 0.5),
            emitRate: 10 - i * 3,
            opacity: 0.7,
            fadeOut: true,
            reactive: true
        }));
    }
    
    // Start with a scene change transition
    startTransition("fade", 2.0);
    transitionActive = true;
    sceneStartTime = 0;
}

function updateColorPalette() {
    // Generate a color palette based on base hue
    const baseColor = \`hsl(\${settings.baseHue}, 80%, 50%)\`;
    currentPalette = generatePalette(baseColor, 5, 'analogous');
}

function addBackgroundToLayer() {
    // Add a gradient background to the background layer
    addToLayer("background", (time) => {
        // Create a radial gradient background
        //const ctx = context;
        const gradient = ctx.createRadialGradient(
            width/2, height/2, 0,
            width/2, height/2, Math.max(width, height) / 1.5
        );
        
        // Get audio data for color reactivity
        const bassAmplitude = audiohz(settings.bassFreq);
        const midAmplitude = audiohz(settings.midFreq);
        
        // Use our color palette for the gradient
        gradient.addColorStop(0, currentPalette[0]);
        gradient.addColorStop(0.5 + midAmplitude * 0.3, currentPalette[1]);
        gradient.addColorStop(1, currentPalette[4]);
        
        // Fill the background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle noise texture
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 2;
            const alpha = 0.1 + Math.random() * 0.1;
            
            fill(255, 255, 255, alpha);
            circle(x, y, size);
        }
    });
}

function addVisualizerToLayer() {
    // Add audio visualizer to the midground layer
    addToLayer("midground", (time) => {
        // Get audio data
        const bands = getAudioBands(4); // Get 4 frequency bands
        const bassAmplitude = audiohz(settings.bassFreq);
        const midAmplitude = audiohz(settings.midFreq);
        const highAmplitude = audiohz(settings.highFreq);
        
        // Detect beat events
        const beatDetected = detectBeat(settings.beatSensitivity);
        
        // On beat, emit particles from all systems
        if (beatDetected) {
            const now = performance.now();
            if (now - lastBeatTime > 150) { // Prevent too frequent beats
                // Emit particles from each system based on frequency bands
                for (let i = 0; i < particleSystems.length; i++) {
                    const count = Math.floor(10 + bands[i % bands.length] * 30);
                    particleSystems[i].emit(count);
                }
                lastBeatTime = now;
                
                // Register beat for BPM detection
                registerBeat(time);
            }
        }
        
        // Create circular audio visualizer that reacts to the beat phase
        const bpm = getBPM();
        const beatPhase = getBeatPhase(time);
        
        // Calculate size based on beat phase and audio amplitude
        const pulseSize = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.2 * settings.pulseStrength;
        const baseRadius = height * 0.3 * (1 + bassAmplitude * 0.3);
        const radius = baseRadius * pulseSize;
        
        // Visualizer gets a glow effect
        glowStart(currentPalette[2], 15 + bassAmplitude * 10);
        
        // Draw circular visualizer
        visualCircular(
            width/2, height/2,               // Center position
            radius * 0.7, radius,            // Min/max radius
            64,                              // Point count
            20, 4000,                        // Frequency range
            time * settings.rotationSpeed,   // Rotation
            false                            // Already using glow
        );
        
        // Add rotation info
        fill(255, 255, 255, 0.7);
        text(\`BPM: \${bpm}\`, width - 20, height - 40, 16, "Arial", "right");
        
        glowEnd();
    });
}

function addParticlesToLayer() {
    // Add particles to the foreground layer
    addToLayer("foreground", (time) => {
        // Get audio data for reactivity
        const bassAmplitude = audiohz(settings.bassFreq);
        const midAmplitude = audiohz(settings.midFreq);
        const highAmplitude = audiohz(settings.highFreq);
        
        // Update and draw all particle systems
        for (let i = 0; i < particleSystems.length; i++) {
            // Update with time delta and audio reactivity
            particleSystems[i].update(0.016, bassAmplitude);
            
            // Draw with glow effect for prettier particles
            glowStart(currentPalette[i % currentPalette.length], 5 + midAmplitude * 10);
            particleSystems[i].draw(midAmplitude);
            glowEnd();
        }
    });
}

function setupScene(sceneIndex) {
    // Clear all layers
    clearLayer("background");
    clearLayer("midground");
    clearLayer("foreground");
    
    // Setup scene based on index
    switch (sceneIndex % 3) {
        case 0: // Blue/purple scene
            settings.baseHue = 240; // Blue base
            addBackgroundToLayer();
            addVisualizerToLayer();
            addParticlesToLayer();
            break;
            
        case 1: // Green/teal scene
            settings.baseHue = 160; // Green base
            addBackgroundToLayer();
            
            // Add a different style visualizer
            addToLayer("midground", (time) => {
                const bassAmplitude = audiohz(settings.bassFreq);
                const midAmplitude = audiohz(settings.midFreq);
                
                // Create spiral visualizer
                glowStart(currentPalette[1], 15);
                visualSpiral(
                    width/2, height/2,               // Position
                    20 + bassAmplitude * 20,         // Start radius
                    5 + midAmplitude * 10,           // Spacing
                    3 + bassAmplitude * 5,           // Turns
                    100,                             // Point count
                    20, 5000,                        // Freq range
                    -time * settings.rotationSpeed,  // Rotation
                    false                            // Already using glow
                );
                glowEnd();
            });
            addParticlesToLayer();
            break;
            
        case 2: // Warm colors (orange/red)
            settings.baseHue = 20; // Orange base
            addBackgroundToLayer();
            
            // Bar visualizer for this scene
            addToLayer("midground", (time) => {
                const highAmplitude = audiohz(settings.highFreq);
                
                glowStart(currentPalette[2], 10);
                visualBar(
                    0, height * 0.6,                // Position
                    width, height * 0.4,            // Size
                    40,                             // Bar count
                    2,                              // Spacing
                    5,                              // Min height
                    time * 0.1,                     // Slight rotation
                    true,                           // Mirror
                    false                           // Already using glow
                );
                glowEnd();
                
                // Draw some reactive circles
                for (let i = 0; i < 3; i++) {
                    const radius = 50 + i * 30 + highAmplitude * 50;
                    const hue = (settings.baseHue + i * 30) % 360;
                    
                    stroke(255, 255, 255, 0.2);
                    fill(0, 0, 0, 0);
                    circle(width/2, height * 0.4, radius, true);
                }
            });
            addParticlesToLayer();
            break;
    }
    
    // Update color palette for the new scene
    updateColorPalette();
}

function draw(time) {
    // Clear canvas
    clear();
    
    // Check if it's time to change scenes
    if (time - sceneStartTime > sceneDuration && !transitionActive) {
        currentScene = (currentScene + 1) % 3;
        startTransition("fade", settings.transitionTime);
        transitionActive = true;
        
        // Use a slight timeout to setup the new scene during transition
        setTimeout(() => {
            setupScene(currentScene);
        }, settings.transitionTime * 500); // Halfway through transition
        
        sceneStartTime = time;
    }
    
    // Apply transition effects if active
    if (transitionActive) {
        if (!applyTransition(time)) {
            transitionActive = false;
        }
    }
    
    // First time setup scene
    if (time < 0.1 && sceneStartTime === 0) {
        setupScene(currentScene);
        sceneStartTime = time;
    }
    
    // Draw all our visualization layers
    drawLayers(time);
    
    // Beat indicator in corner
    if (isOnBeat(time, 0.15)) {
        fill(255, 255, 255, 0.7);
        circle(20, 20, 10);
    }
}`
},
{
  name: "Neural Network Visualizer",
  group: "Advanced",
  description: "An AI-inspired visualization that simulates neural network connections reacting to music.",
  code: `/**
* Neural Network Visualizer
* Visualizes music as firing neurons and connections in a neural network
*/

let nodes = [];
let connections = [];
let activeConnections = [];

function setup() {
  loadAudio("electronic_ambient.mp3");
  playAudio();
  
  // Create neural network nodes
  const nodeCount = 30;
  for (let i = 0; i < nodeCount; i++) {
      // Position nodes in clusters with some randomness
      let x, y;
      
      if (i < nodeCount * 0.3) {
          // Input layer
          x = width * (0.2 + Math.random() * 0.15);
          y = height * (0.2 + Math.random() * 0.6);
      } else if (i < nodeCount * 0.7) {
          // Hidden layer
          x = width * (0.5 + Math.random() * 0.15);
          y = height * (0.2 + Math.random() * 0.6);
      } else {
          // Output layer
          x = width * (0.8 + Math.random() * 0.15);
          y = height * (0.2 + Math.random() * 0.6);
      }
      
      nodes.push({
          x, 
          y,
          size: 4 + Math.random() * 8,
          color: \`hsl(\${Math.random() * 40 + 190}, 100%, 60%)\`,
          lastActivation: 0,
          activationLevel: 0,
          frequency: 100 + Math.random() * 900
      });
  }
  
  // Create connections between nodes
  for (let i = 0; i < nodes.length; i++) {
      // Each node connects to 2-5 nodes in the next layers
      const connectionCount = 2 + Math.floor(Math.random() * 4);
      
      for (let j = 0; j < connectionCount; j++) {
          // Connect to nodes in next layers (no connections to earlier layers)
          const targetIdx = Math.floor(i + 1 + Math.random() * (nodes.length - i - 1));
          
          if (targetIdx < nodes.length && targetIdx !== i) {
              connections.push({
                  source: i,
                  target: targetIdx,
                  weight: 0.5 + Math.random() * 0.5,
                  color: \`hsla(\${Math.random() * 40 + 190}, 100%, 70%, 0.5)\`,
                  pulsePosition: 0,
                  pulseActive: false,
                  pulseSpeed: 0.05 + Math.random() * 0.15
              });
          }
      }
  }
}

function draw(time) {
  // Subtle fade effect for trails
  background(10, 10, 20, 0.2);
  
  // Get audio levels at different frequencies
  const bassLevel = audiohz(60);
  const midLevel = audiohz(500);
  const highLevel = audiohz(3000);
  
  // Motion blur for smoother animations
  motionBlurStart(0.3, "screen");
  
  // Draw connections first (below nodes)
  drawConnections(time, bassLevel, midLevel, highLevel);
  
  // Then draw nodes on top
  drawNodes(time, bassLevel, midLevel, highLevel);
  
  motionBlurEnd();
  
  // Add subtle grid in the background
  drawGrid();
  
  // Add HUD-like display stats
  drawNetworkStats(time, bassLevel, midLevel, highLevel);
}

function drawConnections(time, bassLevel, midLevel, highLevel) {
  // Update connection activations based on node activations
  for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      const sourceNode = nodes[conn.source];
      const targetNode = nodes[conn.target];
      
      // Check if source node is activated enough to send signal
      if (sourceNode.activationLevel > 0.6 && !conn.pulseActive) {
          // Start a new pulse along this connection
          if (Math.random() < sourceNode.activationLevel) {
              conn.pulseActive = true;
              conn.pulsePosition = 0;
              activeConnections.push(i); // Track active connections
          }
      }
      
      // Draw the connection
      lineWidth(1 + conn.weight * 2);
      
      // Base connection
      stroke(\`hsla(\${parseInt(conn.color.slice(4))}, 0.2)\`);
      line(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
      
      // Draw active pulse on connection if it exists
      if (conn.pulseActive) {
          // Calculate position along the connection
          const progress = conn.pulsePosition;
          const x = sourceNode.x + (targetNode.x - sourceNode.x) * progress;
          const y = sourceNode.y + (targetNode.y - sourceNode.y) * progress;
          
          // Draw pulse
          const pulseColor = conn.color.replace('0.5', '0.8');
          fill(pulseColor);
          glowStart(pulseColor, 15 * conn.weight);
          circle(x, y, 3 + conn.weight * 4);
          glowEnd();
          
          // Update pulse position
          conn.pulsePosition += conn.pulseSpeed * (0.5 + midLevel);
          
          // If pulse reaches the end, activate the target node
          if (conn.pulsePosition >= 1) {
              targetNode.activationLevel = Math.min(1, targetNode.activationLevel + 0.5 * conn.weight);
              targetNode.lastActivation = time;
              conn.pulseActive = false;
              conn.pulsePosition = 0;
              
              // Remove from active connections
              const idx = activeConnections.indexOf(i);
              if (idx !== -1) activeConnections.splice(idx, 1);
          }
      }
  }
}

function drawNodes(time, bassLevel, midLevel, highLevel) {
  // Process nodes with audio reactivity
  for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Input layer nodes are directly activated by specific frequencies
      if (i < nodes.length * 0.3) {
          const frequency = node.frequency;
          const energy = audiohz(frequency);
          if (energy > 0.5) {
              node.activationLevel = Math.min(1, node.activationLevel + energy * 0.5);
              node.lastActivation = time;
          }
      }
      
      // All nodes fade activation over time
      const timeSinceActivation = time - node.lastActivation;
      if (timeSinceActivation > 0.1) {
          node.activationLevel *= 0.95;
      }
      
      // Draw node with activation level
      const activationColor = node.color.replace('60%', \`\${60 + node.activationLevel * 40}%\`);
      const nodeSize = node.size * (1 + node.activationLevel * bassLevel * 2);
      
      // Outer glow for active nodes
      if (node.activationLevel > 0.3) {
          glowStart(activationColor, nodeSize * node.activationLevel * 1.5);
      }
      
      // Draw node circle
      fill(activationColor);
      circle(node.x, node.y, nodeSize);
      
      if (node.activationLevel > 0.3) {
          glowEnd();
      }
      
      // Add ripple effect on strong activations
      if (node.activationLevel > 0.8 && timeSinceActivation < 0.3) {
          const rippleSize = nodeSize * 2 * (timeSinceActivation / 0.3);
          stroke(\`\${activationColor.slice(0, -1)}, \${0.5 - timeSinceActivation / 0.6})\`);
          lineWidth(2);
          circle(node.x, node.y, rippleSize, true);
      }
  }
}

function drawGrid() {
  // Draw subtle grid in the background
  stroke("rgba(100, 100, 255, 0.1)");
  lineWidth(0.5);
  
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
      line(x, 0, x, height);
  }
  
  for (let y = 0; y < height; y += gridSize) {
      line(0, y, width, y);
  }
}

function drawNetworkStats(time, bassLevel, midLevel, highLevel) {
  // Count activated nodes
  let activeNodes = 0;
  nodes.forEach(node => {
      if (node.activationLevel > 0.5) activeNodes++;
  });
  
  // Create a display for network stats
  fill("rgba(0, 200, 255, 0.8)");
  
  // Left side stats
  text(\`NETWORK STATUS\`, 20, 30, 16, "monospace");
  text(\`ACTIVE NODES: \${activeNodes}/\${nodes.length}\`, 20, 60, 14, "monospace");
  text(\`SIGNALS: \${activeConnections.length}\`, 20, 80, 14, "monospace");
  text(\`BASS RESPONSE: \${Math.round(bassLevel * 100)}%\`, 20, 100, 14, "monospace");
  
  // Right side stats with VU meter for frequencies
  const meterWidth = 120;
  const meterHeight = 8;
  
  // Draw meter outlines
  stroke("rgba(0, 200, 255, 0.5)");
  lineWidth(1);
  rect(width - 20 - meterWidth, 30, meterWidth, meterHeight, true);
  rect(width - 20 - meterWidth, 50, meterWidth, meterHeight, true);
  rect(width - 20 - meterWidth, 70, meterWidth, meterHeight, true);
  
  // Draw meter fills
  fill("rgba(0, 200, 255, 0.6)");
  rect(width - 20 - meterWidth, 30, meterWidth * bassLevel, meterHeight);
  rect(width - 20 - meterWidth, 50, meterWidth * midLevel, meterHeight);
  rect(width - 20 - meterWidth, 70, meterWidth * highLevel, meterHeight);
  
  // Labels
  fill("rgba(0, 200, 255, 0.8)");
  text("BASS", width - 20 - meterWidth - 50, 38, 12, "monospace", "right");
  text("MID", width - 20 - meterWidth - 50, 58, 12, "monospace", "right");
  text("HIGH", width - 20 - meterWidth - 50, 78, 12, "monospace", "right");
}`
},
{
  name: "Audio Spectrum Analyzer",
  group: "Advanced",
  description: "A professional-looking spectrum analyzer with detailed frequency display and multiple visualization modes.",
  code: `/**
* Audio Spectrum Analyzer
* A professional-looking spectrum analyzer with multiple visualization modes
*/

const settings = {
  spectrumBars: 128,       // Number of frequency bars
  spectrumMinFreq: 20,     // Minimum frequency (Hz)
  spectrumMaxFreq: 16000,  // Maximum frequency (Hz)
  spectrumLog: true,       // Use logarithmic scaling for frequencies
  spectrumSmoothing: 0.85, // Smoothing factor (0-1)
  displayMode: 0,          // Current visualization mode
  modeCount: 3,            // Total number of visualization modes
  dbMin: -70,              // Minimum dB level to display
  dbMax: 0,                // Maximum dB level (0 dB = max amplitude)
  showPeaks: true,         // Show peak indicators
  peakHoldTime: 1.5,       // Seconds to hold peaks
  peakFalloff: 0.08,       // How quickly peaks fall
  colorTheme: "spectrum",  // Color theme: "spectrum", "blue", "green", "monochrome"
};

// State variables
let spectrumData = [];       // Current spectrum data
let peakData = [];           // Peak data for each bar
let lastPeakTime = [];       // Time when each peak was recorded
let avgEnergy = 0;           // Average energy across spectrum
let bassEnergy = 0;          // Bass energy (for reactivity)
let modeSwitchTime = 0;      // Time when mode was last switched
let switchEffect = 0;        // Mode switch animation (0-1)
let modeNames = [            // Names for the different visualization modes
  "Spectrum Analyzer", 
  "Circular Spectrum",
  "3D Terrain View"
];

function setup() {
  loadAudio("sounds/electronic_beat.mp3");
  playAudio();
  
  // Initialize arrays
  spectrumData = new Array(settings.spectrumBars).fill(0);
  peakData = new Array(settings.spectrumBars).fill(0);
  lastPeakTime = new Array(settings.spectrumBars).fill(0);
}

function draw(time) {
  // Dark background
  background(10, 12, 16);
  
  // Update spectrum data
  updateSpectrumData();
  
  // Draw visualizer based on current mode
  switch (settings.displayMode) {
      case 0:
          drawBarSpectrum(time);
          break;
      case 1:
          drawCircularSpectrum(time);
          break;
      case 2:
          draw3DTerrainSpectrum(time);
          break;
  }
  
  // Draw UI controls and info
  drawControls(time);
  
  // Handle mode switch animation
  if (switchEffect > 0) {
      switchEffect *= 0.9;
      if (switchEffect < 0.01) switchEffect = 0;
      
      // Draw switch effect overlay
      fill(\`rgba(255, 255, 255, \${switchEffect * 0.3})\`);
      rect(0, 0, width, height);
  }
}

function updateSpectrumData() {
  // Get new audio data
  let newData = [];
  let totalEnergy = 0;
  let bassSum = 0;
  
  // Sample frequencies across spectrum
  for (let i = 0; i < settings.spectrumBars; i++) {
      // Calculate frequency for this bar (linear or logarithmic)
      let freq;
      if (settings.spectrumLog) {
          // Logarithmic scaling gives more detail to lower frequencies
          const logMin = Math.log10(settings.spectrumMinFreq);
          const logMax = Math.log10(settings.spectrumMaxFreq);
          const scale = (logMax - logMin) / settings.spectrumBars;
          freq = Math.pow(10, logMin + scale * i);
      } else {
          // Linear scaling
          const range = settings.spectrumMaxFreq - settings.spectrumMinFreq;
          freq = settings.spectrumMinFreq + (range * i / settings.spectrumBars);
      }
      
      // Get amplitude at this frequency and convert to dB
      const amplitude = audiohz(freq);
      const db = amplitude > 0 ? 20 * Math.log10(amplitude) : settings.dbMin;
      
      // Normalize to 0-1 range based on dbMin and dbMax
      const normalized = Math.max(0, Math.min(1, 
          (db - settings.dbMin) / (settings.dbMax - settings.dbMin)
      ));
      
      newData[i] = normalized;
      totalEnergy += normalized;
      
      // Accumulate bass energy (lower 10% of spectrum)
      if (i < settings.spectrumBars * 0.1) {
          bassSum += normalized;
      }
  }
  
  // Apply smoothing
  for (let i = 0; i < settings.spectrumBars; i++) {
      spectrumData[i] = spectrumData[i] * settings.spectrumSmoothing + 
                        newData[i] * (1 - settings.spectrumSmoothing);
                        
      // Update peaks
      if (spectrumData[i] > peakData[i]) {
          peakData[i] = spectrumData[i];
          lastPeakTime[i] = performance.now() / 1000;
      } else {
          // Decay peaks over time
          const peakAge = performance.now() / 1000 - lastPeakTime[i];
          if (peakAge > settings.peakHoldTime) {
              peakData[i] -= settings.peakFalloff;
              peakData[i] = Math.max(0, Math.min(peakData[i], 1));
          }
      }
  }
  
  // Calculate average energy
  avgEnergy = totalEnergy / settings.spectrumBars;
  
  // Calculate bass energy (average of lower frequencies)
  bassEnergy = bassSum / (settings.spectrumBars * 0.1);
}

function drawBarSpectrum(time) {
  const barWidth = width / settings.spectrumBars;
  const maxHeight = height * 0.7; // Maximum height of spectrum bars
  
  // Draw spectrum bars
  for (let i = 0; i < settings.spectrumBars; i++) {
      const x = i * barWidth;
      const barHeight = spectrumData[i] * maxHeight;
      
      // Get color based on theme and frequency
      const barColor = getSpectrumColor(i / settings.spectrumBars, spectrumData[i]);
      
      // Draw the bar
      fill(barColor);
      rect(x, height - barHeight, barWidth - 1, barHeight);
      
      // Draw peak if enabled
      if (settings.showPeaks) {
          const peakY = height - (peakData[i] * maxHeight);
          stroke(\`rgba(255, 255, 255, 0.8)\`);
          lineWidth(2);
          line(x, peakY, x + barWidth - 1, peakY);
      }
  }
  
  // Draw frequency grid lines and labels
  drawFrequencyGrid(maxHeight);
  
  // Draw horizontal dB scale lines
  drawDBScale(maxHeight);
}

function drawCircularSpectrum(time) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;
  
  // Draw circular spectrum
  for (let i = 0; i < settings.spectrumBars; i++) {
      const angle = (i / settings.spectrumBars) * Math.PI * 2;
      const barHeight = spectrumData[i] * maxRadius;
      
      // Get color based on theme and frequency
      const barColor = getSpectrumColor(i / settings.spectrumBars, spectrumData[i]);
      
      // Calculate points for wedge
      const innerRadius = maxRadius * 0.1;
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight);
      
      // Draw wedge line
      stroke(barColor);
      lineWidth(2);
      line(x1, y1, x2, y2);
      
      // Draw peak marker if enabled
      if (settings.showPeaks) {
          const peakRadius = innerRadius + (peakData[i] * maxRadius);
          const peakX = centerX + Math.cos(angle) * peakRadius;
          const peakY = centerY + Math.sin(angle) * peakRadius;
          
          fill("rgba(255, 255, 255, 0.8)");
          circle(peakX, peakY, 3);
      }
  }
  
  // Draw circular grid lines
  const gridSteps = 5;
  for (let i = 1; i <= gridSteps; i++) {
      const radius = (maxRadius / gridSteps) * i;
      stroke("rgba(255, 255, 255, 0.1)");
      lineWidth(1);
      circle(centerX, centerY, radius, true);
      
      // Add dB labels
      const dbVal = Math.round(settings.dbMin + 
          (settings.dbMax - settings.dbMin) * (i / gridSteps));
      fill("rgba(200, 200, 200, 0.6)");
      text(\`\${dbVal} dB\`, centerX + 5, centerY - radius + 15, 12);
  }
  
  // Draw frequency labels at key points
  const freqLabels = [100, 1000, 10000];
  freqLabels.forEach(freq => {
      // Find closest bar to this frequency
      const logMin = Math.log10(settings.spectrumMinFreq);
      const logMax = Math.log10(settings.spectrumMaxFreq);
      const freqPosition = (Math.log10(freq) - logMin) / (logMax - logMin);
      const barIndex = Math.floor(freqPosition * settings.spectrumBars) % settings.spectrumBars;
      
      const angle = (barIndex / settings.spectrumBars) * Math.PI * 2;
      const labelX = centerX + Math.cos(angle) * (maxRadius + 20);
      const labelY = centerY + Math.sin(angle) * (maxRadius + 20);
      
      fill("rgba(200, 200, 255, 0.8)");
      if (freq >= 1000) {
          text(\`\${freq/1000}k Hz\`, labelX, labelY, 12, "Arial", "center");
      } else {
          text(\`\${freq} Hz\`, labelX, labelY, 12, "Arial", "center");
      }
  });
  
  // Add dynamic elements that respond to bass
  if (bassEnergy > 0.4) {
      const pulseSize = maxRadius * 0.1 * bassEnergy;
      stroke(\`rgba(255, 255, 255, \${bassEnergy * 0.3})\`);
      lineWidth(bassEnergy * 5);
      circle(centerX, centerY, maxRadius + pulseSize, true);
  }
}

function draw3DTerrainSpectrum(time) {
  const horizon = height * 0.55;
  const perspectiveRows = 30;
  const terrainHeight = height * 0.4;
  
  // Draw sky gradient background
  const skyGradient = context.createLinearGradient(0, 0, 0, horizon);
  skyGradient.addColorStop(0, "rgba(10, 10, 40, 1)");
  skyGradient.addColorStop(1, "rgba(60, 20, 40, 1)");
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, horizon);
  
  // Draw sun/moon that reacts to overall energy
  const sunRadius = 40 + avgEnergy * 20;
  const sunY = horizon - 60 - avgEnergy * 40;
  
  glowStart("rgba(255, 200, 100, 0.7)", 30);
  fill("rgba(255, 220, 100, 0.9)");
  circle(width * 0.8, sunY, sunRadius);
  glowEnd();
  
  // Draw "terrain" rows from back to front
  for (let z = perspectiveRows; z >= 0; z--) {
      // Calculate row parameters
      const perspectiveScale = z / perspectiveRows;
      const rowY = horizon + (1 - perspectiveScale) * terrainHeight;
      const alpha = 0.3 + (1 - perspectiveScale) * 0.7;
      
      // Draw this row of the spectrum
      drawTerrainRow(rowY, perspectiveScale, alpha, time - z * 0.05);
  }
  
  // Grid overlay
  drawTerrainGrid(horizon, terrainHeight);
}

function drawTerrainRow(y, scale, alpha, time) {
  // Draw spectrum data as a terrain slice
  context.beginPath();
  context.moveTo(0, y);
  
  const heightScale = height * 0.3 * (1 - scale);
  
  for (let i = 0; i < settings.spectrumBars; i++) {
      const x = (i / settings.spectrumBars) * width;
      
      // Get data for this point with some interpolation for smoothness
      const index = Math.floor(i * spectrumData.length / settings.spectrumBars);
      const nextIndex = Math.min(spectrumData.length - 1, index + 1);
      const fraction = (i * spectrumData.length / settings.spectrumBars) - index;
      
      let value = spectrumData[index] * (1 - fraction) + spectrumData[nextIndex] * fraction;
      
      // Add some gentle noise to the terrain
      value += Math.sin(x * 0.01 + time) * 0.05;
      
      // Calculate y-position
      const terrainY = y - value * heightScale;
      context.lineTo(x, terrainY);
  }
  
  // Complete the terrain shape
  context.lineTo(width, y);
  context.closePath();
  
  // Color gradient for the terrain
  const terrainGradient = context.createLinearGradient(0, y - heightScale, 0, y);
  
  if (settings.colorTheme === "spectrum") {
      terrainGradient.addColorStop(0, \`rgba(200, 100, 255, \${alpha})\`);
      terrainGradient.addColorStop(0.5, \`rgba(100, 200, 255, \${alpha})\`);
      terrainGradient.addColorStop(1, \`rgba(0, 100, 130, \${alpha})\`);
  } else if (settings.colorTheme === "blue") {
      terrainGradient.addColorStop(0, \`rgba(100, 200, 255, \${alpha})\`);
      terrainGradient.addColorStop(1, \`rgba(0, 50, 100, \${alpha})\`);
  } else if (settings.colorTheme === "green") {
      terrainGradient.addColorStop(0, \`rgba(100, 255, 150, \${alpha})\`);
      terrainGradient.addColorStop(1, \`rgba(0, 100, 50, \${alpha})\`);
  } else {
      terrainGradient.addColorStop(0, \`rgba(200, 200, 200, \${alpha})\`);
      terrainGradient.addColorStop(1, \`rgba(40, 40, 40, \${alpha})\`);
  }
  
  context.fillStyle = terrainGradient;
  context.fill();
  
  // Add grid lines on terrain
  stroke(\`rgba(255, 255, 255, \${0.1 * alpha})\`);
  lineWidth(1);
  line(0, y, width, y);
}

function drawTerrainGrid(horizon, terrainHeight) {
  // Draw perspective grid
  stroke("rgba(255, 255, 255, 0.2)");
  lineWidth(1);
  
  // Vertical grid lines
  const gridColumns = 10;
  for (let i = 0; i <= gridColumns; i++) {
      const x = (i / gridColumns) * width;
      context.beginPath();
      context.moveTo(x, horizon);
      context.lineTo(x, height);
      context.stroke();
  }
  
  // Add frequency labels
  fill("rgba(200, 200, 255, 0.7)");
  const freqLabels = [100, 1000, 10000];
  freqLabels.forEach(freq => {
      const logMin = Math.log10(settings.spectrumMinFreq);
      const logMax = Math.log10(settings.spectrumMaxFreq);
      const freqPosition = (Math.log10(freq) - logMin) / (logMax - logMin);
      const x = freqPosition * width;
      
      if (freq >= 1000) {
          text(\`\${freq/1000}k Hz\`, x, height - 10, 12, "Arial", "center");
      } else {
          text(\`\${freq} Hz\`, x, height - 10, 12, "Arial", "center");
      }
  });
}

function drawFrequencyGrid(maxHeight) {
  // Draw frequency grid lines and labels
  stroke("rgba(255, 255, 255, 0.1)");
  lineWidth(1);
  
  // Key frequencies to label
  const freqLabels = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  
  freqLabels.forEach(freq => {
      // Calculate position
      const logMin = Math.log10(settings.spectrumMinFreq);
      const logMax = Math.log10(settings.spectrumMaxFreq);
      const position = (Math.log10(freq) - logMin) / (logMax - logMin);
      
      if (position >= 0 && position <= 1) {
          const x = position * width;
          
          // Draw grid line
          line(x, height - maxHeight, x, height);
          
          // Draw label
          fill("rgba(200, 200, 255, 0.7)");
          if (freq >= 1000) {
              text(\`\${freq/1000}k\`, x, height - maxHeight - 5, 10, "Arial", "center");
          } else {
              text(\`\${freq}\`, x, height - maxHeight - 5, 10, "Arial", "center");
          }
      }
  });
}

function drawDBScale(maxHeight) {
  // Draw horizontal dB scale lines
  stroke("rgba(255, 255, 255, 0.1)");
  lineWidth(1);
  
  // Draw dB lines at -10dB intervals
  const dbLines = [0, -10, -20, -30, -40, -50, -60];
  
  dbLines.forEach(db => {
      if (db >= settings.dbMin && db <= settings.dbMax) {
          const normalized = (db - settings.dbMin) / (settings.dbMax - settings.dbMin);
          const y = height - (normalized * maxHeight);
          
          // Draw line
          line(0, y, width, y);
          
          // Draw label
          fill("rgba(200, 200, 200, 0.7)");
          text(\`\${db} dB\`, 10, y - 5, 10);
      }
  });
}

function getSpectrumColor(position, intensity) {
  // Get color based on selected theme
  if (settings.colorTheme === "spectrum") {
      // Full spectrum colors
      const hue = 220 + position * 180; // Blue to red
      return \`hsla(\${hue}, 100%, \${50 + intensity * 50}%, \${0.3 + intensity * 0.7})\`;
  } else if (settings.colorTheme === "blue") {
      // Blue theme
      return \`rgba(\${50 + intensity * 100}, \${100 + intensity * 155}, 255, \${0.4 + intensity * 0.6})\`;
  } else if (settings.colorTheme === "green") {
      // Green theme
      return \`rgba(\${50 + intensity * 100}, 255, \${50 + intensity * 100}, \${0.4 + intensity * 0.6})\`;
  } else {
      // Monochrome theme
      return \`rgba(200, 200, 200, \${0.3 + intensity * 0.7})\`;
  }
}

function drawControls(time) {
  // Draw UI border and title bar
  fill("rgba(0, 0, 0, 0.5)");
  rect(0, 0, width, 40);
  
  // Draw visualization mode name
  fill("rgba(255, 255, 255, 0.9)");
  text(modeNames[settings.displayMode], width / 2, 25, 18, "Arial", "center");
  
  // Draw controls hint at the bottom
  fill("rgba(255, 255, 255, 0.7)");
  text("CLICK TO CHANGE VISUALIZATION MODE", width / 2, height - 20, 14, "Arial", "center");
  
  // Display current audio stats
  const displayStats = [
      \`AVG: \${Math.round(avgEnergy * 100)}%\`, 
      \`BASS: \${Math.round(bassEnergy * 100)}%\`,
      \`PEAK: \${Math.round(Math.max(...spectrumData) * 100)}%\`
  ];
  
  fill("rgba(200, 255, 200, 0.7)");
  displayStats.forEach((stat, i) => {
      text(stat, 20 + i * 100, 25, 14, "monospace");
  });
}

// Handle clicks to switch modes
window.addEventListener('click', () => {
  settings.displayMode = (settings.displayMode + 1) % settings.modeCount;
  modeSwitchTime = performance.now() / 1000;
  switchEffect = 1.0;
});`
},
{
  name: "Liquid Music Waves",
  group: "Advanced",
  description: "Elegant flowing liquid waves that respond organically to the music with realistic physics.",
  code: `/**
* Liquid Music Waves
* Elegant flowing liquid waves with realistic physics
*/

// Simulation settings
const settings = {
  waveCount: 3,          // Number of stacked waves
  resolution: 120,       // Number of points per wave
  baseWaveHeight: 100,   // Base height of waves
  waveSpacing: 50,       // Vertical spacing between waves
  tension: 0.025,        // Wave spring tension (stiffness)
  dampening: 0.025,      // Wave dampening factor
  spread: 0.25,          // How much waves affect neighboring points
  noiseScale: 0.01,      // Scale of noise for organic movement
  velocityScale: 2,      // Multiplier for velocity
  reactivity: 1.2,       // Audio reactivity factor
  freqBandSize: 200,     // Size of frequency bands for audio detection
  colorMode: "gradient", // "gradient", "monochrome", or "rainbow"
  reflective: true,      // Whether to show reflection
  reflectionOpacity: 0.3 // Opacity of reflection
};

// Wave simulation data
let waves = [];

function setup() {
  loadAudio("sounds/ambient_piano.mp3");
  playAudio();
  
  // Create wave simulation points
  resetWaves();
}

function resetWaves() {
  waves = [];
  
  for (let w = 0; w < settings.waveCount; w++) {
      const wave = {
          points: [],
          baseY: height * 0.5 + (w - settings.waveCount/2) * settings.waveSpacing
      };
      
      // Create points for this wave
      for (let i = 0; i < settings.resolution; i++) {
          wave.points.push({
              x: (width * i) / (settings.resolution - 1),
              y: wave.baseY,
              vy: 0,  // Velocity y
              force: 0 // Current force
          });
      }
      
      waves.push(wave);
  }
}

function draw(time) {
  // Dark background with gradient
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgb(10, 15, 30)");
  gradient.addColorStop(1, "rgb(5, 10, 20)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  
  // Apply motion blur for smoother animation
  motionBlurStart(0.3, "lighter");
  
  // Update and draw waves
  updateWaves(time);
  drawWaves(time);
  
  motionBlurEnd();
  
  // Add subtle particle atmosphere
  drawAtmosphere(time);
  
  // Draw UI elements
  drawUI(time);
}

function updateWaves(time) {
  // Apply audio-reactive forces to waves
  applyAudioForces(time);
  
  // Update wave physics
  for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      
      // Update each point in the wave
      for (let i = 0; i < wave.points.length; i++) {
          const point = wave.points[i];
          
          // Calculate spring force to return to rest position
          let springForce = (wave.baseY - point.y) * settings.tension;
          
          // Add damping force to reduce oscillation
          let dampForce = -point.vy * settings.dampening;
          
          // Add ambient movement using noise
          let noiseForce = (Math.sin(time * 0.5 + i * settings.noiseScale) * 0.2) + 
                          (Math.cos(time * 0.3 + i * settings.noiseScale * 2) * 0.1);
          
          // Apply forces
          point.force = springForce + dampForce + noiseForce;
          
          // Update velocity and position
          point.vy += point.force * settings.velocityScale;
          point.y += point.vy;
      }
      
      // Wave propagation - points affect neighbors
      let leftDeltas = new Array(wave.points.length).fill(0);
      let rightDeltas = new Array(wave.points.length).fill(0);
      
      for (let pass = 0; pass < 8; pass++) {  // Multiple passes for smoother propagation
          for (let i = 0; i < wave.points.length; i++) {
              // Affect left neighbor
              if (i > 0) {
                  leftDeltas[i] = settings.spread * (wave.points[i].y - wave.points[i-1].y);
                  wave.points[i-1].vy += leftDeltas[i];
              }
              
              // Affect right neighbor
              if (i < wave.points.length - 1) {
                  rightDeltas[i] = settings.spread * (wave.points[i].y - wave.points[i+1].y);
                  wave.points[i+1].vy += rightDeltas[i];
              }
          }
          
          // Apply deltas
          for (let i = 0; i < wave.points.length; i++) {
              if (i > 0) wave.points[i-1].y += leftDeltas[i];
              if (i < wave.points.length - 1) wave.points[i+1].y += rightDeltas[i];
          }
      }
  }
}

function applyAudioForces(time) {
  // Apply audio-reactive forces to waves at certain points
  for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      
      // Calculate base frequency for this wave
      const baseFreq = 40 + w * 400;
      
      // Apply force at specific points based on audio
      for (let i = 0; i < wave.points.length; i++) {
          // Calculate frequency for this point
          const pointPosition = i / wave.points.length;
          const freq = baseFreq + pointPosition * settings.freqBandSize;
          
          // Get audio amplitude at this frequency
          const amp = audiohz(freq) * settings.reactivity;
          
          // Apply force at selected points
          if (i % 8 === 0 || amp > 0.6) {  // Regular intervals or on strong beats
              wave.points[i].vy += (Math.random() - 0.5) * amp * 10;
          }
      }
      
      // Apply force based on bass for the entire wave
      const bassAmp = audiohz(60);
      if (bassAmp > 0.6) {
          for (let i = 0; i < wave.points.length; i++) {
              // Bass creates more uniform movement
              wave.points[i].vy += (Math.random() * 2 - 1) * bassAmp * 5;
          }
      }
      
      // Sharp impulses on percussion hits
      const highFreqAmp = audiohz(3000);
      if (highFreqAmp > 0.7) {
          const impulsePoint = Math.floor(Math.random() * wave.points.length);
          const impulseWidth = Math.floor(wave.points.length * 0.1);
          
          for (let i = Math.max(0, impulsePoint - impulseWidth); 
               i < Math.min(wave.points.length, impulsePoint + impulseWidth); i++) {
              const distance = Math.abs(i - impulsePoint) / impulseWidth;
              const force = (1 - distance) * highFreqAmp * 15;
              wave.points[i].vy += (Math.random() - 0.5) * force;
          }
      }
  }
}

function drawWaves(time) {
  // Draw waves from back to front
  for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      
      // Calculate wave properties
      const baseHue = (time * 5) % 360;  // Slowly shifting base hue
      const waveHue = (baseHue + w * (360 / settings.waveCount)) % 360;
      const waveOpacity = 0.6 + (settings.waveCount - w) * 0.1;  // Back waves slightly more transparent
      
      // Draw reflection first if enabled
      if (settings.reflective) {
          const reflectionMaxHeight = height - wave.baseY;
          
          // Start path for reflection
          context.beginPath();
          context.moveTo(0, wave.points[0].y);
          
          // Draw reflected wave points
          for (let i = 0; i < wave.points.length; i++) {
              const point = wave.points[i];
              const reflectionY = wave.baseY + Math.min(reflectionMaxHeight, wave.baseY - point.y);
              context.lineTo(point.x, reflectionY);
          }
          
          // Complete reflection path
          context.lineTo(width, height);
          context.lineTo(0, height);
          context.closePath();
          
          // Fill reflection with gradient
          if (settings.colorMode === "gradient") {
              const gradient = context.createLinearGradient(0, wave.baseY, 0, height);
              gradient.addColorStop(0, \`hsla(\${waveHue}, 90%, 60%, \${settings.reflectionOpacity})\`);
              gradient.addColorStop(1, \`hsla(\${waveHue}, 80%, 20%, 0)\`);
              context.fillStyle = gradient;
          } else if (settings.colorMode === "rainbow") {
              const gradient = context.createLinearGradient(0, wave.baseY, width, wave.baseY);
              for (let i = 0; i <= 1; i += 0.2) {
                  gradient.addColorStop(i, \`hsla(\${(waveHue + i * 100) % 360}, 90%, 60%, \${settings.reflectionOpacity})\`);
              }
              context.fillStyle = gradient;
          } else {
              context.fillStyle = \`rgba(150, 200, 255, \${settings.reflectionOpacity * 0.5})\`;
          }
          
          context.fill();
      }
      
      // Start path for main wave
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, wave.points[0].y);
      
      // Draw smooth curve through wave points
      for (let i = 0; i < wave.points.length - 1; i++) {
          const point = wave.points[i];
          const nextPoint = wave.points[i + 1];
          
          // Calculate control points for smoother curves
          const controlX = (point.x + nextPoint.x) / 2;
          const controlY = (point.y + nextPoint.y) / 2;
          
          context.quadraticCurveTo(point.x, point.y, controlX, controlY);
      }
      
      // Connect last point
      context.lineTo(wave.points[wave.points.length - 1].x, wave.points[wave.points.length - 1].y);
      context.lineTo(width, height);
      context.closePath();
      
      // Fill wave with gradient
      if (settings.colorMode === "gradient") {
          const gradient = context.createLinearGradient(0, wave.baseY - settings.baseWaveHeight, 0, wave.baseY + settings.baseWaveHeight);
          gradient.addColorStop(0, \`hsla(\${waveHue}, 90%, 70%, \${waveOpacity})\`);
          gradient.addColorStop(1, \`hsla(\${waveHue}, 80%, 40%, \${waveOpacity * 0.7})\`);
          context.fillStyle = gradient;
      } else if (settings.colorMode === "rainbow") {
          const gradient = context.createLinearGradient(0, 0, width, 0);
          for (let i = 0; i <= 1; i += 0.2) {
              gradient.addColorStop(i, \`hsla(\${(waveHue + i * 100) % 360}, 90%, 60%, \${waveOpacity})\`);
          }
          context.fillStyle = gradient;
      } else {
          context.fillStyle = \`rgba(100, 180, 255, \${waveOpacity})\`;
      }
      
      context.fill();
      
      // Add highlight along the top edge of wave
      context.beginPath();
      context.moveTo(0, wave.points[0].y);
      
      for (let i = 0; i < wave.points.length - 1; i++) {
          const point = wave.points[i];
          const nextPoint = wave.points[i + 1];
          
          // Calculate control points for smoother curves
          const controlX = (point.x + nextPoint.x) / 2;
          const controlY = (point.y + nextPoint.y) / 2;
          
          context.quadraticCurveTo(point.x, point.y, controlX, controlY);
      }
      
      // Add glow to wave edge
      context.lineTo(wave.points[wave.points.length - 1].x, wave.points[wave.points.length - 1].y);
      context.strokeStyle = \`hsla(\${waveHue}, 90%, 80%, 0.8)\`;
      context.lineWidth = 2;
      context.stroke();
      
      // Add glow effect
      glowStart(\`hsla(\${waveHue}, 90%, 70%, 0.5)\`, 10);
      context.stroke();
      glowEnd();
  }
}

function drawAtmosphere(time) {
  // Add subtle particle atmosphere
  const particleCount = 50;
  const bassAmplitude = audiohz(60);
  
  fill("rgba(255, 255, 255, 0.3)");
  
  for (let i = 0; i < particleCount; i++) {
      const seed = i * 100;  // Unique seed for each particle
      
      // Use coherent movement with sine/cosine
      const x = width * (0.5 + 0.4 * Math.cos(time * 0.1 + seed));
      const y = height * (0.3 + 0.2 * Math.sin(time * 0.07 + seed * 2));
      
      // Particle size based on audio
      const freq = 500 + (i % 10) * 200;
      const energy = audiohz(freq);
      const size = 2 + energy * 5 + bassAmplitude * 3;
      
      // Add glow to particles
      glowStart("rgba(200, 220, 255, 0.6)", size * 2);
      circle(x, y, size);
      glowEnd();
  }
}

function drawUI(time) {
  // Draw subtle UI elements
  
  // Add title and info text
  fill("rgba(255, 255, 255, 0.7)");
  text("LIQUID MUSIC WAVES", width - 20, 30, 18, "Arial", "right");
  
  // Get overall energy levels
  const lowEnergy = audiohz(60);
  const midEnergy = audiohz(500);
  const highEnergy = audiohz(2000);
  
  // Display mini VU meter in corner
  const meterWidth = 100;
  const meterHeight = 4;
  const meterSpacing = 8;
  const meterX = 20;
  const meterY = 30;
  
  // Draw meter labels
  fill("rgba(255, 255, 255, 0.5)");
  text("LOW", meterX - 5, meterY, 10, "Arial", "right");
  text("MID", meterX - 5, meterY + meterSpacing, 10, "Arial", "right");
  text("HIGH", meterX - 5, meterY + meterSpacing * 2, 10, "Arial", "right");
  
  // Draw VU meters
  stroke("rgba(255, 255, 255, 0.3)");
  lineWidth(1);
  rect(meterX, meterY - meterHeight/2, meterWidth, meterHeight, true);
  rect(meterX, meterY + meterSpacing - meterHeight/2, meterWidth, meterHeight, true);
  rect(meterX, meterY + meterSpacing * 2 - meterHeight/2, meterWidth, meterHeight, true);
  
  // Fill meters based on audio levels
  fill("rgba(100, 200, 255, 0.8)");
  rect(meterX, meterY - meterHeight/2, meterWidth * lowEnergy, meterHeight);
  
  fill("rgba(100, 255, 200, 0.8)");
  rect(meterX, meterY + meterSpacing - meterHeight/2, meterWidth * midEnergy, meterHeight);
  
  fill("rgba(255, 200, 100, 0.8)");
  rect(meterX, meterY + meterSpacing * 2 - meterHeight/2, meterWidth * highEnergy, meterHeight);
}

// Reset waves if window is resized
window.addEventListener('resize', resetWaves);`
},
{
  name: "Basic 3D Cube",
  group: "3D",
  description: "A simple rotating 3D cube with depth and shading",
  code: `/**
* Basic 3D Cube
* A simple rotating 3D cube with depth and shading
*/

function setup() {
  loadAudio("Music/ambient_electronic.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(10, 15, 30);
  
  // Clear any previous 3D elements
  clear3D();
  
  // Get some audio data for reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  
  // Move camera in a circular orbit around the scene
  const cameraAngle = time * 0.0005;
  const cameraDistance = 500 + bass * 200;
  
  // Position camera using orbitCamera for easier positioning
  orbitCamera(time * 0.1, Math.sin(time * 0.0002) * 30, cameraDistance);
  
  // Draw reference grid and axes
  grid3D(200, 10);
  axes3D(150);
  
  // Create a cube at the origin
  // Make it pulse with the music
  const cubeSize = 100 + bass * 50;
  cube3D(0, 0, 0, cubeSize, "#FF5500", true);
  
  // Display some info
  fill(255, 255, 255);
  text("Basic 3D Cube Example", 20, 30, 20);
  text("Bass amplitude: " + Math.round(bass * 100) + "%", 20, 60, 14);
  
  // Draw all the 3D elements
  draw3D();
}`
},
{
  name: "3D Audio Sphere",
  group: "3D",
  description: "A 3D sphere visualization that responds to audio",
  code: `/**
* 3D Audio Sphere
* A 3D sphere visualization that responds to audio
*/

function setup() {
  loadAudio("Music/electronic_beat.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(5, 10, 20);
  
  // Clear previous 3D elements
  clear3D();
  
  // Get audio data
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(2000);
  
  // Position camera
  const cameraDistance = 400 + bass * 100;
  orbitCamera(time * 0.1, 30 + Math.sin(time * 0.0005) * 20, cameraDistance);
  
  // Draw reference grid
  grid3D(200, 10);
  
  // Create a sphere at the center
  // Size reacts to bass frequencies
  const sphereSize = 50 + bass * 100;
  const sphereDetail = 15 + Math.floor(mids * 10);
  sphere3D(0, 0, 0, sphereSize, sphereDetail, "#FF9900");
  
  // Add some orbiting points
  for (let i = 0; i < 100; i++) {
    const angle = i * Math.PI * 2 / 100;
    const orbitRadius = 150 + Math.sin(time * 0.001 + i * 0.1) * 50;
    
    const x = Math.cos(angle + time * 0.001) * orbitRadius;
    const y = Math.sin(angle + time * 0.001) * orbitRadius;
    const z = Math.cos(angle * 3 + time * 0.002) * (50 + highs * 50);
    
    // Size and color change with audio
    const pointSize = 2 + mids * 5;
    const hue = (i / 100 * 360) % 360;
    
    // Create 3D point
    point3D(x, y, z, pointSize, \`hsl(\${hue}, 100%, 60%)\`);
    
    // Connect some points with lines
    if (i > 0 && i % 5 === 0) {
      const prevAngle = (i - 1) * Math.PI * 2 / 100;
      const prevX = Math.cos(prevAngle + time * 0.001) * orbitRadius;
      const prevY = Math.sin(prevAngle + time * 0.001) * orbitRadius;
      const prevZ = Math.cos(prevAngle * 3 + time * 0.002) * (50 + highs * 50);
      
      line3D({x, y, z}, {x: prevX, y: prevY, z: prevZ}, \`hsl(\${hue}, 80%, 50%)\`, 1);
    }
  }
  
  // Draw the 3D visualization
  draw3D();
  
  // Add some text
  fill(255, 255, 255);
  text("3D Audio Sphere", 20, 30, 20);
  text("Bass: " + Math.round(bass * 100) + "%", 20, 60, 14);
  text("Detail: " + sphereDetail, 20, 80, 14);
}`
},
{
  name: "3D Space Visualization",
  group: "3D",
  description: "A cosmic space scene with planets and audio-reactive stars",
  code: `/**
* 3D Space Visualization
* A cosmic space scene with planets and audio-reactive stars
*/

function setup() {
  loadAudio("Music/space_ambient.mp3");
  playAudio();
}

function draw(time) {
  // Space background
  background(0, 2, 10);
  
  // Clear previous 3D elements
  clear3D();
  
  // Audio reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(2000);
  
  // Rotate camera around the scene
  orbitCamera(time * 2.05, Math.sin(time * 0.0002) * 20, 700);
  
  // Create a central planet
  sphere3D(0, 0, 0, 80 + bass * 30, 20, "#3366FF");
  
  // Draw planet rings
  const ringCount = 40;
  const ringRadius = 150;
  const ringWidth = 5 + mids * 10;
  
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const x1 = Math.cos(angle) * (ringRadius - ringWidth/2);
    const y1 = Math.sin(angle) * (ringRadius - ringWidth/2);
    const z1 = Math.sin(angle + time * 0.001) * 5;
    
    const x2 = Math.cos(angle) * (ringRadius + ringWidth/2);
    const y2 = Math.sin(angle) * (ringRadius + ringWidth/2);
    const z2 = Math.sin(angle + time * 0.001) * 5;
    
    const hue = (i / ringCount * 180 + time * 0.1) % 360;
    line3D({x: x1, y: y1, z: z1}, {x: x2, y: y2, z: z2}, 
          \`hsla(\${hue}, 100%, 70%, 0.6)\`, 2 + mids * 3);
  }
  
  // Add some smaller orbiting planets
  const orbitCount = 3;
  for (let i = 0; i < orbitCount; i++) {
    const orbitSpeed = 0.0002 * (i + 1);
    const orbitRadius = 250 + i * 100;
    const planetSize = 20 + i * 10 + audiohz(100 + i * 200) * 30;
    
    const angle = time * orbitSpeed;
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;
    const z = Math.sin(time * 0.0001 + i) * 30;
    
    // Planet color based on position
    const hue = (i * 120 + time * 0.05) % 360;
    sphere3D(x, y, z, planetSize, 10, \`hsl(\${hue}, 80%, 60%)\`);
  }
  
  // Add stars in 3D space
  for (let i = 0; i < 200; i++) {
    const angle1 = i * 0.1;
    const angle2 = i * 0.7;
    const radius = 800 + Math.sin(i) * 200;
    
    const x = Math.sin(angle1) * Math.cos(angle2) * radius;
    const y = Math.sin(angle1) * Math.sin(angle2) * radius;
    const z = Math.cos(angle1) * radius;
    
    // Star size reacts to high frequencies
    const starSize = 1 + highs * 3;
    
    // Random brightness
    const brightness = 40 + Math.sin(time * 0.001 + i) * 30 + highs * 30;
    
    point3D(x, y, z, starSize, \`rgba(255, 255, \${brightness + 155}, \${0.5 + highs * 0.5})\`);
  }
  
  // Draw everything
  draw3D();
  
  // Add UI text
  fill(255, 255, 255);
  text("3D Space Visualization", 20, 30, 20);
}`
},
{
  name: "3D Audio Frequency Bars",
  group: "3D",
  description: "A 3D visualization of audio frequency spectrum using bars",
  code: `/**
* 3D Audio Frequency Bars
* A 3D visualization of audio frequency spectrum using bars
*/

function setup() {
  loadAudio("Music/electronic_beat.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(10, 15, 25);
  
  // Clear 3D elements
  clear3D();
  
  // Get average audio levels for overall reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  
  // Camera orbits around the bars
  const cameraHeight = 100 + Math.sin(time * 0.0001) * 50;
  orbitCamera(time * 5.1, 30, 500 - bass * 100);
  
  // Draw a reference grid
  grid3D(400, 10);
  
  // Create frequency bars
  const barCount = 32;
  const barWidth = 10;
  const spacing = 5;
  const totalWidth = barCount * (barWidth + spacing);
  const startX = -totalWidth / 2;
  
  for (let i = 0; i < barCount; i++) {
    // Calculate frequency for this bar
    const freq = 50 + (i / barCount) * 5000;
    const amplitude = audiohz(freq);
    
    // Calculate bar height based on amplitude
    const barHeight = 5 + amplitude * 250;
    
    // Calculate position
    const x = startX + i * (barWidth + spacing);
    
    // Calculate color based on frequency
    const hue = (i / barCount) * 360;
    const color = \`hsl(\${hue}, 100%, 50%)\`;
    
    // Draw the bar as a box
    const y = barHeight / 2; // Center of the bar
    const z = 0;
    
    // Create the 3D cube
    cube3D(x, y, z, barWidth, color, false);
    
    // Add connecting lines between bars for visual effect
    if (i > 0) {
      const prevX = startX + (i-1) * (barWidth + spacing);
      const prevHeight = 5 + audiohz(50 + ((i-1) / barCount) * 5000) * 250;
      
      line3D(
        {x: x, y: barHeight, z: 0},
        {x: prevX, y: prevHeight, z: 0},
        \`hsla(\${hue}, 100%, 70%, 0.5)\`,
        1
      );
    }
  }
  
  // Draw everything
  draw3D();
  
  // Draw UI text
  fill(255, 255, 255);
  text("3D Audio Frequency Bars", 20, 30, 20);
  text("Bass: " + Math.round(bass * 100) + "%", 20, 60, 14);
}`
},
{
  name: "3D Audio Circular Visualizer",
  group: "3D",
  description: "A circular 3D audio visualizer with reactive elements",
  code: `/**
* 3D Audio Circular Visualizer
* A circular 3D audio visualizer with reactive elements
*/

function setup() {
  loadAudio("Music/electronic_ambient.mp3");
  playAudio();
}

function draw(time) {
  // Dark background
  background(5, 8, 15);
  
  // Clear 3D elements
  clear3D();
  
  // Audio reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(2000);
  
  // Camera orbit with audio reaction
  const cameraHeight = 200 + Math.sin(time * 0.0004) * 100;
  const orbitSpeed = 0.05 + bass * 0.05;
  orbitCamera(time * orbitSpeed, 30 + mids * 20, 600);
  
  // Draw a center sphere that pulses with bass
  sphere3D(0, 0, 0, 30 + bass * 50, 12, \`rgba(255, \${50 + bass * 200}, 50, 0.9)\`);
  
  // Draw circular audio pattern
  const points = 64;
  const rings = 3;
  
  for (let ring = 0; ring < rings; ring++) {
    const ringRadius = 100 + ring * 70;
    const heightOffset = ring * 20 * Math.sin(time * 0.001);
    
    // Draw the complete ring
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const nextAngle = ((i + 1) / points) * Math.PI * 2;
      
      // Calculate frequency for this point
      const freqStart = 50;
      const freqRange = 5000;
      const freq = freqStart + (i / points + ring / rings) * freqRange;
      const amplitude = audiohz(freq % freqRange);
      
      // Calculate position with audio-reactive height
      const radius = ringRadius + amplitude * 50;
      const height = heightOffset + amplitude * 120;
      
      const x1 = Math.cos(angle) * radius;
      const y1 = height;
      const z1 = Math.sin(angle) * radius;
      
      const x2 = Math.cos(nextAngle) * radius;
      const y2 = height;
      const z2 = Math.sin(nextAngle) * radius;
      
      // Color based on frequency and amplitude
      const hue = (i / points * 360 + time * 0.05) % 360;
      const brightness = 50 + amplitude * 50;
      const color = \`hsl(\${hue}, 100%, \${brightness}%)\`;
      
      // Draw line connecting points
      line3D(
        {x: x1, y: y1, z: z1},
        {x: x2, y: y2, z: z2},
        color,
        1 + amplitude * 4
      );
      
      // Draw vertical lines every few points
      if (i % 4 === 0) {
        line3D(
          {x: x1, y: 0, z: z1},
          {x: x1, y: y1, z: z1},
          \`hsla(\${hue}, 100%, \${brightness}%, 0.4)\`,
          1
        );
        
        // Draw point at top
        point3D(x1, y1, z1, 2 + amplitude * 8, color);
      }
    }
  }
  
  // Draw reference grid
  grid3D(400, 10, "#222222", "#111111");
  
  // Draw everything
  draw3D();
  
  // Add UI text
  fill(255, 255, 255);
  text("3D Audio Circular Visualizer", 20, 30, 20);
}`
},
{
  name: "3D Audio World",
  group: "3D",
  description: "An immersive 3D environment with orbiting planets and frequency visualization",
  code: `/**
* 3D Audio World
* An immersive 3D environment that reacts to music
*/

// User settings
const settings = {
  // Audio
  audioFile: "Music/space_ambient.mp3",
  
  // Visual settings
  rotationSpeed: 0.05,
  visualizerDetail: 32,
  
  // Colors
  gridColor: "#333333",
  planetColor: "#FF6600",
  orbitColor: "#00AAFF"
};

function setup() {
  loadAudio(settings.audioFile);
  playAudio();
}

function draw(time) {
  // Space-like background
  background(5, 5, 15);
  
  // Clear previous 3D elements
  clear3D();
  
  // Get audio levels for reactivity
  const bass = audiohz(60);
  const mids = audiohz(500);
  const highs = audiohz(2000);
  
  // Camera movement that follows the beat
  const cameraDistance = 500 + bass * 200;
  const cameraHeight = 100 + Math.sin(time * 0.0002) * 50;
  orbitCamera(time * settings.rotationSpeed, 20 + mids * 10, cameraDistance);
  
  // Draw reference grid
  grid3D(400, 10, settings.gridColor, "#222222");
  
  // Draw a central sphere that pulses with bass
  sphere3D(0, 0, 0, 50 + bass * 40, 15, settings.planetColor);
  
  // Create orbiting planets
  const planetCount = 5;
  for (let i = 0; i < planetCount; i++) {
    // Calculate orbit radius and position
    const angle = (i / planetCount) * Math.PI * 2 + time * 0.0003 * (i + 1);
    const orbitRadius = 120 + i * 30;
    const orbitHeight = Math.sin(time * 0.0002 + i) * 30;
    
    // Calculate planet position
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;
    const z = orbitHeight;
    
    // Get frequency for this planet
    const freq = 100 + i * 200;
    const freqEnergy = audiohz(freq);
    
    // Planet color based on frequency energy
    const hue = (i * 40 + time * 0.01) % 360;
    const planetColor = \`hsl(\${hue}, 80%, 50%)\`;
    
    // Draw the planet (sized by frequency energy)
    sphere3D(x, y, z, 15 + freqEnergy * 30, 10, planetColor);
    
    // Draw orbit path
    const orbitSegments = 36;
    for (let j = 0; j < orbitSegments; j++) {
      const a1 = (j / orbitSegments) * Math.PI * 2;
      const a2 = ((j + 1) / orbitSegments) * Math.PI * 2;
      
      const x1 = Math.cos(a1) * orbitRadius;
      const y1 = Math.sin(a1) * orbitRadius;
      const z1 = Math.sin(a1 + time * 0.0002 + i) * 30;
      
      const x2 = Math.cos(a2) * orbitRadius;
      const y2 = Math.sin(a2) * orbitRadius;
      const z2 = Math.sin(a2 + time * 0.0002 + i) * 30;
      
      line3D({x: x1, y: y1, z: z1}, {x: x2, y: y2, z: z2}, 
            \`hsla(\${hue}, 70%, 50%, 0.3)\`, 1);
    }
  }
  
  // Create frequency bars in a circle
  const barCount = settings.visualizerDetail;
  const barRadius = 200;
  
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const freq = 50 + (i / barCount) * 5000;
    const amplitude = audiohz(freq);
    
    const barHeight = 5 + amplitude * 150;
    const barWidth = 4;
    
    // Calculate bar position
    const x = Math.cos(angle) * barRadius;
    const z = Math.sin(angle) * barRadius;
    const y = barHeight / 2; // Center of bar
    
    // Bar color based on frequency
    const hue = (i / barCount) * 360;
    const barColor = \`hsl(\${hue}, 100%, 60%)\`;
    
    // Draw the bar
    cube3D(x, y, z, barWidth, barHeight, barWidth, barColor, false);
  }
  
  // Add some stars in background
  for (let i = 0; i < 100; i++) {
    const angle1 = i * 0.1;
    const angle2 = i * 0.7;
    const starRadius = 800;
    
    const x = Math.sin(angle1) * Math.cos(angle2) * starRadius;
    const y = Math.sin(angle1) * Math.sin(angle2) * starRadius;
    const z = Math.cos(angle1) * starRadius;
    
    // Star twinkle with high frequencies
    const starSize = 1 + highs * 3;
    const brightness = Math.random() * 100 + 155;
    
    point3D(x, y, z, starSize, \`rgba(\${brightness}, \${brightness}, \${brightness}, 0.8)\`);
  }
  
  // Render all 3D elements
  draw3D();
  
  // Add 2D overlay elements
  fill(255, 255, 255, 0.8);
  text("3D AUDIO WORLD", width()/2, 40, 24, "Arial", "center");
  text("Bass: " + Math.round(bass * 100) + "%", 20, 40, 14);
  text("FPS: " + Math.round(getFps()), width() - 80, 40, 14);
  
  // Add equalizer at bottom of screen
  fill(settings.orbitColor);
  glowStart(settings.orbitColor, 5);
  visualBar(0, height(), width(), 60, 32, 2, 3, 0, true, false);
  glowEnd();
}`
}
];

function organizeExamples() {
  // Group all examples by their group property
  const groupedExamples = {};
  
  examples.forEach(example => {
      const group = example.group || "Unsorted";
      if (!groupedExamples[group]) {
          groupedExamples[group] = [];
      }
      groupedExamples[group].push(example);
  });
  
  // Sort each group alphabetically by name
  Object.keys(groupedExamples).forEach(group => {
      groupedExamples[group].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  // Define the order of groups for display
  const groupOrder = ["Basic", "Minimal", "Semi-Advanced", "Advanced", "PixiJS", "3D", "Unsorted"];
  
  // Get the container
  const examplesList = document.querySelector('.examples-list');
  if (!examplesList) return;
  
  // Clear existing content
  examplesList.innerHTML = '';
  
  // Add each group
  groupOrder.forEach(group => {
      if (!groupedExamples[group]) return;
      
      // Create group header
      const groupHeader = document.createElement('h3');
      groupHeader.className = 'example-group-header';
      groupHeader.textContent = group;
      examplesList.appendChild(groupHeader);
      
      // Add examples for this group
      groupedExamples[group].forEach(example => {
          if (example.name === "EMPTY EXAMPLE") return; // Skip empty examples
          
          const exampleItem = document.createElement('div');
          exampleItem.className = 'example-item';
          
          const button = document.createElement('button');
          button.className = 'example-button';
          button.innerHTML = `<strong>${example.name}</strong><br><span class="example-group">${example.description}</span>`;
          button.title = example.description;
          
          // Add click event to load the example
          button.onclick = () => {
            if (window.editor) {
                window.editor.setValue(example.code);
                logToConsole(`Loaded example: ${example.name}`);
            }
          };
          
          exampleItem.appendChild(button);
          examplesList.appendChild(exampleItem);
      });
  });
}