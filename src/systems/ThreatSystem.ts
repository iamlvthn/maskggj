import GameState from "./GameState";
import { NodeDataManager } from "./NodeDataManager";
import { NodeType, HoneypotData } from "../types/GameTypes";

/**
 * ThreatSystem - Calculates and manages threat level
 * Reads node data from NodeDataManager
 */
export class ThreatSystem {
	private threatLevel: number = 0;
	private maxThreat: number = 100;
	private threatDecayRate: number = 0.1; // Per second

	/**
	 * Calculate threat based on node data from NodeDataManager
	 */
	public calculateThreatFromData(nodeDataManager: NodeDataManager): number {
		const gameState = GameState.getInstance();
		const visionRadius = gameState.getVisionRadius();
		const nodes = nodeDataManager.getAllNodes();
		const nodeCount = nodes.length;

		// Base threat from visible area
		const visibleArea = Math.PI * visionRadius * visionRadius * nodeCount;
		const baseThreat = Math.min(50, visibleArea / 10000);

		// Threat from node count
		const nodeThreat = Math.min(30, nodeCount * 2);

		// Threat from honeypots (they attract attention)
		let honeypotThreat = 0;
		nodes.forEach((node) => {
			if (node.type === NodeType.Honeypot) {
				const honeypotData = node as HoneypotData;
				honeypotThreat += honeypotData.threatLevel;
			}
		});

		this.threatLevel = Math.min(
			this.maxThreat,
			baseThreat + nodeThreat + honeypotThreat
		);

		return this.threatLevel;
	}

	/**
	 * Get current threat level
	 */
	public getThreatLevel(): number {
		return this.threatLevel;
	}

	/**
	 * Get threat percentage (0-1)
	 */
	public getThreatPercentage(): number {
		return this.threatLevel / this.maxThreat;
	}

	/**
	 * Reduce threat over time
	 */
	public update(delta: number): void {
		this.threatLevel = Math.max(0, this.threatLevel - this.threatDecayRate * (delta / 1000));
	}

	/**
	 * Add threat (when attacked or detected)
	 */
	public addThreat(amount: number): void {
		this.threatLevel = Math.min(this.maxThreat, this.threatLevel + amount);
	}

	/**
	 * Check if threat is high enough to trigger AI Firewall
	 */
	public shouldTriggerAIFirewall(): boolean {
		return this.threatLevel >= this.maxThreat * 0.7; // 70% threshold
	}

	/**
	 * Reset threat
	 */
	public reset(): void {
		this.threatLevel = 0;
	}
}
