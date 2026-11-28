// (6.0) GÓI B + C như người chơi: 🎖️ Tướng lĩnh · 📅 Thử thách ngày/tuần · 🏆 Thành tựu & danh hiệu (Android / iOS ngang + iOS dọc)
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
const txt=(T,s)=>T.ev((s)=>{ const e=document.querySelector(s); return e? e.textContent : null; },s);
const tapIn=async(T,sel)=>{ await T.ev((s)=>{ const e=document.querySelector(s); if(e) e.scrollIntoView({block:'center'}); },sel); await T.p.waitForTimeout(150); return T.tapEl(sel); };
const menu=async(T)=>{ await T.ev(()=>{ if(G.bw) stopBigWar(false); ['result','gens','gear','forge','decor','chalScr','achScr','bossPick','campaign','conquest'].forEach(i=>document.getElementById(i).classList.add('hidden')); showScreen('menu'); setupMenus(); }); await T.p.waitForTimeout(200); };
const fin=async(T,win,t)=>{ await T.ev(({win,t})=>{ const bw=__ltm.bw; bw.time=t; bw.over=true; bw.result={win}; },{win,t}); await T.vis('#result'); await T.p.waitForTimeout(200); };
for(const [dn,dev] of [...DEVICES, PORTRAIT[1]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r, s;
  await T.ev(()=>{ save.xu=3000; save.bwMax=4; Save.set(save); refreshXu(); });
  // ---------- 🎖️ TƯỚNG CÓ THẬT (6.2) ----------
  // người chơi bản 6.0 đã có 2 tướng chung chung → mở game là được hoàn xu, có báo
  await T.ev(()=>{ save.gen={own:{vanguard:5,medic:0},on:['vanguard'],slot2:0}; save.xu=1000; Save.set(save); }); await p.reload(); await p.waitForFunction(()=>window.__ltm&&typeof save!=='undefined'); await p.waitForTimeout(2300);
  let seen=false; for(let k=0;k<45&&!seen;k++){ seen=await T.ev(()=>/refunded 🪙 510/.test(document.body.innerText)); if(!seen) await p.waitForTimeout(150); }
  s=await T.ev(()=>({xu:save.xu, own:Object.keys(save.gen.own).join()}));
  ok(s.xu>=1000+250+260&&s.own===''&&seen,`bản 6.0 → 6.2: 2 tướng cũ được hoàn 510 xu (số dư ${s.xu}, gồm cả thưởng thành tựu), có thông báo "refunded"`);
  await T.ev(()=>{ save.xu=3000; save.civ='rome'; Save.set(save); refreshXu(); });
  await T.tapEl('#bGear'); await p.waitForTimeout(300); r=await tapIn(T,'#gear [data-armtab="gens"]'); await p.waitForTimeout(300);
  ok(await T.ev(()=>/were refunded: 🪙 510 coins/.test(document.getElementById('genList').textContent)),'mở Generals lần đầu: thẻ báo đã hoàn 🪙 510 xu');
  s=await T.ev(()=>({nr:BW_HEROES_OF.rome.length, n:document.querySelectorAll('#genList [data-gen]').length, names:[...document.querySelectorAll('#genList [data-gen] .fn')].map(e=>e.textContent), sel:document.getElementById('genCiv').value, opt:document.getElementById('genCiv').options.length}));
  ok(r.ok&&await T.visible('#gens')&&s.sel==='rome'&&s.n===s.nr+2&&s.names.some(t=>/^Trajan/.test(t))&&s.opt===44,`Kho → "🎖️ Generals" mở đúng nước đang chọn (Rome): ${s.n-1} tướng có thật (Trajan, …) + ô thứ 2; ô chọn có đủ ${s.opt} nước`);
  ok(await T.ev(()=>BW_CIVS.every(c=>{ const n=(BW_HEROES_OF[c.id]||[]).length; return n===1||(n>=5&&n<=8); })),'mọi nền văn minh đều có tướng: 5–8 vị, nơi ít sử liệu 1 vị');
  ok(await T.ev(()=>[...document.querySelectorAll('#genList .gport')].every(i=>i.complete&&i.naturalWidth>0)&&!!document.querySelector('#genList [data-gen="rome.trajan"] .ghist')),'mỗi tướng có chân dung và một dòng sử');
  ok(await T.ev(()=>BW_CIVS.every(c=>!!ART65['gen:'+BW_HEROES_OF[c.id][0].id]&&!!ArtImages['gen:'+BW_HEROES_OF[c.id][0].id])&&['horn','sandbag','drum','banner','caltrops'].every(k=>!!ART65['item:'+k])),'(6.5) 44 tướng huyền thoại có chân dung vẽ riêng, 5 món quân nhu mới có ảnh vẽ riêng');
  // đổi nước bằng ô chọn
  await tapIn(T,'#genCiv'); await p.selectOption('#genCiv','daiviet'); await p.waitForTimeout(300);
  s=await T.ev(()=>[...document.querySelectorAll('#genList [data-gen]:not([data-gen="refund"]) .fn')].map(e=>e.textContent));
  ok(s.length===8&&/^Trần Hưng Đạo/.test(s[1])&&/Legend/.test(s[1]),`chọn Đại Việt: 7 tướng nhà Trần, đứng đầu là Trần Hưng Đạo (huyền thoại)`);
  await p.selectOption('#genCiv','khmer'); await p.waitForTimeout(300);
  ok(await T.ev(()=>document.querySelectorAll('#genList [data-gen]').length===2&&/Jayavarman VII/.test(document.getElementById('genList').textContent)),'Khmer (ít sử liệu): 1 tướng — Jayavarman VII');
  await p.selectOption('#genCiv','rome'); await p.waitForTimeout(300);
  const x0=await T.ev(()=>save.xu); r=await tapIn(T,'#genList [data-genbtn="rome.domitius-corbulo"]'); await p.waitForTimeout(250);
  s=await T.ev(()=>({g:save.gen, xu:save.xu, cost:BW_HERO['rome.domitius-corbulo'].cost, slots:document.getElementById('genSlots').textContent}));
  ok(r.ok&&s.g.own['rome.domitius-corbulo']===0&&s.g.on.rome[0]==='rome.domitius-corbulo'&&x0-s.xu===s.cost-10&&/1\/1/.test(s.slots),`chiêu mộ Corbulo (Field medic): −${s.cost} xu (+10 xu thành tựu “First Officer”), tự mang theo cùng Rome (1/1)`);
  r=await tapIn(T,'#genList [data-genbtn="rome.trajan"]'); await p.waitForTimeout(250);
  ok(await T.ev(()=>save.gen.own['rome.trajan']===0&&BW_HERO['rome.trajan'].cost===300&&save.gen.on.rome.join()==='rome.domitius-corbulo'),'chiêu mộ Trajan (huyền thoại, 300 xu): đã có nhưng chưa thay (chỉ 1 ô)');
  r=await tapIn(T,'#genList [data-genbtn="rome.trajan"]'); await p.waitForTimeout(250);
  ok(await T.ev(()=>save.gen.on.rome.join()==='rome.trajan'),'bấm "Bring" Trajan: thay Corbulo');
  r=await tapIn(T,'#genList [data-genbuy="slot2"]'); await p.waitForTimeout(250); r=await tapIn(T,'#genList [data-genbtn="rome.domitius-corbulo"]'); await p.waitForTimeout(250);
  ok(await T.ev(()=>save.gen.slot2===1&&save.gen.on.rome.length===2&&/2\/2/.test(document.getElementById('genSlots').textContent)),'mở ô thứ 2 (400 xu): mang cả Trajan + Corbulo');
  // hiệu lực từng tài năng (lấy một tướng bất kỳ mang tài năng đó)
  const ef=await T.ev(()=>{ const hero=(k)=>BW_HEROES.find(h=>h.skill===k).id, mk=(gl)=>{ const w=new BigWar(3,{civ:'rome',seed:9,map:6}); w.genSetup(gl); return w; }, b0=mk([]), out={};
    for(const D of BW_GENERALS){ const w=mk([{id:hero(D.id),lv:1}]); const a={owner:0,type:'spear',count:500,x:w.nodes[0].x,y:w.nodes[0].y}, n=w.nodes.find(n=>n.owner===0);
      out[D.id]={spd:w.mvSpeed(a,w.mvProfile(a))/b0.mvSpeed(a,b0.mvProfile(a)), def:w.defMul(n)/b0.defMul(n), vis:w.visR/b0.visR, grow:w.L.grow/b0.L.grow, coin:(w._coinK||1), prof:w.mvProfile(a), prof0:b0.mvProfile(a)}; }
    const w=mk([{id:hero('guide'),lv:3}]), a={owner:0,type:'spear',count:500,x:0,y:0}; out.guide3=w.mvProfile(a);
    const w2=mk(BW_HEROES.filter(h=>h.skill==='guide').slice(0,2).map(h=>({id:h.id,lv:1}))); out.guide2=w2.mvProfile(a);
    const p2=new BigWar(3,{civ:'rome',seed:9,map:6,p2p:true}); p2.genSetup([{id:'rome.trajan',lv:5}]); out.p2p=p2.gens.length; return out; });
  const n=(a,b2)=>Math.abs(a-b2)<0.005;
  ok(n(ef.rider.spd,1.06)&&n(ef.warden.def,1.08)&&n(ef.ranger.vis,1.15)&&n(ef.recruiter.grow,1.08)&&n(ef.treasurer.coin,1.15),'tài năng có hiệu lực: March +6% · Defence +8% · Sight +15% · Recruiting +8% · Treasury +15% xu');
  ok(/f/.test(ef.guide.prof)&&ef.guide.prof!==ef.guide.prof0&&/fm/.test(ef.guide3)&&!/m/.test(ef.guide2),`Pathfinder: cấp 1 đi rừng, cấp 3 cả núi; hai tướng cấp 1 không cộng thành cấp 3`);
  ok(ef.p2p===0,'P2P: tướng không vào trận (hai người ngang nhau)');
  const lv=await T.ev(()=>[1,2,3,4,5].map(l=>BW_GEN_BY.vanguard.val(l)).map(v=>Math.round(v*100)).join(',')); ok(lv==='5,7,9,11,13','tướng Attack mạnh dần theo cấp: +5% → +13% sát thương');
  // chơi nước khác: tướng Rome không đi theo
  await menu(T); await T.ev(()=>{ G.bwCfg={civ:'japan'}; startBigWar(3); __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); }); await p.waitForTimeout(500);
  ok(await T.ev(()=>__ltm.bw.gens.length===0),'chơi Nhật Bản: tướng của Rome không ra trận');
  // vào trận thật với Rome
  await menu(T); await T.ev(()=>{ G.bwCfg={civ:'rome'}; startBigWar(3); __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); }); await p.waitForTimeout(600);
  s=await T.ev(()=>({g:__ltm.bw.gens.map(x=>x.id).join(), notes:(__ltm.bw.notes||[]).map(x=>x.text||x.s||'').join(' | ')}));
  ok(s.g==='rome.trajan,rome.domitius-corbulo'&&/Trajan \(Lv 1\).*Domitius Corbulo \(Lv 1\) ride with you/.test(s.notes),'chơi Rome: Trajan + Corbulo đi cùng, có dòng "… ride with you"');
  const heal=await T.ev(()=>{ const bw=__ltm.bw; const a={owner:0,type:'spear',count:1000,x:300,y:700,food:100,done:false}; const e={owner:1,type:'spear',count:0,x:300,y:700,food:0,done:false}; bw.armies.push(a,e);
    const b2={A:{fid:0,mul:1,es:[{kind:'army',ref:a}]},B:{fid:1,mul:1,es:[{kind:'army',ref:e}]},lostP:400,kind:'field',nodeId:-1,x:300,y:700,ter:'plain',id:777};
    try{ bw.bEnd(b2,b2.A,b2.B); }catch(err){ return 'err '+err.message; } return Math.round(a.count); });
  ok(heal===1040,`Corbulo (Field medic): thắng trận mất 400 quân → cứu lại ${typeof heal==='number'? heal-1000 : heal} (10%)`);
  const atk=await T.ev(()=>{ const bw=__ltm.bw, a={owner:0,type:'spear',count:800,x:900,y:700,food:100}, e={owner:1,type:'spear',count:800,x:910,y:700,food:100}; bw.armies.push(a,e); const b2=bw.startBattle(900,700,'plain',-1,{fid:0,e:{kind:'army',ref:a}},{fid:1,e:{kind:'army',ref:e}},1); return b2? b2.A.mul : null; });
  ok(atk!=null&&Math.abs(atk-1.05)<1e-6,`Trajan (Attack): phe ta vào trận với sức đánh ×${atk}`);
  await fin(T,true,400);
  s=await T.ev(()=>({own:save.gen.own}));
  ok(s.own['rome.trajan']===3&&s.own['rome.domitius-corbulo']===3,'thắng trận: mỗi tướng +3 kinh nghiệm');
  await T.tapEl('#bAgain'); await p.waitForTimeout(800); await fin(T,true,400);
  ok(/Trajan reached level 2/.test(await txt(T,'#rStats'))&&/Domitius Corbulo reached level 2/.test(await txt(T,'#rStats')),'thắng trận thứ 2: báo hai tướng lên cấp 2');
  await T.tapEl('#bAgain'); await p.waitForTimeout(800); await fin(T,false,200);
  ok(await T.ev(()=>save.gen.own['rome.trajan']===7),'thua trận: +1 kinh nghiệm');
  await menu(T); await T.tapEl('#bGear'); await p.waitForTimeout(250); await T.tapEl('#gear [data-armtab="gens"]'); await p.waitForTimeout(300);
  { const t=await txt(T,'#genList [data-gen="rome.trajan"]'); ok(/Lv 2/.test(t)&&/XP 7 \/ 12/.test(t)&&/Lv 3:/.test(t),'thẻ tướng: "Lv 2", "XP 7 / 12", ghi hiệu lực cấp kế'); }
  // ---------- 📅 THỬ THÁCH ----------
  await menu(T); await T.ev(()=>{ localStorage.setItem(SSAVE,JSON.stringify({v:1,lv:2,cfg:{civ:'rome'},sc:{time:77}})); save.conq={civ:'rome',diff:1,stage:1,best:{}}; Save.set(save); window.__rs=localStorage.getItem(RSAVE); });
  await T.tapEl('#bBW'); await p.waitForTimeout(250); r=await T.tapEl('#bChal'); await p.waitForTimeout(400);
  const dk=await T.ev(()=>chalDayKey());
  ok(r.ok&&await T.visible('#chalScr')&&await T.ev(()=>document.querySelectorAll('#chalList [data-chal]').length===2),'BATTLE → "📅 Daily & weekly challenges": thẻ ngày + thẻ tuần');
  ok(await T.ev(()=>{ const a=BW.chalCfg('d',20261126), b2=BW.chalCfg('d',20261126), c=BW.chalCfg('d',20261127); return JSON.stringify(a)===JSON.stringify(b2)&&JSON.stringify(a)!==JSON.stringify(c); }),'cùng ngày → cùng trận; ngày khác → trận khác');
  r=await T.tapEl('#chalList [data-chal="d"]'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(400);
  s=await T.ev((dk)=>{ const X=BW.chalCfg('d',dk), bw=__ltm.bw; return {ok:bw.chal==='d'&&bw.lv===X.lv&&bw.cfg.civ===X.cfg.civ&&JSON.stringify(bw.cfg.mut)===JSON.stringify(X.cfg.mut), intro:document.getElementById('siTop').textContent}; },dk);
  ok(s.ok&&/DAILY CHALLENGE/.test(s.intro)&&/12:00/.test(s.intro),'vào trận thử thách ngày: đúng ải, đúng nước, đúng luật; băng giới thiệu "📅 DAILY CHALLENGE · 🎯 WIN WITHIN 12:00"');
  ok(await T.ev(()=>__ltm.royaleSave()===false&&JSON.parse(localStorage.getItem(SSAVE)).sc.time===77),'trận thử thách không tự lưu, ván chiến dịch đang lưu còn nguyên');
  await T.ev((dk)=>{ const C=chalState(); C.last=chalPrevDay(dk); C.streak=3; Save.set(save); },dk);
  const xa=await T.ev(()=>save.xu); await fin(T,true,600);
  s=await T.ev(()=>({st:document.getElementById('rStage').textContent, xu:save.xu, C:save.chal, next:!document.getElementById('bNext').classList.contains('hidden'), again:document.getElementById('bAgain').textContent}));
  ok(/CHALLENGE COMPLETE/.test(s.st)&&/\+30 coins/.test(s.st)&&/4-day streak \+15/.test(s.st)&&s.C.streak===4&&s.C.done===1,'thắng trong 12 phút: "CHALLENGE COMPLETE", +15 xu + chuỗi 4 ngày +15');
  ok(!s.next&&/Retry challenge/.test(s.again),'màn kết quả: không có "Next stage", có "↻ Retry challenge"');
  ok(await T.ev(()=>(save.bwMax|0)===4&&!(save.camp&&save.camp.best&&save.camp.best[BW.chalCfg('d',chalDayKey()).lv]===600)),'thắng thử thách không làm thay đổi tiến trình chiến dịch');
  await T.tapEl('#bAgain'); await p.waitForTimeout(800); const xb=await T.ev(()=>save.xu); await fin(T,true,500);
  s=await T.ev(()=>({st:document.getElementById('rStage').textContent, d:save.xu-0}));
  ok(/already done/.test(s.st)&&/08:20/.test(s.st),'chơi lại trong ngày: "already done", ghi thời gian tốt nhất mới 08:20');
  await T.tapEl('#bAgain'); await p.waitForTimeout(800); await fin(T,true,900);
  ok(/Too slow/.test(await txt(T,'#rStage')),'thắng quá 12 phút: "Too slow", không thưởng');
  // tuần: bộ lạc, không đụng ván chinh phạt
  await menu(T); await T.tapEl('#bBW'); await p.waitForTimeout(250); await T.tapEl('#bChal'); await p.waitForTimeout(300);
  ok(/✔ Done/.test(await txt(T,'#chalList [data-chal="d"]'))&&/Streak 4/.test(await txt(T,'#chalProg')),'thẻ ngày: "✔ Done" + thời gian; đầu màn ghi "🔥 Streak 4"');
  await T.tapEl('#chalList [data-chal="w"]'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.conq==='tribe'&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(300);
  ok(await T.ev(()=>__ltm.bw.chal==='w'&&__ltm.bw.cfg.mut.length===2&&__ltm.royaleSave()===false),'thử thách tuần: bản đồ Bộ lạc, 2 luật đặc biệt, không tự lưu');
  const xw=await T.ev(()=>save.xu); await fin(T,true,1000);
  s=await T.ev(()=>({st:document.getElementById('rStage').textContent, cq:save.conq.stage, rs:localStorage.getItem(RSAVE)===window.__rs, w:save.chal.wdone}));
  ok(/Weekly challenge complete! \+60/.test(s.st)&&s.w===1,'thắng tuần trong 20 phút: +60 xu');
  ok(s.cq===1&&s.rs,'không đụng tiến trình Chinh phạt và ván Chinh phạt đang lưu');
  // ---------- 🏆 THÀNH TỰU ----------
  await menu(T); r=await T.tapEl('#bAch'); await p.waitForTimeout(400);
  s=await T.ev(()=>({n:document.querySelectorAll('#achGrid .ach').length, on:document.querySelectorAll('#achGrid .ach.on').length, prog:document.getElementById('achProg').textContent, done:Object.keys(save.ach.done)}));
  ok(r.ok&&s.n===40&&/\/40 unlocked/.test(s.prog),`màn "🏆 Achievements": 40 thành tựu, đã mở ${s.on}`);
  ok(['c1','gen1','slot2','dly1','wk1'].every(id=>s.done.includes(id)),'đã tự mở: First Blood, First Officer, Twin Banners, Daily Duty, Weekend Warrior');
  ok(await T.ev(()=>save.lt&&save.lt.games>=5&&save.lt.wins>=4),'thống kê trọn đời cập nhật sau mỗi trận');
  await T.ev(()=>{ save.lt.amb=9; Save.set(save); G.bwCfg={civ:'rome'}; startBigWar(2); __ltm.bw.stats.amb=1; }); await p.waitForTimeout(400); await fin(T,true,300);
  ok(/Hidden Blade \+20 coins/.test(await txt(T,'#rStats')),'phục kích thắng lần thứ 10: màn kết quả báo "🏆 Hidden Blade +20 coins"');
  await menu(T); await T.ev(()=>{ save.bwMax=11; Save.set(save); }); await T.tapEl('#bAch'); await p.waitForTimeout(400);
  r=await T.tapEl('#achTitles [data-title="War Sage"]'); await p.waitForTimeout(200);
  ok(r.ok&&await T.ev(()=>save.ach.title==='War Sage'),'mở danh hiệu "War Sage" và chọn được');
  await T.tapEl('#achBack'); await p.waitForTimeout(300);
  ok(/War Sage/.test(await txt(T,'#menuTitle'))&&await T.visible('#menuTitle'),'màn chính hiện danh hiệu "🏅 War Sage"');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length? ': '+T.errs.slice(0,3).join(' | ') : ''));
  await T.ctx.close(); }
await finish('Tướng lĩnh · Thử thách · Thành tựu',b);
