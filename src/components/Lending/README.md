# Lending Components

This directory contains a comprehensive set of React components for building a margin pool lending interface. The components are designed to work with the DeepBook v3 margin trading system and provide a complete UI for users to supply assets, view pool information, and manage their positions.

## Components Overview

### Core Components

- **`LendingPage`** - Main entry point that orchestrates the entire lending interface
- **`MarginPoolsTable`** - Table view of all available margin pools with key metrics
- **`MarginPoolDetail`** - Detailed view of a selected margin pool with navigation tabs

### Detail View Components

- **`DeepBookPoolsSection`** - Shows linked DeepBook pools with risk ratios
- **`MarginPoolEvents`** - Live stream of margin pool events and transactions
- **`SupplyWithdrawForm`** - Form for users to supply or withdraw assets
- **`UserPosition`** - Displays user's current position in the selected pool
- **`UserEventsTimeline`** - Timeline of user's supply/withdraw activities

## Features

### Margin Pool Table
- **Pool Information**: Name, currency symbol, and basic details
- **DeepBook Pools**: Chips showing linked trading pools
- **Utilization Rate**: Visual progress bar with percentage
- **Interest Rate**: Current borrower rate (APY)
- **Supply Cap**: Maximum total supply limit
- **Total Supply**: Current amount supplied to the pool

### Pool Detail View
- **Overview Tab**: Comprehensive pool statistics and utilization curve
- **Actions Tab**: Supply/withdraw functionality and user position management

### DeepBook Pool Integration
- **Risk Ratios**: Min withdraw, min borrow, liquidation, and target ratios
- **Liquidation Rewards**: User and pool reward percentages
- **Pool Status**: Active/inactive status indicators

### Real-time Features
- **Live Events**: Real-time margin pool activity stream
- **User Activity**: Personal transaction timeline
- **Position Updates**: Live position value and interest calculations

## Data Structure

The components use TypeScript interfaces that mirror the Move contract structures:

```typescript
interface MarginPool {
  id: string;
  asset_type: string;
  total_supply: string;
  total_borrow: string;
  utilization_rate: string;
  current_rate?: string;
  supply_cap: string;
  protocol_spread: string;
  protocol_profit: string;
  vault_value: string;
  unique_positions: number;
  allowed_deepbook_pools: string[];
  name: string;
  currency_symbol: string;
}
```

## Usage

### Basic Implementation

```tsx
import { LendingPage } from './components/Lending';

function App() {
  return (
    <div className="App">
      <LendingPage />
    </div>
  );
}
```

### Custom Pool Data

```tsx
import { MarginPoolsTable } from './components/Lending';

function CustomLendingView() {
  const customPools = [
    {
      id: 'custom-pool-1',
      name: 'Custom SUI Pool',
      currency_symbol: 'SUI',
      // ... other pool properties
    }
  ];

  return (
    <MarginPoolsTable 
      pools={customPools}
      onPoolSelect={(pool) => console.log('Selected:', pool)}
    />
  );
}
```

## Styling

The components use Tailwind CSS classes and follow a consistent design system:

- **Cards**: Glass-morphism design with elevation levels
- **Badges**: Color-coded status indicators
- **Buttons**: Multiple variants (primary, secondary, outline, etc.)
- **Tables**: Responsive design with hover states
- **Forms**: Clean input fields with validation states

## Integration Points

### Data Fetching
Replace mock data with actual blockchain queries:
- Margin pool state from Move contracts
- DeepBook pool configurations
- User position data
- Real-time event streaming

### Blockchain Interactions
Implement actual transactions:
- Asset supply/withdrawal
- Position management
- Event subscription

### Price Feeds
Integrate with Pyth or other price oracles:
- USD value calculations
- Risk ratio computations
- Liquidation threshold monitoring

## Customization

### Theming
Modify the design system by updating:
- Color schemes in Tailwind config
- Component variants in UI components
- Card elevation and glass effects

### Layout
Adjust the responsive grid system:
- Table column configurations
- Detail view tab layouts
- Mobile-first responsive design

### Features
Extend functionality by adding:
- Additional pool metrics
- Advanced filtering and sorting
- Export capabilities
- Analytics dashboards

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- Custom UI components (Card, Button, Badge)

## Browser Support

- Modern browsers with ES2020 support
- Mobile-responsive design
- Touch-friendly interactions

## Performance Considerations

- Virtual scrolling for large event lists
- Debounced search and filtering
- Lazy loading of detailed components
- Efficient re-rendering with React.memo

## Security Notes

- Input validation for all user inputs
- Sanitization of blockchain data
- Secure transaction signing
- Rate limiting for API calls

## Future Enhancements

- Multi-chain support
- Advanced analytics and charts
- Social features and sharing
- Mobile app integration
- DeFi protocol aggregator
