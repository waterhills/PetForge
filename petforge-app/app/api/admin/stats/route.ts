import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalPetIPs, totalOrders, pendingOrders] = await Promise.all([
      prisma.user.count(),
      prisma.petIP.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
    ]);

    // Calculate total revenue from completed orders
    const completedOrders = await prisma.order.findMany({
      where: { status: "completed" },
      select: { totalAmount: true },
    });

    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPetIPs,
        totalOrders,
        pendingOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
