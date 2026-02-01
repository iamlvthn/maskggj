import Phaser from "phaser";
import { NodeDataManager } from "./NodeDataManager";
import { AnyNodeData, NODE_VISUAL_CONFIGS } from "../types/GameTypes";

/**
 * NodeUIManager - Renders UI overlays for nodes (health bars, level labels)
 * Reads data from NodeDataManager and renders as overlays
 */
export class NodeUIManager {
	private scene: Phaser.Scene;
	private nodeDataManager: NodeDataManager;
	private healthBarGraphics: Phaser.GameObjects.Graphics;
	private levelTexts: Map<string, Phaser.GameObjects.Text> = new Map();

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.nodeDataManager = NodeDataManager.getInstance();
		this.healthBarGraphics = scene.add.graphics();
		this.healthBarGraphics.setDepth(100); // Above nodes
	}

	/** Create level text for a node */
	public createLevelText(nodeId: string): void {
		const node = this.nodeDataManager.getNode(nodeId);
		if (!node) return;

		const config = NODE_VISUAL_CONFIGS[node.type];
		const text = this.scene.add.text(
			node.x,
			node.y - config.labelOffset,
			`Lv.${node.level}`,
			{
				fontSize: config.fontSize,
				color: "#ffffff",
				align: "center"
			}
		);
		text.setOrigin(0.5, 0.5);
		text.setDepth(101);

		this.levelTexts.set(nodeId, text);
	}

	/** Remove level text for a node */
	public removeLevelText(nodeId: string): void {
		const text = this.levelTexts.get(nodeId);
		if (text) {
			text.destroy();
			this.levelTexts.delete(nodeId);
		}
	}

	/** Update all UI elements */
	public update(): void {
		this.healthBarGraphics.clear();

		const nodes = this.nodeDataManager.getAllNodes();
		nodes.forEach(node => {
			this.renderHealthBar(node);
			this.updateLevelText(node);
		});
	}

	/** Render health bar for a node */
	private renderHealthBar(node: AnyNodeData): void {
		const config = NODE_VISUAL_CONFIGS[node.type];
		const barWidth = config.displaySize * 0.8;
		const barHeight = 2;
		const healthPercent = node.health / node.maxHealth;
		const barY = node.y - config.displaySize * 0.6;

		// Background (red)
		this.healthBarGraphics.fillStyle(0xff0000);
		this.healthBarGraphics.fillRect(
			node.x - barWidth / 2,
			barY,
			barWidth,
			barHeight
		);

		// Health (green)
		this.healthBarGraphics.fillStyle(0x00ff00);
		this.healthBarGraphics.fillRect(
			node.x - barWidth / 2,
			barY,
			barWidth * healthPercent,
			barHeight
		);
	}

	/** Update level text position and value */
	private updateLevelText(node: AnyNodeData): void {
		const text = this.levelTexts.get(node.id);
		if (!text) return;

		const config = NODE_VISUAL_CONFIGS[node.type];
		text.setPosition(node.x, node.y - config.labelOffset);
		text.setText(`Lv.${node.level}`);
	}

	/** Clean up all UI elements */
	public destroy(): void {
		this.healthBarGraphics.destroy();
		this.levelTexts.forEach(text => text.destroy());
		this.levelTexts.clear();
	}
}
