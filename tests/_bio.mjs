// (5.3) chụp 10 kiểu địa hình + màn chiến dịch ngang để soát bằng mắt
import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:859,height:395},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(300);
await p.evaluate(()=>{ const s=JSON.parse(localStorage.ltm_save||'{}'); s.bwMax=7; s.camp={best:{1:215,2:340,3:402,4:515,5:633,6:780}}; localStorage.ltm_save=JSON.stringify(s); }); await p.reload(); await p.waitForFunction(()=>window.__ltm);
await p.evaluate(()=>{ document.getElementById('bBW').click(); document.getElementById('bBoss1v1').click(); }); await p.waitForTimeout(400); await p.screenshot({path:'/tmp/shots/b-camp-land.png'});
for(const m of [0,3,6,9,12,15,18,21,24,27]){ await p.evaluate((m)=>{ G.bwCfg={civ:'rome',map:m}; startBigWar(Math.floor(m/3)+1); __ltm.bw.intro=null; document.getElementById('stageIntro').classList.add('hidden'); },m); await p.waitForTimeout(3800); await p.screenshot({path:`/tmp/shots/b-${m}.png`}); }
console.log('errs',errs.slice(0,3)); await b.close();
