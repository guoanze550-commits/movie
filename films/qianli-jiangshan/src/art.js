import {mulberry} from '../vendor/lib.js';
export const P={silk:'#dfd2af',ink:'#253e38',blue:'#286e80',green:'#618b70',ochre:'#927347',gold:'#b5a16b'};
export function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const TAU=Math.PI*2;
function noise(x,s){return Math.sin(x*17.7+s)*.46+Math.sin(x*39.1+s*2.13)*.24+Math.sin(x*83.3+s*.67)*.12+Math.sin(x*193.2+s)*.06}
export function ridge(x,o){let h=0;for(const [cx,hh,ww] of o.peaks){const side=x<cx?.78:1.24,q=Math.abs((x-cx)/(ww*side));const crown=hh*Math.exp(-Math.pow(q,1.15+.38*Math.sin(cx*37+o.seed)));const shoulder=hh*.48*Math.exp(-Math.pow(Math.abs((x-cx-ww*.72)/(ww*.68)),2));h=Math.max(h,crown,shoulder)}return o.base-h*(1+.075*noise(x,o.seed))-.004*noise(x,o.seed+3)}
export function silk(){const W=1800,H=1000,c=canvas(W,H),g=c.getContext('2d'),R=mulberry(1888);g.fillStyle=P.silk;g.fillRect(0,0,W,H);
 for(let i=0;i<180;i++){const x=R()*W,y=R()*H,r=40+R()*270,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,R()<.5?'rgba(157,122,64,.022)':'rgba(255,250,222,.05)');q.addColorStop(1,'rgba(220,210,179,0)');g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
 for(let x=0;x<W;x+=2){g.strokeStyle=`rgba(117,93,58,${.018+R()*.035})`;g.lineWidth=.5;g.beginPath();g.moveTo(x,0);g.lineTo(x+R()*2,H);g.stroke()}
 for(let y=0;y<H;y+=2){g.strokeStyle=`rgba(251,237,198,${.025+R()*.045})`;g.lineWidth=.5;g.beginPath();g.moveTo(0,y);g.lineTo(W,y+R()*2);g.stroke()}
 for(let i=0;i<20000;i++){g.fillStyle=R()<.4?'rgba(87,69,44,.08)':'rgba(255,249,215,.1)';g.fillRect(R()*W,R()*H,.4+R()*.8,.4+R()*.5)}return c}
function outline(g,o,W,H){g.beginPath();g.moveTo(-20,H);for(let i=0;i<=600;i++){const x=i/600;g.lineTo(x*W,ridge(x,o)*H)}g.lineTo(W+20,H);g.closePath()}
export function mountain(o){const W=2400,H=1150,c=canvas(W,H),g=c.getContext('2d'),R=mulberry(o.seed);outline(g,o,W,H);g.save();g.clip();
 const grad=g.createLinearGradient(0,H*.05,0,H);grad.addColorStop(0,o.top);grad.addColorStop(.42,o.color);grad.addColorStop(.82,o.foot);grad.addColorStop(1,o.foot);g.fillStyle=grad;g.fillRect(0,0,W,H);
 // Broad mineral washes follow geological strata rather than lighting like plastic.
 for(const [cx,hh,ww] of o.peaks){for(let k=0;k<16;k++){const xx=(cx+(R()-.5)*ww*1.6)*W,yy=(o.base-hh*.5+R()*.3)*H;g.beginPath();g.moveTo(xx,yy-hh*.65*H);g.bezierCurveTo(xx-ww*W*.4,yy,xx+ww*W*.2,yy+H*.2,xx+ww*W*.8,yy+H*.35);g.lineTo(xx+ww*W*1.2,yy+H*.5);g.lineTo(xx-ww*W*.5,yy+H*.4);g.closePath();g.fillStyle=k%3===0?'rgba(180,159,99,.10)':k%3===1?'rgba(21,67,67,.12)':'rgba(121,165,133,.09)';g.fill()}}
 // Anchored pigment specks: thousands of nonuniform granules, never animated screen noise.
 for(let i=0;i<32000;i++){const x=R()*W,y=R()*H,rad=.2+Math.pow(R(),3)*1.7;g.fillStyle=i%4===0?'rgba(218,195,128,.20)':i%4===1?'rgba(16,54,55,.17)':i%4===2?'rgba(104,156,135,.18)':'rgba(31,88,98,.12)';g.beginPath();g.ellipse(x,y,rad*(.6+R()),rad,0,0,TAU);g.fill()}
 // Long hemp-fibre / axe-cut-inspired broken brush paths, differentiated by each crest.
 for(const [cx,hh,ww] of o.peaks){for(let k=0;k<95;k++){const sx=cx+(R()-.5)*ww*1.55,sy=ridge(sx,o)+.008+R()*hh*.28;const len=hh*(.15+R()*.65),drift=(sx-cx)*.55+(R()-.5)*ww*.2;g.beginPath();g.moveTo(sx*W,sy*H);for(let j=1;j<=16;j++){const v=j/16,xx=sx+drift*v+noise(v*1.6+k,o.seed)*ww*.035*v,yy=sy+len*v;g.lineTo(xx*W,yy*H)}g.strokeStyle=k%5===0?'rgba(206,180,116,.32)':`rgba(25,54,48,${.09+R()*.18})`;g.lineWidth=.35+R()*1.5;g.stroke();
  if(k%7===0){g.beginPath();g.moveTo((sx+drift*.3)*W,(sy+len*.3)*H);g.quadraticCurveTo((sx+drift*.3-ww*.11)*W,(sy+len*.5)*H,(sx+drift*.3-ww*.2)*W,(sy+len*.72)*H);g.strokeStyle='rgba(33,61,48,.18)';g.stroke()}}}
 // Forest dots cluster on contour shelves and alternate occluding dark and lighter ink.
 for(let i=0;i<1050;i++){const x=R(),y=ridge(x,o)+R()*.1+.006;g.fillStyle=R()<.5?'rgba(28,64,51,.42)':'rgba(59,100,70,.32)';g.beginPath();g.ellipse(x*W,y*H,1.1+R()*3,.8+R()*2,0,0,TAU);g.fill()}
 g.restore();
 // Dry, fine contour, with a warm under-edge rather than a thick vector gold outline.
 for(const [offset,col,lw] of [[1.0,'rgba(190,162,99,.34)',1.15],[-.1,'rgba(31,59,49,.55)',.8]]){g.beginPath();for(let i=0;i<=600;i++){const x=i/600,y=ridge(x,o)*H+offset;if(i===0)g.moveTo(x*W,y);else g.lineTo(x*W,y)}g.strokeStyle=col;g.lineWidth=lw;g.stroke()}
 return c}
export function pine(g,x,y,h,seed=9){const R=mulberry(seed);g.save();g.translate(x,y);g.scale(h,h);g.lineCap='round';
 const lean=-.2+R()*.3;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-.08,-.23,lean+.09,-.58,lean,-.92);g.strokeStyle='#3b4030';g.lineWidth=.042;g.stroke();g.strokeStyle='#a18f5d';g.lineWidth=.009;g.stroke();
 for(let k=0;k<8;k++){const t=.23+k*.085,side=k%2===0?-1:1,by=-t,bx=lean*t,ex=bx+side*(.22+(1-t)*.17),ey=by-.09;g.beginPath();g.moveTo(bx,by);g.quadraticCurveTo((bx+ex)/2,by+.025,ex,ey);g.strokeStyle='#354132';g.lineWidth=.012*(1-t*.5);g.stroke();
  for(let cl=0;cl<5;cl++){const xx=ex+(R()-.5)*.25,yy=ey+(R()-.5)*.045;g.fillStyle=cl%2?'#48664a':'#2d5140';g.beginPath();g.ellipse(xx,yy,.105+R()*.055,.027+R()*.018,-.07,0,TAU);g.fill();for(let n=0;n<25;n++){const px=xx+(R()-.5)*.2,py=yy+(R()-.5)*.035;g.beginPath();g.moveTo(px,py);g.lineTo(px+(R()-.5)*.035,py-.012-R()*.028);g.lineWidth=.0015;g.strokeStyle=R()<.5?'#233d32':'#a3a173';g.stroke()}}}
 for(let k=0;k<6;k++){g.beginPath();g.moveTo(0,0);g.quadraticCurveTo((k-3)*.025,-.02,(k-3)*.08,.025+R()*.025);g.strokeStyle='#4e4a32';g.lineWidth=.009;g.stroke()}g.restore()}
function pavilion(g,x,y,s){g.save();g.translate(x,y);g.scale(s,s);g.lineWidth=.012;g.strokeStyle='#4d5037';g.fillStyle='#b1a779';g.fillRect(-.44,-.08,.88,.1);for(const xx of [-.34,0,.34]){g.fillStyle='#6c6c46';g.fillRect(xx-.015,-.65,.03,.6);g.fillStyle='#c0b082';g.fillRect(xx-.006,-.62,.007,.54)}
 g.fillStyle='#42564a';g.beginPath();g.moveTo(-.62,-.64);g.quadraticCurveTo(-.38,-.68,0,-.96);g.quadraticCurveTo(.38,-.68,.62,-.64);g.quadraticCurveTo(.55,-.57,.41,-.59);g.lineTo(-.41,-.59);g.closePath();g.fill();g.stroke();g.strokeStyle='#b8a673';g.beginPath();g.moveTo(-.6,-.64);g.quadraticCurveTo(0,-.55,.6,-.64);g.stroke();
 g.strokeStyle='#59624b';for(let i=-8;i<=8;i++){g.beginPath();g.moveTo(i*.05,-.62);g.lineTo(i*.028,-.82-Math.max(0,.1-Math.abs(i)*.012));g.lineWidth=.007;g.stroke()}
 for(let i=-7;i<=7;i++){g.fillStyle='#5f684c';g.fillRect(i*.055,-.26,.009,.19)}g.fillRect(-.42,-.26,.84,.015);g.fillRect(-.48,.02,.96,.025);g.restore()}
export function props(){const W=2400,H=1150,c=canvas(W,H),g=c.getContext('2d');
 pavilion(g,W*.38,H*.65,W*.035);pavilion(g,W*.69,H*.685,W*.019);
 // A shallow arch bridge with stone courses and individually spaced balusters.
 g.save();g.translate(W*.61,H*.73);g.scale(W*.095,W*.095);g.fillStyle='#b2aa81';g.beginPath();g.moveTo(-.9,.1);g.quadraticCurveTo(0,-.48,.9,.1);g.lineTo(.9,.23);g.quadraticCurveTo(0,-.27,-.9,.23);g.closePath();g.fill();g.strokeStyle='#6c7359';g.lineWidth=.012;g.stroke();for(let i=0;i<27;i++){const x=-.9+i*1.8/26,yy=-.19+.36*x*x;g.fillStyle='#7b8061';g.fillRect(x,yy-.14,.009,.17)}for(const dy of [-.14,-.08]){g.beginPath();for(let i=0;i<=30;i++){const x=-.9+i*.06,y=-.19+.36*x*x+dy;if(i===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke()}g.restore();
 pine(g,W*.21,H*.72,W*.075,13);pine(g,W*.27,H*.70,W*.05,27);pine(g,W*.73,H*.72,W*.035,28);
 // A boat and a tiny walker give a human scale, never a modern product mark.
 g.fillStyle='#5c6044';g.beginPath();g.moveTo(W*.49,H*.835);g.quadraticCurveTo(W*.507,H*.85,W*.522,H*.833);g.closePath();g.fill();g.strokeStyle='#5f6245';g.lineWidth=1.1;g.beginPath();g.moveTo(W*.504,H*.837);g.lineTo(W*.504,H*.806);g.lineTo(W*.515,H*.831);g.stroke();
 return c}
export function foreground(){const W=2400,H=1150,c=canvas(W,H),g=c.getContext('2d');
 g.fillStyle='#4b6651';g.beginPath();g.moveTo(0,H);g.lineTo(0,H*.7);g.bezierCurveTo(W*.06,H*.69,W*.10,H*.87,W*.22,H);g.closePath();g.fill();g.strokeStyle='#8c9164';g.lineWidth=1.5;for(let k=0;k<25;k++){g.beginPath();g.moveTo(W*(.01+k*.003),H*(.73+k*.006));g.bezierCurveTo(W*.12,H*.92,W*.09,H*.96,W*(.14+k*.003),H);g.stroke()}
 pine(g,W*.06,H*.92,W*.19,61);pine(g,W*.10,H*.95,W*.115,42);
 g.fillStyle='#6c7e58';g.beginPath();g.moveTo(W,H);g.lineTo(W,H*.85);g.quadraticCurveTo(W*.94,H*.92,W*.90,H);g.closePath();g.fill();pine(g,W*.966,H*.96,W*.072,77);return c}
