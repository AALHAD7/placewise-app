// Ported from frontend/index.html's .feature-card usage (lines 386-411),
// rendered as a real <button> (it is a control, not a decorative box) so it
// is reachable by keyboard, shows a focus ring and can take a press state.
// CSS at global.css's .feature-card/.fc-icon block. iconClass is one of the
// 6 color variants defined there.

export type IconClass = "icon-purple" | "icon-blue" | "icon-green" | "icon-amber" | "icon-pink" | "icon-cyan";

interface FeatureCardProps {
  name: string;
  body: string;
  iconClass: IconClass;
  iconPath: string;
  wide?: boolean;
  onClick: () => void;
}

export default function FeatureCard({ name, body, iconClass, iconPath, wide, onClick }: FeatureCardProps) {
  return (
    <button type="button" className={"unbutton feature-card" + (wide ? " wide" : "")} onClick={onClick}>
      <div className={"fc-icon " + iconClass}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>
      {wide ? (
        <div className="fc-body">
          <div className="feature-title">{name}</div>
          <div className="feature-desc" style={{ marginBottom: 0 }}>
            {body}
          </div>
        </div>
      ) : (
        <>
          <div className="feature-title">{name}</div>
          <div className="feature-desc">{body}</div>
          <div className="feature-open">
            Open
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </>
      )}
      {wide && (
        <div className="feature-open" style={{ flexShrink: 0, alignSelf: "center" }}>
          Open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      )}
    </button>
  );
}
