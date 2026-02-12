import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'default-user'

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { petIp: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: cartItems })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId = 'default-user',
      petIpId,
      productType,
      productName,
      price,
      size,
      baseStyle,
      quantity = 1,
    } = body

    const cartItem = await prisma.cartItem.create({
      data: {
        userId,
        petIpId,
        productType,
        productName,
        price,
        size,
        baseStyle,
        quantity,
      },
      include: { petIp: true },
    })

    return NextResponse.json({ success: true, data: cartItem })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cartItemId = searchParams.get('id')

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID required' },
        { status: 400 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { error: 'Failed to delete cart item' },
      { status: 500 }
    )
  }
}
