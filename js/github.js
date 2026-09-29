(function () {
  const MC = window.MedCanvas = window.MedCanvas || {};
  const API = "https://api.github.com";

  function utf8ToBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function base64ToUtf8(value) {
    const binary = atob(value.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function request(path, token, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch (_) { /* no-op */ }
      throw new Error(`${response.status} ${detail || response.statusText}`.trim());
    }
    return response.status === 204 ? null : response.json();
  }

  async function getFile(owner, repo, branch, path, token) {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch (_) { /* no-op */ }
      throw new Error(`${response.status} ${detail || response.statusText}`.trim());
    }
    return response.json();
  }

  async function putFile({ owner, repo, branch, path, content, token, message }) {
    const existing = await getFile(owner, repo, branch, path, token);
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content),
        branch,
        ...(existing ? { sha: existing.sha } : {})
      })
    });
  }

  async function publish({ owner, repo, branch, slug, token, svg, data, onProgress }) {
    const base = "published";
    onProgress?.("Uploading editable SVG…");
    await putFile({ owner, repo, branch, path: `${base}/${slug}.svg`, content: svg, token, message: `Publish infographic: ${data.title}` });
    onProgress?.("Uploading structured clinical data…");
    await putFile({ owner, repo, branch, path: `${base}/${slug}.json`, content: JSON.stringify(data, null, 2), token, message: `Add infographic data: ${data.title}` });

    onProgress?.("Updating the public gallery…");
    const indexFile = await getFile(owner, repo, branch, `${base}/index.json`, token);
    let entries = [];
    if (indexFile?.content) {
      try { entries = JSON.parse(base64ToUtf8(indexFile.content)); } catch (_) { entries = []; }
    }
    const entry = {
      slug,
      title: data.title,
      subtitle: data.subtitle,
      theme: data.theme,
      updated: new Date().toISOString(),
      svg: `${base}/${slug}.svg`,
      data: `${base}/${slug}.json`
    };
    entries = [entry, ...entries.filter(item => item.slug !== slug)].slice(0, 24);
    await putFile({ owner, repo, branch, path: `${base}/index.json`, content: JSON.stringify(entries, null, 2), token, message: `Update infographic gallery: ${data.title}` });
    return {
      repositoryUrl: `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      pagesUrl: `https://${owner}.github.io/${repo}/#gallery`
    };
  }

  MC.github = { publish };
})();
