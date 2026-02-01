import Phaser from "phaser";
import GameState from "../systems/GameState";
import { CIDRTier } from "../types/GameTypes";
import { CIDRUtils } from "../utils/CIDRUtils";

export default class PrestigeScreen extends Phaser.Scene {
	private gameState: GameState;
	private background: Phaser.GameObjects.Rectangle | null = null;
	private titleText: Phaser.GameObjects.Text | null = null;
	private currentTierText: Phaser.GameObjects.Text | null = null;
	private nextTierText: Phaser.GameObjects.Text | null = null;
	private bonusText: Phaser.GameObjects.Text | null = null;
	private confirmButton: Phaser.GameObjects.Rectangle | null = null;
	private cancelButton: Phaser.GameObjects.Rectangle | null = null;

	constructor() {
		super("PrestigeScreen");
		this.gameState = GameState.getInstance();
	}

	create() {
		// Create semi-transparent background
		this.background = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
		this.background.setDepth(2000);
		this.background.setInteractive();

		// Title
		this.titleText = this.add.text(640, 150, "SUBNET JUMP", {
			fontSize: "48px",
			color: "#ffffff",
			fontFamily: "Arial",
			fontStyle: "bold"
		});
		this.titleText.setOrigin(0.5, 0.5);
		this.titleText.setDepth(2001);

		// Current tier info
		const currentCIDR = this.gameState.getCurrentCIDR();
		this.currentTierText = this.add.text(640, 250, `Current: ${CIDRUtils.getTierName(currentCIDR)}`, {
			fontSize: "24px",
			color: "#ffffff",
			fontFamily: "Arial"
		});
		this.currentTierText.setOrigin(0.5, 0.5);
		this.currentTierText.setDepth(2001);

		// Next tier info
		const nextTier = CIDRUtils.getNextTier(currentCIDR);
		if (nextTier) {
			this.nextTierText = this.add.text(640, 300, `Next: ${CIDRUtils.getTierName(nextTier)}`, {
				fontSize: "24px",
				color: "#00ff00",
				fontFamily: "Arial"
			});
			this.nextTierText.setOrigin(0.5, 0.5);
			this.nextTierText.setDepth(2001);
		} else {
			this.nextTierText = this.add.text(640, 300, "Max Tier Reached!", {
				fontSize: "24px",
				color: "#ffaa00",
				fontFamily: "Arial"
			});
			this.nextTierText.setOrigin(0.5, 0.5);
			this.nextTierText.setDepth(2001);
		}

		// Calculate and display bonuses
		const prestigeData = this.gameState.getPrestigeData();
		const bandwidthBonus = Math.sqrt(this.gameState.getTotalBandwidth() / 1000);
		const newMultipliers = {
			bandwidth: prestigeData.permanentMultipliers.bandwidthMultiplier + bandwidthBonus * 0.1,
			income: prestigeData.permanentMultipliers.incomeMultiplier + bandwidthBonus * 0.1,
			vision: prestigeData.permanentMultipliers.visionMultiplier + (prestigeData.totalPrestiges + 1) * 0.05
		};

		this.bonusText = this.add.text(640, 400, 
			`Permanent Bonuses:\n` +
			`Bandwidth: +${(newMultipliers.bandwidth - prestigeData.permanentMultipliers.bandwidthMultiplier).toFixed(2)}x\n` +
			`Income: +${(newMultipliers.income - prestigeData.permanentMultipliers.incomeMultiplier).toFixed(2)}x\n` +
			`Vision: +${(newMultipliers.vision - prestigeData.permanentMultipliers.visionMultiplier).toFixed(2)}x`,
			{
				fontSize: "20px",
				color: "#ffff00",
				fontFamily: "Arial",
				align: "center"
			}
		);
		this.bonusText.setOrigin(0.5, 0.5);
		this.bonusText.setDepth(2001);

		// Warning text
		const warningText = this.add.text(640, 500, "This will reset your infrastructure but keep permanent bonuses.", {
			fontSize: "18px",
			color: "#ff6666",
			fontFamily: "Arial"
		});
		warningText.setOrigin(0.5, 0.5);
		warningText.setDepth(2001);

		// Confirm button
		if (nextTier) {
			this.confirmButton = this.add.rectangle(540, 600, 150, 50, 0x00ff00, 1);
			this.confirmButton.setInteractive({ useHandCursor: true });
			this.confirmButton.on('pointerdown', () => {
				this.performPrestige(nextTier);
			});
			this.confirmButton.setDepth(2001);

			const confirmText = this.add.text(540, 600, "CONFIRM", {
				fontSize: "20px",
				color: "#000000",
				fontFamily: "Arial",
				fontStyle: "bold"
			});
			confirmText.setOrigin(0.5, 0.5);
			confirmText.setDepth(2002);
		}

		// Cancel button
		this.cancelButton = this.add.rectangle(740, 600, 150, 50, 0xff0000, 1);
		this.cancelButton.setInteractive({ useHandCursor: true });
		this.cancelButton.on('pointerdown', () => {
			this.scene.stop();
		});
		this.cancelButton.setDepth(2001);

		const cancelText = this.add.text(740, 600, "CANCEL", {
			fontSize: "20px",
			color: "#ffffff",
			fontFamily: "Arial",
			fontStyle: "bold"
		});
		cancelText.setOrigin(0.5, 0.5);
		cancelText.setDepth(2002);

		// Close on ESC
		this.input.keyboard?.on('keydown-ESC', () => {
			this.scene.stop();
		});
	}

	private performPrestige(newCIDR: CIDRTier): void {
		// Perform prestige
		this.gameState.performPrestige(newCIDR);

		// Show success message
		const successText = this.add.text(640, 360, "SUBNET JUMP COMPLETE!", {
			fontSize: "36px",
			color: "#00ff00",
			fontFamily: "Arial",
			fontStyle: "bold"
		});
		successText.setOrigin(0.5, 0.5);
		successText.setDepth(2003);

		// Close after delay
		this.time.delayedCall(2000, () => {
			this.scene.stop();
			// Restart MainMap scene to reset nodes
			this.scene.get("MainMap").scene.restart();
		});
	}
}
