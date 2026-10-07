import { jsPDF } from 'jspdf';
import type { ServiceRequest } from '../models/serviceRequest';

export const MAX_RECEIPT_DATA_LENGTH = 700_000;

type ReceiptDetails = Pick<ServiceRequest, 'ticketNo' | 'category' | 'title' | 'submittedByName' | 'purok' | 'address' | 'contactNumber'> & {
    status: string;
};

export function createRequestReceipt(
    request: ReceiptDetails,
    feeAmount: number,
    feeDescription: string,
    issuedAt: Date,
): string {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    const ticketNo = request.ticketNo || 'N/A';
    const receiptNo = `BRGY-${ticketNo}-${issuedAt.getTime().toString().slice(-6)}`;

    pdf.setFillColor(13, 104, 64);
    pdf.rect(0, 0, pageWidth, 52, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('REPUBLIKA NG PILIPINAS', margin, 14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('BARANGAY ANTONINO', margin, 24);
    pdf.setFontSize(10);
    pdf.text('REQUEST SERVICE FEE RECEIPT', margin, 34);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('OFFICIAL RESIDENT COPY', pageWidth - margin, 43, { align: 'right' });

    pdf.setTextColor(15, 41, 66);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('RECEIPT DETAILS', margin, 66);
    pdf.setDrawColor(220, 231, 223);
    pdf.line(margin, 70, pageWidth - margin, 70);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('RECEIPT NO.', margin, 79);
    pdf.text('DATE ISSUED', pageWidth / 2 + 4, 79);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(receiptNo, margin, 85);
    pdf.text(issuedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2 + 4, 85);

    let y = 103;
    const section = (title: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(13, 104, 64);
        pdf.text(title, margin, y);
        y += 7;
    };
    const field = (label: string, value: string) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label.toUpperCase(), margin, y);
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        const lines = pdf.splitTextToSize(value || 'Not provided', pageWidth - margin * 2);
        pdf.text(lines, margin, y + 5);
        y += Math.max(12, lines.length * 5 + 7);
    };

    section('RESIDENT');
    field('Name', request.submittedByName);
    field('Address / Purok', [request.address, request.purok].filter(Boolean).join(' • '));
    field('Contact number', request.contactNumber);

    y += 2;
    section('SERVICE REQUEST');
    field('Ticket number', ticketNo);
    field('Service', request.category);
    field('Request title', request.title);
    field('Current status', request.status);

    const summaryY = Math.max(y + 2, 224);
    pdf.setFillColor(243, 248, 245);
    pdf.roundedRect(margin, summaryY, pageWidth - margin * 2, 34, 2, 2, 'F');
    pdf.setTextColor(15, 41, 66);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('FEE SUMMARY', margin + 7, summaryY + 9);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(feeDescription || 'Barangay service fee', margin + 7, summaryY + 17);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`PHP ${feeAmount.toFixed(2)}`, pageWidth - margin - 7, summaryY + 17, { align: 'right' });
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin + 7, summaryY + 22, pageWidth - margin - 7, summaryY + 22);
    pdf.setFontSize(9);
    pdf.text('TOTAL ASSESSED', margin + 7, summaryY + 29);
    pdf.text(`PHP ${feeAmount.toFixed(2)}`, pageWidth - margin - 7, summaryY + 29, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('This document records the service fee for this request. It does not confirm payment.', margin, 273);
    pdf.text(`Request reference: ${ticketNo}  |  Barangay Antonino`, margin, 280);

    const dataUri = pdf.output('datauristring');
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
    const receiptData = `data:application/pdf;base64,${base64}`;
    if (receiptData.length > MAX_RECEIPT_DATA_LENGTH) {
        throw new Error('This receipt is too large to save in Firestore. Shorten the request details and try again.');
    }
    return receiptData;
}