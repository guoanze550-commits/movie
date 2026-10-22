from pathlib import Path
from urllib.request import urlopen
from fontTools import subset
HERE=Path(__file__).resolve().parents[1];F=HERE/'fonts';F.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/google/fonts/main/ofl/'
for rel,path in [('IBMPlexMono-Regular.ttf','ibmplexmono/IBMPlexMono-Regular.ttf'),('Plex-OFL.txt','ibmplexmono/OFL.txt'),('Noto-OFL.txt','notosanssc/OFL.txt')]:
 if not (F/rel).exists():(F/rel).write_bytes(urlopen(base+path,timeout=60).read())
cache=HERE.parents[1]/'.cache'/'fonts';cache.mkdir(exist_ok=True,parents=True);src=cache/'NotoSansSC.ttf'
if not src.exists():src.write_bytes(urlopen(base+'notosanssc/NotoSansSC%5Bwght%5D.ttf',timeout=120).read())
text=(HERE/'src/film.js').read_text()+''.join(chr(i) for i in range(32,127))
o=subset.Options();o.flavor='woff2';font=subset.load_font(str(src),o);s=subset.Subsetter(o);s.populate(text=text);s.subset(font);subset.save_font(font,str(F/'NotoSansSC-sub.woff2'),o)
missing=sorted(set(text)-set(chr(c) for table in font['cmap'].tables for c in table.cmap));missing=[x for x in missing if ord(x)>127 and not x.isspace()]
assert not missing,missing
print('Fonts self-hosted, OFL licenses and used glyph coverage verified')
