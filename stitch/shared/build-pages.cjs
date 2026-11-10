const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backupRoot = process.argv[2];
const pages = {
  home: '查找创作者',
  auth_login: '登录',
  auth_signup: '注册',
  auth_forgot_password: '找回密码',
  auth_reset_password: '重置密码',
  onboarding_welcome: '欢迎',
  dashboard: '工作台',
  profile: '个人资料',
  profile_edit: '编辑资料',
  profile_tab_public: '对外主页',
  capabilities: '能力',
  capabilities_action_create: '添加能力',
  capability_edit: '编辑能力',
  services: '服务',
  services_action_create_source_capability_cap_bio_00308: '创建服务',
  service_detail: '服务详情',
  service_edit: '编辑服务',
  requests: '访客请求',
  r_acdefh_3479jk_mnpqrt: '创作者主页',
  s_offering_dance_01: '服务详情',
  o_pending: '请求待处理',
  o_token: '预约结果',
};
for (const platform of ['web', 'mobile']) {
  for (const [page, title] of Object.entries(pages)) {
    const file = path.join(root, platform, page, 'code.html');
    if (backupRoot && fs.existsSync(file)) {
      const old = fs.readFileSync(file, 'utf8');
      if (!old.includes('data-stitch-revision="2026-11"')) {
        const backup = path.join(backupRoot, platform, page, 'code.html');
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
      }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html>\n<html lang="zh-CN" data-stitch-revision="2026-11">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>${title} · 创作者工作台</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="../../shared/styles.css">\n<script defer src="../../shared/app.js"></script>\n</head>\n<body data-page="${page}"><noscript>请启用 JavaScript 以查看页面设计。</noscript></body>\n</html>\n`,
      'utf8',
    );
  }
}
console.log(`Generated ${Object.keys(pages).length * 2} HTML pages`);
