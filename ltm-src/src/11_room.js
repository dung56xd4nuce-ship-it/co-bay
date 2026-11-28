// ============ 👥 (7.0) PHÒNG WiFi 2–8 NGƯỜI — không máy chủ ============
// Lan: đường truyền trong mạng nội bộ. Trên app Android: plugin gốc "LanPlay" (máy chủ phòng mở cổng TCP, phát tín hiệu UDP để máy khác tìm thấy).
//      Trên trình duyệt (bài thử): nối qua một trạm chuyển tiếp WebSocket đặt ở localStorage 'ltm_lan_dev'.
// Room: phòng chờ + chuyển tin trong trận. Chủ phòng chạy mô phỏng (như P2P 2 người), khách gửi thao tác và nhận ảnh trạng thái.
const Lan={
  nat:null, ws:null, role:null, onPeer:null, onMsg:null, onClosed:null, onRoom:null, _subs:[],
  native(){ try{ if(this.nat) return this.nat; const C=window.Capacitor; if(C&&C.isNativePlatform&&C.isNativePlatform()&&C.getPlatform&&C.getPlatform()==='android'){
      if(C.Plugins&&C.Plugins.LanPlay&&C.Plugins.LanPlay.host) this.nat=C.Plugins.LanPlay;
      else if(C.registerPlugin) this.nat=C.registerPlugin('LanPlay');
      else if(C.nativePromise){ const P={ addListener:(ev,cb)=>C.addListener('LanPlay',ev,cb) }; for(const m of ['host','setInfo','scan','stopScan','join','send','close']) P[m]=(o)=>C.nativePromise('LanPlay',m,o||{}); this.nat=P; }
      return this.nat||null; } }catch(e){} return null; },
  dev(){ try{ return localStorage.getItem('ltm_lan_dev')||''; }catch(e){ return ''; } },
  avail(){ return !!(this.native()||this.dev()); },
  async _listen(){ const N=this.native(); if(!N||this._subs.length) return;
    this._subs.push(await N.addListener('msg',(e)=>{ let o; try{ o=JSON.parse(e.data); }catch(err){ return; } this.onMsg&&this.onMsg(e.from,o); }));
    this._subs.push(await N.addListener('peer',(e)=>{ this.onPeer&&this.onPeer(e.id,!!e.on); }));
    this._subs.push(await N.addListener('closed',()=>{ const f=this.onClosed; this.role=null; f&&f(); }));
    this._subs.push(await N.addListener('room',(e)=>{ this.onRoom&&this.onRoom(e); })); },
  _devOpen(first){ return new Promise((res,rej)=>{ let done=false; const ws=this.ws=new WebSocket(this.dev());
      ws.onopen=()=>{ ws.send(JSON.stringify(first)); };
      ws.onmessage=(ev)=>{ let m; try{ m=JSON.parse(ev.data); }catch(e){ return; }
        if(m.t==='hosted'||m.t==='joined'||m.t==='scanning'){ done=true; res(m); }
        else if(m.t==='error'){ done=true; rej(new Error(m.why||'error')); }
        else if(m.t==='room'){ this.onRoom&&this.onRoom(m); }
        else if(m.t==='peer'){ this.onPeer&&this.onPeer(m.id,!!m.on); }
        else if(m.t==='msg'){ this.onMsg&&this.onMsg(m.from,m.data); } };
      ws.onclose=()=>{ if(!done){ done=true; rej(new Error('closed')); } else if(this.ws===ws&&this.role){ const f=this.onClosed; this.role=null; this.ws=null; f&&f(); } };
      ws.onerror=()=>{ if(!done){ done=true; rej(new Error('no relay')); } }; }); },
  async host(name){ this.close(); const N=this.native();
    if(N){ await this._listen(); const r=await N.host({name}); this.role='host'; return r; }
    const r=await this._devOpen({t:'host',name}); this.role='host'; return r; },
  info(o){ const N=this.native(); if(N){ N.setInfo(o).catch(()=>{}); } else if(this.ws&&this.ws.readyState===1) this.ws.send(JSON.stringify(Object.assign({t:'info'},o))); },
  async scan(){ const N=this.native(); if(N){ await this._listen(); await N.scan(); return; }
    if(this.role) return; try{ await this._devOpen({t:'scan'}); }catch(e){} },
  stopScan(){ const N=this.native(); if(N){ N.stopScan().catch(()=>{}); } else if(this.ws&&!this.role){ try{ this.ws.close(); }catch(e){} this.ws=null; } },
  async join(addr){ const N=this.native();
    if(N){ await this._listen(); await N.stopScan().catch(()=>{}); const r=await N.join({ip:addr}); this.role='guest'; return r; }
    if(this.ws){ try{ this.ws.onclose=null; this.ws.close(); }catch(e){} this.ws=null; }
    const r=await this._devOpen({t:'join',ip:addr}); this.role='guest'; return r; },
  send(to,o){ const N=this.native();
    if(N){ N.send({to: to==null? -1 : to, data:JSON.stringify(o)}).catch(()=>{}); }
    else if(this.ws&&this.ws.readyState===1) this.ws.send(JSON.stringify({t:'send',to: to==null? -1 : to,data:o})); },
  close(){ const N=this.native(); this.role=null; if(N){ N.close().catch(()=>{}); } if(this.ws){ try{ this.ws.onclose=null; this.ws.close(); }catch(e){} this.ws=null; } },
};
const Room={
  role:null, seats:[], peers:{}, bots:0, me:0, started:false, rooms:{}, code:'',
  myName(){ if(!save.pname){ save.pname='Player '+(100+((Math.random()*900)|0)); Save.set(save); } return save.pname; },
  open(){ showScreen('lan'); this.leave(true); this.view('home');
    const lab=()=>{ const c=BW_CIV[save.civ]; $('lanCiv').textContent= c? `🏛️ ${c.icon} ${c.name} — change` : '🏛️ Choose your civilization'; }; lab();
    $('lanCiv').onclick=()=>{ audio.click(); CivPick.open({go:'✔ Choose', onPick:()=>{ showScreen('lan'); lab(); }, onBack:()=>{ showScreen('lan'); }}); };
    const nm=$('lanName'); nm.value=this.myName(); nm.onchange=()=>{ const v=nm.value.replace(/[<>&"]/g,'').trim().slice(0,16); if(v){ save.pname=v; Save.set(save); } nm.value=this.myName(); };
    $('lanHost').onclick=()=>{ audio.init(); this.host(); }; $('lanJoin').onclick=()=>{ audio.init(); this.browse(); };
    $('lanOld').onclick=()=>{ audio.click(); P2P.open(); }; $('lanClose').onclick=()=>{ audio.click(); this.leave(true); showScreen('menu'); };
    $('lanNo').classList.toggle('hidden',Lan.avail()); $('lanHost').disabled=$('lanJoin').disabled=!Lan.avail(); },
  view(v){ for(const k of ['home','browse','lobby']) $('lan_'+k).classList.toggle('hidden',k!==v); },
  msg(t){ $('lanMsg').textContent=t||''; },
  wire(){ Lan.onMsg=(from,m)=>this.onMsg(from,m); Lan.onPeer=(id,on)=>this.onPeer(id,on); Lan.onClosed=()=>this.onClosed(); Lan.onRoom=(r)=>this.onRoom(r); },
  // ----- chủ phòng -----
  async host(){ this.wire(); this.msg('Opening the room…');
    try{ const r=await Lan.host(this.myName()); this.role='host'; this.code=r.code||r.ip||''; this.peers={}; this.bots=0; this.started=false; this.me=0;
      this.seats=[{name:this.myName(),civ:save.civ||null,id:-1}]; this.view('lobby'); this.render(); this.msg(''); }
    catch(e){ this.msg('Could not open a room: '+(e&&e.message||e)); } },
  total(){ return this.seats.length+this.bots; },
  sync(){ if(this.role!=='host') return; Lan.info({n:this.seats.length,max:BW.MP_MAX,open:this.started?0:1});
    const L=this.seats.map(s=>({name:s.name,civ:s.civ})); for(const s of this.seats) if(s.id>=0) Lan.send(s.id,{op:'lobby',seats:L,bots:this.bots,you:this.seats.indexOf(s)}); this.render(); },
  onPeer(id,on){ if(this.role!=='host') return;
    if(!on){ const k=this.seats.findIndex(s=>s.id===id); if(k<0) return; const s=this.seats[k];
      if(this.started){ s.gone=1; if(G.bw&&G.bw.cfg.mp) G.bw.mpLeave(s.fid); }
      else { this.seats.splice(k,1); this.sync(); } } },
  // ----- khách -----
  async browse(){ this.wire(); this.rooms={}; this.view('browse'); this.renderRooms(); this.msg('Looking for rooms on this Wi-Fi…'); $('lanCode').value='';
    $('lanCodeGo').onclick=()=>{ const v=$('lanCode').value.trim(); if(v) this.join(v); };
    try{ await Lan.scan(); }catch(e){ this.msg('Could not search: '+(e&&e.message||e)); } },
  onRoom(r){ if(this.role) return; const k=r.ip; if(r.gone){ delete this.rooms[k]; } else this.rooms[k]=Object.assign({},r,{seen:performance.now()}); this.renderRooms(); },
  renderRooms(){ const el=$('lanRooms'); if(!el) return; const L=Object.values(this.rooms).filter(r=>performance.now()-r.seen<6000); el.innerHTML='';
    if(!L.length){ el.innerHTML='<div class="fd" style="opacity:.8;padding:8px 2px">No room found yet. Make sure every phone is on the <b>same Wi-Fi</b> (or on the host’s hotspot).</div>'; return; }
    for(const r of L){ const b=document.createElement('button'); b.className='btn big mode'; b.dataset.room=r.ip; const full=!r.open||r.n>=r.max;
      b.innerHTML=`<span class="mt"><b>🏠 ${String(r.name||'Room').replace(/[<>&]/g,'')}</b><small>${r.n||1}/${r.max||8} players${r.open? '' : ' · in battle'}${r.code? ' · code '+r.code : ''}</small></span>`; b.disabled=full; b.onclick=()=>{ audio.click(); this.join(r.ip); }; el.appendChild(b); } },
  async join(addr){ this.msg('Joining…');
    try{ await Lan.join(addr); this.role='guest'; this.started=false; this.seats=[]; this.view('lobby'); this.render(); this.msg('Connected — waiting for the host…');
      const hello=()=>Lan.send(null,{op:'hello',name:this.myName(),civ:save.civ||null}); hello(); clearInterval(this._hT); let n=0; this._hT=setInterval(()=>{ if(this.role!=='guest'||this.seats.length||++n>10){ clearInterval(this._hT); return; } hello(); },500); }
    catch(e){ this.role=null; this.msg('Could not join: '+(e&&e.message||e)); } },
  onClosed(){ const was=this.role; this.role=null; clearInterval(this._hT);
    if(was==='guest'){ if(this.started){ P2P.drop('The host has left the match.'); } else { this.view('home'); this.msg('The room was closed.'); } } },
  // ----- tin nhắn -----
  onMsg(from,m){ if(!m||typeof m!=='object') return;
    if(this.role==='host'){
      if(m.op==='hello'){ let s=this.seats.find(q=>q.id===from);
        if(!s){ if(this.started||this.total()>=BW.MP_MAX){ Lan.send(from,{op:'full',why:this.started? 'The battle has already started.' : 'The room is full.'}); return; } s={id:from}; this.seats.push(s); }
        s.name=String(m.name||'Player').replace(/[<>&"]/g,'').slice(0,16)||'Player'; s.civ=BW_CIV[m.civ]? m.civ : null; this.sync(); return; }
      if(!this.started) return; const s=this.seats.find(q=>q.id===from); if(s&&!s.gone) P2P.handle(m,s.fid); return; }
    if(this.role==='guest'){
      if(m.op==='lobby'){ this.seats=m.seats||[]; this.bots=m.bots|0; this.me=m.you|0; this.render(); this.msg('Waiting for the host to start…'); }
      else if(m.op==='full'){ this.msg(m.why||'The room is full.'); this.leave(true); this.view('home'); }
      else if(m.op==='init'){ this.started=true; this.seats=m.seats; this.me=m.you|0; this.begin(m.seed,m.seats,m.you|0); }
      else if(this.started) P2P.handle(m,0); } },
  render(){ const el=$('lanSeats'); if(!el) return; el.innerHTML=''; const host=this.role==='host', tot=this.total();
    $('lanTitle').textContent= host? '🏠 Your room' : '🚪 In the room'; $('lanCodeBox').classList.toggle('hidden',!host||!this.code); $('lanCodeTxt').textContent=this.code;
    this.seats.forEach((s,k)=>{ const c=BW.MP_COL[k%BW.MP_COL.length], cv=BW_CIV[s.civ], d=document.createElement('div'); d.className='lanseat'; d.dataset.seat=k;
      d.innerHTML=`<i style="background:${c[0]}"></i><b>${String(s.name).replace(/[<>&]/g,'')}</b><span>${cv? cv.icon+' '+cv.name : '🎲 Random nation'}${k===0? ' · host' : ''}${k===this.me? ' · you' : ''}</span>`; el.appendChild(d); });
    for(let i=0;i<this.bots;i++){ const k=this.seats.length+i, c=BW.MP_COL[k%BW.MP_COL.length], d=document.createElement('div'); d.className='lanseat bot'; d.innerHTML=`<i style="background:${c[0]}"></i><b>🤖 Bot ${i+1}</b><span>computer player</span>`; el.appendChild(d); }
    $('lanCount').textContent=`${tot}/${BW.MP_MAX} players`;
    $('lanBots').classList.toggle('hidden',!host); $('lanStart').classList.toggle('hidden',!host);
    if(host){ $('lanBotN').textContent=this.bots; $('lanBotMinus').disabled=this.bots<=0; $('lanBotPlus').disabled=tot>=BW.MP_MAX;
      $('lanBotMinus').onclick=()=>{ if(this.bots>0){ this.bots--; audio.click(); this.sync(); } }; $('lanBotPlus').onclick=()=>{ if(this.total()<BW.MP_MAX){ this.bots++; audio.click(); this.sync(); } };
      $('lanStart').disabled=tot<2; $('lanStart').textContent= tot<2? 'Waiting for players…' : `⚔️ Start battle (${tot} players)`; $('lanStart').onclick=()=>{ if(this.total()>=2) this.start(); }; }
    $('lanLeave').onclick=()=>{ audio.click(); this.leave(); this.view('home'); this.msg(''); }; },
  // ----- vào trận -----
  start(){ if(this.role!=='host'||this.started) return; this.started=true; const seed=1000+((Math.random()*8999)|0);
    const pool=BW_CIVS.map(c=>c.id).filter(id=>!this.seats.some(s=>s.civ===id)); let pi=(seed*7)%pool.length; const rnd=()=>pool[(pi=(pi+13)%pool.length)];
    const L=this.seats.map(s=>({name:s.name,civ:s.civ||rnd(),bot:0})); for(let i=0;i<this.bots;i++) L.push({name:'Bot '+(i+1),civ:rnd(),bot:1});
    this.seats.forEach((s,k)=>{ s.fid=BW.mpFid(k); });
    this.seats.forEach((s,k)=>{ if(s.id>=0) Lan.send(s.id,{op:'init',seed,seats:L,you:k}); });
    Lan.info({n:this.seats.length,max:BW.MP_MAX,open:0}); this.begin(seed,L,0); },
  begin(seed,L,k){ P2P.room=true; P2P.role=this.role; P2P.connected=true; P2P.lastSnap=0; this.me=k;
    showScreen(null); $('bwbar')&&$('bwbar').classList.remove('hidden');
    G.bwCfg=BW.mpCfg(seed,L); startBigWar(5);
    const bw=G.bw; bw.p2p=this.role; if(this.role==='guest'){ bw.localFid=BW.mpFid(k); bw.nextAI=1e9; bw.nextAiScout=1e9; bw._updateVision(); }
    const c=bw.nodes.find(n=>n.camp&&n.owner===bw.localFid); if(c){ const sc=bw.scale||0.5; bw.camX=Math.max(0,c.x-(bw.lastVw||800)/sc/2); bw.camY=Math.max(0,c.y-(bw.lastVh||400)/sc/2); bw.jumpTo(c.x,c.y,1.2); }
    const me=L[k]; bw.note(`👥 ${L.length}-player battle — you are ${me.name}. Last nation standing wins!`,c? c.x : 0,c? c.y : 0,'👥'); },
  out(o){ if(this.role==='host'){ if(o.f!=null){ const s=this.seats.find(q=>q.fid===o.f&&q.id>=0&&!q.gone); if(s) Lan.send(s.id,o); } else { for(const s of this.seats) if(s.id>=0&&!s.gone) Lan.send(s.id,o); } }
    else if(this.role==='guest') Lan.send(null,o); },
  close(){ this.leave(true); },
  leave(quiet){ clearInterval(this._hT); const was=this.role; this.role=null; this.started=false; this.seats=[]; this.peers={}; this.bots=0; Lan.onClosed=null; try{ Lan.stopScan(); Lan.close(); }catch(e){} P2P.room=false; if(was&&!quiet) this.msg(''); },
};
window.Room=Room; window.Lan=Lan;
