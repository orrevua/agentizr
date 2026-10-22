'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface EdgeCallbacksValue {
  onConditionChange: (edgeId: string, condition: string) => void;
  readOnly: boolean;
}

const EdgeCallbacksContext = createContext<EdgeCallbacksValue>({
  onConditionChange: () => {},
  readOnly: false,
});

export function EdgeCallbacksProvider({
  value,
  children,
}: {
  value: EdgeCallbacksValue;
  children: ReactNode;
}) {
  return (
    <EdgeCallbacksContext.Provider value={value}>{children}</EdgeCallbacksContext.Provider>
  );
}

export function useEdgeCallbacks(): EdgeCallbacksValue {
  return useContext(EdgeCallbacksContext);
}
