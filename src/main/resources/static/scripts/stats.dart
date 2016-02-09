import 'dart:html';
import 'dart:js';
import 'dart:convert';
import 'game.dart';

class Stats {

  static int _hit = 0;
  static int _miss = 0;
  static int click = 0;

  static int get hit => _hit;
  static int get miss => _miss;

  static set hit(int i) {
    click++;
    _hit = i;
  }

  static set miss(int i) {
    click++;
    _miss = i;
  }

  static reset() {
    _hit = _miss = click = 0;
    DivElement stats = querySelector(".stats");
    if (stats != null) {
      stats.style.display = "none";
    }
    Element board = querySelector(".board");
    if (board != null) {
      board.style.display = "none";
    }
  }

  static show(DivElement startButton, int score, Duration elapsed) {
    DivElement stats = querySelector(".stats");

    if (stats == null) {
      stats = new DivElement();
      stats.classes.add("stats");
      startButton.parentNode.insertBefore(stats, startButton);
    }
    stats.style.display = "block";


    var accuracy = "-";
    if (Stats.click > 0) {
      accuracy = Stats.hit / Stats.click * 100;
      accuracy = accuracy.round();
    }
    var time = elapsed.inSeconds;

    int apm = (60 * (Stats.hit + Stats.miss) / Game.ROUND_TIME).round();
    stats.innerHtml = """
      <span class="label short">APM:</span> <span class="value">${apm}</span>
      <span class="label short">Hits:</span> <span class="value">${Stats.hit}</span><br/>
      <span class="label short">Time:</span> <span class="value">${time}s</span>
      <span class="label">Misses:</span> <span class="value">${Stats.miss}</span><br/>
      <span class="label">Accuracy:</span> <span class="value">${accuracy}</span><br/>
     """;

    if (score > 0) {
      var name = '';
      if (!window.localStorage.containsKey('name')) {
        name = context.callMethod('prompt', ['Enter your name!']);
        if (name.isEmpty) {
          name = 'nobody';
        }
        window.localStorage['name'] = name;
      }

      var data = {
        'name': window.localStorage['name'],
        'score': score.toString(),
        'accuracy': accuracy.toString(),
        'time' : elapsed.inSeconds.toString()
      };
      HttpRequest.postFormData('./score/', data).then((HttpRequest resp) {
        showHighScore(startButton, JSON.decode(resp.response));
      });
    }
  }

  static showHighScore(DivElement startButton, List data) {
    OListElement board = querySelector(".board");

    if (board == null) {
      board = new OListElement();
      board.classes.add('board');
      startButton.parentNode.append(board);
    }

    board.innerHtml = '';
    data.forEach((item) {
      board.appendHtml("<li>${item['value']} (${item['accuracy']}%) - ${item['name']} - ${item['time']}s</li>");
    });
    board.style.display = 'block';
  }
}