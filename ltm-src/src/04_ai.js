// ============ AI phe máy — chỉ dùng thông tin phe đó đã thấy/khám phá ============
function aiThink(w, fac){
  if(fac.eliminated) return;
  const st=fac.aiState; const g=fac.general; const cfg=w.cfg; const sk=cfg.aiSkill; const now=w.time;
  if(!st.init){ st.init=true; if(w.cfg.mini){ /*mini: ép nhịp nhanh*/ } st.phase='gather'; st.pushAt = w.cfg.mini? 55+(fac.id*13)%25 : 250 - sk*130 + (fac.id*17)%40; st.nextPush=0; st.scoutTargets=new Map(); st.lastGoal=null; st.goalT=0; st.recruitGoal=-1; }
  const soldiers=fac.units.filter(u=>!u.dead&&u.type!=='general');
  const dX=w.drum.x, dY=w.drum.y;
  // ---- vật phẩm
  if(!g.dead && g.items.length && g.stam<45){ const k=g.items.indexOf('bun'); if(k>=0) w.useItem(g,k); }
  for(const u of soldiers){ const sq=u.squad; if(sq&&sq.item==='tea'){ let s=0,n=0; for(const m of sq.members){ if(!m.dead){s+=m.stam;n++;} } if(n&&s/n<7) w.useItem(u,0); } }
  // ---- chuyển pha
  const someoneHolding = w.drum.holder>=0 && w.drum.holder!==fac.id && w.factions[w.drum.holder].holdStreak>12;
  if(!w.stormOn && !w.cfg.mini && st.phase==='push' && fac.count<4 && w.drum.holder!==fac.id && !g.dead && (now-(st.pushedAt||0))>40){ st.phase='gather'; st.pushAt=now+50+w.rnd()*40; }
  if(st.phase==='gather' && ((now>st.pushAt && fac.count>=5) || (sk>0.6 && fac.count>=fac.cap*0.85) || (someoneHolding && fac.count>=6))) { st.phase='push'; st.nextPush=0; st.pushedAt=now; }
  if(g.dead){ if(st.phase==='push' && now>st.nextPush){ st.nextPush=now+8; const army=soldiers.filter(u=>u.type!=='scout'&&!(u.squad&&u.squad.flag)); if(army.length) w.cmdMove(army,dX,dY); } return; }
  // ---- cơ hội chiêu hàng
  if(!g.channel){
    const near=w.flaggedNear(g); if(near.length && fac.count<fac.cap){ w.cmdSurrender(g,near[0]); return; }
    if(sk>0.3) for(const sq of w.squads){ if(sq.dead||!sq.flag||sq.f===fac.id) continue; const m=[...sq.members].find(x=>!x.dead); if(!m) continue;
      if(w.canSee(fac.id,m) && Math.hypot(m.x-g.x,m.y-g.y)<14 && fac.count<fac.cap){ if(!(g.mode==='move'&&g.order&&g.order.x===m.x&&g.order.y===m.y)) w.cmdMove([g],m.x,m.y); return; } }
  } else return;
  // ---- giữ quân theo tướng (gom lại quân lẻ)
  if(st.phase==='gather'){
    for(const u of soldiers){ if(u.type==='scout') continue; if(u.mode==='hold' && !(u.squad&&u.squad.flag) && Math.hypot(u.x-g.x,u.y-g.y)>3) w.cmdFollow([u]); }
    // mục tiêu chiêu mộ: lính trung lập nhớ được gần nhất
    if(g.mode==='move' && now-st.goalT<20 && st.recruitGoal>=0 && fac.memNeutral.has(st.recruitGoal)) return;
    let best=-1, bd=1e9;
    for(const [i] of fac.memNeutral){ const x=i%w.W, y=(i/w.W)|0; const d=Math.abs(x-g.x)+Math.abs(y-g.y) + Math.hypot(x-dX,y-dY)*0.15; if(d<bd){bd=d;best=i;} }
    if(w.cfg.mini && best>=0){ const bx=best%w.W, by=(best/w.W)|0; if(now<st.pushAt-5 && Math.abs(bx-dX)+Math.abs(by-dY)<5) best=-1; }
    if(best>=0 && bd<30+sk*40 && fac.count<fac.cap){ st.recruitGoal=best; st.goalT=now; w.cmdMove([g],best%w.W,(best/w.W)|0); return; }
    st.recruitGoal=-1;
    if(g.mode!=='move' || now-st.goalT>40){ // tự đi mở đường về hướng Trống
      st.goalT=now; st.exploreN=(st.exploreN||0)+1;
      if(w.cfg.mini && now<st.pushAt-5 && Math.abs(g.x-dX)+Math.abs(g.y-dY)<6){ const p2=pickTarget(w,fac,fac.camp.x,fac.camp.y); if(p2) w.cmdMove([g],p2.x,p2.y); return; }
      // lúc đầu dò về hướng Trống; về sau đi tìm vùng chưa khám phá để tuyển quân
      const ang = st.exploreN<3 ? Math.atan2(dY-g.y,dX-g.x)+(w.rnd()-0.5)*1.2 : Math.atan2(g.y-dY,g.x-dX)+(w.rnd()-0.5)*2.4; const dd=8+w.rnd()*10;
      const p=pickTarget(w,fac,g.x+Math.cos(ang)*dd,g.y+Math.sin(ang)*dd); if(p) w.cmdMove([g],p.x,p.y); }
    return;
  }
  // ---- pha tiến công Trống
  const inPlaza=(u)=>Math.abs(u.x-dX)<=w.drum.h+1&&Math.abs(u.y-dY)<=w.drum.h+1;
  if(now>st.nextPush){
    st.nextPush=now+ (inPlaza(g)? 10: 7);
    const army=soldiers.filter(u=>u.type!=='scout'&&!(u.squad&&u.squad.flag));
    // tướng yếu thì lùi một nhịp (AI giỏi hơn)
    if(sk>0.5 && g.hp<g.maxhp*0.3){ w.cmdMove([g],fac.camp.x,fac.camp.y); return; }
    const toDrum=(u)=>u.mode==='move'&&u.order&&u.order.x===dX&&u.order.y===dY&&now-u.order.t<20;
    const h=w.drum.h; const inP=(u)=>Math.abs(u.x-dX)<=h&&Math.abs(u.y-dY)<=h;
    const inFlagZone=(u)=>w.flags.some(fl=>Math.abs(u.x-fl.x)<=1&&Math.abs(u.y-fl.y)<=1);
    const needFlag = w.flags.length && !fac.flagCount;
    let tX=dX, tY=dY, th=h;
    if(needFlag){ let bf=null,bd2=1e9; for(const fl of w.flags){ const d2=Math.abs(fl.x-g.x)+Math.abs(fl.y-g.y); if(d2<bd2){bd2=d2;bf=fl;} } if(bf){ tX=bf.x; tY=bf.y; th=1; } }
    const toTgt=(u)=>u.mode==='move'&&u.order&&u.order.x===tX&&u.order.y===tY&&now-u.order.t<20;
    const inT=(u)=>Math.abs(u.x-tX)<=th&&Math.abs(u.y-tY)<=th;
    const mine=[g,...army].filter(u=>!u.dead&&inT(u)).length;
    const want=Math.min(army.length+1,(2*th+1)*(2*th+1));
    const moveSet=[g, ...army].filter(u=>!toTgt(u) && !inT(u) && !inFlagZone(u) && (mine<want || !(u.mode==='hold'&&Math.hypot(u.x-tX,u.y-tY)<=th+3)));
    if(moveSet.length) w.cmdMove(moveSet,tX,tY);
    if(!needFlag && w.flags.length && fac.flagCount===1 && army.length>14){ // đủ đông: tranh thêm cờ thứ hai
      let bf=null,bd2=1e9; for(const fl of w.flags){ if(fl.holder===fac.id) continue; const d2=Math.abs(fl.x-g.x)+Math.abs(fl.y-g.y); if(d2<bd2){bd2=d2;bf=fl;} }
      if(bf){ const det=army.filter(u=>!inFlagZone(u)&&!inP(u)).slice(0,4); if(det.length) w.cmdMove(det,bf.x,bf.y); }
    }
  }
}
function pickTarget(w,fac,x,y){
  x=Math.round(Math.max(3,Math.min(w.W-4,x))); y=Math.round(Math.max(3,Math.min(w.H-4,y)));
  for(let r=0;r<6;r++) for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; const nx=Math.round(x+Math.cos(a)*r), ny=Math.round(y+Math.sin(a)*r); if(!w.inb(nx,ny)) continue; const i=ny*w.W+nx; if(w.passFor(fac.id,i)) return {x:nx,y:ny}; }
  return null;
}
function nearestStation(w,fac,u){ let best=null,bd=1e9; for(const s of w.map.stations){ const i=s.y*w.W+s.x; if(!fac.explored[i]) continue; const d=Math.abs(s.x-u.x)+Math.abs(s.y-u.y); if(d<bd){bd=d;best=s;} } return best && bd<40 ? best : null; }
