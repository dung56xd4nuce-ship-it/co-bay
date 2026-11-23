import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
await p.screenshot({path:`test/${which}-A-menu.png`});
await p.evaluate(()=>{ save.xu=900; Save.set(save); refreshXu(); }); await p.tap('#bForge'); await p.waitForTimeout(500); await p.screenshot({path:`test/${which}-A-forge.png`});
await p.tap('#forge [data-back]'); await p.tap('#bPlay'); await p.waitForTimeout(1200);
await p.screenshot({path:`test/${which}-A-start.png`});
// chơi: đưa tướng tới lính gần nhất
await p.evaluate(()=>{ const w=__ltm.world,f=w.factions[0],g=f.general; let b=null,bd=1e9; for(const [i] of f.memNeutral){ const x=i%w.W,y=(i/w.W)|0,d=Math.abs(x-g.x)+Math.abs(y-g.y); if(d<bd){bd=d;b=[x,y];} } w.cmdMove([g],b[0],b[1]); __ltm.stepSec(40); __ltm.G.ren.centerOn(g.x,g.y,true); });
await p.waitForTimeout(1200); await p.screenshot({path:`test/${which}-A-play.png`});
await p.evaluate(()=>{ const w=__ltm.world; w.end(0,'drum'); }); await p.waitForTimeout(2600); await p.screenshot({path:`test/${which}-A-win.png`});
console.log(which, errs); await b.close();
