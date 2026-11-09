import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { ProductCategory } from '../types';
import {
  formatCompactCurrency,
  formatCurrency,
  getCategorySales,
  getProductPerformance,
} from '../services/analytics';
import { useLocalStorage } from '../hooks/useLocalStorage';

type SortField =
  | 'rank'
  | 'name'
  | 'unitsSold'
  | 'totalRevenue'
  | 'averageSellingPrice'
  | 'grossMarginPct'
  | 'revenueGrowthPct';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Audio & Acoustics',
  'Smart Displays',
  'Ergonomic Hardware',
  'Connectivity & Hubs',
  'Power & Charging',
];

const COMPARISON_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

export const ProductAnalytics: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [trendFilter, setTrendFilter] = useState<'All' | 'Expanding' | 'Stable' | 'Declining'>('All');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [compareIds, setCompareIds] = useLocalStorage<string[]>('aipi_compare_products', [
    'PRD-002',
    'PRD-001',
    'PRD-003',
  ]);
  const [comparisonMetric, setComparisonMetric] = useState<'revenue' | 'units'>('revenue');

  const allProductMetrics = useMemo(() => getProductPerformance('all'), []);
  const categoryPerformance = useMemo(() => getCategorySales('all'), []);

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = allProductMetrics.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.product.category === selectedCategory;
      const matchesTrend = trendFilter === 'All' || item.trend === trendFilter;
      const matchesSearch =
        !q ||
        item.product.name.toLowerCase().includes(q) ||
        item.product.sku.toLowerCase().includes(q) ||
        item.product.category.toLowerCase().includes(q);
      return matchesCategory && matchesTrend && matchesSearch;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'rank') cmp = a.rank - b.rank;
      else if (sortField === 'name') cmp = a.product.name.localeCompare(b.product.name);
      else if (sortField === 'unitsSold') cmp = a.unitsSold - b.unitsSold;
      else if (sortField === 'totalRevenue') cmp = a.totalRevenue - b.totalRevenue;
      else if (sortField === 'averageSellingPrice')
        cmp = a.averageSellingPrice - b.averageSellingPrice;
      else if (sortField === 'grossMarginPct') cmp = a.grossMarginPct - b.grossMarginPct;
      else if (sortField === 'revenueGrowthPct') cmp = a.revenueGrowthPct - b.revenueGrowthPct;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [allProductMetrics, searchQuery, selectedCategory, trendFilter, sortField, sortAsc]);

  const comparedProducts = useMemo(
    () => allProductMetrics.filter((p) => compareIds.includes(p.product.id)),
    [allProductMetrics, compareIds]
  );

  // Build multi-product monthly time series for the comparison chart
  const comparisonChartData = useMemo(() => {
    const periods = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    return periods.map((period, idx) => {
      const row: Record<string, string | number> = { period };
      comparedProducts.forEach((p) => {
        const point = p.monthlySeries[idx];
        row[p.product.name] =
          comparisonMetric === 'revenue' ? point?.revenue || 0 : point?.units || 0;
      });
      return row;
    });
  }, [comparedProducts, comparisonMetric]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' || field === 'name');
    }
  };

  const toggleProductCompare = (productId: string) => {
    if (compareIds.includes(productId)) {
      if (compareIds.length > 1) {
        setCompareIds(compareIds.filter((id) => id !== productId));
      }
    } else {
      if (compareIds.length >= 4) {
        setCompareIds([...compareIds.slice(1), productId]);
      } else {
        setCompareIds([...compareIds, productId]);
      }
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 inline ml-1" />;
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Product Catalog & Performance Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze revenue rankings, unit velocity, average selling prices, and multi-SKU performance comparisons across all {allProductMetrics.length} products.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setTrendFilter('All');
            setSortField('rank');
            setSortAsc(true);
            setCompareIds(['PRD-002', 'PRD-001', 'PRD-003']);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters & Comparison</span>
        </button>
      </div>

      {/* Category Performance Overview Strip */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Category Performance Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any category card below to filter the product performance table
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono-tabular">
            Showing: {selectedCategory === 'All' ? 'All 5 Categories' : selectedCategory}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categoryPerformance.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() =>
                  setSelectedCategory(isSelected ? 'All' : cat.category)
                }
                className={`text-left p-4 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/60'
                    : 'bg-[#0B0F19]/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-semibold text-slate-200 truncate">{cat.category}</p>
                <p className="text-xl font-bold text-white font-mono-tabular mt-2">
                  {formatCurrency(cat.revenue)}
                </p>
                <div className="text-[11px] text-slate-400 font-mono-tabular mt-1.5 flex items-center gap-1.5">
                  <span>{cat.unitsSold} units</span>
                  <span>·</span>
                  <span>{cat.shareOfRevenue}% share</span>
                  <span>·</span>
                  <span className="text-emerald-400">+{cat.growthRate}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Product Comparison Workspace */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              Interactive Multi-Product Performance Comparison ({comparedProducts.length}/4 Selected)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select up to 4 products in the table below to compare monthly revenue or unit sales trajectories side-by-side.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setComparisonMetric('revenue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                comparisonMetric === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Compare Monthly Revenue
            </button>
            <button
              type="button"
              onClick={() => setComparisonMetric('units')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                comparisonMetric === 'units'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Compare Units Sold
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Line Chart Comparison (7 cols) */}
          <div className="lg:col-span-7 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="period"
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
                  tickFormatter={(val) =>
                    comparisonMetric === 'revenue' ? formatCompactCurrency(val) : `${val}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: unknown) => [
                    comparisonMetric === 'revenue'
                      ? formatCurrency(Number(value))
                      : `${Number(value)} units`,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {comparedProducts.map((item, idx) => (
                  <Line
                    key={item.product.id}
                    type="monotone"
                    dataKey={item.product.name}
                    stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Selected Products Side-by-Side Matrix (5 cols) */}
          <div className="lg:col-span-5 divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl bg-[#0B0F19]/50 p-4">
            <div className="pb-2.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Compared Products</span>
              <span>Total Revenue · Units · ASP</span>
            </div>
            {comparedProducts.map((item, idx) => (
              <div
                key={item.product.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
                      }}
                    />
                    <span className="font-medium text-white truncate">
                      {item.product.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 pl-4">
                    Rank #{item.rank} · {item.product.category} · 30d:{' '}
                    <span
                      className={`font-mono-tabular ${
                        item.revenueGrowthPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.revenueGrowthPct >= 0 ? '+' : ''}
                      {item.revenueGrowthPct}%
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono-tabular shrink-0">
                  <div className="font-semibold text-white">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.unitsSold}u · {formatCurrency(item.averageSellingPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar & Product Performance Table */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F19] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category & Velocity Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg overflow-x-auto max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg">
              {(['All', 'Expanding', 'Stable', 'Declining'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrendFilter(t)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    trendFilter === t
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'All' ? 'All Trends' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 select-none">
                <th className="py-3 pr-3 w-10">Compare</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('rank')}
                >
                  Rank {renderSortIcon('rank')}
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('name')}
                >
                  Product & SKU {renderSortIcon('name')}
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Category</th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('unitsSold')}
                >
                  Units Sold {renderSortIcon('unitsSold')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('averageSellingPrice')}
                >
                  Avg Selling Price {renderSortIcon('averageSellingPrice')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('grossMarginPct')}
                >
                  Gross Margin {renderSortIcon('grossMarginPct')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('revenueGrowthPct')}
                >
                  30d Trend {renderSortIcon('revenueGrowthPct')}
                </th>
                <th
                  className="py-3 pl-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('totalRevenue')}
                >
                  Total Revenue {renderSortIcon('totalRevenue')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No products match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((item) => {
                  const isCompared = compareIds.includes(item.product.id);
                  return (
                    <tr
                      key={item.product.id}
                      onClick={() => toggleProductCompare(item.product.id)}
                      className={`cursor-pointer transition-colors ${
                        isCompared ? 'bg-blue-600/10 hover:bg-blue-600/15' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductCompare(item.product.id);
                          }}
                          className="text-slate-400 hover:text-blue-400"
                          aria-label={`Compare ${item.product.name}`}
                        >
                          {isCompared ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono-tabular font-semibold text-blue-400 whitespace-nowrap">
                        #{item.rank}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{item.product.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-tabular">
                          {item.product.sku} · Stock: {item.product.stockLevel}u · Rating: {item.product.rating}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {item.product.category}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-slate-200 whitespace-nowrap">
                        {item.unitsSold}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-slate-200 whitespace-nowrap">
                        {formatCurrency(item.averageSellingPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-emerald-400 whitespace-nowrap">
                        {item.grossMarginPct}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular whitespace-nowrap">
                        <span
                          className={
                            item.revenueGrowthPct >= 8
                              ? 'text-emerald-400 font-medium'
                              : item.revenueGrowthPct <= -10
                              ? 'text-amber-400 font-medium'
                              : 'text-slate-300'
                          }
                        >
                          {item.revenueGrowthPct >= 0 ? '+' : ''}
                          {item.revenueGrowthPct}% · {item.trend}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right font-mono-tabular font-semibold text-white whitespace-nowrap">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
