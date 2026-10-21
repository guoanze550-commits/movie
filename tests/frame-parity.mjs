import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {openDemo,closeServer} from '../upstream/lemo-opuscar/core/render/page.mjs';
const dir=path.resolve('fixtures/smoke');fs.mkdirSync('fixtures/smoke/out/parity',{recursive:true});
try{for(const [w,h,label] of [[640,360,'preview'],[1920,1080,'production']]){const {browser,page}=await openDemo(dir,{w,h});try{for(const t of [0,1.2,2.71,3,4.83,5.958333]){await page.evaluate(t=>window.render(t),t);await page.screenshot({path:`fixtures/smoke/out/parity/${label}-${t}.png`})}}finally{await browser.close()}}}finally{closeServer()}
console.log('Captured first, middle, last and seeded random seeks at preview and production sizes');
