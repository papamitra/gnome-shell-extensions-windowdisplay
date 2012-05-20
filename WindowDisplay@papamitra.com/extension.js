
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Search = imports.ui.search;
const AppDisplay = imports.ui.appDisplay;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const Params = imports.misc.params;

const St = imports.gi.St;

function WindowSearchProvider() {
    this._init();
}

WindowSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function() {
        Search.SearchProvider.prototype._init.call(this, _('Windows'));
    },

    getResultMeta: function(win) {
	let tracker = Shell.WindowTracker.get_default();
        let self = this;
	let app = tracker.get_window_app(win);
        return { 'id': win,
                 'name': app.get_name() + ' - ' + win.get_title(),
                 'createIcon': function(size) {
		                  return self._getThumbnail(win,size);
                               }
               };
    },

    _getThumbnail: function(win,size){
	let mutterWindow = win.get_compositor_private();
	if (!mutterWindow)
	    return null;

        let windowTexture = mutterWindow.get_texture ();
	let [width, height] = windowTexture.get_size();
	let scale = Math.min(1.0, size / width, size / height);

	let clone = new Clutter.Clone ({ source: windowTexture,
					 reactive: true,
                                         width: width * scale,
                                         height: height * scale });

        let group = new Clutter.Group();

	let clonebin = new St.Bin();
	clonebin.add_actor(clone);
	clonebin.set_position( (size-(width*scale))/2,
			       (size-(height*scale))/2);
	group.add_actor(clonebin);

	// add appicon
        let tracker = Shell.WindowTracker.get_default();
	let app = tracker.get_window_app(win);
	let icon = app.create_icon_texture(size/3);
	let iconbin = new St.Bin();
	iconbin.set_opacity(200);
	iconbin.add_actor(icon);
	iconbin.set_position(size-size/3,size-size/3);
	group.add_actor(iconbin);

	return group;
    },

    _matchTerms: function(wins, terms){
        let tracker = Shell.WindowTracker.get_default();
	for (let i = 0; i < terms.length; i++) {
	    let term = terms[i].toUpperCase();
	    wins = wins.filter(function(win){
			       let name = tracker.get_window_app(win).get_name();
			       let title = win.get_title();
			       return  (name.toUpperCase().indexOf(term) >= 0 ||
					title.toUpperCase().indexOf(term) >= 0);
			   });
        }
	return wins;
    },

    getInitialResultSet: function(terms) {
        let screen = global.screen;
        let display = screen.get_display();
	let windows = []
	for(let i=0; i < screen.n_workspaces; i++){
	    windows = windows.concat(
		display.get_tab_list(Meta.TabList.NORMAL,
				     screen,
				     screen.get_workspace_by_index(i)));
	}
	return this._matchTerms(windows, terms);
    },

    getSubsearchResultSet: function(previousResults, terms) {
        return this._matchTerms(previousResults, terms);
    },

    activateResult: function(win, params) {
	let tracker = Shell.WindowTracker.get_default();
        // params = Params.parse(params, { workspace: -1,
        //                                timestamp: 0 });

        tracker.get_window_app(win).activate_window(win, global.get_current_time());
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
    return new WindowSearchExtension();
}
