// Utility functions for working with DeepBook v3 data
// Handles 9-decimal precision conversions and calculations

export const MOVE_DECIMALS = 9
export const MOVE_DECIMAL_FACTOR = 10 ** MOVE_DECIMALS

/**
 * Convert Move 9-decimal precision string to number
 * @param moveValue - String value from Move contract (e.g., "1000000000" = 1.0)
 * @returns Human-readable number
 */
export function fromMoveValue(moveValue: string): number {
    return parseInt(moveValue) / MOVE_DECIMAL_FACTOR
}

/**
 * Convert number to Move 9-decimal precision string
 * @param value - Human-readable number
 * @returns Move contract format string
 */
export function toMoveValue(value: number): string {
    return Math.round(value * MOVE_DECIMAL_FACTOR).toString()
}

/**
 * Format USD value with proper currency formatting
 * @param moveValue - Move contract USD value string
 * @returns Formatted USD string
 */
export function formatUSD(moveValue: string): string {
    const value = fromMoveValue(moveValue)
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

/**
 * Format percentage value
 * @param moveValue - Move contract percentage value string
 * @returns Formatted percentage string
 */
export function formatPercentage(moveValue: string): string {
    const value = fromMoveValue(moveValue) * 100
    return `${value.toFixed(2)}%`
}

/**
 * Calculate health status based on risk ratio and liquidation threshold
 * @param riskRatio - Current risk ratio from Move contract
 * @param liquidationThreshold - Liquidation threshold from Move contract
 * @returns Health status string
 */
export function calculateHealthStatus(
    riskRatio: string,
    liquidationThreshold: string
): 'healthy' | 'warning' | 'danger' | 'liquidatable' {
    const risk = fromMoveValue(riskRatio)
    const threshold = fromMoveValue(liquidationThreshold)

    if (risk <= threshold) {
        return 'liquidatable'
    } else if (risk <= threshold * 1.2) {
        return 'danger'
    } else if (risk <= threshold * 1.5) {
        return 'warning'
    } else {
        return 'healthy'
    }
}

/**
 * Calculate distance to liquidation as a percentage
 * @param riskRatio - Current risk ratio
 * @param liquidationThreshold - Liquidation threshold
 * @returns Distance as percentage (0-100)
 */
export function calculateDistanceToLiquidation(
    riskRatio: string,
    liquidationThreshold: string
): number {
    const risk = fromMoveValue(riskRatio)
    const threshold = fromMoveValue(liquidationThreshold)

    if (risk <= threshold) {
        return 0
    }

    const distance = ((risk - threshold) / threshold) * 100
    return Math.max(0, Math.min(100, distance))
}

/**
 * Calculate borrow usage percentage
 * @param totalDebtUsd - Total debt in USD
 * @param totalAssetsUsd - Total assets in USD
 * @returns Borrow usage as percentage
 */
export function calculateBorrowUsage(
    totalDebtUsd: string,
    totalAssetsUsd: string
): number {
    const debt = fromMoveValue(totalDebtUsd)
    const assets = fromMoveValue(totalAssetsUsd)

    if (assets === 0) return 0
    return (debt / assets) * 100
}

/**
 * Calculate net equity in USD
 * @param baseAssetUsd - Base asset value in USD
 * @param quoteAssetUsd - Quote asset value in USD
 * @param baseDebtUsd - Base debt value in USD
 * @param quoteDebtUsd - Quote debt value in USD
 * @returns Net equity in USD
 */
export function calculateNetEquity(
    baseAssetUsd: string,
    quoteAssetUsd: string,
    baseDebtUsd: string,
    quoteDebtUsd: string
): number {
    const baseAsset = fromMoveValue(baseAssetUsd)
    const quoteAsset = fromMoveValue(quoteAssetUsd)
    const baseDebt = fromMoveValue(baseDebtUsd)
    const quoteDebt = fromMoveValue(quoteDebtUsd)

    return baseAsset + quoteAsset - baseDebt - quoteDebt
}

/**
 * Format large numbers with K, M, B suffixes
 * @param value - Number to format
 * @returns Formatted string
 */
export function formatLargeNumber(value: number): string {
    if (value >= 1e9) {
        return (value / 1e9).toFixed(2) + 'B'
    } else if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + 'M'
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(2) + 'K'
    } else {
        return value.toFixed(2)
    }
}

/**
 * Get color for health status
 * @param status - Health status
 * @returns CSS color string
 */
export function getHealthStatusColor(status: 'healthy' | 'warning' | 'danger' | 'liquidatable'): string {
    switch (status) {
        case 'healthy':
            return '#10b981' // green-500
        case 'warning':
            return '#f59e0b' // amber-500
        case 'danger':
            return '#ef4444' // red-500
        case 'liquidatable':
            return '#7c2d12' // red-900
        default:
            return '#6b7280' // gray-500
    }
}
