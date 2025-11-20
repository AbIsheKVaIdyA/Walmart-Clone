import { Product } from "@/typings/productTypings";

export function groupBySKU(products: Product[]): Record<string, Product[]> {
  if (!products || products.length === 0) {
    return {};
  }
  
  return products.reduce(
    (accumulator: Record<string, Product[]>, currentProduct: Product, index: number) => {
      // Use a stable SKU - don't use Date.now() as it changes each time
      const sku = currentProduct.meta?.sku || `unknown-${index}`;
      if (!accumulator[sku]) {
        accumulator[sku] = [];
      }
      accumulator[sku].push(currentProduct);
      return accumulator;
    },
    {}
  );
}
