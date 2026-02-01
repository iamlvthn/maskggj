import { CIDRTier, PrestigeData } from "../types/GameTypes";

class GameState {
	private static instance: GameState;

	private money: number = 0; // Bandwidth ($)
	private currentCIDR: CIDRTier = CIDRTier.CIDR_24;
	private totalBandwidth: number = 0;
	private prestigeData: PrestigeData = {
		totalPrestiges: 0,
		permanentMultipliers: {
			bandwidthMultiplier: 1.0,
			incomeMultiplier: 1.0,
			visionMultiplier: 1.0
		}
	};

	private constructor() {
		// Private constructor for singleton
	}

	public static getInstance(): GameState {
		if (!GameState.instance) {
			GameState.instance = new GameState();
		}
		return GameState.instance;
	}

	// Money (Bandwidth) management
	public getMoney(): number {
		return this.money;
	}

	public addMoney(amount: number): void {
		this.money += amount * this.prestigeData.permanentMultipliers.incomeMultiplier;
	}

	public spendMoney(amount: number): boolean {
		if (this.money >= amount) {
			this.money -= amount;
			return true;
		}
		return false;
	}

	// CIDR tier management
	public getCurrentCIDR(): CIDRTier {
		return this.currentCIDR;
	}

	public setCIDR(tier: CIDRTier): void {
		this.currentCIDR = tier;
	}

	public getVisionRadius(): number {
		// Vision radius based on CIDR tier
		// Lower CIDR number = larger subnet = more vision
		const baseRadius = 200;
		const tierMultiplier = (32 - this.currentCIDR) * 50;
		return (baseRadius + tierMultiplier) * this.prestigeData.permanentMultipliers.visionMultiplier;
	}

	// Bandwidth management
	public getTotalBandwidth(): number {
		return this.totalBandwidth;
	}

	public addBandwidth(amount: number): void {
		this.totalBandwidth += amount;
	}

	public removeBandwidth(amount: number): void {
		this.totalBandwidth = Math.max(0, this.totalBandwidth - amount);
	}

	// Prestige management
	public getPrestigeData(): PrestigeData {
		return { ...this.prestigeData };
	}

	public performPrestige(newCIDR: CIDRTier): void {
		// Calculate prestige bonus based on current progress
		const bandwidthBonus = Math.sqrt(this.totalBandwidth / 1000);
		const prestigeBonus = 1 + (this.prestigeData.totalPrestiges * 0.1);

		// Update multipliers
		this.prestigeData.permanentMultipliers.bandwidthMultiplier += bandwidthBonus * 0.1;
		this.prestigeData.permanentMultipliers.incomeMultiplier += bandwidthBonus * 0.1;
		this.prestigeData.permanentMultipliers.visionMultiplier += prestigeBonus * 0.05;

		// Increment prestige count
		this.prestigeData.totalPrestiges++;

		// Reset game state but keep multipliers
		this.money = 0;
		this.totalBandwidth = 0;
		this.currentCIDR = newCIDR;
	}

	// Reset (for testing or new game)
	public reset(): void {
		this.money = 0;
		this.currentCIDR = CIDRTier.CIDR_24;
		this.totalBandwidth = 0;
		this.prestigeData = {
			totalPrestiges: 0,
			permanentMultipliers: {
				bandwidthMultiplier: 1.0,
				incomeMultiplier: 1.0,
				visionMultiplier: 1.0
			}
		};
	}
}

export default GameState;
