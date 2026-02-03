import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Calendar as CalendarIcon, Users, Hospital, DollarSign, Settings, Plus, Search, 
  ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, X, Trash2, 
  Download, Filter, Info, UserPlus, LayoutList, CalendarDays, Save, 
  Calculator, ChevronDown, ShieldCheck, CreditCard, UserCog, AlertTriangle, 
  CheckCircle, FileSpreadsheet, RefreshCw, MinusCircle, Zap, Mail, Upload, 
  Moon, Sun, Lock, Stethoscope, TrendingUp, Award, FileText, Printer, 
  FileUp, Coins, Percent, Banknote, Database, Wallet, ArrowRightLeft, 
  Layers, CalendarRange, LayoutDashboard, PieChart, ClipboardList, 
  TrendingDown, ArrowUpRight, CheckSquare, Square
} from 'lucide-react';

// --- 1. CONSTANTES E DADOS INICIAIS ---
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const specialties = ["CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "GASTROENTEROLOGIA", "CIRURGIA DIGESTIVA", "OUTRA"];

const INITIAL_DOCTORS = [
  { id: '1', name: 'DR. CLÁUDIO SILVA', specialty: 'CIRURGIA GERAL', status: 'Ativo' },
  { id: '2', name: 'DRA. ANA MARTINS', specialty: 'PEDIATRIA', status: 'Ativo' }
];

const INITIAL_HOSPITALS = [
  { id: '1', name: 'HOSPITAL SÃO SEBASTIÃO', city: 'SÃO SEBASTIÃO - SP' },
  { id: '2', name: 'CLÍNICA SÃO JOSÉ', city: 'PORTO' }
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
    return acc + (currentPrice !== undefined ? currentPrice : (Number(s.grossValue) || 0));
  }, 0);
  let totalRetencao = 0;
  globalDiscounts.forEach(d => {
    const val = Number(d.value) || 0;
    if (d.type === 'percentage') totalRetencao += (totalBruto * (val / 100));
    else if (d.type === 'currency') totalRetencao += val;
  });
  return { bruto: totalBruto, retencao: totalRetencao, liquido: Math.max(0, totalBruto - totalRetencao) };
}

function getPaymentInfo(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return { month: 0, year: 0, label: "N/A" };
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 20);
  return { month: nextMonth.getMonth(), year: nextMonth.getFullYear(), label: `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}` };
}

// --- 3. COMPONENTES DE UI ---

function Card({ children, className = "", variant = 'default' }) {
  const styles = {
    default: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm',
    glass: 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800 shadow-2xl',
    bento: 'bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-inner'
  };
  return <div className={`${styles[variant]} rounded-[2rem] overflow-hidden transition-all ${className}`}>{children}</div>;
}

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

function Badge({ children, variant = 'default' }) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    default: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
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
  return (
    <div role="alert" className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 rounded-2xl shadow-2xl bg-zinc-900 text-white flex items-center gap-4 animate-in slide-in-from-top duration-500 font-bold italic border border-white/10">
      <div className="p-2 rounded-full bg-zinc-800"><Zap size={18} className="text-yellow-400" /></div>
      <span className="text-xs uppercase tracking-tight">{messageText}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
    </div>
  );
}

function CustomAlertDialog({ isOpen, title, description, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-sm p-8 text-center shadow-2xl animate-in zoom-in-95 font-bold italic">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-black uppercase dark:text-white">{title}</h3>
        <p className="text-sm text-zinc-500 mt-2">{description}</p>
        <div className="flex gap-4 mt-8">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-black uppercase text-zinc-400 border rounded-xl hover:bg-zinc-50 transition-all">CANCELAR</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-xs font-black uppercase text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-all">CONFIRMAR</button>
        </div>
      </Card>
    </div>
  );
}

function DoctorPayslip({ doctor, shifts, currentMonth, currentYear, isApproved, globalDiscounts, shiftTypes }) {
  const finance = useMemo(() => calculateAggregateFinance(shifts, globalDiscounts, shiftTypes), [shifts, globalDiscounts, shiftTypes]);
  return (
    <Card className="p-8 italic mt-6 font-black animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-zinc-800">
        <h3 className="text-xl uppercase tracking-tighter italic">Resumo Financeiro: {doctor.name}</h3>
        <Badge variant={isApproved ? 'success' : 'warning'}>{isApproved ? 'AUDITADO' : 'PRÉVIA'}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center font-black italic">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl"><p className="text-[10px] text-zinc-400 uppercase tracking-widest">Bruto Sinc.</p>R$ {finance.bruto.toLocaleString('pt-BR')}</div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-rose-500"><p className="text-[10px] text-zinc-400 uppercase tracking-widest">Retenções</p>R$ {finance.retencao.toLocaleString('pt-BR')}</div>
        <div className="p-4 bg-zinc-950 text-white rounded-2xl scale-105 shadow-xl"><p className="text-[10px] opacity-60 uppercase tracking-widest">Líquido Final</p>R$ {finance.liquido.toLocaleString('pt-BR')}</div>
      </div>
    </Card>
  );
}

// --- 4. COMPONENTES DE VISTA ---

function ScaleFilterBar({ filters, setFilters, doctors, hospitals }) {
  return (
    <Card variant="bento" className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 italic font-bold">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Especialista</label>
        <select value={filters.doctor} onChange={e => setFilters({...filters, doctor: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl text-xs outline-none italic font-black">
          <option value="TODOS">Todos os Médicos</option>
          {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Hospital size={12}/> Unidade</label>
        <select value={filters.hospital} onChange={e => setFilters({...filters, hospital: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl text-xs outline-none italic font-black">
          <option value="TODOS">Todas as Unidades</option>
          {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Setor</label>
        <select value={filters.specialty} onChange={e => setFilters({...filters, specialty: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl text-xs outline-none italic font-black">
          <option value="TODOS">Todas Especialidades</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><CalendarRange size={12}/> Semana</label>
        <select value={filters.week} onChange={e => setFilters({...filters, week: e.target.value})} className="w-full p-3 bg-white dark:bg-zinc-800 border-none rounded-2xl text-xs outline-none italic font-black">
          <option value="TODAS">Mês Inteiro</option>
          {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
        </select>
      </div>
    </Card>
  );
}

function ListView({ shifts, onTogglePaid, onDeleteRequest, onDeleteBulk, shiftTypes }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const handleSelectAll = (e) => setSelectedIds(e.target.checked ? shifts.map(s => s.id) : []);
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <Card className="overflow-hidden italic font-black">
      <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 rounded accent-zinc-950 cursor-pointer" checked={selectedIds.length === shifts.length && shifts.length > 0} onChange={handleSelectAll} />
          <span className="text-[10px] uppercase text-zinc-400 tracking-widest font-black">{selectedIds.length} registos selecionados</span>
        </div>
        {selectedIds.length > 0 && (
          <Button variant="danger" onClick={() => { onDeleteBulk(selectedIds); setSelectedIds([]); }} className="h-9 px-4 rounded-xl animate-in fade-in slide-in-from-right-4">
            <Trash2 size={16}/> Purga em Bloco
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] uppercase text-zinc-400 tracking-widest font-black border-b dark:border-zinc-800 italic">
            <tr>
              <th className="px-6 py-5 w-12 text-center">#</th>
              <th className="px-6 py-5">Data Operacional</th>
              <th className="px-6 py-5">Profissional / Unidade</th>
              <th className="px-6 py-5 text-right">Bruto Sinc.</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {shifts.map(s => {
              const currentPrice = shiftTypes.find(t => t.label === s.type)?.value || s.grossValue;
              const isSelected = selectedIds.includes(s.id);
              return (
                <tr key={s.id} className={`transition-colors italic ${isSelected ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50/50'}`}>
                  <td className="px-6 py-5 text-center"><input type="checkbox" className="w-4 h-4 rounded accent-zinc-950 cursor-pointer" checked={isSelected} onChange={() => toggleSelect(s.id)} /></td>
                  <td className="px-6 py-5 text-zinc-400 font-bold">{formatDisplayDate(s.date)}</td>
                  <td className="px-6 py-5 font-black uppercase tracking-tighter"><div>{s.doctorName}</div><div className="text-[9px] text-zinc-400 font-bold">{s.unit}</div></td>
                  <td className="px-6 py-5 text-right font-black italic text-zinc-900 dark:text-zinc-100">R$ {currentPrice.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-5 text-center italic"><button onClick={() => onTogglePaid(s.id, !s.paid)} className={`px-4 py-1.5 rounded-full text-[9px] font-black border transition-all ${s.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.paid ? 'PAGO' : 'PENDENTE'}</button></td>
                  <td className="px-6 py-5 text-right italic"><button onClick={() => onDeleteRequest(s)} className="text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shifts.length === 0 && <div className="py-24 text-center opacity-20 italic tracking-[0.5em] font-black uppercase">Consola Operacional Vazia</div>}
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
                <span className={`text-xs font-black ${item.day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? 'text-blue-500 font-black scale-125 inline-block' : 'text-zinc-300'}`}>{item.day}</span>
                <div className="mt-4 space-y-2">
                  {item.shifts.map(s => (
                    <div key={s.id} className="relative">
                      <div onClick={() => setActiveTooltip(s.id)} className={`text-[10px] p-2 rounded-xl font-black truncate cursor-pointer border shadow-sm transition-all active:scale-95 italic ${s.paid ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'}`}>{s.doctorName.split(' ').pop()}</div>
                      {activeTooltip === s.id && (
                        <div className="absolute z-[100] top-0 left-full ml-4 w-56 bg-zinc-950/95 backdrop-blur-xl text-white p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 border border-white/10 italic">
                          <div className="flex justify-between items-start mb-4"><Badge variant="success">Ficha</Badge><button onClick={() => setActiveTooltip(null)}><X size={16} /></button></div>
                          <p className="text-sm font-black uppercase leading-tight italic">{s.doctorName}</p>
                          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest font-black">{s.unit}</p>
                          <div className="mt-4 pt-4 border-t border-white/10 font-black italic">
                            <p className="text-[10px] text-blue-400 uppercase italic">{s.type}</p>
                            <p className="text-xs mt-1">R$ {(shiftTypes.find(t => t.label === s.type)?.value || s.grossValue).toLocaleString('pt-BR')}</p>
                          </div>
                          <button onClick={() => { setActiveTooltip(null); onDeleteRequest(s); }} className="w-full mt-6 py-3 bg-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Anular</button>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card variant="glass" className="col-span-2 p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative group font-black shadow-2xl">
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
      <Card className="w-full max-w-xl p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 italic font-bold">
        <div className="flex justify-between items-center mb-10 font-black tracking-tighter italic font-black font-black"><h3 className="text-3xl uppercase dark:text-zinc-50 italic font-black font-black">Lançamento Operacional</h3><button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full transition-all italic font-black font-black font-black"><X size={28} /></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...newShift, id: Date.now().toString() }); onClose(); }} className="space-y-6 italic font-black font-black font-black">
          <div className="grid grid-cols-2 gap-6 italic font-black font-black">
            <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black">Data Operacional</label><input type="date" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner italic font-black outline-none" required /></div>
            <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black">Setor</label><select required value={newShift.specialty} onChange={e => setNewShift({...newShift, specialty: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner italic font-black outline-none">{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black font-black">Hospital Parceiro</label><select required value={newShift.unit} onChange={e => setNewShift({ ...newShift, unit: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner uppercase italic font-black outline-none"><option value="">ESCOLHA A UNIDADE...</option>{hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}</select></div>
          <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black font-black">Especialista Responsável</label><select required value={newShift.doctorName} onChange={e => setNewShift({ ...newShift, doctorName: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner uppercase italic font-black outline-none"><option value="">ESCOLHA O MÉDICO...</option>{doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-6 italic font-black font-black font-black font-black">
            <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black font-black font-black">Regime / Horas</label><select required value={newShift.type} onChange={e => setNewShift({...newShift, type: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner italic font-black outline-none"><option value="">SELECIONE...</option>{shiftTypes.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic font-black font-black font-black font-black">Bruto Operacional (R$)</label><input type="number" value={newShift.grossValue} onChange={e => setNewShift({...newShift, grossValue: Number(e.target.value)})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-[1.5rem] font-black shadow-inner italic font-black font-black font-black outline-none" required /></div>
          </div>
          <button className="w-full h-20 bg-zinc-950 text-white uppercase font-black tracking-[0.4em] shadow-xl rounded-[1.5rem] mt-6 hover:bg-zinc-800 transition-all font-black italic font-black font-black font-black">Validar Lançamento</button>
        </form>
      </Card>
    </div>
  );
}

// --- 5. COMPONENTE PRINCIPAL (APP) ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('Shifts');
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(true);
  const [shiftTypes, setShiftTypes] = useState(INITIAL_SHIFT_TYPES);
  const [globalDiscounts, setGlobalDiscounts] = useState([{ id: '1', label: 'ISS/ADM', value: 15, type: 'percentage' }]);
  
  const [shifts, setShifts] = useState([]);
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [toast, setToast] = useState(null);
  const [alert, setAlert] = useState({ open: false, title: '', description: '', onConfirm: () => {} });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({ doctor: 'TODOS', hospital: 'TODOS', specialty: 'TODOS', week: 'TODAS' });

  const shiftImportRef = useRef(null);

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  const showToast = useCallback((text) => setToast({ text }), []);

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
        return { id: `imp-${Date.now()}-${idx}`, date: date || new Date().toISOString().split('T')[0], unit: parts[1]?.toUpperCase() || 'UNIDADE', doctorName: parts[2]?.toUpperCase() || 'MÉDICO', specialty: parts[3]?.toUpperCase() || 'GERAL', type: parts[4] || '12h', grossValue: grossValue, paid: parts[7]?.toLowerCase().includes('pago') || false };
      });
      if (imported.length > 0) {
        setShifts(prev => [...prev, ...imported]);
        showToast(`${imported.length} plantões sincronizados!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navItems = [
    { id: 'Shifts', label: 'Escalas', icon: LayoutDashboard },
    { id: 'Finance', label: 'Auditoria', icon: ShieldCheck },
    { id: 'Doctors', label: 'Equipa', icon: Stethoscope },
    { id: 'Hospitals', label: 'Unidades', icon: Hospital },
    { id: 'Settings', label: 'Ajustes', icon: UserCog },
  ];

  const renderContent = () => {
    switch(currentPage) {
      case 'Shifts': return (
        <div className="space-y-8 animate-in fade-in italic font-black font-black">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 italic font-black">
            <div className="font-black italic"><h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic">Operações</h2><p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic font-black font-black">Logística Operacional REFUA PLUS</p></div>
            <div className="flex flex-wrap gap-3 italic font-black font-black">
              <input type="file" ref={shiftImportRef} className="hidden italic font-black font-black" accept=".csv" onChange={handleImportShiftsMassive} />
              <Button variant="outline" onClick={() => shiftImportRef.current.click()} className="italic font-black font-black italic"><FileUp size={16} className="font-black italic" /> IMPORTAR CSV</Button>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-[1.2rem] border dark:border-zinc-800 shadow-inner italic font-black font-black font-black">
                <button onClick={() => setViewMode('calendar')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-zinc-950 text-white shadow-xl font-black italic font-black' : 'text-zinc-400 font-black italic font-black'}`}><CalendarDays size={18} className="font-black italic" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-950 text-white shadow-xl font-black italic font-black' : 'text-zinc-400 font-black italic font-black'}`}><LayoutList size={18} className="font-black italic" /></button>
              </div>
              <button onClick={() => { setSelectedDate(null); setIsModalOpen(true); }} className="bg-blue-600 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-2xl transition-all font-black font-black font-black"><Plus size={24} className="font-black italic" /></button>
            </div>
          </div>
          <ScaleFilterBar filters={filters} setFilters={setFilters} doctors={doctors} hospitals={hospitals} />
          {viewMode === 'calendar' 
            ? <CalendarView shifts={shifts.filter(s => {
                const d = new Date(s.date + 'T00:00:00');
                if (d.getMonth() !== currentMonth) return false;
                if (filters.doctor !== 'TODOS' && normalizeMedicalName(s.doctorName) !== normalizeMedicalName(filters.doctor)) return false;
                if (filters.hospital !== 'TODOS' && s.unit !== filters.hospital) return false;
                return true;
              })} currentMonth={currentMonth} currentYear={currentYear} shiftTypes={shiftTypes} onAddClick={(date) => { setSelectedDate(date); setIsModalOpen(true); }} onDeleteRequest={(s) => setAlert({ open: true, title: 'Eliminar', description: `Anular plantão de ${s.doctorName}?`, onConfirm: () => { setShifts(prev => prev.filter(x => x.id !== s.id)); setAlert({open:false}); showToast("Registo removido."); } })} /> 
            : <ListView 
                shifts={shifts.filter(s => {
                  const d = new Date(s.date + 'T00:00:00');
                  if (d.getMonth() !== currentMonth) return false;
                  if (filters.doctor !== 'TODOS' && normalizeMedicalName(s.doctorName) !== normalizeMedicalName(filters.doctor)) return false;
                  if (filters.hospital !== 'TODOS' && s.unit !== filters.hospital) return false;
                  if (filters.specialty !== 'TODOS' && s.specialty !== filters.specialty) return false;
                  if (filters.week !== 'TODAS' && getWeekOfMonth(s.date) !== Number(filters.week)) return false;
                  return true;
                })} 
                onTogglePaid={(id, paid) => setShifts(prev => prev.map(s => s.id === id ? {...s, paid} : s))}
                onDeleteRequest={(s) => setAlert({ open: true, title: 'Eliminar', description: `Remover plantão de ${s.doctorName}?`, onConfirm: () => { setShifts(prev => prev.filter(x => x.id !== s.id)); setAlert({open:false}); showToast("Registo removido."); } })}
                onDeleteBulk={(ids) => { setShifts(prev => prev.filter(s => !ids.includes(s.id))); showToast(`${ids.length} registos removidos.`); }}
                shiftTypes={shiftTypes}
              />
          }
        </div>
      );
      case 'Finance': return <FinanceView shifts={shifts} doctors={doctors} hospitals={hospitals} currentMonth={currentMonth} currentYear={currentYear} showToast={showToast} globalDiscounts={globalDiscounts} shiftTypes={shiftTypes} />;
      case 'Doctors': return <div className="p-20 text-center italic font-black opacity-30 uppercase tracking-[0.5em] font-black">Módulo de Equipa em Manutenção</div>;
      case 'Hospitals': return <div className="p-20 text-center italic font-black opacity-30 uppercase tracking-[0.5em] font-black">Módulo de Unidades em Manutenção</div>;
      case 'Settings': return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in italic font-black font-black italic">
          <Card className="p-10 shadow-2xl font-black italic">
            <h3 className="text-2xl font-black uppercase mb-8 italic">Tabela de Preços Sincronizada</h3>
            <div className="space-y-4 font-black italic">
              {shiftTypes.map(t => (
                <div key={t.id} className="flex justify-between items-center p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700 italic">
                  <span className="font-black uppercase tracking-widest">{t.label}</span>
                  <span className="text-blue-500 font-black">R$ {t.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-10 h-16 uppercase font-black italic tracking-[0.3em]" onClick={() => showToast("Configurações preservadas.")}>Sincronizar Protocolos</Button>
          </Card>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-[#fcfcfc] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-50 transition-all font-black`}>
      <header className="bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-[400] h-20 flex items-center justify-between px-8 shadow-xl italic font-black">
        <div className="flex items-center gap-10 font-black italic">
            <div className="flex items-center gap-4 cursor-pointer font-black italic" onClick={() => setCurrentPage('Shifts')}>
                <div className="bg-zinc-950 dark:bg-white p-2.5 rounded-2xl text-white dark:text-zinc-950 shadow-2xl hover:rotate-6 transition-transform font-black italic"><Hospital size={22} className="font-black italic" /></div>
                <h1 className="font-black text-xl tracking-tighter uppercase italic hidden sm:block font-black italic">REFUA PLUS</h1>
            </div>
            <nav className="flex gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border dark:border-zinc-800 shadow-inner italic font-black uppercase text-[9px] font-black italic">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`px-5 py-2.5 rounded-xl transition-all font-black italic ${currentPage === item.id ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xl scale-105' : 'text-zinc-500 hover:text-zinc-700'}`}>
                      <span className="flex items-center gap-2"><item.icon size={14}/> {item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
        <div className="flex items-center gap-4 italic font-black">
           <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm hover:scale-110 transition-all font-black italic">{darkMode ? <Sun size={18} className="text-yellow-400 font-black italic"/> : <Moon size={18} className="font-black italic"/>}</button>
           <div className="flex items-center p-1.5 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl shadow-inner italic font-black text-[10px] border dark:border-zinc-800 font-black italic">
              <button onClick={() => { let m = currentMonth - 1; if(m<0){m=11; setCurrentYear(y=>y-1);} setCurrentMonth(m); }} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all font-black italic"><ChevronLeft size={14} className="font-black italic"/></button>
              <span className="px-4 min-w-[140px] text-center uppercase tracking-widest font-black italic">{monthNames[currentMonth]} {currentYear}</span>
              <button onClick={() => { let m = currentMonth + 1; if(m>11){m=0; setCurrentYear(y=>y+1);} setCurrentMonth(m); }} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all font-black italic"><ChevronRight size={14} className="font-black italic"/></button>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-black text-xs border-2 border-white dark:border-zinc-800 shadow-xl font-black italic">CS</div>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto p-12 pb-40 font-black italic font-black italic">{renderContent()}</main>
      <Toast notification={toast} onClose={() => setToast(null)} />
      <CustomAlertDialog isOpen={alert.open} title={alert.title} description={alert.description} onConfirm={alert.onConfirm} onCancel={() => setAlert({ ...alert, open: false })} />
      {isModalOpen && <ShiftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(s) => { setShifts(prev => [...prev, s]); showToast("Registo consolidado."); }} doctors={doctors} hospitals={hospitals} initialDate={selectedDate} shiftTypes={shiftTypes} />}
    </div>
  );
}