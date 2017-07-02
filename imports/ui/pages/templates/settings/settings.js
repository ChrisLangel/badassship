import './settings.html';

import { PreferenceIngredients } from '/imports/api/collections/preferenceIngredients.js';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { SubsManager } from 'meteor/meteorhacks:subs-manager';

Template.fridge.onCreated(() => {
  const subs = new SubsManager();
  subs.subscribe('preferenceIngredients');
});

Template.settings.onRendered(() => {
  let userStats = {};
  if (PreferenceIngredients.findOne() && PreferenceIngredients.findOne().userStats) {
    userStats = PreferenceIngredients.findOne().userStats;
  } else {
    userStats = {
      Meat: 0,
      Vegetable: 0,
      Fruit: 0,
      Dairy: 0,
      Grain: 0,
    };
  }
  // need to add zeros to skip colors
  const pieData = {
    series: [
      userStats.Meat, // #d70206 Red
      0, // #f05b4f
      userStats.Vegetable, // #f4c63d Yellow
      userStats.Fruit, // #d17905 Orange
      0, // #453d3f
      userStats.Grain, // #59922b Green
      userStats.Dairy, // #0544d3 Blue
      0, // #6b0392 Purple
    ],
  };
  const responsiveOptions = [
    ['screen and (min-width: 640px)', {
      chartPadding: 30,
      labelOffset: 100,
      labelDirection: 'explode',
      labelInterpolationFnc(value) {
        return value;
      },
    }],
    ['screen and (min-width: 1024px)', {
      labelOffset: 80,
      chartPadding: 20,
    }],
  ];
  const pieChart = new Chartist.Pie('.ct-chart', pieData, {showLabel: false}, responsiveOptions);
});


Template.settings.helpers({
  isAdmin() {
    if (Meteor.user() && Meteor.user().profile.role === 'admin') {
      return true;
    }
    return false;
  },
  numItems() {
    const userStats = PreferenceIngredients.findOne() ?
      PreferenceIngredients.findOne().userStats : 0;
    if (userStats) {
      return userStats.TotalItems;
    }
    return 0;
  },
  tripleDigits() {
    const userStats = PreferenceIngredients.findOne() ?
      PreferenceIngredients.findOne().userStats : 0;
    if (userStats.TotalItems > 99) {
      return 'triple-digit-font';
    }
    return '';
  },
  numReceipts() {
    const userStats = PreferenceIngredients.findOne() ?
      PreferenceIngredients.findOne().userStats : 0;
    if (userStats) {
      return userStats.AutoReceipt;
    }
    return 0;
  },
  tripleDigitsReceipt() {
    const userStats = PreferenceIngredients.findOne() ?
      PreferenceIngredients.findOne().userStats : 0;
    if (userStats.AutoReceipt > 99) {
      return 'triple-digit-font';
    }
    return '';
  },
  numIntegrations() {
    const userStats = PreferenceIngredients.findOne() ?
      PreferenceIngredients.findOne().userStats : 0;
    if (userStats) {
      return userStats.Integration;
    }
    return 0;
  },
});
