// Trạm chuyển tiếp dùng cho BÀI THỬ phòng WiFi: đóng vai plugin gốc LanPlay (một phòng mỗi "ip"). Chạy: node test/lan_relay.mjs [cổng]
import { WebSocketServer } from 'ws';
export function startRelay(port=8790){ const wss=new WebSocketServer({port}); const rooms=new Map(); let seq=1; const scanners=new Set();
  const tell=(ws,o)=>{ try{ ws.send(JSON.stringify(o)); }catch(e){} };
  const beacon=()=>{ for(const [ip,r] of rooms) for(const s of scanners) tell(s,{t:'room',ip,code:ip,name:r.name,n:r.n,max:r.max,open:r.open}); };
  const T=setInterval(beacon,400);
  wss.on('connection',(ws)=>{ ws.on('message',(raw)=>{ let m; try{ m=JSON.parse(raw); }catch(e){ return; }
      if(m.t==='host'){ const ip='dev'+(rooms.size+1); ws._room={ip,name:m.name,host:ws,guests:new Map(),n:1,max:8,open:1}; rooms.set(ip,ws._room); ws._host=1; tell(ws,{t:'hosted',ip,code:ip}); }
      else if(m.t==='info'&&ws._host){ Object.assign(ws._room,{n:m.n,max:m.max,open:m.open}); }
      else if(m.t==='scan'){ scanners.add(ws); tell(ws,{t:'scanning'}); beacon(); }
      else if(m.t==='join'){ const r=rooms.get(m.ip); if(!r){ tell(ws,{t:'error',why:'room not found'}); return; } scanners.delete(ws); ws._id=seq++; ws._room=r; r.guests.set(ws._id,ws); tell(ws,{t:'joined',ip:m.ip}); tell(r.host,{t:'peer',id:ws._id,on:true}); }
      else if(m.t==='send'){ const r=ws._room; if(!r) return;
        if(ws._host){ if(m.to>=0){ const g=r.guests.get(m.to); if(g) tell(g,{t:'msg',from:0,data:m.data}); } else for(const g of r.guests.values()) tell(g,{t:'msg',from:0,data:m.data}); }
        else tell(r.host,{t:'msg',from:ws._id,data:m.data}); } });
    ws.on('close',()=>{ scanners.delete(ws); const r=ws._room; if(!r) return;
      if(ws._host){ rooms.delete(r.ip); for(const g of r.guests.values()){ try{ g.close(); }catch(e){} } for(const s of scanners) tell(s,{t:'room',ip:r.ip,gone:1}); }
      else if(ws._id){ r.guests.delete(ws._id); tell(r.host,{t:'peer',id:ws._id,on:false}); } }); });
  return { close(){ clearInterval(T); wss.close(); } }; }
if(process.argv[1]&&process.argv[1].endsWith('lan_relay.mjs')) startRelay(+process.argv[2]||8790);
