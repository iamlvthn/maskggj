import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * DDoSProtect sprite - simple visual representation of a DDoS protection node
 * All game logic is in NodeDataManager
 */
export class DDoSProtect extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.DDoSProtect);
	}
}
