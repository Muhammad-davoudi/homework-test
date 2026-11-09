import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, LayoutDashboard, PackageSearch, Users } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#111827] border border-slate-800 rounded-2xl p-8 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono-tabular font-semibold text-blue-400">
            404 · Route Not Found
          </p>
          <h1 className="text-2xl font-bold text-white">
            This analytical view does not exist
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The URL you requested is outside the configured AI Product Intelligence routes. Choose one of the verified platform modules below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link
            to="/dashboard"
            className="p-3 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-blue-500/50 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Overview</p>
            <p className="text-[11px] text-slate-400">/dashboard</p>
          </Link>
          <Link
            to="/products"
            className="p-3 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-blue-500/50 transition-colors"
          >
            <PackageSearch className="w-4 h-4 text-purple-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Products</p>
            <p className="text-[11px] text-slate-400">/products</p>
          </Link>
          <Link
            to="/customers"
            className="p-3 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-blue-500/50 transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Customers</p>
            <p className="text-[11px] text-slate-400">/customers</p>
          </Link>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Overview Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
