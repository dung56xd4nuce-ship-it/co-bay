// v2.7: gọi quân 5 / 10 trại gần nhất và tổng động viên; quân tập kết tự gộp
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{
  G.bwCfg={map:3}; startBigWar(3); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9;
  const F=0; const own=()=>bw.nodes.filter(n=>n.owner===F&&n.count>=100&&!n.eco&&!n.btl).length;
  // thêm vài trại ta để có đủ nguồn
  const tx=bw.nodes.filter(n=>n.owner!==F&&n.owner!==2)[0];
  const cx=(bw.nodes.find(n=>n.owner===F&&n.camp).x)+400, cy=bw.nodes.find(n=>n.owner===F&&n.camp).y;
  const before=own();
  // chạm đất trống không chọn gì -> menu gọi quân
  bw.sel=null; bw.selA=null; const opts=['rally5','rally10','rallyAll'];
  bw.rallyPick=5; bw.tap(cx,cy);
  const armies5=bw.armies.filter(a=>a.rally&&a.owner===F).length;
  // gọi 10 ở điểm khác
  bw.rallyPick=10; bw.tap(cx,cy+200);
  const armies10=bw.armies.filter(a=>a.rally&&a.owner===F).length-armies5;
  // tổng động viên
  bw.rallyPick=Infinity; bw.tap(cx-200,cy-300);
  const allArmies=bw.armies.filter(a=>a.rally&&a.owner===F).length-armies5-armies10;
  const remainingNodes=own();
  // để quân đi tới đích và gộp
  for(let i=0;i<400;i++) bw.update(0.25);
  const dbg=bw.armies.filter(a=>a.rally&&!a.done&&a.count>0).map(a=>({c:a.count,camp:a.camped,to:a.to,x:Math.round(a.x),y:Math.round(a.y),tx:Math.round(a.tx||0),ty:Math.round(a.ty||0),btl:a.btl}));
  const groups={}; for(const a of bw.armies) if(a.rally&&!a.done&&a.count>0) groups[a.rally]=(groups[a.rally]||0)+1;
  return {opts, armies5, armies10, allArmies, nodesBefore:before, nodesAfter:remainingNodes, groupsLeft:groups,dbg, notes:bw.notes.map(n=>n.text).slice(-3)};
});
console.log(JSON.stringify(r)); console.log('errors', errs.length?errs:'none');
await b.close();
