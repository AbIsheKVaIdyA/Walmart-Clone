import fetchProduct from "@/lib/fetchProduct";


type Props = {
    searchParams: {
    url: string;
    };
    };
    async function ProductPage({ searchParams: { url } }: Props) {
    const product = await fetchProduct(url);

    console.log(product);
    return <div>ProductPage</div>;
    }
    export default ProductPage;