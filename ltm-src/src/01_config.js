'use strict';
// ============ LOẠN THẾ MEME — cấu hình dữ liệu (mọi số đều chỉnh được) ============
const VERSION = '0.1.0';

// Địa hình
const T = { GRASS:0, ROAD:1, FOREST:2, REEDS:3, HILL:4, MUD:5, WATER:6, ROCK:7, BRIDGE:8, RUIN:9, PLAZA:10, TENT:11, STATION:12, DRUM:13, TOWER:14 };
const T_NAME = ['Grassland','Dirt Road','Sparse Woods','Reed Bed','Low Hill','Mud','Deep River','Cliff','Narrow Bridge','Ruins','Drum Arena','Tent Camp','Supply Depot','War Drum of Chaos','Watchtower'];
const PASSABLE = [1,1,1,1,1,1,0,0,1,0,1,0,1,0,1];
const HIDE_T   = [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0];        // rừng, lau: ẩn quân
const BLOCK_SHOT=[0,0,1,0,0,0,0,1,0,1,0,1,0,0,0];        // chắn đường bắn xuyên qua
const SPEED_T  = [1,1.08,0.85,0.9,0.9,0.7,0,0,1,0,1.05,0,1,0,1];
const DRY_T    = [1,1,1,1,1,0,0,0,1,0,1,0,1,0,1];        // Kỵ sĩ lấy đà

const RULES = {
  visionBase: 4, hillVision: 1, hillRange: 1,
  // Mở sương (đơn vị: phần ô / giây). Tướng 10 s/ô, Trinh sát 2 s/ô, n lính thường = 100/n s
  // Mở sương: bước vào 1 ô sương mất 1 thể năng/thể lực, đi trên ô đã mở không mất gì
  fogStepCost: 1,
  generalStamMax: 100, generalRegenEvery: 10, soldierStamMax: 20, soldierRegenEvery: 10,
  stationRegenEvery: 5, stationRegenMedic: 3,
  generalRespawn: 30,
  ambushBonus: 0.6, ambushCd: 6, chargeBonus: 0.5, chargeCd: 6, chargeRun: 2, braceTime: 1,
  shieldReduce: 0.45, shieldBreak: 3,
  healAmount: 12, healEvery: 4, healRange: 2,
  drumHold: 45, holdMin: 3, timeLimit: 15*60,
  flagLossRatio: 0.5, flagGeneralDist: 6, surrenderRange: 3, surrenderChannel: 3, flagTimeout: 30,
  squadMax: 10, startExplored: 9, aggro: 5, leash: 8,
  openRadius: 1,   // bước vào 1 ô sương mở ô đó + 1 ô hai bên (lối rộng 3 cho đội đi); 0 = chỉ mở đúng 1 ô
  senseRadius: 5,
  alertRadius: 10,  // thấy địch trong 10 ô quanh tướng hoặc quanh lính -> lính gần đó tự tới đánh
  engageRadius: 12, // lính cách địch tối đa bấy nhiêu ô thì tham chiến
  scoutRestStam: 4, // trinh sát hết thể lực nghỉ tới mức này rồi dò tiếp
  scoutRestEvery: 5, // trinh sát đứng nghỉ ngoài giao tranh hồi 1 thể lực mỗi 5 giây (lính khác 10 giây)
  towerReveal: 9,    // chạm Vọng gác lần đầu: mở sương bán kính 9 ô cho phe mình
  towerVision: 2,    // đứng gác trên Vọng gác: +2 ô tầm nhìn (mục 6 GDD)
  smokeDur: 8, smokeR: 1,
  plankDur: 30, plankMaxSpan: 6,
  wardDur: 15,
  compassR: 30,
  bandageDelay: 3, bandageHeal: 0.25,
  stormDps: 0.02,          // mỗi giây mất 2% máu tối đa (tối thiểu 2) khi ở ngoài vùng an toàn
  campZone: 2, campCapTime: 10, factionSurrenderRatio: 0.5, surrenderTake: 10,
  pingEvery: 240,    // Hồi trống điểm danh: mỗi 4 phút lộ vị trí các tướng trên bản đồ nhỏ
  pingShow: 8,  // nghe thấy lính trung lập/vật phẩm trong sương (hiện dấu ❗ / ✨), địch vẫn ẩn
};

// 10 binh chủng (mục 5) + tướng
const UNIT = {
  general:  { name:'General',      hp:160, dmg:14, cd:1.00, range:1, speed:2.0, armor:0,    emoji:'👑' },
  scout:    { name:'Scout',  hp:50,  dmg:6,  cd:1.10, range:1, speed:3.2, armor:0,    emoji:'🔭' },
  assassin: { name:'Assassin',    hp:70,  dmg:13, cd:1.00, range:1, speed:2.7, armor:0,    emoji:'🗡️' },
  archer:   { name:'Archer',   hp:60,  dmg:9,  cd:1.00, range:4, speed:1.9, armor:0,    emoji:'🏹', proj:'arrow' },
  swordsman:{ name:'Swordsman',    hp:105, dmg:12, cd:0.90, range:1, speed:2.0, armor:0.15, emoji:'⚔️' },
  saber:    { name:'Blademaster',     hp:95,  dmg:15, cd:1.25, range:1, speed:1.8, armor:0,    emoji:'🪓' },
  cavalry:  { name:'Knight',      hp:115, dmg:15, cd:1.25, range:1, speed:3.4, armor:0.20, emoji:'🐎' },
  spear:    { name:'Spearman',hp:90,  dmg:12, cd:1.15, range:1, speed:1.8, armor:0,    emoji:'🔱' },
  shield:   { name:'Shieldbearer', hp:135, dmg:7,  cd:1.30, range:1, speed:1.6, armor:0,    emoji:'🛡️' },
  crossbow: { name:'Crossbowman',     hp:65,  dmg:22, cd:2.40, range:5, speed:1.7, armor:0,    emoji:'🎯', proj:'bolt' },
  medic:    { name:'Medic',       hp:65,  dmg:5,  cd:1.40, range:1, speed:1.8, armor:0,    emoji:'💊' },
};
// Vũ khí của tướng (Lò rèn) — mỗi bậc có hiệu ứng riêng
const WEAPONS = [
  { name:'Village Bamboo Sword',        emoji:'🎋', dmg:0,  cdMul:1.00, reach:1, cleave:0,   steal:0,    stun:0,   desc:'Starting Weapon' },
  { name:'Forged Iron Sword',         emoji:'🗡️', dmg:4,  cdMul:0.92, reach:1, cleave:0,   steal:0,    stun:0,   desc:'+4 damage, 8% faster attacks' },
  { name:'Long Spear',        emoji:'🔱', dmg:6,  cdMul:0.92, reach:2, cleave:0,   steal:0,    stun:0,   desc:'+6 damage, 2-tile reach' },
  { name:'Green Dragon Blade',       emoji:'🐉', dmg:10, cdMul:0.90, reach:2, cleave:0.5, steal:0,    stun:0,   desc:'+10, 50% cleave around you' },
  { name:'Sky Halberd',emoji:'⚜️', dmg:14, cdMul:0.88, reach:2, cleave:0.6, steal:0.25, stun:0,   desc:'+14, 60% cleave, 25% lifesteal' },
  { name:'Legendary Flip-Flops',emoji:'🩴', dmg:18, cdMul:0.85, reach:2, cleave:0.7, steal:0.3, stun:0.6, desc:'+18, cleave, lifesteal, 0.6s stun' },
];
// Nâng cấp tướng giữa các trận (mục mở rộng theo yêu cầu chủ dự án)
const UPGRADES = [
  { key:'speed',   name:'Speed',        emoji:'👟', max:5, base:30, desc:(l)=>`Move speed +${l*6}%` },
  { key:'power',   name:'Power',      emoji:'💪', max:5, base:40, desc:(l)=>`Damage +${l*12}%` },
  { key:'armor',   name:'Armor',      emoji:'🛡️', max:5, base:40, desc:(l)=>`HP +${l*12}%, damage taken -${l*4}%` },
  { key:'stamina', name:'Stamina',      emoji:'🔋', max:5, base:30, desc:(l)=>`Max stamina ${100+l*10}, recovers ${l*8}% faster` },
  { key:'aura',    name:'Command Aura', emoji:'📯', max:5, base:50, desc:(l)=>`Soldiers within 3 tiles of the general +${l*5}% damage` },
  { key:'weapon',  name:'Weapon',        emoji:'⚔️', max:5, base:60, desc:(l)=>WEAPONS[l].name+' — '+WEAPONS[l].desc },
];
function upgradeCost(u,l){ return Math.round(u.base*Math.pow(l+1,1.7)); }
const SOLDIER_TYPES = ['scout','assassin','archer','swordsman','saber','cavalry','spear','shield','crossbow','medic'];

const ITEM = {
  bun:      { name:'Revive Bun',  short:'Steamed Bun', emoji:'🥟', desc:'+20 stamina for the general' },
  tea:      { name:'Ginger Revive Tea', short:'Ginger Tea', emoji:'🍵', desc:'+5 stamina per squad soldier' },
  bandage:  { name:'Armor Patch Kit',      short:'Patch Kit',  emoji:'🩹', desc:'Stand still 3s to heal 25% HP' },
  compass:  { name:'Troop-Finder Compass',   short:'Compass',   emoji:'🧭', desc:'Points to the nearest neutral troops within 30 tiles' },
  smoke:    { name:'Smoke Pouch',          short:'Smoke Pouch', emoji:'💨', desc:'3×3 smoke for 8s, blocks all shots' },
  plank:    { name:'Bridge Plank',       short:'Plank',  emoji:'🪵', desc:'Bridge a river for 30s (stand next to the river)' },
  scarecrow:{ name:'Carry-the-Team Scarecrow', short:'Scarecrow',  emoji:'👒', desc:'Place a scarecrow sentry that sees like a soldier for 15s' },
};

// Phe — màu kèm biểu tượng cờ riêng (mục 4)
const FACTIONS = [
  { name:'Iced Tea Team',   short:'Lam',  color:'#3b82f6', dark:'#1e3a8a', light:'#93c5fd', emblem:'drop',   general:'General Iced Tea' },
  { name:'Roast Society',  short:'Red',   color:'#ef4444', dark:'#7f1d1d', light:'#fca5a5', emblem:'flame',  general:'General Roast' },
  { name:'Pennywort Crew',  short:'Green',  color:'#22c55e', dark:'#14532d', light:'#86efac', emblem:'leaf',   general:'General Pennywort' },
  { name:'Banh Mi Gang', short:'Gold', color:'#f59e0b', dark:'#78350f', light:'#fde68a', emblem:'star',   general:'General Banh Mi' },
  { name:'Nem Chua Sect',short:'Pink', color:'#ec4899', dark:'#831843', light:'#f9a8d4', emblem:'heart',  general:'General Nem Chua' },
  { name:'Pho School',   short:'Purple',  color:'#8b5cf6', dark:'#4c1d95', light:'#c4b5fd', emblem:'moon',   general:'General Pho' },
  { name:'Che Khuc Party',short:'Jade', color:'#14b8a6', dark:'#134e4a', light:'#99f6e4', emblem:'wave',   general:'General Che' },
  { name:'Bun Dau Squad', short:'Cam',  color:'#f97316', dark:'#7c2d12', light:'#fdba74', emblem:'sun',    general:'General Bun Dau' },
  { name:'Sticky Rice Guild',short:'Brown',  color:'#a16207', dark:'#422006', light:'#fcd34d', emblem:'square', general:'General Sticky Rice' },
  { name:'Broken Rice House',   short:'Gray',  color:'#64748b', dark:'#1e293b', light:'#cbd5e1', emblem:'tri',    general:'General Broken Rice' },
  { name:'Banh Cuon Clan',short:'Chanh',color:'#84cc16', dark:'#365314', light:'#d9f99d', emblem:'diamond',general:'General Banh Cuon' },
  { name:'Spring Roll Tribe', short:'Sky', color:'#0ea5e9', dark:'#0c4a6e', light:'#7dd3fc', emblem:'cross',  general:'General Spring Roll' },
];
const NEUTRAL = 99;

// Chiến dịch 1–100 (mục 2). Dữ liệu từng màn sinh từ công thức, chỉnh được.
function levelConfig(L){
  const size = 200 + 2*(L-1);
  const factions = L<=20 ? 4 : (L<=60 ? 8 : 12);
  const cap = L<=20 ? 40 : L<=40 ? 60 : L<=60 ? 80 : 100;
  const flags = factions===4 ? 0 : factions===8 ? 2 : 3;
  const plaza = factions===4 ? 3 : factions===8 ? 7 : 9;
  const types = L<=1 ? ['scout','archer','spear','cavalry','shield','saber']
              : L<=5 ? ['scout','archer','spear','cavalry','shield','saber','swordsman']
              : L<=10 ? ['scout','archer','spear','cavalry','shield','saber','swordsman','medic','crossbow']
              : SOLDIER_TYPES.slice();
  return { level:L, size, factions, cap, flags, plaza, types,
    neutralRatio: 1.06, timeLimit: RULES.timeLimit, aiSkill: Math.min(1, 0.35 + L*0.0065),
    drumHold: RULES.drumHold,
    storm: { start: 600, end: 840 },   // bão sương: phút 10 bắt đầu co về Trống, phút 14 co hết
    seed: 1000 + L*7919 };
}
// Trận Chớp Nhoáng: 30×30, 2 phe, một chạm điều tướng, quân bám sát tướng
function miniConfig(seed){
  return { level:'mini', mini:true, size:30, factions:2, cap:12, flags:0, plaza:3,
    types:['archer','spear','cavalry','shield','saber','swordsman'],
    neutralRatio:1, timeLimit: 300, drumHold: 30, aiSkill: 0.55, storm:null,
    seed: seed!=null? seed : (Date.now()%1000000) };
}

// Danh mục art để thay bằng ảnh của ChatGPT (xem ART_BRIEF.md). Thiếu file thì game tự vẽ bằng code.
const ART_MANIFEST = {
  base: 'art/',
  units: Object.fromEntries(['general',...SOLDIER_TYPES].map(k=>[k, `units/${k}.png`])),
  items: { bun:'items/bun.png', tea:'items/tea.png' },
  drum: 'props/drum.png', tent:'props/tent.png', station:'props/station.png', tree:'props/tree.png',
  logo: 'ui/logo.png',
};
