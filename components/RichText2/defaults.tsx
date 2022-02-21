import { BlockConfig, EntityConfig, StyleConfig } from "./types";

interface _BlockMapping {
  [key: string]: BlockConfig;
  /**
   * Special key that is used when no other key matches
   */
  fallback: BlockConfig;
}

export type BlockMapping = Partial<_BlockMapping>;

export const blockMap: Partial<BlockMapping> = {
  ["unstyled"]: "p",
  ["header-one"]: "h1",
  ["header-two"]: "h2",
  ["header-three"]: "h3",
  ["header-four"]: "h4",
  ["header-five"]: "h5",
  ["header-six"]: "h6",
  ["unordered-list-item"]: { element: "li", wrapper: "ul" },
  ["ordered-list-item"]: { element: "li", wrapper: "ol" },
  ["blockquote"]: "blockquote",
  ["pre"]: "pre",
  ["code-block"]: ({ children }) => (
    <pre>
      <code>{children}</code>
    </pre>
  ),
  ["atomic"]: ({ children }) => children,
};

interface _StyleMapping {
  [key: string]: StyleConfig;
  /**
   * Special key that is used when no other key matches
   */
  fallback: StyleConfig;
}

export type StyleMapping = Partial<_StyleMapping>;

export const styleMap: Partial<StyleMapping> = {
  BOLD: "bold",
  CODE: "code",
  ITALIC: "em",
  UNDERLINE: "u",
  STRIKETHROUGH: "s",
  SUPERSCRIPT: "sup",
  SUBSCRIPT: "sub",
  MARK: "mark",
  QUOTATION: "q",
  SMALL: "small",
  SAMPLE: "samp",
  INSERT: "ins",
  DELETE: "del",
  KEYBOARD: "kbd",
};

interface _EntityMapping {
  [key: string]: EntityConfig;
  /**
   * Special key that is used when no other key matches
   */
  fallback: EntityConfig;
}

export type EntityMapping = Partial<_EntityMapping>;
