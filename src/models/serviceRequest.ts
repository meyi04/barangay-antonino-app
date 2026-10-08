// src/models/serviceRequest.ts
import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface ServiceRequest {
  id?: string;              // Firestore doc ID (auto)
  ticketNo?: string;        // BRGY-2025-0001
  category: string;         // e.g., "Street Light Repair"
  title: string;            // Short subject
  description: string;      // Full details
  purok: string;            // Purok 1-6
  address: string;          // Complete address / landmark
  priority: string;         // Low | Medium | High | Urgent
  status: string;           // Pending | In Progress | Resolved
  submittedByName: string;  // Resident full name
  submittedByUid?: string;  // Firebase Auth UID of the submitting resident
  contactNumber: string;    // 09xxxxxxxxx
  createdAt?: Timestamp | FieldValue | null; // Firestore timestamp
  receiptPdfData?: string;
  receiptFeeAmount?: number;
  receiptFeeDescription?: string;
  receiptIssuedAt?: Timestamp | FieldValue | null;
  collectedAmount?: number;
  collectedAt?: Timestamp | FieldValue | null;
}
