import { GL_BL_ASSETS } from "./init";
import { loadObj, loadImg, initBuffers, drawObject3D } from "./utils";
import { World } from "./world";
import { Coin } from "./coin";
import { mat4 } from "gl-matrix";

export class Train{
    position        : Vector3;
    rotation        : Vector3;
    dead            : boolean = false;
    speed           : Vector3;
    bbox            : Bbox;
    texture         : HTMLImageElement;
    object          : any;
    gl              : WebGLRenderingContext;
    world           : World;
    buffers         : Buffer;
    coins           : Coin[];
    lane            : number = 0;
    constructor(position: Vector3, world: World){
        this.position = {
            x: position.x,
            y: position.y + 11.761,
            z: position.z,
        };
        this.speed = {
            x : -0.5,
            y : 0,
            z : 0
        };
        this.rotation = {
            x : 0,
            y : 0,
            z : 0
        };

        this.lane = this.position.z / 20;

        this.bbox = {
            height: 26.45 / window['sclae'],
            length: 76.7 / window['sclae'],
            width : 16.7  / window['sclae']
        };
        this.world = world;
        this.gl = world.gl;
        this.texture = GL_BL_ASSETS.textures['trainblock'];
        this.object = GL_BL_ASSETS.objects['trainblock'];
        this.buffers = initBuffers(this.gl, this.object);
        this.coins = [];

    }

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    }

    tick(deltaTime:number): void {
        if (this.position.x - this.world.player.position.x < -100){
            this.dead = true;
            return;
        }
        if(!this.world.player.dead) {
            this.position.x += this.speed.x*(1+deltaTime);
            this.position.y += this.speed.y*(1+deltaTime);
            this.position.z += this.speed.z*(1+deltaTime);
        }
    };

}
