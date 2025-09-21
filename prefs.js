/**
 * Auto Power Profile - GNOME Shell Extension Preferences
 * 
 * Manages the preferences interface for the auto power profile extension.
 * Provides configuration panels for general settings and performance apps.
 * 
 * @file prefs.js
 * @author Andre Vieira <andrecesarvieira@hotmail.com>
 */

// GTK/Adwaita imports for UI components
import Adw from "gi://Adw";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

// GNOME Shell extension preferences framework
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

// Local utilities for power profile management
import { createPowerProfilesProxy } from "./lib/utils.js";

/**
 * Loads D-Bus interface XML from GNOME Shell resources
 * 
 * This function is based on GNOME Shell's internal DBus utilities and provides
 * access to the power profiles daemon interface definitions.
 * 
 * @param {string} iface - Interface name to load (e.g., 'org.freedesktop.UPower.PowerProfiles')
 * @returns {string|null} XML interface definition or null on error
 * 
 * @see https://github.com/GNOME/gnome-shell/blob/main/js/misc/dbusUtils.js
 */
function loadInterfaceXML(iface) {
  const uri = `resource:///org/gnome/shell/dbus-interfaces/${iface}.xml`;
  const file = Gio.File.new_for_uri(uri);

  try {
    const [success, bytes] = file.load_contents(null);
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error(`Failed to load D-Bus interface ${iface}:`, error.message);
    return null;
  }
}

/**
 * Binds an Adwaita ComboRow to a GSettings key with bidirectional data flow
 * 
 * This utility function creates a two-way binding between a GTK ComboRow widget
 * and a GSettings string value. Changes in either the UI or settings are 
 * automatically synchronized.
 * 
 * @param {Adw.ComboRow} comboRow - The combo row widget to bind
 * @param {Gio.Settings} settings - The GSettings object containing the key
 * @param {string} key - The settings key name to bind to
 * @param {string[]} valueMap - Array mapping combo indices to setting values
 */
function bindAdwComboRow(comboRow, settings, key, valueMap) {
  // Initialize combo row with current setting value
  const currentValue = settings.get_string(key);
  const initialIndex = valueMap.indexOf(currentValue);
  comboRow.selected = initialIndex >= 0 ? initialIndex : 0;

  // Listen for changes in GSettings and update UI
  settings.connect(`changed::${key}`, () => {
    const newValue = settings.get_string(key);
    const newIndex = valueMap.indexOf(newValue);
    if (newIndex >= 0) {
      comboRow.selected = newIndex;
    }
  });

  // Listen for UI changes and update GSettings
  comboRow.connect("notify::selected", () => {
    const selectedValue = valueMap[comboRow.selected];
    if (selectedValue !== undefined) {
      settings.set_string(key, selectedValue);
    }
  });
}

/**
 * General Preferences Page
 * 
 * Provides the main configuration interface for power profile settings including:
 * - AC and battery power profile defaults
 * - Battery threshold for power saving mode
 * - Lap mode for laptops on unstable surfaces
 * - Animation control for battery optimization
 */
export const General = GObject.registerClass(
  {
    GTypeName: "AutoPowerProfileGeneralPrefs",
    Template: GLib.Uri.resolve_relative(
      import.meta.url,
      "./ui/general.ui",
      GLib.UriFlags.NONE
    ),
    InternalChildren: [
      "ac_profile",
      "bat_profile", 
      "threshold",
      "platform_profile_model",
      "row_lap_mode",
      "lap_mode",
      "disable_animations_on_battery",
    ],
  },
  class General extends Adw.PreferencesPage {
    /**
     * Initialize the General preferences page
     * 
     * @param {Gio.Settings} settings - Extension settings object
     * @param {Promise} availableProfilesPromise - Promise resolving to available power profiles
     * @param {Object} params - Additional parameters for the preferences page
     */
    _init(settings, availableProfilesPromise, params = {}) {
      super._init({
        ...params,
        name: "general",
        title: _("General"),
        icon_name: "power-profile-performance-symbolic",
      });

      // Setup UI bindings once profiles are loaded
      availableProfilesPromise
        .then((availableProfiles) => {
          this._setupProfileBindings(settings, availableProfiles);
          this._setupBooleanBindings(settings);
          this._setupConditionalVisibility(settings);
        })
        .catch((error) => {
          console.error("Failed to load power profiles:", error.message);
        });
    }

    /**
     * Configure power profile combo boxes with available profiles
     * 
     * @param {Gio.Settings} settings - Extension settings
     * @param {Array<Array<string>>} availableProfiles - Available profiles as [key, name] pairs
     * @private
     */
    _setupProfileBindings(settings, availableProfiles) {
      const profileKeys = availableProfiles.map(([key, name]) => key);

      // Populate the profile model for UI display
      availableProfiles.forEach(([key, name]) => {
        this._platform_profile_model.append(name);
      });

      // Bind AC and battery profile selections
      bindAdwComboRow(this._ac_profile, settings, "ac", profileKeys);
      bindAdwComboRow(this._bat_profile, settings, "bat", profileKeys);
    }

    /**
     * Setup direct GSettings bindings for boolean and numeric controls
     * 
     * @param {Gio.Settings} settings - Extension settings
     * @private
     */
    _setupBooleanBindings(settings) {
      // Battery threshold slider (percentage)
      settings.bind(
        "threshold",
        this._threshold,
        "value",
        Gio.SettingsBindFlags.DEFAULT
      );

      // Lap mode toggle (for laptops on unstable surfaces)
      settings.bind(
        "lapmode",
        this._lap_mode,
        "active",
        Gio.SettingsBindFlags.DEFAULT
      );

      // Animation control toggle (battery optimization feature)
      settings.bind(
        "disable-animations-on-battery",
        this._disable_animations_on_battery,
        "active",
        Gio.SettingsBindFlags.DEFAULT
      );
    }

    /**
     * Setup conditional UI visibility based on settings
     * 
     * The lap mode option is only shown when AC profile is set to "performance"
     * since lap detection only applies to performance mode.
     * 
     * @param {Gio.Settings} settings - Extension settings
     * @private
     */
    _setupConditionalVisibility(settings) {
      const updateLapModeVisibility = () => {
        const acProfile = settings.get_string("ac");
        this._row_lap_mode.visible = acProfile === "performance";
      };

      settings.connect("changed::ac", updateLapModeVisibility);
      updateLapModeVisibility(); // Initialize visibility
    }
  }
);

/**
 * Performance Apps Preferences Page
 * 
 * Allows users to configure application-specific power profiles that override
 * the default profile when specific applications are running. Useful for
 * ensuring high performance for demanding applications like games or IDEs.
 */
export const PerformanceApps = GObject.registerClass(
  { GTypeName: "AutoPowerProfilePerformanceAppsPrefs" },
  class PerformanceApps extends Adw.PreferencesPage {
    /**
     * Initialize the Performance Apps preferences page
     * 
     * @param {Gio.Settings} settings - Extension settings object
     * @param {Promise} availableProfilesPromise - Promise resolving to available power profiles
     * @param {Object} params - Additional parameters for the preferences page
     */
    _init(settings, availableProfilesPromise, params = {}) {
      super._init({
        ...params,
        name: "performance-apps",
        title: _("Performance Apps"),
        icon_name: "application-x-executable-symbolic",
      });

      this._settings = settings;
      this._switchRows = {};
      this._settingsChangedId = null;

      this._createProfileModeGroup();
      this._setupApplicationList(availableProfilesPromise);
    }

    /**
     * Create the profile mode selection group
     * 
     * This section allows users to choose different profiles for battery
     * and AC power when performance apps are running.
     * 
     * @private
     */
    _createProfileModeGroup() {
      this._modesGroup = new Adw.PreferencesGroup({
        title: _("Application-Based Profiles"),
        description: _(
          "Activate profiles for running selected apps. Can be used to prioritize performance ad-hoc"
        ),
      });
      this.add(this._modesGroup);
    }

    /**
     * Setup the application selection interface
     * 
     * @param {Promise} availableProfilesPromise - Promise resolving to available profiles
     * @private
     */
    _setupApplicationList(availableProfilesPromise) {
      availableProfilesPromise.then((allProfiles) => {
        this._createProfileSelectors(allProfiles);
        this._createApplicationSwitches();
      }).catch((error) => {
        console.error("Failed to setup performance apps:", error.message);
      });
    }

    /**
     * Create profile selector combo boxes for battery and AC power
     * 
     * @param {Array<Array<string>>} allProfiles - All available power profiles
     * @private
     */
    _createProfileSelectors(allProfiles) {
      // Filter out power-saver profile for performance apps (doesn't make sense)
      const availableProfiles = allProfiles.filter(([key, _]) => key !== "power-saver");
      const profileKeys = availableProfiles.map(([key, _]) => key);
      const profileNames = availableProfiles.map(([_, name]) => name);

      // Setting keys for performance app profiles
      const PERF_APPS_BAT_KEY = "performance-apps-bat";
      const PERF_APPS_AC_KEY = "performance-apps-ac";

      // Default to first available profile (usually "performance")
      const defaultProfile = availableProfiles[0][0];

      // Battery profile selector
      const batteryCombo = new Adw.ComboRow({
        title: _("On Battery"),
        model: Gtk.StringList.new(profileNames),
        selected: this._getProfileIndex(PERF_APPS_BAT_KEY, profileKeys, defaultProfile),
      });
      bindAdwComboRow(batteryCombo, this._settings, PERF_APPS_BAT_KEY, profileKeys);
      this._modesGroup.add(batteryCombo);

      // AC power profile selector  
      const acCombo = new Adw.ComboRow({
        title: _("On AC"),
        model: Gtk.StringList.new(profileNames),
        selected: this._getProfileIndex(PERF_APPS_AC_KEY, profileKeys, defaultProfile),
      });
      bindAdwComboRow(acCombo, this._settings, PERF_APPS_AC_KEY, profileKeys);
      this._modesGroup.add(acCombo);
    }

    /**
     * Get the index of a profile in the available profiles list
     * 
     * @param {string} settingsKey - The settings key to read
     * @param {string[]} profileKeys - Available profile keys
     * @param {string} defaultProfile - Fallback profile if setting is empty
     * @returns {number} Index of the profile in the list
     * @private
     */
    _getProfileIndex(settingsKey, profileKeys, defaultProfile) {
      const currentProfile = this._settings.get_string(settingsKey) || defaultProfile;
      return Math.max(0, profileKeys.indexOf(currentProfile));
    }

    /**
     * Create application selection switches
     * 
     * Builds a list of all installed applications with toggle switches
     * to enable performance mode for each app.
     * 
     * @private
     */
    _createApplicationSwitches() {
      const appsGroup = new Adw.PreferencesGroup({});
      this.add(appsGroup);

      // Get all installed applications that should be shown to the user
      const apps = this._getFilteredApplications();
      
      // Sort applications alphabetically by display name
      apps.sort((a, b) => 
        a.get_display_name().localeCompare(b.get_display_name())
      );

      // Get currently selected performance apps
      const selectedApps = new Set(this._settings.get_strv("performance-apps"));

      // Create a switch row for each application
      apps.forEach((app) => {
        const switchRow = this._createApplicationSwitchRow(app, selectedApps);
        appsGroup.add(switchRow);
      });

      // Listen for external changes to performance-apps setting
      this._listenForSettingsChanges();
    }

    /**
     * Filter applications to show only relevant ones
     * 
     * @returns {Gio.AppInfo[]} Filtered list of applications
     * @private
     */
    _getFilteredApplications() {
      return Gio.AppInfo.get_all().filter((app) => {
        try {
          // Only show apps that should be visible and have a valid ID
          return app.should_show() && app.get_id();
        } catch (error) {
          // Skip apps that throw errors during property access
          return false;
        }
      });
    }

    /**
     * Create a switch row for an individual application
     * 
     * @param {Gio.AppInfo} app - Application info object
     * @param {Set<string>} selectedApps - Set of currently selected app IDs
     * @returns {Adw.SwitchRow} The created switch row widget
     * @private
     */
    _createApplicationSwitchRow(app, selectedApps) {
      const appId = app.get_id();
      const appName = app.get_display_name();
      const appIcon = app.get_icon();

      const switchRow = new Adw.SwitchRow({
        title: appName,
        active: selectedApps.has(appId),
      });

      // Add application icon if available
      if (appIcon) {
        const iconImage = new Gtk.Image({
          gicon: appIcon,
          pixel_size: 24,
          margin_end: 8,
        });
        switchRow.add_prefix(iconImage);
      }

      // Handle switch toggle events
      switchRow.connect("notify::active", (switchWidget) => {
        this._handleAppToggle(appId, switchWidget.active);
      });

      // Store reference for external updates
      this._switchRows[appId] = switchRow;
      
      return switchRow;
    }

    /**
     * Handle application toggle switch changes
     * 
     * @param {string} appId - Application ID that was toggled
     * @param {boolean} isActive - New active state of the switch
     * @private
     */
    _handleAppToggle(appId, isActive) {
      const currentApps = new Set(this._settings.get_strv("performance-apps"));
      
      if (isActive) {
        currentApps.add(appId);
      } else {
        currentApps.delete(appId);
      }
      
      this._settings.set_strv("performance-apps", Array.from(currentApps));
    }

    /**
     * Listen for external changes to the performance-apps setting
     * 
     * This ensures the UI stays synchronized if the setting is changed
     * from another source (e.g., gsettings command line).
     * 
     * @private
     */
    _listenForSettingsChanges() {
      this._settingsChangedId = this._settings.connect(
        "changed::performance-apps",
        () => {
          const updatedApps = new Set(this._settings.get_strv("performance-apps"));
          
          // Update all switch rows to match current settings
          Object.entries(this._switchRows).forEach(([appId, switchRow]) => {
            switchRow.active = updatedApps.has(appId);
          });
        }
      );
    }

    /**
     * Clean up resources when the page is destroyed
     */
    vfunc_dispose() {
      // Disconnect settings change listener
      if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
      }
      
      // Clear switch row references
      this._switchRows = {};
      
      super.vfunc_dispose();
    }
  }
);

/**
 * Auto Power Profile Extension Preferences
 * 
 * Main preferences class that manages the extension's configuration window.
 * Provides a tabbed interface with General settings and Performance Apps configuration.
 */
export default class AutoPowerProfilePreferences extends ExtensionPreferences {
  /**
   * Configure and populate the preferences window
   * 
   * This method is called by GNOME Shell when the user opens the extension preferences.
   * It sets up the window layout and adds the configuration pages.
   * 
   * @param {Adw.PreferencesWindow} window - The preferences window to configure
   */
  fillPreferencesWindow(window) {
    this._configureWindow(window);
    
    const settings = this.getSettings();
    const availableProfilesPromise = this._loadAvailableProfiles();

    // Add configuration pages to the window
    window.add(new General(settings, availableProfilesPromise));
    window.add(new PerformanceApps(settings, availableProfilesPromise));
  }

  /**
   * Configure window appearance and behavior
   * 
   * @param {Adw.PreferencesWindow} window - The preferences window
   * @private
   */
  _configureWindow(window) {
    // Set optimal window dimensions for the preference panels
    window.set_default_size(600, 720);   // Initial size: width x height
    window.set_size_request(550, 650);   // Minimum size to ensure usability
  }

  /**
   * Load available power profiles from the system
   * 
   * Connects to the power-profiles-daemon via D-Bus to discover which
   * power profiles are actually available on the current system.
   * 
   * @returns {Promise<Array<Array<string>>>} Promise resolving to profile [key, name] pairs
   * @private
   */
  _loadAvailableProfiles() {
    // Standard power profiles with translated names
    const STANDARD_PROFILES = [
      ["performance", _("Performance")],
      ["balanced", _("Balanced")],
      ["power-saver", _("Power Saver")],
    ];

    return new Promise((resolve, reject) => {
      // Connect to power-profiles-daemon to get actual available profiles
      createPowerProfilesProxy(loadInterfaceXML, (proxy, error) => {
        if (error) {
          console.error("Failed to connect to power-profiles-daemon:", error.message);
          reject(error);
          return;
        }

        try {
          // Extract profile keys from the D-Bus proxy
          const availableKeys = proxy?.Profiles?.map((profile) => 
            profile.Profile.unpack()
          ) || [];

          // Filter standard profiles to only include those actually available
          const availableProfiles = STANDARD_PROFILES.filter(([key, name]) => 
            availableKeys.includes(key)
          );

          if (availableProfiles.length > 0) {
            console.log(`Loaded ${availableProfiles.length} power profiles:`, 
              availableProfiles.map(([key, _]) => key).join(", ")
            );
            resolve(availableProfiles);
          } else {
            const errorMsg = "No power profiles available on this system";
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (parseError) {
          console.error("Failed to parse power profiles:", parseError.message);
          reject(parseError);
        }
      });
    });
  }
}
