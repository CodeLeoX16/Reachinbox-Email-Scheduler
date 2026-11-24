import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-green hover:bg-brand-greenHover text-white',
    outline: 'border border-brand-green text-brand-green hover:bg-brand-mint bg-white',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2 text-sm',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};