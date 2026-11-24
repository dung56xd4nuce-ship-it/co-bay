// ĐỊA HÌNH & ĐƯỜNG ĐI — như người chơi (chạm thật): kỵ binh/đại quân chỉ đi đồng trống + đường cái, bộ binh xuyên rừng,
// sông chỉ qua ở bến; bản đồ vẽ đủ chi tiết ở mọi mức zoom; mọi cứ điểm trên mọi bản đồ đều có đường tới.
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of DEVICES){ console.log(dn);
  const T=await open(b,dev); const {p}=T;
  await T.startBattle({map:3,civ:'rome'},3); await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.notes=[]; bw.time=30; }); await p.waitForTimeout(500);
  // dựng thế: 1 đạo kỵ, 1 đạo bộ nhỏ, 1 đại quân bộ đứng trên đường gần trại; đích là điểm giữa một khu rừng
  const S=await T.ev(()=>{ const bw=__ltm.bw, c0=bw.nodes[0];
    let deep=null, bd=1e9; for(let x=300;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ if([[0,0],[70,0],[-70,0],[0,70],[0,-70]].every(([dx,dy])=>bw.terAt(x+dx,y+dy)==='forest')){ const d=Math.hypot(x-c0.x,y-c0.y); if(d>500&&d<bd){ bd=d; deep=[x,y]; } } }
    const mk=(type,count,dx)=>{ const a={owner:0,type,count,x:c0.x+150+dx,y:c0.y+40,to:-1,tx:c0.x+150+dx,ty:c0.y+40,trail:0,food:100,camped:true}; bw.armies.push(a); return a; };
    window.__cav=mk('cavalry',400,0); window.__foot=mk('spear',380,160); window.__big=mk('spear',2600,320); bw.sel=null; bw.selA=null; return {deep}; });
  ok(!!S.deep,'bản đồ có khu rừng đủ sâu để thử');
  const order=async(name)=>{ const a=await T.ev((name)=>{ const a=window['__'+name]; return {x:a.x,y:a.y}; },name);
    await T.center((a.x+S.deep[0])/2,(a.y+S.deep[1])/2); await T.ev(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=Math.min(1,bw.zoom); }); await p.waitForTimeout(250);
    let s=await T.scr(a.x,a.y-28); await T.tap(s[0],s[1]); await p.waitForTimeout(220);
    const picked=await T.ev((name)=>__ltm.bw.selA===window['__'+name],name);
    s=await T.scr(S.deep[0],S.deep[1]); await T.tap(s[0],s[1]); await p.waitForTimeout(260);
    const menu=await T.ev(()=>__ltm.bw.menu? __ltm.bw.menu.opts.map(o=>o.id+'|'+o.s) : []);
    const mr=await T.ev(()=>(__ltm.bw._menuRects||[]).filter(r=>r.id==='move').map(r=>[r.x+r.w/2,r.y+r.h/2])[0]||null);
    if(mr) await T.tap(mr[0],mr[1]); await p.waitForTimeout(350);
    return {picked,menu,moved:!!mr}; };
  // KỴ BINH
  let o=await order('cav'); ok(o.picked,'chạm chọn được đạo kỵ binh'); ok(o.menu.some(m=>/^move\|.*⛔/.test(m)),'menu báo trước: kỵ binh chỉ tới được BÌA rừng — '+(o.menu[0]||''));
  ok(await T.ev(()=>{ const a=window.__cav; return !a.camped&&a.path&&a.path.length>=1&&a.pathOk===false&&a.pvT>0; }),'ra lệnh xong: có lộ trình (đường nét đứt) dẫn tới bìa rừng');
  ok(await T.ev(()=>__ltm.bw.texts.some(t=>/can't enter/.test(t.s||''))),'hiện dòng báo "⛔ Cavalry can\'t enter Forest"');
  // giữ chân đạo vừa nhận lệnh trong lúc ra lệnh cho các đạo sau: nếu để nó chạy tới sát điểm đích thì cú chạm vào đích sẽ trúng chính nó (ra menu gộp quân) — bài thử không được phụ thuộc máy chạy nhanh hay chậm
  await T.ev(()=>{ window.__cav.holdT=1e9; });
  // BỘ BINH NHỎ + ĐẠI QUÂN
  o=await order('foot'); ok(o.picked&&o.menu.some(m=>/^move\|/.test(m)&&!/⛔/.test(m)),'bộ binh nhỏ: menu cho hành quân thẳng vào rừng');
  await T.ev(()=>{ window.__foot.holdT=1e9; });
  o=await order('big'); ok(o.picked&&o.menu.some(m=>/^move\|.*⛔/.test(m)),'đại quân 2600: menu báo chỉ tới được bìa rừng');
  // cho chạy tới nơi (tua nhanh) và soi vị trí từng khung
  await T.ev(()=>{ window.__cav.holdT=0; window.__foot.holdT=0; });
  const R=await T.ev((deep)=>{ const bw=__ltm.bw, deepIn=(a)=>[[0,0],[45,0],[-45,0],[0,45],[0,-45]].every(([dx,dy])=>bw.terAt(a.x+dx,a.y+dy)==='forest'); let cIn=0,bIn=0,n=0;
    while(n++<20*200&&!(window.__cav.camped&&window.__foot.camped&&window.__big.camped)){ bw.update(0.05); for(const a of [window.__cav,window.__foot,window.__big]) a.food=100; window.__big.count=Math.max(2600,window.__big.count); if(deepIn(window.__cav)) cIn++; if(deepIn(window.__big)) bIn++; }
    const d=(a)=>Math.round(Math.hypot(a.x-deep[0],a.y-deep[1])); return {cIn,bIn,cav:{camped:!!window.__cav.camped,d:d(window.__cav),ter:bw.terAt(window.__cav.x,window.__cav.y)},foot:{camped:!!window.__foot.camped,d:d(window.__foot),amb:!!window.__foot.ambush},big:{camped:!!window.__big.camped,d:d(window.__big),ter:bw.terAt(window.__big.x,window.__big.y)}}; },S.deep);
  ok(R.cav.camped&&R.cIn===0&&R.cav.ter!=='forest'&&R.cav.d>40,`kỵ binh dừng ở bìa rừng (cách đích ${R.cav.d}px, đang đứng trên ${R.cav.ter}), không khung hình nào lọt vào rừng`);
  ok(R.big.camped&&R.bIn===0&&R.big.ter!=='forest',`đại quân dừng ở bìa rừng (cách đích ${R.big.d}px)`);
  ok(R.foot.camped&&R.foot.d<30&&R.foot.amb,`bộ binh nhỏ vào tới GIỮA RỪNG (cách điểm chạm ${R.foot.d}px) và tự mai phục: ${JSON.stringify(R.foot)}`);
  // SÔNG: kỵ binh sang bờ bên kia phải qua bến
  const W=await T.ev(()=>{ const bw=__ltm.bw, c0=bw.nodes[0]; const far=bw.nodes.filter(n=>(n.x<bw.riverX(n.y))!==(c0.x<bw.riverX(c0.y))&&!n.camp).sort((a,b)=>Math.hypot(a.x-c0.x,a.y-c0.y)-Math.hypot(b.x-c0.x,b.y-c0.y))[0];
    const a={owner:0,type:'cavalry',count:300,x:c0.x+60,y:c0.y,to:-1,tx:far.x-70,ty:far.y+90,trail:0,food:100}; far.count=0; bw.armies.push(a); let wet=0, ford=0, n=0;
    while(n++<20*400&&!a.camped&&!a.done){ bw.update(0.05); a.food=100; if(Math.abs(a.x-bw.riverX(a.y))<45){ if(bw.nearBridge(a.x,a.y,BW.fordR+30)) ford++; else wet++; } }
    return {wet,ford,arrived:!!a.camped||!!a.done,side:(a.x<bw.riverX(a.y))!==(c0.x<bw.riverX(c0.y))}; });
  ok(W.arrived&&W.side&&W.ford>0&&W.wet===0,`kỵ binh sang được bờ bên kia, chỉ vượt sông ở BẾN (${W.ford} khung trên bến, ${W.wet} khung lội nước sâu)`);
  // AI cũng chịu luật: cho AI đánh 4 phút, không đạo kỵ/đại quân nào của địch lọt vào rừng núi
  const A=await T.ev(()=>{ const BWc=__ltm.BigWar; const bw=new BWc(6,{map:7,civ:'rome',autoMenu:true}); let bad=0, seen=0, n=0; const deepIn=(a)=>[[0,0],[45,0],[-45,0],[0,45],[0,-45]].every(([dx,dy])=>{ const t=bw.terAt(a.x+dx,a.y+dy); return t==='forest'||t==='mountain'; });
    while(n++<20*240&&!bw.over){ bw.update(0.05); for(const a of bw.armies){ if(a.owner!==1||a.done||a.btl) continue; if(a.type==='cavalry'||a.count>=BW.bigArmy){ seen++; if(deepIn(a)&&bw.mvProfile(a)[0]==='H'&&!(bw.mvProfile(a).length>1)) bad++; } } }
    return {bad,seen}; });
  ok(A.seen>50&&A.bad===0,`quân AI cũng theo luật: ${A.seen} lượt soi kỵ binh/đại quân địch, ${A.bad} lượt lọt sâu vào rừng núi`);
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
  await T.ctx.close(); }
// BẢN ĐỒ VẼ ĐỦ & RÕ (soi điểm ảnh) + mọi bản đồ đều thông đường
{ const T=await open(b,DEVICES[0][1]); const {p}=T; console.log('bản đồ: hình vẽ + thông đường');
  await T.startBattle({map:3,civ:'rome'},3); await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.notes=[]; bw.drawFog=()=>{}; bw.drawHud=()=>{}; }); 
  const px=async(wx,wy)=>{ const s=await T.scr(wx,wy); return T.ev(([x,y])=>{ const cv=document.getElementById('game'), k=cv.width/cv.getBoundingClientRect().width, d=cv.getContext('2d').getImageData(Math.round(x*k)-2,Math.round(y*k)-2,5,5).data; let r=0,g=0,b2=0; for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b2+=d[i+2]; } const n=d.length/4; return [Math.round(r/n),Math.round(g/n),Math.round(b2/n)]; },s); };
  for(const z of [0.45,1,2.4]){ const info=await T.ev((z)=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=z; const r=bw.roads.filter(r=>r.a!=null&&r.b!=null).sort((a,b)=>Math.hypot(b.x2-b.x1,b.y2-b.y1)-Math.hypot(a.x2-a.x1,a.y2-a.y1))[3];
      const mx=r.mx, my=r.my; bw.camX=mx-bw.lastVw/(bw.scale0*z)/2; bw.camY=my-bw.lastVh/(bw.scale0*z)/2;
      let f=null; for(let x=300;x<BW.W&&!f;x+=40) for(let y=260;y<BW.H-100;y+=40){ if([[0,0],[60,0],[-60,0],[0,60],[0,-60]].every(([dx,dy])=>bw.terAtRaw(x+dx,y+dy)==='plain')&&bw.distRoad(x,y)>160&&Math.abs(x-bw.riverX(y))>300&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<200)){ f=[x,y]; break; } }
      return {road:[mx,my],grass:f,river:[bw.riverX(BW.H*0.5),BW.H*0.5]}; },z);
    await p.waitForTimeout(1900);
    const st=await T.ev(()=>({pending:__ltm.bw._mapPending,lod:__ltm.bw._mapLod,tiles:__ltm.bw._map.tiles.size}));
    ok(st.pending===0,`zoom ${z}: bản đồ dựng xong hết ô trong 2 giây (mức chi tiết ${st.lod}, đang nhớ ${st.tiles} ô)`);
    const c=await px(info.road[0],info.road[1]); ok(c[0]>c[1]+12&&c[0]>120,`zoom ${z}: giữa ĐƯỜNG CÁI là màu đất nâu vàng rgb(${c})`);
    if(z>=1){ await T.center(info.grass[0],info.grass[1]); await p.waitForTimeout(900); const g=await px(info.grass[0],info.grass[1]); ok(g[1]>g[0]+10&&g[1]>g[2]+25,`zoom ${z}: đồng bằng là màu cỏ xanh rgb(${g})`);
      await T.center(info.river[0],info.river[1]); await p.waitForTimeout(900); const w=await px(info.river[0],info.river[1]); ok(w[2]>w[0]+40&&w[2]>120,`zoom ${z}: giữa SÔNG là màu nước xanh rgb(${w})`); } }
  const maps=await T.ev(()=>{ const out=[]; const BWc=__ltm.BigWar; for(const [mode,cnt] of [['solo',20],['royale',3]]) for(let m=0;m<cnt;m++){ const bw=new BWc(mode==='royale'?5:1+(m%10), mode==='royale'? {royale:36,seed:61+m,map:m,autoMenu:true}:{map:m,autoMenu:true}); bw.navBuild(); const N=bw.nav; let plain=0; for(let i=0;i<N.n;i++) if(N.ter[i]===0) plain++;
      const C=bw.navCost('H'), seen=new Uint8Array(N.n), q=[bw.navCell(bw.nodes[0].x,bw.nodes[0].y)]; seen[q[0]]=1; while(q.length){ const c=q.pop(), cx=c%N.w, cy=(c/N.w)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=N.w||ny>=N.h) continue; const i=ny*N.w+nx; if(seen[i]||!(C[i]<1e9)) continue; seen[i]=1; q.push(i); } }
      out.push({name:mode+'#'+m+' '+bw.mapName,unreach:bw.nodes.filter(n=>!seen[bw.navCell(n.x,n.y)]).length,plain:Math.round(100*plain/N.n),fords:bw.bridges.length,roads:bw.roads.length,nodes:bw.nodes.length}); } return out; });
  const badMaps=maps.filter(m=>m.unreach>0); ok(badMaps.length===0,`cả ${maps.length} bản đồ: kỵ binh/đại quân tới được MỌI cứ điểm bằng đường cái`+(badMaps.length?' — hỏng: '+badMaps.map(m=>m.name+'('+m.unreach+')').join(', '):''));
  const pl=maps.map(m=>m.plain); ok(Math.min(...pl)>=45&&Math.max(...pl)<=80,`đồng bằng chiếm ${Math.min(...pl)}–${Math.max(...pl)}% mỗi bản đồ (đủ rộng cho kỵ binh, vẫn còn rừng núi để mai phục)`);
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:'')); await T.ctx.close(); }
await finish('ĐỊA HÌNH & ĐƯỜNG ĐI',b);
