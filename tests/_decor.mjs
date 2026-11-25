import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:900,height:420},deviceScaleFactor:2,isMobile:true,hasTouch:true})).newPage(); await p.addInitScript(()=>{ try{ localStorage.setItem('ltm_tut','1'); }catch(e){} });
await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(600);
for(const [tag,on] of [['all',['banners','lanterns','blossom','gold','fireworks','dragon']],['a',['banners','gold']],['b',['lanterns','blossom']],['c',['dragon','fireworks']]]){
  await p.evaluate((on)=>{ save.decor={own:{banners:1,lanterns:1,blossom:1,gold:1,fireworks:1,dragon:1},on}; Save.set(save); openGear(); document.getElementById('bToDecor').click(); const cv=document.getElementById('decPrev'); cv.style.width='460px'; cv.style.height='400px'; },on);
  await p.waitForTimeout(1300); await (await p.$('#decPrev')).screenshot({path:`/tmp/shots/d-${tag}.png`}); }
await b.close();
