import './lobby.html';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { SubsManager } from 'meteor/meteorhacks:subs-manager';


Template.lobby.onCreated(function() {
  // const subs = new SubsManager();
  // this.autorun(() => {
  //   subs.subscribe('recipesImage', 10);
  // });
});


Template.lobby.onRendered(function() {
  // $('#1234').draggable();
});
