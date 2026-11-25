"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePatientHistory } from '@/hooks/use-edge-service';
import { Loader2, Search, RefreshCw, Activity, Thermometer, Droplets, Siren, CheckCircle2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';

interface PatientVitalsHistoryProps {
  initialDeviceId?: string;
  currentPatientId?: number;
  currentPatientName?: string;
}

export function PatientVitalsHistory({ initialDeviceId = '' }: PatientVitalsHistoryProps) {
  const [deviceIdFilter, setDeviceIdFilter] = useState(initialDeviceId);
  const [targetId, setTargetId] = useState(initialDeviceId);
  
  const { history, isLoading, error, refresh } = usePatientHistory(targetId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTargetId(deviceIdFilter);
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    
    // Attempt 1: Standard Date constructor (works for ISO 8601)
    let date = new Date(dateString);
    if (isValid(date)) return date;

    // Attempt 2: SQL-like format "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.mmmmm"
    try {
        // Normalize separators
        const normalized = dateString.replace(/\//g, '-').replace(' ', 'T');
        
        // Try standard ISO parsing with T
        date = new Date(normalized);
        if (isValid(date)) return date;

        // Manual parsing for "YYYY-MM-DD HH:MM:SS"
        const [datePart, timePart] = dateString.split(' ');
        if (datePart && timePart) {
            const parts = datePart.replace(/\//g, '-').split('-').map(Number);
            const [hours, minutes, secondsStr] = timePart.split(':');
            const seconds = parseFloat(secondsStr || '0');
            
            if (parts.length === 3 && hours !== undefined && minutes !== undefined) {
                // Check if it's DD-MM-YYYY (year > 31 usually, day <= 31)
                // If parts[0] is year (e.g. 2023), it's YYYY-MM-DD
                // If parts[2] is year, it's DD-MM-YYYY or MM-DD-YYYY
                
                let year, month, day;
                if (parts[0] > 31) {
                    [year, month, day] = parts;
                } else {
                    // Assume DD-MM-YYYY
                    [day, month, year] = parts;
                }

                return new Date(year, month - 1, day, Number(hours), Number(minutes), Math.floor(seconds));
            }
        }
    } catch (e) {
        console.error("Manual parsing failed", e);
    }

    return null;
  };

  const formatDate = (dateString: string) => {
      const date = parseDate(dateString);
      // Return raw string if parsing fails, for debugging
      return date ? format(date, "dd MMM, HH:mm:ss", { locale: es }) : dateString;
  };

  // Process data for charts
  const chartData = useMemo(() => {
    return history.map(record => {
        const date = parseDate(record.timestamp);
        // Handle potential 'temp' alias from backend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tempValue = record.temperature ?? (record as any).temp ?? 0;
        
        return {
            ...record,
            temperature: tempValue,
            formattedTime: date ? format(date, "HH:mm", { locale: es }) : '',
            fullDate: date ? date.getTime() : 0
        };
    }).sort((a, b) => a.fullDate - b.fullDate); // Sort for charts (oldest to newest)
  }, [history]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Monitoreo IoT en Tiempo Real</h2>
        <div className="flex gap-2 items-center">
            <Input 
                placeholder="ID Dispositivo..." 
                value={deviceIdFilter}
                onChange={(e) => setDeviceIdFilter(e.target.value)}
                className="w-[200px]"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Cargar</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => refresh()} disabled={isLoading || !targetId} title="Actualizar datos">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      {error && (
          <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
            Error: {error.message}
          </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BPM Chart */}
            <Card className="border-2 border-red-100 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                        <Activity className="h-5 w-5" />
                        Ritmo Cardíaco
                    </CardTitle>
                    <CardDescription>Latidos por minuto (BPM)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="formattedTime" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#666' }}
                                />
                                <Area type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBpm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                        <div>
                            <span className="text-3xl font-bold text-slate-900">
                                {chartData[chartData.length - 1].bpm}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">BPM</span>
                        </div>
                        <Badge variant={chartData[chartData.length - 1].bpm > 100 ? "destructive" : "outline"}>
                            {chartData[chartData.length - 1].bpm > 100 ? "Alto" : "Normal"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* SpO2 Chart */}
            <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                        <Droplets className="h-5 w-5" />
                        Saturación de Oxígeno
                    </CardTitle>
                    <CardDescription>Porcentaje (%)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="formattedTime" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[80, 100]} hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#666' }}
                                />
                                <ReferenceLine y={95} stroke="orange" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpo2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="mt-2 flex justify-between items-end">
                        <div>
                            <span className="text-3xl font-bold text-slate-900">
                                {chartData[chartData.length - 1].spo2}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">%</span>
                        </div>
                        <Badge variant={chartData[chartData.length - 1].spo2 < 95 ? "destructive" : "outline"}>
                            {chartData[chartData.length - 1].spo2 < 95 ? "Bajo" : "Normal"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Temperature Chart */}
            <Card className="border-2 border-orange-100 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                        <Thermometer className="h-5 w-5" />
                        Temperatura Corporal
                    </CardTitle>
                    <CardDescription>Grados Celsius (°C)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="formattedTime" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#666' }}
                                />
                                <ReferenceLine y={37.5} stroke="red" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="mt-2 flex justify-between items-end">
                        <div>
                            <span className="text-3xl font-bold text-slate-900">
                                {chartData[chartData.length - 1].temperature}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">°C</span>
                        </div>
                        <Badge variant={chartData[chartData.length - 1].temperature > 37.5 ? "destructive" : "outline"}>
                            {chartData[chartData.length - 1].temperature > 37.5 ? "Fiebre" : "Normal"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Registro Detallado</CardTitle>
        </CardHeader>
        <CardContent>
            {!targetId && !history.length ? (
                <div className="text-center py-10 text-muted-foreground">
                    Ingresa un ID de dispositivo para ver el historial.
                </div>
            ) : (
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Fecha / Hora</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>BPM</TableHead>
                        <TableHead>SpO2</TableHead>
                        <TableHead>Temp.</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="mt-2 text-sm text-muted-foreground">Cargando registros...</p>
                            </TableCell>
                        </TableRow>
                    ) : history.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                No se encontraron registros para el dispositivo <strong>{targetId}</strong>.
                            </TableCell>
                        </TableRow>
                    ) : (
                        history.map((record, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {formatDate(record.timestamp)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{record.device_id}</TableCell>
                            <TableCell>
                                <span className={`font-bold ${record.bpm > 100 || record.bpm < 60 ? "text-red-600" : "text-slate-700"}`}>
                                    {record.bpm}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className={`font-bold ${record.spo2 < 95 ? "text-blue-600" : "text-slate-700"}`}>
                                    {record.spo2}%
                                </span>
                            </TableCell>
                            <TableCell>
                                {(() => {
                                    const tempVal = record.temperature ?? record.temp;
                                    const isFever = tempVal > 37.5;
                                    return (
                                        <span className={`font-bold ${isFever ? "text-orange-600" : "text-slate-700"}`}>
                                            {tempVal !== undefined && tempVal !== null ? tempVal : '--'}°C
                                        </span>
                                    );
                                })()}
                            </TableCell>
                            <TableCell>
                                {record.is_critical ? (
                                    <Badge variant="destructive" className="flex items-center gap-1 bg-red-600 text-white animate-pulse">
                                        <Siren className="h-3 w-3" />
                                        Alarma
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        Normal
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
