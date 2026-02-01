export enum NodeType {
	Router = "router",
	Host = "host",
	Honeypot = "honeypot",
	VPN = "vpn",
	TOR = "tor",
	DDoSProtect = "ddos_protect"
}

export enum CIDRTier {
	CIDR_30 = 30,
	CIDR_24 = 24,
	CIDR_20 = 20,
	CIDR_16 = 16,
	CIDR_12 = 12,
	CIDR_8 = 8
}

export interface Connection {
	from: string; // node ID
	to: string; // node ID
	throughput: number;
	maxThroughput: number;
	level: number;
}

/** Base node data - common to all node types */
export interface NodeData {
	id: string;
	type: NodeType;
	x: number;
	y: number;
	level: number;
	health: number;
	maxHealth: number;
	connections: string[]; // array of node IDs
}

/** Host-specific data */
export interface HostData extends NodeData {
	type: NodeType.Host;
	baseIncome: number;
	lastIncomeTime: number;
}

/** Router-specific data */
export interface RouterData extends NodeData {
	type: NodeType.Router;
	maxSlots: number;
}

/** Honeypot-specific data */
export interface HoneypotData extends NodeData {
	type: NodeType.Honeypot;
	aggroRadius: number;
	threatLevel: number;
}

/** Union type for all node data */
export type AnyNodeData = HostData | RouterData | HoneypotData | NodeData;

/** Visual config for each node type */
export interface NodeVisualConfig {
	texture: string;
	displaySize: number;
	labelOffset: number;
	fontSize: string;
}

/** Node visual configs by type */
export const NODE_VISUAL_CONFIGS: Record<NodeType, NodeVisualConfig> = {
	[NodeType.Host]: {
		texture: "hosticon",
		displaySize: 75,
		labelOffset: 8,
		fontSize: "8px"
	},
	[NodeType.Router]: {
		texture: "routericon",
		displaySize: 75,
		labelOffset: 10,
		fontSize: "10px"
	},
	[NodeType.Honeypot]: {
		texture: "honeypoticon",
		displaySize: 75,
		labelOffset: 10,
		fontSize: "9px"
	},
	[NodeType.VPN]: {
		texture: "hosticon", // placeholder
		displaySize: 75,
		labelOffset: 10,
		fontSize: "9px"
	},
	[NodeType.TOR]: {
		texture: "hosticon", // placeholder
		displaySize: 75,
		labelOffset: 10,
		fontSize: "9px"
	},
	[NodeType.DDoSProtect]: {
		texture: "hosticon", // placeholder
		displaySize: 75,
		labelOffset: 10,
		fontSize: "9px"
	}
};

/** Base max health by node type */
export const NODE_BASE_MAX_HEALTH: Record<NodeType, number> = {
	[NodeType.Host]: 50,
	[NodeType.Router]: 100,
	[NodeType.Honeypot]: 200,
	[NodeType.VPN]: 75,
	[NodeType.TOR]: 75,
	[NodeType.DDoSProtect]: 150
};

export interface PrestigeData {
	totalPrestiges: number;
	permanentMultipliers: {
		bandwidthMultiplier: number;
		incomeMultiplier: number;
		visionMultiplier: number;
	};
}
