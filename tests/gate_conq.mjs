// (5.7) CHINH PHẠT như người chơi: BATTLE → CONQUEST → chọn nước + mức khó → Bộ lạc → thống nhất → báo chuyển sang Nội chiến → thắng → Đại chiến.
// Kiểm quân số hiển thị đúng cấp bản đồ, loại quân, tên/màu phe, lãnh thổ, lưu/nạp giữa chừng, ván Quần Hùng cũ vẫn chơi tiếp được.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
const winAll=(T)=>T.ev(()=>{ const bw=__ltm.bw; for(const n of bw.nodes){ if(n.camp&&n.owner!==0&&n.owner!==2){ const prev=n.owner; n.owner=0; n.count=Math.max(1,n.count); bw.checkCamp(n,0,prev); } } bw.checkVictory(); return bw.over&&bw.result&&bw.result.win; });
for(const [dn,dev] of [...DEVICES, PORTRAIT[1]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r; const txt=(s)=>T.ev((s)=>{ const e=document.querySelector(s); return e? e.textContent : null; },s);
  await T.tapEl('#bBW'); await p.waitForTimeout(250);
  ok(/CONQUEST/.test(await txt('#bBossRoyale'))&&/Tribes/.test(await txt('#bBossRoyale')),'nút CONQUEST ghi rõ Bộ lạc → Nội chiến → Đại chiến');
  r=await T.tapEl('#bBossRoyale'); await p.waitForTimeout(400);
  ok(r.ok&&await T.visible('#civPick')&&/Tribal Wars/.test(await txt('#civGo')),'lần đầu: chọn nước ngay, nút ghi "Start Tribal Wars"');
  const civ=await T.ev(()=>CivPick.sel);
  ok(await T.ev(()=>[...document.querySelectorAll('#civPick button')].some(e=>/Hard/.test(e.textContent)&&e.offsetParent)),'có chọn mức khó ở màn chọn nước');
  await T.tapEl('#civGo'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(600);
  let s=await T.ev(()=>{ const bw=__ltm.bw, me=bw.nodes.filter(n=>n.owner===0).reduce((a,n)=>a+n.count,0); return {conq:bw.conq,W:BW.W,fac:new Set(bw.nodes.filter(n=>n.camp).map(n=>n.owner)).size,types:[...new Set(bw.nodes.map(n=>n.type))],me:+bwN(me),up:bw.up,gear:bw.gearHudOn(),civ:bw.cfg.civ,names:Object.values(bw.facName),cols:new Set(Object.values(BW.civPal).map(c=>c.color)).size,civs:new Set(Object.values(bw.civs).map(c=>c.id)).size}; });
  ok(s.conq==='tribe'&&s.W===9600&&s.fac>=8&&s.fac<=12,`Bộ lạc: bản đồ nhỏ ${s.W}, ${s.fac} bộ lạc (8–12)`);
  ok(s.types.length===1&&s.types[0]==='tribal','Bộ lạc: chỉ một loại quân (chiến binh bộ lạc)');
  ok(s.me>=20&&s.me<=50,`Bộ lạc: quân khởi điểm hiển thị ${s.me} (20–50)`);
  ok(!s.up&&!s.gear,'Bộ lạc: không Lò rèn, không quân nhu');
  ok(s.civ===civ&&s.civs===1&&s.cols>=s.fac-1&&new Set(s.names).size===s.names.length&&s.names.every(n=>/Clan/.test(n)),`các bộ lạc cùng nền văn minh, tên + màu riêng (${s.names.slice(0,3).join(', ')}…)`);
  ok(await T.ev(()=>BW.counter('tribal','tribal','plain')===1),'chiến binh bộ lạc không khắc chế nhau');
  await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro()); await p.waitForTimeout(700); await T.hookDraw();
  const capN=await T.ev(()=>bwN(__ltm.bw.nodes[0].count));
  ok((await T.drawn('^'+capN+'$')).length>0,`số quân trên bảng gỗ của kinh đô hiện đúng cấp bộ lạc (${capN})`);
  ok(await T.ev(()=>{ const bw=__ltm.bw; return !!(bw._terrCh&&[...bw._terrCh.values()].some(q=>q[0])&&bw._terrCv); }),'lãnh thổ + đường biên của ta được vẽ');
  // giành thêm đồn → lãnh thổ nở ra
  const grow=await T.ev(()=>{ const bw=__ltm.bw, own=bw._terrO, c0=[...own].filter(o=>o===0).length; const n=bw.nodes.filter(n=>n.owner===2&&!n.camp).sort((a,b)=>Math.hypot(a.x-bw.nodes[0].x,a.y-bw.nodes[0].y)-Math.hypot(b.x-bw.nodes[0].x,b.y-bw.nodes[0].y))[0]; n.owner=0; bw.terrBuild(); return [c0,[...bw._terrO].filter(o=>o===0).length]; });
  ok(grow[1]>grow[0],`chiếm thêm cứ điểm: lãnh thổ mở rộng (${grow[0]} → ${grow[1]} ô)`);
  // chạm thật: chọn kinh đô → chạm đồn trung lập gần nhất → chọn lệnh trong menu → đạo quân lên đường, bảng gỗ ghi số theo cấp bộ lạc
  { const tapW=async(wx,wy)=>{ await T.aim(wx,wy); await T.settle(); const q=await T.scr(wx,wy); await T.tap(q[0],q[1]); await p.waitForTimeout(300); };
    const P=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; const t=bw.nodes.filter(n=>n.owner===2&&!n.camp).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0]; window.__t=t; return {c:[c.x,c.y],t:[t.x,t.y]}; });
    await tapW(P.c[0],P.c[1]); ok(await T.ev(()=>__ltm.bw.sel===__ltm.bw.nodes[0]),'chạm chọn được kinh đô bộ lạc');
    await tapW(P.t[0],P.t[1]); const R=await T.until(()=>{ const R=(__ltm.bw._menuRects||[]); return R.length&&__ltm.bw.menu? R.map(r=>({id:r.id,sel:r.sel||null,s:r.s||'',x:r.x+r.w/2,y:r.y+r.h/2})) : null; },null,3000)||[];
    const go=R.find(r=>!r.sel&&(r.id==='attack'||r.id==='move'||r.id==='eat'))||R.find(r=>!r.sel&&r.id!=='cancel');
    ok(!!go,'menu lệnh hiện ra khi chạm đồn trung lập'+(go? ' ('+go.id+')' : ''));
    if(go){ await T.tap(go.x,go.y); await p.waitForTimeout(500); }
    const a=await T.ev(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&!a.done); return a? {type:a.type,n:bwN(a.count)} : null; });
    ok(a&&a.type==='tribal'&&+a.n>=1&&+a.n<=60,`đạo quân bộ lạc lên đường (${a&&a.n} chiến binh)`);
    if(a) ok((await T.drawn('^'+a.n+'$')).length>0,'bảng gỗ trên đạo quân ghi đúng số chiến binh'); }
  ok(await T.ev(()=>/\d+ tribes/.test(__ltm.bw._hudTop&&__ltm.bw._hudTop.t2||'')),'thanh trên cùng đếm số bộ lạc còn lại');
  // thống nhất bộ lạc → báo chuyển màn
  ok(await winAll(T),'thống nhất các bộ lạc = thắng'); await T.vis('#result');
  ok(/TRIBES ARE UNITED/.test(await txt('#rStage'))&&/Civil War/.test(await txt('#rStage')),'màn thắng báo: bộ lạc đã thống nhất, tiếp theo là Nội chiến');
  r=await T.tapEl('#bNext'); ok(r.ok&&/Civil War/.test(await txt('#bNext')),'nút "Begin the Civil War" chạm được');
  await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.conq==='civil'&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(500);
  s=await T.ev(()=>{ const bw=__ltm.bw, me=bw.nodes.filter(n=>n.owner===0).reduce((a,n)=>a+n.count,0); return {W:BW.W,fac:new Set(bw.nodes.filter(n=>n.camp).map(n=>n.owner)).size,mil:bw.nodes.filter(n=>n.owner===2&&n.type==='militia').length,trains:bw.nodes.filter(n=>n.eco==='train').length,me:+bwN(me),civ:bw.cfg.civ,diff:bw.cfg.diff,civs:new Set(Object.values(bw.civs).map(c=>c.id)).size,names:Object.values(bw.facName),up:!!bw.up}; });
  ok(s.W===14000&&s.fac>=16&&s.fac<=20,`Nội chiến: bản đồ vừa ${s.W}, ${s.fac} vùng (16–20)`);
  ok(s.civ===civ&&s.civs===1&&new Set(s.names).size===s.names.length,`các vùng cùng một nước (${civ}), tên riêng: ${s.names.slice(1,4).join(', ')}…`);
  ok(s.me>=2000*0.9&&s.me<=5000*1.1,`Nội chiến: quân khởi điểm ${s.me} (2 000–5 000)`);
  ok(s.mil>20&&s.trains>3,`có dân binh ở đồn/làng trung lập (${s.mil}) và lò luyện binh chủng (${s.trains})`);
  ok(await T.ev(()=>Math.abs(BW.counter('militia','spear','plain')-0.8)<1e-9&&BW.counter('spear','militia','plain')===1&&BW.counter('cavalry','militia','plain')===1),'dân binh đánh ×0,8, không khắc ai, không ai khắc');
  const mt=await T.ev(()=>{ const bw=__ltm.bw; const v=bw.nodes.find(n=>n.owner===0&&!n.camp&&!n.eco)||bw.nodes.find(n=>n.owner===2&&!n.camp&&!n.eco); v.owner=0; v.type='spear'; v.mix=null; v.count=100; bw.capInfo={}; v.struct='village'; bw.militiaTick(); bw.militiaTick(); return {c:v.count,m:bw.mixOf(v).militia||0}; });
  ok(mt.c>100&&mt.m>0,`làng đã chiếm tự mộ dân binh (100 → ${mt.c}, ${Math.round(mt.m*100)}% dân binh)`);
  // thoát giữa trận, mở lại app → CONTINUE CONQUEST
  await T.ev(()=>__ltm.royaleSave()); await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(400);
  await T.tapEl('#bBW'); await p.waitForTimeout(250);
  ok(/CONTINUE CONQUEST/.test(await txt('#bBossContinue'))&&/Civil War/.test(await txt('#bBossContinue')),'mở lại app: nút "CONTINUE CONQUEST · Civil War"');
  ok(/Stage 2\/3/.test(await txt('#bBossRoyale')),'nút CONQUEST ghi đang ở chặng 2/3');
  r=await T.tapEl('#bBossContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(400);
  ok(await T.ev(()=>__ltm.bw.conq==='civil'&&BW.W===14000&&BW.dk===1&&__ltm.bw.nodes.length>150),'đánh tiếp đúng bản đồ Nội chiến');
  ok(await winAll(T),'thắng Nội chiến'); await T.vis('#result');
  ok(/CIVIL WAR IS WON/.test(await txt('#rStage'))&&/Great War/.test(await txt('#rStage')),'màn thắng báo chuyển sang Đại chiến');
  await T.tapEl('#bNext'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.conq==='great'&&__ltm.bw.lastVw>0,null,{timeout:20000}); await p.waitForTimeout(500);
  s=await T.ev(()=>{ const bw=__ltm.bw, me=bw.nodes.filter(n=>n.owner===0).reduce((a,n)=>a+n.count,0), caps=bw.nodes.filter(n=>n.camp);
    const edge=caps.filter(n=>n.x<BW.W*0.05||n.x>BW.W*0.95||n.y<BW.H*0.08||n.y>BW.H*0.92).length; let dmin=1e9; for(const a of caps) for(const c of caps) if(a!==c) dmin=Math.min(dmin,Math.hypot(a.x-c.x,a.y-c.y));
    return {W:BW.W,H:BW.H,fac:new Set(caps.map(n=>n.owner)).size,civs:new Set(Object.values(bw.civs).map(c=>c.id)).size,all:BW_CIVS.length,me:+bwN(me),types:[...new Set(bw.nodes.map(n=>n.type))],edge,dmin:Math.round(dmin),civ:bw.cfg.civ}; });
  ok(s.W>=40000&&s.H>=12000,`Đại chiến: bản đồ ${s.W}×${s.H} (gấp đôi mỗi chiều)`);
  ok(s.fac===s.all&&s.civs===s.all,`Đại chiến: đủ mọi nước trong game (${s.fac}/${s.all})`);
  ok(s.me>=10000&&s.me<=50000,`Đại chiến: quân khởi điểm ${s.me} (10 000–50 000)`);
  ok(!s.types.includes('tribal')&&!s.types.includes('militia'),'Đại chiến: chỉ binh chủng chính quy');
  ok(s.edge===0&&s.dmin>1500,`kinh đô rải trong lòng bản đồ, không sát mép, cách nhau ≥ ${s.dmin}`);
  ok(s.civ===civ,'vẫn là nước đã chọn từ đầu');
  await T.ev(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:false}; }); await T.vis('#result');
  ok(/Retry the Great War/.test(await txt('#bAgain')),'thua Đại chiến: nút "Retry the Great War"');
  await T.tapEl('#bRMenu'); await p.waitForTimeout(300); await T.tapEl('#bBW'); await p.waitForTimeout(250); await T.tapEl('#bBossRoyale'); await p.waitForTimeout(400);
  const cs=await T.ev(()=>({cl:document.querySelectorAll('#conqList .stg.cleared').length,cur:(document.querySelector('#conqList .stg.cur')||{}).dataset?.conq,lock:document.querySelectorAll('#conqList .stg.lock').length,
    fit:(()=>{ const c=document.querySelector('#conquest .campcard').getBoundingClientRect(); return c.top>=-1&&c.bottom<=innerHeight+1; })()}));
  ok(await T.visible('#conquest')&&cs.cl===2&&cs.cur==='great'&&cs.fit,`màn CHINH PHẠT: 2 chặng đã thắng, đang ở Đại chiến, gọn trong màn hình`);
  r=await T.tapEl('#conqBack'); ok(r.ok&&await T.visible('#bossPick'),'nút Back về màn BATTLE');
  // ván Quần Hùng lưu từ bản cũ vẫn chơi tiếp đúng bản đồ cũ
  await T.ev(()=>{ __ltm.G.bwCfg={royale:36,seed:99,civ:'rome',diff:1,bio:1}; __ltm.startBigWar(5); __ltm.bw.time=120; __ltm.royaleSave(); });
  await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(400); await T.tapEl('#bBW'); await p.waitForTimeout(250);
  ok(/CONTINUE WARLORDS/.test(await txt('#bBossContinue')),'ván Quần Hùng cũ: vẫn có nút CONTINUE WARLORDS');
  await T.tapEl('#bBossContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(300);
  ok(await T.ev(()=>!__ltm.bw.conq&&BW.W===20000&&BW.dk===1),'ván cũ mở lại trên bản đồ Quần Hùng 20 000 như trước');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length? ': '+T.errs.slice(0,3).join(' | ') : ''));
  await T.ctx.close(); }
await finish('Chinh phạt (Bộ lạc → Nội chiến → Đại chiến)',b);
