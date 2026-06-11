import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
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
