import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200); await p.tap('#bPlay'); await p.waitForTimeout(400);
await p.evaluate(()=>{ const w=__ltm.world, f=w.factions[0]; const tw=w.map.towers[0]; f.explored.fill(1); document.getElementById('toasts').style.display='none'; document.getElementById('hint').style.display='none'; __ltm.G.ren.centerOn(tw.x,tw.y-1,true); __ltm.G.ren.cam.z=2.2; __ltm.stepSec(1); });
await p.waitForTimeout(800); await p.screenshot({path:'test/tower-closeup.png'});
await b.close();
