// ============ Kết xuất ============
const TS = 32, CH = 8;
function tm2(){ return Math.random()*Math.PI*2; }
function land2(q){ return q!==T.WATER&&q!==T.BRIDGE; }
class Renderer {
  constructor(canvas, world){
    this.cv=canvas; this.c=canvas.getContext('2d'); this.w=world;
    this.cam={x:0,y:0,z:1.4, tx:null, ty:null}; this.dpr=Math.min(2, window.devicePixelRatio||1); this.fogS=0.75;
    this.chunks=new Map(); this.parts=[]; this.texts=[]; this.rings=[]; this.markers=[]; this.shake=0; this.flash=0; this.flashCol='#fff';
    this.fogCv=document.createElement('canvas'); this.fogCv.width=world.W; this.fogCv.height=world.H; this.fogCtx=this.fogCv.getContext('2d');
    this.fogImg=this.fogCtx.createImageData(world.W,world.H); this.fogT=-1;
    this.fogScreen=document.createElement('canvas'); this.fsCtx=this.fogScreen.getContext('2d');
    this.cloudTex=this.makeCloudTex(); this.tentOwner=new Map();
    for(let i=0;i<world.N;i++){ if(world.t[i]===T.TENT){ const x=i%world.W,y=(i/world.W)|0; let b=0,bd=1e9; world.map.camps.forEach((c,k)=>{ const d=Math.abs(c.x-x)+Math.abs(c.y-y); if(d<bd){bd=d;b=k;} }); this.tentOwner.set(i,b); } }
    this.ambient=[]; for(let i=0;i<40;i++) this.ambient.push({x:Math.random(),y:Math.random(),s:Math.random(),p:Math.random()*6});
    this.clouds=[]; for(let i=0;i<4;i++) this.clouds.push({x:Math.random()*world.W*TS, y:Math.random()*world.H*TS, r:300+Math.random()*400, v:8+Math.random()*10});
    this.bubbles=new Map(); this.time=0; this.selected=new Set();
    this.resize();
  }
  resize(){ const r=this.cv.getBoundingClientRect(); this.vw=r.width; this.vh=r.height; this.cv.width=Math.round(r.width*this.dpr); this.cv.height=Math.round(r.height*this.dpr); this.fogScreen.width=Math.ceil(r.width*this.fogS); this.fogScreen.height=Math.ceil(r.height*this.fogS); this.vign=null; }
  makeCloudTex(){ const S=256; const cv=document.createElement('canvas'); cv.width=S; cv.height=S; const c=cv.getContext('2d'); const img=c.createImageData(S,S); const n=makeNoise(77);
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){ // tileable noise via torus sampling
      const a=x/S*Math.PI*2, b=y/S*Math.PI*2; const v=fbm(n,3+Math.cos(a)*2.2,3+Math.sin(a)*2.2,3)*0.6+fbm(n,9+Math.cos(b)*2.2,9+Math.sin(b)*2.2,3)*0.4;
      const i=(y*S+x)*4; img.data[i]=14+v*30; img.data[i+1]=12+v*22; img.data[i+2]=30+v*48; img.data[i+3]=255; }
    c.putImageData(img,0,0); return cv; }
  // ---- toạ độ
  toScreen(wx,wy){ const z=this.cam.z; return [(wx-this.cam.x)*z+this.vw/2, (wy-this.cam.y)*z+this.vh/2]; }
  toWorld(sx,sy){ const z=this.cam.z; return [(sx-this.vw/2)/z+this.cam.x, (sy-this.vh/2)/z+this.cam.y]; }
  centerOn(tx,ty,instant){ if(instant){ this.cam.x=(tx+0.5)*TS; this.cam.y=(ty+0.5)*TS; this.cam.tx=null; } else { this.cam.tx=(tx+0.5)*TS; this.cam.ty=(ty+0.5)*TS; } }
  clampCam(){ const W=this.w.W*TS, H=this.w.H*TS; this.cam.x=Math.max(0,Math.min(W,this.cam.x)); this.cam.y=Math.max(0,Math.min(H,this.cam.y)); }

  // ---- địa hình theo chunk
  getChunk(cx,cy){ const key=cx+','+cy; let ch=this.chunks.get(key); if(ch){ ch.used=this.time; return ch; }
    if(this.chunks.size>110){ let old=null, ot=1e18; for(const [k,v] of this.chunks) if(v.used<ot){ot=v.used;old=k;} this.chunks.delete(old); }
    const cv=document.createElement('canvas'); cv.width=CH*TS; cv.height=CH*TS; this.drawChunk(cv.getContext('2d'),cx,cy); ch={cv,used:this.time}; this.chunks.set(key,ch); return ch; }
  drawChunk(c,cx,cy){
    const w=this.w, W=w.W, t=w.t; const x0=cx*CH, y0=cy*CH;
    const tt=(x,y)=> (x<0||y<0||x>=W||y>=w.H)? T.ROCK : t[y*W+x];
    c.lineJoin='round'; c.lineCap='round';
    // nền
    for(let ty=y0;ty<y0+CH;ty++) for(let tx=x0;tx<x0+CH;tx++){ if(tx>=W||ty>=w.H) continue; const v=tt(tx,ty); const px=(tx-x0)*TS, py=(ty-y0)*TS; const h=hash2(tx,ty,3);
      this.ground(c,v,px,py,h,tx,ty,tt); }
    // vật thể (kể cả mép chunk lân cận để không bị cắt)
    for(let ty=y0-1;ty<y0+CH+1;ty++) for(let tx=x0-1;tx<x0+CH+1;tx++){ if(tx<0||ty<0||tx>=W||ty>=w.H) continue; const v=tt(tx,ty); const px=(tx-x0)*TS, py=(ty-y0)*TS; const h=hash2(tx,ty,9);
      this.objects(c,v,px,py,h,tx,ty,tt); }
  }
  ground(c,v,px,py,h,tx,ty,tt){
    const S=TS;
    const tk = ({[T.GRASS]:'grass',[T.TENT]:'grass',[T.TOWER]:'grass',[T.RUIN]:'grass',[T.FOREST]:'forest',[T.ROAD]:'road',[T.REEDS]:'reeds',[T.HILL]:'hill',[T.MUD]:'mud',[T.WATER]:'water',[T.BRIDGE]:'water',[T.PLAZA]:'plaza',[T.DRUM]:'plaza',[T.STATION]:'station'})[v];
    const tim = tk && ArtImages['tile:'+tk];
    if(tim){
      { const hw=tim.width/2, hh=tim.height/2; c.drawImage(tim,(tx&1)*hw,(ty&1)*hh,hw,hh,px,py,S+0.6,S+0.6); }
      if(v===T.HILL){ if(tt(tx,ty+1)!==T.HILL){ const g=c.createLinearGradient(0,py+S*0.55,0,py+S); g.addColorStop(0,'rgba(60,100,40,0)'); g.addColorStop(1,'rgba(50,90,35,0.45)'); c.fillStyle=g; c.fillRect(px,py+S*0.55,S,S*0.45); } }
      if(v===T.WATER||v===T.BRIDGE){ const land=(q)=>q!==T.WATER&&q!==T.BRIDGE; c.strokeStyle='rgba(235,250,255,0.75)'; c.lineWidth=3;
        if(land(tt(tx,ty-1))){ c.beginPath(); c.moveTo(px,py+3); c.lineTo(px+S,py+3); c.stroke(); } if(land(tt(tx,ty+1))){ c.beginPath(); c.moveTo(px,py+S-3); c.lineTo(px+S,py+S-3); c.stroke(); }
        if(land(tt(tx-1,ty))){ c.beginPath(); c.moveTo(px+3,py); c.lineTo(px+3,py+S); c.stroke(); } if(land(tt(tx+1,ty))){ c.beginPath(); c.moveTo(px+S-3,py); c.lineTo(px+S-3,py+S); c.stroke(); } }
      if(v===T.BRIDGE){ const bim=ArtImages['tile:bridge']; const vert = tt(tx,ty-1)===T.BRIDGE||tt(tx,ty+1)===T.BRIDGE||land2(tt(tx,ty-1))||land2(tt(tx,ty+1));
        if(bim){ c.save(); c.translate(px+S/2,py+S/2); if(!vert) c.rotate(Math.PI/2); c.drawImage(bim,-S/2,-S/2,S,S); c.restore(); }
        else { c.fillStyle='#b98250'; if(vert) c.fillRect(px+3,py-1,S-6,S+2); else c.fillRect(px-1,py+3,S+2,S-6); } }
      if(v===T.PLAZA||v===T.STATION||v===T.DRUM){ c.strokeStyle='rgba(0,0,0,0.12)'; c.lineWidth=1; c.strokeRect(px+0.5,py+0.5,S-1,S-1); }
      return;
    }
    const grassCol = ['#88d46b','#80cd63','#8fda73','#84d067'][(h*4)|0];
    switch(v){
      case T.GRASS: case T.FOREST: case T.TENT: case T.RUIN: case T.TOWER:
        c.fillStyle = v===T.FOREST? ['#5fb04c','#58a847','#66b852'][(h*3)|0] : grassCol; c.fillRect(px,py,S,S);
        if(v!==T.FOREST && h<0.5){ c.strokeStyle='rgba(60,130,50,0.55)'; c.lineWidth=1.5; for(let k=0;k<3;k++){ const gx=px+4+hash2(tx,ty,k+20)*24, gy=py+8+hash2(tx,ty,k+30)*20; c.beginPath(); c.moveTo(gx,gy); c.lineTo(gx-2,gy-5); c.moveTo(gx,gy); c.lineTo(gx+2,gy-6); c.stroke(); } }
        if(v===T.GRASS && h>0.93){ const fc=['#fff','#ffe066','#ff9ec4','#b3a6ff'][(h*1000|0)%4]; const fx=px+8+hash2(tx,ty,5)*16, fy=py+8+hash2(tx,ty,6)*16; c.fillStyle=fc; for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; c.beginPath(); c.arc(fx+Math.cos(a)*2.6,fy+Math.sin(a)*2.6,1.8,0,7); c.fill(); } c.fillStyle='#ffb300'; c.beginPath(); c.arc(fx,fy,1.6,0,7); c.fill(); }
        break;
      case T.ROAD: c.fillStyle=grassCol; c.fillRect(px,py,S,S);
        c.fillStyle='#e3c58d'; rr(c,px-1,py-1,S+2,S+2,6); c.fill();
        c.fillStyle='rgba(170,130,80,0.35)'; for(let k=0;k<3;k++){ c.beginPath(); c.arc(px+5+hash2(tx,ty,k)*22,py+5+hash2(tx,ty,k+9)*22,1.5+hash2(tx,ty,k+3),0,7); c.fill(); }
        break;
      case T.PLAZA: case T.STATION: case T.DRUM:
        c.fillStyle= v!==T.STATION? '#e0d8c6':'#ead7a2'; c.fillRect(px,py,S,S); c.strokeStyle= v!==T.STATION?'#bdb39f':'#c9b071'; c.lineWidth=1.5; c.strokeRect(px+1,py+1,S-2,S-2);
        if(v===T.PLAZA){ c.fillStyle='rgba(255,255,255,0.35)'; c.fillRect(px+3,py+3,S/2-4,S/2-4); }
        break;
      case T.REEDS: c.fillStyle=['#b4cf72','#aac86a','#bad578'][(h*3)|0]; c.fillRect(px,py,S,S); break;
      case T.HILL: { c.fillStyle=['#b3df82','#aad97a'][(h*2)|0]; c.fillRect(px,py,S,S);
        if(tt(tx,ty+1)!==T.HILL){ const g=c.createLinearGradient(0,py+S*0.55,0,py+S); g.addColorStop(0,'rgba(80,130,50,0)'); g.addColorStop(1,'rgba(70,120,45,0.55)'); c.fillStyle=g; c.fillRect(px,py+S*0.55,S,S*0.45); }
        if(tt(tx,ty-1)!==T.HILL){ c.fillStyle='rgba(255,255,220,0.35)'; c.fillRect(px,py,S,4); }
        c.strokeStyle='rgba(90,140,60,0.35)'; c.lineWidth=1.5; c.beginPath(); c.arc(px+S/2,py+S*0.9,S*0.45,Math.PI*1.15,Math.PI*1.85); c.stroke(); break; }
      case T.MUD: c.fillStyle=['#93724f','#8a6a48'][(h*2)|0]; c.fillRect(px,py,S,S);
        c.fillStyle='#6d5136'; c.beginPath(); c.ellipse(px+10+h*10,py+14+h*6,7,4,0.2,0,7); c.fill(); c.fillStyle='rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(px+8+h*10,py+12+h*6,3,1.4,0.2,0,7); c.fill(); break;
      case T.WATER: case T.BRIDGE: {
        const deep = tt(tx-1,ty)===T.WATER&&tt(tx+1,ty)===T.WATER&&tt(tx,ty-1)===T.WATER&&tt(tx,ty+1)===T.WATER;
        c.fillStyle= deep? '#2f86d1' : '#3f9de3'; c.fillRect(px,py,S,S);
        // bờ: bọt sóng
        c.strokeStyle='rgba(220,245,255,0.85)'; c.lineWidth=3;
        const land=(q)=>q!==T.WATER&&q!==T.BRIDGE;
        if(land(tt(tx,ty-1))){ c.fillStyle='#e9d9a6'; c.fillRect(px,py,S,4); c.beginPath(); c.moveTo(px,py+6); c.lineTo(px+S,py+6); c.stroke(); }
        if(land(tt(tx,ty+1))){ c.fillStyle='#d8c690'; c.fillRect(px,py+S-5,S,5); c.beginPath(); c.moveTo(px,py+S-7); c.lineTo(px+S,py+S-7); c.stroke(); }
        if(land(tt(tx-1,ty))){ c.fillStyle='#e9d9a6'; c.fillRect(px,py,4,S); c.beginPath(); c.moveTo(px+6,py); c.lineTo(px+6,py+S); c.stroke(); }
        if(land(tt(tx+1,ty))){ c.fillStyle='#e9d9a6'; c.fillRect(px+S-4,py,4,S); c.beginPath(); c.moveTo(px+S-6,py); c.lineTo(px+S-6,py+S); c.stroke(); }
        if(v===T.BRIDGE){
          const hor = land(tt(tx-1,ty))||tt(tx-1,ty)===T.BRIDGE&&tt(tx+1,ty)===T.BRIDGE ? (tt(tx,ty-1)===T.WATER||tt(tx,ty+1)===T.WATER) : false;
          const vertical = !hor;
          c.fillStyle='#b98250'; c.strokeStyle='#6e4527'; c.lineWidth=1.5;
          if(vertical){ c.fillRect(px+3,py-1,S-6,S+2); for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(px+3,py+k*8+2); c.lineTo(px+S-3,py+k*8+2); c.stroke(); } c.fillStyle='#7a4a26'; c.fillRect(px+1,py-1,3,S+2); c.fillRect(px+S-4,py-1,3,S+2); }
          else { c.fillRect(px-1,py+3,S+2,S-6); for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(px+k*8+2,py+3); c.lineTo(px+k*8+2,py+S-3); c.stroke(); } c.fillStyle='#7a4a26'; c.fillRect(px-1,py+1,S+2,3); c.fillRect(px-1,py+S-4,S+2,3); }
        }
        break; }
      case T.ROCK: c.fillStyle='#7b8794'; c.fillRect(px,py,S,S); break;
    }
  }
  objects(c,v,px,py,h,tx,ty,tt){
    const S=TS;
    const prop=(key,scale,dy=0)=>{ const im=ArtImages[key]; if(!im) return false; const w=S*scale; c.drawImage(im,px+S/2-w/2,py+S-w*0.97+dy,w,w); return true; };
    if(v===T.FOREST && (ArtImages['prop:tree']||ArtImages['prop:tree2'])){ const k=(h<0.5||!ArtImages['prop:tree2'])&&ArtImages['prop:tree']?'prop:tree':'prop:tree2'; c.fillStyle='rgba(20,60,20,0.28)'; c.beginPath(); c.ellipse(px+S/2+3,py+S-4,14,5,0,0,7); c.fill(); prop(k,1.55+(h-0.5)*0.2,2); return; }
    if(v===T.REEDS && prop('prop:reeds',1.0,1)) return;
    if(v===T.ROCK && ArtImages['prop:rock']){ prop('prop:rock',1.3,3); return; }
    if(v===T.RUIN && prop('prop:ruin',1.25,2)) return;
    if(v===T.TENT && ArtImages['prop:tent']){ const fi=this.tentOwner.get(ty*this.w.W+tx)||0; const im=recolorUnit(ArtImages['prop:tent'],fi); const w=S*1.6; c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(px+S/2,py+S-3,18,5,0,0,7); c.fill(); c.drawImage(im,px+S/2-w/2,py+S-w*0.97,w,w); return; }
    if(v===T.STATION && ArtImages['prop:station']){ if(hash2(tx,ty,1)<0.45) prop('prop:station',1.0,0); return; }
    if(v===T.FOREST){
      const ox=px+S/2+(h-0.5)*6, oy=py+S*0.55;
      c.fillStyle='rgba(20,60,20,0.3)'; c.beginPath(); c.ellipse(ox+3,oy+9,13,5,0,0,7); c.fill();
      c.fillStyle='#7a4f2a'; c.strokeStyle=OUT; c.lineWidth=2; rr(c,ox-3,oy-2,6,12,2); c.fill(); c.stroke();
      const greens = h<0.33? ['#2f8f46','#3fa85a','#6fcf7f'] : h<0.66? ['#3a9a3f','#4fb352','#86d98a'] : ['#2e7d5b','#3c9c70','#7fd6a8'];
      c.lineWidth=2.5;
      const blob=(x,y,r,col)=>{ c.beginPath(); c.arc(x,y,r,0,7); c.fillStyle=col; c.fill(); c.strokeStyle='rgba(30,50,25,0.9)'; c.stroke(); };
      blob(ox-6,oy-6,9,greens[0]); blob(ox+6,oy-6,9,greens[0]); blob(ox,oy-14,11,greens[1]);
      c.fillStyle=greens[2]; c.beginPath(); c.arc(ox-3,oy-18,4,0,7); c.fill();
      if(h>0.85){ c.fillStyle='#ff5a5a'; c.beginPath(); c.arc(ox+5,oy-10,2,0,7); c.arc(ox-6,oy-4,2,0,7); c.fill(); }
    } else if(v===T.REEDS){
      c.lineWidth=2; for(let k=0;k<5;k++){ const rx=px+4+hash2(tx,ty,k+40)*24, ry=py+S-3-hash2(tx,ty,k+50)*8; c.strokeStyle='#6f8d36'; c.beginPath(); c.moveTo(rx,ry); c.quadraticCurveTo(rx+2,ry-10,rx+(k%2?4:-3),ry-18); c.stroke(); c.fillStyle='#c9a35a'; c.beginPath(); c.ellipse(rx+(k%2?4:-3),ry-19,2,4,0,0,7); c.fill(); }
    } else if(v===T.ROCK){
      const top='#a9b3bd', face='#6c7682';
      c.fillStyle=face; c.fillRect(px,py+S*0.55,S,S*0.45);
      c.fillStyle=top; rr(c,px-1,py-6,S+2,S*0.62+6,5); c.fill(); c.strokeStyle='rgba(40,45,55,0.7)'; c.lineWidth=2; c.stroke();
      c.strokeStyle='rgba(60,65,75,0.5)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(px+6+h*10,py); c.lineTo(px+12+h*6,py+10); c.lineTo(px+8,py+16); c.stroke();
      if(tt(tx,ty+1)!==T.ROCK){ c.fillStyle='rgba(0,0,0,0.25)'; c.fillRect(px,py+S,S,4); }
    } else if(v===T.RUIN){
      c.fillStyle='#8f887c'; rr(c,px+2,py+6,S-4,S-8,3); c.fill(); c.fillStyle='#bdb6a8'; rr(c,px+2,py-2,S-4,S*0.55,3); c.fill(); c.strokeStyle='rgba(50,45,40,0.8)'; c.lineWidth=2; c.stroke();
      c.fillStyle='#6fae58'; c.beginPath(); c.arc(px+6+h*16,py+2,4,0,7); c.fill();
      c.strokeStyle='rgba(80,75,65,0.6)'; c.beginPath(); c.moveTo(px+S/2,py-2); c.lineTo(px+S/2+3,py+10); c.stroke();
    } else if(v===T.TENT){
      const fi=this.tentOwner.get(ty*this.w.W+tx)||0; const F=FACTIONS[fi];
      c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(px+S/2,py+S-2,17,5,0,0,7); c.fill();
      c.beginPath(); c.moveTo(px-2,py+S-2); c.lineTo(px+S/2,py-10); c.lineTo(px+S+2,py+S-2); c.closePath(); c.fillStyle=F.color; c.fill(); c.strokeStyle=OUT; c.lineWidth=2.5; c.stroke();
      c.beginPath(); c.moveTo(px+S/2,py-10); c.lineTo(px+S/2-6,py+S-2); c.lineTo(px+S/2+6,py+S-2); c.closePath(); c.fillStyle=F.dark; c.fill(); c.stroke();
      c.strokeStyle=OUT; c.beginPath(); c.moveTo(px+S/2,py-10); c.lineTo(px+S/2,py-20); c.stroke(); c.fillStyle=F.light; c.beginPath(); c.moveTo(px+S/2,py-20); c.lineTo(px+S/2+10,py-17); c.lineTo(px+S/2,py-14); c.fill();
    } else if(v===T.TOWER){
      const S2=TS; c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(px+S2/2,py+S2-2,14,5,0,0,7); c.fill();
      c.strokeStyle=OUT; c.lineWidth=2.5; c.fillStyle='#8a5a32';
      // chân chéo
      c.beginPath(); c.moveTo(px+6,py+S2-2); c.lineTo(px+12,py-14); c.moveTo(px+S2-6,py+S2-2); c.lineTo(px+S2-12,py-14); c.moveTo(px+8,py+S2-14); c.lineTo(px+S2-8,py-6); c.moveTo(px+S2-8,py+S2-14); c.lineTo(px+8,py-6); c.stroke();
      // sàn + lan can
      rr(c,px+5,py-18,S2-10,7,2); c.fillStyle='#b98250'; c.fill(); c.stroke();
      c.strokeStyle=OUT; c.beginPath(); for(const lx of [px+8,px+S2/2,px+S2-8]){ c.moveTo(lx,py-18); c.lineTo(lx,py-26); } c.moveTo(px+7,py-26); c.lineTo(px+S2-7,py-26); c.stroke();
      // mái
      c.beginPath(); c.moveTo(px+2,py-26); c.lineTo(px+S2/2,py-40); c.lineTo(px+S2-2,py-26); c.closePath(); c.fillStyle='#c0392b'; c.fill(); c.stroke();
      // cờ nhỏ
      c.beginPath(); c.moveTo(px+S2/2,py-40); c.lineTo(px+S2/2,py-50); c.stroke(); c.fillStyle='#ffd54a'; c.beginPath(); c.moveTo(px+S2/2,py-50); c.lineTo(px+S2/2+10,py-47); c.lineTo(px+S2/2,py-44); c.fill();
    } else if(v===T.STATION && hash2(tx,ty,1)<0.5){
      // bao gạo & nồi
      const k=hash2(tx,ty,2);
      if(k<0.5){ c.fillStyle='#f4e7c1'; c.strokeStyle=OUT; c.lineWidth=2; rr(c,px+6,py+10,14,16,5); c.fill(); c.stroke(); rr(c,px+15,py+13,12,13,5); c.fill(); c.stroke(); c.fillStyle='#c0392b'; c.fillRect(px+10,py+16,6,2); }
      else { c.fillStyle='#3a3a3a'; c.strokeStyle=OUT; c.lineWidth=2; c.beginPath(); c.ellipse(px+S/2,py+S/2+4,11,8,0,0,7); c.fill(); c.stroke(); c.fillStyle='#ff7a2a'; c.beginPath(); c.ellipse(px+S/2,py+S-4,8,3,0,0,7); c.fill(); }
    }
  }

  // ---- sương
  updateFog(){
    const w=this.w, fac=w.factions[w.player], d=this.fogImg.data, ex=fac.explored, vis=fac.vis, s=fac.visStamp;
    for(let i=0,j=3;i<w.N;i++,j+=4){ d[j]= !ex[i]? 255 : (vis[i]===s? 0 : 135); }
    this.fogCtx.putImageData(this.fogImg,0,0);
  }

  // ---- hiệu ứng
  addPart(p){ if(this.parts.length<900) this.parts.push(p); }
  burst(x,y,n,opt){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, sp=(opt.sp||60)*(0.4+Math.random()*0.8); this.addPart({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(opt.up||0),g:opt.g??120,life:0,max:(opt.life||0.6)*(0.6+Math.random()*0.6),size:(opt.size||3)*(0.6+Math.random()*0.8),col:Array.isArray(opt.col)?opt.col[(Math.random()*opt.col.length)|0]:opt.col,kind:opt.kind||'dot',add:!!opt.add}); } }
  text(x,y,str,opt={}){ this.texts.push({x,y,str,t:0,max:opt.life||1.1,col:opt.col||'#fff',size:opt.size||16,vy:opt.vy??-38,stroke:opt.stroke||'#2a1a12',pop:opt.pop??1}); }
  ring(x,y,col,max,r0,r1,w){ this.rings.push({x,y,col,t:0,max,r0,r1,w:w||4}); }
  consumeFx(audio){
    const w=this.w, P=w.player, fac=w.factions[P];
    const visT=(x,y)=>fac.vis[Math.round(y)*w.W+Math.round(x)]===fac.visStamp;
    for(const e of w.fx){
      const X=(e.x+0.5)*TS, Y=(e.y+0.5)*TS;
      const seen = e.x===undefined || visT(e.x,e.y);
      switch(e.type){
        case 'slash': if(!seen) break; { const tx=(e.tx+0.5)*TS, ty=(e.ty+0.5)*TS; this.addPart({x:tx,y:ty-8,kind:'slash',life:0,max:0.22,a:Math.atan2(e.ty-e.y,e.tx-e.x),col:e.tag==='charge'?'#ffb347':'#ffffff',size:e.type==='saber'?20:15,g:0,vx:0,vy:0});
          this.burst(tx,ty-8,e.tag?10:5,{col:['#fff','#ffe08a','#ffd166'],sp:90,life:0.35,size:2.5,g:200,add:true}); audio&&audio.hit(e.tag); } break;
        case 'dmg': if(!seen) break; { const big=!!(e.tag==='charge'||e.tag==='ambush'||e.tag==='brace'); this.text((e.x+0.5)*TS+(Math.random()-0.5)*10,(e.y)*TS, (big?'-':'-')+e.v, {col: e.f===P?'#ff6b6b':(big?'#ffb020':'#fff4c2'), size: big?24:15, pop: big?1.6:1});
          if(e.tag==='charge') this.text(X,Y-30,'XUNG PHONG!',{col:'#ffb347',size:16,life:1.2,vy:-20}); if(e.tag==='ambush') this.text(X,Y-30,'PHỤC KÍCH!',{col:'#c084fc',size:16,life:1.2,vy:-20}); } break;
        case 'shoot': if(seen) audio&&audio.shoot(e.kind); break;
        case 'miss': if(seen) this.burst(X,Y,4,{col:'#d8c7a0',sp:30,life:0.4,size:2,g:60}); break;
        case 'block': if(!seen) break; this.addPart({x:X,y:Y-10,kind:'hex',life:0,max:0.4,size:16,col:'#7dd3fc',g:0,vx:0,vy:0,add:true}); this.text(X,Y-26,'ĐỠ!',{col:'#7dd3fc',size:13,life:0.7}); audio&&audio.block(); break;
        case 'shieldbreak': if(!seen) break; this.burst(X,Y-10,12,{col:['#cbd5e1','#94a3b8','#fff'],sp:120,life:0.6,size:3.5,g:300,kind:'shard'}); this.text(X,Y-30,'PHÁ KHIÊN!',{col:'#fca5a5',size:15}); audio&&audio.crack(); break;
        case 'brace': if(!seen) break; this.addPart({x:X,y:Y-10,kind:'hex',life:0,max:0.5,size:22,col:'#fde047',g:0,vx:0,vy:0,add:true}); this.text(X,Y-30,'DỰNG THƯƠNG!',{col:'#fde047',size:15}); this.shake=Math.max(this.shake,4); audio&&audio.block(); break;
        case 'charge': if(!seen) break; this.burst(X,Y+8,14,{col:['#d6c39a','#c2a878','#efe2c2'],sp:70,life:0.7,size:5,g:-20,kind:'puff'}); this.shake=Math.max(this.shake,3); audio&&audio.charge(); break;
        case 'terrain': { const cx2=Math.floor(e.x/CH), cy2=Math.floor(e.y/CH); for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) this.chunks.delete((cx2+dx)+','+(cy2+dy)); } break;
        case 'plank': if(seen||true){ this.ring(X,Y,'#c98a4b',0.6,6,50,5); audio&&audio.crack(); } break;
        case 'smokeUse': break;
        case 'ward': if(e.f===P) this.ring(X,Y,'#a3e635',0.6,6,40,4); break;
        case 'compassmark': this.ring(X,Y,'#7dd3fc',1.2,8,60,5); this.ring(X,Y,'#fff',0.8,4,40,3); break;
        case 'flagtake': if(e.f===P||e.f<0||seen){ this.ring(X,Y,e.f>=0?FACTIONS[e.f].color:'#fff',0.8,8,70,5); audio&&audio.flag(); } break;
        case 'stormstart': { this.shake=Math.max(this.shake,10); this.flash=0.4; this.flashCol='#b67aff'; audio&&audio.drum(true); } break;
        case 'camplost': if(seen||e.f===P) this.burst(X,Y,20,{col:['#ff8a3d','#ffd166','#fff'],sp:120,life:0.9,size:4,g:60,add:true}); break;
        case 'surrenderAll': { this.flash=0.3; this.flashCol='#ffffff'; audio&&audio.fanfare(); } break;
        case 'tower': { this.ring(X,Y,'#ffd54a',1.0,10,RULES.towerReveal*TS,8); this.ring(X,Y,'#fff',0.7,6,RULES.towerReveal*TS*0.7,4); this.burst(X,Y-20,16,{col:['#ffd54a','#fff6b0'],sp:120,life:0.8,size:3,g:60,kind:'star',add:true,up:50}); if(e.f===P){ this.flash=0.2; this.flashCol='#fff8d0'; } audio&&audio.recruit(); } break;
        case 'ping': audio&&audio.drum(false); break;
        case 'cleave': if(seen){ this.ring(X,Y,'#ffe08a',0.35,6,46,5); this.addPart({x:X,y:Y-8,kind:'slash',life:0,max:0.3,a:tm2(),col:'#ffe08a',size:30,g:0,vx:0,vy:0}); } break;
        case 'guard': if(seen) this.text(X,Y-26,'HỘ VỆ!',{col:'#93c5fd',size:14}); break;
        case 'death': if(!seen && e.f!==P) break; this.burst((e.x+0.5)*TS,(e.y+0.5)*TS,16,{col:['#ffffff','#e5e7eb','#d1d5db'],sp:70,life:0.8,size:6,g:-30,kind:'puff'});
          this.addPart({x:(e.x+0.5)*TS,y:(e.y+0.3)*TS,kind:'ghost',life:0,max:1.6,size:12,col:e.f===NEUTRAL?'#fff':FACTIONS[e.f].light,g:0,vx:0,vy:-30});
          if(e.type==='general'){ this.shake=Math.max(this.shake,8); this.ring((e.x+0.5)*TS,(e.y+0.5)*TS,FACTIONS[e.f].color,0.7,10,90,6); }
          audio&&audio.death(e.type==='general'); break;
        case 'recruit': { if(e.f!==P && !seen) break; const col=FACTIONS[e.f].color; this.ring(X,Y,'#ffd54a',0.55,6,40,5); this.ring(X,Y,col,0.75,4,56,3);
          this.burst(X,Y-10,18,{col:['#ffd54a','#fff6b0',col],sp:110,life:0.8,size:3.2,g:80,kind:'star',add:true,up:40});
          if(e.f===P){ this.text(X,Y-30,'+1 '+UNIT[e.type].name,{col:'#ffe27a',size:16,life:1.4,pop:1.5}); audio&&audio.recruit(); } } break;
        case 'convert': { const col=FACTIONS[e.f].color; this.ring(X,Y,'#ffffff',0.6,6,44,5); this.ring(X,Y,col,0.9,6,64,4); this.burst(X,Y-10,14,{col:['#fff',col],sp:100,life:0.9,size:3,g:60,kind:'star',add:true,up:30}); } break;
        case 'surrender': if(e.f===P){ this.flash=0.35; this.flashCol='#fff4c2'; audio&&audio.fanfare(); } break;
        case 'reveal': { if(e.c){ this.addPart({x:X,y:Y,kind:'reveal',life:0,max:0.6,size:TS*0.9,col:'#fff',g:0,vx:0,vy:0,add:true}); this.burst(X,Y,6,{col:['#fff8d6','#a5f3fc'],sp:40,life:0.6,size:2.4,g:-30,add:true}); audio&&audio.reveal(); } } break;
        case 'pickup': if(e.f===P||seen){ this.burst(X,Y-10,12,{col:['#fff','#ffe08a','#86efac'],sp:80,life:0.7,size:3,g:60,kind:'star',add:true}); this.ring(X,Y,'#ffe08a',0.5,4,30,3); if(e.f===P) audio&&audio.pickup(); } break;
        case 'use': this.burst(X,Y-10,20,{col:e.kind==='bun'?['#fff1c9','#ffd54a','#fff']:['#86efac','#a7f3d0','#fff'],sp:90,life:0.9,size:3.2,g:-40,kind:'star',add:true}); this.ring(X,Y,e.kind==='bun'?'#ffd54a':'#4ade80',0.7,6,60,5); audio&&audio.pickup(); break;
        case 'heal': if(seen){ this.addPart({x:X+(Math.random()-0.5)*10,y:Y-10,kind:'plus',life:0,max:0.9,size:7,col:'#4ade80',g:0,vx:0,vy:-30,add:true}); this.text(X,Y-20,'+'+e.v,{col:'#86efac',size:13,life:0.8}); } break;
        case 'stam': if(e.f===P && Math.random()<0.5) this.addPart({x:X+(Math.random()-0.5)*14,y:Y-6,kind:'drop',life:0,max:0.8,size:4,col:'#60a5fa',g:0,vx:0,vy:-24}); break;
        case 'flag': this.ring(X,Y,'#ffffff',0.8,4,50,4); audio&&audio.flag(); break;
        case 'drumtake': { const d=w.drum; const dx=(d.x+0.5)*TS, dy=(d.y+0.5)*TS; this.ring(dx,dy,FACTIONS[e.f].color,1.0,20,260,10); this.ring(dx,dy,'#fff',0.7,10,180,4); this.shake=Math.max(this.shake,10); audio&&audio.drum(true); } break;
        case 'respawn': if(e.f===P||seen){ this.addPart({x:X,y:Y,kind:'pillar',life:0,max:1.0,size:20,col:FACTIONS[e.f].light,g:0,vx:0,vy:0,add:true}); this.ring(X,Y,'#fff',0.6,4,50,4); } break;
        case 'release': if(seen) this.burst(X,Y,10,{col:'#e5e7eb',sp:60,life:0.6,size:4,kind:'puff',g:-10}); break;
        case 'retreat': if(seen) this.burst(X,Y,10,{col:'#e5e7eb',sp:50,life:0.7,size:5,kind:'puff',g:-20}); break;
        case 'drop': break;
        case 'say': { const u=w.units[e.id]; if(u && (u.f===P || w.canSee(P,u))) this.bubbles.set(u.id,{text:e.text,t:0}); } break;
        case 'channel': audio&&audio.flag(); break;
      }
    }
    w.fx.length=0;
  }

  // ---- khung hình
  draw(dt, alpha, ui){
    const c=this.c, w=this.w, cam=this.cam, z=cam.z, P=w.player, fac=w.factions[P], dpr=this.dpr;
    this.time+=dt;
    if(cam.tx!==null){ cam.x+=(cam.tx-cam.x)*Math.min(1,dt*6); cam.y+=(cam.ty-cam.y)*Math.min(1,dt*6); if(Math.hypot(cam.tx-cam.x,cam.ty-cam.y)<2) cam.tx=null; }
    this.clampCam();
    let sx=0, sy=0; if(this.shake>0){ sx=(Math.random()-0.5)*this.shake; sy=(Math.random()-0.5)*this.shake; this.shake=Math.max(0,this.shake-dt*30); }
    c.setTransform(dpr,0,0,dpr,0,0); c.fillStyle='#0d0b1a'; c.fillRect(0,0,this.vw,this.vh);
    c.setTransform(dpr*z,0,0,dpr*z, dpr*(this.vw/2 - cam.x*z + sx), dpr*(this.vh/2 - cam.y*z + sy));
    const [wx0,wy0]=this.toWorld(0,0), [wx1,wy1]=this.toWorld(this.vw,this.vh);
    const tx0=Math.max(0,Math.floor(wx0/TS)-1), ty0=Math.max(0,Math.floor(wy0/TS)-1), tx1=Math.min(w.W-1,Math.ceil(wx1/TS)+1), ty1=Math.min(w.H-1,Math.ceil(wy1/TS)+2);
    c.imageSmoothingEnabled = true;
    for(let cy=Math.floor(ty0/CH); cy<=Math.floor(ty1/CH); cy++) for(let cx=Math.floor(tx0/CH); cx<=Math.floor(tx1/CH); cx++){ const ch=this.getChunk(cx,cy); c.drawImage(ch.cv,cx*CH*TS,cy*CH*TS); }
    // nước lấp lánh, khói lương trạm
    const tm=this.time;
    if(z>0.7){ c.strokeStyle='rgba(255,255,255,0.45)'; c.lineWidth=1.6; c.beginPath();
      for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++){ const i=ty*w.W+tx; if(w.t[i]!==T.WATER) continue; if(!fac.explored[i]) continue; const h=hash2(tx,ty,11); const ph=(tm*0.8+h*6)%3; if(ph>1.2) continue; const px=tx*TS+6+h*16, py=ty*TS+8+((h*7)%1)*14; c.moveTo(px,py); c.quadraticCurveTo(px+4,py-2+ph*2,px+9,py); }
      c.stroke(); }
    for(const s of w.map.stations){ const i=s.y*w.W+s.x; if(!fac.explored[i]) continue; if(Math.random()<dt*3) this.addPart({x:(s.x+0.5)*TS+(Math.random()-0.5)*20,y:(s.y+0.3)*TS,kind:'puff',life:0,max:2.2,size:5,col:'rgba(255,255,255,0.7)',g:-12,vx:(Math.random()-0.5)*6,vy:-12}); }
    // Trống Loạn Thế & cờ phụ
    this.drawDrum(c);
    this.drawFlags(c,tm,fac);
    // marker lệnh
    for(const m of this.markers){ m.t+=dt; const k=m.t/0.9; if(k>1) continue; const X=(m.x+0.5)*TS, Y=(m.y+0.5)*TS; c.strokeStyle=`rgba(255,255,255,${1-k})`; c.lineWidth=3; c.beginPath(); c.ellipse(X,Y+4,8+k*26,(8+k*26)*0.55,0,0,7); c.stroke();
      c.strokeStyle=`rgba(120,220,255,${1-k})`; c.beginPath(); c.ellipse(X,Y+4,4+k*14,(4+k*14)*0.55,0,0,7); c.stroke();
      c.fillStyle=`rgba(255,255,255,${1-k})`; c.beginPath(); c.moveTo(X,Y-6-12*(1-k)); c.lineTo(X-6,Y-18-12*(1-k)); c.lineTo(X+6,Y-18-12*(1-k)); c.fill(); }
    this.markers=this.markers.filter(m=>m.t<0.9);
    // vật phẩm
    for(const it of w.items){ if(it.taken) continue; const i=it.y*w.W+it.x; if(!fac.explored[i]) continue; if(it.x<tx0||it.x>tx1||it.y<ty0||it.y>ty1) continue;
      const vis=fac.vis[i]===fac.visStamp; const b=Math.sin(tm*3+it.x)*3; const X=it.x*TS, Y=it.y*TS;
      c.globalAlpha=vis?1:0.55; c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(X+TS/2,Y+TS-5,9,3.5,0,0,7); c.fill();
      if(vis){ const g=c.createRadialGradient(X+TS/2,Y+TS/2+b-6,2,X+TS/2,Y+TS/2+b-6,22); g.addColorStop(0,'rgba(255,240,170,0.6)'); g.addColorStop(1,'rgba(255,240,170,0)'); c.fillStyle=g; c.beginPath(); c.arc(X+TS/2,Y+TS/2+b-6,22,0,7); c.fill(); }
      c.drawImage(makeItemSprite(it.kind),X+3,Y+b-6,TS-6,TS-6); c.globalAlpha=1; }
    // tầm đánh khi chọn (vòng tròn mờ)
    // đơn vị (y-sort)
    const list=[]; const sel=this.selected;
    for(const u of w.units){ if(u.dead) continue; const X=u.ox!==undefined? u.ox+(u.px-u.ox)*alpha : u.px, Y=u.oy!==undefined? u.oy+(u.py-u.oy)*alpha : u.py;
      if(X<tx0-1||X>tx1+1||Y<ty0-1||Y>ty1+1) continue;
      let mode=0; if(u.f===P) mode=1; else if(w.canSee(P,u)) mode=1; else if(u.f===NEUTRAL && fac.explored[u.y*w.W+u.x] && fac.memNeutral.has(u.y*w.W+u.x)) mode=2;
      if(!mode) continue; list.push([u,X,Y,mode]); }
    list.sort((a,b)=>a[2]-b[2]);
    // vòng chân (vẽ trước cho tất cả)
    for(const [u,X,Y,mode] of list){ if(mode!==1||u.f===NEUTRAL) continue; const cx=(X+0.5)*TS, cy=(Y+0.5)*TS+10; const col=FACTIONS[u.f].color;
      if(sel.has(u.id)){ const pul=1+Math.sin(tm*8)*0.08; c.fillStyle='rgba(120,255,200,0.18)'; c.beginPath(); c.ellipse(cx,cy,17*pul,8*pul,0,0,7); c.fill(); c.strokeStyle='#7dffcf'; c.lineWidth=2.5; c.stroke(); }
      else { c.strokeStyle=col; c.globalAlpha=0.85; c.lineWidth=2.2; c.beginPath(); c.ellipse(cx,cy,13,6,0,0,7); c.stroke(); c.globalAlpha=1; } }
    for(const [u,X,Y,mode] of list) this.drawUnit(c,u,X,Y,mode,tm);
    // đạn
    for(const p of w.projs){ const k=Math.min(1,(w.time-p.t0+alpha*DT)/p.dur); const x=(p.sx+(p.tx-p.sx)*k+0.5)*TS, yb=(p.sy+(p.ty-p.sy)*k+0.5)*TS; const arc= p.kind==='arrow'? Math.sin(k*Math.PI)*Math.hypot(p.tx-p.sx,p.ty-p.sy)*7 : 0; const y=yb-14-arc;
      const ti=Math.round(p.sy+(p.ty-p.sy)*k)*w.W+Math.round(p.sx+(p.tx-p.sx)*k); if(fac.vis[ti]!==fac.visStamp && p.f!==P) continue;
      const k2=Math.max(0,k-0.06); const x2=(p.sx+(p.tx-p.sx)*k2+0.5)*TS, y2=(p.sy+(p.ty-p.sy)*k2+0.5)*TS-14-(p.kind==='arrow'?Math.sin(k2*Math.PI)*Math.hypot(p.tx-p.sx,p.ty-p.sy)*7:0);
      const a=Math.atan2(y-y2,x-x2);
      c.save(); c.translate(x,y); c.rotate(a);
      if(p.kind==='arrow'){ c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=3; c.beginPath(); c.moveTo(-22,0); c.lineTo(-6,0); c.stroke(); c.strokeStyle='#5b3a1e'; c.lineWidth=2; c.beginPath(); c.moveTo(-12,0); c.lineTo(6,0); c.stroke(); c.fillStyle='#e8eef5'; c.beginPath(); c.moveTo(9,0); c.lineTo(3,-3); c.lineTo(3,3); c.fill(); c.fillStyle='#fff'; c.fillRect(-13,-3,4,6); }
      else { c.strokeStyle='rgba(255,220,150,0.6)'; c.lineWidth=4; c.beginPath(); c.moveTo(-26,0); c.lineTo(0,0); c.stroke(); c.fillStyle='#ffe9a8'; c.fillRect(-8,-2,14,4); }
      c.restore(); }
    this.drawSmokes(c,tm);
    this.drawWards(c,tm);
    // hạt hiệu ứng
    this.drawParts(c,dt);
    // mây bóng
    for(const cl of this.clouds){ cl.x+=cl.v*dt; if(cl.x-cl.r>w.W*TS) cl.x=-cl.r; const g=c.createRadialGradient(cl.x,cl.y,0,cl.x,cl.y,cl.r); g.addColorStop(0,'rgba(20,30,60,0.10)'); g.addColorStop(1,'rgba(20,30,60,0)'); c.fillStyle=g; c.fillRect(cl.x-cl.r,cl.y-cl.r,cl.r*2,cl.r*2); }
    // sương mù mềm
    if(w.time-this.fogT>0.15 || this.fogT<0){ this.updateFog(); this.fogT=w.time; }
    const fs=this.fsCtx; fs.setTransform(1,0,0,1,0,0); fs.globalCompositeOperation='source-over'; fs.clearRect(0,0,this.fogScreen.width,this.fogScreen.height);
    const fk=this.fogS; fs.setTransform(fk*z,0,0,fk*z, fk*(this.vw/2 - cam.x*z + sx), fk*(this.vh/2 - cam.y*z + sy)); fs.imageSmoothingEnabled=true; fs.drawImage(this.fogCv,0,0,w.W*TS,w.H*TS);
    fs.globalCompositeOperation='source-in'; fs.setTransform(fk,0,0,fk,0,0);
    if(!this.cloudPat) this.cloudPat=fs.createPattern(this.cloudTex,'repeat');
    const off=(tm*6)%256, sc=1.5; try{ this.cloudPat.setTransform(new DOMMatrix([sc,0,0,sc,-off*sc*0.7,-off*sc])); }catch(e){}
    fs.fillStyle=this.cloudPat; fs.fillRect(0,0,this.vw,this.vh);
    c.setTransform(1,0,0,1,0,0); c.imageSmoothingEnabled=true; c.drawImage(this.fogScreen,0,0,this.cv.width,this.cv.height);
    c.setTransform(dpr*z,0,0,dpr*z, dpr*(this.vw/2 - cam.x*z + sx), dpr*(this.vh/2 - cam.y*z + sy));
    // trên sương: dấu nghe thấy, tiến độ mở ô, bong bóng
    this.drawOverFog(c,tm,tx0,ty0,tx1,ty1);
    if(this.w.stormOn){ const d2=this.w.drum; const scx=(d2.x+0.5)*TS, scy=(d2.y+0.5)*TS, R=this.w.stormR*TS;
      c.save(); c.beginPath(); c.rect(wx0-50,wy0-50,(wx1-wx0)+100,(wy1-wy0)+100); c.arc(scx,scy,R,0,Math.PI*2,true); c.fillStyle='rgba(72,22,110,0.5)'; c.fill();
      c.strokeStyle='rgba(196,130,255,0.95)'; c.lineWidth=5; c.setLineDash([18,10]); c.lineDashOffset=-tm*40; c.beginPath(); c.arc(scx,scy,R,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.restore();
      if(Math.random()<dt*10){ const a2=Math.random()*Math.PI*2; this.addPart({x:scx+Math.cos(a2)*R,y:scy+Math.sin(a2)*R,kind:'dot',life:0,max:0.6,size:3,col:'#d8b4fe',g:0,vx:(Math.random()-0.5)*40,vy:-40,add:true}); } }
    for(const r of this.rings){ r.t+=dt; const k=r.t/r.max; if(k>1) continue; c.strokeStyle=r.col; c.globalAlpha=1-k; c.lineWidth=r.w*(1-k*0.5); c.beginPath(); const rad=r.r0+(r.r1-r.r0)*(1-Math.pow(1-k,3)); c.ellipse(r.x,r.y,rad,rad*0.6,0,0,7); c.stroke(); c.globalAlpha=1; }
    this.rings=this.rings.filter(r=>r.t<r.max);
    // chữ nổi
    c.textAlign='center'; c.textBaseline='middle';
    for(const t of this.texts){ t.t+=dt; const k=t.t/t.max; if(k>1) continue; const sc2= k<0.15? (t.pop*(0.6+k/0.15*0.6)) : 1+(t.pop-1)*0.2; const y=t.y+t.vy*t.t;
      c.font=`900 ${t.size*sc2}px "Baloo 2", system-ui, sans-serif`; c.globalAlpha=k>0.7? (1-k)/0.3 : 1; c.lineWidth=4; c.strokeStyle=t.stroke; c.strokeText(t.str,t.x,y); c.fillStyle=t.col; c.fillText(t.str,t.x,y); c.globalAlpha=1; }
    this.texts=this.texts.filter(t=>t.t<t.max);
    // khung màn hình
    c.setTransform(dpr,0,0,dpr,0,0);
    if(!this.vign){ const vc=document.createElement('canvas'); vc.width=256; vc.height=Math.max(64,Math.round(256*this.vh/this.vw)); const x=vc.getContext('2d'); const W2=vc.width,H2=vc.height; const vg=x.createRadialGradient(W2/2,H2/2,Math.min(W2,H2)*0.45,W2/2,H2/2,Math.max(W2,H2)*0.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(10,5,30,0.45)'); x.fillStyle=vg; x.fillRect(0,0,W2,H2); this.vign=vc; }
    c.drawImage(this.vign,0,0,this.vw,this.vh);
    // đom đóm/lá bay
    c.globalCompositeOperation='lighter'; for(const a of this.ambient){ a.p+=dt; const X=((a.x*this.vw + Math.sin(a.p*0.5+a.s*9)*30 + tm*8*(a.s-0.5))%this.vw+this.vw)%this.vw, Y=((a.y*this.vh + Math.cos(a.p*0.4)*20 - tm*6*a.s)%this.vh+this.vh)%this.vh; const al=0.25+0.25*Math.sin(a.p*2+a.s*5); c.fillStyle=`rgba(255,240,170,${al})`; c.beginPath(); c.arc(X,Y,1.2+a.s*1.6,0,7); c.fill(); } c.globalCompositeOperation='source-over';
    if(this.flash>0){ c.fillStyle=this.flashCol; c.globalAlpha=Math.min(0.6,this.flash); c.fillRect(0,0,this.vw,this.vh); c.globalAlpha=1; this.flash-=dt; }
  }
  drawDrum(c){
    const w=this.w, d=w.drum, tm=this.time; const X=(d.x+0.5)*TS, Y=(d.y+0.5)*TS; const h=d.h;
    const holder=d.holder; const col= holder>=0? FACTIONS[holder].color : '#ffd54a';
    // sân phát sáng
    c.save(); c.globalCompositeOperation='lighter';
    const g=c.createRadialGradient(X,Y,10,X,Y,(h+1.6)*TS); g.addColorStop(0,holder>=0? col+'55':'rgba(255,214,90,0.30)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(X,Y,(h+1.6)*TS,0,7); c.fill(); c.restore();
    c.strokeStyle=d.contested? (Math.sin(tm*10)>0?'#ff5a5a':'#fff') : col; c.lineWidth=3; c.setLineDash([10,7]); c.lineDashOffset=-tm*20; c.strokeRect((d.x-h)*TS+2,(d.y-h)*TS+2,(2*h+1)*TS-4,(2*h+1)*TS-4); c.setLineDash([]);
    // tiến độ giữ
    if(holder>=0){ const k=w.factions[holder].holdStreak/RULES.drumHold; c.strokeStyle=col; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.arc(X,Y-4,(h+0.9)*TS,-Math.PI/2,-Math.PI/2+Math.PI*2*k); c.stroke(); c.strokeStyle='rgba(255,255,255,0.7)'; c.lineWidth=2; c.stroke(); }
    // cái trống
    const art=ArtImages['drum']; const bob=Math.sin(tm*4)*1.5;
    c.fillStyle='rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(X,Y+16,26,9,0,0,7); c.fill();
    if(art){ c.drawImage(art,X-34,Y-50+bob,68,68); }
    else {
      c.lineWidth=3; c.strokeStyle=OUT;
      rr(c,X-24,Y-20+bob,48,34,10); c.fillStyle='#c0392b'; c.fill(); c.stroke();
      c.fillStyle='#e8584a'; rr(c,X-20,Y-16+bob,10,26,4); c.fill();
      c.beginPath(); c.ellipse(X,Y-20+bob,24,9,0,0,7); c.fillStyle='#f5e6c8'; c.fill(); c.stroke();
      drawEmblem(c, holder>=0? FACTIONS[holder].emblem:'star', X, Y-20+bob, 5, holder>=0? col:'#ffd54a');
      c.fillStyle='#ffd54a'; for(let k=-2;k<=2;k++){ c.beginPath(); c.arc(X+k*9,Y-8+bob+Math.abs(k)*1.5,2,0,7); c.fill(); }
      // dùi trống
      const hit = (tm%1.2)<0.15 && holder>=0; c.save(); c.translate(X+22,Y-34+bob); c.rotate(hit?0.9:0.4); rr(c,-2,-2,6,26,3); c.fillStyle='#8a5a32'; c.fill(); c.stroke(); c.beginPath(); c.arc(1,-3,5,0,7); c.fillStyle='#ffcf3f'; c.fill(); c.stroke(); c.restore();
      // cờ
      c.strokeStyle=OUT; c.lineWidth=3; c.beginPath(); c.moveTo(X-30,Y+10); c.lineTo(X-30,Y-48); c.stroke();
      const wv=Math.sin(tm*5)*3; c.beginPath(); c.moveTo(X-30,Y-48); c.quadraticCurveTo(X-14,Y-46+wv,X-2,Y-42); c.lineTo(X-6,Y-32); c.quadraticCurveTo(X-16,Y-30-wv,X-30,Y-32); c.closePath(); c.fillStyle=holder>=0?col:'#f5f5f5'; c.fill(); c.stroke();
    }
    if(holder>=0 && (tm%1.2)<0.03 && !this._drumBoom){ this._drumBoom=true; this.ring(X,Y-10,col,0.7,20,80,4); } if((tm%1.2)>0.1) this._drumBoom=false;
  }
  drawUnit(c,u,X,Y,mode,tm){
    const w=this.w, P=w.player; const cx=(X+0.5)*TS, cy=(Y+0.5)*TS;
    let spr=makeUnitSprite(u.type,u.f===NEUTRAL?NEUTRAL:u.f, u.type==='general'&&u.weapon? WEAPONS.indexOf(u.weapon):0);
    const left=u.dirx<0; if(left) spr=makeFlipped(spr);
    const moving=u.moving; let bob= moving? -Math.abs(Math.sin(tm*14+u.id))*4 : Math.sin(tm*2.5+u.id)*0.8;
    let lx=0, ly=0; if(u.atkAnim>0){ const k=Math.sin((u.atkAnim/0.25)*Math.PI); lx=(u.dirx||0)*k*7; ly=(u.diry||0)*k*7; }
    if(u.digTile>=0 && !moving){ lx+=Math.sin(tm*30)*1.2; }
    const size=TS*(ArtImages['unit:'+u.type]?2.0:1.55); const sx=cx-size/2+lx, sy=cy-size*(ArtImages['unit:'+u.type]?0.9:0.83)+bob+ly;
    // bóng
    c.fillStyle='rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(cx+lx,cy+10,12,5,0,0,7); c.fill();
    if(u.type==='general' && u.weapon){ const wi=WEAPONS.indexOf(u.weapon); if(wi>=3){ const col=['','','','#4ade80','#fbbf24','#f472b6'][wi]; c.save(); c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(cx,cy-6,4,cx,cy-6,30); g.addColorStop(0,col+'66'); g.addColorStop(1,col+'00'); c.fillStyle=g; c.beginPath(); c.arc(cx,cy-6,30+Math.sin(tm*4)*3,0,7); c.fill(); c.restore(); } }
    const hidden = HIDE_T[w.t[u.y*w.W+u.x]] && u.f!==NEUTRAL && w.time>=u.revealUntil;
    let a=1; if(mode===2) a=0.45; else if(hidden && u.f===P) a=0.62;
    if(u.squad&&u.squad.flag) a*=0.85;
    c.globalAlpha=a;
    if(u.type==='cavalry' && moving && u.runLen>=1){ c.globalAlpha=a*0.25; c.drawImage(spr,sx-u.dirx*10,sy-u.diry*10,size,size); c.globalAlpha=a*0.12; c.drawImage(spr,sx-u.dirx*20,sy-u.diry*20,size,size); c.globalAlpha=a; }
    c.drawImage(spr,sx,sy,size,size);
    if(u.flash>0){ c.globalAlpha=Math.min(1,u.flash/0.15)*0.85; c.drawImage(makeWhite(spr),sx,sy,size,size); }
    c.globalAlpha=1;
    if(hidden && u.f===P){ c.fillStyle='rgba(60,140,60,0.8)'; for(let k=0;k<3;k++){ c.beginPath(); c.ellipse(cx-10+k*10,cy+2-Math.abs(k-1)*3,6,3.5,(k-1)*0.6,0,7); c.fill(); } }
    if(mode===2){ return; }
    // khiên bị phá / thương dựng
    if(u.type==='shield' && w.time<u.shieldBrokenUntil){ c.fillStyle='#fca5a5'; c.font='900 11px system-ui'; c.textAlign='center'; c.fillText('💢',cx+12,sy+12); }
    if(u.type==='spear' && w.isBraced(u)){ c.strokeStyle='rgba(253,224,71,0.85)'; c.lineWidth=2; c.beginPath(); c.arc(cx,cy+6,16,-Math.PI*0.9+(u.dirx>0?0.6:u.dirx<0?Math.PI:u.diry>0?Math.PI/2+0.6:-Math.PI/2+0.6),-Math.PI*0.9+(u.dirx>0?0.6:u.dirx<0?Math.PI:u.diry>0?Math.PI/2+0.6:-Math.PI/2+0.6)+1.2); c.stroke(); }
    // thanh máu
    const showHp = u.hp<u.maxhp || this.selected.has(u.id) || u.type==='general';
    if(showHp && u.f!==NEUTRAL){ const bw=u.type==='general'?30:22, bx=cx-bw/2, by=sy+4; c.fillStyle='rgba(20,12,10,0.75)'; rr(c,bx-1.5,by-1.5,bw+3,6,3); c.fill(); const k=Math.max(0,u.hp/u.maxhp); c.fillStyle= u.f===P? (k>0.5?'#4ade80':k>0.25?'#facc15':'#f87171') : FACTIONS[u.f].color; rr(c,bx,by,bw*k,3,1.5); c.fill();
      if(u.f===P && (this.selected.has(u.id)||u.type==='general')){ const ks=u.stam/u.maxstam; c.fillStyle='rgba(20,12,10,0.75)'; rr(c,bx-1.5,by+4.5,bw+3,5,2.5); c.fill(); c.fillStyle='#60a5fa'; rr(c,bx,by+5.5,bw*ks,2.5,1.2); c.fill(); } }
    // tướng: vương miện + tên
    if(u.type==='general'){ c.font='900 10px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle=OUT; c.strokeText(FACTIONS[u.f].short,cx,sy-2); c.fillStyle=FACTIONS[u.f].light; c.fillText(FACTIONS[u.f].short,cx,sy-2); }
    // cờ trắng
    if(u.squad && u.squad.flag){ const wv=Math.sin(tm*6+u.id)*2; c.strokeStyle=OUT; c.lineWidth=2; c.beginPath(); c.moveTo(cx+10,sy+30); c.lineTo(cx+10,sy-6); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(cx+10,sy-6); c.quadraticCurveTo(cx+18,sy-6+wv,cx+24,sy-3); c.lineTo(cx+24,sy+6); c.quadraticCurveTo(cx+18,sy+4-wv,cx+10,sy+5); c.closePath(); c.fill(); c.stroke(); }
    // đang chiêu hàng
    if(u.channel){ const k=Math.min(1,(w.time-u.channel.t0)/RULES.surrenderChannel); c.strokeStyle='#fff'; c.lineWidth=4; c.beginPath(); c.arc(cx,cy-18,20,-Math.PI/2,-Math.PI/2+k*Math.PI*2); c.stroke(); c.font='900 12px system-ui'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('🏳️',cx,cy-18); }
    // trung lập: dấu hỏi nảy
    if(u.f===NEUTRAL){ const b=Math.sin(tm*3+u.id)*2; c.font='900 13px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle=OUT; c.strokeText('?',cx+12,sy+8+b); c.fillStyle='#ffe27a'; c.fillText('?',cx+12,sy+8+b); }
  }
  drawOverFog(c,tm,tx0,ty0,tx1,ty1){
    const w=this.w, P=w.player, fac=w.factions[P];
    // lính trung lập nghe thấy trong sương
    for(const [i,type] of fac.memNeutral){ if(fac.explored[i]) continue; const x=i%w.W, y=(i/w.W)|0; if(x<tx0||x>tx1||y<ty0||y>ty1) continue;
      const X=(x+0.5)*TS, Y=(y+0.5)*TS; const b=Math.sin(tm*4+i)*2.5; const p=0.6+0.4*Math.sin(tm*3+i);
      c.fillStyle=`rgba(255,220,90,${0.18*p})`; c.beginPath(); c.arc(X,Y,16,0,7); c.fill();
      c.font='900 16px "Baloo 2",system-ui'; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle=OUT; c.strokeText('!',X,Y-4+b); c.fillStyle='#ffd54a'; c.fillText('!',X,Y-4+b); }
    for(const i of fac.memItems){ if(fac.explored[i]) continue; const x=i%w.W, y=(i/w.W)|0; if(x<tx0||x>tx1||y<ty0||y>ty1) continue; const X=(x+0.5)*TS, Y=(y+0.5)*TS;
      const r=4+Math.sin(tm*5+i)*2; c.fillStyle='rgba(200,240,255,0.9)'; c.beginPath(); for(let k=0;k<8;k++){ const a=k/8*Math.PI*2+tm; const rr2=k%2? r*0.35 : r; c.lineTo(X+Math.cos(a)*rr2,Y+Math.sin(a)*rr2); } c.fill(); }
    // tiến độ mở ô
    for(const job of w.digJobs.values()){ if(job.f!==P) continue; const x=job.i%w.W, y=(job.i/w.W)|0; const X=(x+0.5)*TS, Y=(y+0.5)*TS; const k=Math.min(1,job.prog);
      c.fillStyle='rgba(255,255,255,0.10)'; c.fillRect(x*TS+2,y*TS+2,TS-4,TS-4);
      c.strokeStyle='rgba(0,0,0,0.5)'; c.lineWidth=5; c.beginPath(); c.arc(X,Y,10,0,7); c.stroke();
      c.strokeStyle= job.rate>0? '#7dd3fc' : '#f87171'; c.lineWidth=3.5; c.beginPath(); c.arc(X,Y,10,-Math.PI/2,-Math.PI/2+k*Math.PI*2); c.stroke();
      if(Math.random()<0.25) this.addPart({x:X+(Math.random()-0.5)*20,y:Y+(Math.random()-0.5)*20,kind:'dot',life:0,max:0.5,size:2,col:'#bfe9ff',g:-30,vx:0,vy:-10,add:true});
      const secs = job.rate>0? Math.ceil((1-job.prog)/job.rate) : '–'; c.font='800 9px system-ui'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText(secs+'s',X,Y+1); }
    // bong bóng lời thoại
    for(const [id,b] of this.bubbles){ b.t+=1/60; const u=w.units[id]; if(!u||u.dead||b.t>1.8){ this.bubbles.delete(id); continue; } this.bubble(c,(u.px+0.5)*TS,(u.py)*TS-26,b.text); }
    for(const u of fac.units){ if(u.dead||!u.bubble) continue; if(w.time-u.bubbleT>2.2){ u.bubble=null; continue; } this.bubble(c,(u.px+0.5)*TS,(u.py)*TS-26,u.bubble); }
    // cờ trắng địch thấy được (nổi trên sương để dễ nhận)
  }
  bubble(c,x,y,text){ c.font='800 11px "Baloo 2",system-ui'; const tw=c.measureText(text).width+14; c.fillStyle='rgba(255,255,255,0.95)'; c.strokeStyle=OUT; c.lineWidth=2; rr(c,x-tw/2,y-18,tw,20,8); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x-5,y+2); c.lineTo(x,y+8); c.lineTo(x+5,y+2); c.fill(); c.fillStyle=OUT; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,x,y-8); }
  drawParts(c,dt){
    for(const p of this.parts){ p.life+=dt; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; const k=p.life/p.max; if(k>1) continue;
      if(p.add) c.globalCompositeOperation='lighter'; c.globalAlpha=1-k;
      switch(p.kind){
        case 'dot': c.fillStyle=p.col; c.beginPath(); c.arc(p.x,p.y,p.size*(1-k*0.5),0,7); c.fill(); break;
        case 'star': c.fillStyle=p.col; c.beginPath(); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+p.life*6; const r=i%2? p.size*0.4 : p.size*1.4; c.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r); } c.fill(); break;
        case 'puff': c.fillStyle=p.col; c.beginPath(); c.arc(p.x,p.y,p.size*(1+k*1.6),0,7); c.fill(); break;
        case 'shard': c.fillStyle=p.col; c.save(); c.translate(p.x,p.y); c.rotate(p.life*12); c.fillRect(-p.size,-p.size*0.5,p.size*2,p.size); c.restore(); break;
        case 'slash': { c.strokeStyle=p.col; c.lineWidth=5*(1-k)+1; c.beginPath(); c.arc(p.x,p.y,p.size*(0.8+k*0.5),p.a-1.2+k*0.8,p.a+0.6+k*0.8); c.stroke(); c.strokeStyle='rgba(255,255,255,0.6)'; c.lineWidth=2; c.stroke(); break; }
        case 'hex': c.strokeStyle=p.col; c.lineWidth=3; c.beginPath(); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; c.lineTo(p.x+Math.cos(a)*p.size*(1+k*0.4),p.y+Math.sin(a)*p.size*(1+k*0.4)*0.9); } c.closePath(); c.stroke(); c.fillStyle=p.col; c.globalAlpha=(1-k)*0.25; c.fill(); break;
        case 'ghost': { c.fillStyle=p.col; c.globalAlpha=(1-k)*0.8; const wv=Math.sin(p.life*8)*3; c.beginPath(); c.arc(p.x+wv,p.y,p.size,Math.PI,0); c.lineTo(p.x+wv+p.size,p.y+p.size*1.2); for(let i=0;i<4;i++) c.lineTo(p.x+wv+p.size-(i+0.5)*p.size/2,p.y+p.size*(i%2?1.2:0.8)); c.lineTo(p.x+wv-p.size,p.y+p.size*1.2); c.closePath(); c.fill(); c.fillStyle='#2a1a12'; c.beginPath(); c.arc(p.x+wv-4,p.y-1,1.8,0,7); c.arc(p.x+wv+4,p.y-1,1.8,0,7); c.fill(); break; }
        case 'plus': c.fillStyle=p.col; c.fillRect(p.x-p.size,p.y-p.size*0.3,p.size*2,p.size*0.6); c.fillRect(p.x-p.size*0.3,p.y-p.size,p.size*0.6,p.size*2); break;
        case 'drop': c.fillStyle=p.col; c.beginPath(); c.arc(p.x,p.y,p.size,0,7); c.fill(); break;
        case 'reveal': { const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*(0.6+k)); g.addColorStop(0,'rgba(255,255,230,0.8)'); g.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.size*(0.6+k),0,7); c.fill(); break; }
        case 'pillar': { const g=c.createLinearGradient(p.x,p.y-200,p.x,p.y); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,p.col); c.fillStyle=g; c.fillRect(p.x-p.size*(1-k),p.y-200,p.size*2*(1-k),200); break; }
      }
      c.globalAlpha=1; c.globalCompositeOperation='source-over'; }
    this.parts=this.parts.filter(p=>p.life<p.max);
  }
}

Renderer.prototype.drawFlags=function(c,tm,fac){
  const w=this.w;
  for(const fl of w.flags){ const X=(fl.x+0.5)*TS, Y=(fl.y+0.5)*TS; const col= fl.holder>=0? FACTIONS[fl.holder].color : '#f5f5f5';
    c.globalAlpha=0.65; c.strokeStyle=col; c.lineWidth=2.5; c.setLineDash([8,6]); c.lineDashOffset=-tm*14; c.strokeRect((fl.x-1)*TS+2,(fl.y-1)*TS+2,3*TS-4,3*TS-4); c.setLineDash([]); c.globalAlpha=1;
    c.fillStyle='rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(X,Y+12,10,4,0,0,7); c.fill();
    c.strokeStyle=OUT; c.lineWidth=3; c.beginPath(); c.moveTo(X-2,Y+12); c.lineTo(X-2,Y-34); c.stroke();
    const wv=Math.sin(tm*5+fl.x)*3;
    c.beginPath(); c.moveTo(X-2,Y-34); c.quadraticCurveTo(X+12,Y-32+wv,X+22,Y-28); c.lineTo(X+20,Y-16); c.quadraticCurveTo(X+10,Y-20-wv,X-2,Y-20); c.closePath();
    c.fillStyle=col; c.fill(); c.strokeStyle=OUT; c.lineWidth=2.5; c.stroke();
    if(fl.holder>=0) drawEmblem(c,FACTIONS[fl.holder].emblem,X+10,Y-25,5,'#fff');
  }
};
Renderer.prototype.drawSmokes=function(c,tm){
  for(const s2 of this.w.smokes){ const k=1-Math.max(0,(s2.until-this.w.time)/RULES.smokeDur); const X=(s2.x+0.5)*TS, Y=(s2.y+0.5)*TS;
    for(let i=0;i<7;i++){ const a2=i/7*Math.PI*2+tm*0.6+i; const r=TS*1.1*(0.6+0.4*Math.sin(i*2.3));
      const px=X+Math.cos(a2)*r*0.8, py=Y+Math.sin(a2)*r*0.55;
      c.fillStyle=`rgba(226,226,236,${0.5*(1-k*0.7)})`; c.beginPath(); c.arc(px,py,TS*0.55+Math.sin(tm*2+i)*3,0,7); c.fill(); }
    c.fillStyle=`rgba(240,240,248,${0.55*(1-k*0.7)})`; c.beginPath(); c.arc(X,Y-4,TS*0.75,0,7); c.fill(); }
};
Renderer.prototype.drawWards=function(c,tm){
  const w=this.w, P=w.player;
  for(const wd of w.wards){ if(wd.f!==P) continue; const X=(wd.x+0.5)*TS, Y=(wd.y+0.5)*TS;
    const left=Math.max(0,wd.until-w.time);
    c.globalAlpha= left<3? 0.4+0.3*Math.sin(tm*10):0.95;
    const art=ArtImages['item:scarecrow'];
    c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(X,Y+10,10,4,0,0,7); c.fill();
    if(art) c.drawImage(art,X-TS*0.7,Y-TS*1.2,TS*1.4,TS*1.4);
    else { c.font='26px system-ui'; c.textAlign='center'; c.fillText('👒',X,Y); }
    c.globalAlpha=0.5; c.strokeStyle='#a3e635'; c.lineWidth=2; c.beginPath(); c.ellipse(X,Y+6,RULES.visionBase*TS*0.5*(1+0.04*Math.sin(tm*3)),RULES.visionBase*TS*0.3,0,0,7); c.stroke(); c.globalAlpha=1;
  }
};
