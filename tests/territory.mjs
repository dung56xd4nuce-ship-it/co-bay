// VÙNG CHIẾM ĐÓNG sáng (kể cả cứ điểm rút hết quân + đường nối), mất cứ điểm thì tối lại; địch chỉ phục kích trong VÙNG TỐI; đo FPS khi lãnh thổ lớn
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
// độ tối thật trên màn hình tại một điểm thế giới (đọc pixel canvas)
const lum=(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw, cv=document.getElementById('game'), dpr=cv.width/cv.clientWidth; const sx=((wx-bw.camX)*bw.scale)*dpr, sy=((wy-bw.camY)*bw.scale)*dpr; const d=cv.getContext('2d').getImageData(sx|0,sy|0,1,1).data; return Math.round((d[0]+d[1]+d[2])/3); },[wx,wy]);
const out={};
await p.evaluate(()=>{ G.bwCfg={royale:36,seed:91,map:2}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.nextAI=1e9; });
await p.waitForTimeout(300);
// chiếm 1 cứ điểm rồi rút hết quân khỏi đó
const r=await p.evaluate(()=>{ const bw=__ltm.bw; const cap=bw.nodes.find(n=>n.capOf===0);
  const n=bw.nodes.filter(m=>m.owner===2&&!m.camp).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y))[3];
  n.owner=0; n.count=0; // đã chiếm, quân đã rút đi nơi khác
  window.__T=n; bw.zoom=bw.zoomTgt=1; const s=bw.scale0; bw.camX=n.x-(bw.lastVw)/s/2; bw.camY=Math.max(0,n.y-(bw.lastVh)/s/2); bw._updateVision(); return {x:n.x,y:n.y}; });
await p.waitForTimeout(400); out.diemDaChiemRutQuan_sang=await lum(r.x,r.y+40);
await p.screenshot({path:`/tmp/terr_${tag}_1.png`});
// địch chiếm lại -> tối
await p.evaluate(()=>{ const n=window.__T; n.owner=5; n.count=300; __ltm.bw._updateVision(); });
await p.waitForTimeout(400); out.biDichChiemLai_toi=await lum(r.x,r.y+40);
await p.screenshot({path:`/tmp/terr_${tag}_2.png`});
// đường nối 2 cứ điểm ta sáng
const rd=await p.evaluate(()=>{ const bw=__ltm.bw; const rr=bw.roads.find(q=>q.a!=null&&Math.hypot(q.x2-q.x1,q.y2-q.y1)>700); bw.nodes[rr.a].owner=0; bw.nodes[rr.b].owner=0; bw.nodes[rr.a].count=0; bw.nodes[rr.b].count=0;
  const mx=(rr.x1+rr.x2)/2, my=(rr.y1+rr.y2)/2; const s=bw.scale0; bw.camX=mx-(bw.lastVw)/s/2; bw.camY=Math.max(0,my-(bw.lastVh)/s/2); bw._updateVision(); return {mx,my,L:Math.round(Math.hypot(rr.x2-rr.x1,rr.y2-rr.y1))}; });
await p.waitForTimeout(400); out.giuaDuongNoi=rd.L+'px, sáng='+await lum(rd.mx,rd.my);
// AI phục kích: điểm phục không nằm trong vùng sáng của mục tiêu
const amb=await p.evaluate(()=>{ G.bwCfg={map:3}; startBigWar(10); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; bw.nextWaveF={};
  const mine=bw.nodes.find(n=>n.owner===0&&n.camp); let inLight=0, total=0;
  for(let k=0;k<40;k++){ bw.armies=bw.armies.filter(a=>!a.aiAmbush);
    const pa={owner:0,type:'spear',count:900,x:mine.x+(k%2?300:2600)+k*20,y:mine.y,to:-1,tx:mine.x+(k%2?1600:3900),ty:mine.y+(k%5-2)*120,camped:false,trail:0,food:100,done:false};
    const ai={owner:1,type:'spear',count:900,x:mine.x+(k%2?1100:3400)+k*10,y:mine.y+150,to:-1,trail:0,food:100,done:false,camped:true};
    bw.armies.push(pa,ai); bw.aiTurn(1); if(ai.aiAmbush){ total++; if(bw.aiVis(ai.tx,ai.ty,0)) inLight++; } bw.armies=bw.armies.filter(a=>a!==pa&&a!==ai); }
  return {soLanDatPhuc:total, trongVungSang:inLight}; });
out.phucKichAI=amb;
// FPS khi ta chiếm 120 cứ điểm
const fps=await p.evaluate(async()=>{ G.bwCfg={royale:36,seed:91,map:2}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{};
  const cap=bw.nodes.find(n=>n.capOf===0); bw.nodes.filter(n=>!n.camp).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y)).slice(0,120).forEach(n=>{n.owner=0;});
  bw._updateVision(); const nv=bw._viewers.length;
  await new Promise(r=>setTimeout(r,500)); let n=0; const t0=performance.now(); await new Promise(res=>{ const tick=()=>{ n++; bw.camX=(n*40)%9000; if(performance.now()-t0<3000) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
  return {diemSang:nv, fps:+(n/3).toFixed(1)}; });
out.hieuNang120CuDiem=fps;
console.log(dev, JSON.stringify(out)); console.log('errors',errs.length?errs:'none'); await b.close();
