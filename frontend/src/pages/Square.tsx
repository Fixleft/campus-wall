// components/Square.tsx
import PostCard from "@/components/PostCard"; // 你的 PostCard 路径
import { useState } from "react";
import BackToTopButton from "@/components/BackToTopButton";

const mockPosts = [
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    name: "汤姆",
    content: "今天天气真好，出去跑了5公里！感觉整个人都充满了活力～",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
    likes: 42,
    comments: 8,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy",
    name: "露西",
    content: "新买的咖啡机太香啦！推荐给大家～",
    likes: 128,
    comments: 23,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    name: "杰克",
    content: "周末和朋友去爬山，山顶风景绝了！附上照片，大家快来点赞！",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    likes: 256,
    comments: 41,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    name: "艾玛",
    content: "刚看完《沙丘2》，真的太震撼了！强烈安利！",
    likes: 89,
    comments: 15,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
    name: "里奥",
    content: "分享一个超好用的 VS Code 插件，生产力直接起飞！",
    likes: 312,
    comments: 67,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    name: "索菲娅",
    content: "今天尝试了第一次做日式拉面，味道还不错，下次再优化一下～",
    image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800",
    likes: 198,
    comments: 34,
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    name: "Alice",
    content: "刚下班到家，点了份麻辣烫外卖～生活就是要对自己好一点！",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    name: "Bob",
    content: "今天公司团建去密室逃脱，全程尖叫，笑到肚子痛！太解压了～",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cat",
    name: "猫猫酱",
    content: "我家猫主子又占领了我的椅子，谁来管管它啊！！！",
    image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=1000",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    name: "David",
    content: "分享一个超好用的 Notion 模板，直接复制就行，生产力 +10086",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eva",
    name: "Eva",
    content: "第一次尝试做提拉米苏！味道还不错，就是有点甜，下次减糖～\n\n配方：手指饼干 + 马斯卡彭 + 咖啡 + 可可粉",
    image: "https://images.unsplash.com/photo-1563805042-7684c7f057f3?w=800&h=1400",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
    name: "Frank",
    content: "新入手的机械键盘，青轴敲起来太爽了！码字效率暴涨",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=900",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    name: "Grace",
    content: "周末去森林公园骑行，空气超级好！拍了张自拍大家帮我看看滤镜怎么样～",
    image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&h=1600",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Henry",
    name: "Henry",
    content: "刚看完《奥本海默》，三小时完全不无聊！诺兰牛逼！强烈推荐！！！",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy",
    name: "Ivy",
    content: "我的减肥日记 Day1：\n今天吃了沙拉+鸡胸肉+一个苹果\n运动：30分钟快走\n大家监督我！",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=1100",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    name: "Jack",
    content: "终于攒够钱换了 14 Pro Max！开箱瞬间太爽了～",
    image: "https://images.unsplash.com/photo-1592750477388-4f8e0c0e64f4?w=800&h=1300",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kate",
    name: "Kate",
    content: "分享一个超治愈的 Lo-fi 歌单，适合学习/工作/发呆～",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
    name: "Leo",
    content: "今天被领导表扬了！开心到飞起～请大家吃虚拟奶茶！",
    image: "https://images.unsplash.com/photo-1517248135467-2c7ed3ad7b5c?w=800&h=1000",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    name: "Mia",
    content: "新染的头发颜色！是雾蓝灰～大家觉得好看吗？",
    image: "https://images.unsplash.com/photo-1562322140-8baee4733756?w=800&h=1400",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
    name: "Noah",
    content: "分享一个冷知识：章鱼有三个心脏！",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
    name: "Olivia",
    content: "刚买的香薰蜡烛，点上之后整个房间都是橙子味，好治愈～",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=900",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peter",
    name: "Peter",
    content: "周末打游戏上分成功！从黄金到白金！兄弟们冲！",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn",
    name: "Quinn",
    content: "第一次做日式咖喱饭！味道绝了，下次试试加牛肉～",
    image: "https://images.unsplash.com/photo-1563379926893-9d9c1bc85b69?w=800&h=1500",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rose",
    name: "Rose",
    content: "我的多肉长出了小崽崽！好开心～养多肉真的太治愈了",
    image: "https://images.unsplash.com/photo-1459411552884-2d9cc5f7e6fd?w=800&h=1100",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
    name: "Sam",
    content: "今天地铁上遇到超可爱的小狗，偷偷拍了一张～",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1300",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tina",
    name: "Tina",
    content: "新买的口红试色！是豆沙色，巨显白！姐妹们冲！",
    image: "https://images.unsplash.com/photo-1591376931767-79d7158e0f5d5?w=800&h=1200",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Uma",
    name: "Uma",
    content: "刚刷到一条超级感人的视频，看哭了……",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Victor",
    name: "Victor",
    content: "健身第30天，坚持打卡！体重掉了5斤！兄弟们继续冲！",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1400",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wendy",
    name: "Wendy",
    content: "下班路上拍的晚霞，真的太美了～",
    image: "https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?w=800&h=1600",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Xander",
    name: "Xander",
    content: "今天学了一个新单词：serendipity（意外发现珍宝的才能）",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yvonne",
    name: "Yvonne",
    content: "我的早餐：燕麦+奇亚籽+蓝莓+牛奶，健康又好看～",
    image: "https://images.unsplash.com/photo-1498837167921-75a8f1a84b78?w=800&h=1000",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    name: "Zoe",
    content: "新入手的包包！YSL小方包，爱了爱了～",
    image: "https://images.unsplash.com/photo-1584911846112-2e4c7f5db4f6?w=800&h=1300",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    name: "Alex",
    content: "分享一个冷门但超好听的歌手：Cigarettes After Sex",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
    name: "Bella",
    content: "我的护肤顺序：洁面→水→精华→乳液→面霜→防晒\n姐妹们有推荐的国货吗？",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cody",
    name: "Cody",
    content: "今天加班到10点……谁懂啊家人们",
  },
  {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
    name: "Diana",
    content: "周末去看了画展，莫奈的睡莲真的太美了～现场拍的照片完全还原不了那种感觉",
    image: "https://images.unsplash.com/photo-1577720646271-7e9dc2e8c15f?w=800&h=1500",
  },

];

// 推荐使用这个版本（CSS Columns 方案，兼容性最好）
export default function Square() {
  const [activeTab, setActiveTab] = useState<"latest" | "hot">("latest");
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-8">
        <BackToTopButton />
        <div className="flex justify-center gap-8 mb-4">
            <button
            onClick={() => setActiveTab("latest")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "latest"
                ? "bg-gray-200 text-black dark:bg-white dark:text-black"
                : "bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
            }`}
            >
            
            最新
            </button>

            <button
            onClick={() => setActiveTab("hot")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "hot"
                ? "bg-gray-200 text-black dark:bg-white dark:text-black"
                : "bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
            }`}
            >
           
            最热
            </button>
        </div>
      {/* 真正的瀑布流：每列宽度相等，高度自适应，垂直间距统一 */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {mockPosts.map((post, index) => (
            <div key={index} className="mb-4 break-inside-avoid">
              <PostCard
                id={index}
                avatar={post.avatar}
                name={post.name}
                content={post.content}
                image={post.image}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}