import { predicates, objects } from "friendly-words";

function pick(words: string[]) {
  const max = Math.floor(0x100000000 / words.length) * words.length;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= max);
  return words[buf[0] % words.length];
}

const SLOTS = [predicates, predicates, objects];

export const makeSlug = () => SLOTS.map(pick).join("-");


if(import.meta.env.DEV) {
  (window as any).makeSlug = makeSlug;
}