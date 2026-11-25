// NGÂM QUẦN HÙNG: chạy một ván 37 nước suốt 40 phút trận (người chơi chỉ giữ kinh đô), 3 phút soi một lần:
// không số hỏng (NaN/âm), các mảng không phình vô hạn, mỗi nhịp tính toán vẫn nhẹ, ván lưu không phình, lưu → mở lại khớp trạng thái,
// thế giới có diễn biến (có nước bị diệt), cuối ván màn hình vẫn vẽ và nhận lệnh trên Android + iOS.
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
const MIN=+((process.argv.find(a=>a.startsWith('--min='))||'').slice(6))||40;
const b=await launch();
for(const [dn,dev,seed,civ] of [[DEVICES[0][0],DEVICES[0][1],314,'daiviet'],[PORTRAIT[1][0],PORTRAIT[1][1],2718,'maya']]){ console.log(dn,'· seed',seed);
  const T=await open(b,dev); const {p}=T;
  await T.ev(([seed,civ])=>{ G.bwCfg={royale:36,seed,map:seed%20,civ}; startBigWar(5); __ltm.bw.skipIntro(); G.paused=true; },[seed,civ]); await p.waitForTimeout(500);
  const st0=await T.ev(()=>{ const bw=__ltm.bw, P={}; for(const n of bw.nodes){ if(n.owner===2) continue; P[n.owner]=(P[n.owner]||0)+n.count; } const v=Object.entries(P).map(([k,x])=>[+k,Math.round(x)]).sort((a,b)=>b[1]-a[1]); return {nat:v.length,top:v.slice(0,3),me:v.find(x=>x[0]===0),med:v[v.length>>1][1],last:v[v.length-1]}; });
  console.log(`   mở màn: ${st0.nat} nước · mạnh nhất nước #${st0.top[0][0]} ${st0.top[0][1]} quân · trung vị ${st0.med} · người chơi ${st0.me[1]} · yếu nhất #${st0.last[0]} ${st0.last[1]}`);
  let prev=null, worst={upd:0,arm:0,txt:0,save:0,cache:0}; const natHist=[];
  for(let m=3;m<=MIN;m+=3){
    const r=await T.ev(()=>{ const bw=__ltm.bw, F=0; let tot=0, mx=0, n=0; const ds=[];
      for(let k=0;k<3600&&!bw.over;k++){ if(k%600===0){ const cap=bw.nodes.find(q=>q.camp&&q.owner===F); if(cap) cap.count=Math.max(cap.count,20000); }   // người chơi chỉ giữ kinh đô
        const t=performance.now(); bw.update(0.05); const d=performance.now()-t; tot+=d; n++; if(d>mx) mx=d; ds.push(d); }
      ds.sort((p,q)=>p-q); const p995=ds.length? ds[Math.min(ds.length-1,Math.floor(ds.length*0.995))] : 0;
      let bad=0; const badL=[]; const chk=(o,what)=>{ for(const k of ['x','y','count']){ const v=o[k]; if(!Number.isFinite(v)||(k==='count'&&v<-0.5)){ bad++; if(badL.length<4) badL.push(what+'.'+k+'='+v); } } };
      for(const q of bw.nodes){ chk(q,'node#'+q.id); if(q.owner==null||q.owner<0) { bad++; badL.push('node#'+q.id+' owner '+q.owner); } } for(const a of bw.armies) if(!a.done) chk(a,'army');
      const sizes={armies:bw.armies.length,convoys:(bw.convoys||[]).length,battles:bw.battles.length,texts:bw.texts.length,notes:bw.notes.length,fx:(bw.fx||[]).length,fxs:(bw.fxs||[]).length,rings:(bw.rings||[]).length,scouts:(bw.scouts||[]).length,aiScouts:(bw.aiScouts||[]).length,cache:bw.nav&&bw.nav.cache? bw.nav.cache.size : 0,allies:bw.allies.size};
      const t1=performance.now(); const okS=royaleSave(); const saveMs=performance.now()-t1; const s=localStorage.getItem('ltm_royale_save_v1')||'';
      const owners=new Set(bw.nodes.filter(q=>q.camp&&q.owner!==2).map(q=>q.owner)); let troops=0, mxN=0; for(const q of bw.nodes){ troops+=q.count; if(q.count>mxN) mxN=q.count; } for(const a of bw.armies) if(!a.done) troops+=a.count;
      return {t:bw.time,over:bw.over,avg:tot/Math.max(1,n),mx,p995,bad,badL,sizes,okS,saveKB:s.length/1024,saveMs,nat:owners.size,troops:Math.round(troops),mxN:Math.round(mxN),mine:bw.nodes.filter(q=>q.owner===F).length}; });
    natHist.push(r.nat); worst.upd=Math.max(worst.upd,r.mx); worst.arm=Math.max(worst.arm,r.sizes.armies); worst.txt=Math.max(worst.txt,r.sizes.texts); worst.save=Math.max(worst.save,r.saveKB); worst.cache=Math.max(worst.cache,r.sizes.cache);
    const tag=`phút ${Math.round(r.t/60)}`;
    ok(r.bad===0,`${tag}: không có số hỏng`+(r.bad?` (${r.bad}: ${r.badL.join(', ')})`:''));
    ok(r.sizes.armies<=900&&r.sizes.convoys<=200&&r.sizes.battles<=250&&r.sizes.texts<=400&&r.sizes.notes<=40&&r.sizes.fx<=1500&&r.sizes.fxs<=1500&&r.sizes.rings<=600&&r.sizes.scouts<=300&&r.sizes.aiScouts<=300&&r.sizes.cache<=6000,`${tag}: các mảng không phình (${JSON.stringify(r.sizes)})`);
    ok(r.avg<=3&&r.p995<=40&&r.mx<=900,`${tag}: mỗi nhịp tính ${r.avg.toFixed(2)} ms, 99,5% số nhịp ≤ ${r.p995.toFixed(1)} ms (nhịp tệ nhất ${r.mx.toFixed(0)} ms)`);
    ok(r.over||(r.okS&&r.saveKB<700&&r.saveMs<120),`${tag}: lưu ván ${r.saveKB.toFixed(0)} KB trong ${r.saveMs.toFixed(0)} ms`);
    ok(r.troops<6e6&&r.mxN<400000,`${tag}: quân số không lạm phát (cả bản đồ ${r.troops}, cứ điểm đông nhất ${r.mxN})`);
    if(process.argv.includes('-v')) console.log(`   ${tag}: ${r.nat} nước, người chơi ${r.mine} cứ điểm, ${r.sizes.armies} đạo quân, ${r.sizes.battles} trận, lưu ${r.saveKB.toFixed(0)} KB`);
    prev=r; if(r.over) break; }
  ok(natHist[natHist.length-1]<st0.nat,`thế giới có diễn biến: ${st0.nat} nước lúc đầu → ${natHist.join(' → ')}`);
  ok(natHist.every((v,i)=>i===0||v<=natHist[i-1]),'số nước chỉ giảm dần (không có nước "sống lại" sai luật)');
  // lưu → mở lại: trạng thái khớp, chơi tiếp được
  if(prev&&!prev.over){ const A=await T.ev(()=>{ const bw=__ltm.bw; royaleSave(); return {t:bw.time,own:bw.nodes.map(q=>q.owner).join(','),cnt:Math.round(bw.nodes.reduce((s,q)=>s+q.count,0)),arm:bw.armies.filter(a=>!a.done&&a.count>0).length,btl:bw.battles.filter(x=>!x.done).length,al:[...bw.allies].sort().join('|')}; });
    await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(300);
    await T.ev(()=>{ const o=royaleResume; royaleResume=function(){ const r=o(), bw=G.bw; window.__B={t:bw.time,own:bw.nodes.map(q=>q.owner).join(','),cnt:Math.round(bw.nodes.reduce((s,q)=>s+q.count,0)),arm:bw.armies.filter(a=>!a.done&&a.count>0).length,btl:bw.battles.filter(x=>!x.done).length,al:[...bw.allies].sort().join('|')}; return r; }; });   /* chụp trạng thái NGAY khi ván vừa nạp xong, trước khung hình đầu tiên */
    ok((await T.tapEl('#bBW')).ok,'mở lại game: chạm Đánh Boss'); await p.waitForTimeout(250); const rc=await T.tapEl('#bBossContinue'); ok(rc.ok,'chạm CONTINUE'+(rc.ok?'':' — '+rc.why));
    // dừng game NGAY khi ván vừa mở lại rồi mới so trạng thái (để lâu thêm 1 giây là có thể đã nổ ra trận mới — không phải lỗi lưu ván)
    const B=await T.until(()=>window.__B||null,null,6000);
    ok(!!B&&Math.abs(B.t-A.t)<1.5&&B.own===A.own&&Math.abs(B.cnt-A.cnt)<=A.cnt*0.002+50&&B.arm===A.arm&&B.al===A.al,`ván dài lưu → mở lại khớp: phút ${(A.t/60).toFixed(0)}, ${A.arm} đạo quân, ${A.btl} trận, chủ các cứ điểm và liên minh y nguyên`+(B? (B.own!==A.own?' [SAI CHỦ]':'')+(B.arm!==A.arm?` [đạo quân ${A.arm}→${B.arm}]`:'')+(B.al!==A.al?' [SAI LIÊN MINH]':'')+(Math.abs(B.cnt-A.cnt)>A.cnt*0.002+50?` [quân ${A.cnt}→${B.cnt}]`:'') : ' [không mở được]'));
    ok(B&&(B.btl===A.btl||(B.btl===A.btl+1&&B.t>A.t)),`các trận đang đánh dở còn nguyên (${A.btl} → ${B?B.btl:'?'}${B&&B.btl>A.btl?', thêm 1 trận vừa nổ ra sau khi mở lại':''})`);
    // cuối ván dài: màn hình vẫn vẽ đều, chạm chọn quân vẫn ăn
    await T.ev(()=>{ G.paused=false; }); const fps=await T.ev(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<1500) requestAnimationFrame(f); else res(n/1.5); }; requestAnimationFrame(f); }));
    ok(fps>=12,`cuối ván dài vẫn vẽ ${fps.toFixed(0)} khung/giây trên máy thử`);
    const me=await T.ev(()=>{ const bw=__ltm.bw; G.paused=true; bw.zoom=bw.zoomTgt=1; const m=bw.nodes.filter(q=>q.owner===0&&!q.btl&&q.count>60).sort((a,b)=>b.count-a.count)[0]; return m? [m.x,m.y,m.id] : null; });
    if(me){ await T.ev(()=>{ G.paused=false; }); const a=await T.aim(me[0],me[1]); await T.settle(); const a2=await T.scr(me[0],me[1]); await T.tap(a2[0],a2[1]); ok(await T.until((id)=>__ltm.bw.sel&&__ltm.bw.sel.id===id,me[2],2500),'cuối ván dài: chạm vào cứ điểm của mình vẫn chọn được'); } }
  console.log(`   nặng nhất cả ván: nhịp tính ${worst.upd.toFixed(0)} ms · ${worst.arm} đạo quân · ${worst.txt} chữ nổi · ván lưu ${worst.save.toFixed(0)} KB · nhớ ${worst.cache} lộ trình`);
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs.slice(0,3).join(' | '):''));
  await T.ctx.close(); }
await finish('NGÂM QUẦN HÙNG',b);
