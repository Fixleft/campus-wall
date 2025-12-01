import { useState, useEffect, useRef, useCallback } from "react";
import Masonry from "react-masonry-css";
import PostCard from "@/components/PostCard";
import type { MediaType } from "@/components/PostCard";
import WritePostButton from "@/components/WritePostButton";
import api from "@/utils/api";



const breakpointColumnsObj = {
  default: 5,   
  1280: 4,      
  1024: 3,     
  768: 2,       
  640: 2        
};


interface ApiMediaItem {
  url: string;
  type: 'image' | 'video';
  coverUrl: string | null;
}

interface Post {
  id: number;
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
  mediaUrls?: ApiMediaItem[];
}

export default function Square() {
 
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    loadingRef.current = loading;
    hasMoreRef.current = hasMore;
  }, [loading, hasMore]);

  const observer = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    setLoading(true);
    loadingRef.current = true;

    try {
      const res = await api.get("/posts/latest", {
        params: { page, size: 15 }
      });

      const rawContent: Post[] = res.data.content || [];

      const newPosts = rawContent.map(post => {
        let mediaItems: MediaType[] = [];
        if (post.mediaUrls && Array.isArray(post.mediaUrls)) {
          mediaItems = post.mediaUrls.map(item => ({
            type: item.type,
            url: item.url,
            coverUrl: item.coverUrl
          }));
        }
        return { ...post, media: mediaItems };
      });

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });

      const totalPages = res.data.totalPages || 0;
      setHasMore(page + 1 < totalPages && newPosts.length > 0);
      setPage(prev => prev + 1);

    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      if (!node) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
            loadMore();
          }
        },
        { rootMargin: "1200px" } // 保持预加载机制
      );
      observer.current.observe(node);
    },
    [loadMore, loading]
  );

  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    // ... 点赞逻辑保持不变 ...
    try {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
              ...p,
              likeCount: currentlyLiked ? p.likeCount - 1 : p.likeCount + 1,
              liked: !currentlyLiked
            }
          : p
      ));
      const token = localStorage.getItem("token");
      await api.post(`/posts/${postId}/like`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err: any) {
      console.error("Like failed", err);
      // Revert logic...
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likeCount: currentlyLiked ? p.likeCount + 1 : p.likeCount - 1, liked: currentlyLiked } : p
      ));
    }
  };

  const handleDeleteSuccess = (deletedPostId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
  };
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-6"
      style={{ overflowAnchor: "none" }} 
    >
      <WritePostButton />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        
       
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4" 
          columnClassName="pl-4 bg-clip-padding" 
        >
          {posts.map((post) => (
            <div key={post.id} className="mb-4">
              <PostCard
                id={post.id}
                avatar={post.authorAvatar}
                name={post.authorName}
                content={post.content}
                media={post.media}
                createdAt={post.createdAt}
                likeCount={post.likeCount}
                liked={post.liked}
                location={post.location}
                tags={post.tags}
                isOwner= {post.owner}
                onDelete={handleDeleteSuccess}
                onLike={handleLike}
              />
            </div>
          ))}
        </Masonry>

       
        {hasMore && (
          <div
            ref={sentinelRef}
            className="mt-10 flex h-20 items-center justify-center w-full"
          >
            {loading && (
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
            You've reached the end
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}