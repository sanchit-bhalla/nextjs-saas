import { OrderTable } from "@/components/OrderTable";
import { getLoggedInUserOrders } from "@/lib/server-utils";

export default async function OrdersPage() {
  const orders = await getLoggedInUserOrders();
  // console.log({ orders });
  return (
    <div className="min-h-screen  max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-5">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600 mt-4">You have no orders yet.</p>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}
