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

    let indicesHTML = data.indices.map(idx => {
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

    ticker.innerHTML = `
      ${indicesHTML}
      <div class="ticker-item" style="margin-left: 15px;">
        <span class="ticker-label">Mood</span>
        <span class="ticker-mood-tag ${moodClass}" style="font-weight:900;">${data.mood}</span>
      </div>
      <button class="ticker-refresh-btn" onclick="updateMarketTicker()" title="Refresh Market Data">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
      </button>
    `;
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

document.addEventListener("DOMContentLoaded", () => {
  attachCursorEvents();
  updateMarketTicker();
  setInterval(updateMarketTicker, 300000); // Update every 5 minutes
});

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
