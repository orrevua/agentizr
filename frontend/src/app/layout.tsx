import type { ReactNode } from 'react';
import './globals.css';
import '@xyflow/react/dist/style.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
