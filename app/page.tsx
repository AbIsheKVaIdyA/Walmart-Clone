import GridOption from "@/components/GridOption";


export default function Home() {
  return (
    <main className="">
      <div className="grid grid-cols-1 grid-flow-row-dense md:grid-cols-4 gap-6 m-6 ">
        <GridOption
          title="Sweet gifts for less"
          image="https://links.papareact.com/1dy"
          className="big-pink-200 h-full md:h-32"
        />

        <GridOption
          title="Shop Wardrobe"
          image="https://links.papareact.com/8ko"
          className="big-blue-100 col-span-2 row-span-2"
        />

        <GridOption
          title="Shop Home"
          image="https://links.papareact.com/szu"
          className="big-pink-200 row-span-2"
        />

        <GridOption
          title="Shop Electronics"
          image="https://links.papareact.com/n7r"
          className="big-yellow-100 h-64"
        />

        <GridOption
          title="Shop Toys"
          image="https://links.papareact.com/pj2"
          className="big-green-100 h-64 col-span-2"
        />

        <GridOption
          title="All you need for match day"
          image="https://links.papareact.com/m8e"
          className="big-red-100 col-span-2 row-span-2"
        />

        <GridOption
          title="Shop Gadgets"
          image="https://links.papareact.com/gs1"
          className="big-orange-100 h-64"
        />

        <GridOption
          title="Shop Beauty"
          image="https://links.papareact.com/4y0"
          className="big-blue-100 h-64"
        />

        <GridOption
          title="Shop Sports"
          image="https://links.papareact.com/Sq2"
          className="big-blue-100 h-64"
        />

        <GridOption
          title="Free Shipping"
          image="https://links.papareact.com/9fh"
          className="big-rose-100 h-64"
        />

        <GridOption
          title="Flash Deals"
          image="https://links.papareact.com/qx7"
          className="big-orange-200 h-64 col-span-2"
        />
      </div>
    </main>
  );
}
