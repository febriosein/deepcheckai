"use client";

import React from "react";
import { motion } from "framer-motion";

interface StaggeredCardsProps {
  children: React.ReactNode[];
  className?: string;
  perItemClassName?: string;
  staggerDelay?: number;
}

/**
 * Wraps a children list to animate each child in with a sequential delay.
 */
export function StaggeredCards({
  children,
  className = "",
  perItemClassName = "",
  staggerDelay = 0.08,
}: StaggeredCardsProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: idx * staggerDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={perItemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export function StaggeredItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

