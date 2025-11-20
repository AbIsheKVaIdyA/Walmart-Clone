import Product from "@/components/Product";
import fetchSearch from "@/lib/fetchSearch";

type Props = {
  searchParams: {
    q: string;
  };
};

async function SearchPage({ searchParams: { q } }: Props) {
  const results = await fetchSearch(q);

  if (!results || !results.content) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-2">Results for {q}</h1>
        <h2 className="mb-5 text-gray-400">No results found</h2>
        <p className="text-gray-600">Please try a different search term.</p>
      </div>
    );
  }

  const organic = results.content.organic || [];
  const totalResults = results.content.total_results || 0;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-2">Results for {q}</h1>
      <h2 className="mb-5 text-gray-400">
        ({totalResults} results)
      </h2>

      {organic.length === 0 ? (
        <p className="text-gray-600">No products found. Please try a different search term.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {organic.map((product, index) => (
            <li key={`${product.product_id}-${product.url}-${index}`}>
              <Product product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchPage;
