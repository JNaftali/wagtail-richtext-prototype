export type SimpleFeature = string | React.FC;
export interface WrappedBlockFeature {
  wrapperElement: React.FC | string;
  contentElement: React.FC | string;
}

export type BlockFeature = WrappedBlockFeature | SimpleFeature;

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
};

export const styleFeatures: { [key: string]: SimpleFeature } = {
  BOLD: 'strong',
  ITALIC: 'em',
  SUPERSCRIPT: 'sup',
  SUBSCRIPT: 'sub',
  STRIKETHROUGH: 's',
  CODE: 'code',
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
  return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
}
