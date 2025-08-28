// React hook for using DeepBook v3 data service
// Provides data, loading states, and error handling

import { useState, useEffect, useCallback } from 'react'
import { deepbookDataService } from '../services/deepbookDataService'
import type { DeepBookV3Data, PositionSummary, DashboardMetrics } from '../types/deepbook'

export interface UseDeepBookDataReturn {
    data: DeepBookV3Data | null
    positionSummaries: PositionSummary[]
    dashboardMetrics: DashboardMetrics | null
    loading: boolean
    error: string | null
    refresh: () => Promise<void>
    updateDataSource: (type: 'static' | 'rpc' | 'events') => void
}

export function useDeepBookData(): UseDeepBookDataReturn {
    const [data, setData] = useState<DeepBookV3Data | null>(null)
    const [positionSummaries, setPositionSummaries] = useState<PositionSummary[]>([])
    const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const [newData, summaries, metrics] = await Promise.all([
                deepbookDataService.getData(),
                deepbookDataService.getPositionSummaries(),
                deepbookDataService.getDashboardMetrics()
            ])

            setData(newData)
            setPositionSummaries(summaries)
            setDashboardMetrics(metrics)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
            console.error('Failed to fetch DeepBook data:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const updateDataSource = useCallback((type: 'static' | 'rpc' | 'events') => {
        deepbookDataService.updateConfig({ type })
        fetchData() // Refresh data with new source
    }, [fetchData])

    useEffect(() => {
        fetchData()

        // Set up auto-refresh if configured
        const interval = setInterval(() => {
            fetchData()
        }, deepbookDataService['config'].refreshInterval || 30000)

        return () => clearInterval(interval)
    }, [fetchData])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            deepbookDataService.destroy()
        }
    }, [])

    return {
        data,
        positionSummaries,
        dashboardMetrics,
        loading,
        error,
        refresh: fetchData,
        updateDataSource
    }
}
