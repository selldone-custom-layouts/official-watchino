/* The Layout in es: the shared Kalio base, the words kept from Bakini and the Layout's own, with the skin's words on top; one chunk. */
import base from "./base/es";
import bakini from "./bakini.es";
import own from "./ly.es";
import wt from "./wt.es";
import { withSkinWords } from "../../ly/ly-words";

export default withSkinWords({ ...base, ...bakini, ...own, ...wt }, "es") as Record<string, string>;
