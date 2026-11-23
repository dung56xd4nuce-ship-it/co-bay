import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android'; const T=+process.argv[3]||300;
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort()); 
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300);
await p.evaluate(()=>__ltm.startLevel(1,{allAI:true}));
let best=null;
for(let t=0;t<T;t+=5){ await p.evaluate(()=>__ltm.stepSec(5)); const r=await p.evaluate(()=>{ const w=__ltm.world; let n=0,x=0,y=0; for(const pr of w.projs){n++;x+=pr.sx;y+=pr.sy;} const fights=w.units.filter(u=>!u.dead&&u.f!==99&&u.target>=0&&u.tkind===0); return {n:fights.length, x:fights.length?fights.reduce((s,u)=>s+u.x,0)/fights.length:0, y:fights.length?fights.reduce((s,u)=>s+u.y,0)/fights.length:0, t:w.time, over:w.over}; }); if(r.n>=8){ best=r; break; } if(r.over) break; }
console.log('battle', best);
if(best){ await p.evaluate(([x,y])=>{ const w=__ltm.world; __ltm.G.ren.centerOn(Math.round(x),Math.round(y),true); __ltm.G.ren.cam.z=1.3; },[best.x,best.y]);
  for(let k=0;k<6;k++){ await p.waitForTimeout(350); }
  await p.screenshot({path:`test/${which}-art-battle.png`}); }
await p.evaluate(()=>{ const w=__ltm.world; __ltm.G.ren.centerOn(w.drum.x,w.drum.y,true); __ltm.G.ren.cam.z=1.0; }); await p.waitForTimeout(800);
await p.screenshot({path:`test/${which}-drum.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else res(n/3); }; requestAnimationFrame(f); }));
const cost=await p.evaluate(()=>{ const r=__ltm.G.ren; const t0=performance.now(); for(let i=0;i<20;i++) r.draw(1/60,0.5); return (performance.now()-t0)/20; });
console.log('fps',fps.toFixed(1),'draw ms',cost.toFixed(2));
console.log('errors',errs); await b.close();
