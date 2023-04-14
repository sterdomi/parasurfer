
// import { GL_BL_ASSETS } from "./init";

import {mat3, mat4} from "gl-matrix";

var loadObj = (path: string, cb: Function): void => {
    fetch(path)
        .then(res => res.text())
        .then(objresp => {
            var obj = convert(objresp);
            obj.otherdetails = [{
                'name': path
            }];
            cb(obj);
        });
};

var loadImg = (path: string, gl: WebGLRenderingContext, cb: Function): void => {
    var img: HTMLImageElement = new Image();
    img.onload = () => {
        var objectTexture = gl.createTexture();
        handleTextureLoaded(gl, img, objectTexture, cb);
        // if (cb) cb(img);
    };
    img.src = path;
};

declare global {
    interface String {
        fulltrim(): string;
    }
};

String.prototype.fulltrim = function () {
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
}

/* var fulltrim = (s:string):string =>{
    return s.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
}; */

var parseFloatN = (s: string): number => {
    var v = parseFloat(s);
    if (isNaN(v)) v = 0;
    return v;
};
var parseIntN = (s: string): number => {
    var v = parseInt(s);
    if (isNaN(v)) v = 0;
    return v;
};
var convert = (obj: string) => {
    var json = {
        verts: [],
        normals: [],
        texcoords: [],
        indices: [],
        otherdetails: []
    };
    var v = [], vt = [], vn = [], f = [];
    var lines = obj.split('\n');
    console.log(lines[0]);
    for (var i = 0; i < lines.length; i++) {
        var line: string[] = lines[i].fulltrim().split(' ');
        // var line : string[] = fulltrim(lines[i]).split(' '); /* CHANGED */
        if (line.length > 1) {
            switch (line[0]) {
                case 'v':
                    if (line.length >= 4) {
                        v.push([parseFloatN(line[1]), parseFloatN(line[2]), parseFloatN(line[3])]);
                    }
                    break;
                case 'vt':
                    if (line.length >= 3) {
                        vt.push([parseFloatN(line[1]), parseFloatN(line[2])]);
                    }
                    break;
                case 'vn':
                    if (line.length === 4) {
                        vn.push([parseFloatN(line[1]), parseFloatN(line[2]), parseFloatN(line[3])]);
                    }
                    break;
                case 'f':
                    if (line.length === 4) {
                        var f1 = line[1].split('/');
                        var f2 = line[2].split('/');
                        var f3 = line[3].split('/');
                        var parseFace = (face: string[]) => { /* CHANGED: function(){} to ()=>{} */
                            var index = { v: 0, vt: 0, vn: 0 };
                            if (face.length >= 1) {
                                index.v = parseIntN(face[0]) - 1; /* CHANGED */
                                // index.v = parseIntN(face[0]-1);
                            }
                            if (face.length === 3) {
                                index.vt = parseIntN(face[1]) - 1; /* CHANGED */
                                index.vn = parseIntN(face[2]) - 1; /* CHANGED */
                                if (index.vn == undefined){
                                    console.log("under defined");
                                }
                                // index.vt = parseIntN(face[1]-1);
                                // index.vn = parseIntN(face[2]-1);
                            }
                            return index;
                        };
                        f.push(parseFace(f1));
                        f.push(parseFace(f2));
                        f.push(parseFace(f3));
                    }
                    break;
            }
        }
    }
    for (var i = 0; i < f.length; i++) {
        json.indices.push(i);
        json.verts.push(v[f[i].v][0], v[f[i].v][1], v[f[i].v][2]);
        if (vn[f[i].vn] == undefined){
            console.log("ndefined", vn[f[i].vn]);
        }
        json.normals.push(vn[f[i].vn][0], vn[f[i].vn][1], vn[f[i].vn][2]);
        json.texcoords.push(vt[f[i].vt][0], 1.0 - vt[f[i].vt][1]);
    }
    return json;
};

function initBuffers(gl: WebGLRenderingContext, object: any): Buffer {
    if (object == undefined) {
        return;
    }
    var objectVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesBuffer);
    var vertices = object.verts;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var objectVerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesNormalBuffer);
    var vertexNormals = object.normals;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    // Map the texture onto the object's faces.
    var objectVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesTextureCoordBuffer);
    var textureCoordinates = object.texcoords;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);
    var objectVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectVerticesIndexBuffer);
    var objectVertexIndices = object.indices;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(objectVertexIndices), gl.STATIC_DRAW);
    return {
        position: objectVerticesBuffer,
        normals: objectVerticesNormalBuffer,
        indices: objectVerticesIndexBuffer,
        texture: objectVerticesTextureCoordBuffer,
        vertcnt: objectVertexIndices.length
    } as Buffer;
}
export function initBuffersJake(gl: WebGLRenderingContext, object: any): Buffer {
    if (object == undefined) {
        return;
    }
    var objectVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesBuffer);
    var vertices = object.verts;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var objectVerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesNormalBuffer);
    var vertexNormals = object.normals;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    // Map the texture onto the object's faces.
    var objectVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objectVerticesTextureCoordBuffer);
    var textureCoordinates = object.texcoords;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);
    var objectVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectVerticesIndexBuffer);
    var objectVertexIndices = object.indices;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(objectVertexIndices), gl.STATIC_DRAW);
    return {
        position: objectVerticesBuffer,
        normals: objectVerticesNormalBuffer,
        indices: objectVerticesIndexBuffer,
        texture: objectVerticesTextureCoordBuffer,
        vertcnt: objectVertexIndices.length
    } as Buffer;
}


var handleTextureLoaded = (
    gl: WebGLRenderingContext,
    image: HTMLImageElement,
    texture: WebGLTexture,
    callback: Function): void => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    callback(image, texture);
}

var make3x3 = (matrix: any): any => {
    var m3 = mat3.create();
    m3[0] = matrix[0];
    m3[1] = matrix[1];
    m3[2] = matrix[2];
    m3[3] = matrix[4];
    m3[4] = matrix[5];
    m3[5] = matrix[6];
    m3[6] = matrix[8];
    m3[7] = matrix[9];
    m3[8] = matrix[10];
    return m3;
};

var setMatrixUniforms = (
    gl: WebGLRenderingContext, shaderProgram: WebGLProgram, mvMatrix: any,
    perspectiveMatrix: any): void => {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, perspectiveMatrix);
    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, mvMatrix);
    var normalMatrix = make3x3(mvMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    var nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    gl.uniformMatrix3fv(nUniform, false, normalMatrix);
};


var mvPushMatrix = (mvMatrixStack: any[], mvMatrix: any) => {
    mvMatrixStack.push(mat4.clone(mvMatrix));
}

var mvPopMatrix = (mvMatrixStack: any[]) => {
    if (!mvMatrixStack.length) {
        throw ("Can't pop from an empty matrix stack.");
    }
    var mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}


var drawObject3D = (gl: WebGLRenderingContext, programInfo: Program, viewProjectionMatrix: any, object: any) => {
    var modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix,   /* destination matrix */
        modelViewMatrix,     /* matrix to translate */
        [-0.0, 0.0, 0]); /* amount to translate */

    mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [
            object.position.x,
            object.position.y,
            object.position.z
        ]);

    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        object.rotation.x * Math.PI / 180,
        [1, 0, 0]);
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        object.rotation.y * Math.PI / 180,
        [0, 1, 0]);
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        object.rotation.z * Math.PI / 180,
        [0, 0, 1]);

    {

        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.texture);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord);
        gl.activeTexture(gl.TEXTURE0); /* IMP */
        gl.bindTexture(gl.TEXTURE_2D, object.texture);
        gl.uniform1i(gl.getUniformLocation(programInfo.program, "uSampler"), 0);

    }


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.buffers.indices);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.normals);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal);

    }

    setMatrixUniforms(gl, programInfo.program, modelViewMatrix, viewProjectionMatrix);

    {
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, object.buffers.vertcnt, type, offset);
    }

};

var refreshPrograminfo = (gl: WebGLRenderingContext, shaderProgram : WebGLProgram, programInfo: Program) : void =>{
    programInfo.program = shaderProgram;
    programInfo.attribLocations = {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
			vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
		};
    programInfo.uniformLocations = {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		};
};


function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	return shaderProgram;
}

var flashWallsShaders = (vsSource_?:string, fsSource_?:string) : string[] => {

    var vsSource : string = vsSource_ || `
    uniform highp mat4 uMVMatrix;
    uniform highp mat4 uPMatrix;
    
    uniform highp mat3 uNormalMatrix;
    attribute highp vec3 aVertexPosition;
    attribute highp vec2 aTextureCoord;
    attribute highp vec3 aVertexNormal;
    varying highp vec2 TextCoordInterp;
    varying highp vec3 PositionInterp;
    
    varying highp vec3 NormalInterp;
    
    void main()
    {
        PositionInterp = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
        TextCoordInterp = aTextureCoord;
        
        NormalInterp = normalize(uNormalMatrix * aVertexNormal);
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
    `;
    var fsSource : string = fsSource_ || `
    uniform highp sampler2D uSampler;

    uniform highp vec3 LightPosition;

    uniform highp vec3 LightColor;
    varying highp vec2 TextCoordInterp;
    varying highp vec3 NormalInterp;
    varying highp vec3 PositionInterp;

    void main()
    {
        highp vec3 normal = normalize(NormalInterp);
        
        highp vec3 lightVec = normalize(LightPosition - PositionInterp);
        highp vec3 viewVec = normalize(-PositionInterp);

        highp vec3 reflectVec = reflect(-lightVec, normal);
        highp float spec = max(dot(reflectVec, viewVec), 0.0);
        spec = pow(spec, 16.0);

        highp vec4 textureColor = texture2D(uSampler, vec2(TextCoordInterp.s, TextCoordInterp.t));
        
        highp vec3 specContrib = LightColor * spec;

        highp vec3 ambientContrib = vec3(0.0, 0.0, 0.0);
        highp vec3 diffContrib = LightColor * max(dot(lightVec, normal), 0.0);
        
        highp vec3 lightContribution = ambientContrib + diffContrib + (specContrib * (1.0 - textureColor.a));

        highp vec3 white = textureColor.rgb + vec3(255, 255, 255);
        textureColor.rgb = white;

        gl_FragColor = vec4(textureColor.rgb * lightContribution, 1.0);
    }
    `;

    return [vsSource,fsSource];
};



export {
    loadImg,
    loadObj,
    initBuffers,
    handleTextureLoaded,
    setMatrixUniforms,
    mvPopMatrix,
    mvPushMatrix,
    drawObject3D,
    loadShader,
    refreshPrograminfo,
    initShaderProgram,
    flashWallsShaders
};
