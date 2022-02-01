export type SimpleBlockFeature = string | React.FC;
export interface WrappedBlockFeature {
  wrapperElement: React.FC | string;
  contentElement: React.FC | string;
}

export type BlockFeature = WrappedBlockFeature | SimpleBlockFeature;

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
