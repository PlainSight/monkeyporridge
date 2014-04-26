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

});