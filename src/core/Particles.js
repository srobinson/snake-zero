import { effectsConfig } from '../config/effectsConfig.js';

/**
 * Individual ripple/shockwave effect
 * @class
 */
class Effect {
    constructor(p5, x, y, config, cellSize) {
        this.p5 = p5;
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.birth = p5.millis();
        this.lifetime = config.lifetime || 500;
        this.type = config.type || 'ripple';
        this.color = config.color || '#FFFFFF';
        this.alpha = 255;
        this.velocity = p5.createVector(0, 0);
        this.acceleration = p5.createVector(0, 0);
        this.trailPoints = []; // For particle trails
        this.glowIntensity = config.glowIntensity || 1;

        if (this.type === 'score') {
            this.score = config.score || 0;
            this.multiplier = config.multiplier || 1;
            this.finalScore = this.score * this.multiplier;
            // Start position further below center for more dramatic movement
            this.y += cellSize * 1.2;
            this.z = -100; // Start behind the screen
            // More dramatic upward movement
            this.velocity = p5.createVector(0, -6);
            this.zVelocity = 15; // Forward velocity
            
            // Scale animation with "pop" effect
            this.scale = 0;
            this.targetScale = 1;
            this.scaleVelocity = 0;
            this.scaleAcceleration = 0.008;
            
            // Dynamic sizing based on score ranges (even larger)
            const baseSize = cellSize * 1.2; // Increased base size by 50%
            let scoreMultiplier = 1;
            if (this.finalScore >= 1000) {
                scoreMultiplier = 2.2; // MASSIVE for 1000+
            } else if (this.finalScore >= 500) {
                scoreMultiplier = 1.9; // Huge for 500+
            } else if (this.finalScore >= 100) {
                scoreMultiplier = 1.6; // Very large for 100+
            } else if (this.finalScore >= 50) {
                scoreMultiplier = 1.4; // Large for 50+
            }
            this.fontSize = baseSize * scoreMultiplier;
            
            // More dramatic rotation based on score
            this.rotation = p5.random(-0.4, 0.4) * Math.min(1, this.finalScore / 100);
            this.rotationVelocity = p5.random(-0.1, 0.1);
            
            // Enhanced 3D effect parameters
            this.perspective = 800;
            this.maxZ = 200;
            
            // Generate more sparkles for higher scores
            this.sparklePoints = [];
            const baseSparkles = 6;
            const extraSparkles = Math.min(10, Math.floor(Math.log10(this.finalScore) * 3));
            const numSparkles = baseSparkles + extraSparkles;
            
            for (let i = 0; i < numSparkles; i++) {
                const angle = p5.random(p5.TWO_PI);
                const dist = cellSize * p5.random(0.8, 1.6) * scoreMultiplier;
                this.sparklePoints.push({
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    phase: p5.random(p5.TWO_PI),
                    speed: p5.random(0.08, 0.15),
                    size: p5.random(8, 15) * scoreMultiplier
                });
            }
            
            // Color effects based on score
            if (this.finalScore >= 1000) {
                // Rainbow color cycling for 1000+
                this.colorCycle = true;
                this.colorPhase = 0;
                this.colorSpeed = 0.1;
            } else if (this.finalScore >= 500) {
                // Gold color with extra sparkle
                this.color = '#FFD700';
                this.glowIntensity = 1.8;
            } else if (this.finalScore >= 100) {
                // Silver color with more sparkle
                this.color = '#C0C0C0';
                this.glowIntensity = 1.5;
            }
            
            // Special effects for high scores
            this.hasShockwave = this.finalScore >= 100;
            this.shockwaveSize = 0;
            this.shockwaveAlpha = this.hasShockwave ? 255 : 0;
        } else if (this.type === 'badge') {
            this.badgeSize = 0;
            this.maxBadgeSize = cellSize * 1.8; // Slightly larger
            this.innerText = config.innerText;
            this.textOpacity = 0;
            this.rotation = -Math.PI / 4; // Start rotated
            this.targetRotation = 0;
            this.scale = 0.5;
            this.targetScale = 1;
            
            // Floating animation parameters
            this.floatOffset = 0;
            this.floatAmplitude = cellSize * 0.15; // How far it floats up/down
            this.floatFrequency = 1.5; // Speed of floating
            this.floatPhase = Math.random() * Math.PI * 2; // Random start phase
            
            // Rotation parameters
            this.rotationOffset = 0;
            this.rotationAmplitude = 0.05; // Maximum rotation in radians
            this.rotationFrequency = 2; // Speed of rotation
            
            // Scale breathing parameters
            this.scaleOffset = 1;
            this.scaleAmplitude = 0.05; // How much it "breathes"
            this.scaleFrequency = 2.5; // Speed of breathing
            
            // Sparkle trail timing
            this.lastSparkleTime = this.birth;
            this.sparkleInterval = 100; // ms between sparkles
            this.sparkleRadius = cellSize * 0.8;
        } else if (this.type === 'ripple') {
            this.radius = 0;
            this.maxRadius = cellSize * (config.radiusMultiplier || 2.5);
            this.thickness = cellSize * 0.15; // Increased thickness
            this.waveCount = config.waveCount || 4;
            this.waveAmplitude = config.waveAmplitude || 8;
            this.waveFrequency = config.waveFrequency || 0.2;
            this.rotationSpeed = p5.random(-0.02, 0.02); // Add rotation to ripples
            this.rotation = 0;
            // Create complementary color for multi-color effect
            this.secondaryColor = p5.color(this.color);
            this.secondaryColor.setRed(255 - p5.red(this.secondaryColor));
            this.secondaryColor.setGreen(255 - p5.green(this.secondaryColor));
            this.secondaryColor.setBlue(255 - p5.blue(this.secondaryColor));
        } else if (this.type === 'sparkle') {
            this.sparkleSize = cellSize * (config.sparkleSize || 0.4); // Bigger sparkles
            this.baseSize = this.sparkleSize;
            // More dynamic particle movement
            const angle = p5.random(p5.TWO_PI);
            const speed = p5.random(2, 5); // Increased speed range
            this.velocity = p5.createVector(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            this.gravity = p5.createVector(0, 0.15);
            this.rotationAngle = p5.random(p5.TWO_PI);
            this.rotationSpeed = p5.random(-0.2, 0.2);
            this.sparklePoints = this.generateSparklePoints();
        }
    }

    generateSparklePoints() {
        const points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * this.p5.TWO_PI;
            const innerRadius = this.sparkleSize * 0.4;
            const outerRadius = this.sparkleSize;
            points.push({
                inner: {
                    x: Math.cos(angle) * innerRadius,
                    y: Math.sin(angle) * innerRadius
                },
                outer: {
                    x: Math.cos(angle) * outerRadius,
                    y: Math.sin(angle) * outerRadius
                }
            });
        }
        return points;
    }

    update() {
        const age = this.p5.millis() - this.birth;
        const lifePercent = age / this.lifetime;

        if (this.type === 'score') {
            // Dynamic 3D movement
            if (lifePercent < 0.3) {
                // Initial "pop out" movement
                this.z += this.zVelocity;
                this.zVelocity *= 0.9;
                // Dramatic scale effect
                this.scaleVelocity += this.scaleAcceleration;
                this.scale += this.scaleVelocity;
                if (this.scale > 1.3) { // Overshoot for bounce effect
                    this.scale = 1.3;
                    this.scaleVelocity *= -0.5;
                }
            } else {
                // Settle into final size with gentle bounce
                const targetScale = 1 + Math.sin(age * 0.003) * 0.05;
                this.scale += (targetScale - this.scale) * 0.1;
                // Gentle floating in Z
                this.z = Math.max(0, this.z * 0.9);
            }
            
            // More dynamic movement
            if (lifePercent < 0.25) {
                // Initial fast upward movement
                this.velocity.y *= 0.88;
            } else if (lifePercent < 0.35) {
                // Dramatic bounce effect
                this.velocity.y += 0.4;
                this.velocity.y *= 0.85;
            } else {
                // Gentle floating with more pronounced wave
                this.velocity.y *= 0.9;
                this.velocity.y += Math.sin(age * 0.004) * 0.15;
            }
            this.y += this.velocity.y;
            
            // Dynamic rotation
            this.rotation += this.rotationVelocity;
            this.rotationVelocity *= 0.95;
            
            // Alpha animation with longer hold time
            if (lifePercent < 0.15) {
                this.alpha = 255 * (lifePercent / 0.15); // Faster fade in
            } else if (lifePercent > 0.85) {
                this.alpha = 255 * (1 - ((lifePercent - 0.85) / 0.15)); // Faster fade out
            }
            
            // Update sparkle positions with more dynamic movement
            this.sparklePoints.forEach(sparkle => {
                sparkle.phase += sparkle.speed;
            });
            
            // Update color cycling if active
            if (this.colorCycle) {
                this.colorPhase += this.colorSpeed;
                const hue = (this.colorPhase * 360) % 360;
                this.color = `hsl(${hue}, 100%, 50%)`;
            }
            
            // Update shockwave if present
            if (this.hasShockwave) {
                if (lifePercent < 0.2) {
                    this.shockwaveSize = this.cellSize * 4 * this.easeOutQuad(lifePercent / 0.2);
                    this.shockwaveAlpha = 255 * (1 - lifePercent / 0.2);
                }
            }
        } else if (this.type === 'badge') {
            const growDuration = 0.25; // Faster initial growth
            if (lifePercent < growDuration) {
                const easePercent = this.easeOutBack(lifePercent / growDuration);
                this.badgeSize = this.maxBadgeSize * easePercent;
                this.textOpacity = 255 * this.easeInQuad(lifePercent / growDuration);
                this.rotation = this.lerp(-Math.PI / 4, 0, this.easeOutBack(lifePercent / growDuration));
                this.scale = this.lerp(0.5, 1, this.easeOutBack(lifePercent / growDuration));
                
                // Initial shockwave
                this.shockwaveSize = this.shockwaveSize * this.easeOutQuad(lifePercent / growDuration);
                this.shockwaveAlpha = 255 * (1 - lifePercent / growDuration);
            } else {
                this.badgeSize = this.maxBadgeSize;
                this.textOpacity = 255;
                
                // Floating movement with smooth transitions
                const floatTime = age * this.floatFrequency / 1000;
                const floatBase = Math.sin(floatTime * Math.PI * 2 + this.floatPhase);
                const floatMod = Math.sin(floatTime * Math.PI * 0.5) * 0.3; // Slow modulation
                this.floatOffset = this.floatAmplitude * (floatBase + floatMod);
                
                // Rotation with variation
                const rotationTime = age * this.rotationFrequency / 1000;
                const rotBase = Math.sin(rotationTime * Math.PI * 2);
                const rotMod = Math.sin(rotationTime * Math.PI * 0.7) * 0.3;
                this.rotationOffset = this.rotationAmplitude * (rotBase + rotMod);
                
                // Scale breathing with secondary pulse
                const scaleTime = age * this.scaleFrequency / 1000;
                const scaleBase = Math.sin(scaleTime * Math.PI * 2);
                const scaleMod = Math.sin(scaleTime * Math.PI * 1.5) * 0.2;
                this.scaleOffset = 1 + this.scaleAmplitude * (scaleBase + scaleMod);
            }
            
            // Enhanced fade out
            if (lifePercent > 0.75) {
                const fadePercent = (lifePercent - 0.75) / 0.25;
                const fadeEase = this.easeInQuad(fadePercent);
                
                // Fade out with increasing movement
                this.alpha = 255 * (1 - fadeEase);
                this.textOpacity *= (1 - fadeEase);
                this.floatAmplitude = this.cellSize * 0.15 * (1 + fadeEase * 2);
                this.rotationAmplitude = 0.05 * (1 + fadeEase * 3);
                this.scaleAmplitude = 0.05 * (1 + fadeEase);
                
                // Update sparkle parameters during fade
                this.sparkleInterval = 100 * (1 - fadeEase * 0.5);
                this.sparkleRadius = this.cellSize * (0.8 + fadeEase * 0.8);
            }
            
            // Return sparkle info if it's time for a new sparkle
            if (age - this.lastSparkleTime > this.sparkleInterval) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * this.sparkleRadius;
                const sparkleX = Math.cos(angle) * dist;
                const sparkleY = Math.sin(angle) * dist + this.floatOffset;
                
                this.lastSparkleTime = age;
                
                return {
                    type: 'sparkle',
                    x: this.x + sparkleX,
                    y: this.y + sparkleY,
                    color: this.color,
                    lifetime: 400,
                    sparkleSize: 0.2
                };
            }
        } else if (this.type === 'ripple') {
            this.radius = this.maxRadius * this.easeOutQuad(lifePercent);
            this.rotation += this.rotationSpeed;
            // More dynamic wave effect
            const wave = Math.sin(lifePercent * this.waveCount * Math.PI * 2) * this.waveAmplitude;
            const secondaryWave = Math.cos(lifePercent * this.waveCount * Math.PI * 1.5) * this.waveAmplitude;
            this.alpha = (255 * (1 - lifePercent) + wave) * this.easeOutQuad(1 - lifePercent);
            this.secondaryAlpha = (255 * (1 - lifePercent) + secondaryWave) * this.easeOutQuad(1 - lifePercent);
        } else if (this.type === 'sparkle') {
            // Update position with more dynamic physics
            this.acceleration.add(this.gravity);
            this.velocity.add(this.acceleration);
            this.velocity.mult(0.98);
            
            // Add some wind effect
            this.velocity.x += Math.sin(this.p5.millis() * 0.001) * 0.1;
            
            // Update position
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Store trail points
            if (this.trailPoints.length > 5) this.trailPoints.shift();
            this.trailPoints.push({x: this.x, y: this.y});
            
            // Sparkle rotation
            this.rotationAngle += this.rotationSpeed;
            
            // Dynamic size and alpha
            const sparklePhase = this.p5.millis() * 0.01;
            const pulse = (Math.sin(sparklePhase) + 1) * 0.5;
            this.sparkleSize = this.baseSize * (1 + pulse * 0.4);
            this.alpha = 255 * (1 - lifePercent) * (0.8 + pulse * 0.2);
            
            this.acceleration.mult(0);
        }
        
        return age < this.lifetime;
    }

    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    easeInQuad(x) {
        return x * x;
    }

    easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    draw() {
        const p = this.p5;
        p.push();
        
        if (this.type === 'score') {
            // Apply perspective transformation
            const scale3D = this.perspective / (this.perspective - this.z);
            p.translate(this.x, this.y);
            p.scale(this.scale * scale3D);
            p.rotate(this.rotation);
            
            // Enhanced shadow effect
            if (this.z > 0) {
                const shadowAlpha = (this.alpha * 0.3) * (this.z / this.maxZ);
                p.noStroke();
                p.fill(0, shadowAlpha);
                p.ellipse(5, 5, this.fontSize * 1.2, this.fontSize * 0.3);
            }
            
            // Draw enhanced sparkles
            this.sparklePoints.forEach(sparkle => {
                const sparkleAlpha = (Math.sin(sparkle.phase) + 1) * 0.5 * this.alpha;
                const glowColor = p.color(this.color);
                glowColor.setAlpha(sparkleAlpha * 0.3);
                
                p.push();
                p.translate(sparkle.x, sparkle.y);
                p.rotate(sparkle.phase);
                
                // Enhanced glow effect
                p.noStroke();
                p.fill(glowColor);
                p.circle(0, 0, sparkle.size * 1.8);
                
                // Star shape
                const dotColor = p.color(this.color);
                dotColor.setAlpha(sparkleAlpha);
                p.fill(dotColor);
                p.beginShape();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * p.PI) / 5;
                    p.vertex(Math.cos(angle) * sparkle.size, Math.sin(angle) * sparkle.size);
                }
                p.endShape(p.CLOSE);
                
                p.pop();
            });
            
            // Setup text style with new font
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(this.fontSize);
            p.textFont('Bangers'); // More arcade-like font
            
            // Format score text based on multiplier
            let scoreText;
            if (this.multiplier > 1) {
                scoreText = `${this.score}×${this.multiplier}!`;
            } else {
                scoreText = `${this.score}!`;
            }
            
            // Enhanced text glow effect
            const glowColor = p.color(this.color);
            glowColor.setAlpha(this.alpha * 0.3);
            p.fill(glowColor);
            
            // Multiple layers of glow for more intense effect
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * p.TWO_PI;
                const glowDist = 6 * this.glowIntensity;
                p.text(scoreText, 
                    Math.cos(angle) * glowDist,
                    Math.sin(angle) * glowDist
                );
            }
            
            // Main text with stroke for better visibility
            const mainColor = p.color(this.color);
            mainColor.setAlpha(this.alpha);
            p.stroke(0);
            p.strokeWeight(3);
            p.fill(mainColor);
            p.text(scoreText, 0, 0);
            
            // Draw final score for multiplier effects
            if (this.multiplier > 1) {
                p.textSize(this.fontSize * 1.2);
                p.text(`${this.finalScore}!`, 0, this.fontSize);
            }
            
            // Main text with enhanced 3D effect
            const layers = 8;
            const depth = 6;
            for (let i = layers; i >= 0; i--) {
                const layerColor = p.color(this.color);
                layerColor.setAlpha(this.alpha * (i / layers));
                p.fill(layerColor);
                p.stroke(0);
                p.strokeWeight(3);
                p.text(scoreText, i * depth, i * depth);
            }
            
            // Front face with extra pop
            p.stroke(255);
            p.strokeWeight(4);
            const frontColor = p.color(this.color);
            frontColor.setAlpha(this.alpha);
            p.fill(frontColor);
            p.text(scoreText, 0, 0);
            
            // Highlight for extra shine
            p.stroke(255, this.alpha * 0.7);
            p.strokeWeight(2);
            p.text(scoreText, -2, -2);
        } else if (this.type === 'badge') {
            // Draw initial shockwave
            if (this.shockwaveAlpha > 0) {
                const shockwaveC = p.color(this.color);
                shockwaveC.setAlpha(this.shockwaveAlpha);
                p.noFill();
                p.stroke(shockwaveC);
                p.strokeWeight(this.cellSize * 0.1);
                p.circle(this.x, this.y, this.shockwaveSize);
            }
            
            // Apply floating transform
            p.translate(this.x, this.y + this.floatOffset);
            p.rotate(this.rotation + this.rotationOffset);
            p.scale(this.scale * this.scaleOffset);
            
            // Enhanced outer glow with double layer
            const glowSize1 = this.badgeSize * 1.3 * (1 + Math.sin(p.millis() / 200) * 0.05);
            const glowSize2 = this.badgeSize * 1.2 * (1 + Math.sin(p.millis() / 300) * 0.05);
            const glowC1 = p.color(this.color);
            const glowC2 = p.color(this.color);
            glowC1.setAlpha(this.alpha * 0.2);
            glowC2.setAlpha(this.alpha * 0.3);
            
            p.noStroke();
            p.fill(glowC1);
            p.circle(0, 0, glowSize1);
            p.fill(glowC2);
            p.circle(0, 0, glowSize2);
            
            // Badge background with subtle gradient
            const gradient = p.drawingContext.createRadialGradient(0, 0, 0, 0, 0, this.badgeSize/2);
            gradient.addColorStop(0, p.color(255, 255, 255, this.alpha * 0.2));
            gradient.addColorStop(1, p.color(0, 0, 0, 0));
            p.drawingContext.fillStyle = gradient;
            p.circle(0, 0, this.badgeSize);
            
            p.fill(p.color(this.color));
            p.circle(0, 0, this.badgeSize);
            
            // Inner circle with dynamic gradient
            const innerC = p.color(this.color);
            innerC.setAlpha(this.alpha * 0.4);
            p.fill(innerC);
            p.circle(0, 0, this.badgeSize * 0.85);
            
            // Enhanced text effects
            if (this.innerText) {
                // Dynamic shadow based on movement
                const shadowOffset = 2 + Math.abs(this.floatOffset) * 0.1;
                const shadowAngle = Math.atan2(this.floatOffset, shadowOffset);
                const shadowX = Math.cos(shadowAngle) * shadowOffset;
                const shadowY = Math.sin(shadowAngle) * shadowOffset;
                
                const shadowC = p.color(0, 0, 0);
                shadowC.setAlpha(this.textOpacity * 0.3);
                p.fill(shadowC);
                p.textAlign(p.CENTER, p.CENTER);
                p.textFont('Press Start 2P');
                p.textSize(this.cellSize * 0.3);
                p.text(this.innerText, shadowX, shadowY);
                
                // Main text with subtle glow
                const textC = p.color('#FFFFFF');
                textC.setAlpha(this.textOpacity);
                p.fill(textC);
                p.text(this.innerText, 0, 0);
            }
        } else if (this.type === 'ripple') {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.rotation);
            
            // Draw multiple rings with enhanced wave effect
            for (let i = 0; i < 4; i++) {
                const ringRadius = this.radius * (1 - i * 0.15);
                const ringAlpha = this.alpha * (1 - i * 0.2);
                const wave = Math.sin(p.frameCount * this.waveFrequency + i) * this.waveAmplitude;
                const secondaryWave = Math.cos(p.frameCount * this.waveFrequency + i) * this.waveAmplitude;
                
                // Draw main color ring
                p.noFill();
                const c = p.color(this.color);
                c.setAlpha(ringAlpha);
                p.stroke(c);
                p.strokeWeight(this.thickness * (1 - i * 0.2));
                p.circle(0, 0, ringRadius * 2 + wave);
                
                // Draw secondary color ring
                const sc = p.color(this.secondaryColor);
                sc.setAlpha(ringAlpha * 0.7);
                p.stroke(sc);
                p.strokeWeight(this.thickness * 0.5 * (1 - i * 0.2));
                p.circle(0, 0, ringRadius * 1.8 + secondaryWave);
            }
            p.pop();
        } else if (this.type === 'sparkle') {
            // Draw particle trail
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const point = this.trailPoints[i];
                const nextPoint = this.trailPoints[i + 1];
                const trailAlpha = (i / this.trailPoints.length) * this.alpha * 0.5;
                
                // Draw trail glow
                const glowColor = p.color(this.color);
                glowColor.setAlpha(trailAlpha * 0.3);
                p.stroke(glowColor);
                p.strokeWeight(this.sparkleSize * 0.3);
                p.line(point.x, point.y, nextPoint.x, nextPoint.y);
            }
            
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.rotationAngle);
            
            // Enhanced glow effect
            const glowColor = p.color(this.color);
            glowColor.setAlpha(this.alpha * 0.3);
            p.noStroke();
            p.fill(glowColor);
            p.circle(0, 0, this.sparkleSize * 2.5);
            
            // Draw star shape
            const c = p.color(this.color);
            c.setAlpha(this.alpha);
            p.fill(c);
            p.noStroke();
            
            p.beginShape();
            this.sparklePoints.forEach(point => {
                p.vertex(point.outer.x, point.outer.y);
                p.vertex(point.inner.x, point.inner.y);
            });
            p.endShape(p.CLOSE);
            
            // Add highlight
            p.fill(255, this.alpha * 0.5);
            p.circle(0, 0, this.sparkleSize * 0.3);
            
            p.pop();
        }
        
        p.pop();
    }
}

/**
 * Ripple/shockwave system for visual effects
 * @class
 */
export class Particles {
    constructor(p5, grid, game) {
        this.p5 = p5;
        this.grid = grid;
        this.game = game;
        this.effects = [];
        this.activeEffects = new Map();
    }

    createFoodEffect(position, color, score = 10, multiplier = 1) {
        const center = this.grid.getCellCenter(position);
        const p5 = this.p5;
        
        // Create score effect with longer lifetime for high scores
        const lifetime = score * multiplier >= 100 ? 2000 : 1500;
        
        this.effects.push(new Effect(
            this.p5,
            center.x,
            center.y,
            {
                type: 'score',
                lifetime: lifetime,
                color: color,
                score: score,
                multiplier: multiplier
            },
            this.grid.cellSize
        ));
        
        // Create multiple expanding ripples
        for (let i = 0; i < 2; i++) {
            const rippleColor = i === 0 ? color : p5.color(
                p5.red(color) + p5.random(-30, 30),
                p5.green(color) + p5.random(-30, 30),
                p5.blue(color) + p5.random(-30, 30)
            );
            
            this.effects.push(new Effect(
                this.p5,
                center.x,
                center.y,
                {
                    type: 'ripple',
                    lifetime: 1000 + i * 200,
                    color: rippleColor,
                    radiusMultiplier: 2.5 + i * 0.5,
                    waveCount: 4,
                    waveAmplitude: 10,
                    waveFrequency: 0.15
                },
                this.grid.cellSize
            ));
        }

        // Create dynamic particle burst
        const numParticles = 16; // Increased number of particles
        for (let i = 0; i < numParticles; i++) {
            // Create color variation
            const particleColor = p5.color(
                p5.red(color) + p5.random(-20, 20),
                p5.green(color) + p5.random(-20, 20),
                p5.blue(color) + p5.random(-20, 20)
            );
            
            this.effects.push(new Effect(
                this.p5,
                center.x,
                center.y,
                {
                    type: 'sparkle',
                    lifetime: 800 + p5.random(-200, 200),
                    color: particleColor,
                    sparkleSize: 0.35,
                    glowIntensity: 1.2
                },
                this.grid.cellSize
            ));
        }
    }

    createPowerUpEffect(position, type) {
        const center = this.grid.getCellCenter(position);
        const config = {
            speed: { 
                color: '#00FF00', 
                text: 'SPEED UP!',
                innerText: 'SPEED',
                sparkleColor: '#7FFF00'
            },
            points: { 
                color: '#FFD700', 
                text: 'BONUS POINTS!',
                innerText: 'POINTS',
                sparkleColor: '#FFA500'
            },
            ghost: { 
                color: '#4169E1', 
                text: 'GHOST MODE!',
                innerText: 'GHOST',
                sparkleColor: '#87CEEB'
            }
        }[type] || { 
            color: '#FFFFFF'
        };

        // Create initial ripple effect
        this.effects.push(new Effect(
            this.p5,
            center.x,
            center.y,
            {
                type: 'ripple',
                lifetime: 500,
                color: config.color,
                radiusMultiplier: 3
            },
            this.grid.cellSize
        ));

        // Create badge effect with longer lifetime for floating
        this.effects.push(new Effect(
            this.p5,
            center.x,
            center.y,
            {
                type: 'badge',
                lifetime: 2000, // Longer lifetime for floating animation
                color: config.color,
                innerText: config.innerText
            },
            this.grid.cellSize
        ));

        // Start active effect for snake
        if (config.sparkleColor) {
            this.activeEffects.set(type, {
                color: config.sparkleColor,
                startTime: this.p5.millis(),
                duration: 5000
            });
        }
    }

    createSnakeEffect(position, baseColor, powerupCount, powerupTypes) {
        const center = this.grid.getCellCenter(position);
        const p5 = this.p5;
        
        // Create distinct effects for each powerup type
        powerupTypes.forEach((type, index) => {
            let effectColor;
            let effectConfig;
            
            switch(type) {
                case 'ghost':
                    // Ghost: Ethereal blue/white effects
                    effectColor = p5.color(0, 191, 255); // Deep sky blue
                    effectConfig = {
                        // Ethereal trailing wisps
                        particles: {
                            count: 6,
                            size: 0.4,
                            speed: 1.2,
                            spread: 0.8,
                            lifetime: 400,
                            alpha: 180
                        },
                        // Ghostly aura
                        ripple: {
                            radius: 1.8,
                            waves: 1,
                            amplitude: 4,
                            frequency: 0.08,
                            alpha: 160
                        }
                    };
                    break;
                    
                case 'speed':
                    // Speed: Vibrant yellow/orange trailing flames
                    effectColor = p5.color(255, 140, 0); // Dark orange
                    effectConfig = {
                        // Fast trailing particles
                        particles: {
                            count: 8,
                            size: 0.3,
                            speed: 2,
                            spread: 1.2,
                            lifetime: 300,
                            alpha: 200
                        },
                        // Speed waves
                        ripple: {
                            radius: 1.4,
                            waves: 3,
                            amplitude: 6,
                            frequency: 0.15,
                            alpha: 180
                        }
                    };
                    break;
                    
                case 'points':
                    // Points: Sparkly green/gold effects
                    effectColor = p5.color(50, 205, 50); // Lime green
                    effectConfig = {
                        // Glittering particles
                        particles: {
                            count: 10,
                            size: 0.25,
                            speed: 1.5,
                            spread: 1,
                            lifetime: 500,
                            alpha: 220
                        },
                        // Value aura
                        ripple: {
                            radius: 1.6,
                            waves: 2,
                            amplitude: 5,
                            frequency: 0.1,
                            alpha: 200
                        }
                    };
                    break;
                    
                case 'slow':
                    // Slow: Deep purple time-warp effects
                    effectColor = p5.color(147, 112, 219); // Medium purple
                    effectConfig = {
                        // Time particles
                        particles: {
                            count: 5,
                            size: 0.35,
                            speed: 0.8,
                            spread: 0.6,
                            lifetime: 600,
                            alpha: 190
                        },
                        // Time distortion waves
                        ripple: {
                            radius: 1.3,
                            waves: 2,
                            amplitude: 3,
                            frequency: 0.06,
                            alpha: 170
                        }
                    };
                    break;
            }
            
            // Create ripple effect with powerup-specific properties
            const rippleColor = p5.color(p5.red(effectColor), p5.green(effectColor), p5.blue(effectColor), effectConfig.ripple.alpha);
            this.effects.push(new Effect(
                this.p5,
                center.x,
                center.y,
                {
                    type: 'ripple',
                    lifetime: effectConfig.particles.lifetime,
                    color: rippleColor,
                    radiusMultiplier: effectConfig.ripple.radius,
                    waveCount: effectConfig.ripple.waves,
                    waveAmplitude: effectConfig.ripple.amplitude,
                    waveFrequency: effectConfig.ripple.frequency
                },
                this.grid.cellSize
            ));
            
            // Create particles with powerup-specific properties
            const particleColor = p5.color(p5.red(effectColor), p5.green(effectColor), p5.blue(effectColor), effectConfig.particles.alpha);
            for (let i = 0; i < effectConfig.particles.count; i++) {
                const angle = (i / effectConfig.particles.count) * Math.PI * 2 + p5.random(-0.2, 0.2);
                const speed = effectConfig.particles.speed * p5.random(0.8, 1.2);
                const spread = effectConfig.particles.spread;
                
                this.effects.push(new Effect(
                    this.p5,
                    center.x,
                    center.y,
                    {
                        type: 'sparkle',
                        lifetime: effectConfig.particles.lifetime + p5.random(-100, 100),
                        color: particleColor,
                        velocity: p5.createVector(
                            Math.cos(angle) * speed * spread,
                            Math.sin(angle) * speed * spread
                        ),
                        sparkleSize: effectConfig.particles.size,
                        rotationSpeed: p5.random(-0.1, 0.1),
                        glowIntensity: 1.2
                    },
                    this.grid.cellSize
                ));
            }
        });
    }

    updateActiveEffect(type, position) {
        const activeEffect = this.activeEffects.get(type);
        if (!activeEffect) return;

        const now = this.p5.millis();
        if (now - activeEffect.startTime > activeEffect.duration) {
            this.activeEffects.delete(type);
            return;
        }

        // Create sparkles around snake position
        const center = this.grid.getCellCenter(position);
        if (Math.random() < 0.3) {
            const offset = this.grid.cellSize * 0.7;
            this.effects.push(new Effect(
                this.p5,
                center.x + (Math.random() - 0.5) * offset,
                center.y + (Math.random() - 0.5) * offset,
                {
                    type: 'sparkle',
                    lifetime: 500,
                    color: activeEffect.color,
                    sparkleSize: 0.3
                },
                this.grid.cellSize
            ));
        }
    }

    update() {
        const currentTime = this.p5.millis();
        
        // Update existing effects and generate new sparkles
        this.effects = this.effects.filter(effect => {
            const sparkleInfo = effect.update();
            
            // If the effect generated a sparkle, create it
            if (sparkleInfo) {
                this.effects.push(
                    new Effect(
                        this.p5,
                        sparkleInfo.x,
                        sparkleInfo.y,
                        sparkleInfo,
                        effect.cellSize
                    )
                );
            }
            
            return currentTime - effect.birth < effect.lifetime;
        });
    }

    draw() {
        this.effects.forEach(effect => effect.draw());
    }
}
