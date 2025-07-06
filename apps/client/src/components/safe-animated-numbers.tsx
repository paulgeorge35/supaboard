import { ComponentType } from "react";
import * as Imported from "react-animated-numbers";

const SafeAnimatedNumbers = (() => {
  if (typeof Imported === "function") return Imported;
  if (typeof Imported.default === "function") return Imported.default;
  console.warn("react-animated-numbers did not export a component as expected");
  return (() => null) as ComponentType<any>;
})();

export default SafeAnimatedNumbers;
