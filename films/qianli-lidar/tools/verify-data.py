from pathlib import Path
import numpy as np,json,hashlib
D=Path(__file__).resolve().parents[1];F=D/'data';m=json.loads((F/'manifest.json').read_text());counts=np.zeros(4,dtype=int);worst=0.;total=0
for c in m['chunks']:
 b=(F/c['points']).read_bytes();n=c['n'];assert len(b)==n*10;assert hashlib.sha256(b).hexdigest()==c['sha256'];total+=n
 q=np.frombuffer(b,dtype='<u2',count=n*3).reshape(-1,3);p=q*.01+c['offset'];cls=np.frombuffer(b,dtype='u1',count=n,offset=n*6);counts+=np.bincount(cls,minlength=4);assert cls.max()<=3
 sb=(F/c['surface']).read_bytes();g=c['grid'];assert len(sb)==g*g*10
 sq=np.frombuffer(sb,dtype='<u2',count=g*g*3).reshape(g,g,3);y=sq[:,:,1]*.01+c['offset'][1]
 a=p[cls==0];u=a[:,0]-c['offset'][0];v=a[:,2]-c['offset'][2];i=np.floor(u).astype(int);j=np.floor(v).astype(int);u-=i;v-=j
 assert i.min()>=0 and i.max()<80 and j.min()>=0 and j.max()<80
 a0=y[j,i];a1=y[j,i+1];b0=y[j+1,i];b1=y[j+1,i+1]
 yy=np.where(u+v<=1,a0+(a1-a0)*u+(b0-a0)*v,b1+(b0-b1)*(1-u)+(a1-b1)*(1-v))
 worst=max(worst,float(np.abs(yy-a[:,1]).max()))
assert total==m['point_count'];assert worst<.02
result={'scope':'art model data, NOT a geographic survey','checks':{'binary_hashes':True,'declared_point_count':True,'art_classes':True,'ground_surface_coincidence':worst<.02,'sixty_spatial_pages':len(m['chunks'])==60},'points':total,'class_counts':counts.tolist(),'max_ground_to_triangle_error_model_m':worst,'quantization_max_axis_error_model_m':m['quantization_max_axis_error_m']}
(D/'qa/data.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
