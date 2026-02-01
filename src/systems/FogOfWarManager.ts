import Phaser from "phaser";
import { NodeDataManager } from "./NodeDataManager";
import GameState from "./GameState";
import { MathUtils } from "../utils/MathUtils";

/**
 * FogOfWarManager - Manages fog of war visibility
 * Reads node positions from NodeDataManager
 */
export class FogOfWarManager {
	private scene: Phaser.Scene;
	private fogGraphics: Phaser.GameObjects.Graphics;
	private nodeDataManager: NodeDataManager;
	private registeredNodeIds: Set<string> = new Set();
	private fogColor: number = 0x000000;
	private fogAlpha: number = 0.8;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.fogGraphics = scene.add.graphics();
		this.fogGraphics.setDepth(100); // Draw fog on top
		this.nodeDataManager = NodeDataManager.getInstance();
	}

	/**
	 * Register a node ID for visibility calculation
	 */
	public registerNodeData(nodeId: string): void {
		this.registeredNodeIds.add(nodeId);
	}

	/**
	 * Unregister a node
	 */
	public unregisterNode(nodeId: string): void {
		this.registeredNodeIds.delete(nodeId);
	}

	/**
	 * Update fog of war based on visible nodes and CIDR tier
	 */
	public update(): void {
		const gameState = GameState.getInstance();
		const visionRadius = gameState.getVisionRadius();

		// Clear previous fog
		this.fogGraphics.clear();

		// Get camera bounds
		const camera = this.scene.cameras.main;
		const worldWidth = camera.worldView.width;
		const worldHeight = camera.worldView.height;
		const worldX = camera.worldView.x;
		const worldY = camera.worldView.y;

		// Draw full fog overlay
		this.fogGraphics.fillStyle(this.fogColor, this.fogAlpha);
		this.fogGraphics.fillRect(worldX, worldY, worldWidth, worldHeight);

		// Create reveal circles around visible nodes
		this.registeredNodeIds.forEach((nodeId) => {
			const node = this.nodeDataManager.getNode(nodeId);
			if (!node) return;

			// Check if node is within camera view
			if (
				node.x >= worldX - visionRadius &&
				node.x <= worldX + worldWidth + visionRadius &&
				node.y >= worldY - visionRadius &&
				node.y <= worldY + worldHeight + visionRadius
			) {
				// Use blend mode to "cut out" the fog
				this.fogGraphics.fillStyle(0x000000, 0);
				this.fogGraphics.fillCircle(node.x, node.y, visionRadius);
			}
		});

		// Apply blend mode to create the reveal effect
		// Using ERASE blend mode to cut out the fog
		this.fogGraphics.setBlendMode(Phaser.BlendModes.ERASE);

		// Redraw the reveal circles with erase blend
		this.registeredNodeIds.forEach((nodeId) => {
			const node = this.nodeDataManager.getNode(nodeId);
			if (!node) return;

			if (
				node.x >= worldX - visionRadius &&
				node.x <= worldX + worldWidth + visionRadius &&
				node.y >= worldY - visionRadius &&
				node.y <= worldY + worldHeight + visionRadius
			) {
				this.fogGraphics.fillStyle(0xffffff, 1);
				this.fogGraphics.fillCircle(node.x, node.y, visionRadius);
			}
		});

		// Reset blend mode
		this.fogGraphics.setBlendMode(Phaser.BlendModes.NORMAL);
	}

	/**
	 * Check if a point is visible (within vision radius of any node)
	 */
	public isPointVisible(x: number, y: number): boolean {
		const gameState = GameState.getInstance();
		const visionRadius = gameState.getVisionRadius();

		for (const nodeId of this.registeredNodeIds) {
			const node = this.nodeDataManager.getNode(nodeId);
			if (node && MathUtils.pointInCircle(x, y, node.x, node.y, visionRadius)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get visibility percentage of the map
	 */
	public getVisibilityPercentage(): number {
		const gameState = GameState.getInstance();
		const visionRadius = gameState.getVisionRadius();
		const nodeCount = this.registeredNodeIds.size;

		// Rough estimate: each node reveals a circle
		const totalArea = 4000 * 4000; // World size
		const revealedArea = Math.PI * visionRadius * visionRadius * nodeCount;
		return Math.min(1.0, revealedArea / totalArea);
	}

	/**
	 * Set fog color
	 */
	public setFogColor(color: number): void {
		this.fogColor = color;
	}

	/**
	 * Set fog alpha
	 */
	public setFogAlpha(alpha: number): void {
		this.fogAlpha = MathUtils.clamp(alpha, 0, 1);
	}

	/**
	 * Clean up
	 */
	public destroy(): void {
		this.fogGraphics.destroy();
		this.registeredNodeIds.clear();
	}
}
