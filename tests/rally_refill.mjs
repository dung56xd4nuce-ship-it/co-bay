// Gọi quân 5/10 trại & tổng động viên BẰNG CHẠM THẬT (nút 📣 → chọn → chạm điểm tập kết);
// quân ở trại chăn nuôi / điểm luyện binh phải tự chạy về trấn thủ các trại vừa trống
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const {width:W,height:H}=p.viewportSize(); const out=[];
for(const [label,idx] of [['Gọi 5 trại',0],['Gọi 10 trại',1],['Tổng động viên',2]]){
  await p.evaluate(()=>{ G.bwCfg={royale:36,seed:91,map:2}; startBigWar(5); __ltm.bw.intro=null; }); await p.waitForTimeout(400);
  const setup=await p.evaluate(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9;
    const cap=bw.nodes.find(n=>n.capOf===0);
    const near=bw.nodes.filter(n=>n.owner===2&&!n.camp).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y)).slice(0,16);
    let farms=0,trains=0; for(const n of near){ n.owner=0; n.count=600; if(n.eco==='farm') farms++; if(n.eco==='train') trains++; }
    bw._updateVision(); const s=bw.scale0; bw.zoom=bw.zoomTgt=1; bw.camX=cap.x-bw.lastVw/s/2+500; bw.camY=Math.max(-100,cap.y-bw.lastVh/s/2);
    return {farms,trains}; });
  await p.waitForTimeout(300);
  const rb=await p.evaluate(()=>__ltm.bw._rallyBtn);
  await p.touchscreen.tap(rb.x+rb.w/2,rb.y+rb.h/2); await p.waitForTimeout(250);
  const rr=await p.evaluate(()=>__ltm.bw._rallyRects); await p.touchscreen.tap(rr[idx].x+rr[idx].w/2,rr[idx].y+rr[idx].h/2); await p.waitForTimeout(250);
  const before=await p.evaluate(()=>__ltm.bw.armies.length);
  await p.touchscreen.tap(W*0.55,H*0.55); await p.waitForTimeout(300);
  const r=await p.evaluate((before)=>{ const bw=__ltm.bw, A=bw.armies.slice(before);
    const garr=A.filter(a=>a.garrison), rally=A.filter(a=>a.rally);
    const src=garr.map(a=>bw.nodes[a.from]); const ok=garr.every(a=>{ const f=bw.nodes[a.from], t=bw.nodes[a.to]; return (f.eco==='farm'||f.eco==='train')&&t.owner===0&&!t.eco; });
    const kept=src.every(f=>f.count>=30);
    // chạy mô phỏng tới khi quân trấn thủ tới nơi
    const note0=bw.notes.map(n=>n.text).find(t=>t.includes('trấn thủ'))||null; const targets=garr.map(a=>bw.nodes[a.to]);
    for(let i=0;i<900;i++) bw.update(0.1);
    const filled=targets.filter(t=>t.owner===0&&t.count>=100).length;
    return {goiDi:rally.length, quanTranThu:garr.length, dungNguonVaDich:ok, traiChanNuoiConGiuLai:kept, traiDuocLapDay:filled+'/'+targets.length, thongBao:note0}; },before);
  out.push(label+': '+JSON.stringify(r));
}
console.log(dev); out.forEach(l=>console.log('  '+l)); console.log('  errors',errs.length?errs:'none'); await b.close();
