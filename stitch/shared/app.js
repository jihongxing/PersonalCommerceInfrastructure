const page = document.body.dataset.page || 'dashboard';
const shareUrl = 'https://example.com/r/ACDEFH3479JKMNPQRT';
const query = new URLSearchParams(location.search);
const href = (name, params = '') => `../${name}/code.html${params}`;
const icon = (name) => `<span class="icon" aria-hidden="true">${name}</span>`;
const link = (name, text, kind = '', symbol = '', params = '') =>
  `<a class="btn ${kind}" href="${href(name, params)}">${symbol ? icon(symbol) : ''}${text}</a>`;
const btn = (text, action, kind = '', symbol = '') =>
  `<button class="btn ${kind}" type="button" data-action="${action}">${symbol ? icon(symbol) : ''}${text}</button>`;
const status = (text, kind = '') => `<span class="status ${kind}">${text}</span>`;
const heading = (title, description = '', action = '') =>
  `<div class="pagehead"><div><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>${action}</div>`;
const field = (label, name, options = {}) => {
  const {
    value = '',
    placeholder = '',
    max = '',
    type = 'text',
    required = false,
    hint = '',
    rows = 0,
  } = options;
  const attrs = `id="${name}" name="${name}" ${required ? 'required' : ''} ${max ? `maxlength="${max}"` : ''} placeholder="${placeholder}"`;
  return `<div class="field"><label for="${name}">${label}${required ? ' *' : ''}</label>${rows ? `<textarea ${attrs} rows="${rows}">${value}</textarea>` : `<input ${attrs} type="${type}" value="${value}">`}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
};
const nav = [
  ['dashboard', '工作台', 'dashboard'],
  ['profile', '资料', 'person'],
  ['capabilities', '能力', 'workspace_premium'],
  ['services', '服务', 'view_list'],
  ['requests', '请求', 'inbox'],
];
const groups = {
  profile_tab_public: 'profile',
  profile_edit: 'profile',
  capabilities_action_create: 'capabilities',
  capability_edit: 'capabilities',
  services_action_create_source_capability_cap_bio_00308: 'services',
  service_detail: 'services',
  service_edit: 'services',
};
const active = groups[page] || page;
const navigation = () =>
  nav
    .map(
      ([id, label, sym]) =>
        `<a class="${active === id ? 'active' : ''}" href="${href(id)}">${icon(sym)}<span>${label}</span></a>`,
    )
    .join('');
function statePreview(content) {
  const view = query.get('view');
  if (!view) return content;
  const states = {
    loading: ['正在加载', '请稍候，正在获取页面内容。', ''],
    empty: ['暂无内容', '此处还没有可显示的内容。', link(page, '返回页面')],
    error: ['加载失败', '暂时无法获取内容，请稍后重试。', link(page, '重试', 'primary', 'refresh')],
    session: ['登录已失效', '请重新登录后继续操作。', link('auth_login', '重新登录', 'primary')],
    unavailable: ['页面不可访问', '此页面不存在或当前不可访问。', link('home', '返回查找')],
  };
  if (!states[view]) return content;
  const [title, description, action] = states[view];
  return `<section class="surface empty" role="${view === 'error' ? 'alert' : 'status'}"><h2>${title}</h2><p class="muted" style="margin-top:8px">${description}</p>${action ? `<div class="actions" style="justify-content:center">${action}</div>` : ''}</section>`;
}
const creator = (content) =>
  `<div class="shell"><aside class="sidebar"><a class="brand" href="${href('dashboard')}"><span class="brand-mark">C</span><span>创作者工作台<small>CREATOR WORKSPACE</small></span></a><nav class="side-nav" aria-label="工作台导航">${navigation()}</nav><div class="side-foot">C 号 <span class="mono">ACDEFH-3479JK-MNPQRT</span></div></aside><div class="content"><header class="topbar"><div class="topbar-title">创作者工作台</div><a class="avatar" href="${href('profile')}" aria-label="个人资料">林</a></header><main class="main">${statePreview(content)}</main></div><nav class="mobile-nav" aria-label="工作台导航">${navigation()}</nav></div>`;
const publicPage = (content, narrow = false) =>
  `<div class="public-shell"><header class="public-header"><a class="brand" href="${href('home')}"><span class="brand-mark">C</span><span>创作者主页</span></a><a class="btn text" href="${href('auth_login')}">创作者登录</a></header><main class="public-main ${narrow ? 'narrow' : ''}">${statePreview(content)}</main></div>`;
const row = (title, detail, right = '') =>
  `<div class="row"><div><div class="row-title">${title}</div><p class="muted">${detail}</p></div><div class="row-end">${right}</div></div>`;
const tabs = (current) =>
  `<nav class="tabs" aria-label="资料导航"><a class="${current === 'profile' ? 'active' : ''}" href="${href('profile')}">个人资料</a><a class="${current === 'public' ? 'active' : ''}" href="${href('profile_tab_public')}">对外主页</a></nav>`;
const data = (items) =>
  `<dl class="data-grid">${items.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const shareTools = () =>
  `<section class="surface share-tools" aria-labelledby="share-tools-title"><div class="section-heading"><div><h2 id="share-tools-title">对外稳定分享工具</h2><p class="muted">主页内容或版本切换时，C 号和分享地址保持不变</p></div></div>
  <div class="share-content"><img class="share-qr" src="../../shared/share-qr.png" alt="示例分享地址二维码" width="144" height="144"><div class="share-details"><span class="share-label">C 号</span><strong class="mono share-code">ACDEFH-3479JK-MNPQRT</strong><span class="share-label">示例分享链接</span><span class="mono share-url">${shareUrl}</span><div class="actions share-actions">${btn('复制链接', 'copy-url', 'primary', 'content_copy')}<a class="btn" href="../../shared/share-qr.png" download="c-number-example-qr.png">${icon('download')}下载二维码</a>${btn('分享', 'share-url', '', 'share')}</div></div></div>
  <p class="share-note">C 号不证明身份或资质。主页能否访问取决于发布状态。</p></section>`;
const views = {};

views.dashboard = () =>
  creator(`${heading('工作台', '管理资料、服务和访客请求')}
  <div class="stack"><section class="surface"><div class="section-heading"><div><h2>对外主页</h2><p class="muted">访客通过 C 号访问的稳定地址</p></div>${status('已发布')}</div>
  ${data([
    ['当前公开资料', '林岚'],
    ['下一次切换', '暂无计划切换'],
    ['稳定公开地址', '<span class="mono">/r/ACDEFH3479JKMNPQRT</span>'],
  ])}
  <div class="actions">${link('profile_tab_public', '主页设置', 'primary', 'tune')}${link('r_acdefh_3479jk_mnpqrt', '打开主页', '', 'open_in_new')}${btn('复制链接', 'copy-url', '', 'content_copy')}</div></section>
  ${shareTools()}<div class="grid"><section class="surface"><div class="section-heading"><h2>访客请求</h2>${link('requests', '查看全部', 'text', 'arrow_forward')}</div>${row('舞蹈动作指导', '陈女士 · 待处理', status('待处理', 'wait'))}${row('动作分析咨询', '周先生 · 已确认', status('已确认'))}</section>
  <section class="surface"><div class="section-heading"><h2>管理内容</h2></div><a class="quick-link" href="${href('profile')}">个人资料 ${icon('arrow_forward')}</a><a class="quick-link" href="${href('capabilities')}">能力 ${icon('arrow_forward')}</a><a class="quick-link" href="${href('services')}">服务 ${icon('arrow_forward')}</a></section></div></div>`);

views.profile = () =>
  creator(
    `${heading('个人资料', '管理您的创作者身份', link('profile_edit', '编辑资料', 'primary', 'edit'))}${tabs('profile')}<section class="surface"><div class="section-heading"><div><h2>林岚</h2><p class="muted">创作者资料</p></div><span class="avatar">林</span></div>${data(
      [
        ['显示名称', '林岚'],
        ['所在地', '上海'],
        ['简介', '关注动作表达与身体觉察，提供个性化指导。'],
      ],
    )}</section><div class="actions">${link('profile_tab_public', '管理对外主页', '', 'public')}</div>`,
  );
views.profile_edit = () =>
  creator(
    `${heading('编辑个人资料', '更新您的创作者身份')}${tabs('profile')}<section class="surface"><form class="form" data-form="profile">${field('显示名称', 'displayName', { value: '林岚', required: true, max: 120 })}${field('简介', 'bio', { value: '关注动作表达与身体觉察，提供个性化指导。', required: true, max: 2000, rows: 4 })}${field('头像 URL', 'avatarUrl', { type: 'url', placeholder: 'https://' })}${field('所在地', 'location', { value: '上海', max: 100 })}<div class="actions"><button class="btn primary" type="submit">保存资料</button>${link('profile', '取消')}</div></form></section>`,
  );
views.profile_tab_public = () =>
  creator(`${heading('对外主页', '管理访客通过 C 号看到的主页版本')}${tabs('public')}<div class="stack"><section class="surface"><div class="section-heading"><div><h2>当前激活主页</h2><p class="muted">林岚</p></div>${status('已发布')}</div>${data(
    [
      ['默认主页', '林岚'],
      ['下一次切换', '暂无计划切换'],
      ['稳定公开地址', '<span class="mono">/r/ACDEFH3479JKMNPQRT</span>'],
    ],
  )}<div class="actions">${link('r_acdefh_3479jk_mnpqrt', '预览', '', 'visibility')}${btn('暂停此版本', 'pause-version', '', 'pause_circle')}${btn('复制链接', 'copy-url', '', 'content_copy')}</div></section>
  ${shareTools()}<section class="surface" id="homepage-versions"><div class="section-heading"><div><h2>主页版本</h2><p class="muted">没有命中时间窗口时，使用已发布的默认主页</p></div></div>${row('林岚', '已发布 · 默认 · 当前激活', status('已发布'))}<form class="form" data-form="version"><div class="field"><label for="profile-choice">选择公开资料</label><select id="profile-choice" name="profile" required><option value="">选择公开资料</option><option>林岚</option></select></div><div><button class="btn" type="submit">创建主页版本</button></div></form></section>
  <section class="surface"><div class="section-heading"><div><h2>自动切换</h2><p class="muted">时间窗口不能重叠，暂停的版本不会参与选择</p></div></div><p class="muted">此版本没有时间窗口</p><form class="form" data-form="window" style="margin-top:20px"><div class="grid">${field('开始时间', 'startsAt', { type: 'datetime-local', required: true })}${field('结束时间', 'endsAt', { type: 'datetime-local', required: true })}</div>${field('IANA 时区', 'timeZone', { value: 'Asia/Shanghai', required: true, hint: '按此时区解释输入的时间，时间保存为 UTC' })}<div><button class="btn" type="submit">添加时间窗口</button></div></form></section></div>`);

views.capabilities = () =>
  creator(
    `${heading('能力', '管理您提供服务所依赖的能力', link('capabilities_action_create', '添加能力', 'primary', 'add'))}<section class="surface"><div class="section-heading"><h2>我的能力</h2><span class="muted">2 项</span></div>${row('动作分析', '通过观察动作习惯识别调整方向', link('capability_edit', '编辑', 'text', 'edit'))}${row('舞蹈教学', '针对不同基础提供动作指导', link('capability_edit', '编辑', 'text', 'edit'))}</section>`,
  );
const capabilityForm = (edit = false) =>
  creator(
    `${heading(edit ? '编辑能力' : '添加能力', '描述您能够提供的专业能力')}<section class="surface"><form class="form" data-form="capability">${field('能力名称', 'name', { required: true, max: 100, value: edit ? '动作分析' : '' })}${field('能力描述', 'description', { required: true, max: 500, rows: 5, value: edit ? '通过观察动作习惯识别调整方向' : '' })}<div class="actions"><button class="btn primary" type="submit">保存能力</button>${link('capabilities', '取消')}</div></form></section>`,
  );
views.capabilities_action_create = () => capabilityForm();
views.capability_edit = () => capabilityForm(true);

views.services = () =>
  creator(
    `${heading('服务', '管理可向访客提供的服务', link('services_action_create_source_capability_cap_bio_00308', '创建服务', 'primary', 'add'))}<section class="surface"><div class="section-heading"><h2>我的服务</h2><span class="muted">2 项</span></div>${row('舞蹈动作指导', '已发布 · 一对一动作指导', link('service_detail', '查看', 'text', 'arrow_forward'))}${row('动作分析咨询', '草稿 · 线上动作分析', link('service_detail', '查看', 'text', 'arrow_forward'))}</section>`,
  );
const serviceForm = (edit = false) =>
  creator(
    `${heading(edit ? '编辑服务' : '创建服务', '描述服务内容、可用性和预约说明')}<section class="surface"><form class="form" data-form="service">${field('服务名称', 'title', { required: true, max: 160, value: edit ? '舞蹈动作指导' : '' })}${field('服务描述', 'description', { required: true, max: 2000, rows: 4, value: edit ? '根据访客的需求提供一对一动作指导。' : '' })}<div class="field"><label>关联能力 *</label><label class="checkline"><input type="checkbox" name="capabilityIds" value="movement">动作分析</label><label class="checkline"><input type="checkbox" name="capabilityIds" value="dance">舞蹈教学</label><span class="hint">选择 1 至 5 项能力</span></div>${field('可用性描述', 'availabilityDescription', { required: true, max: 1000, rows: 3, value: edit ? '具体时间通过联系方式协商。' : '' })}${field('请求说明', 'requestInstructions', { required: true, max: 1000, rows: 3, value: edit ? '请说明您的需求及方便联系的时间。' : '' })}<div class="actions"><button class="btn primary" type="submit">保存服务</button>${link('services', '取消')}</div></form></section>`,
  );
views.services_action_create_source_capability_cap_bio_00308 = () => serviceForm();
views.service_edit = () => serviceForm(true);
views.service_detail = () =>
  creator(
    `${heading('舞蹈动作指导', '服务详情', link('service_edit', '编辑服务', 'primary', 'edit'))}<section class="surface"><div class="section-heading"><h2>服务信息</h2>${status('已发布')}</div><p class="lead">根据访客的需求提供一对一动作指导。</p>${data(
      [
        ['关联能力', '动作分析、舞蹈教学'],
        ['可用性', '具体时间通过联系方式协商'],
        ['请求说明', '请说明您的需求及方便联系的时间'],
      ],
    )}<div class="actions">${link('s_offering_dance_01', '查看公开服务', '', 'open_in_new')}</div></section>`,
  );

views.requests = () =>
  creator(
    `${heading('访客请求', '查看预约说明并处理请求')}<div class="tabs"><button class="active" type="button" data-action="request-pending">待处理</button><button type="button" data-action="request-confirmed">已确认</button><button type="button" data-action="request-declined">已拒绝</button></div><div class="stack" id="request-list"><section class="surface request-item" data-request-state="pending" id="request-pending"><div class="section-heading"><div><h2>舞蹈动作指导</h2><p class="muted">来自 陈女士</p></div>${status('待处理', 'wait')}</div>${data(
      [
        ['联系方式', 'chen@example.com'],
        ['预约说明', '希望了解动作指导的形式，工作日晚间方便联系。'],
        ['请求状态', '待处理'],
      ],
    )}<div class="actions">${btn('确认请求', 'confirm-request', 'primary', 'check')}${btn('拒绝请求', 'decline-request', 'danger', 'close')}</div></section><section class="surface request-item hidden" data-request-state="confirmed"><div class="section-heading"><div><h2>动作分析咨询</h2><p class="muted">来自 周先生</p></div>${status('已确认')}</div>${data(
      [
        ['联系方式', 'zhou@example.com'],
        ['预约说明', '希望了解线上咨询时间。'],
        ['履约码', '<span class="mono">482731</span>'],
      ],
    )}<div class="actions">${btn('确认履约', 'fulfill-request', '', 'task_alt')}</div></section><div id="request-empty" class="surface empty hidden">暂无此状态的请求</div></div>`,
  );

views.home = () =>
  publicPage(
    `<div class="auth"><h1>查找创作者</h1><p class="lead">通过 C 号访问创作者的公开主页</p><form class="form" data-form="lookup">${field('C 号', 'reference', { required: true, placeholder: '例如 ACDEFH-3479JK-MNPQRT', hint: '输入创作者分享的 18 位 C 号' })}<button class="btn primary" type="submit">查找主页</button><p class="muted">C 号是公开定位标识，不代表身份或资质认证。</p></form></div>`,
    true,
  );
views.r_acdefh_3479jk_mnpqrt = () =>
  publicPage(
    `<div class="public-intro"><span class="muted">创作者主页</span><h1>林岚</h1><p class="muted">C 号 <span class="mono">ACDEFH-3479JK-MNPQRT</span></p></div><section class="public-section"><div class="section-heading"><div><h2>可预约服务</h2><p class="muted">查看服务详情并提交您的需求</p></div></div>${row('舞蹈动作指导', '根据访客的需求提供一对一动作指导。', link('s_offering_dance_01', '查看服务', 'text', 'arrow_forward'))}${row('动作分析咨询', '围绕动作习惯与身体觉察进行交流。', link('s_offering_dance_01', '查看服务', 'text', 'arrow_forward'))}</section><p class="muted" style="margin-top:24px">C 号是公开定位标识，不作为身份凭证、资质认证或平台担保。</p>`,
  );
views.s_offering_dance_01 = () =>
  publicPage(
    `<a class="muted" href="${href('r_acdefh_3479jk_mnpqrt')}">← 返回创作者主页</a><div class="public-intro"><span class="muted">林岚 · 服务详情</span><h1>舞蹈动作指导</h1><p class="lead">根据访客的需求提供一对一动作指导。</p></div><div class="public-layout"><div><section class="public-section"><h2>服务内容</h2><p class="lead">围绕个人需求进行动作指导与交流。</p></section><section class="public-section"><h2>可用性</h2><p class="lead">具体时间通过联系方式协商。</p></section><section class="public-section"><h2>请求说明</h2><p class="lead">请说明您的需求及方便联系的时间。</p></section></div><section class="surface"><h2>提交预约请求</h2><form class="form" data-form="booking" style="margin-top:20px">${field('姓名', 'contactName', { required: true, max: 160 })}${field('联系方式', 'contactMethod', { required: true, max: 320, placeholder: '手机号、邮箱或其他联系方式' })}${field('预约说明', 'requestMessage', { required: true, max: 2000, rows: 4, placeholder: '请描述您的需求，以及方便联系的时间或地点' })}<button class="btn primary" type="submit">提交请求</button><span class="hint">提交后可在结果页查看处理状态</span></form></section></div>`,
  );

const orderStates = [
  ['submitted', '待处理'],
  ['confirmed', '已确认'],
  ['declined', '已拒绝'],
  ['fulfilled', '已履约'],
  ['expired', '已过期'],
  ['invalid', '链接无效'],
];
views.o_pending = () => order('submitted');
views.o_token = () => order('confirmed');
function order(fallback) {
  const state = query.get('state') || fallback;
  const stateLinks = orderStates
    .map(
      ([key, label]) =>
        `<a class="btn ${state === key ? 'primary' : ''}" href="${href('o_token', `?state=${key}`)}">${label}</a>`,
    )
    .join('');
  const content =
    {
      submitted: `${status('待处理', 'wait')}<h1>请求已提交</h1><p class="lead">创作者尚未处理您的请求，请稍后返回此页面查看结果。</p>`,
      confirmed: `${status('已确认')}<h1>请求已确认</h1><p class="lead">创作者已确认您的请求，请妥善保存履约码。</p><div class="code-box"><span class="muted">履约码</span><strong>482731</strong><span class="muted">有效期至 2027-04-22 18:00</span></div><div class="actions">${btn('复制履约码', 'copy-code', '', 'content_copy')}</div>`,
      declined: `${status('已拒绝', 'off')}<h1>请求未获确认</h1><p class="lead">创作者已拒绝此请求。您可以返回服务页面，重新了解服务内容。</p>`,
      fulfilled: `${status('已履约')}<h1>履约已确认</h1><p class="lead">创作者已确认此请求履约完成。</p>`,
      expired: `${status('已过期', 'off')}<h1>履约码已过期</h1><p class="lead">此履约码已超过有效期，无法继续使用。</p>`,
      invalid: `${status('不可访问', 'error')}<h1>结果链接不可用</h1><p class="lead">请检查您打开的链接，或返回服务页面。</p>`,
    }[state] || '';
  return publicPage(
    `<div class="public-intro"><span class="muted">预约结果</span><h1>舞蹈动作指导</h1><p class="muted">创作者 · 林岚</p></div><section class="public-section stack-sm">${content}<div class="actions">${link('s_offering_dance_01', '返回服务')}</div></section><details class="public-section"><summary class="muted">查看其他状态</summary><div class="actions">${stateLinks}</div></details>`,
    true,
  );
}

const authPage = (title, subtitle, form, footer = '') =>
  publicPage(
    `<div class="auth"><h1>${title}</h1><p class="lead">${subtitle}</p>${form}${footer}</div>`,
    true,
  );
views.auth_login = () =>
  authPage(
    '登录',
    '登录创作者工作台',
    `<form class="form" data-form="auth">${field('邮箱', 'email', { type: 'email', required: true })}${field('密码', 'password', { type: 'password', required: true })}<button class="btn primary" type="submit">登录</button>${link('auth_forgot_password', '忘记密码', 'text')}</form>`,
    `<div class="actions">${link('auth_signup', '创建账号', 'text')}</div>`,
  );
views.auth_signup = () =>
  authPage(
    '创建账号',
    '开始管理您的创作者主页',
    `<form class="form" data-form="signup">${field('邮箱', 'email', { type: 'email', required: true })}${field('密码', 'password', { type: 'password', required: true })}${field('确认密码', 'passwordConfirm', { type: 'password', required: true })}<button class="btn primary" type="submit">注册</button></form>`,
    `<div class="actions">${link('auth_login', '已有账号，登录', 'text')}</div>`,
  );
views.auth_forgot_password = () =>
  authPage(
    '找回密码',
    '输入注册邮箱以继续',
    `<form class="form" data-form="auth">${field('邮箱', 'email', { type: 'email', required: true })}<button class="btn primary" type="submit">发送重置链接</button>${link('auth_login', '返回登录', 'text')}</form>`,
  );
views.auth_reset_password = () =>
  authPage(
    '重置密码',
    '为账号设置新密码',
    `<form class="form" data-form="signup">${field('新密码', 'password', { type: 'password', required: true })}${field('确认新密码', 'passwordConfirm', { type: 'password', required: true })}<button class="btn primary" type="submit">保存新密码</button></form>`,
  );
views.onboarding_welcome = () =>
  creator(
    `${heading('开始创建您的主页', '先完善资料，再添加能力和服务')}<section class="surface"><h2>建立创作者资料</h2><p class="lead" style="margin-top:8px">使用您的名称和简介开始，之后可以随时编辑。</p><div class="actions">${link('profile_edit', '完善资料', 'primary', 'arrow_forward')}</div></section>`,
  );

document.body.innerHTML =
  (views[page] || views.home)() +
  '<div id="toast" class="toast hidden" role="status" aria-live="polite"></div>';
let toastTimer;
function toast(message) {
  const node = document.getElementById('toast');
  node.textContent = message;
  node.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.add('hidden'), 3500);
}
document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'copy-url' || action === 'copy-code' || action === 'share-url') {
    const value = action === 'copy-code' ? '482731' : shareUrl;
    try {
      if (action === 'share-url' && navigator.share) {
        await navigator.share({ title: '创作者主页示例', url: value });
        return;
      }
      await navigator.clipboard.writeText(value);
      toast(action === 'share-url' ? '已复制示例链接，可粘贴分享' : '已复制');
    } catch (error) {
      if (error.name !== 'AbortError') toast(`复制失败，请手动选择链接：${value}`);
    }
  }
  if (
    action === 'pause-version' &&
    confirm(
      '暂停当前版本后，系统将回退至可用的默认主页；没有可用默认主页时，公开入口不可访问。确认暂停此版本？',
    )
  ) {
    control.textContent = '发布此版本';
    control.dataset.action = 'publish-version';
    const panel = control.closest('section');
    panel.querySelector('.status').textContent = '已暂停';
    panel.querySelector('.status').className = 'status off';
    panel.querySelector('h2').textContent = '当前无激活主页';
    panel.querySelector('.section-heading p').textContent = '暂无可用默认主页';
    const list = document.getElementById('homepage-versions');
    list.querySelector('.row p').textContent = '已暂停 · 默认';
    list.querySelector('.row .status').textContent = '已暂停';
    list.querySelector('.row .status').className = 'status off';
    toast('此版本已暂停');
  }
  if (action === 'publish-version') {
    control.textContent = '暂停此版本';
    control.dataset.action = 'pause-version';
    const panel = control.closest('section');
    panel.querySelector('.status').textContent = '已发布';
    panel.querySelector('.status').className = 'status';
    panel.querySelector('h2').textContent = '当前激活主页';
    panel.querySelector('.section-heading p').textContent = '林岚';
    const list = document.getElementById('homepage-versions');
    list.querySelector('.row p').textContent = '已发布 · 默认 · 当前激活';
    list.querySelector('.row .status').textContent = '已发布';
    list.querySelector('.row .status').className = 'status';
    toast('此版本已发布');
  }
  if (action === 'confirm-request' || action === 'decline-request') {
    const section = control.closest('section');
    const accepted = action === 'confirm-request';
    const state = accepted ? '已确认' : '已拒绝';
    section.querySelector('.status').textContent = state;
    section.querySelector('.status').className = 'status ' + (accepted ? '' : 'off');
    const last = section.querySelector('.data-grid div:last-child');
    last.querySelector('dt').textContent = accepted ? '履约码' : '请求状态';
    last.querySelector('dd').textContent = accepted ? '482731' : state;
    section.dataset.requestState = accepted ? 'confirmed' : 'declined';
    section.querySelector('.actions').innerHTML = accepted
      ? btn('确认履约', 'fulfill-request', '', 'task_alt')
      : '';
    section.classList.add('hidden');
    document.getElementById('request-empty').classList.remove('hidden');
    toast(`请求${state}`);
  }
  if (action === 'fulfill-request') {
    control.textContent = '已确认履约';
    control.disabled = true;
    const label = control.closest('section').querySelector('.status');
    label.textContent = '已履约';
    toast('已确认履约');
  }
  if (action.startsWith('request-')) {
    const state = action.slice('request-'.length);
    document
      .querySelectorAll('.tabs button')
      .forEach((tab) => tab.classList.toggle('active', tab === control));
    let count = 0;
    document.querySelectorAll('.request-item').forEach((item) => {
      const show = item.dataset.requestState === state;
      item.classList.toggle('hidden', !show);
      if (show) count++;
    });
    document.getElementById('request-empty').classList.toggle('hidden', count > 0);
  }
});
document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const type = form.dataset.form;
  if (type === 'service' && values.getAll('capabilityIds').length === 0) {
    toast('请至少选择一项能力');
    return;
  }
  if (type === 'signup' && values.get('password') !== values.get('passwordConfirm')) {
    toast('两次输入的密码不一致');
    return;
  }
  if (type === 'window' && values.get('startsAt') >= values.get('endsAt')) {
    toast('结束时间应晚于开始时间');
    return;
  }
  if (type === 'lookup') {
    const raw = String(values.get('reference')).trim().toUpperCase();
    if (
      !/^(?:[3479ACDEFHJKMNPQRTVWXY]{18}|[3479ACDEFHJKMNPQRTVWXY]{6}(?:-[3479ACDEFHJKMNPQRTVWXY]{6}){2})$/.test(
        raw,
      )
    ) {
      toast('请输入有效的 18 位 C 号');
      return;
    }
    const reference = raw.replaceAll('-', '');
    if (reference !== 'ACDEFH3479JKMNPQRT') {
      toast('未找到此 C 号对应的主页');
      return;
    }
    location.href = href('r_acdefh_3479jk_mnpqrt');
    return;
  }
  if (type === 'booking') {
    location.href = href('o_pending');
    return;
  }
  if (type === 'auth' || type === 'signup') {
    toast('已提交，请查看后续结果');
    return;
  }
  toast(type === 'window' ? '时间窗口已保存' : '已保存');
});
