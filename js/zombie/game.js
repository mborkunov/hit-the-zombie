goog.provide('energy.zombie');
goog.provide('energy.zombie.Game');

goog.require('pl.Stats');
goog.require('energy.theme');
goog.require('energy.userAgent');
goog.require('energy.zombie.Target');
goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('goog.userAgent.product');


/**
 * @constructor
 */
energy.zombie.Game = function() {
  if (COMPILED) {
     pl.Stats.addGoogleAnalytics('UA-26880279-1');
  }

  if (goog.isDef(window['applicationCache']) && goog.isDef(window['applicationCache']['addEventListener'])) {
    window['applicationCache'].addEventListener('updateready', function() {
      window['applicationCache']['swapCache']();
      window.location.reload();
    }, false);
  }

  this.addElement('timer');
  this.addElement('score');
  this.addElement('highscore');
  this.addElement('sound');
  this.addElement('theme');
  this.addElement('overlay');

  energy.zombie.Game.prototype.container = goog.dom.getElement('game-container');
  energy.theme.init();

  for (var i = 0; i < 15; i++) {
    this.targets.push(new energy.zombie.Target(this));
  }
  this.draw();

  this.soundButton = goog.dom.getElement('sound');
  if (this.soundButton) {
    goog.events.listen(this.soundButton, goog.events.EventType.MOUSEDOWN, this.soundListener, true, this);
    goog.dom.classes.add(this.soundButton, energy.sound.isEnabled() ? 'on' : 'off');
  }

  this.startButton = goog.dom.getElement('start');
  goog.dom.setTextContent(this.startButton, 'Start');
  this.overlay = goog.dom.getElement('overlay');
  this.timerElement = goog.dom.getElement('timer');
  goog.events.listen(this.startButton, goog.events.EventType.MOUSEUP, this.startListener, true, this);

  var themeSwitcher = goog.dom.getElement('theme');
  if (themeSwitcher) {
    goog.events.listen(themeSwitcher, goog.events.EventType.MOUSEDOWN, this.themeSwitcherListener, true, this);
  }

  var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};

  if (localStorage) {
    if (localStorage.getItem('highscore')) {
      this.highscore = parseInt(localStorage.getItem('highscore'), 10);
      this.showHighScore(this.highscore);
    }
  }

  if (energy.userAgent.ANDROID) {
    goog.dom.classes.add(document.body, 'android');
  }
  if (energy.userAgent.IPAD) {
    goog.dom.classes.add(document.body, 'ipad');
  }
  if (energy.userAgent.CHROME) {
    goog.dom.classes.add(document.body, 'chrome');
  }
  if (energy.userAgent.SAFARI) {
    goog.dom.classes.add(document.body, 'safari');
  }
  if (energy.userAgent.WEBKIT) {
    goog.dom.classes.add(document.body, 'webkit');
  }
  if (energy.userAgent.GECKO) {
    goog.dom.classes.add(document.body, 'gecko');
  }
  if (energy.userAgent.FIREFOX) {
    goog.dom.classes.add(document.body, 'firefox');
  }
  if (energy.userAgent.OPERA) {
    goog.dom.classes.add(document.body, 'opera');
  }
  if (energy.userAgent.IE) {
    goog.dom.classes.add(document.body, 'ie');
  }

  if (energy.userAgent.CHROME) {
    if (!window['chrome']['app']['isInstalled']) {
      var installButton = goog.dom.getElement('install-button');
      if (installButton) {
        goog.style.setStyle(installButton, 'display', 'block');
        goog.events.listen(installButton, goog.events.EventType.MOUSEDOWN, this.install, true, this);
      }
    }
  }
};

energy.zombie.Game.prototype.addElement = function(id) {
  var element = goog.dom.createElement('div');
  element.setAttribute('id', id);
  goog.dom.getElement('game-container').appendChild(element);
};

/**
 * @type {goog.array.ArrayLike}
 */
energy.zombie.Game.prototype.targets = [];

/**
 * @type {number}
 */
energy.zombie.Game.prototype.roundTime = 60; //test


/**
 * @type {number}
 */
energy.zombie.Game.prototype.score = 0;

/**
 * @type {number}
 */
energy.zombie.Game.prototype.highscore = 0;

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
energy.zombie.Game.prototype.soundButton = null;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.timerElement = null;

/**
 * @type {Element}
 */
energy.zombie.Game.prototype.overlay = null;

energy.zombie.Game.prototype.install = function() {
  var link = goog.dom.getElement('chrome-link').getAttribute('href');
  window['chrome']['webstore']['install'](link, function() {
    var installButton = goog.dom.getElement('install-button');
    if (installButton) {
      goog.style.setStyle(installButton, 'display', 'none');
    }
  });
};

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
  if (this.score > this.highscore) {
    this.setHighScore(this.score);
  }
};

energy.zombie.Game.prototype.draw = function() {
  goog.array.forEach(this.targets, function(target, index) {
    var targetContainer = goog.dom.createElement('div');
    var row = (Math.floor(index / 5) + 1);
    var col = index % 5;
    goog.dom.classes.add(targetContainer, 'target-container');

    goog.style.setStyle(targetContainer, {
      top: 120 * row + 25 + 'px',
      left: (120 * col) + 100 + 'px'
    });

    target.draw(targetContainer);
    goog.dom.appendChild(this.container, targetContainer);
  }, this);
};

energy.zombie.Game.prototype.update = function() {
  if (this.startTime != 0) {
    var sleeping = this.getSleepTargets();
    if (sleeping.length > 0) {
      goog.array.forEach(sleeping, function(/**energy.zombie.Target*/target) {
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
      goog.dom.setTextContent(this.timerElement, Math.max(0, this.roundTime - this.timeLeft).toString());
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

energy.zombie.Game.prototype.startListener = function(e) {
  e.preventDefault();
  energy.sound.play('start', 'ogg');
  goog.style.setStyle(this.startButton, 'display', 'none');
  goog.style.setStyle(this.overlay, 'display', 'none');

  this.start();
  return false;
};

energy.zombie.Game.prototype.soundListener = function(e) {
  e.preventDefault();
  energy.sound.setEnabled(!energy.sound.isEnabled());
  if (energy.sound.isEnabled()) {
    goog.dom.classes.add(this.soundButton, 'on');
    goog.dom.classes.remove(this.soundButton, 'off');
  } else {
    goog.dom.classes.add(this.soundButton, 'off');
    goog.dom.classes.remove(this.soundButton, 'on');
  }
  return false;
};

energy.zombie.Game.prototype.themeSwitcherListener = function(e) {
  e.preventDefault();
  energy.theme.nextTheme();
};

energy.zombie.Game.prototype.setHighScore = function(newHighscore) {
  this.highscore = newHighscore;
  var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};
  localStorage.setItem('highscore', this.highscore);
  this.showHighScore(this.highscore);
};

energy.zombie.Game.prototype.showHighScore = function(highscore) {
  var highScoreElement = goog.dom.getElement('highscore');
  goog.dom.setTextContent(highScoreElement, 'Highscore: ' + this.highscore);
};

/*
energy.zombie.Game.prototype.authenticate = function() {
  var config = {
    'client_id': '553794839019.apps.googleusercontent.com',
    'scope': 'https://www.googleapis.com/auth/plus.me'
  };
  gapi['auth']['authorize'](config, function(authResult) {
    if (authResult) {
      console.log('login complete');
      console.log(gapi['auth']['getToken']());
      gapi['client']['load']('plus', 'v1', function() {
        var request = gapi['client']['plus']['people']['get']({
          'userId': 'me'
        });
        request.execute(function(response) {
          console.log(response);
          */
/*var heading = document.createElement('h4');
          var image = document.createElement('img');
          image.src = resp.image.url;
          heading.appendChild(image);
          heading.appendChild(document.createTextNode(resp.displayName));

          document.getElementById('content').appendChild(heading);*//*

        });
      });
    } else {
      console.log('cannot login');
    }
  });
};
*/

/**
 * Application entry point
 */
window.onload = function() {
  new energy.zombie.Game();

  function fail() {return false;}
  document.oncontextmenu = fail;
  document.onmousedown = fail;
  document.ontouchmove = function(e) {
     e.preventDefault();
  }
};
