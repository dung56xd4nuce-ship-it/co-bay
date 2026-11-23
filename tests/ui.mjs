import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort()); await p.route('**/art/**', r=>r.abort());
await p.goto('file://'+process.cwd()+'/dist/index.html'); await p.waitForTimeout(300); await p.tap('#bPlay'); await p.waitForTimeout(500);
const spawned=await p.evaluate(()=>{ const w=__ltm.world, f=w.factions[0], g=f.general; const out=[];
  const spots=[[g.x+3,g.y+2],[g.x+4,g.y+2],[g.x+3,g.y+3],[g.x-3,g.y+2],[g.x-4,g.y+3]];
  for(const [x,y] of spots){ const i=y*w.W+x; if(!w.occ[i] && PASSABLE[w.t[i]]){ const u=w.spawn(0,'archer',x,y); const sq=w.newSquad(0); sq.members.add(u); u.squad=sq; out.push(u.id);} }
  // 3 cung thủ ở xa ngoài màn hình
  for(let k=0;k<3;k++){ for(let r=0;r<20;r++){ const x=g.x+30+k*2, y=g.y+30+r; const i=y*w.W+x; if(!w.occ[i]&&PASSABLE[w.t[i]]){ const u=w.spawn(0,'archer',x,y); u.mode='hold'; out.push(u.id); break; } } }
  w.spawn(0,'spear',g.x+5,g.y-2);
  return out.length; });
await p.evaluate(()=>__ltm.stepSec(0.1)); await p.waitForTimeout(300);
const a=await p.evaluate(()=>{ const w=__ltm.world; const u=w.factions[0].units.find(u=>u.type==='archer'&&Math.abs(u.x-w.factions[0].general.x)<6); const s=__ltm.toScreen(u.px,u.py); return [s[0],s[1]-12,u.id]; });
await p.touchscreen.tap(a[0],a[1]); await p.waitForTimeout(120);
const one=await p.evaluate(()=>[__ltm.G.sel.size, document.getElementById('selname').textContent]);
await p.touchscreen.tap(a[0],a[1]); await p.waitForTimeout(250);
const all=await p.evaluate(()=>[__ltm.G.sel.size, document.getElementById('selname').textContent, [...__ltm.G.sel].every(id=>__ltm.world.units[id].type==='archer')]);
await p.screenshot({path:`test/${which}-dbl.png`});
// ra lệnh chung
const g=await p.evaluate(()=>{ const g=__ltm.world.factions[0].general; return __ltm.toScreen(g.x-6,g.y+1); }); await p.touchscreen.tap(g[0],g[1]); await p.waitForTimeout(100);
const ord=await p.evaluate(()=>{ const us=[...__ltm.G.sel].map(id=>__ltm.world.units[id]); return {n:us.length, modes:us.map(u=>u.mode).join(','), orders:[...new Set(us.map(u=>u.order&&u.order.id))]}; });
// nút Giữ vị trí & Theo tướng
await p.tap('[data-act=hold]'); const held=await p.evaluate(()=>[...__ltm.G.sel].every(id=>__ltm.world.units[id].mode==='hold'));
await p.tap('[data-act=follow]'); const fol=await p.evaluate(()=>[...__ltm.G.sel].every(id=>__ltm.world.units[id].mode==='follow'));
// kéo bản đồ và phóng
const cam0=await p.evaluate(()=>({...__ltm.G.ren.cam}));
await p.evaluate(async()=>{}); 
console.log(which,{spawned, singleTap:one, doubleTap:all, sharedOrder:ord, hold:held, follow:fol, errs});
await b.close();
