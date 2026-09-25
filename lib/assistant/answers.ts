import { formatCurrency } from "@/lib/utils";

export type InventoryContext = {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  activeSuppliers: number;
  lowStock: Array<{ name: string; sku: string; quantity: number; reorderLevel: number; supplier: string | null }>;
  outOfStock: Array<{ name: string; sku: string; supplier: string | null }>;
  recentMovements: Array<{ product: string; type: string; quantity: number; reason: string; createdAt: string }>;
};

function productList(items: Array<{ name: string; sku: string }>, limit = 5) {
  return items.slice(0, limit).map((item) => `${item.name} (${item.sku})`).join(", ");
}

export function deterministicInventoryAnswer(question: string, context: InventoryContext) {
  const q = question.toLowerCase();
  if (/^(hi|hello|hellow|hey|good\s+(morning|afternoon|evening))\b[!.?\s]*$/.test(q)) {
    return "Hello! I’m your StockFlow assistant. I can help with stock health, reordering, valuation, suppliers, movements, reports, and how to use the application.";
  }
  if (/how.*(add|create).*(product).*(record|add).*(stock|movement)/.test(q)) {
    return "First, open Products and choose “Add product” to save its SKU, pricing, reorder level, category, and supplier. Then open Stock movements, select that product, choose Stock In, enter the received quantity and reason, and select “Record movement”. Product creation requires Admin access.";
  }
  if (/how.*(add|create).*(product)|new product/.test(q)) {
    return "Open Products and choose “Add product”. Enter its SKU, prices, reorder level, category, and optional supplier. Product creation requires Admin access.";
  }
  if (/how.*(record|add).*(stock|movement)|stock (in|out)|adjust.*stock/.test(q)) {
    return "Open Stock movements, select a product and movement type, enter a positive whole-number quantity and reason, then choose “Record movement”. Every change is preserved in the immutable stock ledger.";
  }
  if (/how.*(supplier|vendor)|add.*(supplier|vendor)/.test(q)) {
    return "Open Suppliers to add contact details and lead time. Assigning suppliers to products improves reorder guidance. Creating or archiving suppliers requires Admin access.";
  }
  if (/how.*categor|add.*categor/.test(q)) {
    return "Open Categories to create catalog groups, then select a category when creating or editing a product. Only empty categories can be deleted.";
  }
  if (/purchase|receive.*order/.test(q)) {
    return "Open Purchases to create a supplier order. When it arrives, an Admin can choose “Receive stock”; StockFlow records the receipt and increases inventory through the stock ledger.";
  }
  if (/report|export|csv/.test(q)) {
    return "Open Reports for inventory value and reorder priorities. Use “Export CSV” when you need a spreadsheet-ready inventory report.";
  }
  if (/two.?factor|2fa|authenticator/.test(q)) {
    return "To enable 2FA:\n1. Open Settings.\n2. In the Two-factor authentication card, choose “Enable 2FA”.\n3. Scan the QR code with Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.\n4. Enter the current six-digit code shown by the app.\n5. Choose “Verify and enable”.\n\nGitHub developer sign-ins always require a fresh six-digit code. Credential users are challenged after they enable 2FA. Keep the manual setup key private.";
  }
  if (/team|signed.?in user|role|admin|staff/.test(q)) {
    return "StockFlow separates Admin and Staff permissions. Admins manage catalog and procurement records and can monitor signed-in users; Staff can safely use permitted inventory workflows.";
  }
  if (/out of stock|unavailable|zero stock/.test(q)) {
    return context.outOfStock.length
      ? `${context.outOfStock.length} product${context.outOfStock.length === 1 ? " is" : "s are"} out of stock: ${productList(context.outOfStock)}.`
      : "No active products are currently out of stock.";
  }
  if (/low stock|reorder|order next|running out/.test(q)) {
    if (!context.lowStock.length) return "No active products are at or below their reorder level.";
    const priorities = context.lowStock.slice(0, 5).map((item) => {
      const suggested = Math.max(item.reorderLevel * 2 - item.quantity, item.reorderLevel);
      return `${item.name}: ${item.quantity} on hand, reorder level ${item.reorderLevel}, suggested order ${suggested}`;
    });
    return `Prioritize ${context.lowStock.length} low-stock product${context.lowStock.length === 1 ? "" : "s"}. ${priorities.join("; ")}.`;
  }
  if (/value|worth|valuation|capital/.test(q)) return `Current inventory value at cost is ${formatCurrency(context.inventoryValue)}, across ${context.totalUnits.toLocaleString("en-IN")} units and ${context.totalProducts} active products.`;
  if (/recent|movement|changed|stock in|stock out/.test(q)) {
    if (!context.recentMovements.length) return "No inventory movements have been recorded yet.";
    return `Recent activity: ${context.recentMovements.slice(0, 5).map((item) => `${item.product} — ${item.type.replaceAll("_", " ").toLowerCase()} ${item.quantity} (${item.reason})`).join("; ")}.`;
  }
  if (/supplier|vendor/.test(q)) return `There are ${context.activeSuppliers} active suppliers. ${context.lowStock.length ? `${context.lowStock.filter((item) => !item.supplier).length} low-stock products currently have no supplier assigned.` : "No products currently require reordering."}`;
  if (/summary|health|overview|status/.test(q)) return `Inventory contains ${context.totalProducts} active products and ${context.totalUnits.toLocaleString("en-IN")} units worth ${formatCurrency(context.inventoryValue)} at cost. ${context.lowStock.length} are low on stock and ${context.outOfStock.length} are out of stock.`;
  return "I can help with StockFlow usage, inventory value, low or out-of-stock products, reorder priorities, suppliers, purchases, reports, and recent movements. Try “What should I reorder?”";
}
