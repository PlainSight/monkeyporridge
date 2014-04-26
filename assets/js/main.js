jQuery(document).ready(function($) {
	
	var ImageMap = [];
	var ctx;
	var canvas;
	var eventQueue = [];
	var name = "";
	var score = 0;
	var outertick = 0;
	
	window.onload = function (e) {
						
		canvas = document.getElementById("canvas");
		ctx = canvas.getContext("2d");
		
		canvas.addEventListener("mousedown", mouseDown, false);
		
		// dummy canvas
		canvas.width = 800;
		canvas.height = 600;
		
		loadImages();
		
		getHighScores();
		
		gamepadSupport.init();
		
		document.getElementById("canvas").onmousedown = function(){
			return false;
		};
		
		
		var timer = setInterval(function () {
			if(imagesReady()) {
				
				clearInterval(timer);

				name = window.prompt("Input name","user");
				
				gameLoop(); 
			}
		
		}, 50);
		
	}
	
	function pause() {
		
		clearScreen();
		drawPrompt();
		postScore();
						
		var score = 0;
		
		//drawHighScores();
		
		var pausetimer = setInterval(function () {
			
			if(readUserInput() != undefined) {
			
				clearInterval(pausetimer);
				
				gameLoop();
			}
		}, 50);
		
	}
				
	
	function gameLoop() {
		
		var x = 200;
		var y = 100;
		
		var dy = 1;
		
		var points = 0;
		
		var flapdown = 0;
		
		var obstacles = [];
		
		var tick = 0;
		
		var loop = setInterval(function() {
			tick++;
			
			if(tick % 90 == 0) {
			
				var obstacle = {
					x: canvas.width,
					height: (Math.random()*(canvas.height - 200)) + 100,
					gap: 100 + ((100 - tick/400) <  0 ? 0 : (100 - tick/400))
				};
				
				obstacles.push(obstacle);
			}
			
			if(tick > 300 && (tick - 30) % 90 == 0) {
				points++;
			}
			
			for(var ob in obstacles) {
				var tempob = obstacles[ob];
				
				tempob.x -= 3;
			}
			
			console.log
			
			for(var rm = 0; rm < obstacles.length; rm++) {
				if(obstacles[rm] != undefined && obstacles[rm].x < -200) {
					delete obstacles[rm];
				}
			}
			
			
			//render
			clearScreen();

			for(var ob in obstacles) {
				var pipe = obstacles[ob];
				drawPipe(pipe);
			}
			if(flapdown != 0) {
				drawImage('birdy', x, y, 1);
			} else {
				drawImage('birdy', x, y, 0);
			}
			drawScore(points);
			
			
			//input
			var input = readUserInput();
			
			if(input == 'click') {
			
				dy = -60;
				flapdown = 8;
			}
			//flapdown animation
			if(flapdown != 0) {
				flapdown--;
			}
			
			//physics
			y += dy/10;
			dy += 3;

			if(y > canvas.height) {
				//hit ground
				//alert("CRASH LANDING!");
				score = points;
				outertick = tick;
				clearInterval(loop);
				pause(); ;
			}
			
			for(var ob in obstacles) {
			
				var tempob = obstacles[ob];
				
				if(x+67 >= tempob.x && x+27 < tempob.x + 100) {
					if((y+15 < tempob.height - tempob.gap/2) || (y+35 > tempob.height + tempob.gap/2)) {
						//alert("YOU CRASHED");
						score = points;
						outertick = tick;
						clearInterval(loop);
						pause(); ;
					}
				}					
			}
			
		}, 16);
	
	}
	
	String.prototype.hashCode = function(){
		if (Array.prototype.reduce){
			return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
		} 
		var hash = 0;
		if (this.length === 0) return hash;
		for (var i = 0; i < this.length; i++) {
			var character  = this.charCodeAt(i);
			hash  = ((hash<<5)-hash)+character;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
	
	function postScore() {
	
		console.log(name + ' ' + score);
		
		var hash = new String(name + score + outertick).hashCode();
		
		$.ajax({
			type: "POST",
			url: "http://plainsight.co.nz:8888/addscore", 
			async: true,
			data: { name: name, score: score, tick: outertick, hash: hash },
			success: function(data) {
				
				data = JSON.parse(data);
				
				$("#scores").empty();

				for(var it = 0; it < data.length; it++) {
				
					var score = data[it];
					$("#scores").append('<tr><td>' + score.name + '</td><td>' + score.score + '</td></tr>');
				}
			
			
			
			}
		});
	
	
	}

	function getHighScores() {
					
		$.ajax({
			type: "GET",
			url: "http://plainsight.co.nz:8888/getscores", 
			async: true,
			success: function(data) {
				
				data = JSON.parse(data);
				$("#scores").empty();
				
				for(var it = 0; it < data.length; it++) {
				
					var score = data[it];
											
					$("#scores").append('<tr><td>' + score.name + '</td><td>' + score.score + '</td></tr>');

				}
			
			
			
			}
		});
	
	}
	
	function readUserInput() {
		return eventQueue.pop();
	}
	
	function mouseDown() {
		handleUserEvent('click');
	}
	
	function handleUserEvent(event) {
		
		if(event == 'click') {
			eventQueue.push('click');
		}
	}
	
	function imagesReady() {
		
		var allLoaded = true;
		
		for(var key in ImageMap) {
			allLoaded = allLoaded && ImageMap[key].inited;
		}
		
		return allLoaded;
	}
	
	function loadImages() {
		
		var images = ['birdy.png', 'pipe.png', 'piped.png'];//, 'background.png', 'pipe.png'];
		
		for(var i = 0; i < images.length; i++) {
			var idx = images[i].indexOf('.');
			var imagename = images[i].substring(0, idx);
		
			ImageMap[imagename] = loadImage(images[i]);
		}
		
	}
	
	function loadImage(name) {
		var image = new Image();
		
		image.src = name;
		
		image.inited = false;
		
		image.onload = function () {
		
			image.inited = true;
		}
						
		return image;		
	}
	
	function drawScore(score) {
	
		ctx.fillStyle = "orange";
		ctx.font = "bold 25px Arial";
		ctx.fillText(score, canvas.width - 50, 20);
	}
	
	function drawPrompt() {
	
		ctx.fillStyle = "red";
		ctx.font = "bold 50px Arial";
		ctx.fillText("Click to play again", canvas.width/5, canvas.height/2 - 50);
	}
	
	function drawPipe(pipe) {
	
		var pipeup = ImageMap['pipe'];
		var pipedown = ImageMap['piped'];
		
		
		ctx.drawImage(pipeup, pipe.x, pipe.height + pipe.gap/2);
			
		ctx.drawImage(pipedown, pipe.x, pipe.height - pipe.gap/2 - pipedown.height);
	}
	
	function drawImage(name, xpos, ypos, frame) {
		
		var img = ImageMap[name];
		
		
		var imw = 67;
		var imh = 50;
		
		if(frame != null) {
		
			ctx.drawImage(img, imw*frame, 0, imw, imh, xpos, ypos, imw, imh);
		
		} else {
			ctx.drawImage(img, xpos, ypos);
		}
	}
	
	function clearScreen() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	var gamepadSupport = {
	  // A number of typical buttons recognized by Gamepad API and mapped to
	  // standard controls. Any extraneous buttons will have larger indexes.
	  TYPICAL_BUTTON_COUNT: 16,

	  // A number of typical axes recognized by Gamepad API and mapped to
	  // standard controls. Any extraneous buttons will have larger indexes.
	  TYPICAL_AXIS_COUNT: 4,

	  // Whether weâ€™re requestAnimationFrameing like itâ€™s 1999.
	  ticking: false,

	  // The canonical list of attached gamepads, without â€œholesâ€ (always
	  // starting at [0]) and unified between Firefox and Chrome.
	  gamepads: [],

	  // Remembers the connected gamepads at the last check; used in Chrome
	  // to figure out when gamepads get connected or disconnected, since no
	  // events are fired.
	  prevRawGamepadTypes: [],

	  // Previous timestamps for gamepad state; used in Chrome to not bother with
	  // analyzing the polled data if nothing changed (timestamp is the same
	  // as last time).
	  prevTimestamps: [],

	  /**
	   * Initialize support for Gamepad API.
	   */
	  init: function() {
		var gamepadSupportAvailable = navigator.getGamepads ||
			!!navigator.webkitGetGamepads ||
			!!navigator.webkitGamepads;

		if (gamepadSupportAvailable) {

		  // Check and see if gamepadconnected/gamepaddisconnected is supported.
		  // If so, listen for those events and don't start polling until a gamepad
		  // has been connected.
		  /*if ('ongamepadconnected' in window) {
			window.addEventListener('MozGamepadConnected ',
								  gamepadSupport.onGamepadConnect, false);
			window.addEventListener('MozGamepadDisconnected',
									gamepadSupport.onGamepadDisconnect, false);
		  } else {*/
			// If connection events are not supported just start polling
			gamepadSupport.startPolling();
		  /*}*/
		}
	  },

	  /**
	   * React to the gamepad being connected.
	   */
	  onGamepadConnect: function(event) {
		// Add the new gamepad on the list of gamepads to look after.
		gamepadSupport.gamepads.push(event.gamepad);

		// Start the polling loop to monitor button changes.
		gamepadSupport.startPolling();
	  },

	  /**
	   * React to the gamepad being disconnected.
	   */
	  onGamepadDisconnect: function(event) {
		// Remove the gamepad from the list of gamepads to monitor.
		for (var i in gamepadSupport.gamepads) {
		  if (gamepadSupport.gamepads[i].index == event.gamepad.index) {
			gamepadSupport.gamepads.splice(i, 1);
			break;
		  }
		}

		// If no gamepads are left, stop the polling loop.
		if (gamepadSupport.gamepads.length == 0) {
		  gamepadSupport.stopPolling();
		}
	  },

	  /**
	   * Starts a polling loop to check for gamepad state.
	   */
	  startPolling: function() {
		// Donâ€™t accidentally start a second loop, man.
		if (!gamepadSupport.ticking) {
		  gamepadSupport.ticking = true;
		  gamepadSupport.tick();
		}
	  },

	  /**
	   * Stops a polling loop by setting a flag which will prevent the next
	   * requestAnimationFrame() from being scheduled.
	   */
	  stopPolling: function() {
		gamepadSupport.ticking = false;
	  },

	  /**
	   * A function called with each requestAnimationFrame(). Polls the gamepad
	   * status and schedules another poll.
	   */
	  tick: function() {
		gamepadSupport.pollStatus();
		gamepadSupport.scheduleNextTick();
	  },

	  scheduleNextTick: function() {
		// Only schedule the next frame if we havenâ€™t decided to stop via
		// stopPolling() before.
		if (gamepadSupport.ticking) {
		  if (window.requestAnimationFrame) {
			window.requestAnimationFrame(gamepadSupport.tick);
		  } else if (window.mozRequestAnimationFrame) {
			window.mozRequestAnimationFrame(gamepadSupport.tick);
		  } else if (window.webkitRequestAnimationFrame) {
			window.webkitRequestAnimationFrame(gamepadSupport.tick);
		  }
		  // Note lack of setTimeout since all the browsers that support
		  // Gamepad API are already supporting requestAnimationFrame().
		}
	  },

	  /**
	   * Checks for the gamepad status. Monitors the necessary data and notices
	   * the differences from previous state (buttons for Chrome/Firefox,
	   * new connects/disconnects for Chrome). If differences are noticed, asks
	   * to update the display accordingly. Should run as close to 60 frames per
	   * second as possible.
	   */
	  pollStatus: function() {
		// Poll to see if gamepads are connected or disconnected. Necessary
		// only on Chrome.
		gamepadSupport.pollGamepads();

		for (var i in gamepadSupport.gamepads) {
		  var gamepad = gamepadSupport.gamepads[i];

		  // Donâ€™t do anything if the current timestamp is the same as previous
		  // one, which means that the state of the gamepad hasnâ€™t changed.
		  // This is only supported by Chrome right now, so the first check
		  // makes sure weâ€™re not doing anything if the timestamps are empty
		  // or undefined.
		  if (gamepad.timestamp &&
			  (gamepad.timestamp == gamepadSupport.prevTimestamps[i])) {
			continue;
		  }
		  gamepadSupport.prevTimestamps[i] = gamepad.timestamp;

		  gamepadSupport.updateAction(i);
		}
	  },

	  // This function is called only on Chrome, which does not yet support
	  // connection/disconnection events, but requires you to monitor
	  // an array for changes.
	  pollGamepads: function() {
		// Get the array of gamepads â€“ the first method (getGamepads)
		// is the most modern one and is supported by Firefox 28+ and
		// Chrome 35+. The second one (webkitGetGamepads) is a deprecated method
		// used by older Chrome builds.
		var rawGamepads =
			(navigator.getGamepads && navigator.getGamepads()) ||
			(navigator.webkitGetGamepads && navigator.webkitGetGamepads());

		if (rawGamepads) {
		  // We donâ€™t want to use rawGamepads coming straight from the browser,
		  // since it can have â€œholesâ€ (e.g. if you plug two gamepads, and then
		  // unplug the first one, the remaining one will be at index [1]).
		  gamepadSupport.gamepads = [];

		  // We only refresh the display when we detect some gamepads are new
		  // or removed; we do it by comparing raw gamepad table entries to
		  // â€œundefined.â€
		  var gamepadsChanged = false;

		  for (var i = 0; i < rawGamepads.length; i++) {
			if (typeof rawGamepads[i] != gamepadSupport.prevRawGamepadTypes[i]) {
			  gamepadsChanged = true;
			  gamepadSupport.prevRawGamepadTypes[i] = typeof rawGamepads[i];
			}

			if (rawGamepads[i]) {
			  gamepadSupport.gamepads.push(rawGamepads[i]);
			}
		  }
		}
	  },

	  updateAction: function(gamepadId) {
		var gamepad = gamepadSupport.gamepads[gamepadId];
						
outer:	for(var i = 0; i < gamepad.buttons.length; i++) {
			if(gamepad.buttons[i] != 0 && gamepad.buttons[i] != previousPoll[i]) {
				mouseDown();
				break outer;
			}
		}
		
		previousPoll = gamepad.buttons;
	  }
	};
	
	var previousPoll = [];

});