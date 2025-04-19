/**
 * WebGL Detection Helper
 * Provides robust detection of WebGL support with detailed error reporting
 */
class WebGLDetector {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.errorMessage = null;
        this.debugInfo = {};
    }

    /**
     * Checks if WebGL is supported with detailed error information
     * @returns {Object} Result with isSupported flag and errorDetails
     */
    checkWebGLSupport() {
        if (!window.WebGLRenderingContext) {
            return this._createResult(false, "Your browser doesn't support WebGL");
        }

        // Try to get WebGL context
        let gl;
        try {
            // Try WebGL2 first, then fall back to WebGL1
            gl = this.canvas.getContext('webgl2') || 
                 this.canvas.getContext('webgl') || 
                 this.canvas.getContext('experimental-webgl');
        } catch (e) {
            return this._createResult(false, `WebGL context error: ${e.message}`);
        }

        if (!gl) {
            return this._createResult(false, "Your browser supports WebGL but it might be disabled");
        }

        // Gather debug info
        try {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                this.debugInfo = {
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                };
            }
        } catch (e) {
            console.warn("Couldn't get WebGL debug info:", e);
        }

        // Verify WebGL actually works by creating a simple test
        try {
            // Create a test shader
            const testShader = gl.createShader(gl.VERTEX_SHADER);
            if (!testShader) {
                return this._createResult(false, "WebGL shader creation failed");
            }
            gl.deleteShader(testShader);
        } catch (e) {
            return this._createResult(false, `WebGL operation test failed: ${e.message}`);
        }

        return this._createResult(true, null);
    }

    /**
     * Helper to create consistent result object
     */
    _createResult(isSupported, errorMessage) {
        this.errorMessage = errorMessage;
        
        return {
            isSupported,
            errorMessage,
            debugInfo: this.debugInfo
        };
    }
}