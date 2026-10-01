import React from 'react';

export function getStatusStyle(color?: string): React.CSSProperties {
  const c = color || "#6b7280";
  return {
    color: c,
    borderColor: `color-mix(in srgb, ${c} 40%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${c} 15%, transparent)`
  };
}
