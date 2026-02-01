import {
	NodeType,
	NodeData,
	HostData,
	RouterData,
	HoneypotData,
	AnyNodeData,
	NODE_BASE_MAX_HEALTH
} from "../types/GameTypes";
import GameState from "./GameState";

/**
 * NodeDataManager - Single source of truth for all node game data
 * Stores node data as plain objects, separate from visual representation
 */
export class NodeDataManager {
	private static instance: NodeDataManager;
	private nodes: Map<string, AnyNodeData> = new Map();
	private nodeCounter: number = 0;

	private constructor() {}

	public static getInstance(): NodeDataManager {
		if (!NodeDataManager.instance) {
			NodeDataManager.instance = new NodeDataManager();
		}
		return NodeDataManager.instance;
	}

	/** Generate a unique node ID */
	public generateId(prefix: string = "node"): string {
		return `${prefix}_${this.nodeCounter++}`;
	}

	/** Create a new host node */
	public createHost(x: number, y: number, id?: string, level: number = 1): HostData {
		const nodeId = id || this.generateId("host");
		const baseMaxHealth = NODE_BASE_MAX_HEALTH[NodeType.Host];
		const maxHealth = baseMaxHealth * (1 + level * 0.1);

		const data: HostData = {
			id: nodeId,
			type: NodeType.Host,
			x,
			y,
			level,
			health: maxHealth,
			maxHealth,
			connections: [],
			baseIncome: 10,
			lastIncomeTime: 0
		};

		this.nodes.set(nodeId, data);
		return data;
	}

	/** Create a new router node */
	public createRouter(x: number, y: number, id?: string, level: number = 1): RouterData {
		const nodeId = id || this.generateId("router");
		const baseMaxHealth = NODE_BASE_MAX_HEALTH[NodeType.Router];
		const maxHealth = baseMaxHealth * (1 + level * 0.1);

		const data: RouterData = {
			id: nodeId,
			type: NodeType.Router,
			x,
			y,
			level,
			health: maxHealth,
			maxHealth,
			connections: [],
			maxSlots: 4
		};

		this.nodes.set(nodeId, data);
		return data;
	}

	/** Create a new honeypot node */
	public createHoneypot(x: number, y: number, id?: string, level: number = 1): HoneypotData {
		const nodeId = id || this.generateId("honeypot");
		const baseMaxHealth = NODE_BASE_MAX_HEALTH[NodeType.Honeypot];
		const maxHealth = baseMaxHealth * (1 + level * 0.1);

		const data: HoneypotData = {
			id: nodeId,
			type: NodeType.Honeypot,
			x,
			y,
			level,
			health: maxHealth,
			maxHealth,
			connections: [],
			aggroRadius: 200,
			threatLevel: 0
		};

		this.nodes.set(nodeId, data);
		return data;
	}

	/** Get node data by ID */
	public getNode(id: string): AnyNodeData | undefined {
		return this.nodes.get(id);
	}

	/** Get all nodes */
	public getAllNodes(): AnyNodeData[] {
		return Array.from(this.nodes.values());
	}

	/** Get all nodes of a specific type */
	public getNodesByType(type: NodeType): AnyNodeData[] {
		return this.getAllNodes().filter(node => node.type === type);
	}

	/** Remove a node */
	public removeNode(id: string): boolean {
		const node = this.nodes.get(id);
		if (!node) return false;

		// Remove from all connections
		node.connections.forEach(connectedId => {
			const connectedNode = this.nodes.get(connectedId);
			if (connectedNode) {
				connectedNode.connections = connectedNode.connections.filter(c => c !== id);
			}
		});

		return this.nodes.delete(id);
	}

	/** Update node position */
	public setPosition(id: string, x: number, y: number): void {
		const node = this.nodes.get(id);
		if (node) {
			node.x = x;
			node.y = y;
		}
	}

	/** Apply damage to a node */
	public takeDamage(id: string, amount: number): boolean {
		const node = this.nodes.get(id);
		if (!node) return false;

		node.health = Math.max(0, node.health - amount);
		return node.health <= 0; // Returns true if node died
	}

	/** Heal a node */
	public heal(id: string, amount: number): void {
		const node = this.nodes.get(id);
		if (node) {
			node.health = Math.min(node.maxHealth, node.health + amount);
		}
	}

	/** Add connection between two nodes */
	public addConnection(fromId: string, toId: string): boolean {
		const fromNode = this.nodes.get(fromId);
		const toNode = this.nodes.get(toId);

		if (!fromNode || !toNode) return false;
		if (fromNode.connections.includes(toId)) return false;

		fromNode.connections.push(toId);
		toNode.connections.push(fromId);
		return true;
	}

	/** Remove connection between two nodes */
	public removeConnection(fromId: string, toId: string): void {
		const fromNode = this.nodes.get(fromId);
		const toNode = this.nodes.get(toId);

		if (fromNode) {
			fromNode.connections = fromNode.connections.filter(c => c !== toId);
		}
		if (toNode) {
			toNode.connections = toNode.connections.filter(c => c !== fromId);
		}
	}

	/** Upgrade a node */
	public upgrade(id: string): boolean {
		const node = this.nodes.get(id);
		if (!node) return false;

		const cost = this.getUpgradeCost(id);
		const gameState = GameState.getInstance();

		if (!gameState.spendMoney(cost)) return false;

		node.level++;
		const baseMaxHealth = NODE_BASE_MAX_HEALTH[node.type];
		node.maxHealth = baseMaxHealth * (1 + node.level * 0.1);
		node.health = node.maxHealth;

		return true;
	}

	/** Get upgrade cost for a node */
	public getUpgradeCost(id: string): number {
		const node = this.nodes.get(id);
		if (!node) return Infinity;

		switch (node.type) {
			case NodeType.Host:
				return 50 * Math.pow(1.5, node.level);
			case NodeType.Router:
				return 100 * Math.pow(2, node.level);
			case NodeType.Honeypot:
				return 300 * Math.pow(2, node.level);
			default:
				return 100 * Math.pow(2, node.level);
		}
	}

	/** Get income for a node (only hosts generate income) */
	public getIncome(id: string): number {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Host) return 0;

		const hostData = node as HostData;
		const gameState = GameState.getInstance();
		const prestigeMultiplier = gameState.getPrestigeData().permanentMultipliers.incomeMultiplier;
		return hostData.baseIncome * node.level * prestigeMultiplier;
	}

	/** Generate income for a host node */
	public generateIncome(id: string, currentTime: number): number {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Host) return 0;

		const hostData = node as HostData;
		const incomeInterval = 1000; // 1 second

		if (currentTime - hostData.lastIncomeTime >= incomeInterval) {
			hostData.lastIncomeTime = currentTime;
			const income = this.getIncome(id);
			const gameState = GameState.getInstance();
			gameState.addMoney(income);
			gameState.addBandwidth(income);
			return income;
		}
		return 0;
	}

	/** Get max slots for a router */
	public getRouterMaxSlots(id: string): number {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Router) return 0;

		const gameState = GameState.getInstance();
		const cidr = gameState.getCurrentCIDR();
		const baseSlots = Math.pow(2, (24 - cidr) / 4) * 4;
		const levelBonus = Math.floor(node.level / 2);
		return Math.floor(baseSlots) + levelBonus;
	}

	/** Get connected hosts count for a router */
	public getRouterHostCount(id: string): number {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Router) return 0;

		return node.connections.filter(connId => {
			const connNode = this.nodes.get(connId);
			return connNode && connNode.type === NodeType.Host;
		}).length;
	}

	/** Check if router has available slots */
	public routerHasAvailableSlots(id: string): boolean {
		return this.getRouterHostCount(id) < this.getRouterMaxSlots(id);
	}

	/** Get honeypot aggro radius */
	public getHoneypotAggroRadius(id: string): number {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Honeypot) return 0;

		const honeypotData = node as HoneypotData;
		return honeypotData.aggroRadius * (1 + node.level * 0.15);
	}

	/** Add threat to honeypot */
	public addHoneypotThreat(id: string, amount: number): void {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Honeypot) return;

		const honeypotData = node as HoneypotData;
		honeypotData.threatLevel += amount;
	}

	/** Reduce honeypot threat */
	public reduceHoneypotThreat(id: string, amount: number): void {
		const node = this.nodes.get(id);
		if (!node || node.type !== NodeType.Honeypot) return;

		const honeypotData = node as HoneypotData;
		honeypotData.threatLevel = Math.max(0, honeypotData.threatLevel - amount);
	}

	/** Update all nodes (called every frame) */
	public update(time: number, delta: number): void {
		this.nodes.forEach(node => {
			if (node.type === NodeType.Host) {
				this.generateIncome(node.id, time);
			} else if (node.type === NodeType.Honeypot) {
				this.reduceHoneypotThreat(node.id, delta * 0.001);
			}
		});
	}

	/** Clear all nodes */
	public clear(): void {
		this.nodes.clear();
		this.nodeCounter = 0;
	}

	/** Get node count */
	public getNodeCount(): number {
		return this.nodes.size;
	}

	/** Check if a node exists */
	public hasNode(id: string): boolean {
		return this.nodes.has(id);
	}
}
