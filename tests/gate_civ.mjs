// VĂN MINH & BINH CHỦNG — như người chơi: chọn nước theo tên / châu lục / ngẫu nhiên, vào trận đúng nước, đúng binh chủng sở trường,
// tên nước hiện trong trận, thẻ binh chủng, báo trước tương quan, lưu-chơi tiếp giữ nguyên nước.
const BW_CIVS_N=44;
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of DEVICES){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r;
  await T.ev(()=>{ localStorage.removeItem('ltm_royale_save_v1'); });
  await T.tapEl('#bBW'); await p.waitForTimeout(150); await T.tapEl('#bBoss1v1'); await p.waitForTimeout(400); await T.tapEl('.stg.cur'); await p.waitForTimeout(400);
  ok(await T.vis('#civPick'),'màn chọn nước hiện ra');
  const n0=await T.ev(()=>document.querySelectorAll('#civGrid .civ').length); ok(n0>=40,`có ${n0} nền văn minh để chọn (≥40)`);
  ok(await T.ev(()=>['daiviet','tang','japan','goguryeo','maya'].every(id=>!!document.querySelector(`#civGrid .civ[data-civ="${id}"]`))),'có đủ Việt Nam (Đại Việt), Trung Quốc (Đường), Nhật, Hàn (Goguryeo), Maya');
  // lọc theo châu lục
  r=await T.tapEl('#civTabs .btn[data-reg="americas"]'); ok(r.ok,'chạm được thẻ Americas'); await p.waitForTimeout(200);
  const am=await T.ev(()=>[...document.querySelectorAll('#civGrid .civ')].map(e=>e.dataset.civ)); ok(am.includes('maya')&&am.length>=3&&am.length<12,`thẻ châu Mỹ lọc còn ${am.length} nước, có Maya`);
  await T.tapEl('#civTabs .btn[data-reg="all"]'); await p.waitForTimeout(150);
  // tìm theo tên (gõ không dấu)
  await p.fill('#civSearch','dai viet'); await p.waitForTimeout(200);
  ok(await T.ev(()=>{ const L=[...document.querySelectorAll('#civGrid .civ')]; return L.length===1&&L[0].dataset.civ==='daiviet'; }),'gõ "dai viet" (không dấu) ra đúng Đại Việt');
  await p.fill('#civSearch','zzzz'); await p.waitForTimeout(200); ok(await T.ev(()=>document.querySelectorAll('#civGrid .civ').length===0&&/No civilization/.test(document.getElementById('civGrid').textContent)),'tên không có: báo không tìm thấy');
  await p.fill('#civSearch',''); await p.waitForTimeout(200);
  // ngẫu nhiên
  const s0=await T.ev(()=>CivPick.sel); await T.tapEl('#civRandom'); await p.waitForTimeout(200); const s1=await T.ev(()=>CivPick.sel);
  ok(s1&&s1!==s0,'🎲 Random đổi sang nước khác'); ok(await T.ev(()=>{ const e=document.querySelector('#civGrid .civ.on'); if(!e) return false; const g=document.getElementById('civGrid').getBoundingClientRect(), r=e.getBoundingClientRect(); return r.top>=g.top-2&&r.bottom<=g.bottom+2; }),'nước vừa quay ra nằm trong tầm nhìn của danh sách');
  // chọn Đại Việt bằng chạm → xem thông tin → vào trận
  await p.fill('#civSearch','viet'); await p.waitForTimeout(200); r=await T.tapEl('#civGrid .civ[data-civ="daiviet"]'); ok(r.ok,'chạm chọn Đại Việt'); await p.waitForTimeout(200);
  const info=await T.ev(()=>document.getElementById('civInfo').textContent); ok(/Trần Dynasty/.test(info)&&/Spearmen/.test(info)&&/Ambush/.test(info),'bảng thông tin: nhà Trần, giáo binh sở trường, thế mạnh phục kích');
  r=await T.tapEl('#civGo'); ok(r.ok,'chạm Start '+(r.why||'')); await p.waitForTimeout(700);
  const st=await T.ev(()=>{ const bw=__ltm.bw; if(!bw) return null; bw.skipIntro(); return {me:bw.civOf(0).id,en:bw.civOf(1).id,camp:bw.nodes[0].type,enCamp:bw.nodes[1].type,enSig:bw.civOf(1).sig,tag:bw.natTag(1),note:(bw.notes[0]||{}).text||'',saved:JSON.parse(localStorage.getItem('ltm_save_v1')||localStorage.getItem('ltm_save')||'{}').civ}; });
  ok(st&&st.me==='daiviet','vào trận với đúng nước đã chọn (Đại Việt)'); ok(st&&st.camp==='spear','trại ta sinh GIÁO BINH (sở trường Đại Việt)');
  ok(st&&st.en!=='daiviet'&&st.enCamp===st.enSig,`đối thủ là nước khác (${st&&st.en}), trại địch sinh đúng sở trường của họ`);
  ok(st&&/Đại Việt/.test(st.note)&&st.note.includes(' vs '),'lời mở trận nêu tên hai nước: '+(st&&st.note));
  ok(await T.ev(()=>CivPick.sel==='daiviet'&&save.civ==='daiviet'),'nước đã chọn được nhớ cho lần sau');
  // tên nước hiện trên trại địch (vẽ thật trên canvas)
  await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; const P=CanvasRenderingContext2D.prototype, ft=P.fillText; window.__lab=[]; P.fillText=function(t){ window.__lab.push(String(t)); return ft.apply(this,arguments); }; const e=bw.nodes[1]; bw.camX=e.x-bw.lastVw/bw.scale/2; bw.camY=e.y-bw.lastVh/bw.scale/2; });
  await p.waitForTimeout(500); const tag=await T.ev(()=>__ltm.bw.natTag(1));
  ok(await T.ev((tag)=>window.__lab.some(t=>t.includes(tag)),tag),`trại địch ghi tên nước: "${tag}" (không còn "ENEMY CAMP"/"NATION n")`);
  // thẻ binh chủng khi chọn quân + báo trước tương quan trong menu lệnh
  const mine=await T.ev(()=>{ const bw=__ltm.bw; bw.notes=[]; const n=bw.nodes.find(n=>n.owner===0&&!n.camp); bw.camX=n.x-bw.lastVw/bw.scale/2; bw.camY=n.y-bw.lastVh/bw.scale/2; return {x:n.x,y:n.y,type:n.type}; }); await p.waitForTimeout(300);
  let s=await T.scr(mine.x,mine.y); await T.tap(s[0],s[1]); await p.waitForTimeout(300);
  const chip=await T.ev(()=>{ const bw=__ltm.bw, c=bw._unitChip; return c? {x:c.x,y:c.y,w:c.w,h:c.h,vw:bw.lastVw,vh:bw.lastVh,txt:window.__lab.filter(t=>/×\d+/.test(t)).slice(-1)[0]||''} : null; });
  ok(chip&&chip.x>=0&&chip.y>=0&&chip.x+chip.w<=chip.vw&&chip.y+chip.h<=chip.vh,'chọn quân: hiện THẺ BINH CHỦNG nằm trọn trong màn hình');
  ok(chip&&/ on /.test(chip.txt),'thẻ ghi loại quân, quân số và địa hình đang đứng: '+(chip&&chip.txt));
  const en=await T.ev(()=>{ const bw=__ltm.bw; const e=bw.nodes.filter(n=>n.owner===1&&!n.camp)[0]; e.type='cavalry'; e.known={count:e.count,type:'cavalry',t:bw.time}; bw.camX=e.x-bw.lastVw/bw.scale/2; bw.camY=e.y-bw.lastVh/bw.scale/2; return {x:e.x,y:e.y,ter:e.ter}; }); await p.waitForTimeout(300);
  s=await T.scr(en.x,en.y); await T.tap(s[0],s[1]); await p.waitForTimeout(300);
  const opts=await T.ev(()=>__ltm.bw.menu? __ltm.bw.menu.opts.map(o=>o.s) : []);
  const exp=await T.ev(([t,ter])=>{ const r=__ltm.bw.matchup(t,'cavalry',ter); return r>=1.25?'▲':r<=0.8?'▼':''; },[mine.type,en.ter]);
  ok(opts.length>=3&&(exp===''||opts[0].includes(exp)),`menu lệnh báo trước tương quan với kỵ binh địch đã do thám: "${opts[0]}" (mong đợi "${exp}")`);
  // --- chọn ải đã mở
  await T.ev(()=>{ stopBigWar(true); save.bwMax=5; Save.set(save); }); await p.waitForTimeout(300);
  await T.tapEl('#bBW'); await p.waitForTimeout(150); await T.tapEl('#bBoss1v1'); await p.waitForTimeout(400);
  ok(await T.ev(()=>document.querySelectorAll('.stg.cleared').length===4&&document.querySelector('.stg.cur').dataset.lv==='5'&&document.querySelectorAll('.stg.lock').length===5),'đã mở tới ải 5: màn chiến dịch hiện 4 ải đã qua, ải 5 đang tới, 5 ải còn khoá');
  await T.tapEl('.stg[data-lv="3"]'); await p.waitForTimeout(300); ok(/Stage 3\/10/.test(await T.ev(()=>document.getElementById('civStage').textContent)),'chọn lại ải 3: bảng chọn nước ghi "Stage 3/10"'); await T.tapEl('#civGo'); await p.waitForTimeout(700);
  ok(await T.ev(()=>__ltm.bw&&__ltm.bw.lv===3),'Start: vào đúng ải 3 (chơi lại ải cũ được)');
  // --- nút Back
  await T.ev(()=>stopBigWar(true)); await p.waitForTimeout(250); await T.tapEl('#bBW'); await p.waitForTimeout(150); await T.ev(()=>soloClear()); await T.tapEl('#bBoss1v1'); await p.waitForTimeout(300); await T.tapEl('.stg.cur'); await p.waitForTimeout(300); await T.tapEl('#civBack'); await p.waitForTimeout(250);
  ok(!(await T.visible('#civPick'))&&await T.visible('#campaign')&&await T.ev(()=>!__ltm.bw),'Back: quay về màn chiến dịch, chưa vào trận'); await T.tapEl('#campBack'); await p.waitForTimeout(250); ok(await T.visible('#bossPick'),'Back lần nữa: về bảng chọn chế độ');
  // --- Quần Hùng: 37 nước khác nhau; lưu rồi chơi tiếp giữ nguyên các nước
  await T.tapEl('#bBossRoyale'); await p.waitForTimeout(350); await p.fill('#civSearch','rome'); await p.waitForTimeout(200); await T.tapEl('#civGrid .civ[data-civ="rome"]'); await p.waitForTimeout(150); await T.tapEl('#civGo'); await p.waitForTimeout(1200);
  await T.ev(()=>{ save.conq.stage=2; Save.set(save); startConq('great'); }); await p.waitForTimeout(1500);   /* (5.7) Chinh phạt: kiểm ở chặng Đại chiến (mọi nước) */
  const ro=await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro(); const ids=Object.keys(bw.civs).map(f=>bw.civs[f].id); const camps=bw.nodes.filter(n=>n.camp&&n.owner!==2);
    return {me:bw.civOf(0).id,n:ids.length,uniq:new Set(ids).size,campsNamed:camps.every(c=>!!bw.civOf(c.owner)),campSig:camps.filter(c=>c.type===bw.civOf(c.owner).sig).length,camps:camps.length,list:ids.join(',')}; });
  ok(ro.me==='rome'&&ro.n===BW_CIVS_N&&ro.uniq===BW_CIVS_N,`Đại chiến: ta là La Mã, ${ro.n} nước là ${ro.uniq} nền văn minh khác nhau`);
  ok(ro.campsNamed&&ro.campSig===ro.camps,`cả ${ro.camps} kinh đô đều có tên nước và sinh đúng binh chủng sở trường (${ro.campSig})`);
  await T.ev(()=>{ __ltm.bw.time=222; }); await T.tapEl('#bwBack'); await p.waitForTimeout(400); await T.tapEl('#bBW'); await p.waitForTimeout(200); await T.tapEl('#bBossContinue'); await p.waitForTimeout(1200);
  const ro2=await T.ev(()=>{ const bw=__ltm.bw; return bw? Object.keys(bw.civs).map(f=>bw.civs[f].id).join(',') : ''; });
  ok(ro2===ro.list,'lưu → thoát → CONTINUE: mọi nước giữ nguyên như cũ');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
  await T.ctx.close(); }
// màn chọn nước ở màn dọc + máy nhỏ: mọi nút bấm được, không bị che, không tràn màn hình
for(const [dn,dev] of [...PORTRAIT,['Android nhỏ ngang 640×360',{viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true}],['Rất hẹp dọc 320×568',{viewport:{width:320,height:568},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T;
  await T.tapEl('#bBW'); await p.waitForTimeout(150); await T.tapEl('#bBoss1v1'); await p.waitForTimeout(400); await T.tapEl('.stg.cur'); await p.waitForTimeout(400);
  const lay=await T.ev(()=>{ const vw=innerWidth, vh=innerHeight, out=[]; for(const id of ['civSearch','civRandom','civBack','civGo','civTabs','civGrid','civInfo']){ const r=document.getElementById(id).getBoundingClientRect(); if(r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1) out.push(id+' tràn màn hình'); if(r.width<30||r.height<24) out.push(id+' quá nhỏ'); }
    const g=document.getElementById('civGrid').getBoundingClientRect(); if(g.height<60) out.push('danh sách nước chỉ cao '+Math.round(g.height)+'px');
    const a=document.getElementById('civBack').getBoundingClientRect(), c=document.getElementById('civGo').getBoundingClientRect(); if(a.right>c.left+1&&a.bottom>c.top+1&&a.top<c.bottom-1) out.push('Back đè Start'); return out; });
  ok(lay.length===0,'bố cục màn chọn nước gọn trong màn hình'+(lay.length?': '+lay.join('; '):''));
  let r=await T.tapEl('#civRandom'); ok(r.ok,'chạm được 🎲 Random '+(r.why||'')); r=await T.tapEl('#civGo'); ok(r.ok,'chạm được Start '+(r.why||'')); await p.waitForTimeout(600);
  ok(await T.ev(()=>!!__ltm.bw),'vào được trận'); ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
  await T.ctx.close(); }
await finish('VĂN MINH & BINH CHỦNG',b);
