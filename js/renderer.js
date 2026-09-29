(function () {
  const MC = window.MedCanvas = window.MedCanvas || {};

  const palettes = {
    sage: { ink: "#173f40", paper: "#f8f4ea", panel: "#fffdfa", soft: "#dceadf", coral: "#eb7e63", gold: "#e8bc63", blue: "#7baac0", sage: "#9fbfa7" },
    cobalt: { ink: "#183652", paper: "#f4f1e9", panel: "#fffefd", soft: "#dbe8f1", coral: "#df745f", gold: "#e6b649", blue: "#4f8fbd", sage: "#8bb3a1" },
    plum: { ink: "#49334b", paper: "#f8f1ef", panel: "#fffdfb", soft: "#eadde7", coral: "#d9797a", gold: "#d7ae67", blue: "#8d91bd", sage: "#97b6a5" }
  };

  const esc = value => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function wrap(text, maxChars, maxLines) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const clipped = lines.slice(0, maxLines);
      clipped[maxLines - 1] = clipped[maxLines - 1].replace(/[.,;:]?$/, "…");
      return clipped;
    }
    return lines;
  }

  function textLines(text, x, y, widthChars, lineHeight, attrs, maxLines = 3) {
    return `<text x="${x}" y="${y}" ${attrs}>${wrap(text, widthChars, maxLines).map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${esc(line)}</tspan>`).join("")}</text>`;
  }

  function icon(type, x, y, color, ink) {
    const common = `fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
    let art = "";
    if (type === "blood") art = `<path d="M28 10C22 21 15 28 15 39a13 13 0 0 0 26 0c0-11-7-18-13-29Z" ${common}/><path d="M22 40c1 4 4 6 8 6" ${common}/>`;
    else if (type === "stomach") art = `<path d="M21 11c4 8 3 13-1 20-5 9 1 19 12 17 10-2 17-13 12-22-3-5-9-2-13-6-3-3-3-7-3-10" ${common}/>`;
    else if (type === "lab") art = `<path d="M20 11h16M24 11v14L15 43c-2 4 1 7 5 7h24c4 0 7-3 5-7L36 25V11" ${common}/><path d="M20 37h25" ${common}/>`;
    else if (type === "compare") art = `<path d="M12 18h38M20 18l8 30M42 18l-8 30M16 35h24" ${common}/><circle cx="31" cy="13" r="5" fill="${ink}"/>`;
    else if (type === "pathway") art = `<circle cx="15" cy="18" r="7" ${common}/><circle cx="45" cy="43" r="7" ${common}/><path d="M21 22l18 16M35 38h4v-4" ${common}/>`;
    else art = `<path d="M12 31h38M31 12v38" ${common}/><circle cx="31" cy="31" r="24" ${common}/>`;
    return `<g transform="translate(${x} ${y})"><circle cx="31" cy="31" r="31" fill="${color}" fill-opacity=".33"/>${art}</g>`;
  }

  function bulletList(items, x, y, widthChars, color, maxItems = 3) {
    let cursor = y;
    let result = "";
    (items || []).slice(0, maxItems).forEach(item => {
      const lines = wrap(item, widthChars, 2);
      result += `<circle cx="${x}" cy="${cursor - 4}" r="4" fill="${color}"/>`;
      result += `<text x="${x + 18}" y="${cursor}" fill="#34595a" font-family="DM Sans,Arial,sans-serif" font-size="22" font-weight="500">${lines.map((line, i) => `<tspan x="${x + 18}" dy="${i ? 28 : 0}">${esc(line)}</tspan>`).join("")}</text>`;
      cursor += 42 + (lines.length - 1) * 28;
    });
    return result;
  }

  function sectionCard(section, x, y, w, h, index, palette, layout) {
    const color = palette[section.accent] || [palette.coral, palette.gold, palette.blue, palette.sage][index % 4];
    const line = layout === "pathway" ? `<path d="M${x + w} ${y + h / 2}h22" stroke="${palette.ink}" opacity=".22" stroke-width="3" stroke-dasharray="5 7"/>` : "";
    return `${line}<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${palette.panel}" stroke="${palette.ink}" stroke-opacity=".10"/>
      <rect x="${x}" y="${y}" width="9" height="${h}" rx="4.5" fill="${color}"/>
      ${icon(section.icon, x + 32, y + 29, color, palette.ink)}
      <text x="${x + 119}" y="${y + 48}" fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="14" font-weight="800" letter-spacing="2">0${index + 1}</text>
      ${textLines(section.heading || "Untitled section", x + 119, y + 82, 25, 31, `fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="26" font-weight="800"`, 2)}
      ${bulletList(section.items, x + 43, y + 143, 36, color, 3)}
    </g>`;
  }

  function comparisonRows(sections, palette) {
    const left = sections[0] || { heading: "Column one", items: [] };
    const right = sections[1] || { heading: "Column two", items: [] };
    const rows = Math.max(left.items.length, right.items.length, 1);
    let out = `<rect x="70" y="415" width="940" height="600" rx="20" fill="${palette.panel}"/>
      <rect x="70" y="415" width="470" height="90" rx="20" fill="${palette.coral}" fill-opacity=".22"/>
      <rect x="540" y="415" width="470" height="90" rx="20" fill="${palette.blue}" fill-opacity=".22"/>
      ${textLines(left.heading, 105, 471, 25, 30, `fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="27" font-weight="800"`, 2)}
      ${textLines(right.heading, 575, 471, 25, 30, `fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="27" font-weight="800"`, 2)}
      <path d="M540 415v600" stroke="${palette.ink}" stroke-opacity=".12"/>`;
    for (let i = 0; i < Math.min(rows, 5); i++) {
      const yy = 558 + i * 94;
      if (i) out += `<path d="M90 ${yy - 43}h900" stroke="${palette.ink}" stroke-opacity=".08"/>`;
      out += `<circle cx="106" cy="${yy - 6}" r="4" fill="${palette.coral}"/>${textLines(left.items[i] || "—", 123, yy, 37, 27, `fill="#34595a" font-family="DM Sans,Arial,sans-serif" font-size="21" font-weight="500"`, 2)}`;
      out += `<circle cx="576" cy="${yy - 6}" r="4" fill="${palette.blue}"/>${textLines(right.items[i] || "—", 593, yy, 37, 27, `fill="#34595a" font-family="DM Sans,Arial,sans-serif" font-size="21" font-weight="500"`, 2)}`;
    }
    return out;
  }

  function render(data) {
    const palette = palettes[data.theme] || palettes.sage;
    const sections = (data.sections || []).slice(0, 4);
    const titleLines = wrap(data.title || "Untitled clinical visual", 25, 2);
    const titleSize = titleLines.length > 1 ? 60 : 69;
    const sourceLabels = (data.sources || []).slice(0, 2).map(s => s.label || s.url || s).join(" · ");
    const layout = data.layout || "clinical-grid";
    const body = layout === "compare"
      ? comparisonRows(sections, palette)
      : sections.map((section, i) => sectionCard(section, 70 + (i % 2) * 476, 413 + Math.floor(i / 2) * 328, 449, 294, i, palette, layout)).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-labelledby="mc-title mc-desc">
      <title id="mc-title">${esc(data.title)}</title>
      <desc id="mc-desc">${esc(data.subtitle)}</desc>
      <rect width="1080" height="1350" fill="${palette.paper}"/>
      <circle cx="1003" cy="82" r="190" fill="${palette.soft}"/>
      <circle cx="1028" cy="82" r="126" fill="none" stroke="${palette.ink}" stroke-opacity=".09" stroke-width="2"/>
      <path d="M0 0h18v286H0z" fill="${palette.coral}"/>
      <text x="70" y="72" fill="${palette.coral}" font-family="Manrope,Arial,sans-serif" font-size="15" font-weight="800" letter-spacing="3">MEDICAL INFOGRAPHIC</text>
      <text x="1010" y="72" text-anchor="end" fill="${palette.ink}" font-family="DM Sans,Arial,sans-serif" font-size="15" font-weight="700">${esc(data.updated || "")}</text>
      <text x="70" y="171" fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="${titleSize}" font-weight="800" letter-spacing="-3">${titleLines.map((line, i) => `<tspan x="70" dy="${i ? 67 : 0}">${esc(line)}</tspan>`).join("")}</text>
      ${textLines(data.subtitle || "", 73, titleLines.length > 1 ? 323 : 251, 59, 31, `fill="#597576" font-family="DM Sans,Arial,sans-serif" font-size="24" font-weight="500"`, 2)}
      <path d="M70 367h940" stroke="${palette.ink}" stroke-opacity=".17"/>
      ${body}
      <g>
        <rect x="70" y="1089" width="940" height="119" rx="16" fill="${palette.ink}"/>
        <circle cx="116" cy="1148" r="24" fill="${palette.coral}"/><text x="116" y="1157" text-anchor="middle" fill="white" font-family="Manrope,Arial,sans-serif" font-size="28" font-weight="800">!</text>
        ${textLines(data.callout || "Review all content against the original source before use.", 158, 1137, 75, 29, `fill="#fffdfa" font-family="DM Sans,Arial,sans-serif" font-size="21" font-weight="600"`, 3)}
      </g>
      <text x="70" y="1254" fill="${palette.ink}" font-family="Manrope,Arial,sans-serif" font-size="12" font-weight="800" letter-spacing="1.7">SOURCES</text>
      ${textLines(sourceLabels || "Add sources before publishing", 70, 1282, 112, 19, `fill="#627c7c" font-family="DM Sans,Arial,sans-serif" font-size="13" font-weight="500"`, 2)}
      <text x="1010" y="1305" text-anchor="end" fill="${palette.coral}" font-family="Manrope,Arial,sans-serif" font-size="13" font-weight="800">MEDCANVAS</text>
      <text x="1010" y="1328" text-anchor="end" fill="#718786" font-family="DM Sans,Arial,sans-serif" font-size="11" font-weight="600">${esc(data.note || "For education only · Not medical advice")}</text>
    </svg>`;
  }

  MC.renderer = { render, palettes };
})();
