/**
 * Order State Machine
 *
 * Implements a state machine for order status transitions with proper validation
 * and history tracking.
 *
 * Status Flow:
 * pending -> paid
 * pending -> cancelled
 * paid -> processing
 * processing -> shipped
 * shipped -> delivered
 *
 * Any state -> cancelled (before delivered)
 * delivered -> refunded (special case)
 */

// Valid order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Valid state transitions
const VALID_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

// Terminal states (no further transitions possible)
const TERMINAL_STATES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.REFUNDED
];

/**
 * Check if a state transition is valid
 */
export function isValidTransition(fromStatus, toStatus) {
  if (!fromStatus) {
    return toStatus === ORDER_STATUS.PENDING;
  }
  const allowedTransitions = VALID_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status) {
  return TERMINAL_STATES.includes(status);
}

/**
 * Get next valid statuses for a given status
 */
export function getNextValidStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate order status transition
 */
export function validateTransition(fromStatus, toStatus) {
  if (!isValidTransition(fromStatus, toStatus)) {
    const validNext = getNextValidStatuses(fromStatus);
    const validStr = validNext.length > 0 ? validNext.join(', ') : 'none';
    throw new Error(
      'Invalid state transition: ' + fromStatus + ' -> ' + toStatus + '. ' +
      'Valid transitions from ' + fromStatus + ': ' + validStr
    );
  }
}

/**
 * Transition order to new status with history tracking
 */
export async function transitionOrderStatus(prisma, orderId, newStatus, reason = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    throw new Error('Order not found: ' + orderId);
  }

  const fromStatus = order.status;
  validateTransition(fromStatus, newStatus);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: fromStatus !== newStatus ? fromStatus : null,
        toStatus: newStatus,
        reason,
      },
    });

    return updated;
  });

  return updatedOrder;
}

/**
 * Handle payment success - transition from pending to paid
 */
export async function handlePaymentSuccess(prisma, orderId) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.PAID,
    'Payment completed successfully'
  );
}

/**
 * Handle payment failure - transition to cancelled
 */
export async function handlePaymentFailure(prisma, orderId, reason) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.CANCELLED,
    'Payment failed: ' + reason
  );
}

/**
 * Handle order processing - transition from paid to processing
 */
export async function handleOrderProcessing(prisma, orderId) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.PROCESSING,
    'Order is being processed'
  );
}

/**
 * Handle order shipment - transition from processing to shipped
 */
export async function handleOrderShipment(prisma, orderId) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.SHIPPED,
    'Order has been shipped'
  );
}

/**
 * Handle order delivery - transition from shipped to delivered
 */
export async function handleOrderDelivery(prisma, orderId) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.DELIVERED,
    'Order has been delivered'
  );
}

/**
 * Handle order cancellation
 */
export async function handleOrderCancellation(prisma, orderId, reason) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.CANCELLED,
    reason || 'Order cancelled'
  );
}

/**
 * Handle order refund
 */
export async function handleOrderRefund(prisma, orderId, reason) {
  return transitionOrderStatus(
    prisma,
    orderId,
    ORDER_STATUS.REFUNDED,
    reason || 'Order refunded'
  );
}

export { ORDER_STATUS };
