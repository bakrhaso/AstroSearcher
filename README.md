# Starsector data

Data files from mods can be found in the same location as in the vanilla game, but in its mod folder. For DIY Planets
it would for example be mods/DIYPlanets/data/campaign/procgen.

- planet_gen_data.csv can be found in data/campaign/procgen.
- condition_gen_data.csv can be found in data/campaign/procgen. I ignore `_no_pick`-suffixed entries.

An example save file (campaign.xml) can be found in devData, this save file also has several mods in it including Nexerelin, Industrial.Evolution, and DIY Planets.

# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
