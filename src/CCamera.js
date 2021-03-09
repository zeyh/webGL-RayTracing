
/** 
 * change viewing point 
 */
function CCamera() {
    this.eyePt = vec4.fromValues(0, 0, 0, 1);

    this.uAxis = vec4.fromValues(1, 0, 0, 0); // camera U axis == world x axis
    this.vAxis = vec4.fromValues(0, 1, 0, 0); // camera V axis == world y axis
    this.nAxis = vec4.fromValues(0, 0, 1, 0); // camera N axis == world z axis.
  
    this.iLeft = -1.0;
    this.iRight = 1.0;
    this.iBot = -1.0;
    this.iTop = 1.0;
    this.iNear = 1.0;
    
    this.xmax = 256; // horizontal,
    this.ymax = 256; // vertical image resolution.

    this.ufrac = (this.iRight - this.iLeft) / this.xmax; // pixel tile's width
    this.vfrac = (this.iTop - this.iBot) / this.ymax; // pixel tile's height.
}

CCamera.prototype.setSize = function (nuXmax, nuYmax) {
    this.xmax = nuXmax;
    this.ymax = nuYmax;
    // Divide the image plane into rectangular tiles, one for each pixel:
    this.ufrac = (this.iRight - this.iLeft) / this.xmax; // pixel tile's width
    this.vfrac = (this.iTop - this.iBot) / this.ymax; // pixel tile's height.
};

/** 
 * set rayFrustrum 
 */
CCamera.prototype.rayFrustum = function (left, right, bot, top, near) {
    this.iLeft = left;
    this.iRight = right;
    this.iBot = bot;
    this.iTop = top;
    this.iNear = near;
};

CCamera.prototype.rayPerspective = function(fovy, aspect, zNear) {
    //==============================================================================
    // Set the camera's viewing frustum with the same arguments used by the OpenGL
    // 'gluPerspective()' function
    // (except this function has no 'far' argument; not needed for ray-tracing).
    //  fovy == vertical field-of-view (bottom-to-top) in degrees
    //  aspect ratio == camera image width/height
    //  zNear == distance from COP to the image-forming plane. zNear MUST be >0.
    
    //  console.log("you called CCamera.rayPerspective");
      this.iNear = zNear;
      this.iTop = zNear * Math.tan(0.5*fovy*(Math.PI/180.0)); // tan(radians)
      // right triangle:  iTop/zNear = sin(fovy/2) / cos(fovy/2) == tan(fovy/2)
      this.iBot = -this.iTop;
      this.iRight = this.iTop*aspect;
      this.iLeft = -this.iRight;
    }

CCamera.prototype.rayLookAt = function (nuEyePt, nuAimPt, nuUpVec) {
    //==============================================================================
    // Each argument (eyePt, aimPt, upVec) is a glMatrix 'vec4' object.
    // Adjust the orientation and position of this ray-tracing camera
    // in 'world' coordinate system to match eyePt, aimPt, upVec
    // Results should exactly match WebGL camera posed by the same arguments.
    //
    this.eyePt = nuEyePt;
    vec4.subtract(this.nAxis, this.eyePt, nuAimPt); // aim-eye == MINUS N-axis direction
    // console.log('this.nAxis b4 norm:' ,this.nAxis);
    vec4.normalize(this.nAxis, this.nAxis); // N-axis vector must have unit length.
    // console.log('this.nAxis AFTER norm:', this.nAxis);
    vec3.cross(this.uAxis, nuUpVec, this.nAxis); // U-axis == upVec cross N-axis
    // console.log("this.uAxis AFTER cross:", this.uAxis);
    vec4.normalize(this.uAxis, this.uAxis); // make it unit-length.
    vec3.cross(this.vAxis, this.nAxis, this.uAxis); // V-axis == N-axis cross U-axis
};
    
/** 
 * specify a ray in world coordinates that originates at the camera's eyepoint 
 */
CCamera.prototype.setEyeRay = function (myeRay, xpos, ypos) {
    var posU = this.iLeft + xpos * this.ufrac; // U coord,
    var posV = this.iBot + ypos * this.vfrac; // V coord,

    xyzPos = vec4.create(); // make vector 0,0,0,0.
    vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis*posU;
    vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis*posU;
    vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear);

    vec4.copy(myeRay.orig, this.eyePt);
    vec4.copy(myeRay.dir, xyzPos);
};

/**
 * print CCamera object's current contents in console window:
 */
CCamera.prototype.printMe = function () {
    console.log("you called CCamera.printMe()");
};
