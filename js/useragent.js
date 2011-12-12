goog.provide('energy.userAgent');

goog.require('goog.userAgent');


energy.userAgent.STRING = goog.userAgent.getUserAgentString();
energy.userAgent._detected = false;

energy.userAgent.ANDROID = false;
energy.userAgent.IPAD    = false;
energy.userAgent.IPHONE  = false;


energy.userAgent.WINDOWS = false;
energy.userAgent.LINUX   = false;
energy.userAgent.MAC     = false;
energy.userAgent.X11     = false;

energy.userAgent.FIREFOX = false;
energy.userAgent.CHROME  = false;
energy.userAgent.SAFARI  = false;
energy.userAgent.OPERA   = false;
energy.userAgent.IE      = false;
energy.userAgent.CAMINO  = false;

energy.userAgent.GECKO   = false;
energy.userAgent.WEBKIT  = false;


energy.userAgent.detect = function() {
  energy.userAgent._detected = true;

  var ua = energy.userAgent.STRING;

  if (ua.indexOf('Android') != -1) {
    energy.userAgent.ANDROID = true;
  }
  if (ua.indexOf('iPad') != -1) {
    energy.userAgent.IPAD = true;
  }
  if (ua.indexOf('iPhone') != -1) {
    energy.userAgent.IPHONE = true;
  }

  if (ua.indexOf('Chrome') != -1) {
    energy.userAgent.CHROME = true;
  }
  if (ua.indexOf('Safari') != -1) {
    energy.userAgent.SAFARI = true;
  }
  if (ua.indexOf('Firefox') != -1) {
    energy.userAgent.FIREFOX = true;
  }

  if (goog.userAgent.GECKO) {
    energy.userAgent.GECKO = true;
  }

  if (ua.indexOf('WebKit') != -1) {
    energy.userAgent.WEBKIT = true;
  }

  if (ua.indexOf('Opera') != -1) {
    energy.userAgent.OPERA = true;
  }
};


if (!energy.userAgent._detected) {
  energy.userAgent.detect();
}
