// Sau trận: đạo thắng ở sát trại/cứ điểm phe mình tự gom vào trại; xa trại thì đứng lại (hợp binh) như cũ
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const out=await p.evaluate(async()=>{ const res={};
  const setup=(dist)=>{ G.bwCfg={map:3}; startBigWar(3); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.armies.length=0;
    const own=bw.nodes.find(n=>n.owner===0&&!n.camp&&!n.eco)||bw.nodes.find(n=>n.owner===0&&n.camp); own.count=300;
    const bx=own.x+dist, by=own.y;
    // 3 đạo ta đánh 1 đạo địch ở cách cứ điểm `dist`
    const A=[0,1,2].map(i=>({owner:0,type:'spear',count:500,x:bx-60+i*40,y:by+(i-1)*40,to:-1,tx:bx+400,ty:by,trail:0,food:90,done:false}));
    const E={owner:1,type:'archer',count:300,x:bx+30,y:by,to:-1,trail:0,food:90,done:false,camped:true};
    bw.armies.push(...A,E); return {bw,own,A,E}; };
  for(const dist of [250,500,1400]){
    const {bw,own,A}=setup(dist); const c0=own.count; const tot0=bw.nodes.filter(n=>n.owner===0).reduce((t,n)=>t+n.count,0); let ended=-1;
    for(let i=0;i<1800;i++){ bw.update(0.1); if(ended<0&&!bw.battles.some(x=>!x.done)&&bw.battles.length) ended=i; if(ended>=0&&i>ended+300) break; }
    const alive=bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0);
    res['cách '+dist+'px']={traiTruoc:c0, traiSau:Math.round(own.count), tongQuanTrongCacTraiTa:Math.round(tot0)+' → '+Math.round(bw.nodes.filter(n=>n.owner===0).reduce((t,n)=>t+n.count,0)), daoConNgoaiDong:alive.length, viTri:alive.map(a=>Math.round(Math.hypot(a.x-own.x,a.y-own.y))+'px tới trại')};
  }
  // giữ thành: đạo tiếp viện đứng quanh thành sau khi thủ thắng
  { G.bwCfg={map:3}; startBigWar(3); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.armies.length=0;
    const n=bw.nodes.find(x=>x.owner===0&&!x.camp&&!x.eco); n.count=600;
    const att={owner:1,type:'cavalry',count:500,x:n.x+300,y:n.y,to:n.id,trail:0,food:90,done:false};
    bw.armies.push(att); for(let i=0;i<30;i++) bw.update(0.1);
    const b=bw.battles.find(x=>!x.done); let joined=0;
    if(b){ const r={owner:0,type:'spear',count:400,x:n.x-120,y:n.y+60,to:-1,trail:0,food:90,done:false,camped:true}; bw.armies.push(r); bw.bJoin? bw.bJoin(b,r):0; joined=1; }
    for(let i=0;i<1500;i++) bw.update(0.1);
    res['giữ thành có tiếp viện']={coTran:!!b, quanThanh:Math.round(n.count), chuThanh:n.owner, daoNgoaiDong:bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0).length}; }
  return res; });
console.log(dev, JSON.stringify(out,null,1)); console.log('errors',errs.length?errs:'none'); await b.close();
