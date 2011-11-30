goog.provide('energy.zombie');
goog.provide('energy.zombie.Game');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');

goog.require('goog.Timer');
goog.require('energy.zombie.Target');

/**
 * @constructor
 */
energy.zombie.Game = function() {
  energy.zombie.Game.prototype.container = goog.dom.getElement('game-container');

  for (var i = 0; i < 15; i++) {
    this.targets.push(new energy.zombie.Target(this));
  }
  this.draw();

  this.startButton = goog.dom.getElement('start');
  goog.dom.setTextContent(this.startButton, 'Start')
  this.overlay = goog.dom.getElement('overlay');
  this.timerElement = goog.dom.getElement('timer');
  goog.events.listen(this.startButton, goog.events.EventType.CLICK, this.startListener, true, this);
};

/**
 * @type {goog.array.ArrayLike}
 */
energy.zombie.Game.prototype.targets = [];

/**
 * @type {number}
 */
energy.zombie.Game.prototype.roundTime = 60;

/**
 * @type {number}
 */
energy.zombie.Game.prototype.score = 0;

/**
 * @type {number}
 */
energy.zombie.Game.prototype.timeLeft = -1;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.container = null;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.startButton = null;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.timerElement = null;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.overlay = null;

energy.zombie.Game.prototype.start = function() {
  this.startTime = new Date().getTime();
  clearInterval(this.updateInterval);
  this.update();
  this.score = 0;
  var scoreElement = goog.dom.getElement('score');
  goog.dom.setTextContent(scoreElement, '');

  this.updateInterval = setInterval(goog.bind(this.update, this), 20);
  setTimeout(goog.bind(this.stop, this), (this.roundTime - 1) * 1000);
};

energy.zombie.Game.prototype.stop = function() {
  this.startTime = 0;
  this.timeLeft = -1;
  goog.style.setStyle(this.startButton, 'display', 'block');
  goog.style.setStyle(this.overlay, 'display', 'block');
  goog.dom.setTextContent(this.timerElement, '');
};

energy.zombie.Game.prototype.draw = function() {
  goog.array.forEach(this.targets, function(target, index) {
    var targetContainer = goog.dom.createElement('div');
    var row = (Math.floor(index / 5) + 1);
    var col = index % 5;
    goog.dom.classes.add(targetContainer, 'target-container');

    goog.style.setStyle(targetContainer, {
      top: 120 * row + 25 + 'px',
      left: (120 * col) + 100 +  'px'
    });

    target.draw(targetContainer);
    goog.dom.appendChild(this.container, targetContainer);
  }, this);
};

energy.zombie.Game.prototype.update = function() {
  if (this.startTime != 0) {
    var sleeping = this.getSleepTargets();
    if (sleeping.length > 0) {
      goog.array.forEach(sleeping, function(target) {
        var extra = 0.02 * this.getProgress() / 100;
        var probability = (target.front ? 0.005 : .0007) + extra;
        if (!target.front && (new Date().getTime() - target.stopTime) < 500) {
          return;
        }
        if (Math.random() < probability) {
          target.rotate(Math.round(Math.random() * 5));
        }
      }, this);
    }

    var timeLeft = this.getTimeLeft();
    if (this.timeLeft != timeLeft) {
      this.timeLeft = timeLeft;
      goog.dom.setTextContent(this.timerElement, Math.max(0, this.roundTime - this.timeLeft));
    }
  } else {
    // close targets
    var active = this.getActiveTargets();
    if (active.length == 0) {
      clearTimeout(this.updateInterval);
    } else {
      goog.array.forEach(active, function(target) {
        if (!target.isRotating()) {
          target.rotate(1);
        }
      }, this);
    }
  }

  goog.array.forEach(this.targets, function(target) {
    target.update();
  }, this);
};

/**
 * @return {number}
 */
energy.zombie.Game.prototype.getTimeLeft = function() {
  var timeLeft = Math.round((new Date().getTime() - this.startTime) / 1000);

  timeLeft = Math.min(this.roundTime, timeLeft);
  timeLeft = Math.max(0, timeLeft);
  return timeLeft;
};

/**
 * @return {number}
 */
energy.zombie.Game.prototype.getProgress = function() {
  var timeLeft = this.getTimeLeft();
  return Math.round(timeLeft * 100 / this.roundTime);
};

/**
 * @return {goog.array.ArrayLike}
 */
energy.zombie.Game.prototype.getSleepTargets = function() {
  return goog.array.filter(this.targets, function(target) {
    return !target.isRotating();
  });
};

/**
 * @return {goog.array.ArrayLike}
 */
energy.zombie.Game.prototype.getActiveTargets = function() {
  return goog.array.filter(this.targets, function(target) {
    return target.isRotating() || !target.front;
  });
};

energy.zombie.Game.prototype.startListener = function() {
  goog.style.setStyle(this.startButton, 'display', 'none');
  goog.style.setStyle(this.overlay, 'display', 'none');

  this.start();
  return false;
};

/**
 * Application entry point
 */
window.onload = function() {
  new energy.zombie.Game();

  function fail() {return false;}
  document.oncontextmenu = fail;
  document.onmousedown = fail;
};