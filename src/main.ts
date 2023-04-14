import { World } from "./world";
import { initWorld/* , GL_BL_ASSETS */ } from "./init";
import 'hammerjs';
import { /* initBuffers, */ mvPushMatrix, mvPopMatrix, /* loadShader, */ refreshPrograminfo, initShaderProgram } from "./utils";
import {mat4, vec3} from "gl-matrix";
var mainworld: World;
import { collection, addDoc,query, orderBy, limit,getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore,connectFirestoreEmulator } from "firebase/firestore";
import {mySecretConfig} from "./secret/firebaseSecret";


declare global {
	interface Program {
		program: WebGLProgram,
		attribLocations: {
			vertexPosition: number,
			vertexNormal: number,
			textureCoord: number
		},
		uniformLocations: {
			projectionMatrix: WebGLUniformLocation,
			modelViewMatrix: WebGLUniformLocation,
		},
	}
}

var LightPos: Vector3 = {
	x: 0,
	y: 2,
	z: 0
};

enum CurrentlyUsingis {
	Colored,
	Grayscale
};

window['LightPos'] = LightPos;


var flicker: number = 0;
var starttime: Date = new Date();
var currtime: Date = new Date();

var Zoom = 1;
window['Zoom'] = Zoom;

document.onwheel = (ev) => {
	if (ev.deltaY > 0) {
		/* Zoom out */
		Zoom++;
		mainworld.player.rotation.y += 10;
	} else {
		/* Zoom in */
		Zoom--;
		mainworld.player.rotation.y -= 10;
	}
	if (Zoom < 0) Zoom = 1;
	window['Zoom'] = Zoom;
}

declare global {
	interface Buffer {
		position: WebGLBuffer,
		normals: WebGLBuffer;
		indices: WebGLBuffer,
		texture: WebGLBuffer,
		vertcnt: number,
	}
	interface Element {
		hidden: boolean;
	}
};

const canvas: HTMLCanvasElement = document.querySelector('#game');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

const textCanvas: HTMLCanvasElement = document.querySelector('#text');
var ctx = textCanvas.getContext("2d");
ctx.font = "30px Arial";
var boom : HTMLImageElement = document.querySelector('#boom');

window['scorecanv'] = { textCanvas, ctx };


		const vsSource = `
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

const fsSource = `
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
	
	`;

	var coloredFs = `
	// gl_FragColor = vec4(textureColor.rgb * lightContribution, 1.0);
	gl_FragColor = vec4(textureColor.rgb, 1.0);
}
`;

var greyscFs = `
	highp float gray = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
	gl_FragColor = vec4(vec3(gray), 1.0);
}
`;

var currently_using: CurrentlyUsingis;
currently_using = CurrentlyUsingis.Colored;
var programInfo: Program;
var shaderProgram: WebGLProgram;
var audio,jump,crouch,gameover;
var app;
var scores=[];
var textIndex=0;
var text=[
	'Ich wurde beim Sprayen von einem Zug erfasst',
	'Seit diesem Tag bin ich Paraplegiker',
	'Mein Weg zurück war nicht leicht, aber ich hab es geschafft',
	'Bei einer Paraplegie sind auch weitere Organe betroffen',
	'Die Blase verursacht z.B. grosse Probleme',
	'Das vegetative Nervensystem ist gestört.',
	'Ich komme mit Hitze und Kälte nicht mehr so gut klar',
	'In meinen Sprayerladen komm ich wegen einer Stufe nicht mehr rein',
	'Aber der nette Verkäufer kommt zu mir raus',
	'Jetzt spiel mit mir, wir springen zusammen auf Züge, wie früher',
	'Drücke die Leertaste oder tippe auf den Bildschirm :-)',
	'Mit den vier Pfeilen auf der Tastatur kannst du mich steuern',
	'Auf einem Touch-Screen kannst du mich mit Wischgesten steuern'
]

async function createScore(score, playerID) {
	const db = getFirestore(app);
	const docRef = await addDoc(collection(db, "scores"), {
		name: playerID,
		score: score
	});
	console.log("Document written with ID: ", docRef.id);
}

//TODO refact!
async function readScore(myScore) {
	if(scores.length>0){
		return;
	}
	const db = getFirestore(app);
	const ref = collection(db, "scores");
	const q = query(ref, orderBy("score", "desc"), limit(9));
	const querySnapshot = await getDocs(q);
	let ranking=1;
	let high=false;
	let lScores=[];
	var name="";
	querySnapshot.forEach((doc) => {
		if(myScore>doc.data().score && high==false){
			high=true;
			name = prompt("Du bist in den Highscores, Wie heißt du? (max 6 Zeichen)");
			createScore(mainworld.player.score,name?name.padEnd(6, " "):'Anon');//
		}else {
			lScores.push({ranking: ranking++, name: doc.data().name.padEnd(6, " "), score: doc.data().score});
		}
	});
	ranking=1;
	let high2=false;
	if(scores.length==0) {
		lScores.forEach(s => {
			if (s.score < myScore && !high2) {
				high2 = true;
				scores.push({ranking: ranking++, name: name.padEnd(6, " "), score: myScore});
				scores.push({ranking: ranking++, name: s.name, score: s.score});
			} else {
				scores.push({ranking: ranking++, name: s.name, score: s.score});
			}
		})
	}
}

function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function rotateText() {
	console.log('rotateText')
	do {
		for (let i = 0; i < text.length; i++) {
			textIndex = i;
			await delay(5000);
		}
	}while(mainworld.paused)
}

var main = () => {
	rotateText();
	const loading: Element = document.querySelector('#loading');
	var myElement = document.getElementById('container');
	var mc = new Hammer(myElement);
	mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
	// listen to events from touch device
	mc.on("panleft panright panup pandown tap press", function(ev) {
		if(ev.type==='panleft'){
			left();
		}
		if(ev.type==='panup'){
			up();
		}
		if(ev.type==='panright'){
			right();
		}
		if(ev.type==='pandown'){
			down();
		}
		if(ev.type==='tap'){
			space();
		}
	});

	const firebaseConfig = mySecretConfig;

	// Initialize Firebase to handle scores
	app = initializeApp(firebaseConfig);
	audio = new Audio('music/Eclipse0.mp3');
	audio.volume=0.5
	jump = new Audio('music/jump.mp3');
	crouch = new Audio('music/crouch.mp3');
	gameover = new Audio('music/gameover.mp3');
	canvas.hidden = true;
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}

	shaderProgram = initShaderProgram(gl, vsSource, fsSource + coloredFs);

	programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
			vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		},
	};


	initWorld(gl, programInfo, (world: World) => {
		mainworld = world;
		window['world'] = mainworld;
		const buffers = mainworld.player.buffers;
		var then = 0;
		canvas.hidden = false;
		loading.hidden = true;
		if (resizeToMatchDisplaySize(gl.canvas)) {
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
		// Draw the scene repeatedly
		function render(now: number) {
			now *= 0.001;  /* convert to seconds */
			const deltaTime = now - then;
			then = now;
			drawScene(gl, programInfo, buffers, deltaTime);
			requestAnimationFrame(render);
		};
		requestAnimationFrame(render);
	});
};

function resizeToMatchDisplaySize(canvas) {
	var displayWidth  = canvas.clientWidth  * window.devicePixelRatio;
	var displayHeight = canvas.clientHeight * window.devicePixelRatio;
	if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
		return true;
	}
	return false;
}
var rotation: Vector3;
var pooper: any[] = [];
var modelViewMatrix: mat4;
var cameraPosition: number[];

cameraPosition = [-2, 2, 0];
window['cameraPosition'] = cameraPosition;
var direction = [1, 2, 3];

var LightCOLO: Vector3 = {
	x: 1,
	y: 1,
	z: 1
};

window['LightCOLO'] = LightCOLO;

var update_zoom_eye = () => {
	if (canvas.onmousedown)
		cameraPosition[0] = mainworld.player.position.x + direction[0] * Zoom;
	cameraPosition[1] = mainworld.player.position.x + direction[0] * Zoom;
	cameraPosition[2] = mainworld.player.position.x + direction[0] * Zoom;
};

function drawScoreDuringGame(){
	if (!mainworld.player.dead) {
		ctx.fillText(`Score`, 10, 30);
		ctx.fillText(`${mainworld.player.score}`, 200, 30);
	}
}
function drawExplosion(){
	if(mainworld.player.boom){
		ctx.drawImage(boom, 1, 1);
	}
}
function drawSpeechBubble(){
	// Eine Sprechblase mit weißer Füllung und schwarzer Umrandung um den Text zeichnen
	ctx.fillStyle = "white";
	ctx.strokeStyle = "black";
	ctx.lineWidth = 3;

	// Die Sprechblase ist ein abgerundetes Rechteck mit einem Schwanz
	// Die Koordinaten und Größen der Sprechblase berechnen
	var textWidth = ctx.measureText(text[textIndex]).width; // Die Breite des Textes messen
	var textHeight = 20; // Die Höhe des Textes schätzen
	var padding = 10; // Ein Abstand zwischen dem Text und der Sprechblase
	var x = 90; // Die linke obere x-Koordinate der Sprechblase
	var y = 20; // Die linke obere y-Koordinate der Sprechblase
	var w = textWidth + 2 * padding; // Die Breite der Sprechblase
	var h = textHeight + 2 * padding; // Die Höhe der Sprechblase
	var r = 10; // Der Radius der abgerundeten Ecken
	var s = 30; // Die Länge des Schwanzes

	// Ein Pfad für die Sprechblase beginnen
	ctx.beginPath();

	// Die linke obere Ecke zeichnen
	ctx.moveTo(x + r, y);

	// Die obere Kante zeichnen
	ctx.lineTo(x + w - r, y);

	// Die obere rechte Ecke zeichnen
	ctx.arcTo(x + w, y, x + w, y + r, r);

	// Die rechte Kante zeichnen
	ctx.lineTo(x + w, y + h - r);

	// Die untere rechte Ecke zeichnen
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);

	// Die untere Kante und den Schwanz zeichnen
	ctx.lineTo(x + w / 2 + s / 2, y + h); // Der rechte Punkt des Schwanzes
	ctx.lineTo(x + w / 2, y + h + s); // Die Spitze des Schwanzes
	ctx.lineTo(x + w / 2 - s / 2, y + h); // Der linke Punkt des Schwanzes

	// Die linke Kante zeichnen
	ctx.lineTo(x + r, y + h);

	// Die linke untere Ecke zeichnen
	ctx.arcTo(x, y + h, x, y + h - r, r);

	// Die linke Kante zeichnen
	ctx.lineTo(x, y + r);

	// Die linke obere Ecke zeichnen
	ctx.arcTo(x, y, x + r, y, r);

	// Den Pfad schließen und ausfüllen und umranden
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	// Die Schriftart und -größe für den Text festlegen
	ctx.font = "20px Arial";

	// Den Text "Hallo Welt" mit schwarzer Füllung an der Position (100, 50) zeichnen
	ctx.fillStyle = "black";
	ctx.fillText(text[textIndex], 100, 50);
}

function drawPlayerDead(){
	if (mainworld.player.dead) {
		if(!audio.paused){
			audio.pause();
			readScore(mainworld.player.score);
			let resp=gameover.play();
			if (resp !== undefined) {
				resp.then(_ => {
					// autoplay starts!
				}).catch(error => {
					//show error
				});
			}
		}
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(300, 75, 400, 550);
		ctx.fillStyle = "black";
		ctx.fillText(`GAME OVER`, 400, 100);
		ctx.fillText('Your Score: '+mainworld.player.score, 350, 145);

		let y=145;
		scores.forEach(s=>{
			y+= 45;
			ctx.fillText(s.ranking + ' ' +s.score + ' : ' + s.name, 350, y);
		})
		ctx.fillStyle = "red";
		ctx.fillText('Leertaste oder touch um zu spielen', 350, y+45);
	}
}

function clearDrawings(){
	gl.clearColor(0.0, 1.0, 1.0, 1.0);  	// Clear to black, fully opaque
	gl.clearDepth(1.0);           						// Clear everything
	gl.enable(gl.DEPTH_TEST);           						// Enable depth testing
	gl.depthFunc(gl.LEQUAL);            						// Near things obscure far things
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	//evt. muss das unter drawGamePause
	currtime = new Date();
	if (currtime.getTime() - starttime.getTime() > 3000) {
		clearInterval(flicker);
	}
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawGamePause(){
	if (!mainworld.player.dead && mainworld.paused) {
		ctx.fillText(`Leertaste oder Touch um zu Spielen`, 500 - 200, 350 + 45);
		//ctx.fillText(text[textIndex], 50, 450);
		drawSpeechBubble();
	}
}

function lightAndCamera(deltaTime:number){
	rotation = mainworld.player.rotation;
	gl.useProgram(programInfo.program);
	var LightPosition = gl.getUniformLocation(programInfo.program, "LightPosition");
	gl.uniform3f(LightPosition, LightPos.x, LightPos.y, LightPos.z);
	var LightColor = gl.getUniformLocation(programInfo.program, "LightColor");
	gl.uniform3f(LightColor, LightCOLO.x, LightCOLO.y, LightCOLO.z);
	const fieldOfView = 45 * Math.PI / 180;   // in radians
	const aspect = gl.canvas.width / gl.canvas.height;
	const zNear = 0.1;
	const zFar = 1000.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar);

	var cameraMatrix = mat4.create();
	mat4.translate(
		cameraMatrix,
		cameraMatrix,
		[
			mainworld.cameraPos.x,
			mainworld.cameraPos.y,
			mainworld.cameraPos.z
		]);
	var up = vec3.fromValues(0, 1, 0)
	mat4.lookAt(
		cameraMatrix,
		[
			mainworld.cameraPos.x,
			mainworld.cameraPos.y,
			mainworld.cameraPos.z,
		],
		[
			mainworld.cameraPos.x + 90,
			0,
			/* mainworld.cameraPos.z */ + 0,
		] /* player_coords */, up);
	var viewMatrix = cameraMatrix;
	var viewProjectionMatrix = mat4.create();
	mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
	modelViewMatrix = mat4.create();
	window['mat4'] = mat4;
	mat4.translate(
		modelViewMatrix,     /* destination matrix */
		modelViewMatrix,     /* matrix to translate */
		[-0.0, 0.0, 0],      /* amount to translate */
	);
	mvPushMatrix(pooper, modelViewMatrix);
	mainworld.draw(viewProjectionMatrix, programInfo, deltaTime);
	mvPopMatrix(pooper);
}

function drawScene(gl: WebGLRenderingContext, programInfo: Program, buffers: Buffer, deltaTime: number) {
	clearDrawings();
	drawScoreDuringGame();
	drawExplosion();
	drawPlayerDead();
	drawGamePause();
	lightAndCamera(deltaTime);
	// Update the rotation for the next draw
	!mainworld.paused && mainworld.tickall();
}

function left(){
	console.log('left');
	if (mainworld.player.switchinglane) {
		console.log('already switching left');
		return;
	}
	if (mainworld.player.lane != -1) {
		mainworld.player.switchinglane = true;
		mainworld.player.movingleft = true;
		mainworld.player.switchstartpos = mainworld.player.position.z;
		mainworld.player.nextlane = -1;
		console.log('left');
	}
	if (mainworld.player.lane == -1){
		mainworld.player.isconfused = true;
	}
}
function right(){
	console.log('right');
	if (mainworld.player.switchinglane) {
		console.log('already switching right');
		return;
	}
	if (mainworld.player.lane != 1) {
		mainworld.player.switchinglane = true;
		mainworld.player.movingright = true;
		mainworld.player.switchstartpos = mainworld.player.position.z;
		mainworld.player.nextlane = 1;
		console.log('right');
	}
	if (mainworld.player.lane == 1){
		mainworld.player.isconfused = true;
	}
}

function up(){
	console.log('up');
	if (mainworld.player.jumping) {
		console.log("already jumping");
		return;
	}
	else {
		mainworld.player.didstunt = Math.random() > 0.3;
		mainworld.player.jumping = true;
		jump.play();
	}
}
function reset(){
	location.reload();
}
function down(){
	console.log('down');
	if (mainworld.player.crouching) {
		console.log("already crouching");
		return;
	}
	else {
		mainworld.player.crouch();
		crouch.play();
	}
}
function space(){
	console.log('tab');
	if(mainworld.player.dead){
		reset();
	}else {
		mainworld.paused = !mainworld.paused;
		if (mainworld.paused) {
			audio.pause();
		} else {
			audio.play();
		}
	}
}
document.onkeyup = (ev: KeyboardEvent): void => {
	console.log('the key is: ' + ev.key)
	if(!audio.playing) {
		audio.play();
	}
	if (ev.key == "a" || ev.key == "ArrowLeft") {
		left();
	} else if (ev.key == "d" || ev.key == "ArrowRight") {
		right();
	}else if (ev.key == "ArrowUp") {
		up();
	}else if (ev.key == "s" || ev.key == "ArrowDown") {
		down();
	}else if (ev.key == "r") {
		reset();
	}else if (ev.key == "p" || ev.key == " ") {
		space();
	}
}

main();
