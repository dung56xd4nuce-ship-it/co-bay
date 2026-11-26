// 🎒 (6.1) 5 MÓN QUÂN NHU MỚI + TÚI 4–5 Ô — thử NHƯ NGƯỜI CHƠI trên máy giả lập Android + iOS (ngang) và một máy cầm dọc:
// vào Kho bằng chạm thật, mua túi lớn hơn (xu trừ đúng, hết chỗ thì "Max"), mua 5 món mới (vuốt danh sách tới món ở dưới), túi tự xếp đủ 5 món;
// vào trận: bảng 🎒 liệt kê đủ 5 món + Close và nằm gọn trong màn hình; chạm cứ điểm / đạo quân của ta rồi dùng từng món mới, thấy kết quả trên màn hình.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
async function swipe(T,x0,y0,x1,y1){ const {cdp,p}=T; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:1}]});
  for(let i=1;i<=10;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/10,y:y0+(y1-y0)*i/10,id:1}]}); await p.waitForTimeout(18); }
  for(let i=0;i<4;i++){ await p.waitForTimeout(45); await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1,y:y1+(i%2? 0.5 : 0),id:1}]}); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(60); }
async function still(T,sel){ let last=null, same=0; for(let i=0;i<30;i++){ const y=await T.ev((sel)=>{ const e=document.querySelector(sel); return e? Math.round(e.getBoundingClientRect().top*10)/10 : null; },sel); if(y===last){ if(++same>=3) return; } else same=0; last=y; await T.p.waitForTimeout(90); } }
async function reveal(T,sel){ for(let i=0;i<14;i++){ await still(T,sel); const r=await T.ev((sel)=>{ const e=document.querySelector(sel); if(!e) return null; const q=e.getBoundingClientRect(), cx=q.left+q.width/2, cy=q.top+q.height/2, top=document.elementFromPoint(cx,cy);
      let sp=e.parentElement; while(sp&&!/(auto|scroll)/.test(getComputedStyle(sp).overflowY)) sp=sp.parentElement; const vb=sp? sp.getBoundingClientRect() : {top:0,bottom:innerHeight};   /* phải nằm TRỌN trong khung cuộn, không chỉ trong cửa sổ */
      return {ok:q.top>Math.max(4,vb.top+2)&&q.bottom<Math.min(innerHeight-4,vb.bottom-2)&&!!top&&(top===e||e.contains(top)),cy,h:innerHeight,w:innerWidth}; },sel);
    if(!r) return false; if(r.ok) return true; const up=r.cy>r.h*0.5; await swipe(T,r.w*0.2,up? r.h*0.66 : r.h*0.36,r.w*0.2,up? r.h*0.34 : r.h*0.68); } return false; }
const tapSel=async(T,sel)=>{ if(!(await reveal(T,sel))) return {ok:false,why:'vuốt mãi không tới'}; return T.tapEl(sel); };
const inv=(T)=>T.ev(()=>{ const s=JSON.parse(localStorage.getItem('ltm_save')||'{}'); return {xu:s.xu||0,inv:s.inv||{},pack:s.pack||[],slots:s.gearSlots|0}; });
const gearRow=(T,id)=>T.ev((id)=>{ const bw=__ltm.bw, i=bw.gear.findIndex(g=>g.id===id), r=(bw._gearRects||[]).find(q=>q.i===i); return r&&i>=0? [r.x+r.w/2,r.y+r.h/2] : null; },id);
const openBag=async(T)=>{ await T.p.waitForTimeout(380); const q=await T.ev(()=>{ const r=__ltm.bw._gearBtn; __ltm.bw._gearRects=[]; return r? [r.x+r.w/2,r.y+r.h/2] : null; }); if(!q) return false; await T.tap(q[0],q[1]);
  return !!(await T.until(()=>__ltm.bw.gearOpen&&(__ltm.bw._gearRects||[]).length>0,null,2500)); };
const useItem=async(T,id)=>{ if(!(await openBag(T))) return false; await T.p.waitForTimeout(380); const q=await gearRow(T,id); if(!q) return false; await T.tap(q[0],q[1]); await T.p.waitForTimeout(200); return true; };
// đưa camera tới một vật rồi chạm vào nó như người chơi
const tapWorld=async(T,o)=>{ const sc=await T.aim(o.x,o.y); await T.settle(); await T.tap(sc[0],sc[1]-10); await T.p.waitForTimeout(200); };
const NEW=['horn','sandbag','drum','banner','caltrops'];

for(const [dn,dev] of [...DEVICES,PORTRAIT[1]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; let r, s;
  await T.ev(()=>{ save.xu=1000; save.inv={}; save.pack=[]; save.gearSlots=0; Save.set(save); });
  r=await T.tapEl('#bGear'); ok(r.ok&&await T.vis('#gear'),'menu: chạm 🪙 Armory mở Kho '+(r.why||''));
  s=await T.ev(()=>({t:document.querySelector('[data-gear="slot"]').textContent,pk:document.getElementById('gearPack').textContent,n:document.querySelectorAll('#gearList .fcard').length}));
  ok(/3\/5 slots/.test(s.t)&&/150/.test(s.t)&&/0\/3/.test(s.pk)&&s.n===13,`thẻ "Bigger pack" ghi 3/5 ô, giá 150; "Packed: 0/3"; 12 món + 1 thẻ túi (${s.n} thẻ)`);
  r=await tapSel(T,'[data-buy="slot"]'); await p.waitForTimeout(200); s=await inv(T);
  ok(r.ok&&s.slots===1&&s.xu===850&&await T.ev(()=>/4\/5 slots/.test(document.querySelector('[data-gear="slot"]').textContent)&&/0\/4/.test(document.getElementById('gearPack').textContent)),`mua túi lớn: 1000 → ${s.xu} xu, túi 4 ô`);
  r=await tapSel(T,'[data-buy="slot"]'); await p.waitForTimeout(200); s=await inv(T);
  ok(r.ok&&s.slots===2&&s.xu===550&&await T.ev(()=>{ const b=document.querySelector('[data-buy="slot"]'); return b.disabled&&/Max/.test(b.textContent)&&/5\/5/.test(document.querySelector('[data-gear="slot"]').textContent); }),`mua tiếp: còn ${s.xu} xu, túi 5 ô, nút thành "Max" và khoá`);
  for(const id of NEW){ r=await tapSel(T,`[data-buy="${id}"]`); if(!r.ok) ok(false,`chạm được nút mua ${id} `+(r.why||'')); await p.waitForTimeout(130); }
  s=await inv(T); ok(s.xu===550-45-40-50-55-40&&NEW.every(id=>s.inv[id]===1)&&s.pack.join()===NEW.join(),`mua 5 món mới (vuốt tới cuối danh sách): còn ${s.xu} xu, túi tự xếp đủ 5 món (${s.pack.join(', ')})`);
  s=await T.ev((NEW)=>NEW.map(id=>{ const im=document.querySelector(`[data-gear="${id}"] .fi img`); return !!im&&im.naturalWidth>0; }),NEW); ok(s.every(Boolean),'5 món mới đều có ảnh huy hiệu');
  // ---------- vào trận ----------
  await T.startBattle({map52:3,civ:'rome'},2); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await T.hookDraw();
  const w=await T.ev(()=>{ const bw=__ltm.bw; bw.skipIntro(); bw.aiTurn=()=>{}; bw.nextWaveF={1:1e9}; bw.notes=[]; const c=bw.nodes.find(n=>n.camp&&n.owner===0);
    const a={owner:0,type:'spear',count:900,x:c.x+330,y:c.y+170,to:-1,tx:c.x+330,ty:c.y+170,trail:0,camped:true,food:100}; bw.armies.push(a); window.__a=a; window.__c=c; c.count=500;
    return {gear:bw.gear.map(g=>g.id).join(),c:{x:c.x,y:c.y},a:{x:a.x,y:a.y}}; }); await p.waitForTimeout(400);
  ok(w.gear===NEW.join(),`vào trận mang đủ 5 món (${w.gear})`);
  ok(await openBag(T),'chạm 🎒: bảng món mở');
  s=await T.ev(()=>{ const bw=__ltm.bw, m=bw._gearMenu, R=bw._gearRects||[]; return {m,n:R.length,vw:bw.lastVw,vh:bw.lastVh,minH:Math.min(...R.map(q=>q.h))}; });
  ok(s.n===6&&s.m.x>=0&&s.m.y>=0&&s.m.x+s.m.w<=s.vw+0.5&&s.m.y+s.m.h<=s.vh+0.5&&s.minH>=27,`bảng 🎒 có 5 món + Close, nằm gọn trong màn hình ${s.vw}×${s.vh} (bảng ${Math.round(s.m.w)}×${Math.round(s.m.h)}, dòng thấp nhất ${s.minH}px)`);
  const rows=await T.drawn(/War Horn|Sandbags|War Drums|Rally Banner|Caltrops/); ok(new Set(rows.map(e=>e.t)).size===5&&rows.every(e=>e.f>=11.5),`đọc được tên 5 món trong bảng (chữ nhỏ nhất ${Math.min(...rows.map(e=>e.f)).toFixed(1)}px)`);
  await T.tap(4,Math.round(s.vh/2)); await p.waitForTimeout(150);
  // 🚩 cờ chiêu binh lên đại bản doanh
  await tapWorld(T,w.c); ok(await T.until(()=>__ltm.bw.sel===window.__c,null,2500),'chạm đại bản doanh của ta để chọn');
  const c0=await T.ev(()=>Math.round(window.__c.count));
  ok(await useItem(T,'banner'),'mở 🎒 chạm Rally Banner'); s=await T.ev(()=>({c:Math.round(window.__c.count),inv:save.inv.banner}));
  ok(s.c>=c0+30&&s.inv===0&&(await T.drawn(/troops rally to the banner/)).length>=1,`🚩 đại bản doanh ${c0} → ${s.c} quân, có dòng "… troops rally to the banner", kho hết cờ`);
  // 🧱 + 🥁 lên cùng cứ điểm: huy hiệu đếm giây hiện cạnh trại
  ok(await useItem(T,'sandbag'),'chạm Sandbags'); ok(await useItem(T,'drum'),'chạm War Drums');
  s=await T.ev(()=>({b:window.__c.bagT,d:window.__c.drumT})); ok(s.b>55&&s.d>55&&(await T.drawn(/^(5\d|60)s$/)).length>=2,`🧱 🥁 có hiệu lực trên trại (${Math.round(s.b)}s · ${Math.round(s.d)}s), hai huy hiệu đếm giây hiện cạnh trại`);
  // 📯 tù và lên đạo quân
  await T.ev(()=>{ __ltm.bw.sel=null; }); await tapWorld(T,w.a); ok(await T.until(()=>__ltm.bw.selA===window.__a,null,2500),'chạm đạo quân của ta để chọn');
  ok(await useItem(T,'horn'),'chạm War Horn'); ok(await T.ev(()=>window.__a.hornT>40)&&(await T.drawn(/War horn ready/)).length>=1,'📯 đạo quân có tù và 45s, có dòng "War horn ready"');
  // 📌 chông sắt quanh giữa màn hình
  ok(await useItem(T,'caltrops'),'chạm Caltrops'); { const dg=await T.ev(()=>({calZ:(__ltm.bw.calZ||[]).length,inv:save.inv.caltrops,notes:__ltm.bw.notes.slice(-2).map(n=>n.text),texts:__ltm.bw.texts.slice(-2).map(t=>t.s)})); if(dg.calZ!==1) console.log('   dbg',JSON.stringify(dg)); } ok(await T.ev(()=>(__ltm.bw.calZ||[]).length===1)&&(await T.drawn(/Caltrops scattered/)).length>=1&&(await T.drawn(/^📌 \d+s$/)).length>=1,'📌 vùng chông hiện trên bản đồ (vòng nét đứt + đồng hồ), có dòng "Caltrops scattered"');
  s=await inv(T); ok(NEW.every(id=>s.inv[id]===0),'mỗi lần dùng trừ đúng 1 món trong kho');
  ok(!T.errs.length,'không có lỗi JS '+T.errs.slice(0,2).join(' | '));
  await T.ctx.close(); }
await finish('🎒 5 món quân nhu mới + túi 5 ô',b);
