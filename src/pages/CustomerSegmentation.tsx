import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Info, RotateCcw } from 'lucide-react';
import { RFMSegmentName } from '../types';
import { calculateRFMSegmentation } from '../services/segmentation';
import { formatCompactCurrency, formatCurrency } from '../services/analytics';

type CustomerSortField =
  | 'name'
  | 'recencyDays'
  | 'frequency'
  | 'monetary'
  | 'averageOrderValue'
  | 'rfmComposite';

const ALL_SEGMENTS: ('All' | RFMSegmentName)[] = [
  'All',
  'Champions',
  'Loyal Customers',
  'Potential Loyalists',
  'New Customers',
  'At Risk',
  'Hibernating',
];

export const CustomerSegmentation: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<'All' | RFMSegmentName>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<CustomerSortField>('monetary');
  const [sortAsc, setSortAsc] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const { records, summaries } = useMemo(() => calculateRFMSegmentation(), []);

  const totalCustomers = records.length;
  const totalRevenue = summaries.reduce((s, seg) => s + seg.totalRevenue, 0);
  const overallAvgCustomerValue =
    totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = records.filter((rec) => {
      const matchesSegment = selectedSegment === 'All' || rec.segment === selectedSegment;
      const matchesRegion =
        selectedRegion === 'All' || rec.customer.region === selectedRegion;
      const matchesSearch =
        !q ||
        rec.customer.name.toLowerCase().includes(q) ||
        rec.customer.company.toLowerCase().includes(q) ||
        rec.customer.email.toLowerCase().includes(q) ||
        rec.customer.id.toLowerCase().includes(q);
      return matchesSegment && matchesRegion && matchesSearch;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.customer.name.localeCompare(b.customer.name);
      else if (sortField === 'recencyDays') cmp = a.recencyDays - b.recencyDays;
      else if (sortField === 'frequency') cmp = a.frequency - b.frequency;
      else if (sortField === 'monetary') cmp = a.monetary - b.monetary;
      else if (sortField === 'averageOrderValue')
        cmp = a.averageOrderValue - b.averageOrderValue;
      else if (sortField === 'rfmComposite')
        cmp = a.rfmComposite.localeCompare(b.rfmComposite);
      return sortAsc ? cmp : -cmp;
    });

    return filtered;
  }, [records, selectedSegment, selectedRegion, searchQuery, sortField, sortAsc]);

  const handleSort = (field: CustomerSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'recencyDays' || field === 'name');
    }
  };

  const renderSortIcon = (field: CustomerSortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 inline ml-1" />;
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            RFM Customer Segmentation & Cohort Value
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic Recency, Frequency, and Monetary (RFM) segmentation computed across all {totalCustomers} accounts (Avg LTV: <span className="font-mono-tabular text-slate-200">{formatCurrency(overallAvgCustomerValue)}</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMethodology(!showMethodology)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Info className="w-4 h-4" />
          <span>{showMethodology ? 'Hide RFM Scoring Rules' : 'View RFM Scoring Rules'}</span>
        </button>
      </div>

      {/* Documented RFM Segmentation Rules Drawer */}
      {showMethodology && (
        <section className="bg-[#111827] border border-blue-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Explainable RFM Scoring & Classification Rules (Reference Date: 2026-11-09)
            </h2>
            <span className="text-xs font-mono-tabular text-slate-400">
              1–5 Quintile Scale per Dimension
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-lg bg-[#0B0F19] border border-slate-800">
              <p className="font-semibold text-white mb-1.5">Recency Score (R: 1–5)</p>
              <p className="text-slate-400 leading-relaxed font-mono-tabular">
                R=5: ≤ 12 days since last order<br />
                R=4: 13–24 days<br />
                R=3: 25–40 days<br />
                R=2: 41–68 days<br />
                R=1: &gt; 68 days
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0B0F19] border border-slate-800">
              <p className="font-semibold text-white mb-1.5">Frequency Score (F: 1–5)</p>
              <p className="text-slate-400 leading-relaxed font-mono-tabular">
                F=5: ≥ 5 lifetime orders<br />
                F=4: 4 orders<br />
                F=3: 3 orders<br />
                F=2: 2 orders<br />
                F=1: 1 order
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0B0F19] border border-slate-800">
              <p className="font-semibold text-white mb-1.5">Monetary Score (M: 1–5)</p>
              <p className="text-slate-400 leading-relaxed font-mono-tabular">
                M=5: ≥ $5,500 cumulative spend<br />
                M=4: $3,200 – $5,499<br />
                M=3: $1,800 – $3,199<br />
                M=2: $850 – $1,799<br />
                M=1: &lt; $850
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Segment Summary Cards (Interactive Filter Cards) */}
      <section aria-label="RFM Segment Summaries" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaries.map((seg) => {
          const isSelected = selectedSegment === seg.segment;
          return (
            <button
              key={seg.segment}
              type="button"
              onClick={() =>
                setSelectedSegment(isSelected ? 'All' : seg.segment)
              }
              className={`text-left p-5 rounded-xl border transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500'
                  : 'bg-[#111827] border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">
                    {seg.segment}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white font-mono-tabular">
                    {seg.customerCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono-tabular ml-1.5">
                    ({seg.shareOfCustomers}%)
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] font-mono-tabular">
                <div className="flex justify-between text-slate-300">
                  <span>Revenue:</span>
                  <span className="font-semibold text-white">
                    {formatCompactCurrency(seg.totalRevenue)} ({seg.shareOfRevenue}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg LTV:</span>
                  <span>{formatCurrency(seg.averageCustomerValue)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg R / F:</span>
                  <span>
                    {seg.averageRecencyDays}d / {seg.averageFrequency}x
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Two Charts: Customer Distribution by Segment & Revenue Contribution by Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Distribution Chart */}
        <section className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">
                Customer Distribution by Segment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Number of accounts classified in each RFM cohort
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              {totalCustomers} Total Customers
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="segment"
                  stroke="#94A3B8"
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
                  formatter={(val: unknown) => [`${Number(val)} customers`, 'Accounts']}
                />
                <Bar dataKey="customerCount" radius={[4, 4, 0, 0]} barSize={32}>
                  {summaries.map((s) => (
                    <Cell key={s.segment} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Revenue Contribution by Segment Chart */}
        <section className="lg:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">
                Revenue Contribution by Segment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative monetary value generated by each RFM cohort
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              {formatCurrency(totalRevenue)} Total GMV
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaries}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 20, bottom: 0 }}
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
                  dataKey="segment"
                  stroke="#94A3B8"
                  fontSize={11}
                  width={120}
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
                  formatter={(val: unknown) => [formatCurrency(Number(val)), 'Segment Revenue']}
                />
                <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]} barSize={22}>
                  {summaries.map((s) => (
                    <Cell key={s.segment} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Customer Segmentation Table & Filters */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, company, email, or ID..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F19] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Segment & Region Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg overflow-x-auto max-w-full">
              {ALL_SEGMENTS.map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setSelectedSegment(seg)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedSegment === seg
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              aria-label="Filter by region"
              className="px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Regions</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="Latin America">Latin America</option>
            </select>

            {(selectedSegment !== 'All' || selectedRegion !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSegment('All');
                  setSelectedRegion('All');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Segment Rule Explanation Banner */}
        {selectedSegment !== 'All' && (
          <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-white">{selectedSegment}: </span>
              <span className="text-slate-300">
                {summaries.find((s) => s.segment === selectedSegment)?.description}
              </span>
            </div>
            <span className="font-mono-tabular text-blue-400 shrink-0">
              {summaries.find((s) => s.segment === selectedSegment)?.ruleCriteria}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 select-none">
                <th
                  className="py-3 pr-3 cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('name')}
                >
                  Customer & Company {renderSortIcon('name')}
                </th>
                <th className="py-3 px-3 whitespace-nowrap">RFM Segment</th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('rfmComposite')}
                >
                  RFM Score {renderSortIcon('rfmComposite')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('recencyDays')}
                >
                  Recency (Days) {renderSortIcon('recencyDays')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('frequency')}
                >
                  Frequency (Orders) {renderSortIcon('frequency')}
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('averageOrderValue')}
                >
                  Avg Order Value {renderSortIcon('averageOrderValue')}
                </th>
                <th
                  className="py-3 pl-3 text-right cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('monetary')}
                >
                  Monetary Value {renderSortIcon('monetary')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No customers match your current segment or search filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((rec) => (
                  <tr
                    key={rec.customer.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-3">
                      <div className="font-medium text-white">
                        {rec.customer.name}{' '}
                        <span className="font-mono-tabular text-slate-500 text-[11px] ml-1">
                          {rec.customer.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rec.customer.company} · {rec.customer.region} · {rec.customer.channel}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            summaries.find((s) => s.segment === rec.segment)?.color ||
                            '#E2E8F0',
                        }}
                      >
                        {rec.segment}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-slate-200 whitespace-nowrap">
                      R{rec.rScore} · F{rec.fScore} · M{rec.mScore}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-slate-300 whitespace-nowrap">
                      {rec.recencyDays}d{' '}
                      <span className="text-slate-500 text-[11px]">({rec.lastOrderDate})</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-slate-200 whitespace-nowrap">
                      {rec.frequency}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-slate-300 whitespace-nowrap">
                      {formatCurrency(rec.averageOrderValue)}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-tabular font-semibold text-white whitespace-nowrap">
                      {formatCurrency(rec.monetary)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
