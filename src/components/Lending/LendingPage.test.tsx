import React from 'react';
import { render, screen } from '@testing-library/react';
import { LendingPage } from './LendingPage';

// Mock the child components to avoid complex dependencies
jest.mock('./MarginPoolsTable', () => ({
  MarginPoolsTable: ({ onPoolSelect }: any) => (
    <div data-testid="margin-pools-table">
      <button onClick={() => onPoolSelect({ id: 'test-pool', name: 'Test Pool' })}>
        Select Pool
      </button>
    </div>
  )
}));

jest.mock('./MarginPoolDetail', () => ({
  MarginPoolDetail: ({ pool }: any) => (
    <div data-testid="margin-pool-detail">
      <h3>Pool Detail: {pool.name}</h3>
    </div>
  )
}));

describe('LendingPage', () => {
  it('renders the lending dashboard header', () => {
    render(<LendingPage />);
    
    expect(screen.getByText('Lending Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Supply assets to margin pools and earn interest/)).toBeInTheDocument();
  });

  it('renders the margin pools table', () => {
    render(<LendingPage />);
    
    expect(screen.getByTestId('margin-pools-table')).toBeInTheDocument();
  });

  it('shows placeholder when no pool is selected', () => {
    render(<LendingPage />);
    
    expect(screen.getByText('Select a Margin Pool')).toBeInTheDocument();
    expect(screen.getByText(/Choose a margin pool from the table/)).toBeInTheDocument();
  });

  it('renders pool detail when a pool is selected', () => {
    render(<LendingPage />);
    
    // Click to select a pool
    screen.getByText('Select Pool').click();
    
    expect(screen.getByTestId('margin-pool-detail')).toBeInTheDocument();
    expect(screen.getByText('Pool Detail: Test Pool')).toBeInTheDocument();
  });
});
