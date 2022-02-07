import { WrappedBlockFeature, defaultFeatures } from "./features";
import React, {
  createContext,
  createElement as h,
  useCallback,
  useContext,
} from "react";
import {
  Block,
  Entity,
  EntityMap,
  EntityRange,
  FullBlock,
  InlineStyleRange,
} from "./types";

interface Props {
  data: {
    blocks: Block[];
    entityMap: EntityMap;
  };
  features?: typeof defaultFeatures;
}

const context = createContext<{
  entityMap: EntityMap;
  features: typeof defaultFeatures;
}>({ entityMap: {}, features: defaultFeatures });

export default function RichText({ data, features = defaultFeatures }: Props) {
  // result will be a (possible nested) array of jsx elements but I neither know nor care how to type that
  const result: any = [];
  const { blocks, entityMap } = data;
  const totalBlocks = blocks.length;
  let index = 0;
  while (index < totalBlocks) {
    const currentBlock = blocks[index];

    if (!("key" in currentBlock)) {
      result.push(
        <BlockComponent
          key={index}
          block={{ ...currentBlock, type: "unstyled", key: index.toString() }}
        />
      );
      index += 1;
      continue;
    }

    if (currentBlock.type === "atomic") {
      result.push(<AtomicBlock key={currentBlock.key} block={currentBlock} />);
      index += 1;
      continue;
    }

    const blockFeature = features.blocks[currentBlock.type];

    // When there's no wrapper/nesting to worry about, just render the block
    if (
      typeof blockFeature === "function" ||
      typeof blockFeature === "string" ||
      typeof blockFeature === "undefined"
    ) {
      result.push(
        <BlockComponent key={currentBlock.key} block={currentBlock} />
      );
      index += 1;
      continue;
    }

    if ("wrapperElement" in blockFeature) {
      // Grab all elements wrapped in the same list
      const listElements = pickUntil(
        // Safe to ignore elements that are just text because those (by definition) aren't part of lists
        blocks.slice(index) as FullBlock[],
        (block) =>
          block.type !== currentBlock.type && getBlockDepth(block) === 0
      );

      result.push(
        <WrappedBlockComponent
          blocks={listElements}
          feature={blockFeature}
          key={currentBlock.key}
        />
      );
      index += listElements.length;
      continue;
    }

    result.push(<p key={index}>unimplemented</p>);
    index += 1;
  }

  return (
    <context.Provider
      value={{
        entityMap,
        features,
      }}
    >
      {result.flat(Infinity)}
    </context.Provider>
  );
}

function useGetBlockFeature() {
  const features = useContext(context).features.blocks;
  return useCallback(
    (block: Block) => {
      if (!("type" in block)) return "p";
      return features[block.type] ?? "div";
    },
    [features]
  );
}

function useGetStyleFeature() {
  const features = useContext(context).features.styles;
  return useCallback(
    (style: InlineStyleRange) => features[style.style] ?? "span",
    [features]
  );
}

function useGetEntity() {
  const entityMap = useContext(context).entityMap;
  return useCallback(
    (entityRange: EntityRange) => entityMap[entityRange.key],
    [entityMap]
  );
}

function useGetEntityFeature() {
  const features = useContext(context).features.entities;
  return useCallback(
    (entity: Entity) => features[entity.type] ?? "span",
    [features]
  );
}

function WrappedBlockComponent({
  blocks,
  feature: { wrapperElement: Wrapper },
  depth = 0,
}: {
  blocks: FullBlock[];
  feature: WrappedBlockFeature;
  depth?: number;
}) {
  const getFeatureForBlock = useGetBlockFeature();

  const result: any = [];
  let index = 0;

  while (index < blocks.length) {
    const currentBlock = blocks[index];
    const currentFeature = getFeatureForBlock(currentBlock);
    if (typeof currentFeature !== "object")
      throw new Error("unknown or incorrect feature in WrappedBlockComponent");
    if (getBlockDepth(currentBlock) === depth) {
      result.push(
        <BlockComponent key={currentBlock.key} block={currentBlock} />
      );
      index += 1;
    } else {
      const subList = pickUntil(
        blocks.slice(index),
        (block) =>
          getBlockDepth(block) === depth || block.type !== currentBlock.type
      );
      result.push(
        <WrappedBlockComponent
          blocks={subList}
          feature={currentFeature}
          depth={depth + 1}
          key={currentBlock.key}
        />
      );
      index += subList.length;
    }
  }

  if (typeof Wrapper === "string") {
    return h(Wrapper, {}, result);
  } else {
    return <Wrapper depth={depth}>{result}</Wrapper>;
  }
}

const compositeDecorators = [
  {
    strategy: /\\n/g,
    component: () => <br />,
  },
];

type CompositeRange = {
  compositeKey: `compositedecorator${number}${number}`;
  offset: number;
  length: number;
  component: string | React.FC;
};

function BlockComponent({ block }: { block: Block }) {
  const getFeatureForBlock = useGetBlockFeature();
  let text = block.text;

  const compositeRanges = compositeDecorators.flatMap(
    ({ strategy, component }, index1) => {
      return [...text.matchAll(strategy)].map(
        (match, index2): CompositeRange => ({
          compositeKey: `compositedecorator${index1}${index2}`,
          offset: match.index ?? 0, // When can this be undefined? I don't know
          length: match[0].length,
          component,
        })
      );
    }
  );
  const styleRanges =
    "inlineStyleRanges" in block && block.inlineStyleRanges
      ? block.inlineStyleRanges
      : [];
  const entityRanges =
    "entityRanges" in block && block.entityRanges ? block.entityRanges : [];
  const ranges = [...compositeRanges, ...styleRanges, ...entityRanges];
  ranges.sort((a, b) => {
    if (a.offset !== b.offset) return a.offset - b.offset;
    if (a.length !== b.length) return b.length - a.length;
    const aType =
      "key" in a ? a.key : "compositeKey" in a ? a.compositeKey : a.style;
    const bType =
      "key" in b ? b.key : "compositeKey" in b ? b.compositeKey : b.style;
    return bType.toString().localeCompare(aType.toString());
  });

  const feature = getFeatureForBlock(block);
  const Component =
    typeof feature === "object" ? feature.contentElement : feature;
  if (typeof Component === "string") {
    return h(Component, {}, <StyledText ranges={ranges} text={text} />);
  } else {
    return (
      <Component block={block as FullBlock}>
        <StyledText ranges={ranges} text={text} />
      </Component>
    );
  }
}

type TextRange = CompositeRange | InlineStyleRange | EntityRange;

function StyledText({
  text,
  ranges,
  characterIndex = 0,
}: {
  text: string;
  ranges: TextRange[];
  characterIndex?: number;
}) {
  const getFeatureForStyle = useGetStyleFeature();
  const getEntity = useGetEntity();
  const getFeatureForEntity = useGetEntityFeature();

  let rangeIndex = 0;
  const children: any[] = [];
  while (rangeIndex < ranges.length) {
    const currentRange = ranges[rangeIndex];
    // The ranges array is sorted, so any chatacters earlier than the offset of the current range are plain
    if (currentRange.offset > characterIndex) {
      // Move plain characters to the "done" pile
      const moveUntil = currentRange.offset - characterIndex;
      children.push(text.slice(0, moveUntil));
      text = text.slice(moveUntil);
      characterIndex += moveUntil;
    }

    // the previous bit should have already corrected for characterIndex/currentRange.offset such that they're always the same
    const rangeText = text.slice(0, currentRange.length);
    text = text.slice(currentRange.length);

    // If there are no overlapping ranges, the recursive call will just return the straight text
    const overlappingRanges = pickUntil(
      ranges.slice(rangeIndex + 1),
      (range) => range.offset > currentRange.offset + currentRange.length
    );
    rangeIndex += overlappingRanges.length + 1;
    const textChildren = (
      <StyledText
        text={rangeText}
        ranges={overlappingRanges}
        characterIndex={characterIndex}
      />
    );
    characterIndex += rangeText.length;

    if ("key" in currentRange) {
      // we're dealing with an entity
      const entity = getEntity(currentRange);
      const Feature = getFeatureForEntity(entity);
      if (typeof Feature === "string")
        children.push(h(Feature, {}, textChildren));
      else
        children.push(
          <Feature data={entity.data} key={"entity" + currentRange.key}>
            {textChildren}
          </Feature>
        );
    } else if ("style" in currentRange) {
      const Feature = getFeatureForStyle(currentRange);
      children.push(
        <Feature key={currentRange.style + characterIndex}>
          {textChildren}
        </Feature>
      );
    } else {
      const Feature = currentRange.component;
      children.push(
        <Feature key={currentRange.compositeKey}>{textChildren}</Feature>
      );
    }
  }
  children.push(text);
  return <>{children}</>;
}

function AtomicBlock({ block }: { block: FullBlock }) {
  const getEntity = useGetEntity();
  const getFeatureForEntity = useGetEntityFeature();

  const entityRange = block.entityRanges![0];
  if (typeof entityRange === "undefined")
    throw new Error("weird entity shenanigans");
  const entity = getEntity(entityRange);

  const Feature = getFeatureForEntity(entity);
  if (!Feature) return <p>unknown entity type</p>;

  if (typeof Feature === "string") {
    return (
      <>
        <Feature />
        {block.text}
      </>
    );
  } else {
    return (
      <>
        <Feature data={entity.data} />
        {block.text}
      </>
    );
  }
}

function getBlockDepth(block: Block | { text: string }) {
  if ("depth" in block) return block.depth ?? 0;
  else return 0;
}

/**
 * THIS FUNCTION MUTATES THE FROM ARRAY
 * @param from Array from which elements are removed
 * @param count Amount of characters to transfer
 */
function pullCharacters(from: any[], count: number) {
  const result = [];
  while (count > 0) {
    if (from.length === 0) break; //should maybe throw an error here?

    const currentEl = from.shift();

    // If it's a <br /> element just move it - TODO test if incrementing the count is actually correct and if this code ever runs
    if (typeof currentEl !== "string") {
      result.push(currentEl);
      // 2 chars = \n
      count -= 2;
      continue;
    }

    // If this string is more characters than are left to move:
    if (currentEl.length > count) {
      // 1. move the correct # of chars to the 'result' array
      result.push(currentEl.substring(0, count));
      // 2. place the remaining characters at the front of the "from" array
      from.unshift(currentEl.substring(count));
      return result;
    }

    result.push(currentEl);
    count -= currentEl.length;
  }
  return result;
}

function pickUntil<T>(ary: T[], predicate: (item: T) => boolean) {
  const firstCorrect = ary.findIndex((item) => predicate(item));
  if (firstCorrect === -1) return ary.slice(0);
  return ary.slice(0, firstCorrect);
}
