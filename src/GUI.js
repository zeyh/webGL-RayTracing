/**
 * modified from JT_GUIbox-Lib
 */
"use strict";

/**
 *  capture and respond to all keyboard & mouse inputs/outputs.
 */
function GUIbox() {
    console.log("gui");

    this.isDrag = false; // mouse-drag: true while user holds down mouse button

    this.xCVV = 1.0; // Results found from last call to this.MouseToCVV()
    this.yCVV = 0.0;

    this.xMpos = 0.0; // last recorded mouse position (in CVV coords)
    this.yMpos = 0.0;

    this.xMdragTot = 0.0; // total (accumulated) mouse-drag amounts(in CVV coords).
    this.yMdragTot = 0.0;
}

/**
 * Set the browser window to use GUIbox member functions as 'callbacks' for all
 * https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
 * https://www.w3schools.com/js/js_function_closures.asp
 * http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/
 */
GUIbox.prototype.init = function () {
    var that = this; // (local) var/reference to the current GUIbox object; used in anonymous functions to restore simple

    // * MOUSE
    window.addEventListener("mousedown", function (mev) {
        return that.mouseDown(mev); //ensure proper operation of 'this' within the mouseDown() fcn
    });
    window.addEventListener("mousemove", function (mev) {
        return that.mouseMove(mev);
    });
    window.addEventListener("mouseup", function (mev) {
        return that.mouseUp(mev);
    });

    // * listen only within the HTML-5 canvas
    // g_canvasID.addEventListener("click", function (mev) {
    //     return that.canvasClick(mev);
    // });

    window.addEventListener(
        "keydown",
        function (kev) {
            return that.keyDown(kev);
        },
        false
    );

    window.addEventListener(
        "keyup",
        function (kev) {
            return that.keyUp(kev);
        },
        false
    );

    // * Camera-Navigation
    this.camYawInit = Math.PI / 2.0; // set INITIAL yaw (radians) as the +y direction;
    this.camYaw = this.camYawInit; // Use it to set current yaw angle. HORIZONTAL mouse-drag increases/decreates yaw.
    this.camPitchInit = -Math.PI / 2; // define INITIAL pitch(radians) as -z direction;
    this.camPitch = this.camPitchInit; // Use it to set current pitch angle. VERTICAL mouse-drag increases/decreases pitch.

    this.camEyePt = vec4.fromValues(0, 0, 0, 1); // initial camera position
    this.camAimPt = vec3.fromValues(
        //point on yaw-pitch sphere around eye:
        this.camEyePt[0] + Math.cos(this.camYaw) * Math.cos(this.camPitch), // x
        this.camEyePt[1] + Math.sin(this.camYaw) * Math.cos(this.camPitch), // y
        this.camEyePt[2] + Math.sin(this.camPitch), // z
        1.0
    ); // w.
    // Yaw & pitch angles let us specify an 'up' vector always perpendicular to
    // the camera aiming direction. (same yaw, but increase pitch by +90 degrees)
    this.camUpVec = vec4.fromValues(
        // +90deg == Math.PI/2
        Math.cos(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2), // x
        Math.sin(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2), // y
        Math.sin(this.camPitch + Math.PI / 2), // z
        0.0
    ); // w=0 for vectors, =1 for points.
    this.camSpeed = 0.5; // world-space distance moved per keystroke
    this.camFovy  = 45.0;  
    this.camAspect = 1.0; 
    this.camNear = 1.0;   
    this.camFar = 10000; 
    
    // * REPORT initial mouse-drag totals on-screen: (should be zeroes)
    document.getElementById("MouseDragResult").innerHTML =
        "Mouse Drag totals (CVV coords):\t" +
        this.xMdragTot.toFixed(5) +
        ", \t" +
        this.yMdragTot.toFixed(5);
};

/**
 *  convert mouse event 'mev' from the given 'client' coordinates
 */
GUIbox.prototype.mouseToCVV = function (mev) {
    var rect = g_canvasID.getBoundingClientRect(); // get canvas corners in pixels
    var xp = mev.clientX - rect.left; // x==0 at canvas left edge
    var yp = g_canvasID.height - (mev.clientY - rect.top);

    this.xCVV =
        (xp - g_canvasID.width / 2) / // move origin to center of canvas and
        (g_canvasID.width / 2); // normalize canvas to -1 <= x < +1,
    this.yCVV =
        (yp - g_canvasID.height / 2) / //-1 <= y < +1.
        (g_canvasID.height / 2);
};

/**
 * Called when user presses down any mouse button;
 * Write to html: GUIbox.mouseDown() at CVV coords x,y =
 */
GUIbox.prototype.mouseDown = function (mev) {
    this.mouseToCVV(mev); // convert to CVV coordinates:
    this.xMpos = this.xCVV; // save current position, and...
    this.yMpos = this.yCVV;
    this.isDrag = true; // set our mouse-dragging flag

    document.getElementById("MouseResult0").innerHTML =
        "GUIbox.mouseDown() at CVV coords x,y = " +
        this.xMpos.toFixed(5) +
        ", " +
        this.yMpos.toFixed(5);
    // console.log(
    //     "GUIbox.mouseDown(): xMpos,yMpos== " +
    //         this.xMpos.toFixed(5) +
    //         ", " +
    //         this.yMpos.toFixed(5)
    // );
};

/**
 * set isDrag to true when mouse moves
 * write html: Mouse Drag totals (CVV coords):\t
 */
GUIbox.prototype.mouseMove = function (mev) {
    if (this.isDrag == false) return;
    this.mouseToCVV(mev);

    // find how far we dragged the mouse:
    this.xMdragTot += this.xCVV - this.xMpos; // Accumulate change-in-mouse-position,&
    this.yMdragTot += this.yCVV - this.yMpos;
    this.xMpos = this.xCVV; // Make next drag-measurement from here.
    this.yMpos = this.yCVV;

    // * Camera navigation:
    this.camYaw = this.camYawInit + this.xMdragTot * 1.0; // Horiz drag in radians
    this.camPitch = this.camPitchInit - this.yMdragTot * 1.0; // Vert drag in radians
    if (this.camYaw < -Math.PI) {
        this.camYaw += 2 * Math.PI;
    } else if (this.camYaw > Math.PI) {
        this.camYaw -= 2 * Math.PI;
    }
    if (this.camPitch < -Math.PI / 2) {
        this.camPitch = -Math.PI / 2; // (-Z aiming direction)
        this.yMdragTot = this.camPitchInit + Math.PI / 2; // upper limit on yMdragTot.
    } else if (this.camPitch > Math.PI / 2) {
        this.camPitch = Math.PI / 2; // (+Z aiming direction)
        this.yMdragTot = this.camPitchInit - Math.PI / 2; // lower limit on yMdragTot.
    }
    // update camera aim point: using spherical coords:
    this.camAimPt[0] =
        this.camEyePt[0] + Math.cos(this.camYaw) * Math.cos(this.camPitch); // x
    this.camAimPt[1] =
        this.camEyePt[1] + Math.sin(this.camYaw) * Math.cos(this.camPitch); // y
    this.camAimPt[2] = this.camEyePt[2] + Math.sin(this.camPitch); // z
    // update the 'up' vector too (pitch an additional +90 degrees)
    this.camUpVec[0] =
        Math.cos(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2);
    this.camUpVec[1] =
        Math.sin(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2);
    this.camUpVec[2] = Math.sin(this.camPitch + Math.PI / 2);

    drawAll(); // we MOVED the camera -- re-draw everything!

    // Report mouse-drag totals on our webpage:
    document.getElementById("MouseDragResult").innerHTML =
        "Mouse Drag totals (CVV coords):\t" +
        this.xMdragTot.toFixed(5) +
        ", \t" +
        this.yMdragTot.toFixed(5) +
        "<br>camYaw:" +
        (this.camYaw * (180 / Math.PI)).toFixed(3) +
        "deg.; camPitch:" +
        (this.camPitch * (180 / Math.PI)).toFixed(3) +
        "deg.";
};

/**
 * when mouse releases
 * write html: GUIbox.mouseUp() at CVV coords x,y =
 */
GUIbox.prototype.mouseUp = function (mev) {
    this.mouseToCVV(mev); // CONVERT event to CVV coord system
    this.isDrag = false; // CLEAR our mouse-dragging flag, and
    // accumulate any final portion of mouse-dragging we did:
    this.xMdragTot += this.xCVV - this.xMpos;
    this.yMdragTot += this.yCVV - this.yMpos;
    this.xMpos = this.xCVV; // RECORD this latest mouse-position.
    this.yMpos = this.yCVV;

    // display it on our webpage, too...
    document.getElementById("MouseResult0").innerHTML =
        "GUIbox.mouseUp(       ) at CVV coords x,y = " +
        this.xMpos.toFixed(5) +
        ", " +
        this.yMpos.toFixed(5);
};

/**
 * keyboard listener
 */
GUIbox.prototype.keyDown = function (kev) {
    switch (kev.code) {
        case "Digit0":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() digit 0 key.(UNUSED)"; // print on webpage,
            console.log("digit 0 key.(UNUSED)"); // print on console.
            break;
        case "Digit1":
            document.getElementById("KeyDown").innerHTML =
                "guiBox.KeyDown() digit 1 key.(UNUSED)"; // print on webpage,
            console.log("digit 1 key.(UNUSED)"); // print on console.
            break;
        //------------------Ray Tracing----------------------
        case "KeyC": // Clear the ray-traced image
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() c/C key: CLEAR the ray-traced image buffer."; // print on webpage,
            console.log("c/C: CLEAR ray-traced img buf"); // print on console,
            g_myPic.setTestPattern(1); // solid orange.
            g_sceneNum = 1; // (re-set onScene() button-handler, too)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll();
            break;
        case "KeyT": // 't' or 'T' key: ray-trace!
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() t/T key: TRACE a new image!"; // print on webpage,
            console.log("t/T key: TRACE a new image!"); // print on console,
            g_myPic.makeRayTracedImage(); // (near end of traceSupplement.js)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll();
            break;
        //------------------WASD navigation-----------------
        case "KeyA":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() a/A key. Strafe LEFT!";
            console.log("a/A key: Strafe LEFT!\n");
            this.camStrafe_L();
            break;
        case "KeyD":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() d/D key. Strafe RIGHT!";
            console.log("d/D key: Strafe RIGHT!\n");
            this.camStrafe_R();
            break;
        case "KeyS":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() s/S key. Move REV!";
            console.log("s/S key: Move REV!\n");
            this.camRev();
            break;
        case "KeyW":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.keyDown() w/W key. Move FWD!";
            console.log("w/W key: Move FWD!\n");
            this.camFwd();
            break;
        case "ArrowLeft":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Left,key=" + kev.key;
            console.log("Arrow-Left key(UNUSED)");
            break;
        case "ArrowRight":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Right,key=" + kev.key;
            console.log("Arrow-Right key(UNUSED)");
            break;
        case "ArrowUp":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Up,key=" + kev.key;
            console.log("Arrow-Up key(UNUSED)");
            break;
        case "ArrowDown":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Down,key=" + kev.key;
            console.log("Arrow-Down key(UNUSED)");
            break;
        default:
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() UNUSED key=" + kev.key;
            console.log("UNUSED key:", kev.key);
            break;
    }
};

GUIbox.prototype.keyDown = function (kev) {
    //============================================================================
    // Called when user presses down ANY key on the keyboard;
    //
    // For a light, easy explanation of keyboard events in JavaScript,
    // see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
    // For a thorough explanation of mess of JavaScript keyboard event handling,
    // see:    http://javascript.info/tutorial/keyboard-events
    //
    // NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
    //        'keydown' event deprecated several read-only properties I used
    //        previously, including kev.charCode, kev.keyCode.
    //        Revised 5/2019:  use kev.key and kev.code instead.
    //
    /*
	// On console, report EVERYTHING about this key-down event:  
  console.log("--kev.code:",      kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
    // On webpage, report EVERYTHING about this key-down event:
    document.getElementById("KeyDown").innerHTML = ""; // clear old result
    document.getElementById("KeyMod").innerHTML = "";
    document.getElementById("KeyMod").innerHTML =
        "   --kev.code:" +
        kev.code +
        "      --kev.key:" +
        kev.key +
        "<br>--kev.ctrlKey:" +
        kev.ctrlKey +
        " --kev.shiftKey:" +
        kev.shiftKey +
        "<br> --kev.altKey:" +
        kev.altKey +
        "  --kev.metaKey:" +
        kev.metaKey;

    switch (kev.code) {
        case "Digit0":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() digit 0 key.(UNUSED)"; // print on webpage,
            console.log("digit 0 key.(UNUSED)"); // print on console.
            break;
        case "Digit1":
            document.getElementById("KeyDown").innerHTML =
                "guiBox.KeyDown() digit 1 key.(UNUSED)"; // print on webpage,
            console.log("digit 1 key.(UNUSED)"); // print on console.
            break;
        //------------------Ray Tracing----------------------
        case "KeyC": // Clear the ray-traced image
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() c/C key: CLEAR the ray-traced image buffer."; // print on webpage,
            console.log("c/C: CLEAR ray-traced img buf"); // print on console,
            g_myPic.setTestPattern(1); // solid orange.
            g_sceneNum = 1; // (re-set onScene() button-handler, too)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll();
            break;
        case "KeyT": // 't' or 'T' key: ray-trace!
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() t/T key: TRACE a new image!"; // print on webpage,
            console.log("t/T key: TRACE a new image!"); // print on console,
            g_myPic.makeRayTracedImage(); // (near end of traceSupplement.js)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll();
            break;
        //------------------WASD navigation-----------------
        case "KeyA":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() a/A key. Strafe LEFT!";
            // console.log("a/A key: Strafe LEFT!\n");
            this.camStrafe_L();
            break;
        case "KeyD":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() d/D key. Strafe RIGHT!";
            // console.log("d/D key: Strafe RIGHT!\n");
            this.camStrafe_R();
            break;
        case "KeyS":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() s/S key. Move REV!";
            // console.log("s/S key: Move REV!\n");
            this.camRev();
            break;
        case "KeyW":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.keyDown() w/W key. Move FWD!";
            // console.log("w/W key: Move FWD!\n");
            this.camFwd();
            break;
        case "ArrowLeft":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Left,key=" + kev.key;
            console.log("Arrow-Left key(UNUSED)");
            break;
        case "ArrowRight":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Right,key=" + kev.key;
            console.log("Arrow-Right key(UNUSED)");
            break;
        case "ArrowUp":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Up,key=" + kev.key;
            console.log("Arrow-Up key(UNUSED)");
            break;
        case "ArrowDown":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() Arrow-Down,key=" + kev.key;
            console.log("Arrow-Down key(UNUSED)");
            break;
        default:
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.KeyDown() UNUSED key=" + kev.key;
            console.log("UNUSED key:", kev.key);
            break;
    }
};

/**
 * not used
 */
GUIbox.prototype.keyUp = function (kev) {
    //	console.log('GUIbox.keyUp()--keyCode='+kev.keyCode+' released.');
};

/**
 *  Move the camera FORWARDS in the aiming direction, but without changing the aiming direction.
 */
GUIbox.prototype.camFwd = function () {
    var fwd = vec4.create();
    vec4.sub(fwd, this.camAimPt, this.camEyePt); // Eye-to-Aim point vector (w=0)
    vec4.normalize(fwd, fwd); // make vector unit-length
    // (careful! normalize includes w)
    vec4.scale(fwd, fwd, this.camSpeed); // scale length to set velocity
    vec4.add(this.camAimPt, this.camAimPt, fwd); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, fwd);
    drawAll(); // show new result on-screen.
};

/**
 *  Move the camera BACKWARDS, in the reverse aiming direction
 */
GUIbox.prototype.camRev = function () {
    var rev = vec4.create();
    vec4.sub(rev, this.camEyePt, this.camAimPt); // Aim-to-Eye point vector (w=0)
    vec4.normalize(rev, rev); // make it unit-length
    // (careful! normalize includes w)
    vec4.scale(rev, rev, this.camSpeed); // scale length to set velocity
    vec4.add(this.camAimPt, this.camAimPt, rev); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, rev);
    drawAll(); // show new result on-screen.
};

/**
 *  Move horizontally left-wards, perpendicular to aiming direction
 * 'rtSide' vector points rightwards, perpendicular to aiming direction.
 */
GUIbox.prototype.camStrafe_L = function () {
    var rtSide = vec4.fromValues(
        Math.sin(this.camYaw), // x
        -Math.cos(this.camYaw), // y
        0.0,
        0.0
    ); // z, w (==0; vector, not point!)
    // rtSide is already unit length; no need to normalize.
    vec4.scale(rtSide, rtSide, -this.camSpeed); // scale length to set velocity,
    vec4.add(this.camAimPt, this.camAimPt, rtSide); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, rtSide);
    drawAll();
};

/**
 *  Move horizontally left-wards, perpendicular to aiming direction
 */
GUIbox.prototype.camStrafe_R = function () {
    var rtSide = vec4.fromValues(
        Math.sin(this.camYaw), // x
        -Math.cos(this.camYaw), // y
        0,
        0
    ); // z,w  (vector, not point; w=0)
    vec4.scale(rtSide, rtSide, this.camSpeed); // scale length to set velocity,
    vec4.add(this.camAimPt, this.camAimPt, rtSide); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, rtSide);
    drawAll();
};

// // ! ===================================for individual control button
// var hideGrid = false;
// function gridDisplay() {
//     if (hideGrid) {
//         //start
//         hideGrid = false;
//         document.querySelector("#showGrid").textContent = "Hide Grid";
//         document.querySelector(".title").style.textDecoration = "underline";
//         document.querySelector(".title").style.textDecorationStyle = "dotted";
//     } else {
//         hideGrid = true;
//         document.querySelector("#showGrid").textContent = "Show Grid";
//         document.querySelector(".title").style.textDecoration = "none";
//     }
// }
// var hideSphere = false;
// function sphereDisplay() {
//     if (hideSphere) {
//         //start
//         hideSphere = false;
//         document.querySelector("#showSphere").textContent = "Show Sphere";
//     } else {
//         hideSphere = true;
//         document.querySelector("#showSphere").textContent = "Hide Sphere";
//     }
// }

// var isTopView = false;
// function changeView() {
//     g_prevDx = 0;
//     g_prevDy = 0;
//     g_dx = 0;
//     g_dy = 0;

//     if (!isTopView) {
//         isTopView = true;
//         document.querySelector("#topView").textContent = "Front View";
//         (g_EyeX = 0.0), (g_EyeY = 4.25), (g_EyeZ = 4.25);
//         (g_LookX = 0.0), (g_LookY = 3.3), (g_LookZ = 3.5);
//     } else {
//         isTopView = false;
//         document.querySelector("#topView").textContent = "Top View";
//         (g_EyeX = 0.0), (g_EyeY = 0.0), (g_EyeZ = 4.25);
//         (g_LookX = 0.0), (g_LookY = 0.0), (g_LookZ = 0.0);
//     }
// }

// function initWindow() {
//     window.addEventListener("resize", resizeCanvas, false);
// }

// // ! ===================Keyboard event-handling Callbacks===========
// // ref: https://keycode.info/ http://learnwebgl.brown37.net/07_cameras/camera_rotating_motion.html
// function key123(ev) {
//     if (ev.keyCode == 48) {
//         // 0 reset
//         for (let index = 0; index < g_particleNum; index++) {
//             g_particleArray[index].runMode = 0;
//         }
//     } else if (ev.keyCode == 49) {
//         // 1 pause
//         for (let index = 0; index < g_particleNum; index++) {
//             g_particleArray[index].runMode = 1;
//         }
//     } else if (ev.keyCode == 50) {
//         // 2 step
//         for (let index = 0; index < g_particleNum; index++) {
//             g_particleArray[index].runMode = 2;
//         }
//     } else if (ev.keyCode == 51) {
//         // 3 run
//         for (let index = 0; index < g_particleNum; index++) {
//             g_particleArray[index].runMode = 3;
//         }
//     }
// }

// function cameraDistance() {
//     /* calculate the euclidean distance with lookAt and eye*/
//     x = g_LookX - g_EyeX;
//     y = g_LookY - g_EyeY;
//     z = g_LookZ - g_EyeZ;
//     return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
// }

// function keyAD(ev) {
//     let dist = cameraDistance();
//     let vec1 = [0, 1, 0];
//     let vec2 = [
//         (g_LookX - g_EyeX) / dist,
//         (g_LookY - g_EyeY) / dist,
//         (g_LookZ - g_EyeZ) / dist,
//     ];
//     let perpVec = math.cross(vec1, vec2); //perpendicular to forward direction
//     if (ev.keyCode == 65) {
//         // a left
//         g_EyeX += 0.1 * g_speed * perpVec[0];
//         g_EyeY += 0.1 * g_speed * perpVec[1];
//         g_EyeZ += 0.1 * g_speed * perpVec[2];
//         g_LookX += 0.1 * g_speed * perpVec[0];
//         g_LookY += 0.1 * g_speed * perpVec[1];
//         g_LookZ += 0.1 * g_speed * perpVec[2];
//     } else if (ev.keyCode == 68) {
//         // d right
//         g_EyeX -= 0.1 * g_speed * perpVec[0];
//         g_EyeY -= 0.1 * g_speed * perpVec[1];
//         g_EyeZ -= 0.1 * g_speed * perpVec[2];
//         g_LookX -= 0.1 * g_speed * perpVec[0];
//         g_LookY -= 0.1 * g_speed * perpVec[1];
//         g_LookZ -= 0.1 * g_speed * perpVec[2];
//     } else {
//         return;
//     }
// }

// var g_fogDist = new Float32Array([55, 80]);
// function keyWS(ev) {
//     let dist = cameraDistance();
//     if (ev.keyCode == 87) {
//         // s moving backward
//         g_EyeX += (0.1 * g_speed * (g_LookX - g_EyeX)) / dist; //sin theta
//         g_EyeY += (0.1 * g_speed * (g_LookY - g_EyeY)) / dist;
//         g_EyeZ += (0.1 * g_speed * (g_LookZ - g_EyeZ)) / dist;
//         g_LookX += (0.1 * g_speed * (g_LookX - g_EyeX)) / dist;
//         g_LookY += (0.1 * g_speed * (g_LookY - g_EyeY)) / dist;
//         g_LookZ += (0.1 * g_speed * (g_LookZ - g_EyeZ)) / dist;
//         if (g_fogDist[1] > g_fogDist[0]) g_fogDist[1] -= 1; // ! change fog visibility
//     } else if (ev.keyCode == 83) {
//         //  w moving forward
//         g_EyeX -= (0.1 * g_speed * (g_LookX - g_EyeX)) / dist;
//         g_EyeY -= (0.1 * g_speed * (g_LookY - g_EyeY)) / dist;
//         g_EyeZ -= (0.1 * g_speed * (g_LookZ - g_EyeZ)) / dist;
//         g_LookX -= (0.1 * g_speed * (g_LookX - g_EyeX)) / dist;
//         g_LookY -= (0.1 * g_speed * (g_LookY - g_EyeY)) / dist;
//         g_LookZ -= (0.1 * g_speed * (g_LookZ - g_EyeZ)) / dist;
//         g_fogDist[1] += 1; // ! change fog visibility
//     } else {
//         return;
//     }
// }

// function keyQE(ev) {
//     if (ev.keyCode == 81) {
//         // q
//         g_EyeY += 0.1 * g_speed;
//         g_LookY += 0.1 * g_speed;
//     } else if (ev.keyCode == 69) {
//         // e
//         g_EyeY -= 0.1 * g_speed;
//         g_LookY -= 0.1 * g_speed;
//     } else {
//         return;
//     }
// }

// var theta1 = Math.PI;
// function keyArrowRotateRight(ev) {
//     if (ev.keyCode == 39) {
//         // ->
//         theta1 -= 0.05;
//         console.log(Math.sin(theta1), Math.cos(theta1));
//         g_LookX = g_EyeX + 0.7 * g_speed * Math.sin(theta1);
//         g_LookZ = g_EyeZ + 0.7 * g_speed * Math.cos(theta1);
//     } else if (ev.keyCode == 37) {
//         // <-
//         theta1 += 0.05;
//         g_LookX = g_EyeX + 0.7 * g_speed * Math.sin(theta1);
//         g_LookZ = g_EyeZ + 0.7 * g_speed * Math.cos(theta1);
//     } else {
//         return;
//     }
// }

// var theta2 = 0;
// function keyArrowRotateUp(ev) {
//     //change x from -1 to 1
//     if (ev.keyCode == 38) {
//         // up ^
//         theta2 += 0.05;
//         g_LookY = g_EyeY + 0.5 * g_speed * Math.sin(theta2);
//     } else if (ev.keyCode == 40) {
//         // down v
//         theta2 -= 0.05;
//         g_LookY = g_EyeY + 0.5 * g_speed * Math.sin(theta2);
//     } else {
//         return;
//     }
// }

// var g_matlSel = 8;
// function materialKeyPress(ev) {
//     switch (ev.keyCode) {
//         case 77: // UPPER-case 'M' key:
//         case 109: // LOWER-case 'm' key:
//             g_matlSel = (g_matlSel + 1) % MATL_DEFAULT;
//             console.log(g_matlSel); // see materials_Ayerdi.js for list
//             break;
//         default:
//             break;
//     }
// }

// // for listening a key is being pressed/released: https://stackoverflow.com/questions/16345870/keydown-keyup-events-for-specific-keys
// var g_isCameraFixed = true;
// const cameraAction = {
//     fixCamera() {
//         g_isCameraFixed = true;
//         g_mousePosX = g_mousePosX_curr;
//         g_mousePosY = g_mousePosY_curr;
//     },
//     changeCamera() {
//         g_isCameraFixed = false;
//     },
// };
// const keyAction = {
//     Alt: { keydown: cameraAction.changeCamera, keyup: cameraAction.fixCamera },
//     Meta: { keydown: cameraAction.changeCamera, keyup: cameraAction.fixCamera },
//     Shift: {
//         keydown: cameraAction.changeCamera,
//         keyup: cameraAction.fixCamera,
//     },
// };
// const keyHandler = (ev) => {
//     if (ev.repeat) return;
//     if (!(ev.key in keyAction) || !(ev.type in keyAction[ev.key])) return;
//     keyAction[ev.key][ev.type]();
// };
// ["keydown", "keyup"].forEach((evType) => {
//     window.addEventListener(evType, keyHandler);
// });

// // ! =================== Mouse event-handling Callbacks===========
// var g_mousePosX; //prev
// var g_mousePosY; //prev
// var g_mousePosX_curr;
// var g_mousePosY_curr;

// (function () {
//     //from https://stackoverflow.com/questions/7790725/javascript-track-mouse-position
//     var mousePos;
//     document.onmousemove = handleMouseMove;
//     setInterval(getMousePosition, 100); // setInterval repeats every X ms
//     function handleMouseMove(event) {
//         var dot, eventDoc, doc, body, pageX, pageY;
//         event = event || window.event; // IE-ism
//         // If pageX/Y aren't available and clientX/Y are,
//         // calculate pageX/Y - logic taken from jQuery.
//         // (This is to support old IE)
//         if (event.pageX == null && event.clientX != null) {
//             eventDoc = (event.target && event.target.ownerDocument) || document;
//             doc = eventDoc.documentElement;
//             body = eventDoc.body;

//             event.pageX =
//                 event.clientX +
//                 ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
//                 ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
//             event.pageY =
//                 event.clientY +
//                 ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
//                 ((doc && doc.clientTop) || (body && body.clientTop) || 0);
//         }
//         mousePos = {
//             x: event.pageX,
//             y: event.pageY,
//         };
//     }

//     function getMousePosition() {
//         var pos = mousePos;
//         if (pos && g_isCameraFixed) {
//             g_mousePosX = pos.x;
//             g_mousePosY = pos.y;
//             if (g_dx && g_dy) {
//                 g_prevDx = g_dx;
//                 g_prevDy = g_dy;
//             }
//         } else if (pos && !g_isCameraFixed) {
//             g_mousePosX_curr = pos.x;
//             g_mousePosY_curr = pos.y;
//             // // to polar coordinate
//             // let mouseTheta = calMouseAngle(canvas.width/2, canvas.height/2, pos.x, pos.y);
//             // let mouseDist = calMouseDist(canvas.width/2, canvas.height/2, pos.x, pos.y);

//             //calculate mouse movement dx and dy
//             g_dx = (g_mousePosX - pos.x) / (canvas.width / 2);
//             g_dy = (g_mousePosY - pos.y) / (canvas.height / 2);
//             if (g_dx != 0 || g_dy != 0) {
//                 // console.log("increment",0.7 * g_speed * Math.sin(dx+Math.PI), 0.5 * g_speed * Math.sin(dy))
//                 // console.log("look at:",g_LookX, g_LookY, g_LookZ);
//                 if (g_prevDx && g_prevDy && g_prevDx != 0 && g_prevDy != 0) {
//                     g_dx += g_prevDx;
//                     g_dy += g_prevDy;
//                 }
//                 if (!isTopView) {
//                     // g_EyeX = 0.0, g_EyeY = 0.0, g_EyeZ = 4.25;
//                     // g_LookX = 0.0, g_LookY = 0.0, g_LookZ = 0.0;
//                     g_LookX = g_EyeX + 0.7 * g_speed * Math.sin(g_dx + Math.PI); //left/right
//                     g_LookZ = g_EyeZ + 0.7 * g_speed * Math.cos(g_dx + Math.PI); //left/right
//                     g_LookY = g_EyeY + 0.5 * g_speed * Math.sin(g_dy); //up/down
//                 } else {
//                     // g_EyeX = 0.0, g_EyeY = 4.25, g_EyeZ = 4.25;
//                     // g_LookX = 0.0, g_LookY = 3.3, g_LookZ = 3.5;
//                     g_LookX = g_EyeX + 0.7 * g_speed * Math.sin(g_dx + Math.PI); //left/right
//                     g_LookY = g_EyeY + 0.5 * g_speed * Math.sin(g_dy) - 0.95; //up/down
//                 }
//             }
//         }
//     }
// })();

// function calMouseDist(x1, y1, x2, y2) {
//     return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
// }

// function calMouseAngle(x1, y1, x2, y2) {
//     /* x1, y1 - center, x2, y2 - current position */
//     var cosa =
//         (x1 - x2) / Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
//     var a = Math.acos(cosa); // range from 0 to PI
//     if ((x1 - x2 < 0 && y1 - y2 < 0) || (x1 - x2 >= 0 && y1 - y2 < 0)) {
//         //range from 0-2pi
//         a = 2 * Math.PI - a;
//     }
//     return a;
// }

// function mouseWheel(en) {
//     if (en.deltaY < 0) {
//         g_viewScale -= 0.05;
//     } else if (en.deltaY > 0) {
//         g_viewScale += 0.05;
//     }
// }

// var quatMatrix = new Matrix4();
// var qNew = new Quaternion(0, 0, 0, 1); // most-recent mouse drag's rotation
// var qTot = new Quaternion(0, 0, 0, 1); // 'current' orientation (made from qNew)
// function dragQuat(xdrag, ydrag) {
//     //from controlQuaterion.js
//     var res = 5;
//     var qTmp = new Quaternion(0, 0, 0, 1);
//     var dist = Math.sqrt(xdrag * xdrag + ydrag * ydrag);
//     qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist * 150.0); // (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
//     qTmp.multiply(qNew, qTot); // apply new rotation to current rotation.
//     qTot.copy(qTmp);
// }
