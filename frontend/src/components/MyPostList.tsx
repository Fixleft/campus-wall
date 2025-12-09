import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useUser } from "@/context/UserContext";
import PostMasonryList from "./PostMasonryList"; 
import type { Post } from "@/pages/Square";
import type { MediaType } from "@/components/PostCard";
import ProfileTabs from "./ProfileTabs";
import type { TabKey } from "./ProfileTabs";




export default function MyPostList() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabKey>("created");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return; 
    setLoading(true); 
    setPosts([]); 
    setActiveTab(tab);
  };


  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

 const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let endpoint = "";
      
      // 根据 TabKey 决定调哪个接口
      switch (activeTab) {
        case "created":
          endpoint = "/users/posts";
          break;
        case "liked":
          endpoint = "/users/posts/liked";
          break;
       
          setPosts([]);
          setLoading(false);
          return; 
      }

      const res = await api.get(endpoint, {
        params: { page: 0, size: 20 }
      });

      const rawContent = res.data.content || [];

      // 数据清洗逻辑 (保持不变)
      const mappedPosts = rawContent.map((item: any) => {
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
          authorAvatar: item.authorAvatar || user?.avatar,
          authorName: item.authorName || "未知用户",
          media: mediaItems,
          liked: activeTab === 'liked' ? true : item.liked
        };
      });

      setPosts(mappedPosts);
    } catch (error) {
      console.error("获取数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number, currentlyLiked: boolean) => {
  
    setPosts(prev => {
        
        if (activeTab === 'liked' && currentlyLiked) {
             return prev.map(p => p.id === postId ? { ...p, liked: false, likeCount: p.likeCount - 1 } : p);
        }
        
        return prev.map(p => 
            p.id === postId 
            ? { ...p, liked: !currentlyLiked, likeCount: currentlyLiked ? p.likeCount - 1 : p.likeCount + 1 }
            : p
        );
    });

    try {
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error("点赞失败", error);
      fetchPosts(); 
    }
  };

  const handleDeleteSuccess = (deletedPostId: number) => {
    setPosts(prev => prev.filter(post => post.id !== deletedPostId));
  };

  const handleUpdateSuccess = (id: number, newContent: string, newTags: string[]) => {
    setPosts(prev => prev.map(post => post.id === id ? { ...post, content: newContent, tags: newTags } : post));
  };

  return (
    <div className="w-full min-h-screen">
      <ProfileTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      <div className="mt-2">
         <PostMasonryList 
             posts={posts} 
             loading={loading}
             onLike={handleLike}
             onDelete={handleDeleteSuccess}
             onUpdate={handleUpdateSuccess}
           /> 
      </div>
    </div>
  );
}
