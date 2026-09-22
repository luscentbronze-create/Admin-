import React from 'react';
import { ShipmentStatus } from '../types';

interface StatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'light',
  className = '',
}) => {
  const getStatusStyles = () => {
    if (variant === 'light') {
      switch (status) {
        case 'Shipment Created':
          return {
            bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
            dot: 'bg-sky-500',
          };
        case 'Processing':
          return {
            bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
            dot: 'bg-amber-500',
          };
        case 'In Transit':
          return {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dot: 'bg-emerald-500',
          };
        case 'Out for Delivery':
          return {
            bg: 'bg-orange-50 text-orange-700 border-orange-200/80',
            dot: 'bg-orange-500',
          };
        case 'Delivered':
          return {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dot: 'bg-emerald-500',
          };
        default:
          return {
            bg: 'bg-slate-100 text-slate-700 border-slate-200',
            dot: 'bg-slate-400',
          };
      }
    }

    // Dark variant
    switch (status) {
      case 'Shipment Created':
        return {
          bg: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'Processing':
        return {
          bg: 'bg-amber-950/40 border-amber-800/40 text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'In Transit':
        return {
          bg: 'bg-sky-950/40 border-sky-800/40 text-sky-300',
          dot: 'bg-sky-400',
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-orange-950/40 border-orange-800/40 text-orange-300',
          dot: 'bg-orange-400',
        };
      case 'Delivered':
        return {
          bg: 'bg-teal-950/40 border-teal-800/40 text-teal-300',
          dot: 'bg-teal-400',
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const { bg, dot } = getStatusStyles();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap select-none transition-colors ${bg} ${sizeClasses[size]} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${dotSizes[size]} ${dot} animate-pulse`} />
      {status}
    </span>
  );
};
