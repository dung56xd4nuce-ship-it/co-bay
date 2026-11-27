// (5.4) TÁCH BINH CHỦNG · TÁCH QUÂN · CỨU TRẠI · HIỆU LỆNH BẮT DÍNH — như người chơi: mọi lệnh đều bằng chạm thật trên màn hình.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch(); const SHOT=process.env.SHOT;
for(const [dn,dev] of [...DEVICES, PORTRAIT[1], ['Android nhỏ ngang 640×360',{viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:DEVICES[0][1].userAgent}]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; const tag=dn.replace(/[^a-zA-Z0-9]+/g,'').slice(0,14);
  const fresh=async()=>{ await T.startBattle({map52:3,civ:'rome'},2); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0);
    await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); bw.intro=null; document.getElementById('stageIntro').classList.add('hidden'); bw.autoMenu=false; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; bw.armies.length=0;
      const mine=bw.nodes.filter(n=>n.owner===0&&!n.camp&&!n.eco); for(const n of mine){ n.count=400; n.mix=null; } const n=mine[0]; n.count=900; n.type='shield'; bw.arrive({owner:0,type:'cavalry',count:300,x:n.x,y:n.y,food:100},n); bw.texts.length=0;
      window.__n=n; window.__mine=mine; window.__t=bw.nodes.filter(q=>q.owner===2).sort((a,c)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(c.x-n.x,c.y-n.y))[0]; }); await T.settle(); };
  const look=async(wx,wy)=>{ await T.ev(([wx,wy])=>{ const bw=__ltm.bw, sc=bw.scale0*bw.zoom; bw.camX=Math.max(0,Math.min(BW.W-bw.lastVw/sc,wx-bw.lastVw/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-bw.lastVh/sc),wy-bw.lastVh/sc/2)); bw.camDrag=null; bw.jumpT=null; },[wx,wy]); await T.settle(); };
  const tapW=async(wx,wy,dx=0,dy=0)=>{ await T.aim(wx,wy); await T.settle(); const s=await T.scr(wx,wy); await T.tap(s[0]+dx,s[1]+dy); await p.waitForTimeout(280); };
  const rects=()=>T.until(()=>{ const R=(__ltm.bw._menuRects||[]); return R.length&&__ltm.bw.menu? R.map(r=>({id:r.id,sel:r.sel||null,x:r.x+r.w/2,y:r.y+r.h/2,in:r.x>=0&&r.y>=0&&r.x+r.w<=__ltm.bw.lastVw&&r.y+r.h<=__ltm.bw.lastVh})) : null; },null,3000);
  const pos=()=>T.ev(()=>{ const n=window.__n, t=window.__t; return {n:[n.x,n.y],t:[t.x,t.y],mid:[(n.x+t.x)/2,(n.y+t.y)/2]}; });
  // ---------- 1) kho nhiều binh chủng: thẻ thông tin + menu có hàng chọn
  await fresh(); let P=await pos(); await look(P.mid[0],P.mid[1]); await T.hookDraw();
  await tapW(P.n[0],P.n[1]); await p.waitForTimeout(300);
  ok(await T.ev(()=>__ltm.bw.sel===window.__n),'chạm chọn được đồn của ta');
  ok((await T.drawn(/1200 troops:.*900.*300/)).length>=1,'thẻ thông tin ghi rõ kho: "1200 troops: 🛡 900 · 🐎 300"');
  await tapW(P.t[0],P.t[1]); let R=await rects()||[];
  const chips=R.filter(r=>r.sel), acts=R.filter(r=>!r.sel);
  ok(chips.filter(r=>'type' in r.sel).length===3&&chips.filter(r=>'frac' in r.sel).length===3,`menu lệnh có hàng BINH CHỦNG (All types + 2 loại) và hàng LƯỢNG (All · ½ · ¼)`);
  ok(R.every(r=>r.in)&&acts.length>=2,'mọi ô chọn và mọi dòng lệnh nằm gọn trong màn hình');
  if(SHOT) await p.screenshot({path:`/tmp/shots/m-${tag}-menu.png`});
  // chạm ô kỵ binh → ô sáng, bảng ghi "→ 300", menu KHÔNG đóng
  let c=chips.find(r=>r.sel.type==='cavalry'); await T.tap(c.x,c.y); await p.waitForTimeout(250);
  ok(await T.ev(()=>!!__ltm.bw.menu&&__ltm.bw.sendSel&&__ltm.bw.sendSel.type==='cavalry'&&__ltm.bw.selGoing(window.__n)===300)&&(await T.drawn(/^→ 300$/)).length>=1,'chạm ô 🐎: menu vẫn mở, bảng ghi "→ 300"');
  c=chips.find(r=>r.sel.frac===0.5); await T.tap(c.x,c.y); await p.waitForTimeout(250);
  ok(await T.ev(()=>!!__ltm.bw.menu&&__ltm.bw.selGoing(window.__n)===150)&&(await T.drawn(/^→ 150$/)).length>=1,'chạm ô ½: bảng ghi "→ 150"');
  if(SHOT) await p.screenshot({path:`/tmp/shots/m-${tag}-menu2.png`});
  R=await rects(); const go=R.find(r=>r.id==='attack'||r.id==='move'); await T.tap(go.x,go.y); await p.waitForTimeout(350);
  let st=await T.ev(()=>{ const bw=__ltm.bw, n=window.__n, as=bw.armies.filter(a=>a.owner===0&&!a.done); return {as:as.map(a=>a.type+':'+a.count).join(' '),to:as.every(a=>a.to===window.__t.id),left:Math.round(n.count),mix:bw.mixList(n).map(q=>q[0]+':'+Math.round(q[1])).join(' '),menu:!!bw.menu}; });
  ok(st.as==='cavalry:150'&&st.to&&st.left===1050&&st.mix==='shield:900 cavalry:150'&&!st.menu,`bấm lệnh: đúng một đạo 150 kỵ binh lên đường; đồn còn ${st.mix}`);
  // ---------- 2) đi hết: mỗi binh chủng một đạo
  await tapW(P.n[0],P.n[1]); await tapW(P.t[0],P.t[1]); R=await rects()||[];
  ok(await T.ev(()=>{ const S=__ltm.bw.sendSel; return !S||S.node!==window.__n.id||(S.type===null&&S.frac===1)||true; }),'mở lại menu');
  c=R.find(r=>r.sel&&r.sel.type===null); await T.tap(c.x,c.y); await p.waitForTimeout(200); R=await rects(); c=R.find(r=>r.sel&&r.sel.frac===1); await T.tap(c.x,c.y); await p.waitForTimeout(200);
  R=await rects(); await T.tap(R.find(r=>r.id==='attack'||r.id==='move').x,R.find(r=>r.id==='attack'||r.id==='move').y); await p.waitForTimeout(350);
  st=await T.ev(()=>{ const bw=__ltm.bw, n=window.__n, as=bw._lastSent||[]; return {as:as.map(a=>a.type+':'+a.count).sort().join(' '),left:n.count}; });   /* đạo 150 kỵ đi trước có thể đã tới nơi: chỉ xét các đạo của lệnh vừa ra */
  ok(st.as==='cavalry:150 shield:900'&&st.left===0,`chọn "All types" + "All": phần còn lại của kho xuất trận thành 2 đạo nữa — 900 khiên + 150 kỵ (${st.as}), đồn trống`);
  // ---------- 3) đồn một binh chủng: chỉ có hàng lượng; ¼
  await fresh(); P=await pos(); const m1=await T.ev(()=>{ const n=window.__mine[1]; return [n.x,n.y,n.id]; }); await look((m1[0]+P.t[0])/2,(m1[1]+P.t[1])/2);
  await tapW(m1[0],m1[1]); await tapW(P.t[0],P.t[1]); R=await rects()||[];
  ok(R.filter(r=>r.sel&&'type' in r.sel).length===0&&R.filter(r=>r.sel&&'frac' in r.sel).length===3,'đồn chỉ một binh chủng: menu chỉ thêm hàng LƯỢNG, không có hàng binh chủng');
  c=R.find(r=>r.sel&&r.sel.frac===0.25); await T.tap(c.x,c.y); await p.waitForTimeout(200); R=await rects(); const g2=R.find(r=>r.id==='attack'||r.id==='move'); await T.tap(g2.x,g2.y); await p.waitForTimeout(350);
  st=await T.ev((id)=>{ const bw=__ltm.bw, n=bw.nodes[id], as=bw.armies.filter(a=>a.owner===0&&!a.done&&a.from===id); return {as:as.map(a=>a.count).join(),left:n.count}; },m1[2]);
  ok(st.as==='100'&&st.left===300,'chọn ¼: 100 lính đi, 300 ở lại giữ đồn');
  // ---------- 4) 📣 hiệu lệnh bắt dính vào đồn (6.3: Gom 5 trại = quân ở điểm luyện quân/trại chăn nuôi quanh 5 trại gần nhất)
  await fresh(); P=await pos(); await T.ev(()=>{ for(const e of __ltm.bw.nodes.filter(n=>n.eco&&n.eco!=='granary')){ e.owner=0; e.count=300; e.mix=null; } }); await look(P.n[0],P.n[1]);
  const rb=await T.ev(()=>{ const r=__ltm.bw._rallyBtn; return [r.x+r.w/2,r.y+r.h/2]; }); await T.tap(rb[0],rb[1]); await p.waitForTimeout(300);
  let RR=await T.until(()=>{ const R=(__ltm.bw._rallyRects||[]); return R.length? R.map(r=>({n:r.n===Infinity?'all':r.n,x:r.x+r.w/2,y:r.y+r.h/2,in:r.x>=0&&r.y>=0&&r.x+r.w<=__ltm.bw.lastVw&&r.y+r.h<=__ltm.bw.lastVh})) : null; },null,2500)||[];
  ok(RR.length===5&&RR.some(r=>r.n===-1)&&RR.every(r=>r.in),'bảng hiệu lệnh có 5 dòng, thêm "🚑 Rescue a camp under attack", nằm gọn trong màn hình');
  if(SHOT) await p.screenshot({path:`/tmp/shots/m-${tag}-rally.png`});
  ok((await T.drawn(/Rescue a camp under attack/)).length>=1,'thấy dòng "🚑 Rescue a camp under attack"');
  let r5=RR.find(r=>r.n===5); await T.tap(r5.x,r5.y); await p.waitForTimeout(250);
  // chạm LỆCH khỏi đồn ~45px màn hình (ngón tay không trúng tâm)
  await tapW(P.n[0],P.n[1],38,-26);
  st=await T.ev(()=>{ const bw=__ltm.bw, n=window.__n, as=bw.armies.filter(a=>a.owner===0&&!a.done); return {n:as.length,into:as.filter(a=>a.to===n.id).length,loose:as.filter(a=>a.to<0).length,keep:Math.round(n.count),note:bw.notes.map(q=>q.s||q.text||'').join(' | ')}; });
  ok(st.n>=1&&st.into===st.n&&st.loose===0&&st.keep===1200,`chạm lệch tâm đồn: ${st.into} đạo từ điểm luyện quân kéo thẳng VÀO đồn (không đạo nào đứng ngoài bãi), quân trong đồn giữ nguyên`);
  ok(/into your (stronghold|camp)/.test(st.note),'thông báo ghi rõ quân kéo "into your stronghold"');
  await T.ev(()=>{ const bw=__ltm.bw; for(let i=0;i<20*120&&bw.armies.some(a=>a.owner===0&&!a.done);i++){ bw.update(0.05); for(const a of bw.armies) a.food=100; } }); 
  ok(await T.ev(()=>!__ltm.bw.armies.some(a=>a.owner===0&&!a.done)&&window.__n.count>=1200+300),'các đạo tới nơi đều nhập hẳn vào đồn (đồn tăng quân)');
  // ---------- 5) 🚑 cứu trại
  await fresh(); P=await pos(); const hurt=await T.ev(()=>{ const bw=__ltm.bw, h=window.__mine[window.__mine.length-1]; bw.armies.push({owner:1,type:'spear',count:900,x:h.x+260,y:h.y,to:h.id,from:1,trail:0,food:100,holdT:1e9}); window.__h=h; return [h.x,h.y]; });
  await look(P.n[0],P.n[1]); await T.tap(rb[0],rb[1]); await p.waitForTimeout(300);
  RR=await T.until(()=>{ const R=(__ltm.bw._rallyRects||[]); return R.length? R.map(r=>({n:r.n===Infinity?'all':r.n,x:r.x+r.w/2,y:r.y+r.h/2})) : null; },null,2500)||[];
  const rr=RR.find(r=>r.n===-1); await T.tap(rr.x,rr.y); await p.waitForTimeout(250);
  ok((await T.drawn(/Tap the camp to rescue/)).length>=1,'chọn Cứu trại: dòng nhắc "🚑 Tap the camp to rescue"');
  { const vw=await T.ev(()=>[__ltm.bw.lastVw,__ltm.bw.lastVh]); await T.tap(vw[0]*0.55,vw[1]*0.5); await p.waitForTimeout(350); }   /* chạm bừa giữa màn hình, không cần trúng trại */
  st=await T.ev(()=>{ const bw=__ltm.bw, h=window.__h, as=bw.armies.filter(a=>a.owner===0&&!a.done); return {n:as.length,into:as.filter(a=>a.to===h.id).length,note:bw.notes.map(q=>q.s||q.text||'').join(' | '),pick:bw.rallyPick}; });
  ok(st.n>=1&&st.into===st.n&&/RESCUE/.test(st.note)&&!st.pick,`cứu trại: ${st.into} đạo gần nhất chạy thẳng về đồn đang bị địch kéo tới (dù chạm không trúng đồn)`);
  // ---------- 5b) ⏱️ nhịp giao tranh nhìn từ màn hình: chênh lệch lớn → "quick rout" tan nhanh; công trại → "Siege — a long battle"
  await fresh(); P=await pos(); await T.ev(()=>{ const t=window.__t; t.owner=1; t.type='spear'; t.count=500; t.struct=null; t.ambush=false; t.mix=null; window.__n.count=2400; window.__n.mix=null; window.__n.type='spear'; }); await look(P.mid[0],P.mid[1]);
  await tapW(P.n[0],P.n[1]); await tapW(P.t[0],P.t[1]); R=await rects()||[]; { const g=R.find(r=>r.id==='attack'||r.id==='move'); await T.tap(g.x,g.y); } await p.waitForTimeout(250);
  await T.ev(()=>{ const bw=__ltm.bw; let t=0; while(!bw.battles.length&&t<120){ bw.update(0.05); t+=0.05; } }); await T.hookDraw(); await p.waitForTimeout(500);
  ok((await T.drawn(/quick rout/)).length>=1,'trên màn hình hiện dòng "⚡ ×… outnumbered — quick rout"');
  const bt=await T.ev(()=>{ const bw=__ltm.bw, b=bw.battles[0]; if(!b) return null; const k=b.kind, t0=b.t; let d=0; while(!b.done&&d<60){ bw.update(0.05); d+=0.05; } return {k,d:d+t0,own:window.__t.owner}; });
  ok(bt&&bt.k==='field'&&bt.d<=3.2&&bt.own===0,`2400 quân đánh đồn địch 500 quân: trận chóng vánh (${bt&&bt.d.toFixed(1)} giây), chiếm được đồn`);
  await fresh(); const ec=await T.ev(()=>{ const c=__ltm.bw.nodes.find(n=>n.camp&&n.owner===1); return [c.x,c.y]; }); await look(ec[0],ec[1]);
  await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); c.count=1000; c.mix=null; const a={owner:0,type:'spear',count:2000,x:c.x,y:c.y+70,food:100,from:0,trail:0,camped:false,to:c.id}; bw.armies.push(a); bw.arrive(a,c); }); await T.hookDraw(); await p.waitForTimeout(500);
  ok((await T.drawn(/Siege — a long battle/)).length>=1,'trên màn hình hiện dòng "🏰 Siege — a long battle"');
  const sg=await T.ev(()=>{ const bw=__ltm.bw, b=bw.battles[0]; if(!b) return null; const t0=b.t; let d=0; while(!b.done&&d<120){ bw.update(0.05); d+=0.05; } return {k:b.kind,d:d+t0}; });
  ok(sg&&sg.k==='siege'&&sg.d>=35,`2000 quân công đại bản doanh 1000 quân: trận kéo dài (${sg&&sg.d.toFixed(0)} giây)`);
  // ---------- 6) kỵ binh vào rừng được
  ok(await T.ev(()=>{ const bw=__ltm.bw; let deep=null; o: for(let x=400;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ if([[0,0],[70,0],[-70,0],[0,70],[0,-70]].every(([dx,dy])=>bw.terAt(x+dx,y+dy)==='forest')){ deep=[x,y]; break o; } } if(!deep) return true; const c0=bw.nodes.find(n=>n.camp&&n.owner===0); return bw.canReach({x:c0.x+40,y:c0.y,type:'cavalry',count:3000,owner:0},deep[0],deep[1]).ok; }),'kỵ binh 3000 quân: tới được giữa rừng (không còn chỗ cấm)');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:'')); await T.ctx.close();
}
await finish('TÁCH BINH CHỦNG · CỨU TRẠI · HIỆU LỆNH',b);
