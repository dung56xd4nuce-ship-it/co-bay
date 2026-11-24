// 🧠 (5.3) BỘ NÃO CỦA MÁY — độ khó KHÔNG chỉ là quân đông: mỗi ải máy khôn thêm một bậc; Quần Hùng có 3 mức khó.
//   iq 0: ngây thơ (dốc sạch quân, không đụng hậu phương ta)      iq 1: biết phục kích, điều quân trại ra tiền tuyến
//   iq 2: giữ quân thủ nhà, kéo nhiều cánh về cứu điểm bị đánh, đánh thẳng hậu phương/nông trại của ta
//   iq 3: chặn đánh đạo quân ta giữa đường, rút bỏ điểm không giữ nổi, tổng tấn công HAI MŨI cùng lúc
BW.DIFF_NAMES=['Easy','Normal','Hard'];
BW.brain=function(lv,royale,diff){
  if(royale){ const d=Math.max(0,Math.min(2,diff==null?1:diff|0));
    return {royale:true,diff:d,iq:[1,1,3][d],safe:0,fly:[2,3,5][d],budget:[1,1,2][d],keep:[0,0,0.2][d],over:null,raidCd:0,grace:[420,300,240][d],pw:[0.9,1,1.1][d],grow:[0.72,1,1.3][d],tempo:[1.4,1,0.75][d],hate:[-700,0,600][d],force:1,me:[1.35,1,0.9][d]}; }
  const l=Math.max(1,Math.min(10,typeof lv==='number'?lv:1)), i=l-1;
  return {royale:false,diff:null,lv:l,
    iq:[0,0,1,1,2,2,2,3,3,3][i],
    safe:[0.30,0.28,0.25,0.22,0.19,0.16,0.13,0.10,0.07,0.04][i],
    raidCd:[90,75,60,50,42,36,30,25,21,18][i],
    fly:[3,3,3,4,4,4,5,5,6,6][i],
    budget:[1,1,1,2,2,2,2,3,3,3][i],
    keep:[0,0,0.1,0.15,0.2,0.22,0.25,0.28,0.3,0.3][i],
    over:[0.85,0.95,1,1,0.97,0.96,0.95,0.94,0.93,0.92][i],
    pw:[0.9,0.93,0.96,1,1,1.03,1.05,1.07,1.09,1.12][i],
    force:BW.FORCE[i], grow:1,tempo:1,hate:0,me:1};
};
BW.FORCE=(typeof process!=="undefined"&&process.env&&process.env.FORCE? process.env.FORCE.split(",").map(Number) : [1,0.6,0.32,0.22,0.155,0.125,0.105,0.09,0.078,0.075]);   /* quân khởi điểm của boss theo ải — đã đo bằng máy tự chơi: boss bớt đông, thêm KHÔN */
BW.BOSS_ARMY=[8300,10200,9200,9200,10200,11000,11900,12700,13800,15700];   /* quân boss lúc khai trận (đo thực tế, làm tròn) — hiện trên thẻ ải */
BW.TACTICS=[['🌾 Hoards troops, rarely leaves home'],['🪤 Sets ambushes on your routes'],['🛡️ Keeps home guards','🔥 Raids your farms & rear','🚑 Rushes troops back to defend'],['🎯 Intercepts your armies on the road','⚔️ Two-pronged assaults','🏃 Abandons hopeless posts to regroup']];
BigWar.prototype.pwOf=function(fid){ const D=this.D; return (D&&fid!==this.localFid&&fid!==2&&!this.cfg.p2p&&!this.cfg.classic)? D.pw : 1; };
BigWar.prototype.aiOver=function(){ const D=this.D; return D&&D.over!=null? D.over*D.pw : this.L.aiPow; };
// máy xuất quân nhưng ĐỂ LẠI một phần giữ nhà (người chơi không còn nhặt không các cứ điểm trống)
BigWar.prototype.aiSend=function(from,to,keep){ const D=this.D||{}; let k= keep!=null? keep : (D.keep||0); if(from.owner===this.localFid) k=0;
  const hold= k>0&&from.count>260? Math.round(from.count*k) : 0; from.count-=hold; const a=this.send(from,to); from.count+=hold; return a; };
// PHÒNG THỦ có tính toán (iq≥2): gom đủ viện binh cho điểm bị đánh — kể cả điều quân từ trại; không cứu nổi thì rút (iq 3)
BigWar.prototype.aiDefend=function(fid,budget,announce){ const F=this.localFid, D=this.D, th=new Map();
  for(const atk of this.armies){ if(atk.done||atk.count<=0||!this.isFoe(atk.owner,fid)) continue; if(atk.owner===F&&(atk.smokeT>0||!this.aiVis(atk.x,atk.y,fid))) continue;
    const tgt=atk.to>=0?this.nodes[atk.to]:null; if(!tgt||tgt.owner!==fid||tgt.btl) continue; let t=th.get(tgt); if(!t) th.set(tgt,t={n:tgt,list:[]}); t.list.push(atk); }
  const val=(n)=>(n.camp?1e6:0)+(n.eco?600:0)+n.count;
  for(const t of [...th.values()].sort((a,b)=>val(b.n)-val(a.n))){ if(budget<=0) break; const tgt=t.n, a0=t.list[0];
    let atkEff=0; for(const a of t.list) atkEff+=a.count*BW.counter(a.type,tgt.type,tgt.ter);
    const k=BW.counter(tgt.type,a0.type,tgt.ter)*this.defMul(tgt)*D.pw, defEff=tgt.count*k; if(defEff>=atkEff*1.1) continue;
    let lack=(atkEff*1.2-defEff)/Math.max(0.5,k);
    const reach=BW.range*(tgt.camp?1.7:1.1);
    const helpers=this.nodes.filter(e=>e.owner===fid&&e!==tgt&&!e.btl&&e.count>200&&hyp(e.x-tgt.x,e.y-tgt.y)<=reach).sort((p,q)=>hyp(p.x-tgt.x,p.y-tgt.y)-hyp(q.x-tgt.x,q.y-tgt.y));
    const avail=helpers.reduce((s,e)=>s+e.count*(e.camp?0.5:0.85),0);
    if(avail<lack*0.8&&!tgt.camp){ if(D.iq>=3&&tgt.count>150&&helpers[0]&&!tgt.eco){ if(this.send(tgt,helpers[0])){ announce(tgt,'🏃 Enemy abandons the post to regroup!'); budget--; } } continue; }
    for(const h of helpers){ if(budget<=0||lack<=0) break; const a=this.aiSend(h,tgt,h.camp?0.5:0.15); if(a){ lack-=a.count; budget--; announce(h, tgt.camp?'🚑 Enemy rushes back to save its camp!':'🛡️ Enemy reinforcements!'); } } }
  return budget; };
// CHẶN ĐÁNH (iq 3): đạo quân ta đi lẻ, yếu hơn hẳn một đồn địch gần đó → địch xuất kích đánh ngay giữa đường
BigWar.prototype.aiIntercept=function(fid,en,budget,announce){ const F=this.localFid, D=this.D;
  for(const a of this.armies){ if(budget<=0) break; if(a.owner!==F||a.done||a.btl||a.count<150||a.smokeT>0||a.ambush||(a._hunted||0)>this.time) continue; if(!this.aiVis(a.x,a.y,fid)) continue;
    let best=null,bs=0; for(const e of en){ if(e.btl||e.eco) continue; const d=hyp(e.x-a.x,e.y-a.y); if(d>900) continue; const mine=e.count*(1-(D.keep||0))*BW.counter(e.type,a.type)*D.pw, his=a.count*BW.counter(a.type,e.type); if(mine>his*1.4&&mine-d>bs){ bs=mine-d; best=e; } }
    if(best&&this.aiSend(best,a)){ a._hunted=this.time+25; announce(best,'🎯 Enemy moves to intercept!'); budget--; } }
  return budget; };
// HAI MŨI (iq 3): đủ lực thì chia quân đánh hai mục tiêu cùng lúc — người chơi không thể dồn hết về một chỗ
BigWar.prototype.aiTwoProng=function(fid,src,tgt,mine,need){ const F=this.localFid; if(src.length<3) return false;
  let t2=null,b2=-1e9; for(const m of mine){ if(m===tgt||m.owner!==F||m.ambush||m.btl) continue; const d=hyp(m.x-tgt.x,m.y-tgt.y); if(d<300||d>2600) continue; const see=this.aiSee(m,fid); const sc=(m.eco?900:0)+(m.camp?400:0)-see.count*0.5-d*0.1; if(sc>b2){ b2=sc; t2=m; } }
  if(!t2) return false; const s=[...src].sort((a,b)=>b.count-a.count), A=[],B=[]; let sa=0,sb=0;
  const n1=this.aiSee(tgt,fid).count||tgt.count, n2=this.aiSee(t2,fid).count||t2.count;
  for(const e of s){ if(sa/Math.max(1,n1)<=sb/Math.max(1,n2)){ A.push(e); sa+=e.count; } else { B.push(e); sb+=e.count; } }
  const k=1-(this.D.keep||0); if(!B.length||sa*k<need*n1||sb*k<Math.max(1.3,need*0.8)*n2) return false;
  this.sendCoordinated(A,tgt); this.sendCoordinated(B,t2); return t2; };
if(typeof setupMenus==='function'){ try{ setupMenus(); }catch(e){} }   /* dựng lại menu khi bảng ải đã nạp xong (nút CONTINUE cần tên ải) */
