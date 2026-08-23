import nodemailer from 'nodemailer';

const MAX_RETRIES = 3;

const transporter = () => {
  if (process.env.MAIL_ENABLED !== 'true') return null;
  if (!process.env.MAIL_HOST || !process.env.MAIL_USERNAME) return null;

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: (process.env.MAIL_PASSWORD || '').replace(/^"|"$/g, ''),
    },
  });
};

const wrapLayout = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#5b4dff;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">SocietyHub</h1>
              <p style="margin:6px 0 0;color:#e0e7ff;font-size:13px;">Society maintenance, made clearer.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">
              This is an automated message from SocietyHub. Please do not reply to this email.<br/>
              © ${new Date().getFullYear()} SocietyHub
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const badge = (label: string, color: string) =>
  `<span style="display:inline-block;background:${color};color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;">${label}</span>`;

export const complaintEmailHtml = (opts: {
  heading: string;
  intro: string;
  complaintNumber: string;
  status?: string;
  category?: string;
  when?: string;
}) =>
  wrapLayout(opts.heading, `
    <h2 style="margin:0 0 12px;font-size:20px;">${opts.heading}</h2>
    <p style="margin:0 0 16px;line-height:1.6;">${opts.intro}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;background:#f8fafc;border-radius:12px;padding:16px;">
      <tr><td style="padding:6px 0;color:#64748b;">Reference</td><td style="padding:6px 0;font-weight:700;">${opts.complaintNumber}</td></tr>
      ${opts.category ? `<tr><td style="padding:6px 0;color:#64748b;">Category</td><td style="padding:6px 0;">${opts.category}</td></tr>` : ''}
      ${opts.status ? `<tr><td style="padding:6px 0;color:#64748b;">Status</td><td style="padding:6px 0;">${badge(opts.status.replace('_', ' '), opts.status === 'RESOLVED' ? '#16a34a' : opts.status === 'IN_PROGRESS' ? '#d97706' : '#2563eb')}</td></tr>` : ''}
      ${opts.when ? `<tr><td style="padding:6px 0;color:#64748b;">Date & time</td><td style="padding:6px 0;">${opts.when}</td></tr>` : ''}
    </table>
  `);

export const noticeEmailHtml = (opts: { title: string; content: string; important?: boolean; when?: string }) =>
  wrapLayout(opts.title, `
    <h2 style="margin:0 0 8px;">${opts.important ? 'Important notice' : 'New notice'}</h2>
    ${opts.important ? badge('IMPORTANT', '#dc2626') : ''}
    <h3 style="margin:16px 0 8px;">${opts.title}</h3>
    <p style="white-space:pre-wrap;line-height:1.6;">${opts.content}</p>
    ${opts.when ? `<p style="color:#64748b;font-size:13px;">Published ${opts.when}</p>` : ''}
  `);

export const welcomeEmailHtml = (name: string) =>
  wrapLayout('Welcome to SocietyHub', `
    <h2 style="margin:0 0 12px;">Welcome, ${name}</h2>
    <p style="line-height:1.6;">Your resident account is ready. You can now raise maintenance complaints, track progress, and stay updated through the notice board.</p>
  `);

export const sendEmailNotification = async (to: string, subject: string, html: string, text?: string) => {
  const mail = transporter();
  const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || 'noreply@societyhub.com';
  const payload = { from, to, subject, html, text: text || subject };

  if (!mail) {
    console.warn('[EMAIL] SMTP disabled or not configured. Message not sent.');
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mail.sendMail(payload);
      console.log(`Email sent to ${to}: ${subject}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Email attempt ${attempt} failed for ${to}:`, error);
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  console.error('Email permanently failed:', lastError);
};

export const notifyQuietly = (...args: Parameters<typeof sendEmailNotification>) => {
  sendEmailNotification(...args).catch((err) => console.error('Email task failed:', err));
};
