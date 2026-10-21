import json,pathlib
from fontTools.ttLib import TTFont
p=pathlib.Path(__file__).resolve().parents[1]/'fixtures/smoke'
f=TTFont(p/'fonts/StudioCJK.woff2');cmap=f.getBestCmap();j=json.loads((p/'timeline.json').read_text());missing=[c for c in j['title'] if ord(c) not in cmap]
assert not missing, f'missing glyphs: {missing}'
print('PASS: all Chinese test-film glyphs present in self-hosted OFL font')
