import React from 'react';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`dc-card 
        ${glow ? 'dc-card--glow' : ''} 
        ${hoverable ? 'dc-card--hoverable' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
