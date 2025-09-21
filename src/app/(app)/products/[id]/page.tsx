"use client";
import { Product } from "@prisma/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { RazorpayPaymentResponse } from "../../../../../types/razorpay";

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { data: session } = useSession();
  console.log("Inside product page, session:", session);

  useEffect(() => {
    const fetchProduct = async () => {
      const id = params?.id;

      if (!id) {
        setError("Product ID is missing");
        setLoading(false);
        return;
      }

      try {
        const data = await fetch(`/api/products/${id}`);
        const res = await data.json();
        if (!data.ok) {
          throw new Error(res.message || "Failed to fetch product");
        }
        setProduct(res);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  const handlePurchase = async () => {
    if (!session) {
      toast.info("Please sign in to make a purchase");
      router.push("/login");
      return;
    }

    if (!product?.id) {
      toast.error("Invalid product");
      return;
    }

    try {
      setProcessing(true);
      toast.loading("Initializing payment...", { id: "payment-init" });
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      toast.dismiss("payment-init");

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login again to continue");
          router.push("/login");
        } else if (res.status === 429) {
          toast.error("Too many requests. Please try again later.");
        } else {
          // You can parse the error res body to get more details
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to initialize payment.");
        }
        setProcessing(false);
        return;
      }

      const { orderId, amount, currency, rzpKey } = await res.json();

      const options = {
        key: rzpKey,
        amount: amount,
        currency, // 'INR',
        name: "Seth Traders",
        description: `${product.name} from Seth Traders`,
        order_id: orderId,
        handler: async function (response: RazorpayPaymentResponse) {
          // console.log("Inside success handler:", response);
          if (response.razorpay_payment_id) {
            toast.loading("Verifying Payment, Please do not change screen", {
              id: "payment-verify",
            });
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const result = await verifyRes.json();
            toast.dismiss("payment-verify");
            if (!verifyRes.ok || !result.success) {
              toast.error(
                result.error ||
                  "Payment verification failed. Please contact support."
              );
              setProcessing(false);
              return;
            }
            toast.success(result.message || "Payment successful!");
            router.replace("/orders");
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.dismiss("payment-init");
            toast.dismiss("payment-verify");
            toast.info("Payment cancelled");
          },
        },
        theme: {
          // color: "#F37254",
          color: "#2b7fff",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.dismiss("payment-init");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate payment. Please try again."
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );

  if (error || !product)
    return (
      <div className="alert alert-error max-w-md mx-auto my-8">
        <AlertCircle className="w-6 h-6" />
        <span>{error || "Product not found"}</span>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow p-6 w-fit">
      <Image
        src={product.imageUrl || ""}
        alt="Classic Kurta"
        width={300}
        height={200}
        className="rounded mb-4 h-[300px] max-h-[300px] object-cover"
      />
      <h3 className="text-lg font-bold mb-2 text-black">{product.name}</h3>
      <p className="text-gray-600 mb-2">{product.description}</p>
      <div className="flex">
        <span className="text-indigo-600 font-semibold mr-auto">
          Rs. {Number(product.price)}
        </span>
        <Button
          size="sm"
          disabled={processing || !!error}
          onClick={handlePurchase}
        >
          {processing && <Loader2Icon className="animate-spin" />}
          {processing ? "Please wait" : "Buy Now"}
        </Button>
      </div>
    </div>
  );
}
