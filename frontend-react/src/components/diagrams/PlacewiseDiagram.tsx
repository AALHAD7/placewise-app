import { Component, type ReactNode } from "react";
import type { PlacewiseDiagramBlock, PlacewiseTreeNode } from "../../types/api";
import "../../styles/placewise-diagram.css";

// Draws one ```placewise-diagram block (diagram-transcription skill) without any chart or
// graph library. Admin-only for now (R5 review queue); built as a shared component so R8
// can reuse it for students. Every label is shown exactly as stored - nothing is padded,
// merged or corrected, so transcription faults stay visible to the reviewer.
// Unknown types and malformed blocks fall back to "Can't draw this block" + the JSON.

type Block = PlacewiseDiagramBlock;

class BlockError extends Error {}

function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new BlockError(msg);
}

const str = (v: unknown) => (v == null ? "" : String(v));

function TreeNode({ node, depth }: { node: PlacewiseTreeNode; depth: number }) {
  need(node && typeof node === "object", "tree node is not an object");
  need(depth <= 12, "tree deeper than 12 levels");
  const children = Array.isArray(node.children) ? node.children : [];
  return (
    <li className="pwd-tree-node">
      <span className="pwd-tree-label">{str(node.label) || <em className="pwd-missing">(no label)</em>}</span>
      {children.length > 0 && (
        <ul className="pwd-tree-children">
          {children.map((c, i) => (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function IssueTree({ b }: { b: Extract<Block, { type: "issue_tree" }> }) {
  need(b.root, "issue_tree needs root");
  return (
    <ul className="pwd-tree">
      <TreeNode node={b.root} depth={1} />
    </ul>
  );
}

function Flow({ b }: { b: Extract<Block, { type: "flow" }> }) {
  need(Array.isArray(b.nodes), "flow needs nodes");
  const edges = Array.isArray(b.edges) ? b.edges : [];
  const labelOf = new Map(b.nodes.map((n) => [String(n.id), n.label]));
  return (
    <ol className="pwd-flow">
      {b.nodes.map((n, i) => {
        const out = edges.filter((e) => String(e.from) === String(n.id));
        return (
          <li key={i} className="pwd-flow-node">
            <span className="pwd-flow-label">{str(n.label)}</span>
            <span className="pwd-flow-id">id {str(n.id)}</span>
            {out.length > 0 && (
              <ul className="pwd-flow-edges">
                {out.map((e, k) => (
                  <li key={k}>
                    → {labelOf.has(String(e.to)) ? labelOf.get(String(e.to)) : <em className="pwd-missing">unknown node {str(e.to)}</em>}
                    {e.label ? <span className="pwd-flow-edge-label"> ({e.label})</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Matrix({ b }: { b: Extract<Block, { type: "matrix" }> }) {
  need(Array.isArray(b.rows) && Array.isArray(b.cols) && Array.isArray(b.cells), "matrix needs rows, cols and cells");
  const hasRowLabels = b.rows.some((r) => r);
  const hasColLabels = b.cols.some((c) => c);
  const template = hasRowLabels ? `minmax(56px,auto) repeat(${b.cols.length}, minmax(0,1fr))` : `repeat(${b.cols.length}, minmax(0,1fr))`;
  return (
    <div className="pwd-matrix">
      {b.xAxis && <div className="pwd-axis">{b.xAxis}</div>}
      <div className="pwd-matrix-body">
        {b.yAxis && <div className="pwd-axis pwd-axis-y">{b.yAxis}</div>}
        <div className="pwd-matrix-grid" style={{ gridTemplateColumns: template }}>
          {hasColLabels && (
            <>
              {hasRowLabels && <div />}
              {b.cols.map((c, i) => (
                <div key={`c${i}`} className="pwd-matrix-head">{c}</div>
              ))}
            </>
          )}
          {b.rows.map((r, ri) => (
            <MatrixRow key={ri} label={r} showLabel={hasRowLabels} cells={b.cells[ri]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatrixRow({ label, showLabel, cells }: { label: string; showLabel: boolean; cells: (string | null)[] | undefined }) {
  need(Array.isArray(cells), "matrix has fewer cell rows than rows");
  return (
    <>
      {showLabel && <div className="pwd-matrix-rowhead">{label}</div>}
      {cells.map((c, ci) => (
        <div key={ci} className="pwd-matrix-cell">{str(c)}</div>
      ))}
    </>
  );
}

function Funnel({ b }: { b: Extract<Block, { type: "funnel" }> }) {
  need(Array.isArray(b.stages), "funnel needs stages");
  const n = Math.max(b.stages.length - 1, 1);
  return (
    <div className="pwd-funnel">
      {b.stages.map((s, i) => (
        <div key={i} className="pwd-funnel-stage" style={{ width: `${100 - i * (55 / n)}%` }}>
          {str(s)}
        </div>
      ))}
    </div>
  );
}

function Chart({ b }: { b: Extract<Block, { type: "chart" }> }) {
  need(Array.isArray(b.series), "chart needs series");
  const xs: string[] = [];
  for (const s of b.series) {
    need(s && Array.isArray(s.points), "chart series needs points");
    for (const p of s.points) {
      need(Array.isArray(p), "chart point must be [x, y]");
      if (!xs.includes(str(p[0]))) xs.push(str(p[0]));
    }
  }
  return (
    <div className="pwd-chart">
      <div className="pwd-meta">
        Chart: {b.chart_kind || "unknown kind"}
        {b.xLabel ? ` · x: ${b.xLabel}` : ""}
        {b.yLabel ? ` · y: ${b.yLabel}` : ""}
      </div>
      <div className="pwd-scroll">
        <table className="pwd-table">
          <thead>
            <tr>
              <th scope="col">{b.xLabel || "x"}</th>
              {b.series.map((s, i) => (
                <th key={i} scope="col">{str(s.name)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {xs.map((x) => (
              <tr key={x}>
                <th scope="row">{x}</th>
                {b.series.map((s, i) => {
                  const p = s.points.find((pt) => str(pt[0]) === x);
                  return <td key={i}>{p ? (p[1] === null ? <em className="pwd-missing">not printed</em> : str(p[1])) : ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Table({ b }: { b: Extract<Block, { type: "table" }> }) {
  need(Array.isArray(b.header) && Array.isArray(b.rows), "table needs header and rows");
  // Ragged rows are shown as-is (not padded) so the fault stays visible.
  return (
    <div className="pwd-scroll">
      <table className="pwd-table">
        <thead>
          <tr>
            {b.header.map((h, i) => (
              <th key={i} scope="col">{str(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((r, ri) => {
            need(Array.isArray(r), "table row is not a list");
            return (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td key={ci}>{str(c)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Other({ b }: { b: Extract<Block, { type: "other" }> }) {
  return (
    <div>
      <p className="pwd-desc">{str(b.description)}</p>
      {Array.isArray(b.labels) && b.labels.length > 0 && (
        <ul className="pwd-labels">
          {b.labels.map((l, i) => (
            <li key={i}>{str(l)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Body({ block }: { block: unknown }) {
  need(block && typeof block === "object" && !Array.isArray(block), "block is not a JSON object");
  const b = block as Block;
  let inner: ReactNode;
  switch (b.type) {
    case "issue_tree": inner = <IssueTree b={b} />; break;
    case "flow": inner = <Flow b={b} />; break;
    case "matrix": inner = <Matrix b={b} />; break;
    case "funnel": inner = <Funnel b={b} />; break;
    case "chart": inner = <Chart b={b} />; break;
    case "table": inner = <Table b={b} />; break;
    case "other": inner = <Other b={b} />; break;
    default: throw new BlockError(`unknown type ${JSON.stringify((b as { type?: unknown }).type)}`);
  }
  const notes = Array.isArray(b.notes) ? b.notes : [];
  return (
    <figure className="pwd" aria-label={b.title ? `Diagram: ${b.title}` : `Diagram (${b.type})`}>
      <div className="pwd-head">
        <span className="pwd-type">{b.type.replace("_", " ")}</span>
        {b.title && <figcaption className="pwd-title">{b.title}</figcaption>}
      </div>
      {inner}
      {notes.length > 0 && (
        <ul className="pwd-notes">
          {notes.map((n, i) => (
            <li key={i}>{str(n)}</li>
          ))}
        </ul>
      )}
    </figure>
  );
}

// Cheap shape check before drawing, so a malformed block falls back without relying on
// the error boundary (which also catches anything this misses). Returns a reason or null.
const isArr = Array.isArray;
function shapeProblem(block: unknown): string | null {
  if (!block || typeof block !== "object" || isArr(block)) return "block is not a JSON object";
  const b = block as Record<string, unknown>;
  switch (b.type) {
    case "issue_tree":
      return b.root && typeof b.root === "object" ? null : "issue_tree needs root";
    case "flow":
      return isArr(b.nodes) && b.nodes.every((n) => n && typeof n === "object") ? null : "flow needs a list of nodes";
    case "matrix":
      if (!isArr(b.rows) || !isArr(b.cols) || !isArr(b.cells)) return "matrix needs rows, cols and cells";
      if (b.cells.length < b.rows.length || !b.cells.every(isArr)) return "matrix has fewer cell rows than rows";
      return null;
    case "funnel":
      return isArr(b.stages) ? null : "funnel needs stages";
    case "chart":
      return isArr(b.series) && b.series.every((s) => s && isArr((s as { points?: unknown }).points) && (s as { points: unknown[] }).points.every(isArr))
        ? null
        : "chart needs series of [x, y] points";
    case "table":
      return isArr(b.header) && isArr(b.rows) && b.rows.every(isArr) ? null : "table needs header and rows (lists)";
    case "other":
      return null;
    default:
      return `unknown type ${JSON.stringify(b.type)}`;
  }
}

export function DiagramFallback({ raw, reason }: { raw: string; reason?: string | null }) {
  return (
    <div className="pwd pwd-fallback" role="note">
      <div className="pwd-fallback-title">Can't draw this block{reason ? `: ${reason}` : ""}</div>
      <pre className="pwd-json">{raw}</pre>
    </div>
  );
}

interface BoundaryProps {
  raw: string;
  children: ReactNode;
}
class DiagramBoundary extends Component<BoundaryProps, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : "render error" };
  }
  render() {
    if (this.state.error) return <DiagramFallback raw={this.props.raw} reason={this.state.error} />;
    return this.props.children;
  }
}

export default function PlacewiseDiagram({ block }: { block: unknown }) {
  let raw: string;
  try {
    raw = JSON.stringify(block, null, 2) ?? String(block);
  } catch {
    raw = String(block);
  }
  const problem = shapeProblem(block);
  if (problem) return <DiagramFallback raw={raw} reason={problem} />;
  return (
    <DiagramBoundary key={raw} raw={raw}>
      <Body block={block} />
    </DiagramBoundary>
  );
}
