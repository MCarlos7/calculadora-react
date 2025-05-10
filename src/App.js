import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [input, setInput] = useState('0');
  const [history, setHistory] = useState('');
  const displayRef = useRef(null);

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [input]);

  const keyMap = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
    '^': '^', '(': '(', ')': ')', '%': '%',
    'Enter': '=', '=': '=', 'Backspace': '⌫', 
    'Escape': 'AC', 'Delete': 'CE'
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = keyMap[e.key];
      if (key) {
        e.preventDefault();
        handleButtonPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input]);

  const handleButtonPress = (key) => {
    switch (key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        inputDigit(key);
        break;
      case '+': case '-': case '*': case '/': case '^':
        inputOperator(key);
        break;
      case '(': case ')':
        inputParenthesis(key);
        break;
      case '.':
        inputDecimal();
        break;
      case '%':
        handlePercentage();
        break;
      case '=':
        calculateResult();
        break;
      case 'AC':
        clearAll();
        break;
      case 'CE':
        clearEntry();
        break;
      case '⌫':
        handleBackspace();
        break;
      default:
        break;
    }
  };

  const clearAll = () => {
    setInput('0');
    setHistory('');
  };

  const clearEntry = () => {
    setInput('0');
  };

  const inputDigit = (digit) => {
    setInput(input === '0' && digit !== '.' ? digit : input + digit);
  };

  const inputOperator = (operator) => {
    if (input === '0' && operator !== '-') return;

    const lastChar = input.slice(-1);
    if ([ '+', '-', '*', '/' ].includes(lastChar)) {
      if (!(lastChar === '*' && operator === '-') && !(lastChar === '/' && operator === '-')) {
        setInput(input.slice(0, -1) + operator);
      } else {
        setInput(input + ' ' + operator);
      }
      return;
    }
    if (lastChar === '(' && operator !== '-') return;
    setInput(input + operator);
  };

  const inputParenthesis = (paren) => {
    if (paren === '(') {
      if (input === '0') {
        setInput('(');
      } else if ([ '+', '-', '*', '/', '(' ].includes(input.slice(-1))) {
        setInput(input + '(');
      } else {
        setInput(input + '*(');
      }
    } else {
      const openParens = (input.match(/\(/g) || []).length;
      const closeParens = (input.match(/\)/g) || []).length;
      const lastChar = input.slice(-1);
      if (openParens > closeParens && ![ '+', '-', '*', '/', '(' ].includes(lastChar)) {
        setInput(input + ')');
      }
    }
  };

  const inputDecimal = () => {
    const parts = input.split(/[+\-*/()]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      setInput(input + '.');
    }
  };

  const calculateResult = () => {
    try {
      const validation = validateMathExpression(input);
      if (!validation.isValid) throw new Error(validation.message);

      let expression = input
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/(\d+)\(/g, '$1*(')
        .replace(/\)\(/g, ')*(');

      setHistory(input + ' =');
      let result = eval(expression);
      let resultStr = String(result);

      if (resultStr.includes('e')) {
        resultStr = result.toLocaleString('fullwide', { useGrouping: false });
      }
      setInput(resultStr);
    } catch (error) {
      setInput('Error');
      setTimeout(() => setInput('0'), 1000);
    }
  };

  const validateMathExpression = (expr) => {
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens !== closeParens) return { isValid: false, message: 'Paréntesis no balanceados' };
    if (/([+*/]\s*[+*/])/.test(expr)) return { isValid: false, message: 'Operadores consecutivos inválidos' };
    if (/[+\-*/]\s*$/.test(expr)) return { isValid: false, message: 'Expresión termina en operador' };
    if (/\(\s*\)/.test(expr)) return { isValid: false, message: 'Paréntesis vacíos' };
    return { isValid: true, message: '' };
  };

  const handleBackspace = () => {
    setInput(input.length === 1 ? '0' : input.slice(0, -1));
  };

  const handlePercentage = () => {
    try {
      const validation = validateMathExpression(input);
      if (!validation.isValid) throw new Error(validation.message);

      let expression = input.replace(/%/g, '/100');
      const result = eval(expression);
      setInput(String(result));
    } catch {
      setInput('Error');
      setTimeout(() => setInput('0'), 1000);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card calculator">
            <div className="card-header bg-dark text-white">
              <div className="history text-secondary">{history}</div>
              <div className="display-container">
                <div ref={displayRef} className="display display-4 text-end">{input}</div>
              </div>
            </div>
            <div className="card-body bg-light">
              {[ ['AC', 'CE', '⌫', '/'], ['(', ')', '%', '*'], ['7', '8', '9', '-'], ['4', '5', '6', '+'], ['1', '2', '3', '='], ['0', '.', '^'] ].map((row, rowIndex) => (
                <div className={`row ${rowIndex < 4 ? 'mb-2' : rowIndex === 4 ? '' : 'mt-2'}`} key={rowIndex}>
                  {row.map((btn, idx) => (
                    <div className={`col-${row.length === 3 && idx === 0 ? 6 : 3}`} key={idx}>
                      <button
                        className={`btn ${['AC'].includes(btn) ? 'btn-danger' : ['CE', '⌫'].includes(btn) ? 'btn-secondary' : ['+', '-', '*', '/', '=', '^'].includes(btn) ? 'btn-warning' : 'btn-dark'} w-100`}
                        onClick={() => handleButtonPress(btn === '÷' ? '/' : btn === '×' ? '*' : btn)}>
                        {btn}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
