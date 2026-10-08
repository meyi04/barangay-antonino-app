import { jsPDF } from 'jspdf';
import type { ServiceRequest } from '../models/serviceRequest';

export interface CollectionReportFilters {
  fromDate: string;
  toDate: string;
  category: string;
  search: string;
}

export function getCollectionDate(request: ServiceRequest): Date | null {
  const value = request.collectedAt;
  if (!value || typeof value !== 'object' || !('toDate' in value) || typeof value.toDate !== 'function') return null;
  return value.toDate();
}

export function filterCollectedRequests(
  requests: ServiceRequest[],
  filters: CollectionReportFilters,
): ServiceRequest[] {
  const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
  const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null;
  const term = filters.search.trim().toLocaleLowerCase();

  return requests.filter((request) => {
    const amount = request.collectedAmount;
    const date = getCollectionDate(request);
    if (
      request.status !== 'Resolved' ||
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !date
    ) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (filters.category !== 'All' && request.category !== filters.category) return false;
    if (term && ![request.ticketNo, request.title, request.submittedByName, request.category]
      .some((value) => value?.toLocaleLowerCase().includes(term))) return false;
    return true;
  }).sort((a, b) => (getCollectionDate(b)?.getTime() ?? 0) - (getCollectionDate(a)?.getTime() ?? 0));
}

export function sumCollectedAmount(requests: ServiceRequest[]): number {
  return requests.reduce((sum, request) => {
    const amount = request.collectedAmount;
    return request.status === 'Resolved' &&
      typeof amount === 'number' &&
      Number.isFinite(amount) &&
      amount >= 0 &&
      getCollectionDate(request) !== null
      ? sum + amount
      : sum;
  }, 0);
}

const php = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (date: Date) => date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export function downloadCollectionsReport(
  requests: ServiceRequest[],
  filters: CollectionReportFilters,
  generatedAt = new Date(),
): void {
  const rows = filterCollectedRequests(requests, filters);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 16;
  const right = pageWidth - margin;
  let y = 0;

  const drawTableHeader = () => {
    pdf.setFillColor(13, 104, 64);
    pdf.rect(margin, y - 5, right - margin, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('DATE', 18, y);
    pdf.text('TICKET', 45, y);
    pdf.text('REQUEST', 72, y);
    pdf.text('RESIDENT', 128, y);
    pdf.text('COLLECTED', right - 2, y, { align: 'right' });
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'normal');
    y += 7;
  };

  const drawPageHeading = (firstPage: boolean) => {
    if (firstPage) {
      pdf.setFillColor(13, 104, 64);
      pdf.rect(0, 0, pageWidth, 34, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('REPUBLIKA NG PILIPINAS', margin, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.text('BARANGAY ANTONINO', margin, 20);
      pdf.setFontSize(10);
      pdf.text('RESOLVED REQUEST COLLECTIONS', margin, 28);
      pdf.setTextColor(15, 23, 42);
      y = 44;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total collected: ${php(sumCollectedAmount(rows))}`, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Matching requests: ${rows.length}`, right, y, { align: 'right' });
      y += 7;
      const period = filters.fromDate || filters.toDate
        ? `${filters.fromDate || 'Beginning'} to ${filters.toDate || 'Latest'}`
        : 'All dates';
      const details = [
        `Period: ${period}`,
        `Category: ${filters.category}`,
        ...(filters.search.trim() ? [`Search: ${filters.search.trim()}`] : []),
        `Generated: ${dateLabel(generatedAt)}`,
      ].join('  |  ');
      const detailLines = pdf.splitTextToSize(details, right - margin);
      pdf.text(detailLines, margin, y);
      y += detailLines.length * 4 + 4;
    } else {
      pdf.setTextColor(15, 41, 66);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('BARANGAY ANTONINO - RESOLVED REQUEST COLLECTIONS', margin, 17);
      y = 27;
    }
    drawTableHeader();
  };

  drawPageHeading(true);
  if (rows.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('No collections match the selected filters.', margin, y + 5);
  }

  rows.forEach((request) => {
    const collectedAt = getCollectionDate(request);
    if (!collectedAt) return;
    const requestLines = pdf.splitTextToSize(`${request.category}: ${request.title}`, 51);
    const residentLines = pdf.splitTextToSize(request.submittedByName || 'Resident not recorded', 37);
    const ticketLines = pdf.splitTextToSize(request.ticketNo || 'N/A', 24);
    const rowHeight = Math.max(requestLines.length, residentLines.length, ticketLines.length, 1) * 4 + 4;
    if (y + rowHeight > 278) {
      pdf.addPage();
      drawPageHeading(false);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text(dateLabel(collectedAt), 18, y);
    pdf.text(ticketLines, 45, y);
    pdf.text(requestLines, 72, y);
    pdf.text(residentLines, 128, y);
    pdf.text(php(request.collectedAmount || 0), right - 2, y, { align: 'right' });
    y += rowHeight;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y - 2, right, y - 2);
  });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Page ${page} of ${pageCount}`, right, 289, { align: 'right' });
  }
  const day = generatedAt.toISOString().slice(0, 10);
  pdf.save(`barangay-collections-${day}.pdf`);
}
