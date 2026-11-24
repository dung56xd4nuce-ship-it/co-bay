// ============ 📶 P2P 2 NGƯỜI — WebRTC, chủ phòng cầm trịch (host-authoritative) ============
// Chủ chạy mô phỏng thật; khách gửi thao tác chạm + nhận ảnh trạng thái 8 lần/giây.
const P2P={
  pc:null, ch:null, role:null, connected:false, lastSnap:0,
  open(){ showScreen('p2p'); $('p2pStep1').classList.remove('hidden'); $('p2pStep2').classList.add('hidden'); $('p2pIn').value=''; $('p2pOut').value='';
    $('p2pHost').onclick=()=>P2P.host(); $('p2pJoin').onclick=()=>P2P.join();
    const lab=()=>{ const c=BW_CIV[save.civ]; $('p2pCiv').textContent= c? `🏛️ ${c.icon} ${c.name} — change` : '🏛️ Choose your civilization'; }; lab();
    $('p2pCiv').onclick=()=>{ audio.click(); CivPick.open({go:'✔ Choose', onPick:()=>lab(), onBack:()=>{}}); };
    $('p2pCopy').onclick=()=>{ $('p2pOut').select(); try{ document.execCommand('copy'); }catch(e){} navigator.clipboard&&navigator.clipboard.writeText($('p2pOut').value).catch(()=>{}); };
  },
  mkpc(){ const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
    pc.onconnectionstatechange=()=>{ if(pc.connectionState==='disconnected'||pc.connectionState==='failed'){ P2P.drop('Connection lost!'); } };
    return pc; },
  enc(o){ return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); },
  dec(s){ return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); },
  async host(){ this.role='host'; this._openDone=false; this._inited=false; this._began=false; clearInterval(this._helloT); $('p2pStep1').classList.add('hidden'); $('p2pStep2').classList.remove('hidden');
    $('p2pMsg').textContent='Step 1: copy the INVITE CODE and send it to your friend → Step 2: paste their REPLY CODE below and tap Connect.';
    const pc=this.pc=this.mkpc(); const ch=this.ch=pc.createDataChannel('ltm'); this.wire(ch);
    await pc.setLocalDescription(await pc.createOffer());
    await new Promise(res=>{ if(pc.iceGatheringState==='complete') res(); pc.onicegatheringstatechange=()=>{ if(pc.iceGatheringState==='complete') res(); }; setTimeout(res,2500); });
    $('p2pOut').value=this.enc(pc.localDescription);
    $('p2pGo').onclick=async()=>{ try{ await pc.setRemoteDescription(this.dec($('p2pIn').value)); }catch(e){ $('p2pMsg').textContent='Invalid reply code!'; } };
    $('p2pOut').scrollIntoView({block:'center'});
  },
  async join(){ this.role='guest'; this._openDone=false; this._inited=false; this._began=false; clearInterval(this._helloT); $('p2pStep1').classList.add('hidden'); $('p2pStep2').classList.remove('hidden');
    $('p2pMsg').textContent='Paste the host\'s INVITE CODE below and tap Connect → copy the REPLY CODE and send it back to the host.';
    $('p2pIn').scrollIntoView({block:'center'});
    const pc=this.pc=this.mkpc(); pc.ondatachannel=(e)=>{ this.ch=e.channel; this.wire(this.ch); };
    $('p2pGo').onclick=async()=>{ try{
      await pc.setRemoteDescription(this.dec($('p2pIn').value));
      await pc.setLocalDescription(await pc.createAnswer());
      await new Promise(res=>{ if(pc.iceGatheringState==='complete') res(); pc.onicegatheringstatechange=()=>{ if(pc.iceGatheringState==='complete') res(); }; setTimeout(res,2500); });
      $('p2pOut').value=this.enc(pc.localDescription);
      $('p2pMsg').textContent='REPLY CODE created — copy it, send it to the host, then wait for the match!';
      $('p2pOut').scrollIntoView({block:'center'});
    }catch(e){ $('p2pMsg').textContent='Invalid invite code!'; } };
  },
  wire(ch){ ch.onopen=()=>{ this.connected=true; audio.win&&audio.flag&&audio.flag();
      // hai máy chào nhau kèm NỀN VĂN MINH đã chọn; chủ phòng nhận lời chào rồi mới khai trận.
      // Máy khách chậm/mạng trễ thì lời chào tới muộn: khách GỬI LẠI mỗi 0,4 giây tới khi nhận lệnh khai trận, chủ phòng chờ tối đa 6 giây
      // (trước đây chỉ chờ 1,5 giây — trễ hơn là nước khách chọn bị bỏ qua, khách phải cầm một nước ngẫu nhiên).
      if(this._openDone) return; this._openDone=true;
      this.civ2=null; const hello=()=>{ try{ ch.send(JSON.stringify({op:'hello',civ:save.civ||null})); }catch(e){} }; hello();
      if(this.role==='guest'){ clearInterval(this._helloT); let n=0; this._helloT=setInterval(()=>{ if(this._inited||++n>25||ch.readyState!=='open'){ clearInterval(this._helloT); return; } hello(); },400); }
      if(this.role==='host'){ const go=()=>{ if(this._began) return; this._began=true; const seed=1000+((Math.random()*8999)|0), civ=BW_CIV[save.civ]? save.civ : null;
          this.seed=seed; this.start(seed,civ,this.civ2); ch.send(JSON.stringify({op:'init',seed,civ:G.bw.cfg.civ,civ2:G.bw.cfg.civ2})); };
        this._began=false; this._go=go; setTimeout(go,6000); const pm=$('p2pMsg'); if(pm) pm.textContent='Connected — waiting for your opponent\'s nation…'; } };
    ch.onclose=()=>this.drop('Your opponent has left.');
    ch.onmessage=(e)=>{ let m; try{ m=JSON.parse(e.data); }catch(err){ return; }
      if(m.op==='hello'){ this.civ2=BW_CIV[m.civ]? m.civ : null; if(this.role==='host'&&this._go) this._go(); }
      else if(m.op==='init'&&this.role==='guest'){ this._inited=true; clearInterval(this._helloT); this.start(m.seed,m.civ,m.civ2); }
      else if(m.op==='rally'&&this.role==='host'&&G.bw){ G.bw.asFid(1,()=>G.bw.rallyCall(m.n<0? -1 : (m.n||Infinity),m.wx,m.wy)); }
      else if(m.op==='box'&&this.role==='host'&&G.bw){ G.bw.asFid(1,()=>G.bw.boxSelectWorld(m.x0,m.y0,m.x1,m.y1)); }
      else if(m.op==='note'&&this.role==='guest'&&G.bw){ G.bw.note(m.text,m.x,m.y,m.icon); }
      else if(m.op==='tap'&&this.role==='host'&&G.bw){ G.bw.asFid(1,()=>G.bw.tap(m.wx,m.wy)); }
      else if(m.op==='menu'&&this.role==='host'&&G.bw){ G.bw.asFid(1,()=>{ const bw=G.bw, keep=bw.sendSel, sn=bw.menu&&bw.menu.src&&bw.menu.src.kind==='node'? bw.menu.src.ref : null; bw.sendSel= m.sel&&sn? {node:sn.id,type:(typeof m.sel.type==='string'&&BW_TYPES.indexOf(m.sel.type)>=0)? m.sel.type : null,frac:(m.sel.frac===0.5||m.sel.frac===0.25)? m.sel.frac : 1} : null; try{ bw.menuPick(m.id); } finally { bw.sendSel=keep; } }); }
      else if(m.op==='amb'&&this.role==='host'&&G.bw){ const n=G.bw.nodes[m.ni]; if(n&&n.owner===1) n.ambush=!!m.v; }
      else if(m.op==='pause'){ if(this.role==='host'){ G.paused=!!m.v; pause(!!m.v); }
        else { G.paused=!!m.v; pause(!!m.v); } }
      else if(m.op==='retreat'&&this.role==='host'&&G.bw){ const b=G.bw.battles.filter(b2=>!b2.done)[m.bi]; if(b){
        const mine2=[...b.A.es,...b.B.es].filter(e=>e.kind==='army'&&e.ref.owner===1).map(e=>e.ref);
        for(const a of mine2) G.bw.retreatFromBattle(a); } }
      else if(m.op==='snap'&&this.role==='guest'&&G.bw){ this.applySnap(m); }
    };
    if(ch.readyState==='open') ch.onopen(); // kênh của khách có thể đã mở sẵn khi nhận được: vẫn phải chào (gửi nước đã chọn)
  },
  start(seed,civ,civ2){ showScreen(null); $('bwbar')&&$('bwbar').classList.remove('hidden');
    // bản đồ phải lấy theo HẠT GIỐNG chung: trước đây mỗi máy tự bốc ngẫu nhiên một bản đồ nên hai máy thấy hai thế trận khác nhau
    G.bwCfg={p2p:true, seed, map:seed%BW_MAPS.solo.length, civ:civ||undefined, civ2:civ2||undefined, L:{name:'P2P Showdown', ai: 1e9, wave: 1e9}};
    startBigWar(3);
    const bw=G.bw; bw.p2p=this.role; bw.nextAI=1e9; bw.nextAiScout=1e9;
    if(this.role==='guest'){ bw.localFid=1; bw._updateVision(); }
  },
  // ----- đồng bộ -----
  tick(dt){ if(!this.connected||!G.bw||!this.ch||this.ch.readyState!=='open') return;
    if(this.role==='host'){ this.lastSnap-=dt; if(this.lastSnap<=0){ this.lastSnap=0.12; try{ this.ch.send(JSON.stringify(this.snap(G.bw))); }catch(e){} } }
  },
  snap(bw){ return {op:'snap', t:bw.time, p:G.paused?1:0, over:bw.over, win:bw.result&&bw.result.win,
    n:bw.nodes.map(n=>[n.owner,Math.round(n.count),BW_TYPES.indexOf(n.type), n.ambush?1:0, Math.round(n.food||0), n.scoutT!=null?Math.round(bw.time-n.scoutT):-1, n.sieged?1:0, n.btl?1:0, (n.mix&&n.mixO===n.owner)? Object.keys(n.mix).map(t=>[BW_TYPES.indexOf(t),Math.round(n.mix[t]*1000)]) : 0]),
    a:bw.armies.filter(a=>!a.done).map(a=>[a.owner,Math.round(a.x),Math.round(a.y),Math.round(a.count),BW_TYPES.indexOf(a.type),a.camped?1:0,a.ambush?1:0,Math.round(a.food||0),a.btl?1:0,Math.round((a.prep||0)*10),Math.round((a.prep0||0)*10)]),
    c:(bw.convoys||[]).filter(c=>!c.done).map(c=>[c.owner,Math.round(c.x),Math.round(c.y),Math.round(c.pct),(c.hx||1)<0?1:0]),
    b:bw.battles.filter(b=>!b.done).map(b=>[Math.round(b.x),Math.round(b.y),Math.round(bw.bSideSum(b.A)),Math.round(bw.bSideSum(b.B)),b.A.fid,b.B.fid]) }; },
  applySnap(m){ const bw=G.bw; if(!bw) return;
    if(!!m.p!==!!G.paused){ G.paused=!!m.p; pause(!!m.p); }
    bw.time=m.t;
    m.n.forEach((r,i)=>{ const n=bw.nodes[i]; if(!n) return; n.owner=r[0]; n.count=r[1]; n.type=BW_TYPES[r[2]]||n.type; n.ambush=!!r[3]; n.food=r[4]; if(r[8]&&r[8].length){ const mx={}; for(const q of r[8]) if(BW_TYPES[q[0]]) mx[BW_TYPES[q[0]]]=q[1]/1000; n.mix=mx; n.mixO=n.owner; } else n.mix=null;
      n.scoutT= r[5]>=0? bw.time-r[5] : null; n.sieged=!!r[6]; n.btl=r[7]?1:null; });
    // đạo quân: thay cả mảng bằng bản ảnh nhẹ (giữ lựa chọn theo chỉ số gần nhất)
    const selIdx=bw.selA? bw.armies.indexOf(bw.selA):-1, grpIdx=(bw.selG||[]).map(a=>bw.armies.indexOf(a)).filter(i=>i>=0);
    bw.armies=m.a.map(r=>({owner:r[0],x:r[1],y:r[2],count:r[3],type:BW_TYPES[r[4]]||'spear',camped:!!r[5],ambush:!!r[6],food:r[7],btl:r[8]?1:null,prep:(r[9]||0)/10,prep0:(r[10]||0)/10,to:-1,trail:0}));
    bw.convoys=(m.c||[]).map(r=>({owner:r[0],x:r[1],y:r[2],pct:r[3],hx:r[4]?-1:1,to:null}));   // 🐂 xe lương (máy khách chỉ vẽ, máy chủ mới tính)
    bw.selA= selIdx>=0? bw.armies[Math.min(selIdx,bw.armies.length-1)]||null : null;
    bw.selG= grpIdx.length>1? grpIdx.map(i=>bw.armies[i]).filter(a=>a&&a.owner===bw.localFid) : null;
    bw.battles=m.b.map((r,i)=>({id:9000+i,x:r[0],y:r[1],done:false,t:1,K:0.1,ter:'plain',nodeId:-1,
      A:{fid:r[4],mul:1,es:[{kind:'army',ref:{count:r[2],type:'spear',owner:r[4]}}]},
      B:{fid:r[5],mul:1,es:[{kind:'army',ref:{count:r[3],type:'spear',owner:r[5]}}]}}));
    if(m.over&&!bw.over){ bw.over=true; bw.result={win: m.win===(bw.localFid===0)}; }
    bw._updateVision();
  },
  // khách: gửi thao tác thay vì tự xử lý
  sendOp(o){ if(this.ch&&this.ch.readyState==='open') this.ch.send(JSON.stringify(o)); },
  setPause(v){ if(this.role==='host'){ G.paused=!!v; } this.sendOp({op:'pause',v:v?1:0}); },
  guestTap(wx,wy){ if(this.ch&&this.ch.readyState==='open') this.ch.send(JSON.stringify({op:'tap',wx,wy})); },
  guestMenu(id,sel){ if(this.ch&&this.ch.readyState==='open') this.ch.send(JSON.stringify({op:'menu',id,sel:sel||undefined})); },
  drop(msg){ this.connected=false; try{ this.pc&&this.pc.close(); }catch(e){} this.pc=null; this.ch=null;
    if(G.bw&&G.bw.cfg&&G.bw.cfg.p2p&&!G.bw.over){ G.bw.over=true; G.bw.result={win:true}; G.bw._p2pNote=msg; }
  },
};
window.P2P=P2P;
