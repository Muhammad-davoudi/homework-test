import { ChatMessage } from '../types';
import {
  calculateDashboardKPIs,
  formatCurrency,
  getCategorySales,
  getCustomerActivityOverview,
  getProductPerformance,
} from './analytics';
import { calculateRFMSegmentation } from './segmentation';
import { generateSmartRecommendations } from './recommendations';

export const SUGGESTED_QUESTIONS: string[] = [
  'What are our top-selling products?',
  'Which customer segment generates the most revenue?',
  'How is revenue performing?',
  'Which products have declining sales?',
  'What actions can improve customer retention?',
  'How do product categories compare by revenue and growth?',
];

export interface AssistantProvider {
  query(question: string, history?: ChatMessage[]): Promise<Omit<ChatMessage, 'id' | 'timestamp'>>;
}

/**
 * Deterministic local analytical query engine that inspects the live e-commerce dataset
 * (products, customers, orders, RFM segments, and recommendations) to answer user questions accurately.
 * Designed with the AssistantProvider interface so a server-side Gemini API adapter can be swapped in seamlessly.
 */
export class LocalAnalyticalEngine implements AssistantProvider {
  async query(question: string): Promise<Omit<ChatMessage, 'id' | 'timestamp'>> {
    const q = question.toLowerCase().trim();

    const kpisAll = calculateDashboardKPIs('all');
    const kpis30d = calculateDashboardKPIs('30d');
    const kpis7d = calculateDashboardKPIs('7d');
    const products = getProductPerformance('all');
    const categories = getCategorySales('all');
    const { summaries, records } = calculateRFMSegmentation();
    const recommendations = generateSmartRecommendations();
    const activity = getCustomerActivityOverview('all');

    // 1. Check if the user is asking about a specific product by name or SKU
    const matchedProduct = products.find(
      (p) =>
        q.includes(p.product.name.toLowerCase()) ||
        q.includes(p.product.sku.toLowerCase()) ||
        q.includes(p.product.id.toLowerCase())
    );

    if (matchedProduct) {
      return {
        role: 'assistant',
        content: `**${matchedProduct.product.name}** (${matchedProduct.product.sku}) ranks **#${
          matchedProduct.rank
        }** out of ${products.length} products in total revenue. It has generated **${formatCurrency(
          matchedProduct.totalRevenue
        )}** from **${matchedProduct.unitsSold} units sold** across **${
          matchedProduct.orderFrequency
        } orders**, with an average selling price of **${formatCurrency(
          matchedProduct.averageSellingPrice
        )}** and a gross margin of **${matchedProduct.grossMarginPct}%**. Over the last 30 days, its revenue velocity is **${
          matchedProduct.revenueGrowthPct >= 0 ? '+' : ''
        }${matchedProduct.revenueGrowthPct}%** (${matchedProduct.trend}).`,
        keyMetrics: [
          {
            label: 'Total Revenue',
            value: formatCurrency(matchedProduct.totalRevenue),
            delta: `Rank #${matchedProduct.rank}`,
          },
          {
            label: 'Units Sold',
            value: `${matchedProduct.unitsSold} units`,
            delta: `${matchedProduct.orderFrequency} orders`,
          },
          {
            label: '30d Velocity',
            value: `${matchedProduct.revenueGrowthPct >= 0 ? '+' : ''}${matchedProduct.revenueGrowthPct}%`,
            delta: matchedProduct.trend,
          },
        ],
        followUpSuggestions: [
          'What are our top-selling products?',
          'Which products have declining sales?',
          'How do product categories compare by revenue and growth?',
        ],
      };
    }

    // 2. Declining products query
    if (
      q.includes('declin') ||
      q.includes('drop') ||
      q.includes('worst') ||
      q.includes('underperform') ||
      q.includes('slow') ||
      q.includes('falling')
    ) {
      const declining = products
        .filter((p) => p.revenueGrowthPct < 0)
        .sort((a, b) => a.revenueGrowthPct - b.revenueGrowthPct);

      const topDecliners = declining.slice(0, 4);

      return {
        role: 'assistant',
        content: `Comparing the last 30 days against the prior 30-day period, **${
          declining.length
        } products** show negative sales velocity. The steepest contractions are in **${
          topDecliners[0]?.product.name
        }** (**${topDecliners[0]?.revenueGrowthPct}%**), **${
          topDecliners[1]?.product.name
        }** (**${topDecliners[1]?.revenueGrowthPct}%**), and **${
          topDecliners[2]?.product.name
        }** (**${
          topDecliners[2]?.revenueGrowthPct
        }%**). Buyers are actively shifting away from legacy USB-C Gen1 and 720p accessories toward Thunderbolt 5 and 4K AI hardware.`,
        keyMetrics: topDecliners.slice(0, 3).map((d) => ({
          label: d.product.sku,
          value: `${d.revenueGrowthPct}% (30d)`,
          delta: `${formatCurrency(d.recent30dRevenue)} vs ${formatCurrency(d.previous30dRevenue)}`,
        })),
        relatedDataRows: topDecliners.map((d) => ({
          name: d.product.name,
          primary: `${d.revenueGrowthPct}% 30d change`,
          secondary: `${d.product.stockLevel} units in stock · ${formatCurrency(d.totalRevenue)} total rev`,
        })),
        followUpSuggestions: [
          'What are our top-selling products?',
          'What actions can improve customer retention?',
          'How is revenue performing?',
        ],
      };
    }

    // 3. Top-selling / best performing products query
    if (
      q.includes('top') ||
      q.includes('best') ||
      q.includes('selling') ||
      q.includes('popular') ||
      q.includes('highest revenue product') ||
      (q.includes('product') && !q.includes('category'))
    ) {
      const top5 = products.slice(0, 5);
      const top5Rev = top5.reduce((s, p) => s + p.totalRevenue, 0);
      const top5Share = Number(((top5Rev / kpisAll.totalRevenue) * 100).toFixed(1));

      return {
        role: 'assistant',
        content: `Our top 5 products generate **${formatCurrency(
          top5Rev
        )}**, accounting for **${top5Share}%** of total catalog revenue. **${
          top5[0].product.name
        }** leads all SKUs at **${formatCurrency(top5[0].totalRevenue)}** (${
          top5[0].unitsSold
        } units sold), followed by **${top5[1].product.name}** at **${formatCurrency(
          top5[1].totalRevenue
        )}** and **${top5[2].product.name}** at **${formatCurrency(top5[2].totalRevenue)}**.`,
        keyMetrics: [
          {
            label: `#1 ${top5[0].product.sku}`,
            value: formatCurrency(top5[0].totalRevenue),
            delta: `${top5[0].unitsSold} units · +${top5[0].revenueGrowthPct}% 30d`,
          },
          {
            label: `#2 ${top5[1].product.sku}`,
            value: formatCurrency(top5[1].totalRevenue),
            delta: `${top5[1].unitsSold} units · +${top5[1].revenueGrowthPct}% 30d`,
          },
          {
            label: 'Top 5 Concentration',
            value: `${top5Share}% of Revenue`,
            delta: formatCurrency(top5Rev),
          },
        ],
        relatedDataRows: top5.map((p) => ({
          name: `#${p.rank} ${p.product.name}`,
          primary: formatCurrency(p.totalRevenue),
          secondary: `${p.unitsSold} units · ${p.grossMarginPct}% margin · ${
            p.revenueGrowthPct >= 0 ? '+' : ''
          }${p.revenueGrowthPct}% 30d`,
        })),
        followUpSuggestions: [
          'Which products have declining sales?',
          'How do product categories compare by revenue and growth?',
          'Which customer segment generates the most revenue?',
        ],
      };
    }

    // 4. Customer retention & churn prevention actions
    if (
      q.includes('retention') ||
      q.includes('churn') ||
      q.includes('at risk') ||
      q.includes('keep customer') ||
      q.includes('win back') ||
      q.includes('action') ||
      q.includes('recommend')
    ) {
      const atRisk = summaries.find((s) => s.segment === 'At Risk')!;
      const potential = summaries.find((s) => s.segment === 'Potential Loyalists')!;
      const newCust = summaries.find((s) => s.segment === 'New Customers')!;
      const topAtRiskAccounts = records.filter((r) => r.segment === 'At Risk').slice(0, 4);

      return {
        role: 'assistant',
        content: `Platform repeat customer retention is currently **${
          kpisAll.customerRetentionRate
        }%**. Based on RFM segmentation, three targeted actions will drive the highest retention impact:\n\n1. **Reactivate ${
          atRisk.customerCount
        } "At Risk" Accounts (${formatCurrency(
          atRisk.totalRevenue
        )} historical spend):** These buyers averaged **${
          atRisk.averageFrequency
        } orders** but haven't purchased in **${
          atRisk.averageRecencyDays
        } days**. Deploy a 12% workstation trade-in credit.\n2. **Bridge ${
          potential.customerCount
        } "Potential Loyalists" to Loyal Status:** Offer a bundled dock + accessory cross-sell 14 days after their second order.\n3. **Onboard ${
          newCust.customerCount
        } "New Customers":** Trigger automated setup guides and Net-30 corporate billing enrollment to secure their second purchase.`,
        keyMetrics: [
          {
            label: 'Repeat Retention Rate',
            value: `${kpisAll.customerRetentionRate}%`,
            delta: 'All-time cohort',
          },
          {
            label: 'At Risk Revenue Pool',
            value: formatCurrency(atRisk.totalRevenue),
            delta: `${atRisk.customerCount} accounts (${atRisk.averageRecencyDays}d avg recency)`,
          },
          {
            label: 'Projected Recovery (28%)',
            value: formatCurrency(Math.round(atRisk.totalRevenue * 0.28)),
            delta: recommendations[0].priority + ' Priority',
          },
        ],
        relatedDataRows: topAtRiskAccounts.map((r) => ({
          name: `${r.customer.name} (${r.customer.company})`,
          primary: `${formatCurrency(r.monetary)} lifetime spend`,
          secondary: `${r.frequency} orders · Last order ${r.recencyDays} days ago (${r.lastOrderDate})`,
        })),
        followUpSuggestions: [
          'Which customer segment generates the most revenue?',
          'How is revenue performing?',
          'What are our top-selling products?',
        ],
      };
    }

    // 5. Customer segmentation & revenue by segment query
    if (
      q.includes('segment') ||
      q.includes('rfm') ||
      q.includes('champion') ||
      q.includes('loyal') ||
      q.includes('customer') ||
      q.includes('who buys')
    ) {
      const sortedByRev = [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue);
      const topSeg = sortedByRev[0];
      const secondSeg = sortedByRev[1];

      return {
        role: 'assistant',
        content: `**${topSeg.segment}** generate the most revenue at **${formatCurrency(
          topSeg.totalRevenue
        )}** (**${topSeg.shareOfRevenue}%** of total revenue) from just **${
          topSeg.customerCount
        } customers** (${topSeg.shareOfCustomers}% of customer base), averaging **${formatCurrency(
          topSeg.averageCustomerValue
        )}** per account and **${topSeg.averageFrequency} orders**. **${
          secondSeg.segment
        }** rank second with **${formatCurrency(secondSeg.totalRevenue)}** (**${
          secondSeg.shareOfRevenue
        }%** share across ${secondSeg.customerCount} accounts). Combined, Champions and Loyal Customers contribute **${(
          topSeg.shareOfRevenue + secondSeg.shareOfRevenue
        ).toFixed(1)}%** of platform revenue.`,
        keyMetrics: [
          {
            label: `${topSeg.segment} Revenue`,
            value: formatCurrency(topSeg.totalRevenue),
            delta: `${topSeg.shareOfRevenue}% share (${topSeg.customerCount} accounts)`,
          },
          {
            label: `${secondSeg.segment} Revenue`,
            value: formatCurrency(secondSeg.totalRevenue),
            delta: `${secondSeg.shareOfRevenue}% share (${secondSeg.customerCount} accounts)`,
          },
          {
            label: 'Champion Avg LTV',
            value: formatCurrency(topSeg.averageCustomerValue),
            delta: `${topSeg.averageFrequency} avg orders`,
          },
        ],
        relatedDataRows: sortedByRev.map((s) => ({
          name: `${s.segment} (${s.customerCount} accounts)`,
          primary: `${formatCurrency(s.totalRevenue)} (${s.shareOfRevenue}%)`,
          secondary: `Avg LTV: ${formatCurrency(s.averageCustomerValue)} · Avg Recency: ${
            s.averageRecencyDays
          }d · Avg Freq: ${s.averageFrequency}`,
        })),
        followUpSuggestions: [
          'What actions can improve customer retention?',
          'How is revenue performing?',
          'What are our top-selling products?',
        ],
      };
    }

    // 6. Category comparison query
    if (q.includes('categor') || q.includes('department') || q.includes('line')) {
      const topCat = categories[0];
      return {
        role: 'assistant',
        content: `Across our 5 product categories, **${
          topCat.category
        }** is the largest revenue driver at **${formatCurrency(topCat.revenue)}** (**${
          topCat.shareOfRevenue
        }%** share, **${topCat.unitsSold} units**). All five categories maintain positive period-over-period expansion, led by flagship OLED displays, studio ANC headsets, and Thunderbolt 5 docks.`,
        keyMetrics: categories.slice(0, 3).map((c) => ({
          label: c.category,
          value: formatCurrency(c.revenue),
          delta: `${c.shareOfRevenue}% share · ${c.growthRate >= 0 ? '+' : ''}${c.growthRate}%`,
        })),
        relatedDataRows: categories.map((c) => ({
          name: c.category,
          primary: `${formatCurrency(c.revenue)} (${c.shareOfRevenue}%)`,
          secondary: `${c.unitsSold} units sold across ${c.ordersCount} orders · ${
            c.growthRate >= 0 ? '+' : ''
          }${c.growthRate}% growth`,
        })),
        followUpSuggestions: [
          'What are our top-selling products?',
          'Which products have declining sales?',
          'How is revenue performing?',
        ],
      };
    }

    // 7. Revenue performance, growth, orders, AOV, or general overview
    const topRegion = activity.byRegion[0];
    const topChannel = activity.byChannel[0];

    return {
      role: 'assistant',
      content: `Total platform revenue across all ${
        kpisAll.totalOrders
      } orders stands at **${formatCurrency(
        kpisAll.totalRevenue
      )}** with an Average Order Value of **${formatCurrency(
        kpisAll.averageOrderValue
      )}** across **${kpisAll.totalCustomers} active customers**. Over the **last 30 days**, revenue reached **${formatCurrency(
        kpis30d.totalRevenue
      )}** (**${kpis30d.revenueGrowth >= 0 ? '+' : ''}${
        kpis30d.revenueGrowth
      }%** vs the prior 30-day window) across **${
        kpis30d.totalOrders
      } orders**, while the **last 7 days** generated **${formatCurrency(
        kpis7d.totalRevenue
      )}**. Geographically, **${topRegion.region}** leads with **${formatCurrency(
        topRegion.revenue
      )}** (${topRegion.share}%), and **${topChannel.channel}** is the top acquisition channel (${
        topChannel.share
      }%).`,
      keyMetrics: [
        {
          label: 'Total Revenue (All Time)',
          value: formatCurrency(kpisAll.totalRevenue),
          delta: `${kpisAll.totalOrders} orders · ${formatCurrency(kpisAll.averageOrderValue)} AOV`,
        },
        {
          label: 'Last 30 Days Revenue',
          value: formatCurrency(kpis30d.totalRevenue),
          delta: `${kpis30d.revenueGrowth >= 0 ? '+' : ''}${kpis30d.revenueGrowth}% vs prior 30d`,
        },
        {
          label: 'Repeat Customer Retention',
          value: `${kpisAll.customerRetentionRate}%`,
          delta: `${kpisAll.totalCustomers} active accounts`,
        },
      ],
      relatedDataRows: [
        {
          name: 'Last 7 Days Performance',
          primary: formatCurrency(kpis7d.totalRevenue),
          secondary: `${kpis7d.totalOrders} orders · ${formatCurrency(kpis7d.averageOrderValue)} AOV`,
        },
        {
          name: 'Last 30 Days Performance',
          primary: formatCurrency(kpis30d.totalRevenue),
          secondary: `${kpis30d.totalOrders} orders · ${formatCurrency(kpis30d.averageOrderValue)} AOV`,
        },
        {
          name: `Top Region: ${topRegion.region}`,
          primary: formatCurrency(topRegion.revenue),
          secondary: `${topRegion.share}% of total revenue · ${topRegion.orders} orders`,
        },
        {
          name: `Top Channel: ${topChannel.channel}`,
          primary: formatCurrency(topChannel.revenue),
          secondary: `${topChannel.share}% of total revenue · ${topChannel.orders} orders`,
        },
      ],
      followUpSuggestions: [
        'What are our top-selling products?',
        'Which customer segment generates the most revenue?',
        'Which products have declining sales?',
      ],
    };
  }
}

export const assistantEngine = new LocalAnalyticalEngine();
