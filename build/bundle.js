
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var default_sort = function (item, needle) { return item - needle; };
    function binarySearch(array, search, fn) {
        if (fn === void 0) { fn = default_sort; }
        var low = 0;
        var high = array.length - 1;
        var sort = fn.length === 1
            ? function (item, needle) { return fn(item) - search; }
            : fn;
        while (low <= high) {
            var i = (high + low) >> 1;
            var d = sort(array[i], search);
            if (d < 0) {
                low = i + 1;
            }
            else if (d > 0) {
                high = i - 1;
            }
            else {
                return i;
            }
        }
        return -low - 1;
    }

    function pickRandom(array) {
        var i = ~~(Math.random() * array.length);
        return array[i];
    }

    // http://bost.ocks.org/mike/shuffle/
    function shuffle(array) {
        var m = array.length;
        // While there remain elements to shuffle…
        while (m > 0) {
            // Pick a remaining element…
            var i = Math.floor(Math.random() * m--);
            // And swap it with the current element.
            var t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    function queue(max) {
        if (max === void 0) { max = 4; }
        var items = []; // TODO
        var pending = 0;
        var closed = false;
        var fulfil_closed;
        function dequeue() {
            if (pending === 0 && items.length === 0) {
                if (fulfil_closed)
                    fulfil_closed();
            }
            if (pending >= max)
                return;
            if (items.length === 0)
                return;
            pending += 1;
            var _a = items.shift(), fn = _a.fn, fulfil = _a.fulfil, reject = _a.reject;
            var promise = fn();
            try {
                promise.then(fulfil, reject).then(function () {
                    pending -= 1;
                    dequeue();
                });
            }
            catch (err) {
                reject(err);
                pending -= 1;
                dequeue();
            }
            dequeue();
        }
        return {
            add: function (fn) {
                if (closed) {
                    throw new Error("Cannot add to a closed queue");
                }
                return new Promise(function (fulfil, reject) {
                    items.push({ fn: fn, fulfil: fulfil, reject: reject });
                    dequeue();
                });
            },
            close: function () {
                closed = true;
                return new Promise(function (fulfil, reject) {
                    if (pending === 0) {
                        fulfil();
                    }
                    else {
                        fulfil_closed = fulfil;
                    }
                });
            }
        };
    }

    function createSprite(width, height, fn) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        fn(ctx, canvas);
        return canvas;
    }

    function clamp(num, min, max) {
        return num < min ? min : num > max ? max : num;
    }

    function random(a, b) {
        if (b === undefined)
            return Math.random() * a;
        return a + Math.random() * (b - a);
    }

    function linear(domain, range) {
        var d0 = domain[0];
        var r0 = range[0];
        var m = (range[1] - r0) / (domain[1] - d0);
        return Object.assign(function (num) {
            return r0 + (num - d0) * m;
        }, {
            inverse: function () { return linear(range, domain); }
        });
    }

    // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    function commas(num) {
        var parts = String(num).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    var yootils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        binarySearch: binarySearch,
        pickRandom: pickRandom,
        shuffle: shuffle,
        queue: queue,
        createSprite: createSprite,
        clamp: clamp,
        random: random,
        linearScale: linear,
        commas: commas
    });

    /* node_modules/@sveltejs/pancake/components/Chart.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules/@sveltejs/pancake/components/Chart.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let div_resize_listener;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "pancake-chart svelte-1gzh5rp");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[17].call(div));
    			toggle_class(div, "clip", /*clip*/ ctx[0]);
    			add_location(div, file$5, 78, 0, 1618);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[16](div);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[17].bind(div));
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mousemove", /*handle_mousemove*/ ctx[6], false, false, false),
    					listen_dev(div, "mouseleave", /*handle_mouseleave*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
    				}
    			}

    			if (dirty & /*clip*/ 1) {
    				toggle_class(div, "clip", /*clip*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[16](null);
    			div_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const key = {};

    function getChartContext() {
    	return getContext(key);
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $x_scale_inverse;
    	let $y_scale_inverse;
    	let $width;
    	let $height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart", slots, ['default']);
    	let { x1 = 0 } = $$props;
    	let { y1 = 0 } = $$props;
    	let { x2 = 1 } = $$props;
    	let { y2 = 1 } = $$props;
    	let { clip = false } = $$props;
    	let chart;
    	const _x1 = writable();
    	const _y1 = writable();
    	const _x2 = writable();
    	const _y2 = writable();
    	const width = writable();
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(2, $width = value));
    	const height = writable();
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(3, $height = value));
    	const pointer = writable(null);

    	const handle_mousemove = e => {
    		const bcr = chart.getBoundingClientRect();
    		const left = e.clientX - bcr.left;
    		const top = e.clientY - bcr.top;
    		const x = $x_scale_inverse(100 * left / (bcr.right - bcr.left));
    		const y = $y_scale_inverse(100 * top / (bcr.bottom - bcr.top));
    		pointer.set({ x, y, left, top });
    	};

    	const handle_mouseleave = () => {
    		pointer.set(null);
    	};

    	const x_scale = derived([_x1, _x2], ([$x1, $x2]) => {
    		return linear([$x1, $x2], [0, 100]);
    	});

    	const y_scale = derived([_y1, _y2], ([$y1, $y2]) => {
    		return linear([$y1, $y2], [100, 0]);
    	});

    	const x_scale_inverse = derived(x_scale, $x_scale => $x_scale.inverse());
    	validate_store(x_scale_inverse, "x_scale_inverse");
    	component_subscribe($$self, x_scale_inverse, value => $$invalidate(18, $x_scale_inverse = value));
    	const y_scale_inverse = derived(y_scale, $y_scale => $y_scale.inverse());
    	validate_store(y_scale_inverse, "y_scale_inverse");
    	component_subscribe($$self, y_scale_inverse, value => $$invalidate(19, $y_scale_inverse = value));

    	setContext(key, {
    		x1: _x1,
    		y1: _y1,
    		x2: _x2,
    		y2: _y2,
    		x_scale,
    		y_scale,
    		x_scale_inverse,
    		y_scale_inverse,
    		pointer,
    		width,
    		height
    	});

    	const writable_props = ["x1", "y1", "x2", "y2", "clip"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			chart = $$value;
    			$$invalidate(1, chart);
    		});
    	}

    	function div_elementresize_handler() {
    		$width = this.clientWidth;
    		width.set($width);
    		$height = this.clientHeight;
    		height.set($height);
    	}

    	$$self.$$set = $$props => {
    		if ("x1" in $$props) $$invalidate(10, x1 = $$props.x1);
    		if ("y1" in $$props) $$invalidate(11, y1 = $$props.y1);
    		if ("x2" in $$props) $$invalidate(12, x2 = $$props.x2);
    		if ("y2" in $$props) $$invalidate(13, y2 = $$props.y2);
    		if ("clip" in $$props) $$invalidate(0, clip = $$props.clip);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		key,
    		getChartContext,
    		setContext,
    		onDestroy,
    		writable,
    		derived,
    		yootils,
    		x1,
    		y1,
    		x2,
    		y2,
    		clip,
    		chart,
    		_x1,
    		_y1,
    		_x2,
    		_y2,
    		width,
    		height,
    		pointer,
    		handle_mousemove,
    		handle_mouseleave,
    		x_scale,
    		y_scale,
    		x_scale_inverse,
    		y_scale_inverse,
    		$x_scale_inverse,
    		$y_scale_inverse,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("x1" in $$props) $$invalidate(10, x1 = $$props.x1);
    		if ("y1" in $$props) $$invalidate(11, y1 = $$props.y1);
    		if ("x2" in $$props) $$invalidate(12, x2 = $$props.x2);
    		if ("y2" in $$props) $$invalidate(13, y2 = $$props.y2);
    		if ("clip" in $$props) $$invalidate(0, clip = $$props.clip);
    		if ("chart" in $$props) $$invalidate(1, chart = $$props.chart);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x1*/ 1024) {
    			_x1.set(x1);
    		}

    		if ($$self.$$.dirty & /*y1*/ 2048) {
    			_y1.set(y1);
    		}

    		if ($$self.$$.dirty & /*x2*/ 4096) {
    			_x2.set(x2);
    		}

    		if ($$self.$$.dirty & /*y2*/ 8192) {
    			_y2.set(y2);
    		}
    	};

    	return [
    		clip,
    		chart,
    		$width,
    		$height,
    		width,
    		height,
    		handle_mousemove,
    		handle_mouseleave,
    		x_scale_inverse,
    		y_scale_inverse,
    		x1,
    		y1,
    		x2,
    		y2,
    		$$scope,
    		slots,
    		div_binding,
    		div_elementresize_handler
    	];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { x1: 10, y1: 11, x2: 12, y2: 13, clip: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get x1() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x1(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y1() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y1(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x2() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x2(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y2() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y2(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clip() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clip(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // adapted from https://github.com/d3/d3-array/blob/master/src/ticks.js
    // MIT License https://github.com/d3/d3-array/blob/master/LICENSE
    const e10 = Math.sqrt(50);
    const e5 = Math.sqrt(10);
    const e2 = Math.sqrt(2);

    function get_ticks(start, stop, count = 5) {
    	var reverse;
    	var i = -1;
    	var n;
    	var ticks;
    	var step;

    	if (start === stop && count > 0) return [start];

    	if (reverse = stop < start) {
    		[start, stop] = [stop, start];
    	}

    	if ((step = increment(start, stop, count)) === 0 || !isFinite(step)) {
    		return [];
    	}

    	if (step > 0) {
    		start = Math.ceil(start / step);
    		stop = Math.floor(stop / step);
    		ticks = new Array((n = Math.ceil(stop - start + 1)));
    		while (++i < n) ticks[i] = (start + i) * step;
    	} else {
    		start = Math.floor(start * step);
    		stop = Math.ceil(stop * step);
    		ticks = new Array((n = Math.ceil(start - stop + 1)));
    		while (++i < n) ticks[i] = (start - i) / step;
    	}

    	if (reverse) ticks.reverse();

    	return ticks;
    }

    function increment(start, stop, count) {
    	const step = (stop - start) / Math.max(0, count);
    	const power = Math.floor(Math.log(step) / Math.LN10);
    	const error = step / Math.pow(10, power);

    	return power >= 0
    		? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) *
    				Math.pow(10, power)
    		: -Math.pow(10, -power) /
    				(error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    /* node_modules/@sveltejs/pancake/components/Grid.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$4 = "node_modules/@sveltejs/pancake/components/Grid.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    const get_default_slot_changes$9 = dirty => ({
    	value: dirty & /*_ticks*/ 1,
    	last: dirty & /*_ticks*/ 1
    });

    const get_default_slot_context$9 = ctx => ({
    	value: /*tick*/ ctx[23],
    	first: /*i*/ ctx[25] === 0,
    	last: /*i*/ ctx[25] === /*_ticks*/ ctx[0].length - 1
    });

    // (31:1) {#each _ticks as tick, i}
    function create_each_block$2(ctx) {
    	let div;
    	let t;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], get_default_slot_context$9);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			attr_dev(div, "class", "pancake-grid-item svelte-1wq9bba");
    			attr_dev(div, "style", div_style_value = /*style*/ ctx[1](/*tick*/ ctx[23], /*i*/ ctx[25]));
    			add_location(div, file$4, 31, 2, 876);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, _ticks*/ 524289)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, get_default_slot_changes$9, get_default_slot_context$9);
    				}
    			}

    			if (!current || dirty & /*style, _ticks*/ 3 && div_style_value !== (div_style_value = /*style*/ ctx[1](/*tick*/ ctx[23], /*i*/ ctx[25]))) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(31:1) {#each _ticks as tick, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let current;
    	let each_value = /*_ticks*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "pancake-grid");
    			add_location(div, file$4, 29, 0, 820);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style, _ticks, $$scope*/ 524291) {
    				each_value = /*_ticks*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let orientation;
    	let _ticks;
    	let style;
    	let $y1;
    	let $y2;
    	let $x1;
    	let $x2;
    	let $y_scale;
    	let $x_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grid", slots, ['default']);
    	let { count = undefined } = $$props;
    	let { ticks = undefined } = $$props;
    	let { horizontal = false } = $$props;
    	let { vertical = false } = $$props;
    	const { x1, y1, x2, y2, x_scale, y_scale } = getChartContext();
    	validate_store(x1, "x1");
    	component_subscribe($$self, x1, value => $$invalidate(15, $x1 = value));
    	validate_store(y1, "y1");
    	component_subscribe($$self, y1, value => $$invalidate(13, $y1 = value));
    	validate_store(x2, "x2");
    	component_subscribe($$self, x2, value => $$invalidate(16, $x2 = value));
    	validate_store(y2, "y2");
    	component_subscribe($$self, y2, value => $$invalidate(14, $y2 = value));
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(18, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(17, $y_scale = value));
    	const VERTICAL = {};
    	const HORIZONTAL = {};
    	const writable_props = ["count", "ticks", "horizontal", "vertical"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("count" in $$props) $$invalidate(8, count = $$props.count);
    		if ("ticks" in $$props) $$invalidate(9, ticks = $$props.ticks);
    		if ("horizontal" in $$props) $$invalidate(10, horizontal = $$props.horizontal);
    		if ("vertical" in $$props) $$invalidate(11, vertical = $$props.vertical);
    		if ("$$scope" in $$props) $$invalidate(19, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		get_ticks,
    		count,
    		ticks,
    		horizontal,
    		vertical,
    		x1,
    		y1,
    		x2,
    		y2,
    		x_scale,
    		y_scale,
    		VERTICAL,
    		HORIZONTAL,
    		orientation,
    		_ticks,
    		$y1,
    		$y2,
    		$x1,
    		$x2,
    		style,
    		$y_scale,
    		$x_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("count" in $$props) $$invalidate(8, count = $$props.count);
    		if ("ticks" in $$props) $$invalidate(9, ticks = $$props.ticks);
    		if ("horizontal" in $$props) $$invalidate(10, horizontal = $$props.horizontal);
    		if ("vertical" in $$props) $$invalidate(11, vertical = $$props.vertical);
    		if ("orientation" in $$props) $$invalidate(12, orientation = $$props.orientation);
    		if ("_ticks" in $$props) $$invalidate(0, _ticks = $$props._ticks);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*vertical*/ 2048) {
    			$$invalidate(12, orientation = vertical ? VERTICAL : HORIZONTAL);
    		}

    		if ($$self.$$.dirty & /*horizontal, vertical*/ 3072) {
    			if (horizontal && vertical) {
    				console.error(`<Grid> must specify either 'horizontal' or 'vertical' orientation`);
    			}
    		}

    		if ($$self.$$.dirty & /*ticks, orientation, $y1, $y2, count, $x1, $x2*/ 127744) {
    			$$invalidate(0, _ticks = ticks || (orientation === HORIZONTAL
    			? get_ticks($y1, $y2, count)
    			: get_ticks($x1, $x2, count)));
    		}

    		if ($$self.$$.dirty & /*orientation, $y_scale, $x_scale*/ 397312) {
    			$$invalidate(1, style = orientation === HORIZONTAL
    			? (n, i) => `width: 100%; height: 0; top: ${$y_scale(n, i)}%`
    			: (n, i) => `width: 0; height: 100%; left: ${$x_scale(n, i)}%`);
    		}
    	};

    	return [
    		_ticks,
    		style,
    		x1,
    		y1,
    		x2,
    		y2,
    		x_scale,
    		y_scale,
    		count,
    		ticks,
    		horizontal,
    		vertical,
    		orientation,
    		$y1,
    		$y2,
    		$x1,
    		$x2,
    		$y_scale,
    		$x_scale,
    		$$scope,
    		slots
    	];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			count: 8,
    			ticks: 9,
    			horizontal: 10,
    			vertical: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get count() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ticks() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ticks(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/Point.svelte generated by Svelte v3.38.2 */
    const file$3 = "node_modules/@sveltejs/pancake/components/Point.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "pancake-point svelte-11ba04d");
    			set_style(div, "left", /*$x_scale*/ ctx[2](/*x*/ ctx[0]) + "%");
    			set_style(div, "top", /*$y_scale*/ ctx[3](/*y*/ ctx[1]) + "%");
    			add_location(div, file$3, 9, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*$x_scale, x*/ 5) {
    				set_style(div, "left", /*$x_scale*/ ctx[2](/*x*/ ctx[0]) + "%");
    			}

    			if (!current || dirty & /*$y_scale, y*/ 10) {
    				set_style(div, "top", /*$y_scale*/ ctx[3](/*y*/ ctx[1]) + "%");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Point", slots, ['default']);
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(2, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(3, $y_scale = value));
    	let { x } = $$props;
    	let { y } = $$props;
    	const writable_props = ["x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Point> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		x_scale,
    		y_scale,
    		x,
    		y,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y, $x_scale, $y_scale, x_scale, y_scale, $$scope, slots];
    }

    class Point extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Point",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<Point> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<Point> was created without expected prop 'y'");
    		}
    	}

    	get x() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/Box.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules/@sveltejs/pancake/components/Box.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "pancake-box svelte-38xupb");
    			attr_dev(div, "style", /*style*/ ctx[0]);
    			add_location(div, file$2, 28, 0, 648);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 1) {
    				attr_dev(div, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Box", slots, ['default']);
    	let { x1 = 0 } = $$props;
    	let { x2 = 1 } = $$props;
    	let { y1 = 0 } = $$props;
    	let { y2 = 1 } = $$props;
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(7, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(8, $y_scale = value));
    	let style;
    	
    	const writable_props = ["x1", "x2", "y1", "y2"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x1" in $$props) $$invalidate(3, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(4, x2 = $$props.x2);
    		if ("y1" in $$props) $$invalidate(5, y1 = $$props.y1);
    		if ("y2" in $$props) $$invalidate(6, y2 = $$props.y2);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		x1,
    		x2,
    		y1,
    		y2,
    		x_scale,
    		y_scale,
    		style,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("x1" in $$props) $$invalidate(3, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(4, x2 = $$props.x2);
    		if ("y1" in $$props) $$invalidate(5, y1 = $$props.y1);
    		if ("y2" in $$props) $$invalidate(6, y2 = $$props.y2);
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$x_scale, x1, x2, $y_scale, y1, y2*/ 504) {
    			{
    				const _x1 = $x_scale(x1);
    				const _x2 = $x_scale(x2);
    				const _y1 = $y_scale(y1);
    				const _y2 = $y_scale(y2);
    				const left = Math.min(_x1, _x2);
    				const right = Math.max(_x1, _x2);
    				const top = Math.min(_y1, _y2);
    				const bottom = Math.max(_y1, _y2);
    				const height = bottom - top;
    				$$invalidate(0, style = `left: ${left}%; bottom: ${100 - bottom}%; width: ${right - left}%; height: ${height}%;`);
    			}
    		}
    	};

    	return [style, x_scale, y_scale, x1, x2, y1, y2, $x_scale, $y_scale, $$scope, slots];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { x1: 3, x2: 4, y1: 5, y2: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get x1() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x1(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x2() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x2(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y1() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y1(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y2() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y2(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const default_x = d => d.x;
    const default_y = d => d.y;

    /* node_modules/@sveltejs/pancake/components/Bars.svelte generated by Svelte v3.38.2 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    const get_default_slot_changes$8 = dirty => ({
    	value: dirty & /*data*/ 1,
    	last: dirty & /*data*/ 1
    });

    const get_default_slot_context$8 = ctx => ({
    	value: /*d*/ ctx[6],
    	first: /*i*/ ctx[8] === 0,
    	last: /*i*/ ctx[8] === /*data*/ ctx[0].length - 1
    });

    // (12:1) <Box y1="{y(d, i) - height/2}" y2="{y(d, i) + height/2}" x1={0} x2="{x(d, i)}">
    function create_default_slot$3(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], get_default_slot_context$8);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, data*/ 33)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_default_slot_changes$8, get_default_slot_context$8);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(12:1) <Box y1=\\\"{y(d, i) - height/2}\\\" y2=\\\"{y(d, i) + height/2}\\\" x1={0} x2=\\\"{x(d, i)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:0) {#each data as d, i}
    function create_each_block$1(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				y1: /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]) - /*height*/ ctx[1] / 2,
    				y2: /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]) + /*height*/ ctx[1] / 2,
    				x1: 0,
    				x2: /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]),
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*y, data, height*/ 11) box_changes.y1 = /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]) - /*height*/ ctx[1] / 2;
    			if (dirty & /*y, data, height*/ 11) box_changes.y2 = /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]) + /*height*/ ctx[1] / 2;
    			if (dirty & /*x, data*/ 5) box_changes.x2 = /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]);

    			if (dirty & /*$$scope, data*/ 33) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:0) {#each data as d, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y, data, height, x, $$scope*/ 47) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bars", slots, ['default']);
    	let { data } = $$props;
    	let { height = 1 } = $$props;
    	let { x = d => d.x } = $$props;
    	let { y = d => d.y } = $$props;
    	const writable_props = ["data", "height", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bars> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Box,
    		default_x,
    		default_y,
    		data,
    		height,
    		x,
    		y
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, height, x, y, slots, $$scope];
    }

    class Bars extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { data: 0, height: 1, x: 2, y: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bars",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Bars> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Bars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Bars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Bars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Bars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Bars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Bars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Bars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Bars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/Columns.svelte generated by Svelte v3.38.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    const get_default_slot_changes$7 = dirty => ({
    	value: dirty & /*data*/ 1,
    	last: dirty & /*data*/ 1
    });

    const get_default_slot_context$7 = ctx => ({
    	value: /*d*/ ctx[6],
    	first: /*i*/ ctx[8] === 0,
    	last: /*i*/ ctx[8] === /*data*/ ctx[0].length - 1
    });

    // (12:1) <Box x1="{x(d, i) - width/2}" x2="{x(d, i) + width/2}" y1={0} y2="{y(d, i)}">
    function create_default_slot$2(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], get_default_slot_context$7);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, data*/ 33)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_default_slot_changes$7, get_default_slot_context$7);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(12:1) <Box x1=\\\"{x(d, i) - width/2}\\\" x2=\\\"{x(d, i) + width/2}\\\" y1={0} y2=\\\"{y(d, i)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:0) {#each data as d, i}
    function create_each_block(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				x1: /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]) - /*width*/ ctx[1] / 2,
    				x2: /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]) + /*width*/ ctx[1] / 2,
    				y1: 0,
    				y2: /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]),
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*x, data, width*/ 7) box_changes.x1 = /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]) - /*width*/ ctx[1] / 2;
    			if (dirty & /*x, data, width*/ 7) box_changes.x2 = /*x*/ ctx[2](/*d*/ ctx[6], /*i*/ ctx[8]) + /*width*/ ctx[1] / 2;
    			if (dirty & /*y, data*/ 9) box_changes.y2 = /*y*/ ctx[3](/*d*/ ctx[6], /*i*/ ctx[8]);

    			if (dirty & /*$$scope, data*/ 33) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(11:0) {#each data as d, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x, data, width, y, $$scope*/ 47) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Columns", slots, ['default']);
    	let { data } = $$props;
    	let { width = 1 } = $$props;
    	let { x = d => d.x } = $$props;
    	let { y = d => d.y } = $$props;
    	const writable_props = ["data", "width", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Columns> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Box,
    		default_x,
    		default_y,
    		data,
    		width,
    		x,
    		y
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, width, x, y, slots, $$scope];
    }

    class Columns extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { data: 0, width: 1, x: 2, y: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Columns",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Columns> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Columns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Columns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Columns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Columns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Columns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Columns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Columns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Columns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/Svg.svelte generated by Svelte v3.38.2 */

    const file$1 = "node_modules/@sveltejs/pancake/components/Svg.svelte";

    function create_fragment$9(ctx) {
    	let svg;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			if (default_slot) default_slot.c();
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-4s4ihd");
    			toggle_class(svg, "clip", /*clip*/ ctx[0]);
    			add_location(svg, file$1, 4, 0, 46);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			if (default_slot) {
    				default_slot.m(svg, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (dirty & /*clip*/ 1) {
    				toggle_class(svg, "clip", /*clip*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Svg", slots, ['default']);
    	let { clip = false } = $$props;
    	const writable_props = ["clip"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Svg> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("clip" in $$props) $$invalidate(0, clip = $$props.clip);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ clip });

    	$$self.$inject_state = $$props => {
    		if ("clip" in $$props) $$invalidate(0, clip = $$props.clip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clip, $$scope, slots];
    }

    class Svg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { clip: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svg",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get clip() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clip(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgPolygon.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes$6 = dirty => ({ d: dirty & /*d*/ 1 });
    const get_default_slot_context$6 = ctx => ({ d: /*d*/ ctx[0] });

    function create_fragment$8(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$6);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, d*/ 257)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$6, get_default_slot_context$6);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let d;
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgPolygon", slots, ['default']);
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(6, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(7, $y_scale = value));
    	let { data } = $$props;
    	let { x = default_x } = $$props;
    	let { y = default_y } = $$props;
    	const writable_props = ["data", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgPolygon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		default_x,
    		default_y,
    		x_scale,
    		y_scale,
    		data,
    		x,
    		y,
    		d,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("d" in $$props) $$invalidate(0, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, $x_scale, x, $y_scale, y*/ 248) {
    			$$invalidate(0, d = `M${data.map((d, i) => `${$x_scale(x(d, i))},${$y_scale(y(d, i))}`).join("L")}`);
    		}
    	};

    	return [d, x_scale, y_scale, data, x, y, $x_scale, $y_scale, $$scope, slots];
    }

    class SvgPolygon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { data: 3, x: 4, y: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgPolygon",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<SvgPolygon> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<SvgPolygon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SvgPolygon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<SvgPolygon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<SvgPolygon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<SvgPolygon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<SvgPolygon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgArea.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes$5 = dirty => ({ d: dirty & /*d*/ 128 });
    const get_default_slot_context$5 = ctx => ({ d: /*d*/ ctx[7] });

    // (17:0) <SvgPolygon data={points} let:d>
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], get_default_slot_context$5);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, d*/ 192)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_default_slot_changes$5, get_default_slot_context$5);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(17:0) <SvgPolygon data={points} let:d>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let svgpolygon;
    	let current;

    	svgpolygon = new SvgPolygon({
    			props: {
    				data: /*points*/ ctx[0],
    				$$slots: {
    					default: [create_default_slot$1, ({ d }) => ({ 7: d }), ({ d }) => d ? 128 : 0]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(svgpolygon.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(svgpolygon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const svgpolygon_changes = {};
    			if (dirty & /*points*/ 1) svgpolygon_changes.data = /*points*/ ctx[0];

    			if (dirty & /*$$scope, d*/ 192) {
    				svgpolygon_changes.$$scope = { dirty, ctx };
    			}

    			svgpolygon.$set(svgpolygon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svgpolygon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svgpolygon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svgpolygon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let points;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgArea", slots, ['default']);
    	let { data } = $$props;
    	let { floor = 0 } = $$props;
    	let { x = default_x } = $$props;
    	let { y = default_y } = $$props;
    	const writable_props = ["data", "floor", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgArea> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("floor" in $$props) $$invalidate(2, floor = $$props.floor);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		SvgPolygon,
    		default_x,
    		default_y,
    		data,
    		floor,
    		x,
    		y,
    		points
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("floor" in $$props) $$invalidate(2, floor = $$props.floor);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("points" in $$props) $$invalidate(0, points = $$props.points);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x, data, floor, y*/ 30) {
    			$$invalidate(0, points = [
    				{ x: x(data[0], 0), y: floor },
    				...data.map((d, i) => ({ x: x(d, i), y: y(d, i) })),
    				{
    					x: x(data[data.length - 1], data.length - 1),
    					y: floor
    				}
    			]);
    		}
    	};

    	return [points, data, floor, x, y, slots, $$scope];
    }

    class SvgArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { data: 1, floor: 2, x: 3, y: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgArea",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
    			console.warn("<SvgArea> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<SvgArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SvgArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get floor() {
    		throw new Error("<SvgArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set floor(value) {
    		throw new Error("<SvgArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<SvgArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<SvgArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<SvgArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<SvgArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgLine.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes$4 = dirty => ({ d: dirty & /*d*/ 1 });
    const get_default_slot_context$4 = ctx => ({ d: /*d*/ ctx[0] });

    function create_fragment$6(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$4);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, d*/ 257)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$4, get_default_slot_context$4);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let d;
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgLine", slots, ['default']);
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(6, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(7, $y_scale = value));
    	let { data } = $$props;
    	let { x = default_x } = $$props;
    	let { y = default_y } = $$props;
    	const writable_props = ["data", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		default_x,
    		default_y,
    		x_scale,
    		y_scale,
    		data,
    		x,
    		y,
    		d,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("d" in $$props) $$invalidate(0, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, $x_scale, x, $y_scale, y*/ 248) {
    			$$invalidate(0, d = "M" + data.map((d, i) => `${$x_scale(x(d, i))},${$y_scale(y(d, i))}`).join("L"));
    		}
    	};

    	return [d, x_scale, y_scale, data, x, y, $x_scale, $y_scale, $$scope, slots];
    }

    class SvgLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { data: 3, x: 4, y: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgLine",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<SvgLine> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<SvgLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SvgLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<SvgLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<SvgLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<SvgLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<SvgLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgRect.svelte generated by Svelte v3.38.2 */

    const get_default_slot_changes$3 = dirty => ({
    	x: dirty & /*left, right*/ 3,
    	y: dirty & /*top, bottom*/ 12,
    	width: dirty & /*right, left*/ 3,
    	height: dirty & /*bottom, top*/ 12
    });

    const get_default_slot_context$3 = ctx => ({
    	x: Math.min(/*left*/ ctx[0], /*right*/ ctx[1]),
    	y: Math.min(/*top*/ ctx[2], /*bottom*/ ctx[3]),
    	width: Math.abs(/*right*/ ctx[1] - /*left*/ ctx[0]),
    	height: Math.abs(/*bottom*/ ctx[3] - /*top*/ ctx[2])
    });

    function create_fragment$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context$3);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, left, right, top, bottom*/ 4111)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[12], dirty, get_default_slot_changes$3, get_default_slot_context$3);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let left;
    	let right;
    	let top;
    	let bottom;
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgRect", slots, ['default']);
    	let { x1 = 0 } = $$props;
    	let { x2 = 1 } = $$props;
    	let { y1 = 0 } = $$props;
    	let { y2 = 1 } = $$props;
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(10, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(11, $y_scale = value));
    	const writable_props = ["x1", "x2", "y1", "y2"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgRect> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x1" in $$props) $$invalidate(6, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(7, x2 = $$props.x2);
    		if ("y1" in $$props) $$invalidate(8, y1 = $$props.y1);
    		if ("y2" in $$props) $$invalidate(9, y2 = $$props.y2);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		x1,
    		x2,
    		y1,
    		y2,
    		x_scale,
    		y_scale,
    		left,
    		$x_scale,
    		right,
    		top,
    		$y_scale,
    		bottom
    	});

    	$$self.$inject_state = $$props => {
    		if ("x1" in $$props) $$invalidate(6, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(7, x2 = $$props.x2);
    		if ("y1" in $$props) $$invalidate(8, y1 = $$props.y1);
    		if ("y2" in $$props) $$invalidate(9, y2 = $$props.y2);
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("right" in $$props) $$invalidate(1, right = $$props.right);
    		if ("top" in $$props) $$invalidate(2, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$x_scale, x1*/ 1088) {
    			$$invalidate(0, left = $x_scale(x1));
    		}

    		if ($$self.$$.dirty & /*$x_scale, x2*/ 1152) {
    			$$invalidate(1, right = $x_scale(x2));
    		}

    		if ($$self.$$.dirty & /*$y_scale, y1*/ 2304) {
    			$$invalidate(2, top = $y_scale(y1));
    		}

    		if ($$self.$$.dirty & /*$y_scale, y2*/ 2560) {
    			$$invalidate(3, bottom = $y_scale(y2));
    		}
    	};

    	return [
    		left,
    		right,
    		top,
    		bottom,
    		x_scale,
    		y_scale,
    		x1,
    		x2,
    		y1,
    		y2,
    		$x_scale,
    		$y_scale,
    		$$scope,
    		slots
    	];
    }

    class SvgRect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { x1: 6, x2: 7, y1: 8, y2: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgRect",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get x1() {
    		throw new Error("<SvgRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x1(value) {
    		throw new Error("<SvgRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x2() {
    		throw new Error("<SvgRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x2(value) {
    		throw new Error("<SvgRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y1() {
    		throw new Error("<SvgRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y1(value) {
    		throw new Error("<SvgRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y2() {
    		throw new Error("<SvgRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y2(value) {
    		throw new Error("<SvgRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgScatterplot.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes$2 = dirty => ({ d: dirty & /*d*/ 1 });
    const get_default_slot_context$2 = ctx => ({ d: /*d*/ ctx[0] });

    function create_fragment$4(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$2);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, d*/ 257)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$2, get_default_slot_context$2);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let d;
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgScatterplot", slots, ['default']);
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(6, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(7, $y_scale = value));
    	let { data } = $$props;
    	let { x = default_x } = $$props;
    	let { y = default_y } = $$props;
    	const writable_props = ["data", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgScatterplot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		default_x,
    		default_y,
    		x_scale,
    		y_scale,
    		data,
    		x,
    		y,
    		d,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("x" in $$props) $$invalidate(4, x = $$props.x);
    		if ("y" in $$props) $$invalidate(5, y = $$props.y);
    		if ("d" in $$props) $$invalidate(0, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, $x_scale, x, $y_scale, y*/ 248) {
    			$$invalidate(0, d = data.map((d, i) => {
    				const _x = $x_scale(x(d, i));
    				const _y = $y_scale(y(d, i));
    				return `M${_x} ${_y} A0 0 0 0 1 ${_x + 0.0001} ${_y + 0.0001}`;
    			}).join(" "));
    		}
    	};

    	return [d, x_scale, y_scale, data, x, y, $x_scale, $y_scale, $$scope, slots];
    }

    class SvgScatterplot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 3, x: 4, y: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgScatterplot",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<SvgScatterplot> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<SvgScatterplot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SvgScatterplot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<SvgScatterplot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<SvgScatterplot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<SvgScatterplot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<SvgScatterplot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/pancake/components/SvgPoint.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes$1 = dirty => ({ d: dirty & /*d*/ 1 });
    const get_default_slot_context$1 = ctx => ({ d: /*d*/ ctx[0] });

    function create_fragment$3(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, d*/ 129)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, get_default_slot_changes$1, get_default_slot_context$1);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $x_scale;
    	let $y_scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgPoint", slots, ['default']);
    	const { x_scale, y_scale } = getChartContext();
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(5, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(6, $y_scale = value));
    	let { x } = $$props;
    	let { y } = $$props;
    	let d;
    	const writable_props = ["x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgPoint> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getChartContext,
    		x_scale,
    		y_scale,
    		x,
    		y,
    		d,
    		$x_scale,
    		$y_scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("d" in $$props) $$invalidate(0, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$x_scale, x, $y_scale, y*/ 120) {
    			{
    				const _x = $x_scale(x);
    				const _y = $y_scale(y);
    				$$invalidate(0, d = `M${_x} ${_y} A0 0 0 0 1 ${_x + 0.0001} ${_y + 0.0001}`);
    			}
    		}
    	};

    	return [d, x_scale, y_scale, x, y, $x_scale, $y_scale, $$scope, slots];
    }

    class SvgPoint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { x: 3, y: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgPoint",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[3] === undefined && !("x" in props)) {
    			console.warn("<SvgPoint> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[4] === undefined && !("y" in props)) {
    			console.warn("<SvgPoint> was created without expected prop 'y'");
    		}
    	}

    	get x() {
    		throw new Error("<SvgPoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<SvgPoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<SvgPoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<SvgPoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Node {
    	constructor(x0, y0, x1, y1) {
    		this.x0 = x0;
    		this.y0 = y0;
    		this.x1 = x1;
    		this.y1 = y1;
    		this.xm = (x0 + x1) / 2;
    		this.ym = (y0 + y1) / 2;

    		this.empty = true;
    		this.leaf = null;
    		this.children = null;
    	}

    	add(p) {
    		const { x0, y0, x1, y1, xm, ym, leaf } = this;

    		if (this.empty) {
    			this.leaf = p;
    			this.empty = false;
    			return;
    		}

    		if (leaf) {
    			// discard coincident points
    			if (leaf.x === p.x && leaf.y === p.y) return;

    			// need to subdivide
    			this.children = {
    				nw: new Node(x0, y0, xm, ym),
    				ne: new Node(xm, y0, x1, ym),
    				sw: new Node(x0, ym, xm, y1),
    				se: new Node(xm, ym, x1, y1)
    			};

    			this.leaf = null;
    			this.add(leaf);
    		}

    		const child = p.x < xm
    			? p.y < ym ? this.children.nw : this.children.sw
    			: p.y < ym ? this.children.ne : this.children.se;

    		child.add(p);
    	}
    }

    function build_tree(data, x, y, x_scale, y_scale) {
    	const points = data.map((d, i) => ({
    		d,
    		x: x_scale(x(d, i)),
    		y: y_scale(y(d, i))
    	}));

    	let x0 = Infinity;
    	let y0 = Infinity;
    	let x1 = -Infinity;
    	let y1 = -Infinity;

    	for (let i = 0; i < points.length; i += 1) {
    		const p = points[i];

    		if (p.x < x0) x0 = p.x;
    		if (p.y < y0) y0 = p.y;
    		if (p.x > x1) x1 = p.x;
    		if (p.y > y1) y1 = p.y;
    	}

    	const root = new Node(x0, y0, x1, y1);

    	for (let i = 0; i < points.length; i += 1) {
    		const p = points[i];
    		if (isNaN(p.x) || isNaN(p.y)) continue;

    		root.add(p);
    	}

    	return root;
    }

    class Quadtree {
    	constructor(data) {
    		this.data = data;
    		this.x = null;
    		this.y = null;
    		this.x_scale = null;
    		this.y_scale = null;
    	}

    	update(x, y, x_scale, y_scale) {
    		this.root = null;
    		this.x = x;
    		this.y = y;
    		this.x_scale = x_scale;
    		this.y_scale = y_scale;
    	}

    	find(left, top, width, height, radius) {
    		if (!this.root) this.root = build_tree(this.data, this.x, this.y, this.x_scale, this.y_scale);

    		const queue = [this.root];

    		let node;
    		let closest;
    		let min_d_squared = Infinity;

    		const x_to_px = x => x * width / 100;
    		const y_to_px = y => y * height / 100;

    		while (node = queue.pop()) {
    			if (node.empty) continue;

    			const left0 = x_to_px(node.x0);
    			const left1 = x_to_px(node.x1);
    			const top0 = y_to_px(node.y0);
    			const top1 = y_to_px(node.y1);

    			const out_of_bounds = (
    				left < (Math.min(left0, left1) - radius) ||
    				left > (Math.max(left0, left1) + radius) ||
    				top < (Math.min(top0, top1) - radius) ||
    				top > (Math.max(top0, top1) + radius)
    			);

    			if (out_of_bounds) continue;

    			if (node.leaf) {
    				const dl = x_to_px(node.leaf.x) - left;
    				const dt = y_to_px(node.leaf.y) - top;

    				const d_squared = (dl * dl + dt * dt);

    				if (d_squared < min_d_squared) {
    					closest = node.leaf.d;
    					min_d_squared = d_squared;
    				}
    			} else {
    				queue.push(
    					node.children.nw,
    					node.children.ne,
    					node.children.sw,
    					node.children.se
    				);
    			}
    		}

    		return min_d_squared < (radius * radius)
    			? closest
    			: null;
    	}
    }

    /* node_modules/@sveltejs/pancake/components/Quadtree.svelte generated by Svelte v3.38.2 */
    const get_default_slot_changes = dirty => ({ closest: dirty & /*closest*/ 1 });
    const get_default_slot_context = ctx => ({ closest: /*closest*/ ctx[0] });

    function create_fragment$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, closest*/ 262145)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[18], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let quadtree;
    	let $x_scale;
    	let $y_scale;
    	let $pointer;
    	let $width;
    	let $height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Quadtree", slots, ['default']);
    	let { data } = $$props;
    	let { x = default_x } = $$props;
    	let { y = default_y } = $$props;
    	let { radius = Infinity } = $$props;
    	let { closest = undefined } = $$props;
    	const { pointer, x_scale, y_scale, x_scale_inverse, y_scale_inverse, width, height } = getChartContext();
    	validate_store(pointer, "pointer");
    	component_subscribe($$self, pointer, value => $$invalidate(15, $pointer = value));
    	validate_store(x_scale, "x_scale");
    	component_subscribe($$self, x_scale, value => $$invalidate(13, $x_scale = value));
    	validate_store(y_scale, "y_scale");
    	component_subscribe($$self, y_scale, value => $$invalidate(14, $y_scale = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(16, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(17, $height = value));
    	const dispatch = createEventDispatcher();

    	// track reference changes, to trigger updates sparingly
    	let prev_closest;

    	let next_closest;
    	const writable_props = ["data", "x", "y", "radius", "closest"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Quadtree> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("radius" in $$props) $$invalidate(9, radius = $$props.radius);
    		if ("closest" in $$props) $$invalidate(0, closest = $$props.closest);
    		if ("$$scope" in $$props) $$invalidate(18, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getChartContext,
    		Quadtree,
    		default_x,
    		default_y,
    		data,
    		x,
    		y,
    		radius,
    		closest,
    		pointer,
    		x_scale,
    		y_scale,
    		x_scale_inverse,
    		y_scale_inverse,
    		width,
    		height,
    		dispatch,
    		prev_closest,
    		next_closest,
    		quadtree,
    		$x_scale,
    		$y_scale,
    		$pointer,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("radius" in $$props) $$invalidate(9, radius = $$props.radius);
    		if ("closest" in $$props) $$invalidate(0, closest = $$props.closest);
    		if ("prev_closest" in $$props) $$invalidate(10, prev_closest = $$props.prev_closest);
    		if ("next_closest" in $$props) $$invalidate(11, next_closest = $$props.next_closest);
    		if ("quadtree" in $$props) $$invalidate(12, quadtree = $$props.quadtree);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 64) {
    			$$invalidate(12, quadtree = new Quadtree(data));
    		}

    		if ($$self.$$.dirty & /*quadtree, x, y, $x_scale, $y_scale*/ 29056) {
    			quadtree.update(x, y, $x_scale, $y_scale);
    		}

    		if ($$self.$$.dirty & /*$pointer, quadtree, $width, $height, radius*/ 233984) {
    			$$invalidate(11, next_closest = $pointer !== null
    			? quadtree.find($pointer.left, $pointer.top, $width, $height, radius)
    			: null);
    		}

    		if ($$self.$$.dirty & /*next_closest, prev_closest*/ 3072) {
    			if (next_closest !== prev_closest) {
    				$$invalidate(0, closest = $$invalidate(10, prev_closest = next_closest));
    			}
    		}
    	};

    	return [
    		closest,
    		pointer,
    		x_scale,
    		y_scale,
    		width,
    		height,
    		data,
    		x,
    		y,
    		radius,
    		prev_closest,
    		next_closest,
    		quadtree,
    		$x_scale,
    		$y_scale,
    		$pointer,
    		$width,
    		$height,
    		$$scope,
    		slots
    	];
    }

    class Quadtree_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			data: 6,
    			x: 7,
    			y: 8,
    			radius: 9,
    			closest: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quadtree_1",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[6] === undefined && !("data" in props)) {
    			console.warn("<Quadtree> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Quadtree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Quadtree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Quadtree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Quadtree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Quadtree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Quadtree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<Quadtree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<Quadtree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closest() {
    		throw new Error("<Quadtree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closest(value) {
    		throw new Error("<Quadtree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function stacks (data, keys, i = (d, i) => i) {
    	if (typeof i === 'string') {
    		const key = i;
    		i = d => d[key];
    	}

    	const stacks = data.map(d => {
    		const stack = keys.map(key => ({
    			key,
    			value: d[key],
    			i: i(d),
    			start: null,
    			end: null
    		}));

    		let acc = 0;

    		stack.forEach(d => {
    			d.start = acc;
    			d.end = acc += d.value;
    		});

    		return stack;
    	});

    	return keys.map(key => ({
    		key,
    		values: stacks.map(s => {
    			return s.find(d => d.key === key);
    		})
    	}));
    }

    var Pancake = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Chart: Chart,
        Grid: Grid,
        Point: Point,
        Box: Box,
        Bars: Bars,
        Columns: Columns,
        Svg: Svg,
        SvgArea: SvgArea,
        SvgPolygon: SvgPolygon,
        SvgLine: SvgLine,
        SvgRect: SvgRect,
        SvgScatterplot: SvgScatterplot,
        SvgPoint: SvgPoint,
        Quadtree: Quadtree_1,
        stacks: stacks
    });

    var tsv = `
1958.208	315.71	314.62
1958.292	317.45	315.29
1958.375	317.50	314.71
1958.458	-99.99	314.85
1958.542	315.86	314.98
1958.625	314.93	315.94
1958.708	313.20	315.91
1958.792	-99.99	315.61
1958.875	313.33	315.31
1958.958	314.67	315.61
1959.042	315.62	315.70
1959.125	316.38	315.88
1959.208	316.71	315.62
1959.292	317.72	315.56
1959.375	318.29	315.50
1959.458	318.15	315.92
1959.542	316.54	315.66
1959.625	314.80	315.81
1959.708	313.84	316.55
1959.792	313.26	316.19
1959.875	314.80	316.78
1959.958	315.58	316.52
1960.042	316.43	316.51
1960.125	316.97	316.47
1960.208	317.58	316.49
1960.292	319.02	316.86
1960.375	320.03	317.24
1960.458	319.59	317.36
1960.542	318.18	317.30
1960.625	315.91	316.92
1960.708	314.16	316.87
1960.792	313.83	316.76
1960.875	315.00	316.98
1960.958	316.19	317.13
1961.042	316.93	317.03
1961.125	317.70	317.28
1961.208	318.54	317.47
1961.292	319.48	317.27
1961.375	320.58	317.70
1961.458	319.77	317.48
1961.542	318.57	317.70
1961.625	316.79	317.80
1961.708	314.80	317.49
1961.792	315.38	318.35
1961.875	316.10	318.13
1961.958	317.01	317.94
1962.042	317.94	318.06
1962.125	318.56	318.11
1962.208	319.68	318.57
1962.292	320.63	318.45
1962.375	321.01	318.20
1962.458	320.55	318.27
1962.542	319.58	318.67
1962.625	317.40	318.48
1962.708	316.26	319.03
1962.792	315.42	318.33
1962.875	316.69	318.62
1962.958	317.69	318.61
1963.042	318.74	318.91
1963.125	319.08	318.68
1963.208	319.86	318.69
1963.292	321.39	319.09
1963.375	322.25	319.39
1963.458	321.47	319.16
1963.542	319.74	318.77
1963.625	317.77	318.83
1963.708	316.21	319.06
1963.792	315.99	319.00
1963.875	317.12	319.10
1963.958	318.31	319.25
1964.042	319.57	319.67
1964.125	-99.99	319.61
1964.208	-99.99	319.55
1964.292	-99.99	319.48
1964.375	322.25	319.42
1964.458	321.89	319.69
1964.542	320.44	319.58
1964.625	318.70	319.81
1964.708	316.70	319.56
1964.792	316.79	319.78
1964.875	317.79	319.72
1964.958	318.71	319.59
1965.042	319.44	319.48
1965.125	320.44	319.97
1965.208	320.89	319.65
1965.292	322.13	319.80
1965.375	322.16	319.36
1965.458	321.87	319.65
1965.542	321.39	320.51
1965.625	318.81	319.93
1965.708	317.81	320.68
1965.792	317.30	320.36
1965.875	318.87	320.87
1965.958	319.42	320.26
1966.042	320.62	320.63
1966.125	321.59	321.10
1966.208	322.39	321.16
1966.292	323.87	321.51
1966.375	324.01	321.18
1966.458	323.75	321.52
1966.542	322.39	321.49
1966.625	320.37	321.50
1966.708	318.64	321.54
1966.792	318.10	321.18
1966.875	319.79	321.84
1966.958	321.08	321.95
1967.042	322.07	322.07
1967.125	322.50	321.94
1967.208	323.04	321.72
1967.292	324.42	322.05
1967.375	325.00	322.27
1967.458	324.09	321.94
1967.542	322.55	321.66
1967.625	320.92	322.04
1967.708	319.31	322.19
1967.792	319.31	322.36
1967.875	320.72	322.78
1967.958	321.96	322.86
1968.042	322.57	322.55
1968.125	323.15	322.56
1968.208	323.89	322.59
1968.292	325.02	322.73
1968.375	325.57	322.87
1968.458	325.36	323.20
1968.542	324.14	323.25
1968.625	322.03	323.15
1968.708	320.41	323.31
1968.792	320.25	323.32
1968.875	321.31	323.32
1968.958	322.84	323.69
1969.042	324.00	323.98
1969.125	324.42	323.89
1969.208	325.64	324.41
1969.292	326.66	324.35
1969.375	327.34	324.57
1969.458	326.76	324.63
1969.542	325.88	325.08
1969.625	323.67	324.80
1969.708	322.38	325.28
1969.792	321.78	324.84
1969.875	322.85	324.78
1969.958	324.11	324.88
1970.042	325.03	325.04
1970.125	325.99	325.42
1970.208	326.87	325.69
1970.292	328.13	325.86
1970.375	328.07	325.27
1970.458	327.66	325.52
1970.542	326.35	325.51
1970.625	324.69	325.76
1970.708	323.10	325.93
1970.792	323.16	326.15
1970.875	323.98	325.96
1970.958	325.13	326.06
1971.042	326.17	326.25
1971.125	326.68	326.10
1971.208	327.18	325.94
1971.292	327.78	325.47
1971.375	328.92	326.11
1971.458	328.57	326.40
1971.542	327.34	326.45
1971.625	325.46	326.49
1971.708	323.36	326.19
1971.792	323.57	326.58
1971.875	324.80	326.82
1971.958	326.01	327.02
1972.042	326.77	326.85
1972.125	327.63	327.04
1972.208	327.75	326.53
1972.292	329.72	327.42
1972.375	330.07	327.23
1972.458	329.09	326.92
1972.542	328.05	327.20
1972.625	326.32	327.37
1972.708	324.93	327.76
1972.792	325.06	328.06
1972.875	326.50	328.50
1972.958	327.55	328.55
1973.042	328.54	328.58
1973.125	329.56	328.86
1973.208	330.30	328.99
1973.292	331.50	329.14
1973.375	332.48	329.62
1973.458	332.07	329.94
1973.542	330.87	330.05
1973.625	329.31	330.42
1973.708	327.51	330.45
1973.792	327.18	330.23
1973.875	328.16	330.16
1973.958	328.64	329.66
1974.042	329.35	329.45
1974.125	330.71	330.12
1974.208	331.48	330.20
1974.292	332.65	330.26
1974.375	333.19	330.27
1974.458	332.16	329.94
1974.542	331.07	330.23
1974.625	329.12	330.26
1974.708	327.32	330.28
1974.792	327.28	330.36
1974.875	328.30	330.28
1974.958	329.58	330.55
1975.042	330.73	330.89
1975.125	331.46	330.93
1975.208	331.90	330.54
1975.292	333.17	330.67
1975.375	333.94	330.98
1975.458	333.45	331.20
1975.542	331.98	331.12
1975.625	329.95	331.11
1975.708	328.50	331.48
1975.792	328.34	331.46
1975.875	329.37	331.41
1975.958	-99.99	331.60
1976.042	331.59	331.79
1976.125	332.75	332.20
1976.208	333.52	332.05
1976.292	334.64	332.13
1976.375	334.77	331.84
1976.458	334.00	331.65
1976.542	333.06	332.14
1976.625	330.68	331.88
1976.708	328.95	331.94
1976.792	328.75	331.92
1976.875	330.15	332.29
1976.958	331.62	332.66
1977.042	332.66	332.76
1977.125	333.13	332.51
1977.208	334.95	333.35
1977.292	336.13	333.51
1977.375	336.93	333.98
1977.458	336.17	333.80
1977.542	334.88	334.02
1977.625	332.56	333.91
1977.708	331.29	334.36
1977.792	331.27	334.52
1977.875	332.41	334.64
1977.958	333.60	334.61
1978.042	334.95	335.01
1978.125	335.25	334.58
1978.208	336.66	335.00
1978.292	337.69	335.06
1978.375	338.03	335.06
1978.458	338.01	335.59
1978.542	336.41	335.57
1978.625	334.42	335.87
1978.708	332.37	335.51
1978.792	332.41	335.68
1978.875	333.75	335.99
1978.958	334.90	335.88
1979.042	336.14	336.22
1979.125	336.69	336.01
1979.208	338.27	336.54
1979.292	338.95	336.24
1979.375	339.21	336.21
1979.458	339.26	336.84
1979.542	337.54	336.72
1979.625	335.75	337.24
1979.708	333.98	337.20
1979.792	334.19	337.53
1979.875	335.31	337.57
1979.958	336.81	337.79
1980.042	337.90	338.09
1980.125	338.34	337.82
1980.208	340.01	338.43
1980.292	340.93	338.30
1980.375	341.48	338.43
1980.458	341.33	338.84
1980.542	339.40	338.54
1980.625	337.70	339.12
1980.708	336.19	339.33
1980.792	336.15	339.42
1980.875	337.27	339.42
1980.958	338.32	339.26
1981.042	339.29	339.38
1981.125	340.55	339.93
1981.208	341.61	340.06
1981.292	342.53	339.94
1981.375	343.03	339.98
1981.458	342.54	340.07
1981.542	340.78	339.92
1981.625	338.44	339.86
1981.708	336.95	340.17
1981.792	337.08	340.43
1981.875	338.58	340.74
1981.958	339.88	340.79
1982.042	340.96	341.10
1982.125	341.73	341.10
1982.208	342.81	341.21
1982.292	343.97	341.37
1982.375	344.63	341.56
1982.458	343.79	341.35
1982.542	342.32	341.55
1982.625	340.09	341.51
1982.708	338.28	341.47
1982.792	338.29	341.65
1982.875	339.60	341.73
1982.958	340.90	341.79
1983.042	341.68	341.84
1983.125	342.90	342.32
1983.208	343.33	341.82
1983.292	345.25	342.66
1983.375	346.03	342.87
1983.458	345.63	343.15
1983.542	344.19	343.44
1983.625	342.27	343.66
1983.708	340.35	343.49
1983.792	340.38	343.72
1983.875	341.59	343.71
1983.958	343.05	343.96
1984.042	344.10	344.20
1984.125	344.79	344.22
1984.208	345.52	344.09
1984.292	-99.99	344.27
1984.375	347.63	344.45
1984.458	346.98	344.52
1984.542	345.53	344.76
1984.625	343.55	344.94
1984.708	341.40	344.58
1984.792	341.67	345.01
1984.875	343.10	345.20
1984.958	344.70	345.57
1985.042	345.21	345.31
1985.125	346.16	345.61
1985.208	347.74	346.37
1985.292	348.34	345.79
1985.375	349.06	345.91
1985.458	348.38	345.94
1985.542	346.71	345.89
1985.625	345.02	346.34
1985.708	343.27	346.40
1985.792	343.13	346.42
1985.875	344.49	346.61
1985.958	345.88	346.81
1986.042	346.56	346.59
1986.125	347.28	346.74
1986.208	348.01	346.68
1986.292	349.77	347.22
1986.375	350.38	347.26
1986.458	349.93	347.52
1986.542	348.16	347.33
1986.625	346.08	347.41
1986.708	345.22	348.35
1986.792	344.51	347.77
1986.875	345.93	348.04
1986.958	347.21	348.12
1987.042	348.52	348.47
1987.125	348.73	348.02
1987.208	349.73	348.30
1987.292	351.31	348.77
1987.375	352.09	349.01
1987.458	351.53	349.20
1987.542	350.11	349.39
1987.625	348.08	349.49
1987.708	346.52	349.70
1987.792	346.59	349.86
1987.875	347.96	350.07
1987.958	349.16	350.05
1988.042	350.39	350.38
1988.125	351.64	350.94
1988.208	352.40	350.87
1988.292	353.69	351.01
1988.375	354.21	351.06
1988.458	353.72	351.37
1988.542	352.69	352.02
1988.625	350.40	351.90
1988.708	348.92	352.13
1988.792	349.13	352.41
1988.875	350.20	352.34
1988.958	351.41	352.35
1989.042	352.91	352.85
1989.125	353.27	352.54
1989.208	353.96	352.47
1989.292	355.64	352.97
1989.375	355.86	352.67
1989.458	355.37	352.97
1989.542	353.99	353.30
1989.625	351.81	353.37
1989.708	350.05	353.32
1989.792	350.25	353.52
1989.875	351.49	353.65
1989.958	352.85	353.80
1990.042	353.80	353.75
1990.125	355.04	354.33
1990.208	355.73	354.24
1990.292	356.32	353.68
1990.375	357.32	354.16
1990.458	356.34	353.97
1990.542	354.84	354.19
1990.625	353.01	354.61
1990.708	351.31	354.61
1990.792	351.62	354.89
1990.875	353.07	355.13
1990.958	354.33	355.19
1991.042	354.84	354.82
1991.125	355.73	355.02
1991.208	357.23	355.67
1991.292	358.66	356.02
1991.375	359.13	356.01
1991.458	358.13	355.79
1991.542	356.19	355.59
1991.625	353.85	355.46
1991.708	352.25	355.56
1991.792	352.35	355.62
1991.875	353.81	355.80
1991.958	355.12	355.93
1992.042	356.25	356.20
1992.125	357.11	356.38
1992.208	357.86	356.27
1992.292	359.09	356.39
1992.375	359.59	356.41
1992.458	359.33	356.97
1992.542	357.01	356.44
1992.625	354.94	356.62
1992.708	352.96	356.29
1992.792	353.32	356.63
1992.875	354.32	356.38
1992.958	355.57	356.39
1993.042	357.00	356.96
1993.125	357.31	356.44
1993.208	358.47	356.76
1993.292	359.27	356.59
1993.375	360.19	357.03
1993.458	359.52	357.12
1993.542	357.33	356.76
1993.625	355.64	357.32
1993.708	354.03	357.39
1993.792	354.12	357.49
1993.875	355.41	357.54
1993.958	356.91	357.80
1994.042	358.24	358.13
1994.125	358.92	358.09
1994.208	359.99	358.29
1994.292	361.23	358.46
1994.375	361.65	358.46
1994.458	360.81	358.44
1994.542	359.38	358.79
1994.625	357.46	359.16
1994.708	355.73	359.17
1994.792	356.08	359.49
1994.875	357.53	359.68
1994.958	358.98	359.83
1995.042	359.92	359.79
1995.125	360.86	360.05
1995.208	361.83	360.22
1995.292	363.30	360.62
1995.375	363.69	360.58
1995.458	363.19	360.84
1995.542	361.64	360.97
1995.625	359.12	360.73
1995.708	358.17	361.55
1995.792	357.99	361.37
1995.875	359.45	361.59
1995.958	360.68	361.53
1996.042	362.07	361.85
1996.125	363.24	362.35
1996.208	364.17	362.53
1996.292	364.57	361.86
1996.375	365.13	362.10
1996.458	364.92	362.69
1996.542	363.55	362.85
1996.625	361.38	362.98
1996.708	359.54	362.99
1996.792	359.58	362.97
1996.875	360.89	363.03
1996.958	362.24	363.08
1997.042	363.09	362.88
1997.125	364.03	363.22
1997.208	364.51	362.88
1997.292	366.35	363.68
1997.375	366.64	363.74
1997.458	365.59	363.41
1997.542	364.31	363.60
1997.625	362.25	363.84
1997.708	360.29	363.68
1997.792	360.82	364.12
1997.875	362.49	364.56
1997.958	364.38	365.15
1998.042	365.26	365.07
1998.125	365.98	365.17
1998.208	367.24	365.60
1998.292	368.66	366.03
1998.375	369.42	366.55
1998.458	368.99	366.80
1998.542	367.82	367.14
1998.625	365.95	367.55
1998.708	364.02	367.37
1998.792	364.40	367.67
1998.875	365.52	367.56
1998.958	367.13	367.88
1999.042	368.18	367.96
1999.125	369.07	368.26
1999.208	369.68	368.08
1999.292	370.99	368.45
1999.375	370.96	368.15
1999.458	370.30	368.13
1999.542	369.45	368.77
1999.625	366.90	368.48
1999.708	364.81	368.13
1999.792	365.37	368.64
1999.875	366.72	368.71
1999.958	368.10	368.77
2000.042	369.29	369.08
2000.125	369.54	368.83
2000.208	370.60	369.09
2000.292	371.82	369.28
2000.375	371.58	368.71
2000.458	371.70	369.50
2000.542	369.86	369.20
2000.625	368.13	369.72
2000.708	367.00	370.30
2000.792	367.03	370.26
2000.875	368.37	370.32
2000.958	369.67	370.30
2001.042	370.59	370.43
2001.125	371.51	370.78
2001.208	372.43	370.87
2001.292	373.37	370.81
2001.375	373.85	370.94
2001.458	373.22	370.99
2001.542	371.51	370.90
2001.625	369.61	371.22
2001.708	368.18	371.44
2001.792	368.45	371.69
2001.875	369.76	371.74
2001.958	371.24	371.92
2002.042	372.53	372.30
2002.125	373.20	372.33
2002.208	374.12	372.44
2002.292	375.02	372.37
2002.375	375.76	372.81
2002.458	375.52	373.30
2002.542	374.01	373.42
2002.625	371.85	373.52
2002.708	370.75	374.11
2002.792	370.55	373.88
2002.875	372.25	374.34
2002.958	373.79	374.54
2003.042	374.88	374.63
2003.125	375.64	374.77
2003.208	376.45	374.80
2003.292	377.73	375.06
2003.375	378.60	375.55
2003.458	378.28	376.04
2003.542	376.70	376.19
2003.625	374.38	376.08
2003.708	373.17	376.48
2003.792	373.15	376.47
2003.875	374.66	376.81
2003.958	375.99	376.75
2004.042	377.00	376.78
2004.125	377.87	377.02
2004.208	378.88	377.23
2004.292	380.35	377.62
2004.375	380.62	377.48
2004.458	379.69	377.39
2004.542	377.47	376.94
2004.625	376.01	377.74
2004.708	374.25	377.62
2004.792	374.46	377.82
2004.875	376.16	378.31
2004.958	377.51	378.32
2005.042	378.46	378.21
2005.125	379.73	378.93
2005.208	380.77	379.27
2005.292	382.29	379.65
2005.375	382.45	379.31
2005.458	382.21	379.88
2005.542	380.74	380.18
2005.625	378.74	380.42
2005.708	376.70	380.01
2005.792	377.00	380.31
2005.875	378.35	380.50
2005.958	380.11	380.90
2006.042	381.38	381.14
2006.125	382.19	381.39
2006.208	382.67	381.14
2006.292	384.61	381.91
2006.375	385.03	381.87
2006.458	384.05	381.75
2006.542	382.46	381.91
2006.625	380.41	382.08
2006.708	378.85	382.16
2006.792	379.13	382.46
2006.875	380.15	382.33
2006.958	381.82	382.64
2007.042	382.89	382.67
2007.125	383.90	383.01
2007.208	384.58	382.94
2007.292	386.50	383.71
2007.375	386.56	383.34
2007.458	386.10	383.84
2007.542	384.50	384.02
2007.625	381.99	383.70
2007.708	380.96	384.32
2007.792	381.12	384.47
2007.875	382.45	384.65
2007.958	383.95	384.83
2008.042	385.52	385.28
2008.125	385.82	384.96
2008.208	386.03	384.48
2008.292	387.21	384.58
2008.375	388.54	385.45
2008.458	387.76	385.46
2008.542	386.36	385.80
2008.625	384.09	385.75
2008.708	383.18	386.46
2008.792	382.99	386.27
2008.875	384.19	386.37
2008.958	385.56	386.41
2009.042	386.94	386.63
2009.125	387.48	386.59
2009.208	388.82	387.32
2009.292	389.55	386.92
2009.375	390.14	387.02
2009.458	389.48	387.24
2009.542	388.03	387.55
2009.625	386.11	387.80
2009.708	384.74	388.01
2009.792	384.43	387.68
2009.875	386.02	388.16
2009.958	387.42	388.23
2010.042	388.71	388.41
2010.125	390.20	389.26
2010.208	391.17	389.65
2010.292	392.46	389.89
2010.375	393.00	389.88
2010.458	392.15	389.89
2010.542	390.20	389.72
2010.625	388.35	390.01
2010.708	386.85	390.14
2010.792	387.24	390.53
2010.875	388.67	390.79
2010.958	389.79	390.60
2011.042	391.33	391.03
2011.125	391.86	390.94
2011.208	392.60	391.07
2011.292	393.25	390.63
2011.375	394.19	391.02
2011.458	393.74	391.44
2011.542	392.51	392.03
2011.625	390.13	391.83
2011.708	389.08	392.40
2011.792	389.00	392.33
2011.875	390.28	392.44
2011.958	391.86	392.66
2012.042	393.12	392.89
2012.125	393.86	393.04
2012.208	394.40	392.80
2012.292	396.18	393.43
2012.375	396.74	393.54
2012.458	395.71	393.45
2012.542	394.36	393.92
2012.625	392.39	394.17
2012.708	391.11	394.54
2012.792	391.05	394.41
2012.875	392.98	395.02
2012.958	394.34	395.04
2013.042	395.55	395.40
2013.125	396.80	396.01
2013.208	397.43	395.84
2013.292	398.41	395.53
2013.375	399.78	396.40
2013.458	398.61	396.28
2013.542	397.32	396.92
2013.625	395.20	397.08
2013.708	393.45	396.99
2013.792	393.70	397.04
2013.875	395.16	397.15
2013.958	396.84	397.59
2014.042	397.85	397.55
2014.125	398.01	397.21
2014.208	399.77	398.24
2014.292	401.38	398.49
2014.375	401.78	398.37
2014.458	401.25	398.93
2014.542	399.10	398.67
2014.625	397.03	398.92
2014.708	395.38	398.97
2014.792	396.03	399.44
2014.875	397.28	399.36
2014.958	398.91	399.64
2015.042	399.98	399.73
2015.125	400.28	399.52
2015.208	401.54	400.03
2015.292	403.28	400.38
2015.375	403.96	400.51
2015.458	402.80	400.48
2015.542	401.31	400.93
2015.625	398.93	400.85
2015.708	397.63	401.26
2015.792	398.29	401.69
2015.875	400.16	402.11
2015.958	401.85	402.51
2016.042	402.56	402.27
2016.125	404.12	403.30
2016.208	404.87	403.39
2016.292	407.45	404.61
2016.375	407.72	404.26
2016.458	406.83	404.49
2016.542	404.41	404.05
2016.625	402.27	404.18
2016.708	401.05	404.65
2016.792	401.59	405.01
2016.875	403.55	405.54
2016.958	404.45	405.12
2017.042	406.17	405.88
2017.125	406.46	405.63
2017.208	407.22	405.73
2017.292	409.04	406.21
2017.375	409.69	406.22
2017.458	408.88	406.54
2017.542	407.12	406.77
2017.625	405.13	407.03
2017.708	403.37	406.98
2017.792	403.63	407.05
2017.875	405.12	407.11
2017.958	406.81	407.48
2018.042	407.96	407.67
2018.125	408.32	407.50
2018.208	409.41	407.92
2018.292	410.24	407.41
2018.375	411.24	407.77
2018.458	410.79	408.45
2018.542	408.71	408.35
2018.625	406.99	408.90
2018.708	405.51	409.11
2018.792	406.00	409.42
2018.875	408.02	410.01
2018.958	409.07	409.75
2019.042	410.83	410.54
2019.125	411.75	410.92
2019.208	411.97	410.48
2019.292	413.32	410.48
2019.375	414.66	411.19
2019.458	413.92	411.57
2019.542	411.77	411.41
2019.625	409.95	411.85
2019.708	408.54	412.14
2019.792	408.53	411.95
2019.875	410.27	412.26
2019.958	411.76	412.43
`.trim();

    /* src/site/examples/data/0/App.svelte generated by Svelte v3.38.2 */
    const file = "src/site/examples/data/0/App.svelte";

    // (51:2) <Pancake.Grid horizontal count={5} let:value let:last>
    function create_default_slot_11(ctx) {
    	let div;
    	let span;
    	let t0_value = /*value*/ ctx[12] + "";
    	let t0;
    	let t1;
    	let t2_value = (/*last*/ ctx[13] ? "ppm" : "") + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(span, "class", "svelte-7rp9e3");
    			add_location(span, file, 51, 37, 1123);
    			attr_dev(div, "class", "grid-line horizontal svelte-7rp9e3");
    			add_location(div, file, 51, 3, 1089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 4096 && t0_value !== (t0_value = /*value*/ ctx[12] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*last*/ 8192 && t2_value !== (t2_value = (/*last*/ ctx[13] ? "ppm" : "") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(51:2) <Pancake.Grid horizontal count={5} let:value let:last>",
    		ctx
    	});

    	return block;
    }

    // (55:2) <Pancake.Grid vertical count={5} let:value>
    function create_default_slot_10(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*value*/ ctx[12] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(div, "class", "grid-line vertical svelte-7rp9e3");
    			add_location(div, file, 55, 3, 1238);
    			attr_dev(span, "class", "year-label svelte-7rp9e3");
    			add_location(span, file, 56, 3, 1280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 4096 && t1_value !== (t1_value = /*value*/ ctx[12] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(55:2) <Pancake.Grid vertical count={5} let:value>",
    		ctx
    	});

    	return block;
    }

    // (61:3) <Pancake.SvgScatterplot data={points} x="{d => d.date}" y="{d => d.avg}" let:d>
    function create_default_slot_9(ctx) {
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "avg scatter svelte-7rp9e3");
    			attr_dev(path, "d", path_d_value = /*d*/ ctx[11]);
    			add_location(path, file, 61, 4, 1442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*d*/ 2048 && path_d_value !== (path_d_value = /*d*/ ctx[11])) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(61:3) <Pancake.SvgScatterplot data={points} x=\\\"{d => d.date}\\\" y=\\\"{d => d.avg}\\\" let:d>",
    		ctx
    	});

    	return block;
    }

    // (65:3) <Pancake.SvgLine data={points} x="{d => d.date}" y="{d => d.avg}" let:d>
    function create_default_slot_8(ctx) {
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "avg svelte-7rp9e3");
    			attr_dev(path, "d", path_d_value = /*d*/ ctx[11]);
    			add_location(path, file, 65, 4, 1584);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*d*/ 2048 && path_d_value !== (path_d_value = /*d*/ ctx[11])) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(65:3) <Pancake.SvgLine data={points} x=\\\"{d => d.date}\\\" y=\\\"{d => d.avg}\\\" let:d>",
    		ctx
    	});

    	return block;
    }

    // (69:3) <Pancake.SvgLine data={points} x="{d => d.date}" y="{d => d.trend}" let:d>
    function create_default_slot_7(ctx) {
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "trend svelte-7rp9e3");
    			attr_dev(path, "d", path_d_value = /*d*/ ctx[11]);
    			add_location(path, file, 69, 4, 1713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*d*/ 2048 && path_d_value !== (path_d_value = /*d*/ ctx[11])) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(69:3) <Pancake.SvgLine data={points} x=\\\"{d => d.date}\\\" y=\\\"{d => d.trend}\\\" let:d>",
    		ctx
    	});

    	return block;
    }

    // (60:2) <Pancake.Svg>
    function create_default_slot_6(ctx) {
    	let pancake_svgscatterplot;
    	let t0;
    	let pancake_svgline0;
    	let t1;
    	let pancake_svgline1;
    	let current;

    	pancake_svgscatterplot = new SvgScatterplot({
    			props: {
    				data: /*points*/ ctx[3],
    				x: func,
    				y: func_1,
    				$$slots: {
    					default: [create_default_slot_9, ({ d }) => ({ 11: d }), ({ d }) => d ? 2048 : 0]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_svgline0 = new SvgLine({
    			props: {
    				data: /*points*/ ctx[3],
    				x: func_2,
    				y: func_3,
    				$$slots: {
    					default: [create_default_slot_8, ({ d }) => ({ 11: d }), ({ d }) => d ? 2048 : 0]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_svgline1 = new SvgLine({
    			props: {
    				data: /*points*/ ctx[3],
    				x: func_4,
    				y: func_5,
    				$$slots: {
    					default: [create_default_slot_7, ({ d }) => ({ 11: d }), ({ d }) => d ? 2048 : 0]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pancake_svgscatterplot.$$.fragment);
    			t0 = space();
    			create_component(pancake_svgline0.$$.fragment);
    			t1 = space();
    			create_component(pancake_svgline1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pancake_svgscatterplot, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(pancake_svgline0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(pancake_svgline1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pancake_svgscatterplot_changes = {};

    			if (dirty & /*$$scope, d*/ 18432) {
    				pancake_svgscatterplot_changes.$$scope = { dirty, ctx };
    			}

    			pancake_svgscatterplot.$set(pancake_svgscatterplot_changes);
    			const pancake_svgline0_changes = {};

    			if (dirty & /*$$scope, d*/ 18432) {
    				pancake_svgline0_changes.$$scope = { dirty, ctx };
    			}

    			pancake_svgline0.$set(pancake_svgline0_changes);
    			const pancake_svgline1_changes = {};

    			if (dirty & /*$$scope, d*/ 18432) {
    				pancake_svgline1_changes.$$scope = { dirty, ctx };
    			}

    			pancake_svgline1.$set(pancake_svgline1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pancake_svgscatterplot.$$.fragment, local);
    			transition_in(pancake_svgline0.$$.fragment, local);
    			transition_in(pancake_svgline1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pancake_svgscatterplot.$$.fragment, local);
    			transition_out(pancake_svgline0.$$.fragment, local);
    			transition_out(pancake_svgline1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pancake_svgscatterplot, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(pancake_svgline0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(pancake_svgline1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(60:2) <Pancake.Svg>",
    		ctx
    	});

    	return block;
    }

    // (75:2) <Pancake.Point x={1962} y={390}>
    function create_default_slot_5(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let t7;
    	let span3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Atmospheric CO₂";
    			t1 = space();
    			p = element("p");
    			span0 = element("span");
    			span0.textContent = "•";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "monthly average   ";
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "—";
    			t7 = space();
    			span3 = element("span");
    			span3.textContent = "trend";
    			attr_dev(h2, "class", "svelte-7rp9e3");
    			add_location(h2, file, 76, 4, 1863);
    			set_style(span0, "color", "#676778");
    			add_location(span0, file, 79, 5, 1902);
    			add_location(span1, file, 80, 5, 1945);
    			set_style(span2, "color", "#ff3e00");
    			add_location(span2, file, 81, 5, 1997);
    			add_location(span3, file, 82, 5, 2040);
    			attr_dev(p, "class", "svelte-7rp9e3");
    			add_location(p, file, 78, 4, 1893);
    			attr_dev(div, "class", "text svelte-7rp9e3");
    			add_location(div, file, 75, 3, 1840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, span0);
    			append_dev(p, t3);
    			append_dev(p, span1);
    			append_dev(p, t5);
    			append_dev(p, span2);
    			append_dev(p, t7);
    			append_dev(p, span3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(75:2) <Pancake.Point x={1962} y={390}>",
    		ctx
    	});

    	return block;
    }

    // (89:2) <Pancake.Point x={2015} y={330}>
    function create_default_slot_4(ctx) {
    	let div;
    	let p;
    	let em;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			em = element("em");
    			em.textContent = "This chart will render correctly even if JavaScript is disabled.";
    			add_location(em, file, 90, 7, 2215);
    			attr_dev(p, "class", "svelte-7rp9e3");
    			add_location(p, file, 90, 4, 2212);
    			attr_dev(div, "class", "text svelte-7rp9e3");
    			set_style(div, "right", "0");
    			set_style(div, "text-align", "right");
    			add_location(div, file, 89, 3, 2152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, em);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(89:2) <Pancake.Point x={2015} y={330}>",
    		ctx
    	});

    	return block;
    }

    // (96:2) <Pancake.Point x={highest.date} y={highest.avg}>
    function create_default_slot_3(ctx) {
    	let div;
    	let t0_value = /*highest*/ ctx[2].avg + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" parts per million (ppm) →");
    			attr_dev(div, "class", "annotation");
    			set_style(div, "position", "absolute");
    			set_style(div, "right", "0.5em");
    			set_style(div, "top", "-0.5em");
    			set_style(div, "white-space", "nowrap");
    			set_style(div, "line-height", "1");
    			set_style(div, "color", "#666");
    			add_location(div, file, 96, 3, 2411);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*highest*/ 4 && t0_value !== (t0_value = /*highest*/ ctx[2].avg + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(96:2) <Pancake.Point x={highest.date} y={highest.avg}>",
    		ctx
    	});

    	return block;
    }

    // (103:3) {#if closest}
    function create_if_block(ctx) {
    	let pancake_point;
    	let current;

    	pancake_point = new Point({
    			props: {
    				x: /*closest*/ ctx[10].date,
    				y: /*closest*/ ctx[10].avg,
    				$$slots: {
    					default: [create_default_slot_2, ({ d }) => ({ 11: d }), ({ d }) => d ? 2048 : 0]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pancake_point.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pancake_point, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pancake_point_changes = {};
    			if (dirty & /*closest*/ 1024) pancake_point_changes.x = /*closest*/ ctx[10].date;
    			if (dirty & /*closest*/ 1024) pancake_point_changes.y = /*closest*/ ctx[10].avg;

    			if (dirty & /*$$scope, closest*/ 17408) {
    				pancake_point_changes.$$scope = { dirty, ctx };
    			}

    			pancake_point.$set(pancake_point_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pancake_point.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pancake_point.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pancake_point, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(103:3) {#if closest}",
    		ctx
    	});

    	return block;
    }

    // (104:4) <Pancake.Point x={closest.date} y={closest.avg} let:d>
    function create_default_slot_2(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let strong;
    	let t1_value = /*closest*/ ctx[10].avg + "";
    	let t1;
    	let t2;
    	let t3;
    	let span;
    	let t4_value = /*format*/ ctx[6](/*closest*/ ctx[10].date) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			strong = element("strong");
    			t1 = text(t1_value);
    			t2 = text(" ppm");
    			t3 = space();
    			span = element("span");
    			t4 = text(t4_value);
    			attr_dev(div0, "class", "focus svelte-7rp9e3");
    			add_location(div0, file, 104, 5, 2783);
    			attr_dev(strong, "class", "svelte-7rp9e3");
    			add_location(strong, file, 106, 6, 2895);
    			add_location(span, file, 107, 6, 2936);
    			attr_dev(div1, "class", "tooltip svelte-7rp9e3");
    			set_style(div1, "transform", "translate(-" + /*pc*/ ctx[7](/*closest*/ ctx[10].date) + "%,0)");
    			add_location(div1, file, 105, 5, 2814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, strong);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(div1, t3);
    			append_dev(div1, span);
    			append_dev(span, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*closest*/ 1024 && t1_value !== (t1_value = /*closest*/ ctx[10].avg + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*closest*/ 1024 && t4_value !== (t4_value = /*format*/ ctx[6](/*closest*/ ctx[10].date) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*closest*/ 1024) {
    				set_style(div1, "transform", "translate(-" + /*pc*/ ctx[7](/*closest*/ ctx[10].date) + "%,0)");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(104:4) <Pancake.Point x={closest.date} y={closest.avg} let:d>",
    		ctx
    	});

    	return block;
    }

    // (102:2) <Pancake.Quadtree data={points} x="{d => d.date}" y="{d => d.avg}" let:closest>
    function create_default_slot_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*closest*/ ctx[10] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*closest*/ ctx[10]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*closest*/ 1024) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(102:2) <Pancake.Quadtree data={points} x=\\\"{d => d.date}\\\" y=\\\"{d => d.avg}\\\" let:closest>",
    		ctx
    	});

    	return block;
    }

    // (50:1) <Pancake.Chart x1={minx} x2={maxx} y1={miny} y2={maxy}>
    function create_default_slot(ctx) {
    	let pancake_grid0;
    	let t0;
    	let pancake_grid1;
    	let t1;
    	let pancake_svg;
    	let t2;
    	let pancake_point0;
    	let t3;
    	let pancake_point1;
    	let t4;
    	let pancake_point2;
    	let t5;
    	let pancake_quadtree;
    	let current;

    	pancake_grid0 = new Grid({
    			props: {
    				horizontal: true,
    				count: 5,
    				$$slots: {
    					default: [
    						create_default_slot_11,
    						({ value, last }) => ({ 12: value, 13: last }),
    						({ value, last }) => (value ? 4096 : 0) | (last ? 8192 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_grid1 = new Grid({
    			props: {
    				vertical: true,
    				count: 5,
    				$$slots: {
    					default: [
    						create_default_slot_10,
    						({ value }) => ({ 12: value }),
    						({ value }) => value ? 4096 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_svg = new Svg({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_point0 = new Point({
    			props: {
    				x: 1962,
    				y: 390,
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_point1 = new Point({
    			props: {
    				x: 2015,
    				y: 330,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_point2 = new Point({
    			props: {
    				x: /*highest*/ ctx[2].date,
    				y: /*highest*/ ctx[2].avg,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pancake_quadtree = new Quadtree_1({
    			props: {
    				data: /*points*/ ctx[3],
    				x: func_6,
    				y: func_7,
    				$$slots: {
    					default: [
    						create_default_slot_1,
    						({ closest }) => ({ 10: closest }),
    						({ closest }) => closest ? 1024 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pancake_grid0.$$.fragment);
    			t0 = space();
    			create_component(pancake_grid1.$$.fragment);
    			t1 = space();
    			create_component(pancake_svg.$$.fragment);
    			t2 = space();
    			create_component(pancake_point0.$$.fragment);
    			t3 = space();
    			create_component(pancake_point1.$$.fragment);
    			t4 = space();
    			create_component(pancake_point2.$$.fragment);
    			t5 = space();
    			create_component(pancake_quadtree.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pancake_grid0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(pancake_grid1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(pancake_svg, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(pancake_point0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(pancake_point1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(pancake_point2, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(pancake_quadtree, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pancake_grid0_changes = {};

    			if (dirty & /*$$scope, last, value*/ 28672) {
    				pancake_grid0_changes.$$scope = { dirty, ctx };
    			}

    			pancake_grid0.$set(pancake_grid0_changes);
    			const pancake_grid1_changes = {};

    			if (dirty & /*$$scope, value*/ 20480) {
    				pancake_grid1_changes.$$scope = { dirty, ctx };
    			}

    			pancake_grid1.$set(pancake_grid1_changes);
    			const pancake_svg_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				pancake_svg_changes.$$scope = { dirty, ctx };
    			}

    			pancake_svg.$set(pancake_svg_changes);
    			const pancake_point0_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				pancake_point0_changes.$$scope = { dirty, ctx };
    			}

    			pancake_point0.$set(pancake_point0_changes);
    			const pancake_point1_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				pancake_point1_changes.$$scope = { dirty, ctx };
    			}

    			pancake_point1.$set(pancake_point1_changes);
    			const pancake_point2_changes = {};
    			if (dirty & /*highest*/ 4) pancake_point2_changes.x = /*highest*/ ctx[2].date;
    			if (dirty & /*highest*/ 4) pancake_point2_changes.y = /*highest*/ ctx[2].avg;

    			if (dirty & /*$$scope, highest*/ 16388) {
    				pancake_point2_changes.$$scope = { dirty, ctx };
    			}

    			pancake_point2.$set(pancake_point2_changes);
    			const pancake_quadtree_changes = {};

    			if (dirty & /*$$scope, closest*/ 17408) {
    				pancake_quadtree_changes.$$scope = { dirty, ctx };
    			}

    			pancake_quadtree.$set(pancake_quadtree_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pancake_grid0.$$.fragment, local);
    			transition_in(pancake_grid1.$$.fragment, local);
    			transition_in(pancake_svg.$$.fragment, local);
    			transition_in(pancake_point0.$$.fragment, local);
    			transition_in(pancake_point1.$$.fragment, local);
    			transition_in(pancake_point2.$$.fragment, local);
    			transition_in(pancake_quadtree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pancake_grid0.$$.fragment, local);
    			transition_out(pancake_grid1.$$.fragment, local);
    			transition_out(pancake_svg.$$.fragment, local);
    			transition_out(pancake_point0.$$.fragment, local);
    			transition_out(pancake_point1.$$.fragment, local);
    			transition_out(pancake_point2.$$.fragment, local);
    			transition_out(pancake_quadtree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pancake_grid0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(pancake_grid1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(pancake_svg, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(pancake_point0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(pancake_point1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(pancake_point2, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(pancake_quadtree, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(50:1) <Pancake.Chart x1={minx} x2={maxx} y1={miny} y2={maxy}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let pancake_chart;
    	let t0;
    	let p;
    	let t1;
    	let a0;
    	let t3;
    	let a1;
    	let t5;
    	let current;

    	pancake_chart = new Chart({
    			props: {
    				x1: /*minx*/ ctx[4],
    				x2: /*maxx*/ ctx[5],
    				y1: /*miny*/ ctx[0],
    				y2: /*maxy*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(pancake_chart.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text("Source: ");
    			a0 = element("a");
    			a0.textContent = "Scripps Institution of Oceanography";
    			t3 = text(". Based on ");
    			a1 = element("a");
    			a1.textContent = "Carbon Clock by Bloomberg";
    			t5 = text(".");
    			attr_dev(div, "class", "chart svelte-7rp9e3");
    			add_location(div, file, 48, 0, 952);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://scrippsco2.ucsd.edu/data/atmospheric_co2/primary_mlo_co2_record.html");
    			add_location(a0, file, 115, 11, 3073);
    			attr_dev(a1, "href", "https://www.bloomberg.com/graphics/climate-change-data-green/carbon-clock.html");
    			add_location(a1, file, 115, 164, 3226);
    			add_location(p, file, 115, 0, 3062);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(pancake_chart, div, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);
    			append_dev(p, a0);
    			append_dev(p, t3);
    			append_dev(p, a1);
    			append_dev(p, t5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pancake_chart_changes = {};
    			if (dirty & /*miny*/ 1) pancake_chart_changes.y1 = /*miny*/ ctx[0];
    			if (dirty & /*maxy*/ 2) pancake_chart_changes.y2 = /*maxy*/ ctx[1];

    			if (dirty & /*$$scope, highest*/ 16388) {
    				pancake_chart_changes.$$scope = { dirty, ctx };
    			}

    			pancake_chart.$set(pancake_chart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pancake_chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pancake_chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(pancake_chart);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = d => d.date;
    const func_1 = d => d.avg;
    const func_2 = d => d.date;
    const func_3 = d => d.avg;
    const func_4 = d => d.date;
    const func_5 = d => d.trend;
    const func_6 = d => d.date;
    const func_7 = d => d.avg;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const data = tsv.split("\n").map(str => {
    		let [date, avg, trend] = str.split("\t").map(parseFloat);
    		if (avg === -99.99) avg = null;
    		return { date, avg, trend };
    	});

    	const points = data.filter(d => d.avg);
    	let minx = points[0].date;
    	let maxx = points[points.length - 1].date;
    	let miny = +Infinity;
    	let maxy = -Infinity;
    	let highest;

    	for (let i = 0; i < points.length; i += 1) {
    		const point = points[i];

    		if (point.avg < miny) {
    			miny = point.avg;
    		}

    		if (point.avg > maxy) {
    			maxy = point.avg;
    			highest = point;
    		}
    	}

    	const months = ("Jan Feb Mar Apr May June July Aug Sept Oct Nov Dec").split(" ");

    	const format = date => {
    		const year = ~~date;
    		const month = Math.floor(date % 1 * 12);
    		return `${months[month]} ${year}`;
    	};

    	const pc = date => {
    		return 100 * (date - minx) / (maxx - minx);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Pancake,
    		tsv,
    		data,
    		points,
    		minx,
    		maxx,
    		miny,
    		maxy,
    		highest,
    		months,
    		format,
    		pc
    	});

    	$$self.$inject_state = $$props => {
    		if ("minx" in $$props) $$invalidate(4, minx = $$props.minx);
    		if ("maxx" in $$props) $$invalidate(5, maxx = $$props.maxx);
    		if ("miny" in $$props) $$invalidate(0, miny = $$props.miny);
    		if ("maxy" in $$props) $$invalidate(1, maxy = $$props.maxy);
    		if ("highest" in $$props) $$invalidate(2, highest = $$props.highest);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [miny, maxy, highest, points, minx, maxx, format, pc];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let app;
    	let current;
    	app = new App({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(app.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(app, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(app.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(app.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(app, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ App });
    	return [];
    }

    class App_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App_1",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App_1({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
