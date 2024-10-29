///////////////////////////////////////////////////////////////
//    Simple 3D Frogger Game without Phong Lighting
//    A basic implementation of Frogger using WebGL.
//    Use arrow keys to move the frog across the road and river.
//    The frog dies if hit by a car or falls into the river.
//
//    Adapted by OpenAI's ChatGPT, October 2023
///////////////////////////////////////////////////////////////

var canvas;
var gl;

var numVertices = 36;

var pointsArray = [];

var zDist = -30.0;

var fovy = 60.0;
var near = 0.1;
var far = 100.0;

var spinX = 52.0;
var spinY = 0.0;
var origX;
var origY;
var movement = false;

var mv, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var uColorLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Game variables
var gridRows = 13;
var gridCols = 14;
var cellSize = 2.0;

var frogPos = { x: Math.floor(gridCols / 2), y: 12 };
var frogAlive = true;

var cars = [];
var logs = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    uColorLoc = gl.getUniformLocation(program, "uColor");

    projectionMatrix = perspective(fovy, canvas.width / canvas.height, near, far);

    // Initialize game elements
    initGameElements();

    // Event listeners for keyboard
    window.addEventListener("keydown", function (e) {
        if (!frogAlive) return;
        switch (e.keyCode) {
            case 37: // Left arrow
                if (frogPos.x < gridCols - 1) {
                    frogPos.x++;
                    frogPos.x = Math.round(frogPos.x);
                }
                console.log(frogPos.x);
                break;
            case 38: // Up arrow
                if (frogPos.y > 0) frogPos.y--;
                break;
            case 39: // Right arrow
                if (frogPos.x > 0) {
                    frogPos.x--;
                    frogPos.x = Math.round(frogPos.x);
                }
                break;
            case 40: // Down arrow
                if (frogPos.y < gridRows - 1) frogPos.y++;
                break;
        }
    });

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (e.clientX - origX)) % 360;
            spinX = (spinX + (origY - e.clientY)) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    });

    render();
}

function initGameElements() {
    // Initialize cars
    for (var row = 6; row <= 11; row++) {
        var direction = (row % 2 == 0) ? 1 : -1; // Alternate direction
        var numCars = 3; // Number of cars in this row
        for (var i = 0; i < numCars; i++) {
            var car = {
                x: Math.random() * gridCols,
                y: row,
                speed: 0.02 + Math.random() * 0.02,
                direction: direction,
                length: 2.0 // Fixed length for simplicity
            };
            cars.push(car);
        }
    }

    // Initialize logs
    for (var row = 0; row <= 4; row++) {
        var direction = (row % 2 == 0) ? 1 : -1; // Alternate direction
        var numLogs = 3; // Number of logs in this row
        for (var i = 0; i < numLogs; i++) {
            var log = {
                x: Math.random() * gridCols,
                y: row,
                speed: 0.01 + Math.random() * 0.02,
                direction: direction,
                length: 3.0 // Fixed length for simplicity
            };
            logs.push(log);
        }
    }
}

function resetGame() {
    alert("Game Over!");
    frogPos = { x: Math.floor(gridCols / 2), y: 12 };
    frogAlive = true;
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
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        pointsArray.push(vertices[indices[i]]);
    }
}

function gridToWorld(x, y) {
    var worldX = (x - gridCols / 2 + 0.5) * cellSize;
    var worldY = (gridRows / 2 - y + 0.5) * cellSize;
    return vec3(worldX, worldY, 0.0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var frogWorldPos = gridToWorld(frogPos.x, frogPos.y);

    var eye = vec3(frogWorldPos[0], frogWorldPos[1] + 3.0, frogWorldPos[2] - 30.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    mv = lookAt(eye, at, up);
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Update cars
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        car.x += car.speed * car.direction;
        if (car.x > gridCols + car.length) car.x = -car.length;
        if (car.x < -car.length) car.x = gridCols + car.length;
    }

    // Update logs
    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];
        log.x += log.speed * log.direction;
        if (log.x > gridCols + log.length) log.x = -log.length;
        if (log.x < -log.length) log.x = gridCols + log.length;
    }

    // Collision detection
    if (frogAlive) {
        if (frogPos.y == 5 || frogPos.y == 12) {
            frogPos.x = Math.round(frogPos.x);
        }
        else if (frogPos.y >= 6 && frogPos.y <= 11) {
            // Road rows
            for (var i = 0; i < cars.length; i++) {
                var car = cars[i];
                if (car.y == frogPos.y) {
                    if (frogPos.x >= car.x && frogPos.x <= car.x + car.length) {
                        frogPos.x = Math.round(frogPos.x)
                        frogAlive = false;
                        resetGame();
                        break;
                    }
                }
            }
        } else if (frogPos.y >= 0 && frogPos.y <= 4) {
            // River rows
            var onLog = false;
            for (var i = 0; i < logs.length; i++) {
                var log = logs[i];
                if (log.y == frogPos.y) {
                    if (frogPos.x >= log.x && frogPos.x <= log.x + log.length) {
                        onLog = true;
                        frogPos.x = frogPos.x + log.speed * log.direction;
                        if (frogPos.x < 0 || frogPos.x > gridCols - 1) {
                            frogAlive = false;
                            resetGame();
                        }
                        break;
                    }
                }
            }
            if (!onLog) {
                frogAlive = false;
                resetGame();
            }
        }
    }

    // Draw river (blue rectangles)
    gl.uniform4fv(uColorLoc, flatten(vec4(0.0, 0.0, 1.0, 1.0))); // Blue
    for (var y = 0; y <= 4; y++) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] += 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }

    // Draw free zones (grey rectangles)
    gl.uniform4fv(uColorLoc, flatten(vec4(0.5, 0.5, 0.5, 1.0))); // Grey
    [5, 12].forEach(function (y) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] += 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    });

    // Draw road (brown rectangles)
    gl.uniform4fv(uColorLoc, flatten(vec4(0.6, 0.4, 0.2, 1.0))); // Brown
    for (var y = 6; y <= 11; y++) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] += 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }

    // Draw logs with clipping
    gl.uniform4fv(uColorLoc, flatten(vec4(0.4, 0.2, 0.0, 1.0))); // Dark Brown
    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];

        // Calculate visible portion within the grid
        var leftEdge = log.x;
        var rightEdge = log.x + log.length;
        var visibleLeft = Math.max(leftEdge, 0);
        var visibleRight = Math.min(rightEdge, gridCols);

        if (visibleLeft < visibleRight) {
            var visibleLength = visibleRight - visibleLeft;
            var mv1 = mv;
            var pos = gridToWorld(visibleLeft + visibleLength / 2 - 0.5, log.y);
            pos[2] += 1.80;
            mv1 = mult(mv1, translate(pos));
            mv1 = mult(mv1, scalem(visibleLength * cellSize, cellSize, cellSize));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            gl.drawArrays(gl.TRIANGLES, 0, numVertices);
        }
    }

    // Draw cars with clipping
    gl.uniform4fv(uColorLoc, flatten(vec4(1.0, 0.0, 0.0, 1.0))); // Red
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];

        // Calculate visible portion within the grid
        var leftEdge = car.x;
        var rightEdge = car.x + car.length;
        var visibleLeft = Math.max(leftEdge, 0);
        var visibleRight = Math.min(rightEdge, gridCols);

        if (visibleLeft < visibleRight) {
            var visibleLength = visibleRight - visibleLeft;
            var mv1 = mv;
            var pos = gridToWorld(visibleLeft + visibleLength / 2 - 0.5, car.y);
            mv1 = mult(mv1, translate(pos));
            mv1 = mult(mv1, scalem(visibleLength * cellSize, cellSize, cellSize));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            gl.drawArrays(gl.TRIANGLES, 0, numVertices);
        }
    }

    // Draw frog
    gl.uniform4fv(uColorLoc, flatten(vec4(0.0, 1.0, 0.0, 1.0))); // Green
    var mv1 = mv;
    var frogWorldPos = gridToWorld(frogPos.x, frogPos.y);
    mv1 = mult(mv1, translate(frogWorldPos));
    mv1 = mult(mv1, scalem(cellSize, cellSize, cellSize));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    window.requestAnimFrame(render);
}
