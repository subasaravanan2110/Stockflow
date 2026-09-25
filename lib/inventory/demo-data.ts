import type { Prisma } from "@/generated/prisma/client";

type DemoDataClient = Pick<
  Prisma.TransactionClient,
  "category" | "supplier" | "product" | "stockMovement" | "purchaseOrder"
>;

const demoProducts = [
  {
    name: "USB-C Dock",
    sku: "DOCK-USB-C",
    description: "Nine-port USB-C dock for laptop workstations",
    price: 7999,
    costPrice: 5400,
    quantity: 18,
    reorderLevel: 6,
    category: "Electronics",
    supplier: "Bengaluru Tech Distributors",
  },
  {
    name: "Wireless Keyboard",
    sku: "KEY-WL-01",
    description: "Compact wireless keyboard for office desks",
    price: 2499,
    costPrice: 1650,
    quantity: 4,
    reorderLevel: 8,
    category: "Electronics",
    supplier: "Bengaluru Tech Distributors",
  },
  {
    name: "Wireless Mouse",
    sku: "MOUSE-WL-02",
    description: "Ergonomic wireless mouse with adjustable DPI",
    price: 1299,
    costPrice: 780,
    quantity: 27,
    reorderLevel: 10,
    category: "Electronics",
    supplier: "Bengaluru Tech Distributors",
  },
  {
    name: "Recycled Notebook",
    sku: "NOTE-A5-R",
    description: "A5 recycled-paper ruled notebook",
    price: 199,
    costPrice: 85,
    quantity: 0,
    reorderLevel: 20,
    category: "Office supplies",
    supplier: "GreenLeaf Stationery",
  },
  {
    name: "A4 Copier Paper",
    sku: "PAPER-A4-75",
    description: "500-sheet ream of 75 GSM copier paper",
    price: 425,
    costPrice: 310,
    quantity: 12,
    reorderLevel: 15,
    category: "Office supplies",
    supplier: "GreenLeaf Stationery",
  },
  {
    name: "Six-Socket Surge Protector",
    sku: "SURGE-6S",
    description: "Six-socket surge protector with master switch",
    price: 1499,
    costPrice: 960,
    quantity: 9,
    reorderLevel: 5,
    category: "Electronics",
    supplier: "Bengaluru Tech Distributors",
  },
] as const;

export async function seedDemoInventory(
  client: DemoDataClient,
  organizationId: string,
  actorId: string,
) {
  const [electronics, officeSupplies] = await Promise.all([
    client.category.upsert({
      where: { organizationId_name: { organizationId, name: "Electronics" } },
      update: { description: "Accessories, power products, and connected equipment" },
      create: { organizationId, name: "Electronics", description: "Accessories, power products, and connected equipment" },
    }),
    client.category.upsert({
      where: { organizationId_name: { organizationId, name: "Office supplies" } },
      update: { description: "Everyday workplace and stationery essentials" },
      create: { organizationId, name: "Office supplies", description: "Everyday workplace and stationery essentials" },
    }),
  ]);

  const [techSupplier, stationerySupplier] = await Promise.all([
    client.supplier.upsert({
      where: { organizationId_name: { organizationId, name: "Bengaluru Tech Distributors" } },
      update: {},
      create: {
        organizationId,
        name: "Bengaluru Tech Distributors",
        email: "orders@btd.example",
        phone: "+91 80 4123 4567",
        address: "Indiranagar, Bengaluru, Karnataka",
        leadTimeDays: 5,
      },
    }),
    client.supplier.upsert({
      where: { organizationId_name: { organizationId, name: "GreenLeaf Stationery" } },
      update: {},
      create: {
        organizationId,
        name: "GreenLeaf Stationery",
        email: "sales@greenleaf.example",
        phone: "+91 44 2815 9090",
        address: "T. Nagar, Chennai, Tamil Nadu",
        leadTimeDays: 3,
      },
    }),
  ]);

  const categories = new Map([
    ["Electronics", electronics.id],
    ["Office supplies", officeSupplies.id],
  ]);
  const suppliers = new Map([
    ["Bengaluru Tech Distributors", techSupplier.id],
    ["GreenLeaf Stationery", stationerySupplier.id],
  ]);
  const createdProducts = new Map<string, { id: string }>();

  for (const item of demoProducts) {
    const product = await client.product.upsert({
      where: { organizationId_sku: { organizationId, sku: item.sku } },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        costPrice: item.costPrice,
        reorderLevel: item.reorderLevel,
        categoryId: categories.get(item.category)!,
        supplierId: suppliers.get(item.supplier)!,
      },
      create: {
        organizationId,
        name: item.name,
        sku: item.sku,
        description: item.description,
        price: item.price,
        costPrice: item.costPrice,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        categoryId: categories.get(item.category)!,
        supplierId: suppliers.get(item.supplier)!,
      },
    });
    createdProducts.set(item.sku, product);

    const movementCount = await client.stockMovement.count({ where: { productId: product.id } });
    if (!movementCount && product.quantity > 0) {
      await client.stockMovement.create({
        data: {
          organizationId,
          productId: product.id,
          performedById: actorId,
          type: "STOCK_IN",
          quantity: product.quantity,
          previousQuantity: 0,
          newQuantity: product.quantity,
          reason: "Opening demo inventory",
        },
      });
    }
  }

  const keyboard = createdProducts.get("KEY-WL-01");
  if (keyboard) {
    await client.purchaseOrder.upsert({
      where: { organizationId_number: { organizationId, number: "PO-DEMO-001" } },
      update: {},
      create: {
        organizationId,
        supplierId: techSupplier.id,
        number: "PO-DEMO-001",
        status: "ORDERED",
        expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: "Demo replenishment order for low-stock keyboards",
        totalAmount: 16500,
        items: { create: { productId: keyboard.id, quantity: 10, unitCost: 1650 } },
      },
    });
  }
}
