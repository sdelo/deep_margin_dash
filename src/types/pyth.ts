// Pyth Network Price Feed Types
export interface PythPriceFeed {
    id: string
    price: {
        price: string
        conf: string
        expo: number
        publish_time: number
    }
    ema_price: {
        price: string
        conf: string
        expo: number
        publish_time: number
    }
}

export interface PythPriceData {
    price: number
    confidence: number
    exponent: number
    publishTime: number
    emaPrice: number
    emaConfidence: number
}

export interface AssetPriceInfo {
    symbol: string
    currentPrice: number
    priceChangePercent: number
    targetPrice: number
    liquidationPrice: number
    priceFeedId: string
    decimals: number
}

export interface PoolPriceMapping {
    poolId: string
    baseAsset: string
    quoteAsset: string
    baseAssetPriceFeedId: string
    quoteAssetPriceFeedId: string
    baseAssetDecimals: number
    quoteAssetDecimals: number
}
