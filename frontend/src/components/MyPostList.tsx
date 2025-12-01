// src/components/MyPostList.tsx
import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import api from "@/utils/api"; // 使用你提供的 api 实例
import PostCard from "@/components/PostCard"; // 确保引入了类型
import type { MediaType } from "@/components/PostCard"
import { useUser } from "@/data/UserContext";

// 定义断点 (瀑布流列数配置)
const breakpointColumnsObj = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1 // 移动端单列可能体验更好，或者保持2列
};

interface PostData {
  id: number;
  content: string;
  location: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  authorAvatar: string;
  authorName: string;
  media: MediaType[]; 
  liked: boolean;
  tags?: string[];
  owner?: boolean;
  mediaUrls?: { url: string; type: 'image' | 'video'; coverUrl: string | null }[];
}

export default function MyPostList() {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      // 调用你的接口 /users/posts
      const res = await api.get("/users/posts", {
        params: { page: 0, size: 20 } // 暂时获取第一页
      });

      const rawContent = res.data.content || [];
      
      // 数据清洗/映射
      const mappedPosts = rawContent.map((item: any) => {
        // 处理媒体资源结构
        let mediaItems: MediaType[] = item.media || [];
        if (item.mediaUrls && Array.isArray(item.mediaUrls)) {
          mediaItems = item.mediaUrls.map((m: any) => ({
             type: m.type,
             url: m.url,
             coverUrl: m.coverUrl
          }));
        }

        return {
          ...item,
          // 如果后端返回的"我发布的帖子"里没有带头像/名字，可以用 Context 里的当前用户信息回退
          authorAvatar: item.authorAvatar || user?.avatar,
          authorName: item.authorName || user?.name,
          media: mediaItems
        };
      });

      setPosts(mappedPosts);
    } catch (error) {
      console.error("获取帖子失败", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理点赞 (本地乐观更新)
  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    // 1. 本地立即更新 UI
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, liked: !currentlyLiked, likeCount: currentlyLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));

    try {
      // 2. 发送请求
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      // 3. 失败回滚
      console.error("点赞失败", error);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, liked: currentlyLiked, likeCount: currentlyLiked ? p.likeCount + 1 : p.likeCount - 1 }
          : p
      ));
    }
  };

  const handleDeleteSuccess = (deletedPostId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
  };

    const handleUpdateSuccess = (id: number, newContent: string, newTags: string[]) => {
    setPosts((prevPosts) => 
      prevPosts.map((post) => {
        if (post.id === id) {
          return { ...post, content: newContent, tags: newTags };
        }
        return post;
      })
    );
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">加载中...</div>;
  }

  if (posts.length === 0) {
    return <div className="p-10 text-center text-gray-500">快去发个帖子吧！</div>;
  }

  return (
    <div className="w-full mt-10 px-10">
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
              isOwner={post.owner}
              onLike={handleLike}
              onDelete={handleDeleteSuccess}
              onUpdate={handleUpdateSuccess} 
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
}