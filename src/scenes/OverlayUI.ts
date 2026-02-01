import Phaser from "phaser";
import GameState from "../systems/GameState";
import { ThreatSystem } from "../systems/ThreatSystem";
import { CIDRUtils } from "../utils/CIDRUtils";

export default class OverlayUI extends Phaser.Scene {
	private gameState: GameState;
	private threatSystem: ThreatSystem | null = null;
	private moneyText: Phaser.GameObjects.Text | null = null;
	private bandwidthText: Phaser.GameObjects.Text | null = null;
	private cidrText: Phaser.GameObjects.Text | null = null;
	private threatMeter: Phaser.GameObjects.Graphics | null = null;
	private threatText: Phaser.GameObjects.Text | null = null;
	private buildMenu: Phaser.GameObjects.Container | null = null;

	constructor() {
		super("OverlayUI");
		this.gameState = GameState.getInstance();
	}

	create() {
		// Try to get threat system from MainMap
		const mainMap = this.scene.get("MainMap");
		if (mainMap && mainMap.data) {
			this.threatSystem = mainMap.data.get('threatSystem') as ThreatSystem;
		}

		// Create UI background panel
		const panel = this.add.rectangle(0, 0, 1280, 100, 0x1a1a1a, 0.9);
		panel.setOrigin(0, 0);
		panel.setDepth(1000);

		// Money display
		this.moneyText = this.add.text(20, 20, "Bandwidth: $0", {
			fontSize: "20px",
			color: "#00ff00",
			fontFamily: "Arial"
		});
		this.moneyText.setDepth(1001);

		// Total Bandwidth display
		this.bandwidthText = this.add.text(20, 50, "Total: 0", {
			fontSize: "16px",
			color: "#ffffff",
			fontFamily: "Arial"
		});
		this.bandwidthText.setDepth(1001);

		// CIDR Tier display
		this.cidrText = this.add.text(300, 20, "CIDR: /24", {
			fontSize: "20px",
			color: "#00aaff",
			fontFamily: "Arial"
		});
		this.cidrText.setDepth(1001);

		// Threat Meter
		this.createThreatMeter();

		// Build Menu
		this.createBuildMenu();

		// Listen for build mode changes from MainMap
		this.scene.get("MainMap").events.on('set-build-mode', (nodeType: string) => {
			// Could update UI to show selected build mode
		});

		// Prestige Button
		const prestigeButton = this.add.rectangle(1200, 50, 60, 40, 0x9b59b6, 1);
		prestigeButton.setInteractive({ useHandCursor: true });
		prestigeButton.on('pointerdown', () => {
			this.scene.launch("PrestigeScreen");
		});
		prestigeButton.setDepth(1001);

		const prestigeText = this.add.text(1200, 50, "P", {
			fontSize: "20px",
			color: "#ffffff",
			fontFamily: "Arial"
		});
		prestigeText.setOrigin(0.5, 0.5);
		prestigeText.setDepth(1002);
	}

	private createThreatMeter(): void {
		// Threat meter background
		const meterBg = this.add.rectangle(600, 50, 200, 20, 0x333333, 1);
		meterBg.setDepth(1001);

		// Threat meter fill
		this.threatMeter = this.add.graphics();
		this.threatMeter.setDepth(1002);

		// Threat text
		this.threatText = this.add.text(600, 20, "Threat: 0%", {
			fontSize: "16px",
			color: "#ffffff",
			fontFamily: "Arial"
		});
		this.threatText.setOrigin(0.5, 0);
		this.threatText.setDepth(1003);
	}

	private createBuildMenu(): void {
		// Position build menu at bottom left of screen
		this.buildMenu = this.add.container(200, 620);

		// Build menu background
		const menuBg = this.add.rectangle(0, 0, 300, 80, 0x2a2a2a, 0.9);
		this.buildMenu.add(menuBg);

		// Router button - using routericon
		const routerButton = this.add.image(-80, 0, "routericon");
		routerButton.setDisplaySize(60, 60);
		routerButton.setInteractive({ useHandCursor: true });
		routerButton.on('pointerdown', () => {
			console.log('Router button clicked, emitting set-build-mode event');
			this.scene.get("MainMap").events.emit('set-build-mode', 'router');
		});
		this.buildMenu.add(routerButton);

		// Honeypot button - using honeypoticon
		const honeypotButton = this.add.image(80, 0, "honeypoticon");
		honeypotButton.setDisplaySize(60, 60);
		honeypotButton.setInteractive({ useHandCursor: true });
		honeypotButton.on('pointerdown', () => {
			console.log('Honeypot button clicked, emitting set-build-mode event');
			this.scene.get("MainMap").events.emit('set-build-mode', 'honeypot');
		});
		this.buildMenu.add(honeypotButton);

		this.buildMenu.setDepth(1000);
		this.buildMenu.setScrollFactor(0); // Keep UI fixed on screen
	}

	update(): void {
		// Update money display
		if (this.moneyText) {
			this.moneyText.setText(`Bandwidth: $${Math.floor(this.gameState.getMoney())}`);
		}

		// Update bandwidth display
		if (this.bandwidthText) {
			this.bandwidthText.setText(`Total: ${Math.floor(this.gameState.getTotalBandwidth())}`);
		}

		// Update CIDR display
		if (this.cidrText) {
			const cidr = this.gameState.getCurrentCIDR();
			this.cidrText.setText(`CIDR: ${CIDRUtils.getTierName(cidr)}`);
		}

		// Update threat meter
		if (this.threatSystem && this.threatMeter && this.threatText) {
			const threatPercent = this.threatSystem.getThreatPercentage();
			
			this.threatMeter.clear();
			
			// Determine color based on threat level
			let color = 0x00ff00; // Green
			if (threatPercent > 0.7) {
				color = 0xff0000; // Red
			} else if (threatPercent > 0.4) {
				color = 0xffaa00; // Orange
			}

			this.threatMeter.fillStyle(color, 1);
			this.threatMeter.fillRect(500, 40, 200 * threatPercent, 20);

			this.threatText.setText(`Threat: ${Math.floor(threatPercent * 100)}%`);
		}
	}

	public setThreatSystem(threatSystem: ThreatSystem): void {
		this.threatSystem = threatSystem;
	}
}
