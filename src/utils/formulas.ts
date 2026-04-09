import { CellData } from '../types';

export const parseFormula = (formula: string, cells: Record<string, CellData>): string | number => {
  if (!formula.startsWith('=')) return formula;

  const expression = formula.substring(1).trim();

  try {
    // Helper to get cell value
    const getVal = (id: string) => {
      const val = cells[id.toUpperCase()]?.value;
      return isNaN(Number(val)) ? val : Number(val);
    };

    // Helper to get range values
    const getRangeValues = (rangeStr: string) => {
      const [start, end] = rangeStr.split(':');
      if (!end) return [getVal(start)];
      const cellIds = getRangeCells(start, end);
      return cellIds.map(id => getVal(id));
    };

    // Replace functions with their implementations
    let processedExpr = expression;

    // String functions
    processedExpr = processedExpr.replace(/UPPER\((.*?)\)/gi, (_, arg) => `String(${evaluateArg(arg)}).toUpperCase()`);
    processedExpr = processedExpr.replace(/LOWER\((.*?)\)/gi, (_, arg) => `String(${evaluateArg(arg)}).toLowerCase()`);
    processedExpr = processedExpr.replace(/TRIM\((.*?)\)/gi, (_, arg) => `String(${evaluateArg(arg)}).trim()`);
    processedExpr = processedExpr.replace(/LEN\((.*?)\)/gi, (_, arg) => `String(${evaluateArg(arg)}).length`);
    
    // Math functions
    processedExpr = processedExpr.replace(/ABS\((.*?)\)/gi, (_, arg) => `Math.abs(${evaluateArg(arg)})`);
    processedExpr = processedExpr.replace(/ROUND\((.*?),(.*?)\)/gi, (_, arg, dec) => `Number(Math.round(Number(${evaluateArg(arg)} + 'e' + ${evaluateArg(dec)})) + 'e-' + ${evaluateArg(dec)})`);
    processedExpr = processedExpr.replace(/INT\((.*?)\)/gi, (_, arg) => `Math.floor(${evaluateArg(arg)})`);
    processedExpr = processedExpr.replace(/MOD\((.*?),(.*?)\)/gi, (_, n, d) => `(${evaluateArg(n)} % ${evaluateArg(d)})`);
    processedExpr = processedExpr.replace(/POWER\((.*?),(.*?)\)/gi, (_, b, e) => `Math.pow(${evaluateArg(b)}, ${evaluateArg(e)})`);
    processedExpr = processedExpr.replace(/SQRT\((.*?)\)/gi, (_, arg) => `Math.sqrt(${evaluateArg(arg)})`);

    // Date functions
    processedExpr = processedExpr.replace(/NOW\(\)/gi, () => `new Date().toLocaleString()`);
    processedExpr = processedExpr.replace(/TODAY\(\)/gi, () => `new Date().toLocaleDateString()`);

    // Aggregate functions (SUM, AVG, COUNT, MAX, MIN)
    const aggregateFuncs = ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN'];
    aggregateFuncs.forEach(func => {
      const regex = new RegExp(`${func}\\((.*?)\\)`, 'gi');
      processedExpr = processedExpr.replace(regex, (_, arg) => {
        const values = arg.includes(':') ? getRangeValues(arg) : [evaluateArg(arg)];
        const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
        
        let result = 0;
        switch (func.toUpperCase()) {
          case 'SUM': result = numericValues.reduce((a, b) => a + b, 0); break;
          case 'AVERAGE': result = numericValues.length ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0; break;
          case 'COUNT': result = numericValues.length; break;
          case 'MAX': result = numericValues.length ? Math.max(...numericValues) : 0; break;
          case 'MIN': result = numericValues.length ? Math.min(...numericValues) : 0; break;
          default: result = 0;
        }
        return String(result);
      });
    });

    // IF function
    processedExpr = processedExpr.replace(/IF\((.*?),(.*?),(.*?)\)/gi, (_, cond, t, f) => `(${evaluateArg(cond)} ? ${evaluateArg(t)} : ${evaluateArg(f)})`);

    // Replace cell references
    processedExpr = processedExpr.replace(/[A-Z]+[0-9]+/gi, (match) => {
      const val = getVal(match);
      return typeof val === 'string' ? `"${val}"` : String(val || 0);
    });

    function evaluateArg(arg: string): any {
      // If it's a cell reference, get its value
      if (/^[A-Z]+[0-9]+$/i.test(arg.trim())) {
        const val = getVal(arg.trim());
        return typeof val === 'string' ? `"${val}"` : val;
      }
      return arg;
    }

    // Use Function constructor for final evaluation
    const result = new Function(`return ${processedExpr}`)();
    return result === undefined ? '' : result;
  } catch (e) {
    console.error('Formula Error:', e);
    return '#ERROR!';
  }
};

export const getRangeCells = (start: string, end: string): string[] => {
  const startColStr = start.match(/[A-Z]+/)?.[0] || 'A';
  const startRow = parseInt(start.match(/[0-9]+/)?.[0] || '1');
  const endColStr = end.match(/[A-Z]+/)?.[0] || 'A';
  const endRow = parseInt(end.match(/[0-9]+/)?.[0] || '1');

  const startCol = colToNumber(startColStr);
  const endCol = colToNumber(endColStr);

  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  const cells: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(`${numberToCol(c)}${r}`);
    }
  }
  return cells;
};

export const colToNumber = (col: string): number => {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return num;
};

export const numberToCol = (num: number): string => {
  let col = '';
  while (num > 0) {
    let rem = (num - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
};
