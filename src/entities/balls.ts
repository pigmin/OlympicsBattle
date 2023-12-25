import { Scene } from "@babylonjs/core/scene";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR"
import {  Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { MeshBuilder, Scalar } from "@babylonjs/core";

import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";


import "@babylonjs/core/Physics/physicsEngineComponent";
// If you don't need the standard material you will still need to import it since the scene requires it.
import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import waterBump from "../../assets/textures/waterbump.png"
import floorBump from "../../assets/textures/floor_bump.png"


export default class BallsManager {

    scene! : Scene;
    myMaterial! : PBRMaterial;
    shadowGen! : ShadowGenerator;

    constructor(scene : Scene, shadowGen: ShadowGenerator) {
        this.scene = scene;
        this.shadowGen = shadowGen;
        console.log("BallsManager");
    }

    init() {
        console.log("BallsManager.init");

        //var mat = BABYLON.Material.createDefaultEnvironment();
        this.myMaterial = new PBRMaterial("mat1", this.scene);
        // Ensures irradiance is computed per fragment to make the 
        // Bump visible
        this.myMaterial.forceIrradianceInFragment = true;
        this.myMaterial.bumpTexture = new Texture(floorBump, this.scene);
        this.myMaterial.metallic = 0.5;
        this.myMaterial.roughness = 0.5;       
        this.myMaterial.clearCoat.isEnabled = true;
        const coatBump = new Texture(waterBump, this.scene);
        this.myMaterial.clearCoat.bumpTexture = coatBump;
        
    }

    createClones() {
        // Our built-in 'sphere' shape.
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, this.scene);
        // Move the sphere upward 1/2 its height
        
        sphere.material = this.myMaterial;
        this.shadowGen.addShadowCaster(sphere);

        //Scene render/register
        const sphereArray = [];
        for (let i = 0; i < 100; i++)
        {
            const matrix2 = Matrix.Translation(Scalar.RandomRange(-64, 64), Scalar.RandomRange(4, 22), Scalar.RandomRange(-64, 64));
            sphereArray.push(matrix2);

        }
        sphere.thinInstanceAdd(sphereArray);
        new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1.0, restitution:0.2, friction: 1.0}, this.scene);
        sphere.receiveShadows = true;
        
    }
}