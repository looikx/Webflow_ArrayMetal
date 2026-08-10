import re
import os

path = os.path.join(os.environ.get("TEMP", "/tmp"), "atkore-tray.html")
with open(path, "r", encoding="utf-8", errors="replace") as f:
    html = f.read()
print("len", len(html))
for pat in [
    "Filter By",
    "Clear All",
    "Sort By",
    "facet",
    "salsify",
    "algolia",
    "Product Type",
    "Material",
    "results",
    "coveo",
    "constructor",
]:
    print(pat, html.lower().count(pat.lower()))

srcs = re.findall(r'src="([^"]+)"', html)
for s in srcs:
    if any(x in s.lower() for x in ["search", "product", "facet", "algolia", "salsify", "catalog", "coveo"]):
        print("SRC", s)

m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html)
if m:
    print("NEXT_DATA len", len(m.group(1)))
    print(m.group(1)[:800])

for label in ["Filter By", "Clear All", "Sort By Default"]:
    i = html.find(label)
    if i >= 0:
        print("---", label, "---")
        print(html[max(0, i - 80) : i + 200])
