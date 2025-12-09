

interface Media {
  url: string;
  type: 'image' | 'video';
}

interface MediaPreviewProps {
  media: Media[];
}

export default function MediaPreview({ media }: MediaPreviewProps) {
  if (!media || media.length === 0) {
    return null;
  }

  // 根据媒体数量选择不同布局
  const gridClass = `grid grid-cols-2 gap-1.5`;

  return (
    <div className={`my-3 rounded-lg overflow-hidden ${gridClass}`}>
      {media.slice(0, 4).map((item, index) => ( // 最多显示4个
        <div key={index} className="aspect-w-16 aspect-h-9 bg-neutral-100 dark:bg-neutral-800">
          {item.type === 'image' ? (
            <img 
              src={item.url} 
              alt={`media-${index}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => window.open(item.url, '_blank')}
            />
          ) : (
            <video 
              src={item.url} 
              controls 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}