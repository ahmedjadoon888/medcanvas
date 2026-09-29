(function () {
  const MC = window.MedCanvas;
  let items = [];
  let activeItem = null;
  let toastTimer;
  const $ = selector => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function safePath(path) { return /^published\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(path || "") ? path : null; }
  function slugify(value) {
    return String(value || "medcanvas-infographic").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "medcanvas-infographic";
  }
  function toast(message) {
    const el = $("#toast"); el.textContent = message; el.classList.add("is-visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }
  function setStatus(message, loading) {
    const status = $("#gallery-status"); status.hidden = false;
    status.innerHTML = `${loading ? '<span class="loader" aria-hidden="true"></span>' : ""}<p>${escapeHtml(message)}</p>`;
    $("#gallery-grid").hidden = true;
  }
  function renderCards(list) {
    const grid = $("#gallery-grid"); $("#gallery-status").hidden = true; grid.hidden = false;
    $("#gallery-count").textContent = `${list.length} ${list.length === 1 ? "infographic" : "infographics"}`;
    if (!list.length) { grid.innerHTML = '<div class="empty-state">No infographics match that search.</div>'; return; }
    grid.innerHTML = list.map(item => `
      <button class="gallery-card" type="button" data-slug="${escapeHtml(item.manifest.slug)}" aria-label="Open ${escapeHtml(item.data.title)}">
        <span class="gallery-art">${MC.renderer.render(item.data)}</span>
        <span class="gallery-copy"><span><h3>${escapeHtml(item.data.title)}</h3><p>${escapeHtml(item.data.subtitle || "Medical infographic")}</p></span><b aria-hidden="true">↗</b></span>
      </button>`).join("");
  }
  async function loadGallery() {
    setStatus("Loading the collection…", true);
    try {
      const response = await fetch(`published/index.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("The collection index could not be loaded.");
      const manifest = await response.json();
      if (!Array.isArray(manifest)) throw new Error("The collection index is invalid.");
      const loaded = await Promise.all(manifest.slice(0, 48).map(async entry => {
        const path = safePath(entry.data);
        if (!path || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug || "")) return null;
        try {
          const dataResponse = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
          if (!dataResponse.ok) return null;
          const data = await dataResponse.json();
          if (!data || !data.title || !Array.isArray(data.sections) || data.sections.length < 2) return null;
          return { manifest: entry, data };
        } catch (_) { return null; }
      }));
      items = loaded.filter(Boolean);
      if (!items.length) { setStatus("The collection is ready for its first infographic.", false); $("#gallery-count").textContent = "0 infographics"; return; }
      renderCards(items);
      $("#featured-visual").innerHTML = MC.renderer.render(items[0].data);
      const requested = new URLSearchParams(location.search).get("item");
      if (requested && items.some(item => item.manifest.slug === requested)) openItem(requested, false);
    } catch (error) { setStatus(error.message || "The collection could not be loaded. Please try again shortly.", false); }
  }
  function openItem(slug, updateUrl = true) {
    activeItem = items.find(item => item.manifest.slug === slug); if (!activeItem) return;
    const { data } = activeItem;
    $("#dialog-art").innerHTML = MC.renderer.render(data); $("#dialog-title").textContent = data.title; $("#dialog-subtitle").textContent = data.subtitle || "";
    const sources = Array.isArray(data.sources) ? data.sources.filter(source => source && /^https?:\/\//i.test(source.url || "")) : [];
    $("#dialog-sources").innerHTML = sources.length ? `<h3>Sources</h3>${sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label || source.url)} ↗</a>`).join("")}` : "";
    if (updateUrl) history.replaceState(null, "", `${location.pathname}?item=${encodeURIComponent(slug)}`);
    $("#visual-dialog").showModal();
  }
  function closeItem() { $("#visual-dialog").close(); activeItem = null; history.replaceState(null, "", location.pathname); }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function downloadSvg() { if (activeItem) download(`${slugify(activeItem.data.title)}.svg`, MC.renderer.render(activeItem.data), "image/svg+xml;charset=utf-8"); }
  async function downloadPng() {
    if (!activeItem) return; const svg = MC.renderer.render(activeItem.data); await document.fonts?.ready;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" })); const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350; canvas.getContext("2d").drawImage(image, 0, 0, 1080, 1350); URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return toast("PNG download is unavailable in this browser.");
        const pngUrl = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = pngUrl; anchor.download = `${slugify(activeItem.data.title)}.png`; anchor.click(); setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
      }, "image/png", 1);
    };
    image.onerror = () => { URL.revokeObjectURL(url); toast("PNG download failed. SVG is still available."); }; image.src = url;
  }
  function bind() {
    $("#year").textContent = new Date().getFullYear();
    $("#gallery-grid").addEventListener("click", event => { const card = event.target.closest("[data-slug]"); if (card) openItem(card.dataset.slug); });
    $("#gallery-search").addEventListener("input", event => { const query = event.target.value.trim().toLowerCase(); renderCards(items.filter(item => `${item.data.title} ${item.data.subtitle || ""}`.toLowerCase().includes(query))); });
    $(".dialog-close").addEventListener("click", closeItem);
    $("#visual-dialog").addEventListener("click", event => { if (event.target === $("#visual-dialog")) closeItem(); });
    $("#visual-dialog").addEventListener("cancel", event => { event.preventDefault(); closeItem(); });
    $("#download-svg").addEventListener("click", downloadSvg); $("#download-png").addEventListener("click", downloadPng);
    $("#copy-link").addEventListener("click", async () => { try { await navigator.clipboard.writeText(location.href); toast("Link copied."); } catch (_) { toast("Copy the address from your browser."); } });
  }
  bind(); loadGallery();
})();
