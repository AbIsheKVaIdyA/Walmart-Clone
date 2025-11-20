import { Result } from "@/typings/searchTypings";

async function fetchSearch(searchTerm: string) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;

  if (!username || !password) {
    return null;
  }

  try {
    const newUrl = new URL(`https://www.walmart.com/search?q=${searchTerm}`);

    const response = await fetch("https://realtime.oxylabs.io/v1/queries", {
      method: "POST",
      body: JSON.stringify({
        source: "universal_ecommerce",
        url: newUrl.toString(),
        geo_location: "United States",
        parse: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.error || data.message) {
      return null;
    }

    // Get products from content.results (not content.organic!)
    let organic: any[] = [];
    let totalResults = 0;

    if (data.results?.[0]?.content?.results && Array.isArray(data.results[0].content.results)) {
      organic = data.results[0].content.results;
      totalResults = data.results[0].content.page_details?.total_results || 
                    data.results[0].content.total_results || 
                    organic.length;
    }
    else if (data.results?.[0]?.content?.organic && Array.isArray(data.results[0].content.organic)) {
      organic = data.results[0].content.organic;
      totalResults = data.results[0].content.page_details?.total_results || 
                    data.results[0].content.total_results || 
                    organic.length;
    }

    if (organic.length === 0) {
      return null;
    }

    // Transform products - extract from general wrapper
    // Filter out invalid items first, then map to avoid nulls in the array
    const transformedOrganic = organic
      .filter((item: any): item is any => item && typeof item === 'object')
      .map((item: any, index: number) => {
        const general = item.general || {};
        
        // Extract all fields properly
        const transformed = {
          url: general.url || item.url || "",
          image: general.image || item.image || "",
          title: general.title || item.title || "Product",
          product_id: general.product_id || item.product_id || `product-${index}`,
          price: item.price ? {
            price: typeof item.price === 'object' ? (item.price.price || 0) : (item.price || 0),
            currency: typeof item.price === 'object' ? (item.price.currency || "USD") : "USD"
          } : { price: 0, currency: "USD" },
          rating: item.rating ? {
            rating: item.rating.rating || 0,
            count: item.rating.count || 0
          } : { rating: 0, count: 0 },
          seller: item.seller || { name: "" },
          badge: general.badge || item.badge,
          variants: item.variants || [],
        };

        return transformed;
      });

    if (transformedOrganic.length === 0) {
      return null;
    }

    const result: Result = {
      content: {
        url: "",
        organic: transformedOrganic,
        total_results: totalResults,
        last_visible_page: 1,
        parse_status_code: 200,
      }
    };

    return result;
  } catch (err: any) {
    console.error("Error:", err.message);
    return null;
  }
}

export default fetchSearch;
