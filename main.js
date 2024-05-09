const vertexCode = document.getElementById("vertex").textContent;
const fragmentCode = document.getElementById("fragment").textContent;
console.log(vertexCode);
console.log(fragmentCode);

const canvas = document.getElementById("screen");
const gl = canvas.getContext("webgl2")
let Keyboard = {}

if (gl === null) {
    alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
} else {
    document.addEventListener("keyup", (event) => {Keyboard[event.key] = false});
    document.addEventListener("keydown", (event) => {Keyboard[event.key] = true});

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

    let global = {
        width: 0,
        height: 0
    }

    let camera = {
        posX: 0,
        posY: 0,
        posZ: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        FOV: 90
    }

    function resizeCanvas() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        global.width = width;
        global.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function vwF(vec3) {
        return [vec3[0]*global.height/global.width,vec3[1],vec3[2]]
    }

    function avwF(arr) {
        return arr.map(item=>vwF(item))
    }

    function drawTriangle(a,b,c) {
        let vertices = avwF([a,b,c]);
        let vertexData = new Float32Array(vertices?.flat());
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        const vertexPosition = gl.getAttribLocation(program, "vertexPosition");
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }

    function drawQuad(a,b,c,d) {
        let vertices = avwF([a,b,c,c,d,b]);
        let vertexData = new Float32Array(vertices?.flat());
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        const vertexPosition = gl.getAttribLocation(program, "vertexPosition");
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }

    function drawCube(x,y,z) {

    }

    function clearScreen() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    const programInfo = {
        program: program,
        attribLocations: {
        vertexPosition: gl.getAttribLocation(program, "aVertexPosition"),
        },
        uniformLocations: {
        projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),
        },
    };
    let cubeRotation = 0.0;
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    setInterval(() => {
        let modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [0.0, 0.0, 0.0], // amount to translate
        );
        mat4.rotate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            cubeRotation, // amount to rotate in radians
            [0, 0, 1],
        );
        mat4.rotate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            cubeRotation*0.7, // amount to rotate in radians
            [0, 1, 0],
        );
        mat4.rotate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            cubeRotation*0.3, // amount to rotate in radians
            [1, 0, 0],
        );
        clearScreen();
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        );
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix,
        );
        drawQuad([0.5,0.5,0.5],[0.5,-0.5,0.5],[-0.5,0.5,-0.5],[-0.5,-0.5,-0.5]);

    },0);
}
