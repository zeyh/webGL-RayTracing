function CScene() {
    //=============================================================================
    // A complete ray tracer object prototype (formerly a C/C++ 'class').
    //      My code uses just one CScene instance (g_myScene) to describe the entire
    //			ray tracer.  Note that I could add more CScene objects to make multiple
    //			ray tracers (perhaps on different threads or processors) and then
    //			combine their results into a giant video sequence, a giant image, or
    //			use one ray-traced result as input to make the next ray-traced result.
    //
    //The CScene class includes:
    // One CImgBuf object that holds a floating-point RGB image, and uses that
    //		  image to create a corresponding 8,8,8 bit RGB image suitable for WebGL
    //			display as a texture-map in an HTML-5 canvas object within a webpage.
    // One CCamera object that describes an antialiased ray-tracing camera;
    //      in my code, it is the 'rayCam' variable within the CScene prototype.
    //      The CCamera class defines the SOURCE of rays we trace from our eyepoint
    //      into the scene, and uses those rays to set output image pixel values.
    // One CRay object 'eyeRay' that describes the ray we're currently tracing from
    //      eyepoint into the scene.
    // One CHitList object 'eyeHits' that describes each 3D point where 'eyeRay'
    //      pierces a shape (a CGeom object) in our CScene.  Each CHitList object
    //      in our ray-tracer holds a COLLECTION of hit-points (CHit objects) for a
    //      ray, and keeps track of which hit-point is closest to the camera. That
    //			collection is held in the eyeHits member of the CScene class.
    // a COLLECTION of CGeom objects: each describe an individual visible thing; a
    //      single item or thing we may see in the scene.  That collection is the
    //			held in the 'item[]' array within the CScene class.
    //      		Each CGeom element in the 'item[]' array holds one shape on-screen.
    //      To see three spheres and a ground-plane we'll have 4 CGeom objects, one
    //			for each of the spheres, and one for the ground-plane.
    //      Each CGeom obj. includes a 'matlIndex' index number that selects which
    //      material to use in rendering the CGeom shape. I assume ALL lights in a
    //      scene may affect ALL CGeom shapes, but you may wish to add an light-src
    //      index to permit each CGeom object to choose which lights(s) affect it.
    // a COLLECTION of CMatl objects; each describes one light-modifying material'
    //      hold this collection in  'matter[]' array within the CScene class).
    //      Each CMatl element in the 'matter[]' array describes one particular
    //      individual material we will use for one or more CGeom shapes. We may
    //      have one CMatl object that describes clear glass, another for a
    //      Phong-shaded brass-metal material, another for a texture-map, another
    //      for a bump mapped material for the surface of an orange (fruit),
    //      another for a marble-like material defined by Perlin noise, etc.
    // a COLLECTION of CLight objects that each describe one light source.
    //			That collection is held in the 'lamp[]' array within the CScene class.
    //      Note that I apply all lights to all CGeom objects.  You may wish to add
    //      an index to the CGeom class to select which lights affect each item.
    //
    // The default CScene constructor creates a simple scene that will create a
    // picture if traced:
    // --rayCam with +/- 45 degree Horiz field of view, aimed at the origin from
    // 			world-space location (0,0,5)
    // --item[0] is a unit sphere at the origin that uses matter[0] material;
    // --matter[0] material is a shiny red Phong-lit material, lit by lamp[0];
    // --lamp[0] is a point-light source at location (5,5,5).

    this.RAY_EPSILON = 1.0e-15; // ray-tracer precision limits; treat
    this.imgBuf = g_myPic;
    this.eyeRay = new CRay();
    this.rayCam = new CCamera();
    this.item = [];
}

CScene.prototype.setImgBuf = function(nuImg) {
    //==============================================================================
    // set/change the CImgBuf object we will fill with our ray-traced image.
    // This is USUALLY the global 'g_myPic', but could be any CImgBuf of any
    // size.  
    
      // Re-adjust ALL the CScene methods/members affected by output image size:
      this.rayCam.setSize(nuImg.xSiz, nuImg.ySiz);
      this.imgBuf = nuImg;    // set our ray-tracing image destination.
    }
    
    CScene.prototype.initScene = function(num) {
    //==============================================================================
    // Initialize our ray tracer, including camera-settings, output image buffer
    // to use.  Then create a complete 3D scene (CGeom objects, materials, lights, 
    // camera, etc) for viewing in both the ray-tracer **AND** the WebGL previewer.
    // num == 0: basic ground-plane grid;
    //     == 1: ground-plane grid + round 'disc' object;
    //     == 2: ground-plane grid + sphere
    //     == 3: ground-plane grid + sphere + 3rd shape, etc.
    
      if(num == undefined) num = 0;   // (in case setScene() called with no arg.)
      // Set up ray-tracing camera to use all the same camera parameters that
      // determine the WebGL preview.  GUIbox fcns can change these, so be sure
      // to update these again just before you ray-trace:
      this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
      this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);
      this.setImgBuf(g_myPic);    // rendering target: our global CImgBuf object
                                  // declared just above main().
      // Set default sky color:
      this.skyColor = vec4.fromValues( 0.3,1.0,1.0,1.0);  // cyan/bright blue
      // Empty the 'item[] array -- discard all leftover CGeom objects it may hold.
      this.item.length = 0;       
      var iNow = 0;         // index of the last CGeom object put into item[] array
      
      // set up new scene:
      switch(num) {
        case 0:     // (default scene number; must create a 3D scene for ray-tracing
          // create our list of CGeom shapes that fill our 3D scene:
          //---Ground Plane-----
          // draw this in world-space; no transforms!
          this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
          iNow = this.item.length -1;               // get its array index.
                                                    // use default colors.
                                                    // no transforms needed.
          //-----Disk 1------           
          this.item.push(new CGeom(RT_DISK));         // Append 2D disk to item[] &
          iNow = this.item.length -1;                 // get its array index.
    //      console.log('iNow should be 1; it is:', iNow);
          // set up distinctive coloring:
            vec4.set(this.item[iNow].gapColor,  0.3,0.6,0.7,1.0); // RGBA(A==opacity) bluish gray   
            vec4.set(this.item[iNow].lineColor, 0.7,0.3,0.3,1.0);  // muddy red
            // Now apply transforms to set disk's size, orientation, & position.
            // (Be sure to do these same transforms in WebGL preview; find them in the
            //  JT_VBObox-lib.js file, in VBObox0.draw() function)
            this.item[iNow].setIdent();                   // start in world coord axes
          this.item[iNow].rayTranslate(1,1,1.3);        // move drawing axes 
                                                        // RIGHT, BACK, & UP.
          this.item[iNow].rayRotate(0.25*Math.PI, 1,0,0); // rot 45deg on x axis to face us
          this.item[iNow].rayRotate(0.25*Math.PI, 0,0,1); // z-axis rotate 45deg.
          
          //-----Disk 2------ 
          this.item.push(new CGeom(RT_DISK));         // Append 2D disk to item[] &
          iNow = this.item.length -1;                 // get its array index.
          // set up distinctive coloring:
          vec4.set(this.item[iNow].gapColor,  0.0,0.0,1.0,1.0); // RGBA(A==opacity) blue
            vec4.set(this.item[iNow].lineColor, 1.0,1.0,0.0,1.0);  // yellow
            // Now apply transforms to set disk's size, orientation, & position.
            // (Be sure to do these same transforms in WebGL preview; find them in the
            //  JT_VBObox-lib.js file, in VBObox0.draw() function)
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-1,1,1.3);         // move drawing axes 
                                                            // LEFT, BACK, & UP.
          this.item[iNow].rayRotate(0.75*Math.PI, 1,0,0); // rot 135 on x axis to face us
          this.item[iNow].rayRotate(Math.PI/3, 0,0,1);    // z-axis rotate 60deg.
    
          //-----Sphere 1-----
          this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
          iNow = this.item.length -1;                 // get its array index.
          // Initially leave sphere at the origin. Once you see it, then
          // move it to a more-sensible location:
            this.item[iNow].setIdent();                   // start in world coord axes
          this.item[iNow].rayTranslate(1.2,-1.0, 1.0);  // move rightwards (+x),
          // and toward camera (-y) enough to stay clear of disks, and up by 1 to
          // make this radius==1 sphere rest on gnd-plane.
          //
          //
          // additional SCENE 0 SETUP   
          //
          //
          break;
        case 1:
        //
        //
        // another: SCENE 1 SETUP   
          console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
          this.initScene(0); // use default scene
        //
        //
          break;
        case 2:
        //
        //
        // another: SCENE 2 SETUP   
          console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");    //
          this.initScene(0); // use default scene
        //
          break;
        default:    // nonsensical 'sceneNum' value?
          console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
          this.initScene(0);   // init the default scene.
        break;
      }
    }
    
    CScene.prototype.makeRayTracedImage = function() {
    //==============================================================================
    // Create an image by Ray-tracing; fill CImgBuf object  'imgBuf' with result.
    // (called when you press 'T' or 't')
    
    //	console.log("You called CScene.makeRayTracedImage!")
      // Update our ray-tracer camera to match the WebGL preview camera:
        this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
        this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);
    
        this.setImgBuf(this.imgBuf);  // just in case: this ensures our ray-tracer
                                      // will make an image that exactly fills the
                                      // currently-chosen output-image buffer.
                                      // (usually g_myPic, but could have changed)
                                      
      var colr = vec4.create();	// floating-point RGBA color value
        var hit = 0;
        var idx = 0;  // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
      var i,j;      // pixel x,y coordinate (origin at lower left; integer values)
      var k;        // item[] index; selects CGeom object we're currently tracing.
      
      this.pixFlag = 0; // DIAGNOSTIC: g_myScene.pixFlag == 1 at just one pixel
                      // selected below. Ray-tracing functions (e.g. traceGrid(), 
                      // traceDisk()) can use g_)myScene.pixFlag to let you print 
                      // values for JUST ONE ray.
      var myHit = new CHit(); // holds the nearest ray/grid intersection (if any)
                              // found by tracing eyeRay thru all CGeom objects
                              // held in our CScene.item[] array.
                               
      for(j=0; j< this.imgBuf.ySiz; j++) {        // for the j-th row of pixels.
          for(i=0; i< this.imgBuf.xSiz; i++) {	    // and the i-th pixel on that row,
                this.rayCam.setEyeRay(this.eyeRay,i,j);  // create ray for pixel (i,j)
          // DIAGNOSTIC:------------------------------------
          if(i==this.imgBuf.xSiz/2 && j==this.imgBuf.ySiz/4) { 
            this.pixFlag = 1;                     // pixFlag==1 for JUST ONE pixel
            console.log("CScene.makeRayTracedImage() is at pixel [",i,", ",j,"].",
                        "by the cunning use of flags. (Eddie Izzard)");
            // Eddie Izzard "Dress To Kill"(1998)  
            //    short: https://youtu.be/uEx5G-GOS1k 
            //     long: https://youtu.be/hxQYE3E8dEY 
          }
          else {
            this.pixFlag = 0;
          }//-END DIAGNOSTIC--------------------------------
          
              // Trace a new eyeRay thru all CGeom items: ------------------------------
          myHit.init();     // start by clearing our 'nearest hit-point', and
          for(k=0; k< this.item.length; k++) {  // for every CGeom in item[] array,
              this.item[k].traceMe(this.eyeRay, myHit);  // trace eyeRay thru it,
          }                                   // & keep nearest hit point in myHit.
              
    /*
          if(this.pixFlag == 1) { // print values during just one selected pixel
            console.log("flag: x,y:myHit", i,j, myHit);
          }
    */
            // Find eyeRay color from myHit-----------------------------------------
                if(myHit.hitNum==0) {  // use myGrid tracing to determine color
                    vec4.copy(colr, myHit.hitGeom.gapColor);
                }
                else if (myHit.hitNum==1) {
                    vec4.copy(colr, myHit.hitGeom.lineColor);
                }
                else { // if myHit.hitNum== -1)
                  vec4.copy(colr, this.skyColor);
                }
    
                // Set pixel color in our image buffer------------------------------------
              idx = (j*this.imgBuf.xSiz + i)*this.imgBuf.pixSiz;	// Array index at pixel (i,j) 
              this.imgBuf.fBuf[idx   ] = colr[0];	
              this.imgBuf.fBuf[idx +1] = colr[1];
              this.imgBuf.fBuf[idx +2] = colr[2];
          }
      }
      this.imgBuf.float2int();		// create integer image from floating-point buffer.
    }
    