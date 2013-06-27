var webserver = function() {

  var http = require('http');
  var port = 3000;
  var express = require("express");
  var self = this;

  var app = express();
  app.use(app.router); 
  var http = require('http');

  var server = http.createServer(app);
  

  app.get("/success", function(request, response){
      console.log(JSON.stringify(request.url, null, 2));
      response.send("<html><body><script>setTimeout(window.close, 2000);</script></body></html>");
      response.end();
      console.log("Server killed.");
      setTimeout(self.killServer, 2000);
  });

  this.startServer = function() {
    server.listen(port);
  };

  var sockets = [];

  app.on('connection', function (socket) {
    sockets.push(socket);
    socket.on('close', function () {
      console.log('socket closed');
      sockets.splice(sockets.indexOf(socket), 1);
    });
  });

  this.killServer = function() {
    server.close(function () {
      console.log('Server closed!');
    }, function(e) {
      console.log("Error: " + JSON.stringify(e));
    });
    for (var i = 0; i < sockets.length; i++) {
      console.log('socket #' + i + ' destroyed');
      sockets[i].destroy();
    }
  };

}

exports.webserver = new webserver();

