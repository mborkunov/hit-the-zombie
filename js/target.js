goog.provide('energy.zombie.Target');


goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.userAgent');


/**
 * @constructor
 */
energy.zombie.Target = function(game) {
  this.game = game;
};

/**
 * @type {Element}
 */
energy.zombie.Target.prototype.targetElement = null;

/**
 * @type {energy.zombie.Game}
 */
energy.zombie.Target.prototype.game = null;

/**
 * @type {number}
 */
energy.zombie.Target.angleIncrese = 15;

/**
 * @type {number}
 */
energy.zombie.Target.prototype.turns = 0;


/**
 * @type {number}
 */
energy.zombie.Target.prototype.stopTime = 0;


/**
 * @type {number}
 */
energy.zombie.Target.prototype.currentTurn = 0;

/**
 * @type {boolean}
 */
energy.zombie.Target.prototype.front = true;


/**
 * @type {boolean}
 */
energy.zombie.Target.prototype.rotating = false;

/**
 * @type {number}
 */
energy.zombie.Target.prototype.angle = 0;

energy.zombie.Target.prototype.update = function() {
  if (this.rotating) {
    this.continueRotating();
  }
};

energy.zombie.Target.prototype.continueRotating = function() {
  if (this.angle >= 360) {
    this.angle %= 360;
  }

  if (this.angle % 180 == 0) {
    this.currentTurn++;
    if (this.currentTurn > this.turns) {
      this.stopTime = new Date().getTime();
      this.rotating = false;
    }
  }

  if (this.currentTurn <= this.turns) {
    if (this.angle < 90 && this.angle + energy.zombie.Target.angleIncrese >= 90) {
      goog.dom.classes.remove(this.targetElement, 'front');
      goog.dom.classes.remove(this.targetElement, 'zombie-dead');
      goog.dom.classes.add(this.targetElement, 'zombie');

      var number = Math.ceil(Math.random() * 3)
      goog.dom.classes.add(this.targetElement, 'zombie-' + number);
      this.front = false;
    }
    if (this.angle < 270 && this.angle + energy.zombie.Target.angleIncrese >= 270) {
      goog.dom.classes.add(this.targetElement, 'front');
      goog.dom.classes.remove(this.targetElement, 'zombie');
      goog.dom.classes.remove(this.targetElement, 'zombie-1');
      goog.dom.classes.remove(this.targetElement, 'zombie-2');
      goog.dom.classes.remove(this.targetElement, 'zombie-3');
      goog.dom.classes.remove(this.targetElement, 'zombie-dead');
      this.front = true;
    }

    if (goog.userAgent.WEBKIT) {
      goog.style.setStyle(this.targetElement, '-webkit-transform', 'rotateY(' + this.angle + 'deg)');
    } else if (goog.userAgent.GECKO) {
      goog.style.setStyle(this.targetElement, '-moz-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');
    } else {
      goog.style.setStyle(this.targetElement, '-o-transform', 'scaleX(' + Math.cos(this.angle * Math.PI / 180) + ')');
    }

    this.angle += energy.zombie.Target.angleIncrese;
  }
};

energy.zombie.Target.prototype.draw = function(container) {
  this.targetElement = goog.dom.createElement('div');
  goog.dom.classes.add(this.targetElement, 'target');
  goog.dom.classes.add(this.targetElement, 'front');
  goog.dom.appendChild(container, this.targetElement);

  //goog.events.listen(container, goog.events.EventType.TOUCHSTART, this.listener, true, this);
  goog.events.listen(container, goog.events.EventType.MOUSEDOWN, this.listener, true, this);
  /*if (goog.userAgent.MOBILE) {
    goog.events.listen(container, goog.events.EventType.MOUSEDOWN, this.listener, true, this);
  } else {
    goog.events.listen(container, goog.events.EventType.TOUCHSTART, this.listener, true, this);
  }*/
};

/**
 * @return {boolean}
 */
energy.zombie.Target.prototype.isRotating = function() {
  return this.rotating;
};

energy.zombie.Target.prototype.rotate = function(turns) {
  this.rotating = true;
  this.turns = turns;
  this.currentTurn = 0;
  goog.style.setStyle(this.targetElement, 'background-color', '#fff');
};


energy.zombie.Target.prototype.listener = function(e) {
  var score = this.game.score;
  var color = null;
  if (this.front) {
    color = 'red';
    score = Math.max(0, this.game.score - 5);
  } else {
    if (!this.rotating) {
      color = 'green';
      this.rotate(1, 500, null);
      score = this.game.score + 10;
      goog.dom.classes.add(this.targetElement, 'zombie-dead');
    } else {
      color = 'silver';
    }
  }

  if (score != this.score) {
    this.game.score = score;
    var scoreElement = goog.dom.getElement('score');
    goog.dom.setTextContent(scoreElement, score);
    goog.style.setStyle(scoreElement, 'color', color);
  }
  return false;
};