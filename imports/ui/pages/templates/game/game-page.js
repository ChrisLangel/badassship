import './game-page.html';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { SubsManager } from 'meteor/meteorhacks:subs-manager';
import { Games } from '/imports/api/collections/games.js';
import { Session } from 'meteor/session';


Template.gamePage.onCreated(() => {
  const subs = new SubsManager();
  const gameId = Session.get('gameId');
  subs.subscribe('games', gameId);
});


Template.gamePage.onRendered(() => {
  $('#1234').draggable();
});


Template.gamePage.helpers({

});
