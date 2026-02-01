import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * Honeypot sprite - simple visual representation of a honeypot node
 * All game logic is in NodeDataManager
 */
export class Honeypot extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.Honeypot);
	}
}
