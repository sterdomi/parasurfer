import {Jake} from "./jake";
import { GL_BL_ASSETS } from "./init";
import { drawObject3D, initBuffers } from "./utils";
import { mat4 } from "gl-matrix";
import { World } from "./world";

export class Croucher{
    world     : World;
    player    : Jake;
    dead      : boolean = false;
    object    : any;
    position : Vector3;
    rotation  : Vector3;
    texture   : HTMLImageElement;
    gl        : WebGLRenderingContext;
    buffers   : Buffer;
    bbox      : Bbox;
    constructor(position: Vector3, player: Jake){
        this.player = player;
        this.gl = player.gl;
        this.world = player.world;
        this.position = position;
        this.rotation = {
            x:0, y:0, z:0
        };

        this.bbox = {
            height : 10.06,
            length : 1.02,
            width  : 10.37,
            innerheight: 5.56,
            innerwidth : 5.128,
            innerlength : 1.02,
        };

        this.object = GL_BL_ASSETS.objects['croucher'];
        this.texture = GL_BL_ASSETS.textures['croucher'];
        this.buffers = initBuffers(this.gl, this.object);
    }
    tick():void{
        if((Math.abs(this.position.x-this.world.player.position.x)<5) &&
            (Math.abs(this.position.z-this.world.player.position.z)<5) &&
            !this.player.crouching
        ){
            this.player.dead=true;
        }
    };

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    }
}
