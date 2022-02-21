import testCases from "./test_exports.json";
import ReactDOMServer from "react-dom/server";
import RichText from "./components/RichText2";

describe("Tests from draftjs_exporter", () => {
  for (let testCase of testCases) {
    it(testCase.label, () => {
      expect(
        ReactDOMServer.renderToStaticMarkup(
          <RichText data={testCase.content_state as any} />
        )
      ).toMatch(testCase.output.string);
    });
  }
});
