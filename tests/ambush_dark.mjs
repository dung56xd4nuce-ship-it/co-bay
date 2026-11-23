// Địch chỉ đặt phục binh ở VÙNG TỐI (ngoài vùng chiếm đóng của ta), không đặt trong lãnh thổ sáng của ta
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[process.argv[2]||'Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(900);
const r=await p.evaluate(()=>{ const res=[];
  for(const off of [300,900,1800,2600,3400,4200]){ G.bwCfg={map:3}; startBigWar(10); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; bw.nextWaveF={};
    const mine=bw.nodes.find(n=>n.owner===0&&n.camp);
    const pa={owner:0,type:'spear',count:900,x:mine.x+off,y:mine.y,to:-1,tx:mine.x+off+900,ty:mine.y,camped:false,trail:0,food:100,done:false};
    const ai={owner:1,type:'spear',count:900,x:mine.x+off+600,y:mine.y+150,to:-1,trail:0,food:100,done:false,camped:true};
    bw.armies.push(pa,ai); const lit=bw.terrLit(mine.x+off+450,mine.y,0); bw.aiTurn(1);
    const ptLit= ai.aiAmbush? bw.terrLit(ai.tx,ai.ty,0) : null;
    res.push(`đoạn đường cách trại ${off}px (${lit?'lãnh thổ SÁNG':'VÙNG TỐI'}): địch phục binh=${!!ai.aiAmbush}${ai.aiAmbush?', điểm phục trong vùng sáng='+ptLit:''}`); }
  return res; });
console.log(r.join('\n')); await b.close();
