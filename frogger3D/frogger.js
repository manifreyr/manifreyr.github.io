var canvas;
var gl;

var numVertices = 36;

var pointsArray = [];

var zDist = -30.0;

var fovy = 60.0;
var near = 0.1;
var far = 100.0;

var spinX = -70.0;
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

var gridRows = 14;
var gridCols = 14;
var cellSize = 2.0;

var frogPos = { x: Math.floor(gridCols / 2), y: 13 };
var frogAlive = true;
var isFrogFlipped = false;

var cars = [];
var logs = [];
var fly = {
    x: null,
    y: null,
    active: false,
    timer: null,
    respawnInterval: null,
    previousRow: null
}
var lastRowReached = 13;
var score = 0;
var lives = 5;
var isStartOfGame = true;

// initialize game setup
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

    window.addEventListener("keydown", function (e) {
        if (!frogAlive) return;
        switch (e.keyCode) {
            case 32:
                isFrogFlipped = !isFrogFlipped;
                break;

            case 37:
                if (!isFrogFlipped) {
                    if (frogPos.x > 0) frogPos.x--;
                    frogPos.x = Math.round(frogPos.x);
                } else {
                    if (frogPos.x < gridCols - 1) frogPos.x++;
                    frogPos.x = Math.round(frogPos.x);
                }
                break;

            case 38:
                if (!isFrogFlipped) {
                    if (frogPos.y > 0) frogPos.y--;
                } else {
                    if (frogPos.y < gridRows - 1) frogPos.y++;
                }
                break;

            case 39:
                if (!isFrogFlipped) {
                    if (frogPos.x < gridCols - 1) frogPos.x++;
                    frogPos.x = Math.round(frogPos.x);
                } else {
                    if (frogPos.x > 0) frogPos.x--;
                    frogPos.x = Math.round(frogPos.x);
                }
                break;

            case 40:
                if (!isFrogFlipped) {
                    if (frogPos.y < gridRows - 1) frogPos.y++;
                } else {
                    if (frogPos.y > 0) frogPos.y--;
                }
                break;
        }
    });

    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();
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

    initGameObjects();
    startFlyCycle();
    render();
}

// updates player score display
function updateScoreDisplay() {
    document.getElementById("scoreDisplay").innerText = "Score: " + score;
}

// updates player lives display
function updateLivesDisplay() {
    document.getElementById("livesDisplay").innerText = "Lives: " + lives;
}

// initializes game objects like cars and logs/turtles
function initGameObjects() {
    for (var row = 7; row <= 12; row++) {
        var direction = (row % 2 == 0) ? 1 : -1;
        var numCars = 2;
        var rowSpeed = 0.02 + Math.random() * 0.02;
        var segmentLength = gridCols / numCars;

        for (var i = 0; i < numCars; i++) {
            var length = 2.0;

            var minX = i * segmentLength;
            var maxX = (i + 1) * segmentLength - length;

            if (maxX < minX) maxX = minX;

            var x = minX + Math.random() * (maxX - minX);

            var car = { x: x, y: row, speed: rowSpeed, direction: direction, length: length };
            cars.push(car);
        }
    }

    for (var row = 1; row <= 5; row++) {
        var direction = (row % 2 == 0) ? 1 : -1;
        var numObjects = 3;
        var rowSpeed = 0.01 + Math.random() * 0.02;
        var segmentLength = gridCols / numObjects;

        for (var i = 0; i < numObjects; i++) {
            var isTurtle = Math.random() < 0.30;
            var length = 2.0;
            var minX = i * segmentLength;
            var maxX = (i + 1) * segmentLength - length;

            if (maxX < minX) maxX = minX;

            var x = minX + Math.random() * (maxX - minX);

            var obj = {
                x: x, y: row, speed: rowSpeed, direction: direction, length: length,
                isRidable: true, type: isTurtle ? 'turtle' : 'log',
                submergeTimer: isTurtle ? getRandomInt(120, 300) : null,
                submergeDuration: isTurtle ? getRandomInt(60, 90) : null,
                surfaceDuration: isTurtle ? getRandomInt(240, 540) : null
            };
            logs.push(obj);
        }
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// moves the frog to starting position
function resetGame() {
    frogPos = { x: Math.floor(gridCols / 2), y: 13 };
    frogAlive = true;
    isFrogFlipped = false;
}

// handles frog death
function handleDeath() {
    lives--;
    updateLivesDisplay();

    if (lives === 0) {
        alert("Your score was: " + score + "\n" + "Click OK to restart game");
        score = 0;
        lives = 5;
        lastRowReached = 13;
        updateScoreDisplay();
        updateLivesDisplay();
        resetGame();
    } else {
        lastRowReached = 13;
        resetGame();
    }

    fly.active = false;
    clearTimeout(fly.timer);
    fly.previousRow = 13;
    spawnFly();
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
        vec4(-0.5, -0.5, 0.5, 1.0), vec4(-0.5, 0.5, 0.5, 1.0), vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0), vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0), vec4(0.5, -0.5, -0.5, 1.0)
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


function frogGridToWorld(x, y) {
    var worldX = (x - gridCols / 2 + 0.5) * cellSize;
    var worldZ = (gridRows / 2 - y + 0.5) * cellSize;
    return vec3(worldX, 0.0, -worldZ);
}

// starts the fly spawning cycle
function startFlyCycle() {
    spawnFly();
    fly.respawnInterval = setInterval(spawnFly, 13000);
}

// spawns a fly 

function spawnFly() {
    if (fly.active) return;

    var possibleRows = isStartOfGame ? [0, 6] : [0, 6, 13];
    var newRow;

    do {
        newRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];
    } while (newRow === fly.previousRow);

    fly.y = newRow;
    fly.x = Math.floor(Math.random() * gridCols);
    fly.active = true;

    fly.previousRow = newRow;

    fly.timer = setTimeout(function () {
        fly.active = false;
    }, 12500);

    isStartOfGame = false;
}

// updates positions of game objects
function updateObjects() {
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        car.x += car.speed * car.direction;
        if (car.x > gridCols + car.length) car.x = -car.length;
        if (car.x < -car.length) car.x = gridCols + car.length;
    }

    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];
        log.x += log.speed * log.direction;
        if (log.x > gridCols + log.length) log.x = -log.length;
        if (log.x < -log.length) log.x = gridCols + log.length;

        if (log.type === 'turtle') {
            log.submergeTimer--;
            if (log.submergeTimer <= 0) {
                log.isRidable = !log.isRidable;
                log.submergeTimer = log.isRidable ? log.surfaceDuration : log.submergeDuration;
            }
        }
    }
}

// detects collisions with the frog and objects
function detectCollisions() {
    if (frogAlive) {
        if ([0, 6, 13].includes(frogPos.y)) {
            frogPos.x = Math.round(frogPos.x);

            if (fly.active && frogPos.x === fly.x && frogPos.y === fly.y) {
                fly.active = false;
                clearTimeout(fly.timer);
                startFlyCycle();
                score += 50;
                updateScoreDisplay();
            } else if (frogPos.y !== lastRowReached) {
                score += 10;
                updateScoreDisplay();
            }

            lastRowReached = frogPos.y;
        }

        if (frogPos.y >= 7 && frogPos.y <= 12) {
            for (var i = 0; i < cars.length; i++) {
                var car = cars[i];
                if (car.y == frogPos.y && frogPos.x >= car.x - 1.0 && frogPos.x <= car.x + car.length) {
                    frogAlive = false;
                    handleDeath();
                    break;
                }
            }
        } else if (frogPos.y >= 1 && frogPos.y <= 5) {
            var onLog = false;
            for (var i = 0; i < logs.length; i++) {
                var log = logs[i];
                if (log.y == frogPos.y && frogPos.x >= log.x && frogPos.x <= log.x + log.length) {
                    if (log.type === 'turtle' && !log.isRidable) {
                        frogAlive = false;
                        handleDeath();
                        break;
                    } else {
                        onLog = true;
                        frogPos.x += log.speed * log.direction;
                        if (frogPos.x < 0 || frogPos.x > gridCols - 1) {
                            frogAlive = false;
                            handleDeath();
                        }
                        break;
                    }
                }
            }
            if (!onLog) {
                frogAlive = false;
                handleDeath();
            }
        }
    }
}

// draws the river
function drawRiver() {
    gl.uniform4fv(uColorLoc, flatten(vec4(0.0, 0.0, 1.0, 1.0)));
    for (var y = 1; y <= 5; y++) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] -= 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }
}

// draws the free zones 
function drawFreeZones() {
    gl.uniform4fv(uColorLoc, flatten(vec4(0.5, 0.5, 0.5, 1.0)));
    [0, 6, 13].forEach(function (y) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] -= 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    });
}

// draws the road in 
function drawRoad() {
    gl.uniform4fv(uColorLoc, flatten(vec4(0.6, 0.4, 0.2, 1.0)));
    for (var y = 7; y <= 12; y++) {
        var mv1 = mv;
        var pos = gridToWorld(gridCols / 2 - 0.5, y);
        pos[2] -= 2.0;
        mv1 = mult(mv1, translate(pos));
        mv1 = mult(mv1, scalem(gridCols * cellSize, cellSize, cellSize));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }
}

// draws logs and turtles
function drawLogs() {
    for (var i = 0; i < logs.length; i++) {
        var obj = logs[i];
        if (obj.type === 'turtle' && !obj.isRidable) continue;

        if (obj.type === 'log') gl.uniform4fv(uColorLoc, flatten(vec4(0.4, 0.2, 0.0, 1.0)));
        else if (obj.type === 'turtle') gl.uniform4fv(uColorLoc, flatten(vec4(0.13, 0.35, 0.13, 1.0)));

        var leftEdge = obj.x;
        var rightEdge = obj.x + obj.length;
        var visibleLeft = Math.max(leftEdge, 0);
        var visibleRight = Math.min(rightEdge, gridCols);

        if (visibleLeft < visibleRight) {
            var visibleLength = visibleRight - visibleLeft;
            var mv1 = mv;
            var pos = gridToWorld(visibleLeft + visibleLength / 2 - 0.5, obj.y);
            pos[2] -= 1.80;
            mv1 = mult(mv1, translate(pos));
            mv1 = mult(mv1, scalem(visibleLength * cellSize, cellSize, cellSize));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            gl.drawArrays(gl.TRIANGLES, 0, numVertices);
        }
    }
}

// draws the cars 
function drawCars() {
    gl.uniform4fv(uColorLoc, flatten(vec4(1.0, 0.0, 0.0, 1.0)));
    for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
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
}

// draws the frog 
function drawFrog() {
    gl.uniform4fv(uColorLoc, flatten(vec4(0.0, 1.0, 0.0, 1.0)));
    var mv1 = mv;
    var frogWorldPos = gridToWorld(frogPos.x, frogPos.y);
    mv1 = mult(mv1, translate(frogWorldPos));
    mv1 = mult(mv1, scalem(cellSize, cellSize, cellSize));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

// draws the fly 
function drawFly() {
    gl.uniform4fv(uColorLoc, flatten(vec4(1.0, 0.0, 1.0, 1.0)));
    var mvFly = mv;
    var flyWorldPos = gridToWorld(fly.x, fly.y);
    mvFly = mult(mvFly, translate(flyWorldPos));
    mvFly = mult(mvFly, scalem(cellSize, cellSize, cellSize));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvFly));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var frogWorldPos = frogGridToWorld(frogPos.x, frogPos.y);

    var cameraOffset = !isFrogFlipped ? vec3(0.0, 5.0, 20.0) : vec3(0.0, 20.0, -12.5);
    var eye = add(frogWorldPos, cameraOffset);
    var at = frogWorldPos;

    var up = vec3(0.0, 1.0, 0.0);

    mv = lookAt(eye, at, up);
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    updateObjects();
    detectCollisions();
    drawRiver();
    drawFreeZones();
    drawRoad();
    drawLogs();
    drawCars();
    drawFrog();

    if (fly.active) drawFly();

    window.requestAnimFrame(render);
}
