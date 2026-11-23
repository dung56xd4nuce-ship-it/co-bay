// BOT ĐÁNH 10 ẢI: một "người chơi máy" chơi trọn từng ải 1v1 ở tốc độ nhanh để soi CÂN BẰNG và lỗi kẹt ván:
//   • không lỗi JS / không toạ độ NaN · ván nào cũng phải kết thúc hoặc còn tiến triển · ải 1–2 bot phải thắng được
//   • in bảng thắng/thua + thời gian từng ải để theo dõi độ khó tăng dần
// node test/gate_bot.mjs [url] [--stages=1,2,3] [--civ=rome]
import { launch, open, ok, finish, DEVICES, URL } from './lib.mjs';
const STAGES=((process.argv.find(a=>a.startsWith('--stages='))||'').slice(9)||'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const CIV=(process.argv.find(a=>a.startsWith('--civ='))||'').slice(6)||'rome';
const b=await launch(); const T=await open(b,DEVICES[0][1]); const {p}=T; const rows=[];
for(const lv of STAGES){
  const r=await p.evaluate(([lv,civ])=>{ const BWc=__ltm.BigWar, bwResolve=__ltm.bwResolve; const bw=new BWc(lv,{map:(lv*3)%20,civ,autoMenu:true}); bw.lv=lv;
    let nan=0, sends=0, lastProg=0, lastPow=0, stuck=0, rallyT=-1e9; const LIMIT=30*60, R=1500, dbg=[];
    const decide=()=>{ const mine=bw.nodes.filter(n=>n.owner===0&&n.count>0&&!n.btl).sort((a,b)=>b.count-a.count); if(!mine.length) return null;
      if(bw.armies.filter(a=>a.owner===0&&!a.camped).length>=4) return null;
      const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y); let best=null, bs=-1e9;
      for(const s of mine){ if(s.camp&&s.count<400) continue; const keep= s.camp? 0.25 : 0;
        for(const n of bw.nodes){ if(n===s||n.btl) continue; const d=d2(n,s); if(d>R) continue; let sc=-1e9; const cnt=s.count*(1-keep);
          if(n.owner===2){ const eco=n.eco? (n.eco==='farm'?700:450):0; if(n.count<=0) sc=120+eco-d*0.25; else if(cnt>n.count) sc=n.count*2.2+eco-d*0.25; else { const [ra]=bwResolve(s.type,cnt,n.type,n.count,bw.defMul(n),n.ter); sc= ra>0? ra*0.7+eco-d*0.25 : -1e9; } }
          else if(n.owner===1){ const est=bw.visNow(n)? n : (n.known||{count:n.count*1.15,type:n.type}); const [ra]=bwResolve(s.type,cnt,est.type,est.count*1.1,bw.defMul(n),n.ter); sc= ra>0? ra+est.count*0.4-d*0.25+(n.camp?5000:0)+(n.eco?500:0) : -1e9; }
          if(sc>bs){ bs=sc; best=[s,n]; } } }
      if(best&&bs>-1e8) return best;
      // TÀN CUỘC như người chơi: địch co cụm → dồn quân các cứ điểm về MỘT tiền đồn sát địch nhất, đủ lực thì công
      { const foes=bw.nodes.filter(n=>n.owner===1&&(n.count>0||n.camp)); if(foes.length&&foes.length<=4){ const tgt=foes.sort((a,b)=>(a.camp?1e6:0)+a.count-((b.camp?1e6:0)+b.count))[0];
          const S=[...mine].filter(n=>!n.eco&&!n.camp).sort((a,b)=>d2(a,tgt)-d2(b,tgt))[0]||mine[0];
          const est=bw.visNow(tgt)? tgt : (tgt.known||{count:tgt.count*1.15,type:tgt.type}); const [ra]=bwResolve(S.type,S.count,est.type,est.count*1.1,bw.defMul(tgt),tgt.ter);
          if(ra>0){ dbg.push(`t=${Math.round(bw.time)} STRIKE ${Math.round(S.count)} ${S.type} → ${Math.round(est.count)} ${est.type} (def ${bw.defMul(tgt).toFixed(2)})`); return [S,tgt]; }
          const src=mine.filter(n=>n!==S&&n.count>(n.eco?260:(n.camp?500:90))).sort((a,b)=>b.count-a.count)[0]; if(src) return [src,S]; } }
      // bí nước: dồn quân lẻ về khối lớn nhất nằm gần địch nhất để gom lực
      const front=[...mine].sort((a,b)=>bw.pA(b)-bw.pA(a))[0]; for(const s of mine){ if(s===front||s.camp||s.eco) continue; if(d2(s,front)<=R&&s.count>150) return [s,front]; }
      return null; };
    let t=0; while(!bw.over&&bw.time<LIMIT){ const mv=decide(); if(mv==='did') sends++; else if(mv){ const a=bw.send(mv[0],mv[1]); if(a) sends++; }
      for(let k=0;k<40&&!bw.over;k++) bw.update(0.05);
      for(const a of bw.armies) if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||!Number.isFinite(a.count)) nan++;
      if(bw.time-lastProg>240){ const pw=Math.round(bw.myPower()+bw.nodes.filter(n=>n.owner===0).length*1000); if(pw===lastPow) stuck++; lastPow=pw; lastProg=bw.time; } }
    const en=bw.nodes.filter(n=>n.owner===1), my=bw.nodes.filter(n=>n.owner===0);
    return {dbg:dbg.slice(0,40),lv,over:bw.over,win:bw.result&&bw.result.win,t:Math.round(bw.time),sends,nan,stuck,myNodes:my.length,enNodes:en.length,myPow:Math.round(bw.myPower()),enPow:Math.round(bw.myPower(1)),stats:bw.stats,civs:[bw.civOf?bw.civOf(0).name:'-',bw.civOf?bw.civOf(1).name:'-']}; },[lv,CIV]);
  rows.push(r); if(process.argv.includes('--debug')) console.log(r.dbg.join('\n'));
  console.log(`  ải ${String(lv).padStart(2)} · ${r.civs[0]} vs ${r.civs[1]} → ${r.over? (r.win?'THẮNG':'THUA') : 'chưa ngã ngũ'} sau ${Math.floor(r.t/60)}p${String(r.t%60).padStart(2,'0')} · lệnh ${r.sends} · ta ${r.myNodes} điểm/${r.myPow} quân · địch ${r.enNodes} điểm/${r.enPow} quân · thắng ${r.stats.win} thua ${r.stats.lose} trận`);
  ok(r.nan===0,`ải ${lv}: không có toạ độ/quân số NaN`);
  ok(r.over||r.sends>20,`ải ${lv}: ván có diễn biến (kết thúc hoặc bot ra được >20 lệnh)`);
}
const w=rows.filter(r=>r.win).length, l=rows.filter(r=>r.over&&!r.win).length;
console.log(`  tổng: bot thắng ${w}/${rows.length}, thua ${l}, chưa ngã ngũ ${rows.length-w-l}`);
if(STAGES.includes(1)) ok(rows.find(r=>r.lv===1).win===true,'ải 1: bot thắng được (ải mở đầu không được quá khó)');
if(STAGES.includes(10)&&STAGES.includes(1)) ok(!(rows.find(r=>r.lv===10).win&&rows.find(r=>r.lv===10).t<rows.find(r=>r.lv===1).t),'ải 10 không dễ hơn ải 1');
ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs[0]:''));
await finish('BOT ĐÁNH 10 ẢI',b);
