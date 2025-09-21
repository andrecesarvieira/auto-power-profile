/**
 * Auto Power Profile - GNOME Shell Extension
 * 
 * Automatically switches power profiles based on AC/battery status and running applications.
 * Features include:
 * - Automatic profile switching between AC and battery power
 * - Application-specific power profiles for performance-critical apps
 * - Battery threshold management for power-saving mode
 * - Lap mode detection for performance throttling
 * - Animation control for battery optimization
 * 
 * @file extension.js
 * @author Andre Vieira <andrecesarvieira@hotmail.com>
 */

// GNOME platform imports
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import UPower from "gi://UPowerGlib";
import Shell from "gi://Shell";

// GNOME Shell framework imports
import * as FileUtils from "resource:///org/gnome/shell/misc/fileUtils.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

// Local extension modules
import { Notifier } from "./lib/notifier.js";
import { ProfileTransition } from "./lib/profiletransition.js";
import {
  createPowerProfilesProxy,
  createPowerManagerProxy,
} from "./lib/utils.js";

/**
 * Auto Power Profile Extension Class
 * 
 * Main extension class that handles power profile switching based on:
 * - AC/battery power state changes
 * - Battery level thresholds
 * - Running performance applications
 * - GNOME animation control for battery optimization
 */
export default class AutoPowerProfile extends Extension {
  // Settings and configuration
  _settings;              // Extension GSettings object
  _settingsCache = {};    // Cached settings values for performance
  _settingsWatcher;       // Settings change listener ID

  // Profile management
  _transition;            // ProfileTransition helper for smooth transitions
  _perfDebounceTimerId;   // Timer for debouncing performance mode changes

  // D-Bus proxy connections
  _powerManagerProxy;     // UPower daemon proxy (battery/AC status)
  _powerManagerWatcher;   // Power manager property change listener
  _powerProfilesProxy;    // power-profiles-daemon proxy (profile switching)
  _powerProfileWatcher;   // Power profiles property change listener

  // Window and application tracking
  _winCreatedWatcher;     // Global window creation listener
  _tracker;               // Shell window tracker for app identification
  _trackedWindows;        // Map of performance app windows to cleanup IDs

  // UI and notifications
  _notifier;              // Notification helper for user feedback

  // Animation control (battery optimization feature)
  _animationsEnabled;     // Original animation setting backup
  _desktopSettings;       // GNOME desktop interface settings

  /**
   * Initialize the extension instance
   * 
   * @param {Object} metadata - Extension metadata from metadata.json
   */
  constructor(metadata) {
    super(metadata);
    
    // Initialize instance variables
    this._trackedWindows = new Map();
    this._animationsEnabled = null;
    this._desktopSettings = null;
    this._settingsWatcher = null;
  }

  /**
   * Enable the extension and initialize all components
   * 
   * This method is called by GNOME Shell when the extension is enabled.
   * It sets up all the necessary connections, proxies, and listeners.
   */
  enable() {
    console.log("Auto Power Profile: Enabling extension");

    // Initialize core components
    this._initializeCoreComponents();
    this._initializeSettings();
    this._setupWindowTracking();
    this._connectPowerManagement();
    this._initializeNotifications();

    console.log("Auto Power Profile: Extension enabled successfully");
  }

  /**
   * Initialize core extension components
   * @private
   */
  _initializeCoreComponents() {
    this._transition = new ProfileTransition();
    this._tracker = Shell.WindowTracker.get_default();
  }

  /**
   * Initialize settings and animation control
   * @private
   */
  _initializeSettings() {
    // Load extension settings
    this._settings = this.getSettings("org.gnome.shell.extensions.auto-power-profile");
    
    // Initialize desktop settings for animation control feature
    this._desktopSettings = new Gio.Settings({
      schema: "org.gnome.desktop.interface",
    });

    // Listen for setting changes
    this._settingsWatcher = this._settings.connect("changed", this._onSettingsChange.bind(this));
  }

  /**
   * Setup window creation tracking for performance applications
   * @private
   */
  _setupWindowTracking() {
    this._winCreatedWatcher = global.display.connect_after(
      "window-created",
      (display, window) => {
        // Only process if we have performance apps configured
        if (this._settingsCache.performanceApps?.length) {
          // Use idle callback to avoid blocking the main thread
          GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this._onWindowCreated(window);
            return GLib.SOURCE_REMOVE;
          });
        }
      }
    );
  }

  /**
   * Connect to power management D-Bus services
   * @private
   */
  _connectPowerManagement() {
    this._connectPowerManager();
    this._connectPowerProfilesDaemon();
  }

  /**
   * Connect to UPower daemon for battery/AC status monitoring
   * @private
   */
  _connectPowerManager() {
    this._powerManagerProxy = createPowerManagerProxy(
      (interfaceName) => FileUtils.loadInterfaceXML(interfaceName),
      (proxy, error) => {
        if (error) {
          console.error("Failed to connect to UPower:", error.message);
          this._notifier?.notify(_("Error connecting UPower DBus"));
          return;
        }

        console.log("Auto Power Profile: Connected to UPower daemon");
        
        // Listen for power state changes (battery/AC)
        this._powerManagerWatcher = this._powerManagerProxy.connect(
          "g-properties-changed",
          this._checkProfile.bind(this)
        );

        // Initial settings load and profile check
        this._onSettingsChange();
      }
    );
  }

  /**
   * Connect to power-profiles-daemon for profile switching
   * @private
   */
  _connectPowerProfilesDaemon() {
    this._powerProfilesProxy = createPowerProfilesProxy(
      (interfaceName) => FileUtils.loadInterfaceXML(interfaceName),
      (proxy, error) => {
        if (error) {
          console.error("Failed to connect to power-profiles-daemon:", error.message);
          this._notifier?.notify(_("Error connecting power-profiles-daemon DBus"));
          return;
        }

        console.log("Auto Power Profile: Connected to power-profiles-daemon");

        // Listen for profile changes (including external changes)
        this._powerProfileWatcher = this._powerProfilesProxy.connect(
          "g-properties-changed", 
          this._onProfileChange.bind(this)
        );

        // Validate system drivers and notify about any issues
        this._validateDrivers();
      }
    );
  }

  /**
   * Initialize notification system
   * @private
   */
  _initializeNotifications() {
    this._notifier = new Notifier(this);
  }

  /**
   * Disable the extension and clean up all resources
   * 
   * This method is called by GNOME Shell when the extension is disabled.
   * It performs thorough cleanup to prevent memory leaks and restore system state.
   */
  disable() {
    console.log("Auto Power Profile: Disabling extension");

    this._disconnectEventListeners();
    this._cleanupNotifications();
    this._restoreSystemState();
    this._cleanupTimers();
    this._cleanupWindowTracking();
    this._resetInstanceVariables();

    console.log("Auto Power Profile: Extension disabled successfully");
  }

  /**
   * Disconnect all D-Bus and event listeners
   * @private
   */
  _disconnectEventListeners() {
    // Disconnect power manager events
    if (this._powerManagerWatcher) {
      this._powerManagerProxy?.disconnect(this._powerManagerWatcher);
      this._powerManagerWatcher = null;
    }

    // Disconnect power profiles daemon events
    if (this._powerProfileWatcher) {
      this._powerProfilesProxy?.disconnect(this._powerProfileWatcher);
      this._powerProfileWatcher = null;
    }

    // Disconnect window creation events
    if (this._winCreatedWatcher) {
      global.display.disconnect(this._winCreatedWatcher);
      this._winCreatedWatcher = null;
    }

    // Disconnect settings events
    if (this._settingsWatcher && this._settings) {
      this._settings.disconnect(this._settingsWatcher);
      this._settingsWatcher = null;
    }
  }

  /**
   * Clean up notification system
   * @private
   */
  _cleanupNotifications() {
    if (this._notifier) {
      this._notifier.destroy();
      this._notifier = null;
    }
  }

  /**
   * Restore system state to pre-extension values
   * @private
   */
  _restoreSystemState() {
    // Restore original animation setting if it was modified
    if (this._animationsEnabled !== null && this._desktopSettings) {
      console.log("Auto Power Profile: Restoring original animation setting");
      this._desktopSettings.set_boolean("enable-animations", this._animationsEnabled);
    }

    // Reset to balanced profile on disable to avoid leaving system in performance mode
    this._switchProfile("balanced");
  }

  /**
   * Clean up active timers
   * @private  
   */
  _cleanupTimers() {
    if (this._perfDebounceTimerId) {
      GLib.Source.remove(this._perfDebounceTimerId);
      this._perfDebounceTimerId = null;
    }
  }

  /**
   * Clean up window tracking and disconnect window event listeners
   * @private
   */
  _cleanupWindowTracking() {
    // Disconnect all tracked window event listeners
    for (const [window, connectionId] of this._trackedWindows.entries()) {
      try {
        window.disconnect(connectionId);
      } catch (error) {
        // Window might already be destroyed, ignore errors
        console.debug("Failed to disconnect window listener:", error.message);
      }
    }
    this._trackedWindows.clear();
  }

  /**
   * Reset all instance variables to clean state
   * @private
   */
  _resetInstanceVariables() {
    // Clear transition state
    this._transition?.report({});
    this._transition = null;

    // Clear settings
    this._settings = null;
    this._settingsCache = {};

    // Clear D-Bus proxies
    this._powerManagerProxy = null;
    this._powerProfilesProxy = null;

    // Clear GNOME Shell objects
    this._tracker = null;
    this._desktopSettings = null;

    // Reset animation tracking
    this._animationsEnabled = null;
  }

  /**
   * Handle new window creation events
   * 
   * When a new window is created, check if it belongs to a performance application
   * and track it for power profile management.
   * 
   * @param {Meta.Window} window - The newly created window
   * @private
   */
  _onWindowCreated(window) {
    const app = this._tracker.get_window_app(window);
    const appId = app?.get_id();
    
    if (!appId) {
      return; // Skip windows without valid app IDs
    }

    const isPerformanceApp = this._settingsCache.performanceApps?.includes(appId);

    if (isPerformanceApp && !this._trackedWindows.has(window)) {
      // Start tracking this performance app window
      this._trackPerformanceWindow(window, appId);
    } else if (!isPerformanceApp && this._trackedWindows.has(window)) {
      // Stop tracking if app is no longer marked as performance app
      this._untrackPerformanceWindow(window);
    }
  }

  /**
   * Start tracking a performance application window
   * 
   * @param {Meta.Window} window - Window to track
   * @param {string} appId - Application ID for logging
   * @private
   */
  _trackPerformanceWindow(window, appId) {
    console.log(`Auto Power Profile: Tracking performance app window: ${appId}`);

    // Listen for window destruction to clean up tracking
    const connectionId = window.connect("unmanaged", (destroyedWindow) => {
      console.log(`Auto Power Profile: Performance app window closed: ${appId}`);
      this._trackedWindows.delete(destroyedWindow);
      this._checkProfile(); // Re-evaluate profile when performance app closes
    });

    this._trackedWindows.set(window, connectionId);
    this._checkProfile(); // Re-evaluate profile when performance app opens
  }

  /**
   * Stop tracking a performance application window
   * 
   * @param {Meta.Window} window - Window to stop tracking
   * @private
   */
  _untrackPerformanceWindow(window) {
    const connectionId = this._trackedWindows.get(window);
    if (connectionId) {
      try {
        window.disconnect(connectionId);
      } catch (error) {
        console.debug("Failed to disconnect window listener:", error.message);
      }
    }
    this._trackedWindows.delete(window);
  }

  /**
   * Handle power profile changes from external sources
   * 
   * This method is called when the power profile is changed externally (e.g., by the user
   * through GNOME Settings, command line, or other applications). It updates the extension's
   * state and handles special conditions like lap detection.
   * 
   * @param {GDBusProxy} proxy - The power profiles daemon proxy
   * @param {GVariant} properties - Changed properties
   * @private
   */
  _onProfileChange(proxy, properties) {
    if (!this._powerProfilesProxy) {
      return;
    }
    const payload = properties?.deep_unpack();
    const powerConditions = this._getPowerConditions();

    if (payload?.ActiveProfile) {
      if (this._perfDebounceTimerId) {
        GLib.Source.remove(this._perfDebounceTimerId);
        this._perfDebounceTimerId = null;
      }
      if (!payload?.PerformanceDegraded) {
        this._transition.report({
          effectiveProfile: this._powerProfilesProxy.ActiveProfile,
          ...powerConditions,
        });
      }
    }

    if (powerConditions.onAC && payload?.PerformanceDegraded) {
      try {
        const reason = payload?.PerformanceDegraded?.unpack();

        if (reason === "lap-detected" && this._settingsCache.lapmode) {
          this._perfDebounceTimerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            5,
            () => {
              this._transition.report({});
              this._checkProfile();
              this._perfDebounceTimerId = null;
              return GLib.SOURCE_REMOVE;
            }
          );
        } else if (reason) {
          console.log(
            `ActiveProfile: ${this._powerProfilesProxy.ActiveProfile}, PerformanceDegraded: ${reason}`
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  /**
   * Handle changes to extension settings
   * 
   * When any setting is modified, update the cached values and re-evaluate
   * the current power profile and animation state.
   * 
   * @private
   */
  _onSettingsChange() {
    console.log("Auto Power Profile: Settings changed, updating configuration");

    this._updateSettingsCache();
    this._refreshApplicationTracking();
    this._reevaluateSystemState();
  }

  /**
   * Update the settings cache with current values
   * 
   * Caching settings improves performance by avoiding repeated GSettings calls
   * during frequent power state evaluations.
   * 
   * @private
   */
  _updateSettingsCache() {
    this._settingsCache = {
      // Power profile defaults
      ACDefault: this._settings.get_string("ac"),
      batteryDefault: this._settings.get_string("bat"),
      batteryThreshold: this._settings.get_int("threshold"),
      
      // Advanced features
      lapmode: this._settings.get_boolean("lapmode"),
      
      // Performance application settings  
      performanceApps: this._settings.get_strv("performance-apps"),
      perfAppsAcMode: this._settings.get_string("performance-apps-ac"),
      perfAppsBatMode: this._settings.get_string("performance-apps-bat"),
      
      // Battery optimization features
      disableAnimationsOnBattery: this._settings.get_boolean("disable-animations-on-battery"),
    };

    console.log("Auto Power Profile: Settings cache updated", {
      acProfile: this._settingsCache.ACDefault,
      batteryProfile: this._settingsCache.batteryDefault,
      performanceAppsCount: this._settingsCache.performanceApps?.length || 0,
      animationsControl: this._settingsCache.disableAnimationsOnBattery,
    });
  }

  /**
   * Refresh performance application tracking based on new settings
   * @private
   */
  _refreshApplicationTracking() {
    this._checkPerformanceApps();
  }

  /**
   * Re-evaluate system state after settings change
   * @private
   */
  _reevaluateSystemState() {
    // Clear transition state to allow immediate profile changes
    this._transition.report({});
    
    // Check if profile needs to change based on new settings
    this._checkProfile();
    
    // Update animation state based on current power and new settings
    this._manageAnimationsBasedOnPower();
  }

  /**
   * Re-evaluate all existing windows for performance app tracking
   * 
   * This method is called when the performance apps list changes in settings.
   * It checks all currently open windows to start/stop tracking based on the new configuration.
   * 
   * @private
   */
  _checkPerformanceApps() {
    const hasPerformanceApps = this._settingsCache.performanceApps?.length > 0;
    const hasTrackedWindows = this._trackedWindows.size > 0;

    // Only scan windows if we have performance apps configured or currently tracked windows
    if (hasPerformanceApps || hasTrackedWindows) {
      console.log(`Auto Power Profile: Re-evaluating ${global.get_window_actors().length} windows for performance apps`);
      
      // Check all currently open windows
      global.get_window_actors().forEach((windowActor) => {
        const window = windowActor.meta_window;
        if (window) {
          this._onWindowCreated(window);
        }
      });

      console.log(`Auto Power Profile: Now tracking ${this._trackedWindows.size} performance app windows`);
    }
  }

  /**
   * Analyze current power conditions and determine the appropriate power profile
   * 
   * This method evaluates all factors that influence power profile selection:
   * - AC/battery power state
   * - Battery percentage and threshold settings  
   * - Running performance applications
   * 
   * @returns {Object} Power conditions and recommended profile
   * @private
   */
  _getPowerConditions() {
    const powerState = this._analyzePowerState();
    const batteryConditions = this._analyzeBatteryConditions(powerState);
    const appConditions = this._analyzeApplicationConditions();
    const recommendedProfile = this._determineProfile(powerState, batteryConditions, appConditions);

    return {
      // Power state information
      hasBattery: powerState.hasBattery,
      onBattery: powerState.onBattery,
      acPowered: powerState.acPowered,
      onAC: !powerState.onBattery,
      
      // Battery conditions
      lowBattery: batteryConditions.isLow,
      
      // Application conditions
      perfApps: appConditions.hasPerformanceApps,
      
      // Recommended profile based on all conditions
      configuredProfile: recommendedProfile,
    };
  }

  /**
   * Analyze the current power state (AC/battery/charging)
   * 
   * @returns {Object} Power state information
   * @private
   */
  _analyzePowerState() {
    const deviceState = this._powerManagerProxy?.State;
    const batteryPercentage = this._powerManagerProxy?.Percentage;

    // Determine if system has a battery
    const hasBattery = !(
      deviceState === UPower.DeviceState.UNKNOWN ||
      batteryPercentage === undefined
    );

    // Determine if running on battery power
    const onBattery = 
      deviceState === UPower.DeviceState.PENDING_DISCHARGE ||
      deviceState === UPower.DeviceState.DISCHARGING;

    // Determine if AC powered (charging, fully charged, or not on battery)
    const acPowered =
      deviceState === UPower.DeviceState.CHARGING ||
      deviceState === UPower.DeviceState.FULLY_CHARGED ||
      deviceState === UPower.DeviceState.PENDING_CHARGE ||
      !onBattery;

    return { hasBattery, onBattery, acPowered };
  }

  /**
   * Analyze battery level conditions
   * 
   * @param {Object} powerState - Current power state information
   * @returns {Object} Battery condition information
   * @private
   */
  _analyzeBatteryConditions(powerState) {
    const batteryPercentage = this._powerManagerProxy?.Percentage || 100;
    const threshold = this._settingsCache?.batteryThreshold || 20;
    
    const isLow = powerState.onBattery && (batteryPercentage <= threshold);

    return { isLow, percentage: batteryPercentage, threshold };
  }

  /**
   * Analyze running application conditions
   * 
   * @returns {Object} Application condition information  
   * @private
   */
  _analyzeApplicationConditions() {
    const hasPerformanceApps = this._trackedWindows.size > 0;
    const performanceAppCount = this._trackedWindows.size;

    return { hasPerformanceApps, performanceAppCount };
  }

  /**
   * Determine the appropriate power profile based on all conditions
   * 
   * Priority order:
   * 1. Performance apps override (if running)
   * 2. Low battery threshold (forces power-saver)
   * 3. Power source (AC vs battery defaults)
   * 4. Fallback to balanced
   * 
   * @param {Object} powerState - Power state information
   * @param {Object} batteryConditions - Battery condition information
   * @param {Object} appConditions - Application condition information
   * @returns {string} Recommended power profile name
   * @private
   */
  _determineProfile(powerState, batteryConditions, appConditions) {
    // Priority 1: Performance apps take precedence
    if (appConditions.hasPerformanceApps) {
      return powerState.onBattery 
        ? this._settingsCache.perfAppsBatMode || "balanced"
        : this._settingsCache.perfAppsAcMode || "performance";
    }

    // Priority 2: Low battery forces power-saver mode
    if (batteryConditions.isLow) {
      return "power-saver";
    }

    // Priority 3: Use configured defaults based on power source
    if (powerState.onBattery) {
      return this._settingsCache?.batteryDefault || "balanced";
    } else {
      return this._settingsCache?.ACDefault || "balanced"; 
    }
  }

  /**
   * Switch the system power profile
   * 
   * @param {string} targetProfile - The power profile to switch to ("performance", "balanced", "power-saver")
   * @private
   */
  _switchProfile(targetProfile) {
    // Skip if already using the target profile
    if (targetProfile === this._powerProfilesProxy?.ActiveProfile) {
      return;
    }

    // Validate that the profile is available on this system
    const availableProfiles = this._powerProfilesProxy?.Profiles?.map(
      (profileInfo) => profileInfo.Profile.unpack()
    ) || [];

    if (!availableProfiles.includes(targetProfile)) {
      console.error(`Auto Power Profile: Profile '${targetProfile}' is not available. ` +
        `Available profiles: ${availableProfiles.join(", ")}`);
      return;
    }

    console.log(`Auto Power Profile: Switching from '${this._powerProfilesProxy.ActiveProfile}' to '${targetProfile}'`);
    
    try {
      this._powerProfilesProxy.ActiveProfile = targetProfile;
    } catch (error) {
      console.error(`Auto Power Profile: Failed to switch profile: ${error.message}`);
    }
  }

  /**
   * Check current conditions and update power profile if needed
   * 
   * This is the main entry point for power profile evaluation, called when:
   * - Power state changes (AC/battery)
   * - Settings are modified
   * - Performance apps are opened/closed
   * 
   * @private
   */
  _checkProfile() {
    const powerConditions = this._getPowerConditions();
    
    console.log("Auto Power Profile: Evaluating power conditions", {
      profile: powerConditions.configuredProfile,
      onBattery: powerConditions.onBattery,
      perfApps: powerConditions.perfApps,
      lowBattery: powerConditions.lowBattery,
    });

    // Use transition manager to prevent rapid profile switching
    const transitionAllowed = this._transition.request(powerConditions);

    if (transitionAllowed) {
      this._switchProfile(powerConditions.configuredProfile);
    } else {
      console.log("Auto Power Profile: Profile change blocked by transition manager");
    }

    // Update animation state independently of profile changes
    this._manageAnimationsBasedOnPower();
  }

  /**
   * Validate that proper system drivers are available for power profile switching
   * 
   * This method checks if the system has appropriate platform drivers loaded.
   * Without proper drivers, power profiles may not have any real effect on the system.
   * 
   * @private
   */
  _validateDrivers() {
    const active = this._powerProfilesProxy.ActiveProfile;
    const profile = this._powerProfilesProxy?.Profiles?.find(
      (x) => x.Profile?.unpack() === active
    );

    const driver = profile?.Driver?.get_string()?.[0];
    const platformDriver = profile?.PlatformDriver?.get_string()?.[0];
    const cpuDriver = profile?.CpuDriver?.get_string()?.[0];
    const drivers = [driver, platformDriver, cpuDriver];

    if (!active) {
      this._notifier.notify(
        _("Package power-profiles-daemon is not installed")
      );
    } else if (!drivers.some((x) => x && x !== "placeholder")) {
      this._notifier.notify(
        _(
          "No system-specific platform driver is available. Consider upgrading power-profiles-daemon and linux kernel"
        ),
        "https://upower.pages.freedesktop.org/power-profiles-daemon/power-profiles-daemon-Platform-Profile-Drivers.html"
      );
    }
  }

  /**
   * Manage GNOME animations based on power state for battery optimization
   * 
   * This feature automatically disables GNOME Shell animations when running on battery
   * to reduce CPU/GPU usage and extend battery life. The original animation setting
   * is preserved and restored when connected to AC power.
   * 
   * @private
   */
  _manageAnimationsBasedOnPower() {
    const powerConditions = this._getPowerConditions();
    const isOnBattery = powerConditions.onBattery;
    const featureEnabled = this._settingsCache.disableAnimationsOnBattery;

    // Early exit if feature is disabled
    if (!featureEnabled) {
      this._restoreAnimationsIfDisabled();
      return;
    }

    if (isOnBattery) {
      this._disableAnimationsForBattery();
    } else {
      this._restoreAnimationsForAC();
    }
  }

  /**
   * Restore animations if they were previously disabled by this extension
   * @private
   */
  _restoreAnimationsIfDisabled() {
    if (this._animationsEnabled !== null) {
      console.log("Auto Power Profile: Animation control disabled, restoring original setting");
      this._desktopSettings.set_boolean("enable-animations", this._animationsEnabled);
      this._animationsEnabled = null;
    }
  }

  /**
   * Disable animations to save battery power
   * @private
   */
  _disableAnimationsForBattery() {
    // Backup original setting if not already done
    if (this._animationsEnabled === null) {
      this._animationsEnabled = this._desktopSettings.get_boolean("enable-animations");
      console.log(`Auto Power Profile: Backing up original animation setting: ${this._animationsEnabled}`);
    }

    // Disable animations for battery saving
    const currentAnimationsState = this._desktopSettings.get_boolean("enable-animations");
    if (currentAnimationsState) {
      console.log("Auto Power Profile: Disabling animations for battery optimization");
      this._desktopSettings.set_boolean("enable-animations", false);
    }
  }

  /**
   * Restore original animations when on AC power
   * @private
   */
  _restoreAnimationsForAC() {
    if (this._animationsEnabled !== null) {
      console.log(`Auto Power Profile: Restoring original animation setting: ${this._animationsEnabled}`);
      this._desktopSettings.set_boolean("enable-animations", this._animationsEnabled);
      this._animationsEnabled = null; // Clear backup after restoration
    }
  }
}
