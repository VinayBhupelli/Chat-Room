const socket = new WebSocket("ws://localhost:3000/websocket");

socket.onmessage = function(event) {
  const messageBox = document.getElementById("messageBox");
  const serverMessage = document.createElement("div");
  serverMessage.classList.add("message", "server-message");
  serverMessage.textContent = "Server: " + event.data;
  messageBox.appendChild(serverMessage);
  messageBox.scrollTop = messageBox.scrollHeight;
};

document.getElementById("sendButton").addEventListener("click", sendMessage);

document.getElementById("messageInput").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  if (message) {
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
