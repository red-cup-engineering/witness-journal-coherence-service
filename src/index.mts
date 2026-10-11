/**
 * @packageDocumentation
 *
 * `@red-cup-engineering/witness-journal-coherence` computes the coherence
 * judgement between two wire-form readings of the same witness (or ordered
 * witness log): a "reading" is the Leader's sense of the word — a settled
 * judgement computed over witnesses, not a field stored anywhere — and two
 * readings cohere when both are lossless round-trips AND hopping through
 * either one to reach the other and back returns to the same witness pivot.
 *
 * The round-trip mechanics themselves (is this one reading an isomorphism at
 * all?) are generic and live in `@red-cup-engineering/eavt-services-section`'s `ledger/reading`;
 * this package is the witness-journal-domain judgement built on top of them.
 * Extracted from `@red-cup-engineering/relating`'s ledger module, where the two
 * were fused in one file.
 */
import {
  isReadingIso,
  isLogReadingIso,
  readingsHopLosslessly,
  logReadingsHopLosslessly,
} from "@red-cup-engineering/eavt-services-section/ledger/reading";
import { eavtRecord, type EAVT, type EAVTRecord } from "@red-cup-engineering/json-file-codec-service/jsonl/eavt";

/** One witness: an EAVT row, as a tuple or as a record. */
export type WitnessRow = EAVT | EAVTRecord;
/** An ordered witness log. */
export type WitnessLog = readonly WitnessRow[];

/** A named isomorphism between one witness row and one wire form. */
export interface Reading<Wire> {
  readonly id: string;
  toWire(witness: WitnessRow): Wire;
  fromWire(wire: Wire): WitnessRow;
}

/** The same law over an ordered witness log. */
export interface LogReading<Wire> {
  readonly id: string;
  toWire(witnessLog: WitnessLog): Wire;
  fromWire(wire: Wire): WitnessLog;
}

function assertNonEmptyId(id: string, context: string): void {
  if (typeof id !== "string" || id.length < 1) {
    throw new TypeError(`${context}: id must be a non-empty string`);
  }
}

export interface CoherenceReport {
  readonly kind: "witness-journal.coherence";
  readonly left: string;
  readonly right: string;
  readonly witness: WitnessRow;
  readonly leftIso: boolean;
  readonly rightIso: boolean;
  readonly leftToRight: boolean;
  readonly rightToLeft: boolean;
  readonly ok: boolean;
}

export interface LogCoherenceReport {
  readonly kind: "witness-journal.log-coherence";
  readonly left: string;
  readonly right: string;
  readonly witnessLog: WitnessLog;
  readonly leftIso: boolean;
  readonly rightIso: boolean;
  readonly leftToRight: boolean;
  readonly rightToLeft: boolean;
  readonly ok: boolean;
}

/**
 * Check that two readings are isomorphisms on `witness`, and that each route
 * through the shared witness pivot returns to the same row.
 */
export function cohere<LeftWire, RightWire>(
  left: Reading<LeftWire>,
  right: Reading<RightWire>,
  witness: WitnessRow,
): CoherenceReport {
  assertNonEmptyId(left.id, "left reading");
  assertNonEmptyId(right.id, "right reading");
  const leftIso = isReadingIso(left, witness);
  const rightIso = isReadingIso(right, witness);
  const leftToRight = readingsHopLosslessly(left, right, witness);
  const rightToLeft = readingsHopLosslessly(right, left, witness);
  return Object.freeze({
    kind: "witness-journal.coherence" as const,
    left: left.id,
    right: right.id,
    witness: eavtRecord(witness),
    leftIso,
    rightIso,
    leftToRight,
    rightToLeft,
    ok: leftIso && rightIso && leftToRight && rightToLeft,
  });
}

/**
 * Check that two higher-block readings are isomorphisms on an ordered witness
 * log, and that each route through the shared log pivot returns to the same log.
 */
export function cohereLog<LeftWire, RightWire>(
  left: LogReading<LeftWire>,
  right: LogReading<RightWire>,
  witnessLog: WitnessLog,
): LogCoherenceReport {
  assertNonEmptyId(left.id, "left log reading");
  assertNonEmptyId(right.id, "right log reading");
  const admittedLog = Object.freeze(witnessLog.map((row) => eavtRecord(row)));
  const leftIso = isLogReadingIso(left, admittedLog);
  const rightIso = isLogReadingIso(right, admittedLog);
  const leftToRight = logReadingsHopLosslessly(left, right, admittedLog);
  const rightToLeft = logReadingsHopLosslessly(right, left, admittedLog);
  return Object.freeze({
    kind: "witness-journal.log-coherence" as const,
    left: left.id,
    right: right.id,
    witnessLog: admittedLog,
    leftIso,
    rightIso,
    leftToRight,
    rightToLeft,
    ok: leftIso && rightIso && leftToRight && rightToLeft,
  });
}

export function assertCoherent<LeftWire, RightWire>(
  left: Reading<LeftWire>,
  right: Reading<RightWire>,
  witness: WitnessRow,
): CoherenceReport {
  const report = cohere(left, right, witness);
  if (!report.ok) {
    throw new Error(`readings do not cohere: ${left.id} <-> ${right.id}`);
  }
  return report;
}

export function assertLogCoherent<LeftWire, RightWire>(
  left: LogReading<LeftWire>,
  right: LogReading<RightWire>,
  witnessLog: WitnessLog,
): LogCoherenceReport {
  const report = cohereLog(left, right, witnessLog);
  if (!report.ok) {
    throw new Error(`log readings do not cohere: ${left.id} <-> ${right.id}`);
  }
  return report;
}
