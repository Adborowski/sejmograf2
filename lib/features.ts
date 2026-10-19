// Feature flags for parts of the UI that are temporarily switched off.
export const FEATURES = {
  // Reviews + login. Off until reviews stop storing reviewers' full emails
  // in publicly readable docs and the collection-group read rule is added.
  reviews: false,
} as const;
