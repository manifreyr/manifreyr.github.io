var canvas;
var gl;

var numVertices = 36;

var points = [];
var colors = [];

var movement = false;
var spinX = 45;
var spinY = 45;
var origX;
var origY;

var matrixLoc;

var gridSize = 10;
var grid = [];
var nextGrid = [];
var prevGrid = [];
var currTime = 0;
var lastUpdateTime = 0;
var animationStartTime = 0;
var isAnimating = false;
var zoom = -25;
var p;

const animationDur = 1250;

var birthPositions = {};
var deathPositions = {};

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

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
            spinY = (spinY - (origX - e.offsetX)) % 360;
            spinX = (spinX - (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });
    canvas.addEventListener("wheel", function (event) {
        if (event.deltaY > 0) {
            zoom -= 1.0;
        } else {
            zoom += 1.0;
        }
        event.preventDefault();
    });

    initializeGrid();
    lastUpdateTime = Date.now();
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
        [1.0, 1.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
        [0.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0]
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}

function initializeGrid() {
    for (let x = 0; x < gridSize; x++) {
        grid[x] = [];
        nextGrid[x] = [];
        prevGrid[x] = [];
        for (let y = 0; y < gridSize; y++) {
            grid[x][y] = [];
            nextGrid[x][y] = [];
            prevGrid[x][y] = [];
            for (let z = 0; z < gridSize; z++) {
                grid[x][y][z] = Math.random() < 0.2 ? 1 : 0;
                nextGrid[x][y][z] = 0;
                prevGrid[x][y][z] = grid[x][y][z];
            }
        }
    }
}

function countAliveNeighbors(x, y, z) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                if (i === 0 && j === 0 && k === 0) continue;
                let nx = x + i;
                let ny = y + j;
                let nz = z + k;
                if (nx >= 0 && ny >= 0 && nz >= 0 && nx < gridSize && ny < gridSize && nz < gridSize) {
                    count += grid[nx][ny][nz];
                }
            }
        }
    }
    return count;
}

function cellKey(x, y, z) {
    return x + ',' + y + ',' + z;
}

function getRandomOutsideCoordinate() {
    let outerLimit = gridSize;
    let innerLimit = gridSize / 2;
    if (Math.random() < 0.5) {
        return -outerLimit + Math.random() * (outerLimit - innerLimit);
    } else {
        return innerLimit + Math.random() * (outerLimit - innerLimit);
    }
}

function getRandomPositionOutsideGrid() {
    let x = getRandomOutsideCoordinate();
    let y = getRandomOutsideCoordinate();
    let z = getRandomOutsideCoordinate();
    return vec3(x, y, z);
}

function updateGrid() {
    prevGrid = grid;
    birthPositions = {};
    deathPositions = {};

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let aliveNeighbors = countAliveNeighbors(x, y, z);
                if (grid[x][y][z] === 1) {
                    nextGrid[x][y][z] = (aliveNeighbors >= 5 && aliveNeighbors <= 7) ? 1 : 0;
                    if (nextGrid[x][y][z] === 0) {
                        let endPosition = getRandomPositionOutsideGrid();
                        let key = cellKey(x, y, z);
                        deathPositions[key] = endPosition;
                    }
                } else {
                    nextGrid[x][y][z] = aliveNeighbors === 6 ? 1 : 0;
                    if (nextGrid[x][y][z] === 1) {
                        let startPosition = getRandomPositionOutsideGrid();
                        let key = cellKey(x, y, z);
                        birthPositions[key] = startPosition;
                    }
                }
            }
        }
    }

    let temp = grid;
    grid = nextGrid;
    nextGrid = temp;
}

function drawGrid(t, mv) {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let prevState = prevGrid[x][y][z];
                let currState = grid[x][y][z];
                let scalingFactor = 0.0;
                let position = vec3(0, 0, 0);
                let key = cellKey(x, y, z);

                if (prevState === 1 && currState === 1) {
                    scalingFactor = 1.0;
                    position = vec3(
                        x - gridSize / 2,
                        y - gridSize / 2,
                        z - gridSize / 2
                    );
                } else if (prevState === 1 && currState === 0) {
                    let endPosition = deathPositions[key];
                    if (!endPosition) continue;
                    scalingFactor = 1.0 - t;
                    if (scalingFactor <= 0.0) continue;
                    position = mix(
                        vec3(
                            x - gridSize / 2,
                            y - gridSize / 2,
                            z - gridSize / 2
                        ),
                        endPosition,
                        t
                    );
                } else if (prevState === 0 && currState === 1) {
                    let startPosition = birthPositions[key];
                    if (!startPosition) continue;
                    scalingFactor = t;
                    if (scalingFactor <= 0.0) continue;
                    position = mix(
                        startPosition,
                        vec3(
                            x - gridSize / 2,
                            y - gridSize / 2,
                            z - gridSize / 2
                        ),
                        t
                    );
                }

                let mv1 = mv;
                mv1 = mult(mv1, translate(position));
                mv1 = mult(mv1, scalem(scalingFactor * 0.9, scalingFactor * 0.9, scalingFactor * 0.9));
                let mvp = mult(p, mv1);
                gl.uniformMatrix4fv(matrixLoc, false, flatten(mvp));
                gl.drawArrays(gl.TRIANGLES, 0, numVertices);
            }
        }
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    currTime = Date.now();
    p = perspective(45, canvas.width / canvas.height, 0.1, 100.0);
    let mv = mat4();
    mv = mult(mv, translate(0.0, 0.0, zoom));
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    if (currTime - lastUpdateTime >= 2500) {
        updateGrid();
        lastUpdateTime = currTime;
        animationStartTime = currTime;
        isAnimating = true;
    }

    if (isAnimating) {
        let timeSinceAnimationStart = currTime - animationStartTime;
        let t = timeSinceAnimationStart / animationDur;

        if (t >= 1.0) {
            t = 1.0;
            isAnimating = false;
        }

        drawGrid(t, mv);
    } else {
        drawGrid(1.0, mv);
    }

    requestAnimFrame(render);
}
