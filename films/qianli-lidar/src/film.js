// Original art reconstruction; point/surface architecture learned from official LiDAR Survey.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {T,stateAt} from '../timeline.js';
const Q=new URLSearchParams(location.search),shot=Q.get('shot')||'test';
const W=innerWidth,H=innerHeight,SS=2;
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#gl'),antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance',precision:'highp'});
renderer.setPixelRatio(SS);renderer.setSize(W,H,false);renderer.setClearColor(new THREE.Color().setRGB(...[5,8,10].map(c=>(c/255)**2.2)),1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,W/H,.7,1350);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.14,.12,1.10);composer.addPass(bloom);composer.addPass(new OutputPass());
const lin=c=>new THREE.Color(c);
const U={front:{value:-1000},cut:{value:30},proj:{value:H*SS/(2*Math.tan(43*Math.PI/360))},px:{value:SS},bg:{value:lin('#05080a')},scan:{value:lin('#d8f3ee')},sun:{value:new THREE.Vector3(-.72,.46,-.50).normalize()}};
const plane='float plane(vec3 p){return dot(p,vec3(.76,0.,.65));}';
const pointVS=`attribute float cls,inten,hag,rank;uniform vec3 off;uniform float quantum,front,cut,proj,px;varying vec3 col;varying float vis;${plane}
void main(){vec3 p=position*quantum+off;vec4 mv=modelViewMatrix*vec4(p,1.);float dist=-mv.z;float ext=min(min(p.x+240.,240.-p.x),min(p.z+80.,720.-p.z));float k=smoothstep(0.,26.,ext);float d=plane(p)-front;
if(cls<.5||cls>1.5)k*=smoothstep(-3.,2.,d);if(cls>.5&&cls<1.5)k*=1.-smoothstep(cut,cut+2.,hag/8.);
float density=mix(1.,.24,smoothstep(240.,620.,dist));k*=1.-smoothstep(density-.06,density,rank);
vec3 low=vec3(.014,.055,.048),mid=vec3(.055,.19,.15),high=vec3(.34,.54,.48);float h=clamp((p.y-8.)/175.,0.,1.);col=h<.48?mix(low,mid,h/.48):mix(mid,high,(h-.48)/.52);
if(cls>1.5&&cls<2.5)col=vec3(.68,.78,.76);if(cls>2.5)col=vec3(.09,.24,.26);if(cls>.5&&cls<1.5)col*=.85;
col*=mix(.30,1.25,inten);float hot=exp(-abs(d)/1.5)*step(-3.,d);col=mix(col,vec3(1.2,1.65,1.5),hot*.8);
float fog=exp(-max(dist-70.,0.)/720.);col=mix(vec3(.0015,.0025,.003),col,fog);vis=k;
gl_Position=projectionMatrix*mv;gl_PointSize=clamp(.24*proj/max(dist,1.),px,3.2*px);if(k<.002)gl_Position=vec4(2.,2.,2.,1.);}`;
const pointFS=`varying vec3 col;varying float vis;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float edge=1.-smoothstep(.35,.5,r);gl_FragColor=vec4(col*(1.-.17*r)*sqrt(edge)*vis,1.);}`;
const surfaceVS=`attribute vec3 nrm;attribute float ao;varying vec3 p,n;varying float occ,dist;void main(){p=position;n=nrm;occ=ao;vec4 mv=modelViewMatrix*vec4(position,1.);dist=-mv.z;gl_Position=projectionMatrix*mv;}`;
const surfaceFS=`precision highp float;uniform float front;uniform vec3 sun,bg,scan;varying vec3 p,n;varying float occ,dist;${plane}
void main(){float d=front-plane(p);if(d<0.)discard;float ext=min(min(p.x+240.,240.-p.x),min(p.z+80.,720.-p.z));if(ext<3.)discard;vec3 nn=normalize(n);if(!gl_FrontFacing)nn=-nn;float light=max(dot(nn,sun),0.);vec3 clay=vec3(.40,.37,.31),shade=vec3(.047,.065,.070);vec3 c=clay*(.19+.96*light)*(.42+.58*occ)+shade*(1.-light)*.55;
float cy=p.y/6.,cw=max(fwidth(cy),.001);float ct=1.-smoothstep(cw*.5,cw*1.25,min(fract(cy),1.-fract(cy)));c*=1.-ct*.12;
float river=18.*sin(p.z*.012)+10.*sin(p.z*.029+.4);float water=1.-smoothstep(9.5,11.2,abs(p.x-river));c=mix(c,vec3(.014,.045,.048),water);
float fill=smoothstep(0.,18.,d);c=mix(c*.20,c,fill);c+=scan*1.7*exp(-d/.5);float fog=exp(-max(dist-70.,0.)/720.);c=mix(bg,c,fog*smoothstep(3.,26.,ext));gl_FragColor=vec4(c,1.);}`;
const surfaceMat=new THREE.ShaderMaterial({uniforms:U,vertexShader:surfaceVS,fragmentShader:surfaceFS,side:THREE.DoubleSide});
const manifest=await fetch('data/manifest.json').then(r=>{if(!r.ok)throw Error('Missing point manifest');return r.json()});
const chunks=[],pointObjects=[],terrainObjects=[];
function groundIndices(n){const a=new Uint32Array((n-1)*(n-1)*6);for(let z=0,k=0;z<n-1;z++)for(let x=0;x<n-1;x++){const i=z*n+x;a[k++]=i;a[k++]=i+n;a[k++]=i+1;a[k++]=i+1;a[k++]=i+n;a[k++]=i+n+1}return a}
function decode(a,off){const p=new Float32Array(a.length);for(let i=0;i<a.length;i++)p[i]=a[i]*.01+off[i%3];return p}
// Spatial pages load in bounded batches; all pages needed by this seven-second path are ready before render.
async function loadChunk(c){const [pb,sb]=await Promise.all([fetch('data/'+c.points).then(r=>r.arrayBuffer()),fetch('data/'+c.surface).then(r=>r.arrayBuffer())]);const N=c.n;
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Uint16BufferAttribute(new Uint16Array(pb,0,N*3),3));
for(const [i,name] of ['cls','inten','hag','rank'].entries())g.setAttribute(name,new THREE.Uint8BufferAttribute(new Uint8Array(pb,N*6+i*N,N),1,name==='inten'||name==='rank'));
g.boundingBox=new THREE.Box3(new THREE.Vector3(...c.min),new THREE.Vector3(...c.max));g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
const mat=new THREE.ShaderMaterial({uniforms:{...U,off:{value:new THREE.Vector3(...c.offset)},quantum:{value:.01}},vertexShader:pointVS,fragmentShader:pointFS,alphaToCoverage:true,depthWrite:true,depthTest:true,transparent:false});
const cloud=new THREE.Points(g,mat);scene.add(cloud);pointObjects.push(cloud);
const n=c.grid*c.grid,sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(decode(new Uint16Array(sb,0,n*3),c.offset),3));sg.setAttribute('nrm',new THREE.Int8BufferAttribute(new Int8Array(sb,n*6,n*3),3,true));sg.setAttribute('ao',new THREE.Uint8BufferAttribute(new Uint8Array(sb,n*9,n),1,true));sg.setIndex(new THREE.BufferAttribute(groundIndices(c.grid),1));sg.computeBoundingSphere();const mesh=new THREE.Mesh(sg,surfaceMat);scene.add(mesh);terrainObjects.push(mesh);chunks.push({points:cloud,surface:mesh,n:N});}
for(let i=0;i<manifest.chunks.length;i+=4)await Promise.all(manifest.chunks.slice(i,i+4).map(loadChunk));
const ab=await fetch('data/architecture.bin').then(r=>r.arrayBuffer()),A=manifest.architecture,ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(decode(new Uint16Array(ab,0,A.vertices*3),A.offset),3));ag.setIndex(new THREE.BufferAttribute(new Uint32Array(ab.slice(A.vertices*6)),1));ag.computeVertexNormals();ag.setAttribute('nrm',ag.attributes.normal);ag.setAttribute('ao',new THREE.BufferAttribute(new Float32Array(A.vertices).fill(.9),1));ag.computeBoundingSphere();scene.add(new THREE.Mesh(ag,surfaceMat));
await Promise.all([document.fonts.load('500 30px Noto','千里江山数字苏醒艺术重建非实测'),document.fonts.load('400 22px Plex','0123456789 POINTS')]);
const ov=document.querySelector('#ov');ov.width=W;ov.height=H;const ctx=ov.getContext('2d');let texts=[];
function text(id,s,x,y,size,font,color){ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.fillText(s,x,y);const m=ctx.measureText(s);texts.push({id,text:s,x0:x,y0:y-m.actualBoundingBoxAscent,x1:x+m.width,y1:y+m.actualBoundingBoxDescent})}
function overlay(){ctx.clearRect(0,0,W,H);texts=[];ctx.save();ctx.scale(W/1920,H/1080);
// Fixed documentary instruments, no invented coordinate/age/archaeological measurements.
ctx.fillStyle='rgba(3,6,8,.86)';ctx.fillRect(56,40,425,152);
text('title','千里江山：数字苏醒',76,82,30,'Noto','#d6e3dd');ctx.fillStyle='#b99e73';ctx.fillRect(76,103,56,2);
text('truth','艺术重建 · 非实测',76,139,24,'Noto','#c1b397');
text('count',`${manifest.point_count.toLocaleString('en-US')} ART POINTS`,76,174,20,'Plex','#79928d');
ctx.fillStyle='rgba(3,6,8,.86)';ctx.fillRect(1420,40,425,90);
text('landmark','亭台轮廓 · 模型空间',1450,82,24,'Noto','#b99e73');
const lp=new THREE.Vector3(...manifest.landmarks[0]);lp.y+=13;lp.project(camera);const ax=(lp.x*.5+.5)*1920,ay=(-lp.y*.5+.5)*1080;
if(lp.z<1&&ax>0&&ax<1920&&ay>150&&ay<970){ctx.strokeStyle='rgba(185,158,115,.64)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1530,105);ctx.lineTo(1530,150);ctx.lineTo(ax,ay);ctx.stroke();ctx.beginPath();ctx.arc(ax,ay,4,0,Math.PI*2);ctx.stroke();}
ctx.fillStyle='rgba(3,6,8,.90)';ctx.fillRect(56,982,540,60);text('review','LiDAR Survey / 7s VISUAL TEST',76,1018,20,'Plex','#b7cbc3');ctx.restore();texts=texts.map(b=>({...b,x0:b.x0*W/1920,x1:b.x1*W/1920,y0:b.y0*H/1080,y1:b.y1*H/1080}));}
function shotState(t){const s=stateAt(t);if(shot==='mountain')return {...s,camera:[200,250,-235,0,70,225,38],front:-1000,cut:30};if(shot==='valley')return {...s,camera:[-9,37,-18,9,71,195,45],front:-1000,cut:30};if(shot==='scan')return {...s,camera:[-123,117,-86,-6,64,202,42],front:105,cut:16};return s}
const frustum=new THREE.Frustum(),vp=new THREE.Matrix4();
window.DUR=T.duration;window.EV=T.events;window.TEXTS=()=>texts;window.DATA_KIND='artistic_reconstruction_not_survey';window.PRODUCTION_AUTHORIZED=false;
window.render=t=>{t=Math.max(0,Math.min(T.duration,Number(t)));const s=shotState(t),c=s.camera;camera.position.set(...c.slice(0,3));camera.lookAt(...c.slice(3,6));camera.fov=c[6];camera.updateProjectionMatrix();camera.updateMatrixWorld();U.proj.value=H*SS/(2*Math.tan(camera.fov*Math.PI/360));U.front.value=s.front;U.cut.value=s.cut;
vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);let shown=0,visible=0;for(const ch of chunks){const see=frustum.intersectsSphere(ch.points.geometry.boundingSphere);ch.points.visible=see;ch.surface.visible=see;if(see){shown+=ch.n;visible++}}
// Offline frame contract: finish GPU work before the native screenshot tool reads it.
composer.render();renderer.getContext().finish();overlay();window.FRAME_STATE={time:t,camera:c,front:s.front,cut:s.cut,points:manifest.point_count,visible_points:shown,visible_chunks:visible,ss:SS,buffer:[renderer.domElement.width,renderer.domElement.height],depth_bits:renderer.getContext().getParameter(renderer.getContext().DEPTH_BITS),scan_plane:[.76,0,.65,-s.front]};};
window.projectWorld=p=>{const v=new THREE.Vector3(...p).project(camera);return [(v.x*.5+.5)*W,(-v.y*.5+.5)*H,v.z]};
window.CURVE=t=>{const s=shotState(t);return {time:t,camera:s.camera,front:s.front,cut:s.cut,scan_plane:[.76,0,.65,-s.front]}};window.CLOUD=()=>pointObjects;window.render(0);window.READY=true;
