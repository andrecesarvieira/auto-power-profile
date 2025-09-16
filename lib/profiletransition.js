// Classe que gerencia a transição entre perfis de energia
export class ProfileTransition {
  effectiveProfile;
  requestedProfile;
  committedProfile;

  onBat;
  lowBat;
  perfApps;

  // Atualiza o estado da transição com os dados atuais
  report({ effectiveProfile, onBattery, lowBattery, perfApps }) {
    this.effectiveProfile = effectiveProfile;
    this.onBat = onBattery;
    this.lowBat = lowBattery;
    this.perfApps = perfApps;

    // Se o perfil solicitado foi efetivado, marca como commitado
    if (
      this.requestedProfile &&
      !this.committedProfile &&
      this.effectiveProfile === this.requestedProfile
    ) {
      this.committedProfile = this.requestedProfile;
    }

    // Se não há perfil efetivo, limpa estado
    if (!effectiveProfile) {
      this.effectiveProfile = null;
      this.requestedProfile = null;
      this.committedProfile = null;
    }
  }

  // Decide se é permitido trocar de perfil conforme condições
  request({ configuredProfile, onBattery, lowBattery, perfApps }) {
    // Só permite troca se houve mudança nas condições ou não há commit
    const allowed =
      this.lowBat !== lowBattery ||
      this.onBat !== onBattery ||
      this.perfApps !== perfApps ||
      !this.committedProfile;

    if (allowed) {
      this.requestedProfile = configuredProfile;
      this.committedProfile = null;
    }
    return allowed;
  }
}
