function CScene() {
    this.RAY_EPSILON = 1.0e-15; // ray-tracer precision limits; treat
    this.imgBuf = g_myPic;
    this.eyeRay = new CRay();
    this.rayCam = new CCamera();
    this.item = [];
}

CScene.prototype.setImgBuf = function (nuImg) {
    this.rayCam.setSize(nuImg.xSiz, nuImg.ySiz);
    this.imgBuf = nuImg; // set our ray-tracing image destination.
};

CScene.prototype.initScene = function (num) {
    if (num == undefined) num = 0; // (in case setScene() called with no arg.)

    this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);

    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);

    this.setImgBuf(g_myPic); // rendering target: our global CImgBuf object

    // sky
    this.skyColor = vec4.fromValues(0.3, 1.0, 1.0, 1.0); // cyan/bright blue
    this.item.length = 0;
    var iNow = 0; // index of the last CGeom object put into item[] array

    // set up new scene:
    switch (num) {
        case 0:
            this.item.push(new CGeom(PLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.
            break;
        case 1:
            this.item.push(new CGeom(PLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.

            // * sphere
            this.item.push(new CGeom(SPHERE)); 
            iNow = this.item.length -1;    
            this.item[iNow].setIdent();   
            this.item[iNow].rayTranslate(0,-1.0, 1.0); 

            // * sphere
            this.item.push(new CGeom(SPHERE)); 
            iNow = this.item.length -1;    
            this.item[iNow].setIdent();   
            this.item[iNow].rayTranslate(-2,-1.0, 1.0); 
            this.item[iNow].rayScale(0.2, 0.2, 1.0); 

            break;
        case 2:
            console.log(
                "JT_tracer0-Scene file: CScene.initScene(",
                num,
                ") NOT YET IMPLEMENTED."
            );
            this.initScene(0); // use default scene
            break;
        default:
            console.log(
                "JT_tracer0-Scene file: CScene.initScene(",
                num,
                ") NOT YET IMPLEMENTED."
            );
            this.initScene(0); // init the default scene.
            break;
    }
};;

CScene.prototype.makeRayTracedImage = function () {
    this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);

    this.setImgBuf(this.imgBuf); // just in case: this ensures our ray-tracer

    var colr = vec4.create(); // floating-point RGBA color value
    var hit = 0;
    var idx = 0; // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
    var i, j; // pixel x,y coordinate (origin at lower left; integer values)
    var k; // item[] index; selects CGeom object we're currently tracing.

    this.pixFlag = 0; // DIAGNOSTIC: g_myScene.pixFlag == 1 at just one pixel
    var myHit = new CHit(); // holds the nearest ray/grid intersection (if any)

    for (j = 0; j < this.imgBuf.ySiz; j++) {// for the j-th row of pixels.
        for (i = 0; i < this.imgBuf.xSiz; i++) { // and the i-th pixel on that row,

            let tmp = 4;
            for(let n=0; n < tmp; n++){
                var i_rand = i + 1/tmp * (Math.random() + n);
                var j_rand = j + 1/tmp * (Math.random() + n);
                this.rayCam.setEyeRay(this.eyeRay, i_rand, j_rand); // create ray for pixel (i,j)

            }
            // this.rayCam.setEyeRay(this.eyeRay, i, j); // create ray for pixel (i,j)

            
            if (i == this.imgBuf.xSiz / 2 && j == this.imgBuf.ySiz / 4) {
                this.pixFlag = 1; // pixFlag==1 for JUST ONE pixel
                console.log( "CScene.makeRayTracedImage() is at pixel [",i, ", ",j, "].","by the cunning use of flags. (Eddie Izzard)");
            } else {
                this.pixFlag = 0;
            } 

            // Trace a new eyeRay thru all CGeom items: ------------------------------
            myHit.init(); // start by clearing our 'nearest hit-point', and
            for (k = 0; k < this.item.length; k++) {// for every CGeom in item[] array,
                this.item[k].traceMe(this.eyeRay, myHit); // trace eyeRay thru it,
            } // & keep nearest hit point in myHit.

            /*
            if(this.pixFlag == 1) { // print values during just one selected pixel
                console.log("flag: x,y:myHit", i,j, myHit);
            }
            */

            // Find eyeRay color from myHit-----------------------------------------
            if (myHit.hitNum == 0) { // use myGrid tracing to determine color
                vec4.copy(colr, myHit.hitGeom.gapColor);
            } else if (myHit.hitNum == 1) {
                vec4.copy(colr, myHit.hitGeom.lineColor);
            } else { // if myHit.hitNum== -1)
                vec4.copy(colr, this.skyColor);
            }

            // Set pixel color in our image buffer------------------------------------
            idx = (j * this.imgBuf.xSiz + i) * this.imgBuf.pixSiz; // Array index at pixel (i,j)
            this.imgBuf.fBuf[idx] = colr[0];
            this.imgBuf.fBuf[idx + 1] = colr[1];
            this.imgBuf.fBuf[idx + 2] = colr[2];
        }
    }
    this.imgBuf.float2int(); // create integer image from floating-point buffer.
};
