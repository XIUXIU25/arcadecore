import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	FLEET,
	createRandomBoard,
	getSunkShips,
	isGameComplete,
	isValidShot,
	updateBoard
} from '../src/index.js';

function seeded(seed) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

test('createRandomBoard places the whole fleet legally', () => {
	for (let seed = 1; seed <= 200; seed += 1) {
		const board = createRandomBoard(seeded(seed));
		assert.deepEqual(
			board.ships.map((s) => [s.name, s.size]),
			FLEET.map((s) => [s.name, s.size])
		);
		const seen = new Set();
		for (const ship of board.ships) {
			assert.equal(ship.cells.length, ship.size);
			const xs = new Set(ship.cells.map(([x]) => x));
			const ys = new Set(ship.cells.map(([, y]) => y));
			assert.ok(xs.size === 1 || ys.size === 1);
			for (const [x, y] of ship.cells) {
				assert.ok(x >= 0 && x < 10 && y >= 0 && y < 10);
				assert.ok(!seen.has(`${x},${y}`));
				seen.add(`${x},${y}`);
			}
		}
		assert.equal(seen.size, 17);
	}
});

test('createRandomBoard gives up on a degenerate random', () => {
	assert.throws(() => createRandomBoard(() => 0), /could not place/);
});

test('isValidShot rejects repeats and off-board squares', () => {
	const board = createRandomBoard(seeded(3));
	assert.equal(isValidShot(board, 0, 0), true);
	assert.equal(isValidShot(board, 10, 0), false);
	assert.equal(isValidShot(board, -1, 0), false);
	assert.equal(isValidShot(board, 1.5, 0), false);
	assert.equal(isValidShot(updateBoard(board, 0, 0), 0, 0), false);
});

test('updateBoard returns a new board and records hit or miss', () => {
	const board = createRandomBoard(seeded(4));
	const [x, y] = board.ships[0].cells[0];
	const after = updateBoard(board, x, y);
	assert.notEqual(after, board);
	assert.equal(board.shots.length, 0);
	assert.deepEqual(after.shots, [{ x, y, hit: true }]);
	assert.throws(() => updateBoard(after, x, y), RangeError);
});

test('sinking every ship completes the game', () => {
	let board = createRandomBoard(seeded(5));
	assert.equal(isGameComplete(board), false);
	const [first, ...rest] = board.ships;
	for (const [x, y] of first.cells) board = updateBoard(board, x, y);
	assert.deepEqual(getSunkShips(board).map((s) => s.name), [first.name]);
	assert.equal(isGameComplete(board), false);
	for (const ship of rest) for (const [x, y] of ship.cells) board = updateBoard(board, x, y);
	assert.equal(isGameComplete(board), true);
});
