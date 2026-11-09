import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2,
  Database,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { assistantEngine, SUGGESTED_QUESTIONS } from '../services/assistant';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateDashboardKPIs, formatCurrency } from '../services/analytics';
import { PRODUCTS } from '../data/products';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'MSG-WELCOME',
  role: 'assistant',
  content:
    'Welcome to the **AI Product Intelligence Assistant**. I analyze your live e-commerce dataset—covering **24 products**, **115 enterprise & prosumer accounts**, **360+ orders**, and **RFM segmentation cohorts**—to provide instant, explainable answers. Select a suggested question below or ask any question about revenue, products, or customer segments.',
  timestamp: '08:00 AM',
  keyMetrics: [
    { label: 'Catalog SKUs', value: `${PRODUCTS.length} Products`, delta: '5 Categories' },
    {
      label: 'Cumulative GMV',
      value: formatCurrency(calculateDashboardKPIs('all').totalRevenue),
      delta: `${calculateDashboardKPIs('all').totalOrders} Verified Orders`,
    },
    {
      label: 'Repeat Retention',
      value: `${calculateDashboardKPIs('all').customerRetentionRate}%`,
      delta: '6 RFM Segments',
    },
  ],
  followUpSuggestions: SUGGESTED_QUESTIONS.slice(0, 4),
};

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(
    'aipi_assistant_history_v1',
    [INITIAL_WELCOME_MESSAGE]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedQueryRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Brief realistic analytical computation delay
    await new Promise((resolve) => setTimeout(resolve, 320));

    try {
      const response = await assistantEngine.query(trimmed);
      const assistantMsg: ChatMessage = {
        ...response,
        id: `AST-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Support deep-linked queries via ?q=...
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && processedQueryRef.current !== qParam) {
      processedQueryRef.current = qParam;
      setSearchParams({}, { replace: true });
      handleSendQuestion(qParam);
    }
  }, [searchParams]);

  const handleClearConversation = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion(input);
    }
  };

  // Simple markdown bold parser for clean typography without external dependencies
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      if (!line.trim()) return <div key={lineIdx} className="h-2" />;
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lineIdx} className="leading-relaxed">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] min-h-[600px] space-y-4">
      {/* Header & Clear Conversation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Conversational BI & Dataset Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Deterministic Analytical Engine connected to local Orders, Products, and RFM Segmentation tables
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearConversation}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Conversation</span>
        </button>
      </div>

      {/* Quick Suggested Questions Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Suggested:</span>
        </span>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendQuestion(q)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#111827] hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation History Viewport */}
      <div className="flex-1 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-xl p-4 space-y-4 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0B0F19] border border-slate-800/90 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className={isUser ? 'text-blue-100 font-medium' : 'text-blue-400 font-semibold'}>
                    {isUser ? 'You (Executive Query)' : 'AI Product Intelligence Engine'}
                  </span>
                  <span className={`font-mono-tabular ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                <div className="text-xs sm:text-sm space-y-1.5">
                  {renderFormattedText(msg.content)}
                </div>

                {/* Key Metrics Strip if present */}
                {msg.keyMetrics && msg.keyMetrics.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {msg.keyMetrics.map((km, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#111827] border border-slate-800/80"
                      >
                        <span className="text-[11px] text-slate-400 block truncate">
                          {km.label}
                        </span>
                        <span className="text-sm font-bold text-white font-mono-tabular mt-1 block">
                          {km.value}
                        </span>
                        {km.delta && (
                          <span className="text-[11px] text-blue-400 font-mono-tabular mt-0.5 block">
                            {km.delta}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Related Data Rows if present */}
                {msg.relatedDataRows && msg.relatedDataRows.length > 0 && (
                  <div className="border-t border-slate-800/80 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 mb-2">
                      Supporting Dataset Breakdown
                    </p>
                    <div className="divide-y divide-slate-800/70">
                      {msg.relatedDataRows.map((row, idx) => (
                        <div
                          key={idx}
                          className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                        >
                          <span className="font-medium text-slate-200">{row.name}</span>
                          <div className="font-mono-tabular text-right">
                            <span className="font-semibold text-white">{row.primary}</span>
                            <span className="text-slate-500 mx-1.5">·</span>
                            <span className="text-slate-400 text-[11px]">{row.secondary}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Question Prompts */}
                {!isUser && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400">Follow-up:</span>
                    {msg.followUpSuggestions.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSendQuestion(followUp)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors text-left"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 font-mono-tabular">
              Querying orders, product velocity, and RFM cohorts...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion(input);
        }}
        className="bg-[#111827] border border-slate-800/90 rounded-xl p-3 flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about top-selling products, declining SKUs, RFM customer segments, revenue growth, or retention..."
          className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
