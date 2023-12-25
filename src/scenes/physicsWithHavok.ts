import { Engine } from "@babylonjs/core/Engines/engine";
import { AssetsManager } from "@babylonjs/core/Misc";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Quaternion, Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR";
import { GrassProceduralTexture } from "@babylonjs/procedural-textures";
import "@babylonjs/core/Physics/physicsEngineComponent";

// If you don't need the standard material you will still need to import it since the scene requires it.
import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import { CreateSceneClass } from "../createScene";
import { havokModule } from "../externals/havok";
import {
    PhysicsShapeBox,
    PhysicsShapeSphere,
} from "@babylonjs/core/Physics/v2/physicsShape";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper";
import {
    AbstractMesh,
    Color3,
    Color4,
    FlyCamera,
    FreeCamera,
    IParticleSystem,
    ParticleHelper,
    ParticleSystem,
    PointerEventTypes,
    TransformNode,
    Viewport,
} from "@babylonjs/core";
import { Tools } from "@babylonjs/core/Misc";
import { MeshBuilder, Mesh, BackgroundMaterial } from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Maths/math.vector";
import "@babylonjs/loaders";

import grassTextureUrl from "../../assets/textures/grass.png";
import roomEnvironment from "../../assets/environment/room.env";
import heightMap from "../../assets/textures/heightMap.png";
import bowlingBallModel from "../../assets/meshes/bowlingBall.glb";
import studModel from "../../assets/meshes/stud.glb";
import controllerModel from "../../assets/glb/samsung-controller.glb";

import BallsManager from "../entities/balls";
import BoxManager from "../entities/boxes";

export class PhysicsSceneWithHavok implements CreateSceneClass {
    preTasks = [havokModule];

    shadowGenerator!: ShadowGenerator;
    scene!: Scene;

    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = (this.scene = new Scene(engine));
        // load the environment file
        scene.environmentTexture = new CubeTexture(roomEnvironment, scene);
        // PHYSICS!
        scene.enablePhysics(null, new HavokPlugin(true, await havokModule));
        scene.clearColor = new Color4(0.0, 0.0, 0.0, 1.0);

        // Create a skydome
        const skybox = MeshBuilder.CreateBox(
            "skybox",
            { size: 10240.0 },
            scene
        );
        const skyboxMaterial = new StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        const reflectionTexture = (skyboxMaterial.reflectionTexture =
            scene.environmentTexture.clone());
        reflectionTexture!.coordinatesMode = Texture.SKYBOX_MODE;

        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        // This creates and positions a free camera (non-mesh)
        // Parameters: name, position, scene
        // This creates and positions a free camera (non-mesh)
        /*  const camera = new ArcRotateCamera("my first camera", 0, Math.PI / 3, 10, new Vector3(0, 0, 0), scene);
    
        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());
        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);
        */

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light2 = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );

        // Default intensity is 1. Let's dim the light a small amount
        light2.intensity = 0.3;
        const camera = new FlyCamera(
            "FlyCamera",
            new Vector3(0, 5, -50),
            scene
        );

        // Airplane like rotation, with faster roll correction and banked-turns.
        // Default is 100. A higher number means slower correction.
        camera.rollCorrect = 50;
        // Default is false.
        camera.bankedTurn = true;
        // Defaults to 90° in radians in how far banking will roll the camera.
        camera.bankedTurnLimit = Math.PI / 4;
        // How much of the Yawing (turning) will affect the Rolling (banked-turn.)
        // Less than 1 will reduce the Rolling, and more than 1 will increase it.
        camera.bankedTurnMultiplier = 1;

        // This attaches the camera to the canvas
        camera.attachControl(true);

        const camera2 = new FreeCamera(
            "FlyCamera",
            new Vector3(10, 5, -10),
            scene
        );
        camera2.setTarget(new Vector3(0, 0, 0));

        camera.viewport = new Viewport(0, 0, 1, 1);
        camera2.viewport = new Viewport(0.8, 0.8, 0.2, 0.2);
        scene.activeCameras!.push(camera);
        scene.activeCameras!.push(camera2);

        const CoT = new TransformNode("root");

        const box = MeshBuilder.CreateBox("Box", { size: 2 }, scene);
        box.parent = CoT;

        // Our built-in 'sphere' shape.
        const bigSphere = CreateSphere(
            "sphere",
            { diameter: 3, segments: 32 },
            scene
        );

        // Move the sphere upward at 4 units
        bigSphere.position.y = 4;
        bigSphere.isPickable = true;

        // Smoke
        ParticleHelper.CreateAsync("smoke", scene).then((set) => {
            const pm: IParticleSystem = set.systems[0];
            pm.emitter = bigSphere;
            pm.isLocal = false;
            set.start();
        });

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;
        light.shadowMaxZ = 130;
        light.shadowMinZ = 10;

        this.shadowGenerator = new ShadowGenerator(512, light);
        this.shadowGenerator.usePercentageCloserFiltering = true;

        this.shadowGenerator.setDarkness(0.5);
        this.shadowGenerator.addShadowCaster(bigSphere);

        ParticleHelper.CreateAsync("sun", scene, true).then((set) => {
            set.start();
        });

        const grassMaterial = new StandardMaterial("grassMat", scene);
        const grassTexture = new GrassProceduralTexture("grassTex", 256, scene);
        grassTexture.uScale = 32;
        grassTexture.vScale = 32;
        grassMaterial.diffuseTexture = grassTexture;
        grassMaterial.roughness = 1.0;

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        const diffuseTexture = new Texture(grassTextureUrl, scene);
        diffuseTexture.uScale = 32;
        diffuseTexture.vScale = 32;
        groundMaterial.diffuseTexture = diffuseTexture;
        groundMaterial.roughness = 1.0;

        // Our built-in 'ground' shape.
        //let ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 512, height: 512 }, scene);
        const ground = MeshBuilder.CreateGroundFromHeightMap(
            "ground",
            heightMap,
            {
                width: 256,
                height: 256,
                subdivisions: 512,
                minHeight: 0,
                maxHeight: 10,
                updatable: false,
                onReady: function (mesh) {
                    new PhysicsAggregate(
                        mesh,
                        PhysicsShapeType.MESH,
                        { mass: 0, restitution: 0.1, friction: 10.0 },
                        scene
                    );
                },
            },
            scene
        );
        // Our built-in 'ground' shape.
        //const ground = CreateGround("ground", { width: 100, height: 100 }, scene);

        ground.position.y = -20;
        ground.material = grassMaterial;
        ground.receiveShadows = true;

        // Create a sphere shape
        const sphereShape = new PhysicsShapeSphere(
            new Vector3(0, 0, 0),
            1,
            scene
        );

        // Sphere body
        const sphereBody = new PhysicsBody(
            bigSphere,
            PhysicsMotionType.DYNAMIC,
            false,
            scene
        );
        // Set shape material properties
        sphereShape.material = { friction: 0.2, restitution: 0.6 };
        // Associate shape and body
        sphereBody.shape = sphereShape;
        // And body mass
        sphereBody.setMassProperties({ mass: 1 });

        //const ballsManager = new BallsManager(scene, this.shadowGenerator);
        //ballsManager.init();
        const boxesManager = new BoxManager(scene, this.shadowGenerator);
        boxesManager.init();

        //Third version : AssetManager
        const assetsManager = new AssetsManager(scene);

        const start = function () {
            //ballsManager.createClones();
            boxesManager.createClones();
        };

        assetsManager.onFinish = function (tasks) {
            start();
        };

        const myMeshes: AbstractMesh[] = [];

        // this.LoadEntity("stud", "", "", studModel, assetsManager, myMeshes, 0, {}, this.scene);
        this.LoadEntity(
            "bownlingBall",
            "",
            "",
            bowlingBallModel,
            assetsManager,
            myMeshes,
            0,
            {},
            this.scene,
            this.shadowGenerator
        );

        assetsManager.load();

        //Animation
        let angle = 0;
        scene.onBeforeRenderObservable.add(() => {
            CoT.rotation.y = angle;
            angle += 0.01;
        });

        let startingPoint: any;
        let currentMesh: any;

        const getGroundPosition = function () {
            const pickinfo = scene.pick(
                scene.pointerX,
                scene.pointerY,
                function (mesh) {
                    return mesh == ground;
                }
            );
            if (pickinfo.hit) {
                return pickinfo.pickedPoint;
            }

            return null;
        };

        const pointerDown = function (mesh: any) {
            currentMesh = mesh;
            startingPoint = getGroundPosition();
            if (startingPoint) {
                // we need to disconnect camera from canvas
                setTimeout(function () {
                    camera.detachControl();
                }, 0);
            }
        };

        const pointerUp = function () {
            if (startingPoint) {
                camera.attachControl(true);
                startingPoint = null;
                return;
            }
        };

        const pointerMove = function () {
            if (!startingPoint) {
                return;
            }
            const current = getGroundPosition();
            if (!current) {
                return;
            }

            const diff = current.subtract(startingPoint);
            currentMesh.position.addInPlace(diff);

            startingPoint = current;
        };

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (
                        pointerInfo?.pickInfo?.hit &&
                        pointerInfo.pickInfo.pickedMesh != ground
                    ) {
                        pointerDown(pointerInfo.pickInfo.pickedMesh);
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    pointerUp();
                    break;
                case PointerEventTypes.POINTERMOVE:
                    pointerMove();
                    break;
            }
        });
        return scene;
    };

    LoadEntity = function (
        name: string,
        meshNameToLoad: string,
        url: string,
        file: string,
        manager: AssetsManager,
        meshArray: AbstractMesh[],
        entity_number: number,
        props: any,
        scene: Scene,
        shadowGenerator: ShadowGenerator
    ) {
        const meshTask = manager.addMeshTask(name, meshNameToLoad, url, file);

        meshTask.onSuccess = function (task) {
            const parent = task.loadedMeshes[0];
            const obj = parent.getChildMeshes()[0];
            obj.setParent(null);
            //parent.dispose();

            meshArray[entity_number] = obj;
            meshArray[entity_number].position = Vector3.Zero();
            meshArray[entity_number].rotation = Vector3.Zero();

            if (props) {
                if (props.scaling) {
                    meshArray[entity_number].scaling.copyFrom(props.scaling);
                }
                if (props.position) {
                    meshArray[entity_number].position.copyFrom(props.position);
                }
            }

            //test.position.x = 3;
            //test.rotation = Vector3.Zero();

            shadowGenerator.addShadowCaster(obj);
            obj.receiveShadows = true;

            new PhysicsAggregate(
                obj,
                PhysicsShapeType.MESH,
                { mass: 1, restitution: 0.88 },
                scene
            );
        };
        meshTask.onError = function (e) {
            console.log(e);
        };
    };
}

export default new PhysicsSceneWithHavok();
