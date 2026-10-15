import React from 'react';
import type { PaginationMeta } from '../../types/posts.types';

export interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  itemName = 'essays',
  className = '',
}) => {
  const { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage } =
    pagination;

  if (totalPages <= 1 && totalItems <= limit) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (page > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`aurora-pagination-container ${className}`}
      aria-label={`${itemName} pagination`}
    >
      <div className="pagination-summary">
        Showing{' '}
        <span className="pagination-count-highlight">
          {startItem}–{endItem}
        </span>{' '}
        of <span className="pagination-count-highlight">{totalItems}</span>{' '}
        {itemName}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-prev-btn"
          disabled={!hasPreviousPage || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Go to previous page"
        >
          <span aria-hidden="true">←</span>
          <span>Previous</span>
        </button>

        <div className="pagination-numbers">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="pagination-ellipsis"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                className={`pagination-number-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-next-btn"
          disabled={!hasNextPage || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Go to next page"
        >
          <span>Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
};
