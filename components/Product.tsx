import { Organic } from "@/typings/searchTypings"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "./ui/badge"


function Product({product}:{product:Organic}) {
  // Ensure URL is properly formatted
  const productUrl = product.url || '';
  const encodedUrl = encodeURIComponent(productUrl);
  
  // Safety checks
  if (!product.title && !product.image) {
    console.warn("Product missing title and image:", product);
  }
  
  return (
    <Link
    href={`/product?url=${encodedUrl}`}
    className="flex flex-col relative border rounded-md h-full p-5 hover:shadow-lg transition-shadow"
    >
        {product.image ? (
          <Image
          src={product.image}
          alt={product.title || "Product"}
          height={200}
          width={200}
          className="mx-auto object-contain"
          />
        ) : (
          <div className="h-[200px] w-[200px] mx-auto bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}

        <p className="text-xl font-bold mt-2">
          {product.price?.currency || "$"}
          {product.price?.price || "0.00"}
        </p>

        {product.badge && (
            <Badge className="w-fit absolute top-2 right-2">{product.badge}
            </Badge>
        )}

        <p className="font-light line-clamp-2 mt-2">
            {product.title || "Product"}
        </p>

        {product.rating && product.rating.rating > 0 && (
            <p className="text-yellow-500 text-sm mt-2">
                {product.rating.rating}*
                <span className="text-gray-400 ml-2">
                         ({product.rating.count || 0})
                </span>
            </p>
        )}
    </Link>
  )
}

export default Product