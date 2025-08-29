import type { PythPriceFeed, PythPriceData, AssetPriceInfo, PoolPriceMapping } from '../types/pyth'

// Pool to price feed mappings
const POOL_PRICE_MAPPINGS: PoolPriceMapping[] = [
    {
        poolId: 'pool_001',
        baseAsset: 'SUI',
        quoteAsset: 'USDC',
        baseAssetPriceFeedId: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744', // SUI/USD
        quoteAssetPriceFeedId: '', // USDC is stable, no price feed needed
        baseAssetDecimals: 8,
        quoteAssetDecimals: 6
    },
    {
        poolId: 'pool_002',
        baseAsset: 'WETH',
        quoteAsset: 'USDC',
        baseAssetPriceFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // WETH/USD
        quoteAssetPriceFeedId: '', // USDC is stable, no price feed needed
        baseAssetDecimals: 8,
        quoteAssetDecimals: 6
    }
]

export class PythPriceService {
    private static instance: PythPriceService
    private priceCache: Map<string, PythPriceData> = new Map()
    private lastFetchTime: Map<string, number> = new Map()
    private readonly CACHE_DURATION = 30000 // 30 seconds

    static getInstance(): PythPriceService {
        if (!PythPriceService.instance) {
            PythPriceService.instance = new PythPriceService()
        }
        return PythPriceService.instance
    }

    async getPriceFeed(priceFeedId: string): Promise<PythPriceData> {
        const now = Date.now()
        const lastFetch = this.lastFetchTime.get(priceFeedId) || 0

        // Return cached data if still fresh
        if (now - lastFetch < this.CACHE_DURATION && this.priceCache.has(priceFeedId)) {
            return this.priceCache.get(priceFeedId)!
        }

        try {
            const response = await fetch(
                `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceFeedId}`
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch price feed: ${response.status}`)
            }

            const data: PythPriceFeed[] = await response.json()

            if (!data || data.length === 0) {
                throw new Error('No price feed data received')
            }

            const feed = data[0]
            const priceData: PythPriceData = {
                price: this.parsePythPrice(feed.price.price, feed.price.expo),
                confidence: this.parsePythPrice(feed.price.conf, feed.price.expo),
                exponent: feed.price.expo,
                publishTime: feed.price.publish_time * 1000, // Convert to milliseconds
                emaPrice: this.parsePythPrice(feed.ema_price.price, feed.ema_price.expo),
                emaConfidence: this.parsePythPrice(feed.ema_price.conf, feed.ema_price.expo)
            }

            // Cache the data
            this.priceCache.set(priceFeedId, priceData)
            this.lastFetchTime.set(priceFeedId, now)

            return priceData
        } catch (error) {
            console.error(`Error fetching price feed ${priceFeedId}:`, error)

            // Return cached data if available, even if stale
            if (this.priceCache.has(priceFeedId)) {
                return this.priceCache.get(priceFeedId)!
            }

            // Return mock data for development/testing
            // Different mock prices for different assets
            if (priceFeedId === '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744') {
                return {
                    price: 3.44, // Mock SUI price
                    confidence: 0.002,
                    exponent: -8,
                    publishTime: Date.now(),
                    emaPrice: 3.44,
                    emaConfidence: 0.002
                }
            } else if (priceFeedId === '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace') {
                return {
                    price: 2000.00, // Mock WETH price
                    confidence: 0.5,
                    exponent: -8,
                    publishTime: Date.now(),
                    emaPrice: 2000.00,
                    emaConfidence: 0.5
                }
            } else {
                return {
                    price: 3.44, // Default mock price
                    confidence: 0.002,
                    exponent: -8,
                    publishTime: Date.now(),
                    emaPrice: 3.44,
                    emaConfidence: 0.002
                }
            }
        }
    }

    private parsePythPrice(priceString: string, expo: number): number {
        const price = parseInt(priceString)
        return price / Math.pow(10, Math.abs(expo))
    }

    getPoolPriceMapping(poolId: string): PoolPriceMapping | undefined {
        return POOL_PRICE_MAPPINGS.find(mapping => mapping.poolId === poolId)
    }

    async getAssetPriceInfo(
        poolId: string,
        priceChangePercent: number
    ): Promise<AssetPriceInfo | null> {
        const mapping = this.getPoolPriceMapping(poolId)
        if (!mapping) {
            console.warn(`No price mapping found for pool ${poolId}`)
            return null
        }

        try {
            const baseAssetPrice = await this.getPriceFeed(mapping.baseAssetPriceFeedId)

            // USDC is stable at $1, no need to fetch price
            const quoteAssetPrice = { price: 1.0, confidence: 0, exponent: 0, publishTime: Date.now(), emaPrice: 1.0, emaConfidence: 0 }

            const currentPrice = baseAssetPrice.price
            const targetPrice = currentPrice * (1 + priceChangePercent / 100)

            // Calculate liquidation price based on health factor threshold
            // This is a simplified calculation - in reality it would come from the position data
            const liquidationPrice = currentPrice * 0.8 // Example: 20% below current price

            return {
                symbol: mapping.baseAsset,
                currentPrice,
                priceChangePercent,
                targetPrice,
                liquidationPrice,
                priceFeedId: mapping.baseAssetPriceFeedId,
                decimals: mapping.baseAssetDecimals
            }
        } catch (error) {
            console.error(`Error getting asset price info for pool ${poolId}:`, error)
            return null
        }
    }

    // Get all available pools
    getAvailablePools(): PoolPriceMapping[] {
        return [...POOL_PRICE_MAPPINGS]
    }
}

export default PythPriceService.getInstance()
