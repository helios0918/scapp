"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "motion/react";
import { cn } from "@/lib/utils";

export const CometCard = ({
  children,
  className,
  onClick,
  rotateDepth = 12,
  translateDepth = 10,
}) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(
    mouseY,
    [-0.5, 0.5],
    [`-${rotateDepth}deg`, `${rotateDepth}deg`],
  );

  const rotateY = useTransform(
    mouseX,
    [-0.5, 0.5],
    [`${rotateDepth}deg`, `-${rotateDepth}deg`],
  );

  const translateX = useTransform(
    mouseX,
    [-0.5, 0.5],
    [`-${translateDepth}px`, `${translateDepth}px`],
  );

  const translateY = useTransform(
    mouseY,
    [-0.5, 0.5],
    [`${translateDepth}px`, `-${translateDepth}px`],
  );

  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const glare = useMotionTemplate`
    radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.6), transparent 70%)
  `;

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className={cn("perspective-distant", className)}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={reset}
        onClick={onClick}
        whileHover={{ scale: 1.04 }}
        style={{
          rotateX,
          rotateY,
          translateX,
          translateY,
        }}
        className="relative h-full w-full cursor-pointer transform-gpu rounded-2xl"
      >
        {children}

        <motion.div
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 mix-blend-overlay"
        />
      </motion.div>
    </div>
  );
};
