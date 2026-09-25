import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationItem = number | "ellipsis";

function paginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const visiblePages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
  const items: PaginationItem[] = [];
  visiblePages.forEach((page, index) => {
    if (index > 0 && page - visiblePages[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  hrefForPage,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  hrefForPage: (page: number) => string;
}) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const items = paginationItems(currentPage, totalPages);

  const navigationClass = "inline-flex h-10 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-bold transition hover:border-[#176b45] hover:text-[#176b45]";
  const disabledClass = `${navigationClass} pointer-events-none opacity-40`;

  return <nav aria-label={`${itemLabel} pagination`} className="mt-4 flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
    <p className="text-sm text-[#68736c]">
      Showing <span className="font-bold text-[#263029]">{firstItem}–{lastItem}</span> of <span className="font-bold text-[#263029]">{totalItems}</span> {itemLabel}{totalItems === 1 ? "" : "s"}
    </p>
    <div className="flex max-w-full items-center gap-1 overflow-x-auto" aria-label="Pages">
      {currentPage > 1
        ? <Link href={hrefForPage(currentPage - 1)} className={navigationClass} aria-label="Go to previous page"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Previous</span></Link>
        : <span className={disabledClass} aria-disabled="true"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Previous</span></span>}
      {items.map((item, index) => item === "ellipsis"
        ? <span key={`ellipsis-${index}`} className="grid size-10 shrink-0 place-items-center text-[#68736c]" aria-hidden="true">…</span>
        : <Link
            key={item}
            href={hrefForPage(item)}
            aria-label={`Go to page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            className={`grid size-10 shrink-0 place-items-center rounded-lg border text-sm font-bold transition ${item === currentPage ? "border-[#176b45] bg-[#176b45] text-white" : "hover:border-[#176b45] hover:text-[#176b45]"}`}
          >{item}</Link>)}
      {currentPage < totalPages
        ? <Link href={hrefForPage(currentPage + 1)} className={navigationClass} aria-label="Go to next page"><span className="hidden sm:inline">Next</span><ChevronRight className="size-4" /></Link>
        : <span className={disabledClass} aria-disabled="true"><span className="hidden sm:inline">Next</span><ChevronRight className="size-4" /></span>}
    </div>
  </nav>;
}
