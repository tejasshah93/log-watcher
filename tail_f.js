// Required Node Modules
var app = require('http').createServer(initHandler);
var io = require('socket.io')(app);
var fs = require('fs');
var async = require('async');

// Listening on port 9000
app.listen(9000);
console.log("tail_f server listening on port 9000");

// fileWatchers hash enables to maintain a single fileWatcher for a given file
// On reload, previous fileWatcher for that specific file is closed and a
//new fileWatcher is initiated
var fileWatchers = {};

// Serves index.html page to client
function initHandler(req, res) {
	fs.readFile(__dirname + '/html/index.html', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

// Monitors the file for changes being made
var monitorFile = function(filename, socket) {
	fileWatchers[filename] = fs.watch(filename, function(event, filename) {
		// if the event is renaming of the file, etc; return
		if (event !== "change") return;

		// Retrieves current stats of the requested file
		var currFileStats =	function(callback) {
			fs.stat(filename, function (err, stats) {
				// if file size is less than previous size, implies file is truncated
				if (stats.size < socket.currFileSize) {
					console.log("File shortened/truncated");
					socket.emit("fileTruncate");
					socket.currFileSize = stats.size;
					callback("fileTruncate", null);
				} else if (err) {
					console.log(err);
					socket.emit("error", err.toString());
					callback(err, null);
				} else {
					callback(null, stats);
				}
			});
		};

		var tailFileContents = function(stats, callback) {
			// start reading from the last known file pointer position
			var rstream = fs.createReadStream(__dirname + '/' + filename, {start:
				socket.currFileSize, end: stats.size});

			var data = '';
			rstream
				.on('data', function (chunk) {
					data += chunk.toString("utf-8");
				})

				.on('error', function (err) {
					socket.emit("error", err.toString());
				})

				// Streams the file changes back to client and updates currFileSize
				.on('end', function () {
					console.log("File read successfully on change");
					console.log(data);
					socket.currFileSize = stats.size;
					socket.emit("streamFileData", data);
				});
			callback(null);
		};

		async.waterfall([currFileStats, tailFileContents], function (err) {
			if (err) return;
		});
	});
};


var startWatcher = function(requestFile) {
	var socket = this;

	// Retrieves initial stats of the requested file
	var initFileStats = function(callback){
		fs.stat(requestFile.filename, function (err, stats) {
			if (err) {
				console.log(err);
				socket.emit('ioerror', err.toString());
				callback(err, null);
			} else {
				callback(null, stats);
			}
		});
	};

	// inits fileWatcher for the requested file
	var initFileWatcher = function(stats, callback) {
		// if fileWatcher already exists, close it and spawn a new one
		if (fileWatchers[requestFile.filename] !== undefined) {
			console.log("closing existing fileWatcher for " + requestFile.filename);
			fileWatchers[requestFile.filename].close();
			delete fileWatchers[requestFile.filename];
		}

		// creates a readStream of the file requested
		var rstream = fs.createReadStream(__dirname + '/' + requestFile.filename);
		var data = "";
		
		rstream
			.on('data', function (chunk) {
					data += chunk.toString("utf-8");
				})

			.on('error', function (err) {
				socket.emit("error", err.toString());
			})

			// Streams data back to the client and starts monitoring the file
			.on('end', function () {
				console.log("File read once successfully");
				socket.currFileSize = stats.size;
				socket.emit("initFileData", data);
				monitorFile(requestFile.filename, socket);
				console.log("monitorFile initiated for " + requestFile.filename);
			});
			callback(null);
	};

	async.waterfall([initFileStats, initFileWatcher], function (err) {
		if (err) return;
	});
};


var onConnect = function(socket) {
	// socket.currFileSize stores the size of the file when it is read
	socket.on('error', function (err) {
		console.log(err);
	});
	socket.emit("connected");

	// When the client requests a new file to be monitored
	console.log("on connection, watching started");
	socket.on('watchFile', startWatcher);
};

io.on('connection', onConnect);
