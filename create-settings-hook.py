import os

# 1. Create a shared settings hook
hook = '''import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type AppSettings = {
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  email: string;
  website: string;
  address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_account_type: string;
  vat_number: string;
  tagline: string;
};

const DEFAULTS: AppSettings = {
  business_name: "Cape Parts Finder",
  owner_name: "",
  whatsapp_number: "27696863952",
  email: "",
  website: "cape-parts-finder.vercel.app",
  address: "",
  bank_name: "First National Bank (FNB)",
  bank_account_name: "Cape Parts Finder",
  bank_account_number: "62863344596",
  bank_account_type: "Savings Account",
  vat_number: "",
  tagline: "Your Trusted Auto Parts Network · Cape Town",
};

let cached: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {
  if (cached) return cached;
  try {
    const { data } = await supabase.from("settings").select("*").limit(1).single();
    if (data) {
      cached = { ...DEFAULTS, ...data };
      return cached;
    }
  } catch {}
  return DEFAULTS;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);
  return settings;
}
'''

os.makedirs("frontend/lib", exist_ok=True)
open("frontend/lib/settings.ts", "w", encoding="utf-8").write(hook)
print("Created frontend/lib/settings.ts")

# 2. Update page.tsx (customer landing) - replace hardcoded number
path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

old_import = 'import { useState, useEffect } from "react";'
new_import = '''import { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings";'''
c = c.replace(old_import, new_import, 1)

old_state = '  const [loading, setLoading] = useState(false);'
new_state = '''  const settings = useSettings();
  const [loading, setLoading] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# Replace hardcoded number in WhatsApp button
c = c.replace('"https://wa.me/27696863952?text=Hi%20Cape%20Parts%20Finder%2C%20I%20need%20help%20finding%20a%20part"',
              '{"https://wa.me/" + settings.whatsapp_number + "?text=Hi%20Cape%20Parts%20Finder%2C%20I%20need%20help%20finding%20a%20part"}')

open(path, "w", encoding="utf-8").write(c)
print("Updated page.tsx:", "useSettings" in c)

# 3. Update admin page
path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

old_import = 'import { useRouter } from "next/navigation";'
new_import = '''import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings";'''
c = c.replace(old_import, new_import, 1)

# Add settings to component
old_router = '  const router = useRouter();'
new_router = '''  const router = useRouter();
  const settings = useSettings();'''
c = c.replace(old_router, new_router, 1)

# Replace hardcoded number in daily report
c = c.replace('    const phone = "27696863952";', '    const phone = settings.whatsapp_number;')

open(path, "w", encoding="utf-8").write(c)
print("Updated admin page:", "useSettings" in c)

# 4. Update track page
path = "frontend/app/track/page.tsx"
c = open(path, encoding="utf-8").read()

old_import = 'import { useRouter } from "next/navigation";'
new_import = '''import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings";'''
c = c.replace(old_import, new_import, 1)

old_router = '  const router = useRouter();'
new_router = '''  const router = useRouter();
  const settings = useSettings();'''
c = c.replace(old_router, new_router, 1)

c = c.replace('"https://wa.me/27696863952', '{"https://wa.me/" + settings.whatsapp_number + "')
c = c.replace('"https://wa.me/+27696863952', '{"https://wa.me/" + settings.whatsapp_number + "')

open(path, "w", encoding="utf-8").write(c)
print("Updated track page:", "useSettings" in c)

print("\nAll done! Settings are now dynamic.")
print("Change your number in /settings and it updates everywhere.")
