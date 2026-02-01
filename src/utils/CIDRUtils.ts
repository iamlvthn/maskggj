import { CIDRTier } from "../types/GameTypes";

export class CIDRUtils {
	/**
	 * Calculate the number of available IPs for a CIDR notation
	 */
	public static getAvailableIPs(cidr: CIDRTier): number {
		return Math.pow(2, 32 - cidr);
	}

	/**
	 * Calculate the subnet mask in decimal notation
	 */
	public static getSubnetMask(cidr: CIDRTier): string {
		const mask = 0xFFFFFFFF << (32 - cidr);
		const parts = [
			(mask >>> 24) & 0xFF,
			(mask >>> 16) & 0xFF,
			(mask >>> 8) & 0xFF,
			mask & 0xFF
		];
		return parts.join(".");
	}

	/**
	 * Get the next tier CIDR (for prestige)
	 */
	public static getNextTier(currentTier: CIDRTier): CIDRTier | null {
		const tiers: CIDRTier[] = [
			CIDRTier.CIDR_30,
			CIDRTier.CIDR_24,
			CIDRTier.CIDR_20,
			CIDRTier.CIDR_16,
			CIDRTier.CIDR_12,
			CIDRTier.CIDR_8
		];

		const currentIndex = tiers.indexOf(currentTier);
		if (currentIndex < tiers.length - 1) {
			return tiers[currentIndex + 1];
		}
		return null;
	}

	/**
	 * Get display name for CIDR tier
	 */
	public static getTierName(cidr: CIDRTier): string {
		return `/${cidr}`;
	}
}
