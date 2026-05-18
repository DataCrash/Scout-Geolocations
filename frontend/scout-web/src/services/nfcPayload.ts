const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type NfcPayloadResult = {
  raw: string;
  patrulhaId?: string;
  checkinCode?: string;
};

function normalize(value: string) {
  return value.trim();
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function parsePrefixed(raw: string): NfcPayloadResult | null {
  const lower = raw.toLowerCase();

  if (lower.startsWith("patrol:") || lower.startsWith("patrulha:")) {
    const value = normalize(raw.split(":").slice(1).join(":"));
    return {
      raw,
      patrulhaId: isUuid(value) ? value : undefined,
      checkinCode: isUuid(value) ? undefined : value || undefined,
    };
  }

  if (lower.startsWith("qr:")) {
    const value = normalize(raw.slice(3));
    return {
      raw,
      checkinCode: value || undefined,
    };
  }

  return null;
}

function parseKeyValue(raw: string): NfcPayloadResult | null {
  if (!raw.includes("=")) {
    return null;
  }

  const entries = raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, ...valueParts] = entry.split("=");
      return [
        key.trim().toLowerCase(),
        normalize(valueParts.join("=")),
      ] as const;
    });

  const map = new Map(entries);
  const patrolValue = map.get("patrol") ?? map.get("patrulha");
  const qrValue = map.get("qr") ?? map.get("checkin") ?? map.get("code");

  if (!patrolValue && !qrValue) {
    return null;
  }

  return {
    raw,
    patrulhaId: patrolValue && isUuid(patrolValue) ? patrolValue : undefined,
    checkinCode: qrValue || undefined,
  };
}

export function parseNfcPayload(rawPayload: string): NfcPayloadResult {
  const raw = normalize(rawPayload);
  if (!raw) {
    return { raw: "" };
  }

  const prefixed = parsePrefixed(raw);
  if (prefixed) {
    return prefixed;
  }

  const keyValue = parseKeyValue(raw);
  if (keyValue) {
    return keyValue;
  }

  return {
    raw,
    checkinCode: raw,
  };
}
