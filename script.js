/* 今天吃什么呀？ — Caca Personalized Version
   Personalized to Caca's food preferences.
   No external API required.
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
  celebration: $("celebration"),
  boyfriendModal: $("boyfriendModal"),
  closeBoyfriendBtn: $("closeBoyfriendBtn"),
  boyfriendOkayBtn: $("boyfriendOkayBtn"),
  boyfriendFoodMessage: $("boyfriendFoodMessage")
};

// Caca's known favourites and food habits.
const cacaFavorites = [
  "辣子鸡",
  "手撕包菜（脆脆的）",
  "Ayam Gepuk — Set A（生包菜）",
  "Boost 巧克力",
  "蛋挞",
  "Maggie goreng",
  "Indo mee",
  "流行蛋",
  "生包菜",
  "萝卜丝",
  "麻辣",
  "Ramly burger（少酱＋葱）",
  "迪拜球",
  "Tuna sandwich",
  "炸油条",
  "Cheese tofu",
  "Sushi Zen — Tunamayo",
  "Sushi Mentai — Tunamayo",
  "火锅 — 麻辣汤底",
  "FamilyMart Classic Tuna Sandwich",
  "FamilyMart Corn Dog",
  "FamilyMart Chocolate Mochi Bread"
];

const quickFavorites = [
  "辣子鸡",
  "Ayam Gepuk — Set A",
  "Sushi Zen — Tunamayo",
  "火锅 — 麻辣汤底",
  "FamilyMart Tuna Sandwich",
  "Maggie goreng"
];

const dislikedFoods = ["榴莲", "Hashbrown", "豆腐", "Cucumber", "黄瓜", "Tomato", "番茄"];

const foodEmoji = {
  "寿司":"🍣", "Sushi":"🍣", "Tunamayo":"🍣", "拉面":"🍜", "火锅":"🍲",
  "鸡饭":"🍚", "炸鸡":"🍗", "辣子鸡":"🍗", "汉堡":"🍔", "Ramly":"🍔",
  "披萨":"🍕", "饺子":"🥟", "意大利面":"🍝", "沙拉":"🥗", "咖喱":"🍛",
  "蛋":"🍳", "蛋挞":"🥧", "油条":"🥖", "巧克力":"🍫", "Mochi":"🍫",
  "sandwich":"🥪", "Sandwich":"🥪", "Maggie":"🍜", "mee":"🍜", "Indo mee":"🍜",
  "Ayam":"🍗", "Cheese tofu":"🧀", "包菜":"🥬", "萝卜":"🥕", "默认":"🍽️"
};

const moodReasons = {
  "随便": [
    "好啦，今天不用再纠结了。晓明已经参考了你的口味，替你做决定。♡",
    "你已经想够久了，所以今天交给晓明。只负责开心吃饭。",
    "今天不需要做选择题。晓明从你喜欢的东西里帮你挑一个。♡"
  ],
  "开心": [
    "今天值得奖励自己一下，所以从 Caca 喜欢的食物里选一个开心的。",
    "开心的时候就应该吃喜欢的，这一餐要负责让你嘴角上扬。♡",
    "今天的任务很简单：吃一顿自己真的喜欢的。"
  ],
  "舒服": [
    "感觉今天需要一点温柔的食物，让胃和心情一起被照顾好。",
    "不需要很特别，舒服、满足，就是今天最好的选择。",
    "如果今天有一点累，那就让这一餐负责哄哄你。♡"
  ],
  "清爽": [
    "今天给身体一点轻松感，吃完舒服比吃撑更重要。",
    "清清爽爽地吃一顿，等一下也会更有精神。",
    "今天的关键词：好吃、舒服、没有负担。"
  ]
};

// Add quick favourite buttons.
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

els.closeBoyfriendBtn.addEventListener("click", closeBoyfriendModal);
els.boyfriendOkayBtn.addEventListener("click", closeBoyfriendModal);
document.querySelector("[data-close-boyfriend]").addEventListener("click", closeBoyfriendModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeBoyfriendModal();
});

els.acceptBtn.addEventListener("click", () => {
  els.loveMessage.textContent = "好耶 ♡ 那就决定了！不可以反悔，除非下一顿 😌";
  celebrate(true);
});

function addFood(rawName) {
  const name = rawName.trim();
  if (!name) return els.foodInput.focus();

  const disliked = findDislikedFood(name);
  if (disliked) {
    setAiStatus(`🚫 ${disliked} 不可以偷偷混进来啦。晓明记得 Caca 不吃这个。♡`);
    els.foodInput.select();
    return;
  }

  if (name.length > 40 || state.foods.includes(name)) {
    els.foodInput.value = "";
    return;
  }

  state.foods.push(name);
  els.foodInput.value = "";
  setAiStatus(`♡ 已经帮 Caca 记下「${name}」了。`);
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
  // If Caca hasn't entered choices, use her personalised favourites automatically.
  if (state.foods.length === 0) {
    cacaFavorites.forEach((food) => {
      if (!state.foods.includes(food)) state.foods.push(food);
    });
    renderFoods();
    setAiStatus("♡ 晓明已经从 Caca 平时喜欢吃的东西里帮你准备好了。放心选。 ");
  }

  els.chooseBtn.classList.add("loading");
  els.chooseBtn.querySelector("span:nth-child(2)").textContent = "晓明正在想……";
  await wait(550);

  const candidates = getPersonalizedCandidates();
  let pool = candidates.filter((food) => food !== state.lastChoice);
  if (!pool.length) pool = candidates;

  const chosen = weightedPick(pool);

  state.lastChoice = chosen;
  els.resultEmoji.textContent = getFoodEmoji(chosen);
  els.resultFood.textContent = chosen;
  els.resultReason.textContent = getReason(chosen);
  els.resultCard.classList.add("show");
  els.resultCard.scrollIntoView({ behavior: "smooth", block: "center" });

  addHistory(chosen);

  els.chooseBtn.classList.remove("loading");
  els.chooseBtn.querySelector("span:nth-child(2)").textContent = "替我决定今天吃什么";
  celebrate(again);
  window.setTimeout(() => openBoyfriendModal(chosen), 450);
}

function getPersonalizedCandidates() {
  let candidates = state.foods.filter((food) => !findDislikedFood(food));

  const note = `${state.aiNote} ${els.aiInput.value}`.trim();

  // Strong preference signals.
  if (/寿司|sushi|tunamayo/i.test(note)) {
    const sushi = candidates.filter((food) => /sushi|寿司|tunamayo/i.test(food));
    if (sushi.length) candidates = sushi;
  } else if (/火锅|麻辣|辣/.test(note)) {
    const spicy = candidates.filter((food) => /火锅|麻辣|辣子鸡|ayam/i.test(food));
    if (spicy.length) candidates = spicy;
  } else if (/巧克力|甜|甜点|dessert/i.test(note)) {
    const sweet = candidates.filter((food) => /巧克力|蛋挞|迪拜球|mochi|boost/i.test(food));
    if (sweet.length) candidates = sweet;
  } else if (/sandwich|三明治|family ?mart/i.test(note)) {
    const sandwich = candidates.filter((food) => /sandwich|三明治|corn dog|mochi/i.test(food));
    if (sandwich.length) candidates = sandwich;
  }

  // Keep the pool safe even if an accidental custom item slipped through.
  candidates = candidates.filter((food) => !findDislikedFood(food));
  return candidates.length ? candidates : cacaFavorites.slice();
}

function weightedPick(items) {
  // Give her strongest known favourites a little more chance without making the result predictable.
  const weights = items.map((food) => {
    let weight = 1;
    if (/Ayam Gepuk|辣子鸡|Sushi Zen|Sushi Mentai|Tunamayo|Maggie|Indo mee/i.test(food)) weight += 2;
    if (/FamilyMart|Cheese tofu/i.test(food)) weight += 1;
    return weight;
  });

  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function openBoyfriendModal(food) {
  els.boyfriendFoodMessage.textContent = `今天就好好吃「${food}」吧。吃完记得告诉我好不好吃 ♡`;
  els.boyfriendModal.classList.add("show");
  els.boyfriendModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBoyfriendModal() {
  els.boyfriendModal.classList.remove("show");
  els.boyfriendModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function getReason(chosen) {
  if (/Ayam Gepuk/i.test(chosen)) {
    return "晓明记得：Ayam Gepuk 要 Set A，而且要保留生包菜。熟包菜？今天不安排。♡";
  }
  if (/Sushi Zen|Sushi Mentai/i.test(chosen)) {
    return "晓明记得 Caca 吃这两家的寿司，而且 Tunamayo 是必点。这个选择很懂你。🍣";
  }
  if (/火锅/.test(chosen)) {
    return "火锅当然要麻辣汤底。今天就让辣辣的幸福负责哄你开心。🌶️";
  }
  if (/Ramly/i.test(chosen)) {
    return "Ramly burger 记得少一点酱，葱可以放。晓明有认真听。♡";
  }
  if (/Indo mee/i.test(chosen)) {
    return "如果是 Indo mee，晓明记得：你会选 Indo mee 多过 Mee Sedap。🍜";
  }
  if (/手撕包菜/.test(chosen)) {
    return "手撕包菜要脆脆的，绝对不要软趴趴。晓明记住了。🥬";
  }
  if (state.aiNote) {
    return `晓明听到你今天的感觉了。${state.aiNote} 所以这一餐就交给我吧。♡`;
  }
  const options = moodReasons[state.mood] || moodReasons["随便"];
  return options[Math.floor(Math.random() * options.length)];
}

function analyzeMoodLocally() {
  const note = els.aiInput.value.trim();

  if (!note) {
    setAiStatus("先跟晓明说一句今天的感觉吧。♡");
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
    signals.push("那就不要想了，今天交给晓明。");
    state.mood = "随便";
  }
  if (/辣|麻辣/.test(note)) signals.push("我记住了：今天可以辣一点。🌶️");
  if (/热|暖/.test(note)) signals.push("热乎乎的感觉收到。♨️");
  if (/便宜|省钱|预算|不要贵|不贵/.test(note)) signals.push("预算也要照顾到。♡");
  if (/甜|巧克力|蛋挞|迪拜球/.test(note)) signals.push("甜甜的需求收到。🍫");
  if (/寿司|sushi|tunamayo/i.test(note)) signals.push("寿司的话，晓明记得 Sushi Zen / Sushi Mentai 和 Tunamayo。🍣");
  if (/ayam gepuk/i.test(note)) signals.push("Ayam Gepuk 记得 Set A＋生包菜。🍗");
  if (/subway/i.test(note)) signals.push("Subway 记得 Hot Pepper Sauce＋Chili Sauce。🌶️");

  state.aiNote = signals.join(" ") ||
    "我大概懂你的感觉了。今天不用想太多，吃点让自己开心的吧。";

  updateMoodUI();
  setAiStatus("✦ 晓明听懂了一点点：" + state.aiNote);
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

function findDislikedFood(food) {
  return dislikedFoods.find((bad) => food.toLowerCase().includes(bad.toLowerCase())) || null;
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
