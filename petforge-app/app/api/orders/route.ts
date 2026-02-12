import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PF${timestamp}${random}`
}

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'default-user'

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to get orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId = 'default-user',
      items,
      receiverName,
      receiverPhone,
      receiverAddress,
      paymentMethod,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        totalAmount,
        receiverName,
        receiverPhone,
        receiverAddress,
        paymentMethod,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productType: item.productType,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            specifications: JSON.stringify({
              size: item.size,
              baseStyle: item.baseStyle,
            }),
          })),
        },
      },
      include: { items: true },
    })

    // Clear cart items (optional - remove if you want to keep cart history)
    await prisma.cartItem.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
