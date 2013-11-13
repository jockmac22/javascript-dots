/**
 * DOTS - A Javascript prototyping example
 *
 * Author: 	Jocko MacGregor
 * Date: 	November 10, 2013
 *
 * The DOTS Javascript is based on two primary class structures, a Dot, which controls the movement and display of the dots on the canvas, and the Engine, which controls the animation timing, and Dot generation.
 *
 * There is also a light weight DOM management JSON class that handles DOM requests and allows very basic manipulations of the interface and its behaviors.
 **/function Dot(e,t,n,r,i,s,o,u,a){this.engine=e;this.id=t;this.x=n;this.y=r;this.fillStyle=s;this.radius=i;this.direction=o;this.speed=u;this.safeRange=this.radius*2;this.ctx=a;this.showVector=!0;this.showInfo=!0;this.avoidEachOther=!1;this.vector={x:0,y:0,xOff:0,yOff:0};this.sectors={};this.setVector();this.engine.registerDotSectors(this)}function Engine(e,t){this.canvas=e;this.ctx=this.canvas.getContext("2d");this.sectorSize=t?t:100;this.buildSectors();this.clearCanvas=!0}var dotEngine=null;Math.degrees=function(e){return e*180/Math.PI};Math.radians=function(e){return e*Math.PI/180};Math.PI2=Math.PI*2;Dot.prototype={draw:function(e){this.move(e);if(this.showVector){this.ctx.beginPath();this.ctx.fillStyle="rgba(200, 200, 200, 0.4)";this.ctx.arc(this.x,this.y,this.safeRange,0,2*Math.PI,!1);this.ctx.fill();this.ctx.moveTo(this.x,this.y);this.ctx.lineTo(this.x+this.vector.xOff,this.y+this.vector.yOff);this.ctx.stroke()}this.ctx.beginPath();this.ctx.arc(this.x,this.y,this.radius,0,2*Math.PI,!1);this.ctx.fillStyle=this.fillStyle;this.ctx.fill();if(this.showInfo){this.ctx.fillStyle="#000";this.ctx.fillText("ID: "+this.id,this.x-20,this.y-60);this.ctx.fillText("Speed: "+this.speed,this.x-20,this.y-50);this.ctx.fillText("Radius: "+this.radius,this.x-20,this.y-40);this.ctx.fillText("Direction: "+Math.degrees(this.direction)%360,this.x-20,this.y-30);this.ctx.fillText("Safe Range: "+this.safeRange,this.x-20,this.y-20)}},move:function(e){var t=this.calculateDeltaVector(e);this.offset({x:t.xOff,y:t.yOff});for(var n in this.sectors){var r=this.sectors[n];for(dotId in r)if(dotId!=this.id){var i=r[dotId],s=this.calculateDistance(i);if(s<=this.safeRange){var o=this.calculateAvoidanceAngle(i);this.offset({x:-t.xOff,y:-t.yOff});this.rotate(o);i.rotate(o);this.offset({x:t.xOff,y:t.yOff})}}}var u=this.isOutOfBounds();if(u){var a=Math.PI/2;if(this.direction%a===0)this.rotate(Math.PI);else{var f=u.x>0?1:u.x<0?-1:0,l=u.y>0?1:u.y<0?-1:0,c=0;if(Math.abs(f+l)===2)this.rotate(Math.PI);else{f===1?c=a:f===-1?c=-a:l===1?c=0:l===-1&&(c=-Math.PI);var h=(this.direction+c)%Math.PI2;this.rotateTo(Math.PI2-h-c)}}this.offset({x:-(2*t.xOff),y:-(2*t.yOff)})}this.engine.registerDotSectors(this)},rotate:function(e){this.direction=(this.direction+e)%Math.PI2;this.setVector()},rotateTo:function(e){this.direction=e%Math.PI2;this.setVector()},calculateAvoidanceAngle:function(e){var t=(e.y-this.y)/(e.x-this.x),n=e.x+this.radius*3,r=e.y+this.radius*3,i=(r-this.y)/(n-this.x);return Math.atan((t-i)/(1-t*i))},calculateDeltaVector:function(e){return{x:this.x+this.vector.xOff*e,y:this.y+this.vector.yOff*e,xOff:this.vector.xOff*e,yOff:this.vector.yOff*e,distance:this.speed*e,direction:this.direction}},setVector:function(){this.vector=this.calculateVector()},calculateVector:function(e){e=e||this.direction;var t=1,n=this.speed*t,r=n*Math.cos(e),i=n*Math.sin(e);return{x:this.x+r,y:this.y+i,xOff:r,yOff:i,distance:n,direction:e}},calculateDistance:function(e){var t=this.x-e.x,n=this.y-e.y;return Math.sqrt(t*t+n*n)},offset:function(e){this.x+=e.x;this.y+=e.y},put:function(e){this.x=e.x;this.y=e.y},isOutOfBounds:function(){var e=this.radius,t=this.radius,n=this.ctx.canvas.width-this.radius,r=this.ctx.canvas.height-this.radius;if(this.x>=e&&this.x<=n&&this.y>=t&&this.y<=r)return!1;var i=0,s=0;this.x<e?i=this.x-e:this.x>n&&(i=this.x-n);this.y<t?s=this.y-t:this.y>r&&(s=this.y-r);return{x:i,y:s}}};window.requestAnimFrame=function(e){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e){window.setTimeout(e,1e3/60)}}();Engine.prototype={lastCycleTime:0,running:!1,dots:[],sectors:[],start:function(e,t,n,r,i){console.info("Starting the engine...");this.dots=[];for(var s=0;s<e;s++)this.dots.push(this.generateRandomDot(s+1));this.clearCanvas=t;this.showVectors(n);this.showInfo(r);this.avoidEachOther(i);this.running=!0;this.lastCycleTime=this.getTime();this.buildSectors();this.run()},generateDot:function(e,t,n,r,i){var s=5,o=250,u=0,a=200,f="rgba("+o+","+u+","+a+",0.40)",l=new Dot(this,e,t,n,s,f,r,i,this.ctx);return l},proceed:function(){if(!this.running){console.info("The engine has been allowed to proceed.");this.running=!0;this.lastCycleTime=this.getTime();this.run()}},stop:function(){console.info("The engine has been stopped.");this.running=!1},run:function(){if(this.running){var e=this.getTime(),t=e-this.lastCycleTime;this.draw(t);this.lastCycleTime=e;requestAnimFrame(function(){dotEngine.run()})}},buildSectors:function(){var e=this.getSector({x:this.canvas.width,y:this.canvas.height});for(var t=e.x;t>=-1;t--)for(var n=e.y;n>=-1;n--)this.sectors[this.getSectorKey({x:t,y:n})]={}},registerDotSectors:function(e){for(t in e.sectors)delete this.sectors[t][e.id];e.sectors={};e.calculateVector();var t=this.getSectorKey(this.getSector(e)),n=this.sectors[t];if(n){n[e.id]=e;e.sectors[t]=n}for(var r=3;r>=0;r--){var i=e.calculateVector(this.direction+90*r);t=this.getSectorKey(this.getSector(i));var n=this.sectors[t];if(n){n[e.id]=e;e.sectors[t]=n}}},getSector:function(e){return{x:Math.floor(e.x/this.sectorSize),y:Math.floor(e.y/this.sectorSize)}},getSectorKey:function(e){return e.x+"_"+e.y},getSectorBounds:function(e){return{l:max(e.x*this.sectorSize,0),t:max(secotr.y*this.sectorSize,0),r:min((e.x+1)*this.sectorSize,this.canvas.width),b:min((e.y+1)*this.sectorSize,this.canvas.height)}},draw:function(e){this.clearCanvas&&this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);for(var t=this.dots.length-1;t>=0;t--){var n=this.dots[t];n.draw(e)}},getTime:function(){return(new Date).getTime()/1e3},showVectors:function(e){for(var t=this.dots.length;t>=0;t--)if(dot=this.dots[t])dot.showVector=e},showInfo:function(e){for(var t=this.dots.length;t>=0;t--)if(dot=this.dots[t])dot.showInfo=e},avoidEachOther:function(e){for(var t=this.dots.length;t>=0;t--)if(dot=this.dots[t])dot.avoidEachOther=e},generateRandomDot:function(e){var t=Math.floor(Math.random()*this.canvas.width),n=Math.floor(Math.random()*this.canvas.height),r=Math.floor(Math.random()*8)+3,i=Math.floor(Math.random()*200)+50,s=Math.floor(Math.random()*200)+50,o=Math.floor(Math.random()*200)+50,u="rgba("+i+","+s+","+o+",0.4)",a=Math.floor(Math.random()*20)+10,f=Math.random()*360,l=new Dot(this,e,t,n,r,u,f,a,this.ctx),c=l.isOutOfBounds();c&&l.offset({x:-c.x,y:-c.y});return l}};dom=function(e){var t=[];if(e&&typeof e=="string")if(e[0]==="#"){e=e.substring(1);t.push(document.getElementById(e))}else if(e[0]==="."){e=e.substring(1);t=document.getElementsByClassName(e)}else t=document.getElementsByTagName(e);else if(e&&typeof e=="object"){if(e.objects!==undefined)return e;t.push(e)}else e&&typeof e=="array"&&(t=e);return{objects:t,click:function(e){for(var t=this.objects.length-1;t>=0;t--)this.objects[t].onclick=e;return this},attr:function(e,t){if(this.objects.length>0){if(t!==undefined)for(var n=this.objects.length-1;n>=0;n--)this.objects[n].setAttribute(e,t);return this.object[0].getAttribute(e)}return null},removeAttr:function(e){for(var t=this.objects.length-1;t>=0;t--)this.objects[t].removeAttribute(e);return this},isChecked:function(){if(this.objects.length>0){var e=this.objects[0];return e.checked}return!1}}};var tid=setInterval(function(){if(document.readyState!=="complete")return;clearInterval(tid);initializeInterface()},100),initializeInterface=function(){var e=document.getElementById("dot-space");dotEngine=new Engine(e);dom("#start").click(function(){var e=document.getElementById("dot-count"),t=parseInt(e.value,10);if(!t||isNaN(t)){t=10;e.value=t}var n=dom("#clearCanvas").isChecked(),r=dom("#showVector").isChecked(),i=dom("#showInfo").isChecked(),s=dom("#avoidEachOther").isChecked();dotEngine.start(t,n,r,i,s)});dom("#proceed").click(function(){dotEngine.proceed()});dom("#stop").click(function(){dotEngine.stop()});dom("#showVector").click(function(){var e=dom("#showVector").isChecked();dotEngine.showVectors(e)});dom("#showInfo").click(function(){var e=dom("#showInfo").isChecked();dotEngine.showInfo(e)})};