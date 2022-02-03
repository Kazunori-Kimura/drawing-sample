import {
    defaultCanvasProps,
    defaultPageProps,
    isPageProps,
    isStructureCanvasProps,
} from '../types/note';
import {
    emptyStructure,
    isBeam,
    isForce,
    isNode,
    isStructure,
    isTrapezoid,
    isUnit,
} from '../types/shape';
import sample from './sample.json';

test('Structure type guard', () => {
    expect(isStructure(emptyStructure)).toBe(true);

    expect(isUnit(sample.unit)).toBe(true);

    expect(Array.isArray(sample.nodes)).toBe(true);
    expect(sample.nodes.every(isNode)).toBe(true);

    expect(Array.isArray(sample.beams)).toBe(true);
    expect(sample.beams.every(isBeam)).toBe(true);

    expect(Array.isArray(sample.forces)).toBe(true);
    expect(sample.forces.every(isForce)).toBe(true);

    expect(Array.isArray(sample.trapezoids)).toBe(true);
    expect(sample.trapezoids.every(isTrapezoid)).toBe(true);

    expect(isStructure(sample)).toBe(true);
});

test('StructureCanvasProps type guard', () => {
    expect(isStructureCanvasProps(defaultCanvasProps)).toBe(true);
});

test('PageProps type guard', () => {
    expect(isPageProps(defaultPageProps)).toBe(true);
});
