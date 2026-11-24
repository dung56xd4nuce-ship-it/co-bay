// Đo ĐỘ KHÓ THẬT của 10 ải 1v1 bằng người chơi máy (cùng chiến thuật với test/gate_bot.mjs), chạy thẳng trong Node cho nhanh.
// In: thời gian thắng, số cứ điểm ta bị máy chiếm, số đợt máy xuất quân đánh ta, tương quan lực lượng theo thời gian.
import fs from 'fs';
const SRC=process.env.SRC||new URL('../src',import.meta.url).pathname;
const BWSRC=['09_bigwar.js','09a_terrain.js','09c_civ.js','09d_supply.js','09e_gear.js','09f_brain.js','09g_mix.js'].filter(f=>fs.existsSync(SRC+'/'+f)).map(f=>fs.readFileSync(SRC+'/'+f,'utf8')).join('\n');
const M=new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"+fs.readFileSync(SRC+'/01_config.js','utf8')+fs.readFileSync(SRC+'/02_map.js','utf8')+BWSRC+'\nreturn {BigWar,BW,bwResolve,BW_LEVELS,BW_AI_TIER};')();
const {BigWar,BW,bwResolve,BW_LEVELS,BW_AI_TIER}=M;
// Máy thử "ĐÁNH THẲNG" (5.4): gom hết quân vào một đồn, ăn đồn trung lập cho đông, đủ gấp 2,2 lần quân trại địch thì kéo thẳng vào trại.
export function rush(lv,map,civ='rome',opt={}){ const bw=new BigWar(lv,Object.assign({map,civ,autoMenu:true},opt.cfg||{})); bw.lv=lv; const hy=Math.hypot, eat=opt.eat??8;
  const ecamp=()=>bw.nodes.find(n=>n.camp&&n.owner===1); let eaten=0, log=[], atk=false, base=null, step=0, hits=0;
  const hub=bw.nodes.filter(n=>n.owner===0&&!n.camp&&!n.eco).sort((a,b)=>b.count-a.count)[0]; bw.rallyCall(Infinity,hub.x,hub.y); base=hub;
  const s0=bw.send.bind(bw); bw.send=function(a,b,...r){ if(a&&a.owner===1&&b&&(b.owner===0)) hits++; return s0(a,b,...r); };
  while(!bw.over&&bw.time<(opt.limit||20)*60){ bw.update(0.05); step++; if(step%20) continue;
    const mine=bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0); if(mine.length) continue;      // đợi quân tới nơi / đánh xong
    const n=bw.nodes.filter(q=>q.owner===0&&!q.btl&&q.count>0).sort((a,b)=>b.count-a.count)[0]; if(!n||n.count<50) continue; const ec=ecamp(); if(!ec) continue;
    const need=(opt.ratio||2.2)*ec.count; if(n.count<need&&bw.time<(opt.wait||12)*60){ const tgt=bw.nodes.filter(q=>q.owner===2&&q.count>0&&q.count<n.count*0.85).sort((a,b)=>hy(a.x-n.x,a.y-n.y)-hy(b.x-n.x,b.y-n.y))[0]; if(tgt){ bw.send(n,tgt); eaten++; continue; }
      if(step%400===0){ bw.rallyCall(Infinity,n.x,n.y); } continue; }
    log.push(Math.round(bw.time)+'s: '+Math.round(n.count)+' vs camp '+Math.round(ec.count)); atk=true; bw.send(n,ec); }
  return {win:!!(bw.result&&bw.result.win),over:bw.over,t:bw.time,log,hits}; }
export function play(lv,map,civ,opt={}){ const bw=new BigWar(lv,Object.assign({map,civ,autoMenu:true},opt.cfg||{})); bw.lv=lv;
  let sends=0, lost=0, aiAtk=0, aiSend=0; const LIMIT=(opt.limit||40)*60, R=1500, series=[]; const own=bw.nodes.map(n=>n.owner);
  const send0=bw.send.bind(bw); bw.send=function(s,t,...r){ if(s&&s.owner===1){ aiSend++; if(t&&t.owner===0) aiAtk++; } return send0(s,t,...r); };
  const start={my:bw.nodes.filter(n=>n.owner===0).length,en:bw.nodes.filter(n=>n.owner===1).length,neu:bw.nodes.filter(n=>n.owner===2).length,myPow:Math.round(bw.myPower()),enPow:Math.round(bw.myPower(1)),enCamp:Math.round(bw.nodes.find(n=>n.camp&&n.owner===1).count)};
  const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const decide=()=>{ const mine=bw.nodes.filter(n=>n.owner===0&&n.count>0&&!n.btl).sort((a,b)=>b.count-a.count); if(!mine.length) return null;
    if(bw.armies.filter(a=>a.owner===0&&!a.camped).length>=4) return null; let best=null, bs=-1e9;
    for(const s of mine){ if(s.camp&&s.count<400) continue; const keep= s.camp? 0.25 : 0;
      for(const n of bw.nodes){ if(n===s||n.btl) continue; const d=d2(n,s); if(d>R) continue; let sc=-1e9; const cnt=s.count*(1-keep);
        if(n.owner===2){ const eco=n.eco? (n.eco==='farm'?700:450):0; if(n.count<=0) sc=120+eco-d*0.25; else if(cnt>n.count){ const [ra]=bwResolve(s.type,cnt,n.type,n.count,bw.defMul(n),n.ter); sc= ra>0? ra*0.7+eco-d*0.25 : -1e9; } }
        else if(n.owner===1){ const est=bw.visNow(n)? n : (n.known||{count:n.count*1.15,type:n.type}); const [ra]=bwResolve(s.type,cnt,est.type,est.count*1.1,bw.defMul(n),n.ter); sc= ra>0? ra+est.count*0.4-d*0.25+(n.camp?5000:0)+(n.eco?500:0) : -1e9; }
        if(sc>bs){ bs=sc; best=[s,n]; } } }
    if(best&&bs>-1e8) return best;
    { const foes=bw.nodes.filter(n=>n.owner===1&&(n.count>0||n.camp)); if(foes.length&&foes.length<=4){ const tgt=foes.sort((a,b)=>(a.camp?1e6:0)+a.count-((b.camp?1e6:0)+b.count))[0];
        const S=[...mine].filter(n=>!n.eco&&!n.camp).sort((a,b)=>d2(a,tgt)-d2(b,tgt))[0]||mine[0];
        const est=bw.visNow(tgt)? tgt : (tgt.known||{count:tgt.count*1.15,type:tgt.type}); const [ra]=bwResolve(S.type,S.count,est.type,est.count*1.1,bw.defMul(tgt),tgt.ter);
        if(ra>0) return [S,tgt];
        const src=mine.filter(n=>n!==S&&n.count>(n.eco?260:(n.camp?500:90))).sort((a,b)=>b.count-a.count)[0]; if(src) return [src,S]; } }
    const front=[...mine].sort((a,b)=>bw.pA(b)-bw.pA(a))[0]; for(const s of mine){ if(s===front||s.camp||s.eco) continue; if(d2(s,front)<=R&&s.count>150) return [s,front]; }
    return null; };
  let nextS=0, minRatio=1e9, campHit=0; const camp=bw.nodes.find(n=>n.camp&&n.owner===0);
  let nextR=0;
  while(!bw.over&&bw.time<LIMIT){
    /* opt.defend: người chơi biết phòng thủ tối thiểu — thấy địch kéo tới trại/đồn yếu của mình thì bấm 🚑 Cứu trại */
    if(opt.defend&&bw.time>=nextR){ const th=bw.armies.find(a=>a.owner===1&&!a.done&&a.to>=0&&bw.nodes[a.to].owner===0&&(bw.nodes[a.to].camp||bw.nodes[a.to].eco)&&bw.nodes[a.to].count<a.count*1.1); if(th){ const n=bw.nodes[th.to]; bw.rallyCall(-1,n.x,n.y); nextR=bw.time+12; } }
    const mv=decide(); if(mv){ const a=send0(mv[0],mv[1]); if(a) sends++; }
    for(let k=0;k<40&&!bw.over;k++) bw.update(0.05);
    for(let i=0;i<bw.nodes.length;i++){ const o=bw.nodes[i].owner; if(own[i]===0&&o===1) lost++; own[i]=o; }
    if(camp.btl) campHit++;
    if(bw.time>=nextS){ nextS+=60; const mp=bw.myPower(), ep=bw.myPower(1); series.push([Math.round(bw.time/60),Math.round(mp),Math.round(ep),bw.nodes.filter(n=>n.owner===0).length,bw.nodes.filter(n=>n.owner===1).length]); if(bw.time>90) minRatio=Math.min(minRatio,mp/Math.max(1,ep)); } }
  return {lv,map,civ,tier:BW_AI_TIER(lv,false),over:bw.over,win:!!(bw.result&&bw.result.win),t:Math.round(bw.time),sends,lost,aiAtk,aiSend,campHit,minRatio:+minRatio.toFixed(2),start,series,stats:bw.stats,en:bw.civOf(1).name}; }
if(process.argv[1].endsWith('/ramp.mjs')){ const maps=(process.argv[3]||'3,9').split(',').map(Number);
  console.log('ải tier | lúc đầu: ta/địch/trung lập điểm · quân ta/địch · trại địch | kết quả (mỗi bản đồ): thời gian · mất điểm · máy đánh ta · trại ta bị công · tỉ lệ lực thấp nhất');
  for(let lv=1;lv<=10;lv++){ const rs=maps.map(m=>play(lv,(lv-1)*3+(m%3),'rome')); const s=rs[0].start;
    console.log(String(lv).padStart(2),rs[0].tier,'|',`${s.my}/${s.en}/${s.neu}`.padEnd(9),`${s.myPow}/${s.enPow}`.padEnd(12),String(s.enCamp).padEnd(5),'|',rs.map(r=>`${r.over?(r.win?'THẮNG':'THUA '):'hoà  '} ${String(Math.floor(r.t/60)).padStart(2)}p${String(r.t%60).padStart(2,'0')} mất ${String(r.lost).padStart(2)} máy-đánh ${String(r.aiAtk).padStart(3)} công-trại ${String(r.campHit).padStart(3)} tỉ-lệ ${r.minRatio}`).join('  ||  ')); } }
