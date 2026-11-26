// ============ 📅🏆 (6.0) THỬ THÁCH NGÀY / TUẦN · THÀNH TỰU & DANH HIỆU ============
// • Thử thách NGÀY: một trận 1v1 cố định theo ngày (cùng bản đồ, cùng nước, cùng luật đặc biệt), mục tiêu: thắng trong giới hạn thời gian.
//   Đạt lần đầu trong ngày: +15 xu, chuỗi ngày liên tiếp +5 xu/ngày (tối đa +25). Không cần mạng: sinh từ ngày tháng trên máy.
// • Thử thách TUẦN: một trận Bộ lạc cố định theo tuần với 2 luật đặc biệt, mục tiêu: thống nhất trong 20 phút. Đạt lần đầu trong tuần: +60 xu.
//   Trận thử thách không tự lưu (thoát là bỏ) — để không đè ván chiến dịch / chinh phạt đang lưu.
// • THÀNH TỰU: 40 mục, mỗi mục thưởng xu; một số mục mở DANH HIỆU hiện ở màn chính và màn kết quả.
BW.chal={ dayXu:15, streakXu:5, streakMax:25, weekXu:60, dayLim:12*60, weekLim:20*60 };
function chalDayKey(d){ d=d||new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); }
function chalWeekKey(d){ d=d||new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)); return t.getUTCFullYear()*100+Math.ceil(((t-y0)/86400000+1)/7); }
// cấu hình trận thử thách (cố định theo khoá ngày/tuần)
BW.chalCfg=function(kind,key){ const R=mulberry32(key*2654435761%4294967291+(kind==='w'?77:13)), pick=(a)=>a[(R()*a.length)|0];
  const civ=pick(BW_CIVS).id, mutN= kind==='w'? 2 : 1, ids=BW_MUT_IDS.slice(), mut=[]; for(let i=0;i<mutN;i++) mut.push(ids.splice((R()*ids.length)|0,1)[0]);
  if(kind==='d'){ const lv=3+((R()*6)|0); return {kind,key,lv,lim:BW.chal.dayLim,cfg:{civ,chal:'d',chalKey:key,mut,map:(lv-1)*3+((R()*3)|0),seed:1000+(key%997)}}; }
  const n=9+((R()*4)|0), S=BW_CONQ.tribe; return {kind,key,lv:5,lim:BW.chal.weekLim,cfg:{royale:n-1,conq:'tribe',chal:'w',chalKey:key,mut,civ,diff:1,bio:1,seed:5000+(key%9973),L:{camp:S.camp}}}; };
function chalState(){ const c=save.chal||(save.chal={d:{},w:{},streak:0,last:0,done:0,wdone:0}); if(!c.d) c.d={}; if(!c.w) c.w={}; return c; }
// ngày liền trước của một khoá ngày
function chalPrevDay(key){ const y=(key/10000)|0, m=((key/100)|0)%100, d=key%100; const t=new Date(y,m-1,d); t.setDate(t.getDate()-1); return chalDayKey(t); }

// ---------- THÀNH TỰU ----------
// test(s): s = dữ liệu lưu; trả true khi đạt. lt = thống kê trọn đời (cập nhật sau mỗi trận).
const BW_ACH=[
  // ⚔️ Chiến dịch 1v1
  {id:'c1',  cat:'Campaign', icon:'🗡️', name:'First Blood',        desc:'Clear Stage 1 of the campaign',          xu:10, test:(s)=>(s.bwMax||1)>=2},
  {id:'c5',  cat:'Campaign', icon:'⚔️', name:'Halfway There',      desc:'Clear Stage 5',                          xu:20, test:(s)=>(s.bwMax||1)>=6},
  {id:'c10', cat:'Campaign', icon:'📜', name:'Beat the War Sage',  desc:'Clear Stage 10 — defeat Sun Tzu',        xu:50, title:'War Sage', test:(s)=>(s.bwMax||1)>=11},
  {id:'e15', cat:'Campaign', icon:'♾️', name:'Into the Endless',   desc:'Clear Endless Stage 15',                 xu:40, test:(s)=>(s.camp&&s.camp.endless|0)>=15},
  {id:'e20', cat:'Campaign', icon:'🌀', name:'Endless One',        desc:'Clear Endless Stage 20',                 xu:60, title:'Endless One', test:(s)=>(s.camp&&s.camp.endless|0)>=20},
  {id:'e30', cat:'Campaign', icon:'🌌', name:'Beyond the Horizon', desc:'Clear Endless Stage 30',                 xu:100, test:(s)=>(s.camp&&s.camp.endless|0)>=30},
  {id:'q1',  cat:'Conquest', icon:'🪓', name:'Chieftain',          desc:'Unite the tribes (win Tribal Wars)',     xu:15, test:(s)=>(s.lt&&s.lt.q1|0)>0||(s.conq&&s.conq.stage|0)>=1},
  {id:'q2',  cat:'Conquest', icon:'👑', name:'Kingmaker',          desc:'Win the Civil War',                      xu:25, test:(s)=>(s.lt&&s.lt.q2|0)>0||(s.conq&&s.conq.stage|0)>=2},
  {id:'q3',  cat:'Conquest', icon:'🌏', name:'World Conqueror',    desc:'Win the Great War',                      xu:60, title:'Conqueror', test:(s)=>!!s.chronDone||(s.conq&&s.conq.stage|0)>=3},
  {id:'a3',  cat:'Conquest', icon:'⭐', name:'Rising Star',        desc:'Clear the ★3 Ascension',                 xu:40, test:(s)=>(s.ascMax|0)>=3},
  {id:'a5',  cat:'Conquest', icon:'🌟', name:'Five Stars',         desc:'Clear the ★5 Ascension',                 xu:60, test:(s)=>(s.ascMax|0)>=5},
  {id:'a10', cat:'Conquest', icon:'💫', name:'Ascended',           desc:'Clear the ★10 Ascension',                xu:150, title:'Ascended', test:(s)=>(s.ascMax|0)>=10},
  {id:'h5',  cat:'Conquest', icon:'📖', name:'Historian',          desc:'5 nations in the Chronicle',             xu:30, test:(s)=>Object.keys(s.chron||{}).length>=5},
  {id:'h22', cat:'Conquest', icon:'📚', name:'Half the World',     desc:'22 nations in the Chronicle',            xu:80, test:(s)=>Object.keys(s.chron||{}).length>=22},
  {id:'h44', cat:'Conquest', icon:'🏛️', name:'Emperor of All',     desc:'All 44 nations in the Chronicle',        xu:200, title:'Emperor of All', test:(s)=>Object.keys(s.chron||{}).length>=44},
  // 🗡️ Chiến trận (trọn đời)
  {id:'w100',  cat:'Battle', icon:'🥉', name:'Seasoned',           desc:'Win 100 battles',                        xu:20, test:(s)=>(s.lt&&s.lt.bw|0)>=100},
  {id:'w1000', cat:'Battle', icon:'🥈', name:'Veteran',            desc:'Win 1,000 battles',                      xu:60, test:(s)=>(s.lt&&s.lt.bw|0)>=1000},
  {id:'w5000', cat:'Battle', icon:'🥇', name:'Warlord',            desc:'Win 5,000 battles',                      xu:120, title:'Warlord', test:(s)=>(s.lt&&s.lt.bw|0)>=5000},
  {id:'amb10', cat:'Battle', icon:'🌿', name:'Hidden Blade',       desc:'Win 10 ambushes',                        xu:20, test:(s)=>(s.lt&&s.lt.amb|0)>=10},
  {id:'amb100',cat:'Battle', icon:'🥷', name:'Shadow General',     desc:'Win 100 ambushes',                       xu:60, title:'Shadow', test:(s)=>(s.lt&&s.lt.amb|0)>=100},
  {id:'cap10', cat:'Battle', icon:'🏰', name:'Camp Breaker',       desc:'Capture 10 enemy camps',                 xu:20, test:(s)=>(s.lt&&s.lt.caps|0)>=10},
  {id:'cap100',cat:'Battle', icon:'🏯', name:'Siege Master',       desc:'Capture 100 enemy camps',                xu:60, test:(s)=>(s.lt&&s.lt.caps|0)>=100},
  {id:'def10k',cat:'Battle', icon:'🤝', name:'Persuader',          desc:'10,000 troops defect to you (lifetime)',  xu:20, test:(s)=>(s.lt&&s.lt.eat|0)>=10000},
  {id:'def200k',cat:'Battle',icon:'🎺', name:'Banner of Many',     desc:'200,000 troops defect to you (lifetime)', xu:60, test:(s)=>(s.lt&&s.lt.eat|0)>=200000},
  {id:'quick', cat:'Battle', icon:'⚡', name:'Lightning War',      desc:'Win a 1v1 stage in under 6 minutes',     xu:30, title:'Lightning', test:(s)=>(s.lt&&s.lt.quick|0)>0},
  {id:'g20k',  cat:'Battle', icon:'🐘', name:'Grand Army',         desc:'Reach 20,000 troops in one battle',      xu:30, test:(s)=>(s.lt&&s.lt.peak|0)>=20000},
  // 📅 Thử thách
  {id:'dly1',  cat:'Challenges', icon:'📅', name:'Daily Duty',     desc:'Complete a daily challenge',             xu:10, test:(s)=>(s.chal&&s.chal.done|0)>=1},
  {id:'dly7',  cat:'Challenges', icon:'🗓️', name:'Week of Duty',   desc:'Complete 7 daily challenges',            xu:30, test:(s)=>(s.chal&&s.chal.done|0)>=7},
  {id:'dly30', cat:'Challenges', icon:'📆', name:'Ever-Ready',     desc:'Complete 30 daily challenges',           xu:80, title:'Ever-Ready', test:(s)=>(s.chal&&s.chal.done|0)>=30},
  {id:'str7',  cat:'Challenges', icon:'🔥', name:'On Fire',        desc:'7-day daily challenge streak',           xu:50, test:(s)=>(s.chal&&s.chal.best|0)>=7},
  {id:'wk1',   cat:'Challenges', icon:'🏕️', name:'Weekend Warrior',desc:'Complete a weekly challenge',            xu:20, test:(s)=>(s.chal&&s.chal.wdone|0)>=1},
  {id:'wk5',   cat:'Challenges', icon:'🏆', name:'Seasoned Raider', desc:'Complete 5 weekly challenges',          xu:60, test:(s)=>(s.chal&&s.chal.wdone|0)>=5},
  // 🎖️ Tướng lĩnh
  {id:'gen1',  cat:'Generals', icon:'🎖️', name:'First Officer',    desc:'Recruit your first general',             xu:10, test:(s)=>Object.keys((s.gen&&s.gen.own)||{}).length>=1},
  {id:'gen8',  cat:'Generals', icon:'🏅', name:'Lord of Heroes',   desc:'Recruit all 8 generals',                 xu:80, title:'Lord of Heroes', test:(s)=>Object.keys((s.gen&&s.gen.own)||{}).length>=BW_GENERALS.length},
  {id:'genL5', cat:'Generals', icon:'⭐', name:'Legendary General',desc:'Raise a general to level 5',             xu:50, test:(s)=>Object.values((s.gen&&s.gen.own)||{}).some(x=>BW.genLevel(x)>=5)},
  {id:'slot2', cat:'Generals', icon:'👥', name:'Twin Banners',     desc:'Open the second general slot',           xu:20, test:(s)=>!!(s.gen&&s.gen.slot2)},
  // 🪙 Kho
  {id:'dec5',  cat:'Armory', icon:'🏮', name:'Decorator',          desc:'Own 5 camp decorations',                 xu:20, test:(s)=>Object.keys((s.decor&&s.decor.own)||{}).length>=5},
  {id:'dec15', cat:'Armory', icon:'🎆', name:'Festival Camp',      desc:'Own 15 camp decorations',                xu:50, test:(s)=>Object.keys((s.decor&&s.decor.own)||{}).length>=15},
  {id:'forge5',cat:'Armory', icon:'⚒️', name:'Master Smith',       desc:'Max out one Forge upgrade',              xu:30, test:(s)=>Object.values(s.up||{}).some(v=>(v|0)>=5)},
  {id:'xu1k',  cat:'Armory', icon:'🪙', name:'Treasure Keeper',    desc:'Earn 1,000 coins in total',              xu:30, test:(s)=>(s.lt&&s.lt.xu|0)>=1000},
];
const BW_ACH_BY={}; for(const a of BW_ACH) BW_ACH_BY[a.id]=a;
// soát thành tựu mới đạt: cộng xu, báo bằng toast (trừ khi quiet); trả danh sách vừa đạt
function achCheck(quiet){ const A=save.ach||(save.ach={done:{},title:null}); if(!A.done) A.done={}; const got=[];
  for(const a of BW_ACH){ if(A.done[a.id]) continue; let ok=false; try{ ok=!!a.test(save); }catch(e){} if(ok){ A.done[a.id]=Date.now(); got.push(a); save.xu=(save.xu||0)+a.xu; if(a.title&&!A.title) A.title=a.title; } }
  if(got.length){ Save.set(save); refreshXu(); titleSync(); if(!quiet) got.slice(0,3).forEach((a,i)=>setTimeout(()=>toast({text:`🏆 ${a.name} — +${a.xu} coins${a.title? ' · title “'+a.title+'”' : ''}`,kind:'good'},3.2),i*700)); }
  return got; }
function titleSync(){ const A=save.ach||{}, el=$('menuTitle'), bd=$('achBadge'); if(bd) bd.textContent=Object.keys(A.done||{}).length+'/'+BW_ACH.length; if(el){ el.textContent= A.title? '🏅 '+A.title : ''; el.style.display= A.title? '' : 'none'; } }
// thống kê trọn đời sau mỗi trận (P2P và hướng dẫn không tính)
function ltAfter(bw,win,xu){ const L=save.lt||(save.lt={}); const st=bw.stats||{};
  L.games=(L.games|0)+1; if(win) L.wins=(L.wins|0)+1; L.bw=(L.bw|0)+(st.win|0); L.amb=(L.amb|0)+(st.amb|0); L.caps=(L.caps|0)+(st.caps|0); L.eat=(L.eat|0)+Math.round(st.eat||0);
  L.peak=Math.max(L.peak|0, +bwN(st.peak||0)); L.xu=(L.xu|0)+(xu|0)+(st.coins|0);
  if(win&&!bw.royale&&!bw.endless&&!(bw.cfg&&bw.cfg.chal)&&bw.time<360) L.quick=(L.quick|0)+1;
  if(win&&bw.conq==='tribe'&&!(bw.cfg&&bw.cfg.chal)) L.q1=(L.q1|0)+1; if(win&&bw.conq==='civil') L.q2=(L.q2|0)+1; }
// kết quả trận thử thách: trả {ok, lines}
function chalAfter(bw,win){ const cf=bw.cfg||{}; if(!cf.chal) return null; const C=chalState(), kind=cf.chal, key=cf.chalKey, lim= kind==='w'? BW.chal.weekLim : BW.chal.dayLim, t=Math.round(bw.time), ok= win&&t<=lim, lines=[];
  const slot= kind==='w'? C.w : C.d; if(slot.key!==key){ slot.key=key; slot.best=0; slot.done=0; }
  if(ok){ if(!slot.best||t<slot.best) slot.best=t;
    if(!slot.done){ slot.done=1; let xu= kind==='w'? BW.chal.weekXu : BW.chal.dayXu;
      if(kind==='d'){ C.streak= C.last===chalPrevDay(key)? (C.streak|0)+1 : 1; C.last=key; C.done=(C.done|0)+1; C.best=Math.max(C.best|0,C.streak); const sb=Math.min(BW.chal.streakMax,BW.chal.streakXu*(C.streak-1)); xu+=sb; lines.push(`📅 Daily challenge complete! +${xu} coins`+(C.streak>1? ` (🔥 ${C.streak}-day streak +${sb})` : '')); }
      else { C.wdone=(C.wdone|0)+1; lines.push(`🏕️ Weekly challenge complete! +${xu} coins`); }
      save.xu=(save.xu||0)+xu; }
    else lines.push(`✔ Challenge already done — best time ${fmt(slot.best)}`); }
  else lines.push(win? `⏱️ Too slow: ${fmt(t)} — the goal is ${fmt(lim)}` : `${kind==='w'? '🏕️ Weekly' : '📅 Daily'} challenge failed — try again!`);
  Save.set(save); return {ok,lines}; }

// ---------- MÀN THỬ THÁCH ----------
const Chal={
  open(){ this.render(); $('chalScr').classList.remove('hidden'); $('chalBack').onclick=()=>{ audio.click(); $('chalScr').classList.add('hidden'); $('bossPick').classList.remove('hidden'); setupMenus(); }; },
  render(){ const C=chalState(), dk=chalDayKey(), wk=chalWeekKey(), D=BW.chalCfg('d',dk), W=BW.chalCfg('w',wk), box=$('chalList'); box.innerHTML='';
    const streakNow= (C.last===dk||C.last===chalPrevDay(dk))? (C.streak|0) : 0;
    $('chalProg').innerHTML=`<span>🔥 Streak ${streakNow} · ✔ ${C.done|0} daily · ${C.wdone|0} weekly</span>`;
    for(const X of [D,W]){ const slot= X.kind==='w'? C.w : C.d, done= slot.key===X.key&&slot.done, best= slot.key===X.key? slot.best : 0, cv=BW_CIV[X.cfg.civ], b=document.createElement('button'); b.className='stg '+(done? 'cleared' : 'cur'); b.dataset.chal=X.kind;
      const muts=X.cfg.mut.map(m=>BW_MUT[m].icon+' '+BW_MUT[m].name).join(' · '), what= X.kind==='w'? `🪓 Tribal map · ${X.cfg.royale+1} tribes` : `⚔️ 1v1 vs a Stage ${X.lv} boss`;
      const rew= X.kind==='w'? `+${BW.chal.weekXu}` : `+${BW.chal.dayXu}`+(streakNow? ` (+${Math.min(BW.chal.streakMax,BW.chal.streakXu*streakNow)} streak)` : '');
      b.innerHTML=`<i class="no">${X.kind==='w'? '🏕️' : '📅'}</i><span class="nm"><b>${X.kind==='w'? 'Weekly' : 'Daily'} challenge</b><small>${what} · play as ${cv? cv.icon+' '+cv.name : ''}</small><small>${muts} · 🎯 win within ${fmt(X.lim)} · 🪙 ${rew}</small></span><em>${done? '✔ Done'+(best? '<br>⏱️ '+fmt(best) : '') : '▶ PLAY'}</em>`;
      b.onclick=()=>{ audio.click(); this.play(X); }; box.appendChild(b); } },
  play(X){ $('chalScr').classList.add('hidden'); G.bwCfg=Object.assign({},X.cfg,{mut:X.cfg.mut.slice()}); startBigWar(X.lv); },
};
// ---------- MÀN THÀNH TỰU ----------
const Ach={
  open(){ achCheck(true); this.render(); $('achScr').classList.remove('hidden'); $('achBack').onclick=()=>{ audio.click(); $('achScr').classList.add('hidden'); showScreen('menu'); setupMenus(); }; },
  render(){ const A=save.ach||(save.ach={done:{},title:null}), n=Object.keys(A.done||{}).length; $('achProg').innerHTML=`<span>${n}/${BW_ACH.length} unlocked</span>`;
    const tl=$('achTitles'), titles=BW_ACH.filter(a=>a.title&&A.done[a.id]).map(a=>a.title);
    tl.innerHTML= titles.length? 'Title: '+['',...titles].map(t=>`<button class="btn${(A.title||'')===t?' on':''}" data-title="${t}">${t||'None'}</button>`).join('') : '<span style="opacity:.75">Unlock achievements marked 🏅 to earn a title shown on your menu.</span>';
    tl.querySelectorAll('[data-title]').forEach(b=>b.onclick=()=>{ audio.click(); A.title=b.dataset.title||null; Save.set(save); titleSync(); this.render(); });
    const g=$('achGrid'); g.innerHTML=''; let cat='';
    for(const a of BW_ACH){ if(a.cat!==cat){ cat=a.cat; const h=document.createElement('div'); h.className='agroup'; h.textContent=cat; g.appendChild(h); }
      const d=document.createElement('div'), ok=!!A.done[a.id]; d.className='ach '+(ok? 'on' : 'off'); d.dataset.ach=a.id;
      d.innerHTML=`<i class="em">${a.icon}</i><span><b>${a.name}</b><small>${a.desc}</small><small class="rw">${ok? '✔ ' : ''}🪙 +${a.xu}${a.title? ' · 🏅 '+a.title : ''}</small></span>`; g.appendChild(d); } },
};
if(typeof setupMenus==='function'){ try{ setupMenus(); }catch(e){} }   /* dựng lại menu khi phần thử thách / thành tựu đã nạp */
try{ titleSync(); setTimeout(()=>{ try{ if(!G.bw) achCheck(false); }catch(e){} },1500); }catch(e){}   /* người chơi cũ: thành tựu đã đạt được trao luôn (có báo) */
