/*!
  * vue-i18n-bridge v9.2.0-beta.38
  * (c) 2022 kazuya kawaguchi
  * Released under the MIT License.
  */
var VueI18nBridge = (function (exports, vueDemi) {
  'use strict';

  /**
   * Original Utilities
   * written by kazuya kawaguchi
   */
  const inBrowser = typeof window !== 'undefined';
  let mark;
  {
      const perf = inBrowser && window.performance;
      if (perf &&
          perf.mark &&
          perf.measure &&
          perf.clearMarks &&
          perf.clearMeasures) {
          mark = (tag) => perf.mark(tag);
      }
  }
  const RE_ARGS = /\{([0-9a-zA-Z]+)\}/g;
  /* eslint-disable */
  function format(message, ...args) {
      if (args.length === 1 && isObject(args[0])) {
          args = args[0];
      }
      if (!args || !args.hasOwnProperty) {
          args = {};
      }
      return message.replace(RE_ARGS, (match, identifier) => {
          return args.hasOwnProperty(identifier) ? args[identifier] : '';
      });
  }
  const hasSymbol = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
  const makeSymbol = (name) => hasSymbol ? Symbol(name) : name;
  const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
  const friendlyJSONstringify = (json) => JSON.stringify(json)
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
      .replace(/\u0027/g, '\\u0027');
  const isNumber = (val) => typeof val === 'number' && isFinite(val);
  const isDate = (val) => toTypeString(val) === '[object Date]';
  const isRegExp = (val) => toTypeString(val) === '[object RegExp]';
  const isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
  function warn(msg, err) {
      if (typeof console !== 'undefined') {
          console.warn(`[intlify] ` + msg);
          /* istanbul ignore if */
          if (err) {
              console.warn(err.stack);
          }
      }
  }
  const assign = Object.assign;
  let _globalThis;
  const getGlobalThis = () => {
      // prettier-ignore
      return (_globalThis ||
          (_globalThis =
              typeof globalThis !== 'undefined'
                  ? globalThis
                  : typeof self !== 'undefined'
                      ? self
                      : typeof window !== 'undefined'
                          ? window
                          : typeof global !== 'undefined'
                              ? global
                              : {}));
  };
  function escapeHtml(rawText) {
      return rawText
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
  }
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn(obj, key) {
      return hasOwnProperty.call(obj, key);
  }
  /* eslint-enable */
  /**
   * Useful Utilities By Evan you
   * Modified by kazuya kawaguchi
   * MIT License
   * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
   * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
   */
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === 'function';
  const isString = (val) => typeof val === 'string';
  const isBoolean = (val) => typeof val === 'boolean';
  const isObject = (val) => // eslint-disable-line
   val !== null && typeof val === 'object';
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const isPlainObject = (val) => toTypeString(val) === '[object Object]';
  // for converting list and named values to displayed strings.
  const toDisplayString = (val) => {
      return val == null
          ? ''
          : isArray(val) || (isPlainObject(val) && val.toString === objectToString)
              ? JSON.stringify(val, null, 2)
              : String(val);
  };

  const CompileErrorCodes = {
      // tokenizer error codes
      EXPECTED_TOKEN: 1,
      INVALID_TOKEN_IN_PLACEHOLDER: 2,
      UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3,
      UNKNOWN_ESCAPE_SEQUENCE: 4,
      INVALID_UNICODE_ESCAPE_SEQUENCE: 5,
      UNBALANCED_CLOSING_BRACE: 6,
      UNTERMINATED_CLOSING_BRACE: 7,
      EMPTY_PLACEHOLDER: 8,
      NOT_ALLOW_NEST_PLACEHOLDER: 9,
      INVALID_LINKED_FORMAT: 10,
      // parser error codes
      MUST_HAVE_MESSAGES_IN_PLURAL: 11,
      UNEXPECTED_EMPTY_LINKED_MODIFIER: 12,
      UNEXPECTED_EMPTY_LINKED_KEY: 13,
      UNEXPECTED_LEXICAL_ANALYSIS: 14,
      // Special value for higher-order compilers to pick up the last code
      // to avoid collision of error codes. This should always be kept as the last
      // item.
      __EXTEND_POINT__: 15
  };
  /** @internal */
  const errorMessages$2 = {
      // tokenizer error messages
      [CompileErrorCodes.EXPECTED_TOKEN]: `Expected token: '{0}'`,
      [CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER]: `Invalid token in placeholder: '{0}'`,
      [CompileErrorCodes.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER]: `Unterminated single quote in placeholder`,
      [CompileErrorCodes.UNKNOWN_ESCAPE_SEQUENCE]: `Unknown escape sequence: \\{0}`,
      [CompileErrorCodes.INVALID_UNICODE_ESCAPE_SEQUENCE]: `Invalid unicode escape sequence: {0}`,
      [CompileErrorCodes.UNBALANCED_CLOSING_BRACE]: `Unbalanced closing brace`,
      [CompileErrorCodes.UNTERMINATED_CLOSING_BRACE]: `Unterminated closing brace`,
      [CompileErrorCodes.EMPTY_PLACEHOLDER]: `Empty placeholder`,
      [CompileErrorCodes.NOT_ALLOW_NEST_PLACEHOLDER]: `Not allowed nest placeholder`,
      [CompileErrorCodes.INVALID_LINKED_FORMAT]: `Invalid linked format`,
      // parser error messages
      [CompileErrorCodes.MUST_HAVE_MESSAGES_IN_PLURAL]: `Plural must have messages`,
      [CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_MODIFIER]: `Unexpected empty linked modifier`,
      [CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_KEY]: `Unexpected empty linked key`,
      [CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS]: `Unexpected lexical analysis in token: '{0}'`
  };
  function createCompileError(code, loc, options = {}) {
      const { domain, messages, args } = options;
      const msg = format((messages || errorMessages$2)[code] || '', ...(args || []))
          ;
      const error = new SyntaxError(String(msg));
      error.code = code;
      if (loc) {
          error.location = loc;
      }
      error.domain = domain;
      return error;
  }
  /** @internal */
  function defaultOnError(error) {
      throw error;
  }

  function createPosition(line, column, offset) {
      return { line, column, offset };
  }
  function createLocation(start, end, source) {
      const loc = { start, end };
      if (source != null) {
          loc.source = source;
      }
      return loc;
  }

  const CHAR_SP = ' ';
  const CHAR_CR = '\r';
  const CHAR_LF = '\n';
  const CHAR_LS = String.fromCharCode(0x2028);
  const CHAR_PS = String.fromCharCode(0x2029);
  function createScanner(str) {
      const _buf = str;
      let _index = 0;
      let _line = 1;
      let _column = 1;
      let _peekOffset = 0;
      const isCRLF = (index) => _buf[index] === CHAR_CR && _buf[index + 1] === CHAR_LF;
      const isLF = (index) => _buf[index] === CHAR_LF;
      const isPS = (index) => _buf[index] === CHAR_PS;
      const isLS = (index) => _buf[index] === CHAR_LS;
      const isLineEnd = (index) => isCRLF(index) || isLF(index) || isPS(index) || isLS(index);
      const index = () => _index;
      const line = () => _line;
      const column = () => _column;
      const peekOffset = () => _peekOffset;
      const charAt = (offset) => isCRLF(offset) || isPS(offset) || isLS(offset) ? CHAR_LF : _buf[offset];
      const currentChar = () => charAt(_index);
      const currentPeek = () => charAt(_index + _peekOffset);
      function next() {
          _peekOffset = 0;
          if (isLineEnd(_index)) {
              _line++;
              _column = 0;
          }
          if (isCRLF(_index)) {
              _index++;
          }
          _index++;
          _column++;
          return _buf[_index];
      }
      function peek() {
          if (isCRLF(_index + _peekOffset)) {
              _peekOffset++;
          }
          _peekOffset++;
          return _buf[_index + _peekOffset];
      }
      function reset() {
          _index = 0;
          _line = 1;
          _column = 1;
          _peekOffset = 0;
      }
      function resetPeek(offset = 0) {
          _peekOffset = offset;
      }
      function skipToPeek() {
          const target = _index + _peekOffset;
          // eslint-disable-next-line no-unmodified-loop-condition
          while (target !== _index) {
              next();
          }
          _peekOffset = 0;
      }
      return {
          index,
          line,
          column,
          peekOffset,
          charAt,
          currentChar,
          currentPeek,
          next,
          peek,
          reset,
          resetPeek,
          skipToPeek
      };
  }

  const EOF = undefined;
  const LITERAL_DELIMITER = "'";
  const ERROR_DOMAIN$1 = 'tokenizer';
  function createTokenizer(source, options = {}) {
      const location = options.location !== false;
      const _scnr = createScanner(source);
      const currentOffset = () => _scnr.index();
      const currentPosition = () => createPosition(_scnr.line(), _scnr.column(), _scnr.index());
      const _initLoc = currentPosition();
      const _initOffset = currentOffset();
      const _context = {
          currentType: 14 /* EOF */,
          offset: _initOffset,
          startLoc: _initLoc,
          endLoc: _initLoc,
          lastType: 14 /* EOF */,
          lastOffset: _initOffset,
          lastStartLoc: _initLoc,
          lastEndLoc: _initLoc,
          braceNest: 0,
          inLinked: false,
          text: ''
      };
      const context = () => _context;
      const { onError } = options;
      function emitError(code, pos, offset, ...args) {
          const ctx = context();
          pos.column += offset;
          pos.offset += offset;
          if (onError) {
              const loc = createLocation(ctx.startLoc, pos);
              const err = createCompileError(code, loc, {
                  domain: ERROR_DOMAIN$1,
                  args
              });
              onError(err);
          }
      }
      function getToken(context, type, value) {
          context.endLoc = currentPosition();
          context.currentType = type;
          const token = { type };
          if (location) {
              token.loc = createLocation(context.startLoc, context.endLoc);
          }
          if (value != null) {
              token.value = value;
          }
          return token;
      }
      const getEndToken = (context) => getToken(context, 14 /* EOF */);
      function eat(scnr, ch) {
          if (scnr.currentChar() === ch) {
              scnr.next();
              return ch;
          }
          else {
              emitError(CompileErrorCodes.EXPECTED_TOKEN, currentPosition(), 0, ch);
              return '';
          }
      }
      function peekSpaces(scnr) {
          let buf = '';
          while (scnr.currentPeek() === CHAR_SP || scnr.currentPeek() === CHAR_LF) {
              buf += scnr.currentPeek();
              scnr.peek();
          }
          return buf;
      }
      function skipSpaces(scnr) {
          const buf = peekSpaces(scnr);
          scnr.skipToPeek();
          return buf;
      }
      function isIdentifierStart(ch) {
          if (ch === EOF) {
              return false;
          }
          const cc = ch.charCodeAt(0);
          return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) || // A-Z
              cc === 95 // _
          );
      }
      function isNumberStart(ch) {
          if (ch === EOF) {
              return false;
          }
          const cc = ch.charCodeAt(0);
          return cc >= 48 && cc <= 57; // 0-9
      }
      function isNamedIdentifierStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 2 /* BraceLeft */) {
              return false;
          }
          peekSpaces(scnr);
          const ret = isIdentifierStart(scnr.currentPeek());
          scnr.resetPeek();
          return ret;
      }
      function isListIdentifierStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 2 /* BraceLeft */) {
              return false;
          }
          peekSpaces(scnr);
          const ch = scnr.currentPeek() === '-' ? scnr.peek() : scnr.currentPeek();
          const ret = isNumberStart(ch);
          scnr.resetPeek();
          return ret;
      }
      function isLiteralStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 2 /* BraceLeft */) {
              return false;
          }
          peekSpaces(scnr);
          const ret = scnr.currentPeek() === LITERAL_DELIMITER;
          scnr.resetPeek();
          return ret;
      }
      function isLinkedDotStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 8 /* LinkedAlias */) {
              return false;
          }
          peekSpaces(scnr);
          const ret = scnr.currentPeek() === "." /* LinkedDot */;
          scnr.resetPeek();
          return ret;
      }
      function isLinkedModifierStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 9 /* LinkedDot */) {
              return false;
          }
          peekSpaces(scnr);
          const ret = isIdentifierStart(scnr.currentPeek());
          scnr.resetPeek();
          return ret;
      }
      function isLinkedDelimiterStart(scnr, context) {
          const { currentType } = context;
          if (!(currentType === 8 /* LinkedAlias */ ||
              currentType === 12 /* LinkedModifier */)) {
              return false;
          }
          peekSpaces(scnr);
          const ret = scnr.currentPeek() === ":" /* LinkedDelimiter */;
          scnr.resetPeek();
          return ret;
      }
      function isLinkedReferStart(scnr, context) {
          const { currentType } = context;
          if (currentType !== 10 /* LinkedDelimiter */) {
              return false;
          }
          const fn = () => {
              const ch = scnr.currentPeek();
              if (ch === "{" /* BraceLeft */) {
                  return isIdentifierStart(scnr.peek());
              }
              else if (ch === "@" /* LinkedAlias */ ||
                  ch === "%" /* Modulo */ ||
                  ch === "|" /* Pipe */ ||
                  ch === ":" /* LinkedDelimiter */ ||
                  ch === "." /* LinkedDot */ ||
                  ch === CHAR_SP ||
                  !ch) {
                  return false;
              }
              else if (ch === CHAR_LF) {
                  scnr.peek();
                  return fn();
              }
              else {
                  // other characters
                  return isIdentifierStart(ch);
              }
          };
          const ret = fn();
          scnr.resetPeek();
          return ret;
      }
      function isPluralStart(scnr) {
          peekSpaces(scnr);
          const ret = scnr.currentPeek() === "|" /* Pipe */;
          scnr.resetPeek();
          return ret;
      }
      function detectModuloStart(scnr) {
          const spaces = peekSpaces(scnr);
          const ret = scnr.currentPeek() === "%" /* Modulo */ &&
              scnr.peek() === "{" /* BraceLeft */;
          scnr.resetPeek();
          return {
              isModulo: ret,
              hasSpace: spaces.length > 0
          };
      }
      function isTextStart(scnr, reset = true) {
          const fn = (hasSpace = false, prev = '', detectModulo = false) => {
              const ch = scnr.currentPeek();
              if (ch === "{" /* BraceLeft */) {
                  return prev === "%" /* Modulo */ ? false : hasSpace;
              }
              else if (ch === "@" /* LinkedAlias */ || !ch) {
                  return prev === "%" /* Modulo */ ? true : hasSpace;
              }
              else if (ch === "%" /* Modulo */) {
                  scnr.peek();
                  return fn(hasSpace, "%" /* Modulo */, true);
              }
              else if (ch === "|" /* Pipe */) {
                  return prev === "%" /* Modulo */ || detectModulo
                      ? true
                      : !(prev === CHAR_SP || prev === CHAR_LF);
              }
              else if (ch === CHAR_SP) {
                  scnr.peek();
                  return fn(true, CHAR_SP, detectModulo);
              }
              else if (ch === CHAR_LF) {
                  scnr.peek();
                  return fn(true, CHAR_LF, detectModulo);
              }
              else {
                  return true;
              }
          };
          const ret = fn();
          reset && scnr.resetPeek();
          return ret;
      }
      function takeChar(scnr, fn) {
          const ch = scnr.currentChar();
          if (ch === EOF) {
              return EOF;
          }
          if (fn(ch)) {
              scnr.next();
              return ch;
          }
          return null;
      }
      function takeIdentifierChar(scnr) {
          const closure = (ch) => {
              const cc = ch.charCodeAt(0);
              return ((cc >= 97 && cc <= 122) || // a-z
                  (cc >= 65 && cc <= 90) || // A-Z
                  (cc >= 48 && cc <= 57) || // 0-9
                  cc === 95 || // _
                  cc === 36 // $
              );
          };
          return takeChar(scnr, closure);
      }
      function takeDigit(scnr) {
          const closure = (ch) => {
              const cc = ch.charCodeAt(0);
              return cc >= 48 && cc <= 57; // 0-9
          };
          return takeChar(scnr, closure);
      }
      function takeHexDigit(scnr) {
          const closure = (ch) => {
              const cc = ch.charCodeAt(0);
              return ((cc >= 48 && cc <= 57) || // 0-9
                  (cc >= 65 && cc <= 70) || // A-F
                  (cc >= 97 && cc <= 102)); // a-f
          };
          return takeChar(scnr, closure);
      }
      function getDigits(scnr) {
          let ch = '';
          let num = '';
          while ((ch = takeDigit(scnr))) {
              num += ch;
          }
          return num;
      }
      function readModulo(scnr) {
          skipSpaces(scnr);
          const ch = scnr.currentChar();
          if (ch !== "%" /* Modulo */) {
              emitError(CompileErrorCodes.EXPECTED_TOKEN, currentPosition(), 0, ch);
          }
          scnr.next();
          return "%" /* Modulo */;
      }
      function readText(scnr) {
          let buf = '';
          while (true) {
              const ch = scnr.currentChar();
              if (ch === "{" /* BraceLeft */ ||
                  ch === "}" /* BraceRight */ ||
                  ch === "@" /* LinkedAlias */ ||
                  ch === "|" /* Pipe */ ||
                  !ch) {
                  break;
              }
              else if (ch === "%" /* Modulo */) {
                  if (isTextStart(scnr)) {
                      buf += ch;
                      scnr.next();
                  }
                  else {
                      break;
                  }
              }
              else if (ch === CHAR_SP || ch === CHAR_LF) {
                  if (isTextStart(scnr)) {
                      buf += ch;
                      scnr.next();
                  }
                  else if (isPluralStart(scnr)) {
                      break;
                  }
                  else {
                      buf += ch;
                      scnr.next();
                  }
              }
              else {
                  buf += ch;
                  scnr.next();
              }
          }
          return buf;
      }
      function readNamedIdentifier(scnr) {
          skipSpaces(scnr);
          let ch = '';
          let name = '';
          while ((ch = takeIdentifierChar(scnr))) {
              name += ch;
          }
          if (scnr.currentChar() === EOF) {
              emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
          }
          return name;
      }
      function readListIdentifier(scnr) {
          skipSpaces(scnr);
          let value = '';
          if (scnr.currentChar() === '-') {
              scnr.next();
              value += `-${getDigits(scnr)}`;
          }
          else {
              value += getDigits(scnr);
          }
          if (scnr.currentChar() === EOF) {
              emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
          }
          return value;
      }
      function readLiteral(scnr) {
          skipSpaces(scnr);
          eat(scnr, `\'`);
          let ch = '';
          let literal = '';
          const fn = (x) => x !== LITERAL_DELIMITER && x !== CHAR_LF;
          while ((ch = takeChar(scnr, fn))) {
              if (ch === '\\') {
                  literal += readEscapeSequence(scnr);
              }
              else {
                  literal += ch;
              }
          }
          const current = scnr.currentChar();
          if (current === CHAR_LF || current === EOF) {
              emitError(CompileErrorCodes.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, currentPosition(), 0);
              // TODO: Is it correct really?
              if (current === CHAR_LF) {
                  scnr.next();
                  eat(scnr, `\'`);
              }
              return literal;
          }
          eat(scnr, `\'`);
          return literal;
      }
      function readEscapeSequence(scnr) {
          const ch = scnr.currentChar();
          switch (ch) {
              case '\\':
              case `\'`:
                  scnr.next();
                  return `\\${ch}`;
              case 'u':
                  return readUnicodeEscapeSequence(scnr, ch, 4);
              case 'U':
                  return readUnicodeEscapeSequence(scnr, ch, 6);
              default:
                  emitError(CompileErrorCodes.UNKNOWN_ESCAPE_SEQUENCE, currentPosition(), 0, ch);
                  return '';
          }
      }
      function readUnicodeEscapeSequence(scnr, unicode, digits) {
          eat(scnr, unicode);
          let sequence = '';
          for (let i = 0; i < digits; i++) {
              const ch = takeHexDigit(scnr);
              if (!ch) {
                  emitError(CompileErrorCodes.INVALID_UNICODE_ESCAPE_SEQUENCE, currentPosition(), 0, `\\${unicode}${sequence}${scnr.currentChar()}`);
                  break;
              }
              sequence += ch;
          }
          return `\\${unicode}${sequence}`;
      }
      function readInvalidIdentifier(scnr) {
          skipSpaces(scnr);
          let ch = '';
          let identifiers = '';
          const closure = (ch) => ch !== "{" /* BraceLeft */ &&
              ch !== "}" /* BraceRight */ &&
              ch !== CHAR_SP &&
              ch !== CHAR_LF;
          while ((ch = takeChar(scnr, closure))) {
              identifiers += ch;
          }
          return identifiers;
      }
      function readLinkedModifier(scnr) {
          let ch = '';
          let name = '';
          while ((ch = takeIdentifierChar(scnr))) {
              name += ch;
          }
          return name;
      }
      function readLinkedRefer(scnr) {
          const fn = (detect = false, buf) => {
              const ch = scnr.currentChar();
              if (ch === "{" /* BraceLeft */ ||
                  ch === "%" /* Modulo */ ||
                  ch === "@" /* LinkedAlias */ ||
                  ch === "|" /* Pipe */ ||
                  !ch) {
                  return buf;
              }
              else if (ch === CHAR_SP) {
                  return buf;
              }
              else if (ch === CHAR_LF) {
                  buf += ch;
                  scnr.next();
                  return fn(detect, buf);
              }
              else {
                  buf += ch;
                  scnr.next();
                  return fn(true, buf);
              }
          };
          return fn(false, '');
      }
      function readPlural(scnr) {
          skipSpaces(scnr);
          const plural = eat(scnr, "|" /* Pipe */);
          skipSpaces(scnr);
          return plural;
      }
      // TODO: We need refactoring of token parsing ...
      function readTokenInPlaceholder(scnr, context) {
          let token = null;
          const ch = scnr.currentChar();
          switch (ch) {
              case "{" /* BraceLeft */:
                  if (context.braceNest >= 1) {
                      emitError(CompileErrorCodes.NOT_ALLOW_NEST_PLACEHOLDER, currentPosition(), 0);
                  }
                  scnr.next();
                  token = getToken(context, 2 /* BraceLeft */, "{" /* BraceLeft */);
                  skipSpaces(scnr);
                  context.braceNest++;
                  return token;
              case "}" /* BraceRight */:
                  if (context.braceNest > 0 &&
                      context.currentType === 2 /* BraceLeft */) {
                      emitError(CompileErrorCodes.EMPTY_PLACEHOLDER, currentPosition(), 0);
                  }
                  scnr.next();
                  token = getToken(context, 3 /* BraceRight */, "}" /* BraceRight */);
                  context.braceNest--;
                  context.braceNest > 0 && skipSpaces(scnr);
                  if (context.inLinked && context.braceNest === 0) {
                      context.inLinked = false;
                  }
                  return token;
              case "@" /* LinkedAlias */:
                  if (context.braceNest > 0) {
                      emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
                  }
                  token = readTokenInLinked(scnr, context) || getEndToken(context);
                  context.braceNest = 0;
                  return token;
              default:
                  let validNamedIdentifier = true;
                  let validListIdentifier = true;
                  let validLiteral = true;
                  if (isPluralStart(scnr)) {
                      if (context.braceNest > 0) {
                          emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
                      }
                      token = getToken(context, 1 /* Pipe */, readPlural(scnr));
                      // reset
                      context.braceNest = 0;
                      context.inLinked = false;
                      return token;
                  }
                  if (context.braceNest > 0 &&
                      (context.currentType === 5 /* Named */ ||
                          context.currentType === 6 /* List */ ||
                          context.currentType === 7 /* Literal */)) {
                      emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
                      context.braceNest = 0;
                      return readToken(scnr, context);
                  }
                  if ((validNamedIdentifier = isNamedIdentifierStart(scnr, context))) {
                      token = getToken(context, 5 /* Named */, readNamedIdentifier(scnr));
                      skipSpaces(scnr);
                      return token;
                  }
                  if ((validListIdentifier = isListIdentifierStart(scnr, context))) {
                      token = getToken(context, 6 /* List */, readListIdentifier(scnr));
                      skipSpaces(scnr);
                      return token;
                  }
                  if ((validLiteral = isLiteralStart(scnr, context))) {
                      token = getToken(context, 7 /* Literal */, readLiteral(scnr));
                      skipSpaces(scnr);
                      return token;
                  }
                  if (!validNamedIdentifier && !validListIdentifier && !validLiteral) {
                      // TODO: we should be re-designed invalid cases, when we will extend message syntax near the future ...
                      token = getToken(context, 13 /* InvalidPlace */, readInvalidIdentifier(scnr));
                      emitError(CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER, currentPosition(), 0, token.value);
                      skipSpaces(scnr);
                      return token;
                  }
                  break;
          }
          return token;
      }
      // TODO: We need refactoring of token parsing ...
      function readTokenInLinked(scnr, context) {
          const { currentType } = context;
          let token = null;
          const ch = scnr.currentChar();
          if ((currentType === 8 /* LinkedAlias */ ||
              currentType === 9 /* LinkedDot */ ||
              currentType === 12 /* LinkedModifier */ ||
              currentType === 10 /* LinkedDelimiter */) &&
              (ch === CHAR_LF || ch === CHAR_SP)) {
              emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
          }
          switch (ch) {
              case "@" /* LinkedAlias */:
                  scnr.next();
                  token = getToken(context, 8 /* LinkedAlias */, "@" /* LinkedAlias */);
                  context.inLinked = true;
                  return token;
              case "." /* LinkedDot */:
                  skipSpaces(scnr);
                  scnr.next();
                  return getToken(context, 9 /* LinkedDot */, "." /* LinkedDot */);
              case ":" /* LinkedDelimiter */:
                  skipSpaces(scnr);
                  scnr.next();
                  return getToken(context, 10 /* LinkedDelimiter */, ":" /* LinkedDelimiter */);
              default:
                  if (isPluralStart(scnr)) {
                      token = getToken(context, 1 /* Pipe */, readPlural(scnr));
                      // reset
                      context.braceNest = 0;
                      context.inLinked = false;
                      return token;
                  }
                  if (isLinkedDotStart(scnr, context) ||
                      isLinkedDelimiterStart(scnr, context)) {
                      skipSpaces(scnr);
                      return readTokenInLinked(scnr, context);
                  }
                  if (isLinkedModifierStart(scnr, context)) {
                      skipSpaces(scnr);
                      return getToken(context, 12 /* LinkedModifier */, readLinkedModifier(scnr));
                  }
                  if (isLinkedReferStart(scnr, context)) {
                      skipSpaces(scnr);
                      if (ch === "{" /* BraceLeft */) {
                          // scan the placeholder
                          return readTokenInPlaceholder(scnr, context) || token;
                      }
                      else {
                          return getToken(context, 11 /* LinkedKey */, readLinkedRefer(scnr));
                      }
                  }
                  if (currentType === 8 /* LinkedAlias */) {
                      emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
                  }
                  context.braceNest = 0;
                  context.inLinked = false;
                  return readToken(scnr, context);
          }
      }
      // TODO: We need refactoring of token parsing ...
      function readToken(scnr, context) {
          let token = { type: 14 /* EOF */ };
          if (context.braceNest > 0) {
              return readTokenInPlaceholder(scnr, context) || getEndToken(context);
          }
          if (context.inLinked) {
              return readTokenInLinked(scnr, context) || getEndToken(context);
          }
          const ch = scnr.currentChar();
          switch (ch) {
              case "{" /* BraceLeft */:
                  return readTokenInPlaceholder(scnr, context) || getEndToken(context);
              case "}" /* BraceRight */:
                  emitError(CompileErrorCodes.UNBALANCED_CLOSING_BRACE, currentPosition(), 0);
                  scnr.next();
                  return getToken(context, 3 /* BraceRight */, "}" /* BraceRight */);
              case "@" /* LinkedAlias */:
                  return readTokenInLinked(scnr, context) || getEndToken(context);
              default:
                  if (isPluralStart(scnr)) {
                      token = getToken(context, 1 /* Pipe */, readPlural(scnr));
                      // reset
                      context.braceNest = 0;
                      context.inLinked = false;
                      return token;
                  }
                  const { isModulo, hasSpace } = detectModuloStart(scnr);
                  if (isModulo) {
                      return hasSpace
                          ? getToken(context, 0 /* Text */, readText(scnr))
                          : getToken(context, 4 /* Modulo */, readModulo(scnr));
                  }
                  if (isTextStart(scnr)) {
                      return getToken(context, 0 /* Text */, readText(scnr));
                  }
                  break;
          }
          return token;
      }
      function nextToken() {
          const { currentType, offset, startLoc, endLoc } = _context;
          _context.lastType = currentType;
          _context.lastOffset = offset;
          _context.lastStartLoc = startLoc;
          _context.lastEndLoc = endLoc;
          _context.offset = currentOffset();
          _context.startLoc = currentPosition();
          if (_scnr.currentChar() === EOF) {
              return getToken(_context, 14 /* EOF */);
          }
          return readToken(_scnr, _context);
      }
      return {
          nextToken,
          currentOffset,
          currentPosition,
          context
      };
  }

  const ERROR_DOMAIN = 'parser';
  // Backslash backslash, backslash quote, uHHHH, UHHHHHH.
  const KNOWN_ESCAPES = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
  function fromEscapeSequence(match, codePoint4, codePoint6) {
      switch (match) {
          case `\\\\`:
              return `\\`;
          case `\\\'`:
              return `\'`;
          default: {
              const codePoint = parseInt(codePoint4 || codePoint6, 16);
              if (codePoint <= 0xd7ff || codePoint >= 0xe000) {
                  return String.fromCodePoint(codePoint);
              }
              // invalid ...
              // Replace them with U+FFFD REPLACEMENT CHARACTER.
              return '�';
          }
      }
  }
  function createParser(options = {}) {
      const location = options.location !== false;
      const { onError } = options;
      function emitError(tokenzer, code, start, offset, ...args) {
          const end = tokenzer.currentPosition();
          end.offset += offset;
          end.column += offset;
          if (onError) {
              const loc = createLocation(start, end);
              const err = createCompileError(code, loc, {
                  domain: ERROR_DOMAIN,
                  args
              });
              onError(err);
          }
      }
      function startNode(type, offset, loc) {
          const node = {
              type,
              start: offset,
              end: offset
          };
          if (location) {
              node.loc = { start: loc, end: loc };
          }
          return node;
      }
      function endNode(node, offset, pos, type) {
          node.end = offset;
          if (type) {
              node.type = type;
          }
          if (location && node.loc) {
              node.loc.end = pos;
          }
      }
      function parseText(tokenizer, value) {
          const context = tokenizer.context();
          const node = startNode(3 /* Text */, context.offset, context.startLoc);
          node.value = value;
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseList(tokenizer, index) {
          const context = tokenizer.context();
          const { lastOffset: offset, lastStartLoc: loc } = context; // get brace left loc
          const node = startNode(5 /* List */, offset, loc);
          node.index = parseInt(index, 10);
          tokenizer.nextToken(); // skip brach right
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseNamed(tokenizer, key) {
          const context = tokenizer.context();
          const { lastOffset: offset, lastStartLoc: loc } = context; // get brace left loc
          const node = startNode(4 /* Named */, offset, loc);
          node.key = key;
          tokenizer.nextToken(); // skip brach right
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseLiteral(tokenizer, value) {
          const context = tokenizer.context();
          const { lastOffset: offset, lastStartLoc: loc } = context; // get brace left loc
          const node = startNode(9 /* Literal */, offset, loc);
          node.value = value.replace(KNOWN_ESCAPES, fromEscapeSequence);
          tokenizer.nextToken(); // skip brach right
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseLinkedModifier(tokenizer) {
          const token = tokenizer.nextToken();
          const context = tokenizer.context();
          const { lastOffset: offset, lastStartLoc: loc } = context; // get linked dot loc
          const node = startNode(8 /* LinkedModifier */, offset, loc);
          if (token.type !== 12 /* LinkedModifier */) {
              // empty modifier
              emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_MODIFIER, context.lastStartLoc, 0);
              node.value = '';
              endNode(node, offset, loc);
              return {
                  nextConsumeToken: token,
                  node
              };
          }
          // check token
          if (token.value == null) {
              emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          node.value = token.value || '';
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return {
              node
          };
      }
      function parseLinkedKey(tokenizer, value) {
          const context = tokenizer.context();
          const node = startNode(7 /* LinkedKey */, context.offset, context.startLoc);
          node.value = value;
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseLinked(tokenizer) {
          const context = tokenizer.context();
          const linkedNode = startNode(6 /* Linked */, context.offset, context.startLoc);
          let token = tokenizer.nextToken();
          if (token.type === 9 /* LinkedDot */) {
              const parsed = parseLinkedModifier(tokenizer);
              linkedNode.modifier = parsed.node;
              token = parsed.nextConsumeToken || tokenizer.nextToken();
          }
          // asset check token
          if (token.type !== 10 /* LinkedDelimiter */) {
              emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          token = tokenizer.nextToken();
          // skip brace left
          if (token.type === 2 /* BraceLeft */) {
              token = tokenizer.nextToken();
          }
          switch (token.type) {
              case 11 /* LinkedKey */:
                  if (token.value == null) {
                      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                  }
                  linkedNode.key = parseLinkedKey(tokenizer, token.value || '');
                  break;
              case 5 /* Named */:
                  if (token.value == null) {
                      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                  }
                  linkedNode.key = parseNamed(tokenizer, token.value || '');
                  break;
              case 6 /* List */:
                  if (token.value == null) {
                      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                  }
                  linkedNode.key = parseList(tokenizer, token.value || '');
                  break;
              case 7 /* Literal */:
                  if (token.value == null) {
                      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                  }
                  linkedNode.key = parseLiteral(tokenizer, token.value || '');
                  break;
              default:
                  // empty key
                  emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_KEY, context.lastStartLoc, 0);
                  const nextContext = tokenizer.context();
                  const emptyLinkedKeyNode = startNode(7 /* LinkedKey */, nextContext.offset, nextContext.startLoc);
                  emptyLinkedKeyNode.value = '';
                  endNode(emptyLinkedKeyNode, nextContext.offset, nextContext.startLoc);
                  linkedNode.key = emptyLinkedKeyNode;
                  endNode(linkedNode, nextContext.offset, nextContext.startLoc);
                  return {
                      nextConsumeToken: token,
                      node: linkedNode
                  };
          }
          endNode(linkedNode, tokenizer.currentOffset(), tokenizer.currentPosition());
          return {
              node: linkedNode
          };
      }
      function parseMessage(tokenizer) {
          const context = tokenizer.context();
          const startOffset = context.currentType === 1 /* Pipe */
              ? tokenizer.currentOffset()
              : context.offset;
          const startLoc = context.currentType === 1 /* Pipe */
              ? context.endLoc
              : context.startLoc;
          const node = startNode(2 /* Message */, startOffset, startLoc);
          node.items = [];
          let nextToken = null;
          do {
              const token = nextToken || tokenizer.nextToken();
              nextToken = null;
              switch (token.type) {
                  case 0 /* Text */:
                      if (token.value == null) {
                          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                      }
                      node.items.push(parseText(tokenizer, token.value || ''));
                      break;
                  case 6 /* List */:
                      if (token.value == null) {
                          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                      }
                      node.items.push(parseList(tokenizer, token.value || ''));
                      break;
                  case 5 /* Named */:
                      if (token.value == null) {
                          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                      }
                      node.items.push(parseNamed(tokenizer, token.value || ''));
                      break;
                  case 7 /* Literal */:
                      if (token.value == null) {
                          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
                      }
                      node.items.push(parseLiteral(tokenizer, token.value || ''));
                      break;
                  case 8 /* LinkedAlias */:
                      const parsed = parseLinked(tokenizer);
                      node.items.push(parsed.node);
                      nextToken = parsed.nextConsumeToken || null;
                      break;
              }
          } while (context.currentType !== 14 /* EOF */ &&
              context.currentType !== 1 /* Pipe */);
          // adjust message node loc
          const endOffset = context.currentType === 1 /* Pipe */
              ? context.lastOffset
              : tokenizer.currentOffset();
          const endLoc = context.currentType === 1 /* Pipe */
              ? context.lastEndLoc
              : tokenizer.currentPosition();
          endNode(node, endOffset, endLoc);
          return node;
      }
      function parsePlural(tokenizer, offset, loc, msgNode) {
          const context = tokenizer.context();
          let hasEmptyMessage = msgNode.items.length === 0;
          const node = startNode(1 /* Plural */, offset, loc);
          node.cases = [];
          node.cases.push(msgNode);
          do {
              const msg = parseMessage(tokenizer);
              if (!hasEmptyMessage) {
                  hasEmptyMessage = msg.items.length === 0;
              }
              node.cases.push(msg);
          } while (context.currentType !== 14 /* EOF */);
          if (hasEmptyMessage) {
              emitError(tokenizer, CompileErrorCodes.MUST_HAVE_MESSAGES_IN_PLURAL, loc, 0);
          }
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      function parseResource(tokenizer) {
          const context = tokenizer.context();
          const { offset, startLoc } = context;
          const msgNode = parseMessage(tokenizer);
          if (context.currentType === 14 /* EOF */) {
              return msgNode;
          }
          else {
              return parsePlural(tokenizer, offset, startLoc, msgNode);
          }
      }
      function parse(source) {
          const tokenizer = createTokenizer(source, assign({}, options));
          const context = tokenizer.context();
          const node = startNode(0 /* Resource */, context.offset, context.startLoc);
          if (location && node.loc) {
              node.loc.source = source;
          }
          node.body = parseResource(tokenizer);
          // assert whether achieved to EOF
          if (context.currentType !== 14 /* EOF */) {
              emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, source[context.offset] || '');
          }
          endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
          return node;
      }
      return { parse };
  }
  function getTokenCaption(token) {
      if (token.type === 14 /* EOF */) {
          return 'EOF';
      }
      const name = (token.value || '').replace(/\r?\n/gu, '\\n');
      return name.length > 10 ? name.slice(0, 9) + '…' : name;
  }

  function createTransformer(ast, options = {} // eslint-disable-line
  ) {
      const _context = {
          ast,
          helpers: new Set()
      };
      const context = () => _context;
      const helper = (name) => {
          _context.helpers.add(name);
          return name;
      };
      return { context, helper };
  }
  function traverseNodes(nodes, transformer) {
      for (let i = 0; i < nodes.length; i++) {
          traverseNode(nodes[i], transformer);
      }
  }
  function traverseNode(node, transformer) {
      // TODO: if we need pre-hook of transform, should be implemented to here
      switch (node.type) {
          case 1 /* Plural */:
              traverseNodes(node.cases, transformer);
              transformer.helper("plural" /* PLURAL */);
              break;
          case 2 /* Message */:
              traverseNodes(node.items, transformer);
              break;
          case 6 /* Linked */:
              const linked = node;
              traverseNode(linked.key, transformer);
              transformer.helper("linked" /* LINKED */);
              transformer.helper("type" /* TYPE */);
              break;
          case 5 /* List */:
              transformer.helper("interpolate" /* INTERPOLATE */);
              transformer.helper("list" /* LIST */);
              break;
          case 4 /* Named */:
              transformer.helper("interpolate" /* INTERPOLATE */);
              transformer.helper("named" /* NAMED */);
              break;
      }
      // TODO: if we need post-hook of transform, should be implemented to here
  }
  // transform AST
  function transform(ast, options = {} // eslint-disable-line
  ) {
      const transformer = createTransformer(ast);
      transformer.helper("normalize" /* NORMALIZE */);
      // traverse
      ast.body && traverseNode(ast.body, transformer);
      // set meta information
      const context = transformer.context();
      ast.helpers = Array.from(context.helpers);
  }

  function createCodeGenerator(ast, options) {
      const { sourceMap, filename, breakLineCode, needIndent: _needIndent } = options;
      const _context = {
          source: ast.loc.source,
          filename,
          code: '',
          column: 1,
          line: 1,
          offset: 0,
          map: undefined,
          breakLineCode,
          needIndent: _needIndent,
          indentLevel: 0
      };
      const context = () => _context;
      function push(code, node) {
          _context.code += code;
      }
      function _newline(n, withBreakLine = true) {
          const _breakLineCode = withBreakLine ? breakLineCode : '';
          push(_needIndent ? _breakLineCode + `  `.repeat(n) : _breakLineCode);
      }
      function indent(withNewLine = true) {
          const level = ++_context.indentLevel;
          withNewLine && _newline(level);
      }
      function deindent(withNewLine = true) {
          const level = --_context.indentLevel;
          withNewLine && _newline(level);
      }
      function newline() {
          _newline(_context.indentLevel);
      }
      const helper = (key) => `_${key}`;
      const needIndent = () => _context.needIndent;
      return {
          context,
          push,
          indent,
          deindent,
          newline,
          helper,
          needIndent
      };
  }
  function generateLinkedNode(generator, node) {
      const { helper } = generator;
      generator.push(`${helper("linked" /* LINKED */)}(`);
      generateNode(generator, node.key);
      if (node.modifier) {
          generator.push(`, `);
          generateNode(generator, node.modifier);
          generator.push(`, _type`);
      }
      else {
          generator.push(`, undefined, _type`);
      }
      generator.push(`)`);
  }
  function generateMessageNode(generator, node) {
      const { helper, needIndent } = generator;
      generator.push(`${helper("normalize" /* NORMALIZE */)}([`);
      generator.indent(needIndent());
      const length = node.items.length;
      for (let i = 0; i < length; i++) {
          generateNode(generator, node.items[i]);
          if (i === length - 1) {
              break;
          }
          generator.push(', ');
      }
      generator.deindent(needIndent());
      generator.push('])');
  }
  function generatePluralNode(generator, node) {
      const { helper, needIndent } = generator;
      if (node.cases.length > 1) {
          generator.push(`${helper("plural" /* PLURAL */)}([`);
          generator.indent(needIndent());
          const length = node.cases.length;
          for (let i = 0; i < length; i++) {
              generateNode(generator, node.cases[i]);
              if (i === length - 1) {
                  break;
              }
              generator.push(', ');
          }
          generator.deindent(needIndent());
          generator.push(`])`);
      }
  }
  function generateResource(generator, node) {
      if (node.body) {
          generateNode(generator, node.body);
      }
      else {
          generator.push('null');
      }
  }
  function generateNode(generator, node) {
      const { helper } = generator;
      switch (node.type) {
          case 0 /* Resource */:
              generateResource(generator, node);
              break;
          case 1 /* Plural */:
              generatePluralNode(generator, node);
              break;
          case 2 /* Message */:
              generateMessageNode(generator, node);
              break;
          case 6 /* Linked */:
              generateLinkedNode(generator, node);
              break;
          case 8 /* LinkedModifier */:
              generator.push(JSON.stringify(node.value), node);
              break;
          case 7 /* LinkedKey */:
              generator.push(JSON.stringify(node.value), node);
              break;
          case 5 /* List */:
              generator.push(`${helper("interpolate" /* INTERPOLATE */)}(${helper("list" /* LIST */)}(${node.index}))`, node);
              break;
          case 4 /* Named */:
              generator.push(`${helper("interpolate" /* INTERPOLATE */)}(${helper("named" /* NAMED */)}(${JSON.stringify(node.key)}))`, node);
              break;
          case 9 /* Literal */:
              generator.push(JSON.stringify(node.value), node);
              break;
          case 3 /* Text */:
              generator.push(JSON.stringify(node.value), node);
              break;
          default:
              {
                  throw new Error(`unhandled codegen node type: ${node.type}`);
              }
      }
  }
  // generate code from AST
  const generate = (ast, options = {} // eslint-disable-line
  ) => {
      const mode = isString(options.mode) ? options.mode : 'normal';
      const filename = isString(options.filename)
          ? options.filename
          : 'message.intl';
      const sourceMap = !!options.sourceMap;
      // prettier-ignore
      const breakLineCode = options.breakLineCode != null
          ? options.breakLineCode
          : mode === 'arrow'
              ? ';'
              : '\n';
      const needIndent = options.needIndent ? options.needIndent : mode !== 'arrow';
      const helpers = ast.helpers || [];
      const generator = createCodeGenerator(ast, {
          mode,
          filename,
          sourceMap,
          breakLineCode,
          needIndent
      });
      generator.push(mode === 'normal' ? `function __msg__ (ctx) {` : `(ctx) => {`);
      generator.indent(needIndent);
      if (helpers.length > 0) {
          generator.push(`const { ${helpers.map(s => `${s}: _${s}`).join(', ')} } = ctx`);
          generator.newline();
      }
      generator.push(`return `);
      generateNode(generator, ast);
      generator.deindent(needIndent);
      generator.push(`}`);
      const { code, map } = generator.context();
      return {
          ast,
          code,
          map: map ? map.toJSON() : undefined // eslint-disable-line @typescript-eslint/no-explicit-any
      };
  };

  function baseCompile(source, options = {}) {
      const assignedOptions = assign({}, options);
      // parse source codes
      const parser = createParser(assignedOptions);
      const ast = parser.parse(source);
      // transform ASTs
      transform(ast, assignedOptions);
      // generate javascript codes
      return generate(ast, assignedOptions);
  }

  const pathStateMachine =  [];
  pathStateMachine[0 /* BEFORE_PATH */] = {
      ["w" /* WORKSPACE */]: [0 /* BEFORE_PATH */],
      ["i" /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
      ["[" /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */],
      ["o" /* END_OF_FAIL */]: [7 /* AFTER_PATH */]
  };
  pathStateMachine[1 /* IN_PATH */] = {
      ["w" /* WORKSPACE */]: [1 /* IN_PATH */],
      ["." /* DOT */]: [2 /* BEFORE_IDENT */],
      ["[" /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */],
      ["o" /* END_OF_FAIL */]: [7 /* AFTER_PATH */]
  };
  pathStateMachine[2 /* BEFORE_IDENT */] = {
      ["w" /* WORKSPACE */]: [2 /* BEFORE_IDENT */],
      ["i" /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
      ["0" /* ZERO */]: [3 /* IN_IDENT */, 0 /* APPEND */]
  };
  pathStateMachine[3 /* IN_IDENT */] = {
      ["i" /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
      ["0" /* ZERO */]: [3 /* IN_IDENT */, 0 /* APPEND */],
      ["w" /* WORKSPACE */]: [1 /* IN_PATH */, 1 /* PUSH */],
      ["." /* DOT */]: [2 /* BEFORE_IDENT */, 1 /* PUSH */],
      ["[" /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */, 1 /* PUSH */],
      ["o" /* END_OF_FAIL */]: [7 /* AFTER_PATH */, 1 /* PUSH */]
  };
  pathStateMachine[4 /* IN_SUB_PATH */] = {
      ["'" /* SINGLE_QUOTE */]: [5 /* IN_SINGLE_QUOTE */, 0 /* APPEND */],
      ["\"" /* DOUBLE_QUOTE */]: [6 /* IN_DOUBLE_QUOTE */, 0 /* APPEND */],
      ["[" /* LEFT_BRACKET */]: [
          4 /* IN_SUB_PATH */,
          2 /* INC_SUB_PATH_DEPTH */
      ],
      ["]" /* RIGHT_BRACKET */]: [1 /* IN_PATH */, 3 /* PUSH_SUB_PATH */],
      ["o" /* END_OF_FAIL */]: 8 /* ERROR */,
      ["l" /* ELSE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */]
  };
  pathStateMachine[5 /* IN_SINGLE_QUOTE */] = {
      ["'" /* SINGLE_QUOTE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */],
      ["o" /* END_OF_FAIL */]: 8 /* ERROR */,
      ["l" /* ELSE */]: [5 /* IN_SINGLE_QUOTE */, 0 /* APPEND */]
  };
  pathStateMachine[6 /* IN_DOUBLE_QUOTE */] = {
      ["\"" /* DOUBLE_QUOTE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */],
      ["o" /* END_OF_FAIL */]: 8 /* ERROR */,
      ["l" /* ELSE */]: [6 /* IN_DOUBLE_QUOTE */, 0 /* APPEND */]
  };
  /**
   * Check if an expression is a literal value.
   */
  const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
  function isLiteral(exp) {
      return literalValueRE.test(exp);
  }
  /**
   * Strip quotes from a string
   */
  function stripQuotes(str) {
      const a = str.charCodeAt(0);
      const b = str.charCodeAt(str.length - 1);
      return a === b && (a === 0x22 || a === 0x27) ? str.slice(1, -1) : str;
  }
  /**
   * Determine the type of a character in a keypath.
   */
  function getPathCharType(ch) {
      if (ch === undefined || ch === null) {
          return "o" /* END_OF_FAIL */;
      }
      const code = ch.charCodeAt(0);
      switch (code) {
          case 0x5b: // [
          case 0x5d: // ]
          case 0x2e: // .
          case 0x22: // "
          case 0x27: // '
              return ch;
          case 0x5f: // _
          case 0x24: // $
          case 0x2d: // -
              return "i" /* IDENT */;
          case 0x09: // Tab (HT)
          case 0x0a: // Newline (LF)
          case 0x0d: // Return (CR)
          case 0xa0: // No-break space (NBSP)
          case 0xfeff: // Byte Order Mark (BOM)
          case 0x2028: // Line Separator (LS)
          case 0x2029: // Paragraph Separator (PS)
              return "w" /* WORKSPACE */;
      }
      return "i" /* IDENT */;
  }
  /**
   * Format a subPath, return its plain form if it is
   * a literal string or number. Otherwise prepend the
   * dynamic indicator (*).
   */
  function formatSubPath(path) {
      const trimmed = path.trim();
      // invalid leading 0
      if (path.charAt(0) === '0' && isNaN(parseInt(path))) {
          return false;
      }
      return isLiteral(trimmed)
          ? stripQuotes(trimmed)
          : "*" /* ASTARISK */ + trimmed;
  }
  /**
   * Parse a string path into an array of segments
   */
  function parse(path) {
      const keys = [];
      let index = -1;
      let mode = 0 /* BEFORE_PATH */;
      let subPathDepth = 0;
      let c;
      let key; // eslint-disable-line
      let newChar;
      let type;
      let transition;
      let action;
      let typeMap;
      const actions = [];
      actions[0 /* APPEND */] = () => {
          if (key === undefined) {
              key = newChar;
          }
          else {
              key += newChar;
          }
      };
      actions[1 /* PUSH */] = () => {
          if (key !== undefined) {
              keys.push(key);
              key = undefined;
          }
      };
      actions[2 /* INC_SUB_PATH_DEPTH */] = () => {
          actions[0 /* APPEND */]();
          subPathDepth++;
      };
      actions[3 /* PUSH_SUB_PATH */] = () => {
          if (subPathDepth > 0) {
              subPathDepth--;
              mode = 4 /* IN_SUB_PATH */;
              actions[0 /* APPEND */]();
          }
          else {
              subPathDepth = 0;
              if (key === undefined) {
                  return false;
              }
              key = formatSubPath(key);
              if (key === false) {
                  return false;
              }
              else {
                  actions[1 /* PUSH */]();
              }
          }
      };
      function maybeUnescapeQuote() {
          const nextChar = path[index + 1];
          if ((mode === 5 /* IN_SINGLE_QUOTE */ &&
              nextChar === "'" /* SINGLE_QUOTE */) ||
              (mode === 6 /* IN_DOUBLE_QUOTE */ &&
                  nextChar === "\"" /* DOUBLE_QUOTE */)) {
              index++;
              newChar = '\\' + nextChar;
              actions[0 /* APPEND */]();
              return true;
          }
      }
      while (mode !== null) {
          index++;
          c = path[index];
          if (c === '\\' && maybeUnescapeQuote()) {
              continue;
          }
          type = getPathCharType(c);
          typeMap = pathStateMachine[mode];
          transition = typeMap[type] || typeMap["l" /* ELSE */] || 8 /* ERROR */;
          // check parse error
          if (transition === 8 /* ERROR */) {
              return;
          }
          mode = transition[0];
          if (transition[1] !== undefined) {
              action = actions[transition[1]];
              if (action) {
                  newChar = c;
                  if (action() === false) {
                      return;
                  }
              }
          }
          // check parse finish
          if (mode === 7 /* AFTER_PATH */) {
              return keys;
          }
      }
  }
  // path token cache
  const cache = new Map();
  /**
   * key-value message resolver
   *
   * @remarks
   * Resolves messages with the key-value structure. Note that messages with a hierarchical structure such as objects cannot be resolved
   *
   * @param obj - A target object to be resolved with path
   * @param path - A {@link Path | path} to resolve the value of message
   *
   * @returns A resolved {@link PathValue | path value}
   *
   * @VueI18nGeneral
   */
  function resolveWithKeyValue(obj, path) {
      return isObject(obj) ? obj[path] : null;
  }
  /**
   * message resolver
   *
   * @remarks
   * Resolves messages. messages with a hierarchical structure such as objects can be resolved. This resolver is used in VueI18n as default.
   *
   * @param obj - A target object to be resolved with path
   * @param path - A {@link Path | path} to resolve the value of message
   *
   * @returns A resolved {@link PathValue | path value}
   *
   * @VueI18nGeneral
   */
  function resolveValue(obj, path) {
      // check object
      if (!isObject(obj)) {
          return null;
      }
      // parse path
      let hit = cache.get(path);
      if (!hit) {
          hit = parse(path);
          if (hit) {
              cache.set(path, hit);
          }
      }
      // check hit
      if (!hit) {
          return null;
      }
      // resolve path value
      const len = hit.length;
      let last = obj;
      let i = 0;
      while (i < len) {
          const val = last[hit[i]];
          if (val === undefined) {
              return null;
          }
          last = val;
          i++;
      }
      return last;
  }

  const DEFAULT_MODIFIER = (str) => str;
  const DEFAULT_MESSAGE = (ctx) => ''; // eslint-disable-line
  const DEFAULT_MESSAGE_DATA_TYPE = 'text';
  const DEFAULT_NORMALIZE = (values) => values.length === 0 ? '' : values.join('');
  const DEFAULT_INTERPOLATE = toDisplayString;
  function pluralDefault(choice, choicesLength) {
      choice = Math.abs(choice);
      if (choicesLength === 2) {
          // prettier-ignore
          return choice
              ? choice > 1
                  ? 1
                  : 0
              : 1;
      }
      return choice ? Math.min(choice, 2) : 0;
  }
  function getPluralIndex(options) {
      // prettier-ignore
      const index = isNumber(options.pluralIndex)
          ? options.pluralIndex
          : -1;
      // prettier-ignore
      return options.named && (isNumber(options.named.count) || isNumber(options.named.n))
          ? isNumber(options.named.count)
              ? options.named.count
              : isNumber(options.named.n)
                  ? options.named.n
                  : index
          : index;
  }
  function normalizeNamed(pluralIndex, props) {
      if (!props.count) {
          props.count = pluralIndex;
      }
      if (!props.n) {
          props.n = pluralIndex;
      }
  }
  function createMessageContext(options = {}) {
      const locale = options.locale;
      const pluralIndex = getPluralIndex(options);
      const pluralRule = isObject(options.pluralRules) &&
          isString(locale) &&
          isFunction(options.pluralRules[locale])
          ? options.pluralRules[locale]
          : pluralDefault;
      const orgPluralRule = isObject(options.pluralRules) &&
          isString(locale) &&
          isFunction(options.pluralRules[locale])
          ? pluralDefault
          : undefined;
      const plural = (messages) => {
          return messages[pluralRule(pluralIndex, messages.length, orgPluralRule)];
      };
      const _list = options.list || [];
      const list = (index) => _list[index];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _named = options.named || {};
      isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named);
      const named = (key) => _named[key];
      function message(key) {
          // prettier-ignore
          const msg = isFunction(options.messages)
              ? options.messages(key)
              : isObject(options.messages)
                  ? options.messages[key]
                  : false;
          return !msg
              ? options.parent
                  ? options.parent.message(key) // resolve from parent messages
                  : DEFAULT_MESSAGE
              : msg;
      }
      const _modifier = (name) => options.modifiers
          ? options.modifiers[name]
          : DEFAULT_MODIFIER;
      const normalize = isPlainObject(options.processor) && isFunction(options.processor.normalize)
          ? options.processor.normalize
          : DEFAULT_NORMALIZE;
      const interpolate = isPlainObject(options.processor) &&
          isFunction(options.processor.interpolate)
          ? options.processor.interpolate
          : DEFAULT_INTERPOLATE;
      const type = isPlainObject(options.processor) && isString(options.processor.type)
          ? options.processor.type
          : DEFAULT_MESSAGE_DATA_TYPE;
      const linked = (key, ...args) => {
          const [arg1, arg2] = args;
          let type = 'text';
          let modifier = '';
          if (args.length === 1) {
              if (isObject(arg1)) {
                  modifier = arg1.modifier || modifier;
                  type = arg1.type || type;
              }
              else if (isString(arg1)) {
                  modifier = arg1 || modifier;
              }
          }
          else if (args.length === 2) {
              if (isString(arg1)) {
                  modifier = arg1 || modifier;
              }
              if (isString(arg2)) {
                  type = arg2 || type;
              }
          }
          let msg = message(key)(ctx);
          // The message in vnode resolved with linked are returned as an array by processor.nomalize
          if (type === 'vnode' && isArray(msg) && modifier) {
              msg = msg[0];
          }
          return modifier ? _modifier(modifier)(msg, type) : msg;
      };
      const ctx = {
          ["list" /* LIST */]: list,
          ["named" /* NAMED */]: named,
          ["plural" /* PLURAL */]: plural,
          ["linked" /* LINKED */]: linked,
          ["message" /* MESSAGE */]: message,
          ["type" /* TYPE */]: type,
          ["interpolate" /* INTERPOLATE */]: interpolate,
          ["normalize" /* NORMALIZE */]: normalize
      };
      return ctx;
  }

  const IntlifyDevToolsHooks =  {
      I18nInit: 'i18n:init',
      FunctionTranslate: 'function:translate'
  };

  let devtools = null;
  function setDevToolsHook(hook) {
      devtools = hook;
  }
  function initI18nDevTools(i18n, version, meta) {
      // TODO: queue if devtools is undefined
      devtools &&
          devtools.emit(IntlifyDevToolsHooks.I18nInit, {
              timestamp: Date.now(),
              i18n,
              version,
              meta
          });
  }
  const translateDevTools = /* #__PURE__*/ createDevToolsHook(IntlifyDevToolsHooks.FunctionTranslate);
  function createDevToolsHook(hook) {
      return (payloads) => devtools && devtools.emit(hook, payloads);
  }

  const CoreWarnCodes = {
      NOT_FOUND_KEY: 1,
      FALLBACK_TO_TRANSLATE: 2,
      CANNOT_FORMAT_NUMBER: 3,
      FALLBACK_TO_NUMBER_FORMAT: 4,
      CANNOT_FORMAT_DATE: 5,
      FALLBACK_TO_DATE_FORMAT: 6,
      __EXTEND_POINT__: 7
  };
  /** @internal */
  const warnMessages$1 = {
      [CoreWarnCodes.NOT_FOUND_KEY]: `Not found '{key}' key in '{locale}' locale messages.`,
      [CoreWarnCodes.FALLBACK_TO_TRANSLATE]: `Fall back to translate '{key}' key with '{target}' locale.`,
      [CoreWarnCodes.CANNOT_FORMAT_NUMBER]: `Cannot format a number value due to not supported Intl.NumberFormat.`,
      [CoreWarnCodes.FALLBACK_TO_NUMBER_FORMAT]: `Fall back to number format '{key}' key with '{target}' locale.`,
      [CoreWarnCodes.CANNOT_FORMAT_DATE]: `Cannot format a date value due to not supported Intl.DateTimeFormat.`,
      [CoreWarnCodes.FALLBACK_TO_DATE_FORMAT]: `Fall back to datetime format '{key}' key with '{target}' locale.`
  };
  function getWarnMessage$1(code, ...args) {
      return format(warnMessages$1[code], ...args);
  }

  /**
   * Fallback with simple implemenation
   *
   * @remarks
   * A fallback locale function implemented with a simple fallback algorithm.
   *
   * Basically, it returns the value as specified in the `fallbackLocale` props, and is processed with the fallback inside intlify.
   *
   * @param ctx - A {@link CoreContext | context}
   * @param fallback - A {@link FallbackLocale | fallback locale}
   * @param start - A starting {@link Locale | locale}
   *
   * @returns Fallback locales
   *
   * @VueI18nGeneral
   */
  function fallbackWithSimple(ctx, fallback, start // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
      // prettier-ignore
      return [...new Set([
              start,
              ...(isArray(fallback)
                  ? fallback
                  : isObject(fallback)
                      ? Object.keys(fallback)
                      : isString(fallback)
                          ? [fallback]
                          : [start])
          ])];
  }
  /**
   * Fallback with locale chain
   *
   * @remarks
   * A fallback locale function implemented with a fallback chain algorithm. It's used in VueI18n as default.
   *
   * @param ctx - A {@link CoreContext | context}
   * @param fallback - A {@link FallbackLocale | fallback locale}
   * @param start - A starting {@link Locale | locale}
   *
   * @returns Fallback locales
   *
   * @VueI18nSee [Fallbacking](../guide/essentials/fallback)
   *
   * @VueI18nGeneral
   */
  function fallbackWithLocaleChain(ctx, fallback, start) {
      const startLocale = isString(start) ? start : DEFAULT_LOCALE;
      const context = ctx;
      if (!context.__localeChainCache) {
          context.__localeChainCache = new Map();
      }
      let chain = context.__localeChainCache.get(startLocale);
      if (!chain) {
          chain = [];
          // first block defined by start
          let block = [start];
          // while any intervening block found
          while (isArray(block)) {
              block = appendBlockToChain(chain, block, fallback);
          }
          // prettier-ignore
          // last block defined by default
          const defaults = isArray(fallback) || !isPlainObject(fallback)
              ? fallback
              : fallback['default']
                  ? fallback['default']
                  : null;
          // convert defaults to array
          block = isString(defaults) ? [defaults] : defaults;
          if (isArray(block)) {
              appendBlockToChain(chain, block, false);
          }
          context.__localeChainCache.set(startLocale, chain);
      }
      return chain;
  }
  function appendBlockToChain(chain, block, blocks) {
      let follow = true;
      for (let i = 0; i < block.length && isBoolean(follow); i++) {
          const locale = block[i];
          if (isString(locale)) {
              follow = appendLocaleToChain(chain, block[i], blocks);
          }
      }
      return follow;
  }
  function appendLocaleToChain(chain, locale, blocks) {
      let follow;
      const tokens = locale.split('-');
      do {
          const target = tokens.join('-');
          follow = appendItemToChain(chain, target, blocks);
          tokens.splice(-1, 1);
      } while (tokens.length && follow === true);
      return follow;
  }
  function appendItemToChain(chain, target, blocks) {
      let follow = false;
      if (!chain.includes(target)) {
          follow = true;
          if (target) {
              follow = target[target.length - 1] !== '!';
              const locale = target.replace(/!/g, '');
              chain.push(locale);
              if ((isArray(blocks) || isPlainObject(blocks)) &&
                  blocks[locale] // eslint-disable-line @typescript-eslint/no-explicit-any
              ) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  follow = blocks[locale];
              }
          }
      }
      return follow;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /**
   * Intlify core-base version
   * @internal
   */
  const VERSION$1 = '9.2.0-beta.38';
  const NOT_REOSLVED = -1;
  const DEFAULT_LOCALE = 'en-US';
  const MISSING_RESOLVE_VALUE = '';
  const capitalize = (str) => `${str.charAt(0).toLocaleUpperCase()}${str.substr(1)}`;
  function getDefaultLinkedModifiers() {
      return {
          upper: (val, type) => {
              // prettier-ignore
              return type === 'text' && isString(val)
                  ? val.toUpperCase()
                  : type === 'vnode' && isObject(val) && '__v_isVNode' in val
                      ? val.children.toUpperCase()
                      : val;
          },
          lower: (val, type) => {
              // prettier-ignore
              return type === 'text' && isString(val)
                  ? val.toLowerCase()
                  : type === 'vnode' && isObject(val) && '__v_isVNode' in val
                      ? val.children.toLowerCase()
                      : val;
          },
          capitalize: (val, type) => {
              // prettier-ignore
              return (type === 'text' && isString(val)
                  ? capitalize(val)
                  : type === 'vnode' && isObject(val) && '__v_isVNode' in val
                      ? capitalize(val.children)
                      : val);
          }
      };
  }
  let _compiler;
  function registerMessageCompiler(compiler) {
      _compiler = compiler;
  }
  let _resolver;
  /**
   * Register the message resolver
   *
   * @param resolver - A {@link MessageResolver} function
   *
   * @VueI18nGeneral
   */
  function registerMessageResolver(resolver) {
      _resolver = resolver;
  }
  let _fallbacker;
  /**
   * Register the locale fallbacker
   *
   * @param fallbacker - A {@link LocaleFallbacker} function
   *
   * @VueI18nGeneral
   */
  function registerLocaleFallbacker(fallbacker) {
      _fallbacker = fallbacker;
  }
  // Additional Meta for Intlify DevTools
  let _additionalMeta = null;
  const setAdditionalMeta =  (meta) => {
      _additionalMeta = meta;
  };
  const getAdditionalMeta =  () => _additionalMeta;
  let _fallbackContext = null;
  const setFallbackContext = (context) => {
      _fallbackContext = context;
  };
  const getFallbackContext = () => _fallbackContext;
  // ID for CoreContext
  let _cid = 0;
  function createCoreContext(options = {}) {
      // setup options
      const version = isString(options.version) ? options.version : VERSION$1;
      const locale = isString(options.locale) ? options.locale : DEFAULT_LOCALE;
      const fallbackLocale = isArray(options.fallbackLocale) ||
          isPlainObject(options.fallbackLocale) ||
          isString(options.fallbackLocale) ||
          options.fallbackLocale === false
          ? options.fallbackLocale
          : locale;
      const messages = isPlainObject(options.messages)
          ? options.messages
          : { [locale]: {} };
      const datetimeFormats = isPlainObject(options.datetimeFormats)
              ? options.datetimeFormats
              : { [locale]: {} }
          ;
      const numberFormats = isPlainObject(options.numberFormats)
              ? options.numberFormats
              : { [locale]: {} }
          ;
      const modifiers = assign({}, options.modifiers || {}, getDefaultLinkedModifiers());
      const pluralRules = options.pluralRules || {};
      const missing = isFunction(options.missing) ? options.missing : null;
      const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn)
          ? options.missingWarn
          : true;
      const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn)
          ? options.fallbackWarn
          : true;
      const fallbackFormat = !!options.fallbackFormat;
      const unresolving = !!options.unresolving;
      const postTranslation = isFunction(options.postTranslation)
          ? options.postTranslation
          : null;
      const processor = isPlainObject(options.processor) ? options.processor : null;
      const warnHtmlMessage = isBoolean(options.warnHtmlMessage)
          ? options.warnHtmlMessage
          : true;
      const escapeParameter = !!options.escapeParameter;
      const messageCompiler = isFunction(options.messageCompiler)
          ? options.messageCompiler
          : _compiler;
      const messageResolver = isFunction(options.messageResolver)
          ? options.messageResolver
          : _resolver || resolveWithKeyValue;
      const localeFallbacker = isFunction(options.localeFallbacker)
          ? options.localeFallbacker
          : _fallbacker || fallbackWithSimple;
      const fallbackContext = isObject(options.fallbackContext)
          ? options.fallbackContext
          : undefined;
      const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
      // setup internal options
      const internalOptions = options;
      const __datetimeFormatters = isObject(internalOptions.__datetimeFormatters)
              ? internalOptions.__datetimeFormatters
              : new Map()
          ;
      const __numberFormatters = isObject(internalOptions.__numberFormatters)
              ? internalOptions.__numberFormatters
              : new Map()
          ;
      const __meta = isObject(internalOptions.__meta) ? internalOptions.__meta : {};
      _cid++;
      const context = {
          version,
          cid: _cid,
          locale,
          fallbackLocale,
          messages,
          modifiers,
          pluralRules,
          missing,
          missingWarn,
          fallbackWarn,
          fallbackFormat,
          unresolving,
          postTranslation,
          processor,
          warnHtmlMessage,
          escapeParameter,
          messageCompiler,
          messageResolver,
          localeFallbacker,
          fallbackContext,
          onWarn,
          __meta
      };
      {
          context.datetimeFormats = datetimeFormats;
          context.numberFormats = numberFormats;
          context.__datetimeFormatters = __datetimeFormatters;
          context.__numberFormatters = __numberFormatters;
      }
      // NOTE: experimental !!
      {
          initI18nDevTools(context, version, __meta);
      }
      return context;
  }
  /** @internal */
  function isTranslateFallbackWarn(fallback, key) {
      return fallback instanceof RegExp ? fallback.test(key) : fallback;
  }
  /** @internal */
  function isTranslateMissingWarn(missing, key) {
      return missing instanceof RegExp ? missing.test(key) : missing;
  }
  /** @internal */
  function handleMissing(context, key, locale, missingWarn, type) {
      const { missing, onWarn } = context;
      if (missing !== null) {
          const ret = missing(context, locale, key, type);
          return isString(ret) ? ret : key;
      }
      else {
          if (isTranslateMissingWarn(missingWarn, key)) {
              onWarn(getWarnMessage$1(CoreWarnCodes.NOT_FOUND_KEY, { key, locale }));
          }
          return key;
      }
  }
  /** @internal */
  function updateFallbackLocale(ctx, locale, fallback) {
      const context = ctx;
      context.__localeChainCache = new Map();
      ctx.localeFallbacker(ctx, fallback, locale);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const RE_HTML_TAG = /<\/?[\w\s="/.':;#-\/]+>/;
  const WARN_MESSAGE = `Detected HTML in '{source}' message. Recommend not using HTML messages to avoid XSS.`;
  function checkHtmlMessage(source, options) {
      const warnHtmlMessage = isBoolean(options.warnHtmlMessage)
          ? options.warnHtmlMessage
          : true;
      if (warnHtmlMessage && RE_HTML_TAG.test(source)) {
          warn(format(WARN_MESSAGE, { source }));
      }
  }
  const defaultOnCacheKey = (source) => source;
  let compileCache = Object.create(null);
  function compileToFunction(source, options = {}) {
      {
          // check HTML message
          checkHtmlMessage(source, options);
          // check caches
          const onCacheKey = options.onCacheKey || defaultOnCacheKey;
          const key = onCacheKey(source);
          const cached = compileCache[key];
          if (cached) {
              return cached;
          }
          // compile error detecting
          let occurred = false;
          const onError = options.onError || defaultOnError;
          options.onError = (err) => {
              occurred = true;
              onError(err);
          };
          // compile
          const { code } = baseCompile(source, options);
          // evaluate function
          const msg = new Function(`return ${code}`)();
          // if occurred compile error, don't cache
          return !occurred ? (compileCache[key] = msg) : msg;
      }
  }

  let code$2 = CompileErrorCodes.__EXTEND_POINT__;
  const inc$2 = () => ++code$2;
  const CoreErrorCodes = {
      INVALID_ARGUMENT: code$2,
      INVALID_DATE_ARGUMENT: inc$2(),
      INVALID_ISO_DATE_ARGUMENT: inc$2(),
      __EXTEND_POINT__: inc$2() // 18
  };
  function createCoreError(code) {
      return createCompileError(code, null, { messages: errorMessages$1 } );
  }
  /** @internal */
  const errorMessages$1 = {
      [CoreErrorCodes.INVALID_ARGUMENT]: 'Invalid arguments',
      [CoreErrorCodes.INVALID_DATE_ARGUMENT]: 'The date provided is an invalid Date object.' +
          'Make sure your Date represents a valid date.',
      [CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT]: 'The argument provided is not a valid ISO date string'
  };

  const NOOP_MESSAGE_FUNCTION = () => '';
  const isMessageFunction = (val) => isFunction(val);
  // implementation of `translate` function
  function translate(context, ...args) {
      const { fallbackFormat, postTranslation, unresolving, messageCompiler, fallbackLocale, messages } = context;
      const [key, options] = parseTranslateArgs(...args);
      const missingWarn = isBoolean(options.missingWarn)
          ? options.missingWarn
          : context.missingWarn;
      const fallbackWarn = isBoolean(options.fallbackWarn)
          ? options.fallbackWarn
          : context.fallbackWarn;
      const escapeParameter = isBoolean(options.escapeParameter)
          ? options.escapeParameter
          : context.escapeParameter;
      const resolvedMessage = !!options.resolvedMessage;
      // prettier-ignore
      const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) // default by function option
          ? !isBoolean(options.default)
              ? options.default
              : (!messageCompiler ? () => key : key)
          : fallbackFormat // default by `fallbackFormat` option
              ? (!messageCompiler ? () => key : key)
              : '';
      const enableDefaultMsg = fallbackFormat || defaultMsgOrKey !== '';
      const locale = isString(options.locale) ? options.locale : context.locale;
      // escape params
      escapeParameter && escapeParams(options);
      // resolve message format
      // eslint-disable-next-line prefer-const
      let [formatScope, targetLocale, message] = !resolvedMessage
          ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn)
          : [
              key,
              locale,
              messages[locale] || {}
          ];
      // NOTE:
      //  Fix to work around `ssrTransfrom` bug in Vite.
      //  https://github.com/vitejs/vite/issues/4306
      //  To get around this, use temporary variables.
      //  https://github.com/nuxt/framework/issues/1461#issuecomment-954606243
      let format = formatScope;
      // if you use default message, set it as message format!
      let cacheBaseKey = key;
      if (!resolvedMessage &&
          !(isString(format) || isMessageFunction(format))) {
          if (enableDefaultMsg) {
              format = defaultMsgOrKey;
              cacheBaseKey = format;
          }
      }
      // checking message format and target locale
      if (!resolvedMessage &&
          (!(isString(format) || isMessageFunction(format)) ||
              !isString(targetLocale))) {
          return unresolving ? NOT_REOSLVED : key;
      }
      if (isString(format) && context.messageCompiler == null) {
          warn(`The message format compilation is not supported in this build. ` +
              `Because message compiler isn't included. ` +
              `You need to pre-compilation all message format. ` +
              `So translate function return '${key}'.`);
          return key;
      }
      // setup compile error detecting
      let occurred = false;
      const errorDetector = () => {
          occurred = true;
      };
      // compile message format
      const msg = !isMessageFunction(format)
          ? compileMessageFormat(context, key, targetLocale, format, cacheBaseKey, errorDetector)
          : format;
      // if occurred compile error, return the message format
      if (occurred) {
          return format;
      }
      // evaluate message with context
      const ctxOptions = getMessageContextOptions(context, targetLocale, message, options);
      const msgContext = createMessageContext(ctxOptions);
      const messaged = evaluateMessage(context, msg, msgContext);
      // if use post translation option, proceed it with handler
      const ret = postTranslation
          ? postTranslation(messaged, key)
          : messaged;
      // NOTE: experimental !!
      {
          // prettier-ignore
          const payloads = {
              timestamp: Date.now(),
              key: isString(key)
                  ? key
                  : isMessageFunction(format)
                      ? format.key
                      : '',
              locale: targetLocale || (isMessageFunction(format)
                  ? format.locale
                  : ''),
              format: isString(format)
                  ? format
                  : isMessageFunction(format)
                      ? format.source
                      : '',
              message: ret
          };
          payloads.meta = assign({}, context.__meta, getAdditionalMeta() || {});
          translateDevTools(payloads);
      }
      return ret;
  }
  function escapeParams(options) {
      if (isArray(options.list)) {
          options.list = options.list.map(item => isString(item) ? escapeHtml(item) : item);
      }
      else if (isObject(options.named)) {
          Object.keys(options.named).forEach(key => {
              if (isString(options.named[key])) {
                  options.named[key] = escapeHtml(options.named[key]);
              }
          });
      }
  }
  function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
      const { messages, onWarn, messageResolver: resolveValue, localeFallbacker } = context;
      const locales = localeFallbacker(context, fallbackLocale, locale); // eslint-disable-line @typescript-eslint/no-explicit-any
      let message = {};
      let targetLocale;
      let format = null;
      const type = 'translate';
      for (let i = 0; i < locales.length; i++) {
          targetLocale = locales[i];
          if (locale !== targetLocale &&
              isTranslateFallbackWarn(fallbackWarn, key)) {
              onWarn(getWarnMessage$1(CoreWarnCodes.FALLBACK_TO_TRANSLATE, {
                  key,
                  target: targetLocale
              }));
          }
          message =
              messages[targetLocale] || {};
          let startTag;
          if (inBrowser) {
              window.performance.now();
              startTag = 'intlify-message-resolve-start';
              mark && mark(startTag);
          }
          if ((format = resolveValue(message, key)) === null) {
              // if null, resolve with object key path
              format = message[key]; // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          if (isString(format) || isFunction(format))
              break;
          const missingRet = handleMissing(context, // eslint-disable-line @typescript-eslint/no-explicit-any
          key, targetLocale, missingWarn, type);
          if (missingRet !== key) {
              format = missingRet;
          }
      }
      return [format, targetLocale, message];
  }
  function compileMessageFormat(context, key, targetLocale, format, cacheBaseKey, errorDetector) {
      const { messageCompiler, warnHtmlMessage } = context;
      if (isMessageFunction(format)) {
          const msg = format;
          msg.locale = msg.locale || targetLocale;
          msg.key = msg.key || key;
          return msg;
      }
      if (messageCompiler == null) {
          const msg = (() => format);
          msg.locale = targetLocale;
          msg.key = key;
          return msg;
      }
      let startTag;
      if (inBrowser) {
          window.performance.now();
          startTag = 'intlify-message-compilation-start';
          mark && mark(startTag);
      }
      const msg = messageCompiler(format, getCompileOptions(context, targetLocale, cacheBaseKey, format, warnHtmlMessage, errorDetector));
      msg.locale = targetLocale;
      msg.key = key;
      msg.source = format;
      return msg;
  }
  function evaluateMessage(context, msg, msgCtx) {
      let startTag;
      if (inBrowser) {
          window.performance.now();
          startTag = 'intlify-message-evaluation-start';
          mark && mark(startTag);
      }
      const messaged = msg(msgCtx);
      return messaged;
  }
  /** @internal */
  function parseTranslateArgs(...args) {
      const [arg1, arg2, arg3] = args;
      const options = {};
      if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1)) {
          throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
      }
      // prettier-ignore
      const key = isNumber(arg1)
          ? String(arg1)
          : isMessageFunction(arg1)
              ? arg1
              : arg1;
      if (isNumber(arg2)) {
          options.plural = arg2;
      }
      else if (isString(arg2)) {
          options.default = arg2;
      }
      else if (isPlainObject(arg2) && !isEmptyObject(arg2)) {
          options.named = arg2;
      }
      else if (isArray(arg2)) {
          options.list = arg2;
      }
      if (isNumber(arg3)) {
          options.plural = arg3;
      }
      else if (isString(arg3)) {
          options.default = arg3;
      }
      else if (isPlainObject(arg3)) {
          assign(options, arg3);
      }
      return [key, options];
  }
  function getCompileOptions(context, locale, key, source, warnHtmlMessage, errorDetector) {
      return {
          warnHtmlMessage,
          onError: (err) => {
              errorDetector && errorDetector(err);
              {
                  throw err;
              }
          },
          onCacheKey: (source) => generateFormatCacheKey(locale, key, source)
      };
  }
  function getMessageContextOptions(context, locale, message, options) {
      const { modifiers, pluralRules, messageResolver: resolveValue, fallbackLocale, fallbackWarn, missingWarn, fallbackContext } = context;
      const resolveMessage = (key) => {
          let val = resolveValue(message, key);
          // fallback to root context
          if (val == null && fallbackContext) {
              const [, , message] = resolveMessageFormat(fallbackContext, key, locale, fallbackLocale, fallbackWarn, missingWarn);
              val = resolveValue(message, key);
          }
          if (isString(val)) {
              let occurred = false;
              const errorDetector = () => {
                  occurred = true;
              };
              const msg = compileMessageFormat(context, key, locale, val, key, errorDetector);
              return !occurred
                  ? msg
                  : NOOP_MESSAGE_FUNCTION;
          }
          else if (isMessageFunction(val)) {
              return val;
          }
          else {
              // TODO: should be implemented warning message
              return NOOP_MESSAGE_FUNCTION;
          }
      };
      const ctxOptions = {
          locale,
          modifiers,
          pluralRules,
          messages: resolveMessage
      };
      if (context.processor) {
          ctxOptions.processor = context.processor;
      }
      if (options.list) {
          ctxOptions.list = options.list;
      }
      if (options.named) {
          ctxOptions.named = options.named;
      }
      if (isNumber(options.plural)) {
          ctxOptions.pluralIndex = options.plural;
      }
      return ctxOptions;
  }

  const intlDefined = typeof Intl !== 'undefined';
  const Availabilities = {
      dateTimeFormat: intlDefined && typeof Intl.DateTimeFormat !== 'undefined',
      numberFormat: intlDefined && typeof Intl.NumberFormat !== 'undefined'
  };

  // implementation of `datetime` function
  function datetime(context, ...args) {
      const { datetimeFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
      const { __datetimeFormatters } = context;
      if (!Availabilities.dateTimeFormat) {
          onWarn(getWarnMessage$1(CoreWarnCodes.CANNOT_FORMAT_DATE));
          return MISSING_RESOLVE_VALUE;
      }
      const [key, value, options, overrides] = parseDateTimeArgs(...args);
      const missingWarn = isBoolean(options.missingWarn)
          ? options.missingWarn
          : context.missingWarn;
      const fallbackWarn = isBoolean(options.fallbackWarn)
          ? options.fallbackWarn
          : context.fallbackWarn;
      const part = !!options.part;
      const locale = isString(options.locale) ? options.locale : context.locale;
      const locales = localeFallbacker(context, // eslint-disable-line @typescript-eslint/no-explicit-any
      fallbackLocale, locale);
      if (!isString(key) || key === '') {
          return new Intl.DateTimeFormat(locale, overrides).format(value);
      }
      // resolve format
      let datetimeFormat = {};
      let targetLocale;
      let format = null;
      const type = 'datetime format';
      for (let i = 0; i < locales.length; i++) {
          targetLocale = locales[i];
          if (locale !== targetLocale &&
              isTranslateFallbackWarn(fallbackWarn, key)) {
              onWarn(getWarnMessage$1(CoreWarnCodes.FALLBACK_TO_DATE_FORMAT, {
                  key,
                  target: targetLocale
              }));
          }
          datetimeFormat =
              datetimeFormats[targetLocale] || {};
          format = datetimeFormat[key];
          if (isPlainObject(format))
              break;
          handleMissing(context, key, targetLocale, missingWarn, type); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      // checking format and target locale
      if (!isPlainObject(format) || !isString(targetLocale)) {
          return unresolving ? NOT_REOSLVED : key;
      }
      let id = `${targetLocale}__${key}`;
      if (!isEmptyObject(overrides)) {
          id = `${id}__${JSON.stringify(overrides)}`;
      }
      let formatter = __datetimeFormatters.get(id);
      if (!formatter) {
          formatter = new Intl.DateTimeFormat(targetLocale, assign({}, format, overrides));
          __datetimeFormatters.set(id, formatter);
      }
      return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  /** @internal */
  const DATETIME_FORMAT_OPTIONS_KEYS = [
      'localeMatcher',
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'timeZoneName',
      'formatMatcher',
      'hour12',
      'timeZone',
      'dateStyle',
      'timeStyle',
      'calendar',
      'dayPeriod',
      'numberingSystem',
      'hourCycle',
      'fractionalSecondDigits'
  ];
  /** @internal */
  function parseDateTimeArgs(...args) {
      const [arg1, arg2, arg3, arg4] = args;
      const options = {};
      let overrides = {};
      let value;
      if (isString(arg1)) {
          // Only allow ISO strings - other date formats are often supported,
          // but may cause different results in different browsers.
          const matches = arg1.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
          if (!matches) {
              throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
          }
          // Some browsers can not parse the iso datetime separated by space,
          // this is a compromise solution by replace the 'T'/' ' with 'T'
          const dateTime = matches[3]
              ? matches[3].trim().startsWith('T')
                  ? `${matches[1].trim()}${matches[3].trim()}`
                  : `${matches[1].trim()}T${matches[3].trim()}`
              : matches[1].trim();
          value = new Date(dateTime);
          try {
              // This will fail if the date is not valid
              value.toISOString();
          }
          catch (e) {
              throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
          }
      }
      else if (isDate(arg1)) {
          if (isNaN(arg1.getTime())) {
              throw createCoreError(CoreErrorCodes.INVALID_DATE_ARGUMENT);
          }
          value = arg1;
      }
      else if (isNumber(arg1)) {
          value = arg1;
      }
      else {
          throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
      }
      if (isString(arg2)) {
          options.key = arg2;
      }
      else if (isPlainObject(arg2)) {
          Object.keys(arg2).forEach(key => {
              if (DATETIME_FORMAT_OPTIONS_KEYS.includes(key)) {
                  overrides[key] = arg2[key];
              }
              else {
                  options[key] = arg2[key];
              }
          });
      }
      if (isString(arg3)) {
          options.locale = arg3;
      }
      else if (isPlainObject(arg3)) {
          overrides = arg3;
      }
      if (isPlainObject(arg4)) {
          overrides = arg4;
      }
      return [options.key || '', value, options, overrides];
  }
  /** @internal */
  function clearDateTimeFormat(ctx, locale, format) {
      const context = ctx;
      for (const key in format) {
          const id = `${locale}__${key}`;
          if (!context.__datetimeFormatters.has(id)) {
              continue;
          }
          context.__datetimeFormatters.delete(id);
      }
  }

  // implementation of `number` function
  function number(context, ...args) {
      const { numberFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
      const { __numberFormatters } = context;
      if (!Availabilities.numberFormat) {
          onWarn(getWarnMessage$1(CoreWarnCodes.CANNOT_FORMAT_NUMBER));
          return MISSING_RESOLVE_VALUE;
      }
      const [key, value, options, overrides] = parseNumberArgs(...args);
      const missingWarn = isBoolean(options.missingWarn)
          ? options.missingWarn
          : context.missingWarn;
      const fallbackWarn = isBoolean(options.fallbackWarn)
          ? options.fallbackWarn
          : context.fallbackWarn;
      const part = !!options.part;
      const locale = isString(options.locale) ? options.locale : context.locale;
      const locales = localeFallbacker(context, // eslint-disable-line @typescript-eslint/no-explicit-any
      fallbackLocale, locale);
      if (!isString(key) || key === '') {
          return new Intl.NumberFormat(locale, overrides).format(value);
      }
      // resolve format
      let numberFormat = {};
      let targetLocale;
      let format = null;
      const type = 'number format';
      for (let i = 0; i < locales.length; i++) {
          targetLocale = locales[i];
          if (locale !== targetLocale &&
              isTranslateFallbackWarn(fallbackWarn, key)) {
              onWarn(getWarnMessage$1(CoreWarnCodes.FALLBACK_TO_NUMBER_FORMAT, {
                  key,
                  target: targetLocale
              }));
          }
          numberFormat =
              numberFormats[targetLocale] || {};
          format = numberFormat[key];
          if (isPlainObject(format))
              break;
          handleMissing(context, key, targetLocale, missingWarn, type); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      // checking format and target locale
      if (!isPlainObject(format) || !isString(targetLocale)) {
          return unresolving ? NOT_REOSLVED : key;
      }
      let id = `${targetLocale}__${key}`;
      if (!isEmptyObject(overrides)) {
          id = `${id}__${JSON.stringify(overrides)}`;
      }
      let formatter = __numberFormatters.get(id);
      if (!formatter) {
          formatter = new Intl.NumberFormat(targetLocale, assign({}, format, overrides));
          __numberFormatters.set(id, formatter);
      }
      return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  /** @internal */
  const NUMBER_FORMAT_OPTIONS_KEYS = [
      'localeMatcher',
      'style',
      'currency',
      'currencyDisplay',
      'currencySign',
      'useGrouping',
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
      'compactDisplay',
      'notation',
      'signDisplay',
      'unit',
      'unitDisplay',
      'roundingMode',
      'roundingPriority',
      'roundingIncrement',
      'trailingZeroDisplay'
  ];
  /** @internal */
  function parseNumberArgs(...args) {
      const [arg1, arg2, arg3, arg4] = args;
      const options = {};
      let overrides = {};
      if (!isNumber(arg1)) {
          throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
      }
      const value = arg1;
      if (isString(arg2)) {
          options.key = arg2;
      }
      else if (isPlainObject(arg2)) {
          Object.keys(arg2).forEach(key => {
              if (NUMBER_FORMAT_OPTIONS_KEYS.includes(key)) {
                  overrides[key] = arg2[key];
              }
              else {
                  options[key] = arg2[key];
              }
          });
      }
      if (isString(arg3)) {
          options.locale = arg3;
      }
      else if (isPlainObject(arg3)) {
          overrides = arg3;
      }
      if (isPlainObject(arg4)) {
          overrides = arg4;
      }
      return [options.key || '', value, options, overrides];
  }
  /** @internal */
  function clearNumberFormat(ctx, locale, format) {
      const context = ctx;
      for (const key in format) {
          const id = `${locale}__${key}`;
          if (!context.__numberFormatters.has(id)) {
              continue;
          }
          context.__numberFormatters.delete(id);
      }
  }

  /**
   * Vue I18n Version
   *
   * @remarks
   * Semver format. Same format as the package.json `version` field.
   *
   * @VueI18nGeneral
   */
  const VERSION = '9.2.0-beta.38';
  /**
   * This is only called development env
   * istanbul-ignore-next
   */
  function initDev() {
      {
          {
              console.info(`You are running a development build of vue-i18n.\n` +
                  `Make sure to use the production build (*.prod.js) when deploying for production.`);
          }
      }
  }

  let code$1 = CoreWarnCodes.__EXTEND_POINT__;
  const inc$1 = () => ++code$1;
  const I18nWarnCodes = {
      FALLBACK_TO_ROOT: code$1,
      NOT_SUPPORTED_PRESERVE: inc$1(),
      NOT_SUPPORTED_FORMATTER: inc$1(),
      NOT_SUPPORTED_PRESERVE_DIRECTIVE: inc$1(),
      NOT_SUPPORTED_GET_CHOICE_INDEX: inc$1(),
      COMPONENT_NAME_LEGACY_COMPATIBLE: inc$1(),
      NOT_FOUND_PARENT_SCOPE: inc$1() // 13
  };
  const warnMessages = {
      [I18nWarnCodes.FALLBACK_TO_ROOT]: `Fall back to {type} '{key}' with root locale.`,
      [I18nWarnCodes.NOT_SUPPORTED_PRESERVE]: `Not supported 'preserve'.`,
      [I18nWarnCodes.NOT_SUPPORTED_FORMATTER]: `Not supported 'formatter'.`,
      [I18nWarnCodes.NOT_SUPPORTED_PRESERVE_DIRECTIVE]: `Not supported 'preserveDirectiveContent'.`,
      [I18nWarnCodes.NOT_SUPPORTED_GET_CHOICE_INDEX]: `Not supported 'getChoiceIndex'.`,
      [I18nWarnCodes.COMPONENT_NAME_LEGACY_COMPATIBLE]: `Component name legacy compatible: '{name}' -> 'i18n'`,
      [I18nWarnCodes.NOT_FOUND_PARENT_SCOPE]: `Not found parent scope. use the global scope.`
  };
  function getWarnMessage(code, ...args) {
      return format(warnMessages[code], ...args);
  }

  let code = CompileErrorCodes.__EXTEND_POINT__;
  const inc = () => ++code;
  const I18nErrorCodes = {
      // composer module errors
      UNEXPECTED_RETURN_TYPE: code,
      // legacy module errors
      INVALID_ARGUMENT: inc(),
      // i18n module errors
      MUST_BE_CALL_SETUP_TOP: inc(),
      NOT_INSLALLED: inc(),
      NOT_AVAILABLE_IN_LEGACY_MODE: inc(),
      // directive module errors
      REQUIRED_VALUE: inc(),
      INVALID_VALUE: inc(),
      // vue-devtools errors
      CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN: inc(),
      NOT_INSLALLED_WITH_PROVIDE: inc(),
      // unexpected error
      UNEXPECTED_ERROR: inc(),
      // not compatible legacy vue-i18n constructor
      NOT_COMPATIBLE_LEGACY_VUE_I18N: inc(),
      // bridge support vue 2.x only
      BRIDGE_SUPPORT_VUE_2_ONLY: inc(),
      // need to define `i18n` option in `allowComposition: true` and `useScope: 'local' at `useI18n``
      MUST_DEFINE_I18N_OPTION_IN_ALLOW_COMPOSITION: inc(),
      // Not available Compostion API in Legacy API mode. Please make sure that the legacy API mode is working properly
      NOT_AVAILABLE_COMPOSITION_IN_LEGACY: inc(),
      // for enhancement
      __EXTEND_POINT__: inc() // 29
  };
  function createI18nError(code, ...args) {
      return createCompileError(code, null, { messages: errorMessages, args } );
  }
  const errorMessages = {
      [I18nErrorCodes.UNEXPECTED_RETURN_TYPE]: 'Unexpected return type in composer',
      [I18nErrorCodes.INVALID_ARGUMENT]: 'Invalid argument',
      [I18nErrorCodes.MUST_BE_CALL_SETUP_TOP]: 'Must be called at the top of a `setup` function',
      [I18nErrorCodes.NOT_INSLALLED]: 'Need to install with `app.use` function',
      [I18nErrorCodes.UNEXPECTED_ERROR]: 'Unexpected error',
      [I18nErrorCodes.NOT_AVAILABLE_IN_LEGACY_MODE]: 'Not available in legacy mode',
      [I18nErrorCodes.REQUIRED_VALUE]: `Required in value: {0}`,
      [I18nErrorCodes.INVALID_VALUE]: `Invalid value`,
      [I18nErrorCodes.CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN]: `Cannot setup vue-devtools plugin`,
      [I18nErrorCodes.NOT_INSLALLED_WITH_PROVIDE]: 'Need to install with `provide` function',
      [I18nErrorCodes.NOT_COMPATIBLE_LEGACY_VUE_I18N]: 'Not compatible legacy VueI18n.',
      [I18nErrorCodes.BRIDGE_SUPPORT_VUE_2_ONLY]: 'vue-i18n-bridge support Vue 2.x only',
      [I18nErrorCodes.MUST_DEFINE_I18N_OPTION_IN_ALLOW_COMPOSITION]: 'Must define ‘i18n’ option or custom block in Composition API with using local scope in Legacy API mode',
      [I18nErrorCodes.NOT_AVAILABLE_COMPOSITION_IN_LEGACY]: 'Not available Compostion API in Legacy API mode. Please make sure that the legacy API mode is working properly'
  };

  const TransrateVNodeSymbol = 
  /* #__PURE__*/ makeSymbol('__transrateVNode');
  const DatetimePartsSymbol = /* #__PURE__*/ makeSymbol('__datetimeParts');
  const NumberPartsSymbol = /* #__PURE__*/ makeSymbol('__numberParts');
  const SetPluralRulesSymbol = makeSymbol('__setPluralRules');
  const LegacyInstanceSymbol = /* #__PURE__*/ makeSymbol('__legacyVueI18n');
  const InejctWithOption = /* #__PURE__*/ makeSymbol('__injectWithOption');
  const __VUE_I18N_BRIDGE__ =  '__VUE_I18N_BRIDGE__';

  /* eslint-disable @typescript-eslint/no-explicit-any */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  function isLegacyVueI18n(VueI18n) {
      if (VueI18n == null || VueI18n.version == null) {
          return false;
      }
      return (Number(VueI18n.version.split('.')[0]) || -1) >= 8;
  }
  /**
   * Transform flat json in obj to normal json in obj
   */
  function handleFlatJson(obj) {
      // check obj
      if (!isObject(obj)) {
          return obj;
      }
      for (const key in obj) {
          // check key
          if (!hasOwn(obj, key)) {
              continue;
          }
          // handle for normal json
          if (!key.includes('.')) {
              // recursive process value if value is also a object
              if (isObject(obj[key])) {
                  handleFlatJson(obj[key]);
              }
          }
          // handle for flat json, transform to normal json
          else {
              // go to the last object
              const subKeys = key.split('.');
              const lastIndex = subKeys.length - 1;
              let currentObj = obj;
              for (let i = 0; i < lastIndex; i++) {
                  if (!(subKeys[i] in currentObj)) {
                      currentObj[subKeys[i]] = {};
                  }
                  currentObj = currentObj[subKeys[i]];
              }
              // update last object value, delete old property
              currentObj[subKeys[lastIndex]] = obj[key];
              delete obj[key];
              // recursive process value if value is also a object
              if (isObject(currentObj[subKeys[lastIndex]])) {
                  handleFlatJson(currentObj[subKeys[lastIndex]]);
              }
          }
      }
      return obj;
  }
  function getLocaleMessages(locale, options) {
      const { messages, __i18n, messageResolver, flatJson } = options;
      // prettier-ignore
      const ret = isPlainObject(messages)
          ? messages
          : isArray(__i18n)
              ? {}
              : { [locale]: {} };
      // merge locale messages of i18n custom block
      if (isArray(__i18n)) {
          __i18n.forEach(custom => {
              if ('locale' in custom && 'resource' in custom) {
                  const { locale, resource } = custom;
                  if (locale) {
                      ret[locale] = ret[locale] || {};
                      deepCopy(resource, ret[locale]);
                  }
                  else {
                      deepCopy(resource, ret);
                  }
              }
              else {
                  isString(custom) && deepCopy(JSON.parse(custom), ret);
              }
          });
      }
      // handle messages for flat json
      if (messageResolver == null && flatJson) {
          for (const key in ret) {
              if (hasOwn(ret, key)) {
                  handleFlatJson(ret[key]);
              }
          }
      }
      return ret;
  }
  const isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  function deepCopy(src, des) {
      // src and des should both be objects, and non of then can be a array
      if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
          throw createI18nError(I18nErrorCodes.INVALID_VALUE);
      }
      for (const key in src) {
          if (hasOwn(src, key)) {
              if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
                  // replace with src[key] when:
                  // src[key] or des[key] is not a object, or
                  // src[key] or des[key] is a array
                  des[key] = src[key];
              }
              else {
                  // src[key] and des[key] are both object, merge them
                  deepCopy(src[key], des[key]);
              }
          }
      }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getComponentOptions(instance) {
      return instance.proxy.$options;
  }
  function adjustI18nResources(global, options, componentOptions // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
      let messages = isObject(options.messages) ? options.messages : {};
      if ('__i18nGlobal' in componentOptions) {
          messages = getLocaleMessages(global.locale.value, {
              messages,
              __i18n: componentOptions.__i18nGlobal
          });
      }
      // merge locale messages
      const locales = Object.keys(messages);
      if (locales.length) {
          locales.forEach(locale => {
              global.mergeLocaleMessage(locale, messages[locale]);
          });
      }
      {
          // merge datetime formats
          if (isObject(options.datetimeFormats)) {
              const locales = Object.keys(options.datetimeFormats);
              if (locales.length) {
                  locales.forEach(locale => {
                      global.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
                  });
              }
          }
          // merge number formats
          if (isObject(options.numberFormats)) {
              const locales = Object.keys(options.numberFormats);
              if (locales.length) {
                  locales.forEach(locale => {
                      global.mergeNumberFormat(locale, options.numberFormats[locale]);
                  });
              }
          }
      }
  }
  function createTextNode(key) {
      return createVNodeVue2Compatible(key);
  }
  function createVNodeVue2Compatible(key) {
      // shim Vue2 VNode interface
      // see the https://github.com/vuejs/vue/blob/dev/src/core/vdom/vnode.js
      const componentInstance = undefined;
      return {
          tag: undefined,
          data: undefined,
          children: undefined,
          text: key,
          elm: undefined,
          ns: undefined,
          context: undefined,
          fnContext: undefined,
          fnOptions: undefined,
          fnScopeId: undefined,
          key: undefined,
          componentOptions: undefined,
          componentInstance,
          parent: undefined,
          raw: false,
          isStatic: false,
          isRootInsert: true,
          isComment: false,
          isCloned: false,
          isOnce: false,
          asyncFactory: undefined,
          asyncMeta: undefined,
          isAsyncPlaceholder: false,
          child: () => componentInstance
      };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /* eslint-disable @typescript-eslint/no-explicit-any */
  // extend VNode interface
  const DEVTOOLS_META = '__INTLIFY_META__';
  let composerID = 0;
  function defineCoreMissingHandler(missing) {
      return ((ctx, locale, key, type) => {
          return missing(locale, key, vueDemi.getCurrentInstance() || undefined, type);
      });
  }
  // for Intlify DevTools
  const getMetaInfo =  () => {
      const instance = vueDemi.getCurrentInstance();
      let meta = null; // eslint-disable-line @typescript-eslint/no-explicit-any
      return instance && (meta = getComponentOptions(instance)[DEVTOOLS_META])
          ? { [DEVTOOLS_META]: meta } // eslint-disable-line @typescript-eslint/no-explicit-any
          : null;
  };
  /**
   * Create composer interface factory
   *
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  function createComposer(options = {}, VueI18nLegacy) {
      const { __root } = options;
      const _isGlobal = __root === undefined;
      let _inheritLocale = isBoolean(options.inheritLocale)
          ? options.inheritLocale
          : true;
      const _locale = vueDemi.ref(
      // prettier-ignore
      __root && _inheritLocale
          ? __root.locale.value
          : isString(options.locale)
              ? options.locale
              : DEFAULT_LOCALE);
      const _fallbackLocale = vueDemi.ref(
      // prettier-ignore
      __root && _inheritLocale
          ? __root.fallbackLocale.value
          : isString(options.fallbackLocale) ||
              isArray(options.fallbackLocale) ||
              isPlainObject(options.fallbackLocale) ||
              options.fallbackLocale === false
              ? options.fallbackLocale
              : _locale.value);
      const _messages = vueDemi.ref(getLocaleMessages(_locale.value, options));
      // prettier-ignore
      const _datetimeFormats = vueDemi.ref(isPlainObject(options.datetimeFormats)
              ? options.datetimeFormats
              : { [_locale.value]: {} })
          ;
      // prettier-ignore
      const _numberFormats = vueDemi.ref(isPlainObject(options.numberFormats)
              ? options.numberFormats
              : { [_locale.value]: {} })
          ;
      // warning suppress options
      // prettier-ignore
      let _missingWarn = __root
          ? __root.missingWarn
          : isBoolean(options.missingWarn) || isRegExp(options.missingWarn)
              ? options.missingWarn
              : true;
      // prettier-ignore
      let _fallbackWarn = __root
          ? __root.fallbackWarn
          : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn)
              ? options.fallbackWarn
              : true;
      // prettier-ignore
      let _fallbackRoot = __root
          ? __root.fallbackRoot
          : isBoolean(options.fallbackRoot)
              ? options.fallbackRoot
              : true;
      // configure fall back to root
      let _fallbackFormat = !!options.fallbackFormat;
      // runtime missing
      let _missing = isFunction(options.missing) ? options.missing : null;
      let _runtimeMissing = isFunction(options.missing)
          ? defineCoreMissingHandler(options.missing)
          : null;
      // postTranslation handler
      let _postTranslation = isFunction(options.postTranslation)
          ? options.postTranslation
          : null;
      // prettier-ignore
      let _warnHtmlMessage = __root
          ? __root.warnHtmlMessage
          : isBoolean(options.warnHtmlMessage)
              ? options.warnHtmlMessage
              : true;
      let _escapeParameter = !!options.escapeParameter;
      // custom linked modifiers
      // prettier-ignore
      const _modifiers = __root
          ? __root.modifiers
          : isPlainObject(options.modifiers)
              ? options.modifiers
              : {};
      // pluralRules
      let _pluralRules = options.pluralRules || (__root && __root.pluralRules);
      // for bridge
      let __legacy;
      {
          if (!isLegacyVueI18n(VueI18nLegacy)) {
              createI18nError(I18nErrorCodes.NOT_COMPATIBLE_LEGACY_VUE_I18N);
          }
          const legacyOptions = {
              locale: _locale.value,
              fallbackLocale: _fallbackLocale.value,
              messages: _messages.value,
              dateTimeFormats: _datetimeFormats.value,
              numberFormats: _numberFormats.value,
              modifiers: _modifiers,
              missing: _missing,
              fallbackRoot: _fallbackRoot,
              postTranslation: _postTranslation,
              pluralizationRules: _pluralRules,
              escapeParameterHtml: _escapeParameter,
              sync: _inheritLocale,
              silentFallbackWarn: isBoolean(_fallbackWarn)
                  ? !_fallbackWarn
                  : _fallbackWarn,
              silentTranslationWarn: isBoolean(_missingWarn)
                  ? !_missingWarn
                  : _missingWarn,
              formatFallbackMessages: isBoolean(_fallbackFormat)
                  ? !_fallbackFormat
                  : _fallbackFormat,
              warnHtmlInMessage: isBoolean(_warnHtmlMessage)
                  ? _warnHtmlMessage
                      ? 'warn'
                      : 'off'
                  : 'off',
              __VUE_I18N_BRIDGE__
          };
          __legacy = new VueI18nLegacy(legacyOptions);
      }
      // runtime context
      // eslint-disable-next-line prefer-const
      let _context;
      function getCoreContext() {
          _isGlobal && setFallbackContext(null);
          const ctxOptions = {
              version: VERSION,
              locale: _locale.value,
              fallbackLocale: _fallbackLocale.value,
              messages: _messages.value,
              modifiers: _modifiers,
              pluralRules: _pluralRules,
              missing: _runtimeMissing === null ? undefined : _runtimeMissing,
              missingWarn: _missingWarn,
              fallbackWarn: _fallbackWarn,
              fallbackFormat: _fallbackFormat,
              unresolving: true,
              postTranslation: _postTranslation === null ? undefined : _postTranslation,
              warnHtmlMessage: _warnHtmlMessage,
              escapeParameter: _escapeParameter,
              messageResolver: options.messageResolver,
              __meta: { framework: 'vue' }
          };
          {
              ctxOptions.datetimeFormats = _datetimeFormats.value;
              ctxOptions.numberFormats = _numberFormats.value;
              ctxOptions.__datetimeFormatters = isPlainObject(_context)
                  ? _context.__datetimeFormatters
                  : undefined;
              ctxOptions.__numberFormatters = isPlainObject(_context)
                  ? _context.__numberFormatters
                  : undefined;
          }
          const ctx = createCoreContext(ctxOptions);
          _isGlobal && setFallbackContext(ctx);
          return ctx;
      }
      _context = getCoreContext();
      updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
      // track reactivity
      function trackReactivityValues() {
          return [
                  _locale.value,
                  _fallbackLocale.value,
                  _messages.value,
                  _datetimeFormats.value,
                  _numberFormats.value
              ]
              ;
      }
      // locale
      const locale = vueDemi.computed({
          get: () => _locale.value,
          set: val => {
              _locale.value = val;
              {
                  if (__legacy && !_isGlobal) {
                      __legacy.locale = val;
                  }
              }
              _context.locale = _locale.value;
          }
      });
      // fallbackLocale
      const fallbackLocale = vueDemi.computed({
          get: () => _fallbackLocale.value,
          set: val => {
              _fallbackLocale.value = val;
              {
                  if (__legacy && !_isGlobal) {
                      __legacy.fallbackLocale = val;
                  }
              }
              _context.fallbackLocale = _fallbackLocale.value;
              updateFallbackLocale(_context, _locale.value, val);
          }
      });
      // messages
      const messages = vueDemi.computed(() => _messages.value);
      // datetimeFormats
      const datetimeFormats = /* #__PURE__*/ vueDemi.computed(() => _datetimeFormats.value);
      // numberFormats
      const numberFormats = /* #__PURE__*/ vueDemi.computed(() => _numberFormats.value);
      // getPostTranslationHandler
      function getPostTranslationHandler() {
          return isFunction(_postTranslation) ? _postTranslation : null;
      }
      // setPostTranslationHandler
      function setPostTranslationHandler(handler) {
          _postTranslation = handler;
          _context.postTranslation = handler;
      }
      // getMissingHandler
      function getMissingHandler() {
          return _missing;
      }
      // setMissingHandler
      function setMissingHandler(handler) {
          if (handler !== null) {
              _runtimeMissing = defineCoreMissingHandler(handler);
          }
          _missing = handler;
          _context.missing = _runtimeMissing;
      }
      function isResolvedTranslateMessage(type, arg // eslint-disable-line @typescript-eslint/no-explicit-any
      ) {
          return type !== 'translate' || !arg.resolvedMessage;
      }
      function wrapWithDeps(fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) {
          trackReactivityValues(); // track reactive dependency
          // NOTE: experimental !!
          let ret;
          {
              try {
                  setAdditionalMeta(getMetaInfo());
                  if (!_isGlobal) {
                      _context.fallbackContext = __root
                          ? getFallbackContext()
                          : undefined;
                  }
                  ret = fn(_context);
              }
              finally {
                  setAdditionalMeta(null);
                  if (!_isGlobal) {
                      _context.fallbackContext = undefined;
                  }
              }
          }
          if (isNumber(ret) && ret === NOT_REOSLVED) {
              const [key, arg2] = argumentParser();
              if (__root &&
                  isString(key) &&
                  isResolvedTranslateMessage(warnType, arg2)) {
                  if (_fallbackRoot &&
                      (isTranslateFallbackWarn(_fallbackWarn, key) ||
                          isTranslateMissingWarn(_missingWarn, key))) {
                      warn(getWarnMessage(I18nWarnCodes.FALLBACK_TO_ROOT, {
                          key,
                          type: warnType
                      }));
                  }
              }
              return __root && _fallbackRoot
                  ? fallbackSuccess(__root)
                  : fallbackFail(key);
          }
          else if (successCondition(ret)) {
              return ret;
          }
          else {
              /* istanbul ignore next */
              throw createI18nError(I18nErrorCodes.UNEXPECTED_RETURN_TYPE);
          }
      }
      // t
      function t(...args) {
          return wrapWithDeps(context => Reflect.apply(translate, null, [context, ...args]), () => parseTranslateArgs(...args), 'translate', root => Reflect.apply(root.t, root, [...args]), key => key, val => isString(val));
      }
      // rt
      function rt(...args) {
          const [arg1, arg2, arg3] = args;
          if (arg3 && !isObject(arg3)) {
              throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
          }
          return t(...[arg1, arg2, assign({ resolvedMessage: true }, arg3 || {})]);
      }
      // d
      function d(...args) {
          return wrapWithDeps(context => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), 'datetime format', root => Reflect.apply(root.d, root, [...args]), () => MISSING_RESOLVE_VALUE, val => isString(val));
      }
      // n
      function n(...args) {
          return wrapWithDeps(context => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), 'number format', root => Reflect.apply(root.n, root, [...args]), () => MISSING_RESOLVE_VALUE, val => isString(val));
      }
      // for custom processor
      function normalize(values) {
          return values.map(val => isString(val) || isNumber(val) || isBoolean(val)
              ? createTextNode(String(val))
              : val);
      }
      const interpolate = (val) => val;
      const processor = {
          normalize,
          interpolate,
          type: 'vnode'
      };
      // transrateVNode, using for `i18n-t` component
      function transrateVNode(...args) {
          return wrapWithDeps(context => {
              let ret;
              const _context = context;
              try {
                  _context.processor = processor;
                  ret = Reflect.apply(translate, null, [_context, ...args]);
              }
              finally {
                  _context.processor = null;
              }
              return ret;
          }, () => parseTranslateArgs(...args), 'translate', 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          root => root[TransrateVNodeSymbol](...args), key => [createTextNode(key)], val => isArray(val));
      }
      // numberParts, using for `i18n-n` component
      function numberParts(...args) {
          return wrapWithDeps(context => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), 'number format', 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          root => root[NumberPartsSymbol](...args), () => [], val => isString(val) || isArray(val));
      }
      // datetimeParts, using for `i18n-d` component
      function datetimeParts(...args) {
          return wrapWithDeps(context => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), 'datetime format', 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          root => root[DatetimePartsSymbol](...args), () => [], val => isString(val) || isArray(val));
      }
      function setPluralRules(rules) {
          _pluralRules = rules;
          _context.pluralRules = _pluralRules;
      }
      // te
      function te(key, locale) {
          const targetLocale = isString(locale) ? locale : _locale.value;
          const message = getLocaleMessage(targetLocale);
          return _context.messageResolver(message, key) !== null;
      }
      function resolveMessages(key) {
          let messages = null;
          const locales = fallbackWithLocaleChain(_context, _fallbackLocale.value, _locale.value);
          for (let i = 0; i < locales.length; i++) {
              const targetLocaleMessages = _messages.value[locales[i]] || {};
              const messageValue = _context.messageResolver(targetLocaleMessages, key);
              if (messageValue != null) {
                  messages = messageValue;
                  break;
              }
          }
          return messages;
      }
      // tm
      function tm(key) {
          const messages = resolveMessages(key);
          // prettier-ignore
          return messages != null
              ? messages
              : __root
                  ? __root.tm(key) || {}
                  : {};
      }
      // getLocaleMessage
      function getLocaleMessage(locale) {
          return (_messages.value[locale] || {});
      }
      // setLocaleMessage
      function setLocaleMessage(locale, message) {
          _messages.value[locale] = message;
          {
              __legacy && __legacy.setLocaleMessage(locale, message);
          }
          _context.messages = _messages.value;
      }
      // mergeLocaleMessage
      function mergeLocaleMessage(locale, message) {
          _messages.value[locale] = _messages.value[locale] || {};
          {
              __legacy && __legacy.mergeLocaleMessage(locale, message);
          }
          deepCopy(message, _messages.value[locale]);
          _context.messages = _messages.value;
      }
      // getDateTimeFormat
      function getDateTimeFormat(locale) {
          return _datetimeFormats.value[locale] || {};
      }
      // setDateTimeFormat
      function setDateTimeFormat(locale, format) {
          _datetimeFormats.value[locale] = format;
          {
              __legacy && __legacy.setDateTimeFormat(locale, format);
          }
          _context.datetimeFormats = _datetimeFormats.value;
          clearDateTimeFormat(_context, locale, format);
      }
      // mergeDateTimeFormat
      function mergeDateTimeFormat(locale, format) {
          _datetimeFormats.value[locale] = assign(_datetimeFormats.value[locale] || {}, format);
          {
              __legacy && __legacy.mergeDateTimeFormat(locale, format);
          }
          _context.datetimeFormats = _datetimeFormats.value;
          clearDateTimeFormat(_context, locale, format);
      }
      // getNumberFormat
      function getNumberFormat(locale) {
          return _numberFormats.value[locale] || {};
      }
      // setNumberFormat
      function setNumberFormat(locale, format) {
          _numberFormats.value[locale] = format;
          {
              __legacy && __legacy.setNumberFormat(locale, format);
          }
          _context.numberFormats = _numberFormats.value;
          clearNumberFormat(_context, locale, format);
      }
      // mergeNumberFormat
      function mergeNumberFormat(locale, format) {
          _numberFormats.value[locale] = assign(_numberFormats.value[locale] || {}, format);
          {
              __legacy && __legacy.mergeNumberFormat(locale, format);
          }
          _context.numberFormats = _numberFormats.value;
          clearNumberFormat(_context, locale, format);
      }
      // for debug
      composerID++;
      // watch root locale & fallbackLocale
      if (__root && inBrowser) {
          vueDemi.watch(__root.locale, (val) => {
              if (_inheritLocale) {
                  _locale.value = val;
                  {
                      if (__legacy && !_isGlobal) {
                          __legacy.locale = val;
                      }
                  }
                  _context.locale = val;
                  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
              }
          });
          vueDemi.watch(__root.fallbackLocale, (val) => {
              if (_inheritLocale) {
                  _fallbackLocale.value = val;
                  {
                      if (__legacy && !_isGlobal) {
                          __legacy.fallbackLocale = val;
                      }
                  }
                  _context.fallbackLocale = val;
                  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
              }
          });
      }
      // define basic composition API!
      const composer = {
          id: composerID,
          locale,
          fallbackLocale,
          get inheritLocale() {
              return _inheritLocale;
          },
          set inheritLocale(val) {
              _inheritLocale = val;
              {
                  if (__legacy) {
                      __legacy._sync = val;
                  }
              }
              if (val && __root) {
                  _locale.value = __root.locale.value;
                  _fallbackLocale.value = __root.fallbackLocale.value;
                  {
                      if (__legacy) {
                          __legacy.locale = __root.locale.value;
                          __legacy.fallbackLocale = __root.fallbackLocale.value;
                      }
                  }
                  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
              }
          },
          get availableLocales() {
              return Object.keys(_messages.value).sort();
          },
          messages,
          get modifiers() {
              return _modifiers;
          },
          get pluralRules() {
              return _pluralRules || {};
          },
          get isGlobal() {
              return _isGlobal;
          },
          get missingWarn() {
              return _missingWarn;
          },
          set missingWarn(val) {
              _missingWarn = val;
              _context.missingWarn = _missingWarn;
          },
          get fallbackWarn() {
              return _fallbackWarn;
          },
          set fallbackWarn(val) {
              _fallbackWarn = val;
              _context.fallbackWarn = _fallbackWarn;
          },
          get fallbackRoot() {
              return _fallbackRoot;
          },
          set fallbackRoot(val) {
              _fallbackRoot = val;
          },
          get fallbackFormat() {
              return _fallbackFormat;
          },
          set fallbackFormat(val) {
              _fallbackFormat = val;
              _context.fallbackFormat = _fallbackFormat;
          },
          get warnHtmlMessage() {
              return _warnHtmlMessage;
          },
          set warnHtmlMessage(val) {
              _warnHtmlMessage = val;
              _context.warnHtmlMessage = val;
          },
          get escapeParameter() {
              return _escapeParameter;
          },
          set escapeParameter(val) {
              _escapeParameter = val;
              _context.escapeParameter = val;
          },
          t,
          getLocaleMessage,
          setLocaleMessage,
          mergeLocaleMessage,
          getPostTranslationHandler,
          setPostTranslationHandler,
          getMissingHandler,
          setMissingHandler,
          [SetPluralRulesSymbol]: setPluralRules
      };
      {
          composer.datetimeFormats = datetimeFormats;
          composer.numberFormats = numberFormats;
          composer.rt = rt;
          composer.te = te;
          composer.tm = tm;
          composer.d = d;
          composer.n = n;
          composer.getDateTimeFormat = getDateTimeFormat;
          composer.setDateTimeFormat = setDateTimeFormat;
          composer.mergeDateTimeFormat = mergeDateTimeFormat;
          composer.getNumberFormat = getNumberFormat;
          composer.setNumberFormat = setNumberFormat;
          composer.mergeNumberFormat = mergeNumberFormat;
          composer[InejctWithOption] = options.__injectWithOption;
          composer[TransrateVNodeSymbol] = transrateVNode;
          composer[DatetimePartsSymbol] = datetimeParts;
          composer[NumberPartsSymbol] = numberParts;
      }
      {
          composer[LegacyInstanceSymbol] = __legacy;
      }
      return composer;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const baseFormatProps = {
      tag: {
          type: [String, Object]
      },
      locale: {
          type: String
      },
      scope: {
          type: String,
          // NOTE: avoid https://github.com/microsoft/rushstack/issues/1050
          validator: (val /* ComponetI18nScope */) => val === 'parent' || val === 'global',
          default: 'parent' /* ComponetI18nScope */
      },
      i18n: {
          type: Object
      }
  };

  function getInterpolateArg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { slots }, // SetupContext,
  keys) {
      if (keys.length === 1 && keys[0] === 'default') {
          // default slot with list
          const ret = slots.default ? slots.default() : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return ret.reduce((slot, current) => {
              return (slot = [
                  ...slot,
                  ...(isArray(current.children) ? current.children : [current])
              ]);
          }, []);
      }
      else {
          // named slots
          return keys.reduce((arg, key) => {
              const slot = slots[key];
              if (slot) {
                  arg[key] = slot();
              }
              return arg;
          }, {});
      }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getFragmentableTag(tag) {
      return tag;
  }

  /**
   * Translation Component
   *
   * @remarks
   * See the following items for property about details
   *
   * @VueI18nSee [TranslationProps](component#translationprops)
   * @VueI18nSee [BaseFormatProps](component#baseformatprops)
   * @VueI18nSee [Component Interpolation](../guide/advanced/component)
   *
   * @example
   * ```html
   * <div id="app">
   *   <!-- ... -->
   *   <i18n path="term" tag="label" for="tos">
   *     <a :href="url" target="_blank">{{ $t('tos') }}</a>
   *   </i18n>
   *   <!-- ... -->
   * </div>
   * ```
   * ```js
   * import { createApp } from 'vue'
   * import { createI18n } from 'vue-i18n'
   *
   * const messages = {
   *   en: {
   *     tos: 'Term of Service',
   *     term: 'I accept xxx {0}.'
   *   },
   *   ja: {
   *     tos: '利用規約',
   *     term: '私は xxx の{0}に同意します。'
   *   }
   * }
   *
   * const i18n = createI18n({
   *   locale: 'en',
   *   messages
   * })
   *
   * const app = createApp({
   *   data: {
   *     url: '/term'
   *   }
   * }).use(i18n).mount('#app')
   * ```
   *
   * @VueI18nComponent
   */
  const Translation =  /* defineComponent */ {
      /* eslint-disable */
      name: 'i18n-t',
      props: assign({
          keypath: {
              type: String,
              required: true
          },
          plural: {
              type: [Number, String],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              validator: (val) => isNumber(val) || !isNaN(val)
          }
      }, baseFormatProps),
      /* eslint-enable */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setup(props, context) {
          const { slots, attrs } = context;
          // NOTE: avoid https://github.com/microsoft/rushstack/issues/1050
          const i18n = props.i18n ||
              useI18n({
                  useScope: props.scope,
                  __useComponent: true
              });
          return () => {
              const keys = Object.keys(slots).filter(key => key !== '_');
              const options = {};
              if (props.locale) {
                  options.locale = props.locale;
              }
              if (props.plural !== undefined) {
                  options.plural = isString(props.plural) ? +props.plural : props.plural;
              }
              const arg = getInterpolateArg(context, keys);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const children = i18n[TransrateVNodeSymbol](props.keypath, arg, options);
              const assignedAttrs = assign({}, attrs);
              const tag = isString(props.tag) || isObject(props.tag)
                  ? props.tag
                  : getFragmentableTag('span');
              return vueDemi.h(tag, assignedAttrs, children);
          };
      }
  };

  function isVNode(target) {
      return isArray(target) && !isString(target[0]);
  }
  function renderFormatter(props, context, slotKeys, partFormatter) {
      const { slots, attrs } = context;
      return () => {
          const options = { part: true };
          let overrides = {};
          if (props.locale) {
              options.locale = props.locale;
          }
          if (isString(props.format)) {
              options.key = props.format;
          }
          else if (isObject(props.format)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (isString(props.format.key)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  options.key = props.format.key;
              }
              // Filter out number format options only
              overrides = Object.keys(props.format).reduce((options, prop) => {
                  return slotKeys.includes(prop)
                      ? assign({}, options, { [prop]: props.format[prop] }) // eslint-disable-line @typescript-eslint/no-explicit-any
                      : options;
              }, {});
          }
          const parts = partFormatter(...[props.value, options, overrides]);
          let children = [options.key];
          if (isArray(parts)) {
              children = parts.map((part, index) => {
                  const slot = slots[part.type];
                  const node = slot
                      ? slot({ [part.type]: part.value, index, parts })
                      : [part.value];
                  if (isVNode(node)) {
                      node[0].key = `${part.type}-${index}`;
                  }
                  return node;
              });
          }
          else if (isString(parts)) {
              children = [parts];
          }
          const assignedAttrs = assign({}, attrs);
          const tag = isString(props.tag) || isObject(props.tag)
              ? props.tag
              : getFragmentableTag('span');
          return vueDemi.h(tag, assignedAttrs, children);
      };
  }

  /**
   * Number Format Component
   *
   * @remarks
   * See the following items for property about details
   *
   * @VueI18nSee [FormattableProps](component#formattableprops)
   * @VueI18nSee [BaseFormatProps](component#baseformatprops)
   * @VueI18nSee [Custom Formatting](../guide/essentials/number#custom-formatting)
   *
   * @VueI18nDanger
   * Not supported IE, due to no support `Intl.NumberFormat#formatToParts` in [IE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts)
   *
   * If you want to use it, you need to use [polyfill](https://github.com/formatjs/formatjs/tree/main/packages/intl-numberformat)
   *
   * @VueI18nComponent
   */
  const NumberFormat =  /* defineComponent */ {
      /* eslint-disable */
      name: 'i18n-n',
      props: assign({
          value: {
              type: Number,
              required: true
          },
          format: {
              type: [String, Object]
          }
      }, baseFormatProps),
      /* eslint-enable */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setup(props, context) {
          const i18n = props.i18n ||
              useI18n({ useScope: 'parent', __useComponent: true });
          return renderFormatter(props, context, NUMBER_FORMAT_OPTIONS_KEYS, (...args) => 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          i18n[NumberPartsSymbol](...args));
      }
  };

  /**
   * Datetime Format Component
   *
   * @remarks
   * See the following items for property about details
   *
   * @VueI18nSee [FormattableProps](component#formattableprops)
   * @VueI18nSee [BaseFormatProps](component#baseformatprops)
   * @VueI18nSee [Custom Formatting](../guide/essentials/datetime#custom-formatting)
   *
   * @VueI18nDanger
   * Not supported IE, due to no support `Intl.DateTimeFormat#formatToParts` in [IE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts)
   *
   * If you want to use it, you need to use [polyfill](https://github.com/formatjs/formatjs/tree/main/packages/intl-datetimeformat)
   *
   * @VueI18nComponent
   */
  const DatetimeFormat =  /*defineComponent */ {
      /* eslint-disable */
      name: 'i18n-d',
      props: assign({
          value: {
              type: [Number, Date],
              required: true
          },
          format: {
              type: [String, Object]
          }
      }, baseFormatProps),
      /* eslint-enable */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setup(props, context) {
          const i18n = props.i18n ||
              useI18n({ useScope: 'parent', __useComponent: true });
          return renderFormatter(props, context, DATETIME_FORMAT_OPTIONS_KEYS, (...args) => 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          i18n[DatetimePartsSymbol](...args));
      }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function apply(Vue, ...options) {
      const pluginOptions = isPlainObject(options[0])
          ? options[0]
          : {};
      const globalInstall = isBoolean(pluginOptions.globalInstall)
          ? pluginOptions.globalInstall
          : true;
      if (globalInstall) {
          // install components
          Vue.component(Translation.name, Translation);
          Vue.component(NumberFormat.name, NumberFormat);
          Vue.component(DatetimeFormat.name, DatetimeFormat);
      }
  }

  /**
   * Port from vue-i18n@v8.x
   * This mixin is used when we use vue-i18n-bridge
   */
  function defineMixin(i18n, VueI18n // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  ) {
      return {
          beforeCreate() {
              const options = this.$options; // eslint-disable-line @typescript-eslint/no-explicit-any
              if (options.__VUE18N__INSTANCE__) {
                  return;
              }
              options.i18n = options.i18n || (options.__i18nBridge ? {} : null);
              this._i18nBridgeRoot = i18n;
              if (i18n.mode === 'composition') {
                  this._i18n = i18n;
                  return;
              }
              if (options.i18n) {
                  if (options.i18n instanceof VueI18n) {
                      // init locale messages via custom blocks
                      if (options.__i18nBridge) {
                          try {
                              const localeMessages = options.i18n && options.i18n.messages
                                  ? options.i18n.messages
                                  : {};
                              options.__i18nBridge.forEach(resource => deepCopy(JSON.parse(resource), localeMessages));
                              Object.keys(localeMessages).forEach((locale) => {
                                  options.i18n.mergeLocaleMessage(locale, localeMessages[locale]);
                              });
                          }
                          catch (e) {
                              {
                                  console.error(`Cannot parse locale messages via custom blocks.`, e);
                              }
                          }
                      }
                      this._i18n = options.i18n;
                      this._i18nWatcher = this._i18n.watchI18nData();
                  }
                  else if (isPlainObject(options.i18n)) {
                      const rootI18n = this.$root &&
                          this.$root.$i18n &&
                          this.$root.$i18n instanceof VueI18n
                          ? this.$root.$i18n
                          : null;
                      // component local i18n
                      if (rootI18n) {
                          options.i18n.root = this.$root;
                          options.i18n.formatter = rootI18n.formatter;
                          options.i18n.fallbackLocale = rootI18n.fallbackLocale;
                          options.i18n.formatFallbackMessages =
                              rootI18n.formatFallbackMessages;
                          options.i18n.silentTranslationWarn = rootI18n.silentTranslationWarn;
                          options.i18n.silentFallbackWarn = rootI18n.silentFallbackWarn;
                          options.i18n.pluralizationRules = rootI18n.pluralizationRules;
                          options.i18n.preserveDirectiveContent =
                              rootI18n.preserveDirectiveContent;
                      }
                      // init locale messages via custom blocks
                      if (options.__i18nBridge) {
                          try {
                              const localeMessages = options.i18n && options.i18n.messages
                                  ? options.i18n.messages
                                  : {};
                              options.__i18nBridge.forEach(resource => deepCopy(JSON.parse(resource), localeMessages));
                              options.i18n.messages = localeMessages;
                          }
                          catch (e) {
                              {
                                  warn(`Cannot parse locale messages via custom blocks.`, e);
                              }
                          }
                      }
                      const { sharedMessages } = options.i18n;
                      if (sharedMessages && isPlainObject(sharedMessages)) {
                          deepCopy(sharedMessages, options.i18n.messages);
                      }
                      this._i18n = new VueI18n(options.i18n);
                      this._i18nWatcher = this._i18n.watchI18nData();
                      if (options.i18n.sync === undefined || !!options.i18n.sync) {
                          this._localeWatcher = this.$i18n.watchLocale();
                      }
                      if (rootI18n) {
                          rootI18n.onComponentInstanceCreated(this._i18n);
                      }
                  }
                  else {
                      {
                          warn(`Cannot be interpreted 'i18n' option.`);
                      }
                  }
              }
              else if (this.$root &&
                  this.$root.$i18n &&
                  this.$root.$i18n instanceof VueI18n) {
                  // root i18n
                  this._i18n = this.$root.$i18n;
              }
              else if (options.parent &&
                  options.parent.$i18n &&
                  options.parent.$i18n instanceof VueI18n) {
                  // parent i18n
                  this._i18n = options.parent.$i18n;
              }
          },
          beforeMount() {
              const options = this.$options; // eslint-disable-line @typescript-eslint/no-explicit-any
              if (options.__VUE18N__INSTANCE__) {
                  return;
              }
              if (i18n.mode === 'composition') {
                  return;
              }
              options.i18n = options.i18n || (options.__i18nBridge ? {} : null);
              if (options.i18n) {
                  if (options.i18n instanceof VueI18n) {
                      // init locale messages via custom blocks
                      this._i18n.subscribeDataChanging(this);
                      this._subscribing = true;
                  }
                  else if (isPlainObject(options.i18n)) {
                      this._i18n.subscribeDataChanging(this);
                      this._subscribing = true;
                  }
                  else {
                      {
                          warn(`Cannot be interpreted 'i18n' option.`);
                      }
                  }
              }
              else if (this.$root &&
                  this.$root.$i18n &&
                  this.$root.$i18n instanceof VueI18n) {
                  this._i18n.subscribeDataChanging(this);
                  this._subscribing = true;
              }
              else if (options.parent &&
                  options.parent.$i18n &&
                  options.parent.$i18n instanceof VueI18n) {
                  this._i18n.subscribeDataChanging(this);
                  this._subscribing = true;
              }
          },
          beforeDestroy() {
              const options = this.$options; // eslint-disable-line @typescript-eslint/no-explicit-any
              if (options.__VUE18N__INSTANCE__) {
                  return;
              }
              if (this._i18nBridgeRoot) {
                  delete this._i18nBridgeRoot;
                  return;
              }
              if (i18n.mode === 'composition') {
                  delete this._i18n;
                  return;
              }
              if (!this._i18n) {
                  return;
              }
              const self = this; // eslint-disable-line @typescript-eslint/no-explicit-any
              this.$nextTick(() => {
                  if (self._subscribing) {
                      self._i18n.unsubscribeDataChanging(self);
                      delete self._subscribing;
                  }
                  if (self._i18nWatcher) {
                      self._i18nWatcher();
                      self._i18n.destroyVM();
                      delete self._i18nWatcher;
                  }
                  if (self._localeWatcher) {
                      self._localeWatcher();
                      delete self._localeWatcher;
                  }
              });
          }
      };
  }

  // for bridge
  let _legacyVueI18n = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  /**
   * Injection key for {@link useI18n}
   *
   * @remarks
   * The global injection key for I18n instances with `useI18n`. this injection key is used in Web Components.
   * Specify the i18n instance created by {@link createI18n} together with `provide` function.
   *
   * @VueI18nGeneral
   */
  const I18nInjectionKey = 
  /* #__PURE__*/ makeSymbol('global-vue-i18n');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  function createI18n(options = {}, VueI18nLegacy) {
      {
          _legacyVueI18n = VueI18nLegacy;
      }
      // prettier-ignore
      const __legacyMode = isBoolean(options.legacy)
              ? options.legacy
              : true;
      // prettier-ignore
      const __globalInjection = isBoolean(options.globalInjection)
          ? options.globalInjection
          : true;
      // prettier-ignore
      const __allowComposition = __legacyMode
              ? !!options.allowComposition
              : true;
      const __instances = new Map();
      const [globalScope, __global] = createGlobal(options, __legacyMode, VueI18nLegacy);
      function __getInstance(component) {
          return __instances.get(component) || null;
      }
      function __setInstance(component, instance) {
          __instances.set(component, instance);
      }
      function __deleteInstance(component) {
          __instances.delete(component);
      }
      {
          // extend legacy VueI18n instance
          const i18n = __global[LegacyInstanceSymbol]; // eslint-disable-line @typescript-eslint/no-explicit-any
          let _localeWatcher = null;
          Object.defineProperty(i18n, 'global', {
              get() {
                  return __global;
              }
          });
          Object.defineProperty(i18n, 'mode', {
              get() {
                  return __legacyMode ? 'legacy' : 'composition';
              }
          });
          Object.defineProperty(i18n, 'allowComposition', {
              get() {
                  return __allowComposition;
              }
          });
          Object.defineProperty(i18n, '__instances', {
              get() {
                  return __instances;
              }
          });
          Object.defineProperty(i18n, 'install', {
              writable: true,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              value: (Vue, ...options) => {
                  const version = (Vue && Vue.version && Number(Vue.version.split('.')[0])) || -1;
                  if (version !== 2) {
                      throw createI18nError(I18nErrorCodes.BRIDGE_SUPPORT_VUE_2_ONLY);
                  }
                  apply(Vue, ...options);
                  if (!__legacyMode && __globalInjection) {
                      _localeWatcher = injectGlobalFieldsForBridge(Vue, i18n, __global);
                  }
                  Vue.mixin(defineMixin(i18n, _legacyVueI18n));
              }
          });
          Object.defineProperty(i18n, 'dispose', {
              value: () => {
                  _localeWatcher && _localeWatcher();
                  globalScope.stop();
              }
          });
          const methodMap = {
              __getInstance,
              __setInstance,
              __deleteInstance
          };
          Object.keys(methodMap).forEach(key => Object.defineProperty(i18n, key, { value: methodMap[key] }) // eslint-disable-line @typescript-eslint/no-explicit-any
          );
          return i18n;
      }
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  function useI18n(options = {}) {
      const instance = vueDemi.getCurrentInstance();
      if (instance == null) {
          throw createI18nError(I18nErrorCodes.MUST_BE_CALL_SETUP_TOP);
      }
      {
          if (_legacyVueI18n == null) {
              throw createI18nError(I18nErrorCodes.NOT_INSLALLED);
          }
      }
      const i18n = getI18nInstance(instance);
      const global = getGlobalComposer(i18n);
      const componentOptions = getComponentOptions(instance);
      const scope = getScope(options, componentOptions);
      {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (i18n.mode === 'legacy' && !options.__useComponent) {
              if (!i18n.allowComposition) {
                  throw createI18nError(I18nErrorCodes.NOT_AVAILABLE_IN_LEGACY_MODE);
              }
              return useI18nForLegacy(instance, scope, global, options);
          }
      }
      if (scope === 'global') {
          adjustI18nResources(global, options, componentOptions);
          return global;
      }
      if (scope === 'parent') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let composer = getComposer(i18n, instance, options.__useComponent);
          if (composer == null) {
              {
                  warn(getWarnMessage(I18nWarnCodes.NOT_FOUND_PARENT_SCOPE));
              }
              composer = global;
          }
          return composer;
      }
      const i18nInternal = i18n;
      let composer = i18nInternal.__getInstance(instance);
      if (composer == null) {
          const composerOptions = assign({}, options);
          if ('__i18n' in componentOptions) {
              composerOptions.__i18n = componentOptions.__i18n;
          }
          if (global) {
              composerOptions.__root = global;
          }
          composer = createComposer(composerOptions, _legacyVueI18n);
          setupLifeCycle(i18nInternal, instance, composer);
          i18nInternal.__setInstance(instance, composer);
      }
      return composer;
  }
  /**
   * Cast to VueI18n legacy compatible type
   *
   * @remarks
   * This API is provided only with [vue-i18n-bridge](https://vue-i18n.intlify.dev/guide/migration/ways.html#what-is-vue-i18n-bridge).
   *
   * The purpose of this function is to convert an {@link I18n} instance created with {@link createI18n | createI18n(legacy: true)} into a `vue-i18n@v8.x` compatible instance of `new VueI18n` in a TypeScript environment.
   *
   * @param i18n - An instance of {@link I18n}
   * @returns A i18n instance which is casted to {@link VueI18n} type
   *
   * @VueI18nTip
   * :new: provided by **vue-i18n-bridge only**
   *
   * @VueI18nGeneral
   */
  const castToVueI18n =  (i18n
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => {
      if (!(__VUE_I18N_BRIDGE__ in i18n)) {
          throw createI18nError(I18nErrorCodes.NOT_COMPATIBLE_LEGACY_VUE_I18N);
      }
      return i18n;
  };
  function createGlobal(options, legacyMode, VueI18nLegacy // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
      const scope = vueDemi.effectScope();
      {
          if (!isLegacyVueI18n(VueI18nLegacy)) {
              throw createI18nError(I18nErrorCodes.NOT_COMPATIBLE_LEGACY_VUE_I18N);
          }
          const obj = scope.run(() => createComposer(options, VueI18nLegacy));
          if (obj == null) {
              throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
          }
          return [scope, obj];
      }
  }
  function getI18nInstance(instance) {
      {
          const vm = instance.proxy;
          /* istanbul ignore if */
          if (vm == null) {
              throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
          }
          const i18n = vm._i18nBridgeRoot; // eslint-disable-line @typescript-eslint/no-explicit-any
          /* istanbul ignore if */
          if (!i18n) {
              throw createI18nError(I18nErrorCodes.NOT_INSLALLED);
          }
          return i18n;
      }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getScope(options, componentOptions) {
      // prettier-ignore
      return isEmptyObject(options)
          ? ('__i18n' in componentOptions)
              ? 'local'
              : 'global'
          : !options.useScope
              ? 'local'
              : options.useScope;
  }
  function getGlobalComposer(i18n) {
      // prettier-ignore
      return i18n.global;
  }
  function getComposer(i18n, target, useComponent = false) {
      let composer = null;
      const root = target.root;
      let current = target.parent;
      while (current != null) {
          const i18nInternal = i18n;
          if (i18n.mode === 'composition') {
              composer = i18nInternal.__getInstance(current);
          }
          else {
              {
                  const vueI18n = i18nInternal.__getInstance(current);
                  if (vueI18n != null) {
                      composer = vueI18n
                          .__composer;
                      if (useComponent &&
                          composer &&
                          !composer[InejctWithOption] // eslint-disable-line @typescript-eslint/no-explicit-any
                      ) {
                          composer = null;
                      }
                  }
              }
          }
          if (composer != null) {
              break;
          }
          if (root === current) {
              break;
          }
          current = current.parent;
      }
      return composer;
  }
  function setupLifeCycle(i18n, target, composer) {
      {
          // assign legacy VueI18n instance to Vue2 instance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vm = target.proxy;
          if (vm == null) {
              throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const _i18n = composer[LegacyInstanceSymbol];
          if (_i18n === i18n) {
              throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
          }
          vm._i18n = _i18n;
          vm._i18n_bridge = true;
          // browser only
          if (inBrowser) {
              vm._i18nWatcher = vm._i18n.watchI18nData();
              if (vm._i18n._sync) {
                  vm._localeWatcher = vm._i18n.watchLocale();
              }
          }
          let subscribing = false;
          vueDemi.onBeforeMount(() => {
              vm._i18n.subscribeDataChanging(vm);
              subscribing = true;
          }, vm);
          vueDemi.onUnmounted(() => {
              if (subscribing) {
                  vm._i18n.unsubscribeDataChanging(vm);
                  subscribing = false;
              }
              if (vm._i18nWatcher) {
                  vm._i18nWatcher();
                  vm._i18n.destroyVM();
                  delete vm._i18nWatcher;
              }
              if (vm._localeWatcher) {
                  vm._localeWatcher();
                  delete vm._localeWatcher;
              }
              delete vm._i18n_bridge;
              delete vm._i18n;
          }, vm);
      }
  }
  function useI18nForLegacy(instance, scope, root, options = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
      const isLocale = scope === 'local';
      const _composer = vueDemi.shallowRef(null);
      if (isLocale &&
          instance.proxy &&
          !(instance.proxy.$options.i18n || instance.proxy.$options.__i18n)) {
          throw createI18nError(I18nErrorCodes.MUST_DEFINE_I18N_OPTION_IN_ALLOW_COMPOSITION);
      }
      const _inheritLocale = isBoolean(options.inheritLocale)
          ? options.inheritLocale
          : true;
      const _locale = vueDemi.ref(
      // prettier-ignore
      isLocale && _inheritLocale
          ? root.locale.value
          : isString(options.locale)
              ? options.locale
              : DEFAULT_LOCALE);
      const _fallbackLocale = vueDemi.ref(
      // prettier-ignore
      isLocale && _inheritLocale
          ? root.fallbackLocale.value
          : isString(options.fallbackLocale) ||
              isArray(options.fallbackLocale) ||
              isPlainObject(options.fallbackLocale) ||
              options.fallbackLocale === false
              ? options.fallbackLocale
              : _locale.value);
      const _messages = vueDemi.ref(getLocaleMessages(_locale.value, options));
      // prettier-ignore
      const _datetimeFormats = vueDemi.ref(isPlainObject(options.datetimeFormats)
          ? options.datetimeFormats
          : { [_locale.value]: {} });
      // prettier-ignore
      const _numberFormats = vueDemi.ref(isPlainObject(options.numberFormats)
          ? options.numberFormats
          : { [_locale.value]: {} });
      // prettier-ignore
      const _missingWarn = isLocale
          ? root.missingWarn
          : isBoolean(options.missingWarn) || isRegExp(options.missingWarn)
              ? options.missingWarn
              : true;
      // prettier-ignore
      const _fallbackWarn = isLocale
          ? root.fallbackWarn
          : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn)
              ? options.fallbackWarn
              : true;
      // prettier-ignore
      const _fallbackRoot = isLocale
          ? root.fallbackRoot
          : isBoolean(options.fallbackRoot)
              ? options.fallbackRoot
              : true;
      // configure fall back to root
      const _fallbackFormat = !!options.fallbackFormat;
      // runtime missing
      const _missing = isFunction(options.missing) ? options.missing : null;
      // postTranslation handler
      const _postTranslation = isFunction(options.postTranslation)
          ? options.postTranslation
          : null;
      // prettier-ignore
      const _warnHtmlMessage = isLocale
          ? root.warnHtmlMessage
          : isBoolean(options.warnHtmlMessage)
              ? options.warnHtmlMessage
              : true;
      const _escapeParameter = !!options.escapeParameter;
      // prettier-ignore
      const _modifiers = isLocale
          ? root.modifiers
          : isPlainObject(options.modifiers)
              ? options.modifiers
              : {};
      // pluralRules
      const _pluralRules = options.pluralRules || (isLocale && root.pluralRules);
      // track reactivity
      function trackReactivityValues() {
          return [
              _locale.value,
              _fallbackLocale.value,
              _messages.value,
              _datetimeFormats.value,
              _numberFormats.value
          ];
      }
      // locale
      const locale = vueDemi.computed({
          get: () => {
              return _composer.value ? _composer.value.locale.value : _locale.value;
          },
          set: val => {
              if (_composer.value) {
                  _composer.value.locale.value = val;
              }
              _locale.value = val;
          }
      });
      // fallbackLocale
      const fallbackLocale = vueDemi.computed({
          get: () => {
              return _composer.value
                  ? _composer.value.fallbackLocale.value
                  : _fallbackLocale.value;
          },
          set: val => {
              if (_composer.value) {
                  _composer.value.fallbackLocale.value = val;
              }
              _fallbackLocale.value = val;
          }
      });
      // messages
      const messages = vueDemi.computed(() => {
          if (_composer.value) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return _composer.value.messages.value;
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return _messages.value;
          }
      });
      const datetimeFormats = vueDemi.computed(() => _datetimeFormats.value);
      const numberFormats = vueDemi.computed(() => _numberFormats.value);
      function getPostTranslationHandler() {
          return _composer.value
              ? _composer.value.getPostTranslationHandler()
              : _postTranslation;
      }
      function setPostTranslationHandler(handler) {
          if (_composer.value) {
              _composer.value.setPostTranslationHandler(handler);
          }
      }
      function getMissingHandler() {
          return _composer.value ? _composer.value.getMissingHandler() : _missing;
      }
      function setMissingHandler(handler) {
          if (_composer.value) {
              _composer.value.setMissingHandler(handler);
          }
      }
      function warpWithDeps(fn) {
          trackReactivityValues();
          return fn();
      }
      function t(...args) {
          return _composer.value
              ? warpWithDeps(() => Reflect.apply(_composer.value.t, null, [...args]))
              : warpWithDeps(() => '');
      }
      function rt(...args) {
          return _composer.value
              ? Reflect.apply(_composer.value.rt, null, [...args])
              : '';
      }
      function d(...args) {
          return _composer.value
              ? warpWithDeps(() => Reflect.apply(_composer.value.d, null, [...args]))
              : warpWithDeps(() => '');
      }
      function n(...args) {
          return _composer.value
              ? warpWithDeps(() => Reflect.apply(_composer.value.n, null, [...args]))
              : warpWithDeps(() => '');
      }
      function tm(key) {
          return _composer.value ? _composer.value.tm(key) : {};
      }
      function te(key, locale) {
          return _composer.value ? _composer.value.te(key, locale) : false;
      }
      function getLocaleMessage(locale) {
          return _composer.value ? _composer.value.getLocaleMessage(locale) : {};
      }
      function setLocaleMessage(locale, message) {
          if (_composer.value) {
              _composer.value.setLocaleMessage(locale, message);
              _messages.value[locale] = message;
          }
      }
      function mergeLocaleMessage(locale, message) {
          if (_composer.value) {
              _composer.value.mergeLocaleMessage(locale, message);
          }
      }
      function getDateTimeFormat(locale) {
          return _composer.value ? _composer.value.getDateTimeFormat(locale) : {};
      }
      function setDateTimeFormat(locale, format) {
          if (_composer.value) {
              _composer.value.setDateTimeFormat(locale, format);
              _datetimeFormats.value[locale] = format;
          }
      }
      function mergeDateTimeFormat(locale, format) {
          if (_composer.value) {
              _composer.value.mergeDateTimeFormat(locale, format);
          }
      }
      function getNumberFormat(locale) {
          return _composer.value ? _composer.value.getNumberFormat(locale) : {};
      }
      function setNumberFormat(locale, format) {
          if (_composer.value) {
              _composer.value.setNumberFormat(locale, format);
              _numberFormats.value[locale] = format;
          }
      }
      function mergeNumberFormat(locale, format) {
          if (_composer.value) {
              _composer.value.mergeNumberFormat(locale, format);
          }
      }
      const wrapper = {
          get id() {
              return _composer.value ? _composer.value.id : -1;
          },
          locale,
          fallbackLocale,
          messages,
          datetimeFormats,
          numberFormats,
          get inheritLocale() {
              return _composer.value ? _composer.value.inheritLocale : _inheritLocale;
          },
          set inheritLocale(val) {
              if (_composer.value) {
                  _composer.value.inheritLocale = val;
              }
          },
          get availableLocales() {
              return _composer.value
                  ? _composer.value.availableLocales
                  : Object.keys(_messages.value);
          },
          get modifiers() {
              return (_composer.value ? _composer.value.modifiers : _modifiers);
          },
          get pluralRules() {
              return (_composer.value ? _composer.value.pluralRules : _pluralRules);
          },
          get isGlobal() {
              return _composer.value ? _composer.value.isGlobal : false;
          },
          get missingWarn() {
              return _composer.value ? _composer.value.missingWarn : _missingWarn;
          },
          set missingWarn(val) {
              if (_composer.value) {
                  _composer.value.missingWarn = val;
              }
          },
          get fallbackWarn() {
              return _composer.value ? _composer.value.fallbackWarn : _fallbackWarn;
          },
          set fallbackWarn(val) {
              if (_composer.value) {
                  _composer.value.missingWarn = val;
              }
          },
          get fallbackRoot() {
              return _composer.value ? _composer.value.fallbackRoot : _fallbackRoot;
          },
          set fallbackRoot(val) {
              if (_composer.value) {
                  _composer.value.fallbackRoot = val;
              }
          },
          get fallbackFormat() {
              return _composer.value ? _composer.value.fallbackFormat : _fallbackFormat;
          },
          set fallbackFormat(val) {
              if (_composer.value) {
                  _composer.value.fallbackFormat = val;
              }
          },
          get warnHtmlMessage() {
              return _composer.value
                  ? _composer.value.warnHtmlMessage
                  : _warnHtmlMessage;
          },
          set warnHtmlMessage(val) {
              if (_composer.value) {
                  _composer.value.warnHtmlMessage = val;
              }
          },
          get escapeParameter() {
              return _composer.value
                  ? _composer.value.escapeParameter
                  : _escapeParameter;
          },
          set escapeParameter(val) {
              if (_composer.value) {
                  _composer.value.escapeParameter = val;
              }
          },
          t,
          getPostTranslationHandler,
          setPostTranslationHandler,
          getMissingHandler,
          setMissingHandler,
          rt,
          d,
          n,
          tm,
          te,
          getLocaleMessage,
          setLocaleMessage,
          mergeLocaleMessage,
          getDateTimeFormat,
          setDateTimeFormat,
          mergeDateTimeFormat,
          getNumberFormat,
          setNumberFormat,
          mergeNumberFormat
      };
      function sync(composer) {
          composer.locale.value = _locale.value;
          composer.fallbackLocale.value = _fallbackLocale.value;
          Object.keys(_messages.value).forEach(locale => {
              composer.mergeLocaleMessage(locale, _messages.value[locale]);
          });
          Object.keys(_datetimeFormats.value).forEach(locale => {
              composer.mergeDateTimeFormat(locale, _datetimeFormats.value[locale]);
          });
          Object.keys(_numberFormats.value).forEach(locale => {
              composer.mergeNumberFormat(locale, _numberFormats.value[locale]);
          });
          composer.escapeParameter = _escapeParameter;
          composer.fallbackFormat = _fallbackFormat;
          composer.fallbackRoot = _fallbackRoot;
          composer.fallbackWarn = _fallbackWarn;
          composer.missingWarn = _missingWarn;
          composer.warnHtmlMessage = _warnHtmlMessage;
      }
      vueDemi.onBeforeMount(() => {
          if (instance.proxy == null || instance.proxy.$i18n == null) {
              throw createI18nError(I18nErrorCodes.NOT_AVAILABLE_COMPOSITION_IN_LEGACY);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const composer = (_composer.value = instance.proxy.$i18n
              .__composer);
          if (scope === 'global') {
              _locale.value = composer.locale.value;
              _fallbackLocale.value = composer.fallbackLocale.value;
              _messages.value = composer.messages.value;
              _datetimeFormats.value = composer.datetimeFormats.value;
              _numberFormats.value = composer.numberFormats.value;
          }
          else if (isLocale) {
              sync(composer);
          }
      });
      return wrapper;
  }
  function injectGlobalFieldsForBridge(Vue, // eslint-disable-line @typescript-eslint/no-explicit-any
  i18n, // eslint-disable-line @typescript-eslint/no-explicit-any
  composer) {
      // The composition mode in vue-i18n-bridge is `$18n` is the VueI18n instance.
      // so we need to tell composer to change the locale.
      // If we don't do, things like `$t` that are injected will not be reacted.
      const watcher = i18n.watchLocale(composer);
      // define fowardcompatible vue-i18n-next inject fields with `globalInjection`
      Vue.prototype.$t = function (...args) {
          return Reflect.apply(composer.t, composer, [...args]);
      };
      Vue.prototype.$d = function (...args) {
          return Reflect.apply(composer.d, composer, [...args]);
      };
      Vue.prototype.$n = function (...args) {
          return Reflect.apply(composer.n, composer, [...args]);
      };
      return watcher;
  }

  // register message compiler at vue-i18n
  registerMessageCompiler(compileToFunction);
  // register message resolver at vue-i18n
  registerMessageResolver(resolveValue);
  // register fallback locale at vue-i18n
  registerLocaleFallbacker(fallbackWithLocaleChain);
  // NOTE: experimental !!
  {
      const target = getGlobalThis();
      target.__INTLIFY__ = true;
      setDevToolsHook(target.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
  }
  {
      initDev();
  }

  exports.DatetimeFormat = DatetimeFormat;
  exports.I18nInjectionKey = I18nInjectionKey;
  exports.NumberFormat = NumberFormat;
  exports.Translation = Translation;
  exports.VERSION = VERSION;
  exports.castToVueI18n = castToVueI18n;
  exports.createI18n = createI18n;
  exports.useI18n = useI18n;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({}, VueDemi);
