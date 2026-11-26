// 🎒 QUÂN NHU · ⚒️ LÒ RÈN · 🪙 XU — thử NHƯ NGƯỜI CHƠI trên máy giả lập Android + iOS (ngang) và một máy cầm dọc:
// mua và xếp đồ bằng chạm thật (vuốt danh sách để tới món ở dưới), rèn nâng cấp, vào trận bấm 🎒 dùng từng món lên đạo quân đang chọn,
// hết món / chưa chọn quân / đang hồi đều phải có phản hồi nhìn thấy được; xu ở Quần Hùng trả ngay khi hạ một nước; lưu ván giữ thời gian hồi.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
// vuốt danh sách (chạm thật) cho tới khi phần tử nằm trong vùng nhìn thấy và không bị che.
// Vuốt kiểu "kéo rồi dừng tay mới nhấc" để danh sách không trôi theo quán tính, và chờ danh sách đứng yên hẳn rồi mới chạm (máy thử chậm thì trôi lâu hơn).
async function swipe(T,x0,y0,x1,y1){ const {cdp,p}=T; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:1}]});
  for(let i=1;i<=10;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/10,y:y0+(y1-y0)*i/10,id:1}]}); await p.waitForTimeout(18); }
  for(let i=0;i<4;i++){ await p.waitForTimeout(45); await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1,y:y1+(i%2? 0.5 : 0),id:1}]}); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(60); }
async function still(T,sel){ let last=null, same=0; for(let i=0;i<30;i++){ const y=await T.ev((sel)=>{ const e=document.querySelector(sel); return e? Math.round(e.getBoundingClientRect().top*2)/2 : null; },sel); if(y===last){ if(++same>=2) return; } else same=0; last=y; await T.p.waitForTimeout(90); } }
async function reveal(T,sel){ for(let i=0;i<12;i++){ await still(T,sel); const r=await T.ev((sel)=>{ const e=document.querySelector(sel); if(!e) return null; const q=e.getBoundingClientRect(), cx=q.left+q.width/2, cy=q.top+q.height/2, top=document.elementFromPoint(cx,cy);
      return {ok:q.top>4&&q.bottom<innerHeight-4&&!!top&&(top===e||e.contains(top)),cy,h:innerHeight,w:innerWidth}; },sel);
    if(!r) return false; if(r.ok) return true; const up=r.cy>r.h*0.5; await swipe(T,r.w*0.2,up? r.h*0.66 : r.h*0.36,r.w*0.2,up? r.h*0.34 : r.h*0.68); } return false; }
const tapSel=async(T,sel)=>{ if(!(await reveal(T,sel))) return {ok:false,why:'vuốt mãi không tới'}; return T.tapEl(sel); };
const inv=(T)=>T.ev(()=>{ const s=JSON.parse(localStorage.getItem('ltm_save')||'{}'); return {xu:s.xu||0,inv:s.inv||{},pack:s.pack||[],up:s.up||{},shown:[...document.querySelectorAll('.xu')].map(e=>+e.textContent)}; });
const gearRow=(T,id)=>T.ev((id)=>{ const bw=__ltm.bw, i=bw.gear.findIndex(g=>g.id===id), r=(bw._gearRects||[]).find(q=>q.i===i); return r&&i>=0? [r.x+r.w/2,r.y+r.h/2] : null; },id);
const openBag=async(T)=>{ await T.p.waitForTimeout(380); const q=await T.ev(()=>{ const r=__ltm.bw._gearBtn; __ltm.bw._gearRects=[]; return r? [r.x+r.w/2,r.y+r.h/2] : null; });   /* xoá vị trí các dòng của lần mở trước: phải chờ khung hình MỚI vẽ bảng rồi mới chạm (bảng có thể nằm chỗ khác) */ if(!q) return false; await T.tap(q[0],q[1]); return !!(await T.until(()=>__ltm.bw.gearOpen&&(__ltm.bw._gearRects||[]).length>0,null,2500)); };
const useItem=async(T,id)=>{ if(!(await openBag(T))) return false; await T.p.waitForTimeout(380); const q=await gearRow(T,id); if(!q) return false; await T.tap(q[0],q[1]);   /* người thật không chạm dòng trong bảng nhanh hơn ~0,4 giây sau khi mở túi; chạm quá sát bị tính là chạm đúp */ await T.p.waitForTimeout(160); return true; };

for(const [dn,dev,tall] of [...DEVICES.map(d=>[...d,false]),[PORTRAIT[1][0],PORTRAIT[1][1],true]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r, s;
  // ---------- KHO: chưa có xu ----------
  r=await T.tapEl('#bGear'); ok(r.ok,'menu: chạm được nút 🪙 Armory '+(r.why||'')); ok(await T.vis('#gear'),'mở màn Supplies');
  s=await T.ev(()=>({cards:[...document.querySelectorAll('#gearList .fcard')].map(c=>({id:c.dataset.gear,img:!!(c.querySelector('.fi img')&&c.querySelector('.fi img').naturalWidth>0),buyOff:c.querySelector('[data-buy]').disabled,packOff:c.querySelector('[data-pack]').disabled})),pack:document.getElementById('gearPack').textContent}));
  ok(s.cards.length===7&&s.cards.every(c=>c.img),`đủ 7 món, món nào cũng hiện ảnh vật phẩm (${s.cards.filter(c=>c.img).length}/7)`);
  ok(s.cards.every(c=>c.buyOff&&c.packOff)&&/0\/3/.test(s.pack),'chưa có xu: nút mua và nút xếp đều khoá, "Packed: 0/3"');
  // ---------- có 400 xu (như vừa thắng vài trận): mua bằng chạm thật ----------
  await T.ev(()=>{ save.xu=400; Save.set(save); renderGear(); });
  r=await tapSel(T,'[data-buy="bun"]'); ok(r.ok,'chạm được nút mua Bánh bao '+(r.why||'')); await p.waitForTimeout(150); s=await inv(T);
  ok(s.xu===370&&s.inv.bun===1&&s.pack.join()==='bun'&&s.shown.every(v=>v===370),`mua Bánh bao: 400 → ${s.xu} xu, kho ×${s.inv.bun}, tự xếp vào túi, số xu trên màn hình cập nhật`);
  for(const id of ['bun','tea','smoke']){ r=await tapSel(T,`[data-buy="${id}"]`); if(!r.ok) ok(false,`chạm được nút mua ${id} `+(r.why||'')); await p.waitForTimeout(120); }
  s=await inv(T); ok(s.xu===370-30-40-50&&s.inv.bun===2&&s.inv.tea===1&&s.inv.smoke===1&&s.pack.join()==='bun,tea,smoke',`mua thêm bánh, trà, khói (vuốt danh sách để tới món ở dưới): còn ${s.xu} xu, túi ${s.pack.join(', ')}`);
  r=await tapSel(T,'[data-buy="compass"]'); await p.waitForTimeout(150); s=await inv(T);
  const st=await T.ev(()=>({packOff:document.querySelector('[data-pack="compass"]').disabled,txt:document.getElementById('gearPack').textContent,on:[...document.querySelectorAll('#gearList .fcard.on')].map(c=>c.dataset.gear).join()}));
  ok(r.ok&&s.inv.compass===1&&s.pack.length===3&&st.packOff&&/3\/3/.test(st.txt)&&st.on==='bun,tea,smoke','túi đã đủ 3 món: mua La bàn vẫn vào kho nhưng chưa xếp được (nút Pack khoá, 3 thẻ đang xếp viền xanh)'+` [chạm ${r.ok? 'được' : 'KHÔNG được: '+r.why} · kho ${JSON.stringify(s.inv)} · túi ${s.pack.join()} · ${s.xu} xu]`);
  r=await tapSel(T,'[data-pack="smoke"]'); await p.waitForTimeout(150); r=await tapSel(T,'[data-pack="compass"]'); await p.waitForTimeout(150); s=await inv(T);
  ok(r.ok&&s.pack.join()==='bun,tea,compass','bỏ Túi khói ra, xếp La bàn vào: túi = bánh, trà, la bàn');
  await T.ev(()=>{ save.xu=20; Save.set(save); renderGear(); }); r=await tapSel(T,'[data-buy="plank"]'); await p.waitForTimeout(120); s=await inv(T);
  ok(s.xu===20&&!s.inv.plank&&await T.ev(()=>document.querySelector('[data-buy="plank"]').disabled),'không đủ xu: nút mua khoá, chạm vào không mất xu, không có món');
  // ---------- LÒ RÈN ----------
  await T.ev(()=>{ save.xu=300; Save.set(save); renderGear(); document.querySelector('#gear .card').scrollTo(0,0); }); await p.waitForTimeout(100);
  r=await T.tapEl('#bToForge'); ok(r.ok&&await T.vis('#forge'),'chuyển sang thẻ Forge '+(r.why||''));
  s=await T.ev(()=>({lad:[...document.querySelectorAll('#forgeStats .wladder .wl')].map(w=>w.className.replace('wl ','')+(w.querySelector('img')&&w.querySelector('img').naturalWidth>0?'':'!')),cards:document.querySelectorAll('#forgeList .fcard').length,txt:document.getElementById('forgeStats').textContent}));
  ok(s.cards===6&&s.lad.join()==='cur,lock,lock,lock,lock,lock'&&/March \+0%/.test(s.txt),`Lò rèn: 6 hạng mục, thang 6 vũ khí hiện đủ ảnh (đang ở bậc đầu), chỉ số +0%`);
  const fbtn=(k)=>`#forgeList .fcard:nth-child(${['speed','power','armor','stamina','aura','weapon'].indexOf(k)+1}) .btn`;
  r=await tapSel(T,fbtn('speed')); await p.waitForTimeout(200); s=await inv(T); ok(r.ok&&s.up.speed===1&&s.xu===270,`rèn Speed bậc 1: 300 → ${s.xu} xu`);
  r=await tapSel(T,fbtn('weapon')); await p.waitForTimeout(200); s=await inv(T);
  const fs=await T.ev(()=>({lad:[...document.querySelectorAll('#forgeStats .wladder .wl')].map(w=>w.className.replace('wl ','')).join(),txt:document.getElementById('forgeStats').textContent}));
  ok(r.ok&&s.up.weapon===1&&s.xu===210&&fs.lad==='on,cur,lock,lock,lock,lock'&&/March \+2%/.test(fs.txt)&&/Damage \+1\.5%/.test(fs.txt),`rèn Weapon bậc 1: còn ${s.xu} xu, thang vũ khí sang bậc 2, bảng chỉ số ghi March +2% · Damage +1.5%`);
  // ---------- tắt mở lại game: mọi thứ còn nguyên ----------
  await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(400); s=await inv(T);
  ok(s.xu===210&&s.inv.bun===2&&s.inv.tea===1&&s.inv.smoke===1&&s.inv.compass===1&&s.pack.join()==='bun,tea,compass'&&s.up.speed===1&&s.up.weapon===1&&s.shown[0]===210,'mở lại game: xu, kho, túi 3 món và nâng cấp còn nguyên');
  // ---------- VÀO TRẬN 1v1 ----------
  await T.startBattle({map52:3,civ:'rome'},2); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await T.hookDraw(); await T.ev(()=>{ __ltm.bw.aiTurn=()=>{}; __ltm.bw.nextWaveF={1:1e9}; });   /* (5.3) boss nay chủ động hơn: cho máy đứng yên để bài thử quân nhu không phụ thuộc nước đi của máy */
  const a0=await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro(); bw.aiTurn=()=>{}; bw.nextWaveF={1:1e9}; bw.notes=[]; const c=bw.nodes.find(n=>n.camp&&n.owner===0);
    const a={owner:0,type:'spear',count:900,x:c.x+330,y:c.y+170,to:-1,tx:c.x+330,ty:c.y+170,trail:0,camped:true,food:22}; bw.armies.push(a); window.__a=a;
    return {gear:bw.gear.map(g=>g.id).join(),up:bw.up&&bw.up.speed,x:a.x,y:a.y,hud:Object.keys(bw.hudRects())}; }); await p.waitForTimeout(500);
  ok(a0.gear==='bun,tea,compass'&&a0.up===1,`vào trận mang đúng 3 món đã xếp (${a0.gear}) và nâng cấp Lò rèn`);
  const gb=await T.ev(()=>{ const bw=__ltm.bw, g=bw._gearBtn, R=bw._rallyBtn; return g? {g,R,vw:bw.lastVw,vh:bw.lastVh} : null; });
  ok(!!gb&&gb.g.x>=0&&gb.g.y>=0&&gb.g.x+gb.g.w<=gb.vw&&gb.g.y+gb.g.h<=gb.vh&&gb.g.w>=44&&gb.g.x>=gb.R.x+gb.R.w,'nút 🎒 nằm gọn trong màn hình, cạnh nút 📣, đủ to để bấm (≥44px)');
  // chưa chọn quân mà dùng món cần đạo quân → có lời nhắc, không mất món
  ok(await openBag(T),'chạm 🎒: bảng món mở ra');
  const rows=await T.drawn(/Steamed Buns|Ginger Tea|Compass|Close/); ok(rows.length>=4&&(await T.drawn(/^×\d+$/)).length>=3,`bảng liệt kê 3 món kèm số lượng còn lại và nút Close (thấy ${rows.map(e=>e.t).join(' · ')})`);
  ok(rows.every(e=>e.f>=11.5),`chữ trong bảng đủ lớn để đọc (nhỏ nhất ${Math.min(...rows.map(e=>e.f)).toFixed(1)}px)`);
  let q=await gearRow(T,'tea'); await T.tap(q[0],q[1]); await p.waitForTimeout(250); s=await inv(T);
  ok(s.inv.tea===1&&await T.ev(()=>!__ltm.bw.gearOpen&&__ltm.bw.notes.some(n=>/tap one of your armies/.test(n.text)))&&(await T.drawn(/tap one of your armies/)).length>=1,'chưa chọn đạo quân mà bấm Trà gừng: hiện lời nhắc "chọn một đạo quân trước", không mất món');
  // chọn đạo quân bằng cách chạm vào nó rồi dùng Bánh bao
  let sc=await T.aim(a0.x,a0.y); await T.settle(); await T.tap(sc[0],sc[1]-10); ok(await T.until(()=>__ltm.bw.selA===window.__a,null,2500),'chạm vào đạo quân của ta để chọn');
  ok(await useItem(T,'bun'),'mở 🎒 rồi chạm Bánh bao'); s=await inv(T);
  ok(await T.ev(()=>window.__a.food===100)&&s.inv.bun===1,`🥟 lương đạo quân 22 → 100, kho bánh còn ×${s.inv.bun} (đã ghi xuống máy)`);
  ok((await T.drawn(/Supply refilled/)).length>=1,'thấy dòng chữ "Supply refilled!" bật lên trên đạo quân');
  ok(await T.ev(()=>__ltm.bw.selA===window.__a&&!__ltm.bw.gearOpen),'dùng xong bảng tự đóng, đạo quân vẫn đang được chọn');
  // món vừa dùng đang hồi: thấy đồng hồ, bấm lại không mất thêm
  await openBag(T); ok((await T.drawn(/^⏳ \d+s$/)).length===1,'mở lại bảng: Bánh bao hiện đồng hồ hồi "⏳ …s"');
  await T.ev(()=>{ window.__a.food=40; }); q=await gearRow(T,'bun'); await T.tap(q[0],q[1]); await p.waitForTimeout(200); s=await inv(T); ok(s.inv.bun===1&&await T.ev(()=>window.__a.food<=40),'bấm món đang hồi: không có tác dụng, không mất món');
  // chạm ra ngoài bảng: đóng bảng, giữ lựa chọn
  if(!(await T.ev(()=>__ltm.bw.gearOpen))) await openBag(T);
  { const m=await T.ev(()=>{ const bw=__ltm.bw, M=bw._gearMenu; return {M,vw:bw.lastVw,vh:bw.lastVh}; }); const ox= m.M.x+m.M.w+60<m.vw? m.M.x+m.M.w+50 : m.M.x-30, oy= m.M.y>90? m.M.y-40 : m.M.y+m.M.h+40; await T.tap(Math.max(20,Math.min(m.vw-20,ox)),Math.max(70,Math.min(m.vh-20,oy))); await p.waitForTimeout(200);
    ok(await T.ev(()=>!__ltm.bw.gearOpen&&__ltm.bw.selA===window.__a&&!__ltm.bw.menu),'chạm ra ngoài bảng: bảng đóng, không ra lệnh nhầm, vẫn giữ đạo quân đang chọn'); }
  // Trà gừng lên đạo quân đang chọn: có huy hiệu đếm giây cạnh đạo quân
  ok(await useItem(T,'tea'),'mở 🎒 rồi chạm Trà gừng'); s=await inv(T);
  ok(await T.ev(()=>window.__a.teaT>20)&&s.inv.tea===0,'🍵 đạo quân được +50% tốc độ trong 30s, kho trà về ×0');
  ok((await T.drawn(/^(2\d|30)s$/)).length>=1,'thấy huy hiệu đếm giây của Trà gừng cạnh đạo quân');
  // la bàn: không cần chọn ai; soi quanh giữa màn hình
  { const e=await T.ev(()=>{ const bw=__ltm.bw, E=bw.nodes.filter(n=>n.owner===1&&n.count>0&&!n.camp).sort((p,q)=>q.x-p.x)[0]; bw.sel=null; bw.selA=null; bw.selG=null; const sc=bw.scale0*bw.zoom; bw.camX=E.x-bw.lastVw/sc/2; bw.camY=E.y-bw.lastVh/sc/2; window.__E=E; return {vis:bw.visNow(E)}; }); await T.settle();
    ok(!e.vis&&await useItem(T,'compass'),'kéo màn hình tới vùng địch còn ẩn quân số, mở 🎒 chạm La bàn');
    { const dg=await T.ev(()=>{ const bw=__ltm.bw, E=window.__E, sc=bw.scale0*bw.zoom; return {vis:bw.visNow(E),tv:bw.tempVis.length,open:!!bw.gearOpen,inv:JSON.stringify(save.inv),cam:[Math.round(bw.camX),Math.round(bw.camY)],E:[Math.round(E.x),Math.round(E.y),E.owner,Math.round(E.count)],ctr:[Math.round(bw.camX+bw.lastVw/sc/2),Math.round(bw.camY+bw.lastVh/sc/2)],texts:bw.texts.map(t=>t.s).slice(-3),gear:bw.gear.map(g=>g.id+':'+Math.round(g.cd||0)).join()}; }); if(!(dg.vis&&dg.tv===1)) console.log('   [chẩn đoán la bàn]',JSON.stringify(dg)); }
    ok(await T.ev(()=>__ltm.bw.visNow(window.__E)&&__ltm.bw.tempVis.length===1)&&(await T.drawn(/strongholds revealed/)).length>=1,'🧭 quân số cứ điểm địch giữa màn hình lộ ra, có dòng "… strongholds revealed"');
    ok((await T.drawn(/^(2\d|30)s$/)).length>=1,'cứ điểm địch vừa lộ có huy hiệu ống nhòm đếm giây còn thấy'); }
  // hết món: bấm vào báo hết
  await T.ev(()=>{ const bw=__ltm.bw; for(const g of bw.gear) g.cd=0; bw.selA=window.__a; bw.notes=[]; }); await useItem(T,'tea'); await p.waitForTimeout(200);
  ok(await T.ev(()=>__ltm.bw.notes.some(n=>/Out of Ginger Tea/.test(n.text)))&&(await T.drawn(/Out of Ginger Tea/)).length>=1,'món đã hết trong kho: bấm vào hiện "Out of Ginger Tea — buy more…"');
  // tạm dừng: đồng hồ hồi đứng yên
  await T.ev(()=>{ __ltm.bw.gear[0].cd=100; }); r=await T.tapEl('#bwPause'); await p.waitForTimeout(1300); const cdP=await T.ev(()=>__ltm.bw.gear[0].cd);
  ok(r.ok&&await T.vis('#pause')&&cdP>99.5,'⏸ tạm dừng: thời gian hồi không chạy');
  // nút tiếng: tắt/bật, nhớ sau khi mở lại
  r=await T.tapEl('#bPSound'); await p.waitForTimeout(120); const snd=await T.ev(()=>({on:audio.on,lbl:document.querySelector('#bPSound .sndLbl').textContent,sv:JSON.parse(localStorage.getItem('ltm_save')).mute,img:!!(document.querySelector('#bPSound img')&&document.querySelector('#bPSound img').naturalWidth>0)}));
  ok(r.ok&&snd.on===false&&/Off/.test(snd.lbl)&&snd.sv===true&&snd.img,'bảng tạm dừng có nút tiếng (ảnh trống trận): chạm là tắt tiếng, ghi "Sound: Off", nhớ lựa chọn');
  await T.tapEl('#bPSound'); await p.waitForTimeout(100); ok(await T.ev(()=>audio.on===true&&JSON.parse(localStorage.getItem('ltm_save')).mute===false),'chạm lần nữa: bật tiếng lại');
  await T.tapEl('#bResume'); await p.waitForTimeout(250);
  // ↻ chơi lại: trận mới, món hồi về 0, kho giữ nguyên số đã tiêu
  await T.tapEl('#bwRetry'); await p.waitForTimeout(200); await T.tapEl('#askY'); await p.waitForTimeout(600); s=await inv(T);
  ok(await T.ev(()=>__ltm.bw.time<5&&__ltm.bw.gear.every(g=>g.cd===0)&&__ltm.bw.gear.map(g=>g.id).join()==='bun'&&__ltm.bw.lv===2)&&s.inv.bun===1&&s.inv.tea===0&&s.inv.compass===0,'↻ chơi lại ải 2: trận mới chỉ còn mang món còn trong kho (bánh ×1), không được hoàn lại món đã dùng');
  // ---------- thắng trận → màn kết quả → Armory → Back quay lại kết quả ----------
  await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro(); bw.over=true; bw.result={win:true}; }); ok(await T.vis('#result',6000),'thắng: hiện màn kết quả'); s=await inv(T);
  ok(s.xu>210&&s.shown.every(v=>v===s.xu),`thắng ải 2 được thưởng xu (210 → ${s.xu})`);
  r=await T.tapEl('#bRForge'); ok(r.ok&&await T.vis('#gear'),'màn kết quả: chạm "🪙 Armory" mở thẳng kho để tiêu xu vừa thưởng '+(r.why||''));
  r=await tapSel(T,'[data-buy="tea"]'); await p.waitForTimeout(150); const s2=await inv(T); ok(r.ok&&s2.inv.tea===1&&s2.xu===s.xu-40,'mua Trà gừng ngay từ đây');
  await T.ev(()=>document.querySelector('#gear .card').scrollTo(0,1e5)); await p.waitForTimeout(120); r=await T.tapEl('#gear [data-back]'); await p.waitForTimeout(250);
  ok(r.ok&&await T.vis('#result')&&!(await T.visible('#gear')),'Back: quay lại đúng màn kết quả (không văng về menu)');
  r=await T.tapEl('#bNext'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lv===3&&__ltm.bw.lastVw>0,null,{timeout:8000}).catch(()=>{}); await p.waitForTimeout(300); ok(r.ok&&await T.ev(()=>__ltm.bw&&__ltm.bw.lv===3&&__ltm.bw.gear.map(g=>g.id).join()==='bun,tea'),'Next stage: sang ải 3, mang theo bánh và trà vừa mua');
  // ---------- QUẦN HÙNG: xu trả ngay khi hạ một nước; lưu ván giữ thời gian hồi ----------
  if(!tall){ await T.ev(()=>{ localStorage.removeItem('ltm_royale_save_v1'); save.inv.compass=2; save.pack=['compass','bun','tea']; Save.set(save); });
    await T.startBattle({royale:36,seed:61,map:1,civ:'rome'},5); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.royale&&__ltm.bw.lastVw>0); const x0=(await inv(T)).xu;
    await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro(); bw.aiTurn=()=>{}; bw.notes=[]; const F=bw.localFid, c=bw.nodes.find(n=>n.camp&&n.owner===F), v=bw.nodes.filter(n=>n.camp&&n.owner!==F&&n.owner!==2).sort((p,q)=>Math.hypot(p.x-c.x,p.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y))[0];
      v.count=10; window.__v=v; bw.arrive({owner:F,type:'cavalry',count:6000,x:v.x,y:v.y,to:v.id,food:100},v); });
    ok(await T.until(()=>window.__v.owner===__ltm.bw.localFid,null,25000),'Quần Hùng: đại quân ta hạ kinh đô một nước láng giềng');
    await p.waitForTimeout(300); s=await inv(T);
    const NX=await T.ev(()=>BW.coinsFor.nation); ok(s.xu===x0+NX&&s.shown.every(v=>v===s.xu)&&await T.ev((NX)=>__ltm.bw.stats.coins===NX,NX)&&NX===6,`🪙 diệt một nước: +${NX} xu (≈15% của 40) vào túi NGAY (${x0} → ${s.xu}), không phải đợi hết ván`);
    ok(await T.ev(()=>__ltm.bw.notes.some(n=>/\+6 coins/.test(n.text)))&&(await T.drawn(/\+6 coins/)).length>=1,'có thông báo "+6 coins — a whole nation conquered" trên màn hình');
    ok(await T.until(()=>{ try{ const sv=JSON.parse(localStorage.getItem('ltm_royale_save_v1')||'null'); return !!sv&&sv.stats&&sv.stats.coins===6&&sv.nodes[window.__v.id].owner===__ltm.bw.localFid; }catch(e){ return false; } },null,5000),'ván Quần Hùng tự lưu ngay sau khi trả xu (thoát game đột ngột cũng không "hạ lại" nước đó để lĩnh xu lần hai được)');
    ok(await useItem(T,'compass'),'Quần Hùng: mở 🎒 dùng La bàn'); const cd0=await T.ev(()=>__ltm.bw.gear[0].cd); ok(cd0>230,`thời gian hồi ở Quần Hùng dài hơn (${Math.round(cd0)}s)`);
    r=await T.tapEl('#bwBack'); await p.waitForTimeout(500); ok(await T.vis('#menu')&&await T.ev(()=>!!localStorage.getItem('ltm_royale_save_v1')),'🏠 về menu: ván Quần Hùng tự lưu');
    await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(400);
    await T.tapEl('#bBW'); await p.waitForTimeout(200); r=await T.tapEl('#bBossContinue'); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.royale&&__ltm.bw.lastVw>0,null,{timeout:15000}).catch(()=>{});
    const rs=await T.ev(()=>{ const bw=__ltm.bw; return bw? {gear:bw.gear.map(g=>g.id+':'+Math.round(g.cd)).join(),coins:bw.stats.coins,vis:bw.tempVis.length,own:window.__v? 1 : 0} : null; }); s=await inv(T);
    ok(r.ok&&rs&&/^compass:(2[0-3]\d|240),bun:0,tea:0$/.test(rs.gear)&&rs.coins===6&&s.inv.compass===1&&s.xu===x0+6,`tắt hẳn game rồi CONTINUE: La bàn vẫn đang hồi (${rs&&rs.gear}), kho và xu còn nguyên`); }
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length? ': '+T.errs[0] : '')); await T.ctx.close(); }
await finish('QUÂN NHU · LÒ RÈN · XU',b);
