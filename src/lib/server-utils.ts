import { getServerSession } from "next-auth";
import "server-only";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export const checkAuthentication = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.error) {
    return redirect("/login");
  }
  return session.user;
};

export const getUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session || session.error || !session.user) {
    return null;
  }
  return session.user;
};

export const getLoggedInUserOrders = async () => {
  const user = await checkAuthentication();

  if (!user) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          priceAtOrder: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // This will sort the orders in descending order of their creation date
    },
  });

  return orders;
};
