import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Navbar */}
      {/* <Navbar /> */}
      <section className="max-w-2xl w-full text-center py-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Seth Traders</h1>
        <p className="text-lg text-gray-600 mb-8">
          Discover premium shawls and stylish clothes. Quality, tradition, and
          fashion—delivered to your doorstep.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
        >
          Shop Now
        </Link>
      </section>
      <section id="shop" className="max-w-4xl w-full py-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <Image
              src="https://m.media-amazon.com/images/I/81tSgFsfOnL._AC_UL480_FMwebp_QL65_.jpg"
              alt="Premium Shawl"
              width={300}
              height={200}
              className="rounded mb-4 max-h-[300px] object-cover"
            />
            <h3 className="text-lg font-bold mb-2 text-black">Premium Shawl</h3>
            <p className="text-gray-600 mb-2">
              Soft, warm, and elegant. Perfect for any occasion.
            </p>
            <span className="text-indigo-600 font-semibold">Rs. 490</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <Image
              src="https://m.media-amazon.com/images/I/71BkSxuWHgL._AC_UL480_FMwebp_QL65_.jpg"
              alt="Designer Dress"
              width={300}
              height={200}
              className="rounded mb-4 max-h-[300px] object-cover"
            />
            <h3 className="text-lg font-bold mb-2 text-black">
              Designer Dress
            </h3>
            <p className="text-gray-600 mb-2">
              Modern styles with traditional touches.
            </p>
            <span className="text-indigo-600 font-semibold">Rs. 790</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <Image
              src="https://m.media-amazon.com/images/I/71xULJlZzCL._AC_UL480_FMwebp_QL65_.jpg"
              alt="Classic Kurta"
              width={300}
              height={200}
              className="rounded mb-4 h-[300px] max-h-[300px] object-cover"
            />
            <h3 className="text-lg font-bold mb-2 text-black">Classic Kurta</h3>
            <p className="text-gray-600 mb-2">
              Comfortable and stylish for everyday wear.
            </p>
            <span className="text-indigo-600 font-semibold">Rs. 390</span>
          </div>
        </div>
      </section>
      <footer className="w-full text-center py-6 text-gray-500">
        &copy; {new Date().getFullYear()} Shawl & Clothes Trading Company. All
        rights reserved.
      </footer>
    </main>
  );
}
