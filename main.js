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


    let camera = {
        posX: 0,
        posY: 0,
        posZ: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        FOV: 90,
        ratio: 1
    }

    function resizeCanvas() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        camera.ratio = width/height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function drawTriangle(a,b,c,isInverted) {
        let vertices = [a,b,c];
        let vertexData = new Float32Array(vertices?.flat());
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        const vertexPosition = gl.getAttribLocation(program, "aPosition");
        const aTexCoordLocation = gl.getAttribLocation(program, "aTexCoord");
        gl.enableVertexAttribArray(aTexCoordLocation);
        gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, isInverted?1:0, vertices.length);
    }

    function drawQuad(a,b,c,d) { // TL TR BR BL
        // drawTriangle(b,c,d,false);
        // drawTriangle(d,c,b,true);
        // drawTriangle(b,a,c,false);
        let temp = false;
        // Generated
        // drawTriangle(a,b,c,temp);
        drawTriangle(a,b,d,temp);
        // drawTriangle(a,c,b,temp);
        // drawTriangle(a,c,d,temp);
        // drawTriangle(a,d,b,temp);
        // drawTriangle(a,d,c,temp);
        // drawTriangle(b,a,c,temp);-
        // drawTriangle(b,a,d,temp);-
        // drawTriangle(b,c,a,temp);-
        drawTriangle(b,c,d,temp);
        // drawTriangle(b,d,a,temp);
        // drawTriangle(b,d,c,temp);
        // drawTriangle(c,a,b,temp);
        // drawTriangle(c,a,d,temp);
        // drawTriangle(c,b,a,temp);
        // drawTriangle(c,b,d,temp);
        // drawTriangle(c,d,a,temp);
        // drawTriangle(c,d,b,temp);
        // drawTriangle(d,a,b,temp);
        // drawTriangle(d,a,c,temp);
        // drawTriangle(d,b,a,temp);
        // drawTriangle(d,b,c,temp);
        // drawTriangle(d,c,a,temp);
        // drawTriangle(d,c,b,temp);
    }

    function drawCube(x,y,z) {
        // A B
        // D C

        // a,c,b,true
        // b,c,a,false
    }

    let p_time = new Date().getTime();
    let fps_n = 0;
    function fps() {
        let c_time = new Date().getTime();
        let time = c_time-p_time;
        p_time = new Date().getTime();
        fps_n = Math.pow(time/1000, -1)
    }

    setInterval(() => {
        document.getElementById("fps").textContent = Math.round(fps_n);
    },500);

    setInterval(() => {
        fps()
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //[0,0,0],[1,0,0],[1,1,0],[0,1,0] BR BL TL TR
        //TL TR BR BL
        drawQuad([0,1,0],[1,1,0],[1,0,1],[0,0,1]);
    },0);
    // gl.getAttribLocation(program, "");
    // gl.getUniformLocation(program, "");
}
