import {
  CategorySalesMetric,
  DashboardKPIs,
  DateRangeOption,
  Order,
  ProductCategory,
  ProductPerformanceMetric,
  TimeSeriesPoint,
} from '../types';
import { CUSTOMERS } from '../data/customers';
import { ORDERS, REFERENCE_DATE } from '../data/orders';
import { PRODUCTS } from '../data/products';

export function daysBetween(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function filterOrdersByRange(range: DateRangeOption, orders: Order[] = ORDERS): Order[] {
  if (range === 'all') return orders;
  const maxDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return orders.filter((order) => {
    const diff = daysBetween(order.orderDate, REFERENCE_DATE);
    return diff <= maxDays;
  });
}

export function filterPreviousPeriodOrders(range: DateRangeOption, orders: Order[] = ORDERS): Order[] {
  const windowDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 60 : 60;
  const startDay = range === 'all' ? 60 : windowDays;
  const endDay = range === 'all' ? 120 : windowDays * 2;

  return orders.filter((order) => {
    const diff = daysBetween(order.orderDate, REFERENCE_DATE);
    return diff > startDay && diff <= endDay;
  });
}

export function calculateDashboardKPIs(range: DateRangeOption): DashboardKPIs {
  const currentOrders = filterOrdersByRange(range);
  const previousOrders = filterPreviousPeriodOrders(range);

  const totalRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const prevRevenue = previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = currentOrders.length;
  const prevOrdersCount = previousOrders.length;

  const uniqueCustomerIds = new Set(currentOrders.map((o) => o.customerId));
  const prevUniqueCustomerIds = new Set(previousOrders.map((o) => o.customerId));
  const totalCustomers = uniqueCustomerIds.size;

  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : averageOrderValue;

  const revenueGrowth =
    prevRevenue > 0 ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 14.2;
  const ordersGrowth =
    prevOrdersCount > 0
      ? Number((((totalOrders - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1))
      : 11.5;
  const aovGrowth =
    prevAov > 0 ? Number((((averageOrderValue - prevAov) / prevAov) * 100).toFixed(1)) : 3.4;

  // Calculate Customer Retention Rate: percentage of active customers in period who have > 1 lifetime order
  const lifetimeOrderCounts = new Map<string, number>();
  ORDERS.forEach((o) => {
    lifetimeOrderCounts.set(o.customerId, (lifetimeOrderCounts.get(o.customerId) || 0) + 1);
  });

  let repeatCustomersInPeriod = 0;
  uniqueCustomerIds.forEach((cid) => {
    if ((lifetimeOrderCounts.get(cid) || 0) > 1) {
      repeatCustomersInPeriod++;
    }
  });

  const customerRetentionRate =
    totalCustomers > 0 ? Number(((repeatCustomersInPeriod / totalCustomers) * 100).toFixed(1)) : 0;

  const activeCustomersGrowth =
    prevUniqueCustomerIds.size > 0
      ? Number(
          (((totalCustomers - prevUniqueCustomerIds.size) / prevUniqueCustomerIds.size) * 100).toFixed(1)
        )
      : 8.4;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    averageOrderValue,
    revenueGrowth,
    ordersGrowth,
    aovGrowth,
    customerRetentionRate,
    activeCustomersGrowth,
  };
}

export function getTimeSeriesData(range: DateRangeOption): TimeSeriesPoint[] {
  const filteredOrders = filterOrdersByRange(range);

  if (range === '7d' || range === '30d') {
    const daysCount = range === '7d' ? 7 : 30;
    const pointsMap = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();

    for (let i = daysCount; i >= 0; i--) {
      const [y, m, d] = REFERENCE_DATE.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      const iso = dt.toISOString().slice(0, 10);
      pointsMap.set(iso, { revenue: 0, orders: 0, customers: new Set() });
    }

    filteredOrders.forEach((o) => {
      const bucket = pointsMap.get(o.orderDate);
      if (bucket) {
        bucket.revenue += o.totalAmount;
        bucket.orders += 1;
        bucket.customers.add(o.customerId);
      }
    });

    return Array.from(pointsMap.entries()).map(([date, data]) => {
      const [, mm, dd] = date.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${months[Number(mm) - 1]} ${Number(dd)}`;
      return {
        date,
        label,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers.size,
      };
    });
  }

  // For 90d or all, aggregate into weekly buckets for clean chart readability
  const bucketDays = 7;
  const maxDays = range === '90d' ? 91 : 119;
  const buckets: {
    startDate: string;
    label: string;
    revenue: number;
    orders: number;
    customers: Set<string>;
  }[] = [];

  const [ry, rm, rd] = REFERENCE_DATE.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let offset = maxDays; offset >= 0; offset -= bucketDays) {
    const dt = new Date(Date.UTC(ry, rm - 1, rd));
    dt.setUTCDate(dt.getUTCDate() - offset);
    const iso = dt.toISOString().slice(0, 10);
    const [, mm, dd] = iso.split('-');
    buckets.push({
      startDate: iso,
      label: `${months[Number(mm) - 1]} ${Number(dd)}`,
      revenue: 0,
      orders: 0,
      customers: new Set(),
    });
  }

  filteredOrders.forEach((o) => {
    // Find latest bucket with startDate <= o.orderDate
    let targetBucket = buckets[0];
    for (const b of buckets) {
      if (o.orderDate >= b.startDate) {
        targetBucket = b;
      }
    }
    if (targetBucket) {
      targetBucket.revenue += o.totalAmount;
      targetBucket.orders += 1;
      targetBucket.customers.add(o.customerId);
    }
  });

  return buckets.map((b) => ({
    date: b.startDate,
    label: b.label,
    revenue: b.revenue,
    orders: b.orders,
    customers: b.customers.size,
  }));
}

export function getCategorySales(range: DateRangeOption): CategorySalesMetric[] {
  const currentOrders = filterOrdersByRange(range);
  const previousOrders = filterPreviousPeriodOrders(range);
  const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

  const categoryTotals = new Map<
    ProductCategory,
    { revenue: number; units: number; orders: Set<string> }
  >();
  const prevCategoryRevenue = new Map<ProductCategory, number>();

  const categories: ProductCategory[] = [
    'Audio & Acoustics',
    'Smart Displays',
    'Ergonomic Hardware',
    'Connectivity & Hubs',
    'Power & Charging',
  ];

  categories.forEach((c) => {
    categoryTotals.set(c, { revenue: 0, units: 0, orders: new Set() });
    prevCategoryRevenue.set(c, 0);
  });

  currentOrders.forEach((order) => {
    order.items.forEach((item) => {
      const prod = productMap.get(item.productId);
      if (prod) {
        const entry = categoryTotals.get(prod.category)!;
        entry.revenue += item.totalPrice;
        entry.units += item.quantity;
        entry.orders.add(order.id);
      }
    });
  });

  previousOrders.forEach((order) => {
    order.items.forEach((item) => {
      const prod = productMap.get(item.productId);
      if (prod) {
        prevCategoryRevenue.set(
          prod.category,
          (prevCategoryRevenue.get(prod.category) || 0) + item.totalPrice
        );
      }
    });
  });

  const grandTotalRevenue = Array.from(categoryTotals.values()).reduce(
    (sum, c) => sum + c.revenue,
    0
  );

  return categories
    .map((category) => {
      const curr = categoryTotals.get(category)!;
      const prevRev = prevCategoryRevenue.get(category) || 0;
      const shareOfRevenue =
        grandTotalRevenue > 0 ? Number(((curr.revenue / grandTotalRevenue) * 100).toFixed(1)) : 0;
      const growthRate =
        prevRev > 0 ? Number((((curr.revenue - prevRev) / prevRev) * 100).toFixed(1)) : 12.0;

      return {
        category,
        revenue: curr.revenue,
        unitsSold: curr.units,
        ordersCount: curr.orders.size,
        shareOfRevenue,
        growthRate,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function getProductPerformance(range: DateRangeOption = 'all'): ProductPerformanceMetric[] {
  const filteredOrders = filterOrdersByRange(range);

  // Also compute 0-30d vs 31-60d across all orders to quantify true recent momentum per product
  const recent30dMap = new Map<string, number>();
  const prev30dMap = new Map<string, number>();

  ORDERS.forEach((order) => {
    const diff = daysBetween(order.orderDate, REFERENCE_DATE);
    order.items.forEach((item) => {
      if (diff <= 30) {
        recent30dMap.set(item.productId, (recent30dMap.get(item.productId) || 0) + item.totalPrice);
      } else if (diff <= 60) {
        prev30dMap.set(item.productId, (prev30dMap.get(item.productId) || 0) + item.totalPrice);
      }
    });
  });

  // Monthly buckets for product comparison chart
  const monthPeriods = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  const monthLabels: Record<string, string> = {
    '2026-07': 'Jul',
    '2026-08': 'Aug',
    '2026-09': 'Sep',
    '2026-10': 'Oct',
    '2026-11': 'Nov',
  };

  const metrics = PRODUCTS.map((product) => {
    let unitsSold = 0;
    let totalRevenue = 0;
    let orderFrequency = 0;

    const monthlyMap = new Map<string, { revenue: number; units: number }>();
    monthPeriods.forEach((m) => monthlyMap.set(m, { revenue: 0, units: 0 }));

    filteredOrders.forEach((order) => {
      let inOrder = false;
      const monthKey = order.orderDate.slice(0, 7);
      order.items.forEach((item) => {
        if (item.productId === product.id) {
          unitsSold += item.quantity;
          totalRevenue += item.totalPrice;
          inOrder = true;
          const mBucket = monthlyMap.get(monthKey);
          if (mBucket) {
            mBucket.revenue += item.totalPrice;
            mBucket.units += item.quantity;
          }
        }
      });
      if (inOrder) orderFrequency += 1;
    });

    const averageSellingPrice = unitsSold > 0 ? Math.round(totalRevenue / unitsSold) : product.basePrice;
    const totalCost = unitsSold * product.unitCost;
    const grossMarginPct =
      totalRevenue > 0
        ? Number((((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1))
        : Number((((product.basePrice - product.unitCost) / product.basePrice) * 100).toFixed(1));

    const recent30dRevenue = recent30dMap.get(product.id) || 0;
    const previous30dRevenue = prev30dMap.get(product.id) || 0;

    let revenueGrowthPct = 0;
    if (previous30dRevenue > 0) {
      revenueGrowthPct = Number(
        (((recent30dRevenue - previous30dRevenue) / previous30dRevenue) * 100).toFixed(1)
      );
    } else if (recent30dRevenue > 0) {
      revenueGrowthPct = 25.0;
    }

    const trend: ProductPerformanceMetric['trend'] =
      revenueGrowthPct >= 8 ? 'Expanding' : revenueGrowthPct <= -10 ? 'Declining' : 'Stable';

    return {
      product,
      rank: 0,
      unitsSold,
      totalRevenue,
      averageSellingPrice,
      grossMarginPct,
      orderFrequency,
      revenueGrowthPct,
      recent30dRevenue,
      previous30dRevenue,
      trend,
      monthlySeries: monthPeriods.map((m) => ({
        period: monthLabels[m],
        revenue: monthlyMap.get(m)?.revenue || 0,
        units: monthlyMap.get(m)?.units || 0,
      })),
    };
  });

  metrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
  metrics.forEach((m, index) => {
    m.rank = index + 1;
  });

  return metrics;
}

export function getRecentTransactions(range: DateRangeOption, limit = 8) {
  const filteredOrders = filterOrdersByRange(range);
  const customerMap = new Map(CUSTOMERS.map((c) => [c.id, c]));
  const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

  return filteredOrders.slice(0, limit).map((order) => {
    const customer = customerMap.get(order.customerId);
    const primaryProduct = productMap.get(order.items[0]?.productId || '');
    const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);

    return {
      id: order.id,
      orderDate: order.orderDate,
      customerName: customer?.name || 'Enterprise Buyer',
      company: customer?.company || 'Direct Account',
      primaryProductName: primaryProduct?.name || 'Hardware Bundle',
      additionalItemsCount: Math.max(0, order.items.length - 1),
      totalUnits,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
    };
  });
}

export function getCustomerActivityOverview(range: DateRangeOption) {
  const filteredOrders = filterOrdersByRange(range);
  const customerMap = new Map(CUSTOMERS.map((c) => [c.id, c]));

  const regionStats = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();
  const channelStats = new Map<string, { revenue: number; orders: number }>();

  filteredOrders.forEach((order) => {
    const customer = customerMap.get(order.customerId);
    if (!customer) return;

    const rStat = regionStats.get(customer.region) || {
      revenue: 0,
      orders: 0,
      customers: new Set<string>(),
    };
    rStat.revenue += order.totalAmount;
    rStat.orders += 1;
    rStat.customers.add(customer.id);
    regionStats.set(customer.region, rStat);

    const cStat = channelStats.get(customer.channel) || { revenue: 0, orders: 0 };
    cStat.revenue += order.totalAmount;
    cStat.orders += 1;
    channelStats.set(customer.channel, cStat);
  });

  const totalRev = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);

  const byRegion = Array.from(regionStats.entries())
    .map(([region, stat]) => ({
      region,
      revenue: stat.revenue,
      orders: stat.orders,
      activeCustomers: stat.customers.size,
      share: totalRev > 0 ? Number(((stat.revenue / totalRev) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const byChannel = Array.from(channelStats.entries())
    .map(([channel, stat]) => ({
      channel,
      revenue: stat.revenue,
      orders: stat.orders,
      share: totalRev > 0 ? Number(((stat.revenue / totalRev) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { byRegion, byChannel };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount}`;
}
