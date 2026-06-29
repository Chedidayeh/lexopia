import "server-only";

import { prisma } from "@/src/lib/prisma";
import { sendMail } from "./mailer";

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendParentEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    await sendMail(params);
    return { success: true as const };
  } catch (error) {
    console.error("[parent-generation-notifications] Failed to send email:", error);
    return { success: false as const };
  }
}

export async function sendParentReadingPlanGeneratedEmail(readingPlanId: string) {
  const plan = await prisma.readingPlan.findUnique({
    where: { id: readingPlanId },
    select: {
      planNumber: true,
      child: {
        select: {
          name: true,
          parent: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const parentEmail = plan?.child.parent.email;
  if (!plan || !parentEmail) {
    return { success: false as const, reason: "missing-parent-email" };
  }

  const childName = plan.child.name;
  const appUrl = getAppUrl();
  const subject = `Reading plan generated for ${childName}`;
  const text = [
    `Hi${plan.child.parent.name ? ` ${plan.child.parent.name}` : ""},`,
    "",
    `A new reading plan has been generated for ${childName}.`,
    `Plan version: ${plan.planNumber}`,
    `Open the app: ${appUrl}`,
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

<img src="${escapeHtml(appUrl)}/logo.png" alt="Lexopia" style="height:50px;width:auto;margin-bottom:15px;" />

<div style="font-size:44px;">📚✨</div>

<h1 style="margin:15px 0 8px;font-size:28px;">
Your Child's Reading Plan is Ready!
</h1>

<p style="margin:0;font-size:16px;opacity:.9;">
A personalized learning journey has just been created.
</p>

</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="font-size:17px;">
Hello${
  plan.child.parent.name
    ? ` <strong>${escapeHtml(plan.child.parent.name)}</strong>`
    : ""
},
</p>

<p style="font-size:16px;color:#4B5563;line-height:1.7;">
We're excited to let you know that a brand-new personalized reading plan has been generated for
<strong>${escapeHtml(childName)}</strong>.
This plan has been carefully designed to support your child's reading development through engaging stories and interactive activities.
</p>

<table width="100%" cellspacing="0" cellpadding="0"
style="margin:30px 0;background:#EEF4FF;border:1px solid #BFDBFE;border-radius:12px;">

<tr>
<td style="padding:22px;">

<p style="margin:0;color:#6B7280;font-size:13px;">
Reading Plan
</p>

<h2 style="margin:8px 0;color:#1E40AF;">
Version ${plan.planNumber}
</h2>

</td>
</tr>

</table>

<div style="text-align:center;margin:35px 0;">

<a
href="${escapeHtml(appUrl)}"
style="
background:#2563EB;
color:white;
padding:15px 34px;
border-radius:999px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

🚀 Open Lexopia

</a>

</div>

<p style="font-size:15px;color:#6B7280;line-height:1.7;">
Every reading plan is uniquely adapted to your child's progress, helping them build confidence while making learning fun.
</p>

</td>
</tr>

<tr>
<td style="padding:24px;background:#F9FAFB;text-align:center;font-size:13px;color:#9CA3AF;">

You're receiving this email because new learning content has been generated for your child.

<br><br>

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

  return sendParentEmail({
    to: parentEmail,
    subject,
    text,
    html,
  });
}

export async function sendParentStoryGeneratedEmail(storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      title: true,
      episodeTitle: true,
      episodeNumber: true,
      world: {
        select: {
          roadmap: {
            select: {
              child: {
                select: {
                  name: true,
                  parent: {
                    select: {
                      email: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const parentEmail = story?.world.roadmap.child.parent.email;
  if (!story || !parentEmail) {
    return { success: false as const, reason: "missing-parent-email" };
  }

  const childName = story.world.roadmap.child.name;
  const storyLabel = story.episodeTitle ?? story.title;
  const episodeLabel = story.episodeNumber ? `Episode ${story.episodeNumber}` : "A new story";
  const appUrl = getAppUrl();
  const subject = `Story generated for ${childName}`;
  const text = [
    `Hi${story.world.roadmap.child.parent.name ? ` ${story.world.roadmap.child.parent.name}` : ""},`,
    "",
    `A new story is ready for ${childName}.`,
    `${episodeLabel}: ${storyLabel}`,
    `Open the app: ${appUrl}`,
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
style="padding:40px;background:linear-gradient(135deg,#9333EA,#2563EB);color:white;">

<img src="${escapeHtml(appUrl)}/logo.png" alt="Lexopia" style="height:50px;width:auto;margin-bottom:15px;" />

<div style="font-size:48px;">🌟📖</div>

<h1 style="margin:15px 0 8px;font-size:28px;">
A New Adventure Awaits!
</h1>

<p style="margin:0;font-size:16px;opacity:.9;">
A personalized story has just been created for your child.
</p>

</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="font-size:17px;">
Hello${
  story.world.roadmap.child.parent.name
    ? ` <strong>${escapeHtml(
        story.world.roadmap.child.parent.name
      )}</strong>`
    : ""
},
</p>

<p style="font-size:16px;color:#4B5563;line-height:1.7;">
Wonderful news! A brand-new story has been generated especially for
<strong>${escapeHtml(childName)}</strong>.
It's time for another exciting adventure filled with imagination, learning, and discovery.
</p>

<table width="100%" cellspacing="0" cellpadding="0"
style="margin:30px 0;background:#EEF4FF;border:1px solid #BFDBFE;border-radius:12px;">

<tr>
<td style="padding:22px;">

<p style="margin:0;color:#6B7280;font-size:13px;">
${escapeHtml(episodeLabel)}
</p>

<h2 style="margin:8px 0;color:#1E40AF;">
${escapeHtml(storyLabel)}
</h2>

</td>
</tr>

</table>

<div style="text-align:center;margin:35px 0;">

<a
href="${escapeHtml(appUrl)}"
style="
background:#2563EB;
color:white;
padding:15px 34px;
border-radius:999px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

📖 Read Story in Lexopia

</a>

</div>

<p style="font-size:15px;color:#6B7280;line-height:1.7;">
Each story is uniquely personalized to improve reading skills, vocabulary, and comprehension while making every session feel like a magical adventure.
</p>

</td>
</tr>

<tr>
<td style="padding:24px;background:#F9FAFB;text-align:center;font-size:13px;color:#9CA3AF;">

Thank you for supporting your child's reading journey with Lexopia.

<br><br>

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

  return sendParentEmail({
    to: parentEmail,
    subject,
    text,
    html,
  });
}

export async function sendParentReadingReminderEmail(childId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      name: true,
      parent: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  const parentEmail = child?.parent.email;
  if (!child || !parentEmail) {
    return { success: false as const, reason: "missing-parent-email" };
  }

  const childName = child.name;
  const appUrl = getAppUrl();
  const subject = `Time for ${childName} to read!`;
  const text = [
    `Hi${child.parent.name ? ` ${child.parent.name}` : ""},`,
    "",
    `It's time for ${childName} to continue their reading journey!`,
    `Regular reading helps build confidence and improves skills.`,
    `Open the app: ${appUrl}`,
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
style="padding:40px;background:linear-gradient(135deg,#F59E0B,#D97706);color:white;">

<img src="${escapeHtml(appUrl)}/logo.png" alt="Lexopia" style="height:50px;width:auto;margin-bottom:15px;" />

<div style="font-size:44px;">📚✨</div>

<h1 style="margin:15px 0 8px;font-size:28px;">
Time to Read!
</h1>

<p style="margin:0;font-size:16px;opacity:.9;">
A quick reminder to keep the reading journey going.
</p>

</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="font-size:17px;">
Hello${
  child.parent.name
    ? ` <strong>${escapeHtml(child.parent.name)}</strong>`
    : ""
},
</p>

<p style="font-size:16px;color:#4B5563;line-height:1.7;">
It's time for <strong>${escapeHtml(childName)}</strong> to continue their reading adventure!
Regular reading practice helps build confidence, improves vocabulary, and makes learning fun.
</p>

<div style="text-align:center;margin:35px 0;">

<a
href="${escapeHtml(appUrl)}"
style="
background:#F59E0B;
color:white;
padding:15px 34px;
border-radius:999px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

🚀 Open Lexopia

</a>

</div>

<p style="font-size:15px;color:#6B7280;line-height:1.7;">
Every reading session brings your child one step closer to becoming a confident reader. Keep up the great work!
</p>

</td>
</tr>

<tr>
<td style="padding:24px;background:#F9FAFB;text-align:center;font-size:13px;color:#9CA3AF;">

You're receiving this email to help keep your child's reading journey on track.

<br><br>

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

  return sendParentEmail({
    to: parentEmail,
    subject,
    text,
    html,
  });
}