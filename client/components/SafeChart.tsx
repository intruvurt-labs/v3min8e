import React, { useEffect, useRef } from 'react';

interface SafeChartProps {
  themes: Record<string, string>;
  className?: string;
}

export const SafeChart: React.FC<SafeChartProps> = ({ themes, className }) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Safely create and inject CSS without using dangerouslySetInnerHTML
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }

    // Generate CSS content safely
    const cssContent = Object.entries(themes)
      .map(([theme, colors]) => {
        // Sanitize theme name and colors to prevent CSS injection
        const safeTheme = theme.replace(/[^a-zA-Z0-9-_]/g, '');
        const safeColors = typeof colors === 'string' 
          ? colors.replace(/[^a-zA-Z0-9#,\s().-]/g, '') 
          : '';
        
        return `[data-theme="${safeTheme}"] .recharts-cartesian-grid line { stroke: ${safeColors}; }`;
      })
      .join('\n');

    if (styleRef.current) {
      styleRef.current.textContent = cssContent;
    }

    // Cleanup function
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [themes]);

  // Return the chart component with safe styling
  return (
    <div className={className} data-safe-chart="true">
      <div className="recharts-wrapper">
        <svg className="recharts-surface" width="100%" height="100%">
          <g className="recharts-cartesian-grid">
            {/* Grid lines will be styled by the safely injected CSS */}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Helper function to sanitize CSS values
export const sanitizeCSSValue = (value: string): string => {
  // Remove potentially dangerous CSS values
  return value
    .replace(/javascript:/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/url\(/gi, '')
    .replace(/<script/gi, '')
    .replace(/[<>'"]/g, '');
};

export default SafeChart;
