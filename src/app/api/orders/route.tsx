import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await req.json();
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: Number(product.price) * quantity * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        productId: productId.toString(),
      },
    });
    // console.log("order response: ", order);

    if (!rzpOrder || !rzpOrder.id) {
      return NextResponse.json(
        { error: "Failed to create Razorpay order" },
        { status: 500 }
      );
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount: product.price,
        razorpayOrderId: rzpOrder.id,
        paymentStatus: "pending",
        orderItems: {
          create: [
            {
              productId,
              quantity,
              priceAtOrder: product.price,
            },
          ],
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order. Please try again later" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      rzpKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
