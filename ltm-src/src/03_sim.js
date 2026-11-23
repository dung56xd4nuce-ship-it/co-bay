// ============ Mô phỏng ============
const DT = 0.05;
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const INF = 0x3fffffff;

class Heap { // min-heap (key,node)
  constructor(cap){ this.k=new Int32Array(cap); this.v=new Int32Array(cap); this.n=0; }
  push(key,val){ let i=this.n++; if(i>=this.k.length){ const k2=new Int32Array(this.k.length*2), v2=new Int32Array(this.k.length*2); k2.set(this.k); v2.set(this.v); this.k=k2; this.v=v2; }
    const k=this.k, v=this.v; while(i>0){ const p=(i-1)>>1; if(k[p]<=key) break; k[i]=k[p]; v[i]=v[p]; i=p; } k[i]=key; v[i]=val; }
  pop(){ const k=this.k, v=this.v; const rv=v[0]; this.popKey=k[0]; const n=--this.n; if(n>0){ const key=k[n], val=v[n]; let i=0; for(;;){ let c=2*i+1; if(c>=n) break; if(c+1<n&&k[c+1]<k[c]) c++; if(k[c]>=key) break; k[i]=k[c]; v[i]=v[c]; i=c; } k[i]=key; v[i]=val; } return rv; }
}

function aiUpgrades(L,fid){ if(typeof L!=='number'||!isFinite(L)) L=1; const t=Math.min(5,Math.floor((L-1)/4)); return {speed:t,power:t,armor:t,stamina:t,aura:Math.min(5,Math.floor((L-1)/6)),weapon:Math.min(5,Math.floor((L-1)/4))}; }
class World {
  constructor(cfg, playerFaction=0, opts={}){
    this.cfg=cfg; this.map= cfg.mini? generateMiniMap(cfg) : generateMap(cfg); const m=this.map;
    this.W=m.W; this.H=m.H; this.N=m.N; this.t=m.t;
    this.time=0; this.tick=0; this.units=[]; this.orders=[]; this.fx=[]; this.events=[]; this.projs=[];
    this.occ=new Int32Array(this.N); this.itemAt=new Int16Array(this.N);
    this.items=[]; this.digJobs=new Map(); this.squads=[]; this.over=false; this.result=null;
    this.player=playerFaction; this.rnd=mulberry32(cfg.seed^0xabc);
    this.cellS=8; this.gw=Math.ceil(this.W/8); this.grid=Array.from({length:this.gw*Math.ceil(this.H/8)},()=>[]);
    this.heap=new Heap(1<<15); this.nextPing=RULES.pingEvery; this.pingUntil=0;
    this.flags=(m.flags||[]).map(f=>({x:f.x,y:f.y,holder:-1}));
    this.smokeAt=new Map(); this.smokes=[]; this.wards=[]; this.planks=[]; this.plankOrig=new Map();
    this.stormOn=false; this.stormR=1e9; this.stormWarned=false;
    this.stationMask=new Uint8Array(this.N); for(let i=0;i<this.N;i++) if(this.t[i]===T.STATION) this.stationMask[i]=1;
    const d=m.drum; this.drum={ x:d.x, y:d.y, h:d.h, holder:-1, contested:false, pulse:0 };
    this.factions=[];
    for(let f=0;f<cfg.factions;f++){
      const fac={ id:f, def:FACTIONS[f], ai: f!==playerFaction || !!opts.allAI, explored:new Uint8Array(this.N), vis:new Uint32Array(this.N), visStamp:1,
        units:[], count:0, peak:0, cap:cfg.cap, general:null, follow:{field:null, ox:-99, oy:-99, t:-99, arriveR:2, dirty:true}, openSquad:null,
        holdTotal:0, holdStreak:0, memNeutral:new Map(), memItems:new Set(), sense:new Uint32Array(this.N), stats:{recruited:0, lost:0, kills:0, opened:0, converted:0}, camp:m.camps[f], aiState:{} , alive:true };
      for(const i of m.known[f]) fac.explored[i]=1;
      this.factions.push(fac);
    }
    for(const it of m.items){ this.items.push({x:it.x,y:it.y,kind:it.kind,taken:false}); this.itemAt[it.y*this.W+it.x]=this.items.length; }
    for(const n of m.neutrals) this.spawn(NEUTRAL, n.type, n.x, n.y);
    for(const fac of this.factions){ const c=fac.camp; const g=this.spawn(fac.id,'general',c.x,c.y); fac.general=g; g.items=[];
      const up = fac.id===playerFaction && !opts.allAI ? (opts.genUp||{}) : aiUpgrades(cfg.level, fac.id);
      this.applyUpgrades(g, up); }
    for(const fac of this.factions){ this.computeVis(fac); for(const u of this.units) if(u.f===NEUTRAL && fac.explored[u.y*this.W+u.x]) fac.memNeutral.set(u.y*this.W+u.x,u.type); }
  }
  applyUpgrades(g,up){
    up=Object.assign({speed:0,power:0,armor:0,stamina:0,aura:0,weapon:0},up); g.up=up;
    g.spdMul=1+0.06*up.speed; g.dmgMul=1+0.12*up.power; g.armorBonus=0.04*up.armor;
    g.maxhp=Math.round(UNIT.general.hp*(1+0.12*up.armor)); g.hp=g.maxhp; g.maxstam=RULES.generalStamMax+10*up.stamina; g.stam=g.maxstam;
    g.weapon=WEAPONS[Math.min(WEAPONS.length-1,up.weapon)];
  }
  idx(x,y){ return y*this.W+x; }
  inb(x,y){ return x>=0&&y>=0&&x<this.W&&y<this.H; }
  spawn(f,type,x,y){
    const S=UNIT[type]; const id=this.units.length;
    const u={ id, f, type, x, y, nx:x, ny:y, px:x, py:y, moving:false, prog:0, hp:S.hp, maxhp:S.hp,
      stam: type==='general'? RULES.generalStamMax : RULES.soldierStamMax, maxstam: type==='general'? RULES.generalStamMax : RULES.soldierStamMax,
      cd: Math.random()*0.5, dirx: 0, diry: 1, mode:'follow', order:null, holdX:x, holdY:y, target:-1, tkind:0, nextScan:0, stillSince:(this?this.time:0)||0,
      runDx:0, runDy:0, runLen:0, lastMoveT:-9, chargeAt:0, ambushAt:0, shieldBrokenUntil:0, revealUntil:0, stunUntil:0,
      squad:null, digTile:-1, stuck:0, flash:0, dead:false, regenT:0, healT:0, lastAtk:-9, atkAnim:0, bubble:null, bubbleT:0, channel:null, items:null, respawnAt:0, spawnT:this.time||0, born:0 };
    if(f===NEUTRAL){ u.mode='idle'; }
    this.units.push(u); this.occ[y*this.W+x]=id+1;
    if(f!==NEUTRAL){ const fac=this.factions[f]; fac.units.push(u); if(type!=='general'){ fac.count++; fac.peak=Math.max(fac.peak,fac.count); } }
    return u;
  }
  emit(type,data){ if(this.fx.length<600) this.fx.push(Object.assign({type, t:this.time}, data)); }
  event(f, text, kind, x, y){ this.events.push({f,text,kind,x,y,t:this.time}); }

  // ---------- Tầm nhìn & sương ----------
  computeVis(fac){
    const s=++fac.visStamp, vis=fac.vis, ex=fac.explored, W=this.W, H=this.H, t=this.t;
    for(const u of fac.units){ if(u.dead) continue;
      const cx=u.moving? u.nx:u.x, cy=u.moving? u.ny:u.y;
      const tv=t[cy*W+cx]; const r = RULES.visionBase + (tv===T.HILL? RULES.hillVision:0) + (tv===T.TOWER? RULES.towerVision:0);
      const r2=r*r+r*0.6;
      for(let dy=-r;dy<=r;dy++){ const y=cy+dy; if(y<0||y>=H) continue; for(let dx=-r;dx<=r;dx++){ if(dx*dx+dy*dy>r2) continue; const x=cx+dx; if(x<0||x>=W) continue; const i=y*W+x; if(ex[i]) vis[i]=s; } }
    }
    if(this.wards.length) for(const wd of this.wards){ if(wd.f!==fac.id||this.time>=wd.until) continue; const r=RULES.visionBase; const r2=r*r+r*0.6;
      for(let dy=-r;dy<=r;dy++){ const y=wd.y+dy; if(y<0||y>=H) continue; for(let dx=-r;dx<=r;dx++){ if(dx*dx+dy*dy>r2) continue; const x=wd.x+dx; if(x<0||x>=W) continue; const i=y*W+x; if(ex[i]) vis[i]=s; } } }
    // nghe thấy lính trung lập & vật phẩm gần (kể cả trong sương)
    const SR=RULES.senseRadius, sense=fac.sense;
    for(const u of fac.units){ if(u.dead) continue; const cx=u.moving?u.nx:u.x, cy=u.moving?u.ny:u.y;
      for(let dy=-SR;dy<=SR;dy++){ const y=cy+dy; if(y<0||y>=H) continue; const w=SR-Math.abs(dy)+1; for(let dx=-w;dx<=w;dx++){ const x=cx+dx; if(x<0||x>=W) continue; sense[y*W+x]=s; } } }
    for(const [i] of fac.memNeutral){ if(vis[i]===s||sense[i]===s){ const o=this.occ[i]; const n=o?this.units[o-1]:null; if(!n||n.f!==NEUTRAL||n.dead) fac.memNeutral.delete(i); } }
    for(const n of this.units){ if(n.f!==NEUTRAL||n.dead) continue; const i=n.y*W+n.x; if(vis[i]===s||sense[i]===s) fac.memNeutral.set(i,n.type); }
    for(const it of this.items){ if(it.taken) continue; const i=it.y*W+it.x; if(vis[i]===s||sense[i]===s) fac.memItems.add(i); }
    for(const i of fac.memItems){ if((vis[i]===s||sense[i]===s) && !this.itemAt[i]) fac.memItems.delete(i); }
  }
  isVisTile(f,i){ const fac=this.factions[f]; return fac.vis[i]===fac.visStamp; }
  hiddenFrom(e,f){
    const i=e.y*this.W+e.x; if(!HIDE_T[this.t[i]] || this.time<e.revealUntil) return false;
    // lộ khi địch vào sát 1 ô, Trinh sát trong 2 ô
    let seen=false;
    this.queryRect(e.x-2,e.y-2,e.x+2,e.y+2,(o)=>{ if(seen||o.f!==f||o.dead) return; const d=Math.abs(o.x-e.x)+Math.abs(o.y-e.y); if(d<=1 || (o.type==='scout'&&d<=2)) seen=true; });
    return !seen;
  }
  canSee(f,e){ if(e.dead) return false; if(e.f===f) return true; const i=e.y*this.W+e.x; if(!this.isVisTile(f,i)) return false; if(e.f===NEUTRAL) return true; return !this.hiddenFrom(e,f); }

  // ---------- Lưới không gian ----------
  rebuildGrid(){ for(const c of this.grid) c.length=0; const S=this.cellS, gw=this.gw;
    for(const u of this.units){ if(u.dead) continue; this.grid[((u.y/S)|0)*gw+((u.x/S)|0)].push(u); } }
  queryRect(x0,y0,x1,y1,fn){ const S=this.cellS, gw=this.gw, gh=this.grid.length/gw;
    const a=Math.max(0,(x0/S)|0), b=Math.min(gw-1,(x1/S)|0), c=Math.max(0,(y0/S)|0), d=Math.min(gh-1,(y1/S)|0);
    for(let gy=c;gy<=d;gy++) for(let gx=a;gx<=b;gx++){ const L=this.grid[gy*gw+gx]; for(let k=0;k<L.length;k++){ const u=L[k]; if(u.x>=x0&&u.x<=x1&&u.y>=y0&&u.y<=y1) fn(u); } } }
  unitAt(x,y){ if(!this.inb(x,y)) return null; const o=this.occ[y*this.W+x]; return o? this.units[o-1]:null; }

  // ---------- Trường dòng chảy (tìm đường theo hiểu biết của phe) ----------
  passFor(f,i){ return !this.factions[f].explored[i] || PASSABLE[this.t[i]]; }
  computeField(f, tx, ty, field){
    const W=this.W,H=this.H,N=this.N,t=this.t, ex=this.factions[f].explored;
    if(!field) field=new Int32Array(N); field.fill(INF);
    // đích không đi được -> tìm ô gần nhất đi được
    if(ex[ty*W+tx] && !PASSABLE[t[ty*W+tx]]){ let found=false; for(let r=1;r<8&&!found;r++) for(let dy=-r;dy<=r&&!found;dy++) for(let dx=-r;dx<=r&&!found;dx++){ const x=tx+dx,y=ty+dy; if(this.inb(x,y)&&this.passFor(f,y*W+x)){ tx=x;ty=y;found=true; } } }
    const h=this.heap; h.n=0; const s=ty*W+tx; field[s]=0; h.push(0,s);
    while(h.n){ const i=h.pop(), k=h.popKey; if(k>field[i]) continue; const x=i%W, y=(i/W)|0;
      for(let d=0;d<4;d++){ const nx=x+DIRS[d][0], ny=y+DIRS[d][1]; if(nx<0||ny<0||nx>=W||ny>=H) continue; const j=ny*W+nx;
        let c; if(!ex[j]) c=30; else { const tt=t[j]; if(!PASSABLE[tt]) continue; c=Math.round(10/SPEED_T[tt]); }
        const nk=k+c; if(nk<field[j]){ field[j]=nk; h.push(nk,j); } } }
    return field;
  }
  newOrder(f, x, y, n){ const o={ id:this.orders.length+1, f, x, y, field:null, dirty:true, count:n, arriveR: Math.max(0,Math.floor(Math.sqrt(n)*0.95)), t:this.time }; this.orders.push(o); return o; }
  setMode(u, mode, order){
    if(u.order){ u.order.count--; }
    u.mode=mode; u.order=order||null; if(order) order.count++; u.stuck=0; u.digTile=-1; u.target=-1;
    if(mode==='hold'){ u.holdX=u.moving?u.nx:u.x; u.holdY=u.moving?u.ny:u.y; }
    if(mode==='explore') u.exNeed=true;
  }

  // ---------- Lệnh của người chơi / AI ----------
  cmdMove(units, x, y){
    units=units.filter(u=>!u.dead && u.f!==NEUTRAL && !(u.squad&&u.squad.flag));
    if(!units.length) return null; x=Math.max(0,Math.min(this.W-1,x)); y=Math.max(0,Math.min(this.H-1,y));
    const o=this.newOrder(units[0].f,x,y,0);
    for(const u of units){ this.setMode(u,'move',o); u.channel=null; }
    o.arriveR=Math.max(0,Math.floor(Math.sqrt(units.length)*0.95));
    o.field=this.computeField(o.f,x,y,null); o.dirty=false;
    return o;
  }
  cmdHold(units){ for(const u of units){ if(u.dead||u.type==='general') continue; this.setMode(u,'hold'); } }
  cmdExplore(units){ for(const u of units){ if(u.dead||u.type==='general') continue; this.setMode(u,'explore'); } }
  cmdFollow(units){ for(const u of units){ if(u.dead||u.type==='general') continue; this.setMode(u,'follow'); } if(units.length && units[0].f!==NEUTRAL) this.factions[units[0].f].follow.dirty=true; }

  // ---------- Vòng mô phỏng ----------
  step(){
    if(this.over) return;
    const dt=DT; this.time+=dt; this.tick++;
    this.rebuildGrid();
    for(const fac of this.factions){ if((this.tick+fac.id)%4===0) this.computeVis(fac); }
    // trường
    let budget=3;
    for(const o of this.orders){ if(o.count>0 && (o.dirty||!o.field) && budget>0){ o.field=this.computeField(o.f,o.x,o.y,o.field); o.dirty=false; budget--; } }
    if(this.orders.length>64) this.orders=this.orders.filter(o=>o.count>0);
    for(const fac of this.factions){ const g=fac.general, fo=fac.follow; if(!g||g.dead) continue;
      const gx=g.moving?g.nx:g.x, gy=g.moving?g.ny:g.y;
      if(fo.dirty || (Math.abs(gx-fo.ox)+Math.abs(gy-fo.oy)>=2 && this.time-fo.t>0.6) || this.time-fo.t>4){
        let n=0; for(const u of fac.units) if(!u.dead&&u.mode==='follow') n++;
        if(n>0||fo.dirty){ fo.field=this.computeField(fac.id,gx,gy,fo.field); fo.ox=gx; fo.oy=gy; fo.t=this.time; fo.dirty=false; fo.arriveR=Math.max(1,Math.ceil(Math.sqrt(n+1)*0.9)); }
      } }
    // AI
    if(typeof aiThink==='function') for(const fac of this.factions){ if(fac.ai && (this.tick+fac.id*5)%20===0) aiThink(this,fac); }
    // hồi phục
    for(const fac of this.factions){ const g=fac.general; if(g&&!g.dead){ g.regenT+=dt; const ev=RULES.generalRegenEvery/(1+0.08*(g.up?g.up.stamina:0)); if(g.regenT>=ev){ g.regenT-=ev; g.stam=Math.min(g.maxstam,g.stam+1); } } }
    // đơn vị
    const U=this.units, n=U.length, off=(this.tick*7919)%Math.max(1,n);
    for(let k=0;k<n;k++){ const u=U[(k+off)%n]; if(!u.dead && u.f!==NEUTRAL) this.updateUnit(u,dt); }
        this.updateProjs();
    if(this.tick%10===0) this.updateSquads();
    for(const fac of this.factions){ if((this.tick+fac.id*3)%10===0){ this.updateThreats(fac); this.autoScouts(fac); } }
    this.updateChannels(dt);
    this.updateDrum(dt);
    this.updateCamps(dt);
    this.updateWorldFx(dt);
    for(const fac of this.factions){ const g=fac.general; if(g.dead && this.time>=g.respawnAt) this.respawnGeneral(fac); }
    if(!this.over && this.time>=this.nextPing && this.time<this.cfg.timeLimit-20){ this.nextPing+=RULES.pingEvery; this.pingUntil=this.time+RULES.pingShow;
      this.emit('ping',{}); this.event(this.player,'📯 Hồi trống điểm danh — vị trí các tướng hiện trên bản đồ nhỏ!','info'); }
    { const fp=this.factions[this.player]; const TH=[100,250,500,1000,2000,4000]; fp.mile=fp.mile||0;
      if(fp.mile<TH.length && fp.stats.opened>=TH[fp.mile]){ this.event(this.player,`🌫️ Đã mở ${TH[fp.mile]} ô — thêm Xu Meme sau trận!`,'good'); fp.mile++; } }
    if(this.time>=this.cfg.timeLimit) this.finishByTime();
  }

  // ---------- Một đơn vị ----------
  updateUnit(u,dt){
    const W=this.W, t=this.t;
    u.cd-=dt; if(u.flash>0) u.flash-=dt; if(u.atkAnim>0) u.atkAnim-=dt;
    if(u.moving){
      const ti=u.ny*W+u.nx; const sp=UNIT[u.type].speed*(u.spdMul||1)*SPEED_T[t[ti]];
      u.prog+=sp*dt;
      if(u.prog>=0.5 && u.freeOld){ const oi=u.y*W+u.x; if(this.occ[oi]===u.id+1) this.occ[oi]=0; u.freeOld=false; }
      if(u.prog>=1){ this.arriveTile(u); }
      else { u.px=u.x+(u.nx-u.x)*u.prog; u.py=u.y+(u.ny-u.y)*u.prog; return; }
    }
    u.px=u.x; u.py=u.y;
    if(u.bandage){ const b=u.bandage;
      if(u.x!==b.x||u.y!==b.y||u.hp<b.hp0){ u.bandage=null; if(u.f===this.player) this.event(u.f,'🩹 Băng Vá Giáp bị gián đoạn','bad'); }
      else if(this.time>=b.until){ u.bandage=null; const heal=Math.round(u.maxhp*RULES.bandageHeal); u.hp=Math.min(u.maxhp,u.hp+heal); this.emit('heal',{x:u.x,y:u.y,sx:u.x,sy:u.y,v:heal}); } }
    if(this.time<u.stunUntil) return;
    // tự hồi thể lực ở lương trạm
    if(u.type!=='general'){ const i=u.y*W+u.x;
      if(this.stationMask[i] && !(u.squad && this.time<u.squad.combatUntil) && u.stam<u.maxstam){
        let every=RULES.stationRegenEvery; this.queryRect(u.x-2,u.y-2,u.x+2,u.y+2,(o)=>{ if(o.f===u.f&&o.type==='medic'&&!o.dead&&this.stationMask[o.y*W+o.x]) every=RULES.stationRegenMedic; });
        u.regenT+=dt; if(u.regenT>=every){ u.regenT-=every; u.stam=Math.min(u.maxstam,u.stam+1); this.emit('stam',{x:u.x,y:u.y,f:u.f}); }
      } else if(u.stam<u.maxstam){ const ev2=(u.type==='scout'&&!u.moving&&this.time-u.lastMoveT>2&&this.time-u.lastAtk>4)?RULES.scoutRestEvery:RULES.soldierRegenEvery; u.regenT+=dt; if(u.regenT>=ev2){ u.regenT-=ev2; u.stam=Math.min(u.maxstam,u.stam+1); } } else u.regenT=0; }
    // chiêu mộ khi kề lính trung lập
    this.tryRecruit(u);
    if(u.squad && u.squad.flag) return;            // giương cờ trắng: đứng yên
    if(u.channel) return;                           // tướng đang chiêu hàng
    // y sư
    if(u.type==='medic'){ u.healT+=dt; if(u.healT>=RULES.healEvery){ let best=null, bv=1; this.queryRect(u.x-2,u.y-2,u.x+2,u.y+2,(o)=>{ if(o.f===u.f&&!o.dead&&o.hp<o.maxhp&&Math.abs(o.x-u.x)+Math.abs(o.y-u.y)<=RULES.healRange){ const r=o.hp/o.maxhp; if(r<bv){bv=r;best=o;} } });
      if(best){ u.healT=0; best.hp=Math.min(best.maxhp,best.hp+RULES.healAmount); this.emit('heal',{x:best.x,y:best.y,sx:u.x,sy:u.y,v:RULES.healAmount}); } else u.healT=RULES.healEvery; } }
    // tìm mục tiêu
    if(this.time>=u.nextScan){ u.nextScan=this.time+0.3+((u.id*37)%10)*0.01; this.acquire(u); }
    if(u.target>=0){
      const e=this.units[u.target];
      const valid = e && !e.dead && (u.tkind===1 ? (e.f===NEUTRAL) : (e.f!==u.f && e.f!==NEUTRAL && !(e.squad&&e.squad.flag) && this.canSee(u.f,e)));
      if(!valid){ u.target=-1; }
      else if(u.tkind===1){ // đi chiêu mộ
        if(Math.abs(e.x-u.x)+Math.abs(e.y-u.y)<=1){ u.target=-1; }
        else if(this.greedyStep(u,e.x,e.y)) return; else u.target=-1;
      } else {
        if(this.inRange(u,e)){ u.dirx=Math.sign(e.x-u.x)||u.dirx*0; u.diry=Math.sign(e.y-u.y); if(!u.dirx&&!u.diry) u.diry=1; if(Math.abs(e.x-u.x)>=Math.abs(e.y-u.y)){u.dirx=Math.sign(e.x-u.x);u.diry=0;} else {u.diry=Math.sign(e.y-u.y);u.dirx=0;}
          if(u.cd<=0) this.attack(u,e); if(u.stillSince<0) u.stillSince=this.time; return; }
        // đuổi theo trong phạm vi
        if(this.chaseAllowed(u,e)){ if(this.engageStep(u,e)) return; }
        else u.target=-1;
      }
    }
    // di chuyển theo lệnh
    if(u.mode==='move' || u.mode==='follow' || u.mode==='explore') this.flowStep(u,dt);
    else if(u.mode==='hold' && (u.x!==u.holdX||u.y!==u.holdY) && u.target<0){ if(!this.greedyStep(u,u.holdX,u.holdY)){ u.stuck+=dt; if(u.stuck>3){ u.holdX=u.x; u.holdY=u.y; } } }
  }
  arriveTile(u){
    const W=this.W; const dx=u.nx-u.x, dy=u.ny-u.y;
    if(u.freeOld){ const oi=u.y*W+u.x; if(this.occ[oi]===u.id+1) this.occ[oi]=0; u.freeOld=false; }
    u.x=u.nx; u.y=u.ny; u.px=u.x; u.py=u.y; u.moving=false; u.prog=0; u.stillSince=this.time; u.lastMoveT=this.time; if(u.type==='cavalry') u.nextScan=0;
    const ti=u.y*W+u.x;
    if(dx===u.runDx && dy===u.runDy && DRY_T[this.t[ti]]) u.runLen++; else u.runLen = DRY_T[this.t[ti]]?1:0;
    u.runDx=dx; u.runDy=dy;
    // nhặt vật phẩm
    const it=this.itemAt[ti]; if(it){ const item=this.items[it-1]; if(!item.taken) this.tryPickup(u,item,ti); }
    if(this.t[ti]===T.TOWER && u.f!==NEUTRAL) this.towerTouch(u);
  }
  tryPickup(u,item,ti){
    if(u.type==='general'){ if(u.items.length<2){ u.items.push(item.kind); } else return; }
    else { if(!u.squad || u.squad.item) return; u.squad.item=item.kind; }
    item.taken=true; this.itemAt[ti]=0; this.emit('pickup',{x:u.x,y:u.y,kind:item.kind,f:u.f});
    if(u.f===this.player) this.event(u.f, `Nhặt được ${ITEM[item.kind].emoji} ${ITEM[item.kind].short}`, 'item', u.x,u.y);
  }
  startMove(u,j){
    const W=this.W; const nx=j%W, ny=(j/W)|0;
    this.occ[j]=u.id+1; u.nx=nx; u.ny=ny; u.moving=true; u.prog=0; u.freeOld=true; u.stuck=0; u.stillSince=-1;
    u.dirx=nx-u.x; u.diry=ny-u.y; u.digTile=-1;
  }
  freeTile(j,u){ const o=this.occ[j]; return o===0; }
  greedyStep(u,tx,ty){
    const W=this.W, ex=this.factions[u.f].explored; let best=-1, bd=Math.abs(tx-u.x)+Math.abs(ty-u.y);
    for(let d=0;d<4;d++){ const nx=u.x+DIRS[d][0], ny=u.y+DIRS[d][1]; if(!this.inb(nx,ny)) continue; const j=ny*W+nx;
      if(!ex[j] || !PASSABLE[this.t[j]] || this.occ[j]) continue; const dd=Math.abs(tx-nx)+Math.abs(ty-ny); if(dd<bd){ bd=dd; best=j; } }
    if(best>=0){ this.startMove(u,best); return true; } return false;
  }
  flowStep(u,dt){
    const fac=this.factions[u.f]; const W=this.W;
    let field, arriveR;
    if(u.mode==='follow'){ const g=fac.general; if(!g||g.dead||u===g){ return; } field=fac.follow.field; arriveR=fac.follow.arriveR; }
    else { field=u.order&&u.order.field; arriveR=u.order?u.order.arriveR:0; }
    if(!field) return;
    const i=u.y*W+u.x, d0=field[i];
    const atGoal = d0<=arriveR*10;
    if(atGoal && u.mode==='follow'){ this.assistDig(u); u.stuck=0; return; }
    let best=-1, bv=d0, side=-1, swapB=null, swapV=d0;
    for(let d=0;d<4;d++){ const nx=u.x+DIRS[d][0], ny=u.y+DIRS[d][1]; if(!this.inb(nx,ny)) continue; const j=ny*W+nx; const v=field[j];
      if(v>=INF) continue; if(!this.passFor(u.f,j)) continue;
      if(!fac.explored[j]){ if(atGoal) continue; }
      else if(this.occ[j]){ const b=this.units[this.occ[j]-1]; if(v<swapV && this.canSwap(u,b)){ swapV=v; swapB=b; } continue; }
      if(v<bv){ bv=v; best=j; } else if(v===d0 && side<0 && fac.explored[j]) side=j; }
    if(best<0 && swapB && !atGoal){ this.swapUnits(u,swapB); return; }
    if(best<0 && !atGoal && u.stuck>1.2 && side>=0) best=side;
    if(best<0){
      if(atGoal){ if(u.mode==='move') this.arrive(u); else if(u.mode==='explore') u.exNeed=true; else this.assistDig(u); u.stuck=0; return; }
      u.stuck+=dt;
      const helping=this.assistDig(u);
      if(u.mode==='explore' && u.stuck>3){ u.exNeed=true; u.stuck=0; }
      if(!helping && u.mode==='move' && ((u.stuck>2.5 && d0<=(arriveR+3)*10) || u.stuck>8)) this.arrive(u);
      return;
    }
    if(!fac.explored[best]){ this.stepIntoFog(u,best,dt); return; }
    this.startMove(u,best);
  }
  // Bước vào ô sương: mất 1 thể năng/thể lực, mở ô ngay
  stepIntoFog(u,j,dt){
    const fac=this.factions[u.f], cost=RULES.fogStepCost;
    if(u.stam<cost){ u.stuck+=dt; u.digTile=j;
      if(this.time-(u.bubbleT||0)>4 && u.f===this.player){ u.bubble= u.type==='scout'?'Tìm được đường rồi, ai ra đón với!':(u.type==='general'?'Hết thể năng, nghỉ chút đã...':'Hết sức rồi...'); u.bubbleT=this.time; }
      if(u.mode==='move' && u.stuck>3) this.arrive(u);
      if(u.mode==='explore') u.exNeed=true;
      return; }
    u.stam-=cost; u.digTile=-1; this.reveal(fac,j,(j%this.W)-u.x,((j/this.W)|0)-u.y);
    if(PASSABLE[this.t[j]] && !this.occ[j]) this.startMove(u,j);
  }
  canSwap(u,b){
    if(b.f!==u.f||b.moving||b.dead||b.target>=0||b.channel||(b.squad&&b.squad.flag)) return false;
    if(b.type==='general' && (u.type==='general'||b.mode!=='hold'||u.mode!=='move')) return false;
    if(this.time<(b.swapT||0)) return false;
    if(u.type==='general') return true;
    if(u.mode!=='move') return false;
    return b.mode==='follow' || (b.mode==='hold' && !b.order) || (b.mode==='move' && b.order!==u.order);
  }
  swapUnits(u,b){
    const W=this.W, iu=u.y*W+u.x, ib=b.y*W+b.x;
    this.occ[iu]=b.id+1; this.occ[ib]=u.id+1;
    u.nx=b.x; u.ny=b.y; b.nx=u.x; b.ny=u.y;
    for(const z of [u,b]){ z.moving=true; z.prog=0; z.freeOld=false; z.stuck=0; z.stillSince=-1; z.dirx=z.nx-z.x; z.diry=z.ny-z.y; z.digTile=-1; }
    b.swapT=this.time+0.8; if(b.mode==='hold'){ b.holdX=b.nx; b.holdY=b.ny; }
  }
  // ---- Vọng gác: chạm lần đầu mở sương cả vùng cho phe mình
  towerTouch(u){
    const fac=this.factions[u.f]; const i=u.y*this.W+u.x;
    if(!fac.towersTaken) fac.towersTaken=new Set(); if(fac.towersTaken.has(i)) return; fac.towersTaken.add(i);
    const R=RULES.towerReveal; let n=0; const W=this.W;
    for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ if(dx*dx+dy*dy>R*R+R*0.6) continue; const x=u.x+dx,y=u.y+dy; if(!this.inb(x,y)) continue; const j=y*W+x; if(!fac.explored[j]){ fac.explored[j]=1; fac.vis[j]=fac.visStamp; n++; } }
    fac.stats.opened+=n;
    for(const o of this.orders) if(o.f===fac.id&&o.count>0) o.dirty=true; fac.follow.dirty=true;
    this.emit('tower',{x:u.x,y:u.y,f:u.f});
    if(fac.id===this.player) this.event(fac.id,`🗼 Chiếm vọng gác — mở sương quanh vùng! Để lính đứng gác được +2 tầm nhìn`,'good',u.x,u.y);
  }
  // ---- Lính tự phát hiện & tới đánh địch quanh tướng/quanh lính
  updateThreats(fac){
    const g=fac.general, AR=RULES.alertRadius, f=fac.id; const threats=[];
    const near=(e)=>{ if(g&&!g.dead && Math.abs(e.x-g.x)+Math.abs(e.y-g.y)<=AR) return true;
      let ok=false; this.queryRect(e.x-AR,e.y-AR,e.x+AR,e.y+AR,(o)=>{ if(!ok && o.f===f && !o.dead && o.type!=='general' && o.mode!=='explore' && Math.abs(o.x-e.x)+Math.abs(o.y-e.y)<=AR) ok=true; }); return ok; };
    for(const e of this.units){ if(e.dead||e.f===f||e.f===NEUTRAL||(e.squad&&e.squad.flag)) continue; if(!this.canSee(f,e)) continue; if(near(e)) threats.push(e); }
    fac.threats=threats;
    if(!threats.length){ fac.engage=null; return; }
    if(!fac.engage || this.time-fac.engage.t>0.9){ fac.engage={ field:this.computeFieldMulti(f,threats.map(e=>e.y*this.W+e.x), fac.engage&&fac.engage.field), t:this.time }; }
    // giao mục tiêu cho lính ở gần đang theo tướng
    for(const u of fac.units){ if(u.dead||u.type==='general'||u.mode!=='follow'||(u.squad&&u.squad.flag)) continue;
      if(u.target>=0 && u.tkind===0 && !this.units[u.target].dead) continue;
      let best=null, bd=RULES.engageRadius+1; for(const e of threats){ const d=Math.abs(e.x-u.x)+Math.abs(e.y-u.y); if(d<bd){bd=d;best=e;} }
      if(best){ u.target=best.id; u.tkind=0; u.nextScan=this.time+0.8; } }
  }
  computeFieldMulti(f, sources, field){
    const W=this.W,H=this.H,t=this.t, ex=this.factions[f].explored; if(!field) field=new Int32Array(this.N); field.fill(INF);
    const h=this.heap; h.n=0; for(const s of sources){ field[s]=0; h.push(0,s); }
    while(h.n){ const i=h.pop(), k=h.popKey; if(k>field[i]) continue; if(k>400) break; const x=i%W, y=(i/W)|0;
      for(let d=0;d<4;d++){ const nx=x+DIRS[d][0], ny=y+DIRS[d][1]; if(nx<0||ny<0||nx>=W||ny>=H) continue; const j=ny*W+nx; if(!ex[j]||!PASSABLE[t[j]]) continue;
        const c=Math.round(10/SPEED_T[t[j]]); const nk=k+c; if(nk<field[j]){ field[j]=nk; h.push(nk,j); } } }
    return field;
  }
  engageStep(u,e){
    const eng=this.factions[u.f].engage; const W=this.W;
    if(eng&&eng.field){ const fd=eng.field; const d0=fd[u.y*W+u.x];
      if(d0<INF){ let best=-1, bv=d0; for(let d=0;d<4;d++){ const nx=u.x+DIRS[d][0], ny=u.y+DIRS[d][1]; if(!this.inb(nx,ny)) continue; const j=ny*W+nx; if(this.occ[j]||fd[j]>=bv) continue; bv=fd[j]; best=j; }
        if(best>=0){ this.startMove(u,best); return true; } } }
    if(this.greedyStep(u,e.x,e.y)) return true;
    return Math.abs(e.x-u.x)+Math.abs(e.y-u.y)<=3; // kẹt sát địch: đứng chờ chỗ trống
  }
  // ---- Trinh sát tự động mở sương
  autoScouts(fac){
    const W=this.W, ex=fac.explored; const scouts=fac.units.filter(u=>!u.dead&&u.mode==='explore'&&!(u.squad&&u.squad.flag));
    if(!scouts.length) return; fac.scoutTargets=fac.scoutTargets||new Map();
    for(const s of scouts){
      const R=RULES.scoutRestStam;
      if(s.stam<1 || (s.resting && s.stam<R)){ // hết thể lực: về lương trạm gần nếu biết, không thì đứng nghỉ
        s.resting=true; const onSt=this.stationMask[s.y*W+s.x];
        if(!onSt && !s.order){ let best=null,bd=31; for(const st of this.map.stations){ if(!ex[st.y*W+st.x]) continue; const d=Math.abs(st.x-s.x)+Math.abs(st.y-s.y); if(d<bd){bd=d;best=st;} }
          if(best){ const o=this.newOrder(fac.id,best.x,best.y,0); o.field=this.computeField(fac.id,best.x,best.y,null); o.dirty=false; o.arriveR=0; o.count=1; s.order=o; } }
        else if(onSt && s.order){ s.order.count--; s.order=null; }
        fac.scoutTargets.delete(s.id); continue; }
      s.resting=false;
      if(!s.exNeed && s.order && s.order.field && !ex[s.order.y*W+s.order.x]) continue;
      if(!s.exNeed && s.order && this.time-s.order.t<8) continue;
      const tgt=this.pickFrontier(fac,s); if(s.order){ s.order.count--; s.order=null; }
      if(!tgt){ s.mode='follow'; s.wasExplore=true; continue; }
      const o=this.newOrder(fac.id,tgt.x,tgt.y,0); o.field=this.computeField(fac.id,tgt.x,tgt.y,null); o.dirty=false; o.arriveR=0; o.count=1; s.order=o; s.exNeed=false; s.stuck=0;
      fac.scoutTargets.set(s.id,tgt);
    }
    // trinh sát tạm theo tướng vì hết chỗ dò: thử lại định kỳ
    for(const u of fac.units){ if(u.wasExplore && u.mode==='follow' && this.tick%100===0){ u.mode='explore'; u.exNeed=true; u.wasExplore=false; } }
  }
  pickFrontier(fac,s){
    const W=this.W,H=this.H, ex=fac.explored, t=this.t; const seen=new Map(); const q=[s.y*W+s.x]; seen.set(q[0],0); let head=0; const cands=[];
    const g=fac.general; const others=[...fac.scoutTargets.entries()].filter(([id])=>id!==s.id).map(([,p])=>p);
    while(head<q.length && q.length<6000){ const i=q[head++], d=seen.get(i); if(d>70) break; const x=i%W, y=(i/W)|0;
      for(let k=0;k<4;k++){ const nx=x+DIRS[k][0], ny=y+DIRS[k][1]; if(nx<2||ny<2||nx>=W-2||ny>=H-2) continue; const j=ny*W+nx;
        if(!ex[j]){ cands.push({x:nx,y:ny,d,dx:DIRS[k][0],dy:DIRS[k][1]}); continue; }
        if(!PASSABLE[t[j]]||seen.has(j)) continue; seen.set(j,d+1); q.push(j); } }
    if(!cands.length) return null;
    let best=null, bs=1e9;
    for(const c of cands){ let sc=c.d;
      for(const o of others){ const dd=Math.abs(o.x-c.x)+Math.abs(o.y-c.y); if(dd<12) sc+=(12-dd)*3; }
      if(g&&!g.dead){ const dg=Math.abs(g.x-c.x)+Math.abs(g.y-c.y); if(dg>45) sc+=(dg-45)*0.5; }
      sc+=hash2(c.x,c.y,this.tick>>6)*4; if(sc<bs){bs=sc;best=c;} }
    // đi sâu vào sương theo hướng của mép
    const L=6; let tx=best.x+best.dx*L, ty=best.y+best.dy*L; tx=Math.max(2,Math.min(W-3,tx)); ty=Math.max(2,Math.min(H-3,ty));
    return {x:tx,y:ty};
  }
  arrive(u){ if(u.order){ u.order.count--; u.order=null; } u.mode='hold'; u.holdX=u.x; u.holdY=u.y; u.stuck=0; }

  // ---------- Mở sương ----------
  digRole(u){ return u.type==='general'?'general': u.type==='scout'?'scout':'soldier'; }
  addDig(u,j){
    const key=u.f*this.N+j; let job=this.digJobs.get(key);
    if(!job){ job={f:u.f,i:j,prog:0,tick:-1,cons:[], order:u.order, byGeneral:false}; this.digJobs.set(key,job); }
    if(u.type==='general') job.byGeneral=true;
    if(job.tick!==this.tick){ job.tick=this.tick; job.cons.length=0; }
    if(!job.cons.includes(u)) job.cons.push(u);
    u.digTile=j; u.dirx=(j%this.W)-u.x; u.diry=((j/this.W)|0)-u.y;
  }
  assistDig(u){ return false;
    if(u.stam<RULES.digCost[this.digRole(u)]) return false;
    let bestJob=null, bd=RULES.digAssistRange+1;
    for(const job of this.digJobs.values()){ if(job.f!==u.f) continue; if(u.mode==='follow' && !job.byGeneral) continue; const jx=job.i%this.W, jy=(job.i/this.W)|0; const d=Math.abs(jx-u.x)+Math.abs(jy-u.y); if(d<bd){bd=d;bestJob=job;} }
    if(bestJob){ if(bestJob.tick!==this.tick){ bestJob.tick=this.tick; bestJob.cons.length=0; } if(!bestJob.cons.includes(u)) bestJob.cons.push(u); u.digTile=bestJob.i; return true; }
    return false;
  }
  processDig(dt){
    const R=RULES;
    for(const [key,job] of this.digJobs){
      if(job.tick!==this.tick){ this.digJobs.delete(key); continue; } // đổi lệnh -> huỷ
      const fac=this.factions[job.f]; if(fac.explored[job.i]){ this.digJobs.delete(key); continue; }
      let rate=0, sol=0; const act=[];
      for(const u of job.cons){ if(u.dead) continue; const r=this.digRole(u);
        if(u.stam < R.digCost[r]) { if(this.time-(u.bubbleT||0)>4 && u.f===this.player){ u.bubble= u.type==='scout'?'Tìm được đường rồi, ai ra đón với!':'Hết sức rồi...'; u.bubbleT=this.time; } continue; }
        if(r==='soldier'){ if(sol>=R.digMaxSoldiers) continue; sol++; }
        rate+=R.digRate[r]; act.push(u); }
      job.rate=rate; job.prog+=rate*dt;
      if(job.prog>=1-1e-9){
        for(const u of act){ u.stam-=R.digCost[this.digRole(u)]; }
        this.reveal(fac,job.i); this.digJobs.delete(key);
      }
    }
  }
  reveal(fac,i,sdx,sdy){
    const W=this.W, cx=i%W, cy=(i/W)|0, R=RULES.openRadius; let blocked=false;
    fac.stats.opened++;
    // mở ô bước vào + mép hai bên (vuông góc hướng đi) để đội đi được; không mở trước mặt
    const cells=[[0,0]]; for(let k=1;k<=R;k++){ if(sdx){ cells.push([0,k],[0,-k]); } else if(sdy){ cells.push([k,0],[-k,0]); } else { cells.push([k,0],[-k,0],[0,k],[0,-k]); } }
    for(const [dx,dy] of cells){ const x=cx+dx,y=cy+dy; if(!this.inb(x,y)) continue; const j=y*W+x; if(fac.explored[j]) continue;
      fac.explored[j]=1; fac.vis[j]=fac.visStamp; if(!PASSABLE[this.t[j]]) blocked=true;
      if(fac.id===this.player) this.emit('reveal',{x,y,c:dx===0&&dy===0}); }
    if(blocked){ for(const o of this.orders) if(o.f===fac.id&&o.count>0) o.dirty=true; fac.follow.dirty=true; }
    else { for(const o of this.orders) if(o.f===fac.id&&o.count>0&&this.time-o.t>0) o.softDirty=true; }
  }

  // ---------- Chiêu mộ ----------
  tryRecruit(u){
    const W=this.W, fac=this.factions[u.f];
    for(let d=0;d<4;d++){ const nx=u.x+DIRS[d][0], ny=u.y+DIRS[d][1]; if(!this.inb(nx,ny)) continue; const j=ny*W+nx; const o=this.occ[j]; if(!o) continue; const n=this.units[o-1];
      if(n.f!==NEUTRAL||n.dead||!fac.explored[j]) continue;
      if(fac.count>=fac.cap){ if(u.f===this.player && this.time-(n.fullMsgT||0)>6){ n.fullMsgT=this.time; this.swapOffer={recruiter:u, neutral:n, t:this.time}; this.event(u.f,`Đủ quân ${fac.count}/${fac.cap} — có thể Đổi quân lấy ${UNIT[n.type].name}`,'full',n.x,n.y); } continue; }
      this.convertNeutral(n,u); }
  }
  convertNeutral(n,by){
    const fac=this.factions[by.f]; n.f=by.f; fac.units.push(n); fac.count++; fac.peak=Math.max(fac.peak,fac.count); fac.stats.recruited++;
    n.mode= (n.type==='scout' && !this.cfg.mini)? 'explore' : 'follow'; n.order=null; n.exNeed=true; n.born=this.time; n.stam=n.maxstam; n.hp=n.maxhp;
    // tiểu đội
    let sq=null;
    if(n.type==='scout') sq=this.newSquad(by.f);
    else if(by.type!=='general' && by.squad && by.squad.members.size<RULES.squadMax && by.type!=='scout' && !by.squad.flag) sq=by.squad;
    else { sq=fac.openSquad; if(!sq||sq.members.size>=RULES.squadMax||sq.flag||sq.dead) { sq=this.newSquad(by.f); fac.openSquad=sq; } }
    sq.members.add(n); n.squad=sq;
    if(by.mode!=='follow' && by.type!=='general'){ n.mode='hold'; n.holdX=n.x; n.holdY=n.y; }
    if(by.type==='general') fac.follow.dirty=true;
    this.emit('recruit',{x:n.x,y:n.y,f:by.f,type:n.type});
    if(by.f===this.player) this.event(by.f,`+1 ${UNIT[n.type].emoji} ${UNIT[n.type].name}  (${fac.count}/${fac.cap})`,'recruit',n.x,n.y);
  }
  cmdSwap(){
    const s=this.swapOffer; if(!s) return false; const u=s.recruiter, n=s.neutral; this.swapOffer=null;
    if(u.dead||n.dead||n.f!==NEUTRAL||u.f===NEUTRAL) return false; if(Math.abs(u.x-n.x)+Math.abs(u.y-n.y)>2) return false;
    const fac=this.factions[u.f]; if(u.type==='general') { // bỏ lính yếu nhất trong đội theo tướng
      let w=null; for(const o of fac.units) if(!o.dead&&o.type!=='general'&&(!w||o.hp<w.hp)) w=o; if(!w) return false; this.release(w);
    } else this.release(u);
    this.convertNeutral(n, u.f===NEUTRAL? fac.general : (u.dead? fac.general : u));
    return true;
  }
  release(u){ // lính bị bỏ quay lại trung lập tại chỗ
    const fac=this.factions[u.f]; fac.units.splice(fac.units.indexOf(u),1); fac.count--; if(u.squad){ u.squad.members.delete(u); u.squad=null; }
    if(u.order) u.order.count--; u.order=null; u.f=NEUTRAL; u.mode='idle'; u.target=-1;
    if(u.moving){ this.occ[u.ny*this.W+u.nx]=0; u.moving=false; this.occ[u.y*this.W+u.x]=u.id+1; }
    this.emit('release',{x:u.x,y:u.y});
  }
  newSquad(f){ const s={id:this.squads.length+1,f,members:new Set(),engage:0,combatUntil:0,flag:false,flagSince:0,item:null,dead:false}; this.squads.push(s); return s; }

  // ---------- Giao tranh ----------
  acquire(u){
    const S=UNIT[u.type]; const W=this.W;
    const onHill=this.t[u.y*W+u.x]===T.HILL;
    const range=S.range+(S.proj&&onHill?RULES.hillRange:0);
    let R;
    if(u.mode==='move') R = (S.proj? (u.stuck>1?1:0) : 1);
    else if(u.mode==='explore') R = 1;
    else if(u.mode==='hold') R = Math.max(range, S.proj?range:2);
    else R = Math.max(RULES.aggro, range);
    if(u.type==='general' && u.f!==this.player && u.mode!=='move') R=Math.max(R,3);
    if(u.type==='general' && u.f===this.player) R=Math.min(R, (u.weapon?u.weapon.reach:1)+ (u.mode==='move'?0:1));
    if(R<=0 && u.target>=0 && u.tkind===0){ u.target=-1; }
    let best=-1, bs=1e9;
    if(R>0) this.queryRect(u.x-R,u.y-R,u.x+R,u.y+R,(e)=>{
      if(e.f===u.f||e.f===NEUTRAL||e.dead) return; if(e.squad&&e.squad.flag) return;
      const d=Math.abs(e.x-u.x)+Math.abs(e.y-u.y); if(d>R+ (S.proj?1:0)) return;
      if(!this.canSee(u.f,e)) return;
      let s=d*10; if(this.inRange(u,e)) s-=40;
      const et=e.type;
      if(u.type==='assassin' && (et==='medic'||et==='archer'||et==='crossbow')) s-=25;
      if(u.type==='cavalry' && (UNIT[et].proj||et==='scout')) s-=20;
      if(u.type==='spear' && et==='cavalry') s-=25;
      if(u.type==='saber' && et==='shield') s-=25;
      if((u.type==='archer'||u.type==='crossbow') && et==='shield') s+=15;
      if(u.type==='crossbow' && (et==='swordsman'||et==='cavalry')) s-=15;
      if(et==='general') s-=5;
      if(s<bs){bs=s;best=e.id;} });
    if(best>=0){ u.target=best; u.tkind=0; return; }
    // không có địch: tiện đường chiêu mộ trung lập
    const fac=this.factions[u.f];
    if((u.mode==='follow'||(u.mode==='hold'&&u.type!=='general')) && fac.count<fac.cap && u.type!=='general'){
      let nb=-1, nd=4;
      this.queryRect(u.x-3,u.y-3,u.x+3,u.y+3,(e)=>{ if(e.f!==NEUTRAL||e.dead) return; const d=Math.abs(e.x-u.x)+Math.abs(e.y-u.y); if(d<nd && this.isVisTile(u.f,e.y*W+e.x)){ nd=d; nb=e.id; } });
      if(nb>=0 && u.mode==='follow'){ u.target=nb; u.tkind=1; return; }
    }
    if(u.tkind===0) u.target=-1;
  }
  chaseAllowed(u,e){
    if(u.mode==='move') return false;
    if(UNIT[u.type].proj && u.mode==='hold') return false;
    if(u.type==='general' && u.f===this.player) return false;
    let ax,ay,L;
    if(u.mode==='hold'){ ax=u.holdX; ay=u.holdY; L=2; }
    else if(u.mode==='explore'){ return Math.abs(e.x-u.x)+Math.abs(e.y-u.y)<=1; }
    else { const g=this.factions[u.f].general; const R=RULES.alertRadius+2;
      if(g&&!g.dead && Math.abs(e.x-g.x)+Math.abs(e.y-g.y)<=R) return true;
      return Math.abs(e.x-u.x)+Math.abs(e.y-u.y)<=RULES.engageRadius; }
    return Math.abs(e.x-ax)+Math.abs(e.y-ay) <= L;
  }
  inRange(u,e){
    const S=UNIT[u.type]; const dx=e.x-u.x, dy=e.y-u.y;
    if(!S.proj){ const m=Math.abs(dx)+Math.abs(dy); const reach=u.weapon?u.weapon.reach:1; if(m===1) return true; return m<=reach && (dx===0||dy===0) && this.losClear(u.x,u.y,e.x,e.y); }
    const onHill=this.t[u.y*this.W+u.x]===T.HILL;
    const r=S.range+(onHill?RULES.hillRange:0);
    if(dx*dx+dy*dy>r*r+0.5) return false;
    return this.losClear(u.x,u.y,e.x,e.y);
  }
  smoked(x,y){ if(!this.smokeAt.size) return false; const u=this.smokeAt.get(y*this.W+x); return u!==undefined && this.time<u; }
  losClear(x0,y0,x1,y1){
    const W=this.W; if(this.smoked(x0,y0)||this.smoked(x1,y1)) return false;
    let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, x=x0, y=y0;
    while(true){ if(x===x1&&y===y1) return true; const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;}
      if(x===x1&&y===y1) return true; if(BLOCK_SHOT[this.t[y*W+x]]||this.smoked(x,y)) return false; }
  }
  facingDot(t, sx, sy){ return (sx-t.x)*t.dirx + (sy-t.y)*t.diry; }
  attack(u,e){
    const S=UNIT[u.type]; const Wp=u.weapon; u.cd=S.cd*(Wp?Wp.cdMul:1); u.atkAnim=0.25; u.lastAtk=this.time; u.revealUntil=this.time+2;
    if(u.squad) u.squad.combatUntil=Math.max(u.squad.combatUntil,this.time+6);
    if(S.proj){
      const d=Math.hypot(e.x-u.x,e.y-u.y); const dur= S.proj==='arrow'? 0.18+d*0.09 : 0.1+d*0.05;
      this.projs.push({kind:S.proj, sx:u.x, sy:u.y, tx:e.x, ty:e.y, t0:this.time, dur, tid:e.id, src:u.id, f:u.f});
      this.emit('shoot',{x:u.x,y:u.y,kind:S.proj});
      return;
    }
    let dmg=(S.dmg+(Wp?Wp.dmg:0))*(u.dmgMul||1)*this.auraMul(u); let tag=null;
    // Kỵ sĩ xung phong
    if(u.type==='cavalry' && u.runLen>=RULES.chargeRun && this.time-u.lastMoveT<0.7 && this.time>=u.chargeAt){
      u.chargeAt=this.time+RULES.chargeCd;
      if(e.type==='spear' && this.isBraced(e) && this.facingDot(e,u.x,u.y)>0){
        // Thương binh dựng thương chặn hướng lao
        u.stunUntil=this.time+1.2; this.damage(u, UNIT.spear.dmg*1.5, e, 'brace');
        this.emit('brace',{x:e.x,y:e.y,ax:u.x,ay:u.y}); if(e.f===this.player||u.f===this.player) this.emit('say',{id:e.id,text:'Chặn!'}); return;
      }
      dmg*=1+RULES.chargeBonus; tag='charge'; this.emit('charge',{x:u.x,y:u.y,dx:e.x-u.x,dy:e.y-u.y}); this.emit('say',{id:u.id,text:'Đơn tới!'});
    }
    // Sát thủ phục kích
    if(u.type==='assassin' && this.time>=u.ambushAt && this.hiddenFrom(u,e.f)){
      let guarded=false; this.queryRect(e.x-1,e.y-1,e.x+1,e.y+1,(o)=>{ if(o.f===e.f&&o.type==='swordsman'&&!o.dead&&Math.abs(o.x-e.x)+Math.abs(o.y-e.y)===1) guarded=true; });
      u.ambushAt=this.time+RULES.ambushCd;
      if(!guarded){ dmg*=1+RULES.ambushBonus; tag='ambush'; } else this.emit('guard',{x:e.x,y:e.y});
    }
    if(u.type==='saber' && e.type==='shield' && this.shieldUp(e)){ e.shieldBrokenUntil=this.time+RULES.shieldBreak; this.emit('shieldbreak',{x:e.x,y:e.y}); }
    this.damage(e,dmg,u,tag);
    this.emit('slash',{x:u.x,y:u.y,tx:e.x,ty:e.y,type:u.type,tag,wp:Wp?WEAPONS.indexOf(Wp):-1});
    if(Wp){ // hiệu ứng vũ khí của tướng
      if(Wp.steal) u.hp=Math.min(u.maxhp,u.hp+dmg*Wp.steal);
      if(Wp.stun && !e.dead) e.stunUntil=this.time+Wp.stun;
      if(Wp.cleave){ let n=0; this.queryRect(u.x-1,u.y-1,u.x+1,u.y+1,(o)=>{ if(o===e||o.dead||o.f===u.f||o.f===NEUTRAL||(o.squad&&o.squad.flag)) return; if(Math.abs(o.x-u.x)+Math.abs(o.y-u.y)>1) return; if(n++<4){ this.damage(o,dmg*Wp.cleave,u,'cleave'); } }); if(n) this.emit('cleave',{x:u.x,y:u.y,f:u.f}); }
    }
  }
  auraMul(u){ if(u.type==='general') return 1; const g=this.factions[u.f]&&this.factions[u.f].general; if(!g||g.dead||!g.up||!g.up.aura) return 1; return Math.abs(g.x-u.x)+Math.abs(g.y-u.y)<=3 ? 1+0.05*g.up.aura : 1; }
  isBraced(e){ return !e.moving && e.stillSince>=0 && this.time-e.stillSince>=RULES.braceTime && (e.mode==='hold'||e.mode==='follow'||e.mode==='idle'||e.target>=0); }
  shieldUp(e){ return e.type==='shield' && this.time>=e.shieldBrokenUntil; }
  projHit(p){
    const e=this.units[p.tid]; const S=UNIT[p.kind==='arrow'?'archer':'crossbow'];
    if(!e||e.dead||Math.hypot(e.px-p.tx,e.py-p.ty)>1.3){ this.emit('miss',{x:p.tx,y:p.ty}); return; }
    let dmg=S.dmg, blocked=false;
    // khiên chắn từ trước: chính nó hoặc người đứng ngay sau lưng khiên
    if(this.shieldUp(e) && this.facingDot(e,p.sx,p.sy)>0) blocked=true;
    else { const ddx=p.sx-e.x, ddy=p.sy-e.y; let ox=0,oy=0; if(Math.abs(ddx)>=Math.abs(ddy)) ox=Math.sign(ddx); else oy=Math.sign(ddy);
      const s=this.unitAt(e.x+ox,e.y+oy); if(s&&s.f===e.f&&this.shieldUp(s)&&this.facingDot(s,p.sx,p.sy)>0) blocked=true; }
    if(blocked){ dmg*=1-RULES.shieldReduce; this.emit('block',{x:e.x,y:e.y,sx:p.sx,sy:p.sy}); }
    const src=this.units[p.src];
    this.damage(e,dmg,src&&!src.dead?src:null,p.kind, p.kind==='bolt');
  }
  damage(e,dmg,src,tag,pierce){
    let armor=UNIT[e.type].armor+(e.armorBonus||0); if(pierce||(src&&src.type==='crossbow')) armor*=0.5;
    dmg=dmg*(1-armor); dmg=Math.max(1,Math.round(dmg));
    e.hp-=dmg; e.flash=0.15; e.revealUntil=Math.max(e.revealUntil,this.time+1);
    if(e.squad){ const sq=e.squad; if(this.time>sq.combatUntil){ sq.engage=0; for(const m of sq.members) if(!m.dead) sq.engage++; } sq.combatUntil=this.time+6; }
    this.emit('dmg',{x:e.px,y:e.py,v:dmg,tag,f:e.f});
    // phản ứng: bị bắn khi đang giữ/ theo -> quay ra
    if(src && e.target<0 && e.mode!=='move' && this.canSee(e.f,src)){ e.target=src.id; e.tkind=0; }
    if(e.hp<=0) this.kill(e,src);
  }
  kill(e,src){
    e.dead=true; e.hp=0; const W=this.W;
    if(this.occ[e.y*W+e.x]===e.id+1) this.occ[e.y*W+e.x]=0; if(e.moving&&this.occ[e.ny*W+e.nx]===e.id+1) this.occ[e.ny*W+e.nx]=0;
    if(e.order){ e.order.count--; e.order=null; }
    const fac=this.factions[e.f]; if(fac) fac.stats.lost++; if(src&&src.f!==NEUTRAL) this.factions[src.f].stats.kills++;
    this.emit('death',{x:e.px,y:e.py,f:e.f,type:e.type});
    if(e.type==='general'){
      e.respawnAt=this.time+RULES.generalRespawn; e.channel=null;
      for(const k of e.items||[]) this.dropItem(e.x,e.y,k); e.items=[];
      if(e.f===this.player) this.event(e.f,`Tướng đã gục! Hồi sinh sau ${RULES.generalRespawn} giây`,'bad',e.x,e.y);
      else if(src&&src.f===this.player) this.event(this.player,`Hạ gục ${fac.def.general}!`,'good',e.x,e.y);
      return;
    }
    if(fac){ fac.count--; fac.units.splice(fac.units.indexOf(e),1); }
    if(e.squad){ const sq=e.squad; sq.members.delete(e); if(sq.members.size===0){ sq.dead=true; if(sq.item){ this.dropItem(e.x,e.y,sq.item); sq.item=null; } } }
  }
  dropItem(x,y,kind){ const W=this.W; for(let r=0;r<5;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const nx=x+dx, ny=y+dy; if(!this.inb(nx,ny)) continue; const j=ny*W+nx; if(PASSABLE[this.t[j]]&&!this.itemAt[j]){ this.items.push({x:nx,y:ny,kind,taken:false}); this.itemAt[j]=this.items.length; this.emit('drop',{x:nx,y:ny,kind}); return; } } }
  updateProjs(){ const keep=[]; for(const p of this.projs){ if(this.time>=p.t0+p.dur) this.projHit(p); else keep.push(p); } this.projs=keep; }
  respawnGeneral(fac){
    const g=fac.general, c=fac.camp, W=this.W;
    for(let r=0;r<6;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const x=c.x+dx,y=c.y+dy; const j=y*W+x; if(PASSABLE[this.t[j]]&&!this.occ[j]){
      g.dead=false; g.hp=g.maxhp; g.x=g.nx=x; g.y=g.ny=y; g.px=x; g.py=y; g.moving=false; g.mode='hold'; g.order=null; g.target=-1; this.occ[j]=g.id+1; g.stam=Math.max(g.stam,Math.round(g.maxstam*0.3));
      fac.follow.dirty=true; this.emit('respawn',{x,y,f:fac.id}); if(fac.id===this.player) this.event(fac.id,'Tướng đã hồi sinh tại trại','good',x,y); return; } }
  }

  // ---------- Cờ trắng & chiêu hàng ----------
  updateSquads(){
    const R=RULES;
    for(const sq of this.squads){ if(sq.dead) continue; let alive=0; for(const m of sq.members) if(!m.dead) alive++; if(!alive){ sq.dead=true; continue; }
      const fac=this.factions[sq.f], g=fac.general;
      let gd=1e9; if(g&&!g.dead) for(const m of sq.members){ const d=Math.hypot(m.x-g.x,m.y-g.y); if(d<gd) gd=d; }
      if(!sq.flag){
        if(sq.engage>=2 && alive<=sq.engage*R.flagLossRatio && gd>R.flagGeneralDist && this.time<sq.combatUntil+2){
          sq.flag=true; sq.flagSince=this.time; sq.flagAlive=alive;
          for(const m of sq.members){ m.target=-1; if(m.order){m.order.count--; m.order=null;} m.mode='hold'; m.holdX=m.moving?m.nx:m.x; m.holdY=m.moving?m.ny:m.y; }
          const m0=[...sq.members][0]; this.emit('flag',{x:m0.x,y:m0.y,f:sq.f});
          if(sq.f===this.player) this.event(sq.f,`🏳️ Tiểu đội ${UNIT[m0.type].name} giương cờ trắng! Đưa tướng về trong 6 ô để cứu`,'bad',m0.x,m0.y);
          else this.event(this.player,`🏳️ Một tiểu đội ${fac.def.short} giương cờ trắng — tướng tới trong 3 ô để Chiêu hàng`,'flag',m0.x,m0.y);
        }
      } else {
        if(gd<=R.flagGeneralDist || this.time-sq.flagSince>R.flagTimeout){ sq.flag=false; sq.engage=alive; sq.combatUntil=0; this.emit('unflag',{f:sq.f});
          if(sq.f===this.player) this.event(sq.f,'Tiểu đội đã hạ cờ trắng, tiếp tục chiến đấu','good'); }
      }
    }
  }
  flaggedNear(g){ const out=[]; for(const sq of this.squads){ if(sq.dead||!sq.flag||sq.f===g.f) continue; for(const m of sq.members){ if(!m.dead && Math.hypot(m.x-g.x,m.y-g.y)<=RULES.surrenderRange+0.01){ out.push(sq); break; } } } return out; }
  cmdSurrender(g, sq){
    if(!g||g.dead||!sq||!sq.flag||sq.f===g.f) return false; if(g.moving) return false;
    if(!this.flaggedNear(g).includes(sq)) return false;
    g.channel={sq, t0:this.time, x:g.x, y:g.y}; if(g.order){g.order.count--; g.order=null;} g.mode='hold'; g.holdX=g.x; g.holdY=g.y; g.target=-1;
    this.emit('channel',{id:g.id}); return true;
  }
  updateChannels(){
    for(const fac of this.factions){ const g=fac.general; const ch=g.channel; if(!ch) continue;
      const sq=ch.sq; const owner=this.factions[sq.f].general;
      let fail = g.dead || g.moving || g.x!==ch.x || g.y!==ch.y || !sq.flag || sq.dead;
      if(!fail && owner && !owner.dead){ for(const m of sq.members){ if(Math.hypot(m.x-owner.x,m.y-owner.y)<=RULES.flagGeneralDist){ fail=true; break; } } }
      if(fail){ g.channel=null; if(fac.id===this.player) this.event(fac.id,'Chiêu hàng bị gián đoạn','bad'); continue; }
      if(this.time-ch.t0>=RULES.surrenderChannel){ g.channel=null; this.surrenderSquad(sq,fac); }
    }
  }
  surrenderSquad(sq,fac){
    const old=this.factions[sq.f]; const mem=[...sq.members].filter(m=>!m.dead).sort((a,b)=>b.hp-a.hp);
    let room=fac.cap-fac.count; const nsq=this.newSquad(fac.id); nsq.item=sq.item; sq.item=null; let got=0, gone=0;
    for(const m of mem){
      old.units.splice(old.units.indexOf(m),1); old.count--; sq.members.delete(m);
      if(room>0){ room--; m.f=fac.id; fac.units.push(m); fac.count++; fac.peak=Math.max(fac.peak,fac.count); nsq.members.add(m); m.squad=nsq; m.mode='hold'; m.holdX=m.x; m.holdY=m.y; m.target=-1; got++; this.emit('convert',{x:m.x,y:m.y,f:fac.id}); }
      else { // vượt trần: rút khỏi trận
        m.dead=true; if(this.occ[m.y*this.W+m.x]===m.id+1) this.occ[m.y*this.W+m.x]=0; if(m.moving&&this.occ[m.ny*this.W+m.nx]===m.id+1) this.occ[m.ny*this.W+m.nx]=0; this.emit('retreat',{x:m.x,y:m.y}); gone++; }
    }
    sq.dead=true; sq.flag=false; fac.stats.converted+=got;
    this.emit('surrender',{f:fac.id});
    if(fac.id===this.player) this.event(fac.id,`🎉 Chiêu hàng thành công: +${got} quân${gone?`, ${gone} lính rút khỏi trận`:''}`,'good');
    else if(old.id===this.player) this.event(old.id,`Tiểu đội của bạn đã quy thuận ${fac.def.short}!`,'bad');
    else this.event(this.player,`${fac.def.short} chiêu hàng ${got} quân của ${old.def.short}`,'info');
  }
  useItem(u, slot){
    if(!u||u.dead) return false;
    if(u.type==='general'){ const k=u.items[slot]; if(!k||k==='tea') return false;
      let ok2=true;
      if(k==='bun') u.stam=Math.min(u.maxstam,u.stam+20); else ok2=this.applyItem(u,k);
      if(!ok2) return false;
      u.items.splice(slot,1); this.emit('use',{x:u.x,y:u.y,kind:k}); return true; }
    const sq=u.squad; if(!sq||!sq.item) return false; const k=sq.item;
    if(k==='tea'){ for(const m of sq.members) if(!m.dead) m.stam=Math.min(m.maxstam,m.stam+5); }
    else if(k==='bun'){ const g=this.factions[u.f].general; if(g.dead||Math.hypot(g.x-u.x,g.y-u.y)>3) return false; g.stam=Math.min(g.maxstam,g.stam+20); }
    else if(!this.applyItem(u,k)) return false;
    sq.item=null; this.emit('use',{x:u.x,y:u.y,kind:k}); return true;
  }
  applyItem(u,k){
    const W=this.W, P=this.player;
    switch(k){
      case 'bandage': {
        let tgt=u;
        if(u.type!=='general'&&u.squad){ const ms=[...u.squad.members].filter(m=>!m.dead&&m.hp<m.maxhp); ms.sort((a2,b2)=>a2.hp/a2.maxhp-b2.hp/b2.maxhp); const still=ms.find(m=>!m.moving); tgt=still||ms[0]; }
        if(!tgt||tgt.hp>=tgt.maxhp){ if(u.f===P) this.event(u.f,'Cả đội đang đầy máu — để dành băng','bad'); return false; }
        tgt.bandage={until:this.time+RULES.bandageDelay, hp0:tgt.hp, x:tgt.moving?tgt.nx:tgt.x, y:tgt.moving?tgt.ny:tgt.y};
        if(u.f===P) this.event(u.f,`🩹 ${UNIT[tgt.type].name} đứng yên 3 giây để băng vết thương...`,'info',tgt.x,tgt.y);
        return true; }
      case 'compass': {
        let best=null,bd=RULES.compassR+1;
        for(const n of this.units){ if(n.f!==NEUTRAL||n.dead) continue; const d2=Math.abs(n.x-u.x)+Math.abs(n.y-u.y); if(d2<bd){bd=d2;best=n;} }
        if(!best){ if(u.f===P) this.event(u.f,'🧭 Không còn lính trung lập nào trong 30 ô','bad'); return false; }
        this.factions[u.f].memNeutral.set(best.y*W+best.x,best.type);
        this.emit('compassmark',{x:best.x,y:best.y});
        if(u.f===P) this.event(u.f,`🧭 La bàn chỉ về một ${UNIT[best.type].name} cách ${bd} ô (dấu ❗)`,'good',best.x,best.y);
        return true; }
      case 'smoke': {
        const R=RULES.smokeR, until=this.time+RULES.smokeDur;
        for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ const x=u.x+dx,y=u.y+dy; if(this.inb(x,y)) this.smokeAt.set(y*W+x,until); }
        this.smokes.push({x:u.x,y:u.y,until});
        if(u.f===P) this.event(u.f,'💨 Khói phủ 3×3 — chặn mọi đường bắn qua vùng này trong 8 giây','good');
        return true; }
      case 'scarecrow': {
        this.wards.push({x:u.x,y:u.y,f:u.f,until:this.time+RULES.wardDur});
        this.emit('ward',{x:u.x,y:u.y,f:u.f});
        if(u.f===P) this.event(u.f,'👒 Bù Nhìn đứng gác tại đây trong 15 giây','good',u.x,u.y);
        return true; }
      case 'plank': return this.tryPlank(u);
    }
    return false;
  }
  tryPlank(u){
    const W=this.W, t=this.t;
    for(const [dx,dy] of DIRS){
      let done=false;
      for(let s0=1;s0<=2;s0++){
        const x0=u.x+dx*s0, y0=u.y+dy*s0; if(!this.inb(x0,y0)) break;
        const v=t[y0*W+x0];
        if(v!==T.WATER){ if(!PASSABLE[v]) break; continue; }
        const tiles=[]; let x=x0,y=y0,n=0;
        while(this.inb(x,y)&&t[y*W+x]===T.WATER&&n<RULES.plankMaxSpan){ tiles.push(y*W+x); x+=dx; y+=dy; n++; }
        if(!this.inb(x,y)||!PASSABLE[t[y*W+x]]) break;
        for(const i of tiles){ this.plankOrig.set(i,t[i]); t[i]=T.BRIDGE; this.emit('terrain',{x:i%W,y:(i/W)|0}); }
        this.planks.push({tiles,until:this.time+RULES.plankDur});
        const fac=this.factions[u.f]; for(const i of tiles) if(!fac.explored[i]) fac.explored[i]=1;
        for(const o of this.orders) o.dirty=true; for(const f2 of this.factions) f2.follow.dirty=true;
        this.emit('plank',{x:tiles[0]%W,y:(tiles[0]/W)|0});
        if(u.f===this.player) this.event(u.f,'🪵 Đã bắc cầu qua sông — mọi phe đi được trong 30 giây!','good',tiles[0]%W,(tiles[0]/W)|0);
        done=true; break;
      }
      if(done) return true;
    }
    if(u.f===this.player) this.event(u.f,'🪵 Cần đứng sát mép sông để bắc cầu','bad');
    return false;
  }

  zoneHolder(cx,cy,h,need){
    const cnt=new Map();
    this.queryRect(cx-h,cy-h,cx+h,cy+h,(u)=>{ if(u.dead||u.f===NEUTRAL) return; if(Math.abs(u.x-cx)>h||Math.abs(u.y-cy)>h) return; cnt.set(u.f,(cnt.get(u.f)||0)+1); });
    let holder=-1; if(cnt.size===1){ const [f,c]=[...cnt][0]; if(c>=(need??RULES.holdMin)) holder=f; }
    return {holder, contested:cnt.size>1};
  }
  updateDrum(dt){
    const d=this.drum;
    for(const fac of this.factions) fac.flagCount=0;
    for(const fl of this.flags){ const z=this.zoneHolder(fl.x,fl.y,1);
      if(z.holder!==fl.holder){ if(z.holder>=0) this.event(this.player, z.holder===this.player? '🚩 Bạn chiếm được một cờ phụ!' : `🚩 ${this.factions[z.holder].def.short} chiếm một cờ phụ`, z.holder===this.player?'good':'info', fl.x, fl.y); fl.holder=z.holder; this.emit('flagtake',{x:fl.x,y:fl.y,f:z.holder}); }
      if(fl.holder>=0) this.factions[fl.holder].flagCount++; }
    const z=this.zoneHolder(d.x,d.y,d.h); const holder=z.holder; d.contested=z.contested;
    const flagsNeed=this.flags.length>0;
    if(holder!==d.holder){ if(holder>=0){ this.emit('drumtake',{f:holder}); this.event(this.player, holder===this.player? '🥁 Bạn đang giữ Trống Loạn Thế!':`🥁 ${this.factions[holder].def.short} đang giữ Trống!`, holder===this.player?'good':'bad'); } d.holder=holder; }
    for(const fac of this.factions){
      const q = fac.id===holder && (!flagsNeed || fac.flagCount>0);
      if(q){ fac.holdStreak+=dt; fac.holdTotal+=dt; } else fac.holdStreak=0;
    }
    if(holder===this.player && flagsNeed && this.factions[holder].flagCount===0 && this.time-(this._noFlagT||0)>12){ this._noFlagT=this.time; this.event(this.player,'⚠️ Đang giữ Trống nhưng thiếu cờ phụ — phải giữ thêm ít nhất 1 cờ 🚩!','bad'); }
    const need=this.cfg.drumHold||RULES.drumHold;
    if(holder>=0 && this.factions[holder].holdStreak>=need){ this.end(holder,'drum'); }
  }
  // ---- Trại chính, chiêu hàng cả phe, phe cuối cùng
  updateCamps(dt){
    if(this.over) return;
    if(this.cfg.factions>=8){
      for(const fac of this.factions){ if(fac.eliminated) continue; const c=fac.camp;
        const z=this.zoneHolder(c.x,c.y,RULES.campZone);
        if(z.holder>=0 && z.holder!==fac.id){ fac.campT=(fac.campT||0)+dt; fac.campRecl=0;
          if(fac.id===this.player && this.time-(fac.campWarnT||0)>20){ fac.campWarnT=this.time; this.event(fac.id,'⚠️ Trại chính đang bị tấn công chiếm đóng!','bad',c.x,c.y); }
          if(fac.campT>=RULES.campCapTime && fac.campTakenBy!==z.holder){ fac.campTakenBy=z.holder; this.emit('camplost',{x:c.x,y:c.y,f:fac.id});
            this.event(this.player, fac.id===this.player? '💥 Trại chính của bạn đã bị chiếm!' : `💥 Trại của ${fac.def.short} bị ${this.factions[z.holder].def.short} chiếm`, fac.id===this.player?'bad':'info', c.x,c.y); } }
        else { fac.campT=0; if(z.holder===fac.id){ fac.campRecl=(fac.campRecl||0)+dt; if(fac.campRecl>=RULES.campCapTime && fac.campTakenBy>=0){ fac.campTakenBy=-1; if(fac.id===this.player) this.event(fac.id,'🏠 Đã giành lại trại chính','good'); } } else fac.campRecl=0; }
        if(fac.ai && !fac.eliminated && fac.campTakenBy>=0 && fac.peak>=6 && fac.count<fac.peak*RULES.factionSurrenderRatio){
          const to=this.factions[fac.campTakenBy]; if(to && !to.eliminated) this.factionSurrender(fac,to);
        }
      }
    }
    if(this.tick%40===0){ const act=this.factions.filter(f=>!f.eliminated); if(act.length===1 && this.factions.length>1) this.end(act[0].id,'last'); }
  }
  factionSurrender(fac,to){
    if(fac.eliminated||this.over) return; fac.eliminated=true; fac.alive=false;
    const sold=fac.units.filter(u=>!u.dead&&u.type!=='general').sort((a,b)=>b.hp-a.hp);
    const room=Math.max(0,to.cap-to.count); const take=Math.min(RULES.surrenderTake,room,sold.length);
    const nsq= take? this.newSquad(to.id) : null; let got=0;
    for(const m of sold){
      fac.units.splice(fac.units.indexOf(m),1); fac.count--; if(m.squad) m.squad.members.delete(m); if(m.order){ m.order.count--; m.order=null; }
      if(got<take){ m.f=to.id; to.units.push(m); to.count++; to.peak=Math.max(to.peak,to.count); nsq.members.add(m); m.squad=nsq; m.mode='hold'; m.holdX=m.x; m.holdY=m.y; m.target=-1; m.channel=null; got++; this.emit('convert',{x:m.x,y:m.y,f:to.id}); }
      else { m.dead=true; if(this.occ[m.y*this.W+m.x]===m.id+1) this.occ[m.y*this.W+m.x]=0; if(m.moving&&this.occ[m.ny*this.W+m.nx]===m.id+1) this.occ[m.ny*this.W+m.nx]=0; this.emit('retreat',{x:m.x,y:m.y}); }
    }
    const g=fac.general; if(g){ if(!g.dead){ g.dead=true; if(this.occ[g.y*this.W+g.x]===g.id+1) this.occ[g.y*this.W+g.x]=0; if(g.moving&&this.occ[g.ny*this.W+g.nx]===g.id+1) this.occ[g.ny*this.W+g.nx]=0; this.emit('retreat',{x:g.x,y:g.y}); } g.respawnAt=1e18; g.channel=null; }
    to.stats.converted+=got;
    this.emit('surrenderAll',{f:fac.id});
    this.event(this.player, fac.id===this.player? `🏳️🏳️ Phe của bạn đã quy thuận ${to.def.name}` : `🏳️🏳️ CẢ PHE ${fac.def.name} quy thuận ${to.def.short}${got?` (+${got} lính)`:''}`, fac.id===this.player?'bad':'flag');
    if(fac.id===this.player) this.end(to.id,'surrender');
  }
  // ---- Khói, ván cầu, bù nhìn, bão sương
  updateWorldFx(dt){
    if(this.tick%20===0 && (this.smokeAt.size||this.wards.length||this.smokes.length)){
      for(const [i,u2] of this.smokeAt){ if(this.time>=u2) this.smokeAt.delete(i); }
      this.smokes=this.smokes.filter(s2=>this.time<s2.until);
      this.wards=this.wards.filter(w2=>this.time<w2.until);
    }
    if(this.planks.length && this.tick%10===0){ const keep=[];
      for(const p of this.planks){ if(this.time<p.until){ keep.push(p); continue; }
        let occ=false; for(const i of p.tiles) if(this.occ[i]) occ=true;
        if(occ){ p.until=this.time+1; keep.push(p); continue; }
        for(const i of p.tiles){ this.t[i]=this.plankOrig.get(i)??T.WATER; this.plankOrig.delete(i); this.emit('terrain',{x:i%this.W,y:(i/this.W)|0}); }
        for(const o of this.orders) o.dirty=true; for(const f2 of this.factions) f2.follow.dirty=true;
      } this.planks=keep; }
    const st=this.cfg.storm;
    if(st && !this.over){
      if(!this.stormWarned && this.time>=st.start-60){ this.stormWarned=true; this.event(this.player,'🌩️ BÃO SƯƠNG sẽ tràn vào sau 1 phút — dồn quân về Trống!','bad'); }
      if(this.time>=st.start){
        const k=Math.min(1,(this.time-st.start)/Math.max(1,st.end-st.start));
        const maxR=this.W*0.75, minR=this.map.ringIn+6; this.stormR=maxR+(minR-maxR)*k;
        if(!this.stormOn){ this.stormOn=true; this.emit('stormstart',{}); this.event(this.player,'🌩️ BÃO SƯƠNG TRÀN VÀO! Ở ngoài vùng tím sẽ mất máu liên tục','bad');
          for(const f2 of this.factions) if(f2.ai&&!f2.eliminated){ f2.aiState.phase='push'; f2.aiState.nextPush=0; } }
        if(this.tick%20===0){ const cx=this.drum.x, cy=this.drum.y, R2=this.stormR*this.stormR;
          for(const u of this.units){ if(u.dead) continue; const dx=u.x-cx, dy=u.y-cy; if(dx*dx+dy*dy>R2) this.damage(u, Math.max(2,Math.round(u.maxhp*RULES.stormDps)), null, 'storm'); } }
      }
    }
  }
  finishByTime(){ let best=-1, bv=-1, tie=false; for(const f of this.factions){ if(f.holdTotal>bv+1e-6){bv=f.holdTotal;best=f.id;tie=false;} else if(Math.abs(f.holdTotal-bv)<1e-6) tie=true; } this.end(tie?-1:best,'time'); }
  end(winner,how){ if(this.over) return; this.over=true; this.result={winner,how,time:this.time}; this.emit('end',{winner}); }
}
