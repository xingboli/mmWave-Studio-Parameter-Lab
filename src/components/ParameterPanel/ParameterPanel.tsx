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
        profileId={config.profile.profileId}
        onChange={(chirps, syncFrame) => onChange({
          ...config, chirps,
          frame: syncFrame ? {...config.frame, chirpStartIndex: Math.min(...chirps.map(c => c.chirpIndex)), chirpEndIndex: Math.max(...chirps.map(c => c.chirpIndex))} : config.frame,
          channels: {...config.channels, txEnabled: [0, 1, 2].map(i => chirps.some(c => c.txEnabled[i])) as [boolean, boolean, boolean]},
        })}
      />

      <FrameSection
        frame={config.frame}
        maxChirpIndex={Math.max(0, ...config.chirps.map(c => c.chirpIndex))}
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
