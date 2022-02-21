import { Provider, Config } from "./context";
import {
  blockMap as defaultBlockMap,
  styleMap as defaultStyleMap,
} from "./defaults";
import { ContentState } from "./types";

interface Props {
  data: ContentState;
  config?: Partial<Config>;
}

export default function RichText({
  data: { blocks, entityMap },
  config: {
    blockMap = defaultBlockMap,
    styleMap = defaultStyleMap,
    entityDecorators = {},
  } = {},
}: Props) {
  return (
    <Provider
      value={{ entityMap, config: { blockMap, styleMap, entityDecorators } }}
    >
      {blocks.map((_, i) => (
        <p key={i}>unimplemented</p>
      ))}
    </Provider>
  );
}
