import { WrappedBlockFeature, defaultFeatures } from './features';
import {
  createContext,
  createElement as h,
  useCallback,
  useContext,
} from 'react';

interface EntityRange {
  key: number;
  offset: number;
  length: number;
}

interface InlineStyleRange {
  offset: number;
  length: number;
  style: string;
}

interface Block {
  depth?: number;
  entityRanges?: EntityRange[];
  inlineStyleRanges?: InlineStyleRange[];
  key: string;
  text: string;
  type: string;
}

interface Entity {
  // mutability: 'MUTABLE' | 'IMMUTABLE';
  mutability: string; // we don't use this anyway
  type: string;
  data: any;
}

interface EntityMap {
  [key: number]: Entity;
}

interface Props {
  data: {
    blocks: (Block | { text: string })[];
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

    if (!('key' in currentBlock)) {
      result.push(
        <BlockComponent
          key={index}
          block={{ ...currentBlock, type: 'unstyled', key: index.toString() }}
        />,
      );
      index += 1;
      continue;
    }

    if (currentBlock.type === 'atomic') {
      result.push(<AtomicBlock key={currentBlock.key} block={currentBlock} />);
      index += 1;
      continue;
    }

    const blockFeature = features.blocks[currentBlock.type];

    // When there's no wrapper/nesting to worry about, just render the block
    if (
      typeof blockFeature === 'function' ||
      typeof blockFeature === 'string' ||
      typeof blockFeature === 'undefined'
    ) {
      result.push(
        <BlockComponent key={currentBlock.key} block={currentBlock} />,
      );
      index += 1;
      continue;
    }

    if ('wrapperElement' in blockFeature) {
      // Grab all elements wrapped in the same list
      const listElements = pickUntil(
        // Safe to ignore elements that are just text because those (by definition) aren't part of lists
        blocks.slice(index) as Block[],
        (block) =>
          block.type !== currentBlock.type && getBlockDepth(block) === 0,
      );

      result.push(
        <WrappedBlockComponent
          blocks={listElements}
          feature={blockFeature}
          key={currentBlock.key}
        />,
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
  return useCallback((block: Block) => features[block.type], [features]);
}

function useGetStyleFeature() {
  const features = useContext(context).features.styles;
  return useCallback(
    (style: InlineStyleRange) => features[style.style],
    [features],
  );
}

function useGetEntity() {
  const entityMap = useContext(context).entityMap;
  return useCallback(
    (entityRange: EntityRange) => entityMap[entityRange.key],
    [entityMap],
  );
}

function useGetEntityFeature() {
  const features = useContext(context).features.entities;
  return useCallback((entity: Entity) => features[entity.type], [features]);
}

function WrappedBlockComponent({
  blocks,
  feature: { wrapperElement: Wrapper },
  depth = 0,
}: {
  blocks: Block[];
  feature: WrappedBlockFeature;
  depth?: number;
}) {
  const getFeatureForBlock = useGetBlockFeature();

  const result: any = [];
  let index = 0;

  while (index < blocks.length) {
    const currentBlock = blocks[index];
    const currentFeature = getFeatureForBlock(currentBlock);
    if (typeof currentFeature !== 'object')
      throw new Error('unknown or incorrect feature in WrappedBlockComponent');
    if (getBlockDepth(currentBlock) === depth) {
      result.push(
        <BlockComponent key={currentBlock.key} block={currentBlock} />,
      );
      index += 1;
    } else {
      const subList = pickUntil(
        blocks.slice(index),
        (block) =>
          getBlockDepth(block) === depth || block.type !== currentBlock.type,
      );
      result.push(
        <WrappedBlockComponent
          blocks={subList}
          feature={currentFeature}
          depth={depth + 1}
          key={currentBlock.key}
        />,
      );
      index += subList.length;
    }
  }

  return <Wrapper>{result}</Wrapper>;
}

function BlockComponent({ block }: { block: Block }) {
  const getFeatureForBlock = useGetBlockFeature();
  const getFeatureForStyle = useGetStyleFeature();
  const getEntity = useGetEntity();
  const getFeatureForEntity = useGetEntityFeature();
  const feature = getFeatureForBlock(block) ?? 'div';

  const BlockComponentType =
    typeof feature === 'string' || typeof feature === 'function'
      ? feature
      : feature.contentElement;

  const content = block.text.split('\n');
  const contentWithBreaks = content
    .flatMap((x, index) => [x, <br key={index} />])
    .slice(0, -1);

  const styles = [
    ...(block.inlineStyleRanges ?? []),
    ...(block.entityRanges ?? []),
  ].sort((a, b) => (a.offset > b.offset ? 1 : -1));
  const contentWithBreaksAndStyles: any[] = [];

  if (styles) {
    let characterIndex = 0;
    let styleIndex = 0;
    while (styleIndex < styles.length) {
      const style = styles[styleIndex];

      if (style.offset > characterIndex) {
        // Move unstyled characters to the "done" pile
        contentWithBreaksAndStyles.push(
          pullCharacters(contentWithBreaks, style.offset - characterIndex),
        );
        characterIndex = style.offset;
      }

      const textToStyle = pullCharacters(contentWithBreaks, style.length);
      characterIndex += style.length;

      const overlappingStyles = styles
        .slice(styleIndex + 1)
        .filter(
          (otherStyle) => otherStyle.offset < style.offset + style.length,
        );
      if (overlappingStyles.length) {
        // We have multiple overlapping styles!
        // add the style element to the front of the array of styles
        overlappingStyles.unshift(style);
        // wrap the styles around each other
        contentWithBreaksAndStyles.push(
          overlappingStyles.reduce((result, style) => {
            if ('style' in style) {
              const StyleFeature = getFeatureForStyle(style) ?? 'span';
              return (
                <StyleFeature key={style.offset + style.style}>
                  {result}
                </StyleFeature>
              );
            } else {
              const entity = getEntity(style);
              const EntityFeature = getFeatureForEntity(entity) ?? 'span';
              if (typeof EntityFeature === 'string') {
                contentWithBreaksAndStyles.push(
                  h(
                    EntityFeature,
                    { key: entity.type + style.key },
                    textToStyle,
                  ), // why can I not typescript this correctly
                );
              } else {
                return (
                  <EntityFeature
                    key={entity.type + style.key}
                    data={entity.data}
                  >
                    {result}
                  </EntityFeature>
                );
              }
            }
          }, textToStyle as any),
        );
        styleIndex += overlappingStyles.length;
      } else {
        if ('style' in style) {
          const StyleFeature = getFeatureForStyle(style) ?? 'span';
          contentWithBreaksAndStyles.push(
            <StyleFeature key={style.offset + style.style}>
              {textToStyle}
            </StyleFeature>,
          );
        } else {
          const entity = getEntity(style);
          const EntityFeature = getFeatureForEntity(entity) ?? 'span';
          if (typeof EntityFeature === 'string') {
            contentWithBreaksAndStyles.push(
              h(EntityFeature, { key: entity.type + style.key }, textToStyle), // why can I not typescript this correctly
            );
          } else {
            contentWithBreaksAndStyles.push(
              <EntityFeature key={entity.type + style.key} data={entity.data}>
                {textToStyle}
              </EntityFeature>,
            );
          }
        }
        styleIndex += 1;
      }
    }
    contentWithBreaksAndStyles.push(contentWithBreaks);
  }
  return (
    <BlockComponentType>
      {styles.length ? contentWithBreaksAndStyles : contentWithBreaks}
    </BlockComponentType>
  );
}

function AtomicBlock({ block }: { block: Block }) {
  const getEntity = useGetEntity();
  const getFeatureForEntity = useGetEntityFeature();

  const entityRange = block.entityRanges![0];
  if (typeof entityRange === 'undefined')
    throw new Error('weird entity shenanigans');
  const entity = getEntity(entityRange);

  const Feature = getFeatureForEntity(entity);
  if (!Feature) return <p>unknown entity type</p>;

  if (typeof Feature === 'string') {
    return <Feature />;
  } else {
    return <Feature data={entity.data} />;
  }
}

function getBlockDepth(block: Block | { text: string }) {
  if ('depth' in block) return block.depth ?? 0;
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
    if (typeof currentEl !== 'string') {
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
