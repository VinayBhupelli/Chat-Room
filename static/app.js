let socket;
let roomID;
let username;
document.getElementById("joinRoomButton").addEventListener("click", connectToRoom);
document.getElementById("createRoomButton").addEventListener("click", connectToRoom);

function connectToRoom() {
  roomID = document.getElementById("roomID").value.trim();
  username = document.getElementById("username").value.trim();

  if (!roomID || !username) {
    alert("Please enter both Room ID and Username.");
    return;
  }

  socket = new WebSocket("ws://localhost:3000/websocket?roomID=" + encodeURIComponent(roomID) + "&username=" + encodeURIComponent(username));

  socket.onopen = function () {
  };

  socket.onmessage = function (event) {
    const messageBox = document.getElementById("messageBox");
    const msgText = event.data;

    if (msgText.startsWith("ERROR:")) {
      alert(msgText);
      socket.close();
      resetChat();
      return;
    }

    if (msgText.startsWith("Welcome")) {
      document.getElementById("roomInfo").textContent = msgText;
      document.getElementById("usernameInput").style.display = "none";
      document.getElementById("chatBox").style.display = "block";
    } else {
      const chatMessage = document.createElement("div");
      if (msgText.startsWith(username + ":")) {
        chatMessage.classList.add("message", "user-message");
      } else {
        chatMessage.classList.add("message", "server-message");
      }
      chatMessage.textContent = msgText;
      messageBox.appendChild(chatMessage);
      messageBox.scrollTop = messageBox.scrollHeight;
    }
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };

  socket.onclose = function () {
    alert("Connection closed.");
    resetChat();
  };
}

document.getElementById("sendButton").addEventListener("click", sendMessage);

document.getElementById("messageInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();
  if (message && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  
    const messageBox = document.getElementById("messageBox");
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = "You: " + message;
    messageBox.appendChild(userMessage);
    messageInput.value = "";
    messageBox.scrollTop = messageBox.scrollHeight;
  }
}

function resetChat() {
  document.getElementById("messageBox").innerHTML = "";
  document.getElementById("roomID").value = "";
  document.getElementById("username").value = "";
  document.getElementById("roomInfo").textContent = "";
  document.getElementById("usernameInput").style.display = "block";
  document.getElementById("chatBox").style.display = "none";
}
