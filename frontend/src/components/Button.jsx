import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 hover:scale-105 active:scale-95',
    success: 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95',
    danger: 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;

