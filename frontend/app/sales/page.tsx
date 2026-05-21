"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      fetchSales();
      setAuthChecked(true);
    });
  }, []);

  async function fetchSales() {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setSales(data || []);
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.selling_price || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalSales = sales.length;
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0;

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-black text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Cape Parts Finder - Sales</h1>
          <p className="text-xs text-gray-400">Revenue and profit tracking</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push("/admin")} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm">Admin</button>
          <button onClick={() => router.push("/suppliers")} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm">Suppliers</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-green-600">R{totalRevenue.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-1">Total Revenue</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-blue-600">R{totalProfit.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-1">Total Profit</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-purple-600">{totalSales}</p>
            <p className="text-gray-500 text-sm mt-1">Total Sales</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-orange-600">R{avgProfit.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-1">Avg Profit Per Sale</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Sales History</h2>

        <div className="space-y-4">
          {sales.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              No sales recorded yet. Convert quotes to sales to see them here.
            </div>
          )}

          {sales.map((sale) => (
            <div key={sale.id} className="bg-white p-6 rounded-2xl shadow border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{sale.customer_name}</h3>
                  <p className="text-gray-400 text-xs mb-3">{new Date(sale.created_at).toLocaleString("en-ZA")}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-gray-500 text-xs">Supplier Cost</p>
                      <p className="font-bold text-red-600">R{Number(sale.supplier_price).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-gray-500 text-xs">Selling Price</p>
                      <p className="font-bold text-green-600">R{Number(sale.selling_price).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-gray-500 text-xs">Profit</p>
                      <p className="font-bold text-blue-600">R{Number(sale.profit).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">
                  {sale.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
