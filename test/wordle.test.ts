import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

//Small anf large alphabet to check duplicate letters, but also all letters
const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));;
const word = fc.oneof(wordFrom('ABC'), wordFrom(ALPHABET));
const pair = fc.oneof(
  fc.tuple(wordFrom('ABC'), wordFrom('ABC')),
  fc.tuple(wordFrom(ALPHABET), wordFrom(ALPHABET)),
  fc.tuple(word, word),
);

//oracles
/** How many times does letter L appear in w? */
const countOf = (w: string, L: string) => [...w].filter(c => c === L).length;
 
/** How many colors in the result are not black? */
const nonBlack = (colors: string[]) => colors.filter(c => c !== 'B').length;
 
describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word,word, (secret, guess) => {
        expect(matchGuess(secret,guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color is G, Y or B.
  it('only uses the colors G, Y, B', () =>{
    fc.assert(
      fc.property(word, word, (secret, guess)=> {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

// Pattern: invariant. No letter is credited more times than the secret contains it.  
it('never credits a letter more times than the secret contains it', ()=>{
    fc.assert(
      fc.property(word, word, (secret, guess)=> {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [... guess].filter((c,i)=> c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c=>c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      }),
    );
  });

   // Pattern: invariant. Position i is green exactly when guess[i] equals secret[i].
   it('greens appear exactly where the letters match', () => {
    fc.assert(
      fc.property(pair, ([secret, guess]) => {
        const result = matchGuess(secret, guess);
        for (let i = 0; i < 5; i++) {
          expect(result[i] === 'G').toBe(guess[i] === secret[i]);
        }
      }),
    );
  });

  // Pattern: invariant. For each letter, yellows go to its leftmost non-green occurrences, so no yellow comes after a black of the same letter.
  it('yellows are assigned left to right', () => {
    fc.assert(
      fc.property(pair, ([secret, guess]) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          let seenBlack = false;
          for (let i = 0; i < 5; i++) {
            if (guess[i] !== letter) continue;
            if (result[i] === 'B') seenBlack = true;
            if (result[i] === 'Y') expect(seenBlack).toBe(false);
          }
        }
      }),
    );
  });

  // Pattern: differential. A letter-counting oracle and matchGuess agree on how many guess letters get credit (green or yellow).
  it('the number of non-black colors equals the sum over letters of min(count in secret, count in guess)', () => {
    fc.assert(
      fc.property(pair, ([secret, guess]) => {
        let expected = 0;
        for (const letter of new Set(guess)) {
          expected += Math.min(countOf(secret, letter), countOf(guess, letter));
        }
        expect(nonBlack(matchGuess(secret, guess))).toBe(expected);
      }),
    );
  });


  // Pattern: algebraic. Swapping secret and guess keeps the same number of greens and the same number of non-black colors.
  it('swapping secret and guess preserves the green and non-black counts', () => {
    fc.assert(
      fc.property(pair, ([a, b]) => {
        const ab = matchGuess(a, b);
        const ba = matchGuess(b, a);
        expect(ba.filter(c => c === 'G').length).toBe(ab.filter(c => c === 'G').length);
        expect(nonBlack(ba)).toBe(nonBlack(ab));
      }),
    );
  });


  // Pattern: metamorphic. Renaming letters consistently in both words (any one-to-one relabeling of the alphabet) does not change the colors.
  it('consistently relabeling letters gives the same colors', () => {
    fc.assert(
      fc.property(
        pair,
        fc.shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 }),
        ([secret, guess], perm) => {
          const rename = (w: string) => [...w].map(c => perm[ALPHABET.indexOf(c)]).join('');
          expect(matchGuess(rename(secret), rename(guess))).toEqual(matchGuess(secret, guess));
        },
      ),
    );
  });
 

  // Pattern: conditional. If the guess is the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: conditional. If secret and guess share no letters, every color is black.
  it('words with no letters in common give all blacks', () => {
    // Targeted generator: split a shuffled alphabet into two disjoint halves
    // and build one word from each, so they can never share a letter.
    const disjointPair = fc
      .shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 })
      .chain(letters => {
        const cut = 13;
        return fc.tuple(wordFrom(letters.slice(0, cut).join('')), wordFrom(letters.slice(cut).join('')));
      });
    fc.assert(
      fc.property(disjointPair, ([secret, guess]) => {
        expect(matchGuess(secret, guess)).toEqual(['B', 'B', 'B', 'B', 'B']);
      }),
    );
  });

  // Pattern: conditional. If either word is not exactly five uppercase letters A-Z, it throws a RangeError.
  it('invalid words throw a RangeError', () => {
    const notUpper = fc.constantFrom(...'abcxyz019 @[`!-'.split(''));
    const badWord = fc.oneof(
      // wrong length, still uppercase letters
      fc.array(fc.constantFrom(...ALPHABET), { maxLength: 4 }).map(cs => cs.join('')),
      fc.array(fc.constantFrom(...ALPHABET), { minLength: 6, maxLength: 8 }).map(cs => cs.join('')),
      // right length, one bad character at some position
      fc.tuple(wordFrom(ALPHABET), notUpper, fc.nat({ max: 4 })).map(
        ([w, c, i]) => w.slice(0, i) + c + w.slice(i + 1),
      ),
    );
    fc.assert(
      fc.property(word, badWord, fc.boolean(), (good, bad, badIsSecret) => {
        const [secret, guess] = badIsSecret ? [bad, good] : [good, bad];
        expect(() => matchGuess(secret, guess)).toThrow(RangeError);
      }),
    );
  });

});