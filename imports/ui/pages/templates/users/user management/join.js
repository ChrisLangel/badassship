import './join.html';
import './user-template-helpers.html';

import { $ } from 'meteor/jquery';
import { Accounts } from 'meteor/accounts-base';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { Template } from 'meteor/templating';

Template.join.events({
  'click .back-button'(event) {
    event.preventDefault();
    FlowRouter.go('login');
  },
  'submit form'(event, template) {
    event.preventDefault();
    const user = {
      email: $(event.target).find('[name=email]').val().trim(),
      password: $(event.target).find('[name=password]').val(),
    };
    const errors = validateJoinUser(user);
    if (!$.isEmptyObject(errors)) {
      return sAlert.error('Oops check the fields below.');
    }
    if (user.password.length < 6) {
      return sAlert.error('Password must be at least 6 characters long');
    }
    Accounts.createUser({
      profile: {
        zipCode: user.zipCode,
      },
      email: user.email,
      password: user.password,
    }, (error) => {
      if (error) {
        return sAlert.error(error.reason);
      }
      return FlowRouter.go('thankyou');
    });
  },
  'click #login'(event) {
    event.preventDefault();
    FlowRouter.go('login');
  },
});
