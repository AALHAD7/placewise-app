// Renders a Business Model Canvas (9 Osterwalder blocks) as pure ASCII
// (+, -, | only - no Unicode box-drawing, so it's safe in any monospace
// font/terminal/copy-paste). Deliberately a plain string-layout algorithm,
// not something asked of the model: an LLM asked to draw its own ASCII box
// art reliably breaks alignment the moment cell text wraps across lines,
// which is exactly the kind of unreliable output this whole feature exists
// to avoid. The model's job (companyBusinessModel.js) is only to produce
// the verified short bullets per block; this function's only job is to lay
// them out so every line comes out the same character length.

function wrapWords(text, width) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w;
    if (candidate.length > width) {
      if (cur) lines.push(cur);
      if (w.length > width) {
        let rest = w;
        while (rest.length > width) {
          lines.push(rest.slice(0, width));
          rest = rest.slice(width);
        }
        cur = rest;
      } else {
        cur = w;
      }
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function pad(s, width) {
  s = (s ?? "").slice(0, width);
  return s + " ".repeat(Math.max(0, width - s.length));
}

function cellLines(header, bullets, width) {
  const lines = [];
  for (const h of wrapWords(String(header).toUpperCase(), width)) lines.push(pad(h, width));
  lines.push(pad("", width));
  const items = bullets && bullets.length ? bullets : ["(no verified detail found)"];
  for (const b of items) {
    const wrapped = wrapWords(b, width - 2);
    wrapped.forEach((w, i) => lines.push(pad((i === 0 ? "- " : "  ") + w, width)));
  }
  return lines;
}

function padHeight(lines, width, height) {
  const out = lines.slice(0, height);
  while (out.length < height) out.push(pad("", width));
  return out;
}

/**
 * @param {{keyPartners:string[], keyActivities:string[], keyResources:string[], valuePropositions:string[], customerRelationships:string[], channels:string[], customerSegments:string[], costStructure:string[], revenueStreams:string[]}} d
 * @param {string} companyName
 * @returns {string} the full ASCII canvas, every line the same character length
 */
export function renderBmcAscii(d, companyName) {
  const W = 20;
  const widths5 = [W, W, W, W, W];
  const topBorder = () => "+" + widths5.map(w => "-".repeat(w + 2)).join("+") + "+";

  const partners = cellLines("Key Partners", d.keyPartners, W);
  const valueProps = cellLines("Value Propositions", d.valuePropositions, W);
  const segments = cellLines("Customer Segments", d.customerSegments, W);
  const activities = cellLines("Key Activities", d.keyActivities, W);
  const resources = cellLines("Key Resources", d.keyResources, W);
  const relationships = cellLines("Customer Relationships", d.customerRelationships, W);
  const channels = cellLines("Channels", d.channels, W);

  const contentRows = Math.max(
    partners.length, valueProps.length, segments.length,
    activities.length + resources.length,
    relationships.length + channels.length
  );

  const c1 = padHeight(partners, W, contentRows);
  const c3 = padHeight(valueProps, W, contentRows);
  const c5 = padHeight(segments, W, contentRows);

  const col2TopH = Math.max(activities.length, Math.ceil(contentRows / 2));
  const col2BottomH = contentRows - col2TopH;
  const c2top = padHeight(activities, W, col2TopH);
  const c2bottom = padHeight(resources, W, col2BottomH);

  const col4TopH = Math.max(relationships.length, Math.ceil(contentRows / 2));
  const col4BottomH = contentRows - col4TopH;
  const c4top = padHeight(relationships, W, col4TopH);
  const c4bottom = padHeight(channels, W, col4BottomH);

  const border = topBorder();
  const lines = [];
  lines.push(pad(`BUSINESS MODEL CANVAS -- ${String(companyName).toUpperCase()}`, border.length));
  lines.push(border);

  for (let i = 0; i < contentRows; i++) {
    const col2cell = i < col2TopH ? c2top[i] : c2bottom[i - col2TopH];
    const col4cell = i < col4TopH ? c4top[i] : c4bottom[i - col4TopH];
    lines.push("|" + [c1[i], col2cell, c3[i], col4cell, c5[i]].map((c, idx) => " " + pad(c, widths5[idx]) + " ").join("|") + "|");
    if (i === col2TopH - 1 && col2BottomH > 0) {
      const segs = widths5.map((w, idx) => (idx === 1 || idx === 3) ? "-".repeat(w + 2) : " ".repeat(w + 2));
      lines.push("|" + segs.join("|") + "|");
    }
  }
  lines.push(border);

  const totalWidth = border.length;
  const leftW = Math.floor((totalWidth - 3) / 2);
  const rightW = totalWidth - 3 - leftW;
  const cost = cellLines("Cost Structure", d.costStructure, leftW - 2);
  const revenue = cellLines("Revenue Streams", d.revenueStreams, rightW - 2);
  const bottomH = Math.max(cost.length, revenue.length);
  const bc = padHeight(cost, leftW - 2, bottomH);
  const br = padHeight(revenue, rightW - 2, bottomH);
  const bottomBorder = "+" + "-".repeat(leftW) + "+" + "-".repeat(rightW) + "+";
  lines.push(bottomBorder);
  for (let i = 0; i < bottomH; i++) {
    lines.push("|" + " " + pad(bc[i], leftW - 2) + " |" + " " + pad(br[i], rightW - 2) + " |");
  }
  lines.push(bottomBorder);

  return lines.join("\n");
}
