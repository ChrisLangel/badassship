import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import _ from 'underscore';

Meteor.startup(function() {
  sAlert.config({
    effect: '',
    position: 'top',
    timeout: 'none',
    html: false,
    onRouteClose: true,
    stack: {
      limit: 1
    },
    offset: 0,
    beep: false,
    onClose: _.noop
  });
});

$(document).on({
  'touchstart': function(e) {
    $('#searchBox').blur();
  }
});

Platform = {
  isIOS: function() {
    return (!!navigator.userAgent.match(/iPad/i) || !!navigator.userAgent.match(/iPhone/i) || !!navigator.userAgent.match(/iPod/i)) || Session.get('platformOverride') === 'iOS';
  },

  isAndroid: function() {
    return navigator.userAgent.indexOf('Android') > 0 || Session.get('platformOverride') === 'Android';
  }
};

Template.registerHelper('isIOS', function() {
  return Platform.isIOS();
});

Template.registerHelper('isAndroid', function() {
  return Platform.isAndroid();
});
