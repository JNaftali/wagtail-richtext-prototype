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
    HIGHLIGHT: 'strong',
  },
};
