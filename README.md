# arcade-core

Pure JavaScript 2048 game logic. The package does not use Svelte, the DOM, or browser APIs. Boards are 4 by 4 arrays of non-negative integers; `0` means an empty square.

## Install

After publishing under your npm account scope, install it with:

```sh
npm install @yourname/arcade-core
```

## Use

```js
import { move, spawn, hasMoves, canMove } from '@yourname/arcade-core';

const board = [
  [2, 2, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

const moved = move(board, 'left');
// moved[0] is [4, 0, 0, 0]; board is unchanged.

const next = spawn(moved); // adds a 2 or 4 to an empty square
const valid = canMove(next, 'down');
const gameContinues = hasMoves(next);
```

`move(board, direction)` returns a new board. Valid directions are `up`, `right`, `down`, and `left`. Equal adjacent tiles merge once per move: `[2, 2, 2, 2]` becomes `[4, 4, 0, 0]` when moved left.

`spawn(board, rng)` accepts an optional random number generator for repeatable games. It is called twice and must return values in `[0, 1)`: once to choose an empty square and once to choose the tile (90% chance of 2, 10% chance of 4). A full board is returned as a copy without calling the generator.

## Development

The package has no runtime dependencies. Import `src/index.js` directly while developing.
