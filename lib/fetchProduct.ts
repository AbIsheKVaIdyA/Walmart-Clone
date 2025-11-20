import { ProductContent } from "@/typings/productTypings";

async function fetchProduct(url: string) {
  if (!url) {
    console.error("Error fetching product: URL is required");
    return null;
  }

  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;

  if (!username || !password) {
    console.error("Error fetching product: OXYLABS credentials not configured");
    return null;
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const productUrl = decodedUrl.startsWith('http') 
      ? decodedUrl 
      : `https://www.walmart.com${decodedUrl.startsWith('/') ? decodedUrl : '/' + decodedUrl}`;
    
    const body = {
      source: "universal_ecommerce",
      url: productUrl,
      geo_location: "United States",
      parse: true,
    };

    const response = await fetch("https://realtime.oxylabs.io/v1/queries", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 402) {
        console.error(`Error fetching product: ${response.status} Unauthorized - Invalid Oxylabs credentials`);
        throw new Error("UNAUTHORIZED");
      }
      if (response.status === 429) {
        console.error("Error fetching product: 429 Too Many Requests - Rate limit exceeded");
        throw new Error("RATE_LIMIT");
      }
      if (response.status === 404) {
        console.error("Error fetching product: 404 Not Found");
        throw new Error("NOT_FOUND");
      }
      if (response.status >= 500) {
        console.error(`Error fetching product: ${response.status} Server Error`);
        throw new Error("SERVER_ERROR");
      }
      console.error(`Error fetching product: ${response.status} ${response.statusText}`);
      throw new Error("UNKNOWN_ERROR");
    }

    const data = await response.json();

    if (data.error || data.message) {
      console.error("Error in Oxylabs response:", data.error || data.message);
      throw new Error("SERVER_ERROR");
    }

    if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const result: ProductContent = data.results[0];
    
    if (!result || !result.content) {
      return null;
    }

    const product = result.content;
    
    if (!product.title) {
      product.title = "Product";
    }

    // Create a simple SVG placeholder as data URI (no external fetch needed)
    const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
    
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      product.images = [placeholderImage];
    } else {
      product.images = product.images.map((img: any) => {
        if (typeof img === 'string') {
          return img;
        } else if (typeof img === 'object' && img !== null) {
          return img.url || img.src || img.image || img.link || String(img);
        }
        return String(img);
      }).filter((img: string) => img && img !== 'undefined' && (img.startsWith('http') || img.startsWith('data:')));
      
      if (product.images.length === 0) {
        product.images = [placeholderImage];
      }
    }

    // Ensure specifications array exists
    if (!product.specifications || !Array.isArray(product.specifications)) {
      product.specifications = [];
    }

    // Ensure breadcrumbs array exists and normalize to strings
    if (!product.breadcrumbs || !Array.isArray(product.breadcrumbs)) {
      product.breadcrumbs = [];
    } else {
      // Convert breadcrumb objects to strings if needed
      product.breadcrumbs = product.breadcrumbs.map((crumb: any) => {
        if (typeof crumb === 'object' && crumb !== null) {
          return crumb.category_name || crumb.name || crumb.url || String(crumb);
        }
        return String(crumb);
      });
    }

    // Normalize price to number
    if (typeof product.price !== 'number') {
      if (product.price && typeof product.price === 'object' && 'price' in product.price) {
        product.price = (product.price as any).price || 0;
      } else {
        product.price = 0;
      }
    }

    // Ensure currency exists
    if (!product.currency) {
      product.currency = "$";
    }

    // Ensure meta field exists with sku and gtin
    if (!product.meta) {
      product.meta = {
        sku: "",
        gtin: ""
      };
    }
    if (!product.meta.sku) {
      // Generate a unique SKU from URL or use product_id if available
      const urlParts = product.url?.split('/') || [];
      const productId = urlParts[urlParts.length - 1] || product.url || `product-${Date.now()}`;
      product.meta.sku = productId.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    }
    if (!product.meta.gtin) {
      product.meta.gtin = product.meta.sku || "";
    }

    // Ensure rating exists
    if (!product.rating) {
      product.rating = {
        rating: 0,
        count: 0
      };
    }

    // Ensure seller exists
    if (!product.seller) {
      product.seller = {
        id: "",
        url: "",
        name: "Walmart",
        catalog_id: "",
        official_name: "Walmart"
      };
    }

    return product;
  } catch (err: any) {
    if (err.message === "RATE_LIMIT" || err.message === "NOT_FOUND" || err.message === "SERVER_ERROR" || err.message === "UNAUTHORIZED" || err.message === "UNKNOWN_ERROR") {
      throw err;
    }
    console.error("Error fetching product:", err);
    throw new Error("UNKNOWN_ERROR");
  }
}

export default fetchProduct;