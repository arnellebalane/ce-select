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


    initialize();
    attach();


    function initialize() {
        var selects = document.querySelectorAll(
            '.ce-select:not(.ce-select-original)');
        selects = Array.prototype.slice.apply(selects);
        selects.forEach(construct);
    }


    function attach() {
        var blurTimeout = null;

        delegate('focus', '.ce-select-container', function(e) {
            clearTimeout(blurTimeout);
            this.classList.add('ce-select-container--focus');
        }, true);

        delegate('blur', '.ce-select-container', function(e) {
            blurTimeout = setTimeout(function() {
                this.classList.remove('ce-select-container--focus');
                this.classList.remove('ce-select-container--open');
            }.bind(this), 125);
        }, true);

        delegate('change', '.ce-select-original', function(e) {
            syncValues(this.parentNode, true);
        }, true);

        delegate('click', '.ce-select-option:not(.ce-select-option--disabled)',
        function(e) {
            var container = closest(this, '.ce-select-container');
            var widget = container.querySelector('.ce-select-value');
            container.querySelector('.ce-select-original').focus();
            widget.dataset.value = this.dataset.value;
            widget.textContent = this.textContent;
            container.classList.toggle('ce-select-container--open');
            syncValues(container);
        });

        delegate('click', '.ce-select-widget', function(e) {
            var container = this.parentNode;
            container.querySelector('.ce-select-original').focus();
            container.classList.toggle('ce-select-container--open');
        });
    }


    function construct(element) {
        var select = domify(templates.select, {});
        var dropdown = select.querySelector('.ce-select-dropdown');
        var options = element.querySelectorAll('option');
        options = Array.prototype.slice.apply(options);
        options.forEach(function(option) {
            var values = { value: option.value, label: option.textContent };
            var rendered = domify(templates.option, values);
            dropdown.appendChild(rendered);
        });

        element.parentNode.insertBefore(select, element);
        select.insertBefore(element, select.firstChild);
        element.classList.add('ce-select-original');
        syncValues(select, true);
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
    function syncValues(element, followOriginal) {
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
     *  Get the first element up the DOM tree starting at the given element
     *  which matches the given selector.
     *  @params:
     *      {HTMLElement} element - the starting point DOM element for
     *          searching the ancestor.
     *      {String} selector - the ancestor element selector to search.
     **/
    function closest(element, selector) {
        while (element !== document) {
            if (matches(element, selector)) {
                return element;
            }
            element = element.parentNode;
        }
        return null;
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
     *      {Boolean} capture - whether to use event capturing or not.
     **/
    function delegate(event, selector, callback, capture) {
        document.addEventListener(event, function(e) {
            var element = closest(e.target, selector);
            if (element) {
                callback.call(element, e);
            }
        }, capture === true);
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


    return { refresh: initialize };
})();
