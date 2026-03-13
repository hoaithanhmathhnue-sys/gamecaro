import { useRef, useEffect } from 'react';

interface MathTextProps {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

/**
 * Renders text containing LaTeX math expressions using MathJax.
 * Supports inline `$...$` and display `$$...$$` math.
 */
export default function MathText({ children, className = '', as: Tag = 'span' }: MathTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const typeset = () => {
      const MJ = (window as any).MathJax;
      if (MJ?.typesetPromise) {
        MJ.typesetPromise([el]).catch(() => { });
      }
    };

    // MathJax might still be loading
    const MJ = (window as any).MathJax;
    if (MJ?.startup?.promise) {
      MJ.startup.promise.then(typeset);
    } else {
      // Fallback: wait a bit for MathJax to load
      const timeout = setTimeout(typeset, 500);
      return () => clearTimeout(timeout);
    }
  }, [children]);

  return (
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
