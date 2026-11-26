// ============ 🗺️ (5.7) CHINH PHẠT: BỘ LẠC → NỘI CHIẾN → ĐẠI CHIẾN ============
// Chơi tuần tự 3 bản đồ với CÙNG một nước (chọn ở màn đầu) và cùng mức khó:
//   • Bộ lạc (tribe): 8–12 bộ lạc, quân khởi điểm 20–50, chỉ một loại quân (chiến binh bộ lạc, không khắc chế), bản đồ nhỏ, không Lò rèn / quân nhu.
//   • Nội chiến (civil): 16–20 vùng trong cùng một nước (cùng nền văn minh, tên vùng + màu riêng), khởi điểm 2 000–5 000, có binh chủng
//     + DÂN BINH (chỉ sinh ở làng/đồn đã chiếm; trại & lò luyện sinh binh chủng chính). Mất kinh đô = cả vùng quy hàng.
//   • Đại chiến (great): TẤT CẢ các nước trong game, khởi điểm 10 000–50 000, chỉ binh chủng, bản đồ 40 000×12 000, kinh đô rải ngẫu nhiên.
// Quân số bên trong vẫn ở cùng cỡ với Quần Hùng (để nhịp sinh quân, lương thảo, thời gian giao tranh giữ nguyên); chỉ con số HIỂN THỊ được nhân BW.dk.
const BW_CONQ={
  tribe:{ i:0, id:'tribe', name:'Tribal Wars', icon:'🪓', unit:'tribes', one:'tribe', W:9600,  H:3400,  n:[8,12],  dk:0.025, start:[800,2000], camp:3000,  cell:520, posts:2, ally:0,    zMin:0.3,
    blurb:'Unite the tribes. One kind of warrior, no counters — just numbers, ground and timing.' },
  civil:{ i:1, id:'civil', name:'Civil War',   icon:'⚔️', unit:'regions', one:'region', W:14000, H:4800,  n:[16,20], dk:1,    start:[2000,5000], camp:7000,  cell:540, posts:2, ally:0.08, zMin:0.3,
    blurb:'Regions of your own land fight for the throne. Unit types return; captured villages raise local militia.' },
  great:{ i:2, id:'great', name:'Great War',   icon:'🌏', unit:'nations', one:'nation', W:40000, H:12000, n:[44,44], dk:5,    start:[2000,10000], camp:14000, cell:560, posts:2, ally:0.12, zMin:0.18,
    blurb:'Every nation in the world on one vast map. Only true armies — conquer them all.' },
};
const BW_CONQ_ORDER=['tribe','civil','great'];
const BW_CLANS=['Wolf','Bear','Eagle','Serpent','Boar','Tiger','Raven','Stag','Fox','Bison','Hawk','Lynx','Crane','Shark','Panther','Owl'];
const BW_PROVINCES=['Northern March','Southern Delta','Eastern Coast','Western Hills','Central Plains','Lake Country','Red River','Jade Valley','Iron Hills','Golden Coast',
  'Stone Gate','Pine Forest','Salt Flats','Twin Rivers','High Pass','Cloud Peaks','Sunset Bay','Amber Fields','Black Marsh','Eagle Rock','Silver Lake','Thunder Ridge'];

// ---- tên + màu riêng cho các phe khi cả bản đồ chung một nền văn minh (Bộ lạc / Nội chiến) ----
BigWar.prototype.conqCivs=function(R){
  const S=BW_CONQ[this.conq], civs=this.civs, me=civs[0], fids=Object.keys(civs).map(Number).filter(f=>f!==0);
  this.facName={};
  if(this.conq==='great'){ this.facName[0]=me.name; return; }
  const pool=(this.conq==='tribe'? BW_CLANS : BW_PROVINCES).slice(); for(let i=pool.length-1;i>0;i--){ const j=(R()*(i+1))|0; const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  this.facName[0]= this.conq==='tribe'? me.name+' Clan' : me.name+' Crown';
  // màu: rải đều vòng màu, chừa dải xanh dương của người chơi
  const hs=[]; const N=fids.length; for(let i=0;i<N;i++){ let h=(i*(300/N)+250+R()*8)%360; if(h>=188&&h<=238) h=(h+60)%360; hs.push(h); }
  for(let i=hs.length-1;i>0;i--){ const j=(R()*(i+1))|0; const t=hs[i]; hs[i]=hs[j]; hs[j]=t; }
  fids.forEach((f,i)=>{ civs[f]=me; const h=Math.round(hs[i]), l=48+((i*7)%3)*6; BW.civPal[f]={color:`hsl(${h} 70% ${l}%)`,light:`hsl(${h} 85% 80%)`};
    this.facName[f]= this.conq==='tribe'? (pool[i%pool.length]+' Clan') : pool[i%pool.length]; });
};

// ---- dựng bản đồ Chinh phạt (thay cho bố cục 1v1 + Quần Hùng cũ) ----
BigWar.prototype.genConq=function(R,W,H,node){
  const S=BW_CONQ[this.conq], NR=this.cfg.royale, N=NR+1, L=this.L;
  const eco=(x,y,kind,guard,trainType,owner)=>{ const n=node(x,y,owner==null?2:owner, trainType||this.postType(R), guard); n.eco=kind; if(kind==='train') n.trainType=trainType; return n; };
  // 1) KINH ĐÔ: rải ngẫu nhiên (Poisson) trong lòng bản đồ, không sát mép, cách nhau đủ xa
  const mx=Math.max(700,W*0.06), my=Math.max(560,H*0.13); let dmin=Math.sqrt((W-2*mx)*(H-2*my)/N)*0.78, pts=[];
  for(let round=0;round<30&&pts.length<N;round++){ pts=[];
    for(let t=0;t<N*400&&pts.length<N;t++){ const x=mx+R()*(W-2*mx), y=my+R()*(H-2*my);
      let ok=true; for(const p of pts){ const dx=p[0]-x, dy=(p[1]-y)*1.15; if(dx*dx+dy*dy<dmin*dmin){ ok=false; break; } } if(ok) pts.push([x,y]); }
    if(pts.length<N) dmin*=0.94; }
  while(pts.length<N) pts.push([mx+R()*(W-2*mx), my+R()*(H-2*my)]);
  const fids=[0,1]; for(let f=3;f<3+NR-1;f++) fids.push(f);
  const st=()=>Math.round(S.start[0]+(S.start[1]-S.start[0])*R());
  const caps=[];
  fids.forEach((fid,i)=>{ const p=pts[i], c=node(p[0],p[1],fid,this.civType(fid),st(),true); c.struct='citadel'; c.home=fid; c.capOf=fid; caps.push(c); });
  this.nodes[0].count=Math.round(S.start[0]+(S.start[1]-S.start[0])*(0.35+R()*0.3));   /* người chơi: khoảng giữa dải quân khởi điểm */
  // 2) PHỦ BẢN ĐỒ: đồn/làng trung lập + trang trại, kho lương, lò luyện (Bộ lạc: không có lò luyện vì chưa có binh chủng)
  const cell=S.cell, capGrid=new Map(), CG=1500; for(const c of caps){ const k=Math.floor(c.x/CG)*1000+Math.floor(c.y/CG); let a=capGrid.get(k); if(!a) capGrid.set(k,a=[]); a.push(c); }
  const nearCap=(x,y)=>{ let bd=1e9; const gx=Math.floor(x/CG), gy=Math.floor(y/CG); for(let r=1;r<=6&&bd>=1e9;r++) for(let ix=-r;ix<=r;ix++) for(let iy=-r;iy<=r;iy++){ const a=capGrid.get((gx+ix)*1000+gy+iy); if(a) for(const c of a){ const d=hyp(c.x-x,c.y-y); if(d<bd) bd=d; } } return bd; };
  const HG=new Map(), HC=300, hk=(x,y)=>Math.floor(x/HC)*10000+Math.floor(y/HC);
  for(const n of this.nodes){ const k=hk(n.x,n.y); let a=HG.get(k); if(!a) HG.set(k,a=[]); a.push(n); }
  const crowded=(x,y)=>{ const gx=Math.floor(x/HC), gy=Math.floor(y/HC); for(let ix=-2;ix<=2;ix++) for(let iy=-2;iy<=2;iy++){ const a=HG.get((gx+ix)*10000+gy+iy); if(a) for(const m of a){ const lim=m.camp? 400 : 250; if(Math.abs(m.x-x)<lim&&Math.abs(m.y-y)<lim&&hyp(m.x-x,m.y-y)<lim) return true; } } return false; };
  const addH=(n)=>{ const k=hk(n.x,n.y); let a=HG.get(k); if(!a) HG.set(k,a=[]); a.push(n); };
  const trainTypes=this.conq==='civil'? [...new Set(this.civs[0].roster.concat(['spear','archer','cavalry','shield']))] : ['spear','archer','cavalry','saber','shield','crossbow'];
  for(let gx=cell*0.5; gx<W; gx+=cell) for(let gy=cell*0.5+120; gy<H-80; gy+=cell){
    const x=Math.max(140,Math.min(W-140,gx+(R()-0.5)*cell*0.7)), y=Math.max(215,Math.min(H-100,gy+(R()-0.5)*cell*0.7));
    if(crowded(x,y)) continue;
    const far=Math.min(1,nearCap(x,y)/(cell*5)), k=R(); let n;
    if(k<0.13){ n=eco(x,y,'farm',150+far*600*(0.8+R()*0.4)); n.cap=Math.round(800+far*900); }
    else if(k<0.19){ n=eco(x,y,'granary',200+far*400); n.food=500; n.cap=700; }
    else if(k<0.25&&this.conq!=='tribe'){ const tt=trainTypes[(R()*trainTypes.length)|0]; n=eco(x,y,'train',180+far*450,tt); n.cap=650; }
    else { n=node(x,y,2,this.postType(R),(160+R()*200)*(1+far*1.8)); const q=R(), vil=this.conq==='civil'? 0.3 : 0.17;
      if(q<0.05) n.struct='fort'; else if(q<vil) n.struct='village'; else if(q<vil+0.012) n.struct='citadel'; }
    addH(n); }
  // 3) mỗi phe khởi nghiệp với vài vùng đất sát kinh đô
  for(const c of caps){
    const near=this.nodes.filter(n=>n.owner===2&&!n.camp&&!n.eco&&Math.abs(n.x-c.x)<1400&&Math.abs(n.y-c.y)<1400).sort((a,b)=>hyp(a.x-c.x,a.y-c.y)-hyp(b.x-c.x,b.y-c.y)).slice(0,S.posts);
    const T=c.count; c.count=Math.round(T*0.45);   /* quân khởi điểm chia: kinh đô 45% · mỗi đồn 20% · trang trại 15% (máy cần quân ở đồn để mở rộng) */
    for(const n of near){ n.owner=c.owner; n.type=this.conq==='civil'? 'militia' : this.civType(c.owner,(R()*4)|0); n.count=Math.round(T*0.2); n.mix=null; }
    { const f=this.nodes.filter(n=>n.owner===2&&n.eco==='farm'&&Math.abs(n.x-c.x)<1600&&Math.abs(n.y-c.y)<1600).sort((a,b)=>hyp(a.x-c.x,a.y-c.y)-hyp(b.x-c.x,b.y-c.y))[0];
      if(f){ f.owner=c.owner; f.count=Math.round(T*0.15); if(this.conq==='tribe') f.type='tribal'; } } }
  this.royale=true;
  // 4) ngoại giao ban đầu
  if(S.ally>0){ const nf=fids.filter(f=>f!==0); for(const f of nf){ if(R()<S.ally){ const g=nf[(R()*nf.length)|0]; if(g!==f) this.setAlly(f,g,true); } } }
};
// loại quân của đồn trung lập theo cấp bản đồ
BigWar.prototype.postType=function(R){ if(this.conq==='tribe') return 'tribal'; if(this.conq==='civil') return 'militia'; return BW_TYPES[(R()*BW_TYPES.length)|0]; };
BigWar.prototype.conqName=function(){ const S=BW_CONQ[this.conq]; return S? S.name : ''; };

// ============ 🧱 LÃNH THỔ: vùng đất mỗi phe (từ các cứ điểm đang giữ), có đường biên — trên bản đồ lớn và bản đồ nhỏ ============
// Mỗi ô lưới thuộc về cứ điểm GẦN NHẤT trong bán kính; cứ điểm trung lập không có lãnh thổ. Chiếm thêm thành trấn → đất mở rộng theo.
BW.terrCell=110; BW.terrR=560; BW.terrNoFill=1;
BigWar.prototype.terrSig=function(){ let h=0; const N=this.nodes; for(let i=0;i<N.length;i++){ h=(h*31+(N[i].owner+1)*(i+7))|0; } return h; };
BigWar.prototype.terrBuild=function(){ const g=this.terrGen(); while(!g.next().done){} };
// dựng từng phần (mỗi khung hình vài ms) để máy yếu không khựng hình khi biên giới đổi
BigWar.prototype.terrGen=function*(){
  const CS=BW.terrCell, W=BW.W, H=BW.H, gw=Math.ceil(W/CS), gh=Math.ceil(H/CS), TR=BW.terrR, TR2=TR*TR, N=this.nodes;
  let own=this._terrO; if(!own||own.length!==gw*gh) own=this._terrO=new Uint8Array(gw*gh); own.fill(255);
  // mỗi cứ điểm "đóng dấu" các ô trong bán kính (nhanh hơn để mỗi ô đi tìm cứ điểm)
  let dst=this._terrD; if(!dst||dst.length!==gw*gh) dst=this._terrD=new Float32Array(gw*gh); dst.fill(TR2);
  const rC=Math.ceil(TR/CS);
  let ni=0; for(const n of N){ if((++ni&63)===0) yield 1; const cx0=Math.floor(n.x/CS), cy0=Math.floor(n.y/CS), o= n.owner===2? 255 : n.owner;
    for(let y=Math.max(0,cy0-rC);y<=Math.min(gh-1,cy0+rC);y++){ const dy=(y+0.5)*CS-n.y, dy2=dy*dy*1.2; if(dy2>=TR2) continue; const row=y*gw;
      for(let x=Math.max(0,cx0-rC);x<=Math.min(gw-1,cx0+rC);x++){ const dx=(x+0.5)*CS-n.x, d=dx*dx+dy2; if(d<dst[row+x]){ dst[row+x]=d; own[row+x]=o; } } } }
  // ảnh nền tô màu (1 điểm ảnh = 1 ô; phóng to có làm mịn → mép mềm)
  let cv=this._terrCv; if(!cv||cv.width!==gw||cv.height!==gh){ cv=this._terrCv=document.createElement('canvas'); cv.width=gw; cv.height=gh; }
  const g=cv.getContext('2d'), img=g.createImageData(gw,gh), D=img.data, rgb={};
  const col=(o)=>{ if(rgb[o]) return rgb[o]; const c=o===this.localFid? '#3b82f6' : BW.facPal(o).color; rgb[o]=bwRGB(c); return rgb[o]; };
  for(let i=0;i<own.length;i++){ const o=own[i]; if(o===255) continue; const c=col(o); D[i*4]=c[0]; D[i*4+1]=c[1]; D[i*4+2]=c[2]; D[i*4+3]= o===this.localFid? 74 : 58; }
  g.putImageData(img,0,0);
  // đường biên: "marching squares" một lượt cho mọi khối 2×2 có nhiều chủ — biên đi qua trung điểm giữa các ô, góc vát chéo
  const SEG={1:'LB',2:'BR',3:'LR',4:'TR',5:'TRLB',6:'TB',7:'TL',8:'TL',9:'TB',10:'TLBR',11:'TR',12:'LR',13:'BR',14:'LB'};
  const CK=2400, chunks=new Map();
  const at=(x,y)=>own[(y<0?0:y>=gh?gh-1:y)*gw+(x<0?0:x>=gw?gw-1:x)], cc=(v,m)=>((v<0?0:v>m?m:v)+0.5)*CS;
  for(let y=-1;y<gh;y++){ if((y&7)===7) yield 1; for(let x=-1;x<gw;x++){ const a=at(x,y), b=at(x+1,y), c2=at(x+1,y+1), d=at(x,y+1); if(a===b&&b===c2&&c2===d) continue;
    const x0=cc(x,gw-1), x1=cc(x+1,gw-1), y0=cc(y,gh-1), y1=cc(y+1,gh-1), mx=(x0+x1)/2, my=(y0+y1)/2;
    for(let w=0;w<4;w++){ const o= w===0? a : w===1? b : w===2? c2 : d; if(o===255||(w>0&&o===a)||(w>1&&o===b)||(w>2&&o===c2)) continue;   /* mỗi chủ một lần trong khối */
      const k=(a===o?8:0)|(b===o?4:0)|(c2===o?2:0)|(d===o?1:0), sg=SEG[k]; if(!sg) continue;
      for(let q=0;q<sg.length;q+=2){ const P=(e)=> e==='T'? [mx,y0] : e==='B'? [mx,y1] : e==='L'? [x0,my] : [x1,my]; const A=P(sg[q]), C=P(sg[q+1]); if(A[0]===C[0]&&A[1]===C[1]) continue;
        const key=Math.floor(A[0]/CK)*1000+Math.floor(A[1]/CK); let ch=chunks.get(key); if(!ch) chunks.set(key,ch={}); const pp=ch[o]||(ch[o]=new Path2D()); pp.moveTo(A[0],A[1]); pp.lineTo(C[0],C[1]); } } }
  }
  this._terrCh=chunks; this._terrCK=CK;
  this._terrGW=gw; this._terrGH=gh;
};
function bwRGB(c){ if(c[0]==='#'){ const v=parseInt(c.length===4? c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c.slice(1,7),16); return [(v>>16)&255,(v>>8)&255,v&255]; }
  const m=/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(c); if(!m) return [200,200,200]; const h=+m[1]/360, s=+m[2]/100, l=+m[3]/100;
  const q=l<0.5? l*(1+s) : l+s-l*s, p=2*l-q, f=(t)=>{ t=(t+1)%1; return t<1/6? p+(q-p)*6*t : t<1/2? q : t<2/3? p+(q-p)*(2/3-t)*6 : p; };
  return [Math.round(f(h+1/3)*255),Math.round(f(h)*255),Math.round(f(h-1/3)*255)]; }
BigWar.prototype.terrTick=function(){
  if(this._terrJob){ const t0=performance.now(); for(;;){ if(this._terrJob.next().done){ this._terrJob=null; this._mmT=-9; break; } if(performance.now()-t0>2.5) return; } return; }   /* đang dựng dở: mỗi khung hình tối đa 2,5 ms */
  const now=this.time||0, gap= BW.W>15000? 3 : 1.5; if(this._terrCh&&now-(this._terrT||-9)<gap&&now>=(this._terrT||0)) return; this._terrT=now;
  const sg=this.terrSig(); if(this._terrCh&&sg===this._terrS) return; this._terrS=sg;
  if(!this._terrCh){ this.terrBuild(); this._mmT=-9; return; }   /* lần đầu: dựng ngay một lượt */
  this._terrJob=this.terrGen(); };
BigWar.prototype.drawTerritory=function(c,scale){ if(!this.royale||BW.terrOff||this.intro) return; this.terrTick(); const cv=this._terrCv; if(!cv||!this._terrCh) return;
  const CS=BW.terrCell, sc=Math.max(0.01,scale||1), vw=(this.lastVw||1200)/sc, vh=(this.lastVh||600)/sc, x0=this.camX||0, y0=this.camY||0;
  c.save(); c.imageSmoothingEnabled=true;
  if(!BW.terrNoFill) c.drawImage(cv,0,0,this._terrGW*CS,this._terrGH*CS);
  if(BW.terrNoLine){ c.restore(); return; }
  const lw=Math.max(5,2.4/sc), CK=this._terrCK, ch=this._terrCh, L=[];
  for(let bx=Math.floor((x0-200)/CK);bx<=Math.floor((x0+vw+200)/CK);bx++) for(let by=Math.floor((y0-200)/CK);by<=Math.floor((y0+vh+200)/CK);by++){ const q=ch.get(bx*1000+by); if(q) L.push(q); }
  const F=this.localFid, ord=(q)=>Object.keys(q).map(Number).sort((p,r)=>(p===F)-(r===F));
  c.lineCap='round'; c.lineJoin='round';
  const far=sc<0.16, fd=Math.min(0.2,this._fdt||0.016); if(this._terrDt==null) this._terrDt=0.016; this._terrDt=this._terrDt*0.8+(this._idle? fd*0.6 : fd)*0.2;   /* lúc rảnh tay game tự hạ 30 khung/giây: quy về nhịp tương đương (khung 33 ms ≈ 20 ms) */   /* lúc rảnh tay game tự hạ 30 khung/giây: giữ nguyên chế độ đã đo khi đang thao tác */ const lite=this._terrDt>0.026;   /* máy đang chậm (khung > 26 ms): chế độ nhẹ */
  if(far&&(lite||this._terrDt>0.022)){ c.restore(); return; }   /* toàn cảnh chỉ vẽ biên khi máy dư sức (nhiều đoạn biên nhất) */   /* máy yếu nhìn toàn cảnh: lãnh thổ chỉ hiện trên bản đồ nhỏ */
  if(lite){ c.globalAlpha=0.9; c.lineWidth=lw; for(const q of L) for(const o of ord(q)){ c.strokeStyle= o===F? '#7cc0ff' : BW.facPal(o).color; c.stroke(q[o]); } c.restore(); return; }
  if(far){ c.globalAlpha=0.85; c.lineWidth=Math.max(3,1.6/sc); for(const q of L) for(const o of ord(q)){ c.strokeStyle= o===F? '#7cc0ff' : BW.facPal(o).color; c.stroke(q[o]); } c.restore(); return; }
  if(!BW.terrNoBand){ c.globalAlpha=0.16; c.lineWidth=lw*5; for(const q of L) for(const o of ord(q)){ c.strokeStyle= o===F? '#3b82f6' : BW.facPal(o).color; c.stroke(q[o]); } }   /* dải màu mềm dọc biên: thấy rõ vùng đất mỗi phe mà không phải tô kín cả màn hình (máy yếu) */
  c.globalAlpha=0.9; c.lineWidth=lw; for(const q of L) for(const o of ord(q)){ c.strokeStyle= o===F? '#7cc0ff' : BW.facPal(o).color; c.stroke(q[o]); }
  c.restore(); };

// ---- 🔨 DÂN BINH (Nội chiến): làng / đồn / thành đã chiếm tự mộ quân địa phương — ít, chậm, tới mức trần thì thôi ----
BW.militia={ village:0.34, fort:0.24, citadel:0.3, post:0.16, cap:{village:900, fort:700, citadel:1100, post:500} };
BigWar.prototype.militiaTick=function(){ const F=this.localFid, M=BW.militia;
  for(const n of this.nodes){ if(n.owner===2||n.camp||n.eco||n.sieged||n.btl) continue; const ci=this.capInfo&&this.capInfo[n.owner]; if(ci&&ci.full) continue;
    const kind=n.struct||'post', cap=M.cap[kind]||500; if(n.count>=cap) continue;
    const grow=(n.owner===F? this.L.grow : this.L.enGrow*this.D.grow)*(M[kind]||0.16)*Math.max(0.2,1-n.count/cap)*(n.drumT>0? BW.gear.drumMul : 1), k=Math.max(1,Math.round(grow));
    const before=n.count; n.count=Math.min(cap,n.count+k); this.mixAdd(n,'militia',n.count-before,before);
    if(n.owner===F&&this.visNow&&this.visNow(n)) this.texts.push({x:n.x+40,y:n.y-40,s:'+'+bwN(n.count-before)+' 🔨',col:'#d6c3a0',t:0,max:0.9}); } };
if(typeof setupMenus==='function'){ try{ setupMenus(); }catch(e){} }   /* dựng lại menu khi bảng Chinh phạt đã nạp (nút CONQUEST) */
