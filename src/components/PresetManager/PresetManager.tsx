import React from 'react';
import { PRESETS } from '../../presets/awr1843.ts';
import { PresetScenario } from '../../presets/types.ts';
import { Bookmark } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface PresetManagerProps {
  currentPresetId: string;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentPresetId,
  onSelectPreset,
}) => {
  const { t, language } = useLanguage();

  const getPresetDisplay = (preset: PresetScenario) => {
    if (language !== 'zh') {
      return {
        name: preset.name,
        tag: preset.tag,
        desc: preset.description,
        use: preset.recommendedUse,
      };
    }

    switch (preset.id) {
      case 'basic-range':
        return {
          name: t.presetRangeName,
          tag: t.presetRangeTag,
          desc: t.presetRangeDesc,
          use: '室内静态目标测距、液位测量、角反射器标定',
        };
      case 'basic-doppler':
        return {
          name: t.presetDopplerName,
          tag: t.presetDopplerTag,
          desc: t.presetDopplerDesc,
          use: '汽车行车测速、无人机航速跟踪、移动车辆检测',
        };
      case 'basic-aoa':
        return {
          name: t.presetAoaName,
          tag: t.presetAoaTag,
          desc: t.presetAoaDesc,
          use: '雷达点云成像、到达角估计 (AoA)、3D 目标空间定位',
        };
      case 'micro-motion':
        return {
          name: t.presetMicroName,
          tag: t.presetMicroTag,
          desc: t.presetMicroDesc,
          use: '生命体征 (呼吸心跳监测)、人体微多普勒步态、机械微震',
        };
      case 'custom-template':
      default:
        return {
          name: t.presetCustomName,
          tag: t.presetCustomTag,
          desc: t.presetCustomDesc,
          use: '科研实验自拟参数、原型算法验证、教学演示',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs mb-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-800">
            {t.presetTitle}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 italic">
          {t.presetSubtitle}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {PRESETS.map((preset) => {
          const isSelected = currentPresetId === preset.id;
          const display = getPresetDisplay(preset);

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    {display.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 block w-fit mb-1.5">
                  {display.tag}
                </span>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {display.desc}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-400 truncate">
                {display.use}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
