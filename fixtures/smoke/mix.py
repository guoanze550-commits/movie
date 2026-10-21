import json, os, sys
from pathlib import Path
import numpy as np
import soundfile as sf
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(Path(os.environ['LIB'])/'core/audio'))
from sfx import SR, click, add
j=json.loads((HERE/'timeline.json').read_text()); n=int(j['duration']*SR); t=np.arange(n)/SR
music=np.zeros((n,2)); foley=np.zeros((n,2)); ambience=np.repeat((.055*np.sin(2*np.pi*180*t))[:,None],2,axis=1)
for i,e in enumerate(j['events']):
    x=np.arange(int(.7*SR))/SR
    note=.025*np.sin(2*np.pi*[440,554.365,659.255][i]*x)*np.exp(-x*8)*np.minimum(x/.01,1)
    k=int(e['t']*SR);music[k:k+len(note)]+=note[:,None]
    add(foley,click(v=.025),e['t'])
out=HERE/'out';out.mkdir(exist_ok=True)
for name,a in [('music',music),('foley',foley),('ambience',ambience),('mix',music+foley+ambience)]:sf.write(out/f'{name}.wav',a,SR,subtype='PCM_24')
