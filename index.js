"use strict";

// var os = require("os");
// var nodeStatic = require("node-static");
// var http = require("http");
// var socketIO = require("socket.io");
// const port = process.env.PORT || 3000;

// var fileServer = new nodeStatic.Server();
// var app = http
//   .createServer(function (req, res) {
//     fileServer.serve(req, res);
//   })
//   .listen(port);

// var io = socketIO.listen(app);

var nodeStatic = require("node-static");
var fileServer = new nodeStatic.Server();
var express = require("express");
var socket = require("socket.io");
var fs = require("fs");
var app = express();

var server = app.listen(3000, function (server) {
  console.log("Server Started ");
});

var io = socket(server);

io.on("connection", function (socket) {
  // convenience function to log server messages on the client
  function log() {
    var array = ["Message from server:"];
    array.push.apply(array, arguments);
    socket.emit("log", array);
  }

  //When the device sends a message, broadcast it.
  socket.on("DeviceMessage", function (message) {
    console.log("device said: ", message);
    socket.broadcast.emit("DeviceMessage", message);
  });

  //When the browser sends a message, broadcast it.
  socket.on("Browsermessage", function (message) {
    console.log("browser said: ", message);
    socket.broadcast.emit("Browsermessage", message);
  });

  socket.on("join", function (room) {
    console.log("Received request to join");
    socket.broadcast.emit("joined");
  });
});

app.get("/control-events", (req, res) => {
  console.log("Express server listening on port " + 8081);
  console.log("req.query.control", req.query.control);
  // ctrl = req.query.control;
  io.emit("control", req.query.control);
  res.end();
});
app.use(express.static(__dirname));
