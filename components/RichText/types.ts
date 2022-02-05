export interface EntityRange {
  key: number;
  offset: number;
  length: number;
}

export interface InlineStyleRange {
  offset: number;
  length: number;
  style: string;
}

export interface FullBlock {
  depth?: number;
  entityRanges?: EntityRange[];
  inlineStyleRanges?: InlineStyleRange[];
  key: string;
  text: string;
  type: string;
  data?: any;
}

export type Block = FullBlock | { text: string };

export interface Entity {
  // mutability: 'MUTABLE' | 'IMMUTABLE';
  mutability: string; // we don't use this anyway
  type: string;
  data: any;
}

export interface EntityMap {
  [key: number]: Entity;
}
