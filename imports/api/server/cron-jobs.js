import '/imports/api/collections/users.js';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import _ from 'underscore';

SyncedCron.add({
  name: 'Rotate recipes',
  schedule(parser) {
    return parser.text('every 1 hour');
  },
  job() {
    // some job
  },
});

SyncedCron.start();
