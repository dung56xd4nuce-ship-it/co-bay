// ảnh chụp hiệu ứng quân nhu trong trận (bè gỗ khi lội sông, màn khói, huy hiệu) — soát bằng mắt
import { launch, open, DEVICES } from './lib.mjs';
const b=await launch(); const T=await open(b,DEVICES[0][1]); const {p}=T;
await p.evaluate(()=>{ save.inv={plank:3,smoke:3,scarecrow:3}; save.pack=['plank','smoke','scarecrow']; });
await T.startBattle({map:3,civ:'rome'},3); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await p.waitForTimeout(400);
const q=await p.evaluate(()=>{ const bw=__ltm.bw; bw.skipIntro(); bw.aiTurn=()=>{}; bw.nextWaveF={1:1e9}; bw.notes=[]; bw.update=()=>{}; bw.time=60; const y=460, rx=bw.riverX(y);
  const mk=(o)=>Object.assign({owner:0,type:'spear',count:900,to:-1,trail:0,camped:true,food:80},o);
  const A=mk({x:rx,y,tx:rx+200,ty:y,camped:false,plankT:41}), B=mk({x:rx-230,y:y+40,tx:rx-230,ty:y+40,smokeT:23,teaT:17,type:'cavalry',count:2600}); bw.armies.push(A,B); bw.selA=B; bw._gearLive=true;
  bw.tempVis.push({x:rx,y,r:1600,t:20}); bw._updateVision(); bw.zoom=bw.zoomTgt=2.3; const sc=bw.scale0*2.3; bw.camX=rx-110-bw.lastVw/sc/2; bw.camY=y-bw.lastVh/sc/2; return [rx,y]; });
await p.waitForTimeout(1800); await p.screenshot({path:'/tmp/shots/f52-plank-smoke.png'});
await p.evaluate(()=>{ const bw=__ltm.bw, c=bw.nodes.find(n=>n.camp&&n.owner===0), v=bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0); c.scareT=44; if(v) v.scareT=31; const A=bw.armies[bw.armies.length-1]; A.x=c.x+300; A.y=c.y+60; A.tx=A.x; A.ty=A.y; A.plankT=12; bw.selA=null; bw.zoom=bw.zoomTgt=1.6; const sc=bw.scale0*1.6; bw.camX=c.x+120-bw.lastVw/sc/2; bw.camY=c.y-bw.lastVh/sc/2; });
await p.waitForTimeout(1500); await p.screenshot({path:'/tmp/shots/f52-camp-marks.png'});
await p.evaluate(()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=0.55; const c=bw.nodes.find(n=>n.camp&&n.owner===0), sc=bw.scale0*0.55; bw.camX=c.x+500-bw.lastVw/sc/2; bw.camY=c.y-bw.lastVh/sc/2; });
await p.waitForTimeout(1500); await p.screenshot({path:'/tmp/shots/f52-far-marks.png'});
console.log('lỗi JS:',T.errs.slice(0,3)); await b.close();
