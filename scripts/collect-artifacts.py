"""Collect only generated outputs; never interpret workflow input as a shell expression."""
import pathlib,shutil
root=pathlib.Path(__file__).resolve().parents[1];dest=root/'_artifacts';dest.mkdir(exist_ok=True)
for base in ['fixtures','films']:
    for folder in (root/base).iterdir():
        if not folder.is_dir() or folder.is_symlink():continue
        for name in ['out','stills']:
            src=folder/name
            if src.is_dir() and not src.is_symlink():shutil.copytree(src,dest/base/folder.name/name,dirs_exist_ok=True)
if (root/'reports').exists():shutil.copytree(root/'reports',dest/'reports',dirs_exist_ok=True)
