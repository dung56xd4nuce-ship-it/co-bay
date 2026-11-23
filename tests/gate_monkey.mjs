// "KHỈ BẤM": chạm/kéo/chụm/giữ-kéo NGẪU NHIÊN hàng trăm lần lên trận đang chạy (AI vẫn đánh), trên Android + iOS, ngang + dọc.
// Sau mỗi đợt: không lỗi JS, không toạ độ/quân số NaN, máy quay hợp lệ, HUD còn nguyên, trận vẫn chạy.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
const rnd=(seed)=>()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
for(const [dn,dev,mode,seed] of [[DEVICES[0][0],DEVICES[0][1],'1v1',11],[DEVICES[1][0],DEVICES[1][1],'royale',23],[PORTRAIT[0][0],PORTRAIT[0][1],'royale',37],[PORTRAIT[1][0],PORTRAIT[1][1],'1v1',41]]){ console.log(dn,mode);
  const T=await open(b,dev); const {p}=T; const R=rnd(seed);
  await T.ev((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:77,map:3,civ:'mongol'} : {map:6,civ:'daiviet'}; startBigWar(mode==='royale'?5:4); },mode); await p.waitForTimeout(700);
  const vw=await T.ev(()=>innerWidth), vh=await T.ev(()=>innerHeight); let acts=0;
  for(let round=0;round<6;round++){
    for(let i=0;i<34;i++){ const k=R(), x=8+R()*(vw-16), y=8+R()*(vh-16);
      if(k<0.52) await T.tap(x,y,20+R()*60);
      else if(k<0.74) await T.drag(x,y,Math.max(4,Math.min(vw-4,x+(R()-0.5)*320)),Math.max(4,Math.min(vh-4,y+(R()-0.5)*220)),6);
      else if(k<0.86) await T.pinch(vw*(0.3+R()*0.4),vh*(0.3+R()*0.4),60+R()*120,60+R()*200,6);
      else if(k<0.95) await T.drag(x,y,Math.max(4,Math.min(vw-4,x+(R()-0.5)*260)),Math.max(4,Math.min(vh-4,y+(R()-0.5)*200)),6,420);
      else { await T.ev(()=>{ if(G.paused) bwSetPause(false); document.getElementById('ask').classList.add('hidden'); }); }
      acts++; }
    // nếu khỉ bấm ra menu/hộp thoại thì đóng lại cho trận chạy tiếp, rồi tua thêm 20 giây trận
    const st=await T.ev(()=>{ const vis=[...document.querySelectorAll('.screen,#ask')].filter(e=>!e.classList.contains('hidden')&&e.getBoundingClientRect().width>0).map(e=>e.id);
      if(!__ltm.bw) return {gone:true,vis};
      for(const id of ['ask','pause','help','civPick','bossPick','p2p']){ const e=document.getElementById(id); if(e&&!e.classList.contains('hidden')){ if(id==='ask') document.getElementById('askN').click(); else if(id==='pause') bwSetPause(false); else e.classList.add('hidden'); } }
      G.paused=false; const bw=__ltm.bw; if(!bw) return {gone:true,vis:vis.concat(['(đóng hộp thoại xong thì mất trận)'])};
      if(!bw.over) for(let k=0;k<400;k++) bw.update(0.05);
      let nan=0; for(const a of bw.armies) if(![a.x,a.y,a.count].every(Number.isFinite)) nan++; for(const n of bw.nodes) if(![n.x,n.y,n.count].every(Number.isFinite)) nan++;
      const R2=bw.hudRects(), bad=Object.keys(R2).filter(k=>![R2[k].x,R2[k].y,R2[k].w,R2[k].h].every(Number.isFinite));
      return {t:bw.time,over:bw.over,nan,cam:[bw.camX,bw.camY,bw.zoom,bw.zoomTgt].every(Number.isFinite)&&bw.zoom>0.05&&bw.zoom<12,hud:Object.keys(R2).length,bad,armies:bw.armies.length,battles:bw.battles.length,texts:bw.texts.length}; });
    if(st.gone){ ok(st.vis.length>0&&!st.vis.some(v=>v.startsWith('(')),`đợt ${round+1}: khỉ bấm thoát trận → đang ở một màn hình tử tế (${st.vis.join(', ')||'MÀN TRỐNG'})`); await T.ev((mode)=>{ for(const e of document.querySelectorAll('.screen,#ask')) e.classList.add('hidden'); G.bwCfg= mode==='royale'? {royale:36,seed:78,map:4,civ:'rome'} : {map:7,civ:'rome'}; startBigWar(mode==='royale'?5:4); },mode); await p.waitForTimeout(500); continue; }
    ok(st.nan===0&&st.cam&&st.bad.length===0&&st.hud>=5,`đợt ${round+1} (${acts} thao tác, trận ${Math.round(st.t)}s): trạng thái lành lặn — NaN ${st.nan}, máy quay ${st.cam?'ổn':'HỎNG'}, HUD ${st.hud} ô, ${st.armies} đạo quân, ${st.battles} trận`);
    ok(st.armies<1500&&st.texts<600,`đợt ${round+1}: không phình bộ nhớ (${st.armies} đạo, ${st.texts} chữ nổi)`);
    if(st.over){ await T.ev((mode)=>{ document.getElementById('result').classList.add('hidden'); G.bwCfg= mode==='royale'? {royale:36,seed:79,map:5,civ:'rome'} : {map:8,civ:'rome'}; startBigWar(mode==='royale'?5:4); },mode); await p.waitForTimeout(500); } }
  // sau trận hỗn loạn: game vẫn vẽ và nhận lệnh bình thường
  const f0=await T.ev(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
  ok(f0>=10,`sau ${acts} thao tác ngẫu nhiên game vẫn vẽ đều (${f0} khung/giây trên máy thử)`);
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs.slice(0,2).join(' | '):''));
  await T.ctx.close(); }
await finish('KHỈ BẤM NGẪU NHIÊN',b);
