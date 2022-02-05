import RichText from '../components/RichText';
import { defaultFeatures } from '../components/RichText/features';
import { contentState } from '../example';

export default function Page() {
  return <RichText data={contentState} features={features} />;
}

const features: typeof defaultFeatures = {
  ...defaultFeatures,
  styles: {
    ...defaultFeatures.styles,
    KBD: 'kbd',
    HIGHLIGHT: (props) => (
      <strong style={{ textDecoration: 'underline' }} {...props} />
    ),
  },
  blocks: {
    ...defaultFeatures.blocks,
    blockquote: ({ block, ...rest }) => (
      <blockquote {...rest} cite={block.data.cite} />
    ),
    ['unordered-list-item']: {
      wrapperElement: ({ depth, ...rest }) => (
        <ul className={`list--depth-${depth}`} {...rest} />
      ),
      contentElement: ({ block, ...rest }) => (
        <li className={`list-item--depth-${block.depth}`} {...rest} />
      ),
    },
    ['ordered-list-item']: {
      wrapperElement: ({ depth, ...rest }) => (
        <ul className={`bullet-list`} {...rest} />
      ),
      contentElement: 'li',
    },
    ['example-delete']: () => null,
    ['example-discard']: ({ children }) => <>{children}</>,
  },
  entities: {
    ...defaultFeatures.entities,
    EMBED: () => null,
    IMAGE: ({ data, ...rest }) => <img {...data} {...rest} />,
  },
};
