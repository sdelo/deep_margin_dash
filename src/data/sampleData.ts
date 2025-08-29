// Static sample data for DeepBook v3 dashboard development
// This data represents what we'll get from RPC calls when the contracts are deployed

import type { DeepBookV3Data } from '../types/deepbook'

export const sampleDeepBookV3Data: DeepBookV3Data = {
    margin_managers: [
        {
            id: "manager_001",
            balance_manager_id: "balance_001",
            margin_pool_id: "pool_001",
            owner: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            created_at: 1704067200000, // Jan 1, 2024
            manager_info: {
                base: {
                    asset: "1000000000", // 1 SUI
                    debt: "500000000",   // 0.5 SUI borrowed
                    usd_asset: "2000000000", // $2.00
                    usd_debt: "1000000000",  // $1.00
                    liquidation_price: "1500000000" // $1.50
                },
                quote: {
                    asset: "500000000",  // 0.5 USDC
                    debt: "0",           // No USDC debt
                    usd_asset: "500000000",  // $0.50
                    usd_debt: "0",          // $0.00
                    liquidation_price: "0"
                },
                risk_ratio: "2000000000", // 2.0 (healthy)
                liquidation_threshold: "1200000000", // 1.2
                max_leverage: "1000000000" // 1.0x
            },
            net_equity_usd: "1500000000", // $1.50
            borrow_usage: "400000000",    // 40%
            distance_to_liquidation: "800000000", // 80%
            health_status: "healthy"
        },
        {
            id: "manager_002",
            balance_manager_id: "balance_002",
            margin_pool_id: "pool_002",
            owner: "0x8ba1f109551bD432803012645Hac136c772c3c2c",
            created_at: 1704153600000, // Jan 2, 2024
            manager_info: {
                base: {
                    asset: "500000000",  // 0.5 SUI
                    debt: "800000000",   // 0.8 SUI borrowed
                    usd_asset: "1000000000", // $1.00
                    usd_debt: "1600000000",  // $1.60
                    liquidation_price: "1200000000" // $1.20
                },
                quote: {
                    asset: "100000000",  // 0.1 USDC
                    debt: "0",
                    usd_asset: "100000000",  // $0.10
                    usd_debt: "0",
                    liquidation_price: "0"
                },
                risk_ratio: "1100000000", // 1.1 (warning)
                liquidation_threshold: "1200000000", // 1.2
                max_leverage: "1000000000" // 1.0x
            },
            net_equity_usd: "-500000000", // -$0.50
            borrow_usage: "1454545455",   // 145%
            distance_to_liquidation: "100000000", // 10%
            health_status: "warning"
        },
        {
            id: "manager_003",
            balance_manager_id: "balance_003",
            margin_pool_id: "pool_003",
            owner: "0x1234567890123456789012345678901234567890",
            created_at: 1704240000000, // Jan 3, 2024
            manager_info: {
                base: {
                    asset: "200000000",  // 0.2 SUI
                    debt: "1000000000",  // 1.0 SUI borrowed
                    usd_asset: "400000000",  // $0.40
                    usd_debt: "2000000000",  // $2.00
                    liquidation_price: "1100000000" // $1.10
                },
                quote: {
                    asset: "0",
                    debt: "0",
                    usd_asset: "0",
                    usd_debt: "0",
                    liquidation_price: "0"
                },
                risk_ratio: "1050000000", // 1.05 (danger)
                liquidation_threshold: "1200000000", // 1.2
                max_leverage: "1000000000" // 1.0x
            },
            net_equity_usd: "-1600000000", // -$1.60
            borrow_usage: "5000000000",    // 500%
            distance_to_liquidation: "150000000", // 15%
            health_status: "danger"
        },
        {
            id: "manager_004",
            balance_manager_id: "balance_004",
            margin_pool_id: "pool_001", // SUI/USDC pool - ACTIVE loan
            owner: "0xMultiPoolBorrower123456789012345678901234",
            created_at: 1704326400000, // Jan 4, 2024
            manager_info: {
                base: {
                    asset: "1500000000", // 1.5 SUI
                    debt: "600000000",   // 0.6 SUI borrowed
                    usd_asset: "3000000000", // $3.00
                    usd_debt: "1200000000",  // $1.20
                    liquidation_price: "1800000000" // $1.80
                },
                quote: {
                    asset: "800000000",  // 0.8 USDC
                    debt: "0",
                    usd_asset: "800000000",  // $0.80
                    usd_debt: "0",
                    liquidation_price: "0"
                },
                risk_ratio: "1750000000", // 1.75 (healthy)
                liquidation_threshold: "1200000000", // 1.2
                max_leverage: "1000000000" // 1.0x
            },
            net_equity_usd: "2600000000", // $2.60
            borrow_usage: "400000000",    // 40%
            distance_to_liquidation: "550000000", // 55%
            health_status: "healthy"
        }
        // Note: In the actual Move code, a margin manager can only have loans in ONE pool at a time.
        // The margin_pool_id field tracks the SINGLE active loan pool.
        // Multiple managers per owner is not the intended design.
    ],
    margin_pools: [
        {
            id: "pool_001", // SUI/USDC pool
            asset_type: "0x2::sui::SUI",
            total_supply: "10000000000", // 10 SUI
            total_borrow: "2300000000",  // 2.3 SUI
            utilization_rate: "230000000", // 23%
            base_rate: "50000000",       // 5% APY
            base_slope: "100000000",     // 10% slope
            optimal_utilization: "800000000", // 80%
            excess_slope: "200000000",   // 20% excess slope
            last_index_update_timestamp: 1704067200000,
            current_rate: "73000000",    // 7.3% APY
            daily_interest_cost_usd: "46000000", // $0.046
            weekly_interest_cost_usd: "322000000" // $0.322
        },
        {
            id: "pool_002", // WETH/USDC pool
            asset_type: "0x2::weth::WETH",
            total_supply: "5000000000",  // 5 WETH
            total_borrow: "800000000",   // 0.8 WETH borrowed
            utilization_rate: "160000000", // 16%
            base_rate: "50000000",       // 5% APY
            base_slope: "100000000",     // 10% slope
            optimal_utilization: "800000000", // 80%
            excess_slope: "200000000",   // 20% excess slope
            last_index_update_timestamp: 1704067200000,
            current_rate: "58000000",    // 5.8% APY
            daily_interest_cost_usd: "12800000", // $0.0128
            weekly_interest_cost_usd: "89600000" // $0.0896
        },
        {
            id: "pool_003", // USDC pool (for lending)
            asset_type: "0x2::usdc::USDC",
            total_supply: "5000000000",  // 5 USDC
            total_borrow: "0",           // 0 USDC borrowed
            utilization_rate: "0",       // 0%
            base_rate: "50000000",       // 5% APY
            base_slope: "100000000",     // 10% slope
            optimal_utilization: "800000000", // 80%
            excess_slope: "200000000",   // 20% excess slope
            last_index_update_timestamp: 1704067200000,
            current_rate: "50000000",    // 5% APY
            daily_interest_cost_usd: "0",
            weekly_interest_cost_usd: "0"
        }
    ],
    position_health_events: [
        {
            margin_manager_id: "0x1::margin_manager::MarginManager<0x2::sui::SUI, 0x2::usdc::USDC>",
            margin_pool_id: "0x1::margin_pool::MarginPool<0x2::sui::SUI>",
            owner: "0x1234567890abcdef1234567890abcdef12345678",
            base_asset_usd: "2000000000",
            quote_asset_usd: "500000000",
            base_debt_usd: "1000000000",
            quote_debt_usd: "0",
            net_equity_usd: "1500000000",
            risk_ratio: "2000000000",
            borrow_usage: "400000000",
            liquidation_threshold: "1200000000",
            distance_to_liquidation: "800000000",
            interest_accrued_usd: "50000000",
            daily_interest_cost_usd: "46000000",
            price_impact_base: "0",
            price_impact_quote: "0",
            timestamp: 1704067200000,
            oracle_price_base: "2000000000",
            oracle_price_quote: "1000000000"
        }
    ],
    interest_accrual_events: [
        {
            margin_manager_id: "0x1::margin_manager::MarginManager<0x2::sui::SUI, 0x2::usdc::USDC>",
            margin_pool_id: "0x1::margin_pool::MarginPool<0x2::sui::SUI>",
            owner: "0x1234567890abcdef1234567890abcdef12345678",
            base_interest_accrued: "50000000",
            quote_interest_accrued: "0",
            total_interest_usd: "50000000",
            current_base_rate: "73000000",
            current_quote_rate: "50000000",
            utilization_rate: "230000000",
            last_accrual_timestamp: 1704067200000,
            current_timestamp: 1704153600000,
            time_elapsed_ms: 86400000,
            daily_interest_cost_usd: "46000000",
            weekly_interest_cost_usd: "322000000"
        }
    ],
    liquidation_risk_alerts: [
        {
            margin_manager_id: "0x1::margin_manager::MarginManager<0x2::sui::SUI, 0x2::usdc::USDC>",
            margin_pool_id: "0x1::margin_pool::MarginPool<0x2::sui::SUI>",
            owner: "0xabcdef1234567890abcdef1234567890abcdef12",
            current_risk_ratio: "1100000000",
            liquidation_threshold: "1200000000",
            distance_to_liquidation: "100000000",
            health_status: "warning",
            timestamp: 1704153600000,
            oracle_price_base: "2000000000",
            oracle_price_quote: "1000000000"
        }
    ],
    price_impact_events: [
        {
            margin_manager_id: "0x1::margin_manager::MarginManager<0x2::sui::SUI, 0x2::usdc::USDC>",
            margin_pool_id: "0x1::margin_pool::MarginPool<0x2::sui::SUI>",
            owner: "0x7890abcdef1234567890abcdef1234567890abcd",
            price_change_base: "-100000000",
            price_change_quote: "0",
            new_risk_ratio: "1050000000",
            risk_ratio_change: "-50000000",
            liquidation_price_change_base: "50000000",
            liquidation_price_change_quote: "0",
            timestamp: 1704240000000,
            oracle_price_base: "1900000000",
            oracle_price_quote: "1000000000"
        }
    ],
    last_updated: Date.now(),
    data_source: "static"
}
