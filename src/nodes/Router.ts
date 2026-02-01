import Phaser from "phaser";
import { NodeSprite } from "./BaseNode";
import { NodeType } from "../types/GameTypes";

/**
 * Router sprite - simple visual representation of a router node
 * All game logic is in NodeDataManager
 */
export class Router extends NodeSprite {
	constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
		super(scene, x, y, id, NodeType.Router);
	}
}
