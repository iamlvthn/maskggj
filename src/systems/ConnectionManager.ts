import Phaser from "phaser";
import { Connection } from "../types/GameTypes";
import { NodeDataManager } from "./NodeDataManager";
import { MathUtils } from "../utils/MathUtils";

/**
 * ConnectionManager - Manages connections between nodes and renders connection lines
 * Reads node data from NodeDataManager
 */
export class ConnectionManager {
	private scene: Phaser.Scene;
	private connections: Map<string, Connection> = new Map();
	private connectionGraphics: Phaser.GameObjects.Graphics;
	private nodeDataManager: NodeDataManager;
	private registeredNodeIds: Set<string> = new Set();
	private maxConnectionRange: number = 200;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.connectionGraphics = scene.add.graphics();
		this.connectionGraphics.setDepth(1); // Draw connections behind nodes
		this.nodeDataManager = NodeDataManager.getInstance();
	}

	/**
	 * Register a node ID with the connection manager
	 */
	public registerNodeData(nodeId: string): void {
		this.registeredNodeIds.add(nodeId);
	}

	/**
	 * Unregister a node
	 */
	public unregisterNode(nodeId: string): void {
		this.registeredNodeIds.delete(nodeId);
		this.removeAllConnections(nodeId);
	}

	/**
	 * Create a connection from node data (reads positions from NodeDataManager)
	 */
	public createConnectionFromData(fromId: string, toId: string): boolean {
		const fromNode = this.nodeDataManager.getNode(fromId);
		const toNode = this.nodeDataManager.getNode(toId);

		if (!fromNode || !toNode) {
			return false;
		}

		// Check if already connected
		if (this.isConnected(fromId, toId)) {
			return false;
		}

		// Check range
		const distance = MathUtils.distance(fromNode.x, fromNode.y, toNode.x, toNode.y);
		if (distance > this.maxConnectionRange) {
			return false;
		}

		// Create connection
		const connectionKey = this.getConnectionKey(fromId, toId);
		const connection: Connection = {
			from: fromId,
			to: toId,
			throughput: 0,
			maxThroughput: 100,
			level: 1
		};

		this.connections.set(connectionKey, connection);
		return true;
	}

	/**
	 * Legacy method for backward compatibility
	 */
	public createConnection(fromId: string, toId: string): boolean {
		return this.createConnectionFromData(fromId, toId);
	}

	/**
	 * Remove a connection
	 */
	public removeConnection(fromId: string, toId: string): void {
		const connectionKey = this.getConnectionKey(fromId, toId);
		this.connections.delete(connectionKey);

		// Also remove from NodeDataManager
		this.nodeDataManager.removeConnection(fromId, toId);
	}

	/**
	 * Remove all connections for a node
	 */
	public removeAllConnections(nodeId: string): void {
		const connectionsToRemove: string[] = [];

		this.connections.forEach((connection, key) => {
			if (connection.from === nodeId || connection.to === nodeId) {
				connectionsToRemove.push(key);
			}
		});

		connectionsToRemove.forEach(key => {
			const connection = this.connections.get(key);
			if (connection) {
				this.connections.delete(key);
			}
		});
	}

	/**
	 * Check if two nodes are connected
	 */
	public isConnected(fromId: string, toId: string): boolean {
		const connectionKey = this.getConnectionKey(fromId, toId);
		return this.connections.has(connectionKey);
	}

	/**
	 * Get connection between two nodes
	 */
	public getConnection(fromId: string, toId: string): Connection | null {
		const connectionKey = this.getConnectionKey(fromId, toId);
		return this.connections.get(connectionKey) || null;
	}

	/**
	 * Upgrade a connection
	 */
	public upgradeConnection(fromId: string, toId: string): boolean {
		const connection = this.getConnection(fromId, toId);
		if (!connection) {
			return false;
		}

		connection.level++;
		connection.maxThroughput = 100 * connection.level;
		return true;
	}

	/**
	 * Calculate throughput for a connection
	 */
	public calculateThroughput(fromId: string, toId: string): number {
		const connection = this.getConnection(fromId, toId);
		if (!connection) {
			return 0;
		}

		// Throughput is based on the source node's income
		const income = this.nodeDataManager.getIncome(fromId);
		connection.throughput = Math.min(income, connection.maxThroughput);

		return connection.throughput;
	}

	/**
	 * Check if connection is overloaded
	 */
	public isOverloaded(fromId: string, toId: string): boolean {
		const connection = this.getConnection(fromId, toId);
		if (!connection) {
			return false;
		}

		return connection.throughput >= connection.maxThroughput;
	}

	/**
	 * Update and render all connections
	 */
	public update(): void {
		this.connectionGraphics.clear();

		this.connections.forEach((connection) => {
			const fromNode = this.nodeDataManager.getNode(connection.from);
			const toNode = this.nodeDataManager.getNode(connection.to);

			if (!fromNode || !toNode) {
				return;
			}

			// Calculate throughput
			this.calculateThroughput(connection.from, connection.to);

			// Determine line thickness based on throughput/level
			const baseThickness = 1;
			const thickness = baseThickness + connection.level * 0.5;

			// Determine color based on overload status
			const isOverloaded = this.isOverloaded(connection.from, connection.to);
			const color = isOverloaded ? 0xff0000 : 0x00aaff;
			const alpha = isOverloaded ? 1.0 : 0.6;

			// Draw connection line
			this.connectionGraphics.lineStyle(thickness, color, alpha);
			this.connectionGraphics.lineBetween(
				fromNode.x,
				fromNode.y,
				toNode.x,
				toNode.y
			);
		});
	}

	/**
	 * Get connection key for map storage
	 */
	private getConnectionKey(fromId: string, toId: string): string {
		// Always use alphabetical order to ensure consistent keys
		return fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
	}

	/**
	 * Get all connections
	 */
	public getAllConnections(): Connection[] {
		return Array.from(this.connections.values());
	}

	/**
	 * Get connections for a specific node
	 */
	public getNodeConnections(nodeId: string): Connection[] {
		const nodeConnections: Connection[] = [];
		this.connections.forEach((connection) => {
			if (connection.from === nodeId || connection.to === nodeId) {
				nodeConnections.push(connection);
			}
		});
		return nodeConnections;
	}

	/**
	 * Set maximum connection range
	 */
	public setMaxConnectionRange(range: number): void {
		this.maxConnectionRange = range;
	}

	/**
	 * Get maximum connection range
	 */
	public getMaxConnectionRange(): number {
		return this.maxConnectionRange;
	}

	/**
	 * Clean up
	 */
	public destroy(): void {
		this.connectionGraphics.destroy();
		this.connections.clear();
		this.registeredNodeIds.clear();
	}
}
