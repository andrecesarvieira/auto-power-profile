// Importação das dependências GNOME e módulos internos
import GLib from "gi://GLib";
import UPower from "gi://UPowerGlib";
import Shell from "gi://Shell";
import * as FileUtils from "resource:///org/gnome/shell/misc/fileUtils.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

// Importação dos módulos auxiliares
import { Notifier } from "./lib/notifier.js";
import { ProfileTransition } from "./lib/profiletransition.js";
import {
  createPowerProfilesProxy,
  createPowerManagerProxy,
} from "./lib/utils.js";

// Classe principal da extensão, responsável por gerenciar perfis de energia
export default class AutoPowerProfile extends Extension {
  // Propriedades internas para controle de estado e objetos
  _settings;
  _settingsCache = {};
  _transition;
  _perfDebounceTimerId;
  _powerManagerProxy;
  _powerManagerWatcher;
  _powerProfilesProxy;
  _powerProfileWatcher;
  _winCreatedWatcher;
  _notifier;
  _tracker;

  // Construtor: inicializa o mapa de janelas monitoradas
  constructor(metadata) {
    super(metadata);
    this._trackedWindows = new Map();
  }

  // Método chamado ao ativar a extensão
  enable() {
    // Inicializa o objeto de transição de perfil
    this._transition = new ProfileTransition();
    // Obtém o rastreador de janelas do GNOME
    this._tracker = Shell.WindowTracker.get_default();

    // Carrega as configurações do usuário
    this._settings = this.getSettings(
      "org.gnome.shell.extensions.auto-power-profile"
    );
    // Observa alterações nas configurações
    this._settingsWatcher = this._settings.connect(
      "changed",
      this._onSettingsChange
    );

    // Observa criação de novas janelas para ativar perfil de desempenho
    this._winCreatedWatcher = global.display.connect_after(
      "window-created",
      (display, win) => {
        if (this._settingsCache.performanceApps?.length) {
          GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this._onWindowCreated(win);
            return GLib.SOURCE_REMOVE;
          });
        }
      }
    );

    // Cria proxy para monitorar status da bateria
    this._powerManagerProxy = createPowerManagerProxy(
      (x) => FileUtils.loadInterfaceXML(x),
      (proxy, error) => {
        if (error) {
          console.error(error);
          this._notifier.notify(_("Error connecting UPower DBus"));
          return;
        }
        // Observa mudanças nas propriedades do dispositivo de energia
        this._powerManagerWatcher = this._powerManagerProxy.connect(
          "g-properties-changed",
          this._checkProfile
        );
        this._onSettingsChange();
      }
    );

    // Cria proxy para monitorar perfis de energia disponíveis
    this._powerProfilesProxy = createPowerProfilesProxy(
      (x) => FileUtils.loadInterfaceXML(x),
      (proxy, error) => {
        if (error) {
          console.error(error);
          this._notifier.notify(
            _("Error connecting power-profiles-daemon DBus")
          );
          return;
        }
        // Observa mudanças nos perfis de energia
        this._powerProfileWatcher = this._powerProfilesProxy.connect(
          "g-properties-changed",
          this._onProfileChange
        );
        this._validateDrivers();
      }
    );

    // Inicializa o sistema de notificações
    this._notifier = new Notifier(this);
  }

  // Método chamado ao desativar a extensão
  disable() {
    // Remove todos os observadores e desconecta proxies
    if (this._powerManagerWatcher) {
      this._powerManagerProxy?.disconnect(this._powerManagerWatcher);
      this._powerManagerWatcher = null;
    }
    if (this._powerProfileWatcher) {
      this._powerProfilesProxy?.disconnect(this._powerProfileWatcher);
      this._powerProfileWatcher = null;
    }
    if (this._winCreatedWatcher) {
      global.display.disconnect(this._winCreatedWatcher);
      this._winCreatedWatcher = null;
    }
    if (this._notifier) {
      this._notifier.destroy();
      this._notifier = null;
    }
    this._settings?.disconnect(this._settingsWatcher);

    // Retorna para perfil balanceado ao desativar
    this._switchProfile("balanced");

    // Remove timers de debounce
    if (this._perfDebounceTimerId) {
      GLib.Source.remove(this._perfDebounceTimerId);
      this._perfDebounceTimerId = null;
    }

    // Limpa objetos e estado
    this._transition?.report({});
    this._transition = null;
    this._settings = null;
    this._settingsCache = {};
    this._powerManagerProxy = null;
    this._powerProfilesProxy = null;
    this._tracker = null;

    // Desconecta todas as janelas monitoradas
    for (const [win, cid] of this._trackedWindows.entries()) {
      win.disconnect(cid);
    }
    this._trackedWindows = new Map();
  }

  // Função chamada ao criar uma nova janela
  // Monitora se o aplicativo é de desempenho e ajusta perfil
  _onWindowCreated = (win) => {
    const app = this._tracker.get_window_app(win);
    const appId = app?.get_id();
    const isPerfApp = this._settingsCache.performanceApps.includes(appId);

    // Se for app de desempenho, conecta evento de fechamento
    if (isPerfApp && !this._trackedWindows.has(win)) {
      const cid = win.connect("unmanaged", (win) => {
        this._trackedWindows.delete(win);
        this._checkProfile();
      });
      this._trackedWindows.set(win, cid);
      this._checkProfile();
    } else if (!isPerfApp && this._trackedWindows.has(win)) {
      // Remove monitoramento se não for mais app de desempenho
      const cid = this._trackedWindows.get(win);
      win.disconnect(cid);
      this._trackedWindows.delete(win);
    }
  };

  // Função chamada ao mudar o perfil de energia
  _onProfileChange = (p, properties) => {
    if (!this._powerProfilesProxy) {
      return;
    }
    // Obtém informações detalhadas do perfil
    const payload = properties?.deep_unpack();
    const powerConditions = this._getPowerConditions();

    // Atualiza transição se perfil ativo mudou
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

    // Se estiver conectado à energia e houver degradação de desempenho
    if (powerConditions.onAC && payload?.PerformanceDegraded) {
      try {
        const reason = payload?.PerformanceDegraded?.unpack();

        // Se for modo "colo" (lap-detected) e estiver ativado, faz debounce
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
          // Loga outros motivos de degradação
          console.log(
            `ActiveProfile: ${this._powerProfilesProxy.ActiveProfile}, PerformanceDegraded: ${reason}`
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Função chamada ao alterar configurações do usuário
  _onSettingsChange = () => {
    // Atualiza cache das configurações
    this._settingsCache = {
      ACDefault: this._settings.get_string("ac"),
      batteryDefault: this._settings.get_string("bat"),
      batteryThreshold: this._settings.get_int("threshold"),
      lapmode: this._settings.get_boolean("lapmode"),
      performanceApps: this._settings.get_strv("performance-apps"),
      perfAppsAcMode: this._settings.get_string("performance-apps-ac"),
      perfAppsBatMode: this._settings.get_string("performance-apps-bat"),
    };

    // Atualiza transição e verifica apps/perfil
    this._transition.report({});
    this._checkPerformanceApps();
    this._checkProfile();
  };

  // Verifica se há aplicativos de desempenho ativos e atualiza monitoramento
  _checkPerformanceApps = () => {
    if (
      this._settingsCache.performanceApps?.length ||
      this._trackedWindows.size
    ) {
      global
        .get_window_actors()
        .forEach((actor) => this._onWindowCreated(actor.meta_window));
    }
  };

  // Retorna as condições atuais de energia e perfil configurado
  _getPowerConditions = () => {
    let configuredProfile = "balanced";

    // Verifica se há bateria
    const hasBattery = !(
      this._powerManagerProxy?.State === UPower.DeviceState.UNKNOWN ||
      this._powerManagerProxy?.Percentage === undefined
    );

    // Verifica se está usando bateria
    const onBattery =
      this._powerManagerProxy?.State === UPower.DeviceState.PENDING_DISCHARGE ||
      this._powerManagerProxy?.State === UPower.DeviceState.DISCHARGING;

    // Verifica se está com bateria baixa
    const lowBattery =
      this._settingsCache?.batteryThreshold >=
      this._powerManagerProxy?.Percentage;

    // Define perfil conforme estado de energia
    if (onBattery === false) {
      configuredProfile = this._settingsCache?.ACDefault;
    } else if (onBattery === true && lowBattery) {
      configuredProfile = "power-saver";
    } else if (onBattery === true && !lowBattery) {
      configuredProfile = this._settingsCache?.batteryDefault;
    }

    // Se há apps de desempenho, ajusta perfil conforme modo
    if (this._trackedWindows.size && onBattery === true) {
      configuredProfile = this._settingsCache.perfAppsBatMode;
    } else if (this._trackedWindows.size && onBattery === false) {
      configuredProfile = this._settingsCache.perfAppsAcMode;
    }

    return {
      hasBattery,
      onBattery,
      onAC: onBattery === false,
      lowBattery: onBattery === true && lowBattery,
      perfApps: this._trackedWindows.size > 0,
      configuredProfile,
    };
  };

  // Troca o perfil de energia ativo, se permitido
  _switchProfile = (profile) => {
    if (profile === this._powerProfilesProxy?.ActiveProfile) {
      return;
    }
    // Verifica se perfil está disponível
    const canSwitch = this._powerProfilesProxy?.Profiles?.some(
      (p) => p.Profile.unpack() === profile
    );

    if (!canSwitch) {
      console.error(
        `switchProfile: Profile ${profile} is not in list of available profiles`
      );
      return;
    }
    // Ativa o novo perfil
    this._powerProfilesProxy.ActiveProfile = profile;
  };

  // Verifica se deve trocar o perfil de energia
  _checkProfile = () => {
    const powerConditions = this._getPowerConditions();
    const allowed = this._transition.request(powerConditions);

    if (allowed) {
      this._switchProfile(powerConditions.configuredProfile);
    }
  };

  // Valida se drivers de perfil de energia estão disponíveis
  _validateDrivers() {
    const active = this._powerProfilesProxy.ActiveProfile;
    const profile = this._powerProfilesProxy?.Profiles?.find(
      (x) => x.Profile?.unpack() === active
    );

    const driver = profile?.Driver?.get_string()?.[0];
    const platformDriver = profile?.PlatformDriver?.get_string()?.[0];
    const cpuDriver = profile?.CpuDriver?.get_string()?.[0];
    const drivers = [driver, platformDriver, cpuDriver];

    // Notifica se não há driver ou se é placeholder
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
}
