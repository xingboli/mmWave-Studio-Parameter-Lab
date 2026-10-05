import React from 'react';
import { X, BookOpen, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {language === 'zh'
                  ? '关于 mmWave Studio Parameter Lab'
                  : 'About mmWave Studio Parameter Lab'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'zh'
                  ? 'FMCW 雷达物理模型、系统架构与 TI mmWave Studio 2.x 规范说明'
                  : 'FMCW Radar Physical Model, Architecture & mmWave Studio 2.x Specification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Section: Overview */}
          <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-lg text-slate-800">
            <h3 className="font-semibold text-blue-900 mb-1">
              {language === 'zh' ? '设计初衷与定位' : 'Purpose & Engineering Orientation'}
            </h3>
            <p>
              {language === 'zh'
                ? 'mmWave Studio Parameter Lab 是专门为使用 TI AWR1843BOOST 与 DCA1000 采集卡的雷达实验科研人员开发的一体化配置编译工具。不同于普通的单项公式计算器，它将物理性能推导、硬件时序边界校验、参数相互权衡因果分析与 mmWave Studio 2.x (ar1.*) Lua 脚本实时生成深度整合，防止因采样超限或占空比超载导致的实验失败。'
                : 'mmWave Studio Parameter Lab is a dedicated FMCW experiment configuration compiler tailored for researchers using TI AWR1843BOOST and DCA1000 EVM with mmWave Studio 2.x. It acts as an experiment compiler, linking physical performance directly to hardware timing constraints and generating Lua configuration templates.'}
            </p>
          </div>

          {/* Section: Hardware Profile */}
          <div className="border border-slate-200 p-3 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-600" />
              {language === 'zh' ? '支持的硬件与天线拓扑' : 'Supported Hardware & Antenna Geometry'}
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>
                <strong>{language === 'zh' ? '雷达前端芯片:' : 'Radar Sensor:'}</strong> TI AWR1843 / AWR1843BOOST (76 - 81 GHz，支持最大 4 GHz 线性扫频带宽)。
              </li>
              <li>
                <strong>{language === 'zh' ? '天线微带拓扑:' : 'Antenna Array:'}</strong> 3 发射 (TX) 与 4 接收 (RX) 微带天线阵列。
                <ul className="list-circle pl-4 mt-0.5 space-y-0.5 text-slate-500">
                  <li>
                    {language === 'zh'
                      ? 'TX1 与 TX3: 水平间距 2λ，与 4 路 RX (间距 λ/2) 合成 8 虚拟天线均匀线阵 (ULA)，用于高精方位角估计。'
                      : 'TX1 & TX3: Spaced 2λ horizontally, synthesizing an 8-element virtual ULA with λ/2 azimuth spacing.'}
                  </li>
                  <li>
                    {language === 'zh'
                      ? 'TX2: 相对 TX1/TX3 在俯仰方向抬升 0.5λ，用于俯仰角 (Elevation) 测量。'
                      : 'TX2: Elevated 0.5λ above TX1/TX3, providing elevation angle-of-arrival (AoA) estimation.'}
                  </li>
                </ul>
              </li>
              <li>
                <strong>{language === 'zh' ? '高速数据捕获:' : 'Raw Capture:'}</strong> TI DCA1000 EVM，通过 LVDS 高速串行总线转千兆以太网 UDP 数据流保存为原始 adc_data.bin。
              </li>
            </ul>
          </div>

          {/* Section: Formulas */}
          <div className="border border-slate-200 p-3 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-900">
              {language === 'zh' ? '核心物理公式推导体系' : 'Core FMCW Physical Formulas'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? 'ADC 采样时间:' : 'ADC Sampling Time:'}
                </span>
                <div>Tadc = Nadc / Fs</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '有效采样带宽:' : 'Effective Bandwidth:'}
                </span>
                <div>Badc = Slope × Tadc</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '距离分辨率:' : 'Range Resolution:'}
                </span>
                <div>ΔR = c / (2 × Badc)</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '推荐探测距离:' : 'Max Range (Recommended):'}
                </span>
                <div>Rmax = 0.9 × (Fs × c) / (2 × Slope)</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '单 Chirp 周期:' : 'Chirp Cycle Time:'}
                </span>
                <div>Tchirp = Idle Time + Ramp End Time</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '最大不模糊速度:' : 'Max Unambiguous Velocity:'}
                </span>
                <div>Vmax = λ / (4 × Ntx × Tchirp)</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '多普勒速度分辨率:' : 'Velocity Resolution:'}
                </span>
                <div>Δv = λ / (2 × Loops × Ntx × Tchirp)</div>
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {language === 'zh' ? '帧有效发射时间:' : 'Frame Active Time:'}
                </span>
                <div>Tactive = Loops × Nchirp × Tchirp</div>
              </div>
            </div>
          </div>

          {/* Section: Lua API Verification Status */}
          <div className="border border-slate-200 p-3 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-900">
              {language === 'zh' ? 'mmWave Studio 2.x Lua API 接口可信度验证' : 'mmWave Studio 2.x Lua API Verification'}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50/60 p-2 rounded border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {language === 'zh' ? '模式 A (雷达射频参数) —— 接口映射已核对，尚未硬件实测:' : 'Mode A (Radar Config) — API mapping checked; not hardware tested:'}
                  </span>
                  <div className="font-mono text-[10px] text-emerald-900 mt-0.5">
                    ar1.ChanNAdcConfig, ar1.ProfileConfig, ar1.ChirpConfig, ar1.FrameConfig
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-amber-800 bg-amber-50/60 p-2 rounded border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {language === 'zh' ? '模式 B (DCA1000 数据捕获) —— Beta 预测试:' : 'Mode B (DCA1000 Capture) — Beta:'}
                  </span>
                  <div className="text-[11px] text-amber-900 mt-0.5">
                    {language === 'zh'
                      ? 'DCA1000 以太网配置与触发指令符合 TI 官方标准示例，但依赖电脑本地以太网静态 IP (192.168.33.30) 配置与防火墙放行。'
                      : 'DCA1000 Ethernet arming calls are mapped to standard scripts, but require host network adapter firewall permissions.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {language === 'zh' ? '模式 C (整机自动化启动) —— 参考模板:' : 'Mode C (Full Automation) — Template Only:'}
                  </span>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'zh'
                      ? '包含串口连接与固件下发，串口号 (COM) 与固件绝对路径因个人电脑安装环境而异，切勿直接盲目执行。'
                      : 'Board bringup calls are environment-specific and require verification against your local directory.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-2.5 rounded bg-slate-100 text-[11px] text-slate-500 italic">
            {language === 'zh'
              ? '* 免责声明：本软件为开源独立的毫米波雷达科研辅助工具。计算出的指标均为理论工程估算值，实际实验效果请结合德州仪器官方文档（SWRA553、SPRUIS4C）与硬件实测确认为准。'
              : '* Disclaimer: This tool is intended for experiment design and configuration assistance. Calculated results are engineering estimates and should be verified against TI documentation and actual hardware.'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            {t.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
};
