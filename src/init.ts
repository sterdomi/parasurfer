import { World } from "./world";


import JAKE_OBJ from "./assets/objs/poor_jack.obj";
import JAKE_IMG from "./assets/images/jake2.png";
import train_block_obj from "./assets/objs/trainblock.obj";
import train_block_img from "./assets/images/trainblock.png";


import TRACK_obj from "./assets/objs/tracks.obj";
import TRACK_img from "./assets/images/tracks.jpg";

import Pole_obj from "./assets/objs/pole.obj";
import Pole_img from "./assets/images/pole.png";

import Wall_obj from "./assets/objs/wall.obj";
import Wall_img from "./assets/images/wall.jpg";

import COIN_OBJ from "./assets/objs/coin.obj";
import COIN_IMAGE from "./assets/images/coin.png";

import BOMB_OBJ from "./assets/objs/bomb.obj";
import BOMB_IMAGE from "./assets/images/bomb.jpg";


import GRND_OBJ from "./assets/objs/ground.obj";
import GRND_IMAGE from "./assets/images/sand.jpg";

import Police_OBJ from "./assets/objs/policev2.obj";
import Police_IMAGE from "./assets/images/trex_2048x2048_1.png";

import TunnelMiddle_OBJ from "./assets/objs/tunnelmiddle.obj";
import TunnelMiddle_IMAGE from "./assets/images/tunnelmiddle.png";

import Croucher_OBJ from "./assets/objs/croucher.obj";
import Croucher_IMAGE from "./assets/images/croucher.png";


import { loadObj, loadImg } from "./utils";

export var GL_BL_ASSETS = {
    objects : {},
    textures : {},
    images : {}
};

window['GL_BL_ASSETS'] = GL_BL_ASSETS;

export var initWorld = (gl : WebGLRenderingContext, program: Program, cb: Function) : void=>{
    loadallObjs(gl, (obj: any)=>{
        new World(gl, program, (wo: World)=>{
            cb(wo);
        });
    });
};

export var loadallObjs = (gl: WebGLRenderingContext, cb:Function)=>{
    /* Load all objects at the beginning itself to avoid undefined callback hell */
    var OBJS_IMAGES : any[] = [
        {
            obj :Croucher_OBJ,
            name:'croucher',
            img :Croucher_IMAGE
        },
        {
            obj :Wall_obj,
            name:'wall',
            img :Wall_img
        },
        {
            obj :Pole_obj,
            name:'pole',
            img :Pole_img
        },
        {
            obj :JAKE_OBJ,
            name:'jake',
            img :JAKE_IMG
        },
        {
            obj :TunnelMiddle_OBJ,
            name:'tunnelmiddle',
            img :TunnelMiddle_IMAGE
        },
        {
            obj :train_block_obj,
            name:'trainblock',
            img :train_block_img
        },
        {
            obj :TRACK_obj,
            name:'track',
            img :TRACK_img
        },
        {
            obj :COIN_OBJ,
            name:'coin',
            img :COIN_IMAGE
        },
        {
            obj :BOMB_OBJ,
            name:'bomb',
            img :BOMB_IMAGE
        },
        {
            obj :Police_OBJ,
            name:'police',
            img :Police_IMAGE
        },
        {
            obj :GRND_OBJ,
            name:'ground',
            img :GRND_IMAGE
        }
    ];

    var counter = 0;

    OBJS_IMAGES.forEach((obj)=>{
        loadObj(obj.obj,(doneObj: any)=>{
            GL_BL_ASSETS.objects[obj.name] = doneObj;
            loadImg(obj.img, gl,(imgdone : HTMLImageElement, texture: WebGLTexture)=>{
                GL_BL_ASSETS.textures[obj.name] = texture;
                GL_BL_ASSETS.images[obj.name] = imgdone;
                counter++;
                if (counter == OBJS_IMAGES.length){
                    cb(obj);
                }
            });
        });
    });
};
