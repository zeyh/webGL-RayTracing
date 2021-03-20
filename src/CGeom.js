const RT_GNDPLANE = 0;
const RT_SPHERE = 1;
const RT_BOX = 2;
const RT_CYLINDER = 3;
const RT_DISK = 4;
function CGeom(shapeSelect) {
    if (shapeSelect == undefined) shapeSelect = RT_GNDPLANE; // default
    this.shapeType = shapeSelect;
    this.matl = new Material();
    this.matl.setMatl(g_matl0);
    switch (this.shapeType) {
        case RT_GNDPLANE:
            this.traceMe = function (inR, hit) {
                this.traceGrid(inR, hit);
            };
            this.xgap = 1.0; // line-to-line spacing
            this.ygap = 1.0;
            this.lineWidth = 0.1; // fraction of xgap used for grid-line width
            break;
        case RT_SPHERE:
            this.traceMe = function (inR, hit) {
                this.traceSphere(inR, hit);
            };
            break;
        case RT_BOX:
            this.boxSize = 1;
            this.traceMe = function (inR, hit) {
                this.traceCube(inR, hit);
            };
            break;
        case RT_CYLINDER:
            this.cylinderRad = 1;
            this.traceMe = function (inR, hit) {
                this.traceCylinder(inR, hit);
            };
            break;
        case RT_DISK:
            this.traceMe = function(inR,hit) { this.traceDisk(inR,hit);   };
            this.diskRad = 1.0;   // default radius of disk centered at origin
            // Disk line-spacing is set to 61/107 xgap,ygap  (ratio of primes)
            // disk line-width is set to 3* lineWidth, and it swaps lineColor & gapColor. 
            this.xgap = 61/107;	// line-to-line spacing: a ratio of primes.
            this.ygap = 61/107;
            this.lineWidth = 0.1;	// fraction of xgap used for grid-line width
            this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);  // RGBA green(A==opacity)
            this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);  // near-white
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
CGeom.prototype.setMaterial = function(code){
    this.matl.setMatl(code);
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
        myHit.hitGeom.matl.setMatl(3);
        myHit.reflect(inRay); 
        return;
    }
    loc = myHit.modelHitPt[1] / this.ygap; // how many 'ygaps' from origin?
    if (myHit.modelHitPt[1] < 0) loc = -loc; // keep >0 to form double-width line at xaxis.
    if (loc % 1 < this.lineWidth) {
        // fractional part of loc < linewidth?
        myHit.hitNum = 1; // YES. rayT hit a line of constant-y
        myHit.hitGeom.matl.setMatl(3);
        myHit.reflect(inRay); 
        return;
    }
    myHit.hitGeom.matl.setMatl(9);
    myHit.reflect(inRay); 
    myHit.hitNum = 0; // No.
    return;
};
    

CGeom.prototype.traceSphere = function (inRay, myHit) {
    var rayT = new CRay(); // to create 'rayT', our local model-space ray.
    vec4.copy(rayT.orig, inRay.orig); // memory-to-memory copy.
    vec4.copy(rayT.dir, inRay.dir);
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir, inRay.dir, this.worldRay2model);

    var r2s = vec4.create();
    vec4.subtract(r2s, vec4.fromValues(0, 0, 0, 1), rayT.orig);
    var L2 = vec3.dot(r2s, r2s); // NOTE: vec3.dot() IGNORES the 'w' values when
    if (L2 <= 1.0) {
        console.log(
            "CGeom.traceSphere() ERROR! rayT origin at or inside sphere!\n\n"
        );
        return; // HINT: see comments at end of this function.
    }
    var tcaS = vec3.dot(rayT.dir, r2s); // tcaS == SCALED tca;
    if (tcaS < 0.0) {
        return; 
    }

    var DL2 = vec3.dot(rayT.dir, rayT.dir);
    var tca2 = (tcaS * tcaS) / DL2;
    var LM2 = L2 - tca2;
    if (LM2 > 1.0) {
        return; 
    }

    var L2hc = 1.0 - LM2; // SQUARED half-chord length.
    var t0hit = tcaS / DL2 - Math.sqrt(L2hc / DL2); // closer of the 2 hit-points.
    if (t0hit > myHit.t0) {
        return; 
    }

    myHit.t0 = t0hit; // record ray-length, and
    myHit.hitGeom = this; // record this CGeom object as the one we hit, and
    vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
    vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
    vec4.transformMat4(
        myHit.surfNorm,
        vec4.fromValues(myHit.modelHitPt[0], myHit.modelHitPt[1], myHit.modelHitPt[2], 0),
        this.normal2world
    );
    myHit.hitNum = 1; // in CScene.makeRayTracedImage, use 'this.gapColor'
    // myHit.hitGeom.matl.setMatl(22);
    myHit.reflect(inRay);
    if (g_myScene.pixFlag == 1) {
        console.log("r2s:",r2s,"L2", L2,"tcaS",tcaS,"tca2", tca2, "LM2", LM2,"L2hc",L2hc, "t0hit", t0hit); 
    }
};

CGeom.prototype.traceCube = function (inRay, myHit) {
    var rayT = new CRay(); // to create 'rayT', our local model-space ray.
    vec4.copy(rayT.orig, inRay.orig); // memory-to-memory copy.
    vec4.copy(rayT.dir, inRay.dir);
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir, inRay.dir, this.worldRay2model);

    for (let idx = 0; idx < 3; idx ++) {
        let t0 = (this.boxSize - rayT.orig[idx]) / rayT.dir[idx];
        let tmpHit = vec4.create();
        vec4.scaleAndAdd(tmpHit, rayT.orig, rayT.dir, t0);
        if ((idx != 0 && (tmpHit[0] < -1.0 || tmpHit[0] > 1.0)) || (idx != 1 && (tmpHit[1] < -1.0 || tmpHit[1] > 1.0)) || (idx != 2 && (tmpHit[2] < -1.0 || tmpHit[2] > 1.0)) 
        || t0 < 0 || t0 > myHit.t0){ 
             continue;
        }
        myHit.t0 = t0;
        myHit.hitGeom = this;
        vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
        vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
        myHit.surfNorm = vec4.fromValues(0,0,0,0);
        myHit.surfNorm[idx] = 1;
        // myHit.hitGeom.matl.setMatl(10);
        myHit.reflect(inRay); 
        myHit.hitNum = 1;
    }
    
    for (let idx = 0; idx < 3; idx++) {
        let t0 = (-this.boxSize - rayT.orig[idx]) / rayT.dir[idx];
        let tmpHit = vec4.create();
        vec4.scaleAndAdd(tmpHit, rayT.orig, rayT.dir, t0);
        if ((idx != 0 && (tmpHit[0] < -1.0 || tmpHit[0] > 1.0)) || (idx != 1 && (tmpHit[1] < -1.0 || tmpHit[1] > 1.0)) || (idx != 2 && (tmpHit[2] < -1.0 || tmpHit[2] > 1.0)) 
        || t0 < 0 || t0 > myHit.t0){ 
             continue;
        }
        myHit.t0 = t0;
        myHit.hitGeom = this;
        vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
        vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
        myHit.surfNorm = vec4.fromValues(0,0,0,0);
        myHit.surfNorm[idx] = -1;
        // myHit.hitGeom.matl.setMatl(10);
        myHit.reflect(inRay); 
        myHit.hitNum = 1;

    }


    
};

CGeom.prototype.traceCylinder = function (inRay, myHit) {
    var rayT = new CRay(); // to create 'rayT', our local model-space ray.
    vec4.copy(rayT.orig, inRay.orig); // memory-to-memory copy.
    vec4.copy(rayT.dir, inRay.dir);
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir, inRay.dir, this.worldRay2model);

    // TODO: 
    // let t0 = (this.cylinderRad - rayT.orig[2]) / rayT.dir[2];
    // let tmpHit = vec4.create();

    // if ((tmpHit[0] * tmpHit[0] + tmpHit[1] * tmpHit[1] > 1) || t0 < 0 || t0 > myHit.t0){ 
    //     return;
    // }
    // vec4.scaleAndAdd(tmpHit, rayT.orig, rayT.dir, t0);

    // myHit.t0 = t0;
    // myHit.hitGeom = this;
    // vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
    // vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
    // vec4.transformMat4(
    //     myHit.surfNorm,
    //     vec4.fromValues(myHit.modelHitPt[0], myHit.modelHitPt[1], myHit.modelHitPt[2], 0),
    //     this.normal2world
    // );    
    // myHit.hitGeom.matl.setMatl(13);
    // myHit.reflect(inRay); 
    // myHit.hitNum = 1;

}
CGeom.prototype.traceDisk = function (inRay, myHit) {
    //==============================================================================
    // Find intersection of CRay object 'inRay' with a flat, circular disk in the
    // xy plane, centered at the origin, with radius this.diskRad,
    // and store the ray/disk intersection information on CHit object 'hitMe'.
    // NO return value.
    // (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
    // Set CHit.hitNum ==  -1 if ray MISSES the disk
    //                 ==   0 if ray hits the disk BETWEEN lines
    //                 ==   1 if ray hits the disk ON the lines
    //
    //  Uses the EXACT SAME steps developed for this.traceGrid(), EXCEPT:
    //  if the hit-point is > diskRad distance from origin, the ray MISSED the disk.

    //------------------ Transform 'inRay' by this.worldRay2model matrix;
    var rayT = new CRay(); // create a local transformed-ray variable.
    vec4.copy(rayT.orig, inRay.orig); // memory-to-memory copy.
    vec4.copy(rayT.dir, inRay.dir);
    // (DON'T do this: rayT = inRay; // that sets rayT
    // as a REFERENCE to inRay. Any change to rayT is
    // also a change to inRay (!!).
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir, inRay.dir, this.worldRay2model);
    //------------------End ray-transform.

    // find ray/disk intersection: t0 == value where ray hits the plane at z=0.
    var t0 = -rayT.orig[2] / rayT.dir[2]; // (disk is in z==0 plane)

    // The BIG QUESTION:  ? Did we just find a hit-point for inRay
    // =================  ? that is CLOSER to camera than myHit?
    if (t0 < 0 || t0 > myHit.t0) {
        return; // NO. Hit-point is BEHIND us, or it's further away than myHit.
        // Leave myHit unchanged. Don't do any further calcs.   Bye!
    }
    // OK, so we hit the plane at (model space) z==0;
    // ? But did we hit the disk itself?
    // compute the x,y,z,w point where inRay hit the grid-plane in MODEL coords:
    // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
    var modelHit = vec4.create();
    vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);
    if (
        modelHit[0] * modelHit[0] + modelHit[1] * modelHit[1] >
        this.diskRad * this.diskRad
    ) {
        // ?Did ray hit within disk radius?
        return; // NO.  Ray MISSED the disk.
        // Leave myHit unchanged. Don't do any further calcs. Bye!
    }
    // YES! we found a better hit-point!
    // Update myHit to describe it------------------------------------------------
    myHit.t0 = t0; // record ray-length, and
    myHit.hitGeom = this; // record this CGeom object as the one we hit, and
    vec4.copy(myHit.modelHitPt, modelHit); // record the model-space hit-pt, and
    // compute the x,y,z,w point where inRay hit the grid-plane in WORLD coords:
    vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
    // set 'viewN' member to the reversed, normalized inRay.dir vector:
    vec4.negate(myHit.viewN, inRay.dir);
    // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
    // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
    vec4.normalize(myHit.viewN, myHit.viewN); // ensure a unit-length vector.
    // Now find surface normal:
    // in model space we know it's always +z,
    // but we need to TRANSFORM the normal to world-space, & re-normalize it.
    vec4.transformMat4(
        myHit.surfNorm,
        vec4.fromValues(0, 0, 1, 0),
        this.normal2world
    );
    vec4.normalize(myHit.surfNorm, myHit.surfNorm);

    //-------------find hit-point color:----------------
    var loc = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
    if (myHit.modelHitPt[0] < 0) loc = -loc; // keep >0 to form double-width line at yaxis.
    if (loc % 1 < this.lineWidth) {
        // fractional part of loc < linewidth?
        myHit.hitNum = 0; // YES. rayT hit a line of constant-x
        // myHit.reflect(inRay); 
        return;
    }
    loc = myHit.modelHitPt[1] / this.ygap; // how many 'ygaps' from origin?
    if (myHit.modelHitPt[1] < 0) loc = -loc; // keep >0 to form double-width line at xaxis.
    if (loc % 1 < this.lineWidth) {
        // fractional part of loc < linewidth?
        myHit.hitNum = 0; // YES. rayT hit a line of constant-y
        // myHit.reflect(inRay); 
        return;
    }
    myHit.reflect(inRay); 
    myHit.hitNum = 1; // No.
    return;
};
    

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
    