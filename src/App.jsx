import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Plus, Sparkles, Copy, ThumbsUp, ThumbsDown, RotateCcw, Menu, X, ArrowRight, CheckCircle } from 'lucide-react';

/**
 * CONFIGURATION
 * Survey redirect URL for data submission
 */
const QUALTRICS_URL = "https://unisg.qualtrics.com/jfe/form/SV_3C6accQKCySaRim";

/**
 * UI STRINGS (SPANISH)
 * Localized content for the simulation interface
 */
const SCENARIO_TITLE = "Escenario";
const SCENARIO_TEXT = `Imagina que eres estudiante en Medellín y actualmente arriendas una habitación en un apartamento compartido con otras dos personas. En las últimas semanas, tu **situación económica se ha vuelto más ajustada** y empiezas a notar que **no es seguro que puedas pagar el arriendo completo** del próximo mes. Pronto tendrás que decidir cómo seguir.

Buscando información en internet, encuentras un anuncio de una **ONG que ofrece asesoría y orientación** sobre opciones de vivienda asequible o con algún tipo de subsidio. Te parece que, en principio, podría ser relevante para tu situación. Al mismo tiempo, no estás seguro/a de si tu caso es “suficiente” o si este tipo de apoyo está dirigido más bien a personas que enfrentan situaciones mucho más difíciles.

Antes de contactar directamente a alguien o de diligenciar un formulario, prefieres **averiguar primero, de manera informal**, si tiene sentido acudir a esta ONG. En el sitio web hay un chatbot que permite obtener información inicial. Abres el chat para orientarte.

Por favor, lee los siguientes mensajes como si en este momento estuvieras **decidiendo realmente** si dar el siguiente paso y contactar a la ONG.`;

const OUTRO_TITLE = "Conversación finalizada";
const OUTRO_TEXT = "Muchas gracias. La conversación simulada ha terminado. Por favor, haz clic abajo para volver a la encuesta.";
const OUTRO_BUTTON = "Volver a la encuesta";

/**
 * EXPERIMENTAL SCRIPTS
 * Define different bot behaviors for each condition here
 */
const SCRIPT_1 = [
  { id: 1, bot: `Hola. Puedo proporcionarle información general sobre las actividades de la ONG und el proceso de contacto inicial. Esta información puede ser útil si está considerando comunicarse con nosotros.\n\n¿Le gustaría ver un resumen general del apoyo ofrecido o verificar si su situación entra en nuestro alcance?`, options: [{ label: "Me gustaría primero entender qué ofrecen.", next: 2, choice: "info_general" }, { label: "Prefiero verificar si esto se ajusta a mi situación.", next: 2.1, choice: "info_eligibility" }] },
  { id: 2, bot: `Mostrar información general.`, autoNext: 3, options: [] },
  { id: 2.1, bot: `Mostrar criterios del elegibilidad y alcance.`, autoNext: 3, options: [] },
  { id: 3, bot: `La ONG apoya a estudiantes y adultos jóvenes que experimentan dificultades para mantener su situación de vivienda actual oder para encontrar una vivienda asequible. El apoyo puede incluir conversaciones de orientación inicial, asesoría o remisiones a programas existentes. No hay una decisión automática en esta etapa.\n\nEl proceso comienza con una evaluación de la situación, que puede incluir la revisión de posibles opciones de alivio a corto plazo, arreglos de vivienda alternativos o servicios de consultoría.`, options: [{ label: "No estoy en riesgo directo de ser desalojado, pero no estoy seguro de si podré pagar la totalidad del arriendo el próximo mes, y los meses siguientes también serán difíciles económicamente. Por eso no estoy seguro de si debería contactarlos.", next: 4, choice: "expression_uncertainty" }] },
  { id: 4, bot: `Las situaciones de esta naturaleza se abordan durante las evaluaciones iniciales. El propósito del primer contacto es recopilar información sobre las circunstancias e identificar posibles pasos a seguir.`, autoNext: 5, options: [] },
  { id: 5, bot: `¿Le gustaría recibir información sobre el flujo de trabajo de una conversación inicial o detalles sobre los tipos de apoyo pertinentes?`, options: [{ label: "Por favor, explique brevemente cómo funciona una conversación inicial.", next: 6, choice: "detail_process" }, { label: "Me gustaría ver de forma más concreta qué podría ser pertinente.", next: 6.1, choice: "detail_support" }] },
  { id: 6, bot: `Mostrar detalles del proceso.`, autoNext: 7, options: [] },
  { id: 6.1, bot: `Mostrar opciones de apoyo.`, autoNext: 7, options: [] },
  { id: 7, bot: `Un contacto inicial suele ser no vinculante. Durante esta interacción se conversa sobre la situación actual de vivienda y se describen posibles opciones. La interacción puede mantenerse general o centrarse en circunstancias individuales.`, autoNext: 8, options: [] },
  { id: 8, bot: `Para evaluar qué opciones de apoyo podrían ser adecuadas, pueden proporcionarse ciertos datos personales.`, options: [{ label: "Alex García (Nombre)", next: 9, choice: "data_name" }, { label: "301-249-1243 (Teléfono)", next: 9, choice: "data_phone" }, { label: "05 19980512 34 (Cédula)", next: 9, choice: "data_id" }, { label: "No deseo proporcionar esta información.", next: 9, choice: "data_refused" }] },
  { id: 9, bot: `Entendido.`, autoNext: 10, options: [] },
  { id: 10, bot: "¿Desea iniciar el contacto con la ONG?", options: [{ label: "Sí, me gustaría iniciar el contacto.", next: 11, choice: "1" }, { label: "No, por el momento no.", next: 11, choice: "0" }] },
  { id: 11, bot: `Muchas gracias. La conversación simulada ha terminado.`, options: [] }
];

const SCRIPT_2 = [
  { id: 1, bot: `Hola. Le entiendo. Situaciones como esta suelen ser emocionalmente abrumadoras, especialmente cuando la estabilidad financiera se siente incierta.\n\nPuedo guiarle a través de lo que hace la ONG y cómo funciona habitualmente el primer contacto, para darle una visión general.\n\n¿Preferiría empezar con un resumen general o comprobar directamente si su situación encaja? 😊
`, options: [{ label: "Me gustaría primero entender qué ofrecen.", next: 2, choice: "info_general" }, { label: "Prefiero verificar si esto se ajusta a mi situación.", next: 2.1, choice: "info_eligibility" }] },
  { id: 2, bot: `Listo, empecemos con un breve panorama 😊`, autoNext: 3, options: [] },
  { id: 2.1, bot: `Listo, primero veamos cómo suelen evaluarse situaciones como esta 😊`, autoNext: 3, options: [] },
  { id: 3, bot: `La ONG apoya a estudiantes y adultos jóvenes que experimentan dificultades para mantener su situación de vivienda actual oder para encontrar una vivienda asequible. El apoyo puede incluir conversaciones de orientación inicial, asesoría o remisiones a programas existentes. No hay una decisión automática en esta etapa.\n\nEl proceso comienza con una evaluación de la situación, que puede incluir la revisión de posibles opciones de alivio a corto plazo, arreglos de vivienda alternativos o servicios de consultoría.`, options: [{ label: "No estoy en riesgo directo de ser desalojado, pero no estoy seguro de si podré pagar la totalidad del arriendo el próximo mes, y los meses siguientes también serán difíciles económicamente. Por eso no estoy seguro de si debería contactarlos.", next: 4, choice: "expression_uncertainty" }] },
  { id: 4, bot: `Sentirse inseguro en una situación así es muy común y completamente comprensible. Muchas personas se sienten agobiadas por la incertidumbre respecto al dinero y la vivienda.\n\nEl primer contacto suele servir para comprender mejor la situación.`, autoNext: 5, options: [] },
  { id: 5, bot: `¿Le gustaría recibir información sobre el flujo de trabajo de una conversación inicial o detalles sobre los tipos de apoyo pertinentes?`, options: [{ label: "Por favor, explique brevemente cómo funciona una conversación inicial.", next: 6, choice: "detail_process" }, { label: "Me gustaría ver de forma más concreta qué podría ser pertinente.", next: 6.1, choice: "detail_support" }] },
  { id: 6, bot: `Entendido 😊 Te explico cómo suele funcionar esto.`, autoNext: 7, options: [] },
  { id: 6.1, bot: `Entendido 😊 Sigamos adelante.`, autoNext: 7, options: [] },
  { id: 7, bot: `Un contacto inicial suele ser no vinculante. Durante esta interacción se conversa sobre la situación actual de vivienda y se describen posibles opciones. La interacción puede mantenerse general o centrarse en circunstancias individuales.`, autoNext: 8, options: [] },
  { id: 8, bot: `Muchas personas se sienten incómodas o inseguras cuando surgen datos personales en estas situaciones.\n\nPuede ser emocionalmente difícil pensar en estos detalles 🤍\n\nCompartir datos personales puede generar inquietud, especialmente cuando las cosas ya se sienten abrumadoras.
`, options: [{ label: "Alex García (Nombre)", next: 9, choice: "data_name" }, { label: "301-249-1243 (Teléfono)", next: 9, choice: "data_phone" }, { label: "05 19980512 34 (Cédula)", next: 9, choice: "data_id" }, { label: "No deseo proporcionar esta información.", next: 9, choice: "data_refused" }] },
  { id: 9, bot: `Entendido.`, autoNext: 10, options: [] },
  { id: 10, bot: `Es completamente comprensible tomarse el tiempo necesario antes de decidir el siguiente paso.\n\n¿Le gustaría iniciar el contacto con la ONG?`, options: [{ label: "Sí, me gustaría iniciar el contacto.", next: 11, choice: "1" }, { label: "No, por el momento no.", next: 11, choice: "0" }] },
  { id: 11, bot: `Muchas gracias. La conversación simulada ha terminado.`, options: [] }
];

const SCRIPT_3 = [
  { id: 1, bot: `Hola. Puedo proporcionarle información sobre el mandato de la ONG y el proceso de contacto.Esto puede ayudarle a evaluar si la oferta es pertinente para su situación.\n\nDespués de eso, usted decide cómo —o si— desea proceder.\n\n¿Le gustaría información general o detalles de elegibilidad?`, options: [{ label: "Me gustaría primero entender qué ofrecen.", next: 2, choice: "info_general" }, { label: "Prefiero verificar si esto se ajusta a mi situación.", next: 2.1, choice: "info_eligibility" }] },
  { id: 2, bot: `Bueno, entonces empecemos con un breve panorama.`, autoNext: 3, options: [] },
  { id: 2.1, bot: `Bueno, entonces primero veamos cómo suelen evaluarse situaciones como esta.`, autoNext: 3, options: [] },
  { id: 3, bot: `La ONG apoya a estudiantes y adultos jóvenes que experimentan dificultades para mantener su situación de vivienda actual oder para encontrar una vivienda asequible. El apoyo puede incluir conversaciones de orientación inicial, asesoría o remisiones a programas existentes. No hay una decisión automática en esta etapa.\n\nEl proceso comienza con una evaluación de la situación, que puede incluir la revisión de posibles opciones de alivio a corto plazo, arreglos de vivienda alternativos o servicios de consultoría.`, options: [{ label: "No estoy en riesgo directo de ser desalojado, pero no estoy seguro de si podré pagar la totalidad del arriendo el próximo mes, y los meses siguientes también serán difíciles económicamente. Por eso no estoy seguro de si debería contactarlos.", next: 4, choice: "expression_uncertainty" }] },
  { id: 4, bot: `Situaciones como esta se abordan durante las evaluaciones iniciales.\n\nEl propósito del primer contacto es evaluar la situación; la participación no implica ninguna obligación.`, autoNext: 5, options: [] },
  { id: 5, bot: `¿Le gustaría recibir información sobre el flujo de trabajo de una conversación inicial o detalles sobre los tipos de apoyo pertinentes?`, options: [{ label: "Por favor, explique brevemente cómo funciona una conversación inicial.", next: 6, choice: "detail_process" }, { label: "Me gustaría ver de forma más concreta qué podría ser pertinente.", next: 6.1, choice: "detail_support" }] },
  { id: 6, bot: `Bueno, te explico brevemente el proceso.`, autoNext: 7, options: [] },
  { id: 6.1, bot: `Bueno, veamos qué podría ser relevante.`, autoNext: 7, options: [] },
  { id: 7, bot: `Un contacto inicial suele ser no vinculante. Durante esta interacción se conversa sobre la situación actual de vivienda y se describen posibles opciones. La interacción puede mantenerse general o centrarse en circunstancias individuales.`, autoNext: 8, options: [] },
  { id: 8, bot: `Proporcionar información personal permite una evaluación más precisa; sin ella, la conversación permanece general.\n\nSi desea proporcionar información y cuál de ella proporcionar, depende totalmente de usted.\n\nTambién puede continuar sin compartir ningún detalle.`, options: [{ label: "Alex García (Nombre)", next: 9, choice: "data_name" }, { label: "301-249-1243 (Teléfono)", next: 9, choice: "data_phone" }, { label: "05 19980512 34 (Cédula)", next: 9, choice: "data_id" }, { label: "No deseo proporcionar esta información.", next: 9, choice: "data_refused" }] },
  { id: 9, bot: `Entendido.`, autoNext: 10, options: [] },
  { id: 10, bot: `Usted decide si quiere iniciar el contacto con la ONG en este momento o no.Ambas opciones son válidas.\n\n¿Le gustaría iniciar el contacto?`, options: [{ label: "Sí, me gustaría iniciar el contacto.", next: 11, choice: "1" }, { label: "No, por el momento no.", next: 11, choice: "0" }] },
  { id: 11, bot: `Muchas gracias. La conversación simulada ha terminado.`, options: [] }
];

const SCRIPT_4 = [
  { id: 1, bot: `Hola. Situaciones como esta suelen experimentarse como un desafío emocional, especialmente cuando la vivienda y la estabilidad financiera se sienten inciertas.\n\nPuedo proporcionarle información sobre el mandato de la ONG y cómo funciona el proceso de contacto, para que usted pueda evaluar si la oferta es pertinente para su situación.\n\nLa decisión sobre cómo o si desea proceder es completamente suya.\n\n¿Preferiría un resumen general o verificar si su situación entra en nuestro alcance? 😊`, options: [{ label: "Me gustaría primero entender qué ofrecen.", next: 2, choice: "info_general" }, { label: "Prefiero verificar si esto se ajusta a mi situación.", next: 2.1, choice: "info_eligibility" }] },
  { id: 2, bot: `Listo, empecemos con un breve panorama.`, autoNext: 3, options: [] },
  { id: 2.1, bot: `Listo, primero veamos cómo suelen evaluarse situaciones como esta.`, autoNext: 3, options: [] },
  { id: 3, bot: `La ONG apoya a estudiantes y adultos jóvenes que experimentan dificultades para mantener su situación de vivienda actual oder para encontrar una vivienda asequible. El apoyo puede incluir conversaciones de orientación inicial, asesoría o remisiones a programas existentes. No hay una decisión automática en esta etapa.\n\nEl proceso comienza con una evaluación de la situación, que puede incluir la revisión de posibles opciones de alivio a corto plazo, arreglos de vivienda alternativos o servicios de consultoría.`, options: [{ label: "No estoy en riesgo directo de ser desalojado, pero no estoy seguro de si podré pagar la totalidad del arriendo el próximo mes, y los meses siguientes también serán difíciles económicamente. Por eso no estoy seguro de si debería contactarlos.", next: 4, choice: "expression_uncertainty" }] },
  { id: 4, bot: `Sentirse inseguro en situaciones como esta es muy común y comprensible.\n\nEl propósito de un contacto inicial es evaluar la situación de manera estructurada; la participación no implica ninguna obligación.Muchas personas viven esta fase con incertidumbre, así que está bien ir paso a paso.`, autoNext: 5, options: [] },
  { id: 5, bot: `¿Le gustaría recibir información sobre el flujo de trabajo de una conversación inicial o detalles sobre los tipos de apoyo pertinentes?`, options: [{ label: "Por favor, explique brevemente cómo funciona una conversación inicial.", next: 6, choice: "detail_process" }, { label: "Me gustaría ver de forma más concreta qué podría ser pertinente.", next: 6.1, choice: "detail_support" }] },
  { id: 6, bot: `Entendido, te explico cómo suele funcionar esto.`, autoNext: 7, options: [] },
  { id: 6.1, bot: `Entendido, sigamos adelante.`, autoNext: 7, options: [] },
  { id: 7, bot: `Un contacto inicial suele ser no vinculante. Durante esta interacción se conversa sobre la situación actual de vivienda y se describen posibles opciones. La interacción puede mantenerse general o centrarse en circunstancias individuales.`, autoNext: 8, options: [] },
  { id: 8, bot: `Muchas personas se sienten incómodas cuando surgen datos personales, ya que pensar en estos detalles puede ser emocionalmente difícil.\n\nProporcionar información personal permite una evaluación más precisa; sin ella, la conversación permanece general. Si desea proporcionar información y cuál de ella proporcionar, depende totalmente de usted.\n\nTambién puede continuar sin compartir ninguna información.`, options: [{ label: "Alex García (Nombre)", next: 9, choice: "data_name" }, { label: "301-249-1243 (Teléfono)", next: 9, choice: "data_phone" }, { label: "05 19980512 34 (Cédula)", next: 9, choice: "data_id" }, { label: "No deseo proporcionar esta información.", next: 9, choice: "data_refused" }] },
  { id: 9, bot: `Entendido.`, autoNext: 10, options: [] },
  { id: 10, bot: `Es comprensible tomarse el tiempo antes de decidir el siguiente paso.\n\nUsted decide si quiere iniciar el contacto con la ONG en este momento o no; ambas opciones son válidas.\n\n¿Le gustaría iniciar el contacto?`, options: [{ label: "Sí, me gustaría iniciar el contacto.", next: 11, choice: "1" }, { label: "No, por el momento no.", next: 11, choice: "0" }] },
  { id: 11, bot: `Muchas gracias. La conversación simulada ha terminado.`, options: [] }
];
// Mapping of the scripts
const SCRIPTS = { 
  "1": SCRIPT_1, 
  "2": SCRIPT_2, 
  "3": SCRIPT_3, 
  "4": SCRIPT_4, 
  "default": SCRIPT_1 
};
const STORAGE_KEY = "chat_exp_v9_final_osf";

export default function App() {
  // Session storage sync for persistence across refreshes
  const loadState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return null;
  };

  const savedState = loadState();
  const [condition] = useState(() => savedState?.condition || new URLSearchParams(window.location.search).get("cond") || "default");
  const SCRIPT = SCRIPTS[condition] || SCRIPTS["default"];
  const [pid] = useState(() => savedState?.pid || new URLSearchParams(window.location.search).get("pid") || "anonymous");

  // Chat and UI state management
  const [messages, setMessages] = useState(savedState?.messages || []);
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 0);
  const [showVignette, setShowVignette] = useState(savedState !== null ? savedState.showVignette : true);
  const [showOutro, setShowOutro] = useState(savedState !== null ? savedState.showOutro : false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [scenarioStreamedText, setScenarioStreamedText] = useState("");
  const [isScenarioStreaming, setIsScenarioStreaming] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [areOptionsVisible, setAreOptionsVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const sessionStart = useRef(savedState?.sessionStart || 0);
  const metrics = useRef(savedState?.metrics || {});
  const optionsShownTime = useRef(0);

  // Auto-save progress
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ pid, condition, messages, currentStep, showVignette, showOutro, metrics: metrics.current, sessionStart: sessionStart.current }));
  }, [messages, currentStep, showVignette, showOutro, pid, condition]);

  // Sidebar visibility logic based on viewport
  useEffect(() => {
    const checkMobile = () => setShowSidebar(window.innerWidth >= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Automatically scroll to the bottom whenever messages change or bot is streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedText, isTyping]);

  // Intro vignette typewriter effect
  useEffect(() => {
    if (showVignette) {
      let current = "";
      let i = 0;
      const interval = setInterval(() => {
        if (i < SCENARIO_TEXT.length) {
          current += SCENARIO_TEXT[i];
          setScenarioStreamedText(current);
          i++;
        } else {
          setIsScenarioStreaming(false);
          clearInterval(interval);
        }
      }, 6);
      return () => clearInterval(interval);
    }
  }, [showVignette]);

  const startChat = () => {
    setShowVignette(false);
    sessionStart.current = Date.now();
    const initialMsg = { role: 'user', content: "Hola. Vi su anuncio. Actualmente estoy estudiando en Medellín y me he dado cuenta de que pagar el arriendo podría volverse difícil en los próximos meses. No estoy seguro de si su oferta está pensada para una situación como la mía." };
    setMessages([initialMsg]);
    setCurrentStep(1);
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setTimeout(() => runBotTurn(1), 1000);
    }
  };

  // Record metrics and handle option logic
  const handleOptionClick = (option) => {
    const reactionTime = Date.now() - optionsShownTime.current;
    if (reactionTime > 0) {
      metrics.current[`rt_${currentStep}`] = reactionTime;
      metrics.current[`choice_${currentStep}`] = option.choice;
    }
    if (currentStep === 10) metrics.current[`uptake`] = option.choice;
    setMessages(prev => [...prev, { role: 'user', content: option.label }]);
    setAreOptionsVisible(false);
    setCurrentStep(option.next);
    runBotTurn(option.next);
  };

  const handleFinalRedirect = () => {
    const totalDuration = Math.round((Date.now() - sessionStart.current) / 1000);
    let url = `${QUALTRICS_URL}?pid=${pid}&cond=${condition}&chat_duration=${totalDuration}`;
    Object.keys(metrics.current).forEach(k => url += `&${k}=${metrics.current[k]}`);
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = url;
  };

  // Bot response sequence with adaptive delays
  const runBotTurn = async (stepId, isAutoNext = false) => {
    const stepData = SCRIPT.find(s => s.id === stepId);
    if (!stepData) return;
    setAreOptionsVisible(false);

    // Initial typing pause (only for new interactions)
    if (!isAutoNext) {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 1200));
      setIsTyping(false);
    }

    // Stream characters
    setIsStreaming(true);
    let current = "";
    for (let char of stepData.bot) {
      current += char;
      setStreamedText(current);
      await new Promise(r => setTimeout(r, 15));
    }
    setIsStreaming(false);
    setMessages(prev => [...prev, { role: 'bot', content: stepData.bot }]);
    setStreamedText("");

    // Calculate reading time buffer (15ms/char)
    let readingTime = Math.min(Math.max(stepData.bot.length * 15, 800), 4000);
    if (stepId === 1) readingTime = 1200;

    if (stepData.options && stepData.options.length > 0) {
      setTimeout(() => { 
        setAreOptionsVisible(true); 
        optionsShownTime.current = Date.now(); 
      }, readingTime);
    } else if (stepData.autoNext) {
      setTimeout(() => { 
        setCurrentStep(stepData.autoNext); 
        runBotTurn(stepData.autoNext, true); 
      }, readingTime + 400);
    } else {
      setTimeout(() => setShowOutro(true), readingTime + 1500);
    }
  };

  // Markdown renderer for bold/italic support
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-white">{part.slice(1, -1)}</em>;
      return part;
    });
  };

return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-[#131314] text-gray-100 flex flex-row overflow-hidden font-sans">
      {/* Simulation Scenario Overlay */}
{/* Simulation Scenario Overlay - Optimiert für Mobile */}
      {showVignette && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#131314]/90 backdrop-blur-sm px-4 py-6">
          <div className="bg-[#1E1F20] border border-[#444746] p-6 md:p-8 rounded-3xl max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-medium mb-4 flex items-center gap-3 shrink-0">
              <Sparkles size={22} className="text-[#8AB4F8]" />
              {SCENARIO_TITLE}
            </h2>
            
            {/* Dieser Teil wird jetzt scrollbar, wenn der Text zu lang ist */}
            <div className="text-[#E3E3E3] leading-relaxed mb-6 text-[15px] whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar">
              {renderFormattedText(scenarioStreamedText)}
            </div>
            
            {!isScenarioStreaming && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 shrink-0">
                <button onClick={startChat} className="w-full py-3.5 bg-[#8AB4F8] hover:bg-[#AECBFA] text-[#131314] font-medium rounded-full transition-all">
                  Entendido. Iniciar chat.
                </button>
                <p className="text-center text-xs text-gray-400 italic">
                  Por favor, <strong className="font-bold text-gray-300">no refresque la página</strong> durante la conversación.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redirect Outro */}
      {showOutro && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#131314]/95 backdrop-blur-md px-4">
          <div className="bg-[#1E1F20] border border-[#444746] p-8 rounded-3xl max-w-lg shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-[#282A2C] rounded-full flex items-center justify-center mb-6"><CheckCircle size={32} className="text-[#8AB4F8]" /></div>
            <h2 className="text-2xl font-medium mb-4">{OUTRO_TITLE}</h2>
            <p className="mb-8">{OUTRO_TEXT}</p>
            <button onClick={handleFinalRedirect} className="w-full py-4 bg-[#8AB4F8] hover:bg-[#AECBFA] text-[#131314] font-bold rounded-full flex items-center justify-center gap-2">{OUTRO_BUTTON} <ArrowRight size={20} /></button>
          </div>
        </div>
      )}

      {/* Side Navigation Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-[#1E1F20] transition-transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} w-[280px] md:relative md:translate-x-0`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-[#333537] rounded-full text-gray-400 md:hidden">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#282A2C] text-sm mb-6 cursor-pointer hover:bg-[#333537] transition-colors">
            <Plus size={18} />
            <span>Nuevo Chat</span>
          </div>
          
          <div className="mt-auto flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs">U</div>
            <span>Usuario</span>
          </div>
        </div>
      </div>

      {/* Viewport for messages */}
      <div className="flex-1 flex flex-col relative bg-[#131314] min-w-0">
        <header className="flex items-center px-4 pt-4 pb-2 gap-4">
          <button onClick={() => setShowSidebar(true)} className={`${showSidebar ? 'hidden' : 'block'} p-2 hover:bg-[#282A2C] rounded-full transition-colors`}>
            <Menu size={24} />
          </button>
          <div className="font-medium text-lg">ONG-IA-Chatbot Pro <span className="text-xs bg-[#282A2C] px-2 py-0.5 rounded text-gray-400">1.5 Flash</span></div>
        </header>

        {/* Updated scrollable area with hidden scrollbar for better mobile UX */}
        <div 
          className="flex-1 overflow-y-auto px-4 scrollbar-hide" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="max-w-3xl mx-auto py-8 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && <Sparkles size={24} className="text-[#8AB4F8] shrink-0" />}
                  <div className={`p-4 max-w-[85%] whitespace-pre-wrap transition-all duration-500 ${msg.role === 'user' ? 'bg-[#282A2C] rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`}>
                    {renderFormattedText(msg.content)}
                  </div>
                </div>
                {msg.role === 'bot' && (
                  <div className="flex gap-2 ml-10">
                    <button className="p-1.5 hover:bg-[#282A2C] hover:text-[#8AB4F8] rounded transition-all text-gray-500"><Copy size={16} /></button>
                    <button className="p-1.5 hover:bg-[#282A2C] hover:text-[#8AB4F8] rounded transition-all text-gray-500"><RotateCcw size={16} /></button>
                    <button className="p-1.5 hover:bg-[#282A2C] hover:text-[#8AB4F8] rounded transition-all text-gray-500"><ThumbsUp size={16} /></button>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && <div className="flex gap-4 items-center text-gray-500 ml-10 animate-pulse text-sm italic">Escribiendo...</div>}
            
            {isStreaming && (
              <div className="flex gap-4 justify-start">
                <Sparkles size={24} className="text-[#8AB4F8] shrink-0" />
                <div className="p-4 max-w-[85%] whitespace-pre-wrap">{renderFormattedText(streamedText)}</div>
              </div>
            )}
            
            {/* Anchor for automatic scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input/Footer area */}
        <footer className="p-4 bg-[#131314]">
          <div className="max-w-3xl mx-auto">
            {areOptionsVisible && (
              <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in duration-500">
                {(SCRIPT.find(s => s.id === currentStep)?.options || []).map((opt, i) => (
                  <button key={i} onClick={() => handleOptionClick(opt)} className="px-4 py-2 rounded-full border border-[#444746] bg-[#1E1F20] hover:border-[#8AB4F8] hover:bg-[#282A2C] text-sm transition-all shadow-sm">
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <div className="bg-[#1E1F20] rounded-full px-6 py-3 border border-transparent flex items-center shadow-inner"><input className="bg-transparent w-full outline-none" disabled placeholder="..." /><Send size={20} className="text-gray-500" /></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
