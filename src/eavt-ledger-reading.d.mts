// Types for the untyped `@red-cup-engineering/eavt-services-section/ledger/reading` module
// (mapped to this file by tsconfig `paths`); the reading shapes are declared in ./index.mts.
import type { LogReading, Reading, WitnessLog, WitnessRow } from "./index.mjs";

export function isReadingIso<Wire>(reading: Reading<Wire>, witness: WitnessRow): boolean;
export function isLogReadingIso<Wire>(reading: LogReading<Wire>, witnessLog: WitnessLog): boolean;
export function readingsHopLosslessly<FromWire, ToWire>(from: Reading<FromWire>, to: Reading<ToWire>, witness: WitnessRow): boolean;
export function logReadingsHopLosslessly<FromWire, ToWire>(from: LogReading<FromWire>, to: LogReading<ToWire>, witnessLog: WitnessLog): boolean;
export function readingAsLogReading<Wire>(reading: Reading<Wire>): LogReading<Wire>;
