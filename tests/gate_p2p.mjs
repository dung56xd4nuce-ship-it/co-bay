// P2P HAI MÁY (Android làm chủ phòng + iPhone làm khách), ghép bằng mã như người chơi, rồi thử PHÍA KHÁCH:
// chọn nước của mỗi bên, khách ra lệnh hành quân / 📣 gọi quân / quét chọn nhiều đạo → chủ phòng phải thực hiện; khách nhận thông báo trận đánh.
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
const b=await launch();
const H=await open(b,DEVICES[0][1]), G=await open(b,DEVICES[1][1]);
await H.ev(()=>{ save.civ='rome'; save.up={speed:5,power:5,armor:5,stamina:5,aura:5,weapon:5}; save.inv={bun:9,tea:9,smoke:9}; save.pack=['bun','tea','smoke']; Save.set(save); }); await G.ev(()=>{ save.civ='mongol'; Save.set(save); });   /* chủ phòng đã rèn tối đa + có đủ quân nhu: vào P2P vẫn phải ngang bằng với khách */
let r=await H.tapEl('#bP2P'); await H.p.waitForTimeout(250); await H.ev(()=>document.getElementById('lanOld').scrollIntoView({block:'center'})); await H.p.waitForTimeout(150); r=await H.tapEl('#lanOld'); ok(r.ok&&await H.vis('#p2p'),'chủ: 👥 MULTIPLAYER → "2 players by exchanging codes" mở màn P2P'); await H.p.waitForTimeout(250);
ok(/Rome/.test(await H.ev(()=>document.getElementById('p2pCiv').textContent)),'chủ: màn P2P ghi nước đang chọn (Rome) và cho đổi');
await H.tapEl('#p2pHost'); await H.p.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,null,{timeout:20000});
const offer=await H.ev(()=>document.getElementById('p2pOut').value);
await G.tapEl('#bP2P'); await G.p.waitForTimeout(250); await G.ev(()=>document.getElementById('lanOld').click()); await G.p.waitForTimeout(250); await G.tapEl('#p2pJoin'); await G.p.waitForTimeout(300);
await G.ev((v)=>{ document.getElementById('p2pIn').value=v; },offer); await G.tapEl('#p2pGo');
await G.p.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,null,{timeout:20000});
const ans=await G.ev(()=>document.getElementById('p2pOut').value);
await H.ev((v)=>{ document.getElementById('p2pIn').value=v; },ans); await H.tapEl('#p2pGo');
await H.p.waitForFunction(()=>__ltm.bw&&__ltm.bw.cfg&&__ltm.bw.cfg.p2p,null,{timeout:25000}).catch(()=>{});
await G.p.waitForFunction(()=>__ltm.bw&&__ltm.bw.cfg&&__ltm.bw.cfg.p2p,null,{timeout:25000}).catch(()=>{});
await H.p.waitForTimeout(1500);
const hs=await H.ev(()=>__ltm.bw? {me:__ltm.bw.civOf(0).id,op:__ltm.bw.civOf(1).id,fid:__ltm.bw.localFid,retry:getComputedStyle(document.getElementById('bwRetry')).display} : null);
const gs=await G.ev(()=>__ltm.bw? {c0:__ltm.bw.civOf(0).id,c1:__ltm.bw.civOf(1).id,fid:__ltm.bw.localFid,nodes:__ltm.bw.nodes.length} : null);
ok(hs&&gs,'hai máy cùng vào trận');
{ const sig=(T)=>T.ev(()=>{ const bw=__ltm.bw; return bw.mapName+'|'+bw.nodes.length+'|'+bw.nodes.map(n=>Math.round(n.x)+','+Math.round(n.y)).join(';').length+'|'+bw.nodes.reduce((t,n)=>t+Math.round(n.x)*3+Math.round(n.y)*7,0)+'|'+bw.roads.length+'|'+Math.round(bw.riverX0); });
  const a=await sig(H), c=await sig(G); ok(a===c,`hai máy dựng CÙNG MỘT bản đồ (cứ điểm, đường, sông trùng khít): ${a.split('|')[0]}`+(a===c?'':` ≠ ${c.split('|')[0]} — ${a} vs ${c}`)); }
ok(hs&&hs.me==='rome'&&hs.op==='mongol','máy chủ: ta là La Mã, đối thủ là Mông Cổ (đúng nước khách đã chọn)');
ok(gs&&gs.c0==='rome'&&gs.c1==='mongol'&&gs.fid===1,'máy khách: thấy đúng hai nước, mình cầm phe Mông Cổ');
ok(hs&&hs.retry==='none','P2P: ẩn nút ↻ (không tự ý chơi lại khi đang đấu với người)');
{ const fair=(T)=>T.ev(()=>{ const bw=__ltm.bw; return {up:bw.up,gear:(bw.gear||[]).length,mul:[bw.upMul('atk',0),bw.upMul('speed',0),bw.upMul('armor',0)].join(),btn:!!bw._gearBtn,hud:Object.keys(bw.hudRects()).some(k=>/quân nhu/.test(k))}; });
  const fh=await fair(H), fg=await fair(G);
  ok(fh.up===null&&fh.gear===0&&fh.mul==='1,1,1'&&!fh.btn&&!fh.hud,'P2P máy chủ (đã rèn tối đa, có quân nhu): vào trận KHÔNG có Lò rèn, KHÔNG có nút 🎒 — hai bên ngang nhau');
  ok(fg.up===null&&fg.gear===0&&!fg.btn&&!fg.hud,'P2P máy khách: cũng không Lò rèn, không quân nhu'); }
await H.ev(()=>{ __ltm.bw.skipIntro(); }); await G.ev(()=>{ __ltm.bw.skipIntro(); }); await G.p.waitForTimeout(500);
// đồng hồ hai máy cùng chạy
const t0=[await H.ev(()=>__ltm.bw.time),await G.ev(()=>__ltm.bw.time)]; await H.p.waitForTimeout(1500); const t1=[await H.ev(()=>__ltm.bw.time),await G.ev(()=>__ltm.bw.time)];
ok(t1[0]-t0[0]>1&&t1[1]-t0[1]>1,`đồng hồ trận chạy trên cả hai máy (chủ +${(t1[0]-t0[0]).toFixed(1)}s, khách +${(t1[1]-t0[1]).toFixed(1)}s)`);
// KHÁCH ra lệnh: chọn 1 đội quân của mình rồi chạm đất trống → March here → trên máy CHỦ đội đó lên đường
const gn=await G.ev(()=>{ const bw=__ltm.bw; const n=bw.nodes.filter(n=>n.owner===1&&!n.camp&&n.count>0)[0]; let tgt=null; for(let r=260;r<700&&!tgt;r+=40) for(let an=0;an<6.28;an+=0.4){ const x=n.x+Math.cos(an)*r, y=n.y+Math.sin(an)*r; if(x<120||y<240||x>BW.W-120||y>BW.H-120) continue; if(bw.terAt(x,y)==='plain'&&!bw.nodes.some(m=>Math.hypot(m.x-x,m.y-y)<170)){ tgt=[x,y]; break; } }
  bw.camX=(n.x+tgt[0])/2-bw.lastVw/bw.scale/2; bw.camY=(n.y+tgt[1])/2-bw.lastVh/bw.scale/2; return {id:n.id,x:n.x,y:n.y,tgt}; }); await G.settle();
let s=await G.scr(gn.x,gn.y); await G.tap(s[0],s[1]); await G.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,gn.id,2500); await G.settle(); s=await G.scr(gn.tgt[0],gn.tgt[1]); await G.tap(s[0],s[1]); await G.p.waitForTimeout(200);
const mr=await G.until(()=>(__ltm.bw._menuRects||[]).filter(r=>r.id==='move').map(r=>[r.x+r.w/2,r.y+r.h/2])[0]||null);
ok(!!mr,'khách: chọn quân → chạm đất trống → hiện menu lệnh'); if(mr) await G.tap(mr[0],mr[1]);
ok(await H.until(([id,tgt])=>__ltm.bw.armies.some(a=>a.owner===1&&!a.camped&&Math.hypot((a.tx??0)-tgt[0],(a.ty??0)-tgt[1])<20),[gn.id,gn.tgt],5000),'máy CHỦ: đội quân của khách đã lên đường tới điểm khách chạm');
ok(await G.until(()=>__ltm.bw.armies.some(a=>a.owner===1),null,5000),'máy khách: thấy đội quân của mình đang đi (ảnh trạng thái từ chủ phòng)');
// KHÁCH 📣 gọi quân (trước v5.0 lệnh này chỉ chạy trên máy khách nên vô tác dụng)
const n0=await H.ev(()=>__ltm.bw.armies.filter(a=>a.owner===1&&!a.done).length);   /* (5.4) điểm chạm có thể bắt dính vào một đồn của khách: quân kéo VÀO đồn (không mang cờ rally) — vẫn là xuất quân */
await G.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); bw.sel=null; bw.selA=null; bw.menu=null; const hc=bw.homeCam(c.x,c.y,bw.lastVw/bw.scale0,bw.lastVh/bw.scale0); bw.camX=hc[0]; bw.camY=hc[1]; }); await G.settle();
const R=await G.ev(()=>__ltm.bw.hudRects()); await G.tap(R['nút 📣'].x+24,R['nút 📣'].y+24); await G.p.waitForTimeout(150);
const rm=(await G.until(()=>{ const r=(__ltm.bw._rallyRects||[]).map(r=>[r.x+r.w/2,r.y+r.h/2]); return r.length>=4? r : null; }))||[]; if(rm.length){ await G.p.waitForTimeout(250); await G.tap(rm[3][0],rm[3][1]); await G.until(()=>!!__ltm.bw.rallyPick,null,2500);   /* (5.4) dòng thứ 3 nay là 🚑 Cứu trại; Tổng động viên là dòng thứ 4 */ await G.settle();
  const c=await G.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); return [c.x-330,c.y+40]; }); s=await G.scr(c[0],c[1]); await G.tap(s[0],s[1]); }
const rOk=await H.until((n)=>__ltm.bw.armies.filter(a=>a.owner===1&&!a.done).length>n,n0,5000);
if(!rOk) console.log('   [chẩn đoán] khách:',JSON.stringify(await G.ev(()=>{ const bw=__ltm.bw; return {rallyPick:bw.rallyPick,rallyOpen:bw.rallyOpen,menu:!!bw.menu,sel:!!bw.sel,selA:!!bw.selA,notes:bw.notes.map(n=>n.text).slice(-3),texts:bw.texts.map(t=>t.s).slice(-3),hud:Object.keys(bw.hudRects())}; })),'rm',JSON.stringify(rm),'| chủ:',JSON.stringify(await H.ev(()=>{ const bw=__ltm.bw; return {t:bw.time,g:bw.nodes.filter(n=>n.owner===1).map(n=>[n.id,Math.round(n.count),n.eco||'',!!n.btl,!!n.camp]),arm:bw.armies.filter(a=>a.owner===1).map(a=>[Math.round(a.count),a.rally||0,!!a.camped]),notes:bw.notes.map(n=>n.text).slice(-3)}; })));
ok(rOk,'khách bấm 📣 Tổng động viên → máy CHỦ cho các trại của khách xuất quân');
// (5.2) lệnh gọi quân của KHÁCH không được lộ ra máy CHỦ: tin báo + mốc tập kết chỉ hiện trên máy khách
{ const hn=await H.ev(()=>({notes:__ltm.bw.notes.map(n=>n.text),mark:!!__ltm.bw.rallyMark}));
  const gn2=await G.until(()=>{ const bw=__ltm.bw; return bw.notes.some(n=>/MOBILIZATION|Calling \d+ nearest/.test(n.text))? {notes:bw.notes.map(n=>n.text),mark:!!bw.rallyMark,big:!!(bw.rallyMark&&bw.rallyMark.big)} : null; },null,4000);
  ok(!hn.notes.some(t=>/MOBILIZATION|Calling \d+ nearest/.test(t))&&!hn.mark,'máy CHỦ không thấy tin "khách gọi quân" và không thấy mốc tập kết của khách (trước 5.2 tin này hiện nhầm lên máy chủ)'+(hn.notes.length? ' — tin trên máy chủ: '+hn.notes.join(' | ') : ''));
  ok(!!gn2,'máy KHÁCH nhận được tin xác nhận lệnh gọi quân của chính mình');
  ok(await G.ev(()=>!!__ltm.bw.rallyMark&&__ltm.bw.rallyMark.big===true)||(gn2&&gn2.mark),'máy KHÁCH thấy trống trận dựng ở điểm tập kết vừa chọn'); }
// KHÁCH quét chọn nhiều đạo rồi ra lệnh
await H.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); for(const a of bw.armies) if(a.owner===1){ a.done=true; } bw.armies=bw.armies.filter(a=>!a.done);
  const mk=(dx,dy,cnt)=>{ const a={owner:1,type:'cavalry',count:cnt,x:c.x-520+dx,y:c.y-240+dy,to:-1,trail:0,food:100,camped:true}; a.tx=a.x; a.ty=a.y; bw.armies.push(a); return a; }; window.__g=[mk(0,0,311),mk(150,30,312),mk(70,150,313)]; });
await G.until(()=>__ltm.bw.armies.filter(a=>a.owner===1).length===3,null,5000);
const gp=await G.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); bw.sel=null; bw.selA=null; bw.selG=null; bw.menu=null; bw.zoom=bw.zoomTgt=1; bw.camX=c.x-460-bw.lastVw/bw.scale0/2; bw.camY=c.y-180-bw.lastVh/bw.scale0/2; return bw.armies.filter(a=>a.owner===1).map(a=>[a.x,a.y]); }); await G.settle();
if(ok(gp.length>=3,'máy khách: thấy 3 đạo quân của mình')){ const sp=[]; for(const q of gp) sp.push(await G.scr(q[0],q[1]-28));
  const x0=Math.min(...sp.map(q=>q[0]))-45, y0=Math.min(...sp.map(q=>q[1]))-45, x1=Math.max(...sp.map(q=>q[0]))+45, y1=Math.max(...sp.map(q=>q[1]))+45;
  await G.drag(x0,y0,x1,y1,14,480);
  ok(await G.until(()=>__ltm.bw.selG&&__ltm.bw.selG.length>=3,null,3000),'khách: giữ rồi kéo khung → chọn 3 đạo (trên máy khách)'); await G.p.waitForTimeout(600);
  ok(await G.ev(()=>__ltm.bw.selG&&__ltm.bw.selG.length>=3),'khách: lựa chọn cả cụm còn nguyên sau khi nhận ảnh trạng thái mới');
  const tg=await G.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); return [c.x-900,c.y-150]; }); await G.settle(); s=await G.scr(tg[0],tg[1]); await G.tap(s[0],s[1]); await G.p.waitForTimeout(200);
  const mv=await G.until(()=>(__ltm.bw._menuRects||[]).filter(r=>r.id==='move').map(r=>[r.x+r.w/2,r.y+r.h/2])[0]||null); if(mv) await G.tap(mv[0],mv[1]);
  ok(await H.until(()=>window.__g.filter(a=>!a.camped&&!a.done).length===3,null,5000),'máy CHỦ: cả 3 đạo của khách cùng lên đường theo lệnh quét chọn'); }
// thông báo trận đánh tới máy khách
await H.ev(()=>{ const bw=__ltm.bw, a=window.__g[0]; bw.armies.push({owner:0,type:'spear',count:200,x:a.x+30,y:a.y,to:-1,tx:a.x,ty:a.y,trail:0,food:100,camped:true}); }); await G.p.waitForTimeout(1500);
ok(await G.ev(()=>__ltm.bw.notes.some(n=>/Battle|AMBUSH|Victory|Defeat/.test(n.text))),'máy khách nhận THÔNG BÁO trận đánh của phe mình (trước đây khách không có thông báo nào)');
// v5.0 LƯƠNG THẢO qua P2P: đại quân của khách phải chuẩn bị lương (khách THẤY đếm ngược); xe lương do máy chủ tính, máy khách thấy được
await H.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); c.count=9000; c.food=600; const tg=bw.nodes.filter(n=>n.owner===2).sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y))[0]; bw.asFid(1,()=>bw.send(c,tg)); });
const gp2=await G.until(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===1&&a.count>=9000&&a.prep>0); return a? {prep:a.prep,p0:a.prep0} : null; },null,5000);
ok(!!gp2&&gp2.prep>0.5,`máy khách: thấy đại quân 9 000 của mình đang CHUẨN BỊ LƯƠNG (còn ${gp2?gp2.prep.toFixed(1):'?'}s)`);
await H.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===1); c.food=600; const a={owner:1,type:'spear',count:2500,x:c.x-1500,y:c.y,to:-1,tx:c.x-1500,ty:c.y,trail:0,camped:true,food:20}; bw.armies.push(a); bw.supplyTick(); window.__cvN=bw.convoys.length; });
const hc=await H.ev(()=>window.__cvN); const gc=await G.until(()=>(__ltm.bw.convoys||[]).filter(c=>c.owner===1).length,null,5000);
ok(hc>=1&&gc>=1,`xe lương của khách: máy chủ tính (${hc} chuyến), máy khách nhìn thấy (${gc} chuyến)`);
ok(H.errs.length===0&&G.errs.length===0,'không lỗi JS trên cả hai máy'+(H.errs.concat(G.errs).length?': '+H.errs.concat(G.errs)[0]:''));
await finish('P2P HAI MÁY',b);
