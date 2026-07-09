/**
 * Custom hook placeholder for investigation logic.
 * Can be extended to encapsulate SSE streaming, state management, etc.
 */

import { useState } from "react";

export function useInvestigation() {
  const [isInvestigating, setIsInvestigating] = useState(false);

  return {
    isInvestigating,
    setIsInvestigating,
  };
}
