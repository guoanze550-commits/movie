import pathlib,shutil
root=pathlib.Path(__file__).resolve().parents[1];target=root/'_site'
if target.exists():shutil.rmtree(target)
shutil.copytree(root/'studio',target)
(target/'.nojekyll').touch()
print('Static studio built into _site (no runtime API or secrets)')
