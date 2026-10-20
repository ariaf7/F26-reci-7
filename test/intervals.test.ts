import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Limit end point range to make simpler
const endpoint = fc.integer({ min: -20, max: 20 });
// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(endpoint, fc.nat({ max: 10 }))
  .map(([start, len]) => [start, start + len] as Interval);
const intervalList = fc.array(interval, { maxLength: 12});

const disjointList: fc.Arbitrary<Interval[]> = fc
  .tuple(endpoint, fc.array(fc.tuple(fc.nat({ max: 5 }), fc.integer({ min: 1, max: 4 })), { maxLength: 8 }))
  .map(([first, parts]) => {
    const out: Interval[] = [];
    let cur = first;
    for (const [len, gap] of parts) {
      out.push([cur, cur + len]);
      cur = cur + len + gap;
    }
    return out;
  });

// HELPER ORACLE
/** Is point p covered by some interval in the list? */
const covered = (list: readonly Interval[], p: number): boolean =>
  list.some(([s, e]) => s <= p && p <= e);

const samplePoints = (...lists: (readonly Interval[])[]): number[] => {
  const ends = lists.flat().flat();
  if (ends.length === 0) return [];
  const lo = Math.min(...ends) - 1;
  const hi = Math.max(...ends) + 1;
  const pts: number[] = [];
  for (let p = lo; p <= hi; p += 0.5) pts.push(p);
  return pts;
};
   
/** Count separate covered stretches by scanning points left to right. */
const countStretches = (list: readonly Interval[]): number => {
  let count = 0;
  let prev = false;
  for (const p of samplePoints(list)) {
    const now = covered(list, p);
    if (now && !prev) count++;
    prev = now;
  }
  return count;
};



describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });
  // Pattern: invariant. The input array and the intervals in it are not modified.
  it('the input array remains the same after running mergeIntervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = structuredClone(xs);
        const out = mergeIntervals(xs);
        expect(xs).toEqual(before);
        // Mutating the result must not reach back into the input either.
        for (const iv of out) {
          iv[0] -= 100;
          iv[1] += 100;
        }
        expect(xs).toEqual(before);
      }),
    );
  });
   // Pattern: invariant. The output covers exactly the same points as the input.
  it('input and output cover exactly the same points', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const mismatches = samplePoints(xs, out).filter(p => covered(xs, p) !== covered(out, p));
        expect(mismatches).toEqual([]);
      }),
    );
  });
  // Pattern: invariant. The output is sorted and consecutive intervals neither overlap nor touch.
  it('for every i, out[i][1] < out[i + 1][0]', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });  
  // Pattern: metamorphic. Reordering the input does not change the output.
  it('every input with the same intervals in any order produces the same output', () => {
    fc.assert(
      fc.property(
        intervalList.chain(xs =>
          fc.tuple(fc.constant(xs), fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })),
        ),
        ([xs, shuffled]) => {
          expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });  
  // Pattern: metamorphic. Adding a duplicate of an input interval does not change the output
  it('same inputs, except one has duplicates, produces the same output', () => {
    fc.assert(
      fc.property(
        fc.array(interval, { minLength: 1, maxLength: 12 }).chain(xs =>
          fc.tuple(fc.constant(xs), fc.nat({ max: xs.length - 1 }), fc.nat({ max: xs.length })),
        ),
        ([xs, pick, at]) => {
          const withDup = [...xs];
          withDup.splice(at, 0, [...xs[pick]] as Interval);
          expect(mergeIntervals(withDup)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  }); 
   // Pattern: algebraic. Merging an already-merged result changes nothing (idempotence).
  it('running mergeIntervals twice produces the same output', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });  
  // Pattern: conditional. If the input is already sorted and disjoint, the output equals the input.
  it('already-disjoint input comes back unchanged', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
  // Pattern: conditional. If any interval has start > end or a non-integer endpoint, it throws a RangeError.
  it('illegal input throws a RangeError', () => {
    const badInterval: fc.Arbitrary<Interval> = fc.oneof(
      // start > end
      fc.tuple(endpoint, fc.integer({ min: 1, max: 10 })).map(([e, d]) => [e + d, e] as Interval),
      // non-integer start
      fc.tuple(endpoint, fc.nat({ max: 10 })).map(([s, len]) => [s + 0.5, s + len + 1] as Interval),
      // non-integer end
      fc.tuple(endpoint, fc.nat({ max: 10 })).map(([s, len]) => [s, s + len + 0.5] as Interval),
    );
    fc.assert(
      fc.property(intervalList, badInterval, fc.nat(), (xs, bad, at) => {
        const input = [...xs];
        input.splice(at % (xs.length + 1), 0, bad);
        expect(() => mergeIntervals(input)).toThrow(RangeError);
      }),
    );
  });
    // Pattern: differential. Counting covered stretches point by point gives the same number as the length of mergeIntervals' output.
    it('the number of covered stretches found by scanning points equals the number of output intervals', () => {
      fc.assert(
        fc.property(intervalList, xs => {
          expect(mergeIntervals(xs).length).toBe(countStretches(xs));
        }),
      );
    });
});
