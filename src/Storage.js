;(function() {
    // as a mixin or standalone class that can cache anything into local storage.
    // fallback to window.name - careful when using in (i)frames.

    this.Storage = new Class({

        storage: {}, // you can puncture this through classname.storage[key]

        Implements: [Options],

        options: {
            storageMethod: 'sessionStorage', // or localStorage
            privateKey: 'myStorage' // sub key for namespacing
        },

        initialize: function(options) {
            this.setOptions(options);
            this.storageMethod = this.options.storageMethod;

            // uncomment below if you don't use as a mixin via implements.
            this.setupStorage();
        },

        setupStorage: function() {
            // main method that needs to be called to set the api up and handles detection
            // 3 levels of degradation. with storage, without -> window.name or a simple {}
            var storage;

            this.hasNativeStorage = !!(typeof window[this.storageMethod] == 'object' && window[this.storageMethod].getItem);

            // try native
            if (this.hasNativeStorage) {
                try {
                    this.storage = JSON.decode(window[this.storageMethod].getItem(this.options.privateKey)) || this.storage;
                }
                catch(e) {
                    // session expired / multiple tabs error (security), downgrade.
                    this.hasNativeStorage = false;
                }
            }

            if (!this.hasNativeStorage) {
                // try to use a serialized object in window.name instead
                try {
                    storage = JSON.decode(window.name);
                    if (storage && typeof storage == 'object' && storage[this.options.privateKey])
                        this.storage = storage[this.options.privateKey];
                }
                catch(e) {
                    // window.name was something else. pass on our current object.
                    this._serializeWindowName();
                }
            }

            return this;
        },

        getItem: function(item) {
            // return from storage in memory
            return this.storage[item] || null;
        },

        setItem: function(item, value) {
            // add a key to storage hash
            this.storage = JSON.decode(window[this.storageMethod].getItem(this.options.privateKey)) || this.storage;
            this.storage[item] = value;

            if (this.hasNativeStorage) {
                try {
                    window[this.storageMethod].setItem(this.options.privateKey, JSON.encode(this.storage));
                }
                catch(e) {
                    // session expired / tabs error (security)
                }
            }
            else {
                this._serializeWindowName();
            }

            return this;
        },

        removeItem: function(item) {
            // remove a key from the storage hash
            delete this.storage[item];

            if (this.hasNativeStorage) {
                try {
                    window[this.storageMethod].setItem(this.options.privateKey, JSON.encode(this.storage));
                }
                catch(e) {
                    // session expired / tabs error (security)
                }
            }
            else {
                // remove from window.name also.
                this._serializeWindowName();
            }
        },

        _serializeWindowName: function() {
            // this is the fallback that merges storage into window.name
            var obj = {},
                storage = JSON.decode(window.name);

            obj[this.options.privateKey] = this.storage;
            window.name = JSON.encode(Object.merge(obj, storage));
        }
    });

}());