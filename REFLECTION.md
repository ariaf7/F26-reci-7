# Reflection

**Name / Andrew ID:**
Arianne Fels (afels)

**Recitation group members (Task 2):**
Inseo Kim
---

### 1. Valid but weak
matchGuess returning exactly five colors. The correct implementation will always return exactly five colors, but that does not tell us at all which colors it returns. An implementation that returns all greens no matter what would pass. However, if you only had four colors (i.e an implementation that only checks the first 4 letters) that would fail.

### 2. A generator problem, not a property problem
The generator for matchGuess that used the whole alphabet rarely got repeating letters. So the singlePass test was flakey, and only failed if we got a very specific input. (i.e AAAAR and AAARR). We fixed it by also having inputs taken from a very small alphabet (ABC).

Before:
~ singlePass     flaky: killed in 4/5 runs  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAAAR","AAARR"]
      AssertionError: expected 2 to be less than or equal to 1
Mutation score: 3/5 killed (60%)

After:

✔ singlePass     killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["ACAAA","CCAAA"]
      AssertionError: expected 2 to be less than or equal to 1
Mutation score: 4/5 killed (80%)


### 3. Reading a counterexample
ignoresCounts  killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AABAA","AAABB"]
      AssertionError: expected 2 to be less than or equal to 1

Only one yellow for each letter is allowed to be credited, and they are credited left to right. This counter example has a guess word with two Bs in the wrong spot, where only the first B should get a yellow. However the mutant credits both of them.

### 4. Your project
I worked on the bookmark feature for responses. When there are two different TUI sessions opened, there can be multiple different bookmarks being added. Whichever session actually saves first, the final bookmark list contains everything from both sessions. This is metamorphic because saving session A first then session B should give the same bookmark output as session B saving first then session A. And duplicated messages should only show up once. For the generator, you would want a bookmark file (can be empty) and two lists of bookmarks. The problem with this would be that with random message IDs, we would rarely get the edge case where both sessions bookmarked the same message. So it would be good to have a small pool of messages to choose from for some of the tests, to get duplicates. 

Another thing I worked on was when a bookmark is saved, the title of the bookmark is a truncation of the original message title. There is a limit to the truncation, and since emojis are multiple characters, if it hits the truncation limit the emoji gets removed, not "cut in half". So a property is the result is a prefix of the original. This is an invariant. The generator would generate a bunch of strings to truncate based on the limit used. But this would unlikely generate emojis, which can't be cut. So we would want to have another generator that also generates specifically emojis, to make sure some generated strings have those.

 Once something is bookmarked, you want another function to remove bookmark. The property would be "bookmarked responses can be removed from bookmarks"  The pattern would be algebraic (round trip)