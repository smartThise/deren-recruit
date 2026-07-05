'use strict';
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function toast(msg) { var t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function api(p, o) { return fetch(p, o).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function stars(n) { var f = Math.round(n), s = ''; for (var i = 0; i < 5; i++) s += i < f ? '★' : '☆'; return s; }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function dkFx(type, ms) { document.body.classList.add('dk-' + type); setTimeout(function () { document.body.classList.remove('dk-' + type); }, ms || 1200); }
  function flag(name) { fetch('/api/flag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flag: name }) }).catch(function () {}); }

  // ======== 红温跳脸特效模块 ========
  var glitch = (function(){
    var WORDS = ['看着', '别回头', '它在', '醒着', '050', '零', '供能', '对账', '完成', 'B4', '手环', '别摘', '睡了', '循环', '氧合', '阈值', '他还在', '别出声', '████', '它知道', '下一个', '是你'];
    function el(tag, cls, css) { var e=document.createElement(tag); if(cls)e.className=cls; if(css)Object.assign(e.style,css); return e; }
    function audioDrone(freq, dur, type) {
      try { var ctx=new(window.AudioContext||window.webkitAudioContext)(),now=ctx.currentTime; var o=ctx.createOscillator(),g=ctx.createGain(); o.type=type||'sawtooth'; o.frequency.setValueAtTime(freq,now); o.frequency.exponentialRampToValueAtTime(freq*.3,now+dur); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.18,now+.03); g.gain.exponentialRampToValueAtTime(.0001,now+dur); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+dur+.1); }catch(e){}
    }
    function audioSting() {
      try { var ctx=new(window.AudioContext||window.webkitAudioContext)(),now=ctx.currentTime;
        var o1=ctx.createOscillator(),g1=ctx.createGain(); o1.type='square'; o1.frequency.setValueAtTime(2800,now); g1.gain.setValueAtTime(.0001,now); g1.gain.exponentialRampToValueAtTime(.35,now+.005); g1.gain.exponentialRampToValueAtTime(.0001,now+.15); o1.connect(g1).connect(ctx.destination); o1.start(now); o1.stop(now+.18);
        var o2=ctx.createOscillator(),g2=ctx.createGain(); o2.type='sawtooth'; o2.frequency.setValueAtTime(110,now+.1); o2.frequency.exponentialRampToValueAtTime(30,now+.8); g2.gain.setValueAtTime(.0001,now+.1); g2.gain.exponentialRampToValueAtTime(.5,now+.12); g2.gain.exponentialRampToValueAtTime(.0001,now+.9); o2.connect(g2).connect(ctx.destination); o2.start(now+.1); o2.stop(now+1);
      }catch(e){}
    }
    return {
      /* 红闪 */
      flash: function(){ var d=el('div','red-flash-overlay'); document.body.appendChild(d); audioDrone(160,.7,'square'); setTimeout(function(){d.remove();},800); },
      /* 全屏跳脸大字 */
      face: function(text, small){
        var d=el('div','jumpscare-face'+(small?' small':'')); d.textContent=text||WORDS[Math.floor(Math.random()*WORDS.length)]; document.body.appendChild(d);
        audioSting();
        setTimeout(function(){d.remove();}, small?1400:2000);
      },
      /* 屏幕剧烈抖动+反色 */
      shake: function(ms){ document.body.classList.add('violent-shake','invert-pulse'); audioDrone(55,ms/1000||2); setTimeout(function(){document.body.classList.remove('violent-shake','invert-pulse');},ms||2000); },
      /* 文字腐败 */
      corrupt: function(ms){ document.body.classList.add('text-rot'); audioDrone(80,ms/1000||3,'triangle'); setTimeout(function(){document.body.classList.remove('text-rot');},ms||3000); },
      /* 扫描线 */
      scanlines: function(ms){ var d=el('div','scanline-overlay'); document.body.appendChild(d); setTimeout(function(){d.remove();},ms||4000); },
      /* 暗角呼吸 */
      vignette: function(ms){ var d=el('div','vignette-breathe'); document.body.appendChild(d); setTimeout(function(){d.remove();},ms||6000); },
      /* 眼符号 */
      eye: function(ms){ var d=el('div','eye-symbol'); document.body.appendChild(d); setTimeout(function(){d.remove();},ms||5000); },
      /* 跑马灯 */
      crawl: function(text, ms){ var d=el('div','crawl-bar'); d.textContent=text||WORDS[Math.floor(Math.random()*WORDS.length)]; document.body.appendChild(d); setTimeout(function(){d.remove();},ms||10000); },
      /* 组合：全面崩坏 */
      breakdown: function(){ glitch.flash(); setTimeout(function(){glitch.shake(3000);glitch.scanlines(3500);glitch.vignette(4000);},200); setTimeout(function(){glitch.face('看 着 我',false);},600); audioDrone(40,5); },
      /* 随机骚扰词 */
      whisper: function(){ glitch.crawl(WORDS[Math.floor(Math.random()*WORDS.length)]+'  '+WORDS[Math.floor(Math.random()*WORDS.length)]+'  '+WORDS[Math.floor(Math.random()*WORDS.length)], 8000); }
    };
  })();

  var NAME2SLUG = {
    '默川生物科技': 'mochuan-bio', '默川生物': 'mochuan-bio', '默川': 'mochuan-bio', 'mochuan-bio': 'mochuan-bio', 'mochuan': 'mochuan-bio',
    '渊庭生物科技': 'yuanting-bio', '渊庭生物': 'yuanting-bio', '渊庭': 'yuanting-bio', 'yuanting-bio': 'yuanting-bio'
  };

  function refreshUser() {
    api('/api/state').then(function (s) {
      var box = $('#nav-user'); if (!box) return;
      if (s && s.profile) {
        var unread = (s.messages || []).filter(function (m) { return m.unread; }).length;
        var msg = unread ? ' <span style="color:#e5484d" title="' + unread + ' 条未读">●</span>' : '';
        box.innerHTML = '<span style="color:#374151;font-size:13.5px;margin-right:10px">👤 ' + esc(s.profile.name) + msg + '</span><a class="btn btn-ghost btn-sm" href="/center.html">求职者中心</a>';
      } else {
        box.innerHTML = '<button class="btn btn-line btn-sm" id="go-login">登录 / 注册</button>';
        var b = $('#go-login'); if (b) b.addEventListener('click', function () { $('#login-mask').classList.add('show'); });
      }
    });
  }
  var goLogin = $('#go-login'); if (goLogin) goLogin.addEventListener('click', function () { $('#login-mask').classList.add('show'); });
  var mask = $('#login-mask');
  if (mask) mask.addEventListener('click', function (e) { if (e.target === mask) mask.classList.remove('show'); });
  var loginBtn = $('#login-submit');
  if (loginBtn) loginBtn.addEventListener('click', function () {
    var phone = $('#login-phone').value.trim(), name = $('#login-name').value.trim();
    if (!/^\d{6,}$/.test(phone)) { toast('请输入有效手机号'); return; }
    api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone, name: name }) })
      .then(function (d) { if (d.ok) { mask.classList.remove('show'); toast('登录成功'); refreshUser(); } else toast('登录失败'); });
  });
  refreshUser();

  // aura：不可逆锁定（不归路后任意页刷新都被抓回协议）+ 结局后世界污染
  function injectNoise() {
    if (document.getElementById('aura-noise')) return;
    var d = document.createElement('div'); d.id = 'aura-noise';
    d.style.cssText = 'position:fixed;inset:0;z-index:9996;pointer-events:none;font-size:13px;color:#7a0c0c;opacity:.62;line-height:1.2;overflow:hidden;word-break:break-all;mix-blend-mode:screen;padding:4px;animation:aushake .08s infinite';
    document.body.appendChild(d);
    var C = '▓▒░█▄▀■□◆◇▲▼★☆⊕⊗÷×§¶†‡•○●◐◑⌖⌬⏃⏆⎔⣿⣷⣶⣴⣤卍卐㌀㌍㌔㌫䜩䥤䭔䲝アァカサタナハマヤラワガザダバパイィキシチニヒミリギジヂビピウゥクスツヌフムルグズヅブプΠΣΦΨΩαβγδεζηθικλμνξπρστυφχψωжзклмнпрстфхцч';
    function fill() { var s = '', n = Math.floor(window.innerWidth * window.innerHeight / 70); for (var i = 0; i < n; i++) s += C[Math.floor(Math.random() * C.length)]; d.textContent = s; }
    fill(); setInterval(fill, 140);
  }
  fetch('/api/aura').then(function (a) {
    if (!a) return;
    if (a.locked && !/\/agreement/.test(location.pathname) && !/\/ending/.test(location.pathname)) { location.href = '/agreement.html'; return; }
    if (a.endingType === 'bad' && !/\/ending/.test(location.pathname)) { document.documentElement.classList.add('aura-bad'); setTimeout(injectNoise, 60); }
    if (a.endingType === 'good' && !/\/ending/.test(location.pathname)) document.documentElement.classList.add('aura-good');
  });

  // 隐藏页面事件链
  fetch('/api/state').then(function(st){
    if(!st||!st.progress)return;
    var clues=st.progress.clues||[];
    // genesis 已读但 terminal 未读 → 首次回首页时信号干扰泄露 terminal 链接
    if(clues.indexOf('genesis_read')>=0 && clues.indexOf('terminal_read')<0 && !sessionStorage.getItem('sig_leak_shown')){
      sessionStorage.setItem('sig_leak_shown','1');
      setTimeout(function(){
        glitch.flash();
        setTimeout(function(){
          var s=document.createElement('div');
          s.style.cssText='position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);z-index:10001;pointer-events:none;font-family:monospace;font-size:15px;color:#1a5a1a;background:rgba(0,0,0,.95);padding:16px 24px;border:1px solid #1a6a1a;border-radius:4px;text-shadow:0 0 10px #1a6a1a;opacity:0;transition:opacity .2s;text-align:center;line-height:1.8';
          s.innerHTML='SIGNAL_LEAK :: B4-NODE-7<br>████ <span style=\"color:#4a8a4a\">/hidden/terminal</span> ████<br><span style=\"font-size:11px;color:#3a6a3a\">终末站在等你</span>';
          document.body.appendChild(s);
          setTimeout(function(){s.style.opacity='1';},200);
          setTimeout(function(){s.style.opacity='0';setTimeout(function(){s.remove();},500);},4000);
        },400);
      },2000+Math.random()*3000);
    }
    // terminal 已读 → 意识碎片（随机短暂跳脸）
    if(clues.indexOf('terminal_read')>=0 && Math.random()<.2 && !/\/ending/.test(location.pathname)){
      setTimeout(function(){
        glitch.face('我 看 见 你 了',true);
      },5000+Math.random()*15000);
    }
  });

  // 结局自然触发：达成时不再显示"查看结局"链接，而是自动转场崩坏 → 跳结局页（每个会话一次）
  fetch('/api/state').then(function (st) {
    if (st && st.ending && !sessionStorage.getItem('drEndingShown')) {
      sessionStorage.setItem('drEndingShown', '1');
      var delay = st.ending.id === 'consumed' ? 2600 : 7000;
      setTimeout(function () {
        document.body.classList.add('dk-glitch');
        setTimeout(function () { location.href = '/ending.html'; }, 1500);
      }, delay);
    }
  });

  // nav 搜索框可点
  var navSearch = $('#nav-search-trigger') || $('.nav-search');
  if (navSearch) { navSearch.style.cursor = 'pointer'; navSearch.addEventListener('click', function () { location.href = '/search.html'; }); }

  var searchForm = $('#search-form');
  if (searchForm) searchForm.addEventListener('submit', function (e) { e.preventDefault(); location.href = '/search.html?q=' + encodeURIComponent($('#search-input').value.trim()); });

  var page = document.body.dataset.page;

  // 首页
  if (page === 'home') {
    api('/api/announce').then(function (d) { if (!d.ok) return; $('#announce-list').innerHTML = d.items.slice(0, 5).map(function (a) { return '<a class="list-item" href="/announce.html?id=' + a.id + '">' + (a.pinned ? '<span class="pin">置顶</span>' : '') + '<span class="title">' + esc(a.title) + '</span><span class="date">' + a.date + '</span></a>'; }).join(''); });
    api('/api/companies?page=1').then(function (d) {
      if (!d.ok) return;
      var ersten = '<a class="co-card" href="/company.html?slug=deren" style="border-color:#1466d6"><div class="top"><div class="co-logo" style="background:#1466d6;color:#fff">得</div><div><h3>得人招聘<span class="badge-best" style="background:#e6f0ff;color:#1466d6">我们在招人</span></h3><div class="meta">互联网 · 200-500人 · 沄洲</div></div></div><div class="desc">平台的运营与技术维护团队，负责后台系统、企业审核与日常技术支持。</div><div class="jobs">在招 1 个岗位 · 运维实习生</div></a>';
      $('#home-companies').innerHTML = ersten + d.items.slice(0, 5).map(function (c) {
        return '<a class="co-card" href="/company.html?slug=' + c.slug + '"><div class="top"><div class="co-logo">' + esc(c.name.slice(0, 1)) + '</div><div><h3>' + esc(c.name) + '</h3><div class="meta">' + esc(c.industry) + ' · ' + esc(c.size) + ' · ' + esc(c.city) + '</div></div></div><div class="desc">' + esc(c.intro) + '</div><div class="jobs">在招 ' + c.jobCount + ' 个岗位 · ' + c.rate + ' 评分</div></a>';
      }).join('');
    });
  }

  // 搜索
  if (page === 'search') {
    var q = param('q') || '';
    if ($('#search-input')) $('#search-input').value = q;
    api('/api/search?q=' + encodeURIComponent(q)).then(function (d) {
      $('.result-bar').innerHTML = '搜索 "<b>' + esc(q || '全部') + '</b>"，共 <b>' + d.total + '</b> 个相关岗位';
      $('.result-list').innerHTML = d.items.map(function (j) {
        return '<a class="result-item" href="/job.html?id=' + j.id + '"><div class="co-logo" style="width:36px;height:36px;font-size:14px">' + esc(j.companyName.slice(0, 1)) + '</div><div style="flex:1"><div style="font-weight:600;font-size:14.5px">' + esc(j.title) + '</div><div class="j-meta">' + esc(j.companyName) + ' · ' + esc(j.city || '') + ' · ' + esc(j.exp) + ' · ' + esc(j.edu) + '</div><div class="j-tags">' + (j.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div><div class="salary">' + esc(j.salary) + '</div></a>';
      }).join('') || '<div style="padding:30px;text-align:center;color:#9aa1ab">没有相关岗位</div>';
    });
  }

  // 公司列表（分页 + 筛选）
  if (page === 'companies') {
    var INDUSTRY = ['互联网', '生命科学', '医疗器械', '文化传媒', '物流供应链', '新能源', '智能制造', '金融科技', '新消费', '生命科学 / 健康数据'];
    var CITIES = ['沄洲', '朔安', '澜沧', '临川', '岭南', '蜀安', '淮州', '吴州', '楚州', '雍安'];
    var selI = $('#f-industry'), selC = $('#f-city');
    selI.innerHTML = '<option value="">全部行业</option>' + INDUSTRY.map(function (i) { return '<option>' + i + '</option>'; }).join('');
    selC.innerHTML = '<option value="">全部城市</option>' + CITIES.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    var st = { q: param('q') || '', industry: param('industry') || '', city: param('city') || '' };
    if (st.q) $('#f-q').value = st.q; if (st.industry) selI.value = st.industry; if (st.city) selC.value = st.city;
    function load(p) {
      var url = '/api/companies?page=' + p;
      if (st.q) url += '&q=' + encodeURIComponent(st.q);
      if (st.industry) url += '&industry=' + encodeURIComponent(st.industry);
      if (st.city) url += '&city=' + encodeURIComponent(st.city);
      api(url).then(function (d) {
        $('#co-total').textContent = '共 ' + d.total + ' 家 · 第 ' + d.page + '/' + d.pages + ' 页';
        $('#co-list').innerHTML = d.items.map(function (c) {
          return '<a class="co-card" href="/company.html?slug=' + c.slug + '"><div class="top"><div class="co-logo">' + esc(c.name.slice(0, 1)) + '</div><div><h3>' + esc(c.name) + '</h3><div class="meta">' + esc(c.industry) + ' · ' + esc(c.size) + ' · ' + esc(c.city) + '</div></div></div><div class="desc">' + esc(c.intro) + '</div><div class="jobs">在招 ' + c.jobCount + ' 个岗位 · ' + c.rate + ' 评分 · ' + c.reviewCount + ' 条评价</div></a>';
        }).join('') || '<div style="padding:30px;text-align:center;color:#9aa1ab;grid-column:1/-1">没有符合条件的公司</div>';
        var hp = '<button ' + (d.page <= 1 ? 'disabled' : '') + ' data-p="' + (d.page - 1) + '">上一页</button>';
        for (var i = 1; i <= d.pages; i++) hp += '<button class="' + (i === d.page ? 'active' : '') + '" data-p="' + i + '">' + i + '</button>';
        hp += '<button ' + (d.page >= d.pages ? 'disabled' : '') + ' data-p="' + (d.page + 1) + '">下一页</button>';
        $('#co-pager').innerHTML = hp;
        $$('#co-pager button').forEach(function (b) { if (!b.disabled) b.addEventListener('click', function () { load(parseInt(b.dataset.p, 10)); window.scrollTo(0, 0); }); });
      });
    }
    $('#f-go').addEventListener('click', function () { st.q = $('#f-q').value.trim(); st.industry = selI.value; st.city = selC.value; load(1); });
    load(1);
  }

  // JD 详情
  if (page === 'job') {
    var jid = param('id');
    api('/api/jobs/' + jid).then(function (d) {
      if (!d.ok) { $('#job-head').innerHTML = '<div style="padding:40px;text-align:center;color:#9aa1ab">岗位不存在或已下线。</div>'; return; }
      var j = d.job, co = d.company, jd = d.jd, hr = d.hr;
      document.title = j.title + ' · ' + co.name + ' · 得人招聘';
      $('#job-head').innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div><div style="font-size:22px;font-weight:700">' + esc(j.title) + '</div><div class="j-meta" style="margin-top:6px;font-size:13.5px;color:#6b7280">' + esc(co.city || '') + ' · ' + esc(j.exp) + ' · ' + esc(j.edu) + ' · ' + esc(j.dept) + '</div><div class="j-tags" style="margin-top:8px">' + (j.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div><div style="text-align:right"><div style="color:#e5484d;font-weight:700;font-size:18px">' + esc(j.salary) + '</div><button class="btn btn-primary js-apply" data-job="' + j.id + '" data-title="' + esc(j.title) + '" style="margin-top:10px">立即投递</button></div></div>';
      $('#job-co').innerHTML = '<a href="/company.html?slug=' + co.slug + '" style="display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none"><div class="co-logo">' + esc(co.name.slice(0, 1)) + '</div><div><div style="font-weight:600;font-size:15px">' + esc(co.name) + '</div><div class="meta" style="color:#6b7280">' + esc(co.industry) + ' · ' + esc(co.stage) + ' · ' + esc(co.size) + ' · ' + esc(co.city) + '</div></div><span class="stars" style="margin-left:auto;color:#f59e0b">' + stars(co.rate) + '</span></a>';
      $('#job-jd').innerHTML = '<h3 style="margin-top:0">岗位职责</h3><ul style="color:#374151;padding-left:20px;line-height:1.9">' + jd.desc.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul><h3>任职要求</h3><ul style="color:#374151;padding-left:20px;line-height:1.9">' + jd.req.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
      $('#job-extra').innerHTML = '<h3 style="margin-top:0">企业福利</h3><div class="welfare">' + (co.welfare || []).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' + (hr ? '<div style="margin-top:14px;color:#6b7280;font-size:13px">招聘联系人：' + esc(hr.name) + '（' + esc(hr.title) + '）</div>' : '');
      $$('.js-apply').forEach(function (b) { b.addEventListener('click', function () { doApply(b.dataset.job, b.dataset.title, b); }); });
    });
  }

  // 工商查询
  if (page === 'business') {
    $('#biz-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = $('#biz-input').value.trim(); if (!raw) return;
      var slug = NAME2SLUG[raw] || NAME2SLUG[raw.toLowerCase()];
      var out = $('#biz-out');
      if (!slug) { out.innerHTML = '<div class="panel-sec" style="color:#6b7280">未查到该企业的工商档案。请使用完整企业名称。</div>'; return; }
      out.innerHTML = '<div class="panel-sec" style="color:#9aa1ab">查询中…</div>';
      api('/api/business/' + slug).then(function (d) { if (!d.ok) { out.innerHTML = '<div class="panel-sec" style="color:#e5484d">查无此主体。</div>'; return; } out.innerHTML = bizCardHtml(d.biz); if (d.biz.slug === 'yuanting-bio' || d.biz.status.indexOf('注销') >= 0) { flag('yuanting'); glitch.flash(); setTimeout(function(){glitch.crawl('注销 注销 换壳 它还在 它还在 它还在',8000);},500); } else if (d.biz.slug === 'mochuan-bio') flag('mochuan_biz'); });
    });
  }
  function bizCardHtml(b) {
    var danger = b.status.indexOf('注销') >= 0;
    return '<div><h3 style="margin-bottom:4px">' + esc(b.name) + ' <span class="r-tag" style="background:' + (danger ? '#fdecec' : 'var(--bg)') + ';color:' + (danger ? '#e5484d' : 'var(--muted)') + '">' + esc(b.status) + '</span></h3>' +
      '<div class="peer-grid" style="font-size:13px;color:#6b7280">' + kv('统一社会信用代码', b.code) + kv('法定代表人', b.legal) + kv('成立日期', b.found) + kv('注册资本', b.capital) + kv('注册地址', b.address) + kv('经营范围', b.scope) + '</div>' +
      '<h3 style="margin:18px 0 6px">股东信息</h3><div class="list-card">' + b.shareholders.map(function (s) { return '<div class="list-item"><span class="title">' + esc(s.name) + '</span><span class="date">' + esc(s.pct) + '</span></div>'; }).join('') + '</div>' +
      '<h3 style="margin:18px 0 6px">历史变更</h3><div class="list-card">' + b.history.map(function (h) { return '<div class="list-item"><span class="title">' + esc(h.event) + '</span><span class="date">' + esc(h.date) + '</span></div>'; }).join('') + '</div>' +
      '<h3 style="margin:18px 0 6px">关联企业</h3><div class="list-card">' + b.related.map(function (r) {
        var rl = r.relation.indexOf('同地址') >= 0 || r.relation.indexOf('全资') >= 0;
        return '<div class="list-item" style="align-items:flex-start;flex-direction:column;gap:2px"><span class="title">' + esc(r.name) + ' <span style="color:' + (r.status === '注销' ? '#e5484d' : '#16a34a') + ';font-size:12px">[' + esc(r.status) + ']</span></span><span style="font-size:12.5px;color:' + (rl ? '#b26a00' : '#9aa1ab') + '">' + esc(r.relation) + (r.note ? ' · ' + esc(r.note) : '') + '</span></div>';
      }).join('') + '</div><div style="margin-top:12px;display:flex;gap:14px;flex-wrap:wrap">' + (b.officialSite ? '<a href="' + b.officialSite + '" target="_blank" style="font-size:12.5px">企业官网 ↗</a>' : '') + '<a href="' + b.supervision + '" target="_blank" style="font-size:12.5px">监管信息（政务网） ↗</a></div><div style="margin-top:12px;color:#9aa1ab;font-size:12px">本数据由第三方工商数据服务提供，仅供参考。</div></div>';
  }
  function kv(k, v) { return '<div class="k" style="color:#9aa1ab;padding:5px 0;border-bottom:1px solid var(--border)">' + esc(k) + '</div><div class="v" style="padding:5px 0;border-bottom:1px solid var(--border)">' + esc(v) + '</div>'; }

  // 公司主页
  if (page === 'company') {
    var slug = param('slug') || 'mochuan-bio', jobFocus = param('job');
    api('/api/company/' + slug).then(function (d) {
      if (!d.ok) { document.body.innerHTML = '<div class="wrap" style="padding:60px">公司不存在。</div>'; return; }
      var c = d.company;
      document.title = c.name + ' · 得人招聘';
      $('#co-logo-lg').textContent = c.name.slice(0, 1);
      $('#co-name').innerHTML = esc(c.name) + (c.partner ? '<span class="badge-best">年度最佳雇主</span>' : '');
      $('#co-meta').textContent = [c.industry, c.stage, c.size, c.city].join(' · ');
      $('#co-rate').innerHTML = '<span class="stars">' + stars(c.rate) + '</span> <b>' + c.rate + '</b> · ' + c.reviewCount + ' 条评价';
      if (c.partner) { $('#co-banner').style.display = 'flex'; $('#partner-row').innerHTML = pt(c.partner.years, '合作年数') + pt(c.partner.placed, '累计入职') + pt(c.partner.satisfaction, '好评率') + pt(c.partner.retention, '留存'); $('#honors').innerHTML = (c.honors || []).map(function (h) { return '<li>' + esc(h) + '</li>'; }).join(''); }
      else { $('#co-banner').style.display = 'none'; $('#honors-box').style.display = 'none'; }
      function pt(n, l) { return '<div class="p"><div class="n">' + esc(n) + '</div><div class="l">' + esc(l) + '</div></div>'; }

      $('#tab-intro').innerHTML = '<p>' + esc(c.intro).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p><h3 style="margin-top:18px">企业福利</h3><div class="welfare">' + c.welfare.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div><h3 style="margin-top:18px">公司动态</h3><div class="list-card">' + c.news.map(function (n) { return '<div class="list-item"><span class="title">' + esc(n.title) + '</span><span class="date">' + esc(n.date) + '</span></div>'; }).join('') + '</div><h3 style="margin-top:18px">面试题（来自面经）</h3><ul style="color:#374151;padding-left:20px">' + c.interviews.map(function (t) { return '<li style="margin-bottom:4px">' + esc(t) + '</li>'; }).join('') + '</ul>';

      $('#tab-jobs').innerHTML = '<h3>在招岗位（' + c.jobs.length + '）</h3>' + c.jobs.map(function (j) {
        return '<a class="job-row" href="/job.html?id=' + j.id + '" style="text-decoration:none;color:inherit"><div class="j-main"><div class="j-title">' + esc(j.title) + '</div><div class="j-meta">' + esc(j.dept) + ' · ' + esc(j.city || '') + ' · ' + esc(j.exp) + ' · ' + esc(j.edu) + '</div><div class="j-tags">' + (j.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div><div class="salary">' + esc(j.salary) + '</div><button class="btn btn-primary btn-sm js-apply" data-job="' + j.id + '" data-title="' + esc(j.title) + '">立即投递</button></a>';
      }).join('');
      $$('.js-apply').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); doApply(b.dataset.job, b.dataset.title, b); }); });

      api('/api/reviews/' + slug + '?page=1').then(function (rv) {
        $('#tab-reviews').innerHTML = '<div class="rate-summary"><div><span style="font-size:36px;font-weight:800;color:#f59e0b">' + c.rate + '</span><div class="label">综合评分</div></div><div><div class="stars" style="font-size:18px">' + stars(c.rate) + '</div><div class="label" style="margin-top:4px">基于 ' + c.reviewCount + ' 条匿名评价</div></div></div><div style="margin-top:14px">' + rv.items.slice(0, 2).map(reviewHtml).join('') + '</div><div style="margin-top:14px;text-align:center"><a class="btn btn-line" href="/reviews.html?slug=' + slug + '">查看全部 ' + c.reviewCount + ' 条评价 →</a></div>';
      });
      $('#tab-address').innerHTML = '<h3>公司地址</h3><p style="color:#374151">' + esc(c.address) + '</p><button class="btn btn-line btn-sm" id="map-check">核验地址（卫星/街景）</button><div id="map-out" style="margin-top:12px;font-size:13px;color:#6b7280"></div>';
      $('#map-check').addEventListener('click', function () { $('#map-out').textContent = '正在调取地图与街景…'; api('/api/map?slug=' + slug).then(function (m) { $('#map-out').innerHTML = m.street.status === 'ok' ? '<span style="color:#16a34a">✓ 地址有效</span> · 已通过工商登记地址核验 · 街景影像正常覆盖。' : '<span style="color:#e5484d">⚠ ' + esc(m.street.note) + '</span>'; }); });
      $('#tab-biz').innerHTML = '<div style="color:#9aa1ab;padding:10px 0">加载工商档案…</div>';
      api('/api/business/' + slug).then(function (bd) { if (bd.ok) $('#tab-biz').innerHTML = bizCardHtml(bd.biz); else $('#tab-biz').innerHTML = '<div style="color:#e5484d">工商档案暂不可查。</div>'; });

      $$('.tab').forEach(function (t) { t.addEventListener('click', function () { $$('.tab').forEach(function (x) { x.classList.remove('active'); }); t.classList.add('active'); $$('.tab-panel').forEach(function (p) { p.style.display = 'none'; }); $('#' + t.dataset.tab).style.display = ''; }); });
      if (jobFocus) { $$('.tab').forEach(function (x) { x.classList.toggle('active', x.dataset.tab === 'jobs'); }); $$('.tab-panel').forEach(function (p) { p.style.display = 'none'; }); $('#tab-jobs').style.display = ''; }
      $('#co-fav').addEventListener('click', function () {
        api('/api/state').then(function (s) { if (!s.profile) { $('#login-mask').classList.add('show'); toast('请先登录'); return; } api('/api/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: c.slug, name: c.name }) }).then(function () { toast('已收藏/取消'); }); });
      });
      // 默川页面：渐进的压迫感
      if (c.slug === 'mochuan-bio') {
        setTimeout(function(){ glitch.vignette(15000); }, 8000);
        setTimeout(function(){ glitch.scanlines(10000); glitch.crawl('年度最佳雇主 4.8 分 投递 1240 入职 405 留存 99.1%',15000); }, 15000);
        setTimeout(function(){ glitch.eye(6000); }, 30000);
      }
    });
  }

  function doApply(jobId, title, btn) {
    api('/api/state').then(function (s) {
      if (!s.profile) { $('#login-mask').classList.add('show'); toast('请先登录'); return; }
      api('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: jobId }) }).then(function (d) {
        if (d.ok) { toast('已投递：' + title); if (btn) { btn.textContent = '已投递'; btn.disabled = true; } }
        else toast(d.error || '投递失败');
      });
    });
  }

  if (page === 'reviews') {
    var rslug = param('slug') || 'mochuan-bio';
    function load(p) {
      api('/api/reviews/' + rslug + '?page=' + p).then(function (d) {
        if (!d.ok) return;
        $('#rv-summary').innerHTML = '<span style="font-size:36px;font-weight:800;color:#f59e0b">' + d.rate + '</span> <span class="label" style="margin-left:10px">' + d.name + ' · ' + d.total + ' 条匿名评价</span>';
        $('#rv-list').innerHTML = d.items.map(reviewHtml).join('');
        var isMochuan = rslug === 'mochuan-bio';
        var showPages = isMochuan ? Math.min(d.pages, 4) : d.pages;
        var hasHiddenNext = isMochuan && p >= 4 && d.pages > 4;
        var hp = '<button ' + (p <= 1 ? 'disabled' : '') + ' data-p="' + (p - 1) + '">上一页</button>';
        for (var i = 1; i <= showPages; i++) hp += '<button class="' + (i === p ? 'active' : '') + '" data-p="' + i + '">' + i + '</button>';
        hp += '<button ' + ((p >= d.pages && !hasHiddenNext) ? 'disabled' : '') + ' data-p="' + (p + 1) + '">下一页</button>';
        $('#rv-pager').innerHTML = hp;
        if (isMochuan && p >= 4) { glitch.flash(); setTimeout(function(){glitch.crawl('别投 我会回来的 下一个 别投 别投 别投',6000);},300); setTimeout(function(){glitch.scanlines(4000);},800); flag('reviews_deep'); }
        if (isMochuan && p >= 5) { flag('reviews_deep'); }
        $$('#rv-pager button').forEach(function (b) { if (!b.disabled) b.addEventListener('click', function () { load(parseInt(b.dataset.p, 10)); window.scrollTo(0, 0); }); });
      });
    }
    load(parseInt(param('page') || '1', 10));
  }
  function reviewHtml(r) {
    var t = r.text || ''; var unsettled = /别投|我会|下一个|睡着|回来填|不太对|别去|不知道他们|内网通讯录|工牌|日光灯/.test(t);
    return '<div class="review ' + (unsettled ? 'unsettled' : '') + '"><div class="review-head"><span class="u">' + esc(r.user) + '</span><span class="stars">' + stars(r.rate) + '</span><span class="r-tag">' + esc(r.tag || '') + '</span><span class="date">' + esc(r.date) + '</span></div><div class="text">' + esc(r.text) + '</div></div>';
  }

  if (page === 'announce') {
    var aid = param('id'), lw = $('#an-list-wrap'), ad = $('#an-detail');
    if (aid) { if (lw) lw.style.display = 'none'; if (ad) ad.style.display = ''; api('/api/announce/' + aid).then(function (d) { if (!d.ok) return; var a = d.item; $('#an-title').textContent = a.title; $('#an-meta').textContent = a.date + ' · 得人招聘'; $('#an-body').innerHTML = '<p>' + esc(a.body).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'; }); }
    else { if (ad) ad.style.display = 'none'; api('/api/announce').then(function (d) { $('#an-list').innerHTML = d.items.map(function (a) { return '<a class="list-item" href="/announce.html?id=' + a.id + '">' + (a.pinned ? '<span class="pin">置顶</span>' : '') + '<span class="title">' + esc(a.title) + '</span><span class="date">' + a.date + '</span></a>'; }).join(''); }); }
  }
  if (page === 'community') {
    var tid = param('id'), cw = $('#cm-list-wrap'), cd = $('#cm-detail');
    if (tid) { if (cw) cw.style.display = 'none'; if (cd) cd.style.display = ''; api('/api/community/' + tid).then(function (d) { if (!d.ok) return; var t = d.item; $('#cm-title').textContent = t.title; $('#cm-meta').textContent = t.user + ' · ' + t.time + ' · ' + t.views + ' 浏览'; $('#cm-posts').innerHTML = t.posts.map(function (p) { return '<div class="review"><div class="review-head"><span class="u">' + esc(p.user) + '</span><span class="date">' + esc(p.time) + '</span></div><div class="text">' + esc(p.text) + '</div></div>'; }).join(''); }); }
    else { if (cd) cd.style.display = 'none'; api('/api/community').then(function (d) { $('#cm-list').innerHTML = d.items.map(function (t) { return '<a class="list-item" href="/community.html?id=' + t.id + '"><span class="title">' + esc(t.title) + '</span><span class="date">' + t.replies + ' 回复 · ' + t.views + ' 浏览</span></a>'; }).join(''); }); }
  }

  if (page === 'center') {
    var ctab = 'c-applied';
    function renderCenter() {
      api('/api/state').then(function (s) {
        if (!s.profile) { $('#center-box').innerHTML = '<div style="padding:40px;text-align:center;color:#6b7280">请先<a href="/">登录</a>。</div>'; return; }
        $('#center-user').textContent = s.profile.name;
        var head = $('.section-head .more');
        if (head) head.innerHTML = '👤 ' + esc(s.profile.name) + ' <a href="#" id="delete-account" style="color:#e5484d;font-size:12px;margin-left:14px;font-weight:400">注销账户</a>';
        $('#c-applied').innerHTML = (s.applied && s.applied.length) ? s.applied.map(function (a) {
          var stages = a.stages || [];
          var mochuan = a.companySlug === 'mochuan-bio';
          var danger = mochuan;
          var h = '<div class="job-row" style="flex-direction:column;align-items:flex-start;gap:6px"><div style="display:flex;align-items:center;gap:12px;width:100%"><div class="j-main"><div class="j-title">' + esc(a.title) + '</div><div class="j-meta">' + esc(a.companyName) + '</div></div><span class="r-tag" style="background:' + (danger ? '#fdecec' : '#e8f6ee') + ';color:' + (danger ? '#e5484d' : '#16a34a') + ';padding:3px 10px;border-radius:4px;font-size:12px;flex-shrink:0">' + esc(a.status) + '</span></div>';
          if (stages.length) { h += '<div class="tl">'; stages.forEach(function (st) { h += '<div class="tl-row"><div class="tl-dot"></div><div class="tl-body"><div class="tl-title">' + esc(st.title) + '</div>' + (st.desc ? '<div class="tl-desc">' + esc(st.desc) + '</div>' : '') + '<div class="tl-time">' + new Date(st.t).toLocaleString('zh-CN') + '</div></div></div>'; }); h += '</div>'; }
          h += '</div>';
          return h;
        }).join('') : '<div style="padding:30px;text-align:center;color:#9aa1ab">还没有投递记录。</div>';
        var msgs = s.messages || []; var unread = msgs.filter(function (m) { return m.unread; }).length;
        $('#msg-dot').style.display = unread ? '' : 'none';
        var agBanner = (s.appliedMochuan && !s.healthAgreed) ? '<div style="background:#fff8ec;border:1px solid #fbe2b8;color:#7a5200;padding:10px 14px;border-radius:6px;margin-bottom:12px">⚠ 你投递的默川生物要求签署《员工健康数据计划》协议，流程才会继续。<a href="/agreement.html" style="color:#1466d6;font-weight:600">前往签署 →</a></div>' : '';
        $('#c-msgs').innerHTML = agBanner + (msgs.length ? msgs.map(function (m) { return '<div class="review" style="' + (m.unread ? 'border-left:3px solid #e5484d;padding-left:12px' : '') + '"><div class="review-head"><span class="u">' + esc(m.from) + (m.unread ? ' <span style="color:#e5484d;font-size:11px">未读</span>' : '') + '</span><span class="date">' + new Date(m.t).toLocaleString('zh-CN') + '</span></div><div style="font-weight:600;margin-bottom:4px">' + esc(m.subject) + '</div><div class="text">' + esc(m.body) + '</div></div>'; }).join('') : '<div style="padding:30px;text-align:center;color:#9aa1ab">暂无站内信。</div>');
        $('#c-resume').innerHTML = s.resume ? '<div style="padding:8px 0"><div style="color:#6b7280;margin-bottom:10px">简历完整度：' + resumeScore(s.resume) + '%</div>' + resumeRows(s.resume) + '</div><div style="margin-top:14px"><a class="btn btn-line btn-sm" href="/resume.html">编辑简历</a></div>' : '<div style="padding:24px;text-align:center"><div style="color:#6b7280;margin-bottom:14px">还没有填写简历</div><a class="btn btn-primary" href="/resume.html">去填写</a></div>';
        $('#c-fav').innerHTML = (s.favorites && s.favorites.length) ? s.favorites.map(function (f) { return '<a class="list-item" href="/company.html?slug=' + f.slug + '"><span class="title">' + esc(f.name) + '</span><span class="date">已收藏</span></a>'; }).join('') : '<div style="padding:30px;text-align:center;color:#9aa1ab">还没有收藏。</div>';
      });
    }
    function resumeScore(r) { var n = 0; ['name', 'birth', 'school', 'major', 'salary', 'city', 'summary'].forEach(function (k) { if (r && r[k]) n++; }); return Math.round(n / 7 * 100); }
    function resumeRows(r) { var rows = [['姓名', 'name'], ['性别', 'gender'], ['出生年月', 'birth'], ['学历', 'edu'], ['院校', 'school'], ['专业', 'major'], ['工作年限', 'years'], ['期望薪资', 'salary'], ['期望城市', 'city'], ['手机', 'phone']]; return '<div class="list-card">' + rows.map(function (x) { return '<div class="list-item"><span class="title">' + x[0] + '</span><span class="date">' + esc(r[x[1]] || '—') + '</span></div>'; }).join('') + '<div class="list-item" style="flex-direction:column;align-items:flex-start;gap:4px"><span class="title">个人优势</span><span style="color:#374151;font-size:13px">' + esc(r.summary || '—') + '</span></div></div>'; }
    $$('.tab').forEach(function (t) { if (t.dataset.ctab) t.addEventListener('click', function () { $$('.tab').forEach(function (x) { x.classList.remove('active'); }); t.classList.add('active'); ['c-applied', 'c-msgs', 'c-resume', 'c-fav'].forEach(function (id) { $('#' + id).style.display = 'none'; }); $('#' + t.dataset.ctab).style.display = ''; if (t.dataset.ctab === 'c-msgs') api('/api/messages/read', { method: 'POST' }); }); });
    renderCenter(); setInterval(renderCenter, 6000);
    // 注销账户（事件委托，renderCenter 每 6s 重建 DOM）
    document.addEventListener('click', function(e){
      if(e.target && e.target.id === 'delete-account'){
        e.preventDefault();
        if(!window.confirm('确认注销账户？所有投递记录、简历和站内信将被清除，且无法恢复。')) return;
        fetch('/api/delete-account',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
          if(d.ok && d.ending){
            document.body.classList.add('dk-glitch');
            setTimeout(function(){location.href='/ending.html';},800);
          } else toast('无法注销账户');
        });
      }
    });
  }

  if (page === 'resume') {
    api('/api/state').then(function (s) {
      if (!s.profile) { document.body.innerHTML = '<div class="wrap" style="padding:60px">请先<a href="/">登录</a>。</div>'; return; }
      if (s.resume) { Object.keys(s.resume).forEach(function (k) { var el = document.querySelector('[name="' + k + '"]'); if (el) el.value = s.resume[k]; }); }
    });
    $('#resume-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {}; $$('#resume-form [name]').forEach(function (el) { data[el.name] = el.value; });
      api('/api/resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(function (d) { if (d.ok) { $('#resume-saved').style.display = ''; toast('已保存'); } else toast('保存失败'); });
    });
  }

  // 健康数据协议（多步诱导 + 不归路 + 强签崩坏 → consumed）
  if (page === 'agreement') {
    function showAStep(n) { $$('.step').forEach(function (s) { s.classList.remove('on'); }); var el = $('#step-' + n); if (el) el.classList.add('on'); }
    api('/api/aura').then(function (au) { if (au && au.locked) enterNoReturn(); });
    api('/api/agreement').then(function (d) {
      if (d.ok && d.agreed) {
        $('#steps').innerHTML = '<div class="step on"><h3>协议已签署</h3><div class="hint">自 ' + new Date(d.t).toLocaleString('zh-CN') + ' 起生效。本协议不可撤销。</div><a class="btn btn-line" href="/center.html">返回求职者中心</a></div>';
      } else if (d.ok) {
        api('/api/state').then(function (st) { if (st.resume && st.resume.name && $('#p-name')) $('#p-name').textContent = st.resume.name; });
      }
    });
    $('#s0-next').addEventListener('click', function () { showAStep(1); });
    $('#s1-back').addEventListener('click', function () { showAStep(0); });
    $('#s1-next').addEventListener('click', function () { if (!$('#c-read').checked) { toast('请先勾选确认'); return; } showAStep(2); });
    $('#s2-back').addEventListener('click', function () { showAStep(1); });
    var drone = null, noreturn = false;
    function enterNoReturn() {
      showAStep(3); noreturn = true;
      fetch('/api/lock', { method: 'POST' }).catch(function () {});
      document.body.classList.add('pointofnoreturn');
      try { var ctx = new (window.AudioContext || window.webkitAudioContext)(); drone = ctx.createOscillator(); var g = ctx.createGain(); drone.type = 'sawtooth'; drone.frequency.value = 55; g.gain.value = 0.08; drone.connect(g).connect(ctx.destination); drone.start(); } catch (e) {}
      setTimeout(function () { document.body.classList.add('pnshake'); }, 1400);
      window.addEventListener('beforeunload', function (e) { if (noreturn) { e.preventDefault(); e.returnValue = ''; return ''; } });
    }
    $('#s2-next').addEventListener('click', function () { if (!$('#c-base').checked || !$('#c-device').checked) { toast('请勾选全部授权项'); return; } enterNoReturn(); });
    $('#s3-next').addEventListener('click', function () {
      if (!$('#c-final').checked) { $('#s3-warn').style.display = ''; $('#s3-warn').textContent = '你必须接受。这里没有返回。'; return; }
      document.body.classList.add('dk-glitch');
      if (drone) try { drone.frequency.linearRampToValueAtTime(38, drone.context.currentTime + 2); } catch (e) {}
      showAStep(4);
    });
    $('#s4-sign').addEventListener('click', function () {
      var name = $('#s4-name').value.trim();
      if (!name) { toast('请输入姓名'); return; }
      api('/api/agreement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name }) }).then(function (d) {
        if (d.ok) doConsumed(name); else toast('签署失败');
      });
    });
    function doConsumed(name) {
      if (drone) try { drone.stop(); } catch (e) {}
      var fs = $('#final-stage'); fs.classList.add('on');
      var txt = ('你戴上了手环，' + name + '。').split('');
      $('#final-txt').textContent = ''; var i = 0;
      var iv = setInterval(function () {
        $('#final-txt').textContent += txt[i] || ''; i++;
        if (i > txt.length) {
          clearInterval(iv);
          try { var ctx = new (window.AudioContext || window.webkitAudioContext)(); var now = ctx.currentTime; var o1 = ctx.createOscillator(), g1 = ctx.createGain(); o1.type = 'sawtooth'; o1.frequency.setValueAtTime(240, now); o1.frequency.exponentialRampToValueAtTime(30, now + 1.8); g1.gain.setValueAtTime(0.0001, now); g1.gain.exponentialRampToValueAtTime(0.5, now + 0.02); g1.gain.exponentialRampToValueAtTime(0.0001, now + 2.0); o1.connect(g1).connect(ctx.destination); o1.start(now); o1.stop(now + 2.1); } catch (e) {}
          document.body.classList.add('pnshake');
          setTimeout(function () { noreturn = false; try { sessionStorage.removeItem('drEndingShown'); } catch (e) {} location.href = '/ending.html'; }, 1800);
        }
      }, 240);
    }
  }
})();
