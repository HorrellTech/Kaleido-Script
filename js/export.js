// Export the canvas to PNG
function exportToPNG(renderer) {
    // Prompt for filename
    const filename = prompt('Enter filename for PNG export:', 'kaleido-script-export.png');
    if (!filename) return; // User cancelled
    
    const canvas = renderer.canvas;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    window.logToConsole(`Image exported as ${filename}`, 'info');
}

// Export the canvas animation to GIF with configuration options
function exportToGIF(renderer) {
    // Show the GIF configuration modal
    showGIFConfigModal(renderer);
}

// Function to show GIF configuration modal
function showGIFConfigModal(renderer) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('gif-config-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'gif-config-modal';
        modalContainer.className = 'export-modal';
        
        modalContainer.innerHTML = `
            <div class="export-modal-content">
                <div class="modal-header">
                    <h2>GIF Export Settings</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="gif-filename">Filename:</label>
                        <input type="text" id="gif-filename" value="kaleido-script-animation.gif">
                    </div>
                    <div class="form-group">
                        <label for="gif-duration">Duration (seconds):</label>
                        <input type="number" id="gif-duration" min="1" max="30" value="5">
                    </div>
                    <div class="form-group">
                        <label for="gif-fps">Frame Rate (FPS):</label>
                        <input type="number" id="gif-fps" min="5" max="60" value="30">
                    </div>
                    <div class="form-group">
                        <label for="gif-quality">Quality (lower = better quality but larger file):</label>
                        <input type="range" id="gif-quality" min="1" max="20" value="10" class="slider">
                        <div class="range-labels">
                            <span>High Quality</span>
                            <span>Small Size</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="gif-width">Width:</label>
                        <input type="number" id="gif-width" value="${renderer.canvas.width}">
                    </div>
                    <div class="form-group">
                        <label for="gif-height">Height:</label>
                        <input type="number" id="gif-height" value="${renderer.canvas.height}">
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="gif-maintain-aspect" checked>
                        <label for="gif-maintain-aspect">Maintain aspect ratio</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-gif-export" class="btn-secondary">Cancel</button>
                    <button id="start-gif-export" class="btn-primary">Export GIF</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        
        // Initialize duration from the main input
        const durationInput = document.getElementById('duration-input');
        const gifDuration = document.getElementById('gif-duration');
        if (durationInput && gifDuration) {
            const duration = parseInt(durationInput.value) || 5;
            if (duration > 0) {
                gifDuration.value = duration;
            }
        }
        
        // Initialize FPS from the main input
        const fpsInput = document.getElementById('fps-input');
        const gifFps = document.getElementById('gif-fps');
        if (fpsInput && gifFps) {
            gifFps.value = parseInt(fpsInput.value) || 30;
        }
        
        // Set up event handlers
        document.querySelector('.modal-close-btn').addEventListener('click', hideGIFConfigModal);
        document.getElementById('cancel-gif-export').addEventListener('click', hideGIFConfigModal);
        document.getElementById('start-gif-export').addEventListener('click', () => {
            hideGIFConfigModal();
            startGIFExport(renderer);
        });
        
        // Maintain aspect ratio when width changes
        const widthInput = document.getElementById('gif-width');
        const heightInput = document.getElementById('gif-height');
        const maintainAspect = document.getElementById('gif-maintain-aspect');
        
        let aspectRatio = renderer.canvas.width / renderer.canvas.height;
        
        widthInput.addEventListener('change', () => {
            if (maintainAspect.checked) {
                heightInput.value = Math.round(widthInput.value / aspectRatio);
            }
        });
        
        heightInput.addEventListener('change', () => {
            if (maintainAspect.checked) {
                widthInput.value = Math.round(heightInput.value * aspectRatio);
            }
        });
    }
    
    // Display the modal
    modalContainer.style.display = 'flex';
}

function hideGIFConfigModal() {
    const modalContainer = document.getElementById('gif-config-modal');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
}

function startGIFExport(renderer) {
    // Validate renderer
    if (!renderer || !renderer.canvas) {
        window.logToConsole('Error: Invalid renderer - export cancelled', 'error');
        alert('The animation renderer is not properly initialized. Please refresh the page and try again.');
        return;
    }

    // Get configuration
    const canvas = renderer.canvas;
    const filename = document.getElementById('gif-filename').value || 'kaleido-script-animation.gif';
    const duration = parseInt(document.getElementById('gif-duration').value) || 5;
    const fps = parseInt(document.getElementById('gif-fps').value) || 30;
    const quality = parseInt(document.getElementById('gif-quality').value) || 10;
    const width = parseInt(document.getElementById('gif-width').value) || canvas.width;
    const height = parseInt(document.getElementById('gif-height').value) || canvas.height;
    
    // Validate duration
    if (duration <= 0) {
        alert('Please set a valid duration for the GIF export');
        return;
    }
    
    // Check if GIF.js is loaded
    if (typeof GIF === 'undefined') {
        alert('GIF.js library not loaded. Please check your internet connection or refresh the page.');
        return;
    }
    
    // Store animation state
    const wasRunning = renderer.isRunning;
    renderer.pause();
    
    // Show export progress
    showExportProgress('Preparing for GIF export...', true);
    
    // Set up cancel functionality
    const cancelBtn = document.getElementById('cancel-export');
    let isCancelled = false;
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            isCancelled = true;
            hideExportProgress();
            window.logToConsole('GIF export cancelled', 'warning');
            if (wasRunning) {
                renderer.start();
            }
        };
    }
    
    // Create a Blob URL for the worker script to avoid CORS issues
    const createWorkerBlob = () => {
        // Check if we can load from CDN
        return fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load GIF worker from CDN');
                return response.text();
            })
            .then(workerCode => {
                // Create a blob URL from the worker code
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                return URL.createObjectURL(blob);
            })
            .catch(error => {
                console.error('Failed to create worker blob:', error);
                // Try to use the local worker if available
                return 'js/lib/gif.worker.js';
            });
    };
    
    // Ensure the renderer is ready for frame capture
    function prepareRenderer() {
        try {
            if (!renderer || !renderer.canvas) {
                throw new Error('Invalid renderer or missing canvas property');
            }
            
            // Make sure we have all the necessary methods
            if (!renderer.renderFrame) {
                // Create a fallback renderFrame method if one is not available
                renderer.renderFrame = function(time) {
                    if (this.draw) {
                        return this.draw(time);
                    } else if (this.render) {
                        return this.render(time);
                    } else {
                        throw new Error('No rendering method available');
                    }
                };
            }
            
            // Make sure we have a clear method
            if (!renderer.clear) {
                renderer.clear = function() {
                    if (!this.ctx && this.canvas) {
                        this.ctx = this.canvas.getContext('2d');
                    }
                    
                    if (this.ctx) {
                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    } else {
                        console.warn('Cannot clear canvas: ctx is not available');
                    }
                };
            }
            
            // Check if renderer's context is available
            if (!renderer.ctx && renderer.canvas) {
                renderer.ctx = renderer.canvas.getContext('2d');
            }
            
            return renderer.ctx ? true : false;
        } catch (error) {
            console.error('Error preparing renderer:', error);
            window.logToConsole(`Error preparing renderer: ${error.message}`, 'error');
            return false;
        }
    }
    
    // Create worker blob URL then start processing
    createWorkerBlob().then(workerUrl => {
        if (isCancelled) return;
        
        // Prepare renderer for capture
        if (!prepareRenderer()) {
            window.logToConsole('Error: Cannot prepare renderer for frame capture', 'error');
            hideExportProgress();
            if (wasRunning) renderer.start();
            return;
        }
        
        // Create temp canvas for resizing if needed
        let tempCanvas = null;
        let tempContext = null;
        
        if (width !== canvas.width || height !== canvas.height) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempContext = tempCanvas.getContext('2d');
        }
        
        // Calculate frames
        const totalFrames = Math.ceil(fps * duration);
        const frameInterval = 1 / fps;
        
        window.logToConsole(`Capturing ${totalFrames} frames for GIF...`, 'info');
        updateExportProgress(0);
        
        try {
            // Initialize GIF encoder with proper settings
            const gif = new GIF({
                workers: 2,
                quality: quality,
                width: width,
                height: height,
                workerScript: workerUrl,
                dither: false
            });
            
            // Set up progress handling
            gif.on('progress', p => {
                // Scale progress to 50-100% range
                const overallProgress = 50 + Math.floor(p * 50);
                updateExportProgress(overallProgress);
                window.logToConsole(`Encoding GIF: ${Math.floor(p * 100)}%`, 'info');
            });
            
            gif.on('finished', blob => {
                if (isCancelled) return;
                
                // Clean up
                URL.revokeObjectURL(workerUrl);
                
                // Download the GIF
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                // Clean up
                hideExportProgress();
                if (wasRunning) {
                    renderer.start();
                }
                
                window.logToConsole(`GIF exported successfully as ${filename}`, 'info');
            });
            
            // Handle GIF.js errors
            gif.on('abort', error => {
                hideExportProgress();
                window.logToConsole(`GIF export failed: ${error || 'unknown error'}`, 'error');
                if (wasRunning) {
                    renderer.start();
                }
            });
            
            // Use async/await to capture frames sequentially
            const captureFrames = async () => {
                try {
                    for (let i = 0; i < totalFrames; i++) {
                        if (isCancelled) return;
                        
                        // Render the frame at this specific time
                        const time = i * frameInterval;
                        try {
                            // Make sure renderer has necessary methods before each frame
                            if (!renderer.clear) {
                                console.warn('Renderer missing clear method, adding it');
                                renderer.clear = function() {
                                    if (this.ctx) {
                                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                                    } else if (this.canvas) {
                                        const ctx = this.canvas.getContext('2d');
                                        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                                    }
                                };
                            }
                            
                            // Safely render frame
                            renderer.renderFrame(time);
                            
                            // Add frame to GIF
                            if (tempCanvas) {
                                // Resize to target dimensions
                                tempContext.clearRect(0, 0, width, height);
                                tempContext.drawImage(canvas, 0, 0, width, height);
                                gif.addFrame(tempCanvas, {delay: 1000 / fps, copy: true});
                            } else {
                                gif.addFrame(canvas, {delay: 1000 / fps, copy: true});
                            }
                            
                            // Update progress (0-50% range for frame capture)
                            const progress = Math.floor((i / totalFrames) * 50);
                            updateExportProgress(progress);
                            
                            // Log progress occasionally
                            if (i % 10 === 0 || i === totalFrames - 1) {
                                window.logToConsole(`Capturing frame ${i+1}/${totalFrames}`, 'info');
                            }
                            
                            // Let the browser breathe
                            if (i % 5 === 0) {
                                await new Promise(resolve => setTimeout(resolve, 0));
                            }
                        } catch (frameError) {
                            console.error('Error rendering frame:', frameError);
                            window.logToConsole(`Warning: Error on frame ${i+1}: ${frameError.message}`, 'warning');
                            // Continue with next frame instead of failing the whole export
                        }
                    }
                    
                    window.logToConsole('Frame capture complete, rendering GIF...', 'info');
                    updateExportProgress(50);
                    
                    // Start rendering the GIF
                    gif.render();
                } catch (error) {
                    console.error('Error capturing frames:', error);
                    window.logToConsole(`GIF export error: ${error.message}`, 'error');
                    hideExportProgress();
                    if (wasRunning) {
                        renderer.start();
                    }
                }
            };
            
            // Start capturing frames
            captureFrames();
            
        } catch (error) {
            console.error('Error initializing GIF encoder:', error);
            window.logToConsole(`GIF export failed: ${error.message}`, 'error');
            hideExportProgress();
            if (wasRunning) {
                renderer.start();
            }
        }
    });
}

// Export the canvas animation to MP4
function exportToMP4(renderer) {
    showMP4ConfigModal(renderer);
}

// Create a modal for MP4 export settings
function showMP4ConfigModalOLD(renderer) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('mp4-config-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'mp4-config-modal';
        modalContainer.className = 'export-modal';
        
        modalContainer.innerHTML = `
            // ...existing modal HTML...
            <div class="form-group checkbox-group">
                <input type="checkbox" id="mp4-maintain-aspect" checked>
                <label for="mp4-maintain-aspect">Maintain aspect ratio</label>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="mp4-sync-audio" checked>
                <label for="mp4-sync-audio">Sync duration with audio (if available)</label>
            </div>
            // ...rest of existing modal HTML...
        `;

        // Then add an event handler after the other handlers:
        const syncAudioCheckbox = document.getElementById('mp4-sync-audio');
        if (syncAudioCheckbox) {
            syncAudioCheckbox.addEventListener('change', () => {
                if (syncAudioCheckbox.checked && window.audioProcessor) {
                    const audioDuration = window.audioProcessor.getDuration();
                    if (audioDuration > 0) {
                        document.getElementById('mp4-duration').value = Math.ceil(audioDuration);
                        window.logToConsole(`Video duration set to match audio: ${Math.ceil(audioDuration)}s`, 'info');
                    }
                }
            });
            
            // Try to set duration from audio immediately if checked
            if (syncAudioCheckbox.checked && window.audioProcessor) {
                const audioDuration = window.audioProcessor.getDuration();
                if (audioDuration > 0) {
                    document.getElementById('mp4-duration').value = Math.ceil(audioDuration);
                }
            }
        }
        
        document.body.appendChild(modalContainer);
        
        // Initialize duration from the main input
        const durationInput = document.getElementById('duration-input');
        const mp4Duration = document.getElementById('mp4-duration');
        if (durationInput && mp4Duration) {
            const duration = parseInt(durationInput.value) || 5;
            if (duration > 0) {
                mp4Duration.value = duration;
            }
        }
        
        // Initialize FPS from the main input
        const fpsInput = document.getElementById('fps-input');
        const mp4Fps = document.getElementById('mp4-fps');
        if (fpsInput && mp4Fps) {
            mp4Fps.value = parseInt(fpsInput.value) || 30;
        }
        
        // Set up event handlers
        document.querySelector('#mp4-config-modal .modal-close-btn').addEventListener('click', hideMP4ConfigModal);
        document.getElementById('cancel-mp4-export').addEventListener('click', hideMP4ConfigModal);
        document.getElementById('start-mp4-export').addEventListener('click', () => {
            hideMP4ConfigModal();
            startMP4Export(renderer);
        });
        
        // Maintain aspect ratio when width changes
        const widthInput = document.getElementById('mp4-width');
        const heightInput = document.getElementById('mp4-height');
        const maintainAspect = document.getElementById('mp4-maintain-aspect');
        
        let aspectRatio = renderer.canvas.width / renderer.canvas.height;
        
        widthInput.addEventListener('change', () => {
            if (maintainAspect.checked) {
                // MP4 requires even dimensions for width/height
                const height = Math.round(widthInput.value / aspectRatio);
                heightInput.value = height % 2 === 0 ? height : height + 1;
            }
        });
        
        heightInput.addEventListener('change', () => {
            if (maintainAspect.checked) {
                const width = Math.round(heightInput.value * aspectRatio);
                widthInput.value = width % 2 === 0 ? width : width + 1;
            }
        });
    }
    
    // Display the modal
    modalContainer.style.display = 'flex';
}

async function startMP4Export(renderer, settings) {
    try {
      // Check if FFmpeg is available
      if (typeof FFmpeg === 'undefined') {
        await loadFFmpegLibrary();
      }
  
      // Store animation state
      const wasRunning = renderer.isRunning;
      renderer.pause();
      
      // Show export progress
      showExportProgress('Preparing for MP4 export...', true);
      
      // Set up cancel functionality
      const cancelBtn = document.getElementById('cancel-export');
      let isCancelled = false;
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          isCancelled = true;
          hideExportProgress();
          if (wasRunning) renderer.start();
          window.logToConsole('MP4 export cancelled', 'info');
        };
      }
  
      const { filename, fps, quality, duration, includeAudio } = settings;
      const canvas = renderer.canvas;
      const totalFrames = fps * duration;
      
      // Create a temporary canvas for capturing frames at the desired size
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      
      // Initialize FFmpeg
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        log: true,
        progress: (progress) => {
          updateExportProgress(Math.min(95, progress.ratio * 100));
        }
      });
      
      window.logToConsole('Capturing frames for video...', 'info');
      
      // Prepare for frame capture
      const frames = [];
      const frameTime = 1 / fps;
      
      // Capture frames
      for (let i = 0; i < totalFrames; i++) {
        if (isCancelled) {
          throw new Error('Export cancelled');
        }
        
        const time = i * frameTime;
        
        // Render the frame
        renderer.renderFrame(time);
        
        // Copy to offscreen canvas
        offscreenCtx.drawImage(canvas, 0, 0);
        
        // Get the frame as blob
        const blob = await new Promise(resolve => {
          offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
        
        // Convert blob to Uint8Array
        const arrayBuffer = await blob.arrayBuffer();
        const frameData = new Uint8Array(arrayBuffer);
        
        // Save the frame
        frames.push(frameData);
        
        // Update progress
        updateExportProgress((i / totalFrames) * 50);
      }
      
      // Write frames to FFmpeg
      for (let i = 0; i < frames.length; i++) {
        const frameFilename = `frame_${i.toString().padStart(5, '0')}.jpg`;
        ffmpeg.writeFile(frameFilename, frames[i]);
      }
      
      // Prepare audio if needed
      if (includeAudio && window.audioProcessor && window.audioProcessor.audioElement) {
        try {
          const audioElement = window.audioProcessor.audioElement;
          const audioSrc = audioElement.src;
          
          if (audioSrc) {
            window.logToConsole('Adding audio to video...', 'info');
            
            // Fetch audio data
            const response = await fetch(audioSrc);
            const audioData = await response.arrayBuffer();
            
            // Write audio file
            ffmpeg.writeFile('audio.mp3', new Uint8Array(audioData));
            
            // Set FFmpeg command with audio
            await ffmpeg.exec([
              '-framerate', `${fps}`,
              '-i', 'frame_%05d.jpg',
              '-i', 'audio.mp3',
              '-c:v', 'libx264',
              '-b:v', `${quality}`,
              '-pix_fmt', 'yuv420p',
              '-c:a', 'aac',
              '-shortest',
              'output.mp4'
            ]);
          } else {
            // Set FFmpeg command without audio
            await ffmpeg.exec([
              '-framerate', `${fps}`,
              '-i', 'frame_%05d.jpg',
              '-c:v', 'libx264',
              '-b:v', `${quality}`,
              '-pix_fmt', 'yuv420p',
              'output.mp4'
            ]);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          window.logToConsole('Error processing audio, continuing without it', 'warning');
          
          // Fallback to no audio
          await ffmpeg.exec([
            '-framerate', `${fps}`,
            '-i', 'frame_%05d.jpg',
            '-c:v', 'libx264',
            '-b:v', `${quality}`,
            '-pix_fmt', 'yuv420p',
            'output.mp4'
          ]);
        }
      } else {
        // Set FFmpeg command without audio
        await ffmpeg.exec([
          '-framerate', `${fps}`,
          '-i', 'frame_%05d.jpg',
          '-c:v', 'libx264',
          '-b:v', `${quality}`,
          '-pix_fmt', 'yuv420p',
          'output.mp4'
        ]);
      }
      
      // Read the output file
      updateExportProgress(96);
      const data = await ffmpeg.readFile('output.mp4');
      
      // Create download link
      updateExportProgress(98);
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      updateExportProgress(100);
      setTimeout(() => {
        hideExportProgress();
        if (wasRunning) renderer.start();
        window.logToConsole(`MP4 exported as ${filename}`, 'info');
      }, 1000);
      
    } catch (error) {
      console.error('MP4 export error:', error);
      window.logToConsole(`MP4 export error: ${error.message}`, 'error');
      hideExportProgress();
      if (wasRunning) renderer.start();
    }
  }
  
  // Helper function to dynamically load FFmpeg library
  async function loadFFmpegLibrary() {
    return new Promise((resolve, reject) => {
      window.logToConsole('Loading FFmpeg library...', 'info');
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/umd/ffmpeg.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load FFmpeg library'));
      document.body.appendChild(script);
      
      // Also load core
      const coreScript = document.createElement('script');
      coreScript.src = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js';
      document.body.appendChild(coreScript);
    });
}

  // Alternative implementation using frame buffering for smoother output
async function startMP4ExportWithBuffering(renderer, settings) {
    try {
      // Get export settings
      const { filename, fps, duration, quality, includeAudio } = settings;
      const canvas = renderer.canvas;
      const totalFrames = Math.ceil(fps * duration);
      
      // Store animation state
      const wasRunning = renderer.isRunning;
      renderer.pause();
      
      // Setup progress tracking
      showExportProgress('Capturing frames...', true);
      
      // Set up cancel functionality
      const cancelBtn = document.getElementById('cancel-export');
      let isCancelled = false;
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          isCancelled = true;
          hideExportProgress();
          if (wasRunning) renderer.start();
          window.logToConsole('Video export cancelled', 'info');
        };
      }
  
      window.logToConsole(`Capturing ${totalFrames} frames at ${fps} FPS...`, 'info');
      
      // Create offscreen buffer for frame capture
      const buffer = document.createElement('canvas');
      buffer.width = canvas.width;
      buffer.height = canvas.height;
      const bufferCtx = buffer.getContext('2d');
      
      // Prepare frame collection - store as ImageData to save memory
      const frames = [];
      const frameTime = 1 / fps;
      
      // Capture all frames first
      for (let i = 0; i < totalFrames; i++) {
        if (isCancelled) return;
        
        // Calculate time for this frame
        const time = i * frameTime;
        
        // Render the frame to the main canvas
        renderer.renderFrame(time);
        
        // Copy the frame to our buffer
        bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
        bufferCtx.drawImage(canvas, 0, 0);
        
        // Store the frame as data URL (more reliable than blobs)
        const dataURL = buffer.toDataURL('image/jpeg', 0.95);
        frames.push(dataURL);
        
        // Update progress (use 70% of progress for frame capture)
        updateExportProgress(Math.floor((i / totalFrames) * 70));
        
        // Log progress occasionally
        if (i % 10 === 0 || i === totalFrames - 1) {
          window.logToConsole(`Captured frame ${i+1} of ${totalFrames}`, 'info');
        }
        
        // Let the browser breathe every few frames
        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }
      
      updateExportProgress(70);
      window.logToConsole('Frames captured, creating video...', 'info');
      
      // Set up a visible canvas for playback - this helps avoid black frames
      const videoCanvas = document.createElement('canvas');
      videoCanvas.width = canvas.width;
      videoCanvas.height = canvas.height;
      videoCanvas.style.position = 'absolute';
      videoCanvas.style.left = '-9999px'; // Position off-screen but still visible
      videoCanvas.style.top = '0';
      document.body.appendChild(videoCanvas);
      const videoCtx = videoCanvas.getContext('2d');
      
      // Create a video stream from this canvas
      const videoStream = videoCanvas.captureStream(fps);
      
      // We'll handle audio differently to ensure it works
      let audioElement = null;
      let audioStream = null;
      let combinedStream = videoStream;
      
      if (includeAudio && window.audioProcessor?.audioElement) {
        try {
          updateExportProgress(72);
          window.logToConsole('Setting up audio track...', 'info');
          
          // Create a fresh audio element for recording
          audioElement = document.createElement('audio');
          audioElement.src = window.audioProcessor.audioElement.src;
          audioElement.loop = false;
          audioElement.crossOrigin = "anonymous";
          audioElement.volume = 0; // Mute during export
          document.body.appendChild(audioElement);
          
          // Wait for audio metadata to load
          await new Promise((resolve, reject) => {
            audioElement.addEventListener('loadedmetadata', resolve);
            audioElement.addEventListener('error', e => reject(new Error(`Audio error: ${e.message}`)));
            
            // Adding a timeout in case audio loading hangs
            setTimeout(() => resolve(), 3000);
          });
          
          // Create audio stream from the element
          const audioContext = new AudioContext();
          const audioSource = audioContext.createMediaElementSource(audioElement);
          const audioDestination = audioContext.createMediaStreamDestination();
          audioSource.connect(audioDestination);
          
          audioStream = audioDestination.stream;
          
          // Combine video and audio streams
          combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ]);
        } catch (error) {
          console.error('Error setting up audio:', error);
          window.logToConsole('Could not add audio to export: ' + error.message, 'warning');
          
          // Continue without audio if there's an error
          if (audioElement) {
            audioElement.remove();
            audioElement = null;
          }
        }
      }
      
      // Set up MediaRecorder
      updateExportProgress(75);
      let mimeType = 'video/webm;codecs=vp9';
      
      // Check if the codec is supported, if not fall back to the default
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: quality
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // When recording is complete
      mediaRecorder.onstop = async () => {
        try {
          if (isCancelled) return;
          
          updateExportProgress(95);
          window.logToConsole('Processing video...', 'info');
          
          // Create final video blob
          const videoBlob = new Blob(chunks, { type: mimeType });
          
          // Create download link
          const url = URL.createObjectURL(videoBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          // Click to download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          URL.revokeObjectURL(url);
          hideExportProgress();
          if (wasRunning) renderer.start();
          
          // Remove any temporary elements
          if (videoCanvas && videoCanvas.parentNode) {
            videoCanvas.parentNode.removeChild(videoCanvas);
          }
          
          if (audioElement && audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
          }
          
          window.logToConsole(`Video exported successfully as ${filename}`, 'info');
        } catch (error) {
          console.error('Error finalizing video:', error);
          window.logToConsole(`Error finalizing video: ${error.message}`, 'error');
          hideExportProgress();
        }
      };
      
      // Start recording with small chunks for better quality
      mediaRecorder.start(100);
      
      // Create images for each frame and play them at the right speed
      updateExportProgress(80);
      window.logToConsole('Encoding video frames...', 'info');
      
      // Play audio if available - we need to do this just before frame playback starts
      if (audioElement) {
        // This will ensure the audio plays even with autoplay restrictions
        const playAudioPromise = audioElement.play().catch(err => {
          console.warn('Auto-play prevented for audio:', err);
          window.logToConsole('Audio autoplay prevented - video may not have audio', 'warning');
        });
      }
      
      // Use requestAnimationFrame for precise timing
      let frameIndex = 0;
      let lastFrameTime = 0;
      let startTime = null;
      
      const renderNextFrame = (timestamp) => {
        if (isCancelled) {
          mediaRecorder.stop();
          return;
        }
        
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        // Determine which frame to show based on elapsed time
        const targetFrame = Math.min(
          Math.floor(elapsed / (1000 / fps)), 
          frames.length - 1
        );
        
        // Only update if we need to show a new frame
        if (targetFrame > frameIndex) {
          // Update to the latest frame we should be showing
          frameIndex = targetFrame;
          
          // Load and draw the frame
          const img = new Image();
          img.onload = () => {
            videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
            videoCtx.drawImage(img, 0, 0);
          };
          img.src = frames[frameIndex];
          
          // Update progress
          const progress = 80 + Math.floor((frameIndex / frames.length) * 15);
          updateExportProgress(Math.min(progress, 94));
          
          // Log progress occasionally
          if (frameIndex % 30 === 0 || frameIndex === frames.length - 1) {
            window.logToConsole(`Playing frame ${frameIndex + 1} of ${frames.length}`, 'info');
          }
        }
        
        // Stop when we've processed all frames
        if (frameIndex >= frames.length - 1) {
          // Wait a bit before stopping to ensure the last frame is captured
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500);
          return;
        }
        
        // Continue animation loop
        requestAnimationFrame(renderNextFrame);
      };
      
      // Start the animation loop to process frames
      requestAnimationFrame(renderNextFrame);
      
    } catch (error) {
      console.error('Video export error:', error);
      window.logToConsole(`Video export error: ${error.message}`, 'error');
      hideExportProgress();
      if (wasRunning) renderer.start();
    }
  }
  
  // Update the MP4 config modal to include the new buffering option
  // Update the MP4 config modal
// Update the MP4 config modal
function showMP4ConfigModal(renderer) {
    let modalContainer = document.createElement('div');
    modalContainer.id = 'mp4-config-modal';
    modalContainer.className = 'export-modal';
    
    // Initialize values from existing inputs
    const currentFps = document.getElementById('fps-input')?.value || 30;
    const currentDuration = document.getElementById('duration-input')?.value || 5;
    
    // Check if audio is available
    const hasAudio = !!(window.audioProcessor?.audioElement?.src);
    
    modalContainer.innerHTML = `
        <div class="export-modal-content">
            <div class="modal-header">
                <h2>Video Export Settings</h2>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="mp4-filename">Filename:</label>
                    <input type="text" id="mp4-filename" value="kaleido-script-animation.webm">
                </div>
                <div class="form-group">
                    <label for="mp4-quality">Video Quality:</label>
                    <select id="mp4-quality">
                        <option value="12000000">High (12 Mbps)</option>
                        <option value="8000000" selected>Medium (8 Mbps)</option>
                        <option value="4000000">Low (4 Mbps)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="mp4-fps">Frame Rate (FPS):</label>
                    <input type="number" id="mp4-fps" min="1" max="60" value="${currentFps}">
                </div>
                <div class="form-group">
                    <label for="mp4-duration">Duration (seconds):</label>
                    <input type="number" id="mp4-duration" min="1" max="600" value="${currentDuration}">
                </div>
                ${hasAudio ? `
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="mp4-include-audio" checked>
                    <label for="mp4-include-audio">Include audio</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="mp4-sync-audio-duration" checked>
                    <label for="mp4-sync-audio-duration">Set duration to match audio</label>
                </div>
                ` : `
                <div class="form-notice">
                    <i>No audio loaded. To include audio, import an audio file first.</i>
                </div>
                `}
                <div class="form-group">
                    <label for="mp4-export-method">Export Method:</label>
                    <select id="mp4-export-method">
                        <option value="buffer" selected>Buffered frames (recommended for complex visuals)</option>
                        <option value="realtime">Real-time capture (simpler, but may lag)</option>
                    </select>
                </div>
                <div class="export-info">
                    <p><strong>Note:</strong> Videos are exported in WebM format which is widely supported by modern browsers and video players.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cancel-mp4-export" class="btn-secondary">Cancel</button>
                <button id="start-mp4-export" class="btn-primary">Export Video</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);

    // Get all the values before setting up event handlers
    const getExportSettings = () => ({
        filename: document.getElementById('mp4-filename').value,
        fps: parseInt(document.getElementById('mp4-fps').value) || 30,
        quality: parseInt(document.getElementById('mp4-quality').value) || 8000000,
        duration: parseInt(document.getElementById('mp4-duration').value) || 5,
        includeAudio: document.getElementById('mp4-include-audio')?.checked ?? false,
        syncAudioDuration: document.getElementById('mp4-sync-audio-duration')?.checked ?? false,
        exportMethod: document.getElementById('mp4-export-method').value
    });

    // Set duration to match audio if the checkbox is checked
    const syncAudioCheck = document.getElementById('mp4-sync-audio-duration');
    if (syncAudioCheck && window.audioProcessor) {
        syncAudioCheck.addEventListener('change', () => {
            if (syncAudioCheck.checked) {
                const audioDuration = Math.ceil(window.audioProcessor.getDuration());
                if (audioDuration > 0) {
                    document.getElementById('mp4-duration').value = audioDuration;
                    window.logToConsole(`Video duration set to match audio: ${audioDuration}s`, 'info');
                }
            }
        });
        
        // Trigger change if checked by default
        if (syncAudioCheck.checked) {
            const audioDuration = Math.ceil(window.audioProcessor.getDuration());
            if (audioDuration > 0) {
                document.getElementById('mp4-duration').value = audioDuration;
            }
        }
    }

    // Setup event handlers
    modalContainer.querySelector('.modal-close-btn').onclick = () => modalContainer.remove();
    document.getElementById('cancel-mp4-export').onclick = () => modalContainer.remove();
    document.getElementById('start-mp4-export').onclick = () => {
        const settings = getExportSettings();
        modalContainer.remove();
        
        // Ensure filename has the correct extension
        if (!settings.filename.endsWith('.webm')) {
            settings.filename = settings.filename.replace(/\.(mp4|mov|avi)$/, '') + '.webm';
        }
        
        // Choose the export method
        if (settings.exportMethod === 'buffer') {
            startMP4ExportWithAudioSync(renderer, settings);
        } else {
            // Use the simpler real-time approach
            startMP4ExportWithMediaRecorder(renderer, settings);
        }
    };

    modalContainer.style.display = 'flex';
}

// Updated buffer-based export method with proper audio sync
async function startMP4ExportWithAudioSync(renderer, settings) {
    try {
        // Get export settings
        const { filename, fps, duration, quality, includeAudio } = settings;
        const canvas = renderer.canvas;
        const totalFrames = Math.ceil(fps * duration);
        
        // Store animation state
        const wasRunning = renderer.isRunning;
        renderer.pause();
        
        // Setup progress tracking
        showExportProgress('Preparing for export...', true);
        
        // Set up cancel functionality
        const cancelBtn = document.getElementById('cancel-export');
        let isCancelled = false;
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                isCancelled = true;
                hideExportProgress();
                if (wasRunning) renderer.start();
                window.logToConsole('Video export cancelled', 'info');
            };
        }
        
        // Check for audio processor
        let audioProcessor = window.audioProcessor;
        let hasAudio = includeAudio && audioProcessor && audioProcessor.audioElement && audioProcessor.audioElement.src;
        
        // Create offscreen buffer for frame capture
        const buffer = document.createElement('canvas');
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        const bufferCtx = buffer.getContext('2d');
        
        // Create a VideoCanvas for MediaRecorder
        const videoCanvas = document.createElement('canvas');
        videoCanvas.width = canvas.width;
        videoCanvas.height = canvas.height;
        videoCanvas.style.position = 'absolute';
        videoCanvas.style.left = '-9999px';
        videoCanvas.style.top = '0';
        document.body.appendChild(videoCanvas);
        const videoCtx = videoCanvas.getContext('2d');
        
        // Create a MediaStream from the video canvas
        const videoStream = videoCanvas.captureStream(fps);
        
        // Set up audio
        let audioElement = null;
        let audioStream = null;
        let combinedStream = videoStream;
        
        if (hasAudio) {
            try {
                window.logToConsole('Setting up audio track...', 'info');
                
                // Clone the audio element to avoid affecting the main audio playback
                audioElement = document.createElement('audio');
                audioElement.src = audioProcessor.audioElement.src;
                audioElement.loop = false;
                audioElement.crossOrigin = "anonymous";
                audioElement.volume = 0; // Mute during export
                document.body.appendChild(audioElement);
                
                // Wait for audio to be ready
                await new Promise((resolve) => {
                    audioElement.addEventListener('loadedmetadata', resolve);
                    audioElement.addEventListener('error', resolve);
                    setTimeout(resolve, 3000); // Timeout fallback
                });
                
                // Create audio stream
                audioStream = audioElement.captureStream();
                
                // Combine streams
                combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...audioStream.getAudioTracks()
                ]);
                
                // Configure the audio processor to use our export audio element
                if (audioProcessor) {
                    audioProcessor._exportAudioElement = audioElement;
                    console.log('Set export audio element reference for audio processor');
                }
                
                window.logToConsole('Audio track added to video', 'info');
                
            } catch (error) {
                console.error('Error setting up audio:', error);
                window.logToConsole('Could not add audio: ' + error.message, 'warning');
                
                if (audioElement) {
                    audioElement.remove();
                    audioElement = null;
                }
                hasAudio = false;
            }
        }
        
        // Set up MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9' 
            : 'video/webm';
        
        const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: quality
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        // When recording is complete
        mediaRecorder.onstop = () => {
            if (isCancelled) return;
            
            updateExportProgress(95);
            window.logToConsole('Processing video...', 'info');
            
            // Create final video blob
            const videoBlob = new Blob(chunks, { type: mimeType });
            
            // Create download link
            const url = URL.createObjectURL(videoBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Download the video
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            URL.revokeObjectURL(url);
            hideExportProgress();
            
            // Remove temporary elements
            videoCanvas.remove();
            if (audioElement) audioElement.remove();
            
            // Reset audio processor state
            if (audioProcessor) {
                // Clear export reference
                audioProcessor._exportAudioElement = null;
                
                audioProcessor.stop();
                if (wasRunning) {
                    audioProcessor.play();
                    renderer.start();
                }
            } else if (wasRunning) {
                renderer.start();
            }
            
            window.logToConsole(`Video exported successfully as ${filename}`, 'info');
        };
        
        // Start recording
        mediaRecorder.start(100); // 100ms chunks for better quality
        
        // Start audio if available - THIS MUST HAPPEN BEFORE FRAME RENDERING
        if (audioElement) {
            try {
                // We need to start playing the audio before we start rendering frames
                await audioElement.play();
                audioElement.currentTime = 0; // Start from beginning
                
                window.logToConsole('Audio playback started for export', 'info');
            } catch (err) {
                console.warn('Audio playback error during export:', err);
                window.logToConsole('Audio playback issue - video may not have audio', 'warning');
            }
        }
        
        // Frame rendering variables
        let frameCount = 0;
        const frameInterval = 1000 / fps; // ms per frame
        
        // Render frames in sync with audio
        window.logToConsole('Starting video recording...', 'info');
        
        // Starting time reference
        const startTime = performance.now();
        
        // Function to render each frame
        const renderNextFrame = async () => {
            if (isCancelled) {
                mediaRecorder.stop();
                return;
            }
            
            const now = performance.now();
            const elapsedMs = now - startTime;
            const elapsedSec = elapsedMs / 1000;
            
            // Check if we've reached the duration
            if (elapsedSec >= duration) {
                window.logToConsole('Export duration reached, finalizing...', 'info');
                mediaRecorder.stop();
                return;
            }
            
            // Render the current frame at the current elapsed time
            try {
                // Update audio position if needed for audio reactive visualizations
                if (audioElement) {
                    // Force audio element time to match our elapsed time
                    if (Math.abs(audioElement.currentTime - elapsedSec) > 0.1) {
                        audioElement.currentTime = elapsedSec;
                    }
                }
                
                // Render the frame at this specific time
                renderer.renderFrame(elapsedSec);
                
                // Copy from main canvas to video canvas
                videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
                videoCtx.drawImage(canvas, 0, 0);
                
                // Update progress
                if (frameCount % 10 === 0) {
                    const progress = Math.min(90, (elapsedSec / duration) * 90);
                    updateExportProgress(progress);
                    
                    // Log progress occasionally
                    if (frameCount % 30 === 0) {
                        window.logToConsole(`Rendering: ${Math.round(elapsedSec)}/${duration}s (${Math.round(progress)}%)`, 'info');
                    }
                }
                
                frameCount++;
                
                // Schedule next frame - using smaller delay for more stable timing
                setTimeout(() => requestAnimationFrame(renderNextFrame), 1);
                
            } catch (error) {
                console.error('Error rendering frame:', error);
                window.logToConsole(`Frame rendering error: ${error.message}`, 'error');
            }
        };
        
        // Start the rendering process
        renderNextFrame();
        
    } catch (error) {
        console.error('Video export error:', error);
        window.logToConsole(`Video export error: ${error.message}`, 'error');
        hideExportProgress();
    }
}

// Alternative MediaRecorder approach (kept for compatibility)
async function startMP4ExportWithMediaRecorder(renderer, settings) {
    try {
        const { filename, fps, duration, quality, includeAudio } = settings;
        const canvas = renderer.canvas;
        
        // Store animation state
        const wasRunning = renderer.isRunning;
        renderer.pause();
        
        // Show export progress
        showExportProgress('Preparing for video recording...', true);
        
        // Set up cancel functionality
        const cancelBtn = document.getElementById('cancel-export');
        let isCancelled = false;
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                isCancelled = true;
                hideExportProgress();
                if (wasRunning) renderer.start();
                window.logToConsole('Video export cancelled', 'info');
            };
        }
        
        // Create a MediaStream from the canvas
        const stream = canvas.captureStream(fps);
        
        // Set up audio if requested
        let mediaRecorder;
        if (includeAudio && window.audioProcessor?.audioElement) {
            try {
                const audioElement = window.audioProcessor.audioElement;
                const audioClone = audioElement.cloneNode(true);
                audioClone.currentTime = 0;
                audioClone.volume = 0; // Mute during export
                document.body.appendChild(audioClone);
                
                // Wait for audio to be ready
                await new Promise(resolve => {
                    audioClone.addEventListener('canplay', resolve);
                    setTimeout(resolve, 2000); // Timeout fallback
                });
                
                // Get audio stream
                const audioStream = audioClone.captureStream();
                
                // Combine video and audio streams
                const combinedStream = new MediaStream([
                    ...stream.getVideoTracks(),
                    ...audioStream.getAudioTracks()
                ]);
                
                // Set up MediaRecorder with combined stream
                mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: quality
                });
                
                // Start audio
                try {
                    await audioClone.play();
                } catch (err) {
                    console.warn('Error playing audio during export:', err);
                }
                
            } catch (error) {
                console.error('Error setting up audio:', error);
                window.logToConsole('Error adding audio to recording, continuing with video only', 'warning');
                
                // Fallback to video-only recording
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: quality
                });
            }
        } else {
            // Video only recording
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: quality
            });
        }
        
        // Collect data chunks
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        // Handle recording completion
        mediaRecorder.onstop = () => {
            if (isCancelled) return;
            
            updateExportProgress(90);
            window.logToConsole('Processing video...', 'info');
            
            // Create a Blob from all chunks
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            hideExportProgress();
            if (wasRunning) renderer.start();
            window.logToConsole(`Video exported as ${filename}`, 'info');
            
            // Remove any audio clone elements
            document.querySelectorAll('audio[data-export-clone]').forEach(el => el.remove());
        };
        
        // Start recording
        mediaRecorder.start(100); // Use 100ms chunks for better quality
        
        // Start animation
        renderer.start();
        
        // Update progress during recording
        let progress = 0;
        const updateInterval = setInterval(() => {
            progress += 100 / (duration * 10); // Update every 100ms
            updateExportProgress(Math.min(progress, 85));
            
            if (progress >= 85 || isCancelled) {
                clearInterval(updateInterval);
            }
        }, 100);
        
        // Stop recording after the specified duration
        setTimeout(() => {
            if (!isCancelled) {
                renderer.pause();
                mediaRecorder.stop();
                clearInterval(updateInterval);
                updateExportProgress(85);
            }
        }, duration * 1000);
        
    } catch (error) {
        console.error('Video export error:', error);
        window.logToConsole(`Video export error: ${error.message}`, 'error');
        hideExportProgress();
        if (wasRunning) renderer.start();
    }
}

// Export to MP4 (main entry point)
function exportToMP4(renderer) {
    showMP4ConfigModal(renderer);
}

function hideMP4ConfigModal() {
    const modalContainer = document.getElementById('mp4-config-modal');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
}

async function startMP4Export(renderer, settings) {
    try {
        if (!settings) {
            console.error('Export settings not provided');
            window.logToConsole('Export settings not provided', 'error');
            return;
        }
        console.log('Starting MP4 export...', settings);
        const { filename, fps, quality, duration, includeAudio } = settings;
        
        if (!duration || duration <= 0) {
            alert('Please set a valid duration for the MP4 export');
            return;
        }

        // Show progress modal
        showExportProgress('Preparing MP4 export...', true);
        
        // Create a MediaStream from the canvas
        console.log('Creating canvas stream...');
        const canvasStream = renderer.canvas.captureStream(fps);
        let mediaStream = canvasStream;

        // Add audio track if available and requested
        if (includeAudio && window.audioProcessor?.audioElement) {
            console.log('Adding audio track...');
            const audioElement = window.audioProcessor.audioElement;
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaElementSource(audioElement);
            const audioDestination = audioContext.createMediaStreamDestination();
            audioSource.connect(audioDestination);
            audioSource.connect(audioContext.destination);
            
            mediaStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioDestination.stream.getAudioTracks()
            ]);
        }

        // Configure MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        console.log('Creating MediaRecorder...');
        const mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType,
            videoBitsPerSecond: quality
        });
        
        const chunks = [];
        let recordingStartTime;
        
        mediaRecorder.ondataavailable = (e) => {
            console.log('Chunk received:', e.data.size);
            chunks.push(e.data);
        };
        
        mediaRecorder.onstart = () => {
            console.log('Recording started');
            recordingStartTime = Date.now();
            window.logToConsole('Started recording...', 'info');
        };
        
        mediaRecorder.onstop = async () => {
            try {
                console.log('Recording stopped, processing...');
                const blob = new Blob(chunks, { type: 'video/webm' });
                console.log('Final blob size:', blob.size);
                
                updateExportProgress(90);
                window.logToConsole('Converting to MP4...');

                // Initialize FFmpeg with CORS settings
                const ffmpeg = FFmpeg.createFFmpeg({ 
                    log: true,
                    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                    mainName: 'main',
                    workerPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js'
                });
                
                try {
                    await ffmpeg.load();
                } catch (err) {
                    console.error('FFmpeg load error:', err);
                    throw new Error('Failed to load FFmpeg. Please make sure you are running from a secure server with proper CORS headers.');
                }

                // Convert blob to buffer
                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Write input file
                ffmpeg.FS('writeFile', 'input.webm', uint8Array);
                
                // Run conversion
                await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', 'output.mp4');
                
                // Read output file
                const data = ffmpeg.FS('readFile', 'output.mp4');
                const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
                
                // Create download link
                const url = URL.createObjectURL(mp4Blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                
                // Cleanup
                URL.revokeObjectURL(url);
                hideExportProgress();
                window.logToConsole('MP4 export complete!', 'success');
            } catch (error) {
                console.error('Error in processing:', error);
                window.logToConsole(`Error processing video: ${error.message}`, 'error');
                hideExportProgress();
            }
        };

        // Start recording
        console.log('Starting recording...');
        mediaRecorder.start(1000); // Capture in 1-second chunks
        
        // Start animation if not running
        const wasRunning = renderer.isRunning;
        if (!wasRunning) {
            renderer.start();
        }
        
        // Start audio if needed
        if (includeAudio && window.audioProcessor) {
            window.audioProcessor.play();
        }

        // Update progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress = Math.min(progress + 1, 89);
            updateExportProgress(progress);
        }, duration * 1000 / 90);

        // Stop recording after duration
        setTimeout(() => {
            console.log('Stopping recording...');
            mediaRecorder.stop();
            clearInterval(progressInterval);
            
            // Reset states
            if (!wasRunning) {
                renderer.pause();
            }
            
            if (includeAudio && window.audioProcessor) {
                window.audioProcessor.stop();
            }
        }, duration * 1000);

    } catch (error) {
        console.error('Export error:', error);
        window.logToConsole(`MP4 export failed: ${error.message}`, 'error');
        hideExportProgress();
    }
}

// Show export progress with message and optional cancel button
function showExportProgress(message, canCancel = false) {
    let progressContainer = document.getElementById('export-progress');
    
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'export-progress';
        progressContainer.className = 'export-progress-container';
        
        progressContainer.innerHTML = `
            <div class="export-progress-modal">
                <div class="progress-message"></div>
                <div class="progress-bar-container">
                    <div class="progress-bar-inner"></div>
                </div>
                ${canCancel ? '<button id="cancel-export" class="btn-secondary">Cancel</button>' : ''}
            </div>
        `;
        
        document.body.appendChild(progressContainer);
    }
    
    progressContainer.querySelector('.progress-message').textContent = message;
    progressContainer.querySelector('.progress-bar-inner').style.width = '0%';
    progressContainer.style.display = 'flex';
}

// Helper function to update export progress
function updateExportProgress(percent) {
    const progressContainer = document.getElementById('export-progress');
    if (progressContainer) {
        const progressBar = progressContainer.querySelector('.progress-bar-inner');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }
}

// Helper function to hide export progress
function hideExportProgress() {
    const progressContainer = document.getElementById('export-progress');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

/**
 * Export the current animation as a ZIP package containing HTML5 player and assets
 * @param {Renderer} renderer - The current renderer
 */
function exportToHTML5(renderer) {
    try {
        window.logToConsole('Preparing HTML5 export package...', 'info');
        
        // Get the current script code
        const scriptCode = window.editor ? window.editor.getValue() : '';
        
        if (!scriptCode) {
            window.logToConsole('No code to export', 'warning');
            return;
        }
        
        // Get current canvas dimensions
        const width = renderer.canvas.width;
        const height = renderer.canvas.height;
        
        // Create a loading indicator
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">Creating HTML5 package...</div>
        `;
        document.body.appendChild(loadingOverlay);
        
        // Create a new JSZip instance
        if (typeof JSZip === 'undefined') {
            window.logToConsole('JSZip library not found. Please check your internet connection and reload the page.', 'error');
            document.body.removeChild(loadingOverlay);
            return;
        }
        
        const zip = new JSZip();
        
        // Start collecting all the assets that need to be included
        const assets = {
            audio: [],
            images: []
        };
        
        // Extract all assets referenced in the code - with more robust error handling
        collectAssets(scriptCode, assets)
            .then(() => {
                // Create the main HTML file
                window.logToConsole('Creating HTML5 template...', 'info');
                loadingOverlay.querySelector('.loading-message').textContent = 'Creating HTML5 template...';
                
                // Process the script code to update asset paths
                let processedScript = scriptCode;
                
                // Replace audio file paths with relative paths
                assets.audio.forEach(audio => {
                    const regex = new RegExp(`loadAudio\\s*\\(\\s*["']${escapeRegExp(audio.name)}["']\\s*\\)`, 'g');
                    processedScript = processedScript.replace(regex, `loadAudio('assets/audio/${audio.name}')`);
                });
                
                // Replace image file paths with relative paths
                assets.images.forEach(image => {
                    const regex = new RegExp(`loadImage\\s*\\(\\s*["']${escapeRegExp(image.name)}["']\\s*\\)`, 'g');
                    processedScript = processedScript.replace(regex, `loadImage('assets/images/${image.name}')`);
                });
                
                // Generate HTML with processed script
                const html = createHTML5Template(processedScript, width, height);
                
                // Add the HTML file to the ZIP
                zip.file("index.html", html);
                
                // Create directories for assets
                const audioFolder = zip.folder("assets/audio");
                const imagesFolder = zip.folder("assets/images");
                
                // Process audio files with better error handling
                window.logToConsole(`Processing ${assets.audio.length} audio files...`, 'info');
                loadingOverlay.querySelector('.loading-message').textContent = `Processing audio files...`;
                
                const audioPromises = assets.audio.map(audio => {
                    return getFileFromSource(audio.url)
                        .then(blob => {
                            const fileName = audio.name;
                            audioFolder.file(fileName, blob);
                            return fileName;
                        })
                        .catch(error => {
                            console.error('Error processing audio file:', error);
                            window.logToConsole(`Error adding audio file ${audio.name}: ${error.message}`, 'warning');
                            return null;
                        });
                });
                
                // Process image files with better error handling
                window.logToConsole(`Processing ${assets.images.length} image files...`, 'info');
                loadingOverlay.querySelector('.loading-message').textContent = `Processing image files...`;
                
                const imagePromises = assets.images.map(image => {
                    return getFileFromSource(image.url)
                        .then(blob => {
                            const fileName = image.name;
                            imagesFolder.file(fileName, blob);
                            return fileName;
                        })
                        .catch(error => {
                            console.error('Error processing image file:', error);
                            window.logToConsole(`Error adding image file ${image.name}: ${error.message}`, 'warning');
                            return null;
                        });
                });
                
                // Wait for all assets to be processed
                loadingOverlay.querySelector('.loading-message').textContent = `Adding files to package...`;
                return Promise.all([...audioPromises, ...imagePromises]);
            })
            .then(fileNames => {
                // Filter out null entries (failed files)
                const addedFiles = fileNames.filter(Boolean);
                window.logToConsole(`Added ${addedFiles.length} files to the package`, 'info');
                loadingOverlay.querySelector('.loading-message').textContent = 'Generating ZIP file...';
                
                // Generate timestamp for filename
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `kaleido-player-${timestamp}.zip`;
                
                // Generate the ZIP file with compression options
                return zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 6
                    }
                });
            })
            .then(zipBlob => {
                // Create download link
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename || 'kaleido-player.zip';
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                window.logToConsole(`HTML5 package exported successfully!`, 'success');
                
                // Show instructions
                window.logToConsole(`To use: Extract the ZIP file, then open index.html in a browser or upload to a web server.`, 'info');
            })
            .catch(error => {
                console.error('Error creating ZIP package:', error);
                window.logToConsole(`Error creating ZIP package: ${error.message}`, 'error');
            })
            .finally(() => {
                // Remove loading overlay
                if (document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
            });
    } catch (error) {
        console.error('Error exporting HTML5:', error);
        window.logToConsole(`Error exporting HTML5: ${error.message}`, 'error');
        
        // Remove loading overlay if it exists
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay && document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }
    }
}

/**
 * Helper function to convert dataURI to Blob asynchronously
 * @param {string} dataURI - The data URI
 * @returns {Promise<Blob>} - A promise that resolves to a Blob
 */
function dataURItoBlob(dataURI) {
    return new Promise((resolve, reject) => {
        try {
            // If it's already a Blob or File
            if (dataURI instanceof Blob) {
                resolve(dataURI);
                return;
            }
            
            // If it's a URL, fetch it
            if (dataURI.startsWith('http') || dataURI.startsWith('blob:')) {
                fetch(dataURI)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Network error: ${response.statusText}`);
                        }
                        return response.blob();
                    })
                    .then(blob => resolve(blob))
                    .catch(reject);
                return;
            }
            
            // Otherwise, process as data URI
            // Parse the data URI
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            
            // Convert to byte array
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            // Create and return Blob
            const blob = new Blob([ab], {type: mimeString});
            resolve(blob);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get information about the audio file currently being used
 * @returns {Object|null} Audio information or null if no audio
 */
function getAudioExportInfo() {
    if (!window.audioProcessor || 
        !window.audioProcessor.audioElement || 
        !window.audioProcessor.audioElement.src) {
        return null;
    }
    
    // Find the name of the audio file
    const audioName = window.audioProcessor.audioData?.name;
    
    // We need to embed the actual audio data
    const audioSrc = window.audioProcessor.audioElement.src;
    
    return {
        name: audioName || 'audio',
        src: audioSrc
    };
}

function createHTML5Template(scriptCode, width, height) {
    // Generate a unique ID for the player
    const playerId = 'kp_' + Math.random().toString(36).substr(2, 9);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KaleidoScript Player</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #1e1e1e;
            font-family: Arial, sans-serif;
            color: #fff;
        }
        .player-container {
            position: relative;
            width: ${width}px;
            height: ${height + 40}px; /* Canvas height + controls height */
            max-width: 100%;
            margin: 0 auto;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            overflow: hidden;
            background-color: #0a0a0a;
        }
        .canvas-container {
            width: 100%;
            height: ${height}px;
            position: relative;
            overflow: hidden;
        }
        canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        .controls {
            display: flex;
            align-items: center;
            padding: 8px 15px;
            background-color: #222;
            height: 24px;
        }
        button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
            width: 30px;
            height: 24px;
            padding: 0;
            margin-right: 5px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        button:hover {
            background-color: #444;
        }
        .play-btn::before {
            content: "▶";
            display: inline-block;
        }
        .play-btn.playing::before {
            content: "⏸︎";
        }
        .stop-btn::before {
            content: "⏹";
        }
        .progress-container {
            flex-grow: 1;
            height: 6px;
            background-color: #444;
            border-radius: 3px;
            margin: 0 10px;
            position: relative;
            cursor: pointer;
        }
        .progress-bar {
            height: 100%;
            background-color: #0088ff;
            border-radius: 3px;
            width: 0%;
            transition: width 0.1s linear;
        }
        .time-display {
            font-size: 12px;
            margin-left: 10px;
            white-space: nowrap;
            color: #aaa;
        }
        .fullscreen-btn::before {
            content: "⤢";
        }
        .volume-btn {
            position: relative;
        }
        .volume-btn::before {
            content: "🔊";
            font-size: 14px;
        }
        .volume-btn.muted::before {
            content: "🔇";
        }
        .volume-slider {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) rotate(-90deg);
            width: 80px;
            height: 20px;
            background-color: #333;
            border-radius: 10px;
            padding: 5px;
            display: none;
        }
        .volume-btn:hover .volume-slider {
            display: block;
        }
        input[type="range"] {
            width: 100%;
        }
        @media (max-width: 600px) {
            .time-display {
                display: none;
            }
            .controls {
                padding: 8px;
            }
            button {
                margin-right: 3px;
            }
        }
    </style>
</head>
<body>
    <div class="player-container" id="${playerId}">
        <div class="canvas-container">
            <canvas id="${playerId}_canvas"></canvas>
        </div>
        <div class="controls">
            <button class="play-btn" id="${playerId}_play" title="Play/Pause"></button>
            <button class="stop-btn" id="${playerId}_stop" title="Stop"></button>
            <div class="progress-container" id="${playerId}_progress_container">
                <div class="progress-bar" id="${playerId}_progress"></div>
            </div>
            <span class="time-display" id="${playerId}_time">0:00 / 0:00</span>
            <button class="volume-btn" id="${playerId}_volume" title="Volume">
                <div class="volume-slider">
                    <input type="range" id="${playerId}_volume_slider" min="0" max="1" step="0.01" value="1">
                </div>
            </button>
            <button class="fullscreen-btn" id="${playerId}_fullscreen" title="Fullscreen"></button>
        </div>
    </div>

    <script>
        // KaleidoScript Embedded Player
        (function() {
            // Initialize variables
            const playerId = '${playerId}';
            const canvas = document.getElementById(playerId + '_canvas');
            const ctx = canvas.getContext('2d');
            const playBtn = document.getElementById(playerId + '_play');
            const stopBtn = document.getElementById(playerId + '_stop');
            const progressContainer = document.getElementById(playerId + '_progress_container');
            const progressBar = document.getElementById(playerId + '_progress');
            const timeDisplay = document.getElementById(playerId + '_time');
            const volumeBtn = document.getElementById(playerId + '_volume');
            const volumeSlider = document.getElementById(playerId + '_volume_slider');
            const fullscreenBtn = document.getElementById(playerId + '_fullscreen');
            
            // Set up canvas dimensions
            canvas.width = ${width};
            canvas.height = ${height};
            
            // Animation state
            let isPlaying = false;
            let animationFrame = null;
            let startTime = 0;
            let pauseTime = 0;
            let duration = 0;
            
            // Track FPS
            let frameCount = 0;
            let lastFpsTime = 0;
            let fps = 0;
            
            // Initialize mouse position tracking
            let mouseX = canvas.width / 2;
            let mouseY = canvas.height / 2;
            
            // Add mouse event listeners
            canvas.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                mouseX = event.clientX - rect.left;
                mouseY = event.clientY - rect.top;
            });
            
            canvas.addEventListener('mouseout', () => {
                mouseX = canvas.width / 2;
                mouseY = canvas.height / 2;
            });
            
            // Define global properties for the user's script
            const width = canvas.width;
            const height = canvas.height;
            
            // Current audio element
            let currentAudioElement = null;
            
            // Audio analysis variables
            let audioContext = null;
            let audioSource = null;
            let analyser = null;
            let frequencyData = null;
            let waveformData = null;
            
            // Initialize 3D system
            let camera = {
                position: { x: 0, y: 0, z: -500 },
                target: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 1, z: 0 },
                fov: 75,
                near: 0.1,
                far: 10000,
                zoom: 1
            };
            
            let projectionMatrix = null;
            let points3D = [];
            let lineRenderQueue = [];
            let depthBuffer = null;
            
            // Initialize depth buffer
            function initDepthBuffer() {
                depthBuffer = {
                    width: canvas.width,
                    height: canvas.height,
                    data: new Float32Array(canvas.width * canvas.height),
                    clear: function() {
                        this.data.fill(Infinity);
                    }
                };
                depthBuffer.clear();
            }
            
            // Initialize 3D system
            initDepthBuffer();
            updateProjectionMatrix();
            
            // Set up audio context and analyzer
            function setupAudio() {
                if (!currentAudioElement) return false;
                
                try {
                    if (!audioContext) {
                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        analyser = audioContext.createAnalyser();
                        analyser.fftSize = 2048;
                        
                        audioSource = audioContext.createMediaElementSource(currentAudioElement);
                        audioSource.connect(analyser);
                        analyser.connect(audioContext.destination);
                        
                        frequencyData = new Uint8Array(analyser.frequencyBinCount);
                        waveformData = new Uint8Array(analyser.frequencyBinCount);
                        
                        return true;
                    }
                    return audioContext.state === 'running';
                } catch (e) {
                    console.error('Error setting up audio:', e);
                    return false;
                }
            }
            
            // Update projection matrix based on canvas dimensions and camera properties
            function updateProjectionMatrix() {
                const aspect = canvas.width / canvas.height;
                const fovRad = camera.fov * Math.PI / 180;
                
                projectionMatrix = {
                    fov: fovRad,
                    aspect: aspect,
                    near: camera.near,
                    far: camera.far
                };
            }
            
            // Project a 3D point to 2D screen coordinates
            function projectPoint(point) {
                // Vector from camera to point
                const dx = point.x - camera.position.x;
                const dy = point.y - camera.position.y;
                const dz = point.z - camera.position.z;
                
                // Convert camera space to view direction
                const camForward = {
                    x: camera.target.x - camera.position.x,
                    y: camera.target.y - camera.position.y,
                    z: camera.target.z - camera.position.z
                };
                
                // Normalize forward vector
                const forwardLen = Math.sqrt(camForward.x*camForward.x + camForward.y*camForward.y + camForward.z*camForward.z);
                if (forwardLen > 0) {
                    camForward.x /= forwardLen;
                    camForward.y /= forwardLen;
                    camForward.z /= forwardLen;
                }
                
                // Dot product to determine if point is in front or behind camera
                const dotProduct = dx * camForward.x + dy * camForward.y + dz * camForward.z;
                const behind = dotProduct <= camera.near;
                
                // Apply perspective transformation
                const fov = projectionMatrix.fov;
                const scale = camera.zoom / Math.tan(fov / 2);
                
                let x, y;
                
                if (behind) {
                    // If behind camera, project at a far distance behind the view
                    const invDot = -dotProduct + camera.near * 2;
                    x = width / 2 - (dx / invDot) * scale * height;
                    y = height / 2 - (dy / invDot) * scale * height;
                } else {
                    // Regular perspective projection
                    x = width / 2 + (dx / dotProduct) * scale * height;
                    y = height / 2 + (dy / dotProduct) * scale * height;
                }
                
                // Determine visibility (more generous bounds for line clipping)
                const extendedWidth = width * 3;
                const extendedHeight = height * 3;
                const visible = !behind && 
                               dotProduct < camera.far &&
                               x > -extendedWidth && x < width + extendedWidth &&
                               y > -extendedHeight && y < height + extendedHeight;
                
                return { x, y, z: dotProduct, visible };
            }
            
            // Audio frequency analysis function for the script
            function getAudioFrequency(targetFreq) {
                if (!analyser || !isPlaying) return 0;
                
                try {
                    analyser.getByteFrequencyData(frequencyData);
                    const nyquist = audioContext.sampleRate / 2;
                    const index = Math.round((targetFreq / nyquist) * frequencyData.length);
                    
                    if (index >= 0 && index < frequencyData.length) {
                        return frequencyData[index] / 255;
                    }
                } catch (e) {
                    console.warn('Error getting audio frequency:', e);
                }
                return 0;
            }
            
            // 3D Functions
            function cameraPosition(x, y, z) {
                camera.position.x = x;
                camera.position.y = y;
                camera.position.z = z;
            }
            
            function cameraLookAt(x, y, z) {
                camera.target.x = x;
                camera.target.y = y;
                camera.target.z = z;
            }
            
            function cameraFov(degrees) {
                camera.fov = Math.max(1, Math.min(180, degrees));
                updateProjectionMatrix();
            }
            
            function cameraZoom(factor) {
                camera.zoom = Math.max(0.1, factor);
            }
            
            function point3D(x, y, z, size = 3, color = null) {
                const point = { x, y, z, size, color };
                points3D.push(point);
                return point;
            }
            
            function clear3D() {
                points3D = [];
                lineRenderQueue = [];
                
                if (depthBuffer) {
                    depthBuffer.clear();
                }
            }
            
            function line3D(point1, point2, color = null, lineWidth = 1) {
                const proj1 = projectPoint(point1);
                const proj2 = projectPoint(point2);
                
                // Check if both points are behind the camera
                const bothBehind = (proj1.z <= camera.near && proj2.z <= camera.near);
                if (bothBehind) return;
                
                // Calculate viewport dimensions
                const viewWidth = canvas.width;
                const viewHeight = canvas.height;
                
                // Check if line is completely outside view with generous bounds
                const buffer = Math.max(viewWidth, viewHeight) * 1.5;
                const completelyOutside = (
                    (proj1.x < -buffer && proj2.x < -buffer) ||
                    (proj1.x > viewWidth + buffer && proj2.x > viewWidth + buffer) ||
                    (proj1.y < -buffer && proj2.y < -buffer) ||
                    (proj1.y > viewHeight + buffer && proj2.y > viewHeight + buffer)
                );
                
                if (completelyOutside) return;
                
                // Calculate average z depth for sorting
                const avgZ = (proj1.z + proj2.z) / 2;
                
                // Store line for later drawing with depth sorting
                lineRenderQueue.push({
                    type: 'line',
                    point1: proj1,
                    point2: proj2,
                    color: color,
                    lineWidth: lineWidth,
                    z: avgZ
                });
            }
            
            function drawPoints3D() {
                // Sort points by z-depth (far to near)
                const sortedPoints = [...points3D].sort((a, b) => {
                    const projA = projectPoint(a);
                    const projB = projectPoint(b);
                    return projB.z - projA.z;
                });
                
                // Draw points with depth testing
                ctx.save();
                for (const point of sortedPoints) {
                    const projected = projectPoint(point);
                    
                    if (projected.visible) {
                        // Calculate size based on z-distance
                        const size = point.size * (camera.far / (projected.z + camera.near));
                        
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
            
            function drawLine3D(lineItem) {
                const { point1, point2, color, lineWidth } = lineItem;
                
                ctx.save();
                
                if (color) ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                
                ctx.beginPath();
                ctx.moveTo(point1.x, point1.y);
                ctx.lineTo(point2.x, point2.y);
                ctx.stroke();
                
                ctx.restore();
            }
            
            function processRenderQueue() {
                if (lineRenderQueue.length === 0) return;
                
                // Sort by depth, far to near
                lineRenderQueue.sort((a, b) => b.z - a.z);
                
                // Draw in sorted order
                for (const item of lineRenderQueue) {
                    drawLine3D(item);
                }
                
                // Clear queue after drawing
                lineRenderQueue = [];
            }
            
            function draw3D() {
                // Draw all points with depth testing
                drawPoints3D();
                
                // Process and draw all lines and other 3D objects
                processRenderQueue();
            }
            
            function grid3D(size = 100, divisions = 10, colorMajor = '#444444', colorMinor = '#222222') {
                const halfSize = size / 2;
                const step = size / divisions;
                
                // Create grid lines
                for (let i = -halfSize; i <= halfSize; i += step) {
                    const isMajor = Math.abs(i) < 0.001 || Math.abs(Math.abs(i) - halfSize) < 0.001;
                    const color = isMajor ? colorMajor : colorMinor;
                    
                    // X-axis grid lines
                    const p1x = { x: -halfSize, y: 0, z: i };
                    const p2x = { x: halfSize, y: 0, z: i };
                    line3D(p1x, p2x, color, isMajor ? 1.5 : 0.5);
                    
                    // Z-axis grid lines
                    const p1z = { x: i, y: 0, z: -halfSize };
                    const p2z = { x: i, y: 0, z: halfSize };
                    line3D(p1z, p2z, color, isMajor ? 1.5 : 0.5);
                }
            }
            
            function axes3D(size = 100) {
                const origin = { x: 0, y: 0, z: 0 };
                
                // X-axis (red)
                const xAxis = { x: size, y: 0, z: 0 };
                line3D(origin, xAxis, '#FF0000', 2);
                
                // Y-axis (green)
                const yAxis = { x: 0, y: size, z: 0 };
                line3D(origin, yAxis, '#00FF00', 2);
                
                // Z-axis (blue)
                const zAxis = { x: 0, y: 0, z: size };
                line3D(origin, zAxis, '#0000FF', 2);
            }
            
            function cube3D(x = 0, y = 0, z = 0, size = 100, color = '#FFFFFF', wireframe = true) {
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
                        line3D(vertices[i], vertices[j], color, 1);
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
                            x: camera.position.x - center.x,
                            y: camera.position.y - center.y,
                            z: camera.position.z - center.z
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
                            const shadedColor = \`rgb(\${Math.floor(r * dotProduct)}, \${Math.floor(g * dotProduct)}, \${Math.floor(b * dotProduct)})\`;
                            
                            // Draw the outlines
                            for (let i = 0; i < faceVertices.length; i++) {
                                const j = (i + 1) % faceVertices.length;
                                line3D(faceVertices[i], faceVertices[j], shadedColor, 1);
                            }
                        }
                    }
                }
            }
            
            function sphere3D(x = 0, y = 0, z = 0, radius = 50, detail = 15, color = '#FFFFFF') {
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
                        point3D(px, py, pz, 1, color);
                    }
                }
            }
            
            function orbitCamera(angleX, angleY, distance) {
                // Convert angles to radians
                const radX = (angleX % 360) * Math.PI / 180;
                const radY = Math.max(-85, Math.min(85, angleY)) * Math.PI / 180;
                
                // Calculate new position based on spherical coordinates
                const x = camera.target.x + distance * Math.sin(radX) * Math.cos(radY);
                const y = camera.target.y + distance * Math.sin(radY);
                const z = camera.target.z + distance * Math.cos(radX) * Math.cos(radY);
                
                // Update camera position
                camera.position.x = x;
                camera.position.y = y;
                camera.position.z = z;
                
                // Update projection matrix after camera movement
                updateProjectionMatrix();
            }
            
            // Drawing functions
            function background(r, g, b) {
                ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            function clear() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            function circle(x, y, radius, outline = false) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                if (outline) {
                    ctx.stroke();
                } else {
                    ctx.fill();
                }
            }
            
            function rect(x, y, width, height, outline = false) {
                if (outline) {
                    ctx.strokeRect(x, y, width, height);
                } else {
                    ctx.fillRect(x, y, width, height);
                }
            }
            
            function line(x1, y1, x2, y2) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            function fill(r, g, b, a = 1) {
                ctx.fillStyle = \`rgba(\${r}, \${g}, \${b}, \${a})\`;
            }
            
            function stroke(r, g, b, a = 1) {
                ctx.strokeStyle = \`rgba(\${r}, \${g}, \${b}, \${a})\`;
            }
            
            function lineWidth(width) {
                ctx.lineWidth = width;
            }
            
            function text(content, x, y, size = 16, font = "Arial", align = "left", color = null) {
                const prevFont = ctx.font;
                const prevAlign = ctx.textAlign;
                const prevBaseline = ctx.textBaseline;
                const prevFillStyle = ctx.fillStyle;
                
                ctx.font = \`\${size}px \${font}\`;
                ctx.textAlign = align;
                ctx.textBaseline = "middle";
                
                if (color) {
                    ctx.fillStyle = color;
                }
                
                ctx.fillText(content, x, y);
                
                ctx.font = prevFont;
                ctx.textAlign = prevAlign;
                ctx.textBaseline = prevBaseline;
                ctx.fillStyle = prevFillStyle;
            }
            
            // Image handling functions
            function loadImage(path) {
                try {
                    const img = new Image();
                    img.src = path;
                    return img;
                } catch (e) {
                    console.error('Error loading image:', e);
                    return null;
                }
            }
            
            function drawImage(img, x, y, width, height) {
                if (!img) return;
                
                try {
                    if (width && height) {
                        ctx.drawImage(img, x, y, width, height);
                    } else {
                        ctx.drawImage(img, x, y);
                    }
                } catch (e) {
                    console.error('Error drawing image:', e);
                }
            }
            
            // Audio functions
            function loadAudio(path) {
                // Stop any currently playing audio
                if (currentAudioElement) {
                    currentAudioElement.pause();
                    currentAudioElement = null;
                }
                
                // Create a new audio element
                currentAudioElement = new Audio();
                currentAudioElement.src = path;
                
                // Set volume from slider value
                currentAudioElement.volume = volumeSlider.value;
                
                // Update duration when metadata is loaded
                currentAudioElement.addEventListener('loadedmetadata', function() {
                    duration = currentAudioElement.duration || 0;
                    updateProgress(0);
                    console.log('Audio loaded, duration:', duration);
                });
                
                return true;
            }
            
            function playAudio() {
                if (currentAudioElement) {
                    // Initialize audio context for analysis if not done already
                    setupAudio();
                    
                    currentAudioElement.play().catch(e => console.warn('Play error:', e));
                    return true;
                }
                return false;
            }
            
            function pauseAudio() {
                if (currentAudioElement) {
                    currentAudioElement.pause();
                    return true;
                }
                return false;
            }
            
            function stopAudio() {
                if (currentAudioElement) {
                    currentAudioElement.pause();
                    currentAudioElement.currentTime = 0;
                    return true;
                }
                return false;
            }
            
            // Utility
            function log(message) {
                console.log(message);
            }
            
            // Add FPS counter
            function getFps() {
                return fps;
            }
            
            function updateFps(timestamp) {
                if (!lastFpsTime) {
                    lastFpsTime = timestamp;
                    frameCount = 0;
                    return;
                }
                
                frameCount++;
                
                const elapsed = timestamp - lastFpsTime;
                if (elapsed >= 1000) {
                    fps = Math.round((frameCount * 1000) / elapsed);
                    frameCount = 0;
                    lastFpsTime = timestamp;
                }
            }

            // Add basic audio visualizer for the script
            function visualBar(x, y, width, height, barCount, spacing = 2, minHeight = 5, rotation = 0, mirror = false) {
                if (!analyser || !isPlaying) return;
                
                try {
                    // Update frequency data
                    analyser.getByteFrequencyData(frequencyData);
                    
                    // Save the current context state
                    ctx.save();
                    
                    // Move to the center point and apply rotation
                    ctx.translate(x, y);
                    ctx.rotate(rotation * Math.PI / 180);
                    
                    // Calculate bar width
                    const barWidth = (width - (barCount - 1) * spacing) / barCount;
                    
                    // Draw bars
                    for (let i = 0; i < barCount; i++) {
                        // Map frequency data to the bar's height
                        const index = Math.floor(i / barCount * (frequencyData.length / 2));
                        const value = frequencyData[index] / 255;
                        const barHeight = Math.max(minHeight, value * height);
                        
                        // Calculate x position
                        const barX = (i * (barWidth + spacing)) - width / 2;
                        
                        // Draw the bar
                        ctx.fillRect(barX, -barHeight / 2, barWidth, barHeight);
                        
                        // If mirror is true, draw a mirrored bar below
                        if (mirror) {
                            ctx.fillRect(barX, barHeight / 2, barWidth, -barHeight);
                        }
                    }
                    
                    // Restore context
                    ctx.restore();
                } catch (e) {
                    console.warn('Error drawing visualizer:', e);
                }
            }
            
            // Waveform visualizer
            function visualWaveform(x, y, width, height, detail = 100, lineWidth = 2) {
                if (!analyser || !isPlaying) return;
                
                try {
                    analyser.getByteTimeDomainData(waveformData);
                    
                    ctx.save();
                    
                    // Set line width
                    ctx.lineWidth = lineWidth;
                    
                    // Begin path
                    ctx.beginPath();
                    
                    const sliceWidth = width / detail;
                    let xPos = x;
                    
                    // Start at the first data point
                    ctx.moveTo(x, y + (waveformData[0] / 128.0 - 1) * height / 2);
                    
                    // Loop through the waveform data and draw the line
                    for (let i = 1; i < detail; i++) {
                        const index = Math.floor(i / detail * waveformData.length);
                        const v = waveformData[index] / 128.0;
                        const yPos = y + (v - 1) * height / 2;
                        
                        ctx.lineTo(xPos, yPos);
                        xPos += sliceWidth;
                    }
                    
                    ctx.stroke();
                    ctx.restore();
                } catch (e) {
                    console.warn('Error drawing waveform:', e);
                }
            }
            
            // Circular visualizer
            function visualCircular(x, y, minRadius, maxRadius, pointCount, freqStart = 20, freqEnd = 2000, rotation = 0) {
                if (!analyser || !isPlaying) return;
                
                try {
                    analyser.getByteFrequencyData(frequencyData);
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotation * Math.PI / 180);
                    
                    const angleStep = (Math.PI * 2) / pointCount;
                    
                    ctx.beginPath();
                    for (let i = 0; i < pointCount; i++) {
                        const freqIndex = Math.floor((i / pointCount) * (frequencyData.length / 2));
                        const value = frequencyData[freqIndex] / 255;
                        
                        const radius = minRadius + (value * (maxRadius - minRadius));
                        const angle = i * angleStep;
                        
                        const xPoint = Math.cos(angle) * radius;
                        const yPoint = Math.sin(angle) * radius;
                        
                        if (i === 0) {
                            ctx.moveTo(xPoint, yPoint);
                        } else {
                            ctx.lineTo(xPoint, yPoint);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                } catch (e) {
                    console.warn('Error drawing circular visualizer:', e);
                }
            }
            
            // Your script code
            ${scriptCode.replace(/(\r\n|\n|\r)/gm, "\n            ")}
            
            // Global script variables
            let setupExecuted = false;
            
            // Animation loop
            function animate(timestamp) {
                if (!isPlaying) return;
                
                // Update FPS counter
                updateFps(timestamp);
                
                const currentTime = (Date.now() - startTime) / 1000;
                
                // Check if we're past duration (if defined)
                if (duration > 0 && currentTime > duration) {
                    pause();
                    return;
                }
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Clear 3D buffers
                clear3D();
                
                // Run setup once if it exists and hasn't been executed
                if (typeof setup === 'function' && !setupExecuted) {
                    try {
                        setup();
                        setupExecuted = true;
                    } catch (error) {
                        console.error('Error in setup function:', error);
                    }
                }
                
                // Call user's draw function if it exists
                if (typeof draw === 'function') {
                    try {
                        draw(currentTime);
                    } catch (error) {
                        console.error('Error in draw function:', error);
                        pause();
                    }
                }
                
                // Render 3D objects after all drawing
                draw3D();
                
                // Update progress
                updateProgress(currentTime);
                
                // Request next frame
                animationFrame = requestAnimationFrame(animate);
            }
            
            // Control functions
            function play() {
                if (isPlaying) return;
                
                // Initialize audio context if needed
                if (currentAudioElement && !audioContext) {
                    setupAudio();
                }
                
                if (pauseTime > 0) {
                    // Resume from pause
                    startTime = Date.now() - (pauseTime * 1000);
                    pauseTime = 0;
                } else {
                    // Start from beginning
                    startTime = Date.now();
                    setupExecuted = false;
                    
                    // Reset audio if it's there
                    if (currentAudioElement) {
                        currentAudioElement.currentTime = 0;
                    }
                }
                
                isPlaying = true;
                playBtn.classList.add('playing');
                animationFrame = requestAnimationFrame(animate);
                
                // Play audio if available
                if (currentAudioElement) {
                    // Use a promise to handle autoplay restrictions
                    currentAudioElement.play()
                        .then(() => console.log('Audio playback started'))
                        .catch(e => {
                            console.warn('Autoplay prevented:', e);
                            // Continue with animation but without audio
                        });
                }
                
                // Resume audio context if suspended (needed for Chrome autoplay policy)
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume()
                        .then(() => console.log('AudioContext resumed'))
                        .catch(e => console.warn('Error resuming AudioContext:', e));
                }
            }
            
            function pause() {
                if (!isPlaying) return;
                
                isPlaying = false;
                playBtn.classList.remove('playing');
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                // Store current time for resume
                pauseTime = (Date.now() - startTime) / 1000;
                
                // Pause audio if available
                if (currentAudioElement) {
                    currentAudioElement.pause();
                }
            }
            
            function stop() {
                isPlaying = false;
                playBtn.classList.remove('playing');
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                // Reset time
                startTime = 0;
                pauseTime = 0;
                
                // Reset progress
                updateProgress(0);
                
                // Stop audio
                if (currentAudioElement) {
                    currentAudioElement.pause();
                    currentAudioElement.currentTime = 0;
                }
                
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Reset execution state
                setupExecuted = false;
                
                // Clear 3D
                clear3D();
                
                // Run setup again
                if (typeof setup === 'function') {
                    try {
                        setup();
                        setupExecuted = true;
                    } catch (error) {
                        console.error('Error in setup function:', error);
                    }
                }
            }
            
            function updateProgress(currentTime) {
                // Format time display
                const formattedTime = formatTime(currentTime);
                const formattedDuration = formatTime(duration > 0 ? duration : (currentAudioElement && currentAudioElement.duration ? currentAudioElement.duration : 0));
                
                timeDisplay.textContent = formattedTime + ' / ' + formattedDuration;
                
                // Update progress bar
                if (duration > 0) {
                    const progress = Math.min(100, (currentTime / duration) * 100);
                    progressBar.style.width = progress + '%';
                } else if (currentAudioElement && currentAudioElement.duration) {
                    const progress = Math.min(100, (currentTime / currentAudioElement.duration) * 100);
                    progressBar.style.width = progress + '%';
                }
            }
            
            function formatTime(seconds) {
                if (isNaN(seconds) || seconds === Infinity) return '0:00';
                
                const min = Math.floor(seconds / 60);
                const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
                return \`\${min}:\${sec}\`;
            }
            
            function seekToPosition(event) {
                const rect = progressContainer.getBoundingClientRect();
                const pos = (event.clientX - rect.left) / rect.width;
                
                let seekTime;
                if (duration > 0) {
                    seekTime = pos * duration;
                } else if (currentAudioElement && currentAudioElement.duration) {
                    seekTime = pos * currentAudioElement.duration;
                } else {
                    return; // Can't seek without duration reference
                }
                
                // Update times
                if (isPlaying) {
                    startTime = Date.now() - (seekTime * 1000);
                } else {
                    pauseTime = seekTime;
                }
                
                // Seek audio if available
                if (currentAudioElement) {
                    currentAudioElement.currentTime = seekTime;
                }
                
                // Update display immediately
                updateProgress(seekTime);
            }
            
            function toggleVolume() {
                if (!currentAudioElement) return;
                
                if (currentAudioElement.volume > 0) {
                    volumeSlider.setAttribute('data-volume', currentAudioElement.volume);
                    currentAudioElement.volume = 0;
                    volumeBtn.classList.add('muted');
                } else {
                    const prevVolume = volumeSlider.getAttribute('data-volume') || 1;
                    currentAudioElement.volume = prevVolume;
                    volumeBtn.classList.remove('muted');
                }
            }
            
            function setVolume(value) {
                if (!currentAudioElement) return;
                currentAudioElement.volume = value;
                if (value > 0) {
                    volumeBtn.classList.remove('muted');
                } else {
                    volumeBtn.classList.add('muted');
                }
            }
            
            function toggleFullscreen() {
                const container = document.getElementById(playerId);
                
                if (!document.fullscreenElement) {
                    if (container.requestFullscreen) {
                        container.requestFullscreen();
                    } else if (container.webkitRequestFullscreen) {
                        container.webkitRequestFullscreen();
                    } else if (container.msRequestFullscreen) {
                        container.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            }
            
            // Set up event listeners
            playBtn.addEventListener('click', () => {
                if (isPlaying) {
                    pause();
                } else {
                    play();
                }
            });
            
            stopBtn.addEventListener('click', stop);
            
            progressContainer.addEventListener('click', seekToPosition);
            
            volumeBtn.addEventListener('click', toggleVolume);
            
            volumeSlider.addEventListener('input', (e) => {
                setVolume(parseFloat(e.target.value));
            });
            
            fullscreenBtn.addEventListener('click', toggleFullscreen);
            
            // Handle window resize to maintain aspect ratio
            window.addEventListener('resize', () => {
                const container = document.querySelector('.player-container');
                if (!container) return;
                
                // Calculate the scale
                const maxWidth = window.innerWidth;
                const maxHeight = window.innerHeight;
                
                const scale = Math.min(
                    maxWidth / container.offsetWidth,
                    maxHeight / container.offsetHeight
                );
                
                if (scale < 1) {
                    container.style.transform = \`scale(\${scale})\`;
                    container.style.transformOrigin = 'top';
                } else {
                    container.style.transform = '';
                }
            });
            
            // Initialize the player
            if (typeof setup === 'function') {
                try {
                    setup();
                    setupExecuted = true;
                } catch (error) {
                    console.error('Error in setup function:', error);
                }
            }
            
            // Wait a moment, then auto-play if possible
            setTimeout(() => {
                // Try to play, but handle autoplay restrictions
                play();
            }, 500);
            
            // If there's audio, link its duration to the animation
            if (currentAudioElement) {
                currentAudioElement.addEventListener('durationchange', function() {
                    // If duration isn't already set from script, use audio duration
                    if (!duration) {
                        duration = currentAudioElement.duration;
                        updateProgress(0);
                    }
                });
                
                // Sync animation with audio if it's playing
                currentAudioElement.addEventListener('timeupdate', function() {
                    if (isPlaying && Math.abs((Date.now() - startTime) / 1000 - currentAudioElement.currentTime) > 0.3) {
                        // If audio and animation are out of sync by more than 300ms, resynch them
                        startTime = Date.now() - (currentAudioElement.currentTime * 1000);
                    }
                });
                
                currentAudioElement.addEventListener('ended', function() {
                    if (isPlaying) {
                        if (Math.abs(currentAudioElement.duration - currentAudioElement.currentTime) < 0.1) {
                            pause();
                            pauseTime = 0; // Reset to beginning on next play
                        }
                    }
                });
            }
            
            // Make global functions available to the script
            window.width = width;
            window.height = height;
            window.background = background;
            window.clear = clear;
            window.circle = circle;
            window.rect = rect;
            window.line = line;
            window.fill = fill;
            window.stroke = stroke;
            window.lineWidth = lineWidth;
            window.text = text;
            window.loadImage = loadImage;
            window.drawImage = drawImage;
            window.loadAudio = loadAudio;
            window.playAudio = playAudio;
            window.pauseAudio = pauseAudio;
            window.stopAudio = stopAudio;
            window.getAudioFrequency = getAudioFrequency;
            window.log = log;
            window.mouseX = () => mouseX;
            window.mouseY = () => mouseY;
            window.getFps = getFps;
            
            // Audio visualizers
            window.visualBar = visualBar;
            window.visualWaveform = visualWaveform;
            window.visualCircular = visualCircular;
            
            // 3D functions
            window.cameraPosition = cameraPosition;
            window.cameraLookAt = cameraLookAt;
            window.cameraFov = cameraFov;
            window.cameraZoom = cameraZoom;
            window.point3D = point3D;
            window.clear3D = clear3D;
            window.line3D = line3D;
            window.draw3D = draw3D;
            window.grid3D = grid3D;
            window.axes3D = axes3D;
            window.cube3D = cube3D;
            window.sphere3D = sphere3D;
            window.orbitCamera = orbitCamera;
            
            // Document these available functions
            console.log("KaleidoScript Player initialized with the following functions:");
            console.log("- 2D Drawing: background, clear, circle, rect, line, fill, stroke, lineWidth, text");
            console.log("- Images: loadImage, drawImage");
            console.log("- Audio: loadAudio, playAudio, pauseAudio, stopAudio, getAudioFrequency");
            console.log("- Audio Visualizers: visualBar, visualWaveform, visualCircular");
            console.log("- 3D: cameraPosition, cameraLookAt, cameraFov, cameraZoom, point3D, line3D, draw3D, grid3D, axes3D, cube3D, sphere3D, orbitCamera");
            console.log("- Utilities: log, mouseX, mouseY, getFps");
        })();
    </script>
</body>
</html>`;
}

/**
 * Helper function to escape special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper function to escape special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



/**
 * Collect all assets referenced in the script with better error handling
 * @param {string} scriptCode - The user's script
 * @param {Object} assets - Object to store found assets
 * @returns {Promise} - Resolves when all assets are collected
 */
function collectAssets(scriptCode, assets) {
    // Handle empty arrays case
    if (!Array.isArray(assets.audio)) assets.audio = [];
    if (!Array.isArray(assets.images)) assets.images = [];
    
    // Also collect any current audio that might be playing
    if (window.audioProcessor && window.audioProcessor.audioElement &&
        window.audioProcessor.audioElement.src && window.audioProcessor.audioData?.name) {
        
        const audioInfo = {
            name: window.audioProcessor.audioData.name,
            url: window.audioProcessor.audioElement.src
        };
        
        // Only add if not already in the list
        if (!assets.audio.some(a => a.name === audioInfo.name)) {
            assets.audio.push(audioInfo);
        }
    }
    
    // Extract audio files
    const audioPromise = collectAudioAssets(scriptCode, assets.audio);
    
    // Extract image files
    const imagePromise = collectImageAssets(scriptCode, assets.images);
    
    // Return promise that resolves when all assets are collected
    return Promise.all([audioPromise, imagePromise])
        .catch(error => {
            console.error('Error collecting assets:', error);
            window.logToConsole('Warning: Some assets may not have been collected properly', 'warning');
            // Continue the export process anyway
            return assets;
        });
}

/**
 * Collect audio assets referenced in the script
 * @param {string} scriptCode - The user's script
 * @param {Array} audioAssets - Array to store found audio assets
 * @returns {Promise} - Resolves when audio assets are collected
 */
function collectAudioAssets(scriptCode, audioAssets) {
    return new Promise((resolve) => {
        // Look for loadAudio calls: loadAudio("filename.mp3") or loadAudio('filename.mp3')
        const loadAudioRegex = /loadAudio\s*\(\s*["']([^"']+)["']\s*\)/g;
        const audioNames = new Set();
        
        // Find all loadAudio calls
        let match;
        while ((match = loadAudioRegex.exec(scriptCode)) !== null) {
            audioNames.add(match[1]);
        }
        
        // Also add current audio if playing
        if (window.audioProcessor && 
            window.audioProcessor.audioElement && 
            window.audioProcessor.audioElement.src && 
            window.audioProcessor.audioData?.name) {
            audioNames.add(window.audioProcessor.audioData.name);
        }
        
        // For each audio name, find the audio source
        const promises = Array.from(audioNames).map(name => {
            return findAudioSource(name)
                .then(url => {
                    if (url) {
                        audioAssets.push({
                            name: name,
                            url: url
                        });
                    }
                })
                .catch(error => {
                    console.warn(`Could not find audio ${name}:`, error);
                });
        });
        
        Promise.all(promises).then(() => resolve());
    });
}

/**
 * Collect image assets referenced in the script
 * @param {string} scriptCode - The user's script
 * @param {Array} imageAssets - Array to store found image assets
 * @returns {Promise} - Resolves when image assets are collected
 */
function collectImageAssets(scriptCode, imageAssets) {
    return new Promise((resolve) => {
        // Look for loadImage calls: loadImage("filename.jpg") or loadImage('filename.jpg')
        const loadImageRegex = /loadImage\s*\(\s*["']([^"']+)["']\s*\)/g;
        const imageNames = new Set();
        
        // Find all loadImage calls
        let match;
        while ((match = loadImageRegex.exec(scriptCode)) !== null) {
            imageNames.add(match[1]);
        }
        
        // For each image name, find the image source
        const promises = Array.from(imageNames).map(name => {
            return findImageSource(name)
                .then(url => {
                    if (url) {
                        imageAssets.push({
                            name: name,
                            url: url
                        });
                    }
                })
                .catch(error => {
                    console.warn(`Could not find image ${name}:`, error);
                });
        });
        
        Promise.all(promises).then(() => resolve());
    });
}

/**
 * Get audio data as a data URI for embedding
 * @param {string} audioName - The audio file name
 * @returns {string|null} - Data URI or null if not found
 */
function getAudioDataForEmbed(audioName) {
    // First try to get from audioProcessor
    if (window.audioProcessor && window.audioProcessor.audioFiles) {
        const audioUrl = window.audioProcessor.audioFiles[audioName];
        
        if (audioUrl) {
            // If it's already a data URI, return it directly
            if (audioUrl.startsWith('data:')) {
                return audioUrl;
            }
            
            // If it's a blob URL, we need to convert it to a data URI
            if (audioUrl.startsWith('blob:')) {
                // Try to fetch the audio element's src
                if (window.audioProcessor.audioElement && 
                    window.audioProcessor.audioData?.name === audioName) {
                    return convertAudioElementToDataUri(window.audioProcessor.audioElement);
                }
            }
        }
    }
    
    // Then try the audio list in the DOM
    const audioList = document.querySelector('.audio-list');
    if (audioList) {
        const audioItem = Array.from(audioList.querySelectorAll('.audio-item'))
            .find(item => item.dataset.filename === audioName);
        
        if (audioItem) {
            // Try to find a play button and extract the URL
            const playBtn = audioItem.querySelector('button[title="Play"]');
            if (playBtn && playBtn.onclick) {
                // Unfortunately we can't directly extract the source from the onclick function
                // Instead, try the audio preview element
                const audioPreview = document.getElementById('audio-preview');
                if (audioPreview) {
                    return convertAudioElementToDataUri(audioPreview);
                }
            }
        }
    }
    
    // Try the interpreter's audio files
    if (window.interpreter && window.interpreter.audioFiles) {
        const audioUrl = window.interpreter.audioFiles[audioName];
        
        if (audioUrl) {
            // If it's already a data URI, return it directly
            if (audioUrl.startsWith('data:')) {
                return audioUrl;
            }
            
            // If it's a blob URL, try to fetch it
            if (audioUrl.startsWith('blob:')) {
                return fetchBlobAsDataUri(audioUrl);
            }
        }
    }
    
    return null;
}

/**
 * Get image data as a data URI for embedding
 * @param {string} imageName - The image file name
 * @returns {string|null} - Data URI or null if not found
 */
function getImageDataForEmbed(imageName) {
    // First try to get from imageProcessor
    if (window.imageProcessor && window.imageProcessor.images) {
        const imageUrl = window.imageProcessor.images[imageName];
        
        if (imageUrl) {
            // If it's already a data URI, return it directly
            if (imageUrl.startsWith('data:')) {
                return imageUrl;
            }
            
            // If it's a blob URL, try to fetch it
            if (imageUrl.startsWith('blob:')) {
                return fetchBlobAsDataUri(imageUrl);
            }
        }
    }
    
    // Then try the image list in the DOM
    const imageList = document.querySelector('.image-list');
    if (imageList) {
        const imageItems = imageList.querySelectorAll('.image-item');
        
        for (const imageItem of imageItems) {
            const nameElement = imageItem.querySelector('.image-name');
            
            if (nameElement && nameElement.textContent === imageName) {
                const img = imageItem.querySelector('img');
                if (img && img.src) {
                    return img.src; // This is typically already a data URI
                }
            }
        }
    }
    
    // Try the interpreter's image files
    if (window.interpreter && window.interpreter.imageFiles) {
        const imageUrl = window.interpreter.imageFiles[imageName];
        
        if (imageUrl) {
            // If it's already a data URI, return it directly
            if (imageUrl.startsWith('data:')) {
                return imageUrl;
            }
            
            // If it's a blob URL, try to fetch it
            if (imageUrl.startsWith('blob:')) {
                return fetchBlobAsDataUri(imageUrl);
            }
        }
    }
    
    return null;
}

/**
 * Convert audio element to data URI
 * @param {HTMLAudioElement} audioElement - The audio element
 * @returns {Promise<string>} - Data URI
 */
function convertAudioElementToDataUri(audioElement) {
    return new Promise((resolve, reject) => {
        try {
            if (!audioElement || !audioElement.src) {
                reject(new Error('No audio element or source found'));
                return;
            }
            
            // If it's already a data URI, return it directly
            if (audioElement.src.startsWith('data:')) {
                resolve(audioElement.src);
                return;
            }
            
            // If it's a blob URL, fetch the blob and convert to data URI
            if (audioElement.src.startsWith('blob:')) {
                return fetchBlobAsDataUri(audioElement.src)
                    .then(resolve)
                    .catch(reject);
            }
            
            // Otherwise, it's a regular URL, so fetch it
            fetch(audioElement.src)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Fetch a blob URL and convert to data URI
 * @param {string} blobUrl - The blob URL
 * @returns {Promise<string>} - Data URI
 */
function fetchBlobAsDataUri(blobUrl) {
    return new Promise((resolve, reject) => {
        try {
            fetch(blobUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension
 */
function getFileExtensionFromName(filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return parts.pop().toLowerCase();
    }
    return '';
}

/**
 * Get a file from any type of source with improved error handling
 * @param {string|Blob} source - The source URL, data URI, or Blob
 * @returns {Promise<Blob>} - Resolves to a Blob
 */
function getFileFromSource(source) {
    return new Promise((resolve, reject) => {
        // If source is already a Blob or File, return it
        if (source instanceof Blob) {
            resolve(source);
            return;
        }
        
        // If source is null or undefined, reject
        if (!source) {
            reject(new Error('Invalid source: null or undefined'));
            return;
        }
        
        // If source is a data URI
        if (typeof source === 'string' && source.startsWith('data:')) {
            try {
                // Split the dataURI to get the base64 part
                const parts = source.split(',');
                if (parts.length < 2) {
                    reject(new Error('Invalid data URI format'));
                    return;
                }
                
                const binary = atob(parts[1]);
                const array = [];
                for (let i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                
                // Extract MIME type
                let mimeType = 'application/octet-stream';  // Default
                if (parts[0].includes('data:') && parts[0].includes(';')) {
                    mimeType = parts[0].split(':')[1].split(';')[0];
                }
                
                const blob = new Blob([new Uint8Array(array)], { type: mimeType });
                resolve(blob);
            } catch (e) {
                reject(new Error(`Invalid data URI: ${e.message}`));
            }
            return;
        }
        
        // If source is a URL, fetch it
        if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('blob:'))) {
            // Handle CORS issues by using a fallback approach
            fetch(source)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(resolve)
                .catch(error => {
                    console.warn('Fetch error, trying alternative approach:', error);
                    
                    // For blob URLs, try another approach
                    if (source.startsWith('blob:')) {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = function() {
                            // Create a canvas to draw the image
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            
                            // Draw the image to canvas
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            
                            // Convert to blob
                            canvas.toBlob(blob => {
                                if (blob) resolve(blob);
                                else reject(new Error('Failed to create blob from image'));
                            });
                        };
                        img.onerror = () => reject(new Error('Failed to load image from blob URL'));
                        img.src = source;
                    } else {
                        reject(error);
                    }
                });
            return;
        }
        
        reject(new Error('Invalid source type'));
    });
}

/**
 * Ensure filename has an extension
 * @param {string} filename - The filename
 * @param {string} defaultExt - The default extension to add if none exists
 * @returns {string} - The filename with extension
 */
function ensureFileExtension(filename, defaultExt) {
    if (!defaultExt) return filename;
    
    if (!filename.includes('.')) {
        return `${filename}.${defaultExt}`;
    }
    
    return filename;
}

/**
 * Find the source URL for an audio file
 * @param {string} name - Audio filename
 * @returns {Promise<string>} - Resolves to the audio URL
 */
function findAudioSource(name) {
    return new Promise((resolve, reject) => {
        // First check in audioProcessor
        if (window.audioProcessor && window.audioProcessor.audioFiles && window.audioProcessor.audioFiles[name]) {
            resolve(window.audioProcessor.audioFiles[name]);
            return;
        }
        
        // Then check in interpreter
        if (window.interpreter && window.interpreter.audioFiles && window.interpreter.audioFiles[name]) {
            resolve(window.interpreter.audioFiles[name]);
            return;
        }
        
        // Check DOM for audio with this name
        const audioItems = document.querySelectorAll('.audio-item');
        for (const item of audioItems) {
            if (item.dataset.filename === name) {
                // Found it in the DOM, now find the URL
                const playBtn = item.querySelector('button[title="Play"]');
                if (playBtn && playBtn.onclick) {
                    // Extract URL from onclick handler
                    const onclickStr = playBtn.onclick.toString();
                    const urlMatch = onclickStr.match(/audioPreview\.src\s*=\s*["']([^"']+)["']/);
                    if (urlMatch && urlMatch[1]) {
                        resolve(urlMatch[1]);
                        return;
                    }
                }
            }
        }
        
        // Check the audio preview element directly
        const audioPreview = document.getElementById('audio-preview');
        if (audioPreview && audioPreview.src && audioPreview.src !== 'about:blank') {
            resolve(audioPreview.src);
            return;
        }
        
        reject(new Error(`Could not find audio source for ${name}`));
    });
}

/**
 * Find the source URL for an image file
 * @param {string} name - Image filename
 * @returns {Promise<string>} - Resolves to the image URL
 */
function findImageSource(name) {
    return new Promise((resolve, reject) => {
        // First check if we have an imageProcessor with images
        if (window.imageProcessor && window.imageProcessor.images) {
            const imageUrl = window.imageProcessor.images[name];
            if (imageUrl) {
                resolve(imageUrl);
                return;
            }
        }
        
        // Check interpreter's image files
        if (window.interpreter && window.interpreter.imageFiles) {
            const imageUrl = window.interpreter.imageFiles[name];
            if (imageUrl) {
                resolve(imageUrl);
                return;
            }
        }
        
        // Check DOM for images with this name
        const imageItems = document.querySelectorAll('.image-item');
        for (const item of imageItems) {
            const nameElement = item.querySelector('.image-name');
            if (nameElement && nameElement.textContent === name) {
                const img = item.querySelector('img');
                if (img && img.src) {
                    resolve(img.src);
                    return;
                }
            }
        }
        
        reject(new Error(`Could not find image source for ${name}`));
    });
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} - The file extension
 */
function getFileExtensionFromMimeType(mimeType) {
    const mimeToExt = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/ogg': 'ogg',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'image/webp': 'webp'
    };
    
    return mimeToExt[mimeType] || '';
}

// Override the audio frequency method for video exports
(function patchAudioProcessorForExport() {
    // Execute immediately rather than waiting for window.load
    if (!window.audioProcessor) {
        console.log('No audio processor found, will attempt to patch later');
        // Set up a fallback to try again when the window loads
        window.addEventListener('load', () => {
            if (window.audioProcessor) patchAudioProcessor();
        });
        return;
    }
    
    patchAudioProcessor();
    
    function patchAudioProcessor() {
        console.log('Patching AudioProcessor for export compatibility');
        
        // Store the original methods
        const originalGetFrequency = window.audioProcessor.getAudioFrequency;
        const originalGetAudioData = window.audioProcessor.getAudioData;
        
        // Replace audio frequency method with our export-aware version
        window.audioProcessor.getAudioFrequency = function(targetFreq) {
            // Special handling for export mode
            if (this._exportAudioElement && this._exportAudioElement.currentTime > 0) {
                try {
                    // Create context and analyzer on demand if needed for export
                    if (!this._exportAudioContext) {
                        console.log('Creating export audio analyzer');
                        this._exportAudioContext = new AudioContext();
                        this._exportAnalyzer = this._exportAudioContext.createAnalyser();
                        this._exportAnalyzer.fftSize = 2048;
                        this._exportFrequencyData = new Uint8Array(this._exportAnalyzer.frequencyBinCount);
                        
                        // Connect export audio to analyzer
                        this._exportSource = this._exportAudioContext.createMediaElementSource(this._exportAudioElement);
                        this._exportSource.connect(this._exportAnalyzer);
                        this._exportSource.connect(this._exportAudioContext.destination);
                        console.log('Export audio analyzer setup complete');
                    }
                    
                    // Get frequency data from the export audio
                    this._exportAnalyzer.getByteFrequencyData(this._exportFrequencyData);
                    
                    // Map target frequency to index
                    const nyquist = this._exportAudioContext.sampleRate / 2;
                    const index = Math.round((targetFreq / nyquist) * this._exportFrequencyData.length);
                    
                    if (index >= 0 && index < this._exportFrequencyData.length) {
                        // Return normalized value (0-1)
                        return this._exportFrequencyData[index] / 255;
                    }
                } catch (err) {
                    console.warn('Error in export audio analysis:', err);
                }
            }
            
            // Use the original method as fallback
            return originalGetFrequency.call(this, targetFreq);
        };
        
        // Also patch the getAudioData method which many visualizers use
        window.audioProcessor.getAudioData = function() {
            // If we're exporting and have a special export audio element
            if (this._exportAudioElement && this._exportAudioElement.currentTime > 0) {
                try {
                    if (this._exportAudioContext && this._exportAnalyzer) {
                        // Get the same frequency data we use in getAudioFrequency
                        this._exportAnalyzer.getByteFrequencyData(this._exportFrequencyData);
                        
                        // Return a copy so the original isn't modified
                        return new Uint8Array(this._exportFrequencyData);
                    }
                } catch (err) {
                    console.warn('Error getting export audio data:', err);
                }
            }
            
            // Fall back to original method
            return originalGetAudioData.call(this);
        };
        
        // Also patch the isPlaying method to report true during export
        const originalIsPlaying = window.audioProcessor.isPlaying;
        window.audioProcessor.isPlaying = function() {
            // Report as playing during export
            if (this._exportAudioElement && this._exportAudioElement.currentTime > 0 && !this._exportAudioElement.paused) {
                return true;
            }
            
            // Otherwise fall back to original method
            return originalIsPlaying.call(this);
        };
        
        console.log('AudioProcessor successfully patched for export');
    }
})();