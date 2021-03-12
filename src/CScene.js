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
            break;
        case 1:
            this.item.push(new CGeom(RT_GNDPLANE)); // Append gnd-plane to item[] array
            iNow = this.item.length - 1; // get its array index.

            // * sphere
            this.item.push(new CGeom(RT_SPHERE)); 
            iNow = this.item.length -1;    
            this.item[iNow].setIdent();   
            this.item[iNow].rayTranslate(0,-1.0, 1.0); 

            // * sphere
            this.item.push(new CGeom(RT_SPHERE)); 
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
};

var HITMAX = 5;
CScene.prototype.makeRayTracedImage = function () {
    this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);

    this.setImgBuf(this.imgBuf); // just in case: this ensures our ray-tracer

    var hit = 0;
    var idx = 0; // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
    var i, j; // pixel x,y coordinate (origin at lower left; integer values)
    var k; // item[] index; selects CGeom object we're currently tracing.

    this.pixFlag = 0; // DIAGNOSTIC: g_myScene.pixFlag == 1 at just one pixel
    // var myHit = new CHit(); // holds the nearest ray/grid intersection (if any)


    for (j = 0; j < this.imgBuf.ySiz; j++) {// for the j-th row of pixels.
        for (i = 0; i < this.imgBuf.xSiz; i++) { // and the i-th pixel on that row,
            var colr = vec4.create(); // floating-point RGBA color value
            for(let n0 = 0; n0 < g_AAcode; n0++){
                for(let n1 = 0; n1 < g_AAcode; n1++){
                    this.eyeRay = new CRay();
                    let randX = g_isJitter ? Math.random() : 0.5;
                    let randY = g_isJitter ? Math.random() : 0.5;
                    let posX = i + (n0 + randX)/g_AAcode - 0.5; 
                    let posY = j + (n1 + randY)/g_AAcode - 0.5; 
                    this.rayCam.setEyeRay(this.eyeRay, posX, posY); // create ray for pixel (i,j)
                    let hits = new CHitList(this.eyeRay);
                    for (k = 0; k < this.item.length; k++) {// for every CGeom in item[] array,
                        let myHit = new CHit(); 
                        hits.hitList.push(myHit);
                        this.item[k].traceMe(this.eyeRay, myHit); // trace eyeRay thru it,
                    } // & keep nearest hit point in myHit.
                    vec4.add(colr, colr, this.getColor(hits, this.rayCam.eyePt));
                }
            }
            vec4.scale(colr, colr, 1/(g_AAcode*g_AAcode)); 
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
var g_falloff = 100;

function calDist(hits, i){
    return Math.sqrt( Math.pow(hits.ray.orig[0]-hits.hitList[i].hitPt[0],2) 
    + Math.pow(hits.ray.orig[1]-hits.hitList[i].hitPt[1], 2) 
    + Math.pow(hits.ray.orig[2]-hits.hitList[i].hitPt[2],2) );
}

CScene.prototype.getColor = function(hits, eyePos){
    let myHitIdx = 0;
    for (let i=0; i < hits.hitList.length; i++) {
        if (calDist(hits, i) < calDist(hits, myHitIdx)) {
            myHitIdx = i;
        }
    }
    let myHit = hits.hitList[myHitIdx];
    let color0 = vec4.create();
    let color1 = vec4.create();
    globalThis.HEADLIGHT = 0;
    let light0 = new Light(HEADLIGHT);
    light0.updateLightPos();
    globalThis.WORLDLIGHT = 1;
    let light1 = new Light(WORLDLIGHT);
    light1.updateLightPos();


    if(g_headLightOn && !this.isShadow(myHit, HEADLIGHT)){
        light0.getColor(myHit, eyePos);
        color0 = light0.pixelColor;
    }
    if(g_worldLightOn && !this.isShadow(myHit, WORLDLIGHT)){
        light1.getColor(myHit, eyePos);
        color1 = light1.pixelColor;
    }
    vec4.add(color1, color0, color1);

    // console.log(color1)
    // console.log(break1)

    return color1;
}

CScene.prototype.isShadow = function(myHit, lightIdx){
    let isInShadow = false;

    //get a copy of current pos and light
    let curLight = new Light(lightIdx);
    let curLightPos = vec4.create();
    vec4.copy(curLightPos, curLight.I_pos);

    let curRay = vec4.create();
    vec4.copy(curRay, myHit.hitPt);

    let rayDir = vec4.create();
    vec4.subtract(rayDir,curLightPos, curRay);
    vec4.normalize(rayDir, rayDir);

    let curHitList = new CHitList(curRay);
    for (let h = 0; h < curHitList.hitList.length; h++){
        for (k = 0; k < this.item.length; k++) {// for every CGeom in item[] array,
            let curHit = new CHit(); 
            curHitList.hitList.push(curHit);
            this.item[k].traceMe(this.eyeRay, curHit); // trace eyeRay thru it,
        } 
    }
    // curHitList.hitList = curHitList.hitList.sort(sortingScheme);

    if (myHit.t0 < (curLightPos[0] - curLight[0])/rayDir[0]){
        isInShadow = true;
        console.log("12")
    }
    
    return isInShadow;
}

function sortingScheme(h1,h2){
    return h1.t0 < h2.t0 ? -1 : 1;
}


CScene.prototype.getReflect = function(){
    for(let iter = 0; iter< g_recurDepth; iter++) {
        let rRay = new CRay();
        vec4.copy(rRay.orig, myHit.hitPt);
        let rRayDir = vec4.create();
        rRay.dir = this.reflect(rRayDir, normal)

        var rHit = new CHit(); 
        rHit.init(); 
        for (k = 0; k < this.item.length; k++) {
            this.item[k].traceMe(rRay, rHit); 
        } 

        let reflective = this.getColor(rHit, reflectDepth-1);
        vec4.scaleAndAdd(color, color, reflective, this.KShiny/g_falloff);
    }

    // console.log(this.pixelColor)
    // console.log(break1)
}


var g_lamp0 = new LightsT(); //world-light
var g_lamp1 = new LightsT(); //another light source
var g_matl0 = new Material();
g_matl0.setMatl(3);

function Light(idx){
    this.idx = idx;
    this.setDefaultLight();
    if(this.idx == 0){
        this.I_pos = vec4.fromValues(g_lamp0.I_pos.elements[0], g_lamp0.I_pos.elements[1], g_lamp0.I_pos.elements[2], 1.0);
        this.I_ambi = vec4.fromValues(g_lamp0.I_ambi.elements[0], g_lamp0.I_ambi.elements[1], g_lamp0.I_ambi.elements[2], 1.0);
        this.I_diff = vec4.fromValues(g_lamp0.I_diff.elements[0], g_lamp0.I_diff.elements[1], g_lamp0.I_diff.elements[2], 1.0);
        this.I_spec = vec4.fromValues(g_lamp0.I_spec.elements[0], g_lamp0.I_spec.elements[1], g_lamp0.I_spec.elements[2], 1.0);
    }
    else{
        this.I_pos = vec4.fromValues(g_lamp1.I_pos.elements[0], g_lamp1.I_pos.elements[1], g_lamp1.I_pos.elements[2], 1.0);
        this.I_ambi = vec4.fromValues(g_lamp1.I_ambi.elements[0], g_lamp1.I_ambi.elements[1], g_lamp1.I_ambi.elements[2], 1.0);
        this.I_diff = vec4.fromValues(g_lamp1.I_diff.elements[0], g_lamp1.I_diff.elements[1], g_lamp1.I_diff.elements[2], 1.0);
        this.I_spec = vec4.fromValues(g_lamp1.I_spec.elements[0], g_lamp1.I_spec.elements[1], g_lamp1.I_spec.elements[2], 1.0);
    }
    this.setDefaultMat();
    this.pixelColor = vec4.create();
}

Light.prototype.getColor = function(myHit, eyePos){
    // console.log(myHit.hitPt, myHit.viewN, myHit.surfNorm);
    //vec3 normal = normalize(v_Normal); \n' +
    this.normal = vec4.create();
    vec4.normalize(this.normal, myHit.surfNorm);
    //vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
    this.lightDirection = vec4.create();
    vec4.subtract(this.lightDirection, this.I_pos, myHit.hitPt);
    vec4.normalize(this.lightDirection, this.lightDirection);

    //vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
    this.eyeDirection = vec4.create();
    vec4.subtract(this.eyeDirection, eyePos, myHit.hitPt);
    vec4.normalize(this.eyeDirection, this.eyeDirection);

    //float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
    let nDotL0= vec4.create();
    vec4.add(nDotL0, this.lightDirection, this.eyeDirection);
    nDotL0 = vec4.dot(nDotL0, this.normal);
    this.nDotL = Math.max(nDotL0,0);

    //vec3 H = normalize(lightDirection + eyeDirection); \n' +
    let H = vec4.create();
    vec4.add(H, this.lightDirection, this.eyeDirection);
    vec4.normalize(H, H);
    //float nDotH = max(dot(H, normal), 0.0); \n' +
    this.nDotH = Math.max(vec4.dot(H, myHit.surfNorm), 0.0);
    //float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' 
    this.e64 = Math.pow(this.nDotH, this.KShiny);

    /** 
    '  vec3 emissive = u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
    '  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' + 
     */
    this.emissive = vec4.create();
    this.ambient = vec4.create();
    this.diffuse = vec4.create();
    this.speculr = vec4.create();
    vec4.copy(this.emissive, this.Ke);
    vec4.multiply(this.ambient, this.I_ambi, this.Ka);
    vec4.multiply(this.diffuse, this.I_diff, this.Kd);
    vec4.scale(this.diffuse,this.diffuse,this.nDotL);
    vec4.multiply(this.speculr, this.I_spec, this.Ks);
    vec4.scale(this.speculr, this.speculr, this.e64);
    
    //  gl_FragColor = vec4(emissive + ambient + diffuse + speculr + ambient2 + diffuse2 + speculr2 , 1.0);\n' +
    vec4.add(this.pixelColor, this.pixelColor, this.emissive);
    vec4.add(this.pixelColor, this.pixelColor, this.ambient);
    vec4.add(this.pixelColor, this.pixelColor, this.diffuse);
    vec4.add(this.pixelColor, this.pixelColor, this.speculr);
    
    this.pixelColor[3] = 1.0;
}



Light.prototype.updateLightPos = function(){
    if(this.idx == 0){
        this.I_pos = vec4.fromValues(g_lamp0.I_pos.elements[0], g_lamp0.I_pos.elements[1], g_lamp0.I_pos.elements[2], 1.0);
    }
    else{
        this.I_pos = vec4.fromValues(g_lamp1.I_pos.elements[0], g_lamp1.I_pos.elements[1], g_lamp1.I_pos.elements[2], 1.0);
    }
}

Light.prototype.setDefaultLight = function(){
    //worldlight
    g_lamp0.I_pos.elements.set( [params.Lamp1PosX, params.Lamp1PosY, params.Lamp1PosZ]);
    g_lamp0.I_ambi.elements.set([1.0, 1.0, 1.0]);
    g_lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
    g_lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);

    //headlight
    g_lamp1.I_pos.elements.set([params.Lamp2PosX, params.Lamp2PosY, params.Lamp2PosZ]);
    g_lamp1.I_ambi.elements.set([0.4, 0.4, 0.4]);
    g_lamp1.I_diff.elements.set([1.0, 1.0, 1.0]);
    g_lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);
}

Light.prototype.setDefaultMat = function(){
    this.Ka = vec4.fromValues(g_matl0.K_ambi[0],g_matl0.K_ambi[1],g_matl0.K_ambi[2],g_matl0.K_ambi[3]);
    this.Kd = vec4.fromValues(g_matl0.K_diff[0],g_matl0.K_diff[1],g_matl0.K_diff[2],g_matl0.K_diff[3]);
    this.Ks = vec4.fromValues(g_matl0.K_spec[0],g_matl0.K_spec[1],g_matl0.K_spec[2],g_matl0.K_spec[3]);
    this.Ke = vec4.fromValues(g_matl0.K_emit[0],g_matl0.K_emit[1],g_matl0.K_emit[2],g_matl0.K_emit[3]);
    this.KShiny = g_matl0.K_shiny;
}
