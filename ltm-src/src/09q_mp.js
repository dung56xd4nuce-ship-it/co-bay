// ============ 👥 (7.0) ĐẤU NHIỀU NGƯỜI QUA WiFi (2–8 người, không máy chủ) — phần luật ============
// Bản đồ dựng bằng bộ sinh của Chinh phạt (kinh đô rải đều, không sát mép, mỗi nước vài đồn khởi nghiệp), mọi nước khởi điểm NHƯ NHAU.
// cfg.mp = { n: tổng số nước (người + máy), seats:[{fid,civ,name,bot}] }.  fid: 0,1,3,4,… (2 là trung lập).
// Máy chủ phòng chạy mô phỏng; nước của người chơi khác (bw.humans) không do máy điều khiển. Người bị loại ngồi xem; còn đúng một nước thì hết trận.
BW_CONQ.mp={ i:-1, id:'mp', name:'LAN Battle', icon:'👥', unit:'players', one:'player', W:8000, H:3000, n:[2,8], dk:1, start:[3000,3000], camp:7000, cell:540, posts:2, ally:0, zMin:0.3, blurb:'Free-for-all over Wi-Fi.' };
BW.MP_MAX=8;
BW.MP_COL=[['#3b82f6','#bfdbfe'],['#ef4444','#fecaca'],['#22c55e','#bbf7d0'],['#f59e0b','#fde68a'],['#a855f7','#e9d5ff'],['#14b8a6','#99f6e4'],['#ec4899','#fbcfe8'],['#a3a3a3','#e5e5e5']];
BW.mpFid=(k)=> k<2? k : k+1;                       /* ghế thứ k → mã phe (chừa 2 cho trung lập) */
BW.mpSeat=(fid)=> fid<2? fid : fid-1;
BW.mpSize=(n)=>{ const area=Math.max(2,n)*3.3e6, W=Math.round(Math.sqrt(area*2.5)/100)*100; return {W,H:Math.round(W/2.5/100)*100}; };
// cấu hình ván: seats = [{civ,name,bot}] theo thứ tự ghế
BW.mpCfg=(seed,seats)=>{ const n=seats.length, S=BW.mpSize(n); BW_CONQ.mp.W=S.W; BW_CONQ.mp.H=S.H;
  return { p2p:true, royale:n-1, conq:'mp', seed, map:seed%BW_MAPS.royale.length, bio:1, diff:1, civ:seats[0].civ||undefined, mp:{n,seats:seats.map((s,k)=>({fid:BW.mpFid(k),civ:s.civ||null,name:String(s.name||('Player '+(k+1))).slice(0,16),bot:s.bot?1:0}))}, L:{name:'LAN Battle',camp:BW_CONQ.mp.camp} }; };
BigWar.prototype.mpInit=function(){ const M=this.cfg.mp; if(!M) return; this.humans=new Set(M.seats.filter(s=>!s.bot).map(s=>s.fid)); this.mpDead={}; };
// tên + màu từng người chơi (thay conqCivs)
BigWar.prototype.mpCivs=function(){ const M=this.cfg.mp, civs=this.civs; this.facName={};
  for(const s of M.seats){ const cv=BW_CIV[s.civ]; if(cv) civs[s.fid]=cv; else if(!civs[s.fid]) civs[s.fid]=BW_CIVS[(s.fid*7)%BW_CIVS.length];
    const c=BW.MP_COL[BW.mpSeat(s.fid)%BW.MP_COL.length]; BW.civPal[s.fid]={color:c[0],light:c[1]}; this.facName[s.fid]=(s.bot? '🤖 ' : '')+s.name; } };
// hết trận khi chỉ còn một nước có trại
BigWar.prototype.mpVictory=function(){ if(this.over) return; const alive=new Set(); for(const n of this.nodes) if(n.camp&&n.owner!==2) alive.add(n.owner);
  for(const s of this.cfg.mp.seats){ if(!alive.has(s.fid)&&!this.mpDead[s.fid]){ this.mpDead[s.fid]=this.time||0.01; if(this.humans) this.humans.delete(s.fid);
      const c=this.nodes[0]; if(this.time>1) this.note('💀 '+this.natName(s.fid)+' has been eliminated',c.x,c.y,'💀'); } }
  if(alive.size<=1){ const w=alive.size? [...alive][0] : -1; this.over=true; this.result={win:w===this.localFid, winFid:w}; if(typeof audio!=='undefined'){ if(this.result.win) audio.win&&audio.win(); else audio.lose&&audio.lose(); } } };
// người chơi rời phòng giữa trận: nước đó giao cho máy
BigWar.prototype.mpLeave=function(fid){ if(this.humans&&this.humans.delete(fid)){ const c=this.nodes.find(n=>n.camp&&n.owner===fid); if(c) this.note('🤖 '+this.natName(fid)+' left — a bot takes over',c.x,c.y,'🤖'); } };
