const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxPOOPaG72o-wU0DfsmyZ9RfxXmxSB6AkgEuAzk1noqKnqnBx-pFqmDbArxo6q7-xwJSQ/exec";
const BOT_NAME = "chat bot5";
const USER_NAME = "使用者";
const MAX_HISTORY_ITEMS = 12;

const conversationHistory = [];

const chatWindow = document.querySelector("#chatWindow");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const statusText = document.querySelector("#statusText");
const welcomeTime = document.querySelector("#welcomeTime");

welcomeTime.textContent = formatTimestamp(new Date());
messageInput.focus();

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  const requestHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
  appendMessage("user", "你", message);
  conversationHistory.push({ role: "user", text: message });
  messageInput.value = "";
  autoResize();
  setBusy(true, "chat bot5 正在溫柔思考中...");

  try {
    const timestamp = formatTimestamp(new Date());
    const data = await sendJsonpRequest({
      message,
      botName: BOT_NAME,
      userName: USER_NAME,
      history: requestHistory,
      sentAt: timestamp,
    });

    if (!data.ok) {
      throw new Error(data.error || "後端回覆格式不正確");
    }

    appendMessage("bot", "悠", data.reply, data.timestamp);
    conversationHistory.push({ role: "assistant", text: data.reply });
    setBusy(false, "已記錄這次對話。");
  } catch (error) {
    appendMessage("bot", "悠", "抱歉，剛剛連線時出了一點小狀況。請稍後再試一次。");
    setBusy(false, `錯誤：${error.message}`);
  }
});

messageInput.addEventListener("input", autoResize);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

function appendMessage(role, avatar, text, timestamp = formatTimestamp(new Date())) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatarNode = document.createElement("div");
  avatarNode.className = "avatar";
  avatarNode.setAttribute("aria-hidden", "true");
  avatarNode.textContent = avatar;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  const time = document.createElement("time");
  time.textContent = timestamp;

  bubble.append(paragraph, time);
  message.append(avatarNode, bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function autoResize() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 176)}px`;
}

function setBusy(isBusy, text) {
  sendButton.disabled = isBusy;
  messageInput.disabled = isBusy;
  statusText.textContent = text;

  if (!isBusy) {
    messageInput.focus();
  }
}

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}/${map.month}/${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

function sendJsonpRequest(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("連線逾時，請稍後再試。"));
    }, 20000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      resolve(response);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("無法連線到後端服務。"));
    };

    const url = new URL(GAS_ENDPOINT);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("payload", encodeURIComponent(JSON.stringify(payload)));
    script.src = url.toString();
    document.head.appendChild(script);
  });
}
