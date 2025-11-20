import { Product } from "@/typings/productTypings";

export function getCartTotal(products: Product[]): string {
  const total = products.reduce(
    (acc: number, currentProduct: Product) => {
      // Handle price as either number or object
      let price = 0;
      if (typeof currentProduct.price === 'number') {
        price = currentProduct.price;
      } else if (currentProduct.price && typeof currentProduct.price === 'object' && 'price' in currentProduct.price) {
        price = (currentProduct.price as any).price || 0;
      }
      return acc + price;
    },
    0
  );
  return ` ${
    products[0]?.currency ? products[0].currency : "$"
  } ${total.toFixed(2)}`;
}
