import fetchProduct from "@/lib/fetchProduct";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddToCart from "@/components/AddToCart";
import { ProductError } from "@/components/ProductError";

type Props = {
  searchParams: {
    url: string;
  };
};
async function ProductPage({ searchParams: { url } }: Props) {
  if (!url) {
    return <ProductError errorType="not_found" />;
  }

  try {
    const product = await fetchProduct(url);
    if (!product) {
      return <ProductError errorType="not_found" />;
    }

    // Additional validation
    if (!product.title) {
      console.error("Product missing title");
      return <ProductError errorType="not_found" />;
    }

    // Create a simple SVG placeholder as data URI (no external fetch needed)
    const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
    
    // Ensure images array exists
    const images = product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [placeholderImage];

    // Ensure specifications array exists
    const specifications = product.specifications && Array.isArray(product.specifications)
      ? product.specifications
      : [];

    // Ensure breadcrumbs array exists and convert objects to strings
    let breadcrumbs: string[] = [];
    if (product.breadcrumbs && Array.isArray(product.breadcrumbs)) {
      breadcrumbs = product.breadcrumbs.map((crumb: any) => {
        // If breadcrumb is an object, extract the name/category_name
        if (typeof crumb === 'object' && crumb !== null) {
          return crumb.category_name || crumb.name || crumb.url || String(crumb);
        }
        // If it's already a string, use it
        return String(crumb);
      }).filter((crumb: string) => crumb && crumb !== 'undefined');
    }

    return (
      <div className="p-4 lg:p-10 flex flex-col lg:flex-row w-full">
        <div className="hidden lg:inline space-y-4">
          {images.map((image, i) => (
            <Image
              key={`${image}-${i}`}
              src={image}
              alt={product.title + " " + i}
              width={90}
              height={90}
              className="border rounded-sm"
            />
          ))}
        </div>

        <Carousel
          opts={{
            loop: true,
          }}
          className="w-3/5 mb-10 lg:mb-0 lg:w-full self-start flex items-center max-w-xl mx-auto lg:mx-20"
        >
          <CarouselContent>
            {images.map((image, i) => (
              <CarouselItem key={`carousel-${image}-${i}`}>
                <div className="p-1">
                  <div className="flex aspect-square items-center justify-center p-2 relative">
                    <Image
                      src={image}
                      alt={product.title + " " + i}
                      width={400}
                      height={400}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="flex-1 border rounded-md w-full p-5 space-y-5">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {breadcrumbs.length > 0 && (
          <div className="space-x-2">
            {breadcrumbs.map((breadcrumb, i) => (
              <Badge
                key={`breadcrumb-${breadcrumb}-${i}`}
                className={breadcrumb}
                variant="outline"
              >
                {breadcrumb}
              </Badge>
            ))}
          </div>
          )}

          {product.description && (
          <div
            dangerouslySetInnerHTML={{ __html: product.description }}
            className="py-5"
          />
          )}

          {product.rating && (
            <p className="text-yellow-500 text-sm">
              {product.rating.rating} *
              <span className="text-gray-400 ml-2">
                ({product.rating.count} reviews)
              </span>
            </p>
          )}

          <p className="text-2xl font-bold mt-2">
            {product?.currency || "$"} {product.price || 0}
          </p>

          <AddToCart product={product}/>

          <hr />
          {specifications.length > 0 && (
          <>
          <h3 className="font-bold text-xl pt-10">Specifications</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="">Specifications</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specifications.map((spec, index) => (
                <TableRow key={`spec-${spec.key}-${index}`}>
                  <TableCell className="font-bold">{spec.key}</TableCell>
                  <TableCell>{spec.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    // Enhanced error logging
    console.error("Product page error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    let errorType: "rate_limit" | "not_found" | "server_error" | "unauthorized" | "unknown" = "unknown";
    
    if (error.message === "RATE_LIMIT") {
      errorType = "rate_limit";
    } else if (error.message === "NOT_FOUND") {
      errorType = "not_found";
    } else if (error.message === "SERVER_ERROR") {
      errorType = "server_error";
    } else if (error.message === "UNAUTHORIZED") {
      errorType = "unauthorized";
    } else {
      console.error("Unknown error type:", error);
    }

    return <ProductError errorType={errorType} />;
  }
}
export default ProductPage;
