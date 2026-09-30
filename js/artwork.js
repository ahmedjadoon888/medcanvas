(function () {
  const MC = window.MedCanvas = window.MedCanvas || {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const mimeExtensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  const esc = value => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  function isIllustrated(data) { return data?.version === 2 && data?.kind === "illustrated-algorithm"; }
  function validate(data, slug) {
    if (!isIllustrated(data) || !slugPattern.test(slug || "") || slug === "index" || data.slug !== slug) return false;
    if (typeof data.title !== "string" || !data.title.trim() || !Array.isArray(data.artwork) || !data.artwork.length || data.artwork.length > 12) return false;
    const paths = new Set();
    return data.artwork.every(art => {
      const ext = mimeExtensions[art?.mimeType];
      if (!ext || !/^[a-f0-9]{64}$/.test(art.sha256 || "")) return false;
      if (art.src !== `published/assets/${slug}-${art.sha256.slice(0, 12)}.${ext}` || paths.has(art.src)) return false;
      paths.add(art.src);
      return Number.isInteger(art.width) && art.width > 0 && art.width <= 8192 && Number.isInteger(art.height) && art.height > 0 && art.height <= 8192 && typeof art.alt === "string" && art.alt.trim().length > 0;
    });
  }
  function image(art, eager) {
    return `<img class="approved-artwork" src="${esc(art.src)}" alt="${esc(art.alt)}" width="${art.width}" height="${art.height}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
  }
  function preview(data, slug, eager = false) {
    if (!validate(data, slug)) throw new Error("Invalid illustrated infographic.");
    return image(data.artwork[0], eager) + (data.artwork.length > 1 ? `<span class="page-count">${data.artwork.length} pages</span>` : "");
  }
  function full(data, slug) {
    if (!validate(data, slug)) throw new Error("Invalid illustrated infographic.");
    return `<div class="artwork-pages">${data.artwork.map((art, i) => `<figure class="artwork-page">${image(art, true)}<figcaption>${data.artwork.length > 1 ? `Page ${i + 1} of ${data.artwork.length}` : "Approved graphic"}<a href="${esc(art.src)}" target="_blank" rel="noopener">Open full size ↗</a><button type="button" class="artwork-download" data-page="${i}">Download image ↓</button></figcaption></figure>`).join("")}</div>`;
  }
  // Verify bytes before downloading so a changed asset cannot masquerade as the approved file.
  async function download(art) {
    const response = await fetch(art.src, { cache: "no-store" });
    if (!response.ok) throw new Error("The approved image could not be downloaded.");
    const bytes = await response.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(x => x.toString(16).padStart(2, "0")).join("");
    if (hash !== art.sha256) throw new Error("Image verification failed. Please reload or contact the publisher.");
    const url = URL.createObjectURL(new Blob([bytes], { type: art.mimeType }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = art.src.split("/").pop(); anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  MC.artwork = { isIllustrated, validate, preview, full, download };
})();
