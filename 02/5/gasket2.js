"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var vertices = [
        vec2( -1, -1 ),
        vec2( -1,  1 ),
        vec2(  1,  1 ),
        vec2(  1, -1 )

    ];

    divideSquare( vertices[0], vertices[1], vertices[2], vertices[3],
                    NumTimesToSubdivide);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );


    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}
function square(a, b, c , d){
    triangle(a, b, d);
    triangle(b, c, d)
}

function divideSquare(a, b, c, d, count) {

    if (count === 0) {
        square(a, b, c, d);
    } else {
        var ab = mix(a, b, 1/3);
        var ab2 = mix(a, b, 2/3);
        var bc = mix(b, c, 1/3);
        var bc2 = mix(b, c, 2/3);
        var cd = mix(c, d, 1/3);
        var cd2 = mix(c, d, 2/3);
        var da = mix(d, a, 1/3);
        var da2 = mix(d, a, 2/3);
        var center1 = vec2( da2[0], ab[1] );
        var center2 = vec2( da2[0], ab2[1] );
        var center3 = vec2( da[0], ab2[1] );
        var center4 = vec2( da[0], ab[1] );

        --count;

        
        divideSquare(a, ab, center1, da2, count);       
        divideSquare(ab, ab2, center2, center1, count); 
        divideSquare(ab2, b, bc, center2, count);      
        divideSquare(center2, bc, bc2, center3, count);  
        divideSquare(center3, bc2, c, cd, count);  
        divideSquare(center4, center3, cd, cd2, count); 
        divideSquare(da, center4, cd2, d, count);  
        divideSquare(da2, center1, center4, da, count); 
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
