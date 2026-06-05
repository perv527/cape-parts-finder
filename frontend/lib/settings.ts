import { useEffect, useState } from "react";
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
      cached = { ...DEFAULTS, ...data } as AppSettings;
      return cached as AppSettings;
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
