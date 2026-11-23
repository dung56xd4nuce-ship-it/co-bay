// ============ Sinh bản đồ theo cấp ============
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash2(x,y,s){ let h = (x*374761393 + y*668265263 + (s|0)*1442695041)|0; h = Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function makeNoise(seed){
  return function(x,y){
    const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const s=(t)=>t*t*(3-2*t);
    const a=hash2(xi,yi,seed), b=hash2(xi+1,yi,seed), c=hash2(xi,yi+1,seed), d=hash2(xi+1,yi+1,seed);
    const u=s(xf), v=s(yf);
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
  };
}
function fbm(n,x,y,oct){ let s=0,a=0.5,f=1,t=0; for(let i=0;i<oct;i++){ s+=a*n(x*f,y*f); t+=a; a*=0.5; f*=2; } return s/t; }

function generateMap(cfg){
  const W=cfg.size, H=cfg.size, N=W*H;
  const rnd = mulberry32(cfg.seed);
  const t = new Uint8Array(N);
  const idx=(x,y)=>y*W+x;
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const cx=W>>1, cy=H>>1;
  const nF=makeNoise(cfg.seed+1), nH=makeNoise(cfg.seed+2), nM=makeNoise(cfg.seed+3), nW=makeNoise(cfg.seed+4), nR=makeNoise(cfg.seed+5);
  const F = cfg.factions;
  const scale = W/200;
  const ringIn = Math.round(15*Math.sqrt(scale) + (F>4? 6:0)), ringW = 2.3;
  const campR = Math.round(32*Math.sqrt(scale) + (F>4? (F>8? 26:16):0));
  const step = Math.PI*2/F, a0 = -Math.PI/2;
  const camps=[];
  for(let i=0;i<F;i++){ const a=a0+i*step; camps.push({ x:Math.round(cx+Math.cos(a)*campR), y:Math.round(cy+Math.sin(a)*campR), a }); }
  const distToCamp=(x,y)=>{ let m=1e9; for(const c of camps){ const d=Math.hypot(x-c.x,y-c.y); if(d<m)m=d; } return m; };

  // 1) nền
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=idx(x,y); const dC=Math.hypot(x-cx,y-cy);
    let v=T.GRASS;
    const f=fbm(nF,x/14,y/14,3), h=fbm(nH,x/18,y/18,3), m=fbm(nM,x/9,y/9,2), w=fbm(nW,x/22,y/22,3), r=fbm(nR,x/7,y/7,2);
    if(f>0.6) v=T.FOREST; else if(f>0.56 && m>0.5) v=T.REEDS;
    if(h>0.66 && v===T.GRASS) v=T.HILL;
    if(m>0.72 && v!==T.FOREST) v=T.MUD;
    if(w>0.7 && dC>ringIn+12) v= w>0.73? T.WATER : T.REEDS;
    if(r>0.78 && dC>ringIn+10 && v!==T.WATER) v=T.ROCK;
    if(x<2||y<2||x>=W-2||y>=H-2) v=T.ROCK;
    t[i]=v;
  }
  // 2) vòng sông quanh Trống, bên trong thoáng
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const d=Math.hypot(x-cx,y-cy); const i=idx(x,y);
    if(d<ringIn){ t[i] = (t[i]===T.REEDS && d>ringIn-5)? T.REEDS : (t[i]===T.HILL? T.HILL : T.GRASS); }
    else if(d<ringIn+ringW) t[i]=T.WATER;
    else if(d<ringIn+ringW+1.2 && t[i]===T.ROCK) t[i]=T.GRASS;
  }
  // tàn tích vòng trong, có cửa phụ
  const ruinR = Math.max(6, Math.round(ringIn*0.55));
  for(let k=0;k<720;k++){
    const a=k/720*Math.PI*2; const rel=((a-a0)%step+step)%step/step;
    if(rel<0.12||rel>0.88|| (rel>0.42&&rel<0.58) || (rel>0.25&&rel<0.3)) continue;
    const x=Math.round(cx+Math.cos(a)*ruinR), y=Math.round(cy+Math.sin(a)*ruinR);
    if(hash2(x,y,cfg.seed)<0.82) t[idx(x,y)]=T.RUIN;
  }
  // sân Trống + đường vòng nhỏ
  const P=cfg.plaza, ph=(P-1)>>1;
  for(let k=0;k<720;k++){ const a=k/720*Math.PI*2; const r=ph+2.2; t[idx(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r))]=T.ROAD; }
  for(let y=-ph;y<=ph;y++) for(let x=-ph;x<=ph;x++) t[idx(cx+x,cy+y)]=T.PLAZA;
  t[idx(cx,cy)]=T.DRUM;

  // 3) đường
  const setRoad=(x,y,wide)=>{ if(!inb(x,y)) return; const i=idx(x,y); const v=t[i];
    if(v===T.PLAZA||v===T.TENT||v===T.STATION||v===T.DRUM) return;
    t[i] = (v===T.WATER)? T.BRIDGE : (v===T.RUIN? T.GRASS : T.ROAD); };
  const road=(x0,y0,x1,y1)=>{ let x=x0,y=y0; const dx=x1-x0, dy=y1-y0; let n=0; const tot=Math.abs(dx)+Math.abs(dy);
    setRoad(x,y);
    while((x!==x1||y!==y1) && n++<5000){
      const ex = Math.abs((x-x0)*dy - (y-y0)*dx);
      const sx = x1>x?1:-1, sy=y1>y?1:-1;
      const ax = Math.abs((x+sx-x0)*dy-(y-y0)*dx), ay=Math.abs((x-x0)*dy-(y+sy-y0)*dx);
      if(x===x1) y+=sy; else if(y===y1) x+=sx; else if(ax<=ay) x+=sx; else y+=sy;
      setRoad(x,y);
    }};
  const polar=(a,r)=>({x:Math.round(cx+Math.cos(a)*r), y:Math.round(cy+Math.sin(a)*r)});
  const stations=[]; const fords=[];
  for(let i=0;i<F;i++){
    const c=camps[i], a=c.a;
    // đường ngắn: thẳng qua cầu đá hẹp
    road(c.x,c.y,cx,cy);
    // đường dài qua gò + lương trạm, tới cầu chéo rộng 2
    const sp = polar(a+step*0.3, campR*0.72);
    stations.push({x:sp.x,y:sp.y,owner:i});
    for(let y=-4;y<=4;y++) for(let x=-4;x<=4;x++){ if(x*x+y*y<=18 && inb(sp.x+x,sp.y+y)) { const j=idx(sp.x+x,sp.y+y); if(t[j]!==T.ROAD) t[j]=T.HILL; } }
    const mid = polar(a+step*0.5, ringIn+ringW+3);
    road(c.x,c.y,sp.x,sp.y); road(sp.x,sp.y,mid.x,mid.y);
    const midIn = polar(a+step*0.5, ringIn-2);
    road(mid.x,mid.y,midIn.x,midIn.y);
    const px=Math.round(-Math.sin(a+step*0.5)), py=Math.round(Math.cos(a+step*0.5));
    road(mid.x+px,mid.y+py,midIn.x+px,midIn.y+py);
    road(midIn.x,midIn.y,cx,cy);
    // đường vòng phủ lau qua bãi cạn hẹp
    const rp = polar(a-step*0.27, ringIn+ringW+5);
    for(let y=-6;y<=6;y++) for(let x=-6;x<=6;x++){ if(x*x+y*y<=34 && inb(rp.x+x,rp.y+y)){ const j=idx(rp.x+x,rp.y+y); if(t[j]===T.GRASS||t[j]===T.FOREST||t[j]===T.HILL||t[j]===T.MUD) t[j]=T.REEDS; } }
    const fIn = polar(a-step*0.27, ringIn-1);
    let fx=rp.x, fy=rp.y; // lối mòn qua lau (không đặt ROAD để giữ chất "lau")
    const ford=[]; let x=rp.x,y=rp.y; let guard=0;
    while((x!==fIn.x||y!==fIn.y)&&guard++<200){ if(Math.abs(fIn.x-x)>Math.abs(fIn.y-y)) x+=Math.sign(fIn.x-x); else y+=Math.sign(fIn.y-y);
      const j=idx(x,y); if(t[j]===T.WATER){ t[j]=T.BRIDGE; ford.push(j);} else if(!PASSABLE[t[j]]) t[j]=T.REEDS; }
    fords.push(ford);
    // bùn trên đường tắt để làm khó Kỵ sĩ
    const mp = polar(a, campR*0.62);
    for(let y=-2;y<=2;y++) for(let x=-3;x<=3;x++){ const j=idx(mp.x+x,mp.y+y); if(hash2(mp.x+x,mp.y+y,7)<0.55 && t[j]!==T.ROAD) t[j]=T.MUD; }
  }
  // lương trạm 3x3
  for(const s of stations) for(let y=-1;y<=1;y++) for(let x=-1;x<=1;x++) t[idx(s.x+x,s.y+y)]=T.STATION;
  // trại: dọn quang, lều
  for(const c of camps){
    for(let y=-6;y<=6;y++) for(let x=-6;x<=6;x++){ const d=x*x+y*y; if(d<=40 && inb(c.x+x,c.y+y)){ const j=idx(c.x+x,c.y+y); if(t[j]!==T.ROAD) t[j]= d<=2? T.PLAZA : T.GRASS; } }
    for(const [ox,oy] of [[-3,-3],[3,-3],[-3,3],[3,3]]){ const j=idx(c.x+ox,c.y+oy); if(t[j]===T.GRASS) t[j]=T.TENT; }
  }
  // cờ phụ (màn 8/12 phe): vùng 3×3 trên tuyến tiếp cận, chia đều quanh Trống
  const flags=[];
  for(let k=0;k<cfg.flags;k++){
    const a=a0+step*0.5+k*Math.PI*2/cfg.flags;
    const p=polar(a, ringIn+ringW+6);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const j=idx(p.x+dx,p.y+dy); if(inb(p.x+dx,p.y+dy)) t[j]= (dx||dy)? T.GRASS : T.ROAD; }
    flags.push({x:p.x,y:p.y});
  }
  // 4) liên thông: tô các vùng không tới được từ Trống thành đá
  const reach=new Uint8Array(N); { const q=new Int32Array(N); let h=0,e=0; q[e++]=idx(cx,cy+1); reach[idx(cx,cy+1)]=1;
    while(h<e){ const i=q[h++]; const x=i%W, y=(i/W)|0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(!inb(nx,ny)) continue; const j=idx(nx,ny); if(!reach[j]&&PASSABLE[t[j]]){ reach[j]=1; q[e++]=j; } } } }

  // 5) quân trung lập & vật phẩm
  const used=new Uint8Array(N);
  const okSpawn=(x,y)=>inb(x,y)&&reach[idx(x,y)]&&!used[idx(x,y)]&&PASSABLE[t[idx(x,y)]]&&t[idx(x,y)]!==T.PLAZA&&t[idx(x,y)]!==T.BRIDGE&&t[idx(x,y)]!==T.STATION&&t[idx(x,y)]!==T.TOWER;
  const findNear=(x,y,r,extra)=>{ for(let k=0;k<200;k++){ const rr=r*Math.sqrt(rnd()); const a=rnd()*Math.PI*2; const nx=Math.round(x+Math.cos(a)*rr), ny=Math.round(y+Math.sin(a)*rr); if(okSpawn(nx,ny)&&(!extra||extra(nx,ny))) return {x:nx,y:ny}; } return null; };
  // Vọng gác: 2 cái mỗi khu vực phe — một ở ngã giữa đường dài, một trên lối lau
  const towers=[];
  for(let i=0;i<F;i++){ const a=camps[i].a;
    for(const [da,rr2] of [[step*0.5,(campR+ringIn)/2],[-step*0.27, campR*0.82]]){
      const p0=polar(a+da,rr2); const farOK=(x,y)=>towers.every(q=>Math.abs(q.x-x)+Math.abs(q.y-y)>=10);
      const p=findNear(p0.x,p0.y,7,farOK)||findNear(p0.x,p0.y,14,farOK);
      if(p){ t[idx(p.x,p.y)]=T.TOWER; used[idx(p.x,p.y)]=1; towers.push({x:p.x,y:p.y}); } } }
  const weights={scout:1,assassin:1.5,archer:3,swordsman:2,saber:2,cavalry:2,spear:3,shield:2.2,crossbow:1.6,medic:1.4};
  const types=cfg.types;
  const pickType=(pool)=>{ pool=pool||types; let s=0; for(const k of pool) s+=weights[k]||1; let r=rnd()*s; for(const k of pool){ r-=weights[k]||1; if(r<=0) return k; } return pool[0]; };
  const neutrals=[];
  const put=(p,type)=>{ if(!p) return false; used[idx(p.x,p.y)]=1; neutrals.push({x:p.x,y:p.y,type}); return true; };
  const target = Math.round(cfg.cap*F*cfg.neutralRatio);
  const SE = RULES.startExplored;
  for(const c of camps){
    // Trinh sát ở khoảng 3–6 ô mới (ngoài vùng đã biết)
    const sa = c.a + Math.PI + (rnd()<0.5?-1:1)*(0.6+rnd()*0.5);
    for(let k=0;k<40;k++){ const r=SE+3+Math.floor(rnd()*4); const p={x:Math.round(c.x+Math.cos(sa+k*0.13)*r), y:Math.round(c.y+Math.sin(sa+k*0.13)*r)}; if(okSpawn(p.x,p.y)){ put(p,'scout'); break; } }
    // cụm dễ tìm ở mép vùng đã biết
    const ea = c.a + (rnd()<0.5?-1:1)*(1.2+rnd()*0.4);
    const ec = {x:Math.round(c.x+Math.cos(ea)*(SE-1)), y:Math.round(c.y+Math.sin(ea)*(SE-1))};
    const easy = ['archer','spear','shield','archer','spear','saber'].filter(k=>types.includes(k));
    for(const k of easy) put(findNear(ec.x,ec.y,3), k);
  }
  // cụm lớn vùng tranh chấp: quanh lương trạm, trong vòng sông, giữa các trại
  const clusterSpots=[];
  for(let i=0;i<F;i++){ const a=camps[i].a;
    clusterSpots.push(polar(a+step*0.5, campR*0.95));
    clusterSpots.push(polar(a+step*0.18, campR*0.55));
    clusterSpots.push(polar(a+step*0.5, ringIn*0.7));
  }
  const camp2 = clusterSpots.map(p=>({p, n: 7+Math.floor(rnd()*5)}));
  for(const {p,n} of camp2){
    const k1=pickType(), k2=pickType(), k3=pickType();
    const pool=[k1,k1,k2,k2,k3];
    for(let j=0;j<n && neutrals.length<target;j++) put(findNear(p.x,p.y,4+n*0.25), pool[j%pool.length]);
  }
  // quân lẻ khắp bản đồ
  let guard=0;
  while(neutrals.length<target && guard++<20000){
    const x=3+Math.floor(rnd()*(W-6)), y=3+Math.floor(rnd()*(H-6));
    if(!okSpawn(x,y)) continue; if(distToCamp(x,y)<SE+1) continue;
    put({x,y}, pickType());
  }
  // vật phẩm
  const items=[];
  const putItem=(p,kind)=>{ if(p){ used[idx(p.x,p.y)]=1; items.push({x:p.x,y:p.y,kind}); } };
  for(const c of camps){ putItem(findNear(c.x,c.y,SE-1,(x,y)=>Math.hypot(x-c.x,y-c.y)>3),'bun'); putItem(findNear(c.x,c.y,SE-1,(x,y)=>Math.hypot(x-c.x,y-c.y)>3),'tea'); }
  for(const s of stations){ putItem(findNear(s.x,s.y,5),'tea'); putItem(findNear(s.x,s.y,7), rnd()<0.5?'bun':'tea'); }
  // vật phẩm đổi cục diện: cạnh vọng gác và tuyến tranh chấp
  { const pool=['smoke','plank','scarecrow','compass','bandage']; let pi=0;
    for(const tw of towers){ putItem(findNear(tw.x,tw.y,5),pool[pi++%pool.length]); }
    for(const c of camps){ putItem(findNear(c.x,c.y,SE+5,(x,y)=>Math.hypot(x-c.x,y-c.y)>SE),'compass'); putItem(findNear(c.x,c.y,SE+8,(x,y)=>Math.hypot(x-c.x,y-c.y)>SE+2),'bandage'); }
    for(const fl of flags){ putItem(findNear(fl.x,fl.y,6),'smoke'); } }
  for(let i=0;i<F;i++){ putItem(findNear(cx,cy,ringIn-3),'bun'); }

  // vùng đã biết lúc đầu
  const known = camps.map((c,fi)=>{ const s=[];
    for(let y=-SE;y<=SE;y++) for(let x=-SE;x<=SE;x++){ if(x*x+y*y<=SE*SE+1 && inb(c.x+x,c.y+y)) s.push(idx(c.x+x,c.y+y)); }
    // một phần đường chính đã biết
    let x=c.x,y=c.y; const L=Math.round((campR-ringIn)*0.8);
    for(let k=0;k<L;k++){ if(Math.abs(cx-x)>Math.abs(cy-y)) x+=Math.sign(cx-x); else y+=Math.sign(cy-y); s.push(idx(x,y)); }
    // sân Trống và cờ phụ luôn được đánh dấu là mục tiêu đã biết
    for(let yy=-ph;yy<=ph;yy++) for(let xx=-ph;xx<=ph;xx++) s.push(idx(cx+xx,cy+yy));
    for(const fl of flags) for(let yy=-1;yy<=1;yy++) for(let xx=-1;xx<=1;xx++) s.push(idx(fl.x+xx,fl.y+yy));
    return s; });

  return { W,H,N,t, camps, stations, towers, flags, drum:{x:cx,y:cy,h:ph}, ringIn, neutrals, items, known, reach, fords };
}

// ============ Bản đồ Trận Chớp Nhoáng 30×30 ============
function generateMiniMap(cfg){
  const W=cfg.size, H=cfg.size, N=W*H; const rnd=mulberry32(cfg.seed);
  const t=new Uint8Array(N); const idx=(x,y)=>y*W+x; const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const cx=W>>1, cy=H>>1;
  t.fill(T.GRASS);
  for(let x=0;x<W;x++){ t[idx(x,0)]=T.ROCK; t[idx(x,H-1)]=T.ROCK; } for(let y=0;y<H;y++){ t[idx(0,y)]=T.ROCK; t[idx(W-1,y)]=T.ROCK; }
  const blob=(bx,by,r,v)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(dx*dx+dy*dy>r*r+rnd()) continue; const x=bx+dx,y=by+dy; if(!inb(x,y)||Math.abs(x-cx)+Math.abs(y-cy)<4) continue; if(Math.hypot(x-4.5,y-4.5)<4||Math.hypot(x-(W-5.5),y-(H-5.5))<4) continue; t[idx(x,y)]=v; } };
  for(let k=0;k<5;k++) blob(3+rnd()*(W-6),3+rnd()*(H-6),1+(rnd()*2|0),T.FOREST);
  for(let k=0;k<2;k++) blob(3+rnd()*(W-6),3+rnd()*(H-6),2,T.MUD);
  for(let k=0;k<2;k++) blob(3+rnd()*(W-6),3+rnd()*(H-6),1,T.REEDS);
  blob(cx+(rnd()<0.5?-7:7), cy+(rnd()<0.5?-6:6), 2, T.WATER);
  // sân Trống
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) t[idx(cx+dx,cy+dy)]=T.PLAZA;
  t[idx(cx,cy)]=T.DRUM;
  // trại 2 góc
  const camps=[{x:4,y:4,a:Math.atan2(cy-4,cx-4)},{x:W-5,y:H-5,a:Math.atan2(cy-(H-5),cx-(W-5))}].slice(0,cfg.factions);
  for(const c of camps){ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ if(inb(c.x+dx,c.y+dy)) t[idx(c.x+dx,c.y+dy)]=T.GRASS; } t[idx(c.x-1,c.y-1)]=T.TENT; }
  // 2 lương trạm nhỏ hai cánh
  const stations=[{x:cx+6,y:cy-7},{x:cx-6,y:cy+7}];
  for(const st of stations) t[idx(st.x,st.y)]=T.STATION;
  // liên thông
  const reach=new Uint8Array(N); { const q=new Int32Array(N); let h=0,e=0; const s0=idx(cx,cy+1); q[e++]=s0; reach[s0]=1;
    while(h<e){ const i=q[h++]; const x=i%W, y=(i/W)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(!inb(nx,ny)) continue; const j=ny*W+nx; if(!reach[j]&&PASSABLE[t[j]]){ reach[j]=1; q[e++]=j; } } } }
  for(const c of camps) if(!reach[idx(c.x,c.y)]){ // phá rừng mở lối nếu kẹt
    let x=c.x,y=c.y; while(x!==cx||y!==cy){ if(Math.abs(cx-x)>Math.abs(cy-y)) x+=Math.sign(cx-x); else y+=Math.sign(cy-y); const j=idx(x,y); if(!PASSABLE[t[j]]&&t[j]!==T.DRUM) t[j]=T.GRASS; reach[j]=1; } }
  // quân trung lập & vật phẩm
  const used=new Uint8Array(N);
  const ok=(x,y)=>inb(x,y)&&reach[idx(x,y)]&&!used[idx(x,y)]&&PASSABLE[t[idx(x,y)]]&&t[idx(x,y)]!==T.PLAZA&&t[idx(x,y)]!==T.STATION&&Math.abs(x-cx)+Math.abs(y-cy)>2&&camps.every(c=>Math.hypot(x-c.x,y-c.y)>3.5);
  const neutrals=[]; const items=[];
  let guard=0; const target=Math.round(cfg.cap*cfg.factions*0.9);
  while(neutrals.length<target&&guard++<3000){ const x=2+(rnd()*(W-4)|0), y=2+(rnd()*(H-4)|0); if(!ok(x,y)) continue; used[idx(x,y)]=1; neutrals.push({x,y,type:cfg.types[(rnd()*cfg.types.length)|0]}); }
  const putIt=(x0,y0,kind)=>{ for(let k=0;k<60;k++){ const x=x0+((rnd()*7)|0)-3, y=y0+((rnd()*7)|0)-3; if(ok(x,y)){ used[idx(x,y)]=1; items.push({x,y,kind,taken:false}); return; } } };
  for(const c of camps) putIt(c.x+3,c.y+3,'bun');
  for(const st of stations) putIt(st.x,st.y,'tea');
  putIt(cx,cy+4,'bandage'); putIt(cx,cy-4,'smoke');
  const known=camps.map(c=>{ const s=[]; for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ if(dx*dx+dy*dy<=18&&inb(c.x+dx,c.y+dy)) s.push(idx(c.x+dx,c.y+dy)); }
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) s.push(idx(cx+dx,cy+dy)); return s; });
  return { W,H,N,t, camps, stations, towers:[], flags:[], drum:{x:cx,y:cy,h:1}, ringIn:4, neutrals, items, known, reach, fords:[] };
}