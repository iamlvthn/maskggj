import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * Host sprite - simple visual representation of a host node
 * All game logic is in NodeDataManager
 */
export class Host extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.Host);
	}
}
