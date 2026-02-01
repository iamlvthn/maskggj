import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * VPN sprite - simple visual representation of a VPN node
 * All game logic is in NodeDataManager
 */
export class VPN extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.VPN);
	}
}
