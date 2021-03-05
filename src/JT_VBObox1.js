/**
 * modified from JT_VBObox-lib.js
 */
"use strict";

/**
 * @param {string} vert_src vertex shader source code in glsl
 * @param {string} frag_src fragment shader source code in glsl
 * @param {Float32Array} vboContents initial Array of vertex attribute values including position and color  x,y,z,w; r,g,b,a stored in VBOinfo.js
 * @param {int} vboVerts the number of vertices now held in vboContents array
 * for displaying the ray-tracing results.
 */
function VBObox1(vert_src, frag_src, vboContents, vboVerts) {
    this.VERT_SRC = vert_src;
    this.FRAG_SRC = frag_src;

    this.vboContents = vboContents;
    this.vboVerts = vboVerts;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT; // bytes req'd by 1 vboContents array element for vertexAttribPointer()
    this.vboBytes = this.vboContents.length * this.FSIZE; // total number of bytes stored in vboContents
    this.vboStride = this.vboBytes / this.vboVerts; // (== # of bytes to store one complete vertex).

    this.vboFcount_a_Position = 2; //x,y values
    this.vboFcount_a_TexCoord = 2; //r,g,b values
    console.assert(
        (this.vboFcount_a_Position + // check the size of each and
            this.vboFcount_a_TexCoord) * // every attribute in our VBO
            this.FSIZE ==
            this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!"
    );

    // * Attribute offsets
    this.vboOffset_a_Position = 0; // # of bytes from START of vbo to the START of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_TexCoord = this.vboFcount_a_Position * this.FSIZE; // (4 floats * bytes/float)

    // * GPU memory locations:
    this.vboLoc;
    this.shaderLoc;

    // * Attribute locations in our shaders:
    this.a_PositionLoc;
    this.a_TexCoordLoc;
    this.u_TextureLoc; // GPU location for texture map (image)
    this.u_SamplerLoc; // GPU location for texture sampler
}

/**
 * link shaders and save GPU locations
 */
VBObox1.prototype.init = function () {
    // * Compile,link,upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(
            this.constructor.name +
                ".init() failed to create executable Shaders on the GPU. Bye!"
        );
        return;
    }

    gl.program = this.shaderLoc;

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

    // * Make/Load Texture Maps & Samplers
    this.u_TextureLoc = gl.createTexture();
    if (!this.u_TextureLoc) {
        console.log(
            this.constructor.name +
                ".init() Failed to create the texture object on the GPU"
        );
        return -1; // error exit.
    }
    var u_SamplerLoc = gl.getUniformLocation(this.shaderLoc, "u_Sampler");
    if (!u_SamplerLoc) {
        console.log(
            this.constructor.name +
                ".init() Failed to find GPU location for texture u_Sampler"
        );
        return -1; // error exit.
    }
    g_myPic.setTestPattern(0); // 0 == colorful 'L' shape. 1 == all orange.

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.u_TextureLoc);
    gl.texImage2D(
        gl.TEXTURE_2D, //  'target'--the use of this texture
        0, //  MIP-map level (default: 0)
        gl.RGB, // GPU's data format (RGB? RGBA? etc)
        g_myPic.xSiz, // texture image width in pixels
        g_myPic.ySiz, // texture image height in pixels.
        0, // byte offset to start of data
        gl.RGB, // source/input data format (RGB? RGBA?)
        gl.UNSIGNED_BYTE, // data type for each color channel
        g_myPic.iBuf
    ); // 8-bit RGB image data source.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(this.u_SamplerLoc, 0); // Set the texture unit 0 to be driven by our texture sampler:

    // * find all attributes
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, "a_Position");
    if (this.a_PositionLoc < 0) {
        console.log(
            this.constructor.name +
                ".init() Failed to get GPU location of attribute a_Position"
        );
        return -1; // error exit.
    }
    this.a_TexCoordLoc = gl.getAttribLocation(this.shaderLoc, "a_TexCoord");
    if (this.a_TexCoordLoc < 0) {
        console.log(
            this.constructor.name +
                ".init() failed to get the GPU location of attribute a_TexCoord"
        );
        return -1; // error exit.
    }
};

/**
 *  tell the GPU to use our VBObox's shader program, VBO, connect the shader program's attributes
 */
VBObox1.prototype.switchToMe = function () {
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
        this.a_TexCoordLoc,
        this.vboFcount_a_TexCoord,
        gl.FLOAT,
        false,
        this.vboStride,
        this.vboOffset_a_TexCoord
    );
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_TexCoordLoc);
};

/**
 * sanity check
 * @return {boolean} true if our WebGL rendering context ('gl') is ready to render using this objects VBO and shader program
 */
VBObox1.prototype.isReady = function () {
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
VBObox1.prototype.adjust = function () {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".adjust() call you needed to call this.switchToMe()!!"
        );
    }
};

/**
 * render current VBObox contents.
 */
VBObox1.prototype.draw = function () {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".draw() call you needed to call this.switchToMe()!!"
        );
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts);
};

/**
 *  Over-write current values in the GPU inside our already-created VBO
 */
VBObox1.prototype.reload = function () {
    if (this.isReady() == false) {
        console.log(
            "ERROR! before" +
                this.constructor.name +
                ".reload() call you needed to call this.switchToMe()!!"
        );
    }
    gl.bufferSubData(
        gl.ARRAY_BUFFER, // GLenum target(same as 'bindBuffer()')
        0, // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents
    ); // the JS source-data array used to fill VBO
    gl.texSubImage2D(
        gl.TEXTURE_2D, //  'target'--the use of this texture
        0, //  MIP-map level (default: 0)
        0,
        0, // xoffset, yoffset (shifts the image)
        g_myPic.xSiz, // image width in pixels,
        g_myPic.ySiz, // image height in pixels,
        gl.RGB, // source/input data format (RGB? RGBA?)
        gl.UNSIGNED_BYTE, // data type for each color channel
        g_myPic.iBuf
    ); // texture-image data source.
};

/**
 * print vbo info for debugging
 */
VBObox1.prototype.print = function () {
    console.log("=====================");
    console.log("👋 hello from VBObox1 in initVBOwithRayTracing.js");
    console.log("vboStride in constructor: ", this.vboStride);
    console.log("FSIZE:    ", this.FSIZE);
    console.log("vboBytes: ", this.vboBytes);
    console.log("this.vboVerts: ", this.vboVerts);
    console.log("vboContents.length: ", this.vboContents.length);
    console.log("=====================");
};
