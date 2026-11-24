// Hành trình 1v1 như người chơi mới trên máy giống máy của user (395×859 @3×): chụp từng bước để soát bằng mắt
import { chromium } from 'playwright';
const b=await chromium.launch(); const W=+(process.argv[2]||395), H=+(process.argv[3]||859), tag=process.argv[4]||'doc';
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:3,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(500);
const shot=(n)=>p.screenshot({path:`/tmp/shots/j-${tag}-${n}.png`}); const tap=async(sel)=>{ const e=await p.$(sel); const q=await e.boundingBox(); await p.touchscreen.tap(q.x+q.width/2,q.y+q.height/2); await p.waitForTimeout(350); };
await shot('1-menu'); await tap('#bBW'); await shot('2-chon-che-do'); await tap('#bBoss1v1'); await p.waitForTimeout(300); await shot('3-chon-nuoc');
await tap('#civGo'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await p.waitForTimeout(1500); await shot('4-vao-tran-ai1');
await p.evaluate(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); }); await p.waitForTimeout(2500); await shot('5-dang-choi-ai1');
console.log('ải',await p.evaluate(()=>({lv:__ltm.bw.lv,name:__ltm.bw.L&&__ltm.bw.L.name,map:__ltm.bw.mapName||null,nodes:__ltm.bw.nodes.length,en:__ltm.bw.nodes.filter(n=>n.owner===1).length,mine:__ltm.bw.nodes.filter(n=>n.owner===0).length})));
await p.evaluate(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:true}; }); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(500); await shot('6-thang-ai1');
console.log('sau thắng:',await p.evaluate(()=>({bwMax:JSON.parse(localStorage.ltm_save).bwMax,next:!document.getElementById('bNext').classList.contains('hidden'),btns:[...document.querySelectorAll('#result .btn')].filter(e=>e.offsetParent).map(e=>e.textContent.trim())})));
await tap('#bNext'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lv===2&&__ltm.bw.lastVw>0); await p.waitForTimeout(1500); await shot('7-vao-tran-ai2');
await p.evaluate(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); }); await p.waitForTimeout(1500); await shot('8-dang-choi-ai2');
await tap('#bwBack'); await p.waitForTimeout(400); await shot('9-roi-tran'); const ask=await p.evaluate(()=>!document.getElementById('ask').classList.contains('hidden')); if(ask){ await tap('#askY'); }
await p.waitForTimeout(400); await p.reload(); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(400); await tap('#bBW'); await shot('10-mo-lai-chon-che-do'); await tap('#bBoss1v1'); await p.waitForTimeout(300); await shot('11-mo-lai-chon-nuoc');
console.log('mở lại:',await p.evaluate(()=>({stage:document.getElementById('civStage').textContent,bwMax:JSON.parse(localStorage.ltm_save).bwMax})),'lỗi',errs.slice(0,3));
await b.close();
