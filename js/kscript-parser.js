/**
 * KScript Parser - A simple custom language parser for KaleidoScript
 * Converts KScript syntax to JavaScript
 */

class KScriptParser {
    constructor() {
        this.insideBlock = false;
        this.variableNames = new Set(); // Track declared variables
        this.commonKeywords = ['width', 'height', 'time', 'Math', 'audiohz', 'log', 'getFps'];
        this.currentLineNumber = 0; // Track line number for better error reporting
        this.debug = false; // Set to true to enable debug logging
    }

    // Add this method to handle debug logging
    logDebug(message) {
        if (this.debug) {
            console.log(`[KScript Debug] ${message}`);
        }
    }

    /**
     * Parse KScript code to JavaScript
     * @param {string} code - KScript code to parse
     * @returns {string} - Converted JavaScript code
     */
    parse(code) {
        // Reset state for each parse
        this.variableNames = new Set();
        this.currentLineNumber = 0;
        
        // Check if there's a debug directive
        if (code.trim().includes('#debug')) {
            this.debug = true;
            code = code.replace('#debug', '').trim();
            this.logDebug("Debug mode enabled");
        } else {
            this.debug = false;
        }
        
        // Check if code starts with #kscript directive
        if (!code.trim().startsWith('#kscript')) {
            return code; // Not KScript, return original code
        }

        console.log("Parsing KScript code");
        
        // Remove the #kscript directive
        code = code.replace('#kscript', '').trim();
        
        // Split code into lines for processing
        const lines = code.split('\n');
        let jsCode = [];
        this.insideBlock = false;

        // Process each line
        for (let i = 0; i < lines.length; i++) {
            this.currentLineNumber = i + 1; // 1-based line number
            let line = lines[i].trim();
            
            // Skip empty lines
            if (line === '') {
                jsCode.push('');
                continue;
            }
            
            // Preserve comments
            if (line.startsWith('//')) {
                jsCode.push(line);
                continue;
            }

            // Check for multiple statements on one line (using semicolons)
            if (line.includes(';')) {
                const statements = line.split(';');
                for (let j = 0; j < statements.length; j++) {
                    const trimmed = statements[j].trim();
                    if (trimmed) {
                        try {
                            const parsedStatement = this.parseLine(trimmed);
                            if (parsedStatement) {
                                jsCode.push(parsedStatement);
                            }
                        } catch (error) {
                            console.error(`Error on line ${this.currentLineNumber}, statement ${j+1}: ${error.message}`);
                            jsCode.push(`// KScript parse error on line ${this.currentLineNumber}: ${trimmed}`);
                        }
                    }
                }
                continue;
            }

            // Process a single line
            try {
                const parsedLine = this.parseLine(line);
                if (parsedLine) {
                    jsCode.push(parsedLine);
                }
            } catch (error) {
                console.error(`Error on line ${this.currentLineNumber}: ${error.message}`);
                jsCode.push(`// KScript parse error on line ${this.currentLineNumber}: ${line}`);
            }
        }

        // Join the JavaScript code lines
        const result = jsCode.join('\n');
        this.logDebug("Generated JS code: " + result);
        console.log("KScript parsing complete");
        return result;
    }

    /**
     * Parse a single line of KScript
     * @param {string} line - Line to parse
     * @returns {string} - Converted JavaScript line
     */
    parseLine(line) {
        // Check for block start (setup:, draw:, block: or any function:)
        if (line.endsWith(':')) {
            const blockName = line.slice(0, -1).trim();
            
            if (blockName === 'setup') {
                this.insideBlock = true;
                return 'function setup() {';
            } 
            else if (blockName === 'draw') {
                this.insideBlock = true;
                return 'function draw(time) {';
            }
            else if (line.startsWith('block ')) {
                this.insideBlock = true;
                const blockPart = line.substring(6, line.length - 1).trim();
                const commaIndex = blockPart.indexOf(',');
                
                if (commaIndex === -1) {
                    // No parameters
                    return `function ${blockPart}() {`;
                } else {
                    // With parameters
                    const blockName = blockPart.substring(0, commaIndex).trim();
                    const params = this.processParams(blockPart.substring(commaIndex + 1).trim());
                    return `function ${blockName}(${params}) {`;
                }
            }
            else if (line.startsWith('block:')) {
                this.insideBlock = true;
                const blockName = line.substring(6, line.length - 1).trim();
                return `function ${blockName}() {`;
            }
            // Handle custom function definition with parameters
            else if (blockName.includes(',')) {
                this.insideBlock = true;
                const commaIndex = blockName.indexOf(',');
                const funcName = blockName.substring(0, commaIndex).trim();
                const params = this.processParams(blockName.substring(commaIndex + 1).trim());
                return `function ${funcName}(${params}) {`;
            }
            // Handle block with block name only
            else {
                this.insideBlock = true;
                return `function ${blockName}() {`;
            }
        }
        
        // Check for block end
        if (line === 'end setup' || line === 'end draw' || line === 'end block' || line === 'end') {
            this.insideBlock = false;
            return '}';
        }
        
        // Handle if statements
        if (line.startsWith('if ')) {
            return `if (${line.substring(3)}) {`;
        }
        
        // Handle else if statements
        if (line.startsWith('else if ')) {
            return `} else if (${line.substring(8)}) {`;
        }
        
        // Handle else statements
        if (line === 'else') {
            return '} else {';
        }
        
        // Handle while loops
        if (line.startsWith('while ')) {
            return `while (${line.substring(6)}) {`;
        }
        
        // Handle for loops
        if (line.startsWith('for ')) {
            return `for (${line.substring(4)}) {`;
        }

        // Inside a block - process function calls and other statements
        if (this.insideBlock) {
            // Handle assignment inside blocks
            if (line.includes('=') && !line.includes('==') && !line.includes('>=') && !line.includes('<=')) {
                const equalPos = line.indexOf('=');
                const varName = line.substring(0, equalPos).trim();
                let value = line.substring(equalPos + 1).trim();
                
                // Process function calls in the value part
                value = this.processComplexValues(value);
                
                // Check if this is a new variable or property
                if (!varName.includes('.') && !varName.includes('[') && 
                    !this.variableNames.has(varName)) {
                    this.variableNames.add(varName);
                    return `let ${varName} = ${value};`;
                } else {
                    return `${varName} = ${value};`;
                }
            }
            
            // Process standalone function calls and other statements
            return `${this.processComplexValues(line)};`;
        } 
        // Outside block - process variable assignments
        else {
            if (line.includes('=') && !line.includes('==') && !line.includes('>=') && !line.includes('<=')) {
                const equalPos = line.indexOf('=');
                const varName = line.substring(0, equalPos).trim();
                let value = line.substring(equalPos + 1).trim();
                
                // Process function calls in the value part
                value = this.processComplexValues(value);
                
                // Add variable to our tracking set
                this.variableNames.add(varName);
                return `var ${varName} = ${value};`;
            }
            
            // Process other statements
            return `${this.processComplexValues(line)};`;
        }
    }

    /**
     * Process function parameters for function definitions
     * @param {string} paramsStr - String containing parameters
     * @returns {string} - Comma-separated parameter list
     */
    processParams(paramsStr) {
        if (!paramsStr || paramsStr.trim() === '') return '';
        
        // Use commas directly - we're already separating by commas
        return paramsStr.trim();
    }
    
    /**
     * Process complex values, handling function calls and expressions
     * @param {string} value - String to process
     * @returns {string} - Processed string
     */
    processComplexValues(value) {
        try {
            this.logDebug(`Processing value: "${value}"`);
            
            // If the value is empty, return an empty string
            if (!value || value.trim() === '') {
                return '""';
            }
            
            // If it's a quoted string already, return as is
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                return value;
            }
            
            // If the value already has parentheses, it might be a complex JS expression
            if (value.includes('(') && value.includes(')')) {
                return value;
            }
            
            // If there are commas, use comma-based parsing
            if (value.includes(',')) {
                // Handle function calls with commas between arguments
                const parts = this.safeSplitByComma(value);
                if (parts.length > 0) {
                    const funcName = parts[0].trim();
                    
                    // Process each argument properly
                    const processedArgs = parts.slice(1).map(arg => this.processArgument(arg));
                    
                    // Join with commas and ensure proper parentheses
                    const args = processedArgs.join(', ');
                    return `${funcName}(${args})`;
                }
            }
            // If there are spaces, it might be a function call with space-separated args
            else if (value.includes(' ')) {
                const parts = this.safeSplitBySpace(value);
                if (parts.length > 0) {
                    const funcName = parts[0].trim();
                    
                    // Process each argument properly
                    const processedArgs = parts.slice(1).map(arg => this.processArgument(arg));
                    
                    // Join with commas and ensure proper parentheses
                    const args = processedArgs.join(', ');
                    return `${funcName}(${args})`;
                }
            }
            // No spaces or commas - it's likely a simple value/variable
            else {
                // Check if it's a number
                if (!isNaN(value)) {
                    return value;
                }
                
                // Check if it's a common keyword or variable we know
                if (this.commonKeywords.includes(value) || this.variableNames.has(value)) {
                    return value;
                }
                
                // If it's not a recognized variable or keyword and not a number,
                // it might be an unquoted string - add quotes
                if (!value.includes('.') && !value.includes('[')) {
                    return `"${value}"`;
                }
            }
            
            // Default - return as is
            return value;
        } catch (error) {
            console.error(`Error processing value "${value}" at line ${this.currentLineNumber}: ${error.message}`);
            throw new Error(`Error processing value: ${error.message}`);
        }
    }

    /**
     * Process a single argument value
     * @param {string} arg - Argument to process
     * @returns {string} - Processed argument
     */
    processArgument(arg) {
        arg = arg.trim();
        
        // If arg is already a quoted string, return as is
        if ((arg.startsWith('"') && arg.endsWith('"')) || 
            (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg;
        }
        
        // If it's a number, return as is
        if (!isNaN(arg)) {
            return arg;
        }
        
        // Check if it's a common keyword or variable we know
        if (this.commonKeywords.includes(arg) || this.variableNames.has(arg)) {
            return arg;
        }
        
        // Otherwise add quotes if it doesn't contain operators
        if (!arg.includes('+') && !arg.includes('-') && 
            !arg.includes('*') && !arg.includes('/') &&
            !arg.includes('.') && !arg.includes('[')) {
            return `"${arg}"`;
        }
        
        return arg;
    }
    
    /**
     * Safely split a string by commas while respecting quoted strings
     * @param {string} str - String to split
     * @returns {string[]} - Array of parts
     */
    safeSplitByComma(str) {
        try {
            const parts = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                
                // Check for quote characters, avoiding escaped quotes
                const isQuoteChar = (char === '"' || char === "'");
                const isEscaped = (i > 0 && str[i-1] === '\\');
                
                if (isQuoteChar && !isEscaped) {
                    // Toggle quote state
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                        current += char;
                    } else if (char === quoteChar) {
                        inQuotes = false;
                        quoteChar = '';
                        current += char;
                    } else {
                        // Different quote character inside quotes
                        current += char;
                    }
                } else if (char === ',' && !inQuotes) {
                    // Comma outside quotes - split
                    if (current || parts.length > 0) { // Allow empty parts if not the first one
                        parts.push(current);
                        current = '';
                    }
                } else {
                    // Add any other character
                    current += char;
                }
            }
            
            // Add the last part if it exists
            if (current || parts.length > 0) {
                parts.push(current);
            }
            
            return parts;
        } catch (error) {
            console.error(`Error in safeSplitByComma at line ${this.currentLineNumber}: ${error.message}`);
            throw new Error(`Parsing error in safeSplitByComma: ${error.message}`);
        }
    }
    
    /**
     * Safely split a string by spaces while respecting quoted strings
     * @param {string} str - String to split
     * @returns {string[]} - Array of parts
     */
    safeSplitBySpace(str) {
        try {
            const parts = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                
                // Check for quote characters, avoiding escaped quotes
                const isQuoteChar = (char === '"' || char === "'");
                const isEscaped = (i > 0 && str[i-1] === '\\');
                
                if (isQuoteChar && !isEscaped) {
                    // Toggle quote state
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                        current += char;
                    } else if (char === quoteChar) {
                        inQuotes = false;
                        quoteChar = '';
                        current += char;
                    } else {
                        // Different quote character inside quotes
                        current += char;
                    }
                } else if (char === ' ' && !inQuotes) {
                    // Space outside quotes - split
                    if (current) {
                        parts.push(current);
                        current = '';
                    }
                } else {
                    // Add any other character
                    current += char;
                }
            }
            
            // Add the last part if it exists
            if (current) {
                parts.push(current);
            }
            
            return parts;
        } catch (error) {
            console.error(`Error in safeSplitBySpace at line ${this.currentLineNumber}: ${error.message}`);
            throw new Error(`Parsing error in safeSplitBySpace: ${error.message}`);
        }
    }
}

// Create a singleton instance
window.kscriptParser = new KScriptParser();