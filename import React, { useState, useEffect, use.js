import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Hospital, 
  DollarSign, 
  Settings, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2, 
  Download, 
  Filter, 
  Info, 
  UserPlus, 
  LayoutList, 
  CalendarDays, 
  Save, 
  Calculator, 
  ChevronDown, 
  ShieldCheck, 
  CreditCard, 
  UserCog, 
  AlertTriangle, 
  CheckCircle, 
  FileSpreadsheet, 
  RefreshCw, 
  MinusCircle, 
  Zap, 
  Mail, 
  Upload, 
  Moon, 
  Sun, 
  Lock,
  Stethoscope,
  TrendingUp,
  Award,
  FileText,
  Printer, 
  FileUp,
  Coins,
  Percent,
  Banknote,
  Database,
  Wallet,
  ArrowRightLeft,
  Layers,
  CalendarRange,
  LayoutDashboard,
  PieChart,
  ClipboardList,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';

// --- 1. CONSTANTES E DADOS INICIAIS ---

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const specialties = ["CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "GASTROENTEROLOGIA", "CIRURGIA DIGESTIVA", "OUTRA"];

const INITIAL_DOCTORS = [
  { id: '1', name: 'DR. CLÁUDIO SILVA', specialty: 'CIRURGIA GERAL', status: 'Ativo' },
  { id: '2', name: 'DRA. ANA MARTINS', specialty: 'PEDIATRIA', status: 'Ativo' }
];

const INITIAL_HOSPITALS = [
  { id: '1', name: 'HOSPITAL SÃO SEBASTIÃO', city: 'SÃO SEBASTIÃO - SP', address: 'Referência' },
  { id: '2', name: 'CLÍNICA SÃO JOSÉ', city: 'PORTO', address: 'Auxiliar' }
];

const INITIAL_SHIFT_TYPES = [
  { id: '1', label: '6 HORAS', value: 1000 },
  { id: '2', label: '12 HORAS', value: 2000 },
  { id: '3', label: '24 HORAS', value: 4000 },
  { id: '4', label: '3H COBERTURA', value: 500 }
];

// --- 2. UTILITÁRIOS ---

function normalizeMedicalName(name) {
  if (!name) return "";
  return name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(DR\.|DRA\.|DR|DRA)\s+/i, "").replace(/\s+/g, " ");
}

function cleanCurrencyInput(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseSafeDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date.getTime()) ? "Data Inválida" : date.toLocaleDateString('pt-BR');
}

function getWeekOfMonth(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return 0;
  const dayOfMonth = date.getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  return Math.ceil((dayOfMonth + adjustedFirstDay) / 7);
}

function calculateAggregateFinance(shifts, globalDiscounts = [], shiftTypes = []) {
  if (!shifts || shifts.length === 0) return { bruto: 0, retencao: 0, liquido: 0 };
  
  const totalBruto = shifts.reduce((acc, s) => {
    const currentPrice = shiftTypes.find(t => t.label === s.type)?.value;
    const valueToUse = currentPrice !== undefined ? currentPrice : (Number(s.grossValue) || 0);
    return acc + valueToUse;
  }, 0);
  
  let totalRetencao = 0;
  globalDiscounts.forEach(d => {
    const val = Number(d.value) || 0;
    if (d.type === 'percentage') totalRetencao += (totalBruto * (val / 100));
    else if (d.type === 'currency') totalRetencao += val;
  });
  
  return {
    bruto: totalBruto,
    retencao: totalRetencao,
    liquido: Math.max(0, totalBruto - totalRetencao)
  };
}

function getPaymentInfo(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return { month: 0, year: 0, label: "N/A" };
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 20);
  return { month: nextMonth.getMonth(), year: nextMonth.getFullYear(), label: `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}` };
}

// --- 3. COMPONENTES DE UI ---

function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-zinc-950 text-zinc-50 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 shadow-lg active:scale-95',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50',
    outline: 'border border-zinc-200 bg-white/50 backdrop-blur-md hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-md',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
  };
  return <button className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "", variant = 'default' }) {
  const styles = {
    default: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm',
    glass: 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800 shadow-2xl',
    bento: 'bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-inner'
  };
  return <div className={`${styles[variant]} rounded-[2rem] overflow-hidden transition-all ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]}`}>{children}</span>;
}

function Toast({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);
  if (!notification) return null;
  const messageText = typeof notification === 'object' ? (notification.text || "Operação Concluída") : String(notification);
  const type = notification.type || 'success';
  return (
    <div role="alert" className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 rounded-2xl shadow-2xl bg-zinc-900 text-white flex items-center gap-4 animate-in slide-in-from-top duration-500 font-bold italic">
      <div className={`p-2 rounded-full bg-zinc-800`}>{type === 'error' ? <AlertCircle size={18} className="text-rose-400" /> : <CheckCircle size={18} className="text-emerald-400" />}</div>
      <span className="text-xs uppercase tracking-tight">{messageText}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
    </div>
  );
}

function CustomAlertDialog({ isOpen, title, description, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-sm p-8 text-center border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 font-bold italic">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-black uppercase dark:text-white tracking-tighter">{title}</h3>
        <p className="text-sm text-zinc-500 mt-2">{description}</p>
        <div className="flex gap-4 mt-8">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-black uppercase text-zinc-400 border rounded-xl hover:bg-zinc-50 transition-colors">CANCELAR</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-xs font-black uppercase text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-lg">CONFIRMAR</button>
        </div>
      </Card>
    </div>
  );
}

// --- 5. COMPONENTES DE VISTA ---

function ScaleFilterBar({ filters, setFilters, doctors, hospitals }) {
  return (
    <Card variant="bento" className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 italic font-bold">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Users size={12}/> Especialista</label>
        <select value={filters.doctor} onChange={e => setFilters({...filters, doctor: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none">
          <option value="TODOS">Todos os Médicos</option>
          {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Hospital size={12}/> Unidade</label>
        <select value={filters.hospital} onChange={e => setFilters({...filters, hospital: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none">
          <option value="TODOS">Todas as Unidades</option>
          {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={12}/> Setor</label>
        <select value={filters.specialty} onChange={e => setFilters({...filters, specialty: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none">
          <option value="TODOS">Todas Especialidades</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><CalendarRange size={12}/> Semana</label>
        <select value={filters.week} onChange={e => setFilters({...filters, week: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none">
          <option value="TODAS">Mês Inteiro</option>
          {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
        </select>
      </div>
    </Card>
  );
}

function ListView({ shifts, onTogglePaid, onDeleteRequest, shiftTypes }) {
  return (
    <Card variant="default" className="shadow-2xl border-none italic font-black">
      <table className="w-full text-left text-sm font-bold italic">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800 font-black"><tr className="text-[10px] uppercase text-zinc-500 tracking-widest"><th className="px-6 py-5">Data</th><th className="px-6 py-5">Médico / Unidade</th><th className="px-6 py-5 text-right">Bruto Sinc.</th><th className="px-6 py-5 text-center">Status</th><th className="px-6 py-4"></th></tr></thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {shifts.map(s => {
            const currentPrice = shiftTypes.find(t => t.label === s.type)?.value || s.grossValue;
            return (
              <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors italic">
                <td className="px-6 py-5 text-zinc-400 font-bold italic">{formatDisplayDate(s.date)}</td>
                <td className="px-6 py-5 font-black italic"><div className="uppercase">{s.doctorName}</div><div className="text-[9px] text-zinc-400 uppercase tracking-widest">{s.unit}</div></td>
                <td className="px-6 py-5 text-right font-black italic text-zinc-900 dark:text-zinc-100">R$ {Number(currentPrice).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-5 text-center italic"><button onClick={() => onTogglePaid(s.id, !s.paid)} className={`px-4 py-1.5 rounded-full text-[9px] font-black border transition-all ${s.paid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{s.paid ? 'PAGO' : 'PENDENTE'}</button></td>
                <td className="px-6 py-5 text-right italic"><button onClick={() => onDeleteRequest(s)} className="text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {shifts.length === 0 && <div className="py-24 text-center opacity-20 italic tracking-[0.5em] font-black">Nenhum registo isolado</div>}
    </Card>
  );
}

function DoctorPayslip({ doctor, shifts, currentMonth, currentYear, isApproved, globalDiscounts, shiftTypes }) {
  const finance = useMemo(() => calculateAggregateFinance(shifts, globalDiscounts, shiftTypes), [shifts, globalDiscounts, shiftTypes]);
  const deductionsList = globalDiscounts.map(d => ({ ...d, amount: d.type === 'percentage' ? (finance.bruto * (Number(d.value) / 100)) : Number(d.value) }));
  
  return (
    <Card className={`p-8 border-2 ${isApproved ? 'border-emerald-500 shadow-emerald-100' : 'border-zinc-200'} animate-in zoom-in-95 mt-6 shadow-xl italic font-bold`}>
      <div className="flex justify-between items-start mb-8 pb-6 border-b dark:border-zinc-800 font-black">
        <div><h3 className="text-2xl uppercase tracking-tighter flex items-center gap-2 italic"><FileText size={28} className="text-blue-600" /> Holerite Digital</h3><p className="text-sm text-zinc-500">Referência: {monthNames[currentMonth]} {currentYear}</p></div>
        <Badge variant={isApproved ? 'success' : 'warning'}>{isApproved ? 'AUDITADO' : 'PRÉVIA'}</Badge>
      </div>
      <div className="mb-8 font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest">Profissional Responsável</p><p className="text-xl dark:text-zinc-100 uppercase italic">{doctor.name}</p></div>
      <div className="space-y-6">
        <div><p className="text-[10px] font-black text-zinc-400 uppercase mb-3 tracking-widest">Serviços Sincronizados</p>{shifts.map(s => {
          const livePrice = shiftTypes.find(t => t.label === s.type)?.value || s.grossValue;
          return (
            <div key={s.id} className="flex justify-between items-center py-2 border-b dark:border-zinc-900 text-sm italic shadow-sm px-2 font-bold"><span className="dark:text-zinc-300">{s.unit} ({s.type}) - {formatDisplayDate(s.date)}</span><span>R$ {Number(livePrice).toLocaleString('pt-BR')}</span></div>
          );
        })}</div>
        <div className="pt-8 grid grid-cols-3 gap-6 text-center font-black italic">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-inner"><p className="text-[10px] uppercase text-zinc-400 tracking-tighter">Bruto</p><p className="text-lg">R$ {finance.bruto.toLocaleString('pt-BR')}</p></div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-inner text-rose-500"><p className="text-[10px] uppercase opacity-70 tracking-tighter">Retenção</p><p className="text-lg">R$ {finance.retencao.toLocaleString('pt-BR')}</p></div>
          <div className="p-4 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-2xl shadow-xl transform scale-105"><p className="text-[10px] uppercase opacity-60 tracking-tighter">Líquido</p><p className="text-xl">R$ {finance.liquido.toLocaleString('pt-BR')}</p></div>
        </div>
      </div>
    </Card>
  );
}

function CalendarView({ shifts, currentMonth, currentYear, onDeleteRequest, onAddClick, shiftTypes }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const today = new Date();
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) days.push({ empty: true });
    for(let i=0; i<lastDay; i++) {
      const dateStr = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${(i+1).toString().padStart(2, '0')}`;
      days.push({ day: i + 1, date: dateStr, shifts: shifts.filter(s => s.date === dateStr) });
    }
    return days;
  }, [currentMonth, currentYear, shifts]);

  return (
    <Card variant="default" className="shadow-2xl border-none">
      <div className="grid grid-cols-7 bg-zinc-950 text-white font-black italic">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <div key={d} className="py-4 text-center text-[10px] uppercase tracking-[0.4em] opacity-40">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 font-bold italic">
        {calendarDays.map((item, idx) => (
          <div key={idx} className={`min-h-[160px] p-4 border-r border-b dark:border-zinc-800 relative group/day ${item.empty ? 'bg-zinc-50/10' : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 transition-colors'}`}>
            {!item.empty && (
              <>
                <span className={`text-xs font-black ${item.day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? 'text-blue-500' : 'text-zinc-300'}`}>{item.day}</span>
                <div className="mt-4 space-y-2">
                  {item.shifts.map(s => (
                    <div key={s.id} className="relative">
                      <div onClick={() => setActiveTooltip(s.id)} className={`text-[10px] p-2 rounded-xl font-black truncate cursor-pointer border shadow-sm transition-all active:scale-95 italic ${s.paid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'}`}>{s.doctorName.split(' ').pop()}</div>
                      {activeTooltip === s.id && (
                        <div className="absolute z-[100] top-0 left-full ml-4 w-56 bg-zinc-950/95 backdrop-blur-xl text-white p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 border border-white/10 italic">
                          <div className="flex justify-between items-start mb-4"><Badge variant="success">Ficha</Badge><button onClick={() => setActiveTooltip(null)}><X size={16} /></button></div>
                          <p className="text-sm font-black uppercase leading-tight italic">{s.doctorName}</p>
                          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">{s.unit}</p>
                          <div className="mt-4 pt-4 border-t border-white/10 font-black">
                            <p className="text-[10px] font-black text-blue-400 uppercase italic">{s.type}</p>
                            <p className="text-xs mt-1">R$ {(shiftTypes.find(t => t.label === s.type)?.value || s.grossValue).toLocaleString('pt-BR')}</p>
                          </div>
                          <button onClick={() => { setActiveTooltip(null); onDeleteRequest(s); }} className="w-full mt-6 py-3 bg-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Remover</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => onAddClick(item.date)} className="absolute bottom-4 right-4 p-2 rounded-xl bg-zinc-950 text-white opacity-0 group-hover/day:opacity-100 transition-all shadow-xl hover:scale-110 active:rotate-90"><Plus size={16} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinanceView({ shifts, doctors, hospitals, currentMonth, currentYear, showToast, globalDiscounts, shiftTypes }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('TODOS');
  const [selectedHospital, setSelectedHospital] = useState('TODOS');
  const [isApproved, setIsApproved] = useState(false);

  const selectedDoctor = useMemo(() => doctors.find(d => d.id.toString() === selectedDoctorId), [doctors, selectedDoctorId]);
  
  const filteredShifts = useMemo(() => shifts.filter(s => {
    const date = new Date(s.date + 'T00:00:00');
    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return false;
    
    const matchDoctor = selectedDoctorId === 'TODOS' || normalizeMedicalName(s.doctorName) === normalizeMedicalName(selectedDoctor?.name);
    const matchHospital = selectedHospital === 'TODOS' || s.unit === selectedHospital;
    
    return matchDoctor && matchHospital;
  }), [shifts, currentMonth, currentYear, selectedDoctorId, selectedDoctor, selectedHospital]);

  const finance = useMemo(() => calculateAggregateFinance(filteredShifts, globalDiscounts, shiftTypes), [filteredShifts, globalDiscounts, shiftTypes]);

  return (
    <div className="space-y-8 animate-in fade-in italic font-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-black">
        <Card variant="glass" className="col-span-2 p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative group">
          <div className="flex items-center gap-8 relative z-10 font-black">
            <div className="w-20 h-20 bg-zinc-950 dark:bg-white rounded-[2rem] flex items-center justify-center text-white dark:text-zinc-950 shadow-2xl transition-transform group-hover:rotate-6 font-black"><Award size={40} /></div>
            <div className="font-black">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Balanço Auditor</h3>
                <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em]">{monthNames[currentMonth]} {currentYear}</p>
            </div>
          </div>
          <div className="flex gap-12 items-center relative z-10 font-black">
            <div className="text-right font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest italic font-black">Bruto Sincronizado</p><p className="text-3xl dark:text-white font-black italic">R$ {finance.bruto.toLocaleString('pt-BR')}</p></div>
            <div className="text-right font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest italic font-black">Plantões</p><p className="text-3xl text-blue-500 font-black italic">{filteredShifts.length}</p></div>
          </div>
        </Card>
        <Card variant="bento" className="p-8 flex flex-col justify-center gap-4 italic font-black shadow-xl">
           <div className="space-y-1 font-black italic">
             <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 italic font-black">Filtro Médico</label>
             <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-800 border-none rounded-xl font-black text-sm shadow-md outline-none italic font-black">
               <option value="TODOS">Todos os Médicos</option>
               {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
           </div>
           <div className="space-y-1 font-black italic">
             <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 italic font-black">Filtro Unidade</label>
             <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-800 border-none rounded-xl font-black text-sm shadow-md outline-none italic font-black">
               <option value="TODOS">Todas as Unidades</option>
               {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
             </select>
           </div>
        </Card>
      </div>
      {!isApproved && (
        <Card variant="glass" className="bg-zinc-950 p-10 text-center relative overflow-hidden group italic font-black">
          <Button onClick={() => { if(window.prompt("Senha ADM (58120):")==="58120"){setIsApproved(true); showToast("Sessão validada!");} }} className="w-full h-20 text-2xl uppercase font-black italic tracking-[0.2em] rounded-[2.5rem] bg-white text-zinc-950 relative z-10 hover:scale-[1.02] transition-all"><Lock size={32} className="mr-4 text-blue-500 font-black italic"/> Desbloquear Ciclo Auditor</Button>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-black italic font-black">
        <Card className="p-8 border-l-[12px] border-blue-600 shadow-xl italic font-black font-black"><p className="text-[11px] text-zinc-400 uppercase tracking-widest italic font-black font-black italic">Faturamento Bruto</p><h4 className="text-4xl dark:text-white mt-4 italic font-black font-black">R$ {finance.bruto.toLocaleString('pt-BR')}</h4></Card>
        <Card className="p-8 border-l-[12px] border-emerald-500 shadow-xl italic font-black font-black"><p className="text-[11px] text-zinc-400 uppercase tracking-widest italic font-black font-black italic">Líquido Previsto</p><h4 className="text-4xl text-emerald-600 dark:text-emerald-500 mt-4 italic font-black font-black">R$ {finance.liquido.toLocaleString('pt-BR')}</h4></Card>
      </div>
      {selectedDoctorId !== 'TODOS' && selectedDoctor && (<DoctorPayslip doctor={selectedDoctor} shifts={filteredShifts} currentMonth={currentMonth} currentYear={currentYear} isApproved={isApproved} globalDiscounts={globalDiscounts} shiftTypes={shiftTypes} />)}
    </div>
  );
}

function PaymentsView({ shifts, doctors, hospitals, showToast, globalDiscounts, shiftTypes }) {
  const [filters, setFilters] = useState({ doctor: 'TODOS', hospital: 'TODOS', competenceMonth: new Date().getMonth(), competenceYear: new Date().getFullYear(), paymentMonth: 'TODOS' });
  const doctorsWithShifts = useMemo(() => {
    const map = {};
    shifts.forEach(s => {
      const shiftDate = new Date(s.date + 'T00:00:00');
      const payInfo = getPaymentInfo(s.date);
      if (shiftDate.getMonth() === Number(filters.competenceMonth) && shiftDate.getFullYear() === Number(filters.competenceYear) &&
          (filters.doctor === 'TODOS' || normalizeMedicalName(s.doctorName) === normalizeMedicalName(filters.doctor)) &&
          (filters.hospital === 'TODOS' || s.unit === filters.hospital) &&
          (filters.paymentMonth === 'TODOS' || payInfo.month === Number(filters.paymentMonth))) {
        const key = normalizeMedicalName(s.doctorName);
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [shifts, filters]);

  const stats = useMemo(() => {
    let bruto = 0, liquido = 0, pago = 0;
    Object.values(doctorsWithShifts).forEach(docShifts => {
      const fin = calculateAggregateFinance(docShifts, globalDiscounts, shiftTypes);
      bruto += fin.bruto; liquido += fin.liquido;
      if (docShifts.every(s => s.paid)) pago += fin.liquido;
      else if (docShifts.some(s => s.paid)) pago += (fin.liquido * (docShifts.filter(s => s.paid).length / docShifts.length));
    });
    return { bruto, liquido, pago, pendente: liquido - pago };
  }, [doctorsWithShifts, globalDiscounts, shiftTypes]);

  return (
    <div className="space-y-8 animate-in fade-in italic font-black font-black italic">
      <h2 className="text-3xl font-black dark:text-zinc-50 uppercase italic tracking-tighter flex items-center gap-3 italic"><Wallet className="text-emerald-500" /> Centro de Desembolso</h2>
      <Card variant="bento" className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 italic font-black">
        <div className="space-y-1 font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Especialista</label><select value={filters.doctor} onChange={e => setFilters({...filters, doctor: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none italic"><option value="TODOS">TODOS</option>{doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
        <div className="space-y-1 font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hospital</label><select value={filters.hospital} onChange={e => setFilters({...filters, hospital: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none italic"><option value="TODOS">TODAS AS UNIDADES</option>{hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}</select></div>
        <div className="space-y-1 font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Competência</label><div className="flex gap-2 font-black italic"><select value={filters.competenceMonth} onChange={e => setFilters({...filters, competenceMonth: e.target.value})} className="flex-1 p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm italic outline-none italic">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={filters.competenceYear} onChange={e => setFilters({...filters, competenceYear: e.target.value})} className="w-20 p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-inner italic outline-none italic" /></div></div>
        <div className="space-y-1 font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-blue-500 font-black italic">Ciclo 20/M+1</label><select value={filters.paymentMonth} onChange={e => setFilters({...filters, paymentMonth: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl font-bold text-xs shadow-sm border-l-4 border-blue-500 italic outline-none italic"><option value="TODOS">Todos os Ciclos</option>{monthNames.map((m, i) => <option key={i} value={i}>20 de {m}</option>)}</select></div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 italic font-black font-black italic">
        <Card className="p-8 border-l-[10px] border-blue-500 shadow-xl font-black italic font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black italic">Previsto Líquido</p><h4 className="text-3xl mt-2 italic font-black">R$ {stats.liquido.toLocaleString('pt-BR')}</h4></Card>
        <Card className="p-8 border-l-[10px] border-emerald-500 shadow-xl font-black italic font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black italic">Total Liquidado</p><h4 className="text-3xl text-emerald-600 mt-2 italic font-black">R$ {stats.pago.toLocaleString('pt-BR')}</h4></Card>
        <Card className="p-8 border-l-[10px] border-rose-500 shadow-xl font-black italic font-black"><p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black italic">Saldo Devedor</p><h4 className="text-3xl text-rose-600 mt-2 italic font-black">R$ {stats.pendente.toLocaleString('pt-BR')}</h4></Card>
      </div>
      <Card className="overflow-hidden shadow-2xl border-none font-black italic italic font-black">
        <table className="w-full text-left text-sm font-bold italic font-black italic font-black">
          <thead className="bg-zinc-950 text-white font-black italic font-black"><tr className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 italic font-black"><th className="px-6 py-5 italic font-black italic">Médico</th><th className="px-6 py-5 text-right italic font-black italic">Bruto Sincronizado</th><th className="px-6 py-5 text-right italic font-black italic">Líquido Final</th><th className="px-6 py-5 italic font-black italic">Ciclo Pagamento</th><th className="px-6 py-5 text-center italic font-black italic">Estado</th></tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold italic font-black">
            {Object.entries(doctorsWithShifts).map(([name, docShifts]) => {
              const fin = calculateAggregateFinance(docShifts, globalDiscounts, shiftTypes);
              const info = getPaymentInfo(docShifts[0].date);
              const done = docShifts.every(x => x.paid);
              return (<tr key={name} className="hover:bg-zinc-50/50 transition-colors italic font-black font-black font-black"><td className="px-6 py-5 uppercase font-black text-zinc-900 dark:text-zinc-100 italic font-black">{name}</td><td className="px-6 py-5 text-right text-zinc-400 font-bold italic font-black font-black font-black font-black">R$ {fin.bruto.toLocaleString('pt-BR')}</td><td className="px-6 py-5 text-right font-black italic font-black font-black font-black font-black">R$ {fin.liquido.toLocaleString('pt-BR')}</td><td className="px-6 py-5 font-bold text-blue-600 text-xs italic font-black italic font-black font-black font-black">20 de {info.label}</td><td className="px-6 py-5 text-center italic font-black italic font-black font-black font-black"><Badge variant={done ? 'success' : 'warning'}>{done ? 'PAGO' : 'PENDENTE'}</Badge></td></tr>);
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DoctorsView({ doctors, onAddDoctor, onImportMassive, onDeleteDoctor, showToast }) {
  const [newDoc, setNewDoc] = useState({ name: '', specialty: 'CIRURGIA GERAL' });
  const docImportRef = useRef(null);
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split('\n').filter(l => l.trim() !== '');
      const imported = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map(s => s?.trim());
        return { id: `doc-${Date.now()}-${idx}`, name: parts[0]?.toUpperCase() || 'MÉDICO S/ NOME', specialty: parts[1]?.toUpperCase() || 'GERAL', status: 'Ativo' };
      });
      if (imported.length > 0) { onImportMassive(imported); showToast(`${imported.length} especialistas importados!`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in italic font-black italic">
      <Card className="p-10 shadow-2xl border-none italic font-black italic">
        <div className="flex justify-between items-center mb-8 font-black font-black italic italic"><h3 className="text-2xl uppercase dark:text-zinc-50 tracking-tighter italic font-black italic">Cadastro Clínico</h3><input type="file" ref={docImportRef} className="hidden font-black italic italic" accept=".csv" onChange={handleImport} /><Button variant="outline" size="sm" onClick={() => docImportRef.current.click()} className="italic font-black italic"><FileUp size={16}/> Importar</Button></div>
        <form onSubmit={(e) => { e.preventDefault(); onAddDoctor({...newDoc, id: Date.now().toString()}); setNewDoc({name:'', specialty:'CIRURGIA GERAL'}); }} className="space-y-6 italic font-black italic">
          <div className="italic font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black italic">Nome Profissional</label><input type="text" placeholder="EX: DR. CLÁUDIO SILVA" required value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border-none font-bold italic uppercase shadow-inner italic font-black italic shadow-xl outline-none" /></div>
          <div className="italic font-black italic"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black italic font-black">Cadeira / Especialidade</label><select value={newDoc.specialty} onChange={e => setNewDoc({...newDoc, specialty: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border-none font-bold italic uppercase shadow-inner italic font-black italic outline-none shadow-xl font-black">{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <Button variant="primary" className="w-full h-16 uppercase font-black tracking-[0.2em] italic shadow-2xl mt-4 italic font-black italic">Ativar Profissional</Button>
        </form>
      </Card>
      <Card variant="bento" className="p-10 font-bold italic italic font-black shadow-xl italic font-black font-black italic">
        <h3 className="text-xl font-black mb-8 uppercase dark:text-zinc-50 tracking-tighter italic font-black italic font-black italic">Corpo Clínico Ativo</h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 italic font-black italic font-black font-black italic">
          {doctors.map(d => (<div key={d.id} className="flex justify-between items-center p-5 bg-white dark:bg-zinc-950 rounded-[1.5rem] shadow-sm group transition-all hover:scale-[1.02] border dark:border-zinc-800 italic font-black italic font-black italic"><div><p className="font-black text-sm uppercase dark:text-zinc-100 italic font-black italic font-black italic">{d.name}</p><p className="text-[10px] text-zinc-400 uppercase tracking-widest italic font-black italic font-black italic">{d.specialty}</p></div><button onClick={() => onDeleteDoctor(d)} className="p-3 text-zinc-300 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all italic font-black italic font-black italic"><Trash2 size={18} className="italic font-black"/></button></div>))}
        </div>
      </Card>
    </div>
  );
}

function HospitalsView({ hospitals, onAddHospital, onDeleteHospital }) {
  const [newHosp, setNewHosp] = useState({ name: '', city: '' });
  return (
    <div className="space-y-8 animate-in fade-in italic font-black italic font-black font-black italic">
      <h2 className="text-3xl font-black dark:text-zinc-50 uppercase italic tracking-tighter flex items-center gap-3 italic font-black font-black italic"><Hospital className="text-blue-500 italic font-black italic font-black italic" /> Rede de Unidades</h2>
      <Card className="p-10 shadow-2xl border-none italic font-black font-black italic font-black italic">
        <form onSubmit={(e) => { e.preventDefault(); onAddHospital({...newHosp, id: Date.now().toString()}); setNewHosp({name:'', city:''}); }} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end italic font-black italic font-black font-black italic font-black font-black italic">
          <div className="space-y-2 italic font-black italic font-black italic font-black italic font-black"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 italic font-black italic font-black italic">Unidade</label><input type="text" placeholder="HOSPITAL GERAL" required value={newHosp.name} onChange={e => setNewHosp({...newHosp, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border-none font-bold uppercase shadow-inner italic font-black italic font-black italic outline-none shadow-xl font-black italic italic font-black" /></div>
          <div className="space-y-2 italic font-black italic font-black italic font-black italic font-black"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 italic font-black italic font-black italic">Cidade / UF</label><input type="text" placeholder="PORTO - PT" required value={newHosp.city} onChange={e => setNewHosp({...newHosp, city: e.target.value.toUpperCase()})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border-none font-bold uppercase shadow-inner italic font-black italic font-black italic outline-none shadow-xl font-black italic italic font-black" /></div>
          <Button variant="primary" className="h-[3.7rem] uppercase font-black tracking-widest shadow-2xl italic font-black italic font-black font-black italic">Vincular Unidade</Button>
        </form>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 italic font-black italic font-black font-black italic font-black font-black italic font-black italic">
        {hospitals.map(h => (<Card key={h.id} className="p-6 flex justify-between items-center bg-white dark:bg-zinc-950 group hover:border-blue-500 transition-all font-black italic font-black font-black italic font-black italic font-black font-black font-black italic shadow-xl"><div><p className="text-sm dark:text-zinc-100 uppercase tracking-tighter italic font-black italic font-black font-black">{h.name}</p><p className="text-[10px] text-zinc-400 uppercase tracking-widest italic font-black italic font-black font-black font-black">{h.city}</p></div><button onClick={() => onDeleteHospital(h)} className="p-3 text-zinc-300 hover:text-rose-500 transition-colors italic font-black font-black italic font-black font-black italic"><Trash2 size={18} className="italic font-black"/></button></Card>))}
      </div>
    </div>
  );
}

function SettingsView({ onUninstallClick, showToast, onSaveConfig, initialConfig, onSaveDiscounts, initialDiscounts, onSaveShiftTypes, initialShiftTypes }) {
  const [openItem, setOpenItem] = useState('billing');
  const [localConfig, setLocalConfig] = useState(initialConfig);
  const [localDiscounts, setLocalDiscounts] = useState(initialDiscounts);
  const [localShiftTypes, setLocalShiftTypes] = useState(initialShiftTypes || []);
  const [newDiscount, setNewDiscount] = useState({ label: '', value: 0, type: 'percentage' });
  const [newShiftType, setNewShiftType] = useState({ label: '', value: 0 });

  useEffect(() => { setLocalConfig(initialConfig); }, [initialConfig]);
  useEffect(() => { setLocalDiscounts(initialDiscounts); }, [initialDiscounts]);
  useEffect(() => { setLocalShiftTypes(initialShiftTypes || []); }, [initialShiftTypes]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in italic font-black font-black italic font-black font-black italic font-black font-black italic">
      <h2 className="text-4xl font-black dark:text-zinc-50 uppercase italic tracking-tighter italic font-black italic font-black italic font-black font-black font-black font-black font-black">Engenharia REFUA</h2>
      <Card className="divide-y divide-zinc-100 dark:border-zinc-800 shadow-2xl rounded-[3rem] italic font-black font-black italic font-black font-black font-black font-black font-black font-black font-black">
        <button onClick={() => setOpenItem(openItem === 'types' ? '' : 'types')} className="flex w-full items-center justify-between p-10 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all font-black text-xl italic font-black font-black font-black font-black font-black font-black font-black font-black font-black italic font-black italic"><div className="flex items-center gap-6 italic font-black font-black italic font-black font-black font-black font-black italic font-black font-black font-black font-black"><ClipboardList size={28} className="text-blue-500 font-black italic italic font-black font-black font-black italic" /><span>Tipos de Serviço & Setores</span></div><ChevronDown className={openItem === 'types' ? 'rotate-180 transition-transform italic font-black italic font-black font-black font-black' : 'transition-transform italic font-black italic font-black font-black font-black font-black font-black'} /></button>
        {openItem === 'types' && (<div className="p-12 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-10 animate-in slide-in-from-top-4 italic font-black italic font-black font-black font-black font-black font-black font-black font-black"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl italic font-black italic font-black font-black font-black font-black font-black italic font-black font-black"><input type="text" placeholder="EX: 3H COBERTURA" value={newShiftType.label} onChange={e => setNewShiftType({...newShiftType, label: e.target.value.toUpperCase()})} className="p-4 border-none bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-black italic italic font-black font-black font-black font-black font-black" /><input type="number" placeholder="VALOR BASE" value={newShiftType.value} onChange={e => setNewShiftType({...newShiftType, value: Number(e.target.value)})} className="p-4 border-none bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-black italic italic font-black font-black font-black font-black font-black" /><Button onClick={() => { if(!newShiftType.label) return; setLocalShiftTypes([...localShiftTypes, {...newShiftType, id: Date.now().toString()}]); setNewShiftType({label:'', value: 0}); }} className="h-14 italic font-black italic font-black font-black font-black font-black font-black font-black font-black font-black italic font-black italic shadow-xl font-black font-black">ATIVAR</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-black italic font-black italic font-black">{localShiftTypes.map(t => (<div key={t.id} className="flex justify-between items-center p-6 bg-white dark:bg-zinc-950 rounded-[1.5rem] border dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.01] italic font-black italic font-black font-black font-black"><span className="font-black uppercase tracking-widest italic font-black font-black">{t.label}</span><div className="flex items-center gap-6 italic font-black font-black font-black italic"><span className="font-black text-blue-500 italic font-black italic font-black font-black">R$ {t.value.toLocaleString('pt-BR')}</span><button onClick={() => setLocalShiftTypes(localShiftTypes.filter(x => x.id !== t.id))} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors italic font-black italic font-black"><Trash2 size={20} className="font-black italic"/></button></div></div>))}</div><Button variant="primary" className="w-full h-16 uppercase font-black italic tracking-[0.3em] shadow-2xl font-black italic font-black italic font-black" onClick={() => onSaveShiftTypes(localShiftTypes)}>Sincronizar Protocolos</Button></div>)}
        <button onClick={() => setOpenItem(openItem === 'discounts' ? '' : 'discounts')} className="flex w-full items-center justify-between p-10 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all font-black text-xl italic font-black font-black font-black font-black"><div className="flex items-center gap-6 italic font-black font-black italic font-black font-black font-black font-black italic"><Percent size={28} className="text-rose-500 italic font-black italic font-black font-black font-black font-black font-black font-black" /><span>Taxas & Retenções Globais</span></div><ChevronDown className={openItem === 'discounts' ? 'rotate-180 transition-transform italic font-black italic font-black font-black font-black font-black font-black' : 'transition-transform italic font-black italic font-black font-black font-black font-black font-black font-black'} /></button>
        {openItem === 'discounts' && (<div className="p-12 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-10 italic font-black italic font-black font-black font-black font-black font-black font-black font-black"><div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl italic font-black italic font-black font-black font-black font-black font-black font-black font-black italic font-black"><input type="text" placeholder="TAG" value={newDiscount.label} onChange={e => setNewDiscount({...newDiscount, label: e.target.value.toUpperCase()})} className="p-4 border-none bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-black italic font-black font-black font-black font-black font-black font-black font-black font-black font-black" /><input type="number" placeholder="VALOR" value={newDiscount.value} onChange={e => setNewDiscount({...newDiscount, value: Number(e.target.value)})} className="p-4 border-none bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-black italic font-black font-black font-black font-black font-black font-black font-black font-black font-black" /><select value={newDiscount.type} onChange={e => setNewDiscount({...newDiscount, type: e.target.value})} className="p-4 border-none bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-black italic font-black font-black font-black font-black font-black font-black font-black font-black font-black"><option value="percentage">% PERCENTUAL</option><option value="currency">R$ FIXO MENSAL</option></select><Button onClick={() => { if(!newDiscount.label || newDiscount.value <= 0) return; setLocalDiscounts([...localDiscounts, {...newDiscount, id: Date.now().toString()}]); setNewDiscount({label:'', value: 0, type:'percentage'}); }} className="h-14 italic font-black italic font-black font-black font-black font-black font-black font-black font-black font-black font-black italic font-black italic font-black shadow-xl">ATIVAR</Button></div><div className="space-y-4 font-black italic font-black italic font-black font-black">{localDiscounts.map(d => (<div key={d.id} className="flex justify-between items-center p-6 bg-white dark:bg-zinc-950 rounded-[1.5rem] border dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.01] font-bold italic font-black italic font-black font-black"><div className="flex items-center gap-4 italic font-black font-black italic font-black"><div className="flex items-center gap-4 font-black italic font-black">{d.type === 'percentage' ? <Percent size={18} className="text-rose-400 font-black italic italic font-black" /> : <Banknote size={18} className="text-zinc-400 font-black italic italic font-black" />}<span className="font-black uppercase tracking-widest italic font-black font-black font-black">{d.label}</span></div></div><div className="flex items-center gap-6 italic font-black italic font-black font-black"><span className="font-black text-rose-500 text-lg italic font-black font-black">R$ {d.value.toLocaleString('pt-BR')}{d.type === 'percentage' ? '%' : ''}</span><button onClick={() => setLocalDiscounts(localDiscounts.filter(x => x.id !== d.id))} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors italic font-black italic font-black font-black"><Trash2 size={20} className="font-black italic"/></button></div></div>))}</div><Button variant="primary" className="w-full h-16 uppercase font-black italic tracking-[0.3em] shadow-2xl font-black italic font-black italic font-black font-black" onClick={() => onSaveDiscounts(localDiscounts)}>Sincronizar Regras</Button></div>)}
        <button onClick={onUninstallClick} className="flex w-full items-center justify-between p-10 hover:bg-rose-50 text-red-500 italic uppercase font-black tracking-[0.4em] italic font-black font-black italic"><div className="flex items-center gap-6 italic font-black font-black italic font-black"><RefreshCw size={28} className="font-black italic italic font-black" /><span>Reinicialização Sistémica</span></div></button>
      </Card>
    </div>
  );
}

function ShiftModal({ isOpen, onClose, onSave, doctors, hospitals, initialDate, shiftTypes }) {
  const [newShift, setNewShift] = useState({ date: initialDate || '', unit: '', doctorName: '', type: '', grossValue: 0, specialty: 'CIRURGIA GERAL' });
  useEffect(() => { 
    if (newShift.type) {
      const selected = shiftTypes.find(t => t.label === newShift.type);
      if (selected) setNewShift(prev => ({ ...prev, grossValue: selected.value }));
    }
  }, [newShift.type, shiftTypes]);
  useEffect(() => { if (isOpen && initialDate) setNewShift(prev => ({ ...prev, date: initialDate })); }, [isOpen, initialDate]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[800] flex items-center justify-center p-4 italic font-black font-black">
      <Card className="w-full max-w-xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border dark:border-zinc-800 animate-in slide-in-from-bottom-8 italic font-bold italic font-black font-black">
        <div className="flex justify-between items-center mb-10 italic font-black font-black tracking-tighter font-black font-black"><h3 className="text-3xl uppercase dark:text-zinc-50 italic font-black font-black">Lançamento Operacional</h3><button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full transition-all italic font-black font-black"><X size={28} /></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...newShift, id: Date.now().toString() }); onClose(); }} className="space-y-6 italic font-black font-black font-black">
          <div className="grid grid-cols-2 gap-6 italic font-black font-black">
            <div className="italic font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black">Data Operacional</label><input type="date" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner italic font-black font-black font-black" required /></div>
            <div className="italic font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black">Setor</label><select required value={newShift.specialty} onChange={e => setNewShift({...newShift, specialty: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner italic font-black font-black font-black font-black">{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="italic font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black font-black">Hospital Parceiro</label><select required value={newShift.unit} onChange={e => setNewShift({ ...newShift, unit: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner uppercase italic font-black font-black font-black font-black font-black"><option value="">ESCOLHA A UNIDADE...</option>{hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}</select></div>
          <div className="italic font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black font-black">Especialista Responsável</label><select required value={newShift.doctorName} onChange={e => setNewShift({ ...newShift, doctorName: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner uppercase italic font-black font-black font-black font-black font-black"><option value="">ESCOLHA O MÉDICO...</option>{doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-6 italic font-black font-black font-black font-black">
            <div className="italic font-black font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black font-black font-black">Regime / Horas</label><select required value={newShift.type} onChange={e => setNewShift({...newShift, type: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner italic font-black font-black font-black font-black"><option value="">SELECIONE...</option>{shiftTypes.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}</select></div>
            <div className="italic font-black font-black font-black"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block italic font-black font-black font-black font-black">Bruto Operacional (R$)</label><input type="number" value={newShift.grossValue} onChange={e => setNewShift({...newShift, grossValue: Number(e.target.value)})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-[1.5rem] font-black shadow-inner italic font-black font-black font-black font-black font-black" required /></div>
          </div>
          <Button variant="primary" className="w-full h-20 uppercase font-black tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] mt-6 italic font-black font-black font-black font-black font-black">Validar Lançamento</Button>
        </form>
      </Card>
    </div>
  );
}

// --- 6. COMPONENTE PRINCIPAL (APP) ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('Shifts');
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [config, setConfig] = useState({ val6h: 1000, val12h: 2000, val24h: 4000 });
  const [shiftTypes, setShiftTypes] = useState(INITIAL_SHIFT_TYPES);
  const [globalDiscounts, setGlobalDiscounts] = useState([{ id: '1', label: 'ISS/ADM', value: 15, type: 'percentage' }]);
  
  const [shifts, setShifts] = useState([]);
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [scaleFilters, setScaleFilters] = useState({ doctor: 'TODOS', hospital: 'TODOS', specialty: 'TODOS', week: 'TODAS' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', description: '', onConfirm: () => {} });
  const [toast, setToast] = useState(null);
  const shiftImportRef = useRef(null);

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  const showToast = useCallback((text, type = 'success') => setToast({ text, type }), []);

  const handleImportShiftsMassive = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const imported = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map(s => s?.trim());
        const date = parseSafeDate(parts[0]);
        const grossValue = cleanCurrencyInput(parts[6]);
        return { 
          id: `imp-${Date.now()}-${idx}`, 
          date: date || new Date().toISOString().split('T')[0], 
          unit: parts[1]?.toUpperCase() || 'UNIDADE', 
          doctorName: parts[2]?.toUpperCase() || 'MÉDICO', 
          specialty: parts[3]?.toUpperCase() || 'GERAL',
          type: parts[4] || '12h', 
          grossValue: grossValue, 
          paid: parts[7]?.toLowerCase().includes('pago') || false 
        };
      });
      if (imported.length > 0) {
        setShifts(prev => [...prev, ...imported]);
        showToast(`${imported.length} plantões sincronizados!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredShiftsForScale = useMemo(() => {
    return shifts.filter(s => {
      const shiftDate = new Date(s.date + 'T00:00:00');
      if (shiftDate.getMonth() !== currentMonth || shiftDate.getFullYear() !== currentYear) return false;
      const matchDoctor = scaleFilters.doctor === 'TODOS' || normalizeMedicalName(s.doctorName) === normalizeMedicalName(scaleFilters.doctor);
      const matchHospital = scaleFilters.hospital === 'TODOS' || s.unit === scaleFilters.hospital;
      const matchSpecialty = scaleFilters.specialty === 'TODOS' || (s.specialty && s.specialty === scaleFilters.specialty);
      const matchWeek = scaleFilters.week === 'TODAS' || getWeekOfMonth(s.date) === Number(scaleFilters.week);
      return matchDoctor && matchHospital && matchSpecialty && matchWeek;
    });
  }, [shifts, currentMonth, currentYear, scaleFilters]);

  const navItems = [
    { id: 'Shifts', label: 'Escalas', icon: LayoutDashboard },
    { id: 'Finance', label: 'Auditoria', icon: ShieldCheck },
    { id: 'Payments', label: 'Carteira', icon: Wallet },
    { id: 'Doctors', label: 'Equipa', icon: Stethoscope },
    { id: 'Hospitals', label: 'Unidades', icon: Hospital },
    { id: 'Settings', label: 'Ajustes', icon: UserCog },
  ];

  const renderContent = () => {
    switch(currentPage) {
      case 'Shifts': return (
        <div className="space-y-8 animate-in fade-in italic font-black italic font-black font-black italic">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 italic font-black font-black">
            <div className="italic font-black font-black font-black"><h2 className="text-4xl font-black dark:text-white uppercase italic tracking-tighter italic font-black font-black">Operações</h2><p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic font-black font-black font-black">Logística Operacional REFUA PLUS</p></div>
            <div className="flex flex-wrap gap-3 italic font-black font-black font-black">
              <input type="file" ref={shiftImportRef} className="hidden font-black italic font-black font-black" accept=".csv" onChange={handleImportShiftsMassive} />
              <Button variant="outline" onClick={() => shiftImportRef.current.click()} className="italic font-black font-black font-black italic"><FileUp size={16} className="font-black italic" /> IMPORTAR CSV</Button>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-[1.2rem] border dark:border-zinc-800 shadow-inner italic font-black font-black font-black font-black">
                <button onClick={() => setViewMode('calendar')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-zinc-950 text-white shadow-xl font-black italic font-black font-black' : 'text-zinc-400 font-black italic font-black font-black'}`}><CalendarDays size={18} className="font-black italic" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-950 text-white shadow-xl font-black italic font-black font-black' : 'text-zinc-400 font-black italic font-black font-black'}`}><LayoutList size={18} className="font-black italic" /></button>
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-12 w-12 rounded-full p-0 shadow-2xl transition-all italic font-black font-black font-black font-black"><Plus size={24} className="font-black italic font-black font-black" /></Button>
            </div>
          </div>
          <ScaleFilterBar filters={scaleFilters} setFilters={setScaleFilters} doctors={doctors} hospitals={hospitals} />
          {viewMode === 'calendar' 
            ? <CalendarView shifts={filteredShiftsForScale} currentMonth={currentMonth} currentYear={currentYear} shiftTypes={shiftTypes} onAddClick={(date) => { setSelectedDate(date); setIsModalOpen(true); }} onDeleteRequest={(s) => setAlertConfig({ open: true, title: "Anular Turno", description: `Remover plantão de ${s.doctorName}?`, onConfirm: () => { setShifts(shifts.filter(x => x.id !== s.id)); setAlertConfig({open:false}); showToast("Removido."); } })} /> 
            : <ListView shifts={filteredShiftsForScale} onTogglePaid={(id, paid) => { setShifts(shifts.map(s => s.id === id ? {...s, paid} : s)); showToast("Estado atualizado!"); }} onDeleteRequest={(s) => setAlertConfig({ open: true, title: "Remover", description: `Remover permanentemente?`, onConfirm: () => { setShifts(shifts.filter(x => x.id !== s.id)); setAlertConfig({open:false}); showToast("Removido."); } })} shiftTypes={shiftTypes} />
          }
        </div>
      );
      case 'Finance': return <FinanceView shifts={shifts} doctors={doctors} hospitals={hospitals} currentMonth={currentMonth} currentYear={currentYear} showToast={showToast} globalDiscounts={globalDiscounts} shiftTypes={shiftTypes} />;
      case 'Payments': return <PaymentsView shifts={shifts} doctors={doctors} hospitals={hospitals} showToast={showToast} globalDiscounts={globalDiscounts} shiftTypes={shiftTypes} />;
      case 'Doctors': return <DoctorsView doctors={doctors} onAddDoctor={(d) => { setDoctors([...doctors, d]); showToast("Médico registado!"); }} onImportMassive={(list) => { setDoctors([...doctors, ...list]); showToast("Equipa importada!"); }} onDeleteDoctor={(d) => setAlertConfig({open:true, title:"Excluir", description:`Remover permanentemente ${d.name}?`, onConfirm: () => { setDoctors(doctors.filter(x => x.id !== d.id)); setAlertConfig({open:false}); showToast("Médico removido."); } })} showToast={showToast} />;
      case 'Hospitals': return <HospitalsView hospitals={hospitals} onAddHospital={(h) => { setHospitals([...hospitals, h]); showToast("Unidade salva!"); }} onDeleteHospital={(h) => setAlertConfig({open:true, title:"Excluir", description:`Remover ${h.name}?`, onConfirm: () => { setHospitals(hospitals.filter(x => x.id !== h.id)); setAlertConfig({open:false}); showToast("Removido."); } })} showToast={showToast} />;
      case 'Settings': return <SettingsView showToast={showToast} onSaveConfig={(c) => { setConfig(c); showToast("Tabela salva!"); }} initialConfig={config} onSaveDiscounts={(d) => { setGlobalDiscounts(d); showToast("Regras salvas!"); }} initialDiscounts={globalDiscounts} onSaveShiftTypes={(st) => { setShiftTypes(st); showToast("Protocolos sincronizados!"); }} initialShiftTypes={shiftTypes} onUninstallClick={() => setAlertConfig({ open: true, title: "Reset Sistémico", description: "Apagar toda a memória local?", onConfirm: () => window.location.reload() })} />;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'dark bg-[#0a0a0a] text-zinc-50' : 'bg-[#fcfcfc] text-zinc-900'}`}>
      <header className="bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-[400] h-20 shadow-xl font-black italic italic font-black font-black">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between font-black italic font-black italic">
          <div className="flex items-center gap-10 font-black italic font-black italic">
            <div className="flex items-center gap-4 cursor-pointer font-black italic font-black italic" onClick={() => setCurrentPage('Shifts')}>
              <div className="bg-zinc-950 dark:bg-white p-3 rounded-[1.25rem] text-white dark:text-zinc-950 shadow-2xl hover:rotate-6 transition-transform font-black italic font-black italic"><Hospital size={24} className="font-black italic font-black italic" /></div>
              <h1 className="font-black text-xl hidden sm:block tracking-tighter uppercase font-black italic font-black italic">REFUA PLUS</h1>
            </div>
            <nav className="hidden lg:flex gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-inner font-black italic uppercase text-[9px] font-black italic">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all italic font-black font-black italic ${currentPage === item.id ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xl scale-105 font-black italic font-black italic' : 'text-zinc-500 hover:text-zinc-100 font-black italic font-black italic'}`}>
                  <item.icon size={18} className={currentPage === item.id ? 'text-blue-400 font-black italic font-black italic' : 'font-black italic font-black italic'} />
                  <span className="text-xs font-black uppercase tracking-tighter italic font-black font-black italic">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 italic font-black font-black italic font-black italic">
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all shadow-sm font-black italic font-black italic font-black italic">{darkMode ? <Sun size={20} className="text-yellow-400 font-black italic font-black italic" /> : <Moon size={20} className="text-zinc-400 font-black italic font-black italic" />}</button>
            <Card variant="bento" className="flex items-center p-1.5 border-zinc-200 dark:border-zinc-800 shadow-sm italic font-black font-black italic font-black italic font-black font-black italic">
              <button onClick={() => { let m = currentMonth - 1; if(m<0){ m=11; setCurrentYear(y=>y-1); } setCurrentMonth(m); }} className="p-2.5 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all italic font-black font-black italic"><ChevronLeft size={18} className="font-black italic font-black italic" /></button>
              <span className="px-6 text-[10px] font-black uppercase tracking-[0.2em] dark:text-white min-w-[180px] text-center italic font-black font-black italic font-black italic">{monthNames[currentMonth]} {currentYear}</span>
              <button onClick={() => { let m = currentMonth + 1; if(m>11){ m=0; setCurrentYear(y=>y+1); } setCurrentMonth(m); }} className="p-2.5 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all italic font-black font-black italic"><ChevronRight size={18} className="font-black italic font-black italic" /></button>
            </Card>
            <div className="w-10 h-10 rounded-[1.25rem] bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-black text-sm uppercase border-2 border-white dark:border-zinc-800 shadow-2xl italic font-black font-black italic font-black italic font-black">CS</div>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 py-12 pb-40 font-black italic font-black font-black italic font-black font-black italic">{renderContent()}</main>
      <Toast notification={toast} onClose={() => setToast(null)} />
      <CustomAlertDialog isOpen={alertConfig.open} title={alertConfig.title} description={alertConfig.description} onConfirm={alertConfig.onConfirm} onCancel={() => setAlertConfig({ ...alertConfig, open: false })} />
      {isModalOpen && <ShiftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(s) => { setShifts([...shifts, s]); showToast("Lançamento concluído!"); }} doctors={doctors} hospitals={hospitals} initialDate={selectedDate} shiftTypes={shiftTypes} />}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border border-white/20 dark:border-zinc-800 p-3 flex justify-around gap-4 z-[400] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] w-[90%] italic font-black font-black italic font-black font-black italic">
        {navItems.map(item => (<button key={item.id} onClick={() => setCurrentPage(item.id)} className={`flex flex-col items-center p-4 rounded-[1.5rem] transition-all italic ${currentPage === item.id ? 'text-white bg-zinc-950 shadow-2xl scale-110 font-black italic' : 'text-zinc-400 font-black italic'}`}><item.icon size={22} className="font-black italic" /></button>))}
      </div>
    </div>
  );
}
