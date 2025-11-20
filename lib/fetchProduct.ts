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
    const productAny = product as any;
    
    // Debug: Log the actual structure received
    console.log("=== PRODUCT STRUCTURE DEBUG ===");
    console.log("product.images:", product.images);
    console.log("product.image:", productAny.image);
    console.log("product.general:", productAny.general);
    console.log("product.primary_image:", productAny.primary_image);
    console.log("product.media:", productAny.media);
    console.log("product.photos:", productAny.photos);
    console.log("product.thumbnail:", productAny.thumbnail);
    console.log("Full product keys:", Object.keys(productAny));
    
    // Extract title from multiple possible locations
    if (!product.title || product.title === "Product") {
      // Try alternative locations for title
      const extractedTitle = productAny.name || 
                     productAny.product_name || 
                     productAny.title_text ||
                     productAny.heading ||
                     (productAny.general && (productAny.general.title || productAny.general.name || productAny.general.heading)) ||
                     (productAny.metadata && (productAny.metadata.title || productAny.metadata.name)) ||
                     null;
      
      if (extractedTitle && extractedTitle !== "Product") {
        product.title = extractedTitle;
      } else if (!product.title) {
        product.title = "Product";
      }
    }

    // Create a simple SVG placeholder as data URI (no external fetch needed)
    const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
    
    // Extract images from multiple possible locations - check ALL locations, not just first match
    let images: any[] = [];
    
    // Try primary location - product.images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      images = [...images, ...product.images];
    }
    
    // Try product.image (string or array)
    if (productAny.image) {
      if (typeof productAny.image === 'string') {
        images.push(productAny.image);
      } else if (Array.isArray(productAny.image)) {
        images = [...images, ...productAny.image];
      }
    }
    
    // Try product.general.image (like in search results)
    if (productAny.general) {
      if (productAny.general.image) {
        const generalImages = Array.isArray(productAny.general.image) ? productAny.general.image : [productAny.general.image];
        images = [...images, ...generalImages];
      }
      if (productAny.general.images && Array.isArray(productAny.general.images)) {
        images = [...images, ...productAny.general.images];
      }
    }
    
    // Try product.primary_image
    if (productAny.primary_image) {
      const primaryImages = Array.isArray(productAny.primary_image) ? productAny.primary_image : [productAny.primary_image];
      images = [...images, ...primaryImages];
    }
    
    // Try product.media
    if (productAny.media) {
      if (Array.isArray(productAny.media)) {
        images = [...images, ...productAny.media];
      } else if (productAny.media.images && Array.isArray(productAny.media.images)) {
        images = [...images, ...productAny.media.images];
      } else if (productAny.media.image) {
        const mediaImages = Array.isArray(productAny.media.image) ? productAny.media.image : [productAny.media.image];
        images = [...images, ...mediaImages];
      }
    }
    
    // Try product.photos
    if (productAny.photos && Array.isArray(productAny.photos)) {
      images = [...images, ...productAny.photos];
    }
    
    // Try product.thumbnail
    if (productAny.thumbnail) {
      images.push(productAny.thumbnail);
    }
    
    // Try product.gallery
    if (productAny.gallery && Array.isArray(productAny.gallery)) {
      images = [...images, ...productAny.gallery];
    }
    
    console.log("Extracted images array:", images);
    
    // Normalize images to strings and convert relative URLs to absolute
    if (images.length > 0) {
      const normalizedImages = images.map((img: any) => {
        let imageUrl: string = "";
        
        if (typeof img === 'string') {
          imageUrl = img;
        } else if (typeof img === 'object' && img !== null) {
          // Try various object properties
          imageUrl = img.url || 
                     img.src || 
                     img.image || 
                     img.link || 
                     img.href || 
                     img.original || 
                     img.full || 
                     img.medium ||
                     img.large ||
                     (Array.isArray(img) ? img[0] : String(img));
        } else {
          imageUrl = String(img);
        }
        
        // Convert relative URLs to absolute
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('//')) {
          // If it starts with /, prepend https://www.walmart.com
          if (imageUrl.startsWith('/')) {
            imageUrl = `https://www.walmart.com${imageUrl}`;
          } else if (imageUrl) {
            // Try to make it absolute
            imageUrl = `https://www.walmart.com/${imageUrl}`;
          }
        }
        
        return imageUrl;
      }).filter((img: string) => {
        // Filter out invalid images
        return img && 
               img !== 'undefined' && 
               img !== 'null' &&
               img.trim() !== '' &&
               (img.startsWith('http://') || 
                img.startsWith('https://') || 
                img.startsWith('data:') ||
                img.startsWith('//'));
      });
      
      console.log("Normalized images:", normalizedImages);
      
      if (normalizedImages.length > 0) {
        // Remove duplicates
        product.images = Array.from(new Set(normalizedImages));
      } else {
        product.images = [placeholderImage];
      }
    } else {
      product.images = [placeholderImage];
    }
    
    console.log("Final product.images:", product.images);

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