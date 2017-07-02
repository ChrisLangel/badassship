import './layout.html';
import './layoutNoUser.html';
import '/imports/ui/layouts/includes/main-tabs.html';
import '/imports/ui/layouts/includes/menu-bar.html';

import { $ } from 'meteor/jquery';
import _ from 'underscore';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { MeteorCamera } from 'meteor/mdg:camera';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.layout.onCreated(() => {
  Session.set('gameId', null);
  Session.set('limit', 10);
  Session.set('scroll', 0);
  Session.set('action_button_active', false);
  Session.set('delete_button_active', false);
});

Template.layout.events({
  'click [data-action=showAddActionSheet]'() {
    const actionButtonActive = Session.get('action_button_active');
    Session.set('action_button_active', !actionButtonActive);
  },
  'click #searchMenuBar'() {
    const searchBar = Session.get('searchBar');
    Session.set('searchBar', !searchBar);
    window.setTimeout(() => {
      try {
        const searchTerm = Session.get('recipeDropDown');
        $('#searchInput').val(searchTerm);
        document.getElementById('searchInput').focus();
      } catch (e) {}
    }, 0);
  },
  'click #clearSearch'() {
    Session.set('searchBar', false);
    Session.set('recipeDropDown', null);
    if (Session.get('multiSearch')) {
      Meteor.call('cancelMultiSearch');
      Session.set('multiSearch', false);
    }
  },
  'keyup #searchInput'() {
    Session.set('recipeDropDown', $('#searchInput').val());
  },
  'click #editFridgeMulti'() {
    const editingFridge = Session.get('editingFridge');
    Session.set('editingFridge', !editingFridge);
  },
  'click #deleteFridgeMulti'(event) {
    event.preventDefault();
    const selectedItems = $("input[name='foodItems']:checked");
    const arrayItems = _.map(selectedItems, (item) => item.id);
    if (arrayItems.length > 0) {
      Session.set('delete_button_active', true);
    }
  },
  'click #searchStoveMulti'(event, template) {
    const selectedItems = template.findAll("input[name='foodItems']:checked");
    const arrayItems = _.map(selectedItems, (item) => item.id);
    Meteor.call('multiSearchRecipes', arrayItems);
    Session.set('multiSearch', true);
    Session.set('searchBar', true);
    Session.set('recipeDropDown', null);
    FlowRouter.go('stove');
    $('#searchInput').attr('placeholder', 'Recipes with Selected Items');
  },
  'click #freezeMulti'(event, template) {
    const selectedItems = template.findAll("input[name='foodItems']:checked");
    const arrayItems = _.map(selectedItems, (item) => item.id);
    Meteor.call('multiFreezeItems', arrayItems);
    Session.set('editingFridge', false);
  },
});

Template.layout.helpers({
  notStove() {
    if (FlowRouter.current().route.name !== 'stove') {
      return 'box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);';
    }
    return '';
  },
  notEditingFridge() {
    return !Session.get('editingFridge');
  },
  darkBackground() {
    const isDarkBackground = (
      FlowRouter.getRouteName() === 'editFridgeItem' ||
      FlowRouter.getRouteName() === 'settings');
    return isDarkBackground ? 'background-dark' : '';
  },
  hasSubheader(stove) {
    return stove && 'has-subheader';
  },
});

Template.menuBarStatic.helpers({
  back() {
    let oldRoute = '';
    try {
      oldRoute = FlowRouter.current().oldRoute.path;
      if (['/fridge', '/stove', '/settings'].indexOf(oldRoute) === -1) {
        oldRoute = '/fridge';
      }
    } catch (e) {
      oldRoute = '/fridge';
    }
    return oldRoute;
  },
  searchBar() {
    return Session.get('searchBar');
  },
  editingFridge() {
    return Session.get('editingFridge');
  },
});

Template.menuBarStatic.events({
  'click .updatePendingItems'(event) {
    Meteor.call('updatePending', 'Manual');
  },
});

Template.fsFooter.helpers({
  action_button_active() {
    return Session.get('action_button_active');
  },
  delete_button_active() {
    return Session.get('delete_button_active');
  },
});

Template.fsFooter.events({
  'click'() {
    Session.set('action_button_active', false);
  },
  'click #scan_receipt'(event, template) {
    const cameraOptions = {
      width: 2448,
      height: 3264,
    };
    MeteorCamera.getPicture(cameraOptions, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        Meteor.call('recieptInsert', data, Meteor.userId(), (error2) => {
          if (error2) {
            console.log(error2);
          } else {
            FlowRouter.go('receiptPending');
            sAlert.success('Stick around for a few seconds and your items will arrive in the fridge!');
          }
        });
      }
    });
  },
  'click #manual_entry'(event) {
    event.preventDefault();
    FlowRouter.go('manualItemEntry');
  },
  'click #eatenByUser, click #thrownOutByUser'(event) {
    if (FlowRouter.getRouteName() === 'fridge') {
      // We're in the fridge using multidelete
      const selectedItems = $("input[name='foodItems']:checked");
      const arrayItems = _.map(selectedItems, (item) => item.id);

      Meteor.call('deleteFridgeItemMulti', arrayItems, event.target.id, (error) => {
        console.log(error);
      });
      Meteor.call('getBadgeNumber');
      Session.set('editingFridge', false);
      Session.set('delete_button_active', false);
    } else {
      // We're viewing a single item
      const itemId = $('.editFridgeItem').attr('id');

      Meteor.call('deleteFridgeItem', itemId, event.target.id, (error) => {
        if (error) {
          console.log(error);
        } else {
          clevertap.event.push('Item Deleted by User');
        }
      });
      Meteor.call('getBadgeNumber');
      Session.set('delete_button_active', false);
      FlowRouter.go('thankyou');
    }
  },
  'click #delete-cancel'(event) {
    Session.set('delete_button_active', false);
  },
});


Template.stovetabs.onCreated(function() {
  this.currentRoute = new ReactiveVar('');
  this.autorun(() => {
    this.currentRoute.set(FlowRouter.getRouteName());
  });
});

Template.stovetabs.helpers({
  active(route) {
    return Template.instance().currentRoute.get().indexOf(
      route.substr(0, 3)
    ) > -1 && 'active';
  },
});

Template.stovetabs.events({
  'click .right-tab'(event) {
    event.preventDefault();
    FlowRouter.go('/tips');
  },
  'click .left-tab'(event) {
    event.preventDefault();
    FlowRouter.go('/favorites');
  },
  'click .center-tab'(event) {
    event.preventDefault();
    FlowRouter.go('/stove');
  },
});

Template.layoutNoUser.helpers({
  loginOrJoin() {
    const login = FlowRouter.getRouteName() === 'login';
    const join = FlowRouter.getRouteName() === 'join';

    if (login || join) {
      return 'loginBackground';
    }
    return '';
  },
});
