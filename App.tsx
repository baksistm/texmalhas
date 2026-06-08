/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  User, 
  ExternalLink, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet,
  Building,
  Printer
} from "lucide-react";

// Custom official logo image URLs requested by the user
const logoSantaRosa = "https://i.imgur.com/ya8HpxW.png";
const logoTexMalha = "https://i.imgur.com/nEsT68j.png";

type AccessType = "santarosa" | "texmalha";

// Robust comma & semicolon-safe CSV parser for live client sheet rendering
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row: string[] = [];
    let cell = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        row.push(cell.trim().replace(/^"|"$/g, '')); // clean outer quotes if any
        cell = "";
      } else {
        cell += char;
      }
    }
    row.push(cell.trim().replace(/^"|"$/g, ''));
    
    // Check if row has some content before adding
    const hasContent = row.some(cellVal => cellVal !== "");
    if (hasContent) {
      result.push(row);
    }
  }
  return result;
}

export default function App() {
  const [selectedAccess, setSelectedAccess] = useState<AccessType>("santarosa");
  
  // Persist session state in sessionStorage
  const [loggedCompany, setLoggedCompany] = useState<AccessType | null>(() => {
    return (sessionStorage.getItem("loggedCompany") as AccessType | null) || null;
  });
  
  const [userName, setUserName] = useState<string | null>(() => {
    return sessionStorage.getItem("loggedUserName") || null;
  });

  // Print-related state variables
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isCsvLoading, setIsCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState("");

  // Action states
  const [password, setPassword] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Auto-refresh timer for TexMalha
  useEffect(() => {
    if (loggedCompany !== "texmalha") return;

    // Direct interval for F5
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 60000);

    // Visual countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [loggedCompany]);

  // Load the production data for printing (Lines 1-99)
  const fetchCsvData = (autoPrint = false) => {
    setIsCsvLoading(true);
    setCsvError("");
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTvRoGuxS_7-fV0gipL1S4n3TLgWkxpKmsDPVLcr7cKORSDy8mV8aXRhlXK5KONXxcEoj-hXPV1hlgu/pub?gid=1310694800&single=true&output=csv")
      .then((res) => {
        if (!res.ok) throw new Error("Erro de rede.");
        return res.text();
      })
      .then((text) => {
        const parsed = parseCSV(text);
        // Save first 99 parsed rows (Title lines + Data rows)
        setSheetRows(parsed.slice(0, 99));
        setIsCsvLoading(false);
        if (autoPrint) {
          setTimeout(() => {
            window.print();
          }, 150);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar dados para impressão:", err);
        setCsvError("Nossos servidores não conseguiram carregar os dados reais em tempo de execução. Tente carregar novamente.");
        setIsCsvLoading(false);
      });
  };

  useEffect(() => {
    if (loggedCompany === "texmalha") {
      fetchCsvData();
    }
  }, [loggedCompany]);

  const [santarosaError, setSantarosaError] = useState("");
  const [texmalhaError, setTexmalhaError] = useState("");

  const handleSantaRosaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSantarosaError("");
    setTexmalhaError("");
    if (password === "Str2026") {
      setLoggedCompany("santarosa");
      setUserName("Colaborador Santa Rosa");
      sessionStorage.setItem("loggedCompany", "santarosa");
      sessionStorage.setItem("loggedUserName", "Colaborador Santa Rosa");
      setPassword("");
    } else {
      setSantarosaError("Senha incorreta. Tente novamente.");
    }
  };

  const handleTexMalhaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSantarosaError("");
    setTexmalhaError("");
    if (nameInput.trim()) {
      const formattedName = nameInput.trim();
      setLoggedCompany("texmalha");
      setUserName(formattedName);
      sessionStorage.setItem("loggedCompany", "texmalha");
      sessionStorage.setItem("loggedUserName", formattedName);
      setNameInput("");
    } else {
      setTexmalhaError("Por favor, insira o seu nome para acessar.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("loggedCompany");
    sessionStorage.removeItem("loggedUserName");
    setLoggedCompany(null);
    setUserName(null);
    setSantarosaError("");
    setTexmalhaError("");
    setPassword("");
    setNameInput("");
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] grid-bg flex flex-col justify-between antialiased">
      {/* Dynamic Header - Logos must always be present */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 z-10 card-shadow relative">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Duo block (Company Logos must both be displayed as requested) */}
          <div className="flex items-center gap-4 sm:gap-8 bg-slate-50/50 p-2 px-3 sm:px-4 rounded-lg border border-slate-200">
            <a 
              href="https://www.santarosamalhas.com.br/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img 
                src={logoSantaRosa} 
                className="h-9 w-9 object-contain rounded-xs shadow-3xs" 
                alt="Logo Santa Rosa Malhas"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline text-slate-800 font-bold uppercase tracking-wider text-xs font-sans">Santa Rosa Malhas</span>
            </a>
            
            <div className="h-5 w-[1px] bg-slate-300"></div>
            
            <div className="flex items-center gap-2.5">
              <img 
                src={logoTexMalha} 
                className="h-9 w-9 object-contain rounded-xs shadow-3xs" 
                alt="Logo TexMalha"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline text-slate-800 font-bold uppercase tracking-wider text-xs font-sans">TexMalha</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {loggedCompany ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">Sessão Ativa</span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {loggedCompany === "santarosa" ? "Santa Rosa Malhas" : "TexMalha"}
                  </span>
                </div>
                
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg border border-red-100 transition-all cursor-pointer shadow-3xs"
                  aria-label="Sair do portal"
                >
                  <LogOut size={13} />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-mono">Portal de Acesso Industrial v2.0</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!loggedCompany ? (
            /* ==================================
               LOGIN PORTAL (SIDE-BY-SIDE GEOMETRIC BALANCE)
               ================================== */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-12 py-8"
            >
              {/* Santa Rosa Malhas Card */}
              <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl overflow-hidden card-shadow flex flex-col group hover:border-indigo-400 transition-all duration-300">
                <div className="h-2 bg-indigo-600"></div>
                
                <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em] font-mono">Unidade Administrativa</span>
                      <a 
                        href="https://www.santarosamalhas.com.br/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:opacity-80 transition-opacity"
                      >
                        <img 
                          src={logoSantaRosa} 
                          className="h-10 w-10 object-contain rounded-xs border border-slate-100 p-0.5 shadow-2xs cursor-pointer" 
                          alt="Logo Santa Rosa"
                        />
                      </a>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Santa Rosa Malhas</h2>
                    <p className="text-xs text-slate-400 font-medium font-mono mt-1">Insira a chave criptográfica corporativa de acesso.</p>
                    
                    <div className="divider my-6"></div>

                    {santarosaError && (
                      <div className="bg-red-50 text-red-800 p-3.5 rounded-lg text-xs font-semibold flex items-start gap-2 border border-red-100 mb-6">
                        <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                        <span>{santarosaError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSantaRosaLogin} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="password">
                          Senha de Acesso
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a senha"
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                            required
                          />
                        </div>
                      </div>

                      <button
                        id="btn-login-santarosa"
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-99 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        ENTRAR NO SISTEMA
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* TexMalha Card */}
              <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl overflow-hidden card-shadow flex flex-col group hover:border-slate-800 transition-all duration-300">
                <div className="h-2 bg-slate-800"></div>
                
                <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">Terminal de Operação</span>
                      <img 
                        src={logoTexMalha} 
                        className="h-10 w-10 object-contain rounded-xs border border-slate-100 p-0.5 shadow-2xs" 
                        alt="Logo TexMalha"
                      />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">TexMalha</h2>
                    <p className="text-xs text-slate-400 font-medium font-mono mt-1">Identifique-se com seu nome para iniciar.</p>

                    <div className="divider my-6"></div>

                    {texmalhaError && (
                      <div className="bg-red-50 text-red-800 p-3.5 rounded-lg text-xs font-semibold flex items-start gap-2 border border-red-100 mb-6">
                        <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                        <span>{texmalhaError}</span>
                      </div>
                    )}

                    <form onSubmit={handleTexMalhaLogin} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="nameInput">
                          Nome do Operador
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            id="nameInput"
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Insira seu nome completo"
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <button
                        id="btn-login-texmalha"
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-900 active:scale-99 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-100 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        INICIAR SESSÃO
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-7-7 4 4-4 4m-5-4h14"/></svg>
                      </button>
                    </form>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Atualização Automática (60s) Ativa</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : loggedCompany === "santarosa" ? (
            /* ==================================
               SANTA ROSA MALHAS HOME
               ================================== */
            <motion.div
              key="home-santarosa"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl overflow-hidden card-shadow flex flex-col hover:border-indigo-400 transition-colors duration-300"
            >
              <div className="h-2 bg-indigo-600"></div>
              
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="flex items-center justify-between w-full mb-6">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em] font-mono">Unidade Administrativa</span>
                  <a 
                    href="https://www.santarosamalhas.com.br/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={logoSantaRosa} 
                      className="h-10 w-10 object-contain rounded-xs border border-slate-100 p-0.5 shadow-2xs cursor-pointer" 
                      alt="Logo Santa Rosa"
                    />
                  </a>
                </div>

                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-center mb-6">
                  <a 
                    href="https://www.santarosamalhas.com.br/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:opacity-80 transition-opacity w-full h-full flex items-center justify-center"
                  >
                    <img 
                      src={logoSantaRosa} 
                      className="w-full h-full object-contain rounded-sm cursor-pointer" 
                      alt="Admin Logo"
                    />
                  </a>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-800 uppercase tracking-tight">Santa Rosa Malhas</h2>
                <p className="text-slate-400 text-xs font-mono tracking-wide mt-1">Controle Gerencial de Produção</p>
                
                <div className="divider w-full my-6"></div>

                <p className="text-slate-500 text-sm leading-relaxed max-w-md mb-8">
                  Acesse o ambiente oficial do Google Sheets de produção, controle de estoques e balanço de fios.
                </p>

                {/* Spreadsheet Redirection Box */}
                <div className="w-full max-w-lg bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex flex-col items-center">
                  <div className="flex items-center gap-2.5 text-slate-700 font-semibold mb-5 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-3xs text-xs uppercase tracking-wider font-mono">
                    <FileSpreadsheet className="text-emerald-600" size={16} />
                    <span>Planilha de Dados Gerais</span>
                  </div>

                  <a
                    id="link-santarosa-sheet"
                    href="https://docs.google.com/spreadsheets/d/10IPjl2wnwXEgwOtODQyvFLWac4gJfyBSnZsuCaN1BDs/edit?gid=1310694800#gid=1310694800"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-99 text-white font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-100 text-xs uppercase tracking-wider"
                  >
                    <ExternalLink size={14} />
                    <span>Abrir Planilha no Google Sheets</span>
                  </a>
                </div>

                <div className="flex gap-4">
                  <button
                    id="btn-logout-santarosa-back"
                    onClick={handleLogout}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg Transition-all cursor-pointer uppercase tracking-wider font-mono"
                  >
                    Voltar para Área de Acesso
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ==================================
               TEXMALHA HOME
               ================================== */
            <motion.div
              key="home-texmalha"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Header profile cards and counters */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-center">
                    <img 
                      src={logoTexMalha} 
                      className="w-full h-full object-contain rounded-xs" 
                      alt="Logo TexMalha"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center md:justify-start">
                      <span className="bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm font-mono">
                        TexMalha
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID de Sessão Ativa</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mt-1 uppercase tracking-tight">
                      Olá, <span className="text-slate-900">{userName}!</span>
                    </h2>
                  </div>
                </div>

                {/* Auto-update badge logic */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-slate-50 border border-slate-100 p-3 px-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Clock size={16} className="text-slate-800 animate-pulse" />
                    <span className="font-semibold text-xs uppercase tracking-wider text-slate-500 font-mono">Atualizando em:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-800 font-bold">
                      {countdown}s
                    </span>
                  </div>

                  <button
                    id="btn-manual-refresh"
                    onClick={handleManualRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-3xs cursor-pointer transition-all"
                    title="Forçar F5 manual"
                  >
                    <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                    <span>F5 Agora</span>
                  </button>
                </div>
              </div>

              {/* Embedding Google Sheet for TexMalha */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight uppercase tracking-tight">Painel de Monitoramento TexMalha</h3>
                      <p className="text-slate-400 text-xs font-medium">Exibição interativa da planilha integrada</p>
                    </div>
                  </div>

                  <button
                    id="btn-print-texmalha-range"
                    onClick={() => {
                      if (sheetRows.length === 0) {
                        fetchCsvData(true);
                      } else {
                        window.print();
                      }
                    }}
                    disabled={isCsvLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 active:scale-99 disabled:opacity-50 rounded-lg border border-slate-700 shadow-sm cursor-pointer transition-all uppercase tracking-wider font-sans self-start sm:self-auto"
                    title="Imprimir as linhas 1 até a linha 99 contendo os cabeçalhos, logos e seu nome de usuário"
                  >
                    {isCsvLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Printer size={14} />
                    )}
                    <span>{isCsvLoading ? "Carregando Dados..." : "IMPRIMIR RELATÓRIO"}</span>
                  </button>
                </div>

                {/* Google Sheet Live IFrame */}
                <div className="relative w-full bg-slate-100 h-[500px] md:h-[650px]">
                  {isIframeLoading && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-4 z-10">
                      <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin"></div>
                      <p className="text-sm font-semibold text-slate-500 animate-pulse">Sincronizando com os servidores de dados...</p>
                    </div>
                  )}
                  {/* Using standard preview sandbox for Sheets with widget=false and specified sheet tab */}
                  <iframe
                    id="iframe-texmalha-sheet"
                    className="w-full h-full border-0"
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTvRoGuxS_7-fV0gipL1S4n3TLgWkxpKmsDPVLcr7cKORSDy8mV8aXRhlXK5KONXxcEoj-hXPV1hlgu/pubhtml?gid=1310694800&amp;single=true"
                    title="Planilha de Dados Integrada TexMalha"
                    onLoad={() => setIsIframeLoading(false)}
                    referrerPolicy="no-referrer"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 sm:px-10 text-[10px] text-slate-400 font-mono uppercase tracking-wider relative z-10 shadow-inner">
        <div>© {new Date().getFullYear()} GRUPO SANTA ROSA</div>
      </footer>

      {/* 
        ========================================================================
        BEAUTIFUL PRINT TEMPLATE (ONLY VISIBLE IN MEDIA PRINT / HIDDEN IN SCREEN)
        ========================================================================
      */}
      <div id="print-area" className="p-8 font-sans">
        {/* Print Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={logoSantaRosa} alt="Santa Rosa Malhas" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-wider">GRUPO SANTA ROSA MALHAS</h1>
              <p className="text-[9px] text-slate-500 font-mono">Controle Gerencial unificado de produção</p>
            </div>
          </div>
          
          <div className="text-center mx-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">REGISTRO DE OPERAÇÕES DE PRODUÇÃO</h2>
            <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5 tracking-widest font-mono bg-slate-100 px-3 py-1 rounded-sm inline-block">
              TexMalha • Linhas de Produção 1 - 99
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <span className="text-[10px] text-slate-800 font-bold uppercase">TexMalha</span>
              <p className="text-[9px] text-slate-500 font-mono">Terminal operacional ativo</p>
            </div>
            <img src={logoTexMalha} alt="TexMalha" className="h-12 w-12 object-contain" />
          </div>
        </div>

        {/* Operational Metadata */}
        <div className="grid grid-cols-3 bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 font-sans">
          <div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Operador do Terminal</span>
            <span className="text-xs font-extrabold text-slate-900 uppercase font-sans flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {userName || "Operador Não Identificado"}
            </span>
          </div>
          <div className="text-center border-x border-slate-200">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Data/Hora de Emissão</span>
            <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5 font-sans">
              {new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (GMT -3)
            </span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Páginas de Registro</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5 uppercase tracking-wide">
              Linhas 1 a 99 • Relatório Dinâmico
            </span>
          </div>
        </div>

        {/* Dynamic Spreadsheet Data Table */}
        {sheetRows.length > 0 ? (
          <table className="min-w-full text-left font-sans">
            <thead>
              <tr>
                {sheetRows[0]?.map((headerCell, idx) => (
                  <th key={`header-th-${idx}`} className="px-3 py-2 text-center text-xs font-bold font-sans text-white">
                    {headerCell || `Col ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetRows.slice(1).map((row, rowIdx) => (
                <tr key={`print-row-${rowIdx}`} className="border-b border-slate-200">
                  {row.map((cell, cellIdx) => (
                    <td key={`print-cell-${rowIdx}-${cellIdx}`} className="px-3 py-1.5 text-xs text-slate-700 font-mono text-center">
                      {cell || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-lg p-10 text-center">
            <p className="text-sm font-semibold text-slate-500 text-slate-700">Carregando visualização de dados de produção da planilha integrada...</p>
            <p className="text-xs text-slate-400 mt-1">Por favor, certifique-se de estar conectado à internet.</p>
          </div>
        )}

        {/* Regulatory footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-mono">
          <span>PORTAL INDUSTRIAL INTEGRADO SANTA ROSA & TEXMALHA</span>
          <span>FLUXO DE PRODUÇÃO SINCRONIZADO VIA CLOUD API</span>
          <span>IMPRESSÃO REALIZADA EM {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>
  );
}
