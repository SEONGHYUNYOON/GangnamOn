"""IR PPT 디자인 요소 추출"""
import json
from collections import Counter

with open(r"D:\DEV\GangNam_On\docs\ppt_analysis.json", encoding="utf-8") as f:
    data = json.load(f)

ir = data[1]
colors = Counter()
fonts = Counter()
for slide in ir["slides"]:
    for sh in slide["shapes"]:
        if sh.get("fill_color"):
            colors[sh["fill_color"]] += 1
        for p in sh.get("paragraphs", []):
            if p.get("color"):
                colors[p["color"]] += 1
            if p.get("size_pt"):
                fonts[p["size_pt"]] += 1

print("IR fill/text colors (top):")
for c, n in colors.most_common(20):
    print(f"  {c}: {n}")

print("\nIR font sizes (top):")
for s, n in fonts.most_common(15):
    print(f"  {s}pt: {n}")

# first slide bg
s1 = ir["slides"][0]
for sh in s1["shapes"][:5]:
    print(sh.get("name"), sh.get("fill_color"), sh.get("width_in"), sh.get("height_in"))
