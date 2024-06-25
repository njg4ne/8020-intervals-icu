# 8020 to Intervals.icu

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime (but you should also be able to run it with node).

First, install dependencies:

```bash
bun install
```

Get your intervals.icu information from:

intervals.icu/settings >> Developer Settings >> (Athlete ID) and (API Key >> (view))

And place it in a `.env` file (rename [rename-me-to-.env](./rename-me-to-.env))

#### **`./.env`**

```
API_KEY=yourKeyHere
ATHLETE_ID=yourAthleteIdHere
```

To pull the links for the workouts:

```bash
bun run scrape.ts
```

To download all the fit files into folders by sport:

```bash
bun run download-fit-files.ts
```

> :warning: **This command triggers hundreds of API requests**: be sure to run this only when you understand what it does.

```bash
bun run upload.ts
```
