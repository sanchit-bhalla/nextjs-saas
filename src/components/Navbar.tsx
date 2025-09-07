import Image from "next/image";
import Link from "next/link";

function Navbar() {
  const isLoggedIn = false; // Dummy authentication state for demonstration
  return (
    <nav className="w-full flex items-center justify-between py-4 px-8 bg-white shadow mb-8">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-800">Seth Traders</span>
        </Link>
        <Link
          href="/"
          className="text-gray-700 hover:text-indigo-600 font-medium"
        >
          Home
        </Link>
        <Link
          href="/shop"
          className="text-gray-700 hover:text-indigo-600 font-medium"
        >
          Shop
        </Link>
        <Link
          href="/orders"
          className="text-gray-700 hover:text-indigo-600 font-medium"
        >
          Orders
        </Link>
        <Link
          href="/all-orders"
          className="text-gray-700 hover:text-indigo-600 font-medium"
        >
          View all Orders
        </Link>
      </div>
      <div>
        {isLoggedIn ? (
          <Link
            href="/logout"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Logout
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
