// (7.0) Đường gọi plugin gốc "LanPlay": giả lập cầu nối Capacitor đúng hình dạng mà Android bơm vào trang
// (KHÔNG có Capacitor.registerPlugin; chỉ có Capacitor.Plugins.<tên> hoặc nativePromise/addListener), dữ liệu là CHUỖI JSON như bên Java.
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
import { startRelay } from './lan_relay.mjs';
const PORT=8793, relay=startRelay(PORT), b=await launch();
const fake=(arg)=>{ const [url,mode]=arg; let ws=null, L={}, wait=null; const fire=(ev,o)=>{ for(const f of (L[ev]||[])) f(o); };
  const conn=(first)=>new Promise((res,rej)=>{ if(ws){ try{ ws.onclose=null; ws.close(); }catch(e){} } ws=new WebSocket(url); const me=ws; ws.onopen=()=>ws.send(JSON.stringify(first));
    ws.onmessage=(e)=>{ const m=JSON.parse(e.data);
      if(m.t==='hosted'){ res({ip:m.ip,code:m.code,port:47811}); } else if(m.t==='joined'){ res({ip:first.ip}); } else if(m.t==='scanning'){ res(); } else if(m.t==='error'){ rej(new Error('No room answered')); }
      else if(m.t==='room'){ if(!m.gone) fire('room',{ip:m.ip,code:m.code,name:m.name,n:m.n,max:m.max,open:m.open}); }
      else if(m.t==='peer'){ fire('peer',{id:m.id,on:!!m.on}); } else if(m.t==='msg'){ fire('msg',{from:m.from,data:JSON.stringify(m.data)}); } };
    ws.onclose=()=>{ if(ws===me){ ws=null; fire('closed',{}); } }; });
  const M={ host:(o)=>conn({t:'host',name:o.name}), setInfo:async(o)=>{ if(ws&&ws.readyState===1) ws.send(JSON.stringify(Object.assign({t:'info'},o))); }, scan:()=>conn({t:'scan'}),
    stopScan:async()=>{}, join:(o)=>conn({t:'join',ip:o.ip}), send:async(o)=>{ if(typeof o.data!=='string') throw new Error('data must be a string'); if(ws&&ws.readyState===1) ws.send(JSON.stringify({t:'send',to:o.to,data:JSON.parse(o.data)})); },
    close:async()=>{ if(ws){ const w=ws; ws=null; w.onclose=null; w.close(); } } };
  const add=(ev,cb)=>{ (L[ev]=L[ev]||[]).push(cb); return {remove:async()=>{}}; };
  const C=window.Capacitor={ isNativePlatform:()=>true, getPlatform:()=>'android', Plugins:{} };
  if(mode==='plugins'){ C.Plugins.LanPlay=Object.assign({addListener:add},M); }
  else { C.nativePromise=(pl,m,o)=>{ window.__np=(window.__np||0)+1; return pl==='LanPlay'&&M[m]? M[m](o||{}) : Promise.reject(new Error('no method')); }; C.addListener=(pl,ev,cb)=>add(ev,cb); } };
for(const mode of ['plugins','bridge']){
  const mk=async(dev,name)=>{ const T=await open(b,dev,{init:{content:`(${fake.toString()})(${JSON.stringify(['ws://localhost:'+PORT,mode])})`}}); await T.ev((n)=>{ save.pname=n; save.civ='daiviet'; Save.set(save); },name); return T; };
  const H=await mk(DEVICES[0][1],'Dung'), G=await mk(DEVICES[1][1],'Lan');
  ok(await H.ev(()=>Lan.avail()&&!!Lan.native()&&!localStorage.getItem('ltm_lan_dev')),`[${mode}] app Android: tìm thấy plugin LanPlay dù không có Capacitor.registerPlugin`);
  await H.ev(()=>{ Room.open(); }); ok(await H.ev(()=>!document.getElementById('lanHost').disabled&&document.getElementById('lanNo').classList.contains('hidden')),`[${mode}] nút "Create a room" bật, không báo "chỉ chạy trong app"`);
  await H.ev(()=>Room.host()); await H.until(()=>Room.role==='host',6000); ok(await H.ev(()=>Room.role==='host'&&!!Room.code&&Room.seats.length===1),`[${mode}] chủ: mở được phòng, có mã phòng`);
  await G.ev(()=>{ Room.open(); Room.browse(); }); await G.until(()=>Object.keys(Room.rooms).length>0,6000); const ip=await G.ev(()=>Object.keys(Room.rooms)[0]); ok(!!ip,`[${mode}] khách: thấy phòng qua tín hiệu dò`);
  await G.ev((ip)=>Room.join(ip),ip); await H.until(()=>Room.seats.length===2,6000); await G.until(()=>Room.seats.length===2,6000);
  ok(await H.ev(()=>Room.seats.length===2)&&await G.ev(()=>Room.seats.length===2&&Room.role==='guest'),`[${mode}] vào phòng: hai máy cùng thấy 2 người (tin nhắn dạng chuỗi JSON đi được cả hai chiều)`);
  await H.ev(()=>{ Room.bots=1; Room.sync&&Room.sync(); Room.render(); Room.start(); }); await H.until(()=>window.__ltm&&__ltm.bw&&__ltm.bw.cfg&&__ltm.bw.cfg.mp,8000); await G.until(()=>window.__ltm&&__ltm.bw&&__ltm.bw.cfg&&__ltm.bw.cfg.mp,8000);
  ok(await H.ev(()=>__ltm.bw.cfg.mp.n===3&&__ltm.bw.p2p==='host')&&await G.ev(()=>__ltm.bw.cfg.mp.n===3&&__ltm.bw.p2p==='guest'),`[${mode}] bắt đầu: cả hai vào trận 3 phe`);
  const t0=await G.ev(()=>__ltm.bw.time); await G.p.waitForTimeout(2500); ok(await G.ev((t0)=>__ltm.bw.time>t0,t0),`[${mode}] khách nhận ảnh trạng thái liên tục từ chủ phòng`);
  if(mode==='bridge') ok(await H.ev(()=>window.__np>3),'[bridge] lệnh đi qua Capacitor.nativePromise');
  ok(H.errs.length===0&&G.errs.length===0,`[${mode}] không lỗi console: ${[...H.errs,...G.errs].slice(0,3).join(' | ')}`);
  await H.ctx.close(); await G.ctx.close(); }
relay.close&&relay.close(); await finish('🔌 Cầu nối plugin LanPlay (7.0)',b);
