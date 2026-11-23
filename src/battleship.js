/**
 * Pure Battleship rules. No framework, Node or browser APIs.
 *
 * A board is a plain, JSON-serialisable object:
 *   {
 *     size: 10,
 *     ships: [{ name: 'carrier', size: 5, cells: [[x, y], ...] }, ...],
 *     shots: [{ x, y, hit }, ...]
 *   }
 *
 * `x` is the column and `y` is the row, both 0-based. A board with an empty
 * `ships` list is valid and is how a client represents an opponent's board
 * whose fleet is hidden: isValidShot and updateBoard-free reads still work.
 */

export const BOARD_SIZE = 10;

export const FLEET = [
	{ name: 'carrier', size: 5 },
	{ name: 'battleship', size: 4 },
	{ name: 'cruiser', size: 3 },
	{ name: 'submarine', size: 3 },
	{ name: 'destroyer', size: 2 }
];

const MAX_SHIP_ATTEMPTS = 500;
const MAX_BOARD_ATTEMPTS = 50;

function validateBoard(board) {
	if (
		board === null ||
		typeof board !== 'object' ||
		!Number.isInteger(board.size) ||
		board.size < 1 ||
		!Array.isArray(board.ships) ||
		!Array.isArray(board.shots)
	) {
		throw new TypeError('board must be an object with size, ships and shots');
	}
}

function isOnBoard(board, x, y) {
	return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < board.size && y < board.size;
}

function roll(random, limit) {
	const value = random();
	if (!Number.isFinite(value) || value < 0 || value >= 1) {
		throw new RangeError('random must return a number in [0, 1)');
	}
	return Math.floor(value * limit);
}

/** Return true when (x, y) is on the board and has not been fired at yet. */
export function isValidShot(board, x, y) {
	validateBoard(board);
	if (!isOnBoard(board, x, y)) return false;
	return !board.shots.some((shot) => shot.x === x && shot.y === y);
}

/** Return the ship covering (x, y), or undefined. */
export function shipAt(board, x, y) {
	validateBoard(board);
	return board.ships.find((ship) => ship.cells.some(([cx, cy]) => cx === x && cy === y));
}

/** Return a NEW board with a shot at (x, y) recorded as a hit or a miss. */
export function updateBoard(board, x, y) {
	if (!isValidShot(board, x, y)) {
		throw new RangeError(`(${x}, ${y}) is not a valid shot on this board`);
	}
	const hit = shipAt(board, x, y) !== undefined;
	return {
		...board,
		ships: board.ships.map((ship) => ({ ...ship, cells: ship.cells.map((cell) => [...cell]) })),
		shots: [...board.shots.map((shot) => ({ ...shot })), { x, y, hit }]
	};
}

/** Return the ships whose every cell has been hit. */
export function getSunkShips(board) {
	validateBoard(board);
	return board.ships.filter((ship) =>
		ship.cells.every(([x, y]) => board.shots.some((shot) => shot.hit && shot.x === x && shot.y === y))
	);
}

/** Return true when the board has ships and none remain afloat. */
export function isGameComplete(board) {
	validateBoard(board);
	return board.ships.length > 0 && getSunkShips(board).length === board.ships.length;
}

function shipCells(x, y, length, horizontal) {
	return Array.from({ length }, (_, index) => (horizontal ? [x + index, y] : [x, y + index]));
}

function tryPlaceFleet(random) {
	const taken = new Set();
	const ships = [];
	for (const { name, size } of FLEET) {
		let placed = false;
		for (let attempt = 0; attempt < MAX_SHIP_ATTEMPTS && !placed; attempt += 1) {
			const horizontal = roll(random, 2) === 0;
			const x = roll(random, horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE);
			const y = roll(random, horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1);
			const cells = shipCells(x, y, size, horizontal);
			if (cells.some(([cx, cy]) => taken.has(`${cx},${cy}`))) continue;
			for (const [cx, cy] of cells) taken.add(`${cx},${cy}`);
			ships.push({ name, size, cells });
			placed = true;
		}
		if (!placed) return null;
	}
	return ships;
}

/** Return a fresh board with all five ships placed at random. */
export function createRandomBoard(random = Math.random) {
	if (typeof random !== 'function') throw new TypeError('random must be a function');
	for (let attempt = 0; attempt < MAX_BOARD_ATTEMPTS; attempt += 1) {
		const ships = tryPlaceFleet(random);
		if (ships) return { size: BOARD_SIZE, ships, shots: [] };
	}
	throw new Error('could not place the fleet with the supplied random function');
}
