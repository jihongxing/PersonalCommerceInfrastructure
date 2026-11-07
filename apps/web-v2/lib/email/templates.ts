/**
 * 邮件模板
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * 生成密码重置邮件模板
 */
export function generatePasswordResetEmailTemplate(
  email: string,
  resetLink: string,
  name?: string
): EmailTemplate {
  const displayName = name || email.split('@')[0];

  return {
    subject: 'Personal Commerce - 重置您的密码',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #0f172a, #1e293b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
    .warning { background: #fef08a; padding: 10px; border-left: 4px solid #f59e0b; margin: 20px 0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Personal Commerce</h1>
      <p>商业身份管理平台</p>
    </div>

    <div class="content">
      <p>您好 ${displayName},</p>

      <p>我们收到了您的密码重置请求。如果这不是您本人操作，请忽略此邮件。</p>

      <p>点击下面的按钮重置您的密码：</p>

      <center>
        <a href="${resetLink}" class="button">重置密码</a>
      </center>

      <p>或复制以下链接到浏览器：</p>
      <p style="word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 4px; font-size: 13px;">
        ${resetLink}
      </p>

      <div class="warning">
        <strong>⏰ 重要提示：</strong> 此链接有效期为 1 小时。如果您没有在此时间内重置密码，请重新请求。
      </div>

      <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
        此邮件由 Personal Commerce 自动发送。请勿直接回复此邮件。
      </p>
    </div>

    <div class="footer">
      <p>&copy; 2025 Personal Commerce. 保护您的商业身份。</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Personal Commerce - 重置您的密码

您好 ${displayName},

我们收到了您的密码重置请求。如果这不是您本人操作，请忽略此邮件。

重置密码链接：
${resetLink}

重要提示：此链接有效期为 1 小时。如果您没有在此时间内重置密码，请重新请求。

如有问题，请访问 Personal Commerce 支持。

此邮件由 Personal Commerce 自动发送。请勿直接回复此邮件。
© 2025 Personal Commerce. 保护您的商业身份。
    `,
  };
}

/**
 * 生成欢迎邮件模板
 */
export function generateWelcomeEmailTemplate(
  email: string,
  name?: string
): EmailTemplate {
  const displayName = name || email.split('@')[0];

  return {
    subject: 'Personal Commerce - 欢迎加入！',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #0f172a, #1e293b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .feature { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Personal Commerce</h1>
      <p>欢迎加入商业身份管理平台</p>
    </div>

    <div class="content">
      <p>您好 ${displayName},</p>

      <p>欢迎加入 Personal Commerce！我们很高兴有您成为我们的社区成员。</p>

      <p><strong>您现在可以：</strong></p>

      <div class="feature">✨ 创建您的专业商业身份</div>
      <div class="feature">📝 管理您的服务和能力</div>
      <div class="feature">💼 接收客户预约和订单</div>
      <div class="feature">🔐 完全控制您的商业身份（永不失效）</div>

      <center>
        <a href="https://www.example.com/creator/onboarding" class="button">开始使用</a>
      </center>

      <p>如有任何问题，请随时联系我们的支持团队。</p>

      <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
        此邮件由 Personal Commerce 自动发送。请勿直接回复此邮件。
      </p>
    </div>

    <div class="footer">
      <p>&copy; 2025 Personal Commerce. 保护您的商业身份。</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Personal Commerce - 欢迎加入！

您好 ${displayName},

欢迎加入 Personal Commerce！我们很高兴有您成为我们的社区成员。

您现在可以：
✨ 创建您的专业商业身份
📝 管理您的服务和能力
💼 接收客户预约和订单
🔐 完全控制您的商业身份（永不失效）

开始使用：
https://www.example.com/creator/onboarding

如有任何问题，请随时联系我们的支持团队。

此邮件由 Personal Commerce 自动发送。请勿直接回复此邮件。
© 2025 Personal Commerce. 保护您的商业身份。
    `,
  };
}

/**
 * 生成确认邮件模板
 */
export function generateConfirmationEmailTemplate(
  email: string,
  action: string,
  details?: Record<string, string>
): EmailTemplate {
  return {
    subject: `Personal Commerce - ${action} 确认`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ ${action} 成功</h1>
    </div>

    <div class="content">
      <p>您的 ${action} 已成功完成。</p>

      ${
        details
          ? `
        <p><strong>详情：</strong></p>
        <ul>
          ${Object.entries(details)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('')}
        </ul>
      `
          : ''
      }

      <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
        此邮件由 Personal Commerce 自动发送。
      </p>
    </div>

    <div class="footer">
      <p>&copy; 2025 Personal Commerce.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Personal Commerce - ${action} 确认

您的 ${action} 已成功完成。

${
  details
    ? Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    : ''
}

此邮件由 Personal Commerce 自动发送。
© 2025 Personal Commerce.
    `,
  };
}
