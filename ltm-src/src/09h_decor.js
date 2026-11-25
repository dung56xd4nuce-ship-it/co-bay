// 🏮 (5.5) TRANG TRÍ TRẠI — mua bằng Meme Coin, chỉ để ĐẸP (không cộng chỉ số). Bật nhiều món cùng lúc được; vẽ quanh đại bản doanh của người chơi.
const BW_DECOR=[
  {id:'banners',  name:'War Banners',       emoji:'🚩', cost:60,  desc:'Bright pennants on tall poles around your camp.'},
  {id:'lanterns', name:'Festival Lanterns', emoji:'🏮', cost:90,  desc:'A string of glowing red lanterns over the tents.'},
  {id:'blossom',  name:'Cherry Blossoms',   emoji:'🌸', cost:120, desc:'Blossom trees beside the camp, petals drifting in the wind.'},
  {id:'gold',     name:'Golden Palisade',   emoji:'✨', cost:180, desc:'A ring of golden stakes that sparkles in the sun.'},
  {id:'fireworks',name:'Fireworks',         emoji:'🎆', cost:220, desc:'Fireworks burst above your camp all battle long.'},
  {id:'dragon',   name:'Dragon Standard',   emoji:'🐉', cost:260, desc:'A huge dragon banner and a glowing ring of honour.'},
];
const BW_DECOR_BY={}; for(const d of BW_DECOR) BW_DECOR_BY[d.id]=d;
// layer 0 = sau lều, 1 = trước lều. (x,y) = tâm trại theo toạ độ bản đồ; t = giây.
BW.drawDecor=function(c,x,y,ids,t,layer){ if(!ids||!ids.length) return; const has=(k)=>ids.indexOf(k)>=0, S=Math.sin, C=Math.cos; c.save(); c.lineJoin='round'; c.lineCap='round';
  if(layer===0){
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
    if(has('gold')){ for(let i=0;i<13;i++){ const u=i/12, an=Math.PI*(0.04+0.92*u), px=x-C(an)*150, py=y+48+S(an)*40; c.fillStyle='#b8860b'; c.strokeStyle='#5a3a1e'; c.lineWidth=2.5; c.beginPath(); c.moveTo(px-7,py+6); c.lineTo(px-7,py-22); c.lineTo(px,py-34); c.lineTo(px+7,py-22); c.lineTo(px+7,py+6); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ffd54a'; c.fillRect(px-4,py-22,4,24);
        const sp=S(t*3+i*2.1); if(sp>0.82){ c.fillStyle='#fff'; c.globalAlpha=(sp-0.82)/0.18; c.beginPath(); c.moveTo(px,py-46); c.lineTo(px+4,py-36); c.lineTo(px+12,py-34); c.lineTo(px+4,py-31); c.lineTo(px,py-22); c.lineTo(px-4,py-31); c.lineTo(px-12,py-34); c.lineTo(px-4,py-36); c.closePath(); c.fill(); c.globalAlpha=1; } } }
    if(has('blossom')){ for(let i=0;i<14;i++){ const ph=((t*0.22+i*0.137)%1), px=x-190+((i*71)%380)+S(t*1.5+i)*14, py=y-150+ph*220; c.globalAlpha=0.9*(1-Math.abs(ph-0.5)*1.6>0? Math.min(1,1.6-Math.abs(ph-0.5)*3) : 0); c.fillStyle= i%2? '#ffb7d0' : '#ffd9e6'; c.beginPath(); c.ellipse(px,py,6,3.4,t*2+i,0,7); c.fill(); } c.globalAlpha=1; }
  }
  c.restore(); };
