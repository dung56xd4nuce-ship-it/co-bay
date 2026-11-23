import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
await p.route('**fonts.g*/**', r=>r.abort()); await p.route('**/art/**', r=>r.abort());
await p.goto('file://'+process.cwd()+'/dist/index.html'); await p.waitForTimeout(300);
await p.evaluate(()=>{ __ltm.startLevel(1,{allAI:true}); __ltm.stepSec(240); const w=__ltm.world; __ltm.G.ren.centerOn(w.drum.x,w.drum.y,true); __ltm.G.ren.cam.z=1.0; });
await p.waitForTimeout(500);
const res=await p.evaluate(()=>{ const r=__ltm.G.ren; const out={}; const orig={};
  for(const k of ['getChunk','drawDrum','drawUnit','drawParts','drawOverFog','updateFog']){ orig[k]=r[k]; out[k]=0; r[k]=function(...a){ const t=performance.now(); const v=orig[k].apply(this,a); out[k]+=performance.now()-t; return v; }; }
  const t0=performance.now(); for(let i=0;i<30;i++) r.draw(1/60,0.5); out.total=performance.now()-t0; for(const k in out) out[k]=(out[k]/30).toFixed(2); return out; });
console.log(res); await b.close();
