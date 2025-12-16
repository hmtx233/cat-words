import React, { useState, useEffect, useRef } from "react";
import { CardData, Position } from "../types";
import { captureCardWithMargins } from "../services/imageService";
import { playTypeSound } from "../services/audioService";

interface DraggableCardProps {
  data: CardData;
  onUpdatePosition: (id: string, newPos: Position) => void;
  onBringToFront: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onRemove: (id: string) => void;
  onDragEnd?: (id: string, finalPos: Position) => void;
  onDrag?: (id: string, currentPos: Position) => void;
  onTodoStateChange?: (
    id: string,
    lineIndex: number,
    completed: boolean,
  ) => void;
}

const MAX_TYPING_LENGTH = 80;

export const DraggableCard: React.FC<DraggableCardProps> = ({
  data,
  onUpdatePosition,
  onBringToFront,
  onDoubleClick,
  onRemove,
  onDragEnd,
  onDrag,
  onTodoStateChange,
}) => {
  const [typedContent, setTypedContent] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 检查是否是 Todo 格式（以 □ 开头的行）
  const isTodoFormat = data.text.includes("□");

  // 解析 Todo 行
  const getTodoLines = () => {
    return data.text.split("\n").map((line, idx) => ({
      idx,
      text: line,
      isTodo: line.trim().startsWith("□"),
      isCompleted: data.todoStates?.[idx.toString()] || false,
    }));
  };

  const todoLines = isTodoFormat ? getTodoLines() : [];

  // 字数统计: CJK字符单独计数 + 空格分隔的拉丁词
  const getWordCount = (text: string) => {
    const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjkText = text.replace(/[\u4e00-\u9fa5]/g, " ");
    const latinCount = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
    return cjkCount + latinCount;
  };

  const wordCount = getWordCount(data.text);

  // 打字动画使用截断文本
  const typingText =
    data.text.length > MAX_TYPING_LENGTH
      ? data.text.slice(0, MAX_TYPING_LENGTH) + "..."
      : data.text;

  // Typing effect
  useEffect(() => {
    if (typedContent.length < typingText.length) {
      const timeout = setTimeout(() => {
        setTypedContent(typingText.slice(0, typedContent.length + 1));
        if (typedContent.length % 2 === 0) {
          playTypeSound();
        }
      }, 8);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [typedContent, typingText]);

  // Sync DOM position
  useEffect(() => {
    if (!isDragging && cardRef.current) {
      cardRef.current.style.left = `${data.position.x}px`;
      cardRef.current.style.top = `${data.position.y}px`;
    }
  }, [data.position, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onBringToFront(data.id);
    setIsDragging(true);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !cardRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    cardRef.current.style.left = `${newX}px`;
    cardRef.current.style.top = `${newY}px`;

    // 实时通知拖拽位置
    if (onDrag) {
      onDrag(data.id, { x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);

      if (cardRef.current) {
        cardRef.current.releasePointerCapture(e.pointerId);

        const finalX = parseFloat(cardRef.current.style.left || "0");
        const finalY = parseFloat(cardRef.current.style.top || "0");
        onUpdatePosition(data.id, { x: finalX, y: finalY });

        // 通知拖拽结束
        if (onDragEnd) {
          onDragEnd(data.id, { x: finalX, y: finalY });
        }
      }
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      onRemove(data.id);
    }, 200);
  };

  const handleSaveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || !cardRef.current) return;

    setIsSaving(true);
    try {
      await captureCardWithMargins(
        cardRef.current,
        `print-cat-note-${data.id.slice(-4)}.png`,
      );
    } catch (err) {
      console.error("Failed to save image", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getDynamicStyle = () => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: data.position.x,
      top: data.position.y,
      zIndex: data.zIndex,
      ["--tw-rotate" as any]: `${data.rotation}deg`,
      cursor: isDragging ? "grabbing" : "grab",
      touchAction: "none",
    };

    if (isTyping && !isDragging) {
      const progress = Math.min(
        typedContent.length / (typingText.length || 1),
        1,
      );
      const feedOffset = (1 - progress) * 40;
      style["--tw-translate-y" as any] = `${feedOffset}px`;
    }

    return style;
  };

  // 显示内容: 打字中显示打字内容, 完成后显示完整文本
  const displayContent = isTyping ? typedContent : data.text;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(data.id);
      }}
      style={getDynamicStyle()}
      className={`
        group
        transform
        w-72 min-h-[200px] p-5 pt-9
        bg-[#fbf9f5]
        shadow-[2px_2px_12px_rgba(0,0,0,0.15)]
        border border-[#e5e0d8]

        transition-[transform,box-shadow,opacity] ease-out

        relative overflow-hidden
        rounded-[2px]
        will-change-transform

        ${isExiting ? "duration-200 scale-0 opacity-0" : "duration-150"}

        ${!isDragging && !isExiting ? "hover:shadow-xl hover:scale-[1.02]" : ""}

        ${isDragging ? "shadow-[8px_16px_30px_rgba(0,0,0,0.25)] scale-[1.03] z-50 duration-0" : ""}
      `}
    >
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 overflow-hidden rounded-[2px] pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.3] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Push Pin Visual */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[1px_2px_3px_rgba(0,0,0,0.3)] border border-red-900/50 relative">
          <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-red-300 opacity-60"></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none"
        data-html2canvas-ignore="true"
      >
        <button
          onClick={handleSaveImage}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-6 h-6 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center shadow border border-stone-200 hover:bg-amber-100 hover:text-amber-800 transition-all pointer-events-auto"
          title="Save as Image"
        >
          {isSaving ? (
            <div className="w-2 h-2 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          )}
        </button>

        <button
          onClick={handleRemoveClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center shadow border border-stone-700 hover:bg-red-900 transition-all pointer-events-auto"
          title="Discard Card"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Metadata Header */}
      <div className="flex justify-between items-end border-b border-stone-800/10 pb-2 mb-3 relative z-10 pointer-events-none">
        <div className="text-[10px] text-stone-400 font-pixel tracking-widest uppercase opacity-70 flex gap-2">
          <span>SEQ // {data.id.slice(-4)}</span>
          <span className="opacity-50">|</span>
          <span>{wordCount} WDS</span>
        </div>
        <div className="text-[9px] text-stone-500 font-mono font-bold opacity-60 tracking-tight text-right leading-tight max-w-[100px]">
          {data.timestamp}
        </div>
      </div>

      {/* Text Content */}
      <div className="font-mono text-stone-800 text-sm leading-relaxed select-none relative z-10">
        {isTodoFormat ? (
          // Todo 格式：可点击的行
          <div className="space-y-1">
            {todoLines.map((line) => (
              <div
                key={line.idx}
                onClick={(e) => {
                  e.stopPropagation();
                  if (line.isTodo && onTodoStateChange) {
                    onTodoStateChange(data.id, line.idx, !line.isCompleted);
                  }
                }}
                className={`cursor-pointer transition-all ${
                  line.isTodo ? "hover:bg-stone-100/50 px-2 py-0.5 rounded" : ""
                } ${line.isCompleted ? "line-through opacity-50 text-stone-500" : ""}`}
              >
                {line.isTodo ? (
                  <span className="inline-block">
                    {line.isCompleted ? "☑" : "□"}{" "}
                    {line.text.replace("□", "").trim()}
                  </span>
                ) : (
                  line.text
                )}
              </div>
            ))}
            {isTyping && (
              <span className="inline-block w-1.5 h-4 bg-stone-800 ml-0.5 animate-type-cursor align-middle opacity-70"></span>
            )}
          </div>
        ) : (
          // 普通格式：不可点击
          <div className="whitespace-pre-wrap pointer-events-none">
            {displayContent}
            {isTyping && (
              <span className="inline-block w-1.5 h-4 bg-stone-800 ml-0.5 animate-type-cursor align-middle opacity-70"></span>
            )}
          </div>
        )}
      </div>

      {/* Decorative Stamp Footer */}
      <div className="absolute bottom-3 right-4 opacity-10 pointer-events-none rotate-[-8deg] mix-blend-multiply z-0">
        <div className="border-2 border-stone-800 px-2 py-0.5 font-pixel text-xs tracking-widest text-stone-800">
          PRINT CAT
        </div>
      </div>
    </div>
  );
};
