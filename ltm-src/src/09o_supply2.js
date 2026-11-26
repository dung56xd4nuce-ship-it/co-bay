// ============ 🎒 QUÂN NHU MỚI + Ô TÚI MUA BẰNG XU (6.1) ============
// 5 món mới (mua bằng xu ở Kho → Supplies), và túi mở rộng từ 3 lên 4 rồi 5 ô.
//  📯 War Horn     — một đạo quân: trận kế tiếp trong 45s đánh mạnh hơn 30%
//  🧱 Sandbags     — một cứ điểm: thủ vững hơn 50% trong 60s
//  🥁 War Drums    — một cứ điểm: sinh quân gấp đôi trong 60s
//  🚩 Rally Banner — một cứ điểm: thêm ngay 20% quân (ít nhất 30)
//  📌 Caltrops     — quanh giữa màn hình: quân địch đi chậm một nửa trong 30s
// Ảnh vật phẩm: vẽ bằng mã (huy hiệu tròn + biểu tượng) cho tới khi có ảnh ChatGPT vẽ.
const BW_GEAR2=[
  {id:'horn',    name:'War Horn',     emoji:'📯', cost:45, need:'army', desc:'One army fights 30% harder in battles it starts or joins during the next 45s.'},
  {id:'sandbag', name:'Sandbags',     emoji:'🧱', cost:40, need:'node', desc:'One stronghold defends 50% harder for 60s.'},
  {id:'drum',    name:'War Drums',    emoji:'🥁', cost:50, need:'node', desc:'One stronghold, farm or camp raises troops twice as fast for 60s.'},
  {id:'banner',  name:'Rally Banner', emoji:'🚩', cost:55, need:'node', desc:'One stronghold gets +20% troops right now (at least 30).'},
  {id:'caltrops',name:'Caltrops',     emoji:'📌', cost:40, need:'none', desc:'Enemy armies around the middle of the screen march at half speed for 30s.'},
];
for(const g of BW_GEAR2){ BW_GEAR.push(g); BW_GEAR_BY[g.id]=g; }
Object.assign(BW_GEAR_SHORT,{horn:'next battle ×1.3 · 45s',sandbag:'defend ×1.5 · 60s',drum:'troops ×2 · 60s',banner:'+20% troops now',caltrops:'enemies slowed · 30s'});
BW.gearSlotsFor=(bought)=>Math.min(BW.gear.maxSlots,BW.gear.slots+(bought|0));

BigWar.prototype.hornMul=function(S,e,x,y){ const G=BW.gear, es= e? [e] : S.es; let hit=0;
  for(const q of es){ if(q.kind!=='army'||!(q.ref.hornT>0)||q.ref._hornB===q.ref.btl) continue; q.ref._hornB=q.ref.btl;
    const tot=this.bSideSum(S), sh= tot>0? Math.max(0,q.ref.count)/tot : 1; S.mul*=1+(G.hornMul-1)*sh; hit++; }
  if(hit) this.texts.push({x,y:y-126,s:'📯 War horn — charge! ×'+G.hornMul,col:'#ffe08a',t:0,max:2,big:1}); };
BigWar.prototype.calMul=function(a){ const F=this.localFid; if(a.owner===F||!this.isFoe(a.owner,F)) return 1;
  for(const z of this.calZ) if(Math.hypot(a.x-z.x,a.y-z.y)<z.r) return BW.gear.calMul; return 1; };
BigWar.prototype.gearUse2=function(g,t,say,cx,cy){ const G=BW.gear;
  switch(g.id){
    case 'horn': t.hornT=G.hornT; t._hornB=null; say('📯 War horn ready · next battle ×1.3',t.x,t.y-84); return {ok:true};
    case 'sandbag': t.bagT=G.bagT; say('🧱 Sandbags up · defend ×1.5 · 60s',t.x,t.y-100); return {ok:true};
    case 'drum': if(t.owner===2) return {ok:false,why:'target'}; t.drumT=G.drumT; say('🥁 War drums · troops ×2 · 60s',t.x,t.y-100); return {ok:true};
    case 'banner': { const add=Math.max(G.bannerMin,Math.round((t.count||0)*G.bannerK)); t.count=(t.count||0)+add; say(`🚩 +${typeof bwN==='function'? bwN(add) : add} troops rally to the banner`,t.x,t.y-100); return {ok:true}; }
    case 'caltrops': { const F=this.localFid; let n=0; for(const a of this.armies){ if(!a.done&&a.count>0&&a.owner!==F&&this.isFoe(a.owner,F)&&Math.hypot(a.x-cx,a.y-cy)<G.calR) n++; }
      (this.calZ=this.calZ||[]).push({x:cx,y:cy,r:G.calR,t:G.calT}); say(`📌 Caltrops scattered · ${n} enemy armies slowed · 30s`,cx,cy); return {ok:true}; }
  }
  return {ok:false,why:'none'}; };
// vùng chông sắt: vòng nét đứt trên bản đồ
BigWar.prototype.drawCalZ=function(c,tm){ const Z=this.calZ; if(!Z||!Z.length) return; const k=1/(this.scale||1);
  c.save(); c.setLineDash([22*k,16*k]); c.lineWidth=4*k; c.strokeStyle='rgba(255,213,74,0.55)';
  for(const z of Z){ c.beginPath(); c.arc(z.x,z.y,z.r,0,7); c.stroke(); c.font=`900 ${Math.round(18*k)}px system-ui`; c.textAlign='center'; c.fillStyle='rgba(255,233,201,0.85)'; c.fillText('📌 '+Math.ceil(z.t)+'s',z.x,z.y+70*k); }
  c.restore(); };

// ảnh vật phẩm vẽ bằng mã (không đè ảnh đã có)
function gearArt2(){ if(typeof setArtImage!=='function'||typeof document==='undefined') return;
  const col={horn:['#7c4a1e','#e9b872'],sandbag:['#6b5a3a','#d9c08a'],drum:['#7a1f1f','#e8a25a'],banner:['#24406e','#f0c84a'],caltrops:['#3c3c46','#c9ccd6']};
  for(const g of BW_GEAR2){ const key='item:'+g.id; if(ArtImages[key]) continue; const S=128, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'); if(!x) continue;
    const [a,b]=col[g.id]; const gr=x.createRadialGradient(S*0.4,S*0.35,8,S/2,S/2,S*0.5); gr.addColorStop(0,b); gr.addColorStop(1,a);
    x.fillStyle=gr; x.beginPath(); x.arc(S/2,S/2,S*0.46,0,7); x.fill(); x.lineWidth=6; x.strokeStyle='#2a1a12'; x.stroke();
    x.font=`${Math.round(S*0.56)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui`; x.textAlign='center'; x.textBaseline='middle'; x.fillText(g.emoji,S/2,S*0.54);
    try{ setArtImage(key,cv.toDataURL('image/png')); }catch(e){} } }
try{ gearArt2(); }catch(e){}
