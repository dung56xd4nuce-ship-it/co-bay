// 🏮 (5.5) TRANG TRÍ TRẠI — mua bằng Meme Coin, chỉ để ĐẸP (không cộng chỉ số). Bật nhiều món cùng lúc được; vẽ quanh đại bản doanh của người chơi.
const BW_DECOR=[
  {id:'banners',  name:'War Banners',       emoji:'🚩', cost:60,  desc:'Bright pennants on tall poles around your camp.'},
  {id:'lanterns', name:'Festival Lanterns', emoji:'🏮', cost:90,  desc:'A string of glowing red lanterns over the tents.'},
  {id:'blossom',  name:'Cherry Blossoms',   emoji:'🌸', cost:120, desc:'Blossom trees beside the camp, petals drifting in the wind.'},
  {id:'gold',     name:'Golden Palisade',   emoji:'✨', cost:180, desc:'A ring of golden stakes that sparkles in the sun.'},
  {id:'fireworks',name:'Fireworks',         emoji:'🎆', cost:220, desc:'Fireworks burst above your camp all battle long.'},
  {id:'dragon',   name:'Dragon Standard',   emoji:'🐉', cost:260, desc:'A huge dragon banner and a glowing ring of honour.'},
  /* (5.6) thêm món vẽ bằng mã */
  {id:'bunting',  name:'Party Bunting',     emoji:'🎏', cost:50,  desc:'Strings of colourful triangle flags fluttering over the camp.'},
  {id:'torches',  name:'Torch Ring',        emoji:'🔥', cost:70,  desc:'Four tall torches with dancing flames around the tent.'},
  {id:'garden',   name:'Flower Garden',     emoji:'🌼', cost:80,  desc:'Beds of bright flowers in front of your camp.'},
  {id:'bonfire',  name:'War Bonfire',       emoji:'🪵', cost:110, desc:'A roaring bonfire with sparks rising into the sky.'},
  {id:'confetti', name:'Victory Confetti',  emoji:'🎊', cost:150, desc:'Bursts of confetti keep raining over your camp.'},
  {id:'rainbow',  name:'Lucky Rainbow',     emoji:'🌈', cost:200, desc:'A shimmering rainbow arching over the camp.'},
  /* (5.6) thêm món do ChatGPT vẽ (chỉ bán khi ảnh đã có trong game) */
  {id:'bonsai',   name:'Bonsai Pots',       emoji:'🪴', cost:90,  img:'decor:bonsai',   desc:'A pair of neatly trimmed bonsai trees in glazed pots.'},
  {id:'lions',    name:'Stone Guardian Lions', emoji:'🦁', cost:140, img:'decor:lions', desc:'Two stone lions guard the entrance to your camp.'},
  {id:'koipond',  name:'Koi Pond',          emoji:'🐟', cost:160, img:'decor:koipond',  desc:'A little pond with lucky koi and lily pads.'},
  {id:'luckycat', name:'Lucky Cat',         emoji:'🐱', cost:170, img:'decor:luckycat', desc:'A giant waving lucky cat that brings good fortune.'},
  {id:'drumtower',name:'War Drum Tower',    emoji:'🥁', cost:210, img:'decor:drumtower',desc:'A wooden tower with a great red war drum.'},
  {id:'coinstatue',name:'Meme Coin Statue', emoji:'🪙', cost:240, img:'decor:coinstatue',desc:'A golden monument to the mighty Meme Coin.'},
  {id:'elephant', name:'War Elephant Statue', emoji:'🐘', cost:280, img:'decor:elephant', desc:'A grand golden war-elephant statue behind your tent.'},
  {id:'gate',     name:'Festival Gate',     emoji:'⛩️', cost:130, img:'decor:gate',     desc:'A red festival archway hung with lanterns in front of your camp.'},
  {id:'barrels',  name:'Rice Wine Barrels', emoji:'🛢️', cost:75,  img:'decor:barrels',  desc:'Barrels of rice wine stacked for the victory feast.'},
  {id:'stonelamp',name:'Stone Lanterns',    emoji:'🏮', cost:100, img:'decor:stonelamp',desc:'A pair of stone garden lanterns glowing warmly.'},
  {id:'watchtower',name:'Watch Tower',      emoji:'🗼', cost:150, img:'decor:watchtower',desc:'A wooden lookout tower flying your flag.'},
  {id:'warrior',  name:'Warrior Statues',   emoji:'🗿', cost:190, img:'decor:warrior',  desc:'Two stone warriors stand guard by your tent.'},
  {id:'shrine',   name:'Little Shrine',     emoji:'⛩️', cost:200, img:'decor:shrine',   desc:'A small red shrine with a bell for good luck.'},
  {id:'treasure', name:'Treasure Hoard',    emoji:'💰', cost:230, img:'decor:treasure', desc:'A golden chest overflowing with coins and gems.'},
  {id:'phoenix',  name:'Golden Phoenix',    emoji:'🦅', cost:300, img:'decor:phoenix',  desc:'A golden phoenix statue on a tall stone pillar.'},
  {id:'pagoda',   name:'Grand Pagoda',      emoji:'🏯', cost:360, img:'decor:pagoda',   desc:'A towering three-roofed pagoda behind your camp — the grandest of all.'},
  {id:'ascflag',  name:'Ascension Banner',  emoji:'★', cost:0, earn:'asc', desc:'Earned, not bought: win the Great War to unlock ★ Ascension. Shows your highest ★ — bronze, silver, gold, then rainbow at ★10.'},
  {id:'dragonstatue',name:'Jade Dragon Statue', emoji:'🐲', cost:320, img:'decor:dragonstatue', desc:'A coiled jade dragon on a stone plinth — the pride of your camp.'},
];
/* chỗ đặt các món ảnh quanh lều: [dx, dy(đáy ảnh), rộng, lật đôi?]; dy<0 vẽ sau lều, dy>0 vẽ trước lều */
BW.DECOR_SLOT={ gate:[[-250,150,128]], barrels:[[-168,128,76]], stonelamp:[[-96,150,58],[96,150,58,1]], watchtower:[[-150,-104,132]], warrior:[[-212,60,84],[212,60,84,1]], shrine:[[150,-104,124]], treasure:[[168,150,92]], phoenix:[[-118,-140,104]], pagoda:[[86,-150,170]], bonsai:[[-62,104,62],[62,104,62,1]], lions:[[-122,86,96],[122,86,96,1]], koipond:[[0,150,176]], luckycat:[[196,112,104]], coinstatue:[[-196,112,116]], drumtower:[[236,0,156]], dragonstatue:[[-238,0,160]], elephant:[[0,-96,170]] };
BW.decorAvail=function(d){ return !d.img || !!(typeof ArtImages!=='undefined'&&ArtImages[d.img]); };
const BW_DECOR_BY={}; for(const d of BW_DECOR) BW_DECOR_BY[d.id]=d;
// layer 0 = sau lều, 1 = trước lều. (x,y) = tâm trại theo toạ độ bản đồ; t = giây.
BW.drawDecor=function(c,x,y,ids,t,layer){ if(!ids||!ids.length) return; const has=(k)=>ids.indexOf(k)>=0, S=Math.sin, C=Math.cos; c.save(); c.lineJoin='round'; c.lineCap='round';
  const imgs=(L)=>{ for(const id of ids){ const sl=BW.DECOR_SLOT[id], d=BW_DECOR_BY[id]; if(!sl||!d||!d.img) continue; const im=typeof ArtImages!=='undefined'? ArtImages[d.img] : null; if(!im) continue;
      for(const [dx0,dy,w,flip] of sl){ if((dy<0? 0 : 1)!==L) continue; const W0=(typeof BW!=='undefined'&&BW.W)||1e9, dx= x+dx0-w*0.4<20? Math.abs(dx0)+150 : x+dx0+w*0.4>W0-20? -(Math.abs(dx0)+150) : dx0;   /* trại sát mép bản đồ: món bị tràn ra ngoài thì dời sang phía trong */ const h=w*(im.height/im.width), bob= id==='luckycat'? Math.sin(t*3)*2 : 0; c.save(); c.translate(x+dx,y+dy+bob); if(flip) c.scale(-1,1);
        c.fillStyle='rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0,-2,w*0.42,w*0.12,0,0,7); c.fill(); c.drawImage(im,-w/2,-h,w,h); c.restore(); } } };
  if(layer===0){
    if(has('ascflag')){ const n=Math.max(1,BW.ascStars|0), px=x-58, top=y-238, tier= n>=10? 3 : n>=7? 2 : n>=4? 1 : 0, cols=[['#c9863f','#8a5524'],['#d8dde6','#8d96a8'],['#ffd54a','#c98a12'],['#ff6bd6','#6b8cff']][tier];   /* 🚩 (5.9) cờ Thăng Thiên: số ★ cao nhất, màu theo bậc */
      c.strokeStyle='#4a3216'; c.lineWidth=7; c.beginPath(); c.moveTo(px,y+18); c.lineTo(px,top); c.stroke(); c.fillStyle=cols[0]; c.beginPath(); c.arc(px,top-5,8,0,7); c.fill();
      const fw=84, fh=58, wv=(u)=>S(t*3+u*4)*6*u; let g=c.createLinearGradient(px-fw,top,px,top+fh); if(tier===3){ g.addColorStop(0,'#ff6bd6'); g.addColorStop(0.5,'#ffd54a'); g.addColorStop(1,'#4dd0ff'); } else { g.addColorStop(0,cols[0]); g.addColorStop(1,cols[1]); }
      c.fillStyle=g; c.beginPath(); c.moveTo(px,top+4); for(let i=0;i<=10;i++){ const u=i/10; c.lineTo(px-u*fw,top+4+wv(u)); } c.lineTo(px-fw+10,top+4+fh/2+wv(1)); for(let i=10;i>=0;i--){ const u=i/10; c.lineTo(px-u*fw,top+4+fh+wv(u)); } c.closePath(); c.fill(); c.strokeStyle='rgba(40,20,10,0.7)'; c.lineWidth=3; c.stroke();
      c.font='900 24px "Baloo 2",system-ui'; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=5; c.strokeStyle='#2a1a12'; c.fillStyle='#fff'; const tx=px-fw*0.48, ty=top+4+fh/2+wv(0.48); c.strokeText('★'+n,tx,ty); c.fillText('★'+n,tx,ty); c.textBaseline='alphabetic'; }
    if(has('rainbow')){ const cols=['#ff5b5b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa']; c.globalAlpha=0.55+0.15*S(t*1.5); for(let i=0;i<cols.length;i++){ c.strokeStyle=cols[i]; c.lineWidth=9; c.beginPath(); c.arc(x,y+60,250-i*9,Math.PI*1.03,Math.PI*1.97); c.stroke(); } c.globalAlpha=1; }
    imgs(0);
    if(has('bunting')){ const cols=['#ff5b5b','#ffd23b','#4dabf7','#69db7c','#ff9ee0','#ffa94d']; for(const [x0,x1,yy] of [[-170,0,-118],[0,170,-118]]){ const ax=x+x0, bx=x+x1, ay=y+yy; c.strokeStyle='#5a3a1e'; c.lineWidth=3; c.beginPath(); c.moveTo(ax,ay); c.quadraticCurveTo((ax+bx)/2,ay+34,bx,ay); c.stroke();
        for(let i=1;i<8;i++){ const u=i/8, px=ax+(bx-ax)*u, py=ay+34*2*u*(1-u)*1+S(t*4+i)*1.5; c.fillStyle=cols[(i+(x0<0?0:3))%cols.length]; c.beginPath(); c.moveTo(px-8,py); c.lineTo(px+8,py); c.lineTo(px+S(t*5+i)*2,py+18); c.closePath(); c.fill(); } }
      c.strokeStyle='#5a3a1e'; c.lineWidth=5; for(const dx of [-170,0,170]){ c.beginPath(); c.moveTo(x+dx,y+(dx===0?-70:30)); c.lineTo(x+dx,y-122); c.stroke(); } }
    if(has('dragon')){ const p=0.5+0.5*S(t*2.2); c.globalAlpha=0.35+0.25*p; c.strokeStyle='#ffd54a'; c.lineWidth=7; c.beginPath(); c.ellipse(x,y+48,150+8*p,44+3*p,0,0,7); c.stroke(); c.globalAlpha=0.16; c.fillStyle='#ffd54a'; c.beginPath(); c.ellipse(x,y+48,150,44,0,0,7); c.fill(); c.globalAlpha=1;
      const px=x+6, top=y-250; c.strokeStyle='#5a3a1e'; c.lineWidth=9; c.beginPath(); c.moveTo(px,y+30); c.lineTo(px,top); c.stroke(); c.fillStyle='#ffd54a'; c.beginPath(); c.arc(px,top-6,10,0,7); c.fill();
      c.beginPath(); const L=150, H=64; for(let i=0;i<=12;i++){ const u=i/12, wx=px+u*L, wy=top+8+S(t*3+u*5)*9*u; if(i===0) c.moveTo(wx,wy); else c.lineTo(wx,wy); } for(let i=12;i>=0;i--){ const u=i/12, wx=px+u*L, wy=top+8+H*(1-u*0.25)+S(t*3+u*5+0.6)*9*u; c.lineTo(wx,wy); } c.closePath(); c.fillStyle='#c81e1e'; c.fill(); c.strokeStyle='#ffd54a'; c.lineWidth=5; c.stroke();
      c.strokeStyle='#ffd54a'; c.lineWidth=6; c.beginPath(); for(let i=0;i<=14;i++){ const u=i/14, wx=px+14+u*(L-34), wy=top+8+H*0.5+S(u*9+t*3)*13; if(i===0) c.moveTo(wx,wy); else c.lineTo(wx,wy); } c.stroke(); c.fillStyle='#ffd54a'; c.beginPath(); c.arc(px+L-18,top+8+H*0.5+S(9+t*3)*13,8,0,7); c.fill(); }
    if(has('blossom')){ for(const sx of [-150,158]){ const bx=x+sx, by=y+34; c.strokeStyle='#6b4226'; c.lineWidth=10; c.beginPath(); c.moveTo(bx,by); c.quadraticCurveTo(bx+(sx<0?-8:8),by-50,bx,by-88); c.stroke();
        for(const [dx,dy,r,col] of [[0,-112,40,'#ffb7d0'],[-30,-92,30,'#ff9ec0'],[30,-94,31,'#ffc8dc'],[-6,-136,26,'#ffd9e6'],[18,-118,20,'#ff8fb5']]){ c.fillStyle=col; c.beginPath(); c.arc(bx+dx,by+dy,r,0,7); c.fill(); } } }
    if(has('lanterns')){ const x0=x-128, x1=x+128, yt=y-150; c.strokeStyle='#5a3a1e'; c.lineWidth=7; for(const px of [x0,x1]){ c.beginPath(); c.moveTo(px,y+34); c.lineTo(px,yt); c.stroke(); }
      c.strokeStyle='#3b2a1a'; c.lineWidth=3; c.beginPath(); c.moveTo(x0,yt); c.quadraticCurveTo(x,yt+58,x1,yt); c.stroke();
      for(let i=1;i<=5;i++){ const u=i/6, lx=x0+(x1-x0)*u, ly=yt+58*2*u*(1-u)*1+10+S(t*2+i)*2, g=0.6+0.4*S(t*3+i*1.7); c.globalAlpha=0.28*g; c.fillStyle='#ffb347'; c.beginPath(); c.arc(lx,ly+10,24,0,7); c.fill(); c.globalAlpha=1;
        c.fillStyle='#e02424'; c.beginPath(); c.ellipse(lx,ly+10,11,14,0,0,7); c.fill(); c.fillStyle='#ffd54a'; c.fillRect(lx-7,ly-6,14,4); c.fillRect(lx-7,ly+22,14,4); c.strokeStyle='#ffd54a'; c.lineWidth=2; c.beginPath(); c.moveTo(lx,ly+26); c.lineTo(lx,ly+36); c.stroke(); } }
    if(has('banners')){ const cols=['#ff3b3b','#ffd23b','#3bb4ff','#52e07a']; [[-176,18],[-112,-62],[112,-62],[176,18]].forEach(([dx,dy],i)=>{ const px=x+dx, py=y+dy+30, top=py-120; c.strokeStyle='#5a3a1e'; c.lineWidth=6; c.beginPath(); c.moveTo(px,py); c.lineTo(px,top); c.stroke();
        const w=S(t*4+i*1.3)*7, dir=dx<0?-1:1; c.fillStyle=cols[i]; c.strokeStyle='#2a1a12'; c.lineWidth=3; c.beginPath(); c.moveTo(px,top+2); c.lineTo(px+dir*52,top+18+w); c.lineTo(px,top+36); c.closePath(); c.fill(); c.stroke(); }); }
    if(has('fireworks')){ for(let k=0;k<3;k++){ const T=2.6, ph=((t+k*0.87)%T)/T, seed=Math.floor((t+k*0.87)/T)*7+k*13, fx=x+((seed*37)%240)-120, fy=y-230-((seed*53)%90), col=['#ff5b5b','#ffd54a','#7dffcf','#b78bff','#ff9ee0'][seed%5];
        if(ph<0.25){ c.globalAlpha=0.8; c.strokeStyle='#fff3c4'; c.lineWidth=3; const u=ph/0.25; c.beginPath(); c.moveTo(fx,y-60-(fy-(y-60))*0*u); c.moveTo(fx,y-40+(fy-(y-40))*u+16); c.lineTo(fx,y-40+(fy-(y-40))*u); c.stroke(); }
        else { const u=(ph-0.25)/0.75, R=14+70*Math.sqrt(u); c.globalAlpha=Math.max(0,1-u); c.strokeStyle=col; c.lineWidth=4; for(let a=0;a<12;a++){ const an=a*Math.PI/6+seed; c.beginPath(); c.moveTo(fx+C(an)*R*0.55,fy+S(an)*R*0.55+u*u*18); c.lineTo(fx+C(an)*R,fy+S(an)*R+u*u*18); c.stroke(); } c.fillStyle='#fff'; c.globalAlpha=Math.max(0,0.9-u*2); c.beginPath(); c.arc(fx,fy,6,0,7); c.fill(); } } c.globalAlpha=1; }
  } else {
    imgs(1);
    if(has('garden')){ const cols=['#ff6b9a','#ffd23b','#b78bff','#ff8f5b','#ffffff']; for(const side of [-1,1]){ const bx=x+side*128, by=y+112; c.fillStyle='#6b4a2e'; c.beginPath(); c.ellipse(bx,by,58,16,0,0,7); c.fill(); c.fillStyle='#3f8f3a'; c.beginPath(); c.ellipse(bx,by-4,52,12,0,0,7); c.fill();
        for(let i=0;i<9;i++){ const fx=bx-44+i*11, fy=by-8-((i*7)%3)*4+S(t*2+i)*1.2; c.fillStyle=cols[(i+(side>0?2:0))%cols.length]; for(let k=0;k<5;k++){ c.beginPath(); c.arc(fx+C(k*1.256)*4,fy+S(k*1.256)*4,3.2,0,7); c.fill(); } c.fillStyle='#ffd54a'; c.beginPath(); c.arc(fx,fy,2.4,0,7); c.fill(); } } }
    if(has('torches')){ for(const [dx,dy] of [[-104,74],[104,74],[-150,-6],[150,-6]]){ const px=x+dx, py=y+dy; c.strokeStyle='#5a3a1e'; c.lineWidth=6; c.beginPath(); c.moveTo(px,py); c.lineTo(px,py-62); c.stroke(); c.fillStyle='#3b2a1a'; c.fillRect(px-7,py-68,14,8);
        const fl=0.8+0.2*S(t*13+dx); c.globalAlpha=0.3; c.fillStyle='#ffb347'; c.beginPath(); c.arc(px,py-80,22*fl,0,7); c.fill(); c.globalAlpha=1; c.fillStyle='#ff7a1a'; c.beginPath(); c.moveTo(px-9,py-68); c.quadraticCurveTo(px-10,py-84,px+S(t*9+dx)*3,py-98*fl+0); c.quadraticCurveTo(px+10,py-84,px+9,py-68); c.closePath(); c.fill(); c.fillStyle='#ffe066'; c.beginPath(); c.ellipse(px,py-75,4.5,8*fl,0,0,7); c.fill(); } }
    if(has('bonfire')){ const px=x+0, py=y+140; c.fillStyle='#6b4226'; c.save(); c.translate(px,py); for(const an of [-0.5,0.5,0]){ c.save(); c.rotate(an); c.fillRect(-28,-6,56,11); c.restore(); } c.restore();
      const fl=0.85+0.15*S(t*11); c.globalAlpha=0.28; c.fillStyle='#ff9a3c'; c.beginPath(); c.arc(px,py-26,46*fl,0,7); c.fill(); c.globalAlpha=1;
      for(const [w,h,col] of [[26,58,'#ff5a1a'],[18,44,'#ffa21a'],[10,28,'#ffe066']]){ c.fillStyle=col; c.beginPath(); c.moveTo(px-w,py-4); c.quadraticCurveTo(px-w*1.1,py-h*0.6,px+S(t*8)*4,py-h*fl); c.quadraticCurveTo(px+w*1.1,py-h*0.6,px+w,py-4); c.closePath(); c.fill(); }
      for(let i=0;i<6;i++){ const ph=((t*0.7+i/6)%1), sx=px+S(i*2.3+t*2)*18*ph; c.globalAlpha=1-ph; c.fillStyle='#ffd54a'; c.beginPath(); c.arc(sx,py-50-ph*90,2.6,0,7); c.fill(); } c.globalAlpha=1; }
    if(has('confetti')){ const cols=['#ff5b5b','#ffd23b','#4dabf7','#69db7c','#ff9ee0','#b78bff']; for(let i=0;i<26;i++){ const ph=((t*0.35+i*0.0385)%1), px=x-200+((i*53)%400)+S(t*2+i)*16, py=y-230+ph*300; c.globalAlpha=Math.min(1,(1-ph)*2.5); c.fillStyle=cols[i%cols.length]; c.save(); c.translate(px,py); c.rotate(t*4+i); c.fillRect(-4,-2,8,4); c.restore(); } c.globalAlpha=1; }
    if(has('gold')){ for(let i=0;i<13;i++){ const u=i/12, an=Math.PI*(0.04+0.92*u), px=x-C(an)*150, py=y+48+S(an)*40; c.fillStyle='#b8860b'; c.strokeStyle='#5a3a1e'; c.lineWidth=2.5; c.beginPath(); c.moveTo(px-7,py+6); c.lineTo(px-7,py-22); c.lineTo(px,py-34); c.lineTo(px+7,py-22); c.lineTo(px+7,py+6); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ffd54a'; c.fillRect(px-4,py-22,4,24);
        const sp=S(t*3+i*2.1); if(sp>0.82){ c.fillStyle='#fff'; c.globalAlpha=(sp-0.82)/0.18; c.beginPath(); c.moveTo(px,py-46); c.lineTo(px+4,py-36); c.lineTo(px+12,py-34); c.lineTo(px+4,py-31); c.lineTo(px,py-22); c.lineTo(px-4,py-31); c.lineTo(px-12,py-34); c.lineTo(px-4,py-36); c.closePath(); c.fill(); c.globalAlpha=1; } } }
    if(has('blossom')){ for(let i=0;i<14;i++){ const ph=((t*0.22+i*0.137)%1), px=x-190+((i*71)%380)+S(t*1.5+i)*14, py=y-150+ph*220; c.globalAlpha=0.9*(1-Math.abs(ph-0.5)*1.6>0? Math.min(1,1.6-Math.abs(ph-0.5)*3) : 0); c.fillStyle= i%2? '#ffb7d0' : '#ffd9e6'; c.beginPath(); c.ellipse(px,py,6,3.4,t*2+i,0,7); c.fill(); } c.globalAlpha=1; }
  }
  c.restore(); };
