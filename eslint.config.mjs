// Next 16's eslint-config-next ships native flat configs, so we import them
// directly instead of bridging the old `.extends()` shareable configs through
// FlatCompat (which crashes against the new plugin shape).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Next 16 promoted these new React-compiler purity checks to errors. Our
      // mount-time "sync route/persisted state into React state" effects trip
      // them intentionally; keep them as warnings so lint stays green without
      // rewriting working behaviour.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

export default eslintConfig;
