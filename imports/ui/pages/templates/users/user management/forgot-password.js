import './forgot-password.html';
import './user-template-helpers.html';

import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { sAlert } from 'meteor/juliancwirko:s-alert';

Template.forgotPassword.events({
  'click .back-button'(event) {
    event.preventDefault();
    FlowRouter.go('login');
  },
  'submit form'(event, template) {
    event.preventDefault();
    const email = template.$('[name=email]').val();
    if (!email) {
      sAlert.error('You need to supply your email.');
    }
    Accounts.forgotPassword({ email }, (error) => {
      if (error) {
        sAlert.error(error.reason);
      } else {
        FlowRouter.go('login');
        sAlert.success('Check your email to reset your password.');
      }
    });
  },
});
