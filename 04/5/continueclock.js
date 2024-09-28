var canvas;
var gl;

var numVertices = 36;

var points = [];
var colors = [];

var movement = false;
var spinX = 0;
var spinY = 180;
var origX;
var origY;

var matrixLoc;
var secondAngle = 0;
var minuteAngle = 0;
var hourAngle = 0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

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

    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
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
        [0.0, 0.0, 0.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
        [0.0, 1.0, 1.0, 1.0],
        [0.1, 0.4, 0.3, 1.0]
    ];

    var faceColors = {
        front: vertexColors[1],
        right: vertexColors[2],
        bottom: vertexColors[3],
        top: vertexColors[4],
        back: vertexColors[7],
        left: vertexColors[5]
    };

    var indices = [a, b, c, a, c, d];

    var color;

    switch (a) {
        case 1:
            color = faceColors.front;
            break;
        case 2:
            color = faceColors.right;
            break;
        case 3:
            color = faceColors.bottom;
            break;
        case 6:
            color = faceColors.top;
            break;
        case 4:
            color = faceColors.back;
            break;
        case 5:
            color = faceColors.left;
            break;
        default:
            color = vertexColors[0];
    }

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(color);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    var mv1 = mult(mv, translate(0.0, 0.0, -0.05));
    mv1 = mult(mv1, rotateY(180));
    mv1 = mult(mv1, scalem(1.2, 1.2, 0.02));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    secondAngle = (secondAngle - 6) % 360;
    minuteAngle = (minuteAngle - 0.1) % 360;
    hourAngle = (hourAngle - 0.008333) % 360;

    mv1 = mult(mv, rotateZ(hourAngle));
    mv1 = mult(mv1, translate(0.125, 0.0, 0.0));
    mv1 = mult(mv1, scalem(0.25, 0.025, 0.025));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv1 = mult(mv, rotateZ(hourAngle));
    mv1 = mult(mv1, translate(0.25, 0.0, 0.0));
    mv1 = mult(mv1, rotateZ(minuteAngle));
    mv1 = mult(mv1, translate(0.125, 0.0, 0.0));
    mv1 = mult(mv1, scalem(0.25, 0.015, 0.015));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv1 = mult(mv, rotateZ(hourAngle));
    mv1 = mult(mv1, translate(0.25, 0.0, 0.0));
    mv1 = mult(mv1, rotateZ(minuteAngle));
    mv1 = mult(mv1, translate(0.25, 0.0, 0.0));
    mv1 = mult(mv1, rotateZ(secondAngle));
    mv1 = mult(mv1, translate(0.125, 0.0, 0.0));
    mv1 = mult(mv1, scalem(0.25, 0.01, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    requestAnimFrame(render);
}
