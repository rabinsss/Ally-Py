// Generated by CoffeeScript 1.3.3

/*
----------------------
 State Machine
----------------------

(STATE_*) Denotes the initial State
(STATE_S) Denotes the "selected" State (when the cursor is in the element)
$el is the element (link, figure, title)
$tip is the popover element (tooltip)

There are 3 variables that are stored on each element;
[ isOpened, null/timer, isSelected ]


(STATE_*) [closed, _, _]
    |   |
    |   | (select via keyboard (left/right/up/down))
    |   |
    |   \----> (STATE_S) [opened, _, selected]
    |           |   |
    |           |   | (click elsewhere (not $el/$tip)
    |           |   |
    |           |   \----> (STATE_C) [closed, _, _]
    |           |
    |           | ($el/$tip.mouseenter)
    |           |
    |           \----> Nothing happens (unlike the other mouseenter case)
    |
    | ($el.mouseenter)
    |
    \----> (STATE_WC) [closed, timer, _] (waiting to show the popoup)
            |   |
            |   | ($el.mouseleave)
            |   |
            |   \----> (STATE_*)
            |
            | (... wait some time)
            |
            \----> (STATE_O) [opened, _, _] (hover popup displayed)
                    |   |
                    |   | (select via click or keyboard)
                    |   |
                    |   \---> (STATE_S) [opened, _, selected]
                    |
                    | ($el.mouseleave)
                    |
                    \----> (STATE_WO) [opened, timer, _] (mouse has moved away from $el but the popup hasn't disappeared yet) (POSFDGUOFDIGU)
                            |   |
                            |   | (... wait some time)
                            |   |
                            |   \---> (STATE_*) [closed, _, _]
                            |
                            | ($tip.mouseenter)
                            |
                            \---> (STATE_TIP) [opened, _, _]
                                    |
                                    | ($tip.mouseleave)
                                    |
                                    \---> (STATE_WO) [opened, timer, _]
                                            |   |
                                            |   | (... wait some time)
                                            |   |
                                            |   \----> (STATE_*) [closed, _, _]
                                            |
                                            \---> (STATE_TIP) [opened, _, _]
*/


(function() {

  define('popover', ['aloha', 'jquery'], function(Aloha, jQuery) {
    var Bootstrap_Popover__position, Bootstrap_Popover_destroy, Bootstrap_Popover_hide, Bootstrap_Popover_show, Helper, Popover, bindHelper, findMarkup, monkeyPatch, selectionChangeHandler;
    Bootstrap_Popover__position = function($tip) {
      var actualHeight, actualWidth, inside, placement, pos, tp;
      placement = (typeof this.options.placement === "function" ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement);
      inside = /in/.test(placement);
      if (!$tip.parents()[0]) {
        $tip.appendTo((inside ? this.$element : document.body));
      }
      pos = this.getPosition(inside);
      actualWidth = $tip[0].offsetWidth;
      actualHeight = $tip[0].offsetHeight;
      switch ((inside ? placement.split(" ")[1] : placement)) {
        case "bottom":
          tp = {
            top: pos.top + pos.height,
            left: pos.left + pos.width / 2 - actualWidth / 2
          };
          break;
        case "top":
          tp = {
            top: pos.top - actualHeight - 10,
            left: pos.left + pos.width / 2 - actualWidth / 2
          };
          break;
        case "left":
          tp = {
            top: pos.top + pos.height / 2 - actualHeight / 2,
            left: pos.left - actualWidth
          };
          break;
        case "right":
          tp = {
            top: pos.top + pos.height / 2 - actualHeight / 2,
            left: pos.left + pos.width
          };
      }
      if (tp.top < 0 || tp.left < 0) {
        placement = 'bottom';
        tp.top = pos.top + pos.height;
      }
      if (tp.left < 0) {
        tp.left = 10;
      }
      return $tip.css(tp).addClass(placement);
    };
    Bootstrap_Popover_show = function() {
      var $tip;
      if (this.hasContent() && this.enabled) {
        $tip = this.tip();
        this.setContent();
        if (this.options.animation) {
          $tip.addClass("fade");
        }
        $tip.css({
          top: 0,
          left: 0,
          display: "block"
        });
        Bootstrap_Popover__position.bind(this)($tip);
        $tip.addClass("in");
        /* Trigger the shown event
        */

        return this.$element.trigger('shown-popover');
      }
    };
    Bootstrap_Popover_hide = function(originalHide) {
      return function() {
        this.$element.trigger('hide-popover');
        originalHide.bind(this)();
        return this.$element.trigger('hidden-popover');
      };
    };
    Bootstrap_Popover_destroy = function() {
      return this.hide().off('.' + this.type).removeData(this.type);
    };
    monkeyPatch = function() {
      var proto;
      console && console.warn('Monkey patching Bootstrap popovers so the buttons in them are clickable');
      proto = jQuery.fn.popover.Constructor.prototype;
      proto.show = Bootstrap_Popover_show;
      proto.hide = Bootstrap_Popover_hide(proto.hide);
      return proto.destroy = Bootstrap_Popover_destroy;
    };
    monkeyPatch();
    Popover = {
      MILLISECS: 2000,
      MOVE_INTERVAL: 100,
      register: function(cfg) {
        return bindHelper(new Helper(cfg));
      }
    };
    Helper = (function() {

      function Helper(cfg) {
        this.hover = false;
        jQuery.extend(this, cfg);
        if (this.focus || this.blur) {
          console && console.warn('Popover.focus and Popover.blur are deprecated in favor of listening to the "shown-popover" or "hide-popover" events on the original DOM element');
        }
      }

      Helper.prototype.startAll = function(editable) {
        var $el, delayTimeout, makePopovers,
          _this = this;
        $el = jQuery(editable.obj);
        delayTimeout = function($self, eventName, ms) {
          return setTimeout(function() {
            return $self.trigger(eventName);
          }, ms);
        };
        makePopovers = function($nodes) {
          return $nodes.each(function(i, node) {
            var $node;
            $node = jQuery(node);
            if (_this.focus) {
              $node.on('shown-popover', function() {
                return _this.focus.bind($node[0])($node.data('popover').$tip);
              });
            }
            if (_this.blur) {
              $node.on('hide-popover', function() {
                return _this.blur.bind($node[0])($node.data('popover').$tip);
              });
            }
            if (!$node.data('popover')) {
              return $node.popover({
                html: true,
                placement: _this.placement || 'bottom',
                trigger: 'manual',
                content: function() {
                  return _this.populator.bind($node)($node, _this);
                }
              });
            }
          });
        };
        $el.on('show', this.selector, function(evt) {
          var $node, movePopover;
          $node = jQuery(evt.target);
          movePopover = function() {
            var that;
            that = $node.data('popover');
            if (that && that.$tip) {
              return Bootstrap_Popover__position.bind(that)(that.$tip);
            }
          };
          clearTimeout($node.data('aloha-bubble-timer'));
          $node.removeData('aloha-bubble-timer');
          if (!$node.data('aloha-bubble-visible')) {
            makePopovers($node);
            $node.popover('show');
            if (_this.markerclass) {
              $node.data('popover').$tip.addClass(_this.markerclass);
            }
            $node.data('aloha-bubble-visible', true);
          }
          clearInterval($node.data('aloha-bubble-move-timer'));
          return $node.data('aloha-bubble-move-timer', setInterval(movePopover, Popover.MOVE_INTERVAL));
        });
        $el.on('hide', this.selector, function(evt) {
          var $node;
          $node = jQuery(evt.target);
          clearTimeout($node.data('aloha-bubble-timer'));
          clearInterval($node.data('aloha-bubble-move-timer'));
          $node.removeData('aloha-bubble-timer');
          $node.data('aloha-bubble-selected', false);
          if ($node.data('aloha-bubble-visible')) {
            $node.popover('hide');
            return $node.removeData('aloha-bubble-visible');
          }
        });
        return $el.on('mouseenter.bubble', this.selector, function(evt) {
          var $node;
          $node = jQuery(evt.target);
          clearInterval($node.data('aloha-bubble-timer'));
          if (_this.hover) {
            $node.data('aloha-bubble-timer', delayTimeout($node, 'show', Popover.MILLISECS));
            return $node.on('mouseleave.bubble', function() {
              var $tip;
              if (!$node.data('aloha-bubble-selected')) {
                try {
                  $tip = $node.data('popover').$tip;
                } catch (err) {
                  $tip = null;
                }
                if ($tip) {
                  $tip.on('mouseenter', function() {
                    return clearTimeout($node.data('aloha-bubble-timer'));
                  });
                  $tip.on('mouseleave', function() {
                    clearTimeout($node.data('aloha-bubble-timer'));
                    if (!$node.data('aloha-bubble-selected')) {
                      return $node.data('aloha-bubble-timer', delayTimeout($node, 'hide', Popover.MILLISECS / 2));
                    }
                  });
                }
                if (!$node.data('aloha-bubble-timer')) {
                  return $node.data('aloha-bubble-timer', delayTimeout($node, 'hide', Popover.MILLISECS / 2));
                }
              }
            });
          }
        });
      };

      Helper.prototype.stopAll = function(editable) {
        var $nodes;
        jQuery(editable.obj).undelegate(this.selector, '.bubble');
        $nodes = jQuery(editable.obj).find(this.selector);
        $nodes.removeData('aloha-bubble-timer');
        $nodes.removeData('aloha-bubble-selected');
        return $nodes.popover('destroy');
      };

      Helper.prototype.stopOne = function($nodes) {
        $nodes.removeData('aloha-bubble-timer');
        $nodes.removeData('aloha-bubble-selected');
        return $nodes.popover('destroy');
      };

      return Helper;

    })();
    findMarkup = function(range, selector) {
      var filter;
      if (range == null) {
        range = Aloha.Selection.getRangeObject();
      }
      if (Aloha.activeEditable) {
        filter = function() {
          var $el;
          $el = jQuery(this);
          return $el.is(selector) || $el.parents(selector)[0];
        };
        return range.findMarkup(filter, Aloha.activeEditable.obj);
      } else {
        return null;
      }
    };
    selectionChangeHandler = function(rangeObject, selector) {
      var enteredLinkScope, foundMarkup;
      enteredLinkScope = false;
      if (Aloha.activeEditable != null) {
        foundMarkup = findMarkup(rangeObject, selector);
        enteredLinkScope = foundMarkup;
      }
      return enteredLinkScope;
    };
    bindHelper = function(cfg) {
      var enteredLinkScope, helper, insideScope;
      helper = new Helper(cfg);
      $.extend(cfg, {
        helper: helper
      });
      insideScope = false;
      enteredLinkScope = false;
      Aloha.bind('aloha-editable-activated', function(event, data) {
        return helper.startAll(data.editable);
      });
      Aloha.bind('aloha-editable-deactivated', function(event, data) {
        helper.stopAll(data.editable);
        insideScope = false;
        return enteredLinkScope = false;
      });
      Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
        var $el, nodes;
        $el = jQuery(rangeObject.getCommonAncestorContainer());
        if (!$el.is(helper.selector)) {
          $el = $el.parents(helper.selector);
        }
        nodes = jQuery(Aloha.activeEditable.obj).find(helper.selector);
        nodes = nodes.not($el);
        nodes.trigger('hide');
        if (Aloha.activeEditable) {
          enteredLinkScope = selectionChangeHandler(rangeObject, helper.selector);
          if (insideScope !== enteredLinkScope) {
            insideScope = enteredLinkScope;
            if (!$el.is(helper.selector)) {
              $el = $el.parents(helper.selector);
            }
            if (enteredLinkScope) {
              $el.trigger('show');
              $el.data('aloha-bubble-selected', true);
              $el.off('.bubble');
              return event.stopPropagation();
            }
          }
        }
      });
      return helper;
    };
    return Popover;
  });

}).call(this);
