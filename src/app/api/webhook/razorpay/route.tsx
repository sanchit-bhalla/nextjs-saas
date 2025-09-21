import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Event: ", event.event);

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await prisma.order.update({
        where: {
          razorpayOrderId: payment.order_id,
          paymentStatus: { not: "captured" },
        },
        data: {
          razorpayPaymentId: payment.id,
          status: "cancelled",
          paymentStatus: "failed",
        },
      });

      // TODO: SEND MAIl
    } else if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      await prisma.order.update({
        where: {
          razorpayOrderId: payment.order_id,
          paymentStatus: { not: "captured" },
        },
        data: {
          razorpayPaymentId: payment.id,
          status: "processing",
          paymentStatus: "captured",
        },
      });
      console.log("Payment captured✅");
      // TODO: SEND MAIl
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
