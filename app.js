const ADMIN_PASSWORD = "2738";
const STORAGE_KEY = "mountainClubBoard";

const defaultState = {
  wishes: [],
  signups: [],
  subsidy: {
    amount: 0,
    memo: "",
    updatedAt: ""
  },
  subsidyHistory: []
};

const state = loadState();

const $ = (selector) => document.querySelector(selector);
const formatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      ...defaultState,
      ...saved,
      subsidy: {
        ...defaultState.subsidy,
        ...(saved.subsidy || {})
      },
      subsidyHistory: saved.subsidyHistory || []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayText() {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  $("#wishCount").textContent = state.wishes.length;
  $("#signupCount").textContent = state.signups.length;
  $("#subsidyTotal").textContent = formatter.format(state.subsidy.amount || 0);
  $("#subsidyUpdatedAt").textContent = state.subsidy.updatedAt
    ? `最後更新：${state.subsidy.updatedAt}`
    : "尚未更新";
  renderWishes();
  renderSignups();
  renderSubsidyHistory();
}

function renderWishes() {
  const list = $("#wishList");
  list.classList.toggle("empty", state.wishes.length === 0);
  list.innerHTML = state.wishes
    .map((item) => {
      const note = item.note ? `<p>${escapeHtml(item.note)}</p>` : "";
      return `
        <article class="entry">
          <h3>${escapeHtml(item.mountain)}</h3>
          ${note}
          <div class="entry-meta">
            <span>發想人：${escapeHtml(item.name)}</span>
            <span>${escapeHtml(item.createdAt)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSignups() {
  const list = $("#signupList");
  list.classList.toggle("empty", state.signups.length === 0);
  list.innerHTML = state.signups
    .map((item) => {
      const note = item.note ? `<p>${escapeHtml(item.note)}</p>` : "";
      return `
        <article class="entry">
          <h3>${escapeHtml(item.name)}</h3>
          ${note}
          <div class="entry-meta">
            <span>想去時間：${escapeHtml(item.date)}</span>
            <span>${escapeHtml(item.createdAt)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSubsidyHistory() {
  const list = $("#subsidyHistoryList");
  list.classList.toggle("empty", state.subsidyHistory.length === 0);
  list.innerHTML = state.subsidyHistory
    .map((item) => {
      const memo = item.memo ? `<p>${escapeHtml(item.memo)}</p>` : "<p>無更新說明</p>";
      return `
        <article class="entry subsidy-entry">
          <h3>${formatter.format(item.amount || 0)}</h3>
          ${memo}
          <div class="entry-meta">
            <span>${escapeHtml(item.updatedAt)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

$("#wishForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.wishes.unshift({
    id: createId(),
    name: $("#wishName").value.trim(),
    mountain: $("#mountainName").value.trim(),
    note: $("#wishNote").value.trim(),
    createdAt: todayText()
  });
  saveState();
  event.currentTarget.reset();
  render();
});

$("#signupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.signups.unshift({
    id: createId(),
    name: $("#signupName").value.trim(),
    date: $("#signupDate").value,
    note: $("#signupNote").value.trim(),
    createdAt: todayText()
  });
  saveState();
  event.currentTarget.reset();
  render();
});

$("#subsidyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = $("#adminMessage");

  if ($("#adminPassword").value !== ADMIN_PASSWORD) {
    message.textContent = "密碼錯誤，無法更新補助款。";
    message.classList.remove("success");
    return;
  }

  const update = {
    id: createId(),
    amount: Number($("#subsidyAmount").value),
    memo: $("#subsidyMemo").value.trim(),
    updatedAt: todayText()
  };

  state.subsidy = {
    amount: update.amount,
    memo: update.memo,
    updatedAt: update.updatedAt
  };
  state.subsidyHistory.unshift(update);

  saveState();
  message.textContent = update.memo ? `已更新：${update.memo}` : "補助款已更新。";
  message.classList.add("success");
  $("#adminPassword").value = "";
  $("#subsidyAmount").value = "";
  $("#subsidyMemo").value = "";
  render();
});

$("#clearWishes").addEventListener("click", () => {
  if (!state.wishes.length || !confirm("確定清空所有許願資料？")) return;
  state.wishes = [];
  saveState();
  render();
});

$("#clearSignups").addEventListener("click", () => {
  if (!state.signups.length || !confirm("確定清空所有報名資料？")) return;
  state.signups = [];
  saveState();
  render();
});

$("#clearSubsidyHistory").addEventListener("click", () => {
  if (!state.subsidyHistory.length || !confirm("確定清空所有補助款更新紀錄？")) return;
  state.subsidyHistory = [];
  saveState();
  render();
});

render();
