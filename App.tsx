
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  GraduationCap, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  BrainCircuit,
  Save,
  Menu,
  X,
  FileText,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Student, Assessment, ClassData, ViewType, Grade } from './types';
import { generateStudentComment, analyzeClassPerformance } from './geminiService';

// Logo ENS SVG Placeholder (Based on the image provided)
const ENSLogo = () => (
  <div className="relative w-12 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-sm">
    <div className="absolute inset-0 flex items-center justify-center">
       <span className="text-white font-black text-[10px] tracking-tighter leading-none">ENS</span>
    </div>
    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white/30 rounded-full opacity-50"></div>
  </div>
);

const generateIvorianStudents = (): Student[] => {
  const firstNames = [
    "Ahmed", "Koffi", "Kouassi", "Amadou", "Fatoumata", "Aminata", "Jean", "Marie", "Kouakou", "Mariam", 
    "Moussa", "Sékou", "Sidiki", "Tidiane", "Yasmine", "Awa", "Bakary", "Djénéba", "Issa", "Lamine",
    "Oumar", "Salif", "Zoumana", "Affou", "Bintou", "Fanta", "Hassan", "Ibrahim", "Kadidia", "Maimouna",
    "N'Goran", "Ousmane", "Rokiatou", "Souleymane", "Tenin", "Yacouba", "Adama", "Balla", "Cheick", "Drissa",
    "Ehouman", "Fodé", "Gnima", "Habibou", "Inza", "Jérôme", "Konan", "Lassina", "Modibo", "Nanourou"
  ];
  const lastNames = [
    "Kouassi", "Koné", "Traoré", "Bakayoko", "Bamba", "Coulibaly", "Diallo", "Diomandé", "Gbon", "Ouattara", 
    "Sylla", "Touré", "Yao", "Yapi", "Achi", "Bedié", "Cissé", "Dibi", "Essis", "Fofana",
    "Gnahoré", "Hien", "Iriri", "Kaboré", "Lath", "Meité", "N'Guessan", "Oulaï", "Poyé", "Savané",
    "Tanoh", "Uka", "Vangah", "Wognin", "Xery", "Yoboué", "Zadi", "Ahoussi", "Brou", "Doffou",
    "Esmel", "Gnaba", "Houphouët", "Ismaël", "Kassi", "Loho", "M'Bahia", "N'Dri", "Obrou", "Sery"
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const fIdx = i % firstNames.length;
    const lIdx = (i * 7) % lastNames.length;
    return {
      id: (i + 1).toString(),
      firstName: firstNames[fIdx],
      lastName: lastNames[lIdx],
      gender: i % 2 === 0 ? 'M' : 'F',
      grades: [
        { assessmentId: 'a1', value: Math.floor(Math.random() * 12) + 8, coefficient: 1 },
        { assessmentId: 'a2', value: Math.floor(Math.random() * 10) + 10, coefficient: 2 }
      ]
    };
  });
};

const INITIAL_CLASS: ClassData = {
  id: '3eme-ens',
  name: '3ème ENS - Ivoire',
  students: generateIvorianStudents(),
  assessments: [
    { id: 'a1', title: 'Interrogation Math', date: '2024-03-01', coefficient: 1, maxScore: 20 },
    { id: 'a2', title: 'Composition Français', date: '2024-03-15', coefficient: 2, maxScore: 20 },
  ]
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [classData, setClassData] = useState<ClassData>(() => {
    const saved = localStorage.getItem('prof_bakayoko_data');
    return saved ? JSON.parse(saved) : INITIAL_CLASS;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem('prof_bakayoko_data', JSON.stringify(classData));
  }, [classData]);

  const classStats = useMemo(() => {
    const allAverages = classData.students.map(s => {
      if (s.grades.length === 0) return 0;
      const totalPoints = s.grades.reduce((acc, g) => acc + (g.value * g.coefficient), 0);
      const totalCoeff = s.grades.reduce((acc, g) => acc + g.coefficient, 0);
      return totalPoints / totalCoeff;
    });
    const average = allAverages.length > 0 ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length : 0;
    const strugglingCount = allAverages.filter(a => a < 10).length;
    return { average, studentCount: classData.students.length, strugglingCount };
  }, [classData]);

  const chartData = useMemo(() => {
    return classData.students.slice(0, 10).map(s => ({
      name: s.firstName,
      moyenne: parseFloat((s.grades.reduce((a, b) => a + b.value, 0) / (s.grades.length || 1)).toFixed(2))
    }));
  }, [classData]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const updateGrade = (studentId: string, assessmentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;
    setClassData(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const newGrades = [...s.grades];
        const idx = newGrades.findIndex(g => g.assessmentId === assessmentId);
        const gradeObj = { assessmentId, value: numValue, coefficient: prev.assessments.find(a => a.id === assessmentId)?.coefficient || 1 };
        if (idx > -1) newGrades[idx] = gradeObj; else newGrades.push(gradeObj);
        return { ...s, grades: newGrades };
      })
    }));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeClassPerformance(classData.students, classData.assessments);
    setAiAnalysis(result || "Analyse terminée.");
    setIsAnalyzing(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#1a2e21] text-white flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 flex flex-col gap-4 border-b border-white/5 bg-[#142319]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ENSLogo />
              <div className="flex flex-col">
                <h1 className="text-lg font-black tracking-tighter leading-none">PROF. BAKAYOKO</h1>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">ENS ABIDJAN</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} icon={<LayoutDashboard />} label="Tableau de Bord" />
          <SidebarLink active={activeView === 'students'} onClick={() => { setActiveView('students'); setIsSidebarOpen(false); }} icon={<Users />} label="Ma Classe" />
          <SidebarLink active={activeView === 'grades'} onClick={() => { setActiveView('grades'); setIsSidebarOpen(false); }} icon={<TrendingUp />} label="Cahier de Notes" />
          <SidebarLink active={activeView === 'ai-assistant'} onClick={() => { setActiveView('ai-assistant'); setIsSidebarOpen(false); }} icon={<Sparkles />} label="Assistant IA" />
        </nav>

        <div className="p-6 border-t border-white/5 bg-[#142319]">
          <div className="flex items-center gap-3 text-emerald-100/50 text-xs">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Session de {classData.name}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
          <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
             <ENSLogo />
             <span className="font-bold text-slate-800 text-sm">Prof. Bakayoko</span>
          </div>
          <button className="p-2 text-indigo-600">
             <Save className="w-5 h-5" />
          </button>
        </header>

        {/* Dynamic Desktop Header */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeView === 'dashboard' && "Surveillance Digitale"}
              {activeView === 'students' && "Effectif de Classe"}
              {activeView === 'grades' && "Cahier de Notes Numérique"}
              {activeView === 'ai-assistant' && "Assistant Bakayoko AI"}
            </h2>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <span className="text-slate-400 font-medium text-sm">Côte d'Ivoire • ENS</span>
          </div>
          <div className="flex gap-4">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none w-64" />
             </div>
             <button className="bg-[#1a2e21] hover:bg-[#254231] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/10">
                <Save className="w-4 h-4" /> Sauvegarder
             </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 space-y-6 lg:space-y-8">
          
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatCard label="Élèves" value={classStats.studentCount.toString()} icon={<Users />} color="bg-indigo-50 text-indigo-600" />
                <StatCard label="Moyenne" value={`${classStats.average.toFixed(2)}`} icon={<Award />} color="bg-emerald-50 text-emerald-600" />
                <StatCard label="Faiblesse" value={classStats.strugglingCount.toString()} icon={<AlertCircle />} color="bg-rose-50 text-rose-600" />
                <StatCard label="Statut" value="Actif" icon={<FileText />} color="bg-orange-50 text-orange-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 bg-white p-5 lg:p-7 rounded-[2rem] shadow-sm border border-slate-200">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Top Performances
                  </h3>
                  <div className="h-64 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="moyenne" radius={[8, 8, 0, 0]} barSize={32}>
                          {chartData.map((e, i) => (
                            <Cell key={i} fill={e.moyenne < 10 ? '#f43f5e' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 lg:p-7 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-500" /> Évaluations
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-80 lg:max-h-none">
                    {classData.assessments.map(a => (
                      <div key={a.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition">
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{a.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">{new Date(a.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <span className="text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-600">x{a.coefficient}</span>
                      </div>
                    ))}
                    <button onClick={() => alert('Nouvelle évaluation')} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Créer Devoir
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Students View */}
          {activeView === 'students' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                  <div className="flex flex-col">
                    <h3 className="font-black text-xl text-slate-800">Liste Nominaliste</h3>
                    <p className="text-xs text-slate-400 font-medium">{classData.students.length} élèves inscrits au registre</p>
                  </div>
                  <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
                    <Plus className="w-5 h-5" /> Inscrire un élève
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                     <tr>
                       <th className="px-6 py-5">Matricule</th>
                       <th className="px-6 py-5">Identité</th>
                       <th className="px-6 py-5 text-center">Genre</th>
                       <th className="px-6 py-5 text-center">Status</th>
                       <th className="px-6 py-5 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {classData.students.map((s, i) => (
                       <tr key={s.id} className="hover:bg-slate-50 transition group">
                         <td className="px-6 py-5 font-mono text-xs text-slate-400">#ENS-{s.id.padStart(3, '0')}</td>
                         <td className="px-6 py-5">
                            <p className="font-bold text-slate-900">{s.lastName} {s.firstName}</p>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <span className={`text-[10px] px-2 py-1 rounded-lg font-black ${s.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                              {s.gender}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[10px] font-bold text-slate-500">Présent</span>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-right">
                           <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition">
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* Grades View */}
          {activeView === 'grades' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
               <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                  <h3 className="font-black text-xl text-slate-800">Cahier de Composition</h3>
                  <div className="flex gap-3">
                    <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">Exporter Excel</button>
                  </div>
               </div>
               <div className="flex-1 overflow-auto relative">
                 <table className="w-full text-left min-w-[1000px] border-collapse">
                   <thead className="bg-slate-50/80 backdrop-blur text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-30 shadow-sm">
                     <tr>
                       <th className="px-6 py-6 border-r border-slate-100 sticky left-0 bg-slate-50 z-40 w-64 shadow-[2px_0_10px_rgba(0,0,0,0.03)]">Étudiant</th>
                       {classData.assessments.map(a => (
                         <th key={a.id} className="px-4 py-6 text-center border-r border-slate-100">
                           <span className="text-slate-800 block truncate max-w-[120px] mx-auto">{a.title}</span>
                           <span className="text-slate-300 block mt-1">Coeff {a.coefficient}</span>
                         </th>
                       ))}
                       <th className="px-6 py-6 text-center sticky right-0 bg-slate-50 z-40 shadow-[-2px_0_10px_rgba(0,0,0,0.03)]">Moyenne</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {classData.students.map(s => {
                       const totalW = s.grades.reduce((a, b) => a + (b.value * b.coefficient), 0);
                       const totalC = s.grades.reduce((a, b) => a + b.coefficient, 0) || 1;
                       const avg = totalW / totalC;
                       return (
                         <tr key={s.id} className="hover:bg-slate-50 transition group">
                           <td className="px-6 py-5 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.03)] truncate">
                             {s.lastName} {s.firstName}
                           </td>
                           {classData.assessments.map(a => {
                             const grade = s.grades.find(g => g.assessmentId === a.id);
                             return (
                               <td key={a.id} className="px-4 py-5 text-center border-r border-slate-50">
                                 <input 
                                   type="number"
                                   defaultValue={grade?.value ?? ''}
                                   onBlur={(e) => updateGrade(s.id, a.id, e.target.value)}
                                   className="w-16 h-11 bg-slate-50/50 border border-slate-100 rounded-xl text-center font-black text-indigo-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
                                   placeholder="--"
                                 />
                               </td>
                             );
                           })}
                           <td className="px-6 py-5 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-2px_0_10px_rgba(0,0,0,0.03)]">
                             <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-sm ${avg >= 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               {avg.toFixed(2)}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* AI Assistant View */}
          {activeView === 'ai-assistant' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-gradient-to-br from-[#1a2e21] to-[#2d4a37] p-8 lg:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-5 mb-8">
                        <div className="p-4 bg-emerald-500/20 rounded-[1.5rem] backdrop-blur shadow-lg border border-white/10">
                          <BrainCircuit className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black tracking-tight">Diagnostic Bakayoko IA</h3>
                          <p className="text-emerald-100/60 font-medium">Analyse complète des 50 élèves en temps réel.</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={runAnalysis}
                          disabled={isAnalyzing}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl shadow-emerald-900/40 disabled:opacity-50"
                        >
                          <Sparkles className="w-5 h-5" /> 
                          {isAnalyzing ? "Calcul..." : "Lancer l'Audit de Classe"}
                        </button>
                      </div>

                      {aiAnalysis && (
                        <div className="mt-10 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <h4 className="text-emerald-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                             <Sparkles className="w-4 h-4" /> Rapport Stratégique
                           </h4>
                           <div className="prose prose-invert max-w-none text-emerald-50/80 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                             {aiAnalysis}
                           </div>
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="bg-white p-6 lg:p-10 rounded-[3.5rem] shadow-sm border border-slate-200">
                    <h4 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-3">
                      <Users className="w-6 h-6 text-indigo-500" /> Appréciations Automatisées
                    </h4>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {classData.students.map(s => (
                        <StudentAiCard key={s.id} student={s} assessments={classData.assessments} />
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-orange-400" /> Remédiation
                  </h4>
                  <div className="space-y-3">
                    <AiAction label="Générer Exercices de Soutien" icon="🧬" />
                    <AiAction label="Planifier Groupes de Niveau" icon="👥" />
                    <AiAction label="Rédiger Bulletin Trimestriel" icon="📝" />
                    <AiAction label="Conseils de Méthodologie" icon="📚" />
                  </div>
                </div>

                <div className="bg-orange-50 p-8 rounded-[3rem] border border-orange-100">
                  <h4 className="font-black text-orange-900 mb-4 flex items-center gap-2 italic">
                    <AlertCircle className="w-5 h-5" /> Important
                  </h4>
                  <p className="text-xs text-orange-800/70 leading-relaxed font-bold">
                    Cette application est un outil d'accompagnement. La pédagogie du Professeur Bakayoko prime sur les algorithmes génératifs.
                  </p>
                  <div className="mt-6 pt-6 border-t border-orange-200 flex items-center gap-2 text-orange-900 font-black text-xs cursor-pointer hover:underline uppercase tracking-widest">
                    Support ENS Abidjan <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group
      ${active 
        ? 'bg-emerald-500 text-slate-900 shadow-xl shadow-emerald-950/20 translate-x-1' 
        : 'text-emerald-100/50 hover:bg-white/5 hover:text-white'
      }
    `}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {React.cloneElement(icon, { size: 20, strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:border-emerald-200 transition-all flex flex-col justify-between group">
    <div className={`w-10 h-10 lg:w-12 lg:h-12 ${color} rounded-[1rem] flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] lg:text-xs font-black uppercase tracking-widest">{label}</p>
      <h4 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">{value}</h4>
    </div>
  </div>
);

const AiAction: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <button className="w-full text-left p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100 hover:border-emerald-100 flex items-center gap-3">
    <span className="text-xl">{icon}</span>
    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{label}</span>
  </button>
);

const StudentAiCard: React.FC<{ student: Student; assessments: Assessment[] }> = ({ student, assessments }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const text = await generateStudentComment(student, assessments);
    setComment(text || '');
    setLoading(false);
  };

  return (
    <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 space-y-4 hover:bg-slate-100/30 transition group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs">
             {student.lastName[0]}{student.firstName[0]}
           </div>
           <div>
             <span className="text-[10px] text-slate-400 font-mono block">MATR: {student.id.padStart(4, '0')}</span>
             <span className="font-black text-slate-800 text-sm tracking-tight">{student.lastName} {student.firstName}</span>
           </div>
        </div>
        <button 
          onClick={generate}
          disabled={loading}
          className="bg-white border border-slate-200 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
        >
          {loading ? "Rédaction..." : "Générer"}
        </button>
      </div>
      {comment && (
        <div className="text-xs text-slate-600 bg-white p-5 rounded-2xl border border-emerald-100 italic shadow-sm leading-relaxed animate-in slide-in-from-top-2">
          "{comment}"
        </div>
      )}
    </div>
  );
};

export default App;
