// (5.5) Nạp trước MỌI bài thử (gate.mjs đặt NODE_OPTIONS=--import): trình duyệt thử coi như người chơi đã học xong hướng dẫn lần đầu,
// nên các bài thử cũ bấm BATTLE vẫn vào bảng chọn chế độ như trước. Bài thử hướng dẫn đặt globalThis.__LTM_TUT_TEST=true để tắt việc này.
import pw from 'playwright';
const mark=()=>{ try{ if(!localStorage.getItem('ltm_tut')) localStorage.setItem('ltm_tut','1'); }catch(e){} };
const L0=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{ const b=await L0(...a); const nc=b.newContext.bind(b);
  b.newContext=async(...o)=>{ const c=await nc(...o); if(!globalThis.__LTM_TUT_TEST) await c.addInitScript(mark); return c; };
  b.newPage=async(o)=>{ const c=await b.newContext(o); const p=await c.newPage(); p.once('close',()=>c.close().catch(()=>{})); return p; };
  return b; };
const LP=pw.chromium.launchPersistentContext.bind(pw.chromium);
pw.chromium.launchPersistentContext=async(...a)=>{ const c=await LP(...a); if(!globalThis.__LTM_TUT_TEST) await c.addInitScript(mark); return c; };   /* hồ sơ trình duyệt lưu trên đĩa (bài thử "tắt hẳn app rồi mở lại") */
