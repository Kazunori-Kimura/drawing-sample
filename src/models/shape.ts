export interface Node {
    id: string;
    x: number;
    y: number;
}

export interface Beam {
    id: string;
    name: string;
    nodeI: string;
    nodeJ: string;
}

export interface Force {
    id: string;
    name: string;
    beam: string;
    force: number;
    // i端からの距離 (0 〜 1)
    distanceI: number;
}

export interface Trapezoid {
    id: string;
    name: string;
    beam: string;
    forceI: number;
    forceJ: number;
    // i端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceI: number;
    // j端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceJ: number;
}

export interface Structure {
    nodes: Node[];
    beams: Beam[];
    forces: Force[];
    trapezoids: Trapezoid[];
}
