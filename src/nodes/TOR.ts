import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * TOR sprite - simple visual representation of a TOR node
 * All game logic is in NodeDataManager
 */
export class TOR extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.TOR);
	}
}
