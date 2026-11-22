/* The Layout in fr: the shared Kalio base, the words kept from Bakini and the Layout's own, with the skin's words on top; one chunk. */
import base from "./base/fr";
import bakini from "./bakini.fr";
import own from "./ly.fr";
import wt from "./wt.fr";
import { withSkinWords } from "../../ly/ly-words";

export default withSkinWords({ ...base, ...bakini, ...own, ...wt }, "fr") as Record<string, string>;
