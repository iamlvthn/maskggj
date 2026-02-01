import Phaser from "phaser";

interface ParallaxLayer {
	sprite: Phaser.GameObjects.TileSprite;
	parallaxFactor: number;
}

export class BackgroundManager {
	private scene: Phaser.Scene;
	private camera: Phaser.Cameras.Scene2D.Camera;
	private layers: ParallaxLayer[] = [];
	private lastCameraX: number = 0;
	private lastCameraY: number = 0;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.camera = scene.cameras.main;
	}

	/**
	 * Initialize background layers with parallax
	 */
	public initialize(): void {
		// Get camera center for initial positioning
		const centerX = this.camera.width / 2;
		const centerY = this.camera.height / 2;
		
		// Layer 1: Deep Background (slowest parallax - 0.2)
		// Use reasonable size (4096 is safe for most GPUs) - TileSprite will tile automatically
		const deepBg = this.scene.add.tileSprite(centerX, centerY, 4096, 4096, "internetbg");
		deepBg.setOrigin(0.5, 0.5);
		deepBg.setDepth(-100);
		deepBg.setScrollFactor(0); // Manual positioning
		this.layers.push({ sprite: deepBg, parallaxFactor: 0.2 });

		// Layer 2: Mid Background (medium parallax - 0.5)
		// Create a grid pattern or use a different texture
		// For now, using a semi-transparent overlay of the same texture
		const midBg = this.scene.add.tileSprite(centerX, centerY, 4096, 4096, "internetbg");
		midBg.setOrigin(0.5, 0.5);
		midBg.setDepth(-50);
		midBg.setScrollFactor(0); // Manual positioning
		midBg.setAlpha(0.3);
		midBg.setTint(0x4444ff); // Slight blue tint for differentiation
		this.layers.push({ sprite: midBg, parallaxFactor: 0.5 });

		// Store initial camera position
		this.lastCameraX = this.camera.scrollX;
		this.lastCameraY = this.camera.scrollY;
	}

	/**
	 * Update parallax layers based on camera movement
	 */
	public update(): void {
		const currentX = this.camera.scrollX;
		const currentY = this.camera.scrollY;

		// Update layer positions and tile positions for parallax effect
		this.layers.forEach(layer => {
			// Calculate how much camera moved
			const deltaX = currentX - this.lastCameraX;
			const deltaY = currentY - this.lastCameraY;
			
			// Update tile position based on parallax factor (this creates the parallax effect)
			// Only update tile position, not sprite position
			layer.sprite.tilePositionX -= deltaX * layer.parallaxFactor;
			layer.sprite.tilePositionY -= deltaY * layer.parallaxFactor;
		});

		this.lastCameraX = currentX;
		this.lastCameraY = currentY;
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		this.layers.forEach(layer => {
			layer.sprite.destroy();
		});
		this.layers = [];
	}
}
