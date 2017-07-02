import './button.html';
import { Template } from 'meteor/templating';

Template.button.helpers({
  putClasses(classes) {
    const fixedClasses = 'button button-block ';
    return className = fixedClasses + classes;
  }
})
