import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const dev = which==='ios' ? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const {defaultBrowserType, ...o}=dev;
const browser = await chromium.launch(); const ctx = await browser.newContext(o); const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.route('**fonts.g*/**', r=>r.abort()); await page.route('**/art/**', r=>r.abort());
await page.goto('file://'+process.cwd()+'/dist/index.html'); await page.waitForTimeout(500);
await page.tap('#bPlay'); await page.waitForTimeout(800);
const tapTile=async(x,y)=>{ const [sx,sy]=await page.evaluate(([x,y])=>__ltm.toScreen(x,y),[x,y]); await page.touchscreen.tap(sx,sy); };
// Người chơi: điều tướng tới cụm dễ tìm gần nhất (nhớ được)
const tgt = await page.evaluate(()=>{ const w=__ltm.world, f=w.factions[0], g=f.general; let b=null,bd=1e9; for(const [i] of f.memNeutral){ const x=i%w.W,y=(i/w.W)|0; const d=Math.abs(x-g.x)+Math.abs(y-g.y); if(d<bd){bd=d;b=[x,y];} } return b; });
console.log('target neutral', tgt);
await tapTile(tgt[0],tgt[1]); await page.waitForTimeout(300);
await page.screenshot({path:`test/${which}-order.png`});
await page.evaluate(()=>__ltm.stepSec(25)); await page.waitForTimeout(600);
const st=await page.evaluate(()=>{ const f=__ltm.world.factions[0]; return {count:f.count, units:f.units.filter(u=>!u.dead&&u.type!=='general').map(u=>u.type)}; });
console.log('after 25s', st);
await page.evaluate(()=>{ const g=__ltm.world.factions[0].general; __ltm.G.ren.centerOn(g.x,g.y,true); }); await page.waitForTimeout(400);
await page.screenshot({path:`test/${which}-recruit.png`});
// nhấp đúp vào 1 lính
const sol=await page.evaluate(()=>{ const u=__ltm.world.factions[0].units.find(u=>!u.dead&&u.type!=='general'); return u&&[u.x,u.y,u.type]; });
if(sol){ const [sx,sy]=await page.evaluate(([x,y])=>{ const p=__ltm.toScreen(x,y); return [p[0],p[1]-10]; },sol); await page.touchscreen.tap(sx,sy); await page.waitForTimeout(150); await page.touchscreen.tap(sx,sy); await page.waitForTimeout(200);
  const sel=await page.evaluate(()=>({n:__ltm.G.sel.size, label:document.getElementById('selname').textContent, all:__ltm.world.factions[0].units.filter(u=>!u.dead&&u.type===__ltm.world.units[[...__ltm.G.sel][0]].type).length})); console.log('double tap', sol[2], sel);
  await page.screenshot({path:`test/${which}-dbl.png`}); }
console.log('errors',errs); await browser.close();
