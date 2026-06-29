import { NextRequest, NextResponse } from "next/server";


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
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; color: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Cape Parts Finder</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Your Trusted Auto Parts Network</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${customerName}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">We received your request for a <strong style="color: #f97316;">${partNeeded}</strong>${vehicle ? ` for your ${vehicle}` : ""}. We are now searching our supplier network.</p>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">What happens next</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">We will contact you on <strong style="color: white;">${phone}</strong> via WhatsApp within 2-4 hours with a quote.</p>
            </div>
            <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #4ade80; font-size: 13px;">Track your request anytime at <a href="https://www.capepartsfinder.co.za/track" style="color: #f97316;">capepartsfinder.co.za/track</a></p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">Questions? WhatsApp us at <a href="https://wa.me/27696863952" style="color: #f97316;">+27 69 686 3952</a></p>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Cape Parts Finder · Cape Town · <a href="https://www.capepartsfinder.co.za" style="color: #6b7280;">capepartsfinder.co.za</a></p>
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

    } else if (type === "quote_ready") {
      subject = `Your quote is ready — ${partNeeded} | Cape Parts Finder`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; color: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Cape Parts Finder</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Your Trusted Auto Parts Network</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Great news, ${customerName}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">We found your <strong style="color: #f97316;">${partNeeded}</strong>${vehicle ? " for your " + vehicle : ""}. We will be sending you the price and details via WhatsApp shortly.</p>
            <div style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #fb923c; font-size: 13px; font-weight: bold;">What to expect</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Check your WhatsApp on <strong style="color: white;">${phone}</strong> for the quote details. Reply to accept or ask any questions.</p>
            </div>
            <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #4ade80; font-size: 13px;">Track your request at <a href="https://www.capepartsfinder.co.za/track" style="color: #f97316;">capepartsfinder.co.za/track</a></p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Questions? WhatsApp us at <a href="https://wa.me/27696863952" style="color: #f97316;">+27 69 686 3952</a></p>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Cape Parts Finder · Cape Town · <a href="https://www.capepartsfinder.co.za" style="color: #6b7280;">capepartsfinder.co.za</a></p>
          </div>
        </div>
      `;
    } else if (type === "delivered") {
      subject = `Your ${partNeeded} has been delivered — Cape Parts Finder`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; color: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Cape Parts Finder</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Delivery Complete</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Your part has arrived, ${customerName}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">Your <strong style="color: #4ade80;">${partNeeded}</strong>${vehicle ? " for your " + vehicle : ""} has been successfully delivered. We hope everything is perfect!</p>
            <div style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 12px; color: #4ade80; font-size: 15px; font-weight: bold;">Happy with your part?</p>
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 13px;">Leave us a quick review — it helps other Cape Town drivers find us!</p>
              <a href="https://www.capepartsfinder.co.za/review" style="display: inline-block; background: #f97316; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Leave a Review →</a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Need another part? Visit <a href="https://www.capepartsfinder.co.za" style="color: #f97316;">capepartsfinder.co.za</a></p>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Cape Parts Finder · Cape Town · <a href="https://www.capepartsfinder.co.za" style="color: #6b7280;">capepartsfinder.co.za</a></p>
          </div>
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
      console.error('Resend error:', err);

      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
