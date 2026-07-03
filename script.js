/* =====================================================
   Travel Checklist PWA — Vanilla JavaScript (ES6+)
   Veri akışı: checklist.md (ilk açılış) → localStorage
   ===================================================== */

"use strict";

// ---------- Sabitler ----------
const STORAGE_KEY = "travelChecklist.data.v1";
const THEME_KEY = "travelChecklist.theme";
const CHECKLIST_URL = "./checklist.md";

// ---------- Uygulama durumu ----------
let state = { categories: [] };
let searchQuery = "";
let editMode = false;

// ---------- DOM referansları ----------
const $ = (sel) => document.querySelector(sel);
const categoriesEl = $("#categories");
const progressFill = $("#progressFill");
const progressText = $("#progressText");
const progressPercent = $("#progressPercent");
const searchInput = $("#searchInput");
const emptyState = $("#emptyState");

// ---------- Yardımcılar ----------

/** Benzersiz kimlik üretir */
const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));

/** HTML enjeksiyonuna karşı kaçış */
const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- Markdown Parser ----------

/**
 * Markdown metnini veri modeline çevirir.
 * Format: "# Kategori" başlık, "- Madde" liste elemanı.
 * "- [x] Madde" biçimi de tamamlanmış olarak desteklenir.
 */
function parseMarkdown(text) {
  const categories = [];
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#")) {
      // Kategori başlığı ("#", "##" vs. hepsi kabul)
      current = {
        id: uid(),
        title: line.replace(/^#+\s*/, ""),
        collapsed: false,
        items: [],
      };
      categories.push(current);
    } else if (/^[-*]\s+/.test(line) && current) {
      let text = line.replace(/^[-*]\s+/, "");
      let done = false;
      // GitHub tarzı checkbox desteği: - [x] / - [ ]
      const m = text.match(/^\[( |x|X)\]\s*(.*)$/);
      if (m) {
        done = m[1].toLowerCase() === "x";
        text = m[2];
      }
      current.items.push({ id: uid(), text, done });
    }
  }
  return { categories };
}

/** Veri modelini Markdown'a çevirir (dışa aktarma) */
function toMarkdown(data) {
  return data.categories
    .map((cat) => {
      const items = cat.items
        .map((it) => `- [${it.done ? "x" : " "}] ${it.text}`)
        .join("\n");
      return `# ${cat.title}\n\n${items}`;
    })
    .join("\n\n") + "\n";
}

// ---------- localStorage ----------

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("localStorage kaydedilemedi:", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.categories)) return parsed;
  } catch (e) {
    console.warn("localStorage okunamadı:", e);
  }
  return null;
}

/** Varsayılan checklist.md dosyasını yükler */
async function loadDefaultChecklist() {
  const res = await fetch(CHECKLIST_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error("checklist.md yüklenemedi");
  return parseMarkdown(await res.text());
}

// ---------- Render ----------

function render() {
  const q = searchQuery.toLowerCase();
  categoriesEl.innerHTML = "";
  let visibleCount = 0;

  for (const cat of state.categories) {
    // Arama filtresi: eşleşen maddeler
    const items = q
      ? cat.items.filter((it) => it.text.toLowerCase().includes(q))
      : cat.items;

    // Arama sırasında boş kalan kategoriler gizlenir
    if (q && items.length === 0) continue;
    visibleCount++;

    const doneCount = cat.items.filter((it) => it.done).length;
    const collapsed = q ? false : cat.collapsed; // arama açıkken hepsi görünür

    const card = document.createElement("section");
    card.className = "category-card" + (collapsed ? " collapsed" : "");
    card.innerHTML = `
      <button class="category-header" data-action="toggle-cat" data-cat="${cat.id}">
        <span class="category-title">${escapeHtml(cat.title)}</span>
        <span class="cat-actions">
          <span class="mini-btn" data-action="edit-cat" data-cat="${cat.id}" role="button" title="Düzenle">✏️</span>
          <span class="mini-btn delete" data-action="delete-cat" data-cat="${cat.id}" role="button" title="Sil">🗑️</span>
        </span>
        <span class="category-count">${doneCount} / ${cat.items.length}</span>
        <span class="chevron">▼</span>
      </button>
      <div class="category-body">
        ${items.map((it) => `
          <div class="item ${it.done ? "done" : ""}">
            <button class="checkbox" data-action="toggle-item" data-cat="${cat.id}" data-item="${it.id}" aria-label="İşaretle">✓</button>
            <span class="item-text">${escapeHtml(it.text)}</span>
            <span class="item-actions">
              <span class="mini-btn" data-action="edit-item" data-cat="${cat.id}" data-item="${it.id}" role="button" title="Düzenle">✏️</span>
              <span class="mini-btn delete" data-action="delete-item" data-cat="${cat.id}" data-item="${it.id}" role="button" title="Sil">🗑️</span>
            </span>
          </div>`).join("")}
        <button class="add-item-btn" data-action="add-item" data-cat="${cat.id}">＋ Madde Ekle</button>
      </div>`;
    categoriesEl.appendChild(card);
  }

  emptyState.classList.toggle("hidden", visibleCount > 0);
  updateProgress();
}

/** Progress bar'ı günceller */
function updateProgress() {
  const all = state.categories.flatMap((c) => c.items);
  const total = all.length;
  const done = all.filter((it) => it.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  progressFill.style.width = pct + "%";
  progressText.textContent = `${done} / ${total}`;
  progressPercent.textContent = pct + "%";
}

// ---------- Metin girişi modalı (prompt yerine) ----------

function askText(title, initial = "") {
  return new Promise((resolve) => {
    const overlay = $("#promptOverlay");
    const input = $("#promptInput");
    $("#promptTitle").textContent = title;
    input.value = initial;
    overlay.classList.remove("hidden");
    setTimeout(() => input.focus(), 50);

    const close = (value) => {
      overlay.classList.add("hidden");
      okBtn.onclick = cancelBtn.onclick = input.onkeydown = null;
      resolve(value);
    };
    const okBtn = $("#promptOk");
    const cancelBtn = $("#promptCancel");
    okBtn.onclick = () => close(input.value.trim() || null);
    cancelBtn.onclick = () => close(null);
    input.onkeydown = (e) => { if (e.key === "Enter") okBtn.click(); };
  });
}

// ---------- Olay yönetimi (event delegation) ----------

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const cat = state.categories.find((c) => c.id === el.dataset.cat);

  switch (action) {
    case "toggle-cat": {
      // Düzenleme butonlarına tıklanınca kategoriyi kapatma
      if (e.target.closest(".mini-btn")) return;
      cat.collapsed = !cat.collapsed;
      saveState(); render();
      break;
    }
    case "toggle-item": {
      const item = cat.items.find((it) => it.id === el.dataset.item);
      item.done = !item.done;
      saveState(); render();
      break;
    }
    case "add-item": {
      const text = await askText("Yeni madde");
      if (text) { cat.items.push({ id: uid(), text, done: false }); saveState(); render(); }
      break;
    }
    case "edit-item": {
      const item = cat.items.find((it) => it.id === el.dataset.item);
      const text = await askText("Maddeyi düzenle", item.text);
      if (text) { item.text = text; saveState(); render(); }
      break;
    }
    case "delete-item": {
      cat.items = cat.items.filter((it) => it.id !== el.dataset.item);
      saveState(); render();
      break;
    }
    case "edit-cat": {
      const title = await askText("Kategoriyi düzenle", cat.title);
      if (title) { cat.title = title; saveState(); render(); }
      break;
    }
    case "delete-cat": {
      if (confirm(`"${cat.title}" kategorisi ve içindeki tüm maddeler silinsin mi?`)) {
        state.categories = state.categories.filter((c) => c.id !== cat.id);
        saveState(); render();
      }
      break;
    }
  }
});

// ---------- Üst bar ----------

$("#btnEdit").addEventListener("click", () => {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode", editMode);
  $("#btnEdit").classList.toggle("active", editMode);
  $("#addCategoryWrap").classList.toggle("hidden", !editMode);
});

$("#btnAddCategory").addEventListener("click", async () => {
  const title = await askText("Yeni kategori (emoji ekleyebilirsin)");
  if (title) {
    state.categories.push({ id: uid(), title, collapsed: false, items: [] });
    saveState(); render();
  }
});

// ---------- Arama ----------

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  render();
});

// ---------- Ayarlar ----------

const settingsOverlay = $("#settingsOverlay");
$("#btnSettings").addEventListener("click", () => settingsOverlay.classList.remove("hidden"));
$("#btnCloseSettings").addEventListener("click", () => settingsOverlay.classList.add("hidden"));
settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden");
});

// Tema
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === theme)
  );
}
$("#themeSegment").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (btn) applyTheme(btn.dataset.theme);
});

// Markdown dışa aktarma
$("#btnExport").addEventListener("click", () => {
  const blob = new Blob([toMarkdown(state)], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "checklist.md";
  a.click();
  URL.revokeObjectURL(a.href);
});

// Markdown içe aktarma
$("#btnImport").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const parsed = parseMarkdown(text);
  if (parsed.categories.length === 0) {
    alert("Dosyada geçerli bir liste bulunamadı. Format: # Kategori ve - Madde");
    return;
  }
  if (confirm("Mevcut liste, yüklenen dosyayla değiştirilecek. Devam edilsin mi?")) {
    state = parsed;
    saveState(); render();
    settingsOverlay.classList.add("hidden");
  }
  e.target.value = "";
});

// Varsayılan listeye dönme
$("#btnReset").addEventListener("click", async () => {
  if (!confirm("Tüm değişiklikler silinip varsayılan listeye dönülecek. Emin misin?")) return;
  localStorage.removeItem(STORAGE_KEY);
  try {
    state = await loadDefaultChecklist();
  } catch {
    alert("checklist.md yüklenemedi. İnternet bağlantını kontrol et.");
    return;
  }
  saveState(); render();
  settingsOverlay.classList.add("hidden");
});

// ---------- Başlangıç ----------

async function init() {
  // Tema tercihi
  applyTheme(localStorage.getItem(THEME_KEY) || "auto");

  // Veri: önce localStorage, yoksa checklist.md
  const saved = loadState();
  if (saved) {
    state = saved;
  } else {
    try {
      state = await loadDefaultChecklist();
      saveState();
    } catch (e) {
      console.error(e);
      state = { categories: [] };
    }
  }
  render();

  // Service Worker kaydı (offline destek)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((e) =>
      console.warn("Service Worker kaydedilemedi:", e)
    );
  }
}

init();
