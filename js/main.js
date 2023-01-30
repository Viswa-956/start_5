"use strict";

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
      urls: "turn:numb.viagenie.ca",
      username: "webrtc@live.com",
      credential: "muazkh",
      // urls: "stun:192.168.0.6:3479"
    },
  ],
};

var delayevent;

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
  },
};

/////////////////////////////////////////////

var socket = io.connect();

socket.emit("join");
console.log("Browser is opened");

socket.on("log", function (array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log("Client sending message: ", message);
  socket.emit("Browsermessage", message);
}

// This client receives a message
socket.on("DeviceMessage", function (message) {
  console.log("Browser received message:", message);

  if (message.type === "offer") {
    console.log("Received offer");
    createPeerConnection();
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === "candidate") {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate,
    });
    pc.addIceCandidate(candidate);
  }
});

////////////////////////////////////////////////////

var remoteVideo = document.querySelector("#screen");

function maybeStart() {
  console.log(">>>>>>> maybeStart() ", isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== "undefined" && isChannelReady) {
    console.log(">>>>>> creating peer connection");
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log("isInitiator", isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log("Created RTCPeerConnnection");
  } catch (e) {
    console.log("Failed to create PeerConnection, exception: " + e.message);
    alert("Cannot create RTCPeerConnection object.");
    return;
  }
}

function handleIceCandidate(event) {
  console.log("icecandidate event: ", event);
  if (event.candidate) {
    sendMessage({
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
    });
  } else {
    console.log("End of candidates.");
  }
}

function doAnswer() {
  console.log("Sending answer to peer.");
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log("setLocalAndSendMessage sending message", sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace("Failed to create session description: " + error.toString());
}

function handleRemoteStreamAdded(event) {
  console.log("Remote stream added now.", event);
  delayevent = event;
  remoteStream = delayevent.stream;
  remoteVideo.srcObject = remoteStream;
  remoteVideo.play();
}

socket.on("icestatedone", function (state) {
  if (remoteVideo.srcObject == null) {
    console.log("Empty stream");
  } else {
    console.log("stream is NOT empty");
  }
});

function handleRemoteStreamRemoved(event) {
  console.log("Remote stream removed. Event: ", event);
}

async function clickHandler(e) {
  console.log("clicked", e.target);
  const element = e.target;
  if (element.tagName === "IMG") {
    console.log("element.dataset.action", element.dataset.action);
    var sendData = await fetch(
      `/control-events?control=${element.dataset.action}`
    );
  }
}
document.querySelector(".table").addEventListener("click", clickHandler);

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    console.log("Got Access to Microphone");
  })
  .catch((err) => {
    console.log("Microphone Access Denied");
  });

// document.querySelector("#stop").addEventListener("click", () => {
//   alert("Stop Screen Sharing");
//   setTimeout(() => {}, 3000);
// });
