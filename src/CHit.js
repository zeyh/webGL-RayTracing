var g_t0_MAX = 1.23e16; // 'sky' distance; approx. farthest-possible hit-point.

function CHit() {
    this.hitGeom = null; // (reference to)the CGeom object we pierced in
    //  in the CScene.item[] array (null if 'none').
    this.hitNum = -1; // SKY color
    this.t0 = g_t0_MAX; // 'hit time' parameter for the ray; defines one
    // 'hit-point' along ray:   orig + t*dir = hitPt.
    this.hitPt = vec4.create(); // World-space location where the ray pierced
    // the surface of a CGeom item.
    this.surfNorm = vec4.create(); // World-space surface-normal vector at the
    //  point: perpendicular to surface.
    this.viewN = vec4.create(); // Unit-length vector from hitPt back towards
    this.refl = vec4.create();
    // the origin of the ray we traced.  (VERY
    // useful for Phong lighting, etc.)
    this.isEntering = true; // true iff ray origin was OUTSIDE the hitGeom. for transparency
    this.modelHitPt = vec4.create(); // the 'hit point' in model coordinates.
    this.colr = null; // set default as 'sky'
    this.init();
}

CHit.prototype.init = function () {
    this.hitGeom = -1; // (reference to)the CGeom object we pierced in
    this.hitNum = -1; // Need to be modified with  traceGrid() or traceDisk() result.
    this.t0 = g_t0_MAX; // 'hit time' for the ray; defines one // 'hit-point' along ray:   orig + t*dir = hitPt.
    vec4.set(this.hitPt, this.t0, 0, 0, 1); // Hit-point: the World-space location
    vec4.set(this.surfNorm, -1, 0, 0, 0); // World-space surface-normal vector
    vec4.set(this.viewN, -1, 0, 0, 0); // Unit-length vector from hitPt back towards the origin of the ray we traced.
    this.isEntering = true; // true iff ray origin was OUTSIDE the hitGeom.
    vec4.copy(this.modelHitPt, this.hitPt); // the 'hit point' in model coordinates.
};

CHit.prototype.reflect = function (myRay) {
    vec4.negate(this.viewN, myRay.dir);
    vec4.normalize(this.viewN, this.viewN);
    vec4.negate(this.refl, this.viewN);
    vec4.normalize(this.surfNorm, this.surfNorm);
    vec4.scaleAndAdd(
        this.refl,
        this.refl,
        this.surfNorm,
        vec4.dot(this.surfNorm, this.viewN) * 2
    );
    vec4.normalize(this.refl, this.refl);
};

function CHitList(cRay) {
    this.ray = cRay;
    this.hitList = [new CHit()];
}
CHitList.prototype.add = function () {
    this.hitList.push(new CHit());
    return this.hitList[this.hitList.length - 1];
};
CHitList.prototype.closest = function () {
    let resultIdx = 0;
    for (let i = 0; i < this.hitList.length; i++) {
        if (calDist(this, i) < calDist(this, resultIdx)) {
            resultIdx = i;
        }
    }
    return this.hitList[resultIdx];
};
