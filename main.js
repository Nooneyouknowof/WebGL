const vertexCode = document.getElementById("vertex").textContent;
const fragmentCode = document.getElementById("fragment").textContent;
console.log(vertexCode);
console.log(fragmentCode);

const canvas = document.getElementById("screen");
const gl = canvas.getContext("webgl2");
let Keyboard = {};
let deltaTime = 0;
let width = 0;
let height = 0;

if (gl === null) {
    alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
} else {
    document.addEventListener("keyup", (event) => {
        if (!event.repeat) {Keyboard[event.key.toUpperCase().replace(" ", "SPACE")] = false}
    });
    document.addEventListener("keydown", (event) => {
        if (!event.repeat) {Keyboard[event.key.toUpperCase().replace(" ", "SPACE")] = true}
    });

    function modulo(n,d) {
        return ((n % d) + d) % d
    }
    function deg(arg) {
        arg = modulo(arg,360);
        return arg;
    }

    let p_event = {};
    let sens = 100;
    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;
    document.addEventListener("mousemove", function(event) {
        let mousemoveX = ((event.x-p_event.x)*sens/width)/degToRad(camera.FOV);
        let mousemoveY = ((event.y-p_event.y)*sens/height)/degToRad(camera.FOV);
        mousemoveX = mousemoveX?mousemoveX:0;
        mousemoveY = mousemoveY?mousemoveY:0;
        p_event = event;
        rotateX += mousemoveX;
        // console.log(rotateX, deg(rotateX))
        // camera.rotX = deg(rotateX);
        // console.log(camera.rotateX,camera.rotateY,camera.rotateZ);
    })

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

    let camera = { // 2.5,1,-3
        posX: 2.5,
        posY: 1,
        posZ: -3,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        FOV: 90,
        ratio: 1
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const aCameraFOV = gl.getUniformLocation(program, "uCameraFOV");
    const aCameraRatio = gl.getUniformLocation(program, "uCameraRatio");

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        camera.ratio = width/height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(aCameraFOV, degToRad(camera.FOV));
        gl.uniform1f(aCameraRatio, camera.ratio);
    }
    window.addEventListener("resize", event => {if (!event.repeat) {resizeCanvas()}});
    resizeCanvas();

    function drawTriangle(vertices,isInverted) {
        let vertexData = new Float32Array(vertices?.flat());
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        const vertexPosition = gl.getAttribLocation(program, "aPosition");

        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, isInverted?0:1, vertices.length);
    }

    function drawQuad(a,b,c,d) {
        // drawTriangle([b,d,c],true);
        // drawTriangle([d,b,a],true);
        drawTriangle([b,d,c,d,b,a],true);
    }

    function drawCube(x,y,z) {
        drawQuad([x+0,y+0,z+1],[x+1,y+0,z+1],[x+1,y+1,z+1],[x+0,y+1,z+1]);// Back
        drawQuad([x+0,y+0,z+0],[x+1,y+0,z+0],[x+1,y+0,z+1],[x+0,y+0,z+1]);// Bottom
        drawQuad([x+0,y+1,z+1],[x+1,y+1,z+1],[x+1,y+1,z+0],[x+0,y+1,z+0]);// Top
        drawQuad([x+0,y+1,z+1],[x+0,y+1,z+0],[x+0,y+0,z+0],[x+0,y+0,z+1]);// Left
        drawQuad([x+1,y+1,z+0],[x+1,y+1,z+1],[x+1,y+0,z+1],[x+1,y+0,z+0]);// Right
        drawQuad([x+0,y+1,z+0],[x+1,y+1,z+0],[x+1,y+0,z+0],[x+0,y+0,z+0]);// Front
    }

    let p_time = new Date().getTime();
    let fps_n = 0;
    function fps() {
        let c_time = new Date().getTime();
        let time = c_time-p_time;
        p_time = c_time;
        fps_n = Math.pow(time/1000, -1);
        return time;
    }

    setInterval(() => {
        document.getElementById("fps").textContent = `${Math.round(fps_n)}, ${deltaTime}ms`;
    },500);

    let speed = 2.5;
    let gravity = 0.5;
    let isGrounded = false;
    let px = camera.posX;
    let py = camera.posY;
    let pz = camera.posZ;
    function controls(deltaTime) {
        if (Keyboard.W) {
            camera.posZ += speed*deltaTime
        }
        if (Keyboard.A) {
            camera.posX -= speed*deltaTime
        }
        if (Keyboard.S) {
            camera.posZ -= speed*deltaTime
        }
        if (Keyboard.D) {
            camera.posX += speed*deltaTime
        }
        if (Keyboard.SPACE && isGrounded) {
            isGrounded = false;
            py -= 1;
        }
        if (Keyboard.SHIFT) {
            camera.posY -= speed*deltaTime
        }
        if (!isGrounded) {
            let y = camera.posY;
            camera.posY = y-(((py-y)*0.98)*(deltaTime*5));
            py = py-(((py-y-gravity)*1)*(deltaTime*5));
        } 
        if (camera.posY <= 0) {
            camera.posY = 0;
            py = 0;
            isGrounded = true;
        }
        if (Keyboard.R) {
            camera.posX = 0;
            camera.posY = 0;
            camera.posZ = -1;
            camera.rotX = 0;
            camera.rotY = 0;
            camera.rotZ = 0;
        }
        if (Keyboard.CONTROL) {
            console.log(Keyboard, camera.posX, camera.posY, camera.posZ);
        }

    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uProjectionViewMatrix = gl.getUniformLocation(program, "uProjectionViewMatrix");
    setInterval(() => {
        deltaTime = fps()/1000;
        controls(deltaTime);
        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();

        mat4.rotateX(modelViewMatrix, modelViewMatrix, degToRad(camera.rotateX));
        mat4.rotateY(modelViewMatrix, modelViewMatrix, degToRad(camera.rotateY));
        mat4.translate(modelViewMatrix, modelViewMatrix, [-camera.posX,-camera.posY,-camera.posZ]);
        mat4.perspective(projectionMatrix, degToRad(45), camera.ratio, 0.1, 1.0);

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionViewMatrix, false, projectionMatrix);

        // console.log(modelViewMatrix);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawCube(0,0,0);
        drawCube(0,1,1);
    },10);
}
