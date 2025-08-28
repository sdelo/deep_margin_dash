// DeepBook v3 Data Service
// Handles data retrieval from static files, RPC calls, and future event streams
// Follows the same pattern as your existing dataService.ts

import type { DeepBookV3Data, PositionSummary, DashboardMetrics } from '../types/deepbook'
import { sampleDeepBookV3Data } from '../data/sampleData'

export interface DeepBookDataSourceConfig {
    type: 'static' | 'rpc' | 'events'
    rpcUrl?: string
    staticDataPath?: string
    refreshInterval?: number // in milliseconds
    enableRealTimeUpdates?: boolean
}

// Default configuration
const DEFAULT_CONFIG: DeepBookDataSourceConfig = {
    type: 'static',
    staticDataPath: undefined, // No default static file path
    refreshInterval: 30000, // 30 seconds
    enableRealTimeUpdates: false
}

class DeepBookDataService {
    private config: DeepBookDataSourceConfig
    private currentData: DeepBookV3Data | null = null
    private lastFetchTime: number = 0
    private eventSource: EventSource | null = null

    constructor(config?: Partial<DeepBookDataSourceConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.loadConfigFromEnvironment()
    }

    private loadConfigFromEnvironment() {
        if (import.meta.env.VITE_DEEPBOOK_DATA_SOURCE) {
            this.config.type = import.meta.env.VITE_DEEPBOOK_DATA_SOURCE as 'static' | 'rpc' | 'events'
        }

        if (import.meta.env.VITE_DEEPBOOK_RPC_URL) {
            this.config.rpcUrl = import.meta.env.VITE_DEEPBOOK_RPC_URL
        }

        if (import.meta.env.VITE_DEEPBOOK_STATIC_DATA_PATH) {
            this.config.staticDataPath = import.meta.env.VITE_DEEPBOOK_STATIC_DATA_PATH
        }

        if (import.meta.env.VITE_DEEPBOOK_REFRESH_INTERVAL) {
            this.config.refreshInterval = parseInt(import.meta.env.VITE_DEEPBOOK_REFRESH_INTERVAL)
        }

        if (import.meta.env.VITE_DEEPBOOK_REAL_TIME_UPDATES) {
            this.config.enableRealTimeUpdates = import.meta.env.VITE_DEEPBOOK_REAL_TIME_UPDATES === 'true'
        }
    }

    async getData(): Promise<DeepBookV3Data> {
        const now = Date.now()

        // Check if we need to refresh data
        if (this.currentData &&
            this.config.refreshInterval &&
            (now - this.lastFetchTime) < this.config.refreshInterval) {
            return this.currentData
        }

        try {
            let data: DeepBookV3Data

            switch (this.config.type) {
                case 'rpc':
                    data = await this.fetchFromRPC()
                    break
                case 'events':
                    data = await this.fetchFromEvents()
                    break
                case 'static':
                default:
                    data = await this.fetchFromStaticFile()
                    break
            }

            // Add metadata
            data.last_updated = now
            data.data_source = this.config.type

            this.currentData = data
            this.lastFetchTime = now

            return data
        } catch (error) {
            console.error('Failed to fetch DeepBook v3 data:', error)

            // Fallback to static data if other sources fail
            if (this.currentData?.data_source === 'static') {
                console.log('Falling back to cached static data')
                return this.currentData
            }

            // Ultimate fallback to sample data
            console.log('Falling back to sample data')
            return sampleDeepBookV3Data
        }
    }

    private async fetchFromRPC(): Promise<DeepBookV3Data> {
        if (!this.config.rpcUrl) {
            throw new Error('RPC URL not configured')
        }

        // TODO: Implement actual RPC calls when contracts are deployed
        // This will use Sui SDK to call the manager_info function and other Move functions

        throw new Error('RPC data source not yet implemented - contracts not deployed')
    }

    private async fetchFromEvents(): Promise<DeepBookV3Data> {
        if (!this.config.enableRealTimeUpdates) {
            throw new Error('Real-time updates not enabled')
        }

        // TODO: Implement event streaming when contracts support it
        // This will connect to Sui event streams for real-time updates

        throw new Error('Event streaming not yet implemented')
    }

    private async fetchFromStaticFile(): Promise<DeepBookV3Data> {
        if (!this.config.staticDataPath) {
            // No static file configured, use sample data directly
            console.log('No static file path configured, using sample data')
            return sampleDeepBookV3Data
        }

        try {
            const response = await fetch(this.config.staticDataPath)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            return this.validateAndTransformData(data)
        } catch (error) {
            console.warn('Failed to fetch static file, using sample data:', error)
            return sampleDeepBookV3Data
        }
    }

    private validateAndTransformData(data: any): DeepBookV3Data {
        // Basic validation and transformation
        // In production, you'd want more robust validation
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format')
        }

        return {
            margin_managers: data.margin_managers || [],
            margin_pools: data.margin_pools || [],
            position_health_events: data.position_health_events || [],
            interest_accrual_events: data.interest_accrual_events || [],
            liquidation_risk_alerts: data.liquidation_risk_alerts || [],
            price_impact_events: data.price_impact_events || [],
            last_updated: data.last_updated || Date.now(),
            data_source: data.data_source || 'static'
        }
    }

    // Helper methods for computed metrics
    async getPositionSummaries(): Promise<PositionSummary[]> {
        const data = await this.getData()

        return data.margin_managers.map(manager => {
            if (!manager.manager_info) {
                return null
            }

            const baseAssetUsd = parseInt(manager.manager_info.base.usd_asset) / 1000000000
            const quoteAssetUsd = parseInt(manager.manager_info.quote.usd_asset) / 1000000000
            const baseDebtUsd = parseInt(manager.manager_info.base.usd_debt) / 1000000000
            const quoteDebtUsd = parseInt(manager.manager_info.quote.usd_debt) / 1000000000
            const healthFactor = parseInt(manager.manager_info.risk_ratio) / 1000000000
            const liquidationThreshold = parseInt(manager.manager_info.liquidation_threshold) / 1000000000

            const netEquityUsd = baseAssetUsd + quoteAssetUsd - baseDebtUsd - quoteDebtUsd
            const borrowUsage = (baseDebtUsd + quoteDebtUsd) / (baseAssetUsd + quoteAssetUsd)
            const distanceToLiquidation = (healthFactor - liquidationThreshold) / liquidationThreshold

            let healthStatus: 'healthy' | 'warning' | 'danger' | 'liquidatable' = 'healthy'
            if (healthFactor <= liquidationThreshold) {
                healthStatus = 'liquidatable'
            } else if (healthFactor <= liquidationThreshold * 1.2) {
                healthStatus = 'danger'
            } else if (healthFactor <= liquidationThreshold * 1.5) {
                healthStatus = 'warning'
            }

            return {
                manager_id: manager.id,
                owner: manager.owner,
                base_asset_usd: baseAssetUsd,
                quote_asset_usd: quoteAssetUsd,
                base_debt_usd: baseDebtUsd,
                quote_debt_usd: quoteDebtUsd,
                net_equity_usd: netEquityUsd,
                health_factor: healthFactor,
                borrow_usage: borrowUsage,
                liquidation_threshold: liquidationThreshold,
                distance_to_liquidation: distanceToLiquidation,
                daily_interest_cost_usd: 0, // TODO: Calculate from interest events
                health_status: healthStatus,
                last_updated: manager.created_at
            }
        }).filter(Boolean) as PositionSummary[]
    }

    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const positions = await this.getPositionSummaries()

        const totalPositions = positions.length
        const totalNetEquityUsd = positions.reduce((sum, pos) => sum + pos.net_equity_usd, 0)
        const totalDebtUsd = positions.reduce((sum, pos) => sum + pos.base_debt_usd + pos.quote_debt_usd, 0)
        const averageHealthFactor = positions.reduce((sum, pos) => sum + pos.health_factor, 0) / totalPositions
        const positionsAtRisk = positions.filter(pos => pos.health_status !== 'healthy').length
        const totalDailyInterestCostUsd = positions.reduce((sum, pos) => sum + pos.daily_interest_cost_usd, 0)

        return {
            total_positions: totalPositions,
            total_net_equity_usd: totalNetEquityUsd,
            total_debt_usd: totalDebtUsd,
            average_health_factor: averageHealthFactor,
            positions_at_risk: positionsAtRisk,
            total_daily_interest_cost_usd: totalDailyInterestCostUsd,
            last_updated: Date.now()
        }
    }

    // Method to switch data sources at runtime
    updateConfig(newConfig: Partial<DeepBookDataSourceConfig>) {
        this.config = { ...this.config, ...newConfig }

        // Clear cached data when switching sources
        this.currentData = null
        this.lastFetchTime = 0

        // Stop event source if switching away from events
        if (this.config.type !== 'events' && this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }
    }

    // Cleanup method
    destroy() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }
    }
}

// Export singleton instance
export const deepbookDataService = new DeepBookDataService()

// Export class for testing or multiple instances
export { DeepBookDataService }
