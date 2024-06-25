import contact from "./intervals.icu";
import { makeFolders, getFolders } from "./prepare-folders";
const folderName = "API Bulk Test";
await makeFolders([folderName]);
const folders = await getFolders();

const folder_id = folders.find((f: any) => f.name === folderName).id;
if (!folder_id) {
  throw new Error(`Folder ${folderName} not found`);
}

const postDatas = [
  {
    folder_id,
    name: "Test 1",
    description: "-30m Z1 HR",
    type: "Run",
  },
  {
    folder_id,
    name: "Test 2",
    description: "-30m Z2 HR",
    type: "Run",
  },
];

const res = await contact({ endpoint: `/workouts/bulk`, body: postDatas });

console.log(res);
