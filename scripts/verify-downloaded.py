"""Validate the MP4 actually downloaded from GitHub's artifact service, not the build copy."""
import pathlib,sys,subprocess,json,hashlib
root=pathlib.Path(sys.argv[1]);films=list(root.glob('**/out/final.mp4'))
assert films,'Downloaded artifact has no final MP4'
for film in films:
    quality=json.loads((film.parent/'quality.json').read_text());assert quality['passed'],'Downloaded quality report did not pass'
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True))
    assert any(s['codec_type']=='video' and s['codec_name']=='h264' for s in data['streams'])
    assert any(s['codec_type']=='audio' and s['codec_name']=='aac' for s in data['streams'])
    subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
    digest=hashlib.sha256(film.read_bytes()).hexdigest()
    print(f'::notice title=Artifact bundle verified::Validated {film.as_posix()}, H.264/AAC full decode passed, SHA256 {digest}')
