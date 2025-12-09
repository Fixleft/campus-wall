import Masonry from "react-masonry-css";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/pages/Square";


interface PostMasonryListProps {
  posts: Post[];
  loading: boolean;
  onLike: (postId: number, currentlyLiked: boolean) => void;
  onDelete: (deletedPostId: number) => void;
  onUpdate: (id: number, newContent: string, newTags: string[]) => void;
  columns?: number | { [key: string]: number }; 
}

const defaultBreakpoints = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1 
};

export default function PostMasonryList({ 
  posts, 
  loading, 
  onLike, 
  onDelete, 
  onUpdate,
  columns,
}: PostMasonryListProps) {
  const finalBreakpoints = columns || defaultBreakpoints;
   if (loading) {
    return (
      <div className="w-full px-2 md:px-10">
        <Masonry
          breakpointCols={finalBreakpoints}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {/* 生成 6 个假卡片占位 */}
          {[...Array(6)].map((_, i) => (
             <div key={i} className="mb-4 space-y-3">
              
                <Skeleton className="h-64 w-full rounded-xl bg-gray-200" />
               
                <div className="space-y-2 px-1">
                  <Skeleton className="h-4 w-[80%] bg-gray-200" />
                  <Skeleton className="h-4 w-[60%] bg-gray-200" />
                </div>
             </div>
          ))}
        </Masonry>
      </div>
    );
  }

   if (posts.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">

            <p>这里空空如也~</p>
        </div>
    );
  }

  return (
    <div className="w-full px-2 md:px-10">
      <Masonry
        breakpointCols={finalBreakpoints}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {posts.map((post) => (
          <div key={post.id} className="mb-4">
            <PostCard
              id={post.id}
              uid={post.authorUid}
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
              onLike={onLike}
              onDelete={onDelete}
              onUpdate={onUpdate}
              isFriend={post.friend}
              isAnonymous={post.anonymous}
              status={post.status}
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
}