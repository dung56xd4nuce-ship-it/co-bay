// 🎓 (5.5) HƯỚNG DẪN LẦN ĐẦU — một trận tập có KHOÁ THAO TÁC: mỗi bước chỉ cho làm đúng một việc (chỗ được chạm sáng lên, phần còn lại tối đi),
// kèm ghi chú ngắn. Máy đứng yên suốt trận tập. Xong thì báo cho 08_main.js (tut.done) để thưởng xu và mở chiến dịch.
BW.TUT=[
  {k:'sel',  text:'Welcome, Commander! This is YOUR stronghold. The number is how many troops it holds.\n👆 TAP it to select it.'},
  {k:'tgt',  text:'Grey posts are NEUTRAL. If your army is bigger, their troops JOIN you.\n👆 TAP the grey post.'},
  {k:'go',   text:'This is the order menu. “All · ½ · ¼” sets how many troops go — the rest stay to guard.\n👆 TAP the order to send your army.'},
  {k:'wait', text:'Armies march on their own. Roads are fastest; forests and mountains slow them down; rivers are crossed at fords.'},
  {k:'sel2', text:'The post is yours — and your army GREW!\n👆 TAP your new post.'},
  {k:'tgt2', text:'Red posts belong to the ENEMY. Their numbers stay hidden until you scout or fight them.\n👆 TAP the red post.'},
  {k:'go2',  text:'Each unit type beats one type and fears another — the menu shows ▲ or ▼.\n👆 TAP “Attack”.'},
  {k:'wait2',text:'Battle! The bigger, better-matched army wins. Reinforcements can join a fight in progress.'},
  {k:'info', text:'You won! To win a stage, capture the enemy CAMP — and never leave your own camp empty.\n🌾 Farms feed bigger armies · 📣 calls your camps together · 🚑 rescues a camp · 🎒 uses supplies.'},
];
BigWar.prototype.tutStart=function(){ const F=this.localFid, d=(a,b)=>hyp(a.x-b.x,a.y-b.y); this.aiTurn=()=>{}; this.nextWaveF={1:1e9}; this.nextAiScout=1e9; this.intro=null; this.autoMenu=false; this.armies.length=0;
  const A=this.nodes.filter(n=>n.owner===F&&!n.camp&&!n.eco).sort((a,b)=>b.count-a.count)[0]; A.count=600; A.mix=null;
  const neu=this.nodes.filter(n=>n.owner===2&&!n.eco&&!n.camp).sort((a,b)=>d(a,A)-d(b,A)), T1=neu[0], T2=neu.slice(1).sort((a,b)=>d(a,T1)-d(b,T1))[0];
  T1.count=120; T1.ambush=false; T2.owner=1; T2.type=this.civType(1); T2.count=150; T2.mix=null; T2.ambush=false; T2.food=50;
  this.tut={step:-1,A,T1,T2,t:0,done:false,skipped:false,nag:0}; this.tutGo(0); if(this._updateVision) this._updateVision(); };
BigWar.prototype.tutGo=function(i){ const U=this.tut; U.step=i; U.t=0; const k=BW.TUT[i].k, m=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  const f= k==='sel'? U.A : k==='tgt'||k==='go'? m(U.A,U.T1) : k==='wait'||k==='sel2'? U.T1 : k==='tgt2'||k==='go2'||k==='wait2'? m(U.T1,U.T2) : null;
  if(f){ const need= k==='sel'||k==='sel2'||k==='wait'? 1.15 : Math.max(0.55,Math.min(1.15, 0.5*Math.min(this.lastVw||800,this.lastVh||400)/Math.max(1,(this.scale0||0.3))/ (hyp(U.A.x-U.T2.x,U.A.y-U.T2.y)+260))); this.jumpTo(f.x,f.y,need); } };
BigWar.prototype.tutFocus=function(){ const U=this.tut, k=BW.TUT[U.step].k, sc=this.scale||1, w=(n)=>({x:(n.x-this.camX)*sc,y:(n.y-(this.camY||0))*sc,r:Math.max(46,95*sc)});
  if(k==='sel') return w(U.A); if(k==='tgt') return w(U.T1); if(k==='sel2') return w(U.T1); if(k==='tgt2') return w(U.T2);
  if(k==='go'||k==='go2'){ const r=(this._menuRects||[]).find(q=>q.id==='attack'||q.id==='move')||(this._menuRects||[]).find(q=>!q.sel&&q.id!=='cancel'); return r? {rect:r} : null; }
  return null; };
// chạm màn hình: true = nuốt (không làm gì) · false = bỏ qua HUD, coi là chạm bản đồ · null = để game xử lý bình thường
BigWar.prototype.tutScreen=function(sx,sy){ const U=this.tut, k=BW.TUT[U.step].k, hit=(r)=>r&&sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h;
  if(hit(U.skipR)){ U.done=true; U.skipped=true; return true; }
  if(k==='info'){ if(hit(U.okR)){ U.done=true; audio.click&&audio.click(); } return true; }
  if(k==='wait'||k==='wait2') return true;
  if(k==='go'||k==='go2'){ const f=this.tutFocus(); if(f&&f.rect&&hit(f.rect)) return null; U.nag=1; return true; }
  return false; };
BigWar.prototype.tutWorld=function(wx,wy){ const U=this.tut, k=BW.TUT[U.step].k, n= k==='sel'? U.A : k==='tgt'||k==='sel2'? U.T1 : k==='tgt2'? U.T2 : null; if(n&&hyp(wx-n.x,wy-n.y)<=Math.max(115,60/Math.max(0.05,this.scale||1))) return {x:n.x,y:n.y}; U.nag=1; return null; };
BigWar.prototype.tutUpdate=function(dt){ const U=this.tut; if(!U||U.done) return; U.t+=dt; U.nag=Math.max(0,U.nag-dt*2.5); const F=this.localFid, k=BW.TUT[U.step].k;
  for(const a of this.armies) if(a.owner===F) a.food=Math.max(a.food||0,80);
  const menuTo=(n)=>this.menu&&this.menu.tgtNode===n, marching=(n)=>this.armies.some(a=>a.owner===F&&!a.done&&(a.to===n.id||a.btl));
  if(k==='sel'){ if(this.sel===U.A) this.tutGo(1); }
  else if(k==='tgt'){ if(menuTo(U.T1)) this.tutGo(2); else if(this.sel!==U.A&&!this.menu) this.tutGo(0); }
  else if(k==='go'){ if(marching(U.T1)||U.T1.owner===F) this.tutGo(3); else if(!this.menu) this.tutGo(this.sel===U.A?1:0); }
  else if(k==='wait'){ if(U.T1.owner===F&&!this.armies.some(a=>a.owner===F&&!a.done)){ U.T1.count=Math.max(U.T1.count,600); this.sel=null; this.menu=null; this.tutGo(4); } else if(U.t>40&&!marching(U.T1)){ U.A.count=Math.max(U.A.count,600); this.tutGo(0); } }
  else if(k==='sel2'){ if(this.sel===U.T1) this.tutGo(5); }
  else if(k==='tgt2'){ if(menuTo(U.T2)) this.tutGo(6); else if(this.sel!==U.T1&&!this.menu) this.tutGo(4); }
  else if(k==='go2'){ if(marching(U.T2)||U.T2.owner===F) this.tutGo(7); else if(!this.menu) this.tutGo(this.sel===U.T1?5:4); }
  else if(k==='wait2'){ if(U.T2.owner===F) this.tutGo(8); else if(U.t>3&&!marching(U.T2)&&!U.T2.btl){ U.T2.count=Math.min(U.T2.count,80); U.T1.count=Math.max(U.T1.count,600); this.sel=null; this.tutGo(4); } } };
BigWar.prototype.drawTut=function(c,vw,vh,tm){ const U=this.tut; if(!U||U.done) return; const S=BW.TUT[U.step], f=this.tutFocus(), t=performance.now()/1000, pulse=0.5+0.5*Math.sin(t*5), wait=S.k==='wait'||S.k==='wait2';
  c.save(); c.setTransform(c.getTransform().a,0,0,c.getTransform().d,0,0);
  if(!wait){ c.fillStyle='rgba(8,6,20,0.62)'; c.beginPath(); c.rect(0,0,vw,vh);
    if(f&&f.rect){ const r=f.rect; c.rect(r.x-4,r.y-3,r.w+8,r.h+6); } else if(f){ c.moveTo(f.x+f.r,f.y); c.arc(f.x,f.y,f.r,0,Math.PI*2,true); }
    c.fill('evenodd'); }
  if(f){ c.strokeStyle= U.nag>0? '#ff6b5b' : '#ffd54a'; c.lineWidth=4+3*pulse+U.nag*4; c.globalAlpha=0.65+0.35*pulse; if(f.rect){ const r=f.rect; rr(c,r.x-6,r.y-5,r.w+12,r.h+10,12); c.stroke(); } else { c.beginPath(); c.arc(f.x,f.y,f.r+4+6*pulse,0,7); c.stroke(); } c.globalAlpha=1;
    const hx= f.rect? f.rect.x+f.rect.w-26 : f.x+f.r*0.35, hy=(f.rect? f.rect.y+f.rect.h*0.5 : f.y+f.r*0.45)+10+8*pulse; c.font='34px system-ui'; c.textAlign='center'; c.fillText('👆',hx,hy+26); }
  // khung ghi chú — KHÔNG được che chỗ cần chạm (và cả menu lệnh): thử đặt dưới → trên → bên trái → bên phải vùng cần tránh
  const FONT2='"Baloo 2",system-ui,sans-serif', fs= vw<420? 14 : 15.5, lh=fs*1.32, info=S.k==='info';
  const wrap=(pw)=>{ c.font=`700 ${fs}px ${FONT2}`; const L=[]; for(const para of S.text.split('\n')){ let cur=''; for(const w of para.split(' ')){ const tt=cur? cur+' '+w : w; if(c.measureText(tt).width>pw-28&&cur){ L.push(cur); cur=w; } else cur=tt; } L.push(cur); } return L; };
  let av=null; if(f&&f.rect){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const r of this._menuRects||[]){ x0=Math.min(x0,r.x); y0=Math.min(y0,r.y); x1=Math.max(x1,r.x+r.w); y1=Math.max(y1,r.y+r.h); } av={x0:x0-14,y0:y0-14,x1:x1+14,y1:y1+14}; } else if(f) av={x0:f.x-f.r-12,y0:f.y-f.r-12,x1:f.x+f.r+12,y1:f.y+f.r+60};
  const TOP=58, BOT=vh-8; let pw=Math.min(vw-20,540), lines=wrap(pw), ph=lines.length*lh+34+(info?50:0), px=(vw-pw)/2, top;
  if(info||!av) top= info? (vh-ph)/2 : TOP;
  else if(BOT-av.y1>=ph) top=Math.min(BOT-ph,av.y1+6);
  else if(av.y0-TOP>=ph) top=Math.max(TOP,av.y0-ph-6);
  else { const lw=av.x0-16, rw=vw-av.x1-16, side= lw>=rw? 'L':'R', w2=Math.max(lw,rw); pw=Math.max(200,Math.min(540,w2)); lines=wrap(pw); ph=lines.length*lh+34; px= side==='L'? Math.max(8,av.x0-8-pw) : Math.min(vw-pw-8,av.x1+8); top=Math.max(TOP,Math.min(BOT-ph,(av.y0+av.y1)/2-ph/2)); }
  c.fillStyle='rgba(28,18,48,0.96)'; c.strokeStyle='#ffd54a'; c.lineWidth=3; rr(c,px,top,pw,ph,14); c.fill(); c.stroke();
  c.textAlign='left'; c.fillStyle='#ffd54a'; c.font=`900 12px ${FONT2}`; c.fillText(`🎓 TUTORIAL · ${U.step+1}/${BW.TUT.length}`,px+14,top+19);
  c.font=`700 ${fs}px ${FONT2}`; lines.forEach((q,i)=>{ c.fillStyle= q.startsWith('👆')? '#7dffcf' : '#fff'; c.fillText(q,px+14,top+24+lh*(i+1)); });
  if(info){ const bw2=170, bx=px+pw/2-bw2/2, by=top+ph-48; c.fillStyle='#4ade80'; rr(c,bx,by,bw2,38,12); c.fill(); c.fillStyle='#0b2a14'; c.font=`900 18px ${FONT2}`; c.textAlign='center'; c.fillText('Got it ▶',bx+bw2/2,by+26); U.okR={x:bx,y:by,w:bw2,h:38}; } else U.okR=null;
  const sw=74, sx=px+pw-sw-8, sy=top+5; c.fillStyle='rgba(255,255,255,0.14)'; rr(c,sx,sy,sw,22,8); c.fill(); c.fillStyle='#d8d0ea'; c.font=`800 12px ${FONT2}`; c.textAlign='center'; c.fillText('Skip ▸',sx+sw/2,sy+16); U.skipR={x:sx-6,y:sy-8,w:sw+12,h:38};
  c.restore(); };
