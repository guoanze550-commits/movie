import * as THREE from 'three';
import {stage,aim} from '../vendor/stage.js';
import {sheet,tex,CLOUD} from '../vendor/paper.js';
import {mulberry,ss,seg,lerp} from '../vendor/lib.js';
import {silk,mountain,ridge,props,foreground,P} from './art.js';
import {crane,poseCrane} from './crane.js';
import {REVIEW} from '../timeline.js';
const query=new URLSearchParams(location.search),shot=query.get('shot')||'morph';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.append(renderer.domElement);
const S=stage({bg:P.silk,fov:39,amb:2.1,ambCol:'#fff4d7',key:1.0,keyCol:'#f3e3b9',keyPos:[-.2,.55,.6],keyTarget:[0,0,-.08],keyAngle:.85,light:[-.1,.12,-.2],lightR:.65,lightCol:'#e2dbc1'});
S.cam.aspect=innerWidth/innerHeight;S.cam.updateProjectionMatrix();S.key.shadow.mapSize.set(1024,1024);S.key.shadow.normalBias=.0003;
const W=.98,H=.42;
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.95),new THREE.MeshBasicMaterial({map:tex(silk())}));backdrop.position.z=-.235;S.add(backdrop);
const defs=[
 {seed:110,base:.67,peaks:[[.18,.16,.10],[.40,.24,.12],[.66,.25,.09],[.83,.2,.1]],top:'#b6c0aa',color:'#aab9a2',foot:'#d4cfad',z:-.18},
 {seed:220,base:.70,peaks:[[.16,.26,.08],[.34,.29,.09],[.57,.27,.09],[.77,.35,.10],[.94,.27,.07]],top:'#8fa998',color:'#7c9b8b',foot:'#bdc3a3',z:-.15},
 {seed:330,base:.72,peaks:[[.08,.35,.09],[.29,.43,.065],[.44,.31,.065],[.85,.38,.09]],top:'#6c9c8a',color:'#4d847c',foot:'#a0af87',z:-.12},
 {seed:440,base:.76,peaks:[[.16,.42,.075],[.35,.60,.067],[.42,.43,.06],[.85,.49,.09],[.96,.37,.08]],top:'#397d86',color:'#286a77',foot:'#7e9873',z:-.08},
 {seed:550,base:.82,peaks:[[.02,.45,.075],[.23,.29,.09],[.32,.30,.08],[.83,.38,.06],[1.02,.62,.09]],top:'#68997d',color:'#538875',foot:'#9a9e6d',z:-.035},
 {seed:660,base:.95,peaks:[[-.02,.38,.09],[.09,.26,.11],[.98,.30,.08]],top:'#557e65',color:'#416d5b',foot:'#8f9264',z:.015},
];
function imageLayer(c,z){const m=sheet({U:S.U,w:W,h:H,z,draw:x=>{x.save();x.scale(1,-1);x.drawImage(c,-W/2,-H/2,W,H);x.restore()},trans:.015,ppm:2600,finish:{rim:.035,under:.055,grainA:.25},rough:.99});S.add(m);return m}
const layers=defs.map(o=>{const m=imageLayer(mountain(o),o.z);const geo=new THREE.PlaneGeometry(W,H,112,36);m.geometry.dispose();m.geometry=geo;m.userData.basePositions=geo.attributes.position.array.slice();m.userData.def=o;return m});
const prop=imageLayer(props(),.022),near=imageLayer(foreground(),.066);prop.castShadow=false;prop.receiveShadow=true;near.castShadow=true;
// Animated flowing calligraphic water: a density field, never a scrolling photograph.
const water=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 uv0;uniform float time;void main(){vec2 q=uv0;float mask=1.-smoothstep(.32,.56,q.y);float w=pow(.5+.5*sin(q.y*275.+sin(q.x*22.-time*.22)*1.5+sin(q.x*63.+time*.32)*.4),24.);float broken=smoothstep(.3,.85,sin(q.x*125.+q.y*48.)*.5+.5);vec3 silk=vec3(.84,.81,.65);vec3 ink=vec3(.44,.58,.51);gl_FragColor=vec4(mix(silk,ink,w*.22*broken),mask*.85);}`}));water.position.z=-.065;S.add(water);
// Two analytic mist veils sample the official pulp-cloud field; texture remains borderless.
const fogs=[];for(let i=0;i<3;i++){const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{cloud:{value:CLOUD()},time:{value:0},level:{value:i},amount:{value:1}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 uv0;uniform sampler2D cloud;uniform float time,level,amount;void main(){vec2 q=uv0;float n=texture2D(cloud,vec2(q.x*2.+time*.004*(level+1.),q.y*.8+sin(q.x*5.+time*.12)*.09)).r;float center=.31+level*.052+sin(q.x*9.+level*2.+time*.2)*.018;float a=exp(-pow((q.y-center)/(.033+n*.035),2.))*smoothstep(.18,.68,n)*.47*amount;gl_FragColor=vec4(.85,.84,.72,a);}`});const m=new THREE.Mesh(new THREE.PlaneGeometry(W,H),mat);m.position.set(0,0,[-.105,-.022,.045][i]);S.add(m);fogs.push(m)}
// Each grain is anchored to the same target rock layer: flat deposit -> relief surface.
const R=mulberry(REVIEW.seed),N=1450,grainGeo=new THREE.IcosahedronGeometry(1,0),grainMat=new THREE.MeshStandardMaterial({roughness:1,metalness:0});
const grains=new THREE.InstancedMesh(grainGeo,grainMat,N),dummy=new THREE.Object3D(),grainData=[];grains.frustumCulled=false;
for(let i=0;i<N;i++){const layer=2+Math.floor(R()*3),o=defs[layer],u=.19+R()*.67,top=ridge(u,o),v=top+R()*(o.base-top)*.85;grainData.push({x:(u-.5)*W,y:(.5-v)*H,z:o.z,layer,size:.00045+Math.pow(R(),2)*.0017,phase:R()*6.28,homeX:(u-.5)*W,homeY:-.072+(R()-.5)*.018,homeZ:.018+R()*.022});grains.setColorAt(i,new THREE.Color(i%5===0?'#9b8651':i%2===0?'#528d76':'#276b80'))}
S.add(grains);
const bird=crane();bird.scale.setScalar(.018);S.add(bird);
function updateLayer(m,rise,t,i){const a=m.geometry.attributes.position,b=m.userData.basePositions,base=-.115;
 for(let j=0;j<a.count;j++){const x=b[j*3],y=b[j*3+1],v=(y+H/2)/H;const swell=(Math.sin(x*26+i)*.0013+Math.cos(x*47-i)*.0006)*Math.sin(v*Math.PI);a.setXYZ(j,x,y<base?y:base+(y-base)*rise,(swell+Math.sin(v*Math.PI)*.005*Math.cos(x*18+i))*rise)}a.needsUpdate=true;
 m.castShadow=rise>.3;m.material.opacity=1;m.position.x=0;m.rotation.y=0;
}
function shotState(t){const p=ss(seg(t,.35,3.5)),camP=ss(seg(t,1.1,4));if(shot==='landscape')return {rise:1,cam:[-.012,.015,.45,-.012,.015,-.08],birdScale:.005,birdPos:[.11,-.012,.02],bank:-.03};if(shot==='crane')return {rise:1,cam:[.040,.014,.318,.015,.008,-.06],birdScale:.016,birdPos:[.032+Math.sin(t*.25)*.003,.019,.092],bank:-.13};if(shot==='pigment')return {rise:.47,cam:[.020,-.028,.29,.015,-.047,-.065],birdScale:0,birdPos:[0,0,0],bank:0};return {rise:lerp(.045,1,p),cam:[lerp(.035,-.025,camP),lerp(-.037,.006,camP),lerp(.31,.45,camP),lerp(.025,-.012,camP),lerp(-.075,.004,camP),-.07],birdScale:.004*p,birdPos:[.12,-.01,.025],bank:-.08}}
window.DUR=REVIEW.duration;window.EV=REVIEW.events;const label=document.createElement('div');label.textContent='TECH TEST';Object.assign(label.style,{position:'fixed',left:'24px',bottom:'18px',color:'#394f46',font:'12px serif',letterSpacing:'2px'});if(shot==='morph')document.body.append(label);
window.TEXTS=()=>shot==='morph'?[{id:'review',text:'TECH TEST',x0:24,y0:innerHeight-34,x1:150,y1:innerHeight-16}]:[];
window.REVIEW_ONLY=true;window.FILM_DURATION=60;window.STYLE='song-blue-green';window.PLAN_APPROVED=false;
window.render=t=>{t=Math.min(4,Math.max(0,Number(t)));const state=shotState(t);layers.forEach((m,i)=>updateLayer(m,Math.max(.045,state.rise-(1-state.rise)*i*.018),t,i));
 const grow=ss(seg(state.rise,.16,.92));prop.scale.y=.08+.92*state.rise;prop.position.y=-.115*(1-prop.scale.y);near.scale.y=.26+.74*state.rise;near.position.y=-.115*(1-near.scale.y);
 for(let i=0;i<N;i++){const d=grainData[i],p=state.rise,swirl=Math.sin(p*Math.PI)*.007;dummy.position.set(lerp(d.homeX,d.x,p)+Math.cos(d.phase+p*2)*swirl,lerp(d.homeY,d.y,p),lerp(d.homeZ,d.z,p)+Math.sin(d.phase)*swirl);const size=d.size*(1-.82*ss(seg(p,.75,1)));dummy.scale.set(size,size*.7,size*.72);dummy.rotation.set(d.phase+p*.5,p*d.phase,d.phase*.7);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix)}grains.instanceMatrix.needsUpdate=true;
 water.material.uniforms.time.value=t;water.material.opacity=1;for(const f of fogs){f.material.uniforms.time.value=t;f.material.uniforms.amount.value=.30+.70*grow}
 bird.visible=state.birdScale>0;bird.scale.setScalar(state.birdScale);bird.position.set(...state.birdPos);poseCrane(bird,t,state.bank);aim(S.cam,state.cam,t,{hand:0});S.U.uLit.value=.35;S.key.intensity=1.0;S.amb.intensity=2.1;
 renderer.render(S.scene,S.cam);window.FRAME_STATE={time:t,rise:state.rise,camera:state.cam,grain_count:N,crane_phase:(t/1.7)%1,shot};};
window.render(0);window.READY=true;
