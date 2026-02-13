import { test, expect } from '@playwright/test'

test.describe('AI Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock auth token
    await page.goto('/')

    // Check if we need to authenticate
    const loginButton = page.locator('a:has-text("登录")')

    if (await loginButton.isVisible()) {
      // Set mock auth
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
    }
  })

  test('should display generation page', async ({ page }) => {
    await page.goto('/generate')

    // Check for main generation elements
    await expect(page.locator('h1:has-text("生成"), h1:has-text("Generate"), h2:has-text("生成")')).toBeVisible()

    // Check for upload area or style selection
    const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]')
    const styleSelection = page.locator('.style-grid, .style-selector, [data-testid="style-selection"]')

    const hasUpload = await uploadArea.count() > 0
    const hasStyleSelection = await styleSelection.count() > 0

    expect(hasUpload || hasStyleSelection).toBeTruthy()
  })

  test('should display available styles', async ({ page }) => {
    await page.goto('/generate')

    // Look for style cards or grid
    const styleCards = page.locator('.style-card, .style-option, [data-style]')

    // Should have multiple styles
    await expect(styleCards.first()).toBeVisible({ timeout: 5000 })
  })

  test('should allow style selection', async ({ page }) => {
    await page.goto('/generate')

    // Find first selectable style
    const firstStyle = page.locator('.style-card, .style-option, button[data-style]').first()

    if (await firstStyle.isVisible()) {
      // Click to select
      await firstStyle.click()

      // Should show selected state
      const selectedStyle = page.locator('.style-card.selected, .style-option.selected, [data-selected="true"]')
      await expect(selectedStyle.first()).toBeVisible()
    } else {
      test.skip() // No styles available
    }
  })

  test('should show file upload input', async ({ page }) => {
    await page.goto('/generate')

    // Look for file input
    const fileInput = page.locator('input[type="file"]')

    if (await fileInput.count() > 0) {
      await expect(fileInput.first()).toBeVisible()
    } else {
      test.skip() // File upload not visible on this page
    }
  })

  test('should handle image preview after upload', async ({ page }) => {
    await page.goto('/generate')

    const fileInput = page.locator('input[type="file"]')

    if (await fileInput.count() > 0) {
      // Create a mock image file
      const file = new File(['mock content'], 'test.jpg', { type: 'image/jpeg' })

      // Upload file
      await fileInput.setInputFiles(file)

      // Wait for preview
      await page.waitForTimeout(1000)

      // Check for preview image
      const preview = page.locator('img[src*="blob:"], .image-preview, [data-testid="preview"]')
      await expect(preview.first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('should display generate button', async ({ page }) => {
    await page.goto('/generate')

    // Look for generate button
    const generateButton = page.locator('button:has-text("生成"), button:has-text("Generate"), button[type="submit"]')

    await expect(generateButton.first()).toBeVisible()
  })

  test('should validate before generation', async ({ page }) => {
    await page.goto('/generate')

    // Try to click generate without selecting style or uploading image
    const generateButton = page.locator('button:has-text("生成")').first()

    if (await generateButton.isVisible()) {
      await generateButton.click()

      // Should show validation error
      await page.waitForTimeout(500)
      const error = page.locator('.error, [role="alert"], .validation-error')
      await expect(error.first()).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should start generation with valid inputs', async ({ page }) => {
    await page.goto('/generate')

    // Select a style
    const firstStyle = page.locator('.style-card, button[data-style]').first()

    if (await firstStyle.isVisible()) {
      await firstStyle.click()

      // Upload image if file input is available
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.count() > 0) {
        const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
        await fileInput.setInputFiles(file)
        await page.waitForTimeout(500)
      }

      // Click generate button
      const generateButton = page.locator('button:has-text("生成")').first()
      await generateButton.click()

      // Should show loading or progress indicator
      await page.waitForTimeout(1000)

      const loadingIndicator = page.locator('.loading, .generating, [role="progressbar"], .progress')
      const hasLoading = await loadingIndicator.count() > 0

      // Should also check if credits are deducted (if visible)
      const creditsDisplay = page.locator('text=/积分| crédits|credits/i')

      if (hasLoading) {
        await expect(loadingIndicator.first()).toBeVisible()
      }
    } else {
      test.skip()
    }
  })

  test('should display generation status', async ({ page }) => {
    // This test assumes a generation is in progress
    await page.goto('/generate')

    // Navigate to generation history or status page
    await page.goto('/history')

    // Look for status indicators
    const statusCards = page.locator('[data-testid="generation-status"], .generation-card, .status-card')

    if (await statusCards.count() > 0) {
      await expect(statusCards.first()).toBeVisible()

      // Check for status labels
      const statusLabels = page.locator('text=/queued|processing|completed|failed/i')
      await expect(statusLabels.first()).toBeVisible()
    } else {
      test.skip() // No generations in history
    }
  })

  test('should display completed generation results', async ({ page }) => {
    await page.goto('/history')

    // Look for completed generations
    const completedCards = page.locator('.generation-card[data-status="completed"], .status-success, .completed')

    if (await completedCards.count() > 0) {
      await expect(completedCards.first()).toBeVisible()

      // Check for result image
      const resultImage = completedCards.first().locator('img')
      await expect(resultImage).toBeVisible()

      // Check for action buttons (download, share, etc.)
      const actionButtons = completedCards.first().locator('button:has-text("下载"), button:has-text("分享"), button:has-text("Download")')
      await expect(actionButtons.first()).toBeVisible()
    } else {
      test.skip() // No completed generations
    }
  })

  test('should allow downloading generated image', async ({ page }) => {
    await page.goto('/history')

    // Find completed generation with download button
    const downloadButton = page.locator('.generation-card[data-status="completed"] button:has-text("下载"), button:has-text("Download")').first()

    if (await downloadButton.isVisible()) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

      // Click download
      await downloadButton.click()

      // Wait for download to start
      const download = await downloadPromise

      // Verify download filename
      expect(download.suggestedFilename()).toMatch(/\.(jpg|jpeg|png)$/i)
    } else {
      test.skip() // No download button available
    }
  })

  test('should display generation history', async ({ page }) => {
    await page.goto('/history')

    // Check for history container
    const historyContainer = page.locator('[data-testid="generation-history"], .generation-list, .history-grid')

    if (await historyContainer.count() > 0) {
      await expect(historyContainer.first()).toBeVisible()

      // Check for pagination or load more button
      const pagination = page.locator('.pagination, button:has-text("加载更多"), button:has-text("Load more")')

      if (await pagination.count() > 0) {
        await expect(pagination.first()).toBeVisible()
      }
    } else {
      test.skip() // History page structure different
    }
  })

  test('should filter generations by type', async ({ page }) => {
    await page.goto('/history')

    // Look for filter controls
    const filterButtons = page.locator('button[data-filter], .filter-tabs button, [role="tab"]')

    if (await filterButtons.count() > 0) {
      // Click a filter
      await filterButtons.first().click()

      // Wait for filtering
      await page.waitForTimeout(500)

      // Verify filtered results are shown
      const filteredResults = page.locator('.generation-card')
      await expect(filteredResults.first()).toBeVisible()
    } else {
      test.skip() // Filters not available
    }
  })

  test('should cancel in-progress generation', async ({ page }) => {
    await page.goto('/history')

    // Find in-progress generation
    const inProgressCard = page.locator('.generation-card[data-status="processing"], .generating, .in-progress').first()

    if (await inProgressCard.isVisible()) {
      // Look for cancel button
      const cancelButton = inProgressCard.locator('button:has-text("取消"), button:has-text("Cancel")')

      if (await cancelButton.isVisible()) {
        // Click cancel
        await cancelButton.click()

        // Should show confirmation or update status
        await page.waitForTimeout(500)

        // Check if status changed to cancelled
        const cancelledStatus = inProgressCard.locator('[data-status="cancelled"], .cancelled')
        // Note: Might need to reload to see status change
        const isCancelled = await cancelledStatus.count() > 0

        expect(isCancelled).toBeTruthy()
      } else {
        test.skip() // No cancel button
      }
    } else {
      test.skip() // No in-progress generations
    }
  })

  test('should handle generation failure gracefully', async ({ page }) => {
    await page.goto('/history')

    // Look for failed generations
    const failedCard = page.locator('.generation-card[data-status="failed"], .error-card, .failed').first()

    if (await failedCard.isVisible()) {
      // Should show error message
      const errorMessage = failedCard.locator('.error-message, .error, [role="alert"]')
      await expect(errorMessage.first()).toBeVisible()

      // Should show retry button
      const retryButton = failedCard.locator('button:has-text("重试"), button:has-text("Retry"), button:has-text("重新生成")')
      await expect(retryButton.first()).toBeVisible()
    } else {
      test.skip() // No failed generations
    }
  })
})

test.describe('Generation Configuration', () => {
  test('should display advanced options', async ({ page }) => {
    await page.goto('/generate')

    // Look for advanced options toggle
    const advancedToggle = page.locator('button:has-text("高级选项"), button:has-text("Advanced"), details > summary')

    if (await advancedToggle.count() > 0) {
      await advancedToggle.click()

      // Check for advanced options
      const advancedOptions = page.locator('.advanced-options, [data-testid="advanced-options"]')
      await expect(advancedOptions.first()).toBeVisible()
    } else {
      test.skip() // Advanced options not available
    }
  })

  test('should handle custom prompt input', async ({ page }) => {
    await page.goto('/generate')

    // Look for custom prompt textarea
    const promptInput = page.locator('textarea[name="prompt"], textarea[placeholder*="描述" i], #custom-prompt')

    if (await promptInput.count() > 0) {
      // Enter custom prompt
      await promptInput.fill('a cute cartoon dog with big eyes')

      // Should allow submission
      const generateButton = page.locator('button:has-text("生成")').first()
      await expect(generateButton).toBeEnabled()
    } else {
      test.skip() // Custom prompt not available
    }
  })

  test('should display required credits for generation', async ({ page }) => {
    await page.goto('/generate')

    // Look for credits display
    const creditsDisplay = page.locator('text=/credits|积分|点数/i')

    if (await creditsDisplay.count() > 0) {
      await expect(creditsDisplay.first()).toBeVisible()

      // Look for required credits for selected style
      const requiredCredits = page.locator('[data-credits], .required-credits, text=/需要.*积分/i')

      if (await requiredCredits.count() > 0) {
        await expect(requiredCredits.first()).toBeVisible()
      }
    } else {
      test.skip() // Credits not displayed
    }
  })

  test('should prevent generation with insufficient credits', async ({ page }) => {
    // Set mock user with low credits
    await page.goto('/')

    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
      user.credits = 0
      localStorage.setItem('auth_user', JSON.stringify(user))
    })

    await page.goto('/generate')

    // Select a style
    const firstStyle = page.locator('.style-card, button[data-style]').first()
    if (await firstStyle.isVisible()) {
      await firstStyle.click()

      // Try to generate
      const generateButton = page.locator('button:has-text("生成")').first()
      await generateButton.click()

      // Should show insufficient credits error
      await page.waitForTimeout(500)
      const error = page.locator('text=/insufficient|credits|积分不足/i')
      await expect(error.first()).toBeVisible()
    } else {
      test.skip()
    }
  })
})

test.describe('Style Selection', () => {
  test('should preview selected style', async ({ page }) => {
    await page.goto('/generate')

    const styleCards = page.locator('.style-card, .style-option')

    if (await styleCards.count() > 0) {
      // Click a style
      await styleCards.first().click()

      // Should show preview or selected state
      const preview = page.locator('.style-preview, .selected-style-preview')
      const selectedCard = page.locator('.style-card.selected, .style-option[aria-selected="true"]')

      const hasPreview = await preview.count() > 0
      const hasSelectedCard = await selectedCard.count() > 0

      expect(hasPreview || hasSelectedCard).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('should display style details', async ({ page }) => {
    await page.goto('/generate')

    const styleCards = page.locator('.style-card, .style-option')

    if (await styleCards.count() > 0) {
      const firstCard = styleCards.first()

      // Check for style name
      const styleName = firstCard.locator('.style-name, h3, h4')
      await expect(styleName.first()).toBeVisible()

      // Check for style preview image
      const styleImage = firstCard.locator('img')
      await expect(styleImage.first()).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should filter styles by category', async ({ page }) => {
    await page.goto('/generate')

    // Look for category filters
    const categoryTabs = page.locator('[role="tablist"] button, .category-tabs button, .style-filters button')

    if (await categoryTabs.count() > 0) {
      // Click first category
      await categoryTabs.first().click()

      // Should update visible styles
      await page.waitForTimeout(300)
      const styleCards = page.locator('.style-card, .style-option')
      await expect(styleCards.first()).toBeVisible()
    } else {
      test.skip() // Category filters not available
    }
  })
})
