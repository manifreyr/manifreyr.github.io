"use strict";

var gl;
var points;
var program;
var scaleFactor = 1.0;
var previousX;
var previousY;
var transition = vec2(0.0, 0.0);
var isMoving = false;

var NumPoints = 100000;
var color = vec4(0.75, 0.66, 0.23, 1.0);

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    var u = add(vertices[0], vertices[1]);
    var v = add(vertices[0], vertices[2]);
    var p = scale(0.25, add(u, v));

    points = [p];

    for (var i = 0; points.length < NumPoints; ++i) {
        var j = Math.floor(Math.random() * 3);
        p = add(points[i], vertices[j]);
        p = scale(0.5, p);
        points.push(p);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            scaleFactor *= 1.02;
        } else {
            scaleFactor /= 1.02;
        }
        var scaleUniform = gl.getUniformLocation(program, 'scaleFactor');
        gl.uniform1f(scaleUniform, scaleFactor);
        console.log(scaleFactor);

        render();
    });

    canvas.addEventListener("mousedown", function (event) {
        isMoving = true;
        previousX = event.clientX;
        previousY = event.clientY;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (isMoving) {
            var dX = event.clientX - previousX;
            var dY = event.clientY - previousY;

            transition = add(transition, vec2((2 * dX) / canvas.width, -(2 * dY) / canvas.height));
            var transitionUniform = gl.getUniformLocation(program, 'transition');
            gl.uniform2fv(transitionUniform, transition);
            previousX = event.clientX;
            previousY = event.clientY;
            render();
        }
    });

    canvas.addEventListener("mouseup", function () {
        isMoving = false;
    });

    canvas.addEventListener("mouseleave", function () {
        isMoving = false;
    });

    window.addEventListener("keydown", function (event) {
        if (event.code === 'Space') {
            var colorUniform = gl.getUniformLocation(program, 'color');
            color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
            gl.uniform4fv(colorUniform, color);
            render();
        }
    });

    var colorUniform = gl.getUniformLocation(program, 'color');
    color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
    gl.uniform4fv(colorUniform, color);

    var transitionUniform = gl.getUniformLocation(program, 'transition');
    gl.uniform2fv(transitionUniform, transition);

    var scaleUniform = gl.getUniformLocation(program, 'scaleFactor');
    gl.uniform1f(scaleUniform, scaleFactor);
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, points.length);
}
