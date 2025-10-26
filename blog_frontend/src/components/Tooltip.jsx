import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHelpCircle } from "react-icons/fi";

export default function Tooltip({ content, position = "top", children }) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "tooltip-top";
      case "bottom":
        return "tooltip-bottom";
      case "left":
        return "tooltip-left";
      case "right":
        return "tooltip-right";
      default:
        return "tooltip-top";
    }
  };

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`tooltip ${getPositionClasses()}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpIcon({ content, position = "top" }) {
  return (
    <Tooltip content={content} position={position}>
      <FiHelpCircle className="help-icon" />
    </Tooltip>
  );
}
