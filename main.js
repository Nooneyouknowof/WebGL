import {mat4} from './node_modules/gl-matrix/esm/index.js'

const vertexCode = document.getElementById("vertex").textContent;
const fragmentCode = document.getElementById("fragment").textContent;
console.log(vertexCode);
console.log(fragmentCode);

const canvas = document.getElementById("screen");
const gl = canvas.getContext("webgl2");
let Keyboard = {};
let Settings = localStorage.getItem("settings")?JSON.parse(localStorage.getItem("settings")):{
    locked: false,
    sensitivity: 1,
};
let camera = localStorage.getItem("camera")?JSON.parse(localStorage.getItem("camera")):{
    posX: 0,
    posY: 0,
    posZ: 1,
    yaw: 0,
    pitch: 0,
    roll: 0,
    FOV: 45,
    ratio: 1
}
let deltaTime = 0;
let width = 0;
let height = 0;

if (gl === null) {
    alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
} else {
    document.addEventListener("keyup", async event => {
        if (!event.repeat) {Keyboard[event.key.toUpperCase().replace(" ", "SPACE")] = false}
    });
    document.addEventListener("keydown", async event => {
        if (!event.repeat) {Keyboard[event.key.toUpperCase().replace(" ", "SPACE")] = true}
    });
    canvas.addEventListener("click", async () => {
        canvas.requestPointerLock({unadjustedMovement: true});
    });
    document.addEventListener("mousemove", async event => {
        if (Settings.locked) {
            camera.yaw -= (event.movementX/camera.ratio)*(Settings.sensitivity/4);
            camera.pitch -= (event.movementY/camera.ratio)*(Settings.sensitivity/4);
        }
    });
    document.addEventListener("pointerlockchange", async () => {Settings.locked = document.pointerLockElement?true:false});

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexCode.trim());
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(vertexShader);
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentCode.trim());
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(fragmentShader);
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(program);
    }
    gl.useProgram(program);

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    async function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        camera.ratio = width/height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", async event => {if (!event.repeat) {resizeCanvas()}});
    resizeCanvas();

    async function drawTriangle(vertices,isInverted) {
        let vertexData = new Float32Array(vertices?.flat());
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        const vertexPosition = gl.getAttribLocation(program, "aPosition");

        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, isInverted?0:1, vertices.length);
    }

    async function drawQuad(a,b,c,d) {
        // drawTriangle([b,d,c],true);
        // drawTriangle([d,b,a],true);
        drawTriangle([b,d,c,d,b,a],true);
    }

    async function drawCube(x,y,z) {
        drawQuad([x-0.5,y-0.5,z+0.5],[x+0.5,y-0.5,z+0.5],[x+0.5,y+0.5,z+0.5],[x-0.5,y+0.5,z+0.5]);// Back
        drawQuad([x-0.5,y-0.5,z-0.5],[x+0.5,y-0.5,z-0.5],[x+0.5,y-0.5,z+0.5],[x-0.5,y-0.5,z+0.5]);// Bottom
        drawQuad([x-0.5,y+0.5,z+0.5],[x+0.5,y+0.5,z+0.5],[x+0.5,y+0.5,z-0.5],[x-0.5,y+0.5,z-0.5]);// Top
        drawQuad([x-0.5,y+0.5,z+0.5],[x-0.5,y+0.5,z-0.5],[x-0.5,y-0.5,z-0.5],[x-0.5,y-0.5,z+0.5]);// Left
        drawQuad([x+0.5,y+0.5,z-0.5],[x+0.5,y+0.5,z+0.5],[x+0.5,y-0.5,z+0.5],[x+0.5,y-0.5,z-0.5]);// Right
        drawQuad([x-0.5,y+0.5,z-0.5],[x+0.5,y+0.5,z-0.5],[x+0.5,y-0.5,z-0.5],[x-0.5,y-0.5,z-0.5]);// Front
    }

    let p_time = new Date().getTime();
    let fps_n = 0;
    async function fps() {
        let c_time = new Date().getTime();
        let time = c_time-p_time;
        p_time = c_time;
        fps_n = Math.pow(time/1000, -1);
        return time;
    }

    setInterval(async () => {
        document.getElementById("fps").innerHTML = `${Math.round(fps_n)}, ${deltaTime}ms<br>Coords: ${Math.round(camera.posX)}, ${Math.round(camera.posY)}, ${Math.round(camera.posZ)}`;
        localStorage.setItem("camera", JSON.stringify(camera));
        localStorage.setItem("settings", JSON.stringify(Settings));
    },50);

    let walkspeed = 10;
    let sprintspeed = 100;
    let jump = 1.15;
    let gravity = 0.5;
    let isGrounded = false;
    let px = camera.posX;
    let py = camera.posY;
    let pz = camera.posZ;
    function vecZnormal(speed, deg) {return speed*Math.sin(degToRad(deg))};
    function vecXnormal(speed, deg) {return speed*Math.cos(degToRad(deg))};
    async function controls(deltaTime) {
        let speed = Keyboard.CONTROL?sprintspeed:walkspeed;
        if (Keyboard.W) {
            pz += vecZnormal(speed, camera.yaw+90)*deltaTime;
            px += vecXnormal(speed, camera.yaw-90)*deltaTime;
        }
        if (Keyboard.A) {
            px += vecZnormal(speed, camera.yaw+90)*deltaTime;
            pz += vecXnormal(speed, camera.yaw+90)*deltaTime;
        }
        if (Keyboard.S) {
            pz -= vecZnormal(speed, camera.yaw+90)*deltaTime;
            px -= vecXnormal(speed, camera.yaw-90)*deltaTime;
        }
        if (Keyboard.D) {
            px -= vecZnormal(speed, camera.yaw+90)*deltaTime;
            pz -= vecXnormal(speed, camera.yaw+90)*deltaTime;
        }
        if (Keyboard.SPACE && isGrounded) {
            isGrounded = false;
            py -= jump;
        }
        if (Keyboard.SHIFT) {
            camera.posY -= speed*deltaTime
        }
        if (!isGrounded) {
            let y = camera.posY;
            camera.posY = y-(((py-y)*0.998)*(deltaTime*5));
            py = py-(((py-y-gravity)*1)*(deltaTime*5));
        }
        
        let x = camera.posX;
        camera.posX = x-(((px-x)*0.15)*(deltaTime*5));
        px = px-(((px-x)*1)*(deltaTime*5));
        let z = camera.posZ;
        camera.posZ = z-(((pz-z)*0.15)*(deltaTime*5));
        pz = pz-(((pz-z)*1)*(deltaTime*5));

        if (camera.posY <= 0) {
            camera.posY = 0;
            py = 0;
            isGrounded = true;
        }
        if (Keyboard.R) {
            camera.posX = 0;
            px = camera.posX;
            camera.posY = 0;
            py = camera.posY;
            camera.posZ = 1;
            pz = camera.posZ;
            camera.yaw = 0;
            camera.pitch = 0;
            camera.roll = 0;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uProjectionViewMatrix = gl.getUniformLocation(program, "uProjectionViewMatrix");

    async function Render() {
        deltaTime = await fps()/1000;
        controls(deltaTime);
        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();
        mat4.rotateX(modelViewMatrix, modelViewMatrix, degToRad(-camera.pitch));
        mat4.rotateY(modelViewMatrix, modelViewMatrix, degToRad(-camera.yaw));
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, degToRad(-camera.roll));
        mat4.translate(modelViewMatrix, modelViewMatrix, [-camera.posX,-camera.posY,-camera.posZ]);
        mat4.perspective(projectionMatrix, degToRad(camera.FOV), camera.ratio, 0.1, Infinity);     

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionViewMatrix, false, projectionMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawCube(0,0,0);
        drawCube(0,1,1);
        // requestAnimationFrame(Render);
    }
    Render();

    setInterval(async () => {
        Render();
    },0);
}
