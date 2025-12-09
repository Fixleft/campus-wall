// src/components/ProfileTabs.tsx
import { motion } from "framer-motion";

// 定义 Tab 的类型，确保父子组件统一
export type TabKey = "created" | "liked";

interface ProfileTabsProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "created", label: "帖子" },
    { key: "liked", label: "喜欢" },
  ];

  return (
    <div className="sticky top-0 z-40 bg-black/80 transition-shadow shadow-md">
      <div className="h-14 flex items-center justify-start gap-18 pl-24 relative">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              relative h-full flex items-center text-lg font-medium transition-colors outline-none
              ${activeTab === tab.key ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-100"}
            `}
          >
            {tab.label}

            {/* Framer Motion 下划线动画 */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-2 left-0 right-0 h-0.5 bg-white"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}