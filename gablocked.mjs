'use strict';

import path from 'path';
import fs from 'fs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url); // jshint ignore:line

async function loadJsonFile (filename) {
  const json = await fs.promises.readFile(filename, { encoding: 'utf8' });
  return JSON.parse(json);
}

require('dotenv').config();

import express from 'express';
import favicon from 'serve-favicon';
import multer from 'multer';

import Bull from 'bull';

const compression = require('compression');
const methodOverride = require('method-override');

import fetch from 'node-fetch';

import mongoose from 'mongoose';
let GabUser;

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url)); // jshint ignore:line
console.log('dirname:', __dirname);

class Gablocked {

  constructor ( ) {
    this.jobQueue = new Bull('gablocked', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 1000 * 30, // try again in 30 seconds
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
    this.jobQueue.process(this.onResolveUser.bind(this));
  }

  async createRouter (/* app */) {
    const router = express.Router();
    const upload = multer({ dest: path.join(__dirname, 'upload') });

    router.param('userId', this.populateUserId.bind(this));

    router.post('/', upload.single('blockfile'), this.updateBlockList.bind(this));

    router.get('/job-status', this.getJobStatus.bind(this));
    router.get('/', this.getHome.bind(this));

    router.get('/:userId', this.getUserProfile.bind(this));

    return router;
  }

  async populateUserId (req, res, next, userId) {
    res.locals.profile = await GabUser.findOne({ id: userId }).lean();
    if (!res.locals.profile) {
      return next(new Error('Not found'));
    }
    return next();
  }
  
  async updateBlockList (req, res, next) {
    try {
      console.log('processing input JSON file', { file: req.file });
      const blockList = await loadJsonFile(req.file.path);
      for await (const blockedBy of blockList) {
        await this.jobQueue.add({ userId: blockedBy.id });
      }
      res.redirect('/job-status');
    } catch (error) {
      console.log('failed to update block list', error);
      return next(error);
    }
  }

  async getJobStatus (req, res) {
    res.locals.jobCounts = await this.jobQueue.getJobCounts();
    res.render('job-status');
  }

  async getUserProfile (req, res) {
    res.render('user-profile');
  }
  
  async getHome (req, res) {
    res.locals.pagination = this.getPagination(req, 20);
    res.locals.pagination.totalItems = await GabUser.countDocuments();
    res.locals.profiles = await GabUser
      .find()
      .sort({ username: 1 })
      .skip(res.locals.pagination.skip)
      .limit(res.locals.pagination.cpp)
      .lean();
    res.render('index');
  }

  async onResolveUser (job) {
    const response = await fetch(`https://gab.com/api/v1/accounts/${job.data.userId}`);
    if (!response.ok) {
      throw new Error('failed to fetch user profile data from Gab API');
    }

    const blocker = await response.json();
    console.log('processing profile', { id: blocker.id, username: blocker.username });

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

  getPagination (req, countPerPage) {
    const pagination = { p: 1, skip: 0, cpp: countPerPage };
    if (req.query.cpp) {
      pagination.cpp = parseInt(pagination.cpp, 10);
    }
    if (req.query.p) {
      pagination.p = parseInt(req.query.p, 10);
      pagination.skip = pagination.p * pagination.cpp;
    }
    return pagination;
  }
}

(async ( ) => {

  try {
    await mongoose.connect(`mongodb://${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}`);
    GabUser = require(path.join(__dirname, 'models', 'gab-user.js'));

    const app = express();
    app.locals.pkg = await loadJsonFile(path.join(__dirname, 'package.json'));
    app.locals.numeral = require('numeral');
    app.locals.moment = require('moment');

    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));
    app.set('x-powered-by', false);

    app.use(favicon(path.join(__dirname, 'client', 'img', 'favicon.png')));
    app.use('/uikit', express.static(path.join(__dirname, 'node_modules', 'uikit', 'dist')));

    app.use(express.json({ }));
    app.use(express.urlencoded({ extended: true }));    
    app.use(compression());
    app.use(methodOverride());

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