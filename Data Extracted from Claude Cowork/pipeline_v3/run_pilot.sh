#!/bin/bash
# Runs the 3-file extraction pilot on this Mac (needs internet access to Google's Gemini API).
set -e
cd "$(dirname "$0")"
D="../Data"
python3 -m pip install --quiet --user pypdfium2 pillow
python3 extract.py --env "../../backend/.env" --out "../Pilot Output" --workers 4 --max-usd 6 \
  "$D/Consulting Files/PDF Files/IIM Calcutta Consulting CaseBook 2025-26.pdf" \
  "$D/Finance Files/PDF Files/7.Valuation by Damodaran.pdf" \
  "$D/Finance Files/PDF Files/Beta - CF Primer.pdf"
echo "Done. Results are in 'Pilot Output'."
