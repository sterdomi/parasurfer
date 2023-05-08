import { Jake } from "./jake";
import { Coin } from "./coin";
import { initBuffers, drawObject3D, initShaderProgram, refreshPrograminfo, flashWallsShaders } from "./utils";
import { GL_BL_ASSETS } from "./init";
import { mat4 } from "gl-matrix";
import { Police } from "./police";
import { Train } from "./train";
import { Tunnel } from "./tunnel";
import { Track } from "./tracks";
import { Pole } from "./pole";
import { Ground } from "./ground";
import { Croucher } from "./croucher";
import { Wall } from "./wall";

interface IDictionary<T> {
    [index:string]: T;
};

window['sclae'] = 1;
export class World{
    gl         : WebGLRenderingContext;
    randomBomb=0.9;
    flashprogram: Program;
    mainprogram: Program;
    program    : Program;
    player     : Jake;
    police     : Police; 
    cameraPos  : Vector3;
    buffers    : Buffer;
    object     : any;
    texture    : HTMLImageElement;
    vsSource   : string;
    fsSource   : string;
    tunnels?   : {
        doubletunnels?: any[],
        middletunnels?: Tunnel[],
        lefttunnels?  : any[],
        righttunnels? : any[],
        cointunnels?  : any[],
        bigtunnels?   : any[],
    };
    tracks        : Track[];
    obstacles     : {
        trains?     : Train[];
        poles?      : Pole[];
        crouchers?  : Croucher[];
    };
    grounds?    : Ground[];
    walls?      : Wall[];
    position    : Vector3;
    rotation    : Vector3;
    constructors: IDictionary<any>;
    paused      : boolean = false;
    lasttrainpos: Vector3;
    speed=1;

    constructor(gl: WebGLRenderingContext, program : Program, cb: Function){
        this.mainprogram = program;
        this.program = program;
        this.gl = gl;
        var shders : string[] = flashWallsShaders();
        this.vsSource = shders[0];
        this.fsSource = shders[1];
        var tempProg : WebGLProgram = initShaderProgram(this.gl, this.vsSource, this.fsSource);
        this.flashprogram = {
            program: tempProg,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(tempProg, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(tempProg, "aTextureCoord"),
                vertexNormal: gl.getAttribLocation(tempProg, 'aVertexNormal'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(tempProg, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(tempProg, 'uModelViewMatrix'),
            },
        };
        this.player = new Jake({x:5,y:0,z:0}, this);
        this.police = new Police(this);
        this.cameraPos = {
            x:-2,
            y: 3,
            z: 0,
        };

        this.position = {
            x: 0,
            y: -6,
            z: 0,
        };
        this.rotation = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.grounds = [];
        this.grounds.push(
            new Ground({x:0,y:-6,z:0}, this),
            new Ground({x:250,y:-6,z:0}, this),
            new Ground({x:500,y:-6,z:0}, this),
            new Ground({x:750,y:-6,z:0}, this),
            new Ground({x:1000,y:-6,z:0}, this),
        );

        this.tunnels = {
            doubletunnels : [],
            middletunnels: [new Tunnel({x:110,y:0,z:0},this,'tunnelmiddle')],
        };
        this.obstacles = {
            trains: [
                new Train({x:500,y:0,z:-20},this),
                new Train({x:1000,y:0,z:20},this),
                new Train({x:1450,y:0,z:20},this),
                new Train({x:2000,y:0,z:0},this),
                new Train({x:500,y:0,z:20},this),
            ],
        };

        this.tracks = [];
        for (var i=0; i< 20; i++){
            this.tracks.push(
                new Track({x:26*i,y:-3,z:-20},this),
                new Track({x:26*i,y:-3,z:  0},this),
                new Track({x:26*i,y:-3,z: 20},this),
            );
        }

        this.walls = [];
        for (var i=0; i< 20; i++){
            this.walls.push(
                new Wall({x:56*i,y:-3,z:-30},this.player),
                new Wall({x:56*i,y:-3,z:+30},this.player),
            );
        }

        for (var i=0; i< 30; i++){
            var choice = Math.random();
            var offset: Vector3 = {
                x : 0,
                y : 0,
                z : 0,
            };
            offset.x = Math.random() * (3000 - 100) + 100;
            if (choice > 1/3){
                offset.z = -20;
            } else if (choice > 2/3){
                offset.z = 20;
            }
        };

        this.obstacles.poles = [];
        for (var i=0; i< 10; i++){
            var choice = Math.random();
            var offset: Vector3 = {
                x : 0,
                y : 0,
                z : 0,
            };
            offset.x = Math.random() * (300 - 100) + 100;
            if (choice > 1/2){
                offset.z = -20;
            } else {
                offset.z = 20;
            }
            var lasta = this.obstacles.poles[this.obstacles.poles.length-1];
            if (!lasta){
                lasta = new Pole(this.player,{x:100,y:0,z:20});
                this.obstacles.poles.push(lasta);
            }
            this.obstacles.poles.push(
                new Pole(
                    this.player,{
                    x: lasta.position.x + offset.x,
                    y: 0,
                    z: offset.z
                })
            );
        };

        for (var i=0; i< 10; i++){
            var choice = Math.random();
            var offset: Vector3 = {
                x : 0,
                y : 0,
                z : 0,
            };
            offset.x = Math.random() * (10 - 0) + 0;
            if (choice < 1/3){
                offset.z = -20;
            } else if (choice < 2/3) {
                offset.z = 20;
            }

        };


        this.obstacles.crouchers = [];
        this.obstacles.crouchers.push(
            new Croucher({x:200,y:0,z:  0}, this.player),
            new Croucher({x:400,y:0,z: 20}, this.player),
            new Croucher({x:800,y:0,z:-20}, this.player),
        );
        
        this.constructors = {};
        this.constructors['jake'] = Jake;
        this.constructors['coin'] = Coin;
        this.constructors['police'] = Police;
        this.constructors['pole'] = Pole;
        this.constructors['train'] = Train;
        this.constructors['track'] = Track;
        this.constructors['ground'] = Ground;
        this.increaseSpeed();
        cb(this);
        this.paused=true;
    };

    refreshShaders() : void {

        var flash_on = Math.random() < 0.5;

        if (flash_on){
            this.program = this.flashprogram;
        } else {
            this.program = this.mainprogram;
        }
        
        this.gl.useProgram(this.program.program);
    };
    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async  increaseSpeed(){
        do {
            await this.delay(5000);
            if(!this.paused) {
                this.speed += 0.05;
                this.randomBomb -= 0.1;
                this.player.speed.y *= this.speed;
                this.player.speed.x *= this.speed;
                this.player.speed.z *= this.speed;
                this.obstacles.trains.forEach(t => {
                    t.speed.x *= this.speed;
                });
                this.police.speed.y *= this.speed;
                this.police.speed.x *= this.speed;
                this.police.speed.z *= this.speed;
            }
        }while(this.speed<=1.25)
    }

    tickall(deltaTime: number):void{
        this.reCreateTrains();
        this.reCreatePolls();
        this.reCreateTracks();
        this.reCreateGrounds();
        this.reCreateWalls();
        this.reCreateCrouchers();

        this.player.tick(deltaTime);
        this.police.tick();
        this.obstacles.trains.forEach(train=>train.tick(deltaTime));
        this.tunnels.middletunnels.forEach(mid=>mid.tick());
        this.tracks.forEach(track=>track.tick());
        this.obstacles.crouchers.forEach(c=>c.tick());
    };


    private reCreateWalls() {
        if (this.walls[0].position.x + 100 < this.player.position.x) {
            this.walls.splice(0, 2);
            var nextposx = this.walls[this.walls.length - 1].position.x + 56;
            this.walls.push(
                new Wall({x: nextposx, y: -3, z: -30}, this.player),
                new Wall({x: nextposx, y: -3, z: +30}, this.player)
            );
        }
    }

    private reCreateGrounds() {
        if (this.grounds[0].position.x + 250 < this.player.position.x) {
            this.grounds.splice(0, 1);
            var nextposx = this.grounds[this.grounds.length - 1].position.x + 250;
            this.grounds.push(
                new Ground({x: nextposx, y: -6, z: 0}, this),
                new Ground({x: nextposx, y: -6, z: 0}, this),
                new Ground({x: nextposx, y: -6, z: 0}, this)
            );
        }
    }

    private reCreateTracks() {
        if (this.tracks[0].position.x + 100 < this.player.position.x) {
            this.tracks.splice(0, 3);
            var nextposx = this.tracks[this.tracks.length - 1].position.x + 26;
            this.tracks.push(
                new Track({x: nextposx, y: -3, z: -20}, this),
                new Track({x: nextposx, y: -3, z: 0}, this),
                new Track({x: nextposx, y: -3, z: 20}, this)
            );
        }
    }

    private reCreatePolls() {
        var numpoles = this.obstacles.poles.length;
        this.obstacles.poles = this.obstacles.poles.filter(pole => {
            return (pole.position.x + 100 > this.player.position.x);
        });
        if (numpoles > this.obstacles.poles.length) {
            var choice_ = Math.random();
            var offset_: Vector3 = {
                x: 0,
                y: 0,
                z: 0,
            };
            offset_.x = Math.random() * (300 - 100) + 100;
            if (choice_ > 1 / 2) {
                offset_.z = -20;
            } else {
                offset_.z = 20;
            }
            var lastpole = this.obstacles.poles[this.obstacles.poles.length - 1];
            this.obstacles.poles.push(
                new Pole(
                    this.player, {
                        x: lastpole.position.x + offset_.x,
                        y: 0,
                        z: offset_.z
                    })
            );
        }
    }

    private reCreateCrouchers() {
        var numpoles = this.obstacles.crouchers.length;
        this.obstacles.crouchers = this.obstacles.crouchers.filter(croucher => {
            return (croucher.position.x + 100 > this.player.position.x);
        });
        if (numpoles > this.obstacles.crouchers.length) {
            var choice_ = Math.random();
            var offset_: Vector3 = {
                x: 0,
                y: 0,
                z: 0,
            };
            offset_.x = Math.random() * (300 - 100) + 100;
            if (choice_ > 1 / 2) {
                offset_.z = -20;
            } else {
                offset_.z = 20;
            }
            var lastpole = this.obstacles.crouchers[this.obstacles.crouchers.length - 1];
            this.obstacles.crouchers.push(
                new Croucher(
                     {
                        x: lastpole.position.x + offset_.x,
                        y: 0,
                        z: offset_.z
                    },this.player)
            );
        }
    }

    private reCreateTrains() {
        var numtrains = this.obstacles.trains.length;
        this.obstacles.trains = this.obstacles.trains.filter(tr => !tr.dead);
        if (numtrains > this.obstacles.trains.length) {
            this.lasttrainpos = this.obstacles.trains[this.obstacles.trains.length - 1].position;
            var choice = Math.random();
            var offset: Vector3 = {
                x: 0,
                y: 0,
                z: 0,
            };
            offset.x = Math.random() * (600 - 300) + 300;
            if (choice > 1 / 3) {
                offset.z = -20;
            } else if (choice > 2 / 3) {
                offset.z = 20;
            } else {
                offset.z = 0;
            }
            this.obstacles.trains.push(
                new Train({
                    x: this.lasttrainpos.x + offset.x,
                    y: 0,
                    z: offset.z,
                }, this));
        }
    }

    nearestTrains() : Train[] {
        this.obstacles.trains.sort(
            (train1, train2)=>{
            if(train1.position.x > train2.position.x){
                return 1;
            }else {
                return -1;
            }
        });

        return [
            this.obstacles.trains[0],
            this.obstacles.trains[1],
        ];
    }

    draw(projectionMatrix : mat4, programinfo:Program, deltatime: number) : void {
        this.grounds.forEach((grnd)=>{
            grnd.draw(projectionMatrix, programinfo, deltatime);
        });
        this.player.draw(projectionMatrix, (this.player.program || programinfo), deltatime);
        
        this.police.draw(projectionMatrix, (this.mainprogram || programinfo), deltatime);
        
        this.tunnels.middletunnels.forEach((mid)=>{
            mid.draw(projectionMatrix, this.mainprogram || programinfo, deltatime);
        });
        this.obstacles.trains.forEach((train)=>{
            train.draw(projectionMatrix, (this.mainprogram || programinfo), deltatime);
        });
        this.walls.forEach(w=>w.draw(projectionMatrix,(this.mainprogram || programinfo), deltatime));

        this.tracks.forEach((track)=>{
            track.draw(projectionMatrix, this.mainprogram, deltatime);
        });

        this.obstacles.poles.forEach((poles)=>{
            poles.draw(projectionMatrix, this.mainprogram, deltatime);
        });
        
        this.obstacles.crouchers.forEach((croucher)=>{
            croucher.draw(projectionMatrix, this.mainprogram, deltatime);
        });

    };
};
