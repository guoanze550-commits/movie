"""Verify the compatibility route preserves official rejection of truncated audio."""
import os,pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='movie-corrupt-wav-') as d:
    d=pathlib.Path(d);source=root/'fixtures/smoke/out/mix.wav';damaged=d/'truncated.wav';raw=source.read_bytes();damaged.write_bytes(raw[:len(raw)//2])
    env=os.environ.copy();env['PATH']=str(root/'.cache/ffmpeg/bin')+os.pathsep+env['PATH']
    result=subprocess.run(['sh',str(root/'upstream/lemo-opuscar/core/render/mux.sh'),str(root/'fixtures/smoke/out/video.mp4'),str(damaged),str(d/'invalid.mp4'),'24','0'],env=env,capture_output=True,text=True)
    assert result.returncode!=0, 'official mux must reject real truncation'
    assert not (d/'invalid.mp4').exists(),'must not emit a partial final file'
    assert any(s in result.stderr for s in ['cut off','damaged','could not','cannot read']), result.stderr
print('PASS: real truncated WAV rejected by original mux with the pinned FFmpeg route')
