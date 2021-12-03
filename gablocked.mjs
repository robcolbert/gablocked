'use strict';

import path from 'path';
import fs from 'fs';

/*
 * I just need to require the script. It's not an import kind of thing, okay?
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url); // jshint ignore:line
require('dotenv').config();

import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';

import mongoose from 'mongoose';
let GabUser;

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url)); // jshint ignore:line
console.log('dirname:', __dirname);

class Gablocked {

  async createRouter (/* app */) {
    const router = express.Router();
    const upload = multer({ dest: path.join(__dirname, 'upload') });

    router.param('userId', this.populateUserId.bind(this));

    router.post('/', upload.single('blockfile'), this.updateBlockList.bind(this));

    router.get('/:userId', this.getUserProfile.bind(this));
    router.get('/', this.getHome.bind(this));

    return router;
  }

  async populateUserId (req, res, next, userId) {
    res.locals.user = { userId };
    return next();
  }
  
  async updateBlockList (req, res, next) {
    console.log('processing input JSON file', { file: req.file });
    for await (const item of items) {
      const response = await fetch(`https://gab.com/api/v1/accounts/${item.id}`);
      if (!response.ok) {
        continue;
      }
      const blocker = await response.json();
      console.log('updating user', {
        id: blocker.id,
        username: `@${blocker.username}`,
      });
      await GabUser.updateOne(
        { id: blocker.id },
        {
          $set: {
            ...blocker
          },
        },
        { upsert: true },
      );
    }
  }
  
  async getUserProfile (req, res) {
    res.render('user-profile');
  }
  
  async getHome (req, res) {
    res.render('index');
  }
}

async function loadJsonFile (filename) {
  const json = await fs.promises.readFile(filename, { encoding: 'utf8' });
  return JSON.parse(json);
}

(async ( ) => {

  try {
    /*
     * Load the package file
     */
    const pkg = await loadJsonFile(path.join(__dirname, 'package.json'));

    await mongoose.connect(`mongodb://${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}`);
    GabUser = require(path.join(__dirname, 'models', 'gab-user.js'));

    const app = express();

    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));

    app.use('/uikit', express.static(path.join(__dirname, 'node_modules', 'uikit', 'dist')));

    app.use(async (req, res, next) => {
      res.locals.pkg = pkg;
      return next();
    });

    const gablocked = new Gablocked();
    app.use('/', await gablocked.createRouter(app));

    app.listen(parseInt(process.env.HTTP_BIND_PORT || '3000', 10), ( ) => {
      console.log('http://127.0.0.1:3000/ to browse the collection of people who block you on Gab.com');
    });
  } catch (error) {
    console.log('failed to start gablocked', error);
    process.exit(-1);
  }

})();