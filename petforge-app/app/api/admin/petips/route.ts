import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const petIPs = await prisma.petIP.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: petIPs,
    });
  } catch (error) {
    console.error("PetIPs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PetIPs" },
      { status: 500 }
    );
  }
}
