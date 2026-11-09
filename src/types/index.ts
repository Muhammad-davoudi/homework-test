export type ProductCategory =
  | 'Audio & Acoustics'
  | 'Smart Displays'
  | 'Ergonomic Hardware'
  | 'Connectivity & Hubs'
  | 'Power & Charging';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  unitCost: number;
  stockLevel: number;
  launchDate: string;
  rating: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America';
  channel: 'Organic Search' | 'Direct Enterprise' | 'Partner Referral' | 'Paid Social';
  joinedDate: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderDate: string; // YYYY-MM-DD
  status: 'Completed' | 'Processing' | 'Shipped';
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'Corporate Card' | 'Wire Transfer' | 'Credit Card' | 'Net-30 Invoice';
}

export type DateRangeOption = '7d' | '30d' | '90d' | 'all';

export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number; // percentage vs prior period
  ordersGrowth: number;
  aovGrowth: number;
  customerRetentionRate: number; // percentage of repeat buyers
  activeCustomersGrowth: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface CategorySalesMetric {
  category: ProductCategory;
  revenue: number;
  unitsSold: number;
  ordersCount: number;
  shareOfRevenue: number;
  growthRate: number;
}

export interface ProductPerformanceMetric {
  product: Product;
  rank: number;
  unitsSold: number;
  totalRevenue: number;
  averageSellingPrice: number;
  grossMarginPct: number;
  orderFrequency: number;
  revenueGrowthPct: number; // recent 30d vs previous 30d
  recent30dRevenue: number;
  previous30dRevenue: number;
  trend: 'Expanding' | 'Stable' | 'Declining';
  monthlySeries: { period: string; revenue: number; units: number }[];
}

export type RFMSegmentName =
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'New Customers'
  | 'At Risk'
  | 'Hibernating';

export interface RFMCustomerRecord {
  customer: Customer;
  recencyDays: number;
  frequency: number;
  monetary: number;
  averageOrderValue: number;
  lastOrderDate: string;
  rScore: number; // 1 to 5
  fScore: number; // 1 to 5
  mScore: number; // 1 to 5
  rfmComposite: string;
  segment: RFMSegmentName;
}

export interface RFMSegmentSummary {
  segment: RFMSegmentName;
  description: string;
  ruleCriteria: string;
  customerCount: number;
  shareOfCustomers: number;
  totalRevenue: number;
  shareOfRevenue: number;
  averageCustomerValue: number;
  averageRecencyDays: number;
  averageFrequency: number;
  color: string;
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface BusinessInsight {
  id: string;
  title: string;
  category: 'Revenue & Growth' | 'Product Velocity' | 'Customer Retention' | 'Category Shift' | 'Pricing & AOV';
  description: string;
  supportingMetric: string;
  metricDelta: string;
  businessImpact: string;
  priority: PriorityLevel;
  suggestedAction: string;
  relatedRoute: string;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  domain: 'Marketing & Growth' | 'Customer Retention' | 'Inventory & Catalog' | 'Pricing & Bundling' | 'VIP Expansion';
  explanation: string;
  priority: PriorityLevel;
  expectedImpact: string;
  quantifiedLift: string;
  relatedMetric: string;
  suggestedNextAction: string;
  implementationSteps: string[];
  status?: 'Pending' | 'In Review' | 'Approved';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  keyMetrics?: { label: string; value: string; delta?: string }[];
  relatedDataRows?: { name: string; primary: string; secondary: string }[];
  followUpSuggestions?: string[];
}
