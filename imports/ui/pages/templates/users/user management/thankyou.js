import './thankyou.html';
import './user-template-helpers.html';

import { $ } from 'meteor/jquery';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { Template } from 'meteor/templating';

Template.join.events({
  'click .back-button'(event) {
    event.preventDefault();
    FlowRouter.go('login');
  },
});
