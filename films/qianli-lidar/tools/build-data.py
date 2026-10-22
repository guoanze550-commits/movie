"""Original art reconstruction. No survey data, no geographic/geodetic claims."""
from pathlib import Path
import numpy as np, json, hashlib
from scipy.ndimage import gaussian_filter
HERE=Path(__file__).resolve().parents[1];OUT=HERE/'data';OUT.mkdir(exist_ok=True)
R=np.random.default_rng(82177)
def noise(x,z,scale,seed):
    a=x/scale;b=z/scale;i=np.floor(a);j=np.floor(b);u=a-i;v=b-j;u=u*u*(3-2*u);v=v*v*(3-2*v)
    def h(ii,jj):return np.mod(np.sin(ii*127.1+jj*311.7+seed*23.13)*43758.5453,1)
    return ((h(i,j)*(1-u)+h(i+1,j)*u)*(1-v)+(h(i,j+1)*(1-u)+h(i+1,j+1)*u)*v)*2-1

def river(z):return 18*np.sin(z*.012)+10*np.sin(z*.029+.4)
def height_raw(x,z):
    # Domain-warped erosion ridges, varied asymmetric massifs and a continuous incised valley.
    wx=x+noise(x,z,85,8)*19;wz=z+noise(x,z,92,15)*25
    spine=np.zeros_like(np.asarray(x,dtype=float))
    for cx,cz,sx,sz,hh in [(-104,98,66,74,115),(118,170,76,113,160),(-126,275,73,95,172),(105,370,72,120,140),(-105,490,93,115,163),(151,555,84,116,156),(-180,640,85,97,112)]:
        dx=(wx-cx)/sx;dz=(wz-cz)/sz;spine=np.maximum(spine,hh*np.exp(-(dx*dx+dz*dz)*.62))
    f=np.zeros_like(spine);ridge=np.zeros_like(spine)
    for k in range(6):
        n=noise(wx,wz,76/(2**k),k+91);f+=n*14/(1.85**k);ridge+=(1-np.abs(n))*9/(1.9**k)
    bank=np.clip((np.abs(x-river(z))-10)/39,0,1);bank=bank*bank*(3-2*bank)
    h=2+(spine+f+ridge)*bank
    # Small terraces/cliff channels, varying along both horizontal directions.
    erosion=np.sin(wz*.075+noise(wx,wz,30,61)*1.8+wx*.035)*np.sin(wx*.11+wz*.012)
    h+=bank*erosion*3.5
    return np.maximum(-1,h)

# Carve an actual dendritic drainage field into the macroforms before any sampling.
# This changes topology/geometry, not merely point count or shading noise.
GRID_X0,GRID_Z0=-256,-96
HX,HZ=np.meshgrid(np.arange(-256,257),np.arange(-96,737))
FIELD=height_raw(HX,HZ)
flow=np.ones(FIELD.size);flat=FIELD.ravel();best=np.zeros_like(FIELD);down=np.arange(FIELD.size).reshape(FIELD.shape)
ids=np.arange(FIELD.size).reshape(FIELD.shape)
for dz,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
    drop=(FIELD-np.roll(FIELD,(dz,dx),(0,1)))/np.hypot(dx,dz)
    better=drop>best;down[better]=np.roll(ids,(dz,dx),(0,1))[better];best=np.maximum(best,drop)
target=down.ravel()
for i in np.argsort(-flat):
    d=target[i]
    if d!=i and flat[d]<flat[i]:flow[d]+=flow[i]
slope=np.hypot(*np.gradient(FIELD));channel=np.minimum(12,np.log1p(flow.reshape(FIELD.shape))*1.25)*np.clip(slope,.0,1.3)
channel=gaussian_filter(channel,.68)
FIELD=np.maximum(1.6,FIELD-channel*np.clip((np.abs(HX-river(HZ))-11)/16,0,1))
FIELD=np.where(np.abs(HX-river(HZ))<11,1.6,FIELD)
def height(x,z):
    x,z=np.broadcast_arrays(np.asarray(x,dtype=float),np.asarray(z,dtype=float))
    a=np.clip(x-GRID_X0,0,FIELD.shape[1]-1.001);b=np.clip(z-GRID_Z0,0,FIELD.shape[0]-1.001)
    i=np.floor(a).astype(int);j=np.floor(b).astype(int);u=a-i;v=b-j
    a0=FIELD[j,i];a1=FIELD[j,i+1];b0=FIELD[j+1,i];b1=FIELD[j+1,i+1]
    return np.where(u+v<=1,a0+(a1-a0)*u+(b0-a0)*v,b1+(b0-b1)*(1-u)+(a1-b1)*(1-v))

def normals_ao(x,z):
    e=.7;h=height(x,z);dx=(height(x+e,z)-height(x-e,z))/(2*e);dz=(height(x,z+e)-height(x,z-e))/(2*e)
    n=np.stack([-dx,np.ones_like(dx),-dz],axis=-1);n/=np.linalg.norm(n,axis=-1)[...,None]
    occ=np.zeros_like(h)
    for d in [2,5,10]:
        for a in np.arange(8)*np.pi/4:
            occ+=np.clip((height(x+np.cos(a)*d,z+np.sin(a)*d)-h)/d,.0,2)/48
    return n,np.clip(1-occ,.38,1)

# point rows x,y,z, art class: 0 terrain,1 forest,2 architecture,3 water
points=[]
def emit(x,y,z,c,intensity=None):
    x,y,z=np.broadcast_arrays(np.asarray(x),np.asarray(y),np.asarray(z));n=x.size
    it=R.uniform(.67,1,n) if intensity is None else np.broadcast_to(intensity,x.shape).ravel()
    points.append(np.column_stack([x.ravel(),y.ravel(),z.ravel(),np.full(n,c),it]))
# Blue-noise-like stratified jitter, not rows of dots and not a regular carpet.
x,z=np.meshgrid(np.arange(-240,240,.64),np.arange(-80,720,.64));x=x.ravel()+R.uniform(-.29,.29,x.size);z=z.ravel()+R.uniform(-.29,.29,z.size)
x=np.round(x/.01)*.01;z=np.round(z/.01)*.01
y=height(x,z);dry=np.abs(x-river(z))>11;emit(x[dry],y[dry],z[dry],0)
# Water is a sparsely sampled stable plane: no wave displacement or noise flicker.
w=~dry;emit(x[w][::2],np.full(w.sum(),1.6)[::2],z[w][::2],3)
# Forest samples have actual layered volume, irregular branches and sparse needles, no spheres.
for k in range(870):
    tx=R.uniform(-219,219);tz=R.uniform(3,690);ty=float(height(tx,tz))
    slope=abs(float(height(tx+.5,tz)-height(tx-.5,tz)))
    if ty<14 or slope>2.7 or abs(tx-river(tz))<23:continue
    th=R.uniform(6,15);ang=R.uniform(0,6.28)
    u=np.linspace(0,1,36);emit(tx+u*u*np.cos(ang)*1.1,ty+u*th,tz+u*u*np.sin(ang)*1.1,1)
    for j in range(5):
        a=ang+j*2.399;bh=ty+th*(.32+j*.125);length=th*(.40-j*.043)
        b=np.linspace(0,1,30);bx=tx+np.cos(a)*length*b;bz=tz+np.sin(a)*length*b;by=bh+b*b*.9
        emit(bx,by,bz,1)
        rr=np.sqrt(R.random(135))*length*.46;aa=R.uniform(0,6.28,135)
        emit(bx[-1]+np.cos(aa)*rr,by[-1]+R.normal(0,.24,135),bz[-1]+np.sin(aa)*rr*.64,1)

# Original multi-bay classical timber architecture: swept roofs, tiles, columns, railings.
mesh_pos=[];mesh_idx=[]
def grid_mesh(p):
    rows,cols,_=p.shape;offset=sum(len(v) for v in mesh_pos);mesh_pos.append(p.reshape(-1,3))
    a=np.arange(rows*cols).reshape(rows,cols)[:-1,:-1].ravel()+offset
    mesh_idx.append(np.column_stack([a,a+1,a+cols+1,a,a+cols+1,a+cols]).reshape(-1))
def line(a,b,spacing=.18,c=2):
    a=np.array(a);b=np.array(b);u=np.linspace(0,1,max(2,int(np.linalg.norm(b-a)/spacing)));p=a[None,:]+(b-a)[None,:]*u[:,None];emit(p[:,0],p[:,1],p[:,2],c)
    if c==2 and np.linalg.norm(b-a)>.001:
        d=(b-a)/np.linalg.norm(b-a);ref=np.array([1.,0,0]) if abs(d[1])>.9 else np.array([0.,1,0]);v0=np.cross(d,ref);v0/=np.linalg.norm(v0);v1=np.cross(d,v0)
        angle=np.linspace(0,2*np.pi,9);ring=(np.cos(angle)[:,None]*v0+np.sin(angle)[:,None]*v1)*.075
        grid_mesh(np.stack([a[None,:]+ring,b[None,:]+ring]))
def building(cx,cz,scale=1):
    cy=float(height(cx,cz));L=14*scale;D=9*scale
    # Three stacked curved roof faces with individually articulated eaves and ridge finials.
    for level,shrink in [(0,1),(1,.7)]:
        u,v=np.meshgrid(np.linspace(-1,1,100),np.linspace(-1,1,64));rx=L*.65*shrink;rz=D*.72*shrink
        ry=cy+9*scale+level*5*scale+(-np.abs(v)*2.7+np.abs(v)**5*1.3)*scale+.55*scale*np.abs(u)**5
        xx=cx+u*rx;zz=cz+v*rz;emit(xx,ry,zz,2);grid_mesh(np.stack([xx,ry,zz],-1)[::3,::3])
        for vv in [-1,1]:
            uu=np.linspace(-1,1,160);yy=cy+9*scale+level*5*scale-1.4*scale+.55*scale*np.abs(uu)**5
            emit(cx+uu*rx,yy,np.full_like(uu,cz+vv*rz),2)
        line([cx-rx,cy+(9+level*5)*scale,cz],[cx+rx,cy+(9+level*5)*scale,cz],.1)
    for a in np.linspace(-L/2,L/2,5):
        for b in [-D/2,D/2]:
            for theta in np.arange(8)*np.pi/4:
                line([cx+a+np.cos(theta)*.15*scale,cy+.8,cz+b+np.sin(theta)*.15*scale],[cx+a+np.cos(theta)*.15*scale,cy+8.5*scale,cz+b+np.sin(theta)*.15*scale],.16)
    for zz in [-D/2,D/2]:
        for yy in [1.3,2.6,7.1]:line([cx-L/2,cy+yy*scale,cz+zz],[cx+L/2,cy+yy*scale,cz+zz])
        for xx in np.arange(-L/2,L/2,.65):line([cx+xx,cy+1.3*scale,cz+zz],[cx+xx,cy+2.6*scale,cz+zz])
    # Ground-contact stilts and terrace piers, starting at each actual local slope height.
    for xx in np.linspace(-L*.6,L*.6,7):
        for zz in [-D*.63,D*.63]:
            gy=float(height(cx+xx,cz+zz));top=cy+.62
            if gy<top:
                for aa in np.arange(8)*np.pi/4:
                    line([cx+xx+np.cos(aa)*.28,gy,cz+zz+np.sin(aa)*.28],[cx+xx+np.cos(aa)*.28,top,cz+zz+np.sin(aa)*.28],.19)
    # Dressed stone terrace is sampled as a surface, not an untextured cube.
    u,v=np.meshgrid(np.linspace(-L*.65,L*.65,100),np.linspace(-D*.7,D*.7,70));yy=np.full_like(u,cy+.65);emit(cx+u,yy,cz+v,2);grid_mesh(np.stack([cx+u,yy,cz+v],-1)[::4,::4])
    return [cx,cy,cz]
landmarks=[]
for x0,z0,s in [(-57,128,1.2),(-79,161,.8),(69,271,1.0),(100,404,.95),(-87,488,1.3)]:landmarks.append(building(x0,z0,s))
# Multi-span arched bridge across the same river; wall thickness and balustrades share coordinates.
cz=92;cx=float(river(cz));u,v=np.meshgrid(np.linspace(-22,22,220),np.linspace(-3,3,26));by=4+4*(1-(u/23)**2);emit(cx+u,by,cz+v,2);grid_mesh(np.stack([cx+u,by,cz+v],-1)[::2,::2])
for v0 in [-3,3]:
    for uu in np.linspace(-22,22,78):
        yy=4+4*(1-(uu/23)**2);line([cx+uu,yy,cz+v0],[cx+uu,yy+1.7,cz+v0],.13)
    uu=np.linspace(-22,22,300);yy=5.7+4*(1-(uu/23)**2);emit(cx+uu,yy,np.full_like(uu,cz+v0),2)
P=np.concatenate(points);P=P[(P[:,0]>=-240)&(P[:,0]<240)&(P[:,2]>=-80)&(P[:,2]<720)];R.shuffle(P)
# 80m spatial pages, 1cm unsigned positions; class/intensity/height/rank in a byte each.
manifest={'kind':'artistic_reconstruction','survey':False,'seed':82177,'quantum_m':.01,'classes':{'0':'art_terrain','1':'art_forest','2':'art_architecture','3':'art_water'},'point_count':len(P),'chunks':[],'landmarks':landmarks,'domain':[-240,240,-80,720],'mesh_resolution_m':1,'vertical_exaggeration':1}
for iz,z0 in enumerate(range(-80,720,80)):
 for ix,x0 in enumerate(range(-240,240,80)):
    sel=P[(P[:,0]>=x0)&(P[:,0]<x0+80)&(P[:,2]>=z0)&(P[:,2]<z0+80)]
    if not len(sel):continue
    off=np.array([x0,-5,z0]);q=np.round((sel[:,:3]-off)/.01).astype('<u2');cls=sel[:,3].astype('u1');inten=np.round(sel[:,4]*255).astype('u1')
    hag=np.clip((sel[:,1]-height(sel[:,0],sel[:,2]))*8,0,255).astype('u1');rank=R.integers(0,256,len(sel),dtype='u1')
    name=f'cloud-{ix:02d}-{iz:02d}.bin';b=q.tobytes()+cls.tobytes()+inten.tobytes()+hag.tobytes()+rank.tobytes();(OUT/name).write_bytes(b)
    # Ground at 1m; short-radius ambient occlusion baked from surrounding elevations.
    gx,gz=np.meshgrid(np.arange(x0,x0+81),np.arange(z0,z0+81));gy=height(gx,gz);nn,ao=normals_ao(gx,gz);sp=np.stack([gx,gy,gz],-1).reshape(-1,3)
    sq=np.round((sp-off)/.01).astype('<u2');sn=np.round(nn.reshape(-1,3)*127).astype('i1');sa=np.round(ao.ravel()*255).astype('u1')
    # Encode raking-light/AO into intensity without changing any point coordinates.
    pi=np.clip(np.round(sel[:,0]-x0).astype(int),0,80);pj=np.clip(np.round(sel[:,2]-z0).astype(int),0,80)
    sun=np.array([-.72,.46,-.50]);sun/=np.linalg.norm(sun)
    light=np.maximum(0,(nn[pj,pi]*sun).sum(-1));base=(.22+.78*light)*(.5+.5*ao[pj,pi])
    tint=np.where(sel[:,3]==0,base,np.where(sel[:,3]==1,.58+.42*base,1.))
    inten=np.round(np.clip(sel[:,4]*tint,0,1)*255).astype('u1')
    b=q.tobytes()+cls.tobytes()+inten.tobytes()+hag.tobytes()+rank.tobytes();(OUT/name).write_bytes(b)
    mn=f'surface-{ix:02d}-{iz:02d}.bin';(OUT/mn).write_bytes(sq.tobytes()+sn.tobytes()+sa.tobytes())
    lo=sel[:,:3].min(0);hi=sel[:,:3].max(0)
    manifest['chunks'].append({'points':name,'n':len(sel),'offset':off.tolist(),'min':lo.tolist(),'max':hi.tolist(),'surface':mn,'grid':81,'sha256':hashlib.sha256(b).hexdigest()})
# Architectural surface is generated from the very same roof/terrace sample functions.
verts=np.concatenate(mesh_pos).astype('<f4');idx=np.concatenate(mesh_idx).astype('<u4');aq=np.round((verts-np.array([-240,-5,-80]))/.01).astype('<u2')
(OUT/'architecture.bin').write_bytes(aq.tobytes()+idx.tobytes());manifest['architecture']={'vertices':len(verts),'indices':len(idx),'offset':[-240,-5,-80]}
manifest['quantization_max_axis_error_m']=.005
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'points':len(P),'chunks':len(manifest['chunks']),'terrain_vertices':81*81*len(manifest['chunks']),'architecture_vertices':len(verts),'bytes':sum(f.stat().st_size for f in OUT.glob('*.bin'))},indent=2))
