// ============ Sprite chibi vẽ bằng code (thay bằng art ChatGPT qua ART_MANIFEST) ============
const SPR = 96; // khung sprite
const OUT = '#2a1a12';
const ArtImages = {}; // ảnh ngoài nếu tải được
const SpriteCache = new Map();
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function fillStroke(c,fill,lw){ c.fillStyle=fill; c.fill(); c.lineWidth=lw||3; c.strokeStyle=OUT; c.stroke(); }
function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; const f=amt<0?0:255, p=Math.abs(amt); r=Math.round((f-r)*p+r); g=Math.round((f-g)*p+g); b=Math.round((f-b)*p+b); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }

function drawEmblem(c,kind,x,y,r,col){
  c.save(); c.translate(x,y); c.fillStyle=col; c.strokeStyle=OUT; c.lineWidth=Math.max(1.5,r*0.18); c.beginPath();
  switch(kind){
    case 'drop': c.moveTo(0,-r); c.bezierCurveTo(r*0.9,-r*0.1,r*0.8,r,0,r); c.bezierCurveTo(-r*0.8,r,-r*0.9,-r*0.1,0,-r); break;
    case 'flame': c.moveTo(0,-r); c.quadraticCurveTo(r*0.9,-r*0.1,r*0.6,r*0.5); c.quadraticCurveTo(0,r*1.1,-r*0.6,r*0.5); c.quadraticCurveTo(-r*0.7,-r*0.2,-r*0.1,-r*0.2); c.quadraticCurveTo(-r*0.1,-r*0.6,0,-r); break;
    case 'leaf': c.moveTo(0,-r); c.quadraticCurveTo(r,0,0,r); c.quadraticCurveTo(-r,0,0,-r); break;
    case 'star': for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr2=i%2?r*0.45:r; c.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2); } c.closePath(); break;
    case 'heart': c.moveTo(0,r*0.8); c.bezierCurveTo(-r*1.2,-r*0.1,-r*0.5,-r*1.1,0,-r*0.35); c.bezierCurveTo(r*0.5,-r*1.1,r*1.2,-r*0.1,0,r*0.8); break;
    case 'moon': c.arc(0,0,r,0.4,Math.PI*2-0.4); c.arc(r*0.45,0,r*0.7,Math.PI*2-0.7,0.7,true); break;
    case 'wave': c.arc(0,0,r,0,Math.PI*2); break;
    case 'sun': c.arc(0,0,r*0.6,0,Math.PI*2); break;
    case 'square': c.rect(-r*0.75,-r*0.75,r*1.5,r*1.5); break;
    case 'tri': c.moveTo(0,-r); c.lineTo(r*0.9,r*0.7); c.lineTo(-r*0.9,r*0.7); c.closePath(); break;
    case 'diamond': c.moveTo(0,-r); c.lineTo(r*0.75,0); c.lineTo(0,r); c.lineTo(-r*0.75,0); c.closePath(); break;
    default: c.moveTo(-r,-r*0.3); c.lineTo(r,-r*0.3); c.lineTo(r,r*0.3); c.lineTo(-r,r*0.3); c.closePath();
  }
  c.fill(); c.stroke(); c.restore();
}

function drawHead(c, hx, hy, opts){
  // đầu chibi to
  c.beginPath(); c.arc(hx,hy,21,0,Math.PI*2); fillStroke(c,opts.skin||'#ffdcb8',3);
  // má hồng
  c.fillStyle='rgba(255,120,140,0.45)'; c.beginPath(); c.ellipse(hx-10,hy+7,5,3,0,0,Math.PI*2); c.ellipse(hx+12,hy+7,5,3,0,0,Math.PI*2); c.fill();
  // mắt
  if(opts.eyes!=='none'){
    const ey=hy+1; c.fillStyle=OUT;
    if(opts.eyes==='angry'){ c.lineWidth=3; c.strokeStyle=OUT; c.beginPath(); c.moveTo(hx-11,ey-6); c.lineTo(hx-3,ey-3); c.moveTo(hx+13,ey-6); c.lineTo(hx+5,ey-3); c.stroke(); }
    if(opts.eyes==='smug'){ c.lineWidth=3; c.strokeStyle=OUT; c.beginPath(); c.moveTo(hx-11,ey); c.lineTo(hx-3,ey); c.moveTo(hx+5,ey); c.lineTo(hx+13,ey); c.stroke(); }
    else { c.beginPath(); c.ellipse(hx-6,ey,3.4,4.6,0,0,Math.PI*2); c.ellipse(hx+9,ey,3.4,4.6,0,0,Math.PI*2); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(hx-5,ey-2,1.4,0,Math.PI*2); c.arc(hx+10,ey-2,1.4,0,Math.PI*2); c.fill(); }
  }
  // miệng
  c.strokeStyle=OUT; c.lineWidth=2.2; c.beginPath();
  if(opts.mouth==='grin'){ c.arc(hx+2,hy+9,4.5,0.1,Math.PI-0.1); c.fillStyle='#fff'; c.fill(); c.stroke(); }
  else if(opts.mouth==='o'){ c.ellipse(hx+2,hy+11,2.2,2.8,0,0,Math.PI*2); c.fillStyle='#8a2b2b'; c.fill(); }
  else { c.arc(hx+2,hy+9,3.2,0.2,Math.PI-0.2); c.stroke(); }
}
function body(c, col, dark, opts={}){
  // chân
  c.fillStyle=opts.pants||'#4a3a35';
  rr(c,34,74,11,14,4); fillStroke(c,opts.pants||'#4a3a35',2.5); rr(c,51,74,11,14,4); fillStroke(c,opts.pants||'#4a3a35',2.5);
  c.fillStyle='#3a2a20'; rr(c,32,84,14,6,3); fillStroke(c,'#3a2a20',2); rr(c,50,84,14,6,3); fillStroke(c,'#3a2a20',2);
  // thân
  c.beginPath(); c.moveTo(30,56); c.quadraticCurveTo(48,48,66,56); c.lineTo(70,80); c.quadraticCurveTo(48,86,26,80); c.closePath(); fillStroke(c,col,3);
  c.fillStyle=dark; c.fillRect(28,70,40,5); c.strokeStyle=OUT; c.lineWidth=2; c.strokeRect(28,70,40,5);
  c.fillStyle=shade(col,0.35); c.beginPath(); c.moveTo(35,58); c.quadraticCurveTo(48,54,56,57); c.lineTo(54,62); c.quadraticCurveTo(46,60,37,63); c.closePath(); c.fill();
}
function arm(c,x,y,col){ c.beginPath(); c.arc(x,y,6.5,0,Math.PI*2); fillStroke(c,col,2.5); }

function makeUnitSprite(type, fi, variant){
  const key=type+':'+fi+':'+(variant||'');
  if(SpriteCache.has(key)) return SpriteCache.get(key);
  const cv=document.createElement('canvas'); cv.width=SPR; cv.height=SPR; const c=cv.getContext('2d');
  c.lineJoin='round'; c.lineCap='round';
  const F = fi===NEUTRAL ? {color:'#d9d4c7',dark:'#8d8779',light:'#f5f1e6',emblem:'none'} : FACTIONS[fi];
  const col=F.color, dark=F.dark, skin='#ffdcb8';
  const art = ArtImages['unit:'+type];
  if(art){ c.drawImage(recolorUnit(art, fi),0,0,SPR,SPR);
    if(type==='general' && variant>0){ drawGeneralWeapon(c,variant,true); }
    SpriteCache.set(key,cv); return cv; }
  const face={skin, eyes:'dot', mouth:'smile'};
  switch(type){
    case 'general': {
      // cờ lưng (sashimono)
      c.strokeStyle=OUT; c.lineWidth=3; c.beginPath(); c.moveTo(30,58); c.lineTo(22,6); c.stroke();
      c.beginPath(); c.moveTo(22,6); c.lineTo(4,10); c.lineTo(8,32); c.lineTo(25,28); c.closePath(); fillStroke(c,col,2.5); drawEmblem(c,F.emblem,15,19,6,'#fff');
      // áo choàng
      c.beginPath(); c.moveTo(28,54); c.lineTo(20,84); c.quadraticCurveTo(48,92,76,84); c.lineTo(68,54); c.closePath(); fillStroke(c,dark,3);
      body(c,col,'#ffd54a',{pants:'#3b2f2a'});
      // giáp vai vàng
      c.beginPath(); c.ellipse(30,58,9,6,-0.4,0,Math.PI*2); fillStroke(c,'#ffcf3f',2.5); c.beginPath(); c.ellipse(66,58,9,6,0.4,0,Math.PI*2); fillStroke(c,'#ffcf3f',2.5);
      drawGeneralWeapon(c, variant||0, false);
      arm(c,70,66,skin);
      drawHead(c,48,34,{skin,eyes:'smug',mouth:'grin'});
      // mũ giáp + chóp
      c.beginPath(); c.moveTo(25,30); c.quadraticCurveTo(48,4,71,30); c.lineTo(73,34); c.lineTo(23,34); c.closePath(); fillStroke(c,'#ffcf3f',3);
      c.beginPath(); c.moveTo(48,12); c.quadraticCurveTo(60,-2,70,8); c.quadraticCurveTo(58,6,52,16); fillStroke(c,'#ff4d4d',2.5);
      drawEmblem(c,F.emblem,48,24,5,col);
      break; }
    case 'scout': {
      body(c,'#5aa05a','#2f5d2f');
      c.beginPath(); c.moveTo(28,58); c.lineTo(24,80); c.lineTo(34,78); c.closePath(); fillStroke(c,col,2.5);
      // ống nhòm
      c.save(); c.translate(70,46); c.rotate(-0.3); rr(c,-4,-8,22,9,3); fillStroke(c,'#b07b45',2.5); rr(c,14,-10,6,13,2); fillStroke(c,'#ffd166',2); c.restore();
      arm(c,68,50,skin);
      drawHead(c,46,36,{skin,eyes:'dot',mouth:'o'});
      // mũ trùm
      c.beginPath(); c.arc(46,32,23,Math.PI*1.02,Math.PI*1.98); c.lineTo(68,36); c.quadraticCurveTo(46,22,24,36); c.closePath(); fillStroke(c,'#4f8f4a',3);
      c.fillStyle=col; c.fillRect(30,24,32,4);
      break; }
    case 'assassin': {
      body(c,'#2f2a3a','#16131c',{pants:'#1f1b27'});
      c.fillStyle=col; c.fillRect(28,70,40,5);
      c.save(); c.translate(70,70); c.rotate(-1.1); rr(c,-2,-22,4,22,1); fillStroke(c,'#e8eef5',2); rr(c,-5,-1,10,4,1); fillStroke(c,'#555',1.5); c.restore();
      arm(c,68,66,'#2f2a3a');
      drawHead(c,48,36,{skin,eyes:'angry',mouth:'none'});
      // khăn bịt mặt
      c.beginPath(); c.arc(48,36,21.5,Math.PI*0.97,Math.PI*2.03,false); c.lineTo(69,30); c.lineTo(27,30); c.closePath(); fillStroke(c,'#2f2a3a',3);
      c.beginPath(); c.rect(26,38,44,18); c.save(); c.clip(); c.beginPath(); c.arc(48,36,21.5,0,Math.PI); fillStroke(c,'#2f2a3a',3); c.restore();
      c.fillStyle=OUT; c.beginPath(); c.ellipse(42,35,3,2.4,0,0,Math.PI*2); c.ellipse(56,35,3,2.4,0,0,Math.PI*2); c.fill();
      c.fillStyle=col; c.beginPath(); c.moveTo(26,30); c.lineTo(14,24); c.lineTo(16,34); c.closePath(); c.fill();
      break; }
    case 'archer': {
      // ống tên
      rr(c,22,46,10,26,3); fillStroke(c,'#8a5a32',2.5); c.fillStyle='#fff'; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(24+k*3,46); c.lineTo(26+k*3,38); c.lineTo(28+k*3,46); c.fill(); }
      body(c,col,dark);
      // cung
      c.strokeStyle=OUT; c.lineWidth=5; c.beginPath(); c.arc(62,58,24,-1.25,1.25); c.stroke(); c.strokeStyle='#c98a4b'; c.lineWidth=3; c.stroke();
      c.strokeStyle='#eee'; c.lineWidth=1.3; c.beginPath(); c.moveTo(62+Math.cos(-1.25)*24,58+Math.sin(-1.25)*24); c.lineTo(62+Math.cos(1.25)*24,58+Math.sin(1.25)*24); c.stroke();
      arm(c,80,58,skin);
      drawHead(c,46,35,{skin,eyes:'dot',mouth:'smile'});
      // mũ lông vũ
      c.beginPath(); c.ellipse(46,22,22,9,0,Math.PI,0); c.lineTo(70,24); c.lineTo(22,24); c.closePath(); fillStroke(c,'#2e7d4f',3);
      c.beginPath(); c.moveTo(60,18); c.quadraticCurveTo(80,2,84,8); c.quadraticCurveTo(72,12,64,22); fillStroke(c,'#ffeb7a',2);
      c.fillStyle=col; c.fillRect(26,21,40,4);
      break; }
    case 'swordsman': {
      body(c,col,dark);
      c.beginPath(); c.moveTo(32,56); c.lineTo(64,56); c.lineTo(66,72); c.lineTo(30,72); c.closePath(); fillStroke(c,'#b8c2cc',2.5);
      c.save(); c.translate(72,64); c.rotate(-0.25); rr(c,-3,-36,6,36,2); fillStroke(c,'#eef3f8',2.5); rr(c,-9,-2,18,5,2); fillStroke(c,'#8a5a32',2); c.restore();
      arm(c,72,64,skin);
      c.beginPath(); c.arc(26,66,13,0,Math.PI*2); fillStroke(c,dark,3); drawEmblem(c,F.emblem,26,66,6,col);
      drawHead(c,48,35,{skin,eyes:'dot',mouth:'smile'});
      c.beginPath(); c.arc(48,32,23,Math.PI,0); c.lineTo(71,36); c.lineTo(25,36); c.closePath(); fillStroke(c,'#aeb8c2',3);
      rr(c,45,10,6,12,2); fillStroke(c,col,2);
      break; }
    case 'saber': {
      body(c,col,dark,{pants:'#3d2b22'});
      // đại đao
      c.save(); c.translate(70,70); c.rotate(-0.5); rr(c,-2.5,-52,5,58,2); fillStroke(c,'#7a4a26',2.5);
      c.beginPath(); c.moveTo(-3,-50); c.quadraticCurveTo(20,-62,18,-30); c.lineTo(2,-26); c.closePath(); fillStroke(c,'#e8eef5',2.5); c.restore();
      arm(c,70,64,skin); arm(c,30,64,skin);
      drawHead(c,48,35,{skin,eyes:'angry',mouth:'grin'});
      // khăn đầu
      c.beginPath(); c.ellipse(48,22,22,7,0,0,Math.PI*2); fillStroke(c,col,3);
      c.beginPath(); c.moveTo(26,22); c.lineTo(12,30); c.lineTo(16,18); c.closePath(); fillStroke(c,col,2);
      c.fillStyle=OUT; c.beginPath(); c.arc(48,15,6,Math.PI,0); c.fill();
      break; }
    case 'cavalry': {
      // ngựa
      c.beginPath(); c.ellipse(46,68,28,13,0,0,Math.PI*2); fillStroke(c,'#a8693b',3);
      for(const lx of [26,36,56,66]){ rr(c,lx-3,74,7,16,3); fillStroke(c,'#8a5530',2.5); }
      c.beginPath(); c.moveTo(66,62); c.quadraticCurveTo(80,44,88,50); c.quadraticCurveTo(92,58,84,62); c.quadraticCurveTo(78,64,72,72); c.closePath(); fillStroke(c,'#a8693b',3);
      c.fillStyle=OUT; c.beginPath(); c.arc(84,52,2,0,Math.PI*2); c.fill();
      c.beginPath(); c.moveTo(68,56); c.quadraticCurveTo(74,42,82,44); c.lineTo(76,50); fillStroke(c,'#3b2414',2);
      c.beginPath(); c.moveTo(18,64); c.quadraticCurveTo(6,66,10,80); c.quadraticCurveTo(16,72,20,70); fillStroke(c,'#3b2414',2);
      // yên phe
      c.beginPath(); c.ellipse(44,58,14,7,0,0,Math.PI*2); fillStroke(c,col,2.5);
      // người cưỡi
      c.beginPath(); c.moveTo(34,52); c.quadraticCurveTo(46,40,58,52); c.lineTo(58,60); c.lineTo(34,60); c.closePath(); fillStroke(c,col,3);
      // thương kỵ
      c.save(); c.translate(52,50); c.rotate(-0.35); rr(c,0,-3,46,5,2); fillStroke(c,'#8a5a32',2); c.beginPath(); c.moveTo(46,-6); c.lineTo(58,-0.5); c.lineTo(46,5); c.closePath(); fillStroke(c,'#e8eef5',2); c.restore();
      arm(c,56,50,skin);
      c.save(); c.translate(0,-2); drawHead(c,44,28,{skin,eyes:'dot',mouth:'grin'}); c.restore();
      c.beginPath(); c.arc(44,24,22,Math.PI,0); c.lineTo(66,28); c.lineTo(22,28); c.closePath(); fillStroke(c,'#aeb8c2',3);
      c.beginPath(); c.moveTo(44,4); c.quadraticCurveTo(30,-2,26,10); c.quadraticCurveTo(36,6,42,10); fillStroke(c,col,2);
      break; }
    case 'spear': {
      // thương dài
      c.save(); c.translate(70,88); c.rotate(0.05); rr(c,-2.5,-86,5,86,2); fillStroke(c,'#8a5a32',2.5); c.beginPath(); c.moveTo(-6,-84); c.lineTo(0,-98); c.lineTo(6,-84); c.closePath(); fillStroke(c,'#e8eef5',2); c.fillStyle=col; c.fillRect(-5,-80,10,5); c.restore();
      body(c,col,dark);
      arm(c,68,62,skin);
      drawHead(c,46,36,{skin,eyes:'dot',mouth:'smile'});
      // nón lá
      c.beginPath(); c.moveTo(16,30); c.lineTo(46,6); c.lineTo(76,30); c.quadraticCurveTo(46,36,16,30); fillStroke(c,'#f1d58a',3);
      c.strokeStyle='#c9a24f'; c.lineWidth=1.5; c.beginPath(); c.moveTo(30,24); c.lineTo(46,10); c.moveTo(62,24); c.lineTo(46,10); c.stroke();
      break; }
    case 'shield': {
      body(c,col,dark);
      drawHead(c,46,35,{skin,eyes:'dot',mouth:'smile'});
      c.beginPath(); c.arc(46,32,23,Math.PI,0); c.lineTo(69,36); c.lineTo(23,36); c.closePath(); fillStroke(c,'#8f98a3',3);
      // khiên lớn phía trước
      c.beginPath(); c.moveTo(50,44); c.lineTo(82,46); c.lineTo(82,78); c.quadraticCurveTo(66,92,50,80); c.closePath(); fillStroke(c,shade(col,-0.1),3.5);
      c.beginPath(); c.moveTo(55,49); c.lineTo(77,50); c.lineTo(77,76); c.quadraticCurveTo(66,85,55,77); c.closePath(); c.strokeStyle='#ffe08a'; c.lineWidth=2.5; c.stroke();
      drawEmblem(c,F.emblem,66,63,8,'#fff');
      break; }
    case 'crossbow': {
      body(c,col,dark);
      c.save(); c.translate(64,58); rr(c,-6,-3,30,7,2); fillStroke(c,'#8a5a32',2.5); c.strokeStyle=OUT; c.lineWidth=4; c.beginPath(); c.arc(22,0,14,-1.3,1.3,true); c.stroke(); c.strokeStyle='#5b5b66'; c.lineWidth=2.5; c.stroke();
      c.strokeStyle='#ddd'; c.lineWidth=1.2; c.beginPath(); c.moveTo(22-Math.cos(1.3)*14,-Math.sin(1.3)*14); c.lineTo(8,0); c.lineTo(22-Math.cos(1.3)*14,Math.sin(1.3)*14); c.stroke(); c.restore();
      arm(c,64,60,skin);
      drawHead(c,46,35,{skin,eyes:'dot',mouth:'smile'});
      c.beginPath(); c.ellipse(46,20,20,8,0,Math.PI,0); c.lineTo(66,22); c.lineTo(26,22); c.closePath(); fillStroke(c,'#6b4a33',3); rr(c,24,20,46,5,2); fillStroke(c,col,2);
      break; }
    case 'medic': {
      rr(c,62,58,20,18,4); fillStroke(c,'#c98a4b',2.5); c.fillStyle='#e23b3b'; c.fillRect(70,62,4,10); c.fillRect(67,65,10,4);
      body(c,'#f5f5f0',col);
      arm(c,64,62,skin);
      drawHead(c,46,35,{skin,eyes:'dot',mouth:'smile'});
      c.beginPath(); c.ellipse(46,20,22,10,0,Math.PI,0); c.lineTo(68,24); c.lineTo(24,24); c.closePath(); fillStroke(c,'#ffffff',3);
      c.fillStyle='#e23b3b'; c.fillRect(44,10,5,12); c.fillRect(40.5,13.5,12,5);
      c.fillStyle=col; c.fillRect(26,22,40,3);
      break; }
  }
  if(fi===NEUTRAL){ c.globalCompositeOperation='source-atop'; c.fillStyle='rgba(235,230,215,0.45)'; c.fillRect(0,0,SPR,SPR); c.globalCompositeOperation='source-over'; }
  SpriteCache.set(key,cv); return cv;
}
function makeWhite(spr){ const key=spr; if(spr._white) return spr._white; const cv=document.createElement('canvas'); cv.width=spr.width; cv.height=spr.height; const c=cv.getContext('2d'); c.drawImage(spr,0,0); c.globalCompositeOperation='source-in'; c.fillStyle='#fff'; c.fillRect(0,0,cv.width,cv.height); spr._white=cv; return cv; }
function makeFlipped(spr){ if(spr._flip) return spr._flip; const cv=document.createElement('canvas'); cv.width=spr.width; cv.height=spr.height; const c=cv.getContext('2d'); c.translate(cv.width,0); c.scale(-1,1); c.drawImage(spr,0,0); spr._flip=cv; return cv; }

function makeItemSprite(kind){
  const key='item:'+kind; if(SpriteCache.has(key)) return SpriteCache.get(key);
  const cv=document.createElement('canvas'); cv.width=64; cv.height=64; const c=cv.getContext('2d'); c.lineJoin='round';
  const art=ArtImages['item:'+kind]; if(art){ c.drawImage(art,0,0,64,64); SpriteCache.set(key,cv); return cv; }
  if(kind==='bun'){
    c.beginPath(); c.ellipse(32,40,22,16,0,0,Math.PI*2); fillStroke(c,'#fff6e6',3);
    c.beginPath(); c.moveTo(16,36); c.quadraticCurveTo(32,6,48,36); c.quadraticCurveTo(32,30,16,36); fillStroke(c,'#fff8ee',3);
    c.strokeStyle='#e2cfa9'; c.lineWidth=2; for(let k=-2;k<=2;k++){ c.beginPath(); c.moveTo(32+k*5,22+Math.abs(k)*2); c.lineTo(32+k*7,34); c.stroke(); }
    c.fillStyle='#ff9db0'; c.beginPath(); c.ellipse(22,44,4,2.5,0,0,Math.PI*2); c.ellipse(42,44,4,2.5,0,0,Math.PI*2); c.fill();
    c.fillStyle=OUT; c.beginPath(); c.arc(26,40,2,0,Math.PI*2); c.arc(38,40,2,0,Math.PI*2); c.fill();
  } else {
    c.beginPath(); c.moveTo(14,26); c.lineTo(50,26); c.lineTo(46,52); c.quadraticCurveTo(32,58,18,52); c.closePath(); fillStroke(c,'#f2efe6',3);
    c.beginPath(); c.arc(52,38,7,-1.2,1.2); c.lineWidth=4; c.strokeStyle=OUT; c.stroke(); c.lineWidth=2; c.strokeStyle='#f2efe6'; c.stroke();
    c.beginPath(); c.ellipse(32,27,17,4,0,0,Math.PI*2); fillStroke(c,'#e0a040',2);
    c.fillStyle='#3a9b5a'; c.beginPath(); c.ellipse(32,42,6,4,0.4,0,Math.PI*2); c.fill();
    c.strokeStyle='rgba(255,255,255,0.8)'; c.lineWidth=2.5; for(const sx of [24,32,40]){ c.beginPath(); c.moveTo(sx,20); c.quadraticCurveTo(sx-4,12,sx,6); c.stroke(); }
  }
  SpriteCache.set(key,cv); return cv;
}

// Vũ khí tướng theo bậc Lò rèn
function drawGeneralWeapon(c,tier,overlay){
  const wart=ArtImages['weapon:'+tier];
  if(overlay){ if(wart){ c.save(); c.translate(74,58); c.rotate(-0.5); c.drawImage(wart,-20,-40,40,52); c.restore(); } else { c.font='26px system-ui'; c.textAlign='center'; c.fillText(WEAPONS[tier].emoji,76,52); } return; }
  if(wart){ c.save(); c.translate(72,62); c.rotate(-0.45); c.drawImage(wart,-22,-46,44,56); c.restore(); return; }
  c.save(); c.translate(72,66);
  switch(tier){
    case 0: c.rotate(-0.7); rr(c,-3,-30,6,30,2); fillStroke(c,'#c9b36b',2.5); c.strokeStyle='#8a7a3a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(-3,-12); c.lineTo(3,-12); c.moveTo(-3,-22); c.lineTo(3,-22); c.stroke(); rr(c,-2.5,0,5,9,2); fillStroke(c,'#6b3f22',2); break;
    case 1: c.rotate(-0.7); rr(c,-3,-36,6,36,2); fillStroke(c,'#e8eef5',2.5); rr(c,-9,-2,18,5,2); fillStroke(c,'#ffcf3f',2); rr(c,-2.5,3,5,9,2); fillStroke(c,'#6b3f22',2); break;
    case 2: c.rotate(-0.25); rr(c,-2.5,-60,5,70,2); fillStroke(c,'#8a5a32',2.5); c.beginPath(); c.moveTo(-6,-58); c.lineTo(0,-74); c.lineTo(6,-58); c.closePath(); fillStroke(c,'#e8eef5',2); c.fillStyle='#e23b3b'; c.beginPath(); c.arc(0,-56,4,0,7); c.fill(); break;
    case 3: c.rotate(-0.35); rr(c,-2.5,-58,5,66,2); fillStroke(c,'#2f6b3a',2.5); c.beginPath(); c.moveTo(-3,-56); c.quadraticCurveTo(26,-70,22,-34); c.lineTo(2,-30); c.closePath(); fillStroke(c,'#e8f6ff',2.5); c.fillStyle='#3fae5a'; c.beginPath(); c.arc(4,-38,3,0,7); c.fill(); break;
    case 4: c.rotate(-0.3); rr(c,-2.5,-62,5,70,2); fillStroke(c,'#7a2a2a',2.5); c.beginPath(); c.moveTo(0,-78); c.lineTo(-5,-60); c.lineTo(5,-60); c.closePath(); fillStroke(c,'#ffe08a',2); c.beginPath(); c.moveTo(2,-60); c.quadraticCurveTo(20,-62,16,-46); c.lineTo(2,-50); c.closePath(); fillStroke(c,'#ffe08a',2); c.beginPath(); c.moveTo(-2,-60); c.quadraticCurveTo(-20,-62,-16,-46); c.lineTo(-2,-50); c.closePath(); fillStroke(c,'#ffe08a',2); break;
    case 5: c.rotate(-0.6); rr(c,-11,-34,22,40,10); fillStroke(c,'#ffb3c7',3); c.strokeStyle='#e86a8e'; c.lineWidth=2.5; c.beginPath(); c.moveTo(-7,-26); c.lineTo(0,-16); c.lineTo(7,-26); c.stroke(); c.fillStyle='#fff'; c.font='bold 9px system-ui'; c.textAlign='center'; c.fillText('★',0,-2); break;
  }
  c.restore();
}
