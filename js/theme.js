goog.provide('energy.theme');

goog.require('goog.dom');
goog.require('goog.dom.classes');

energy.theme.list = ['zombie', 'cat'];

/**
 * @type {string}
 */
energy.theme.defaultTheme = energy.theme.list[0];

/**
 * @type {string}
 */
energy.theme.current = energy.theme.defaultTheme;

energy.theme.init = function() {
  var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};
  if (localStorage) {
    var _theme = localStorage.getItem('theme');
    if (_theme) {
      energy.theme.current = _theme.toString();
    }
  }
  goog.dom.classes.add(document.body, energy.theme.current);
};

energy.theme.nextTheme = function() {
  var index = energy.theme.list.indexOf(energy.theme.current);

  if (index >= 0) {
    var newIndex = (index + 1) % energy.theme.list.length;
    var newTheme = energy.theme.list[newIndex];
    goog.dom.classes.remove(document.body, energy.theme.current);
    goog.dom.classes.add(document.body, newTheme);
    energy.theme.current = newTheme;

    var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};
    if (localStorage) {
      localStorage.setItem('theme', energy.theme.current);
    }
  }
};
