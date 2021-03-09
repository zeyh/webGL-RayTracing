const RT_GNDPLANE = 0;
const RT_SPHERE = 1;
const RT_BOX = 2;

function CGeom(shapeSelect) {
    if (shapeSelect == undefined) shapeSelect = PLANE; // default
    this.shapeType = shapeSelect;

    switch (this.shapeType) { //TODO:
        case RT_GNDPLANE:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function (inR, hit) {
                this.traceGrid(inR, hit);
            };
            this.xgap = 1.0; // line-to-line spacing
            this.ygap = 1.0;
            this.lineWidth = 0.1; // fraction of xgap used for grid-line width
            this.lineColor = vec4.fromValues(0.1, 0.5, 0.1, 1.0); // RGBA green(A==opacity)
            this.gapColor = vec4.fromValues(0.9, 0.9, 0.9, 1.0); // near-white
            break;
        case RT_SPHERE:
            this.traceMe = function (inR, hit) {
                this.traceSphere(inR, hit);
            };
            this.lineColor = vec4.fromValues(0.0, 0.3, 1.0, 1.0); // RGBA blue(A==opacity)
            break;
        default:
            console.log(
                "CGeom() constructor: ERROR! INVALID shapeSelect:",
                shapeSelect
            );
            return;
    }

    this.worldRay2model = mat4.create(); // the matrix used to transform rays from
    this.normal2world = mat4.create();
}

CGeom.prototype.traceGrid = function (inRay, myHit) {
    var rayT = new CRay(); // create a local transformed-ray variable.

    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);

    vec4.transformMat4(rayT.dir, inRay.dir, this.worldRay2model);
    var t0 = -rayT.orig[2] / rayT.dir[2];
   
    if (t0 < 0 || t0 > myHit.t0) {
        return; // NO. Hit-point is BEHIND us, or it's further away than myHit.
    }
   
    myHit.t0 = t0; // record ray-length, and
    myHit.hitGeom = this; // record the CGeom object that we hit, and

    // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
    vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
    vec4.copy(myHit.hitPt, myHit.modelHitPt); // copy world-space hit-point.

    vec4.negate(myHit.viewN, inRay.dir); // reversed, normalized inRay.dir:
    vec4.normalize(myHit.viewN, myHit.viewN); // make view vector unit-length.
    vec4.set(myHit.surfNorm, 0, 0, 1, 0); // surface normal FIXED at world +Z.

    // FIND COLOR at model-space hit-point---------------------------------
    var loc = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
    if (myHit.modelHitPt[0] < 0) loc = -loc; // keep >0 to form double-width line at yaxis.
    
    // console.log("loc",loc, "loc%1", loc%1, "lineWidth", this.lineWidth);
    if (loc % 1 < this.lineWidth) {
        // fractional part of loc < linewidth?
        myHit.hitNum = 1; // YES. rayT hit a line of constant-x
        return;
    }
    loc = myHit.modelHitPt[1] / this.ygap; // how many 'ygaps' from origin?
    if (myHit.modelHitPt[1] < 0) loc = -loc; // keep >0 to form double-width line at xaxis.
    if (loc % 1 < this.lineWidth) {
        // fractional part of loc < linewidth?
        myHit.hitNum = 1; // YES. rayT hit a line of constant-y
        return;
    }
    myHit.hitNum = 0; // No.
    return;
};
    

CGeom.prototype.traceSphere = function(inRay, myHit) { 
    var rayT = new CRay();    // to create 'rayT', our local model-space ray.
    vec4.copy(rayT.orig, inRay.orig);   // memory-to-memory copy. 
    vec4.copy(rayT.dir, inRay.dir);
                                // (DON'T do this: rayT = inRay; // that sets rayT
                                // as a REFERENCE to inRay. Any change to rayT is
                                // also a change to inRay (!!).
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
    
    //------------------ Step 2: Test 1st triangle. Did ray MISS sphere entirely?
    // Create r2s vector that reaches FROM ray's start-point TO the sphere center.
    //  (subtract: model-space origin POINT - rayT origin POINT):
    // (remember, in homogeneous coords w=1 for points, =0 for vectors)
    var r2s = vec4.create();
    vec4.subtract(r2s, vec4.fromValues(0,0,0,1), rayT.orig);
    // Find L2, the squared length of r2s, by dot-product with itself:
    var L2 = vec3.dot(r2s,r2s);   // NOTE: vec3.dot() IGNORES the 'w' values when 
                                    //  vec4 arguments.  !Good! I like glMatrix...
    // if L2 <=1.0, ray starts AT or INSIDE the unit sphere surface (!). 
    if(L2 <= 1.0) { // report error and quit.  LATER we can use this case to
                    // handle rays through transparent spheres.
        console.log("CGeom.traceSphere() ERROR! rayT origin at or inside sphere!\n\n");
        return;       // HINT: see comments at end of this function.
    }
   
    var tcaS = vec3.dot(rayT.dir, r2s); // tcaS == SCALED tca;
    
    if(tcaS < 0.0) {      // Is the chord mid-point BEHIND the camera(where t<0)?
        return;             // YES!  rayT didn't start inside the sphere, so if
        // MISSED!          // the chord mid-point is behind the camera, then
    }                     // the entire chord is behind the camera: NO hit-points!
                            // Don't change myHit, don't do any further calcs. Bye!
                            // Don't change myHit hMISS! sphere is BEHIND the ray! 
                            // No hit points. Bye!
    
    var DL2 = vec3.dot(rayT.dir, rayT.dir);
    var tca2 = tcaS*tcaS / DL2;

    // Next, use the Pythagorean theorem to find LM2; the squared distance from
    // sphere center to chord mid-point:  L2 = LM2 + tca2, so LM2 = L2-tca2;
    var LM2 = L2 - tca2;  
    if(LM2 > 1.0) {   // if LM2 > radius^2, then chord mid-point is OUTSIDE the
                        // sphere entirely.  Once again, our ray MISSED the sphere.
        return;         // DON'T change myHit, don't do any further calcs. Bye!
        // MISSED!
    }

    var L2hc = (1.0 - LM2); // SQUARED half-chord length.
    
    var t0hit = tcaS/DL2 -Math.sqrt(L2hc/DL2);  // closer of the 2 hit-points.
    if(t0hit > myHit.t0) {    // is this new hit-point CLOSER than 'myHit'?
        return;       // NO.  DON'T change myHit, don't do any further calcs. Bye!
    }
    // YES! we found a better hit-point!
    // Update myHit to describe it------------------------------------------------
    myHit.t0 = t0hit;          // record ray-length, and
    myHit.hitGeom = this;      // record this CGeom object as the one we hit, and
    // Compute the x,y,z,w point where rayT hit the sphere in MODEL coords:
                    // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
    vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
    // Compute the x,y,z,w point where inRay hit the grid-plane in WORLD coords:
    vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
    // set 'viewN' member to the reversed, normalized inRay.dir vector:
    vec4.negate(myHit.viewN, inRay.dir); 
    // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
    // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
    vec4.normalize(myHit.viewN, myHit.viewN); // ensure a unit-length vector.
    // Now find surface normal: 
    // in model space we know it's always +z,
    // but we need to TRANSFORM the normal to world-space, & re-normalize it.
    vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
    vec4.normalize(myHit.surfNorm, myHit.surfNorm);
    // TEMPORARY: sphere color-setting
    myHit.hitNum = 1;   // in CScene.makeRayTracedImage, use 'this.gapColor'
    
    // DIAGNOSTIC:---------------------------------------------------------------
    if(g_myScene.pixFlag ==1) {   // did we reach the one 'flagged' pixel
                                    // chosen in CScene.makeRayTracedImage()?
    console.log("r2s:", r2s, "L2", L2, "tcaS", tcaS, "tca2", tca2, 
                "LM2", LM2, "L2hc", L2hc, "t0hit", t0hit, );  // YES!
    }
}




// ! matrix transform ==========================================
CGeom.prototype.setIdent = function () {
    mat4.identity(this.worldRay2model);
    mat4.identity(this.normal2world);
};

CGeom.prototype.rayTranslate = function (x, y, z) {
    //==============================================================================
    //  Translate ray-tracing's current drawing axes (defined by worldRay2model),
    //  by the vec3 'offV3' vector amount
    var a = mat4.create(); // construct INVERSE translation matrix [T^-1]
    a[12] = -x; // x
    a[13] = -y; // y
    a[14] = -z; // z.
    mat4.multiply(
        this.worldRay2model, // [new] =
        a,
        this.worldRay2model
    ); // =[T^-1]*[OLD]
    mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
};

CGeom.prototype.rayRotate = function(rad, ax, ay, az) {
//==============================================================================
// Rotate ray-tracing's current drawing axes (defined by worldRay2model) around
// the vec3 'axis' vector by 'rad' radians.
// (almost all of this copied directly from glMatrix mat4.rotate() function)
    var x = ax, y = ay, z = az,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON) { 
      console.log("CGeom.rayRotate() ERROR!!! zero-length axis vector!!");
      return null; 
      }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(-rad);     // INVERSE rotation; use -rad, not rad
    c = Math.cos(-rad);
    t = 1 - c;
    // Construct the elements of the 3x3 rotation matrix. b_rowCol
    // CAREFUL!  I changed something!!
    /// glMatrix mat4.rotate() function constructed the TRANSPOSE of the
    // matrix we want (probably because they used these b_rowCol values for a
    // built-in matrix multiply).
    // What we want is given in https://en.wikipedia.org/wiki/Rotation_matrix at
    //  the section "Rotation Matrix from Axis and Angle", and thus
    // I swapped the b10, b01 values; the b02,b20 values, the b21,b12 values.
    b00 = x * x * t + c;     b01 = x * y * t - z * s; b02 = x * z * t + y * s; 
    b10 = y * x * t + z * s; b11 = y * y * t + c;     b12 = y * z * t - x * s; 
    b20 = z * x * t - y * s; b21 = z * y * t + x * s; b22 = z * z * t + c;
    var b = mat4.create();  // build 4x4 rotation matrix from these
    b[ 0] = b00; b[ 4] = b01; b[ 8] = b02; b[12] = 0.0; // row0
    b[ 1] = b10; b[ 5] = b11; b[ 9] = b12; b[13] = 0.0; // row1
    b[ 2] = b20; b[ 6] = b21; b[10] = b22; b[14] = 0.0; // row2
    b[ 3] = 0.0; b[ 7] = 0.0; b[11] = 0.0; b[15] = 1.0; // row3
    //    print_mat4(b,'rotate()');
    mat4.multiply(this.worldRay2model,      // [new] =
                  b, this.worldRay2model);  // [R^-1][old]
    mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world

}   

CGeom.prototype.rayScale = function(sx,sy,sz) {
    //==============================================================================
    //  Scale ray-tracing's current drawing axes (defined by worldRay2model),
    //  by the vec3 'scl' vector amount
      if(Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
         Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
         Math.abs(sz) < glMatrix.GLMAT_EPSILON) {
         console.log("CGeom.rayScale() ERROR!! zero-length scale!!!");
         return null;
         }
      var c = mat4.create();   // construct INVERSE scale matrix [S^-1]
      c[ 0] = 1/sx; // x  
      c[ 5] = 1/sy; // y
      c[10] = 1/sz; // z.
    //  print_mat4(c, 'scale()')'
      mat4.multiply(this.worldRay2model,      // [new] =
                    c, this.worldRay2model);  // =[S^-1]*[OLD]
      mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}
    