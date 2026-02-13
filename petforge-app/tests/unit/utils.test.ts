import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  truncate,
  isValidEmail,
  isValidPhone,
  generateId,
  sleep,
  debounce,
  throttle,
} from '../../lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle Tailwind conflicts properly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(cn(null, undefined, 'foo')).toBe('foo')
    })

    it('should merge arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      expect(formatCurrency(99.99)).toBe('¥99.99')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('¥0.00')
    })

    it('should format integers', () => {
      expect(formatCurrency(100)).toBe('¥100.00')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999.99)).toBe('¥999999.99')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('¥-50.00')
    })

    it('should handle decimal precision correctly', () => {
      expect(formatCurrency(99.999)).toBe('¥100.00')
    })
  })

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-02-13')
      const result = formatDate(date)
      expect(result).toContain('2024')
      expect(result).toContain('2')
    })

    it('should format date string', () => {
      const result = formatDate('2024-02-13')
      expect(result).toContain('2024')
    })

    it('should handle invalid date strings', () => {
      const result = formatDate('invalid')
      expect(result).toBe('Invalid Date')
    })

    it('should format current date', () => {
      const result = formatDate(new Date())
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('truncate', () => {
    it('should return text as-is when shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('should return text as-is when equal to maxLength', () => {
      expect(truncate('hello', 5)).toBe('hello')
    })

    it('should truncate text longer than maxLength', () => {
      expect(truncate('hello world', 8)).toBe('hello wo...')
    })

    it('should handle empty string', () => {
      expect(truncate('', 5)).toBe('')
    })

    it('should handle maxLength of 0', () => {
      expect(truncate('hello', 0)).toBe('...')
    })

    it('should handle negative maxLength', () => {
      expect(truncate('hello', -1)).toBe('...')
    })

    it('should handle very long text', () => {
      const longText = 'a'.repeat(1000)
      const result = truncate(longText, 50)
      expect(result.length).toBe(53) // 50 + '...'
    })

    it('should preserve text when truncated', () => {
      expect(truncate('hello world', 7)).toBe('hello w...')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@example.com')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('should reject emails without @ symbol', () => {
      expect(isValidEmail('userexample.com')).toBe(false)
    })

    it('should reject emails without domain', () => {
      expect(isValidEmail('user@')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true)
      expect(isValidEmail('123@example.com')).toBe(true)
    })
  })

  describe('isValidPhone', () => {
    it('should validate correct Chinese phone numbers', () => {
      expect(isValidPhone('13800138000')).toBe(true)
      expect(isValidPhone('15912345678')).toBe(true)
      expect(isValidPhone('18699999999')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12345678901')).toBe(false) // Invalid prefix
      expect(isValidPhone('1380013800')).toBe(false) // Too short
      expect(isValidPhone('138001380000')).toBe(false) // Too long
      expect(isValidPhone('abcdefghijk')).toBe(false) // Non-numeric
    })

    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false)
    })

    it('should reject numbers with spaces or special chars', () => {
      expect(isValidPhone('138 0013 8000')).toBe(false)
      expect(isValidPhone('138-0013-8000')).toBe(false)
      expect(isValidPhone('+8613800138000')).toBe(false)
    })

    it('should validate all valid prefixes', () => {
      expect(isValidPhone('13012345678')).toBe(true)
      expect(isValidPhone('14012345678')).toBe(false) // 14 is not valid
      expect(isValidPhone('15012345678')).toBe(true)
      expect(isValidPhone('16012345678')).toBe(false) // 16 is not valid
      expect(isValidPhone('17012345678')).toBe(false) // 17 is not valid
      expect(isValidPhone('18012345678')).toBe(true)
      expect(isValidPhone('19012345678')).toBe(true)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate string IDs', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should contain timestamp and random part', () => {
      const id = generateId()
      expect(id).toContain('-')
      const parts = id.split('-')
      expect(parts.length).toBe(2)
      expect(parts[0]).toMatch(/^\d+$/) // Timestamp
      expect(parts[1].length).toBe(9) // Random part
    })

    it('should generate different IDs in quick succession', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should resolve after specified time', async () => {
      const promise = sleep(1000)
      vi.advanceTimersByTime(1000)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should handle zero delay', async () => {
      await expect(sleep(0)).resolves.toBeUndefined()
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 300)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should reset delay on subsequent calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 300)

      debounced()
      vi.advanceTimersByTime(100)
      debounced()
      vi.advanceTimersByTime(100)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 300)

      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(300)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should handle multiple rapid calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 300)

      debounced()
      debounced()
      debounced()
      vi.advanceTimersByTime(300)

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should limit function execution frequency', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 300)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1) // Still 1, throttled

      vi.advanceTimersByTime(300)
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 300)

      throttled('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should execute immediately on first call', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 300)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should handle calls within throttle period', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 300)

      throttled()
      vi.advanceTimersByTime(100)
      throttled()
      vi.advanceTimersByTime(100)
      throttled()
      vi.advanceTimersByTime(300)

      expect(fn).toHaveBeenCalledTimes(2) // First + after throttle period
    })
  })
})
