export interface Position {
  x: number;
  y: number;
}

// 提示词模板
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CardData {
  id: string;
  text: string;
  promptId?: string; // 关联的提示词ID
  promptName?: string; // 关联的提示词名称
  position: Position;
  zIndex: number;
  rotation: number;
  timestamp: string;
  todoStates?: Record<string, boolean>; // 记录 Todo 项的完成状态，key 是行号
}

export interface TypewriterProps {
  onPrint: (text: string) => void;
  isPrinting: boolean;
}

export interface DraggableCardProps {
  data: CardData;
  onUpdatePosition: (id: string, newPos: Position) => void;
  onBringToFront: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onRemove: (id: string) => void;
  onDragEnd?: (id: string, finalPos: Position) => void;
  onDrag?: (id: string, currentPos: Position) => void;
}
