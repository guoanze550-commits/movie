"""Collect generated outputs, including nested film review projects."""
import pathlib, shutil
root=pathlib.Path(__file__).resolve().parents[1]
dest=root/'_artifacts';dest.mkdir(exist_ok=True)
for base in ['fixtures','films']:
    for src in (root/base).rglob('*'):
        if src.name not in {'out','stills'} or not src.is_dir():continue
        if any(p.is_symlink() for p in [src,*src.parents]):continue
        if any(p.name in {'out','stills'} for p in src.relative_to(root/base).parents):continue
        shutil.copytree(src,dest/src.relative_to(root),dirs_exist_ok=True)
if (root/'reports').exists():shutil.copytree(root/'reports',dest/'reports',dirs_exist_ok=True)
