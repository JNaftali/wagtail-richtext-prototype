import { blockFeatures, WrappedBlockFeature } from './features';

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
  depth: number;
  entityRanges: EntityRange[];
  inlineStyleRange: InlineStyleRange[];
  key: string;
  text: string;
  type: string;
}

interface Entity {
  mutability: 'MUTABLE' | 'IMMUTABLE';
  type: string;
  data: any;
}

interface Props {
  data: {
    blocks: Block[];
    entityMap: { [key: number]: Entity };
  };
}

export default function RichText({ data }: Props) {
  // result will be a (possible nested) array of jsx elements but I neither know nor care how to type that
  const result: any = [];
  const { blocks, entityMap } = data;
  const totalBlocks = blocks.length;
  let index = 0;
  while (index < totalBlocks) {
    const currentBlock = blocks[index];
    const blockFeature = blockFeatures[currentBlock.type];

    if (!blockFeature) {
      result.push(<p key={index}>unimplemented</p>);
      index += 1;
      continue;
    }

    // When there's no wrapper/nesting to worry about, just render the block
    if (
      typeof blockFeature === 'function' ||
      typeof blockFeature === 'string'
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
        blocks.slice(index),
        (block) => block.type !== currentBlock.type && block.depth === 0,
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

  return result.flat(Infinity);
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
  const result: any = [];
  let index = 0;

  while (index < blocks.length) {
    const currentBlock = blocks[index];
    const currentFeature = getFeatureForBlock(currentBlock);
    if (typeof currentFeature !== 'object')
      throw new Error('unknown or incorrect feature in WrappedBlockComponent');
    if (currentBlock.depth === depth) {
      result.push(
        <BlockComponent key={currentBlock.key} block={currentBlock} />,
      );
      index += 1;
    } else {
      const subList = pickUntil(
        blocks.slice(index),
        (block) => block.depth === depth || block.type !== currentBlock.type,
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
  const feature = getFeatureForBlock(block);

  if (!feature)
    throw new Error('unimplemented feature passed to BlockComponent');

  const Feature =
    typeof feature === 'string' || typeof feature === 'function'
      ? feature
      : feature.contentElement;

  return <Feature>{block.text}</Feature>;
}

function getFeatureForBlock(block: Block) {
  return blockFeatures[block.type];
}

function pickUntil<T>(ary: T[], predicate: (item: T) => boolean) {
  const firstCorrect = ary.findIndex((item) => predicate(item));
  return ary.slice(0, firstCorrect);
}
