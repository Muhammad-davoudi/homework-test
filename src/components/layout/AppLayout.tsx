import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  Sparkles,
  Lightbulb,
  MessageSquareText,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Download,
  CheckCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { generateBusinessInsights } from '../../services/insights';
import { calculateDashboardKPIs, formatCurrency } from '../../services/analytics';
import { ORDERS } from '../../data/orders';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  breadcrumb: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    icon: LayoutDashboard,
    breadcrumb: 'Analytics / Overview Dashboard',
  },
  {
    label: 'Product Analytics',
    path: '/products',
    icon: PackageSearch,
    breadcrumb: 'Catalog / Product Performance & Comparison',
  },
  {
    label: 'Customer Segmentation',
    path: '/customers',
    icon: Users,
    breadcrumb: 'Cohorts / RFM Customer Segmentation',
  },
  {
    label: 'AI Insights',
    path: '/insights',
    icon: Sparkles,
    breadcrumb: 'Intelligence / Automated Business Insights',
  },
  {
    label: 'Recommendations',
    path: '/recommendations',
    icon: Lightbulb,
    breadcrumb: 'Decision Support / Smart Recommendations',
  },
  {
    label: 'AI Assistant',
    path: '/assistant',
    icon: MessageSquareText,
    breadcrumb: 'Conversational BI / Dataset Query Assistant',
  },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('aipi_sidebar_collapsed', false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useLocalStorage<string[]>('aipi_read_notifs', []);

  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const insights = generateBusinessInsights();
  const kpisAll = calculateDashboardKPIs('all');

  const notifications = insights.slice(0, 4).map((ins) => ({
    id: ins.id,
    title: ins.title,
    metric: ins.supportingMetric,
    priority: ins.priority,
    route: ins.relatedRoute,
    isRead: readNotifIds.includes(ins.id),
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const currentNav =
    NAV_ITEMS.find((item) => location.pathname === item.path) || {
      label: 'Workspace',
      path: location.pathname,
      breadcrumb: 'Workspace / Navigation',
    };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setReadNotifIds(notifications.map((n) => n.id));
  };

  const handleNotificationClick = (id: string, route: string) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds([...readNotifIds, id]);
    }
    setNotifOpen(false);
    navigate(route);
  };

  const handleExportDatasetCSV = () => {
    const headers = ['OrderID', 'OrderDate', 'CustomerID', 'Status', 'PaymentMethod', 'ItemsCount', 'TotalAmountUSD'];
    const rows = ORDERS.map((o) => [
      o.id,
      o.orderDate,
      o.customerId,
      o.status,
      `"${o.paymentMethod}"`,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.totalAmount,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ai_product_intelligence_orders_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0F1626] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'}`}
      >
        {/* Top Brand & Collapse */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                PI
              </div>
              {!isCollapsed && (
                <span className="font-semibold text-base tracking-tight text-white whitespace-nowrap truncate">
                  AI Product Intelligence
                </span>
              )}
            </NavLink>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Items */}
          <nav className="p-3 space-y-1" aria-label="Primary Sidebar Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>

          {/* User Profile Section in Sidebar */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left ${
                isCollapsed ? 'justify-center' : ''
              }`}
              aria-label="User Profile Menu"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                MD
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">Alex Morgan</p>
                  <p className="text-[11px] text-slate-400 truncate">VP of Product Strategy</p>
                </div>
              )}
            </button>

            {profileOpen && (
              <div className="absolute bottom-14 left-0 w-64 bg-[#111827] border border-slate-800 rounded-xl shadow-xl p-4 z-50">
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">Alex Morgan</p>
                      <p className="text-[11px] text-slate-400">Enterprise Analytics Workspace</p>
                    </div>
                  </div>
                </div>
                <div className="py-3 space-y-1.5 text-xs text-slate-300 border-b border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dataset Orders</span>
                    <span className="font-mono-tabular text-slate-200">{kpisAll.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Accounts</span>
                    <span className="font-mono-tabular text-slate-200">{kpisAll.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cumulative GMV</span>
                    <span className="font-mono-tabular text-slate-200">
                      {formatCurrency(kpisAll.totalRevenue)}
                    </span>
                  </div>
                </div>
                <div className="pt-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/assistant');
                    }}
                    className="w-full px-3 py-1.5 text-xs font-medium text-left text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    Open AI Query Assistant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      handleExportDatasetCSV();
                    }}
                    className="w-full px-3 py-1.5 text-xs font-medium text-left text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Download Orders CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb trail on left, primary actions on right */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-slate-400 truncate">
              <span className="text-slate-200 font-semibold">{currentNav.label}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="hidden sm:inline text-xs text-slate-400">{currentNav.breadcrumb}</span>
            </div>
          </div>

          {/* Right Action Controls: Notifications + CSV Export */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                aria-label="View Analytical Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-blue-600 text-[10px] font-mono-tabular font-semibold text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-white">
                      Intelligence Alerts ({unreadCount} unread)
                    </span>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n.id, n.route)}
                        className={`w-full text-left py-3 px-2 hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 ${
                          n.isRead ? 'opacity-65' : ''
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-medium text-slate-100 leading-snug">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono-tabular">
                            {n.metric} · {n.priority} Priority
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportDatasetCSV}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
