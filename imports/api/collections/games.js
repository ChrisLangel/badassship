import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import _ from 'underscore';

export const Games = new Mongo.Collection('games');

Meteor.methods({
  /*
    Initialize the game in the database, take in a minimal amount of information.
    On the client we will identify the game with two player IDs and a time stamp
  */
  initGame(player1, player2, boardSize, startedAt) {
    Games.insert({
      player1,
      player2,
      boardSize,
      startedAt,
    });
  },
  /*
    Go through each board element and advance one time step.  Still deciding if
    this should be based on time, or player moves
  */
  advanceTime(gameId) {

  }
});
