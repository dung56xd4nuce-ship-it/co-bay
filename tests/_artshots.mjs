// Ảnh chụp để soát bằng mắt các chỗ mới dùng art ở 5.2 (không thuộc cổng phát hành)
import { launch, open, DEVICES } from './lib.mjs';
const b=await launch(); const T=await open(b,DEVICES[0][1]); const {p}=T; const wait=(ms)=>p.waitForTimeout(ms);
const shot=(name)=>p.screenshot({path:`/tmp/shots/a52-${name}.png`});
await p.evaluate(()=>{ save.xu=3000; save.up={speed:2,power:1,armor:0,stamina:3,aura:0,weapon:2}; save.inv={bun:3,tea:2,bandage:2}; save.pack=['bun','tea','bandage']; Save.set(save); refreshXu(); });
await wait(600); await shot('menu');
await T.tapEl('#bGear'); await wait(300); await T.tapEl('#bToForge'); await wait(400); await shot('forge');
await T.startBattle({map:3,civ:'rome'},3); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await wait(500);
const look=(x,y,z)=>p.evaluate(([x,y,z])=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=z; const sc=bw.scale0*z; bw.camX=x-bw.lastVw/sc/2; bw.camY=y-bw.lastVh/sc/2; },[x,y,z]);
const info=await p.evaluate(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.notes=[]; bw.nextWaveF={1:1e9}; const c=bw.nodes.find(n=>n.camp&&n.owner===0), e=bw.nodes.filter(n=>n.owner===1&&!n.camp).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
  const mk=(o)=>Object.assign({owner:0,type:'spear',count:900,to:-1,trail:0,camped:true,food:70},o);
  const A=mk({x:c.x+230,y:c.y+150,tx:c.x+230,ty:c.y+150,retreatT:1e6}), B=mk({x:c.x+420,y:c.y+150,tx:c.x+900,ty:c.y+150,camped:false,prep:21,prep0:30,type:'cavalry'}); bw.armies.push(A,B);
  bw.scouts.push({x:c.x+150,y:c.y-150,to:e.id,trail:0,fid:0}); bw.aiScouts.push({x:c.x+330,y:c.y-170,tx:c.x-600,ty:c.y-170,fid:1});
  bw.rallyMark={x:c.x+470,y:c.y-60,t:0,big:false}; window.__keep=setInterval(()=>{ if(bw.rallyMark) bw.rallyMark.t=1; B.prep=21; for(const s of bw.scouts){ s.x=c.x+150; s.y=c.y-150; } for(const s of bw.aiScouts){ s.x=c.x+330; s.y=c.y-170; } e.scoutT=bw.time-4; },50);
  const gr=bw.nodes.find(n=>n.eco==='granary'), br=bw.bridges[0];
  // phế tích: dò lại đúng công thức rải của bản đồ
  const S=bw.mapSeed|0, ruins=[]; for(let j=0;j<Math.ceil(BW.H/620);j++) for(let i=0;i<Math.ceil(BW.W/620);i++){ const h=mapHash(i,j,S+91), x=(i+0.5+(mapHash(i,j,S+92)-0.5)*0.76)*620, y=(j+0.5+(mapHash(i,j,S+93)-0.5)*0.76)*620;
    if(h>0.36||x<30||y<150||x>BW.W-30||y>BW.H-20||bw.terAt(x,y)!=='plain'||bw.distRoad(x,y)<BW.roadHalf+44||Math.abs(x-bw.riverX(y))<150) continue; const w=104+h*70; if(bw.distRoad(x,y)<24+w*0.42||bw.mapNodesNear(x,y-w*0.2,118)) continue; ruins.push([Math.round(x),Math.round(y)]); }
  return {c:[c.x,c.y],e:[e.x,e.y],gr:gr&&[gr.x,gr.y],br:br&&[br.x,br.y],ruins}; });
console.log(JSON.stringify(info));
await look(info.c[0]+230,info.c[1]+20,2.0); await wait(1500); await shot('capital');
await p.evaluate(()=>{ __ltm.bw.rallyMark={x:__ltm.bw.nodes.find(n=>n.camp&&n.owner===0).x+470,y:__ltm.bw.nodes.find(n=>n.camp&&n.owner===0).y-60,t:0,big:true}; }); await wait(500); await shot('capital-drum');
await look(info.e[0],info.e[1],2.2); await p.evaluate(()=>{ const bw=__ltm.bw, e=bw.nodes.filter(n=>n.owner===1&&!n.camp)[0]; }); await wait(1500); await shot('scouted');
if(info.gr){ await look(info.gr[0],info.gr[1],2.2); await wait(1500); await shot('granary'); }
if(info.br){ await look(info.br[0],info.br[1],2.4); await wait(1500); await shot('ford'); }
if(info.ruins.length){ await look(info.ruins[0][0],info.ruins[0][1]-30,2.2); await wait(1500); await shot('ruin'); }
// trận đánh + y sĩ
await p.evaluate(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0); const mk=(o)=>Object.assign({type:'spear',to:-1,trail:0,food:70},o);
  bw.armies.push(mk({owner:0,count:1200,x:c.x+60,y:c.y+330,tx:c.x+160,ty:c.y+330}),mk({owner:1,count:1100,x:c.x+120,y:c.y+330,tx:c.x+20,ty:c.y+330})); });
await look(info.c[0]+90,info.c[1]+330,2.2); await wait(2500); await p.evaluate(()=>{ const bw=__ltm.bw, b0=bw.battles.find(x=>!x.done); if(b0) bw.addFx(b0.x+130,b0.y-10,'unit:medic',104,2.2); }); await wait(700); await shot('battle');
await T.tapEl('#bwPause'); await wait(400); await shot('pause');
console.log('lỗi JS:',T.errs.slice(0,5)); await b.close();
