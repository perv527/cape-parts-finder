"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        fetchRequests();
        setAuthChecked(true);
      }
    });
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("parts_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRequests(data || []);
    }
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("parts_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update status");
    } else {
      fetchRequests();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filteredRequests = requests.filter((request) =>
    `${request.customer_name} ${request.vehicle_make} ${request.vehicle_model} ${request.part_needed}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="