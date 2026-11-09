import { RFMCustomerRecord, RFMSegmentName, RFMSegmentSummary } from '../types';
import { CUSTOMERS } from '../data/customers';
import { ORDERS, REFERENCE_DATE } from '../data/orders';
import { daysBetween } from './analytics';

export const SEGMENT_METADATA: Record<
  RFMSegmentName,
  { description: string; ruleCriteria: string; color: string }
> = {
  Champions: {
    description: 'High-spend, frequent buyers who purchased very recently.',
    ruleCriteria: 'Recency ≤ 18d (R ≥ 4) · Frequency ≥ 5 orders (F = 5) · Monetary top 25% (M ≥ 4)',
    color: '#3B82F6', // Primary Blue
  },
  'Loyal Customers': {
    description: 'Consistent repeat purchasers with strong lifetime monetary contribution.',
    ruleCriteria: 'Recency ≤ 32d (R ≥ 3) · Frequency 3–5 orders (F ≥ 3) · Monetary M ≥ 3',
    color: '#8B5CF6', // Purple Accent
  },
  'Potential Loyalists': {
    description: 'Recent repeat buyers showing promising order frequency and growing basket size.',
    ruleCriteria: 'Recency ≤ 30d (R ≥ 3) · Frequency 2–3 orders (F ≥ 2) · Moderate spend',
    color: '#06B6D4', // Cyan Accent
  },
  'New Customers': {
    description: 'First-time buyers acquired within the last 21 days with high onboarding potential.',
    ruleCriteria: 'Recency ≤ 21d (R ≥ 4) · Frequency = 1 order (F = 1)',
    color: '#10B981', // Emerald
  },
  'At Risk': {
    description: 'Previously frequent or high-value accounts that have not ordered in over 40 days.',
    ruleCriteria: 'Recency 40–80d (R ≤ 2) · Historical Frequency ≥ 3 orders (F ≥ 3)',
    color: '#F59E0B', // Amber
  },
  Hibernating: {
    description: 'Long-inactive accounts with low historical purchase frequency and low spend.',
    ruleCriteria: 'Recency > 65d (R = 1) · Frequency ≤ 2 orders (F ≤ 2)',
    color: '#64748B', // Slate
  },
};

function scoreRecency(days: number): number {
  if (days <= 12) return 5;
  if (days <= 24) return 4;
  if (days <= 40) return 3;
  if (days <= 68) return 2;
  return 1;
}

function scoreFrequency(count: number): number {
  if (count >= 5) return 5;
  if (count === 4) return 4;
  if (count === 3) return 3;
  if (count === 2) return 2;
  return 1;
}

function scoreMonetary(amount: number): number {
  if (amount >= 5500) return 5;
  if (amount >= 3200) return 4;
  if (amount >= 1800) return 3;
  if (amount >= 850) return 2;
  return 1;
}

function classifyRFMSegment(
  recencyDays: number,
  frequency: number,
  rScore: number,
  fScore: number,
  mScore: number
): RFMSegmentName {
  // 1. Champions: Very recent, high frequency, high monetary
  if (rScore >= 4 && fScore === 5 && mScore >= 4) {
    return 'Champions';
  }
  // 2. At Risk: Used to buy frequently (frequency >= 3) or high monetary, but haven't purchased recently (recency > 40d)
  if (recencyDays >= 40 && (frequency >= 3 || mScore >= 4)) {
    return 'At Risk';
  }
  // 3. New Customers: Single order placed recently
  if (frequency === 1 && recencyDays <= 25) {
    return 'New Customers';
  }
  // 4. Loyal Customers: Solid recency and frequency >= 3
  if (rScore >= 3 && frequency >= 3 && mScore >= 3) {
    return 'Loyal Customers';
  }
  // 5. Potential Loyalists: Recent orders with 2-3 purchases
  if (rScore >= 3 && frequency >= 2) {
    return 'Potential Loyalists';
  }
  // 6. Hibernating: Inactive low-frequency buyers
  return 'Hibernating';
}

export function calculateRFMSegmentation(): {
  records: RFMCustomerRecord[];
  summaries: RFMSegmentSummary[];
} {
  const customerOrdersMap = new Map<string, { count: number; total: number; lastDate: string }>();

  ORDERS.forEach((order) => {
    const existing = customerOrdersMap.get(order.customerId);
    if (!existing) {
      customerOrdersMap.set(order.customerId, {
        count: 1,
        total: order.totalAmount,
        lastDate: order.orderDate,
      });
    } else {
      existing.count += 1;
      existing.total += order.totalAmount;
      if (order.orderDate > existing.lastDate) {
        existing.lastDate = order.orderDate;
      }
    }
  });

  const records: RFMCustomerRecord[] = CUSTOMERS.map((customer) => {
    const stats = customerOrdersMap.get(customer.id) || {
      count: 1,
      total: 450,
      lastDate: '2026-07-20',
    };

    const recencyDays = daysBetween(stats.lastDate, REFERENCE_DATE);
    const frequency = stats.count;
    const monetary = stats.total;
    const averageOrderValue = Math.round(monetary / Math.max(1, frequency));

    const rScore = scoreRecency(recencyDays);
    const fScore = scoreFrequency(frequency);
    const mScore = scoreMonetary(monetary);

    const segment = classifyRFMSegment(recencyDays, frequency, rScore, fScore, mScore);

    return {
      customer,
      recencyDays,
      frequency,
      monetary,
      averageOrderValue,
      lastOrderDate: stats.lastDate,
      rScore,
      fScore,
      mScore,
      rfmComposite: `${rScore}${fScore}${mScore}`,
      segment,
    };
  }).sort((a, b) => b.monetary - a.monetary);

  const totalCustomers = records.length;
  const grandTotalRevenue = records.reduce((sum, r) => sum + r.monetary, 0);

  const segmentOrder: RFMSegmentName[] = [
    'Champions',
    'Loyal Customers',
    'Potential Loyalists',
    'New Customers',
    'At Risk',
    'Hibernating',
  ];

  const summaries: RFMSegmentSummary[] = segmentOrder.map((segment) => {
    const group = records.filter((r) => r.segment === segment);
    const customerCount = group.length;
    const totalRevenue = group.reduce((sum, r) => sum + r.monetary, 0);
    const averageCustomerValue =
      customerCount > 0 ? Math.round(totalRevenue / customerCount) : 0;
    const averageRecencyDays =
      customerCount > 0
        ? Math.round(group.reduce((sum, r) => sum + r.recencyDays, 0) / customerCount)
        : 0;
    const averageFrequency =
      customerCount > 0
        ? Number((group.reduce((sum, r) => sum + r.frequency, 0) / customerCount).toFixed(1))
        : 0;

    const meta = SEGMENT_METADATA[segment];

    return {
      segment,
      description: meta.description,
      ruleCriteria: meta.ruleCriteria,
      customerCount,
      shareOfCustomers:
        totalCustomers > 0 ? Number(((customerCount / totalCustomers) * 100).toFixed(1)) : 0,
      totalRevenue,
      shareOfRevenue:
        grandTotalRevenue > 0
          ? Number(((totalRevenue / grandTotalRevenue) * 100).toFixed(1))
          : 0,
      averageCustomerValue,
      averageRecencyDays,
      averageFrequency,
      color: meta.color,
    };
  });

  return { records, summaries };
}
