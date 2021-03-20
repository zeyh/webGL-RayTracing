/*
Feb 21, 2021
References: besides the inline links, the code is modified from 
    [Textbook] n/a
    [Canvas Starter Code] for 351-2: JT_GUIbox-Lib.js, JT_VBObox-Lib, Week01_LineGrid.js,
        main.js is modified from **Week01_LineGrid.js**
    [Previous projects] ProjectA from 351-2
*/
/*
    Done: basic GUIbox
    Done: basic VBO box
    [15]Done: vbo box of line grid showing on screen
    [5]Done: 2 view ports and basic viewing control
    [5]Done: Ray-traced result that exactly matches the WebGL preview.
    [5]Done: camera setLookAt rayPerspective() and rayFrustum()
    Done: Add a grid-plane-like flat disk and/or a sphere 
    Done: CGeom: rayLoadIdentity(), rayTranslate(), rayRotate(), rayScale(), worldRay2model transform matrix & squash a object
    [7]Done: user-adjustable antialiasing [7] #testing
    [7]Done: 2 more user-adjustable 3D light positions [10]
    [5]Done:  In ray-traced result, show at least 2 different Phong materials on different surfaces simultaneously.
    [5]Done: recursive mirror-like reflections and 
    [5]Done: adjustable depth 
    [5]Done: show 3 transformed sphere
    [5]Done: show webGL 2 phong materials [5]
    [5]Done: 3 or more transformed spheres [5]
    [10]Done: 4 distinct 3d Scnenes [10]
    [10]Done: shadows

    [5]Done: cube transform non-uniform shape distortion [5]
    [5]stochastic shadow

    ? 3d masterial [5]

    TODO More Geometric Shapes cylinder torus plus ray tracing [5 each]
    TODO Transparency with Refraction [10]
    TODO Non-Phong light/material [10 each]
    TODO Procedural Materials [5]

    Note: 
        console.log(JSON.parse(JSON.stringify(g_particleArray[index].s1)));
    🐞 FIXME: 
*/

"use strict";

var boxVert0 =
    "attribute vec4 a_Position;\n" +
    "attribute vec4 a_Color;\n" +
    "uniform mat4 u_mvpMat;\n" +
    "varying vec4 v_colr;\n" +
    "void main() {\n" +
    "   gl_Position = u_mvpMat * a_Position;\n" +
    "   v_colr = a_Color;\n" +
    "}\n";

var boxFrag0 =
    "precision mediump float;\n" +
    "varying vec4 v_colr;\n" +
    "void main() {\n" +
    "   gl_FragColor = v_colr; \n" +
    "}\n";

var boxVert1 =
    "attribute vec4 a_Position;\n" +
    "attribute vec2 a_TexCoord;\n" +
    "varying vec2 v_TexCoord;\n" +
    "void main() {\n" +
    "  gl_Position = a_Position;\n" +
    "  v_TexCoord = a_TexCoord;\n" +
    "}\n";

var boxFrag1 =
    "precision mediump float;\n" +
    "uniform sampler2D u_Sampler;\n" +
    "varying vec2 v_TexCoord;\n" +
    "void main() {\n" +
    "  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n" +
    "}\n";
var PhongPhongVert =
    "struct MatlT {\n" +
    "		vec3 emit;\n" + // Ke: emissive -- surface 'glow' amount (r,g,b);
    "		vec3 ambi;\n" + // Ka: ambient reflectance (r,g,b)
    "		vec3 diff;\n" + // Kd: diffuse reflectance (r,g,b)
    "		vec3 spec;\n" + // Ks: specular reflectance (r,g,b)
    "		int shiny;\n" + // Kshiny: specular exponent (integer >= 1; typ. <200)
    "		};\n" +
    "attribute vec4 a_Position; \n" +
    "attribute vec4 a_Normal; \n" +
    // 	'uniform vec3 u_Kd; \n' +	//reflect entire sphere	 Later: as vertex attrib
    "uniform MatlT u_MatlSet[1];\n" + // Array of all materials.
    "uniform mat4 u_MvpMatrix; \n" +
    "uniform mat4 u_ModelMatrix; \n" +
    "uniform mat4 u_NormalMatrix; \n" +
    //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
    "varying vec3 v_Kd; \n" + // Phong Lighting: diffuse reflectance
    "varying vec4 v_Position; \n" +
    "varying vec3 v_Normal; \n" + // Why Vec3? its not a point, hence w==0
    "void main() { \n" +
    "  gl_Position = u_MvpMatrix * a_Position;\n" +
    "  v_Position = u_ModelMatrix * a_Position; \n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
    "  v_Kd = u_MatlSet[0].diff; \n" + // find per-pixel diffuse reflectance from per-vertex
    "}\n";

var PhongPhongFrag =
    "precision highp float;\n" +
    "precision highp int;\n" +
    //--------------- GLSL Struct Definitions:
    "struct LampT {\n" + // Describes one point-like Phong light source
    "	vec3 pos;\n" + // (x,y,z,w); w==1.0 for local light at x,y,z position
    " 	vec3 ambi;\n" + // Ia ==  ambient light source strength (r,g,b)
    " 	vec3 diff;\n" + // Id ==  diffuse light source strength (r,g,b)
    "	vec3 spec;\n" + // Is == specular light source strength (r,g,b)
    "}; \n" +
    "struct MatlT {\n" + // Describes one Phong material by its reflectances:
    "		vec3 emit;\n" + // Ke: emissive -- surface 'glow' amount (r,g,b);
    "		vec3 ambi;\n" + // Ka: ambient reflectance (r,g,b)
    "		vec3 diff;\n" + // Kd: diffuse reflectance (r,g,b)
    "		vec3 spec;\n" + // Ks: specular reflectance (r,g,b)
    "		int shiny;\n" + // Kshiny: specular exponent (integer >= 1; typ. <200)
    "		};\n" +
    //-------------UNIFORMS: values set from JavaScript before a drawing command.
    "uniform LampT u_LampSet[1];\n" + // Array of all light sources.
    "uniform MatlT u_MatlSet[1];\n" + // Array of all materials.
    "uniform vec3 u_eyePosWorld; \n" + // Camera/eye location in world coords.
    //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
    "varying vec3 v_Normal;\n" + // Find 3D surface normal at each pix
    "varying vec4 v_Position;\n" + // pixel's 3D pos too -- in 'world' coords
    "varying vec3 v_Kd;	\n" + // Find diffuse reflectance K_d per pix
    "void main() { \n" +
    "  vec3 normal = normalize(v_Normal); \n" +
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0); \n" +
    // ? vvvvvvvvvvvvvvvvvvvvvvvv
    "  vec3 reflec = normalize(2.0*(normal * nDotL) - lightDirection); \n" + // ? phong no half
    "  float rDotV = max(dot(reflec, eyeDirection), 0.0); \n" +
    "  float e64 = pow(rDotV, float(u_MatlSet[0].shiny));\n" + // pow() won't accept integer exponents! Convert K_shiny!
    // ? ^^^^^^^^^^^^^^^^^^^^^^^^
    "  vec3 emissive = u_MatlSet[0].emit;" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n" +
    "  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    "  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n" +
    "}\n";

/* the different shaders details */
var draggableBlinnPhongVert =
    "struct MatlT {\n" +
    "		vec3 emit;\n" + // Ke: emissive -- surface 'glow' amount (r,g,b);
    "		vec3 ambi;\n" + // Ka: ambient reflectance (r,g,b)
    "		vec3 diff;\n" + // Kd: diffuse reflectance (r,g,b)
    "		vec3 spec;\n" + // Ks: specular reflectance (r,g,b)
    "		int shiny;\n" + // Kshiny: specular exponent (integer >= 1; typ. <200)
    "		};\n" +
    "attribute vec4 a_Position; \n" +
    "attribute vec4 a_Normal; \n" +
    // 	'uniform vec3 u_Kd; \n' +	//reflect entire sphere	 Later: as vertex attrib
    "uniform MatlT u_MatlSet[1];\n" + // Array of all materials.
    "uniform mat4 u_MvpMatrix; \n" +
    "uniform mat4 u_ModelMatrix; \n" +
    "uniform mat4 u_NormalMatrix; \n" +
    //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
    "varying vec3 v_Kd; \n" + // Phong Lighting: diffuse reflectance
    "varying vec4 v_Position; \n" +
    "varying vec3 v_Normal; \n" + // Why Vec3? its not a point, hence w==0
    "void main() { \n" +
    "  gl_Position = u_MvpMatrix * a_Position;\n" +
    "  v_Position = u_ModelMatrix * a_Position; \n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
    "  v_Kd = u_MatlSet[0].diff; \n" + // find per-pixel diffuse reflectance from per-vertex
    "}\n";

var draggableBlinnPhongFrag = // ! Todo: add second head light
    "precision highp float;\n" +
    "precision highp int;\n" +
    //--------------- GLSL Struct Definitions:
    "struct LampT {\n" + // Describes one point-like Phong light source
    "	vec3 pos;\n" + // (x,y,z,w); w==1.0 for local light at x,y,z position
    " 	vec3 ambi;\n" + // Ia ==  ambient light source strength (r,g,b)
    " 	vec3 diff;\n" + // Id ==  diffuse light source strength (r,g,b)
    "	vec3 spec;\n" + // Is == specular light source strength (r,g,b)
    "}; \n" +
    "struct MatlT {\n" + // Describes one Phong material by its reflectances:
    "		vec3 emit;\n" + // Ke: emissive -- surface 'glow' amount (r,g,b);
    "		vec3 ambi;\n" + // Ka: ambient reflectance (r,g,b)
    "		vec3 diff;\n" + // Kd: diffuse reflectance (r,g,b)
    "		vec3 spec;\n" + // Ks: specular reflectance (r,g,b)
    "		int shiny;\n" + // Kshiny: specular exponent (integer >= 1; typ. <200)
    "		};\n" +
    //-------------UNIFORMS: values set from JavaScript before a drawing command.
    "uniform LampT u_LampSet[2];\n" + // Array of all light sources.
    "uniform MatlT u_MatlSet[1];\n" + // Array of all materials.
    "uniform vec3 u_eyePosWorld; \n" + // Camera/eye location in world coords.
    //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
    "varying vec3 v_Normal;\n" + // Find 3D surface normal at each pix
    "varying vec4 v_Position;\n" + // pixel's 3D pos too -- in 'world' coords
    "varying vec3 v_Kd;	\n" + // Find diffuse reflectance K_d per pix
    "void main() { \n" +
    "  vec3 normal = normalize(v_Normal); \n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n" +
    // Light Source 1
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0); \n" +
    // ? vvvvvvvvvvvvvvvvvvvvvvvv
    "  vec3 H = normalize(lightDirection + eyeDirection); \n" +
    "  float nDotH = max(dot(H, normal), 0.0); \n" +
    "  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n" + // pow() won't accept integer exponents! Convert K_shiny!
    // ? ^^^^^^^^^^^^^^^^^^^^^^^^
    "  vec3 emissive = u_MatlSet[0].emit;" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n" +
    "  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    //Light Source 2 (headlight)
    "  vec3 lightDirection2 = normalize(u_LampSet[1].pos - v_Position.xyz);\n" +
    "  float nDotL2 = max(dot(lightDirection2, normal), 0.0); \n" +
    // ? vvvvvvvvvvvvvvvvvvvvvvvv
    "  vec3 H2 = normalize(lightDirection2 + eyeDirection); \n" +
    "  float nDotH2 = max(dot(H2, normal), 0.0); \n" +
    "  float e64_2 = pow(nDotH2, float(u_MatlSet[0].shiny));\n" + // pow() won't accept integer exponents! Convert K_shiny!
    // ? ^^^^^^^^^^^^^^^^^^^^^^^^
    "  vec3 ambient2 = u_LampSet[1].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse2 = u_LampSet[1].diff * v_Kd * nDotL2;\n" +
    "  vec3 speculr2 = u_LampSet[1].spec * u_MatlSet[0].spec * e64_2;\n" +
    "  gl_FragColor = vec4(emissive + ambient + diffuse + speculr + ambient2 + diffuse2 + speculr2 , 1.0);\n" +
    "}\n";
var diffuseVert = // * not used but could be used with lightSpec 0
    "precision highp float;\n" +
    "attribute vec4 a_Position;\n" +
    "attribute vec3 a_Color;\n" +
    "attribute vec3 a_Normal;\n" +
    "varying vec4 v_Color;\n" +
    "uniform mat4 u_MvpMatrix;\n" +
    "uniform mat4 u_ModelMatrix;\n" + // Model matrix
    "uniform mat4 u_NormalMatrix;\n" +
    "void main() {\n" +
    "  vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n" +
    "  vec3 normVec = normalize(transVec.xyz);\n" +
    "  vec3 lightVec = vec3(0.1, 0.5, 0.7);\n" +
    "  gl_Position = u_MvpMatrix * a_Position;\n" +
    "  vec4 vertexPosition = u_ModelMatrix * a_Position;\n" +
    "  v_Color = vec4(0.999*a_Color + 0.001*dot(normVec,lightVec), 1.0);\n" +
    "}\n";

var diffuseFrag = // * not used but could be used with lightSpec 0
    "#ifdef GL_ES\n" +
    "precision highp float;\n" +
    "#endif\n" +
    "varying vec4 v_Color;\n" +
    "void main() {\n" +
    "  gl_FragColor = v_Color;\n" +
    "}\n";

var gl;
var g_canvasID;

var g_modelMatrix = new Matrix4();
var g_viewProjMatrix = new Matrix4();
var gui = new GUIbox(g_modelMatrix, g_viewProjMatrix);

setControlPanel(g_modelMatrix, g_viewProjMatrix);

var g_vboArray;
var g_shadingScheme = {
    //[plane, cube, cube2, sphere, sphere2, cube3]
    0: [PhongPhongVert, PhongPhongFrag, 5],
    1: [draggableBlinnPhongVert, draggableBlinnPhongFrag, 3],
};
function initVBOs(currScheme) {
    if (!currScheme) {
        currScheme = g_shadingScheme[0];
    }
    var grid = new VBO_genetic(
        diffuseVert,
        diffuseFrag,
        grid_vertices,
        grid_colors,
        grid_normals,
        null,
        0
    );
    grid.init();
    var plane = new VBO_genetic(
        currScheme[0],
        currScheme[1],
        plane_vertices,
        plane_colors,
        plane_normals,
        plane_indices,
        currScheme[2],
        8
    );
    plane.init();
    var sphere = new VBO_genetic(
        currScheme[0],
        currScheme[1],
        sphere_vertices,
        sphere_colors,
        sphere_normals,
        sphere_indices,
        currScheme[2],
        10
    );
    sphere.init();
    var sphere_test = new VBO_genetic(
        currScheme[0],
        currScheme[1],
        sphere_vertices,
        sphere_colors,
        sphere_normals,
        sphere_indices,
        currScheme[2],
        6
    );
    sphere_test.init();
    var cube = new VBO_genetic(
        currScheme[0],
        currScheme[1],
        cube_vertices,
        cube_colors,
        cube_normals,
        cube_indices,
        currScheme[2],
        11
    );
    cube.init();
    var disk = new VBO_genetic(
        diffuseVert,
        diffuseFrag,
        diskVert,
        diskVert,
        diskVert,
        null,
        0
    );
    disk.init();
    g_vboArray = [grid, plane, sphere_test, sphere, cube, disk];
}

// ! Ray Tracer Objects
var g_myPic = new CImgBuf(256, 256); // Create a floating-point image-buffer object to hold the image created by 'g_myScene' object.
// CAUTION! use power-of-two size (256x256; 512x512, etc)
// to ensure WebGL 1.0 texture-mapping works properly
var g_myScene = new CScene(); // Create our ray-tracing object;

// this contains our complete 3D scene & its camera
// used to write a complete ray-traced image to the CImgBuf object 'g_myPic' given as argument.
var g_SceneNum = 0; // scene-selector number; 0,1,2,... G_SCENE_MAX-1
var G_SCENE_MAX = 3; // Number of scenes defined.
var g_AAcode = 1; // Antialiasing setting: 1 == NO antialiasing at all. 2,3,4... == supersamples: 2x2, 3x3, 4x4, ...
var G_AA_MAX = 4; // highest super-sampling number allowed.
var g_isJitter = 0; // ==1 for jitter, ==0 for no jitter.
var g_lastMS = Date.now();

var preView = new VBObox0(boxVert0, boxFrag0, axis_vboArr0, 6);
var rayView = new VBObox1(boxVert1, boxFrag1, axis_vboArr1, 4);

function main() {
    console.log("hello from main.js");
    g_canvasID = document.getElementById("webgl");
    gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
    gl.clearColor(0.2, 0.2, 0.2, 1);
    gl.enable(gl.DEPTH_TEST);
    gui.init();
    g_myScene.initScene(g_SceneNum);
    g_myScene.makeRayTracedImage();

    preView.init(gl); // VBO + shaders + uniforms + attribs for WebGL preview
    rayView.init(gl); //  "		"		" to display ray-traced on-screen result.

    initVBOs(g_shadingScheme[1]);

    globalThis.g_modelMatrix = new Matrix4();
    globalThis.g_viewProjMatrix = new Matrix4();

    g_myScene.makeRayTracedImage(); // run the ray-tracer
    rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
    rayView.reload(); // re-transfer VBO contents and texture-map contents
    drawAll(g_SceneNum, g_modelMatrix, g_viewProjMatrix); // re-draw BOTH viewports.

    onBrowserResize(g_SceneNum, g_modelMatrix, g_viewProjMatrix);
}

function onSceneButton() {
    //console.log('ON-SCENE BUTTON!');
    if (g_SceneNum < 0 || g_SceneNum >= G_SCENE_MAX) g_SceneNum = 0;
    else g_SceneNum = g_SceneNum + 1;

    document.getElementById("SceneReport").innerHTML =
        "Show Scene Number" + g_SceneNum;

    // ! Change g_myPic contents:
    g_myScene.initScene(g_SceneNum);
    g_myScene.makeRayTracedImage();
    // ! transfer g_myPic's new contents to the GPU;
    rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
    rayView.reload(); // re-transfer VBO contents and texture-map contents
    drawAll(g_SceneNum, g_modelMatrix, g_viewProjMatrix);
}

/**
 * Re-draw all WebGL contents in our browser window.
 * NOTE: this program doesn't have an animation loop!
 */
function drawAll(g_SceneNum, g_modelMatrix, g_viewProjMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // * left
    gl.viewport(
        0, // Viewport lower-left corner
        0, // (x,y) location(in pixels)
        gl.drawingBufferWidth / 2, // viewport width, height.
        gl.drawingBufferHeight
    );
    // preView.switchToMe(); // Set WebGL to render from this VBObox.
    // preView.adjust(); // Send new values for uniforms to the GPU, and
    // preView.draw(g_SceneNum); // draw our VBO's contents using our shaders.
    g_viewProjMatrix.setPerspective(
        gui.camFovy,
        gui.camAspect,
        gui.camNear,
        gui.camFar
    );
    g_viewProjMatrix.lookAt(
        gui.camEyePt[0],
        gui.camEyePt[1],
        gui.camEyePt[2],
        gui.camAimPt[0],
        gui.camAimPt[1],
        gui.camAimPt[2],
        gui.camUpVec[0],
        gui.camUpVec[1],
        gui.camUpVec[2]
    );
    drawPreview(g_modelMatrix, g_viewProjMatrix);

    // * right
    gl.viewport(
        gl.drawingBufferWidth / 2,
        0,
        gl.drawingBufferWidth / 2,
        gl.drawingBufferHeight
    );
    rayView.switchToMe();
    rayView.adjust();
    rayView.draw();
}

function drawPreview(g_modelMatrix, g_viewProjMatrix) {
    switch (g_SceneNum) {
        case 0:
            //draw grid
            pushMatrix(g_modelMatrix);
            g_vboArray[0].switchToMe();
            g_vboArray[0].draw(g_modelMatrix, g_viewProjMatrix, true);
            g_modelMatrix = popMatrix();

            // * draw sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.setScale(1, 1, 1);
            g_modelMatrix.translate(2, 1, 1.0);
            g_vboArray[2].setMaterial(8);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * draw sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.scale(0.3, 1, 0.3);
            g_modelMatrix.translate(4, 1, 3);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_vboArray[2].setMaterial(12);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * draw sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.setScale(0.5, 0.5, 2);
            g_modelMatrix.translate(-5, 1.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_vboArray[2].setMaterial(14);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * disk
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(0.2, 0.4, 0.0);
            g_modelMatrix.rotate(0.8 * 180, 0, 1, 0);
            g_modelMatrix.scale(2, 1, 0.001);
            g_vboArray[2].setMaterial(2);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * disk
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 1, 0, 0);
            g_modelMatrix.translate(0.2, 0.4, 0.0);
            g_modelMatrix.rotate(0.3 * 180, 0, 0, 1);
            g_modelMatrix.scale(0.4, 1.2, 0.001);
            g_vboArray[2].setMaterial(2);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * disk
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 1, 0, 0);
            g_modelMatrix.translate(0.2, 0.4, 0.0);
            g_modelMatrix.rotate(0.4 * 180, 1, 0, 0);
            g_modelMatrix.scale(1, 0.3, 0.001);
            g_vboArray[2].setMaterial(2);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            break;
        case 1:
            //draw grid
            pushMatrix(g_modelMatrix);
            g_vboArray[0].switchToMe();
            g_vboArray[0].draw(g_modelMatrix, g_viewProjMatrix, true);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.scale(0.8, 0.6, 0.4);
            g_modelMatrix.translate(0, -3.2, 1.0);
            g_vboArray[2].setMaterial(12);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.scale(0.3, 3.3, 0.3);
            g_modelMatrix.translate(3, 1.2, 1.0);
            g_vboArray[2].setMaterial(6);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.scale(0.1, 4.6, 0.4);
            g_modelMatrix.translate(0, 0.2, 0.0);
            g_vboArray[2].setMaterial(13);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.3 * 180, 1, 0, 0);
            g_modelMatrix.scale(0.2, 0.3, 1.3);
            g_modelMatrix.translate(0.2, 0.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_modelMatrix.rotate(-0.8 * 180, 0, 1, 0);
            g_vboArray[4].setMaterial(10);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.3 * 180, 1, 0, 0);
            g_modelMatrix.scale(0.2, 0.3, 1.3);
            g_modelMatrix.translate(0.2, 1.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_modelMatrix.rotate(-0.8 * 180, 1, 0, 0);
            g_vboArray[4].setMaterial(10);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.translate(0, 2.4, 1.0);
            g_modelMatrix.scale(0.8, 0.2, 1);
            g_modelMatrix.rotate(0.3 * 180, 0, 0, 1);
            g_vboArray[4].setMaterial(14);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            break;
        case 2:
            //draw grid
            pushMatrix(g_modelMatrix);
            g_vboArray[0].switchToMe();
            g_vboArray[0].draw(g_modelMatrix, g_viewProjMatrix, true);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(1, 1, 0.3);
            g_modelMatrix.translate(1.2, 1.4, 1.0);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_vboArray[4].setMaterial(18);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(1, 1, 0.3);
            g_modelMatrix.translate(1.2, 1.4, 1.3);
            g_modelMatrix.rotate(0.3 * 180, 0, 1, 0);
            g_vboArray[4].setMaterial(18);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * disk
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.8 * 180, 1, 0, 0);
            g_modelMatrix.translate(1.2, 0.4, -3.0);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(1, 1, 0.0001);
            g_vboArray[2].setMaterial(19);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_vboArray[2].setMaterial(6);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(1.2, 1.4, 0.2);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(0.3, 0.5, 0.3);
            g_vboArray[2].setMaterial(7);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(-1, 2.4, 1.0);
            g_modelMatrix.rotate(0.8 * 180, 1, 0, 0);
            g_modelMatrix.scale(0.6, 1.2, 0.3);
            g_vboArray[2].setMaterial(8);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            break;
        case 3:
            //draw grid
            pushMatrix(g_modelMatrix);
            g_vboArray[0].switchToMe();
            g_vboArray[0].draw(g_modelMatrix, g_viewProjMatrix, true);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(1.2, 1.4, 1.5);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(0.3, 2, 0.3);
            g_vboArray[2].setMaterial(20);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(1.2, 1.4, 0.2);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(2, 0.1, 0.3);
            g_vboArray[2].setMaterial(20);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * sphere
            pushMatrix(g_modelMatrix);
            g_modelMatrix.translate(1.2, 1.4, 1.5);
            g_modelMatrix.rotate(0.8 * 180, 0, 0, 1);
            g_modelMatrix.scale(0.3, 0.5, 2);
            g_vboArray[2].setMaterial(20);
            g_vboArray[2].init();
            g_vboArray[2].switchToMe();
            g_vboArray[2].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.3 * 180, 1, 0, 0);
            g_modelMatrix.scale(0.2, 0.3, 2.3);
            g_modelMatrix.translate(-3.2, 0.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_vboArray[4].setMaterial(10);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.3 * 180, 1, 0, 0);
            g_modelMatrix.scale(0.2, 2, 0.3);
            g_modelMatrix.translate(2.2, 0.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 1, 0);
            g_modelMatrix.rotate(-0.8 * 180, 1, 0, 0);
            g_vboArray[4].setMaterial(10);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            // * cube
            pushMatrix(g_modelMatrix);
            g_modelMatrix.rotate(0.3 * 180, 1, 0, 0);
            g_modelMatrix.scale(1.2, 0.3, 0.3);
            g_modelMatrix.translate(-0.2, 2.2, 1.0);
            g_modelMatrix.rotate(-0.8 * 180, 0, 0, 1);
            g_vboArray[4].setMaterial(13);
            g_vboArray[4].init();
            g_vboArray[4].switchToMe();
            g_vboArray[4].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();

            break;
        default:
            //draw grid
            pushMatrix(g_modelMatrix);
            g_vboArray[0].switchToMe();
            g_vboArray[0].draw(g_modelMatrix, g_viewProjMatrix);
            g_modelMatrix = popMatrix();
            break;
    }
}
function print_mat4(a, nameStr) {
    //==============================================================================
    // Pretty-print contents of a glMatrix 4x4 matrix object in console.
    // Used in test_glMatrix() function below; a handy debugging tool too.
    //'String.padStart()' leaves space for minus sign & 2
    var res = 3; // resolution: how many digits to print after decimal point.

    // TRICKY: for all matrix elements,
    // FIND largest # of digits in front of decimal point.
    // -----------------
    var cnt, iVal; // array index; integer part of a[cnt],
    var len = 0,
        pad = 0; // # digits in iVal, largest len value found.
    for (cnt = 0, len = 0; cnt < 16; cnt++) {
        iVal = Math.floor(a[cnt]);
        len = iVal.toString().length;
        if (len > pad) pad = len;
        //   console.log('floor(a[', cnt, ']) length: ', iVal.toString().length);
    }
    pad = pad + res + 1; // enough room for leading digits, trailing digits + sign
    //  console.log("pad:", pad);
    console.log(
        "\n-------",
        nameStr,
        "-------\n",
        "row0=[" +
            a[0].toFixed(res).padStart(pad, " ") +
            ", " +
            a[4].toFixed(res).padStart(pad, " ") +
            ", " +
            a[8].toFixed(res).padStart(pad, " ") +
            ", " +
            a[12].toFixed(res).padStart(pad, " ") +
            "]\n",
        "row1=[" +
            a[1].toFixed(res).padStart(pad, " ") +
            ", " +
            a[5].toFixed(res).padStart(pad, " ") +
            ", " +
            a[9].toFixed(res).padStart(pad, " ") +
            ", " +
            a[13].toFixed(res).padStart(pad, " ") +
            "]\n",
        "row2=[" +
            a[2].toFixed(res).padStart(pad, " ") +
            ", " +
            a[6].toFixed(res).padStart(pad, " ") +
            ", " +
            a[10].toFixed(res).padStart(pad, " ") +
            ", " +
            a[14].toFixed(res).padStart(pad, " ") +
            "]\n",
        "row3=[" +
            a[3].toFixed(res).padStart(pad, " ") +
            ", " +
            a[7].toFixed(res).padStart(pad, " ") +
            ", " +
            a[11].toFixed(res).padStart(pad, " ") +
            ", " +
            a[15].toFixed(res).padStart(pad, " ") +
            "]\n"
    );
}

function test_glMatrix() {
    //=============================================================================
    // Make sure that the fast vector/matrix library we use is available and works
    // properly. My search for 'webGL vector matrix library' found the GitHub
    // project glMatrix is intended for WebGL use, and is very fast, open source
    // and well respected.		 	SEE:       http://glmatrix.net/
    // 			NOTE: cuon-matrix.js library (supplied with our textbook: "WebGL
    // Programming Guide") duplicates some of the glMatrix.js functions. For
    // example, the glMatrix.js function 		mat4.lookAt() 		is a work-alike
    //	 for the cuon-matrix.js function 		Matrix4.setLookAt().
    // Try some vector vec4 operations:
    var myV4 = vec4.fromValues(1, 8, 4, 7); // create a 4-vector
    // (without 'var'? global scope!)
    console.log("-----TEST------\n-----glMatrix.js library------------");
    var outV4 = vec4.create();
    console.log("0):\n var outV4 = vec4.create();\n result:");
    console.log("outV4 object:\n ", outV4);
    console.log(
        "\n outV4[0]: ",
        outV4[0],
        "\n outV4[1]: ",
        outV4[1],
        "\n outV4[2]: ",
        outV4[2],
        "\n outV4[3]: ",
        outV4[3]
    );
    console.log("1):\n var myV4 = vec4.fromValues(1,8,4,7);  result:\n", myV4);
    console.log(
        "\n myV4[0] = ",
        myV4[0],
        "\n myV4[1] = ",
        myV4[1],
        "\n myV4[2] = ",
        myV4[2],
        "\n myV4[3] = ",
        myV4[3]
    );
    console.log(
        "  **OR** use the vec4.str() member function that returns the",
        " vector as a string, so that: console.log(vec4.str(myV4));"
    );
    console.log("will print: \n ", vec4.str(myV4));

    console.log("2):\n var yerV4 = vec4.fromValues(1,1,1,1); result:");
    var yerV4 = vec4.fromValues(1, 1, 1, 1);
    console.log("\n yerV4[] object:\n ", yerV4);
    console.log("or if we print the vec4.str(yerV4) string:", vec4.str(yerV4));
    console.log("3):\n vec4.subtract(outV4, yerV4, myV4);\n");
    vec4.subtract(outV4, yerV4, myV4);
    console.log("\n RESULT: outV4[] object:\n ", outV4);
    console.log("or print string from vec4.str(myV4):\n", vec4.str(myV4));

    console.log(
        "4):=================\n  4x4 Matrix tests:\n4):=================\n",
        "  var myM4 = mat4.create();\n   ",
        '("creates" a 4x4 identity matrix)'
    );
    // Try some matrix mat4 operations:
    var myM4 = mat4.create(); // create a 4x4 matrix
    console.log("\n print myM4 object:\n ", myM4);
    console.log(
        '\nHmmm. Is this "row-major" order? \n',
        " (Starts at upper left,\n",
        "  right-to-left on top row,\n",
        "  repeat on next-lower row, etc)?"
    );
    console.log(
        '\nOr is it "column-major" order?\n',
        " (Starts at upper left,\n",
        "  top-to-bottom on left column,\n",
        "  repeat on next-rightwards column, etc)?"
    );
    // Nice illustration: https://en.wikipedia.org/wiki/Row-_and_column-major_order

    console.log(
        "\nMake a translate matrix from a vec3 or vec4 displacement to find out:\n",
        "var transV3 = vec3.fromValues(0.6,0.7,0.8);\n",
        "var transV4 = vec4.fromValues( 6, 7, 8, 9):\n"
    );
    var transV3 = vec3.fromValues(0.6, 0.7, 0.8); // a 3D translation vector
    var transV4 = vec4.fromValues(6, 7, 8, 9); // a '4D' translation vector
    console.log(
        "\n mat4.translate(myM4, myM4, transV3);\n",
        "   (this means: myM4 = myM4 translated by transV3)"
    );
    mat4.translate(myM4, myM4, transV3); // make into translation matrix
    console.log("\n print myM4 object made from transV3:", myM4);
    myM4 = mat4.create();
    mat4.translate(myM4, myM4, transV4);
    console.log("\n print myM4 object made from transV4:", myM4);
    console.log(
        "AHA!! As you can see, mat4.translate() IGNORES the vec4 'w' value. Good!"
    );
    //---------------------------------------------------------------------------
    // As you can see, the 'mat4' object stores matrix contents in COLUMN-first
    // order; to display this translation matrix correctly, do this
    console.log(
        "\n !AHA! COLUMN-MAJOR order:\n",
        "top-to-bottom starting at leftmost column.\n",
        "I wrote a print_mat4() fcn (just above)--\n",
        'Call print_mat4(myM4,"Translation matrix myM4"):'
    );
    print_mat4(myM4, "Translation matrix myM4");
    // re-sizing text for print_mat4() function
    console.log(
        "check print_mat4() resizing by setting myMat elements to varied digits:"
    );
    var myMat = mat4.create();
    myMat[0] = 0.9876543;
    myMat[1] = -0.9876543;
    myMat[2] = 1.9876543;
    myMat[3] = -1.9876543;
    myMat[4] = 12.9876543;
    myMat[5] = -12.9876543;
    myMat[6] = 123.9876543;
    myMat[7] = -123.9876543;
    myMat[8] = 1234.9876543;
    myMat[9] = -1234.9876543;
    myMat[10] = 12345.9876543;
    myMat[11] = -12345.9876543;
    myMat[12] = 123456.9876543;
    myMat[13] = -123456.9876543;
    print_mat4(myMat, "myMat");

    console.log(
        "SUGGESTION:\n write similar fcns for mat2,mat3, vec2,vec3,vec4,",
        " OR look into later versions of the glMatrix library..."
    );
    // Now test glMatrix concatenation;
    console.log(
        "\n---------------------------",
        "\n Matrix Concatenation.",
        "\n---------------------------",
        "\n  glMatrix offers composable transform functions such as",
        "\n     mat4.translate(out,a,v)",
        "\n     mat4.rotate(out,a,rad,axis)",
        "\n     mat4.scale(out,a,v)"
    );
    console.log(
        "\n? HOW do these fcns compute [out]",
        "\n from input matrix [a] and the function's",
        "\n newly-specified transform matrix [NEW]?",
        "\n ??? Does it compute [out] = [a][NEW]?",
        "\n ??? or does it find [out] = [NEW][a]?"
    );
    console.log(
        "Try it:\n",
        "var rotM4 = mat4.create(); //4x4 identity matrix"
    );
    var rotM4 = mat4.create();
    console.log("\n Then mat4.rotateZ(rotM4, rotM4, glMatrix.toRadians(30.0);");
    mat4.rotateZ(rotM4, rotM4, glMatrix.toRadian(30.0));
    print_mat4(rotM4, "rotM4 == z-axis rotation +30deg");
    console.log(
        'now "translate" rotM4:\n',
        " mat4.translate(outM4, rotM4, [5,0,0]);"
    );
    var outM4 = mat4.create();
    mat4.translate(outM4, rotM4, [5, 0, 0]);
    print_mat4(outM4, "outM4 == rotM4 then translate(5,0,0)");
    console.log("=======\n !YES! \n=======\nthat's what we wanted!");
    console.log(
        " We have [rot][NEW],",
        "\n just like cuon-matrix.js",
        "\n== we transform drawing axes, not vertex coords",
        '("Method2" in lecture notes).'
    );
    /*
// DOUBLE-CHECK using matrix multiply:
  console.log('=============\n',
  '--DOUBLE-CHECK-- this result using matrix multiply:');
  var trnM4 = mat4.create();
  mat4.translate(trnM4, trnM4, [5,0,0]);
  print_mat4(trnM4,"trnM4==translate(5,0,0)");
  print_mat4(rotM4,"rotM4==rotateZ(+30deg)");  
  mat4.multiply(outM4,rotM4,trnM4); //  multiply(out,a,b) finds [out] = [a][b];
  print_mat4(outM4,"outM4==[rotM4][trnM4]");
  console.log(" --------YES! [rotM4][trnM4] is what we want.");
  mat4.multiply(outM4,trnM4,rotM4); // multiply in opposite order
  print_mat4(outM4,"outM4==[trnM4][rotM4]");
  console.log(" xxxxxxxx NO! [trnM4][rotM4] IS NOT what we want.");
*/
}

function onSuperSampleButton() {
    //=============================================================================
    // advance to the next antialiasing mode.
    //console.log('ON-SuperSample BUTTON!');
    g_AAcode += 1;
    if (g_AAcode > G_AA_MAX) g_AAcode = 1; // 1,2,3,4, 1,2,3,4, 1,2,... etc
    // report it:
    if (g_AAcode == 1) {
        if (g_isJitter == 0) {
            document.getElementById("AAreport").innerHTML =
                "1 sample/pixel. No jitter.";
            console.log("1 sample/pixel. No Jitter.");
        } else {
            document.getElementById("AAreport").innerHTML =
                "1 sample/pixel, but jittered.";
            console.log("1 sample/pixel, but jittered.");
        }
    } else {
        // g_AAcode !=1
        if (g_isJitter == 0) {
            document.getElementById("AAreport").innerHTML =
                g_AAcode + "x" + g_AAcode + " Supersampling. No jitter.";
            console.log(g_AAcode, "x", g_AAcode, "Supersampling. No Jitter.");
        } else {
            document.getElementById("AAreport").innerHTML =
                g_AAcode + "x" + g_AAcode + " JITTERED Supersampling";
            console.log(g_AAcode, "x", g_AAcode, " JITTERED Supersampling.");
        }
    }
}

function onJitterButton() {
    //=============================================================================
    console.log("ON-JITTER button!!");
    if (g_isJitter == 0) g_isJitter = 1;
    // toggle 0,1,0,1,...
    else g_isJitter = 0;

    // report it:
    if (g_AAcode == 1) {
        if (g_isJitter == 0) {
            document.getElementById("AAreport").innerHTML =
                "1 sample/pixel. No jitter.";
            console.log("1 sample/pixel. No Jitter.");
        } else {
            document.getElementById("AAreport").innerHTML =
                "1 sample/pixel, but jittered.";
            console.log("1 sample/pixel, but jittered.");
        }
    } else {
        // g_AAcode !=0
        if (g_isJitter == 0) {
            document.getElementById("AAreport").innerHTML =
                g_AAcode + "x" + g_AAcode + " Supersampling. No jitter.";
            console.log(g_AAcode, "x", g_AAcode, "Supersampling. No Jitter.");
        } else {
            document.getElementById("AAreport").innerHTML =
                g_AAcode + "x" + g_AAcode + " JITTERED Supersampling";
            console.log(g_AAcode, "x", g_AAcode, " JITTERED Supersampling.");
        }
    }
}

function onBrowserResize(g_SceneNum, g_modelMatrix, g_viewProjMatrix) {
    if (!g_SceneNum || !g_modelMatrix || !g_viewProjMatrix) {
        g_SceneNum = 0;
        g_modelMatrix = new Matrix4();
        g_viewProjMatrix = new Matrix4();
    }
    //Make a square canvas/CVV fill the SMALLER of the width/2 or height:
    if (innerWidth > 2 * innerHeight) {
        // fit to brower-window height
        g_canvasID.width = 2 * innerHeight - 20; // (with 20-pixel margin)
        g_canvasID.height = innerHeight - 20; // (with 20-pixel margin_
    } else {
        // fit canvas to browser-window width
        g_canvasID.width = innerWidth - 20; // (with 20-pixel margin)
        g_canvasID.height = 0.5 * innerWidth - 20; // (with 20-pixel margin)
    }

    drawAll(g_SceneNum, g_modelMatrix, g_viewProjMatrix);
}
