import { BusinessInsight } from '../types';
import {
  calculateDashboardKPIs,
  formatCurrency,
  getCategorySales,
  getProductPerformance,
} from './analytics';
import { calculateRFMSegmentation } from './segmentation';

export function generateBusinessInsights(): BusinessInsight[] {
  const kpis30d = calculateDashboardKPIs('30d');
  const kpisAll = calculateDashboardKPIs('all');
  const categories = getCategorySales('all');
  const products = getProductPerformance('all');
  const { summaries } = calculateRFMSegmentation();

  const topCategory = categories[0];
  const fastestGrowingCategory = [...categories].sort((a, b) => b.growthRate - a.growthRate)[0];

  const decliningProducts = products
    .filter((p) => p.revenueGrowthPct <= -15)
    .sort((a, b) => a.revenueGrowthPct - b.revenueGrowthPct);

  const topExpandingProduct = [...products].sort(
    (a, b) => b.revenueGrowthPct - a.revenueGrowthPct
  )[0];

  const championsSummary = summaries.find((s) => s.segment === 'Champions')!;
  const loyalSummary = summaries.find((s) => s.segment === 'Loyal Customers')!;
  const atRiskSummary = summaries.find((s) => s.segment === 'At Risk')!;
  const potentialSummary = summaries.find((s) => s.segment === 'Potential Loyalists')!;

  const vipRevenueShare = Number(
    (championsSummary.shareOfRevenue + loyalSummary.shareOfRevenue).toFixed(1)
  );
  const vipCustomerShare = Number(
    (championsSummary.shareOfCustomers + loyalSummary.shareOfCustomers).toFixed(1)
  );

  const worstDecliner = decliningProducts[0];
  const secondDecliner = decliningProducts[1];

  const insights: BusinessInsight[] = [
    {
      id: 'INS-001',
      title: `${topCategory.category} Leads Portfolio Revenue with ${topCategory.shareOfRevenue}% Market Share`,
      category: 'Category Shift',
      description: `Across the full observation window, ${topCategory.category} generated ${formatCurrency(
        topCategory.revenue
      )} from ${topCategory.unitsSold} units sold across ${
        topCategory.ordersCount
      } orders. Meanwhile, ${fastestGrowingCategory.category} recorded the strongest period-over-period expansion at ${
        fastestGrowingCategory.growthRate > 0 ? '+' : ''
      }${fastestGrowingCategory.growthRate}%.`,
      supportingMetric: `${formatCurrency(topCategory.revenue)} Category Revenue`,
      metricDelta: `${topCategory.growthRate >= 0 ? '+' : ''}${topCategory.growthRate}% vs prior period`,
      businessImpact:
        'High concentration in premium workstation displays and acoustics sustains strong gross margins and elevates average order value.',
      priority: 'High',
      suggestedAction: `Prioritize inventory allocation for ${topCategory.category} and bundle top accessories with ${fastestGrowingCategory.category}.`,
      relatedRoute: '/products',
    },
    {
      id: 'INS-002',
      title: `High-Value RFM Segments Drive ${vipRevenueShare}% of Total Platform Revenue`,
      category: 'Customer Retention',
      description: `Champions (${championsSummary.customerCount} accounts, avg ${formatCurrency(
        championsSummary.averageCustomerValue
      )}) and Loyal Customers (${loyalSummary.customerCount} accounts, avg ${formatCurrency(
        loyalSummary.averageCustomerValue
      )}) represent ${vipCustomerShare}% of the customer base but contribute ${vipRevenueShare}% of cumulative revenue (${formatCurrency(
        championsSummary.totalRevenue + loyalSummary.totalRevenue
      )}).`,
      supportingMetric: `${formatCurrency(championsSummary.averageCustomerValue)} Avg Champion LTV`,
      metricDelta: `${championsSummary.averageFrequency} avg orders / account`,
      businessImpact:
        'Revenue stability relies heavily on top-tier enterprise repeat buyers; protecting their purchase cadence is critical to quarterly targets.',
      priority: 'High',
      suggestedAction:
        'Enroll Champions and Loyal Customers into dedicated quarterly hardware refresh previews and volume tier pricing.',
      relatedRoute: '/customers',
    },
    {
      id: 'INS-003',
      title: `${atRiskSummary.customerCount} High-Value "At Risk" Accounts Hold ${formatCurrency(
        atRiskSummary.totalRevenue
      )} in Historical Spend`,
      category: 'Customer Retention',
      description: `RFM analysis identified ${atRiskSummary.customerCount} previously active customers (averaging ${
        atRiskSummary.averageFrequency
      } orders and ${formatCurrency(
        atRiskSummary.averageCustomerValue
      )} lifetime value) whose last purchase was ${
        atRiskSummary.averageRecencyDays
      } days ago on average—well past their normal 21-day reorder cycle.`,
      supportingMetric: `${formatCurrency(atRiskSummary.totalRevenue)} Historical Revenue at Risk`,
      metricDelta: `${atRiskSummary.averageRecencyDays}d avg recency gap`,
      businessImpact:
        'Unaddressed churn in the At Risk cohort could reduce next-quarter repeat revenue by up to 14%.',
      priority: 'High',
      suggestedAction:
        'Trigger targeted account manager outreach and a 10% workstation upgrade credit for At Risk accounts.',
      relatedRoute: '/customers',
    },
    {
      id: 'INS-004',
      title: `Steep 30-Day Sales Contraction Detected in ${decliningProducts.length} Legacy SKUs`,
      category: 'Product Velocity',
      description: `Comparing the last 30 days against the preceding 30-day window reveals sharp demand drops for ${
        worstDecliner?.product.name || 'Legacy Accessories'
      } (${worstDecliner?.revenueGrowthPct}%) and ${
        secondDecliner?.product.name || 'Compact Adapters'
      } (${
        secondDecliner?.revenueGrowthPct
      }%), as buyers migrate toward Thunderbolt 5 and GaNPrime standards.`,
      supportingMetric: `${worstDecliner?.revenueGrowthPct || -45}% 30d Velocity Drop`,
      metricDelta: `${decliningProducts.length} SKUs contracting >15%`,
      businessImpact:
        'Excess stock in legacy USB-C Gen1 and 720p webcam inventory ties up working capital and increases carrying costs.',
      priority: 'Medium',
      suggestedAction:
        'Halt restocking on contracting legacy SKUs and clear remaining units via promotional starter bundles.',
      relatedRoute: '/products',
    },
    {
      id: 'INS-005',
      title: `30-Day Revenue Reached ${formatCurrency(kpis30d.totalRevenue)} with ${
        kpis30d.revenueGrowth >= 0 ? '+' : ''
      }${kpis30d.revenueGrowth}% Momentum`,
      category: 'Revenue & Growth',
      description: `Over the last 30 days, the platform processed ${
        kpis30d.totalOrders
      } orders from ${kpis30d.totalCustomers} active accounts with an Average Order Value of ${formatCurrency(
        kpis30d.averageOrderValue
      )}. Growth was propelled by ${topExpandingProduct.product.name} (+${
        topExpandingProduct.revenueGrowthPct
      }% 30d surge).`,
      supportingMetric: `${formatCurrency(kpis30d.totalRevenue)} (Last 30 Days)`,
      metricDelta: `${kpis30d.revenueGrowth >= 0 ? '+' : ''}${kpis30d.revenueGrowth}% vs prior 30d`,
      businessImpact:
        'Accelerating adoption of flagship products is outpacing the decline of entry-level accessories, expanding overall gross margin.',
      priority: 'Medium',
      suggestedAction:
        'Reallocate paid acquisition budget toward flagship high-margin SKUs driving 30-day expansion.',
      relatedRoute: '/dashboard',
    },
    {
      id: 'INS-006',
      title: `Second-Order Conversion Opportunity Across ${potentialSummary.customerCount} Potential Loyalists`,
      category: 'Pricing & AOV',
      description: `Potential Loyalists currently average ${
        potentialSummary.averageFrequency
      } orders and ${formatCurrency(
        potentialSummary.averageCustomerValue
      )} in spend—${formatCurrency(
        loyalSummary.averageCustomerValue - potentialSummary.averageCustomerValue
      )} below the Loyal Customer benchmark. Overall repeat retention stands at ${
        kpisAll.customerRetentionRate
      }%.`,
      supportingMetric: `${potentialSummary.customerCount} Accounts Ready for Upsell`,
      metricDelta: `+${formatCurrency(
        loyalSummary.averageCustomerValue - potentialSummary.averageCustomerValue
      )} LTV upside / account`,
      businessImpact:
        'Converting 40% of Potential Loyalists into the Loyal tier would unlock substantial incremental recurring revenue.',
      priority: 'Low',
      suggestedAction:
        'Introduce automated post-purchase cross-sell bundles 14 days after a customer’s second order.',
      relatedRoute: '/recommendations',
    },
  ];

  return insights;
}
