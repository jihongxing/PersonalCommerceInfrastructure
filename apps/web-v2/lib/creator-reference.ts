export type CreatorReferenceResponse =
  | {
      assignmentStatus: 'ASSIGNED';
      commerceReference: string;
      displayValue: string;
    }
  | {
      assignmentStatus: 'NOT_ASSIGNED';
    };
