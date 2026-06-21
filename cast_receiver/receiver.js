(function () {
  const namespace = "urn:x-cast:com.clipflowy.ebookflowy.reader";
  const context = cast.framework.CastReceiverContext.getInstance();
  const surface = document.getElementById("surface");
  const stateLabel = document.getElementById("stateLabel");
  const detailLabel = document.getElementById("detailLabel");
  const htmlFrame = document.getElementById("htmlFrame");
  const imageFrame = document.getElementById("imageFrame");
  const chunksByFrame = new Map();
  let sessionId = null;
  let deck = null;

  function setSurface(mode, title, detail) {
    surface.className = `surface surface-${mode}`;
    stateLabel.textContent = title || "ebookflowy";
    detailLabel.textContent = detail || "";
  }

  function send(senderId, type, requestId, payload) {
    context.sendCustomMessage(namespace, senderId, {
      type,
      requestId: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionId,
      payload: {
        ...(payload || {}),
        ...(requestId ? { ackRequestId: requestId } : {}),
      },
    });
  }

  function ack(senderId, message, extra) {
    send(senderId, "ack", message.requestId, extra);
  }

  function reportState(senderId, state, frameId) {
    send(senderId, "state", null, { state, frameId });
  }

  function reportError(senderId, requestId, code, message) {
    send(senderId, "error", requestId, {
      code,
      message,
      recoverable: true,
    });
    setSurface("error", "Cast error", message);
  }

  function decodeFrame(frameId) {
    const record = chunksByFrame.get(frameId);
    if (!record || record.parts.some((part) => typeof part !== "string")) {
      throw new Error("Frame chunks are incomplete.");
    }
    const encoded = record.parts.join("");
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(encoded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  }

  function showFrame(senderId, message) {
    const frameId = message.payload && message.payload.frameId;
    if (!frameId) {
      reportError(senderId, message.requestId, "frameTransferFailed", "frameId is required.");
      return;
    }
    let frame;
    try {
      frame = decodeFrame(frameId);
    } catch (error) {
      reportError(senderId, message.requestId, "frameTransferFailed", String(error.message || error));
      return;
    }

    imageFrame.removeAttribute("src");
    htmlFrame.removeAttribute("srcdoc");

    if (frame.contentType && frame.contentType.startsWith("image/")) {
      imageFrame.src = `data:${frame.contentType};base64,${frame.payload}`;
      imageFrame.alt = frame.displayName || "";
      setSurface("image", "", "");
    } else if (frame.contentType && frame.contentType.startsWith("text/html")) {
      htmlFrame.srcdoc = frame.payload || "";
      setSurface("html", "", "");
    } else {
      const payload = safeJson(frame.payload);
      setSurface(
        "error",
        frame.displayName || "Unsupported frame",
        payload.message || "This SlideBook item cannot be shown on Cast."
      );
    }
    chunksByFrame.delete(frameId);
    ack(senderId, message, { frameId });
    reportState(senderId, "showing", frameId);
  }

  function safeJson(source) {
    try {
      return JSON.parse(source || "{}");
    } catch (_) {
      return {};
    }
  }

  context.addCustomMessageListener(namespace, function (event) {
    const senderId = event.senderId;
    const message = event.data || {};
    const payload = message.payload || {};
    sessionId = message.sessionId || sessionId;

    switch (message.type) {
      case "hello":
        ack(senderId, message, { protocolVersion: 1 });
        reportState(senderId, "ready");
        break;
      case "openDeck":
        deck = payload;
        chunksByFrame.clear();
        setSurface("loading", deck.title || "SlideBook", "Preparing Cast receiver...");
        ack(senderId, message, { deckId: deck.deckId });
        reportState(senderId, "loading");
        break;
      case "frameChunk": {
        const frameId = payload.frameId;
        const chunkIndex = Number(payload.chunkIndex);
        const chunkCount = Number(payload.chunkCount);
        if (!frameId || !Number.isInteger(chunkIndex) || !Number.isInteger(chunkCount)) {
          reportError(senderId, message.requestId, "frameTransferFailed", "Invalid frame chunk.");
          return;
        }
        const record = chunksByFrame.get(frameId) || {
          parts: new Array(chunkCount),
        };
        record.parts[chunkIndex] = String(payload.payloadChunk || "");
        chunksByFrame.set(frameId, record);
        ack(senderId, message, { frameId, chunkIndex });
        break;
      }
      case "showFrame":
        showFrame(senderId, message);
        break;
      case "remoteCommand":
        if (payload.command === "close") {
          chunksByFrame.clear();
          setSurface("idle", "ebookflowy", "Cast session closed.");
          reportState(senderId, "closed");
        }
        ack(senderId, message, { command: payload.command });
        break;
      case "endSession":
        chunksByFrame.clear();
        setSurface("idle", "ebookflowy", "Waiting for SlideBook...");
        ack(senderId, message);
        reportState(senderId, "closed");
        break;
      default:
        reportError(senderId, message.requestId, "frameTransferFailed", "Unknown message type.");
    }
  });

  setSurface("idle", "ebookflowy", "Waiting for SlideBook...");
  context.start({
    disableIdleTimeout: true,
  });
})();
