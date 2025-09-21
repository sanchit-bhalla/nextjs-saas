import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

interface OrderTableProps {
  orders: {
    id: string;
    totalAmount: Decimal;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    orderItems: {
      id: string;
      quantity: number;
      priceAtOrder: Decimal;
      product: {
        id: string;
        name: string;
        price: Decimal;
        imageUrl: string | null;
      };
    }[];
  }[];
}

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order Id</TableHead>
          <TableHead className="w-[100px]">Order Id</TableHead>
          <TableHead>Order Status</TableHead>
          <TableHead>Created AT</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>
              {order.orderItems.map((item) => (
                <div key={item.id}>
                  {item.product.name} × {item.quantity}
                </div>
              ))}
            </TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell>{formatDate(order.createdAt)}</TableCell>
            <TableCell>{order.paymentStatus}</TableCell>
            <TableCell className="text-right">
              ₹{order.totalAmount.toNumber().toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total</TableCell>
          <TableCell className="text-right">
            ₹{orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
