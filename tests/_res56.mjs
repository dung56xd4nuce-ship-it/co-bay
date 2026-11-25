import { chromium } from 'playwright';
const b=await chromium.launch();
for(const [W,H,tag] of [[852,393,'land'],[393,852,'port']]){ const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:2,isMobile:true,hasTouch:true}); await ctx.addInitScript(()=>{ try{ localStorage.setItem('ltm_tut','1'); }catch(e){} }); const p=await ctx.newPage();
  await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(800); if(tag==='port') await p.screenshot({path:`/tmp/shots/r-${tag}-menu.png`});
  for(const win of [true,false]){ await p.evaluate((win)=>{ if(G.bw) stopBigWar(true); G.resultShown=false; G.bwCfg={civ:'rome',map:0}; startBigWar(1); const bw=__ltm.bw; bw.time=215; bw.over=true; bw.result={win}; },win); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(500); await p.screenshot({path:`/tmp/shots/r-${tag}-${win?'win':'lose'}.png`}); await p.evaluate(()=>{ document.getElementById('result').classList.add('hidden'); }); }
  await ctx.close(); }
await b.close();
