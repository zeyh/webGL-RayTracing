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
    this.appendGroundGrid();
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
    console.log("=====================")
    console.log("👋 hello from VBObox0 in initVBOwithShaders.js")
    console.log("vboStride in constructor: ", this.vboStride);
    console.log("FSIZE:    ", this.FSIZE);
    console.log("vboBytes: ", this.vboBytes);
    console.log("this.vboVerts: ", this.vboVerts);
    console.log("vboContents.length: ", this.vboContents.length);
    console.log("=====================")
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
        for (let i = 0; i < vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
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
        for (let i = 0; i < vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
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
    // We can either use the perspective() function, like this:
    /* mat4.perspective(camProj,             // out
              glMatrix.toRadian(90.0),  // fovy in radians 
              1.0,                      // aspect ratio width/height
              0.1,                      // znear
              100.0);                  // zfar
    */
    // or use the frustum() function, like this:
    mat4.frustum(camProj, -1.0, 1.0,    // left, right
        -1.0, 1.0,    // bottom, top
        1.0, 100.0);   // near, far

    var camView = mat4.create();
    mat4.lookAt(camView, gui.camEyePt, gui.camAimPt, gui.camUpVec);
    mat4.multiply(this.mvpMat, camProj, camView);
    // mvpMat now set for WORLD drawing axes.
    // Our ray-tracer's ground-plane grid is at z = zGrid = -5;
    var trans = vec3.fromValues(0, 0, -5);
    mat4.translate(this.mvpMat, this.mvpMat, trans);

    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat); 
};

/**
 * render current VBObox contents.
 */
VBObox0.prototype.draw = function () {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".draw() call you needed to call this.switchToMe()!!"
        );
    }
    gl.drawArrays(gl.LINES, 0, this.vboVerts);
};

/**
 *  Over-write current values in the GPU inside our already-created VBO
 */
VBObox0.prototype.reload = function () {
    gl.bufferSubData(
        gl.ARRAY_BUFFER, // GLenum target(same as 'bindBuffer()')
        0, // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents
    ); // the JS source-data array used to fill VBO
};
