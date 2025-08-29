import type { BorrowerData, LoanBucket } from './types'

// Calculate loan duration estimates using FIFO buckets
export const calculateLoanDurations = (borrower: BorrowerData) => {
  const bucketsByPool: Record<string, LoanBucket[]> = {}
  const durations: Array<{ pool: string; duration: number; amount: number }> = []

  borrower.events.forEach(event => {
    if (!event.pool) return

    if (!bucketsByPool[event.pool]) {
      bucketsByPool[event.pool] = []
    }

    if (event.type === 'borrow' && event.amount) {
      // Add to bucket
      bucketsByPool[event.pool].push({
        amount: event.amount,
        timestamp: event.timestamp,
        pool: event.pool
      })
    } else if ((event.type === 'repay' || event.type === 'liquidation') && event.amount) {
      // Remove from bucket FIFO
      let remainingAmount = event.amount
      
      while (remainingAmount > 0 && bucketsByPool[event.pool].length > 0) {
        const bucket = bucketsByPool[event.pool][0]
        const takenAmount = Math.min(remainingAmount, bucket.amount)
        
        if (takenAmount === bucket.amount) {
          // Full bucket consumed
          const duration = (event.timestamp - bucket.timestamp) / (1000 * 60 * 60 * 24) // days
          durations.push({
            pool: event.pool,
            duration,
            amount: takenAmount
          })
          bucketsByPool[event.pool].shift()
        } else {
          // Partial bucket consumed
          bucket.amount -= takenAmount
        }
        
        remainingAmount -= takenAmount
      }
    }
  })

  return durations
}

// Calculate borrower data with event-sourced positions
export const calculateBorrowersData = (
  managers: any[],
  loans: any[],
  liquidations: any[],
  positionSummaries: any[]
): BorrowerData[] => {
  const borrowerMap = new Map<string, BorrowerData>()

  // Initialize from managers
  managers.forEach(manager => {
    borrowerMap.set(manager.id, {
      managerId: manager.id,
      owner: manager.owner,
      firstSeen: manager.created_at,
      lastActivity: manager.created_at,
      poolsUsed: [],
      outstandingDebtByPool: {},
      totalOutstandingDebt: 0,
      borrowCount: 0,
      repayCount: 0,
      liquidationCount: 0,
      defaultSum: 0,
      repayRatio: 0,
      events: [{
        type: 'created',
        timestamp: manager.created_at,
        details: manager
      }]
    })
  })

  // Process loans
  loans.forEach(loan => {
    const borrower = borrowerMap.get(loan.margin_manager_id)
    if (!borrower) return

    // Update activity tracking
    borrower.lastActivity = Math.max(borrower.lastActivity, loan.borrowed_at)
    if (loan.status === 'repaid' && loan.repaid_at) {
      borrower.lastActivity = Math.max(borrower.lastActivity, loan.repaid_at)
    }

    // Track pools used
    if (!borrower.poolsUsed.includes(loan.margin_pool_id)) {
      borrower.poolsUsed.push(loan.margin_pool_id)
    }

    // Initialize pool debt tracking
    if (!borrower.outstandingDebtByPool[loan.margin_pool_id]) {
      borrower.outstandingDebtByPool[loan.margin_pool_id] = 0
    }

    // Add to outstanding debt
    borrower.outstandingDebtByPool[loan.margin_pool_id] += loan.loan_amount
    borrower.borrowCount++

    // Add borrow event
    borrower.events.push({
      type: 'borrow',
      timestamp: loan.borrowed_at,
      pool: loan.margin_pool_id,
      amount: loan.loan_amount,
      details: loan
    })

    // Process repayments
    if (loan.status === 'repaid' && loan.repaid_at) {
      borrower.outstandingDebtByPool[loan.margin_pool_id] -= loan.loan_amount
      borrower.repayCount++

      borrower.events.push({
        type: 'repay',
        timestamp: loan.repaid_at,
        pool: loan.margin_pool_id,
        amount: loan.loan_amount,
        details: loan
      })
    }
  })

  // Process liquidations
  liquidations.forEach(liquidation => {
    const borrower = borrowerMap.get(liquidation.margin_manager_id)
    if (!borrower) return

    borrower.lastActivity = Math.max(borrower.lastActivity, liquidation.liquidated_at)
    borrower.liquidationCount++
    borrower.defaultSum += liquidation.default_amount

    // Reduce outstanding debt by liquidation amount minus default
    const liquidationRepaid = liquidation.liquidation_amount - liquidation.default_amount
    if (borrower.outstandingDebtByPool[liquidation.margin_pool_id]) {
      borrower.outstandingDebtByPool[liquidation.margin_pool_id] -= liquidationRepaid
    }

    borrower.events.push({
      type: 'liquidation',
      timestamp: liquidation.liquidated_at,
      pool: liquidation.margin_pool_id,
      amount: liquidation.liquidation_amount,
      details: liquidation
    })
  })

  // Enhance with DeepBook v3 data
  if (positionSummaries.length > 0) {
    positionSummaries.forEach(position => {
      const borrower = borrowerMap.get(position.manager_id)
      if (borrower) {
        borrower.deepbookPosition = position
      }
    })
  }

  // Calculate final metrics for each borrower
  borrowerMap.forEach(borrower => {
    // Calculate total outstanding debt
    borrower.totalOutstandingDebt = Object.values(borrower.outstandingDebtByPool)
      .reduce((sum, debt) => sum + Math.max(0, debt), 0)

    // Calculate repay ratio
    const totalBorrowed = loans
      .filter(loan => loan.margin_manager_id === borrower.managerId)
      .reduce((sum, loan) => sum + loan.loan_amount, 0)
    
    const totalRepaid = loans
      .filter(loan => loan.margin_manager_id === borrower.managerId && loan.status === 'repaid')
      .reduce((sum, loan) => sum + loan.loan_amount, 0)

    borrower.repayRatio = totalBorrowed > 0 ? (totalRepaid / totalBorrowed) * 100 : 0

    // Sort events by timestamp
    borrower.events.sort((a, b) => a.timestamp - b.timestamp)
  })

  return Array.from(borrowerMap.values())
}

// Filter and sort borrowers
export const filterAndSortBorrowers = (
  borrowers: BorrowerData[],
  searchTerm: string,
  sortField: keyof BorrowerData,
  sortDirection: 'asc' | 'desc'
): BorrowerData[] => {
  let filtered = borrowers

  // Apply search filter
  if (searchTerm) {
    const search = searchTerm.toLowerCase()
    filtered = filtered.filter(borrower => 
      borrower.owner.toLowerCase().includes(search) ||
      borrower.managerId.toLowerCase().includes(search) ||
      borrower.poolsUsed.some(pool => pool.toLowerCase().includes(search))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    let comparison = 0
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      comparison = aVal.length - bVal.length
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }
    
    return sortDirection === 'desc' ? -comparison : comparison
  })

  return filtered
}
