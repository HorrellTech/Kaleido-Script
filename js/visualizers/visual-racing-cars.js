/**
 * Racing Cars Visualizer with audio-reactive drifting physics
 * 
 * @param {Number} x - X position of the visualizer
 * @param {Number} y - Y position of the visualizer 
 * @param {Number} width - Width of the visualizer area
 * @param {Number} height - Height of the visualizer area
 * @param {Number} carCount - Number of cars to display (default: 4)
 * @param {Number} turnFreq - Frequency for turn audio reactivity (default: 100)
 * @param {Number} driftFreq - Frequency for drift audio reactivity (default: 300)
 * @param {Number} speedFreq - Frequency for speed audio reactivity (default: 60)
 * @param {Boolean} glow - Whether to apply glow effects (default: false)
 */
racingCarsVisualizer(x, y, width, height, carCount = 4, turnFreq = 100, driftFreq = 300, speedFreq = 60, glow = false) {
    if (!this.context) return;
    
    const ctx = this.context;
    
    // Initialize persistent data for track and cars
    if (!this.racingData) {
        this.racingData = {
            trackCanvas: document.createElement('canvas'),
            trackCtx: null,
            cars: [],
            physics: {
                maxSpeed: 4,
                acceleration: 0.1,
                friction: 0.97,
                handling: 0.05,
                driftFactor: 0.3,
                carSize: 10
            },
            lastUpdate: Date.now()
        };
        
        // Set up the track canvas
        this.racingData.trackCanvas.width = width;
        this.racingData.trackCanvas.height = height;
        this.racingData.trackCtx = this.racingData.trackCanvas.getContext('2d');
        this.racingData.trackCtx.fillStyle = 'rgba(5, 5, 10, 1)';
        this.racingData.trackCtx.fillRect(0, 0, width, height);
        
        // Create cars
        for (let i = 0; i < carCount; i++) {
            // Generate vibrant car colors with hue spread
            const hue = (i * 360 / carCount) % 360;
            const color = this.hslToRgb(hue, 0.8, 0.5);
            
            this.racingData.cars.push({
                color: color,
                x: x + Math.random() * width * 0.8 + width * 0.1,
                y: y + Math.random() * height * 0.8 + height * 0.1,
                angle: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2,
                turnAngle: 0,
                drift: 0,
                directionChangeTime: Date.now() + Math.random() * 3000,
                turnDirection: Math.random() * 2 - 1
            });
        }
    }
    
    // Check if canvas needs resizing
    if (this.racingData.trackCanvas.width !== width || 
        this.racingData.trackCanvas.height !== height) {
        
        this.racingData.trackCanvas.width = width;
        this.racingData.trackCanvas.height = height;
        
        // Reset track canvas with dark background
        this.racingData.trackCtx.fillStyle = 'rgba(5, 5, 10, 1)';
        this.racingData.trackCtx.fillRect(0, 0, width, height);
    }
    
    // Draw the track (tire marks) first
    ctx.drawImage(this.racingData.trackCanvas, x, y);
    
    // Gradually fade the track marks over time by applying a transparent layer
    if (Math.random() < 0.03) { // Only fade occasionally for better performance
        this.racingData.trackCtx.fillStyle = 'rgba(5, 5, 10, 0.1)';
        this.racingData.trackCtx.fillRect(0, 0, width, height);
    }
    
    // Calculate delta time for smooth animation
    const now = Date.now();
    const deltaTime = Math.min(32, now - this.racingData.lastUpdate) / 16;
    this.racingData.lastUpdate = now;
    
    // Get audio frequency data
    const turnAmplitude = this.getAudioFrequency(turnFreq) || 0.1;
    const driftAmplitude = this.getAudioFrequency(driftFreq) || 0.1;
    const speedAmplitude = this.getAudioFrequency(speedFreq) || 0.1;
    
    // Apply glow effect if requested
    if (glow) {
        ctx.shadowColor = 'rgba(80, 80, 255, 0.8)';
        ctx.shadowBlur = 10;
    }
    
    // Update and draw all cars
    this.racingData.cars.forEach(car => {
        // Update car direction based on audio and time
        if (now > car.directionChangeTime) {
            car.turnDirection = turnAmplitude * 2 * (Math.random() * 2 - 1);
            car.directionChangeTime = now + 500 + Math.random() * 2000;
        }
        
        // Apply audio-reactive physics
        this.updateCarPhysics(car, x, y, width, height, turnAmplitude, driftAmplitude, speedAmplitude, deltaTime);
        
        // Draw car
        this.drawRacingCar(car, ctx);
    });
    
    // Handle collisions between cars
    this.handleCarCollisions(x, y);
    
    // Reset shadow effect
    if (glow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
},

// Convert HSL to RGB for color generation
hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1/3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
},

updateCarPhysics(car, x, y, width, height, turnAmplitude, driftAmplitude, speedAmplitude, deltaTime) {
    const physics = this.racingData.physics;
    
    // Audio-reactive turning
    const turnStrength = car.turnDirection * (0.2 + turnAmplitude * 0.8);
    car.turnAngle = turnStrength;
    
    // Audio-reactive drifting factor
    const effectiveDriftFactor = physics.driftFactor * (0.5 + driftAmplitude * 2);
    
    // Audio-reactive speed
    const baseSpeed = physics.maxSpeed * (0.5 + speedAmplitude * 1.5);
    
    // Apply physics
    // Speed adjustments
    car.speed = Math.min(baseSpeed, car.speed * physics.friction + physics.acceleration);
    
    // Turn the car
    car.angle += car.turnAngle * (physics.handling + car.speed * 0.01) * deltaTime;
    
    // Calculate drift - more drift at higher speeds and turns
    const turnIntensity = Math.abs(car.turnAngle);
    const targetDrift = turnIntensity * car.speed * effectiveDriftFactor;
    car.drift = car.drift * 0.9 + targetDrift * 0.1;
    
    // Calculate movement angle (with drift)
    const moveAngle = car.angle + car.drift;
    
    // Move car
    car.x += Math.cos(moveAngle) * car.speed * deltaTime;
    car.y += Math.sin(moveAngle) * car.speed * deltaTime;
    
    // Wrap around edges
    if (car.x < x) car.x = x + width;
    if (car.x > x + width) car.x = x;
    if (car.y < y) car.y = y + height;
    if (car.y > y + height) car.y = y;
    
    // Add tire marks when drifting
    if (Math.abs(car.drift) > 0.05) {
        this.addTireMarks(car);
    }
},

addTireMarks(car) {
    if (!this.racingData.trackCtx) return;
    
    const trackCtx = this.racingData.trackCtx;
    const carSize = this.racingData.physics.carSize;
    
    // Calculate wheel positions
    const wheelDistance = carSize * 0.8;
    const wheelOffset = carSize * 0.4;
    
    // Back wheels position (where drift marks come from)
    const leftWheelX = car.x - Math.cos(car.angle) * wheelDistance - Math.sin(car.angle) * wheelOffset;
    const leftWheelY = car.y - Math.sin(car.angle) * wheelDistance + Math.cos(car.angle) * wheelOffset;
    
    const rightWheelX = car.x - Math.cos(car.angle) * wheelDistance + Math.sin(car.angle) * wheelOffset;
    const rightWheelY = car.y - Math.sin(car.angle) * wheelDistance - Math.cos(car.angle) * wheelOffset;
    
    // Drift intensity affects mark opacity
    const driftIntensity = Math.min(1, Math.abs(car.drift) * 5);
    
    // Draw standard tire marks
    trackCtx.fillStyle = `rgba(30, 30, 30, ${driftIntensity * 0.4})`;
    
    // Left wheel mark
    trackCtx.beginPath();
    trackCtx.arc(leftWheelX, leftWheelY, 2 + driftIntensity, 0, Math.PI * 2);
    trackCtx.fill();
    
    // Right wheel mark
    trackCtx.beginPath();
    trackCtx.arc(rightWheelX, rightWheelY, 2 + driftIntensity, 0, Math.PI * 2);
    trackCtx.fill();
    
    // Add colored marks with high drift or audio reactivity
    if (driftIntensity > 0.5) {
        trackCtx.fillStyle = `rgba(${car.color[0]}, ${car.color[1]}, ${car.color[2]}, 0.2)`;
        trackCtx.beginPath();
        trackCtx.arc(leftWheelX, leftWheelY, 4 + driftIntensity * 2, 0, Math.PI * 2);
        trackCtx.fill();
        trackCtx.beginPath();
        trackCtx.arc(rightWheelX, rightWheelY, 4 + driftIntensity * 2, 0, Math.PI * 2);
        trackCtx.fill();
    }
},

drawRacingCar(car, ctx) {
    const carSize = this.racingData.physics.carSize;
    const carWidth = carSize * 2;
    const carHeight = carSize;
    
    ctx.save();
    
    // Position and rotate car
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    
    // Draw car body with car's color
    ctx.fillStyle = `rgb(${car.color[0]}, ${car.color[1]}, ${car.color[2]})`;
    ctx.beginPath();
    ctx.roundRect(-carWidth/2, -carHeight/2, carWidth, carHeight, 3);
    ctx.fill();
    
    // Draw windshield effect
    ctx.fillStyle = "rgba(160, 220, 255, 0.8)";
    ctx.fillRect(carWidth/6, -carHeight/2, carWidth/3, carHeight);
    
    // Draw drift trail indicator when drifting
    if (Math.abs(car.drift) > 0.05) {
        ctx.strokeStyle = `rgba(${car.color[0]}, ${car.color[1]}, ${car.color[2]}, 0.7)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-carWidth/2, -carHeight/2);
        ctx.lineTo(-carWidth/2 - car.drift * 15, -carHeight/2);
        ctx.moveTo(-carWidth/2, carHeight/2);
        ctx.lineTo(-carWidth/2 - car.drift * 15, carHeight/2);
        ctx.stroke();
    }
    
    ctx.restore();
},

handleCarCollisions(x, y) {
    const cars = this.racingData.cars;
    const carSize = this.racingData.physics.carSize;
    const collisionDistance = carSize * 2;
    
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            const car1 = cars[i];
            const car2 = cars[j];
            
            // Calculate distance between cars
            const dx = car2.x - car1.x;
            const dy = car2.y - car1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for collision
            if (distance < collisionDistance) {
                // Calculate collision angle
                const angle = Math.atan2(dy, dx);
                
                // Move cars apart
                const overlap = (collisionDistance - distance) / 2;
                car1.x -= Math.cos(angle) * overlap;
                car1.y -= Math.sin(angle) * overlap;
                car2.x += Math.cos(angle) * overlap;
                car2.y += Math.sin(angle) * overlap;
                
                // Exchange speed and add drift effects
                const tempSpeed = car1.speed;
                car1.speed = car2.speed * 0.5;
                car2.speed = tempSpeed * 0.5;
                
                car1.drift -= Math.cos(angle) * 0.3;
                car2.drift += Math.cos(angle) * 0.3;
                
                // Draw collision effect
                this.context.fillStyle = "rgba(255, 255, 200, 0.7)";
                this.context.beginPath();
                this.context.arc((car1.x + car2.x) / 2, (car1.y + car2.y) / 2, 8, 0, Math.PI * 2);
                this.context.fill();
            }
        }
    }
}