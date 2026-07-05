'use strict';
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(p, o) { return fetch(p, o).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; }); }
  function flag(name) { fetch('/api/flag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flag: name }) }).catch(function () {}); }
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  var ROSTER = [], CUR = 'overview', EXEC = false;
  var TITLES = { overview: '概览', funnel: '招聘漏斗', candidates: '候选人池', roster: '在职花名册', health: '健康数据看板', onboarding: '入职预处理', log: '系统日志', exec: '执行视图', db: '数据库' };

  $('#auth').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#pass').value.trim(); $('#auth-err').textContent = '';
    api('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pass: v }) }).then(function (d) { if (d.ok) enter(); else $('#auth-err').textContent = '口令错误。'; });
  });
  api('/api/state').then(function (s) { if (s && s.unlocked) enter(); });

  function enter() {
    $('#gate').style.display = 'none'; $('#app').style.display = 'flex';
    api('/api/state').then(function (s) { if (s.profile) $('#who').textContent = s.profile.name; });
    api('/api/emp/exec').then(function (d) { if (d && d.unlocked) EXEC = true; });
    $$('.sitem').forEach(function (it) { it.addEventListener('click', function () { switchView(it.dataset.v); }); });
    load(); setInterval(load, 8000); setInterval(pulseLost, 1100);
  }

  function switchView(v) {
    CUR = v;
    $$('.sitem').forEach(function (it) { it.classList.toggle('active', it.dataset.v === v); });
    ['overview', 'funnel', 'candidates', 'roster', 'health', 'onboarding', 'log', 'exec', 'db'].forEach(function (x) { $('#view-' + x).style.display = (x === v) ? '' : 'none'; });
    $('#view-title').textContent = TITLES[v];
    if (v === 'exec') renderExec(); else if (v === 'db') renderDB(); else render();
  }
  function load() { api('/api/emp/roster').then(function (d) { if (d.ok) { ROSTER = d.items; if (CUR !== 'exec') render(); } }); }

  function render() {
    if (!ROSTER.length) return;
    if (CUR === 'overview') renderOverview();
    else if (CUR === 'funnel') renderFunnel();
    else if (CUR === 'candidates') renderCandidates();
    else if (CUR === 'roster') renderRoster();
    else if (CUR === 'health') renderHealth();
    else if (CUR === 'onboarding') renderOnboarding();
    else if (CUR === 'log') renderLog();
  }
  function renderOverview() {
    var sig = ROSTER.filter(function (r) { return /rerouted\|pending\|retained\|reserved\|last attendance/.test(r.note||''); }).length;
    var onb = ROSTER.filter(function (r) { return /onboarding\|held/.test(r.status); }).length;
    $('#view-overview').innerHTML = kpi('Total', ROSTER.length) + kpi('Active', ROSTER.length - onb - sig, 'ok') + kpi('Signal Pending', sig) + kpi('Onboarding', onb) +
      '<div class="block"><div class="bhead"><span>· 招聘漏斗（本月）</span></div><div class="panel" style="padding:14px">' + frow('投递', 1240, 1240) + frow('筛选', 980, 1240) + frow('面试', 620, 1240) + frow('Offer', 410, 1240) + frow('入职', 405, 1240, true) + '</div></div>' +
      '<div class="note">' + sig + ' employees: signal pending confirmation — monitoring data continues.</div>';
  }
  function kpi(l, n, cls) { return '<div class="k"><div class="kn ' + (cls || '') + '">' + n + '</div><div class="kl">' + l + '</div></div>'; }
  function frow(l, n, max, danger) { return '<div class="frow"><div class="fl">' + l + '</div><div class="fbar ' + (danger ? 'danger' : '') + '" style="width:' + Math.max(8, n / max * 100) + '%">' + n + '</div></div>'; }
  function renderFunnel() { $('#view-funnel').innerHTML = '<div class="block"><div class="bhead"><span>· 转化漏斗</span><span class="r">offer→入职 98.8%</span></div><div class="panel" style="padding:16px">' + frow('投递', 1240, 1240) + frow('面试', 620, 1240) + frow('Offer', 410, 1240) + frow('入职', 405, 1240, true) + '</div><div class="note">90-day retention: 99.1%. Voluntary separation (3yr): 0.</div></div>'; }
  function renderCandidates() {
    var rows = [{ id: 'CA-2025-04412', name: '王××', pos: '高级前端', src: '得人招聘', stage: '面试中' }, { id: 'CA-2025-04438', name: '李××', pos: 'AI 算法', src: '内推', stage: 'Offer' }];
    var you = ROSTER.find(function (r) { return /你/.test(r.name); });
    if (you) rows.push({ id: 'CA-2025-04488', name: you.name, pos: '待分配', src: '得人招聘', stage: '入职预处理' });
    $('#view-candidates').innerHTML = '<div class="block"><div class="bhead"><span>· 候选人池</span></div><div class="panel"><table><thead><tr><th>编号</th><th>姓名</th><th>岗位</th><th>来源</th><th>阶段</th></tr></thead><tbody>' + rows.map(function (c) { return '<tr class="' + (/你/.test(c.name) ? 'you' : '') + '"><td>' + c.id + '</td><td>' + esc(c.name) + '</td><td>' + esc(c.pos) + '</td><td>' + esc(c.src) + '</td><td>' + esc(c.stage) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function renderRoster() {
    $('#view-roster').innerHTML = '<div class="block"><div class="bhead"><span>· 在职花名册（B 座）</span><span class="r">点击工号查看详情</span></div><div class="panel"><table><thead><tr><th>工号</th><th>姓名</th><th>部门</th><th>入职</th><th>天数</th><th>最后活跃</th><th>状态</th></tr></thead><tbody>' + ROSTER.map(function (r) { var cls = r.id === 'MC-0000' ? 'empty' : (/you/.test(r.name) ? 'you' : (/rerouted|retained|B4/.test(r.note||'') ? 'lost' : '')); return '<tr class="' + cls + '"><td class="id" data-id="' + r.id + '">' + r.id + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.dept) + '</td><td>' + esc(r.since) + '</td><td>' + (r.days || '——') + '</td><td>' + esc(r.last) + '</td><td class="status">' + esc(r.status) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="note">// data monitoring continues per protocol, independent of attendance records.</div></div>';
    $$('#view-roster .id').forEach(function (el) { el.addEventListener('click', function () { onClick(el.dataset.id); }); });
  }
  function renderHealth() {
    var rows = ROSTER.map(function (r) { var sigPending = /rerouted|retained|B4|reserved/.test(r.note||''); var hr = sigPending ? rnd(52, 78) : rnd(62, 78); return '<div class="hrow ' + (sigPending ? 'lost' : '') + '"><span>' + r.id + '</span><span>' + esc(r.name) + '</span><span class="pulse">♥ <b>' + hr + '</b> bpm</span><span class="sleep">sleep ' + (sigPending ? rnd(3, 5) : rnd(6, 8)) + 'h</span><span class="mood">mood ' + (sigPending ? rnd(15, 38) : rnd(55, 82)) + '</span><span class="status">' + esc(r.status) + '</span></div>'; }).join('');
    $('#view-health').innerHTML = '<div class="block"><div class="bhead"><span>· 健康数据看板（实时）</span><span class="r">手环 / 工位采集器</span></div><div class="panel">' + rows + '</div><div class="note">Monitoring data continues regardless of HR status. System classification: normal.</div></div>';
  }
  function pulseLost() { $$('#view-health .hrow.lost .pulse b').forEach(function (b) { b.textContent = rnd(50, 82); }); }
  function renderOnboarding() {
    var steps = [['profile intake', 'complete'], ['baseline modeling', 'complete'], ['data agreement', 'complete'], ['background check', 'in progress'], ['device shipped', 'complete'], ['B4 workstation assigned', 'complete'], ['start date', 'pending']];
    $('#view-onboarding').innerHTML = '<div class="block"><div class="bhead"><span>· 入职预处理 · MC-0050</span></div><div class="panel"><table><thead><tr><th>步骤</th><th>状态</th></tr></thead><tbody>' + steps.map(function (s) { return '<tr><td>' + s[0] + '</td><td class="status">' + s[1] + '</td></tr>'; }).join('') + '</tbody></table></div><div class="note">System will notify upon completion.</div></div>';
  }
  function renderLog() {
    var now = new Date(); function ts(off) { var d = new Date(now.getTime() - off * 60000); return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0'); }
    var logs = [[ts(2), '', 'B4 collector routine restart complete'], [ts(18), '', 'MC-0019 health data: HR 68 / sleep 4.2h'], [ts(35), 'warn', 'MC-0019 last attendance: 2025-03-12 (7d; status unchanged)'], [ts(52), '', 'MC-0048 / MC-0049 data merged into B4 pool'], [ts(70), '', 'MC-0050 baseline modeling complete'], [ts(95), 'warn', 'external access detected: [127.0.0.1]'], [ts(180), 'danger', 'MC-0040 signal loss — classified: normal (source rerouted to B4)']];
    $('#view-log').innerHTML = '<div class="block"><div class="bhead"><span>· 系统日志</span></div><div class="panel">' + logs.map(function (l) { return '<div class="lrow ' + (l[1] === 'warn' ? 'warn' : l[1] === 'danger' ? 'danger' : '') + '"><span class="lt">' + l[0] + '</span>' + esc(l[2]) + '</div>'; }).join('') + '</div></div>';
  }

  function renderDB() {
    $('#view-db').innerHTML = '<div class="block"><div class="bhead"><span>· 数据库查询</span></div><div class="panel" style="padding:16px"><form id="db-form" style="display:flex;flex-direction:column;gap:8px"><input id="db-pass" type="text" placeholder="口令" style="background:var(--bg);border:1px solid #2a3650;color:#fff;border-radius:5px;padding:8px 10px;font-family:inherit;font-size:13px"><input id="db-sql" type="text" placeholder="SQL" style="background:var(--bg);border:1px solid #2a3650;color:#fff;border-radius:5px;padding:8px 10px;font-family:inherit;font-size:13px"><button type="submit" style="background:#1f2937;color:#fff;border:1px solid #374151;border-radius:5px;padding:8px;font-family:inherit;cursor:pointer">查询</button></form><div id="db-out" style="margin-top:12px;font-family:monospace;font-size:12px;color:#c7d0db;line-height:1.8"></div></div></div>';
    document.getElementById('db-form').addEventListener('submit', function(e){ e.preventDefault(); var p=document.getElementById('db-pass').value.trim(); var s=document.getElementById('db-sql').value.trim(); fetch('/api/emp/db',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:p,sql:s})}).then(function(r){return r.json()}).then(function(d){ var o=document.getElementById('db-out'); if(d.ok){ var rows=d.result.rows||[]; var t=rows.map(function(r){ return r.id+' | '+r.status+' | '+r.physical+(r.note?' | '+r.note:'') }).join('<br/>'); o.innerHTML=t||JSON.stringify(d.result); } else o.textContent=d.error||'error'; }) });
  }
  // —— 执行视图（二级权限）——
  function renderExec() {
    var v = $('#view-exec');
    if (!EXEC) {
      v.innerHTML = '<div class="block"><div class="bhead"><span>· 执行视图</span><span class="r">仅限董事级别</span></div><div class="panel" style="padding:24px"><div style="color:#e7ecf3;font-size:14px;margin-bottom:16px">该模块需要执行权限。普通 HR 口令无法访问。</div><form id="exec-auth" style="display:flex;gap:8px"><input id="exec-pass" type="text" placeholder="执行口令" style="flex:1;background:var(--bg);border:1px solid #2a3650;color:#fff;border-radius:5px;padding:9px 12px;font-family:inherit;font-size:13px;outline:none"/><button type="submit" style="background:#5e2a2a;color:#fff;border:1px solid #7a3333;border-radius:5px;padding:0 18px;font-family:inherit;cursor:pointer">进入</button></form><div id="exec-err" style="color:var(--red);font-size:12px;margin-top:8px;min-height:14px"></div></div></div>';
      $('#exec-auth').addEventListener('submit', function (e) { e.preventDefault(); var p = $('#exec-pass').value.trim(); api('/api/emp/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pass: p }) }).then(function (d) { if (d.ok) { EXEC = true; flag('exec_access'); renderExec(); } else $('#exec-err').textContent = '口令错误。'; }); });
      return;
    }
    api('/api/emp/execdata').then(function (d) {
      if (!d.ok) return;
      var x = d.data;
      var notes = x.notes.map(function (n) { return '<div class="lrow" style="line-height:1.8"><span class="lt">' + n.t + '</span><br/>' + esc(n.text) + '</div>'; }).join('');
      var samples = x.samples.map(function (s) { return '<tr class="' + (/你/.test(s.name) ? 'you' : '') + '"><td>' + s.id + '</td><td>' + esc(s.name) + '</td><td>' + s.days + '</td><td>' + esc(s.physical) + '</td><td>' + esc(s.data) + '</td><td style="color:#9aa1ab">' + esc(s.note) + '</td></tr>'; }).join('');
      $('#view-exec').innerHTML = '<div class="block"><div class="bhead"><span>· 江远的笔记</span><span class="r">私人 · 执行层</span></div><div class="panel">' + notes + '</div></div>' +
        '<div class="block"><div class="bhead"><span>· 样本池</span><span class="r">完整记录</span></div><div class="panel"><table><thead><tr><th>工号</th><th>样本</th><th>采集天数</th><th>物理主体</th><th>数据</th><th>备注</th></tr></thead><tbody>' + samples + '</tbody></table></div><div class="note">' + esc(x.next) + '</div></div>' +
        '<div class="block" style="border-color:#5e2a2a"><div class="bhead"><span>· 你要怎么做？</span></div><div class="panel" style="padding:20px;text-align:center"><p style="color:#9aa1ab;font-size:13px;margin:0 0 16px">你已经看完了江远留下的全部记录。你可以去举报，也可以就这样离开。</p><div style="display:flex;gap:16px;justify-content:center"><a href="http://localhost:3753/?q=%E9%BB%98%E5%B7%9D%E7%94%9F%E7%89%A9%E7%A7%91%E6%8A%80" target="_blank" style="display:inline-block;padding:10px 24px;background:#b91c1c;color:#fff;border-radius:5px;text-decoration:none;font-size:13px">去政务平台举报</a><button id="give-up-btn" style="padding:10px 24px;background:#1f2937;color:#6b7280;border:1px solid #374151;border-radius:5px;cursor:pointer;font-size:13px;font-family:inherit">就此离开，不再追究</button></div><div id="give-up-err" style="color:#e5484d;font-size:12px;margin-top:10px;min-height:14px"></div></div></div>';
      document.getElementById('give-up-btn').addEventListener('click', function(){
        fetch('/api/end-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'give-up'})})
          .then(function(r){return r.json()}).then(function(d){
            if(d.ok){ document.body.classList.add('dk-glitch'); setTimeout(function(){location.href='http://localhost:3751/ending.html';},800); }
            else document.getElementById('give-up-err').textContent = '你还不能就此离开。你看到的还不够多。';
          });
      });
    });
  }

  function onClick(id) {
    if (id === 'MC-0000') { flag('mc0000'); return crashHR(); }
    var r = ROSTER.find(function (x) { return x.id === id; }); if (!r) return;
    showCard(r);
  }
  function showCard(r) {
    var old = document.getElementById('roster-card');
    if (old) old.remove();
    var card = document.createElement('div'); card.id = 'roster-card';
    card.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px 24px;z-index:100;min-width:260px;font-size:13px;line-height:2;color:var(--text);box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:ui-monospace,monospace';
    var rows = [['ID',r.id],['Name',r.name],['Dept',r.dept],['Since',r.since],['Status',r.status]];
    if (r.note) rows.push(['Note',r.note]);
    card.innerHTML = rows.map(function(x){ return '<div style="display:flex;gap:14px"><span style="color:#6b7888;min-width:50px">'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></div>'; }).join('');
    document.body.appendChild(card);
    setTimeout(function(){ if(card.parentNode)card.remove(); }, 3000);
    card.addEventListener('click',function(){ card.remove(); });
  }
  function crashHR() {
    document.body.classList.add('dk-glitch');
    try { var ctx = new (window.AudioContext||window.webkitAudioContext)(); var now=ctx.currentTime; var o=ctx.createOscillator(),g=ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(1200,now); o.frequency.exponentialRampToValueAtTime(30,now+0.4); g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.9,now+0.01); g.gain.exponentialRampToValueAtTime(0.0001,now+0.5); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.6); var o2=ctx.createOscillator(),g2=ctx.createGain(); o2.type='square'; o2.frequency.setValueAtTime(3000,now); g2.gain.setValueAtTime(0.0001,now); g2.gain.exponentialRampToValueAtTime(0.35,now+0.005); g2.gain.exponentialRampToValueAtTime(0.0001,now+0.15); o2.connect(g2).connect(ctx.destination); o2.start(now); o2.stop(now+0.18); } catch(e){}
    setTimeout(function(){ document.body.classList.add('dk-flash'); }, 80);
    setTimeout(function(){ location.replace('about:blank'); }, 100);
  }
})();
