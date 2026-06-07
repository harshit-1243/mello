/** The browser test console served at GET /test. Self-contained HTML/CSS/JS. */
export const TESTER_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mello — Agent Test Console</title>
<style>
  :root { --bg:#0e0f10; --panel:#17191b; --line:#26292d; --text:#e7e9ea; --muted:#8a9097; --green:#1db954; --bubble:#1f2937; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--text); }
  header { padding:16px 20px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; }
  .dot { width:10px; height:10px; border-radius:50%; background:var(--green); box-shadow:0 0 10px var(--green); }
  header h1 { font-size:15px; margin:0; font-weight:600; letter-spacing:.2px; }
  header .sub { color:var(--muted); font-size:12px; margin-left:auto; }
  .wrap { max-width:760px; margin:0 auto; padding:18px 16px 120px; }
  .controls { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; }
  .controls label { display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--muted); }
  select, input, button { font:inherit; }
  select, input[type=text] { background:#0c0d0e; color:var(--text); border:1px solid var(--line); border-radius:8px; padding:9px 10px; }
  button { cursor:pointer; border:none; border-radius:8px; padding:10px 16px; font-weight:600; }
  .btn-green { background:var(--green); color:#04210f; }
  .btn-ghost { background:#23262a; color:var(--text); }
  #log { margin-top:18px; display:flex; flex-direction:column; gap:10px; }
  .msg { max-width:78%; padding:10px 13px; border-radius:14px; line-height:1.4; white-space:pre-wrap; font-size:14px; }
  .me { align-self:flex-end; background:var(--green); color:#04210f; border-bottom-right-radius:4px; }
  .mello { align-self:flex-start; background:var(--bubble); border-bottom-left-radius:4px; }
  .tag { font-size:11px; color:var(--muted); margin:2px 4px; }
  .me-tag { align-self:flex-end; } .mello-tag { align-self:flex-start; }
  .composer { position:fixed; bottom:0; left:0; right:0; background:linear-gradient(transparent,var(--bg) 30%); padding:16px; }
  .composer .inner { max-width:760px; margin:0 auto; display:flex; gap:10px; }
  .composer input { flex:1; }
  .hint { color:var(--muted); font-size:12px; margin-top:10px; }
  .thinking { color:var(--muted); font-style:italic; }
</style>
</head>
<body>
<header>
  <span class="dot"></span>
  <h1>Mello — Agent Test Console</h1>
  <span class="sub">Raheja Ileseum · no phone needed</span>
</header>
<div class="wrap">
  <div class="controls">
    <label>Caller
      <select id="caller">
        <option value="+919653679703">Manan (member · Group 1 — triggers Bitu conflict)</option>
        <option value="+918369851507">Harshit (member)</option>
        <option value="+917000000000">Aman (non-member)</option>
      </select>
    </label>
    <label>Voice
      <select id="voice">
        <optgroup label="Female (bulbul:v2)">
          <option value="anushka" selected>anushka</option>
          <option value="manisha">manisha</option>
          <option value="vidya">vidya</option>
          <option value="arya">arya</option>
        </optgroup>
        <optgroup label="Male (bulbul:v2)">
          <option value="abhilash">abhilash</option>
          <option value="karun">karun</option>
          <option value="hitesh">hitesh</option>
        </optgroup>
      </select>
    </label>
    <button id="start" class="btn-green">Start call</button>
    <button id="reset" class="btn-ghost">Reset</button>
    <label style="flex-direction:row;align-items:center;gap:6px;color:var(--text);font-size:13px;">
      <input type="checkbox" id="autoplay" checked /> autoplay voice
    </label>
  </div>
  <div class="hint">Try: <b>kal 7 PM badminton chahiye</b> (as Manan → group conflict) · <b>kal 6 PM tennis available hai?</b></div>
  <div id="log"></div>
</div>
<div class="composer">
  <div class="inner">
    <input id="text" type="text" placeholder="Start the call first, then type what the caller says…" disabled autocomplete="off" />
    <button id="send" class="btn-green" disabled>Send</button>
  </div>
</div>

<script>
  const $ = (id) => document.getElementById(id);
  let sessionId = null;

  function bubble(text, who) {
    const tag = document.createElement('div');
    tag.className = 'tag ' + (who === 'me' ? 'me-tag' : 'mello-tag');
    tag.textContent = who === 'me' ? 'Caller' : 'Mello';
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    $('log').append(tag, div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  function play(b64) {
    if (!b64 || !$('autoplay').checked) return;
    new Audio('data:audio/wav;base64,' + b64).play().catch(() => {});
  }

  async function post(path, body) {
    const r = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return r.json();
  }

  $('start').onclick = async () => {
    $('log').innerHTML = '';
    sessionId = 'sess-' + Math.random().toString(36).slice(2);
    const thinking = bubble('connecting…', 'mello'); thinking.classList.add('thinking');
    const res = await post('/test/start', { sessionId, callerPhone: $('caller').value, speaker: $('voice').value });
    thinking.remove();
    bubble(res.reply || '(no greeting)', 'mello');
    play(res.audio);
    $('text').disabled = false; $('send').disabled = false; $('text').focus();
  };

  $('reset').onclick = () => { sessionId = null; $('log').innerHTML=''; $('text').disabled=true; $('send').disabled=true; };

  async function send() {
    const text = $('text').value.trim();
    if (!text || !sessionId) return;
    $('text').value = '';
    bubble(text, 'me');
    const thinking = bubble('…', 'mello'); thinking.classList.add('thinking');
    const res = await post('/test/message', { sessionId, text, speaker: $('voice').value });
    thinking.remove();
    bubble(res.reply || '(no reply)', 'mello');
    play(res.audio);
  }
  $('send').onclick = send;
  $('text').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
</script>
</body>
</html>`;
