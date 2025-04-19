# KaleidoScript 🎨

KaleidoScript is an interactive web-based application for creating code-based animated visualizations and music-reactive graphics. It features a dedicated code editor with syntax highlighting, real-time preview, and tools for audio integration.

# NOTE!!!!!!

 - When clicking play, you may need to click it twice to get it to work when changing the audio from the previous play. It is a bug I am working out. 
 - There are also some features with the UI that arent fully functional. This app is still WIP.
 - Also, the recording works all good, but I find for the best results, use OBS screen recording software or any other screen recording software to record the visualizer, then use a free video editor like Clipchamp to crop the video and then you have your visualized song!

## Features

- **Code-Based Animation Engine**: Create dynamic visualizations using JavaScript
- **Real-Time Preview**: See your animations instantly as you code
- **Audio Visualization**: Create music-reactive graphics that respond to audio frequencies
- **Export Options**: Save your creations as PNG, GIF
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
// Import an audio file first via the "Imports" tab
loadAudio("music.mp3");

function draw(time) {
    // Play audio when animation starts
    if (time < 0.1) audioPlay();
    
    // Dark background
    background(10, 10, 30);
    
    // Draw circular audio visualizer at center
    visualCircular(
        width/2,    // x
        height/2,   // y
        100,          // minimum radius
        200,          // maximum radius
        64,           // number of points
        20,           // low frequency
        2000,         // high frequency
        time * 0.5,   // rotation speed
        true          // enable glow effect
    );
}