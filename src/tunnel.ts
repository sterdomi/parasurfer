import { GL_BL_ASSETS } from "./init";
import { initBuffers, drawObject3D } from "./utils";

import { World } from "./world";
import { mat4 } from "gl-matrix";

export class Tunnel {
    position: Vector3;
    rotation: Vector3;
    type    : string;
    texture: HTMLImageElement;
    object: any;
    world: World;
    gl: WebGLRenderingContext;
    buffers: Buffer;
    program: Program;
    constructor(position : Vector3, world: World, type:string, program?: Program) {
        if (program) {
            this.program = program;
        }
        this.type = type;
        this.world = world;
        this.position = position;
        this.gl = world.gl;
        this.rotation = {
            x: 0,
            y: 0,
            z: 0
        };

        this.object = GL_BL_ASSETS.objects[this.type];
        this.texture = GL_BL_ASSETS.textures[this.type];
        this.buffers = initBuffers(this.gl, this.object);
    }

    tick(): void | boolean {
        // noop
    }

    draw(projectionMatrix: mat4, programinfo: Program, deltatime: number): void {
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    };
};
