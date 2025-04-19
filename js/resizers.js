function initResizers() {
    const verticalResizer = document.querySelector('.vertical-resizer');
    const horizontalResizer = document.querySelector('.horizontal-resizer');
    const editorPanel = document.querySelector('.editor-panel');
    const outputPanel = document.querySelector('.output-panel');
    const consoleContainer = document.querySelector('.console-container');
    const canvasContainer = document.querySelector('.canvas-container');
    
    if (verticalResizer && editorPanel && outputPanel) {
        let isResizing = false;
        let startX = 0;
        let startEditorWidth = 0;
        let startOutputWidth = 0;
        let totalWidth = 0;
        
        // Store the initial widths
        function updateWidths() {
            startEditorWidth = editorPanel.offsetWidth;
            startOutputWidth = outputPanel.offsetWidth;
            totalWidth = startEditorWidth + startOutputWidth;
        }
        
        verticalResizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            updateWidths();
            
            // Add classes for visual feedback
            this.classList.add('active');
            document.body.style.cursor = 'col-resize';
            
            // Add overlay to prevent text selection during resize
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            document.body.appendChild(overlay);
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const newEditorWidth = Math.max(200, Math.min(totalWidth - 200, startEditorWidth + dx));
            const newOutputWidth = totalWidth - newEditorWidth;
            
            const editorPercent = (newEditorWidth / totalWidth) * 100;
            const outputPercent = 100 - editorPercent;
            
            // Apply new widths as percentages
            editorPanel.style.flexBasis = `${editorPercent}%`;
            outputPanel.style.flexBasis = `${outputPercent}%`;
            
            // Refresh CodeMirror to ensure proper rendering
            if (window.editor) {
                window.editor.refresh();
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                verticalResizer.classList.remove('active');
                document.body.style.cursor = '';
                
                // Remove overlay
                const overlay = document.getElementById('resize-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
                
                // Refresh editor again after resize is complete
                if (window.editor) {
                    setTimeout(() => window.editor.refresh(), 50);
                }
            }
        });
        
        // Add window resize handler to keep panels proportional
        window.addEventListener('resize', function() {
            if (editorPanel.style.flexBasis) {
                // Maintain existing proportions when window resizes
                const editorPercent = parseFloat(editorPanel.style.flexBasis);
                const outputPercent = 100 - editorPercent;
                
                editorPanel.style.flexBasis = `${editorPercent}%`;
                outputPanel.style.flexBasis = `${outputPercent}%`;
            }
        });
    }
    
    // Handle horizontal resizer for console
    if (horizontalResizer && consoleContainer && canvasContainer) {
        let isHorizontalResizing = false;
        let startY = 0;
        let startConsoleHeight = 0;
        
        horizontalResizer.addEventListener('mousedown', (e) => {
            isHorizontalResizing = true;
            startY = e.clientY;
            startConsoleHeight = consoleContainer.offsetHeight;
            horizontalResizer.classList.add('active');
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isHorizontalResizing) {
                const dy = e.clientY - startY;
                const newHeight = startConsoleHeight - dy;
                const parentHeight = consoleContainer.parentElement.offsetHeight;
                
                // Ensure height is within reasonable limits (min 50px, max 70% of parent)
                if (newHeight > 50 && newHeight < parentHeight * 0.7) {
                    consoleContainer.style.height = `${newHeight}px`;
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            isHorizontalResizing = false;
            document.body.style.cursor = '';
            
            if (horizontalResizer) {
                horizontalResizer.classList.remove('active');
            }
        });
    }
    
    // Initial layout adjustment
    window.addEventListener('resize', adjustLayout);
    setTimeout(adjustLayout, 100);
}

function toggleFullscreen() {
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;

    let fullscreenModal = document.querySelector('.fullscreen-modal');
    
    if (!fullscreenModal) {
        // Create modal if it doesn't exist
        fullscreenModal = document.createElement('div');
        fullscreenModal.className = 'fullscreen-modal';
        
        const fullscreenCanvas = document.createElement('canvas');
        fullscreenCanvas.className = 'fullscreen-canvas';
        
        const exitButton = document.createElement('button');
        exitButton.className = 'exit-fullscreen';
        exitButton.innerHTML = 'Exit Fullscreen';
        exitButton.onclick = exitFullscreen;
        
        fullscreenModal.appendChild(fullscreenCanvas);
        fullscreenModal.appendChild(exitButton);
        document.body.appendChild(fullscreenModal);
    }

    // Show modal and set up continuous updates
    fullscreenModal.style.display = 'block';
    const fullscreenCanvas = fullscreenModal.querySelector('.fullscreen-canvas');
    
    // Match size to window while maintaining aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        fullscreenCanvas.width = maxWidth;
        fullscreenCanvas.height = maxWidth / aspectRatio;
    } else {
        fullscreenCanvas.height = maxHeight;
        fullscreenCanvas.width = maxHeight * aspectRatio;
    }
    
    // Set up continuous update
    if (!window.fullscreenUpdateInterval) {
        window.fullscreenUpdateInterval = setInterval(() => {
            if (fullscreenModal.style.display === 'block') {
                const ctx = fullscreenCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
            } else {
                clearInterval(window.fullscreenUpdateInterval);
                window.fullscreenUpdateInterval = null;
            }
        }, 1000 / 60); // 60 FPS update rate
    }
}

function exitFullscreen() {
    const fullscreenModal = document.querySelector('.fullscreen-modal');
    if (fullscreenModal) {
        fullscreenModal.style.display = 'none';
        
        // Clear the update interval
        if (window.fullscreenUpdateInterval) {
            clearInterval(window.fullscreenUpdateInterval);
            window.fullscreenUpdateInterval = null;
        }
    }
}

function adjustLayout() {
    const canvas = document.getElementById('output-canvas');
    if (canvas) {
        const container = canvas.parentElement;
        const renderer = window.renderer;
        
        if (renderer) {
            renderer.resizeCanvas(
                parseInt(document.getElementById('canvas-width')?.value || 800),
                parseInt(document.getElementById('canvas-height')?.value || 600)
            );
        }
    }
}
