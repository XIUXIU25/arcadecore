const SIZE = 4;
const DIRECTIONS = ['up', 'right', 'down', 'left'];

function validateBoard(board) {
	if (!Array.isArray(board) || board.length !== SIZE) {
		throw new TypeError('board must be a 4 by 4 array');
	}
	for (const row of board) {
		if (!Array.isArray(row) || row.length !== SIZE) {
			throw new TypeError('board must be a 4 by 4 array');
		}
		for (const tile of row) {
			if (!Number.isSafeInteger(tile) || tile < 0) {
				throw new TypeError('each tile must be a non-negative safe integer; use 0 for empty');
			}
		}
	}
}

function validateDirection(direction) {
	if (!DIRECTIONS.includes(direction)) {
		throw new RangeError(`direction must be one of: ${DIRECTIONS.join(', ')}`);
	}
}

function copyBoard(board) {
	return board.map((row) => [...row]);
}

/** Merge one row from left to right, combining each tile at most once. */
function mergeRow(row) {
	const compact = row.filter((tile) => tile !== 0);
	const merged = [];

	for (let index = 0; index < compact.length; index += 1) {
		if (compact[index] === compact[index + 1]) {
			merged.push(compact[index] * 2);
			index += 1;
		} else {
			merged.push(compact[index]);
		}
	}

	while (merged.length < SIZE) merged.push(0);
	return merged;
}

/** Slide every tile in a direction, merging equal neighbours once per move. */
export function move(board, direction) {
	validateBoard(board);
	validateDirection(direction);
	const next = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

	if (direction === 'left' || direction === 'right') {
		for (let rowIndex = 0; rowIndex < SIZE; rowIndex += 1) {
			const row = direction === 'right' ? [...board[rowIndex]].reverse() : [...board[rowIndex]];
			const merged = mergeRow(row);
			next[rowIndex] = direction === 'right' ? merged.reverse() : merged;
		}
		return next;
	}

	for (let columnIndex = 0; columnIndex < SIZE; columnIndex += 1) {
		let column = board.map((row) => row[columnIndex]);
		if (direction === 'down') column = column.reverse();
		let merged = mergeRow(column);
		if (direction === 'down') merged = merged.reverse();
		for (let rowIndex = 0; rowIndex < SIZE; rowIndex += 1) {
			next[rowIndex][columnIndex] = merged[rowIndex];
		}
	}
	return next;
}

/** Place a 2 or 4 in a random empty cell. rng should return a number in [0, 1). */
export function spawn(board, rng = Math.random) {
	validateBoard(board);
	if (typeof rng !== 'function') throw new TypeError('rng must be a function');

	const next = copyBoard(board);
	const empty = [];
	for (let row = 0; row < SIZE; row += 1) {
		for (let column = 0; column < SIZE; column += 1) {
			if (board[row][column] === 0) empty.push([row, column]);
		}
	}
	if (empty.length === 0) return next;

	const positionRoll = rng();
	if (!Number.isFinite(positionRoll) || positionRoll < 0 || positionRoll >= 1) {
		throw new RangeError('rng must return a number in [0, 1)');
	}
	const [row, column] = empty[Math.floor(positionRoll * empty.length)];
	const valueRoll = rng();
	if (!Number.isFinite(valueRoll) || valueRoll < 0 || valueRoll >= 1) {
		throw new RangeError('rng must return a number in [0, 1)');
	}
	next[row][column] = valueRoll < 0.9 ? 2 : 4;
	return next;
}

/** Return whether at least one empty square or mergeable pair remains. */
export function hasMoves(board) {
	validateBoard(board);
	if (board.some((row) => row.some((tile) => tile === 0))) return true;
	return DIRECTIONS.some((direction) => canMove(board, direction));
}

/** Return whether a move in this direction would change the board. */
export function canMove(board, direction) {
	validateBoard(board);
	validateDirection(direction);
	const next = move(board, direction);
	return next.some((row, rowIndex) => row.some((tile, columnIndex) => tile !== board[rowIndex][columnIndex]));
}
