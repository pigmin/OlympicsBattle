import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";

// Change this import to check other scenes
import { PhysicsSceneWithHavok } from "./scenes/physicsWithHavok";

export interface CreateSceneClass {
    createScene: (engine: Engine, canvas: HTMLCanvasElement) => Promise<Scene>;
    preTasks?: Promise<unknown>[];
}

export interface CreateSceneModule {
    default: CreateSceneClass;
}

export const getSceneModule = (): CreateSceneClass => {
    return new PhysicsSceneWithHavok();
}
