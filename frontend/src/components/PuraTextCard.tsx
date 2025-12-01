// TextPostCover.tsx (或者放在 PostCard.tsx 底部)
import React from "react";

interface TextPostCoverProps {
  content: string;
  bgColor: string;
  accentColor: string;
  className?: string;
}

export const TextPostCover: React.FC<TextPostCoverProps> = ({
  content,
  bgColor,
  accentColor,
  className = "",
}) => {
  
  
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center p-8 ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill={accentColor}
        className="absolute top-8 left-8 w-10 h-10 opacity-50"
      >
        <path d="M96 280C96 213.7 149.7 160 216 160L224 160C241.7 160 256 174.3 256 192C256 209.7 241.7 224 224 224L216 224C185.1 224 160 249.1 160 280L160 288L224 288C259.3 288 288 316.7 288 352L288 416C288 451.3 259.3 480 224 480L160 480C124.7 480 96 451.3 96 416L96 280zM352 280C352 213.7 405.7 160 472 160L480 160C497.7 160 512 174.3 512 192C512 209.7 497.7 224 480 224L472 224C441.1 224 416 249.1 416 280L416 288L480 288C515.3 288 544 316.7 544 352L544 416C544 451.3 515.3 480 480 480L416 480C380.7 480 352 451.3 352 416L352 280z" />
      </svg>

      <span className="text-3xl font-bold text-neutral-700/80 leading-tight text-center break-words max-w-full z-10 font-serif">
        {content}
      </span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill={accentColor}
        className="absolute bottom-8 right-8 w-10 h-10 opacity-50"
      >
        <path d="M544 360C544 426.3 490.3 480 424 480L416 480C398.3 480 384 465.7 384 448C384 430.3 398.3 416 416 416L424 416C454.9 416 480 390.9 480 360L480 352L416 352C380.7 352 352 323.3 352 288L352 224C352 188.7 380.7 160 416 160L480 160C515.3 160 544 188.7 544 224L544 360zM288 360C288 426.3 234.3 480 168 480L160 480C142.3 480 128 465.7 128 448C128 430.3 142.3 416 160 416L168 416C198.9 416 224 390.9 224 360L224 352L160 352C124.7 352 96 323.3 96 288L96 224C96 188.7 124.7 160 160 160L224 160C259.3 160 288 188.7 288 224L288 360z" />
      </svg>
    </div>
  );
};