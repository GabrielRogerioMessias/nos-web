"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calculator, X, GripHorizontal } from "lucide-react";

type Operator = "+" | "-" | "*" | "/" | null;

// ─── Contexto global ──────────────────────────────────────────────────────────

interface CalculatorContextValue {
  open: boolean;
  toggle: () => void;
}

const CalculatorContext = createContext<CalculatorContextValue>({
  open: false,
  toggle: () => {},
});

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CalculatorContext.Provider value={{ open, toggle: () => setOpen((v) => !v) }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  return useContext(CalculatorContext);
}

// ─── Janela flutuante ─────────────────────────────────────────────────────────

function CalculatorWindow({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingNext, setWaitingNext] = useState(false);

  const [pos, setPos] = useState({ x: 80, y: 120 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });

  function onDragStart(e: React.MouseEvent) {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: pos.x, wy: pos.y };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.wx + (e.clientX - dragStart.current.mx),
        y: dragStart.current.wy + (e.clientY - dragStart.current.my),
      });
    }
    function onMouseUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── Lógica ────────────────────────────────────────────────────────────────

  function parseDisplay(val: string) { return parseFloat(val.replace(",", ".")); }

  function formatResult(val: number) {
    if (!isFinite(val)) return "Erro";
    return String(parseFloat(val.toFixed(10))).replace(".", ",");
  }

  function inputDigit(digit: string) {
    if (waitingNext) { setDisplay(digit); setWaitingNext(false); }
    else { setDisplay(display === "0" ? digit : display + digit); }
  }

  function inputDecimal() {
    if (waitingNext) { setDisplay("0,"); setWaitingNext(false); return; }
    if (!display.includes(",")) setDisplay(display + ",");
  }

  function calculate(a: number, b: number, op: Operator): number {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 ? a / b : 0;
      default:  return b;
    }
  }

  function handleOperator(op: Operator) {
    const current = parseDisplay(display);
    if (prev !== null && operator && !waitingNext) {
      const result = calculate(prev, current, operator);
      setDisplay(formatResult(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOperator(op);
    setWaitingNext(true);
  }

  function handleEqual() {
    if (operator === null || prev === null) return;
    setDisplay(formatResult(calculate(prev, parseDisplay(display), operator)));
    setPrev(null);
    setOperator(null);
    setWaitingNext(true);
  }

  function handleClear() {
    setDisplay("0"); setPrev(null); setOperator(null); setWaitingNext(false);
  }

  function handleBackspace() {
    if (waitingNext) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }

  function handlePercent() {
    setDisplay(formatResult(parseDisplay(display) / 100));
    setWaitingNext(true);
  }

  // ── Estilos ───────────────────────────────────────────────────────────────

  const base = "flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors select-none";
  const btnNum = `${base} bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-700`;
  const btnOp  = `${base} bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600`;
  const btnEq  = `${base} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`;
  const btnClr = `${base} bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600`;

  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[99999] w-64 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        onMouseDown={onDragStart}
        className="flex cursor-grab items-center justify-between rounded-t-2xl border-b border-zinc-100 px-4 py-2.5 active:cursor-grabbing dark:border-zinc-800"
      >
        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
          <GripHorizontal size={13} />
          <span className="text-xs font-medium">Calculadora</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Fechar calculadora"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3">
        <div className="mb-3 rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
          <p className="h-4 text-right text-xs text-zinc-400 dark:text-zinc-500">
            {operator && prev !== null ? `${formatResult(prev)} ${operator}` : ""}
          </p>
          <p className="truncate text-right text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50" title={display}>
            {display}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button type="button" className={btnClr} onClick={handleClear}>C</button>
          <button type="button" className={btnOp}  onClick={handleBackspace}>⌫</button>
          <button type="button" className={btnOp}  onClick={handlePercent}>%</button>
          <button type="button" className={btnOp}  onClick={() => handleOperator("/")}>÷</button>

          <button type="button" className={btnNum} onClick={() => inputDigit("7")}>7</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("8")}>8</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("9")}>9</button>
          <button type="button" className={btnOp}  onClick={() => handleOperator("*")}>×</button>

          <button type="button" className={btnNum} onClick={() => inputDigit("4")}>4</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("5")}>5</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("6")}>6</button>
          <button type="button" className={btnOp}  onClick={() => handleOperator("-")}>−</button>

          <button type="button" className={btnNum} onClick={() => inputDigit("1")}>1</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("2")}>2</button>
          <button type="button" className={btnNum} onClick={() => inputDigit("3")}>3</button>
          <button type="button" className={btnOp}  onClick={() => handleOperator("+")}>+</button>

          <button type="button" className={`${btnNum} col-span-2`} onClick={() => inputDigit("0")}>0</button>
          <button type="button" className={btnNum} onClick={inputDecimal}>,</button>
          <button type="button" className={btnEq}  onClick={handleEqual}>=</button>
        </div>
      </div>
    </div>
  );
}

// ─── Portal montado no body (usado pelo layout) ───────────────────────────────

export function CalculatorPortal() {
  const { open, toggle } = useCalculator();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;
  return createPortal(<CalculatorWindow onClose={toggle} />, document.body);
}

// ─── Botão trigger (usado pela Sidebar) ───────────────────────────────────────

export function CalculatorWidget({ expanded }: { expanded: boolean }) {
  const { open, toggle } = useCalculator();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Calculadora"
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        open
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      <Calculator size={17} strokeWidth={1.5} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          expanded ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        Calculadora
      </span>
    </button>
  );
}
