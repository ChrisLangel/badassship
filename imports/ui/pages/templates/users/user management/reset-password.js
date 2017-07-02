import './reset-password.html';

import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { sAlert } from 'meteor/juliancwirko:s-alert';

Template.resetPassword.events({
  'submit form'(event, template) {
    event.preventDefault();
    const password = template.$('[name=password]').val();
    if (!password) {
      return sAlert.error('Opps looks like you forgot your password.');
    }
    const token = this.resetToken;
    Accounts.resetPassword(token, password, (error) => {
      if (error) {
        return sAlert.error(error.reason);
      } else {
        sAlert.success('Reset password has been sent. Please check your email.');
        FlowRouter.go('thankyou');
      }
    });
  }
});
