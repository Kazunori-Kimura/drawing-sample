import { compareCoords, Coords, isCoords } from '../components/Canvas/util';

test('coords type guard', () => {
    expect(isCoords([0, 0])).toBe(true);
    expect(isCoords([0])).toBe(false);
    expect(isCoords([0, 0, 0, 0])).toBe(false);
    expect(isCoords('hoge')).toBe(false);
});

test('compare coordinats', () => {
    const a: Coords = [0, 0];

    // 厳密なチェック
    const b1: Coords = [0, 0];
    expect(compareCoords(a, b1, true)).toBe(true);

    // 幅をもたせたチェック
    const b2: Coords = [2, 2];
    expect(compareCoords(a, b2)).toBe(true);
    expect(compareCoords(a, b2, true)).toBe(false);

    const b3: Coords = [10, 10];
    expect(compareCoords(a, b3)).toBe(false);
    expect(compareCoords(a, b3, false)).toBe(false);
});
