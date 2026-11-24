// v2.7: HUD phía trên mờ khi rảnh, chạm vào thì rõ (Pixel 7 + iPhone 14 Pro, landscape)
import { chromium, devices } from 'playwright';
const b=await chromium.launch();
for(const dn of ['Pixel 7 landscape','iPhone 14 Pro landscape']){
  const {defaultBrowserType, ...o}=devices[dn]; const ctx=await b.newContext(o); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
  const tap=async(id)=>{ const r=await p.evaluate((id)=>{const r2=document.getElementById(id).getBoundingClientRect();return [r2.x+r2.width/2,r2.y+r2.height/2];},id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
  await tap('bBW'); await tap('bBoss1v1'); await p.evaluate(()=>document.querySelector('.stg.cur').click()); await p.waitForTimeout(600);
  await p.waitForTimeout(3800);
  const idle=await p.evaluate(()=>({a:__ltm.bw.hudA, bar:document.getElementById('bwbar').style.opacity}));
  await p.screenshot({path:`/tmp/hud_${dn.split(' ')[0]}_idle.png`});
  await p.touchscreen.tap(560,20); await p.waitForTimeout(250);
  const tapped=await p.evaluate(()=>({a:__ltm.bw.hudA}));
  await p.screenshot({path:`/tmp/hud_${dn.split(' ')[0]}_tapped.png`});
  console.log(dn,'idle alpha',idle.a.toFixed(2),'bar',idle.bar,'| after tap alpha',tapped.a.toFixed(2),'| errors',errs.length?errs:'none');
  await ctx.close();
}
await b.close();
