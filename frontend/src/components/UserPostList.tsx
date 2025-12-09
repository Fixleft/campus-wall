import { useState, useEffect, useCallback } from "react";
import PostMasonryList from "@/components/PostMasonryList"; 
import api from "@/utils/api"; 


interface UserPostListProps {
  uid: string | number;
}

export default function UserPostList({ uid }: UserPostListProps) {
  const [posts, setPosts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // 分页状态
  const [page, setPage] = useState(0); // 假设后端从0开始，如果是1请改为1
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10; // 每次加载10条

  // 1. 获取数据的函数
  const fetchUserPosts = useCallback(async (isRefresh = false) => {
    if (!uid) return;
    
    try {
      setLoading(true);
      const currentPage = isRefresh ? 0 : page;
      
      const response = await api.get(`/users/posts/${uid}`, {
        params: {
          page: currentPage,
          size: pageSize
        }
      });

     
      const newPosts = response.data.content || response.data || [];
      
      if (isRefresh) {
        setPosts(newPosts);
        setPage(1); // 下一次请求第1页
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }

      // 如果返回的数量少于pageSize，说明没数据了
      if (newPosts.length < pageSize) {
        setHasMore(false);
      }

    } catch (error) {
      console.error("获取用户作品失败:", error);
    } finally {
      setLoading(false);
    }
  }, [uid, page]);

  // 初次加载
  useEffect(() => {
    fetchUserPosts(true);
  }, [uid]);

  // 2. 点赞处理 (乐观更新: 先改界面，再发请求，或者请求完改界面)
  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    // 乐观更新 UI
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !currentlyLiked,
            likeCount: currentlyLiked ? post.likeCount - 1 : post.likeCount + 1
          };
        }
        return post;
      })
    );

    try {
        await api.post(`/posts/${postId}/like`);
    } catch (error) {
      // 如果失败，回滚状态（这里省略回滚逻辑，实际项目建议加上）
      console.error("点赞失败", error);
    }
  };

  // 3. 删除处理
  const handleDelete = async (postId: number) => {
    try {
      await api.delete(`/posts/${postId}`);
      // 从列表中移除
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    } catch (error) {
      console.error("删除失败", error);
    }
  };

  // 4. 更新处理
  const handleUpdate = (id: number, newContent: string, newTags: string[]) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent, tags: newTags } : p));
  };

  return (
    <div className="w-full pb-10">
      <PostMasonryList 
        posts={posts}
        loading={loading && posts.length === 0}
        onLike={handleLike}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        columns={3}
      />
      
      
      {!loading && hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => fetchUserPosts(false)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition"
          >
            加载更多
          </button>
        </div>
      )}
      
      {/* 没数据时的文字由 PostMasonryList 处理，这里不再重复 */}
    </div>
  );
}