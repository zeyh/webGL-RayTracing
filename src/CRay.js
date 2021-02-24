/** 
 * modified from Week01_traceSupplement_READY.js
 */


//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings,
//  lets me see EXACTLY what the editor's 'line-wrap' feature will do.)

//===  TraceSupplement.js  ===================================================
// The object prototypes below (and their comments) are suitable for any and
// all features described in the Ray-Tracing Project Assignment Sheet.
//
// HOWEVER, they're not required, nor even particularly good:
//				(notably awkward style from their obvious C/C++ origins)
// They're here to help you get 'started' on better code of your own,
// and to help you avoid common structural 'traps' in writing ray-tracers
//		that might otherwise force ugly/messy refactoring later, such as:
//  --lack of a well-polished vector/matrix library; e.g. open-src glmatrix.js
//  --lack of floating-point RGB values to compute light transport accurately,
//	--no distinct 'camera' and 'image' objects or 'trace' and 'display' funcs
// 		separate slow ray-tracing steps from fast screen display and refresh.
//	--lack of ray-trace image-buffer (window re-sizing discards your work!)
//  --lack of texture-mapped image display; permit ray-traced image of any
//		resolution to display on any screen at any desired image size
//  --the need to describe geometry/shape independently from surface materials,
//		and to select material(s) for each shape from a list of materials;
//  --materials that permit procedural 3D textures, turbulence & Perlin Noise,
//	--objects for independent light sources, ones that can inherit their
//    location(s) from a geometric shape (e.g. a light-bulb shape).
//  --need to create a sortable LIST of ray/object hit-points, and not just
//		the intersection nearest to the eyepoint, to enable shape-creation by
//		Constructive Solid Geometry (CSG), and to streamline transparency effects
//  --functions organized well to permit easy recursive ray-tracing:  don't
//		tangle together ray/object intersection-finding tasks with shading,
//		lighting, and materials-describing tasks.(e.g. traceRay(), findShade() )
//	--ability to easily match openGL/WebGL functions with ray-tracing results,
//		using identically-matching ray-tracing functions for cameras, views,
//		transformations, lighting, and materials (e.g. rayFrustum(), rayLookAt();
//		rayTranlate(), rayRotate(), rayScale()...)
//  --a straightforward method to implement scene graphs & jointed objects.
//		Do it by transforming world-space rays to model coordinates, rather than
//		models to world coords, using a 4x4 world2model matrix stored in each
//		model (each CGeom primitive).  Set it by OpenGL-like functions
//		rayTranslate(), rayRotate(), rayScale(), etc.

/*
-----------ORGANIZATION:-----------
I recommend that you use just two global top-level objects (declared above main() )
  g_myPic == new CImgBuf():
    your 'image buffer' object to hold a floating-point ray-traced image.
	g_myScene = new CScene(g_myPic);
	  your ray-tracer that computes an image that fills the g_myPic CImgBuf object. 
		
One CScene object contains all parts of our ray-tracer: 
  its camera (CCamera) object, 
  its collection of 3D shapes (CGeom objects in geomList array) 
  its collection of light sources (CLight objects in lightList array),
  its collection of materials (CMatl objects in  matlList array), and more.  
When users press the 'T' or 't' key (see GUIbox method gui.keyDown() ), 
  the program starts ray-tracing:
  it calls the CScene method 'MakeRayTracedImage()'. This top-level function 
  fills each pixel of a CImgBuf object (e.g g_myPic) given as its fcn argument. 
The 'makeRayRacedImage() function orchestrates creation and recursive tracing 
  of millions of rays to find the on-screen color of each pixel in the given 
  CImgBuf object (g_myPic).
  The CScene object also contains & uses:
		--CRay	== a 3D ray object in an unspecified coord. system (usually 'world').
		--CCamera == ray-tracing camera object defined the 'world' coordinate system.
		--CGeom	== a 3D geometric shape object for ray-tracing (implicit function).
		--CHit == an object that describes how 1 ray pierced the surface of 1 shape; 
		--CHitList == Array of all CHit objects for 1 ray traced thru entire CScene. 
*/

//----------------------------------------------------------------------------
// NOTE: JavaScript has no 'class-defining' statements or declarations: instead
// we simply create a new object type by defining its constructor function, and
// add member methods/functions using JavaScript's 'prototype' feature.
// SEE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype
//----------------------------------------------------------------------------

function CRay() {
    //=============================================================================
    // Object for a ray in an unspecified coord. system (usually 'world' coords).
    this.orig = vec4.fromValues(0, 0, 0, 1); // Ray starting point (x,y,z,w)
    // (default: at origin
    this.dir = vec4.fromValues(0, 0, -1, 0); // The ray's direction vector
    // (default: look down -z axis)
}

CRay.prototype.printMe = function () {
    //=============================================================================
    // print ray's values in the console window:
    if (name == undefined) name = " ";

    console.log(
        "CRay::" +
            this.constructor.name +
            ".origin:\t" +
            this.orig[0] +
            ",\t" +
            this.orig[1] +
            ",\t" +
            this.orig[2] +
            ",\t" +
            this.orig[3]
    );
    console.log(
        "     ",
        +this.constructor.name +
            ".direction:\t" +
            this.dir[0] +
            ",\t" +
            this.dir[1] +
            "\t" +
            this.dir[2] +
            ",\t" +
            this.dir[3]
    );
};

