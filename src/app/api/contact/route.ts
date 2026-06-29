import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/src/lib/notifications/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const subject = `New Contact Form Message from ${email}`;
    const text = [
      `From: ${email}`,
      "",
      `Message:`,
      message,
    ].join("\n");

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table width="620" cellspacing="0" cellpadding="0"
style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">

<tr>
<td align="center"
style="padding:40px;background:linear-gradient(135deg,#2563EB,#4F46E5);color:white;">

<h1 style="margin:15px 0 8px;font-size:28px;">
New Contact Message
</h1>

<p style="margin:0;font-size:16px;opacity:.9;">
Someone has reached out through the contact form.
</p>

</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="font-size:16px;color:#4B5563;line-height:1.7;">
<strong>From:</strong> ${email}
</p>

<div style="margin:20px 0;padding:20px;background:#F3F4F6;border-radius:8px;">
<p style="font-size:16px;color:#1F2937;line-height:1.7;white-space:pre-wrap;">
${message}
</p>
</div>

</td>
</tr>

<tr>
<td style="padding:24px;background:#F9FAFB;text-align:center;font-size:13px;color:#9CA3AF;">

© ${new Date().getFullYear()} Lexopia

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    await sendMail({
      to: "lexopiaapp@gmail.com",
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact API] Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
