const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

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
