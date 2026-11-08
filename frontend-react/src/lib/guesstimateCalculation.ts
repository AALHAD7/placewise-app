import type { PlacewiseDiagramBlock, PlacewiseTreeNode } from "../types/api";

export interface GuesstimateCalculationStep {
  label: string;
  factor?: string;
  value?: string;
}

export interface GuesstimateCalculationBranch {
  name: string;
  steps: GuesstimateCalculationStep[];
  subtotal?: string;
}

export interface GuesstimateCalculationData {
  assumptions: string[];
  basePopulation?: string;
  branches: GuesstimateCalculationBranch[];
  flowFormulas: string[];
  mathNotes: string[];
  conclusion?: string;
  hasCalculations: boolean;
}

/**
 * Extracts percentage and number substrings from a tree label:
 * e.g. "URBAN (35%) 490 MILLION" -> factor: "35%", value: "490 MILLION", label: "URBAN"
 * e.g. "POPULATION OF INDIA 1.4 BILLION" -> value: "1.4 BILLION", label: "POPULATION OF INDIA"
 */
function parseStepLabel(raw: string): GuesstimateCalculationStep {
  const clean = raw.trim();
  const pctMatch = clean.match(/\(([\d\.]+%?)\)/);
  const factor = pctMatch ? pctMatch[1] : undefined;

  // Try extracting trailing value like "490 MILLION", "17,150,000", "₹25"
  let value: string | undefined;
  const numMatch = clean.match(/((?:₹|RS\.?\s*)?[\d,\.]+\s*(?:MILLION|BILLION|CRORE|CRORES|THOUSAND|ORDERS|VEHICLES|CONSUMERS)?)\s*$/i);
  if (numMatch && numMatch[1] && numMatch[1] !== factor) {
    value = numMatch[1].trim();
  }

  return {
    label: clean,
    factor,
    value
  };
}

/**
 * Parses markdown and raw casebook problem text to extract the full step-by-step
 * calculation breakdown into simple text format.
 */
export function parseGuesstimateCalculation(
  markdown: string | null | undefined,
  rawMarkdown?: string | null
): GuesstimateCalculationData {
  const source = rawMarkdown || markdown || "";
  const blocks: PlacewiseDiagramBlock[] = [];
  const re = /```placewise-diagram([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // Ignore JSON parse error safely
    }
  }

  // If no blocks found in rawMarkdown, check markdown
  if (blocks.length === 0 && markdown && markdown !== source) {
    while ((match = re.exec(markdown)) !== null) {
      try {
        blocks.push(JSON.parse(match[1].trim()));
      } catch {
        // Ignore
      }
    }
  }

  const branches: GuesstimateCalculationBranch[] = [];
  const flowFormulas: string[] = [];
  let basePopulation: string | undefined;

  for (const b of blocks) {
    if (b.type === "issue_tree" && b.root) {
      basePopulation = b.root.label;
      const rawPaths: string[][] = [];

      function walk(node: PlacewiseTreeNode, path: string[]) {
        const nextPath = [...path, node.label];
        if (!node.children || node.children.length === 0) {
          rawPaths.push(nextPath);
        } else {
          for (const c of node.children) {
            walk(c, nextPath);
          }
        }
      }

      walk(b.root, []);

      // Group paths into distinct readable calculation tracks
      rawPaths.forEach((p, idx) => {
        const steps = p.map(parseStepLabel);
        // Meaningful name from intermediate segment
        const nameParts = p.slice(1, Math.min(3, p.length)).map((s) => s.replace(/\s*\([\d\.%]+\)/, "").trim());
        const name = nameParts.length > 0 ? nameParts.join(" → ") : `Segment Track ${idx + 1}`;
        const lastStep = steps[steps.length - 1];
        branches.push({
          name,
          steps,
          subtotal: lastStep?.value || lastStep?.label
        });
      });
    } else if (b.type === "flow" && Array.isArray(b.nodes)) {
      const labels = b.nodes.map((n) => n.label.trim()).filter(Boolean);
      let formula = "";
      for (let i = 0; i < labels.length; i++) {
        const l = labels[i];
        if (l.toUpperCase() === "X" || l === "*") {
          formula += " × ";
        } else if (l === "=") {
          formula += " = ";
        } else {
          if (formula && !formula.endsWith(" ") && !formula.endsWith("× ") && !formula.endsWith("= ")) {
            formula += " → ";
          }
          formula += l;
        }
      }
      if (formula.trim()) {
        flowFormulas.push(formula.trim());
      }
    }
  }

  // Extract explicit assumptions from text
  const cleanText = source.replace(/```placewise-diagram[\s\S]*?```/g, "");
  const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean);

  const assumptions: string[] = [];
  let inAssumptions = false;
  for (const l of lines) {
    if (/^ASSUMPTIONS\b/i.test(l)) {
      inAssumptions = true;
      continue;
    }
    if (inAssumptions) {
      if (/^(\d+[\.\)]|[-*•])\s+/.test(l)) {
        assumptions.push(l.replace(/^(\d+[\.\)]|[-*•])\s+/, ""));
      } else if (/^[A-Z\s]{4,}$/.test(l) || l.includes("Diagram summary")) {
        inAssumptions = false;
      }
    }
  }

  // Extract conclusion line
  let conclusion: string | undefined;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (
      /(market size|revenue|number of|total|expenditure|is equal to|yields|crores|plates|orders|units)/i.test(l) &&
      !l.includes("Diagram summary") &&
      !l.startsWith("#") &&
      l.length < 160 &&
      l.length > 8
    ) {
      conclusion = l;
      break;
    }
  }

  // Extract descriptive math sentences that explain the arithmetic
  const mathNotes: string[] = [];
  for (const l of lines) {
    if (
      /(multiplied by|divided by|equals|comes out to|calculated as|translates to|per day|per year|active consumption)/i.test(l) &&
      !l.includes("Diagram summary") &&
      !l.startsWith("#") &&
      l.length > 20 &&
      l.length < 300
    ) {
      mathNotes.push(l);
    }
  }

  const hasCalculations = branches.length > 0 || flowFormulas.length > 0 || !!conclusion || assumptions.length > 0;

  return {
    assumptions,
    basePopulation,
    branches,
    flowFormulas,
    mathNotes: mathNotes.slice(0, 4),
    conclusion,
    hasCalculations
  };
}
