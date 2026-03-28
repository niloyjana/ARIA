// main.js — UI logic, sidebar, scroll reveal, API calls, result display

// ── Backend URL: same origin since FastAPI serves the frontend ──
const API = "";   // empty = same origin (http://localhost:8000)

let currentTool = null;

// ── Sidebar Logic ─────────────────────────────────────────
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mobileToggle = document.getElementById("mobile-toggle");
const sidebarOverlay = document.getElementById("sidebar-overlay");

function toggleSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");
  } else {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("rail");
  }
}

function closeSidebarMobile() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
if (mobileToggle) mobileToggle.addEventListener("click", toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebarMobile);



// ── Collapsible sidebar sections ──────────────────────────
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.toggle("section-collapsed");
}

// ── Add data-tooltip to nav items for collapsed icon rail ──
document.querySelectorAll(".nav-item").forEach(item => {
  const tooltip = item.getAttribute("data-tooltip");
  if (!tooltip) {
    const label = item.querySelector(".nav-label");
    if (label) item.setAttribute("data-tooltip", label.textContent.trim());
  }
});

// ── Sidebar Navigation Clicks ─────────────────────────────
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();

    // Update active state
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    // Close sidebar on mobile
    if (window.innerWidth <= 900) closeSidebarMobile();

    // If this nav item maps to a tool, open it
    const toolId = item.getAttribute("data-tool");
    if (toolId && TOOLS[toolId]) {
      openTool(toolId);
      return;
    }

    // For "coming soon" pages, show a brief toast
    const page = item.getAttribute("data-page");
    if (page && page !== "dashboard") {
      showComingSoon(item.querySelector(".nav-label")?.textContent || page);
    }
  });
});

// ── Coming Soon Toast ─────────────────────────────────────
function showComingSoon(name) {
  // Remove existing toast
  const existing = document.querySelector(".toast-coming-soon");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast-coming-soon";
  toast.innerHTML = `<span>🚀</span> <strong>${name}</strong> is coming soon!`;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(16, 14, 28, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(168, 85, 247, 0.2);
    color: #e0d0ff;
    padding: 12px 24px;
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 14px;
    z-index: 9000;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(168, 85, 247, 0.1);
    opacity: 0;
    animation: toastIn 0.35s cubic-bezier(.22, 1, .36, 1) forwards;
  `;

  // Add animation keyframes if not already added
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Scroll Reveal ─────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

// Observe all scroll-reveal elements once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".scroll-reveal").forEach(el => {
    revealObserver.observe(el);
  });
});

// ── Status Check removed per user request ──


// ── Wallet balance counter animation ─────────────────────────
function animateWalletCounter() {
  const el = document.querySelector(".wallet-balance");
  if (!el) return;
  let count = 0;
  const target = 25000;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.innerHTML = `₹${count.toLocaleString("en-IN")} <span class="wallet-sub">/ advisor fees saved</span>`;
    if (count >= target) clearInterval(timer);
  }, 25);
}
// Trigger wallet counter when wallet card enters view
const walletCard = document.querySelector(".wallet-card");
if (walletCard) {
  const walletObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setTimeout(animateWalletCounter, 600);
      walletObserver.disconnect();
    }
  }, { threshold: 0.3 });
  walletObserver.observe(walletCard);
}


// ── Open Tool Modal ───────────────────────────────────────────
function openTool(id) {
  const tool = TOOLS[id];
  if (!tool) return;
  currentTool = id;

  document.getElementById("modal-content").innerHTML = buildForm(tool);
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";

  tool.fields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (el) el.addEventListener("input", () => updateInfoBar(tool));
  });
  updateInfoBar(tool);
}

function closeToolModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

function closeModal(e) {
  if (e.target === document.getElementById("modal-overlay")) closeToolModal();
}


// ── Build Form HTML ───────────────────────────────────────────
function buildForm(tool) {
  const fieldsHTML = tool.fields.map(f => {
    const spanClass = f.span ? " span2" : "";
    let input = "";

    if (f.type === "select") {
      const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join("");
      input = `<select id="field-${f.key}">${opts}</select>`;
    } else if (f.type === "textarea") {
      input = `<textarea id="field-${f.key}" placeholder="${f.placeholder || ""}" rows="4"></textarea>`;
    } else if (f.type === "text") {
      input = `<input type="text" id="field-${f.key}" placeholder="${f.placeholder || ""}" />`;
    } else {
      input = `<input type="number" id="field-${f.key}" placeholder="${f.placeholder || ""}" min="0" />`;
    }

    return `<div class="form-group${spanClass}">
      <label for="field-${f.key}">${f.label}</label>
      ${input}
    </div>`;
  }).join("");

  return `
    <h2 style="color:${tool.color}">${tool.title}</h2>
    <p class="subtitle">${tool.subtitle}</p>
    <div id="info-bar" class="info-bar">💡 Fill in your details below</div>
    <div class="form-grid">${fieldsHTML}</div>
    <button class="submit-btn" id="submit-btn" onclick="submitTool()">
      ${tool.btnText}
    </button>
  `;
}


// ── Info Bar ──────────────────────────────────────────────────
function updateInfoBar(tool) {
  const data = {};
  tool.fields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) return;
    data[f.key] = f.type === "number" ? (parseFloat(el.value) || 0) : el.value;
  });
  const bar = document.getElementById("info-bar");
  if (bar && tool.infoFn) bar.textContent = tool.infoFn(data);
}


// ── Submit ────────────────────────────────────────────────────
async function submitTool() {
  const tool = TOOLS[currentTool];
  if (!tool) return;

  const payload = {};
  tool.fields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) return;
    payload[f.key] = f.type === "number" ? (parseFloat(el.value) || 0) : el.value;
  });

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-dots"><span></span><span></span><span></span></span> Analysing...`;

  try {
    const resp = await fetch(`${API}${tool.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || "API error");

    closeToolModal();
    showResult(tool.title, data.advice);

  } catch (err) {
    showResult("❌ Error", `${err.message}\n\nMake sure the backend is running:\n\n  cd backend\n  python server.py`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = tool.btnText;
  }
}


// ── Show Result ───────────────────────────────────────────────
function showResult(title, text) {
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-body").innerHTML = renderMarkdown(text);
  document.getElementById("result-panel").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeResult() {
  document.getElementById("result-panel").classList.add("hidden");
  document.body.style.overflow = "";
}


// ── Markdown Renderer ─────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  const lines = text.split("\n");
  let html = "";
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (!tableRows.length) return;
    let th = "", tbody = "";
    tableRows.forEach((row, i) => {
      const cells = row.split("|").map(c => c.trim()).filter(Boolean);
      if (i === 0) {
        th = cells.map(c => `<th>${inlineFormat(c)}</th>`).join("");
      } else if (cells.every(c => /^[-:]+$/.test(c))) {
        // skip separator
      } else {
        tbody += "<tr>" + cells.map(c => `<td>${inlineFormat(c)}</td>`).join("") + "</tr>";
      }
    });
    html += `<table><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table>`;
    tableRows = []; inTable = false;
  }

  lines.forEach(line => {
    if ((line.includes("|") && line.trim().startsWith("|")) || inTable) {
      if (line.includes("|")) { inTable = true; tableRows.push(line); return; }
    }
    if (inTable) flushTable();

    const t = line.trim();
    if (!t) { html += "<br>"; return; }

    if (/^## /.test(t)) { html += `<h2>${inlineFormat(t.replace(/^## /, ""))}</h2>`; return; }
    if (/^### /.test(t)) { html += `<h3>${inlineFormat(t.replace(/^### /, ""))}</h3>`; return; }
    if (/^# /.test(t)) { html += `<h2>${inlineFormat(t.replace(/^# /, ""))}</h2>`; return; }
    if (/^[-*•] /.test(t)) { html += `<ul><li>${inlineFormat(t.replace(/^[-*•] /, ""))}</li></ul>`; return; }
    if (/^\d+\. /.test(t)) { html += `<ol><li>${inlineFormat(t.replace(/^\d+\. /, ""))}</li></ol>`; return; }
    if (/^> /.test(t)) { html += `<blockquote>${inlineFormat(t.replace(/^> /, ""))}</blockquote>`; return; }
    html += `<p>${inlineFormat(t)}</p>`;
  });

  if (inTable) flushTable();

  return html
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/<\/ol>\s*<ol>/g, "")
    .replace(/(<br>){3,}/g, "<br><br>");
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}


// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeToolModal(); closeResult(); }
});

// ── Custom Cursor & Scroll Progress ───────────────────────────
const cursor = document.getElementById("custom-cursor");
const scrollProgress = document.getElementById("scroll-progress");

document.addEventListener("mousemove", e => {
  if (cursor) {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  }
});

function attachCursorEvents() {
  document.querySelectorAll("button, .tool-card, input, select, textarea, .modal-close, .nav-item").forEach(el => {
    el.removeEventListener("mouseenter", handleCursorEnter);
    el.removeEventListener("mouseleave", handleCursorLeave);
    el.addEventListener("mouseenter", handleCursorEnter);
    el.addEventListener("mouseleave", handleCursorLeave);
  });
}

function handleCursorEnter() { cursor?.classList.add("hover"); }
function handleCursorLeave() { cursor?.classList.remove("hover"); }

document.addEventListener("DOMContentLoaded", attachCursorEvents);

// Listen for dynamic DOM updates (like tool modals opening) to attach cursor hover
const observer = new MutationObserver(attachCursorEvents);
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("scroll", () => {
  const scrollPx = document.documentElement.scrollTop;

  // Scroll Progress Bar
  if (scrollProgress) {
    const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;
    scrollProgress.style.width = scrolled + "%";
  }

  // Parallax Hero
  const heroInner = document.querySelector(".hero-inner");
  const moneyFloat = document.querySelector(".money-float");
  const heroStats = document.querySelector(".hero-stats");

  if (heroInner) heroInner.style.transform = `translateY(${scrollPx * 0.25}px)`;
  if (moneyFloat) moneyFloat.style.transform = `translateY(${scrollPx * 0.45}px)`;

  if (heroStats) {
    if (scrollPx > 300) {
      heroStats.classList.add("faded");
    } else {
      heroStats.classList.remove("faded");
    }
    heroStats.style.opacity = "";
  }
});

// ── Handle window resize for sidebar ──────────────────────────
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    // On desktop: ensure mobile-only classes are cleaned up
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
  } else {
    // On mobile: ensure desktop rail class is removed from main-content
    mainContent.classList.remove("rail");
  }
});
