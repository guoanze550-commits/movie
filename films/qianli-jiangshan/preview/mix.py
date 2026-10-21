"""Original four-second sound sketch; official sfx synthesis and final mux."""
import os,sys,json,subprocess,shutil
from pathlib import Path
import numpy as np
import soundfile as sf
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(Path(os.environ['LIB'])/'core/audio'))
from sfx import SR,noise,bp,lp,add,norm
timeline=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {REVIEW} from "+json.dumps((HERE.parent/'timeline.js').as_uri())+";console.log(JSON.stringify(REVIEW))"],text=True))
n=round(timeline['duration']*SR);t=np.arange(n)/SR
music=np.zeros((n,2));foley=music.copy();ambience=music.copy()
# Original sustained open fifth and three gently plucked harmonics, not a guqin recording.
fade=np.minimum(t/.35,1)*np.minimum((4-t)/.35,1)
bed=.06*(np.sin(2*np.pi*146.832*t)+.45*np.sin(2*np.pi*220*t))*fade
music[:]=bed[:,None]
for note_data in timeline['sound_notes']:
    when,midi,dur,vel=[note_data[k] for k in ['t','midi','dur','velocity']]
    x=np.arange(round(dur*SR))/SR;hz=440*2**((midi-69)/12)
    note=sum(np.sin(2*np.pi*hz*k*x)*np.exp(-x*(1.3+k*.7))/k**1.6 for k in range(1,9))*np.minimum(x/.012,1)*vel
    add(music,note,when)
wind=norm(lp(noise(4),850))*.022*fade*(.2+.8*t/4)
ambience[:]=wind[:,None]
for event in timeline['events']:
    when=event['t']
    x=np.arange(round(.5*SR))/SR
    grit=norm(bp(noise(.5),1600,6500))*np.exp(-x*9)*np.minimum(x/.012,1)*.018
    add(foley,grit,when)
out=HERE/'out';out.mkdir(exist_ok=True)
for name,a in [('music',music),('foley',foley),('ambience',ambience),('mix',music+foley+ambience)]:sf.write(out/f'{name}.wav',a,SR,subtype='PCM_24')
(out/'sound-design.json').write_text(json.dumps({'original':True,'scope':'technical sketch only','events':[.5,1.5,3],'music':'synthetic open fifth and plucked harmonics','final_score_produced':False},indent=2))

(out/'timeline.json').write_text(json.dumps(timeline,indent=2))
shutil.copytree(HERE.parent/'frames',out/'style-frames',dirs_exist_ok=True)
