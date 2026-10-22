"""Original LiDAR instrument score. No narration or borrowed recordings."""
from pathlib import Path
import os,sys,json,subprocess,shutil
import numpy as np
import soundfile as sf
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(Path(os.environ['LIB'])/'core/audio'))
from sfx import SR,noise,lp,bp,norm,add,thump
T=json.loads(subprocess.check_output(['node','--input-type=module','-e','import {T} from '+json.dumps((HERE/'timeline.js').as_uri())+';console.log(JSON.stringify(T))'],text=True))
n=round(T['duration']*SR);t=np.arange(n)/SR;music=np.zeros((n,2));foley=music.copy();amb=music.copy()
fade=np.minimum(t/.3,1)*np.minimum((T['duration']-t)/.4,1)
# Low-passed detuned pad with audible upper harmonics, not sub-only rumble.
bed=sum(np.sin(2*np.pi*f*t)*a for f,a in [(146.832,.034),(147.17,.023),(220,.016),(293.664,.009)])
dip=np.ones(n);a,b=T['silence'];dip=np.where((t>a)&(t<b),.025,dip);dip*=fade
music[:]=(bed*dip)[:,None]
wind=norm(lp(noise(T['duration']),950))*.014*fade;amb[:]=wind[:,None]
for e in T['events']:
    dur=.8;x=np.arange(round(dur*SR))/SR;f=440*2**((e['midi']-69)/12)
    if e['type']=='condense':
        sound=thump(v=.11,f=65);add(foley,sound,e['t']);xx=np.arange(round(2*SR))/SR
        note=sum(np.sin(2*np.pi*293.664*k*xx)*np.exp(-xx*(1.4+k*.8))/k**1.6 for k in range(1,6))*.025;add(music,note,e['t']+.09)
    else:
        fm=np.sin(2*np.pi*f*x+1.4*np.sin(2*np.pi*f*1.997*x)*np.exp(-x*8))*np.exp(-x*7)*np.minimum(x/.008,1)*.027
        add(foley,fm,e['t'],pan=-.2 if e['t']<3 else .2)
# A sweep follows the exact front interval, no free-running random crackle.
a,b=T['scanStart'],T['scanEnd'];d=b-a;x=np.arange(round(d*SR))/SR
sweep=norm(bp(noise(d),550,3900))*np.sin(np.pi*x/d)**2*.022;add(foley,sweep,a)
out=HERE/'out';out.mkdir(exist_ok=True)
for name,w in [('music',music),('foley',foley),('ambience',amb),('mix',music+foley+amb)]:sf.write(out/f'{name}.wav',w,SR,subtype='PCM_24')
(out/'timeline.json').write_text(json.dumps(T,indent=2)+'\n');shutil.copytree(HERE/'frames',out/'keyframes',dirs_exist_ok=True)
for f in ['TREATMENT.md','TECHNICAL.md','FACTS.md','CREDITS.md']:
 if (HERE/f).exists():shutil.copy2(HERE/f,out/f)
