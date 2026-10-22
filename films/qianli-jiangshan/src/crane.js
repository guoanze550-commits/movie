import * as THREE from 'three';
import {ss,seg} from '../vendor/lib.js';
const white=new THREE.MeshBasicMaterial({color:'#f0ead5',side:THREE.DoubleSide});
const ivory=new THREE.MeshBasicMaterial({color:'#d5d6bc',side:THREE.DoubleSide});
const ink=new THREE.MeshBasicMaterial({color:'#273c37',side:THREE.DoubleSide});
const red=new THREE.MeshBasicMaterial({color:'#93604b',side:THREE.DoubleSide});
function shape(path,mat,z=0){const s=new THREE.Shape();for(const [i,p] of path.entries()){if(i===0)s.moveTo(...p);else if(p.length===2)s.lineTo(...p);else if(p.length===4)s.quadraticCurveTo(...p);else s.bezierCurveTo(...p)}s.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(s,18),mat);m.position.z=z;return m}
function wing(sign,front){const root=new THREE.Group(),fore=new THREE.Group();root.add(shape([[0,0],[sign*.30,.36,sign*.72,.65],[sign*1.30,.50,sign*1.48,.29],[sign*.8,.04,sign*.3,-.08],[0,0]],front?white:ivory));
 fore.position.set(sign*.85,.26,0);for(let k=0;k<9;k++){const x=sign*(k*.071),y=.09-k*.027,len=.45+Math.sin(k/9*Math.PI)*.31;fore.add(shape([[x,y],[x+sign*.22,y+.10,x+sign*.53,y-len*.35],[x+sign*.55,y-len*.81,x+sign*.43,y-len],[x+sign*.31,y-len*.83,x-sign*.04,y-.08],[x,y]],k>3?ink:(front?white:ivory),.001*k))}root.add(fore);return {root,fore}}
export function crane(){const g=new THREE.Group(),back=wing(-1,false),front=wing(1,true);back.root.position.set(-.12,.1,-.02);front.root.position.set(-.08,.1,.02);g.add(back.root);
 g.add(shape([[-.55,.08],[-.9,.06,-1.18,-.06],[-.90,-.12,-.62,-.06]],ink));
 g.add(shape([[-.65,0],[-.4,.29,.14,.24],[.48,.2,.57,.08],[.43,-.19,-.02,-.20],[-.52,-.13,-.65,0]],white,.01));
 g.add(shape([[.21,.10],[.40,.14,.52,.52,.87,.59],[1.10,.65,1.18,.48,1.06,.39],[.79,.56,.65,.34,.57,.10],[.39,-.06,.24,-.02]],white,.03));
 g.add(shape([[1.04,.43],[1.60,.36],[1.12,.51]],ink,.035));g.add(shape([[.91,.58],[1.06,.65,1.15,.55],[1.02,.51]],red,.04));g.add(shape([[.99,.48],[1.08,.49],[1.07,.45],[.99,.45]],ink,.045));
 // Long trailing legs are integral to the locked crane silhouette.
 for(const y of [-.11,-.16])g.add(shape([[-.35,y],[-1.43,y-.14],[-1.59,y-.12],[-1.43,y-.10],[-.35,y+.025]],ink,.015));
 front.root.position.x=-.4;front.root.scale.x=.72;back.root.scale.x=.84;g.add(front.root);g.userData={back,front};return g}
function wingCurve(p){p=((p%1)+1)%1;if(p<.16)return -.15+.45*ss(p/.16);if(p<.34)return .30+.35*ss((p-.16)/.18);if(p<.58)return .65-1.12*ss((p-.34)/.24);if(p<.75)return -.47+.29*ss((p-.58)/.17);return -.18+.03*ss((p-.75)/.25)}
export function poseCrane(g,t,bank=0){const phase=t/1.7,{front,back}=g.userData;front.root.rotation.z=wingCurve(phase)*.67;back.root.rotation.z=-wingCurve(phase-.11)*.56;front.fore.rotation.z=wingCurve(phase-.085)*.34;back.fore.rotation.z=-wingCurve(phase-.21)*.32;
 front.root.scale.y=.91+.09*Math.cos(phase*Math.PI*2+.3);back.root.scale.y=.9+.1*Math.cos(phase*Math.PI*2-.4);g.rotation.z=bank;g.rotation.y=-.13+bank*.3;g.rotation.x=.08*Math.sin(t*.63)}
