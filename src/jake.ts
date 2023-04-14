import { GL_BL_ASSETS } from "./init";
import { drawObject3D,initBuffersJake } from "./utils";
import { World } from "./world";
import { mat4 } from "gl-matrix";
import { Coin } from "./coin";


declare global{
    interface Vector3 {
        x: number;
        y: number;
        z: number;
    }
    interface Bbox {
        width  : number;
        height : number;
        length : number;
        innerheight? : number;
        innerwidth? : number;
        innerlength? : number;
    }
};
export class Jake{
    bbox            : Bbox;
    position        : Vector3;
    rotation        : Vector3;
    score           : number;
    jumpstarttime   : Date;
    dead            : boolean = false;
    jumping         : boolean = false;
    crouching       : boolean = false;
    headon          : boolean = false;
    isconfused      : boolean = false;
    ontrain         : boolean = false;
    onground        : boolean = true;
    switchinglane    : boolean = false;
    didstunt         : boolean = false;
    movingleft       : boolean = false;
    movingright      : boolean = false;
    speed           : Vector3;
    texture         : HTMLImageElement;
    object          : any;
    world           : World;
    gl              : WebGLRenderingContext;
    buffers         : Buffer;
    lane            : number = 0;
    nextlane        : number = 0;
    program         : Program;
    jumpmax         : number;
    jumping_direction: number;
    switchstartpos   : number = 0;
    coincount        : number = 0;
    boom=false;
    bomb=new Audio('music/bomb.ogg');
    coin=[new Audio('music/coin.mp3'),new Audio('music/coin.mp3'),new Audio('music/coin.mp3')];

    constructor(position: Vector3, world : World, program?: Program){
        this.jumping = false;
        if (program){
            this.program = program;
        }
        this.coin.forEach(c=>c.volume=0.5)
        this.world = world;
        this.position = position;
        this.score = 0;
        this.jumpmax = 2;
        this.dead = false;
        this.jumping = false;
        this.jumping_direction = 0;
        this.onground = true;
        this.headon = false;
        this.gl = world.gl;
        this.bbox = {
            width  : 4.113 / window['sclae'],
            height : 19.38 / window['sclae'],
            length : 3.96 / window['sclae'], 
        };
        this.jumpstarttime = null;
        this.speed = {
            x: 1.4,
            y: 2,
            z: 1,
        };
        this.rotation = {
            x: 0,
            y: 0,
            z: 0
        };
        this.object = GL_BL_ASSETS.objects['jake'];
        this.texture = GL_BL_ASSETS.textures['jake'];
        this.buffers = initBuffersJake(this.gl,this.object);
    }

    tick(data?:any) : void {

        if (this.dead) {
            this.world.police.coins=[];
            this.rotation.x = -90;
            this.rotation.y = -130;
            this.rotation.z = 20;
            return;
        };
        this.score += 10;
        this.checkCollisions();
        this.position.x += this.speed.x;
        this.rotation.y=0;
        this.world.cameraPos.x = (this.position.x - 0.2) - 70;
        this.world.cameraPos.y =  70;
        this.world.cameraPos.z =  0;

        this.jump();
        this.switchlane();

    }

    switchlane(){
        if (this.switchinglane && this.nextlane == 1){
            this.position.z += this.speed.z;
            if (this.position.z - this.switchstartpos > 22){
                this.lane++;
                this.nextlane = 0;
            }
        }
        if (this.switchinglane && this.nextlane == -1){
            this.position.z -= this.speed.z;
            if (this.switchstartpos - this.position.z > 22){
                this.lane--;
                this.nextlane = 0;
            }
        }
        if (this.switchinglane && this.nextlane == 0){
            this.movingleft = false;
            this.movingright = false;
            this.switchinglane = false;
        }
    };

    checkCollisions() {
        this.world.nearestTrains().forEach(train=>{
            if (train != undefined){
                if (this.headoncollidingTrain()){
                    this.dead = true;
                }else{
                    this.checkcoins(train.coins);
                }
            }
        });

        this.checkcoins(this.world.police.coins);

    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async explosion(){
        this.boom=true;
        await this.delay(1000);
        this.boom=false
    }


    async crouch(){
        this.crouching=true;
        this.rotation.x=0;
        this.rotation.y=0;
        this.rotation.z=90;
        await this.delay(750);
        this.rotation.x=0;
        this.rotation.y=0;
        this.rotation.z=0;
        this.crouching=false;
    }

    jump() : void {
        if (this.jumping && this.jumping_direction==0){
            this.jumping_direction = 1;
        }
        if(this.trainOnMyWay() && this.jumping){
            this.jumping_direction = 0;
            this.jumping=false;
            this.ontrain=true;
            this.position.y = this.bbox.height / 2 + 18;
        }
        if(!this.jumping && !this.trainOnMyWay() && this.ontrain){
            this.jumping=true;
            this.jumping_direction = -1;
            this.ontrain=false;
        }

        if (this.jumping && this.jumping_direction == 1){
            if (this.position.y > this.jumpmax * 20){
                this.jumping_direction = -1;
            }
        }
        if (this.jumping && this.jumping_direction == -1){
           if (this.position.y < this.bbox.height / 2){
                this.jumping = false;
                this.jumping_direction = 0;
                this.position.y = this.bbox.height / 2;
            }
        }
        this.position.y += this.jumping_direction * this.speed.y;
    };


    checkcoins(coinslist : Coin[]):void {
        coinslist.forEach(c=>{
            if (this.collidingOther(c) && !c.dead){
                if(c.isBomb){
                    this.world.player.dead=true;
                    this.explosion();
                    let resp=this.bomb.play();
                    if (resp!== undefined) {
                        resp.then(_ => {
                            // autoplay starts!
                        }).catch(error => {
                            //show error
                        });
                    }
                }else{
                    let resp=this.coin[this.coincount++%3].play();
                    if (resp!== undefined) {
                        resp.then(_ => {
                            // autoplay starts!
                        }).catch(error => {
                            //show error
                        });
                    }
                }
                c.dead = true;
                this.coincount++;
                this.score += 1000;
            }
        });
    };

    collidingOther(other: Coin) : boolean{
       return(
            2 * Math.abs(other.position.x - this.position.x) < (this.bbox.length + other.bbox.length) &&
            2 * Math.abs(other.position.y - this.position.y) < (this.bbox.height + other.bbox.height) &&
            2 * Math.abs(other.position.z - this.position.z) < (this.bbox.width  + other.bbox.width )
        );
    };


    headoncollidingTrain() : boolean {
       return this.trainOnMyWay() && (!this.ontrain)
    };

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        if(this.world.paused && this.rotation.y<180){
            this.rotation.y += 1
        }
        drawObject3D(this.gl, programinfo, projectionMatrix, this);
    };

    private trainOnMyWay() {
        let retval=false;
        this.world.nearestTrains().forEach(train=>{
            if (train != undefined &&
                this.lane == train.lane &&
                (train.position.x-this.position.x < 40 && train.position.x-this.position.x > -40)
            ){
                retval=true;
            }
        });
        return retval;
    }
};
