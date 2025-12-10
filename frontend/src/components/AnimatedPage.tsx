import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 12,
    scale: 1,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25, // 250ms for snappy, polished feel
      ease: [0.25, 0.46, 0.45, 0.94], // Smooth ease-out
      staggerChildren: 0.06
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.99,
    transition: {
      duration: 0.15, // Fast exit
      ease: [0.55, 0.06, 0.68, 0.19] // Smooth ease-in
    }
  }
};

export default function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
