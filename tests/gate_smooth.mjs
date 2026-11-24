// MƯỢT & ĐỠ PIN (5.1) — thử như người chơi trên máy giả lập Android + iOS:
//  • độ phân giải vẽ đứng yên (bản 5.0 cứ 6 giây đổi một lần → hình lúc mờ lúc nét, khựng mỗi lần đổi)
//  • nhịp khung hình: đang chạm thì vẽ đủ nhịp, rảnh tay thì 30 khung/giây, tạm dừng thì 10
//  • đang kéo bản đồ thì gần như không dựng ô; thả tay là nét lại ngay; kéo ngắn không lộ ô mờ vì đã dựng sẵn vành ngoài
//  • chỉ vẽ cứ điểm trong khung nhìn; lớp sương dùng canvas nhỏ; rung màn hình chỉ khi sự việc ở trong khung nhìn
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [name,dev] of [DEVICES[0],PORTRAIT[1]]){
  const T=await open(b,dev); const {p,cdp}=T; const W=await T.ev(()=>innerWidth), H=await T.ev(()=>innerHeight);
  await T.startBattle({royale:36,seed:77,map:3,civ:'rome'},5);
  await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0&&__ltm.bw.scale0>0,null,{timeout:15000});
  await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAiScout=1e9; });   // máy không ra quân: bài thử không phụ thuộc diễn biến trận

  // ---- 1) độ phân giải vẽ ----
  const c0=await T.ev(()=>{ const cv=document.getElementById('game'), r=cv.getBoundingClientRect(); return {w:cv.width,want:Math.round(r.width*Math.min(2,devicePixelRatio)),dpr:devicePixelRatio,cap:G.dprCap}; });
  ok(Math.abs(c0.w-c0.want)<=1&&c0.cap===2, `${name}: vào trận vẽ ở độ phân giải ${c0.w}px = bề rộng màn hình × ${Math.min(2,c0.dpr)} (trần 2.0, máy ${c0.dpr}×)`);
  const L=await T.ev(()=>{ const bw=__ltm.bw, keep={cap:G.dprCap,time:bw.time,intro:bw.intro,drops:PACE.drops}, o={}; bw.time=100; bw.intro=null;
    G.dprCap=2; PACE.slow=0; for(let i=0;i<110;i++) paceDpr(40,true); o.s4=G.dprCap;            // 4,4 giây chậm: chưa hạ
    for(let i=0;i<30;i++) paceDpr(40,true); o.s6=G.dprCap;                                       // quá 5 giây chậm liên tục: hạ MỘT nấc
    for(let i=0;i<3000;i++) paceDpr(16.7,true); o.fast=G.dprCap;                                 // 50 giây mượt sau đó: KHÔNG tự tăng lại
    for(let i=0;i<200;i++) paceDpr(70,false); o.idle=G.dprCap;                                   // rảnh tay mà vẫn chậm: hạ nấc nữa
    for(let i=0;i<2000;i++) paceDpr(90,false); o.floor=G.dprCap;                                 // sàn 1.25
    G.dprCap=2; PACE.slow=0; for(let i=0;i<3000;i++){ paceDpr(40,true); paceDpr(16.7,true); paceDpr(16.7,true); } o.mixed=G.dprCap;   // 1/3 số khung chậm: không hạ
    G.dprCap=2; PACE.slow=0; for(let i=0;i<400;i++) paceDpr(900,true); o.hitch=G.dprCap;        // khựng rất dài (app vừa quay lại từ nền): bỏ qua
    G.dprCap=keep.cap; PACE.slow=0; PACE.drops=keep.drops; bw.time=keep.time; bw.intro=keep.intro; return o; });
  ok(L.s4===2&&L.s6===1.5, `${name}: máy chậm kéo dài quá 5 giây mới hạ độ phân giải, và chỉ hạ một nấc (2 → ${L.s6}; sau 4 giây vẫn ${L.s4})`);
  ok(L.fast===1.5, `${name}: máy mượt trở lại cũng KHÔNG tự tăng độ phân giải giữa ván (giữ ${L.fast}) — hết cảnh hình lúc mờ lúc nét`);
  ok(L.idle===1.25&&L.floor===1.25, `${name}: hạ tối đa xuống 1.25 rồi dừng (${L.idle} → ${L.floor})`);
  ok(L.mixed===2&&L.hitch===2, `${name}: thỉnh thoảng một khung chậm hoặc một lần khựng dài không làm đổi độ phân giải (${L.mixed}, ${L.hitch})`);

  // ---- 2) nhịp khung hình ----
  await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.intro&&bw.skipIntro(); });
  const pace=(ms)=>T.ev((ms)=>new Promise(res=>{ const d0=PACE.drawn, s0=PACE.skip, t0=performance.now(); setTimeout(()=>res({drawn:PACE.drawn-d0,skip:PACE.skip-s0,ms:performance.now()-t0,act:PACE.act}),ms); }),ms);
  await T.until(()=>!PACE.act&&__ltm.bw._mapPending===0,null,12000);
  const idle=await pace(2000);
  ok(!idle.act, `${name}: không chạm quá 2 giây, máy quay đứng yên → chuyển sang chế độ nghỉ`);
  ok(idle.drawn<=Math.ceil(idle.ms/31.5)+2, `${name}: lúc nghỉ chỉ vẽ ${idle.drawn} khung trong ${Math.round(idle.ms)} ms (tối đa 30 khung/giây — đỡ tốn pin)`);
  if(idle.drawn+idle.skip>=idle.ms/1000*50) ok(idle.drawn>=idle.ms/1000*24&&idle.skip>0, `${name}: máy đủ nhanh thì lúc nghỉ vẫn giữ đều ~30 khung/giây (${idle.drawn} khung, bỏ ${idle.skip} nhịp vẽ thừa)`);
  // chạm vào màn hình: vẽ đủ nhịp ngay; thả tay 2 giây sau mới nghỉ
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:W*0.6,y:H*0.55,id:1}]}); await p.waitForTimeout(120);
  for(let i=1;i<=20;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:W*0.6-i*4,y:H*0.55,id:1}]}); await p.waitForTimeout(16); }
  const actDrag=await T.ev(()=>({act:PACE.act,touch:__ltm.bw._touch,idle:__ltm.bw._idle}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300);
  const actAfter=await T.ev(()=>PACE.act);
  ok(actDrag.act&&actDrag.touch===1&&!actDrag.idle&&actAfter, `${name}: đang kéo và ngay sau khi thả tay → vẽ đủ nhịp (không rơi về 30 khung/giây giữa chừng)`);
  ok(await T.until(()=>!PACE.act,null,6000), `${name}: thả tay hơn 2 giây → về chế độ nghỉ`);
  await T.ev(()=>{ G.paused=true; }); await p.waitForTimeout(250); const pz=await pace(1500); await T.ev(()=>{ G.paused=false; });
  ok(pz.drawn<=Math.ceil(pz.ms/95)+2, `${name}: đang tạm dừng chỉ vẽ ${pz.drawn} khung trong ${Math.round(pz.ms)} ms (tối đa ~10 khung/giây)`);

  // ---- 3) ô bản đồ: phóng to như người chơi hay để (bản đồ ở mức chi tiết ≥ 2) ----
  await T.ev(()=>{ const bw=__ltm.bw, cap=bw.nodes.find(n=>n.camp&&n.owner===bw.localFid), sc=0.2*Math.max(1,2/Math.min(2,devicePixelRatio)); bw.zoom=bw.zoomTgt=sc/bw.scale0; bw.camX=Math.max(0,Math.min(BW.W-bw.lastVw/sc,6000-bw.lastVw/sc/2)); bw.camY=Math.max(0,Math.min(BW.H-bw.lastVh/sc,3000-bw.lastVh/sc/2)); });
  // (chờ game vẽ thêm vài khung hình rồi mới hỏi trạng thái bản đồ — kẻo đọc phải số liệu của khung nhìn cũ)
  const nextFrames=async(n=3)=>{ const d0=await T.ev(()=>PACE.drawn); await T.until((d)=>PACE.drawn>=d,d0+n,5000); };
  await nextFrames(4);
  const sharp=await T.until(()=>{ const bw=__ltm.bw; return bw._mapPending===0&&bw._mapLod>=2&&!bw._mapFading; },null,25000);
  ok(sharp, `${name}: đứng yên thì bản đồ nét hết (không còn ô chờ dựng)`);
  const pre=await T.until(()=>{ const bw=__ltm.bw, M=bw._map; return bw._mapPending===0&&bw._mapPre===0&&!M.job&&!M.bg&&M.pre>0&&M.steady; },null,45000);
  const st0=await T.ev(()=>{ const bw=__ltm.bw, M=bw._map; let n=0; for(const k of M.tiles.keys()) if(k>=1e6) n++; return {pre:M.pre,tiles:n,lod:bw._mapLod,steady:!!M.steady,pool:MapTex.pool.length}; });
  ok(pre, `${name}: lúc rảnh tay đã dựng sẵn ${st0.pre} ô quanh màn hình (đang nhớ ${st0.tiles} ô, mức chi tiết ${st0.lod})`);
  // kéo NGẮN (dưới nửa ô): không được lộ ô mờ nào — vành ngoài đã dựng sẵn
  { await T.ev(()=>{ window.__pendMax=0; window.__pendWatch=setInterval(()=>{ const v=__ltm.bw._mapPending||0; if(v>window.__pendMax) window.__pendMax=v; },8); });
    const m0=await T.ev(()=>__ltm.bw._map.made);
    await T.drag(W*0.6,H*0.5,W*0.6-70,H*0.5-30,14); const r=await T.ev(()=>{ clearInterval(window.__pendWatch); return {pend:window.__pendMax,made:__ltm.bw._map.made}; });
    ok(r.pend===0, `${name}: kéo ngắn 70px → không có vùng nào phải hiện tạm ô mờ (số ô chờ dựng cao nhất: ${r.pend})`); }
  // kéo DÀI một mạch, tay chưa nhấc: gần như không dựng ô (tối đa 2 bước nhỏ mỗi khung hình), không khởi công ô dựng sẵn nào
  { await nextFrames(4); await T.until(()=>{ const M=__ltm.bw._map; return __ltm.bw._mapPending===0&&!M.job&&!M.bg&&M.steady; },null,45000);
    const a=await T.ev(()=>{ const M=__ltm.bw._map; return {hand:M.handSteps,made:M.made,pre:M.pre,drawn:PACE.drawn}; });
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:W*0.85,y:H*0.7,id:1}]});
    for(let i=1;i<=40;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:W*0.85-W*0.7*i/40,y:H*0.7-H*0.4*i/40,id:1}]}); await p.waitForTimeout(16); }
    await p.waitForTimeout(80);
    const z=await T.ev(()=>{ const M=__ltm.bw._map; return {hand:M.handSteps,made:M.made,pre:M.pre,drawn:PACE.drawn,pend:__ltm.bw._mapPending,touch:__ltm.bw._touch}; });
    const frames=z.drawn-a.drawn, steps=z.hand-a.hand;
    ok(z.touch===1&&steps<=frames*2+2, `${name}: kéo dài một mạch (tay chưa nhấc): ${frames} khung hình chỉ làm ${steps} bước dựng ô (tối đa 2 bước nhỏ mỗi khung) — không giật vì dựng bản đồ`);
    ok(z.pre===a.pre, `${name}: đang kéo thì không khởi công thêm ô dựng sẵn nào (${z.pre-a.pre})`);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const t0=Date.now(); const done=await T.until(()=>__ltm.bw._mapPending===0&&!__ltm.bw._mapFading,null,20000);
    ok(done, `${name}: thả tay → bản đồ nét lại hết sau ${((Date.now()-t0)/1000).toFixed(1)} giây`);
    const mem=await T.ev(()=>{ const M=__ltm.bw._map; let n=0, n0=0; for(const k of M.tiles.keys()){ if(k>=1e6) n++; else n0++; } return {n,n0,pool:MapTex.pool.length,scr:MapTex.scratch.length}; });
    ok(mem.n<=68+4, `${name}: bộ nhớ ô bản đồ có trần (${mem.n} ô nét + ${mem.n0} ô tổng quan, ${mem.pool} canvas chờ dùng lại)`); }
  // thu nhỏ rồi phóng to lại nhiều lần: canvas của ô bị loại được dùng lại, không lỗi
  { for(let k=0;k<3;k++){ await T.pinch(W/2,H/2,240,90,8); await p.waitForTimeout(250); await T.pinch(W/2,H/2,90,250,8); await p.waitForTimeout(250); }
    await nextFrames(4); const okS=await T.until(()=>__ltm.bw._mapPending===0&&!__ltm.bw._mapFading,null,25000); ok(okS&&T.errs.length===0, `${name}: thu phóng liên tục 6 lần xong bản đồ vẫn nét hết, không lỗi`+(T.errs.length? ': '+T.errs[0] : '')); }

  // ---- 4) chỉ vẽ thứ nằm trong khung nhìn ----
  const cull=await T.ev(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(()=>{ const bw=__ltm.bw, sc=bw.scale, x0=bw.camX, y0=bw.camY, x1=x0+bw.lastVw/sc, y1=y0+bw.lastVh/sc; let on=0, near=0;
    for(const n of bw.nodes){ if(n.x>=x0&&n.x<=x1&&n.y>=y0&&n.y<=y1) on++; if(n.x>=x0-260&&n.x<=x1+260&&n.y>=y0-300&&n.y<=y1+260) near++; }
    res({drawn:bw._nDrawn,on,near,all:bw.nodes.length,fog:[bw.fogCv.width,bw.fogCv.height],vw:bw.lastVw,vh:bw.lastVh}); }))));
  ok(cull.drawn>=cull.on&&cull.drawn<=cull.near&&cull.drawn<cull.all/2, `${name}: mỗi khung hình chỉ vẽ ${cull.drawn}/${cull.all} cứ điểm (trong màn hình có ${cull.on}) — trước đây vẽ cả ${cull.all}`);
  ok(cull.fog[0]<=cull.vw/4+3&&cull.fog[1]<=cull.vh/4+3, `${name}: lớp sương mù vẽ trên canvas nhỏ ${cull.fog[0]}×${cull.fog[1]} (trước đây 2000×600, nạp lại 30 lần/giây)`);
  // sương vẫn che quân địch ngoài tầm nhìn, vẫn thấy quân trong tầm nhìn
  { const fogOk=await T.ev(()=>{ const bw=__ltm.bw, cap=bw.nodes.find(n=>n.camp&&n.owner===bw.localFid); bw._updateVision(); const far=bw.nodes.find(n=>n.owner!==bw.localFid&&Math.hypot(n.x-cap.x,n.y-cap.y)>3000); return {own:bw.visAt(cap.x,cap.y),far:bw.visAt(far.x,far.y)}; });
    ok(fogOk.own&&!fogOk.far, `${name}: tầm nhìn không đổi — đất mình sáng, đất địch ở xa vẫn tối`); }
  // rung màn hình: trận ở NGOÀI khung nhìn không được làm rung (và không giữ máy ở nhịp vẽ cao)
  { const sh=await T.ev(()=>{ const bw=__ltm.bw, sc=bw.scale; bw.shake=0; const inX=bw.camX+bw.lastVw/sc/2, inY=bw.camY+bw.lastVh/sc/2, outX= bw.camX>BW.W/2? 300 : BW.W-300, outY=inY;
      bw.shakeAt(outX,outY,5); const far=bw.shake; bw.shakeAt(inX,inY,5); const near=bw.shake; bw.shake=0; return {far,near}; });
    ok(sh.far===0&&sh.near===5, `${name}: chỉ rung màn hình khi trận đánh nằm trong khung nhìn (ngoài: ${sh.far}, trong: ${sh.near})`); }
  ok(T.errs.length===0, `${name}: không lỗi JS`+(T.errs.length? ': '+T.errs.slice(0,2).join(' | ') : ''));
  await T.ctx.close();
}
await finish('MƯỢT & ĐỠ PIN',b);
