// ĐIỀU KHIỂN CẢM ỨNG TRONG TRẬN — chạm thật (CDP) trên Android + iOS, ngang + dọc.
// Điểm mấu chốt: toạ độ chạm lấy từ CHỖ HÌNH ĐƯỢC VẼ RA (bảng quân số trên canvas), không lấy từ công thức của game —
// để bắt được loại lỗi "hình vẽ một nơi, vùng chạm một nẻo" (lỗi màn dọc lệch 57px trước v5.0).
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
const hook=(T)=>T.ev(()=>{ if(window.__hooked) return; window.__hooked=1; const P=CanvasRenderingContext2D.prototype, ft=P.fillText; window.__dr=[]; window.__seq=0;
  const K=(c)=>c.canvas.width/c.canvas.getBoundingClientRect().width;
  const rr0=window.rr; window.rr=function(c,x,y,w,h,r){ if(c.canvas.id==='game'){ const tr=c.getTransform(), k=K(c); window.__dr.push({k:'b',s:window.__seq++,x:(x*tr.a+tr.e)/k,y:(y*tr.d+tr.f)/k,w:w*tr.a/k,h:h*tr.d/k}); } return rr0.apply(this,arguments); };
  P.fillText=function(t,x,y){ if(this.canvas.id==='game'){ const tr=this.getTransform(), k=K(this); window.__dr.push({k:'t',s:window.__seq++,t:String(t),x:(x*tr.a+tr.e)/k,y:(y*tr.d+tr.f)/k}); if(window.__dr.length>6000) window.__dr.splice(0,3000); } return ft.apply(this,arguments); }; });
// tâm BẢNG QUÂN SỐ (đúng như vẽ trên màn hình) của dòng chữ `txt`
const plateOf=async(T,txt)=>{ await T.ev(()=>{ window.__dr.length=0; }); await T.p.waitForTimeout(140);
  return T.ev((txt)=>{ const D=window.__dr; for(let i=D.length-1;i>=0;i--){ const e=D[i]; if(e.k!=='t'||e.t!==txt) continue; for(let j=i-1;j>=Math.max(0,i-6);j--){ const q=D[j]; if(q.k==='b'&&e.x>=q.x-2&&e.x<=q.x+q.w+2&&e.y>=q.y-4&&e.y<=q.y+q.h+4&&q.h>3) return [q.x+q.w/2,q.y+q.h/2,q.w,q.h]; } } return null; },txt); };
const runDevice=async(dn,dev,portrait)=>{ console.log(dn);
  for(const mode of ['1v1','royale']){
    const T=await open(b,dev); const {p}=T; await hook(T);
    await T.startBattle(mode==='royale'? {royale:36,seed:91,map:2,civ:'rome'} : {map:3,civ:'rome'}, mode==='royale'?5:3);
    await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.notes=[]; bw.time=30; }); await p.waitForTimeout(600);
    const tag=`${mode}${portrait?' dọc':''}`;
    // A) CHẠM ĐÚNG CHỖ NHÌN THẤY: mỗi mức zoom, chạm vào bảng quân số của một đội quân ta → phải chọn đúng đội đó
    for(const z of [1,0.62,1.8]){
      const u=await T.ev((z)=>{ const bw=__ltm.bw; bw.sel=null; bw.selA=null; bw.selG=null; bw.menu=null; bw.zoom=bw.zoomTgt=z; const n=bw.nodes.filter(n=>n.owner===0&&!n.camp&&n.count>0)[1]||bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0);
        n.count=Math.round(n.count)+0; if(bw.nodes.filter(m=>m.owner===0&&Math.round(m.count)===Math.round(n.count)).length>1) n.count+=7; const sc=bw.scale0*z; bw.camX=n.x-bw.lastVw/sc/2; bw.camY=n.y-bw.lastVh/sc/2; return {id:n.id,txt:String(Math.round(n.count))}; },z);
      await p.waitForTimeout(350); const pl=await plateOf(T,u.txt);
      if(!ok(!!pl,`${tag} zoom ${z}: thấy bảng quân số "${u.txt}" vẽ trên màn hình`)) continue;
      await T.tap(pl[0],pl[1]); await p.waitForTimeout(220);
      ok(await T.ev((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,u.id),`${tag} zoom ${z}: chạm vào bảng quân số (tại ${Math.round(pl[0])},${Math.round(pl[1])}) → chọn đúng đội quân đó`);
      await T.tap(pl[0],pl[1]+pl[3]*0.5+28*(await T.ev(()=>__ltm.bw.scale))); await p.waitForTimeout(150); } // (chạm lại vào thân quân: không được làm hỏng gì)
    // B) RA LỆNH: chọn → chạm đất trống → menu → March here → quân lên đường tới ĐÚNG điểm chạm
    const B=await T.ev(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=1; bw.sel=null; bw.selA=null; bw.menu=null; const c0=bw.nodes[0];
      const a={owner:0,type:'spear',count:333,x:c0.x+210,y:c0.y+120,to:-1,tx:c0.x+210,ty:c0.y+120,trail:0,food:100,camped:true}; bw.armies.push(a); window.__a=a;
      let tgt=null; for(let r=260;r<700&&!tgt;r+=40) for(let an=0;an<6.28;an+=0.4){ const x=a.x+Math.cos(an)*r, y=a.y+Math.sin(an)*r; if(x<120||y<240||x>BW.W-120||y>BW.H-120) continue; if(bw.terAt(x,y)==='plain'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<170)&&!bw.armies.some(q=>q!==a&&Math.hypot(q.x-x,q.y-y)<170)&&bw.canReach(a,x,y).ok){ tgt=[x,y]; break; } }
      const sc=bw.scale; bw.camX=(a.x+tgt[0])/2-bw.lastVw/sc/2; bw.camY=(a.y+tgt[1])/2-bw.lastVh/sc/2; return {tgt}; });
    await p.waitForTimeout(350); let pl=await plateOf(T,'333'); ok(!!pl,`${tag}: thấy đạo quân 333 trên màn hình`);
    if(pl){ await T.tap(pl[0],pl[1]); await p.waitForTimeout(220); ok(await T.ev(()=>__ltm.bw.selA===window.__a),`${tag}: chạm chọn đạo quân dã ngoại`);
      const s=await T.scr(B.tgt[0],B.tgt[1]); await T.tap(s[0],s[1]); await p.waitForTimeout(120);
      const mr=(await T.until(()=>{ const R=(__ltm.bw._menuRects||[]); return R.length? R.map(r=>({id:r.id,x:r.x+r.w/2,y:r.y+r.h/2,ok:r.x>=0&&r.y>=0&&r.x+r.w<=__ltm.bw.lastVw&&r.y+r.h<=__ltm.bw.lastVh})) : null; },null,3000))||[];   // chờ menu được vẽ (máy thử bận thì khung hình tới chậm)
      ok(mr.some(r=>r.id==='move')&&mr.every(r=>r.ok),`${tag}: chạm đất trống → hiện menu lệnh nằm trọn trong màn hình`);
      const mv=mr.find(r=>r.id==='move'); if(mv){ await T.tap(mv.x,mv.y); await p.waitForTimeout(500);
        const st=await T.ev((tgt)=>{ const a=window.__a; return {camped:!!a.camped,d:Math.hypot((a.tx??a.x)-tgt[0],(a.ty??a.y)-tgt[1]),path:(a.path||[]).length}; },B.tgt);
        ok(!st.camped&&st.d<14&&st.path>=1,`${tag}: quân lên đường, đích lệch điểm chạm ${st.d.toFixed(0)}px (<14)`); } }
    // C) KÉO BẢN ĐỒ: 1 ngón kéo 140px → máy quay đi đúng chừng đó, không giật
    const vw=await T.ev(()=>__ltm.bw.lastVw), vh=await T.ev(()=>__ltm.bw.lastVh), cx=vw*0.5, cy=vh*0.55;
    await T.ev(()=>{ const bw=__ltm.bw; bw.sel=null; bw.selA=null; bw.menu=null; bw.camX=1200; bw.camY=(bw.lastVh/bw.scale>BW.H)? (BW.H-bw.lastVh/bw.scale)/2 : 200; }); await p.waitForTimeout(200);
    let c0=await T.ev(()=>[__ltm.bw.camX,__ltm.bw.camY,__ltm.bw.scale]); await T.drag(cx,cy,cx-140,cy-60,12); await p.waitForTimeout(200); let c1=await T.ev(()=>[__ltm.bw.camX,__ltm.bw.camY]);
    const ex=140/c0[2], ey=60/c0[2]; ok(Math.abs((c1[0]-c0[0])-ex)<ex*0.15+8&&Math.abs((c1[1]-c0[1])-ey)<ey*0.2+8,`${tag}: kéo 140×60px → máy quay dịch ${Math.round(c1[0]-c0[0])}×${Math.round(c1[1]-c0[1])} (mong ${Math.round(ex)}×${Math.round(ey)})`);
    ok(await T.ev(()=>!__ltm.bw.menu&&!__ltm.bw.sel&&!__ltm.bw.selA),`${tag}: kéo bản đồ không chọn nhầm/không bật menu`);
    // D) CHỤM/MỞ 2 NGÓN: zoom tăng giảm, điểm giữa hai ngón đứng yên
    const w0=await T.ev(([x,y])=>{ const bw=__ltm.bw; return [x/bw.scale+bw.camX,y/bw.scale+bw.camY,bw.zoom]; },[cx,cy]);
    await T.pinch(cx,cy,90,220,12); await p.waitForTimeout(450); const w1=await T.ev(([x,y])=>{ const bw=__ltm.bw; return [x/bw.scale+bw.camX,y/bw.scale+bw.camY,bw.zoom]; },[cx,cy]);
    ok(w1[2]>w0[2]*1.5,`${tag}: mở 2 ngón → phóng to (${w0[2].toFixed(2)} → ${w1[2].toFixed(2)})`); ok(Math.hypot(w1[0]-w0[0],w1[1]-w0[1])<70,`${tag}: điểm giữa hai ngón gần như đứng yên (trôi ${Math.round(Math.hypot(w1[0]-w0[0],w1[1]-w0[1]))}px bản đồ)`);
    await T.pinch(cx,cy,220,90,12); await p.waitForTimeout(450); ok(await T.ev((z)=>__ltm.bw.zoom<z*0.7,w1[2]),`${tag}: chụm 2 ngón → thu nhỏ`);
    // E) GIỮ RỒI KÉO: quét chọn nhiều đạo quân
    const E=await T.ev(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=1; bw.sel=null; bw.selA=null; bw.selG=null; bw.menu=null; const c=bw.nodes[0]; const mk=(dx,dy,cnt)=>{ const a={owner:0,type:'archer',count:cnt,x:c.x+500+dx,y:c.y-260+dy,to:-1,trail:0,food:100,camped:true}; a.tx=a.x; a.ty=a.y; bw.armies.push(a); return a; };
      window.__g=[mk(0,0,211),mk(150,40,212),mk(60,150,213)]; const sc=bw.scale0; bw.camX=c.x+560-bw.lastVw/sc/2; bw.camY=c.y-200-bw.lastVh/sc/2; return 1; });
    await p.waitForTimeout(400); const g=[await plateOf(T,'211'),await plateOf(T,'212'),await plateOf(T,'213')];
    if(ok(g.every(Boolean),`${tag}: thấy 3 đạo quân thử trên màn hình`)){ const x0=Math.min(...g.map(q=>q[0]))-45, y0=Math.min(...g.map(q=>q[1]))-40, x1=Math.max(...g.map(q=>q[0]))+45, y1=Math.max(...g.map(q=>q[1]))+70;
      await T.drag(x0,y0,x1,y1,14,480); await p.waitForTimeout(250);
      ok(await T.ev(()=>__ltm.bw.selG&&window.__g.every(a=>__ltm.bw.selG.includes(a))),`${tag}: giữ 0.5s rồi kéo khung → chọn đủ 3 đạo quân`); }
    // F) nút + / − , bản đồ nhỏ, 📣 gọi quân
    const R=await T.ev(()=>{ const bw=__ltm.bw; bw.sel=null; bw.selA=null; bw.selG=null; bw.menu=null; bw.zoom=bw.zoomTgt=1; return bw.hudRects(); }); await p.waitForTimeout(200);
    const mid=(r)=>[r.x+r.w/2,r.y+r.h/2]; let z0=await T.ev(()=>__ltm.bw.zoomTgt); await T.tap(...mid(R['nút +'])); await p.waitForTimeout(300); let z1=await T.ev(()=>__ltm.bw.zoomTgt); ok(z1>z0*1.2,`${tag}: nút ＋ phóng to`);
    await T.tap(...mid(R['nút −'])); await p.waitForTimeout(300); ok(await T.ev((z)=>__ltm.bw.zoomTgt<z*0.9,z1),`${tag}: nút － thu nhỏ`);
    const m=R['bản đồ nhỏ']; c0=await T.ev(()=>__ltm.bw.camX); await T.tap(m.x+m.w*0.8,m.y+m.h*0.5); await p.waitForTimeout(300); ok(await T.ev((c)=>Math.abs(__ltm.bw.camX-c)>800,c0),`${tag}: chạm bản đồ nhỏ → máy quay nhảy tới đó`);
    await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; bw.zoom=bw.zoomTgt=1; const hc=bw.homeCam(c.x,c.y,bw.lastVw/bw.scale0,bw.lastVh/bw.scale0); bw.camX=hc[0]; bw.camY=hc[1]; }); await p.waitForTimeout(250);
    const n0=await T.ev(()=>__ltm.bw.armies.filter(a=>a.owner===0&&a.rally).length); let R2=await T.ev(()=>__ltm.bw.hudRects()); await T.tap(...mid(R2['nút 📣'])); await p.waitForTimeout(150);
    const rally=()=>T.until(()=>{ const R=(__ltm.bw._rallyRects||[]); return R.length? R.map(r=>({n:r.n,x:r.x+r.w/2,y:r.y+r.h/2})) : null; },null,1800);
    let rm=(await rally())||[];
    if(!rm.length){ R2=await T.ev(()=>__ltm.bw.hudRects()); await T.tap(...mid(R2['nút 📣'])); await p.waitForTimeout(150); rm=(await rally())||[]; }   // băng "xoay ngang" vừa tự ẩn làm nút dời chỗ đúng lúc chạm → người chơi chạm lại
    if(ok(rm.length===4,`${tag}: nút 📣 mở bảng gọi quân 4 dòng`)){ await T.tap(rm[0].x,rm[0].y); await p.waitForTimeout(250); ok(await T.ev(()=>__ltm.bw.rallyPick===5),`${tag}: chọn "5 trại gần nhất" → chờ chạm điểm tập kết`);
      const c=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes[0]; return [c.x+330,c.y+30]; }); const s=await T.scr(c[0],c[1]); await T.tap(s[0],s[1]); await p.waitForTimeout(350);
      ok(await T.ev((n)=>__ltm.bw.armies.filter(a=>a.owner===0&&a.rally).length>n,n0),`${tag}: chạm điểm tập kết → các trại xuất quân`); }
    ok(T.errs.length===0,`${tag}: không lỗi JS`+(T.errs.length?': '+T.errs[0]:''));
    await T.ctx.close(); }
};
for(const [dn,dev] of DEVICES) await runDevice(dn,dev,false);
for(const [dn,dev] of PORTRAIT) await runDevice(dn,dev,true);
// G) chạm giữa CẢNH MỞ ĐẦU = bỏ qua, máy quay về đúng trại ta
{ const T=await open(b,DEVICES[0][1]); const {p}=T; console.log('cảnh mở đầu');
  await T.ev(()=>{ G.bwCfg={map:5,civ:'rome'}; startBigWar(2); }); await p.waitForTimeout(900);
  ok(await T.ev(()=>!!__ltm.bw.intro),'vào trận có cảnh quay mở đầu'); await T.tap(430,200); await p.waitForTimeout(350);
  const st=await T.ev(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0), sc=bw.scale; return {intro:bw.intro,zoom:bw.zoom,sx:(c.x-bw.camX)*sc,sy:(c.y-bw.camY)*sc,vw:bw.lastVw,vh:bw.lastVh}; });
  ok(st.intro===null&&Math.abs(st.zoom-1)<0.01,'chạm một cái: bỏ qua cảnh quay, về mức zoom chuẩn');
  ok(st.sx>30&&st.sx<st.vw-30&&st.sy>30&&st.sy<st.vh-30,`trại ta nằm trong màn hình (tại ${Math.round(st.sx)},${Math.round(st.sy)}) — không phải tự đi tìm`);
  await T.ctx.close(); }
await finish('ĐIỀU KHIỂN CẢM ỨNG',b);
