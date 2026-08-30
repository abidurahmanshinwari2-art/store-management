import { daysAgoIso } from '../utils/format.js'

export const STORE_NAME = 'Hasan Shinwari Genral Store'

export function looksLikeSample(db) {
  return Boolean(
    db?.users?.some((u) => u.name === 'Amina Karimi' && u.email === 'owner@store.com')
    && db?.customers?.some((c) => c.id === 'c1' && c.name === 'Ahmad Reza')
    && db?.sales?.some((s) => s.number === 'INV-0001')
    && db?.products?.some((p) => p.sku === 'RICE-5')
    && (db.sales?.length || 0) <= 3,
  )
}

export function createEmptyStore() {
  return {
    company: {
      name: STORE_NAME,
      tagline: '',
      address: '',
      phone: '',
      email: '',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxName: 'Tax',
      taxRate: 0,
      invoicePrefix: 'INV',
      purchasePrefix: 'PO',
      fiscalYearStart: '01-01',
    },
    warehouses: [{ id: 'wh-main', name: 'Main Store', address: '' }],
    categories: [],
    products: [],
    inventory: [],
    suppliers: [],
    customers: [
      { id: 'walkin', name: 'Walk-in Customer', phone: '', email: '', address: '', creditLimit: 0, balance: 0, isWalkIn: true },
    ],
    users: [
      { id: 'u1', name: 'Owner', email: 'owner@store.com', password: 'owner123', role: 'owner', active: true },
    ],
    sales: [],
    purchases: [],
    expenses: [],
    payments: [],
    movements: [],
    holds: [],
  }
}

export function createSeed() {
  const warehouses = [
    { id: 'wh-main', name: 'Main Store', address: 'Ground floor' },
    { id: 'wh-back', name: 'Back Room', address: 'Storage' },
  ]

  const categories = [
    { id: 'cat-groc', name: 'Groceries' },
    { id: 'cat-bev', name: 'Beverages' },
    { id: 'cat-house', name: 'Household' },
    { id: 'cat-care', name: 'Personal Care' },
    { id: 'cat-snack', name: 'Snacks' },
  ]

  const products = [
    { id: 'p1', name: 'Basmati Rice 5kg', sku: 'RICE-5', barcode: '890100000001', categoryId: 'cat-groc', unit: 'bag', costPrice: 6.4, sellPrice: 8.5, reorderLevel: 8, taxable: true },
    { id: 'p2', name: 'Sunflower Oil 1L', sku: 'OIL-1L', barcode: '890100000002', categoryId: 'cat-groc', unit: 'bottle', costPrice: 2.1, sellPrice: 2.9, reorderLevel: 12, taxable: true },
    { id: 'p3', name: 'White Sugar 1kg', sku: 'SUG-1', barcode: '890100000003', categoryId: 'cat-groc', unit: 'pack', costPrice: 0.9, sellPrice: 1.25, reorderLevel: 15, taxable: true },
    { id: 'p4', name: 'All-Purpose Flour 10kg', sku: 'FLR-10', barcode: '890100000004', categoryId: 'cat-groc', unit: 'bag', costPrice: 5.8, sellPrice: 7.4, reorderLevel: 6, taxable: true },
    { id: 'p5', name: 'Green Tea 200g', sku: 'TEA-200', barcode: '890100000005', categoryId: 'cat-bev', unit: 'box', costPrice: 1.7, sellPrice: 2.6, reorderLevel: 10, taxable: true },
    { id: 'p6', name: 'Mineral Water 1.5L', sku: 'WTR-15', barcode: '890100000006', categoryId: 'cat-bev', unit: 'bottle', costPrice: 0.28, sellPrice: 0.5, reorderLevel: 24, taxable: false },
    { id: 'p7', name: 'Fresh Milk 1L', sku: 'MLK-1', barcode: '890100000007', categoryId: 'cat-bev', unit: 'carton', costPrice: 0.85, sellPrice: 1.2, reorderLevel: 18, taxable: false },
    { id: 'p8', name: 'Laundry Powder 2kg', sku: 'DET-2', barcode: '890100000008', categoryId: 'cat-house', unit: 'pack', costPrice: 3.2, sellPrice: 4.75, reorderLevel: 8, taxable: true },
    { id: 'p9', name: 'Dish Soap 500ml', sku: 'DSH-500', barcode: '890100000009', categoryId: 'cat-house', unit: 'bottle', costPrice: 0.95, sellPrice: 1.55, reorderLevel: 10, taxable: true },
    { id: 'p10', name: 'Toothpaste 120g', sku: 'TP-120', barcode: '890100000010', categoryId: 'cat-care', unit: 'tube', costPrice: 1.1, sellPrice: 1.8, reorderLevel: 10, taxable: true },
    { id: 'p11', name: 'Butter Biscuits 200g', sku: 'BIS-200', barcode: '890100000011', categoryId: 'cat-snack', unit: 'pack', costPrice: 0.7, sellPrice: 1.15, reorderLevel: 16, taxable: true },
    { id: 'p12', name: 'Instant Noodles 5-pack', sku: 'NDL-5', barcode: '890100000012', categoryId: 'cat-snack', unit: 'pack', costPrice: 1.05, sellPrice: 1.6, reorderLevel: 14, taxable: true },
  ]

  const inventory = [
    { productId: 'p1', warehouseId: 'wh-main', qty: 22 },
    { productId: 'p1', warehouseId: 'wh-back', qty: 10 },
    { productId: 'p2', warehouseId: 'wh-main', qty: 30 },
    { productId: 'p2', warehouseId: 'wh-back', qty: 12 },
    { productId: 'p3', warehouseId: 'wh-main', qty: 40 },
    { productId: 'p3', warehouseId: 'wh-back', qty: 20 },
    { productId: 'p4', warehouseId: 'wh-main', qty: 14 },
    { productId: 'p4', warehouseId: 'wh-back', qty: 6 },
    { productId: 'p5', warehouseId: 'wh-main', qty: 18 },
    { productId: 'p5', warehouseId: 'wh-back', qty: 8 },
    { productId: 'p6', warehouseId: 'wh-main', qty: 60 },
    { productId: 'p6', warehouseId: 'wh-back', qty: 24 },
    { productId: 'p7', warehouseId: 'wh-main', qty: 16 },
    { productId: 'p7', warehouseId: 'wh-back', qty: 0 },
    { productId: 'p8', warehouseId: 'wh-main', qty: 11 },
    { productId: 'p8', warehouseId: 'wh-back', qty: 5 },
    { productId: 'p9', warehouseId: 'wh-main', qty: 20 },
    { productId: 'p9', warehouseId: 'wh-back', qty: 8 },
    { productId: 'p10', warehouseId: 'wh-main', qty: 9 },
    { productId: 'p10', warehouseId: 'wh-back', qty: 4 },
    { productId: 'p11', warehouseId: 'wh-main', qty: 28 },
    { productId: 'p11', warehouseId: 'wh-back', qty: 12 },
    { productId: 'p12', warehouseId: 'wh-main', qty: 21 },
    { productId: 'p12', warehouseId: 'wh-back', qty: 10 },
  ]

  const suppliers = [
    { id: 'sup1', name: 'Highland Wholesale', phone: '0700-111-222', email: 'orders@highland.example', address: 'Industrial road 12', balance: 48.6 },
    { id: 'sup2', name: 'Fresh Dairy Co.', phone: '0700-333-444', email: 'sales@freshdairy.example', address: 'Market street 4', balance: 0 },
    { id: 'sup3', name: 'HomeCare Trading', phone: '0700-555-666', email: 'hello@homecare.example', address: 'Warehouse lane 9', balance: 19.2 },
  ]

  const customers = [
    { id: 'walkin', name: 'Walk-in Customer', phone: '', email: '', address: '', creditLimit: 0, balance: 0, isWalkIn: true },
    { id: 'c1', name: 'Ahmad Reza', phone: '0780-221-009', email: 'ahmad@example.com', address: 'Nawabad', creditLimit: 150, balance: 12.4 },
    { id: 'c2', name: 'Sara Noori', phone: '0780-334-118', email: 'sara@example.com', address: 'Old town', creditLimit: 80, balance: 0 },
    { id: 'c3', name: 'Kabul Cafe', phone: '020-445-771', email: 'cafe@example.com', address: 'Main boulevard', creditLimit: 400, balance: 36.8 },
  ]

  const users = [
    { id: 'u1', name: 'Amina Karimi', email: 'owner@store.com', password: 'owner123', role: 'owner', active: true },
    { id: 'u2', name: 'Omar Cashier', email: 'cashier@store.com', password: 'cashier123', role: 'cashier', active: true },
    { id: 'u3', name: 'Lina Stock', email: 'stock@store.com', password: 'stock123', role: 'storekeeper', active: true },
    { id: 'u4', name: 'Yusuf Manager', email: 'manager@store.com', password: 'manager123', role: 'manager', active: true },
  ]

  const sales = [
    {
      id: 's1',
      number: 'INV-0001',
      date: daysAgoIso(2),
      customerId: 'c1',
      warehouseId: 'wh-main',
      items: [
        { productId: 'p1', name: 'Basmati Rice 5kg', qty: 1, price: 8.5, discount: 0, taxable: true },
        { productId: 'p3', name: 'White Sugar 1kg', qty: 2, price: 1.25, discount: 0, taxable: true },
      ],
      subtotal: 11,
      tax: 1.1,
      total: 12.1,
      paid: 0,
      paymentMethod: 'credit',
      status: 'completed',
      note: 'Credit sale',
      userId: 'u2',
    },
    {
      id: 's2',
      number: 'INV-0002',
      date: daysAgoIso(1),
      customerId: 'walkin',
      warehouseId: 'wh-main',
      items: [
        { productId: 'p6', name: 'Mineral Water 1.5L', qty: 6, price: 0.5, discount: 0, taxable: false },
        { productId: 'p11', name: 'Butter Biscuits 200g', qty: 3, price: 1.15, discount: 0, taxable: true },
      ],
      subtotal: 6.45,
      tax: 0.35,
      total: 6.8,
      paid: 6.8,
      paymentMethod: 'cash',
      status: 'completed',
      note: '',
      userId: 'u2',
    },
    {
      id: 's3',
      number: 'INV-0003',
      date: daysAgoIso(0),
      customerId: 'c3',
      warehouseId: 'wh-main',
      items: [
        { productId: 'p7', name: 'Fresh Milk 1L', qty: 12, price: 1.2, discount: 0, taxable: false },
        { productId: 'p12', name: 'Instant Noodles 5-pack', qty: 8, price: 1.6, discount: 0, taxable: true },
      ],
      subtotal: 27.2,
      tax: 1.28,
      total: 28.48,
      paid: 0,
      paymentMethod: 'credit',
      status: 'completed',
      note: 'Weekly cafe order',
      userId: 'u2',
    },
  ]

  const purchases = [
    {
      id: 'po1',
      number: 'PO-0001',
      date: daysAgoIso(6),
      supplierId: 'sup1',
      warehouseId: 'wh-main',
      items: [
        { productId: 'p1', name: 'Basmati Rice 5kg', qty: 20, cost: 6.4, taxable: true },
        { productId: 'p2', name: 'Sunflower Oil 1L', qty: 24, cost: 2.1, taxable: true },
      ],
      subtotal: 178.4,
      tax: 17.84,
      total: 196.24,
      paid: 147.64,
      status: 'received',
      note: 'Monthly grocery restock',
      userId: 'u3',
    },
    {
      id: 'po2',
      number: 'PO-0002',
      date: daysAgoIso(1),
      supplierId: 'sup3',
      warehouseId: 'wh-main',
      items: [
        { productId: 'p8', name: 'Laundry Powder 2kg', qty: 8, cost: 3.2, taxable: true },
      ],
      subtotal: 25.6,
      tax: 2.56,
      total: 28.16,
      paid: 8.96,
      status: 'received',
      note: '',
      userId: 'u3',
    },
  ]

  const expenses = [
    { id: 'e1', date: daysAgoIso(4), category: 'Rent', amount: 220, method: 'bank', note: 'Shop rent', userId: 'u1' },
    { id: 'e2', date: daysAgoIso(2), category: 'Utilities', amount: 38.5, method: 'cash', note: 'Electricity', userId: 'u1' },
    { id: 'e3', date: daysAgoIso(0), category: 'Transport', amount: 12, method: 'cash', note: 'Supplier pickup', userId: 'u3' },
  ]

  const payments = [
    { id: 'pay1', date: daysAgoIso(3), type: 'in', partyType: 'customer', partyId: 'c2', amount: 18, method: 'cash', note: 'Old balance settled', userId: 'u2' },
    { id: 'pay2', date: daysAgoIso(5), type: 'out', partyType: 'supplier', partyId: 'sup1', amount: 147.64, method: 'bank', note: 'PO-0001 part payment', userId: 'u1' },
  ]

  const movements = [
    { id: 'm1', date: daysAgoIso(6), productId: 'p1', warehouseId: 'wh-main', qty: 20, type: 'purchase', ref: 'PO-0001' },
    { id: 'm2', date: daysAgoIso(2), productId: 'p1', warehouseId: 'wh-main', qty: -1, type: 'sale', ref: 'INV-0001' },
    { id: 'm3', date: daysAgoIso(1), productId: 'p6', warehouseId: 'wh-main', qty: -6, type: 'sale', ref: 'INV-0002' },
    { id: 'm4', date: daysAgoIso(0), productId: 'p7', warehouseId: 'wh-main', qty: -12, type: 'sale', ref: 'INV-0003' },
  ]

  return {
    company: {
      name: STORE_NAME,
      tagline: 'Daily goods, counted properly',
      address: 'Main bazaar, shop 14',
      phone: '020-100-200',
      email: 'hello@hsgs.example',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxName: 'Sales Tax',
      taxRate: 10,
      invoicePrefix: 'INV',
      purchasePrefix: 'PO',
      fiscalYearStart: '01-01',
    },
    warehouses,
    categories,
    products,
    inventory,
    suppliers,
    customers,
    users,
    sales,
    purchases,
    expenses,
    payments,
    movements,
    holds: [],
  }
}
