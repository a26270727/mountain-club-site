import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const ADMIN_PASSWORD = "2738";

const firebaseConfig = {
  apiKey: "AIzaSyDH_z8Ir5tOtZtday2EYCfI8Ag4Er71DvY",
  authDomain: "mountain-club-site.firebaseapp.com",
  databaseURL: "https://mountain-club-site-default-rtdb.firebaseio.com",
  projectId: "mountain-club-site",
  storageBucket: "mountain-club-site.firebasestorage.app",
  messagingSenderId: "493691203812",
  appId: "1:493691203812:web:39f535bdea485124847cf1",
  measurementId: "G-5KJMTQ315S"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dbRefs = {
  wishes: ref(db, "wishes"),
  signups: ref(db, "signups"),
  subsidy: ref(db, "subsidy"),
  subsidyHistory: ref(db, "subsidyHistory")
};

const state = {
  wishes: [],
  signups: [],
  subsidy: {
    amount: 0,
    memo: "",
    updatedAt: ""
  },
  subsidyHistory: []
};

const $ = (selector) => document.querySelector(selector);
const formatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

function listFromSnapshot(snapshot) {
  const value = snapshot.val();
  if (!value) return [];
  return Object.entries(value)
    .map(([id, item]) => ({ id, ...item }))
    .sort((a, b) => (b.createdAtMs || b.updatedAtMs || 0) - (a.createdAtMs || a.updatedAtMs || 0));
}

function nowInfo() {
  const date = new Date();
  return {
    text: new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date),
    ms: date.getTime()
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(text, isSuccess = false) {
  const message = $("#adminMessage");
  message.textContent = text;
  message.classList.toggle("success", isSuccess);
}

function requireAdminPassword(actionText) {
  const password = prompt(`${actionText}\n請輸入管理密碼：`);
  return password === ADMIN_PASSWORD;
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

onValue(dbRefs.wishes, (snapshot) => {
  state.wishes = listFromSnapshot(snapshot);
  render();
});

onValue(dbRefs.signups, (snapshot) => {
  state.signups = listFromSnapshot(snapshot);
  render();
});

onValue(dbRefs.subsidy, (snapshot) => {
  state.subsidy = snapshot.val() || { amount: 0, memo: "", updatedAt: "" };
  render();
});

onValue(dbRefs.subsidyHistory, (snapshot) => {
  state.subsidyHistory = listFromSnapshot(snapshot);
  render();
});

$("#wishForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const createdAt = nowInfo();
  await push(dbRefs.wishes, {
    name: $("#wishName").value.trim(),
    mountain: $("#mountainName").value.trim(),
    note: $("#wishNote").value.trim(),
    createdAt: createdAt.text,
    createdAtMs: createdAt.ms
  });
  event.currentTarget.reset();
});

$("#signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const createdAt = nowInfo();
  await push(dbRefs.signups, {
    name: $("#signupName").value.trim(),
    date: $("#signupDate").value,
    note: $("#signupNote").value.trim(),
    createdAt: createdAt.text,
    createdAtMs: createdAt.ms
  });
  event.currentTarget.reset();
});

$("#subsidyForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if ($("#adminPassword").value !== ADMIN_PASSWORD) {
    setMessage("密碼錯誤，無法更新補助款。");
    return;
  }

  const updatedAt = nowInfo();
  const update = {
    amount: Number($("#subsidyAmount").value),
    memo: $("#subsidyMemo").value.trim(),
    updatedAt: updatedAt.text,
    updatedAtMs: updatedAt.ms
  };

  await set(dbRefs.subsidy, update);
  await push(dbRefs.subsidyHistory, update);

  setMessage(update.memo ? `已更新：${update.memo}` : "補助款已更新。", true);
  $("#adminPassword").value = "";
  $("#subsidyAmount").value = "";
  $("#subsidyMemo").value = "";
});

$("#clearWishes").addEventListener("click", async () => {
  if (!state.wishes.length) return;
  if (!requireAdminPassword("確定清空所有許願資料？")) return;
  await remove(dbRefs.wishes);
});

$("#clearSignups").addEventListener("click", async () => {
  if (!state.signups.length) return;
  if (!requireAdminPassword("確定清空所有報名資料？")) return;
  await remove(dbRefs.signups);
});

$("#clearSubsidyHistory").addEventListener("click", async () => {
  if (!state.subsidyHistory.length) return;
  if (!requireAdminPassword("確定清空所有補助款更新紀錄？")) return;
  await remove(dbRefs.subsidyHistory);
});

render();
