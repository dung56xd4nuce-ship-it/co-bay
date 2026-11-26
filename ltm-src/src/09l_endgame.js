// ============ 🏁 (5.9) SAU KHI PHÁ ĐẢO: ★ THĂNG THIÊN · ∞ ẢI VÔ TẬN · 📜 SỬ KÝ 44 NƯỚC ============
// • Thăng Thiên ★1–★10: chơi lại trọn Chinh phạt (Bộ lạc → Nội chiến → Đại chiến) với luật bất lợi CỘNG DỒN theo bậc; thắng Đại chiến ở ★N mở ★N+1.
//   Bù lại: xu trong trận & cuối trận ×(1+25%×N) và lá cờ Thăng Thiên cắm ở trại (đổi màu theo bậc).
// • Ải vô tận (11, 12, …): mở khi phá xong ải 10 Đánh Boss. Boss mạnh dần mãi; mỗi ải 1–2 luật đặc biệt bốc theo số ải (cố định, chơi lại vẫn vậy).
// • Sử ký: ghi các nước đã thống nhất thiên hạ (thắng Đại chiến). Nước mới +40 xu; mốc 10 / 22 / 44 nước thưởng thêm.
const BW_ASC=[
  {txt:'Rivals start with +15% troops',          foeStart:1.15},
  {txt:'Neutral garrisons +30%',                 neu:1.3},
  {txt:'Thicker fog — your sight −18%',          vis:0.82},
  {txt:'Rivals grow +15% faster',                foeGrow:1.15},
  {txt:'Rivals decide faster',                   ai:0.8},
  {txt:'Rival strongholds +15% defence',         foeDef:1.15},
  {txt:'Your farms and camps grow −15%',         myGrow:0.85},
  {txt:'Rivals start with another +15%',         foeStart:1.15},
  {txt:'Rivals grow another +15%',               foeGrow:1.15},
  {txt:'Rival strongholds +15% more · fog −10%', foeDef:1.15, vis:0.9},
];
BW.ASC_MAX=BW_ASC.length;
BW.ascMods=function(n){ const m={foeStart:1,neu:1,vis:1,foeGrow:1,ai:1,foeDef:1,myGrow:1}; for(let i=0;i<Math.min(n|0,BW_ASC.length);i++){ const a=BW_ASC[i]; for(const k in m) if(a[k]) m[k]*=a[k]; } return m; };
BW.ascCoinK=function(n){ return 1+0.25*Math.max(0,n|0); };
// ---- ∞ luật đặc biệt của ải vô tận ----
const BW_MUT={
  fog:   {name:'Thick Fog',      icon:'🌫️', txt:'your sight −35%',           vis:0.65},
  rich:  {name:'Rich Boss',      icon:'💰', txt:'boss grows +30% faster',     foeGrow:1.3},
  walls: {name:'Stone Walls',    icon:'🧱', txt:'boss strongholds +30% defence', foeDef:1.3},
  swarm: {name:'Swarm',          icon:'🐜', txt:'boss starts with +25% troops', foeStart:1.25},
  thin:  {name:'Thin Ranks',     icon:'🥀', txt:'your camps and farms grow −20%', myGrow:0.8},
  blitz: {name:'Blitz',          icon:'⚡', txt:'the boss thinks and strikes faster', ai:0.7},
  wild:  {name:'Wild Lands',     icon:'🏕️', txt:'neutral garrisons +40%',     neu:1.4},
};
const BW_MUT_IDS=Object.keys(BW_MUT);
BW.endlessMuts=function(n){ const R=mulberry32((n|0)*7717+911), k= n>=15? 2 : 1, ids=BW_MUT_IDS.slice(), out=[];   /* ải 11–14: 1 luật · từ ải 15: 2 luật */
  for(let i=0;i<k;i++){ const j=(R()*ids.length)|0; out.push(ids.splice(j,1)[0]); } return out; };
// cấu hình một ải vô tận: lấy ải 10 làm gốc, quân + nhịp sinh của boss tăng 7%/ải
BW.endlessCfg=function(n,civ){ const B=BW_LEVELS[BW_LEVELS.length-1], k=1+0.07*Math.max(0,n-BW_LEVELS.length);
  return {civ, endless:n, mut:BW.endlessMuts(n), map:((n*7)%BW_MAPS.solo.length), seed:(n*131+17), L:{enMin:Math.round(B.enMin*k), enMax:Math.round(B.enMax*k), enGrow:+(B.enGrow*k).toFixed(2), camp:Math.round(B.camp*k)}}; };
BW.endlessArmy=function(n){ return Math.round(BW.BOSS_ARMY[BW.BOSS_ARMY.length-1]*(1+0.07*Math.max(0,n-BW_LEVELS.length))); };

// ---- áp luật Thăng Thiên / ải vô tận vào ván vừa dựng (gọi cuối hàm dựng; ván lưu thì số quân được nạp đè sau đó) ----
BigWar.prototype.applyMods=function(){ const cf=this.cfg||{}; if(cf.p2p) return;
  const m={foeStart:1,neu:1,vis:1,foeGrow:1,ai:1,foeDef:1,myGrow:1};
  if(cf.asc>0&&this.conq){ const a=BW.ascMods(cf.asc); for(const k in m) m[k]*=a[k]; this.asc=cf.asc|0; this._coinK=BW.ascCoinK(cf.asc); }
  if(cf.endless>0&&Array.isArray(cf.mut)){ this.endless=cf.endless|0; for(const id of cf.mut){ const u=BW_MUT[id]; if(u) for(const k in m) if(u[k]) m[k]*=u[k]; } }
  if(!this.asc&&!this.endless) return;
  const F=this.localFid;
  for(const n of this.nodes){ if(n.owner===2) n.count=Math.round(n.count*m.neu); else if(n.owner!==F) n.count=Math.round(n.count*m.foeStart); }
  this.visR=Math.round(this.visR*m.vis); this.D.grow*=m.foeGrow; this.L.ai=Math.max(1.2,this.L.ai*m.ai); this.nextAI=Math.min(this.nextAI,this.L.ai*0.9);
  this.L.grow*=m.myGrow; this._foeDef=m.foeDef; this._mods=m; this._visT=0; if(this._updateVision) this._updateVision(); };
// dòng mô tả luật đang áp (băng giới thiệu, thẻ ải)
BW.modLines=function(cfg){ if(!cfg) return []; if(cfg.asc>0) return BW_ASC.slice(0,cfg.asc).map((a,i)=>`★${i+1} ${a.txt}`); if(cfg.endless>0) return (cfg.mut||[]).map(id=>BW_MUT[id]? `${BW_MUT[id].icon} ${BW_MUT[id].name}: ${BW_MUT[id].txt}` : ''); return []; };
BW.ascStars=0;   /* số ★ cao nhất đã qua — lá cờ Thăng Thiên ở trại vẽ theo số này (gán từ dữ liệu lưu) */
if(typeof setupMenus==='function'){ try{ setupMenus(); }catch(e){} }   /* dựng lại menu khi bảng ★/∞ đã nạp */
