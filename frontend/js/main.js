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

const showBtn = document.getElementById("sidebar-show-btn");

function toggleSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");
  } else {
    const isHidden = sidebar.classList.toggle("fully-hidden");
    // show/hide the floating restore button
    if (showBtn) showBtn.style.display = isHidden ? "flex" : "none";
    // expand/contract main content
    if (mainContent) mainContent.classList.toggle("expanded", isHidden);
    // remove collapsed state when restoring
    if (!isHidden) {
      sidebar.classList.remove("collapsed");
      mainContent && mainContent.classList.remove("rail");
    }
  }
}

function closeSidebarMobile() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
if (mobileToggle) mobileToggle.addEventListener("click", toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebarMobile);
if (showBtn) showBtn.addEventListener("click", toggleSidebar);



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
    const href = item.getAttribute("href");
    if (href && href !== "#" && !href.startsWith("javascript:")) {
      return; // Let the browser handle the link naturally
    }
    
    // Explicitly allow Reset button to trigger its inline onclick
    if (item.id === "btn-reset-data") return;

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

    // For "coming soon" or SPA pages
    const page = item.getAttribute("data-page");
    if (page) {
      if (page === "dashboard" || page === "advisor" || page === "transactions" || page === "market-insights") {
        showView(page);
      } else {
        showComingSoon(item.querySelector(".nav-label")?.textContent || page);
      }
    }
  });
});

// ── Integrated View Switcher ──────────────────────────────
function showView(viewName) {
  // Hide all views
  document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));

  // Show target view
  const target = document.getElementById(`${viewName}-view`);
  if (target) target.classList.remove("hidden");

  // Activate nav item
  const navItem = document.querySelector(`.nav-item[data-page="${viewName}"]`);
  if (navItem) navItem.classList.add("active");

  // Re-run UI refresh for dynamic views
  if (viewName === "dashboard" || viewName === "transactions" || viewName === "insights") {
    if (typeof Transactions !== 'undefined') Transactions.refreshUI();
  }

  // Initialize Data Ingestion
  if (viewName === "data-ingestion") {
    if (typeof DataIngestion !== 'undefined') {
        DataIngestion.init();
    }
  }

  // Initialize Market Insights
  if (viewName === "market-insights") {
    if (typeof MarketInsights !== 'undefined') {
        MarketInsights.init();
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Special logic for Advisor
  if (viewName === "advisor") {
    document.body.classList.add("active-advisor");
    initIntegratedParticles();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.body.classList.remove("active-advisor");
    stopIntegratedParticles();
  }
}

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
// ── Role Switcher Logic ────────────────────────────────────
function toggleRole() {
  if (typeof appState === 'undefined') return;
  const newRole = appState.activeRole === 'admin' ? 'viewer' : 'admin';
  appState.setRole(newRole);
  updateRoleUI(newRole);
}

function updateRoleUI(role) {
  const nav = document.getElementById("role-switcher-nav");
  if (!nav) return;

  const is_admin = role === 'admin';

  if (is_admin) {
    nav.classList.add("is-admin");
    document.querySelector(".viewer-label")?.classList.remove("active");
    document.querySelector(".admin-label")?.classList.add("active");
    document.getElementById("add-txn-btn")?.setAttribute("style", "display:flex;");
    document.getElementById("btn-reset-data")?.setAttribute("style", "display:flex; color: var(--accent-orange); opacity: 0.8;");
    document.getElementById("btn-export-main")?.setAttribute("style", "display:flex;");
  } else {
    nav.classList.remove("is-admin");
    document.querySelector(".viewer-label")?.classList.add("active");
    document.querySelector(".admin-label")?.classList.remove("active");
    document.getElementById("add-txn-btn")?.setAttribute("style", "display:none;");
    document.getElementById("btn-reset-data")?.setAttribute("style", "display:none;");
    document.getElementById("btn-export-main")?.setAttribute("style", "display:none;");
  }

  // Keep Transactions module in sync
  if (typeof Transactions !== 'undefined') {
    Transactions.updateRoleUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 ARIA Dashboard Ready. Current State:", appState);
  
  if (typeof appState !== 'undefined') {
    updateRoleUI(appState.activeRole);
  }
  
  if (typeof Transactions !== 'undefined') Transactions.init();

  document.querySelectorAll(".scroll-reveal").forEach(el => {
    revealObserver.observe(el);
  });
  
  // Custom navigation start logic
  const hash = window.location.hash.replace("#", "");
  if (hash === "advisor") showView("advisor");

  // Initialize Card Tilt
  initCardTilt();
});


// ── Integrated AI Advisor Logic ───────────────────────────────

let particleAnimationId = null;

function initIntegratedParticles() {
  const canvas = document.getElementById("integrated-particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 100;
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.color = `rgba(168, 85, 247, ${Math.random() * 0.5 + 0.2})`;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 * (1 - dist/100)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    particleAnimationId = requestAnimationFrame(animate);
  }
  animate();
}

function stopIntegratedParticles() {
  if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
}

// ── Integrated RAG Chat Logic ──────────────────────────────────
let activeDocs = [];

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  const chatArea = document.getElementById("chat-area");
  const loadingMsg = appendMessage("ai", '<span class="loading-dots"><span></span><span></span><span></span></span> Thinking...');

  try {
    const resp = await fetch("/api/advisor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await resp.json();
    loadingMsg.remove();
    appendMessage("ai", data.response);
  } catch (err) {
    loadingMsg.remove();
    appendMessage("ai", "⚠️ Sorry, I encountered an error connecting to the intelligence engine.");
  }
}

function appendMessage(role, content) {
  const area = document.getElementById("chat-area");
  const div = document.createElement("div");
  div.className = `message msg-${role}`;
  div.innerHTML = role === 'ai' ? renderMarkdown(content) : content;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  return div;
}

function handleKeyPress(e) {
  if (e.key === "Enter") sendMessage();
}

async function uploadDocument(e) {
  const file = e.target.files[0];
  if (!file) return;

  const area = document.getElementById("chat-area");
  const statusMsg = appendMessage("ai", `📤 Uploading <strong>${file.name}</strong>...`);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const resp = await fetch("/api/advisor/upload", {
      method: "POST",
      body: formData
    });
    const data = await resp.json();
    statusMsg.remove();
    appendMessage("ai", `✅ <strong>${file.name}</strong> indexed successfully! I've added its context to my knowledge base.`);
    
    // Add to doc chips
    const chipContainer = document.getElementById("active-docs");
    const chip = document.createElement("div");
    chip.className = "doc-chip";
    chip.innerHTML = `📄 ${file.name}`;
    chipContainer.appendChild(chip);
  } catch (err) {
    statusMsg.remove();
    appendMessage("ai", `❌ Failed to upload <strong>${file.name}</strong>.`);
  }
}

// ── Status Check removed per user request ──


// Wallet balance counter removed per Priority 2 (centralized in updateDashboard)



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
    
    // Header for form group (Label + organized Toolbar)
    let toolbarActions = "";
    if (f.type === "textarea" || f.key === "portfolio_text" || f.key === "goals") {
      toolbarActions += `
        <div class="voice-visualizer" id="wave-${f.key}">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="voice-status-text">Recording...</span>
        <button class="tool-btn voice-only-btn" onclick="startVoiceRecognition('field-${f.key}', event)" title="Voice Assistant">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
      `;
    }
    
    if (f.key === "portfolio_text") {
       toolbarActions += `
        <button class="tool-btn sync-btn" onclick="fetchLiveNAVs(event)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
          <span>Sync NAVs</span>
        </button>
       `;
    }

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

    return `<div class="form-group${spanClass}" id="group-${f.key}">
      <div class="form-group-header">
        <label for="field-${f.key}">${f.label}</label>
        <div class="field-toolbar">${toolbarActions}</div>
      </div>
      ${input}
    </div>`;
  }).join("");

  return `
    <div class="modal-header-main">
      <div class="modal-icon-box" style="--ic:${tool.color}; color:${tool.color}; stroke:${tool.color};">
        ${tool.iconHTML || tool.icon || ""}
      </div>
      <div>
        <h2 style="color:${tool.color}; margin:0;">${tool.title}</h2>
        <p class="subtitle" style="margin:0;">${tool.subtitle}</p>
      </div>
    </div>
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
  
  // Custom: Inject transactions for Expense Analyzer
  if (currentTool === 'expense' && typeof appState !== 'undefined') {
    payload.transactions = appState.transactions;
  }

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

    // After rendering markdown, initialize charts and scores
    setTimeout(() => {
      initCharts();
      initScores();
    }, 100);

  } catch (err) {
    showResult("❌ Error", `${err.message}\n\nMake sure the backend is running:\n\n  cd backend\n  python server.py`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = tool.btnText;
  }
}


// ── Show Result ───────────────────────────────────────────────
function showResult(title, text) {
  const resultBody = document.getElementById("result-body");
  document.getElementById("result-title").textContent = title;
  resultBody.innerHTML = renderMarkdown(text);
  document.getElementById("result-panel").classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Trigger KaTeX rendering for math formulas
  if (window.renderMathInElement) {
    window.renderMathInElement(resultBody, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }
}

function closeResult() {
  document.getElementById("result-panel").classList.add("hidden");
  document.body.style.overflow = "";
}


// ── Markdown Renderer ─────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";

  // Handle block math \[ ... \] separately to avoid <p> wrapping line by line
  let processedText = text;
  const mathBlocks = [];
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
    const placeholder = `__MATH_BLOCK_${mathBlocks.length}__`;
    mathBlocks.push(match);
    return "\n" + placeholder + "\n";
  });

  // Extract Chart JSON blocks: ```chart-json ... ``` OR `chart-json ... `
  const chartBlocks = [];
  processedText = processedText.replace(/(?:```|`)chart-json([\s\S]*?)(?:```|`)/g, (match, content) => {
    const placeholder = `__CHART_BLOCK_${chartBlocks.length}__`;
    chartBlocks.push(content.trim());
    return "\n" + placeholder + "\n";
  });

  const lines = processedText.split("\n");
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
    const t = line.trim();
    if (!t) {
      if (inTable) flushTable();
      html += "<br>";
      return;
    }

    if ((line.includes("|") && line.trim().startsWith("|")) || inTable) {
      if (line.includes("|")) { inTable = true; tableRows.push(line); return; }
    }
    if (inTable) flushTable();

    if (t.startsWith("__MATH_BLOCK_") && t.endsWith("__")) {
      const index = parseInt(t.replace("__MATH_BLOCK_", "").replace("__", ""));
      html += `<div class="math-block">${mathBlocks[index]}</div>`;
      return;
    }

    if (t.startsWith("__CHART_BLOCK_") && t.endsWith("__")) {
      const index = parseInt(t.replace("__CHART_BLOCK_", "").replace("__", ""));
      html += `<div class="chart-container"><canvas id="chart-canvas-${index}" data-chart='${chartBlocks[index]}'></canvas></div>`;
      return;
    }

    // Handle Score Visualization: [X]/100 or X/100 or [X]/10 or X/10
    // Matches: [85]/100, 85/100, Score: 85/100, etc.
    const scoreMatch = t.match(/(?:\[?\b(\d+)\b\]?)\/(100|10)/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      const max = parseInt(scoreMatch[2]);
      const percent = max === 10 ? score * 10 : score;
      const colorClass = percent >= 80 ? 'score-good' : (percent >= 50 ? 'score-average' : 'score-poor');
      const label = t.replace(scoreMatch[0], "").replace(/[:#]/g, "").trim();

      html += `
        <div class="score-card-visual">
          <div class="score-label-sub">${label || 'Score'}</div>
          <div class="score-value-big ${colorClass}">${score}<small style="font-size:0.4em; color:var(--text-muted)">/${max}</small></div>
          <div class="score-bar-container">
            <div class="score-bar-fill" data-percent="${percent}"></div>
          </div>
        </div>
      `;
      return;
    }

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

// ── Visualization Helpers ─────────────────────────────────────
function initCharts() {
  document.querySelectorAll('canvas[id^="chart-canvas-"]').forEach(canvas => {
    try {
      const rawData = canvas.getAttribute('data-chart');
      const config = JSON.parse(rawData);

      const labels = Object.keys(config.data);
      const values = Object.values(config.data);
      const type = config.type || 'pie';
      const colors = [
        '#a855f7', '#7c3aed', '#00CEC9', '#00B894', '#FDCB6E', '#E84393', '#FF6B35'
      ];

      new Chart(canvas, {
        type: type,
        data: {
          labels: labels,
          datasets: [{
            label: config.label || '',
            data: values,
            backgroundColor: type === 'line' ? 'rgba(168, 85, 247, 0.1)' : colors.slice(0, labels.length),
            borderColor: type === 'line' ? '#a855f7' : 'rgba(255,255,255,0.1)',
            borderWidth: type === 'line' ? 3 : 1,
            fill: type === 'line',
            tension: type === 'line' ? 0.4 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: type !== 'line',
              position: 'bottom',
              labels: { color: '#F0EDE8', font: { family: 'DM Sans', size: 11 } }
            },
            title: {
              display: !!config.label,
              text: config.label,
              color: '#F0EDE8',
              font: { family: 'Playfair Display', size: 16, weight: 'bold' }
            }
          },
          scales: type === 'line' || type === 'bar' ? {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
            }
          } : {}
        }
      });
    } catch (e) {
      console.error("Chart Init Error:", e, canvas.getAttribute('data-chart'));
    }
  });
}

function initScores() {
  document.querySelectorAll('.score-bar-fill').forEach(bar => {
    const percent = bar.getAttribute('data-percent');
    setTimeout(() => {
      bar.style.width = percent + '%';
    }, 100);
  });
}

// ── Roadmap Feature: Voice Input ──────────────────────────────
function startVoiceRecognition(targetId, event) {
  event.preventDefault();
  const btn = event.currentTarget;
  const fieldKey = targetId.replace('field-', '');
  const root = document.getElementById(`group-${fieldKey}`);
  const wave = document.getElementById(`wave-${fieldKey}`);
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("Voice recognition is not supported in this browser. Please try Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    root?.classList.add('is-recording');
    wave?.classList.add('active');
  };

  recognition.onerror = () => {
    root?.classList.remove('is-recording');
    wave?.classList.remove('active');
  };

  recognition.onend = () => {
    root?.classList.remove('is-recording');
    wave?.classList.remove('active');
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById(targetId);
    if (input) {
      input.value = (input.value ? input.value + " " : "") + transcript;
      input.dispatchEvent(new Event('input'));
    }
  };

  recognition.start();
}

// ── Roadmap Feature: PDF Export ───────────────────────────────
async function downloadReportPDF() {
  const btn = document.getElementById('pdf-btn');
  const resultPanel = document.querySelector('.result-inner');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-dots"><span></span><span></span><span></span></span>`;

  try {
    const { jsPDF } = window.jspdf;
    
    // Capture the result body (including charts) as a high-quality image
    const canvas = await html2canvas(document.getElementById('result-body'), {
      scale: 2,
      useCORS: true,
      backgroundColor: '#100e1c'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Header for PDF
    pdf.setFillColor(16, 14, 28);
    pdf.rect(0, 0, pdfWidth, 20, 'F');
    pdf.setTextColor(168, 85, 247);
    pdf.setFontSize(14);
    pdf.text("ARIA AI ADVISOR REPORT", 10, 13);
    
    // Add the content image
    pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, imgHeight);
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated by ARIA AI - For educational purposes only.", 10, pdfHeight - 10);

    pdf.save(`ARIA_Report_${Date.now()}.pdf`);

  } catch (err) {
    console.error("PDF Export Error:", err);
    alert("Could not generate PDF: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ── Roadmap Feature: Live MF NAV Fetch (mfapi.in) ─────────────
async function fetchLiveNAVs(event) {
  event.preventDefault();
  const textarea = document.getElementById('field-portfolio_text');
  if (!textarea || !textarea.value.trim()) {
    alert("Please enter fund names first (e.g. Parag Parikh Flexi Cap)");
    return;
  }

  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Fetching...";

  const lines = textarea.value.split("\n");
  const newLines = [];

  for (let line of lines) {
    const fundName = line.split(/[—\-:]/)[0].trim();
    if (!fundName) { newLines.push(line); continue; }

    try {
      // 1. Search for fund
      const searchResp = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(fundName)}`);
      const results = await searchResp.json();
      
      if (results && results.length > 0) {
        const schemeCode = results[0].schemeCode;
        // 2. Fetch latest NAV
        const navResp = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
        const navData = await navResp.json();
        
        if (navData && navData.data && navData.data.length > 0) {
          const latest = navData.data[0].nav;
          const fullName = navData.meta.scheme_name;
          newLines.push(`${fullName} — (NAV: ₹${latest})`);
          continue;
        }
      }
      newLines.push(line); // fallback
    } catch (e) {
      console.error("NAV Fetch error for:", fundName, e);
      newLines.push(line);
    }
  }

  textarea.value = newLines.join("\n");
  textarea.dispatchEvent(new Event('input'));
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ── Roadmap Feature: Live Market Mood Meter ──────────────────
async function updateMarketTicker() {
  const ticker = document.getElementById('market-ticker');
  if (!ticker) return;

  try {
    const resp = await fetch('/api/market-mood');
    const data = await resp.json();
    
    const moodClass = data.mood.toLowerCase().includes('greed') || data.mood.toLowerCase().includes('optimistic') ? 'mood-greed' : 
                      (data.mood.toLowerCase().includes('fear') ? 'mood-fear' : 'mood-neutral');

    // Create the indices HTML
    const indicesHTML = data.indices.map(idx => {
      const trendClass = idx.trend === 'up' ? 'trend-up' : (idx.trend === 'down' ? 'trend-down' : '');
      const trendIcon = idx.trend === 'up' ? '▲' : (idx.trend === 'down' ? '▼' : '');
      return `
        <div class="ticker-item">
          <span class="ticker-label">${idx.name}</span>
          <span class="ticker-value">${idx.price}</span>
          <span class="ticker-value ${trendClass}" style="font-weight:300;">${trendIcon} ${idx.change} (${idx.percent})</span>
        </div>
      `;
    }).join("");

    // Mood Item
    const moodHTML = `
      <div class="ticker-item" style="margin-left: 15px;">
        <span class="ticker-label">Mood</span>
        <span class="ticker-mood-tag ${moodClass}" style="font-weight:900;">${data.mood}</span>
      </div>
    `;

    // To make a seamless loop, we repeat the content once
    const combinedContent = `${indicesHTML} ${moodHTML}`;
    
    ticker.innerHTML = `
      <div class="ticker-content" id="ticker-track">
        ${combinedContent} ${combinedContent}
      </div>
      <button class="ticker-refresh-btn" onclick="updateMarketTicker()" title="Refresh Market Data" style="position: absolute; right: 10px; z-index: 20; background: rgba(10,8,20,0.8); backdrop-filter: blur(5px);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
      </button>
    `;

    // Adjust animation speed based on content length
    const track = document.getElementById('ticker-track');
    if (track) {
        const textLength = track.innerText.length;
        const duration = Math.max(20, textLength / 5); // Responsive speed
        track.style.animationDuration = `${duration}s`;
    }

  } catch (err) {
    console.error("Ticker fetch error:", err);
  }
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

// ── Smooth Scroll (Lenis) ──────────────────────────────────
let lenis = null;
function initSmoothScroll() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Connect Lenis to ScrollTrigger
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Sync Hero Parallax and Progress Bar with Lenis
    lenis.on('scroll', (e) => {
      updateHeroScroll(e.scroll);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  init3DBackground();      // ← New bloom-style background
  attachCursorEvents();
  updateMarketTicker();
  initScrollReveal();
  initCardTilt();
  if (typeof Transactions !== 'undefined') Transactions.init();
  setInterval(updateMarketTicker, 300000);
});

// ── Optimized GSAP Hero Parallax ─────────────────────────────
function updateHeroScroll(scrollPx) {
  const dashboard = document.getElementById('dashboard-view');
  if (dashboard && !dashboard.classList.contains('hidden')) {
    const hero = dashboard.querySelector(".hero-inner");
    if (hero) {
      const speed = 0.2;
      hero.style.transform = `perspective(1000px) translate3d(0, ${scrollPx * speed}px, ${-scrollPx * 0.1}px) rotateX(${scrollPx * 0.005}deg)`;
    }
  }

  // Scroll Progress Bar
  const scrollProgress = document.getElementById("scroll-progress");
  if (scrollProgress) {
    const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;
    scrollProgress.style.width = scrolled + "%";
  }
}

// Unified Scroll Handler (Fallback for non-Lenis)
if (!lenis) {
  window.addEventListener("scroll", () => {
    const scrollPx = window.scrollY;
    updateHeroScroll(scrollPx);
  });
}

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

// ── Interactive Card Tilt ────────────────────────────────────
function initCardTilt() {
  const cards = document.querySelectorAll(".tool-card");
  
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 degrees
      const rotateY = ((x - centerX) / centerX) * 10;  // Max 10 degrees
      
      requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    });
    
    card.addEventListener("mouseleave", () => {
      requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  });
}
// ── 3D Scroll Trigger Actions ────────────────────────────────
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Optional: stop observing once revealed
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  hero.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate tilt (more subtle for landing page feel)
    const moveX = (clientX - centerX) / centerX;
    const moveY = (clientY - centerY) / centerY;
    
    const elements = hero.querySelectorAll(".wallet-card, .hero-title, .hero-badge");
    elements.forEach((el, i) => {
      const depth = (i + 1) * 15;
      el.style.transform = `perspective(1000px) translate3d(${moveX * depth}px, ${moveY * depth}px, 0) rotateY(${moveX * 5}deg) rotateX(${-moveY * 5}deg)`;
    });
  });

  hero.addEventListener("mouseleave", () => {
    const elements = hero.querySelectorAll(".wallet-card, .hero-title, .hero-badge");
    elements.forEach(el => {
      el.style.transform = `translate3d(0, 0, 0) rotateY(0) rotateX(0)`;
    });
  });
}

// ── 3D Background (Bloom-style, ARIA Purple Theme) ────────────
function init3DBackground() {
  const canvas = document.querySelector('#bg-wave');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.set(0, 30, 100);

  // ── GRID (animated wave plane) ────────────────────────────
  const gridGeo = new THREE.PlaneGeometry(300, 300, 80, 80);
  const gridMat = new THREE.MeshPhongMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.13
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI / 2;
  scene.add(grid);

  // ── CANDLESTICKS (financial chart aesthetic) ───────────────
  const sticksGroup = new THREE.Group();
  const sticks = [];
  for (let i = 0; i < 150; i++) {
    const h = Math.random() * 20 + 2;
    const stickGeo = new THREE.BoxGeometry(0.4, h, 0.4);
    const stickMat = new THREE.MeshPhongMaterial({
      color: Math.random() > 0.35 ? 0xa855f7 : 0x7c3aed,
      transparent: true,
      opacity: 0.25
    });
    const mesh = new THREE.Mesh(stickGeo, stickMat);
    mesh.position.set(
      (Math.random() - 0.5) * 250,
      h / 2,
      (Math.random() - 0.5) * 250
    );
    sticks.push({ mesh });
    sticksGroup.add(mesh);
  }
  scene.add(sticksGroup);

  // ── PARTICLES ─────────────────────────────────────────────
  const partsGeo = new THREE.BufferGeometry();
  const partsCount = 1000;
  const posArray = new Float32Array(partsCount * 3);
  for (let i = 0; i < partsCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 400;
  }
  partsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const partsMat = new THREE.PointsMaterial({
    size: 0.6,
    color: 0xa855f7,
    transparent: true,
    opacity: 0.49
  });
  const particles = new THREE.Points(partsGeo, partsMat);
  scene.add(particles);

  // ── LIGHTING ──────────────────────────────────────────────
  const light = new THREE.PointLight(0xa855f7, 4.2, 200);
  light.position.set(0, 50, 20);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.14));

  // ── SCROLL ANIMATION (GSAP + ScrollTrigger) ───────────────
  gsap.registerPlugin(ScrollTrigger);

  // ScrollTrigger sync already handled in initSmoothScroll

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2
    }
  });

  tl.to(camera.position,  { z: 40, y: 10, x: -15 }, 0)
    .to(camera,           { fov: 110, onUpdate: () => camera.updateProjectionMatrix() }, 0)
    .to(grid.rotation,    { z: Math.PI / 2 }, 0.2)
    .to(sticksGroup.position, { y: -30 }, 0.3)
    .to(particles.position,   { z: 200 }, 0.5)
    .to(camera.position,  { z: -100, y: 5 }, 0.7)
    .to(gridMat,          { opacity: 0.37 }, 0.8);

  // ── RENDER LOOP ───────────────────────────────────────────
  function update() {
    const time = Date.now() * 0.0003;
    const pos = grid.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = Math.sin(pos[i] * 0.05 + time * 10) * 3
                 + Math.cos(pos[i + 1] * 0.05 + time * 10) * 3;
    }
    grid.geometry.attributes.position.needsUpdate = true;
    sticks.forEach((s, i) => {
      s.mesh.scale.y = 1 + Math.sin(time * 15 + i) * 0.5;
    });
    particles.rotation.y += 0.001;
  }

  (function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ── Global Drag & Drop CSV Import ────────────────────────────
function initGlobalDragDrop() {
  const overlay = document.getElementById('drop-overlay');
  
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (document.getElementById('transactions-view').classList.contains('hidden') && 
        document.getElementById('dashboard-view').classList.contains('hidden')) return;
        
    overlay?.classList.remove('hidden');
  });

  window.addEventListener('dragleave', (e) => {
    if (e.clientX === 0 && e.clientY === 0) { // Check if we left the window
      overlay?.classList.add('hidden');
    }
  });

  overlay?.addEventListener('dragleave', (e) => {
      overlay?.classList.add('hidden');
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    overlay?.classList.add('hidden');
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        // Use Transactions module to parse
        if (typeof Transactions !== 'undefined') {
          const fakeEvent = { target: { files: [file] } };
          Transactions.importCSV(fakeEvent);
        }
      } else {
        alert("⚠️ ARIA only supports batch imports from CSV files.");
      }
    }
  });
}

// Call inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    initGlobalDragDrop();
});

