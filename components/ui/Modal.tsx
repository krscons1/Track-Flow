import { createPortal } from 'react-dom';

export default function Modal({ open, children }: { open: boolean, children: React.ReactNode }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      {children}
    </div>,
    typeof window !== 'undefined' ? document.body : ({} as HTMLElement)
  );
} 