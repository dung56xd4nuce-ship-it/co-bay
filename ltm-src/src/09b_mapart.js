// ============ 🎨 BẢN ĐỒ CHI TIẾT ============
// Bản đồ vẽ theo Ô 512px ở 4 MỨC CHI TIẾT (zoom xa → ô phủ rộng, zoom gần → ô nét), dựng dần mỗi khung hình 1 ô và nhớ lại.
// Dùng bộ art địa hình: nền cỏ / nền rừng / bãi sậy / đất đường / nước (ô lặp), cây, thông, đá, bụi sậy, núi, cồn cát, cầu gỗ...
// Thứ tự vẽ một ô: nền cỏ → mảng địa hình (mép mềm) → sông + bãi bồi → đường cái → sân đá/ruộng quanh cứ điểm → cây cối núi non → tên vùng.
const MAP_LOD=[0.125,0.25,0.5,1], MAP_TPX=512;
const MAP_FLAT={plain:'#8dbd4d',meadow:'#a2cc58',forest:'#3f7f33',mountain:'#9b9087',desert:'#e6c383',valley:'#b7bf63',road:'#d6a660',roadEdge:'#7a5326',water:'#3c97d3',bank:'#b99658'};
const MapTex={gen:-1,src:{},small:new Map(),spr:new Map(),ids:0};
let MAP_ART_GEN=0; if(typeof onArt==='function') onArt(()=>{ MAP_ART_GEN++; }); function ArtGen(){ return MAP_ART_GEN; }
// chuẩn bị các ô nền (kể cả 2 ô tự pha: đá núi và cát sa mạc lấy từ ô đất đường)
function mapTexInit(){
  const names={plain:'tile:grass',meadow:'tile:hill',forest:'tile:forest',valley:'tile:reeds',road:'tile:road',water:'tile:water',plaza:'tile:plaza',hay:'tile:station',mud:'tile:mud'};
  let n=0; for(const k in names){ const im=ArtImages[names[k]]; if(im){ MapTex.src[k]=im; n++; } }
  const road=ArtImages['tile:road'];
  if(road&&!MapTex.src.mountain){ try{ const mk=(fn)=>{ const cv=document.createElement('canvas'); cv.width=cv.height=256; const c=cv.getContext('2d'); c.drawImage(road,0,0,256,256); const d=c.getImageData(0,0,256,256), p=d.data;
        for(let i=0;i<p.length;i+=4){ const o=fn(p[i],p[i+1],p[i+2]); p[i]=o[0]; p[i+1]=o[1]; p[i+2]=o[2]; } c.putImageData(d,0,0); return cv; };
      MapTex.src.mountain=mk((r,g,b)=>{ const l=0.3*r+0.59*g+0.11*b; return [l*0.74+38,l*0.72+36,l*0.72+40]; });      // đá xám
      MapTex.src.desert=mk((r,g,b)=>[Math.min(255,r*0.92+48),Math.min(255,g*0.98+52),Math.min(255,b*0.85+46)]);         // cát vàng nhạt
    }catch(e){} }
  MapTex.small.clear(); MapTex.spr.clear(); MapTex.n=n; return n; }
// ô nền thu về đúng cỡ điểm ảnh của mức chi tiết (256·k) để ghép liền mạch giữa các ô bản đồ
function mapTexAt(name,px){ const key=name+':'+px; let cv=MapTex.small.get(key); if(cv!==undefined) return cv; const im=MapTex.src[name]; if(!im){ MapTex.small.set(key,null); return null; }
  cv=document.createElement('canvas'); cv.width=cv.height=px; const c=cv.getContext('2d'); c.imageSmoothingQuality='high'; c.drawImage(im,0,0,px,px); MapTex.small.set(key,cv); return cv; }
// hình cây/núi thu sẵn về đúng cỡ điểm ảnh (làm tròn theo nấc) — dán không co giãn nhanh hơn ~10 lần so với co giãn từng cây
function mapSprite(im,pw,flip){ const id=im._mk||(im._mk=++MapTex.ids), key=id+':'+pw+(flip?'f':''); let sp=MapTex.spr.get(key);
  if(!sp){ sp=document.createElement('canvas'); sp.width=sp.height=pw; const sc=sp.getContext('2d'); sc.imageSmoothingQuality='high'; if(flip){ sc.translate(pw,0); sc.scale(-1,1); } sc.drawImage(im,0,0,pw,pw); MapTex.spr.set(key,sp); }
  return sp; }
function mapHash(ix,iy,s){ let h=(ix*374761393+iy*668265263+s*982451653)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967296; }
function mapNoise(x,y,sc,s){ const fx=x/sc, fy=y/sc, ix=Math.floor(fx), iy=Math.floor(fy), tx=fx-ix, ty=fy-iy, u=tx*tx*(3-2*tx), v=ty*ty*(3-2*ty);
  const a=mapHash(ix,iy,s), b=mapHash(ix+1,iy,s), c2=mapHash(ix,iy+1,s), d=mapHash(ix+1,iy+1,s); return a+(b-a)*u+(c2-a)*v+(a-b-c2+d)*u*v; }

BigWar.prototype.mapNodesNear=function(x,y,r){ if(!this._nb||this._nbGen!==this._tileGen){ this._nb=new Map(); this._nbGen=this._tileGen; for(const n of this.nodes){ const k=Math.floor(n.x/300)*4096+Math.floor(n.y/300); let a=this._nb.get(k); if(!a) this._nb.set(k,a=[]); a.push(n); } }
  const bx=Math.floor(x/300), by=Math.floor(y/300); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const a=this._nb.get((bx+i)*4096+by+j); if(!a) continue; for(const n of a) if(Math.abs(n.x-x)<r&&Math.abs(n.y-y)<r&&Math.hypot(n.x-x,n.y-y)<r) return n; }
  return null; };

// ---- dựng 1 ô bản đồ ----
// Viết dạng "làm từng bước" (generator): mỗi khung hình chỉ làm vài mili-giây rồi nhường, máy yếu không bị khựng khi kéo bản đồ.
BigWar.prototype.mapTile=function(lod,tx,ty){ const g=this.mapTileGen(lod,tx,ty); let r=g.next(); while(!r.done) r=g.next(); return r.value; };
BigWar.prototype.mapTileGen=function*(lod,tx,ty){
  const k=MAP_LOD[lod], TW=MAP_TPX/k, x0=tx*TW, y0=ty*TW, x1=x0+TW, y1=y0+TW, S=this.mapSeed|0, far=lod<2;
  const cv=document.createElement('canvas'); cv.width=cv.height=MAP_TPX; const c=cv.getContext('2d'), px=Math.round(256*k);
  const fillOf=(ctx,name)=>{ const t=mapTexAt(name,px); if(t){ try{ return ctx.createPattern(t,'repeat'); }catch(e){} } return MAP_FLAT[name]||'#888'; };
  // 1) nền cỏ
  c.fillStyle=fillOf(c,'plain'); c.fillRect(0,0,MAP_TPX,MAP_TPX); yield 'bg';
  // 2) mảng địa hình mép mềm: lấy mẫu địa hình thành mặt nạ thô rồi phóng to (làm mềm), tô ô nền của địa hình đó qua mặt nạ
  const cell=[80,40,20,20][lod], mw=Math.round(TW/cell)+2, tmp=document.createElement('canvas'); tmp.width=tmp.height=MAP_TPX; const tc=tmp.getContext('2d');
  const mcv=document.createElement('canvas'); mcv.width=mcv.height=mw; const mc=mcv.getContext('2d');
  const grid=new Uint8Array(mw*mw); let any={};
  for(let j=0;j<mw;j++){ if((j&7)===7) yield 'grid'; for(let i=0;i<mw;i++){ const wx=x0+(i-0.5)*cell, wy=y0+(j-0.5)*cell; let t='plain';
    if(wx>=0&&wy>=0&&wx<BW.W&&wy<BW.H){ t=this.terAt(wx,wy); if(t==='river') t='plain'; else if(t==='plain'&&mapNoise(wx,wy,620,S)>0.6&&this.distRoad(wx,wy)>BW.roadHalf) t='meadow'; }
    const id=['plain','forest','mountain','desert','valley','meadow'].indexOf(t); grid[j*mw+i]=id; any[id]=1; } }
  const layers=[[5,'meadow'],[4,'valley'],[3,'desert'],[1,'forest'],[2,'mountain']];
  for(const [id,name] of layers){ if(!any[id]) continue; const im=mc.createImageData(mw,mw), d=im.data; for(let q=0;q<grid.length;q++){ if(grid[q]===id){ d[q*4+3]=255; } } mc.putImageData(im,0,0);
    tc.setTransform(1,0,0,1,0,0); tc.globalCompositeOperation='source-over'; tc.clearRect(0,0,MAP_TPX,MAP_TPX); tc.imageSmoothingEnabled=true;
    const dx=-cell*k, dw=mw*cell*k; for(let r=0;r<3;r++) tc.drawImage(mcv,0,0,mw,mw,dx,dx,dw,dw);   // vẽ chồng 3 lần → mép gọn hơn mà vẫn mềm
    yield 'mask';
    tc.globalCompositeOperation='source-in'; tc.fillStyle=fillOf(tc,name); tc.fillRect(0,0,MAP_TPX,MAP_TPX); yield 'fill';
    c.drawImage(tmp,0,0); yield 'layer'; }
  c.save(); c.scale(k,k); c.translate(-x0,-y0); c.lineCap='round'; c.lineJoin='round';
  // tô nét bằng ô nền lặp: đường nét dựng theo toạ độ bản đồ, còn hoa văn tô trong hệ điểm ảnh của ô (liền mạch giữa các ô)
  const strokeTex=(name,w)=>{ const f=fillOf(c,name); c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle=f; c.lineWidth=w*k; c.lineCap='round'; c.lineJoin='round'; c.stroke(); c.restore(); };
  // 3) SÔNG: bãi bồi + mặt nước + vệt sáng
  { const rx0=this.riverX0-this.riverAmp-120, rx1=this.riverX0+this.riverAmp+120;
    if(rx1>x0&&rx0<x1){ const line=()=>{ c.beginPath(); for(let y=y0-140;y<=y1+140;y+=28){ const x=this.riverX(y); if(y===y0-140) c.moveTo(x,y); else c.lineTo(x,y); } };
      line(); c.strokeStyle=MAP_FLAT.bank; c.lineWidth=150; c.stroke();
      line(); c.strokeStyle='#2c78b0'; c.lineWidth=130; c.stroke();
      line(); strokeTex('water',120);
      line(); c.strokeStyle='rgba(255,255,255,0.16)'; c.lineWidth=24; c.stroke(); } }
  yield 'river';
  // 4) ĐƯỜNG CÁI: viền sẫm + mặt đường đất; đường xuyên rừng núi là lối duy nhất cho kỵ binh và đại quân
  { const M=70, rs=[]; for(const r of this.roads){ if(Math.max(r.x1,r.x2)<x0-M||Math.min(r.x1,r.x2)>x1+M||Math.max(r.y1,r.y2)<y0-M||Math.min(r.y1,r.y2)>y1+M) continue; rs.push(r); }
    if(rs.length){ const wd= lod===0? 64 : lod===1? 52 : 42;   // zoom xa vẽ đường to hơn cho dễ thấy
      const path=()=>{ c.beginPath(); for(const r of rs){ c.moveTo(r.x1,r.y1); c.lineTo(r.x2,r.y2); } };
      path(); c.strokeStyle='rgba(60,38,14,0.45)'; c.lineWidth=wd+14; c.stroke();
      path(); c.strokeStyle=MAP_FLAT.roadEdge; c.lineWidth=wd+6; c.stroke();
      path(); strokeTex('road',wd);
      if(!far){ path(); c.setLineDash([3,26]); c.strokeStyle='rgba(120,84,40,0.45)'; c.lineWidth=5; c.stroke(); c.setLineDash([]); } } }
  yield 'road';
  // 5) BẾN SÔNG: cầu gỗ bắc ngang
  { const deck=ArtImages['tile:bridge']||ArtImages['ter:bridge'];
    for(const b of this.bridges){ if(b.x<x0-160||b.x>x1+160||b.y<y0-160||b.y>y1+160) continue;
      c.fillStyle='rgba(40,26,10,0.35)'; c.fillRect(b.x-88,b.y-30,176,70);
      if(ArtImages['tile:bridge']){ c.save(); c.translate(b.x,b.y); c.rotate(Math.PI/2); c.drawImage(deck,-42,-92,84,184); c.restore(); }
      else { c.fillStyle='#a8763c'; c.fillRect(b.x-86,b.y-30,172,60); c.strokeStyle='#5e3d18'; c.lineWidth=6; c.strokeRect(b.x-86,b.y-30,172,60); }
      if(!far){ c.font='900 14px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.85)'; c.strokeText('⛩️ FORD',b.x,b.y+62); c.fillStyle='#ffe9c9'; c.fillText('⛩️ FORD',b.x,b.y+62); } } }
  // 6) quanh cứ điểm: sân đá dưới trại/thành, ruộng quanh trại chăn nuôi, bãi tập quanh điểm luyện binh
  for(const n of this.nodes){ if(n.x<x0-170||n.x>x1+170||n.y<y0-170||n.y>y1+170) continue;
    if(n.camp||n.struct==='citadel'||n.struct==='fort'){ const r=n.camp?104:86; c.save(); c.beginPath(); c.ellipse(n.x,n.y+8,r,r*0.62,0,0,7); c.fillStyle='rgba(60,40,20,0.45)'; c.fill(); c.beginPath(); c.ellipse(n.x,n.y+4,r-6,(r-6)*0.62,0,0,7); c.clip();
        const t=mapTexAt('plaza',px); if(t){ c.setTransform(1,0,0,1,0,0); c.fillStyle=c.createPattern(t,'repeat'); c.fillRect(0,0,MAP_TPX,MAP_TPX); } else { c.fillStyle='#cdbb9a'; c.fillRect(n.x-r,n.y-r,2*r,2*r); } c.restore(); }
    else if(n.eco==='farm'&&!far){ for(let q=0;q<4;q++){ const an=mapHash(n.id,q,S+5)*6.28, d=112+mapHash(n.id,q,S+6)*36, fx=n.x+Math.cos(an)*d, fy=n.y+Math.sin(an)*d*0.7+10; if(this.terAt(fx,fy)==='river'||this.distRoad(fx,fy)<34) continue;
        c.save(); c.translate(fx,fy); c.rotate((mapHash(n.id,q,S+7)-0.5)*0.5); c.fillStyle='rgba(74,48,22,0.55)'; c.fillRect(-40,-25,80,50); c.fillStyle= q%2? '#d9b84a':'#9fbf45'; c.fillRect(-36,-21,72,42);
        c.strokeStyle='rgba(90,60,20,0.45)'; c.lineWidth=2; for(let l=-14;l<=14;l+=7){ c.beginPath(); c.moveTo(-34,l); c.lineTo(34,l); c.stroke(); } c.restore(); } }
    else if(n.eco==='train'){ c.beginPath(); c.ellipse(n.x,n.y+6,78,48,0,0,7); c.fillStyle='rgba(196,160,104,0.85)'; c.fill(); c.strokeStyle='rgba(90,60,26,0.6)'; c.lineWidth=4; c.stroke(); }
    else if(n.eco==='granary'&&!far){ const im=ArtImages['prop:station']; if(im) c.drawImage(im,n.x+52,n.y-34,62,62); } }
  yield 'node';
  // 7) CÂY CỐI · NÚI NON · CỒN CÁT (vị trí cố định theo toạ độ nên liền mạch giữa các ô và các mức zoom)
  const tree=ArtImages['prop:tree'], pine=ArtImages['prop:tree2'], rock=ArtImages['prop:rock'], reeds=ArtImages['prop:reeds'], clump=ArtImages['ter:forest'], mtn=ArtImages['ter:mountain'], dune=ArtImages['ter:desert'], vgrass=ArtImages['ter:valley'];
  const mX= lod===0? 340 : lod===1? 200 : 130, mB= lod===0? 580 : lod===1? 330 : 210;   // biên lấy dư: hình cao nên cây ngoài ô vẫn ló vào ô
  const items=[]; const scatter=(g,salt,fn)=>{ const i0=Math.floor((x0-mX)/g), i1=Math.floor((x1+mX)/g), j0=Math.floor((y0-90)/g), j1=Math.floor((y1+mB)/g);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const h=mapHash(i,j,S+salt), wx=(i+0.5+(mapHash(i,j,S+salt+1)-0.5)*0.76)*g, wy=(j+0.5+(mapHash(i,j,S+salt+2)-0.5)*0.76)*g; if(wx<30||wy<150||wx>BW.W-30||wy>BW.H-20) continue; fn(wx,wy,h,i,j); } };
  const put=(im,x,y,w,h2,flip)=>{ if(!im) return; if(this.distRoad(x,y)<24+w*0.42) return; items.push([y,im,x,w,h2||w,flip]); };   // hình to không được che mất mặt đường cái
  if(lod>=2){
    scatter(56,11,(x,y,h)=>{ if(this.terAt(x,y)!=='forest'||this.terAt(x,y+26)!=='forest') return; const w=74+h*34; put(h<0.62? tree : pine, x,y,w,w,h*7%1<0.5); }); yield 'scatter';
    scatter(118,21,(x,y,h)=>{ if(this.terAt(x,y)!=='mountain') return; const w=150+h*70; put(mtn,x,y,w,w,h*5%1<0.5); }); yield 'scatter';
    scatter(84,31,(x,y,h)=>{ if(h>0.3||this.terAt(x,y)!=='mountain') return; const w=48+h*70; put(rock,x,y,w,w); }); yield 'scatter';
    scatter(168,41,(x,y,h)=>{ if(h>0.6||this.terAt(x,y)!=='desert') return; const w=118+h*60; put(dune,x,y,w,w,h*9%1<0.5); }); yield 'scatter';
    scatter(78,51,(x,y,h)=>{ if(h>0.55||this.terAt(x,y)!=='valley') return; const w=46+h*40; put(reeds,x,y,w,w); }); yield 'scatter';
    scatter(190,61,(x,y,h)=>{ if(h>0.5||this.terAt(x,y)!=='valley') return; put(vgrass,x,y,112,112); }); yield 'scatter';
    scatter(250,71,(x,y,h)=>{ if(h>0.2||this.terAt(x,y)!=='plain'||this.distRoad(x,y)<BW.roadHalf+24||Math.abs(x-this.riverX(y))<120) return; const w=70+h*90; put(h<0.13? tree : (h<0.17? pine : rock), x,y,h<0.17?w:w*0.6); }); yield 'scatter';
    for(let y=Math.floor((y0-100)/64)*64;y<=y1+100;y+=64) for(const sgn of [-1,1]){ const h=mapHash(y,sgn,S+81); if(h>0.6) continue; const x=this.riverX(y)+sgn*(74+h*20); if(x<x0-60||x>x1+60||this.nearBridge(x,y,150)) continue; put(reeds,x,y+10,40+h*26); }
  } else {
    const g1=lod===0? 210 : 112, w1=lod===0? 330 : 178;
    scatter(g1,13,(x,y,h)=>{ if(this.terAt(x,y)!=='forest') return; const w=w1*(0.82+h*0.36); put(clump,x,y,w,w,h*7%1<0.5); }); yield 'scatter';
    scatter(lod===0? 380 : 210,23,(x,y,h)=>{ if(this.terAt(x,y)!=='mountain') return; const w=(lod===0? 520 : 290)*(0.8+h*0.4); put(mtn,x,y,w,w,h*5%1<0.5); }); yield 'scatter';
    scatter(lod===0? 520 : 300,43,(x,y,h)=>{ if(h>0.7||this.terAt(x,y)!=='desert') return; const w=(lod===0? 420 : 230); put(dune,x,y,w,w); }); yield 'scatter';
    scatter(lod===0? 480 : 270,63,(x,y,h)=>{ if(h>0.7||this.terAt(x,y)!=='valley') return; const w=(lod===0? 360 : 200); put(vgrass,x,y,w,w); }); yield 'scatter';
  }
  items.sort((a,b)=>a[0]-b[0]); yield 'sort';
  c.save(); c.setTransform(1,0,0,1,0,0); let qi=0;
  for(const it of items){ const [y,im,x,w,h2,flip]=it; if(this.mapNodesNear(x,y-w*0.2,lod>=2? 118 : 150)) continue; // không trồng cây đè lên cứ điểm
    let pw=Math.round(w*k); const q= pw<48? 4 : pw<96? 8 : 16; pw=Math.max(4,Math.round(pw/q)*q);
    c.drawImage(mapSprite(im,pw,flip),Math.round((x-x0)*k-pw/2),Math.round((y-y0)*k-pw*0.86)); if((++qi&31)===0) yield 'prop'; }
  c.restore();
  // 8) tên vùng (zoom vừa và gần)
  if(lod>=1){ c.textAlign='center'; this.terSeeds.forEach((s2,si)=>{ if(si%3||s2.x<x0-200||s2.x>x1+200||s2.y<y0-60||s2.y>y1+60||this.terAt(s2.x,s2.y)!==s2.ter) return; const fs=lod===1? 30 : 17;
      c.font=`900 ${fs}px "Baloo 2",system-ui`; c.lineWidth=fs*0.28; c.strokeStyle='rgba(42,26,18,0.7)'; c.fillStyle='#fff7df'; c.globalAlpha=0.9; const t=BW.terIcon[s2.ter]+' '+BW.terName[s2.ter];
      c.strokeText(t,s2.x,s2.y); c.fillText(t,s2.x,s2.y); c.globalAlpha=1; }); }
  c.restore();
  return cv;
};

// ---- vẽ bản đồ mỗi khung hình: lớp tổng quan (luôn đủ) + lớp đúng mức zoom (dựng dần) ----
BigWar.prototype.drawMap=function(c,cull,scale,dpr){
  const M=this._map||(this._map={tiles:new Map(),gen:-1,made:0});
  if(MapTex.gen!==ArtGen()){ MapTex.gen=ArtGen(); mapTexInit(); M.gen=-1; }
  if(M.gen!==this._tileGen){ M.tiles.clear(); M.gen=this._tileGen; M.made=0; M.job=null; M.n0=-1; }
  const want=0.6*scale*dpr; let lod=MAP_LOD.length-1; for(let i=0;i<MAP_LOD.length;i++){ if(MAP_LOD[i]>=want){ lod=i; break; } }
  this._mapLod=lod; const need=[], cx=(cull.x0+cull.x1)/2, cy=(cull.y0+cull.y1)/2, ov=0.6/scale, TW=MAP_TPX/MAP_LOD[lod];
  // MỖI VÙNG MÀN HÌNH CHỈ VẼ MỘT LẦN: có ô đúng mức zoom thì vẽ ô đó; chưa có thì mượn đúng phần tương ứng của ô thô hơn đã dựng (đỡ phải vẽ chồng 2 lớp kín màn hình)
  const tx0=Math.max(0,Math.floor(cull.x0/TW)), tx1=Math.min(Math.ceil(BW.W/TW)-1,Math.floor(cull.x1/TW)), ty0=Math.max(0,Math.floor(cull.y0/TW)), ty1=Math.min(Math.ceil(BW.H/TW)-1,Math.floor(cull.y1/TW));
  for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++){ const key=lod*1e6+tx*1000+ty, t=M.tiles.get(key);
    if(t){ if(lod>0){ M.tiles.delete(key); M.tiles.set(key,t); } c.drawImage(t,tx*TW-ov,ty*TW-ov,TW+2*ov,TW+2*ov); continue; }
    if(lod>0) need.push([lod,tx,ty,Math.hypot((tx+0.5)*TW-cx,(ty+0.5)*TW-cy)]);
    for(let L=lod-1;L>=0;L--){ const d=lod-L, k2=L*1e6+(tx>>d)*1000+(ty>>d), t2=M.tiles.get(k2); if(!t2) continue;
      const sw=MAP_TPX>>d, m=(1<<d)-1; if(L>0){ M.tiles.delete(k2); M.tiles.set(k2,t2); }
      c.drawImage(t2,(tx&m)*sw,(ty&m)*sw,sw,sw,tx*TW-ov,ty*TW-ov,TW+2*ov,TW+2*ov); break; } }
  // DỰNG Ô CÒN THIẾU THEO NGÂN SÁCH THỜI GIAN mỗi khung hình (máy yếu không khựng): lớp tổng quan của CẢ bản đồ trước (kéo tới đâu cũng có hình),
  // rồi tới ô đúng mức zoom, gần tâm màn hình trước. Khung hình đầu dựng ngay phần tổng quan đang thấy để không lộ nền trống.
  const TW0=MAP_TPX/MAP_LOD[0];
  if(!M.all0){ M.all0=[]; for(let ty=0;ty<Math.ceil(BW.H/TW0);ty++) for(let tx=0;tx<Math.ceil(BW.W/TW0);tx++) M.all0.push([tx,ty]); }
  let miss0=0, seen0=0; if(M.n0!==M.all0.length){ for(const [tx,ty] of M.all0){ if(M.tiles.has(tx*1000+ty)) continue; miss0++;
      const inView=!((tx+1)*TW0<cull.x0||tx*TW0>cull.x1||(ty+1)*TW0<cull.y0||ty*TW0>cull.y1); if(inView) seen0++;
      need.push([0,tx,ty,(inView? -1e7 : -9e6)+Math.hypot((tx+0.5)*TW0-cx,(ty+0.5)*TW0-cy)]); } if(!miss0) M.n0=M.all0.length; }
  if(need.length||M.job){ need.sort((a,b)=>a[3]-b[3]); const now=()=>performance.now();
    if(M.made===0&&!M.job){ let n1=0; for(const [L,tx,ty,sc] of need){ if(L!==0||sc>-9.5e6||n1>=2) break; const t=this.mapTile(L,tx,ty); M.tiles.set(tx*1000+ty,t); M.made++; n1++; c.drawImage(t,tx*TW0-ov,ty*TW0-ov,TW0+2*ov,TW0+2*ov); } }
    else { // ngân sách mỗi khung hình: máy nhanh 9 ms; máy chậm lấy ~30% thời gian một khung hình (để bản đồ vẫn kịp nét); đang kéo thì chỉ một nửa
      const fms=Math.min(120,(this._fdt||0.016)*1000), base= fms<21? 9 : Math.max(6,Math.min(30,fms*0.3)), zooming=Math.abs((this.zoomTgt||this.zoom||1)-(this.zoom||1))>0.02*(this.zoom||1);
      const budget= seen0? Math.max(22,base) : this.camDrag!=null? Math.max(3.5,base*0.45) : miss0? Math.max(12,base) : base, t0=now(); let guard=0;
      do{ if(!M.job){ const nx=need.find(n=>!M.tiles.has(n[0]*1e6+n[1]*1000+n[2])&&(n[0]===0||!zooming)); if(!nx) break;   /* đang phóng/thu: chưa dựng ô nét (mức zoom còn đổi) */ M.job={key:nx[0]*1e6+nx[1]*1000+nx[2],gen:this.mapTileGen(nx[0],nx[1],nx[2])}; }
        const r=M.job.gen.next(); if(r.done){ M.tiles.set(M.job.key,r.value); M.made++; M.job=null; } } while(now()-t0<budget&&++guard<4000); }
    let extra=0; for(const k2 of M.tiles.keys()) if(k2>=1e6) extra++;
    if(extra>22){ for(const k2 of M.tiles.keys()){ if(k2<1e6) continue; M.tiles.delete(k2); if(--extra<=22) break; } } }
  this._mapPending=need.filter(n=>n[3]<1e6&&(n[0]!==0||n[3]<-9.5e6)).length+(M.job?1:0);   // số ô ĐANG THẤY còn chờ dựng
};
