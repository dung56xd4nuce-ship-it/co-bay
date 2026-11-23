import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.route('**fonts.g*/**', r=>r.abort()); await p.route('**/art/**', r=>r.abort());
await p.goto('file://'+process.cwd()+'/dist/index.html'); await p.tap('#bPlay'); await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{ const r=__ltm.G.ren; const t=r.c.getTransform(); const f2=r.fsCtx; f2.setTransform(1,0,0,1,0,0); f2.globalCompositeOperation="source-over"; f2.clearRect(0,0,9999,9999); f2.setTransform(t); f2.drawImage(r.fogCv,0,0,__ltm.world.W*32,__ltm.world.H*32); const q=f2.getImageData(10,10,1,1).data; console.log(JSON.stringify([...q]), t.a, t.e, t.f, r.cam.x, r.cam.y); const fs=r.fogScreen; const c=fs.getContext('2d'); const d=c.getImageData(10,10,1,1).data; const m=r.fogCtx.getImageData(0,0,1,1).data; return {fsw:fs.width,fsh:fs.height, px:[...d], mask:[...m], explored0:__ltm.world.factions[0].explored[0]}; }));
await b.close();
