import {Jake} from "./jake";
import { GL_BL_ASSETS } from "./init";
import { drawObject3D, initBuffers } from "./utils";
import { mat4 } from "gl-matrix";
import { World } from "./world";

export class Pole{
    world     : World;
    player    : Jake;
    dead      : boolean = false;
    object    : any;
    position : Vector3;
    rotation  : Vector3;
    texture   : HTMLImageElement;
    gl        : WebGLRenderingContext;
    buffers   : Buffer;
    lane      : number = 0;
    bbox      : Bbox;
    constructor(player: Jake, position: Vector3){
        this.player = player;
        this.gl = player.gl;
        this.world = player.world;
        this.position = position;
        this.rotation = {
            x:0, y:-90, z:0
        };

        this.bbox = {
            height: 36.4,
            length: 4,
            width : 4,
        };

        this.lane = this.position.z / 20;
        this.position = {
            x:position.x,
            y:position.y,
            z:position.z - (this.lane * 10)
        };

        this.object = GL_BL_ASSETS.objects['pole'];
        this.texture = GL_BL_ASSETS.textures['pole'];
        this.buffers = initBuffers(this.gl, this.object);
    }
    tick():void{
        this.rotation.y += 0.1;
    };
    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    }
}
