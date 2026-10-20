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

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string)=>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5}).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);
// const word = 

describe('matchGuess', () => {
  //Pattern: Invariant, always returns 5 colors
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word,word, (secret, guess) => {
        expect(matchGuess(secret,guess)).toHaveLength(5);
      }),
    );
  });

  //Pattern: Invariant, every color is G, Y, B
  it('only uses the colors G, Y, B', () =>{
    fc.assert(
      fc.property(word, word, (secret, guess)=> {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  //Pattern: Conditional, if the guess is secret, all green
  it('guessing the secret gives all greens', ()=> {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w,w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  //Pattern: Invariant, no letter shows up more times than it shows up in secret
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
});
