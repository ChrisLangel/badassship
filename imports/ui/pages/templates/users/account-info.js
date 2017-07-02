import './account-info.html';

import { $ } from 'meteor/jquery';
import { Accounts } from 'meteor/accounts-base';
import { Stores } from '/imports/api/collections/stores.js';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { Template } from 'meteor/templating';

import moment from 'moment';

Template.accountInfo.helpers({
  fullName() {
    return Meteor.user().profile.fullName;
  },
  email() {
    return Meteor.user().emails[0].address;
  },
  stores() {
    try {
      return Meteor.user().storeConnections;
    } catch (e) {
      return null;
    }
  },
  image() {
    return Stores.findOne({
      store_id: this.store_id,
    }).image;
  },
  name() {
    return Stores.findOne({
      store_id: this.store_id,
    }).name;
  },
  prettyDate() {
    return moment(this.createdAt).format('MMM YYYY');
  },
});

Template.accountInfo.events({
  'click #saveInfo'(e, template) {
    e.preventDefault();

    const user = {
      'profile.fullName': $('[name=fullName]').val().trim(),
      emails: [{
        address: $('[name=email]').val().trim(),
      }],
    };
    const currentPassword = $('[name=currentPassword]').val();
    const newPassword = $('[name=newPassword]').val();
    if (user.emails.length === 0) {
      return sAlert.error('You must provide an email address.');
    }

    if (currentPassword && newPassword) {
      Accounts.changePassword(currentPassword, newPassword, (error) => {
        if (error) {
          sAlert.error(error.reason);
        } else {
          sAlert.success('Hurray you\'ve update your password.');
        }
      });
    }

    Meteor.call('updateUser', user, function(error, result) {
      if (error) {
        sAlert.error(error.reason);
      } else {
        return FlowRouter.go('thankyou');
      }
    });
  },
  'click #back-button'(event, template) {
    FlowRouter.go('thankyou');
  },
  'click .logoutOption'(event, template) {
    Meteor.logout(function() {
      FlowRouter.go('/');
    });
  },
});
