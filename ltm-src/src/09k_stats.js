// ============ 📈 (5.8) THỐNG KÊ QUÂN SỐ: góc phải dưới — tổng quân của ta cập nhật liên tục + biểu đồ theo thời gian trận ============
// Mẫu lấy theo giờ trận (mỗi 5 s); quá 240 mẫu thì gộp đôi và giãn nhịp ×2 → biểu đồ luôn phủ trọn cả trận dù chơi bao lâu. Lưu cùng ván.
BW.stat={ every:5, max:240 };
BigWar.prototype.statTick=function(){ let S=this._st; if(!S||!Array.isArray(S.h)) S=this._st={t:0,every:BW.stat.every,h:[],t0:this.time};
  if(this.time<S.t) return; S.t=this.time+S.every; S.h.push(Math.round(this.myPower()));
  if(S.h.length>BW.stat.max){ const h=[]; for(let i=0;i<S.h.length;i+=2) h.push(i+1<S.h.length? Math.round((S.h[i]+S.h[i+1])/2) : S.h[i]); S.h=h; S.every*=2; S.t=this.time+S.every; } };
BigWar.prototype.statRect=function(L){ const w=Math.max(150,Math.min(200,L.W*0.3)), h=52; let x=L.X1-w-10, y=L.Y1-h-10;
  const z=(this._zBtns||[])[1]; if(z&&z.y+z.h>y-6&&z.x<x+w) x=Math.min(x,z.x-8-w);   /* nút − ở thấp (màn thấp): lùi sang trái */
  return {x,y,w,h}; };
BigWar.prototype.drawStat=function(c,L,tm){ this._statBox=null;
  if(this.intro||this.tut||this.menu||this.rallyOpen||this.rallyPick||this._gearMenu||this._hintOn) return;
  const r=this.statRect(L), hit=(q)=> q&&q.x<r.x+r.w+4&&q.x+q.w>r.x-4&&q.y<r.y+r.h+4&&q.y+q.h>r.y-4;
  for(const q of [this._hintBox,this._unitChip,this._ambBtn,this._retreatBtn,this._gearBtn,this._rallyBtn,this._orderMenu,this._rallyMenu]) if(hit(q)) return;   /* nhường chỗ cho thẻ binh chủng / nút mai phục / rút lui khi màn hẹp */
  const pt=performance.now(); if(!this._stNow||pt-this._stNowT>200||pt<this._stNowT){ this._stNow=this.myPower(); this._stNowT=pt; }   /* đếm lại 5 lần/giây là đủ mắt thấy liên tục */
  const S=this._st, now=this._stNow, FONT='"Baloo 2",system-ui';
  c.save(); c.globalAlpha=Math.max(0.55,this.hudAlpha());
  c.fillStyle='rgba(20,12,36,0.78)'; rr(c,r.x,r.y,r.w,r.h,12); c.fill(); c.strokeStyle='rgba(255,255,255,0.18)'; c.lineWidth=1.5; rr(c,r.x+0.75,r.y+0.75,r.w-1.5,r.h-1.5,12); c.stroke();
  // hàng 1: nhãn + chênh lệch so với ~1 phút trước · hàng 2: tổng quân (trái) + biểu đồ cả trận (phải)
  c.textBaseline='alphabetic'; c.textAlign='left'; c.font=`800 11px ${FONT}`; c.fillStyle='#bcd3ff'; c.fillText('👥 YOUR TROOPS',r.x+9,r.y+14);
  let d=null; if(S&&S.h.length>1){ const k=Math.max(1,Math.round(60/S.every)), past=S.h[Math.max(0,S.h.length-1-k)]; d=+bwN(now)-+bwN(past); }
  if(d!=null&&d!==0){ c.textAlign='right'; c.fillStyle= d>0? '#7dffb0' : '#ff9a8a'; c.fillText((d>0?'▲ +':'▼ ')+Math.abs(d).toLocaleString('en-US'),r.x+r.w-9,r.y+14); }
  const tw=Math.round(r.w*0.5), txt=Number(bwN(now)).toLocaleString('en-US'); let fz=19; c.textAlign='left'; c.font=`900 ${fz}px ${FONT}`; while(fz>12&&c.measureText(txt).width>tw-6){ fz--; c.font=`900 ${fz}px ${FONT}`; }
  c.fillStyle='#ffffff'; c.fillText(txt,r.x+9,r.y+r.h-9);
  const gx=r.x+tw+4, gw=r.x+r.w-9-gx, gy=r.y+20, gh=r.h-26;
  if(S&&S.h.length>1&&gw>20){ const h=S.h.concat([now]); let mx=1, mn=Infinity; for(const v of h){ if(v>mx) mx=v; if(v<mn) mn=v; } const n=h.length;
    const lo=Math.max(0,mn-(mx-mn)*0.25-mx*0.02), hi=mx+(mx-mn)*0.08+mx*0.02, X=(i)=>gx+gw*i/(n-1), Y=(v)=>gy+gh-gh*(v-lo)/Math.max(1,hi-lo);   /* trục dọc theo khoảng dao động: thấy rõ lên/xuống */
    c.fillStyle='rgba(255,255,255,0.06)'; c.fillRect(gx,gy,gw,gh);
    c.beginPath(); c.moveTo(X(0),gy+gh); for(let i=0;i<n;i++) c.lineTo(X(i),Y(h[i])); c.lineTo(X(n-1),gy+gh); c.closePath(); c.fillStyle='rgba(59,130,246,0.30)'; c.fill();
    c.beginPath(); for(let i=0;i<n;i++){ const px=X(i), py=Y(h[i]); if(i) c.lineTo(px,py); else c.moveTo(px,py); } c.strokeStyle='#7cc0ff'; c.lineWidth=2; c.lineJoin='round'; c.stroke();
    c.fillStyle='#ffffff'; c.beginPath(); c.arc(X(n-1),Y(now),2.6,0,Math.PI*2); c.fill(); }
  c.restore(); this._statBox=r; };
