import re
from pathlib import Path

ROOT = Path(__file__).parent
SOURCES = ["reset.css", "layout.css", "components.css", "animations.css"]
OUTPUT = ROOT / "css" / "styles.min.css"


def minify(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


bundle = "\n".join(minify((ROOT / "css" / name).read_text(encoding="utf-8")) for name in SOURCES)
OUTPUT.write_text(bundle + "\n", encoding="utf-8")
print(f"{OUTPUT.name}: {len(bundle.encode('utf-8'))} bytes")
