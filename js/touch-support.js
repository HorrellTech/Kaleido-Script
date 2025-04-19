/**
 * Touch support for canvas interactions
 */

(function() {
    let canvas;
    let lastTouchX = 0;
    let lastTouchY = 0;
    
    function initTouchSupport() {
        canvas = document.getElementById('output-canvas');
        
        if (!canvas) return;
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
    }
    
    function handleTouchStart(event) {
        // Prevent default to avoid scrolling while interacting with canvas
        event.preventDefault();
        
        const touch = event.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        
        // Map touch start to mouse down for the interpreter
        if (window.interpreter) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const canvasX = (touch.clientX - rect.left) * scaleX;
            const canvasY = (touch.clientY - rect.top) * scaleY;
            
            // Simulate mousedown event for the interpreter
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            
            canvas.dispatchEvent(mouseEvent);
        }
    }
    
    function handleTouchMove(event) {
        event.preventDefault();
        
        const touch = event.touches[0];
        
        // Map touch move to mouse move for the interpreter
        if (window.interpreter) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const canvasX = (touch.clientX - rect.left) * scaleX;
            const canvasY = (touch.clientY - rect.top) * scaleY;
            
            // Update interpreter mouse position
            // Simulate mousemove event for the interpreter
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            
            canvas.dispatchEvent(mouseEvent);
        }
        
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    }
    
    function handleTouchEnd(event) {
        event.preventDefault();
        
        // Simulate mouseup event for the interpreter
        const mouseEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Delay initialization slightly to ensure canvas is ready
        setTimeout(initTouchSupport, 500);
    });
})();