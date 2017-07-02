import '/imports/ui/lib/helpers.html';
import './login.html';
import './user-template-helpers.html';
import '/imports/api/collections/users.js';

import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { sAlert } from 'meteor/juliancwirko:s-alert';

Template.login.events({
  'click .back-button': function(event,template) {
    event.preventDefault();
    FlowRouter.go('/join');
  },
  'submit form': function(event,template) {
    event.preventDefault();
    var user = {
      email: $(event.target).find('[name=email]').val().trim(),
      password: $(event.target).find('[name=password]').val()
    };
    var errors = validateSigninUser(user);
    if (!$.isEmptyObject(errors)) {
      return sAlert.error(errors);
    }
    Meteor.loginWithPassword(user.email, user.password, function(error) {
			if (error) {
        return sAlert.error(error.reason);
			} else {
				FlowRouter.go('/fridge');
			}
	   });
  },
  'click #signup'(event) {
    event.preventDefault();
    FlowRouter.go('join');
  },
});

Template.socialLogins.events({
  'click .sc--facebook': function(event,template) {
    event.preventDefault();
    Meteor.loginWithFacebook({requestPermissions: ['user', 'public_profile']}, function (error) {
      if (error) {
        console.log(error)
      }
    });
  },
  'click .sc--twitter': function(event,template) {
    event.preventDefault();
    Meteor.loginWithTwitter({}, function (error) {
      if (error) {
        console.log(error)
      }
    });
  },
  'click .sc--google-plus': function(event,template) {
    event.preventDefault();
    Meteor.loginWithGoogle({}, function (error) {
      if (error) {
        console.log(error)
      }
    });
  }
})
