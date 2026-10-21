import os,urllib.request,urllib.parse,json,time
base=os.environ['STUDIO_PAGE_URL'].rstrip('/')+'/'
assert urllib.parse.urlsplit(base).scheme=='https'
for attempt in range(6):
    try:
        with urllib.request.urlopen(base,timeout=20) as r:assert r.status==200 and 'Movie' in r.read().decode()
        with urllib.request.urlopen(urllib.parse.urljoin(base,'public/catalog.json'),timeout=20) as r:assert len(json.load(r))==51
        print(f'::notice title=Studio website verified::HTTP 200 and all 51 styles confirmed at {base}')
        break
    except Exception:
        if attempt==5:raise
        time.sleep(5)
