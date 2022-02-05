import { FullBlock } from './types';

type BlockComponent = React.FC<{ block: FullBlock }>;
export interface WrappedBlockFeature {
  wrapperElement: React.FC<{ depth: number }> | string;
  contentElement: BlockComponent | string;
}

export type BlockFeature = WrappedBlockFeature | string | BlockComponent;

export const blockFeatures: { [key: string]: BlockFeature } = {
  unstyled: 'p',
  ['ordered-list-item']: {
    wrapperElement: 'ol',
    contentElement: 'li',
  },
  ['unordered-list-item']: {
    wrapperElement: 'ul',
    contentElement: 'li',
  },
  ['header-one']: 'h1',
  ['header-two']: 'h2',
  ['header-three']: 'h3',
  ['header-four']: 'h4',
  ['header-five']: 'h5',
  ['header-six']: 'h6',
  blockquote: 'blockquote',
  pre: 'pre',
  ['code-block']: ({ children }) => (
    <pre>
      <code>{children}</code>
    </pre>
  ),
  // Below doesn't work in React
  // atomic: ({ children }) => <>{children}</>,
};

export const styleFeatures: { [key: string]: string | React.FC } = {
  BOLD: 'strong',
  CODE: 'code',
  ITALIC: 'em',
  UNDERLINE: 'u',
  STRIKETHROUGH: 's',
  SUPERSCRIPT: 'sup',
  SUBSCRIPT: 'sub',
  MARK: 'mark',
  QUOTATION: 'q',
  SMALL: 'small',
  SAMPLE: 'samp',
  INSERT: 'ins',
  DELETE: 'del',
  KEYBOARD: 'kbd',
};

export type Entity = string | React.FC<{ data: any }>;

export const entityFeatures: { [type: string]: Entity } = {
  HORIZONTAL_RULE: 'hr',
  IMAGE: ImageComponent,
  LINK: LinkComponent,
  EMBED: EmbedComponent,
};

interface ImageProps {
  id: string;
  src: string;
  alt: string;
  format: 'fullwidth'; // TODO: There are other types
}

function ImageComponent({ data }: { data: ImageProps }) {
  return (
    <img
      className={`image image__${data.format}`}
      src={data.src}
      alt={data.alt}
    />
  );
}

function LinkComponent({ data, ...rest }: { data: { url: string } }) {
  return <a href={data.url} {...rest} />;
}

function EmbedComponent({ data, ...rest }: { data: { html: string } }) {
  if (!data.html) return null;
  // return <p>Embed suppressed because console errors are annoying</p>;
  return <div {...rest} dangerouslySetInnerHTML={{ __html: data.html }} />;
}

export const defaultFeatures = {
  blocks: blockFeatures,
  styles: styleFeatures,
  entities: entityFeatures,
};
