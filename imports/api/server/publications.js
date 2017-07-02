import { Meteor } from 'meteor/meteor';

// Import the collections
import { Games } from '/imports/api/collections/games.js';


Meteor.publish('games', function(gameId) {
  if (this.userId) {
    return Games.find({
      _id: gameId,
    });
  }
  return this.ready();
});
