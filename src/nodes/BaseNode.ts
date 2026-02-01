import Phaser from "phaser";
import { NodeType, NODE_VISUAL_CONFIGS } from "../types/GameTypes";

/**
 * NodeSprite - Simple visual sprite wrapper for a node
 * Just a sprite at a position with a reference to its data ID
 * All game logic lives in NodeDataManager
 */
export class NodeSprite {
	public readonly id: string;
	public readonly nodeType: NodeType;
	public readonly sprite: Phaser.GameObjects.Image;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		id: string,
		nodeType: NodeType
	) {
		this.id = id;
		this.nodeType = nodeType;

		const config = NODE_VISUAL_CONFIGS[nodeType];
		this.sprite = scene.add.image(x, y, config.texture);
		this.sprite.setDisplaySize(config.displaySize, config.displaySize);
		this.sprite.setOrigin(0.5, 0.5);
		this.sprite.setInteractive({ useHandCursor: true });

		// Store reference to node ID on the sprite for easy lookup
		this.sprite.setData("nodeId", id);
		this.sprite.setData("nodeType", nodeType);
	}

	/** Get current position */
	public getPosition(): { x: number; y: number } {
		return { x: this.sprite.x, y: this.sprite.y };
	}

	/** Set position */
	public setPosition(x: number, y: number): void {
		this.sprite.setPosition(x, y);
	}

	/** Destroy the sprite */
	public destroy(): void {
		this.sprite.destroy();
	}
}

// Export as BaseNode alias for backward compatibility during migration
export { NodeSprite as BaseNode };
