/* * Enhanced Features for Canvas Rendering
    * This module provides additional features for canvas rendering,

    * including beat detection and transition effects.
    * It is designed to be used with a canvas rendering context.
*/
const bpmDetector = {
    beatHistory: [],
    bpm: 120,
    confidence: 0,
    lastBeatTime: 0,
    
    // Process a detected beat
    registerBeat: function(time) {
        const now = time;
        
        if (this.lastBeatTime > 0) {
            const interval = now - this.lastBeatTime;
            
            // Only accept reasonable intervals (20 BPM to 200 BPM)
            if (interval > 0.3 && interval < 3.0) {
                this.beatHistory.push(interval);
                
                // Keep history limited to last 24 beats
                if (this.beatHistory.length > 24) {
                    this.beatHistory.shift();
                }
                
                // Calculate average beat interval
                this.calculateBPM();
            }
        }
        
        this.lastBeatTime = now;
    },
    
    // Calculate BPM from beat history
    calculateBPM: function() {
        if (this.beatHistory.length < 4) return;
        
        // Group similar intervals
        const groups = this.groupSimilarIntervals(this.beatHistory);
        
        // Find most common interval
        let bestGroup = null;
        let bestCount = 0;
        
        for (const interval in groups) {
            if (groups[interval].length > bestCount) {
                bestCount = groups[interval].length;
                bestGroup = groups[interval];
            }
        }
        
        if (bestGroup) {
            // Calculate average of best group
            const avgInterval = bestGroup.reduce((sum, val) => sum + val, 0) / bestGroup.length;
            
            // Convert to BPM
            this.bpm = Math.round(60 / avgInterval);
            
            // Calculate confidence (0-1)
            this.confidence = bestCount / this.beatHistory.length;
        }
    },
    
    // Group similar intervals together
    groupSimilarIntervals: function(intervals) {
        const groups = {};
        const tolerance = 0.05; // 5% tolerance
        
        for (const interval of intervals) {
            let added = false;
            
            for (const groupKey in groups) {
                const groupAvg = groups[groupKey].reduce((sum, val) => sum + val, 0) / groups[groupKey].length;
                
                if (Math.abs(interval - groupAvg) / groupAvg < tolerance) {
                    groups[groupKey].push(interval);
                    added = true;
                    break;
                }
            }
            
            if (!added) {
                groups[interval] = [interval];
            }
        }
        
        return groups;
    },
    
    // Get current beat phase (0-1) based on detected BPM
    getBeatPhase: function(time) {
        if (this.bpm <= 0) return 0;
        
        const beatsPerSecond = this.bpm / 60;
        return (time * beatsPerSecond) % 1;
    },
    
    // Get whether we're on a beat
    isOnBeat: function(time, threshold = 0.1) {
        const phase = this.getBeatPhase(time);
        return phase < threshold;
    },
    
    // Reset beat detection
    reset: function() {
        this.beatHistory = [];
        this.lastBeatTime = 0;
        this.bpm = 120;
        this.confidence = 0;
    }
};

// Add to global scope
window.registerBeat = bpmDetector.registerBeat.bind(bpmDetector);
window.getBPM = () => bpmDetector.bpm;
window.getBeatPhase = bpmDetector.getBeatPhase.bind(bpmDetector);
window.isOnBeat = bpmDetector.isOnBeat.bind(bpmDetector);


/* * Transition Effects
 * Provides various transition effects for canvas rendering.
 * Effects include fade, wipe, and pixelate.
 */
const transitionEffects = {
    // Track current transition
    current: null,
    
    // Start a transition
    start: function(type, duration = 1.0, options = {}) {
        this.current = {
            type,
            duration,
            startTime: performance.now() / 1000,
            options
        };
    },
    
    // Apply current transition effect to canvas
    apply: function(time) {
        if (!this.current) return false;
        
        const elapsed = time - this.current.startTime;
        const progress = Math.min(1.0, elapsed / this.current.duration);
        
        if (progress >= 1.0) {
            this.current = null;
            return false;
        }
        
        const ctx = window.renderer ? window.renderer.context : null;
        if (!ctx) return false;
        
        switch (this.current.type) {
            case 'fade':
                ctx.globalAlpha = progress;
                break;
                
            case 'wipe':
                const direction = this.current.options.direction || 'right';
                const canvas = ctx.canvas;
                
                ctx.save();
                ctx.beginPath();
                
                if (direction === 'right') {
                    ctx.rect(0, 0, canvas.width * progress, canvas.height);
                } else if (direction === 'left') {
                    ctx.rect(canvas.width * (1 - progress), 0, canvas.width * progress, canvas.height);
                } else if (direction === 'down') {
                    ctx.rect(0, 0, canvas.width, canvas.height * progress);
                } else if (direction === 'up') {
                    ctx.rect(0, canvas.height * (1 - progress), canvas.width, canvas.height * progress);
                } else if (direction === 'center') {
                    const radius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * progress;
                    ctx.arc(canvas.width/2, canvas.height/2, radius, 0, Math.PI * 2);
                }
                
                ctx.clip();
                break;
                
            case 'pixelate':
                const pixelSize = Math.max(1, (1 - progress) * 30);
                // Pixelation requires additional buffer canvas with effects
                // Implementation would require more complex code
                break;
        }
        
        return true;
    },
    
    // Clean up after transition
    end: function() {
        const ctx = window.renderer ? window.renderer.context : null;
        if (ctx) {
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
        this.current = null;
    }
};

// Add to global scope
window.startTransition = transitionEffects.start.bind(transitionEffects);
window.applyTransition = transitionEffects.apply.bind(transitionEffects);
window.endTransition = transitionEffects.end.bind(transitionEffects);


/*
    * Particle System
    * A simple particle system for creating visual effects.
    * This system allows for the creation of particles with various properties,
    * including size, color, lifespan, and movement.
    * It can be used for effects like explosions, smoke, and more.
    * It is designed to be used with a canvas rendering context.
    * It can be used in conjunction with the beat detection system
    * to create reactive visual effects.
*/
class ParticleSystem {
    constructor(options = {}) {
        this.options = Object.assign({
            x: width / 2,
            y: height / 2,
            particleCount: 100,
            particleLifespan: 3.0,
            particleSize: 5,
            particleColor: '#ffffff',
            gravity: 0.1,
            spread: 1,
            speed: 1,
            opacity: 0.8,
            fadeOut: true,
            emitRate: 5,
            direction: 0,
            directionSpread: Math.PI * 2,
            reactive: false
        }, options);
        
        this.particles = [];
        this.emitCounter = 0;
    }
    
    emit(count = 1) {
        for (let i = 0; i < count; i++) {
            const angle = this.options.direction + 
                  (Math.random() * this.options.directionSpread - this.options.directionSpread/2);
            
            const speed = this.options.speed * (0.5 + Math.random());
            const size = this.options.particleSize * (0.5 + Math.random());
            
            let color = this.options.particleColor;
            if (Array.isArray(color)) {
                color = color[Math.floor(Math.random() * color.length)];
            }
            
            this.particles.push({
                x: this.options.x + (Math.random() - 0.5) * this.options.spread * 10,
                y: this.options.y + (Math.random() - 0.5) * this.options.spread * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                life: 1.0,
                opacity: this.options.opacity
            });
        }
    }
    
    update(deltaTime, audioValue = 0) {
        // Update emission counter
        this.emitCounter += deltaTime * this.options.emitRate;
        const emitCount = Math.floor(this.emitCounter);
        this.emitCounter -= emitCount;
        
        // Emit new particles
        if (emitCount > 0) {
            this.emit(emitCount);
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Apply gravity if any
            p.vy += this.options.gravity * deltaTime;
            
            // Update position
            p.x += p.vx * deltaTime * (this.options.reactive ? (1 + audioValue * 5) : 1);
            p.y += p.vy * deltaTime * (this.options.reactive ? (1 + audioValue * 5) : 1);
            
            // Update lifespan
            p.life -= deltaTime / this.options.particleLifespan;
            
            if (this.options.fadeOut) {
                p.opacity = p.life * this.options.opacity;
            }
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(audioValue = 0) {
        for (const p of this.particles) {
            let size = p.size;
            if (this.options.reactive) {
                size *= (1 + audioValue * 2);
            }
            
            // Draw particle
            fill(0, 0, 0, 0); // No fill
            stroke(...this.hexToRgb(p.color), p.opacity);
            circle(p.x, p.y, size, false);
        }
    }
    
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        // Parse the hex value
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        }
        
        return [r, g, b];
    }
}

// Add to global scope
window.ParticleSystem = ParticleSystem;

/*    * Layer Management System 
      
* This system allows for the creation and management of multiple layers
* in a canvas rendering context.
* Each layer can have its own properties, including visibility, z-index,
* and opacity.
*/
const layerManager = {
    layers: [],
    
    // Create a new layer
    createLayer: function(name, zIndex = 0) {
        const newLayer = {
            name,
            zIndex,
            visible: true,
            elements: [],
            opacity: 1.0
        };
        
        this.layers.push(newLayer);
        this.sortLayers();
        return newLayer;
    },
    
    // Add element to a layer
    addToLayer: function(layerName, drawFunction) {
        const layer = this.getLayer(layerName);
        if (!layer) return null;
        
        const element = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            draw: drawFunction
        };
        
        layer.elements.push(element);
        return element.id;
    },
    
    // Get a layer by name
    getLayer: function(name) {
        return this.layers.find(layer => layer.name === name);
    },
    
    // Sort layers by z-index
    sortLayers: function() {
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
    },
    
    // Draw all layers
    drawLayers: function(time) {
        this.layers.forEach(layer => {
            if (!layer.visible) return;

            const context = window.renderer ? window.renderer.context : null;
            
            // Save context state
            context.save();
            context.globalAlpha = layer.opacity;
            
            // Draw all elements in this layer
            layer.elements.forEach(element => {
                if (typeof element.draw === 'function') {
                    element.draw(time);
                }
            });
            
            // Restore context state
            context.restore();
        });
    },
    
    // Clear a specific layer
    clearLayer: function(name) {
        const layer = this.getLayer(name);
        if (layer) {
            layer.elements = [];
        }
    }
};

// Add to global scope
window.createLayer = layerManager.createLayer.bind(layerManager);
window.addToLayer = layerManager.addToLayer.bind(layerManager);
window.clearLayer = layerManager.clearLayer.bind(layerManager);
window.drawLayers = layerManager.drawLayers.bind(layerManager);


/*
    * Easing Functions
    * This module provides various easing functions for smooth transitions.
    * It includes linear, quadratic, cubic, elastic, and custom easing functions.
    * It can be used for animations and transitions in canvas rendering.
*/
const easing = {
    // Common easing functions
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInElastic: t => (.04 - .04 / t) * Math.sin(25 * t) + 1,
    easeOutElastic: t => .04 * t / (--t) * Math.sin(25 * t),
    easeInOutElastic: t => (t -= .5) < 0 ? (.02 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1,
    
    // Create an animation sequence with keyframes
    animate: function(startValue, endValue, duration, elapsedTime, easingFunc = this.easeInOutQuad) {
        // Handle durations of 0 to avoid division by zero
        if (duration === 0) return endValue;
        
        const t = Math.min(1, elapsedTime / duration);
        const easedT = easingFunc(t);
        
        if (Array.isArray(startValue) && Array.isArray(endValue)) {
            // Handle arrays (like positions)
            return startValue.map((start, i) => {
                const end = endValue[i] || start;
                return start + (end - start) * easedT;
            });
        } else if (typeof startValue === 'object' && typeof endValue === 'object') {
            // Handle objects (like coordinates)
            const result = {};
            for (const key in startValue) {
                if (endValue[key] !== undefined) {
                    result[key] = startValue[key] + (endValue[key] - startValue[key]) * easedT;
                } else {
                    result[key] = startValue[key];
                }
            }
            return result;
        } else {
            // Handle basic numeric values
            return startValue + (endValue - startValue) * easedT;
        }
    }
};

// Add to global scope
window.animate = easing.animate.bind(easing);
window.easing = {};
Object.keys(easing).forEach(key => {
    if (typeof easing[key] === 'function' && key !== 'animate') {
        window.easing[key] = easing[key];
    }
});

/*
    * Audio Utilities
    * This module provides utilities for audio analysis and beat detection.
    * It includes functions for getting audio bands, detecting beats,
    * and analyzing frequency data.
    * It is designed to work with the Web Audio API.
*/
const audioUtils = {
    // Get audio spectrum divided into bands
    getAudioBands: function(bandCount = 4) {
        const bands = [];
        const minFreq = 60;
        const maxFreq = 15000;
        const factor = Math.pow(maxFreq/minFreq, 1/bandCount);
        
        for (let i = 0; i < bandCount; i++) {
            const lowFreq = minFreq * Math.pow(factor, i);
            const highFreq = minFreq * Math.pow(factor, i+1);
            const bandValue = this.getAudioBandValue(lowFreq, highFreq);
            bands.push(bandValue);
        }
        
        return bands;
    },
    
    // Get average value for a frequency band
    getAudioBandValue: function(lowFreq, highFreq, samples = 5) {
        let sum = 0;
        const step = (highFreq - lowFreq) / samples;
        
        for (let i = 0; i < samples; i++) {
            const freq = lowFreq + step * i;
            sum += window.audiohz(freq);
        }
        
        return sum / samples;
    },
    
    // Detect beats in real-time
    detectBeat: function(threshold = 0.7, frequency = 60) {
        if (!this._lastAmplitude) {
            this._lastAmplitude = window.audiohz(frequency);
            this._beatHistory = Array(10).fill(0);
            this._lastBeatTime = 0;
            return false;
        }
        
        const currentAmplitude = window.audiohz(frequency);
        const delta = currentAmplitude - this._lastAmplitude;
        this._lastAmplitude = currentAmplitude;
        
        // Calculate dynamic threshold based on recent history
        const avgAmplitude = this._beatHistory.reduce((a, b) => a + b, 0) / this._beatHistory.length;
        this._beatHistory.shift();
        this._beatHistory.push(currentAmplitude);
        
        // Require minimum time between beats (100ms)
        const now = performance.now();
        if (now - this._lastBeatTime < 100) return false;
        
        // Detect beat (spike in amplitude)
        if (currentAmplitude > avgAmplitude * threshold && currentAmplitude > 0.15 && delta > 0) {
            this._lastBeatTime = now;
            return true;
        }
        
        return false;
    }
};

// Add to global scope
window.getAudioBands = audioUtils.getAudioBands.bind(audioUtils);
window.detectBeat = audioUtils.detectBeat.bind(audioUtils);

/*
    * Color Utilities
    * This module provides utilities for color manipulation and generation.
    * It includes functions for generating color palettes,
    * converting between color formats,
    * and creating gradients.
    * It is designed to work with hex and HSL color formats.
    * It can be used for creating color schemes,
    * color transitions, and more.
*/
const colorUtils = {
    // Generate a color palette based on a base color
    generatePalette: function(baseColor, count = 5, mode = 'analogous') {
        // Convert to HSL for easier manipulation
        const hsl = this.hexToHSL(baseColor);
        const palette = [];
        
        switch (mode.toLowerCase()) {
            case 'analogous':
                // Colors next to each other on color wheel
                for (let i = 0; i < count; i++) {
                    const newHue = (hsl.h + (i - Math.floor(count/2)) * 15) % 360;
                    palette.push(this.hslToHex(newHue, hsl.s, hsl.l));
                }
                break;
            case 'complementary':
                // Colors opposite each other on color wheel
                for (let i = 0; i < count; i++) {
                    const newHue = (hsl.h + i * (180/count)) % 360;
                    palette.push(this.hslToHex(newHue, hsl.s, hsl.l));
                }
                break;
            case 'monochromatic':
                // Different shades of same hue
                for (let i = 0; i < count; i++) {
                    const newL = Math.max(20, Math.min(90, hsl.l - 30 + (i * 60 / (count-1))));
                    palette.push(this.hslToHex(hsl.h, hsl.s, newL));
                }
                break;
            case 'triadic':
                // Three colors evenly spaced around wheel
                for (let i = 0; i < count; i++) {
                    const newHue = (hsl.h + i * (360/3)) % 360;
                    palette.push(this.hslToHex(newHue, hsl.s, hsl.l));
                }
                break;
        }
        
        return palette;
    },
    
    // Color conversion utilities
    hexToHSL: function(hex) {
        // Convert hex to RGB first
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        
        // Then convert RGB to HSL
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h *= 60;
        }
        
        return {h, s: s*100, l: l*100};
    },
    
    hslToHex: function(h, s, l) {
        h = h % 360;
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        
        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
        g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
        b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    },
    
    // Generate a color at specified position in gradient
    getColorAtPosition: function(color1, color2, position) {
        const hsl1 = this.hexToHSL(color1);
        const hsl2 = this.hexToHSL(color2);
        
        // Linear interpolation between colors
        const h = hsl1.h + (hsl2.h - hsl1.h) * position;
        const s = hsl1.s + (hsl2.s - hsl1.s) * position;
        const l = hsl1.l + (hsl2.l - hsl1.l) * position;
        
        return this.hslToHex(h, s, l);
    }
};

// Add to global scope
window.generatePalette = colorUtils.generatePalette.bind(colorUtils);
window.getColorAtPosition = colorUtils.getColorAtPosition.bind(colorUtils);