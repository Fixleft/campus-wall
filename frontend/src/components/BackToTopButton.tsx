// components/BackToTopButton.tsx
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // 滚动超过 400px 才显示按钮
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 50);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 丝滑滚动
    });
  };

  return (
    <motion.button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        p-3 rounded-full shadow-lg
        bg-white dark:bg-neutral-800
        border border-gray-200 dark:border-neutral-700
        text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-neutral-700
        transition-all duration-300
      `}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0.8 
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
      aria-label="回到顶部"
    >
      <ArrowUp size={24} />
    </motion.button>
  );
}