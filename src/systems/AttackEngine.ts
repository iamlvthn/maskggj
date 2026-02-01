import Phaser from "phaser";
import { NodeDataManager } from "./NodeDataManager";
import { ConnectionManager } from "./ConnectionManager";
import { NodeType, HoneypotData } from "../types/GameTypes";
import { MathUtils } from "../utils/MathUtils";

export interface Attack {
	id: string;
	fromNodeId: string;
	targetNodeId: string;
	damage: number;
	duration: number;
	startTime: number;
}

/**
 * AttackEngine - Manages attacks between nodes
 * Reads node data from NodeDataManager
 */
export class AttackEngine {
	private scene: Phaser.Scene;
	private activeAttacks: Map<string, Attack> = new Map();
	private nodeDataManager: NodeDataManager;
	private connectionManager: ConnectionManager;
	private registeredNodeIds: Set<string> = new Set();
	private attackCounter: number = 0;

	constructor(scene: Phaser.Scene, connectionManager: ConnectionManager) {
		this.scene = scene;
		this.connectionManager = connectionManager;
		this.nodeDataManager = NodeDataManager.getInstance();
	}

	/**
	 * Register a node ID
	 */
	public registerNodeData(nodeId: string): void {
		this.registeredNodeIds.add(nodeId);
	}

	/**
	 * Unregister a node
	 */
	public unregisterNode(nodeId: string): void {
		this.registeredNodeIds.delete(nodeId);
		// Remove attacks involving this node
		this.activeAttacks.forEach((attack, id) => {
			if (attack.fromNodeId === nodeId || attack.targetNodeId === nodeId) {
				this.activeAttacks.delete(id);
			}
		});
	}

	/**
	 * Start a DDoS attack from one node to another
	 */
	public startAttack(fromNodeId: string, targetNodeId: string, damage: number, duration: number): boolean {
		const fromNode = this.nodeDataManager.getNode(fromNodeId);
		const targetNode = this.nodeDataManager.getNode(targetNodeId);

		if (!fromNode || !targetNode) {
			return false;
		}

		// Check if target is obfuscated by TOR
		const isObfuscated = this.isNodeObfuscated(targetNodeId);
		if (isObfuscated) {
			return false; // Cannot attack obfuscated nodes
		}

		// Check if there's a connection path (nodes must be connected)
		if (!this.connectionManager.isConnected(fromNodeId, targetNodeId)) {
			// Check for indirect connection path
			if (!this.hasConnectionPath(fromNodeId, targetNodeId)) {
				return false;
			}
		}

		// Create attack
		const attackId = `attack_${this.attackCounter++}`;
		const attack: Attack = {
			id: attackId,
			fromNodeId,
			targetNodeId,
			damage,
			duration,
			startTime: this.scene.time.now
		};

		this.activeAttacks.set(attackId, attack);
		return true;
	}

	/**
	 * Update all active attacks
	 */
	public update(time: number, delta: number): void {
		const attacksToRemove: string[] = [];

		this.activeAttacks.forEach((attack, attackId) => {
			const elapsed = time - attack.startTime;

			if (elapsed >= attack.duration) {
				// Attack completed - apply final damage
				this.applyAttackDamage(attack);
				attacksToRemove.push(attackId);
			} else {
				// Apply damage over time
				const damagePerSecond = attack.damage / (attack.duration / 1000);
				const damageThisFrame = damagePerSecond * (delta / 1000);
				this.applyDamageToNode(attack.targetNodeId, damageThisFrame);
			}
		});

		attacksToRemove.forEach(id => this.activeAttacks.delete(id));
	}

	/**
	 * Apply attack damage to target node
	 */
	private applyAttackDamage(attack: Attack): void {
		const targetNode = this.nodeDataManager.getNode(attack.targetNodeId);
		if (!targetNode) {
			return;
		}

		// Check for honeypot aggro
		const honeypotId = this.findNearestHoneypot(attack.targetNodeId);
		if (honeypotId) {
			const honeypotAggroRadius = this.nodeDataManager.getHoneypotAggroRadius(honeypotId);
			const honeypotNode = this.nodeDataManager.getNode(honeypotId);
			if (honeypotNode) {
				const distance = MathUtils.distance(targetNode.x, targetNode.y, honeypotNode.x, honeypotNode.y);
				if (distance <= honeypotAggroRadius) {
					// Redirect attack to honeypot
					this.nodeDataManager.addHoneypotThreat(honeypotId, attack.damage * 0.1);
					this.nodeDataManager.takeDamage(honeypotId, attack.damage);
					return;
				}
			}
		}

		// Apply damage with DDoS protection
		let finalDamage = attack.damage;
		const ddosProtectId = this.findNearestDDoSProtect(attack.targetNodeId);
		if (ddosProtectId) {
			// DDoS protection reduces damage (simplified for now)
			finalDamage = finalDamage * 0.5;
		}

		const died = this.nodeDataManager.takeDamage(attack.targetNodeId, finalDamage);

		// If node is destroyed, check for capture
		if (died) {
			this.handleNodeCapture(attack.fromNodeId, attack.targetNodeId);
		}
	}

	/**
	 * Apply damage to a node
	 */
	private applyDamageToNode(nodeId: string, damage: number): void {
		const node = this.nodeDataManager.getNode(nodeId);
		if (!node) {
			return;
		}

		// Check for DDoS protection
		let finalDamage = damage;
		const ddosProtectId = this.findNearestDDoSProtect(nodeId);
		if (ddosProtectId) {
			finalDamage = finalDamage * 0.5;
		}

		this.nodeDataManager.takeDamage(nodeId, finalDamage);
	}

	/**
	 * Handle node capture when destroyed
	 */
	private handleNodeCapture(attackerId: string, targetId: string): void {
		// In a full implementation, this would transfer ownership
		// For now, the node will be cleaned up by MainMap
	}

	/**
	 * Check if node is obfuscated by TOR
	 */
	private isNodeObfuscated(nodeId: string): boolean {
		const targetNode = this.nodeDataManager.getNode(nodeId);
		if (!targetNode) return false;

		const nodes = this.nodeDataManager.getAllNodes();
		for (const node of nodes) {
			if (node.type === NodeType.TOR && node.id !== nodeId) {
				// TOR nodes obfuscate nodes within a certain radius (simplified)
				const distance = MathUtils.distance(targetNode.x, targetNode.y, node.x, node.y);
				if (distance < 150) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Find nearest honeypot to a node
	 */
	private findNearestHoneypot(nodeId: string): string | null {
		const targetNode = this.nodeDataManager.getNode(nodeId);
		if (!targetNode) return null;

		let nearestId: string | null = null;
		let nearestDistance = Infinity;

		const nodes = this.nodeDataManager.getAllNodes();
		for (const node of nodes) {
			if (node.type === NodeType.Honeypot) {
				const distance = MathUtils.distance(targetNode.x, targetNode.y, node.x, node.y);
				const aggroRadius = this.nodeDataManager.getHoneypotAggroRadius(node.id);
				if (distance < nearestDistance && distance <= aggroRadius) {
					nearestId = node.id;
					nearestDistance = distance;
				}
			}
		}

		return nearestId;
	}

	/**
	 * Find nearest DDoS Protect to a node
	 */
	private findNearestDDoSProtect(nodeId: string): string | null {
		const targetNode = this.nodeDataManager.getNode(nodeId);
		if (!targetNode) return null;

		let nearestId: string | null = null;
		let nearestDistance = Infinity;

		const nodes = this.nodeDataManager.getAllNodes();
		for (const node of nodes) {
			if (node.type === NodeType.DDoSProtect) {
				const distance = MathUtils.distance(targetNode.x, targetNode.y, node.x, node.y);
				// DDoS protect has a protection radius (simplified)
				if (distance < nearestDistance && distance <= 150) {
					nearestId = node.id;
					nearestDistance = distance;
				}
			}
		}

		return nearestId;
	}

	/**
	 * Check if there's a connection path between two nodes
	 */
	private hasConnectionPath(fromId: string, toId: string): boolean {
		// Simple BFS to find path
		const visited = new Set<string>();
		const queue: string[] = [fromId];

		while (queue.length > 0) {
			const current = queue.shift()!;
			if (current === toId) {
				return true;
			}

			if (visited.has(current)) {
				continue;
			}
			visited.add(current);

			const connections = this.connectionManager.getNodeConnections(current);
			connections.forEach(conn => {
				const nextId = conn.from === current ? conn.to : conn.from;
				if (!visited.has(nextId)) {
					queue.push(nextId);
				}
			});
		}

		return false;
	}

	/**
	 * Get all active attacks
	 */
	public getActiveAttacks(): Attack[] {
		return Array.from(this.activeAttacks.values());
	}

	/**
	 * Cancel an attack
	 */
	public cancelAttack(attackId: string): void {
		this.activeAttacks.delete(attackId);
	}

	/**
	 * Clean up
	 */
	public destroy(): void {
		this.activeAttacks.clear();
		this.registeredNodeIds.clear();
	}
}
