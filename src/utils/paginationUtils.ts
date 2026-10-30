/**
 * Generates a compact array of page numbers and ellipsis ("...") strings
 * for pagination components according to design requirements:
 *
 * Examples:
 * Page 1 of 36:   [1, 2, 3, 4, 5, "...", 36]
 * Page 10 of 36:  [1, "...", 8, 9, 10, 11, 12, "...", 36]
 * Page 35 of 36:  [1, "...", 32, 33, 34, 35, 36]
 */
export function getCompactPageNumbers(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near the beginning: 1 2 3 4 5 ... totalPages
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  // Near the end: 1 ... (totalPages - 4) (totalPages - 3) (totalPages - 2) (totalPages - 1) totalPages
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // In the middle: 1 ... (currentPage-2) (currentPage-1) currentPage (currentPage+1) (currentPage+2) ... totalPages
  return [
    1,
    "...",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "...",
    totalPages,
  ];
}
