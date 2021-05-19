# svelte graphs

This repo shows a few svelte graphs. It's based on [@Rich_Harris](https://twitter.com/rich_harris) own [Pancake charts](https://pancake-charts.surge.sh/).

You can see this repo live at [tomfa.github.io/svelte-graphs/](https://tomfa.github.io/svelte-graphs/)

## Get started

Install the dependencies...

```bash
yarn
```

Start the server...

```bash
yarn dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see some charts running. 

## Building and running in production mode

To create an optimised version of the app:

```bash
yarn build
```

You can run the newly built app with `yarn start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).

## Deploying 

This app is deployed using `gh-pages`

```bash
yarn deploy
```
