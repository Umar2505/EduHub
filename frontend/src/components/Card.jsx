import { motion } from 'framer-motion';

const Card = ({ children, className = '', onClick, hover = true }) => {
  const baseClasses = 'bg-white rounded-2xl shadow-md p-6 transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-lg cursor-pointer' : '';

  const Component = onClick ? motion.div : 'div';
  const props = onClick ? {
    whileHover: { scale: 1.02, y: -2 },
    onClick,
  } : {};

  return (
    <Component
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;

