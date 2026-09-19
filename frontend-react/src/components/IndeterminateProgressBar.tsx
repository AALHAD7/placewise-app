// Visual "something is happening" affordance for waits with no real
// percentage to report (e.g. Skill page's problem generation, which is a
// single blocking response, not a streamed progress like Resume's question
// generation). Deliberately indeterminate rather than a fabricated percent -
// this project's convention is to never invent numbers that aren't real.

export default function IndeterminateProgressBar() {
  return (
    <div style={{ height: 6, borderRadius: 999, background: "#eceef2", overflow: "hidden", marginTop: 10 }}>
      <div className="indeterminate-bar-fill" style={{ height: "100%", width: "40%", borderRadius: 999, background: "#4F46E5" }}></div>
    </div>
  );
}
