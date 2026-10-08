import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import type { ServiceRequest } from '../models/serviceRequest';
import { filterCollectedRequests, sumCollectedAmount } from './collectionReportService';

const request = (overrides: Partial<ServiceRequest> = {}): ServiceRequest => ({
  id: 'request-1',
  ticketNo: 'BRGY-2026-0001',
  category: 'Barangay Clearance',
  title: 'Clearance request',
  description: 'Request details',
  purok: 'Purok 1',
  address: 'Barangay Antonino',
  priority: 'Normal',
  status: 'Resolved',
  submittedByName: 'Juan Dela Cruz',
  contactNumber: '09123456789',
  collectedAmount: 125.5,
  collectedAt: Timestamp.fromDate(new Date('2026-10-05T10:00:00')),
  ...overrides,
});

describe('collection reports', () => {
  it('filters resolved collections by dates, category, and search', () => {
    const matching = request();
    const requests = [
      matching,
      request({ id: 'old', collectedAt: Timestamp.fromDate(new Date('2026-09-30T10:00:00')) }),
      request({ id: 'other-category', category: 'Certificate of Residency' }),
      request({ id: 'pending', status: 'Pending' }),
      request({ id: 'missing-date', collectedAt: null }),
    ];

    const result = filterCollectedRequests(requests, {
      fromDate: '2026-10-01',
      toDate: '2026-10-05',
      category: 'Barangay Clearance',
      search: 'juan',
    });

    expect(result.map((item) => item.id)).toEqual(['request-1']);
  });

  it('totals only valid amounts on resolved requests', () => {
    expect(sumCollectedAmount([
      request(),
      request({ id: 'second', collectedAmount: 50 }),
      request({ id: 'pending', status: 'Pending', collectedAmount: 1000 }),
      request({ id: 'invalid', collectedAmount: Number.NaN }),
      request({ id: 'no-date', collectedAmount: 200, collectedAt: null }),
    ])).toBe(175.5);
  });
});
