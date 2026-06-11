import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await req.json();
    if (!body.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    await supabase.from('audit_log').insert({
      action: body.action,
      table_name: body.tableName ?? null,
      record_id: body.recordId ?? null,
      old_value: body.oldValue ?? null,
      new_value: body.newValue ?? null,
    });
    return NextResponse.json({ success: true });
  } catch(err) {
    console.error('Audit error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}