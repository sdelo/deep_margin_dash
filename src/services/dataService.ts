import type { DashboardData, DataSourceConfig, MarginManager, MarginLoan, MarginLiquidation } from '../types/data'

// Default configuration
const DEFAULT_CONFIG: DataSourceConfig = {
    type: 'api',
    apiUrl: 'http://localhost:9008',
    staticDataPath: '/data/dashboard-data.json',
    refreshInterval: 30000 // 30 seconds
}

class DataService {
    private config: DataSourceConfig
    private currentData: DashboardData | null = null
    private lastFetchTime: number = 0

    constructor(config?: Partial<DataSourceConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.loadConfigFromEnvironment()
    }

    private loadConfigFromEnvironment() {
        // Check for environment variables or build-time configuration
        if (import.meta.env.VITE_DATA_SOURCE) {
            this.config.type = import.meta.env.VITE_DATA_SOURCE as 'api' | 'static'
        }
        
        if (import.meta.env.VITE_API_URL) {
            this.config.apiUrl = import.meta.env.VITE_API_URL
        }
        
        if (import.meta.env.VITE_STATIC_DATA_PATH) {
            this.config.staticDataPath = import.meta.env.VITE_STATIC_DATA_PATH
        }
        
        if (import.meta.env.VITE_REFRESH_INTERVAL) {
            this.config.refreshInterval = parseInt(import.meta.env.VITE_REFRESH_INTERVAL)
        }
    }

    async getData(): Promise<DashboardData> {
        const now = Date.now()
        
        // Check if we need to refresh data
        if (this.currentData && 
            this.config.refreshInterval && 
            (now - this.lastFetchTime) < this.config.refreshInterval) {
            return this.currentData
        }

        try {
            let data: DashboardData
            
            if (this.config.type === 'api') {
                data = await this.fetchFromAPI()
            } else {
                data = await this.fetchFromStaticFile()
            }

            // Add metadata
            data.lastUpdated = now
            data.dataSource = this.config.type
            
            this.currentData = data
            this.lastFetchTime = now
            
            return data
        } catch (error) {
            console.error('Failed to fetch data:', error)
            
            // Fallback to static data if API fails
            if (this.config.type === 'api' && this.currentData?.dataSource === 'static') {
                console.log('Falling back to cached static data')
                return this.currentData
            }
            
            throw error
        }
    }

    private async fetchFromAPI(): Promise<DashboardData> {
        if (!this.config.apiUrl) {
            throw new Error('API URL not configured')
        }

        const [managers, loans, liquidations] = await Promise.all([
            this.fetchFromEndpoint<MarginManager[]>('/margin_managers'),
            this.fetchFromEndpoint<MarginLoan[]>('/margin_loans'),
            this.fetchFromEndpoint<MarginLiquidation[]>('/margin_liquidations')
        ])

        return { managers, loans, liquidations, dataSource: 'api' as const }
    }

    private async fetchFromStaticFile(): Promise<DashboardData> {
        if (!this.config.staticDataPath) {
            throw new Error('Static data path not configured')
        }

        try {
            const response = await fetch(this.config.staticDataPath)
            if (!response.ok) {
                throw new Error(`Failed to fetch static data: ${response.statusText}`)
            }
            
            const data = await response.json()
            
            // Validate data structure
            if (!this.isValidDashboardData(data)) {
                throw new Error('Invalid data structure in static file')
            }
            
            return { ...data, dataSource: 'static' as const }
        } catch (error) {
            console.error('Error fetching static data:', error)
            throw error
        }
    }

    private async fetchFromEndpoint<T>(endpoint: string): Promise<T> {
        if (!this.config.apiUrl) {
            throw new Error('API URL not configured')
        }

        const response = await fetch(`${this.config.apiUrl}${endpoint}`)
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }
        return response.json()
    }

    private isValidDashboardData(data: any): data is DashboardData {
        return (
            Array.isArray(data.managers) &&
            Array.isArray(data.loans) &&
            Array.isArray(data.liquidations) &&
            data.managers.every((m: any) => 
                typeof m.id === 'string' &&
                typeof m.balance_manager_id === 'string' &&
                typeof m.owner === 'string' &&
                typeof m.created_at === 'number'
            ) &&
            data.loans.every((l: any) =>
                typeof l.id === 'string' &&
                typeof l.margin_manager_id === 'string' &&
                typeof l.margin_pool_id === 'string' &&
                typeof l.loan_amount === 'number' &&
                typeof l.borrowed_at === 'number' &&
                (l.repaid_at === null || typeof l.repaid_at === 'number') &&
                typeof l.status === 'string'
            ) &&
            data.liquidations.every((liq: any) =>
                typeof liq.id === 'string' &&
                typeof liq.margin_manager_id === 'string' &&
                typeof liq.margin_pool_id === 'string' &&
                typeof liq.liquidation_amount === 'number' &&
                typeof liq.pool_reward_amount === 'number' &&
                typeof liq.liquidator_base_reward === 'number' &&
                typeof liq.liquidator_quote_reward === 'number' &&
                typeof liq.default_amount === 'number' &&
                typeof liq.liquidated_at === 'number'
            )
        )
    }

    // Method to manually switch data source
    setDataSource(type: 'api' | 'static') {
        this.config.type = type
        this.currentData = null // Clear cache to force refresh
        this.lastFetchTime = 0
    }

    // Method to update configuration
    updateConfig(newConfig: Partial<DataSourceConfig>) {
        this.config = { ...this.config, ...newConfig }
        this.currentData = null // Clear cache to force refresh
        this.lastFetchTime = 0
    }

    // Get current configuration
    getConfig(): DataSourceConfig {
        return { ...this.config }
    }

    // Get current data source type
    getDataSourceType(): 'api' | 'static' {
        return this.config.type
    }
}

// Create and export the service instance
export const dataService = new DataService()

// Export the class for testing or custom instances
export { DataService }
