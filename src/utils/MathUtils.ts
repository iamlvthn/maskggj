export class MathUtils {
	/**
	 * Calculate distance between two points
	 */
	public static distance(x1: number, y1: number, x2: number, y2: number): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Clamp a value between min and max
	 */
	public static clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	/**
	 * Linear interpolation
	 */
	public static lerp(start: number, end: number, t: number): number {
		return start + (end - start) * t;
	}

	/**
	 * Check if a point is within a circle
	 */
	public static pointInCircle(
		px: number,
		py: number,
		cx: number,
		cy: number,
		radius: number
	): boolean {
		return this.distance(px, py, cx, cy) <= radius;
	}
}
