
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Phaser from "phaser";
import GameState from "../systems/GameState";
import { NodeDataManager } from "../systems/NodeDataManager";
import { NodeUIManager } from "../systems/NodeUIManager";
import { ConnectionManager } from "../systems/ConnectionManager";
import { FogOfWarManager } from "../systems/FogOfWarManager";
import { AttackEngine } from "../systems/AttackEngine";
import { ThreatSystem } from "../systems/ThreatSystem";
import { BackgroundManager } from "../systems/BackgroundManager";
import { ParticleManager } from "../systems/ParticleManager";
import { NodeSprite } from "../nodes/BaseNode";
import { Router } from "../nodes/Router";
import { Host } from "../nodes/Host";
import { Honeypot } from "../nodes/Honeypot";
import { NodeType, NODE_VISUAL_CONFIGS } from "../types/GameTypes";
/* END-USER-IMPORTS */

export default class MainMap extends Phaser.Scene {

	constructor() {
		super("MainMap");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {
		// Background will be handled by BackgroundManager
		// Old background code removed - using new parallax system
		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	private gameState!: GameState;
	private nodeDataManager!: NodeDataManager;
	private nodeUIManager!: NodeUIManager;
	private connectionManager!: ConnectionManager;
	private fogOfWarManager!: FogOfWarManager;
	private attackEngine!: AttackEngine;
	private threatSystem!: ThreatSystem;
	private backgroundManager!: BackgroundManager;
	private particleManager!: ParticleManager;
	
	// Visual sprites only - game data is in NodeDataManager
	private nodeSprites: Map<string, NodeSprite> = new Map();
	private selectedNodeId: string | null = null;
	private buildMode: NodeType | null = null;
	private isDragging: boolean = false;
	private dragStart = { x: 0, y: 0 };

	create() {
		this.editorCreate();

		// Initialize data manager (singleton)
		this.nodeDataManager = NodeDataManager.getInstance();
		
		// Initialize systems
		this.gameState = GameState.getInstance();
		this.nodeUIManager = new NodeUIManager(this);
		this.connectionManager = new ConnectionManager(this);
		this.fogOfWarManager = new FogOfWarManager(this);
		this.attackEngine = new AttackEngine(this, this.connectionManager);
		this.threatSystem = new ThreatSystem();
		
		// Initialize background and particle systems
		this.backgroundManager = new BackgroundManager(this);
		this.backgroundManager.initialize();
		this.particleManager = new ParticleManager(this);
		this.particleManager.initialize();

		// Connect threat system to OverlayUI
		const overlayUI = this.scene.get("OverlayUI");
		if (overlayUI && overlayUI.data) {
			overlayUI.data.set('threatSystem', this.threatSystem);
		}

		// Remove camera bounds to allow infinite panning
		// Set to very large bounds to allow indefinite zoom-out
		this.cameras.main.setBounds(-100000, -100000, 200000, 200000);
		
		// Set initial zoom - start at 0.75 for better view
		// At zoom 0.75, 12px nodes = 9px on screen
		// At zoom 1.0, 12px nodes = 12px on screen (max zoom)
		this.cameras.main.setZoom(0.75);

		// Enable Mouse Drag to Pan
		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			this.isDragging = true;
			this.dragStart.x = pointer.x;
			this.dragStart.y = pointer.y;
		});

		this.input.on('pointerup', () => {
			this.isDragging = false;
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (this.isDragging) {
				const zoom = this.cameras.main.zoom;
				const scrollX = this.cameras.main.scrollX + (this.dragStart.x - pointer.x) / zoom;
				const scrollY = this.cameras.main.scrollY + (this.dragStart.y - pointer.y) / zoom;
				this.cameras.main.scrollX = scrollX;
				this.cameras.main.scrollY = scrollY;
				this.dragStart.x = pointer.x;
				this.dragStart.y = pointer.y;
			}
		});

		// Zoom with Mouse Wheel - zoom towards mouse pointer
		// Max zoom in: 1.0 (12px nodes = 12px on screen)
		// Max zoom out: indefinite (minimum 0.001)
		this.input.on('wheel', (
			pointer: Phaser.Input.Pointer,
			gameObjects: unknown[],
			deltaX: number,
			deltaY: number,
			deltaZ: number
		) => {
			// Get world position of mouse before zoom
			const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
			
			// Calculate zoom change (percentage-based for smoother zooming)
			const zoomFactor = 1.1; // 10% zoom per scroll
			const zoomDelta = deltaY > 0 ? 1 / zoomFactor : zoomFactor;
			const currentZoom = this.cameras.main.zoom;
			const newZoom = Phaser.Math.Clamp(currentZoom * zoomDelta, 0.001, 1.0);
			
			// Only apply if zoom actually changed
			if (newZoom !== currentZoom) {
				this.cameras.main.setZoom(newZoom);
				
				// Adjust camera position to zoom towards mouse pointer
				const newWorldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
				this.cameras.main.scrollX += (worldPoint.x - newWorldPoint.x);
				this.cameras.main.scrollY += (worldPoint.y - newWorldPoint.y);
			}
		});

		// Click to place nodes or select
		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			const worldX = pointer.worldX;
			const worldY = pointer.worldY;

			// Check if clicking on existing node
			const clickedNodeId = this.getNodeIdAt(worldX, worldY);
			if (clickedNodeId) {
				this.selectNode(clickedNodeId);
				return;
			}

			// If in build mode, place node
			if (this.buildMode) {
				this.placeNode(worldX, worldY, this.buildMode);
			}
		});

		// Keyboard shortcuts
		this.input.keyboard?.on('keydown-R', () => {
			this.setBuildMode(NodeType.Router);
		});
		this.input.keyboard?.on('keydown-H', () => {
			this.setBuildMode(NodeType.Host);
		});
		this.input.keyboard?.on('keydown-ESC', () => {
			this.setBuildMode(null);
			this.selectNode(null);
		});

		// Listen for build mode changes from OverlayUI
		this.events.on('set-build-mode', (nodeTypeString: string) => {
			console.log('MainMap received set-build-mode event:', nodeTypeString);
			const nodeType = nodeTypeString === 'router' ? NodeType.Router :
			                 nodeTypeString === 'honeypot' ? NodeType.Honeypot : null;
			console.log('Setting build mode to:', nodeType);
			this.setBuildMode(nodeType);
		});
	}

	update(time: number, delta: number): void {
		// Update background parallax layers
		this.backgroundManager.update();
		
		// Update particle system
		this.particleManager.update(time, delta);

		// Update node data (income generation, threat decay, etc.)
		this.nodeDataManager.update(time, delta);

		// Check routers and generate/update hosts as needed
		const nodes = this.nodeDataManager.getAllNodes();
		nodes.forEach(node => {
			if (node.type === NodeType.Router) {
				this.updateHostsForRouter(node.id);
			}
		});

		// Sync sprite positions with data (in case data was modified externally)
		this.syncSpritePositions();

		// Update UI overlays (health bars, level labels)
		this.nodeUIManager.update();

		// Update systems
		this.connectionManager.update();
		this.fogOfWarManager.update();
		this.attackEngine.update(time, delta);
		this.threatSystem.calculateThreatFromData(this.nodeDataManager);
		this.threatSystem.update(delta);

		// Update threat system in OverlayUI
		const overlayUI = this.scene.get("OverlayUI");
		if (overlayUI && overlayUI.data) {
			overlayUI.data.set('threatSystem', this.threatSystem);
		}

		// Clean up dead nodes
		this.cleanupDeadNodes();
	}

	private placeNode(x: number, y: number, nodeType: NodeType): void {
		let nodeData;
		let sprite: NodeSprite;

		switch (nodeType) {
			case NodeType.Router:
				nodeData = this.nodeDataManager.createRouter(x, y);
				sprite = new Router(this, x, y, nodeData.id);
				// Generate hosts around the router
				this.generateHostsForRouter(nodeData.id);
				break;
			case NodeType.Honeypot:
				nodeData = this.nodeDataManager.createHoneypot(x, y);
				sprite = new Honeypot(this, x, y, nodeData.id);
				break;
			default:
				return; // Hosts are auto-generated, not manually placed
		}

		// Store sprite
		this.nodeSprites.set(nodeData.id, sprite);
		
		// Create UI elements
		this.nodeUIManager.createLevelText(nodeData.id);

		// Register with systems
		this.connectionManager.registerNodeData(nodeData.id);
		this.fogOfWarManager.registerNodeData(nodeData.id);
		this.attackEngine.registerNodeData(nodeData.id);
	}

	private removeNode(nodeId: string): void {
		// Remove sprite
		const sprite = this.nodeSprites.get(nodeId);
		if (sprite) {
			sprite.destroy();
			this.nodeSprites.delete(nodeId);
		}

		// Remove UI
		this.nodeUIManager.removeLevelText(nodeId);

		// Unregister from systems
		this.connectionManager.unregisterNode(nodeId);
		this.fogOfWarManager.unregisterNode(nodeId);
		this.attackEngine.unregisterNode(nodeId);

		// Remove from data manager
		this.nodeDataManager.removeNode(nodeId);

		if (this.selectedNodeId === nodeId) {
			this.selectedNodeId = null;
		}
	}

	private getNodeIdAt(x: number, y: number): string | null {
		const nodes = this.nodeDataManager.getAllNodes();
		for (const node of nodes) {
			const distance = Phaser.Math.Distance.Between(x, y, node.x, node.y);
			// Click radius scaled to match smaller node sizes
			if (distance < 20) {
				return node.id;
			}
		}
		return null;
	}

	private selectNode(nodeId: string | null): void {
		this.selectedNodeId = nodeId;
		// Could add visual feedback here
	}

	/**
	 * Generate hosts around a router based on its level
	 */
	private generateHostsForRouter(routerId: string): void {
		const maxSlots = this.nodeDataManager.getRouterMaxSlots(routerId);
		const currentHostCount = this.nodeDataManager.getRouterHostCount(routerId);
		const hostsToGenerate = maxSlots - currentHostCount;

		if (hostsToGenerate <= 0) {
			return; // Router is at capacity
		}

		const routerData = this.nodeDataManager.getNode(routerId);
		if (!routerData) return;

		const hostRadius = 40; // Distance from router center (reduced for smaller nodes)
		const angleStep = (2 * Math.PI) / maxSlots;

		// Generate hosts in a circle around the router
		for (let i = currentHostCount; i < maxSlots; i++) {
			const angle = i * angleStep;
			const hostX = routerData.x + Math.cos(angle) * hostRadius;
			const hostY = routerData.y + Math.sin(angle) * hostRadius;

			// Create host data
			const hostData = this.nodeDataManager.createHost(hostX, hostY);
			
			// Create sprite
			const sprite = new Host(this, hostX, hostY, hostData.id);
			this.nodeSprites.set(hostData.id, sprite);
			
			// Create UI elements
			this.nodeUIManager.createLevelText(hostData.id);

			// Register with systems
			this.connectionManager.registerNodeData(hostData.id);
			this.fogOfWarManager.registerNodeData(hostData.id);
			this.attackEngine.registerNodeData(hostData.id);

			// Connect host to router
			this.nodeDataManager.addConnection(routerId, hostData.id);
			this.connectionManager.createConnectionFromData(routerId, hostData.id);
		}
	}

	/**
	 * Update hosts for a router when it upgrades
	 */
	private updateHostsForRouter(routerId: string): void {
		this.generateHostsForRouter(routerId);
	}

	/**
	 * Sync sprite positions with data
	 */
	private syncSpritePositions(): void {
		const nodes = this.nodeDataManager.getAllNodes();
		nodes.forEach(node => {
			const sprite = this.nodeSprites.get(node.id);
			if (sprite) {
				sprite.setPosition(node.x, node.y);
			}
		});
	}

	/**
	 * Clean up dead nodes (health <= 0)
	 */
	private cleanupDeadNodes(): void {
		const nodes = this.nodeDataManager.getAllNodes();
		nodes.forEach(node => {
			if (node.health <= 0) {
				this.removeNode(node.id);
			}
		});
	}

	private setBuildMode(nodeType: NodeType | null): void {
		this.buildMode = nodeType;
		console.log('Build mode set to:', nodeType);
		// Could add visual feedback here
	}
	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
