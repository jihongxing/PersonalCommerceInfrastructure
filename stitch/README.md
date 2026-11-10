# 前端设计原型

`web` 和 `mobile` 的 `code.html` 是同一套响应式设计在不同终端的入口。直接在浏览器打开对应文件即可；从[工作台](./mobile/dashboard/code.html)或[C 号查询](./mobile/home/code.html)开始浏览。

原型使用示例数据和本地交互，不连接 `apps/web-v2` 的接口，也不会保存真实数据。申请、确认、履约等操作只用于展示界面状态。账号操作同样不会发送邮件或创建账号。

工作台和主页管理中的分享链接、C 号及二维码均为示例，二维码编码的是示例地址，不是实际可用的创作者主页。复制、下载及系统分享用于演示静态原型交互；正式页面需要使用真实的稳定地址生成二维码。

## 页面对应

| 原型目录                                                                                               | web-v2 路由                                                           |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `home`                                                                                                 | `/`                                                                   |
| `auth_login`、`auth_signup`                                                                            | `/auth/login`、`/auth/signup`                                         |
| `auth_forgot_password`、`auth_reset_password`                                                          | `/auth/forgot-password`、`/auth/reset-password`                       |
| `onboarding_welcome`                                                                                   | `/onboarding/welcome`                                                 |
| `dashboard`                                                                                            | `/dashboard`                                                          |
| `profile`、`profile_edit`、`profile_tab_public`                                                        | `/profile`、`/profile/edit`、`/profile?tab=public`                    |
| `capabilities`、`capabilities_action_create`、`capability_edit`                                        | `/capabilities`、`/capabilities/new`、`/capabilities/[id]/edit`       |
| `services`、`services_action_create_source_capability_cap_bio_00308`、`service_detail`、`service_edit` | `/services`、`/services/new`、`/services/[id]`、`/services/[id]/edit` |
| `requests`                                                                                             | `/requests`                                                           |
| `r_acdefh_3479jk_mnpqrt`、`s_offering_dance_01`                                                        | `/r/[commerceRef]`、`/s/[offeringId]`                                 |
| `o_pending`、`o_token`                                                                                 | `/o/[token]` 的不同状态；结果页可切换查看其他状态                     |

`/onboarding` 和 `/public/[offeringId]` 是跳转流程，不另设主要页面。原有 `screen.png` 为修改前的 Stitch 截图，不能代表当前 HTML。`shared/app.js` 和 `shared/styles.css` 为两端共享的原型内容与样式；`shared/build-pages.cjs` 生成各页面的静态入口。

通用状态可以通过页面地址中的 `view` 参数查看：[加载](./mobile/dashboard/code.html?view=loading)、[空状态](./mobile/requests/code.html?view=empty)、[加载失败](./mobile/services/code.html?view=error)、[会话失效](./mobile/dashboard/code.html?view=session)和[公开页面不可访问](./mobile/r_acdefh_3479jk_mnpqrt/code.html?view=unavailable)。订单结果页面另外提供已提交、已确认、已拒绝、已履约、已过期和链接无效的状态入口。
