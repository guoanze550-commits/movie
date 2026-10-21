import json,sys,subprocess,pathlib,math,re
from PIL import Image,ImageStat,ImageChops
p=pathlib.Path(sys.argv[1]);w,h=map(int,sys.argv[2].split('x'));fps=int(sys.argv[3]);out=p/'out'
checks={};manual=['艺术质量、风格符合度和声音主观听感','正式片动作表演、字幕遮挡主体、史实与素材授权逐项审核']
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'final.mp4')]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
j=json.loads((p/'project.json').read_text());ev=json.loads((p/'events.json').read_text())
checks['dimensions']=v['width']==w and v['height']==h
checks['fps']=abs(float(v['r_frame_rate'].split('/')[0])/float(v['r_frame_rate'].split('/')[1])-fps)<.01
checks['codecs']=v['codec_name']=='h264' and a['codec_name']=='aac' and v['pix_fmt']=='yuv420p'
checks['duration']=abs(float(probe['format']['duration'])-j['duration'])<=1/fps+.05
checks['av_sync']=abs(float(v['duration'])-float(a['duration']))<.1
checks['timeline']=abs(ev['dur']-j['duration'])<.001
run(['ffmpeg','-v','error','-i',str(out/'final.mp4'),'-f','null','-']);checks['full_decode']=True
black=run(['ffmpeg','-hide_banner','-i',str(out/'final.mp4'),'-vf','blackdetect=d=0.04:pix_th=0.02','-an','-f','null','-'])
checks['no_black_intervals']='black_start:' not in black.stderr
images=list((p/'stills').glob('*.jpg'));checks['sample_count']=len(images)>=3
means=[ImageStat.Stat(Image.open(i).convert('RGB')).mean for i in images]
checks['nonblank_samples']=all(max(m)-min(m)>2 and sum(m)/3>5 for m in means)
frames=[Image.open(i).convert('RGB') for i in images]
checks['motion_present']=len(frames)>1 and any(ImageChops.difference(frames[0],f).getbbox() is not None for f in frames[1:])
if (p/'subtitles.json').exists():
    cues=json.loads((p/'subtitles.json').read_text());checks['subtitle_timing']=bool(cues) and all(0<=x['t0']<x['t1']<=j['duration'] and x['t1']-x['t0']>=max(1.8,len(x['text'])/4.5+1.5) for x in cues)
    checks['subtitle_export']=(out/'subtitles.srt').stat().st_size>0
loud=run(['ffmpeg','-hide_banner','-i',str(out/'final.mp4'),'-af','ebur128=peak=true','-vn','-f','null','-']);(out/'loudness.log').write_text(loud.stderr)
matches=re.findall(r'I:\s+(-?[0-9.]+) LUFS',loud.stderr); peaks=re.findall(r'Peak:\s+(-?[0-9.]+) dBFS',loud.stderr)
checks['loudness']=bool(matches) and -15<=float(matches[-1])<=-13
checks['true_peak']=bool(peaks) and float(peaks[-1])<=-1
report={'checks':checks,'passed':all(checks.values()),'streams':probe,'manual_review_required':manual,'not_tested':['正式作品未制作；配音与 ASR 尚未验收','GitHub Actions 运行与 Artifacts 需远程验证'],'loudness_log':'loudness.log'}
(out/'quality.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(checks,ensure_ascii=False));sys.exit(0 if all(checks.values()) else 1)
