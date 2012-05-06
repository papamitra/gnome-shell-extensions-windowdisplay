
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Search = imports.ui.search;
const AppDisplay = imports.ui.appDisplay;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;

function WindowSearchProvider() {
    this._init();
}

WindowSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function() {
        Search.SearchProvider.prototype._init.call(this, 'window');
    },

    getResultMeta: function(app) {
        let self = this;
        return { 'id': app.get_id(),
                 'name': app.get_name(),
                 'createIcon': function(size) {
				   // return app.create_icon_texture(size);
		                  return self._getThumbnail(app,size);
                               }
               };
    },

    _getThumbnail: function(app,size){
	let mutterWindow = app.get_windows()[0].get_compositor_private();
	if (!mutterWindow)
	    return null;

	let [sizew, sizeh] = size;

	global.log(1);
        let windowTexture = mutterWindow.get_texture ();
	global.log(2);
	let [width, height] = windowTexture.get_size();
	global.log(3);
	let scale = Math.min(1.0, sizew / width, sizeh / height);
	global.log(4);
	let clone = new Clutter.Clone ({ source: windowTexture,
					 reactive: true,
                                         width: width * scale,
                                         height: height * scale });
	global.log(clone);
	return clone;
    },

    getInitialResultSet: function(terms) {
        let screen = global.screen;
        let display = screen.get_display();
        let windows = display.get_tab_list(Meta.TabList.NORMAL, screen,
                                           screen.get_active_workspace());

        let appSys = Shell.AppSystem.get_default();
        let allApps = appSys.get_running ();

        return allApps;
    },

    getSubsearchResultSet: function(previousResults, terms) {
        return previousResults;
    },

    // from altTab.js
    _getAppLists: function() {
        let tracker = Shell.WindowTracker.get_default();
        let appSys = Shell.AppSystem.get_default();
        let allApps = appSys.get_running ();

        let screen = global.screen;
        let display = screen.get_display();
        let windows = display.get_tab_list(Meta.TabList.NORMAL, screen,
                                           screen.get_active_workspace());

        // windows is only the windows on the current workspace. For
        // each one, if it corresponds to an app we know, move that
        // app from allApps to apps.
        let apps = [];
        for (let i = 0; i < windows.length && allApps.length != 0; i++) {
            let app = tracker.get_window_app(windows[i]);
            let index = allApps.indexOf(app);
            if (index != -1) {
                apps.push(app);
                allApps.splice(index, 1);
            }
        }

        // Now @apps is a list of apps on the current workspace, in
        // standard Alt+Tab order (MRU except for minimized windows),
        // and allApps is a list of apps that only appear on other
        // workspaces, sorted by user_time, which is good enough.
        return [apps, allApps];
    },

};

function WindowSearchExtension() {
    this._init();
}

WindowSearchExtension.prototype = {
    _init: function() {
        // do nothing.
    },

    enable: function() {
        this._windowProvider = new WindowSearchProvider();
        Main.overview.addSearchProvider(this._windowProvider);
    },

    disable: function() {
        Main.overview.removeSearchProvider(this._windowProvider);
	this._windowProvider = null;
    },
};

function init() {
    global.log('exec init');
    return new WindowSearchExtension();
}

// for gnome-3.0
function main() {
    global.log('exec main');
    let windowProvider = new WindowSearchProvider();
    Main.overview.viewSelector.addSearchProvider(windowsProvider);
}
