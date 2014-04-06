var http = require("http");
var url = require("url");
var mysql = require("mysql");
var qs = require("querystring");
var fs = require("fs");

var connection = mysql.createConnection({
	user: "root",
	password: "redacted",
	database: "redacted",
	host: "127.0.0.1",
	port: "3306"
});

var indexhtml = "";

fs.readFile("./index.html", function(err, html) {

	if(err) {
		throw err;
	}
	
	indexhtml = html;
});

function start() {

	function onRequest(request, response) {		

		var pathname = url.parse(request.url).pathname;
		

		if(pathname == '/addscore') {
			var body = '';
			request.on('data', function(data) {
				body += data;
				var postdata = qs.parse(body);

				var confirmationhash = new String(postdata.name + postdata.score + 
				postdata.outertick).hashCode();
				
				postdata.name = postdata.name.replace("'", "''");

				if((postdata.score > 2000) && (typeof postdata.score !== 'number') && postdata.hash !== confirmationhash){
					replyWithScore(response);	
				} else {

				connection.query("insert into scores values('" + postdata.name.substring(0, 40) + 
						"', " + postdata.score +
			 ", now(),'" + request.connection.remoteAddress + "')", function(error, rows, fields) {
					replyWithScore(response);
				});

				}
			});
			
			return;
		}
		
		if(pathname == '/index') {
		
			replyWithPage(response);
		
			return;
		}
		
		if(pathname == '/getscores') {
		
			replyWithScore(response);
			
			return;
		}
		
		getOtherFile(pathname, response);
		
	}
	
	http.createServer(onRequest).listen(8888);

	console.log('server started');
}

function getOtherFile(pathname, response) {

	fs.readFile('.' + pathname, function(err, file) {

		if(err) {
			replyWithPage(response);
			return;
		}

		var contentType = '';
		
		if( pathname.search('png') > -1 ) {
			contentType = 'image/png';
		}
		else if ( pathname.search('css') > -1 ) {
			contentType = 'text/css';
		}
		else if ( pathname.search('js') > -1 ) {
			contentType = 'text/javascript';
		}
		else {
			contentType = 'text/plain';
		}

		// console.log( contentType );
		
		response.writeHeader(200, {"Content-Type": contentType });  
		
		response.end(file, 'binary');  
	});
} 

function replyWithPage(response) {
	
	response.writeHeader(200, {"Content-Type": "text/html"});  
	response.write(indexhtml);  
	response.end();

}

function replyWithScore(response) {
		connection.query('select * from scores order by score desc, date asc limit 20;', function(error, rows, fields) {

                        response.writeHead(200, {
                                        "Content-Type": "text/plain",
                                        "access-control-allow-origin": "*",
                                        "access-control-allow-methods": "GET, POST",
                                        "access-control-allow-headers": "content-type, accept",
                                        "access-control-max-age": 10 });
                        response.end(JSON.stringify(rows));


                });
};


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

start();
