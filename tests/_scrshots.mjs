// ảnh chụp nhanh các màn HTML ở máy nhỏ để soát bằng mắt (không thuộc cổng phát hành)
import { chromium } from 'playwright';
const b=await chromium.launch();
for(const [w,h] of [[320,568],[568,320],[393,852]]){ const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(500);
  await p.screenshot({path:`/tmp/shots/s52-${w}x${h}-menu.png`});
  await p.evaluate(()=>{ save.xu=12345; save.inv={bun:99,tea:7,plank:1,smoke:0,scarecrow:12,compass:3,bandage:99}; save.pack=['bun','scarecrow','bandage']; openGear(); }); await p.waitForTimeout(250); await p.screenshot({path:`/tmp/shots/s52-${w}x${h}-gear.png`});
  await p.evaluate(()=>{ save.up={speed:5,power:2,armor:0,stamina:3,aura:1,weapon:4}; openForge(); }); await p.waitForTimeout(250); await p.screenshot({path:`/tmp/shots/s52-${w}x${h}-forge.png`});
  await p.evaluate(()=>{ showScreen(null); G.bwCfg={map:2,civ:'rome'}; startBigWar(2); __ltm.bw.intro=null; pause(true); }); await p.waitForTimeout(400); await p.screenshot({path:`/tmp/shots/s52-${w}x${h}-pause.png`});
  await p.evaluate(()=>{ G.paused=false; document.getElementById('pause').classList.add('hidden'); const bw=__ltm.bw; bw.over=true; bw.result={win:true}; bw.stats={eat:12345,win:57,lose:23,peak:45678,coins:95}; showBwResult(); }); await p.waitForTimeout(300); await p.screenshot({path:`/tmp/shots/s52-${w}x${h}-result.png`});
  await ctx.close(); }
await b.close();
