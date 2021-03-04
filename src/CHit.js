function CHit() {
    //=============================================================================
    // Describes one ray/object intersection point that was found by 'tracing' one
    // ray through one shape (through a single CGeom object, held in the
    // CScene.item[] array).
    // CAREFUL! We don't use isolated CHit objects, but instead gather all the CHit
    // objects for one ray in one list held inside a CHitList object.
    // (CHit, CHitList classes are consistent with the 'HitInfo' and 'Intersection'
    // classes described in FS Hill, pg 746).
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
    // the origin of the ray we traced.  (VERY
    // useful for Phong lighting, etc.)
    this.isEntering = true; // true iff ray origin was OUTSIDE the hitGeom. for transparency
    this.modelHitPt = vec4.create(); // the 'hit point' in model coordinates.
    this.colr = vec4.clone(g_myScene.skyColor); // set default as 'sky'
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

function CHitList() {
    //=============================================================================
    // Holds ALL ray/object intersection results from tracing a single ray(CRay)
    // sent through ALL shape-defining objects (CGeom) in in the item[] array in
    // our scene (CScene).  A CHitList object ALWAYS holds at least one valid CHit
    // 'hit-point', as we initialize the pierce[0] object to the CScene's
    //  background color.  Otherwise, each CHit element in the 'pierce[]' array
    // describes one point on the ray where it enters or leaves a CGeom object.
    // (each point is in front of the ray, not behind it; t>0).
    //  -- 'iEnd' index selects the next available CHit object at the end of
    //      our current list in the pierce[] array. if iEnd=0, the list is empty.
    //     CAREFUL! *YOU* must prevent buffer overflow! Keep iEnd<= JT_HITLIST_MAX!
    //  -- 'iNearest' index selects the CHit object nearest the ray's origin point.
    //
    //
    //
    //
    //  	YOU WRITE THIS!
    //
    //
    //
    //
    //
}
