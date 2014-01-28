var Range = require('./range');

var Phantom = Range.extend(
  function initialize(options) {
    initialize.super$.call(this, $.extend({
      readonly: true,
      label: '+'
    }, options));
    this.$el.addClass('elessar-phantom');
  },

  function mousedown(ev) {
    if(ev.which === 1) { // left mouse button
      var startX = ev.pageX;
      var newRange = options.parent.addRange($el.val());
      $el.remove();
      this.options.parent.trigger('addrange', [newRange.val(), newRange]);
      newRange.find('.elessar-handle:first-child').trigger('mousedown');
    }
  }
);

module.exports = Phantom;