import { useState, type ChangeEvent } from "react";

// Local open/query UI state shared by every searchable dropdown (Role,
// Company, the dependent role-in-company picker, Tone Shifter's 3 plain
// selectors). Each page computes its own filtered options/free-text
// injection/pick side effects (they differ too much - see companySelector()
// vs roleSelector() vs lightSelector() in frontend/index.html - to force
// through one generic hook), but they all share this same open/query
// mechanics plus reset-after-pick.
export function useSelectorOpenState() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  return {
    open,
    query,
    toggle: () => setOpen((o) => !o),
    onQuery: (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    reset: () => {
      setOpen(false);
      setQuery("");
    }
  };
}
