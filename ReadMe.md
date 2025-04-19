# KaleidoScript 🎨

KaleidoScript is an interactive web-based application for creating code-based animated visualizations and music-reactive graphics. It features a dedicated code editor with syntax highlighting, real-time preview, and tools for audio integration.

![KaleidoScript Screenshot](screenshots/kaleidoscript-screenshot.png)

## Features

- **Code-Based Animation Engine**: Create dynamic visualizations using JavaScript
- **Real-Time Preview**: See your animations instantly as you code
- **Audio Visualization**: Create music-reactive graphics that respond to audio frequencies
- **Export Options**: Save your creations as PNG, GIF, or HTML5
- **File Management**: Save and organize your scripts
- **Responsive Canvas**: Adjust canvas size with preset aspect ratios
- **Recording Capability**: Record your animations with audio as video files

## Getting Started

1. Clone this repository or download the files
2. Open `index.html` in a modern web browser
3. Start coding in the editor panel on the left
4. Use the play/pause/stop controls to view your animation

## Basic Example

Here's a simple example to get you started:

```javascript
// This function runs every frame
function draw(time) {
    // Clear the canvas with a dark background
    background(20, 20, 40);
    
    // Draw a pulsing circle at the center
    fill(255, 100, 100);
    const size = 100 + Math.sin(time) * 50;
    circle(width()/2, height()/2, size);
    
    // Draw some rotating rectangles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + time;
        const distance = 200;
        const x = width()/2 + Math.cos(angle) * distance;
        const y = height()/2 + Math.sin(angle) * distance;
        
        fill(i * 20, 100, 255);
        
        // Save context, rotate, draw, restore
        const ctx = context();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        rect(-20, -20, 40, 40);
        ctx.restore();
    }
}