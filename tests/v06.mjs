import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1600);
await p.screenshot({path:`test/${which}-06-menu.png`});
// ---- MINI: một chạm điều tướng
await p.tap('#bMini'); await p.waitForTimeout(600);
const miniBtns=await p.evaluate(()=>[...document.querySelectorAll('#actions .btn')].filter(b2=>getComputedStyle(b2).display!=='none').length);
const tapWorld=async(x,y)=>{ await p.evaluate(([x,y])=>__ltm.G.ren.centerOn(x,y,true),[x,y]); await p.waitForTimeout(90); const s=await p.evaluate(([x,y])=>__ltm.toScreen(x,y),[x,y]); await p.touchscreen.tap(s[0],s[1]+6); };
// dẫn tướng đi chiêu mộ rồi vào trống
for(let it=0;it<55;it++){
  const st=await p.evaluate(()=>{ const w=__ltm.world,f=w.factions[0],g=f.general; let b2=null,bd=1e9; for(const u of w.units){ if(u.f===99&&!u.dead){ const d=Math.abs(u.x-g.x)+Math.abs(u.y-g.y); if(d<bd){bd=d;b2=[u.x,u.y];} } } return {over:w.over,count:f.count,b2,t:w.time|0,drum:[w.drum.x,w.drum.y],dead:g.dead}; });
  if(st.over) break;
  if(!st.dead){ if(st.count<6 && st.b2) await tapWorld(st.b2[0],st.b2[1]); else await tapWorld(st.drum[0],st.drum[1]+1); }
  await p.evaluate(()=>__ltm.stepSec(6));
  if(it===4){ await p.waitForTimeout(400); await p.screenshot({path:`test/${which}-06-mini.png`}); }
}
const miniRes=await p.evaluate(()=>({over:__ltm.world.over,res:__ltm.world.result,t:__ltm.world.time|0,count:__ltm.world.factions[0].count,modes:[...new Set(__ltm.world.factions[0].units.filter(u=>!u.dead&&u.type!=='general').map(u=>u.mode))]}));
await p.waitForTimeout(2200); await p.screenshot({path:`test/${which}-06-miniend.png`});
console.log(which,'MINI buttons:',miniBtns,'result:',JSON.stringify(miniRes));
// ---- Bão sương màn 1
await p.evaluate(()=>{ document.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden')); __ltm.startLevel(1,{allAI:true}); });
await p.waitForTimeout(400);
await p.evaluate(()=>{ const w=__ltm.world; w.cfg.storm={start:30,end:210}; __ltm.stepSec(75); w.factions[0].explored.fill(1); __ltm.G.ren.centerOn(w.drum.x+26,w.drum.y,true); __ltm.G.ren.cam.z=0.8; });
await p.waitForTimeout(900); await p.screenshot({path:`test/${which}-06-storm.png`});
const storm=await p.evaluate(()=>({on:__ltm.world.stormOn,R:Math.round(__ltm.world.stormR)}));
console.log(which,'STORM:',JSON.stringify(storm));
// ---- Màn 21: cờ phụ
await p.evaluate(()=>{ __ltm.startLevel(21,{allAI:true}); });
await p.waitForTimeout(500);
await p.evaluate(()=>{ __ltm.stepSec(150); const w=__ltm.world; const fl=w.flags[0]; w.factions[0].explored.fill(1); __ltm.G.ren.centerOn(fl.x,fl.y,true); __ltm.G.ren.cam.z=1.3; });
await p.waitForTimeout(900); await p.screenshot({path:`test/${which}-06-flag.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else res((n/3).toFixed(1)); }; requestAnimationFrame(f); }));
console.log(which,'L21 fps:',fps,'errors:',errs);
await b.close();
