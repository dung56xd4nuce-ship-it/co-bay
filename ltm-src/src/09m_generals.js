// ============ 🎖️ (6.0) TƯỚNG LĨNH — chiêu mộ bằng xu, lên cấp qua các trận, mang 1–2 tướng vào trận ============
// Mỗi tướng một tài năng (bị động, luôn có hiệu lực cho phe ta). Cấp 1–5: hiệu lực tăng theo cấp. Kinh nghiệm: thắng +3, thua +1.
// Không áp dụng ở P2P (hai người phải ngang nhau) và trận hướng dẫn.
// 8 TÀI NĂNG (6.2: tướng có thật ở 09m_heroes.js, mỗi vị mang một tài năng)
const BW_GENERALS=[
  {id:'vanguard', name:'Attack',    icon:'⚔️', cost:250, w:5, col:'#ef4444', skill:'Attack',   desc:(v)=>`Your troops hit ${pct(v)} harder`,                 val:(l)=>0.05+0.02*(l-1)},
  {id:'warden',   name:'Defence', icon:'🛡️', cost:220, w:3, col:'#64748b', skill:'Defence',  desc:(v)=>`Your strongholds defend ${pct(v)} better`,           val:(l)=>0.08+0.03*(l-1)},
  {id:'rider',    name:'March',     icon:'🐎', cost:200, w:2, col:'#f59e0b', skill:'March',    desc:(v)=>`Your armies march ${pct(v)} faster`,                 val:(l)=>0.06+0.02*(l-1)},
  {id:'ranger',   name:'Sight',        icon:'🏹', cost:180, w:1, col:'#22c55e', skill:'Sight',    desc:(v)=>`You see ${pct(v)} further through the fog`,          val:(l)=>0.15+0.05*(l-1)},
  {id:'guide',    name:'Pathfinder', icon:'🌲', cost:240, w:0, col:'#15803d', skill:'Pathfinder', desc:(v,l)=>`Your foot troops cross ${l>=3? 'forests and mountains' : 'forests'} at full speed`+(l>=3? '' : ' (mountains too from level 3)'), val:(l)=>l},
  {id:'medic',    name:'Field medic',    icon:'💉', cost:260, w:4, col:'#ec4899', skill:'Field medic', desc:(v)=>`After each battle you win, ${pct(v)} of the troops you lost there return`, val:(l)=>0.10+0.04*(l-1)},
  {id:'recruiter',name:'Recruiting',     icon:'📣', cost:230, w:3, col:'#8b5cf6', skill:'Recruiting', desc:(v)=>`Your camps and farms raise troops ${pct(v)} faster`, val:(l)=>0.08+0.03*(l-1)},
  {id:'treasurer',name:'Treasury',     icon:'💰', cost:300, w:2, col:'#eab308', skill:'Treasury', desc:(v)=>`You earn ${pct(v)} more Meme Coins`,                val:(l)=>0.15+0.05*(l-1)},
];
function pct(v){ return '+'+Math.round(v*100)+'%'; }
const BW_GEN_BY={}; for(const g of BW_GENERALS) BW_GEN_BY[g.id]=g;
BW.genXP=[0,5,12,22,35];   /* kinh nghiệm cần để lên cấp 2,3,4,5 */
BW.genSlot2=400;           /* mở ô tướng thứ 2 */
BW.genLevel=function(xp){ let l=1; for(let i=1;i<BW.genXP.length;i++) if((xp|0)>=BW.genXP[i]) l=i+1; return l; };
// gắn tướng vào ván: list = [{id,lv}]
// gắn tướng vào ván: list = [{id: mã tướng có thật (BW_HERO), lv}] — chỉ tướng của đúng nền văn minh ta đang chơi (lọc ở genPack)
BigWar.prototype.genSetup=function(list){ this.gens=[]; this.genK={}; if(!list||(this.cfg&&(this.cfg.p2p||this.cfg.tut))) return;
  for(const g of list){ const H=typeof BW_HERO!=='undefined'&&BW_HERO[g.id], D=H&&BW_GEN_BY[H.skill]; if(!D||this.gens.length>=2||this.gens.some(x=>x.id===g.id)) continue;
    const lv=Math.max(1,Math.min(5,g.lv|0)); this.gens.push({id:g.id,skill:H.skill,name:H.name,lv}); this.genK[H.skill]= H.skill==='guide'? Math.max(this.genK.guide||0,D.val(lv)) : (this.genK[H.skill]||0)+D.val(lv); }   /* hai tướng cùng tài năng: cộng dồn (Dẫn đường lấy cấp cao hơn) */
  const K=this.genK; if(K.ranger){ this.visR=Math.round(this.visR*(1+K.ranger)); this._visT=0; if(this._updateVision) this._updateVision(); }
  if(K.recruiter) this.L.grow*=1+K.recruiter;
  if(K.treasurer) this._coinK=(this._coinK||1)*(1+K.treasurer);
  if(this.gens.length){ const c=this.nodes.find(n=>n.owner===this.localFid&&n.camp)||this.nodes[0]; this.note('🎖️ '+this.gens.map(x=>BW_GEN_BY[x.skill].icon+' '+x.name+' (Lv '+x.lv+')').join(' · ')+(this.gens.length>1? ' ride' : ' rides')+' with you',c.x,c.y,'🎖️'); } };
BigWar.prototype.gen=function(id){ return this.genK? this.genK[id]||0 : 0; };
