var Element = require('./element');
var Range = require('./range');
var Phantom = require('./phantom');
var Indicator = require('./indicator');
var $ = require('jquery');

var RangeBar = Element.extend(
  function initialize(options) {
    initialize.super$.call(this, '<div class="elessar-rangebar">');
    this.options = $.extend({}, RangeBar.defaults, options);
    this.options.min = options.valueParse(options.min);
    this.options.max = options.valueParse(options.max);
    if(this.options.barClass) this.$el.addClass(this.options.barClass);

    this.ranges = [];
    this.on('mousemove', $.proxy(this.mousemove, this));
    this.on('mouseleave', $.proxy(this.removePhantom, this));

    if(options.values) this.setVal(options.values);

    for(var i = 0; i < options.bgLabels; ++i) {
      this.addLabel(i / options.bgLabels);
    }
    var self = this;

    if(options.indicator) {
      var indicator = this.indicator = new Indicator({
        parent: this,
        indicatorClass: options.indicatorClass
      });
      indicator.val(this.abnormalise(options.indicator(this, indicator, function() {
        indicator.val(self.abnormalise(options.indicator(self, indicator)));
      })));
      this.$el.append(indicator);
    }
  },

  function normaliseRaw (value) {
    return this.options.min + value * (this.options.max - this.options.min);
  },

  function normalise (value) {
    return this.options.valueFormat(this.normaliseRaw(value));
  },

  function abnormaliseRaw (value) {
    return (value - this.options.min)/(this.options.max - this.options.min);
  },

  function abnormalise (value) {
    return this.abnormaliseRaw(this.options.valueParse(value));
  },

  function findGap(range) {
    var newIndex;
    this.ranges.forEach(function($r, i) {
      if($r.val()[0] < range[0] && $r.val()[1] < range[1]) newIndex = i + 1;
    });

    return newIndex;
  },

  function insertRangeIndex(range, index, avoidList) {
    if(!avoidList) this.ranges.splice(index, 0, range);

    if(this.ranges[index - 1]) {
      this.ranges[index - 1].$el.after(range);
    } else {
      this.$el.prepend(range.$el);
    }
  },

  function addRange(range, data) {
    var $range = Range({
      parent: this,
      snap: this.options.snap ? this.abnormaliseRaw(this.options.snap + this.options.min) : null,
      label: this.options.label,
      rangeClass: this.options.rangeClass,
      minSize: this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : null,
      readonly: this.options.readonly
    });

    if (this.options.data) {
      $range.data(this.options.data.call($range, this));
    }

    if (data) {
      $range.data(data);
    }

    this.insertRangeIndex($range, this.findGap(range));
    $range.val(range);

    var self = this;

    $range.on('changing', function(ev, nrange, changed) {
      ev.stopPropagation();
      self.trigger('changing', [self.val(), changed]);
    }).on('change', function(ev, nrange, changed) {
      ev.stopPropagation();
      self.trigger('change', [self.val(), changed]);
    });
    return $range;
  },

  function prevRange(range) {
    var idx = range.index();
    if(idx >= 0) return this.ranges[idx - 1];
  },

  function nextRange(range) {
    var idx = range.index();
    if(idx >= 0) return this.ranges[range instanceof Phantom ? idx : idx + 1];
  },

  function setVal(ranges) {
    if(this.ranges.length > ranges.length) {
      for(var i = ranges.length, l = this.ranges.length; i < l; ++i) {
        this.ranges[i].remove();
      }
      this.ranges.length = ranges.length;
    }

    var self = this;

    ranges.forEach(function(range, i) {
      if(self.ranges[i]) {
        self.ranges[i].val(range.map($.proxy(self.abnormalise, self)));
      } else {
        self.addRange(range.map($.proxy(self.abnormalise, self)));
      }
    });

    return this;
  },

  function val(ranges) {
    var self = this;
    if(typeof ranges === 'undefined') {
      return this.ranges.map(function(range) {
        return range.val().map($.proxy(self.normalise, self));
      });
    }

    if(!this.options.readonly) this.setVal(ranges);
    return this;
  },

  function removePhantom() {
    if(this.phantom) {
      this.phantom.remove();
      this.phantom = null;
    }
  },

  function calcGap(index) {
    var start = this.ranges[index - 1] ? this.ranges[index - 1].val()[1] : 0;
    var end = this.ranges[index] ? this.ranges[index].val()[0] : 1;
    return this.normaliseRaw(end) - this.normaliseRaw(start);
  },

  function addLabel(pos) {
    var cent = pos * 100, val = this.normalise(pos);
    var $el = $('<span class="elessar-label">').css('left', cent+'%').text(val);
    if(1 - pos < 0.05) {
      $el.css({
        left: '',
        right: 0
      });
    }
    return $el.appendTo(this.$el);
  },

  function mousemove(ev) {
    var w = this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : 0.05;
    var val = (ev.pageX - this.$el.offset().left)/this.$el.width() - w/2;
    if(ev.target === ev.currentTarget && this.ranges.length < this.options.maxRanges && !$('body').is('.elessar-dragging, .elessar-resizing') && !this.options.readonly) {
      if(!this.phantom) this.phantom = Phantom({
        parent: this,
        snap: this.options.snap ? this.abnormaliseRaw(this.options.snap + this.options.min) : null,
        label: "+",
        minSize: this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : null,
        rangeClass: this.options.rangeClass
      });
      var idx = this.findGap([val,val + w]);

      if(!this.options.minSize || this.calcGap(idx) >= this.options.minSize) {
        this.insertRangeIndex(this.phantom, idx, true);
        this.phantom.val([val,val + w], {trigger: false});
      }
    }
  }
);

RangeBar.defaults = {
  min: 0,
  max: 100,
  valueFormat: function (a) {return a;},
  valueParse: function (a) {return a;},
  maxRanges: Infinity,
  readonly: false,
  bgLabels: 0
};

module.exports = RangeBar;