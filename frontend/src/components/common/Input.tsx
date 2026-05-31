import React, { forwardRef } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `dc-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasIconLeft = !!leftIcon;
    const hasIconRight = !!rightIcon;

    return (
      <div className={`dc-input-group ${hasError ? 'dc-input-group--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="dc-input-label">
            {label}
          </label>
        )}
        <div className="dc-input-wrapper">
          {leftIcon && <span className="dc-input-icon dc-input-icon--left">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`dc-input 
              ${hasIconLeft ? 'dc-input--has-icon-left' : ''} 
              ${hasIconRight ? 'dc-input--has-icon-right' : ''}
            `}
            {...props}
          />
          {rightIcon && <span className="dc-input-icon dc-input-icon--right">{rightIcon}</span>}
        </div>
        {hasError && (
          <span className="dc-input-error-msg" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
