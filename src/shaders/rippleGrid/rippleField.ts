// Fixed-capacity ring buffer of pointer-driven ripple sources. Origins and start
// times are a structure of arrays so the active set uploads directly into GLSL
// uniform arrays each frame with no per-frame allocation. When the buffer is
// full the oldest slot is reused.

export const MAX_RIPPLES: number = 8;

// A single ripple source in surface UV space. timeSeconds shares the clock used
// for the shader time uniform so the shader can derive each ripple's age.
export type RippleSpawn = Readonly<{
    originU: number;
    originV: number;
    timeSeconds: number;
}>;

export type RippleField = Readonly<{
    origins: Float32Array;
    startTimes: Float32Array;
    spawn: (ripple: RippleSpawn) => void;
}>;

// Slots that have never been spawned start far in the past so their age is large
// and the shader decays them to zero amplitude.
const INACTIVE_START_TIME: number = -1000;

export function createRippleField(): RippleField {
    const origins: Float32Array = new Float32Array(MAX_RIPPLES * 2);
    const startTimes: Float32Array = new Float32Array(MAX_RIPPLES);
    startTimes.fill(INACTIVE_START_TIME);
    let writeIndex: number = 0;

    function spawn(ripple: RippleSpawn): void {
        origins[writeIndex * 2] = ripple.originU;
        origins[writeIndex * 2 + 1] = ripple.originV;
        startTimes[writeIndex] = ripple.timeSeconds;
        writeIndex = (writeIndex + 1) % MAX_RIPPLES;
    }

    return { origins, startTimes, spawn };
}
