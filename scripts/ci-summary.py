"""Publish only this project's captured test output, never process environment or credentials."""
import os,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
summary=os.environ.get('GITHUB_STEP_SUMMARY')
if summary:
    lines=[]
    for name in ['ci-validation.log']:
        p=root/'reports'/name
        if p.exists():lines.extend(p.read_text(errors='replace').splitlines()[-160:])
    with open(summary,'a') as f:f.write('## Actual validation output\n\n```text\n'+'\n'.join(lines).replace('```','~~~')+'\n```\n')

# GitHub exposes annotations on the public run page even when detailed logs require login.
# Publish only the explicitly captured test output of this public source project.
p=root/'reports/ci-validation.log'
if p.exists():
    excerpt='\n'.join(p.read_text(errors='replace').splitlines()[-100:])[-14000:]
    escaped=excerpt.replace('%','%25').replace('\r','%0D').replace('\n','%0A')
    print('::notice title=Validation diagnostic::'+escaped)
