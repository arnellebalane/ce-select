var ceselect = (function() {
    var templates = {
        select: '<div class="ce-select-container">'
                + '<div class="ce-select-widget">'
                    + '<label class="ce-select-value"></label>'
                    + '<span class="ce-select-toggle"></span>'
                + '</div>'
                + '<ul class="ce-select-dropdown"></ul>'
            + '</div>',
        option: '<li class="ce-select-option" data-value="{{ value }}">'
            + '{{ label }}</li>'
    };
    var keyCodes = { UP: 38, DOWN: 40, RETURN: 13 };
    var closeTimeout = null;


    initialize();
    attach();


    /**
     *  Find all native <select> elements that should be converted to custom
     *  select elements and construct the proper markup for them. This ignores
     *  <select> elements that are already converted into custom markup.
     **/
    function initialize() {
        var selects = document.querySelectorAll(
            '.ce-select:not(.ce-select-original)');
        selects = Array.prototype.slice.apply(selects);
        selects.forEach(construct);
    }


    /**
     *  Enable event listeners for the custom select elements. All events are
     *  delegated into the document object. Use event capturing for events that
     *  dont't bubble up.
     **/
    function attach() {
        var focusedSelect = null;

        capture('focus', '.ce-select-container', function(e) {
            clearTimeout(closeTimeout);
            this.classList.add('ce-select-container--focus');
            focusedSelect = this;
        }, true);

        capture('blur', '.ce-select-container', function(e) {
            closeTimeout = setTimeout(function() {
                this.classList.remove('ce-select-container--focus');
                close(this);
                focusedSelect = null;
            }.bind(this), 125);
        }, true);

        capture('change', '.ce-select-original', function(e) {
            synchronize(this.parentNode, true);
        }, true);

        capture('click', '.ce-select-option:not(.ce-select-option--disabled)',
        function(e) {
            var container = this.closest('.ce-select-container');
            var widget = container.querySelector('.ce-select-value');
            container.querySelector('.ce-select-original').focus();
            widget.dataset.value = this.dataset.value;
            widget.textContent = this.textContent;
            synchronize(container);
            close(container);
        });

        capture('click', '.ce-select-widget', function(e) {
            var container = this.parentNode;
            if (opened(container)) {
                close(container);
            } else {
                open(container);
            }
        });

        capture('mouseenter', '.ce-select-option', function(e) {
            var container = this.closest('.ce-select-container');
            var option = selected(container);
            if (option) {
                option.classList.remove('ce-select-option--focus');
            }
            this.classList.add('ce-select-option--focus');
        }, true);

        capture('mouseleave', '.ce-select-option', function(e) {
            this.classList.remove('ce-select-option--focus');
        }, true);

        document.addEventListener('keydown', function(e) {
            if (focusedSelect && values(keyCodes).indexOf(e.keyCode) > -1) {
                e.preventDefault();
                if (opened(focusedSelect)) {
                    if (e.keyCode === keyCodes.RETURN) {
                        selected(focusedSelect).click();
                    } else if (e.keyCode === keyCodes.UP) {
                        navigate(focusedSelect, -1);
                    } else if (e.keyCode === keyCodes.DOWN) {
                        navigate(focusedSelect, 1);
                    }
                } else {
                    open(focusedSelect);
                }
            }
        });
    }


    /**
     *  Construct the custom select element markup from the given native
     *  <select> element.
     *  @params:
     *      {HTMLSelectElement} element - the native <select> element to be
     *          converted into a custom select element.
     **/
    function construct(element) {
        var select = domify(templates.select, {});
        var dropdown = select.querySelector('.ce-select-dropdown');

        var options = element.querySelectorAll('option');
        options = Array.prototype.slice.apply(options);
        options.forEach(function(option) {
            var values = { value: option.value, label: option.textContent };
            var rendered = domify(templates.option, values);
            if (option.disabled) {
                rendered.classList.add('ce-select-option--disabled');
            }
            dropdown.appendChild(rendered);
        });

        element.parentNode.insertBefore(select, element);
        select.insertBefore(element, select.firstChild);
        element.classList.add('ce-select-original');
        synchronize(select, true);
    }


    /**
     *  Abstract the workflow of opening a custom select element.
     *  @params:
     *      {HTMLElement} element - the container of the custom select element
     *          to be opened.
     **/
    function open(element) {
        element.querySelector('.ce-select-original').focus();
        element.classList.add('ce-select-container--open');

        var value = element.querySelector('.ce-select-value').dataset.value;
        var option = element.querySelector(
            '.ce-select-option[data-value="' + value + '"]');
        option.classList.add('ce-select-option--focus');
    }


    /**
     *  Abstract the workflow of closing a custom select element.
     *  @params:
     *      {HTMLElement} element - the container of the custom select element
     *          to be closed.
     **/
    function close(element) {
        element.classList.remove('ce-select-container--open');

        var option = selected(element);
        if (option) {
            option.classList.remove('ce-select-option--focus');
        }
    }


    /**
     *  Identify whether the given custom select element is already opened or
     *  still closed.
     *  @params:
     *      {HTMLElement} element - the container of the custom select element
     *          to be checked whether open or close.
     **/
    function opened(element) {
        return element.classList.contains('ce-select-container--open');
    }


    /**
     *  Get the currently selected option in the given custom select element.
     *  @params:
     *      {HTMLElement} element - the container of the custom select element
     *          whose selected option is to be obtained.
     **/
    function selected(element) {
        return element.querySelector('.ce-select-option--focus');
    }


    /**
     *  Synchronize the values of the original <select> element and the custom
     *  select element markup.
     *  @params:
     *      {HTMLElement} element - the container element of the custom select
     *          markup which also contains the original <select> element.
     *      {Boolean} followOriginal - whether to sync based on the value
     *          of the original <select> element or based on the dummy select
     *          element.
     **/
    function synchronize(element, followOriginal) {
        var original = element.querySelector('.ce-select-original');
        var widget = element.querySelector('.ce-select-value');
        if (followOriginal) {
            widget.dataset.value = original.value;
            widget.textContent = original.querySelector('option:checked')
                .textContent;
        } else {
            original.value = widget.dataset.value;
        }
    }


    /**
     *  Navigates the currently focused option in the custom select element
     *  based on the given direction. Used for keyboard navigation of the
     *  custom select elements when selecting values.
     *  @params:
     *      {HTMLElement} element - the container of the custom select element
     *          to be navigated.
     *      {Integer} direction - the navigation direction, `-1` to go up and
     *          `1` to go down.
     **/
    function navigate(element, direction) {
        var option = selected(element);
        var property = direction === -1
            ? 'previousElementSibling' : 'nextElementSibling';
        var sibling = option[property];
        if (sibling) {
            option.classList.remove('ce-select-option--focus');
            sibling.classList.add('ce-select-option--focus');
        }
    }


    /**
     *  Determine whether a given DOM element matches the given selector.
     *  @params:
     *      {HTMLElement} element - the DOM element to be tested.
     *      {String} selector - the selector to test the element against.
     **/
    function matches(element, selector) {
        var method = element.matches || element.matchesSelector
            || element.msMatchesSelector || element.mozMatchesSelector
            || element.webkitMatchesSelector || element.oMatchesSelector;
        return method.call(element, selector);
    }


    /**
     *  Delegates events by attaching event listeners to the document object.
     *  Event listeners are executed when the given event will be fired from an
     *  element that matches the given selector. `this` in the event listeners
     *  will become the element that matches the given selector.
     *  @params:
     *      {String} event - the name of the event to listen for.
     *      {String} selector - the selector for the element whose events are
     *          to be delegated.
     *      {Function} callback - the callback function to execute when the
     *          event occurs.
     *      {Boolean} _capture - whether to use event capturing or not.
     **/
    function capture(event, selector, callback, _capture) {
        document.addEventListener(event, function(e) {
            if (e.target.closest) {
                var element = e.target.closest(selector);
                if (element) {
                    callback.call(element, e);
                }
            }
        }, _capture === true);
    }


    /**
     *  Generate a DOM element from a given template and object of values to
     *  render into the template.
     *  @params:
     *      {String} template - the template to render values into.
     *      {Object} values - the values to render into the template.
     **/
    function domify(template, values) {
        Object.keys(values).forEach(function(key) {
            var pattern = new RegExp('{{\\s*' + key + '\\s*}}', 'g');
            template = template.replace(pattern, values[key]);
        });
        var div = document.createElement('div');
        div.innerHTML = template;
        return div.firstChild;
    }


    /**
     *  Get the values of the given object, the same way `Object.keys()`
     *  gets the keys.
     *  @params:
     *      {Object} object - the object whose values would be obtained.
     **/
    function values(object) {
        return Object.keys(object).map(function(key) {
            return object[key];
        });
    }


    return { refresh: initialize };
})();
