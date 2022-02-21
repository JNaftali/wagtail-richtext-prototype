import RichText from "../components/RichText";

export default function Page() {
  return (
    <RichText
      data={{
        entityMap: {},
        blocks: [
          {
            key: "2tb83",
            inlineStyleRanges: [],
            type: "header-two",
            entityRanges: [],
            depth: 0,
            text: "Title 2",
          },
          {
            key: "8etgj",
            inlineStyleRanges: [],
            type: "header-three",
            entityRanges: [],
            depth: 0,
            text: "Title 3",
          },
          {
            key: "3u324",
            inlineStyleRanges: [],
            type: "header-four",
            entityRanges: [],
            depth: 0,
            text: "Title 4",
          },
          {
            key: "31pit",
            inlineStyleRanges: [],
            type: "header-five",
            entityRanges: [],
            depth: 0,
            text: "Title 5",
          },
          {
            key: "f4e7d",
            inlineStyleRanges: [],
            type: "blockquote",
            entityRanges: [],
            depth: 0,
            text: "Blockquote",
          },
          {
            key: "760g6",
            inlineStyleRanges: [],
            type: "unordered-list-item",
            entityRanges: [],
            depth: 0,
            text: "List item",
          },
          {
            key: "br7nd",
            inlineStyleRanges: [],
            type: "unordered-list-item",
            entityRanges: [],
            depth: 1,
            text: "Nested list item",
          },
          {
            key: "8q2c6",
            inlineStyleRanges: [{ offset: 13, length: 6, style: "BOLD" }],
            type: "ordered-list-item",
            entityRanges: [],
            depth: 0,
            text: "Ordered item (bold)",
          },
          {
            key: "dp5ml",
            inlineStyleRanges: [{ offset: 20, length: 8, style: "ITALIC" }],
            type: "ordered-list-item",
            entityRanges: [],
            depth: 1,
            text: "Nested ordered item (italic)",
          },
        ],
      }}
    />
  );
}
