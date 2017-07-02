import './terms-and-conditions.html';

import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.termsAndConditions.events({
  'click button'(event, template) {
    event.preventDefault();
    FlowRouter.go('join');
  },
});
