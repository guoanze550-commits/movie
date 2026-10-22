const ss=t=>t*t*(3-2*t),seg=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a))),lerp=(a,b,t)=>a+(b-a)*t;
export const T={duration:7,fps:24,scanStart:3.6,scanEnd:6.8,silence:[3,3.6],bpm:72,events:[{t:.5,type:'probe',midi:74},{t:1.5,type:'section',midi:67},{t:3.6,type:'condense',midi:38},{t:5.8,type:'wood',midi:62}]};
// Uniform time intervals produce a continuous C1 cubic in position and target; no random shakes.
export const CAM=[
[0,-8,47,-65,0,74,150,48],
[2,-3,42,-40,1,76,174,48],
[4,-8,82,-20,8,78,206,50],
[7,-46,157,-44,0,72,230,52]];
export function cameraAt(t){let i=0;while(i<CAM.length-2&&t>CAM[i+1][0])i++;const a=CAM[Math.max(0,i-1)],b=CAM[i],c=CAM[i+1],d=CAM[Math.min(CAM.length-1,i+2)];const u=Math.max(0,Math.min(1,(t-b[0])/(c[0]-b[0]))),u2=u*u,u3=u2*u,dt=c[0]-b[0];return b.slice(1).map((p,k)=>{k++;const m=(c[k]-a[k])/(c[0]-a[0])*dt,n=(d[k]-b[k])/(d[0]-b[0])*dt;return (2*u3-3*u2+1)*p+(u3-2*u2+u)*m+(-2*u3+3*u2)*c[k]+(u3-u2)*n})}
export function stateAt(t){return {camera:cameraAt(t),front:lerp(-270,190,ss(seg(t,T.scanStart,T.scanEnd))),cut:lerp(30,11,ss(seg(t,1.5,2.6))),scan:t>=T.scanStart};}
