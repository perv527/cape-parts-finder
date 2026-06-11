export async function logAction(action: string, tableName?: string, recordId?: string, newValue?: Record<string,unknown>) {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, tableName, recordId, newValue }),
    });
  } catch(err) {
    console.error('Audit log error:', err);
  }
}
