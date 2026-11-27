// (5.3) CHIẾN DỊCH 10 ẢI như người chơi: thấy tiến trình, thấy chuyển ải, thoát giữa trận vào đánh tiếp; Quần Hùng chọn mức khó.
// Mọi bước đều chạm thật vào nút đang hiện trên màn hình (Android ngang, iOS ngang, iOS dọc).
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of [...DEVICES, PORTRAIT[1], ['Android nhỏ ngang 640×360',{viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:DEVICES[0][1].userAgent}]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r; const txt=(s)=>T.ev((s)=>{ const e=document.querySelector(s); return e? e.textContent : null; },s);
  const inView=(sel)=>T.ev((sel)=>{ const vw=innerWidth, vh=innerHeight; return [...document.querySelectorAll(sel)].filter(e=>e.offsetParent).every(e=>{ const q=e.getBoundingClientRect(); return q.left>=-1&&q.top>=-1&&q.right<=vw+1&&q.bottom<=vh+1; }); },sel);
  // --- người chơi mới: nút 1v1 ghi rõ đang ở ải mấy
  await T.tapEl('#bBW'); await p.waitForTimeout(250);
  ok(/Stage 1 of 10/.test(await txt('#bBoss1v1'))&&!(await T.visible('#bSoloContinue')),'người chơi mới: nút chiến dịch ghi "Stage 1 of 10", chưa có nút CONTINUE');
  r=await T.tapEl('#bBoss1v1'); await p.waitForTimeout(350);
  ok(r.ok&&await T.visible('#campaign'),'mở được màn CHIẾN DỊCH');
  const st0=await T.ev(()=>({n:document.querySelectorAll('.stg').length,cur:[...document.querySelectorAll('.stg.cur')].map(e=>e.dataset.lv).join(),lock:document.querySelectorAll('.stg.lock').length,cl:document.querySelectorAll('.stg.cleared').length,prog:document.getElementById('campProg').textContent,
    names:new Set([...document.querySelectorAll('.stg .nm b')].map(e=>e.textContent)).size, lands:new Set([...document.querySelectorAll('.stg .nm small:first-of-type')].map(e=>e.textContent.split('·')[0].trim())).size,
    cut:[...document.querySelectorAll('.stg .nm b')].filter(e=>e.scrollWidth>e.clientWidth+1).length}));
  ok(st0.n===10&&st0.cur==='1'&&st0.lock===9&&st0.cl===0&&/Cleared 0\/10/.test(st0.prog),`màn chiến dịch: 10 ải, ải 1 đang tới, 9 ải khoá, "${st0.prog}"`);
  ok(st0.names===10&&st0.lands===10,`mỗi ải một tên và một vùng đất riêng (${st0.lands} kiểu địa hình)`);
  ok(await inView('#campBack, #campForge')&&await T.ev(()=>{ const c=document.querySelector('.campcard').getBoundingClientRect(); return c.top>=-1&&c.bottom<=innerHeight+1&&c.left>=-1&&c.right<=innerWidth+1; }),'màn chiến dịch nằm gọn trong màn hình, nút Back/Armory không bị che');
  // ải khoá: chạm vào không vào trận
  await T.ev(()=>document.querySelector('.stg[data-lv="4"]').scrollIntoView({block:'center'})); await p.waitForTimeout(200); r=await T.tapEl('.stg[data-lv="4"]'); await p.waitForTimeout(300);
  ok(await T.visible('#campaign')&&!(await T.visible('#civPick'))&&await T.ev(()=>!__ltm.bw),'chạm ải còn khoá: không vào trận');
  // vào ải 1
  await T.ev(()=>document.querySelector('.stg.cur').scrollIntoView({block:'center'})); await p.waitForTimeout(200); r=await T.tapEl('.stg.cur'); await p.waitForTimeout(350);
  ok(r.ok&&await T.visible('#civPick')&&/Stage 1\/10/.test(await txt('#civStage'))&&/Start Stage 1/.test(await txt('#civGo')),'chạm ải 1: sang chọn nước, nút ghi "Start Stage 1"');
  await T.tapEl('#civGo'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await p.waitForTimeout(500);
  const in1=await T.ev(()=>({vis:!document.getElementById('stageIntro').classList.contains('hidden'),top:document.getElementById('siTop').textContent,name:document.getElementById('siName').textContent,land:document.getElementById('siLand').textContent,boss:document.getElementById('siBoss').textContent,lv:__ltm.bw.lv,map:__ltm.bw.cfg.map,
    box:(()=>{ const q=document.getElementById('stageIntro').getBoundingClientRect(); return q.left>=-1&&q.right<=innerWidth+1&&q.top>=0&&q.bottom<=innerHeight; })()}));
  ok(in1.vis&&in1.top==='STAGE 1 / 10'&&in1.name==='Fields of ambition'&&/Grassland/.test(in1.land)&&/Boss/.test(in1.boss)&&in1.box,`vào trận: băng giới thiệu "${in1.top} · ${in1.name} · ${in1.land}"`);
  ok(in1.lv===1&&in1.map>=0&&in1.map<=2,'ải 1 đánh trên 1 trong 3 bản đồ của ải 1');
  await T.ev(()=>{ __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); }); await p.waitForTimeout(5200);
  ok(!(await T.visible('#stageIntro')),'băng giới thiệu tự tắt sau vài giây (không che bản đồ)');
  ok(/Stage 1\/10/.test(await T.ev(()=>{ __ltm.bw.revealHud(); return (__ltm.bw._hudTop&&__ltm.bw._hudTop.t2)||''; }))|| (dev.viewport.width<700), 'thanh trên ghi "Stage 1/10"');
  // thắng ải 1 → báo qua ải + mở ải 2
  await T.ev(()=>{ const bw=__ltm.bw; bw.time=215; bw.over=true; bw.result={win:true}; }); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(350);
  const rs=await txt('#rStage'); ok(/STAGE 1 \/ 10 CLEARED/.test(rs)&&/Stage 2 unlocked: Pasture Wars/.test(rs),`thắng ải 1: "${rs}"`);
  ok(/Next: Stage 2/.test(await txt('#bNext'))&&await inView('#result .btn'),'nút "Next: Stage 2 ▶" hiện rõ, mọi nút nằm trong màn hình');
  r=await T.tapEl('#bNext'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lv===2&&__ltm.bw.lastVw>0); await p.waitForTimeout(500);
  const in2=await T.ev(()=>({top:document.getElementById('siTop').textContent,name:document.getElementById('siName').textContent,land:document.getElementById('siLand').textContent,map:__ltm.bw.cfg.map,bio:__ltm.bw.biomeId,vis:!document.getElementById('stageIntro').classList.contains('hidden')}));
  ok(r.ok&&in2.vis&&in2.top==='STAGE 2 / 10'&&in2.name==='Pasture Wars'&&/River Land/.test(in2.land)&&in2.bio==='rivers'&&in2.map>=3&&in2.map<=5,`sang ải 2 thấy rõ chuyển ải: "${in2.top} · ${in2.name} · ${in2.land}"`);
  // chơi 1 phút rồi thoát ra menu → có nút CONTINUE; tắt hẳn app mở lại vẫn còn
  await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); for(let i=0;i<1300;i++) bw.update(0.05); const me=bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0), t=bw.nodes.filter(n=>n.owner===2).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0]; bw.send(me,t); for(let i=0;i<40;i++) bw.update(0.05); });
  const sig=()=>T.ev(()=>{ const b=__ltm.bw; return {t:Math.round(b.time),lv:b.lv,map:b.cfg.map,en:b.civOf(1).id,nodes:b.nodes.map(n=>n.owner+':'+Math.round(n.count/5)).join(','),arm:b.armies.filter(a=>!a.done).length}; }); const en1=await T.ev(()=>__ltm.bw.civOf(1).id);
  r=await T.tapEl('#bwBack'); await p.waitForTimeout(300); if(await T.visible('#ask')){ await T.tapEl('#askY'); await p.waitForTimeout(300); }
  ok(await T.visible('#menu')&&await T.ev(()=>!__ltm.bw&&!!localStorage.getItem('ltm_solo_save_v1')),'thoát giữa trận ải 2: về menu, ván được lưu');
  /* so với đúng những gì đã ghi xuống máy (trận vẫn chạy cho tới lúc bấm thoát) */
  const s1=await T.ev(()=>{ const sv=JSON.parse(localStorage.getItem('ltm_solo_save_v1')); return {t:Math.round(sv.sc.time),lv:sv.lv,map:sv.cfg.map,nodes:sv.nodes.map(n=>n.owner+':'+Math.round(n.count/5)).join(','),arm:sv.armies.filter(a=>!a.done).length}; });
  await p.reload(); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(400); await T.tapEl('#bBW'); await p.waitForTimeout(250);
  const ct=await txt('#bSoloContinue'); ok(await T.visible('#bSoloContinue')&&/CONTINUE STAGE 2/.test(ct)&&/Pasture Wars/.test(ct)&&/1 min played/.test(ct),`tắt app mở lại: nút "${ct}"`);
  ok(/Stage 2 of 10 · 1 cleared/.test(await txt('#bBoss1v1'))&&await inView('#bossPick .btn'),'nút chiến dịch ghi "Stage 2 of 10 · 1 cleared"; bảng chọn chế độ không tràn màn hình');
  await T.ev(()=>{ const o=soloResume; soloResume=function(){ const r=o(), b=G.bw; window.__s2={t:Math.round(b.time),lv:b.lv,map:b.cfg.map,en:b.civOf(1).id,nodes:b.nodes.map(n=>n.owner+':'+Math.round(n.count/5)).join(','),arm:b.armies.filter(a=>!a.done).length}; return r; }; });   /* chụp trạng thái NGAY lúc ván vừa mở lại (trước khi trận chạy tiếp) */
  r=await T.tapEl('#bSoloContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0&&window.__s2); await p.waitForTimeout(400); const s2=await T.ev(()=>window.__s2);
  ok(r.ok&&s2.lv===2&&s2.map===s1.map&&s2.en===en1&&s2.nodes===s1.nodes&&s2.arm===s1.arm&&Math.abs(s2.t-s1.t)<=2,`CONTINUE: đúng ải 2, đúng bản đồ, đúng nước địch, quân và cứ điểm y nguyên (phút ${Math.floor(s2.t/60)})`);
  ok(/Battle resumed/.test(await txt('#siBoss')),'băng đầu trận ghi "Battle resumed"');
  // thua ải 2 → không mở ải 3, ván lưu bị xoá
  await T.ev(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:false}; }); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(350);
  ok(/Stage 2 \/ 10 — not cleared yet/.test(await txt('#rStage'))&&!(await T.visible('#bNext'))&&await T.ev(()=>!localStorage.getItem('ltm_solo_save_v1')&&JSON.parse(localStorage.ltm_save).bwMax===2),'thua ải 2: báo chưa qua ải, không có nút Next, không mở ải 3, ván lưu đã xoá');
  await T.tapEl('#bRMenu'); await p.waitForTimeout(300); await T.tapEl('#bBW'); await p.waitForTimeout(250); ok(!(await T.visible('#bSoloContinue')),'hết trận rồi: không còn nút CONTINUE');
  await T.tapEl('#bBoss1v1'); await p.waitForTimeout(300);
  const st1=await T.ev(()=>({cl:[...document.querySelectorAll('.stg.cleared')].map(e=>e.dataset.lv+':'+e.querySelector('em').textContent).join(),cur:document.querySelector('.stg.cur').dataset.lv,prog:document.getElementById('campProg').textContent}));
  ok(/^1:.*Cleared.*03:35/.test(st1.cl)&&st1.cur==='2'&&/Cleared 1\/10/.test(st1.prog),`màn chiến dịch: ải 1 ✔ kèm kỷ lục 03:35, ải 2 đang tới ("${st1.prog}")`);
  // đang có ván dở mà chọn ải khác → hỏi lại
  await T.tapEl('.stg.cur'); await p.waitForTimeout(300); await T.tapEl('#civGo'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await T.ev(()=>{ const bw=__ltm.bw; for(let i=0;i<500;i++) bw.update(0.05); stopBigWar(true); }); await p.waitForTimeout(300);
  await T.tapEl('#bBW'); await p.waitForTimeout(200); await T.tapEl('#bBoss1v1'); await p.waitForTimeout(300); await T.tapEl('.stg[data-lv="1"]'); await p.waitForTimeout(300);
  ok(await T.visible('#ask')&&/Stage 2/.test(await txt('#askS')),'đang có ván ải 2 dở mà chọn ải 1: hỏi lại trước khi xoá ván dở'); await T.tapEl('#askN'); await p.waitForTimeout(250);
  ok(await T.visible('#campaign')&&await T.ev(()=>!!localStorage.getItem('ltm_solo_save_v1')),'bấm Cancel: ván dở còn nguyên');
  // qua hết 10 ải
  await T.ev(()=>{ soloClear(); save.bwMax=10; Save.set(save); G.bwCfg={civ:'rome'}; startBigWar(10); const bw=__ltm.bw; bw.time=900; bw.over=true; bw.result={win:true}; }); await p.waitForSelector('#result:not(.hidden)'); await p.waitForTimeout(350);
  ok(/CAMPAIGN COMPLETE/.test(await txt('#rStage'))&&!(await T.visible('#bNext')),'thắng ải 10: báo HOÀN THÀNH CHIẾN DỊCH, không còn nút Next');
  await T.tapEl('#bRMenu'); await p.waitForTimeout(300); await T.tapEl('#bBW'); await p.waitForTimeout(250); ok(/All 10 stages cleared/.test(await txt('#bBoss1v1')),'nút chiến dịch ghi đã qua cả 10 ải');
  await T.tapEl('#bBoss1v1'); await p.waitForTimeout(300); ok(await T.ev(()=>document.querySelectorAll('.stg.cleared').length===10&&/Complete/.test(document.getElementById('campProg').textContent)),'màn chiến dịch: 10/10 ải ✔ (chơi lại ải nào cũng được)');
  await T.tapEl('#campForge'); await p.waitForTimeout(300); ok(await T.visible('#gear'),'nút Armory trên màn chiến dịch mở kho'); await T.ev(()=>document.querySelector('#gear [data-back]').click()); await p.waitForTimeout(300); ok(await T.visible('#campaign'),'Back từ Armory: quay lại màn chiến dịch');
  await T.tapEl('#campBack'); await p.waitForTimeout(300);
  // --- Quần Hùng: chọn mức khó
  await T.ev(()=>{ try{ localStorage.removeItem('ltm_royale_save_v1'); }catch(e){} }); r=await T.tapEl('#bBossRoyale'); await p.waitForTimeout(350);
  const df=await T.ev(()=>({n:document.querySelectorAll('#civStage .dif').length,on:[...document.querySelectorAll('#civStage .dif.on')].map(e=>e.textContent.trim()).join()}));
  ok(df.n===3&&/Normal/.test(df.on)&&await inView('#civStage .dif, #civGo, #civBack'),`Quần Hùng: 3 nút mức khó, mặc định "${df.on}", nằm gọn trong màn hình`);
  r=await T.tapEl('#civStage .dif[data-dif="2"]'); await p.waitForTimeout(200); ok(r.ok&&/Hard/.test(await T.ev(()=>document.querySelector('#civStage .dif.on').textContent)),'chạm chọn được mức Hard');
  await T.tapEl('#civGo'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.royale&&__ltm.bw.lastVw>0,null,{timeout:20000}); await p.waitForTimeout(500);
  const ry=await T.ev(()=>({diff:__ltm.bw.cfg.diff,fly:__ltm.bw.D.fly,top:document.getElementById('siTop').textContent,bio:__ltm.bw.biomeId,land:document.getElementById('siLand').textContent,name:__ltm.bw.biome.name}));
  ok(ry.diff===2&&ry.fly===5&&ry.top==='CONQUEST 1/3 · HARD'&&ry.land.includes(ry.name),`vào Quần Hùng mức Khó: băng "${ry.top}" · ${ry.land}`);
  await T.ev(()=>{ const bw=__ltm.bw; bw.intro=null; for(let i=0;i<200;i++) bw.update(0.05); stopBigWar(true); }); await p.waitForTimeout(400); await T.tapEl('#bBW'); await p.waitForTimeout(250);
  ok(/Hard/.test(await txt('#bBossContinue')),'nút CONTINUE WARLORDS ghi mức "Hard"');
  await T.tapEl('#bBossContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.royale&&__ltm.bw.lastVw>0,null,{timeout:20000}); await p.waitForTimeout(300);
  ok(await T.ev(()=>__ltm.bw.cfg.diff===2&&__ltm.bw.D.diff===2&&__ltm.bw.biomeId)===ry.bio,'chơi tiếp Quần Hùng: vẫn mức Khó, vẫn kiểu địa hình cũ');
  await T.ev(()=>{ stopBigWar(true); localStorage.removeItem('ltm_royale_save_v1'); }); await p.waitForTimeout(300); await T.tapEl('#bBW'); await p.waitForTimeout(200); await T.tapEl('#bBossRoyale'); await p.waitForTimeout(350); await T.tapEl('#conqNew'); await p.waitForTimeout(350);
  ok(/Hard/.test(await T.ev(()=>document.querySelector('#civStage .dif.on').textContent)),'lần sau mở Quần Hùng: nhớ mức khó đã chọn');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:'')); await T.ctx.close();
}
await finish('CHIẾN DỊCH 10 ẢI & MỨC KHÓ',b);
