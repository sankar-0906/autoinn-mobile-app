/**
 * src/utils/branch-autofill/index.ts
 *
 * Barrel export for the branch auto-fill utilities.
 *
 * Import into screens like:
 *   import { useQuotationBranchAutoFill } from '../../src/utils/branch-autofill';
 */

export { getBranchAutoFill } from './getBranchAutoFill';
export type { BranchRecord, AutoFillOutcome } from './getBranchAutoFill';

export { useQuotationBranchAutoFill } from './useQuotationBranchAutoFill';
export type { BranchAutoFillResult } from './types';
