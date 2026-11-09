import { SmartRecommendation } from '../types';
import {
  calculateDashboardKPIs,
  formatCurrency,
  getProductPerformance,
} from './analytics';
import { calculateRFMSegmentation } from './segmentation';

export function generateSmartRecommendations(): SmartRecommendation[] {
  const kpis = calculateDashboardKPIs('all');
  const products = getProductPerformance('all');
  const { summaries } = calculateRFMSegmentation();

  const topProducts = products.slice(0, 3);
  const decliningProducts = products
    .filter((p) => p.revenueGrowthPct <= -15)
    .sort((a, b) => a.revenueGrowthPct - b.revenueGrowthPct);

  const champions = summaries.find((s) => s.segment === 'Champions')!;
  const atRisk = summaries.find((s) => s.segment === 'At Risk')!;
  const potentialLoyalists = summaries.find((s) => s.segment === 'Potential Loyalists')!;
  const newCustomers = summaries.find((s) => s.segment === 'New Customers')!;

  const estimatedRecoveryValue = Math.round(atRisk.totalRevenue * 0.28);
  const estimatedBundleLift = Math.round(kpis.totalRevenue * 0.095);
  const potentialUpsellValue = Math.round(
    potentialLoyalists.customerCount * 850
  );

  return [
    {
      id: 'REC-001',
      title: `Launch Win-Back Playbook for ${atRisk.customerCount} "At Risk" Enterprise Accounts`,
      domain: 'Customer Retention',
      explanation: `RFM segmentation shows ${atRisk.customerCount} high-value customers with ${formatCurrency(
        atRisk.totalRevenue
      )} in cumulative spend have gone ${
        atRisk.averageRecencyDays
      } days without an order. Because these accounts historically averaged ${
        atRisk.averageFrequency
      } orders each, proactive intervention before day 90 has a high probability of reactivating procurement.`,
      priority: 'High',
      expectedImpact: `Recover an estimated ${formatCurrency(
        estimatedRecoveryValue
      )} in quarterly repeat pipeline and prevent permanent account churn.`,
      quantifiedLift: `+${formatCurrency(estimatedRecoveryValue)} Projected Recovery`,
      relatedMetric: `${atRisk.customerCount} At Risk Accounts (${formatCurrency(
        atRisk.averageCustomerValue
      )} Avg LTV)`,
      suggestedNextAction:
        'Export the At Risk segment list and trigger personalized account executive outreach with a 12% trade-in upgrade incentive.',
      implementationSteps: [
        `Filter Customer Segmentation table by "At Risk" (${atRisk.customerCount} accounts).`,
        'Issue time-limited Net-30 volume credits on Thunderbolt 5 Docks and 4K OLED Monitors.',
        'Schedule 15-minute workspace hardware audit calls for accounts with >$4,000 historical spend.',
      ],
    },
    {
      id: 'REC-002',
      title: `Concentrate Paid Acquisition on Top 3 High-Velocity Flagship Products`,
      domain: 'Marketing & Growth',
      explanation: `${topProducts[0].product.name} (${formatCurrency(
        topProducts[0].totalRevenue
      )}), ${topProducts[1].product.name} (${formatCurrency(
        topProducts[1].totalRevenue
      )}), and ${topProducts[2].product.name} (${formatCurrency(
        topProducts[2].totalRevenue
      )}) lead catalog revenue with an average gross margin of ${Number(
        (
          (topProducts[0].grossMarginPct +
            topProducts[1].grossMarginPct +
            topProducts[2].grossMarginPct) /
          3
        ).toFixed(1)
      )}%.`,
      priority: 'High',
      expectedImpact:
        'Increase return on ad spend (ROAS) by 22% and accelerate new enterprise customer acquisition.',
      quantifiedLift: '+18% to +24% Margin-Adjusted Revenue Lift',
      relatedMetric: `${formatCurrency(
        topProducts[0].totalRevenue + topProducts[1].totalRevenue + topProducts[2].totalRevenue
      )} Combined Top-3 Revenue`,
      suggestedNextAction:
        'Shift 35% of generic category ad spend directly to landing pages featuring the Top 3 flagship SKUs.',
      implementationSteps: [
        'Feature Studio Pro ANC Headset and UltraFine 32" 4K OLED in Direct Enterprise campaigns.',
        'Highlight verified 4.8+ product ratings and enterprise warranty in comparison tables.',
        'Ensure safety stock levels remain above 90 units for top velocity SKUs.',
      ],
    },
    {
      id: 'REC-003',
      title: `Introduce "Executive Workspace Bundles" to Lift Average Order Value Above ${formatCurrency(
        Math.round(kpis.averageOrderValue * 1.15)
      )}`,
      domain: 'Pricing & Bundling',
      explanation: `Current platform Average Order Value is ${formatCurrency(
        kpis.averageOrderValue
      )} across ${
        kpis.totalOrders
      } orders. Order co-occurrence analysis shows customers purchasing ergonomic keyboards or monitors frequently buy connectivity hubs or light bars in separate follow-up orders.`,
      priority: 'Medium',
      expectedImpact: `Generate ${formatCurrency(
        estimatedBundleLift
      )} in incremental revenue by increasing multi-item attach rates at checkout.`,
      quantifiedLift: `+${formatCurrency(estimatedBundleLift)} Incremental AOV Lift`,
      relatedMetric: `${formatCurrency(kpis.averageOrderValue)} Current Average Order Value`,
      suggestedNextAction:
        'Create a pre-configured 3-item "Complete Desk Kit" (Monitor + Dock + Light Bar) with an automatic 7% bundle discount.',
      implementationSteps: [
        'Pair UltraFine 32" 4K OLED Monitor with Thunderbolt 5 Enterprise Dock and CRI-98 Light Bar.',
        'Display dynamic in-cart bundle upsell whenever single-item cart value is between $200 and $600.',
        'Track bundle attach rate weekly in Overview Dashboard.',
      ],
    },
    {
      id: 'REC-004',
      title: `Phase Out & Bundle ${decliningProducts.length} Contracting Legacy Accessories`,
      domain: 'Inventory & Catalog',
      explanation: `${decliningProducts
        .slice(0, 3)
        .map((p) => `${p.product.name} (${p.revenueGrowthPct}%)`)
        .join(', ')} experienced severe 30-day revenue contraction while holding ${decliningProducts.reduce(
        (s, p) => s + p.product.stockLevel,
        0
      )} total units in warehouse inventory.`,
      priority: 'Medium',
      expectedImpact:
        'Liquidate slow-moving warehouse stock within 45 days and free up working capital for high-margin USB4 and Qi2 lines.',
      quantifiedLift: `${decliningProducts.reduce(
        (s, p) => s + p.product.stockLevel,
        0
      )} Excess Units Cleared`,
      relatedMetric: `${decliningProducts[0]?.revenueGrowthPct || -48}% 30-Day Sales Contraction`,
      suggestedNextAction:
        'Pause automated purchase orders for legacy SKUs and include them as complimentary add-ons for orders exceeding $1,500.',
      implementationSteps: [
        'Disable automated restock triggers forPRD-019, PRD-020, and PRD-021.',
        'Offer Legacy USB-C 4-Port Hub as a free bonus gift on multi-seat enterprise orders.',
        'Redirect legacy product detail traffic to Thunderbolt 5 and GaNPrime successors.',
      ],
    },
    {
      id: 'REC-005',
      title: `Accelerate Second-Purchase Conversion for ${newCustomers.customerCount} New & ${potentialLoyalists.customerCount} Potential Loyalist Accounts`,
      domain: 'VIP Expansion',
      explanation: `The platform has ${newCustomers.customerCount} New Customers (1 order, avg ${formatCurrency(
        newCustomers.averageCustomerValue
      )}) and ${
        potentialLoyalists.customerCount
      } Potential Loyalists (avg ${
        potentialLoyalists.averageFrequency
      } orders). Bridging them to the Loyal Customer tier (${formatCurrency(
        summaries.find((s) => s.segment === 'Loyal Customers')?.averageCustomerValue || 3800
      )} avg LTV) represents a major expansion lever, while Champions (${
        champions.customerCount
      } accounts) remain ideal candidates for annual contract lock-in.`,
      priority: 'Low',
      expectedImpact: `Unlock ${formatCurrency(
        potentialUpsellValue
      )} in cohort expansion value over the next 60 days.`,
      quantifiedLift: `+${formatCurrency(potentialUpsellValue)} Cohort Expansion Potential`,
      relatedMetric: `${kpis.customerRetentionRate}% Platform Repeat Retention Rate`,
      suggestedNextAction:
        'Deploy a 14-day post-delivery onboarding sequence featuring ergonomic accessory recommendations.',
      implementationSteps: [
        'Send automated accessory compatibility guides 10 days after first hardware delivery.',
        'Provide Champions with early access to bulk enterprise licensing and Net-30 invoicing.',
        'Monitor migration from New Customers to Potential Loyalists monthly.',
      ],
    },
  ];
}
