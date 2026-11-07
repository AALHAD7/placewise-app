import asyncio
import markdown
from playwright.async_api import async_playwright

def build_html():
    with open('PLACEWISE_SYSTEM_OVERVIEW.md', 'r', encoding='utf-8') as f:
        text = f.read()

    html_body = markdown.markdown(text, extensions=['tables', 'fenced_code'])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PlaceWise: Architectural & Operational Overview</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }}

  h1 {{
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.025em;
    margin-top: 0;
    margin-bottom: 4px;
    line-height: 1.25;
  }}

  h1 + p {{
    font-size: 11pt;
    font-weight: 600;
    color: #2563eb;
    margin-top: 0;
    margin-bottom: 14px;
  }}

  h2 {{
    font-size: 13pt;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 22px;
    margin-bottom: 10px;
    break-after: avoid;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 11pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 16px;
    margin-bottom: 6px;
    break-after: avoid;
    page-break-after: avoid;
  }}

  p, li {{
    color: #334155;
    margin-top: 0;
    margin-bottom: 8px;
  }}

  ul, ol {{
    padding-left: 20px;
    margin-top: 0;
    margin-bottom: 10px;
  }}

  li {{
    margin-bottom: 4px;
  }}

  strong {{
    font-weight: 700;
    color: #0f172a;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 18px 0;
  }}

  pre {{
    background: #0d1117;
    color: #e6edf3;
    padding: 12px 14px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', Courier, monospace;
    font-size: 7.5pt;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre;
    margin: 12px 0;
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #30363d;
  }}

  code {{
    font-family: 'JetBrains Mono', Courier, monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1.5px 4px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: 7.5pt;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    break-inside: avoid;
    page-break-inside: avoid;
    font-size: 9pt;
  }}

  th, td {{
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
  }}

  th {{
    background: #f8fafc;
    font-weight: 700;
    color: #0f172a;
  }}

  blockquote {{
    margin: 12px 0;
    padding: 8px 14px;
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    color: #334155;
    break-inside: avoid;
    page-break-inside: avoid;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

async def main():
    html_content = build_html()
    with open('/tmp/overview.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('file:///tmp/overview.html', wait_until='networkidle')
        await page.pdf(
            path='PLACEWISE_SYSTEM_OVERVIEW.pdf',
            format='A4',
            margin={'top': '20mm', 'bottom': '20mm', 'left': '16mm', 'right': '16mm'},
            print_background=True,
            display_header_footer=True,
            header_template='<div style="font-size: 7.5pt; font-family: -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;"><span>PlaceWise: System Architecture Overview</span><span>November 2026</span></div>',
            footer_template='<div style="font-size: 7.5pt; font-family: -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;"><span>Aalhad (MBA Candidate, IIM Trichy)</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
        )
        await browser.close()
        print('PLACEWISE_SYSTEM_OVERVIEW.pdf generated successfully!')

if __name__ == '__main__':
    asyncio.run(main())
