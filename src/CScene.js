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
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(1, 1, 1);
            this.item[iNow].rayTranslate(2, 1, 1.0);
            this.item[iNow].setMaterial(8);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(0.3, 1, 0.3);
            this.item[iNow].rayTranslate(4, 1, 3);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(12);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(0.5, 0.5, 2);
            this.item[iNow].rayTranslate(-5, 1.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(14);

            // * disk
            this.item.push(new CGeom(RT_DISK));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(0.2, 0.4, 0.0);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 1, 0);
            this.item[iNow].rayScale(2, 1, 0.3);
            this.item[iNow].setMaterial(2);

            // * disk
            this.item.push(new CGeom(RT_DISK));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].rayTranslate(0.2, 0.4, 0.0);
            this.item[iNow].rayRotate(0.3 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(0.4, 1.2, 0.3);
            this.item[iNow].setMaterial(2);

            // * disk
            this.item.push(new CGeom(RT_DISK));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].rayTranslate(0.2, 0.4, 0.0);
            this.item[iNow].rayRotate(0.4 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(1, 0.3, 2.3);
            this.item[iNow].setMaterial(1);

            break;
        case 1:
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(0.8, 0.6, 0.4);
            this.item[iNow].rayTranslate(0, -3.2, 1.0);
            this.item[iNow].setMaterial(12);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(0.3, 3.3, 0.3);
            this.item[iNow].rayTranslate(3, 1.2, 1.0);
            this.item[iNow].setMaterial(6);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayScale(0.1, 4.6, 0.4);
            this.item[iNow].rayTranslate(0, 0.2, 0.0);
            this.item[iNow].setMaterial(13);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.3 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(0.2, 0.3, 1.3);
            this.item[iNow].rayTranslate(0.2, 0.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 1, 0);
            this.item[iNow].setMaterial(10);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.3 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(0.2, 0.3, 1.3);
            this.item[iNow].rayTranslate(0.2, 1.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].setMaterial(10);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayTranslate(0, 2.4, 1.0);
            this.item[iNow].rayScale(0.8, 0.2, 1);
            this.item[iNow].rayRotate(0.3 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(14);

            break;
        case 2:
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.
            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(1, 1, 0.3);
            this.item[iNow].rayTranslate(1.2, 1.4, 1.0);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(18);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(1, 1, 0.3);
            this.item[iNow].rayTranslate(1.2, 1.4, 1.3);
            this.item[iNow].rayRotate(0.3 * Math.PI, 0, 1, 0);
            this.item[iNow].setMaterial(18);

            // * disk
            this.item.push(new CGeom(RT_DISK));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].rayTranslate(1.2, 0.4, -3.0);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(1, 1, 0.3);
            this.item[iNow].setMaterial(19);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].setMaterial(6);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(1.2, 1.4, 0.2);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(0.3, 0.5, 0.3);
            this.item[iNow].setMaterial(7);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(-1, 2.4, 1.0);
            this.item[iNow].rayRotate(0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(0.6, 1.2, 0.3);
            this.item[iNow].setMaterial(8);
            break;
        case 3:
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(1.2, 1.4, 1.5);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(0.3, 2, 0.3);
            this.item[iNow].setMaterial(20);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(1.2, 1.4, 0.2);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(2, 0.1, 0.3);
            this.item[iNow].setMaterial(20);

            // * sphere
            this.item.push(new CGeom(RT_SPHERE));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayTranslate(1.2, 1.4, 1.5);
            this.item[iNow].rayRotate(0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].rayScale(0.3, 0.5, 2);
            this.item[iNow].setMaterial(20);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.3 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(0.2, 0.3, 2.3);
            this.item[iNow].rayTranslate(-3.2, 0.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(10);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.3 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(0.2, 2, 0.3);
            this.item[iNow].rayTranslate(2.2, 0.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 1, 0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 1, 0, 0);
            this.item[iNow].setMaterial(10);

            // * cube
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();
            this.item[iNow].rayRotate(0.3 * Math.PI, 1, 0, 0);
            this.item[iNow].rayScale(1.2, 0.3, 0.3);
            this.item[iNow].rayTranslate(-0.2, 2.2, 1.0);
            this.item[iNow].rayRotate(-0.8 * Math.PI, 0, 0, 1);
            this.item[iNow].setMaterial(13);

            break;
        default:
            console.log(
                "JT_tracer0-Scene file: CScene.initScene(",
                num,
                ") NOT YET IMPLEMENTED."
            );
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.
            break;
    }
};

CScene.prototype.traceGeom = function (ray, myHit) {
    let hits = new CHitList(ray);
    for (k = 0; k < this.item.length; k++) {
        if(!myHit || myHit.hitGeom.shapeType != this.item[k].shapeType){
            let newHit = hits.add();
            this.item[k].traceMe(ray, newHit); // trace eyeRay thru it,
        }
    }
    return hits;
};
CScene.prototype.makeRayTracedImage = function () {
    this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);

    this.setImgBuf(this.imgBuf); // just in case: this ensures our ray-tracer

    var hit = 0;
    var idx = 0; // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
    var i, j; // pixel x,y coordinate (origin at lower left; integer values)
    var k; // item[] index; selects CGeom object we're currently tracing.

    this.pixFlag = 0; // DIAGNOSTIC: g_myScene.pixFlag == 1 at just one pixel

    for (j = 0; j < this.imgBuf.ySiz; j++) {
        // for the j-th row of pixels.
        for (i = 0; i < this.imgBuf.xSiz; i++) {
            // and the i-th pixel on that row,
            var colr = vec4.create(); // floating-point RGBA color value
            for (let n0 = 0; n0 < g_AAcode; n0++) {
                for (let n1 = 0; n1 < g_AAcode; n1++) {
                    this.eyeRay = new CRay();
                    let randX = g_isJitter ? Math.random() : 0.5;
                    let randY = g_isJitter ? Math.random() : 0.5;
                    let posX = i + (n0 + randX) / g_AAcode - 0.5;
                    let posY = j + (n1 + randY) / g_AAcode - 0.5;
                    this.rayCam.setEyeRay(this.eyeRay, posX, posY); // create ray for pixel (i,j)
                    let hits = this.traceGeom(this.eyeRay)
                    if (hits.hitList.length > 0) {
                        let tmp = this.getColor(hits, this.rayCam.eyePt);
                        if(tmp){
                            vec4.add(colr,colr,tmp);
                        }

                    }
                }
            }
            vec4.scale(colr, colr, 1 / (g_AAcode * g_AAcode));
            idx = (j * this.imgBuf.xSiz + i) * this.imgBuf.pixSiz; // Array index at pixel (i,j)
            this.imgBuf.fBuf[idx] = colr[0];
            this.imgBuf.fBuf[idx + 1] = colr[1];
            this.imgBuf.fBuf[idx + 2] = colr[2];
        }
    }
    this.imgBuf.float2int(); // create integer image from floating-point buffer.
};

var g_headLightOn = true;
var g_worldLightOn = true;
var g_recurDepth = 1;
var g_falloff = 500;
function calDist(hits, i) {
    return Math.sqrt(
        Math.pow(hits.ray.orig[0] - hits.hitList[i].hitPt[0], 2) +
            Math.pow(hits.ray.orig[1] - hits.hitList[i].hitPt[1], 2) +
            Math.pow(hits.ray.orig[2] - hits.hitList[i].hitPt[2], 2)
    );
}

CScene.prototype.getColor = function (hits, eyePos) {
    let color0 = vec4.create();
    let color1 = vec4.create();
    globalThis.HEADLIGHT = 0;
    let light0 = new Light(HEADLIGHT);
    light0.updateLightPos();
    globalThis.WORLDLIGHT = 1;
    let light1 = new Light(WORLDLIGHT);
    light1.updateLightPos();

    let myHit = hits.closest();
    if(myHit.hitNum == -1){
        return;
    }
    // !this.isShadow(myHit, WORLDLIGHT, hits)
    if (g_headLightOn) {
        color0 = light0.getColor(myHit, eyePos);
        rcolor0 = this.getReflect(myHit, eyePos, light0);
        vec4.add(color0, color0, rcolor0);
        // console.log(rcolor0)
        // console.log(reak1)
    }
    if (g_worldLightOn) {
        color1 = light1.getColor(myHit, eyePos);
        rcolor1 = this.getReflect(myHit, eyePos, light1);
        vec4.add(color1, color1, rcolor1);
    } else {
        color1 = vec4.fromValues(0, 0, 0, 1);
    }
    vec4.add(color1, color0, color1);

    // console.log(color1)
    // console.log(break1)

    return color1;
};

CScene.prototype.isShadow = function (myHit, lightIdx, hits) {
    let isInShadow = false;

    //get a copy of current pos and light
    let curLight = new Light(lightIdx);
    let curLightPos = vec4.create();
    vec4.copy(curLightPos, curLight.I_pos);

    let curRay = vec4.create();
    vec4.copy(curRay, myHit.hitPt);

    let rayDir = vec4.create();
    vec4.subtract(rayDir, curLightPos, curRay);
    vec4.normalize(rayDir, rayDir);

    let curHitList = new CHitList(curRay);
    for (k = 0; k < this.item.length; k++) {
        // for every CGeom in item[] array,
        let curHit = new CHit();
        curHitList.hitList.push(curHit);
        this.item[k].traceMe(this.eyeRay, curHit); // trace eyeRay thru it,
    }

    for (var i = 0; i < curHitList.hitList.length; i++) {
        if (curHitList.hitList[i].hitGeom.shapeType != myHit.hitGeom.shapeType
            && curHitList.hitList[i].t0 < (curLightPos[0] - myHit.modelHitPt[0]) / rayDir[0]) {
            isInShadow = true;
        }
    }
    return isInShadow;
};

CScene.prototype.getReflect = function (myHit, eyePos, curLight) {
    let color =  vec4.create();
    if(g_recurDepth > 0){
        for(let i=0; i<g_recurDepth; i++){
            let rRay = new CRay();
            vec4.copy(rRay.orig, myHit.hitPt);
            vec4.copy(rRay.dir, myHit.refl);
            let rHits = this.traceGeom(rRay, myHit);
            let curRHit = rHits.closest();
            if(curRHit.hitNum == -1){
                continue;
            }
            vec4.scaleAndAdd(color, color, curLight.getColor(curRHit, eyePos), curLight.KShiny/g_falloff);
        }
    }
    return color;
};

var g_lamp0 = new LightsT(); //world-light
var g_lamp1 = new LightsT(); //another light source
var g_matl0 = new Material();
g_matl0.setMatl(3);

function Light(idx) {
    this.idx = idx;
    this.setDefaultLight();
    if (this.idx == 0) {
        this.I_pos = vec4.fromValues(
            g_lamp0.I_pos.elements[0],
            g_lamp0.I_pos.elements[1],
            g_lamp0.I_pos.elements[2],
            1.0
        );
        this.I_ambi = vec4.fromValues(
            g_lamp0.I_ambi.elements[0],
            g_lamp0.I_ambi.elements[1],
            g_lamp0.I_ambi.elements[2],
            1.0
        );
        this.I_diff = vec4.fromValues(
            g_lamp0.I_diff.elements[0],
            g_lamp0.I_diff.elements[1],
            g_lamp0.I_diff.elements[2],
            1.0
        );
        this.I_spec = vec4.fromValues(
            g_lamp0.I_spec.elements[0],
            g_lamp0.I_spec.elements[1],
            g_lamp0.I_spec.elements[2],
            1.0
        );
    } else {
        this.I_pos = vec4.fromValues(
            g_lamp1.I_pos.elements[0],
            g_lamp1.I_pos.elements[1],
            g_lamp1.I_pos.elements[2],
            1.0
        );
        this.I_ambi = vec4.fromValues(
            g_lamp1.I_ambi.elements[0],
            g_lamp1.I_ambi.elements[1],
            g_lamp1.I_ambi.elements[2],
            1.0
        );
        this.I_diff = vec4.fromValues(
            g_lamp1.I_diff.elements[0],
            g_lamp1.I_diff.elements[1],
            g_lamp1.I_diff.elements[2],
            1.0
        );
        this.I_spec = vec4.fromValues(
            g_lamp1.I_spec.elements[0],
            g_lamp1.I_spec.elements[1],
            g_lamp1.I_spec.elements[2],
            1.0
        );
    }
    this.setDefaultMat();
    this.matl;
}

Light.prototype.getColor = function (myHit, eyePos) {
    this.setDefaultMat(myHit.hitGeom.matl);
    if(myHit.hitNum == -1){
        return
    }
    let mat = myHit.hitGeom.matl;
    //emissive
    let color = vec4.clone(mat.K_emit);
    
    //ambient
    let ambient = vec4.create();
    vec4.multiply(ambient, this.I_ambi, mat.K_ambi);
    vec4.add(color, color, ambient);

    //diffse
    let diffuse = vec4.clone(this.I_diff);
    vec4.multiply(diffuse, diffuse, mat.K_diff);

    let lightDirection = vec4.create();
    vec4.subtract(lightDirection, this.I_pos, myHit.hitPt);
    vec4.normalize(lightDirection, lightDirection);
    let nDotL0 = Math.max(vec4.dot(lightDirection, myHit.surfNorm), 0.0);

    vec4.scale(diffuse, diffuse, nDotL0);
    vec4.add(color, color, diffuse);

    //specular
    let speculr = vec4.clone(this.I_spec);
    vec4.multiply(speculr, speculr, mat.K_spec);

    let H = vec4.create();
    vec4.add(H, lightDirection, myHit.viewN);
    vec4.normalize(H,H);
    let nDotH = Math.max(vec4.dot(H, myHit.surfNorm), 0.0);
    let e64 = Math.pow(nDotH, mat.K_shiny);
    vec4.scale(speculr, speculr, e64);

    vec4.add(color, color, speculr);

    color[3] = 1.0;
    return color;
};

Light.prototype.updateLightPos = function () {
    if (this.idx == 0) {
        this.I_pos = vec4.fromValues(
            g_lamp0.I_pos.elements[0],
            g_lamp0.I_pos.elements[1],
            g_lamp0.I_pos.elements[2],
            1.0
        );
    } else {
        this.I_pos = vec4.fromValues(
            g_lamp1.I_pos.elements[0],
            g_lamp1.I_pos.elements[1],
            g_lamp1.I_pos.elements[2],
            1.0
        );
    }
};

Light.prototype.setDefaultLight = function () {
    //worldlight
    g_lamp0.I_pos.elements.set([
        params.Lamp1PosX,
        params.Lamp1PosY,
        params.Lamp1PosZ,
    ]);
    g_lamp0.I_ambi.elements.set([1.0, 1.0, 1.0]);
    g_lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
    g_lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);

    //headlight
    g_lamp1.I_pos.elements.set([
        params.Lamp2PosX,
        params.Lamp2PosY,
        params.Lamp2PosZ,
    ]);
    g_lamp1.I_ambi.elements.set([0.6, 0.6, 0.6]);
    g_lamp1.I_diff.elements.set([1.0, 1.0, 1.0]);
    g_lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);
};

Light.prototype.setDefaultMat = function (matl) {
    if(matl == null){
        matl = g_matl0;
    }
    this.matl = matl;
    this.Ka = vec4.fromValues(
        matl.K_ambi[0],
        matl.K_ambi[1],
        matl.K_ambi[2],
        matl.K_ambi[3]
    );
    this.Kd = vec4.fromValues(
        matl.K_diff[0],
        matl.K_diff[1],
        matl.K_diff[2],
        matl.K_diff[3]
    );
    this.Ks = vec4.fromValues(
        matl.K_spec[0],
        matl.K_spec[1],
        matl.K_spec[2],
        matl.K_spec[3]
    );
    this.Ke = vec4.fromValues(
        matl.K_emit[0],
        matl.K_emit[1],
        matl.K_emit[2],
        matl.K_emit[3]
    );
    this.KShiny = matl.K_shiny;
};
