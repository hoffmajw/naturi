/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.ClassName = class {
	constructor() {

	}

	methodName() {

	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	var planet = planetaryjs.planet();
	
	// Make the planet fit well in its canvas
	planet.projection.scale(250).translate([250, 250]);
	var canvas = document.getElementById('globe');
	planet.draw(canvas);
};

rhit.main();
