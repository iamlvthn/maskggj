import Phaser from "phaser";

interface DataParticle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	graphics: Phaser.GameObjects.Graphics;
	active: boolean;
	color: number;
}

export class ParticleManager {
	private scene: Phaser.Scene;
	private camera: Phaser.Cameras.Scene2D.Camera;
	private particles: DataParticle[] = [];
	private particlePool: DataParticle[] = [];
	private maxParticles: number = 200;
	private spawnRate: number = 2; // Particles per second
	private lastSpawnTime: number = 0;
	private particleContainer: Phaser.GameObjects.Container;

	// Particle properties
	private readonly particleSize: number = 2;
	private readonly minSpeed: number = 10;
	private readonly maxSpeed: number = 30;
	private readonly colors: number[] = [
		0x00ff00, // Green
		0x00aaff, // Blue
		0xffaa00, // Orange
		0xff00ff, // Magenta
		0x00ffff, // Cyan
	];

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.camera = scene.cameras.main;
		
		// Create container for particles
		this.particleContainer = scene.add.container(0, 0);
		this.particleContainer.setDepth(-10);
		this.particleContainer.setScrollFactor(0); // Manual positioning for proper parallax
	}

	/**
	 * Initialize particle system
	 */
	public initialize(): void {
		// Pre-populate particle pool
		for (let i = 0; i < this.maxParticles; i++) {
			const particle = this.createParticle();
			particle.active = false;
			this.particlePool.push(particle);
		}
	}

	/**
	 * Create a new particle (from pool or new)
	 */
	private createParticle(): DataParticle {
		const graphics = this.scene.add.graphics();
		graphics.setVisible(false);
		this.particleContainer.add(graphics);

		return {
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			graphics: graphics,
			active: false,
			color: 0x00ff00
		};
	}

	/**
	 * Spawn a particle at a specific position
	 */
	private spawnParticle(x: number, y: number): DataParticle | null {
		let particle: DataParticle | undefined;

		// Try to get from pool
		particle = this.particlePool.find(p => !p.active);

		// If no available particle in pool, create new one
		if (!particle) {
			particle = this.createParticle();
		}

		// Initialize particle
		particle.x = x;
		particle.y = y;
		
		// Random velocity
		const angle = Math.random() * Math.PI * 2;
		const speed = Phaser.Math.FloatBetween(this.minSpeed, this.maxSpeed);
		particle.vx = Math.cos(angle) * speed;
		particle.vy = Math.sin(angle) * speed;
		
		// Random color
		particle.color = Phaser.Utils.Array.GetRandom(this.colors);
		
		particle.active = true;
		particle.graphics.setVisible(true);
		
		return particle;
	}

	/**
	 * Get visible area with buffer for spawning
	 */
	private getVisibleArea(): { x: number; y: number; width: number; height: number } {
		const zoom = this.camera.zoom;
		const width = this.camera.width / zoom;
		const height = this.camera.height / zoom;
		const buffer = Math.max(500, width * 0.5); // Larger buffer to prevent edge visibility

		return {
			x: this.camera.scrollX - buffer,
			y: this.camera.scrollY - buffer,
			width: width + buffer * 2,
			height: height + buffer * 2
		};
	}

	/**
	 * Update particle system
	 */
	public update(time: number, delta: number): void {
		const visibleArea = this.getVisibleArea();
		const activeParticles = this.particles.filter(p => p.active);

		// Spawn new particles
		if (time - this.lastSpawnTime > 1000 / this.spawnRate) {
			const particlesToSpawn = Math.min(5, this.maxParticles - activeParticles.length);
			
			for (let i = 0; i < particlesToSpawn; i++) {
				const x = Phaser.Math.FloatBetween(
					visibleArea.x,
					visibleArea.x + visibleArea.width
				);
				const y = Phaser.Math.FloatBetween(
					visibleArea.y,
					visibleArea.y + visibleArea.height
				);
				const particle = this.spawnParticle(x, y);
				if (particle) {
					this.particles.push(particle);
				}
			}

			this.lastSpawnTime = time;
		}

		// Update active particles
		this.particles.forEach(particle => {
			if (!particle.active) return;

			// Update position
			particle.x += particle.vx * (delta / 1000);
			particle.y += particle.vy * (delta / 1000);

			// Check if particle is outside visible area (with larger buffer)
			const margin = Math.max(1000, visibleArea.width * 0.5);
			if (
				particle.x < visibleArea.x - margin ||
				particle.x > visibleArea.x + visibleArea.width + margin ||
				particle.y < visibleArea.y - margin ||
				particle.y > visibleArea.y + visibleArea.height + margin
			) {
				// Deactivate particle
				particle.active = false;
				particle.graphics.setVisible(false);
				return;
			}

			// Draw particle (relative to camera, with parallax factor 1.0)
			particle.graphics.clear();
			particle.graphics.fillStyle(particle.color, 0.8);
			const screenX = particle.x - this.camera.scrollX;
			const screenY = particle.y - this.camera.scrollY;
			particle.graphics.fillCircle(screenX, screenY, this.particleSize);
		});

		// Remove inactive particles periodically (keep array size manageable)
		if (this.particles.length > this.maxParticles * 2) {
			this.particles = this.particles.filter(p => p.active);
		}
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		this.particles.forEach(particle => {
			particle.graphics.destroy();
		});
		this.particlePool.forEach(particle => {
			particle.graphics.destroy();
		});
		this.particleContainer.destroy();
		this.particles = [];
		this.particlePool = [];
	}
}
