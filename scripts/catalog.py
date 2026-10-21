"""Extract official metadata and full normative sections without paraphrasing them."""
import json, re, pathlib, hashlib, subprocess, shutil
ROOT = pathlib.Path(__file__).resolve().parents[1]
LIB = ROOT / 'upstream/lemo-opuscar'
SHA = subprocess.check_output(['git','-C',str(LIB),'rev-parse','HEAD'],text=True).strip()
items = []
for p in sorted((LIB/'styles').glob('*/style.json')):
    if p.parent.name.startswith('_'): continue
    item = json.loads(p.read_text())
    text = (p.parent/'STYLE.md').read_text()
    sections = dict((int(n), body.strip()) for n,body in re.findall(r'^## (\d+)\.[^\n]*\n(.*?)(?=^## |\Z)', text, re.M|re.S))
    item.update(description=sections.get(1,''), colors=sections.get(3,''), motion=sections.get(5,''), camera=sections.get(6,''), sound=sections.get(7,''), requirements=sections.get(10,''), materials=sections.get(2,''), style_text=text, style_sha256=hashlib.sha256(text.encode()).hexdigest(), upstream_commit=SHA,
                style_path=f'upstream/lemo-opuscar/styles/{item["slug"]}/STYLE.md',
                style_url=f'https://github.com/lemomo-ai/lemo-opuscar/blob/{SHA}/styles/{item["slug"]}/STYLE.md',
                preview_video=f'https://lemomo-ai.github.io/lemo-opuscar/films/{item["slug"]}.mp4',
                preview_image=f'public/posters/{item["slug"]}.jpg',
                official_demo=f'https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/{item["slug"]}.mp4')
    poster=p.parent/'poster.jpg'
    dest=ROOT/'studio/public/posters'/poster.name
    dest=dest.parent/f'{item["slug"]}.jpg'; dest.parent.mkdir(parents=True,exist_ok=True)
    if poster.exists(): shutil.copyfile(poster,dest)
    else: item['preview_image']=''
    items.append(item)
assert len(items)==51, f'Expected 51 official styles, got {len(items)}'
index=(LIB/'styles/README.md').read_text()
assert all(f']({x["slug"]}/STYLE.md)' in index for x in items)
items.sort(key=lambda x:(index.index(f']({x["slug"]}/STYLE.md)')))
for target in ['styles/catalog.json','studio/public/catalog.json']:
    (ROOT/target).write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print(f'Catalog: {len(items)} official styles, pinned to {SHA}')
