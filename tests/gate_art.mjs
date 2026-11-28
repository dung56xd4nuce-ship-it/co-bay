// BỘ ART KHÔNG ĐƯỢC BỎ KHÔNG: đi một vòng game như người chơi (menu, kho, lò rèn, trận 1v1 trên 3 bản đồ, Quần Hùng, tạm dừng, kết quả)
// và ghi lại ẢNH NÀO THẬT SỰ ĐƯỢC VẼ RA (canvas + HTML). Ảnh nào có trong bộ art mà không hiện ở đâu → FAIL, kèm tên ảnh.
// Không tính màn "Art pack" (bảng liệt kê toàn bộ ảnh để thay art) — đó là công cụ, không phải chỗ ảnh được dùng.
// Ngoại lệ duy nhất: ảnh có chữ tiếng Việt (VN_TEXT_ART) — bản quốc tế cố ý ẩn cho tới khi có bản vẽ tiếng Anh.
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
const b=await launch(); const T=await open(b,DEVICES[0][1],{init:()=>{ const P=CanvasRenderingContext2D.prototype, di=P.drawImage, cp=P.createPattern; window.__used=new Set(); window.__dom=new Set();
  P.drawImage=function(im){ window.__used.add(im); return di.apply(this,arguments); }; P.createPattern=function(im){ window.__used.add(im); return cp.apply(this,arguments); }; }}); const {p}=T;
await p.evaluate(()=>{
  window.__scanDom=()=>{ const urls=new Map(); for(const k in ArtUrls) urls.set(ArtUrls[k],k);
    for(const e of document.querySelectorAll('img')){ if(e.closest('#artscr')) continue; const b=e.getBoundingClientRect(); if(!b.width||e.closest('.hidden')) continue; const k=urls.get(e.getAttribute('src'))||urls.get(e.src); if(k) window.__dom.add(k); }
    for(const e of document.querySelectorAll('[style*="url("]')){ if(e.closest('#artscr')||e.closest('.hidden')) continue; const m=/url\(["']?(data:[^"')]+)/.exec(e.getAttribute('style')||''); if(m&&urls.has(m[1])) window.__dom.add(urls.get(m[1])); } }; });
const scan=()=>p.evaluate(()=>window.__scanDom()); const wait=(ms)=>p.waitForTimeout(ms);
await p.evaluate(()=>{ save.xu=5000; Save.set(save); refreshXu(); }); await wait(900); await scan();
await T.tapEl('#bHelp'); await wait(400); await scan(); await p.evaluate(()=>showScreen('menu')); await wait(200);
await T.tapEl('#bGear'); await wait(400); await scan();
for(const g of ['bun','tea','plank','smoke','scarecrow','compass','bandage']) await p.evaluate((id)=>{ const e=document.querySelector(`[data-buy="${id}"]`); if(e) e.click(); },g);
await wait(200); await scan(); await T.tapEl('#bToForge'); await wait(300); await scan();
for(let k=0;k<30;k++) await p.evaluate(()=>{ const e=[...document.querySelectorAll('#forgeList .fcard .btn')].find(x=>!x.disabled&&!x.classList.contains('off')); if(e) e.click(); });
await wait(200); await scan();
await p.evaluate(()=>showScreen('menu')); await wait(200); await T.tapEl('#bBW'); await wait(500); await scan();
// trận 1v1: nhiều bản đồ, phóng to/thu nhỏ để dựng đủ các mức chi tiết của bản đồ; cho đánh nhau để ra hiệu ứng
for(const [lv,map,civ] of [[3,3,'rome'],[7,11,'mongol'],[10,16,'daiviet']]){
  await p.evaluate(()=>{ save.pack=['plank','smoke','scarecrow']; save.inv={bun:9,tea:9,plank:9,smoke:9,scarecrow:9,compass:9,bandage:9}; });
  await T.startBattle({map,civ},lv); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await wait(500);
  await p.evaluate(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0); const e=bw.nodes.find(n=>n.camp&&n.owner===1);
    for(const [t,dx] of [['spear',220],['cavalry',300],['archer',380],['shield',460],['saber',540],['crossbow',620],['assassin',700],['swordsman',780]]){ bw.armies.push({owner:0,type:t,count:900,x:c.x+dx,y:c.y+140,to:-1,tx:c.x+dx,ty:c.y+140,trail:0,camped:true,food:60,teaT:20,smokeT:20,plankT:20}); bw.armies.push({owner:1,type:t,count:500,x:c.x+dx+30,y:c.y+190,to:-1,tx:c.x+dx,ty:c.y+140,trail:0,food:60}); }
    c.scareT=40; bw._gearLive=true; bw.tempVis.push({x:e.x,y:e.y,r:1600,t:20}); bw.zoomTgt=bw.zoom=1;
    // các trạng thái có hình riêng: trinh sát hai bên, cờ/trống tập kết, khiên rút lui, đồng hồ cát chuẩn bị lương, ống nhòm do thám, y sĩ, bọt nước
    const near=bw.nodes.filter(n=>n.owner!==0).sort((p,q)=>Math.hypot(p.x-c.x,p.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y))[0];
    bw.scouts.push({x:c.x+150,y:c.y-120,to:near.id,trail:0,fid:0}); bw.aiScouts.push({x:c.x+260,y:c.y-140,tx:c.x-500,ty:c.y,fid:1});
    bw.armies.push({owner:0,type:'spear',count:700,x:c.x+200,y:c.y-40,to:-1,tx:c.x+200,ty:c.y-40,trail:0,camped:true,food:60,retreatT:1e6},{owner:0,type:'spear',count:700,x:c.x+330,y:c.y-40,to:-1,tx:c.x+900,ty:c.y-40,trail:0,food:60,prep:1e6,prep0:2e6});
    window.__art=setInterval(()=>{ if(__ltm.bw!==bw){ clearInterval(window.__art); return; } bw.rallyMark={x:c.x+420,y:c.y-100,t:1,big:(performance.now()/1500|0)%2===1}; for(const n of bw.nodes){ if(n.owner!==0) n.scoutT=bw.time; }
      for(const s of bw.scouts){ s.x=c.x+150; s.y=c.y-120; } bw.addFx(c.x+260,c.y+40,'unit:medic',104,1.2); bw.battleFx(c.x+300,c.y+60,'river',true); },300); });
  for(const z of [1,2.2,0.6,1.4]){ await p.evaluate((z)=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0); bw.zoom=bw.zoomTgt=z; const sc=bw.scale0*z; bw.camX=c.x+300-bw.lastVw/sc/2; bw.camY=c.y+100-bw.lastVh/sc/2; },z); await wait(1800); }
  for(const fx of [0.2,0.5,0.8]){ await p.evaluate((fx)=>{ const bw=__ltm.bw, sc=bw.scale0*bw.zoom; bw.camX=BW.W*fx-bw.lastVw/sc/2; bw.camY=BW.H*0.5-bw.lastVh/sc/2; },fx); await wait(1500); }
  const btn=await p.evaluate(()=>__ltm.bw._gearBtn); if(btn){ await T.tap(btn.x+btn.w/2,btn.y+btn.h/2); await wait(400); }
}
// (5.6) đội vận lương (xe bò) + đủ đồ trang trí trại: mua hết, bật hết, xem trại của ta trong trận
await p.evaluate(()=>{ save.decor={own:{},on:[]}; for(const d of BW_DECOR){ save.decor.own[d.id]=1; save.decor.on.push(d.id); } Save.set(save); });
await T.startBattle({map:6,civ:'rome'},2); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await wait(600);
await p.evaluate(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0); const a={owner:0,type:'spear',count:300,x:c.x+400,y:c.y,food:5,from:0,trail:0,camped:true,to:-1,tx:c.x+400,ty:c.y}; bw.armies.push(a); bw.convoys.push({owner:0,x:c.x+220,y:c.y+60,to:a,pct:40,hx:1,spd:1});
  bw.zoom=bw.zoomTgt=1.2; const sc=bw.scale0*1.2; bw.jumpT=null; bw.camX=Math.max(0,c.x+60-bw.lastVw/sc/2); bw.camY=c.y-bw.lastVh/sc/2; }); await wait(2000);
await p.evaluate(()=>{ stopBigWar(true); openGear(); document.getElementById('bToDecor').click(); }); await wait(600); await scan(); await p.evaluate(()=>showScreen('menu')); await wait(200);
// Quần Hùng
await T.startBattle({royale:36,seed:61,map:1,civ:'rome'},5); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await wait(800);
for(const z of [1,2,0.5]){ await p.evaluate((z)=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=z; },z); await wait(2500); }
for(const fx of [0.15,0.5,0.85]){ await p.evaluate((fx)=>{ const bw=__ltm.bw, sc=bw.scale0*bw.zoom; bw.camX=BW.W*fx-bw.lastVw/sc/2; },fx); await wait(2000); }
await T.tapEl('#bwPause'); await wait(500); await scan(); await T.tapEl('#bResume'); await wait(300);
// (5.7) Chinh phạt: chiến binh bộ lạc + dân binh
for(const st of ['tribe','civil']){ await p.evaluate((st)=>{ G.bwCfg={royale:st==='tribe'?9:17,conq:st,seed:77,civ:'rome',diff:1,bio:1,L:{camp:st==='tribe'?3000:7000}}; startBigWar(5); const bw=__ltm.bw; bw.skipIntro&&bw.skipIntro(); const c=bw.nodes[0];
    for(const [t,dx] of [['tribal',200],['militia',320]]) bw.armies.push({owner:0,type:t,count:900,x:c.x+dx,y:c.y+140,to:-1,tx:c.x+dx,ty:c.y+140,trail:0,camped:true,food:100});
    bw.camX=c.x-bw.lastVw/(bw.scale0*bw.zoom)/2; bw.camY=c.y-bw.lastVh/(bw.scale0*bw.zoom)/2; },st); await wait(1500); }
// (5.6) thua một trận 1v1 → băng DEFEAT
await p.evaluate(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:false}; }); await wait(400); await p.evaluate(()=>{ stopBigWar(true); G.resultShown=false; G.bwCfg={map:0,civ:'rome'}; startBigWar(1); const bw=__ltm.bw; bw.over=true; bw.result={win:false}; }); await wait(2200); await scan(); await p.evaluate(()=>{ document.getElementById('result').classList.add('hidden'); stopBigWar(true); }); await wait(200);
await T.startBattle({royale:36,seed:61,map:1,civ:'rome'},5); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await wait(800);
// thắng trận → màn kết quả
await p.evaluate(()=>{ const bw=__ltm.bw; for(const n of bw.nodes) n.owner=bw.localFid; bw.armies.length=0; bw.checkVictory(); }); await wait(2500); await scan();
// (6.5) chân dung tướng huyền thoại: mở Kho → Generals lần lượt từng nước; món quân nhu mới: mở Kho → Supplies
await p.evaluate(()=>{ try{ stopBigWar&&stopBigWar(true); }catch(e){} showScreen('gens'); for(const c of BW_CIVS){ G.genCiv=c.id; renderGens(); } openGear(); });
await p.waitForTimeout(400);
const out=await p.evaluate(()=>{ const res=[], L=(typeof ART_LIST!=='undefined'? ART_LIST : []).map(a=>Array.isArray(a)? {code:a[0],key:a[1],name:a[4]} : a); for(const a of L){ const im=ArtImages[a.key]; res.push({code:a.code,key:a.key,name:a.name,have:!!im,canvas:!!(im&&window.__used.has(im)),dom:window.__dom.has(a.key)}); }
  const extra=Object.keys(ArtImages).filter(k=>!L.some(a=>a.key===k)).map(k=>({code:'-',key:k,name:'(ngoài danh mục)',have:true,canvas:window.__used.has(ArtImages[k]),dom:window.__dom.has(k)})); return res.concat(extra); });
const skip=await p.evaluate(()=>Object.keys(VN_TEXT_ART));
const have=out.filter(o=>o.have), idle=have.filter(o=>!o.canvas&&!o.dom&&!skip.includes(o.key)), none=out.filter(o=>!o.have), vn=have.filter(o=>skip.includes(o.key));
ok(have.length>=70,`bộ art nạp đủ (${have.length} ảnh)`);
ok(idle.length===0,`mọi ảnh trong bộ art đều được dùng trong game: ${have.length-vn.length-idle.length}/${have.length-vn.length}`+(idle.length? ' — CÒN BỎ KHÔNG: '+idle.map(o=>o.code+' '+o.key).join(', ') : ''));
ok(vn.every(o=>!o.canvas&&!o.dom),`ảnh có chữ tiếng Việt (${vn.map(o=>o.key).join(', ')}) không hiện trong bản tiếng Anh`);
ok(T.errs.length===0,'không lỗi JS'+(T.errs.length? ': '+T.errs[0] : ''));
console.log(`  bộ art: ${out.length} mục · có ảnh ${have.length} · đã hiện ${have.length-vn.length-idle.length} · chờ bản tiếng Anh ${vn.length} · chưa có ảnh ${none.length} (${none.map(o=>o.code).join(', ')})`);
await finish('BỘ ART ĐƯỢC DÙNG HẾT',b);
