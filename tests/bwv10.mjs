import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
const bb=await p.evaluate(()=>{ const r=document.getElementById('bBW').getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; });
await p.touchscreen.tap(bb[0],bb[1]); await p.waitForTimeout(600);
const r1=await p.evaluate(()=>{
  const bw=__ltm.bw;
  // quân số địch ẩn cả khi sát quân ta
  const hiddenAll=bw.nodes.filter(n=>n.owner!==0&&n.count>0).every(n=>!bw.visNow(n));
  // công sự có trên bản đồ
  const structs=[...new Set(bw.nodes.filter(n=>n.struct).map(n=>n.struct))];
  // tìm node ta có thể mai phục; nếu không có, đổi địa hình 1 node ta để test nút
  let amb=bw.nodes.find(n=>bw.canAmbush(n));
  if(!amb){ amb=bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0); if(amb) amb.ter='forest'; }
  return {hiddenAll, structs, ambId: amb? amb.id:-1};
});
let ambTest=null;
if(r1.ambId>=0){
  // chọn node rồi bấm nút 🪤 bằng chạm thật
  const pos=await p.evaluate((id)=>{ const bw=__ltm.bw,n=bw.nodes[id]; const r=document.getElementById('game').getBoundingClientRect();
    const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,n.x-viewW/2)); bw.followT=0;
    return [(n.x-bw.camX)*bw.scale+r.left, n.y*bw.scale+r.top]; }, r1.ambId);
  await p.touchscreen.tap(pos[0],pos[1]); await p.waitForTimeout(250);
  const btn=await p.evaluate(()=>{ const bw=__ltm.bw; if(!bw._ambBtn) return null; const r=document.getElementById('game').getBoundingClientRect();
    const sc=r.width/document.getElementById('game').width*(window.devicePixelRatio||1);
    return [bw._ambBtn.x+bw._ambBtn.w/2, bw._ambBtn.y+bw._ambBtn.h/2]; });
  if(btn){
    const org=await p.evaluate(()=>{ const r=document.getElementById('game').getBoundingClientRect(); return [r.left,r.top]; });
    await p.touchscreen.tap(org[0]+btn[0], org[1]+btn[1]);
    await p.waitForTimeout(250);
    ambTest=await p.evaluate((id)=>({on:!!__ltm.bw.nodes[id].ambush, mult:__ltm.bw.ambushMult(__ltm.bw.nodes[id])}), r1.ambId);
  } else ambTest={btn:false};
}
// đánh mọi nơi: gửi quân tới trại địch xuyên bản đồ
const far=await p.evaluate(()=>{ const bw=__ltm.bw; const src=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.ambush); const camp=bw.nodes[1];
  bw.sel=src; bw.tap(camp.x,camp.y); return bw.armies.some(a=>a.owner===0&&a.to===camp.id); });
await p.screenshot({path:`test/${which}-v10.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, JSON.stringify({...r1, ambTest, attackAnywhere:far, fps}), 'errors', errs);
await b.close();
