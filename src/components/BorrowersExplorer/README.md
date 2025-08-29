# BorrowersExplorer Components

This folder contains the modular components that were extracted from the original `BorrowersExplorer.tsx` file to improve maintainability and code organization.

## Structure

```
BorrowersExplorer/
├── index.ts                           # Main export file
├── BorrowersExplorer.tsx              # Main component (orchestrates everything)
├── BorrowersTable.tsx                 # Table component for displaying borrowers
├── PortfolioPriceRiskAnalysis.tsx     # Risk analysis component with charts
├── InfoTooltip.tsx                    # Reusable tooltip component
├── types.ts                           # TypeScript interfaces and types
├── utils.ts                           # Utility functions for data processing
└── README.md                          # This file
```

## Components

### BorrowersExplorer.tsx
The main orchestrator component that:
- Manages state for the entire borrowers explorer
- Fetches data and coordinates between components
- Handles search, sorting, and filtering logic
- Renders the main layout and coordinates child components

### BorrowersTable.tsx
A dedicated table component that:
- Displays borrower data in a sortable table
- Handles row expansion for detailed views
- Calculates and displays borrower metrics
- Manages table-specific interactions

### PortfolioPriceRiskAnalysis.tsx
A comprehensive risk analysis component that:
- Provides price change scenario analysis
- Shows portfolio health factor changes
- Displays interactive charts for risk visualization
- Calculates liquidation thresholds and risk levels

### InfoTooltip.tsx
A reusable tooltip component that:
- Provides contextual information on hover
- Uses consistent styling across the application
- Supports custom content and positioning

## Types

### types.ts
Contains all TypeScript interfaces:
- `BorrowersExplorerProps` - Main component props
- `BorrowerData` - Borrower data structure
- `LoanBucket` - Loan duration calculation data
- `PortfolioPriceRiskAnalysisProps` - Risk analysis component props

## Utilities

### utils.ts
Contains utility functions:
- `calculateBorrowersData()` - Processes raw data into borrower objects
- `filterAndSortBorrowers()` - Handles search and sorting logic
- `calculateLoanDurations()` - Calculates loan duration using FIFO method

## Usage

```tsx
import { BorrowersExplorer } from './components/BorrowersExplorer'

// Use the main component
<BorrowersExplorer 
  managers={managers}
  loans={loans}
  liquidations={liquidations}
/>
```

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used independently
3. **Testing**: Easier to write unit tests for individual components
4. **Performance**: Better code splitting and lazy loading opportunities
5. **Collaboration**: Multiple developers can work on different components
6. **Debugging**: Easier to isolate and fix issues

## Migration Notes

The original `BorrowersExplorer.tsx` file has been replaced with a simple export to maintain backward compatibility. All existing imports will continue to work without changes.
