/* The Layout in de: the shared Kalio base, the words kept from Bakini and the Layout's own, with the skin's words on top; one chunk. */
import base from "./base/de";
import bakini from "./bakini.de";
import own from "./ly.de";
import wt from "./wt.de";
import { withSkinWords } from "../../ly/ly-words";

export default withSkinWords({ ...base, ...bakini, ...own, ...wt }, "de") as Record<string, string>;
