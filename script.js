/* 今天吃什么呀？ — Version 1
   AI is local for now. Later: Cloudflare Worker -> Gemini.
*/
"use strict";

const state = {
  foods: [],
  mood: "随便",
  aiNote: "",
  history: [],
  lastChoice: ""
};

const $ = (id) => document.getElementById(id);

const els = {
  foodInput: $("foodInput"),
  addFoodBtn: $("addFoodBtn"),
  foodChips: $("foodChips"),
  emptyHint: $("emptyHint"),
  moodOptions: $("moodOptions"),
  aiInput: $("aiInput"),
  aiAnalyzeBtn: $("aiAnalyzeBtn"),
  aiStatus: $("aiStatus"),
  chooseBtn: $("chooseBtn"),
  resultCard: $("resultCard"),
  resultEmoji: $("resultEmoji"),
  resultFood: $("resultFood"),
  resultReason: $("resultReason"),
  acceptBtn: $("acceptBtn"),
  againBtn: $("againBtn"),
  loveMessage: $("loveMessage"),
  historyCard: $("historyCard"),
  historyList: $("historyList"),
  celebration: $("celebration")
};

const fallbackFoods = ["寿司", "拉面", "火锅"];

const foodEmoji = {
  "寿司":"🍣","拉面":"🍜","火锅":"🍲","鸡饭":"🍚","炸鸡":"🍗",
  "汉堡":"🍔","披萨":"🍕","饺子":"🥟","意大利面":"🍝","沙拉":"🥗",
  "咖喱":"🍛","蛋":"🍳","默认":"🍽️"
};

const moodReasons = {
  "随便":[
    "好啦，今天不用再纠结了。这个答案交给命运。♡",
    "你已经想够久了，所以今天我替你做决定。",
    "答案出现了。现在只负责开心吃饭，其他事情晚点再想。"
  ],
  "开心":[
    "今天值得奖励自己一下。好吃最重要，快乐是今天的必修课。",
    "开心的时候就应该吃自己喜欢的，这一餐要负责让你嘴角上扬。",
    "今天的任务很简单：吃一顿让你开心的。♡"
  ],
  "舒服":[
    "感觉今天需要一点温柔的食物，把胃和心情一起照顾好。",
    "不需要很特别，舒服、满足，就是今天最好的选择。",
    "如果今天有一点累，那就让这一餐负责哄哄你。"
  ],
  "清爽":[
    "今天给身体一点轻松感，吃完舒服比吃撑更重要。",
    "清清爽爽地吃一顿，等一下也会更有精神。",
    "今天的关键词：好吃、舒服、没有负担。"
  ]
};

document.querySelectorAll("[data-food]").forEach((button) => {
  button.addEventListener("click", () => addFood(button.dataset.food));
});

els.addFoodBtn.addEventListener("click", () => addFood(els.foodInput.value));

els.foodInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addFood(els.foodInput.value);
  }
});

els.moodOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mood]");
  if (!button) return;
  state.mood = button.dataset.mood;
  document.querySelectorAll(".mood").forEach((item) =>
    item.classList.toggle("active", item === button)
  );
  setAiStatus("");
});

els.aiAnalyzeBtn.addEventListener("click", analyzeMoodLocally);
els.chooseBtn.addEventListener("click", () => chooseFood(false));
els.againBtn.addEventListener("click", () => chooseFood(true));

els.acceptBtn.addEventListener("click", () => {
  els.loveMessage.textContent = "好耶 ♡ 那就决定了！不可以反悔，除非下一顿 😌";
  celebrate(true);
});

function addFood(rawName) {
  const name = rawName.trim();
  if (!name) return els.foodInput.focus();
  if (name.length > 30 || state.foods.includes(name)) {
    els.foodInput.value = "";
    return;
  }
  state.foods.push(name);
  els.foodInput.value = "";
  renderFoods();
  els.foodInput.focus();
}

function removeFood(name) {
  state.foods = state.foods.filter((food) => food !== name);
  renderFoods();
}

function renderFoods() {
  els.foodChips.innerHTML = state.foods.map((food) => `
    <div class="food-chip">
      <span>${escapeHtml(food)}</span>
      <button type="button" aria-label="删除 ${escapeHtml(food)}"
              data-remove-food="${escapeAttribute(food)}">×</button>
    </div>
  `).join("");

  els.emptyHint.hidden = state.foods.length > 0;

  els.foodChips.querySelectorAll("[data-remove-food]").forEach((button) => {
    button.addEventListener("click", () => removeFood(button.dataset.removeFood));
  });
}

async function chooseFood(again) {
  if (state.foods.length === 0) {
    fallbackFoods.forEach((food) => {
      if (!state.foods.includes(food)) state.foods.push(food);
    });
    renderFoods();
  }

  els.chooseBtn.classList.add("loading");
  els.chooseBtn.querySelector("span:nth-child(2)").textContent = "小明正在想……";
  await wait(550);

  const pool = state.foods.filter((food) => food !== state.lastChoice);
  const candidates = pool.length ? pool : state.foods;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  state.lastChoice = chosen;
  els.resultEmoji.textContent = getFoodEmoji(chosen);
  els.resultFood.textContent = chosen;
  els.resultReason.textContent = getReason();
  els.resultCard.classList.add("show");
  els.resultCard.scrollIntoView({ behavior: "smooth", block: "center" });

  addHistory(chosen);

  els.chooseBtn.classList.remove("loading");
  els.chooseBtn.querySelector("span:nth-child(2)").textContent = "替我决定今天吃什么";
  celebrate(again);
}

function getReason() {
  if (state.aiNote) {
    return `小明听到你今天的感觉了。${state.aiNote} 所以，这一餐就交给我吧。♡`;
  }
  const options = moodReasons[state.mood] || moodReasons["随便"];
  return options[Math.floor(Math.random() * options.length)];
}

/*
  AI integration point:
  Later replace analyzeMoodLocally() with a request to a server-side
  endpoint such as a Cloudflare Worker. NEVER put an AI API key here.
*/
function analyzeMoodLocally() {
  const note = els.aiInput.value.trim();

  if (!note) {
    setAiStatus("先跟小明说一句今天的感觉吧。♡");
    els.aiInput.focus();
    return;
  }

  const signals = [];

  if (/累|疲惫|辛苦|困|没力|加班/.test(note)) {
    signals.push("今天辛苦了，感觉你需要一点舒服的食物。");
    state.mood = "舒服";
  }
  if (/开心|快乐|奖励|庆祝|爽/.test(note)) {
    signals.push("嗯嗯，今天值得奖励一下自己。");
    state.mood = "开心";
  }
  if (/清爽|清淡|不油|不要太油|轻一点/.test(note)) {
    signals.push("收到，今天走清爽路线。");
    state.mood = "清爽";
  }
  if (/随便|不知道|都可以|不懂|纠结/.test(note)) {
    signals.push("那就不要想了，今天交给小明。");
    state.mood = "随便";
  }
  if (/辣/.test(note)) signals.push("我记住了：今天可以有一点辣。");
  if (/热|暖/.test(note)) signals.push("热乎乎的感觉收到。");
  if (/便宜|省钱|预算|不要贵|不贵/.test(note)) signals.push("预算也要照顾到。");

  state.aiNote = signals.join(" ") ||
    "我大概懂你的感觉了。今天不用想太多，吃点让自己开心的吧。";

  updateMoodUI();
  setAiStatus("✦ 小明听懂了一点点：" + state.aiNote);
}

function updateMoodUI() {
  document.querySelectorAll(".mood").forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === state.mood);
  });
}

function setAiStatus(message) {
  els.aiStatus.textContent = message;
}

function addHistory(food) {
  state.history.unshift({
    food,
    time: new Date().toLocaleTimeString("zh-CN", { hour:"2-digit", minute:"2-digit" })
  });
  state.history = state.history.slice(0, 5);
  renderHistory();
}

function renderHistory() {
  els.historyCard.classList.toggle("hidden", state.history.length === 0);
  els.historyList.innerHTML = state.history.map((item) => `
    <div class="history-item">
      <span>${getFoodEmoji(item.food)} ${escapeHtml(item.food)}</span>
      <time>${item.time}</time>
    </div>
  `).join("");
}

function getFoodEmoji(food) {
  for (const [name, emoji] of Object.entries(foodEmoji)) {
    if (food.includes(name)) return emoji;
  }
  return foodEmoji["默认"];
}

function celebrate(big = false) {
  const symbols = ["♡","✦","✧","˚","·"];
  const count = big ? 30 : 16;
  els.celebration.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--x", `${Math.random() * 220 - 110}px`);
    piece.style.setProperty("--r", `${Math.random() * 900 - 450}deg`);
    piece.style.animationDelay = `${Math.random() * .22}s`;
    els.celebration.appendChild(piece);
  }

  window.setTimeout(() => { els.celebration.innerHTML = ""; }, 2100);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function escapeAttribute(value) {
  return value.replace(/"/g, "&quot;");
}

renderFoods();
