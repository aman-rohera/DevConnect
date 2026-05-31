import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'glass';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = 'dc-btn';
  const variantClass = `${baseClass}--${variant}`;
  const widthClass = fullWidth ? `${baseClass}--full-width` : '';
  const loadingClass = isLoading ? `${baseClass}--loading` : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${widthClass} ${loadingClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="dc-btn__spinner" data-testid="button-spinner">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="30 30" opacity="0.25"></circle>
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04348 16.4522" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
          </svg>
        </span>
      )}
      {!isLoading && leftIcon && <span className="dc-btn__icon dc-btn__icon--left">{leftIcon}</span>}
      <span className="dc-btn__text">{children}</span>
      {!isLoading && rightIcon && <span className="dc-btn__icon dc-btn__icon--right">{rightIcon}</span>}
    </button>
  );
};
