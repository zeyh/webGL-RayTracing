/**
 * modified from JT_VBObox-lib.js
 */
"use strict";

/**
 * @param {string} vert_src vertex shader source code in glsl
 * @param {string} frag_src fragment shader source code in glsl
 * @param {Float32Array} vboContents initial Array of vertex attribute values including position and color  x,y,z,w; r,g,b,a stored in VBOinfo.js
 * @param {int} vboVerts the number of vertices now held in vboContents array
 * WebGLpreview: holds one VBO and its shaders
 */
function VBObox0(vert_src, frag_src, vboContents, vboVerts) {
    this.vert_src = vert_src;
    this.frag_src = frag_src;

    this.vboContents = vboContents;
    this.vboVerts = vboVerts;

    // ! draw each individual part of array
    this.bgnGrid = this.vboVerts;
    this.appendGroundGrid();
    this.bgnSphere = this.vboVerts;
    this.appendWireSphere();
    this.bgnCyl = this.vboVerts;
    this.appendWireCylinder(4);
    this.bgnCyl2 = this.vboVerts;
    this.appendWireCylinder(12, 0);

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT; // bytes req'd by 1 vboContents array element for vertexAttribPointer()
    this.vboBytes = this.vboContents.length * this.FSIZE; // total number of bytes stored in vboContents
    this.vboStride = this.vboBytes / this.vboVerts; // (== # of bytes to store one complete vertex).

    this.vboFcount_a_Position = 4; //x,y,z,w
    this.vboFcount_a_Color = 4; // r,g,b,a
    console.assert(
        (this.vboFcount_a_Position + // check the size of each and
            this.vboFcount_a_Color) * // every attribute in our VBO
            this.FSIZE ==
            this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!"
    );

    // * Attribute offsets
    this.vboOffset_a_Position = 0; // # of bytes from START of vbo to the START of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = this.vboFcount_a_Position * this.FSIZE; // (4 floats * bytes/float)

    // * GPU memory locations:
    this.vboLoc;
    this.shaderLoc;

    // * Attribute locations in our shaders:
    this.a_PositionLoc;
    this.a_ColorLoc;

    // * glMatrix.js:
    this.mvpMat = mat4.create(); // Transforms CVV axes to model axes.
    this.u_mvpMatLoc; // GPU location for u_ModelMat uniform
}

/**
 * print vbo info for debugging
 */
VBObox0.prototype.print = function () {
    console.log("=====================");
    console.log("👋 hello from VBObox0 in initVBOwithShaders.js");
    console.log("vboStride in constructor: ", this.vboStride);
    console.log("FSIZE:    ", this.FSIZE);
    console.log("vboBytes: ", this.vboBytes);
    console.log("this.vboVerts: ", this.vboVerts);
    console.log("vboContents.length: ", this.vboContents.length);
    console.log("=====================");
};

/**
 * Create a set of vertices for an x,y grid of colored lines in the z=0 plane
 * Append the contents of vertSet[] to existing contents of the this.vboContents array
 * update this.vboVerts to include these new verts for drawing.
 */
VBObox0.prototype.appendGroundGrid = function () {
    this.xyMax = 50.0; // grid size; extends to cover +/-xyMax in x and y.
    this.xCount = 101; // # of lines of constant-x to draw to make the grid
    this.yCount = 101; // # of lines of constant-y to draw to make the grid

    var vertsPerLine = 8; // x,y,z,w;  r,g,b,a values.
    this.floatsPerVertex = 8;

    var vertCount = (this.xCount + this.yCount) * vertsPerLine;
    var vertSet = new Float32Array(vertCount * this.floatsPerVertex);

    this.xBgnColr = vec4.fromValues(1.0, 0.0, 0.0, 1.0); // Red
    this.xEndColr = vec4.fromValues(0.0, 1.0, 1.0, 1.0); // Cyan
    this.yBgnColr = vec4.fromValues(0.0, 1.0, 0.0, 1.0); // Green
    this.yEndColr = vec4.fromValues(1.0, 0.0, 1.0, 1.0); // Magenta

    // Compute how much the color changes between 1 line and the next:
    var xColrStep = vec4.create(); // [0,0,0,0]
    var yColrStep = vec4.create();
    vec4.subtract(xColrStep, this.xEndColr, this.xBgnColr); // End - Bgn
    vec4.subtract(yColrStep, this.yEndColr, this.yBgnColr);
    vec4.scale(xColrStep, xColrStep, 1.0 / (this.xCount - 1)); // scale by # of lines
    vec4.scale(yColrStep, yColrStep, 1.0 / (this.yCount - 1));

    // Local vars for vertex-making loops-------------------
    var xgap = (2 * this.xyMax) / (this.xCount - 1); // Spacing between lines in x,y;
    var ygap = (2 * this.xyMax) / (this.yCount - 1); // (why 2*xyMax? grid spans +/- xyMax).
    var xNow; // x-value of the current line we're drawing
    var yNow; // y-value of the current line we're drawing.
    var line = 0; // line-number (we will draw xCount or yCount lines, each made of vertsPerLine vertices),
    var v = 0; // vertex-counter, used for the entire grid;
    var idx = 0; // vertSet[] array index.
    var colrNow = vec4.create(); // color of the current line we're drawing.

    // 1st BIG LOOP: makes all lines of constant-x
    for (line = 0; line < this.xCount; line++) {
        // for every line of constant x,
        colrNow = vec4.scaleAndAdd(
            // find the color of this line,
            colrNow,
            this.xBgnColr,
            xColrStep,
            line
        );
        xNow = -this.xyMax + line * xgap; // find the x-value of this line,
        for (
            let i = 0;
            i < vertsPerLine;
            i++, v++, idx += this.floatsPerVertex
        ) {
            // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
            // and store them sequentially in vertSet[] array.
            // We already know  xNow; find yNow:
            switch (
                i // find y coord value for each vertex in this line:
            ) {
                case 0:
                    yNow = -this.xyMax;
                    break; // start of 1st line-segment;
                case 1: // end of 1st line-segment, and
                case 2:
                    yNow = -this.xyMax / 2;
                    break; // start of 2nd line-segment;
                case 3: // end of 2nd line-segment, and
                case 4:
                    yNow = 0.0;
                    break; // start of 3rd line-segment;
                case 5: // end of 3rd line-segment, and
                case 6:
                    yNow = this.xyMax / 2;
                    break; // start of 4th line-segment;
                case 7:
                    yNow = this.xyMax;
                    break; // end of 4th line-segment.
                default:
                    console.log(
                        "VBObox0.appendGroundGrid() !ERROR! **X** line out-of-bounds!!\n\n"
                    );
                    break;
            } // set all values for this vertex:
            vertSet[idx] = xNow; // x value
            vertSet[idx + 1] = yNow; // y value
            vertSet[idx + 2] = 0.0; // z value
            vertSet[idx + 3] = 1.0; // w;
            vertSet[idx + 4] = colrNow[0]; // r
            vertSet[idx + 5] = colrNow[1]; // g
            vertSet[idx + 6] = colrNow[2]; // b
            vertSet[idx + 7] = colrNow[3]; // a;
        }
    }
    // 2nd BIG LOOP: makes all lines of constant-y
    for (line = 0; line < this.yCount; line++) {
        // for every line of constant y,
        colrNow = vec4.scaleAndAdd(
            // find the color of this line,
            colrNow,
            this.yBgnColr,
            yColrStep,
            line
        );
        yNow = -this.xyMax + line * ygap; // find the y-value of this line,
        for (
            let i = 0;
            i < vertsPerLine;
            i++, v++, idx += this.floatsPerVertex
        ) {
            // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
            // and store them sequentially in vertSet[] array.
            // We already know  yNow; find xNow:
            switch (
                i // find y coord value for each vertex in this line:
            ) {
                case 0:
                    xNow = -this.xyMax;
                    break; // start of 1st line-segment;
                case 1: // end of 1st line-segment, and
                case 2:
                    xNow = -this.xyMax / 2;
                    break; // start of 2nd line-segment;
                case 3: // end of 2nd line-segment, and
                case 4:
                    xNow = 0.0;
                    break; // start of 3rd line-segment;
                case 5: // end of 3rd line-segment, and
                case 6:
                    xNow = this.xyMax / 2;
                    break; // start of 4th line-segment;
                case 7:
                    xNow = this.xyMax;
                    break; // end of 4th line-segment.
                default:
                    console.log(
                        "VBObox0.appendGroundGrid() !ERROR! **Y** line out-of-bounds!!\n\n"
                    );
                    break;
            } // Set all values for this vertex:
            vertSet[idx] = xNow; // x value
            vertSet[idx + 1] = yNow; // y value
            vertSet[idx + 2] = 0.0; // z value
            vertSet[idx + 3] = 1.0; // w;
            vertSet[idx + 4] = colrNow[0]; // r
            vertSet[idx + 5] = colrNow[1]; // g
            vertSet[idx + 6] = colrNow[2]; // b
            vertSet[idx + 7] = colrNow[3]; // a;
        }
    }

    // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
    var tmp = new Float32Array(this.vboContents.length + vertSet.length);
    tmp.set(this.vboContents, 0); // copy old VBOcontents into tmp, and
    tmp.set(vertSet, this.vboContents.length); // copy new vertSet just after it.
    this.vboVerts += vertCount; // find number of verts in both.
    this.vboContents = tmp; // REPLACE old vboContents with tmp
};

/**
 * @param {NScount} int number of sides of sphere subdivision, that must >= 3 [default 13]
 * Create a set of vertices to draw grid of colored lines that form a sphere of radius 1, centered at x=y=z=0
 * Append the contents of vertSet[] to existing contents of the this.vboContents
 * update this.vboVerts
 */
VBObox0.prototype.appendWireSphere = function (NScount) {
    if (NScount == undefined) NScount = 13; // default value.
    if (NScount < 3) NScount = 3; // enforce minimums
    let EWcount = 2 * NScount;

    var vertCount = 2 * EWcount * NScount;
    var vertSet = new Float32Array(vertCount * this.floatsPerVertex);
    this.EWbgnColr = vec4.fromValues(1.0, 0.5, 0.0, 1.0); // Orange
    this.EWendColr = vec4.fromValues(0.0, 0.5, 1.0, 1.0); // Cyan
    this.NSbgnColr = vec4.fromValues(1.0, 1.0, 1.0, 1.0); // White
    this.NSendColr = vec4.fromValues(0.0, 1.0, 0.5, 1.0); // White

    // Compute how much the color changes between 1 arc (or ring) and the next:
    var EWcolrStep = vec4.create(); // [0,0,0,0]
    var NScolrStep = vec4.create();

    vec4.subtract(EWcolrStep, this.EWendColr, this.EWbgnColr); // End - Bgn
    vec4.subtract(NScolrStep, this.NSendColr, this.NSbgnColr);
    vec4.scale(EWcolrStep, EWcolrStep, 2.0 / (EWcount - 1)); // double-step for arc colors
    vec4.scale(NScolrStep, NScolrStep, 1.0 / (NScount - 1)); // single-step for ring colors

    var EWgap = 1.0 / (EWcount - 1); // vertex spacing in each ring of constant NS
    var NSgap = 1.0 / (NScount - 1); // vertex spacing in each North-South arc
    var EWint = 0; // east/west integer (0 to EWcount) for current vertex,
    var NSint = 0; // north/south integer (0 to NScount) for current vertex.
    var v = 0; // vertex-counter, used for the entire sphere;
    var idx = 0; // vertSet[] array index.
    var pos = vec4.create(); // vertex position.
    var colrNow = vec4.create(); // color of the current arc or ring.

    for (NSint = 0; NSint < NScount; NSint++) {
        colrNow = vec4.scaleAndAdd(colrNow, this.NSbgnColr, NScolrStep, NSint);
        for (
            EWint = 0;
            EWint < EWcount;
            EWint++, v++, idx += this.floatsPerVertex
        ) {
            this.polar2xyz(
                pos, // vec4 that holds vertex position in world-space x,y,z;
                EWint * EWgap, // normalized East/west longitude (from 0 to 1)
                NSint * NSgap
            ); // normalized North/South lattitude (from 0 to 1)
            vertSet[idx] = pos[0]; // x value
            vertSet[idx + 1] = pos[1]; // y value
            vertSet[idx + 2] = pos[2]; // z value
            vertSet[idx + 3] = 1.0; // w (it's a point, not a vector)
            vertSet[idx + 4] = colrNow[0]; // r
            vertSet[idx + 5] = colrNow[1]; // g
            vertSet[idx + 6] = colrNow[2]; // b
            vertSet[idx + 7] = colrNow[3]; // a;
        }
    }

    for (EWint = 0; EWint < EWcount; EWint++) {
        // for every arc of constant EWfrac,
        if (EWint < EWcount / 2) {
            // color INCREASES for first hemisphere of arcs:
            colrNow = vec4.scaleAndAdd(
                colrNow,
                this.EWbgnColr,
                EWcolrStep,
                EWint
            );
        } else {
            // color DECREASES for second hemisphere of arcs:
            colrNow = vec4.scaleAndAdd(
                colrNow,
                this.EWbgnColr,
                EWcolrStep,
                EWcount - EWint
            );
        }
        for (
            NSint = 0;
            NSint < NScount;
            NSint++, v++, idx += this.floatsPerVertex
        ) {
            // for every vertex in this arc, find x,y,z,w;  r,g,b,a;
            // and store them sequentially in vertSet[] array.
            // Find vertex position from normalized lattitude & longitude:
            this.polar2xyz(
                pos, // vec4 that holds vertex position in world-space x,y,z;
                EWint * EWgap, // normalized East/west longitude (from 0 to 1)
                NSint * NSgap
            ); // normalized North/South lattitude (from 0 to 1)
            vertSet[idx] = pos[0]; // x value
            vertSet[idx + 1] = pos[1]; // y value
            vertSet[idx + 2] = pos[2]; // z value
            vertSet[idx + 3] = 1.0; // w (it's a point, not a vector)
            vertSet[idx + 4] = colrNow[0]; // r
            vertSet[idx + 5] = colrNow[1]; // g
            vertSet[idx + 6] = colrNow[2]; // b
            vertSet[idx + 7] = colrNow[3]; // a;
        }
    }

    var tmp = new Float32Array(this.vboContents.length + vertSet.length);
    tmp.set(this.vboContents, 0); // copy old VBOcontents into tmp, and
    tmp.set(vertSet, this.vboContents.length); // copy new vertSet just after it.
    this.vboVerts += vertSet.length / this.floatsPerVertex; // find number of verts in both.
    this.vboContents = tmp; // REPLACE old vboContents with tmp
};

/**
 * @param {sideNumber} int number of sides that must be >= 2 [default 6]
 * @param {topRadius} float radius of top that must be [>= 0] [default 1]
 * Create a set of vertices to draw grid of colored lines that form a Cylinder
 * Append the contents of vertSet[] to existing contents of the this.vboContents
 * update this.vboVerts
 * ref from 351-1 basicShapes.js
 */
VBObox0.prototype.appendWireCylinder = function (sideNumber, topRadius) {
    var topColr = new Float32Array([0.8, 0.8, 0.0, 1.0]); // light yellow top,
    var walColr = new Float32Array([0.2, 0.6, 0.2, 1.0]); // dark green walls,
    var botColr = new Float32Array([0.2, 0.3, 0.7, 1.0]); // light blue bottom,
    var ctrColr = new Float32Array([0.1, 0.1, 0.1, 1.0]); // near black end-cap centers,
    var errColr = new Float32Array([1.0, 0.2, 0.2, 1.0]); // Bright-red trouble color.

    var capVerts = sideNumber == undefined || sideNumber < 2 ? 6 : sideNumber; // # of vertices around the topmost 'cap' of the shape
    var topRadius = topRadius == undefined || topRadius < 0 ? 1 : topRadius; // radius of top of cylinder (bottom is always 1.0)

    let cylVerts = new Float32Array((capVerts * 6 - 2) * this.floatsPerVertex);
    for (v = 0, j = 0; v < 2 * capVerts - 1; v++, j += this.floatsPerVertex) {
        // START at vertex v = 0; on x-axis on end-cap's outer edge, at xyz = 1,0,-1.
        // END at the vertex 2*(capVerts-1), the last outer-edge vertex before
        // we reach the starting vertex at 1,0,-1.
        if (v % 2 == 0) {
            cylVerts[j] = Math.cos((Math.PI * v) / capVerts); // x
            cylVerts[j + 1] = Math.sin((Math.PI * v) / capVerts); // y
            cylVerts[j + 2] = -1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            cylVerts[j + 4] = botColr[0]; //r
            cylVerts[j + 5] = botColr[1]; //g
            cylVerts[j + 6] = botColr[2]; //b
            cylVerts[j + 7] = botColr[3]; //a
        } else {
            // put odd# vertices at center of cylinder's bottom cap:
            cylVerts[j] = 0.0; // x,y,z,w == 0,0,-1,1; centered on z axis at -1.
            cylVerts[j + 1] = 0.0;
            cylVerts[j + 2] = -1.0;
            cylVerts[j + 3] = 1.0; // r,g,b,a = ctrColr[]
            cylVerts[j + 4] = ctrColr[0];
            cylVerts[j + 5] = ctrColr[1];
            cylVerts[j + 6] = ctrColr[2];
            cylVerts[j + 7] = ctrColr[3];
        }
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    // START with the vertex at 1,0,-1 (completes the cylinder's bottom cap;
    // completes the 'transition edge' drawn in blue in lecture notes).
    for (v = 0; v < 2 * capVerts; v++, j += this.floatsPerVertex) {
        if (v % 2 == 0) {
            // count verts from zero again,
            // and put all even# verts along outer edge of bottom cap:
            cylVerts[j] = Math.cos((Math.PI * v) / capVerts); // x
            cylVerts[j + 1] = Math.sin((Math.PI * v) / capVerts); // y
            cylVerts[j + 2] = -1.0; // ==z  BOTTOM cap,
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = walColr[]
            cylVerts[j + 4] = walColr[0];
            cylVerts[j + 5] = walColr[1];
            cylVerts[j + 6] = walColr[2];
            cylVerts[j + 7] = walColr[3];
            if (v == 0) {
                // UGLY TROUBLESOME vertex--shares its 1 color with THREE
                // triangles; 1 in cap, 1 in step, 1 in wall.
                cylVerts[j + 4] = errColr[0];
                cylVerts[j + 5] = errColr[1];
                cylVerts[j + 6] = errColr[2];
                cylVerts[j + 7] = errColr[3];
            }
        } // position all odd# vertices along the top cap (not yet created)
        else {
            cylVerts[j] = topRadius * Math.cos((Math.PI * (v - 1)) / capVerts); // x
            cylVerts[j + 1] =
                topRadius * Math.sin((Math.PI * (v - 1)) / capVerts); // y
            cylVerts[j + 2] = 1.0; // == z TOP cap,
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = walColr;
            cylVerts[j + 4] = walColr[0];
            cylVerts[j + 5] = walColr[1];
            cylVerts[j + 6] = walColr[2];
            cylVerts[j + 4] = walColr[3];
        }
    }
    // Complete the cylinder with its top cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements.
    for (v = 0; v < 2 * capVerts - 1; v++, j += this.floatsPerVertex) {
        // count vertices from zero again, and
        if (v % 2 == 0) {
            // position even #'d vertices around top cap's outer edge.
            cylVerts[j] = topRadius * Math.cos((Math.PI * v) / capVerts); // x
            cylVerts[j + 1] = topRadius * Math.sin((Math.PI * v) / capVerts); // y
            cylVerts[j + 2] = 1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = topColr[]
            cylVerts[j + 4] = topColr[0];
            cylVerts[j + 5] = topColr[1];
            cylVerts[j + 6] = topColr[2];
            cylVerts[j + 7] = topColr[3];
            if (v == 0) {
                // UGLY TROUBLESOME vertex--shares its 1 color with THREE
                // triangles; 1 in cap, 1 in step, 1 in wall.
                cylVerts[j + 4] = errColr[0];
                cylVerts[j + 5] = errColr[1];
                cylVerts[j + 6] = errColr[2];
                cylVerts[j + 7] = errColr[3];
            }
        } else {
            // position odd#'d vertices at center of the top cap:
            cylVerts[j] = 0.0; // x,y,z,w == 0,0,-1,1
            cylVerts[j + 1] = 0.0;
            cylVerts[j + 2] = 1.0;
            cylVerts[j + 3] = 1.0;
            // r,g,b = topColr[]
            cylVerts[j + 4] = ctrColr[0];
            cylVerts[j + 5] = ctrColr[1];
            cylVerts[j + 6] = ctrColr[2];
            cylVerts[j + 7] = ctrColr[3];
        }
    }

    var tmp = new Float32Array(this.vboContents.length + cylVerts.length);
    tmp.set(this.vboContents, 0); // copy old VBOcontents into tmp, and
    tmp.set(cylVerts, this.vboContents.length); // copy new vertSet just after it.
    this.vboVerts += cylVerts.length / this.floatsPerVertex; // find number of verts in both.
    this.vboContents = tmp; // REPLACE old vboContents with tmp
};

/**
 * link shaders and save GPU locations
 */
VBObox0.prototype.init = function () {
    // * Compile,link,upload shaders
    this.shaderLoc = createProgram(gl, this.vert_src, this.frag_src);
    if (!this.shaderLoc) {
        console.log(
            this.constructor.name +
                ".init() failed to create executable Shaders on the GPU. Bye!"
        );
        return;
    }

    gl.program = this.shaderLoc; // (to match cuon-utils.js -- initShaders())

    // * fill VBO on GPU
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(
            this.constructor.name + ".init() failed to create VBO in GPU. Bye!"
        );
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

    // * Find All Attributes
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, "a_Position");
    if (this.a_PositionLoc < 0) {
        console.log(
            this.constructor.name +
                ".init() Failed to get GPU location of attribute a_Position"
        );
        return -1; // error exit.
    }
    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, "a_Color");
    if (this.a_ColorLoc < 0) {
        console.log(
            this.constructor.name +
                ".init() failed to get the GPU location of attribute a_Color"
        );
        return -1; // error exit.
    }
    this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, "u_mvpMat");
    if (!this.u_mvpMatLoc) {
        console.log(
            this.constructor.name +
                ".init() failed to get GPU location for u_mvpMat uniform"
        );
        return;
    }
};

/**
 *  tell the GPU to use our VBObox's shader program, VBO, connect the shader program's attributes
 */
VBObox0.prototype.switchToMe = function () {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer(
        this.a_PositionLoc,
        this.vboFcount_a_Position,
        gl.FLOAT,
        false,
        this.vboStride,
        this.vboOffset_a_Position
    );
    gl.vertexAttribPointer(
        this.a_ColorLoc,
        this.vboFcount_a_Color,
        gl.FLOAT,
        false,
        this.vboStride,
        this.vboOffset_a_Color
    );
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
};

/**
 * sanity check
 * @return {boolean} true if our WebGL rendering context ('gl') is ready to render using this objects VBO and shader program
 */
VBObox0.prototype.isReady = function () {
    var isOK = true;
    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(
            this.constructor.name +
                ".isReady() false: shader program at this.shaderLoc not in use!"
        );
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(
            this.constructor.name +
                ".isReady() false: vbo at this.vboLoc not in use!"
        );
        isOK = false;
    }
    return isOK;
};

/**
 *  adjust camera positions
 */
VBObox0.prototype.adjust = function () {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".adjust() call you needed to call this.switchToMe()!!"
        );
    }

    var camProj = mat4.create();
    mat4.perspective(
        camProj,
        glMatrix.toRadian(gui.camFovy),
        gui.camAspect,
        gui.camNear,
        gui.camFar
    );
    // mat4.frustum(camProj, -1.0, 1.0, -1.0, 1.0, 1.0, 100.0);
    var camView = mat4.create();
    mat4.lookAt(camView, gui.camEyePt, gui.camAimPt, gui.camUpVec);
    mat4.multiply(this.mvpMat, camProj, camView);

    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
};

/**
 * render current VBObox contents.
 */
VBObox0.prototype.draw = function (g_SceneNum) {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".draw() call you needed to call this.switchToMe()!!"
        );
    }
    // ! draw grid and axis
    var tmp = mat4.create();
    mat4.copy(tmp, this.mvpMat); // SAVE world-space coordinate transform
    gl.drawArrays(gl.LINES, 0, this.bgnSphere);
    switch(g_SceneNum) {
        case 0:
            // * draw sphere
            var tmp = mat4.create();
            mat4.copy(tmp, this.mvpMat);
            mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1.8, 1.8, 1.8));
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-0.5, 2, 2.0));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
            mat4.copy(this.mvpMat, tmp);
            gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.bgnCyl - this.bgnSphere);


            // * draw sphere
            var tmp = mat4.create();
            mat4.copy(tmp, this.mvpMat);
            mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1, 1, 1));
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2, 1, 1.0));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
            mat4.copy(this.mvpMat, tmp);
            gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.bgnCyl - this.bgnSphere);

            // * draw sphere
            var tmp = mat4.create();
            mat4.copy(tmp, this.mvpMat);
            mat4.rotate(this.mvpMat, this.mvpMat, -0.8*Math.PI, vec3.fromValues(0,0,1));
            mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.3, 1, 0.3));
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(4, 3, 3));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
            mat4.copy(this.mvpMat, tmp);
            gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.bgnCyl - this.bgnSphere);

            // * draw sphere
            var tmp = mat4.create();
            mat4.copy(tmp, this.mvpMat);
            mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 2));
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-5, 1.2, 1.0));
            mat4.rotate(this.mvpMat, this.mvpMat, -0.8*Math.PI, vec3.fromValues(0,0,1));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
            mat4.copy(this.mvpMat, tmp);
            gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.bgnCyl - this.bgnSphere);

            break;
        case 1:
            // ! draw model objects
            // * draw sphere
            var tmp = mat4.create();
            mat4.copy(tmp, this.mvpMat);
            // mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.0, 1.0, 1.3));
            // mat4.rotate(this.mvpMat,this.mvpMat,0.25 * Math.PI,vec3.fromValues(1, 0, 0));
            // mat4.rotate(this.mvpMat,this.mvpMat,0.25 * Math.PI,vec3.fromValues(0, 0, 1));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
            mat4.copy(this.mvpMat, tmp);
            gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.bgnCyl - this.bgnSphere);

            // * draw cylinder 1 - cube
            mat4.copy(this.mvpMat, tmp); 
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.2, 1.4, 1.0));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat); 
            mat4.copy(this.mvpMat, tmp); 
            gl.drawArrays(gl.LINE_STRIP,this.bgnCyl, this.bgnCyl2 - this.bgnCyl); 

            // * draw cylinder 2 - cone
            mat4.copy(this.mvpMat, tmp); 
            mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.5, 1.2, 1.0));
            mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1.0, 0.5, 1.0));
            gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat); 
            mat4.copy(this.mvpMat, tmp); 
            gl.drawArrays(gl.LINE_STRIP,this.bgnCyl2, this.vboVerts - this.bgnCyl2); 

            mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
            break;
        default:
            console.log(
                "JT_tracer0-Scene file: CScene.initScene(",
                g_SceneNum,
                ") NOT YET IMPLEMENTED."
            );
            this.draw(0); // init the default scene.
            break;
    }
};

/**
 *  Over-write current values in the GPU inside our already-created VBO
 */
VBObox0.prototype.reload = function () {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vboContents); 
};

/**
 *  Set the vec4 argument 'out4' to the 3D point on the unit sphere described by normalized longitude and lattitude angles: 0 <= fracEW, fracNS <= 1.
 */
VBObox0.prototype.polar2xyz = function (out4, fracEW, fracNS) {
    var sEW = Math.sin(2.0 * Math.PI * fracEW);
    var cEW = Math.cos(2.0 * Math.PI * fracEW);
    var sNS = Math.sin(Math.PI * fracNS);
    var cNS = Math.cos(Math.PI * fracNS);
    vec4.set(
        out4,
        cEW * sNS, // x = cos(EW)sin(NS);
        sEW * sNS, // y = sin(EW)sin(NS);
        cNS,
        1.0
    ); // z =        cos(NS); w=1.0  (point, not vec)
};
