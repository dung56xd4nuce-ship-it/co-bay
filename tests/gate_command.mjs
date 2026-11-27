// (6.3) LỆNH GOM QUÂN · QUÉT VÙNG · GỘP ĐẠO — như người chơi, mọi lệnh bằng chạm thật:
//  📣 Gom 5 trại gần nhất: chỉ quân ở điểm luyện quân / trại chăn nuôi quanh 5 trại đó đi tập kết, quân trong trại đứng yên; tới nơi gộp thành MỘT đạo
//  🚩 Tổng động viên: toàn bộ quân ta (trại, thành trấn, điểm luyện quân, đạo quân ngoài đồng) về điểm tập kết
//  🔲 Giữ tay quét: lấy cả quân ở điểm luyện quân trong vùng (không lấy trại); huỷ lệnh thì quân đó quay về
//  🤝 Nhiều đạo / nhiều binh chủng tới một điểm: còn đúng một đạo
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of [...DEVICES, PORTRAIT[1], ['Android nhỏ ngang 640×360',{viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:DEVICES[0][1].userAgent}]]){ console.log(dn);
  const T=await open(b,dev); const {p,cdp}=T;
  const fresh=async()=>{ await T.startBattle({map52:3,civ:'rome'},2); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0);
    await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); bw.intro=null; document.getElementById('stageIntro').classList.add('hidden'); bw.autoMenu=false; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; bw.aiTurn=()=>{}; bw.armies.length=0;
      const H=bw.nodes.filter(n=>n.owner===0&&!n.eco), E=bw.nodes.filter(n=>n.eco&&n.eco!=='granary'); for(const n of H){ n.count=400; n.mix=null; } for(const n of E){ n.owner=0; n.count=300; n.mix=null; }
      window.__H=H; window.__E=E; bw.texts.length=0; bw.notes=[]; }); await T.settle(); await T.hookDraw(); };
  const look=async(wx,wy,z)=>{ await T.ev(([wx,wy,z])=>{ const bw=__ltm.bw; if(z){ bw.zoom=bw.zoomTgt=z; } const sc=bw.scale0*bw.zoom; bw.camX=Math.max(0,Math.min(BW.W-bw.lastVw/sc,wx-bw.lastVw/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-bw.lastVh/sc),wy-bw.lastVh/sc/2)); bw.camDrag=null; bw.jumpT=null; },[wx,wy,z||0]); await T.settle(); };
  const rallyRows=async()=>{ const rb=await T.ev(()=>{ const r=__ltm.bw._rallyBtn; return [r.x+r.w/2,r.y+r.h/2]; }); await T.tap(rb[0],rb[1]); await p.waitForTimeout(300);
    return await T.until(()=>{ const R=(__ltm.bw._rallyRects||[]); return R.length? R.map(r=>({n:r.n===Infinity?'all':r.n,x:r.x+r.w/2,y:r.y+r.h/2})) : null; },null,2500)||[]; };
  const run=(sec)=>T.ev((sec)=>{ const bw=__ltm.bw; for(let i=0;i<sec*20;i++){ bw.update(0.05); for(const a of bw.armies) if(a.owner===0) a.food=100; } },sec);
  // một khoảng đất trống (không bắt dính trại/cứ điểm) giữa vùng của ta
  const spot=()=>T.ev(()=>{ const bw=__ltm.bw, c=window.__H.find(n=>n.camp)||window.__H[0]; for(let r=500;r<2600;r+=150) for(let k=0;k<16;k++){ const x=c.x+Math.cos(k/16*6.283)*r, y=c.y+Math.sin(k/16*6.283)*r; if(x<200||y<200||x>BW.W-200||y>BW.H-200) continue; if(!bw.rallySnap(x,y)&&bw.terAt(x,y)!=='river'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<260)) return [x,y]; } return null; });
  const notes=()=>T.ev(()=>__ltm.bw.notes.map(q=>q.s||q.text||'').join(' | '));

  // ---------- 1) 📣 Gom 5 trại gần nhất ----------
  await fresh(); let S=await spot(); await look(S[0],S[1]);
  let RR=await rallyRows(); ok(RR.some(r=>r.n===5)&&RR.some(r=>r.n==='all'),'bấm 📣: có "Call 5 nearest camps" và "General mobilization"');
  await T.tap(RR.find(r=>r.n===5).x,RR.find(r=>r.n===5).y); await p.waitForTimeout(250);
  { const sc=await T.scr(S[0],S[1]); await T.tap(sc[0],sc[1]); await p.waitForTimeout(350); }
  let st=await T.ev(()=>{ const bw=__ltm.bw, as=bw.armies.filter(a=>a.owner===0&&!a.done), H=window.__H, E=window.__E;
    return {n:as.length, fromEco:as.every(a=>E.some(e=>e.id===a.from)), hubs:H.every(n=>n.count===400), moved:E.filter(n=>n.count===0).length, e:E.length, pick:bw.rallyPick}; });
  ok(st.n>=1&&st.fromEco&&st.hubs&&st.moved>=1&&!st.pick,`chạm điểm tập kết: ${st.n} đạo đều xuất phát từ điểm luyện quân/trại chăn nuôi (${st.moved}/${st.e} điểm), quân TRONG trại và thành trấn đứng yên`);
  ok(/training grounds around your 5 nearest camps/.test(await notes())&&(await T.drawn(/training grounds around your 5 nearest camps/)).length>=1,'thông báo trên màn hình: "… training grounds around your 5 nearest camps rallying … (camps keep their garrison)"');
  await run(90); st=await T.ev(([x,y])=>{ const as=__ltm.bw.armies.filter(a=>a.owner===0&&!a.done); return {n:as.length, near:as.filter(a=>Math.hypot(a.x-x,a.y-y)<200).length, tot:as.reduce((t,a)=>t+a.count,0)}; },S);
  ok(st.n===1&&st.near===1,`tới điểm tập kết: còn đúng 1 đạo ${st.tot} quân (không còn 2–3 đạo đứng sát nhau)`);

  // ---------- 2) 🚩 Tổng động viên ----------
  await fresh(); S=await spot(); await look(S[0],S[1]);
  const fld=await T.ev(()=>{ const bw=__ltm.bw, c=window.__H[0]; const a={owner:0,type:'archer',count:260,x:c.x+700,y:c.y-500,to:-1,camped:true,trail:0,food:100}; bw.armies.push(a); window.__F=a; return 260; });
  RR=await rallyRows(); await T.tap(RR.find(r=>r.n==='all').x,RR.find(r=>r.n==='all').y); await p.waitForTimeout(250);
  { const sc=await T.scr(S[0],S[1]); await T.tap(sc[0],sc[1]); await p.waitForTimeout(350); }
  st=await T.ev(()=>{ const bw=__ltm.bw, H=window.__H, E=window.__E, F=window.__F; return {empty:[...H,...E].every(n=>n.count===0), f:!F.camped&&F.rally>0, tot:bw.armies.filter(a=>a.owner===0&&!a.done).reduce((t,a)=>t+a.count,0), want:H.length*400+E.length*300+260}; });
  ok(st.empty&&st.f&&st.tot===st.want,`🚩 tổng động viên: rút sạch mọi trại, thành trấn, điểm luyện quân và cả đạo quân ngoài đồng — ${st.tot} quân lên đường`);
  ok(/GENERAL MOBILIZATION/.test(await notes())&&(await T.drawn(/GENERAL MOBILIZATION/)).length>=1,'thông báo "🚩 GENERAL MOBILIZATION: … strongholds + 1 armies · … troops marching"');

  // ---------- 3) 🔲 Giữ tay quét: lấy cả quân điểm luyện quân trong vùng, không lấy trại ----------
  await fresh();
  const Q=await T.ev(()=>{ const bw=__ltm.bw, E=window.__E, H=window.__H; let best=null;
    for(const e of E){ const c=H.slice().sort((a,b2)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b2.x-e.x,b2.y-e.y))[0]; const d=Math.hypot(c.x-e.x,c.y-e.y), m=Math.min(e.x,c.x,BW.W-e.x,BW.W-c.x,e.y,c.y,BW.H-e.y,BW.H-c.y); if(d>260&&d<1100&&m>200&&(!best||m>best.m)) best={e,c,d,m}; }
    if(!best) return null; const {e,c}=best; window.__QE=e; window.__QC=c;
    const fx=(e.x+c.x)/2+40, fy=(e.y+c.y)/2+60; const a={owner:0,type:'spear',count:180,x:fx,y:fy,to:-1,camped:true,trail:0,food:100}; bw.armies.push(a); window.__QF=a;
    return {x0:Math.min(e.x,c.x,fx)-90,y0:Math.min(e.y,c.y,fy)-90,x1:Math.max(e.x,c.x,fx)+90,y1:Math.max(e.y,c.y,fy)+90}; });
  ok(!!Q,'bản đồ có điểm luyện quân cạnh một trại để thử quét');
  if(Q){ await look((Q.x0+Q.x1)/2,(Q.y0+Q.y1)/2);
    { const z=await T.ev((Q)=>{ const bw=__ltm.bw; const need=Math.min(bw.lastVw*0.8/(Q.x1-Q.x0),bw.lastVh*0.75/(Q.y1-Q.y0))/bw.scale0; return Math.max(bw.zMin||0.3,Math.min(3,need)); },Q); await look((Q.x0+Q.x1)/2,(Q.y0+Q.y1)/2,z); }
    const others=await T.ev((Q)=>window.__E.filter(e=>e!==window.__QE&&e.x>=Q.x0&&e.x<=Q.x1&&e.y>=Q.y0&&e.y<=Q.y1).map(e=>e.id),Q);
    const a=await T.scr(Q.x0,Q.y0), c=await T.scr(Q.x1,Q.y1);
    const drag=async()=>{ await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a[0],y:a[1],id:1}]}); await p.waitForTimeout(550);
      for(let i=1;i<=12;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a[0]+(c[0]-a[0])*i/12,y:a[1]+(c[1]-a[1])*i/12,id:1}]}); await p.waitForTimeout(22); }
      await p.waitForTimeout(120); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300); };
    if(process.env.DBG) console.log('box',a,c,await T.ev(()=>[__ltm.bw.lastVw,__ltm.bw.lastVh,__ltm.bw.zoom,__ltm.bw.zMin]));
    await drag();
    if(process.env.DBG) console.log(await T.ev(()=>({selG:(__ltm.bw.selG||[]).length, texts:__ltm.bw.texts.slice(-3).map(t=>t.s), menu:!!__ltm.bw.menu, sel:!!__ltm.bw.sel})));
    st=await T.ev(()=>{ const bw=__ltm.bw, G2=bw.selG||[], e=window.__QE, c=window.__QC; return {n:G2.length, f:G2.includes(window.__QF), fromE:G2.filter(a=>a.from===e.id&&a.boxFrom===e.id).length, e:Math.round(e.count), c:Math.round(c.count)}; });
    ok(st.f&&st.fromE>=1&&st.e===0&&st.c===400,`giữ tay quét qua đạo quân + điểm luyện quân + trại: chọn ${st.n} đạo (có ${st.fromE} đạo từ điểm luyện quân), trại trong vùng giữ nguyên 400 quân`);
    ok((await T.drawn(/Selected \d+ armies .*training ground/)).length>=1,'dòng chữ "👥 Selected … armies · … troops (… training ground)"');
    // chạm một điểm trống → "Move" → tới nơi còn 1 đạo
    const D=await T.ev((Q)=>{ const bw=__ltm.bw; for(let r=200;r<900;r+=60) for(let k=0;k<12;k++){ const x=(Q.x0+Q.x1)/2+Math.cos(k/12*6.283)*r, y=(Q.y0+Q.y1)/2+Math.sin(k/12*6.283)*r; if(x<200||y<200||x>BW.W-200||y>BW.H-200) continue; if(bw.terAt(x,y)==='river'||bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<200)) continue; const s=bw.scale; const sx=(x-bw.camX)*s, sy=(y-bw.camY)*s; if(sx>60&&sy>80&&sx<bw.lastVw-60&&sy<bw.lastVh-80) return [x,y]; } return null; },Q);
    if(D){ const sc=await T.scr(D[0],D[1]); await T.tap(sc[0],sc[1]); await p.waitForTimeout(300);
      const mv=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='move'); return R? [R.x+R.w/2,R.y+R.h/2] : null; },null,2500);
      if(mv){ await T.tap(mv[0],mv[1]); await p.waitForTimeout(300); }
      ok(!!mv,'chạm điểm trống → menu có "Move", chạm để hành quân');
      await run(90); st=await T.ev(([x,y])=>{ const as=__ltm.bw.armies.filter(a=>a.owner===0&&!a.done); return {near:as.filter(a=>Math.hypot(a.x-x,a.y-y)<200).map(a=>a.count)}; },D);
      ok(st.near.length===1,`cả cụm tới nơi: còn đúng 1 đạo (${st.near.join('+')} quân), không đứng tách 2–3 đạo`); }
    // quét lại rồi bấm Cancel: quân vừa bước ra quay về điểm luyện quân
    await fresh(); await T.ev(()=>{ const bw=__ltm.bw; window.__QE=bw.nodes[window.__QE.id]; window.__QC=bw.nodes[window.__QC.id]; window.__QE.owner=0; window.__QE.count=300; }); await look((Q.x0+Q.x1)/2,(Q.y0+Q.y1)/2);
    { const z=await T.ev((Q)=>{ const bw=__ltm.bw; return Math.max(bw.zMin||0.3,Math.min(3,Math.min(bw.lastVw*0.8/(Q.x1-Q.x0),bw.lastVh*0.75/(Q.y1-Q.y0))/bw.scale0)); },Q); await look((Q.x0+Q.x1)/2,(Q.y0+Q.y1)/2,z); }
    await drag(); const k=await T.ev(()=>(__ltm.bw.selG||[]).filter(a=>a.boxFrom!=null).length);
    const D2=await T.ev(()=>{ const bw=__ltm.bw; return [bw.lastVw*0.5,bw.lastVh*0.3]; }); await T.tap(D2[0],D2[1]); await p.waitForTimeout(300);
    const cx=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='cancel'); return R? [R.x+R.w/2,R.y+R.h/2] : null; },null,2500);
    if(cx){ await T.tap(cx[0],cx[1]); await p.waitForTimeout(250); }
    await run(40); st=await T.ev(()=>({e:Math.round(window.__QE.count), left:__ltm.bw.armies.filter(a=>a.owner===0&&!a.done&&a.from===window.__QE.id).length}));
    ok(k>=1&&!!cx&&st.e>=300&&st.left===0,`quét rồi bấm "✖ Cancel": quân vừa bước ra (${k} đạo) quay về điểm luyện quân (giờ ${st.e} quân, đã cộng quân luyện thêm)`); }

  // ---------- 4) 🪤 đạo đang mai phục ở trại: chọn rồi chạm cứ điểm ta → hiện menu, chạm "Leave ambush" là hành quân (trước đây bị đổi chọn, tưởng như bỏ chọn) ----------
  await fresh();
  const M=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; const a={owner:0,type:'axe',count:440,x:c.x+40,y:c.y+60,to:-1,camped:true,ambush:true,trail:0,food:100}; bw.armies.push(a); window.__M=a;
    const o=bw.nodes.filter(n=>n.owner===0&&n!==c).sort((p2,q)=>Math.hypot(p2.x-c.x,p2.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y))[0]; window.__O=o; return {a:[a.x,a.y],o:[o.x,o.y]}; });
  await look((M.a[0]+M.o[0])/2,(M.a[1]+M.o[1])/2,1);
  { const s0=await T.scr(M.a[0],M.a[1]-28); await T.tap(s0[0],s0[1]); await p.waitForTimeout(250); }
  ok(await T.ev(()=>__ltm.bw.selA===window.__M),'chạm đạo đang mai phục cạnh trại: chọn được đạo quân');
  { const s1=await T.scr(M.o[0],M.o[1]); await T.tap(s1[0],s1[1]); await p.waitForTimeout(300); }
  st=await T.ev(()=>({sel:__ltm.bw.selA===window.__M, m:(__ltm.bw.menu&&__ltm.bw.menu.opts.map(o=>o.s).join(' | '))||''}));
  ok(st.sel&&/Leave ambush · reinforce this post/.test(st.m)&&/Select this post instead/.test(st.m),`chạm cứ điểm ta: vẫn giữ chọn đạo quân, hiện menu "${st.m}"`);
  { const mv=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='move'); return R? [R.x+R.w/2,R.y+R.h/2] : null; },null,2500); if(mv){ await T.tap(mv[0],mv[1]); await p.waitForTimeout(300); } }
  st=await T.ev(()=>{ const a=window.__M; return {to:a.to, o:window.__O.id, amb:a.ambush}; });
  ok(st.to===st.o&&!st.amb,'chạm "🛡️ Leave ambush · reinforce this post": đạo quân rời mai phục, hành quân tới cứ điểm');
  // ---------- 5) menu lệnh đang mở, chạm mục tiêu KHÁC trên bản đồ → đổi mục tiêu, vẫn giữ quân đang chọn ----------
  await fresh();
  const R5=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; const a={owner:0,type:'spear',count:500,x:c.x+500,y:c.y+120,to:-1,camped:true,trail:0,food:100}; bw.armies.push(a); window.__R=a;
    const pts=[]; for(let r=260;r<900&&pts.length<2;r+=40) for(let k=0;k<12&&pts.length<2;k++){ const x=a.x+Math.cos(k/12*6.283)*r, y=a.y+Math.sin(k/12*6.283)*r; if(bw.terAt(x,y)==='river'||bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<200)||pts.some(q=>Math.hypot(q[0]-x,q[1]-y)<300)) continue; pts.push([x,y]); }
    return {a:[a.x,a.y],P:pts}; });
  await look(R5.a[0],R5.a[1],1);
  { const s0=await T.scr(R5.a[0],R5.a[1]-28); await T.tap(s0[0],s0[1]); await p.waitForTimeout(200); const s1=await T.scr(R5.P[0][0],R5.P[0][1]); await T.tap(s1[0],s1[1]); await p.waitForTimeout(250); }
  const m1=await T.ev(()=>{ const m=__ltm.bw.menu; return m&&[Math.round(m.wx),Math.round(m.wy)]; });
  { const s2=await T.scr(R5.P[1][0],R5.P[1][1]); const inMenu=await T.ev(([x,y])=>(__ltm.bw._menuRects||[]).some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),s2); if(!inMenu){ await T.tap(s2[0],s2[1]); await p.waitForTimeout(250); } }
  st=await T.ev(()=>{ const bw=__ltm.bw, m=bw.menu; return {sel:bw.selA===window.__R, m:m&&[Math.round(m.wx),Math.round(m.wy)], ids:m&&m.opts.map(o=>o.id).join()}; });
  ok(!!m1&&st.sel&&st.m&&(st.m[0]!==m1[0]||st.m[1]!==m1[1])&&/move/.test(st.ids||''),'chọn đạo quân → chạm điểm A (hiện menu) → chạm điểm B ngoài menu: vẫn giữ đạo quân, menu chuyển sang điểm B');
  { const mv=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='move'); return R? [R.x+R.w/2,R.y+R.h/2] : null; },null,2000); if(mv){ await T.tap(mv[0],mv[1]); await p.waitForTimeout(250); } }
  st=await T.ev(([x,y])=>{ const a=window.__R; return {tx:Math.round(a.tx), ty:Math.round(a.ty), x, y, moving:!a.camped}; },R5.P[1]);
  ok(Math.hypot(st.tx-st.x,st.ty-st.y)<5&&st.moving,'chạm "🏃 March here": đạo quân đi tới điểm B');
  // ---------- 6) quét chỉ phủ HÌNH lính và bảng số (phía trên chân đạo quân) vẫn chọn được ----------
  await fresh();
  const R6=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; const a={owner:0,type:'archer',count:900,x:c.x+700,y:c.y+250,to:-1,camped:true,trail:0,food:100}; bw.armies.push(a); window.__S=a; return [a.x,a.y]; });
  await look(R6[0],R6[1],1.6);
  { const a=await T.scr(R6[0]-70,R6[1]-110), c=await T.scr(R6[0]+70,R6[1]-40);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a[0],y:a[1],id:1}]}); await p.waitForTimeout(550);
    for(let i=1;i<=10;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a[0]+(c[0]-a[0])*i/10,y:a[1]+(c[1]-a[1])*i/10,id:1}]}); await p.waitForTimeout(22); }
    await p.waitForTimeout(100); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300); }
  ok(await T.ev(()=>(__ltm.bw.selG||[]).includes(window.__S)),'giữ tay quét quanh hình lính + bảng số (không trùm chân đạo quân): vẫn chọn được đạo quân ngoài đồng');
  ok(!T.errs.length,'không có lỗi JS '+T.errs.slice(0,2).join(' | '));
  await T.ctx.close(); }
await finish('📣 Gom quân · 🔲 quét vùng · 🤝 gộp đạo (6.3)',b);
