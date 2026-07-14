import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export async function sendOtpEmail(to: string, otp: string){
    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"NoteAI" <no-reply@yourapp.com>`,
        to,
        subject: `${otp} is your verfication code`,
        html: otpEmailTemplate(otp)
    })
}

function otpEmailTemplate(otp: string) {
  const digits = otp.split("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#09090B; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090B; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:440px; background-color:#141416; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden;">
          
          <tr>
            <td style="padding:32px 32px 0 32px; text-align:center;">
              <div style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; background:linear-gradient(135deg,#22c55e,#16a34a); border-radius:10px; margin-bottom:20px;">
                <span style="color:#000; font-weight:800; font-size:18px; line-height:40px;">✓</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px; text-align:center;">
              <h1 style="color:#ffffff; font-size:20px; font-weight:700; margin:0 0 8px 0;">Verify your email</h1>
              <p style="color:rgba(255,255,255,0.5); font-size:14px; line-height:20px; margin:0 0 28px 0;">
                Enter this code to finish setting up your account.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${digits.map(d => `
                  <td style="width:16.5%; padding:0 4px;">
                    <div style="background-color:#1D1F21; border:1px solid rgba(255,255,255,0.1); border-radius:8px; text-align:center; padding:14px 0; color:#22c55e; font-size:22px; font-weight:700; font-family:monospace;">
                      ${d}
                    </div>
                  </td>`).join("")}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0 32px; text-align:center;">
              <p style="color:rgba(255,255,255,0.35); font-size:12px; margin:0;">
                This code expires in 10 minutes.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px 32px;">
              <div style="border-top:1px solid rgba(255,255,255,0.07); padding-top:20px; text-align:center;">
                <p style="color:rgba(255,255,255,0.3); font-size:12px; margin:0;">
                  Didn't request this? You can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

        </table>

        <p style="color:rgba(255,255,255,0.2); font-size:11px; margin:20px 0 0 0;">
          © ${new Date().getFullYear()} Trello Clone
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}