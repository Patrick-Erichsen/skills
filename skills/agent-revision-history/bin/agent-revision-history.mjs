#!/usr/bin/env node
/* Generated from scripts/cli.ts. Bundles diff@9.0.0. */
/* Maintainers: run npm install && npm run build in this skill directory. */

// scripts/cli.ts
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// node_modules/diff/libesm/diff/base.js
var Diff = class {
  diff(oldStr, newStr, options = {}) {
    let callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else if ("callback" in options) {
      callback = options.callback;
    }
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }
  diffWithOptionsObj(oldTokens, newTokens, options, callback) {
    var _a;
    const done = (value) => {
      value = this.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return void 0;
      } else {
        return value;
      }
    };
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath = [{ oldPos: -1, lastComponent: void 0 }];
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    const execEditLength = () => {
      for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = void 0;
        }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = void 0;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(void 0);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }
  addToPath(path, added, removed, oldPosInc, options) {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  }
  extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }
  equals(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  }
  removeEmpty(array) {
    const ret = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  castInput(value, options) {
    return value;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenize(value, options) {
    return Array.from(value);
  }
  join(chars) {
    return chars.join("");
  }
  postProcess(changeObjects, options) {
    return changeObjects;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(lastComponent, newTokens, oldTokens) {
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (; componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value2, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value2.length ? oldValue : value2;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  }
};

// node_modules/diff/libesm/diff/line.js
var LineDiff = class extends Diff {
  constructor() {
    super(...arguments);
    this.tokenize = tokenize;
  }
  equals(left, right, options) {
    if (options.ignoreWhitespace) {
      if (!options.newlineIsToken || !left.includes("\n")) {
        left = left.trim();
      }
      if (!options.newlineIsToken || !right.includes("\n")) {
        right = right.trim();
      }
    } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
      if (left.endsWith("\n")) {
        left = left.slice(0, -1);
      }
      if (right.endsWith("\n")) {
        right = right.slice(0, -1);
      }
    }
    return super.equals(left, right, options);
  }
};
var lineDiff = new LineDiff();
function diffLines(oldStr, newStr, options) {
  return lineDiff.diff(oldStr, newStr, options);
}
function tokenize(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, "\n");
  }
  const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (let i = 0; i < linesAndNewlines.length; i++) {
    const line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
}

// node_modules/diff/libesm/patch/create.js
function needsQuoting(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] < " " || s[i] > "~" || s[i] === '"' || s[i] === "\\") {
      return true;
    }
  }
  return false;
}
function quoteFileNameIfNeeded(s) {
  if (!needsQuoting(s)) {
    return s;
  }
  let result = '"';
  const bytes = new TextEncoder().encode(s);
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b === 7) {
      result += "\\a";
    } else if (b === 8) {
      result += "\\b";
    } else if (b === 9) {
      result += "\\t";
    } else if (b === 10) {
      result += "\\n";
    } else if (b === 11) {
      result += "\\v";
    } else if (b === 12) {
      result += "\\f";
    } else if (b === 13) {
      result += "\\r";
    } else if (b === 34) {
      result += '\\"';
    } else if (b === 92) {
      result += "\\\\";
    } else if (b >= 32 && b <= 126) {
      result += String.fromCharCode(b);
    } else {
      result += "\\" + b.toString(8).padStart(3, "0");
    }
    i++;
  }
  result += '"';
  return result;
}
var INCLUDE_HEADERS = {
  includeIndex: true,
  includeUnderline: true,
  includeFileHeaders: true
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  let optionsObj;
  if (!options) {
    optionsObj = {};
  } else if (typeof options === "function") {
    optionsObj = { callback: options };
  } else {
    optionsObj = options;
  }
  if (typeof optionsObj.context === "undefined") {
    optionsObj.context = 4;
  }
  const context = optionsObj.context;
  if (optionsObj.newlineIsToken) {
    throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
  }
  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj));
  } else {
    const { callback } = optionsObj;
    diffLines(oldStr, newStr, Object.assign(Object.assign({}, optionsObj), { callback: (diff) => {
      const patch = diffLinesResultToPatch(diff);
      callback(patch);
    } }));
  }
  function diffLinesResultToPatch(diff) {
    if (!diff) {
      return;
    }
    diff.push({ value: "", lines: [] });
    function contextLines(lines) {
      return lines.map(function(entry) {
        return " " + entry;
      });
    }
    const hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
    for (let i = 0; i < diff.length; i++) {
      const current = diff[i], lines = current.lines || splitLines(current.value);
      current.lines = lines;
      if (current.added || current.removed) {
        if (!oldRangeStart) {
          const prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;
          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }
        for (const line of lines) {
          curRange.push((current.added ? "+" : "-") + line);
        }
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        if (oldRangeStart) {
          if (lines.length <= context * 2 && i < diff.length - 2) {
            for (const line of contextLines(lines)) {
              curRange.push(line);
            }
          } else {
            const contextSize = Math.min(lines.length, context);
            for (const line of contextLines(lines.slice(0, contextSize))) {
              curRange.push(line);
            }
            const hunk = {
              oldStart: oldRangeStart,
              oldLines: oldLine - oldRangeStart + contextSize,
              newStart: newRangeStart,
              newLines: newLine - newRangeStart + contextSize,
              lines: curRange
            };
            hunks.push(hunk);
            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
    for (const hunk of hunks) {
      for (let i = 0; i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith("\n")) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
          i++;
        }
      }
    }
    return {
      oldFileName,
      newFileName,
      oldHeader,
      newHeader,
      hunks
    };
  }
}
function formatPatch(patch, headerOptions) {
  var _a, _b, _c, _d, _e, _f;
  if (!headerOptions) {
    headerOptions = INCLUDE_HEADERS;
  }
  if (Array.isArray(patch)) {
    if (patch.length > 1 && !headerOptions.includeFileHeaders && !patch.every((p) => p.isGit)) {
      throw new Error("Cannot omit file headers on a multi-file patch. (The result would be unparseable; how would a tool trying to apply the patch know which changes are to which file?)");
    }
    return patch.map((p) => formatPatch(p, headerOptions)).join("\n");
  }
  const ret = [];
  if (patch.isGit) {
    headerOptions = INCLUDE_HEADERS;
    if (!patch.oldFileName) {
      throw new Error("oldFileName must be specified for Git patches");
    }
    if (!patch.newFileName) {
      throw new Error("newFileName must be specified for Git patches");
    }
    let gitOldName = patch.oldFileName;
    let gitNewName = patch.newFileName;
    if (patch.isCreate && gitOldName === "/dev/null") {
      gitOldName = gitNewName.replace(/^b\//, "a/");
    } else if (patch.isDelete && gitNewName === "/dev/null") {
      gitNewName = gitOldName.replace(/^a\//, "b/");
    }
    ret.push("diff --git " + quoteFileNameIfNeeded(gitOldName) + " " + quoteFileNameIfNeeded(gitNewName));
    if (patch.isDelete) {
      ret.push("deleted file mode " + ((_a = patch.oldMode) !== null && _a !== void 0 ? _a : "100644"));
    }
    if (patch.isCreate) {
      ret.push("new file mode " + ((_b = patch.newMode) !== null && _b !== void 0 ? _b : "100644"));
    }
    if (patch.oldMode && patch.newMode && !patch.isDelete && !patch.isCreate) {
      ret.push("old mode " + patch.oldMode);
      ret.push("new mode " + patch.newMode);
    }
    if (patch.isRename) {
      ret.push("rename from " + quoteFileNameIfNeeded(((_c = patch.oldFileName) !== null && _c !== void 0 ? _c : "").replace(/^a\//, "")));
      ret.push("rename to " + quoteFileNameIfNeeded(((_d = patch.newFileName) !== null && _d !== void 0 ? _d : "").replace(/^b\//, "")));
    }
    if (patch.isCopy) {
      ret.push("copy from " + quoteFileNameIfNeeded(((_e = patch.oldFileName) !== null && _e !== void 0 ? _e : "").replace(/^a\//, "")));
      ret.push("copy to " + quoteFileNameIfNeeded(((_f = patch.newFileName) !== null && _f !== void 0 ? _f : "").replace(/^b\//, "")));
    }
  } else {
    if (headerOptions.includeIndex && patch.oldFileName == patch.newFileName && patch.oldFileName !== void 0) {
      ret.push("Index: " + patch.oldFileName);
    }
    if (headerOptions.includeUnderline) {
      ret.push("===================================================================");
    }
  }
  const hasHunks = patch.hunks.length > 0;
  if (headerOptions.includeFileHeaders && patch.oldFileName !== void 0 && patch.newFileName !== void 0 && (!patch.isGit || hasHunks)) {
    ret.push("--- " + quoteFileNameIfNeeded(patch.oldFileName) + (patch.oldHeader ? "	" + patch.oldHeader : ""));
    ret.push("+++ " + quoteFileNameIfNeeded(patch.newFileName) + (patch.newHeader ? "	" + patch.newHeader : ""));
  }
  for (let i = 0; i < patch.hunks.length; i++) {
    const hunk = patch.hunks[i];
    const oldStart = hunk.oldLines === 0 ? hunk.oldStart - 1 : hunk.oldStart;
    const newStart = hunk.newLines === 0 ? hunk.newStart - 1 : hunk.newStart;
    ret.push("@@ -" + oldStart + "," + hunk.oldLines + " +" + newStart + "," + hunk.newLines + " @@");
    for (const line of hunk.lines) {
      ret.push(line);
    }
  }
  return ret.join("\n") + "\n";
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (typeof options === "function") {
    options = { callback: options };
  }
  if (!(options === null || options === void 0 ? void 0 : options.callback)) {
    const patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
    if (!patchObj) {
      return;
    }
    return formatPatch(patchObj, options === null || options === void 0 ? void 0 : options.headerOptions);
  } else {
    const { callback } = options;
    structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, Object.assign(Object.assign({}, options), { callback: (patchObj) => {
      if (!patchObj) {
        callback(void 0);
      } else {
        callback(formatPatch(patchObj, options.headerOptions));
      }
    } }));
  }
}
function splitLines(text) {
  const hasTrailingNl = text.endsWith("\n");
  const result = text.split("\n").map((line) => line + "\n");
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}

// scripts/src/index.ts
async function readTranscriptEventsFromJsonl(jsonl, _options) {
  const events = [];
  for (const line of jsonl.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let record;
    try {
      record = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const event = eventFromRecord(record, events.length);
    if (event) events.push(event);
  }
  return events;
}
function buildRevisionHistory({
  transcriptPath,
  documentPath,
  events,
  adapter = "jsonl",
  generatedAt = (/* @__PURE__ */ new Date()).toISOString(),
  currentDocument,
  documentAliases = []
}) {
  assertSupportedDocument(documentPath);
  const fileEvents = events.filter(
    (event) => event.kind === "file-edit" && [documentPath, ...documentAliases].some(
      (path) => isSameDocumentPath(event.path, path)
    )
  );
  const versions = [];
  let previousSnapshot = initialSnapshotFor(fileEvents, currentDocument);
  for (const fileEvent of fileEvents) {
    const previousUserMessage = findPreviousUserMessage(events, fileEvent.id);
    const nextSnapshot = fileEvent.after ?? applyPatch(previousSnapshot, fileEvent.patch, "forward") ?? previousSnapshot;
    versions.push({
      id: `version-${versions.length + 1}`,
      label: previousUserMessage?.text ? summarizeLabel(previousUserMessage.text) : `Edit ${versions.length + 1}`,
      timestamp: fileEvent.timestamp,
      snapshot: nextSnapshot,
      diff: createTwoFilesPatch(
        documentPath,
        documentPath,
        previousSnapshot,
        nextSnapshot,
        versions.at(-1)?.timestamp ?? "",
        fileEvent.timestamp ?? ""
      ),
      changes: [
        {
          id: fileEvent.id,
          path: fileEvent.path,
          tool: fileEvent.tool,
          summary: summarizeChange(previousSnapshot, nextSnapshot),
          patch: fileEvent.patch
        }
      ],
      provenance: {
        source: "transcript",
        transcriptPath,
        eventIds: [fileEvent.id],
        toolCallIds: fileEvent.toolCallId ? [fileEvent.toolCallId] : []
      }
    });
    previousSnapshot = nextSnapshot;
  }
  return {
    schemaVersion: 1,
    generatedAt,
    transcript: {
      path: transcriptPath,
      adapter
    },
    document: {
      path: documentPath,
      kind: documentPath.endsWith(".mdx") ? "mdx" : "markdown"
    },
    versions
  };
}
function stripPathPrefixFromRevisionHistory(history, prefix) {
  const normalizedPrefix = normalizePath(prefix).replace(/\/?$/, "/");
  return {
    ...history,
    transcript: {
      ...history.transcript,
      path: stripPathPrefix(history.transcript.path, normalizedPrefix)
    },
    document: {
      ...history.document,
      path: stripPathPrefix(history.document.path, normalizedPrefix)
    },
    versions: history.versions.map((version) => ({
      ...version,
      diff: stripPathPrefix(version.diff, normalizedPrefix),
      changes: version.changes.map((change) => ({
        ...change,
        path: stripPathPrefix(change.path, normalizedPrefix),
        patch: change.patch ? stripPathPrefix(change.patch, normalizedPrefix) : void 0
      })),
      provenance: {
        ...version.provenance,
        transcriptPath: stripPathPrefix(
          version.provenance.transcriptPath,
          normalizedPrefix
        )
      }
    }))
  };
}
function initialSnapshotFor(fileEvents, currentDocument) {
  if (currentDocument === void 0) return fileEvents[0]?.before ?? "";
  let snapshot = currentDocument;
  for (const fileEvent of fileEvents.slice().reverse()) {
    snapshot = fileEvent.before ?? applyPatch(snapshot, fileEvent.patch, "reverse") ?? snapshot;
  }
  return snapshot;
}
function eventFromRecord(record, index) {
  if (!isObject(record)) return void 0;
  const rolloutEvent = eventFromRolloutRecord(record, index);
  if (rolloutEvent) return rolloutEvent;
  const id = stringValue(record.id) ?? stringValue(record.item_id) ?? `event-${index + 1}`;
  const timestamp = stringValue(record.timestamp) ?? stringValue(record.created_at);
  const kind = stringValue(record.kind);
  const path = stringValue(record.path);
  if (kind === "file-edit" && path) {
    return {
      id,
      kind: "file-edit",
      timestamp,
      path,
      before: stringValue(record.before),
      after: stringValue(record.after),
      patch: stringValue(record.patch),
      tool: stringValue(record.tool),
      toolCallId: stringValue(record.toolCallId)
    };
  }
  const role = stringValue(record.role);
  const content = textFromContent(record.content);
  if (role === "user" && content) {
    return { id, kind: "user-message", timestamp, text: content };
  }
  if (role === "assistant" && content) {
    return { id, kind: "assistant-message", timestamp, text: content };
  }
  const name = stringValue(record.name) ?? stringValue(record.tool_name);
  const type = stringValue(record.type);
  const args = stringValue(record.arguments) ?? stringValue(record.input);
  if ((type === "function_call" || type === "tool_call") && name && args) {
    const patch = extractPatch(args);
    if (patch) {
      const path2 = extractFirstPatchPath(patch);
      if (!path2) return void 0;
      return {
        id,
        kind: "file-edit",
        timestamp,
        path: path2,
        patch,
        tool: name,
        toolCallId: id
      };
    }
  }
  return void 0;
}
function eventFromRolloutRecord(record, index) {
  const timestamp = stringValue(record.timestamp);
  const type = stringValue(record.type);
  const item = record.item;
  if ((type === "item.completed" || type === "item.started") && isObject(item)) {
    const itemType = stringValue(item.type);
    const status = stringValue(item.status);
    if (itemType === "file_change" && status !== "in_progress") {
      const change = Array.isArray(item.changes) ? item.changes.find(
        (candidate) => isObject(candidate) && stringValue(candidate.path)
      ) : void 0;
      if (!isObject(change)) return void 0;
      const itemId = stringValue(item.id) ?? `event-${index + 1}`;
      return {
        id: itemId,
        kind: "file-edit",
        timestamp,
        path: stringValue(change.path) ?? "",
        tool: "codex-file-change",
        toolCallId: itemId
      };
    }
  }
  const payload = record.payload;
  if (!isObject(payload)) return void 0;
  const payloadType = stringValue(payload.type);
  if (type === "event_msg" && payloadType === "user_message") {
    const message = stringValue(payload.message);
    if (!message) return void 0;
    return {
      id: `event-${index + 1}`,
      kind: "user-message",
      timestamp,
      text: message
    };
  }
  if (type === "response_item" && payloadType === "message") {
    const role = stringValue(payload.role);
    const content = textFromContent(payload.content);
    if (role !== "assistant" || !content) return void 0;
    return {
      id: `event-${index + 1}`,
      kind: "assistant-message",
      timestamp,
      text: content
    };
  }
  if (type === "response_item" && payloadType === "custom_tool_call") {
    const name = stringValue(payload.name);
    const input = stringValue(payload.input);
    const callId = stringValue(payload.call_id);
    if (!name || !input) return void 0;
    const patch = extractPatch(input);
    if (!patch) return void 0;
    const path = extractFirstPatchPath(patch);
    if (!path) return void 0;
    return {
      id: callId ?? `event-${index + 1}`,
      kind: "file-edit",
      timestamp,
      path,
      patch,
      tool: name,
      toolCallId: callId
    };
  }
  return void 0;
}
function findPreviousUserMessage(events, eventId) {
  const index = events.findIndex((event) => event.id === eventId);
  for (let i = index - 1; i >= 0; i--) {
    const event = events[i];
    if (event?.kind === "user-message") return event;
  }
  return void 0;
}
function applyPatch(content, patch, direction) {
  if (!patch) return void 0;
  let nextContent = content;
  const hunks = parsePatchHunks(patch);
  if (hunks.length === 0) return void 0;
  for (const hunk of hunks) {
    const fromLines = direction === "forward" ? hunk.oldLines : hunk.newLines;
    const toLines = direction === "forward" ? hunk.newLines : hunk.oldLines;
    const replaced = replaceBlock(nextContent, fromLines.join("\n"), toLines.join("\n"));
    if (replaced === void 0) return void 0;
    nextContent = replaced;
  }
  return nextContent;
}
function parsePatchHunks(patch) {
  const hunks = [];
  let current;
  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      current = { oldLines: [], newLines: [] };
      hunks.push(current);
      continue;
    }
    if (!current || line.startsWith("***") || line.startsWith("\\ No newline")) continue;
    if (line.startsWith(" ")) {
      current.oldLines.push(line.slice(1));
      current.newLines.push(line.slice(1));
    } else if (line.startsWith("-")) {
      current.oldLines.push(line.slice(1));
    } else if (line.startsWith("+")) {
      current.newLines.push(line.slice(1));
    }
  }
  return hunks;
}
function replaceBlock(content, fromBlock, toBlock) {
  if (!fromBlock) {
    return `${content}${content.endsWith("\n") ? "" : "\n"}${toBlock}${toBlock.endsWith("\n") ? "" : "\n"}`;
  }
  const index = content.indexOf(fromBlock);
  if (index !== -1) {
    return `${content.slice(0, index)}${toBlock}${content.slice(index + fromBlock.length)}`;
  }
  const withTrailingNewline = `${fromBlock}
`;
  const newlineIndex = content.indexOf(withTrailingNewline);
  if (newlineIndex === -1) return void 0;
  return `${content.slice(0, newlineIndex)}${toBlock}
${content.slice(newlineIndex + withTrailingNewline.length)}`;
}
function extractPatch(value) {
  const normalized = value.includes("\\n") && !value.includes("\n") ? value.replaceAll("\\n", "\n") : value;
  const begin = normalized.indexOf("*** Begin Patch");
  const end = normalized.indexOf("*** End Patch");
  if (begin === -1 || end === -1) return void 0;
  return normalized.slice(begin, end + "*** End Patch".length);
}
function extractFirstPatchPath(patch) {
  for (const line of patch.split("\n")) {
    const match = line.match(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/);
    if (match?.[1]) return match[1].trim();
  }
  return void 0;
}
function summarizeLabel(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 80);
}
function summarizeChange(before, after) {
  if (!before && after) return "Created document snapshot";
  if (before && !after) return "Removed document content";
  return summarizeChangedLines(
    getChangedLines(createTwoFilesPatch("before", "after", before, after, "", ""))
  );
}
function getChangedLines(diff) {
  return diff.split("\n").filter((line) => {
    if (line.startsWith("+++") || line.startsWith("---")) return false;
    return line.startsWith("+") || line.startsWith("-");
  }).map((line) => ({
    kind: line.startsWith("+") ? "added" : "removed",
    raw: line.replace(/^[+-]/, "")
  }));
}
function summarizeChangedLines(changedLines) {
  const raw = changedLines.map((line) => line.raw).join("\n");
  const addedLines = changedLines.filter(
    (line) => line.kind === "added" && line.raw.trim()
  );
  if (!raw.trim()) return "Updated document content";
  if (/^title:\s/m.test(raw)) return "Updated title metadata";
  if (/^(description|published|tags|author|revisionHistory):\s/m.test(raw)) {
    return "Updated post metadata";
  }
  if (/^import\s/m.test(raw)) return "Updated media import";
  if (/<img\b/.test(raw) || /\bsrc=/.test(raw)) return "Updated image";
  if (/<figcaption\b/.test(raw) || /<\/figcaption>/.test(raw)) {
    return "Updated image caption";
  }
  if (/^#{1,6}\s/m.test(raw)) return "Updated section heading";
  if (/:::\w*/.test(raw)) return "Updated callout";
  if (/^\s*[-*]\s+/m.test(raw)) return "Updated list item";
  if (addedLines.length === 0) return "Removed text";
  if (addedLines.length === 1 && addedLines[0].raw.trim().length < 120) {
    return "Edited a line";
  }
  return "Updated paragraph text";
}
function assertSupportedDocument(path) {
  if (!path.endsWith(".md") && !path.endsWith(".mdx")) {
    throw new Error(`Only Markdown and MDX documents are supported for now: ${path}`);
  }
}
function isSameDocumentPath(eventPath, documentPath) {
  const normalizedEventPath = normalizePath(eventPath);
  const normalizedDocumentPath = normalizePath(documentPath);
  return normalizedEventPath === normalizedDocumentPath || normalizedDocumentPath.endsWith(normalizedEventPath);
}
function normalizePath(path) {
  return path.replace(/\\/g, "/");
}
function stripPathPrefix(value, normalizedPrefix) {
  return normalizePath(value).replaceAll(normalizedPrefix, "");
}
function textFromContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return void 0;
  return content.map((item) => {
    if (typeof item === "string") return item;
    if (isObject(item)) return stringValue(item.text);
    return void 0;
  }).filter(Boolean).join("\n");
}
function stringValue(value) {
  return typeof value === "string" ? value : void 0;
}
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// scripts/cli.ts
async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.transcript || !options.document) {
    throw new Error(
      "Usage: tsx scripts/agent-revision-history/cli.ts --transcript <session.jsonl> --document <file.md|file.mdx> [--output revision-history.json]"
    );
  }
  const transcriptPath = resolve(options.transcript);
  const documentPath = resolve(options.document);
  const outputPath = resolve(options.output ?? "revision-history.json");
  const jsonl = await readFile(transcriptPath, "utf8");
  const currentDocument = await readFile(documentPath, "utf8");
  const events = await readTranscriptEventsFromJsonl(jsonl, { transcriptPath });
  let history = buildRevisionHistory({
    transcriptPath: options.transcriptLabel ?? transcriptPath,
    documentPath,
    events,
    currentDocument,
    documentAliases: options.documentAlias?.map((path) => resolve(path))
  });
  for (const prefix of options.stripPathPrefix ?? []) {
    history = stripPathPrefixFromRevisionHistory(history, resolve(prefix));
  }
  await writeFile(outputPath, `${JSON.stringify(history, null, 2)}
`, "utf8");
  console.log(`Wrote ${history.versions.length} revisions to ${outputPath}`);
}
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    if (!arg?.startsWith("--")) continue;
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    if (arg === "--transcript") options.transcript = next;
    if (arg === "--transcript-label") options.transcriptLabel = next;
    if (arg === "--document") options.document = next;
    if (arg === "--output") options.output = next;
    if (arg === "--document-alias") {
      options.documentAlias ??= [];
      options.documentAlias.push(next);
    }
    if (arg === "--strip-path-prefix") {
      options.stripPathPrefix ??= [];
      options.stripPathPrefix.push(next);
    }
    i++;
  }
  return options;
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
