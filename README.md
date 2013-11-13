#DOTS

A javascript prototyping example, written by Jocko MacGregor.

Index
-----

  - [The Classes](#the-classes)
    - [Dot](#dot-class)
    - [Engine](#engine-class)
  - [Helpers](#helpers)
    - [Animation Frame Handling](#animation-frame-handling)
    - [Querying the DOM](#querying-the-dom-dom)
    - [DOM Attributes](#dom-attributes)

##The Classes

There are two classes that manage animating the dots on the canvas.
  1. [**Dot**](#dot-class) - Manages the display and movement of each dot, relative to both the canvas and the other dots.
  2. [**Engine**](#engine-class) - Manages the animation loop and canvas updates.

###Dot Class

The Dot class manages the display and movement of each dot by calculating the vector (direction and speed) of the dot based on the amount of time that has passed since the lass animation cycle of the engine.

Additionally the class detects collisions with the canvas boundary and calculations the deflection angle of the dot, and also detects collisions with other dots and redirects the dot to avoid impacts.


#### Constructor
  - **Dot**(engine, id, x, y, radius, fillStyle, direction, speed, context) - Instantiates a new Dot object.
    - The values passed in correllate to the properties listed in the next section.

####Properties

The following properties are available to the Dot class:

  - **engine** - A reference to the animation engine.  This allows each dot instance to reference the canvas, the context, other dot instances and the engine's current state.
  - **ctx** - The canvas drawing context.
  - **id** - A unique identifier that allows each dot instance to be tracked by the engine.
  - **x** - The current X position of the dot in the canvas.
  - **y** - The current Y position of the dot in the canvas.
  - **fillStyle** - The dot's fill style which identifies the color of the dot on the canvas
  - **radius** - The radius (in pixels) of the dot.
  - **direction** - The direction angle of the dots movement (measured in radians).  The angle a clock-wise rotation from the postive-x axis.
  - **speed** - How far the dot moves (in pixels) during one second of time (delta=1).
  - **safeRange** - How close (in pixels) another dot can get before the avoidance algorithm is actuated.
  - **showVector** - A boolean value that determines whether or not the vector and safe distance is drawn with the dot.
  - **showInfo** - A boolean value that determines whether or not to display the dots current information with the dot on the canvas.
  - **avoidEachOther** - A boolean value that determines whether or not this dot should attempt to avoid other dots.
  - **vector** - The current vector (direction and speed) calculations for the dot, includes the X,Y position of the vector (assuming delta=1), the X,Y offset from the current position, direction and speed.
  - **sectors** - A dynamic list of the sectors the dot is currently related to.  This reduces that number of attempts to detect collisions with other dots by limiting the search to only the sectors the dot is currently affected by.

####Methods

The following methods manage the Dot classes behaviors:
  - **draw**(delta) - Redraws the dot on the canvas after its movement has been determined.
    - **delta** - Identifies how much time has passed since the last call.
  - **move**(delta) - Determine how much movement to generate for the dot in each animation cycle.
    - **delta** - Identifies how much time has passed since the last call.
  - **rotate**(radians) - Rotates the dot's direction by a given number of radians.
    - **radians** - How many radians to rotate by.
  - **rotateTo**(radians) - Rotates the dot's direction to a specific number of radians off of 0.
    - **radians** - The direction (in radians) the dot should be rotated to.
  - **calculateAvoidanceAngle**(dot) - Determines the amount of rotation necessary for this dot and another to avoid each other.
    - **dot** - A dot object to be avoided by this dot object. 
  - **calculateDeltaVector**(delta) - Recalculates the current dot vector to account for the delta time.  This reduces the amount of calculations necessary to determine the next movement for the dot.
    - **delta** - Identifies how much time account for when calculating the vector. 
  - **setVector**() - Recalculates and sets the dots current vector based on its current direction and speed.
  - **calculateVector**(direction) - Calculates the vector position for the dot, assuming that the delta time is 1. This provides us with the necessary speed and direction for each step the dot will take in its path.
    - **direction** (optional) - The direction to use when calculating the vector, will default to the dots current direction if one is not provided.
  - **calculateDistance**(point) - Determine the distance betwen this dot and a point on the canvas.
    - **point** - Any object that contains both x and y position properties.
  - **offset**(point) - Move the dot from its current position by the x and y amount provided by the point.
    - **point** - Any object that contains both x and y position properties.
  - **isOutOfBounds**() - Determines if the dot has moved out of bounds, returning **false** if it has, or an object containing the x and y values of how far out of bounds it has moved: { x: 0, y: 0 }

###Engine Class

The Engine Class manages the animation of the dots on the canvas, and their sector assignments.

Sector assignment reduces the number of calculations generated per cycle by isolating dots to smaller areas of the canvas, and preventing them from attempting collision detection on dots that are obviously out of range.

####Constructor

  - **Engine**(canvas, sectorSize) - Instantiates a new Engine object.
    - **canvas** - A reference to the canvas DOM object.
    - **sectorSize** - How large (in pixels) each sector square should be.

####Properties

The following properties are available to the Engine class:

  - **lastCycleTime** - The time of the last cycle of the engine's animation loop.  This is used to calculate the time delta.
  - **running** - A boolean representing the current running status of the engine.
  - **dots** - An array containing references to all of the dots managed by the engine.
  - **sectors** - An JSON object containing references to each canvas sector.

####Methods

The following methods manage the Engine classes behaviors:

  - **start**(dotCount, clearCanvas, showVector, showInfo, avoidEachOther) - Initializes and starts the engine animation cycle.
    - **dotCount** - The number of dots to randomly generate on the canvas. 
    - **clearCanvas** - A boolean identifying whether or not to clear the canvas after each animation cycle.
    - **showVector** - A boolean identifying whether or not to draw the vector and safeRange of each dots.
    - **showInfo** - A boolean identifying whether or not to display the dot information for each of the dots.
    - **avoidEachOther** - A boolean identifying whether or not the dots should avoid each other.
  - **proceed**() - Resumes the engine animation cycle after a stopped state.
  - **stop**() - Stop the engine's animation cycle.
  - **run**() - Runs through one cycle of the engine and requests another cycle if the running state is set to **true**.
  - **buildSectors**() - Divides the canvas up into small sectors that can be used to reduce the number of checks a Dot needs to do to determine nearby dots for collision detection.
  - **registerDotSectors**(dot) - Determine which sector(s) a dot is in and add the dot to the appropriate sector lists.
    - **dot** - The dot to register in the sector list(s).
  - **getSector**(point) - Return which sector a given point is located in.
    - **point** - Any object that contains both x and y position properties.
  - **getSectorKey**(sectorPosition) - Return a sector key string for use in identifying sectors in the sector list.
    - **sectorPosition** - An x,y sector position. (not to be confused with a point, which is a pixel location)
  - **draw**(delta) - Draw the dot objects on the canvas for one animation cycle.
    - **delta** - Identifies how much time has passed since the last call.
  - **getTime**() - Gets the current system time converted to seconds for use in the delta calculations.
  - **showVectors**(show) - Turn on/off the vector and safeRange drawing for all dots.
    - **show** - A boolean determining whether to show or hide the vector and safeRange drawing.
  - **showInfo**(show) - Turn on/off the dot information for all dots.
    - **show** - A boolean determining whether to show or hide the dot information.
  - **avoidEachOther**(avoid) - Turn on/off the avoidance algorithm for avoiding other dots.
    - **avoid** - A boolean determining whether to use the algorithm or not.
  - **generateRandomDot**(id) - Build a random dot and associate it with the engine.
    - **id** - The unique id of the newly generated dot.

##Helpers

Various helper structures have been implemented to assist in making the UI more manageable and facilitating the animation cycling of the engine.

### Animation Frame Handling

This code is not my own, I pulled it off of the web, but it allows the animation engine to be more dependable across browsers, display smoother animations, and preserve battery life on mobile devices and laptops.  This call works by checking for the existence of a browser based *requestAnimationFrame* method.  If one is not found, a javascript Timeout is established that mimics the animation frame process, albeit less accurately and efficiently.

NOTE: The script source can be found on [Paul Irish's website](http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/) with a better explanation, although I'm hesistant to credit him with its creation since the code has become ubiquitous, and is referenced in the same format elsewhere on the internet.

```javascript
/**
 * Establish an animation frame request based on the browser we're in, if there is no
 * built in request, we'll build one from scratch to fall back on.
 */
window.requestAnimFrame = function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}();
```

### Querying the DOM (dom)

To handle querying the DOM more easily, I implemented my own flavor of DOM query ala jQuery, but in a much more lightweight format.

####Querying Elements

Querying is done in much the same fashion as jQuery.  Call the 'dom' method with the object query string as a parameter like so:

```javascript
  dom('#some-dom-object-id');
  dom('.some-dom-object-class');
  dom('some-tag-name');
```

####Wiring Click Events

Again, much like jQuery, you can assign a function to the click event handler.

Unlike jQuery, this can only assign one click event function per object, as this interface doesn't require the more robust click-stack approach provided by jQuery.

```javascript
  dom('#some-dom-object-id').click(function(evt) { ... });
```
####DOM Attributes

Attributes can be added or queried from objects in a fashion similar to jQuery.

```javascript
  dom('#some-dom-object-id').attr('selected', 'selected') // Sets the 'selected' attribute to 'selected'
  dom('#some-dom-object-id').attr('selected')             // Returns the 'selected' attributes current value
```

Attributes can be removed as well.

```javascript
  dom('#some-dom-object-id').removeAttr('selected');
```
