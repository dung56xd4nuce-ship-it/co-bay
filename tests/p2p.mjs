import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream']});
const ctx=await b.newContext(o); const H=await ctx.newPage(), G2=await ctx.newPage();
const errs=[]; H.on('pageerror',e=>errs.push('H:'+e.message)); G2.on('pageerror',e=>errs.push('G:'+e.message));
for(const p of [H,G2]){ await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200); }
// Host tạo phòng
await H.evaluate(()=>{ P2P.open(); P2P.host(); });
await H.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,{timeout:15000});
const offer=await H.evaluate(()=>document.getElementById('p2pOut').value);
// Khách dán mã mời
await G2.evaluate(()=>{ P2P.open(); P2P.join(); });
await G2.evaluate((v)=>{ document.getElementById('p2pIn').value=v; document.getElementById('p2pGo').onclick(); },offer);
await G2.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,{timeout:15000});
const answer=await G2.evaluate(()=>document.getElementById('p2pOut').value);
// Host dán mã trả lời
await H.evaluate((v)=>{ document.getElementById('p2pIn').value=v; document.getElementById('p2pGo').onclick(); },answer);
await H.waitForFunction(()=>P2P.connected&&!!window.__ltm.bw,{timeout:20000});
await G2.waitForFunction(()=>P2P.connected&&!!window.__ltm.bw,{timeout:20000});
await G2.waitForTimeout(1500);
const st1=await G2.evaluate(()=>({ fid:__ltm.bw.localFid, nodes:__ltm.bw.nodes.length, t:__ltm.bw.time,
  myCampEast: __ltm.bw.nodes[1].owner===1&&__ltm.bw.nodes[1].count>0 }));
// Khách ra lệnh: chọn node phe 1, hành quân ra đất trống -> chủ phòng phải sinh đạo quân owner 1
await G2.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===1&&n.count>0&&!n.camp)||bw.nodes[1];
  bw.tap(s.x,s.y); bw.tap(s.x-500,s.y); const m=bw.menu; if(m) bw.menuPick('move'); });
await H.waitForFunction(()=>__ltm.bw.armies.some(a=>a.owner===1),{timeout:8000}).catch(()=>{});
const hostSees=await H.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===1).length);
await G2.waitForTimeout(800);
const guestMirror=await G2.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===1).length);
// Chủ phòng cũng ra lệnh bình thường
await H.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0];
  bw.tap(s.x,s.y); bw.tap(s.x+400,s.y); const m=bw.menu; if(m) bw.menuPick('move'); });
await H.waitForTimeout(600);
const hostOwn=await H.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===0).length);
await G2.screenshot({path:'test/p2p-guest.png'});
console.log(JSON.stringify({guest:st1, hostSeesGuestArmy:hostSees, guestMirror, hostOwn, errors:errs.slice(0,3)}));
await b.close();
