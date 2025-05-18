import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [entrada, setEntrada] = useState('0');
  const [historial, setHistorial] = useState('');
  const referenciaPantalla = useRef(null);

  // Desplaza el texto hacia la derecha si se desborda
  useEffect(() => {
    if (referenciaPantalla.current) {
      referenciaPantalla.current.scrollLeft = referenciaPantalla.current.scrollWidth;
    }
  }, [entrada]);

  //--------------------------INICIO ENTRADA DE DATOS------------------------------------

  // Mapa de teclas del teclado a botones de la calculadora
  const mapaTeclas = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
    '^': '^', '(': '(', ')': ')', '%': '%',
    'Enter': '=', '=': '=', 'Backspace': '⌫', 
    'Escape': 'AC', 'Delete': 'CE'
  };

  // Manejador de teclas del teclado
  useEffect(() => {
    const manejarTecla = (e) => {
      const tecla = mapaTeclas[e.key];
      if (tecla) {
        e.preventDefault();
        presionarBoton(tecla);
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [entrada]);

  // Maneja la lógica de cada botón
  const presionarBoton = (tecla) => {
    switch (tecla) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        agregarDigito(tecla);
        break;
      case '+': case '-': case '*': case '/': case '^':
        agregarOperador(tecla);
        break;
      case '(': case ')':
        agregarParentesis(tecla);
        break;
      case '.':
        agregarDecimal();
        break;
      case '%':
        calcularPorcentaje();
        break;
      case '=':
        calcularResultado();
        break;
      case 'AC':
        limpiarTodo();
        break;
      case 'CE':
        limpiarEntrada();
        break;
      case '⌫':
        retroceso();
        break;
      default:
        break;
    }
  };

  const limpiarTodo = () => {
    setEntrada('0');
    setHistorial('');
  };

  const limpiarEntrada = () => {
    setEntrada('0');
  };

  const agregarDigito = (digito) => {
    setEntrada(entrada === '0' && digito !== '.' ? digito : entrada + digito);
  };

  const agregarOperador = (operador) => {
    if (entrada === '0' && operador !== '-') return;

    const ultimo = entrada.slice(-1);
    if ([ '+', '-', '*', '/' ].includes(ultimo)) {
      if (!(ultimo === '*' && operador === '-') && !(ultimo === '/' && operador === '-')) {
        setEntrada(entrada.slice(0, -1) + operador);
      } else {
        setEntrada(entrada + ' ' + operador);
      }
      return;
    }
    if (ultimo === '(' && operador !== '-') return;
    setEntrada(entrada + operador);
  };

  const agregarParentesis = (p) => {
    if (p === '(') {
      if (entrada === '0') {
        setEntrada('(');
      } else if ([ '+', '-', '*', '/', '(' ].includes(entrada.slice(-1))) {
        setEntrada(entrada + '(');
      } else {
        setEntrada(entrada + '*(');
      }
    } else {
      const abiertos = (entrada.match(/\(/g) || []).length;
      const cerrados = (entrada.match(/\)/g) || []).length;
      const ultimo = entrada.slice(-1);
      if (abiertos > cerrados && ![ '+', '-', '*', '/', '(' ].includes(ultimo)) {
        setEntrada(entrada + ')');
      }
    }
  };

  const agregarDecimal = () => {
    const partes = entrada.split(/[+\-*/()]/);
    const ultima = partes[partes.length - 1];
    if (!ultima.includes('.')) {
      setEntrada(entrada + '.');
    }
  };

  //--------------------------FIN ENTRADA DE DATOS------------------------------

  //--------------------------INICIO CÁLCULO------------------------------------
  const calcularResultado = () => {
    try {
      const validacion = validarExpresion(entrada);
      if (!validacion.esValida) throw new Error(validacion.mensaje);

      const postfija = convertirAPostfija(entrada);
      const resultado = evaluarPostfija(postfija);

      setHistorial(entrada + ' =');
      setEntrada(String(resultado));
    } catch (error) {
      setEntrada('Error');
      setTimeout(() => setEntrada('0'), 1000);
    }
  };
  // Función que valida si una expresión es válida antes de procesarla
  const validarExpresion = (expr) => {
    const abiertos = (expr.match(/\(/g) || []).length;
    const cerrados = (expr.match(/\)/g) || []).length;  

    if (abiertos !== cerrados)
      return { esValida: false, mensaje: 'Paréntesis desbalanceados' };
    if (/([+*/]\s*[+*/])/.test(expr))
      return { esValida: false, mensaje: 'Operadores consecutivos inválidos' };
    if (/[+\-*/]\s*$/.test(expr))
      return { esValida: false, mensaje: 'Expresión termina en operador' };
    if (/\(\s*\)/.test(expr))
      return { esValida: false, mensaje: 'Paréntesis vacíos' };

    return { esValida: true, mensaje: '' };
  };

  // Convierte la expresión infija (ej: 3+4*2) a postfija (ej: 3 4 2 * +)
  // Algoritmo de Shunting Yard
  const convertirAPostfija = (expr) => {
    const salida = [];
    const operadores = [];

    const precedencia = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    const asociatividad = { '^': 'derecha' }; // todos los demás son izquierda por defecto

    // Divide la cadena en números y operadores/paréntesis
    const tokens = expr.match(/\d+(\.\d+)?|[+\-*/^()%]/g);

    for (const token of tokens) {
      if (!isNaN(token)) {
        // Si es un número, va directo a la salida
        salida.push(token);
      } else if (token === '(') {
        operadores.push(token);
      } else if (token === ')') {
        // Extrae operadores hasta encontrar el paréntesis que abre
        while (operadores.length && operadores[operadores.length - 1] !== '(') {
          salida.push(operadores.pop());
        }
        operadores.pop(); // eliminar el '('
      } else {
        // Si es operador, compara precedencia y asociatividad
        while (
          operadores.length &&
          operadores[operadores.length - 1] !== '(' &&
          (
            precedencia[token] < precedencia[operadores[operadores.length - 1]] ||
            (precedencia[token] === precedencia[operadores[operadores.length - 1]] &&
            asociatividad[token] !== 'derecha')
          )
        ) {
          salida.push(operadores.pop());
        }
        operadores.push(token);
      }
    }

    // Agrega lo que queda
    while (operadores.length) {
      salida.push(operadores.pop());
    }

    return salida;
  };


  // Evalúa la expresión en notación postfija (RPN) usando una pila
  const evaluarPostfija = (postfija) => {
    const pila = [];

    for (const token of postfija) {
      if (!isNaN(token)) {
        // Si es número, se apila
        pila.push(parseFloat(token));
      } else {
        // Si es operador, saca dos valores, aplica la operación y vuelve a apilar
        const b = pila.pop();
        const a = pila.pop();
        switch (token) {
          case '+': pila.push(a + b); break;
          case '-': pila.push(a - b); break;
          case '*': pila.push(a * b); break;
          case '/': pila.push(a / b); break;
          case '%': pila.push(a % b); break;
          case '^': pila.push(Math.pow(a, b)); break;
          default: throw new Error('Operador desconocido');
        }
      }
    }

    // El resultado final queda en la pila
    if (pila.length !== 1) throw new Error('Expresión inválida');

    return pila[0];
  };

  // Retrocede un carácter en la entrada
  const retroceso = () => {
    setEntrada(entrada.length === 1 ? '0' : entrada.slice(0, -1));
  };

  // Calcula el porcentaje de la expresión
  // Reemplaza el símbolo '%' por '/100' y evalúa la expresión
  const calcularPorcentaje = () => {
    try {
      const validacion = validarExpresion(entrada);
      if (!validacion.esValida) throw new Error(validacion.mensaje);

      const exprPorcentaje = entrada.replace(/%/g, '/100');
      const postfija = convertirAPostfija(exprPorcentaje);
      const resultado = evaluarPostfija(postfija);
      setEntrada(String(resultado));
    } catch {
      setEntrada('Error');
      setTimeout(() => setEntrada('0'), 1000);
    }
  };

  //--------------------------FIN CÁLCULO------------------------------------

  //--------------------------INICIO HTML------------------------------------

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card calculator">
            <div className="card-header bg-dark text-white">
              <div className="history text-secondary">{historial}</div>
              <div className="display-container">
                <div ref={referenciaPantalla} className="display display-4 text-end">{entrada}</div>
              </div>
            </div>
            <div className="card-body bg-light">
              {[ ['AC', 'CE', '⌫', '/'], ['(', ')', '%', '*'], ['7', '8', '9', '-'], ['4', '5', '6', '+'], ['1', '2', '3', '='], ['0', '.', '^'] ].map((fila, filaIdx) => (
                <div className={`row ${filaIdx < 4 ? 'mb-2' : filaIdx === 4 ? '' : 'mt-2'}`} key={filaIdx}>
                  {fila.map((btn, i) => (
                    <div className={`col-${fila.length === 3 && i === 0 ? 6 : 3}`} key={i}>
                      <button
                        className={`btn ${['AC'].includes(btn) ? 'btn-danger' : ['CE', '⌫'].includes(btn) ? 'btn-secondary' : ['+', '-', '*', '/', '=', '^'].includes(btn) ? 'btn-warning' : 'btn-dark'} w-100`}
                        onClick={() => presionarBoton(btn === '÷' ? '/' : btn === '×' ? '*' : btn)}>
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
