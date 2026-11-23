// Luật kinh đô: mất trại đã chiếm không thua; mất kinh đô còn trại khác thì dời đô; hết trại mới thua
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const r=await p.evaluate(async()=>{
  const out={}; const F=0;
  // đánh chiếm THẬT bằng trận đánh: đạo quân lớn tới trại đối phương
  const conquer=(bw,n,owner,cnt)=>{ const a={owner,type:'cavalry',count:cnt,x:n.x-90,y:n.y,to:n.id,trail:0,food:100,done:false}; bw.armies.push(a);
    for(let i=0;i<1500&&n.owner!==owner&&!bw.over;i++) bw.update(0.1); return n.owner===owner; };
  G.bwCfg={royale:36,seed:91,map:2}; startBigWar(5); let bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.nextAI=1e9; __ltm.G.paused=true;
  const myCap=bw.nodes.find(n=>n.camp&&n.capOf===F);
  const foes=bw.nodes.filter(n=>n.camp&&n.owner>=3).sort((a,b)=>Math.hypot(a.x-myCap.x,a.y-myCap.y)-Math.hypot(b.x-myCap.x,b.y-myCap.y)).slice(0,3);
  out.chiemDuoc=foes.map(n=>conquer(bw,n,F,n.count*4+3000));
  out.soTraiTa=bw.nodes.filter(n=>n.camp&&n.owner===F).length;
  out.diemTaTruoc=bw.nodes.filter(n=>n.owner===F).length;
  // 1) nước khác chiếm lại MỘT trại đã chiếm
  const back=foes[0]; const enemy=bw.nodes.find(n=>n.camp&&n.owner>=3&&!foes.includes(n)).owner;
  conquer(bw,back,enemy,back.count*4+3000);
  out.matTraiDaChiem={over:bw.over, ketQua:bw.result, diemTaSau:bw.nodes.filter(n=>n.owner===F).length, kinhDoVanCua:bw.nodes.find(n=>n.capOf===F)===myCap&&myCap.owner===F};
  // 2) mất KINH ĐÔ khi còn trại khác -> dời đô
  conquer(bw,myCap,enemy,myCap.count*4+5000);
  const newCap=bw.nodes.find(n=>n.capOf===F);
  out.matKinhDo={over:bw.over, doiDo:!!newCap&&newCap.owner===F&&newCap!==myCap, thongBao:bw.notes.map(n=>n.text).filter(t=>t.includes('DỜI ĐÔ'))[0]||null};
  // 3) mất nốt các trại -> THUA
  for(const n of bw.nodes.filter(n=>n.camp&&n.owner===F)) conquer(bw,n,enemy,n.count*4+5000);
  out.hetTrai={over:bw.over, ketQua:bw.result};
  // 4) bản 1v1: ta mất trại duy nhất -> thua như cũ
  G.bwCfg={map:3}; startBigWar(3); bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.nextAI=1e9;
  const c1=bw.nodes.find(n=>n.camp&&n.owner===F); conquer(bw,c1,1,8000);
  out.v1_matTraiDuyNhat={over:bw.over, ketQua:bw.result};
  return out; });
console.log(dev, JSON.stringify(r,null,1)); console.log('errors',errs.length?errs:'none'); await b.close();
