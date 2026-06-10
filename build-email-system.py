import os

# 1. Create email API route using Resend
os.makedirs("frontend/app/api/send-email", exist_ok=True)

route = '''import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, to, customerName, partNeeded, vehicle, phone, requestId } = await req.json();

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    let subject = "";
    let html = "";

    if (type === "customer_confirmation") {
      subject = `We received your request for ${partNeeded} — Cape Parts Finder`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: white; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Cape Parts Finder</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Your Trusted Auto Parts Network</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: white; margin-top: 0;">Hi ${customerName}!</h2>
            <p style="color: #9ca3af; line-height: 1.6;">We received your request for a <strong style="color: #f97316;">${partNeeded}</strong>${vehicle ? ` for your ${vehicle}` : ""}. We are now searching our supplier network.</p>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">What happens next</p>
              <p style="margin: 0; color: #d1d5db; font-size: 14px;">We will contact you on <strong style="color: white;">${phone}</strong> via WhatsApp within 2-4 hours with a quote.</p>
            </div>
            <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #4ade80; font-size: 13px;">Track your request anytime at <a href="https://www.capepartsfinder.co.za/track" style="color: #f97316;">capepartsfinder.co.za/track</a></p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">Questions? WhatsApp us at <a href="https://wa.me/27696863952" style="color: #f97316;">+27 69 686 3952</a></p>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="margin: 0; color: #374151; font-size: 12px;">Cape Parts Finder · Cape Town · <a href="https://www.capepartsfinder.co.za" style="color: #6b7280;">capepartsfinder.co.za</a></p>
          </div>
        </div>
      `;
    } else if (type === "admin_notification") {
      subject = `New Request: ${partNeeded} — ${customerName}`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #f97316;">New Part Request!</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Part Needed</td><td style="padding: 8px 0; color: #f97316; font-weight: bold;">${partNeeded}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Vehicle</td><td style="padding: 8px 0;">${vehicle || "Not specified"}</td></tr>
          </table>
          <a href="https://www.capepartsfinder.co.za/quotes/${requestId}" style="display: inline-block; margin-top: 16px; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Request →</a>
        </div>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Cape Parts Finder <hello@capepartsfinder.co.za>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
'''
open("frontend/app/api/send-email/route.ts", "w", encoding="utf-8").write(route)
print("Created email API route!")

# 2. Add email sending to customer form submission
path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

old_success = '      setSuccess(true);'
new_success = '''      setSuccess(true);

      // Send confirmation email to customer
      if (sanitized.email) {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "customer_confirmation",
            to: sanitized.email,
            customerName: sanitized.customer_name,
            partNeeded: sanitized.part_needed,
            vehicle: sanitized.vehicle_year + " " + sanitized.vehicle_make + " " + sanitized.vehicle_model,
            phone: sanitized.phone_number,
            requestId: data?.[0]?.id,
          }),
        }).catch(() => {});
      }'''

c = c.replace(old_success, new_success, 1)
open(path, "w", encoding="utf-8").write(c)
print("Added customer confirmation email!")
print("Done!")
