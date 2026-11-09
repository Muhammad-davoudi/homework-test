import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  MessageSquareText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PriorityLevel, BusinessInsight } from '../types';
import { generateBusinessInsights } from '../services/insights';

const PRIORITY_FILTERS: ('All' | PriorityLevel)[] = ['All', 'High', 'Medium', 'Low'];

const CATEGORIES: ('All' | BusinessInsight['category'])[] = [
  'All',
  'Category Shift',
  'Customer Retention',
  'Product Velocity',
  'Revenue & Growth',
  'Pricing & AOV',
];

export const AIInsights: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState<'All' | PriorityLevel>('All');
  const [selectedCategory, setSelectedCategory] =
    useState<'All' | BusinessInsight['category']>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const insights = useMemo(() => generateBusinessInsights(), []);

  const filteredInsights = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return insights.filter((item) => {
      const matchesPriority =
        selectedPriority === 'All' || item.priority === selectedPriority;
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.supportingMetric.toLowerCase().includes(q) ||
        item.suggestedAction.toLowerCase().includes(q);
      return matchesPriority && matchesCategory && matchesSearch;
    });
  }, [insights, selectedPriority, selectedCategory, searchQuery]);

  const highPriorityCount = insights.filter((i) => i.priority === 'High').length;
  const mediumPriorityCount = insights.filter((i) => i.priority === 'Medium').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Automated Business & Product Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Rule-based analytical diagnostics continuously evaluated against live order velocity, product margins, and RFM customer cohorts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/recommendations')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <span>View Smart Recommendations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Diagnostic Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Verified Insights</span>
          <p className="text-2xl font-bold text-white font-mono-tabular mt-2">
            {insights.length} Diagnostics
          </p>
          <p className="text-xs text-slate-400 mt-1">
            100% derived from underlying order & cohort records
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">High-Priority Findings</span>
          <p className="text-2xl font-bold text-amber-400 font-mono-tabular mt-2">
            {highPriorityCount} Critical Areas
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Immediate revenue concentration & retention triggers
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Medium/Low Optimization Signals</span>
          <p className="text-2xl font-bold text-blue-400 font-mono-tabular mt-2">
            {mediumPriorityCount + (insights.length - highPriorityCount - mediumPriorityCount)} Signals
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Catalog rotation and second-order AOV expansion
          </p>
        </div>
      </section>

      {/* Filter Controls */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search insights by metric, SKU, or business impact..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F19] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Priority Segmented Control */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg">
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedPriority === p
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'All' ? 'All Priorities' : `${p} Priority`}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as 'All' | BusinessInsight['category'])
            }
            aria-label="Filter insights by domain"
            className="px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Analytical Domains' : c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Insights Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInsights.length === 0 ? (
          <div className="lg:col-span-2 bg-[#111827] border border-slate-800/90 rounded-xl p-12 text-center text-sm text-slate-400">
            No business insights match your current filter selection.
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const PriorityIcon =
              insight.priority === 'High'
                ? AlertTriangle
                : insight.priority === 'Medium'
                ? TrendingUp
                : CheckCircle2;
            const priorityColor =
              insight.priority === 'High'
                ? 'text-amber-400'
                : insight.priority === 'Medium'
                ? 'text-blue-400'
                : 'text-emerald-400';

            return (
              <article
                key={insight.id}
                className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  {/* Unboxed clean metadata line */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-slate-500">{insight.id}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-300">{insight.category}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-semibold ${priorityColor}`}>
                      <PriorityIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{insight.priority} Priority</span>
                    </div>
                  </div>

                  {/* Insight Title */}
                  <h2 className="text-base font-bold text-white leading-snug">
                    {insight.title}
                  </h2>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                {/* Supporting Metric & Business Impact Details */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#0B0F19] border border-slate-800/80 rounded-lg px-3.5 py-2.5">
                    <span className="text-slate-400">Supporting Metric:</span>
                    <div className="font-mono-tabular">
                      <span className="font-semibold text-white">
                        {insight.supportingMetric}
                      </span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-blue-400">{insight.metricDelta}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-200">Business Impact: </span>
                    <span className="text-slate-400">{insight.businessImpact}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-emerald-400">Suggested Action: </span>
                    <span className="text-slate-200">{insight.suggestedAction}</span>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(insight.relatedRoute)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Inspect Source Data</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/assistant?q=${encodeURIComponent(insight.title)}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>Ask AI Assistant</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
