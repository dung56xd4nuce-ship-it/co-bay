// ============ 🏛️ CÁC NỀN VĂN MINH ============
// Mỗi nước lấy tên theo NỀN VĂN MINH / TRIỀU ĐẠI hùng mạnh nhất của mình trong lịch sử, có một BINH CHỦNG SỞ TRƯỜNG
// (trại sinh quân loại đó, đánh mạnh hơn khi dùng đúng sở trường) và 1–2 thế mạnh riêng.
// Thế mạnh (đều là hệ số): atk = sát thương binh chủng sở trường (mặc định 1.15) · spd = tốc độ hành quân (spdType: chỉ loại quân đó)
//   road = tốc độ trên đường cái · sup = mức tiêu lương · cap = sức chứa lương · grow = tốc độ sinh quân · def = giữ cứ điểm
//   amb = sức phục kích · siege = công thành (giảm lợi thế công sự của địch) · ter = địa hình đánh mạnh +15%
//   pass: 'f' = bộ binh (kể cả đại quân) đi xuyên rừng nhanh · 'm' = leo núi nhanh
const BW_REGIONS=[['asia','Asia','🌏'],['europe','Europe','🏰'],['africa','Africa','🦁'],['americas','Americas','🌽'],['oceania','Oceania','🌊']];
const BW_CIVS=[
  // --- Châu Á ---
  ['daiviet','Đại Việt','Trần Dynasty · 13th century','asia','🐉','spear','archer','saber',{amb:1.3,pass:'f'},'Broke three Mongol invasions with jungle ambushes and river stakes at Bạch Đằng.'],
  ['tang','Tang China','Tang Dynasty · 7th–8th century','asia','🏮','crossbow','cavalry','spear',{cap:1.25,grow:1.1},'The golden age of imperial China: vast, well-supplied armies and massed crossbows.'],
  ['japan','Japan','Tokugawa Shogunate · 17th century','asia','⛩️','swordsman','archer','spear',{atk:1.25,def:1.1},'The samurai order at its height, united after Sekigahara.'],
  ['goguryeo','Goguryeo','Korea · Gwanggaeto the Great · 5th century','asia','🐯','archer','cavalry','shield',{def:1.25,pass:'m'},'Mountain fortresses and master archers that stopped the armies of Sui and Tang.'],
  ['mongol','Mongol Empire','Genghis Khan · 13th century','asia','🐺','cavalry','archer','spear',{spd:1.2,spdType:'cavalry',sup:0.6},'The largest land empire in history, built from the saddle.'],
  ['khmer','Khmer Empire','Angkor · Jayavarman VII · 12th century','asia','🛕','spear','shield','archer',{grow:1.25,cap:1.15},'Angkor\'s great reservoirs fed the largest city of the pre-industrial world.'],
  ['maurya','Maurya Empire','India · Ashoka · 3rd century BC','asia','🦚','archer','cavalry','spear',{cap:1.3},'Ancient India united under one of the largest standing armies of antiquity.'],
  ['persia','Persia','Achaemenid Empire · Darius the Great · 5th century BC','asia','🦁','archer','cavalry','spear',{road:1.25,cap:1.15},'The Royal Road tied together the first true world empire.'],
  ['ottoman','Ottoman Empire','Suleiman the Magnificent · 16th century','asia','🌙','crossbow','cavalry','saber',{siege:1.25,atk:1.2},'Janissary marksmen and great siege trains took Constantinople and beyond.'],
  ['siam','Siam','Ayutthaya Kingdom · Naresuan · 16th century','asia','🐘','saber','spear','archer',{amb:1.15,grow:1.1},'Elephant duels and river fortresses of the city of Ayutthaya.'],
  ['majapahit','Majapahit','Java · Gajah Mada · 14th century','asia','🗡️','saber','archer','spear',{sup:0.75,cap:1.1},'A maritime empire that bound the islands of the archipelago together.'],
  ['tibet','Tibetan Empire','Trisong Detsen · 8th century','asia','🏔️','shield','cavalry','archer',{pass:'m',def:1.1},'Armoured warriors of the plateau who once seized the Tang capital.'],
  ['timurid','Timurid Empire','Timur · 14th century','asia','🏇','cavalry','archer','saber',{siege:1.2,spd:1.1},'Timur\'s riders stormed city after city from Delhi to Damascus.'],
  ['chola','Chola Empire','South India · Rajendra I · 11th century','asia','🐅','swordsman','archer','spear',{grow:1.15,sup:0.8},'A tiger-banner sea power whose fleets reached Southeast Asia.'],
  ['umayyad','Umayyad Caliphate','7th–8th century','asia','🐪','cavalry','spear','archer',{ter:'desert',spd:1.1},'Desert-born armies that rode from Iberia to the Indus in a single century.'],
  ['assyria','Assyria','Neo-Assyrian Empire · Ashurbanipal · 7th century BC','asia','🐂','spear','archer','cavalry',{siege:1.3},'The first masters of siege warfare: rams, towers and iron discipline.'],
  ['babylon','Babylon','Nebuchadnezzar II · 6th century BC','asia','🌴','archer','spear','shield',{def:1.3},'Behind the greatest walls of the ancient world.'],
  ['hittite','Hittite Empire','Suppiluliuma I · 14th century BC','asia','🔨','cavalry','spear','shield',{atk:1.2},'Iron-working charioteers who fought Egypt to a standstill at Kadesh.'],
  // --- Châu Âu ---
  ['rome','Rome','Roman Empire · Trajan · 2nd century','europe','🏛️','shield','swordsman','cavalry',{road:1.25,def:1.1},'Legions, shield walls and roads that all led to Rome.'],
  ['macedon','Macedon','Alexander the Great · 4th century BC','europe','🌟','spear','cavalry','shield',{atk:1.2,spd:1.1},'The sarissa phalanx that never lost a battle under Alexander.'],
  ['sparta','Sparta','Greece · Leonidas · 5th century BC','europe','🔺','shield','spear','swordsman',{atk:1.25,def:1.1},'A whole city trained for war; come back with your shield, or on it.'],
  ['byzantium','Byzantine Empire','Macedonian Dynasty · Basil II · 10th–11th century','europe','🏰','cavalry','shield','archer',{def:1.2,sup:0.85},'Cataphracts and the walls of Constantinople guarded Rome\'s legacy for a thousand years.'],
  ['vikings','Vikings','North Sea Empire · Cnut the Great · 11th century','europe','🪓','assassin','shield','swordsman',{spd:1.15,amb:1.15},'Raiders who struck from the water and vanished before help arrived.'],
  ['franks','Franks','Carolingian Empire · Charlemagne · 8th–9th century','europe','⚜️','cavalry','swordsman','spear',{atk:1.2},'Armoured horsemen who forged a new empire in the West.'],
  ['england','England','Plantagenet Dynasty · Edward III · 14th century','europe','🌹','archer','swordsman','spear',{atk:1.2,def:1.1},'The longbow that won Crécy and Agincourt.'],
  ['huns','Huns','Attila · 5th century','europe','🐴','cavalry','archer','assassin',{spd:1.2,amb:1.1},'Horse archers whose name alone emptied cities.'],
  ['gauls','Gauls','Celts · Vercingetorix · 1st century BC','europe','🐗','swordsman','spear','cavalry',{pass:'f',amb:1.15},'Fierce warriors of the forests who defied Caesar.'],
  ['rus','Kievan Rus\'','Yaroslav the Wise · 11th century','europe','🐻','spear','shield','archer',{pass:'f',def:1.15},'River princes of the northern forests.'],
  ['spain','Spain','Habsburg Spain · Charles V · 16th century','europe','⛵','spear','crossbow','swordsman',{cap:1.2,atk:1.15},'Pike-and-shot tercios funded by the silver of two worlds.'],
  ['hre','Holy Roman Empire','Hohenstaufen · Frederick Barbarossa · 12th century','europe','👑','swordsman','cavalry','crossbow',{def:1.15,atk:1.15},'Castles, knights and free cities under one imperial crown.'],
  ['poland','Poland–Lithuania','Winged Hussars · 16th–17th century','europe','🦅','cavalry','spear','saber',{atk:1.25},'The winged hussars — the most feared cavalry charge in Europe.'],
  ['swiss','Swiss Confederacy','15th century','europe','⛰️','spear','crossbow','swordsman',{pass:'m',atk:1.2},'Mountain pikemen no knight could ride down.'],
  // --- Châu Phi ---
  ['egypt','Egypt','New Kingdom · Ramesses II · 13th century BC','africa','🐊','archer','cavalry','spear',{grow:1.2,ter:'desert'},'The Nile fed the armies of the pharaohs for three thousand years.'],
  ['carthage','Carthage','Barcid Dynasty · Hannibal · 3rd century BC','africa','⚓','cavalry','spear','swordsman',{amb:1.25},'Hannibal crossed the Alps and sprang the greatest ambushes of antiquity.'],
  ['mali','Mali Empire','Keita Dynasty · Mansa Musa · 14th century','africa','💰','cavalry','archer','spear',{cap:1.3},'The gold of Mali made its king the richest ruler of his age.'],
  ['kush','Kush','25th Dynasty · Taharqa · 7th century BC','africa','🐆','archer','spear','cavalry',{atk:1.2,ter:'desert'},'Nubia, the "Land of the Bow", whose kings ruled Egypt as pharaohs.'],
  ['aksum','Aksum','King Ezana · 4th century','africa','🏺','spear','archer','shield',{pass:'m',grow:1.1},'A highland trading empire of the Horn of Africa.'],
  ['zulu','Zulu Kingdom','Shaka · 19th century','africa','🐃','spear','shield','assassin',{spd:1.2,atk:1.15},'Shaka\'s regiments ran barefoot and closed in with the "horns of the buffalo".'],
  // --- Châu Mỹ ---
  ['maya','Maya','Classic Maya · Tikal & Calakmul · 7th–8th century','americas','🌽','spear','archer','assassin',{pass:'f',amb:1.25},'City-states of the rainforest, masters of the jungle raid.'],
  ['aztec','Aztec Empire','Triple Alliance · Ahuitzotl · 15th century','americas','🌵','saber','archer','spear',{atk:1.2,grow:1.1},'Eagle and Jaguar warriors with obsidian-edged blades.'],
  ['inca','Inca Empire','Tawantinsuyu · Pachacuti · 15th century','americas','☀️','archer','spear','shield',{pass:'m',road:1.2},'Slingers of the Andes and a road network across the roof of the world.'],
  ['iroquois','Haudenosaunee','Iroquois Confederacy · 17th century','americas','🪶','assassin','archer','spear',{pass:'f',amb:1.2},'Five nations under the Great Law of Peace, unmatched in forest warfare.'],
  // --- Châu Đại Dương ---
  ['tonga','Tonga','Tuʻi Tonga Empire · 13th century','oceania','🛶','swordsman','spear','assassin',{sup:0.7,spd:1.1},'Voyaging chiefs whose canoes ruled the central Pacific.'],
  ['maori','Māori','Aotearoa · fortified pā','oceania','🌀','swordsman','spear','assassin',{def:1.25,amb:1.15},'Hilltop pā fortresses and warriors famed for the haka.'],
].map((r,i)=>{ const h=Math.round(i*137.5+18)%360; return Object.assign({id:r[0],name:r[1],era:r[2],reg:r[3],icon:r[4],sig:r[5],roster:[r[5],r[6],r[7]],blurb:r[9],idx:i,atk:1.15,color:`hsl(${h} 68% 50%)`,light:`hsl(${h} 82% 80%)`},r[8]); });
const BW_CIV={}; for(const cv of BW_CIVS) BW_CIV[cv.id]=cv;
// đối thủ theo ải 1v1 (ải càng cao, đế chế càng lẫy lừng)
const BW_BOSS_CIVS=['gauls','vikings','aztec','carthage','persia','japan','ottoman','rome','tang','mongol'];
function civPct(v){ return Math.round(Math.abs(v-1)*100); }
// các dòng mô tả thế mạnh (hiện ở màn chọn nước)
function civPerks(cv){ const out=[], u=UNIT[cv.sig]? UNIT[cv.sig].name : cv.sig, tn=(t)=>BW.terName[t]||t;
  out.push(`${UNIT[cv.sig].emoji} Elite ${bwTypeName(cv.sig,1)}: +${civPct(cv.atk)}% damage · camps train them`);
  if(cv.spd) out.push(`🏃 ${cv.spdType? bwTypeName(cv.spdType,1)+' march' : 'All troops march'} +${civPct(cv.spd)}% faster`);
  if(cv.road) out.push(`🛣️ +${civPct(cv.road)}% speed on roads`);
  if(cv.sup) out.push(`🌾 Armies use ${civPct(cv.sup)}% less supply`);
  if(cv.cap) out.push(`📦 Supply capacity +${civPct(cv.cap)}%`);
  if(cv.grow) out.push(`🌱 Troops grow +${civPct(cv.grow)}% faster`);
  if(cv.def) out.push(`🏰 Posts defend +${civPct(cv.def)}% stronger`);
  if(cv.amb) out.push(`🪤 Ambushes hit +${civPct(cv.amb)}% harder`);
  if(cv.siege) out.push(`🏯 Siege masters: enemy fortifications −${civPct(1/cv.siege)}%`);
  if(cv.ter) out.push(`${BW.terIcon[cv.ter]||''} +15% damage in ${tn(cv.ter)}`);
  if(cv.pass&&cv.pass.indexOf('f')>=0) out.push('🌲 Infantry of any size crosses forests quickly');
  if(cv.pass&&cv.pass.indexOf('m')>=0) out.push('⛰️ Infantry of any size crosses mountains quickly');
  return out; }
// binh chủng: đi được đâu (khắc ai/sợ ai tính trực tiếp từ bảng khắc chế + địa hình, xem bwMatch)
const BW_TYPE_MOVE={ cavalry:'🛣️ open ground & roads only · fast', shield:'🚶 any terrain · slow', assassin:'🌲 fast through forest & mountain' };
// tại địa hình ter, binh chủng t khắc những loại nào (good) và ngại những loại nào (bad)
function bwMatch(t,ter){ const good=[], bad=[]; for(const b of BW_TYPES){ if(b===t) continue; const r=BW.counter(t,b,ter)/Math.max(0.01,BW.counter(b,t,ter)); if(r>=1.25) good.push(b); else if(r<=0.8) bad.push(b); } return {good,bad}; }
function bwTypeName(t,pl){ const n=UNIT[t]? UNIT[t].name : t; return pl? (/man$/.test(n)? n.replace(/man$/,'men') : n+'s') : n; }

// ---- gán văn minh cho các phe (cố định theo hạt giống bản đồ → lưu/nạp và P2P luôn khớp) ----
BigWar.prototype.assignCivs=function(){
  const cfg=this.cfg, R=mulberry32(((cfg.seed||0)*131+(this.mapSeed||7)*17+((typeof this.lv==='number'?this.lv:1)*7))|0), civs=this.civs={};
  const pool=BW_CIVS.slice(); for(let i=pool.length-1;i>0;i--){ const j=(R()*(i+1))|0; const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  const take=(id)=>{ const k=pool.findIndex(c=>c.id===id); return k>=0? pool.splice(k,1)[0] : null; };
  civs[0]=(cfg.civ&&take(cfg.civ))||pool.shift(); cfg.civ=civs[0].id;
  if(cfg.royale){ civs[1]=pool.shift(); for(let f=3;f<3+cfg.royale-1;f++) civs[f]=pool.length? pool.shift() : BW_CIVS[(f*7)%BW_CIVS.length]; }
  else { let e= cfg.p2p&&BW_CIV[cfg.civ2]? BW_CIV[cfg.civ2] : (cfg.civ2&&take(cfg.civ2)); /* P2P: hai người được chọn trùng nước */ if(!e){ const lv=typeof this.lv==='number'? this.lv : 1; e=take(BW_BOSS_CIVS[(lv-1)%BW_BOSS_CIVS.length])||pool.shift(); } civs[1]=e; cfg.civ2=e.id; }
  BW.civPal={}; for(const f in civs){ if(+f===0) continue; if(!cfg.royale&&+f===1) continue; BW.civPal[f]={color:civs[f].color,light:civs[f].light}; }
};
BigWar.prototype.civOf=function(fid){ return (this.civs&&this.civs[fid])||null; };
BigWar.prototype.natName=function(fid){ const cv=this.civOf(fid); return cv? cv.name : (fid===2? 'Neutral' : 'Nation '+fid); };
BigWar.prototype.natTag=function(fid){ const cv=this.civOf(fid); return cv? cv.icon+' '+cv.name.toUpperCase() : 'NATION '+fid; };
// hệ số sát thương theo văn minh: binh chủng sở trường + địa hình sở trường
BigWar.prototype.civAtk=function(owner,type,ter){ const cv=this.civOf(owner); if(!cv) return 1; return (type===cv.sig? cv.atk : 1)*(cv.ter&&cv.ter===ter? 1.15 : 1); };
// loại quân một phe sinh ra ở trại / đội quân thứ i lúc khai trận
BigWar.prototype.civType=function(fid,i){ const cv=this.civOf(fid); if(!cv) return BW_TYPES[(i||0)%BW_TYPES.length]; if(i==null) return cv.sig; return cv.roster[[0,1,0,2][i%4]]; };
// dự báo tương quan khi đạo quân kiểu `ta` của ta đánh kiểu `tb` tại địa hình ter: >1 có lợi
BigWar.prototype.matchup=function(ta,tb,ter){ return BW.counter(ta,tb,ter)/Math.max(0.01,BW.counter(tb,ta,ter)); };
