// studio.js - Pick Me Studio Application Controller
// Orchestrates state, workspace events, and /api/* network calls using StudioParser & StudioEditor
(function () {
const ParserMod =
  typeof window !== "undefined" && window.StudioParser
    ? window.StudioParser
    : typeof require !== "undefined"
      ? require("./parser.js")
      : {};

const EditorMod =
  typeof window !== "undefined" && window.StudioEditor
    ? window.StudioEditor
    : typeof require !== "undefined"
      ? require("./editor.js")
      : {};

const {
  detectDocType,
  parseResume,
  serializeResume,
  parseCoverLetter,
  serializeCoverLetter
} = ParserMod;

const { renderResumeForm, renderCoverLetterForm, renderGenericForm } = EditorMod;

// Application State
const state = {
  path: "",
  filename: "document.typ",
  pdfPath: "",
  pdfUrl: "",
  rawTypst: "",
  mode: "form",
  parsed: null,
  dirty: false
};

// DOM Elements
const hasDoc = typeof document !== "undefined";
const elFileSelect = hasDoc ? document.getElementById("file-select") : null;
const elBtnUpload = hasDoc ? document.getElementById("btn-upload") : null;
const elFileUpload = hasDoc ? document.getElementById("file-upload") : null;
const elModeForm = hasDoc ? document.getElementById("mode-form") : null;
const elModeRaw = hasDoc ? document.getElementById("mode-raw") : null;
const elModePreview = hasDoc ? document.getElementById("mode-preview") : null;
const elStatusPill = hasDoc ? document.getElementById("status-pill") : null;
const elStatusText = hasDoc ? document.getElementById("status-text") : null;
const elExportMenu = hasDoc ? document.getElementById("export-menu") : null;
const elBtnExportToggle = hasDoc ? document.getElementById("btn-export-toggle") : null;
const elBtnDownloadPdf = hasDoc ? document.getElementById("btn-download-pdf") : null;
const elBtnDownloadTyp = hasDoc ? document.getElementById("btn-download-typ") : null;
const elBtnSave = hasDoc ? document.getElementById("btn-save") : null;
const elEditorContainer = hasDoc ? document.getElementById("editor-container") : null;
const elVisualContainer = hasDoc ? document.getElementById("visual-container") : null;
const elRawTextarea = hasDoc ? document.getElementById("raw-textarea") : null;
const elErrorBanner = hasDoc ? document.getElementById("error-banner") : null;
const elBtnTheme = hasDoc ? document.getElementById("btn-theme") : null;
const elPdfFrame = hasDoc ? document.getElementById("pdf-frame") : null;
const elMainWorkspace = hasDoc ? document.getElementById("main-workspace") : null;
const elResizer = hasDoc ? document.getElementById("panel-resizer") : null;

function setDirty(isDirty, msg = "") {
  state.dirty = isDirty;
  if (!elStatusPill || !elStatusText) return;
  if (isDirty) {
    elStatusPill.className = "status dirty";
    elStatusText.textContent = msg || "Unsaved changes";
  } else {
    elStatusPill.className = "status";
    elStatusText.textContent = msg || "All changes saved";
  }
}

function setError(msg) {
  if (!elErrorBanner) return;
  if (!msg) {
    elErrorBanner.style.display = "none";
    elErrorBanner.textContent = "";
  } else {
    elErrorBanner.style.display = "block";
    elErrorBanner.textContent = msg;
    if (elStatusPill && elStatusText) {
      elStatusPill.className = "status err";
      elStatusText.textContent = "Compile error";
    }
  }
}

// =========================================================================
// State Synchronization & Visual Form Dispatch
// =========================================================================
function syncVisualToRaw() {
  if (!state.parsed) return;
  if (state.parsed.kind === "resume") {
    state.rawTypst = serializeResume(state.parsed);
  } else if (state.parsed.kind === "cover-letter") {
    state.rawTypst = serializeCoverLetter(state.parsed);
  } else {
    state.rawTypst = state.parsed.raw;
  }
  if (elRawTextarea) elRawTextarea.value = state.rawTypst;
  setDirty(true);
}

function renderVisualEditor() {
  if (!elVisualContainer) return;
  const callbacks = {
    onSync: syncVisualToRaw,
    onReRender: renderVisualEditor
  };

  try {
    elVisualContainer.innerHTML = "";
    const docType = detectDocType(state.rawTypst, state.filename);

    if (docType === "resume") {
      state.parsed = parseResume(state.rawTypst);
      if (state.parsed.kind === "generic") {
        renderGenericForm(elVisualContainer, state.parsed, callbacks);
      } else {
        renderResumeForm(elVisualContainer, state.parsed, callbacks);
      }
    } else if (docType === "cover-letter") {
      state.parsed = parseCoverLetter(state.rawTypst);
      if (state.parsed.kind === "generic") {
        renderGenericForm(elVisualContainer, state.parsed, callbacks);
      } else {
        renderCoverLetterForm(elVisualContainer, state.parsed, callbacks);
      }
    } else {
      state.parsed = { kind: "generic", raw: state.rawTypst };
      renderGenericForm(elVisualContainer, state.parsed, callbacks);
    }
  } catch (err) {
    console.warn("Structured render failed, falling back to generic view:", err);
    state.parsed = { kind: "generic", raw: state.rawTypst };
    renderGenericForm(elVisualContainer, state.parsed, callbacks);
  }
}

// =========================================================================
// Mode Switch, Workspace Resizer & UI Event Handlers
// =========================================================================
function setMode(mode) {
  state.mode = mode;
  const isRaw = mode === "raw";
  const isPreview = mode === "preview";

  elEditorContainer.classList.toggle("raw-mode", isRaw);
  if (elMainWorkspace) {
    elMainWorkspace.classList.toggle("preview-only", isPreview);
    elMainWorkspace.classList.toggle("editor-only", !isPreview);
  }

  elModeForm.setAttribute("aria-pressed", mode === "form");
  elModeRaw.setAttribute("aria-pressed", isRaw);
  if (elModePreview) {
    elModePreview.setAttribute("aria-pressed", isPreview);
  }

  if (isRaw) {
    syncVisualToRaw();
    elRawTextarea.value = state.rawTypst;
  } else if (mode === "form") {
    state.rawTypst = elRawTextarea.value;
    renderVisualEditor();
  }
}

if (hasDoc) {
  elModeForm.addEventListener("click", () => setMode("form"));
  elModeRaw.addEventListener("click", () => setMode("raw"));
  if (elModePreview) {
    elModePreview.addEventListener("click", () => setMode("preview"));
  }
  elRawTextarea.addEventListener("input", () => {
    state.rawTypst = elRawTextarea.value;
    setDirty(true);
  });

  // Panel Resizer
  let isDraggingResizer = false;

  function setEditorWidth(newWidth) {
    const minWidth = 300;
    const maxWidth = window.innerWidth - 300;
    const clamped = Math.max(minWidth, Math.min(maxWidth, newWidth));
    document.documentElement.style.setProperty("--editor-width", `${clamped}px`);
    try {
      localStorage.setItem("pickme_studio_editor_width", clamped.toString());
    } catch (e) {}
  }

  try {
    const savedWidth = localStorage.getItem("pickme_studio_editor_width");
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth)) setEditorWidth(parsedWidth);
    }
  } catch (e) {}

  if (elResizer) {
    elResizer.addEventListener("pointerdown", e => {
      isDraggingResizer = true;
      elResizer.setPointerCapture(e.pointerId);
      elResizer.classList.add("dragging");
      document.body.classList.add("is-resizing");
    });

    elResizer.addEventListener("pointermove", e => {
      if (!isDraggingResizer) return;
      const mainRect = elMainWorkspace ? elMainWorkspace.getBoundingClientRect() : { left: 0 };
      setEditorWidth(e.clientX - mainRect.left);
    });

    const stopDragging = e => {
      if (!isDraggingResizer) return;
      isDraggingResizer = false;
      try {
        elResizer.releasePointerCapture(e.pointerId);
      } catch (err) {}
      elResizer.classList.remove("dragging");
      document.body.classList.remove("is-resizing");
    };

    elResizer.addEventListener("pointerup", stopDragging);
    elResizer.addEventListener("pointercancel", stopDragging);

    elResizer.addEventListener("keydown", e => {
      const currentWidth = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--editor-width") || "480",
        10
      );
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setEditorWidth(currentWidth - 20);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setEditorWidth(currentWidth + 20);
      }
    });
  }

  // Export Dropdown & Theme Toggle
  elBtnExportToggle.addEventListener("click", e => {
    e.stopPropagation();
    const open = elExportMenu.classList.toggle("open");
    elBtnExportToggle.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", () => {
    elExportMenu.classList.remove("open");
    elBtnExportToggle.setAttribute("aria-expanded", "false");
  });

  elBtnTheme.addEventListener("click", () => {
    const root = document.documentElement;
    const isDark =
      getComputedStyle(root).getPropertyValue("--bg").trim().toLowerCase() === "#000000" ||
      root.getAttribute("data-theme") === "dark";
    root.setAttribute("data-theme", isDark ? "light" : "dark");
  });

  // Downloads
  elBtnDownloadTyp.addEventListener("click", () => {
    const blob = new Blob([state.rawTypst], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = state.filename || "document.typ";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  elBtnDownloadPdf.addEventListener("click", () => {
    if (state.pdfPath) {
      window.location.href = `/api/pdf?path=${encodeURIComponent(state.pdfPath)}&download=1`;
    } else {
      saveAndCompile(true);
    }
  });

  // File Upload & Drag-and-Drop
  function handleUploadedTypFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const content = evt.target.result;
        if (typeof content !== "string") return;

        state.path = "";
        state.filename = file.name;
        state.rawTypst = content;
        elRawTextarea.value = content;

        let uploadedOpt = elFileSelect.querySelector('option[data-uploaded="true"]');
        if (!uploadedOpt) {
          uploadedOpt = document.createElement("option");
          uploadedOpt.setAttribute("data-uploaded", "true");
          elFileSelect.insertBefore(uploadedOpt, elFileSelect.firstChild);
        }
        uploadedOpt.value = "uploaded:" + file.name;
        uploadedOpt.textContent = "[Uploaded] " + file.name;
        elFileSelect.value = uploadedOpt.value;

        try {
          renderVisualEditor();
          setMode("form");
        } catch (renderErr) {
          console.warn("Visual parsing failed, defaulting to raw Typst view:", renderErr);
          setMode("raw");
        }

        setDirty(true, "Uploaded " + file.name);
        saveAndCompile();
      } catch (err) {
        setError("Error processing file: " + err.message);
      }
    };

    reader.onerror = () => setError("Failed to read local file.");
    reader.onloadend = () => {
      if (elFileUpload) elFileUpload.value = "";
    };
    reader.readAsText(file, "UTF-8");
  }

  if (elBtnUpload) {
    elBtnUpload.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (elFileUpload) elFileUpload.click();
      }
    });
  }

  if (elFileUpload) {
    elFileUpload.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) handleUploadedTypFile(file);
    });
  }

  window.addEventListener("dragover", e => {
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".typ") || file.name.endsWith(".txt")) {
        handleUploadedTypFile(file);
      }
    }
  });

  elFileSelect.addEventListener("change", () => {
    const chosen = elFileSelect.value;
    if (chosen) loadFile(chosen);
  });

  // =========================================================================
  // API Integration: Load, Files, Compile
  // =========================================================================
  async function loadFileList() {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (!data.ok) return;

      elFileSelect.innerHTML = "";
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "-- Select an application file --";
      elFileSelect.appendChild(defaultOpt);

      (data.files || []).forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.path;
        opt.textContent = f.label || f.name;
        elFileSelect.appendChild(opt);
      });

      if (data.initialFile) {
        elFileSelect.value = data.initialFile;
        loadFile(data.initialFile);
      } else if (data.files && data.files.length > 0) {
        elFileSelect.value = data.files[0].path;
        loadFile(data.files[0].path);
      }
    } catch (e) {
      console.warn("Could not load /api/files:", e);
    }
  }

  async function loadFile(filePath) {
    try {
      setDirty(false, "Loading...");
      const res = await fetch(`/api/load?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "File load failed");
        return;
      }

      setError("");
      state.path = data.path;
      state.filename = data.filename;
      state.rawTypst = data.content;
      state.pdfPath = data.pdfPath;
      state.pdfUrl = data.pdfUrl;
      if (elPdfFrame) elPdfFrame.src = data.pdfUrl;
      if (elRawTextarea) elRawTextarea.value = data.content;

      renderVisualEditor();
      const loadPageLabel = data.pageCount > 0 ? ` (${data.pageCount} ${data.pageCount === 1 ? "page" : "pages"})` : "";
      setDirty(false, `All changes saved${loadPageLabel}`);
    } catch (e) {
      setError("Network error while loading file: " + e.message);
    }
  }

  async function saveAndCompile(triggerDownloadAfter = false) {
    try {
      setDirty(true, "Compiling...");
      elBtnSave.disabled = true;

      const payload = {
        path: state.path,
        filename: state.filename,
        content: state.rawTypst
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      elBtnSave.disabled = false;

      if (!data.ok) {
        setError(data.error || "Typst compilation failed");
        return;
      }

      setError("");
      state.path = data.path;
      state.filename = data.filename;
      state.pdfPath = data.pdfPath;
      state.pdfUrl = data.pdfUrl;
      elPdfFrame.src = data.pdfUrl;

      const pageSuffix = data.pageCount > 0 ? `, ${data.pageCount} ${data.pageCount === 1 ? "page" : "pages"}` : "";
      setDirty(false, `Saved (${data.ms || 0}ms${pageSuffix})`);

      if (triggerDownloadAfter) {
        window.location.href = `/api/pdf?path=${encodeURIComponent(data.pdfPath)}&download=1`;
      }
    } catch (e) {
      elBtnSave.disabled = false;
      setError("Compile request failed: " + e.message);
    }
  }

  elBtnSave.addEventListener("click", () => saveAndCompile());

  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveAndCompile();
    }
  });

  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    loadFileList();
  }
}

// Re-export parser functions for backward-compatible CommonJS testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ...ParserMod,
    ...EditorMod
  };
}
})();
