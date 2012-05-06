
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
        Search.SearchProvider.prototype._init.call(this, _('Windows'));
    },

    getResultMeta: function(app) {
        let self = this;
        return { 'id': app.get_id(),
                 'name': app.get_name() + ' - ' + app.get_windows()[0].get_title(),
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

        let windowTexture = mutterWindow.get_texture ();
	let [width, height] = windowTexture.get_size();
	let scale = Math.min(1.0, sizew / width, sizeh / height);
	let clone = new Clutter.Clone ({ source: windowTexture,
					 reactive: true,
                                         width: width * scale,
                                         height: height * scale });
	global.log(clone);
	return clone;
    },

    _matchTerms: function(apps, terms){
	let as = apps;
	for (let i = 0; i < terms.length; i++) {
	    let term = terms[i];
	    as = as.filter(function(app){
			       let name = app.get_name();
			       let title = app.get_windows()[0].get_title();
			       return  (name.indexOf(term) >= 0 ||
					title.indexOf(term) >= 0);
			   });
	    global.log(as);
        }
	return as;
    },

    getInitialResultSet: function(terms) {
        let screen = global.screen;
        let display = screen.get_display();
        let windows = display.get_tab_list(Meta.TabList.NORMAL, screen,
                                           screen.get_active_workspace());

        let appSys = Shell.AppSystem.get_default();
        let allApps = appSys.get_running ();

	// copy the list
	return this._matchTerms(allApps.slice(0), terms);
    },

    getSubsearchResultSet: function(previousResults, terms) {
        return this._matchTerms(previousResults, terms);
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
