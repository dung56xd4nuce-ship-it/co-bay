// 🧩 (5.4) CỨ ĐIỂM NHIỀU BINH CHỦNG + TÁCH QUÂN
//   • Cứ điểm là KHO QUÂN: giữ được nhiều binh chủng (n.mix = tỉ lệ từng loại; n.type = loại đông nhất, dùng khi thủ thành).
//     Quân tăng/giảm (sinh quân, thương vong) chia đều theo tỉ lệ nên mọi luật cũ dùng n.count/n.type vẫn đúng.
//   • Đạo quân ngoài đồng vẫn CHỈ MỘT binh chủng (một biểu tượng, một con số) — trận đánh và bảng khắc chế không đổi.
//   • Xuất quân: chọn binh chủng (hoặc tất cả — mỗi loại một đạo, đi cùng nhau) và chọn lượng (tất cả / một nửa / một phần tư).
BW.sendFracs=[[1,'All'],[0.5,'½'],[0.25,'¼']];
BW.sendMin=20;   /* tách ra ít hơn 20 lính thì không thành một đạo quân */
BigWar.prototype.mixOf=function(n){ const m=n.mix; if(m&&n.mixO===n.owner&&m[n.type]>0) return m; if(m){ n.mix=null; } const o={}; o[n.type]=1; return o; };
BigWar.prototype.mixList=function(n){ const m=this.mixOf(n), out=[]; for(const t in m){ const c=m[t]*n.count; if(c>=1) out.push([t,c]); } return out.sort((a,b)=>b[1]-a[1]); };
BigWar.prototype.mixSet=function(n,counts){ let tot=0, best=null, bc=-1; for(const t in counts){ if(!(counts[t]>0.5)){ delete counts[t]; continue; } tot+=counts[t]; if(counts[t]>bc){ bc=counts[t]; best=t; } }
  if(!best){ n.mix=null; return; } const ks=Object.keys(counts); if(ks.length===1){ n.mix=null; n.type=best; return; }
  const m={}; for(const t of ks) m[t]=counts[t]/tot; n.mix=m; n.mixO=n.owner; n.type=best; };
// nhập quân vào cứ điểm của mình: KHÔNG còn đổi hết sang một loại — loại nào giữ loại nấy (before = quân có trước khi cộng)
BigWar.prototype.mixAdd=function(n,type,cnt,before){ const m=this.mixOf(n), c={}; for(const t in m) c[t]=m[t]*Math.max(0,before); c[type]=(c[type]||0)+cnt; this.mixSet(n,c); };
BigWar.prototype.mixTake=function(n,type,cnt,before){ const m=this.mixOf(n); if(Object.keys(m).length<2) return; const c={}; for(const t in m) c[t]=m[t]*before; c[type]=Math.max(0,(c[type]||0)-cnt); if(n.count>0) this.mixSet(n,c); };
// lựa chọn xuất quân của người chơi cho cứ điểm đang chọn (loại nào đi, đi bao nhiêu)
BigWar.prototype.selOpt=function(n){ const s=this.sendSel; if(!s||!n||s.node!==n.id) return null; const o={}; if(s.type&&this.mixOf(n)[s.type]>0) o.type=s.type; if(s.frac>0&&s.frac<1) o.frac=s.frac; return (o.type||o.frac)? o : null; };
BigWar.prototype.selGoing=function(n){ const o=this.selOpt(n)||{}, f=o.frac||1; let c= o.type? n.count*this.mixOf(n)[o.type] : n.count; return Math.floor(c*f+1e-6); };
// 📣 hiệu lệnh BẮT DÍNH mục tiêu: chạm gần trại / cứ điểm / đạo quân đang đóng của ta thì lấy đúng chỗ đó làm điểm tập kết
BigWar.prototype.rallySnap=function(x,y){ const F=this.localFid, R=Math.max(120, 48/Math.max(0.05,this.scale||1)); let bn=null, bd=R;   /* chỉ bắt dính vào trại/đồn/đạo quân CỦA TA (đồn địch và trung lập: phải chạm đúng mới ra lệnh đánh, bằng menu thường) */
  for(const n of this.nodes){ if(n.owner!==F) continue; const d=hyp(n.x-x,n.y-y)-(n.camp?40:0); if(d<bd){ bd=d; bn=n; } }
  let ba=null, ad=Math.min(bd,R*0.8); for(const a of this.armies){ if(a.owner!==F||a.done||a.count<=0||a.btl||!a.camped) continue; const d=hyp(a.x-x,a.y-y); if(d<ad){ ad=d; ba=a; } }
  return ba? {army:ba,x:ba.x,y:ba.y} : bn? {node:bn,x:bn.x,y:bn.y} : null; };
// 🚑 CỨU TRẠI: tìm trại/cứ điểm của ta đang nguy nhất quanh điểm chạm
BigWar.prototype.rescuePick=function(x,y){ const F=this.localFid; let best=null, bs=-1e9;
  for(const n of this.nodes){ if(n.owner!==F) continue; let danger=0; if(n.btl) danger+=3000; if(n.sieged) danger+=1500;
    for(const a of this.armies){ if(a.done||a.count<=0||!this.isFoe(a.owner,F)) continue; if(a.to===n.id) danger+=2500+a.count; else if(!(a.to>=0&&this.nodes[a.to].owner===F)&&hyp(a.x-n.x,a.y-n.y)<520) danger+=300+a.count*0.3; }   /* địch đang kéo thẳng tới trại này nặng hơn hẳn địch chỉ đi ngang gần */
    const d=hyp(n.x-x,n.y-y), snap=Math.max(170, 70/Math.max(0.05,this.scale||1)); const sc=(d<snap? 1e6 : 0)+danger+(n.camp?400:0)-d*0.6; if((danger>0||d<snap)&&sc>bs){ bs=sc; best=n; } }
  return best; };
