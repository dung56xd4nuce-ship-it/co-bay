// ============ 🎒 QUÂN NHU · ⚒️ LÒ RÈN · 🪙 XU THEO MỐC (5.2) ============
// Xu kiếm được sau mỗi trận nay có chỗ tiêu, và 18 ảnh bỏ không của bộ art được dùng lại:
//  • QUÂN NHU — 7 món mua bằng xu (đúng 7 ảnh vật phẩm). Mang tối đa 3 món vào trận; trong trận bấm nút 🎒 rồi chọn món,
//    món có tác dụng lên đạo quân / cứ điểm ĐANG CHỌN. Mỗi lần dùng tốn 1 món trong kho và phải chờ hồi mới dùng lại.
//  • LÒ RÈN — nâng cấp vĩnh viễn, nhỏ, cho nước mình ở Đánh Boss và Quần Hùng (ảnh vũ khí + ảnh nâng cấp).
//  • Quần Hùng thưởng xu theo mốc (hạ đại bản doanh, trụ thêm 10 phút) — không phải đợi hết ván.
// Không áp dụng trong P2P: hai người chơi phải ngang nhau.
const BW_GEAR=[
  {id:'bun',      name:'Steamed Buns',  emoji:'🥟', cost:30, need:'army', desc:'Refill one army\'s supply to 100%.'},
  {id:'tea',      name:'Ginger Tea',    emoji:'🍵', cost:40, need:'army', desc:'One army marches 50% faster for 30s.'},
  {id:'plank',    name:'Bridge Planks', emoji:'🪵', cost:35, need:'army', desc:'One army can cross the river anywhere for 60s — slip past a guarded ford.'},
  {id:'smoke',    name:'Smoke Pouch',   emoji:'💨', cost:50, need:'army', desc:'Hide one army from the enemy for 30s — its next battle hits 1.5× harder.'},
  {id:'scarecrow',name:'Scarecrows',    emoji:'👒', cost:40, need:'node', desc:'One stronghold looks 3× stronger to the enemy for 60s.'},
  {id:'compass',  name:'Compass',       emoji:'🧭', cost:35, need:'none', desc:'Reveal enemy numbers around the middle of the screen for 30s.'},
  {id:'bandage',  name:'Patch Kit',     emoji:'🩹', cost:45, need:'unit', desc:'Bring back 30% of the troops you lost nearby in the last 60s.'},
];
const BW_GEAR_BY={}; for(const g of BW_GEAR) BW_GEAR_BY[g.id]=g;
BW.gear={slots:3, cdSolo:150, cdRoyale:240, teaT:30, teaMul:1.5, plankT:60, smokeT:30, smokeMul:1.5, scareT:60, scareMul:3, compassR:1600, compassT:30, bandFrac:0.3, bandWindow:60, bandR:520};
// LÒ RÈN: mỗi bậc cộng bao nhiêu (5 bậc mỗi hạng mục). Tổng sát thương tối đa = (1+7,5%)×(1+7,5%) ≈ +15,6%.
BW.forge={speed:0.02, power:0.015, armor:0.03, stamina:0.05, aura:0.03, weapon:0.015};
BW.coinsFor={camp:15, capital:20, nation:40, every:600, survive:15};

// hệ số Lò rèn của một phe (chỉ người chơi, và chỉ khi trận có mang theo nâng cấp — P2P thì không)
BigWar.prototype.upMul=function(kind,owner){ const u=this.up; if(!u||owner!==this.localFid) return 1;
  if(kind==='atk') return (1+BW.forge.power*(u.power||0))*(1+BW.forge.weapon*(u.weapon||0));
  return 1+(BW.forge[kind]||0)*(u[kind]||0); };

// ---------- quân nhu ----------
BigWar.prototype.gearSetup=function(pack,api){ this.gear=[]; this.gearApi=api||null; this.gearOpen=false; if(this.cfg&&this.cfg.p2p) return;
  for(const id of (pack||[])){ if(BW_GEAR_BY[id]&&this.gear.length<BW.gear.slots&&!this.gear.some(g=>g.id===id)) this.gear.push({id,cd:0}); } };
BigWar.prototype.gearStock=function(id){ return this.gearApi&&this.gearApi.stock? (this.gearApi.stock(id)||0) : 0; };
// đối tượng sẽ nhận món này, theo lựa chọn hiện tại của người chơi (true = món không cần đối tượng)
BigWar.prototype.gearPick=function(g){ const F=this.localFid, need=BW_GEAR_BY[g.id].need; if(need==='none') return true;
  let a= this.selA&&!this.selA.done&&this.selA.count>0&&this.selA.owner===F? this.selA : null;
  if(!a&&this.selG&&this.selG.length) a=this.selG.filter(x=>!x.done&&x.count>0&&x.owner===F).sort((p,q)=>q.count-p.count)[0]||null;
  const n= this.sel&&this.sel.owner===F? this.sel : null;
  return need==='army'? a : need==='node'? n : (a||n); };
BigWar.prototype.gearHeal=function(t){ const G=BW.gear, L=this.lossLog||[]; let sum=0;
  for(const e of L){ if(e.used||this.time-e.t>G.bandWindow) continue; if(hyp(e.x-t.x,e.y-t.y)<=G.bandR){ sum+=e.n; e.used=1; } }
  for(const b of this.battles){ if(b.done||!(b.lostP>0)) continue; if(hyp(b.x-t.x,b.y-t.y)<=G.bandR){ sum+=b.lostP; b.lostP=0; } }
  const back=Math.round(sum*G.bandFrac); if(back>0) t.count+=back; return back; };
BigWar.prototype.gearUse=function(i){ const g=this.gear&&this.gear[i]; if(!g||this.over) return {ok:false,why:'none'};
  const D=BW_GEAR_BY[g.id], F=this.localFid, G=BW.gear, sc=this.scale||1, cx=this.camX+(this.lastVw||0)/sc/2, cy=(this.camY||0)+(this.lastVh||0)/sc/2;
  const say=(s,x,y)=>this.texts.push({x,y,s,col:'#ffe08a',t:0,max:2,big:1});
  if(g.cd>0) return {ok:false,why:'cd'};
  if(this.gearStock(g.id)<=0){ this.note(`🎒 Out of ${D.name} — buy more with coins from the main menu`,cx,cy,'🎒'); return {ok:false,why:'stock'}; }
  const t=this.gearPick(g);
  if(!t){ this.note(D.need==='node'? `${D.emoji} ${D.name}: tap one of your strongholds first` : D.need==='army'? `${D.emoji} ${D.name}: tap one of your armies in the field first` : `${D.emoji} ${D.name}: tap one of your armies or strongholds first`,cx,cy,D.emoji); this.gearOpen=false; return {ok:false,why:'target'}; }
  switch(g.id){
    case 'bun': if((t.food??100)>=99){ this.note('🥟 That army is already fully supplied',t.x,t.y,'🥟'); this.gearOpen=false; return {ok:false,why:'full'}; }
      t.food=BW.food.max; t._hungryN=0; say('🥟 Supply refilled!',t.x,t.y-84); break;
    case 'tea': t.teaT=G.teaT; say('🍵 Forced march +50% · 30s',t.x,t.y-84); break;
    case 'plank': t.plankT=G.plankT; t._pk=null; say('🪵 Crossing the river anywhere · 60s',t.x,t.y-84); break;
    case 'smoke': t.smokeT=G.smokeT; say('💨 Hidden from the enemy · 30s',t.x,t.y-84); break;
    case 'scarecrow': t.scareT=G.scareT; say('👒 Looks 3× stronger · 60s',t.x,t.y-100); break;
    case 'compass': { let n=0; for(const m of this.nodes){ if(m.owner===F) continue; if(hyp(m.x-cx,m.y-cy)<G.compassR){ m.scoutT=this.time; m.known={count:m.count,type:m.type,t:this.time}; n++; } }
        (this.tempVis=this.tempVis||[]).push({x:cx,y:cy,r:G.compassR,t:G.compassT}); this._visT=0; say(`🧭 ${n} strongholds revealed · 30s`,cx,cy); break; }
    case 'bandage': { const back=this.gearHeal(t); if(back<1){ this.note('🩹 No troops were lost near there in the last 60s',t.x,t.y,'🩹'); this.gearOpen=false; return {ok:false,why:'nothing'}; }
        say(`🩹 +${back} troops back on their feet`,t.x,t.y-84); this.addFx(t.x+52,t.y-18,'unit:medic',104,2.2); break; }
    default: return {ok:false,why:'none'}; }
  g.cd= this.royale? G.cdRoyale : G.cdSolo; if(this.gearApi&&this.gearApi.spend) this.gearApi.spend(g.id); this.gearOpen=false; this._gearLive=true;   /* có hiệu lực đang chạy: gearTick phải đếm giờ */
  if(typeof audio!=='undefined'&&audio.pickup) audio.pickup();
  return {ok:true,id:g.id}; };
// mỗi nhịp: đồng hồ hồi của từng món + thời hạn hiệu lực trên đạo quân / cứ điểm / vùng la bàn
BigWar.prototype.gearTick=function(dt){ const GR=this.gear; if(GR) for(let i=0;i<GR.length;i++){ if(GR[i].cd>0) GR[i].cd=Math.max(0,GR[i].cd-dt); }
  if(this._gearLive||this.tempVis&&this.tempVis.length){ let live=false; const A=this.armies, N=this.nodes;
    for(let i=0;i<A.length;i++){ const a=A[i]; if(a.teaT>0){ a.teaT-=dt; live=true; } if(a.smokeT>0){ a.smokeT-=dt; live=true; }
      if(a.plankT>0){ a.plankT-=dt; live=true; if(!(a.plankT>0)){ a.plankT=0; a._pk=null; if(a.owner===this.localFid) this.texts.push({x:a.x,y:a.y-70,s:'🪵 Planks spent',col:'#ffd9a8',t:0,max:1.4}); } } }
    for(let i=0;i<N.length;i++){ if(N[i].scareT>0){ N[i].scareT-=dt; live=true; } }
    const TV=this.tempVis; if(TV&&TV.length){ for(const v of TV) v.t-=dt; if(TV.some(v=>!(v.t>0))){ this.tempVis=TV.filter(v=>v.t>0); this._visT=0; } live=live||this.tempVis.length>0; }
    this._gearLive=live; } };
// vẽ huy hiệu hiệu lực bên cạnh đạo quân / cứ điểm (ảnh vật phẩm + số giây còn lại)
BigWar.prototype.drawGearMarks=function(c,u,tm,isNode){ const marks=[]; if(u.teaT>0) marks.push(['tea','🍵',u.teaT]); if(u.plankT>0) marks.push(['plank','🪵',u.plankT]); if(u.smokeT>0) marks.push(['smoke','💨',u.smokeT]); if(u.scareT>0) marks.push(['scarecrow','👒',u.scareT]);
  const n=marks.length; if(!n) return; const k=Math.max(1,0.62/(this.scale||1)), s=30*k, kk=Math.min(k,1.6);
  // đạo quân: xếp hàng ngang PHÍA TRÊN bảng quân số (không che số quân, không che vạch lương); cứ điểm: một huy hiệu bên phải (trại lớn thì nằm cạnh lều, dưới dòng tên)
  for(let i=0;i<n;i++){ const m=marks[i], im=ArtImages['item:'+m[0]]; let x, y;
    if(isNode){ x=u.x+(u.camp? 116 : 62)*kk; y=u.y+(u.camp? 4 : -70)+i*(s*1.24+16*k); }
    else { x=u.x+(i-(n-1)/2)*s*1.34; y=u.y-82-12*k-s*0.62; }
    c.fillStyle='rgba(25,15,45,0.82)'; c.beginPath(); c.arc(x,y,s*0.62,0,7); c.fill(); c.strokeStyle='#ffd54a'; c.lineWidth=2*k; c.stroke();
    if(im) c.drawImage(im,x-s*0.5,y-s*0.5,s,s); else { c.font=`${Math.round(s*0.72)}px system-ui`; c.textAlign='center'; c.fillStyle='#fff'; c.fillText(m[1],x,y+s*0.26); }
    c.font=`900 ${Math.round(13*k)}px "Baloo 2",system-ui`; c.textAlign='center'; c.lineWidth=3.5*k; c.strokeStyle='#2a1a12'; c.fillStyle='#ffe9c9'; const t=Math.ceil(m[2])+'s'; c.strokeText(t,x,y+s*0.62+12*k); c.fillText(t,x,y+s*0.62+12*k); } };

// ---------- xu theo mốc (Quần Hùng) ----------
BigWar.prototype.coin=function(n,why,x,y){ if(!this.royale||(this.cfg&&this.cfg.p2p)||!(n>0)) return; this.stats.coins=(this.stats.coins||0)+n;
  if(this.onCoin) this.onCoin(n,why); this.note(`🪙 +${n} coins — ${why}`,x,y,'🪙'); };

// ---------- HUD: nút 🎒 cạnh nút 📣 + bảng chọn món ----------
const BW_GEAR_SHORT={bun:'refill supply',tea:'march +50% · 30s',plank:'ford anywhere · 60s',smoke:'hidden 30s · strike ×1.5',scarecrow:'looks ×3 · 60s',compass:'reveal area · 30s',bandage:'recover 30% of losses'};
BigWar.prototype.gearHudOn=function(){ return !!(this.gear&&!(this.cfg&&this.cfg.p2p)&&!this.over&&!this.rallyOpen&&!this.rallyPick&&!this._retreatBtn); };
BigWar.prototype.drawGearHud=function(c,L,tm){ this._gearBtn=null; this._gearMenu=null; this._gearRects=[]; if(!this.gearHudOn()){ this.gearOpen=false; return; }
  const FONT='"Baloo 2",system-ui', R=L.rally, bx=R.x+R.w+8, by=R.y, bs=R.w; this._gearBtn={x:bx,y:by,w:bs,h:bs};
  const GR=this.gear, ready=GR.some(g=>g.cd<=0&&this.gearStock(g.id)>0);
  c.globalAlpha=this.gearOpen?1:0.85; c.fillStyle=this.gearOpen?'rgba(255,213,74,0.95)':'rgba(30,24,54,0.85)'; c.strokeStyle= ready? 'rgba(125,255,207,0.9)' : 'rgba(255,255,255,0.3)'; c.lineWidth=2; rr(c,bx,by,bs,bs,24); c.fill(); c.stroke();
  c.textAlign='center'; c.font='24px system-ui'; c.fillStyle='#fff'; c.fillText('🎒',bx+bs/2,by+33); c.globalAlpha=1;
  if(!this.gearOpen) return;
  // các dòng của bảng: [chỉ số món | -1 = đóng | -2 = dòng nhắc, tên, dòng phụ, chữ bên phải, dùng được?]
  const rows=[]; for(let i=0;i<GR.length;i++){ const g=GR[i], D=BW_GEAR_BY[g.id], st=this.gearStock(g.id); rows.push([i,D.name,BW_GEAR_SHORT[g.id]||'', g.cd>0? '⏳ '+Math.ceil(g.cd)+'s' : '×'+st, g.cd<=0&&st>0, g.id]); }
  if(!rows.length) rows.push([-2,'No supplies packed','get them in the Armory (main menu)','',false,null]);
  rows.push([-1,'✖ Close','','',true,null]);
  const side=L.X1-8-(bx+bs+8), above=side<210, mwMax= above? L.X1-L.X0-20 : side; let fs=15, tw=0;
  for(;fs>=12;fs--){ tw=0; for(const r of rows){ c.font=`800 ${fs}px ${FONT}`; let w=c.measureText(r[1]).width+(r[3]? c.measureText(r[3]).width+16 : 0); c.font=`700 11px ${FONT}`; w=Math.max(w,c.measureText(r[2]).width); tw=Math.max(tw,w); } if(tw+62<=mwMax) break; } fs=Math.max(12,fs);
  const mw=Math.max(180,Math.min(mwMax,Math.ceil(tw)+62)), ihBig=46, ihSm=36, yTop=(L.bar&&!above&&bx+bs+8<L.bar.x+L.bar.w+6)? L.bar.y+L.bar.h+6 : L.Y0+8;
  let mh=10; for(const r of rows) mh+= r[0]===-1? ihSm : ihBig;
  const mx= above? L.X0+10 : bx+bs+8, my2= above? Math.max(yTop,by-8-mh) : Math.max(yTop,Math.min(L.Y1-mh-8,by+bs-mh));
  this._gearMenu={x:mx,y:my2,w:mw,h:mh};
  c.fillStyle='rgba(25,15,45,0.96)'; rr(c,mx,my2,mw,mh,12); c.fill(); c.strokeStyle='#ffd54a'; c.lineWidth=2; rr(c,mx,my2,mw,mh,12); c.stroke();
  let oy=my2+5; rows.forEach((r,k)=>{ const ih= r[0]===-1? ihSm : ihBig, rx=mx+5, rw=mw-10, rh=ih-5;
    c.fillStyle= k%2? 'rgba(255,255,255,0.04)':'rgba(255,255,255,0.09)'; rr(c,rx,oy,rw,rh,9); c.fill();
    if(r[0]===-1){ c.textAlign='left'; c.font=`800 ${fs}px ${FONT}`; c.fillStyle='#f6b1a4'; c.fillText(r[1],rx+10,oy+rh/2+fs*0.36); }
    else { const im= r[5]? ArtImages['item:'+r[5]] : null, on=r[4]; c.globalAlpha= on||r[0]===-2? 1 : 0.5;
      if(im) c.drawImage(im,rx+6,oy+(rh-32)/2,32,32); else if(r[5]){ c.font='24px system-ui'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText(BW_GEAR_BY[r[5]].emoji,rx+22,oy+rh/2+9); }
      const tx= r[5]? rx+44 : rx+10; c.textAlign='left'; c.font=`800 ${fs}px ${FONT}`; c.fillStyle='#ffe9c9'; c.fillText(r[1],tx,oy+rh/2-2);
      c.font=`700 11px ${FONT}`; c.fillStyle='#bfe9d8'; c.fillText(r[2],tx,oy+rh/2+13);
      if(r[3]){ c.textAlign='right'; c.font=`800 ${fs}px ${FONT}`; c.fillStyle= r[3][0]==='×'? '#7dffcf' : '#ffd54a'; c.fillText(r[3],rx+rw-8,oy+rh/2-2); }
      c.globalAlpha=1; }
    this._gearRects.push({x:rx,y:oy,w:rw,h:rh,i:r[0]}); oy+=ih; });
  c.textAlign='center'; };
BigWar.prototype.gearTap=function(sx,sy){ const hit=(r)=>r&&sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h, click=()=>{ if(typeof audio!=='undefined'&&audio.click) audio.click(); };
  if(this.gearOpen){ for(const r of this._gearRects||[]){ if(!hit(r)) continue; if(r.i>=0) this.gearUse(r.i); else if(r.i===-1) this.gearOpen=false; click(); return true; }
    this.gearOpen=false; return true; }                                            /* chạm ra ngoài bảng: đóng bảng, giữ nguyên lựa chọn */
  if(hit(this._gearBtn)){ this.gearOpen=true; this.menu=null; click(); return true; }
  return false; };
