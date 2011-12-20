goog.provide('energy.zombie.Target');


goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');

goog.require('energy.sound');

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
  var className = 'target';

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
      goog.dom.classes.remove(this.targetElement, 'target-hit');
      goog.dom.classes.add(this.targetElement, 'target');

      var number = Math.ceil(Math.random() * 3);
      goog.dom.classes.add(this.targetElement, className + '-' + number);
      this.front = false;
    }
    if (this.angle < 270 && this.angle + energy.zombie.Target.angleIncrese >= 270) {
      goog.dom.classes.add(this.targetElement, 'front target');
      //goog.dom.classes.remove(this.targetElement, 'target');
      for (var i = 1; i <=3; i++) {
        goog.dom.classes.remove(this.targetElement, 'target-' + i);
      }
      goog.dom.classes.remove(this.targetElement, 'target-hit');

      this.front = true;
    }

    if (goog.userAgent.WEBKIT) {
      goog.style.setStyle(this.targetElement, '-webkit-transform', 'rotateY(' + this.angle + 'deg)');
    } else if (goog.userAgent.GECKO) {
      goog.style.setStyle(this.targetElement, '-moz-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');
    } else if (goog.userAgent.IE) {
      goog.style.setStyle(this.targetElement, '-ms-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');
    } else {
      goog.style.setStyle(this.targetElement, '-o-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');
    }

    this.angle += energy.zombie.Target.angleIncrese;
  }
};

energy.zombie.Target.prototype.draw = function(container) {
  this.targetElement = goog.dom.createElement('div');
  goog.dom.classes.add(this.targetElement, 'target');
  goog.dom.classes.add(this.targetElement, 'front');
  goog.dom.appendChild(container, this.targetElement);

  if (goog.userAgent.product.IPAD || goog.userAgent.product.ANDROID) {
    goog.events.listen(container, goog.events.EventType.TOUCHSTART, this.listener, true, this);
  } else {
    goog.events.listen(container, goog.events.EventType.MOUSEDOWN, this.listener, true, this);
  }
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
};


energy.zombie.Target.prototype.listener = function(e) {
  if (!e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) return;
  var score = this.game.score;
  var className = null;
  if (this.front) {
    className = 'shrink';
    score = Math.max(0, this.game.score - 5);
    energy.sound.play("fail", 'ogg');
  } else {
    className = 'grow';
    this.rotate(1);
    score = this.game.score + 10;
    goog.dom.classes.add(this.targetElement, 'target-hit');
    energy.sound.play('hit', 'ogg');
  }

  if (score != this.score) {
    this.game.score = score;
    var scoreElement = goog.dom.getElement('score');
    goog.dom.setTextContent(scoreElement, score);
    scoreElement.className = '';
    goog.dom.classes.add(scoreElement, className);
  }
  e.preventDefault();
  return false;
};