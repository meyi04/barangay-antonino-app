import { describe, expect, it } from 'vitest';

import { createRequestReceipt, MAX_RECEIPT_DATA_LENGTH } from './requestReceiptService';

describe('request receipt PDF', () => {
    it('creates a Firestore-sized PDF data URL with a valid PDF header', () => {
        const receipt = createRequestReceipt({
            ticketNo: 'BRGY-2026-0042',
            category: 'Barangay Clearance',
            title: 'Certificate request',
            submittedByName: 'Resident Name',
            purok: 'Purok 1',
            address: 'Barangay Antonino',
            contactNumber: '09123456789',
            status: 'In Progress',
        }, 150, 'Certificate processing fee', new Date('2026-10-07T09:00:00Z'));

        const [metadata, base64] = receipt.split(',', 2);
        expect(metadata).toBe('data:application/pdf;base64');
        const header = atob(base64).slice(0, 5);
        expect(header).toBe('%PDF-');
        expect(receipt.length).toBeGreaterThan(500);
        expect(receipt.length).toBeLessThanOrEqual(MAX_RECEIPT_DATA_LENGTH);
    });
});