// Buggy variants of matchGuess. Your properties should pass on the real
// implementation and fail on every one of these. Write your properties from
// the *specification*, not from this file: after the deadline you'll get
// more mutants to try your properties against.
import type { Color } from './matchGuess';

type MatchGuess = (secret: string, guess: string) => Color[];

const counts = (s: string) => {
  const m = new Map<string, number>();
  for (const c of s) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
};

export const mutants: Record<string, MatchGuess> = {
  // Always answers "nothing matches".
  allBlack: () => ['B', 'B', 'B', 'B', 'B'],

  // Never reports yellows.
  greensOnly: (secret, guess) =>
    [...guess].map((c, i): Color => (c === secret[i] ? 'G' : 'B')),

  // Yellow whenever the letter appears anywhere in the secret, ignoring how
  // many times it appears.
  ignoresCounts: (secret, guess) =>
    [...guess].map((c, i): Color =>
      c === secret[i] ? 'G' : secret.includes(c) ? 'Y' : 'B'),

  // One left-to-right pass: an early yellow can use up the letter that a
  // later green needed.
  singlePass: (secret, guess) => {
    const left = counts(secret);
    return [...guess].map((c, i): Color => {
      const n = left.get(c) ?? 0;
      if (c === secret[i]) { left.set(c, n - 1); return 'G'; }
      if (n > 0) { left.set(c, n - 1); return 'Y'; }
      return 'B';
    });
  },//secret === "ACAAA", guess === "CCAAA", single pass returns "YGGGG", should be "BGGGG"

  // Arguments mixed up somewhere in the call chain.
  swapped: (secret, guess) => {
    const result: Color[] = ['B', 'B', 'B', 'B', 'B'];
    const [s, g] = [guess, secret];
    const unused = new Map<string, number>();
    for (let i = 0; i < 5; i++) {
      if (g[i] === s[i]) result[i] = 'G';
      else unused.set(s[i], (unused.get(s[i]) ?? 0) + 1);
    }
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'G') continue;
      const n = unused.get(g[i]) ?? 0;
      if (n > 0) { result[i] = 'Y'; unused.set(g[i], n - 1); }
    }
    return result;
  },
};
