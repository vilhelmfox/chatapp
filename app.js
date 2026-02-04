const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const displayNameInput = document.getElementById("displayName");
const shareLinkButton = document.getElementById("shareLink");
const roomCode = document.getElementById("roomCode");
const connectionStatus = document.getElementById("connectionStatus");

const storedName = localStorage.getItem("chatapp:name");
if (storedName) {
  displayNameInput.value = storedName;
}

displayNameInput.addEventListener("change", () => {
  localStorage.setItem("chatapp:name", displayNameInput.value.trim());
});

const getRoomFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
};

const createRoomId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

let room = getRoomFromUrl();
if (!room) {
  room = createRoomId();
  const params = new URLSearchParams(window.location.search);
  params.set("room", room);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}
roomCode.textContent = room;

const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;

shareLinkButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    shareLinkButton.textContent = "Copied!";
    setTimeout(() => {
      shareLinkButton.textContent = "Copy room link";
    }, 2000);
  } catch (error) {
    window.prompt("Copy this link:", shareUrl);
  }
});

const scrollMessages = () => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

const formatTimestamp = (iso) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createMessage = ({ name, text, timestamp, variant }) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", `message--${variant}`);

  const meta = document.createElement("div");
  meta.classList.add("message__meta");
  meta.textContent =
    variant === "system" ? "System" : `${name} · ${formatTimestamp(timestamp)}`;

const createMessage = (text) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "message--outgoing");

  const meta = document.createElement("div");
  meta.classList.add("message__meta");
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  meta.textContent = `You · ${timestamp}`;

  const body = document.createElement("p");
  body.textContent = text;

  wrapper.append(meta, body);
  return wrapper;
};

const renderMessage = (message, isSelf) => {
  const variant = message.type === "system" ? "system" : isSelf ? "outgoing" : "incoming";
  const element = createMessage({
    name: message.name || "Guest",
    text: message.text,
    timestamp: message.timestamp || new Date().toISOString(),
    variant,
  });
  chatMessages.appendChild(element);
  scrollMessages();
};

const setStatus = (label, variant) => {
  connectionStatus.textContent = label;
  connectionStatus.classList.remove(
    "status--online",
    "status--offline",
    "status--connecting"
  );
  connectionStatus.classList.add(`status--${variant}`);
};

let socket;
let clientId;

const connect = () => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${protocol}://${window.location.host}?room=${room}`;
  setStatus("Connecting...", "connecting");

  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    setStatus("Online", "online");
  });

  socket.addEventListener("close", () => {
    setStatus("Offline", "offline");
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === "welcome") {
      clientId = payload.clientId;
      if (Array.isArray(payload.history)) {
        payload.history.forEach((message) => {
          renderMessage(message, message.senderId === clientId);
        });
      }
      return;
    }

    if (payload.type === "message") {
      renderMessage(payload, payload.senderId === clientId);
    }
  });
};

connect();

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const name = displayNameInput.value.trim() || "You";
  socket.send(
    JSON.stringify({
      type: "message",
      text: value,
      name,
    })
  );
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) {
    return;
  }

  const message = createMessage(value);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = "";
});
