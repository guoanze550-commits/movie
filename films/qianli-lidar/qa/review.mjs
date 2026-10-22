import {openDemo,closeServer} from '../../../upstream/lemo-opuscar/core/render/page.mjs';
import {createHash} from 'node:crypto';import fs from 'node:fs';
const dir=new URL('../',import.meta.url).pathname;fs.mkdirSync(dir+'out',{recursive:true});
const {browser,page}=await openDemo(dir,{w:960,h:540});
const sample=async(t,save)=>{await page.evaluate(t=>window.render(t),t);const b=await page.screenshot({type:'png'});if(save)fs.writeFileSync(dir+'out/'+save,b);return createHash('sha256').update(b).digest('hex')};
const times=[.317,2.283,4.719,6.641],first=[];for(let i=0;i<times.length;i++)first.push(await sample(times[i],`random-${i}.png`));
const repeats=[];for(const i of [3,0,2,1])repeats.push({t:times[i],same:first[i]===await sample(times[i]),sha256:first[i]});
const evidence=await page.evaluate(()=>{
const arr=window.CLOUD().map(o=>({position:Array.from(o.geometry.attributes.position.array),off:o.material.uniforms.off.value.toArray(),q:o.material.uniforms.quantum.value,depthTest:o.material.depthTest,depthWrite:o.material.depthWrite}));
// Curve continuity is a CPU property; actual video continuity is checked on all 168 decoded frames.
const actual=structuredClone(window.FRAME_STATE),states=Array.from({length:169},(_,i)=>({...window.CURVE(i/24),depth_bits:actual.depth_bits,ss:actual.ss,buffer:actual.buffer}));window.render(7);
let unchanged=true;window.CLOUD().forEach((o,i)=>{const a=o.geometry.attributes.position.array;unchanged&&=a.length===arr[i].position.length&&a.every((v,j)=>v===arr[i].position[j])&&o.material.uniforms.off.value.toArray().every((v,j)=>v===arr[i].off[j])});
// Actual point samples, projected through the same camera, prove perspective parallax.
const world=[];for(const o of window.CLOUD()){const a=o.geometry.attributes.position.array,off=o.material.uniforms.off.value;for(let j=0;j<a.length;j+=3*157){world.push([a[j]*.01+off.x,a[j+1]*.01+off.y,a[j+2]*.01+off.z])}}
window.render(.3);const a=world.map(p=>window.projectWorld(p));const c0=window.FRAME_STATE.camera.slice(0,3);window.render(2.3);const b=world.map(p=>window.projectWorld(p));const near=[],far=[];
for(let i=0;i<world.length;i++){if(a[i][2]>1||b[i][2]>1||a[i][0]<0||a[i][0]>innerWidth||a[i][1]<0||a[i][1]>innerHeight)continue;const d=Math.hypot(...world[i].map((v,k)=>v-c0[k])),flow=Math.hypot(a[i][0]-b[i][0],a[i][1]-b[i][1]);if(d>80&&d<190)near.push(flow);if(d>330&&d<600)far.push(flow)}
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];return {states,unchanged,depth:arr.every(a=>a.depthTest&&a.depthWrite),near_count:near.length,far_count:far.length,near_median_px:median(near),far_median_px:median(far),truth:window.DATA_KIND,authorized:window.PRODUCTION_AUTHORIZED};});
const maxStep=Math.max(...evidence.states.slice(1).map((s,i)=>Math.hypot(...s.camera.slice(0,3).map((v,k)=>v-evidence.states[i].camera[k]))));
const checks={random_seek_png_exact:repeats.every(r=>r.same),fixed_point_coordinates:evidence.unchanged,depth_test_and_write:evidence.depth,depth_24bit:evidence.states.every(s=>s.depth_bits>=24),c1_camera_no_jump:maxStep<1.5,monotonic_scan:evidence.states.every((s,i)=>!i||s.front>=evidence.states[i-1].front),shared_plane:evidence.states.every(s=>s.scan_plane[0]===.76&&s.scan_plane[2]===.65&&s.scan_plane[3]===-s.front),spatial_parallax:evidence.near_count>20&&evidence.far_count>20&&Math.abs(evidence.near_median_px-evidence.far_median_px)>3,art_label_and_gate:evidence.truth==='artistic_reconstruction_not_survey'&&evidence.authorized===false};
const report={scope:'7-second LiDAR visual review, not complete film',curve_test:'169 analytic samples of the same curve used by render; actual decoded video frames checked separately',checks,random:repeats,max_camera_step_model_m:maxStep,parallax:{near_count:evidence.near_count,far_count:evidence.far_count,near_median_px:evidence.near_median_px,far_median_px:evidence.far_median_px},states:evidence.states,manual_review_required:['artistic quality and naturalness','full-speed subjective sound and rhythm','no claim of real survey or archaeology']};
fs.writeFileSync(dir+'out/technical.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(dir+'qa/technical.json',JSON.stringify({...report,states:undefined},null,2)+'\n');
await browser.close();closeServer();console.log('::notice title=LiDAR technical checks::'+JSON.stringify(checks));if(Object.values(checks).some(x=>!x))process.exitCode=1;
