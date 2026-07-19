import json

with open(r"D:\DEV\GangNam_On\docs\ppt_analysis.json", encoding="utf-8") as f:
    data = json.load(f)

lines = []
for ppt in data:
    lines.append(f"\n{'='*70}\n{ppt.get('filename')} — {ppt.get('slide_count')} slides\n{'='*70}")
    for s in ppt.get("slides", []):
        lines.append(f"\n[Slide {s['index']:02d}]")
        for t in s["all_text"]:
            lines.append(t)
        # colors used
        colors = set()
        for sh in s["shapes"]:
            if sh.get("fill_color"):
                colors.add(sh["fill_color"])
            for p in sh.get("paragraphs", []):
                if p.get("color"):
                    colors.add(p["color"])
        if colors:
            lines.append(f"  (colors: {', '.join(sorted(colors))})")

with open(r"D:\DEV\GangNam_On\docs\ppt_summary.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("done")
