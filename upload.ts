import fs from "fs";

const { API_KEY, ATHLETE_ID } = process.env;
const API_SERVER = "https://intervals.icu";
// The API uses basic authentication 228 for personal use. The username is “API_KEY” and the password your API key. Example using curl:
// $ curl -u API_KEY:1l0nlqjq3j1obdhg08rz5rfhx https://intervals.icu/api/v1/athlete/2049151/activities.csv
const USER_NAME = "API_KEY";

const res = await fetch(`${API_SERVER}/api/v1/athlete/${ATHLETE_ID}/folders`, {
  headers: {
    Authorization: `Basic ${btoa(`${USER_NAME}:${API_KEY}`)}`,
  },
});

const json = await res.json();
// console.log(json);

// save as workouts.json
import { writeFileSync } from "fs";
import parseFIT from "./parse-fit";
writeFileSync("folders.json", JSON.stringify(json, null, 2));
// get the name and id of the folder with name API Test
const { id: targetFolderId, name: targetFolderName } = json.find(
  (f) => f.name === "API Test"
);
console.log({ targetFolderId, targetFolderName });

const testFit = "fit-files/RLI4.FIT";
// get all the file paths in fit-files
const paths = fs.readdirSync("fit-files").map((f) => `./fit-files/${f}`);
try {
  const paths = fs.readdirSync("fit-files").map((f) => `./fit-files/${f}`);
  for (const path of paths) {
    // console.log(`Parsing ${path}`);
    const fit = parseFIT(path);
    console.log(fit);
    let { name, sport, text } = fit;
    name = `8020-ICU ${name}`;
    const postData = {
      folder_id: targetFolderId,
      name,
      description: text,
      type: sport,
    };
    // const res2 = await fetch(
    //   `${API_SERVER}/api/v1/athlete/${ATHLETE_ID}/workouts`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${btoa(`${USER_NAME}:${API_KEY}`)}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(postData),
    //   }
    // );
    // console.log(`Sent ${name}`);
  }
  // const json2 = await res2.json();
  // console.log(json2);
} catch (e) {
  console.error(e);
  process.exit(1);
}

// const testData = {
//   folder_id: targetFolderId,
//   name: `API Test FIT Parsed ${name}`,
//   description:
//     "-5m 8020/Z1 Z1 HR\n-5m 8020/Z2 Z2 HR\n\n3x \n-3m 8020/Z4 Z6 HR\n-2m Recover Z1-Z2 HR\n\n-5m 8020/Z1 Z1 HR",
//   type: "Run",
//   //   indoor: false,
// };

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
