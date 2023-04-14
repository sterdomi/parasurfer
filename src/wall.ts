import {Jake} from "./jake";
import { GL_BL_ASSETS } from "./init";
import { drawObject3D, initBuffers } from "./utils";
import { mat4 } from "gl-matrix";
import { World } from "./world";

export class Wall{
    world     : World;
    player    : Jake;
    dead      : boolean = false;
    object    : any;
    position : Vector3;
    rotation  : Vector3;
    texture   : HTMLImageElement;
    gl        : WebGLRenderingContext;
    buffers   : Buffer;
    constructor(position: Vector3, player: Jake){
        this.player = player;
        this.gl = player.gl;
        this.world = player.world;
        this.position = position;
        this.rotation = {
            x:0, y:0, z:0
        };

        this.object = GL_BL_ASSETS.objects['wall'];
        this.texture = GL_BL_ASSETS.textures['wall'];
        this.buffers = initBuffers(this.gl, this.object);
    }

    tick():void{
        //noop
    };

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    }
}
