/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuickActionsProps {
  className?: string;
}

const QuickActions = ({ className = '' }: QuickActionsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const actions = [
    {
      id: 1,
      label: 'My Profile',
      icon: 'UserCircleIcon',
      href: '/child-dashboard',
      color: 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
    },
    {
      id: 2,
      label: 'Help',
      icon: 'QuestionMarkCircleIcon',
      href: '/child-dashboard',
      color: 'bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground',
    },
    {
      id: 3,
      label: 'Settings',
      icon: 'CogIcon',
      href: '/child-dashboard',
      color: 'bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground',
    },
  ];

  if (!isHydrated) {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-xl h-20 w-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-warm transition-smooth hover:scale-105 ${action.color}`}
        >
          <span className="font-body font-semibold">{action.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;