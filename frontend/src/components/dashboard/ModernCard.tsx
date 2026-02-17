import Link from 'next/link';
import { ReactNode } from 'react';

interface ModernCardProps {
  title: string;
  description?: string;
  value?: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-white',
    border: 'border-gray-200',
    hover: 'hover:border-primary/30 hover:shadow-md',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-primary/5 to-accent/5',
    border: 'border-primary/20',
    hover: 'hover:border-primary/40 hover:shadow-md',
  },
  success: {
    bg: 'bg-gradient-to-br from-primary/10 to-primary/5',
    border: 'border-primary/30',
    hover: 'hover:border-primary/50 hover:shadow-md',
  },
  warning: {
    bg: 'bg-gradient-to-br from-accent/10 to-accent/5',
    border: 'border-accent/30',
    hover: 'hover:border-accent/50 hover:shadow-md',
  },
  info: {
    bg: 'bg-gradient-to-br from-secondary/10 to-secondary/5',
    border: 'border-secondary/30',
    hover: 'hover:border-secondary/50 hover:shadow-md',
  },
};

export function ModernCard({
  title,
  description,
  value,
  icon,
  trend,
  href,
  action,
  variant = 'default',
  className = '',
}: ModernCardProps) {
  const styles = variantStyles[variant];
  const content = (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-6 transition-all duration-200 ${styles.hover} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
            {title}
          </h3>
          {value !== undefined && (
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-secondary">{value}</p>
              {trend && (
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-primary' : 'text-red-500'}`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {action.label}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'primary' | 'secondary' | 'accent';
}

const colorStyles = {
  primary: 'from-primary to-primary/80',
  secondary: 'from-secondary to-secondary/80',
  accent: 'from-accent to-accent/80',
};

export function StatsCard({ label, value, icon, trend, color = 'primary' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-right ${trend.isPositive ? 'text-primary' : 'text-red-500'}`}>
            <div className="text-lg font-bold flex items-center gap-1">
              {trend.isPositive ? '↗' : '↘'}
              {Math.abs(trend.value)}%
            </div>
            <div className="text-xs text-gray-500">{trend.label}</div>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-secondary">{value}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  badge?: string;
  color?: 'primary' | 'secondary' | 'accent';
}

export function QuickActionCard({ title, description, icon, href, badge, color = 'primary' }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">{badge}</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
