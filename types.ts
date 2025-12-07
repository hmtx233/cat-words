export interface Position {
  x: number;
  y: number;
}

export interface CardData {
  id: string;
  text: string;
  position: Position;
  zIndex: number;
  rotation: number;
  timestamp: string;
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
}