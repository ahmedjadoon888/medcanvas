(function () {
  const MC = window.MedCanvas;
  let state = MC.cloneSample();
  let selectedImage = null;
  let toastTimer = null;
  let publishedItems = [];

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));

  function slugify(value) {
    return String(value || "infographic").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "infographic";
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3000);
  }

  function setStatus(el, message, type = "") {
    el.textContent = message;
    el.className = `status-line${type ? ` is-${type}` : ""}`;
  }

  function renderVisuals() {
    const svg = MC.renderer.render(state);
    $("#infographic-preview").innerHTML = svg;
    $("#hero-sheet").innerHTML = svg;
    $("#gallery-b12").innerHTML = MC.renderer.render(MC.sample);
  }

  function goToStep(step) {
    $$(".step-panel").forEach(panel => { panel.hidden = Number(panel.dataset.panel) !== step; });
    $$(".step").forEach(button => {
      const n = Number(button.dataset.step);
      button.classList.toggle("is-active", n === step);
      button.classList.toggle("is-complete", n < step);
    });
    if (step === 2) fillEditor();
    if (step === 3) {
      syncFromEditor();
      renderValidation();
    }
  }

  function sourceText(source) {
    return (source || []).map(item => `${item.label || "Source"}${item.url ? ` — ${item.url}` : ""}`).join("\n");
  }

  function parseSources(value) {
    return value.split(/\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const match = line.match(/(https?:\/\/\S+)/);
      if (!match) return { label: line, url: "" };
      return { label: line.replace(match[0], "").replace(/[—–-]\s*$/, "").trim() || match[0], url: match[0] };
    });
  }

  function fillEditor() {
    $("#title-input").value = state.title || "";
    $("#subtitle-input").value = state.subtitle || "";
    $("#layout-input").value = state.layout || "clinical-grid";
    $("#theme-input").value = state.theme || "sage";
    $("#sources-input").value = sourceText(state.sources);
    const list = $("#sections-editor");
    list.innerHTML = "";
    (state.sections || []).forEach((section, index) => {
      const detail = document.createElement("details");
      detail.className = "section-editor";
      if (index === 0) detail.open = true;
      detail.dataset.index = index;
      detail.innerHTML = `<summary><span>${escapeHtml(section.heading || `Section ${index + 1}`)}</span><button type="button" class="remove-section" data-remove="${index}">Remove</button></summary>
        <div class="section-editor-body">
          <label><span>Heading</span><input data-section-heading value="${escapeAttr(section.heading || "")}" maxlength="42"></label>
          <label><span>Bullet points — one per line</span><textarea data-section-items>${escapeHtml((section.items || []).join("\n"))}</textarea></label>
        </div>`;
      list.appendChild(detail);
    });
  }

  function invalidateReview() {
    $("#review-confirm").checked = false;
    $("#privacy-confirm").checked = false;
    updatePublishState();
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function syncFromEditor() {
    state.title = $("#title-input").value.trim() || "Untitled clinical visual";
    state.subtitle = $("#subtitle-input").value.trim();
    state.layout = $("#layout-input").value;
    state.theme = $("#theme-input").value;
    state.sources = parseSources($("#sources-input").value);
    state.sections = $$(".section-editor").map((detail, index) => ({
      heading: detail.querySelector("[data-section-heading]").value.trim() || `Section ${index + 1}`,
      items: detail.querySelector("[data-section-items]").value.split(/\n/).map(v => v.trim()).filter(Boolean).slice(0, 5),
      icon: state.sections[index]?.icon || ["clinical", "lab", "pathway", "compare"][index % 4],
      accent: state.sections[index]?.accent || ["coral", "gold", "blue", "sage"][index % 4]
    }));
    invalidateReview();
    renderVisuals();
  }

  function validate() {
    const checks = [
      { ok: Boolean(state.title && state.subtitle), message: "Title and explanatory subtitle are present." },
      { ok: state.sections.length >= 2 && state.sections.every(section => section.items.length > 0), message: "At least two populated clinical sections are present." },
      { ok: state.sources.length > 0 && state.sources.some(source => source.url), message: "At least one linked source is included." },
      { ok: !JSON.stringify(state).match(/\b(patient|mrn|dob|date of birth|medical record)\s*[:#]/i), message: "No obvious patient identifiers detected (manual privacy review still required)." }
    ];
    return checks;
  }

  function renderValidation() {
    const checks = validate();
    $("#validation-results").innerHTML = checks.map(check => `<div class="validation-item ${check.ok ? "ok" : "warn"}">${escapeHtml(check.message)}</div>`).join("");
    updatePublishState();
  }

  function updatePublishState() {
    const ready = validate().every(check => check.ok) && $("#review-confirm").checked && $("#privacy-confirm").checked;
    $("#open-publish").disabled = !ready;
  }

  async function runExtraction() {
    const status = $("#ocr-status");
    let text = $("#source-text").value.trim();
    try {
      if (selectedImage) {
        if (!window.Tesseract) throw new Error("OCR library is unavailable. Paste the source text instead, or check your internet connection.");
        setStatus(status, "Reading the screenshot on this device… 0%");
        const result = await window.Tesseract.recognize(selectedImage, "eng", {
          logger: message => {
            if (message.status === "recognizing text") setStatus(status, `Reading the screenshot on this device… ${Math.round((message.progress || 0) * 100)}%`);
          }
        });
        text = result.data.text.trim();
        $("#source-text").value = text;
      }
      if (!text) throw new Error("Add a screenshot or paste source text first.");
      setStatus(status, "Organizing the extracted text into editable sections…");
      state = await MC.adapters.local.transform(text);
      invalidateReview();
      setStatus(status, "Structured successfully. Review the extracted content next.", "success");
      goToStep(2);
    } catch (error) {
      setStatus(status, error.message || "Extraction failed.", "error");
    }
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function downloadPng() {
    syncFromEditorIfAvailable();
    const svg = MC.renderer.render(state);
    await document.fonts?.ready;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, 1080, 1350);
      URL.revokeObjectURL(url);
      canvas.toBlob(png => {
        if (!png) return toast("PNG export was not available in this browser.");
        const pngUrl = URL.createObjectURL(png);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = `${slugify(state.title)}.png`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
      }, "image/png", 1);
    };
    image.onerror = () => { URL.revokeObjectURL(url); toast("Could not render the PNG. SVG remains available."); };
    image.src = url;
  }

  function syncFromEditorIfAvailable() {
    if (!$(".step-panel[data-panel='2']").hidden) syncFromEditor();
  }

  async function publish(event) {
    event.preventDefault();
    const status = $("#publish-status");
    const button = $("#publish-button");
    const owner = $("#github-owner").value.trim();
    const repo = $("#github-repo").value.trim();
    const branch = $("#github-branch").value.trim();
    const slug = slugify($("#github-slug").value);
    const token = $("#github-token").value.trim();
    if (!owner || !repo || !branch || !slug || !token) return setStatus(status, "Complete all fields before publishing.", "error");
    button.disabled = true;
    try {
      const result = await MC.github.publish({ owner, repo, branch, slug, token, svg: MC.renderer.render(state), data: state, onProgress: message => setStatus(status, message) });
      setStatus(status, `Published. GitHub Pages may take a minute to refresh. ${result.pagesUrl}`, "success");
      $("#github-token").value = "";
      toast("Infographic committed to GitHub.");
    } catch (error) {
      setStatus(status, `Publish failed: ${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function loadPublishedGallery() {
    try {
      const response = await fetch(`published/index.json?${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const entries = await response.json();
      if (!Array.isArray(entries) || !entries.length) return;
      const safeEntries = entries.filter(item =>
        /^published\/[a-z0-9-]+\.svg$/i.test(item.svg || "") ||
        /^published\/[a-z0-9-]+\.json$/i.test(item.data || "")
      ).slice(0, 6);
      publishedItems = (await Promise.all(safeEntries.map(async item => {
        if (!/^published\/[a-z0-9-]+\.json$/i.test(item.data || "")) return { manifest: item, data: null };
        try {
          const dataResponse = await fetch(`${item.data}?${Date.now()}`, { cache: "no-store" });
          if (!dataResponse.ok) return null;
          const data = await dataResponse.json();
          if (!data?.title || !Array.isArray(data.sections)) return null;
          return { manifest: item, data };
        } catch (_) { return null; }
      }))).filter(Boolean);
      if (!publishedItems.length) return;
      $("#published-grid").innerHTML = publishedItems.map((item, index) => {
        const title = item.data?.title || item.manifest.title || "Published infographic";
        const subtitle = item.data?.subtitle || item.manifest.subtitle || "Published infographic";
        const visual = item.data
          ? `<div class="published-art">${MC.renderer.render(item.data)}</div>`
          : `<div class="published-art"><img src="${escapeAttr(item.manifest.svg)}" alt="${escapeAttr(title)}"></div>`;
        return `<article class="published-card" data-published-index="${index}" tabindex="0" role="button" aria-label="Open ${escapeAttr(title)} in the studio">${visual}<div class="published-card-copy"><span><h4>${escapeHtml(title)}</h4><p>${escapeHtml(subtitle)}</p></span><b>Open →</b></div></article>`;
      }).join("");
      $("#published-gallery").hidden = false;
      const requested = new URLSearchParams(location.search).get("item");
      if (requested) {
        const index = publishedItems.findIndex(item => item.manifest.slug === requested);
        if (index >= 0 && publishedItems[index].data) openPublishedItem(index, false);
      }
    } catch (_) { /* gallery index is optional */ }
  }

  function openPublishedItem(index, scroll = true) {
    const item = publishedItems[index];
    if (!item) return;
    if (!item.data) {
      if (item.manifest.svg) window.open(item.manifest.svg, "_blank", "noopener");
      return;
    }
    state = clone(item.data);
    invalidateReview();
    goToStep(2);
    if (scroll) $("#studio").scrollIntoView({ behavior: "smooth" });
    toast(`${state.title} opened in the studio.`);
  }

  function bind() {
    $$(".step").forEach(button => button.addEventListener("click", () => goToStep(Number(button.dataset.step))));
    $$('[data-back]').forEach(button => button.addEventListener("click", () => goToStep(Number(button.dataset.back))));
    $("#extract-button").addEventListener("click", runExtraction);
    $("#use-sample-button").addEventListener("click", () => { state = MC.cloneSample(); invalidateReview(); goToStep(2); toast("B12 sample loaded."); });
    $$('[data-load-sample]').forEach(button => button.addEventListener("click", () => { state = MC.cloneSample(); invalidateReview(); goToStep(2); $("#studio").scrollIntoView({ behavior: "smooth" }); }));
    $("#to-review").addEventListener("click", () => goToStep(3));

    const fileInput = $("#image-input");
    const dropZone = $("#drop-zone");
    fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
    ["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add("is-dragging"); }));
    ["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove("is-dragging"); }));
    dropZone.addEventListener("drop", event => handleFile(event.dataTransfer.files[0]));

    $("#sections-editor").addEventListener("input", event => {
      const detail = event.target.closest(".section-editor");
      if (detail && event.target.matches("[data-section-heading]")) detail.querySelector("summary span").textContent = event.target.value || "Untitled section";
      syncFromEditor();
    });
    $("#sections-editor").addEventListener("click", event => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      event.preventDefault();
      const index = Number(button.dataset.remove);
      state.sections.splice(index, 1);
      fillEditor();
      renderVisuals();
    });
    ["#title-input", "#subtitle-input", "#layout-input", "#theme-input", "#sources-input"].forEach(selector => $(selector).addEventListener("input", syncFromEditor));
    $("#add-section").addEventListener("click", () => {
      if (state.sections.length >= 4) return toast("This layout supports up to four sections.");
      syncFromEditor();
      state.sections.push({ heading: "New section", items: ["Add a concise clinical point"], icon: "clinical", accent: ["coral", "gold", "blue", "sage"][state.sections.length] });
      fillEditor();
      renderVisuals();
    });

    ["#review-confirm", "#privacy-confirm"].forEach(selector => $(selector).addEventListener("change", updatePublishState));
    $("#download-svg").addEventListener("click", () => download(`${slugify(state.title)}.svg`, MC.renderer.render(state), "image/svg+xml"));
    $("#download-json").addEventListener("click", () => download(`${slugify(state.title)}.json`, JSON.stringify(state, null, 2), "application/json"));
    $("#download-png").addEventListener("click", downloadPng);
    $("#zoom-preview").addEventListener("click", () => $(".preview-pane").classList.toggle("is-expanded"));
    $("#open-publish").addEventListener("click", () => { $("#github-slug").value = slugify(state.title); $("#publish-dialog").showModal(); });
    $("#publish-form").addEventListener("submit", publish);
    $$('[data-close-dialog]').forEach(button => button.addEventListener("click", () => $("#publish-dialog").close()));
    $("#publish-dialog").addEventListener("close", () => { $("#github-token").value = ""; });
    $("#published-grid").addEventListener("click", event => {
      const card = event.target.closest("[data-published-index]");
      if (card) openPublishedItem(Number(card.dataset.publishedIndex));
    });
    $("#published-grid").addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-published-index]");
      if (!card) return;
      event.preventDefault();
      openPublishedItem(Number(card.dataset.publishedIndex));
    });
  }

  function handleFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setStatus($("#ocr-status"), "Choose a PNG, JPG or WebP image.", "error");
    if (file.size > 12 * 1024 * 1024) return setStatus($("#ocr-status"), "Choose an image smaller than 12 MB.", "error");
    selectedImage = file;
    const preview = $("#upload-preview");
    preview.src = URL.createObjectURL(file);
    $("#drop-zone").classList.add("has-image");
    setStatus($("#ocr-status"), `${file.name} ready for local OCR.`);
  }

  function init() {
    renderVisuals();
    fillEditor();
    bind();
    goToStep(1);
    loadPublishedGallery();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
