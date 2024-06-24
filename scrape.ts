// const test = "https://www.8020endurance.com/wp-content/library/run/RRe2.FIT";
// exit 0:
const rgx =
  /https:\/\/www\.8020endurance\.com\/wp-content\/library\/(run|bike|swim)\/([CRS][a-zA-Z]+[0-9]+(?:%2025y)?)\.FIT/g;
// const matches = rgx.exec(test);
// console.log(matches);
// process.exit(0);
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();

// Navigate the page to a URL

// console.log(await p3.evaluate((p) => p.textContent));
// process.exit(0);

async function getWorkoutData(p: any) {
  const div = await p.$("div[itemprop=text]");

  // get all the tables inside p1
  const tables = await p.$$("table");
  // console.log(tables.length);
  // map to the tbody of each table
  const tbodies = await Promise.all(tables.map((t) => t.$("tbody")));
  // console.log(tbodies.length);
  // flat map to the tr of all the tbody
  let trs: any = await Promise.all(tbodies.map((t) => t?.$$("tr")));
  trs = trs.flat();
  console.log(trs.length, "workouts");
  // map to the td of all the tr
  let tds = await Promise.all(trs.map((t: any) => t?.$$("td")));
  // there are three tds in each tr, where the first contains an anchor tag with content of the name of the workout
  // the second can be skipped
  // the third contains the textual description of the workout

  let workouts = await Promise.all(
    tds.map(async (tr) => {
      if (tr.length === 3) {
        const [nameLink, , desc] = tr;
        const a = await nameLink.$("a");
        const href = await a.evaluate((a: any) => a.href);
        const text = await a.evaluate((a: any) => a.textContent);
        const description = await desc.evaluate((d: any) => d.textContent);
        return {
          href,
          text,
          description,
        };
      } else if (tr.length === 6) {
        const [nameLabel, , meter25Link, yard25Link, meter50link, desc] = tr;
        const text = await nameLabel.evaluate((d: any) => d.textContent);
        const description = await desc.evaluate((d: any) => d.textContent);
        let a = await meter25Link.$("a");
        const meters25 = await a.evaluate((a: any) => a.href);
        const hrefs: any = {
          "25m": meters25,
        };
        a = await yard25Link.$("a");
        const yards25 = await a.evaluate((a: any) => a.href);
        hrefs["25y"] = yards25;
        a = await meter50link.$("a");
        const meters50 = await a.evaluate((a: any) => a.href);
        hrefs["50m"] = meters50;
        return {
          text,
          description,
          hrefs,
        };
      } else {
        throw new Error("Invalid number of tds in tr");
      }
    })
  );
  workouts = workouts.map((w) => ({
    ...w,
  }));
  return workouts;
}

const addr = `https://www.8020endurance.com/8020-workout-library/`;
await page.goto(addr);
const panels = await page.$$(".pp-tabs-panel-content[role=tabpanel]");
const [p1, p2, p3] = panels;

const workouts = await getWorkoutData(p1); // run
workouts.push(...(await getWorkoutData(p2))); // bike
workouts.push(...(await getWorkoutData(p3))); // swim
// process.exit(0);
// save to 8020-workouts.json
import { writeFileSync } from "fs";
writeFileSync("8020-workouts.json", JSON.stringify(workouts, null, 2));

// workouts = workouts.filter((w) => rgx.test(w.href));
console.log(workouts.length);
console.log(...workouts.slice(0, 5));

await browser.close();

function typeize(str: string | undefined) {
  if (str === undefined) {
    return undefined;
  } else if (str === "bike") {
    return "Ride";
  }
  return str
    .split(" ")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
}
