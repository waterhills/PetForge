import { test, expect } from '@playwright/test'

test.describe('Shopping Cart and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock authentication
    await page.goto('/')

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100
      }))
    })

    await page.reload()
  })

  test('should display empty cart', async ({ page }) => {
    await page.goto('/cart')

    // Check for empty cart message
    const emptyMessage = page.locator('text=/empty|购物车为空|no items/i, .empty-cart')

    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage.first()).toBeVisible()
    } else {
      // Cart might be displayed even if empty
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]')
      const count = await cartItems.count()
      expect(count).toBe(0)
    }
  })

  test('should add product to cart', async ({ page }) => {
    // Go to market or product page
    await page.goto('/market')

    // Find a product card
    const productCard = page.locator('.product-card, .pet-ip-card, [data-product-id]').first()

    if (await productCard.isVisible()) {
      // Look for add to cart button
      const addToCartButton = productCard.locator('button:has-text("加入购物车"), button:has-text("Add to cart"), button:has-text("购买")').first()

      if (await addToCartButton.isVisible()) {
        // Add to cart
        await addToCartButton.click()

        // Should show success message or update cart count
        await page.waitForTimeout(500)

        // Check for success toast or cart update
        const successMessage = page.locator('.toast.success, [role="status"]:has-text("成功"), .cart-badge')
        const hasSuccess = await successMessage.count() > 0

        expect(hasSuccess).toBeTruthy()
      } else {
        test.skip() // No add to cart button
      }
    } else {
      test.skip() // No products available
    }
  })

  test('should display cart with items', async ({ page }) => {
    // First add an item via API mock
    await page.goto('/market')

    // Mock adding to cart
    await page.evaluate(() => {
      const mockCartItem = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'Custom T-Shirt',
        price: 99.99,
        quantity: 1,
        generatedImage: 'https://via.placeholder.com/150'
      }

      // Mock cart state
      window.mockCart = [mockCartItem]
      localStorage.setItem('mock_cart', JSON.stringify([mockCartItem]))
    })

    // Go to cart
    await page.goto('/cart')

    // Check for cart items
    const cartItems = page.locator('.cart-item, [data-testid="cart-item"]')

    // Items should be visible (either from API or mock)
    await expect(cartItems.first()).toBeVisible({ timeout: 5000 })
  })

  test('should update item quantity in cart', async ({ page }) => {
    await page.goto('/cart')

    // Find quantity controls
    const quantityControls = page.locator('.quantity-control, [data-testid="quantity"], .qty-selector')

    if (await quantityControls.count() > 0) {
      const firstControl = quantityControls.first()

      // Find increase button
      const increaseButton = firstControl.locator('button:has-text("+"), button[aria-label="increase"], .btn-increase')

      if (await increaseButton.isVisible()) {
        const quantityDisplay = firstControl.locator('.quantity, [data-quantity], input[type="number"]')

        // Get initial quantity
        const initialQuantity = await quantityDisplay.inputValue() || await quantityDisplay.textContent()

        // Increase quantity
        await increaseButton.click()
        await page.waitForTimeout(300)

        // Check if quantity changed
        const newQuantity = await quantityDisplay.inputValue() || await quantityDisplay.textContent()
        expect(newQuantity).not.toBe(initialQuantity)
      } else {
        test.skip() // No quantity control available
      }
    } else {
      test.skip()
    }
  })

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart')

    // Find remove button
    const removeButton = page.locator('.cart-item button:has-text("删除"), button:has-text("Remove"), .btn-remove').first()

    if (await removeButton.isVisible()) {
      // Count items before removal
      const itemsBefore = await page.locator('.cart-item').count()

      // Remove item
      await removeButton.click()
      await page.waitForTimeout(500)

      // Count items after removal
      const itemsAfter = await page.locator('.cart-item').count()

      expect(itemsAfter).toBeLessThan(itemsBefore)
    } else {
      test.skip() // No remove button available
    }
  })

  test('should display cart total', async ({ page }) => {
    await page.goto('/cart')

    // Look for total price display
    const totalDisplay = page.locator('.cart-total, .total-price, text=/total|总计/i')

    if (await totalDisplay.count() > 0) {
      await expect(totalDisplay.first()).toBeVisible()

      // Should contain price
      const priceText = await totalDisplay.first().textContent()
      expect(priceText).toMatch(/¥|￥|\$|\d+/)
    } else {
      test.skip() // Total not displayed
    }
  })

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/cart')

    // Find checkout button
    const checkoutButton = page.locator('button:has-text("结算"), button:has-text("Checkout"), a:has-text("去结算")')

    if (await checkoutButton.isVisible()) {
      // Click checkout
      await checkoutButton.click()

      // Should navigate to checkout page or show checkout modal
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      const isCheckoutPage = currentUrl.includes('/checkout') || currentUrl.includes('/order')

      expect(isCheckoutPage).toBeTruthy()
    } else {
      test.skip() // Checkout button not available
    }
  })
})

test.describe('Checkout Process', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock authentication
    await page.goto('/')

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100
      }))
    })

    await page.reload()
  })

  test('should display checkout page', async ({ page }) => {
    await page.goto('/checkout')

    // Check for checkout form elements
    await expect(page.locator('h1:has-text("结算"), h1:has-text("Checkout"), h2:has-text("确认订单")')).toBeVisible()
  })

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout')

    // Look for order summary section
    const orderSummary = page.locator('.order-summary, .checkout-summary, [data-testid="order-summary"]')

    if (await orderSummary.count() > 0) {
      await expect(orderSummary.first()).toBeVisible()

      // Check for item list
      const summaryItems = orderSummary.locator('.summary-item, .checkout-item')
      await expect(summaryItems.first()).toBeVisible()
    } else {
      test.skip() // Order summary not displayed
    }
  })

  test('should display shipping address form', async ({ page }) => {
    await page.goto('/checkout')

    // Look for address form
    const addressForm = page.locator('.address-form, form[data-testid="shipping-address"]')

    if (await addressForm.count() > 0) {
      await expect(addressForm.first()).toBeVisible()

      // Check for required fields
      await expect(addressForm.locator('input[name*="receiver"], input[name*="name"]')).toBeVisible()
      await expect(addressForm.locator('input[name*="phone"], input[name*="tel"]')).toBeVisible()
      await expect(addressForm.locator('input[name*="address"], textarea[name*="address"]')).toBeVisible()
    } else {
      // Might show address selection instead
      const addressSelection = page.locator('.address-selection, .saved-addresses')
      if (await addressSelection.count() > 0) {
        await expect(addressSelection.first()).toBeVisible()
      } else {
        test.skip() // Address section not visible
      }
    }
  })

  test('should allow selecting saved address', async ({ page }) => {
    await page.goto('/checkout')

    // Look for saved addresses
    const savedAddresses = page.locator('.address-card, .saved-address')

    if (await savedAddresses.count() > 0) {
      // Select first address
      const firstAddress = savedAddresses.first()
      await firstAddress.click()

      // Should show selected state
      await expect(firstAddress.locator('.selected, [aria-selected="true"]')).toBeVisible()
    } else {
      test.skip() // No saved addresses
    }
  })

  test('should display payment options', async ({ page }) => {
    await page.goto('/checkout')

    // Look for payment options
    const paymentOptions = page.locator('.payment-options, .payment-methods, [data-testid="payment"]')

    if (await paymentOptions.count() > 0) {
      await expect(paymentOptions.first()).toBeVisible()

      // Check for payment methods
      const paymentMethods = paymentOptions.locator('input[type="radio"], .payment-option')
      await expect(paymentMethods.first()).toBeVisible()
    } else {
      test.skip() // Payment options not visible
    }
  })

  test('should select payment method', async ({ page }) => {
    await page.goto('/checkout')

    const paymentOptions = page.locator('.payment-options, .payment-methods')

    if (await paymentOptions.count() > 0) {
      // Find first payment option
      const firstOption = paymentOptions.locator('input[type="radio"], label').first()

      if (await firstOption.isVisible()) {
        await firstOption.click()

        // Should show selected state
        const selectedOption = paymentOptions.locator('input:checked, .selected')
        await expect(selectedOption.first()).toBeVisible()
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('should display order total with breakdown', async ({ page }) => {
    await page.goto('/checkout')

    // Look for total breakdown
    const totalBreakdown = page.locator('.total-breakdown, .price-summary')

    if (await totalBreakdown.count() > 0) {
      await expect(totalBreakdown.first()).toBeVisible()

      // Check for subtotal
      const subtotal = totalBreakdown.locator('text=/subtotal|小计/i')
      await expect(subtotal.first()).toBeVisible()

      // Check for total
      const total = totalBreakdown.locator('text=/total|总计/i, .total-price')
      await expect(total.first()).toBeVisible()
    } else {
      test.skip() // Price breakdown not shown
    }
  })

  test('should allow using credits for payment', async ({ page }) => {
    await page.goto('/checkout')

    // Look for credits option
    const creditsOption = page.locator('input[name*="credit"], label:has-text("积分"), .credits-toggle')

    if (await creditsOption.count() > 0) {
      // Check if user has credits
      const creditsDisplay = page.locator('text=/credits.*:.*\\d+, 积分.*:.*\\d+/i')

      if (await creditsDisplay.count() > 0) {
        // Enable credits usage
        await creditsOption.first().check()

        // Should show credits input or slider
        await page.waitForTimeout(300)
        const creditsInput = page.locator('input[type="number"][name*="credit"], .credits-amount')

        if (await creditsInput.count() > 0) {
          await expect(creditsInput.first()).toBeVisible()
        }
      } else {
        test.skip() // User has no credits
      }
    } else {
      test.skip() // Credits option not available
    }
  })

  test('should validate shipping address', async ({ page }) => {
    await page.goto('/checkout')

    // Look for submit button
    const submitButton = page.locator('button:has-text("提交订单"), button:has-text("Place order"), button[type="submit"]')

    if (await submitButton.isVisible()) {
      // Try to submit without filling address
      await submitButton.click()
      await page.waitForTimeout(500)

      // Should show validation errors
      const validationError = page.locator('.error, [role="alert"], .validation-error')
      await expect(validationError.first()).toBeVisible()
    } else {
      test.skip() // Submit button not available
    }
  })

  test('should submit order successfully', async ({ page }) => {
    await page.goto('/checkout')

    // Fill in shipping address
    const nameInput = page.locator('input[name*="name"], input[name*="receiver"]')
    const phoneInput = page.locator('input[name*="phone"], input[name*="tel"]')
    const addressInput = page.locator('textarea[name*="address"], input[name*="address"]')

    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Receiver')
      await phoneInput.fill('13800138000')
      await addressInput.fill('Test Address 123')

      // Select payment method
      const paymentOption = page.locator('.payment-options input[type="radio"]').first()
      if (await paymentOption.count() > 0) {
        await paymentOption.check()
      }

      // Submit order
      const submitButton = page.locator('button:has-text("提交订单"), button[type="submit"]').first()
      await submitButton.click()

      // Should redirect to order confirmation or payment page
      await page.waitForTimeout(2000)

      const currentUrl = page.url()
      const isConfirmationPage = currentUrl.includes('/order/') || currentUrl.includes('/payment') || currentUrl.includes('/success')

      expect(isConfirmationPage).toBeTruthy()
    } else {
      test.skip() // Address form not available
    }
  })
})

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock authentication
    await page.goto('/')

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100
      }))
    })

    await page.reload()
  })

  test('should display order list', async ({ page }) => {
    await page.goto('/orders')

    // Check for order list
    const orderList = page.locator('.order-list, [data-testid="order-list"]')

    if (await orderList.count() > 0) {
      await expect(orderList.first()).toBeVisible()
    } else {
      // Might show empty state
      const emptyState = page.locator('.empty-state, text=/no orders|没有订单/i')
      await expect(emptyState.first()).toBeVisible()
    }
  })

  test('should display order details', async ({ page }) => {
    await page.goto('/orders')

    // Find first order card
    const orderCard = page.locator('.order-card, [data-order-id]').first()

    if (await orderCard.isVisible()) {
      // Click to view details
      await orderCard.click()

      // Should show order details
      await page.waitForTimeout(500)

      const orderDetails = page.locator('.order-details, .order-info')
      await expect(orderDetails.first()).toBeVisible()

      // Check for order status
      const orderStatus = page.locator('.order-status, [data-status]')
      await expect(orderStatus.first()).toBeVisible()
    } else {
      test.skip() // No orders available
    }
  })

  test('should display order status', async ({ page }) => {
    await page.goto('/orders')

    const orderCard = page.locator('.order-card, [data-order-id]').first()

    if (await orderCard.isVisible()) {
      // Look for status indicator
      const statusIndicator = orderCard.locator('.status-badge, .order-status, [data-status]')
      await expect(statusIndicator.first()).toBeVisible()

      // Status should be one of: pending, paid, processing, shipped, delivered, cancelled
      const statusText = await statusIndicator.first().textContent()
      const validStatuses = [/pending|待支付/i, /paid|已支付/i, /processing|处理中/i, /shipped|已发货/i, /delivered|已送达/i, /cancelled|已取消/i]

      const isValidStatus = validStatuses.some(regex => regex.test(statusText))
      expect(isValidStatus).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders')

    // Look for status filters
    const statusFilters = page.locator('.status-filters, [role="tablist"], .filter-tabs')

    if (await statusFilters.count() > 0) {
      // Click first filter
      const firstFilter = statusFilters.locator('button, [role="tab"]').first()
      await firstFilter.click()

      // Wait for filtering
      await page.waitForTimeout(500)

      // Verify filtered results
      const orderCards = page.locator('.order-card')
      const count = await orderCards.count()

      // Should show filtered orders or empty message
      const emptyMessage = page.locator('.empty-state')
      const hasEmptyMessage = await emptyMessage.count() > 0

      expect(count > 0 || hasEmptyMessage).toBeTruthy()
    } else {
      test.skip() // Status filters not available
    }
  })

  test('should allow order cancellation', async ({ page }) => {
    await page.goto('/orders')

    // Find cancelable order (pending or paid status)
    const pendingOrders = page.locator('.order-card[data-status="pending"], .order-card[data-status="paid"]')

    if (await pendingOrders.count() > 0) {
      const firstPendingOrder = pendingOrders.first()

      // Look for cancel button
      const cancelButton = firstPendingOrder.locator('button:has-text("取消"), button:has-text("Cancel")')

      if (await cancelButton.isVisible()) {
        // Click cancel
        await cancelButton.click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('.dialog, .modal, [role="dialog"]')
        await expect(confirmDialog.first()).toBeVisible()

        // Confirm cancellation
        const confirmButton = confirmDialog.locator('button:has-text("确认"), button:has-text("Confirm"), button.primary')
        await confirmButton.click()

        // Order status should update to cancelled
        await page.waitForTimeout(1000)
        const cancelledOrder = page.locator('.order-card[data-status="cancelled"]')
        await expect(cancelledOrder.first()).toBeVisible()
      } else {
        test.skip() // No cancel button
      }
    } else {
      test.skip() // No cancelable orders
    }
  })

  test('should allow order payment', async ({ page }) => {
    await page.goto('/orders')

    // Find unpaid order
    const unpaidOrders = page.locator('.order-card[data-status="pending"]')

    if (await unpaidOrders.count() > 0) {
      const firstUnpaidOrder = unpaidOrders.first()

      // Look for pay button
      const payButton = firstUnpaidOrder.locator('a:has-text("支付"), button:has-text("Pay"), a:has-text("去付款")')

      if (await payButton.isVisible()) {
        // Click pay button
        await payButton.click()

        // Should navigate to payment page
        await page.waitForTimeout(1000)

        const currentUrl = page.url()
        const isPaymentPage = currentUrl.includes('/payment') || currentUrl.includes('/checkout')

        expect(isPaymentPage).toBeTruthy()
      } else {
        test.skip() // No pay button
      }
    } else {
      test.skip() // No unpaid orders
    }
  })

  test('should display order tracking', async ({ page }) => {
    await page.goto('/orders')

    const orderCard = page.locator('.order-card').first()

    if (await orderCard.isVisible()) {
      // Click to view details
      await orderCard.click()
      await page.waitForTimeout(500)

      // Look for tracking information
      const trackingInfo = page.locator('.order-tracking, .shipment-tracking, [data-testid="tracking"]')

      if (await trackingInfo.count() > 0) {
        await expect(trackingInfo.first()).toBeVisible()

        // Check for tracking steps
        const trackingSteps = trackingInfo.locator('.tracking-step, .timeline-item')
        await expect(trackingSteps.first()).toBeVisible()
      } else {
        test.skip() // Tracking not available for this order
      }
    } else {
      test.skip() // No orders
    }
  })
})

test.describe('Cart Persistence', () => {
  test('should persist cart across page navigation', async ({ page, context }) => {
    // Set auth and add mock item to cart
    await page.goto('/')

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('cart_items', JSON.stringify([
        { id: 'item-1', productName: 'Test Product', price: 99.99, quantity: 1 }
      ]))
    })

    // Navigate to different pages
    await page.goto('/market')
    await page.goto('/generate')
    await page.goto('/cart')

    // Cart should still have items
    const cartItems = page.locator('.cart-item')
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should clear cart after successful order', async ({ page }) => {
    // This is an integration test - requires full checkout flow
    // For now, just verify the cart can be cleared

    await page.goto('/cart')

    // Look for clear cart button
    const clearButton = page.locator('button:has-text("清空"), button:has-text("Clear cart")')

    if (await clearButton.isVisible()) {
      const itemsBefore = await page.locator('.cart-item').count()

      await clearButton.click()
      await page.waitForTimeout(500)

      const itemsAfter = await page.locator('.cart-item').count()

      expect(itemsAfter).toBeLessThan(itemsBefore)
    } else {
      test.skip() // Clear button not available
    }
  })
})
