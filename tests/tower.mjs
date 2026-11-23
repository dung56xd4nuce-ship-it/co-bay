import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500); await p.tap('#bPlay'); await p.waitForTimeout(500);
// đưa trinh sát tới cạnh vọng gác rồi để nó tự bước vào
const info=await p.evaluate(()=>{ const w=__ltm.world, f=w.factions[0], g=f.general;
  // mở đường tới vọng gác gần nhất để kiểm nhanh
  let tw=null, bd=1e9; for(const t2 of w.map.towers){ const d=Math.abs(t2.x-g.x)+Math.abs(t2.y-g.y); if(d<bd){bd=d;tw=t2;} }
  const sc=w.spawn(0,'scout',g.x+1,g.y+1); const sq=w.newSquad(0); sq.members.add(sc); sc.squad=sq;
  for(let y=Math.min(g.y,tw.y)-2;y<=Math.max(g.y,tw.y)+2;y++) for(let x=Math.min(g.x,tw.x)-2;x<=Math.max(g.x,tw.x)+2;x++){ const i=y*w.W+x; if(w.inb(x,y)) f.explored[i]=1; }
  const op0=f.stats.opened; w.cmdMove([sc],tw.x,tw.y);
  __ltm.stepSec(30); __ltm.G.ren.centerOn(tw.x,tw.y,true); __ltm.G.ren.cam.z=1.4;
  return {op:f.stats.opened-op0, taken:f.towersTaken? f.towersTaken.size:0, scAt:[sc.x-tw.x,sc.y-tw.y]}; });
await p.waitForTimeout(900); await p.screenshot({path:`test/${which}-tower.png`});
// điểm danh ở phút 4
await p.evaluate(()=>__ltm.stepSec(220));
const ping=await p.evaluate(()=>({t:__ltm.world.time|0, ping:__ltm.world.pingUntil>__ltm.world.time}));
await p.waitForTimeout(500); await p.screenshot({path:`test/${which}-ping.png`});
console.log(which, info, ping, 'errors', errs); await b.close();
