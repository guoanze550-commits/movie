import sys,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
try:
    rel=pathlib.Path(sys.argv[1]);profile=sys.argv[2]
    if rel.is_absolute() or '..' in rel.parts: raise ValueError('project must be relative, without traversal')
    p=(root/rel).resolve()
    if not p.is_relative_to(root/'films') and p!=root/'fixtures/smoke': raise ValueError('project must be in films/')
    j=json.loads((p/'project.json').read_text())
    if j.get('style') in [None,'unselected']: raise ValueError('请先由用户选择风格，禁止提前渲染')
    if j.get('status') in ['awaiting_style','awaiting_custom_style_review']: raise ValueError('风格审核未完成')
    if profile not in ['preview','production']: raise ValueError('profile must be preview or production')
    if not (p/'index.html').is_file() or not (p/'mix.py').is_file(): raise ValueError('需要已完成的 index.html 和 mix.py；项目生成器不自动编造影片')
    w,h=int(j['width']),int(j['height']);fps=int(j['fps'])
    if min(w,h)<16 or max(w,h)>8192 or w%2 or h%2 or fps not in [24,25,30,60]: raise ValueError('invalid render dimensions / fps')
    if profile=='preview':
        scale=min(1,640/max(w,h));w=max(16,round(w*scale/2)*2);h=max(16,round(h*scale/2)*2)
    print(f'{w}x{h} {fps}')
except (ValueError,KeyError,FileNotFoundError) as e:
    print(str(e),file=sys.stderr);sys.exit(1)
