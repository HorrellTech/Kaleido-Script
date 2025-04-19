/**
 * KaleidoScript Visualizers
 * This file contains all visualizer implementations for the KaleidoScript application
 */

class Visualizers {
    constructor(interpreter) {
        this.interpreter = interpreter;
        this.context = interpreter.context;
        
        // Store visualizer state
        this.particles = null;
        this.bubbles = null;
        this.eyes = null;
        this.flames = null;
        this.ripples = null;
        this.stars = null;
        this.matrixChars = null;
        this.snakesData = null;
        this.planetSystem = null;
        this.fogClouds = null;
        this.nebulaData = null;
        this.fishPondData = null;
    }
    
    reset() {
        // Reset all visualizer states
        this.particles = null;
        this.bubbles = null;
        this.eyes = null;
        this.flames = null;
        this.ripples = null;
        this.stars = null;
        this.matrixChars = null;
        this.snakesData = null;
        this.planetSystem = null;
        this.fogClouds = null;
        this.nebulaData = null;
        this.fishPondData = null;
    }
    
    // Helper function to get audio frequency data from the interpreter
    getAudioFrequency(freq) {
        return this.interpreter.getAudioFrequency(freq);
    }

    // VISUALIZERS
    // Audio Visualization Helper Methods
    circularVisualizer(x, y, minRadius, maxRadius, pointCount, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) {
        if (!this.context) return;
        
        this.context.beginPath();
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }
        
        for (let i = 0; i <= pointCount; i++) {
            // Calculate angle and frequency for this point
            const angle = (i / pointCount) * Math.PI * 2 + rotation;
            const freq = freqStart + (i / pointCount) * (freqEnd - freqStart);
            
            // Get amplitude for this frequency
            const amplitude = this.getAudioFrequency(freq);
            
            // Calculate radius with audio reactivity
            const radius = minRadius + amplitude * (maxRadius - minRadius);
            
            // Calculate point position
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            // Draw line to point
            if (i === 0) {
                this.context.moveTo(px, py);
            } else {
                this.context.lineTo(px, py);
            }
        }
        
        this.context.closePath();
        this.context.stroke();
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    barVisualizer(x, y, width, height, barCount, spacing = 2, minHeight = 5, rotation = 0, mirror = false, glow = false) {
        if (!this.context) return;
        
        const barWidth = (width - (barCount * spacing)) / barCount;
        
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.fillStyle;
        }
        
        this.context.save();
        this.context.translate(x, y);
        this.context.rotate(rotation * Math.PI / 180);
        
        for (let i = 0; i < barCount; i++) {
            // Get frequency for this bar (exponential scale for better bass response)
            const freq = Math.round(20 * Math.pow(2, i * 10.0 / barCount));
            const amplitude = this.getAudioFrequency(freq);
            
            // Calculate bar height
            const barHeight = minHeight + amplitude * height;
            
            // Draw bar
            const barX = i * (barWidth + spacing);
            this.context.fillRect(barX, 0, barWidth, -barHeight);
            
            // Draw mirrored bar if enabled
            if (mirror) {
                this.context.fillRect(barX, 0, barWidth, barHeight);
            }
        }
        
        this.context.restore();
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    waveformVisualizer(x, y, width, height, detail = 100, lineWidth = 2, glow = false) {
        if (!this.context) return;
        
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }
        
        this.context.lineWidth = lineWidth;
        this.context.beginPath();
        
        for (let i = 0; i <= detail; i++) {
            const freq = 20 + (i / detail) * 2000;
            const amplitude = this.getAudioFrequency(freq);
            
            const px = x + (i / detail) * width;
            const py = y + amplitude * height;
            
            if (i === 0) {
                this.context.moveTo(px, py);
            } else {
                this.context.lineTo(px, py);
            }
        }
        
        this.context.stroke();
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    spiralVisualizer(x, y, startRadius, spacing, turns, pointCount, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) {
        if (!this.context) return;
        
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }
        
        this.context.beginPath();
        
        for (let i = 0; i <= pointCount; i++) {
            const progress = i / pointCount;
            const angle = progress * Math.PI * 2 * turns + rotation;
            const freq = freqStart + progress * (freqEnd - freqStart);
            
            const amplitude = this.getAudioFrequency(freq);
            const radius = startRadius + (spacing * angle / (Math.PI * 2));
            const radiusWithAmplitude = radius + (amplitude * spacing * 2);
            
            const px = x + Math.cos(angle) * radiusWithAmplitude;
            const py = y + Math.sin(angle) * radiusWithAmplitude;
            
            if (i === 0) {
                this.context.moveTo(px, py);
            } else {
                this.context.lineTo(px, py);
            }
        }
        
        this.context.stroke();
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    particleVisualizer(x, y, width, height, particleCount = 100, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;
    
        // Initialize particles if they don't exist
        if (!this.particles) {
            this.particles = Array(particleCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + Math.random() * height,
                size: 1 + Math.random() * 3,
                speedX: -1 + Math.random() * 2,
                speedY: -1 + Math.random() * 2,
                freq: freqStart + Math.random() * (freqEnd - freqStart)
            }));
        }
    
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.fillStyle;
        }
    
        // Update and draw particles
        this.particles.forEach(particle => {
            // Get audio reactivity
            const amplitude = this.getAudioFrequency(particle.freq);
            
            // Update position with audio-reactive speed
            particle.x += particle.speedX * (1 + amplitude * 2);
            particle.y += particle.speedY * (1 + amplitude * 2);
            
            // Wrap around edges
            if (particle.x < x) particle.x = x + width;
            if (particle.x > x + width) particle.x = x;
            if (particle.y < y) particle.y = y + height;
            if (particle.y > y + height) particle.y = y;
    
            // Draw particle
            this.circle(
                particle.x, 
                particle.y, 
                particle.size * (1 + amplitude * 2)
            );
        });
    
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }
    
    bubbleVisualizer(x, y, width, height, bubbleCount = 20, minSize = 10, maxSize = 50, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;
    
        // Initialize bubbles if they don't exist
        if (!this.bubbles) {
            this.bubbles = Array(bubbleCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + height + maxSize,
                size: minSize + Math.random() * (maxSize - minSize),
                speed: 0.5 + Math.random() * 2,
                freq: freqStart + Math.random() * (freqEnd - freqStart),
                hue: Math.random() * 360
            }));
        }
    
        if (glow) {
            this.context.shadowBlur = 20;
            this.context.shadowColor = this.context.strokeStyle;
        }
    
        // Update and draw bubbles
        this.bubbles.forEach(bubble => {
            // Get audio reactivity
            const amplitude = this.getAudioFrequency(bubble.freq);
            
            // Update position with audio-reactive speed
            bubble.y -= bubble.speed * (1 + amplitude * 3);
            
            // Subtle horizontal movement
            bubble.x += Math.sin(bubble.y * 0.05) * 0.5;
            
            // Reset bubble when it goes off screen
            if (bubble.y < y - bubble.size) {
                bubble.y = y + height + bubble.size;
                bubble.x = x + Math.random() * width;
            }
    
            // Draw bubble with audio-reactive size and opacity
            this.context.beginPath();
            this.context.strokeStyle = `hsla(${bubble.hue}, 100%, 50%, ${0.2 + amplitude * 0.8})`;
            this.context.arc(
                bubble.x, 
                bubble.y, 
                bubble.size * (1 + amplitude * 0.5),
                0, 
                Math.PI * 2
            );
            this.context.stroke();
    
            // Add highlight
            this.context.beginPath();
            this.context.arc(
                bubble.x - bubble.size * 0.3, 
                bubble.y - bubble.size * 0.3, 
                bubble.size * 0.2,
                0, 
                Math.PI * 2
            );
            this.context.fillStyle = `rgba(255, 255, 255, ${0.1 + amplitude * 0.2})`;
            this.context.fill();
        });
    
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    eyesVisualizer(x, y, width, height, eyeCount = 5, eyeSize = 30, fadeSpeed = 0.02, freqStart = 20, freqEnd = 2000) {
        if (!this.context) return;
    
        // Initialize eyes if they don't exist
        if (!this.eyes) {
            this.eyes = Array(eyeCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + Math.random() * height,
                targetX: x + Math.random() * width,
                targetY: y + Math.random() * height,
                size: eyeSize * (0.8 + Math.random() * 0.4),
                alpha: 0,
                fadeDirection: 1, // 1 for fade in, -1 for fade out
                pupilOffsetX: 0,
                pupilOffsetY: 0,
                bassFreq: 40 + Math.random() * 80,  // Random low frequency for fade
                trebleFreq: 2000 + Math.random() * 2000, // High frequency for pupil movement
                phase: Math.random() * Math.PI * 2 // Random starting phase
            }));
        }
    
        // Update and draw eyes
        this.eyes.forEach(eye => {
            // Get audio reactivity
            const bassAmplitude = this.getAudioFrequency(eye.bassFreq);
            const trebleAmplitude = this.getAudioFrequency(eye.trebleFreq);
            
            // Update fade based on bass or timer
            eye.alpha += eye.fadeDirection * (fadeSpeed + bassAmplitude * 0.1);
            
            // Clamp alpha between 0 and 1
            eye.alpha = Math.max(0, Math.min(1, eye.alpha));
            
            // If fully faded out, pick new target position
            if (eye.alpha === 0 && eye.fadeDirection === -1) {
                eye.targetX = x + Math.random() * width;
                eye.targetY = y + Math.random() * height;
                eye.fadeDirection = 1; // Start fading in
            }
            
            // If fully faded in, start countdown to fade out
            if (eye.alpha === 1 && eye.fadeDirection === 1) {
                eye.fadeDirection = -1; // Start fading out
            }
            
            // Move eye towards target position
            eye.x += (eye.targetX - eye.x) * 0.05;
            eye.y += (eye.targetY - eye.y) * 0.05;
            
            // Update pupil position based on high frequencies
            eye.phase += 0.05;
            const pupilRange = eye.size * 0.2;
            eye.pupilOffsetX = Math.cos(eye.phase) * pupilRange * trebleAmplitude;
            eye.pupilOffsetY = Math.sin(eye.phase) * pupilRange * trebleAmplitude;
            
            // Draw eye white
            this.context.beginPath();
            this.context.fillStyle = `rgba(255, 255, 255, ${eye.alpha})`;
            this.context.strokeStyle = `rgba(100, 100, 100, ${eye.alpha})`;
            this.context.lineWidth = 2;
            this.context.ellipse(
                eye.x, eye.y,
                eye.size, eye.size * 0.7,
                0, 0, Math.PI * 2
            );
            this.context.fill();
            this.context.stroke();
            
            // Draw iris
            const irisSize = eye.size * 0.5;
            this.context.beginPath();
            this.context.fillStyle = `rgba(70, 140, 255, ${eye.alpha})`;
            this.context.ellipse(
                eye.x + eye.pupilOffsetX, 
                eye.y + eye.pupilOffsetY,
                irisSize, irisSize * 0.7,
                0, 0, Math.PI * 2
            );
            this.context.fill();
            
            // Draw pupil
            const pupilSize = eye.size * 0.25;
            this.context.beginPath();
            this.context.fillStyle = `rgba(0, 0, 0, ${eye.alpha})`;
            this.context.ellipse(
                eye.x + eye.pupilOffsetX, 
                eye.y + eye.pupilOffsetY,
                pupilSize, pupilSize * 0.7,
                0, 0, Math.PI * 2
            );
            this.context.fill();
            
            // Add highlight
            const highlightSize = eye.size * 0.1;
            this.context.beginPath();
            this.context.fillStyle = `rgba(255, 255, 255, ${eye.alpha * 0.9})`;
            this.context.ellipse(
                eye.x + eye.pupilOffsetX - pupilSize * 0.4,
                eye.y + eye.pupilOffsetY - pupilSize * 0.4,
                highlightSize, highlightSize * 0.7,
                0, 0, Math.PI * 2
            );
            this.context.fill();
        });
    }

    dnaVisualizer(x, y, width, height, strandCount = 10, detail = 50, spacing = 20, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) {
        if (!this.context) return;

        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }

        const centerX = x + width/2;
        const centerY = y + height/2;

        for (let strand = 0; strand < strandCount; strand++) {
            const offset = (strand / strandCount) * Math.PI * 2;
            
            for (let i = 0; i < detail; i++) {
                const progress = i / detail;
                const freq = freqStart + progress * (freqEnd - freqStart);
                const amplitude = this.getAudioFrequency(freq);
                
                // Calculate helix positions
                const angle = progress * Math.PI * 4 + offset + rotation;
                const radius = spacing * (1 + amplitude);
                
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + progress * height - height/2;
                const x2 = centerX + Math.cos(angle + Math.PI) * radius;
                const y2 = centerY + progress * height - height/2;

                // Draw helix strands
                this.line(x1, y1, x2, y2);
                
                // Draw nucleotides
                const dotSize = 3 + amplitude * 5;
                this.circle(x1, y1, dotSize);
                this.circle(x2, y2, dotSize);
            }
        }

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    constellationVisualizer(x, y, width, height, starCount = 30, connectionRadius = 100, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;

        // Initialize stars if they don't exist
        if (!this.stars) {
            this.stars = Array(starCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + Math.random() * height,
                size: 1 + Math.random() * 2,
                freq: freqStart + Math.random() * (freqEnd - freqStart),
                angle: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.3
            }));
        }

        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }

        // Update and draw stars
        this.stars.forEach(star => {
            const amplitude = this.getAudioFrequency(star.freq);
            
            // Update star position in circular motion
            star.angle += star.speed * (1 + amplitude);
            const radius = 20 + amplitude * 50;
            star.x += Math.cos(star.angle) * radius * 0.01;
            star.y += Math.sin(star.angle) * radius * 0.01;

            // Wrap around edges
            if (star.x < x) star.x = x + width;
            if (star.x > x + width) star.x = x;
            if (star.y < y) star.y = y + height;
            if (star.y > y + height) star.y = y;

            // Draw star
            this.context.fillStyle = `rgba(255, 255, 255, ${0.5 + amplitude * 0.5})`;
            this.circle(star.x, star.y, star.size * (1 + amplitude * 2));

            // Draw connections to nearby stars
            this.stars.forEach(otherStar => {
                const distance = Math.hypot(star.x - otherStar.x, star.y - otherStar.y);
                if (distance < connectionRadius) {
                    const alpha = (1 - distance/connectionRadius) * 0.2 * (1 + amplitude);
                    this.context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    this.line(star.x, star.y, otherStar.x, otherStar.y);
                }
            });
        });

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    flameVisualizer(x, y, width, height, flameCount = 50, freqStart = 20, freqEnd = 2000, glow = true) {
        if (!this.context) return;

        // Initialize flames if they don't exist
        if (!this.flames) {
            this.flames = Array(flameCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + height,
                size: 10 + Math.random() * 20,
                speed: 2 + Math.random() * 2,
                hue: 0 + Math.random() * 60, // Red to yellow
                life: 0,
                maxLife: 50 + Math.random() * 50,
                freq: freqStart + Math.random() * (freqEnd - freqStart)
            }));
        }

        if (glow) {
            this.context.shadowBlur = 30;
            this.context.shadowColor = 'rgba(255, 100, 0, 0.5)';
        }

        // Update and draw flames
        this.flames.forEach(flame => {
            const amplitude = this.getAudioFrequency(flame.freq);
            
            // Update flame position and life
            flame.y -= flame.speed * (1 + amplitude * 2);
            flame.life++;
            
            // Reset flame when it dies
            if (flame.life > flame.maxLife) {
                flame.y = y + height;
                flame.x = x + Math.random() * width;
                flame.life = 0;
                flame.size = 10 + Math.random() * 20;
            }

            // Calculate flame properties
            const progress = flame.life / flame.maxLife;
            const alpha = 1 - progress;
            const size = flame.size * (1 - progress) * (1 + amplitude);
            
            // Draw gradient flame
            const gradient = this.context.createRadialGradient(
                flame.x, flame.y, 0,
                flame.x, flame.y, size
            );
            
            gradient.addColorStop(0, `hsla(${flame.hue + amplitude * 30}, 100%, 50%, ${alpha})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.context.fillStyle = gradient;
            this.circle(flame.x, flame.y, size);
        });

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    lightningVisualizer(x, y, width, height, boltCount = 3, branchCount = 4, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;

        if (glow) {
            this.context.shadowBlur = 20;
            this.context.shadowColor = this.context.strokeStyle;
        }

        // Generate bolts based on audio
        for (let i = 0; i < boltCount; i++) {
            const freq = freqStart + (i / boltCount) * (freqEnd - freqStart);
            const amplitude = this.getAudioFrequency(freq);
            
            if (amplitude < 0.1) continue; // Skip if too quiet

            // Start point
            let startX = x + (width * (i + 1)) / (boltCount + 1);
            let startY = y;

            // Draw main bolt
            this.context.lineWidth = 2;
            this.context.beginPath();
            this.context.moveTo(startX, startY);

            let currentX = startX;
            let currentY = startY;
            let segments = Math.floor(5 + amplitude * 5);

            for (let j = 0; j < segments; j++) {
                // Calculate next point
                const nextY = y + (height * (j + 1)) / segments;
                const spread = width * 0.1 * amplitude;
                const nextX = currentX + (-spread/2 + Math.random() * spread);

                // Draw segment
                this.context.lineTo(nextX, nextY);
                
                // Maybe create a branch
                if (Math.random() < 0.3 && j < segments - 1) {
                    const branchLength = height * 0.2 * amplitude;
                    const branchAngle = -Math.PI/4 + Math.random() * Math.PI/2;
                    const branchX = nextX + Math.cos(branchAngle) * branchLength;
                    const branchY = nextY + Math.sin(branchAngle) * branchLength;
                    
                    this.context.moveTo(nextX, nextY);
                    this.context.lineTo(branchX, branchY);
                    this.context.moveTo(nextX, nextY);
                }

                currentX = nextX;
                currentY = nextY;
            }

            // Draw with fade based on amplitude
            this.context.strokeStyle = `rgba(255, 255, 255, ${amplitude})`;
            this.context.stroke();
        }

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    rippleVisualizer(x, y, width, height, rippleCount = 5, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;

        // Initialize ripples if they don't exist
        if (!this.ripples) {
            this.ripples = Array(rippleCount).fill().map(() => ({
                x: x + width/2,
                y: y + height/2,
                radius: 0,
                maxRadius: Math.min(width, height) * 0.4,
                alpha: 1,
                freq: freqStart + Math.random() * (freqEnd - freqStart)
            }));
        }

        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }

        // Update and draw ripples
        this.ripples.forEach(ripple => {
            const amplitude = this.getAudioFrequency(ripple.freq);
            
            // Update ripple
            ripple.radius += 2 * (1 + amplitude * 3);
            ripple.alpha = 1 - (ripple.radius / ripple.maxRadius);

            // Reset ripple if it's too big
            if (ripple.radius > ripple.maxRadius) {
                ripple.radius = 0;
                ripple.alpha = 1;
                // Randomize position on reset
                ripple.x = x + Math.random() * width;
                ripple.y = y + Math.random() * height;
            }

            // Draw ripple
            if (ripple.alpha > 0) {
                this.context.beginPath();
                this.context.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha})`;
                this.context.lineWidth = 2 * amplitude;
                this.context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                this.context.stroke();
            }
        });

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    fractualTreeVisualizer(x, y, length = 100, angle = Math.PI/2, depth = 8, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;

        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = this.context.strokeStyle;
        }

        const drawBranch = (x, y, len, angle, depth, freq) => {
            if (depth <= 0) return;

            const amplitude = this.getAudioFrequency(freq);
            const branchLen = len * (0.7 + amplitude * 0.3);
            
            // Calculate end point
            const endX = x + Math.cos(angle) * branchLen;
            const endY = y - Math.sin(angle) * branchLen;
            
            // Draw branch with thickness based on depth
            this.context.lineWidth = depth;
            this.context.beginPath();
            this.context.moveTo(x, y);
            this.context.lineTo(endX, endY);
            this.context.stroke();
            
            // Calculate next frequency for sub-branches
            const nextFreq = freq + (freqEnd - freqStart) / depth;
            
            // Draw sub-branches with audio-reactive angles
            const spread = Math.PI/4 * (1 + amplitude);
            drawBranch(endX, endY, branchLen * 0.7, angle + spread, depth - 1, nextFreq);
            drawBranch(endX, endY, branchLen * 0.7, angle - spread, depth - 1, nextFreq);
        };

        drawBranch(x, y + length, length, angle, depth, freqStart);

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    vortexVisualizer(x, y, radius = 200, rings = 5, pointsPerRing = 20, freqStart = 20, freqEnd = 2000, rotation = 0, glow = false) {
        if (!this.context) return;

        if (glow) {
            this.context.shadowBlur = 20;
            this.context.shadowColor = this.context.strokeStyle;
        }

        for (let ring = 0; ring < rings; ring++) {
            const ringRadius = radius * ((ring + 1) / rings);
            const freq = freqStart + (ring / rings) * (freqEnd - freqStart);
            const amplitude = this.getAudioFrequency(freq);
            
            this.context.beginPath();
            
            for (let i = 0; i <= pointsPerRing; i++) {
                const angle = (i / pointsPerRing) * Math.PI * 2 + rotation;
                const wobble = Math.sin(angle * 3 + ring) * 20 * amplitude;
                const r = ringRadius + wobble;
                
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                
                if (i === 0) {
                    this.context.moveTo(px, py);
                } else {
                    this.context.lineTo(px, py);
                }
            }
            
            this.context.closePath();
            const alpha = 0.5 - (ring / rings) * 0.3;
            this.context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.context.stroke();
        }

        if (glow) {
            this.context.shadowBlur = 0;
        }
    }

    matrixVisualizer(x, y, width, height, columns = 30, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!this.context) return;
    
        // Initialize matrix characters if they don't exist
        if (!this.matrixChars) {
            this.matrixChars = Array(columns).fill().map(() => ({
                x: x + Math.random() * width,
                chars: [],
                speed: 1 + Math.random() * 2,
                freq: freqStart + Math.random() * (freqEnd - freqStart),
                nextCharTime: 0,
                maxChars: 50 // Add maximum character limit per column
            }));
        }
    
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = "rgba(0, 255, 0, 0.5)";
        }
    
        const charSize = width / columns;
        
        // Set font only once here instead of in the loop
        this.context.font = `${charSize}px monospace`;
        
        // Update and draw characters
        this.matrixChars.forEach(stream => {
            const amplitude = this.getAudioFrequency(stream.freq);
            
            // Add new characters based on audio
            if (Math.random() < 0.1 + amplitude * 0.2) {
                // Only add new character if we're below the limit
                if (stream.chars.length < stream.maxChars) {
                    stream.chars.push({
                        char: String.fromCharCode(0x30A0 + Math.random() * 96),
                        y: y,
                        alpha: 1
                    });
                }
            }
    
            // Update and draw characters with better filtering
            let charsToKeep = [];
            for (let i = 0; i < stream.chars.length; i++) {
                const char = stream.chars[i];
                
                char.y += stream.speed * (1 + amplitude * 2);
                char.alpha -= 0.01 + amplitude * 0.01;
    
                if (char.alpha > 0 && char.y < y + height + charSize) { // Also check if within visible area
                    this.context.fillStyle = `rgba(0, 255, 0, ${char.alpha})`;
                    this.context.fillText(char.char, stream.x, char.y);
                    charsToKeep.push(char);
                }
            }
            
            // Replace the array instead of filtering in-place (more efficient)
            stream.chars = charsToKeep;
        });
    
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }
    
    snakeVisualizer(x, y, width, height, snakeCount = 8, appleCount = 5, freqStart = 20, freqEnd = 2000, glow = true) {
        if (!this.context) return;
        
        // Initialize snake visualizer data if it doesn't exist
        if (!this.snakesData) {
            // Initial settings
            this.snakesSettings = {
                snakeLength: 15,
                snakeSpeed: 1.5,
                snakeColors: ["#ff3333", "#33ff33", "#3333ff", "#ffff33", "#ff33ff", "#33ffff"],
                snakeThickness: 6,
                appleSize: 4,
                appleColor: "#ff0000",
                confusionFreqStart: 1000,
                confusionFreqEnd: 2000,
                confusionThreshold: 0.4,
                confusionIntensity: 2.5,
                bassFrequency: 100
            };
            
            // Initialize snakes
            this.snakesData = {
                snakes: [],
                apples: [],
                time: 0
            };
            
            // Create snakes with individual properties
            for (let i = 0; i < snakeCount; i++) {
                const snake = {
                    segments: [],
                    color: this.snakesSettings.snakeColors[i % this.snakesSettings.snakeColors.length],
                    speed: this.snakesSettings.snakeSpeed,
                    thickness: this.snakesSettings.snakeThickness,
                    length: this.snakesSettings.snakeLength,
                    angle: Math.random() * Math.PI * 2,
                    targetApple: null,
                    confusion: 0,
                    applesEaten: 0
                };
                
                // Create initial segments
                const startX = x + Math.random() * width;
                const startY = y + Math.random() * height;
                
                for (let j = 0; j < snake.length; j++) {
                    snake.segments.push({
                        x: startX,
                        y: startY
                    });
                }
                
                this.snakesData.snakes.push(snake);
            }
            
            // Create apples
            for (let i = 0; i < appleCount; i++) {
                this.snakesData.apples.push({
                    x: x + Math.random() * width,
                    y: y + Math.random() * height,
                    size: this.snakesSettings.appleSize,
                    alpha: 0,
                    fadeDir: 1, // 1 = fade in, -1 = fade out
                    eaten: false
                });
            }
        }
        
        // Increment time
        this.snakesData.time++;
        
        // Get audio energy levels
        const bassEnergy = this.getAudioFrequency(this.snakesSettings.bassFrequency);
        let highEnergy = 0;
        
        // Calculate high frequency energy (average over range)
        for (let freq = this.snakesSettings.confusionFreqStart; freq <= this.snakesSettings.confusionFreqEnd; freq += 100) {
            highEnergy += this.getAudioFrequency(freq);
        }
        highEnergy /= ((this.snakesSettings.confusionFreqEnd - this.snakesSettings.confusionFreqStart) / 100) || 1;
        
        // Update apples
        for (let i = 0; i < this.snakesData.apples.length; i++) {
            const apple = this.snakesData.apples[i];
            
            // Handle fading
            if (apple.eaten) {
                apple.fadeDir = -1;
            } else if (apple.alpha < 1) {
                apple.fadeDir = 1;
            }
            
            // Apply fade direction
            apple.alpha += apple.fadeDir * 0.02;
            
            // Check if apple needs respawning
            if (apple.alpha <= 0 && apple.eaten) {
                apple.x = x + Math.random() * width;
                apple.y = y + Math.random() * height;
                apple.eaten = false;
            }
            
            // Clamp alpha value
            apple.alpha = Math.max(0, Math.min(1, apple.alpha));
            
            // Draw apple with pulsing effect
            if (apple.alpha > 0) {
                if (glow) {
                    this.context.shadowBlur = 20;
                    this.context.shadowColor = this.snakesSettings.appleColor;
                }
                
                const pulseSize = apple.size * (1 + bassEnergy * 0.3);
                
                // Draw apple
                this.context.fillStyle = `rgba(255, 0, 0, ${apple.alpha})`;
                this.circle(apple.x, apple.y, pulseSize);
                
                // Draw apple stem
                this.context.strokeStyle = `rgba(50, 100, 0, ${apple.alpha})`;
                this.context.lineWidth = 2;
                this.line(apple.x, apple.y - pulseSize/2, apple.x + pulseSize/4, apple.y - pulseSize);
                
                this.context.shadowBlur = 0;
            }
        }
        
        // Define boundary constants
        const leftBoundary = x;
        const rightBoundary = x + width;
        const topBoundary = y;
        const bottomBoundary = y + height;
        
        // Update and draw snakes
        for (let i = 0; i < this.snakesData.snakes.length; i++) {
            const snake = this.snakesData.snakes[i];
            
            // Find target apple if needed
            if (!snake.targetApple || snake.targetApple.eaten) {
                // Find all available apples
                const availableApples = this.snakesData.apples.filter(apple => 
                    !apple.eaten && apple.alpha > 0.5);
                
                // If there are any available apples, choose one randomly
                if (availableApples.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableApples.length);
                    snake.targetApple = availableApples[randomIndex];
                } else {
                    snake.targetApple = null;
                }
            }
            
            // Update confusion state based on high frequencies
            if (highEnergy > this.snakesSettings.confusionThreshold) {
                snake.confusion = Math.min(1, snake.confusion + 0.05);
            } else {
                snake.confusion = Math.max(0, snake.confusion - 0.02);
            }
            
            // Calculate target angle
            let targetAngle = snake.angle;
            
            if (snake.targetApple) {
                const dx = snake.targetApple.x - snake.segments[0].x;
                const dy = snake.targetApple.y - snake.segments[0].y;
                targetAngle = Math.atan2(dy, dx);
            }
            
            // Apply confusion (random angle changes)
            if (snake.confusion > 0) {
                targetAngle += Math.sin(this.snakesData.time * 0.01 * i) * 
                    Math.PI * snake.confusion * this.snakesSettings.confusionIntensity;
            }
            
            // Gradually turn toward target angle
            const angleDiff = targetAngle - snake.angle;
            snake.angle += angleDiff * 0.1;
            
            // Move snake head
            const speed = snake.speed * (1 + bassEnergy * 0.5);
            let newX = snake.segments[0].x + Math.cos(snake.angle) * speed;
            let newY = snake.segments[0].y + Math.sin(snake.angle) * speed;
            
            // Check if the snake is about to go out of bounds and adjust direction
            let crossedBoundary = false;
            
            // Handle boundary crossing by implementing proper bounce angles
            if (newX < leftBoundary) {
                newX = leftBoundary + 5; // Push away from boundary
                // Simple reflection - if coming in at angle θ, reflect at angle π-θ 
                snake.angle = Math.PI - snake.angle;
                // Add small randomization to prevent perfect bounces causing loops
                snake.angle += Math.random() * 0.2 - 0.1;
                crossedBoundary = true;
            } else if (newX > rightBoundary) {
                newX = rightBoundary - 5;
                snake.angle = Math.PI - snake.angle; 
                snake.angle += Math.random() * 0.2 - 0.1;
                crossedBoundary = true;
            }

            if (newY < topBoundary) {
                newY = topBoundary + 5;
                snake.angle = -snake.angle; // Simple reflection across horizontal axis
                snake.angle += Math.random() * 0.2 - 0.1;
                crossedBoundary = true;
            } else if (newY > bottomBoundary) {
                newY = bottomBoundary - 5;
                snake.angle = -snake.angle;
                snake.angle += Math.random() * 0.2 - 0.1;
                crossedBoundary = true;
            }

            // Remove the additional angle normalization and adjustment code that was causing issues
            if (crossedBoundary) {
                // Just normalize the angle to stay within 0-2π
                snake.angle = (snake.angle + Math.PI * 2) % (Math.PI * 2);
            }
            
            // Add new head segment
            snake.segments.unshift({
                x: newX,
                y: newY
            });
            
            // Remove tail segment if snake is too long
            while (snake.segments.length > snake.length) {
                snake.segments.pop();
            }
            
            // Check for apple collision
            if (snake.targetApple && !snake.targetApple.eaten) {
                const dx = snake.segments[0].x - snake.targetApple.x;
                const dy = snake.segments[0].y - snake.targetApple.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < this.snakesSettings.appleSize) {
                    snake.targetApple.eaten = true;
                    snake.applesEaten++;
                    
                    // Snake grows longer
                    snake.length += 3;
                    if (snake.length > 100) snake.length = 100; // Maximum length cap
                    
                    // Snake gets thicker
                    snake.thickness += 0.5;
                    if (snake.thickness > 24) snake.thickness = 24; // Maximum thickness cap
                    
                    // Snake gets faster
                    snake.speed += 0.05;
                    if (snake.speed > 5) snake.speed = 5; // Maximum speed cap
                }
            }
            
            // Draw snake
            if (glow) {
                this.context.shadowBlur = 10;
                this.context.shadowColor = snake.color;
            }
            
            this.context.strokeStyle = snake.color;
            this.context.lineWidth = snake.thickness * (1 + bassEnergy * 0.3);
            
            // Draw snake body
            this.context.beginPath();
            this.context.moveTo(snake.segments[0].x, snake.segments[0].y);
            
            for (let j = 1; j < snake.segments.length; j++) {
                this.context.lineTo(snake.segments[j].x, snake.segments[j].y);
            }
            
            this.context.stroke();
            
            // Draw snake head
            this.context.fillStyle = snake.color;
            this.circle(
                snake.segments[0].x, 
                snake.segments[0].y, 
                snake.thickness/1.5 * (1 + bassEnergy * 0.3)
            );
            
            this.context.shadowBlur = 0;
        }
    }

    planetSystemVisualizer(x, y, planetSize = 50, moonCount = 5, minMoonSize = 5, maxMoonSize = 15, minOrbitRadius = 70, maxOrbitRadius = 150, planetColor = '#ff9900', moonColors = null, bassFreq = 60, highFreqStart = 500, highFreqEnd = 2000, glow = true) {
        if (!this.context) return;
        
        // Initialize planetary system if it doesn't exist
        if (!this.planetSystem) {
            // Default moon colors if not provided
            const defaultMoonColors = [
                '#88ccff', '#ffff99', '#aaffaa', '#ffaacc', '#ddddff',
                '#99ffee', '#ffcc88', '#ddaaff'
            ];
            
            this.planetSystem = {
                planet: {
                    color: planetColor,
                    size: planetSize,
                    rotation: 0,
                    glowColor: this.adjustColorBrightness(planetColor, 1.3)
                },
                moons: []
            };
            
            // Create moons with varied properties
            for (let i = 0; i < moonCount; i++) {
                const orbitRadius = minOrbitRadius + (maxOrbitRadius - minOrbitRadius) * (i / moonCount);
                const moonSize = minMoonSize + Math.random() * (maxMoonSize - minMoonSize);
                const orbitSpeed = 0.5 + Math.random() * 1.5;
                const moonColor = moonColors ? moonColors[i % moonColors.length] : defaultMoonColors[i % defaultMoonColors.length];
                
                this.planetSystem.moons.push({
                    size: moonSize,
                    orbitRadius: orbitRadius,
                    orbitSpeed: orbitSpeed,
                    orbitAngle: Math.random() * Math.PI * 2,
                    color: moonColor,
                    freq: highFreqStart + (i / moonCount) * (highFreqEnd - highFreqStart),
                    glowColor: this.adjustColorBrightness(moonColor, 1.3),
                    offsetX: 0,
                    offsetY: 0
                });
            }
        }
        
        // Get audio reactivity
        const bassAmplitude = this.getAudioFrequency(bassFreq);
        
        // Draw the planet
        if (glow) {
            this.context.shadowBlur = 20 + bassAmplitude * 15;
            this.context.shadowColor = this.planetSystem.planet.glowColor;
        }
        
        // Draw planet with pulsing size based on bass
        const reactiveSize = this.planetSystem.planet.size * (1 + bassAmplitude * 0.3);
        this.context.fillStyle = this.planetSystem.planet.color;
        this.circle(x, y, reactiveSize);
        
        // Draw planet features - simple bands
        this.context.strokeStyle = this.adjustColorBrightness(this.planetSystem.planet.color, 0.7);
        this.context.lineWidth = 3;
        
        // Create bands on planet that rotate with the audio
        this.context.beginPath();
        for (let i = 0; i < 3; i++) {
            const bandY = y - reactiveSize/2 + reactiveSize * (i+1)/4;
            const bandWidth = reactiveSize * 0.6 * (1 - i * 0.2);
            const bandHeight = reactiveSize * 0.15;
            
            this.context.save();
            this.context.translate(x, bandY);
            this.context.rotate(this.planetSystem.planet.rotation + i * 0.2);
            this.context.scale(1, 0.3); // Flatten to make ellipse
            this.context.beginPath();
            this.context.arc(0, 0, bandWidth/2, 0, Math.PI * 2);
            this.context.restore();
            this.context.stroke();
        }
        
        // Update planet rotation based on audio
        this.planetSystem.planet.rotation += 0.01 * (1 + bassAmplitude);
        
        // Draw orbit paths (optional, subtle)
        this.context.globalAlpha = 0.2;
        for (const moon of this.planetSystem.moons) {
            this.context.beginPath();
            this.context.strokeStyle = moon.color;
            this.context.lineWidth = 1;
            this.context.arc(x, y, moon.orbitRadius, 0, Math.PI * 2);
            this.context.stroke();
        }
        this.context.globalAlpha = 1;
        
        // Update and draw moons
        for (const moon of this.planetSystem.moons) {
            // Get frequency specific to this moon
            const moonAmplitude = this.getAudioFrequency(moon.freq);
            
            // Update moon position
            moon.orbitAngle += moon.orbitSpeed * 0.02 * (1 + moonAmplitude * 2);
            
            // Calculate position with audio-reactive orbit radius
            const orbitRadius = moon.orbitRadius * (1 + bassAmplitude * 0.5);
            const moonX = x + Math.cos(moon.orbitAngle) * orbitRadius;
            const moonY = y + Math.sin(moon.orbitAngle) * orbitRadius;
            
            // Draw the moon
            if (glow) {
                this.context.shadowBlur = 10 + moonAmplitude * 15;
                this.context.shadowColor = moon.glowColor;
            }
            
            const moonSize = moon.size * (1 + moonAmplitude * 0.5);
            this.context.fillStyle = moon.color;
            this.circle(moonX, moonY, moonSize);
            
            // Draw simple crater on moon for detail
            this.context.fillStyle = this.adjustColorBrightness(moon.color, 0.7);
            this.circle(
                moonX + moonSize * 0.3, 
                moonY - moonSize * 0.2, 
                moonSize * 0.3
            );
        }
        
        // Reset shadow
        if (glow) {
            this.context.shadowBlur = 0;
        }
    }
    
    // Add fog visualizer
    fogVisualizer(x, y, width, height, cloudCount = 15, minSize = 80, maxSize = 200, speedFactor = 1, freqStart = 20, freqEnd = 200, density = 0.5, color = 'rgba(255, 255, 255, 0.3)', glow = false) {
        if (!this.context) return;
        
        // Initialize fog particles if they don't exist
        if (!this.fogClouds) {
            this.fogClouds = Array(cloudCount).fill().map(() => ({
                x: x + Math.random() * width,
                y: y + Math.random() * height,
                size: minSize + Math.random() * (maxSize - minSize),
                speed: (0.5 + Math.random()) * speedFactor,
                freq: freqStart + Math.random() * (freqEnd - freqStart),
                alpha: 0.1 + Math.random() * 0.2
            }));
        }
        
        // Save the current context state to restore later
        this.context.save();
        
        // Use a composite operation that allows fog to blend with existing content
        this.context.globalCompositeOperation = 'screen';
        
        if (glow) {
            this.context.shadowBlur = 15;
            this.context.shadowColor = color;
        }
        
        // Parse color to get base components for gradient
        let r = 255, g = 255, b = 255;
        let baseAlpha = density;
        
        if (color.startsWith('rgba')) {
            const parts = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (parts && parts.length >= 5) {
                r = parseInt(parts[1]);
                g = parseInt(parts[2]);
                b = parseInt(parts[3]);
                baseAlpha = parseFloat(parts[4]) * density;
            }
        } else if (color.startsWith('rgb(')) {
            const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (parts && parts.length >= 4) {
                r = parseInt(parts[1]);
                g = parseInt(parts[2]);
                b = parseInt(parts[3]);
            }
        } else if (color.startsWith('#')) {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        }
        
        // Create gradient for depth effect with reduced opacity
        const gradient = this.context.createRadialGradient(
            x + width/2, y + height/2, 0,
            x + width/2, y + height/2, Math.max(width, height)/2
        );
        
        // Add properly formatted color stops with reduced opacity
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${baseAlpha * 0.05})`);
        
        // Fill background with gradient fog
        this.context.fillStyle = gradient;
        this.context.fillRect(x, y, width, height);
        
        // Update and draw individual fog clouds
        this.fogClouds.forEach(cloud => {
            const amplitude = this.getAudioFrequency(cloud.freq);
            
            // Update position with gentle drift
            cloud.x += cloud.speed * (0.5 + amplitude);
            if (cloud.x > x + width + cloud.size) {
                cloud.x = x - cloud.size;
                cloud.y = y + Math.random() * height;
            }
            
            // Draw fog cloud with reduced opacity
            const cloudGradient = this.context.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.size * (1 + amplitude * 0.5)
            );
            
            // Add properly formatted color stops for cloud with reduced opacity
            const cloudAlpha = cloud.alpha * (0.5 + amplitude * 0.5) * 0.7; // Reduce opacity
            cloudGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${cloudAlpha})`);
            cloudGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            this.context.fillStyle = cloudGradient;
            this.circle(cloud.x, cloud.y, cloud.size * (1 + amplitude * 0.5));
        });
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
        
        // Restore the original context state to not affect subsequent rendering
        this.context.restore();
    }

    // Fish Pond Ecosystem Visualizer
    fishPondVisualizer(x, y, width, height, fishCount = 20, pondColor = [20, 80, 120], shoreColor = [194, 178, 128], glow = false) {
        if (!this.context) return;
        
        // Initialize fish pond data if it doesn't exist
        if (!this.fishPondData) {
            this.fishPondData = {
                fishes: [],
                fisherman: {
                    x: x + width * 0.9,
                    y: y + height * 0.3,
                    size: 30,
                    lastCastTime: 0,
                    isCasting: false,
                    catchChance: 0.6
                },
                fishingLine: null,
                ripples: [],
                nextFishId: 0,
                settings: {
                    initialFish: fishCount,
                    pondColor: pondColor,
                    shoreColor: shoreColor,
                    maxFishSize: 30,
                    startSizeRange: [3, 8],
                    respawnTime: 3,
                    growFactor: 1.2,
                    fishingFrequency: 2,
                    fishingDuration: 4
                }
            };
            
            // Create initial fish
            for (let i = 0; i < this.fishPondData.settings.initialFish; i++) {
                this.fishPondData.fishes.push(this.createFish(x, y, width, height, false));
            }
        }
        
        const ctx = this.context;
        const data = this.fishPondData;
        
        // Apply glow if requested
        if (glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgb(${pondColor[0]}, ${pondColor[1]}, ${pondColor[2]})`;
        }
        
        // Draw pond background (already handled by the container, just draw shore)
        /*ctx.fillStyle = `rgb(${data.settings.shoreColor[0]}, ${data.settings.shoreColor[1]}, ${data.settings.shoreColor[2]})`;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.8, y);
        ctx.bezierCurveTo(
            x + width * 0.7, y + height * 0.3,
            x + width * 0.75, y + height * 0.6,
            x + width * 0.8, y + height
        );
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y);
        ctx.closePath();
        ctx.fill();*/
        
        // Get audio reactivity for fish speed modulation
        const bassResponse = this.getAudioFrequency(60);
        const midResponse = this.getAudioFrequency(500);
        
        // Update ripples
        this.updateRipples(data, x, y, width, height);
        
        // Update fisherman actions
        //this.updateFisherman(data, x, y, width, height, bassResponse);
        
        // Update all fish
        this.updateFish(data, x, y, width, height, bassResponse, midResponse);
        
        // Draw fisherman
        //this.drawFisherman(data.fisherman);
        
        if (glow) {
            ctx.shadowBlur = 0;
        }
    }
    
    // Fish pond helper methods
    createFish(x, y, width, height, isRespawn = false) {
        const data = this.fishPondData;
        const settings = data.settings;
        
        // Determine fish size (either starting size or small for respawn)
        const minSize = settings.startSizeRange[0];
        const maxSize = settings.startSizeRange[1];
        const size = minSize + Math.random() * (maxSize - minSize);
        
        // For respawning fish, start tiny and grow to size
        const actualSize = isRespawn ? 0.01 : size;
        
        // Generate random fish color with some variability
        const baseHue = Math.random() * 360;
        const fishColor = [
            Math.floor(100 + Math.random() * 155), // Not too dark
            Math.floor(100 + Math.random() * 155),
            Math.floor(100 + Math.random() * 155)
        ];
        
        // Create the fish object
        return {
            id: data.nextFishId++,
            x: x + Math.random() * width * 0.7, // Keep away from shore
            y: y + Math.random() * height,
            size: actualSize,
            targetSize: size,  // Size to grow to (for respawning animation)
            angle: Math.random() * Math.PI * 2,
            speed: 1 + Math.random() * 2,
            turnSpeed: 0.02 + Math.random() * 0.06,
            color: fishColor,
            targetX: null,
            targetY: null,
            targetTime: 0,
            caught: false,
            tailAngle: 0,
            tailSpeed: 5 + Math.random() * 5,
            respawnTime: isRespawn ? Date.now() / 1000 + settings.respawnTime * Math.random() : 0,
            respawning: isRespawn
        };
    }
    
    updateFish(data, x, y, width, height, bassResponse, midResponse) {
        const now = Date.now() / 1000; // Current time in seconds
        
        for (let i = data.fishes.length - 1; i >= 0; i--) {
            const fish = data.fishes[i];
            
            // Handle respawning fish
            if (fish.respawning) {
                // Check if it's time to start growing
                if (now >= fish.respawnTime) {
                    // Grow gradually to target size
                    fish.size = fish.size * 0.9 + fish.targetSize * 0.1;
                    
                    // When close enough to target size, finish respawning
                    if (fish.size > fish.targetSize * 0.95) {
                        fish.size = fish.targetSize;
                        fish.respawning = false;
                    }
                }
            }
            
            // Skip further updates for fish still waiting to respawn
            if (fish.respawnTime > now) continue;
            
            // Update fish behavior
            this.updateFishBehavior(fish, data, x, y, width, height, now, bassResponse);
            
            // Move the fish if not caught
            if (!fish.caught) {
                this.moveFish(fish, x, y, width, height, bassResponse);
                
                // Check for eating other fish
                for (let j = data.fishes.length - 1; j >= 0; j--) {
                    if (i !== j && this.canEat(fish, data.fishes[j])) {
                        this.eatFish(fish, data.fishes[j], data, i, j, x, y, width, height);
                        break; // Stop after eating one fish
                    }
                }
            }
            else {
                // If caught, move to fishing line hook
                if (data.fishingLine) {
                    fish.x = data.fishingLine.hookX;
                    fish.y = data.fishingLine.hookY;
                }
            }
            
            // Draw the fish
            this.drawFish(fish, midResponse);
        }
    }
    
    canEat(fish1, fish2) {
        // Can't eat if either fish is caught or respawning
        if (fish1.caught || fish2.caught || fish1.respawning || fish2.respawning) return false;
        
        // Fish must be significantly bigger to eat another fish
        if (fish1.size > fish2.size * 1.5) {
            const dx = fish1.x - fish2.x;
            const dy = fish1.y - fish2.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            // Fish needs to be close enough to eat
            return distance < fish1.size;
        }
        return false;
    }
    
    eatFish(fish1, fish2, data, index1, index2, x, y, width, height) {
        // Grow the fish that ate (with maximum size limit)
        fish1.size = Math.min(data.settings.maxFishSize, fish1.size * data.settings.growFactor);
        
        // Create ripple effect where fish was eaten
        this.createRipple(data, fish2.x, fish2.y, 10, fish2.color);
        
        // Add a respawning fish
        data.fishes.push(this.createFish(x, y, width, height, true));
        
        // Remove the eaten fish
        data.fishes.splice(index2, 1);
    }
    
    updateFishBehavior(fish, data, x, y, width, height, now, bassResponse) {
        // Find new target occasionally or if reached current target
        if (fish.targetTime < now || 
            (fish.targetX !== null && 
             this.distanceBetween(fish.x, fish.y, fish.targetX, fish.targetY) < fish.size)) {
            
            // Choose a behavior
            const behavior = Math.random();
            
            if (behavior < 0.7) {
                // Random swimming
                fish.targetX = x + Math.random() * width * 0.7; // Stay away from shore
                fish.targetY = y + Math.random() * height;
            } 
            else if (behavior < 0.85 && data.fishes.length > 1) {
                // Chase smaller fish
                const targets = data.fishes.filter(other => 
                    other !== fish && other.size < fish.size * 0.7 && !other.respawning);
                
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    fish.targetX = target.x;
                    fish.targetY = target.y;
                }
            } 
            else {
                // Avoid bigger fish
                const threats = data.fishes.filter(other => 
                    other !== fish && other.size > fish.size * 1.5 && !other.respawning);
                
                if (threats.length > 0) {
                    const threat = threats[Math.floor(Math.random() * threats.length)];
                    // Swim away from threat
                    const dx = fish.x - threat.x;
                    const dy = fish.y - threat.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    fish.targetX = fish.x + (dx/dist) * 100;
                    fish.targetY = fish.y + (dy/dist) * 100;
                }
            }
            
            // Set new target time
            fish.targetTime = now + 1 + Math.random() * 2;
        }
        
        // Avoid fishing hook
        this.avoidFishingHook(fish, data);
        
        // Avoid shore (right side)
        if (fish.x > x + width * 0.75) {
            fish.targetX = x + width * 0.7;
        }
    }
    
    moveFish(fish, x, y, width, height, bassResponse) {
        // Update speed based on audio
        const speedMultiplier = 1 + bassResponse * 2;
        
        // Update tail animation
        fish.tailAngle = Math.sin(Date.now() / 200 * fish.tailSpeed) * 0.3;
        
        // If fish has a target, swim toward it
        if (fish.targetX !== null && fish.targetY !== null) {
            const dx = fish.targetX - fish.x;
            const dy = fish.targetY - fish.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Gradually turn toward target
            let angleChange = targetAngle - fish.angle;
            
            // Normalize angle change to -PI to PI
            while (angleChange > Math.PI) angleChange -= Math.PI * 2;
            while (angleChange < -Math.PI) angleChange += Math.PI * 2;
            
            // Limit turning speed
            angleChange = Math.max(-fish.turnSpeed, Math.min(fish.turnSpeed, angleChange));
            fish.angle += angleChange;
        }
        
        // Move forward with audio-reactive speed
        fish.x += Math.cos(fish.angle) * fish.speed * speedMultiplier;
        fish.y += Math.sin(fish.angle) * fish.speed * speedMultiplier;
        
        // Wrap around screen edges
        if (fish.x < x - fish.size) fish.x = x + width + fish.size;
        if (fish.x > x + width + fish.size) fish.x = x - fish.size;
        if (fish.y < y - fish.size) fish.y = y + height + fish.size;
        if (fish.y > y + height + fish.size) fish.y = y - fish.size;
    }
    
    drawFish(fish, midResponse) {
        // Don't draw zero-size fish (just starting respawn)
        if (fish.size < 0.1) return;
        
        const ctx = this.context;
        
        // Save context state
        ctx.save();
        
        // Move to fish position and rotate
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.angle);
        
        // Get fish size (adjust for respawning animation)
        const s = fish.size;
        
        // Add audio reactivity to color
        const colorIntensity = 1 + midResponse * 0.5;
        const r = Math.min(255, Math.floor(fish.color[0] * colorIntensity));
        const g = Math.min(255, Math.floor(fish.color[1] * colorIntensity));
        const b = Math.min(255, Math.floor(fish.color[2] * colorIntensity));
        
        // Draw fish body
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail
        ctx.save();
        ctx.rotate(fish.tailAngle);
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, 0);
        ctx.lineTo(-s * 1.5, -s * 0.6);
        ctx.lineTo(-s * 1.5, s * 0.6);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fill();
        ctx.restore();
        
        // Draw eye
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(s * 0.3, -s * 0.15, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(s * 0.35, -s * 0.15, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
    
    avoidFishingHook(fish, data) {
        if (!data.fishingLine) return;
        
        const distToHook = this.distanceBetween(fish.x, fish.y, data.fishingLine.hookX, data.fishingLine.hookY);
        
        // Skip if already caught or hook is too far
        if (fish.caught || distToHook > 50) return;
        
        // Small fish might bite hook (bigger chance for smaller fish)
        if (fish.size < 15) {
            const biteChance = 0.002 / (fish.size / 10);
            
            if (Math.random() < biteChance) {
                // Fish caught!
                fish.caught = true;
                data.fishingLine.hasCatch = true;
                this.createRipple(data, data.fishingLine.hookX, data.fishingLine.hookY, 15);
            }
        }
        
        // Medium and large fish avoid the hook
        if (fish.size > 10 && distToHook < 30) {
            // Swim away from hook
            const dx = fish.x - data.fishingLine.hookX;
            const dy = fish.y - data.fishingLine.hookY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            fish.targetX = fish.x + (dx/dist) * 50;
            fish.targetY = fish.y + (dy/dist) * 50;
        }
    }
    
    createRipple(data, x, y, size, color = [255, 255, 255]) {
        data.ripples.push({
            x: x,
            y: y,
            color: color,
            maxSize: size * 3,
            size: size,
            alpha: 0.7,
            growth: size * 0.7
        });
    }
    
    updateRipples(data) {
        for (let i = data.ripples.length - 1; i >= 0; i--) {
            const ripple = data.ripples[i];
            
            // Grow ripple
            ripple.size += ripple.growth;
            ripple.alpha -= 0.02;
            
            // Draw ripple
            const ctx = this.context;
            ctx.strokeStyle = `rgba(${ripple.color[0]}, ${ripple.color[1]}, ${ripple.color[2]}, ${ripple.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
            ctx.stroke();
            
            // Remove faded ripples
            if (ripple.alpha <= 0 || ripple.size >= ripple.maxSize) {
                data.ripples.splice(i, 1);
            }
        }
    }
    
    updateFisherman(data, x, y, width, height, bassResponse) {
        const now = Date.now() / 1000;
        
        // Cast fishing line occasionally, with frequency influenced by audio
        const fishingFrequency = data.settings.fishingFrequency / (1 + bassResponse * 0.5);
        
        if (!data.fishingLine && now - data.fisherman.lastCastTime > fishingFrequency) {
            this.castFishingLine(data, x, y, width, height, now);
        }
        
        // Update existing fishing line
        if (data.fishingLine) {
            // Check if line has been in water long enough
            const fishingDuration = data.settings.fishingDuration / (1 + bassResponse * 0.5);
            
            if (now - data.fishingLine.castTime > fishingDuration || data.fishingLine.hasCatch) {
                // Reel in the line
                this.reelInFishingLine(data, x, y, width, height);
            }
            
            // Draw fishing line
            this.drawFishingLine(data);
        }
    }
    
    castFishingLine(data, x, y, width, height, now) {
        // Choose a random spot to cast
        const castX = x + width * 0.3 + Math.random() * (width * 0.4);
        const castY = y + height * 0.2 + Math.random() * (height * 0.6);
        
        data.fishingLine = {
            castTime: now,
            reelTime: null,
            hookX: castX,
            hookY: castY,
            hasCatch: false
        };
        
        // Create ripple at cast location
        this.createRipple(data, castX, castY, 20);
        
        // Update last cast time
        data.fisherman.lastCastTime = now;
    }
    
    reelInFishingLine(data, x, y, width, height) {
        // If we caught a fish, deal with it
        if (data.fishingLine.hasCatch) {
            for (let i = 0; i < data.fishes.length; i++) {
                if (data.fishes[i].caught) {
                    // Check if fish is small or large
                    if (data.fishes[i].size < 15) {
                        // Throw small fish back - it gets a second chance
                        data.fishes[i].caught = false;
                        this.createRipple(data, data.fishingLine.hookX, data.fishingLine.hookY, 15);
                    } else {
                        // Keep big fish - it's replaced by a new baby fish
                        this.createRipple(data, data.fishingLine.hookX, data.fishingLine.hookY, data.fishes[i].size);
                        // Create a new fish to replace it
                        data.fishes.push(this.createFish(x, y, width, height, true));
                        // Remove caught fish
                        data.fishes.splice(i, 1);
                    }
                    break;
                }
            }
        }
        
        // Remove fishing line
        data.fishingLine = null;
    }
    
    drawFishingLine(data) {
        if (!data.fishingLine) return;
        
        const ctx = this.context;
        
        // Draw line from fisherman to hook
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(data.fisherman.x, data.fisherman.y);
        ctx.lineTo(data.fishingLine.hookX, data.fishingLine.hookY);
        ctx.stroke();
        
        // Draw hook
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.beginPath();
        ctx.arc(data.fishingLine.hookX, data.fishingLine.hookY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFisherman(fisherman) {
        const ctx = this.context;
        const x = fisherman.x;
        const y = fisherman.y;
        const size = fisherman.size;
        
        // Draw body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - size/4, y - size/2, size/2, size);
        
        // Draw head
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x, y - size/2, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fishing rod
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y - size/4);
        ctx.lineTo(x - size, y - size);
        ctx.stroke();
    }
    
    // Utility function to calculate distance between two points
    distanceBetween(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    }
    
    // Add nebula visualizer
    nebulaVisualizer(x, y, width, height, density = 5, starCount = 100, hue = 240, freqStart = 20, freqEnd = 2000, glow = true) {
        if (!this.context) return;
        
        // Initialize nebula data if it doesn't exist
        if (!this.nebulaData) {
            this.nebulaData = {
                // Generate perlin noise grid for the nebula cloud
                noiseGrid: Array(density).fill().map(() => 
                    Array(density).fill().map(() => Math.random())
                ),
                // Stars in the nebula
                stars: Array(starCount).fill().map(() => ({
                    x: x + Math.random() * width,
                    y: y + Math.random() * height,
                    size: 0.5 + Math.random() * 2,
                    brightness: 0.5 + Math.random() * 0.5,
                    freq: freqStart + Math.random() * (freqEnd - freqStart),
                    twinkle: Math.random() * Math.PI * 2
                })),
                // Base hue
                hue: hue
            };
        }
        
        // Create the nebula cloud using noise grid
        const cellWidth = width / density;
        const cellHeight = height / density;
        
        // Get overall bass response for cloud movement
        const bassResponse = this.getAudioFrequency(60);
        const midResponse = this.getAudioFrequency(500);
        const highResponse = this.getAudioFrequency(2000);
        
        // Draw background nebula
        for (let i = 0; i < density; i++) {
            for (let j = 0; j < density; j++) {
                // Get noise value with some audio-reactive movement
                const noiseValue = this.nebulaData.noiseGrid[i][j] + bassResponse * 0.3;
                
                // Skip low-density areas
                if (noiseValue < 0.4) continue;
                
                // Vary color based on position and audio
                const colorHue = (this.nebulaData.hue + midResponse * 30 + i * 5 + j * 5) % 360;
                const saturation = 70 + highResponse * 30;
                const lightness = 20 + noiseValue * 30;
                const alpha = noiseValue * 0.4;
                
                // Create gradient for cloud
                const centerX = x + i * cellWidth + cellWidth/2;
                const centerY = y + j * cellHeight + cellHeight/2;
                const radius = Math.max(cellWidth, cellHeight) * (0.5 + bassResponse * 0.5);
                
                const gradient = this.context.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                
                gradient.addColorStop(0, `hsla(${colorHue}, ${saturation}%, ${lightness}%, ${alpha})`);
                gradient.addColorStop(1, `hsla(${colorHue}, ${saturation}%, ${lightness}%, 0)`);
                
                this.context.fillStyle = gradient;
                this.context.fillRect(
                    centerX - radius, centerY - radius,
                    radius * 2, radius * 2
                );
            }
        }
        
        // Draw stars
        this.nebulaData.stars.forEach(star => {
            const amplitude = this.getAudioFrequency(star.freq);
            
            // Update twinkle animation
            star.twinkle += 0.05 + amplitude * 0.1;
            
            // Draw star with audio-reactive size and brightness
            const starSize = star.size * (1 + amplitude * 2);
            const brightness = star.brightness * (0.7 + 0.3 * Math.sin(star.twinkle) + amplitude * 0.5);
            
            if (glow) {
                this.context.shadowBlur = 5 + amplitude * 10;
                this.context.shadowColor = `rgba(255, 255, 255, ${brightness})`;
            }
            
            this.context.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.circle(star.x, star.y, starSize);
            
            // Add cross glow for brighter stars
            if (brightness > 0.8) {
                this.context.globalAlpha = brightness * 0.3;
                this.context.beginPath();
                this.context.moveTo(star.x - starSize * 3, star.y);
                this.context.lineTo(star.x + starSize * 3, star.y);
                this.context.moveTo(star.x, star.y - starSize * 3);
                this.context.lineTo(star.x, star.y + starSize * 3);
                this.context.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
                this.context.lineWidth = starSize * 0.5;
                this.context.stroke();
                this.context.globalAlpha = 1;
            }
        });
        
        if (glow) {
            this.context.shadowBlur = 0;
        }
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

    circle(x, y, radius, outline = false) {
        return this.interpreter.circle(x, y, radius, outline);
    }
    
    line(x1, y1, x2, y2) {
        return this.interpreter.line(x1, y1, x2, y2);
    }

    // 3D Visualizers
    // Simplified 3D bar visualizer with reduced complexity
    visualCircularBar3D(centerX = 0, centerY = 0, centerZ = 0, radius = 100, barCount = 32, 
        minHeight = 5, maxHeight = 100, barWidth = 5, 
        freqStart = 60, freqEnd = 5000, 
        rotationX = 0, rotationY = 0, rotationZ = 0, 
        colorStart = '#FF0000', colorEnd = '#0000FF', 
        glow = false) {
        if (!this.interpreter.context) return;
    
        // Clear existing 3D points to prevent memory issues
        this.interpreter.clear3D();
    
        // Apply glow effect if requested
        if (glow) {
            this.interpreter.glowStart(colorStart, 15);
        }
    
        // Create bars arranged in a circle - with reduced complexity
        const angleStep = (Math.PI * 2) / barCount;
    
        // Pre-calculate rotation matrices for better performance
        const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
        const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
        const cosZ = Math.cos(rotationZ), sinZ = Math.sin(rotationZ);
    
        // Calculate maximum bar count based on performance
        const adjustedBarCount = Math.min(barCount, 48); // Reduced from 64 for better performance
    
        for (let i = 0; i < adjustedBarCount; i++) {
            // Calculate angle for this bar
            const angle = i * angleStep;
    
            // Calculate frequency for this bar (logarithmic distribution for better bass response)
            const frequencyFactor = i / (adjustedBarCount - 1);
            const freq = freqStart * Math.pow(freqEnd / freqStart, frequencyFactor);
    
            // Get amplitude for this frequency
            const amplitude = this.getAudioFrequency(freq);
    
            // Calculate bar height with audio reactivity
            const barHeight = minHeight + amplitude * (maxHeight - minHeight);
    
            // Skip rendering very small bars for performance
            if (barHeight < minHeight + 2) continue;
    
            // Calculate bar position on the circle
            let barX = centerX + Math.cos(angle) * radius;
            let barY = centerY;
            let barZ = centerZ + Math.sin(angle) * radius;
    
            // Interpolate color based on frequency
            const color = this.interpolateColor(colorStart, colorEnd, frequencyFactor);
    
            // Apply rotation to position directly for better performance
            if (rotationX !== 0 || rotationY !== 0 || rotationZ !== 0) {
                // Apply rotations to bar position (not individual points)
                // Translate relative to center
                let x = barX - centerX;
                let y = barY - centerY; 
                let z = barZ - centerZ;
    
                // Apply rotations using pre-calculated values
                let tempX, tempY, tempZ;
    
                // X rotation (pitch)
                tempY = y * cosX - z * sinX;
                tempZ = y * sinX + z * cosX;
                y = tempY;
                z = tempZ;
    
                // Y rotation (yaw)
                tempX = x * cosY + z * sinY;
                tempZ = -x * sinY + z * cosY;
                x = tempX;
                z = tempZ;
    
                // Z rotation (roll)
                tempX = x * cosZ - y * sinZ;
                tempY = x * sinZ + y * cosZ;
                x = tempX;
                y = tempY;
    
                // Update bar position
                barX = x + centerX;
                barY = y + centerY;
                barZ = z + centerZ;
            }
    
            // Create a simplified 3D bar with fewer points
            this.createSimpleBar3D(
                barX, barY, barZ,
                barWidth, barHeight, barWidth,
                color, angle
            );
        }
    
        // End glow effect
        if (glow) {
            this.interpreter.glowEnd();
        }
    
        // Draw the 3D points
        this.interpreter.draw3D();
    }
    
    createSimpleBar3D(x, y, z, width, height, depth, color, angle = 0) {
        // Skip rendering if height is negligible
        if (height < 1) return;
        
        // Create a simplified bar using fewer 3D points
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
    
        // Calculate corner offsets with rotation around y-axis
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
    
        // Define the 8 corners of the bar - only create key points
        const corners = [
            // Bottom corners
            { x: x - halfWidth * cosA - halfDepth * sinA, y: y, z: z - halfWidth * sinA + halfDepth * cosA },
            { x: x + halfWidth * cosA - halfDepth * sinA, y: y, z: z + halfWidth * sinA + halfDepth * cosA },
            { x: x + halfWidth * cosA + halfDepth * sinA, y: y, z: z + halfWidth * sinA - halfDepth * cosA },
            { x: x - halfWidth * cosA + halfDepth * sinA, y: y, z: z - halfWidth * sinA - halfDepth * cosA },
    
            // Top corners
            { x: x - halfWidth * cosA - halfDepth * sinA, y: y - height, z: z - halfWidth * sinA + halfDepth * cosA },
            { x: x + halfWidth * cosA - halfDepth * sinA, y: y - height, z: z + halfWidth * sinA + halfDepth * cosA },
            { x: x + halfWidth * cosA + halfDepth * sinA, y: y - height, z: z + halfWidth * sinA - halfDepth * cosA },
            { x: x - halfWidth * cosA + halfDepth * sinA, y: y - height, z: z - halfWidth * sinA - halfDepth * cosA }
        ];
    
        // Draw simplified bar - just draw lines, skip the points for better performance
        // Bottom face
        this.interpreter.line3D(corners[0], corners[1], color);
        this.interpreter.line3D(corners[1], corners[2], color);
        this.interpreter.line3D(corners[2], corners[3], color);
        this.interpreter.line3D(corners[3], corners[0], color);
    
        // Top face
        this.interpreter.line3D(corners[4], corners[5], color);
        this.interpreter.line3D(corners[5], corners[6], color);
        this.interpreter.line3D(corners[6], corners[7], color);
        this.interpreter.line3D(corners[7], corners[4], color);
    
        // Vertical edges
        this.interpreter.line3D(corners[0], corners[4], color);
        this.interpreter.line3D(corners[1], corners[5], color);
        this.interpreter.line3D(corners[2], corners[6], color);
        this.interpreter.line3D(corners[3], corners[7], color);
    }

    // 3D sphere audio visualizer
    sphere3DAudioVisualizer(centerX = 0, centerY = 0, centerZ = 0, minRadius = 50, maxRadius = 150, particleCount = 100, freqStart = 20, freqEnd = 2000, glow = false) {
        if (!window.audioProcessor) return;
        
        const ctx = this.interpreter.context;
        if (!ctx) return;
        
        const amplitudes = [];
        const freqStep = (freqEnd - freqStart) / particleCount;
        
        // Calculate audio amplitudes
        for (let i = 0; i < particleCount; i++) {
            const freq = freqStart + i * freqStep;
            const amplitude = window.audioProcessor.getAudioFrequency(freq);
            amplitudes.push(amplitude);
        }
        
        // Apply glow effect if requested
        if (glow) {
            this.interpreter.glowStart(ctx.fillStyle, 10);
        }
        
        // Create the points in 3D space
        this.interpreter.clear3D();
        
        for (let i = 0; i < particleCount; i++) {
            // Create spherical distribution
            const amplitude = 0.2 + amplitudes[i] * 0.8; // Min 0.2 to always show something
            const radius = minRadius + (maxRadius - minRadius) * amplitude;
            
            // Use golden ratio for even point distribution on sphere
            const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            
            // Convert to cartesian coordinates
            const x = centerX + radius * Math.cos(theta) * Math.sin(phi);
            const y = centerY + radius * Math.sin(theta) * Math.sin(phi);
            const z = centerZ + radius * Math.cos(phi);
            
            // Color based on frequency and amplitude
            const hue = (i / particleCount) * 360;
            const brightness = 50 + amplitude * 50;
            const color = `hsl(${hue}, 100%, ${brightness}%)`;
            
            // Size based on amplitude
            const size = 1 + amplitude * 4;
            
            // Add the point
            this.interpreter.point3D(x, y, z, size, color);
        }
        
        // Draw the 3D points
        this.interpreter.draw3D();
        
        // End glow effect
        if (glow) {
            this.interpreter.glowEnd();
        }
    }

    interpolateColor(colorStart, colorEnd, factor) {
        // Fast path for common cases
        if (factor <= 0) return colorStart;
        if (factor >= 1) return colorEnd;
        
        // Parse start color
        let r1, g1, b1;
        if (colorStart.startsWith('#')) {
            r1 = parseInt(colorStart.substring(1, 3), 16);
            g1 = parseInt(colorStart.substring(3, 5), 16);
            b1 = parseInt(colorStart.substring(5, 7), 16);
        } else {
            r1 = 255;
            g1 = 0;
            b1 = 0;
        }
        
        // Parse end color
        let r2, g2, b2;
        if (colorEnd.startsWith('#')) {
            r2 = parseInt(colorEnd.substring(1, 3), 16);
            g2 = parseInt(colorEnd.substring(3, 5), 16);
            b2 = parseInt(colorEnd.substring(5, 7), 16);
        } else {
            r2 = 0;
            g2 = 0;
            b2 = 255;
        }
        
        // Linear interpolation
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));
        
        // Convert to hex
        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    }
}

// Export the Visualizers class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizers;
}