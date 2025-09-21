import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.error) {
      return NextResponse.json({ error: "Session Expired" }, { status: 401 });
    }
    const { orderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayPaymentId || !razorpaySignature || !orderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 401 });
    }

    console.log("finding pending order: ", { orderId, session });
    const pendingOrder = await prisma.order.findFirst({
      where: {
        razorpayOrderId: orderId,
        userId: session.user.id,
        // paymentStatus: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // If payment already captured by webhook
    if (pendingOrder?.paymentStatus === "captured")
      return NextResponse.json({
        success: true,
        message: "Payment captured successfully 🎉",
      });

    if (!pendingOrder)
      return NextResponse.json({ error: "Order not found!" }, { status: 401 });

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = generatedSignature === razorpaySignature;
    console.log("authorized");

    const updatedOrder = await prisma.order.update({
      where: {
        id: pendingOrder.id,
        paymentStatus: "pending",
      },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus: isValid ? "authorized" : "failed",
        status: isValid ? "processing" : "cancelled",
      },
    });
    if (!isValid)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    else if (!updatedOrder)
      // webhook already updated status
      return NextResponse.json({
        success: true,
        message: "Payment captured successfully 🎉",
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
