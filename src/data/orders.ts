import { Order, OrderItem } from '../types';
import { PRODUCTS } from './products';
import { CUSTOMERS } from './customers';

// Reference current date for deterministic analytics: 2026-11-09
export const REFERENCE_DATE = '2026-11-09';

function addDays(baseDateStr: string, daysOffset: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysOffset);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const PAYMENT_METHODS: Order['paymentMethod'][] = [
  'Corporate Card',
  'Net-30 Invoice',
  'Credit Card',
  'Wire Transfer',
];

/**
 * Deterministic order generator creating 360 realistic orders across 120 days
 * prior to REFERENCE_DATE (2026-07-12 to 2026-11-09).
 *
 * Customer cohorts by index (0..114):
 * - 0..21 (22 customers): Champions -> frequent orders (5-8 orders), very recent (last 1-14 days), high basket size
 * - 22..45 (24 customers): Loyal Customers -> regular orders (3-5 orders), recent (last 8-30 days), strong value
 * - 46..67 (22 customers): Potential Loyalists -> 2-3 orders, recent (last 5-28 days), medium value
 * - 68..83 (16 customers): New Customers -> 1 order, very recent (last 1-18 days)
 * - 84..99 (16 customers): At Risk -> 3-5 historical orders, but last order was 42-78 days ago
 * - 100..114 (15 customers): Hibernating -> 1-2 orders, long ago (65-118 days ago), lower spend
 *
 * Product velocity patterns:
 * - High growth / top sellers in recent 30 days: PRD-001, PRD-002, PRD-003, PRD-007, PRD-014, PRD-004
 * - Declining sales in recent 30 days (strong 31-60d ago, weak 0-30d ago): PRD-019, PRD-020, PRD-021, PRD-008
 */
function buildDeterministicOrders(): Order[] {
  const orders: Order[] = [];
  let orderSeq = 1001;

  const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

  const highGrowthProducts = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-007', 'PRD-010', 'PRD-014'];
  const steadyProducts = ['PRD-005', 'PRD-006', 'PRD-009', 'PRD-011', 'PRD-012', 'PRD-013', 'PRD-015', 'PRD-016', 'PRD-017', 'PRD-018', 'PRD-022', 'PRD-023', 'PRD-024'];
  const decliningProducts = ['PRD-019', 'PRD-020', 'PRD-021', 'PRD-008'];

  const createOrder = (
    customerId: string,
    daysAgo: number,
    seed: number,
    tier: 'high' | 'medium' | 'low'
  ): Order => {
    const orderDate = addDays(REFERENCE_DATE, -daysAgo);
    const itemsCount = tier === 'high' ? ((seed % 3) + 2) : tier === 'medium' ? ((seed % 2) + 1) : 1;
    const items: OrderItem[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < itemsCount; i++) {
      let chosenProdId: string;
      const pick = (seed + i * 7) % 20;

      if (daysAgo <= 30) {
        // Recent 30 days: strong preference for high-growth products, almost no declining products
        if (pick < 11) {
          chosenProdId = highGrowthProducts[(seed + i * 3) % highGrowthProducts.length];
        } else if (pick < 19) {
          chosenProdId = steadyProducts[(seed + i * 5) % steadyProducts.length];
        } else {
          chosenProdId = decliningProducts[(seed + i) % decliningProducts.length];
        }
      } else if (daysAgo <= 60) {
        // 31-60 days ago: declining products had much higher volume here
        if (pick < 6) {
          chosenProdId = decliningProducts[(seed + i * 2) % decliningProducts.length];
        } else if (pick < 13) {
          chosenProdId = steadyProducts[(seed + i * 3) % steadyProducts.length];
        } else {
          chosenProdId = highGrowthProducts[(seed + i * 5) % highGrowthProducts.length];
        }
      } else {
        // 61-120 days ago: balanced mix
        if (pick < 5) {
          chosenProdId = decliningProducts[(seed + i) % decliningProducts.length];
        } else if (pick < 13) {
          chosenProdId = steadyProducts[(seed + i * 4) % steadyProducts.length];
        } else {
          chosenProdId = highGrowthProducts[(seed + i * 2) % highGrowthProducts.length];
        }
      }

      if (usedIds.has(chosenProdId)) {
        chosenProdId = steadyProducts[(seed + i * 11) % steadyProducts.length];
      }
      usedIds.add(chosenProdId);

      const product = productMap.get(chosenProdId) || PRODUCTS[0];
      let quantity = tier === 'high' ? ((seed + i) % 3) + 1 : ((seed + i) % 2) + 1;
      if (product.basePrice > 800 && quantity > 2) {
        quantity = 2;
      }
      // If 31-60 days ago and declining product, boost quantity so decline is unmistakable
      if (daysAgo > 30 && daysAgo <= 60 && decliningProducts.includes(chosenProdId)) {
        quantity += 2;
      }

      const discountPct = quantity >= 3 ? 0.05 : 0;
      const unitPrice = Math.round(product.basePrice * (1 - discountPct));
      const totalPrice = unitPrice * quantity;

      items.push({
        productId: product.id,
        quantity,
        unitPrice,
        discount: Math.round(product.basePrice * quantity - totalPrice),
        totalPrice,
      });
    }

    const totalAmount = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const status: Order['status'] =
      daysAgo <= 2 ? (seed % 2 === 0 ? 'Processing' : 'Shipped') : daysAgo <= 5 && seed % 3 === 0 ? 'Shipped' : 'Completed';

    const order: Order = {
      id: `ORD-${orderSeq++}`,
      customerId,
      orderDate,
      status,
      items,
      totalAmount,
      paymentMethod: PAYMENT_METHODS[seed % PAYMENT_METHODS.length],
    };

    return order;
  };

  CUSTOMERS.forEach((customer, idx) => {
    if (idx < 22) {
      // Champions: 5 to 7 orders, most recent 0..12 days ago
      const numOrders = 5 + (idx % 3);
      for (let o = 0; o < numOrders; o++) {
        const daysAgo = o === 0 ? (idx % 12) : Math.min(115, (idx % 12) + o * 14 + (idx % 5));
        orders.push(createOrder(customer.id, daysAgo, idx * 17 + o * 31, 'high'));
      }
    } else if (idx < 46) {
      // Loyal Customers: 3 to 5 orders, most recent 7..25 days ago
      const numOrders = 3 + (idx % 3);
      for (let o = 0; o < numOrders; o++) {
        const daysAgo = o === 0 ? 7 + (idx % 18) : Math.min(115, 7 + (idx % 18) + o * 19 + (idx % 4));
        orders.push(createOrder(customer.id, daysAgo, idx * 13 + o * 23, 'medium'));
      }
    } else if (idx < 68) {
      // Potential Loyalists: 2 to 3 orders, most recent 4..24 days ago
      const numOrders = 2 + (idx % 2);
      for (let o = 0; o < numOrders; o++) {
        const daysAgo = o === 0 ? 4 + (idx % 20) : Math.min(90, 4 + (idx % 20) + o * 22);
        orders.push(createOrder(customer.id, daysAgo, idx * 19 + o * 29, 'medium'));
      }
    } else if (idx < 84) {
      // New Customers: 1 order, very recent 1..15 days ago
      const daysAgo = 1 + (idx % 15);
      orders.push(createOrder(customer.id, daysAgo, idx * 23, 'medium'));
    } else if (idx < 100) {
      // At Risk: 3 to 4 orders, but last order was 45..76 days ago
      const numOrders = 3 + (idx % 2);
      for (let o = 0; o < numOrders; o++) {
        const daysAgo = 45 + (idx % 22) + o * 14;
        orders.push(createOrder(customer.id, Math.min(118, daysAgo), idx * 11 + o * 17, 'high'));
      }
    } else {
      // Hibernating: 1 to 2 orders, 72..116 days ago
      const numOrders = 1 + (idx % 2);
      for (let o = 0; o < numOrders; o++) {
        const daysAgo = 72 + ((idx * 3) % 35) + o * 12;
        orders.push(createOrder(customer.id, Math.min(119, daysAgo), idx * 7 + o * 13, 'low'));
      }
    }
  });

  // Sort orders chronologically descending (newest first)
  return orders.sort((a, b) => (b.orderDate > a.orderDate ? 1 : b.orderDate < a.orderDate ? -1 : b.id.localeCompare(a.id)));
}

export const ORDERS: Order[] = buildDeterministicOrders();
