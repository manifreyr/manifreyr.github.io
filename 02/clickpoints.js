//////////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Teikna hring á strigann þar sem notandinn smellir með músinni
//
//    Hjálmtýr Hafsteinsson, ágúst 2024
//////////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numCirclePoints = 20;  // Number of points to approximate the circle
var maxNumCircles = 200;   // Maximum number of circles to be drawn
var index = 0;

var points = [];
var program;

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.1, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumCircles * (numCirclePoints + 2), gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousedown", function(e) {
        var center = vec2(2 * e.offsetX / canvas.width - 1, 2 * (canvas.height - e.offsetY) / canvas.height - 1);
        var radius = Math.random() * 0.1 + 0.05; // Random radius between 0.1 and 0.4
        
        createCirclePoints(center, radius);
        
        // Bind and buffer the new circle's points
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index * (numCirclePoints + 2), flatten(points));
        
        index++;
    });

    var clearButton = document.getElementById("clearbutton");
    clearButton.addEventListener("click", function() {
        index = 0;  // Reset the index
        gl.clear(gl.COLOR_BUFFER_BIT);  // Clear the canvas
    });

    render();
}

// Create the points of the circle
function createCirclePoints(center, radius) {
    points = [];
    points.push(center);
    
    var dAngle = 2 * Math.PI / numCirclePoints;
    for (var i = 0; i <= numCirclePoints; i++) {
        var angle = i * dAngle;
        var p = vec2(radius * Math.sin(angle) + center[0], radius * Math.cos(angle) + center[1]);
        points.push(p);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    for (var i = 0; i < index; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * (numCirclePoints + 2), numCirclePoints + 2);
    }
    
    window.requestAnimFrame(render);
}
