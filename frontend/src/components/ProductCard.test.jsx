import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import ProductCard from './ProductCard';
import '@testing-library/jest-dom';

// Mock product data
const mockProduct = {
  id: 'test-123',
  name: 'Test Product',
  category: 'book',
  price: 500,
  original_price: 700,
  stock_quantity: 10,
  image_url: '/test-image.jpg',
};

describe('ProductCard Component', () => {
  test('renders product name and category', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('book')).toBeInTheDocument();
  });

  test('displays correct price and original price with discount', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹700')).toBeInTheDocument();
    expect(screen.getByText('-29%')).toBeInTheDocument();
  });

  test('calls onCart when Add to Cart is clicked', () => {
    const mockOnCart = vi.fn();
    render(<ProductCard product={mockProduct} onCart={mockOnCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnCart).toHaveBeenCalledWith('test-123', 1);
  });

  test('calls onWishlist when Wishlist button is clicked', () => {
    const mockOnWishlist = vi.fn();
    // Use variant: "landing" so wishlist button is always visible
    render(<ProductCard product={mockProduct} onWishlist={mockOnWishlist} variant="landing" />);
    
    const buttons = screen.getAllByRole('button');
    // First button is wishlist
    fireEvent.click(buttons[0]);
    expect(mockOnWishlist).toHaveBeenCalledWith(mockProduct);
  });

  test('displays out of stock when stock is zero', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    
    const outOfStockElements = screen.getAllByText('Out of Stock');
    expect(outOfStockElements.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });
});
