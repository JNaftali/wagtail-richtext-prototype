import { blockFeatures, WrappedBlockFeature, styleFeatures } from './features';

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
  inlineStyleRanges: InlineStyleRange[];
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
  const feature = getFeatureForBlock(block) ?? 'p';

  const BlockComponentType =
    typeof feature === 'string' || typeof feature === 'function'
      ? feature
      : feature.contentElement;

  const content = block.text.split('\n');
  const contentWithBreaks = content
    .flatMap((x, index) => [x, <br key={index} />])
    .slice(0, -1);

  const styles = block.inlineStyleRanges;
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
            const StyleFeature = getFeatureForStyle(style) ?? 'span';
            return (
              <StyleFeature key={style.offset + style.style}>
                {result}
              </StyleFeature>
            );
          }, textToStyle as any),
        );
        styleIndex += overlappingStyles.length;
        console.log(
          characterIndex,
          style,
          contentWithBreaks,
          contentWithBreaksAndStyles,
        );
      } else {
        const StyleFeature = getFeatureForStyle(style) ?? 'span';
        contentWithBreaksAndStyles.push(
          <StyleFeature key={style.offset + style.style}>
            {textToStyle}
          </StyleFeature>,
        );
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

function getFeatureForBlock(block: Block) {
  return blockFeatures[block.type];
}

function getFeatureForStyle(style: InlineStyleRange) {
  return styleFeatures[style.style];
}

function pickUntil<T>(ary: T[], predicate: (item: T) => boolean) {
  const firstCorrect = ary.findIndex((item) => predicate(item));
  return ary.slice(0, firstCorrect);
}
