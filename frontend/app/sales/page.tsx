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

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.selling_price || 0),
    0
  );

  const totalProfit = sales.reduce(
    (sum, sale) => sum + Number(sale.profit || 0),
    0
  );

  const totalSales = sales.length;

  const averageProfit =
    totalSales > 0 ? totalProfit / totalSales : 0;

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
          <h1 className="text-2xl font-bold">
            Cape Parts Finder - Sales Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Revenue, profit and completed sales
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-700 px-4 py-2 rounded-xl text-sm"
          >
            Admin
          </button>

          <button
            onClick={() => router.push("/suppliers")}
            className="bg-gray-700 px-4 py-2 rounded-xl text-sm"
          >
            Suppliers
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-green-600">
              R{totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">
              Total Profit
            </p>
            <p className="text-3xl font-bold text-blue-600">
              R{totalProfit.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">
              Total Sales
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {totalSales}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">
              Average Profit
            </p>
            <p className="text-3xl font-bold text-orange-600">
              R{averageProfit.toFixed(2)}
            </p>
          </div>

        </div>

        <h2 className="text-2xl font-bold mb-4">
          Sales History
        </h2>

        <div className="space-y-4">

          {sales.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              No sales yet.
              Convert supplier quotes into sales to see them here.
            </div>
          )}

          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-2xl shadow border p-6"
            >
              <div className="flex justify-between items-start">

                <div>
                  <h3 className="text-xl font-bold">
                    {sale.customer_name}
                  </h3>

                  <p className="text-xs text-gray-400 mb-4">
                    {new Date(sale.created_at).toLocaleString("en-ZA")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Supplier Cost
                      </p>
                      <p className="font-bold text-red-500">
                        R{Number(sale.supplier_price).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Selling Price
                      </p>
                      <p className="font-bold text-green-600">
                        R{Number(sale.selling_price).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Profit
                      </p>
                      <p className="font-bold text-blue-600">
                        R{Number(sale.profit).toFixed(2)}
                      </p>
                    </div>

                  </div>
                </div>

                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
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
