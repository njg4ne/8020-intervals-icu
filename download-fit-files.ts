import downloadData from "./8020-workouts.json";
import fs from "fs";
import path from "path";
import axios from "axios";

// [
//     {
//       "href": "https://www.8020endurance.com/wp-content/library/run/RRe1.FIT",
//       "text": "RRe1",
//       "description": "20 minutes Zone 1"
//     },
//     {
//   "href": "https://www.80

const downloadFiles = async () => {
  const folderPath = path.join(__dirname, "fit-files");
  const folders = [
    folderPath,
    path.join(folderPath, "Run"),
    path.join(folderPath, "Bike"),
    path.join(folderPath, "Swim"),
    path.join(folderPath, "Swim", "25y"),
  ];
  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
  });

  for (const workout of downloadData) {
    let { href, text, hrefs } = workout;
    const fileName = `${text}.FIT`;
    let filePath = path.join(folderPath, fileName);
    if (text.startsWith("R")) {
      filePath = path.join(folderPath, "Run", fileName);
    }
    if (text.startsWith("C")) {
      filePath = path.join(folderPath, "Bike", fileName);
    }
    if (text.startsWith("S")) {
      href = hrefs!["25y"];
      filePath = path.join(folderPath, "Swim", "25y", fileName);
    }
    console.log(`Downloading ${fileName} to ${filePath}`);

    try {
      const response = await axios.get(href, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, response.data);
      console.log(`Downloaded ${fileName}`);
    } catch (error) {
      console.error(`Failed to download ${fileName}: ${error}`);
    }
  }
};

downloadFiles();
