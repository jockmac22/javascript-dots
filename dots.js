/**
 * DOTS - A Javascript prototyping example
 *
 * Author: 	Jocko MacGregor
 * Date: 	November 10, 2013
 *
 * The DOTS Javascript is based on two primary class structures, a Dot, which controls the movement and display of the dots on the canvas, and the Engine, which controls the animation timing, and Dot generation.
 *
 * There is also a light weight DOM management JSON class that handles DOM requests and allows very basic manipulations of the interface and its behaviors.
 **/

var dotEngine = null;					// A global placeholder for the engine class.

// Addition to the Math class to calculate degrees from radian values
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};

// Addition to the Math class to calculate radians from degrees
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

// Pre-calculate PI*2 to reduce the amount of calculations that are performed later.
Math.PI2 = Math.PI * 2;


/*******************************************************************************
 * The Dot Class Declaration
 ******************************************************************************/

/**
 * Constructor for the dots.
 *
 * @param x            The initial X position for this dot.
 * @param y         The initial Y position fot this dot.
 * @param radius     The radius of the dot.
 * @param direction The direction of the dots travel (in Rads)
 * @param speed     The speed the dot will travel
 * @param context     The canvas context for drawing the dot
 */
function Dot(engine, id, x, y, radius, fillStyle, direction, speed, context) {
    this.engine = engine;
    this.ctx = context;
    this.id = id;
    this.x = x;
    this.y = y;
    this.fillStyle = fillStyle;
    this.radius = radius;
    this.direction = direction;
    this.speed = speed;
    this.safeRange = this.radius * 2;
    this.showVector = true;
    this.showInfo = true;
    this.avoidEachOther = false;
    this.vector = { x: 0, y: 0, xOff: 0, yOff: 0 };
    this.sectors = {};

    this.setVector();
    this.engine.registerDotSectors(this);
}

/**
 * Method definitions for the dot.
 */
Dot.prototype = {

    /**
     * Draws the dot on the canvas.
     */
    draw: function(delta) {
        this.move(delta);
        // this.calculateVector();


        if (this.showVector) {
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
            this.ctx.arc(this.x, this.y, this.safeRange, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(this.x + this.vector.xOff, this.y + this.vector.yOff);
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle=this.fillStyle;
        this.ctx.fill();

        if (this.showInfo) {
            this.ctx.fillStyle = "#000";
            this.ctx.fillText('ID: ' + this.id, this.x-20, this.y - 60);
            this.ctx.fillText('Speed: ' + this.speed, this.x-20, this.y - 50);
            this.ctx.fillText('Radius: ' + this.radius, this.x-20, this.y - 40);
            this.ctx.fillText('Direction: ' + Math.degrees(this.direction) % 360, this.x - 20, this.y - 30);
            this.ctx.fillText('Safe Range: ' + this.safeRange, this.x - 20, this.y - 20);
        }
    },

    /**
     * Determines the next position for the dot based on how much time has passed
     * (delta) since the engine's last call, and the speed of the dot.
     *
     * @param delta The amount of time (ms) that has passed since the last call.
     */
    move: function(delta) {
        var vector = this.calculateDeltaVector(delta);
        this.offset({ x: vector.xOff, y: vector.yOff });

        if (this.avoidEachOther) {
	        for (var s in this.sectors) {
	            var sector = this.sectors[s];
	            for (dotId in sector) {
	                if (dotId != this.id) {
	                    var dot = sector[dotId];
	                    var dotDistance = this.calculateDistance(dot);
	                    if (dotDistance <= this.safeRange) {
	                        var angle = this.calculateAvoidanceAngle(dot);
	                        this.offset({ x: -vector.xOff, y: -vector.yOff });
	                        this.rotate(angle);
	                        dot.rotate(angle);
	                        this.offset({ x: vector.xOff, y: vector.yOff });
	                    }
	                }
	            }
	        }
        }

        var ob = this.isOutOfBounds();

        if (ob) {
            var halfPI = Math.PI/2;
            if (this.direction % halfPI === 0) {
                this.rotate(Math.PI);
            } else {
                var nX = ob.x > 0 ? 1 : ob.x < 0 ? -1 : 0;
                var nY = ob.y > 0 ? 1 : ob.y < 0 ? -1 : 0;
                var correction = 0;
                if (Math.abs(nX+nY) === 2) {
                    this.rotate(Math.PI);
                } else {
                    if (nX === 1) {
                        correction = halfPI;
                    } else if (nX === -1) {
                        correction = -halfPI;
                    } else if (nY === 1) {
                        correction = 0;
                    } else if (nY === -1) {
                        correction = -Math.PI;
                    }
                    var dir = (this.direction + correction) % Math.PI2;
                    this.rotateTo(Math.PI2 - dir - correction);
                }

            }
            this.offset({ x: -(2*vector.xOff), y: -(2*vector.yOff) });
        }

        this.engine.registerDotSectors(this);
    },

    /**
     * Rotates the dot's direction by a given number of radians.
     *
     * @param radians How much to rotate the dot
     */
    rotate: function(radians) {
        this.direction = (this.direction + radians) % Math.PI2;
        this.setVector();
    },

    /**
     * Rotates the dot's direction to a specific number of radians off of 0.
     *
     * @param radians Where to rotate the dot to.
     */
    rotateTo: function(radians) {
        this.direction = radians % Math.PI2;
        this.setVector();
    },

    /**
     * Determines the amount of rotation necessary for this dot and another to
     * avoid each other.
     *
     * @param dot The dot object to be avoided.
     * @returns And angle (in radians) to adjust the rotation of the current dot.
     */
    calculateAvoidanceAngle: function(dot) {
        var m1 = (dot.y - this.y) / (dot.x - this.x);
        var x2 = dot.x + this.radius*3;
        var y2 = dot.y + this.radius*3;
        var m2 = (y2 - this.y) / (x2 - this.x);

        return Math.atan((m1 - m2) / (1 - m1 * m2));
    },


    /**
     * Recalculates the current dot vector to account for the delta time.
     * This reduces the amount of calculations necessary to determine the next
     * movement for the dot.   Assuming the dot is moving in a straight line until
     * otherwise acted upon by another dot or boundary, then we do not need to
     * incur the expense of calculating angles and distances.  We really only need
     * to determine the offset fraction based on how much time has passed.  This
     * reduces the number of calculation cycles required for each engine cycle.
     *
     * @param delta The amount of time to account for in the recalculation.
     * @returns A new vector object adjusted for the provided delta time.
     */
    calculateDeltaVector: function(delta) {
        return {
            x: this.x + this.vector.xOff * delta,
            y: this.y + this.vector.yOff * delta,
            xOff: this.vector.xOff * delta,
            yOff: this.vector.yOff * delta,
            distance: this.speed * delta,
            direction: this.direction
        };
    },

    /**
     * Recalculates and sets the dots current vector based on its current
     * direction and speed.
     */
    setVector: function() {
        this.vector = this.calculateVector();
    },

    /**
     * Calculates the vector position for the dot, assuming that the delta time is 1.
     * This provides us with the necessary speed and direction for each step the
     * dot will take in its path.
     */
    calculateVector: function(direction) {
        direction = direction || this.direction;
        var delta = 1;
        var dist = this.speed * delta;
        var xOff = dist * Math.cos(direction);
        var yOff = dist * Math.sin(direction);
        return { x: this.x + xOff, y: this.y + yOff, xOff: xOff, yOff: yOff, distance: dist, direction: direction };
    },


    /**
     * Determine the distance betwen this dot and a point.
     *
     * @param point A point with an x,y coordinate
     */
    calculateDistance: function(point) {
        var dx = this.x - point.x;
        var dy = this.y - point.y;
        return Math.sqrt( dx*dx + dy*dy );
    },

    /**
     * Moves the dot to a new position by the offset amount defined by the point
     * provided.
     *
     * @param point An object containing an x and y offset value for the new dot location: { x: -, y: - }
     */
    offset: function(point) {
        this.x += point.x;
        this.y += point.y;
    },

    /**
     * Determines if the dot has moved out of bounds, returning false if it has
     * not, or an object containing the x and y values of how far out of bounds
     * it has moved.
     *
     * @returns An object containing how far out of bounds the dot is on the X and Y axis: { x: -, y: - }
     */
    isOutOfBounds: function() {
        var minX = this.radius;
        var minY = this.radius;
        var maxX = this.ctx.canvas.width - this.radius;
        var maxY = this.ctx.canvas.height - this.radius;

        if (this.x >= minX && this.x <= maxX && this.y >= minY && this.y <= maxY) {
            return false;
        }

        var xOff = 0;
        var yOff = 0;

        if (this.x < minX) {
            xOff = this.x - minX;
        } else if (this.x > maxX) {
            xOff = this.x - maxX;
        }

        if (this.y < minY) {
            yOff = this.y - minY;
        } else if (this.y > maxY) {
            yOff = this.y - maxY;
        }

        return { x: xOff, y: yOff };
    }
};


/**
 * Establish an animation frame request based on the browser we're in, if there is no
 * built in request, we'll build one from scratch to fall back on.
 */
window.requestAnimFrame = function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}();


/*******************************************************************************
 * The Engine Class Declaration
 ******************************************************************************/

/**
 * Construct and Engine instance for managing the canvas animations
 *
 * @param canvas The canvas DOM object
 * @param sectorSize How big the canvas sectors should be.  Bigger sectors mean
 * 			more computations to determine collisions.  Smaller sectors means
 * 			more computations to determine which sector a DOT exists in.
 */
function Engine(canvas, sectorSize) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.sectorSize = sectorSize ? sectorSize : 100;
    this.buildSectors();
    this.clearCanvas = true;
}

Engine.prototype = {
    lastCycleTime:    0,
    running: false,                            // The current status of the engine
    dots: [],                                // The dots to be updated with each engine cycle
    sectors: {},

    /**
     * Regenerate new random dots and start the engine cycling.
     *
     * @param dotCount How many dots should be drawn on the canvas.
     */
    start: function(dotCount, clearCanvas, showVector, showInfo, avoidEachOther) {
        console.info('Starting the engine...');
        this.dots = [];
        for (var i=0;i<dotCount;i++) {
            this.dots.push(this.generateRandomDot(i+1));
        }

        this.clearCanvas = clearCanvas;
        this.showVectors(showVector);
        this.showInfo(showInfo);
        this.avoidEachOther(avoidEachOther);
        this.running = true;
        this.lastCycleTime = this.getTime();
        this.buildSectors();
        this.run();
    },

    /**
     * Resumes the engine animation cycle after a stopped state
     */
    proceed: function() {
        if (!this.running) {
            console.info('The engine has been allowed to proceed.');
            this.running    = true;
            this.lastCycleTime = this.getTime();
            this.run();
        }
    },

    /**
     * Stop the engine entirely.
     */
    stop: function() {
        console.info('The engine has been stopped.');
        this.running = false;
    },

    /**
     * Runs through one cycle of the engine and requests another cycle if the
     * running state is set to true.
     */
    run: function() {
        // If the engine is running, cycle the engine.
        if (this.running) {
            var currentCycleTime = this.getTime();
            var delta = currentCycleTime - this.lastCycleTime;

            this.draw(delta);

            this.lastCycleTime = currentCycleTime;
            requestAnimFrame(function() {
                dotEngine.run();
            });
        }
    },

    /**
     * Divides the canvas up into small sectors that can be used to reduce the
     * number of checks a Dot needs to do to determine nearby dots for collision
     * detection.
     */
    buildSectors: function() {
    	this.sectors = {};
        var sector = this.getSector({ x: this.canvas.width, y: this.canvas.height });

        for (var x=sector.x;x>=-1;x--) {
            for (var y=sector.y;y>=-1;y--) {
                this.sectors[this.getSectorKey({ x: x, y: y })] = {};
            }
        }
    },

    /**
     * Determine which sector(s) a dot is in and add the dot to the appropriate
     * sector lists.
     *
     * @param dot The dot to register in the sector list.
     */
    registerDotSectors: function(dot) {
        for (s in dot.sectors) {
            delete this.sectors[s][dot.id];
        }
        dot.sectors = {};

        dot.calculateVector();

        var s = this.getSectorKey(this.getSector(dot));
        var sector = this.sectors[s];
        if (sector) {
            sector[dot.id] = dot;
            dot.sectors[s] = sector;
        }

        for (var v=3;v>=0;v--) {
            var dotVector = dot.calculateVector(this.direction+90*v);
            s = this.getSectorKey(this.getSector(dotVector));
            var sector = this.sectors[s];
            if (sector) {
                sector[dot.id] = dot;
                dot.sectors[s] = sector;
            }
        }
    },

    /**
     * Return which sector x,y a given point is located in.
     *
     * @param point An object containing an x and y point value: { x: -, y: - }
     */
    getSector: function(point) {
        return {
            x: Math.floor(point.x/this.sectorSize),
            y: Math.floor(point.y/this.sectorSize)
        };
    },

    /**
     * Return a sector key string for use in identifying sectors in the sector
     * list.
     * @param sector An x,y sector position.
     * @returns {String} The key for the sector.
     */
    getSectorKey: function(sectorPosition) {
        return sectorPosition.x + "_" + sectorPosition.y;
    },

    /**
     * Draw the dot objects.
     *
     * @param delta The amount of time that has passed since the last cycle.
     */
    draw: function(delta) {
        if (this.clearCanvas) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        };

        for(var i=this.dots.length-1;i>=0;i--) {
            var dot = this.dots[i];
            dot.draw(delta);
        }
    },

    /**
     * Gets the current system time converted to seconds for use in the delta
     * calculations.
     *
     * @returns The current time as a representation of seconds.
     */
    getTime: function() {
        return new Date().getTime() / 1000;
    },

    /**
     * Turn on/off the vector line for all dots.
     * @param show A boolean determining the on/off state of the vectors.
     */
    showVectors: function(show) {
        for (var i=this.dots.length;i>=0;i--) {
            if (dot=this.dots[i]) {
                dot.showVector = show;
            }
        }
    },

    /**
     * Turn on/off the dot information for all dots.
     * @param show A boolean determining the on/off state of the information.
     */
    showInfo: function(show) {
        for (var i=this.dots.length;i>=0;i--) {
            if (dot=this.dots[i]) {
                dot.showInfo = show;
            }
        }
    },

    /**
     * Turn on/off the avoidance algorithm for avoiding other dots.
     * @param avoid A boolean determining the on/off state of the avoidance algorithm.
     */
    avoidEachOther: function(avoid) {
        for (var i=this.dots.length;i>=0;i--) {
            if (dot=this.dots[i]) {
                dot.avoidEachOther = avoid;
            }
        }
    },

    /**
     * Build a random dot and associate it with the engine.
     * @returns {Dot}
     */
    generateRandomDot: function(id) {
        var x = Math.floor(Math.random()*this.canvas.width);
        var y = Math.floor(Math.random()*this.canvas.height);
        var radius = Math.floor(Math.random()*8) + 3;
        var r = Math.floor(Math.random()*200)+50;
        var g = Math.floor(Math.random()*200)+50;
        var b = Math.floor(Math.random()*200)+50;
        var fillStyle = "rgba(" + r + "," + g + "," + b +",0.4)";
        var speed = Math.floor(Math.random()*20) + 10;
        var direction = Math.random()*360;
        var dot = new Dot(this, id, x, y, radius, fillStyle, direction, speed, this.ctx);
        var oob = dot.isOutOfBounds();
        if (oob) {
            dot.offset({ x: -oob.x, y: -oob.y });
        }
        return dot;
    }
};



/**
 * A very light weight, DOM management structure.
 */
dom = function(e) {
    var objects = [];
    if (e && typeof e === 'string') {
        if (e[0] === '#') {
            e = e.substring(1);
            objects.push(document.getElementById(e));
        } else if (e[0] === '.') {
            e = e.substring(1);
            objects = document.getElementsByClassName(e);
        } else {
            objects = document.getElementsByTagName(e);
        }
    } else if (e && typeof e === 'object') {
        if (e.objects !== undefined) {
            return e;
        } else {
            objects.push(e);
        }
    } else if (e && typeof e === 'array') {
        objects = e;
    }

    return {
        objects: objects,
        click: function(func) {
            for (var i=this.objects.length-1;i>=0;i--) {
                this.objects[i].onclick = func;
            }
            return this;
        },
        attr: function(name, value) {
            if (this.objects.length > 0) {
                if (value !== undefined) {
                    for (var i=this.objects.length-1;i>=0;i--) {
                        this.objects[i].setAttribute(name, value);
                    }
                }
                return this.object[0].getAttribute(name);
            }
            return null;
        },
        removeAttr: function(name) {
            for (var i=this.objects.length-1;i>=0;i--) {
                this.objects[i].removeAttribute(name);
            }
            return this;
        },
        isChecked: function() {
            if (this.objects.length > 0) {
                var cb = this.objects[0];
                return cb.checked;
            }
            return false;
        }
    };
};


/**
 * Wait for the DOM to be ready before initializing the Dots program.
 */
var tid = setInterval(function () {

    // Check to see if the document ready state is complete, if not, return so
    // the interval timer continues.
    if ( document.readyState !== 'complete' ) {
        return;
    }

    // If we've gotten this far, the document readyState is complete, so clear
    // out the interval time.
    clearInterval( tid );

    initializeInterface();

}, 100);


/**
 * Setup UI for the page -- called once the DOM is ready.
 */

var initializeInterface = function() {
    // Initialize the engine
    var canvas = document.getElementById('dot-space');
    dotEngine = new Engine(canvas);

    dom('#start').click(function() {
        var dotCount = document.getElementById('dot-count');
        var count = parseInt(dotCount.value, 10);

        if (!count || isNaN(count)) {
            count = 10;
            dotCount.value = count;
        }
        var clearCanvas = dom('#clearCanvas').isChecked();
        var showVector = dom('#showVector').isChecked();
        var showInfo = dom('#showInfo').isChecked();
        var avoidEachOther = dom('#avoidEachOther').isChecked();
        dotEngine.start(count, clearCanvas, showVector, showInfo, avoidEachOther);
    });

    dom('#proceed').click(function() {
        dotEngine.proceed();
    });

    dom('#stop').click(function() {
        dotEngine.stop();
    });

    dom('#showVector').click(function() {
        var checked = dom('#showVector').isChecked();
        dotEngine.showVectors(checked);
    });

    dom('#showInfo').click(function() {
        var checked = dom('#showInfo').isChecked();
        dotEngine.showInfo(checked);
    });

    dom('#avoidEachOther').click(function() {
        var checked = dom('#avoidEachOther').isChecked();
        dotEngine.avoidEachOther(checked);
    });
};


