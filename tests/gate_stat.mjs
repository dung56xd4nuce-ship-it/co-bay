// (5.8) 📈 bảng thống kê quân số góc dưới + xu thưởng còn ~15% — kiểm như người chơi trên Android / iOS ngang + dọc
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
const box=(T)=>T.ev(()=>{ const bw=__ltm.bw, r=bw._statBox; if(!r) return null; const R=bw.hudRects(), hits=[]; for(const k in R){ if(k==='bảng thống kê quân') continue; const q=R[k]; if(q.x<r.x+r.w&&q.x+q.w>r.x&&q.y<r.y+r.h&&q.y+q.h>r.y) hits.push(k); }
  return {r, inside:r.x>=0&&r.y>=0&&r.x+r.w<=bw.lastVw+0.5&&r.y+r.h<=bw.lastVh+0.5, hits, n:bw._st? bw._st.h.length : 0, every:bw._st&&bw._st.every, my:bwN(bw.myPower())}; });
for(const [dn,dev] of [...DEVICES, ...PORTRAIT]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; await T.ev(()=>{ save.ach={done:Object.fromEntries(BW_ACH.map(a=>[a.id,1])),title:null}; Save.set(save); });   /* (6.0) thành tựu đã mở hết: không chen xu thưởng vào phép đo */
  // 1) Đánh Boss 1v1
  await T.startBattle({seed:3},1); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro());
  await p.waitForTimeout(400); let s=await box(T);
  ok(!s||s.hits.includes('dòng hướng dẫn')===false,'9 giây đầu: bảng thống kê nhường chỗ cho dòng hướng dẫn');
  await T.ev(()=>{ const bw=__ltm.bw, U=Object.getPrototypeOf(bw).update; for(let i=0;i<20*60;i++) U.call(bw,0.05); });   /* chạy 60 giây giờ trận */
  await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro()); await p.waitForTimeout(500); await T.hookDraw(); await p.waitForTimeout(300); s=await box(T);
  ok(!!s&&s.inside,'1v1: bảng thống kê quân hiện ở góc dưới, gọn trong màn hình'+(s? ` (${Math.round(s.r.x)},${Math.round(s.r.y)} ${Math.round(s.r.w)}×${s.r.h})` : ''));
  ok(s&&s.r.y+s.r.h>await T.ev(()=>__ltm.bw.lastVh*0.75),'nằm ở phần dưới màn hình');
  ok(s&&s.hits.length===0,'không đè nút / bản đồ nhỏ / thông báo nào'+(s&&s.hits.length? ': '+s.hits.join(', ') : ''));
  ok(s&&s.n>=12,`biểu đồ có dữ liệu theo giờ trận (${s&&s.n} mẫu sau 60 giây)`);
  ok((await T.drawn('^'+Number(s.my).toLocaleString('en-US')+'$')).length>0,`hiện đúng tổng quân của ta (${s.my})`);
  ok((await T.drawn('YOUR TROOPS')).length>0,'có nhãn "YOUR TROOPS"');
  // cập nhật liên tục: thêm quân → số đổi ngay khung sau
  const before=s.my; await T.ev(()=>{ __ltm.bw.nodes[0].count+=500; }); await p.waitForTimeout(250); s=await box(T);
  ok(+s.my===+before+500&&(await T.drawn('^'+Number(s.my).toLocaleString('en-US')+'$')).length>0,`số trên bảng cập nhật liền (${before} → ${s.my})`);
  // menu lệnh mở → bảng ẩn (không che menu)
  await T.ev(()=>{ const bw=__ltm.bw; bw.menu={opts:[{id:'cancel',s:'Cancel'}],node:bw.nodes[0]}; }); await p.waitForTimeout(250);
  ok(!(await box(T)),'khi đang mở menu lệnh: bảng tạm ẩn'); await T.ev(()=>{ __ltm.bw.menu=null; });
  // ván dài: biểu đồ gộp mẫu, vẫn phủ trọn trận
  await T.ev(()=>{ const bw=__ltm.bw; for(let i=0;i<300;i++){ bw.time+=5; bw.statTick(); } });   /* giả 25 phút giờ trận */
  s=await box(T)||await T.ev(()=>({n:__ltm.bw._st.h.length,every:__ltm.bw._st.every}));
  ok(s.n<=240&&s.every>=10,`trận dài 26 phút: biểu đồ tự gộp mẫu (${s.n} mẫu, ${s.every}s/mẫu)`);
  // xu thưởng 1v1: còn ~15%
  const xu=await T.ev(()=>{ const bw=__ltm.bw; bw.stats.eat=4000; bw.stats.win=5; const x0=save.xu; bw.over=true; bw.result={win:true}; return x0; }); await T.vis('#result');
  const got=await T.ev(()=>save.xu), want=Math.round((4000/40+5*4+30+18*1)*0.15);
  const rx=await T.ev(()=>document.getElementById('rStats').textContent); ok(got-xu===want&&rx.includes('Coins earned: +'+want),`thắng ải 1: +${got-xu} xu (trước đây ${Math.round(4000/40+20+48)}, còn ~15%)`);
  // 2) Chinh phạt · Bộ lạc: số trên bảng theo cấp bộ lạc; lưu → mở lại → biểu đồ còn nguyên
  await T.ev(()=>{ G.bwCfg={royale:9,conq:'tribe',seed:44,civ:'rome',diff:1,bio:1,L:{camp:3000}}; startBigWar(5); __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); const bw=__ltm.bw, U=Object.getPrototypeOf(bw).update; for(let i=0;i<20*90;i++) U.call(bw,0.05); });
  await p.waitForTimeout(300); await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro()); await p.waitForTimeout(400); s=await box(T);
  ok(s&&+s.my>=15&&+s.my<=400&&s.hits.length===0,`Bộ lạc: bảng ghi ${s&&s.my} chiến binh (đúng cấp hiển thị), không đè gì`);
  const n0=s.n; await T.ev(()=>__ltm.royaleSave()); await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(300);
  await T.tapEl('#bBW'); await p.waitForTimeout(250); await T.tapEl('#bBossContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(600);
  ok(await T.ev((n0)=>!!__ltm.bw._st&&__ltm.bw._st.h.length>=n0,n0),'thoát → CONTINUE: biểu đồ quân số nối tiếp, không mất lịch sử');
  // xu giữa trận Quần Hùng/Chinh phạt: chiếm kinh đô một phe → +6 (trước đây 40)
  const c0=await T.ev(()=>{ const bw=__ltm.bw, F=bw.localFid, x0=save.xu, v=bw.nodes.find(n=>n.camp&&n.owner!==F&&n.owner!==2); const prev=v.owner; v.owner=F; bw.checkCamp(v,F,prev); return save.xu-x0; });
  ok(c0===6,`chiếm kinh đô cuối của một phe: +${c0} xu (trước đây 40)`);
  ok(await T.ev(()=>BW.coinsFor.camp===2&&BW.coinsFor.capital===3&&BW.coinsFor.survive===2),'xu giữa trận: trại 2 · kinh đô 3 · giữ nước 10 phút 2');
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length? ': '+T.errs.slice(0,3).join(' | ') : ''));
  await T.ctx.close(); }
await finish('Thống kê quân số + xu 15%',b);
