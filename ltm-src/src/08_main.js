// Ảnh có chữ tiếng Việt (logo, băng rôn thắng/thua) tạm ẩn ở bản quốc tế — dùng chữ tiếng Anh cho đến khi có art tiếng Anh
const VN_TEXT_ART={};   /* (5.6) logo và băng VICTORY/DEFEAT tiếng Anh do ChatGPT vẽ đã có trong game */
function artOK(k){ return !!ArtUrls[k] && (!VN_TEXT_ART[k] || !!(ArtImages[k]&&ArtImages[k]._user)); }   /* ảnh chữ Việt có sẵn thì ẩn; người chơi tự nạp bản tiếng Anh (G01E/G19E/G20E) qua "Art pack" thì dùng ngay */
// ============ Giao diện, điều khiển, vòng lặp ============
const $=(id)=>document.getElementById(id);
const audio=new SoundFX();
const Save={ get(){ try{ return JSON.parse(localStorage.getItem('ltm_save')||'{}'); }catch(e){ return {}; } }, set(v){ try{ localStorage.setItem('ltm_save',JSON.stringify(v)); }catch(e){} } };
let save=Save.get(); if(!save.done) save.done=[]; if(save.xu==null) save.xu=0; if(!save.up) save.up={speed:0,power:0,armor:0,stamina:0,aura:0,weapon:0}; if(!save.inv||typeof save.inv!=='object') save.inv={}; if(!Array.isArray(save.pack)) save.pack=[];   // 🎒 kho quân nhu + 3 món mang vào trận
const G={ world:null, bw:null, ren:null, level:1, speed:1, paused:true, acc:0, last:performance.now(), sel:new Set(), lastTap:null, hints:{}, hintQ:[], resultShown:false, mmT:0, hudT:0 };

function startLevel(L,opts){
  if(G.bw) stopBigWar(false);
  G.level=L; const cfg= L==='mini'? miniConfig() : levelConfig(L);
  G.world=new World(cfg,0,Object.assign({genUp:save.up},opts||{})); const w=G.world;
  if(!G.ren) G.ren=new Renderer($('game'),w); else { const r=new Renderer($('game'),w); G.ren=r; }
  const g=w.factions[0].general; G.ren.centerOn(g.x,g.y,true); G.ren.cam.z=Math.max(0.8,Math.min(1.6,G.ren.vw/(24*TS)));
  G.sel=new Set([g.id]); G.ren.selected=G.sel; G.paused=false; G.resultShown=false; G.acc=0; G.hints={}; G.hintQ=[];
  ['menu','levels','help','pause','result','forge','gear','decor','tutDone','artscr','p2p'].forEach(id=>$(id).classList.add('hidden')); $('hud').classList.remove('hidden');
  document.body.classList.toggle('mini', !!cfg.mini);
  drawBadge(); setupMinimap(); updateSel();
  $('toasts').innerHTML='';
  if(cfg.mini) hint('mintro','⚡ Blitz: tap the ground to lead your general — troops follow and fight on their own. Hold the central Drum for 30s to win!',9);
  else hint('intro','Tap a tile to move the general. Each step into a dark (fog) tile costs 1 stamina. ❗ marks soldiers waiting to be recruited!',9);
  window.__ltm.world=w;
}
function drawBadge(){ const cv=$('badge'), c=cv.getContext('2d'); const F=FACTIONS[0]; c.clearRect(0,0,84,84); const g=c.createLinearGradient(0,0,0,84); g.addColorStop(0,F.light); g.addColorStop(1,F.color); c.fillStyle=g; rr(c,3,3,78,78,18); c.fill(); c.lineWidth=5; c.strokeStyle=OUT; c.stroke(); c.drawImage(makeUnitSprite('general',0,save.up.weapon||0),-4,-2,92,92); $('fname').textContent=F.name; }

// ---------- gợi ý cho người mới ----------
function hint(key,text,secs){ if(G.hints[key]) return; G.hints[key]=1; G.hintQ.push({text,secs}); }
let hintBusy=0;
function pumpHint(dt){ const el=$('hint'); if(hintBusy>0){ hintBusy-=dt; if(hintBusy<=0) el.style.opacity=0; return; } const h=G.hintQ.shift(); if(!h) return; el.textContent='💡 '+h.text; el.style.opacity=1; hintBusy=h.secs; }

// ---------- chọn quân ----------
function selUnits(){ const w=G.world; const out=[]; for(const id of G.sel){ const u=w.units[id]; if(u && !(u.dead && u.type!=='general') && u.f===w.player) out.push(u); } return out; }
function setSel(units,announce){ G.sel.clear(); for(const u of units) G.sel.add(u.id); updateSel(); if(announce){ const el=$('selcount'); el.textContent=announce; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); } }
function selLabel(us){ if(!us.length) return ['No troops selected','Tap your general or one of your soldiers']; const types=new Set(us.map(u=>u.type));
  if(us.length===1){ const u=us[0]; const S=UNIT[u.type]; return [`${S.emoji} ${u.type==='general'?FACTIONS[u.f].general:S.name}`, `HP ${Math.ceil(u.hp)}/${u.maxhp} · Stamina ${Math.floor(u.stam)}/${u.maxstam} · ${modeName(u)}`]; }
  const avg=Math.round(us.reduce((s,u)=>s+u.stam,0)/us.length);
  if(types.size===1){ const t=[...types][0]; return [`${UNIT[t].emoji} ${UNIT[t].name} ×${us.length}`, `Avg stamina ${avg}/20 · ${modeName(us[0])}`]; }
  return [`⚔️ Troops ×${us.length}`, [...types].map(t=>UNIT[t].emoji+us.filter(u=>u.type===t).length).join(' ')]; }
function modeName(u){ if(u.dead) return 'respawning'; if(u.squad&&u.squad.flag) return '🏳️ white flag'; if(u.channel) return 'persuading surrender'; if(u.digTile>=0) return 'clearing the way'; if(u.mode==='explore') return u.resting? 'resting' : 'auto-scouting'; return {follow:'following the general',move:'moving',hold:'holding position',idle:'waiting'}[u.mode]||''; }
function updateSel(){ const us=selUnits(); const [a,b]=selLabel(us); $('selname').textContent=a; $('selinfo').textContent=b; renderItems(us); }

// ---------- vật phẩm ----------
function renderItems(us){
  const w=G.world; if(!w) return; const box=$('items'); const g=w.factions[w.player].general; const parts=[];
  const btn=(emoji,label,fn,key,art)=>{ parts.push({emoji,label,fn,key,art}); };
  if(us.length && us.some(u=>u.type==='general') || !us.length){ for(let i=0;i<2;i++){ const k=g.items&&g.items[i]; if(k) btn(ITEM[k].emoji,ITEM[k].short,()=>{ if(useGeneralItem(i)) updateSel(); },'g'+i+k,'item:'+k); } }
  const sqs=new Set(); for(const u of us){ if(u.squad && u.squad.item && !sqs.has(u.squad)){ sqs.add(u.squad); if(sqs.size<=3) btn(ITEM[u.squad.item].emoji,'Squad: '+ITEM[u.squad.item].short,()=>{ if(w.useItem(u,0)) { audio.pickup(); updateSel(); } },'s'+u.squad.id+u.squad.item,'item:'+u.squad.item); } }
  const sig=parts.map(p=>p?p.key:'_').join('|')+Object.keys(ArtUrls).length; if(box._sig===sig) return; box._sig=sig; box.innerHTML='';
  for(const p of parts){ if(!p){ const d=document.createElement('div'); d.className='slot'; d.textContent='empty'; box.appendChild(d); continue; } const b=document.createElement('button'); b.className='btn'; b.innerHTML=`${p.art&&ArtUrls[p.art]?`<img src="${ArtUrls[p.art]}" style="width:38px;height:38px;object-fit:contain;margin-top:-6px">`:p.emoji}<small>${p.label}</small>`; b.onclick=(e)=>{ e.stopPropagation(); audio.init(); p.fn(); }; box.appendChild(b); }
}
function useGeneralItem(i){ const w=G.world, g=w.factions[w.player].general; if(g.dead) return false; const k=g.items[i];
  if(k==='tea'){ // tướng phát trà cho lính quanh mình
    let n=0; for(const u of w.factions[w.player].units){ if(!u.dead&&u.type!=='general'&&Math.abs(u.x-g.x)+Math.abs(u.y-g.y)<=4&&n<10){ u.stam=Math.min(u.maxstam,u.stam+5); n++; } }
    if(!n){ toast({text:'No soldiers near the general to drink Ginger Tea',kind:'bad'}); return false; } g.items.splice(i,1); w.emit('use',{x:g.x,y:g.y,kind:'tea'}); toast({text:`🍵 ${n} soldiers recover 5 stamina`,kind:'good'}); return true; }
  const ok=w.useItem(g,i); if(ok) toast({text:'🥟 General recovers 20 stamina',kind:'good'}); return ok; }

// ---------- thông báo ----------
function toast(e){ const box=$('toasts');
  if(e.kind==='recruit'){ const last=box.lastElementChild; if(last && last._rec && performance.now()-last._t<3000 && last.style.opacity!=='0'){ last._n++; last._t=performance.now(); last.textContent=`+${last._n} troops · ${e.text.replace(/^\+1 /,'latest: ')}`; clearTimeout(last._to); last._to=setTimeout(()=>{ last.style.transition='opacity .5s'; last.style.opacity=0; setTimeout(()=>last.remove(),520); },3400); return; } }
  const d=document.createElement('div'); if(e.kind==='recruit'){ d._rec=true; d._n=1; d._t=performance.now(); } d.className='toast '+(e.kind||''); d.textContent=e.text; if(e.x!==undefined){ d.onclick=()=>G.ren.centerOn(e.x,e.y); d.style.cursor='pointer'; }
  box.appendChild(d); while(box.children.length>3) box.firstChild.remove(); d._to=setTimeout(()=>{ d.style.transition='opacity .5s'; d.style.opacity=0; setTimeout(()=>d.remove(),520); }, e.kind==='flag'||e.kind==='bad'?5200:3400); }

// ---------- điều khiển chạm/chuột ----------
const ptrs=new Map(); let gest=null;
function canvasPos(e){ const r=$('game').getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; }
function setupInput(){
  const cv=$('game');
  cv.addEventListener('pointerdown',(e)=>{ audio.init(); try{ cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); }catch(_){} const p=canvasPos(e); if(G.bw){ if(G.bw.intro) G.bw.skipIntro(); if(p[1]<SAFE.t+130) G.bw.revealHud(); } ptrs.set(e.pointerId,{x:p[0],y:p[1],sx:p[0],sy:p[1],t:performance.now()});
    if(ptrs.size===1){ gest={mode:'tap',x:p[0],y:p[1],t:performance.now()};
      // GIỮ YÊN NGÓN ~0.35s rồi kéo = VÙNG QUÉT chọn nhiều đạo quân
      if(G.bw&&!G.bw.over){ const g0=gest; g0.lp=setTimeout(()=>{ if(gest===g0&&g0.mode==='tap'&&ptrs.size===1&&G.bw&&!G.bw.over&&!G.bw.rallyOpen){ g0.mode='box'; G.bw.box={x0:g0.x,y0:g0.y,x1:g0.x,y1:g0.y}; G.bw.menu=null; try{ navigator.vibrate&&navigator.vibrate(18); }catch(_){} } },350); } }
    else if(ptrs.size===2){ if(gest&&gest.lp) clearTimeout(gest.lp); if(G.bw) G.bw.box=null; const [a,b]=[...ptrs.values()]; gest={mode:'pinch',d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,z:(G.bw? G.bw.zoomTgt : (G.ren? G.ren.cam.z:1))}; if(G.bw&&G.bw.camDrag!=null){ G.bw.camX=G.bw.camDrag; G.bw.camDrag=null; } } });
  cv.addEventListener('pointermove',(e)=>{ const q=ptrs.get(e.pointerId); if(!q||(!G.ren&&!G.bw)) return; if(!G.ren&&G.bw){ const p=canvasPos(e); const dx=p[0]-q.x, dy=p[1]-q.y; q.x=p[0]; q.y=p[1];
      if(gest&&gest.mode==='pinch'&&ptrs.size===2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
        const bw=G.bw; bw.zoomAt(gest.z*d/Math.max(1,gest.d), cx, cy); gest.cx=cx; gest.cy=cy; return; } // zoomAt đã neo điểm giữa hai ngón: không cộng thêm độ dịch (tránh trôi)
      if(gest&&gest.mode==='box'&&G.bw.box){ G.bw.box.x1=p[0]; G.bw.box.y1=p[1]; return; }
      if(gest){ if(gest.mode==='tap'&&Math.hypot(p[0]-q.sx,p[1]-q.sy)>9){ gest.mode='pan'; if(gest.lp) clearTimeout(gest.lp); } if(gest.mode==='pan'){ const bw=G.bw; bw.camDrag=(bw.camDrag==null? bw.camX : bw.camDrag) - dx/(bw.scale||1); if(Number.isFinite(dy)) bw.camY=(bw.camY||0)-dy/(bw.scale||1); /* dy lấy từ điểm chạm trước, không dùng biến chưa khởi tạo */ bw.focusB=null; bw.jumpT=null; } } return; } const p=canvasPos(e); const dx=p[0]-q.x, dy=p[1]-q.y; q.x=p[0]; q.y=p[1]; const cam=G.ren.cam;
    if(ptrs.size===1 && gest){ if(gest.mode==='tap' && Math.hypot(p[0]-q.sx,p[1]-q.sy)>9) gest.mode='pan'; if(gest.mode==='pan'){ if(G.bw){ const bw=G.bw; bw.camDrag=(bw.camDrag==null? bw.camX : bw.camDrag) - dx/(bw.scale||1); if(Number.isFinite(dy)){ bw.camY=(bw.camY||0)-dy/(bw.scale||1); bw.focusB=null; } } else { cam.x-=dx/cam.z; cam.y-=dy/cam.z; cam.tx=null; } } }
    else if(ptrs.size===2 && gest && gest.mode==='pinch'){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
      const before=G.ren.toWorld(cx,cy); cam.z=Math.max(0.45,Math.min(2.6,gest.z*d/gest.d)); const after=G.ren.toWorld(cx,cy); cam.x+=before[0]-after[0]; cam.y+=before[1]-after[1];
      cam.x-=(cx-gest.cx)/cam.z; cam.y-=(cy-gest.cy)/cam.z; gest.cx=cx; gest.cy=cy; cam.tx=null; } });
  const up=(e)=>{ const q=ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if(gest&&gest.lp) clearTimeout(gest.lp);
    if(gest&&gest.mode==='box'&&G.bw){ const B=G.bw.box; G.bw.box=null; gest=null;
      if(B&&(Math.abs(B.x1-B.x0)>=16||Math.abs(B.y1-B.y0)>=16)) G.bw.boxSelect(B.x0,B.y0,B.x1,B.y1); else if(q) onTap(q.sx,q.sy);
      return; } if(G.bw&&ptrs.size===0&&G.bw.camDrag!=null){ G.bw.camX=G.bw.camDrag; G.bw.camDrag=null; } if(!q) return; if(gest && gest.mode==='tap' && ptrs.size===0 && performance.now()-gest.t<600) onTap(q.sx,q.sy); if(ptrs.size===0) gest=null; else if(gest&&gest.mode==='pinch') gest={mode:'pan'}; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',(e)=>{ ptrs.delete(e.pointerId); if(gest&&gest.lp) clearTimeout(gest.lp); if(G.bw) G.bw.box=null; gest=null; });
  cv.addEventListener('wheel',(e)=>{ e.preventDefault();
    if(G.bw&&!G.ren){ const p=canvasPos(e); G.bw.zoomAt(G.bw.zoom*Math.exp(-e.deltaY*0.0015), p[0], p[1]); return; }
    if(!G.ren) return; const cam=G.ren.cam; const p=canvasPos(e); const before=G.ren.toWorld(p[0],p[1]); cam.z=Math.max(0.45,Math.min(2.6,cam.z*Math.exp(-e.deltaY*0.0015))); const after=G.ren.toWorld(p[0],p[1]); cam.x+=before[0]-after[0]; cam.y+=before[1]-after[1]; cam.tx=null; },{passive:false});
  document.addEventListener('gesturestart',(e)=>e.preventDefault());
  document.addEventListener('contextmenu',(e)=>e.preventDefault());
  const keys=new Set(); window.addEventListener('keydown',(e)=>{ keys.add(e.key.toLowerCase()); if(e.key==='Escape'&&G.bw&&!G.paused){ bwSetPause(true); return; } if(!G.world||G.paused) return; const k=e.key.toLowerCase();
    if(k===' '){ act('center'); e.preventDefault(); } else if(k==='h') act('hold'); else if(k==='f') act('follow'); else if(k==='g') act('general'); else if(k==='a') act('army'); else if(k==='escape') pause(true); });
  window.addEventListener('keyup',(e)=>keys.delete(e.key.toLowerCase()));
  G.keys=keys;
  document.querySelectorAll('#actions .btn').forEach(b=>b.onclick=(e)=>{ e.stopPropagation(); audio.init(); audio.click(); act(b.dataset.act); });
}
function unitAtScreen(sx,sy){
  const w=G.world, ren=G.ren; const [wx,wy]=ren.toWorld(sx,sy); let best=null, bd=1e9; const P=w.player;
  const r=Math.max(0.75, 22/(TS*ren.cam.z));
  for(const u of w.factions[P].units){ if(u.dead) continue; const cx=(u.px+0.5)*TS, cy=(u.py+0.5)*TS-TS*0.35; const d=Math.hypot(wx-cx,wy-cy)/TS; if(d<r && d<bd){ bd=d; best=u; } }
  return best;
}
function enemyAtScreen(sx,sy){ const w=G.world, ren=G.ren; const [wx,wy]=ren.toWorld(sx,sy); let best=null,bd=1e9; for(const u of w.units){ if(u.dead||u.f===w.player||u.f===NEUTRAL) continue; if(!w.canSee(w.player,u)) continue; const d=Math.hypot(wx-(u.px+0.5)*TS,wy-(u.py+0.5)*TS+TS*0.35)/TS; if(d<0.8&&d<bd){bd=d;best=u;} } return best; }
function onTap(sx,sy){
  if(G.bw){ const bw=G.bw; if(bw.tapScreen(sx,sy)) return; const sc=bw.scale||1; bw.tap(sx/sc+bw.camX, sy/sc+(bw.camY||0)); return; }
  const w=G.world; if(!w||G.paused) return; const ren=G.ren; const now=performance.now();
  if(w.cfg.mini){
    const g=w.factions[w.player].general;
    const e=enemyAtScreen(sx,sy);
    if(e && e.squad && e.squad.flag && !g.dead && w.flaggedNear(g).includes(e.squad)){ if(w.cmdSurrender(g,e.squad)){ toast({text:'🏳️ Persuading surrender... keep the general still for 3s',kind:'flag'}); return; } }
    if(g.dead) return;
    const [wx,wy]=ren.toWorld(sx,sy); const tx=Math.floor(wx/TS), ty=Math.floor(wy/TS); if(!w.inb(tx,ty)) return;
    setSel([g]); const o=w.cmdMove([g],tx,ty); if(o){ ren.markers.push({x:tx,y:ty,t:0}); audio.order(); }
    return;
  }
  const u=unitAtScreen(sx,sy);
  if(u){
    const lt=G.lastTap;
    if(lt && lt.type===u.type && now-lt.t<380 && Math.hypot(sx-lt.x,sy-lt.y)<60){
      if(u.type==='general'){ ren.centerOn(u.x,u.y); }
      else { const all=w.factions[w.player].units.filter(o=>!o.dead&&o.type===u.type); setSel(all,`${UNIT[u.type].emoji} ${UNIT[u.type].name} ×${all.length}`); audio.order(); hint('dbl2','Selected every unit of that type on the map, including off-screen. Tap the ground to give a shared order.',6); }
      G.lastTap=null; return; }
    setSel([u]); audio.click(); G.lastTap={type:u.type,t:now,x:sx,y:sy}; return;
  }
  G.lastTap=null;
  // chiêu hàng bằng chạm vào lính cờ trắng
  const e=enemyAtScreen(sx,sy); const g=w.factions[w.player].general;
  if(e && e.squad && e.squad.flag && !g.dead && w.flaggedNear(g).includes(e.squad)){ if(w.cmdSurrender(g,e.squad)) { toast({text:'🏳️ Persuading surrender... keep the general still for 3s',kind:'flag'}); return; } }
  const us=selUnits().filter(x=>!x.dead);
  const [wx,wy]=ren.toWorld(sx,sy); const tx=Math.floor(wx/TS), ty=Math.floor(wy/TS);
  if(!w.inb(tx,ty)) return;
  if(!us.length){ hint('nosel','Tap your general 👑 or one of your soldiers to select before giving orders',4); G.hints.nosel=0; return; }
  const o=w.cmdMove(us,tx,ty); if(o){ ren.markers.push({x:tx,y:ty,t:0}); audio.order(); if(!w.factions[w.player].explored[ty*w.W+tx]) hint('fogmove','Destination is fogged: each fog tile on the way costs the walker 1 stamina.',6); }
  updateSel();
}
function act(a){
  const w=G.world; if(!w) return; const fac=w.factions[w.player]; const g=fac.general;
  if(a==='general'){ setSel([g]); G.ren.centerOn(g.x,g.y); }
  else if(a==='army'){ const all=fac.units.filter(u=>!u.dead&&u.type!=='general'); if(all.length) setSel(all,`⚔️ All troops ×${all.length}`); }
  else if(a==='hold'){ const us=selUnits(); w.cmdHold(us); if(us.length) toast({text:'🛡️ Hold position'}); }
  else if(a==='follow'){ const us=selUnits(); w.cmdFollow(us.filter(u=>u.type!=='general')); if(us.length) toast({text:'🚩 Follow general'}); }
  else if(a==='explore'){ let us=selUnits().filter(u=>u.type==='scout'); if(!us.length) us=fac.units.filter(u=>!u.dead&&u.type==='scout'); if(!us.length){ toast({text:'No Scouts yet — find and recruit a Scout first',kind:'bad'}); return; } w.cmdExplore(us); toast({text:`🔭 ${us.length} Scouts auto-exploring the fog`}); }
  else if(a==='center'){ if(!g.dead) G.ren.centerOn(g.x,g.y); else G.ren.centerOn(fac.camp.x,fac.camp.y); }
  updateSel();
}

// ---------- bản đồ nhỏ ----------
let mm=null;
function setupMinimap(){ const w=G.world; const cv=$('minimap'); cv.width=w.W; cv.height=w.H; const c=cv.getContext('2d');
  const pal={14:[222,170,80],13:[192,57,43],0:[124,200,95],1:[227,197,141],2:[54,130,60],3:[170,200,106],4:[176,220,128],5:[140,110,76],6:[60,150,220],7:[120,130,140],8:[185,130,80],9:[150,140,130],10:[230,220,200],11:[200,80,80],12:[234,214,160]};
  const base=new Uint8ClampedArray(w.N*4); for(let i=0;i<w.N;i++){ const p=pal[w.t[i]]; base[i*4]=p[0]; base[i*4+1]=p[1]; base[i*4+2]=p[2]; base[i*4+3]=255; }
  mm={cv,c,img:c.createImageData(w.W,w.H),base};
  const go=(e)=>{ const r=cv.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width*w.W, y=(e.clientY-r.top)/r.height*w.H; G.ren.centerOn(Math.floor(x),Math.floor(y),true); };
  cv.onpointerdown=(e)=>{ e.stopPropagation(); try{ cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); }catch(_){} go(e); cv._drag=true; }; cv.onpointermove=(e)=>{ if(cv._drag) go(e); }; cv.onpointerup=()=>cv._drag=false;
}
function drawMinimap(){ const w=G.world; if(!mm) return; const fac=w.factions[w.player]; const d=mm.img.data, b=mm.base, ex=fac.explored, vis=fac.vis, s=fac.visStamp;
  for(let i=0;i<w.N;i++){ const j=i*4; if(!ex[i]){ d[j]=18;d[j+1]=14;d[j+2]=36; } else if(vis[i]===s){ d[j]=b[j];d[j+1]=b[j+1];d[j+2]=b[j+2]; } else { d[j]=b[j]*0.5+20;d[j+1]=b[j+1]*0.5+20;d[j+2]=b[j+2]*0.5+30; } d[j+3]=255; }
  const put=(x,y,r,g,bb,sz)=>{ for(let dy=-sz;dy<=sz;dy++) for(let dx=-sz;dx<=sz;dx++){ const xx=x+dx,yy=y+dy; if(xx<0||yy<0||xx>=w.W||yy>=w.H) continue; const j=(yy*w.W+xx)*4; d[j]=r;d[j+1]=g;d[j+2]=bb; } };
  const hex=(h)=>{ const n=parseInt(h.slice(1),16); return [n>>16,(n>>8)&255,n&255]; };
  for(const [i] of fac.memNeutral){ put(i%w.W,(i/w.W)|0,255,213,74,0); }
  for(const u of w.units){ if(u.dead||u.f===NEUTRAL) continue; if(u.f!==w.player && !w.canSee(w.player,u)) continue; const c=hex(FACTIONS[u.f].color); put(u.x,u.y,c[0],c[1],c[2], u.type==='general'?2:1); }
  const dr=w.drum; const hc= dr.holder>=0? hex(FACTIONS[dr.holder].color):[255,213,74]; put(dr.x,dr.y,hc[0],hc[1],hc[2],2);
  for(const t2 of w.map.towers||[]){ const i=t2.y*w.W+t2.x; if(!fac.explored[i]) continue; const own=fac.towersTaken&&fac.towersTaken.has(i); put(t2.x,t2.y,own?255:200,own?240:170,own?140:90,1); }
  if(w.time<w.pingUntil && (w.time*4|0)%2===0){ for(const f2 of w.factions){ const g2=f2.general; if(g2&&!g2.dead&&f2.id!==w.player){ const c2=hex(f2.def.color); put(g2.x,g2.y,255,255,255,3); put(g2.x,g2.y,c2[0],c2[1],c2[2],2); } } }
  if(w.stormOn){ const scx=w.drum.x, scy=w.drum.y, R2=w.stormR*w.stormR;
    for(let i=0;i<w.N;i++){ const x=i%w.W-scx, y=((i/w.W)|0)-scy; if(x*x+y*y>R2){ const j=i*4; d[j]=d[j]*0.35+55; d[j+1]*=0.3; d[j+2]=d[j+2]*0.35+85; } } }
  for(const fl of w.flags){ const c2= fl.holder>=0? hex(FACTIONS[fl.holder].color):[245,245,245]; put(fl.x,fl.y,c2[0],c2[1],c2[2],1); }
  mm.c.putImageData(mm.img,0,0);
  const ren=G.ren; const [a0,b0]=ren.toWorld(0,0), [a1,b1]=ren.toWorld(ren.vw,ren.vh); mm.c.strokeStyle='#fff'; mm.c.lineWidth=1.5; mm.c.strokeRect(a0/TS,b0/TS,(a1-a0)/TS,(b1-b0)/TS);
}

// ---------- HUD ----------
function fmt(t){ t=Math.max(0,Math.ceil(t)); return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0'); }
function updateHud(){
  const w=G.world, fac=w.factions[w.player], g=fac.general;
  if(w.cfg.mini && !g.dead && !G.sel.has(g.id)){ G.sel.clear(); G.sel.add(g.id); }
  $('troops').textContent=`${fac.count}/${fac.cap}`;
  $('ghp').style.width=(g.dead?0:g.hp/g.maxhp*100)+'%'; $('gst').style.width=(g.stam/g.maxstam*100)+'%'; $('gstt').textContent= g.dead? `respawn ${Math.ceil(g.respawnAt-w.time)}s` : Math.floor(g.stam);
  $('timer').textContent=fmt(w.cfg.timeLimit-w.time); $('timer').style.color = w.cfg.timeLimit-w.time<60? '#ff8080':'#fff';
  const d=w.drum; const hn=w.cfg.drumHold||RULES.drumHold;
  const flagTxt = w.flags.length? ` · 🚩${fac.flagCount||0}/${w.flags.length}` : '';
  const stormTxt = w.stormOn? ' · 🌩️' : '';
  if(d.holder>=0){ const F=FACTIONS[d.holder]; const hf=w.factions[d.holder]; const lack=w.flags.length&&!hf.flagCount;
    $('holder').innerHTML=`<b style="color:${F.light}">${d.holder===w.player?'YOU':F.short}</b> holds the Drum · ${lack?'<b style="color:#fca5a5">missing side flags!</b>':Math.floor(hf.holdStreak)+'/'+hn+'s'}${flagTxt}${stormTxt}`; $('dprog').style.width=(hf.holdStreak/hn*100)+'%'; $('dprog').style.background=F.color; }
  else { $('holder').innerHTML= (d.contested? '⚔️ The Drum is contested!' : 'The Drum is unclaimed')+flagTxt+stormTxt; $('dprog').style.width='0%'; }
  const sc=$('scores'); const sig=w.factions.map(f=>Math.floor(f.holdTotal)).join(','); if(sc._sig!==sig){ sc._sig=sig; sc.innerHTML=w.factions.map(f=>`<span class="chip"><i style="background:${f.def.color}"></i>${f.id===w.player?'You':f.def.short} ${Math.floor(f.holdTotal)}s</span>`).join(''); }
  // nút ngữ cảnh
  const ctx=$('ctx'); const btns=[];
  if(!g.dead && !g.channel){ const near=w.flaggedNear(g); if(near.length){ const sq=near[0]; let n=0; for(const m of sq.members) if(!m.dead) n++; btns.push({k:'sur'+sq.id, html:`🏳️ Persuaded ${n} soldiers`, fn:()=>{ if(w.cmdSurrender(g,sq)) toast({text:'🏳️ Persuading surrender... keep the general still for 3s',kind:'flag'}); }}); } }
  if(g.channel) btns.push({k:'ch', html:`⏳ Persuading ${Math.min(100,Math.floor((w.time-g.channel.t0)/RULES.surrenderChannel*100))}%`, fn:()=>{}});
  if(w.cfg.factions>=8 && fac.campTakenBy>=0 && !fac.eliminated && fac.count<fac.peak*RULES.factionSurrenderRatio && !w.over){
    btns.push({k:'surall', html:'🏳️🏳️ Whole faction surrenders', fn:()=>{ w.factionSurrender(fac, w.factions[fac.campTakenBy]); }});
  }
  const so=w.swapOffer; if(so && w.time-so.t<7 && !so.neutral.dead && so.neutral.f===NEUTRAL) btns.push({k:'swap'+so.neutral.id, html:`🔁 Swapped for ${UNIT[so.neutral.type].emoji} ${UNIT[so.neutral.type].name}`, fn:()=>{ if(w.cmdSwap()) { toast({text:'🔁 Troops swapped',kind:'good'}); audio.recruit(); } }});
  const sig2=btns.map(b=>b.k+b.html).join('|'); if(ctx._sig!==sig2){ ctx._sig=sig2; ctx.innerHTML=''; for(const b of btns){ const el=document.createElement('button'); el.className='btn'; el.innerHTML=b.html; el.onclick=(e)=>{ e.stopPropagation(); audio.init(); b.fn(); }; ctx.appendChild(el); } }
  // trạng thái nút
  const us=selUnits(); const allMode=(m)=>us.length && us.filter(u=>u.type!=='general').length && us.filter(u=>u.type!=='general').every(u=>u.mode===m);
  document.querySelector('[data-act=hold]').classList.toggle('on',!!allMode('hold'));
  document.querySelector('[data-act=follow]').classList.toggle('on',!!allMode('follow'));
  document.querySelector('[data-act=general]').classList.toggle('on',us.length===1&&us[0].type==='general');
  document.querySelector('[data-act=explore]').classList.toggle('on',!!(us.length&&us.every(u=>u.mode==='explore')));
}
function pollEvents(){ const w=G.world; for(const e of w.events){ if(e.f===w.player || e.kind==='bad' || e.kind==='good' || e.kind==='flag' || e.kind==='info') toast(e); } w.events.length=0; }
function tutorial(){ const w=G.world, fac=w.factions[w.player];
  if(w.cfg.mini){ if(fac.count>=3) hint('mini2','Troops attack nearby enemies automatically. Picked-up items are on the right-side buttons.',6); return; }
  if(fac.count>=1) hint('rec1','New soldiers follow the general. DOUBLE-tap a soldier to select its whole unit type.',7);
  if(fac.units.some(u=>u.type==='scout'&&!u.dead)) hint('scout','Scout found! Scouts explore the fog on their own. To steer one, select it and tap the ground; press 🔭 Auto-scout to let it roam.',8);
  if(fac.count>=6) hint('drum','🥁 The War Drum of Chaos is in the center (tap the timer to jump there). Hold the 3×3 arena for 45s straight to win!',7);
  if(fac.towersTaken&&fac.towersTaken.size&&!G.hints.tower2){ G.hints.tower2=1; }
  if(fac.threats&&fac.threats.length) hint('enemy','Enemy within 10 tiles! Nearby soldiers charge in. Counters: Archer → Spearman → Knight → Archer.',8);
  if(fac.general.stam<15) hint('stam','General\'s stamina is low — walking on revealed tiles is free, 1 point regenerates every 10s. Use 🥟 Steamed Bun to recover fast.',7);
}

// ---------- kết quả ----------
function showResult(){
  $('bNext').onclick=()=>startLevel(Math.min(40,(typeof G.level==='number'?G.level:0)+1));
  $('bAgain').onclick=()=>startLevel(G.level);
  $('bRMenu').onclick=()=>{ G.world=null; showScreen('menu'); setupMenus(); };
  const w=G.world, r=w.result, me=w.factions[w.player]; G.resultShown=true;
  const win=r.winner===w.player, draw=r.winner<0; const lvl= typeof G.level==='number'? G.level : 0;
  $('rTitle').textContent= win? '🎉 VICTORY!' : draw? '🤝 DRAW' : '💀 DEFEAT';
  const bk= win? 'ui:win' : (!draw? 'ui:lose':null); if(bk && artOK(bk)) $('rTitle').innerHTML=`<img src="${ArtUrls[bk]}" style="max-width:min(70vw,460px);max-height:max(17vh,96px)">`;
  $('rTitle').style.color= win? '#ffd54a' : draw? '#e5e7eb':'#f87171';
  $('rSub').textContent= r.how==='last'? (win?'Every other faction has been eliminated!':'You have been eliminated') : r.how==='surrender'? (win?'The enemy has surrendered to you!':'Your faction has surrendered') : win? (r.how==='drum'? 'The War Drum of Chaos sounds for your faction!' : 'Time\'s up — you held the Drum the longest!') : draw? 'Factions held the Drum equally' : `${FACTIONS[r.winner].name} claimed the War Drum of Chaos`;
  $('rStats').innerHTML=`<div>⏱️ Time: <b>${fmt(r.time)}</b></div><div>🥁 Drum held: <b>${Math.floor(me.holdTotal)}s</b></div><div>➕ Recruited: <b>${me.stats.recruited}</b></div><div>🏳️ Converted: <b>${me.stats.converted}</b></div><div>⚔️ Kills: <b>${me.stats.kills}</b></div><div>🌫️ Tiles revealed: <b>${me.stats.opened}</b></div>`;
  $('bNext').classList.toggle('hidden',!win || !lvl || lvl>=40);
  const xu=coinK(15+me.stats.recruited+2*me.stats.kills+4*me.stats.converted+me.holdTotal/3+me.stats.opened/10+(win?40+5*(lvl||2):0)+(draw?15:0));
  save.xu=(save.xu||0)+xu; Save.set(save); $('rXu').innerHTML=`${artIcon('ui:coin','🪙')} +<b>${xu}</b> Meme Coins · total <b>${save.xu}</b>`; refreshXu();
  if(win){ if(lvl){ if(!save.done.includes(lvl)) save.done.push(lvl); save.max=Math.max(save.max||1,lvl+1); } Save.set(save); audio.win(); confetti(); } else audio.lose();
  $('result').classList.remove('hidden'); $('hud').classList.add('hidden');
}
function confetti(){ const ren=G.ren; const cam=ren.cam; for(let i=0;i<160;i++){ const x=cam.x+(Math.random()-0.5)*ren.vw/cam.z, y=cam.y-ren.vh/cam.z*0.5-Math.random()*200; ren.addPart({x,y,vx:(Math.random()-0.5)*80,vy:40+Math.random()*80,g:60,life:0,max:3+Math.random()*2,size:4+Math.random()*3,col:['#ffd54a','#ff6b6b','#60a5fa','#4ade80','#f472b6','#fff'][(Math.random()*6)|0],kind:'shard'}); } }

// ---------- menu ----------
function pause(on){ if(!G.world&&!G.bw) return; G.paused=on; $('pause').classList.toggle('hidden',!on);
  if(G.bw){ $('bRestart').style.display = G.bw.cfg&&G.bw.cfg.p2p? 'none':''; } }
function bwSetPause(on){ // P2P: dừng là dừng CẢ HAI MÁY
  if(G.bw&&G.bw.cfg&&G.bw.cfg.p2p&&typeof P2P!=='undefined'&&P2P.connected){ P2P.setPause(on); pause(on); }
  else pause(on); }
function showScreen(id){ ['menu','levels','help','pause','result','forge','gear','decor','tutDone','artscr','p2p','gens'].forEach(s=>$(s).classList.toggle('hidden',s!==id)); if(id==='menu'||id==='levels'||id==='forge'||id==='gear'||id==='artscr'||id==='gens') $('hud').classList.add('hidden'); }
function buildLevels(){ const grid=$('lvgrid'); grid.innerHTML=''; const max=Math.max(1,save.max||1);
  for(let L=1;L<=100;L++){ const b=document.createElement('button'); b.className='btn lv'; b.textContent=L; const avail=L<=40 && L<=max; if(save.done.includes(L)) b.classList.add('done'); if(!avail){ b.classList.add('lock'); b.textContent= L>40? '🔒' : '🔒'+L; b.title= L>40?'12-faction mode in development':'Win the previous stage to unlock'; }
    b.onclick=()=>{ audio.init(); if(avail) startLevel(L); }; grid.appendChild(b); } }
let menuAnim=null;
function menuBg(){ const cv=$('menuBg'); const c=cv.getContext('2d'); const walkers=[]; const types=['general','scout','archer','spear','cavalry','shield','saber','swordsman','crossbow','medic','assassin'];
  for(let i=0;i<14;i++) walkers.push({x:Math.random(),row:i%3,t:types[i%types.length],f:i%4,sp:0.03+Math.random()*0.03,ph:Math.random()*6});
  const loop=(tm)=>{ if($('menu').classList.contains('hidden') && $('levels').classList.contains('hidden') && $('help').classList.contains('hidden')){ menuAnim=requestAnimationFrame(loop); return; }
    if(tm-(loop._t||0)<31.5){ menuAnim=requestAnimationFrame(loop); return; } const mdt=Math.min(0.1,(tm-(loop._t||tm))/1000); loop._t=tm;   /* màn menu chỉ cần 30 khung/giây */
    const dpr=Math.min(G.dprCap||PACE.MAX,devicePixelRatio||1); const W=cv.clientWidth, H=cv.clientHeight; if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
    c.setTransform(dpr,0,0,dpr,0,0); const bgi=ArtImages['ui:menubg']; if(bgi){ const k=Math.max(W/bgi.width,H/bgi.height); c.drawImage(bgi,(W-bgi.width*k)/2,(H-bgi.height*k)/2,bgi.width*k,bgi.height*k); c.fillStyle='rgba(10,6,25,0.25)'; c.fillRect(0,0,W,H); menuAnim=requestAnimationFrame(loop); return; }
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2b1b55'); g.addColorStop(0.55,'#6a3f8f'); g.addColorStop(0.56,'#5fb04c'); g.addColorStop(1,'#3f8a3a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    // mặt trời & núi
    c.fillStyle='rgba(255,200,90,0.9)'; c.beginPath(); c.arc(W*0.78,H*0.32,Math.min(W,H)*0.09,0,7); c.fill();
    c.fillStyle='#4a2f6e'; c.beginPath(); c.moveTo(0,H*0.56); for(let k=0;k<=10;k++) c.lineTo(W*k/10,H*(0.42+((k*37)%7)/60)); c.lineTo(W,H*0.56); c.fill();
    const s=tm/1000; for(const w of walkers){ w.x+=w.sp*mdt; if(w.x>1.1) w.x=-0.1; const y=H*(0.66+w.row*0.1); const sz=Math.min(W,H)*0.16*(0.8+w.row*0.15); const spr=makeUnitSprite(w.t,w.f); const b=-Math.abs(Math.sin(s*10+w.ph))*6;
      c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(w.x*W,y+sz*0.42,sz*0.25,sz*0.07,0,0,7); c.fill(); c.drawImage(spr,w.x*W-sz/2,y-sz/2+b,sz,sz); }
    c.fillStyle='rgba(10,6,25,0.35)'; c.fillRect(0,0,W,H);
    menuAnim=requestAnimationFrame(loop); };
  menuAnim=requestAnimationFrame(loop); }
function setupMenus(){
  const max=Math.max(1,Math.min(40,save.max||1)); $('bPlay').textContent= max>1? `▶ Play Stage ${max}` : '▶ Play Stage 1';
  $('bPlay').onclick=()=>{ audio.init(); startLevel(Math.max(1,Math.min(40,save.max||1))); };
  $('bMini').onclick=()=>{ audio.init(); startLevel('mini'); };
  $('bBW').onclick=()=>{ audio.init(); if(needTut()){ startTutorial(); return; } refreshContinue(); $('bossPick').classList.remove('hidden'); };
  $('bTut').onclick=()=>{ audio.init(); startTutorial(); };
  { const cl=campCleared(), cur=Math.min(CAMP_N,cl+1); $('bBoss1v1').innerHTML= cl>=CAMP_N? '⚔️ 1 vs 1 CAMPAIGN<br><small>👑 All 10 stages cleared — replay any stage</small>' : `⚔️ 1 vs 1 CAMPAIGN<br><small>Stage ${cur} of ${CAMP_N} · ${cl} cleared</small>`; }
  $('bBoss1v1').onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); Campaign.open(); };
  $('bBossRoyale').onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); Conquest.open(); };   /* (5.7) Quần Hùng → CHINH PHẠT: Bộ lạc → Nội chiến → Đại chiến */
  try{ const cq=save.conq, st=cq? Math.min(3,cq.stage|0) : 0; $('bBossRoyale').innerHTML= !cq? '🌏 CONQUEST — Tribes → Civil War → Great War<br><small>Choose a nation and unite the world (auto-save)</small>' : st>=3? '🌏 CONQUEST<br><small>👑 The world is yours — start a new conquest</small>' : `🌏 CONQUEST<br><small>${BW_CIV[cq.civ]? BW_CIV[cq.civ].icon+' '+BW_CIV[cq.civ].name+' · ' : ''}Stage ${st+1}/3: ${BW_CONQ[BW_CONQ_ORDER[st]].name}</small>`; }catch(e){}   /* bảng Chinh phạt nạp sau (src/09j): dựng lại menu ở cuối tệp đó */
  const refreshContinue=()=>{ const sv=royaleLoadInfo(), bc=$('bBossContinue');
    if(bc){ if(sv){ const d=new Date(sv.savedAt), nat=new Set(sv.nodes.filter(n=>n.camp&&n.owner!==2).map(n=>n.owner)).size, mm=Math.floor((sv.sc.time||0)/60);
        let cq=null; try{ cq=BW_CONQ[sv.cfg.conq]; }catch(e){} bc.style.display=''; bc.innerHTML=`▶ CONTINUE ${cq? 'CONQUEST' : 'WARLORDS'}<br><small>${cq? cq.icon+' '+cq.name+' · '+(sv.cfg.asc? '★'+sv.cfg.asc+' · ' : '') : ''}${DIFF_N[sv.cfg.diff==null?1:sv.cfg.diff]} · ${nat} ${cq? cq.unit : 'nations'} · played ${mm} min · saved ${d.toLocaleString('en-US',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</small>`;
        bc.onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); royaleResume(); }; }
      else bc.style.display='none'; }
    const ss=soloLoadInfo(), sc=$('bSoloContinue'); if(sc){ if(ss){ sc.style.display=''; sc.innerHTML= ss.cfg&&ss.cfg.endless? `▶ CONTINUE ∞ ENDLESS ${ss.cfg.endless}<br><small>${(()=>{ try{ return (ss.cfg.mut||[]).map(m=>BW_MUT[m]? BW_MUT[m].icon+' '+BW_MUT[m].name : '').join(' · '); }catch(e){ return ''; } })()} · played ${Math.floor((ss.sc.time||0)/60)} min</small>` : `▶ CONTINUE STAGE ${ss.lv}<br><small>${stageName(ss.lv)} · played ${Math.floor((ss.sc.time||0)/60)} min</small>`; sc.onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); soloResume(); }; } else sc.style.display='none'; } }; refreshContinue();
  $('bBossClose').onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); };
  $('bP2P').onclick=()=>{ audio.init(); P2P.open(); };
  $('bFull').onclick=()=>{ audio.init(); audio.click(); goFullscreen(); };
  $('bwFull').onclick=(e)=>{ e.stopPropagation(); audio.click(); goFullscreen(); };
  const leave=()=>{ if(G.bw&&G.bw.cfg&&G.bw.cfg.p2p&&typeof P2P!=='undefined') P2P.drop('Your opponent left the match.'); G.paused=false; $('pause').classList.add('hidden'); stopBigWar(true); };
  $('bwBack').onclick=()=>{ audio.click(); const bw=G.bw; if(!bw){ stopBigWar(true); return; }
    if(bw.over){ leave(); return; }
    if(bw.royale&&!(bw.cfg&&bw.cfg.p2p)){ leave(); toast('💾 Warlords game saved — tap BATTLE → CONTINUE to resume',3); return; } // Quần Hùng tự lưu: thoát không mất gì
    ask(bw.cfg&&bw.cfg.p2p? 'Leave the 2-player match?' : 'Leave this battle?', bw.cfg&&bw.cfg.p2p? 'Your opponent will be disconnected.' : 'Progress in this battle will be lost.', '🏠 Leave', leave); };
  $('bwPause').onclick=(e)=>{ e.stopPropagation(); audio.click(); bwSetPause(true); };
  $('bwRetry').onclick=()=>{ audio.click(); const bw=G.bw; if(!bw) return;
    if(bw.cfg&&bw.cfg.p2p){ toast('↻ Restart is not available in a 2-player match',2.5); return; }
    ask(bw.royale? 'Restart Warlords from the beginning?' : 'Restart this battle?', bw.royale? 'Your current conquest will be lost.' : 'Progress in this battle will be lost.', '↻ Restart', bwRestart); };
  $('bLevels').onclick=()=>{ audio.init(); buildLevels(); showScreen('levels'); };
  $('bHelp').onclick=()=>{ audio.init(); G.helpFrom='menu'; showScreen('help'); };
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{ const arm=['forge','gear','decor','gens'], inArm=arm.some(i=>!$(i).classList.contains('hidden')); if(inArm && G.forgeFrom==='campaign'){ arm.forEach(i=>$(i).classList.add('hidden')); Campaign.open(); return; } if(inArm && G.forgeFrom==='result'){ arm.forEach(i=>$(i).classList.add('hidden')); $('result').classList.remove('hidden'); return; } if(G.helpFrom==='pause'){ G.helpFrom=null; $('help').classList.add('hidden'); $('pause').classList.remove('hidden'); } else showScreen('menu'); });
  $('tc').onclick=()=>{ if(G.world&&G.ren){ const d=G.world.drum; G.ren.centerOn(d.x,d.y); } };
  $('bPause').onclick=()=>{ audio.init(); pause(true); };
  $('bResume').onclick=()=>bwSetPause(false);
  $('bRestart').onclick=()=>{ if(G.bw){ const bw=G.bw; if(bw.royale&&!bw.over){ ask('Restart Warlords from the beginning?','Your current conquest will be lost.','↻ Restart',()=>{ pause(false); bwRestart(); }); return; } pause(false); bwRestart(); } else startLevel(G.level); };
  $('bPHelp').onclick=()=>{ G.helpFrom='pause'; $('pause').classList.add('hidden'); $('help').classList.remove('hidden'); };
  $('bMenu').onclick=()=>{ if(G.bw){ const bw=G.bw; if(bw.over||(bw.royale&&!(bw.cfg&&bw.cfg.p2p)&&!(bw.cfg&&bw.cfg.chal))){ leave(); return; }
      ask(bw.cfg&&bw.cfg.p2p? 'Leave the 2-player match?' : 'Leave this battle?', bw.cfg&&bw.cfg.p2p? 'Your opponent will be disconnected.' : 'Progress in this battle will be lost.', '🏠 Leave', leave); return; }
    G.world=null; G.paused=true; showScreen('menu'); setupMenus(); };
  $('bAgain').onclick=()=>startLevel(G.level);
  $('bNext').onclick=()=>startLevel(Math.min(40,(typeof G.level==='number'?G.level:0)+1));
  $('bForge').onclick=()=>{ audio.init(); G.forgeFrom='menu'; openForge(); };
  $('bRForge').onclick=()=>{ audio.init(); audio.click(); G.forgeFrom='result'; $('result').classList.add('hidden'); renderGear(); $('gear').classList.remove('hidden'); };   // 🪙 Armory từ màn kết quả
  $('bGear').onclick=()=>{ audio.init(); audio.click(); G.forgeFrom='menu'; openGear(); };
  $('bAch').onclick=()=>{ audio.init(); audio.click(); $('menu').classList.add('hidden'); Ach.open(); };   /* 🏆 (6.0) */
  $('bChal').onclick=()=>{ audio.click(); $('bossPick').classList.add('hidden'); Chal.open(); };   /* 📅 (6.0) */
  const armTab=(id)=>{ audio.click(); ['gear','forge','decor','gens'].forEach(s=>$(s).classList.toggle('hidden',s!==id)); if(id==='gear') renderGear(); else if(id==='forge') renderForge(); else if(id==='gens') renderGens(); else renderDecor(); };
  document.querySelectorAll('[data-armtab]').forEach(b=>{ if(!b.disabled) b.onclick=()=>armTab(b.dataset.armtab); });   /* 🎖️ (6.0) thẻ Tướng lĩnh trong Kho */
  $('bToDecor').onclick=()=>armTab('decor'); $('bToDecor2').onclick=()=>armTab('decor'); $('bDecGear').onclick=()=>armTab('gear'); $('bDecForge').onclick=()=>armTab('forge');
  $('bToForge').onclick=()=>{ audio.click(); $('gear').classList.add('hidden'); renderForge(); $('forge').classList.remove('hidden'); };
  $('bToGear').onclick=()=>{ audio.click(); $('forge').classList.add('hidden'); renderGear(); $('gear').classList.remove('hidden'); };
  $('bArt').onclick=()=>{ audio.init(); renderArtGrid(); showScreen('artscr'); };
  $('artInput').onchange=async(e)=>{ const files=[...e.target.files]; if(!files.length) return; $('artMsg').textContent=`Processing ${files.length} images...`; const r=await importArtFiles(files); $('artMsg').innerHTML=`✅ Loaded ${r.done.length} images: ${r.done.map(a=>a.code).join(', ')}${r.skip.length?`<br>⚠️ Unrecognized names: ${r.skip.join(', ')} — name files by code, e.g. U04.png`:''}`; e.target.value=''; renderArtGrid(); };
  $('bArtClear').onclick=async()=>{ await ArtDB.clear(); for(const k in ArtImages){ if(ArtImages[k]._user) delete ArtImages[k]; } await loadArt(); renderArtGrid(); $('artMsg').textContent='Loaded art cleared — the game is back to code-drawn graphics.'; };
  $('bRMenu').onclick=()=>{ G.world=null; showScreen('menu'); setupMenus(); };
  $('bSound').onclick=()=>{ audio.init(); audio.on=!audio.on; $('bSound').textContent=audio.on?'🔊':'🔇'; };
  /* 🔊 bật/tắt tiếng (menu chính + màn tạm dừng), nhớ lựa chọn cho lần mở game sau */
  audio.on=!save.mute; sndSync();
  document.querySelectorAll('.sndBtn').forEach(b=>b.onclick=()=>{ audio.init(); audio.on=!audio.on; save.mute=!audio.on; Save.set(save); sndSync(); if(audio.on) audio.click(); });
  $('bSpeed').onclick=()=>{ G.speed= G.speed===1?2: G.speed===2?3:1; $('bSpeed').textContent='x'+G.speed; };
}

// ---------- Lò rèn tướng ----------
function sndSync(){ document.querySelectorAll('.sndLbl').forEach(e=>e.textContent='Sound: '+(audio.on?'On':'Off')); document.querySelectorAll('.sndBtn').forEach(b=>b.classList.toggle('off',!audio.on)); }
function refreshXu(){ document.querySelectorAll('.xu').forEach(e=>e.textContent=save.xu||0); }
function artIcon(key,fallback,cls){ const u=ArtUrls[key]; return u? `<img class="${cls||"aic"}" src="${u}" alt="">` : fallback; }
function openForge(){ renderForge(); showScreen('forge'); }
function renderForge(){
  refreshXu(); const up=save.up; const list=$('forgeList'); list.innerHTML='';
  for(const U of UPGRADES){ const l=up[U.key]||0; const maxed=l>=U.max; const cost=maxed?0:upgradeCost(U,l);
    const iconKey = U.key==='weapon'? 'weapon:'+Math.min(5,l+(maxed?0:1)) : 'up:'+U.key; const fb = U.key==='weapon'? WEAPONS[Math.min(5,maxed?l:l+1)].emoji : U.emoji;
    const d=document.createElement('div'); d.className='fcard';
    d.innerHTML=`<div class="fi">${artIcon(iconKey,fb)}</div><div class="fb"><div class="fn">${U.name}</div><div class="pips">${Array.from({length:U.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div><div class="fd">${maxed? U.desc(l) : (l? `<span style="opacity:.7">${U.desc(l)}</span><br>` : '')+`➜ <b>${U.desc(l+1)}</b>`}</div></div>`;
    const b=document.createElement('button'); b.className='btn'; b.innerHTML= maxed? 'Max' : `${artIcon('ui:coin','🪙')} ${cost}`; b.disabled= maxed || (save.xu||0)<cost;
    b.onclick=()=>{ if((save.xu||0)<cost||maxed) return; save.xu-=cost; up[U.key]=l+1; Save.set(save); audio.init(); audio.fanfare(); SpriteCache.clear(); renderForge(); };
    d.appendChild(b); list.appendChild(d); }
  { const W=WEAPONS[up.weapon||0], F=BW.forge, pc=(x)=>'+'+(Math.round(x*1000)/10)+'%';
    const cur=up.weapon||0, lad=WEAPONS.map((w,i)=>`<span class="wl ${i<cur?'on':i===cur?'cur':'lock'}" title="${w.name}">${artIcon('weapon:'+i,w.emoji)}</span>`).join('<i>›</i>');   /* thang 6 vũ khí: đã rèn sáng, chưa rèn mờ */
    $('forgeStats').innerHTML=`<b>Your nation's bonuses</b> · ⚔️ ${W.name}<div class="wladder">${lad}</div>💥 Damage <b>${pc((1+F.power*(up.power||0))*(1+F.weapon*(up.weapon||0))-1)}</b> · 👟 March <b>${pc(F.speed*(up.speed||0))}</b><br>🛡️ Strongholds <b>${pc(F.armor*(up.armor||0))}</b> · 🌾 Supply <b>${pc(F.stamina*(up.stamina||0))}</b> · 📯 Recruiting <b>${pc(F.aura*(up.aura||0))}</b>`; }
  const hc=$('forgeHero').getContext('2d'); hc.clearRect(0,0,220,220); hc.drawImage(makeUnitSprite('general',0,up.weapon||0),0,0,220,220);
}

// ---------- 🎒 Quân nhu: mua bằng xu, chọn tối đa 3 món mang vào trận ----------
function openGear(){ renderGear(); showScreen('gear'); }
// 🏮 (5.5) TRANG TRÍ TRẠI: mua một lần bằng xu, bật/tắt tuỳ thích; bản xem trước vẽ đúng như trong trận
function decorState(){ const d=save.decor||(save.decor={own:{},on:[]}); if(!d.own) d.own={}; if(!Array.isArray(d.on)) d.on=[]; BW.ascStars=save.ascMax|0; if(BW.ascStars>0&&!d.own.ascflag){ d.own.ascflag=1; d.on.push('ascflag'); }   /* 🚩 (5.9) cờ Thăng Thiên: tự có khi qua ★ đầu tiên */ d.on=d.on.filter(id=>d.own[id]&&BW_DECOR_BY[id]&&BW.decorAvail(BW_DECOR_BY[id])); return d; }
function renderDecor(){ refreshXu(); const D=decorState(), list=$('decList'); list.innerHTML=''; $('decOn').textContent=`On: ${D.on.length}/${BW_DECOR.filter(BW.decorAvail).length}.`;
  for(const it of BW_DECOR.filter(BW.decorAvail).slice().sort((a,b)=>a.cost-b.cost)){ const own=!!D.own[it.id], on=D.on.includes(it.id), d=document.createElement('div'); d.className='fcard'+(on?' on':''); d.dataset.decor=it.id;
    d.innerHTML=`<div class="fi">${it.img&&ArtUrls[it.img]? `<img src="${ArtUrls[it.img]}" alt="" style="width:100%;height:100%;object-fit:contain">` : it.emoji}</div><div class="fb"><div class="fn">${it.name}${own? '<span class="own">owned</span>' : ''}</div><div class="fd">${it.desc}</div></div>`;
    const b=document.createElement('button'); b.className='btn'; b.dataset.dec=it.id;
    if(!own&&it.earn){ b.innerHTML='🔒 ★1'; b.disabled=true; }   /* không bán: thắng Đại chiến để mở ★ Thăng Thiên */
    else if(!own){ b.innerHTML=`${artIcon('ui:coin','🪙')} ${it.cost}`; b.disabled=(save.xu||0)<it.cost; b.onclick=()=>{ if((save.xu||0)<it.cost) return; save.xu-=it.cost; D.own[it.id]=1; D.on.push(it.id); Save.set(save); audio.coin&&audio.coin(); renderDecor(); }; }
    else { b.textContent= on? '✔ On' : 'Off'; if(on) b.style.background='linear-gradient(#c8f7c5,#4ade80)'; b.onclick=()=>{ audio.click(); const i=D.on.indexOf(it.id); if(i>=0) D.on.splice(i,1); else D.on.push(it.id); Save.set(save); renderDecor(); }; }
    d.appendChild(b); d.onmouseenter=()=>{ G.decHover=it.id; }; d.onmouseleave=()=>{ G.decHover=null; }; d.addEventListener('touchstart',()=>{ G.decHover=it.id; clearTimeout(G._dhT); G._dhT=setTimeout(()=>{ G.decHover=null; },2500); },{passive:true}); list.appendChild(d); }
  if(!G._decLoop){ G._decLoop=true; const tick=()=>{ if($('decor').classList.contains('hidden')){ G._decLoop=false; return; } drawDecorPreview(); requestAnimationFrame(tick); }; requestAnimationFrame(tick); } }
function drawDecorPreview(){ const cv=$('decPrev'), c=cv.getContext('2d'), D=decorState(), ids=D.on.slice(); if(G.decHover&&!ids.includes(G.decHover)) ids.push(G.decHover);   /* chạm/rê vào món chưa mua: xem thử */
  c.clearRect(0,0,cv.width,cv.height); c.save(); c.scale(0.9,0.9); const x=255, y=300, t=performance.now()/1000;
  BW.drawDecor(c,x,y,ids,t,0); c.fillStyle='rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x,y+46,95,26,0,0,7); c.fill();
  const im=ArtImages['prop:tent']; if(im){ c.drawImage(recolorUnit(im,0),x-95,y-110,190,190); } else { c.fillStyle='#3b82f6'; c.strokeStyle='#2a1a12'; c.lineWidth=5; c.beginPath(); c.moveTo(x-85,y+45); c.lineTo(x,y-75); c.lineTo(x+85,y+45); c.closePath(); c.fill(); c.stroke(); }
  BW.drawDecor(c,x,y,ids,t,1); c.restore(); }
// 🎖️ (6.0) TƯỚNG LĨNH: chiêu mộ bằng xu, chọn mang 1 (mở thêm ô thứ 2) — lên cấp qua các trận
function genState(){ const g=save.gen||(save.gen={own:{},on:[],slot2:0}); if(!g.own) g.own={}; if(!Array.isArray(g.on)) g.on=[]; g.on=g.on.filter(id=>BW_GEN_BY[id]&&g.own[id]!=null).slice(0,g.slot2? 2 : 1); return g; }
function genPack(){ const g=genState(); return g.on.map(id=>({id,lv:BW.genLevel(g.own[id])})); }
const GEN_IMG={};
function genPortrait(D,sz){ const k=D.id+':'+sz; if(GEN_IMG[k]) return GEN_IMG[k]; const c=document.createElement('canvas'); c.width=c.height=sz; const x=c.getContext('2d');
  x.fillStyle=D.col; x.beginPath(); x.arc(sz/2,sz/2,sz/2,0,7); x.fill(); x.fillStyle='rgba(255,255,255,0.25)'; x.beginPath(); x.arc(sz/2,sz*0.38,sz*0.42,0,7); x.fill();
  try{ x.save(); x.beginPath(); x.arc(sz/2,sz/2,sz/2-2,0,7); x.clip(); x.drawImage(makeUnitSprite('general',0,D.w),-sz*0.18,-sz*0.02,sz*1.36,sz*1.36); x.restore(); }catch(e){}
  x.font=`${Math.round(sz*0.34)}px system-ui`; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#fff'; x.beginPath(); x.fillStyle='rgba(20,12,36,.85)'; x.arc(sz*0.8,sz*0.8,sz*0.2,0,7); x.fill(); x.fillStyle='#fff'; x.fillText(D.icon,sz*0.8,sz*0.82);
  x.strokeStyle='#2a1a12'; x.lineWidth=3; x.beginPath(); x.arc(sz/2,sz/2,sz/2-1.5,0,7); x.stroke(); return GEN_IMG[k]=c.toDataURL(); }
function renderGens(){ refreshXu(); const g=genState(), list=$('genList'), MAX=g.slot2? 2 : 1; list.innerHTML='';
  $('genSlots').textContent=`Bringing ${g.on.length}/${MAX}.`;
  if(!g.slot2){ const d=document.createElement('div'); d.className='fcard'; d.dataset.gen='slot2'; d.innerHTML=`<div class="fi">🎖️</div><div class="fb"><div class="fn">Second general slot</div><div class="fd">Bring two generals into every battle — both talents work together.</div></div>`;
    const b=document.createElement('button'); b.className='btn'; b.dataset.genbuy='slot2'; b.innerHTML=`${artIcon('ui:coin','🪙')} ${BW.genSlot2}`; b.disabled=(save.xu||0)<BW.genSlot2;
    b.onclick=()=>{ if((save.xu||0)<BW.genSlot2) return; save.xu-=BW.genSlot2; g.slot2=1; Save.set(save); audio.fanfare&&audio.fanfare(); achCheck(); renderGens(); }; d.appendChild(b); list.appendChild(d); }
  for(const D of BW_GENERALS){ const own=g.own[D.id]!=null, xp=g.own[D.id]|0, lv=BW.genLevel(xp), on=g.on.includes(D.id), d=document.createElement('div'); d.className='fcard'+(on?' on':''); d.dataset.gen=D.id;
    const nx=BW.genXP[lv]||null, p0=BW.genXP[lv-1]||0, bar= own? (nx? Math.round((xp-p0)/(nx-p0)*100) : 100) : 0;
    d.innerHTML=`<img class="gport" src="${genPortrait(D,128)}" alt=""><div class="fb"><div class="fn">${D.name}${own? `<span class="gtag">Lv ${lv}${lv>=5?' · MAX':''}</span>` : ''}</div><div class="fd"><b>${D.icon} ${D.skill}:</b> ${D.desc(D.val(own? lv : 1),own? lv : 1)}${own&&lv<5? ` <span style="opacity:.7">(Lv ${lv+1}: ${D.desc(D.val(lv+1),lv+1)})</span>` : ''}</div>${own? `<div class="gxp"><i style="width:${bar}%"></i></div><div class="fd" style="opacity:.75">XP ${xp}${nx? ' / '+nx : ''}</div>` : ''}</div>`;
    const b=document.createElement('button'); b.className='btn'+(on?' on':''); b.dataset.genbtn=D.id;
    if(!own){ b.innerHTML=`${artIcon('ui:coin','🪙')} ${D.cost}`; b.disabled=(save.xu||0)<D.cost; b.onclick=()=>{ if((save.xu||0)<D.cost) return; save.xu-=D.cost; g.own[D.id]=0; if(g.on.length<MAX) g.on.push(D.id); Save.set(save); audio.fanfare&&audio.fanfare(); achCheck(); renderGens(); }; }
    else { b.textContent= on? '✔ Bringing' : 'Bring'; b.disabled= !on&&g.on.length>=MAX&&MAX>1; b.onclick=()=>{ audio.click(); const i=g.on.indexOf(D.id); if(i>=0) g.on.splice(i,1); else { if(g.on.length>=MAX) g.on.shift(); g.on.push(D.id); } Save.set(save); renderGens(); }; }
    d.appendChild(b); list.appendChild(d); } }
// sau mỗi trận: tướng mang theo nhận kinh nghiệm (thắng +3, thua +1); trả về dòng báo lên cấp
function genAward(bw,win){ if(!bw||!bw.gens||!bw.gens.length) return []; const g=genState(), out=[];
  for(const x of bw.gens){ if(g.own[x.id]==null) continue; const a=BW.genLevel(g.own[x.id]); g.own[x.id]=(g.own[x.id]|0)+(win? 3 : 1); const b=BW.genLevel(g.own[x.id]); if(b>a) out.push(`🎖️ ${BW_GEN_BY[x.id].name} reached level ${b}!`); }
  Save.set(save); return out; }
// 🎓 (5.5) HƯỚNG DẪN LẦN ĐẦU
function needTut(){ try{ if(localStorage.getItem('ltm_tut')==='1') return false; }catch(e){ return false; } if((save.bwMax||1)>1||save.tut||soloLoadInfo()||royaleLoadInfo()){ tutMark(); return false; } return true; }   /* người chơi cũ (đã qua ải / đang có ván lưu): không bắt học lại */
function tutMark(){ save.tut=1; Save.set(save); try{ localStorage.setItem('ltm_tut','1'); }catch(e){} }
function startTutorial(){ G.bwCfg={civ:save.civ||'rome',map:0,tut:true}; G.tutShown=false; startBigWar(1); $('stageIntro').classList.add('hidden'); G.bw.tutStart(); }
const BW_TUT_XU=coinK(50);   /* thưởng học xong hướng dẫn (~15% của 50) */
function tutFinish(){ const bw=G.bw, skipped=!!(bw&&bw.tut&&bw.tut.skipped), first=!save.tut; G.tutShown=true; tutMark(); if(!skipped&&first){ save.xu=(save.xu||0)+BW_TUT_XU; Save.set(save); refreshXu(); }
  stopBigWar(true); $('menu').classList.add('hidden'); $('tdTitle').textContent= skipped? '🎓 Tutorial skipped' : '🎓 Tutorial complete!';
  $('tdText').innerHTML= skipped? 'You can replay it any time from <b>📖 How to play</b>.' : (first? `You earned <b>🪙 ${BW_TUT_XU} coins</b>. ` : '')+'Now take on the 10-stage campaign — each boss is smarter than the last.';
  $('tutDone').classList.remove('hidden'); const t0=performance.now(), ghost=()=>performance.now()-t0<500;   /* cú chạm 'Got it' trên màn trận còn sinh một 'click' rơi đúng vào nút của thẻ này: bỏ qua 0,5 s đầu */
  $('tdGo').onclick=()=>{ if(ghost()) return; audio.click(); $('tutDone').classList.add('hidden'); Campaign.open(); }; $('tdMenu').onclick=()=>{ if(ghost()) return; audio.click(); $('tutDone').classList.add('hidden'); $('menu').classList.remove('hidden'); setupMenus(); }; }
function renderGear(){ refreshXu(); const inv=save.inv, pack=save.pack, list=$('gearList'), MAX=BW.gear.slots; list.innerHTML='';
  for(let i=pack.length-1;i>=0;i--){ if(!BW_GEAR_BY[pack[i]]) pack.splice(i,1); }
  $('gearPack').textContent=`Packed: ${pack.length}/${MAX}.`;
  for(const D of BW_GEAR){ const have=inv[D.id]||0, on=pack.includes(D.id);
    const d=document.createElement('div'); d.className='fcard'+(on?' on':''); d.dataset.gear=D.id;
    d.innerHTML=`<div class="fi">${artIcon('item:'+D.id,D.emoji)}</div><div class="fb"><div class="fn">${D.name}<span class="own">×${have}</span></div><div class="fd">${D.desc}</div></div>`;
    const col=document.createElement('div'); col.className='gbtns';
    const bBuy=document.createElement('button'); bBuy.className='btn'; bBuy.dataset.buy=D.id; bBuy.innerHTML=`${artIcon('ui:coin','🪙')} ${D.cost}`; bBuy.disabled=(save.xu||0)<D.cost||have>=99;
    bBuy.onclick=()=>{ if((save.xu||0)<D.cost||(inv[D.id]||0)>=99) return; save.xu-=D.cost; inv[D.id]=(inv[D.id]||0)+1; if(!pack.includes(D.id)&&pack.length<MAX) pack.push(D.id); Save.set(save); audio.init(); audio.pickup(); renderGear(); };
    const bPack=document.createElement('button'); bPack.className='btn'+(on?' on':''); bPack.dataset.pack=D.id; bPack.textContent= on? '✔ Packed' : 'Pack'; bPack.disabled= !on&&(have<=0||pack.length>=MAX);
    bPack.onclick=()=>{ const i=pack.indexOf(D.id); if(i>=0) pack.splice(i,1); else if((inv[D.id]||0)>0&&pack.length<MAX) pack.push(D.id); Save.set(save); audio.init(); audio.click(); renderGear(); };
    col.appendChild(bBuy); col.appendChild(bPack); d.appendChild(col); list.appendChild(d); } }

// ---------- Bộ art ----------
function renderArtGrid(){
  const grid=$('artGrid'); grid.innerHTML=''; let have=0; const groups={U:'Characters',W:'General\'s weapon',I:'Items',T:'Terrain tiles',P:'Map props',G:'Interface'}; let last='';
  for(const a of ART_LIST){ const g=a.code[0]; if(g!==last){ last=g; const h=document.createElement('div'); h.className='agroup'; h.textContent=groups[g]; grid.appendChild(h); }
    const ok=!!ArtImages[a.key]; if(ok) have++; const d=document.createElement('div'); d.className='acell'+(ok?' ok':'');
    d.innerHTML=`<div class="th">${ok?`<img src="${ArtUrls[a.key]}">`:'—'}</div><b>${a.code}</b> ${a.name}`; grid.appendChild(d); }
  $('artCount').textContent=`${have}/${ART_LIST.length} images loaded`;
}
function applyUiArt(){
  const acts={general:'ui:general',army:'ui:army',hold:'ui:hold',follow:'ui:follow',center:'ui:none',explore:'ui:center'};
  document.querySelectorAll('#actions .btn').forEach(b=>{ const k=acts[b.dataset.act]; const label=b.querySelector('span').outerHTML; if(!b._emoji) b._emoji=b.firstChild.textContent; b.innerHTML=(ArtUrls[k]?`<img class="ai" src="${ArtUrls[k]}">`:b._emoji)+label; });
  const top={bPause:'ui:pause',bSound:'ui:sound'}; for(const id in top){ const b=$(id); if(ArtUrls[top[id]]) b.innerHTML=`<img class="ai" src="${ArtUrls[top[id]]}">`; }
  document.querySelectorAll('[data-art]').forEach(e=>{ if(!e._fb) e._fb=e.textContent; e.innerHTML=artIcon(e.dataset.art,e._fb); });
  const logo=document.querySelector('.logo'); if(!logo._html) logo._html=logo.innerHTML; logo.innerHTML= artOK('ui:logo')? `<img src="${ArtUrls['ui:logo']}" alt="Loan The Meme">` : logo._html;
  logo.style.webkitTextStroke = artOK('ui:logo')? '0' : '';
  if(G.ren) G.ren.chunks.clear(); try{ drawBadge(); }catch(e){}
  if(!$('artscr').classList.contains('hidden')) renderArtGrid();
}
onArt(applyUiArt);

// ---------- 🔥 Đại Chiến ----------
// ---------- 🏛️ chọn nền văn minh trước trận (chọn theo tên / lọc theo châu lục / 🎲 ngẫu nhiên) ----------
const CivPick={ sel:null, reg:'all', q:'', opts:null, stage:1,
  norm(t){ return String(t).toLowerCase().replace(/đ/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,''); },
  list(){ const q=this.norm(this.q.trim()); return BW_CIVS.filter(c=>(this.reg==='all'||c.reg===this.reg)&&(!q||this.norm(c.name+' '+c.era).includes(q))); },
  open(opts){ this.opts=opts||{}; this.reg='all'; this.q=''; $('civSearch').value='';
    this.sel= BW_CIV[save.civ]? save.civ : BW_CIVS[(Math.random()*BW_CIVS.length)|0].id;
    this.stageMax=this.opts.stageMax||0; this.stage=this.opts.stage||this.stageMax||1; this.diff= save.rdiff==null? 1 : save.rdiff;
    $('civGo').textContent=this.opts.go||'⚔️ Start';
    $('civSearch').oninput=()=>{ this.q=$('civSearch').value; this.renderGrid(); };
    $('civRandom').onclick=()=>{ audio.click(); const L=this.list().filter(c=>c.id!==this.sel); const pool=L.length? L : BW_CIVS; this.pick(pool[(Math.random()*pool.length)|0].id,true); };
    $('civBack').onclick=()=>{ audio.click(); this.close(); if(this.opts.onBack) this.opts.onBack(); };
    $('civGo').onclick=()=>{ audio.click(); const id=this.sel; save.civ=id; Save.set(save); if(this.opts.diff) save.rdiff=this.diff; Save.set(save); this.close(); this.opts.onPick&&this.opts.onPick(id,this.stage,this.diff); };
    this.renderTabs(); this.renderGrid(); this.renderInfo(); this.renderStage(); $('civPick').classList.remove('hidden');
    const on=$('civGrid').querySelector('.civ.on'); if(on&&on.scrollIntoView) on.scrollIntoView({block:'nearest'}); },
  close(){ $('civPick').classList.add('hidden'); },
  pick(id,scroll){ this.sel=id; const cv=BW_CIV[id]; if(scroll&&this.reg!=='all'&&cv.reg!==this.reg){ this.reg='all'; this.renderTabs(); } this.renderGrid(); this.renderInfo();
    if(scroll){ const on=$('civGrid').querySelector('.civ.on'); if(on&&on.scrollIntoView) on.scrollIntoView({block:'nearest'}); } },
  renderTabs(){ const t=$('civTabs'); t.innerHTML=''; for(const [id,name,ico] of [['all','All','🌐'],...BW_REGIONS]){ const b=document.createElement('button'); b.className='btn'+(this.reg===id?' on':''); b.dataset.reg=id;
      b.textContent=`${ico} ${name} ${id==='all'? BW_CIVS.length : BW_CIVS.filter(c=>c.reg===id).length}`; b.onclick=()=>{ audio.click(); this.reg=id; this.renderTabs(); this.renderGrid(); }; t.appendChild(b); } },
  renderGrid(){ const g=$('civGrid'); g.innerHTML=''; const L=this.list();
    if(!L.length){ g.innerHTML='<div style="grid-column:1/-1;opacity:.75;padding:10px">No civilization matches that name.</div>'; return; }
    for(const c of L){ const b=document.createElement('button'); b.className='civ'+(c.id===this.sel?' on':''); b.dataset.civ=c.id;
      b.innerHTML=`<i class="em" style="background:${c.color}">${c.icon}</i><span><b>${c.name}${save.chron&&save.chron[c.id]? ' 👑' : ''}</b><small>${UNIT[c.sig].emoji} ${bwTypeName(c.sig,1)}</small></span>`;   /* 👑 đã thống nhất thiên hạ (Sử ký) */
      b.onclick=()=>{ audio.click(); this.pick(c.id); }; g.appendChild(b); } },
  renderInfo(){ const c=BW_CIV[this.sel], reg=(BW_REGIONS.find(r=>r[0]===c.reg)||[])[1]||'';
    $('civInfo').innerHTML=`<h3>${c.icon} ${c.name}</h3><div class="era">${c.era} · ${reg}</div><div style="margin:3px 0">${c.blurb}</div><ul>${civPerks(c).map(t=>`<li>${t}</li>`).join('')}</ul>`
      +`<div style="margin-top:4px;opacity:.85">Starting army: ${c.roster.map(t=>UNIT[t].emoji+' '+bwTypeName(t,1)).join(' · ')}</div>`; },
  renderStage(){ const el=$('civStage');
    if(this.opts.diff){ el.innerHTML=(this.opts.label? `<span class="stlab">${this.opts.label}</span>` : '')+BW.DIFF_NAMES.map((n,i)=>`<button class="btn dif${i===this.diff?' on':''}" data-dif="${i}">${['🙂','⚔️','💀'][i]} ${n}</button>`).join(''); el.querySelectorAll('.dif').forEach(b=>b.onclick=()=>{ audio.click(); this.diff=+b.dataset.dif; this.renderStage(); }); return; }
    if(this.opts.label){ el.innerHTML=`<span>${this.opts.label}</span>`; return; }   /* (5.9) ∞ ải vô tận / ★ Thăng Thiên */
    if(this.opts.fixed){ el.innerHTML=`<span>Stage ${this.stage}/${BW_LEVELS.length}</span>`; return; }
    if(!this.stageMax){ el.innerHTML=''; return; }
    el.innerHTML=`<button class="btn" id="civStPrev">◀</button><span>Stage ${this.stage}/${BW_LEVELS.length}</span><button class="btn" id="civStNext">▶</button>`;
    $('civStPrev').disabled=this.stage<=1; $('civStNext').disabled=this.stage>=this.stageMax;
    $('civStPrev').onclick=()=>{ audio.click(); this.stage=Math.max(1,this.stage-1); this.renderStage(); }; $('civStNext').onclick=()=>{ audio.click(); this.stage=Math.min(this.stageMax,this.stage+1); this.renderStage(); }; },
};
// hộp hỏi lại trước thao tác không hoàn tác được (không dùng confirm() của trình duyệt)
function ask(title,sub,yes,cb){ const was=G.paused; G.paused=true; $('askT').textContent=title; $('askS').textContent=sub||''; $('askY').textContent=yes||'Yes'; $('ask').classList.remove('hidden');
  const close=(ok)=>{ $('ask').classList.add('hidden'); G.paused=was; if(ok) cb(); };
  $('askY').onclick=()=>{ audio.click(); close(true); }; $('askN').onclick=()=>{ audio.click(); close(false); }; }
// chơi lại ĐÚNG chế độ/bản đồ đang chơi (trước đây nút ↻ làm ván Quần Hùng biến thành ải 1v1)
function bwRestart(){ const lv=(G.bw&&G.bw.lv)||1; G.paused=false; G.bwCfg=Object.assign({},G.lastBwCfg||{}); if(G.bwCfg.chal){} else if(G.bwCfg.royale){ try{ localStorage.removeItem(RSAVE); }catch(e){} } else if(!G.bwCfg.p2p) soloClear(); startBigWar(lv); }
// băng "xoay ngang" (chỉ hiện khi cầm dọc) nằm sát đáy: báo chiều cao của nó cho CSS (--rot-h) để các màn hình menu chừa chỗ, không bị băng che nút
function rotSync(){ const r=$('rotate'); if(!r) return; const h=(getComputedStyle(r).display==='none')? 0 : Math.ceil(r.getBoundingClientRect().height); document.documentElement.style.setProperty('--rot-h',h+'px'); }
function rotateHint(show){ const r=$('rotate'); clearTimeout(G._rotT); r.classList.remove('off'); if(show) G._rotT=setTimeout(()=>{ r.classList.add('off'); rotSync(); },6000); rotSync(); }
function startBigWar(lv){
  lv=Math.max(1,Math.min(BW_LEVELS.length,lv||1));
  { const cf=G.bwCfg||(G.bwCfg={}); if(cf.p2p||cf.conq==='tribe') delete cf.up; else cf.up=Object.assign({},save.up); }   /* Bộ lạc: chưa có Lò rèn */
  const decorOn=decorState().on.slice();   // ⚒️ Lò rèn: chỉ trận một người chơi (P2P hai bên phải ngang nhau)
  G.lastBwCfg=Object.assign({},G.bwCfg||{}); G.bw=new BigWar(lv, G.bwCfg||{}); G.bw.autoMenu=false;
  G.bw.decor=decorOn;   /* 🏮 đồ trang trí trại (chỉ là hình, máy nào vẽ theo máy đó) */
  G.bw.genSetup(genPack());   /* 🎖️ tướng mang theo */
  G.bw.gearSetup(G.bw.conq==='tribe'? [] : save.pack.filter(id=>(save.inv[id]||0)>0), {stock:(id)=>save.inv[id]||0, spend:(id)=>{ save.inv[id]=Math.max(0,(save.inv[id]||0)-1); Save.set(save); }});   // 🎒 quân nhu mang theo (P2P: gearSetup tự bỏ qua)
  G.bw.onCoin=(n)=>{ if(G.bw&&G.bw.cfg.tut) return;   /* trận hướng dẫn không phát xu lẻ: chỉ thưởng 50 xu khi học xong */ save.xu=(save.xu||0)+n; Save.set(save); refreshXu(); if(!saveDue) saveDue=performance.now(); };   /* 🪙 xu theo mốc ở Quần Hùng: xu vào túi ngay, và ván được lưu ngay sau đó (không thể thoát game để "hạ lại" cùng một nước lấy xu lần nữa) */
  G.bw.lv=lv; G.world=null; G.paused=false; G.resultShown=false; G.sel.clear(); G.bwCfg=null;
  document.body.classList.remove('mini');
  ['menu','levels','help','pause','result','forge','gear','decor','tutDone','artscr'].forEach(id=>$(id).classList.add('hidden'));
  $('hud').classList.add('hidden'); $('bwbar').classList.remove('hidden'); $('ask').classList.add('hidden'); $('civPick').classList.add('hidden'); $('bossPick').classList.add('hidden');
  $('campaign').classList.add('hidden'); $('conquest').classList.add('hidden'); stageIntro(G.bw,!!G.bwResume); G.bwResume=false;
  $('bwRetry').style.display= G.bw.cfg&&G.bw.cfg.p2p? 'none':''; rotateHint(true); // băng "xoay ngang" chỉ hiện 6 giây đầu trận rồi nhường chỗ cho bản đồ
}
// 💾 Lưu ván Quần Hùng vào bộ nhớ máy: tự lưu 15 giây/lần, khi ẩn app, khi về menu
const RSAVE='ltm_royale_save_v1';
const SSAVE='ltm_solo_save_v1';   /* (5.3) ván 1v1 đang đánh dở cũng được lưu: thoát app rồi vào đánh tiếp */
function royaleSave(){ try{ const bw=G.bw; if(!bw||bw.cfg.p2p||bw.cfg.classic||bw.cfg.tut||bw.cfg.chal) return false;   /* 📅 thử thách không tự lưu (không đè ván đang lưu) */ const K=bw.royale? RSAVE : SSAVE;
  if(bw.over){ localStorage.removeItem(K); return false; } if(!bw.royale&&bw.time<15) return false;
  localStorage.setItem(K, JSON.stringify(bw.saveState())); return true; }catch(e){ console.warn('save fail',e); return false; } }
function soloLoadInfo(){ try{ const sv=JSON.parse(localStorage.getItem(SSAVE)||'null'); return sv&&sv.v===1&&sv.lv>=1&&sv.lv<=CAMP_N&&sv.cfg&&!sv.cfg.royale? sv : null; }catch(e){ return null; } }
function soloResume(){ const sv=soloLoadInfo(); if(!sv) return false; G.bwCfg=Object.assign({},sv.cfg); G.bwResume=true; startBigWar(sv.lv); G.bw.loadState(sv); return true; }
function soloClear(){ try{ localStorage.removeItem(SSAVE); }catch(e){} }
const CAMP_N=10, DIFF_N=['Easy','Normal','Hard'];   /* dùng được ngay lúc dựng menu (bảng BW_LEVELS/BW nằm ở tệp nạp sau) */
function campCleared(){ return Math.max(0,Math.min(CAMP_N,(save.bwMax||1)-1)); }
function stageName(lv){ try{ return BW_LEVELS[lv-1].name; }catch(e){ return 'Stage '+lv; } }
// 🗺️ MÀN CHIẾN DỊCH: 10 ải — đã qua (✔ + kỷ lục) · đang tới (▶) · còn khoá (🔒); mỗi ải ghi rõ vùng đất và boss khôn tới đâu
const Campaign={
  open(){ this.render(); $('campaign').classList.remove('hidden'); $('campBack').onclick=()=>{ audio.click(); $('campaign').classList.add('hidden'); $('bossPick').classList.remove('hidden'); setupMenus(); };
    $('campForge').onclick=()=>{ audio.click(); G.forgeFrom='campaign'; $('campaign').classList.add('hidden'); renderGear(); $('gear').classList.remove('hidden'); };
    const cur=$('campList').querySelector('.stg.cur'); if(cur&&cur.scrollIntoView) cur.scrollIntoView({block:'nearest'}); },
  info(lv){ const L=BW_LEVELS[lv-1], D=BW.brain(lv,false), bio=BW_BIOMES[BW_MAPS.solo[(lv-1)*3][2]], tac=BW.TACTICS[D.iq]; return {L,D,bio,brains:'🧠'.repeat(D.iq+1),tac:tac[(lv-1)%tac.length],army:BW.BOSS_ARMY[lv-1]}; },
  render(){ const cl=campCleared(), N=BW_LEVELS.length, cur=Math.min(N,cl+1), best=(save.camp&&save.camp.best)||{};
    $('campProg').innerHTML=`<span>${cl>=N? '👑 Complete'+((save.camp&&save.camp.endless|0)>N? ' · ∞ '+(save.camp.endless|0) : '') : 'Cleared '+cl+'/'+N}</span><span class="pips">${BW_LEVELS.map((_,i)=>`<i class="${i<cl?'on':i===cl?'cur':''}"></i>`).join('')}</span>`;
    const box=$('campList'); box.innerHTML='';
    for(let lv=1;lv<=N;lv++){ const I=this.info(lv), st= lv<=cl? 'cleared' : lv===cur? 'cur' : 'lock', b=document.createElement('button'); b.className='stg '+st; b.dataset.lv=lv; b.dataset.st=st;
      b.innerHTML=`<i class="no">${lv}</i><span class="nm"><b>${I.L.name}</b><small>${I.bio.icon} ${I.bio.name} · ${I.brains} · ⚔️${(Math.round(I.army/100)/10).toFixed(1)}k</small><small>${I.tac}</small></span><em>${st==='cleared'? '✔ Cleared'+(best[lv]? '<br>⏱️ '+fmt(best[lv]) : '') : st==='cur'? '▶ PLAY' : '🔒'}</em>`;
      if(st==='lock') b.onclick=()=>{ audio.block&&audio.block(); toast({text:`🔒 Clear Stage ${lv-1} first`,kind:'bad'}); };
      else b.onclick=()=>{ audio.click(); this.pick(lv); };
      box.appendChild(b); }
    if(cl>=N){ const cp=save.camp||{}, best=cp.endless|0, n=Math.max(N,best)+1, A=BW.endlessArmy(n), b=document.createElement('button'); b.className='stg cur endless'; b.dataset.endless=n;   /* ∞ (5.9) ẢI VÔ TẬN sau ải 10 */
      b.innerHTML=`<i class="no">∞</i><span class="nm"><b>Endless ${n}</b><small>🧠🧠🧠🧠 · ⚔️${(Math.round(A/100)/10).toFixed(1)}k · ${BW.endlessMuts(n).map(m=>BW_MUT[m].icon+' '+BW_MUT[m].name).join(' · ')}</small><small>${BW.endlessMuts(n).map(m=>BW_MUT[m].txt).join(' · ')}${best>N? ' · 🏅 best: Endless '+best : ''}</small></span><em>${soloLoadInfo()&&(soloLoadInfo().cfg||{}).endless===n? '▶ CONTINUE' : '▶ PLAY'}</em>`;
      b.onclick=()=>{ audio.click(); const ss=soloLoadInfo(); if(ss&&ss.cfg&&ss.cfg.endless===n){ $('campaign').classList.add('hidden'); soloResume(); return; } endlessPick(n); }; box.appendChild(b); } },
  pick(lv){ const go=()=>{ $('campaign').classList.add('hidden'); CivPick.open({stageMax:lv, stage:lv, fixed:true, go:`⚔️ Start Stage ${lv}`, onPick:(id)=>{ soloClear(); G.bwCfg={civ:id}; startBigWar(lv); }, onBack:()=>Campaign.open()}); };
    const ss=soloLoadInfo(); if(ss) ask(`Start Stage ${lv} from the beginning?`,`Your battle in progress (Stage ${ss.lv}, ${Math.floor((ss.sc.time||0)/60)} min played) will be erased.`,'⚔️ Start',go); else go(); },
};
// 🌏 (5.7) CHINH PHẠT: 3 bản đồ nối tiếp — Bộ lạc → Nội chiến → Đại chiến; chọn nước + mức khó ở đầu, giữ nguyên tới cuối
function startConq(id){ const S=BW_CONQ[id], cq=save.conq||{}; if(!S) return; try{ localStorage.removeItem(RSAVE); }catch(e){}
  const n=S.n[0]+((Math.random()*(S.n[1]-S.n[0]+1))|0);
  G.bwCfg={royale:n-1, conq:id, asc:cq.asc|0, seed:61+((Math.random()*9999)|0), civ:cq.civ||save.civ, diff:cq.diff==null? 1 : cq.diff, bio:1, L:{camp:S.camp}}; startBigWar(5); }
// ∞ (5.9) ải vô tận: chọn nước rồi vào ải n (gốc ải 10, mạnh dần 7%/ải, 1–2 luật đặc biệt)
function startEndless(n,civ){ soloClear(); G.bwCfg=BW.endlessCfg(n,civ||save.civ); startBigWar(BW_LEVELS.length); }
function endlessPick(n){ const go=()=>{ $('campaign').classList.add('hidden'); CivPick.open({label:`∞ Endless ${n} · ${BW.endlessMuts(n).map(m=>BW_MUT[m].icon+' '+BW_MUT[m].name).join(' · ')}`, go:`∞ Start Endless ${n}`, onPick:(id)=>startEndless(n,id), onBack:()=>Campaign.open()}); };
  const ss=soloLoadInfo(); if(ss) ask(`Start Endless ${n}?`,`Your battle in progress (${ss.cfg&&ss.cfg.endless? 'Endless '+ss.cfg.endless : 'Stage '+ss.lv}, ${Math.floor((ss.sc.time||0)/60)} min played) will be erased.`,'∞ Start',go); else go(); }
const Conquest={
  open(){ if(!save.conq){ this.fresh(); return; } if((save.conq.stage|0)>=3&&!save.chronDone){ const ch=save.chron||(save.chron={}); if(save.conq.civ&&!ch[save.conq.civ]) ch[save.conq.civ]={asc:save.conq.asc|0}; save.chronDone=1; Save.set(save); }   /* phá đảo từ bản cũ: ghi nước đó vào Sử ký (không thưởng xu) */
    this.render(); $('conquest').classList.remove('hidden');
    $('conqBack').onclick=()=>{ audio.click(); $('conquest').classList.add('hidden'); $('bossPick').classList.remove('hidden'); setupMenus(); };
    $('conqNew').onclick=()=>{ audio.click(); const go=()=>{ $('conquest').classList.add('hidden'); this.fresh(true); }; const sv=royaleLoadInfo(); if((save.conq.stage|0)>0||sv) ask('Start a NEW conquest?','Your current conquest'+(sv? ' and its saved game' : '')+' will be erased once the new one starts.','🆕 New conquest',go); else go(); }; },
  fresh(back){ CivPick.open({go:'🪓 Start Tribal Wars', diff:true, onPick:(id,st,df)=>{ save.conq={civ:id,diff:df,stage:0,best:{},asc:0}; Save.set(save); startConq('tribe'); }, onBack:()=>{ if(back&&save.conq) this.open(); else $('bossPick').classList.remove('hidden'); }}); },
  render(){ const cq=save.conq, st=Math.min(3,cq.stage|0), cv=BW_CIV[cq.civ], sv=royaleLoadInfo(), best=cq.best||{};
    $('conqProg').innerHTML=`<span>${cq.asc? '★'+cq.asc+' · ' : ''}${cv? cv.icon+' '+cv.name : ''} · ${DIFF_N[cq.diff==null?1:cq.diff]}</span><span class="pips">${BW_CONQ_ORDER.map((_,i)=>`<i class="${i<st?'on':i===st?'cur':''}"></i>`).join('')}</span>`;
    const box=$('conqList'); box.innerHTML='';
    BW_CONQ_ORDER.forEach((id,i)=>{ const S=BW_CONQ[id], state= i<st? 'cleared' : i===st? 'cur' : 'lock', b=document.createElement('button'), live= sv&&sv.cfg&&sv.cfg.conq===id&&state==='cur';
      b.className='stg '+state; b.dataset.conq=id; b.dataset.st=state;
      const cnt= S.n[0]===S.n[1]? 'all '+S.n[0] : S.n[0]+'–'+S.n[1], tr=`${(S.start[0]*S.dk).toLocaleString('en-US')}–${(S.start[1]*S.dk).toLocaleString('en-US')}`;
      b.innerHTML=`<i class="no">${S.icon}</i><span class="nm"><b>${i+1}. ${S.name}</b><small>${cnt} ${S.unit} · ${tr} troops · ${(S.W/1000)|0}k×${(S.H/1000)|0}k map</small><small>${S.blurb}</small></span><em>${state==='cleared'? '✔ Won'+(best[id]? '<br>⏱️ '+fmt(best[id]) : '') : state==='cur'? (live? '▶ CONTINUE' : '▶ PLAY') : '🔒'}</em>`;
      if(state==='lock') b.onclick=()=>{ audio.block&&audio.block(); toast({text:`🔒 Win the ${BW_CONQ[BW_CONQ_ORDER[i-1]].name} first`,kind:'bad'}); };
      else b.onclick=()=>{ audio.click(); this.pick(id,live,state); };
      box.appendChild(b); });
    if(st>=3){ const d=document.createElement('div'); d.className='conqdone'; d.textContent= cq.asc? `👑 ★${cq.asc} Ascension complete — the whole world is yours!` : '👑 Conquest complete — the whole world is yours! Replay any stage or start a new conquest.'; box.appendChild(d); }
    const am=save.ascMax|0;   /* ★ (5.9) THĂNG THIÊN: mở sau khi thắng Đại chiến lần đầu */
    if(save.chronDone||am>0||st>=3){ const nx=Math.min(BW.ASC_MAX,am+1), done=am>=BW.ASC_MAX&&(st>=3||!cq.asc), b=document.createElement('button'); b.className='stg asc'+(done? ' cleared' : ''); b.dataset.asc=nx;
      b.innerHTML=`<i class="no">★</i><span class="nm"><b>${done? '★ All 10 Ascensions cleared' : `★${nx} Ascension`}</b><small>${done? 'You have conquered the world at every level of hardship.' : `New: ${BW_ASC[nx-1].txt}${nx>1? ' — plus all ★1–★'+(nx-1)+' rules' : ''}`}</small><small>🪙 coins ×${BW.ascCoinK(nx).toFixed(2).replace(/0$/,'')} · 🚩 banner · new run, any nation</small></span><em>${done? '👑' : '▶ ASCEND'}</em>`;
      b.onclick=()=>{ audio.click(); if(done) return; this.ascend(nx); }; box.prepend(b); }   /* thẻ ★ lên đầu danh sách: thấy ngay không phải cuộn */
    $('conqChron').innerHTML=`📜 Chronicle ${Object.keys(save.chron||{}).length}/${BW_CIVS.length}`; $('conqChron').onclick=()=>{ audio.click(); $('conquest').classList.add('hidden'); Chronicle.open(()=>Conquest.open()); }; },
  ascend(n){ const go=()=>{ $('conquest').classList.add('hidden'); CivPick.open({label:`★${n} Ascension`, go:`★ Start ★${n} — Tribal Wars`, diff:true, onPick:(id,st,df)=>{ save.conq={civ:id,diff:df,stage:0,best:{},asc:n}; Save.set(save); startConq('tribe'); }, onBack:()=>Conquest.open()}); };
    const sv=royaleLoadInfo(); if(sv||((save.conq&&save.conq.stage|0)>0&&(save.conq.stage|0)<3)) ask(`Start the ★${n} Ascension?`,'Your current conquest'+(sv? ' and its saved game' : '')+' will be replaced by a new one.','★ Ascend',go); else go(); },
  pick(id,live,state){ const go=()=>{ $('conquest').classList.add('hidden'); startConq(id); };
    if(live){ $('conquest').classList.add('hidden'); royaleResume(); return; }
    const sv=royaleLoadInfo(); if(sv){ const c=BW_CONQ[sv.cfg&&sv.cfg.conq]; ask(`Start the ${BW_CONQ[id].name}?`,`Your saved ${c? c.name : 'Warlords'} game (${Math.floor((sv.sc.time||0)/60)} min played) will be erased.`,'▶ Start',go); } else go(); },
};
// 📜 (5.9) SỬ KÝ: các nước đã thống nhất thiên hạ — nước mới +40 xu; mốc 10 / 22 / 44 nước +100 / +200 / +500
const CHRON_NEW=40, CHRON_MS=[[10,100],[22,200],[44,500]];
function chronRecord(bw){ const ch=save.chron||(save.chron={}), id=bw.cfg.civ, cv=BW_CIV[id], lines=[], was=Object.keys(ch).length, e=ch[id]; let bonus=0;
  if(!e){ ch[id]={asc:bw.asc|0,t:Math.round(bw.time),d:Date.now()}; bonus+=CHRON_NEW; lines.push(`📜 New in the Chronicle: ${cv? cv.icon+' '+cv.name : id} (+${CHRON_NEW} coins)`);
    const now=Object.keys(ch).length; for(const [m,c] of CHRON_MS) if(was<m&&now>=m){ bonus+=c; lines.push(`🏅 ${m} nations united! +${c} coins`); } }
  else { if((bw.asc|0)>(e.asc|0)) e.asc=bw.asc|0; const t=Math.round(bw.time); if(!e.t||t<e.t) e.t=t; }
  if((bw.asc|0)>=(save.ascMax|0)){ const was2=save.ascMax|0; save.ascMax=Math.max(was2,bw.asc|0); if(save.ascMax<BW.ASC_MAX&&(bw.asc|0)>=was2) lines.push(`★${save.ascMax+1} Ascension unlocked`); }
  save.chronDone=1; if(bonus){ save.xu=(save.xu||0)+bonus; } Save.set(save); refreshXu(); BW.ascStars=save.ascMax|0; return {lines,bonus}; }
const Chronicle={
  open(back){ this.back=back; this.render(); $('chron').classList.remove('hidden'); $('chronBack').onclick=()=>{ audio.click(); $('chron').classList.add('hidden'); if(this.back) this.back(); }; },
  render(){ const ch=save.chron||{}, n=Object.keys(ch).length, nx=CHRON_MS.find(([m])=>n<m);
    $('chronProg').innerHTML=`<span>${n}/${BW_CIVS.length} nations united${save.ascMax? ' · ★'+save.ascMax : ''}</span>`;
    $('chronHint').textContent= nx? `Win the Great War with a nation to write it into the Chronicle (+${CHRON_NEW} coins each). Next milestone: ${nx[0]} nations → +${nx[1]} coins.` : 'Every nation in the world has united the realm under your command — the Chronicle is complete!';
    const g=$('chronGrid'); g.innerHTML='';
    for(const c of BW_CIVS){ const e=ch[c.id], d=document.createElement('div'); d.className='civ chron'+(e? ' on' : ' off'); d.dataset.civ=c.id;
      d.innerHTML=`<i class="em" style="background:${e? c.color : '#555'}">${c.icon}</i><span><b>${c.name}</b><small>${e? '👑 United'+(e.asc? ' · ★'+e.asc : '')+(e.t? ' · ⏱️ '+fmt(e.t) : '') : UNIT[c.sig].emoji+' not yet'}</small></span>`; g.appendChild(d); } },
};
// 🎬 băng giới thiệu đầu trận: đang ở ải mấy, vùng đất nào, boss khôn tới đâu
function stageIntro(bw,resumed){ const el=$('stageIntro'); if(!el) return; if(bw.cfg.p2p||bw.cfg.classic){ el.classList.add('hidden'); return; }
  if(bw.cfg.chal){ const X=bw.cfg.chal==='w'; $('siTop').textContent=`${X? '🏕️ WEEKLY' : '📅 DAILY'} CHALLENGE · 🎯 WIN WITHIN ${fmt(X? BW.chal.weekLim : BW.chal.dayLim)}`; $('siName').textContent= X? '🪓 Tribal Wars' : `⚔️ Stage ${bw.lv} boss`; $('siLand').textContent=`${bw.biome.icon} ${bw.biome.name} · “${bw.mapName}”`; $('siBoss').textContent=BW.modLines(bw.cfg).join(' · '); }
  else if(bw.conq){ const d=bw.D.diff, S=BW_CONQ[bw.conq]; $('siTop').textContent=`${bw.asc? '★'+bw.asc+' ASCENSION · ' : ''}CONQUEST ${S.i+1}/3 · ${BW.DIFF_NAMES[d].toUpperCase()}`; $('siName').textContent=S.icon+' '+S.name; $('siLand').textContent=`${bw.biome.icon} ${bw.biome.name} · ${bw.cfg.royale} rival ${S.unit}`; $('siBoss').textContent= resumed? '▶ Game resumed' : bw.asc? `★ ${BW_ASC.slice(0,bw.asc).length} hardships · newest: ${BW_ASC[bw.asc-1].txt} · coins ×${bw._coinK}` : S.blurb; }
  else if(bw.royale){ const d=bw.D.diff; $('siTop').textContent='WARLORDS · '+BW.DIFF_NAMES[d].toUpperCase(); $('siName').textContent=bw.mapName; $('siLand').textContent=`${bw.biome.icon} ${bw.biome.name} · ${bw.cfg.royale} rival nations`; $('siBoss').textContent= resumed? '▶ Game resumed' : ['🙂 Rivals grow slowly and leave you alone at first','⚔️ Rivals fight each other — and you','💀 Rivals grow fast, guard their land and gang up on you'][d]; }
  else if(bw.endless){ $('siTop').textContent=`∞ ENDLESS · STAGE ${bw.endless}`; $('siName').textContent=`⚔️ Boss ×${(1+0.07*(bw.endless-BW_LEVELS.length)).toFixed(2)}`; $('siLand').textContent=`${bw.biome.icon} ${bw.biome.name} · “${bw.mapName}”`; $('siBoss').textContent= resumed? '▶ Battle resumed' : BW.modLines(bw.cfg).join(' · '); }
  else { const I=Campaign.info(bw.lv); $('siTop').textContent=`STAGE ${bw.lv} / ${BW_LEVELS.length}`; $('siName').textContent=I.L.name; $('siLand').textContent=`${bw.biome.icon} ${bw.biome.name} · “${bw.mapName}”`; $('siBoss').textContent= resumed? '▶ Battle resumed' : `Boss ${I.brains} · ${I.tac}`; }
  el.classList.remove('hidden'); el.style.animation='none'; void el.offsetWidth; el.style.animation=''; clearTimeout(G._siT); G._siT=setTimeout(()=>el.classList.add('hidden'),4700); }
function royaleLoadInfo(){ try{ const sv=JSON.parse(localStorage.getItem(RSAVE)||'null'); return sv&&sv.v===1? sv : null; }catch(e){ return null; } }
function royaleResume(){ const sv=royaleLoadInfo(); if(!sv) return false;
  G.bwCfg=Object.assign({},sv.cfg); G.bwResume=true; startBigWar(sv.lv); G.bw.loadState(sv); return true; }
// (5.1) vẫn tự lưu 15 giây/lần, nhưng không chen vào lúc ngón tay đang thao tác: đợi lúc rảnh tay (chờ tối đa 20 giây) rồi mới ghi
let saveDue=0; setInterval(()=>{ if(G.bw&&!G.bw.cfg.p2p&&!G.paused&&!saveDue) saveDue=performance.now(); },15000);
setInterval(()=>{ if(!saveDue) return; if(!G.bw||G.bw.cfg.p2p){ saveDue=0; return; } const now=performance.now(); if((ptrs.size===0&&now-PACE.inT>900)||now-saveDue>20000){ saveDue=0; royaleSave(); } },500);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) royaleSave(); });
window.addEventListener('pagehide',()=>royaleSave());
function stopBigWar(toMenu){ royaleSave(); G.bw=null; $('bwbar').classList.add('hidden'); rotateHint(false); if(toMenu){ showScreen('menu'); setupMenus(); } }
function showBwResult(){
  const bw=G.bw, r=bw.result; G.resultShown=true; if(bw.royale){ try{ localStorage.removeItem(RSAVE); }catch(e){} } else if(!(bw.cfg&&bw.cfg.p2p)) soloClear(); const win=r.win; const lv=bw.lv; $('stageIntro').classList.add('hidden');
  $('rTitle').textContent= win? '🎉 VICTORY!' : '💀 DEFEAT';
  $('rTitle').style.color= win? '#ffd54a' : '#f87171';
  const bk= win? 'ui:win':'ui:lose'; if(artOK(bk)) $('rTitle').innerHTML=`<img src="${ArtUrls[bk]}" style="max-width:min(70vw,460px);max-height:max(17vh,96px)">`;
  const meC=bw.civOf(bw.localFid), enC=bw.civOf(bw.localFid===0?1:0);
  const CH6=bw.cfg&&bw.cfg.chal, CQ= CH6? null : BW_CONQ[bw.conq], CQn= CQ&&BW_CONQ[BW_CONQ_ORDER[CQ.i+1]];   /* 📅 thử thách: không tính vào tiến trình chiến dịch / chinh phạt */
  $('rSub').textContent= CQ? (win? (CQ.id==='tribe'? `Every tribe now follows ${meC.icon} ${bw.natName(0)}!` : CQ.id==='civil'? `${meC.icon} ${meC.name} is one kingdom again — every region bows to you!` : `The whole world belongs to ${meC.icon} ${meC.name}!`) : `Your last camp has fallen in the ${CQ.name}...`) : bw.royale? (win? `The whole realm belongs to ${meC.icon} ${meC.name} — every nation has fallen!` : 'Your last camp has fallen — the realm belongs to others...') : (win? `${meC.icon} ${meC.name} has defeated ${enC.icon} ${enC.name}!` : `${enC.icon} ${enC.name} has taken our last camp...`);
  const EN=bw.endless|0, xu=coinK((bw.stats.eat/40 + bw.stats.win*4 + (win? 30+18*(EN||lv) : 8))*(bw._coinK||1));   /* (5.8) ~15% mức cũ · (5.9) ★ Thăng Thiên ×(1+25%×bậc), ∞ ải vô tận theo số ải */
  const solo=!bw.royale&&!(bw.cfg&&bw.cfg.p2p)&&!(bw.cfg&&bw.cfg.classic)&&!CH6, NL=BW_LEVELS.length; let first=false, rec=false;
  save.xu=(save.xu||0)+xu; if(win&&solo&&EN){ const cp=save.camp||(save.camp={best:{}}); cp.endless=Math.max(cp.endless|0,EN); }
  else if(win&&solo){ first=(save.bwMax||1)<lv+1; save.bwMax=Math.max(save.bwMax||1,lv+1); const cp=save.camp||(save.camp={best:{}}); cp.best=cp.best||{}; const t=Math.round(bw.time); if(!cp.best[lv]||t<cp.best[lv]){ rec=!!cp.best[lv]; cp.best[lv]=t; } } Save.set(save); refreshXu();
  if(CQ&&win){ const cq=save.conq||(save.conq={civ:bw.cfg.civ,diff:bw.cfg.diff,stage:0}); cq.stage=Math.max(cq.stage|0,CQ.i+1); cq.civ=bw.cfg.civ; cq.diff=bw.cfg.diff; const bt=cq.best||(cq.best={}); const t=Math.round(bw.time); if(!bt[CQ.id]||t<bt[CQ.id]) bt[CQ.id]=t; Save.set(save); }
  const CH= CQ&&win&&CQ.id==='great'? chronRecord(bw) : null;   /* 📜 Sử ký + ★ mở bậc Thăng Thiên kế */
  const meta= !(bw.cfg&&(bw.cfg.p2p||bw.cfg.tut));   /* 📅🏆🎖️ (6.0) thử thách · thống kê trọn đời · kinh nghiệm tướng · thành tựu */
  const CR= meta? chalAfter(bw,win) : null; if(meta) ltAfter(bw,win,xu); const GL= meta? genAward(bw,win) : []; const AG= meta? achCheck(true) : [];
  const extra=[...(CR? CR.lines : []), ...GL, ...AG.map(a=>`🏆 ${a.name} +${a.xu} coins${a.title? ' · title “'+a.title+'”' : ''}`)]; refreshXu();
  $('rStage').innerHTML= CH6? `${CR&&CR.ok? '🎯 CHALLENGE COMPLETE!' : '🎯 '+(CH6==='w'? 'Weekly' : 'Daily')+' challenge'}<span class="${CR&&CR.ok? 'unl' : 'rec'}">${CR? CR.lines[0] : ''}</span>` : EN? (win? `∞ ENDLESS ${EN} CLEARED!<span class="unl">Next: Endless ${EN+1} — ${BW.endlessMuts(EN+1).map(m=>BW_MUT[m].icon+' '+BW_MUT[m].name).join(' · ')}</span>` : `∞ Endless ${EN} — not cleared<span class="rec">🏅 Best: ${(save.camp&&save.camp.endless|0)>BW_LEVELS.length? 'Endless '+save.camp.endless : 'none yet'}</span>`) : CQ? (win? (CQn? `🏆 ${CQ.id==='tribe'? 'THE TRIBES ARE UNITED!' : 'THE CIVIL WAR IS WON!'}<span class="unl">Next: ${CQn.icon} ${CQn.name} — ${CQn.n[0]===CQn.n[1]? 'all '+CQn.n[0] : CQn.n[0]+'–'+CQn.n[1]} ${CQn.unit}, ${(CQn.start[0]*CQn.dk).toLocaleString('en-US')}–${(CQn.start[1]*CQn.dk).toLocaleString('en-US')} troops each</span>` : (bw.asc? `👑 ★${bw.asc} ASCENSION CLEARED!` : '👑 CONQUEST COMPLETE — THE WORLD IS UNITED!')+`<span class="unl">${CH&&CH.lines.length? CH.lines.join(' · ') : 'Tribes, regions and nations — all under one banner.'}</span>`) : `${CQ.icon} ${CQ.name} — not won yet<span class="rec">Tip: take farms early, keep your capital guarded, strike rivals while they fight each other</span>`) : !solo? '' : win? (lv>=NL? `👑 STAGE ${lv} CLEARED — CAMPAIGN COMPLETE!<span class="unl">You have beaten all ${NL} bosses. Replay any stage for a better time.</span>` : `✔ STAGE ${lv} / ${NL} CLEARED`+(first? `<span class="unl">🔓 Stage ${lv+1} unlocked: ${BW_LEVELS[lv].name}</span>` : '')+(rec? '<span class="rec">⏱️ New best time!</span>' : '')) : `Stage ${lv} / ${NL} — not cleared yet<span class="rec">Tip: upgrade in the Armory, guard your farms, strike where the boss is thin</span>`;
  $('rStats').innerHTML=`<div>⏱️ Time: <b>${fmt(bw.time)}</b></div><div>🤝 Defected to you: <b>${bwN(bw.stats.eat)}</b> troops</div><div>⚔️ Battles won: <b>${bw.stats.win}</b></div><div>💥 Armies routed: <b>${bw.stats.lose}</b></div><div>👥 Peak strength: <b>${bwN(bw.stats.peak)}</b></div><div>🪙 Coins earned: <b>+${xu}</b>${bw.stats.coins? ` <span style="opacity:.8">(+${bw.stats.coins} paid during play)</span>` : ''}</div>`+extra.filter((l,i)=>!(CH6&&i===0)).map(l=>`<div class="rx">${l}</div>`).join('')+((save.ach&&save.ach.title)? `<div class="rx">🏅 ${save.ach.title}</div>` : '');
  $('rXu').innerHTML='';
  const solo1v1=!bw.royale&&!(bw.cfg&&bw.cfg.p2p);
  const next= !CH6 && ((solo1v1 && win && (lv<BW_LEVELS.length||EN>0)) || !!(CQ&&win&&CQn));
  $('bNext').classList.toggle('hidden',!next);
  if(next) $('bNext').textContent= CQ? `${CQn.icon} Begin the ${CQn.name} ▶` : EN? `∞ Endless ${EN+1} ▶` : `Next: Stage ${lv+1} ▶`;
  $('bNext').onclick= CQ? ()=>{ $('result').classList.add('hidden'); startConq(CQn.id); } : EN? ()=>{ $('result').classList.add('hidden'); startEndless(EN+1,bw.cfg.civ); } : ()=>{ $('result').classList.add('hidden'); G.bwCfg={civ:bw.cfg.civ}; startBigWar(Math.min(lv+1,BW_LEVELS.length)); };
  $('bAgain').classList.toggle('hidden',!!(bw.cfg&&bw.cfg.p2p)); // P2P: muốn đấu lại thì hai máy kết nối lại
  $('bAgain').textContent= CH6? '↻ Retry challenge' : CQ? (win? '🗺️ Conquest map' : `↻ Retry the ${CQ.name}`) : bw.royale? '🌏 New Warlords game' : '↻ Play again';
  $('bAgain').onclick= CH6? ()=>{ $('result').classList.add('hidden'); bwRestart(); } : CQ? ()=>{ $('result').classList.add('hidden'); if(win){ stopBigWar(false); G.world=null; Conquest.open(); } else startConq(CQ.id); } : ()=>{ $('result').classList.add('hidden'); if(bw.royale){ G.bwCfg={royale:36, seed: 61+((Math.random()*999)|0), civ:bw.cfg.civ, diff:bw.cfg.diff, bio:1}; startBigWar(5); } else bwRestart(); };
  $('bRMenu').onclick=()=>{ stopBigWar(false); G.world=null; showScreen('menu'); setupMenus(); };
  if(win){ audio.win(); } $('result').classList.remove('hidden'); $('bwbar').classList.add('hidden');
}
// ---------- vòng lặp ----------
// ===== ⏱️ NHỊP KHUNG HÌNH (5.1): mượt lúc thao tác, đỡ tốn pin lúc chỉ ngồi xem =====
// • Đang chạm / kéo / thu phóng / máy quay đang lia: vẽ theo màn hình, tối đa ~90 khung/giây (màn 120 Hz → 60, không vẽ thừa).
// • Không chạm quá 2 giây và máy quay đứng yên: 30 khung/giây (quân vẫn đi đều — mô phỏng tính theo thời gian thật). Đang tạm dừng: 10.
// • Độ phân giải vẽ: tối đa 2.0× và ĐỨNG YÊN; chỉ hạ một nấc khi máy chậm kéo dài, không tự tăng lại giữa phiên chơi.
//   (Bản 5.0 cứ 6 giây lại đổi độ phân giải → hình lúc mờ lúc nét và khựng mỗi lần đổi: đó là lỗi "giật nghiêm trọng".)
const PACE={last:0,inT:0,slow:0,skip:0,drawn:0,drops:0,act:true,MAX:2};
function paceInput(){ PACE.inT=performance.now(); }
['pointerdown','pointermove','pointerup','touchstart','touchmove','wheel','keydown'].forEach(ev=>window.addEventListener(ev,paceInput,{passive:true,capture:true}));
function paceActive(now){ if(now-PACE.inT<2000) return true; const bw=G.bw; if(!bw) return !!(G.world&&G.ren);
  return !!(bw.camDrag!=null||bw.intro||bw.jumpT||bw.box||bw._btlSeen>0||bw.shake*(bw.scale||1)>0.5||Math.abs((bw.zoom||1)-(bw.zoomTgt||1))>0.004); }   /* có trận đang đánh trong khung nhìn thì vẫn vẽ đủ nhịp */
function paceDpr(gap,act){ if(!G.dprCap) G.dprCap=PACE.MAX; const bw=G.bw;
  if(!bw||G.paused||document.hidden||gap>400||bw.intro||(bw.time||0)<4){ PACE.slow=Math.max(0,PACE.slow-gap); return; }   /* mới vào trận còn dựng bản đồ: chưa đánh giá */
  const late= gap>(act? 16.7 : 33.4)*1.75;                                   /* dưới ~34 khung/giây lúc thao tác, dưới ~17 lúc nghỉ */
  PACE.slow= late? PACE.slow+gap : Math.max(0,PACE.slow-gap*1.5);
  if(PACE.slow>5000){ PACE.slow=0; if(G.dprCap>1.25&&(devicePixelRatio||1)>1.25){ G.dprCap= G.dprCap>1.5? 1.5 : 1.25; PACE.drops++; } } }
function frame(now){
  { const act=paceActive(now), gap=now-PACE.last;
    if(gap<(G.paused? 95 : act? 10.5 : 31.5)){ PACE.skip++; requestAnimationFrame(frame); return; }
    PACE.last=now; PACE.act=act; PACE.drawn++; paceDpr(gap,act); }
  const dt=Math.min(0.1,(now-G.last)/1000); G.last=now;
  if(G.bw){
    const bw=G.bw; const cv=$('game'); const rct=cv.getBoundingClientRect(); const dpr=Math.min(G.dprCap||PACE.MAX,devicePixelRatio||1);
    if(typeof P2P!=='undefined') P2P.tick(dt);
    if(cv.width!==Math.round(rct.width*dpr)||cv.height!==Math.round(rct.height*dpr)){ cv.width=Math.round(rct.width*dpr); cv.height=Math.round(rct.height*dpr); }
    bw.scale=Math.min(rct.height/BW.H, rct.width/1700);
    bw._idle=!PACE.act; bw._touch=ptrs.size;   /* cho bộ dựng bản đồ biết: đang rảnh (dựng sẵn vùng lân cận) hay ngón tay đang kéo (không dựng) */
    if(!G.paused) (bw.p2p==='guest'? bw.cosmetic(Math.min(0.05,dt)) : bw.update(Math.min(0.05,dt)));
    bw.draw(cv.getContext('2d'), rct.width, rct.height, dpr, now/1000, dt);
    if(bw.tut&&bw.tut.done&&!G.tutShown){ tutFinish(); requestAnimationFrame(frame); return; }
    if(bw.over && !G.resultShown){ G.bwTimer=(G.bwTimer||0)+dt; if(G.bwTimer>1.4){ G.bwTimer=0; showBwResult(); } }
    requestAnimationFrame(frame); return;
  }
  const w=G.world;
  if(w && G.ren){
    if(!G.paused && !w.over){ G.acc+=dt*G.speed; let n=0; while(G.acc>=DT && n<10){ for(const u of w.units){ u.ox=u.px; u.oy=u.py; } w.step(); G.acc-=DT; n++; } if(n>=10) G.acc=0; }
    if(G.keys){ const cam=G.ren.cam, sp=600*dt/cam.z; if(G.keys.has('arrowleft')) cam.x-=sp; if(G.keys.has('arrowright')) cam.x+=sp; if(G.keys.has('arrowup')||G.keys.has('w')) cam.y-=sp; if(G.keys.has('arrowdown')||G.keys.has('s')) cam.y+=sp; if(G.keys.has('d')) cam.x+=sp; }
    G.ren.consumeFx(audio);
    G.ren.draw(dt, Math.min(1,G.acc/DT));
    G.hudT-=dt; if(G.hudT<=0){ G.hudT=0.12; updateHud(); updateSel(); pollEvents(); tutorial(); }
    G.mmT-=dt; if(G.mmT<=0){ G.mmT=0.25; drawMinimap(); }
    pumpHint(dt);
    // nhạc căng hơn khi gần Trống/giao tranh
    audio.tension = w.drum.holder>=0||w.drum.contested ? 1 : 0;
    if(w.over && !G.resultShown){ G.resultTimer=(G.resultTimer||0)+dt; if(G.resultTimer>1.6){ G.resultTimer=0; showResult(); } }
  }
  requestAnimationFrame(frame);
}
window.__ltm={ G, startBigWar, royaleSave, royaleResume, royaleLoadInfo, get BigWar(){return BigWar;}, get bwResolve(){return bwResolve;}, get bw(){return G.bw;}, get world(){return G.world;}, set world(v){}, startLevel, onTap, act, setSel, unitAtScreen, toScreen:(x,y)=>G.ren.toScreen((x+0.5)*TS,(y+0.5)*TS),
  stepSec(s){ const w=G.world; for(let i=0;i<s/DT;i++){ for(const u of w.units){u.ox=u.px;u.oy=u.py;} w.step(); if(w.over) break; } } };
window.addEventListener('resize',()=>{ if(G.ren) G.ren.resize(); rotSync(); });
window.addEventListener('orientationchange',()=>setTimeout(()=>{ if(G.ren) G.ren.resize(); rotSync(); },300));
document.addEventListener('visibilitychange',()=>{ if(document.hidden && G.world && !G.world.over && !G.paused) pause(true); });
$('rotate').onclick=()=>{ clearTimeout(G._rotT); $('rotate').classList.add('off'); };
// trong app (APK/iOS) màn hình đã tràn viền sẵn: nút ⛶ vô dụng nên ẩn đi
const IS_NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
if(IS_NATIVE){ for(const id of ['bFull','bwFull']){ const e=$(id); if(e) e.style.display='none'; } }
// app chuyển nền / tắt màn hình: tắt nhạc ngay, quay lại thì bật tiếp
document.addEventListener('visibilitychange',()=>{ const c=audio&&audio.ctx; if(!c) return; try{ if(document.hidden) c.suspend(); else c.resume(); }catch(e){} });
loadArt(); setupInput(); try{ setupMenus(); }catch(e){} menuBg();   /* menu dựng lại ở cuối các tệp nạp sau (09j, 09l): lỗi thứ tự nạp ở đây không được làm hỏng cả game */ refreshXu(); rotSync(); setTimeout(rotSync,400); requestAnimationFrame(frame);

// ===== ⛶ TOÀN MÀN HÌNH =====
function goFullscreen(){
  const el=document.documentElement;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const req= el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen;
  if(document.fullscreenElement||document.webkitFullscreenElement){ (document.exitFullscreen||document.webkitExitFullscreen).call(document); return; }
  if(req){ try{ const p=req.call(el,{navigationUI:'hide'}); p&&p.catch&&p.catch(()=>{});
      if(screen.orientation&&screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{});
      return; }catch(e){} }
  if(isIOS&&!standalone){ toast('📲 iPhone/iPad: tap Safari\'s Share button → "Add to Home Screen" to play full-screen like an app!',4); }
}
function toast(msg,sec){ if(msg&&typeof msg==='object') msg=msg.text||''; let t=document.getElementById('ltmToast');   /* nhận cả dạng {text,kind} */
  if(!t){ t=document.createElement('div'); t.id='ltmToast';
    t.style.cssText='position:fixed;left:50%;bottom:14%;transform:translateX(-50%);background:rgba(25,15,45,0.95);color:#ffe9c9;padding:12px 18px;border-radius:14px;font:800 15px "Baloo 2",system-ui;z-index:99;max-width:86vw;text-align:center;border:2px solid #ffd54a;pointer-events:none';
    document.body.appendChild(t); }
  t.textContent=msg; t.style.display='block'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.display='none',(sec||3)*1000); }
