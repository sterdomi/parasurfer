import { GL_BL_ASSETS } from "./init";
import { initBuffers, drawObject3D } from "./utils";

import { World } from "./world";
import { mat4 } from "gl-matrix";
import {Coin} from "./coin";

export class Police {
    position: Vector3;
    rotation: Vector3;
    speed: Vector3;
    texture: HTMLImageElement;
    object: any;
    world: World;
    gl: WebGLRenderingContext;
    buffers: Buffer;
    lane: number;
    program: Program;
    distance: number;
    coins      : Coin[];
    counter:number;
    switchinglane    : boolean = false;
    movingleft       : boolean = false;
    movingright      : boolean = false;
    nextlane        : number = 0;
    switchstartpos   : number = 0;
    jumping         : boolean = false;
    jumping_direction: number=0;
    ontrain         : boolean = false;
    jumpmax         : number=16;
    constructor(world: World, program?: Program) {
        if (program) {
            this.program = program;
        }
        this.world = world;
        this.position = { x: world.player.position.x, y: world.player.position.y, z: world.player.position.z };
        this.gl = world.gl;
        this.distance = 50;
        this.lane = world.player.lane;
        this.speed = {
            x: 0.5,
            y: 2,
            z: 1
        };
        this.rotation = {
            x: 0,
            y: 180,
            z: 0
        };
        this.coins = [];
        this.object = GL_BL_ASSETS.objects['police'];
        this.buffers = initBuffers(this.gl, this.object);
        this.texture = GL_BL_ASSETS.textures['police'];

    }

    getRandomInt(min, max):number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomSwitch(){
        let randomSwitch=Math.random() > 0.99;
        if(randomSwitch && !this.switchinglane){
            if(this.lane==-1){
                this.switchinglane=true;
                this.movingright=true;
                this.nextlane=0;

                this.switchstartpos=this.position.z;
            }else if(this.lane==1){
                this.switchinglane=true;
                this.movingleft=true;
                this.nextlane=0;
                this.switchstartpos=this.position.z;
            }else if(this.lane==0){
                let random=this.getRandomInt(0,1);
                if(random==0){
                    this.switchinglane=true;
                    this.movingright=true;
                    this.nextlane=1;
                    this.switchstartpos=this.position.z;
                }else{
                    this.switchinglane=true;
                    this.movingleft=true;
                    this.nextlane=-1;
                    this.switchstartpos=this.position.z;
                }
            }
            if(!this.ontrain && this.trainOnMyWay(this.nextlane)){
                this.jumping=true;
                this.jump(this.nextlane);
            }
        }else{
            if(!this.ontrain && this.trainOnMyWay(this.lane)){
                this.jumping=true;
            }
        }
    }

    switchlane(){
        this.randomSwitch();
        if (this.switchinglane && this.nextlane == 1){
            this.position.z += this.speed.z;
            if (this.position.z - this.switchstartpos > 22){
                this.lane=this.nextlane;
                this.movingleft = false;
                this.movingright = false;
                this.switchinglane = false;
            }
        }
        if (this.switchinglane && this.nextlane == -1){
            this.position.z -= this.speed.z;
            if (this.switchstartpos - this.position.z > 22){
                this.lane=this.nextlane;
                this.movingleft = false;
                this.movingright = false;
                this.switchinglane = false;
            }
        }
        if (this.switchinglane && this.nextlane == 0 && this.movingright){
            this.position.z += this.speed.z;
            if (this.position.z - this.switchstartpos > 22){
                this.lane=this.nextlane;
                this.movingleft = false;
                this.movingright = false;
                this.switchinglane = false;
            }
        }
        if (this.switchinglane && this.nextlane == 0 && this.movingleft){
            this.position.z -= this.speed.z;
            if (this.switchstartpos-this.position.z  > 22){
                this.lane=this.nextlane;
                this.movingleft = false;
                this.movingright = false;
                this.switchinglane = false;
            }
        }
    };
    tick(){
        var player = this.world.player;
        if (player.dead){
            this.distance = 10;
        }
        this.position.x = player.position.x + (this.distance);
        this.switchlane();
        if (this.position.y > 20){
            this.position.y = 0;
        }
        if (!player.dead && Math.random() > 0.98) {
                this.coins.push(
                    new Coin(
                        {
                            x: this.position.x -8,
                            y: this.position.y + 5,
                            z: this.position.z,
                        },
                        this.world.player, this)
                );
        }
        this.coins.forEach(coin=>coin.tick());
        this.jump(this.lane);
    }
    draw(projectionMatrix: mat4, programinfo: Program, deltatime: number): void {
        if(this.world.paused){
            return;
        }
        this.counter++;
        if(this.counter>=74){
            this.counter=0;
        }
        if(!this.object)return
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
       this.coins.forEach(coin=>{
           coin.draw(projectionMatrix, programinfo, deltatime);
       });
    };

    private trainOnMyWay(myLane) {
        let retval=false;
        this.world.nearestTrains().forEach(train=>{
            if (train != undefined &&
                myLane == train.lane &&
                (train.position.x-this.position.x < 50 && train.position.x-this.position.x > -40)
            ){
                retval=true;
            }
        });
        return retval;
    }

    jump(myLane) : void {
        if (this.jumping && this.jumping_direction==0){
            this.jumping_direction = 1;
        }else if (this.jumping && this.jumping_direction == 1){
            if (this.position.y > this.jumpmax){
                this.jumping_direction = 0;
                this.jumping=false;
                this.ontrain=true;
                this.position.y=19;
            }
        }else if (this.jumping && this.jumping_direction == -1){
            if (this.position.y < 2){
                this.ontrain=false;
                this.jumping = false;
                this.jumping_direction = 0;
                this.position.y = 0;
            }
        }else if(this.ontrain && !this.trainOnMyWay(myLane)) {
            this.jumping = true;
            this.ontrain=false;
            this.jumping_direction = -1;
        }
        this.position.y += this.jumping_direction * this.speed.y;
    };
};
