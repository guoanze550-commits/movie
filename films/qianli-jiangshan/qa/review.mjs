// Uses the official browser/server; checks random access without building a substitute renderer.
import {openDemo,closeServer} from '../../../upstream/lemo-opuscar/core/render/page.mjs';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
const film=new URL('../',import.meta.url).pathname;
const {browser,page}=await openDemo(film,{w:960,h:540});
const digest=async t=>{await page.evaluate(t=>window.render(t),t);return createHash('sha256').update(await page.screenshot({type:'png'})).digest('hex')};
const times=[.173,1.437,2.819,3.731],first=[];
for(const t of times)first.push(await digest(t));
const deterministic=[];for(const i of [3,1,0,2])deterministic.push({t:times[i],equal:first[i]===await digest(times[i])});
const states=await page.evaluate(()=>Array.from({length:97},(_,i)=>{window.render(i/24);return structuredClone(window.FRAME_STATE)}));
const maxCameraStep=Math.max(...states.slice(1).map((s,i)=>Math.hypot(...s.camera.slice(0,3).map((v,k)=>v-states[i].camera[k]))));
const maxRiseStep=Math.max(...states.slice(1).map((s,i)=>Math.abs(s.rise-states[i].rise)));
const checks={random_access_determinism:deterministic.every(x=>x.equal),unique_random_frames:new Set(first).size===4,monotonic_rise:states.every((s,i)=>!i||s.rise>=states[i-1].rise),continuous_camera:maxCameraStep<.005,continuous_geometry:maxRiseStep<.03,grain_count:states.every(s=>s.grain_count===1450),review_gate:await page.evaluate(()=>window.DUR===4&&window.FILM_DURATION===60&&window.PLAN_APPROVED===false)};
const result={scope:'4-second technical review ONLY',checks,deterministic,maxCameraStep,maxRiseStep,samples:states,not_tested:['formal 60-second film','restorer acting','formal subtitles and voice','full crane flight choreography','artistic approval']};
fs.writeFileSync(film+'qa/technical.json',JSON.stringify(result,null,2)+'\n');
await browser.close();closeServer();if(Object.values(checks).some(x=>!x))process.exitCode=1;
console.log('::notice title=Qianli technical checks::'+JSON.stringify(checks));
