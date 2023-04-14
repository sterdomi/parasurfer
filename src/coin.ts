import { Train } from "./train";
import { Jake } from "./jake";
import { GL_BL_ASSETS } from "./init";
import { initBuffers, drawObject3D } from "./utils";
import { mat4 } from "gl-matrix";
import { Track } from "./tracks";
import {Police} from "./police";


export class Coin{
    position   : Vector3;
    initpostion: Vector3;
    rotation   : Vector3;
    parent     : Train|Track|Police = null;
    object     : any;
    texture    : HTMLImageElement;
    isBomb:boolean=false;
    gl         : WebGLRenderingContext;
    buffers    : Buffer;
    player     : Jake;
    program    : Program;
    bbox       : Bbox;
    dead       : boolean = false;

    constructor(position: Vector3, player: Jake, parent?:Train|Track|Police){
        this.player = player;
        if (parent){
            this.parent = parent;
        }
        this.gl     = player.gl;
        this.program = player.program;
        this.position = position;
        this.initpostion = {
            x: position.x,
            y: position.y,
            z: position.z,
        };

        this.bbox = {
            height : 4.48,
            length : 1,
            width  : 4.48
        };

        this.rotation = {
            x: 0,
            y: 0,
            z: 90
        };
        let randomSwitch=Math.random() > parent.world.randomBomb;
        if(randomSwitch){
            this.object = GL_BL_ASSETS.objects['bomb'];
            this.texture = GL_BL_ASSETS.textures['bomb'];
            this.isBomb=true;
        }else {
            this.object = GL_BL_ASSETS.objects['coin'];
            this.texture = GL_BL_ASSETS.textures['coin'];
        }
        this.buffers = initBuffers(player.gl, this.object);
    }

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        if (!this.dead) {
            drawObject3D(this.gl, programinfo, projectionMatrix, this);
        };
    };

    tick(position?: Vector3):void{
        if(this.parent){
            this.position = {
                x: this.position.x + this.parent.speed.x,
                y: this.position.y,
                z: this.position.z
            };
        }
        this.rotation.y += 3;

    }
}
