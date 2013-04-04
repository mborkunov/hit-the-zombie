(function () {
  "use strict";

  function Game() {
    this.container = document.getElementsByClassName('game-container')[0];

    this.targets = [];
    this.roundTime = 60;
    this.score = 0;
    this.highscore = 0;
    this.timeLeft = -1;
  }

  Game.prototype.init = function() {
    this.scoreElement = this.addElement('score');
    this.highScoreElement = this.addElement('highscore');

    Sound.init();
    Theme.init();

    this.multiplier = new Multiplier();

    for (var i = 0; i < 15; i++) {
      this.targets.push(new Target(this));
    }
    this.draw();

    this.soundButton = this.addElement('sound');
    this.soundButton.addEventListener('click', this.soundListener.bind(this), false);
    this.soundButton.className = 'sound ' + (Sound.enabled ? 'on' : 'off');

    this.startButton = document.getElementsByClassName('start')[0];
    this.startButton.innerHTML = 'Start';
    this.startButton.addEventListener('click', this.startListener.bind(this), false);

    this.overlay = this.addElement('overlay');
    this.timerElement = this.addElement('timer');

    this.addElement('theme').addEventListener('click', this.themeSwitcherListener.bind(this), false);

    if (localStorage) {
      if (localStorage.getItem('highscore')) {
        this.highscore = parseInt(localStorage.getItem('highscore'), 10);
        this.showHighScore(this.highscore);
      }
    }

    if (false && 'chrome' in window && typeof(window.chrome.webstore.install) !== 'undefined' && !window.chrome.app.isInstalled) {
      var installButton = document.getElementsByClassName('install-button')[0];
      if (installButton) {
        installButton.style.setProperty('display', 'block', null);
        installButton.addEventListener('click', this.install, false);
      }
    }
    if (Sound.enabled) {
      this.container.className += ' sound-enabled';
    }
  };

  Game.prototype.addElement = function(cls) {
    var element = document.createElement('div');
    element.setAttribute('class', cls);
    this.container.appendChild(element);
    return element;
  };


  Game.prototype.install = function() {
    var link = document.getElementById('chrome-link').getAttribute('href');
    window.chrome.webstore.install(link, function() {
      var installButton = document.getElementsByClassName('install-button')[0];
      if (installButton) {
        installButton.style.setProperty('display', 'none', null);
      }
    });
  };

  Game.prototype.start = function() {
    this.startTime = Date.now();
    clearInterval(this.updateInterval);
    this.update();
    this.score = 0;
    this.scoreElement.innerHTML = '';
    this.multiplier.setProgress(0);
    this.targets.forEach(function(target) {
      target.listen();
    });

    this.updateInterval = setInterval(this.update.bind(this), 10);
    setTimeout(this.stop.bind(this), (this.roundTime - 1) * 1000);
  };

  Game.prototype.stop = function() {
    this.startTime = 0;
    this.timeLeft = -1;
    this.startButton.style.setProperty('display', 'block', null);
    this.overlay.style.setProperty('display', 'block', null);
    this.timerElement.innerHTML = '';
    if (this.score > this.highscore) {
      this.setHighScore(this.score);
    }
    this.multiplier.setProgress(0);
    this.multiplier.factor = 1;
    this.multiplier.updateText();
    this.targets.forEach(function(target) {
      target.stopListening();
    });
  };

  Game.prototype.draw = function() {
    for (var i = 0, length = this.targets.length; i < length; i++) {
      var target = this.targets[i];
      var row = (Math.floor(i / 5) + 1);
      var col = i % 5;
      var targetElement = target.draw();
      targetElement.style.setProperty('top', 120 * row + 25 + 'px', null);
      targetElement.style.setProperty('left', 120 * col + 100 + 'px', null);

      this.container.appendChild(targetElement);
    }
  };

  Game.prototype.update = function() {
    var self = this;
    if (this.startTime !== 0) {
      this.getSleepTargets().forEach(function(target) {
        var extra = 0.02 * self.getProgress() / 100;
        var probability = (target.front ? 0.005 : 0.0007) + extra;
        if (target.front && Math.random() < probability) {
          target.flipRandomly(true);
        }
      });

      var timeLeft = this.getTimeLeft();
      if (this.timeLeft !== timeLeft) {
        this.timeLeft = timeLeft;
        this.timerElement.innerHTML = Math.max(0, this.roundTime - this.timeLeft).toString();
      }
    } else {
      // close targets
      var active = this.getActiveTargets();
      if (active.length === 0) {
        clearTimeout(this.updateInterval);
      } else {
        active.filter(function(target) {
          return !target.rotating;
        }).forEach(function(target) {
          target.rotate(1);
        });
      }
    }
    this.targets.forEach(function(target) {
      target.update();
    });
    if (this.timeLeft > 0) {
      this.multiplier.update();
    }
  };

  Game.prototype.getTimeLeft = function() {
    var timeLeft = Math.round((new Date().getTime() - this.startTime) / 1000);

    timeLeft = Math.min(this.roundTime, timeLeft);
    timeLeft = Math.max(0, timeLeft);
    return timeLeft;
  };

  Game.prototype.getProgress = function() {
    var timeLeft = this.getTimeLeft();
    return Math.round(timeLeft * 100 / this.roundTime);
  };

  Game.prototype.getSleepTargets = function() {
    return this.targets.filter(function(target) {
      return !target.rotating;
    });
  };

  Game.prototype.getActiveTargets = function() {
    return this.targets.filter(function(target) {
      return target.rotating || !target.front;
    });
  };

  Game.prototype.startListener = function(e) {
    e.preventDefault();
    Sound.play('start', 'ogg');

    this.startButton.style.setProperty('display', 'none', null);
    this.overlay.style.setProperty('display', 'none', null);

    this.start();
    return false;
  };

  Game.prototype.soundListener = function(e) {
    Sound.setEnabled(!Sound.enabled);
    var className;
    if (Sound.enabled) {
      className = 'sound on';
    } else {
      className = 'sound off';
    }
    this.soundButton.className = className;
    e.preventDefault();
    return false;
  };

  Game.prototype.themeSwitcherListener = function(e) {
    e.preventDefault();
    Theme.nextTheme();
  };

  Game.prototype.setHighScore = function(newHighscore) {
    this.highscore = newHighscore;
    localStorage.setItem('highscore', this.highscore);
    this.showHighScore(this.highscore);
  };

  Game.prototype.showHighScore = function(highscore) {
    this.highScoreElement.innerHTML = 'Highscore: ' + highscore;
  };


  function Target(game) {
    this.game = game;
    this.targetElement = null;
    this.turns = 0;
    this.currentTurn = 0;
    this.front = true;
    this.rotating = false;
    this.angle = 0;
    this.started = 0;

    this.clickListener = this.listener.bind(this);
  }

  Target.targetDelay = 2000;
  Target.angleIncrease = 5;

  Target.prototype.update = function () {
    if (this.rotating) {
      this.continueRotating();
    } else {
      if (!this.front) {
        if (this.started === 0) {
          this.started = Date.now();
          this.remainingElement.style.setProperty('display', 'block', null);
        }
        if (Date.now() - this.started > Target.targetDelay) {
          this.hideRemaining();
          this.started = 0;
          this.rotate(1);
        } else {
          var scaleX = (1 - (Date.now() - this.started) / Target.targetDelay).toFixed(2);
          this.remainingElement.style.setProperty('transform', 'scale(' + scaleX + ', 1)', null);
          this.remainingElement.style.setProperty('-webkit-transform', 'scale(' + scaleX + ', 1)', null);
        }
      }
    }
  };

  Target.prototype.flipRandomly = function(even) {
    var flips = Math.round(Math.random() * 5);
    this.rotate(flips % 2 === (even ? 1 : 0) ? flips : flips + 1);
  };

  Target.prototype.continueRotating = function () {
    if (this.angle >= 360) {
      this.angle %= 360;
    }

    if (this.angle % 180 === 0) {
      this.currentTurn++;
      if (this.currentTurn > this.turns) {
        this.rotating = false;
      }
    }


    if (this.currentTurn <= this.turns) {
      var className = this.targetElement.className;
      if (this.angle < 90 && this.angle + Target.angleIncrease >= 90) {
        className = className.replace('front', '');
        className = className.replace('target-hit', '');
        className = className.replace('target', '');
        className += ' target';
        this.front = false;
        className += ' target-' + Math.ceil(Math.random() * 3);
      }
      if (this.angle < 270 && this.angle + Target.angleIncrease >= 270) {
        className = 'front target ';
        for (var i = 1; i <= 3; i++) {
          className = className.replace('target-' + i, '');
        }
        className = className.replace('target-hit', '');
        this.front = true;
      }
      this.targetElement.className = className.trim();
      if ('opera' in window) {
        this.targetElement.style.setProperty('-o-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180).toFixed(2) + ', 1)', null);
      } else if ('WebkitTransform' in document.documentElement.style) {
        this.targetElement.style.setProperty('-webkit-transform', 'rotateY(' + this.angle + 'deg)', null);
      } else if ('MozTransform' in document.documentElement.style) { // || goog.userAgent.GECKO
        this.targetElement.style.setProperty('-moz-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180).toFixed(2) + ', 1)', null);
      /*
        goog.style.setStyle(this.targetElement, 'msTransform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');
      } else {
        goog.style.setStyle(this.targetElement, '-o-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180) + ', 1)');*/
      }

      this.angle += Target.angleIncrease;
    }
  };

  Target.prototype.hideRemaining = function() {
    this.remainingElement.style.removeProperty('transform');
    this.remainingElement.style.removeProperty('-webkit-transform');
    this.remainingElement.style.removeProperty('-moz-transform');
    this.remainingElement.style.setProperty('display', 'none', null);
  };

  Target.prototype.listen = function() {
    this.targetElement.addEventListener('mousedown', this.clickListener, false);
  };

  Target.prototype.stopListening = function() {
    this.targetElement.removeEventListener('mousedown', this.clickListener, false);
  };

  Target.prototype.draw = function () {
    this.targetElement = document.createElement('div');
    this.targetElement.setAttribute('class', 'target front');

    this.remainingElement = document.createElement('div');
    this.remainingElement.className = 'remaining';

    this.targetElement.appendChild(this.remainingElement);

    return this.targetElement;
  };

  Target.prototype.rotate = function (turns) {
    this.rotating = true;
    this.turns = turns;
    this.currentTurn = 0;
  };


  Target.prototype.listener = function (e) {
    var score = this.game.score;
    var className = null;
    if (this.front) {
      className = 'shrink';
      score = Math.max(0, this.game.score - 5);
      Sound.play('fail', 'ogg');
      this.game.multiplier.miss();
    } else {
      className = 'grow';
      this.rotate(1);
      score = this.game.score + 10 * this.game.multiplier.factor;
      this.targetElement.className += ' target-hit';
      this.game.multiplier.hit();
      Sound.play('hit', 'ogg');
      this.hideRemaining();
    }

    if (score !== this.game.score) {
      this.game.score = score;
      this.game.scoreElement.innerHTML = score;
      this.game.scoreElement.className = 'score ' + className;
    }
    e.preventDefault();
    return false;
  };


  function Multiplier() {
    this.factor = 1;
    this.progress = 0;

    this.textElement = document.getElementsByClassName('text')[0];
    this.textElement.innerHTML = "x1";
    this.progressElement = document.getElementsByClassName('progress')[0];
  }

  Multiplier.MAX_FACTOR = 5;

  Multiplier.prototype.hit = function() {
    if (this.factor < Multiplier.MAX_FACTOR) {
      this.progress = this.progress + 10;
      if (this.progress >= 100) {
        this.progress %= 100;
        this.factor += 1;
        if (this.factor >= Multiplier.MAX_FACTOR) {
          this.factor = Multiplier.MAX_FACTOR;
          this.progress = 100;
        }
      }
    } else {
      this.progress = Math.min(this.progress + 10, 100);
    }
    this.setProgress(this.progress);
    this.updateText();
  };

  Multiplier.prototype.update = function() {
    if (this.progress <= 0) {
      if (this.factor > 1) {
        this.factor -= 1;
        this.progress = 100;
        this.updateText();
      } else {
        this.progress = 0;
      }
    } else if (this.progress > 0) {
      this.progress -= 0.1;
    }
    this.setProgress(this.progress);
  };

  Multiplier.prototype.updateText = function() {
    this.textElement.innerHTML = "x" + this.factor;
  };

  Multiplier.prototype.miss = function() {
    this.factor = 1;
    this.progress = 0;
    this.setProgress(0);
    this.updateText();
  };

  Multiplier.prototype.setProgress = function(progress) {
    this.progressElement.style.setProperty('width', progress + '%', null);
  };

  var Theme = {
    list: ['zombie', 'cat']
  };

  Theme.current = Theme.list[0];

  Theme.init = function() {
    if (localStorage) {
      var _theme = localStorage.getItem('theme');
      if (_theme) {
        Theme.current = _theme.toString();
      }
    }
    document.body.className = Theme.current;
  };

  Theme.nextTheme = function() {
    var index = Theme.list.indexOf(Theme.current);
    if (index >= 0) {
      var newIndex = (index + 1) % Theme.list.length;
      var newTheme = Theme.list[newIndex];
      document.body.className = newTheme;
      Theme.current = newTheme;

      if (localStorage) {
        localStorage.setItem('theme', newTheme);
      }
    }
  };


  var Sound = {
    initialized: false,
    enabled: true,
    _buffers: [],
    ctx: null
  };

  Sound.play = function(name, format) {
    if (!Sound.enabled) {
      return;
    }
    format = format || 'wav';
    if (typeof (Sound._buffers[Theme.current]) === 'undefined') {
      Sound._buffers[Theme.current] = {};
    }
    if (typeof (Sound._buffers[Theme.current][name]) === 'undefined') {
      var xhr = new XMLHttpRequest();
      xhr.open('get', 'sounds/' + Theme.current + '/' + name + '.' + format, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        Sound.ctx.decodeAudioData(xhr.response, function(buffer) {
          Sound._buffers[Theme.current][name] = buffer;
          Sound._playBuffer(buffer);
        }, function() {
          var console = window.console || {error: function(){}};
          console.error('Cannot load sound buffer', arguments);
          Sound._buffers[Theme.current][name] = null;
        });
      };
      try {
        xhr.send();
      } catch (ignore) {
        //cannot request sound file
      }
    } else {
      Sound._playBuffer(Sound._buffers[Theme.current][name]);
    }
  };

  Sound._playBuffer = function(buffer) {
    if (buffer) {
      var source = Sound.ctx.createBufferSource(0);
      source.buffer = buffer;
      source.connect(Sound.ctx.destination);
      source.noteOn(0);
    }
  };

  Sound.setEnabled = function(enabled) {
    localStorage.setItem('sound', enabled);
    Sound.enabled = enabled;
  };


  Sound.init = function() {
    if (!Sound.initialized) {
      Sound.initialized = true;
      var AudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;
      try {
        Sound.ctx = new AudioContext();
        Sound.enabled = (!(localStorage.getItem('sound') !== null && localStorage.getItem('sound') === 'false'));
      } catch (ignored) {
        Sound.enabled = false;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    function emptyFunction() {return false;}
    document.oncontextmenu = emptyFunction;
    document.onmousedown = emptyFunction;
    document.ontouchmove = function(e) {
      e.preventDefault();
    };
    new Game().init();
  }, false);
})();
