import React from 'react';
import { RadarConfig } from '../../radar/types.ts';
import { ProfileSection } from './ProfileSection.tsx';
import { ChirpSection } from './ChirpSection.tsx';
import { FrameSection } from './FrameSection.tsx';
import { ChannelSection } from './ChannelSection.tsx';

interface ParameterPanelProps {
  config: RadarConfig;
  onChange: (updated: RadarConfig) => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-3.5">
      <ProfileSection
        profile={config.profile}
        onChange={(profile) => onChange({ ...config, profile })}
      />

      <ChirpSection
        chirps={config.chirps}
        onChange={(chirps) => onChange({ ...config, chirps })}
      />

      <FrameSection
        frame={config.frame}
        maxChirpIndex={Math.max(0, config.chirps.length - 1)}
        onChange={(frame) => onChange({ ...config, frame })}
      />

      <ChannelSection
        channels={config.channels}
        adc={config.adc}
        onChannelsChange={(channels) => onChange({ ...config, channels })}
        onAdcChange={(adc) => onChange({ ...config, adc })}
      />
    </div>
  );
};
