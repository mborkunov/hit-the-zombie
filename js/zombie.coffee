class Game
  container: null
  targets: []
  roundTime: 60
  score: 0
  highscore: 0
  timeLeft: -1

  constructor: ->
    Theme.init()
    Sound.init()
    this.container = document.getElementById('container')
    this.multiplier = new Multiplier

    this.targets.push new Target(this) for index in [0..14]
    this.draw()

    this.soundButton = this.addElement 'sound'
    this.startButton = this.addElement 'start'
    this.startButton.innerHTML = 'Start'
    this.startButton.addEventListener 'click', this.startListener.bind(this), false
    this.overlay = this.addElement 'overlay'
    this.timerElement = this.addElement 'timer'
    this.themeElement = this.addElement 'theme'
    this.themeElement.addEventListener 'click', (() -> Theme.next()), false

    this.scoreElement = this.addElement 'score'
    this.highScoreElement = this.addElement 'highscore'

    if localStorage?.getItem('highscore')
      this.highscore = parseInt localStorage.getItem('highscore'), 10
      this.showHighScore()

    this.container.className += ' sound-enabled' if Sound.enabled
  addElement: (cls)->
    element = document.createElement 'div'
    element.setAttribute 'class', cls
    this.container.appendChild element
  install: ->
  start: ->
    this.startTime = Date.now()
    clearInterval this.updateInterval
    this.update()
    this.score = 0
    this.scoreElement.innerHTML = ''
    this.multiplier.setProgress 0
    this.targets.forEach (target)-> target.listen()

    this.updateInterval = setInterval this.update.bind(this), 15
    setTimeout this.stop.bind(this), (this.roundTime - 1) * 1000
  stop: ->
    this.startTime = 0
    this.timeLeft = -1
    this.startButton.style.setProperty 'display', 'block', null
    this.overlay.style.setProperty 'display', 'block', null
    this.timerElement.innerHTML = ''
    this.setHighScore this.score if this.score > this.highscore
    this.multiplier.setProgress 0
    this.multiplier.factor = 1
    this.multiplier.updateText()
    this.targets.forEach (target)-> target.stopListening()
  draw: ->
    this.targets.forEach (target, i)->
      row = Math.floor(i / 5) + 1
      col = i % 5
      targetElement = target.draw()
      targetElement.style.setProperty 'top', 120 * row + 25 + 'px', null
      targetElement.style.setProperty 'left', 120 * col + 100 + 'px', null
      this.container.appendChild targetElement
  update: ->
    self = this;
    if this.startTime != 0
      this.getSleepTargets().forEach (target)->
        extra = 0.02 * self.getProgress() / 100
        probability = (target.front ? 0.005 : 0.0007) + extra
        target.flipRandomly true  if target.front && Math.random() < probability
    timeLeft = this.getTimeLeft()
    if this.timeLeft != timeLeft
      this.timeLeft = timeLeft
      this.timerElement.innerHTML = Math.max(0, this.roundTime - this.timeLeft).toString()
    else
      active = this.getActiveTargets()
      if active.length == 0
        clearTimeout(this.updateInterval)
      else
        active.filter((target)-> !target.rotating)
              .forEach((target)-> target.rotate(1))
    this.targets.forEach (target)->
      target.update()
    this.multiplier.update() if this.timeLeft > 0
  getTimeLeft: ->
    timeLeft = Math.round((Date.now() - this.startTime) / 1000)
    timeLeft = Math.min(this.roundTime, timeLeft)
    timeLeft = Math.max(0, timeLeft)
  getProgress: ->
    Math.round(this.getTimeLeft() * 100 / this.roundTime)
  getSleepTargets: ->
    this.targets.filter (target)->
      !target.rotating
  getActiveTargets: ->
    this.targets.filter (target)-> target.rotating || !target.front
  startListener: (e)->
    e.preventDefault()
    Sound.play 'start', 'ogg'

    this.startButton.style.setProperty 'display', 'none', null
    this.overlay.style.setProperty 'display', 'none', null

    this.start()
    false
  soundListener: (e)->
    Sound.setEnabled !Sound.enabled
    className
    if Sound.enabled
      className = 'sound on'
    else
      className = 'sound off'
    this.soundButton.className = className
    e.preventDefault()
    false
  setHighScore: (newHighscore) ->
    this.highscore = newHighscore
    localStorage.setItem 'highscore', this.highscore
    this.showHighScore this.highscore
  showHighScore: (highscore) ->
    this.highScoreElement.innerHTML = 'Highscore: ' + highscore

class Target
  @DELAY: 2000
  @DELTA_ANGLE: 15
  targetElement: null
  turns: null
  currentTurn: 0
  front: true
  rotating: false
  angle: 13
  started: 0

  constructor: (game) ->
    this.game = game
    this.clickListener = this.listener.bind this
  update: ->
    if this.rotating
      this.continueRotation()
    else if !this.front
      if this.started == 0
        this.started = Date.now()
        this.remainingElement.style.setProperty 'display', 'block', null
      if Date.now() - this.started > Target.DELAY
        this.hideRemaining()
        this.started = 0
        this.rotate 1
      else
        scaleX = (1 - (Date.now() - this.started) / Target.DELAY).toFixed 2
        this.remainingElement.style.setProperte 'transform', 'scale(' + scaleX + ', 1)', null
        this.remainingElement.style.setProperty '-webkit-transform', 'scale(' + scaleX + ', 1)', null
  flipRandomly: (even)->
    flips = Math.round(Math.random() * 5)
    number = flips % 2
    num = if even then 1 else 0
    if number == num
      this.rotate(flips)
    else
      this.rotate(flips + 1)
  continueRotation: ->
    this.angle %= 360 if this.angle >= 360

    if this.angle % 180 == 0
      this.currentTurn++
      this.rotating = false if this.currentTurn > this.turns

    if this.currentTurn <= this.turns
      className = this.targetElement.className
      if this.angle < 90 && this.angle + Target.DELTA_ANGLE >= 90
        className = className.replace('front', '')
        className = className.replace('target-hit', '')
        className = className.replace('target', '')
        className += ' target'
        this.front = false
        className += ' target-' + Math.ceil Math.random() * 3
      if this.angle < 270 && this.angle + Target.DELTA_ANGLE >= 270
        className = 'front target '
        #className = className.replace 'target-' + i, '' for i in [1..3]
        className = className.replace('target-hit', '');
        this.front = true
      this.targetElement.className = className.trim()
      this.angle += Target.DELTA_ANGLE
      if window.opera?
        this.targetElement.style.setProperty '-o-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180).toFixed(2) + ', 1)', null
      else if document.documentElement.style.WebkitTransform?
        this.targetElement.style.setProperty 'transform', 'rotateY(' + this.angle + 'deg)', null
      else if document.documentElement.style.MozTransform?
        this.targetElement.style.setProperty '-moz-transform', 'scale(' + Math.cos(this.angle * Math.PI / 180).toFixed(2) + ', 1)', null

  hideRemaining: ->
    this.remainingElement.style.removeProperty 'transform'
    this.remainingElement.style.removeProperty '-webkit-transform'
    this.remainingElement.style.removeProperty '-moz-transform'
    this.remainingElement.style.setProperty 'display', 'none', null
  listen: ->
    this.targetElement.addEventListener 'mousedown', this.clickListener, false
  stopListening: ->
    this.targetElement.removeEventListener 'mousedown', this.clickListener, false
  draw: ->
    this.targetElement = document.createElement 'div'
    this.targetElement.setAttribute 'class', 'target front'
    this.remainingElement = document.createElement 'div'
    this.remainingElement.className = 'remaining'
    this.targetElement.appendChild this.remainingElement
    this.targetElement
  rotate: (turns)->
    this.rotating = true
    this.turns = turns
    this.currentTurn = 0
  listener: (e)->
    score = this.game.score
    className = null;
    if this.front
      className = 'shrink'
      score = Math.max(0, this.game.score - 5)
      Sound.play 'fail', 'ogg'
      this.game.multiplier.miss()
    else
      className = 'grow'
      this.rotate 1
      score = this.game.score + 10 * this.game.multiplier.factor
      this.targetElement.className += ' target-hit'
      this.game.multiplier.hit()
      Sound.play 'hit', 'ogg'
      this.hideRemaining()

    if score != this.game.score
      this.game.score = score
      this.game.scoreElement.innerHTML = score
      this.game.scoreElement.className = 'score ' + className
    e.preventDefault()
    false

class Multiplier
  @MAX_FACTOR: 5
  factor: 0
  progress: 0
  textElement: null
  constructor: () ->
    this.textElement = document.getElementsByClassName('text')[0]
    this.textElement.innerHTML = "x1"
    this.progressElement = document.getElementsByClassName('progress')[0];
  update: ->
    if this.progress <= 0
      if this.factor > 1
        this.factor -= 1
        this.progress = 100
        this.updateText()
      else
        this.progress = 0
    else if this.progress > 0
      this.progress -= 0.1
    this.setProgress this.progress
  hit: ->
    if this.factor < Multiplier.MAX_FACTOR
      this.progress = this.progress + 10
      if this.progress >= 100
        this.progress %= 100
        this.factor += 1
        if this.factor >= Multiplier.MAX_FACTOR
          this.factor = Multiplier.MAX_FACTOR
          this.progress = 100
    else
      this.progress = Math.min this.progress + 10, 100
    this.setProgress(this.progress);
    this.updateText();
  miss: ->
    this.factor = 1
    this.progress = 0
    this.setProgress(0)
    this.updateText()
  setProgress: (progress) ->
    this.progress = progress;
    this.progressElement.style.setProperty 'width', this.progress + '%', null
  updateText: ->
    this.textElement.innerHTML = "x" + this.factor

class Theme
  @list: ['zombie', 'cat']
  @current: null
  @key: 'theme'
  @init: ->
    theme = localStorage?.getItem(@key)
    @current = (theme || @list[0])
    document.body.className = @current

  @next: ->
    index = @list.indexOf @current
    if index >= 0
      newIndex = (index + 1) % @list.length
      @current = newTheme = @list[newIndex]
      document.body.className = newTheme
      localStorage?.setItem(@key, newTheme)

class Sound
  @initialized: false,
  @enabled: true,
  @buffers: [],
  @ctx: null

  @init: ()->
    if !@initialized
      @initialized = true
      AudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext
      try
        @ctx = new AudioContext
        @enabled = !localStorage?.getItem('enabled')? || localStorage?.getItem('enabled') != false
      catch ignored
        @enabled = false

  @_playBuffer: (buffer)->
    if buffer
      source = @ctx.createBufferSource 0
      source.buffer = buffer
      source.connect @ctx.destination
      source.noteOn 0
  @play: (name, format)->
    if @enabled
      format = format || 'wav'

      if !@buffers[Theme.current]?
        @buffers[Theme.current] = {}
      if !@buffers[Theme.current][name]?
        xhr = new XMLHttpRequest
        xhr.open('get', 'sounds/' + Theme.current + '/' + name + '.' + format, true)
        xhr.responseType = 'arraybuffer'
        xhr.onload = ( ->
          @ctx.decodeAudioData(xhr.response, ((buffer) ->
            @buffers[Theme.current][name] = buffer
            @_playBuffer(buffer)
          ).bind(this)
          , (->
            console?.error('Cannot load sound buffer', arguments)
            @buffers[Theme.current][name] = null
          ).bind(this))
        ).bind(this)
        try
          xhr.send()
        catch ignored
  @setEnabled: (enabled)->
    @enabled = enabled
    localStorage?.setItem 'sound', enabled


document.addEventListener "DOMContentLoaded", () ->
  document.oncontextmenu = -> false
  document.onmousedown = -> false
  new Game;
, false