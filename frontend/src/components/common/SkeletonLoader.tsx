import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const elements = Array.from({ length: count });

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  return (
    <>
      {elements.map((_, index) => (
        <div
          key={index}
          className={`dc-skeleton dc-skeleton--${variant} ${className}`}
          style={getStyle()}
          data-testid="skeleton-element"
        />
      ))}
    </>
  );
};
