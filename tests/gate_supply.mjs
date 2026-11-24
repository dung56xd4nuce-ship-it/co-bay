// LƯƠNG THẢO & ĐẠI QUÂN — như người chơi, chạm thật trên Android + iOS:
// chọn kinh đô 12 000 quân → chạm mục tiêu xa → menu báo "chuẩn bị lương · đi bao lâu" → ra lệnh → quân ĐỨNG GOM LƯƠNG (có đếm ngược nhìn thấy được)
// → đi tới nơi KHÔNG hao lính vì đói → đạo quân đóng xa sắp hết lương thì thấy XE LƯƠNG 🐂 chạy tới → địch chặn đường thì mất xe lương.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of [DEVICES[0],DEVICES[1],PORTRAIT[0]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T; await T.hookDraw();
  await T.startBattle({map:6,civ:'daiviet'},5);
  const W=await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.supplyCap=()=>1e9; bw.time=30; bw.notes=[]; for(const n of bw.nodes){ n.ambush=false; if(n.owner===1&&!n.camp) n.count=Math.min(n.count,30); }
    const c=bw.nodes.find(n=>n.camp&&n.owner===0); c.count=12000; c.type='spear'; c.food=0;
    const far=bw.nodes.filter(n=>n.owner===2&&!n.camp&&bw.findPath('H',c.x,c.y,n.x,n.y).ok).sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y))[0]; far.count=1;
    return {c:[c.x,c.y,c.id],far:[far.x,far.y,far.id],dist:Math.round(Math.hypot(far.x-c.x,far.y-c.y))}; });
  await p.waitForTimeout(400);
  // 1) chọn kinh đô bằng cách chạm vào nó
  await T.aim(W.c[0],W.c[1]); await T.settle(); let s=await T.scr(W.c[0],W.c[1]); await T.tap(s[0],s[1]);
  ok(await T.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,W.c[2],2500),'chạm kinh đô (12 000 quân) → chọn được');
  // 2) kéo bản đồ tới mục tiêu xa rồi chạm → menu lệnh có DÒNG DỰ BÁO hậu cần
  await T.aim(W.far[0],W.far[1]); await T.settle(); s=await T.scr(W.far[0],W.far[1]); await T.tap(s[0],s[1]);
  const menu=await T.until(()=>{ const m=__ltm.bw.menu; return m? {info:m.info? m.info.s : '',warn:m.info&&m.info.warn,opts:m.opts.map(o=>o.id)} : null; });
  ok(!!menu&&/prep \d+s/.test(menu.info)&&/march ~\d+s/.test(menu.info),`chạm mục tiêu cách ${W.dist}px → menu báo trước: "${menu?menu.info:''}"`);
  const seen=await T.drawn(/prep \d+s/); ok(seen.length>0&&seen[0].f>=10,`dòng dự báo được VẼ trên màn hình, cỡ chữ ${seen[0]?seen[0].f.toFixed(0):0}px`);
  const prepS=menu? +(menu.info.match(/prep (\d+)s/)||[0,0])[1] : 0, marchS=menu? +(menu.info.match(/march ~(\d+)s/)||[0,0])[1] : 0;
  // 3) chạm "Attack / March" (đúng chỗ dòng lệnh được vẽ)
  const btn=(await T.drawn(/^(⚔️ Attack|🏃 March)/))[0]; ok(!!btn,'thấy dòng lệnh tấn công/hành quân trong menu'); if(btn) await T.tap(btn.x+40,btn.y-5);
  const A=await T.until(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.count>=12000); return a? {prep:a.prep||0,prep0:a.prep0||0,x:a.x,y:a.y} : null; });
  // so với thời gian chuẩn bị BAN ĐẦU (prep0): lúc máy thử bận, bài thử đọc muộn vài giây thì số đếm ngược đã trôi
  ok(!!A&&A.prep>0&&A.prep0>=prepS-1.2&&A.prep0<=prepS+0.2&&prepS>=5,`ra lệnh xong: 12 000 quân đứng trước cổng CHUẨN BỊ LƯƠNG ${A?A.prep0.toFixed(1):'?'}s (menu báo ${prepS}s)`);
  // 4) người chơi NHÌN THẤY đếm ngược; trong lúc đó quân chưa đi
  await T.ev(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=1; }); if(A){ await T.aim(A.x,A.y); await T.settle(); }
  const b1=await T.drawn(/^🌾 \d+s$/); await p.waitForTimeout(1500); const b2=await T.drawn(/^🌾 \d+s$/);
  const n1=b1[0]? +b1[0].t.match(/\d+/)[0] : -1, n2=b2[0]? +b2[0].t.match(/\d+/)[0] : -1;
  ok(n1>0&&n2>0&&n2<n1,`thấy đồng hồ đếm ngược dưới đạo quân: "🌾 ${n1}s" → "🌾 ${n2}s" (cỡ chữ ${b1[0]?b1[0].f.toFixed(1):0}px trên màn hình)`);
  const A1=await T.ev(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.count>=12000); return a? {x:a.x,y:a.y,prep:a.prep} : null; });
  ok(A1&&A1.prep>0&&Math.hypot(A1.x-A.x,A1.y-A.y)<1,'đang chuẩn bị lương thì đạo quân đứng yên trước cổng');
  // 5) chạm vào đạo quân → thẻ binh chủng ghi "preparing"
  if(A1){ s=await T.scr(A1.x,A1.y-40); await T.tap(s[0],s[1]); await p.waitForTimeout(250); const chip=await T.drawn(/preparing \d+s/); ok(chip.length>0,'chạm đạo quân đang gom lương → thẻ ghi "🌾 preparing …s"'+(chip[0]?'':' (không thấy)')); }
  // 6) hết giờ chuẩn bị: quân xuất phát, đi chậm hơn đạo nhỏ, tới nơi nguyên vẹn
  const R=await T.ev(([fid])=>{ const bw=__ltm.bw; G.paused=true; const a=bw.armies.find(a=>a.owner===0&&a.count>=12000); const t0=bw.time, x0=a.x, y0=a.y; let tDep=null, minF=100;
    for(let k=0;k<6000&&!a.done&&a.count>0;k++){ bw.update(0.05); if(tDep==null&&Math.hypot(a.x-x0,a.y-y0)>4) tDep=bw.time-t0; minF=Math.min(minF,a.food??100); }
    const n=bw.nodes[fid]; G.paused=false; return {tDep,t:bw.time-t0,done:a.done,own:n.owner,cnt:Math.round(n.count),minF:Math.round(minF)}; },[W.far[2]]);
  ok(R.done&&R.own===0&&R.cnt>=12000,`đại quân tới nơi sau ${Math.round(R.t)}s, còn nguyên ${R.cnt} quân (trước v5.0: hao tới 25–40% vì đói giữa đường); lương thấp nhất ${R.minF}%`);
  ok(Math.abs((R.t-(R.tDep||0))-marchS)<=Math.max(6,marchS*0.2),`thời gian đi thực ${Math.round(R.t-(R.tDep||0))}s khớp dự báo trong menu (~${marchS}s)`);
  // 7) ĐỘI VẬN LƯƠNG: một đạo 3 000 quân đóng ngoài đồng, lương tụt còn 28% → kinh đô cho xe lương chạy tới
  const C=await T.ev(()=>{ const bw=__ltm.bw; G.paused=true; const c=bw.nodes.find(n=>n.camp&&n.owner===0); c.food=500; bw.armies=bw.armies.filter(a=>a.owner!==0); bw.sel=null; bw.selA=null; bw.menu=null;
    let spot=null; for(const gap of [380,280,220]){ for(let r=1900;r<3400&&!spot;r+=100) for(let an=0;an<6.28;an+=0.15){ const x=c.x+Math.cos(an)*r, y=c.y+Math.sin(an)*r; if(x<250||y<300||x>BW.W-250||y>BW.H-160) continue; if(bw.terAt(x,y)==='plain'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<gap)&&bw.findPath('F',c.x,c.y,x,y).ok){ spot=[x,y]; break; } } if(spot) break; }
    const a={owner:0,type:'spear',count:3000,x:spot[0],y:spot[1],to:-1,tx:spot[0],ty:spot[1],trail:0,camped:true,food:28}; bw.armies.push(a); bw.update(5.01); G.paused=false;
    const cv=bw.convoys[0]; return {spot,cv:cv? [cv.x,cv.y,Math.round(cv.pct)] : null,dist:Math.round(Math.hypot(spot[0]-c.x,spot[1]-c.y)),stock:Math.round(c.food)}; });
  ok(!!C.cv,`đạo quân đóng cách kinh đô ${C.dist}px còn 28% lương → có ĐỘI VẬN LƯƠNG xuất phát (kho còn ${C.stock})`);
  if(C.cv){ await T.ev(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=1.2; G.paused=true; }); await p.waitForTimeout(200); await T.aim(C.cv[0],C.cv[1]); await T.settle();
    const lab=await T.drawn(/^🌾 \+\d+$/); ok(lab.length>0,`NHÌN THẤY xe lương trên bản đồ, nhãn "${lab[0]?lab[0].t:''}" (cỡ chữ ${lab[0]?lab[0].f.toFixed(1):0}px)`);
    const note=await T.drawn(/convoy/); ok(note.some(e=>/on its way/.test(e.t)||/convoy/i.test(e.t)),'có thông báo "quân sắp hết lương — xe lương đang tới"');
    // chọn đạo quân → thẻ ghi "convoy coming"
    await T.ev(()=>{ G.paused=false; }); await T.aim(C.spot[0],C.spot[1]); await T.settle(); s=await T.scr(C.spot[0],C.spot[1]-40); await T.ev(()=>{ __ltm.bw.notes=[]; }); await T.tap(s[0],s[1]); await p.waitForTimeout(250);
    const chip2=await T.drawn(/convoy coming/); ok(chip2.length>0,'chạm đạo quân → thẻ ghi "🐂 convoy coming"');
    const D=await T.ev(()=>{ const bw=__ltm.bw; G.paused=true; const a=bw.armies.find(a=>a.owner===0&&a.count===3000); let t=0; while(bw.convoys.length&&t<150){ bw.update(0.05); t+=0.05; } G.paused=false; return {t,food:Math.round(a.food),cnt:a.count,cv:bw.convoys.length}; });
    ok(D.cv===0&&D.food>=85&&D.cnt===3000,`xe lương tới nơi sau ${Math.round(D.t)}s: lương đạo quân lên ${D.food}%, không ai đào ngũ`);
    // 8) địch chặn đường tiếp tế → mất xe lương, có thông báo
    const E=await T.ev(()=>{ const bw=__ltm.bw; G.paused=true; const c=bw.nodes.find(n=>n.camp&&n.owner===0); c.food=500; const a=bw.armies.find(a=>a.owner===0&&a.count===3000); a.food=25; a._cvT=0; bw.notes=[]; bw.update(5.01); for(let k=0;k<60;k++) bw.update(0.05);
      const cv=bw.convoys[0]; if(!cv) return null; const e={owner:1,type:'cavalry',count:150,x:cv.x+30,y:cv.y+10,to:-1,tx:cv.x+30,ty:cv.y+10,trail:0,camped:true,food:50}; bw.armies.push(e); const f0=a.food; bw.update(0.05); G.paused=false;
      return {left:bw.convoys.length,ef:Math.round(e.food),af:Math.round(a.food),f0:Math.round(f0),notes:bw.notes.map(n=>n.text)}; });
    ok(E&&E.left===0&&E.ef>50&&E.af<=E.f0,`kỵ binh địch áp sát đoàn xe → CƯỚP LƯƠNG (địch 50 → ${E?E.ef:'?'}%), quân ta vẫn đói`);
    ok(E&&E.notes.some(t=>/captured/.test(t)),'người chơi được BÁO mất xe lương'+(E?': "'+(E.notes.find(t=>/captured/.test(t))||'')+'"':''));
    await p.waitForTimeout(250); const nd=await T.drawn(/captured/); ok(nd.length>0,'thông báo mất xe lương hiện trên màn hình'); }
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs.slice(0,3).join(' | '):''));
  await T.ctx.close(); }
// Quần Hùng: lệnh đi QUÁ XA so với lương mang theo → menu cảnh báo trước
{ const T=await open(b,DEVICES[0][1]); const {p}=T; await T.hookDraw(); await T.startBattle({royale:36,seed:91,map:2,civ:'rome'},5);
  const W=await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; if(bw.aiDiplomacy) bw.aiDiplomacy=()=>{}; bw.supplyCap=()=>1e9; bw.time=30; bw.notes=[]; const c=bw.nodes.find(n=>n.camp&&n.owner===0); c.count=20000; c.type='swordsman';
    const far=bw.nodes.filter(n=>n.owner===2&&!n.camp).sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y))[0]; return {c:[c.x,c.y,c.id],far:[far.x,far.y,far.id],dist:Math.round(Math.hypot(far.x-c.x,far.y-c.y))}; });
  await T.aim(W.c[0],W.c[1]); await T.settle(); let s=await T.scr(W.c[0],W.c[1]); await T.tap(s[0],s[1]); await T.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,W.c[2],2500);
  await T.aim(W.far[0],W.far[1]); await T.settle(); s=await T.scr(W.far[0],W.far[1]); await T.tap(s[0],s[1]);
  const menu=await T.until(()=>{ const m=__ltm.bw.menu; return m&&m.info? {s:m.info.s,warn:m.info.warn} : null; });
  ok(!!menu&&menu.warn&&/food for \d+% of the way/.test(menu.s),`Quần Hùng: 20 000 quân đi ${W.dist}px → menu CẢNH BÁO: "${menu?menu.s:''}"`);
  const wd=await T.drawn(/food for \d+%/); ok(wd.length>0,'dòng cảnh báo lương được vẽ trong menu');
  const R=await T.ev(()=>({m:__ltm.bw._orderMenu,vw:innerWidth,vh:innerHeight})); ok(R.m&&R.m.x>=0&&R.m.y>=0&&R.m.x+R.m.w<=R.vw&&R.m.y+R.m.h<=R.vh,'menu có dòng cảnh báo vẫn nằm trọn trong màn hình');
  ok(T.errs.length===0,'Quần Hùng: không lỗi JS'); await T.ctx.close(); }
// (5.1) CHỈ RỜI CỨ ĐIỂM CÓ KHO (trại / thành / kho lương) MỚI PHẢI CHUẨN BỊ LƯƠNG — quân đóng ở đất trống hay ngoài đồng thì đi ngay, chặng ngắn gần như không chờ
for(const [dn,dev] of [DEVICES[0],PORTRAIT[1]]){ console.log(dn+' · chuẩn bị lương chỉ khi rời cứ điểm có kho');
  const T=await open(b,dev); const {p}=T; await T.hookDraw(); await T.startBattle({map:6,civ:'daiviet'},5);
  const W=await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.supplyCap=()=>1e9; bw.time=30; bw.notes=[]; for(const n of bw.nodes){ n.ambush=false; if(n.owner!==0&&!n.camp) n.count=Math.min(n.count,30); }
    const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), cap=bw.nodes.find(n=>n.camp&&n.owner===0);
    const near=(n)=>bw.nodes.filter(m=>m!==n&&!m.camp&&d(m,n)<900&&bw.findPath('H',n.x,n.y,m.x,m.y).ok).sort((a,b)=>d(a,n)-d(b,n))[0];
    const land=bw.nodes.filter(n=>!n.camp&&!n.struct&&!n.eco&&near(n)).sort((a,b)=>d(a,cap)-d(b,cap))[0], nb=near(land);
    land.owner=0; land.count=8000; land.type='spear'; nb.owner=2; nb.count=1; nb.type='spear';
    const capNb=near(cap); if(capNb!==land){ capNb.owner=2; capNb.count=1; } cap.count=8000; cap.type='spear'; bw._updateVision();
    return {land:[land.x,land.y,land.id],nb:[nb.x,nb.y,nb.id],dist:Math.round(d(land,nb)),depot:bw.hasDepot(land),cap:[cap.x,cap.y,cap.id],capNb:[capNb.x,capNb.y,capNb.id],capDist:Math.round(d(cap,capNb)),capDepot:bw.hasDepot(cap)}; });
  ok(!W.depot&&W.capDepot,'đất trống không có kho lương; đại bản doanh thì có');
  await p.waitForTimeout(400);
  // 1) 8 000 quân đóng ở ĐẤT TRỐNG đánh sang cứ điểm sát bên: menu không báo "prep", ra lệnh là đi ngay, không có đồng hồ đếm ngược
  await T.aim(W.land[0],W.land[1]); await T.settle(); let s=await T.scr(W.land[0],W.land[1]); await T.tap(s[0],s[1]);
  ok(await T.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,W.land[2],2500),'chạm cứ điểm đất trống (8 000 quân) → chọn được');
  await T.aim(W.nb[0],W.nb[1]); await T.settle(); s=await T.scr(W.nb[0],W.nb[1]); await T.tap(s[0],s[1]);
  const m1=await T.until(()=>{ const m=__ltm.bw.menu; return m? {info:m.info? m.info.s : ''} : null; });
  ok(!!m1&&!/prep/.test(m1.info),`chạm cứ điểm cách ${W.dist}px → menu KHÔNG báo thời gian chuẩn bị lương ("${m1?m1.info:''}")`);
  let btn=(await T.drawn(/^(⚔️ Attack|🏃 March)/))[0]; ok(!!btn,'thấy dòng lệnh tấn công/hành quân'); if(btn) await T.tap(btn.x+40,btn.y-5);
  const A=await T.until(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.count>=8000); return a? {prep:a.prep||0,x:a.x,y:a.y} : null; });
  ok(!!A&&A.prep===0,`ra lệnh xong: 8 000 quân rời đất trống đi NGAY, không chờ gom lương (chờ ${A?A.prep:'?'}s)`);
  const cd=await T.drawn(/^🌾 \d+s$/); ok(cd.length===0,'không có đồng hồ đếm ngược "🌾 …s" nào hiện ra');
  const mv=await T.until(([x,y])=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.count>=8000); return !a||Math.hypot(a.x-x,a.y-y)>6||a.done; },[A?A.x:0,A?A.y:0],3000);
  ok(mv,'trong 3 giây đạo quân đã rời chỗ');
  // 2) đạo quân đang đóng NGOÀI ĐỒNG nhận lệnh đi xa: cũng không chờ
  const F=await T.ev(()=>{ const bw=__ltm.bw; bw.armies=bw.armies.filter(a=>a.owner!==0); bw.sel=null; bw.selA=null; bw.menu=null; bw.notes=[]; const cap=bw.nodes.find(n=>n.camp&&n.owner===0);
    let spot=null; for(let r=500;r<1500&&!spot;r+=100) for(let an=0;an<6.28;an+=0.2){ const x=cap.x+Math.cos(an)*r, y=cap.y+Math.sin(an)*r; if(x<250||y<300||x>BW.W-250||y>BW.H-160) continue; if(bw.terAt(x,y)==='plain'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<300)){ spot=[x,y]; break; } }
    const a={owner:0,type:'spear',count:9000,x:spot[0],y:spot[1],to:-1,tx:spot[0],ty:spot[1],trail:0,camped:true,food:100}; bw.armies.push(a);
    const far=bw.nodes.filter(n=>n.owner===2&&!n.camp&&bw.findPath('H',a.x,a.y,n.x,n.y).ok).sort((p,q)=>Math.hypot(q.x-a.x,q.y-a.y)-Math.hypot(p.x-a.x,p.y-a.y))[0]; far.count=1;
    return {spot,far:[far.x,far.y,far.id],dist:Math.round(Math.hypot(far.x-a.x,far.y-a.y))}; });
  await p.waitForTimeout(300); await T.aim(F.spot[0],F.spot[1]); await T.settle(); s=await T.scr(F.spot[0],F.spot[1]-40); await T.tap(s[0],s[1]);
  ok(await T.until(()=>!!(__ltm.bw.selA&&__ltm.bw.selA.count===9000),null,2500),'chạm đạo quân 9 000 đóng ngoài đồng → chọn được');
  await T.aim(F.far[0],F.far[1]); await T.settle(); s=await T.scr(F.far[0],F.far[1]); await T.tap(s[0],s[1]);
  const m2=await T.until(()=>{ const m=__ltm.bw.menu; return m? {info:m.info? m.info.s : ''} : null; });
  ok(!!m2&&!/prep/.test(m2.info),`đạo quân ngoài đồng đi ${F.dist}px → menu không báo chuẩn bị lương ("${m2?m2.info:''}")`);
  btn=(await T.drawn(/^(⚔️ Attack|🏃 March)/))[0]; if(btn) await T.tap(btn.x+40,btn.y-5);
  const B=await T.until(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.count===9000&&!a.camped); return a? {prep:a.prep||0} : null; });
  ok(!!B&&B.prep===0,`đạo quân ngoài đồng nhận lệnh là đi ngay (chờ ${B?B.prep:'?'}s)`);
  // 3) rời ĐẠI BẢN DOANH sang cứ điểm sát bên: chặng ngắn gần như không phải chờ
  const C=await T.ev(()=>{ const bw=__ltm.bw; bw.armies=bw.armies.filter(a=>a.owner!==0); bw.sel=null; bw.selA=null; bw.menu=null; const cap=bw.nodes.find(n=>n.camp&&n.owner===0); cap.count=8000; return {fc:bw.supplyForecast(cap,0,0,true)&&null}; });
  await T.aim(W.cap[0],W.cap[1]); await T.settle(); s=await T.scr(W.cap[0],W.cap[1]); await T.tap(s[0],s[1]); await T.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,W.cap[2],2500);
  await T.aim(W.capNb[0],W.capNb[1]); await T.settle(); s=await T.scr(W.capNb[0],W.capNb[1]); await T.tap(s[0],s[1]);
  const m3=await T.until(()=>{ const m=__ltm.bw.menu; if(!m) return null; const bw=__ltm.bw, cap=bw.nodes.find(n=>n.camp&&n.owner===0), t=bw.nodes[m.tgt&&m.tgt.id!=null? m.tgt.id : -1]; return {info:m.info? m.info.s : ''}; });
  const p3=m3? +((m3.info.match(/prep (\d+)s/)||[0,0])[1]) : 99;
  ok(!!m3&&p3<=3,`8 000 quân rời đại bản doanh sang cứ điểm cách ${W.capDist}px: chuẩn bị tối đa 3 giây (menu: "${m3?m3.info:''}")`);
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs.slice(0,3).join(' | '):''));
  await T.ctx.close(); }
await finish('LƯƠNG THẢO & ĐẠI QUÂN',b);
