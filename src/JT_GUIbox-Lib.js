//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  GUIbox-Lib.js library: 
  ===================== 
One 'GUIbox' object collects together everything our program needs to respond 
properly to all user inputs, including:
	--Mouse click, double-click, and drag,
	--Keyboard keyboard inputs,
	--HTML objects for Graphical User Interface, including:
		-- on-screen buttons users can 'push' (click)
		-- edit-boxes where users can enter numbers or text strings;
		-- spans where our program can print messages for users,
	--Window objects (e.g. browser) messages such as:
		--Window re-size, 
		--Window 'tool tips' (appear when mouse hovers over HTML5 element)
		--Window hide/reveal, etc.
USAGE:
=======================
1) Add the GUIbox-Lib.js function to your HTML file
  (be sure it's BEFORE the JS file that holds 'main()', like this:)
        ... (earlier HTML stuff) ...
    		<script src="JT_GUIbox-Lib.js"></script>
    		<script src_"myMainFile.js"></script>
    		... (later HTML stuff) ...
2) Create one global GUIbox object in your JS file that holds main(), like this:
   (How? put this line above your JS main() function):
      var gui = new GUIbox();
3) Near the start of main(), initialize your one global GUIbox object:
      gui.init();
    (where? be sure to put it AFTER creating the HTML-5 'canvas' element &
    and AFTER creating the WebGL drawing context, and before you begin any
    animation or GUI tasks)
4) Take a moment to read the rest of this file, to examine the 'gui' object's 
    methods.  Recommended:
    -- Please don't modify the mouse-event handling functions, but instead use 
    the xCVV, yCVV values to supply mouse-motion values in your program.
    -- Please *DO* extend the keyboard-event handling functions by expanding 
    their 'switch()' statements to respond to additional keys as needed.
*/


// Written for EECS 351-2,	Intermediate Computer Graphics,
//				Northwestern Univ. EECS Dept., Jack Tumblin
// 2018.05.20 Created, integrated into 'Week01' starter code for ray-tracing
// 2019.05.15 Updated comments & keyboard fcns to remove deprecated 'keyPress'
//==============================================================================
//=============================================================================
function GUIbox() {	
//=============================================================================
//==============================================================================
// CONSTRUCTOR for one re-usable 'GUIbox' object that holds all data and fcns 
// needed to capture and respond to all keyboard & mouse inputs/outputs.

  this.isDrag = false;	// mouse-drag: true while user holds down mouse button
  
  this.xCVV=1.0;			// Results found from last call to this.MouseToCVV()
  this.yCVV=0.0;

  this.xMpos=0.0;			// last recorded mouse position (in CVV coords)
  this.yMpos=0.0;   

  this.xMdragTot=0.0; // total (accumulated) mouse-drag amounts(in CVV coords).
  this.yMdragTot=0.0;  
}

GUIbox.prototype.init = function() {
//==============================================================================
// Set the browser window to use GUIbox member functions as 'callbacks' for all
// user-interface events.
// Call this function in main(), after you set up your HTML-5 canvas object and
// your WebGL drawing context.
  //BACKGROUND-------------------------------
	// (SEE:  https://www.w3schools.com/jsref/met_document_addeventlistener.asp)
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  

// --------!!! SURPRISE !!!-------------------------
// Our earlier, naive way of setting mouse callback functions made calls to
// isolated functions that were NOT members of an object or a prototype: 
//      (e.g.     window.addEventListener("mousedown", myMouseDown);  
//				  	called the stand-alone myMouseDown() function, usually
//					defined somewhere below main())
// That's the old, simple, obvious way, and it always works.
// But if we assemble all our callback functions into a nice neat GUIbox object, 
// and if the GUIbox init() function sets them as event-listeners like this:
//                window.addEventListener("mousedown", this.mouseDown);
// ----- .THEN SOMETHING WEIRD HAPPENS. -----
// Mouse-down events *DO* call our GUIbox's mouseDown() member function, but
// inside mouseDown() we can't use 'this' to access any other GUIbox members;
//      console.log('this.isDown', this.isDown); //  prints 'undefined'
//      console.log('this:', this); // prints object that CALLED our callback!
// WHY THIS HAPPENS:
// --Callback functions are 'closures'; when executing them, 'this' refers to
//  the object that was given the closure, and not the object that contains the
//  function.
// HOW TO FIX IT:
//  Read down thru the code just above 'Legacy Internet Explorer..." here:
//   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
// I think the simplest solution is to use closures more cleverly:
//  a) Within our 'init()' function, create a local object I will call 'that'. 
//     The 'that' variable is just a simple reference to our GUIbox object.
//  b) Create an anonymous (e.g. no-name) function to use as our callback; 
//  c) within the 'anonymous' function, use the 'that' object to call the 
//      desired (named) method we want to use as our callback.  Inside the named
//      callback function (e.g. that.mouseDown() ), you will find that 'this'
//      refers to the GUIbox object specified by 'that', and we now can access
//      other GUIbox members we may need such as xCVV, etc.  Whew!
//-----------------------------------MORE ON THIS TOPIC:
  // https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
  // TUTORIAL: http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/
  // TUTORIAL: https://www.w3schools.com/js/js_function_closures.asp
//------------------------------------------------------------------------------

  var that = this;    // (local) var/reference to the current GUIbox object;
                      // used in anonymous functions to restore simple
                      // expected behavior of 'this' inside GUIbox functions. 
	// MOUSE:--------------------------------------------------
  window.addEventListener("mousedown", 
        function(mev) {return that.mouseDown(mev);     } ); 
	// (After each 'mousedown' event, browser calls this anonymous method that
	//    does nothing but return the 'that' object's mouseDown() method.
	//    WHY? to ensure proper operation of 'this' within the mouseDown() fcn.)
  window.addEventListener("mousemove", 
        function(mev) {return that.mouseMove(mev);     } ); 
	window.addEventListener("mouseup",   
	      function(mev) {return that.mouseUp(mev);       } );	
//------------------HINT: If you don't need them, comment out these Event Listeners:
	window.addEventListener("click",
	      function(mev) {return that.mouseClick(mev);    } );			
	window.addEventListener("dblclick",  
	      function(mev) {return that.mouseDblClick(mev); } ); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, add the event
	// listener to the 'g_canvasID' object instead of the 'window' object:
	g_canvasID.addEventListener("click", 
	      function(mev) {return that.canvasClick(mev);   } );
//--------------------(END HINT)-----------
	// ?Arguments?
	// Wait wait wait -- these 'listeners' just NAME the function called when 
	// the event occurs! How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments.
  // SEE: 'MouseClick()' function body below for an example
  //----------------------------------------------------------------------------
  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", 
	      function(kev) {return that.keyDown(kev);  }, false);
	// After each 'keydown' event, call the 'KeyDown()' function; 'false'
	// (default) means event handler executed in  'bubbling', not 'capture')
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", 
	      function(kev) {return that.keyUp(kev);    }, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	// NOTE: please don't use the 'keypress' event -- It's been deprecated!
	//	see: https://developer.mozilla.org/en-US/docs/Web/API/Document/keypress_event
	// END Mouse & Keyboard Event-Handlers----------------------------------------

		// REPORT initial mouse-drag totals on-screen: (should be zeroes)
		document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + 
			this.xMdragTot.toFixed(5) + ', \t' + this.yMdragTot.toFixed(5);	
}

GUIbox.prototype.mouseDown = function(mev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?  console.log('mev.button=' + mev.button);  )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS(!)  

//console.log("called GUIbox.mouseDown(mev)");
//  That's not good for us -- convert to CVV coordinates instead:
	this.mouseToCVV(mev);									// convert to CVV coordinates:
																			// (result in  this.xCVV, this.yCVV)
	this.xMpos = this.xCVV;             // save current position, and...
	this.yMpos = this.yCVV;
	this.isDrag = true;						  		// set our mouse-dragging flag
	// display it on our webpage, too...
	document.getElementById('MouseResult0').innerHTML = 
	  'GUIbox.mouseDown() at CVV coords x,y = ' + 
	  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5);
	console.log('GUIbox.mouseDown(): xMpos,yMpos== ' + 
	  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5));
}

GUIbox.prototype.mouseMove = function(mev) {	
//=============================================================================
// Called when user MOVES the mouse, with or without a button  pressed down.
// 									(Which button?   console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
//  That's not good for us -- convert to CVV coordinates instead:

//console.log("GUIbox.mouseMove(): isDrag==", this.isDrag);
	if(this.isDrag==false) return;		// IGNORE all mouse-moves except 'dragging'
//	console.log("called GUIbox.mouseMove(mev)");	
  this.mouseToCVV(mev);							// convert to CVV coordinates:
	                                  // (result in this.xCVV, this.yCVV)
	// find how far we dragged the mouse:
	this.xMdragTot += (this.xCVV - this.xMpos); // Accumulate change-in-mouse-position,&
	this.yMdragTot += (this.yCVV - this.yMpos);
	this.xMpos = this.xCVV;	                    // Make next drag-measurement from here.
	this.yMpos = this.yCVV;

  // Report mouse-drag totals on our webpage:
	document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + 
			this.xMdragTot.toFixed(5) + ', \t' + this.yMdragTot.toFixed(5);	
}

GUIbox.prototype.mouseUp = function(mev) {
//=============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
//  That's not good for us -- convert to CVV coordinates instead:

//	console.log("called GUIbox.mouseUp(mev)");
	this.mouseToCVV(mev);               // CONVERT event to CVV coord system 
	this.isDrag = false;								// CLEAR our mouse-dragging flag, and
	// accumulate any final portion of mouse-dragging we did:
	this.xMdragTot += (this.xCVV - this.xMpos);
	this.yMdragTot += (this.yCVV - this.yMpos);
	this.xMpos = this.xCVV;             // RECORD this latest mouse-position.
	this.yMpos = this.yCVV;

//----- DIAGNOSTIC:
	console.log('GUIbox.mouseUp: xMdragTot,yMdragTot =', 
	              this.xMdragTot.toFixed(5), ',\t', 
	              this.yMdragTot.toFixed(5));
//----- END DIAGNOSTIC.

	// display it on our webpage, too...
	document.getElementById('MouseResult0').innerHTML = 
	'GUIbox.mouseUp(       ) at CVV coords x,y = ' + 
	              this.xMpos.toFixed(5) + ', ' + 
	              this.yMpos.toFixed(5);
}

GUIbox.prototype.mouseToCVV = function(mev) {
//==============================================================================
// CONVERT mouse event 'mev' from the given 'client' coordinates (left-handed
// pixel coordinates within the browser window, with origin at upper left) 
// to Canonical View Volume (CVV) coords GUIbox.xCVV, GUIbox.yCVV.
// Define these 'CVV' coords using the HTML-5 'canvas' object in our webpage:
// -- right handed (x increases rightwards, y increases upwards on-screen)
// -- origin at the center of the canvas object in the browser client area;
// -- GUIbox.xCVV== -1 at left edge of canvas, +1.0 at right edge of canvas;
// -- GUIbox.yCVV== -1 at bottom edge of canvas, +1 at top edge of canvas.

//	console.log("called GUIbox.mouseToCVV(mev)");
var rect = g_canvasID.getBoundingClientRect(); // get canvas corners in pixels
var xp = mev.clientX - rect.left;						   // x==0 at canvas left edge
var yp = g_canvasID.height -(mev.clientY -rect.top); 
   																							// y==0 at canvas bottom edge
//  console.log('GUIbox.mousetoCVV()--in pixel coords: xp,yp=\t',xp,',\t',yp);

	// Then convert to Canonical View Volume (CVV) coordinates:
  this.xCVV = (xp - g_canvasID.width/2)  /  // move origin to center of canvas and
              (g_canvasID.width/2);	  // normalize canvas to -1 <= x < +1,
	this.yCVV = (yp - g_canvasID.height/2) /  //							 -1 <= y < +1.
	            (g_canvasID.height/2);
}

//------------These next 3 functions:
//				 	 mouseClick(), mouseDblClick(), canvasClick()
//------------are here for completeness -- remove/comment-out if you don't need them.

GUIbox.prototype.mouseClick = function(mev) {
//==============================================================================
// User made a single mouse-click in the client area of browser window.
//
// NOTE:  I don't use this, but you might want it in your program.
// I avoid using this.mouseClick() and this.mouseDblClick() because they combine 
// multiple events -- I prefer separate mousedown, mouseup, mousemove event
// handlers because they let me respond more adeptly to users' mouse actions,
// especially 'dragging' actions.

console.log("called GUIbox.mouseClick(mev).");

 // USEFUL TRICK: REPORT ALL FUNCTION ARGUMENTS
	console.log("GUIbox.mouseClick()---------REPORT ALL ARGUMENTS!");
	for(var i=0; i< arguments.length; i++) {// LIST all function-call arguments:
		console.log('\targ[' + i + '] == ' + arguments[i]);
	}
	console.log("---------------------(end this.mouseClick() argument list)");		

	// display contents of the 'mouseEvent' object passed as argument. See:
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent 
	console.log(   mev.altKey + ',\t'     + mev.ctrlKey + 
	         '\t== mev.altKey, ctrlKey');		// true/false
	console.log(   mev.shiftKey + ',\t'   + mev.metaKey +
	         '\t== mev.shiftKey, metaKey');	// true/false
	console.log(   mev.button   + ',\t\t' + mev.buttons +
	         '\t\t== ev.button, buttons');		// >1 button?
	console.log(   mev.clientX  + ',\t'   + mev.clientY +
	       '\t\t== mev.clientX,Y');	
	 				// Mouse pointer x,y pixel position in browser-window 'client' 
	 				// coordinates, with origin at UPPER LEFT corner, integer 
	 				// x increases rightwards, y increases DOWNWARDS, in pixel units.
	console.log( mev.movementX + ',\t\t'  + mev.movementY + 
	         '\t\t== mev.movementX,Y');

}

GUIbox.prototype.mouseDblClick = function(mev) {
//==============================================================================
// User made a double mouse-click in the client area of browser window.
//
// NOTE:  I don't use this, but you might want it in your program.
// I avoid using GUIbox.mouseClick() and GUIbox.mouseDblClick() because they 
// combine multiple events -- I prefer separate mousedown, mouseup, mousemove 
// event handlers because they let me respond more adeptly to users' mouse 
// actions, especially 'dragging' actions.

console.log("called GUIbox.mouseDblClick(mev).");

	// print contents of the 'mouseEvent' object passed as argument. See:
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent 
	console.log(   mev.altKey + ',\t'     + mev.ctrlKey + 
	         '\t== mev.altKey, ctrlKey');		// true/false
	console.log(   mev.shiftKey + ',\t'   + mev.metaKey +
	         '\t== mev.shiftKey, metaKey');	// true/false
	console.log(   mev.button   + ',\t\t' + mev.buttons +
	         '\t\t== ev.button, buttons');		// >1 button?
	console.log(   mev.clientX  + ',\t'   + mev.clientY +
	       '\t\t== mev.clientX,Y');	
	 				// Mouse pointer x,y pixel position in browser-window 'client' 
	 				// coordinates, with origin at UPPER LEFT corner, integer 
	 				// x increases rightwards, y increases DOWNWARDS, in pixel units.
	console.log( mev.movementX + ',\t\t'  + mev.movementY + 
	         '\t\t== mev.movementX,Y');
}

GUIbox.prototype.canvasClick = function(mev) {
//=============================================================================
// Called when user CLICKS mouse button within the HTML-5 canvas
// 									(Which button?  console.log('mev.button=' + mev.button); )
// 	mev.clientX, mev.clientY == mouse pointer location, but measured in webpage 
//	pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS(!)  
//  That's not good for us -- convert to CVV coordinates instead:

	console.log("called GUIbox.canvasClick(mev)");
	
	this.mouseToCVV(mev);							// convert to CVV coordinates:
	                                  // (result in this.xCVV, this.yCVV)
	// display it on our webpage, too...
	document.getElementById('MouseCanvas').innerHTML = 
	  'gui.canvasClick() at CVV coords xCVV,yCVV = ' + 
	  gui.xCVV.toFixed(5) + ', ' + gui.yCVV.toFixed(5);
	console.log('gui.canvasClick(): xCVV,yCVV== ' + 
	  gui.xCVV.toFixed(5) + ', ' + gui.yCVV.toFixed(5));
}


//====================
//
//    KEYBOARD
//
//=====================


GUIbox.prototype.keyDown = function(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 5/2019:  use kev.key and kev.code instead.
//
/*
	// On console, report EVERYTHING about this key-down event:  
  console.log("--kev.code:",      kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
  // On webpage, report EVERYTHING about this key-down event:              
	document.getElementById('KeyDown').innerHTML = ''; // clear old result
  document.getElementById('KeyMod').innerHTML = ''; 
  document.getElementById('KeyMod' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;  

  switch(kev.code) {
    case "Digit0":
			document.getElementById('KeyDown').innerHTML =  
			'GUIbox.KeyDown() digit 0 key.(UNUSED)';          // print on webpage,
			console.log("digit 0 key.(UNUSED)");              // print on console.
      break;
    case "Digit1":
			document.getElementById('KeyDown').innerHTML =  
			'mguiBox.KeyDown() digit 1 key.(UNUSED)';         // print on webpage,
			console.log("digit 1 key.(UNUSED)");              // print on console.
      break;
		//------------------Ray Tracing---------------------- 
    case "KeyC":                // Clear the ray-traced image
			document.getElementById('KeyDown').innerHTML =  
			'GUIbox.KeyDown() c/C key: CLEAR the ray-traced image buffer.';// print on webpage,
			console.log("c/C: CLEAR ray-traced img buf");     // print on console,
      break;
    case "KeyT":                                // 't' or 'T' key: ray-trace!
		  document.getElementById('KeyDown').innerHTML =  
		  'GUIbox.KeyDown() t/T key: TRACE a new image!';	    // print on webpage,
	    console.log("t/T key: TRACE a new image!");         // print on console,
      break;
		//------------------WASD navigation-----------------
		case "KeyA":
			document.getElementById('KeyDown').innerHTML =  
			'GUIbox.KeyDown() a/A key. Strafe LEFT!';
			console.log("a/A key: Strafe LEFT!\n");
			break;
		case "KeyD":
			document.getElementById('KeyDown').innerHTML = 
			'GUIbox.KeyDown() d/D key. Strafe RIGHT!';
			console.log("d/D key: Strafe RIGHT!\n");
			break;
		case "KeyS":
			document.getElementById('KeyDown').innerHTML = 
			'GUIbox.KeyDown() s/S key. Move REV!';
			console.log("s/S key: Move REV!\n");
			break;
		case "KeyW":
			document.getElementById('KeyDown').innerHTML =  
			'GUIbox.keyDown() w/W key. Move FWD!';
			console.log("w/W key: Move FWD!\n");
			break;		
		case "ArrowLeft": 	
  		document.getElementById('KeyDown').innerHTML =
  			'GUIbox.KeyDown() Arrow-Left,key='+kev.key;
			console.log("Arrow-Left key(UNUSED)");
  		break;
		case "ArrowRight":
  		document.getElementById('KeyDown').innerHTML =
  			'GUIbox.KeyDown() Arrow-Right,key='+kev.key;
  		console.log("Arrow-Right key(UNUSED)");
  		break;
		case "ArrowUp":		
  		document.getElementById('KeyDown').innerHTML =
  			'GUIbox.KeyDown() Arrow-Up,key='+kev.key;
  		console.log("Arrow-Up key(UNUSED)");
			break;
		case "ArrowDown":
  		document.getElementById('KeyDown').innerHTML =
  			'GUIbox.KeyDown() Arrow-Down,key='+kev.key;
  			console.log("Arrow-Down key(UNUSED)");
  		break;	
    default:
  		document.getElementById('KeyDown').innerHTML =
  			'GUIbox.KeyDown() UNUSED key='+kev.key;
  		console.log("UNUSED key:", kev.key);
      break;
  }
}

GUIbox.prototype.keyUp = function(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// You probably don't want to use this ('this.keyDown()' explains why)...

	console.log('myKeyUp()--key='+kev.key+' released.');
}
