import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#EEF3F9;padding:32px 16px}
.wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
.hd{background:#042C53;padding:24px 32px}
.logo{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px}
.logo-accent{color:#4DA6FF}
.bd{padding:36px 32px}
h2{color:#042C53;font-size:22px;font-weight:800;margin-bottom:10px;line-height:1.3}
p{color:#4B5563;font-size:14px;line-height:1.7;margin-bottom:12px}
.info{background:#F4F7FB;border-radius:10px;padding:16px;margin:16px 0}
.row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E5E7EB}
.row:last-child{border-bottom:none}
.lbl{color:#6B7280;font-size:13px}
.val{color:#042C53;font-size:13px;font-weight:700;text-align:right;max-width:60%}
.btn{display:inline-block;margin-top:20px;background:#185FA5;color:#fff!important;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:.2px}
.ft{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:18px 32px}
.ft p{color:#9CA3AF;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="hd"><div class="logo">Spons<span class="logo-accent">orum</span></div></div>
  <div class="bd">${body}</div>
  <div class="ft">
    <p>Bu e-posta Sponsorum platformu tarafından otomatik olarak gönderilmiştir.<br>
    Sorularınız için <a href="mailto:destek@sponsorum.com" style="color:#185FA5">destek@sponsorum.com</a> adresine yazabilirsiniz.</p>
  </div>
</div>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: "Sponsorum <onboarding@resend.dev>",
    to,
    subject,
    html: layout(html),
  });
  if (error) throw new Error(error.message);
}
