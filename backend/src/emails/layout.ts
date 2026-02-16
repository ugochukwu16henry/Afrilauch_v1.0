/** Shared HTML wrapper for all email templates */
export function emailLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${preheader ? `<meta name="description" content="${preheader.replace(/"/g, '&quot;')}">` : ''}
  <title>RiseFlow Hub</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f7f9fb;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <div style="background:#0FA958;color:#fff;padding:24px;text-align:center;">
      <strong style="font-size:20px;">RiseFlow Hub</strong>
    </div>
    <div style="padding:32px 24px;color:#1e1e1e;line-height:1.6;">
      ${content}
    </div>
    <div style="padding:16px 24px;background:#f7f9fb;font-size:12px;color:#6b7280;text-align:center;">
      RiseFlow Hub — Build. Grow. Launch.<br>Helping ideas become real businesses.
      <br>© ${new Date().getFullYear()} RiseFlow Hub.
    </div>
  </div>
</body>
</html>`;
}
