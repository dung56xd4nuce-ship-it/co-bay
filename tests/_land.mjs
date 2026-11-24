import { chromium } from 'playwright';
const b=await chromium.launch(); for(const [W,H,tag] of [[852,393,'ip'],[640,360,'sm']]){ const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}); const p=await ctx.newPage();
await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(300);
await p.evaluate(()=>{ G.bwCfg={civ:'rome'}; startBigWar(1); const bw=__ltm.bw; bw.time=215; bw.over=true; bw.result={win:true}; }); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(400); await p.screenshot({path:`/tmp/shots/l-${tag}-win.png`});
await p.evaluate(()=>{ document.getElementById('bNext').click(); const bw=__ltm.bw; for(let i=0;i<900;i++) bw.update(0.05); stopBigWar(true); G.bwCfg={royale:36,seed:5,civ:'rome',diff:2,bio:1}; startBigWar(5); __ltm.bw.time=900; stopBigWar(true); document.getElementById('bBW').click(); }); await p.waitForTimeout(500); await p.screenshot({path:`/tmp/shots/l-${tag}-pick.png`}); await ctx.close(); }
await b.close();
