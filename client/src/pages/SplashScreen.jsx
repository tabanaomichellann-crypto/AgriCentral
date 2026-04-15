import React from 'react';
import './SplashScreen.css';
import agriCentralLogo from '../assets/AgriCentral_Logo.png';

export default function SplashScreen() {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-orb splash-orb-left" aria-hidden="true" />
      <div className="splash-orb splash-orb-right" aria-hidden="true" />

      <div className="splash-content">
        <div className="logo-shell">
          <img
            src={agriCentralLogo}
            alt="AgriCentral logo"
            className="splash-logo"
          />
        </div>

        <h1 className="splash-title">AgriCentral</h1>
        <p className="splash-subtitle">Agriculture Monitoring System</p>

        <div className="splash-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}