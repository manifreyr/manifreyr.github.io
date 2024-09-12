var canvas;
var gl;
var program;

var vertices = [];
var mouseX;             
var movement = false; 

var shots = [];
var shot = [
    vec2(-0.005, 0),
    vec2(0.005, 0),
    vec2(-0.005, -0.05),
    vec2(0.005, 0),
    vec2(0.005, -0.05),
    vec2(-0.005, -0.05)
]
var birds = [];
var bird = [
    vec2(-0.1, 0.07),
    vec2(0.1, 0.07),
    vec2(-0.1, -0.07),
    vec2(0.1, 0.07),
    vec2(-0.1, -0.07),
    vec2(0.1, -0.07),
]

var gun = [
    vec2(-0.1, -0.95),
    vec2(-0.5, -0.95),
    vec2(-0.3, -0.8)
];

let score = 0;
var point = [
    vec2(0, 0),
    vec2(0, -0.1),
    vec2(0.02, 0),
    vec2(0, -0.1),
    vec2(0.02, 0),
    vec2(0.02, -0.1)
];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    canvas.addEventListener("mousedown", function(e){
        movement = true;
        mouseX = e.offsetX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2*(e.offsetX - mouseX)/canvas.width;
            mouseX = e.offsetX;
            for(i=0; i<3; i++) {
                gun[i][0] += xmove;
            }
        }
    } );
    
    window.addEventListener("keydown", function(event) {
        if (event.code === "Space") {
            if(shots.length < 6){
            shots.push(vec2(gun[2][0], gun[2][1]));
            }
        }
    });

    initialize();
    render();
}

function initialize(){
    for(var i = 0; i < 7; i++) {
        var birdY = Math.random() * 0.75;
        var birdSpeed = (Math.random() * 0.007) + 0.002;
        let birdX = 1.10;
        if (Math.random() > 0.5){
            birdSpeed = -birdSpeed;
        } 
        if (birdSpeed > 0) {
            birdX = -1.10;
        }
        birds.push(vec3(birdX, birdY, birdSpeed));
    }
}

function drawAll() {
    vertices = [];

    for (var i = 0; i < birds.length; i++) {
        var birdX = birds[i][0];
        var birdY = birds[i][1];
      
        for (var j = 0; j < bird.length; j++) {
            vertices.push(vec2(birdX + bird[j][0], birdY + bird[j][1]));
        }
    }

    for (var i = 0; i < gun.length; i++) {
        vertices.push(gun[i]);
    }

    for (var i = 0; i < shots.length; i++) {
        for (var j = 0; j < shot.length; j++) {
            vertices.push(vec2(shots[i][0] + shot[j][0], shots[i][1] + shot[j][1]));
        }
    }

    for (var i = 0; i < score; i++) {
        for (var j = 0; j < point.length; j++) {
            vertices.push(vec2(-0.95 + point[j][0] + (i % 5) * 0.04, 0.95 + point[j][1]));
        }
    }

    var positionBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

}

function updateAll(){

    for (var i = 0; i < birds.length; i++) {
        birds[i][0] += birds[i][2];
        if (birds[i][0] < -1.1) {
            birds[i][0] = 1.1;
        } else if (birds[i][0] > 1.1) {
            birds[i][0] = -1.1;
        }
    }

    for (var i = shots.length - 1; i >= 0; i--) {
        shots[i][1] += 0.01;

        if (shots[i][1] >= 1.1) {
            shots.splice(i, 1);
        }
    }

    for (var i = shots.length - 1; i >= 0; i--) {
        for (var j = birds.length - 1; j >= 0; j--) {
            var dx = Math.abs(shots[i][0] - birds[j][0]);
            var dy = Math.abs(shots[i][1] - birds[j][1]);

            if (dx <= 0.07 && dy <= 0.1) {
                score++;
                shots.splice(i, 1);
                birds.splice(j, 1);
                break;
            }
        }
    }

}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    if(score < 5){
        updateAll();
        drawAll();
    }
    gl.drawArrays( gl.TRIANGLES, 0, vertices.length);

    window.requestAnimFrame(render);
    console.log(flatten(vertices));
}
