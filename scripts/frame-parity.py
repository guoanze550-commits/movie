import pathlib,json
from PIL import Image,ImageChops,ImageStat
p=pathlib.Path(__file__).resolve().parents[1]/'fixtures/smoke/out/parity';results={}
for preview in p.glob('preview-*.png'):
    a=Image.open(preview).convert('RGB');b=Image.open(p/preview.name.replace('preview-','production-')).convert('RGB').resize(a.size,Image.Resampling.LANCZOS)
    mae=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
    results[preview.stem]=mae
    assert mae<5, f'preview/production mismatch: {mae}'
assert len(results)==6
(p.parent/'parity.json').write_text(json.dumps({'passed':True,'mean_absolute_pixel_error':results,'note':'Normalized spatial layout parity only; artistic quality still requires manual review'},indent=2)+'\n')
print('PASS: first/middle/last/random frames match preview vs production within 5 pixel MAE')
