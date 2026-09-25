export function inventorySignals(products: Array<{ quantity: number; reorderLevel: number; costPrice: unknown }>) {
  return products.reduce(
    (acc, product) => {
      acc.units += product.quantity;
      acc.value += product.quantity * Number(product.costPrice);
      if (product.quantity === 0) acc.outOfStock += 1;
      else if (product.quantity <= product.reorderLevel) acc.lowStock += 1;
      return acc;
    },
    { units: 0, value: 0, lowStock: 0, outOfStock: 0 },
  );
}
