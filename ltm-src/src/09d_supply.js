// ============ 🌾 LƯƠNG THẢO & HẬU CẦN (v5.0) ============
// Trước đây mọi đạo quân mang cùng 100 lương nhưng ăn theo quân số → đạo 10 000 quân đi chưa đầy 20 giây là đói, tan rã giữa đường.
// Nay:  • bao lương tính theo THỜI GIAN hành quân (đủ ~150 giây, đại quân kém hơn chút) chứ không teo theo quân số;
//       • ĐẠI QUÂN phải CHUẨN BỊ LƯƠNG trước khi rời cứ điểm (càng đông, đi càng xa thì chuẩn bị càng lâu; kho đầy lương thì nhanh gấp đôi);
//       • ĐẠI QUÂN ĐI CHẬM hơn (tốc độ giảm dần theo quân số);
//       • ĐỘI VẬN LƯƠNG 🐂 tự xuất phát từ cứ điểm có lương gần nhất khi một đạo quân ở ngoài đồng sắp hết lương; quân địch áp sát là cướp được xe lương.
Object.assign(BW.food,{
  packT:150, packBig:0.25,                       // bao đầy nuôi quân 150 giây hành quân; mỗi bậc ×10 quân số giảm 20%
  low:45,                                        // dưới 45% thì gọi đội vận lương
  prepMin:800, prepK:3, prepPow:0.65, prepSub:1.5, prepMax:30, prepOff:58,   // dưới 800 quân xuất phát ngay; 2 000 → 1,5s; 10 000 → 7s; 50 000 → 23s
  cvRange:6000, cvPerNation:5, cvCooldown:12, cvRaidR:95, cvCostK:40, cvMinStock:15,
});
BW.typeSpeed.supply=1.15;                         // xe lương nhanh hơn bộ binh một chút để đuổi kịp đạo quân
// hệ số tốc độ theo quân số: ≤1 000 quân = 1 · 2 000 = 0,88 · 5 000 = 0,77 · 10 000 = 0,70 · 30 000 = 0,61 · 100 000 = 0,54
BW.sizeSpd=(count)=>1/(1+0.13*Math.log2(Math.max(1,(count||0)/1000)));

// bao lương đầy nuôi đạo quân này được bao nhiêu giây hành quân (đóng trại thì gấp đôi)
BigWar.prototype.packT=function(a){ return BW.food.packT/(1+BW.food.packBig*Math.log10(Math.max(1,(a.count||0)/1000)))*(this.up? this.upMul('stamina',a.owner) : 1); };   /* ×Lò rèn (Logistics) cho người chơi */
// lương hao mỗi nhịp kinh tế (BW.ecoEvery giây)
BigWar.prototype.foodDrain=function(a){ if(a.prep>0) return 0; let d=100*BW.ecoEvery/this.packT(a); if(a.camped) d*=0.5;
  const ci=this.capInfo&&this.capInfo[a.owner]; if(ci&&ci.tot>ci.cap) d*=2; const cv=this.civOf(a.owner); if(cv&&cv.sup) d*=cv.sup; return d; };
// số lương kho phải xuất để nạp pct% bao cho một đạo count quân (đạo càng đông càng tốn kho)
BigWar.prototype.supplyCost=function(count,pct){ return BW.food.cvCostK*Math.sqrt(Math.max(0.2,(count||0)/1000))*(pct/100); };
// thời gian CHUẨN BỊ LƯƠNG trước khi rời cứ điểm (giây): theo quân số, quãng đường (eta giây), và kho tại chỗ có sẵn lương hay không
//  • tỉ lệ với quãng đường: đi ≥45 giây mới phải chuẩn bị đủ; đánh sang ngay bên cạnh (vài giây đường) thì gần như xuất phát ngay
//  • dưới 0,8 giây coi như không chờ
BigWar.prototype.prepTime=function(count,eta,stockOk){ const F=BW.food; if(count<F.prepMin) return 0;
  const distF=Math.max(0,Math.min(1,((eta==null?45:eta)-4)/41)); let t=Math.max(0,F.prepK*Math.pow(count/2000,F.prepPow)-F.prepSub)*distF; if(stockOk) t*=0.5; t=Math.min(F.prepMax,t); return t<0.8? 0 : t; };
// CHỈ quân rời TRẠI / THÀNH / KHO (nơi có kho lương) mới phải chuẩn bị. Quân đồn ngoài đồng (cứ điểm đất trống, không công trình) và mọi đạo quân
// đang ở dã ngoại đã mang sẵn lương theo người: nhận lệnh là đi ngay.
BigWar.prototype.hasDepot=function(n){ return !!(n&&(n.camp||n.struct||n.eco)); };
// dự báo cho người chơi trước khi ra lệnh: {prep, eta, endure, pct}
BigWar.prototype.supplyForecast=function(src,tx,ty,fromNode){ const eta=this.pathEta(src,tx,ty), cnt=src.count||0, depot=fromNode&&this.hasDepot(src);
  const stock= depot&&(src.food||0)>=this.supplyCost(cnt,50), prep= depot? this.prepTime(cnt,eta,stock) : 0;
  const endure=(fromNode? 100 : (src.food??100))/100*this.packT(src); return {prep,eta,endure,pct:Math.max(0,Math.min(100,Math.round(endure/Math.max(1,eta)*100))),stock:!!stock}; };

// gọi trong send(): gắn thời gian chuẩn bị cho đạo quân vừa rời cứ điểm
BigWar.prototype.supplyPrep=function(a,from,tx,ty){ const F=BW.food; if(a.count<F.prepMin||!this.hasDepot(from)) return 0;
  // quãng đường: quân của người chơi tính theo lộ trình thật (khớp con số menu vừa báo); quân máy ước lượng nhanh theo đường chim bay
  const sp=BW.speed*(BW.typeSpeed[a.type]||1)*BW.sizeSpd(a.count), eta= a.owner===this.localFid? this.pathEta(a,tx,ty) : hyp(tx-a.x,ty-a.y)*1.3/sp;
  const cost=this.supplyCost(a.count,50), stock=(from.food||0)>=cost;
  const p=this.prepTime(a.count,eta,stock); if(p>0&&stock) from.food-=cost; if(p>0.05){ a.prep=a.prep0=p; a.y=from.y+F.prepOff;   // đứng trước cổng thành gom lương
    if(a.owner===this.localFid&&p>=1) this.texts.push({x:from.x,y:from.y-132,s:`🌾 Preparing supplies · ${Math.ceil(p)}s${stock?' (depot stocked: ×2 faster)':''}`,col:'#ffe08a',t:0,max:Math.min(2.6,p)}); }
  return p; };

// mỗi nhịp kinh tế: đạo quân sắp hết lương → cứ điểm phe mình gần nhất có lương cho một ĐỘI VẬN LƯƠNG lên đường
BigWar.prototype.supplyTick=function(){ const FD=BW.food, F=this.localFid, CV=this.convoys||(this.convoys=[]); const cnt={}; for(const c of CV) cnt[c.owner]=(cnt[c.owner]||0)+1;
  for(const a of this.armies){ if(a.done||a.count<=0||a.prep>0) continue; const f=a.food??100;
    if(f>=FD.low){ a._lowN=0; continue; }
    if(a._cv||(a._cvT||0)>this.time) continue;
    const per=this.supplyCost(a.count,100)/100; let best=null, bd=FD.cvRange;
    for(const n of this.nodes){ if(n.owner!==a.owner||n.sieged||n.btl||(n.food||0)<Math.max(FD.cvMinStock,per*25)) continue; const d=hyp(n.x-a.x,n.y-a.y); if(d<bd){ bd=d; best=n; } }
    const can=best&&(cnt[a.owner]||0)<FD.cvPerNation;
    if(can){ const pct=Math.min(100-f, best.food/per); best.food-=pct*per; CV.push({owner:a.owner,x:best.x,y:best.y+30,from:best.id,to:a,pct,cost:pct*per}); a._cv=1; cnt[a.owner]=(cnt[a.owner]||0)+1;
      if(a.owner===F){ this.stats.cv=(this.stats.cv||0)+1; this.texts.push({x:best.x,y:best.y-70,s:'🐂 Supply convoy sent',col:'#ffe08a',t:0,max:1.4}); } }
    if(a.owner===F&&!a._lowN){ a._lowN=1; this.note(can? '🌾 Army low on supplies — a 🐂 convoy is on its way' : '🌾 Army low on supplies, too far from your depots — pull back or capture a granary / ranch!',a.x,a.y,'🌾'); } } };

// mỗi khung hình: xe lương chạy theo đường tới đạo quân; tới nơi thì nạp lương; quân địch áp sát thì bị cướp
BigWar.prototype.convoyStep=function(dt){ const CV=this.convoys; if(!CV||!CV.length) return; const FD=BW.food, F=this.localFid; let gone=false;
  const deliver=(c,a)=>{ a.food=Math.min(FD.max,(a.food??0)+c.pct); c.done=true; a._cv=0; a._cvT=this.time+FD.cvCooldown; a._hungryN=0; a._lowN=0;
    if(c.owner===F) this.texts.push({x:a.x,y:a.y-70,s:'🌾 +'+Math.round(c.pct)+' supply delivered',col:'#ffe08a',t:0,max:1.5}); };
  for(const c of CV){ if(c.done){ gone=true; continue; } const a=c.to;
    if(!a||a.done||a.count<=0){ const n=this.nodes[c.from]; if(n&&n.owner===c.owner) n.food=(n.food||0)+c.cost*0.5; c.done=true; gone=true; continue; }   // đạo quân đã vào thành/tan: xe quay về, hoàn nửa số lương
    let raider=null; for(const e of this.armies){ if(e.done||e.count<=0||e===a||!this.isFoe(e.owner,c.owner)) continue; const dx=e.x-c.x, dy=e.y-c.y; if(dx*dx+dy*dy<FD.cvRaidR*FD.cvRaidR){ raider=e; break; } }
    if(raider){ raider.food=Math.min(FD.max,(raider.food??100)+Math.min(40,c.pct)); c.done=true; gone=true; a._cv=0; a._cvT=this.time+FD.cvCooldown;
      if(c.owner===F) this.note('🐂 Supply convoy captured by '+this.natName(raider.owner)+' — guard your supply road!',c.x,c.y,'🐂');
      else if(raider.owner===F) this.texts.push({x:c.x,y:c.y-60,s:'🐂 Enemy convoy captured! +supply',col:'#d9f99d',t:0,max:1.6,big:1});
      if(this.addFx) this.addFx(c.x,c.y,'fx:clash1',90,0.5); continue; }
    const d=hyp(a.x-c.x,a.y-c.y);
    if(d<=70){ deliver(c,a); gone=true; continue; }
    const pk=Math.round(a.x/120)*4096+Math.round(a.y/120);
    if(c._pk!==pk){ if(this._pfN>=8||this._pfMs>6) continue; this._pfN++; const tp0=performance.now(), P=this.findPath('F',c.x,c.y,a.x,a.y); this._pfMs+=performance.now()-tp0; c._pk=pk; c.path=P.pts; c.pi=0; c.pathOk=P.ok; }
    const last=!c.path||c.pi>=c.path.length-1; let mx=a.x, my=a.y;
    if(c.path&&c.path.length&&!(last&&c.pathOk)){ const wp=c.path[Math.min(c.pi,c.path.length-1)]; mx=wp[0]; my=wp[1]; }
    const dx=mx-c.x, dy=my-c.y, dd=hyp(dx,dy); if(dd>0.5){ c.hx=dx/dd; c.hy=dy/dd; }
    const st=this.mvSpeed({x:c.x,y:c.y,type:'supply',count:1,owner:c.owner},'F')*dt;
    if(dd<=st){ c.x=mx; c.y=my; if(!last) c.pi++; else if(!c.pathOk&&d<300){ deliver(c,a); gone=true; } }   // đích kẹt trong vùng xe không vào được: dân phu gánh nốt quãng cuối
    else { c.x+=dx/dd*st; c.y+=dy/dd*st; } }
  if(gone) this.convoys=CV.filter(c=>!c.done); };

// hình xe lương: xe gỗ chở bao gạo, bò kéo, cờ màu của nước mình
BigWar.prototype.drawConvoy=function(c,cv,tm){ const pal=BW.facPal(cv.owner), flip=(cv.hx||1)<0, bob=Math.sin(tm*10+cv.x*0.013)*1.6;
  const Z=1.6; c.save(); c.translate(cv.x,cv.y+bob); c.scale(flip? -Z : Z, Z);
  c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(2,13,34,9,0,0,7); c.fill();
  c.fillStyle='#8a5a34'; rr(c,12,-12,26,17,7); c.fill(); c.beginPath(); c.arc(41,-8,7.5,0,7); c.fill();                                  // bò kéo
  c.fillStyle='#5b3a1e'; c.fillRect(16,4,4,9); c.fillRect(30,4,4,9); c.strokeStyle='#f3e3c3'; c.lineWidth=2.2; c.beginPath(); c.moveTo(40,-15); c.lineTo(46,-21); c.stroke();
  c.strokeStyle='#5b3a1e'; c.lineWidth=2.5; c.beginPath(); c.moveTo(6,-3); c.lineTo(14,-5); c.stroke();                                   // càng xe
  c.fillStyle='#b07a3f'; rr(c,-32,-10,38,15,3); c.fill(); c.strokeStyle='#5b3a1e'; c.lineWidth=2; rr(c,-32,-10,38,15,3); c.stroke();      // thùng xe
  const sack=ArtImages['prop:station']; if(sack) c.drawImage(sack,-35,-40,44,34); else { c.fillStyle='#e8d8a8'; c.beginPath(); c.ellipse(-22,-15,9,7,0,0,7); c.ellipse(-7,-15,9,7,0,0,7); c.fill(); }
  c.fillStyle='#3d2a17'; c.beginPath(); c.arc(-23,8,7.5,0,7); c.arc(-3,8,7.5,0,7); c.fill(); c.fillStyle='#caa46a'; c.beginPath(); c.arc(-23,8,2.6,0,7); c.arc(-3,8,2.6,0,7); c.fill();
  c.restore();
  const fx=cv.x+(flip? 46 : -46);
  c.strokeStyle='#6b4a2f'; c.lineWidth=4; c.beginPath(); c.moveTo(fx,cv.y-10+bob); c.lineTo(fx,cv.y-78+bob); c.stroke();
  c.fillStyle=pal.color; c.beginPath(); c.moveTo(fx,cv.y-78+bob); c.lineTo(fx+28+Math.sin(tm*7)*3,cv.y-68+bob); c.lineTo(fx,cv.y-56+bob); c.closePath(); c.fill();
  if(cv.owner===this.localFid){ const fz=Math.max(24,10/(this.scale||1)); c.font=`900 ${fz}px "Baloo 2",system-ui`; c.textAlign='center'; c.lineWidth=fz*0.24; c.strokeStyle='rgba(42,26,18,0.92)'; const s='🌾 +'+Math.round(cv.pct);
    c.strokeText(s,cv.x+10,cv.y-84); c.fillStyle='#ffe9a8'; c.fillText(s,cv.x+10,cv.y-84); } };

// dòng dự báo trong MENU LỆNH: chỉ hiện khi có lệnh hành quân và có điều đáng nói (đại quân phải chuẩn bị lương, đường xa, lương không đủ)
BigWar.prototype.menuSupplyInfo=function(tgt,opts){ if(!opts.some(o=>o.id==='attack'||o.id==='siege'||o.id==='move'||o.id==='hunt'||o.id==='join')) return null;
  const fromNode=!!this.sel; let su=this.sel||this.selA; if(!fromNode&&this.selG&&this.selG.length>1) su=this.selG.filter(a=>!a.done&&a.count>0).sort((p,q)=>q.count-p.count)[0]||su;
  if(!su||!tgt) return null; const fc=this.supplyForecast(su,tgt.x,tgt.y,fromNode), warn=fc.pct<95, parts=[];
  if(fc.prep>=1) parts.push('🌾 prep '+Math.ceil(fc.prep)+'s'+(fc.stock?' (stocked)':''));
  if(fc.prep>=1||fc.eta>=25||warn) parts.push('🚶 march ~'+Math.round(fc.eta)+'s');
  if(warn) parts.push('⚠️ food for '+fc.pct+'% of the way — 🐂 convoys must reach you');
  return parts.length? {s:parts.join(' · '),warn} : null; };
