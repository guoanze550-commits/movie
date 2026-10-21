"""Run the unmodified official Chinese voice tool through edge-tts's supported proxy option."""
import os,runpy,pathlib,functools,contextlib,io,re,sys
import edge_tts,importlib,ssl
# edge-tts pins certifi's context; extend it with the platform's provided CA,
# preserving certificate validation and hostname verification.
ca=os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
if ca:
    for module in ['edge_tts.communicate','edge_tts.voices']:
        context=importlib.import_module(module)._SSL_CTX
        context.load_verify_locations(cafile=ca)
        if context.verify_mode!=ssl.CERT_REQUIRED or not context.check_hostname:
            raise RuntimeError('TLS certificate and hostname verification must remain enabled')
proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy') or os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy')
if proxy:edge_tts.Communicate=functools.partial(edge_tts.Communicate,proxy=proxy)
buffer=io.StringIO()
try:
    with contextlib.redirect_stdout(buffer),contextlib.redirect_stderr(buffer):
        runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1]/'upstream/lemo-opuscar/core/tts/tts_zh.py'),run_name='__main__')
finally:
    # Keep proxy credentials and transient signed URL parameters out of diagnostic output.
    def redact(match):
        from urllib.parse import urlsplit
        try:return urlsplit(match.group()).hostname or '[URL]'
        except ValueError:return '[URL]'
    print(re.sub(r'https?://[^\s]+',redact,buffer.getvalue()),end='')
