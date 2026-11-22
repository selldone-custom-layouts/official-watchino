/* The Layout in Arabic: the shared Kalio base, the words kept from Bakini and the Layout's own, with the skin's Arabic words on top; one chunk. */
import base from "./base/ar";
import bakini from "./bakini.ar";
import own from "./ly.ar";
import { withSkinWords } from "../../ly/ly-words";

export default withSkinWords({ ...base, ...bakini, ...own }, "ar") as Record<string, string>;
