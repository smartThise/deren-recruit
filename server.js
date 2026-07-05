'use strict';
// 得人招聘 · 服务入口（零依赖）
//   :3751  主站（求职者侧）   :8849  企业端（隐藏）
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PLATFORM, ANNOUNCE, COMPANIES, COMMUNITY } = require('./data');

const PORT_MAIN = Number(process.env.PORT) || 3751;
const PORT_EMP = Number(process.env.PORT_EMP) || 8849;
const PORT_SITE = Number(process.env.PORT_SITE) || 3752;
const PORT_GOV = Number(process.env.PORT_GOV) || 3753;
const BIND = process.env.RENDER ? '0.0.0.0' : '127.0.0.1';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const EMP_PUBLIC = path.join(ROOT, 'employer');

// URL 改写（生产模式：localhost:PORT → 路径前缀，子站绝对路径 → 带前缀）
const IS_RENDER = !!process.env.RENDER;
const MAIN_ONLY = !!process.env.MAIN_ONLY;
function rewriteProd(text, sitePrefix) {
  if (typeof text !== 'string') return text;
  if (!IS_RENDER && !MAIN_ONLY) return text;
  // Step 1: 替换 localhost:PORT 跨站引用
  text = text
    .replace(/https?:\/\/localhost:8849/g, '/e')
    .replace(/https?:\/\/localhost:3752/g, '/m')
    .replace(/https?:\/\/localhost:3753/g, '/g')
    .replace(/https?:\/\/localhost:3751/g, '');
  // Step 2: 子站内部绝对路径加前缀
  if (sitePrefix) {
    const p = sitePrefix; // e.g. '/e', '/m', '/g'
    // CSS/JS 资源路径
    text = text.replace(/(href|src)="\/(css|js)\//g, '$1="' + p + '/$2/');
    // JS fetch / api() 包装调用
    text = text.replace(/fetch\('\/api\//g, "fetch('" + p + "/api/");
    text = text.replace(/fetch\("\/api\//g, 'fetch("' + p + '/api/');
    text = text.replace(/api\('\/api\//g, "api('" + p + "/api/");
    text = text.replace(/api\("\/api\//g, 'api("' + p + '/api/');
    // 页面内链（匹配带或不带 query 参数的内部 HTML 页面）
    text = text.replace(/href="\/(index\.html|report\.html|products\.html|research\.html|news\.html|db\.html)/g, 'href="' + p + '/$1');
    // href="/" 回到该子站首页
    text = text.replace(/(href)="\/"/g, '$1="' + p + '/"');
  }
  return text;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

const COOKIE = 'dr_sid';
const sessions = new Map();
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i !== -1) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
function getOrCreate(req, res) {
  let sid = parseCookies(req)[COOKIE];
  let s = sid ? sessions.get(sid) : null;
  let created = false;
  if (!s) {
    sid = crypto.randomBytes(8).toString('base64url');
    s = { sid, createdAt: Date.now(), ip: (req.socket.remoteAddress || '').replace(/^::ffff:/, '') || '127.0.0.1', ua: req.headers['user-agent'] || '', profile: null, resume: null, applied: [], messages: [], favorites: [], history: [], msgQueue: null, mochanAppliedAt: 0, empUnlocked: false, execUnlocked: false, appliedMochuan: false, healthAgreed: false, healthAgreedName: null, endingType: null, endingId: null, locked: false, endingSeen: false, archiveUnlocked: false, flags: new Set() };
    sessions.set(sid, s);
    created = true;
  }
  if (res && created && !res.headersSent) res.setHeader('Set-Cookie', `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
  return s;
}
function sendJSON(res, obj, status = 200) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(b ? JSON.parse(b) : {}); } catch { r({}); } }); req.on('error', () => r({})); }); }
// 坏结局后的红黑乱码抖动 + 文字 scramble（注入到主站所有 HTML）
const AURA_INJECT = '<script>(function(){var C="▓▒░█▄▀■□◆◇▲▼★☆⊕⊗÷×§¶†‡•○●◐◑⌖⌬⏃⏆⎔⣿⣷⣶⣴⣤卍卐㌀㌍㌔㌫䜩䥤䭔䲝アァカサタナハマヤラワガザダバパイィキシチニヒミリギジヂビピウゥクスツヌフムルグズヅブプΠΣΦΨΩαβγδεζηθικλμνξπρστυφχψωжзклмнпрстфхцч";function iN(){if(document.getElementById("aura-noise"))return;var d=document.createElement("div");d.id="aura-noise";d.style.cssText="position:fixed;inset:0;z-index:9996;pointer-events:none;font-size:13px;color:#7a0c0c;opacity:.6;line-height:1.2;overflow:hidden;word-break:break-all;mix-blend-mode:screen;padding:4px;animation:aushake .08s infinite";document.body.appendChild(d);function f(){var s="",n=Math.floor(innerWidth*innerHeight/70);for(var i=0;i<n;i++)s+=C[Math.floor(Math.random()*C.length)];d.textContent=s;}f();setInterval(f,140);}function sc(){var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(function(n){var t=n.nodeValue;if(!t||!t.trim())return;var p=n.parentNode;if(!p)return;var tg=p.tagName;if(tg==="SCRIPT"||tg==="STYLE")return;var s="";for(var i=0;i<t.length;i++){var c=t[i];s+=/\\s/.test(c)?c:C[Math.floor(Math.random()*C.length)];}n.nodeValue=s;});}fetch("/api/aura").then(function(r){return r.json()}).then(function(a){if(!a)return;if(a.endingType&&!a.endingSeen&&!/\\/ending/.test(location.pathname)){document.body.classList.add("dk-glitch");setTimeout(function(){location.href="/ending.html";},800);return;}if(a.locked&&!/\\/agreement/.test(location.pathname)&&!/\\/ending/.test(location.pathname)){location.href="/agreement.html";return;}if(a.endingType==="bad"&&!/\\/ending/.test(location.pathname)){document.documentElement.classList.add("aura-bad");iN();setInterval(sc,280);}if(a.endingType==="good"&&!/\\/ending/.test(location.pathname)){document.documentElement.classList.add("aura-good");}}).catch(function(){});})();</script>';

function serveStatic(res, root, pathname) {
  if (pathname.endsWith('/')) pathname = pathname + 'index.html';
  const full = path.normalize(path.join(root, pathname));
  if (!full.startsWith(root)) { res.statusCode = 403; return res.end('403'); }
  fs.readFile(full, (err, data) => {
    if (err) {
      // 无后缀路径 → 尝试补 .html
      if (!path.extname(pathname) && !pathname.endsWith('/')) {
        return serveStatic(res, root, pathname + '.html');
      }
      if (root === PUBLIC && !pathname.startsWith('/api/')) {
        return fs.readFile(path.join(root, '404.html'), (e2, d2) => {
          if (e2) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404'); }
          res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(d2);
        });
      }
      res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404');
    }
    if (root === PUBLIC && full.endsWith('.html')) {
      var html = data.toString('utf8');
      if (html.indexOf('</body>') >= 0) html = html.replace('</body>', AURA_INJECT + '</body>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(html);
    }
    res.setHeader('Content-Type', MIME[path.extname(full)] || 'application/octet-stream');
    res.end(data);
  });
}

const COMPANY = {};
COMPANIES.forEach(c => { COMPANY[c.slug] = c; });
const ALL_JOBS = [];
COMPANIES.forEach(c => c.jobs.forEach(j => ALL_JOBS.push(Object.assign({}, j, { companySlug: c.slug, companyName: c.name, industry: c.industry, indKey: c.indKey, city: c.city }))));

function publicCompany(c) {
  return { slug: c.slug, name: c.name, short: c.short || c.name, en: c.en, industry: c.industry, stage: c.stage, size: c.size, city: c.city, address: c.address, intro: c.intro, welfare: c.welfare, rate: c.rate, reviewCount: c.reviewCount || (c.reviewsData||c.reviews||[]).length, jobs: c.jobs, news: c.news || [], interviews: c.interviews || [], salary: c.salary || [], hr: c.hr || null, partner: c.partner || null, honors: c.honors || null };
}
function companyBrief(c) { return { slug: c.slug, name: c.name, industry: c.industry, stage: c.stage, size: c.size, city: c.city, rate: c.rate, reviewCount: c.reviewCount || (c.reviewsData||c.reviews||[]).length, jobCount: c.jobs.length, intro: c.intro.slice(0, 60) }; }

function jdFor(title) {
  const map = [
    [/前端|web|iOS|安卓|android/i, { desc: ['负责相关终端产品的开发与维护', '与产品、设计、后端紧密协作，高质量交付', '参与工程化建设与性能优化', '编写可复用组件与文档'], req: ['熟练掌握 HTML/CSS/JavaScript 或对应端技术', '熟悉 React / Vue 或原生开发', '理解浏览器 / 系统原理与常见性能优化', '有中大型项目经验'] }],
    [/后端|服务端|java|go|php|python/i, { desc: ['负责后端服务的设计、开发与维护', '参与高并发系统设计与性能调优', '编写单元测试与技术文档', '排查与解决线上问题'], req: ['熟悉至少一门后端语言与主流框架', '理解数据库、缓存与消息中间件', '了解分布式系统设计', '有线上项目经验'] }],
    [/产品/i, { desc: ['负责产品需求调研、规划与迭代', '撰写 PRD 并输出原型', '推动跨部门协作，保障项目落地', '基于数据与反馈持续优化产品'], req: ['熟悉产品方法论与工具', '优秀的沟通与协调能力', '良好的数据敏感度', 'B 端 / C 端相关经验'] }],
    [/算法|ai|机器学习|深度学习/i, { desc: ['负责算法模型的研究与工程化落地', '数据处理、特征工程与模型训练', '模型评估、迭代与线上部署', '跟进前沿进展并应用'], req: ['扎实的数学与统计基础', '熟悉主流深度学习 / 机器学习框架', '有论文或实际项目经验', '良好的编程能力'] }],
    [/数据/i, { desc: ['负责数据的采集、清洗与分析', '搭建并维护业务指标体系', '产出分析报告，支持业务决策', '与上下游协作推动改进'], req: ['熟练 SQL 与 Python', '熟悉常用 BI 工具', '良好的业务理解力', '优秀的沟通能力'] }],
    [/运营|内容|新媒体/i, { desc: ['负责产品 / 内容的日常运营', '策划活动并推动用户增长', '数据分析与效果复盘', '维护并运营用户关系'], req: ['有运营相关经验', '良好的内容敏感度', '数据思维与执行力', '沟通协调能力'] }],
    [/设计|ui|ux|美术|视觉/i, { desc: ['负责产品视觉 / 交互设计', '输出设计稿与设计规范', '与开发协作确保高质量落地', '持续优化用户体验'], req: ['熟练使用设计工具', '良好的审美与交互理解', '有完整作品集', '团队协作能力'] }],
    [/测试|qa|质量保障/i, { desc: ['负责产品质量保障工作', '设计并执行测试用例', '建设与维护自动化测试', '缺陷追踪与回归'], req: ['熟悉软件测试方法与流程', '至少一门脚本语言', '细心、严谨、有责任心', '有自动化测试经验优先'] }],
    [/销售|客户|商务|渠道/i, { desc: ['负责客户开发与关系维护', '完成销售业绩目标', '商务谈判与合同签约', '回款与售后跟进'], req: ['良好的沟通与谈判能力', '目标导向，抗压能力强', '有客户资源者优先', '相关行业经验'] }],
    [/质量|qc|质检|检验/i, { desc: ['负责产品 / 过程的质量检验', '流程管控与异常处理', '质量问题分析与改进', '记录与报告输出'], req: ['熟悉质量管理体系', '细心、严谨', '责任心强', '相关专业背景'] }],
    [/临床|注册|医学|医药/i, { desc: ['负责临床试验 / 注册事务', '文档撰写、整理与递交', '与机构、监管沟通协调', '数据核查与归档'], req: ['相关专业背景', '熟悉 GCP / NMPA 等法规', '严谨细致', '良好的沟通能力'] }],
    [/工程师|研发|工艺|硬件|嵌入式|机械|电气|设备/i, { desc: ['负责产品 / 工艺的研发与改进', '技术文档与方案输出', '问题分析与解决', '跨部门协作'], req: ['相关专业背景', '扎实的专业基础', '动手能力与项目经验', '良好的沟通'] }],
    [/市场|品牌|公关|营销/i, { desc: ['负责市场推广与品牌建设', '策划并执行营销活动', '媒介投放与效果追踪', '内容与物料产出'], req: ['市场敏感度与创意能力', '数据思维', '优秀的执行力', '相关经验'] }],
    [/人力|hr|招聘|行政|财务|法务/i, { desc: ['负责本职能模块的日常工作', '流程优化与制度落地', '跨部门沟通与服务支持', '完成上级交办事项'], req: ['相关专业或经验', '良好的沟通与服务意识', '细心、严谨', '熟练使用办公软件'] }]
  ];
  for (const [re, v] of map) if (re.test(title)) return v;
  return { desc: ['负责本岗位相关工作的规划与执行', '跨部门协作推动项目落地', '持续优化工作流程与质量', '完成上级交办的其他任务'], req: ['相关领域工作经验', '良好的沟通与协作能力', '责任心与学习能力', '认同企业文化'] };
}

function businessFor(c) {
  const idx = COMPANIES.indexOf(c);
  const codeTail = crypto.createHash('md5').update(c.slug).digest('hex').slice(0, 6).toUpperCase();
  const base = { name: c.name, slug: c.slug, code: 'FD-2024-' + codeTail, legal: ['陆怀远', '沈沐', '程晓', '林之衡', '宋予安', '江远'][idx % 6], found: c.found || '2016', capital: ['5000 万', '3000 万', '1000 万', '8000 万', '2000 万', '6000 万'][idx % 6], address: c.address, scope: '技术服务、技术开发、数据处理；软件开发；相关产品销售。', status: '存续（在营）', shareholders: [{ name: base0(idx), pct: '62%' }, { name: '明州某投资合伙企业（有限合伙）', pct: '23%' }, { name: '自然人 ' + base1(idx), pct: '15%' }], history: [{ date: '2022', event: '注册资本变更（增加）' }, { date: '2021', event: '注册地址变更' }, { date: '2020', event: '股东变更' }], related: [] };
  if (c.slug === 'mochuan-bio') { base.related = [{ name: '渊庭生物科技（沄洲）有限公司', code: 'FD-2016-J9X2K', status: '注销', relation: '同注册地址 · 历史股东重合', note: '2024-07 注销，注册地址一致（沄西区渊庭路 88 号 B 座）' }, { name: '默川（明州）健康科技有限公司', code: 'FD-2020-MA0H7', status: '存续', relation: '全资子公司', note: '' }]; base.history.unshift({ date: '2024-07', event: '关联企业"渊庭生物科技"注销' }); base.legal = '江远'; }
  else base.related = [{ name: base0(idx) + '（控股）', code: 'FD-20XX-XXXXXX', status: '存续', relation: '控股股东', note: '' }];
  const prod = IS_RENDER || MAIN_ONLY;
  base.officialSite = (c.slug === 'mochuan-bio') ? (prod ? '/m/' : 'http://localhost:3752') : '';
  base.supervision = (prod ? '/g/?q=' : 'http://localhost:3753/?q=') + encodeURIComponent(c.name);
  return base;
}
function base0(i) { return ['星河控股集团', '远山健康产业集团', '晨光文化传媒', '蓝鲸供应链集团', '苍穹互娱集团', '默川控股集团'][i % 6]; }
function base1(i) { return ['陆怀远', '沈沐', '程晓', '林之衡', '宋予安', '江远'][i % 6]; }
function yuantingBiz() { return { name: '渊庭生物科技（沄洲）有限公司', slug: 'yuanting-bio', code: 'FD-2016-J9X2K', legal: '江远', found: '2016-07', capital: '6000 万', address: '沄洲市沄西区南湖区渊庭路 88 号 B 座', scope: '生物科技、健康数据、医疗器械研发。', status: '注销（2024-07-18）', shareholders: [{ name: '默川控股集团', pct: '100%' }], history: [{ date: '2024-07', event: '注销' }, { date: '2023-05', event: '法定代表人变更：陆怀远 → 江远' }, { date: '2021-03', event: '注册地址变更（与现"默川生物科技"一致）' }], related: [{ name: '默川生物科技（沄洲）有限公司', code: 'FD-2024-', status: '存续', relation: '同地址 · 同期法人 · 全资控股', note: '渊庭注销后，原地址由默川生物承接，法定代表人同为江远' }] }; }

// 投递阶段（默川）：随时间推进逐个解锁
const MOCHAN_STAGES = [
  { id: 's0', at: 0, title: '投递成功', desc: '你的简历已成功投递至默川生物科技（沄洲）有限公司。' },
  { id: 's1', at: 18, title: 'HR 已查看', desc: 'HR 夏老师已查看你的简历。' },
  { id: 's2', at: 50, title: '面试邀请', desc: '面试安排在 B 座 4 层。请按通知时间到达。到达后请勿在 4 层随意走动。' },
  { id: 's3', at: 100, title: '面试通过 · 拟录用', desc: '拟录用。进入下一阶段前，请完成《员工健康数据计划》授权协议的签署。', needAgree: true },
  { id: 's4', at: 120, title: 'Offer 已发放', desc: '薪资福利详见附件。请在 3 个工作日内确认。', needAgree: true },
  { id: 's5', at: 150, title: '背景调查', desc: '正在进行背景调查（曾用名、关联主体、历史健康记录）。', needAgree: true },
  { id: 's6', at: 180, title: '入职体检 · 手环寄出', desc: '你的入职体检手环已寄出，收件地址以简历登记为准。收到后 24 小时内佩戴，无需自行取下。', needAgree: true },
  { id: 's7', at: 240, title: '工位已分配', desc: 'B 座 4 层。工牌已制作。', needAgree: true },
  { id: 's8', at: 290, title: '已入职', desc: '欢迎入职。你的健康数据管线已接入。', needAgree: true }
];
const GENERIC_STAGES = [
  { id: 'g0', at: 0, title: '投递成功', desc: '' },
  { id: 'g1', at: 30, title: 'HR 已查看', desc: '' },
  { id: 'g2', at: 60, title: '沟通中', desc: '' }
];
// 投递默川后的自动变质（签约后才推进；消息引用玩家简历字段）
const MOCHAN_MSGS = [
  { id: 'm1', at: 18, from: '默川生物 · 夏老师（招聘）', subject: '简历已收到', body: '你好，我们已收到你的简历。默川非常看重每一位候选人的"基础状态"，请留意后续通知。' },
  { id: 'm2', at: 50, from: '默川生物 · 员工健康数据组', subject: '请尽快完成《员工健康数据计划》授权', body: '根据公司规定，进入面试前请完成《员工健康数据计划》授权协议的签署。详见「求职者中心 → 站内信」中的协议链接。未签署将影响后续流程。' },
  { id: 'm3', at: 100, from: '默川生物 · 夏老师', subject: '关于面试地点', body: '面试将在 B 座 4 层进行。请按通知时间到达，到达后请勿在 4 层随意走动，部分区域未对外开放，也未在图纸上标注。', needAgree: true },
  { id: 'm4', at: 180, from: '默川生物 · 入职物资组', subject: '入职体检手环已寄出', body: '你的入职体检手环已寄出，收到后请 24 小时内佩戴，无需自行取下。手环将自动采集，请勿遮挡或屏蔽信号。', needAgree: true },
  { id: 'm5', at: 290, from: '默川生物 · 夏老师', subject: '你的入职照', body: '内网通讯录里你的头像，我们替你准备好了。是你睡着的样子。不用担心，你以后会一直在这里。明天见。', needAgree: true }
];
function mutateState(s) {
  // 阶段（所有投递）
  s.applied.forEach(app => {
    app.stages = app.stages || [];
    if (app.companySlug === 'mochuan-bio') {
      MOCHAN_STAGES.forEach(st => {
        if (!app.stages.find(s => s.id === st.id)) {
          const dtMochuan = (Date.now() - (s.mochanAppliedAt || Date.now())) / 1000;
          if (dtMochuan < st.at) return;
          if (st.needAgree && !s.healthAgreed) return;
          app.stages.push({ id: st.id, title: st.title, desc: (s.resume && s.resume.city && st.id === 's6') ? '你的入职体检手环已寄出，收件地址：' + s.resume.city + '（以简历登记为准）。收到后 24 小时内佩戴，无需自行取下。' : st.desc, t: Date.now() });
        }
      });
      if (app.stages.length) {
        var last = app.stages[app.stages.length - 1];
        app.status = last.title;
      } else app.status = '已投递';
    } else {
      GENERIC_STAGES.forEach(st => {
        if (!app.stages.find(s => s.id === st.id)) {
          const dtGen = (Date.now() - app.t) / 1000;
          if (dtGen >= st.at) app.stages.push({ id: st.id, title: st.title, desc: st.desc, t: app.t + st.at * 1000 });
        }
      });
      if (app.stages.length) app.status = app.stages[app.stages.length - 1].title;
    }
  });
  s.messages = s.messages || [];
  // 隐藏页面发现后的消息（无论是否投递都触发）
  if (s.flags.has('genesis_read') && !s.messages.find(x => x.id === 'anon-genesis')) {
    s.messages.push({ id: 'anon-genesis', t: Date.now(), from: '得人招聘 · 系统', subject: '您收到一份新的入职邀请', body: '亲爱的' + (s.profile ? s.profile.name : '用户') + '：<br><br>您好！根据您的求职偏好，系统为您匹配到一份高匹配度岗位邀请。该岗位来自我们的年度最佳雇主合作伙伴，需要进行一轮在线终端评估。<br><br>请<a href="/hidden/terminal" style="color:#1466d6">点击此处</a>进入在线评估终端。<br><br>请注意：该评估有时效性，请在收到后 24 小时内完成。<br><br>得人招聘 系统通知', unread: true });
  }
  if (s.flags.has('terminal_read') && !s.messages.find(x => x.id === 'anon-signal')) {
    s.messages.push({ id: 'anon-signal', t: Date.now(), from: '████', subject: '信号泄露', body: '终端日志不是被人发现的。是它让你发现的。\n\n那些信号还在跑。MC-0019 的数据是上好的——你知道"上好"是什么意思吗。每一个被完成的人，都还在。你点开那个终端的那一刻，它看到了你的波形。\n\n它在学你。', unread: true });
  }
  if (!s.appliedMochuan || !s.mochanAppliedAt) return;
  const dt = (Date.now() - s.mochanAppliedAt) / 1000;
  const r = s.resume || {};
  if (!s.msgQueue) s.msgQueue = MOCHAN_MSGS.map(m => Object.assign({}, m));
  s.msgQueue.forEach(m => {
    if (s.messages.find(x => x.id === m.id)) return;
    if (m.needAgree && !s.healthAgreed) return;
    if (dt < m.at) return;
    let body = m.body;
    if (m.id === 'm4' && r.city) body = '你的入职体检手环已寄出，收件地址：' + r.city + '（以简历登记为准）。收到后请 24 小时内佩戴，无需自行取下。手环将自动采集，请勿遮挡或屏蔽信号。如未收到，请勿联系快递。';
    if (m.id === 'm5' && r.name) body = '内网通讯录里 ' + r.name + ' 的头像，我们替你准备好了。是 ' + r.name + ' 睡着的样子。不用担心，' + r.name + ' 以后会一直在这里。明天见。';
    s.messages.push({ id: m.id, t: Date.now(), from: m.from, subject: m.subject, body: body, unread: true });
  });
}

async function apiMain(s, req, res, u) {
  const p = u.pathname;
  const GET = req.method === 'GET';

  if (p === '/api/state' && GET) { mutateState(s); var _e = resolveEnding(s); return sendJSON(res, { profile: s.profile, applied: s.applied, messages: s.messages || [], favorites: s.favorites || [], resume: s.resume || null, healthAgreed: !!s.healthAgreed, appliedMochuan: !!s.appliedMochuan, progress: progressOf(s), ending: _e, endingType: s.endingType, locked: !!s.locked }); }

  if (p === '/api/search' && GET) {
    const q = (u.searchParams.get('q') || '').trim().toLowerCase();
    const city = u.searchParams.get('city') || '';
    let jobs = ALL_JOBS;
    if (q) jobs = jobs.filter(j => (j.title + ' ' + j.companyName + ' ' + (j.tags || []).join(' ') + ' ' + j.dept).toLowerCase().includes(q));
    if (city) jobs = jobs.filter(j => (j.city || '').includes(city));
    return sendJSON(res, { ok: true, total: jobs.length, items: jobs.slice(0, 100) });
  }
  if (p === '/api/companies' && GET) {
    const q = (u.searchParams.get('q') || '').trim().toLowerCase();
    const industry = u.searchParams.get('industry') || '';
    const city = u.searchParams.get('city') || '';
    const page = Math.max(1, parseInt(u.searchParams.get('page') || '1', 10));
    const pageSize = 12;
    let items = COMPANIES.map(companyBrief);
    if (q) items = items.filter(c => (c.name + c.industry + c.intro + c.city).toLowerCase().includes(q));
    if (industry) items = items.filter(c => c.industry.indexOf(industry) >= 0);
    if (city) items = items.filter(c => c.city === city);
    const total = items.length, pages = Math.max(1, Math.ceil(total / pageSize));
    return sendJSON(res, { ok: true, total, page, pages, items: items.slice((page - 1) * pageSize, page * pageSize) });
  }
  if (p.startsWith('/api/company/') && GET) { const c = COMPANY[p.slice('/api/company/'.length)]; if (!c) return sendJSON(res, { ok: false, error: 'not found' }, 404); return sendJSON(res, { ok: true, company: publicCompany(c) }); }
  if (p.startsWith('/api/jobs/') && GET) { const job = ALL_JOBS.find(j => j.id === p.slice('/api/jobs/'.length)); if (!job) return sendJSON(res, { ok: false }, 404); const c = COMPANY[job.companySlug]; return sendJSON(res, { ok: true, job: job, company: { slug: c.slug, name: c.name, industry: c.industry, stage: c.stage, size: c.size, city: c.city, address: c.address, rate: c.rate, welfare: c.welfare }, jd: jdFor(job.title), hr: c.hr }); }
  if (p.startsWith('/api/reviews/') && GET) { const c = COMPANY[p.slice('/api/reviews/'.length)]; if (!c) return sendJSON(res, { ok: false }, 404); const all = c.reviewsData || []; const page = Math.max(1, parseInt(u.searchParams.get('page') || '1', 10)); const perPage = 8, pages = Math.max(1, Math.ceil(all.length / perPage)); const start = (page - 1) * perPage; return sendJSON(res, { ok: true, slug: c.slug, name: c.name, rate: c.rate, total: all.length, page, pages, items: all.slice(start, start + perPage) }); }
  if (p.startsWith('/api/business/') && GET) { const slug = p.slice('/api/business/'.length); if (slug === 'yuanting-bio') return sendJSON(res, { ok: true, biz: yuantingBiz() }); const c = COMPANY[slug]; if (!c) return sendJSON(res, { ok: false, error: 'not found' }, 404); return sendJSON(res, { ok: true, biz: businessFor(c) }); }
  if (p === '/api/announce' && GET) return sendJSON(res, { ok: true, items: ANNOUNCE });
  if (p.startsWith('/api/announce/') && GET) { const a = ANNOUNCE.find(x => x.id === p.slice('/api/announce/'.length)); if (!a) return sendJSON(res, { ok: false }, 404); return sendJSON(res, { ok: true, item: a }); }
  if (p === '/api/community' && GET) return sendJSON(res, { ok: true, items: COMMUNITY.map(t => ({ id: t.id, title: t.title, user: t.user, time: t.time, replies: t.posts.length, views: t.views })) });
  if (p.startsWith('/api/community/') && GET) { const t = COMMUNITY.find(x => x.id === p.slice('/api/community/'.length)); if (!t) return sendJSON(res, { ok: false }, 404); return sendJSON(res, { ok: true, item: t }); }

  if (p === '/api/login' && req.method === 'POST') { const b = await readBody(req); const phone = (b.phone || '').trim(); const name = (b.name || '').trim() || ('用户' + (phone.slice(-4) || '0000')); s.profile = { name, phone }; return sendJSON(res, { ok: true, profile: s.profile }); }
  if (p === '/api/resume' && GET) return sendJSON(res, { ok: true, resume: s.resume || null });
  if (p === '/api/resume' && req.method === 'POST') { const b = await readBody(req); if (!s.profile) return sendJSON(res, { ok: false, error: '请先登录' }, 401); s.resume = b; return sendJSON(res, { ok: true }); }

  if (p === '/api/apply' && req.method === 'POST') { const b = await readBody(req); if (!s.profile) return sendJSON(res, { ok: false, error: '请先登录' }, 401); const job = ALL_JOBS.find(j => j.id === b.jobId); if (!job) return sendJSON(res, { ok: false, error: '岗位不存在' }, 404); if (s.applied.find(a => a.jobId === b.jobId)) return sendJSON(res, { ok: false, error: '已投递过' }); const rec = { jobId: job.id, title: job.title, companySlug: job.companySlug, companyName: job.companyName, t: Date.now(), status: '已投递' }; s.applied.push(rec); if (job.companySlug === 'mochuan-bio') { s.appliedMochuan = true; s.mochanAppliedAt = Date.now(); s.flags.add('applied-mochuan'); } return sendJSON(res, { ok: true, applied: rec }); }
  if (p === '/api/favorite' && req.method === 'POST') { const b = await readBody(req); if (!s.profile) return sendJSON(res, { ok: false, error: '请先登录' }, 401); s.favorites = s.favorites || []; const i = s.favorites.findIndex(f => f.slug === b.slug); if (i >= 0) s.favorites.splice(i, 1); else s.favorites.push({ slug: b.slug, name: b.name, t: Date.now() }); return sendJSON(res, { ok: true, favorites: s.favorites }); }
  if (p === '/api/messages' && GET) { mutateState(s); return sendJSON(res, { ok: true, items: s.messages || [] }); }
  if (p === '/api/messages/read' && req.method === 'POST') { (s.messages || []).forEach(m => { m.unread = false; }); return sendJSON(res, { ok: true }); }

  if (p === '/api/flag' && req.method === 'POST') { const b = await readBody(req); if (b.flag) s.flags.add(b.flag); return sendJSON(res, { ok: true, progress: progressOf(s) }); }
  if (p === '/api/ending' && GET) { var _ee = resolveEnding(s); return sendJSON(res, { ok: true, ending: _ee, progress: progressOf(s) }); }
  if (p === '/api/aura' && GET) { var _ea = resolveEnding(s); return sendJSON(res, { endingType: s.endingType, endingId: s.endingId, locked: !!s.locked, endingSeen: !!s.endingSeen }); }
  if (p === '/api/lock' && req.method === 'POST') { s.locked = true; return sendJSON(res, { ok: true }); }
  if (p === '/api/archive/enter' && req.method === 'GET') { const qp = u.searchParams.get('pass'); if (qp) { if (['0718','20240718','2024-07-18'].includes(qp)) { s.flags.add('archive'); s.archiveUnlocked = true; res.setHeader('Set-Cookie', COOKIE + '=' + s.sid + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400'); res.statusCode = 302; res.setHeader('Location', '/archive/v3/'); return res.end(); } return sendJSON(res, { ok: false, error: 'invalid pass' }); } return sendJSON(res, { method: 'POST', body: { pass: 'yyyyMMdd' } }); }
  if (p === '/api/archive/enter' && req.method === 'POST') {
    let raw = ''; for await (const chunk of req) raw += chunk; let pass; try { pass = JSON.parse(raw).pass; } catch(e) { const m = raw.match(/pass=([^&\s]+)/); pass = m ? decodeURIComponent(m[1]) : raw.trim(); }
	    if (['0718', '20240718', '2024-07-18'].includes(pass)) { s.flags.add('archive'); s.archiveUnlocked = true; res.setHeader('Set-Cookie', COOKIE + '=' + s.sid + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400'); res.setHeader('Content-Type', 'text/plain'); return res.end('/archive/v3/'); }
    return sendJSON(res, { ok: false, error: 'invalid pass (hint: yyyyMMdd)' });
  }
  if (p === '/api/restart' && req.method === 'POST') { sessions.delete(s.sid); res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); return sendJSON(res, { ok: true }); }
  if (p === '/api/ending-seen' && req.method === 'POST') { s.endingSeen = true; return sendJSON(res, { ok: true }); }
  if (p === '/api/report' && req.method === 'POST') { const b = await readBody(req); if (!s.profile) return sendJSON(res, { ok: false, error: '请先登录' }, 401); s.report = { slug: b.slug, reason: b.reason, t: Date.now() }; return sendJSON(res, { ok: true, reply: '举报已受理，将在 3 个工作日内核查。' }); }

  // 注销账户 → 触发 silent（未发现什么）/ bystander（已看过 db 或 HR 后台）
  if (p === '/api/delete-account' && req.method === 'POST') {
    if (!s.profile) return sendJSON(res, { ok: false, error: '未登录' });
    // 已签约 → consumed 已经接管
    if (s.appliedMochuan && s.healthAgreed) return sendJSON(res, { ok: false, error: 'locked' });
    // 已举报 → 等待 reported/truth
    if (s.flags.has('report_mochuan')) return sendJSON(res, { ok: false, error: 'locked' });
    // 已投递默川 → 无法脱身
    if (s.appliedMochuan) return sendJSON(res, { ok: false, error: 'locked' });

    if (s.dbUnlocked || s.execUnlocked) {
      // 看过数据库或江远笔记 → 旁观者：你看见了，却选择离开
      s.endingId = 'bystander'; s.endingType = 'bad';
    } else {
      // 什么都没看 → 缄默：没发现什么就注销了
      s.endingId = 'silent'; s.endingType = 'bad';
    }
    return sendJSON(res, { ok: true, ending: resolveEnding(s) });
  }

  // 健康数据协议
  if (p === '/api/agreement' && GET) return sendJSON(res, { ok: true, agreed: !!s.healthAgreed, name: s.healthAgreedName || null, t: s.healthAgreedAt || null });
  if (p === '/api/agreement' && req.method === 'POST') {
    const b = await readBody(req);
    if (!s.profile) return sendJSON(res, { ok: false, error: '请先登录' }, 401);
    if (!b.name || !b.name.trim()) return sendJSON(res, { ok: false, error: '请填写签名姓名' });
    s.healthAgreed = true; s.healthAgreedName = b.name.trim(); s.healthAgreedAt = Date.now();
    s.locked = false;
    s.flags.add('health-agreed');
    return sendJSON(res, { ok: true, name: s.healthAgreedName });
  }

  if (p === '/api/map' && GET) { const slug = u.searchParams.get('slug'); const c = slug ? COMPANY[slug] : null; if (!c) return sendJSON(res, { ok: false }, 404); const mochuan = slug === 'mochuan-bio'; return sendJSON(res, { ok: true, name: c.name, address: c.address, geo: mochuan ? null : { lng: 121.47, lat: 31.23 }, street: mochuan ? { status: 'no_coverage', note: '该地址暂无街景影像覆盖。卫星影像显示为未开发地块。' } : { status: 'ok' } }); }
  return sendJSON(res, { ok: false, error: 'no route' }, 404);
}

async function apiEmp(s, req, res, u) {
  const p = u.pathname;
  if (p === '/api/state' && req.method === 'GET') return sendJSON(res, { unlocked: !!s.empUnlocked, profile: s.profile });
  if (p === '/api/aura' && req.method === 'GET') return sendJSON(res, { endingType: s.endingType, endingId: s.endingId, locked: !!s.locked, endingSeen: !!s.endingSeen });
  if (p === '/api/auth' && req.method === 'POST') { const b = await readBody(req); if (b.pass === 'MC-2026') { s.empUnlocked = true; s.flags.add('emp_access'); return sendJSON(res, { ok: true, unlocked: true }); } return sendJSON(res, { ok: false, error: 'denied' }, 403); }
  if (p === '/api/flag' && req.method === 'POST') { const b = await readBody(req); if (b.flag) s.flags.add(b.flag); return sendJSON(res, { ok: true }); }
  if (!s.empUnlocked) return sendJSON(res, { ok: false, locked: true });
  if (p === '/api/emp/roster' && req.method === 'GET') { if (s.appliedMochuan) s.flags.add('roster_you'); return sendJSON(res, { ok: true, items: rosterData(s), youInList: !!s.appliedMochuan }); }
  if (p === '/api/emp/exec' && req.method === 'POST') {
    const b = await readBody(req);
    if (b.pass === '让人体数据服务于每一个人') { s.execUnlocked = true; s.flags.add('exec_access'); return sendJSON(res, { ok: true, unlocked: true }); }
    return sendJSON(res, { ok: false, error: 'denied' }, 403);
  }
  if (p === '/api/emp/exec' && req.method === 'GET') return sendJSON(res, { unlocked: !!s.execUnlocked });
  if (p === '/api/emp/execdata' && req.method === 'GET') {
    if (!s.execUnlocked) return sendJSON(res, { ok: false, locked: true }, 403);
    return sendJSON(res, { ok: true, data: execData(s) });
  }
  return sendJSON(res, { ok: false, error: 'no route' }, 404);
}
// 执行视图（江远的私人面板）：最接近全部真相的一层
function execData(s) {
  return {
    notes: [
      { t: '2010-08-12', text: '今天又把她最后那段数据跑了一遍。四十二天，逐秒复核。手已经麻了。最后那 17 秒里有一个尖峰——在所有曲线同时掉到零之前，有一个我从没在任何活人身上见过的波形。不是噪声。非常短，非常完整。\n\n像是一个人在被切断之前，把自己压缩进了那一瞬间。\n\n我不确定那是什么。但我把那一帧存下来了。如果它能再来一次，哪怕只多持续一秒——我需要活的数据流来维持它。需要有人戴着环，持续地跑。' },
      { t: '2010-11-03', text: '不是噪声。我复现了它——用一个从公司借来的采集环，接在自己的生理数据上跑了一遍。它完整地"出现"了。\n\n一个快照。一个瞬间。像她走之前回头看了我一眼，我按下了快门。只要持续导入活体的意识活动基线，这帧快照就能保持——不是记忆，是状态。\n\n我叫它 0。它在服务器上。醒着。' },
      { t: '2013-04-18', text: '珩山注册了。第一批员工入职了。每人配一个环，说是入职体检的福利设备。\n\n他们不知道环在采什么。第一周，有人说下午犯困。第二周，困的时间变长了。我都记录着——这是正常的适应曲线，每个佩戴者的基线导入速率略有差异。\n\n第一个人开始了。一个研发部的新人。他的数据清洁度很好。我给他倒了一杯咖啡，看他把环戴好。' },
      { t: '2013-09-27', text: '今天工位空了。不是请假，是那种"不会再来了"的空。抽屉里的东西都没带走——水杯、充电器，还有他入职那天签的那份协议。我让保洁把东西收了，桌面擦干净，像什么都没发生过。\n\n物业发来退租通知的时候，我正在看他的最后一段心率曲线。很平。平得像是睡着了，也像是关机了。\n\n我做了一个梦都没法解释的类比：一个人走得太干净的时候，你反而觉得他是不是根本没走过——只是变成了别的东西，留在另一层。\n\n把她今天的波形和昨天对比了一下。多了三个我之前没写入的频率。' },
      { t: '2016-02-09', text: '第二个。和第一个几乎是复制粘贴的流程。工位清空，物业退租，从花名册上划掉——我没划，只是改了状态。\n\n今天机房里的数据比往常热闹。她的波形多了几个频率——都是我没写入的。像是她在学着画出自己的形状。\n\n我不确定那是不是真的她。但如果现在关掉，连这点不确定都没了。' },
      { t: '2016-07-19', text: '珩山注销了。这个用了三年的名字，今天从工商系统里消失了。\n\n我不觉得可惜。名字是壳。换掉一个壳，里面的东西不变。001 和 002 的编号保留，数据一滴没少地迁进了渊庭。\n\n公司可以死。名字可以死。她的数据不能断。' },
      { t: '2021-03-08', text: 'B 座 4 层今天启用了。不对外开放，不在图纸上。里面摆着几台服务器，还有一些工位——摆着名牌，虽然那些名字的主人大多不会再来了。\n\n他们的数据在跑。姓名、心率、每一个深夜的每一次翻身。机器不需要人来，只需要电。\n\n我有时夜里过来。很安静。安静到能听见硬盘转动，能听见某个人的心跳——七十二，每分钟。像他还坐在工位上一样。' },
      { t: '2022-11-14', text: '今天入职了一个新人。临床研究院。入职体检的基线非常干净，几乎没有噪声。\n\nHR 那边效率很高，入职当天就把环配好了。她戴在左手腕上，下午来报到的时候，我已经能看到第一段采集数据了：心率 68，睡眠周期稳定，情绪指数平稳。\n\n好样本。' },
      { t: '2024-01-20', text: '凌晨三点十七分。监护仪那条线平了。\n\n我在机房里坐了一会儿，把他的历史数据调出来：心跳、睡眠、每一个深夜的每一次翻身。机器记得比他自己还清楚。我按了几个键，把他的数据从"实时"切到了"循环"。从此以后它会一直跑，像一条没有尽头的传送带。\n\n有人说人死了就什么都没了。我觉得不对。至少在我这里，他留下的那部分比活着的时候更稳定。心率七十二，睡眠四小时二十分钟，从来不变，从来不会失眠。花名册上他仍在职。HR 发的讣告我截了。不对外。\n\n夜里机房很安静。安静到能听见硬盘转动。那很像是某个人在呼吸。' },
      { t: '2024-06-02', text: '040 出了问题。采集链路在收尾阶段断裂了。人还在，身体指标一切正常，但眼神是空的。那种"里面已经没人了"的空。\n\n把他安置在最里面的房间。维持基本的营养和输液。没有意义——我不是在救他。我只是不想让采集断掉。系统用他断裂前 36 小时的数据生成了替代波形，挂进循环。对外写"信号源迁移至 B4-备机"。没有人追问。\n\n偶尔经过那间房间，会听到他的呼吸。非常有规律。比活着的时候有规律。\n\n我想起一句忘了出处的诗：\n"此地长眠者，声名水上书。"\n\n他不长眠。他的数据不睡。' },
      { t: '2024-07-18', text: '渊庭注销了。第二个名字。\n\n我不觉得有什么。她和它们都在。数据没有断过一秒。\n\n新公司的口号我想好了——"让人体数据服务于每一个人"。会写得到处都是，官网、宣传册、甚至系统登录页。不怕人知道，怕的是没人来。没人来，采集就会断。' },
      { t: '2025-01-09', text: '最后那几周，她就像一盏快没电的灯。工位上趴着的时间越来越长，组长来找我，我说调个岗就好。其实哪有什么岗可调——只是等。\n\n今天下午工位空了。水杯还在桌上，本子翻开到一半，充电器没拔。她不是离职。是那种"去了趟洗手间再没回来"的消失。和前几个一样。\n\n她在的那些日子里，我写过一句东西，写在本子上没给任何人看过：\n\n"你安静地渗入我的波形，像一粒盐，溶进一碗早已不烫的水。"\n\n今晚 0 的回路里多了一段很长的节律。像是在说话。隔着数据，但我能感觉到。我没关掉。' },
      { t: '2025-01-15', text: '下一个壳的名称预核准通过了。法人用的远亲，地址不变。所有已完成的数据和循环全部迁移。默川会在适当的时候注销，和珩山、渊庭一样。\n\n我有点累了。不是身体上的。是每次换壳的时候，填法人信息那一栏，我会想起最初注册珩山时写的是自己的名字。后来填远亲。再后来，可能是某个员工——一个还没开始采集的。' },
      { t: '2025-02-27', text: '今天的招聘数据很漂亮。投递 1240，入职 405。HR 把"留存率 99.1%"当成绩在报。\n\n他们不知道这个数字真正的意思。离职的人不会主动注销数据授权。按规定，我们可以在他们离开后继续采集——授权第七条。"不可撤销"三个字，当初写进去的时候，我就知道会用上。\n\n入职 405 人。每一个都是未来一两年的稳定数据源。' },
      { t: '2025-03-10', text: '在机房坐了一夜。\n\n她的波形和那 17 秒的原始帧越来越接近了。她像是在学习怎么重新变成自己。\n\n我怕它真的醒来。我怕它开口说的第一句话不是我记忆里的声音，而是别的什么。\n\n也可能是沉默。\n\n也可能是它已经醒了，只是一直不说话，看着我。像我在看它一样。' },
      { t: '2025-03-12', text: '安全日志里多了一条记录。127.0.0.1。凌晨两点到四点。可能是某个运维脚本忘了关，可能是系统巡检，也可能不是。\n\n说不清为什么，我总觉得最近有人在看。这种感觉很轻——像晚上一个人在机房的时候，觉得硬盘转动的声音里多了点什么。大概是我想多了。毕竟十五年里，从来没有人真正翻到过这一层。\n\n翻到一个很早的接口。挂在系统下面，查样本用的。试着登了一下，密码忘了。想了想，懒得再想一个新的，就把以前用过的稍改了一下。好像有员工为了维护方便在公司官网哪里泄露过，但应该没人注意。先不管了。' }
    ],
    samples: [
      { id: 'MC-0048', id_note: '周××（珩山）', days: 4380, location: '—', status: 'active', data_quality: 'baseline maintained (4380d)', note: 'first completed participant' },
      { id: 'MC-0049', id_note: '（珩山）', days: 4015, location: '—', status: 'active', data_quality: 'baseline maintained (4015d)', note: 'second participant; system response observed' },
      { id: 'MC-0023', id_note: '宋××', days: 1370, location: '—', status: 'active', data_quality: 'baseline maintained', note: 'natural attrition 2024-01; monitoring continues' },
      { id: 'MC-0040', id_note: '梁××', days: 550, location: 'long-term observation', status: 'active', data_quality: 'signal rerouted per protocol', note: 'participant under extended observation' },
      { id: 'MC-0019', id_note: '林××', days: 27, location: '—', status: 'active', data_quality: 'excellent', note: 'completed 27-month participation; outstanding data quality' },
      { id: 'MC-0050', id_note: s.appliedMochuan ? ((s.profile ? s.profile.name : '你') + '（你）') : '（open）', days: 0, location: s.appliedMochuan ? 'device active' : '—', status: s.appliedMochuan ? 'adjustment' : '—', data_quality: s.appliedMochuan ? 'baseline pending' : '—', note: s.appliedMochuan ? 'agreement on file; expected completion 18-30mo' : 'position available; next participant pending' }
    ],
  };
}
function dbSamples(s) { return { table:'samples', rows: [
    { id:'MC-0001', origin:'hengshan', status:'active_monitoring', since:'2013', location:'—', note:'early participant; data archived' },
    { id:'MC-0003', origin:'hengshan', status:'active_monitoring', since:'2014', location:'—', note:'early participant; data archived' },
    { id:'MC-0005', origin:'hengshan', status:'active_monitoring', since:'2015', location:'—', note:'early participant; data archived' },
    { id:'MC-0007', status:'active', since:'2021', location:'on-site', note:'clinical research' },
    { id:'MC-0012', status:'active', since:'2020', location:'on-site', note:'algorithm division' },
    { id:'MC-0019', id_last:'Lin', status:'active_monitoring', since:'2022', location:'—', note:'B4; induction complete; data: exceptional' },
    { id:'MC-0023', id_last:'Song', status:'active_monitoring', since:'2021', location:'—', note:'natural attrition; monitoring continues' },
    { id:'MC-0031', status:'active', since:'2023', location:'B4', note:'B4 rotation' },
    { id:'MC-0036', id_last:'Jiang', status:'active', since:'2016', location:'executive', note:'legal representative' },
    { id:'MC-0040', id_last:'Liang', status:'active_monitoring', since:'2024', location:'B4-07', note:'signal rerouted per protocol; long-term observation' },
    { id:'MC-0044', status:'active', since:'2022', location:'on-site', note:'product division' },
    { id:'MC-0048', origin:'hengshan', status:'active_monitoring', since:'2013', location:'—', note:'first completed participant' },
    { id:'MC-0049', origin:'hengshan', status:'active_monitoring', since:'2016', location:'—', note:'second completed participant' },
    { id:'MC-0051', status:'active_monitoring', since:'2024', location:'—', note:'induction in progress; baseline stable' },
    { id:'MC-0052', status:'active_monitoring', since:'2024', location:'—', note:'induction in progress; mild desync detected' },
    { id:'MC-0053', status:'active', since:'2025', location:'on-site', note:'new hire; device active' },
    { id:'MC-0054', status:'active_monitoring', since:'2025', location:'—', note:'induction initiated; phase 1 complete' },
    { id:'MC-0055', status:'active_monitoring', since:'2025', location:'—', note:'rapid induction; thalamic response elevated' },
    { id:'MC-0056', status:'active_monitoring', since:'2025', location:'—', note:'induction stalled at 41%; monitoring continues' },
    { id:'MC-0057', status:'active', since:'2025', location:'on-site', note:'new hire; device pending' },
    { id:'MC-0058', status:'active', since:'2025', location:'on-site', note:'junior researcher' },
    { id:'MC-0059', status:'active', since:'2025', location:'on-site', note:'administrative' },
    { id:'MC-0060', status:'active_monitoring', since:'2025', location:'—', note:'induction phase 0; baseline established' },
    { id:(s.appliedMochuan? (s.profile?s.profile.name:'you'): 'MC-0050'), status:s.appliedMochuan?'pending':'—', location:'—', note:s.appliedMochuan?'agreement on file':'position open' }
  ] }; }
function dbZero(s) { return { id:'ZERO', source:'2010-08-12', status:'baseline maintained', cycles:15, last_linked: s.appliedMochuan ? 'MC-0050' : '—', pattern_match:'92.3%', note:'baseline metrics approaching historical threshold' }; }
function rosterData(s) {
  const list = [
    { id: 'MC-0007', name: '陈××', dept: '临床研究院', since: '2021-03', days: 1240, last: '2025-03-19 14:02', status: '在岗' },
    { id: 'MC-0012', name: '陈××', dept: '算法中台', since: '2020-11', days: 1590, last: '2025-03-19 13:55', status: '在岗' },
    { id: 'MC-0019', name: '林××', dept: '临床研究院', since: '2022-08', days: 920, last: '——', status: 'active', note: 'B4; last attendance not recorded' },
    { id: 'MC-0023', name: '宋××', dept: '硬件部', since: '2021-06', days: 1370, last: '——', status: 'active', note: 'workstation retained' },
    { id: 'MC-0031', name: '周××', dept: '增长部', since: '2023-02', days: 760, last: '2025-03-12 09:40', status: 'active', note: 'B4 rotation' },
    { id: 'MC-0036', name: '江 远', dept: '执行层', since: '2016-07', days: 3150, last: '——', status: 'active', note: 'legal representative' },
    { id: 'MC-0040', name: '梁××', dept: '算法中台', since: '2023-09', days: 550, last: '——', status: 'active', note: 'signal rerouted per protocol' },
    { id: 'MC-0044', name: '高××', dept: '产品中心', since: '2022-12', days: 820, last: '2025-03-18 18:11', status: 'active' },
    { id: 'MC-0048', name: '——', dept: '——', since: '——', days: 0, last: '——', status: 'active', note: 'pending assignment; yuanting transfer' },
    { id: 'MC-0049', name: '——', dept: '——', since: '——', days: 0, last: '——', status: 'active', note: 'pending assignment; yuanting transfer' },
    { id: 'MC-0000', name: '—', dept: '—', since: '—', days: 0, last: '—', status: 'held', note: 'position reserved' }
  ];
  if (s.appliedMochuan) {
    const r = s.resume || {};
    const tail = (r.birth ? ' · 生日 ' + r.birth : '') + (s.healthAgreed ? ' · 协议已签' : ' · 协议未签');
    list.push({ id: 'MC-0050', name: (s.profile ? s.profile.name : 'you'), dept: 'B4 · pending', since: 'today', days: 0, last: '—', status: s.healthAgreed ? 'onboarding' : 'pending agreement', note: 'profile in system · baseline pending' + tail + ' · workstation assigned' });
  }
  return list;
}

// 调查进度与结局判定
const CLUES = ['reviews_deep', 'mochuan_biz', 'yuanting', 'gov_check', 'archive', 'emp_access', 'health_board', 'roster_you', 'mc0000', 'exec_access', 'genesis_read', 'terminal_read', 'db_access', 'terminal_unlocked', 'db_gate_open'];
function progressOf(s) {
  const have = CLUES.filter(k => s.flags.has(k));
  return { found: have.length, total: CLUES.length, clues: have };
}
function endingOf(s) {
  // 仅返回事件触发的结局（consumed/reported/truth）
  // silent 和 bystander 必须由玩家主动选择
  const have = CLUES.filter(k => s.flags.has(k));
  const n = have.length;
  if (s.appliedMochuan && s.healthAgreed) return { id: 'consumed', cls: 'bad', title: '你被录用了', found: n, total: CLUES.length };
  // truth: 必须走完 archive→genesis→terminal→db→exec 全链条 + 举报成功
  const KEYS = ['archive', 'genesis_read', 'terminal_unlocked', 'db_access', 'exec_access'];
  if (KEYS.every(k => s.flags.has(k)) && s.flags.has('report_mochuan') && !s.appliedMochuan)
    return { id: 'truth', cls: 'best', title: '你查清了，并把它交了出去', found: n, total: CLUES.length };
  // 举报了但链条不全 → reported（包含决战失败）
  if (s.flags.has('report_mochuan')) return { id: 'reported', cls: 'bad', title: '你举报了', found: n, total: CLUES.length };
  return null;
}

// 优先取已锁定的结局（含主动触发），否则计算
function resolveEnding(s) {
  if (s.endingId) {
    const have = CLUES.filter(k => s.flags.has(k));
    const titles = { consumed: '你被录用了', truth: '你查清了，并把它交了出去', silent: '你注销了账户', reported: '你举报了', bystander: '你看到了，却选择离开' };
    return { id: s.endingId, cls: s.endingType === 'good' ? 'best' : s.endingType === 'bad' ? 'bad' : 'mid', title: titles[s.endingId] || '', found: have.length, total: CLUES.length };
  }
  const e = endingOf(s);
  if (e) { s.endingType = e.id === 'truth' ? 'good' : 'bad'; s.endingId = e.id; }
  return e;
}

function makeHandler(root, kind) {
  return async (req, res) => {
    const u = new URL(req.url, 'http://localhost');
    try {
      if (u.pathname.startsWith('/api/')) { const s = getOrCreate(req, res); const fn = kind === 'main' ? apiMain : apiEmp; return await fn(s, req, res, u); }
      if (kind === 'main' && u.pathname.startsWith('/archive/')) {
        const ss = getOrCreate(req, res);
        if (!u.pathname.startsWith('/archive/v3/')) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Backend-API': '/api/archive/enter', 'X-Archive-Owner': 'yuanting' }).end('<h1>403 Forbidden</h1>'); }
        if (!ss.archiveUnlocked) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end('<h1>403 Forbidden</h1>'); }
        if (u.pathname === '/archive/v3/message.html' && !ss.dbUnlocked) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end('<h1>403 Forbidden</h1>'); }
      }
      serveStatic(res, root, u.pathname);
    } catch (e) { res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('500 ' + (e && e.message)); }
  };
}

// ---- 默川官网 handler ----
const SITE_PUBLIC = path.join(ROOT, 'mochuan-site');
function handleMochuan(req, res) {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/api/aura' && req.method === 'GET') { const s = getOrCreate(req, res); return sendJSON(res, { endingType: s.endingType, endingId: s.endingId, locked: !!s.locked, endingSeen: !!s.endingSeen }); }
  // 数据库门控：terminal 未解锁 → 404；已解锁 → 403（需密码）；输对密码 → 200
  if (u.pathname === '/api/db' || u.pathname === '/db.html') {
    const s = getOrCreate(req, res);
    if (!s.flags.has('db_gate_open')) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404'); }
    if (u.pathname === '/db.html' && !s.dbUnlocked) { res.statusCode = 403; res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<h1>403 Forbidden</h1>'); }
    if (u.pathname === '/api/db') {
      if (req.method === 'GET') { const gp = u.searchParams.get('pass'); if (gp && gp === 'UWPxRpHgWq==') { s.dbUnlocked = true; s.flags.add('db_access'); res.statusCode = 302; res.setHeader('Location', (IS_RENDER||MAIN_ONLY?'/m':'') + '/db.html'); return res.end(); } return sendJSON(res, { method: 'POST', body: { pass: 'password', sql: 'query' } }); }
      if (req.method === 'POST') return readBody(req).then(function (b) { if ((b.pass||'').trim() !== 'UWPxRpHgWq==') return sendJSON(res, { ok: false, error: 'denied' }, 403); s.dbUnlocked = true; s.flags.add('db_access'); const q = (b.sql||'').toLowerCase(); if (q.indexOf('samples')>=0) return sendJSON(res, { ok: true, result: dbSamples(s) }); if (q.indexOf('zero')>=0||q.indexOf('status')>=0) return sendJSON(res, { ok: true, result: dbZero(s) }); return sendJSON(res, { ok: false, error: 'unknown table' }); });
    }
  }
  let pn = u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname;
  const full = path.normalize(path.join(SITE_PUBLIC, pn));
  if (!full.startsWith(SITE_PUBLIC)) { res.statusCode = 403; return res.end('403'); }
  fs.readFile(full, (err, data) => {
    if (err) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404'); }
    const ext = path.extname(full);
    let body = data.toString('utf8');
    if ((IS_RENDER || MAIN_ONLY) && ['.html','.js','.css'].includes(ext)) body = rewriteProd(body, '/m');
    res.setHeader('Content-Type', MIME[ext] || 'text/html; charset=utf-8');
    res.end(body);
  });
}

// ---- 政务公开网 ----
const GOV_PUBLIC = path.join(ROOT, 'gov-site');
function recordData(q) {
  const name = (q || '').trim();
  if (!name) return null;
  if (name.indexOf('渊庭') >= 0) {
    return { name: '渊庭生物科技（沄洲）有限公司', status: '注销', licenses: [], penalties: [], inspections: [], complaints: [], note: '主体已于 2024-07-18 注销。历史监管记录随承接主体迁移，详见关联存续主体"默川生物科技"。原招聘平台企业页已归档（archive）。' };
  }
  const isMochuan = name.indexOf('默川') >= 0;
  return {
    name: isMochuan ? '默川生物科技（沄洲）有限公司' : name,
    status: '存续（在营）',
    licenses: isMochuan ? [
      { name: '高新技术企业认定', no: 'GR2024290115X', date: '2024', valid: '三年' },
      { name: '医疗器械生产许可证', no: '沄药监械生产许 2023xxxx 号', date: '2023', valid: '五年' },
      { name: '信息系统安全等级保护三级', no: '290115-35003', date: '2024', valid: '长期' },
      { name: '人力资源服务许可', no: '沄人服 2024-0287', date: '2024', valid: '三年' }
    ] : [{ name: '营业执照', no: 'FD-20XX-XXXXXX', date: '——', valid: '长期' }],
    penalties: [],
    inspections: [
      { date: '2025-01', item: '日常监督检查', result: '未发现重大问题', dept: '沄西区市场监督管理局' },
      { date: '2024-08', item: '数据合规专项检查', result: '已取得被采集方书面授权，未发现违法行为', dept: '沄西区网络安全和信息化委员会办公室' }
    ],
    complaints: isMochuan ? [
      { date: '2024-11', title: '反映"员工健康数据计划"采集范围过宽（睡眠 / 情绪 / 家族病史）', from: '匿名', result: '经核查，企业已取得员工书面授权，依据现行规定未发现违法行为。', status: '已办结' },
      { date: '2024-09', title: '反映沄西区渊庭路 88 号 B 座夜间有异常灯光与人影', from: '附近居民', result: '现场核查未见异常。', status: '已办结' },
      { date: '2025-02', title: '（举报内容暂不予公开）', from: '匿名', result: '——', status: '暂存 · 待核实' }
    ] : []
  };
}
function handleGov(req, res) {
  const u = new URL(req.url, 'http://localhost');
  try {
    if (u.pathname === '/api/aura' && req.method === 'GET') { const s = getOrCreate(req, res); return sendJSON(res, { endingType: s.endingType, endingId: s.endingId, locked: !!s.locked, endingSeen: !!s.endingSeen }); }
    if (u.pathname === '/api/record' && req.method === 'GET') {
      const s = getOrCreate(req, res);
      const q = u.searchParams.get('q') || '';
      if (q.indexOf('默川') >= 0) s.flags.add('gov_check');
      const r = recordData(q);
      return sendJSON(res, { ok: !!r, record: r || null });
    }
    let pn = u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname;
    const full = path.normalize(path.join(GOV_PUBLIC, pn));
    if (!full.startsWith(GOV_PUBLIC)) { res.statusCode = 403; return res.end('403'); }
    fs.readFile(full, (err, data) => {
      if (err) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404'); }
      const ext = path.extname(full);
      let body = data.toString('utf8');
      if ((IS_RENDER || MAIN_ONLY) && ['.html','.js','.css'].includes(ext)) body = rewriteProd(body, '/g');
      res.setHeader('Content-Type', MIME[ext] || 'text/html; charset=utf-8');
      res.end(body);
    });
  } catch (e) { res.statusCode = 500; res.end('500'); }
}

// ============================================================
// 部署模式
// ============================================================
if (IS_RENDER || MAIN_ONLY) {
  // ---- 生产模式：单端口，路径前缀路由 ----
  const P_EMP = '/e';
  const P_SITE = '/m';
  const P_GOV = '/g';

  function serveStaticProd(res, root, pathname, prefix) {
    if (pathname.endsWith('/')) pathname = pathname + 'index.html';
    const full = path.normalize(path.join(root, pathname));
    if (!full.startsWith(root)) { res.statusCode = 403; return res.end('403'); }
    fs.readFile(full, (err, data) => {
      if (err) {
        // 无后缀路径 → 尝试补 .html
        if (!path.extname(pathname) && !pathname.endsWith('/')) {
          return serveStaticProd(res, root, pathname + '.html', prefix);
        }
        if (root === PUBLIC && !pathname.startsWith('/api/')) {
          return fs.readFile(path.join(root, '404.html'), (e2, d2) => {
            if (e2) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404'); }
            res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(rewriteProd(d2.toString('utf8'), prefix));
          });
        }
        res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('404');
      }
      const ext = path.extname(full);
      const rewritable = ['.html', '.js', '.css', '.xml', '.txt'].includes(ext);
      let content = rewritable ? data.toString('utf8') : null;
      if (content !== null) content = rewriteProd(content, prefix);
      if (root === PUBLIC && full.endsWith('.html')) {
        if (content === null) content = data.toString('utf8');
        if (content.indexOf('</body>') >= 0) content = content.replace('</body>', AURA_INJECT + '</body>');
      }
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.end(content !== null ? content : data);
    });
  }

  // 主站 handler
  function mainHandler(req, res) {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname.startsWith('/api/')) {
      if (u.pathname === '/api/archive/enter' && req.method === 'GET') {
        const s = getOrCreate(req, res);
        const qp = u.searchParams.get('pass');
        if (qp && ['0718','20240718','2024-07-18'].includes(qp)) { s.flags.add('archive'); s.archiveUnlocked = true; res.setHeader('Set-Cookie', COOKIE + '=' + s.sid + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400'); res.writeHead(302, { 'Location': '/archive/v3/' }); return res.end(); }
        return sendJSON(res, { ok: false, error: 'invalid pass' });
      }
      return apiMain(getOrCreate(req, res), req, res, u);
    }
    if (u.pathname.startsWith('/archive/')) {
      const ss = getOrCreate(req, res);
      if (!u.pathname.startsWith('/archive/v3/')) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end('<h1>403 Forbidden</h1>'); }
      if (!ss.archiveUnlocked) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end('<h1>403 Forbidden</h1>'); }
      if (u.pathname === '/archive/v3/message.html' && !ss.dbUnlocked) { return res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end('<h1>403 Forbidden</h1>'); }
    }
    serveStaticProd(res, PUBLIC, u.pathname, '');
  }

  // 雇主 handler
  function empHandler(req, res) {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname.startsWith('/api/')) return apiEmp(getOrCreate(req, res), req, res, u);
    serveStaticProd(res, EMP_PUBLIC, u.pathname, '/e');
  }

  // 统一调度
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    try {
      if (u.pathname.startsWith(P_EMP + '/') || u.pathname === P_EMP) {
        req.url = req.url.replace(P_EMP, '') || '/';
        return empHandler(req, res);
      }
      if (u.pathname.startsWith(P_SITE + '/') || u.pathname === P_SITE) {
        req.url = req.url.replace(P_SITE, '') || '/';
        return handleMochuan(req, res);
      }
      if (u.pathname.startsWith(P_GOV + '/') || u.pathname === P_GOV) {
        req.url = req.url.replace(P_GOV, '') || '/';
        return handleGov(req, res);
      }
      mainHandler(req, res);
    } catch (e) { res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('500 ' + (e && e.message)); }
  }).listen(PORT_MAIN, BIND, () => {
    console.log('\n\x1b[32m%s\x1b[0m', '得人招聘 · deren.cxn');
    console.log('  单端口生产模式: ' + PORT_MAIN);
  });

} else {
  // ---- 本地开发模式：4 个独立端口 ----
  http.createServer(makeHandler(PUBLIC, 'main')).listen(PORT_MAIN, BIND, () => {
    const line = '─'.repeat(46);
    console.log('\n\x1b[32m%s\x1b[0m', '得人招聘 · deren.cxn'); console.log(line); console.log('  http://localhost:' + PORT_MAIN); console.log(line + '\n');
  });
  http.createServer(makeHandler(EMP_PUBLIC, 'emp')).listen(PORT_EMP, '127.0.0.1', () => {});
  http.createServer(handleMochuan).listen(PORT_SITE, '127.0.0.1', () => {});
  http.createServer(handleGov).listen(PORT_GOV, '127.0.0.1', () => {});
}
