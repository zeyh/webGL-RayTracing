/**
 * modified from JT_GUIbox-Lib
 */
"use strict";


var params = {
    Lamp1PosX: 1.00,
    Lamp1PosY: -4.00,
    Lamp1PosZ: 4.00,
    Lamp2PosX: -7,
    Lamp2PosY: -8,
    Lamp2PosZ: 8,
}
var datgui = new dat.GUI( );
datgui.close();
datgui.domElement.id = 'datgui';

function setRecursionDepth(selection){
    g_recurDepth = selection.value;
}

function setControlPanel() {
    datgui.add(params, 'Lamp1PosX', -10.0, 10.0).onChange(
        function (value) {
            g_lamp0.I_pos.elements[0] = value;
        }
    );
    datgui.add(params, 'Lamp1PosY', -20.0, 20.0).onChange(
        function (value) {
            g_lamp0.I_pos.elements[1] = value;
        }
    );
    datgui.add(params, 'Lamp1PosZ', -10.0, 10.0).onChange(
        function (value) {
            g_lamp0.I_pos.elements[2] = value;
        }
    );
    datgui.add(params, 'Lamp2PosX', -10.0, 10.0).onChange(
        function (value) {
            g_lamp1.I_pos.elements[0] = value;
        }
    );
    datgui.add(params, 'Lamp2PosY', -20.0, 20.0).onChange(
        function (value) {
            g_lamp1.I_pos.elements[1] = value;
        }
    );
    datgui.add(params, 'Lamp2PosZ', -10.0, 10.0).onChange(
        function (value) {
            g_lamp1.I_pos.elements[2] = value;
        }
    );
}


/**
 *  capture and respond to all keyboard & mouse inputs/outputs.
 */
function GUIbox() {
    //=============================================================================
    //==============================================================================
    // CONSTRUCTOR for one re-usable 'GUIbox' object that holds all data and fcns
    // needed to capture and respond to all user inputs/outputs.

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
    var that = this; // (local) reference to the current GUIbox object;
    // used in anonymous functions to restore simple
    // expected behavior of 'this' inside GUIbox functions.
    // MOUSE:--------------------------------------------------
    window.addEventListener("mousedown", function (mev) {
        return that.mouseDown(mev);
    });
    // (After each 'mousedown' event, browser calls this anonymous method that
    //    does nothing but return the 'that' object's mouseDown() method.
    //    WHY? to ensure proper operation of 'this' within the mouseDown() fcn.)
    window.addEventListener("mousemove", function (mev) {
        return that.mouseMove(mev);
    });
    window.addEventListener("mouseup", function (mev) {
        return that.mouseUp(mev);
    });

    window.addEventListener(
        "keydown",
        function (kev) {
            return that.keyDown(kev);
        },
        false
    );
    // After each 'keydown' event, call the 'GUIbox.keyDown()' function; 'false'
    // (default) means event handler executed in  'bubbling', not 'capture')
    // ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
    window.addEventListener(
        "keyup",
        function (kev) {
            return that.keyUp(kev);
        },
        false
    );

    // REPORT initial mouse-drag totals on-screen:
    document.getElementById("MouseDragResult").innerHTML =
        "Mouse Drag totals (CVV coords):\t" +
        this.xMdragTot.toFixed(5) +
        ", \t" +
        this.yMdragTot.toFixed(5);

    this.camYaw = Math.PI / 2.0; // (initially I aim in +y direction)

    this.camYawInit = this.camYaw; // save initial value for use in mouseMove().
    this.camPitch = 0.0; // Initially aim at horizon; level with xy plane

    this.camPitchInit = this.camPitch; // save initial value for mouseMove().
    this.camEyePt = vec4.fromValues(0, -8, 2, 1); // initial camera position
    this.camAimPt = vec4.fromValues(
        // point on yaw-pitch sphere around eye:
        this.camEyePt[0] + Math.cos(this.camYaw) * Math.cos(this.camPitch), // x
        this.camEyePt[1] + Math.sin(this.camYaw) * Math.cos(this.camPitch), // y
        this.camEyePt[2] + Math.sin(this.camPitch), // z
        1.0
    ); // w.
    this.camUpVec = vec4.fromValues(
        // +90deg == Math.PI/2
        Math.cos(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2), // x
        Math.sin(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2), // y
        Math.sin(this.camPitch + Math.PI / 2), // z
        0.0
    ); // w=0 for vectors, =1 for points.
    this.camSpeed = 0.5; // world-space distance moved per keystroke

    this.camFovy = 45.0; // vertical field-of-view in degrees, measured from
    // bottom to top of camera image.
    this.camAspect = 1.0; // camera-image width/height (sets horizontal FOV)
    this.camNear = 1.0; // distance from Center of Projection to viewing plane
    // (where we define left,bot,top values from Fovy & aspect)
    this.camFar = 10000; // distance to frustum's outermost clipping plane
    // (for WebGL camera only--ignored by ray-tracer)
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
    //=============================================================================
    // Called when user MOVES the mouse, with or without a button pressed down.
    // 									(Which button?   console.log('mev.button=' + mev.button); )
    // 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage
    //	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
    //  That's not good for us -- convert to CVV coordinates instead:

    //console.log("GUIbox.mouseMove(): isDrag==", this.isDrag);
    if (this.isDrag == false) return; // IGNORE all mouse-moves except 'dragging'
    //	console.log("called GUIbox.mouseMove(mev)");
    this.mouseToCVV(mev); // convert to CVV coordinates:
    // (result in this.xCVV, this.yCVV)
    // find how far we dragged the mouse:
    this.xMdragTot += this.xCVV - this.xMpos; // Accumulate change-in-mouse-position,&
    this.yMdragTot += this.yCVV - this.yMpos;
    this.xMpos = this.xCVV; // Make next drag-measurement from here.
    this.yMpos = this.yCVV;

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
    this.camAim(this.xMdragTot, -this.yMdragTot); // why negative y drag? feels
    drawAll(); // we MOVED the camera -- re-draw everything!
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
            g_myScene.makeRayTracedImage(); // (near end of traceSupplement.js)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll(); // redraw BOTH viewports onscreen.
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
            g_myScene.makeRayTracedImage(); // (near end of traceSupplement.js)
            rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
            rayView.reload(); // re-transfer VBO contents and texture-map contents
            drawAll();
            break;
        //------------------WASD navigation-----------------
        case "KeyQ":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.keyDown() q/Q key. Strafe DOWN!";
            this.camStrafe_Dn();
            break;
        case "KeyE":
            document.getElementById("KeyDown").innerHTML =
                "GUIbox.keyDown() eE key. Strafe UP!";
            this.camStrafe_Up();
            break;
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

GUIbox.prototype.camAim = function (xRad, yRad) {
    //==============================================================================
    // Change camera aiming direction by pitching 'xRad' radians above horizon (the
    // initial pitch amount), and yawing 'yRad' radians away from initial yaw amount.
    // (measured in counter-clockwise (CCW) radians in xy plane from +x axis)
    // NOTE this function gets called by 'GUIbox.mouseDrag()' and by keyDown().

    this.camYaw = this.camYawInit + xRad; // Horiz drag in radians
    this.camPitch = this.camPitchInit + yRad; // Vert drag in radians
    if (this.camYaw < -Math.PI) {
        // keep yaw angle values between +/- PI
        this.camYaw += 2 * Math.PI;
    } else if (this.camYaw > Math.PI) {
        this.camYaw -= 2 * Math.PI;
    }
    if (this.camPitch < -Math.PI / 2) {
        // ALSO, don't let pitch go below -90deg
        this.camPitch = -Math.PI / 2; // (-Z aiming direction)
        // We want y-axis mouse-dragging to set camera pitch. When pitch reaches its
        // lowermost limit of -PI/2, what's the mouse-drag value yMdragTot?
        // camPitch = camPitchInit - yMdragTot == -PI/2; add yMdragTot to both sides:
        //            camPitchInit == yMdragTot -PI/2;  then add PI/2 to both sides:
        //            (camPitchInit + PI/2) == yMdragTot;
        // THUS ANY mouse-drag totals > than this amount will get ignored!
        this.yMdragTot = this.camPitchInit + Math.PI / 2; // upper limit on yMdragTot.
    } else if (this.camPitch > Math.PI / 2) {
        // AND never let pitch go above +90deg:
        this.camPitch = Math.PI / 2; // (+Z aiming direction)
        this.yMdragTot = this.camPitchInit - Math.PI / 2; // lower limit on yMdragTot.
    }
    // update camera aim point using spherical coords:
    this.camAimPt[0] =
        this.camEyePt[0] + Math.cos(this.camYaw) * Math.cos(this.camPitch); // x
    this.camAimPt[1] =
        this.camEyePt[1] + Math.sin(this.camYaw) * Math.cos(this.camPitch); // y
    this.camAimPt[2] = this.camEyePt[2] + Math.sin(this.camPitch); // z
    // update the 'up' vector too (pitch up by an additional +90 degrees)
    this.camUpVec[0] =
        Math.cos(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2);
    this.camUpVec[1] =
        Math.sin(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2);
    this.camUpVec[2] = Math.sin(this.camPitch + Math.PI / 2);
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

GUIbox.prototype.camStrafe_Up = function () {
    //==============================================================================
    // Move upwards, perpendicular to aiming direction, without changing
    // aiming direction or pitch angle. CAREFUL! this is *NOT* just changing camera
    // altitude (Z value in world space), but instead moving in the 'up-vector'
    // direction calculated in mouseMove() above.
    var upSide = vec4.clone(this.camUpVec); // make a local copy of this VECTOR
    upSide[3] = 0.0; // set w=0 to its a vec4 VECTOR.

    vec4.scale(upSide, upSide, this.camSpeed); // scale length to set velocity;
    // console.log('upSide:', upSide);
    // console.log('BEFORE\n camAimPt:', this.camAimPt, '\ncamEyePt:', this.camEyePt);

    vec4.add(this.camAimPt, this.camAimPt, upSide); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, upSide);
    //console.log('AFTER\n camAimPt:', this.camAimPt, '\ncamEyePt:', this.camEyePt);

    drawAll();
};

GUIbox.prototype.camStrafe_Dn = function () {
    //==============================================================================
    // Move downwards, perpendicular to aiming direction, without changing
    // aiming direction or pitch angle.  CAREFUL! this is *NOT* just changing camera
    // altitude (Z value in world-space), but instead moving in the 'up-vector;
    // direction constructed in mouseMove() above.
    var upSide = vec4.clone(this.camUpVec); // make a local copy of this VECTOR
    upSide[3] = 0.0; // set w=0 to its a vec4 VECTOR.

    vec4.scale(upSide, upSide, -this.camSpeed); // scale length to set -velocity;
    vec4.add(this.camAimPt, this.camAimPt, upSide); // add to BOTH points.
    vec4.add(this.camEyePt, this.camEyePt, upSide);
    drawAll();
};
