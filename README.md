# gablocked

gablocked is a tool that resolves a list of Gab User IDs who have blocked you, then offers a web-based interface for browsing the results.

When logged in as yourself, visit this URL: https://gab.com/api/v1/blockedby. It will return a JSON document defining the list of people who have blocked you on Gab.com. Save that document, and upload it to the home page of this service.

gablocked will call the Gab API to resolve each User ID into your local MongoDB.

## Why Does This Exist?

Gab offers an API that returns a list of people who have blocked the calling user. You have to have a Gab account, and you have to be logged in. If you are, you can visit https://gab.com/api/v1/blockedby to see a list of User IDs that have you blocked.

People are curious about who has them blocked for various reasons. And, public profile data can be fetched from Gab using the User ID value. gablocked resolves the User ID to it's public profile data using the Gab API, and saves that information in a local MongoDB. It then offers a Web-based interface for exploring that data and browsing the users who have you blocked.

## Security

gablocked is not hardened or secured in any way. It is <u>not</u> suitable for use on public servers. It should only be run on personal equipment, and should only be accessed for personal use by you (the person curious about who has blocked you).

If someone is asking you to access their "instance" of this tool and upload your block list, DO NOT DO THAT. Run it yourself in a terminal. If you can't do that, you should not use this tool.

- gablocked does not implement SSL
- gablocked assumes no authentication on MongoDB
- gablocked does not require a login of any kind to operate
- Anyone in the world would be able to upload a block list
- Block lists are not keyed to specific users, everyone would see everyone's data

## Getting Started

First, let Yarn resolve the application dependencies. You only need to run this when installing gablocked or updating it.

```sh
yarn
```

Next, copy `.env.default` to `.env` and change as needed.

Then, to start the local web server:

```sh
yarn start
```

Simply press `Ctrl+C` to exit the web server. The resolved data remains in your local database. You can upload a fresh JSON document at any time. The system will resolve all User IDs and update your local database. Even if your block list hasn't changed, you may need to re-resolve the profiles.

A job queue is used to manage the process of resolving the list of User IDs that have blocked you. While it is running, you will be shown the Job Status page. Use the Refresh button to see the current progress. Return to Home when all users have been resolved (waiting is zero).

## Dependencies

- [MongoDB](https://mongodb.com) is used for local storage of Gab user profile data.
- [Node.js](https://nodejs.org/en/docs/) is the application runtime.
- [node-fetch](https://www.npmjs.com/package/node-fetch) is used for interacting with the Gab API to resolve user IDs.
- [Bull](https://www.npmjs.com/package/bull) is used to manage the job queue.
- [ExpressJS](http://expressjs.com/) is used to provide the basic HTML interface for the application.
- [Multer](https://www.npmjs.com/package/multer) is used for processing HTTP POST request bodies
- [Pug](https://pugjs.org/) is used as the HTML templating language for the views
- [UIkit](https://getuikit.com) is used to make the web app presentable.
- [Moment.js](http://momentjs.com/) is used for processing and formatting dates for display.
- [Numeral.js](http://numeraljs.com/) is used for processing and formatting numbers for display.

## Hacking On It

```sh
npm install -g nodemon
yarn dev
```

This will start `gablocked.js` under Nodemon for iterative development. This may be the world's simplest Node.js app.

- [gablocked.js](gablocked.js) is the web application.
- There is one model file [gab-user.js](models/gab-user.js).
- The [views](views) directory is self-explanatory

## Known Issues

- If a person who has blocked you changes their header or profile picture, your local data will still point at their old image(s) and they will fail to load.
- The tool does not integrate Gab posts or timelines (and won't)