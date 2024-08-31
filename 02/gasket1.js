"use strict";

var gl;
var points = [];
var NumPoints = 10000;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  
    const checkbox1 = document.getElementById('optionA');
    const checkbox2 = document.getElementById('optionB');

    checkbox1.addEventListener('change', () => {
        if (checkbox1.checked) {
            checkbox2.checked = false;
            NumPoints = 10000;
        }
        recalculatePoints();
    });

    checkbox2.addEventListener('change', () => {
        if (checkbox2.checked) {
            checkbox1.checked = false;
            NumPoints = 50000;
        }
        recalculatePoints();
    });
    recalculatePoints();
};

function recalculatePoints() {
    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    var p;
    if(document.getElementById('optionA').checked){
        p= vec2(100,100);
    }
    else{
        var u = add(vertices[0], vertices[1]);
        var v = add(vertices[0], vertices[2]);
        var p = scale(0.25, add(u, v));
    }

   

    points = [p];

    for (var i = 0; points.length < NumPoints; ++i) {
        var j;
        if (document.getElementById('optionB').checked){
            if(Math.random()< 0.9){
                j = 0;
            }else{
                j = Math.floor(Math.random() * 2) + 1;
            }
        }else{
            j = Math.floor(Math.random() * 3);
        }
        p = add(points[i], vertices[j]);
        p = scale(0.5, p);
        points.push(p);
    }
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, points.length);
}
