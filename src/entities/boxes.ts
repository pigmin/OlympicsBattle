import { Scene } from "@babylonjs/core/scene";
import { Animation } from "@babylonjs/core/Animations"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR"
import { Vector3, Matrix, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Mesh, MeshBuilder, Scalar, StandardMaterial } from "@babylonjs/core";

import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";


import "@babylonjs/core/Physics/physicsEngineComponent";
// If you don't need the standard material you will still need to import it since the scene requires it.
import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import grass from "../../assets/textures/cubes/grass_cube.png"


export default class BoxManager {

    scene!: Scene;
    shadowGen!: ShadowGenerator;
    myMaterial!: StandardMaterial;
    box!: Mesh;
    boxesArray: Matrix[][] = [];
    readonly gridRows = 20;
    readonly gridCols = 20;

    constructor(scene: Scene, shadowGen: ShadowGenerator) {
        this.scene = scene;
        this.shadowGen = shadowGen;
        console.log("BallsManager");
    }

    init() {
        console.log("BallsManager.init");

        //var mat = BABYLON.Material.createDefaultEnvironment();
        this.myMaterial = new StandardMaterial("mat1", this.scene);
        // Ensures irradiance is computed per fragment to make the 
        // Bump visible
        this.myMaterial.diffuseTexture = new Texture(grass, this.scene);
        this.myMaterial.roughness = 1.0;

        const columns = 6;  // 6 columns
        const rows = 1;  // 4 rows

        const faceUV = new Array(6);
        /*side 0 faces the positive z direction
        side 1 faces the negative z direction
        side 2 faces the positive x direction
        side 3 faces the negative x direction
        side 4 faces the positive y direction
        side 5 faces the negative y direction
        */
        for (let i = 0; i < 6; i++) {
            faceUV[i] = new Vector4(i / columns, 0, (i + 1) / columns, 1 / rows);
        }

        const options = {
            size: 4,
            faceUV: faceUV,
            wrap: true,
        };
        // Our built-in 'sphere' shape.
        this.box = MeshBuilder.CreateBox("box", options, this.scene);
        // Move the sphere upward 1/2 its height
        this.shadowGen.addShadowCaster(this.box);
        this.box.material = this.myMaterial;
        this.box.receiveShadows = true;

        const tmpBox = MeshBuilder.CreateBox("boxTmp", options, this.scene);
        tmpBox.material = this.myMaterial;
        const spinAnim = this.createSpinAnimation();
        tmpBox.animations.push(spinAnim);
        this.scene.beginAnimation(tmpBox, 0, 360, true);

    }

    createClones() {


        //Scene render/register

        for (let x = -(this.gridRows / 2); x < (this.gridRows / 2); x++) {
            this.boxesArray[x] = [];
            for (let z = -(this.gridCols / 2); z < (this.gridCols / 2); z++) {
                const matrix2 = Matrix.Translation(x * 10 + Scalar.RandomRange(-1, 1), Scalar.RandomRange(0, 20), z * 10 + Scalar.RandomRange(-1, 1));
                this.boxesArray[x][z] = matrix2;
            }

            this.box.thinInstanceAdd(this.boxesArray[x], true);
        }
        new PhysicsAggregate(this.box, PhysicsShapeType.BOX, { mass: 2.0, restitution: 0.5, friction: 1.0 }, this.scene);

    }

    createSpinAnimation() {
        const orbitAnim = new Animation("planetspin", "rotation.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: 0
        });

        keyFrames.push({
            frame: 360,
            value: Scalar.TwoPi
        });

        orbitAnim.setKeys(keyFrames);
        return orbitAnim;
    }
}