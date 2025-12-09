import { useState, useEffect, useRef, useCallback } from "react";
import Masonry from "react-masonry-css";
import { Search, X, User, FileText, Loader2 } from "lucide-react"; 
import PostCard from "@/components/PostCard";
import type { MediaType } from "@/components/PostCard";
import WritePostButton from "@/components/WritePostButton";
import api from "@/utils/api";
import AddFriendButton from "@/components/AddFriendButton";
import UserAvatar from "@/components/UserAvatar";

// --- 断点配置 ---
const breakpointColumnsObj = {
  default: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2
};

// --- 类型定义 ---
export interface Post {
  id: number;
  authorUid: string;
  content: string;
  location: string;
  anonymous: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  authorAvatar: string;
  authorName: string;
  media: MediaType[];
  liked: boolean;
  tags?: string[];
  owner?: boolean;
  friend: boolean;
  status: number;
}

interface UserResult {
  uid: string;
  name: string;
  avatar: string;
  signature?: string;
  friend: boolean;
}

// --- 骨架屏组件 (虚拟假帖子) ---
const PostSkeleton = () => {
  return (
    <div className="mb-4 break-inside-avoid bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-100 dark:border-neutral-800 shadow-sm animate-pulse">
      {/* 头部：头像 + 名字 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-neutral-800 rounded" />
          <div className="h-3 w-1/4 bg-gray-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
      {/* 媒体占位 (随机高度模拟瀑布流) */}
      <div 
        className="w-full bg-gray-200 dark:bg-neutral-800 rounded-lg mb-3" 
        style={{ height: `${Math.floor(Math.random() * 100) + 150}px` }} 
      />
      {/* 文本占位 */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-gray-200 dark:bg-neutral-800 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-neutral-800 rounded" />
        <div className="h-3 w-4/6 bg-gray-200 dark:bg-neutral-800 rounded" />
      </div>
      {/* 底部按钮占位 */}
      <div className="flex justify-between mt-2">
        <div className="h-6 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
      </div>
    </div>
  );
};

export default function Square() {


  // --- 状态管理 ---
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");

  // Refs
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    loadingRef.current = loading;
    hasMoreRef.current = hasMore;
  }, [loading, hasMore]);

  // --- 加载帖子 ---
  const loadPosts = useCallback(async (isReset = false, currentQuery = "") => {
    // 如果正在加载，且不是重置操作，则阻断
    if (loadingRef.current && !isReset) return;
    // 如果没有更多数据，且不是重置操作，则阻断
    if (!isReset && !hasMoreRef.current) return;

    setLoading(true);
    loadingRef.current = true;

    const currentPage = isReset ? 0 : page;
    const effectiveQuery = currentQuery || (isSearching ? searchQuery : "");
    const isSearchMode = !!effectiveQuery;

    try {
      let url = "/posts/latest";
      let params: any = { page: currentPage, size: 15 };

      if (isSearchMode) {
        url = "/posts/search";
        params.keyword = effectiveQuery;
      }

      const res = await api.get(url, { params });
      
      // 兼容两种后端返回结构 (Result<Page> 或 Page)
      const pageData = res.data?.data || res.data || {};
      const rawContent: Post[] = pageData.content || [];

      // 数据处理
      const newPosts = rawContent.map(post => {
        let mediaItems: MediaType[] = [];
        if (post.media && Array.isArray(post.media)) {
             mediaItems = post.media as MediaType[];
        }
        return { ...post, media: mediaItems };
      });

      setPosts((prev) => {
        if (isReset) return newPosts;
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });

      const totalPages = pageData.totalPages || 0;
      setHasMore(currentPage + 1 < totalPages && newPosts.length > 0);
      setPage(currentPage + 1);

    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, isSearching, searchQuery]);

  // --- 搜索用户 ---
  const searchUsers = async (query: string) => {
    if (!query.trim()) return;
    setUserLoading(true);
    setUserResults([]);
    try {
      const res = await api.get("/users/search", { params: { keyword: query } });
      setUserResults(res.data?.data || []);
    } catch (err) {
      console.error("User search failed", err);
    } finally {
      setUserLoading(false);
    }
  };

  // --- 搜索交互 ---
  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setActiveTab("posts");
    
    searchUsers(query);

    // 搜索时重置帖子状态
    setPage(0); 
    setHasMore(true);
    setPosts([]); // 先清空，展示骨架屏
    loadPosts(true, query); 
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setActiveTab("posts");
    setUserResults([]);
    
    setPage(0);
    setHasMore(true);
    setPosts([]); // 先清空，展示骨架屏
    setTimeout(() => loadPosts(true, ""), 0);
  };

  // 初始加载
  useEffect(() => {
    if (!isSearching && posts.length === 0) {
      loadPosts(false, "");
    }
  }, []);

  // --- 修复后的无限滚动监听 ---
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // 如果正在搜用户，不触发滚动
      if (isSearching && activeTab === 'users') return;
      
      if (observer.current) observer.current.disconnect();
      if (!node) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          // 只要看见了哨兵元素，且有更多数据，且不在加载中，就触发加载
          if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
            loadPosts(false);
          }
        },
        { 
          // 提前 200px 触发，体验更丝滑
          rootMargin: "200px" 
        }
      );
      observer.current.observe(node);
    },
    [loadPosts, isSearching, activeTab] // 移除 loading 依赖，防止死锁
  );

  // 操作回调
  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: currentlyLiked ? p.likeCount - 1 : p.likeCount + 1, liked: !currentlyLiked } : p));
    try {
        const token = localStorage.getItem("token");
        await api.post(`/posts/${postId}/like`, null, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
  };
  const handleDeleteSuccess = (pid: number) => setPosts(prev => prev.filter(p => p.id !== pid));

  // --- 判断是否是初始加载状态 (显示全屏骨架) ---
  const isInitialLoading = loading && posts.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 relative" style={{ overflowAnchor: "none" }}>
      
      <header className="sticky top-0 z-40 w-full backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 to-white/60 dark:from-neutral-950/95 dark:to-neutral-950/60 border-b border-white/80 dark:border-neutral-800 pointer-events-none"></div>
        <div className="relative mx-auto max-w-[1600px] px-4 h-16 flex items-center justify-center">
          <div className="relative w-full max-w-lg group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="搜索内容、标签、用户名或 UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-10 pl-11 pr-10 rounded-full bg-gray-100/80 dark:bg-neutral-800/80 border border-transparent focus:bg-white dark:focus:bg-neutral-900 focus:border-none outline-none text-sm transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
            />
            {(isSearching || searchQuery) && (
               <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                 <X size={18} />
               </button>
            )}
          </div>
        </div>
      </header>

      <WritePostButton />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        
        {isSearching && (
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-neutral-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 inline-flex">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "posts" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                <FileText size={16} />
                相关帖子
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs min-w-[20px] text-center">
                  {loading && posts.length === 0 ? "-" : (hasMore ? "99+" : posts.length)}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "users" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                <User size={16} />
                相关用户
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs min-w-[20px] text-center">
                   {userLoading ? "-" : userResults.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* --- 场景 1: 用户搜索结果 --- */}
        {isSearching && activeTab === "users" ? (
          <div className="min-h-[300px]">
            {userLoading ? (
               <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>
            ) : userResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userResults.map((u) => (
                  <div key={u.uid} className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <UserAvatar avatar={u.avatar} uid={u.uid} size="w-15 h-15"/>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base">{u.name}</h3>
                      <p className="text-xs text-gray-500 truncate font-mono mt-0.5">UID: {u.uid}</p>
                      {u.signature ? <p className="text-xs text-gray-400 line-clamp-2 mt-1">{u.signature}</p> : <p className="text-xs text-gray-300 italic mt-1">暂无签名</p>}
                    </div>
                     <div className="shrink-0">
                        <AddFriendButton 
                            targetUid={u.uid} 
                            initialIsFriend={u.friend} 
                            variant="text" 
                            size="sm"
                        />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <User size={48} className="mb-4 opacity-20" />
                <p>未找到匹配 "{searchQuery}" 的用户</p>
              </div>
            )}
          </div>
        ) : (
          /* --- 场景 2: 帖子展示 (默认流 OR 搜索结果) --- */
          <>
            {/* 1. 初始加载状态：显示全屏骨架屏 */}
            {isInitialLoading ? (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-auto -ml-4"
                columnClassName="pl-4 bg-clip-padding"
              >
                {/* 生成 10 个假帖子 */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </Masonry>
            ) : (
              /* 2. 真实内容展示 */
              <>
                {posts.length > 0 ? (
                    <Masonry
                      breakpointCols={breakpointColumnsObj}
                      className="flex w-auto -ml-4" 
                      columnClassName="pl-4 bg-clip-padding" 
                    >
                    {posts.map((post) => (
                        <div key={post.id} className="mb-4">
                          <PostCard
                            id={post.id}
                            uid={post.authorUid || ""}
                            avatar={post.authorAvatar}
                            name={post.authorName}
                            content={post.content}
                            media={post.media}
                            createdAt={post.createdAt}
                            likeCount={post.likeCount}
                            liked={post.liked}
                            location={post.location}
                            tags={post.tags}
                            isOwner={post.owner}
                            onDelete={handleDeleteSuccess}
                            onLike={handleLike}
                            isFriend={post.friend}
                            isAnonymous={post.anonymous}
                          />
                        </div>
                    ))}
                    </Masonry>
                ) : !loading && (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">
                            {isSearching ? `未找到关于 "${searchQuery}" 的帖子` : "暂无内容"}
                        </p>
                    </div>
                )}
              </>
            )}

            {/* --- 无限滚动哨兵元素 & 底部 Loading --- */}
            {/* 只要还有更多数据，就渲染哨兵元素 */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-6 flex h-1 items-center justify-center w-full">
                {/* 滚动加载时，显示简单的 Loading 动画，而不是骨架屏（避免布局跳动） */}
                {loading && !isInitialLoading && (
                   <div className="flex items-center gap-2 text-gray-400">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></span>
                   </div>
                )}
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                {isSearching ? "没有更多搜索结果了~" : "已经到底啦~"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}