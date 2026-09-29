(function () {
  const MC = window.MedCanvas = window.MedCanvas || {};

  const headings = /^(diagnosis|diagnostic|evaluation|treatment|management|clinical features|symptoms|signs|causes|etiology|risk factors|complications|prevention|key points|testing|workup|presentation)\s*:?\s*$/i;

  function sentenceCase(value) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean) return "";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function cleanLine(line) {
    return sentenceCase(line.replace(/^[•●▪◦*\-–—\d.)\s]+/, "").replace(/\s+/g, " "));
  }

  function guessTitle(lines) {
    const candidate = lines.find(line => line.length >= 4 && line.length <= 60 && !/[.!?]$/.test(line));
    return candidate ? candidate.replace(/:$/, "") : "Clinical Overview";
  }

  /**
   * Adapter contract: transform(sourceText) -> Promise<InfographicData>.
   * A future ChatGPT/Plugin adapter can implement the same single method.
   */
  const LocalHeuristicAdapter = {
    id: "local-heuristic-v1",
    async transform(sourceText) {
      const rawLines = sourceText.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      const title = guessTitle(rawLines);
      const contentLines = rawLines.filter((line, index) => !(index === 0 && line === title));
      const buckets = [];
      let current = { heading: "Key clinical points", items: [] };

      for (const line of contentLines) {
        const cleaned = cleanLine(line);
        if (!cleaned) continue;
        if (headings.test(cleaned) || (/^[A-Z][A-Za-z /&-]{2,28}:$/.test(line))) {
          if (current.items.length) buckets.push(current);
          current = { heading: cleaned.replace(/:$/, ""), items: [] };
        } else if (cleaned.length > 150) {
          const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
          current.items.push(...sentences.map(cleanLine).filter(Boolean));
        } else {
          current.items.push(cleaned);
        }
      }
      if (current.items.length) buckets.push(current);

      const fallback = [{ heading: "Key clinical points", items: ["Review and edit the extracted source text before publishing."] }];
      const sections = (buckets.length ? buckets : fallback).slice(0, 4).map((section, index) => ({
        heading: sentenceCase(section.heading),
        icon: ["clinical", "lab", "pathway", "compare"][index],
        accent: ["coral", "gold", "blue", "sage"][index],
        items: section.items.slice(0, 4)
      }));

      return {
        version: 1,
        title: sentenceCase(title),
        subtitle: "A structured clinical overview — review before use",
        layout: "clinical-grid",
        theme: "sage",
        updated: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()),
        sections,
        callout: "Clinical review required: compare every extracted claim, number and unit with the original source.",
        sources: [],
        note: "For education only · Verify local guidance · Not medical advice"
      };
    }
  };

  MC.adapters = MC.adapters || {};
  MC.adapters.local = LocalHeuristicAdapter;
})();
