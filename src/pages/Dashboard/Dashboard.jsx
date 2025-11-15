// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./Dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function rupee(x = 0) {
  try {
    return "₹ " + Number(x).toLocaleString("en-IN");
  } catch {
    return `₹ ${x}`;
  }
}

// compute delta between last N points and previous N points, return % and direction
function computeDelta(chartData = [], window = 3, key = "sales") {
  if (!Array.isArray(chartData) || chartData.length < window * 2) return null;
  const n = chartData.length;
  const lastSlice = chartData.slice(n - window, n);
  const prevSlice = chartData.slice(n - window * 2, n - window);
  const lastSum = lastSlice.reduce((s, d) => s + (d[key] || 0), 0);
  const prevSum = prevSlice.reduce((s, d) => s + (d[key] || 0), 0);
  if (prevSum === 0) return { pct: lastSum === 0 ? 0 : 100, up: lastSum > 0 };
  const pct = ((lastSum - prevSum) / prevSum) * 100;
  return { pct: Number(pct.toFixed(1)), up: pct >= 0 };
}

function downloadCSV(rows = [], filename = "export.csv") {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header.map((h) => {
        const v = r[h] === null || r[h] === undefined ? "" : `${r[h]}`.replace(/"/g, '""');
        return `"${v}"`;
      }).join(",")
    )
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchWithRange = async (start = startDate, end = endDate) => {
    setLoading(true);
    setErr("");
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      let url = `${base}/api/admin/overview`;
      const params = [];
      if (start) params.push(`start=${encodeURIComponent(start)}`);
      if (end) params.push(`end=${encodeURIComponent(end)}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setErr("Invalid response from server");
        console.error("Invalid response body:", res.data);
      }
    } catch (error) {
      console.error("overview fetch error:", error);
      setErr(error?.response?.data?.message || error.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tidy chart data
  const salesChartData = useMemo(() => {
    if (!data) return [];
    const raw = Array.isArray(data.salesOverTime) ? data.salesOverTime : [];
    return raw.map((d) => ({ date: d._id || d.date || "", sales: d.total || 0, orders: d.orders || 0 }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return (Array.isArray(data.salesByCategory) ? data.salesByCategory : []).map((c) => ({
      name: c.name,
      value: c.revenue ?? c.value ?? 0
    }));
  }, [data]);

  // compute some deltas (last 3 points vs previous 3)
  const salesDelta = useMemo(() => computeDelta(salesChartData, 3, "sales"), [salesChartData]);
  const ordersDelta = useMemo(() => computeDelta(salesChartData, 3, "orders"), [salesChartData]);

  // builds sparkline small chart for stat cards
  const SmallSpark = ({ dataKey = "sales" }) => (
    <div className="sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={salesChartData}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke="#3B82F6" fill="url(#grad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className="dash-stats">
          <div className="dash-card loading" aria-busy="true" />
          <div className="dash-card loading" aria-busy="true" />
          <div className="dash-card loading" aria-busy="true" />
          <div className="dash-card loading" aria-busy="true" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="dashboard-page">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className="error-box" role="alert">
          Error loading dashboard: {err}
        </div>
      </div>
    );
  }

  const {
    totalSales = 0,
    totalOrders = 0,
    totalProducts = 0,
    totalUsers = 0,
    activeUsersWindow = 0,
    topProducts = [],
    conversionRate = 0,
    range = {}
  } = data || {};

  return (
    <div className="dashboard-page" role="region" aria-labelledby="dashboard-title">
      <h2 id="dashboard-title" className="dashboard-title">Dashboard</h2>

      {/* control row */}
      <div className="control-row">
        <div className="date-controls" role="form" aria-label="Date range">
          <label className="date-label">From
            <input aria-label="start date" className="date-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label className="date-label">To
            <input aria-label="end date" className="date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          <button className="btn-primary" onClick={() => fetchWithRange()} aria-label="Apply date range">Apply</button>
          <button className="btn-ghost" onClick={() => { setStartDate(""); setEndDate(""); fetchWithRange("", ""); }} aria-label="Reset date range">Reset</button>
        </div>

        <div className="control-right">
          <div className="range-info">Showing: <strong>{range.start || "auto"} → {range.end || "auto"}</strong></div>
          <button
            className="btn-ghost"
            onClick={() => {
              const rows = (topProducts || []).map((p) => ({ name: p.name, qty: p.qty, revenue: p.revenue }));
              downloadCSV(rows, `top-products-${(range.start || "all")}.csv`);
            }}
            aria-label="Export top products"
            title="Export top products CSV"
          >
            Export Top Products CSV
          </button>
        </div>
      </div>

      {/* stat cards with small sparklines */}
      <div className="dash-stats">
        <div className="dash-card">
          <div className="card-row">
            <div>
              <div className="card-label">Total Sales</div>
              <div className="card-value">{rupee(totalSales)}</div>
            </div>
            <div className={`delta ${salesDelta?.up ? "up" : "down"}`}>
              {salesDelta ? `${salesDelta.pct}%` : "—"}
            </div>
          </div>
          <SmallSpark dataKey="sales" />
          <div className="card-sub">Orders: {totalOrders}</div>
        </div>

        <div className="dash-card">
          <div className="card-row">
            <div>
              <div className="card-label">Orders</div>
              <div className="card-value">{totalOrders}</div>
            </div>
            <div className={`delta ${ordersDelta?.up ? "up" : "down"}`}>
              {ordersDelta ? `${ordersDelta.pct}%` : "—"}
            </div>
          </div>
          <SmallSpark dataKey="orders" />
          <div className="card-sub">Active users (window): {activeUsersWindow}</div>
        </div>

        <div className="dash-card">
          <div className="card-row">
            <div>
              <div className="card-label">Products</div>
              <div className="card-value">{totalProducts}</div>
            </div>
            <div className="badge">Catalog</div>
          </div>
          <SmallSpark dataKey="sales" />
          <div className="card-sub">Catalog size</div>
        </div>

        <div className="dash-card">
          <div className="card-row">
            <div>
              <div className="card-label">Users</div>
              <div className="card-value">{totalUsers}</div>
            </div>
            <div className="badge">Reg</div>
          </div>
          <SmallSpark dataKey="sales" />
          <div className="card-sub">Conversion: {conversionRate}%</div>
        </div>
      </div>

      {/* main grid */}
      <div className="dash-main-grid">
        <div className="chart-panel">
          <div className="panel-header">Sales (selected window)</div>
          <div className="chart-area" role="img" aria-label="Sales chart">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={salesChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v) => rupee(v)} />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">Total sales in period: <strong>{rupee(totalSales)}</strong></div>
        </div>

        <div className="panel-small">
          <div className="panel-header">Sales by Category</div>
          <div className="pie-area">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip formatter={(v) => rupee(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="top-products" aria-live="polite">
            <div className="subhead">Top Products</div>
            <ul>
              {Array.isArray(topProducts) && topProducts.length ? (
                topProducts.map((p, i) => (
                  <li
                    key={p.name + i}
                    className="top-product-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      // drilldown: navigate to product page if you have route, else just console
                      // window.location.href = `/admin/product/${encodeURIComponent(p.name)}`;
                      console.log("drilldown product:", p);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") console.log("drilldown product:", p); }}
                    title="Click to drill down"
                  >
                    <div>
                      <div className="tp-name">{p.name}</div>
                      <div className="tp-meta">Sold: {p.qty}</div>
                    </div>
                    <div className="tp-rev">{rupee(p.revenue)}</div>
                  </li>
                ))
              ) : (
                <li>No data</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="quick-insights">
        <div className="insight-card">
          <div className="insight-label">Conversion Rate</div>
          <div className="insight-value">{conversionRate}%</div>
          <div className="insight-sub">Orders / Registered users</div>
        </div>

        <div className="insight-card">
          <div className="insight-label">Avg Order Value</div>
          <div className="insight-value">{totalOrders ? rupee(Math.round(totalSales / totalOrders)) : "—"}</div>
          <div className="insight-sub">Revenue per order</div>
        </div>

        <div className="insight-card">
          <div className="insight-label">Refund Rate</div>
          <div className="insight-value">—</div>
          <div className="insight-sub">(Need refund data)</div>
        </div>
      </div>
    </div>
  );
}
