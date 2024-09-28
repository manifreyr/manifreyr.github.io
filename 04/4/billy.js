/////////////////////////////////////////////////////////////////
//    Example in Computer Graphics
//    Build an IKEA Billy shelf model with top, bottom,
//    left side, right side, back, and 2 shelves.
//
//    Hjálmtýr Hafsteinsson, modified version September 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices = 36;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 180;
var origX;
var origY;

var matrixLoc;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    matrixLoc = gl.getUniformLocation(program, "transform");

    //event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (origX - e.offsetX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    render();
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    var vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    var vertexColors = [
        [0.12, 0.34, 0.87, 1.0],  // random color 1
        [0.65, 0.22, 0.44, 1.0],  // random color 2
        [0.78, 0.91, 0.19, 1.0],  // random color 3
        [0.36, 0.47, 0.72, 1.0],  // random color 4
        [0.93, 0.67, 0.22, 1.0],  // random color 5
        [0.44, 0.88, 0.67, 1.0],  // random color 6
        [0.11, 0.76, 0.89, 1.0],  // random color 7
        [0.89, 0.29, 0.52, 1.0]   // random color 8
    ];


    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Top shelf
    var mv1 = mult(mv, translate(0.0, 0.70, 0.0));  // Reduce translation
    mv1 = mult(mv1, scalem(1.0, 0.1, 0.5));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Bottom shelf
    mv1 = mult(mv, translate(0.0, -0.70, 0.0));  // Reduce translation
    mv1 = mult(mv1, scalem(1.0, 0.1, 0.5));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Left side
    mv1 = mult(mv, translate(-0.5, 0.0, 0.0));
    mv1 = mult(mv1, scalem(0.1, 1.5, 0.5));  // Reduce height scaling
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Right side
    mv1 = mult(mv, translate(0.5, 0.0, 0.0));
    mv1 = mult(mv1, scalem(0.1, 1.5, 0.5));  // Reduce height scaling
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Back panel
    mv1 = mult(mv, translate(0.0, 0.0, -0.225));
    mv1 = mult(mv1, scalem(1.0, 1.5, 0.05));  // Adjust height scaling
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Middle shelf 1
    mv1 = mult(mv, translate(0.0, 0.25, 0.0));  // Adjust middle shelf position
    mv1 = mult(mv1, scalem(1.0, 0.1, 0.5));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Middle shelf 2
    mv1 = mult(mv, translate(0.0, -0.25, 0.0));  // Adjust middle shelf position
    mv1 = mult(mv1, scalem(1.0, 0.1, 0.5));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    requestAnimFrame(render);
}
