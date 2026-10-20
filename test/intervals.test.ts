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

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc.integer().chain(start => fc.integer({min: start}).map(end => [start, end] as Interval),);
const intervalList = fc.array(interval);

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
  it.todo('the input array remains the same after running mergeIntervals ')
  // Pattern: invariant. The output covers exactly the same points as the input.
  it.todo('input and output cover exactly the same points')
  // Pattern: invariant. The output is sorted and consecutive intervals neither overlap nor touch.
  it.todo('for every i, out[i][1] < out[i+1][0]')
  // Pattern: metamorphic. Reordering the input does not change the output.
  it.todo('every input with the same intervals in any order produces the same output ')
  // Pattern: metamorphic. Adding a duplicate of an input interval does not change the output
  it.todo('same inputs, except one has duplicates produces same output')
  // Pattern: algebraic. Merging an already-merged result changes nothing (idempotence).
  it.todo('running mergeIntervals twice produces the same output ')
  // Pattern: conditional. If the input is already sorted and disjoint, the output equals the input.
  it.todo('already-disjoint input comes back unchanged')
  // Pattern: conditional. If any interval has start > end or a non-integer endpoint, it throws a RangeError.
  it.todo('illegal input produces correct error')
  // Pattern: differential. Counting covered stretches point by point gives the same number as the length of mergeIntervals' output.
  it.todo('the number of covered stretches found by scanning points equals the number of output intervals')

});
