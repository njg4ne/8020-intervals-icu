import intervalsIcu from "./intervals.icu";

export const getFolders = async () =>
  (await intervalsIcu({ endpoint: `/folders` }))
    .filter((f: { type: string }) => f.type === "FOLDER")
    .map(({ id, name }: { id: number; name: string }) => ({ id, name }));

export async function makeFolders(
  names: string[] = ["80/20 Runs", "80/20 Rides", "80/20 Swims"]
) {
  const folders = await getFolders();
  const newFolderNames = names.filter(
    (name) => !folders.some((f: { name: string }) => f.name === name)
  );

  for (const name of newFolderNames) {
    await intervalsIcu({ endpoint: `/folders`, body: { name } });
    const folders2 = await getFolders();
    const found = folders2.find(
      (f: { name: string }) => f.name === "80/20 Runs"
    );
    if (!found) {
      console.error(`Failed to create folder`);
      process.exit(1);
    } else {
      console.log("Created folder", found);
    }
  }
}
