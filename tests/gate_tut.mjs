// (5.5) HƯỚNG DẪN LẦN ĐẦU + TRANG TRÍ TRẠI + ẨN ART PACK — như người chơi mới cài game, mọi bước bằng chạm thật.
globalThis.__LTM_TUT_TEST=true;   /* bài thử này kiểm chính phần hướng dẫn lần đầu: không cho tệp nạp trước đánh dấu 'đã học' */
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch(); const SHOT=process.env.SHOT;
for(const [dn,dev] of [...DEVICES, PORTRAIT[1], ['Android nhỏ ngang 640×360',{viewport:{width:640,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:DEVICES[0][1].userAgent}]]){ console.log(dn);
  const T=await open(b,dev,{tut:true}); const {p}=T; const tag=dn.replace(/[^a-zA-Z0-9]+/g,'').slice(0,14); const txt=(s)=>T.ev((s)=>{ const e=document.querySelector(s); return e? e.textContent : null; },s);
  const step=()=>T.ev(()=>__ltm.bw&&__ltm.bw.tut? __ltm.bw.tut.step : -1), key=()=>T.ev(()=>BW.TUT[__ltm.bw.tut.step].k);
  const focus=()=>T.until(()=>{ const bw=__ltm.bw; if(bw.jumpT) return null; const f=bw.tutFocus(); if(!f) return null; return f.rect? {x:f.rect.x+f.rect.w/2,y:f.rect.y+f.rect.h/2,rect:true} : {x:f.x,y:f.y,r:f.r,in:f.x>20&&f.y>50&&f.x<bw.lastVw-20&&f.y<bw.lastVh-20}; },null,5000);
  const waitStep=(n,ms=9000)=>T.until((n)=>__ltm.bw&&__ltm.bw.tut&&__ltm.bw.tut.step>=n,n,ms);
  ok(!(await T.visible('#bArt')),'nút "Art pack" đã ẩn khỏi menu');
  // ---- bấm BATTLE lần đầu → vào thẳng trận hướng dẫn
  await T.tapEl('#bBW'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.tut&&__ltm.bw.lastVw>0,null,{timeout:15000}); await p.waitForTimeout(900); await T.hookDraw&&T.hookDraw();
  ok(await step()===0&&!(await T.visible('#bossPick')),'lần đầu bấm BATTLE: vào thẳng trận HƯỚNG DẪN (chưa hiện bảng chọn chế độ)');
  ok((await T.drawn(/TUTORIAL · 1\/9/)).length>=1&&(await T.drawn(/TAP it to select/)).length>=1,'thấy khung ghi chú "TUTORIAL · 1/9 … TAP it to select it"');
  let f=await focus(); ok(f&&f.in,'đồn cần chạm nằm trong màn hình, có vòng sáng'); if(SHOT) await p.screenshot({path:`/tmp/shots/t-${tag}-1.png`});
  // khoá thao tác: chạm chỗ khác, chạm nút 📣, chạm 🎒 → không có gì xảy ra
  const lock=await T.ev(()=>{ const bw=__ltm.bw, r=bw._rallyBtn, g=bw._gearBtn; return {r:r?[r.x+r.w/2,r.y+r.h/2]:null,g:g?[g.x+g.w/2,g.y+g.h/2]:null,vw:bw.lastVw,vh:bw.lastVh}; });
  if(lock.r) await T.tap(lock.r[0],lock.r[1]); if(lock.g) await T.tap(lock.g[0],lock.g[1]); await T.tap(lock.vw*0.12,lock.vh*0.55); await p.waitForTimeout(300);
  ok(await T.ev(()=>{ const bw=__ltm.bw; return bw.tut.step===0&&!bw.rallyOpen&&!bw.gearOpen&&!bw.sel&&!bw.menu&&!bw.armies.length; }),'KHOÁ: chạm 📣, 🎒 hay chỗ khác trên bản đồ đều không làm gì — chỉ được làm đúng việc đang hướng dẫn');
  // ---- A: chọn đồn (chạm hơi lệch tâm vẫn nhận)
  await T.tap(f.x+14,f.y-10); ok(await waitStep(1)&&await key()==='tgt','bước 1: chạm đồn của mình → sang bước 2');
  f=await focus(); ok(f&&f.in,'đồn trung lập cần chạm nằm trong màn hình'); await T.tap(f.x,f.y); ok(await waitStep(2)&&await key()==='go','bước 2: chạm đồn xám → hiện menu lệnh, sang bước 3');
  await p.waitForTimeout(350); f=await focus(); if(SHOT) await p.screenshot({path:`/tmp/shots/t-${tag}-3.png`});
  // khoá menu: chạm ô ½ hoặc Cancel không được; chỉ dòng lệnh được sáng
  const other=await T.ev(()=>{ const R=__ltm.bw._menuRects||[], q=R.find(r=>r.id==='cancel')||R.find(r=>r.sel); return q? [q.x+q.w/2,q.y+q.h/2] : null; }); if(other){ await T.tap(other[0],other[1]); await p.waitForTimeout(250); }
  ok(await T.ev(()=>!!__ltm.bw.menu&&__ltm.bw.tut.step===2&&!__ltm.bw.armies.length),'KHOÁ: trong menu chỉ dòng lệnh đang sáng là bấm được');
  ok(f&&f.rect,'dòng lệnh cần bấm được khoanh sáng'); await T.tap(f.x,f.y); ok(await waitStep(3)&&await key()==='wait','bước 3: bấm lệnh → quân lên đường, sang bước 4 (xem quân đi)');
  ok(await waitStep(4,40000)&&await T.ev(()=>{ const U=__ltm.bw.tut; return U.T1.owner===0&&U.T1.count>=600; }),'bước 4: quân tới nơi, đồn xám theo ta → sang bước 5');
  f=await focus(); await T.tap(f.x,f.y); ok(await waitStep(5),'bước 5: chọn đồn mới');
  f=await focus(); ok(f&&f.in,'đồn địch cần chạm nằm trong màn hình'); await T.tap(f.x,f.y); ok(await waitStep(6),'bước 6: chạm đồn đỏ của địch → menu'); await p.waitForTimeout(350);
  f=await focus(); await T.tap(f.x,f.y); ok(await waitStep(7),'bước 7: bấm Attack → giao tranh');
  ok(await waitStep(8,60000)&&await T.ev(()=>__ltm.bw.tut.T2.owner===0),'bước 8: thắng trận, chiếm đồn địch → bước cuối (tóm tắt)');
  await p.waitForTimeout(400); if(SHOT) await p.screenshot({path:`/tmp/shots/t-${tag}-9.png`});
  const okR=await T.ev(()=>{ const r=__ltm.bw.tut.okR, bw=__ltm.bw; return r? {x:r.x+r.w/2,y:r.y+r.h/2,in:r.x>=0&&r.y>=0&&r.x+r.w<=bw.lastVw&&r.y+r.h<=bw.lastVh} : null; });
  ok(okR&&okR.in&&(await T.drawn(/To win a stage/)).length>=1,'bước cuối: tóm tắt mục tiêu + nút "Got it ▶" nằm trong màn hình');
  await T.tap(okR.x,okR.y); await p.waitForSelector('#tutDone:not(.hidden)',{timeout:5000}).catch(()=>{}); await p.waitForTimeout(300);
  const sv=await T.ev(()=>({tut:localStorage.getItem('ltm_tut'),xu:JSON.parse(localStorage.ltm_save).xu,bw:!!__ltm.bw,solo:localStorage.getItem('ltm_solo_save_v1')}));
  if(!(sv.tut==='1'&&sv.xu===50&&!sv.bw&&!sv.solo&&await T.visible('#tutDone'))) console.log('   [chẩn đoán]',JSON.stringify(sv),await T.visible('#tutDone'),await txt('#tdText'));
  ok(await T.visible('#tutDone')&&sv.tut==='1'&&sv.xu===50&&!sv.bw&&!sv.solo&&/50 coins/.test(await txt('#tdText')),'xong hướng dẫn: thẻ "Tutorial complete!", thưởng 50 xu, không để lại ván lưu');
  if(SHOT) await p.screenshot({path:`/tmp/shots/t-${tag}-done.png`});
  await p.waitForTimeout(400); await T.tapEl('#tdGo'); await p.waitForTimeout(350); ok(await T.visible('#campaign'),'nút "Start Stage 1" → màn chiến dịch');
  await T.tapEl('#campBack'); await p.waitForTimeout(250); await T.ev(()=>{ document.getElementById('bossPick').classList.add('hidden'); showScreen('menu'); }); await p.waitForTimeout(200);
  await T.tapEl('#bBW'); await p.waitForTimeout(350); ok(await T.visible('#bossPick')&&await T.ev(()=>!__ltm.bw),'lần sau bấm BATTLE: vào bảng chọn chế độ như thường (không bắt học lại)');
  // ---- chơi lại hướng dẫn từ How to play + nút Skip
  await T.ev(()=>{ document.getElementById('bossPick').classList.add('hidden'); showScreen('help'); }); await p.waitForTimeout(250); await T.tapEl('#bTut'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.tut&&__ltm.bw.lastVw>0); await p.waitForTimeout(700);
  const sk=await T.until(()=>{ const r=__ltm.bw.tut.skipR; return r? [r.x+r.w/2,r.y+r.h/2] : null; },null,3000); await T.tap(sk[0],sk[1]); await p.waitForSelector('#tutDone:not(.hidden)',{timeout:5000}).catch(()=>{});
  await p.waitForTimeout(400);
  ok(await T.visible('#tutDone')&&/skipped/.test(await txt('#tdTitle'))&&await T.ev(()=>JSON.parse(localStorage.ltm_save).xu===50),'How to play → "Play the tutorial battle" chơi lại được; bấm Skip thoát ngay, không thưởng xu lần hai');
  await T.tapEl('#tdMenu'); await p.waitForTimeout(250);
  // ---- 🏮 trang trí trại
  await T.ev(()=>{ save.xu=400; Save.set(save); openGear(); }); await p.waitForTimeout(250); await T.tapEl('#bToDecor'); await p.waitForTimeout(350);
  const dcn=await T.ev(()=>({shown:document.querySelectorAll('#decList .fcard').length,avail:BW_DECOR.filter(BW.decorAvail).length,all:BW_DECOR.length,img:document.querySelectorAll('#decList .fcard .fi img').length,costs:[...document.querySelectorAll('#decList [data-dec]')].map(b=>BW_DECOR_BY[b.dataset.dec].cost)}));
  ok(await T.visible('#decor')&&dcn.shown===dcn.avail&&dcn.shown>=21&&dcn.costs.every((c,i)=>i===0||c>=dcn.costs[i-1]),`Armory → "🏮 Camp decor": ${dcn.shown} món (đủ mọi món đã có ảnh), xếp từ rẻ tới đắt`);
  ok(dcn.img>=9,`thẻ của các món do ChatGPT vẽ hiện đúng ảnh món đó (${dcn.img} thẻ có ảnh)`);
  ok(await T.ev(()=>{ const c=document.querySelector('#decor .card').getBoundingClientRect(); return c.top>=-1&&c.left>=-1&&c.right<=innerWidth+1&&c.bottom<=innerHeight+1; }),'màn trang trí nằm gọn trong màn hình');
  const ink=()=>T.ev(()=>{ const cv=document.getElementById('decPrev'), d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; let n=0; for(let i=3;i<d.length;i+=16) if(d[i]>40) n++; return n; });
  const tapDec=async(id)=>{ await T.ev((id)=>document.querySelector(`#decList [data-dec="${id}"]`).scrollIntoView({block:'center'}),id); await p.waitForTimeout(350); const r=await T.tapEl(`#decList [data-dec="${id}"]`); await p.waitForTimeout(350); return r; };
  const ink0=await ink(); let r=await tapDec('lanterns');
  let ds=await T.ev(()=>({xu:save.xu,own:!!save.decor.own.lanterns,on:save.decor.on.join(),label:document.querySelector('#decList [data-dec="lanterns"]').textContent}));
  ok(r.ok&&ds.xu===310&&ds.own&&ds.on==='lanterns'&&/On/.test(ds.label),'mua "Festival Lanterns" 90 xu: trừ xu, tự bật, nút đổi thành "✔ On"');
  const ink1=await ink(); ok(ink1>ink0*1.15,`bản xem trước hiện thêm đèn lồng quanh lều (điểm vẽ ${ink0} → ${ink1})`);
  r=await tapDec('dragon'); ok(r.ok,'cuộn tới món cuối danh sách và chạm được '+(r.why||'')); await tapDec('lanterns');
  ds=await T.ev(()=>({xu:save.xu,on:save.decor.on.join(),dis:document.querySelector('#decList [data-dec="fireworks"]').disabled&&document.querySelector('#decList [data-dec="dragonstatue"]').disabled,cheap:!document.querySelector('#decList [data-dec="bunting"]').disabled}));
  ok(ds.xu===50&&ds.on==='dragon'&&ds.dis&&ds.cheap,'mua thêm cờ rồng (260), tắt đèn lồng: còn 50 xu — món đắt hơn bị khoá nút mua, món 50 xu vẫn mua được');
  if(SHOT){ await tapDec('lanterns'); await p.waitForTimeout(300); await p.screenshot({path:`/tmp/shots/t-${tag}-decor.png`}); await tapDec('lanterns'); }
  // vào trận: trại của ta có đồ trang trí; tải lại trang vẫn còn
  await p.reload(); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(300);
  await T.ev(()=>{ window.__dc=[]; const o=BW.drawDecor; BW.drawDecor=function(c,x,y,ids,t,l){ window.__dc.push([Math.round(x),Math.round(y),ids.join(),l]); return o.apply(this,arguments); }; G.bwCfg={civ:'rome',map:0}; startBigWar(1); __ltm.bw.intro=null; }); await p.waitForFunction(()=>__ltm.bw.lastVw>0); await p.waitForTimeout(800);
  const dc=await T.ev(()=>{ const bw=__ltm.bw, c0=bw.nodes.find(n=>n.camp&&n.owner===0), ec=bw.nodes.find(n=>n.camp&&n.owner===1); return {mine:window.__dc.filter(q=>q[0]===Math.round(c0.x)&&q[2]==='dragon').length,layers:new Set(window.__dc.map(q=>q[3])).size,enemy:window.__dc.filter(q=>q[0]===Math.round(ec.x)).length,decor:bw.decor.join()}; });
  /* (5.6) món ảnh do ChatGPT vẽ cũng được vẽ ở trại */
  const di=await T.ev(()=>{ const bw=__ltm.bw; bw.decor=['koipond','lions']; const c0=bw.nodes.find(n=>n.camp&&n.owner===0); let n=0; const cv=document.createElement('canvas').getContext('2d'); const o=cv.drawImage.bind(cv); cv.drawImage=(...a)=>{ if(a[0]===ArtImages['decor:koipond']||a[0]===ArtImages['decor:lions']) n++; return o(...a); }; BW.drawDecor(cv,c0.x,c0.y,bw.decor,1,0); BW.drawDecor(cv,c0.x,c0.y,bw.decor,1,1); return n; });
  ok(di===3,'món ảnh (ao cá Koi + đôi sư tử đá) được vẽ quanh trại: 3 ảnh');
  ok(dc.decor==='dragon'&&dc.mine>=2&&dc.layers===2&&dc.enemy===0,'trong trận: cờ rồng được vẽ quanh TRẠI CỦA TA (sau và trước lều), trại địch không có');
  if(SHOT){ await T.ev(()=>{ const bw=__ltm.bw, c0=bw.nodes.find(n=>n.camp&&n.owner===0); bw.decor=['banners','lanterns','blossom','gold','fireworks','dragon']; bw.jumpTo(c0.x,c0.y-60,1.5); }); await p.waitForTimeout(1800); await p.screenshot({path:`/tmp/shots/t-${tag}-camp.png`}); }
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:'')); await T.ctx.close();
}
await finish('HƯỚNG DẪN LẦN ĐẦU · TRANG TRÍ TRẠI',b);
