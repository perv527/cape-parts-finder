import { createClient } from "@/utils/supabase/server";

export async function logAction({action,tableName,recordId,oldValue,newValue,}:{action:string;tableName?:string;recordId?:string;oldValue?:Record<string,unknown>;newValue?:Record<string,unknown>;}) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_log").insert({action,table_name:tableName,record_id:recordId,old_value:oldValue??null,new_value:newValue??null});
  } catch(err){console.error("Audit log error:",err)}
}
