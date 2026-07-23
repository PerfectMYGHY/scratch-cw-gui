import EventTarget from "../../event-target.js"; /* inserted by pull.js */

export const eventTarget = new EventTarget();

export function disableTabs() {
  eventTarget.dispatchEvent(new CustomEvent("disable"));
}
