import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'safri38@outlook.com',
    subject: '🔧 New Parts Request on Cape Parts Finder',
    html: `
      <h2>New Parts Request</h2>
      <p><strong>Name:</strong> ${body.customer_name}</p>
      <p><strong>Phone:</strong> ${body.phone_number}</p>
      <p><strong>Vehicle:</strong> ${body.vehicle_make} ${body.vehicle_model} ${body.vehicle_year}</p>
      <p><strong>Part Needed:</strong> ${body.part_needed}</p>
      <p><strong>Area:</strong> ${body.area}</p>
    `,
  });

  return NextResponse.json({ success: true });
}