import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    filter: 'blur(10px)'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    filter: 'blur(5px)',
    transition: {
      duration: 0.25,
      ease: 'easeIn'
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
