/*
>>Example from garmin: 
import { Decoder, Stream, Profile, Utils } from '@garmin/fitsdk';

const bytes = [0x0E, 0x10, 0xD9, 0x07, 0x00, 0x00, 0x00, 0x00, 0x2E, 0x46, 0x49, 0x54, 0x91, 0x33, 0x00, 0x00];

const stream = Stream.fromByteArray(bytes);
console.log("isFIT (static method): " + Decoder.isFIT(stream));

const decoder = new Decoder(stream);
console.log("isFIT (instance method): " + decoder.isFIT());
console.log("checkIntegrity: " + decoder.checkIntegrity());

const { messages, errors } = decoder.read();

console.log(errors);
console.log(messages);
>>End example
*/
//@ts-expect-error
import { Decoder, Stream, Profile, Utils } from "@garmin/fitsdk";
// const testFitFilePath = "./CT28.FIT"; //"./fit-files/RMI2.FIT";

import fs from "fs";

const ZoneICUto8020 = {
  1: 1,
  2: 2,
  3: "X",
  4: 3,
  5: "Y",
  6: 4,
  7: 5,
};
const Zone8020toICU = {
  1: 1,
  2: 2,
  X: 3,
  3: 4,
  Y: 5,
  4: 6,
  5: 7,
};
const metersPerMile = 804.67 * 2;

// console.log(parseFIT("fit-files/Run/RCI13.FIT"));

export default parseFIT;

function loadFIT(path: string) {
  if (!fs.existsSync(path)) {
    throw new Error(`File ${path} does not exist`);
  }
  const stream = Stream.fromByteArray(fs.readFileSync(path));
  const decoder = new Decoder(stream);
  if (!decoder.isFIT()) {
    throw new Error("File is not FIT at " + path);
  }
  if (!decoder.checkIntegrity()) {
    throw new Error("FIT File integrity check failed:" + path);
  }
  const { messages, errors } = decoder.read();
  if (errors.length > 0) {
    throw new Error("Errors in FIT file: " + errors.join(", "));
  }
  return messages;
}
type FitSport = "running" | "cycling" | "swimming";

function stepTextIsRepeat(text: string) {
  return text.includes("x");
}

function parseFIT(path: string) {
  const { workoutMesgs, workoutStepMesgs } = loadFIT(path);
  const { wktName: wktNameArr, sport, numValidSteps } = workoutMesgs[0];
  // console.log("workoutStepMesgs", workoutStepMesgs);
  // return { text: "test" };
  // if sport isnt running, throw

  const sportMap: Record<FitSport, string> = {
    running: "Run",
    cycling: "Ride",
    swimming: "Swim",
  } as const;
  if (!Object.keys(sportMap).includes(sport)) {
    throw new Error("Only running handled now. Sport given was: " + sport);
  }
  const wktName = wktNameArr[0];
  const steps = workoutStepMesgs.reduce(
    (steps: ICUStep[], rawStep: RawStep) => {
      return stepParseReducer(steps, rawStep, sport as FitSport);
    },
    [] as ICUStep[]
  );

  const pressLapIndex = steps.findIndex(
    (step: ICUStep, idx: number, arr: ICUStep[]) => {
      const nextStep = arr[idx + 1];
      if (
        nextStep &&
        stepHasText(step.text) &&
        stepHasText(nextStep.text) &&
        !stepTextIsRepeat(step.text)
      ) {
        const rgx = /.*Z(1|2).*/;
        const rgx2 = /.*Z(6|7).*/;
        return rgx.test(step.text) && rgx2.test(nextStep.text);
      }
      return false;
    }
  );
  if (pressLapIndex > -1) {
    toPressLap(steps[pressLapIndex]);
  }

  return {
    name: wktName,
    sport: sportMap[sport as FitSport],
    text: steps.map((s: ICUStep) => s.text).join("\n"),
  };
}

type RawStepCommon = {
  notes: string[];
  messageIndex: number;
  durationType: "time" | "repeatUntilStepsCmplt" | "distance" | "open";
  intensity: "warmup" | "active" | "cooldown" | "rest" | "interval" | "other";
};
type RawTimeStep = RawStepCommon & {
  durationTime: number; // seconds
  durationValue: number; // milliseconds
};
type RawStepRepeat = RawStepCommon & {
  repeatSteps: number; // the number of times to do this loop
  durationStep: number; // the target messageIndex that begins the repeat cycle
};
type RawDistanceStep = RawStepCommon & {
  durationDistance: number;
};
type RawOpenStep = RawStepCommon & {};
type RawStep = RawTimeStep | RawStepRepeat | RawDistanceStep | RawOpenStep;

type ZoneKey8020 = "Z1" | "Z2" | "ZX" | "Z3" | "ZY" | "Z4" | "Z5";
type IntervalsICUZoneKey = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6" | "Z7";
function shortenZone(longZone: string) {
  let rgx = /Zone (1|2|3|4|5|X|Y)/;
  let match = rgx.exec(longZone);
  if (match) {
    return `Z${match[1]}`;
  }
  rgx = /Zone(1|2|3|4|5|X|Y)/; // no space
  match = rgx.exec(longZone);
  if (match) {
    return `Z${match[1]}`;
  } else {
    throw new Error("Invalid zone string: " + longZone);
  }
}

function renameZoneTo8020(zone: IntervalsICUZoneKey): ZoneKey8020 {
  const marker = parseInt(zone.slice(1));
  if ([1, 2, 4, 5, 6, 7].includes(marker)) {
    return `Z${ZoneICUto8020[marker as 1 | 2 | 4 | 5 | 6 | 7]}` as ZoneKey8020;
  }
  throw new Error("Invalid zone: " + zone);
}
function renameZonesToICU(zone: ZoneKey8020): IntervalsICUZoneKey {
  const marker = parseInt(zone.slice(1));
  if ([1, 2, 3, 4, 5, "X", "Y"].includes(marker)) {
    return `Z${
      Zone8020toICU[marker as 1 | 2 | 3 | 4 | 5]
    }` as IntervalsICUZoneKey;
  }
  throw new Error("Invalid zone: " + zone);
}

// const getLabel = (zone: IntervalsICUZoneKey) =>
//   `8020/Z${renameZones8020(zone)}`;
// for (const test of [
//   "Z1",
//   "Z2",
//   "Z3",
//   "Z4",
//   "Z5",
//   "Z6",
//   "Z7",
// ] as IntervalsICUZoneKey[]) {
//   console.log(`${test} -> ${renameZones8020(test)}`);
// }

type ICUStep = {
  text: string | ICUStep[];
  id: number;
};

function secondsToNiceTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}h`;
    if (minutes > 0) {
      result += `${minutes}m`;
    }
    if (secs > 0) {
      result += `${secs}s`;
    }
  } else if (minutes > 0) {
    result += `${minutes}m`;
    if (secs > 0) {
      result += `${secs}s`;
    }
  } else {
    result = `${secs}s`;
  }
  return result;
}

function metersToMiles(meters: number) {
  // expect increments of 0.5 miles, but rely on 1/8th mile increments
  let miles = meters / metersPerMile;
  miles = Math.round(miles * 8) / 8;
  return `${miles}mi`;
}
function metersToYards(meters: number) {
  let yds = 1.09361 * meters;
  // round to nearest 25
  yds = Math.round(yds / 25) * 25;
  return `${yds}y`;
}

// const tests = [3622, 60, 45, 90, 150, 300, 1595, 3000, 28800];
// for (const test of tests) {
//   console.log(`${test} -> ${secondsToNiceTime(test)}`);
// }

function isTimeStep(step: RawStep): step is RawTimeStep {
  return step.durationType === "time";
}
function isRepeatStep(step: RawStep): step is RawStepRepeat {
  return step.durationType === "repeatUntilStepsCmplt";
}
function isDistanceStep(step: RawStep): step is RawDistanceStep {
  return step.durationType === "distance";
}
function isOpenStep(step: RawStep): step is RawOpenStep {
  return step.durationType === "open";
}
function stepHasText(step: string | ICUStep[]): step is string {
  return typeof step === "string";
}

function toPressLap(step: ICUStep | null | undefined) {
  if (step && stepHasText(step.text)) {
    const dashIndex = step.text.indexOf("-");
    step.text = `-Press lap ${step.text.slice(dashIndex + 1)}`;
  }
  return step;
}

function stepParseReducer(steps: ICUStep[], rawStep: RawStep, sport: FitSport) {
  if (isTimeStep(rawStep)) {
    const intensityTxt = `intensity=${rawStep.intensity}`;
    // console.log(intensityTxt);
    let duration: string | number = rawStep.durationTime;
    duration = secondsToNiceTime(duration);
    // console.log(rawStep);
    const zoneLong8020 = rawStep.notes[0];
    let label, zoneICU;
    if (!zoneLong8020) {
      console.warn(">> Warning: No zone in workout step!");
      label = "8020/Easy";
      zoneICU = "Z1-Z2";
    } else {
      const res = getICUZoneAndLabel(zoneLong8020);
      label = res.label;
      zoneICU = res.zone;
    }
    const intensityTargetType = "HR";
    const text = `-${label} ${duration} ${zoneICU} HR ${intensityTxt}`;
    steps.push({
      id: rawStep.messageIndex,
      text,
    });
  } else if (isRepeatStep(rawStep)) {
    // console.log("Repeat step", rawStep);
    const id = rawStep.durationStep;
    const idx = steps.findIndex((s) => s.id === id);
    const repeatTimes = rawStep.repeatSteps;
    const innerText = steps
      .slice(idx)
      .map((s) => s.text)
      .join("\n");
    steps = steps.slice(0, idx);
    steps.push({
      id: rawStep.messageIndex,
      text: `\n${repeatTimes}x\n${innerText}\n`,
    });
  } else if (isDistanceStep(rawStep)) {
    const intensityTxt = `intensity=${rawStep.intensity}`;
    // console.log(intensityTxt);
    let distanceMeters: number = rawStep.durationDistance;
    let distance: any = distanceMeters;
    if (sport === "swimming") {
      // console.log("Swimming detected with distance", distance);
      distance = metersToYards(distanceMeters);
    } else {
      distance = metersToMiles(distanceMeters);
    }
    const zoneLong8020 = rawStep.notes[0];
    let label, zoneICU;
    if (!zoneLong8020) {
      console.warn("No zone in workout step!");
      label = "Unknown Zone";
      zoneICU = "Z1-Z2";
    } else {
      const res = getICUZoneAndLabel(zoneLong8020);
      label = res.label;
      zoneICU = res.zone;
    }
    const intensityTargetType = "HR";
    const text = `-${label} ${distance} ${zoneICU} HR ${intensityTxt}`;
    steps.push({
      id: rawStep.messageIndex,
      text,
    });
  } else if (isOpenStep(rawStep)) {
    steps.push({
      id: rawStep.messageIndex,
      text: "-Press lap 8020/Open intensity=rest",
    });
  } else {
    throw new Error("Unhandled durationType: " + (rawStep as any).durationType);
  }
  return steps;
}

function getICUZoneAndLabel(note: string) {
  const zoneLong8020 = note;
  const zoneShort8020 = shortenZone(zoneLong8020);
  const label = `8020/${zoneShort8020}`;
  const zoneICU = renameZonesToICU(zoneShort8020 as ZoneKey8020);
  const intensityTargetType = "HR";
  return { label, zone: zoneICU };
}
