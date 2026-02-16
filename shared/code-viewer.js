(function () {
  // Resolve base path of this script (or allow override)
  const currentScript = document.currentScript;
  const scriptSrc = currentScript && currentScript.src;
  const basePath = scriptSrc
    ? scriptSrc.substring(0, scriptSrc.lastIndexOf("/") + 1)
    : "/shared/";

  // Load the code-viewer CSS
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = basePath + "code-viewer.css";
  document.head.appendChild(css);

  const extToLang = {
    js: "javascript",
    css: "css",
    html: "markup",
    vert: "glsl",
    frag: "glsl",
  };

  // Load Prism.js from CDN
  function loadPrism() {
    return new Promise((resolve) => {
      if (window.Prism) return resolve();

      const theme = document.createElement("link");
      theme.rel = "stylesheet";
      theme.href =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css";
      document.head.appendChild(theme);

      const core = document.createElement("script");
      core.src =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js";
      core.onload = () => {
        const clike = document.createElement("script");
        clike.src =
          "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-c.min.js";
        clike.onload = () => {
          const glsl = document.createElement("script");
          glsl.src =
            "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-glsl.min.js";
          glsl.onload = resolve;
          document.head.appendChild(glsl);
        };
        document.head.appendChild(clike);
      };
      document.head.appendChild(core);
    });
  }

  function getLang(filename) {
    const ext = filename.split(".").pop();
    return extToLang[ext] || "plain";
  }

  function init(files, sourceBase) {
    if (!files || !files.length) return;

    // sourceBase: absolute path to fetch source files from (e.g. "/solar-system/")
    // If not provided, files are fetched relative to the current page.
    if (sourceBase && !sourceBase.endsWith("/")) sourceBase += "/";

    const cache = {};

    async function fetchFile(filename) {
      if (cache[filename]) return cache[filename];
      const url = sourceBase ? sourceBase + filename : filename;
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(resp.status);
        cache[filename] = await resp.text();
      } catch {
        cache[filename] = `// Could not load ${filename}`;
      }
      return cache[filename];
    }

    // Build DOM (hidden until first open to avoid flash before CSS loads)
    const backdrop = document.createElement("div");
    backdrop.className = "cv-backdrop";
    backdrop.hidden = true;
    document.body.appendChild(backdrop);

    const panel = document.createElement("div");
    panel.className = "cv-panel cv-ready";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="cv-header">
        <div class="cv-tabs"></div>
        <button class="cv-close">&times;</button>
      </div>
      <div class="cv-code"><pre><code></code></pre></div>
    `;
    document.body.appendChild(panel);

    const tabsEl = panel.querySelector(".cv-tabs");
    const codeEl = panel.querySelector(".cv-code code");
    const closeBtn = panel.querySelector(".cv-close");

    // Create tabs
    files.forEach((file, i) => {
      const btn = document.createElement("button");
      btn.className = "cv-tab" + (i === 0 ? " active" : "");
      btn.textContent = file.split("/").pop();
      btn.title = file;
      btn.addEventListener("click", () => showFile(file, btn));
      tabsEl.appendChild(btn);
    });

    async function showFile(filename, tabBtn) {
      tabsEl.querySelectorAll(".cv-tab").forEach((t) => t.classList.remove("active"));
      tabBtn.classList.add("active");

      codeEl.textContent = "Loading...";
      codeEl.className = "";

      await loadPrism();
      const content = await fetchFile(filename);
      const lang = getLang(filename);
      const grammar = Prism.languages[lang];

      if (grammar) {
        codeEl.innerHTML = Prism.highlight(content, grammar, lang);
      } else {
        codeEl.textContent = content;
      }
      codeEl.className = "language-" + lang;
    }

    // Toggle button
    const toggle = document.createElement("button");
    toggle.className = "cv-toggle";
    toggle.textContent = "{ } Source";
    document.body.appendChild(toggle);

    function open() {
      panel.hidden = false;
      backdrop.hidden = false;
      // Force a reflow so the transition plays from the closed state
      panel.offsetHeight;
      panel.classList.add("open");
      backdrop.classList.add("open");
      const firstTab = tabsEl.querySelector(".cv-tab");
      if (firstTab && !cache[files[0]]) showFile(files[0], firstTab);
    }

    function close() {
      panel.classList.remove("open");
      backdrop.classList.remove("open");
    }

    toggle.addEventListener("click", () => {
      panel.classList.contains("open") ? close() : open();
    });
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    // Prevent all events from reaching the canvas
    const blocked = [
      "pointerdown", "pointermove", "pointerup",
      "mousedown", "mousemove", "mouseup", "click", "dblclick",
      "wheel", "touchstart", "touchmove", "touchend", "contextmenu",
    ];
    for (const el of [panel, backdrop]) {
      for (const evt of blocked) {
        el.addEventListener(evt, (e) => e.stopPropagation(), { passive: false });
      }
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // Expose globally for bundled sketches
  window.initCodeViewer = init;

  // Auto-init from data-files attribute for plain HTML sketches
  if (currentScript && currentScript.getAttribute("data-files")) {
    const files = currentScript.getAttribute("data-files").split(",").map((f) => f.trim());
    init(files);
  }
})();
