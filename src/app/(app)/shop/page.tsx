"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Product } from "@prisma/client";
import Link from "next/link";

export default function Shop() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.log("error:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );

  if (error || products.length === 0)
    return (
      <div className="alert alert-error max-w-md mx-auto my-8">
        <AlertCircle className="w-6 h-6" />
        <span>{error || "No Product found"}</span>
      </div>
    );

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-5">Shop Page</h1>
      {products.map((product) => (
        <Link href={`/products/${product.id}`} key={product.id}>
          <div className="bg-white rounded-lg shadow p-6 w-fit">
            <Image
              src={product.imageUrl || ""}
              alt="Classic Kurta"
              width={300}
              height={200}
              className="rounded mb-4 h-[300px] max-h-[300px] object-cover"
            />
            <h3 className="text-lg font-bold mb-2 text-black">
              {product.name}
            </h3>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <div className="flex">
              <span className="text-indigo-600 font-semibold mr-auto">
                Rs. {Number(product.price)}
              </span>
              <div>
                <p className="">Qty. 1</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
