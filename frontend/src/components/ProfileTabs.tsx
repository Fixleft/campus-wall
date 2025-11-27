import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "comments" | "anonymous">("posts");
  const [isSticky, setIsSticky] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { key: "posts", label: "帖子" },
    { key: "likes", label: "喜欢" },
    { key: "comments", label: "评论过的" },
    { key: "anonymous", label: "匿名" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        setIsSticky(tabsRef.current.getBoundingClientRect().top <= 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={tabsRef} className={`${isSticky ? "fixed top-0 left-0 right-0 z-40 shadow-lg" : ""} bg-neutral-800 transition-shadow`}>
      {isSticky && <div className="h-12" />}

      {/* 关键：外层 h-12 + items-center 保证文字绝对垂直居中 */}
      <div className="h-12 flex items-center justify-start gap-16 pl-24 relative">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              relative h-full flex items-center text-lg font-medium transition-colors
              ${activeTab === tab.key ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-100"}
            `}
          >
            {tab.label}

            {/* 底部白线：绝对定位贴底 */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-1 left-0 right-0 h-0.5 bg-white"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}