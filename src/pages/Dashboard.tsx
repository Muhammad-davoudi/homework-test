import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { DateRangeOption } from '../types';
import {
  calculateDashboardKPIs,
  formatCompactCurrency,
  formatCurrency,
  getCategorySales,
  getCustomerActivityOverview,
  getProductPerformance,
  getRecentTransactions,
  getTimeSeriesData,
} from '../services/analytics';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

export const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useLocalStorage<DateRangeOption>('aipi_dashboard_range', '30d');

  const kpis = useMemo(() => calculateDashboardKPIs(dateRange), [dateRange]);
  const timeSeries = useMemo(() => getTimeSeriesData(dateRange), [dateRange]);
  const categorySales = useMemo(() => getCategorySales(dateRange), [dateRange]);
  const topProducts = useMemo(() => getProductPerformance(dateRange).slice(0, 5), [dateRange]);
  const recentTransactions = useMemo(() => getRecentTransactions(dateRange, 8), [dateRange]);
  const customerActivity = useMemo(() => getCustomerActivityOverview(dateRange), [dateRange]);

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      delta: `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}%`,
      positive: kpis.revenueGrowth >= 0,
      subtext: 'vs prior period',
    },
    {
      label: 'Total Orders',
      value: kpis.totalOrders.toLocaleString(),
      delta: `${kpis.ordersGrowth >= 0 ? '+' : ''}${kpis.ordersGrowth}%`,
      positive: kpis.ordersGrowth >= 0,
      subtext: 'completed & active orders',
    },
    {
      label: 'Total Customers',
      value: kpis.totalCustomers.toLocaleString(),
      delta: `${kpis.activeCustomersGrowth >= 0 ? '+' : ''}${kpis.activeCustomersGrowth}%`,
      positive: kpis.activeCustomersGrowth >= 0,
      subtext: 'unique ordering accounts',
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(kpis.averageOrderValue),
      delta: `${kpis.aovGrowth >= 0 ? '+' : ''}${kpis.aovGrowth}%`,
      positive: kpis.aovGrowth >= 0,
      subtext: 'mean basket value',
    },
    {
      label: 'Revenue Growth',
      value: `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}%`,
      delta: 'Period-over-Period',
      positive: kpis.revenueGrowth >= 0,
      subtext: 'net expansion rate',
    },
    {
      label: 'Customer Retention Rate',
      value: `${kpis.customerRetentionRate}%`,
      delta: 'Repeat Buyers',
      positive: kpis.customerRetentionRate >= 65,
      subtext: 'multi-order account share',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Interactive Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Executive Overview Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time revenue velocity, category mix, and customer activity calculated directly from transaction records.
          </p>
        </div>

        {/* Interactive Date Range Filter */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg self-start sm:self-auto"
          role="group"
          aria-label="Date range filter"
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                dateRange === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 KPI Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-slate-400">{card.label}</span>
            <div className="my-2.5">
              <span className="text-2xl font-bold text-white font-mono-tabular tracking-tight">
                {card.value}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {card.positive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span
                className={`font-mono-tabular font-medium ${
                  card.positive ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {card.delta}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 truncate">{card.subtext}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Primary Charts Row: Revenue Over Time + Orders Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Over Time Chart (7 columns) */}
        <section className="lg:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Revenue Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gross merchandise value trajectory across the selected window
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              Total: {formatCurrency(kpis.totalRevenue)}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactCurrency(val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Orders Over Time Chart (5 columns) */}
        <section className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Order Volume Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed & active order count per period
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              {kpis.totalOrders} orders
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: unknown) => [`${Number(value)} orders`, 'Order Volume']}
                />
                <Bar dataKey="orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Second Row: Sales by Category + Top 5 Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Category Chart (6 columns) */}
        <section className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Sales by Product Category</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Revenue distribution and unit volume across catalog lines
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categorySales}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#94A3B8"
                  fontSize={11}
                  width={130}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Category Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                  {categorySales.map((entry, idx) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="divide-y divide-slate-800/80 border-t border-slate-800/80 pt-2">
            {categorySales.map((cat) => (
              <div
                key={cat.category}
                className="py-2 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-200">{cat.category}</span>
                <div className="flex items-center gap-3 font-mono-tabular text-slate-400">
                  <span>{cat.unitsSold} units</span>
                  <span>·</span>
                  <span>{cat.shareOfRevenue}% share</span>
                  <span>·</span>
                  <span className="text-slate-100 font-semibold">
                    {formatCurrency(cat.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 Products Ranking (6 columns) */}
        <section className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Top 5 Revenue-Generating Products</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by total revenue in the selected time period
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Compare Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                    <th className="py-2.5 pr-3">Rank & Product</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 pl-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {topProducts.map((item) => (
                    <tr
                      key={item.product.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="font-medium text-slate-100">
                          <span className="font-mono-tabular text-blue-400 mr-2">
                            #{item.rank}
                          </span>
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.product.category} · {item.product.sku} · ASP{' '}
                          <span className="font-mono-tabular">
                            {formatCurrency(item.averageSellingPrice)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-slate-300">
                        {item.unitsSold}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-emerald-400">
                        {item.grossMarginPct}%
                      </td>
                      <td className="py-3 pl-3 text-right font-mono-tabular font-semibold text-white">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Top 5 combined revenue</span>
            <span className="font-mono-tabular font-semibold text-slate-200">
              {formatCurrency(topProducts.reduce((s, p) => s + p.totalRevenue, 0))}
            </span>
          </div>
        </section>
      </div>

      {/* Third Row: Recent Transactions Table + Customer Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions Table (8 columns) */}
        <section className="lg:col-span-8 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest verified orders within the selected time period
              </p>
            </div>
            <Link
              to="/customers"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Customer Cohorts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                  <th className="py-2.5 pr-3">Order ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer & Account</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pr-3 font-mono-tabular font-medium text-blue-400 whitespace-nowrap">
                      {tx.id}
                    </td>
                    <td className="py-3 px-3 font-mono-tabular text-slate-300 whitespace-nowrap">
                      {tx.orderDate}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-100">{tx.customerName}</div>
                      <div className="text-[11px] text-slate-400">{tx.company}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="truncate max-w-[200px]">{tx.primaryProductName}</div>
                      <div className="text-[11px] text-slate-400 font-mono-tabular">
                        {tx.totalUnits} units
                        {tx.additionalItemsCount > 0
                          ? ` · +${tx.additionalItemsCount} more SKU`
                          : ''}{' '}
                        · {tx.paymentMethod}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          tx.status === 'Completed'
                            ? 'text-emerald-400'
                            : tx.status === 'Shipped'
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-tabular font-semibold text-white whitespace-nowrap">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Customer Activity Overview (4 columns) */}
        <section className="lg:col-span-4 bg-[#111827] border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">Customer Activity Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-5">
              Geographic and acquisition channel breakdown for active buyers
            </p>

            {/* Regional Distribution */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300">Revenue by Region</h3>
              {customerActivity.byRegion.map((reg) => (
                <div key={reg.region} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{reg.region}</span>
                    <span className="font-mono-tabular text-slate-300">
                      {formatCurrency(reg.revenue)} · {reg.share}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.max(4, reg.share)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-tabular">
                    {reg.activeCustomers} active customers · {reg.orders} orders
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acquisition Channels */}
          <div className="pt-5 border-t border-slate-800/80 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">Acquisition Channels</h3>
            <div className="divide-y divide-slate-800/70">
              {customerActivity.byChannel.map((ch) => (
                <div
                  key={ch.channel}
                  className="py-2 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">{ch.channel}</span>
                  <span className="font-mono-tabular text-slate-200">
                    {formatCurrency(ch.revenue)} ({ch.share}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
