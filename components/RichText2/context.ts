import { createContext, useContext, useCallback } from "react";
import {
  BlockMapping,
  EntityMapping,
  StyleMapping,
  blockMap,
  styleMap,
} from "./defaults";
import {
  EntityMap,
  Block,
  InlineStyleRange,
  EntityRange,
  Entity,
} from "./types";

export interface Config {
  blockMap: BlockMapping;
  styleMap: StyleMapping;
  entityDecorators: EntityMapping;
}

const context = createContext<{
  entityMap: EntityMap;
  config: Config;
}>({ entityMap: {}, config: { blockMap, styleMap, entityDecorators: {} } });

export const { Provider } = context;

export function useGetBlockFeature() {
  const features = useContext(context).config.blockMap;

  const fallback = features.fallback;

  return useCallback(
    (block: Block) => {
      const type = "type" in block ? block.type : undefined;
      if (type && features[type]) return features[type]!;
      if (fallback) return fallback;
      throw new Error(
        `Config Error: ${type} block is not in the config and has no fallback`
      );
    },
    [features]
  );
}

export function useGetStyleFeature() {
  const features = useContext(context).config.styleMap;
  const fallback = features.fallback;
  return useCallback(
    (range: InlineStyleRange) => {
      if (features[range.style]) return features[range.style];
      if (fallback) return fallback;
      throw new Error(
        `Config Error: ${range.style} style is not in the config and has no fallback`
      );
    },
    [features]
  );
}

export function useGetEntity() {
  const entityMap = useContext(context).entityMap;
  return useCallback(
    (entityRange: EntityRange) => entityMap[entityRange.key],
    [entityMap]
  );
}

export function useGetEntityFeature() {
  const features = useContext(context).config.entityDecorators;
  const fallback = features.fallback;
  return useCallback(
    (entity: Entity) => {
      if (features[entity.type]) return features[entity.type];
      if (fallback) return fallback;
      throw new Error(
        `Config Error: ${entity.type} entity is not in the config and has no fallback`
      );
    },
    [features]
  );
}
