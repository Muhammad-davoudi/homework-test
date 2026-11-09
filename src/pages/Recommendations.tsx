import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquareText,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { PriorityLevel, SmartRecommendation } from '../types';
import { generateSmartRecommendations } from '../services/recommendations';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PRIORITY_OPTIONS: ('All' | PriorityLevel)[] = ['All', 'High', 'Medium', 'Low'];

export const Recommendations: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState<'All' | PriorityLevel>('All');
  const [statusMap, setStatusMap] = useLocalStorage<
    Record<string, 'Pending' | 'In Review' | 'Approved'>
  >('aipi_rec_statuses', {
    'REC-001': 'In Review',
    'REC-002': 'Approved',
  });

  const navigate = useNavigate();
  const baseRecommendations = useMemo(() => generateSmartRecommendations(), []);

  const recommendations: SmartRecommendation[] = useMemo(
    () =>
      baseRecommendations.map((rec) => ({
        ...rec,
        status: statusMap[rec.id] || 'Pending',
      })),
    [baseRecommendations, statusMap]
  );

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(
      (r) => selectedPriority === 'All' || r.priority === selectedPriority
    );
  }, [recommendations, selectedPriority]);

  const handleStatusChange = (
    id: string,
    newStatus: 'Pending' | 'In Review' | 'Approved'
  ) => {
    setStatusMap((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
  };

  const approvedCount = recommendations.filter((r) => r.status === 'Approved').length;
  const inReviewCount = recommendations.filter((r) => r.status === 'In Review').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Actionable Smart Recommendations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Decision-support playbooks synthesized from RFM cohort churn risk, product velocity, and basket co-occurrence metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
            {PRIORITY_OPTIONS.map((p) => (
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

          <button
            type="button"
            onClick={() => setStatusMap({})}
            className="p-2 text-slate-400 hover:text-white bg-[#111827] border border-slate-800 rounded-lg transition-colors"
            title="Reset recommendation workflow statuses"
            aria-label="Reset recommendation workflow statuses"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executive Summary Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Active Playbooks</span>
          <p className="text-2xl font-bold text-white font-mono-tabular mt-2">
            {recommendations.length} Recommendations
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized by expected revenue & retention lift
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Approved for Execution</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono-tabular mt-2">
            {approvedCount} Approved · {inReviewCount} In Review
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Decision statuses saved locally in your workspace
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Estimated Quarterly Value Lift</span>
          <p className="text-2xl font-bold text-blue-400 font-mono-tabular mt-2">
            +$68,400 Projected
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Combined recovery, AOV bundle, and cohort expansion
          </p>
        </div>
      </section>

      {/* Recommendations List */}
      <section className="space-y-5">
        {filteredRecommendations.map((rec) => {
          const priorityColor =
            rec.priority === 'High'
              ? 'text-amber-400'
              : rec.priority === 'Medium'
              ? 'text-blue-400'
              : 'text-emerald-400';

          return (
            <article
              key={rec.id}
              className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 space-y-5"
            >
              {/* Top Metadata & Workflow Status Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono-tabular text-slate-500">{rec.id}</span>
                  <span>·</span>
                  <span className="font-medium text-slate-200">{rec.domain}</span>
                  <span>·</span>
                  <span className={`font-semibold ${priorityColor}`}>
                    {rec.priority} Priority
                  </span>
                  <span>·</span>
                  <span className="font-mono-tabular text-emerald-400 font-medium">
                    {rec.quantifiedLift}
                  </span>
                </div>

                {/* Interactive Status Selector */}
                <div className="inline-flex items-center gap-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-lg self-start sm:self-auto">
                  {(['Pending', 'In Review', 'Approved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(rec.id, st)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        rec.status === st
                          ? st === 'Approved'
                            ? 'bg-emerald-600 text-white'
                            : st === 'In Review'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Title, Explanation, Impact, Next Action (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {rec.title}
                  </h2>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rec.explanation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Related Metric</span>
                      <span className="text-xs font-semibold text-white font-mono-tabular mt-1 block">
                        {rec.relatedMetric}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Expected Business Impact</span>
                      <span className="text-xs font-medium text-emerald-400 mt-1 block">
                        {rec.expectedImpact}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-xs">
                    <span className="font-semibold text-blue-400">Suggested Next Action: </span>
                    <span className="text-slate-200">{rec.suggestedNextAction}</span>
                  </div>
                </div>

                {/* Right Column: Concrete Implementation Steps (5 cols) */}
                <div className="lg:col-span-5 bg-[#0B0F19]/80 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Execution Playbook Steps</span>
                      </span>
                      <span className="text-slate-400 font-mono-tabular">
                        {rec.status === 'Approved' ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-slate-400 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {rec.status}
                          </span>
                        )}
                      </span>
                    </div>

                    <ol className="space-y-2.5 text-xs text-slate-300">
                      {rec.implementationSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="font-mono-tabular text-blue-400 font-semibold shrink-0">
                            0{idx + 1}.
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          rec.domain === 'Customer Retention' || rec.domain === 'VIP Expansion'
                            ? '/customers'
                            : '/products'
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Open Target Cohort / Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/assistant?q=${encodeURIComponent(rec.title)}`
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>Simulate in AI Assistant</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
