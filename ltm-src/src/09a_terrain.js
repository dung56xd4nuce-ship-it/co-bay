// ============ 🗺️ ĐỊA HÌNH · ĐƯỜNG CÁI · TÌM ĐƯỜNG ============
// Bản đồ = ĐỒNG BẰNG nền + dãy núi + rừng + sa mạc + thung lũng + 1 con sông (chỉ vượt được ở BẾN SÔNG).
// Mọi cứ điểm nối với nhau bằng ĐƯỜNG CÁI. Kỵ binh và ĐẠI QUÂN (≥ BW.bigArmy lính) chỉ đi được ở đồng trống và trên đường;
// bộ binh đi xuyên rừng núi được nhưng chậm; quân đột kích nhẹ đi rừng núi gần như không chậm.
BW.bigArmy=2000;                     // từ 2000 lính trở lên là "đại quân"
BW.roadHalf=50;                      // nửa bề rộng hành lang đất trống dọc đường cái
BW.fordR=105;                        // bán kính bến sông
BW.roadBoost=1.12;                   // đi trên đường cái nhanh hơn 12%
BW.TER=['plain','forest','mountain','desert','valley','river'];
BW.mv={ // hệ số tốc độ theo LỚP DI CHUYỂN × địa hình (0 = không đi được)
  F:{plain:1,desert:0.85,valley:0.9,forest:0.58,mountain:0.42,river:0.7},   // bộ binh
  H:{plain:1,desert:0.85,valley:0.9,forest:0,mountain:0,river:0.7},         // kỵ binh + đại quân
  R:{plain:1,desert:0.9,valley:1,forest:0.95,mountain:0.65,river:0.7} };    // đột kích nhẹ
BW.typeSpeed={cavalry:1.35,shield:0.8,assassin:1.1};

// ---- sinh địa hình (gọi trong constructor, TRƯỚC khi chốt vị trí cứ điểm) ----
BigWar.prototype.genTerrain=function(R,W,H){
  const area=W*H/(6600*1520), S=this.terSeeds=[];
  const add=(x,y,ter,r)=>{ if(x<-r||x>W+r||y<-r||y>H+r) return null; const s={x,y,ter,r,p1:R()*6.28,p2:R()*6.28}; S.push(s); return s; };
  const B=this.biome||{}, bf=(k)=>B[k]==null? 1 : B[k];   /* (5.3) kiểu địa hình của bản đồ */
  this.riverX0=W*(0.4+R()*0.16); this.riverAmp=110+R()*70; this.riverPh=R()*7; this.riverFq=0.004;
  if(B.river==='none'){ this.riverX0=-99999; this.riverAmp=0; this.noRiver=true; } else if(B.river){ this.riverAmp=Math.min(this.big? 900 : 420, this.riverAmp*(B.river.amp||1)); this.riverFq=(B.river.fq||0.004)*(this.big? 0.45 : 1); }
  this.riverX=(y)=>this.riverX0+Math.sin(y*this.riverFq+this.riverPh)*this.riverAmp;
  // DÃY NÚI: chuỗi 3–5 khối nối nhau theo một hướng; chân núi thường có thung lũng
  const nRange=Math.max(bf('mtn')<1?1:3,Math.round(4.2*area*bf('mtn')));
  for(let i=0;i<nRange;i++){ let x=W*(0.08+R()*0.84), y=H*(0.16+R()*0.72); const an=R()*Math.PI, n=3+((R()*3)|0); let last=null;
    for(let k=0;k<n;k++){ const r=165+R()*100; last=add(x,y,'mountain',r)||last; x+=Math.cos(an)*r*1.2+(R()-0.5)*50; y+=Math.sin(an)*r*0.85+(R()-0.5)*50; }
    if(last&&R()<0.75){ const va=an+Math.PI/2*(R()<0.5?1:-1), vr=190+R()*90; add(last.x+Math.cos(va)*(last.r+vr*0.55), last.y+Math.sin(va)*(last.r+vr*0.55)*0.8,'valley',vr); } }
  // RỪNG: cụm 2–3 khối chồng nhau
  const nForest=Math.max(bf('forest')<1?2:6,Math.round(9.5*area*bf('forest')));
  for(let i=0;i<nForest;i++){ let x=W*(0.05+R()*0.9), y=H*(0.14+R()*0.76); const n=2+((R()*2)|0);
    for(let k=0;k<n;k++){ const r=210+R()*130; add(x,y,'forest',r); const an=R()*6.28; x+=Math.cos(an)*r*0.9; y+=Math.sin(an)*r*0.6; } }
  // SA MẠC + thung lũng lẻ
  const nDesert=bf('desert')<=0? 0 : Math.max(1,Math.round(2*area*bf('desert')));
  for(let i=0;i<nDesert;i++){ const x=W*(0.08+R()*0.84), y=H*(0.2+R()*0.62), r=280+R()*140; add(x,y,'desert',r); if(R()<0.6) add(x+(R()-0.5)*r,y+(R()-0.5)*r*0.6,'desert',r*0.7); }
  const nValley=Math.max(1,Math.round(2*area*bf('valley'))); for(let i=0;i<nValley;i++) add(W*(0.1+R()*0.8),H*(0.2+R()*0.62),'valley',200+R()*90);
  // tra cứu hạt địa hình theo ô 500px
  const SB=500; this._sb=new Map();
  for(const s of S){ const rr=s.r*1.3; for(let bx=Math.floor((s.x-rr)/SB);bx<=Math.floor((s.x+rr)/SB);bx++) for(let by=Math.floor((s.y-rr)/SB);by<=Math.floor((s.y+rr)/SB);by++){ const key=bx*4096+by; let arr=this._sb.get(key); if(!arr) this._sb.set(key,arr=[]); arr.push(s); } }
  const seedsAt=(x,y)=>this._sb.get(Math.floor(x/SB)*4096+Math.floor(y/SB))||[];
  // địa hình "thô" (chưa tính đường cái): khối nào bao điểm đó sát tâm nhất thì thắng; mép khối lượn sóng cho tự nhiên
  this.terAtRaw=(x,y)=>{ if(Math.abs(x-this.riverX(y))<62) return 'river';
    let best='plain', bq=1;
    for(const s of seedsAt(x,y)){ const dx=x-s.x, dy=(y-s.y)/0.82, d=hyp(dx,dy); if(d>=s.r*1.3) continue; const an=Math.atan2(dy,dx);
      const q=d/(s.r*(1+0.16*Math.sin(3*an+s.p1)+0.1*Math.sin(5*an+s.p2))); if(q<bq){ bq=q; best=s.ter; } }
    return best; };
};

// ---- đường cái + lưới tra cứu (gọi SAU khi vị trí cứ điểm đã chốt; gọi lại khi nạp ván lưu) ----
BigWar.prototype.genRoads=function(){
  const W=BW.W, H=BW.H, ns=this.nodes, nN=ns.length;
  this.bridges=(this.big? [0.05,0.14,0.23,0.32,0.41,0.5,0.59,0.68,0.77,0.86,0.95] : [0.18,0.42,0.64,0.86]).map(fy=>({x:this.riverX(H*fy),y:H*fy})); if(this.noRiver) this.bridges=[];   /* sa mạc/đất tro: không có sông thì không có bến */
  this.nearBridge=(x,y,r2)=>{ r2=r2||BW.fordR; for(const b of this.bridges){ if(Math.abs(y-b.y)<r2&&hyp(x-b.x,y-b.y)<r2) return b; } return null; };
  const side=(p)=>p.x<this.riverX(p.y)?0:1, sd=ns.map(side);
  const wet=(A,B)=>{ const d=hyp(B.x-A.x,B.y-A.y), k=Math.max(2,Math.ceil(d/40)); for(let i=1;i<k;i++){ const x=A.x+(B.x-A.x)*i/k, y=A.y+(B.y-A.y)*i/k; if(Math.abs(x-this.riverX(y))<74) return true; } return false; };
  const roads=this.roads=[], done=new Set(), uf=[]; for(let i=0;i<nN+this.bridges.length;i++) uf.push(i);
  const find=(i)=>{ while(uf[i]!==i){ uf[i]=uf[uf[i]]; i=uf[i]; } return i; };
  const P=(i)=> i<nN? ns[i] : this.bridges[i-nN];
  const link=(i,j)=>{ const key=i<j? i+'-'+j : j+'-'+i; if(done.has(key)) return; done.add(key); const A=P(i), B=P(j);
    roads.push({x1:A.x,y1:A.y,x2:B.x,y2:B.y,a:i<nN?i:null,b:j<nN?j:null,ford:(i>=nN||j>=nN)?1:0}); uf[find(i)]=find(j); };
  // 1) mỗi cứ điểm nối 2 láng giềng gần nhất CÙNG BỜ (đường không bao giờ cắt ngang sông)
  const near=ns.map((n,i)=>{ const arr=[]; for(let j=0;j<nN;j++){ if(j===i||sd[j]!==sd[i]) continue; const d=hyp(ns[j].x-n.x,ns[j].y-n.y); if(d<2600) arr.push([d,j]); }
    arr.sort((a,b)=>a[0]-b[0]); const out=[]; for(const e of arr){ if(out.length>=6) break; if(!wet(n,ns[e[1]])) out.push(e); } return out; });
  ns.forEach((n,i)=>{ for(const e of near[i].slice(0,2)) link(i,e[1]); });
  // 2) mỗi BẾN SÔNG nối với cứ điểm gần nhất ở từng bờ
  //    (5.1) Đường rời cầu chạy NGANG một quãng rồi mới rẽ về cứ điểm; chọn cứ điểm gần nhất mà quãng rẽ ấy KHÔ RÁO
  //    (trước đây nối thẳng tới cứ điểm gần nhất, có khi đường vẽ nằm dọc giữa lòng sông).
  const dryLeg=(x0,y0,x1,y1)=>{ const d=hyp(x1-x0,y1-y0), k=Math.max(2,Math.ceil(d/30)); for(let i=0;i<=k;i++){ const x=x0+(x1-x0)*i/k, y=y0+(y1-y0)*i/k; if(Math.abs(x-this.riverX(y))<82) return false; } return true; };
  const fordExit=(b,n,s)=>{ const sg= s===0? -1 : 1; for(const d of [100,160,240,320,420,540]){ if(dryLeg(b.x+sg*d,b.y,n.x,n.y)) return d; } return 0; };
  this.bridges.forEach((b,bi)=>{ for(const s of [0,1]){ const arr=[]; for(let j=0;j<nN;j++){ if(sd[j]!==s) continue; arr.push([hyp(ns[j].x-b.x,ns[j].y-b.y),j]); } arr.sort((p,q)=>p[0]-q[0]);
      let bj=-1, ex=0; for(let q=0;q<Math.min(8,arr.length);q++){ const e=fordExit(b,ns[arr[q][1]],s); if(e){ bj=arr[q][1]; ex=e; break; } } if(bj<0&&arr.length) bj=arr[0][1];
      if(bj>=0){ link(nN+bi,bj); const r=roads[roads.length-1]; if(r.ford&&r.a==null&&r.b===bj) r.exit=ex*(s===0? -1 : 1); } } });
  // 3) nối liền mọi cụm còn rời nhau: cạnh ứng viên ngắn trước (Kruskal), cuối cùng quét cặp gần nhất khác cụm
  const cand=[]; near.forEach((arr,i)=>{ for(const [d,j] of arr) cand.push([d,i,j]); }); cand.sort((a,b)=>a[0]-b[0]);
  for(const [d,i,j] of cand) if(find(i)!==find(j)) link(i,j);
  for(let guard=0;guard<nN;guard++){ const root=find(0); let bi=-1,bj=-1,bd=1e9;
    for(let i=0;i<nN;i++){ if(find(i)===root) continue; for(let j=0;j<nN;j++){ if(find(j)!==root||sd[i]!==sd[j]) continue; const d=hyp(ns[i].x-ns[j].x,ns[i].y-ns[j].y); if(d<bd&&!wet(ns[i],ns[j])){bd=d;bi=i;bj=j;} } }
    if(bi<0) break; link(bi,bj); }
  // 4) (5.1) TỈA ĐƯỜNG THỪA: trong mỗi "tam giác" đường, bỏ cạnh dài nhất (hai cạnh ngắn hơn vẫn nối đủ ba nơi).
  //    Mạng đường thoáng hẳn, hết cảnh đường chằng chịt hình tam giác; mọi cứ điểm vẫn có đường tới.
  { const K=(i,j)=>i<j? i*4096+j : j*4096+i, len=(r)=>hyp(r.x2-r.x1,r.y2-r.y1), has=new Map(), nb=new Map(), nn=[];
    const addN=(i,j)=>{ let st=nb.get(i); if(!st) nb.set(i,st=new Set()); st.add(j); };
    for(const r of roads){ if(r.a==null||r.b==null) continue; nn.push(r); has.set(K(r.a,r.b),r); addN(r.a,r.b); addN(r.b,r.a); }
    const longer=(p,q)=>{ const d=len(p)-len(q); return d>1e-6||(d>-1e-6&&K(p.a,p.b)>K(q.a,q.b)); };   /* hai cạnh dài bằng nhau (bản đồ đối xứng): phân thứ bậc theo số hiệu để vẫn bỏ được đúng một cạnh */
    nn.sort((p,q)=>longer(p,q)? -1 : longer(q,p)? 1 : 0);
    for(const r of nn){ const A=nb.get(r.a), B=nb.get(r.b); let cut=false;
      for(const k of A){ if(k===r.b||!B.has(k)) continue; const r1=has.get(K(r.a,k)), r2=has.get(K(r.b,k)); if(r1&&r2&&!r1.dead&&!r2.dead&&longer(r,r1)&&longer(r,r2)){ cut=true; break; } }
      if(cut){ r.dead=true; A.delete(r.b); B.delete(r.a); } }
    for(let i=roads.length-1;i>=0;i--) if(roads[i].dead) roads.splice(i,1); }
  // 5) (5.1) ĐƯỜNG CONG MỀM: mỗi tuyến là một chuỗi điểm uốn nhẹ (không còn là đoạn thẳng gãy góc). Uốn theo hạt giống bản đồ → hai máy P2P ra cùng một hình.
  //    Bến sông: đường chạy NGANG ra khỏi cầu rồi mới rẽ về cứ điểm. Đường không lấn xuống nước, không vượt mép bản đồ (lấn thì uốn ít lại).
  { const S0=(this.mapSeed|0), rh=(i,k)=>{ let h=(i*374761393+k*668265263+S0*982451653)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967296; };
    const badPt=(x,y)=>x<24||y<24||x>W-24||y>H-24||Math.abs(x-this.riverX(y))<80;
    roads.forEach((r,ri)=>{ const pts=[[r.x1,r.y1]]; let sx=r.x1, sy=r.y1; const bx=r.x2, by=r.y2;
      if(r.ford&&r.exit){ const e=r.exit, sg= e<0? -1 : 1; for(let d=70;d<Math.abs(e)-20;d+=70) pts.push([sx+sg*d,sy]); sx+=e; pts.push([sx,sy]); }   /* quãng chạy ngang ra khỏi cầu */
      const dx=bx-sx, dy=by-sy, L=hyp(dx,dy)||1, nx=-dy/L, ny=dx/L, n=Math.max(1,Math.round(L/64));
      const h1=rh(ri,7)-0.5, h2=rh(ri,8)-0.5, h3=rh(ri,9)-0.5;
      let a1=Math.min(105,L*0.13)*(h1<0? -1 : 1)*(0.5+Math.abs(h1)), a2=Math.min(42,L*0.05)*h2*2, a3=Math.min(22,L*0.025)*h3*2;
      for(let tries=0;tries<5;tries++){ const tmp=[]; let bad=false;
        for(let i=1;i<n;i++){ const t=i/n, off= tries>3? 0 : a1*Math.sin(Math.PI*t)+a2*Math.sin(2*Math.PI*t)+a3*Math.sin(3*Math.PI*t), x=sx+dx*t+nx*off, y=sy+dy*t+ny*off;
          if(tries<=3&&badPt(x,y)){ bad=true; break; } tmp.push([x,y]); }
        if(!bad){ for(const q of tmp) pts.push(q); break; } a1*=0.5; a2*=0.5; a3*=0.5; }
      pts.push([bx,by]);
      let len=0, x0=1e9, y0=1e9, x1=-1e9, y1=-1e9; const cum=[0];
      for(let i=0;i<pts.length;i++){ const q=pts[i]; if(i){ len+=hyp(q[0]-pts[i-1][0],q[1]-pts[i-1][1]); cum.push(len); } if(q[0]<x0) x0=q[0]; if(q[0]>x1) x1=q[0]; if(q[1]<y0) y0=q[1]; if(q[1]>y1) y1=q[1]; }
      r.pts=pts; r.len=len; r.bx0=x0; r.by0=y0; r.bx1=x1; r.by1=y1; r.cum=cum; const m=this.roadAt(r,0.5); r.mx=m[0]; r.my=m[1]; }); }
  // tra cứu đoạn đường theo ô 400px (mỗi tuyến cong = nhiều đoạn ngắn)
  const RB=400, M=BW.roadHalf+30; this._rb=new Map();
  for(const rd of roads){ const P2=rd.pts; for(let q=1;q<P2.length;q++){ const r={x1:P2[q-1][0],y1:P2[q-1][1],x2:P2[q][0],y2:P2[q][1]};
    const x0=Math.floor((Math.min(r.x1,r.x2)-M)/RB), x1=Math.floor((Math.max(r.x1,r.x2)+M)/RB), y0=Math.floor((Math.min(r.y1,r.y2)-M)/RB), y1=Math.floor((Math.max(r.y1,r.y2)+M)/RB);
    for(let bx=x0;bx<=x1;bx++) for(let by=y0;by<=y1;by++){ const key=bx*4096+by; let arr=this._rb.get(key); if(!arr) this._rb.set(key,arr=[]); arr.push(r); } } }
  this.roadNear=(x,y)=>{ let bd=1e9,px=x,py=y; // khoảng cách tới đường gần nhất + điểm chiếu trên tim đường
    for(const r of (this._rb.get(Math.floor(x/RB)*4096+Math.floor(y/RB))||[])){ const dx=r.x2-r.x1, dy=r.y2-r.y1, L2=dx*dx+dy*dy||1;
      let t=((x-r.x1)*dx+(y-r.y1)*dy)/L2; t=Math.max(0,Math.min(1,t)); const qx=r.x1+dx*t, qy=r.y1+dy*t, d=hyp(x-qx,y-qy); if(d<bd){ bd=d; px=qx; py=qy; } }
    return {d:bd,x:px,y:py}; };
  this.distRoad=(x,y)=>this.roadNear(x,y).d;
  // địa hình thực dụng: sông > hành lang đường cái (đất trống) > khối địa hình; nhớ theo lưới 20px
  const TG=20; this._tgW=Math.ceil(W/TG); this._tgH=Math.ceil(H/TG); this._tg=new Int8Array(this._tgW*this._tgH).fill(-1);
  this.terAt=(x,y)=>{ if(Math.abs(x-this.riverX(y))<62) return 'river';
    const gx=Math.max(0,Math.min(this._tgW-1,(x/TG)|0)), gy=Math.max(0,Math.min(this._tgH-1,(y/TG)|0)), gi=gx+gy*this._tgW, v=this._tg[gi];
    if(v>=0) return BW.TER[v];
    const cx=(gx+0.5)*TG, cy=(gy+0.5)*TG, t= this.distRoad(cx,cy)<BW.roadHalf? 'plain' : this.terAtRaw(cx,cy);
    this._tg[gi]=BW.TER.indexOf(t); return t; };
  this.nav=null; this._tileGen=(this._tileGen||0)+1; // lưới đi lại + ảnh bản đồ dựng lại theo đường mới
  this.navBuild(); this.navCost('F'); this.navCost('H'); this.navComp('F'); this.navComp('H'); // dựng sẵn lưới đi lại ngay lúc vào trận (kẻo đạo quân đầu tiên xuất phát làm khựng một nhịp)
  this._navWarm=['Rfm','Rm','Rf','Hfm','Hm','Hf','Ffm','Fm','Ff','R'];   /* (5.1) bảng của các hồ sơ còn lại tính dần, mỗi khung hình một bảng, ngay đầu trận — không dồn vào lúc đang đánh */
};
// điểm nằm trên tuyến đường tại tỉ lệ f (0 = đầu, 1 = cuối) tính theo chiều dài thật của đường cong; trả [x, y, hướng x, hướng y]
BigWar.prototype.roadAt=function(r,f){ const P=r.pts, C=r.cum, want=Math.max(0,Math.min(1,f))*r.len; let i=1; while(i<P.length-1&&C[i]<want) i++;
  const a=P[i-1], b=P[i], seg=(C[i]-C[i-1])||1, t=(want-C[i-1])/seg; return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, (b[0]-a[0])/seg, (b[1]-a[1])/seg]; };

// ---- lưới đi lại ----
BigWar.prototype.navBuild=function(){
  const cs=this.big?60:40, w=Math.ceil(BW.W/cs), h=Math.ceil(BW.H/cs), n=w*h, ter=new Uint8Array(n), flag=new Uint8Array(n);
  for(let cy=0;cy<h;cy++) for(let cx=0;cx<w;cx++){ const x=(cx+0.5)*cs, y=(cy+0.5)*cs, i=cy*w+cx, t=this.terAt(x,y); ter[i]=BW.TER.indexOf(t);
    if(t==='river') flag[i]= this.nearBridge(x,y)? 2 : 1;            // 1 = nước sâu (cấm mọi quân) · 2 = bến sông
    else if(this.distRoad(x,y)<cs*0.75) flag[i]=4; }                 // 4 = mặt đường cái
  return this.nav={cs,w,h,n,ter,flag,cost:{},g:new Float32Array(n),from:new Int32Array(n),st:new Uint32Array(n),cl:new Uint32Array(n),tick:0,cache:new Map()};
};
// bảng "thời gian đi qua 1 ô" cho một hồ sơ di chuyển: chữ đầu F/H/R, thêm 'f' = đi rừng thạo, 'm' = leo núi thạo (thế mạnh của một số nền văn minh)
BigWar.prototype.navCost=function(key){ const N=this.nav||this.navBuild(); if(N.cost[key]) return N.cost[key];
  const base=BW.mv[key[0]]||BW.mv.F, fOK=key.indexOf('f')>0, mOK=key.indexOf('m')>0, wOK=key.indexOf('w')>0, c=new Float32Array(N.n);
  for(let i=0;i<N.n;i++){ const t=BW.TER[N.ter[i]]; let m=base[t]; if(t==='forest'&&fOK) m=Math.max(m,0.9); if(t==='mountain'&&mOK) m=Math.max(m,0.8);
    if(N.flag[i]===1) m= wOK? (base.river||0.7)*0.8 : 0; else if(N.flag[i]===4) m=Math.max(m,1)*BW.roadBoost;   /* nước sâu: cấm, trừ khi có ván cầu (đi chậm hơn bến sông một chút) */
    c[i]= m>0? 1/m : Infinity; }
  return N.cost[key]=c; };
// (5.1) VÙNG LIÊN THÔNG cho từng hồ sơ di chuyển (tính một lần): hỏi "có tới được không" chỉ còn là so hai con số,
// không phải loang A* khắp bản đồ rồi mới biết là không có lối (nguồn gây khựng mỗi khi máy tính toán nước đi).
BigWar.prototype.navComp=function(key){ const N=this.nav||this.navBuild(); const hit=N.comp&&N.comp[key]; if(hit) return hit;
  const C=this.navCost(key), w=N.w, n=N.n, L=new Int32Array(n), st=new Int32Array(n); let id=0;
  for(let s0=0;s0<n;s0++){ if(L[s0]||!(C[s0]<1e9)) continue; id++; let sp=0; st[sp++]=s0; L[s0]=id;
    while(sp){ const i=st[--sp], x=i%w;
      if(x>0&&!L[i-1]&&C[i-1]<1e9){ L[i-1]=id; st[sp++]=i-1; } if(x<w-1&&!L[i+1]&&C[i+1]<1e9){ L[i+1]=id; st[sp++]=i+1; }
      if(i>=w&&!L[i-w]&&C[i-w]<1e9){ L[i-w]=id; st[sp++]=i-w; } if(i+w<n&&!L[i+w]&&C[i+w]<1e9){ L[i+w]=id; st[sp++]=i+w; } } }
  (N.comp||(N.comp={}))[key]=L; return L; };
BigWar.prototype.navCell=function(x,y){ const N=this.nav||this.navBuild(); return Math.max(0,Math.min(N.w-1,(x/N.cs)|0))+Math.max(0,Math.min(N.h-1,(y/N.cs)|0))*N.w; };
BigWar.prototype.navNearest=function(C,x,y,maxRing){ const N=this.nav, cx=Math.max(0,Math.min(N.w-1,(x/N.cs)|0)), cy=Math.max(0,Math.min(N.h-1,(y/N.cs)|0)); let best=-1, bd=1e18;
  for(let r=1;r<=maxRing;r++){ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue; const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=N.w||ny>=N.h) continue; const i=ny*N.w+nx; if(!(C[i]<1e9)) continue;
      const d=hyp((nx+0.5)*N.cs-x,(ny+0.5)*N.cs-y); if(d<bd){ bd=d; best=i; } }
    if(best>=0&&r*N.cs>bd+N.cs) break; }
  return best; };
// hồ sơ di chuyển của một đạo quân / đội quân trong cứ điểm
const MV_PROF={F:['F','Ff','Fm','Ffm'],H:['H','Hf','Hm','Hfm'],R:['R','Rf','Rm','Rfm']};   // tên hồ sơ lấy từ bảng có sẵn (không ghép chuỗi mỗi lần hỏi)
const MV_PROF_W={}; for(const b in MV_PROF) MV_PROF_W[b]=MV_PROF[b].map(k=>k+'w');           // (5.2) 🪵 ván cầu: thêm 'w' = lội sông ở đâu cũng được
BigWar.prototype.mvProfile=function(a){ const cav=a.type==='cavalry', k=(cav||a.count>=BW.bigArmy)? 'H' : a.type==='assassin'? 'R' : 'F', T= a.plankT>0? MV_PROF_W : MV_PROF;
  const cv=this.civOf? this.civOf(a.owner) : null; if(cv&&cv.pass&&!cav) return T[k][(cv.pass.indexOf('f')>=0? 1:0)+(cv.pass.indexOf('m')>=0? 2:0)];
  return T[k][0]; };
BigWar.prototype.mvSpeed=function(a,key){ const C=this.navCost(key), c=C[this.navCell(a.x,a.y)]; const m= c<1e9? 1/c : 0.4; // lỡ đứng trong vùng cấm: lết ra với 40% tốc độ
  const cv=this.civOf? this.civOf(a.owner) : null; let k=1; if(cv){ if(cv.spd&&!(cv.spdType&&cv.spdType!==a.type)) k*=cv.spd; if(cv.road&&this.nav.flag[this.navCell(a.x,a.y)]===4) k*=cv.road; }
  if(a.teaT>0) k*=BW.gear.teaMul; if(this.up) k*=this.upMul('speed',a.owner);   /* 🍵 trà gừng · ⚒️ lò rèn (Speed) */
  return BW.speed*m*(BW.typeSpeed[a.type]||1)*k*BW.sizeSpd(a.count); };   // đại quân đi chậm hơn (src/09d_supply.js)

// ---- A*: trả {pts:[[x,y]...] (không gồm điểm xuất phát), ok (tới đúng đích?), cost (quãng đường quy đổi theo thời gian)} ----
BigWar.prototype.findPath=function(key,x0,y0,x1,y1){
  const N=this.nav||this.navBuild(), C=this.navCost(key), cs=N.cs, w=N.w, h=N.h;
  let s=this.navCell(x0,y0), g=this.navCell(x1,y1), ok=true, pre=null;
  const ck=key+':'+s+':'+g, hit=N.cache.get(ck);
  if(hit){ N.cache.delete(ck); N.cache.set(ck,hit); const pts=hit.pts.map(p=>[p[0],p[1]]); if(hit.ok&&pts.length) pts[pts.length-1]=[x1,y1]; return {pts,ok:hit.ok,cost:hit.cost}; }   /* lộ trình hay dùng được giữ lại lâu nhất */
  if(!(C[g]<1e9)){ const g2=this.navNearest(C,x1,y1,16); ok=false; if(g2<0) return {pts:[],ok:false,cost:Infinity}; g=g2; }   // đích trong vùng cấm → tới ô đi được sát đích nhất
  if(!(C[s]<1e9)){ const s2=this.navNearest(C,x0,y0,16); if(s2<0) return {pts:[],ok:false,cost:Infinity}; pre=s2; s=s2; }    // đang đứng trong vùng cấm → thoát ra đã
  { const CP=this.navComp(key); if(CP[s]!==CP[g]){ ok=false; const me=CP[s], gx0=g%w, gy0=(g/w)|0; let best=s, bd=1e18;   /* đích ở vùng khác (bị sông/rừng núi chặn): tới ô GẦN ĐÍCH NHẤT trong vùng của mình */
      for(let r=1;r<w+h;r++){ if(r*r>bd) break; const xa=gx0-r, xb=gx0+r, ya=gy0-r, yb=gy0+r;
        for(let x=Math.max(0,xa);x<=Math.min(w-1,xb);x++){ if(ya>=0&&CP[ya*w+x]===me){ const d=(x-gx0)*(x-gx0)+r*r; if(d<bd){ bd=d; best=ya*w+x; } } if(yb<h&&CP[yb*w+x]===me){ const d=(x-gx0)*(x-gx0)+r*r; if(d<bd){ bd=d; best=yb*w+x; } } }
        for(let y=Math.max(0,ya+1);y<=Math.min(h-1,yb-1);y++){ if(xa>=0&&CP[y*w+xa]===me){ const d=(y-gy0)*(y-gy0)+r*r; if(d<bd){ bd=d; best=y*w+xa; } } if(xb<w&&CP[y*w+xb]===me){ const d=(y-gy0)*(y-gy0)+r*r; if(d<bd){ bd=d; best=y*w+xb; } } } }
      g=best; } }
  const G=N.g, from=N.from, st=N.st, cl=N.cl, T=++N.tick, gx=g%w, gy=(g/w)|0, hmin=1/BW.roadBoost;
  const Hf=(i)=>{ const dx=Math.abs(i%w-gx), dy=Math.abs(((i/w)|0)-gy); return (Math.max(dx,dy)+0.4142*Math.min(dx,dy))*hmin; };
  const hi=[], hf=[]; // đống nhị phân theo f
  const push=(i,f)=>{ let k=hi.length; hi.push(i); hf.push(f); while(k>0){ const p=(k-1)>>1; if(hf[p]<=f) break; hi[k]=hi[p]; hf[k]=hf[p]; k=p; } hi[k]=i; hf[k]=f; };
  const pop=()=>{ const top=hi[0], li=hi.pop(), lf=hf.pop(), n=hi.length; if(n){ let k=0; for(;;){ let c=2*k+1; if(c>=n) break; if(c+1<n&&hf[c+1]<hf[c]) c++; if(hf[c]>=lf) break; hi[k]=hi[c]; hf[k]=hf[c]; k=c; } hi[k]=li; hf[k]=lf; } return top; };
  G[s]=0; st[s]=T; from[s]=-1; push(s,Hf(s)); let best=s, bestH=Hf(s), found=false;
  while(hi.length){ const cur=pop(); if(cl[cur]===T) continue; cl[cur]=T; if(cur===g){ found=true; break; }
    const hc=Hf(cur); if(hc<bestH){ bestH=hc; best=cur; }
    const cx=cur%w, cy=(cur/w)|0, cc=C[cur], gc=G[cur];
    for(let dy=-1;dy<=1;dy++){ const ny=cy+dy; if(ny<0||ny>=h) continue;
      for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const nx=cx+dx; if(nx<0||nx>=w) continue; const ni=ny*w+nx, c=C[ni]; if(!(c<1e9)||cl[ni]===T) continue;
        if(dx&&dy&&(!(C[cur+dx]<1e9)||!(C[cur+dy*w]<1e9))) continue;       // không lách chéo qua góc ô cấm
        const ng=gc+(dx&&dy?1.4142:1)*(cc+c)*0.5; if(st[ni]!==T||ng<G[ni]){ G[ni]=ng; st[ni]=T; from[ni]=cur; push(ni,ng+Hf(ni)); } } } }
  if(!found){ ok=false; g=best; }                                           // không có lối tới đích → tới chỗ gần đích nhất mà đi được
  const cells=[]; for(let i=g;i>=0;i=from[i]){ cells.push(i); if(cells.length>N.n) break; } cells.reverse();
  // điểm mốc: tâm ô (ô mặt đường thì bám tim đường cho quân đi đúng trên đường)
  const P=[[x0,y0]], cum=[0];
  for(let k=(pre!=null?0:1);k<cells.length;k++){ const i=cells[k]; let x=(i%w+0.5)*cs, y=(((i/w)|0)+0.5)*cs;
    if(N.flag[i]===4){ const rn=this.roadNear(x,y); if(rn.d<cs){ x=rn.x; y=rn.y; } }
    P.push([x,y]); cum.push(G[i]*cs); }
  if(ok&&cells.length){ if(P.length>1&&cells.length>1) P[P.length-1]=[x1,y1]; else { P.push([x1,y1]); cum.push((cum[cum.length-1]||0)+hyp(x1-x0,y1-y0)*C[g]); } }
  // rút gọn: bỏ điểm giữa khi đi thẳng không tốn thời gian hơn (và không cắt qua ô cấm)
  const seg=(a,b)=>{ const d=hyp(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(d/(cs*0.5))); let sum=0; for(let i=0;i<=n;i++){ const c=C[this.navCell(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n)]; if(!(c<1e9)) return Infinity; sum+=c; } return sum/(n+1)*d; };
  const pts=[]; let i=0; const last=P.length-1;
  while(i<last){ let j=i+1; for(const step of [32,16,8,4,2]){ const t=Math.min(last,i+step); if(t>j&&seg(P[i],P[t])<=(cum[t]-cum[i])*1.04+1){ j=t; break; } } pts.push(P[j]); i=j; }
  const cost=G[g]*cs;
  N.cache.set(ck,{pts:pts.map(p=>[p[0],p[1]]),ok,cost}); if(N.cache.size>2500){ N.cache.delete(N.cache.keys().next().value); }
  return {pts,ok,cost};
};
// thời gian hành quân ước tính (giây) theo đường đi thật — AI dùng để hợp đồng tác chiến
BigWar.prototype.pathEta=function(src,tx,ty){ const key=this.mvProfile(src), P=this.findPath(key,src.x,src.y,tx,ty); const c=P.cost<1e9? P.cost : hyp(tx-src.x,ty-src.y)*1.6;
  return c/(BW.speed*(BW.typeSpeed[src.type]||1)*BW.sizeSpd(src.count)*(this.up? this.upMul('speed',src.owner) : 1)); };   /* ⚒️ Lò rèn (Speed): dự báo thời gian đi cũng nhanh lên theo */
// đích có vào được không? (để báo cho người chơi ngay khi ra lệnh)
BigWar.prototype.canReach=function(src,tx,ty){ const key=this.mvProfile(src), C=this.navCost(key), CP=this.navComp(key), g=this.navCell(tx,ty); let s0=this.navCell(src.x,src.y), ok= C[g]<1e9;
  if(ok){ if(!(C[s0]<1e9)) s0=this.navNearest(C,src.x,src.y,16); ok= s0>=0&&CP[s0]===CP[g]; }                 /* cùng vùng liên thông = có lối (không cần dò đường) */
  const self=this; return {ok,key,get end(){ const P=self.findPath(key,src.x,src.y,tx,ty); return P.pts.length? P.pts[P.pts.length-1] : [src.x,src.y]; }}; };
// tên lớp quân cho câu thông báo
BigWar.prototype.mvWhy=function(a){ return a.type==='cavalry'? '🐎 Cavalry' : '🚩 Large armies ('+BW.bigArmy+'+)'; };

// ---- vẽ lộ trình của các đạo quân ta đang chọn / vừa nhận lệnh ----
BigWar.prototype.drawPaths=function(c,tm,dt){ const F=this.localFid, sel=new Set(this.selG&&this.selG.length? this.selG : (this.selA? [this.selA] : []));
  c.lineCap='round'; c.lineJoin='round';
  for(const a of this.armies){ if(a.pvT>0) a.pvT-=dt||0; if(a.owner!==F||a.done||a.btl||a.camped||!a.path||!a.path.length) continue; const on=sel.has(a); if(!on&&!(a.pvT>0)) continue;
    const al= on? 0.9 : Math.min(0.7,a.pvT/1.2);
    c.beginPath(); c.moveTo(a.x,a.y-6); for(let i=a.pi||0;i<a.path.length;i++) c.lineTo(a.path[i][0],a.path[i][1]-6);
    c.setLineDash([]); c.strokeStyle=`rgba(20,30,40,${al*0.45})`; c.lineWidth=9; c.stroke();
    c.setLineDash([16,13]); c.lineDashOffset=-tm*46; c.strokeStyle=`rgba(125,255,207,${al})`; c.lineWidth=5; c.stroke(); c.setLineDash([]);
    const e=a.path[a.path.length-1]; c.fillStyle=`rgba(125,255,207,${al})`; c.beginPath(); c.arc(e[0],e[1]-6,9,0,7); c.fill();
    if(a.pathOk===false){ c.font='900 26px system-ui'; c.textAlign='center'; c.fillText('⛔',e[0],e[1]-22); } }
};
