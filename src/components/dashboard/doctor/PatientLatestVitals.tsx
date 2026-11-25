"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePatientHistory } from '@/hooks/use-edge-service';
import { Activity, Thermometer, Droplets, Watch, AlertCircle, Siren, RefreshCw } from 'lucide-react';
import type { EdgeHealthRecord } from '@/lib/edge-api';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientLatestVitalsProps {
  deviceId?: string;
  data?: EdgeHealthRecord;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PatientLatestVitals({ deviceId, data, onRefresh, isRefreshing }: PatientLatestVitalsProps) {
  const { history, isLoading: historyLoading, error: historyError, refresh: refreshHistory } = usePatientHistory(deviceId);
  const latest = data ?? history[0] ?? null;

  if (!deviceId && !data) return null;

  const handleRefresh = onRefresh || (deviceId ? refreshHistory : undefined);
  const isLoading = (!data && deviceId && historyLoading) || isRefreshing;
  const error = !data && deviceId ? historyError : null;

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    let date = new Date(dateString);
    if (isValid(date)) return date;
    const isoString = dateString.replace(' ', 'T');
    date = new Date(isoString);
    if (isValid(date)) return date;
    return null;
  };

  const timeAgo = latest ? parseDate(latest.timestamp) : null;
  const currentDeviceId = deviceId || latest?.device_id || 'Desconocido';

  return (
    <Card className={`relative border-none shadow-xl overflow-hidden ${latest?.is_critical ? 'bg-red-900 from-red-800 to-red-900 border-red-700' : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'}`}>
      {/* Background Decoration */}
      <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${latest?.is_critical ? 'bg-red-500/20' : 'bg-primary/20'}`}></div>
      
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                    {latest?.is_critical ? <Siren className="h-6 w-6 text-yellow-300 animate-pulse" /> : <Watch className="h-6 w-6 text-blue-400" />}
                </div>
                <div>
                    <CardTitle className="text-xl font-bold text-white">Signos Vitales en Tiempo Real</CardTitle>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        Dispositivo Conectado: <span className={`font-mono px-2 rounded ${latest?.is_critical ? 'text-yellow-300 bg-red-500/10' : 'text-blue-300 bg-blue-500/10'}`}>{currentDeviceId}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {latest && timeAgo && (
                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${latest?.is_critical ? 'bg-red-700 text-white' : 'bg-black/20 text-slate-300'}`}>
                        {latest?.is_critical && <div className="h-2 w-2 rounded-full bg-yellow-300 animate-pulse"></div>}
                        Actualizado: {format(timeAgo, "HH:mm:ss", { locale: es })}
                    </div>
                )}
                {handleRefresh && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRefresh} 
                        disabled={isLoading}
                        className="text-white hover:bg-white/20 hover:text-white rounded-full"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
                Cargando datos del dispositivo...
            </div>
        ) : error ? (
            <div className="flex items-center gap-2 text-red-400 py-4">
                <AlertCircle className="h-5 w-5" />
                <span>No se pudo conectar con el dispositivo IoT.</span>
            </div>
        ) : !latest ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
                <AlertCircle className="h-5 w-5" />
                <span>No hay datos recientes para este dispositivo.</span>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* BPM Card */}
                <div className={`rounded-2xl p-4 border backdrop-blur-sm hover:bg-white/10 transition-colors ${latest.is_critical ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 ${latest.is_critical ? 'text-red-100' : 'text-slate-300'}">
                            <Activity className={`h-5 w-5 ${latest.is_critical ? 'text-yellow-300' : 'text-red-500'}`} />
                            <span className="font-medium">Ritmo Cardíaco</span>
                        </div>
                        {latest.bpm > 100 && <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">ALTO</span>}
                        {latest.is_critical && <span className="text-[10px] font-bold bg-yellow-500 text-red-900 px-1.5 py-0.5 rounded animate-pulse">CRÍTICO</span>}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{latest.bpm}</span>
                        <span className="text-sm ${latest.is_critical ? 'text-red-200' : 'text-slate-400'}">BPM</span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${latest.is_critical ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`} style={{ width: `${Math.min(latest.bpm, 200) / 2}%` }}></div>
                    </div>
                </div>

                {/* SpO2 Card */}
                <div className={`rounded-2xl p-4 border backdrop-blur-sm hover:bg-white/10 transition-colors ${latest.is_critical ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 ${latest.is_critical ? 'text-red-100' : 'text-slate-300'}">
                            <Droplets className={`h-5 w-5 ${latest.is_critical ? 'text-yellow-300' : 'text-blue-500'}`} />
                            <span className="font-medium">Oxígeno (SpO2)</span>
                        </div>
                        {latest.spo2 < 95 && <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">BAJO</span>}
                        {latest.is_critical && <span className="text-[10px] font-bold bg-yellow-500 text-red-900 px-1.5 py-0.5 rounded animate-pulse">CRÍTICO</span>}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{latest.spo2}</span>
                        <span className="text-sm ${latest.is_critical ? 'text-red-200' : 'text-slate-400'}"></span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${latest.is_critical ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full`} style={{ width: `${latest.spo2}%` }}></div>
                    </div>
                </div>

                {/* Temperature Card */}
                {(() => {
                    const tempValue = latest.temperature ?? latest.temp ?? 0;
                    return (
                        <div className={`rounded-2xl p-4 border backdrop-blur-sm hover:bg-white/10 transition-colors ${latest.is_critical ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className={`flex items-center gap-2 ${latest.is_critical ? 'text-red-100' : 'text-slate-300'}`}>
                                    <Thermometer className={`h-5 w-5 ${latest.is_critical ? 'text-yellow-300' : 'text-orange-500'}`} />
                                    <span className="font-medium">Temperatura</span>
                                </div>
                                {tempValue > 37.5 && <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">FIEBRE</span>}
                                {latest.is_critical && <span className="text-[10px] font-bold bg-yellow-500 text-red-900 px-1.5 py-0.5 rounded animate-pulse">CRÍTICO</span>}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">{tempValue}</span>
                                <span className={`text-sm ${latest.is_critical ? 'text-red-200' : 'text-slate-400'}`}>°C</span>
                            </div>
                            <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${latest.is_critical ? 'bg-yellow-500' : 'bg-orange-500'} rounded-full`} style={{ width: `${Math.min((tempValue / 45) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
