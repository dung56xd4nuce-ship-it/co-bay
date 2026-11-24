// LUỒNG NGƯỜI CHƠI quanh trận đấu: vào trận, chơi lại, thoát, lưu/chơi tiếp, màn kết quả, băng "xoay ngang".
// Mỗi bước bấm bằng chạm thật vào nút đang hiện trên màn hình (bị che là báo lỗi).
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of DEVICES){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r;
  // --- 1v1: vào trận từ menu
  r=await T.tapEl('#bBW'); ok(r.ok,'menu: chạm được nút BATTLE '+(r.why||''));
  ok(await T.vis('#bossPick'),'hiện bảng chọn chế độ');
  r=await T.tapEl('#bBoss1v1'); ok(r.ok,'chạm được nút 1 vs 1 '+(r.why||'')); await p.waitForTimeout(400);
  ok(await T.vis('#campaign'),'1v1: hiện màn CHIẾN DỊCH 10 ải'); r=await T.tapEl('.stg.cur'); ok(r.ok,'chạm được thẻ ải đang tới '+(r.why||'')); await p.waitForTimeout(400);
  ok(await T.vis('#civPick'),'1v1: hiện màn CHỌN NƯỚC trước khi vào trận');
  r=await T.tapEl('#civGo'); ok(r.ok,'chạm được nút Start '+(r.why||'')); await p.waitForTimeout(600);
  ok(await T.ev(()=>!!__ltm.bw&&!__ltm.bw.royale),'vào trận 1v1');
  await T.ev(()=>{ __ltm.bw.skipIntro(); }); await p.waitForTimeout(300);
  // ↻ phải hỏi lại; Cancel giữ nguyên trận; Yes chơi lại đúng chế độ
  await T.ev(()=>{ window.__bw0=__ltm.bw; __ltm.bw.time=77; });
  r=await T.tapEl('#bwRetry'); ok(r.ok,'chạm được nút ↻ '+(r.why||'')); await p.waitForTimeout(200);
  ok(await T.vis('#ask'),'↻ hiện hộp hỏi lại (không mất trận vì chạm nhầm)');
  ok(await T.ev(()=>G.paused===true),'đang hỏi thì trận tạm dừng');
  r=await T.tapEl('#askN'); ok(r.ok,'chạm được Cancel'); await p.waitForTimeout(200);
  ok(await T.ev(()=>__ltm.bw===window.__bw0&&!G.paused)&&!(await T.visible('#ask')),'Cancel: giữ nguyên trận đang chơi, chạy tiếp');
  await T.tapEl('#bwRetry'); await p.waitForTimeout(150); await T.tapEl('#askY'); await p.waitForTimeout(400);
  ok(await T.ev(()=>__ltm.bw!==window.__bw0&&!__ltm.bw.royale&&__ltm.bw.time<5&&!G.paused),'Yes: chơi lại trận 1v1 mới');
  // 🏠 trong 1v1 phải hỏi lại
  await T.ev(()=>{ __ltm.bw.skipIntro(); }); r=await T.tapEl('#bwBack'); await p.waitForTimeout(200);
  ok(await T.vis('#ask'),'🏠 trong 1v1 hỏi lại trước khi bỏ trận');
  await T.tapEl('#askY'); await p.waitForTimeout(300);
  ok(await T.vis('#menu')&&await T.ev(()=>!__ltm.bw),'Leave: về menu');
  // --- Quần Hùng: ↻ phải chơi lại ĐÚNG Quần Hùng (trước đây biến thành ải 1v1)
  await T.ev(()=>localStorage.removeItem('ltm_royale_save_v1'));
  await T.tapEl('#bBW'); await p.waitForTimeout(150); r=await T.tapEl('#bBossRoyale'); ok(r.ok,'chạm được nút WARLORDS '+(r.why||'')); await p.waitForTimeout(400);
  ok(await T.vis('#civPick'),'Quần Hùng: hiện màn CHỌN NƯỚC'); await T.tapEl('#civGo'); await p.waitForTimeout(1100);
  ok(await T.ev(()=>!!__ltm.bw&&__ltm.bw.royale===true),'vào ván Quần Hùng');
  await T.ev(()=>{ __ltm.bw.skipIntro(); window.__bw0=__ltm.bw; }); await p.waitForTimeout(200);
  await T.tapEl('#bwRetry'); await p.waitForTimeout(150); ok(await T.vis('#ask'),'↻ Quần Hùng hỏi lại');
  await T.tapEl('#askY'); await p.waitForTimeout(900);
  ok(await T.ev(()=>__ltm.bw!==window.__bw0&&__ltm.bw.royale===true&&__ltm.bw.nodes.filter(n=>n.camp).length>30&&__ltm.bw.cfg.civ===window.__bw0.cfg.civ),'↻ Quần Hùng → vẫn là Quần Hùng (37 nước), vẫn nước đã chọn');
  // 🏠 Quần Hùng: không hỏi (đã tự lưu), về menu, có bản lưu
  await T.ev(()=>{ __ltm.bw.skipIntro(); __ltm.bw.time=321; }); await T.tapEl('#bwBack'); await p.waitForTimeout(400);
  ok(await T.vis('#menu')&&await T.ev(()=>!!localStorage.getItem('ltm_royale_save_v1')),'🏠 Quần Hùng: về menu và ĐÃ LƯU ván');
  // chọn "Warlords mới" khi đang có ván lưu → phải hỏi lại
  await T.tapEl('#bBW'); await p.waitForTimeout(200);
  ok(await T.vis('#bBossContinue'),'có nút CONTINUE WARLORDS');
  await T.tapEl('#bBossRoyale'); await p.waitForTimeout(200);
  ok(await T.vis('#ask')&&await T.ev(()=>!!localStorage.getItem('ltm_royale_save_v1')&&!__ltm.bw),'ván mới khi đang có ván lưu: hỏi lại, CHƯA xoá gì');
  await T.tapEl('#askN'); await p.waitForTimeout(200);
  r=await T.tapEl('#bBossContinue'); ok(r.ok,'chạm được CONTINUE '+(r.why||'')); await p.waitForTimeout(900);
  ok(await T.ev(()=>!!__ltm.bw&&__ltm.bw.royale&&Math.abs(__ltm.bw.time-321)<3),'CONTINUE: vào lại đúng ván đã lưu (đồng hồ 321s)');
  // ⏸ → Restart trong Quần Hùng cũng hỏi lại
  await T.ev(()=>{ __ltm.bw.skipIntro(); }); await T.tapEl('#bwPause'); await p.waitForTimeout(200);
  ok(await T.vis('#pause'),'⏸ hiện bảng tạm dừng'); await T.tapEl('#bRestart'); await p.waitForTimeout(200);
  ok(await T.vis('#ask'),'Restart trong bảng tạm dừng (Quần Hùng) hỏi lại'); await T.tapEl('#askN'); await p.waitForTimeout(150);
  await T.tapEl('#bResume'); await p.waitForTimeout(200); ok(await T.ev(()=>!G.paused)&&!(await T.visible('#pause')),'Resume: chạy tiếp');
  // màn kết quả Quần Hùng: không có "ải kế", "chơi lại" = ván Quần Hùng mới
  await T.ev(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:true}; }); await p.waitForTimeout(2200);
  ok(await T.vis('#result'),'hiện màn kết quả'); ok(!(await T.visible('#bNext')),'Quần Hùng thắng: không hiện "Next stage"');
  ok(/Warlords/i.test(await T.ev(()=>document.getElementById('bAgain').textContent)),'nút chơi lại ghi "New Warlords game"');
  r=await T.tapEl('#bAgain'); ok(r.ok,'chạm được nút chơi lại'); await p.waitForTimeout(900);
  ok(await T.ev(()=>!!__ltm.bw&&__ltm.bw.royale===true&&__ltm.bw.time<5),'→ ván Quần Hùng mới');
  // thắng ải → ải kế giữ nguyên nước đã chọn
  await T.ev(()=>{ G.bwCfg={map:4,civ:'japan'}; startBigWar(2); const bw=__ltm.bw; bw.skipIntro(); bw.over=true; bw.result={win:true}; }); await p.waitForTimeout(2200);
  await T.tapEl('#bNext'); await p.waitForTimeout(600);
  ok(await T.ev(()=>__ltm.bw.lv===3&&__ltm.bw.civOf(0).id==='japan'),'Next stage: sang ải 3, vẫn là Nhật Bản');
  // màn kết quả 1v1: chơi lại đúng ải, thắng thì có ải kế
  await T.ev(()=>{ G.bwCfg={map:4}; startBigWar(3); const bw=__ltm.bw; bw.skipIntro(); bw.over=true; bw.result={win:true}; }); await p.waitForTimeout(2200);
  ok(await T.vis('#bNext'),'1v1 thắng ải 3: có "Next stage"');
  await T.tapEl('#bAgain'); await p.waitForTimeout(500);
  ok(await T.ev(()=>__ltm.bw.lv===3&&__ltm.bw.cfg.map===4&&!__ltm.bw.royale),'Play again: đúng ải 3, đúng bản đồ');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
  await T.ctx.close(); }
for(const [dn,dev] of PORTRAIT){ console.log(dn);
  const T=await open(b,dev); const {p}=T;
  await T.startBattle({map:1},2); await p.waitForTimeout(500);
  ok(await T.vis('#rotate'),'màn dọc: đầu trận có băng nhắc xoay ngang');
  const ov=await T.ev(()=>{ const R=__ltm.bw.hudRects(), band=R['băng "xoay ngang"']; if(!band) return 'không thấy băng'; for(const k in R){ if(k===Object.keys(R).find(x=>/băng/.test(x))) continue; const a=R[k]; if(a.y+a.h>band.y+1) return k; } return ''; });
  ok(ov==='','không nút nào nằm dưới băng xoay ngang'+(ov? ' ('+ov+')':''));
  await p.waitForTimeout(6300);
  ok(!(await T.visible('#rotate')),'sau 6 giây băng tự ẩn, trả chỗ cho bản đồ');
  const low=await T.ev(()=>{ const bw=__ltm.bw, R=bw.hudRects(); return bw.lastVh-(R['nút 📣'].y+R['nút 📣'].h); });
  ok(low<=80,'nút 📣 hạ xuống sát đáy sau khi băng ẩn (cách đáy '+Math.round(low)+'px)');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
  await T.ctx.close(); }
await finish('LUỒNG NGƯỜI CHƠI',b);
