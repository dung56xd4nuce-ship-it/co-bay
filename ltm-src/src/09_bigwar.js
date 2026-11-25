// (5.1) khoảng cách 2 điểm: Math.hypot của trình duyệt chậm và mỗi lần gọi lại xả một ít rác bộ nhớ; hàm này được gọi hàng nghìn lần mỗi giây
const hyp=(x,y)=>Math.sqrt(x*x+y*y);
// có phần tử nào đã xong (done) không? — để chỉ lọc mảng khi thật sự có thứ cần bỏ (không tạo mảng mới mỗi khung hình)
const bwAnyDone=(arr)=>{ for(let i=0;i<arr.length;i++) if(arr[i].done) return true; return false; };
const BW_SCOUT_MV={forest:0.85,mountain:0.7,river:0.6};
const BW_COUNTER={ archer:{spear:1.35,saber:1.2}, spear:{cavalry:1.45}, cavalry:{archer:1.35,crossbow:1.35,medic:1.3},
  saber:{shield:1.45}, crossbow:{swordsman:1.3,cavalry:1.25}, assassin:{archer:1.3,crossbow:1.3,medic:1.4},
  shield:{}, swordsman:{assassin:1.3}, medic:{}, scout:{} };
// ===== vùng an toàn của màn hình (tai thỏ / thanh trạng thái / thanh điều hướng), tính bằng px =====
const SAFE={t:0,l:0,r:0,b:0,at:-1e9};
function readSafe(){ const now=(typeof performance!=='undefined')? performance.now() : 0; if(now-SAFE.at<400) return SAFE; SAFE.at=now;
  try{ let p=document.getElementById('safeProbe');
    if(!p){ p=document.createElement('div'); p.id='safeProbe'; p.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)'; document.body.appendChild(p); }
    const cs=getComputedStyle(p); SAFE.t=parseFloat(cs.paddingTop)||0; SAFE.r=parseFloat(cs.paddingRight)||0; SAFE.b=parseFloat(cs.paddingBottom)||0; SAFE.l=parseFloat(cs.paddingLeft)||0; }catch(e){}
  return SAFE; }
// bẻ dòng theo bề rộng (tối đa maxLines dòng; còn chữ thì dòng cuối kết bằng …)
function bwWrap(c,text,maxW,maxLines){ const words=String(text).split(' '), lines=[]; let cur='';
  for(const w of words){ const t=cur? cur+' '+w : w; if(!cur||c.measureText(t).width<=maxW) cur=t; else { lines.push(cur); cur=w; } }
  if(cur) lines.push(cur);
  const cut=(s)=>{ let a=[...s]; while(a.length>1&&c.measureText(a.join('')+'…').width>maxW) a.pop(); return a.join('').replace(/\s+$/,'')+'…'; };
  if(lines.length>maxLines){ const last=lines.slice(maxLines-1).join(' '); lines.length=maxLines; lines[maxLines-1]=cut(last); }
  for(let i=0;i<lines.length;i++) if(c.measureText(lines[i]).width>maxW) lines[i]=cut(lines[i]);
  return lines; }
// đặt cỡ chữ lớn nhất (f0→fMin) để một dòng vừa bề rộng maxW
function bwFit(c,text,maxW,weight,f0,fMin){ let f=f0; for(;f>fMin;f--){ c.font=`${weight} ${f}px "Baloo 2",system-ui`; if(c.measureText(text).width<=maxW) return f; } c.font=`${weight} ${fMin}px "Baloo 2",system-ui`; return fMin; }
// ============ 🔥 ĐẠI CHIẾN LẤN ĐẤT — chế độ node quân số ============
// Chạm đạo quân của mình → chạm đích. Nuốt trại trung lập là cộng quân.
// Đánh địch giải bằng quân số × hệ số khắc chế (luật Lanchester cho cảm giác "đánh số").
const BW = {
  W: 6600, H: 1520,                 // bản đồ LỚN ~4 màn hình ngang, 1.4 màn dọc (bản phát hành)
  cls(t){ return (t==='archer'||t==='crossbow')?'rng' : t==='cavalry'?'cav' : t==='shield'?'sh' : 'inf'; },
  // khắc chế THEO ĐỊA HÌNH nơi giao chiến (ter = địa hình node bị đánh)
  terMul:{
    plain:   { cav:{inf:1.5,rng:1.35}, sh:{cav:1.4,rng:1.3}, rng:{inf:1.25}, inf:{cav:0.75} },
    desert:  { cav:{inf:1.3,rng:1.3,sh:1.2}, sh:{inf:0.82,rng:0.82,cav:0.82,sh:0.82}, rng:{inf:1.15} },
    forest:  { inf:{cav:1.5,rng:1.4}, cav:{inf:0.72,rng:0.72,sh:0.72,cav:0.72}, rng:{inf:0.85,cav:0.85,sh:0.85,rng:0.85} },
    mountain:{ inf:{cav:1.6,rng:1.3}, cav:{inf:0.6,rng:0.6,sh:0.6,cav:0.6}, sh:{inf:0.85,rng:0.85,cav:0.85,sh:0.85} },
    valley:  { inf:{rng:1.25,cav:1.25} },
    river:   {},
  },
  terDef:{ valley:1.22, river:1.35, mountain:1.12, forest:1.08 }, // lợi thế bên trấn giữ theo địa hình
  structDef:{ village:1.25, fort:1.5, citadel:1.8 },               // công sự: làng trấn / thành lũy / thành trì
  structName:{ village:'Village', fort:'Fort', citadel:'Citadel' },
  structIcon:{ village:'🏘️', fort:'🏯', citadel:'🏰' },
  ambushFit:{ forest:{inf:3.0,rng:2.0,sh:1.25,cav:1.0}, valley:{cav:3.0,rng:2.25,inf:2.0,sh:1.25}, river:{rng:3.0,inf:2.0,cav:1.5,sh:1.25} },
  terName:{ plain:'Plains', forest:'Forest', mountain:'Mountain', valley:'Valley', desert:'Desert', river:'River' },
  terIcon:{ plain:'🌾', forest:'🌲', mountain:'⛰️', valley:'🏞️', desert:'🏜️', river:'🌊' },
  counter(a,b,ter){                 // hệ số sát thương binh chủng a đánh b (tại địa hình ter)
    const M=BW_COUNTER;   /* bảng khắc chế nằm ngoài hàm: không dựng lại mỗi lần gọi */
    let k=(M[a]&&M[a][b])||1;
    if((a==='archer'||a==='crossbow') && b==='shield') k*=0.6; // khiên chắn tên
    const T=this.terMul[ter||'plain']; if(T){ const r=T[this.cls(a)]; if(r&&r[this.cls(b)]) k*=r[this.cls(b)]; }
    return k;
  },
  speed: 150, aiBase: 16, range: 660, defBonus: 1.12, ecoEvery: 5,
  food:{ start:100, max:100, drainBase:2, drainPer:400, campHalf:true, starve:0.04, disband:20, siphonR:220, lootKeep:0.8 },
  facPal(o){ if(o===0) return FACTIONS[0]; if(o===2) return {color:'#9aa3ad',light:'#d9d4c7'};
    if(BW.civPal&&BW.civPal[o]) return BW.civPal[o];   // màu riêng của từng nền văn minh
    if(o===1) return FACTIONS[1];
    const h=(o*47+10)%360; return {color:`hsl(${h} 72% 52%)`, light:`hsl(${h} 80% 78%)`}; },
};
function bwResolve(ta,ca,tb,cb,def,ter){ // trả [cònA, cònB]; def=1.12 khi B đang trấn giữ node
  const ka=BW.counter(ta,tb,ter), kb=BW.counter(tb,ta,ter)*(def||1);
  const ea=ca*ka, eb=cb*kb;
  if(ea===eb) return [0, Math.max(1,Math.round(cb*0.08))];
  if(ea>eb) return [Math.max(1,Math.round(ca*Math.sqrt(1-(eb/ea)*(eb/ea)))), 0];
  return [0, Math.max(1,Math.round(cb*Math.sqrt(1-(ea/eb)*(ea/eb))))];
}
// (5.3) 10 KIỂU ĐỊA HÌNH — mỗi kiểu đổi hẳn màu đất, mật độ núi/rừng/sa mạc và dòng sông; mỗi ải 1v1 đánh trên một kiểu riêng (3 bản đồ/ải)
const BW_BIOMES={
  plain:  {icon:'🌾',name:'Grassland'},
  rivers: {icon:'🏞️',name:'River Land',  river:{amp:2.4,fq:0.0065}, valley:2, forest:1.2},
  forest: {icon:'🌲',name:'Deep Forest', tint:'#174a22',a:0.42, forest:2.3, mtn:0.5, desert:0},
  autumn: {icon:'🍁',name:'Autumn Hills',tint:'#e08a1e',a:0.55, forest:1.5, mtn:1.2, desert:0},
  marsh:  {icon:'🪷',name:'Marshland',   tint:'#3e6b5e',a:0.5, valley:4.5, forest:1.1, mtn:0.25, desert:0, river:{amp:2.0,fq:0.009}},
  desert: {icon:'🏜️',name:'Desert',      tint:'#ecd18e',a:0.62, forest:0.25, desert:3.2, mtn:0.9, valley:0.5, river:'none'},
  canyon: {icon:'🪨',name:'Red Canyon',  tint:'#c4572c',a:0.68, mtn:1.8, forest:0.2, desert:1.6, river:{amp:0.5,fq:0.004}},
  snow:   {icon:'❄️',name:'Snowfield',   tint:'#f3f7ff',a:0.66, mtn:1.7, forest:0.9, desert:0, river:{amp:0.7,fq:0.003}},
  highland:{icon:'⛰️',name:'Highlands',  tint:'#cfc77c',a:0.52,  mtn:1.5, valley:3, forest:0.7, desert:0.5, river:{amp:1.6,fq:0.005}},
  ash:    {icon:'🌋',name:'Ashlands',    tint:'#3a3033',a:0.68,  mtn:1.6, forest:0.3, desert:1.2, valley:0.5, river:'none'},
};
const BW_MAPS={
  solo:[['Fields of Ambition',11,'plain',0],['Border Town',113,'plain',1],['Thunder Plains',191,'plain',2],
    ['Twin Rivers',23,'rivers',1],['Nine-Bend River',97,'rivers',0],['River Fork',179,'rivers',2],
    ['Sacred Forest',41,'forest',2],['Bamboo Garden',149,'forest',0],['Ancient Pines',167,'forest',1],
    ['Old Frontier Pass',151,'autumn',0],['Amber Woods',193,'autumn',1],['Windy Valley',67,'autumn',2],
    ['Reed Marsh',131,'marsh',1],['Silt Flats',163,'marsh',2],['Lotus Delta',197,'marsh',0],
    ['Golden Sands',53,'desert',0],['Sunset Dunes',199,'desert',2],['Oasis Road',211,'desert',1],
    ['Red Canyon',127,'canyon',2],['Wasteland',101,'canyon',0],['Stone Plateau',139,'canyon',1],
    ['Snow Mountain Pass',37,'snow',1],['Cloud Pass',83,'snow',2],['Northern Wastes',173,'snow',0],
    ['Jade Highlands',223,'highland',0],['Dragon Spine Ridge',227,'highland',2],['Old Ferry Crossing',71,'highland',1],
    ['Ember Wastes',229,'ash',2],['Black Sand Coast',233,'ash',1],['Throne of Cinders',239,'ash',0]],
  royale:[['Warlords Clash',211,'plain'],['Vassals of Chaos',223,'autumn'],['Eight Trigrams Maze',227,'forest'],['Ten Thousand Beacons',229,'highland'],['Realm Split Five Ways',233,'rivers'],
    ['Eighteen Warlords',239,'plain'],['Rivers and Banners',241,'rivers'],['Hundred Towns Rising',251,'autumn'],['Great Desert Storm',257,'desert'],['Picturesque Realm',263,'highland'],
    ['Heroes of Four Corners',269,'snow'],['Reed Banner Rising',271,'marsh'],['Nine Provinces Ablaze',277,'ash'],['Hoofbeats on the Frontier',281,'canyon'],['Oath by the Great River',283,'rivers'],
    ['War Drums Rolling',293,'canyon'],['Rain of Arrows',307,'forest'],['West Citadel Burning',311,'ash'],['Call to Arms',313,'snow'],['Dragon vs Tiger',317,'marsh']],
};
const BW_LEVELS=[
  { name:'Fields of ambition', seed:11, mid:6,  en:7,  enMin:280, enMax:1500, camp:1400, myN:3, myC:430, ai:7.5, aiPow:0.85, farms:4, trains:2, wave:75, grow:26, enGrow:16 },
  { name:'Pasture Wars', seed:23, mid:8,  en:9,  enMin:380, enMax:2300, camp:1800, myN:3, myC:450, ai:6.5, aiPow:0.95, farms:5, trains:3, wave:65, grow:28, enGrow:22 },
  { name:'Warrior Forge', seed:37, mid:9,  en:11, enMin:520, enMax:3300, camp:2600, myN:4, myC:460, ai:5.5, aiPow:1.1,  farms:6, trains:3, wave:58, grow:30, enGrow:28 },
  { name:'Cavalry Breach',  seed:49, mid:10, en:12, enMin:720, enMax:4300, camp:3400, myN:4, myC:480, ai:5,   aiPow:1.2, farms:7, trains:4, wave:52, grow:36, enGrow:30 },
  { name:'King of Chaos', seed:61, mid:11, en:14, enMin:950, enMax:5600, camp:4400, myN:4, myC:500, ai:4.2, aiPow:1.38, farms:7, trains:4, wave:44, grow:38, enGrow:36 },
  { name:'Realm in Turmoil',  seed:73, mid:12, en:15, enMin:1300, enMax:6800, camp:5200, myN:4, myC:520, ai:3.8, aiPow:1.45, farms:8, trains:4, wave:40, grow:40, enGrow:40 },
  { name:'Red Flag Ambush',    seed:83, mid:13, en:16, enMin:1600, enMax:8000, camp:6000, myN:4, myC:540, ai:3.4, aiPow:1.52, farms:8, trains:5, wave:36, grow:42, enGrow:44 },
  { name:'Hundred Battles, Hundred Wins', seed:97, mid:14, en:17, enMin:1900, enMax:9200, camp:6800, myN:5, myC:560, ai:3.0, aiPow:1.6, farms:9, trains:5, wave:33, grow:44, enGrow:48 },
  { name:'Han Tidal Wave',  seed:101, mid:15, en:18, enMin:2200, enMax:10500, camp:7600, myN:5, myC:580, ai:2.6, aiPow:1.68, farms:9, trains:6, wave:30, grow:46, enGrow:52 },
  { name:'Sun Tzu the War Sage',  seed:113, mid:16, en:20, enMin:2500, enMax:12000, camp:8400, myN:5, myC:600, ai:2.2, aiPow:1.8, farms:10, trains:6, wave:26, grow:48, enGrow:56 },
];
// Độ khó AI: 0 = đánh thẳng (màn 1) · 1 = biết MAI PHỤC (màn 2–5) · 2 = mai phục + gom quân đủ mạnh mới đánh (màn 6–9) · 3 = bậc thầy: gom lực lượng lớn, mai phục, chỉ đánh khi chắc thắng (màn 10)
const BW_AI_TIER=(lv,royale)=>{ if(royale) return 2; const l=typeof lv==='number'?lv:1; return l>=10?3: l>=6?2: l>=2?1:0; };

const BW_TYPES=['archer','spear','cavalry','shield','saber','crossbow','swordsman','assassin'];

class BigWar{
  constructor(lv,cfg){
    this.cfg=cfg||{}; this.localFid=0;
    // Quần Hùng: bản đồ rộng hơn hẳn để chứa 30-40 nước
    if(this.cfg.royale){ BW.W=20000; BW.H=6000; } else { BW.W=6600; BW.H=1520; }
    this.big=!!this.cfg.royale; // bản đồ lớn: vẽ địa hình theo ô, camera cuộn 2 chiều
    this.lv=lv; const Lbase=Object.assign({},BW_LEVELS[Math.min(lv,BW_LEVELS.length)-1],this.cfg.L||{});
    Lbase.mid=Math.round((Lbase.mid||6)*1.45)+2; Lbase.farms=(Lbase.farms||4)+1; Lbase.en=Math.round((Lbase.en||7)*1.2);
    const L=this.L=Lbase;
    const D=this.D=BW.brain(lv,!!this.cfg.royale,this.cfg.diff); if(!this.cfg.royale&&!this.cfg.p2p&&!this.cfg.classic){ L.enMin=Math.round(L.enMin*D.force); L.enMax=Math.round(L.enMax*D.force); }
    const mapList=BW_MAPS[this.cfg.royale?'royale':'solo'];
    const soloCamp=!this.cfg.royale&&!this.cfg.p2p&&typeof lv==='number';
    const mIdx=this.cfg.classic? 0 : (this.cfg.map!=null)? (this.cfg.map%mapList.length) : soloCamp? ((Math.min(10,Math.max(1,lv))-1)*3+((Math.random()*3)|0)) : (Math.random()*mapList.length)|0;   /* 1v1: mỗi ải có 3 bản đồ riêng cùng một kiểu địa hình */
    this.cfg.map=mIdx; this.mapName=this.cfg.classic?'Classic':mapList[mIdx][0]; this.mapSeed=this.cfg.classic?(L.seed||7):mapList[mIdx][1];
    if(this.cfg.map52!=null&&!this.cfg.royale){ this.mapSeed=[11,23,37,41,53,67,71,83,97,101,113,127,131,139,149,151,163,167,173,179][this.cfg.map52%20]; this.mapName='Map '+this.cfg.map52; }   /* bài thử: dựng lại đúng bản đồ của bản 5.2 */
    { const M=mapList[mIdx], old=this.cfg.royale&&!this.cfg.bio; this.biomeId=(this.cfg.classic||old||(this.cfg.map52!=null&&!this.cfg.royale))? 'plain' : (M[2]||'plain'); this.biome=BW_BIOMES[this.biomeId]; }   /* ván Quần Hùng lưu từ bản cũ giữ nguyên địa hình cũ */
    this.rnd=mulberry32((this.cfg.seed||(L.seed*31+this.mapSeed))*7919+(typeof lv==='number'?lv:1));
    this.assignCivs(); // 🏛️ mỗi phe một nền văn minh (src/09c_civ.js)
    this.nodes=[]; this.armies=[]; this.fx=[]; this.texts=[]; this.rings=[];
    this.time=0; this.over=false; this.result=null; this.sel=null; this.shake=0; this.camX=0; this.nextAI=L.ai*0.9; this.aiWave=0;
    this.stats={eat:0,win:0,lose:0,peak:0}; this.regenT=0; this.reinT=0; this.enFed=true;
    this.battles=[]; this.notes=[]; this.menu=null; this.zoom=1; this.camY=0; this.zoomTgt=1; this.focusB=null;
    this.hudSeen=performance.now(); this.hudA=1; // HUD phía trên: mờ khi rảnh, rõ khi chạm
    this.autoMenu= this.cfg.autoMenu===false? false : true; // headless mặc định tự chọn hành động; UI thật tắt để hiện menu
    this.fed={}; this.aiScouts=[]; this.nextAiScout=20; this.allies=new Set(); this.convoys=[];
    this.gear=[]; this.tempVis=[]; this.lossLog=[]; this.up=(this.cfg&&!this.cfg.p2p&&this.cfg.up)||null; this.coinT=BW.coinsFor? BW.coinsFor.every : 600;   // 🎒 quân nhu · ⚒️ lò rèn · 🪙 mốc thưởng xu (src/09e_gear.js)
    const R=this.rnd, W=BW.W, H=BW.H;
    const node=(x,y,owner,type,count,camp)=>{ const n={id:this.nodes.length,x,y,owner,type,count:Math.round(count),camp:!!camp,wob:R()*7,food:0}; this.nodes.push(n); return n; };
    this.mkNode=node;
    // trại hai đầu
    // quân của mỗi nước: phần lớn là binh chủng sở trường + vài loại bổ trợ trong biên chế của nền văn minh đó
    const tOf=(fid)=> R()<0.62? this.civType(fid,(R()*4)|0) : BW_TYPES[(R()*BW_TYPES.length)|0];
    { const c0=node(170, H*0.5, 0, this.civType(0), 0, true); c0.home=0; c0.capOf=0; }
    { const c1=node(W-170, H*0.5, 1, this.civType(1), L.camp*(this.cfg.p2p||this.cfg.classic||this.cfg.royale? 1 : BW.CAMP_F[Math.min(9,Math.max(0,lv-1))]), true); c1.home=1; c1.capOf=1; }
    // đạo quân của ta quanh trại
    for(let i=0;i<L.myN;i++) node(320+((i%2)*130), H*(0.26+0.48*(L.myN<2?0.5:i/(L.myN-1))), 0, this.civType(0,i), L.myC*(0.85+R()*0.3));
    // vùng giữa: trung lập để nuốt (to dần về bên phải)
    for(let i=0;i<L.mid;i++){ const t=i/(L.mid-1);
      const x=W*0.22+W*0.36*t+(R()-0.5)*110, y=H*(0.24+0.6*((i%3)/2))+(R()-0.5)*70;
      node(x,y,2, BW_TYPES[(R()*BW_TYPES.length)|0], (160+R()*180)*(1+t*2.0)); }
    // 🐂 vùng chăn nuôi & ⚒️ vùng luyện binh — nguồn quân của cả hai phe
    const eco=(x,y,kind,guard,trainType)=>{ const n=node(x,y,2, trainType|| BW_TYPES[(R()*BW_TYPES.length)|0], guard); n.eco=kind; if(kind==='train') n.trainType=trainType; return n; };
    for(let i=0;i<L.farms;i++){ const t=i/(Math.max(1,L.farms-1));
      const n=eco(W*0.16+W*0.56*t+(R()-0.5)*120, H*(0.2+0.62*((i%2)? 0.9-t*0.3 : 0.1+t*0.3))+(R()-0.5)*60, 'farm', 140+t*520*(0.8+R()*0.4));
      n.cap=Math.round(800+t*700+this.lv*120); }
    for(let i=0;i<L.trains;i++){ const t=i/Math.max(1,L.trains-1);
      const tt=['spear','archer','cavalry','saber','shield','crossbow'][(R()*6)|0];
      const n=eco(W*0.2+W*0.5*t+(R()-0.5)*130, H*(0.5+(i%2?0.26:-0.26))+(R()-0.5)*60, 'train', 180+t*420, tt); n.cap=650; }
    if(this.cfg.p2p){ // P2P: hai bên cân xứng
      this.nodes[0].count=L.camp;
      for(let i=0;i<L.myN;i++) node(W-320-((i%2)*130), H*(0.26+0.48*(L.myN<2?0.5:i/(L.myN-1))), 1, this.civType(1,i), L.myC*(0.85+R()*0.3));
    }
    // 🌾 KHO LƯƠNG: 2-3 kho giữa bản đồ — nguồn tiếp tế chiến dịch
    const gN=3+(typeof this.lv==='number'&&this.lv>2?1:0);
    for(let i=0;i<gN;i++){ const t=(i+0.5)/gN;
      const g2=eco(W*0.2+W*0.6*t+(R()-0.5)*140, H*(i%2?0.78:0.22)+(R()-0.5)*60, 'granary', 220+t*260);
      g2.food=500; g2.cap=700; }
    // kinh tế khởi điểm của địch: 1 mục trường + 1 lò luyện phía đông — địch cũng nuôi quân!
    { const f=eco(W*0.78+(R()-0.5)*80, H*0.3+(R()-0.5)*60,'farm', 300); f.owner=1; f.type=BW_TYPES[(R()*BW_TYPES.length)|0]; f.cap=900+this.lv*150;
      const tr=eco(W*0.8+(R()-0.5)*80, H*0.72+(R()-0.5)*60,'train', 260, ['spear','cavalry','crossbow','saber'][(R()*4)|0]); tr.owner=1; tr.type=tr.trainType; }
    // quân địch (to dần về phía trại)
    for(let i=0;i<L.en;i++){ const t=i/(L.en-1);
      const x=W*0.52+W*0.4*t+(R()-0.5)*90, y=H*(0.23+0.62*((i*2.3)%1))+(R()-0.5)*50;
      node(x,y,1, tOf(1), L.enMin+(L.enMax-L.enMin)*Math.pow(t,1.4)*(0.8+R()*0.4)); }
    // tiền đồn trung lập sát trại địch — bảo đảm luôn có bàn đạp công trại (trong tầm 660)
    node(W-620, H*0.3, 2, BW_TYPES[(R()*BW_TYPES.length)|0], 380+R()*280);
    node(W-620, H*0.72, 2, BW_TYPES[(R()*BW_TYPES.length)|0], 380+R()*280);
    // công sự: 1 thành trì giữa bản đồ, 2 thành lũy, vài làng trấn; 2 đại bản doanh là thành trì
    {
      const wild=this.nodes.filter(n=>!n.camp&&!n.eco);
      const byC=[...wild].sort((a,b)=>Math.abs(a.x-W/2)-Math.abs(b.x-W/2));
      if(byC[0]) byC[0].struct='citadel';
      for(const fx of [0.3,0.7]){ let b=null,bd=1e9; for(const n of wild){ if(n.struct) continue; const d=Math.abs(n.x-W*fx); if(d<bd){bd=d;b=n;} } if(b) b.struct='fort'; }
      let vC=0; for(const n of wild){ if(n.struct||vC>=4) continue; if(R()<0.35){ n.struct='village'; vC++; } }
      this.nodes[0].struct='citadel'; this.nodes[1].struct='citadel';
    }
    // tách node chồng nhau
    for(let k=0;k<60;k++){ let moved=false;
      for(const a of this.nodes) for(const b of this.nodes){ if(a===b) continue; const dx=b.x-a.x, dy=b.y-a.y; if(dx>=170||dx<=-170||dy>=170||dy<=-170) continue; const d=hyp(dx,dy)||1;   /* lọc nhanh: bản Quần Hùng có ~400 cứ điểm, khỏi tính căn 16 triệu lần */
        if(d<170){ const push=(170-d)/2; if(!a.camp){ a.x-=dx/d*push; a.y-=dy/d*push; } if(!b.camp){ b.x+=dx/d*push; b.y+=dy/d*push; } moved=true; } }
      if(!moved) break; }
    for(const n of this.nodes){ if(!n.camp){ n.x=Math.max(130,Math.min(W-130,n.x)); n.y=Math.max(205,Math.min(H-95,n.y)); } }
    // ===== QUẦN HÙNG: 30-40 chư hầu — mỗi nước 1 trại, rải khắp bản đồ =====
    if(this.cfg.royale){
      const NR=this.cfg.royale; // số nước AI
      // trại địch 1v1 thành nước số 1; thêm các nước 3..NR+2 (chừa 2 cho trung lập)
      const cols=Math.ceil(Math.sqrt(NR*2.2)), rows=Math.ceil(NR/cols);
      let placed=0;
      for(let i=0;i<NR-1&&placed<NR-1;i++){
        const fid=3+i;
        const gx=(placed%cols+0.5)/cols, gy=((placed/cols|0)+0.5)/rows; placed++;
        let x=W*(0.1+0.85*gx)+(R()-0.5)*120, y=H*(0.2+0.68*gy)+(R()-0.5)*80;
        if(x<650&&Math.abs(y-H*0.5)<260){ x+=720; } // chừa đất khởi nghiệp cho người chơi
        const c2=node(x,y,fid,this.civType(fid), Math.round(this.L.camp*(0.18+R()*0.3)), true);
        c2.struct='citadel'; c2.home=fid; c2.capOf=fid;
        // mỗi nước 1-2 đạo quân vệ binh
        const nG=1+(R()<0.5?1:0);
        for(let k2=0;k2<nG;k2++) node(x+(R()-0.5)*260, y+(R()-0.5)*200, fid, tOf(fid), Math.round(this.L.enMin*(0.4+R()*0.7)));
      }
      this.royale=true;
      // 🗺️ PHỦ KÍN BẢN ĐỒ LỚN: làng/trang trại/kho lương/lò luyện trung lập, dày như bản 1v1
      { const target=460, cell=Math.sqrt(W*H/Math.max(60,target-this.nodes.length));
        const A0=this.nodes[0];
        for(let gx=cell*0.5; gx<W; gx+=cell) for(let gy=cell*0.5+120; gy<H-80; gy+=cell){
          const x=Math.max(140,Math.min(W-140,gx+(R()-0.5)*cell*0.7)), y=Math.max(215,Math.min(H-100,gy+(R()-0.5)*cell*0.7));
          let tooClose=false; for(const m of this.nodes){ if(Math.abs(m.x-x)<240&&Math.abs(m.y-y)<240&&hyp(m.x-x,m.y-y)<240){ tooClose=true; break; } }
          if(tooClose) continue;
          const far=Math.min(1,hyp(x-A0.x,y-A0.y)/9000), k=R();
          if(k<0.13){ const f=eco(x,y,'farm',150+far*600*(0.8+R()*0.4)); f.cap=Math.round(800+far*900); }
          else if(k<0.19){ const g=eco(x,y,'granary',200+far*400); g.food=500; g.cap=700; }
          else if(k<0.25){ const tt=['spear','archer','cavalry','saber','shield','crossbow'][(R()*6)|0]; const t2=eco(x,y,'train',180+far*450,tt); t2.cap=650; }
          else { const n=node(x,y,2,BW_TYPES[(R()*BW_TYPES.length)|0],(160+R()*200)*(1+far*2.4)); const q=R(); if(q<0.05) n.struct='fort'; else if(q<0.2) n.struct='village'; else if(q<0.215) n.struct='citadel'; } } }
      // mỗi nước khởi nghiệp với 2 vùng đất gần trại (1 nông trại nếu có)
      for(const c3 of this.nodes.filter(n=>n.camp&&n.owner>=3)){
        const near=this.nodes.filter(n=>n.owner===2&&!n.camp).sort((a,b)=>hyp(a.x-c3.x,a.y-c3.y)-hyp(b.x-c3.x,b.y-c3.y)).slice(0,2);
        for(const n of near){ n.owner=c3.owner; n.count=Math.max(n.count,Math.round(this.L.enMin*0.5)); } }
      // ngoại giao ban đầu: một số nước đã kết giao với nhau
      const nf=[...new Set(this.nodes.filter(n=>n.camp&&n.owner>=3).map(n=>n.owner))];
      for(const f of nf){ if(R()<0.12){ const g=nf[(R()*nf.length)|0]; if(g!==f) this.setAlly(f,g,true); } }
    }
    // ===== BIẾN HÌNH: mỗi bản đồ lật/xô khác nhau -> vị trí trại thay đổi theo bản đồ =====
    if(!this.cfg.classic){
      const mr=mulberry32(this.mapSeed*131);
      const mirH=mr()<0.5, mirV=mr()<0.5;
      const dys=[-0.26,0,0.26]; const dyA=dys[(mr()*3)|0]*H, dyB=dys[(mr()*3)|0]*H;
      for(const n of this.nodes){
        const t=n.x/W; n.y+=dyA+(dyB-dyA)*t;
        if(mirH) n.x=W-n.x; if(mirV) n.y=H-n.y+160;
        n.x=Math.max(130,Math.min(W-130,n.x));
        n.y=Math.max(n.camp?150:205,Math.min(H-(n.camp?60:95),n.y));
      }
    }
    // trục chiến dịch: A = trại ta, B = trại địch chính (AI đánh giá theo trục này, không theo đông-tây)
    this.axis={}; { const A=this.nodes[0], B=this.nodes[1];
      const ux=B.x-A.x, uy=B.y-A.y, len=hyp(ux,uy)||1;
      this.axis={ax:A.x,ay:A.y,ux:ux/len,uy:uy/len,len}; }
    this.pA=(m)=>Math.max(0,Math.min(1,((m.x-this.axis.ax)*this.axis.ux+(m.y-this.axis.ay)*this.axis.uy)/this.axis.len));
    // ===== ĐỊA HÌNH (src/09a_terrain.js): đồng bằng nền + dãy núi/rừng/sa mạc/thung lũng + 1 con sông =====
    this.genTerrain(R,W,H);
    for(const n of this.nodes){ if(!n.camp&&this.terAtRaw(n.x,n.y)==='river'){ n.x+= (n.x<this.riverX(n.y)? -110:110); } n.ter=this.terAtRaw(n.x,n.y); }
    if(this.royale){ const N=this.nodes; for(let k=0;k<50;k++){ let moved=false;
      // lưới băm 400px: mỗi cứ điểm chỉ xét các cứ điểm lân cận, vẫn theo đúng thứ tự cũ → cùng kết quả, nhanh hơn chục lần (≈400 cứ điểm × 50 vòng)
      const HG=new Map(); for(let i=0;i<N.length;i++){ const key=Math.floor(N[i].x/400)*1000+Math.floor(N[i].y/400); let g=HG.get(key); if(!g) HG.set(key,g=[]); g.push(i); }
      for(let i=0;i<N.length;i++){ const a=N[i], gx=Math.floor(a.x/400), gy=Math.floor(a.y/400), cand=[];
        for(let ix=-1;ix<=1;ix++) for(let iy=-1;iy<=1;iy++){ const g=HG.get((gx+ix)*1000+gy+iy); if(g) for(const j of g) cand.push(j); }
        cand.sort((p,q)=>p-q);
        for(const j of cand){ if(j===i) continue; const b=N[j], dx=b.x-a.x, dy=b.y-a.y; if(dx>=150||dx<=-150||dy>=150||dy<=-150) continue; const d=hyp(dx,dy)||1;
          if(d<150){ const push=(150-d)/2; if(!(a.camp&&a.owner<3)){ a.x-=dx/d*push; a.y-=dy/d*push; } if(!(b.camp&&b.owner<3)){ b.x+=dx/d*push; b.y+=dy/d*push; } moved=true; } } }
      if(!moved) break; }
      for(const n of this.nodes){ if(!n.camp||n.owner>=3){ n.x=Math.max(130,Math.min(W-130,n.x)); n.y=Math.max(205,Math.min(H-95,n.y)); }
        if(this.terAtRaw(n.x,n.y)==='river'&&!n.camp) n.x+=(n.x<this.riverX(n.y)?-110:110);
        n.ter=this.terAtRaw(n.x,n.y); } }
    for(const n of this.nodes){ if(n.id>1&&Math.abs(n.x-this.riverX(n.y))<120) n.x=this.riverX(n.y)+(n.x<this.riverX(n.y)? -125:125); } // không cứ điểm nào nằm giữa dòng sông
    this.separateNodes();   // (5.1) tách các cứ điểm nằm đè lên nhau
    this.genRoads(); // ĐƯỜNG CÁI nối mọi cứ điểm + lưới đi lại (sau khi vị trí đã chốt)
    for(const n of this.nodes) n.ter=this.terAtRaw(n.x,n.y);
    // ===== SƯƠNG MÙ & DO THÁM =====
    this.visR=600; this.scouts=[]; this.fxs=[]; // 15 ô x 40px
    for(const n of this.nodes) if(n.owner!==0) n.known=null;
    this._updateVision();
    if(D.me!==1) for(const n of this.nodes) if(n.owner===0) n.count=Math.round(n.count*D.me);   /* Quần Hùng Dễ/Khó: quân khởi điểm của ta nhiều/ít hơn */
    { const me=this.civOf(0), en=this.civOf(1); this.note(this.royale? `${me.icon} ${me.name} rises — ${this.cfg.royale} rival nations on the map “${this.mapName}”` : `${me.icon} ${me.name} vs ${en.icon} ${en.name} — ${this.mapName}`,this.nodes[0].x,this.nodes[0].y,me.icon); }
  }
  // (5.1) TÁCH CỨ ĐIỂM CHỒNG NHAU: cứ điểm bị dồn ra mép bản đồ (hoặc bị đẩy khỏi sông) có khi nằm đè lên nhau — có cặp trùng hẳn một chỗ,
  // người chơi chỉ thấy và chạm được một. Đẩy nhẹ từng cặp cho cách nhau tối thiểu 140px; trại (đại bản doanh) đứng yên. Gọi lúc dựng bản đồ và lúc mở ván lưu cũ.
  separateNodes(){ const W=BW.W, H=BW.H, N=this.nodes, MIN=140, lock=(n)=>!!n.camp, fix=(n)=>{ if(lock(n)) return; n.x=Math.max(130,Math.min(W-130,n.x)); n.y=Math.max(205,Math.min(H-95,n.y)); if(Math.abs(n.x-this.riverX(n.y))<120) n.x=this.riverX(n.y)+(n.x<this.riverX(n.y)? -125:125); };
    let any=false;
    for(let k=0;k<120;k++){ let moved=false;
      for(let i=0;i<N.length;i++){ const a=N[i]; for(let j=i+1;j<N.length;j++){ const b=N[j]; let dx=b.x-a.x, dy=b.y-a.y; if(dx>=MIN||dx<=-MIN||dy>=MIN||dy<=-MIN) continue; let d=hyp(dx,dy); if(d>=MIN) continue;
          if(lock(a)&&lock(b)) continue; if(d<0.5){ const an=(i*2.399963+j*0.7)%6.283; dx=Math.cos(an); dy=Math.sin(an)*0.4; d=hyp(dx,dy); }   /* trùng hẳn nhau: tách theo một hướng cố định (chủ yếu theo chiều ngang) */
          const push=(MIN-d)+0.5, ka= lock(a)? 0 : lock(b)? 1 : 0.5, kb=1-ka; a.x-=dx/d*push*ka; a.y-=dy/d*push*ka; b.x+=dx/d*push*kb; b.y+=dy/d*push*kb; fix(a); fix(b); moved=true; any=true; } }
      if(!moved) break; }
    return any; }
  _updateVision(){
    const F=this.localFid;
    // VÙNG CHIẾM ĐÓNG: mọi cứ điểm của ta (kể cả đã rút hết quân) đều sáng; đường nối 2 cứ điểm của ta cũng sáng
    const vw=[], N0=this.nodes; for(let i=0;i<N0.length;i++){ const n=N0[i]; if(n.owner===F) vw.push({x:n.x,y:n.y,r:this.visR}); }
    for(let ri=0,RD=this.roads;ri<RD.length;ri++){ const r=RD[ri]; if(r.a==null) continue; const A=this.nodes[r.a], B=this.nodes[r.b]; if(!A||!B||A.owner!==F||B.owner!==F) continue;
      const k=Math.ceil(r.len/300); for(let i=1;i<k;i++){ const q=this.roadAt(r,i/k); vw.push({x:q[0],y:q[1],r:330}); } }   /* sáng dọc theo đường cong */
    for(let i=0,AR=this.armies;i<AR.length;i++){ const a=AR[i]; if(a.owner===F) vw.push({x:a.x,y:a.y,r:this.visR*0.8}); }
    for(const s2 of this.scouts) if((s2.fid??0)===F) vw.push({x:s2.x,y:s2.y,r:300});
    if(this.tempVis) for(const v of this.tempVis) if(v.t>0) vw.push({x:v.x,y:v.y,r:v.r});   /* 🧭 la bàn */
    this._viewers=vw;
    // lưới tầm nhìn 100px: tra cứu O(1) cho mọi đối tượng thay vì quét hàng trăm điểm sáng
    const G2=100, gw=Math.ceil(BW.W/G2), gh=Math.ceil(BW.H/G2);
    if(!this._visG||this._visG.length!==gw*gh){ this._visG=new Uint8Array(gw*gh); this._visGW=gw; this._visGH=gh; } else this._visG.fill(0);
    const VG=this._visG;
    for(const v of vw){ const r2=v.r*v.r, x0=Math.max(0,Math.floor((v.x-v.r)/G2)), x1=Math.min(gw-1,Math.floor((v.x+v.r)/G2)), y0=Math.max(0,Math.floor((v.y-v.r)/G2)), y1=Math.min(gh-1,Math.floor((v.y+v.r)/G2));
      for(let gy=y0;gy<=y1;gy++){ const cy=gy*G2+50-v.y, row=gy*gw; for(let gx=x0;gx<=x1;gx++){ const cx=gx*G2+50-v.x; if(cx*cx+cy*cy<r2) VG[row+gx]=1; } } }
    for(let i=0;i<N0.length;i++){ const n=N0[i]; if(n.owner===F) continue;
      if(n.scoutT!=null&&this.time-n.scoutT<30) n.known={count:n.count,type:n.type,t:this.time}; }
  }
  isFoe(a,b){ return a!==b && a!==2 && b!==2 && !this.allied(a,b); }
  // tra đồng minh bằng SỐ (bản sao của this.allies dạng 'a-b'): hàm này bị gọi hàng trăm nghìn lần mỗi giây ở Quần Hùng, ghép chuỗi mỗi lần là tốn và sinh rác
  allied(a,b){ const S=this.allies; if(!S.size) return false;
    if(this._alS!==S||this._alN!==S.size){ this._alS=S; this._alN=S.size; const M=this._alM=new Set(), T=this._alT||(this._alT=new Uint8Array(4096)); T.fill(0);
      for(const k of S){ const i=k.indexOf('-'), x=+k.slice(0,i), y=+k.slice(i+1); M.add(x<y? x*4096+y : y*4096+x); if(x>=0&&y>=0&&x<64&&y<64){ T[x*64+y]=1; T[y*64+x]=1; } } }
    if(a>=0&&b>=0&&a<64&&b<64) return this._alT[a*64+b]===1;   /* bảng 64×64: không gọi hàm, không sinh rác */
    return this._alM.has(a<b? a*4096+b : b*4096+a); }
  setAlly(a,b,on){ const k=a<b? a+'-'+b : b+'-'+a; if(on) this.allies.add(k); else this.allies.delete(k); this._alS=null; }
  natAtWar(f,g){ return this.battles.some(b=>!b.done&&((b.A.fid===f&&b.B.fid===g)||(b.A.fid===g&&b.B.fid===f))); }
  natPower(f){ return this.myPower(f); }
  visNow(n){ // "biết quân số": chỉ khi là quân ta hoặc ĐÃ DO THÁM trong 30 giây
    if(n.owner===this.localFid) return true;
    return n.scoutT!=null && this.time-n.scoutT<30;
  }
  visAt(x,y){ const VG=this._visG; if(VG){ const gx=Math.floor(x/100), gy=Math.floor(y/100); if(gx<0||gy<0||gx>=this._visGW||gy>=this._visGH) return false; return VG[gy*this._visGW+gx]===1; }
    const vw=this._viewers||[]; for(const v of vw){ const dx=x-v.x, dy=y-v.y; if(dx*dx+dy*dy<v.r*v.r) return true; } return false; }
  // (5.1) rung màn hình chỉ khi sự việc nằm TRONG khung nhìn: ở Quần Hùng lúc nào cũng có trận ở đâu đó, rung cả màn hình vì trận ngoài tầm mắt là vô nghĩa (và làm máy vẽ không lúc nào được nghỉ)
  shakeAt(x,y,v){ if(!this._inView||this._inView(x,y)) this.shake=Math.max(this.shake||0,v); }
  addFx(x,y,key,w,life){ this.fxs.push({x,y,key,w:w||120,t:0,life:life||0.55}); if(this.fxs.length>70) this.fxs.shift(); }
  battleFx(x,y,ter,big){
    this.addFx(x,y,big?'fx:clash2':'fx:clash1',big?170:130,0.5);
    this.addFx(x+20,y+18,'fx:smokebig',110,0.8);
    if(ter==='forest') this.addFx(x-18,y-24,'fx:leaves',130,0.8);
    if(ter==='river') this.addFx(x,y+10,'fx:splash',130,0.7);
  }
  defMul(n){ // tổng lợi thế bên trấn giữ: cơ bản × địa hình × công sự (bộ binh/cung thủ giữ thành +20%)
    let d=BW.defBonus*(BW.terDef[n.ter]||1);
    if(n.struct){ d*=BW.structDef[n.struct]||1; const c2=BW.cls(n.type); if(!n.camp&&n.type!=='general'&&(c2==='inf'||c2==='rng')) d*=1.2; } // (đại bản doanh không hưởng thêm — đã là thành trì)
    const cv=this.civOf(n.owner); if(cv&&cv.def) d*=cv.def;
    if(this.up) d*=this.upMul('armor',n.owner);   /* ⚒️ Lò rèn: Fortify */
    return d; }
  ambushMult(n){ // phục kích: x2 đến x10 tùy địa hình + binh chủng (nhân thêm khắc chế khi vào trận)
    const f=BW.ambushFit[n.ter]; if(!f) return 1;
    const cv=this.civOf(n.owner); return Math.max(2, Math.min(12, 2*(f[BW.cls(n.type)]||1)*(cv&&cv.amb? cv.amb : 1))); }
  canAmbush(n){ return n.owner===this.localFid && n.count>0 && !n.camp && !!BW.ambushFit[n.ter]; }
  terrLit(x,y,fid){ // VÙNG CHIẾM ĐÓNG của một phe (cứ điểm đang giữ) — không tính tầm mắt của đạo quân đang đi
    const r2=this.visR*this.visR; for(const n of this.nodes){ if(n.owner!==fid) continue; const dx=n.x-x, dy=n.y-y; if(dx*dx+dy*dy<r2) return true; } return false; }
  aiVis(x,y,fid){ fid=fid??1; // AI cũng chỉ thấy trong bán kính 15 ô quanh quân phe nó
    for(const n of this.nodes){ if(n.owner!==fid) continue; if(hyp(n.x-x,n.y-y)<this.visR) return true; } // vùng chiếm đóng luôn sáng (cả 2 phía)
    for(const a of this.armies){ if(a.owner!==fid||a.done) continue; if(hyp(a.x-x,a.y-y)<this.visR*0.8) return true; }
    return false; }
  aiSee(m,fid){ fid=fid??1; // AI nhìn mục tiêu: NGƯỜI CHƠI thì chịu sương mù; phe AI khác thì thấy thật
    if(m.owner!==this.localFid) return {type:m.type,count:m.count,blind:false};
    if(m.ambush) return {type:'spear',count:0,blind:true};
    const sk= m.scareT>0? BW.gear.scareMul : 1;   /* 👒 bù nhìn: máy tưởng cứ điểm này đông gấp 3 */
    if(this.aiVis(m.x,m.y,fid)) return {type:m.type,count:m.count*sk,blind:false};
    return {type:'spear',count:(220+(typeof this.lv==='number'?this.lv:1)*120)*sk,blind:true}; }
  _dblChk(bA,wx,wy){ // kích đúp 1 đạo -> chọn tất cả đạo đóng quân/mai phục gần đó
    const now=this.time, lt=this._lastTap;
    this._lastTap={t:now,x:wx,y:wy,a:bA};
    if(!lt||now-lt.t>0.75||hyp(wx-lt.x,wy-lt.y)>120) return;
    if(lt.a!==bA&&hyp(lt.a.x-bA.x,lt.a.y-bA.y)>140) return; // chạm 2 đạo sát nhau vẫn tính là đúp
    const grp=this.armies.filter(a=>a.owner===this.localFid&&!a.done&&!a.btl&&a.count>0&&(a.camped||a===bA||a===lt.a)&&hyp(a.x-bA.x,a.y-bA.y)<420);
    if(grp.length>1){ this.selG=grp; this.selA=bA;
      this.texts.push({x:bA.x,y:bA.y-86,s:'👥 Select whole group '+grp.length+' armies!',col:'#7dffcf',t:0,max:1.4,big:1}); audio.recruit(); }
  }
  startScout(n,fid){ fid=fid??this.localFid;
    if(this.scouts.filter(s2=>(s2.fid??0)===fid).length>=2){ this.texts.push({x:n.x,y:n.y-60,s:'Only 2 scouting parties at a time!',col:'#ff8a8a',t:0,max:1.2,big:1}); audio.block(); return; }
    let src=null,sd=1e9; for(const m of this.nodes){ if(m.owner!==fid||(m.count<=0&&!m.camp)) continue; const d=hyp(m.x-n.x,m.y-n.y); if(d<sd){sd=d;src=m;} }
    if(!src) return;
    this.scouts.push({x:src.x,y:src.y,to:n.id,trail:0,fid});
    this.texts.push({x:n.x,y:n.y-60,s:'🕵️ Scouting party dispatched...',col:'#ffe08a',t:0,max:1.4,big:1}); audio.order();
  }
  // SỨC NUÔI QUÂN của một phe: trại + nông trại + kho lương + lò luyện đang giữ
  supplyCap(f){ f=f??this.localFid; let farms=0,gran=0,trains=0,camp=false;
    const N=this.nodes; let held=0; for(let i=0;i<N.length;i++){ const n=N[i]; if(n.owner!==f) continue; held++; if(n.camp) camp=true; if(n.eco==='farm') farms++; else if(n.eco==='granary') gran++; else if(n.eco==='train') trains++; }
    let cap=(camp? this.L.camp*(this.royale?0.6:1.5) : 600) + farms*800 + gran*500 + trains*300;
    if(f!==this.localFid){ cap*=this.L.aiPow; if(BW_AI_TIER(this.lv,this.royale)===3) cap*=1.15; }
    { const cv=this.civOf(f); if(cv&&cv.cap) cap*=cv.cap; }
    // không thấp hơn 60% lực lượng lúc khai trận (tránh phe đông quân tự rã khi chưa đánh) — NHƯNG mức sàn này co lại theo phần đất còn giữ:
    // mất đất thì không còn nuôi nổi đại quân. (Trước v5.0 các đạo quân lớn của máy tự chết đói dọc đường nên không lộ; nay lương đã hợp lý thì
    // phe chỉ còn 2 cứ điểm mà vẫn ôm 90 000 quân sẽ thành thế bí không ai thắng nổi.)
    this.cap0=this.cap0||{}; if(this.cap0[f]==null) this.cap0[f]=this.myPower(f);
    this.n0=this.n0||{}; if(this.n0[f]==null) this.n0[f]=Math.max(1,held);
    return Math.round(Math.max(cap, this.cap0[f]*0.6*Math.pow(Math.min(1,held/this.n0[f]),1.5))); }
  myPower(f){ f=f??this.localFid; let s=0; const N=this.nodes, A=this.armies; for(let i=0;i<N.length;i++){ if(N[i].owner===f) s+=N[i].count; } for(let i=0;i<A.length;i++){ if(A[i].owner===f) s+=A[i].count; } return s; }
  // ---- lệnh
  send(from,to,opt){   /* opt (5.4): {type} chỉ binh chủng đó đi · {frac} đi một phần quân; không có opt = cả kho, mỗi binh chủng một đạo */
    if(from.count<=0||from===to) return false;
    const top=!this._sending; if(top) this._lastSent=[];
    const mix=this.mixOf(from), frac= opt&&opt.frac>0&&opt.frac<1? opt.frac : 1, want= opt&&opt.type&&mix[opt.type]>0? opt.type : null;
    if(!want){ const ts=this.mixList(from); if(ts.length>1){ this._sending=1; let main=null; try{ for(const q of ts){ const g=this.send(from,to,{type:q[0],frac}); if(g&&!main) main=g; } } finally { this._sending=0; } return main||false; } }
    const type= want||from.type, before=from.count, pool= want&&Object.keys(mix).length>1? before*mix[type] : before;
    const cnt= frac>=1? (pool>=before-0.5? before : Math.round(pool)) : Math.floor(pool*frac); if(!(cnt>=1)||(frac<1&&cnt<BW.sendMin)) return false;
    const a={owner:from.owner,type,count:cnt,x:from.x,y:from.y,from:from.id,to:-1,trail:0,food:BW.food.start};
    from.ambush=false;
    if(to&&to.id>=0&&this.nodes[to.id]===to){ a.to=to.id; }
    else if(to&&to.count!=null&&to.id==null){ a.hunt=to; }   // truy kích đạo quân
    else { a.tx=to.x; a.ty=to.y; }                            // tới điểm bất kỳ
    from.count= cnt>=before? 0 : before-cnt; this.mixTake(from,type,cnt,before); this.armies.push(a); this._lastSent.push(a);
    this.supplyPrep(a,from,to.x,to.y);                        // 🌾 đại quân phải CHUẨN BỊ LƯƠNG rồi mới xuất phát (src/09d_supply.js)
    return a;
  }
  tapScreen(sx,sy){ // nút 📣 > menu lệnh > rút lui > thoát zoom > thông báo > nút 🪤 > bản đồ nhỏ
    if(this.tut&&!this.tut.done){ const r=this.tutScreen(sx,sy); if(r===true) return true; if(r===false) return false; }   /* 🎓 hướng dẫn: khoá mọi nút ngoài việc đang được yêu cầu */
    const hit=(r)=>r&&sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h;
    if(this.rallyOpen&&this._rallyRects){ for(const r of this._rallyRects){ if(hit(r)){ this.rallyOpen=false;
        if(r.n){ this.rallyPick=r.n; this.menu=null; this.sel=null; this.selA=null; this.selG=null; } audio.click(); return true; } }
      this.rallyOpen=false; return true; }
    if(this.gearTap&&this.gearTap(sx,sy)) return true;   /* 🎒 quân nhu */
    if(hit(this._rallyBtn)){ if(this.rallyPick){ this.rallyPick=0; } else { this.rallyOpen=true; this.menu=null; this.gearOpen=false; } audio.click(); return true; }
    if(this.menu&&this._menuRects){ for(const r of this._menuRects){ if(sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h){ if(r.sel){ const S=this.sendSel||(this.sendSel={node:r.sel.node,type:null,frac:1}); if(S.node!==r.sel.node){ S.node=r.sel.node; S.type=null; S.frac=1; } if('type' in r.sel) S.type=r.sel.type; if('frac' in r.sel) S.frac=r.sel.frac; audio.click(); return true; } this.menuPick(r.id); return true; } }
      this.menu=null; this.sel=null; this.selA=null; this.selG=null; return true; } // chạm ngoài menu: đóng menu + bỏ chọn
    const rb=this._retreatBtn;
    if(rb&&sx>=rb.x&&sx<=rb.x+rb.w&&sy>=rb.y&&sy<=rb.y+rb.h){
      const b=rb.b;
      if(this.p2p==='guest'){ if(typeof P2P!=='undefined') P2P.sendOp({op:'retreat',bi:this.battles.indexOf(b)}); }
      else { const mine2=[...b.A.es,...b.B.es].filter(e=>e.kind==='army'&&e.ref.owner===this.localFid).map(e=>e.ref);
        for(const a of mine2) this.retreatFromBattle(a); }
      this.zoomTgt=1; this.focusB=null; return true; }
    if(this._zBtns){ for(const r of this._zBtns){ if(sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h){
      const vw=this.lastVw||1200, vh=this.lastVh||600;
      this.zoomAt(this.zoom*(r.dir>0?1.3:1/1.3), vw/2, vh/2); audio.click(); return true; } } }
    const zb=this._zoomBtn;
    if(zb&&sx>=zb.x&&sx<=zb.x+zb.w&&sy>=zb.y&&sy<=zb.y+zb.h){ this.zoomTgt=1; this.focusB=null; return true; }
    if(this._noteRects){ for(const r of this._noteRects){ if(sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h){
      const nt=r.nt; // nhảy tới nơi xảy ra + zoom nếu là giao tranh
      let b=null,bd2=1e9; for(const bb of this.battles){ if(bb.done) continue; const d=hyp(bb.x-nt.x,bb.y-nt.y); if(d<bd2){bd2=d;b=bb;} }
      if(b&&bd2<240){ this.focusB=b.id; this.zoomTgt=2.6; } else this.jumpTo(nt.x,nt.y,1.6);
      return true; } } }
    const ab=this._ambBtn;
    if(ab&&this.sel&&this.canAmbush(this.sel)&&sx>=ab.x&&sx<=ab.x+ab.w&&sy>=ab.y&&sy<=ab.y+ab.h){
      this.sel.ambush=!this.sel.ambush; audio.click();
      if(this.p2p==='guest'&&typeof P2P!=='undefined') P2P.sendOp({op:'amb',ni:this.sel.id,v:this.sel.ambush?1:0});
      this.texts.push({x:this.sel.x,y:this.sel.y-70,s:this.sel.ambush?('🪤 Ambush at '+(BW.terName[this.sel.ter]||'')+' — awaiting the enemy!'):'Cancel ambush',col:'#ffd54a',t:0,max:1.5,big:1});
      return true; }
    const o=this.obar; if(!o) return false;
    if(sx<o.ox||sx>o.ox+o.ow||sy<o.oy||sy>o.oy+o.oh) return false;
    const k=(sx-o.ox-6)/(o.ow-12), ky=(sy-o.oy-4)/(o.oh-8); const viewW=(this.lastVw||1200)/(this.scale||1), viewH=(this.lastVh||600)/(this.scale||1);
    this.camX=Math.max(0,Math.min(BW.W-viewW, k*BW.W-viewW/2)); this.camY=Math.max(0,Math.min(Math.max(0,BW.H-viewH), ky*BW.H-viewH/2)); this.revealHud&&this.revealHud(); this.camDrag=null; this.jumpT=null; this.focusB=null; return true;
  }
  tap(wx,wy){
    if(this.tut&&!this.tut.done){ const q=this.tutWorld(wx,wy); if(!q) return; wx=q.x; wy=q.y; }   /* 🎓 chỉ nhận chạm vào đúng mục tiêu của bước hướng dẫn (chạm lệch chút vẫn tính) */
    if(this.over) return;
    if(this.rallyPick&&this._asRemote==null){ const N=this.rallyPick; this.rallyPick=0; // đang chờ chọn điểm tập kết (thao tác của chính người cầm máy này)
      if(this.p2p==='guest'&&typeof P2P!=='undefined'){ P2P.sendOp({op:'rally',n:N===Infinity?0:N,wx,wy}); this.texts.push({x:wx,y:wy-40,s:'📣 Rally order sent',col:'#7dffcf',t:0,max:1.4}); this.rallyMark={x:wx,y:wy,t:0,big:N===Infinity}; return; }
      this.rallyCall(N,wx,wy); return; }
    if(this.p2p==='guest'&&typeof P2P!=='undefined') P2P.guestTap(wx,wy);
    const F=this.localFid;
    if(this.menu){ this.menu=null; } // chạm ra ngoài menu là đóng
    let best=null,bd=1e9;
    for(const n of this.nodes){ const d=hyp(n.x-wx,n.y-wy); if(d<95&&d<bd){bd=d;best=n;} }
    // đạo quân gần điểm chạm (ưu tiên nếu gần hơn node)
    // đạo quân: đo tới TÂM HÌNH VẼ (lính + bảng số vẽ phía trên vị trí ~30px), vùng chạm nở theo quy mô
    let bA=null,bAd=1e9;
    for(const a of this.armies){ if(a.done||a.count<=0) continue;
      const nU= a.count<80?2 : a.count<300?3 : a.count<800?5 : a.count<2000?7 : a.count<5000?9 : 12;
      const d=hyp(a.x-wx,(a.y-28)-wy), rA=72+nU*3;
      if(d<rA&&(d<bAd||(a.owner===F&&bA&&bA.owner!==F&&d<bAd+25))){bAd=d;bA=a;} }
    // quân ta trùng chỗ với điểm (trại chăn nuôi, làng...): chạm vào hình quân thì chọn QUÂN, chạm sát tâm điểm thì chọn ĐIỂM
    const aWin= !!bA && (!best || bAd<=bd*1.25+10);
    const src=this.sel||this.selA;
    // LUẬT MAI PHỤC: nguồn đang mai phục + chạm vào node TA khác -> chỉ ĐỔI CHỌN, không bao giờ nhấc quân
    if(src && src.ambush && !(this.selG&&this.selG.length>1) && best && best!==src && best.owner===F && !(bA&&bA.owner===F&&aWin)){
      if(best.count>0){ this.sel=best; this.selA=null; this.selG=null; }
      this.texts.push({x:src.x,y:src.y-70,s:'🪤 Ambushers hold their position',col:'#ffd54a',t:0,max:1.1});
      audio.click(); return; }
    if(src && bA && bA.owner===F && bA!==src && aWin){ // chạm quân ta khác
      if(this.selG&&this.selG.includes(bA)){ this.selA=bA; this._dblChk(bA,wx,wy); audio.click(); return; } // vẫn giữ CẢ CỤM
      if(bA.btl){ this.sel=null; this.selA=bA; this.selG=null; audio.click(); return; } // đang giao chiến: chỉ xem
      this.menu={wx,wy,tgtOwn:bA,opts:[{id:'merge',s:'🤝 Merge into this army'},{id:'switch',s:'👉 Select this army'},{id:'cancel',s:'✖ Cancel'}],
        src:this.sel?{kind:'node',ref:this.sel}:{kind:'grp',refs:(this.selG&&this.selG.length?this.selG:[this.selA]).slice()}};
      if(this.autoMenu) this.menuPick('switch');
      return; }
    if(src && best!==src && bA!==src){
      // CHỌN MỤC TIÊU -> mở MENU LỆNH ngữ cảnh (tự chọn hành động mặc định khi autoMenu)
      const tgtArmy = bA&&bA.owner!==F&&aWin? bA : null;
      const tgtNode = !tgtArmy&&best? best : null;
      let opts=[];
      if(tgtArmy) opts=[{id:'hunt',s:'⚔️ Pursue'},{id:'cancel',s:'✖ Cancel'}];
      else if(tgtNode&&tgtNode.owner===F) opts=[{id:'move',s:'🛡️ Reinforce this post'},{id:'cancel',s:'✖ Cancel'}];
      else if(tgtNode&&tgtNode.owner===2&&tgtNode.count<=0) opts=[{id:'move',s:'🏃 March and capture'},{id:'cancel',s:'✖ Cancel'}];
      else if(tgtNode&&this.royale&&tgtNode.owner>=3&&this.allied(F,tgtNode.owner)) opts=[{id:'unally',s:'✂️ Break alliance'},{id:'scout',s:'🕵️ Scout'},{id:'cancel',s:'✖ Cancel'}];
      else if(tgtNode&&this.royale&&tgtNode.owner>=3&&tgtNode.camp) opts=[{id:'ally',s:'🤝 Propose alliance'},{id:'attack',s:'⚔️ Attack'},{id:'siege',s:'⛓️ Siege (cut supply)'},{id:'scout',s:'🕵️ Scout'},{id:'cancel',s:'✖ Cancel'}];
      else if(tgtNode) opts=[{id:'attack',s:'⚔️ Attack'},{id:'siege',s:'⛓️ Siege (cut supply)'},{id:'scout',s:'🕵️ Scout'},{id:'cancel',s:'✖ Cancel'}];
      else opts=[{id:'move',s:'🏃 March here'},{id:'scoutP',s:'🕵️ Scout this way'},{id:'cancel',s:'✖ Cancel'}];
      { // ⚔️ báo trước TƯƠNG QUAN BINH CHỦNG (khi đã thấy/đã do thám loại quân địch) và chỗ kỵ binh/đại quân không vào được
        const su=this.sel||this.selA, tt= tgtArmy? tgtArmy.type : (tgtNode&&tgtNode.owner!==F&&tgtNode.count>0? (this.visNow(tgtNode)? tgtNode.type : (tgtNode.known? tgtNode.known.type : null)) : null);
        if(su&&tt&&UNIT[tt]){ const r=this.matchup(su.type,tt, tgtArmy? this.terAt(tgtArmy.x,tgtArmy.y) : tgtNode.ter), tag= r>=1.25? ` ▲ good vs ${UNIT[tt].emoji}` : r<=0.8? ` ▼ weak vs ${UNIT[tt].emoji}` : '';
          if(tag) for(const o of opts) if(o.id==='attack'||o.id==='hunt') o.s+=tag; }
        if(su&&!tgtArmy&&!tgtNode){ const cr=this.canReach(su,wx,wy); if(!cr.ok){ const mv=opts.find(o=>o.id==='move'); if(mv) mv.s=`🏃 March to the edge · ⛔ ${BW.terName[this.terAtRaw(wx,wy)]||'blocked'}`; } } }
      const info=this.menuSupplyInfo(tgtArmy||tgtNode||{x:wx,y:wy},opts);
      this.menu={wx,wy,tgtArmy,tgtNode,opts,info,src:this.sel?{kind:'node',ref:this.sel}:{kind:'grp',refs:(this.selG&&this.selG.length?this.selG:[this.selA]).slice()}};
      if(this.autoMenu){ const def= tgtArmy?'hunt': (tgtNode&&tgtNode.owner!==F&&tgtNode.owner!==2)?'attack':'move'; this.menuPick(def); }
      return;
    }
    { let b=null,bd2=1e9; for(const bb of this.battles){ if(bb.done) continue; const d=hyp(bb.x-wx,bb.y-wy); if(d<110&&d<bd2){bd2=d;b=bb;} }
      if(b&&!src){ this.focusB=b.id; this.zoomTgt=2.6; audio.click(); return; }
      if(b&&src){ this.menu={wx,wy,tgtArmy:null,tgtNode:null,joinB:b,opts:[{id:'join',s:'➕ Reinforce the battle'},{id:'cancel',s:'✖ Cancel'}],src:this.sel?{kind:'node',ref:this.sel}:{kind:'grp',refs:(this.selG&&this.selG.length?this.selG:[this.selA]).slice()}};
        if(this.autoMenu) this.menuPick('join');
        return; } }
    if(bA && aWin){ // chạm trúng đạo quân
      if(bA.owner===F){ this.selA=bA; this.sel=null; audio.click(); this._dblChk(bA,wx,wy); }
      else { this.selA=this.sel=null; this.selG=null; }
      return; }
    if(!best){ this.sel=null; this.selA=null; return; }
    if(best.owner===F && best.count>0){ this.sel=best; this.selA=null; audio.click(); }
    else if(best.owner!==F && best.owner!==2 && !this.visNow(best)){ this.sel=null; this.selA=null; this.startScout(best); }
    else if(best.owner===2 && !this.visNow(best) && best.count>0){ this.sel=null; this.selA=null; this.startScout(best); }
    else { this.sel=null; this.selA=null; }
  }
  // 🔲 VÙNG QUÉT: chọn mọi đạo quân ta trong hình chữ nhật (toạ độ màn hình)
  boxSelect(sx0,sy0,sx1,sy1){
    const sc=this.scale||1;
    const x0=Math.min(sx0,sx1)/sc+this.camX, x1=Math.max(sx0,sx1)/sc+this.camX, y0=Math.min(sy0,sy1)/sc+(this.camY||0), y1=Math.max(sy0,sy1)/sc+(this.camY||0);
    if(this.p2p==='guest'&&typeof P2P!=='undefined') P2P.sendOp({op:'box',x0,y0,x1,y1}); // chủ phòng chọn cụm quân này cho phe khách
    return this.boxSelectWorld(x0,y0,x1,y1);
  }
  boxSelectWorld(x0,y0,x1,y1){ const F=this.localFid;
    const inR=(a)=>{ const vy=a.y-28; return (a.x>=x0&&a.x<=x1&&((a.y>=y0&&a.y<=y1)||(vy>=y0&&vy<=y1))); };
    const got=this.armies.filter(a=>a.owner===F&&!a.done&&a.count>0&&inR(a));
    const free=got.filter(a=>!a.btl);
    this.menu=null; this.rallyPick=0;
    if(!free.length){ this.texts.push({x:(x0+x1)/2,y:(y0+y1)/2,s: got.length?'⚔️ Armies in the selection are in battle':'No armies inside the selection',col:'#ffd54a',t:0,max:1.4}); this.sel=null; this.selA=null; this.selG=null; return 0; }
    free.sort((a,b)=>b.count-a.count);
    this.sel=null; this.selA=free[0]; this.selG=free.slice();
    const tot=free.reduce((t,a)=>t+a.count,0);
    this.texts.push({x:free[0].x,y:free[0].y-110,s:`👥 Selected ${free.length} armies · ${Math.round(tot)} troops`,col:'#7dffcf',t:0,max:1.6,big:1});
    audio.click(); return free.length;
  }
  rallyCall(N,x,y){ // gọi quân từ N trại/điểm tập kết gần điểm chạm nhất về một điểm
    const F=this.localFid; let snap=null, rescue=N<0;
    if(rescue){ const t=this.rescuePick(x,y); if(!t){ this.note('🚑 No camp of yours is in danger near there',x,y,'🚑'); return; } snap={node:t,x:t.x,y:t.y}; N=5; }
    else snap=this.rallySnap(x,y);                       /* (5.4) bắt dính trại / cứ điểm / đạo quân đang đóng gần ngón tay */
    const x0=x, y0=y, pick=()=>this.nodes.filter(n=>n.owner===F&&n.count>=100&&!n.eco&&!n.btl&&!(snap&&snap.node===n)).sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y)).slice(0,N);
    if(snap){ x=snap.x; y=snap.y; }
    let src=pick(); if(!src.length&&snap&&!rescue){ snap=null; x=x0; y=y0; src=pick(); }   /* chạm cạnh trại duy nhất còn quân: không có ai để gọi VÀO trại đó → hiểu là gọi quân ra đúng điểm chạm như cũ */
    if(!src.length){ this.note('No camp has enough troops to call',x,y,'📣'); return; }
    if(this._asRemote==null) this.rallyMark={x,y,t:0,big:N===Infinity};   /* cờ hiệu / trống trận tại điểm tập kết (lệnh của người chơi bên kia thì không hiện trên máy này) */
    const rid=(this._rid=(this._rid||0)+1); let i=0, sent=0;
    for(const n of src){ const ox=((i%4)-1.5)*70, oy=((i/4|0)-1)*70; i++;
      const a= snap&&snap.node? this.send(n,snap.node) : this.send(n,{x:x+ox,y:y+oy,id:-1}); if(a){ sent++; for(const q of this._lastSent){ if(snap&&snap.army) q.mergeInto=snap.army; else if(!(snap&&snap.node)) q.rally=rid; } } }
    // TRẤN THỦ: quân ở trại chăn nuôi / điểm luyện binh chủ động chạy về giữ các trại vừa bị rút trống (gần nhất trước)
    const emptied=src.filter(n=>n.owner===F&&n.count<50);
    const feeders=this.nodes.filter(n=>n.owner===F&&(n.eco==='farm'||n.eco==='train')&&n.count>=60&&!n.btl&&!n.sieged);
    const used=new Set(); let refill=0;
    for(const tgt of emptied.sort((a,b)=>(b.camp?1:0)-(a.camp?1:0))){ // ưu tiên trại lớn (kinh đô/trại) trước
      let best=null,bd=1e9; for(const f of feeders){ if(used.has(f)) continue; const d=hyp(f.x-tgt.x,f.y-tgt.y); if(d<bd){bd=d;best=f;} }
      if(!best||bd>4000) continue; used.add(best);
      const keep=Math.max(30,Math.round(best.count*0.2)), go=best.count-keep; if(go<30) continue;
      best.count=go; const g=this.send(best,tgt); best.count=keep; if(g){ g.garrison=1; refill++; } }
    const where= snap&&snap.node? (snap.node.owner===F? ' into '+(snap.node.camp?'your camp':'your stronghold') : ' onto the '+(snap.node.owner===2?'neutral':'enemy')+' stronghold') : snap&&snap.army? ' to join your army' : '';
    this.note((rescue? `🚑 RESCUE: ${sent} nearest camps rushing to save ${snap.node.camp?'the camp':'the stronghold'}` : N===Infinity?`🚩 GENERAL MOBILIZATION: ${sent} camps marching${where||' here'}`:`📣 Calling ${sent} nearest camps to rally${where}`)+(refill?` · ${refill} ranches/training grounds sent troops to garrison`:''),x,y,N===Infinity?'🚩':'📣');
    audio.order();
  }
  // 💾 LƯU / TẢI VÁN (Quần Hùng chơi dài): mọi tham chiếu đối tượng đổi thành chỉ số
  saveState(){
    const aIdx=new Map(this.armies.map((a,i)=>[a,i]));
    const ref=(o)=> o==null? null : aIdx.has(o)? {a:aIdx.get(o)} : (o.id!=null&&this.nodes[o.id]===o)? {n:o.id} : null;
    const side=(S)=>({fid:S.fid,mul:S.mul,es:S.es.map(e=>({kind:e.kind,c0:e.c0,r:ref(e.ref)})).filter(e=>e.r)});
    const K=['time','nextAI','aiWave','nextAiScout','regenT','reinT','enFed','_bid','_rid','_rr','stormRush','camX','camY','zoom','visR','coinT'];
    const sc={}; for(const k of K) if(this[k]!==undefined) sc[k]=this[k];
    return { v:1, savedAt:Date.now(), lv:this.lv, cfg:{royale:this.cfg.royale,diff:this.cfg.diff,bio:this.cfg.bio,seed:this.cfg.seed,map:this.cfg.map,L:this.cfg.L,civ:this.cfg.civ,civ2:this.cfg.civ2},
      sc, stats:this.stats, fed:this.fed, nextWaveF:this.nextWaveF||{}, cap0:this.cap0||{}, n0:this.n0||{}, allies:[...this.allies],
      nodes:this.nodes.map(n=>Object.assign({},n)),
      armies:this.armies.map(a=>Object.assign({},a,{hunt:ref(a.hunt),mergeInto:ref(a.mergeInto),path:undefined,_pk:undefined,pi:undefined,pvT:undefined})),
      convoys:(this.convoys||[]).filter(c=>!c.done).map(c=>Object.assign({},c,{to:ref(c.to),path:undefined,_pk:undefined,pi:undefined})).filter(c=>c.to),
      battles:this.battles.filter(b=>!b.done).map(b=>Object.assign({},b,{A:side(b.A),B:side(b.B)})),
      scouts:this.scouts, aiScouts:this.aiScouts, gear:(this.gear||[]).map(g=>({id:g.id,cd:g.cd})), tempVis:this.tempVis||[] };
  }
  loadState(sv){
    this.nodes=sv.nodes.map(n=>Object.assign({},n));
    this.armies=sv.armies.map(a=>Object.assign({},a));
    const deref=(r)=> r==null? null : r.a!=null? this.armies[r.a] : r.n!=null? this.nodes[r.n] : null;
    for(const a of this.armies){ a.hunt=deref(a.hunt); a.mergeInto=deref(a.mergeInto); a.path=null; a._pk=null; a._cv=0; }
    // ván lưu từ bản cũ (trước v5.0 sông chưa có "nước sâu"): cứ điểm nào nằm giữa dòng sông thì dời lên bờ, kẻo thành ốc đảo không ai tới được
    for(const n of this.nodes){ const rx=this.riverX(n.y); if(Math.abs(n.x-rx)<120){ n.x=rx+(n.x<rx? -125 : 125); } n.ter=this.terAtRaw(n.x,n.y); }
    this.convoys=(sv.convoys||[]).map(c=>Object.assign({},c,{to:deref(c.to),path:null,_pk:null})).filter(c=>c.to); for(const c of this.convoys) c.to._cv=1;
    if(this.separateNodes()){ for(const n of this.nodes) n.ter=this.terAtRaw(n.x,n.y); }   /* ván lưu từ bản cũ có thể còn cứ điểm chồng nhau */
    this.genRoads(); this._tg&&this._tg.fill(-1);
    const side=(S)=>({fid:S.fid,mul:S.mul,es:S.es.map(e=>({kind:e.kind,c0:e.c0,ref:deref(e.r)})).filter(e=>e.ref)});
    this.battles=(sv.battles||[]).map(b=>Object.assign({},b,{A:side(b.A),B:side(b.B)}));
    Object.assign(this,sv.sc); this.zoomTgt=this.zoom||1;
    this.stats=sv.stats||this.stats; this.fed=sv.fed||{}; this.nextWaveF=sv.nextWaveF||{}; this.cap0=sv.cap0||{}; this.n0=sv.n0||{};
    this.allies=new Set(sv.allies||[]); this.scouts=sv.scouts||[]; this.aiScouts=sv.aiScouts||[];
    this.tempVis=sv.tempVis||[]; this._gearLive=true; this.lossLog=[]; for(const g of this.gear||[]){ const o=(sv.gear||[]).find(q=>q.id===g.id); if(o) g.cd=o.cd||0; } if(!(sv.sc&&sv.sc.coinT>0)) this.coinT=(Math.floor(this.time/BW.coinsFor.every)+1)*BW.coinsFor.every;   /* ván lưu từ bản cũ (chưa có mốc thưởng): tính từ mốc 10 phút kế tiếp, không trả bù cho thời gian đã chơi */
    this.notes=[]; this.texts=[]; this.fx=[]; this.rings=[]; this.fxs=[]; this.menu=null; this.sel=null; this.selA=null; this.selG=null;
    if(!this.nodes.some(n=>n.capOf!=null)){ const seen=new Set(); for(const n of this.nodes){ if(n.camp&&n.owner!==2&&(n.home??n.owner)===n.owner&&!seen.has(n.owner)){ n.capOf=n.owner; seen.add(n.owner); } } }
    this.intro=null; this.over=false; this.result=null; this._updateVision&&this._updateVision();
    const c0=this.nodes.find(n=>n.camp&&n.owner===this.localFid)||this.nodes[0];
    this.note(this.royale? '💾 Warlords game loaded — continue!' : '💾 Battle loaded — continue!',c0.x,c0.y,'💾');
  }
  menuPick(id){
    const m=this.menu; if(!m) return false; this.menu=null;
    if(this.p2p==='guest'){ if(typeof P2P!=='undefined') P2P.guestMenu(id, m.src&&m.src.kind==='node'? this.selOpt(m.src.ref) : null); this.sel=null; this.selA=null; this.selG=null; audio.click(); return true; }
    if(id.startsWith('rally')){ this.rallyCall(id==='rally5'?5: id==='rally10'?10: Infinity, m.wx, m.wy); this.sel=null; this.selA=null; this.selG=null; return true; }
    if(id==='cancel'){ this.sel=null; this.selA=null; this.selG=null; audio.click();
      this.texts.push({x:m.wx,y:m.wy-40,s:'Deselected',col:'#cde6ff',t:0,max:0.8}); return true; }
    const F=this.localFid;
    const doSend=(s,to,mode)=>{ const a=this.send(s,to,this.selOpt(s)); if(a&&mode==='siege'){ for(const q of this._lastSent) q.siege= m.tgtNode? m.tgtNode.id : -1; } if(!a&&this.selOpt(s)&&s.owner===this.localFid) this.texts.push({x:s.x,y:s.y-80,s:`Too few troops to split (min ${BW.sendMin})`,col:'#ffb4a8',t:0,max:1.6}); return a; };
    let made=null;
    if(id==='switch'&&m.tgtOwn){ this.sel=null; this.selA=m.tgtOwn; this.selG=null; audio.click(); this._dblChk(m.tgtOwn,m.wx,m.wy); return true; }
    if(id==='merge'&&m.tgtOwn){ const tgt=m.tgtOwn;
      if(m.src.kind==='node'){ const s2=m.src.ref; this.sel=null;
        const a=this.send(s2,{x:tgt.x,y:tgt.y,id:-1},this.selOpt(s2)); if(a){ for(const q of this._lastSent) q.mergeInto=tgt; this.fxArrow={x0:s2.x,y0:s2.y,x1:tgt.x,y1:tgt.y,t:0}; audio.order(); } }
      else { for(const s2 of m.src.refs){ if(!s2||s2.done||s2===tgt) continue; s2.camped=false; s2.ambush=false; s2.siege=null; s2.hunt=null; s2.to=-1; s2.mergeInto=tgt; }
        this.selA=null; this.selG=null; audio.order(); }
      this.texts.push({x:tgt.x,y:tgt.y-70,s:'🤝 Marching over to merge...',col:'#7dffcf',t:0,max:1.3});
      return true; }
    if(id==='join'&&m.joinB){ const b=m.joinB;
      if(m.src.kind==='node'){ const s2=m.src.ref; this.sel=null; const a=this.send(s2,{x:b.x,y:b.y,id:-1},this.selOpt(s2)); if(a){ this.fxArrow={x0:s2.x,y0:s2.y,x1:b.x,y1:b.y,t:0}; audio.order(); } }
      else { for(const s2 of m.src.refs){ if(!s2||s2.done) continue; s2.camped=false; s2.ambush=false; s2.to=-1; s2.tx=b.x; s2.ty=b.y; s2.hunt=null; } this.selA=null; this.selG=null; audio.order(); }
      return true; }
    if((id==='ally'||id==='unally')&&m.tgtNode){ const nat=m.tgtNode.owner; this.sel=null; this.selA=null; this.selG=null;
      if(id==='unally'){ this.setAlly(F,nat,false); this.note('✂️ Alliance broken with '+this.natName(nat),m.tgtNode.x,m.tgtNode.y,'✂️'); audio.click(); return true; }
      if(this.natAtWar(F,nat)){ this.note('⚔️ At war — can\'t ally now',m.tgtNode.x,m.tgtNode.y,'⚔️'); return true; }
      const mine=this.natPower(F), his=this.natPower(nat);
      const p= this.coalition? 0.08 : mine>his? 0.7 : 0.35; // nước yếu dễ nhận liên minh; khi thiên hạ đang chống ta thì gần như từ chối
      if(this.rnd()<p){ this.setAlly(F,nat,true); this.note('🤝 '+this.natName(nat)+' accepted the alliance!',m.tgtNode.x,m.tgtNode.y,'🤝'); }
      else this.note('🚫 '+this.natName(nat)+' declined the alliance',m.tgtNode.x,m.tgtNode.y,'🚫');
      audio.click(); return true; }
    if(id==='scout'&&m.tgtNode){ if(this.p2p!=='guest') this.startScout(m.tgtNode); this.sel=null; this.selA=null; this.selG=null; return true; }
    if(id==='scoutP'){ // do thám hướng điểm chạm: chọn node địch/trung lập gần điểm đó nhất
      let g=null,gd=1e9; for(const n of this.nodes){ if(n.owner===F) continue; const d=hyp(n.x-m.wx,n.y-m.wy); if(d<gd){gd=d;g=n;} }
      if(g) this.startScout(g); this.sel=null; this.selA=null; this.selG=null; return true; }
    if(m.src.kind==='node'){ const s=m.src.ref; this.sel=null;
      if(id==='hunt'&&m.tgtArmy) made=doSend(s,m.tgtArmy);
      else if(m.tgtNode&&(id==='attack'||id==='move')) made=doSend(s,m.tgtNode);
      else if(m.tgtNode&&id==='siege') made=doSend(s,m.tgtNode,'siege');
      else made=doSend(s,{x:m.wx,y:m.wy,id:-1});
    } else { const grp=m.src.refs; this.selA=null; this.selG=null;
      const live=grp.filter(s=>s&&!s.done).length, rows=Math.ceil(live/3); // một đạo: tới ĐÚNG điểm chạm; nhiều đạo: xếp đội hình quanh điểm chạm
      let gi=0; for(const s of grp){ if(!s||s.done) continue; s.camped=false; s.ambush=false; s.siege=null;
        const ox= live<=1? 0 : ((gi%3)-(Math.min(3,live)-1)/2)*56, oy= live<=1? 0 : ((gi/3|0)-(rows-1)/2)*56; gi++;
        if(id==='hunt'&&m.tgtArmy){ s.hunt=m.tgtArmy; s.to=-1; }
        else if(m.tgtNode&&(id==='attack'||id==='move')){ s.to=m.tgtNode.id; s.hunt=null; }
        else if(m.tgtNode&&id==='siege'){ s.to=m.tgtNode.id; s.hunt=null; s.siege=m.tgtNode.id; }
        else { s.to=-1; s.tx=m.wx+ox; s.ty=m.wy+oy; s.hunt=null; }
        made=s; } }
    if(made){ const a=made; const tx=a.hunt?a.hunt.x:(a.to>=0?this.nodes[a.to].x:(a.tx??m.wx)), ty=a.hunt?a.hunt.y:(a.to>=0?this.nodes[a.to].y:(a.ty??m.wy));
      this.fxArrow={x0:a.x,y0:a.y,x1:tx,y1:ty,t:0}; audio.order();  }
    return true;
  }
  asFid(fid,fn){ const S=this._fidCtx=this._fidCtx||{}; const cur={sel:this.sel,selA:this.selA,selG:this.selG,menu:this.menu,localFid:this.localFid};
    const st=S[fid]||{sel:null,selA:null,selG:null,menu:null};
    this.sel=st.sel; this.selA=st.selA; this.selG=st.selG; this.menu=st.menu; this.localFid=fid; const rem0=this._asRemote; this._asRemote=fid; this._meFid=cur.localFid;
    try{ fn(); } finally { S[fid]={sel:this.sel,selA:this.selA,selG:this.selG,menu:this.menu}; this._asRemote=rem0;
      this.sel=cur.sel; this.selA=cur.selA; this.selG=cur.selG; this.menu=cur.menu; this.localFid=cur.localFid; } }
  cosmetic(dt){ // khách P2P: chỉ chạy hiệu ứng, trạng thái do chủ phòng gửi về
    this.time+=dt;
    { let dead=false; for(const f of this.fxs){ f.t+=dt; if(!(f.t<f.life)) dead=true; } if(dead) this.fxs=this.fxs.filter(f=>f.t<f.life); }
    { let dead=false; for(const t of this.texts){ t.t+=dt; if(t.part){ t.x+=t.vx*dt; t.y+=t.vy*dt; t.vy+=260*dt; } if(!(t.t<t.max)) dead=true; } if(dead) this.texts=this.texts.filter(t=>t.t<t.max); }
    { let dead=false; for(const r of this.rings){ r.t+=dt; if(!(r.t<r.max)) dead=true; } if(dead) this.rings=this.rings.filter(r=>r.t<r.max); }
    { let dead=false; for(const nt of this.notes){ nt.t+=dt; if(!(nt.t<7)) dead=true; } if(dead) this.notes=this.notes.filter(nt=>nt.t<7); }
    if(this.shake>0) this.shake=Math.max(0,this.shake-dt*26);
  }
  note(text,x,y,icon){
    if(this._asRemote!=null){ if(this.p2p==='host'&&typeof P2P!=='undefined') P2P.sendOp({op:'note',text,x:Math.round(x),y:Math.round(y),icon}); return; }   /* đang chạy lệnh của người chơi bên kia: tin báo gửi về máy họ, không lộ ra máy này */
    this.notes.push({text,x,y,icon:icon||'⚔️',t:0}); if(this.notes.length>4) this.notes.shift(); audio.flag&&audio.flag(); }
  noteFor(fid,text,x,y,icon){ const rem=this._asRemote, me= rem!=null? this._meFid : this.localFid;   /* "người cầm máy này" — kể cả lúc đang chạy hộ lệnh của bên kia */
    if(fid===me){ this._asRemote=null; try{ this.note(text,x,y,icon); } finally { this._asRemote=rem; } }
    else if(this.p2p==='host'&&fid===1&&typeof P2P!=='undefined') P2P.sendOp({op:'note',text,x:Math.round(x),y:Math.round(y),icon}); }
  camClamp(viewW,viewH){ const ox=viewW*0.5, oy=viewH*0.5;
    this.camX=Math.max(-ox,Math.min(BW.W-viewW+ox,this.camX));
    this.camY=Math.max(-oy,Math.min(Math.max(0,BW.H-viewH)+oy,this.camY||0)); }
  jumpTo(x,y,zoom){ this.zoomTgt=zoom||1.7; this.jumpT={x,y,t:0.8}; }
  zoomAt(z,sx,sy){ // thu phóng quanh điểm chạm/con trỏ
    z=Math.max(this.big?0.3:0.7,Math.min(2.8,z));
    const sc0=(this.scale0||1)*this.zoom; // tỉ lệ HIỆN TẠI (không dùng this.scale của khung trước — nhiều sự kiện chạm/khung gây trôi)
    const wx=sx/sc0+this.camX, wy=sy/sc0+(this.camY||0);
    this.zoom=this.zoomTgt=z; this.focusB=null; this.jumpT=null; this.camDrag=null;
    const sc1=(this.scale0||1)*z;
    this.camX=wx-sx/sc1; this.camY=wy-sy/sc1; this.scale=sc1;
    const vw=this.lastVw||1200, vh=this.lastVh||600;
    this.camClamp(vw/sc1,vh/sc1);
  }
  // ---- cập nhật
  startBattle(x,y,ter,nodeId,atkE,defE,defMulV,tag){
    const b={id:(this._bid=(this._bid||0)+1),x,y,ter,nodeId:nodeId??-1,t:0,fxT:0,done:false,
      A:{fid:atkE.fid,mul:1,es:[atkE.e]}, B:{fid:defE.fid,mul:defMulV||1,es:[defE.e]}};
    const tot=this.bSideSum(b.A)+this.bSideSum(b.B);
    b.K=1/(3.5+Math.sqrt(Math.max(1,tot))/14);     // trận càng đông càng lâu, tối thiểu ~5 giây
    /* (5.5) KIỂU TRẬN quyết định nhịp: 🏰 công trại/thành trấn kéo dài · 🪤 phục kích giữ nhịp cũ · ⚔️ chỗ khác: chênh lệch càng lớn càng nhanh tan */
    { const nd=b.nodeId>=0? this.nodes[b.nodeId] : null, amb=!!(tag&&/AMBUSH/.test(tag));
      b.kind= amb? 'ambush' : nd&&(nd.camp||nd.struct)? 'siege' : 'field'; b.L= b.kind==='siege'? (nd.camp? BW.btl.camp : BW.btl[nd.struct]||BW.btl.village) : 1;
      b.A0=Math.max(1,this.bSideSum(b.A)); b.B0=Math.max(1,this.bSideSum(b.B)); }
    { const big=Math.max(b.A0,b.B0)/Math.min(b.A0,b.B0), F0=this.localFid, mine=b.A.fid===F0||b.B.fid===F0;   /* cho người chơi thấy kiểu trận: dài (công thành) hay chóng vánh (chênh lệch lớn) */
      if(mine&&b.kind==='siege') this.texts.push({x,y:y-140,s:'🏰 Siege — a long battle',col:'#ffd54a',t:0,max:2.2});
      else if(mine&&b.kind==='field'&&big>=2) this.texts.push({x,y:y-140,s:`⚡ ×${big>=10?Math.round(big):big.toFixed(1)} outnumbered — quick rout`,col:'#7dffcf',t:0,max:2.2}); }
    for(const S of [b.A,b.B]) for(const e of S.es){ if(e.kind==='army'&&e.ref.smokeT>0){ S.mul*=BW.gear.smokeMul; e.ref.smokeT=0; this.texts.push({x,y:y-110,s:'💨 Strike from the smoke ×'+BW.gear.smokeMul,col:'#ffe08a',t:0,max:2,big:1}); } }
    for(const e of b.A.es) this.bLock(e,b); for(const e of b.B.es) this.bLock(e,b);
    this.battles.push(b);
    this.battleFx(x,y,ter,tot>1500);
    const F=this.localFid;
    for(const f of new Set([b.A.fid,b.B.fid])) this.noteFor(f,tag||('⚔️ Battle at '+(BW.terName[ter]||'')),x,y,'⚔️');
    return b;
  }
  bLock(e,b){ if(e.kind==='army'){ e.ref.btl=b.id; } else { e.ref.btl=b.id; } }
  bSideSum(S){ let t=0; for(const e of S.es) t+=Math.max(0,e.ref.count); return t; }
  bJoin(b,fid,e){ const S= fid===b.A.fid? b.A : fid===b.B.fid? b.B : null;
    if(!S){ return false; } S.es.push(e); this.bLock(e,b); if(S===b.A&&b.A0) b.A0+=Math.max(0,e.ref.count); else if(S===b.B&&b.B0) b.B0+=Math.max(0,e.ref.count);   /* viện binh nhập trận: nhịp tính theo cả quân mới tới */
    if(e.kind==='army'&&e.ref.smokeT>0){ const tot=this.bSideSum(S), sh= tot>0? Math.max(0,e.ref.count)/tot : 1; S.mul*=1+(BW.gear.smokeMul-1)*sh; e.ref.smokeT=0;   /* 💨 đạo quân trong khói nhập trận: cú đánh bất ngờ tính theo phần quân của nó trong phe */
      this.texts.push({x:b.x,y:b.y-110,s:'💨 Strike from the smoke!',col:'#ffe08a',t:0,max:2,big:1}); }
    return true; }
  bDom(S){ let best=null,bc=-1; for(const e of S.es){ if(e.ref.count>bc){ bc=e.ref.count; best=e.ref.type; } } return best||'spear'; }
  battleOf(id){ return this.battles.find(b=>b.id===id&&!b.done); }
  retreatFromBattle(a){ // rút lui: chịu 12% tổn thất, MIỄN CHIẾN 3s và chạy THẲNG VỀ TRẠI
    const b=this.battleOf(a.btl); if(b){ for(const S of [b.A,b.B]){ const i=S.es.findIndex(e=>e.ref===a); if(i>=0) S.es.splice(i,1); } }
    a.btl=null; a.count=Math.max(0,Math.round(a.count*0.88)); a.camped=false; a.ambush=false; a.siege=null; a.sieging=null;
    a.retreatT=3; a.hunt=null;
    const home=this.nodes.find(m=>m.camp&&(m.home??m.owner)===a.owner&&m.owner===a.owner)
      || this.nodes.find(m=>m.camp&&m.owner===a.owner);
    let h=home; if(!h){ let hd=1e9; for(const m of this.nodes){ if(m.owner!==a.owner) continue; const d=hyp(m.x-a.x,m.y-a.y); if(d<hd){hd=d;h=m;} } }
    if(h){ a.to=h.id; } else { a.to=-1; a.tx=a.x-300; a.ty=a.y; }
    this.texts.push({x:a.x,y:a.y-70,s:'🏳️ Retreat to camp!',col:'#ffd54a',t:0,max:1.4,big:1});
    if(a.count<BW.food.disband) a.done=true;
  }
  nearOwnBase(a,R){ let best=null,bd=1e9; for(const n of this.nodes){ if(n.owner!==a.owner||n.btl) continue; const d=hyp(n.x-a.x,n.y-a.y)-(n.camp?150:0); if(d<bd&&hyp(n.x-a.x,n.y-a.y)<=R){bd=d;best=n;} } return best; }
  marchHome(a,n){ a.btl=null; a.camped=false; a.ambush=false; a.to=n.id; a.tx=null; a.ty=null; a.hunt=null; a.mergeInto=null; a.homeIn=1;
    if(a.owner===this.localFid) this.texts.push({x:a.x,y:a.y-90,s:'⛺ Returning to '+(n.camp?'camp':'outpost'),col:'#7dffcf',t:0,max:1.4}); }
  bEnd(b,winS,loseS){
    b.done=true;
    if(b.lostP>0){ (this.lossLog=this.lossLog||[]).push({x:b.x,y:b.y,t:this.time,n:b.lostP}); if(this.lossLog.length>16) this.lossLog.shift(); }
    // cướp lương của bên thua
    let loot=0; for(const e of loseS.es){ loot+= (e.kind==='army'? (e.ref.food||0) : (e.ref.food||0)); }
    loot*=BW.food.lootKeep;
    const wArm=winS.es.filter(e=>e.kind==='army');
    for(const e of wArm){ if(loot<=0) break; const need=BW.food.max-(e.ref.food||0); const take=Math.min(need,loot); e.ref.food=(e.ref.food||0)+take; loot-=take; }
    // bên thua: đạo quân tan; node bị chiếm
    for(const e of loseS.es){ if(e.kind==='army'){ const a=e.ref;
        const rem=Math.round(a.count*0.15);
        if(rem>=20){ let h=null,hd=1e9; for(const m of this.nodes){ if(m.owner!==a.owner) continue; const d=hyp(m.x-a.x,m.y-a.y); if(d<hd){hd=d;h=m;} }
          if(h) this.armies.push({owner:a.owner,type:a.type,count:rem,x:a.x,y:a.y,from:-1,to:h.id,trail:0,routed:true,food:30}); }
        a.count=0; a.done=true; a.btl=null; } }
    const node= b.nodeId>=0? this.nodes[b.nodeId] : null;
    if(node){ node.btl=null;
      const nodeOnWin=winS.es.some(e=>e.ref===node);
      if(!nodeOnWin){ // phe công chiếm node: toàn bộ đạo quân thắng nhập thành
        let tot=0,ty=this.bDom(winS),fd=0;
        for(const e of winS.es){ if(e.kind==='army'){ tot+=e.ref.count; fd+=e.ref.food||0; e.ref.count=0; e.ref.done=true; e.ref.btl=null; } }
        const prevOwner=node.owner;
        node.owner=winS.fid; node.type=ty; node.count=Math.max(1,tot); node.ambush=false; node.food=(node.food||0)+Math.round(fd*0.2);
        this.ring(node,BW.facPal(winS.fid).color); this.checkCamp(node,winS.fid,prevOwner);
      } else { // giữ thành thắng: các đạo tiếp viện đang đứng quanh thành NHẬP THÀNH luôn
        for(const e of winS.es){ if(e.kind==='army'){ const a=e.ref; a.btl=null; if(a.done||a.count<=0) continue; this.marchHome(a,node); } } }
    } else { // dã chiến: GỘP toàn bộ đạo thắng trận thành MỘT đạo
      const wa=winS.es.filter(e=>e.kind==='army'&&!e.ref.done&&e.ref.count>0).map(e=>e.ref);
      if(wa.length>1){ const main=wa.reduce((m2,a2)=>a2.count>m2.count?a2:m2,wa[0]);
        let tot=0, fd=0; for(const a2 of wa){ tot+=a2.count; fd+=(a2.food||0); if(a2!==main){ a2.count=0; a2.done=true; a2.btl=null; } }
        main.count=Math.round(tot); main.food=Math.min(BW.food.max, Math.round(fd/wa.length)+20); main.btl=null; main.camped=true;
        this.texts.push({x:main.x,y:main.y-70,s:'🤝 Armies merged: '+Math.round(tot)+' troops!',col:'#7dffcf',t:0,max:1.6,big:1});
      } else for(const a2 of wa) a2.btl=null;
      if(wa.length===1) wa[0].camped=true;
      // thắng trận dã chiến sát trại/cứ điểm phe mình -> tự gom quân kéo vào trại
      for(const a2 of wa){ if(a2.done||a2.count<=0) continue; const h=this.nearOwnBase(a2,650); if(h) this.marchHome(a2,h); } }
    const F=this.localFid;
    if(winS.fid===F) this.stats.win++; else if(loseS.fid===F) this.stats.lose++;
    this.noteFor(winS.fid,'🏆 Victory!',b.x,b.y,'🏆'); this.noteFor(loseS.fid,'💀 Defeat!',b.x,b.y,'💀');
    this.battleFx(b.x,b.y,b.ter,true);
  }
  update(dt){
    if(this.over) return;
    if(this.tut) this.tutUpdate(dt);
    this.time+=dt;
    if(this.fxArrow){ this.fxArrow.t+=dt; if(this.fxArrow.t>0.6) this.fxArrow=null; }
    if(this._navWarm&&this._navWarm.length){ const k=this._navWarm.pop(); this.navCost(k); this.navComp(k); }
    if(this.gearTick) this.gearTick(dt);
    if(this.royale&&this.time>=this.coinT&&this.coin){ const E=BW.coinsFor.every, late=this.time-this.coinT; this.coinT=(Math.floor(this.time/E)+1)*E;   /* mỗi mốc 10 phút trả đúng một lần; đồng hồ đã chạy quá mốc cả một chu kỳ (ván lưu lạ) thì chỉ đặt lại mốc, không trả bù */
      const c0=this.nodes.find(n=>n.camp&&n.owner===this.localFid); if(c0&&late<E) this.coin(BW.coinsFor.survive,'your realm stands another 10 minutes',c0.x,c0.y); }
    // đạo quân di chuyển (tới node, tới điểm bất kỳ, hoặc truy kích đạo quân địch)
    this._pfN=0; this._pfMs=0;
    for(const a of this.armies){ if(a.retreatT>0) a.retreatT-=dt; if(a.done||a.camped||a.btl) continue;
      if(a.holdT>0){ a.holdT-=dt; continue; } // chờ các cánh quân khác (hợp đồng tác chiến)
      if(a.prep>0){ a.prep-=dt; if(a.prep>0) continue; a.prep=0;   // 🌾 gom đủ lương → xuất phát
        if(a.owner===this.localFid&&(a.prep0||0)>=1) this.texts.push({x:a.x,y:a.y-84,s:'🚩 Supplies ready — marching out!',col:'#d9f99d',t:0,max:1.3}); }
      let txp,typ,node=null;
      if(a.mergeInto){ const tg=a.mergeInto;
        if(tg.done||tg.count<=0){ a.mergeInto=null; a.tx=tg.x; a.ty=tg.y; }
        else if(hyp(tg.x-a.x,tg.y-a.y)<=70){ // NHẬP QUÂN
          const c1=tg.count,c2=a.count;
          tg.count=Math.round(c1+c2);
          tg.food=Math.min(BW.food.max, ((tg.food??100)*c1+(a.food??100)*c2)/(c1+c2));
          if(c2>c1) tg.type=a.type;
          a.count=0; a.done=true;
          if(a.owner===this.localFid){ this.texts.push({x:tg.x,y:tg.y-74,s:'🤝 +'+Math.round(c2)+' joins — '+Math.round(tg.count)+' troops',col:'#7dffcf',t:0,max:1.5,big:1}); audio.pickup(); }
          continue; }
        else { txp=tg.x; typ=tg.y; } }
      else if(a.hunt){ if(a.hunt.done||a.hunt.count<=0){ a.hunt=null; a.tx=a.x; a.ty=a.y; }
        else { txp=a.hunt.x; typ=a.hunt.y; } }
      if(!a.hunt&&!a.mergeInto){ if(a.to>=0){ node=this.nodes[a.to]; txp=node.x; typ=node.y; } else { txp=a.tx??a.x; typ=a.ty??a.y; } }
      // ĐƯỜNG ĐI theo địa hình (src/09a_terrain.js): kỵ binh/đại quân bám đồng trống + đường cái, bộ binh xuyên rừng núi chậm, sông chỉ qua ở bến
      const prof=this.mvProfile(a), moving=!!(a.hunt||a.mergeInto);
      const pkA= node? node.id : moving? Math.round(txp/120) : Math.round(txp), pkB= node? -7 : moving? Math.round(typ/120)-1e6 : Math.round(typ);   /* "đích có đổi không" so bằng số, không ghép chuỗi mỗi khung hình */
      if(a._pk!==prof||a._pkA!==pkA||a._pkB!==pkB){ if(this._pfN>=8||this._pfMs>6) continue; this._pfN++;   // mỗi khung hình tính tối đa 8 lộ trình VÀ không quá ~6 ms (không giật khi gọi quân hàng loạt trên bản đồ lớn)
        const tp0=performance.now(), P=this.findPath(prof,a.x,a.y,txp,typ); this._pfMs+=performance.now()-tp0; a._pk=prof; a._pkA=pkA; a._pkB=pkB; a.path=P.pts; a.pi=0; a.pathOk=P.ok;
        if(a.owner===this.localFid){ a.pvT=2.4;
          if(!P.ok&&!node&&!moving){ const e=P.pts.length? P.pts[P.pts.length-1] : [a.x,a.y], tn=BW.terName[this.terAtRaw(txp,typ)]||'there';
            this.texts.push({x:e[0],y:e[1]-60,s:`⛔ ${this.mvWhy(a)} can't enter ${tn} — holding at the edge`,col:'#ffb4a8',t:0,max:2.6}); } } }
      const lastLeg=!a.path||a.pi>=a.path.length-1;
      let mx=txp, my=typ;
      if(a.path&&a.path.length&&!(lastLeg&&a.pathOk)){ const wp=a.path[Math.min(a.pi,a.path.length-1)]; mx=wp[0]; my=wp[1]; }
      const dx=mx-a.x, dy=my-a.y, d=hyp(dx,dy);
      if(d>0.5){ a.hx=dx/d; a.hy=dy/d; }
      const sp=this.mvSpeed(a,prof);
      // BAO VÂY: tới vành đai 185px quanh node là dừng, không công thành
      if(a.siege!=null&&a.siege>=0&&node&&hyp(node.x-a.x,node.y-a.y)<=200){ const an=Math.atan2(a.y-node.y,a.x-node.x)||(a.owner*1.7);
        a.x=node.x+Math.cos(an)*185; a.y=node.y+Math.sin(an)*185; a.camped=true; a.sieging=node.id;
        if(a.owner===this.localFid) this.texts.push({x:a.x,y:a.y-70,s:'⛓️ Siege — supply lines cut!',col:'#ffd54a',t:0,max:1.6,big:1});
        continue; }
      if(d<=sp*dt){ a.x=mx; a.y=my;
        if(!lastLeg){ a.pi++; }                                                   // tới một mốc giữa đường → đi tiếp mốc sau
        else if(!a.pathOk&&node){ a.pathOk=true; a.path=[[node.x,node.y]]; a.pi=0; } // (phòng hờ) cứ điểm nào cũng có đường cái: đi thẳng nốt
        else if(!a.pathOk&&moving){ /* đích di động đang ở vùng không vào được: đứng chờ ở mép, đích đổi chỗ thì tính lại */ }
        else if(node){ if(a.retreatT>0&&node.owner!==a.owner){ a.retreatT=0; a.camped=true; }
          else { a.done=true; this.arrive(a,node); } }
        else if(!moving){ // đóng trại dã ngoại; rừng/thung lũng/bến sông thì TỰ MAI PHỤC
          a.camped=true; a.tx=a.x; a.ty=a.y; const ter=this.terAt(a.x,a.y);
          if(a.aiAmbush){ a.aiAmbush=false; if(BW.ambushFit[ter]) a.ambush=true; }
          if(a.owner===this.localFid&&BW.ambushFit[ter]){ a.ambush=true;
            this.texts.push({x:a.x,y:a.y-70,s:'🪤 Ambush at '+(BW.terName[ter]||'')+' x'+this.ambushMult({ter,type:a.type,owner:a.owner}).toFixed(1),col:'#ffd54a',t:0,max:1.6,big:1}); }
          else if(a.owner===this.localFid) this.texts.push({x:a.x,y:a.y-70,s:'⛺ Camp in the field',col:'#cde6ff',t:0,max:1.2}); } }
      else { a.x+=dx/d*sp*dt; a.y+=dy/d*sp*dt; a.trail+=dt; }
    }
    // TẬP KẾT: các đạo quân cùng một lệnh gọi, đã đứng yên gần nhau -> tự gộp vào đạo đông nhất
    { let anyR=false; for(let i=0,AR=this.armies;i<AR.length;i++){ if(AR[i].rally){ anyR=true; break; } }   /* không có lệnh tập kết nào thì khỏi lọc mảng */
      const rs= anyR? this.armies.filter(a=>a.rally&&!a.done&&a.count>0&&a.camped&&!a.btl&&a.to<0) : [];
      for(const a of rs){ if(a.done) continue;
        for(const b2 of rs){ if(b2===a||b2.done||b2.count<=0||b2.rally!==a.rally) continue;
          if(hyp(a.x-b2.x,a.y-b2.y)<=260){ const big=a.count>=b2.count?a:b2, small=big===a?b2:a;
            big.count+=small.count; big.food=Math.max(big.food??0,small.food??0); small.count=0; small.done=true; } } } }
    // DÃ CHIẾN: hai đạo quân đối địch chạm nhau -> MỞ TRẬN kéo dài theo quân số
    for(let i=0;i<this.armies.length;i++){ const A=this.armies[i]; if(A.done||A.count<=0) continue;
      for(let j=i+1;j<this.armies.length;j++){ const B=this.armies[j]; if(B.done||B.count<=0) continue;
        if(!this.isFoe(A.owner,B.owner)) continue;
        if(A.retreatT>0||B.retreatT>0) continue;
        if(A.prep>0||B.prep>0) continue;
        if(A.btl&&B.btl) continue;
        // một bên đã trong trận: bên kia tới gần là NHẬP TRẬN
        if(A.btl!==B.btl&&(A.btl||B.btl)){ const inB=A.btl?A:B, out=A.btl?B:A; const b=this.battleOf(inB.btl);
          if(b&&hyp(out.x-b.x,out.y-b.y)<150){
            if(!this.bJoin(b,out.owner,{kind:'army',ref:out,c0:out.count})){
              // phe thứ 3 nhảy vào: vào phe đối địch với A
              const side= this.isFoe(out.owner,b.A.fid)? b.B : b.A;
              if(side.fid===out.owner) this.bJoin(b,out.owner,{kind:'army',ref:out,c0:out.count});
            } }
          continue; }
        if(A.btl||B.btl) continue;
        if(!A.camped&&!B.camped&&!A.hunt&&!B.hunt){
          const hA= A.hx!=null? Math.atan2(A.hy,A.hx) : Math.atan2((A.to>=0?this.nodes[A.to].y:A.ty??A.y)-A.y,(A.to>=0?this.nodes[A.to].x:A.tx??A.x)-A.x);
          const hB= B.hx!=null? Math.atan2(B.hy,B.hx) : Math.atan2((B.to>=0?this.nodes[B.to].y:B.ty??B.y)-B.y,(B.to>=0?this.nodes[B.to].x:B.tx??B.x)-B.x);
          const dAB=Math.atan2(B.y-A.y,B.x-A.x);
          if(!(Math.cos(hA-dAB)>0.6&&Math.cos(hB-dAB-Math.PI)>0.6)) continue; }
        const engR=(A.ambush||B.ambush)?190:70;
        if(hyp(A.x-B.x,A.y-B.y)>engR) continue;
        let atk=A, df=B; if(A.camped&&!B.camped){ atk=B; df=A; }
        const ter=this.terAt(df.x,df.y);
        let dmu= df.camped? 1.12 : 1; let tag=null;
        if(df.ambush){ const am=this.ambushMult({ter,type:df.type,owner:df.owner}); dmu=Math.max(dmu,am); df.ambush=false;
          tag='🪤 AMBUSH x'+am.toFixed(1)+'!'; this.shakeAt(df.x,df.y,0.6);
          this.texts.push({x:df.x,y:df.y-86,s:tag,col:'#ffd54a',t:0,max:2,big:1}); }
        this.startBattle((A.x+B.x)/2,(A.y+B.y)/2,ter,-1,
          {fid:atk.owner,e:{kind:'army',ref:atk,c0:atk.count}},
          {fid:df.owner,e:{kind:'army',ref:df,c0:df.count}}, dmu, tag);
        break; } }
    this.convoyStep(dt);   // 🐂 đội vận lương chạy theo đường tới các đạo quân đang thiếu lương (src/09d_supply.js)
    // PHỤC KÍCH giữa đường: đạo quân địch đi qua node phục kích -> node CHỦ ĐỘNG tấn công
    let ambN=null; { const N=this.nodes; for(let i=0;i<N.length;i++){ if(N[i].ambush) (ambN||(ambN=[])).push(N[i]); } }   /* chỉ xét các cứ điểm ĐANG mai phục (thường vài cái); không có thì không tạo mảng */
    if(ambN) for(const a of this.armies){ if(a.done||a.btl||a.retreatT>0) continue;
      for(const n of ambN){ if(!n.ambush||!this.isFoe(a.owner,n.owner)||n.count<=0||n.btl) continue;
        if(a._amb&&a._amb.includes(n.id)) continue;
        if(hyp(a.x-n.x,a.y-n.y)>220) continue;
        (a._amb=a._amb||[]).push(n.id); n.ambush=false;
        const mult=this.ambushMult(n); this.shakeAt(n.x,n.y,0.6); audio.hit&&audio.hit();
        this.startBattle((a.x+n.x)/2,(a.y+n.y)/2,n.ter,n.id,
          {fid:a.owner,e:{kind:'army',ref:a,c0:a.count}},
          {fid:n.owner,e:{kind:'node',ref:n,c0:n.count}}, Math.max(this.defMul(n),mult*(BW.terDef[n.ter]||1)),
          '🪤 AMBUSH x'+mult.toFixed(1)+'!');
        a.btl=this.battles[this.battles.length-1].id;
        break; } }
    // ===== TRẬN ĐÁNH diễn tiến theo thời gian =====
    for(const b of this.battles){ if(b.done) continue; b.t+=dt; b.fxT-=dt;
      { let dead=false; for(const e of b.A.es) if(e.ref.done&&e.kind!=='node'){ dead=true; break; } if(dead) b.A.es=b.A.es.filter(e=>!e.ref.done||e.kind==='node'); }
      { let dead=false; for(const e of b.B.es) if(e.ref.done&&e.kind!=='node'){ dead=true; break; } if(dead) b.B.es=b.B.es.filter(e=>!e.ref.done||e.kind==='node'); }
      const sa=this.bSideSum(b.A), sb=this.bSideSum(b.B);
      if(sa<=0.5||sb<=0.5||!b.A.es.length||!b.B.es.length){ this.bEnd(b, sa>sb?b.A:b.B, sa>sb?b.B:b.A); continue; }
      const domA=this.bDom(b.A), domB=this.bDom(b.B);
      let effA=0; for(const e of b.A.es) effA+=e.ref.count*BW.counter(e.ref.type,domB,b.ter)*this.civAtk(e.ref.owner,e.ref.type,b.ter); effA*=b.A.mul*this.pwOf(b.A.fid);
      let effB=0; for(const e of b.B.es) effB+=e.ref.count*BW.counter(e.ref.type,domA,b.ter)*this.civAtk(e.ref.owner,e.ref.type,b.ter); effB*=b.B.mul*this.pwOf(b.B.fid);
      let dA=effB*b.K*dt, dB=effA*b.K*dt;
      if(b.kind==='field'){ const r=Math.max(effA,effB)/Math.max(1e-6,Math.min(effA,effB)), Tm=BW.btlFieldT(r);   /* ⚔️ ngoài đồng: bên yếu hơn tan trong khoảng Tm giây (tính theo quân lúc mở trận) — chênh lệch càng lớn càng nhanh */
        dA=Math.min(dA,b.A0*dt/Tm); dB=Math.min(dB,b.B0*dt/Tm); b.r=r; }
      else if(b.kind==='siege'){ const r= b.r0||(b.r0=Math.max(effA,effB)/Math.max(1e-6,Math.min(effA,effB))), T= b.T||(b.T=BW.btlSiegeT(b.L,r,Math.min(b.A0,b.B0))), m=6/T;   /* 🏰 công trại/thành trấn: quân thủ hao ĐỀU suốt T giây (không sụp ngay rồi kéo đuôi) — viện binh có thời gian kéo về; cường độ hạ theo nên tổng thương vong như cũ */
        dA=Math.min(dA*m,b.A0*dt/T); dB=Math.min(dB*m,b.B0*dt/T); b.r=r; }
      else { dA=Math.min(dA,sa*dt/3); dB=Math.min(dB,sb*dt/3); } // 🪤 phục kích: nhịp cũ — không bên nào bay hơi nhanh hơn 1/3 mỗi giây
      for(const e of b.A.es){ const q=e.ref.count/sa; e.ref.count=Math.max(0,e.ref.count-dA*q); }
      for(const e of b.B.es){ const q=e.ref.count/sb; e.ref.count=Math.max(0,e.ref.count-dB*q); }
      b.accA=(b.accA||0)+dA; b.accB=(b.accB||0)+dB;
      if(b.A.fid===this.localFid) b.lostP=(b.lostP||0)+dA; else if(b.B.fid===this.localFid) b.lostP=(b.lostP||0)+dB;   /* tổn thất của ta trong trận này (🩹 Patch Kit cứu lại 30%) */
      // hiệu ứng theo binh chủng mỗi 0.55s
      if(b.fxT<=0){ b.fxT=0.55;
        if(b.accA>1) this.texts.push({x:b.x-62+Math.random()*30,y:b.y-40,s:'-'+Math.round(b.accA),col: b.A.fid===this.localFid?'#93c5fd':'#fca5a5',t:0,max:0.9,big:(b.accA>200)?1:0});
        if(b.accB>1) this.texts.push({x:b.x+42+Math.random()*30,y:b.y-52,s:'-'+Math.round(b.accB),col: b.B.fid===this.localFid?'#93c5fd':'#fca5a5',t:0,max:0.9,big:(b.accB>200)?1:0});
        b.accA=0; b.accB=0;
        const fx1={rng:'fx:clash1',cav:'fx:dust2',inf:'fx:clash1',sh:'fx:clash1'};
        this.addFx(b.x+(Math.random()-0.5)*70,b.y+(Math.random()-0.5)*50,(sa+sb>1800)?'fx:clash2':fx1[BW.cls(domA)],110,0.5);
        if(BW.cls(domA)==='cav'||BW.cls(domB)==='cav') this.addFx(b.x-40,b.y+16,'fx:dust2',96,0.6);
        if(b.ter==='forest') this.addFx(b.x,b.y-30,'fx:leaves',110,0.7);
        if(b.ter==='river') this.addFx(b.x,b.y+10,'fx:splash',110,0.6);
        if(BW.cls(domA)==='rng'||BW.cls(domB)==='rng') b.arrowT=0.4;
        this.shakeAt(b.x,b.y,2); }
      if(b.arrowT!=null){ b.arrowT-=dt; if(b.arrowT<=0) b.arrowT=null; }
    }
    if(bwAnyDone(this.battles)) this.battles=this.battles.filter(b=>!b.done);
    if(bwAnyDone(this.armies)) this.armies=this.armies.filter(a=>!a.done);
    // toán do thám + LỘ Ổ MAI PHỤC khi bị do thám quét qua
    const revealAmbushNear=(x,y,fid)=>{
      if(ambN) for(const n of ambN){ if(n.ambush&&this.isFoe(fid,n.owner)&&hyp(n.x-x,n.y-y)<260){ n.ambush=false;
        if(n.owner===this.localFid) this.note('🚨 Scouts uncovered an ambush!',n.x,n.y,'🚨'); } }
      for(const a of this.armies){ if(a.ambush&&this.isFoe(fid,a.owner)&&hyp(a.x-x,a.y-y)<260){ a.ambush=false;
        if(a.owner===this.localFid) this.note('🚨 Ambush exposed — surprise lost!',a.x,a.y,'🚨'); } }
    };
    for(const s2 of this.scouts){ const to=this.nodes[s2.to]; const dx=to.x-s2.x, dy=to.y-s2.y, d=hyp(dx,dy);
      const sp=250*(BW_SCOUT_MV[this.terAt(s2.x,s2.y)]||1);
      revealAmbushNear(s2.x,s2.y,s2.fid??this.localFid);
      if(d<=sp*dt){ s2.done=true; to.scoutT=this.time; to.known={count:to.count,type:to.type,t:this.time};
        this.texts.push({x:to.x,y:to.y-82,s:'🕵️ Scouted — troops revealed for 30s!',col:'#7dffcf',t:0,max:1.8,big:1}); audio.recruit(); }
      else { s2.x+=dx/d*sp*dt; s2.y+=dy/d*sp*dt; } }
    if(bwAnyDone(this.scouts)) this.scouts=this.scouts.filter(s2=>!s2.done);
    // trinh sát của ĐỊCH: lùng ổ mai phục của ta
    this.nextAiScout-=dt;
    if(this.nextAiScout<=0){ this.nextAiScout=24+this.rnd()*10;
      const foes=[...new Set(this.nodes.filter(n=>n.owner!==this.localFid&&n.owner!==2&&(n.count>0||n.camp)).map(n=>n.owner))];
      const fid=foes[(this.rnd()*foes.length)|0];
      if(fid!=null&&(typeof this.lv!=='number'||this.lv>=2)){
        const froms=this.nodes.filter(n=>n.owner===fid&&n.count>100);
        const tgts=this.nodes.filter(n=>n.owner===this.localFid&&n.count>0);
        if(froms.length&&tgts.length){ const f0=froms[(this.rnd()*froms.length)|0], t0=tgts[(this.rnd()*tgts.length)|0];
          this.aiScouts.push({x:f0.x,y:f0.y,tx:t0.x+(this.rnd()-0.5)*300,ty:t0.y+(this.rnd()-0.5)*200,fid}); } } }
    for(const s2 of this.aiScouts){ const dx=s2.tx-s2.x, dy=s2.ty-s2.y, d=hyp(dx,dy);
      revealAmbushNear(s2.x,s2.y,s2.fid);
      if(d<=260*dt){ s2.done=true; } else { s2.x+=dx/d*260*dt; s2.y+=dy/d*260*dt; } }
    if(bwAnyDone(this.aiScouts)) this.aiScouts=this.aiScouts.filter(s2=>!s2.done);
    { let dead=false; for(const f of this.fxs){ f.t+=dt; if(!(f.t<f.life)) dead=true; } if(dead) this.fxs=this.fxs.filter(f=>f.t<f.life); }
    this._visT=(this._visT||0)-dt; if(this._visT<=0){ this._visT=0.1; this._updateVision(); } // cập nhật tầm nhìn 10 lần/giây
    // ===== kinh tế + LƯƠNG THẢO mỗi nhịp =====
    this.regenT+=dt;
    if(this.regenT>=BW.ecoEvery){ this.regenT-=BW.ecoEvery;
      const F=this.localFid;
      const facs=[...new Set(this.nodes.filter(n=>n.owner!==2).map(n=>n.owner))];
      // ===== TRẦN QUÂN THEO LƯƠNG (mọi phe, gồm người chơi) =====
      // 1) đạt trần -> ngừng sinh quân · 2) vượt trần -> hao lương kho; kho cạn -> đào ngũ 1.5%/nhịp
      this.capInfo=this.capInfo||{};
      for(const f of facs){
        const cap=this.supplyCap(f);
        const tot=this.myPower(f);
        const over=tot-cap; let starving=false;
        if(over>0){ let need=over/60; // lương phải bù cho phần quân vượt trần
          for(const n of this.nodes){ if(need<=0) break; if(n.owner!==f||!(n.food>0)) continue; const t2=Math.min(n.food,need); n.food-=t2; need-=t2; }
          if(need>0){ starving=true; let lost=0; const rate=0.015*Math.max(1,Math.min(2,over/Math.max(1,cap)));   // vượt trần càng xa, đào ngũ càng nhanh (1,5% → tối đa 3% mỗi nhịp)
            for(const n of this.nodes){ if(n.owner!==f||n.count<=1||n.btl) continue; const d=Math.max(1,Math.round(n.count*rate)); n.count-=d; lost+=d; }
            for(const a of this.armies){ if(a.owner!==f||a.count<=1||a.btl||a.done) continue; const d=Math.max(1,Math.round(a.count*rate)); a.count-=d; lost+=d; }
            if(f===F&&(this._desN=(this._desN||0)+1)%3===1){ const c0=this.nodes.find(n=>n.camp&&n.owner===F)||this.nodes[0]; this.note(`🏳️ Overstretched ${Math.round(tot)}/${cap} — granaries empty, ${lost} troops deserted!`,c0.x,c0.y,'🏳️'); }
            if(f===1&&this.fed[f]!==false){ const ec=this.nodes.find(n=>n.camp&&n.owner===1)||this.nodes[1]; this.texts.push({x:ec.x,y:ec.y-110,s:'🌾 Enemy overstretched — troops deserting!',col:'#ffd54a',t:0,max:2.2,big:1}); } }
          else if(f===F&&!this._ovWarn){ this._ovWarn=1; const c0=this.nodes.find(n=>n.camp&&n.owner===F)||this.nodes[0]; this.note(`⚠️ Troops exceed supply capacity (${cap}) — eating into the granaries!`,c0.x,c0.y,'⚠️'); } }
        else if(f===F) this._ovWarn=0;
        this.fed[f]=!starving;
        this.capInfo[f]={cap,tot,full:tot>=cap};
      }
      // BAO VÂY: node bị vây -> ngừng sản xuất + hao lương nhanh
      for(const n of this.nodes){ n.sieged=false;
        if(n.owner===2||n.count<=0) continue;
        for(const a of this.armies){ if(a.done||!a.sieging||a.sieging!==n.id||!this.isFoe(a.owner,n.owner)) continue;
          if(hyp(a.x-n.x,a.y-n.y)<260){ n.sieged=true; break; } } }
      for(const n of this.nodes){ if(!n.eco||n.owner===2||n.sieged||n.btl) continue;
        const ci=this.capInfo[n.owner]; const capFull= ci&&ci.full;
        const cvG=this.civOf(n.owner), grow=(n.owner===F? this.L.grow : this.L.enGrow*this.D.grow)*(cvG&&cvG.grow? cvG.grow : 1);
        const slow=Math.max(0.15,1-n.count/(n.cap||900)); // 3) càng đầy càng hồi chậm
        const base= capFull? 0 : n.eco==='farm'? Math.round(grow*slow) : n.eco==='granary'? 0 : Math.round(grow*0.45*slow);
        if(base&&n.count<(n.cap||900)){ n.count=Math.min(n.cap||900, n.count+base);
          if(n.owner===F) this.texts.push({x:n.x+40,y:n.y-40,s:'+'+base,col:n.eco==='farm'?'#ffd54a':'#93c5fd',t:0,max:0.9}); }
        // sản xuất LƯƠNG
        if(n.eco==='farm') n.food=Math.min(400,(n.food||0)+Math.round(grow*0.6));
        if(n.eco==='granary') n.food=Math.min(n.cap||700,(n.food||0)+14);
      }
      // node bị vây: hao lương, hết lương thì chết đói
      for(const n of this.nodes){ if(!n.sieged||n.count<=0) continue;
        n.food=Math.max(0,(n.food||0)-(6+n.count/300));
        if(n.food<=0){ n.count=Math.max(0,Math.round(n.count*0.96));
          if(n.owner===F&&(this._sgN=(this._sgN||0)+1)%4===1) this.note('⛓️ Besieged city is starving!',n.x,n.y,'⛓️'); } }
      // LƯƠNG của từng đạo quân: tiêu hao theo quân số; gần node phe mình có lương thì nhận tiếp tế
      for(const a of this.armies){ if(a.done||a.count<=0) continue;
        a.food=a.food??BW.food.start;
        const drain=this.foodDrain(a);   // bao lương tính theo thời gian hành quân, không teo theo quân số (src/09d_supply.js)
        a.food-=drain;
        if(a.food<BW.food.max*0.6){ // tìm tiếp tế
          for(const n of this.nodes){ if(n.owner!==a.owner||(n.food||0)<=0) continue;
            if(hyp(n.x-a.x,n.y-a.y)>BW.food.siphonR) continue;
            const per=this.supplyCost(a.count,100)/100, need=BW.food.max-a.food, take=Math.min(need,n.food/per);   // đạo càng đông càng tốn kho
            a.food+=take; n.food-=take*per;
            if(a.owner===F&&take>20) this.texts.push({x:a.x,y:a.y-56,s:'🌾 +'+Math.round(take)+' supply',col:'#ffe08a',t:0,max:1});
            break; } }
        if(a.food<=0){ a.food=0; a.count=Math.round(a.count*(1-BW.food.starve));
          if(a.owner===F&&!a._hungryN){ a._hungryN=1; this.note('🌾 Army out of supply — about to disband!',a.x,a.y,'🌾'); }
          if(a.count<BW.food.disband){ a.done=true; if(!a.btl)
            this.texts.push({x:a.x,y:a.y-60,s:'🏳️ Disbanded — out of supply!',col:'#ff8a8a',t:0,max:1.6,big:1}); } } }
      this.supplyTick();   // 🐂 đạo quân sắp hết lương → cứ điểm gần nhất có lương cho đội vận lương lên đường
      // viện quân trại
      for(const n of this.nodes){ if(!n.camp||n.sieged||n.btl) continue;
        const ci2=this.capInfo[n.owner]; if(ci2&&ci2.full){ n.food=Math.min(600,(n.food||0)+(n.owner===F?20:12)); continue; }
        const campCap=Math.round(this.L.camp*(this.royale?0.7:1.6)), slow2=Math.max(0.15,1-n.count/campCap);
        const gm=((this.civOf(n.owner)||{}).grow||1)*(this.up? this.upMul('aura',n.owner) : 1);   /* ⚒️ Lò rèn: Recruiting */
        if(n.owner===F){ n.count+=Math.round((24+6*(typeof this.lv==='number'?this.lv:1))*slow2*gm); if(n.type==='general') n.type=this.civType(n.owner); n.food=Math.min(600,(n.food||0)+20); }
        else if(n.owner!==2){ n.count=Math.min(campCap, n.count+Math.round((this.royale?7:14)*this.L.aiPow*this.D.grow*slow2*gm)); n.food=Math.min(400,(n.food||0)+12); } }
    }
    // AI các phe
    this.nextAI-=dt;
    if(this.nextAI<=0){
      const foes=[...new Set(this.nodes.filter(n=>n.owner!==this.localFid&&n.owner!==2&&(n.count>0||n.camp)).map(n=>n.owner))];
      if(this.royale){ this._rr=(this._rr||0); const Q=this._aiQ||(this._aiQ=[]);
        for(let k=0;k<Math.min(5,foes.length);k++){ const fid=foes[(this._rr+k)%foes.length]; if(Q.indexOf(fid)<0) Q.push(fid); }
        this._rr+=5; this._aiDip=true; }
      else for(const fid of foes) this.aiTurn(fid);
      this.nextAI=this.L.ai*(0.8+this.rnd()*0.5)*(this.royale?0.7:1)*this.D.tempo;
    }
    // (5.1) Quần Hùng: mỗi khung hình chỉ MỘT nước ra quyết định (trước đây 5 nước cùng nghĩ trong một khung hình → thỉnh thoảng khựng hình); xong lượt thì mới xét bang giao
    if(this._aiQ&&this._aiQ.length){ const fid=this._aiQ.shift(); if(this.nodes.some(n=>n.owner===fid&&(n.count>0||n.camp))) this.aiTurn(fid); }
    else if(this._aiDip){ this._aiDip=false; this.aiDiplomacy(); }
    // hiệu ứng
    { let dead=false; for(const t of this.texts){ t.t+=dt; if(t.part){ t.x+=t.vx*dt; t.y+=t.vy*dt; t.vy+=260*dt; } if(!(t.t<t.max)) dead=true; } if(dead) this.texts=this.texts.filter(t=>t.t<t.max); }
    { let dead=false; for(const r of this.rings){ r.t+=dt; if(!(r.t<r.max)) dead=true; } if(dead) this.rings=this.rings.filter(r=>r.t<r.max); }
    { let dead=false; for(const nt of this.notes){ nt.t+=dt; if(!(nt.t<7)) dead=true; } if(dead) this.notes=this.notes.filter(nt=>nt.t<7); }
    if(this.shake>0) this.shake=Math.max(0,this.shake-dt*26);
    this.stats.peak=Math.max(this.stats.peak,this.myPower());
    // thắng/thua
    this.checkVictory();
  }
  checkVictory(){
    if(this.over) return; const F=this.localFid;
    // THUA chỉ khi không còn TRẠI nào (kinh đô mất mà còn trại khác thì đã dời đô)
    if(!this.nodes.some(n=>n.camp&&n.owner===F)){ this.over=true; this.result={win:false}; audio.lose(); return; }
    const foeCamp=this.nodes.some(n=>n.camp&&n.owner!==F&&n.owner!==2);
    if(!foeCamp){ this.over=true; this.result={win:true}; audio.win(); }
  }
  arrive(a,n){
    const F=this.localFid;
    const txt=(s,col,big)=>{ this.texts.push({x:n.x,y:n.y-70,s,col,t:0,max:1.4,big}); };
    // địch tới trong lúc quân ta còn đang CHUẨN BỊ LƯƠNG trước cổng: huỷ lệnh, quay vào giữ thành (không để thành trống mất oan)
    if(this.isFoe(a.owner,n.owner)){ let back=0; for(const p of this.armies){ if(p.done||!(p.prep>0)||p.from!==n.id||p.owner!==n.owner||p.btl) continue; n.count+=p.count; if(p.count>n.count*0.5) n.type=p.type; back+=p.count; p.count=0; p.done=true; }
      if(back>0&&n.owner===F) this.note('⚠️ March cancelled — enemy at the gates, '+Math.round(back)+' troops returned to the walls',n.x,n.y,'⚠️'); }
    // node đang GIAO TRANH: nhập trận theo phe
    if(n.btl){ const b=this.battleOf(n.btl);
      if(b){ a.done=false; a.x=n.x+(this.rnd()-0.5)*60; a.y=n.y+70;
        if(!this.bJoin(b, a.owner, {kind:'army',ref:a,c0:a.count})){
          const side= this.isFoe(a.owner,b.A.fid)? b.B : b.A;
          if(side.fid===a.owner) this.bJoin(b,a.owner,{kind:'army',ref:a,c0:a.count}); else { a.camped=true; }
        }
        return; } n.btl=null; }
    if(n.count<=0){ const prev=n.owner; n.owner=a.owner; n.type=a.type; n.count=a.count; n.food=(n.food||0); this.ring(n,BW.facPal(a.owner).color); this.checkCamp(n,a.owner,prev); return; }
    if(n.owner===a.owner){ // gộp quân + TIẾP LƯƠNG từ kho
      n.count+=a.count;
      if(n.eco==='train'&&n.trainType){ if(n.type!==n.trainType||a.type!==n.trainType||n.mix){ n.type=n.trainType; n.mix=null; if(a.owner===F){ txt(`⚒️ Switched to ${UNIT[n.trainType].name}!`,'#93c5fd',true); audio.recruit(); } } }
      else this.mixAdd(n,a.type,a.count,n.count-a.count);
      n.food=(n.food||0)+Math.round((a.food||0)*0.5);
      if(a.owner===F){ txt('+'+Math.round(a.count),'#7dffcf'); audio.pickup(); }
      this.ring(n,'#ffffff'); return; }
    if(n.owner===2){ // trung lập: đông hơn thì quy thuận; ít hơn -> MỞ TRẬN
      const DK=this.D&&!this.royale&&!this.cfg.p2p&&!this.cfg.classic? this.D : null, needK= DK? DK.defK : 1;   /* (5.4) ải cao: quân trung lập khó dụ hơn — phải đông gấp k lần mới chịu quy thuận, và chỉ một phần theo ta */
      if(a.count<n.count*needK){
        a.done=false; a.x=n.x; a.y=n.y+70;
        this.startBattle(n.x,n.y-6,n.ter,n.id,
          {fid:a.owner,e:{kind:'army',ref:a,c0:a.count}},
          {fid:2,e:{kind:'node',ref:n,c0:n.count}}, this.defMul(n));
        return; }
      const gain=Math.round(n.count*(DK? DK.defG : 1)); const prev=n.owner; n.owner=a.owner; n.type=a.type; n.count=a.count+gain; n.food=(n.food||0)+Math.round((a.food||0)*0.5);
      if(a.owner===F){ this.stats.eat+=gain; txt(`+${gain} defected to you!`,'#ffd54a',true); audio.recruit(); if(n.x>BW.W*0.45) this.nextAI=Math.min(this.nextAI,4); }
      this.ring(n,'#ffd54a'); this.burst(n,'#ffd54a'); this.checkCamp(n,a.owner,prev); return; }
    // CÔNG THÀNH -> mở TRẬN kéo dài (phục kích node thì x2–x10)
    let dmu=this.defMul(n); let tag=null;
    { const cvA=this.civOf(a.owner); if(cvA&&cvA.siege&&n.struct) dmu=Math.max(1,dmu/cvA.siege); }
    if(n.ambush&&this.isFoe(a.owner,n.owner)){ const am=this.ambushMult(n); dmu=Math.max(dmu, am*(BW.terDef[n.ter]||1)); n.ambush=false;
      tag='🪤 AMBUSH x'+am.toFixed(1)+'!'; this.shakeAt(n.x,n.y,0.5);
      this.texts.push({x:n.x,y:n.y-96,s:tag,col:'#ffd54a',t:0,max:2,big:1}); }
    a.done=false; a.x=n.x+(this.rnd()-0.5)*40; a.y=n.y+72;
    this.shakeAt(n.x,n.y,5); this.burst(n, a.owner===F?'#ffd166':'#ff8a8a'); audio.hit('charge');
    this.startBattle(n.x,n.y-6,n.ter,n.id,
      {fid:a.owner,e:{kind:'army',ref:a,c0:a.count}},
      {fid:n.owner,e:{kind:'node',ref:n,c0:n.count}}, dmu, tag||((a.owner===F||n.owner===F)?'🏰 ASSAULT '+(BW.structName[n.struct]||''):null));
  }
  // KINH ĐÔ (capOf) khác với trại đã chiếm. Mất một trại đã chiếm chỉ là mất một điểm.
  // Mất KINH ĐÔ: nếu còn trại khác thì DỜI ĐÔ về đó; chỉ khi hết trại mới mất nước (lãnh thổ quy hàng phe chiếm).
  checkCamp(n,captor,prevOwner){
    if(!n.camp||this.over) return;
    const F=this.localFid;
    n.home=captor;
    const lost=n.capOf, CF=BW.coinsFor;
    if(lost==null||lost!==prevOwner){ if(captor===F&&prevOwner!==F&&prevOwner!==2&&!n._coin&&this.coin){ n._coin=1; this.coin(CF.camp,'enemy camp taken',n.x,n.y); } this.checkVictory(); return; } // trại thường (hoặc trại đã chiếm): chỉ là mất một điểm
    n.capOf=null;
    const other=this.nodes.filter(m=>m.camp&&m.owner===lost&&m!==n).sort((a,b)=>b.count-a.count)[0];
    if(other){ other.capOf=lost; other.home=lost;
      if(lost===F||captor===F||this.royale) this.note(lost===F? '🏯 Capital lost — MOVING THE CAPITAL to another camp, the fight goes on!' : '🏯 '+this.natName(lost)+' lost its capital and moved it', other.x,other.y,'🏯');
      if(captor===F&&this.coin){ n._coin=1; this.coin(CF.capital,'enemy capital taken',n.x,n.y); }
      this.checkVictory(); return; }
    // không còn trại nào: mất nước, toàn bộ lãnh thổ + quân đội QUY HÀNG phe chiếm
    let moved=0;
    for(const m of this.nodes){ if(m.owner===lost){ m.owner=captor; m.ambush=false; moved+=m.count; } }
    for(const a2 of this.armies){ if(a2.owner===lost){ a2.owner=captor; a2.ambush=false; } }
    for(const cv of (this.convoys||[])){ if(cv.owner===lost) cv.owner=captor; }
    // các TRẬN ĐANG ĐÁNH DỞ của nước vừa mất: quân đã quy hàng nên phe trong trận cũng đổi cờ; nếu đang đánh với chính phe chiếm thì ngừng đánh.
    // (Lỗi cũ: trận vẫn ghi phe của nước đã mất → thắng trận là cứ điểm "về tay" một nước không còn tồn tại, nước đó SỐNG LẠI trên bản đồ.)
    for(const b of this.battles){ if(b.done) continue; const sL= b.A.fid===lost? b.A : b.B.fid===lost? b.B : null; if(!sL) continue; const sO= sL===b.A? b.B : b.A;
      if(sO.fid===captor||!this.isFoe(captor,sO.fid)){ b.done=true; for(const S of [b.A,b.B]) for(const e of S.es){ if(e.ref.btl===b.id) e.ref.btl=null; if(e.kind==='army'&&!e.ref.done&&e.ref.count>0){ e.ref.camped=true; e.ref.tx=e.ref.x; e.ref.ty=e.ref.y; e.ref.to=-1; e.ref.hunt=null; } } }
      else sL.fid=captor; }
    if(this.royale&&(captor===F||lost===F||moved>0)) this.note(('👑 A nation has fallen — '+(captor===F?'taken by US!':'changed hands!')),n.x,n.y,'👑');
    if(captor===F&&lost!==F&&this.coin){ n._coin=1; this.coin(CF.nation,'a whole nation conquered',n.x,n.y); }
    this.checkVictory();
  }
  ring(n,col){ this.rings.push({x:n.x,y:n.y,col,t:0,max:0.6}); }
  burst(n,col){ for(let i=0;i<14;i++){ const a2=Math.random()*Math.PI*2, sp=60+Math.random()*160; this.texts.push({part:1,x:n.x,y:n.y-20,vx:Math.cos(a2)*sp,vy:Math.sin(a2)*sp-60,col,t:0,max:0.7}); } }
  aiDiplomacy(){ // các nước đánh giá THẾ CỤC rồi kết giao / cắt giao
    const F=this.localFid;
    const nf=[...new Set(this.nodes.filter(n=>n.camp&&n.owner!==F&&n.owner!==2).map(n=>n.owner))]; if(nf.length<2) return;
    const pw={}; for(const f of nf) pw[f]=this.myPower(f); const P0=this.myPower(F);
    const sorted=nf.map(f=>pw[f]).sort((a,b)=>a-b), med=sorted[sorted.length>>1]||1, top=sorted[sorted.length-1]||1;
    // 🔥 TA QUÁ MẠNH -> liên minh chống ta (có trễ để không bật/tắt liên tục)
    // ngưỡng theo nước TRUNG BÌNH (gấp 4 lần) hoặc vượt cả nước mạnh nhất; tắt khi tụt dưới 3 lần và dưới 85% nước mạnh nhất
    const was=this.coalition; if(P0>4*med||P0>=top) this.coalition=true; else if(P0<3*med&&P0<top*0.85) this.coalition=false;
    this.playerWeak= P0<med*0.7;
    const c0=this.nodes.find(n=>n.camp&&n.owner===F)||this.nodes[0];
    if(this.coalition&&!was) this.note('⚠️ The realm fears your might — nations are forming an ALLIANCE AGAINST YOU!',c0.x,c0.y,'⚠️');
    if(!this.coalition&&was) this.note('🕊️ The alliance against you has collapsed',c0.x,c0.y,'🕊️');
    const terr=this.nodes.filter(n=>n.owner===F);
    const nearMe=(f)=>{ const cs=this.nodes.filter(n=>n.owner===f); let bd=1e9; for(const a of cs) for(const b of terr){ const d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y); if(d<bd) bd=d; } return bd; };
    if(this.coalition){
      // các nước gần ta kết giao với nhau; đồng minh của ta bỏ ta
      const close=nf.filter(f=>nearMe(f)<7000);
      for(let k=0;k<3;k++){ const f=close[(this.rnd()*close.length)|0], g=close[(this.rnd()*close.length)|0];
        if(f!=null&&g!=null&&f!==g&&!this.allied(f,g)&&!this.natAtWar(f,g)&&this.rnd()<0.6) this.setAlly(f,g,true); }
      for(const f of nf) if(this.allied(F,f)&&this.rnd()<0.12){ this.setAlly(F,f,false); const cc=this.nodes.find(n=>n.camp&&n.owner===f); if(cc) this.note('💔 '+this.natName(f)+' betrayed us and broke the alliance!',cc.x,cc.y,'💔'); }
      return; }
    // ta yếu / cân bằng: các nước tự lo — cắt giao để thôn tính nhau, kết giao ngẫu nhiên
    if(this.rnd()>0.35) return;
    const f=nf[(this.rnd()*nf.length)|0], g=nf[(this.rnd()*nf.length)|0]; if(f===g) return;
    if(this.allied(f,g)){ if(this.rnd()<(this.playerWeak?0.25:0.1)) this.setAlly(f,g,false); return; }
    if(this.natAtWar(f,g)) return;
    if(this.rnd()<(this.playerWeak?0.25:0.5)) this.setAlly(f,g,true);
  }
  // chọn TỔ HỢP binh chủng khắc chế mục tiêu (theo loại quân & địa hình), các cánh đến cùng lúc
  aiCombo(fid,tgt,en,n,reach){
    const est=this.aiSee(tgt,fid), ter=tgt.ter||this.terAt(tgt.x,tgt.y);
    const cand=en.filter(e=>!e.ambush&&!e.btl&&!e.aiAmbush&&hyp(e.x-tgt.x,e.y-tgt.y)<=reach);
    const score=(e)=>e.count*BW.counter(e.type,est.type||'spear',ter)*(e.type==='archer'||e.type==='crossbow'?1.08:1);
    const pick=[...cand].sort((a,b)=>score(b)-score(a)).slice(0,n);
    // thêm 1 cánh cung/nỏ yểm trợ nếu chưa có
    if(pick.length>=2&&!pick.some(e=>e.type==='archer'||e.type==='crossbow')){ const sup=cand.find(e=>(e.type==='archer'||e.type==='crossbow')&&!pick.includes(e)); if(sup) pick[pick.length-1]=sup; }
    return pick;
  }
  sendCoordinated(srcs,tgt){ // hợp đồng tác chiến: cánh gần chờ cánh xa để cùng ập vào
    const eta=srcs.map(e=>this.pathEta(e,tgt.x,tgt.y)), as=srcs.map(e=>this.aiSend(e,tgt)), tot=as.map((a,i)=>a? eta[i]+(a.prep||0) : 0), mx=Math.max(...tot);   // tới nơi = chuẩn bị lương + đi đường
    as.forEach((a,i)=>{ if(a&&mx-tot[i]>1) a.holdT=Math.min(40,mx-tot[i]); }); }
  aiTurn(fid){ fid=fid??1;
    const L=this.L; this.aiWave=(this.aiWave||0)+1;
    const F=this.localFid;
    const mine=this.nodes.filter(n=>this.isFoe(n.owner,fid)&&n.count>0&&!n.btl); // mọi mục tiêu thù địch (gồm cả nước AI khác)
    const en=this.nodes.filter(n=>n.owner===fid&&!n.camp&&n.count>120&&!n.btl);
    const flying=this.armies.filter(a2=>a2.owner===fid).length;
    const D=this.D, hate= this.time>300? D.hate : Math.min(0,D.hate); if(flying>=D.fly) return;   /* mức Khó: 5 phút đầu các nước chưa hùa nhau đánh ta */
    const dist=(p2,q)=>hyp(p2.x-q.x,p2.y-q.y);
    const announce=(e,s2)=>{ if(!this.royale||fid===1) this.texts.push({x:e.x,y:e.y-85,s:s2,col:'#ff8a8a',t:0,max:1.5,big:1}); };
    let budget= D.budget+(!this.royale&&this.aiWave%3===0? 1:0);
    const tier=BW_AI_TIER(this.lv,this.royale);
    // 0) phòng thủ
    this.aiAlarm(fid,announce); if(this.aiSnipe(fid,en)) budget--;
    if(D.iq>=2){ budget=this.aiDefend(fid,budget,announce); if(D.iq>=3&&!this.royale) budget=this.aiIntercept(fid,en,budget,announce); }
    else for(const atk of this.armies){ if(budget<=0) break; if(!this.isFoe(atk.owner,fid)) continue; if(atk.owner===F&&(atk.smokeT>0||!this.aiVis(atk.x,atk.y,fid))) continue;   /* 💨 đạo quân trong khói: máy không thấy */
      const tgt=atk.to>=0?this.nodes[atk.to]:null; if(!tgt||tgt.owner!==fid) continue;
      const [ra]=bwResolve(atk.type,atk.count,tgt.type,tgt.count,this.defMul(tgt),tgt.ter); if(ra<=0) continue;
      let hp=null,hd=1e9; for(const e of en){ if(e===tgt) continue; const d=dist(e,tgt); if(d<=BW.range&&d<hd&&e.count>200){ hd=d; hp=e; } }
      if(hp){ this.aiSend(hp,tgt); announce(hp,'🛡️ Enemy reinforcements!'); budget--; } }
    // 0b) GIẢI VÂY: node bị vây mà đủ mạnh thì xuất kích đánh quân vây
    for(const n of this.nodes){ if(budget<=0) break; if(n.owner!==fid||!n.sieged||n.count<300) continue;
      let bes=null; for(const a2 of this.armies){ if(a2.sieging===n.id&&this.isFoe(a2.owner,fid)){ bes=a2; break; } }
      if(bes&&n.count>bes.count*1.25){ const a3=this.send(n,bes); if(a3) announce(n,'⚔️ Sortie to break the siege!'); budget--; } }
    // 1) tổng tấn công theo đợt (chỉ phe chính ở 1v1; quần hùng thì nước nào cũng có nhịp riêng thưa hơn)
    this.nextWaveF=this.nextWaveF||{};
    if(this.nextWaveF[fid]==null) this.nextWaveF[fid]=L.wave*(this.royale?2.2:1.3)*(0.8+this.rnd()*0.5);
    if(this.time>=this.nextWaveF[fid]){
      this.nextWaveF[fid]=this.time+L.wave*(this.royale?2.0:1);
      const nSrc= this.royale? 3 : tier===3? 4 : tier===2? 3 : (2+((typeof this.lv==='number'&&this.lv>2)?1:0));
      let src=[...en].filter(e=>!e.ambush&&!e.btl&&!e.aiAmbush).sort((x,y)=>y.count-x.count).slice(0,nSrc);
      const reach=this.royale? 3200 : 1e9;
      let tgt=null,td=-1e9; for(const m of mine){ if(m.ambush) continue; if(m.owner===F&&(this.royale? this.time<D.grace : (m.camp&&this.time<240))) continue; if(this.royale&&src[0]&&dist(m,src[0])>reach) continue;
        const see=this.aiSee(m,fid); let sc=(m.owner===F?300+hate:0)+(fid===1&&!this.royale? this.pA(m)*4800*(D.iq>=2?0.35:1):0)+(m.eco?400:0)-see.count*0.4-dist(m,src[0]||m)*0.1;
        if(this.royale){ if(m.owner===F){ if(this.coalition) sc+=2500+see.count*0.3; else if(this.playerWeak) sc-=900; }
          else if(this.natAtWar(m.owner,m.owner)||this.battles.some(b=>!b.done&&(b.A.fid===m.owner||b.B.fid===m.owner))) sc+=600; // thừa lúc nước khác đang bận đánh nhau
          if(m.camp) sc+=900; }
        if(sc>td){td=sc;tgt=m;} }
      if(tgt&&tier>=2) src=this.aiCombo(fid,tgt,en,nSrc,reach);
      if(tgt&&src.length){ // bậc 2-3 chỉ xuất quân khi tổng lực áp đảo mục tiêu (đã tính theo tầm nhìn)
        const need= tier===3? 1.9 : tier===2? 1.45 : 0;
        const sum=src.reduce((t,e)=>t+e.count,0)*(1-D.keep), seen=this.aiSee(tgt,fid).count||tgt.count;
        // 🤝 LIÊN QUÂN: khi thiên hạ chống ta, các đồng minh gần đó cùng góp quân đánh một mục tiêu
        if(this.royale&&this.coalition&&tgt.owner===F){
          const parts=[...new Set(this.nodes.filter(n=>n.owner!==F&&n.owner!==2&&n.owner!==fid&&this.allied(fid,n.owner)).map(n=>n.owner))];
          let all=[...src], nat=1;
          for(const g of parts){ const enG=this.nodes.filter(n=>n.owner===g&&!n.camp&&n.count>120&&!n.btl); const pk=this.aiCombo(g,tgt,enG,2,reach); if(pk.length){ all=all.concat(pk); nat++; } if(nat>=4) break; }
          const tot=all.reduce((t,e)=>t+e.count,0);
          if(nat>=2&&tot>=1.2*seen){ this.sendCoordinated(all,tgt); this.note(`⚔️ ALLIED ARMIES of ${nat} nations are marching on you!`,tgt.x,tgt.y,'⚔️'); return; } }
        if(sum>=need*seen){ if(D.iq>=3&&!this.royale){ const t2=this.aiTwoProng(fid,src,tgt,mine,need); if(t2){ this.note('⚔️ TWO-PRONGED ASSAULT — the enemy strikes two of your strongholds at once!',t2.x,t2.y,'⚔️'); audio.drum&&audio.drum(true); return; } }
          if(tier>=2&&src.length>1) this.sendCoordinated(src,tgt); else for(const s2 of src){ this.aiSend(s2,tgt); } announce(tgt,`🌊 ALL-OUT ATTACK!`); audio.drum&&audio.drum(this.royale?false:true); return; }
        else if(tier>=2){ this.nextWaveF[fid]=this.time+L.wave*0.5; /* gom thêm quân rồi đánh */ } else { for(const s2 of src){ this.aiSend(s2,tgt); } announce(tgt,`🌊 ALL-OUT ATTACK!`); audio.drum&&audio.drum(this.royale?false:true); return; } } }
    // 2) khắc chế: đổi binh chủng ở lò luyện
    if(budget>0 && this.aiWave%2===0 && mine.length){
      const seen=mine.filter(m=>m.owner!==F||((this.aiVis(m.x,m.y,fid))&&!m.ambush));
      const big=[...(seen.length?seen:mine)].sort((x,y)=>y.count-x.count)[0];
      const trains=this.nodes.filter(n=>n.owner===fid&&n.eco==='train');
      for(const tr of trains){ if(budget<=0) break; if(BW.counter(tr.trainType,big.type)<1.15) continue;
        let src2=null,sd=1e9; for(const e of en){ if(e.eco) continue; const d=dist(e,tr); if(d<=BW.range&&d<sd&&e.count>300&&e.type!==tr.trainType){ sd=d; src2=e; } }
        if(src2){ this.aiSend(src2,tr); budget--; } } }
    // 3) bành trướng trung lập/kinh tế
    if(budget>0 && !((typeof this.lv==='number'&&this.lv<=2) && this.aiWave%2===1)){ let best=null,bs=-1e9;
      for(const e of en){ for(const n of this.nodes){ if(n.owner!==2||n.btl) continue; if(!this.royale&&this.pA(n)<D.safe) continue; const d=dist(e,n); if(d>BW.range) continue;
        let ok2= e.count*(1-D.keep)>n.count; let gain= ok2? n.count : 0;
        if(!ok2){ const [ra]=bwResolve(e.type,Math.round(e.count*(1-D.keep)*this.aiOver()),n.type,n.count,BW.defBonus); ok2=ra>0; gain=ra*0.3; }
        if(!ok2) continue; const sc=gain+(n.eco?500+(n.eco==='farm'?200:0):0)-d*0.2;
        if(sc>bs){bs=sc;best=[e,n];} } }
      if(best){ this.aiSend(best[0],best[1]); budget--; } }
    // 4) đánh node thù địch nếu chắc thắng (ngoài tầm nhìn người chơi thì chỉ đoán)
    if(budget>0){ let best=null,bs=-1e9;
      for(const e of en){ for(const m of mine){ if(m.owner===F&&!this.royale&&!this.stormRush&&(this.pA(m)<D.safe-0.02||(this._raidT||0)>this.time||(m.camp&&this.time<240&&!(D.iq>=3&&this.time>100&&m.count<200&&this.armies.some(q=>q.owner===F&&!q.done&&q.count>1500&&this.pA(q)>0.5))))) continue;   /* 4 phút đầu máy chưa đụng trại ta — TRỪ KHI (ải 8+) ta dốc đại quân sang nửa bên kia và bỏ trống trại */ if(m.owner===F&&this.royale&&this.time<D.grace) continue;   /* 4 phút đầu máy chưa đụng tới đại bản doanh của ta */ if(m.ambush) continue; const d=dist(e,m); if(d>BW.range) continue;
        const est=this.aiSee(m,fid);
        const [ra]=bwResolve(e.type,Math.round(e.count*(1-D.keep)*this.aiOver()),est.type,est.count,this.defMul({...m,type:est.type})); if(ra<=0) continue;
        let sc=ra*1.2+(m.eco?350+(D.iq>=2&&m.owner===F?450:0):0)+(m.camp?5000:0)-d*0.2-est.count*0.2+(m.owner===F?hate:0);
        if(this.royale&&m.owner===F){ if(this.coalition) sc+=1500; else if(this.playerWeak) sc-=700; }
        if(sc>bs){bs=sc;best=[e,m];} } }
      if(best&&bs>-200){ const [e,m]=best; this.aiSend(e,m); if(m.owner===F) this._raidT=this.time+D.raidCd; announce(e, m.owner===F&&m.eco&&D.iq>=2? '🔥 Enemy raid on your supply!' : '⚔️ Enemy on the march!'); audio.flag&&audio.flag(); budget--; } }
    // 6) PHỤC KÍCH (từ màn 2): chọn địa hình rừng/thung lũng/sông nằm trên đường quân ta để chờ
    if(tier>=1){ let abud= tier>=2? 2:1;
      const pas=this.armies.filter(a=>(this.royale? this.isFoe(a.owner,fid) : a.owner===F)&&!a.done&&a.count>0&&!a.btl&&(a.to>=0||a.tx!=null||a.hunt)&&!(a.owner===F&&a.smokeT>0)&&(a.owner!==F||!this.royale||this.aiVis(a.x,a.y,fid)));
      for(const s2 of this.armies){ if(abud<=0) break;
        if(s2.owner!==fid||s2.done||s2.btl||!s2.camped||s2.ambush||s2.aiAmbush||s2.sieging||s2.count<(tier>=2?400:200)) continue;
        let pa=null,pd=1e9; for(const q of pas){ const d=dist(s2,q); if(d<pd&&d<(tier>=2?1500:1000)){pd=d;pa=q;} }
        if(!pa) continue;
        // điểm phục: nằm giữa đường, ưu tiên địa hình hợp phục kích
        let pt=null; const dx=pa.x-s2.x, dy=pa.y-s2.y, L2=hyp(dx,dy)||1;
        for(const f2 of [0.5,0.4,0.6,0.3,0.7]) for(const off of [0,60,-60,120,-120]){
          const px=s2.x+dx*f2 + (-dy/L2)*off, py=s2.y+dy*f2 + (dx/L2)*off;
          const ter=this.terAt(px,py); if(!BW.ambushFit[ter]||(ter==='river'&&!this.nearBridge(px,py,80))) continue;
          if(!this.canReach(s2,px,py).ok) continue; // kỵ binh/đại quân không vào được rừng: tìm chỗ khác
          if(hyp(px-pa.x,py-pa.y)<200) continue; if(this.terrLit(px,py,pa.owner)) continue; pt={x:px,y:py}; break; }
        if(!pt) continue;
        s2.tx=pt.x; s2.ty=pt.y; s2.to=-1; s2.hunt=null; s2.camped=false; s2.aiAmbush=true; abud--; }
    }
    // 5) dồn tuyến (1v1)
    if(budget>0 && !this.royale && en.length>=2){
      const front=[...en].sort((x,y)=>this.pA(x)-this.pA(y))[0];
      let rear=null,rb2=-1e9; for(const e of en){ if(e===front||e.eco) continue; if(this.pA(e)-this.pA(front)>0.06 && dist(e,front)<=BW.range && e.count>400){ const sc=e.count; if(sc>rb2){rb2=sc;rear=e;} } }
      if(rear && front.count<rear.count){ this.aiSend(rear,front); budget--; }
      /* (5.3) iq≥1: trại địch không ngồi ôm quân — dư quân thì điều ra đồn tiền tuyến gần nhất */
      if(budget>0&&D.iq>=1){ const c=this.nodes.find(n=>n.camp&&n.owner===fid&&!n.btl), cc=Math.round(L.camp*1.6); if(c&&c.count>cc*0.62){ let to=null,tb=1e9; for(const e of en){ if(e.eco) continue; const d=dist(e,c); if(d<=BW.range*1.4&&this.pA(e)<tb){ tb=this.pA(e); to=e; } } if(to&&this.aiSend(c,to,0.6)){ announce(c,'📯 Enemy camp sends troops to the front!'); budget--; } } }
    }
  }
  // ---- vẽ
  draw(c,vw,vh,dpr,tm,dt){ this.lastVw=vw; this.lastVh=vh; this._fdt=dt;
    const scale0=this.scale0= this.big? Math.min(vh/1520, vw/1700) : Math.min(vh/BW.H, vw/1700);
    // zoom mượt vào/ra khu giao tranh
    this.zoom+=(this.zoomTgt-this.zoom)*Math.min(1,dt*6);
    if(this.focusB){ const b=this.battleOf(this.focusB); if(!b){ this.focusB=null; this.zoomTgt=1; } else { const sc2=scale0*this.zoom; this.camX+=((b.x-vw/sc2/2)-this.camX)*Math.min(1,dt*4); this.camY+=((b.y-vh/sc2/2)-this.camY)*Math.min(1,dt*4); } }
    else if(this.jumpT){ const j=this.jumpT; j.t-=dt; const sc2=scale0*this.zoom;
      this.camX+=((j.x-vw/sc2/2)-this.camX)*Math.min(1,dt*5); this.camY+=((j.y-vh/sc2/2)-this.camY)*Math.min(1,dt*5);
      if(j.t<=0) this.jumpT=null; }
    // 🎬 CẢNH MỞ ĐẦU: quét toàn bản đồ rồi lia tới trại của ta
    if(this.intro===undefined){ const camp=this.nodes.find(n=>n.camp&&n.owner===this.localFid);
      this.intro=(camp&&!(this.cfg&&this.cfg.classic))?{t:0,dur:4.2,cx:camp.x,cy:camp.y}:null; }
    if(this.intro){ const I=this.intro; I.t+=dt; if(this.camDrag!=null||this.focusB) I.t=I.dur;
      const zFit=this.big? 0.3 : (vw/BW.W)/scale0, zOver=this.big? 0.42 : zFit*1.5, ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      const sw=vw/(scale0*zOver), shH=vh/(scale0*zOver);
      if(I.t<1.9){ const u=ease(I.t/1.9);
        this.zoom=this.zoomTgt=zFit+(zOver-zFit)*u;
        this.camX=(BW.W-sw)*u; this.camY=(BW.H-shH)/2; }
      else if(I.t<I.dur){ const u=ease((I.t-1.9)/(I.dur-1.9)); const sEnd=1;
        const sx0=(BW.W-sw), sy0=(BW.H-shH)/2; const vwN=vw/scale0, vhN=vh/scale0;
        this.zoom=this.zoomTgt=zOver+(sEnd-zOver)*u;
        const hc=this.homeCam(I.cx,I.cy,vwN,vhN); this.camX=sx0+(hc[0]-sx0)*u; this.camY=sy0+(hc[1]-sy0)*u; }
      else { this.intro=null; this.zoom=this.zoomTgt=1; const hc=this.homeCam(I.cx,I.cy,vw/scale0,vh/scale0); this.camX=hc[0]; this.camY=hc[1]; }
    }
    const scale=scale0*this.zoom; const viewW=vw/scale, viewH=vh/scale;
    if(!this._cam0){ this._cam0=1; if(!this.intro&&this.camX===0&&!this.camY){ const cp=this.nodes.find(n=>n.camp&&n.owner===this.localFid)||this.nodes[0]; const hc=this.homeCam(cp.x,cp.y,viewW,viewH); this.camX=hc[0]; this.camY=hc[1]; } }
    // tự dõi theo: lấy node ta xa nhất
    // camera: chỉ tự dõi theo NGẮN sau khi người chơi vừa ra lệnh; còn lại đứng yên (hết lỗi trôi màn hình)
    if(this.camDrag!=null){ this.camX=this.camDrag; this.jumpT=null; }
    if(!Number.isFinite(this.camX)) this.camX=0; if(!Number.isFinite(this.camY)) this.camY=0; if(!Number.isFinite(this.zoom)||this.zoom<=0){ this.zoom=this.zoomTgt=1; } // chốt chặn: không bao giờ kẹt camera
    this.camClamp(viewW,viewH);
    // đồng bộ điểm kéo với vị trí đã kẹp biên: nếu không, kéo quá biên rồi phải kéo ngược rất xa mới nhúc nhích (kẹt biên)
    if(this.camDrag!=null) this.camDrag=this.camX;
    let sx=0,sy=0; if(this.shake>0){ sx=(Math.random()-0.5)*this.shake; sy=(Math.random()-0.5)*this.shake; }
    c.setTransform(dpr,0,0,dpr,0,0);
    // nền cỏ tô kín màn hình (lộ ra trong tích tắc khi ô bản đồ chưa dựng xong) — không cần xoá canvas trước
    c.fillStyle='#8dbd4d'; c.fillRect(0,0,vw,vh);
    // (đã bỏ mẹo dịch hình khi màn hình cao hơn bản đồ: hình vẽ lệch khỏi toạ độ chạm; bản đồ nay được căn giữa bằng chính vị trí máy quay)
    this.scale=scale; c.save(); c.scale(scale,scale); c.translate(-this.camX+sx, -this.camY+sy);
    const cull={x0:this.camX-260, x1:this.camX+viewW+260, y0:this.camY-260, y1:this.camY+viewH+260};
    this._cullV={x0:this.camX-700,x1:this.camX+viewW+700,y0:this.camY-700,y1:this.camY+viewH+700};
    const inView=(x,y)=>x>=cull.x0&&x<=cull.x1&&y>=cull.y0&&y<=cull.y1;
    this._inView=inView;
    // lớp địa hình (prerender)
    this.drawMap(c,cull,scale,dpr); // bản đồ chi tiết theo ô + mức zoom (src/09b_mapart.js)
    // lãnh thổ + biên giới
    this.drawBorder(c,tm);
    this.drawPaths(c,tm,dt);
    // mũi tên lệnh
    if(this.fxArrow){ const f=this.fxArrow; const k=Math.min(1,f.t/0.25); c.strokeStyle='rgba(125,255,207,'+(1-f.t/0.6)+')'; c.lineWidth=10; c.lineCap='round';
      const x=f.x0+(f.x1-f.x0)*k, y=f.y0+(f.y1-f.y0)*k; c.beginPath(); c.moveTo(f.x0,f.y0); c.lineTo(x,y); c.stroke();
      const an=Math.atan2(f.y1-f.y0,f.x1-f.x0); c.fillStyle='rgba(125,255,207,'+(1-f.t/0.6)+')'; c.beginPath(); c.moveTo(x+Math.cos(an)*26,y+Math.sin(an)*26); c.lineTo(x+Math.cos(an+2.5)*18,y+Math.sin(an+2.5)*18); c.lineTo(x+Math.cos(an-2.5)*18,y+Math.sin(an-2.5)*18); c.fill(); }
    // chọn: node hợp lệ + lợi thế
    if(this.sel){ const s=this.sel; const pul=1+Math.sin(tm*8)*0.07;
      c.strokeStyle='#7dffcf'; c.lineWidth=5; c.setLineDash([14,9]); c.lineDashOffset=-tm*30; c.beginPath(); c.arc(s.x,s.y,86*pul,0,7); c.stroke();
      c.setLineDash([]);
      const vx0=this.camX-80, vx1=this.camX+(this.lastVw||1200)/(this.scale||1)+80;
      for(const n of this.nodes){ if(n===s||this.over) continue; if(n.owner===this.localFid&&n.count<=0){ continue; }
        if(n.x<vx0||n.x>vx1) continue;
        if(n.owner!==this.localFid){
          if(!this.visNow(n)&&!n.known){ c.font='900 34px system-ui'; c.textAlign='center'; c.fillText('❓',n.x+56,n.y-62); continue; }
          const nc= this.visNow(n)? n.count : n.known.count, nt= this.visNow(n)? n.type : n.known.type;
          const k=BW.counter(s.type,nt,n.ter), k2=BW.counter(nt,s.type,n.ter)*this.defMul({...n,type:nt});
          const adv= n.owner===2? 1 : (s.count*k)/(nc*k2||1);
          const icon= n.owner===2? '🤝' : adv>1.15? '✅' : adv<0.87? '⛔' : '⚠️';
          c.font='900 34px system-ui'; c.textAlign='center'; c.fillText(icon,n.x+56,n.y-62); } } }
    // node
    // (5.1) cứ điểm đứng yên: sắp thứ tự trên-dưới MỘT lần, và chỉ vẽ những cứ điểm nằm trong khung nhìn (trước đây vẽ cả 387 cứ điểm mỗi khung hình)
    let ns=this._nsY; if(!ns||this._nsSrc!==this.nodes||ns.length!==this.nodes.length){ ns=this._nsY=[...this.nodes].sort((a,b)=>a.y-b.y); this._nsSrc=this.nodes; }
    let nDrawn=0; for(let i=0;i<ns.length;i++){ const n=ns[i]; if(n.x<cull.x0||n.x>cull.x1||n.y<cull.y0-40||n.y>cull.y1) continue; this.drawNode(c,n,tm); if(n.scareT>0) this.drawGearMarks(c,n,tm,true); nDrawn++; } this._nDrawn=nDrawn;   /* vòng lặp đánh số: không sinh rác bộ nhớ như for…of */
    // đạo quân đang đi (quân địch trong sương thì không thấy)
    for(const cv of this.convoys){ if(!inView(cv.x,cv.y)) continue; if(cv.owner!==this.localFid&&!this.visAt(cv.x,cv.y)) continue; this.drawConvoy(c,cv,tm); }   // 🐂 đội vận lương
    for(const a of this.armies){ if(!inView(a.x,a.y)) continue; if(a.owner!==this.localFid&&!this.visAt(a.x,a.y)) continue;
      const gearOn=a.teaT>0||a.plankT>0||a.smokeT>0;   /* 🎒 quân nhu đang có hiệu lực: bè gỗ khi lội sông, màn khói, huy hiệu đếm giây */
      if(gearOn){ if(a.plankT>0&&this.terAt(a.x,a.y)==='river'&&!this.nearBridge(a.x,a.y)){ const dk=ArtImages['tile:bridge']; if(dk) c.drawImage(dk,a.x-46,a.y-8,92,44); else { c.fillStyle='#a8763c'; c.fillRect(a.x-44,a.y-6,88,38); } }
        if(a.smokeT>0){ const sm=ArtImages['fx:smokebig']; if(sm){ c.globalAlpha=0.6; c.drawImage(sm,a.x-84,a.y-86,168,140); c.globalAlpha=1; } } }
      this.drawArmy(c,a,tm); if(gearOn) this.drawGearMarks(c,a,tm,false); }
    // ===== TRẬN ĐANG DIỄN RA: vòng khói + 2 bảng quân số + tên lửa cung =====
    this._btlSeen=0;
    for(const b of this.battles){ if(b.done) continue; if(!inView(b.x,b.y)) continue; if(!this.visAt(b.x,b.y)&&b.A.fid!==this.localFid&&b.B.fid!==this.localFid) continue; this._btlSeen++;
      const sa=this.bSideSum(b.A), sb=this.bSideSum(b.B);
      const puls=1+Math.sin(tm*10+b.id)*0.08;
      c.setLineDash([10,8]); c.lineDashOffset=-tm*40; c.strokeStyle='rgba(255,120,80,0.8)'; c.lineWidth=5;
      c.beginPath(); c.arc(b.x,b.y,95*puls,0,7); c.stroke(); c.setLineDash([]);
      const im=ArtImages['fx:swords']; if(im){ const w2=54+Math.sin(tm*12)*6; c.drawImage(im,b.x-w2/2,b.y-w2/2-86,w2,w2); }
      // biên chế hai hàng lính lao vào nhau — quy mô theo quân số
      { const rank=(S,dir)=>{ const n2=Math.max(2,Math.min(8, Math.round(Math.log10(Math.max(10,this.bSideSum(S)))*2.4)));
          const spr=makeUnitSprite(this.bDom(S), S.fid===this.localFid?0:1); if(!spr) return;
          for(let i=0;i<n2;i++){ const row=i%2, k2=(i/2|0)-((n2/2-0.5)/2);
            const lunge=Math.max(0,Math.sin(tm*9+i*1.7))*10;
            const px=b.x+dir*(26+row*22-lunge), py=b.y+k2*20+6;
            c.save(); if(dir>0){ c.translate(px,0); c.scale(-1,1); c.translate(-px,0); }
            c.drawImage(spr,px-21,py-40+Math.sin(tm*13+i)*2,42,42); c.restore();
            if(i<3&&Math.sin(tm*11+i*2.3)>0.86){ const fim=ArtImages['fx:clash1']; if(fim) c.drawImage(fim,b.x-18+dir*8,py-52,34,34); } } };
        rank(b.A,-1); rank(b.B,1); }
      // mũi tên bay nếu có cung/nỏ
      if(b.arrowT!=null){ c.strokeStyle='rgba(60,40,20,0.85)'; c.lineWidth=3;
        for(let i2=0;i2<5;i2++){ const ph=(tm*3+i2*0.21)%1; const ax=b.x-80+160*ph, ay=b.y-30-Math.sin(ph*Math.PI)*55;
          c.beginPath(); c.moveTo(ax-12,ay+4); c.lineTo(ax,ay); c.stroke(); } }
      this.plate(c,b.x-70,b.y+86,Math.round(sa),BW.facPal(b.A.fid),this.bDom(b.A),0.85);
      this.plate(c,b.x+70,b.y+86,Math.round(sb),BW.facPal(b.B.fid),this.bDom(b.B),0.85);
      c.font='900 22px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#2a1a12'; c.fillStyle='#ffe9c9';
      { const xs=ArtImages['ui:army']; if(xs) c.drawImage(xs,b.x-18,b.y+68,36,36); else { c.strokeText('⚔️',b.x,b.y+92); c.fillText('⚔️',b.x,b.y+92); } }
    }
    // trinh sát của địch lảng vảng (chỉ thấy khi trong tầm nhìn)
    for(const s3 of this.aiScouts){ if(!inView(s3.x,s3.y)||!this.visAt(s3.x,s3.y)) continue;
      const bob=Math.sin(tm*8)*4, sp=makeUnitSprite('scout',1); c.globalAlpha=0.92;
      if(sp){ const fl=s3.tx<s3.x; c.save(); if(fl){ c.translate(s3.x,0); c.scale(-1,1); c.translate(-s3.x,0); } c.drawImage(sp,s3.x-28,s3.y-48+bob,56,56); c.restore(); }
      else { c.font='30px system-ui'; c.textAlign='center'; c.fillText('🐎',s3.x,s3.y+bob); } c.globalAlpha=1; }
    // hiệu ứng trận đánh (art ChatGPT)
    for(const f of this.fxs){ const im=ArtImages[f.key]; if(!im) continue;
      const k=f.t/f.life, sc2=0.65+k*0.5, al=k<0.25? k/0.25 : 1-(k-0.25)/0.75;
      c.globalAlpha=Math.max(0,al); const w=f.w*sc2;
      c.drawImage(im,f.x-w/2,f.y-w/2,w,w); c.globalAlpha=1; }
    // toán do thám
    for(const s2 of this.scouts){ const to=this.nodes[s2.to];
      c.setLineDash([6,10]); c.strokeStyle='rgba(255,224,138,0.6)'; c.lineWidth=3; c.beginPath(); c.moveTo(s2.x,s2.y); c.lineTo(to.x,to.y); c.stroke(); c.setLineDash([]);
      const bob=Math.sin(tm*9)*4, sp=makeUnitSprite('scout',0);
      if(sp){ const fl=to.x<s2.x; c.fillStyle='rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(s2.x,s2.y+8,20,7,0,0,7); c.fill(); c.save(); if(fl){ c.translate(s2.x,0); c.scale(-1,1); c.translate(-s2.x,0); } c.drawImage(sp,s2.x-31,s2.y-52+bob,62,62); c.restore(); }
      else { c.font='34px system-ui'; c.textAlign='center'; c.fillText('🕵️',s2.x,s2.y+bob); } }
    // 📣 điểm tập kết vừa gọi: cờ hiệu (gọi vài trại) hoặc trống trận (tổng động viên) đứng tại chỗ ~10 giây
    if(this.rallyMark){ const R=this.rallyMark; R.t+=(this._fdt||0.016); if(R.t>10) this.rallyMark=null;
      else if(inView(R.x,R.y)){ const im=ArtImages[R.big? 'drum' : 'ui:follow']; if(im){ const k=Math.max(1,0.7/(this.scale||1)), sz=(R.big? 104 : 66)*k, bob=Math.abs(Math.sin(tm*(R.big? 7 : 5)))*7*k;
          c.globalAlpha= R.t>8? (10-R.t)/2 : Math.min(1,R.t*4); c.fillStyle='rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(R.x,R.y+5*k,sz*0.36,sz*0.12,0,0,7); c.fill(); c.drawImage(im,R.x-sz/2,R.y-sz*0.9-bob,sz,sz); c.globalAlpha=1; } } }
    // hiệu ứng
    for(const r of this.rings){ const k=r.t/r.max; c.strokeStyle=r.col; c.globalAlpha=1-k; c.lineWidth=8*(1-k)+2; c.beginPath(); c.arc(r.x,r.y,20+k*120,0,7); c.stroke(); c.globalAlpha=1; }
    for(const t of this.texts){ if(!t.part) continue; t.vy+=320*0.016; t.x+=t.vx*0.016; t.y+=t.vy*0.016; const k=t.t/t.max; c.fillStyle=t.col; c.globalAlpha=1-k; c.beginPath(); c.arc(t.x,t.y,7*(1-k*0.5),0,7); c.fill(); c.globalAlpha=1; }
    c.textAlign='center';
    for(const t of this.texts){ if(t.part) continue; const k=t.t/t.max; const sc2= k<0.15? 0.6+k/0.15*0.5 : 1.1;
      c.font=`900 ${ (t.big?46:34)*sc2 }px "Baloo 2",system-ui`; c.globalAlpha= k>0.7? (1-k)/0.3:1; c.lineWidth=8; c.strokeStyle='#2a1a12'; c.strokeText(t.s,t.x,t.y-k*50); c.fillStyle=t.col; c.fillText(t.s,t.x,t.y-k*50); c.globalAlpha=1; }
    // sương mù che đất địch
    this.drawFog(c);
    // ngoài mép bản đồ: vùng tối (kéo vượt mép tối đa nửa màn hình)
    if(this.camX<60/scale||this.camY<60/scale||this.camX+viewW>BW.W-60/scale||this.camY+viewH>BW.H-60/scale){   /* khung nhìn nằm gọn trong bản đồ thì khỏi vẽ */
      c.fillStyle='#17121f'; c.beginPath(); c.rect(-1e5,-1e5,2e5,2e5); c.rect(0,0,BW.W,BW.H); c.fill('evenodd');
      this.drawMapFrame(c,scale); }
    c.restore();
    // HUD trên canvas
    this.drawHud(c,vw,vh,tm);
    if(this.tut&&!this.tut.done) this.drawTut(c,vw,vh,tm);   /* 🎓 lớp hướng dẫn nằm trên cùng (trên cả menu lệnh) */
  }
  // KHUNG BẢN ĐỒ kiểu cổ: bóng đổ vào trong, viền gỗ sẫm + chỉ vàng kép, hoa văn 4 góc và mốc giữa cạnh
  drawMapFrame(c,scale){
    const W=BW.W, H=BW.H, u=1/scale, cv=this._cullV;
    const near=(x0,y0,x1,y1)=>!cv||!(x1<cv.x0||x0>cv.x1||y1<cv.y0||y0>cv.y1);
    // bóng đổ vào trong mép (28px màn hình)
    const sh=28*u; const edge=(x0,y0,x1,y1,gx0,gy0,gx1,gy1)=>{ if(!near(x0,y0,x1,y1)) return; const g=c.createLinearGradient(gx0,gy0,gx1,gy1); g.addColorStop(0,'rgba(10,6,18,0.55)'); g.addColorStop(1,'rgba(10,6,18,0)'); c.fillStyle=g; c.fillRect(x0,y0,x1-x0,y1-y0); };
    edge(0,0,W,sh, 0,0,0,sh); edge(0,H-sh,W,H, 0,H,0,H-sh); edge(0,0,sh,H, 0,0,sh,0); edge(W-sh,0,W,H, W,0,W-sh,0);
    // viền: dải gỗ sẫm ở ngoài + chỉ vàng + chỉ sáng mảnh ở trong
    c.lineJoin='round';
    c.strokeStyle='#3b2414'; c.lineWidth=14*u; c.strokeRect(-7*u,-7*u,W+14*u,H+14*u);
    c.strokeStyle='#6b4423'; c.lineWidth=4*u; c.strokeRect(-11*u,-11*u,W+22*u,H+22*u);
    const gold=c.createLinearGradient(0,0,W,H); gold.addColorStop(0,'#f6d27a'); gold.addColorStop(0.5,'#c8952f'); gold.addColorStop(1,'#f6d27a');
    c.strokeStyle=gold; c.lineWidth=3*u; c.strokeRect(-2*u,-2*u,W+4*u,H+4*u);
    c.strokeStyle='rgba(255,240,200,0.55)'; c.lineWidth=1.2*u; c.strokeRect(4*u,4*u,W-8*u,H-8*u);
    // hoa văn góc
    const corner=(x,y,sx,sy)=>{ if(!near(x-80*u,y-80*u,x+80*u,y+80*u)) return; c.save(); c.translate(x,y); c.scale(sx*u,sy*u);
      c.fillStyle='#3b2414'; c.strokeStyle='#e9b949'; c.lineWidth=2.5;
      c.beginPath(); c.moveTo(-6,-6); c.lineTo(46,-6); c.quadraticCurveTo(30,8,14,14); c.quadraticCurveTo(8,30,-6,46); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(0,-14); c.lineTo(14,0); c.lineTo(0,14); c.lineTo(-14,0); c.closePath(); c.fillStyle='#c8952f'; c.fill(); c.strokeStyle='#fff0c8'; c.lineWidth=1.5; c.stroke();
      c.beginPath(); c.arc(0,0,4,0,7); c.fillStyle='#7a1f1f'; c.fill();
      c.strokeStyle='#e9b949'; c.lineWidth=2; c.beginPath(); c.arc(26,8,4,0,7); c.stroke(); c.beginPath(); c.arc(8,26,4,0,7); c.stroke(); c.restore(); };
    corner(0,0,1,1); corner(W,0,-1,1); corner(0,H,1,-1); corner(W,H,-1,-1);
    // mốc nhỏ giữa các cạnh, cách đều ~2000px
    const stud=(x,y)=>{ if(!near(x-20*u,y-20*u,x+20*u,y+20*u)) return; c.save(); c.translate(x,y); c.scale(u,u); c.rotate(Math.PI/4);
      c.fillStyle='#c8952f'; c.strokeStyle='#3b2414'; c.lineWidth=2; c.fillRect(-6,-6,12,12); c.strokeRect(-6,-6,12,12); c.restore(); };
    const step=2000; for(let x=step;x<W-step/2;x+=step){ stud(x,-7*u); stud(x,H+7*u); } for(let y=step*0.75;y<H-step/2;y+=step*0.75){ stud(-7*u,y); stud(W+7*u,y); }
  }
  drawFog(c){
    // (5.1) Sương mù vẽ trên một canvas NHỎ theo khung nhìn (1/4 màn hình) rồi phóng lên. Bản cũ phủ cả bản đồ (2000×600 điểm ảnh ở Quần Hùng)
    // và nạp lại cho bộ xử lý đồ hoạ 30 lần/giây — tốn pin mà mắt không thấy khác.
    const K=4, sc=this.scale||1, vw=this.lastVw||1, vh=this.lastVh||1, fw=Math.ceil(vw/K)+2, fh=Math.ceil(vh/K)+2;
    let fv=this.fogCv; if(!fv||fv.width!==fw||fv.height!==fh){ fv=this.fogCv=document.createElement('canvas'); fv.width=fw; fv.height=fh; }
    const fc=fv.getContext('2d');
    fc.globalCompositeOperation='source-over'; fc.clearRect(0,0,fw,fh);
    fc.fillStyle='rgba(14,12,32,0.62)'; fc.fillRect(0,0,fw,fh); // vùng tối chỉ che QUÂN địch — địa hình, đường sá vẫn nhìn ra để tính đường hành quân
    fc.globalCompositeOperation='destination-out';
    // vệt sáng dùng sẵn 1 ảnh tròn (không tạo gradient cho từng điểm) và chỉ đục các điểm chạm khung nhìn
    if(!this._punchSpr){ const sp=document.createElement('canvas'); sp.width=sp.height=64; const g2=sp.getContext('2d'); const gr=g2.createRadialGradient(32,32,16,32,32,32); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g2.fillStyle=gr; g2.fillRect(0,0,64,64); this._punchSpr=sp; }
    const spr=this._punchSpr, k=sc/K, ox=this.camX, oy=this.camY; let np=0;
    const punch=(x,y,r)=>{ const px=(x-ox)*k+1, py=(y-oy)*k+1, pr=r*k; if(px+pr<0||py+pr<0||px-pr>fw||py-pr>fh) return; fc.drawImage(spr,px-pr,py-pr,pr*2,pr*2); np++; };
    { const V=this._viewers; if(V) for(let i=0;i<V.length;i++){ const v=V[i]; punch(v.x,v.y,v.r); } const N=this.nodes, tNow=this.time; for(let i=0;i<N.length;i++){ const n=N[i]; if(n.scoutT!=null&&tNow-n.scoutT<30) punch(n.x,n.y,330); } }
    this._fogPunch=np;
    c.save(); c.imageSmoothingEnabled=true; c.drawImage(fv,0,0,fw,fh,ox-K/sc,oy-K/sc,fw*K/sc,fh*K/sc); c.restore();
  }
  drawBorder(c,tm){ if(this.royale||this.cfg.p2p) return;
    // biên giới = điểm giữa node ta xa nhất và node địch gần nhất theo 5 dải ngang
    const bands=5, pts=[];
    for(let b=0;b<=bands;b++){ const y0=BW.H*b/bands; const yc=BW.H*(b+0.5)/bands;
      let mx=260, ex=BW.W-260;
      for(const n of this.nodes){ if(Math.abs(n.y-yc)>BW.H/bands*1.2) continue; if(n.owner===0) mx=Math.max(mx,n.x); if(n.owner===1) ex=Math.min(ex,n.x); }
      pts.push((mx+Math.max(mx+60,ex))/2);
    }
    const bx=(yy)=>{ const f=yy/BW.H*bands; const i=Math.max(0,Math.min(bands-1,Math.floor(f))); const k=f-i; const a=pts[i], b2=pts[Math.min(bands,i+1)]; const s=k*k*(3-2*k); return a+(b2-a)*s + Math.sin(yy*0.013+tm*0.8)*14; };
    // tô 2 miền
    c.save();
    c.beginPath(); c.moveTo(0,0); for(let y=0;y<=BW.H;y+=40) c.lineTo(bx(y),y); c.lineTo(0,BW.H); c.closePath();
    c.fillStyle='rgba(59,130,246,0.10)'; c.fill();
    c.beginPath(); c.moveTo(BW.W,0); for(let y=0;y<=BW.H;y+=40) c.lineTo(bx(y),y); c.lineTo(BW.W,BW.H); c.closePath();
    c.fillStyle='rgba(239,68,68,0.10)'; c.fill();
    // viền phát sáng
    for(const [col,w2,al] of [['#3b82f6',14,0.25],['#aee2ff',5,0.9]]){
      c.strokeStyle=col; c.globalAlpha=al; c.lineWidth=w2; c.beginPath(); for(let y=0;y<=BW.H;y+=24){ const x=bx(y)-8; if(y===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); }
    for(const [col,w2,al] of [['#ef4444',14,0.25],['#ffc2b0',5,0.9]]){
      c.strokeStyle=col; c.globalAlpha=al; c.lineWidth=w2; c.beginPath(); for(let y=0;y<=BW.H;y+=24){ const x=bx(y)+8; if(y===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); }
    c.globalAlpha=1; c.restore();
  }
  drawNode(c,n,tm){
    const col= n.owner===2? {color:'#b9b29c',dark:'#6f6a58',light:'#efe9d6'} : BW.facPal(n.owner);
    if(n.camp){ // trại: lều to + cờ
      const deco= n.owner===this.localFid&&this.decor&&this.decor.length? this.decor : null, dt0=deco? performance.now()/1000 : 0; if(deco) BW.drawDecor(c,n.x,n.y,deco,dt0,0);   /* 🏮 đồ trang trí trại đã mua (sau lều) */
      c.fillStyle='rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(n.x,n.y+46,95,26,0,0,7); c.fill();
      const im=ArtImages['prop:tent'];
      if(im){ const cv2=recolorUnit(im, n.owner===this.localFid?0:1); c.drawImage(cv2,n.x-95,n.y-110,190,190); }
      else { c.fillStyle=col.color; c.strokeStyle='#2a1a12'; c.lineWidth=5; c.beginPath(); c.moveTo(n.x-85,n.y+45); c.lineTo(n.x,n.y-75); c.lineTo(n.x+85,n.y+45); c.closePath(); c.fill(); c.stroke(); }
      if(deco) BW.drawDecor(c,n.x,n.y,deco,dt0,1);
      c.font='900 30px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=7; c.strokeStyle='#2a1a12'; c.fillStyle='#fff';
      const mine=n.owner===this.localFid, cap=mine&&n.capOf===this.localFid, crown= cap? ArtImages['ui:general'] : null;
      const nm= mine? (cap? (crown? 'OUR CAPITAL' : '👑 OUR CAPITAL') : 'OUR CAMP'): this.natTag(n.owner)+(this.allied(this.localFid,n.owner)?' 🤝':'');
      if(crown){ const tw=c.measureText(nm).width; c.strokeText(nm,n.x+21,n.y-96); c.fillText(nm,n.x+21,n.y-96); c.drawImage(crown,n.x+21-tw/2-44,n.y-127,40,40); }   /* 👑 ảnh vương miện thay cho emoji */
      else { c.strokeText(nm,n.x,n.y-96); c.fillText(nm,n.x,n.y-96); }
      if(n.count>0){ const vz=n.owner===this.localFid||this.visNow(n);
        this.plate(c,n.x,n.y+66, vz? n.count : (n.known? '~'+n.known.count+'?' : '???'), vz? col:{color:'#8b85a8',light:'#cbc6e2'}, n.type, 1.15); if(vz&&!mine) this.scoutMark(c,n,n.x+80,n.y+44); }
      return;
    }
    // công sự: vẽ dưới chân node (cả phe ta lẫn nơi đã thấy)
    if(n.struct&&(n.owner===this.localFid||this.visAt(n.x,n.y)||n.known)){
      const sim=ArtImages['struct:'+n.struct];
      if(sim){ const w=n.struct==='citadel'?168:n.struct==='fort'?140:118;
        c.globalAlpha=0.97; c.drawImage(sim,n.x-w/2,n.y+26-w,w,w); c.globalAlpha=1; }
      else { c.font=(n.struct==='citadel'?54:n.struct==='fort'?46:38)+'px system-ui'; c.textAlign='center';
      c.globalAlpha=0.95; c.fillText(BW.structIcon[n.struct],n.x,n.y-34); c.globalAlpha=1; }
      c.font='800 17px "Baloo 2",system-ui'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.8)';
      const stx=BW.structIcon[n.struct]+' '+BW.structName[n.struct]+' 🛡×'+(BW.structDef[n.struct]).toFixed(2).replace(/0$/,'');
      c.strokeText(stx,n.x,n.y+86); c.fillStyle='#ffe9c9'; c.fillText(stx,n.x,n.y+86); }
    // cờ phục kích của ta
    if(n.ambush&&n.owner===this.localFid){
      c.setLineDash([8,8]); c.strokeStyle='rgba(255,213,74,0.85)'; c.lineWidth=3; c.beginPath(); c.arc(n.x,n.y,86,0,7); c.stroke(); c.setLineDash([]);
      c.font='900 30px system-ui'; c.textAlign='center'; c.fillText('🪤',n.x+62,n.y-50);
      c.font='800 15px "Baloo 2",system-ui'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.8)';
      const ax='AMBUSH x'+this.ambushMult(n).toFixed(1); c.strokeText(ax,n.x,n.y+104); c.fillStyle='#ffd54a'; c.fillText(ax,n.x,n.y+104); }
    // trong sương: chỉ thấy bóng mờ, không lộ quân số — phải DO THÁM; ngoài tầm nhìn & chưa từng thám = VÙNG TỐI
    if(n.owner!==this.localFid && !this.visNow(n)){
      if(!this.visAt(n.x,n.y)&&!n.known&&n.scoutT==null&&!n.camp) return;
      if(n.eco){ const ecol= n.eco==='farm'? '#eab308' : '#60a5fa';
        c.globalAlpha=0.1; c.fillStyle=ecol; c.beginPath(); c.ellipse(n.x,n.y+14,118,54,0,0,7); c.fill(); c.globalAlpha=0.4;
        const tag= n.eco==='farm'? '🐂 Ranch' : n.eco==='granary'? '🌾 Granary' : '⚒️ Training Ground';
        { const bim=ArtImages[n.eco==='farm'? 'prop:ranch' : n.eco==='granary'? 'prop:granary' : 'prop:trainyard']; if(bim){ c.globalAlpha=0.45; c.drawImage(bim,n.x-96,n.y-118,192,192); c.globalAlpha=0.4; } }
        c.font='800 20px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#2a1a12'; c.strokeText(tag,n.x,n.y+58); c.fillStyle='#d8d2c0'; c.fillText(tag,n.x,n.y+58); c.globalAlpha=1; }
      if(n.count>0){
        const pres=this.visAt(n.x,n.y); c.globalAlpha=pres?0.8:0.55; c.fillStyle=pres?'#3a2f55':'#2e2748'; c.beginPath(); c.ellipse(n.x,n.y,52,32,0,0,7); c.fill();
        c.globalAlpha=0.8; c.font='900 34px system-ui'; c.textAlign='center'; c.fillText('👤',n.x-14,n.y+10); c.fillText('👤',n.x+16,n.y+6); c.globalAlpha=1;
        this.plate(c,n.x,n.y-58, n.known? '~'+n.known.count+'?' : '❓', {color:'#8b85a8',light:'#cbc6e2'}, n.known?n.known.type:'scout', 0.95); }
      return;
    }
    if(n.owner===2&&!n.camp&&!n.eco&&n.count>0){ const wf=ArtImages['ui:flag']; if(wf){ const sw=Math.sin(tm*2+n.id)*0.05; c.save(); c.translate(n.x+52,n.y+8); c.rotate(sw); c.drawImage(wf,-24,-64,48,64); c.restore(); } }   /* 🏳️ (5.6) đồn trung lập cắm cờ trắng: quân đông hơn hẳn tới là quy thuận */
    if(n.eco){ // nền vùng kinh tế
      const ecol= n.eco==='farm'? '#eab308' : n.eco==='granary'? '#8bc34a' : '#60a5fa';
      c.globalAlpha=0.16; c.fillStyle=ecol; c.beginPath(); c.ellipse(n.x,n.y+14,118,54,0,0,7); c.fill(); c.globalAlpha=0.65;
      c.strokeStyle=ecol; c.lineWidth=3; c.setLineDash([10,7]); c.lineDashOffset=-tm*10; c.beginPath(); c.ellipse(n.x,n.y+14,118,54,0,0,7); c.stroke(); c.setLineDash([]); c.globalAlpha=1;
      { const bim=ArtImages[n.eco==='farm'? 'prop:ranch' : n.eco==='granary'? 'prop:granary' : 'prop:trainyard']; if(bim) c.drawImage(bim,n.x-96,n.y-118,192,192); }   /* 🏡 (5.6) công trình do ChatGPT vẽ: trại nuôi · kho lương · sân tập */
      const tag= n.eco==='farm'? '🐂 Ranch' : n.eco==='granary'? ('🌾 Granary '+Math.round(n.food||0)) : '⚒️ Train '+(UNIT[n.trainType]?UNIT[n.trainType].name:'');
      c.font='800 20px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#2a1a12'; c.strokeText(tag,n.x,n.y+58); c.fillStyle= n.eco==='farm'? '#ffe08a':'#bfdbfe'; c.fillText(tag,n.x,n.y+58);
    }
    if(n.sieged){ c.font='900 30px system-ui'; c.textAlign='center'; const bl=0.6+0.4*Math.sin(tm*6);
      c.globalAlpha=bl; c.fillText('⛓️',n.x-58,n.y-48); c.globalAlpha=1; }
    if(n.count<=0){ // node trống
      c.strokeStyle='rgba(90,70,40,0.5)'; c.lineWidth=3; c.setLineDash([8,8]); c.beginPath(); c.arc(n.x,n.y,34,0,7); c.stroke(); c.setLineDash([]);
      return; }
    // khối lính
    const spr=makeUnitSprite(n.type, n.owner===this.localFid?0: n.owner===2? NEUTRAL:1);
    const rows= n.count>=2000? 3 : n.count>=600? 3 : 2;
    const cols= n.count>=3000? 5 : n.count>=1200? 4 : 3;
    const S2=52;
    c.fillStyle='rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(n.x,n.y+30,cols*S2*0.42,16,0,0,7); c.fill();
    for(let r=rows-1;r>=0;r--){ for(let q=0;q<cols;q++){
      const px=n.x+(q-(cols-1)/2)*S2*0.74+((r%2)*10)-5, py=n.y+(r-(rows-1)/2)*26;
      const bob=Math.sin(tm*2.2+n.wob+q*1.7+r)*2.5;
      c.drawImage(spr,px-S2/2,py-S2*0.95+bob,S2,S2); } }
    this.plate(c,n.x,n.y-62-(rows-2)*9,n.count,col,n.type,1);
    if(n.owner!==this.localFid) this.scoutMark(c,n,n.x+64,n.y-84-(rows-2)*9);
    if(n.owner===this.localFid&&(n.food||0)>1&&n.eco){ c.font='800 15px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.8)';
      const ft='🌾'+Math.round(n.food); c.strokeText(ft,n.x+70,n.y-40); c.fillStyle='#d9f99d'; c.fillText(ft,n.x+70,n.y-40); }
  }
  // 🔭 cứ điểm địch ĐANG LỘ QUÂN SỐ nhờ do thám / la bàn: ống nhòm + số giây còn thấy (hết giờ là lại ẩn)
  scoutMark(c,n,px,py){ if(n.scoutT==null) return; const left=30-(this.time-n.scoutT); if(!(left>0)) return; const im=ArtImages['ui:center']; if(!im) return;
    c.drawImage(im,px,py,34,34); c.font='900 15px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.9)'; const t=Math.ceil(left)+'s'; c.strokeText(t,px+17,py+47); c.fillStyle='#bfe9ff'; c.fillText(t,px+17,py+47); }
  plate(c,x,y,count,col,type,k){ // bảng số kiểu gỗ
    const txt= typeof count==='string'? count : String(Math.round(count)); c.font=`900 ${30*k}px "Baloo 2",system-ui`;
    const w2=Math.max(84,c.measureText(txt).width+54)*k, h2=40*k;
    c.fillStyle='rgba(42,26,18,0.92)'; rr(c,x-w2/2,y-h2/2,w2,h2,10*k); c.fill();
    c.strokeStyle=col.color; c.lineWidth=3.5*k; rr(c,x-w2/2,y-h2/2,w2,h2,10*k); c.stroke();
    c.fillStyle=col.light||'#fff'; c.textAlign='left'; c.textBaseline='middle';
    c.font=`${22*k}px system-ui`; c.fillText(UNIT[type]?UNIT[type].emoji:'⚔️', x-w2/2+8*k, y+1);
    c.font=`900 ${26*k}px "Baloo 2",system-ui`; c.fillStyle='#fff'; c.fillText(txt, x-w2/2+36*k, y+2);
    c.textBaseline='alphabetic'; c.textAlign='center';
  }
  drawArmy(c,a,tm){
    const spr=makeUnitSprite(a.type, a.owner===this.localFid?0:1);
    const S2=48; const tp= a.hunt? a.hunt : (a.to>=0? this.nodes[a.to] : {x:a.tx??a.x+1,y:a.ty??a.y});
    const an=a.camped? 0 : (a.hx!=null? Math.atan2(a.hy,a.hx) : Math.atan2(tp.y-a.y,tp.x-a.x));
    // trại dã ngoại / vòng mai phục
    if(a.camped){
      c.globalAlpha=0.35; c.fillStyle=BW.facPal(a.owner).color; c.beginPath(); c.ellipse(a.x,a.y+10,56,26,0,0,7); c.fill(); c.globalAlpha=1;
      const tim=ArtImages['prop:fieldcamp'];
      if(tim) c.drawImage(tim,a.x-82,a.y-62,58,58);
      else { c.font='26px system-ui'; c.textAlign='center'; c.fillText('⛺',a.x-44,a.y-30); }
      if(a.ambush){ c.setLineDash([8,8]); c.strokeStyle='rgba(255,213,74,0.85)'; c.lineWidth=3; c.beginPath(); c.arc(a.x,a.y,72,0,7); c.stroke(); c.setLineDash([]);
        c.font='900 26px system-ui'; c.fillText('🪤',a.x+48,a.y-34);
        c.font='800 14px "Baloo 2",system-ui'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.8)';
        const ax='AMBUSH x'+this.ambushMult({ter:this.terAt(a.x,a.y),type:a.type,owner:a.owner}).toFixed(1);
        c.strokeText(ax,a.x,a.y+74); c.fillStyle='#ffd54a'; c.fillText(ax,a.x,a.y+74); } }
    if(this.selA===a||(this.selG&&this.selG.includes(a))){ c.strokeStyle=a.ambush?'#ffd54a':'#7dffcf'; c.lineWidth=4; c.setLineDash([10,7]); c.beginPath(); c.arc(a.x,a.y,64,0,7); c.stroke(); c.setLineDash([]);
      if(this.selG&&this.selG.length>1&&this.selA===a){ c.font='900 20px "Baloo 2",system-ui'; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='rgba(42,26,18,0.9)';
        const gb='👥 x'+this.selG.length; c.strokeText(gb,a.x,a.y-92); c.fillStyle='#7dffcf'; c.fillText(gb,a.x,a.y-92); } }
    // bụi (chỉ khi đang đi)
    if(!a.camped&&!(a.prep>0)&&!(a.holdT>0)){ const dim=ArtImages[a.count>600?'fx:dust2':'fx:dust1'];
      if(dim){ const fl=Math.cos(an)<0; c.save(); c.globalAlpha=0.5+0.15*Math.sin(tm*9);
        const dw=a.count>600?84:62; c.translate(a.x-Math.cos(an)*44, a.y+10-Math.sin(an)*20);
        if(!fl) c.scale(-1,1); c.drawImage(dim,-dw/2,-dw/2,dw,dw); c.restore(); }
      else for(let i=0;i<3;i++){ c.fillStyle='rgba(180,150,100,0.35)'; c.beginPath(); c.arc(a.x-Math.cos(an)*(30+i*22)+Math.sin(tm*7+i)*6, a.y-Math.sin(an)*(30+i*22)+8, 12-i*3,0,7); c.fill(); } }
    // QUY MÔ theo quân số: 10 quân khác hẳn 10 000 quân
    const nUnits= a.count<80?2 : a.count<300?3 : a.count<800?5 : a.count<2000?7 : a.count<5000?9 : 12;
    const sc2= a.count<800?1 : a.count<5000?1.08 : 1.18;
    for(let i=nUnits-1;i>=0;i--){ const row=i%2, off=((i/2|0)-((Math.ceil(nUnits/2)-1)/2));
      const px=a.x-Math.cos(an)*(row*24+Math.abs(off)*6)+Math.sin(an)*off*26, py=a.y-Math.sin(an)*(row*14)+Math.cos(an)*off*11+row*8;
      const bob=-Math.abs(Math.sin(tm*11+i*2))*7;
      const flip=Math.cos(an)<0; c.save(); if(flip){ c.translate(px,0); c.scale(-1,1); c.translate(-px,0); } c.drawImage(spr,px-S2*sc2/2,py-S2*sc2*0.95+bob,S2*sc2,S2*sc2); c.restore(); }
    if(a.count>=2000){ // cờ hiệu đại quân
      const pal=BW.facPal(a.owner); const fx2=a.x-Math.cos(an)*34, fy2=a.y-Math.sin(an)*20;
      c.strokeStyle='#6b4a2f'; c.lineWidth=4; c.beginPath(); c.moveTo(fx2,fy2-8); c.lineTo(fx2,fy2-70); c.stroke();
      c.fillStyle=pal.color; c.beginPath(); c.moveTo(fx2,fy2-70); c.lineTo(fx2+30+Math.sin(tm*7)*4,fy2-60); c.lineTo(fx2,fy2-48); c.closePath(); c.fill(); }
    this.plate(c,a.x,a.y-56, a.owner===this.localFid? Math.round(a.count) : '❓', BW.facPal(a.owner), a.type, 0.85);
    if(a.retreatT>0){ const sh=ArtImages['ui:hold']; if(sh) c.drawImage(sh,a.x-21,a.y-124,42,42); }   /* 🛡️ vừa rút lui: 3 giây không ai đánh được */
    if(a.owner===this.localFid){ // 🌾 LƯƠNG THẢO của đạo quân — vạch + con số
      const fv=Math.round(a.food??100), fr=Math.max(0,Math.min(1,fv/100)); const bw2=84;
      c.fillStyle='rgba(42,26,18,0.88)'; rr(c,a.x-bw2/2,a.y-37,bw2,14,6); c.fill();
      c.strokeStyle='rgba(255,255,255,0.25)'; c.lineWidth=1.5; rr(c,a.x-bw2/2,a.y-37,bw2,14,6); c.stroke();
      c.fillStyle= fr>0.45? '#a3e635' : fr>0.2? '#facc15' : '#ef4444'; rr(c,a.x-bw2/2+2,a.y-35,Math.max(3,(bw2-4)*fr),10,4); c.fill();
      c.font='800 17px "Baloo 2",system-ui'; c.textAlign='left'; c.lineWidth=4; c.strokeStyle='rgba(42,26,18,0.9)';
      const ft='🌾'+fv; c.strokeText(ft,a.x+bw2/2+5,a.y-24); c.fillStyle= fr>0.2? '#ffe9a8':'#ff9d9d'; c.fillText(ft,a.x+bw2/2+5,a.y-24); c.textAlign='center';
      if(fr<0.25){ const bl=0.5+0.5*Math.sin(tm*8); c.globalAlpha=bl; c.font='900 24px system-ui'; c.fillText('⚠️',a.x-bw2/2-18,a.y-22); c.globalAlpha=1; }
      if(a._cv){ c.font='900 22px system-ui'; c.fillText('🐂',a.x-bw2/2-18,a.y-22-(fr<0.25?26:0)); } }
    if(a.prep>0){ // 🌾 đang CHUẨN BỊ LƯƠNG trước cổng: vạch tiến độ + đếm ngược
      const k=Math.max(0,Math.min(1,1-a.prep/(a.prep0||a.prep))), fz=Math.max(27,11/(this.scale||1)), w=fz*4.6, bh=fz*0.72, y0=a.y+20;   // chữ luôn ≥11px trên màn hình dù zoom xa
      c.fillStyle='rgba(42,26,18,0.9)'; rr(c,a.x-w/2,y0,w,bh,bh*0.45); c.fill(); c.fillStyle='#facc15'; rr(c,a.x-w/2+fz*0.1,y0+fz*0.1,Math.max(fz*0.2,(w-fz*0.2)*k),bh-fz*0.2,bh*0.3); c.fill();
      c.font=`900 ${fz}px "Baloo 2",system-ui`; c.textAlign='center'; c.lineWidth=fz*0.22; c.strokeStyle='rgba(42,26,18,0.92)'; const ps='🌾 '+Math.ceil(a.prep)+'s';
      c.strokeText(ps,a.x,y0+bh+fz*1.05); c.fillStyle='#ffe9a8'; c.fillText(ps,a.x,y0+bh+fz*1.05);
      { const hg=ArtImages['ui:speed']; if(hg) c.drawImage(hg,a.x-w/2-fz*1.4,y0-fz*0.3,fz*1.3,fz*1.3); } }   /* ⏳ đồng hồ cát: đang chờ chuẩn bị lương */
    if(a.sieging!=null&&a.camped){ const n=this.nodes[a.sieging];
      if(n){ // các toán quân rải vòng vây quanh thành
        const base=Math.atan2(a.y-n.y,a.x-n.x);
        const squads=Math.max(3,Math.min(9, Math.round(Math.log10(Math.max(10,a.count))*2.6)));
        const span=Math.min(Math.PI*1.7, 0.5+squads*0.3);
        c.setLineDash([12,10]); c.lineDashOffset=-tm*30; c.strokeStyle='rgba(255,213,74,0.55)'; c.lineWidth=4;
        c.beginPath(); c.arc(n.x,n.y,185,base-span/2,base+span/2); c.stroke(); c.setLineDash([]);
        for(let i=0;i<squads;i++){ const an2=base-span/2+span*(i/(squads-1||1));
          const px=n.x+Math.cos(an2)*185, py=n.y+Math.sin(an2)*185;
          const flip=Math.cos(an2)>0; c.save(); if(flip){ c.translate(px,0); c.scale(-1,1); c.translate(-px,0); }
          c.drawImage(spr,px-19,py-36+Math.sin(tm*8+i)*2.5,38,38); c.restore(); }
        c.font='900 24px system-ui'; c.textAlign='center'; c.fillText('⛓️',a.x,a.y-66); }
      else { c.font='900 22px system-ui'; c.textAlign='center'; c.fillText('⛓️',a.x,a.y-64); } }
  }
  // chạm màn hình giữa cảnh mở đầu = BỎ QUA cảnh quay: nhảy thẳng về trại ta ở mức zoom chuẩn (trước đây máy quay đứng lại giữa chừng, phải tự tìm trại)
  skipIntro(){ const I=this.intro; if(!I) return; this.intro=null; this.zoom=this.zoomTgt=1; const s0=this.scale0||this.scale||1;
    const hc=this.homeCam(I.cx,I.cy,(this.lastVw||1200)/s0,(this.lastVh||600)/s0); this.camX=hc[0]; this.camY=hc[1]; this.camDrag=null; this.jumpT=null; }
  // máy quay "về trại": trại ta trong màn hình, bản đồ phủ gần kín (chỉ lộ tối đa 12% vùng tối ngoài mép); màn hình cao hơn bản đồ thì căn bản đồ vào giữa
  homeCam(cx,cy,viewW,viewH){ const x= viewW>=BW.W? (BW.W-viewW)/2 : Math.max(-viewW*0.12,Math.min(BW.W-viewW*0.88,cx-viewW/2));
    const y= viewH>=BW.H? (BW.H-viewH)/2 : Math.max(-viewH*0.1,Math.min(BW.H-viewH*0.9,cy-viewH/2)); return [x,y]; }
  // HUD phía trên mờ đi khi không thao tác; chạm vào vùng trên (hoặc nút) thì hiện rõ lại
  revealHud(){ this.hudSeen=performance.now(); }
  hudAlpha(){ const target=(performance.now()-this.hudSeen<3000)?1:0.18; this.hudA+=(target-this.hudA)*0.12; return this.hudA; }
  // ===== BỐ CỤC HUD =====
  // Mọi nút/bảng lấy vị trí từ đây: né tai thỏ/thanh trạng thái (SAFE), né cụm nút 🏠↻⏸ và băng "xoay ngang",
  // không phần tử nào đè nhau ở mọi cỡ màn hình ngang/dọc. test/audit_layout.mjs kiểm đúng các ô này trước mỗi lần phát hành.
  _domRects(){ const now=performance.now(); if(this._dr&&now-this._dr.t<200) return this._dr;
    const cv=document.getElementById('game'), c0=cv? cv.getBoundingClientRect() : {left:0,top:0};
    const rel=(id)=>{ const el=document.getElementById(id); if(!el||el.classList.contains('hidden')||getComputedStyle(el).display==='none') return null;
      const r=el.getBoundingClientRect(); return r.width&&r.height? {x:r.left-c0.left,y:r.top-c0.top,w:r.width,h:r.height} : null; };
    return this._dr={t:now,bar:rel('bwbar'),rot:rel('rotate')}; }
  hudLayout(vw,vh){
    const S=readSafe(), D=this._domRects();
    const X0=S.l, Y0=S.t, X1=vw-S.r, Y1=Math.min(vh-S.b, D.rot? D.rot.y : 1e9), W=X1-X0, cx=(X0+X1)/2, narrow=W<560;
    const bar=D.bar||{x:X0+8,y:Y0+8,w:0,h:0};
    // bản đồ nhỏ: góc phải trên, không lấn sang cụm nút
    const freeR=X1-10-(bar.x+bar.w+8);
    const ow=Math.max(60,Math.min(Math.min(240,Math.max(110,W*0.25)),freeR)), oh=Math.max(28,Math.round(ow*BW.H/BW.W)+8);
    const map={x:X1-ow-10,y:Y0+8,w:ow,h:oh};
    // thanh quân số: nằm giữa cụm nút và bản đồ nhỏ nếu đủ chỗ, không thì xuống hàng 2
    const gL=bar.x+bar.w+8, gR=map.x-8; let top;
    if(gR-gL>=190){ const w=Math.min(400,W*0.38,gR-gL); top={x:Math.max(gL,Math.min(gR-w,cx-w/2)),y:Y0+8,w,h:32,row:1}; }
    else { top={x:X0+8,y:Math.max(bar.y+bar.h,map.y+map.h)+6,w:Math.min(400,W-16),h:32,row:2}; }
    // cột phải: nút TOÀN CẢNH (khi đang phóng to) + nút ＋ －
    const zooming=this.zoomTgt>1.05; let zs=46, zg=12; const zx=X1-zs-10;
    let colTop=map.y+map.h+8; if(top.row===2&&top.x+top.w>zx-8) colTop=Math.max(colTop,top.y+top.h+8);
    let ovw=null; if(zooming&&!narrow){ ovw={x:X1-150-10,y:colTop,w:150,h:40,wide:1}; colTop=ovw.y+ovw.h+8; }
    const nB=2+(zooming&&narrow?1:0), room=Y1-8-colTop;
    if(nB*zs+(nB-1)*zg>room){ zg=6; zs=Math.max(36,Math.min(46,Math.floor((room-(nB-1)*zg)/nB))); }
    const colH=nB*zs+(nB-1)*zg; let zy=Math.max(colTop,Math.min(vh*0.5-56-(nB>2? zs+zg : 0),Y1-8-colH));
    if(nB>2){ ovw={x:X1-zs-10,y:zy,w:zs,h:zs,wide:0}; zy+=zs+zg; }
    const zooms=[{x:X1-zs-10,y:zy,w:zs,h:zs,dir:1},{x:X1-zs-10,y:zy+zs+zg,w:zs,h:zs,dir:-1}];
    // góc trái dưới: 📣 gọi quân (trên) + 🪤 mai phục (dưới); giữa đáy: 🏳️ rút lui
    const rally={x:X0+12,y:Y1-48-76,w:48,h:48}, amb={x:X0+12,y:Y1-52-12,w:Math.min(190,W-24),h:52};
    const retreat={x:cx-85,y:Y1-48-64,w:170,h:48};
    // thông báo: cột trái, dưới cụm nút/thanh quân số; bề rộng tự co để không chui xuống bản đồ nhỏ và cột nút phải
    const blockers=[map,...zooms]; if(ovw) blockers.push(ovw);
    const noteX=X0+10, noteY=Math.max(bar.y+bar.h,top.y+top.h)+8, noteBottom=rally.y-8;
    const noteMaxW=(y,h)=>{ let r=X1-10; for(const b of blockers) if(y<b.y+b.h+4&&y+h>b.y-4) r=Math.min(r,b.x-8); return r-noteX; };
    return this._L={S,X0,Y0,X1,Y1,W,cx,narrow,bar:D.bar,rot:D.rot,map,top,ovw,zooms,rally,amb,retreat,noteX,noteY,noteBottom,noteMaxW,vw,vh};
  }
  // các ô HUD đang hiển thị (đúng những ô dùng để vẽ và bắt chạm) — phục vụ kiểm thử bố cục
  hudRects(){ const L=this._L, R={}; if(!L) return R; const o=this.obar;
    if(L.bar) R['nút 🏠↻⏸']=L.bar; if(this._topBar) R['thanh quân số']=this._topBar; if(o) R['bản đồ nhỏ']={x:o.ox,y:o.oy,w:o.ow,h:o.oh};
    (this._zBtns||[]).forEach(z=>R[z.dir>0?'nút +':'nút −']={x:z.x,y:z.y,w:z.w,h:z.h});
    if(this._zoomBtn) R['nút TOÀN CẢNH']=this._zoomBtn; if(this._rallyBtn) R['nút 📣']=this._rallyBtn; if(this._ambBtn) R['nút mai phục']=this._ambBtn;
    if(this._retreatBtn) R['nút RÚT LUI']={x:this._retreatBtn.x,y:this._retreatBtn.y,w:this._retreatBtn.w,h:this._retreatBtn.h};
    (this._noteRects||[]).forEach((n,i)=>R['thông báo '+(i+1)]={x:n.x,y:n.y,w:n.w,h:n.h});
    if(this._rallyMenu) R['menu gọi quân']=this._rallyMenu; if(this._orderMenu) R['menu lệnh']=this._orderMenu; if(this._hintBox) R['dòng hướng dẫn']=this._hintBox; if(this._unitChip) R['thẻ binh chủng']=this._unitChip;
    if(this._gearBtn) R['nút quân nhu']=this._gearBtn; if(this._gearMenu) R['menu quân nhu']=this._gearMenu;
    if(L.rot) R['băng "xoay ngang"']=L.rot; return R; }
  drawHud(c,vw,vh,tm){
    const ha=this.hudAlpha(); const bbar=document.getElementById('bwbar'); if(bbar) bbar.style.opacity=ha.toFixed(3);
    const L=this.hudLayout(vw,vh), F=this.localFid, FONT='"Baloo 2",system-ui';
    // tổng lực hai bên + tên màn
    // (5.1) số liệu và dòng chữ đã co giãn của thanh này chỉ tính lại ~8 lần/giây (trước đây mỗi khung hình: đếm 400 cứ điểm, dựng Set, đo chữ tới 9 lần)
    let TB=this._hudTop; const topW=L.top.w;
    if(!TB||TB.w!==topW||tm-TB.t>0.12||tm<TB.t){ const my=Math.round(this.myPower()); let en=0, unk=false;
      for(const n of this.nodes){ if(!this.isFoe(n.owner,F)) continue; if(this.visNow(n)) en+=n.count; else if(n.known){ en+=n.known.count; unk=true; } else unk=true; }
      for(const a of this.armies) if(this.isFoe(a.owner,F)&&this.visAt(a.x,a.y)) en+=a.count;
      const cap=this.supplyCap(F), t1=`⚔️${my}/${cap}`, enT=(unk?'~':'')+Math.round(en)+(unk?'?':'');
      let nNat=0; if(this.royale){ const seen=this._natSeen||(this._natSeen=new Uint8Array(256)); seen.fill(0); for(const n of this.nodes){ if(n.camp&&n.owner!==2&&n.owner>=0&&n.owner<256&&!seen[n.owner]){ seen[n.owner]=1; nNat++; } } }
      const nat=this.royale? `🌏 ${nNat} nations` : (this.cfg.p2p||this.cfg.classic? `🔥 Stage ${this.lv}` : `🔥 Stage ${this.lv}/${BW_LEVELS.length}`);
      const mapN=this.mapName.length>11? this.mapName.slice(0,10)+'…' : this.mapName;
      c.font=`800 13px ${FONT}`; const room=topW-18-(c.measureText(enT).width+12);
      let t2='', fs=11; // chữ tự rút gọn theo bề rộng thanh: đủ → bỏ tên bản đồ → chỉ còn quân số
      fit: for(const cand of [` · ${nat} · ${mapN}`,` · ${nat}`,'']) for(let f=13;f>=11;f--){ c.font=`800 ${f}px ${FONT}`; if(c.measureText(t1+cand).width<=room||(cand===''&&f===11)){ t2=cand; fs=f; break fit; } }
      c.font=`800 ${fs}px ${FONT}`; TB=this._hudTop={t:tm,w:topW,my,en,cap,t1,t2,enT,fs,w1:c.measureText(t1).width,font:`800 ${fs}px ${FONT}`}; }
    { const x=L.top.x, y=L.top.y, w2=topW, my=TB.my, en=TB.en, cap=TB.cap; this._topBar={x,y,w:w2,h:32};
      c.globalAlpha=ha; c.fillStyle='rgba(25,15,45,0.72)'; rr(c,x,y,w2,32,10); c.fill(); c.strokeStyle='rgba(255,255,255,0.15)'; c.lineWidth=1.5; rr(c,x,y,w2,32,10); c.stroke();
      const tot=Math.max(1,my+en); c.fillStyle='#3b82f6'; rr(c,x+8,y+19,(w2-16)*my/tot,7,3); c.fill();
      c.fillStyle='#ef4444'; rr(c,x+8+(w2-16)*my/tot,y+19,(w2-16)*en/tot,7,3); c.fill();
      c.font=TB.font; c.textAlign='left';
      c.fillStyle= my>cap?'#ff8a8a': my>=cap*0.95?'#ffd54a':'#93c5fd'; c.fillText(TB.t1,x+9,y+14); c.fillStyle='#fff'; c.fillText(TB.t2,x+9+TB.w1,y+14);
      c.globalAlpha=Math.max(ha,0.55); c.textAlign='right'; c.font=`800 13px ${FONT}`; c.fillStyle='#fca5a5'; c.fillText(TB.enT,x+w2-9,y+14);
      c.globalAlpha=1; c.textAlign='center'; }
    // 🪤 nút mai phục (góc trái dưới)
    if(this.sel&&this.canAmbush(this.sel)){
      const {x:bx,y:by,w:bw2,h:bh}=L.amb; this._ambBtn={x:bx,y:by,w:bw2,h:bh};
      c.fillStyle=this.sel.ambush?'rgba(255,213,74,0.95)':'rgba(30,24,54,0.85)';
      c.strokeStyle='#ffd54a'; c.lineWidth=3; c.beginPath(); c.roundRect(bx,by,bw2,bh,14); c.fill(); c.stroke();
      const t=this.sel.ambush?'🪤 IN AMBUSH':'🪤 AMBUSH x'+this.ambushMult(this.sel).toFixed(1);
      bwFit(c,t,bw2-20,900,21,14); c.textAlign='center'; c.fillStyle=this.sel.ambush?'#3a2405':'#ffd54a'; c.fillText(t, bx+bw2/2, by+33);
    } else this._ambBtn=null;
    // 🗺️ bản đồ nhỏ (góc phải trên) — chạm để nhảy tới
    { const ox=L.map.x, oy=L.map.y, ow=L.map.w, oh=L.map.h; this.obar={ox,oy,ow,oh}; c.globalAlpha=Math.max(ha,0.35);
      // (5.1) nền + các chấm cứ điểm vẽ sẵn ra một canvas nhỏ, 0,4 giây làm mới một lần; mỗi khung hình chỉ dán lại (trước đây vẽ ~400 chấm tròn mỗi khung hình)
      let mm=this._mmCv; const K2=2, mw2=Math.ceil(ow*K2), mh2=Math.ceil(oh*K2);
      if(!mm||mm.width!==mw2||mm.height!==mh2||tm-this._mmT>0.4||tm<this._mmT){ if(!mm||mm.width!==mw2||mm.height!==mh2){ mm=this._mmCv=document.createElement('canvas'); mm.width=mw2; mm.height=mh2; }
        const m=mm.getContext('2d'); this._mmT=tm; m.setTransform(K2,0,0,K2,0,0); m.clearRect(0,0,ow,oh);
        m.fillStyle='rgba(25,15,45,0.75)'; rr(m,0,0,ow,oh,10); m.fill(); m.strokeStyle='rgba(255,255,255,0.2)'; m.lineWidth=1.5; rr(m,0.75,0.75,ow-1.5,oh-1.5,10); m.stroke();
        for(const n of this.nodes){ if(n.count<=0&&!n.camp) continue; if(n.owner!==F&&!n.camp&&!this.visNow(n)&&!n.known&&!this.visAt(n.x,n.y)) continue; const col= n.owner===F? '#3b82f6': n.owner!==2? BW.facPal(n.owner).color : (n.eco? (n.eco==='farm'?'#eab308': n.eco==='granary'?'#8bc34a':'#60a5fa') :'#cbd5e1');
          const px=6+(n.x/BW.W)*(ow-12), py=4+(n.y/BW.H)*(oh-8);
          m.fillStyle=col; m.beginPath(); m.arc(px,py,n.camp?3:(n.eco?2.2:1.6),0,7); m.fill(); } }
      c.drawImage(mm,ox,oy,ow,oh);
      const scale2=this.scale||1; const viewW=vw/scale2;
      const viewH=(this.lastVh||600)/scale2;
      c.strokeStyle='#fff'; c.lineWidth=2; { const x0=Math.max(0,this.camX), y0=Math.max(0,this.camY), x1=Math.min(BW.W,this.camX+viewW), y1=Math.min(BW.H,this.camY+viewH);
        const rw=Math.max(8,((x1-x0)/BW.W)*(ow-12)), rh=Math.max(6,((y1-y0)/BW.H)*(oh-8));
        rr(c,Math.min(ox+ow-6-rw,ox+6+(x0/BW.W)*(ow-12)),Math.min(oy+oh-4-rh,oy+4+(y0/BW.H)*(oh-8)),rw,rh,4); c.stroke(); } c.globalAlpha=1; }
    // 🔔 THÔNG BÁO chạm để nhảy tới nơi xảy ra: chữ tự co/xuống dòng theo chỗ trống, thiếu chỗ thì nhường cho tin mới nhất
    this._noteRects=[];
    { c.textAlign='left'; const maxLines=L.narrow?3:2, hOf=(n)=>16+n*18;
      const lay=(list)=>{ let y=L.noteY; const out=[];
        for(const nt of list){ const icon=nt.icon||'', txt= icon&&nt.text.startsWith(icon)? nt.text.slice(icon.length).replace(/^\s+/,'') : nt.text; // biểu tượng chỉ vẽ một lần
          const maxW=Math.max(60,L.noteMaxW(y,hOf(maxLines))-46); let fs=15, lines=null, tw=0; const ft=nt._fit;
          if(ft&&ft.maxW===maxW&&ft.text===nt.text&&ft.ml===maxLines){ fs=ft.fs; lines=ft.lines; tw=ft.tw; }   /* (5.1) đo chữ một lần cho mỗi thông báo, không đo lại mỗi khung hình */
          else { for(;fs>=12;fs--){ c.font=`800 ${fs}px ${FONT}`; if(c.measureText(txt).width<=maxW){ lines=[txt]; break; } }
            if(!lines){ fs=13; c.font=`800 ${fs}px ${FONT}`; lines=bwWrap(c,txt,maxW,maxLines); }
            c.font=`800 ${fs}px ${FONT}`; for(const s of lines) tw=Math.max(tw,c.measureText(s).width); nt._fit={maxW,text:nt.text,ml:maxLines,fs,lines,tw}; }
          const h=hOf(lines.length); out.push({nt,icon,fs,lines,x:L.noteX,y,w:Math.ceil(tw)+46,h}); y+=h+6; }
        return {out,bottom:y-6}; };
      // máy cầm DỌC: thẻ binh chủng nằm ngay trên nút 📣 → thông báo phải dừng phía trên thẻ (máy ngang thì thẻ nằm hàng đáy, không vướng)
      const chipOn=!!((this.sel||this.selA||(this.selG&&this.selG.length>1))&&!this.rallyOpen&&!this.rallyPick&&!(this.menu&&!this.autoMenu)&&!this.over);
      const noteBottom= chipOn&&L.narrow&&L.vh>L.vw? L.rally.y-8-60-6 : L.noteBottom;
      let list=this.notes, R=lay(list); while(list.length>1&&R.bottom>noteBottom){ list=list.slice(1); R=lay(list); }
      for(const it of R.out){ const al= it.nt.t>5.6? (7-it.nt.t)/1.4 : 1;
        c.globalAlpha=0.92*al*ha; c.fillStyle='rgba(25,15,45,0.9)'; rr(c,it.x,it.y,it.w,it.h,10); c.fill();
        c.strokeStyle='rgba(255,213,74,0.7)'; c.lineWidth=2; rr(c,it.x,it.y,it.w,it.h,10); c.stroke();
        c.font='17px system-ui'; c.fillStyle='#ffe9c9'; c.fillText(it.icon,it.x+10,it.y+24);
        c.font=`800 ${it.fs}px ${FONT}`; it.lines.forEach((s,i)=>c.fillText(s,it.x+34,it.y+23+i*18));
        c.globalAlpha=1; this._noteRects.push({x:it.x,y:it.y,w:it.w,h:it.h,nt:it.nt}); }
      c.textAlign='center'; }
    // ➕➖ thu phóng chủ động (cột phải)
    this._zBtns=[];
    for(const z of L.zooms){ c.fillStyle='rgba(30,24,54,0.85)'; c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=2; rr(c,z.x,z.y,z.w,z.h,12); c.fill(); c.stroke();
      c.font=`900 ${Math.round(z.h*0.65)}px ${FONT}`; c.textAlign='center'; c.fillStyle='#ffe9c9'; c.fillText(z.dir>0?'+':'−',z.x+z.w/2,z.y+z.h*0.74);
      this._zBtns.push(z); }
    // 🔍 nút thoát zoom: máy rộng nằm dưới bản đồ nhỏ, máy hẹp/dọc thu thành ô vuông trên nút +
    if(L.ovw){ const o=L.ovw; this._zoomBtn={x:o.x,y:o.y,w:o.w,h:o.h}; c.globalAlpha=Math.max(ha,0.6);
      c.fillStyle='rgba(30,24,54,0.88)'; c.strokeStyle='#93c5fd'; c.lineWidth=2.5; rr(c,o.x,o.y,o.w,o.h,12); c.fill(); c.stroke(); c.textAlign='center';
      if(o.wide){ c.font=`900 18px ${FONT}`; c.fillStyle='#bfdbfe'; c.fillText('🔍 OVERVIEW',o.x+o.w/2,o.y+29); }
      else { c.font=`${Math.round(o.h*0.5)}px system-ui`; c.fillStyle='#bfdbfe'; c.fillText('🔍',o.x+o.w/2,o.y+o.h*0.68); }
      c.globalAlpha=1; }
    else this._zoomBtn=null;
    // 🏳️ nút rút lui khi quân ta đang trong trận được zoom tới
    this._retreatBtn=null;
    { const b=this.focusB?this.battleOf(this.focusB):null;
      if(b){ const myArm=[...b.A.es,...b.B.es].some(e=>e.kind==='army'&&e.ref.owner===F);
        if(myArm){ const {x:bx,y:by,w:bw2,h:bh}=L.retreat; this._retreatBtn={x:bx,y:by,w:bw2,h:bh,b};
          c.fillStyle='rgba(120,30,30,0.92)'; c.strokeStyle='#ffd54a'; c.lineWidth=3; rr(c,bx,by,bw2,bh,13); c.fill(); c.stroke();
          c.font=`900 20px ${FONT}`; c.textAlign='center'; c.fillStyle='#ffe9c9'; c.fillText('🏳️ RETREAT',bx+bw2/2,by+31); } } }
    // 🔲 vùng quét đang kéo
    if(this.box){ const B=this.box, bx=Math.min(B.x0,B.x1), by=Math.min(B.y0,B.y1), bw2=Math.abs(B.x1-B.x0), bh=Math.abs(B.y1-B.y0);
      c.fillStyle='rgba(125,255,207,0.14)'; c.fillRect(bx,by,bw2,bh);
      c.strokeStyle='#7dffcf'; c.lineWidth=2; c.setLineDash([8,5]); c.strokeRect(bx,by,bw2,bh); c.setLineDash([]);
      for(const [px,py] of [[bx,by],[bx+bw2,by],[bx,by+bh],[bx+bw2,by+bh]]){ c.fillStyle='#7dffcf'; c.fillRect(px-4,py-4,8,8); }
      const sc=this.scale||1, wx0=bx/sc+this.camX, wx1=(bx+bw2)/sc+this.camX, wy0=by/sc+(this.camY||0), wy1=(by+bh)/sc+(this.camY||0);
      const n=this.armies.filter(a=>a.owner===F&&!a.done&&a.count>0&&!a.btl&&a.x>=wx0&&a.x<=wx1&&((a.y>=wy0&&a.y<=wy1)||(a.y-28>=wy0&&a.y-28<=wy1))).length;
      const t=n? `👥 ${n} armies` : '🔲 Drag to select';
      c.font=`800 14px ${FONT}`; const tw=c.measureText(t).width+16; const ly=by>L.Y0+30? by-26 : by+bh+6, lx=Math.max(L.X0+4,Math.min(L.X1-tw-4,bx));
      c.fillStyle='rgba(20,14,34,0.85)'; rr(c,lx,ly,tw,22,7); c.fill(); c.fillStyle='#7dffcf'; c.textAlign='left'; c.fillText(t,lx+8,ly+16); c.textAlign='center'; }
    // 📣 NÚT GỌI QUÂN cố định ở mép trái (trên nút phục kích)
    this._rallyMenu=null; this._hintBox=null;
    { const {x:bx,y:by,w:bs}=L.rally; this._rallyBtn={x:bx,y:by,w:bs,h:bs};
      c.globalAlpha=this.rallyPick||this.rallyOpen?1:0.85; c.fillStyle=this.rallyPick?'rgba(255,213,74,0.95)':'rgba(30,24,54,0.85)'; c.strokeStyle='rgba(255,213,74,0.8)'; c.lineWidth=2;
      rr(c,bx,by,bs,bs,24); c.fill(); c.stroke(); c.textAlign='center'; if(this.rallyPick){ c.font=`900 26px ${FONT}`; c.fillStyle='#3a2405'; c.fillText('✕',bx+bs/2,by+34); } else { c.font='24px system-ui'; c.fillText('📣',bx+bs/2,by+33); } c.globalAlpha=1;
      this._rallyRects=[];
      if(this.rallyOpen){ const opts=[[5,'📣 Call 5 nearest camps'],[10,'📣 Call 10 nearest camps'],[-1,'🚑 Rescue a camp under attack'],[Infinity,'🚩 General mobilization'],[0,'✖ Cancel']];
        const mwMax=L.X1-8-(bx+bs+8); let fs=16, tw=0; for(;fs>=12;fs--){ c.font=`800 ${fs}px ${FONT}`; tw=0; for(const o of opts) tw=Math.max(tw,c.measureText(o[1]).width); if(tw+30<=mwMax) break; } fs=Math.max(12,fs);
        const mx=bx+bs+8, mw=Math.max(170,Math.min(mwMax,tw+30)), yTop=(L.bar&&mx<L.bar.x+L.bar.w+6)? L.bar.y+L.bar.h+6 : L.Y0+8;
        const ih=Math.min(42,Math.floor((L.Y1-8-yTop-10)/opts.length)), mh=opts.length*ih+10, my2=Math.max(yTop,Math.min(L.Y1-mh-8,by+bs-mh));
        this._rallyMenu={x:mx,y:my2,w:mw,h:mh};
        c.fillStyle='rgba(25,15,45,0.95)'; rr(c,mx,my2,mw,mh,12); c.fill(); c.strokeStyle='#ffd54a'; c.lineWidth=2; rr(c,mx,my2,mw,mh,12); c.stroke(); c.textAlign='left';
        opts.forEach(([n,t],i)=>{ const oy=my2+5+i*ih; c.fillStyle=i%2?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.08)'; rr(c,mx+5,oy,mw-10,ih-5,9); c.fill();
          c.font=`800 ${fs}px ${FONT}`; c.fillStyle=n?'#ffe9c9':'#f6b1a4'; c.fillText(t,mx+14,oy+(ih-5)/2+fs*0.36); this._rallyRects.push({x:mx+5,y:oy,w:mw-10,h:ih-5,n}); });
        c.textAlign='center'; }
      if(this.rallyPick){ const t= this.rallyPick<0? '🚑 Tap the camp to rescue — tap ✖ to cancel' : `📍 Tap a camp or a spot to rally at (${this.rallyPick===Infinity?'general mobilization':'call '+this.rallyPick+' camps'}) — tap ✖ to cancel`;
        // nằm sát đáy, bên phải nút ✖ — không che thông báo và không tràn màn hình hẹp
        const x0=bx+bs+10, xR=L.X1-66, maxW=xR-x0-24; let fs=15, lines=null; for(;fs>=13;fs--){ c.font=`800 ${fs}px ${FONT}`; if(c.measureText(t).width<=maxW){ lines=[t]; break; } }
        if(!lines){ fs=13; c.font=`800 ${fs}px ${FONT}`; lines=bwWrap(c,t,maxW,3); }
        let tw=0; for(const s of lines) tw=Math.max(tw,c.measureText(s).width); const bw3=Math.ceil(tw)+24, bh3=12+lines.length*18, hx=Math.max(x0,Math.min(xR-bw3,L.cx-bw3/2)), hy=by+bs-bh3;
        this._hintBox={x:hx,y:hy,w:bw3,h:bh3}; c.fillStyle='rgba(25,15,45,0.9)'; rr(c,hx,hy,bw3,bh3,9); c.fill();
        c.fillStyle='#ffd54a'; c.textAlign='center'; lines.forEach((s,i)=>c.fillText(s,hx+bw3/2,hy+19+i*18)); } }
    // 🎖️ THẺ BINH CHỦNG của đội quân đang chọn: loại quân · quân số · đang đứng ở địa hình nào · tại đó khắc ai/ngại ai · đi được đâu
    this._unitChip=null;
    { const grp=(this.selG&&this.selG.length>1)? this.selG.filter(a=>!a.done&&a.count>0) : null, one=this.sel||this.selA;
      if((one||grp)&&!this.rallyOpen&&!this.rallyPick&&!(this.menu&&!this.autoMenu)&&!this.over){ let l1, l2;
        if(grp&&grp.length>1){ const by={}; let tot=0; for(const a of grp){ by[a.type]=(by[a.type]||0)+a.count; tot+=a.count; }
          l1=`👥 ${grp.length} armies · ${Math.round(tot)} troops`; l2=Object.keys(by).sort((p,q)=>by[q]-by[p]).slice(0,4).map(t=>`${UNIT[t]?UNIT[t].emoji:''} ${Math.round(by[t])}`).join('   '); }
        else { const u=one, t=u.type, ter=u.ter||this.terAt(u.x,u.y), M=bwMatch(t,ter), cv=this.civOf(u.owner), em=(arr)=>arr.slice(0,4).map(x=>UNIT[x].emoji).join(' ');
          l1=`${UNIT[t]?UNIT[t].emoji:'⚔️'} ${bwTypeName(t,1)} ×${Math.round(u.count)}${cv&&cv.sig===t?' ⭐':''} · on ${BW.terIcon[ter]||''} ${BW.terName[ter]||ter}`;
          const slow=Math.round((1-BW.sizeSpd(u.count))*100), mix= u===this.sel? this.mixList(u) : [], mv= (BW_TYPE_MOVE[t]||'🚶 any terrain')+(slow>=8? ` · 🐢 −${slow}% speed` : '');
          let sup='';   /* 🌾 lương của đạo quân ngoài đồng: còn bao nhiêu, đủ đi bao lâu, đang gom lương hay xe lương đang tới */
          if(u===this.selA&&!this.sel){ const fv=Math.round(u.food??100), left=Math.round(this.packT(u)*fv/100/(u.camped?0.5:1));
            sup= (u.prep>0? `🌾 preparing ${Math.ceil(u.prep)}s` : `🌾 ${fv}% ≈ ${left}s`+(u._cv? ' · 🐂 convoy coming' : fv<BW.food.low? ' · ⚠️ no depot in range' : ''))+'   '; }
          if(mix.length>1) l1=`🏰 ${Math.round(u.count)} troops: `+mix.slice(0,4).map(q=>`${UNIT[q[0]]?UNIT[q[0]].emoji:''} ${Math.round(q[1])}`).join(' · ')+` · on ${BW.terIcon[ter]||''} ${BW.terName[ter]||ter}`;
          l2=`${sup}${M.good.length? '▲ beats '+em(M.good)+'   ' : ''}${M.bad.length? '▼ weak to '+em(M.bad)+'   ' : ''}${mv}`; }
        const up= L.narrow&&L.vh>L.vw;   /* máy dọc hẹp: thẻ nằm trên nút 📣; còn lại (kể cả máy ngang nhỏ): hàng đáy, bên phải nút mai phục */
        const x0= up? L.X0+10 : L.amb.x+L.amb.w+10, maxW=L.X1-66-x0-20, bottom= up? L.rally.y-8 : L.Y1-10;
        if(maxW>=120){ let f1=bwFit(c,l1,maxW,800,15,11); const w1=c.measureText(l1).width; c.font=`700 12px ${FONT}`; const ls=bwWrap(c,l2,maxW,this._retreatBtn&&!up? 1 : 2); let w2=0; for(const q of ls) w2=Math.max(w2,c.measureText(q).width);
          const bw3=Math.ceil(Math.max(w1,w2))+20, bh3=12+18+ls.length*15, by3=bottom-bh3; this._unitChip={x:x0,y:by3,w:bw3,h:bh3};
          c.fillStyle='rgba(25,15,45,0.86)'; rr(c,x0,by3,bw3,bh3,10); c.fill(); c.strokeStyle='rgba(125,255,207,0.55)'; c.lineWidth=1.5; rr(c,x0,by3,bw3,bh3,10); c.stroke();
          c.textAlign='left'; c.font=`800 ${f1}px ${FONT}`; c.fillStyle='#ffe9c9'; c.fillText(l1,x0+10,by3+20);
          c.font=`700 12px ${FONT}`; c.fillStyle='#bfe9d8'; ls.forEach((q,i)=>c.fillText(q,x0+10,by3+36+i*15)); c.textAlign='center'; } } }
    if(this.drawGearHud) this.drawGearHud(c,L,tm);   // 🎒 nút + bảng quân nhu (src/09e_gear.js) — vẽ sau thẻ binh chủng để bảng nằm trên
    // 📋 MENU LỆNH ngữ cảnh: bề rộng theo chữ, luôn nằm trọn trong vùng an toàn và né cột nút phải
    this._menuRects=[]; this._orderMenu=null;
    if(this.menu&&!this.autoMenu){ const m=this.menu;
      const sc2=this.scale||1; let mx=(m.wx-this.camX)*sc2, my2=(m.wy-this.camY)*sc2;
      const zc=L.narrow?0:66, mwMax=Math.min(360,L.W-20-zc); let fs=18, tw=0; for(;fs>=12;fs--){ c.font=`800 ${fs}px ${FONT}`; tw=0; for(const o of m.opts) tw=Math.max(tw,c.measureText(o.s).width); if(tw+38<=mwMax) break; } fs=Math.max(12,fs); // máy hẹp: menu (hộp chặn) được phủ cột nút ＋－
      // 🌾 dòng dự báo hậu cần (chuẩn bị lương bao lâu · đi bao lâu · lương có đủ không): chữ nhỏ, tự xuống dòng, không bấm được
      let inf=null, ihd=0; if(m.info){ c.font=`700 12px ${FONT}`; const iw=Math.max(190,Math.min(mwMax,Math.max(Math.ceil(tw)+38,Math.ceil(c.measureText(m.info.s).width)+30))); inf=bwWrap(c,m.info.s,iw-28,2); let w2=0; for(const q of inf) w2=Math.max(w2,c.measureText(q).width); tw=Math.max(tw,w2-10); ihd=inf.length*15+7; }
      /* (5.4) hàng chọn BINH CHỦNG (khi kho có ≥2 loại) và hàng chọn LƯỢNG quân — chỉ khi ra lệnh từ một cứ điểm của ta */
      let selN=null, selRows=[], selH=0; if(m.src&&m.src.kind==='node'&&m.src.ref&&m.src.ref.owner===this.localFid&&m.src.ref.count>=BW.sendMin*2&&m.opts.some(o=>o.id==='attack'||o.id==='move'||o.id==='siege'||o.id==='hunt'||o.id==='merge'||o.id==='join')){ selN=m.src.ref;
        const S=this.sendSel&&this.sendSel.node===selN.id? this.sendSel : {type:null,frac:1}, ml=this.mixList(selN);
        if(ml.length>1) selRows.push([{s:'All types',on:!S.type||!(this.mixOf(selN)[S.type]>0),sel:{node:selN.id,type:null}}].concat(ml.slice(0,4).map(q=>({s:`${UNIT[q[0]]?UNIT[q[0]].emoji:''} ${Math.round(q[1])}`,on:S.type===q[0],sel:{node:selN.id,type:q[0]}}))));
        selRows.push(BW.sendFracs.map(q=>({s:q[1],on:(S.frac||1)===q[0],sel:{node:selN.id,frac:q[0]}})).concat([{s:`→ ${this.selGoing(selN)}`,lab:1}]));
        selH=selRows.length*36+2; ihd+=selH; tw=Math.max(tw, selRows.reduce((w,r)=>Math.max(w,r.length*58-38),0)); }
      const mw=Math.max(190,Math.min(mwMax,Math.ceil(tw)+38)), ih=Math.min(46,Math.floor((L.Y1-L.Y0-30-ihd)/m.opts.length)), mh=m.opts.length*ih+14+ihd;
      mx=Math.max(L.X0+10,Math.min(L.X1-mw-Math.max(10,zc),mx+30)); my2=Math.max(L.Y0+8,Math.min(L.Y1-mh-8,my2-mh/2));
      // không chui xuống dưới cụm nút 🏠↻⏸: nút HTML nằm trên canvas sẽ che mất dòng lệnh
      if(L.bar){ const B=L.bar; if(mx<B.x+B.w+6&&mx+mw>B.x-6&&my2<B.y+B.h+6&&my2+mh>B.y-6){ if(B.y+B.h+8+mh<=L.Y1-8) my2=B.y+B.h+8; else mx=Math.max(mx,Math.min(L.X1-mw-10,B.x+B.w+8)); } }
      this._orderMenu={x:mx,y:my2,w:mw,h:mh};
      c.fillStyle='rgba(25,15,45,0.95)'; rr(c,mx,my2,mw,mh,14); c.fill();
      c.strokeStyle='#ffd54a'; c.lineWidth=2.5; rr(c,mx,my2,mw,mh,14); c.stroke();
      c.textAlign='left';
      if(inf){ c.font=`700 12px ${FONT}`; c.fillStyle= m.info.warn? '#ffb4a8' : '#cfe9b5'; inf.forEach((q,i)=>c.fillText(q,mx+16,my2+19+i*15)); }
      if(selN){ const y0=my2+7+ihd-selH; selRows.forEach((row,ri)=>{ const n=row.length, gap=5, cw=(mw-16-gap*(n-1))/n, cy=y0+ri*36; row.forEach((q,ci)=>{ const cx=mx+8+ci*(cw+gap);
            if(q.lab){ c.font=`800 13px ${FONT}`; c.fillStyle='#7dffcf'; c.textAlign='center'; c.fillText(q.s,cx+cw/2,cy+20); c.textAlign='left'; return; }
            c.fillStyle= q.on? '#ffd54a' : 'rgba(255,255,255,0.12)'; rr(c,cx,cy,cw,30,9); c.fill(); c.font=`800 ${cw<52?12:14}px ${FONT}`; c.fillStyle= q.on? '#2b1d00' : '#ffe9c9'; c.textAlign='center'; c.fillText(q.s,cx+cw/2,cy+20); c.textAlign='left';
            this._menuRects.push({x:cx,y:cy-2,w:cw,h:34,sel:q.sel,id:'sel'}); }); }); }
      m.opts.forEach((o,i)=>{ const oy=my2+7+ihd+i*ih;
        c.fillStyle= i%2? 'rgba(255,255,255,0.04)':'rgba(255,255,255,0.08)'; rr(c,mx+6,oy,mw-12,ih-6,10); c.fill();
        c.font=`800 ${fs}px ${FONT}`; c.fillStyle= o.id==='cancel'? '#f6b1a4':'#ffe9c9'; c.fillText(o.s,mx+18,oy+(ih-6)/2+fs*0.36);
        this._menuRects.push({x:mx+6,y:oy,w:mw-12,h:ih-6,id:o.id}); });
      c.textAlign='center'; }
    // dòng hướng dẫn 9 giây đầu: tự xuống dòng trên máy hẹp, nằm trên mép đáy an toàn
    if(!this.tut && !this.sel && !this.selA && this.time<9 && !this.rallyPick && !this.rallyOpen && !this.menu){ const a2=0.6+0.4*Math.sin(tm*4); c.globalAlpha=a2; c.lineWidth=5; c.strokeStyle='#2a1a12'; c.textAlign='center';
      const s='Tap a BLUE army, then tap ANYWHERE: empty ground = camp, enemy = pursue. Forests/valleys/fords trigger AUTO-AMBUSH x2–x10. Enemy numbers stay hidden — 🕵️ SCOUT them!';
      const sShort='Tap a BLUE army, then tap a target. Forests, valleys & fords = AMBUSH. 🕵️ SCOUT hidden enemies!';
      const maxW=L.W-28; let fz=16, lines=null; for(;fz>=13;fz--){ c.font=`800 ${fz}px ${FONT}`; if(c.measureText(s).width<=maxW){ lines=[s]; break; } }
      if(!lines){ fz=13; c.font=`800 ${fz}px ${FONT}`; lines=bwWrap(c,s,maxW,9); if(lines.length>3) lines=bwWrap(c,sShort,maxW,3); } // quá 3 dòng sẽ đè nút 📣 → dùng câu ngắn
      const lh=fz+4; let tw=0; for(const ln of lines) tw=Math.max(tw,c.measureText(ln).width); this._hintBox={x:L.cx-tw/2,y:L.Y1-12-lines.length*lh,w:tw,h:lines.length*lh};
      lines.forEach((ln,i)=>{ const yy=L.Y1-16-(lines.length-1-i)*lh; c.strokeText(ln,L.cx,yy); c.fillStyle='#ffe27a'; c.fillText(ln,L.cx,yy); }); c.globalAlpha=1; }
  }
}
