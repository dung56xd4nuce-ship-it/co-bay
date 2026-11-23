import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200); await p.tap('#bPlay'); await p.waitForTimeout(500);
const tapWorld=async(x,y)=>{ await p.evaluate(([x,y])=>__ltm.G.ren.centerOn(x,y,true),[x,y]); await p.waitForTimeout(80); const s=await p.evaluate(([x,y])=>__ltm.toScreen(x,y),[x,y]); await p.touchscreen.tap(s[0],s[1]+6); };
// người chơi chỉ điều tướng đi chiêu mộ, không ra lệnh cho trinh sát
const log=[];
for(let it=0;it<40;it++){
  const st=await p.evaluate(()=>{ const w=__ltm.world,f=w.factions[0],g=f.general; let b=null,bd=1e9; for(const [i] of f.memNeutral){ const x=i%w.W,y=(i/w.W)|0,d=Math.abs(x-g.x)+Math.abs(y-g.y); if(d<bd){bd=d;b=[x,y];} }
    const sc=f.units.filter(u=>!u.dead&&u.type==='scout'); return {t:Math.round(w.time),n:f.count,near:b,bd,dead:g.dead,scouts:sc.map(u=>u.mode+':'+u.stam).join(','),op:f.stats.opened,thr:(f.threats||[]).length,eng:f.units.filter(u=>!u.dead&&u.mode==='follow'&&u.target>=0&&u.tkind===0).length,kills:f.stats.kills}; });
  if(it%5===0) log.push(st);
  if(!st.dead){ await p.tap('[data-act=general]'); if(st.near && st.bd<40) await tapWorld(st.near[0],st.near[1]); else { const tg=await p.evaluate((k)=>{ const w=__ltm.world,g=w.factions[0].general,c=w.factions[0].camp; const a=k*1.1; return [Math.round(c.x+Math.cos(a)*(12+k)),Math.round(c.y+Math.sin(a)*(12+k))]; },it); await tapWorld(tg[0],tg[1]); } }
  await p.evaluate(()=>__ltm.stepSec(6));
  if(st.thr>0 && !globalThis.shot){ globalThis.shot=1; await p.evaluate(()=>{ const f=__ltm.world.factions[0]; const e=(f.threats&&f.threats[0])||f.units.find(u=>!u.dead&&u.target>=0); if(e) __ltm.G.ren.centerOn(e.x,e.y,true); }); await p.waitForTimeout(700); await p.screenshot({path:`test/${which}-engage.png`}); }
}
const sc=await p.evaluate(()=>{ const f=__ltm.world.factions[0]; const s=f.units.find(u=>!u.dead&&u.type==='scout'); if(s){ __ltm.G.ren.centerOn(s.x,s.y,true); __ltm.setSel([s]); } return !!s; });
await p.waitForTimeout(800); if(sc) await p.screenshot({path:`test/${which}-scout.png`});
console.table(log); console.log('errors',errs); await b.close();
