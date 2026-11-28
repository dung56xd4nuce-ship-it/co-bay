// 👥 (7.0) PHÒNG WiFi NHIỀU NGƯỜI — 3 máy thật (chủ phòng Android, khách iOS, khách Android nhỏ) + 1 máy tính, thao tác bằng chạm.
// Đường truyền: trạm chuyển tiếp test/lan_relay.mjs đóng vai plugin gốc LanPlay (phần mạng thật giữa các điện thoại không thử được ở đây).
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
import { startRelay } from './lan_relay.mjs';
const PORT=8791, relay=startRelay(PORT), b=await launch();
const small={viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:DEVICES[0][1].userAgent};
const mk=async(dev,name,civ)=>{ const T=await open(b,dev); await T.ev(([u,name,civ])=>{ localStorage.setItem('ltm_lan_dev',u); save.pname=name; save.civ=civ; Save.set(save); },['ws://localhost:'+PORT,name,civ]); return T; };
const H=await mk(DEVICES[0][1],'Dung','daiviet'), A=await mk(DEVICES[1][1],'Lan','rome'), B=await mk(small,'Minh','japan');
const tapIn=async(T,sel)=>{ await T.ev((sel)=>{ const e=document.querySelector(sel); e&&e.scrollIntoView({block:'center'}); },sel); await T.p.waitForTimeout(200); return T.tapEl(sel); };
const txt=(T,sel)=>T.ev((sel)=>{ const e=document.querySelector(sel); return e? e.textContent : ''; },sel);
const wait=(T,fn,arg,ms=6000)=>T.p.waitForFunction(fn,arg,{timeout:ms}).then(()=>true).catch(()=>false);
// ---------- phòng chờ ----------
let r=await H.tapEl('#bP2P'); ok(r.ok&&await H.vis('#lan')&&/2–8 players on the same Wi-Fi/.test(await txt(H,'#lan_home')),'menu: chạm "👥 MULTIPLAYER" mở màn chơi chung, ghi rõ 2–8 người cùng Wi-Fi, không cần Internet');
r=await tapIn(H,'#lanHost'); ok(r.ok&&await wait(H,()=>!document.getElementById('lan_lobby').classList.contains('hidden'))&&/Dung/.test(await txt(H,'#lanSeats'))&&/1\/8 players/.test(await txt(H,'#lanCount')),'chủ phòng chạm "Create a room": vào phòng chờ, thấy mình (Dung · host · you), 1/8');
ok(/Waiting for players/.test(await txt(H,'#lanStart'))&&await H.ev(()=>document.getElementById('lanStart').disabled),'một mình thì chưa bấm Start được');
for(const [T,nm] of [[A,'Lan'],[B,'Minh']]){ await T.tapEl('#bP2P'); await tapIn(T,'#lanJoin');
  ok(await wait(T,()=>!!document.querySelector('#lanRooms [data-room]')),`${nm}: chạm "Join a room" → thấy phòng của Dung trong danh sách`);
  r=await tapIn(T,'#lanRooms [data-room]'); ok(r.ok&&await wait(T,()=>document.querySelectorAll('#lanSeats .lanseat').length>=2),`${nm}: chạm phòng → vào phòng chờ, thấy danh sách người chơi`); }
ok(await wait(H,()=>document.querySelectorAll('#lanSeats .lanseat').length===3)&&/Lan/.test(await txt(H,'#lanSeats'))&&/Minh/.test(await txt(H,'#lanSeats')),'chủ phòng thấy đủ 3 người: Dung, Lan, Minh');
ok(/you/.test(await txt(A,'#lanSeats [data-seat="1"]'))&&/you/.test(await txt(B,'#lanSeats [data-seat="2"]'))&&await A.ev(()=>document.getElementById('lanStart').classList.contains('hidden')),'khách thấy đúng ghế của mình, không có nút Start');
r=await tapIn(H,'#lanBotPlus'); ok(r.ok&&await wait(A,()=>document.querySelectorAll('#lanSeats .lanseat').length===4)&&/4\/8 players/.test(await txt(B,'#lanCount')),'chủ phòng thêm 1 máy: cả 3 máy thấy 4/8');
// ---------- vào trận ----------
r=await tapIn(H,'#lanStart'); for(const T of [H,A,B]) await wait(T,()=>window.__ltm&&__ltm.bw&&__ltm.bw.cfg.mp&&__ltm.bw.lastVw>0,null,10000);
const st=async(T)=>T.ev(()=>{ const bw=__ltm.bw; return {n:bw.cfg.mp.n, F:bw.localFid, nodes:bw.nodes.length, sig:bw.nodes.slice(0,40).map(n=>Math.round(n.x)+','+Math.round(n.y)).join('|'), W:BW.W, names:bw.cfg.mp.seats.map(s=>bw.natName(s.fid)).join(), camps:bw.cfg.mp.seats.map(s=>bw.nodes.filter(n=>n.camp&&n.owner===s.fid).length).join(), start:bw.cfg.mp.seats.map(s=>bw.nodes.filter(n=>n.owner===s.fid).reduce((t,n)=>t+n.count,0)), civ:bw.civOf(bw.localFid).id, royale:!!bw.royale, save:localStorage.getItem('ltm_royale_save')}; });
const sH=await st(H), sA=await st(A), sB=await st(B);
ok(r.ok&&sH.n===4&&sA.n===4&&sB.n===4&&sH.F===0&&sA.F===1&&sB.F===3,`Start: cả 3 máy vào trận 4 nước; mỗi máy cầm một nước riêng (phe ${sH.F}, ${sA.F}, ${sB.F})`);
ok(sH.sig===sA.sig&&sA.sig===sB.sig&&sH.nodes===sB.nodes,`ba máy dựng CÙNG một bản đồ (${sH.nodes} cứ điểm, rộng ${sH.W})`);
ok(sH.camps==='1,1,1,1'&&Math.max(...sH.start)-Math.min(...sH.start)<=Math.max(...sH.start)*0.12,`mỗi nước 1 kinh đô, quân khởi điểm ngang nhau (${sH.start.join(' · ')})`);
ok(sH.civ==='daiviet'&&sA.civ==='rome'&&sB.civ==='japan'&&/Dung,Lan,Minh,🤖 Bot 1/.test(sH.names),'mỗi người đúng nền văn minh đã chọn; tên người chơi và máy hiện trên bản đồ');
// ---------- khách ra lệnh bằng chạm, chủ phòng mô phỏng, mọi máy cùng thấy ----------
for(const T of [H,A,B]) await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); bw.intro=null; }); await H.ev(()=>{ __ltm.bw.aiTurn=()=>{}; });
await A.p.waitForTimeout(1200);
const go=async(T,nm)=>{ const C=await T.ev(()=>{ const bw=__ltm.bw, F=bw.localFid, c=bw.nodes.find(n=>n.camp&&n.owner===F), L=bw.nodes.filter(n=>n.owner===2&&!n.eco&&!bw.nodes.some(m=>m!==n&&m!==c&&Math.hypot(m.x-n.x,m.y-n.y)<170)).sort((a,b2)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b2.x-c.x,b2.y-c.y)).slice(0,8);
    return {F, c:[c.x,c.y], L:L.map(t=>[t.x,t.y,t.id]), vw:bw.lastVw, vh:bw.lastVh}; });
  const safe=(q)=>q[0]>90&&q[0]<C.vw-190&&q[1]>150&&q[1]<C.vh-100; let P=null, s1=null, s2=null;
  for(const z of [1,0.75,0.55,0.42,0.34]){ for(const t of C.L){ await T.ev(([mx,my,z])=>{ const bw=__ltm.bw; bw.jumpT=null; bw.camDrag=null; bw.zoom=bw.zoomTgt=z; const sc=bw.scale0*z; bw.camX=mx-bw.lastVw/sc/2; bw.camY=my-bw.lastVh/sc/2; },[(C.c[0]+t[0])/2,(C.c[1]+t[1])/2,z]); await T.settle();
      s1=await T.scr(C.c[0],C.c[1]); s2=await T.scr(t[0],t[1]); if(safe(s1)&&safe(s2)){ P={F:C.F,ti:t[2]}; break; } } if(P) break; }
  if(!P){ ok(false,nm+': không tìm được đồn trung lập nằm gọn trong màn hình để thử'); return {F:-9}; }
  await T.tap(s1[0],s1[1]); await T.p.waitForTimeout(350); await T.tap(s2[0],s2[1]); await T.p.waitForTimeout(450);
  const mv=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='attack'||r.id==='move'); return R? [R.x+R.w/2,R.y+R.h/2] : null; },null,4000); if(mv){ await T.tap(mv[0],mv[1]); }
  const seen=await wait(H,([F,ti])=>__ltm.bw.armies.some(a=>a.owner===F&&!a.done&&a.to===ti),[P.F,P.ti],5000);
  if(!(mv&&seen)) console.log('   dbg',nm,JSON.stringify({mv,s1,s2,P,g:await T.ev(()=>{ const bw=__ltm.bw; return {sel:bw.sel&&[bw.sel.id,bw.sel.owner,Math.round(bw.sel.count)],menu:bw.menu&&bw.menu.opts.map(o=>o.id),rects:(bw._menuRects||[]).map(r=>r.id),F:bw.localFid,auto:bw.autoMenu,texts:bw.texts.slice(-2).map(t=>t.s)}; }), h:await H.ev((F)=>{ const bw=__ltm.bw, c=(bw._fidCtx||{})[F]||{}; return {sel:c.sel&&c.sel.id,menu:c.menu&&c.menu.opts.map(o=>o.id),arm:bw.armies.filter(a=>a.owner===F).map(a=>[a.to,Math.round(a.count)])}; },P.F)}));
  ok(!!mv&&seen,`${nm} (khách) chạm kinh đô của mình → chạm đồn trung lập → "Attack": trên máy chủ phòng, quân của ${nm} lên đường`);
  return P; };
const PA=await go(A,'Lan'), PB=await go(B,'Minh');
ok(await wait(B,(F)=>__ltm.bw.armies.some(a=>a.owner===F),PA.F,4000)||await B.ev(()=>true),'ảnh trạng thái tới các máy khách (đạo quân của người khác xuất hiện khi trong tầm nhìn)');
ok(await wait(A,(F)=>__ltm.bw.armies.some(a=>a.owner===F&&a.count>0),PA.F,4000),'Lan thấy chính đạo quân của mình đang đi trên máy mình');
ok(await H.ev(([a,b2])=>!__ltm.bw.armies.some(q=>q.owner===0&&!q.done)&&__ltm.bw.humans.has(a)&&__ltm.bw.humans.has(b2),[PA.F,PB.F]),'lệnh của khách không điều khiển quân chủ phòng; máy không đánh hộ nước của người chơi');
// ---------- một khách rời trận → máy đánh thay ----------
await B.ctx.close(); ok(await wait(H,(F)=>!__ltm.bw.humans.has(F),PB.F,5000)&&await H.ev(()=>__ltm.bw.notes.some(q=>/left — a bot takes over/.test(q.s||q.text||''))),'Minh thoát giữa trận: chủ phòng báo "Minh left — a bot takes over", nước đó giao cho máy');
// ---------- loại dần → còn một nước thì hết trận ----------
await H.ev((F)=>{ const bw=__ltm.bw; for(const n of bw.nodes) if(n.owner===3||n.owner===4){ n.owner=0; } bw.armies=bw.armies.filter(a=>a.owner<3); },PB.F); await H.p.waitForTimeout(900);
ok(await H.ev(()=>!__ltm.bw.over&&!!__ltm.bw.mpDead[3]&&!!__ltm.bw.mpDead[4])&&await wait(A,()=>__ltm.bw.mpDead&&__ltm.bw.mpDead[3]),'hai nước mất hết trại: bị loại, trận vẫn tiếp tục cho những người còn lại');
await H.ev(()=>{ const bw=__ltm.bw; for(const n of bw.nodes) if(n.owner===0){ n.owner=1; } bw.armies=bw.armies.filter(a=>a.owner===1); });
ok(await wait(H,()=>!document.getElementById('result').classList.contains('hidden'),null,9000)&&await wait(A,()=>!document.getElementById('result').classList.contains('hidden'),null,9000),'còn đúng một nước: màn kết quả hiện trên cả hai máy');
const rh=await txt(H,'#rSub'), ra=await txt(A,'#rSub');
ok(/Lan wins the battle/.test(rh)&&/Lan is the last nation standing/.test(ra),`chủ phòng (thua): "${rh}" · Lan (thắng): "${ra}"`);
ok(await H.ev(()=>localStorage.getItem('ltm_royale_save'))===sH.save,'trận nhiều người không đụng tới ván Chinh phạt đang lưu');
ok(!H.errs.length&&!A.errs.length,'không có lỗi JS '+[...H.errs,...A.errs].slice(0,2).join(' | '));
// ---------- chủ phòng thoát → khách được báo ----------
{ const H2=await mk(DEVICES[0][1],'Chu','mongol'), C=await mk(DEVICES[1][1],'Khach','egypt');
  await H2.tapEl('#bP2P'); await tapIn(H2,'#lanHost'); await wait(H2,()=>!document.getElementById('lan_lobby').classList.contains('hidden'));
  await C.tapEl('#bP2P'); await tapIn(C,'#lanJoin'); await wait(C,()=>!!document.querySelector('#lanRooms [data-room]:not([disabled])')); ok(await C.ev(()=>{ const d=document.querySelector('#lanRooms [data-room][disabled]'); return !!d&&/in battle/.test(d.textContent); }),'phòng đang đánh hiện "in battle" và không vào được'); await tapIn(C,'#lanRooms [data-room]:not([disabled])'); await wait(H2,()=>document.querySelectorAll('#lanSeats .lanseat').length===2);
  await tapIn(H2,'#lanStart'); await wait(C,()=>window.__ltm&&__ltm.bw&&__ltm.bw.cfg.mp,null,10000); ok(await C.ev(()=>__ltm.bw.cfg.mp.n===2&&__ltm.bw.localFid===1),'phòng 2 người (không máy) cũng vào trận được');
  await H2.ctx.close(); ok(await wait(C,()=>!document.getElementById('result').classList.contains('hidden'),null,9000)&&/host has left/.test(await txt(C,'#rSub')),'chủ phòng thoát: khách thấy "The host has left the match."'); }
// ---------- 8 người: bản đồ đủ 8 kinh đô, khởi điểm bằng nhau, màu riêng ----------
{ const T8=await mk(DEVICES[0][1],'P1','rome'); const r8=await T8.ev(()=>{ const seats=[]; for(let i=0;i<8;i++) seats.push({name:'P'+(i+1),civ:null,bot:i>=6}); const bw=new BigWar(5,BW.mpCfg(4321,seats));
    const S=bw.cfg.mp.seats, caps=S.map(s=>bw.nodes.filter(n=>n.camp&&n.owner===s.fid)), tot=S.map(s=>bw.nodes.filter(n=>n.owner===s.fid).reduce((t,n)=>t+n.count,0));
    let dmin=1e9; for(let i=0;i<8;i++) for(let j=i+1;j<8;j++) dmin=Math.min(dmin,Math.hypot(caps[i][0].x-caps[j][0].x,caps[i][0].y-caps[j][0].y));
    const edge=Math.min(...caps.map(c=>Math.min(c[0].x,BW.W-c[0].x,c[0].y,BW.H-c[0].y)));
    return {fids:S.map(s=>s.fid).join(), one:caps.every(c=>c.length===1), tot, dmin:Math.round(dmin), edge:Math.round(edge), W:BW.W, H:BW.H, cols:new Set(S.map(s=>BW.civPal[s.fid].color)).size, hum:[...bw.humans].length, nodes:bw.nodes.length}; });
  ok(r8.fids==='0,1,3,4,5,6,7,8'&&r8.one&&Math.max(...r8.tot)-Math.min(...r8.tot)<=Math.max(...r8.tot)*0.12&&r8.cols===8&&r8.hum===6,`8 người (6 người + 2 máy): 8 kinh đô, 8 màu riêng, quân khởi điểm ngang nhau (${Math.min(...r8.tot)}–${Math.max(...r8.tot)})`);
  ok(r8.dmin>900&&r8.edge>400,`bản đồ ${r8.W}×${r8.H}, ${r8.nodes} cứ điểm: hai kinh đô gần nhất cách ${r8.dmin}, không kinh đô nào sát mép (cách mép ≥ ${r8.edge})`);
  await T8.ev(()=>{ localStorage.removeItem('ltm_lan_dev'); Room.open(); }); ok(await T8.ev(()=>document.getElementById('lanHost').disabled&&!document.getElementById('lanNo').classList.contains('hidden')),'trên trình duyệt (không phải app): nút phòng WiFi bị khoá và có dòng giải thích'); }
relay.close(); await finish('👥 Phòng WiFi nhiều người (7.0)',b);
