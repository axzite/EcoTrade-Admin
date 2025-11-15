import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Users, Download, Filter, Search, AlertTriangle } from "lucide-react";

function rupee(x = 0) {
  try { 
    return "₹ " + Number(x).toLocaleString("en-IN"); 
  } catch { 
    return `₹ ${x}`; 
  }
}

function normalizeId(id) {
  if (!id && id !== 0) return null;
  if (typeof id === "string") return id;
  if (typeof id === "object") {
    if (id.$oid) return String(id.$oid);
    if (id._id && typeof id._id === "string") return id._id;
    try {
      return id.toString();
    } catch {
      return null;
    }
  }
  return String(id);
}

export default function ProductAnalytics() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [products, setProducts] = useState([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [sortOrder, setSortOrder] = useState("desc");

  const base = import.meta.env.VITE_API_BASE_URL || "";

  const fetchList = async (p = 1) => {
    setLoading(true); 
    setErr("");
    try {
      let url = `${base}/api/admin/product-insights?page=${p}&limit=20`;
      const params = [];
      if (rangeStart) params.push(`start=${encodeURIComponent(rangeStart)}`);
      if (rangeEnd) params.push(`end=${encodeURIComponent(rangeEnd)}`);
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (params.length) url += `&${params.join("&")}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success) {
        setProducts(Array.isArray(data.data?.products) ? data.data.products : []);
      } else {
        setErr(data.message || "Invalid response");
      }
    } catch (error) {
      console.error("Fetch list error:", error);
      setErr(error.message || "Network error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (productIdRaw) => {
    const productId = normalizeId(productIdRaw) || productIdRaw;
    if (!productId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setDetail(null);
    setErr("");
    try {
      const url = `${base}/api/admin/product-insights?productId=${encodeURIComponent(productId)}${(rangeStart||rangeEnd) ? `&start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success && data.data) {
        setDetail(data.data);
      } else {
        setErr(data.message || "Invalid product detail");
      }
    } catch (e) {
      console.error("Fetch detail error:", e);
      setErr(e.message || "Network error");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchList(page);
  }, []);

  const categories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const setc = new Set();
    products.forEach(p => { 
      if (p && p.category) setc.add(p.category); 
    });
    return Array.from(setc);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    let filtered = products.filter(p => {
      if (!p || !p.name) return false;
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    filtered.sort((a, b) => {
      const aVal = Number(a[sortBy]) || 0;
      const bVal = Number(b[sortBy]) || 0;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });
    
    return filtered;
  }, [products, searchTerm, sortBy, sortOrder]);

  const kpiData = useMemo(() => {
    if (!Array.isArray(products)) {
      return {
        totalRevenue: 0,
        totalQty: 0,
        totalOrders: 0,
        totalProducts: 0,
        avgOrderValue: 0
      };
    }
    
    const total = products.reduce((acc, p) => {
      if (!p) return acc;
      return {
        revenue: acc.revenue + (Number(p.revenue) || 0),
        qty: acc.qty + (Number(p.qty) || 0),
        orders: acc.orders + (Number(p.buyersCount) || 0),
        products: acc.products + 1
      };
    }, { revenue: 0, qty: 0, orders: 0, products: 0 });
    
    return {
      totalRevenue: total.revenue,
      totalQty: total.qty,
      totalOrders: total.orders,
      totalProducts: total.products,
      avgOrderValue: total.orders > 0 ? total.revenue / total.orders : 0
    };
  }, [products]);

  const categoryData = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    const catMap = {};
    products.forEach(p => {
      if (!p || !p.category) return;
      if (!catMap[p.category]) {
        catMap[p.category] = { name: p.category, revenue: 0, qty: 0 };
      }
      catMap[p.category].revenue += Number(p.revenue) || 0;
      catMap[p.category].qty += Number(p.qty) || 0;
    });
    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [products]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getPerformanceIndicator = (product) => {
    if (!product || !kpiData.totalProducts) {
      return { label: 'N/A', color: '#9ca3af', icon: TrendingUp };
    }
    
    const avgRevenue = kpiData.totalRevenue / kpiData.totalProducts;
    const performance = (Number(product.revenue) || 0) / (avgRevenue || 1);
    
    if (performance > 1.5) return { label: 'High', color: '#10B981', icon: TrendingUp };
    if (performance > 0.8) return { label: 'Medium', color: '#F59E0B', icon: TrendingUp };
    return { label: 'Low', color: '#EF4444', icon: TrendingDown };
  };

  const handleExport = () => {
    try {
      if (!Array.isArray(filteredProducts) || filteredProducts.length === 0) {
        alert("No data to export");
        return;
      }
      
      const rows = filteredProducts.map(p => ({
        name: p?.name || '',
        category: p?.category || '',
        qty: p?.qty || 0,
        revenue: p?.revenue || 0,
        avgPrice: p?.avgPrice || 0,
        buyers: p?.buyersCount || 0
      }));
      
      const filename = `products-analytics-${Date.now()}.csv`;
      const header = Object.keys(rows[0]);
      const csv = [
        header.join(","),
        ...rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(","))
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
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Product Analytics</h1>
          <p style={styles.subtitle}>Monitor performance and insights across your product catalog</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>
            <DollarSign size={24} color="#3B82F6" />
          </div>
          <div>
            <div style={styles.kpiLabel}>Total Revenue</div>
            <div style={styles.kpiValue}>{rupee(kpiData.totalRevenue)}</div>
          </div>
        </div>
        
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>
            <Package size={24} color="#10B981" />
          </div>
          <div>
            <div style={styles.kpiLabel}>Units Sold</div>
            <div style={styles.kpiValue}>{kpiData.totalQty.toLocaleString()}</div>
          </div>
        </div>
        
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>
            <ShoppingCart size={24} color="#F59E0B" />
          </div>
          <div>
            <div style={styles.kpiLabel}>Total Orders</div>
            <div style={styles.kpiValue}>{kpiData.totalOrders.toLocaleString()}</div>
          </div>
        </div>
        
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>
            <Users size={24} color="#8B5CF6" />
          </div>
          <div>
            <div style={styles.kpiLabel}>Avg Order Value</div>
            <div style={styles.kpiValue}>{rupee(kpiData.avgOrderValue)}</div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div style={styles.controlBar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#6b7280" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <Filter size={18} color="#6b7280" />
          <input
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            style={styles.input}
          />
          <input
            type="date"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            style={styles.input}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="revenue">Revenue</option>
            <option value="qty">Quantity</option>
            <option value="avgPrice">Avg Price</option>
            <option value="buyersCount">Buyers</option>
          </select>
          
          <button onClick={() => fetchList(1)} style={styles.btnPrimary}>
            Apply
          </button>
          <button
            onClick={() => {
              setRangeStart("");
              setRangeEnd("");
              setCategory("");
              setSearchTerm("");
              fetchList(1);
            }}
            style={styles.btnSecondary}
          >
            Reset
          </button>
          <button onClick={handleExport} style={styles.btnExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Products Table */}
        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <h3 style={styles.sectionTitle}>Products ({filteredProducts.length})</h3>
          </div>
          
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <div style={{...styles.tableCell, flex: 2}}>Product</div>
              <div style={styles.tableCell}>Performance</div>
              <div style={styles.tableCell}>Qty Sold</div>
              <div style={styles.tableCell}>Revenue</div>
              <div style={styles.tableCell}>Avg Price</div>
              <div style={styles.tableCell}>Buyers</div>
            </div>
            
            <div style={styles.tableBody}>
              {loading ? (
                <div style={styles.loadingRow}>
                  <div style={styles.spinner}></div>
                  <div>Loading products...</div>
                </div>
              ) : filteredProducts.length ? (
                filteredProducts.map(p => {
                  if (!p) return null;
                  
                  const id = normalizeId(p._id) || p._id || p.name || Math.random();
                  const isSelected = selected && (normalizeId(selected._id) === normalizeId(p._id));
                  const perf = getPerformanceIndicator(p);
                  const PerfIcon = perf.icon;
                  
                  return (
                    <div
                      key={id}
                      style={{
                        ...styles.tableRow,
                        ...(isSelected ? styles.tableRowSelected : {})
                      }}
                      onClick={() => {
                        setSelected(p);
                        fetchDetail(p._id || p.name);
                      }}
                    >
                      <div style={{...styles.tableCell, flex: 2}}>
                        <div style={styles.productCell}>
                          <div style={styles.productName}>{p.name || 'Unnamed Product'}</div>
                          <div style={styles.productCategory}>{p.category || 'Uncategorized'}</div>
                        </div>
                      </div>
                      <div style={styles.tableCell}>
                        <div style={{...styles.perfBadge, backgroundColor: perf.color + '20', color: perf.color}}>
                          <PerfIcon size={14} />
                          {perf.label}
                        </div>
                      </div>
                      <div style={styles.tableCell}>
                        <strong>{(p.qty || 0).toLocaleString()}</strong>
                      </div>
                      <div style={styles.tableCell}>
                        <strong>{rupee(p.revenue || 0)}</strong>
                      </div>
                      <div style={styles.tableCell}>
                        {p.avgPrice ? rupee(p.avgPrice) : "—"}
                      </div>
                      <div style={styles.tableCell}>
                        {p.buyersCount || 0}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.emptyState}>
                  <Package size={48} color="#9ca3af" />
                  <div style={styles.emptyText}>No products found</div>
                  <div style={styles.emptySubtext}>Try adjusting your filters</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div style={styles.detailPanel}>
          {loadingDetail ? (
            <div style={styles.loadingDetail}>
              <div style={styles.spinner}></div>
              <div>Loading details...</div>
            </div>
          ) : detail && detail.product ? (
            <>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={styles.detailTitle}>{detail.product.name || 'Product Details'}</h3>
                  <div style={styles.detailMeta}>
                    {detail.product.category || 'Uncategorized'} • {detail.product.price ? rupee(detail.product.price) : "Price not set"}
                  </div>
                  {detail.product.stock != null && (
                    <div style={{
                      ...styles.stockBadge,
                      ...(detail.product.stock < 10 ? styles.stockLow : {})
                    }}>
                      {detail.product.stock < 10 && <AlertTriangle size={14} />}
                      Stock: {detail.product.stock}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.detailStats}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Units Sold</div>
                  <div style={styles.statValue}>{(detail.totals?.qty || 0).toLocaleString()}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total Revenue</div>
                  <div style={styles.statValue}>{rupee(detail.totals?.revenue || 0)}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total Orders</div>
                  <div style={styles.statValue}>{(detail.totals?.orders || 0).toLocaleString()}</div>
                </div>
              </div>

              {detail.salesOverTime && Array.isArray(detail.salesOverTime) && detail.salesOverTime.length > 0 && (
                <div style={styles.chartSection}>
                  <h4 style={styles.chartTitle}>Revenue Over Time</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={detail.salesOverTime}>
                      <XAxis dataKey="_id" stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v) => rupee(v)}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: 13
                        }}
                      />
                      <Line
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={styles.buyersSection}>
                <h4 style={styles.chartTitle}>Top Buyers</h4>
                <div style={styles.buyersList}>
                  {detail.buyersAggSample && Array.isArray(detail.buyersAggSample) && detail.buyersAggSample.length > 0 ? (
                    detail.buyersAggSample.map((b, i) => (
                      <div key={b._id?.userId || i} style={styles.buyerRow}>
                        <div style={styles.buyerInfo}>
                          <div style={styles.buyerRank}>#{i + 1}</div>
                          <div>
                            <div style={styles.buyerId}>User: {b._id?.userId || "Unknown"}</div>
                            <div style={styles.buyerStats}>
                              {b.qty || 0} units • {b.orders || 0} orders
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyBuyers}>No buyer data available</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>📊</div>
              <div style={styles.placeholderTitle}>Select a Product</div>
              <div style={styles.placeholderText}>
                Click on any product from the table to view detailed analytics, revenue trends, and top buyers
              </div>
            </div>
          )}
          {err && <div style={styles.error}>{err}</div>}
        </div>
      </div>

      {/* Category Overview */}
      {categoryData.length > 0 && (
        <div style={styles.categorySection}>
          <h3 style={styles.sectionTitle}>Category Performance</h3>
          <div style={styles.categoryGrid}>
            <div style={styles.categoryChart}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 6)}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${rupee(entry.revenue)}`}
                  >
                    {categoryData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => rupee(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={styles.categoryBars}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData.slice(0, 6)}>
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => v.toLocaleString()}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 13
                    }}
                  />
                  <Bar dataKey="qty" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '24px',
    background: 'linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%)',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#111827'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '15px',
    color: '#6b7280'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  kpiCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #f3f4f6'
  },
  kpiIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: '#f0f7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  kpiLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '500'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827'
  },
  controlBar: {
    background: '#fff',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f9fafb',
    padding: '10px 14px',
    borderRadius: '8px',
    flex: '1 1 250px',
    border: '1px solid #e5e7eb'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    flex: 1,
    color: '#111827'
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    color: '#111827'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    color: '#111827'
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '10px 20px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnExport: {
    padding: '10px 20px',
    background: '#10B981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '20px',
    marginBottom: '24px'
  },
  tableSection: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600',
    color: '#111827'
  },
  table: {
    display: 'flex',
    flexDirection: 'column'
  },
  tableHead: {
    display: 'flex',
    padding: '14px 20px',
    background: '#f9fafb',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    borderBottom: '1px solid #f3f4f6'
  },
  tableBody: {
    maxHeight: '600px',
    overflowY: 'auto'
  },
  tableRow: {
    display: 'flex',
    padding: '16px 20px',
    borderBottom: '1px solid #f9fafb',
    cursor: 'pointer',
    transition: 'background 0.15s',
    alignItems: 'center'
  },
  tableRowSelected: {
    background: '#eff6ff',
    borderLeft: '3px solid #3B82F6'
  },
  tableCell: {
    flex: 1,
    fontSize: '14px',
    color: '#374151'
  },
  productCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  productName: {
    fontWeight: '600',
    color: '#111827'
  },
  productCategory: {
    fontSize: '13px',
    color: '#6b7280'
  },
  perfBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  detailPanel: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    maxHeight: '680px',
    overflowY: 'auto'
  },
  detailHeader: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f3f4f6'
  },
  detailTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827'
  },
  detailMeta: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  stockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#ecfeff',
    color: '#0369a1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '8px'
  },
  stockLow: {
    background: '#fef2f2',
    color: '#dc2626'
  },
  detailStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  statCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827'
  },
  chartSection: {
    marginBottom: '24px'
  },
  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827'
  },
  buyersSection: {
    marginTop: '24px'
  },
  buyersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  buyerRow: {
    padding: '14px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  buyerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  buyerRank: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#3B82F6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0
  },
  buyerId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '2px'
  },
  buyerStats: {
    fontSize: '13px',
    color: '#6b7280'
  },
  emptyBuyers: {
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '400px',
    textAlign: 'center',
    padding: '32px'
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  placeholderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  placeholderText: {
    fontSize: '14px',
    color: '#6b7280',
    maxWidth: '320px',
    lineHeight: '1.6'
  },
  loadingRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '12px'
  },
  loadingDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '12px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '12px'
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginTop: '8px'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  error: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fecaca'
  },
  categorySection: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginTop: '20px'
  },
  categoryChart: {
    padding: '16px'
  },
  categoryBars: {
    padding: '16px'
  }
}