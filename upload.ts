import fs from "fs";
import path from "path";
import { makeFolders, getFolders } from "./prepare-folders";
import parseFIT from "./parse-fit";
import contact from "./intervals.icu";

const folderMap = {
  Run: "80/20 Runs",
  Ride: "80/20 Rides",
  Swim: "80/20 Swims",
};
await makeFolders(Object.values(folderMap));
const folders = await getFolders();
const idMap = Object.fromEntries(
  Object.entries(folderMap).map(([k, v]) => [
    k,
    folders.find((f: any) => f.name === v).id,
  ])
);
console.log(idMap);

const pathMap = {
  Run: "Run",
  Ride: "Bike",
  Swim: path.join("Swim", "25y"),
};

const workoutPosts = [];
for (let [activityType, partialPath] of Object.entries(pathMap)) {
  const rootPath = path.join("fit-files", partialPath);
  const paths = fs.readdirSync(rootPath).map((f) => path.join(rootPath, f));
  for (const path of paths) {
    const fit = parseFIT(path);
    let { name, sport, text } = fit;
    if (name.includes("RCl")) {
      // there were some mistranscriptions by the authors of lowercase l for uppercase I
      name = name.replace("RCl", "RCI");
    }
    console.log(`Parsed ${path}`);
    name = `8020-ICU ${name}`;
    const postData = {
      folder_id: idMap[sport],
      name,
      description: text,
      type: sport,
    };
    workoutPosts.push(postData);
  }
}
console.log(`\nPrepared ${workoutPosts.length} workouts for bulk upload\n`);
try {
  console.log(`\nAttempting bulk upload\n`);
  const res = await contact({ endpoint: `/workouts/bulk`, body: workoutPosts });
  console.log(`\nBulk upload complete\n`);
} catch (e) {
  console.error(e);
  process.exit(1);
}

// try POST /api/v1/athlete/{id}/workouts

// {
//     athlete_id: string
//     id: integer
//     icu_training_load: integer
//     name: string
//     description: string
//     type: string
//     indoor: boolean
//     color: string
//     moving_time: integer
//     updated: date-time
//     joules: integer
//     joules_above_ftp: integer
//     workout_doc: {
//     [any-key]: {
//     }}
//     folder_id: integer
//     day: integer
//     days: integer
//     plan_applied: date-time
//     hide_from_athlete: boolean
//     target: enum
//     Allowed: AUTO┃POWER┃HR┃PACE
//     targets: [enum]
//     Allowed: AUTO┃POWER┃HR┃PACE
//     tags: [string]
//     attachments: [{
//     id: string
//     filename: string
//     mimetype: string
//     url: string
//     }]
//     time: string
//     file_contents: string
//     file_contents_base64: string
//     filename: string
//     distance: number
//     icu_intensity: number
//     }
