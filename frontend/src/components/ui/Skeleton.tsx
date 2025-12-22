/**
 * Skeleton Component - Garrigues UI Kit
 * 
 * Loading placeholder que refleja estructura real
 */

import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
    className?: string;
}

export function Skeleton({
    variant = 'text',
    width,
    height,
    lines = 1,
    className = '',
}: SkeletonProps) {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    const classes = ['ui-skeleton', `ui-skeleton--${variant}`, className]
        .filter(Boolean)
        .join(' ');

    if (variant === 'text' && lines > 1) {
        return (
            <div className="ui-skeleton-lines">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={classes}
                        style={{
                            ...style,
                            width: i === lines - 1 ? '60%' : style.width,
                        }}
                    />
                ))}
            </div>
        );
    }

    return <div className={classes} style={style} />;
}

export default Skeleton;
