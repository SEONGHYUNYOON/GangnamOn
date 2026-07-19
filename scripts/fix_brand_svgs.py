# -*- coding: utf-8 -*-
import os

base = r"D:\DEV\GangNam_On\public\brand"

def sym(bg, fg):
    return (
        f'<g transform="translate(4 8)">'
        f'<rect width="48" height="48" rx="14" fill="{bg}"/>'
        f'<path d="M24 14.5v8.2" fill="none" stroke="{fg}" stroke-width="3.4" stroke-linecap="round"/>'
        f'<path d="M16.2 18.2a11.2 11.2 0 1 1 15.6 0" fill="none" stroke="{fg}" stroke-width="3.4" stroke-linecap="round"/>'
        f'<circle cx="24" cy="31.5" r="2.6" fill="{fg}" opacity=".92"/>'
        f"</g>"
    )

def word(gangnam, on, sub, neon=False):
    neon_def = (
        '<defs><filter id="gangnamNeon" x="-30%" y="-50%" width="160%" height="200%">'
        '<feDropShadow dx="0" dy="0" stdDeviation="1.4" flood-color="#5B8DEF" flood-opacity="0.38"/>'
        '<feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#5B8DEF" flood-opacity="0.16"/>'
        "</filter></defs>"
        if neon else ""
    )
    nf = ' filter="url(#gangnamNeon)"' if neon else ""
    return (
        f"{neon_def}"
        f'<text x="58" y="38" font-family="SUIT, Pretendard, system-ui, sans-serif" font-size="32" font-weight="800" letter-spacing="-0.03em">'
        f'<tspan fill="{gangnam}"{nf}>강남</tspan>'
        f'<tspan dx="1" fill="{on}" font-style="italic" font-weight="700">on</tspan>'
        f"</text>"
        f'<text x="58" y="56" font-family="SUIT, Pretendard, system-ui, sans-serif" font-size="11.5" font-weight="600" letter-spacing="0.1em" fill="{sub}">GangNam On</text>'
    )

files = {
    "gangnam-on-horizontal-light.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64" role="img" aria-label="강남ON">{sym("#111827","#C89B3C")}{word("#111827","#C89B3C","#64748B")}</svg>',
    "gangnam-on-horizontal-dark.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64" role="img" aria-label="강남ON">{sym("#F1F5F9","#111827")}{word("#F1F5F9","#D4A853","#94A3B8")}</svg>',
    "gangnam-on-horizontal-neon.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64" role="img" aria-label="강남ON">{sym("#111827","#C89B3C")}{word("#111827","#C89B3C","#64748B", True)}</svg>',
    "gangnam-on-horizontal-minimal.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64" role="img" aria-label="강남ON">{sym("#111827","#C89B3C")}{word("#111827","#C89B3C","#64748B")}</svg>',
    "gangnam-on-icon.svg": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="강남ON">'
        '<rect width="512" height="512" rx="112" fill="#111827"/>'
        '<path d="M256 154v87" fill="none" stroke="#C89B3C" stroke-width="36" stroke-linecap="round"/>'
        '<path d="M172 194a128 128 0 1 1 179 0" fill="none" stroke="#C89B3C" stroke-width="36" stroke-linecap="round"/>'
        '<circle cx="256" cy="336" r="28" fill="#C89B3C"/></svg>'
    ),
    "gangnam-on-icon-dark-bg.svg": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="강남ON">'
        '<rect width="512" height="512" rx="112" fill="#0C1220"/>'
        '<rect x="32" y="32" width="448" height="448" rx="96" fill="none" stroke="#C89B3C" stroke-width="4" opacity="0.25"/>'
        '<path d="M256 154v87" fill="none" stroke="#D4A853" stroke-width="36" stroke-linecap="round"/>'
        '<path d="M172 194a128 128 0 1 1 179 0" fill="none" stroke="#D4A853" stroke-width="36" stroke-linecap="round"/>'
        '<circle cx="256" cy="336" r="28" fill="#D4A853"/></svg>'
    ),
}

for name, content in files.items():
    with open(os.path.join(base, name), "w", encoding="utf-8") as f:
        f.write(content)
print("done")
