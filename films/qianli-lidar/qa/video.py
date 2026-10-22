"""Decode every frame independently with the system FFmpeg; no video rendering here."""
from pathlib import Path
import subprocess,json,hashlib,sys
import numpy as np
from PIL import Image,ImageDraw
D=Path(__file__).resolve().parents[1];O=D/'out';w,h=320,180
video=Path(sys.argv[1]) if len(sys.argv)>1 else O/'final.mp4'
p=subprocess.Popen(['/usr/bin/ffmpeg','-v','error','-i',str(video),'-vf',f'scale={w}:{h}','-pix_fmt','rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
frames=[]
while True:
 b=p.stdout.read(w*h*3)
 if not b:break
 assert len(b)==w*h*3;frames.append(np.frombuffer(b,dtype='u1').reshape(h,w,3).copy())
err=p.stderr.read().decode();assert p.wait()==0,err
A=np.stack(frames).astype(float)/255;delta=np.abs(np.diff(A,axis=0)).mean((1,2,3));means=A.mean((1,2,3));flashes=np.abs(np.diff(means,n=2));hashes=[hashlib.sha256(x.tobytes()).hexdigest() for x in frames]
checks={'all_168_frames_decoded':len(frames)==168,'no_duplicate_frames':len(set(hashes))==168,'no_cut_like_frame_jump':float(delta.max())<.22,'no_global_flash':float(flashes.max())<.06,'near_black_present':all(np.quantile(a.mean(2),.05)<.025 for a in A)}
# Entire clip represented at 0.2s intervals, not merely first/last frame.
indices=list(range(0,len(frames),5));cols=7;tw,th=320,180;sheet=Image.new('RGB',(cols*tw,((len(indices)+cols-1)//cols)*(th+22)),(5,8,10));draw=ImageDraw.Draw(sheet)
for k,i in enumerate(indices):
 x=k%cols*tw;y=k//cols*(th+22);sheet.paste(Image.fromarray(frames[i]),(x,y+22));draw.text((x+5,y+5),f'{i:03d} / {i/24:.3f}s',fill=(190,210,202))
sheet.save(O/'decoded-contact.jpg',quality=93)
report={'scope':'7-second technical visual test only','video':str(video),'checks':checks,'frames':len(frames),'max_mean_abs_frame_delta':float(delta.max()),'max_global_luma_second_difference':float(flashes.max()),'frame_mean_rgb':means.tolist(),'frame_deltas':delta.tolist(),'not_proven':['museum/exhibition-level art quality','complete absence of subpixel point shimmer','subjective sound and pacing at full speed']}
(O/'frame-continuity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(checks));assert all(checks.values())
