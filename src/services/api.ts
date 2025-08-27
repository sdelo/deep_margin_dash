const API_BASE_URL = 'http://localhost:9008'

export interface MarginManager {
    id: string
    balance_manager_id: string
    owner: string
    created_at: number
}

export interface MarginLoan {
    id: string
    margin_manager_id: string
    margin_pool_id: string
    loan_amount: number
    borrowed_at: number
    repaid_at: number | null
    status: string
}

export interface MarginLiquidation {
    id: string
    margin_manager_id: string
    margin_pool_id: string
    liquidation_amount: number
    pool_reward_amount: number
    liquidator_base_reward: number
    liquidator_quote_reward: number
    default_amount: number
    liquidated_at: number
}

class ApiService {
    private async fetch<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`)
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }
        return response.json()
    }

    async getMarginManagers(): Promise<MarginManager[]> {
        return this.fetch<MarginManager[]>('/margin_managers')
    }

    async getMarginLoans(): Promise<MarginLoan[]> {
        return this.fetch<MarginLoan[]>('/margin_loans')
    }

    async getMarginLiquidations(): Promise<MarginLiquidation[]> {
        return this.fetch<MarginLiquidation[]>('/margin_liquidations')
    }

    async getMarginManager(id: string): Promise<MarginManager | null> {
        return this.fetch<MarginManager | null>(`/margin_manager/${id}`)
    }

    async getMarginLoansByManager(managerId: string): Promise<MarginLoan[]> {
        return this.fetch<MarginLoan[]>(`/margin_loans/manager/${managerId}`)
    }

    async getMarginLiquidationsByManager(managerId: string): Promise<MarginLiquidation[]> {
        return this.fetch<MarginLiquidation[]>(`/margin_liquidations/manager/${managerId}`)
    }

    // Helper method to get all data at once
    async getAllData() {
        try {
            const [managers, loans, liquidations] = await Promise.all([
                this.getMarginManagers(),
                this.getMarginLoans(),
                this.getMarginLiquidations()
            ])

            return {
                managers,
                loans,
                liquidations
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
            throw error
        }
    }
}

export const apiService = new ApiService()
