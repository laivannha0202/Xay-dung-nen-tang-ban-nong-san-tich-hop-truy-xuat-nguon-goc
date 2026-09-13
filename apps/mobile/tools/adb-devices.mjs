/**
 * Pure helpers để phân loại `adb devices -l`.
 *
 * Tách riêng để unit test (`usb:validate`) khóa hành vi mà không cần
 * điện thoại thật cắm máy. `expo-go-usb.mjs` reuse trực tiếp — không
 * duplicate logic parse ở hai nơi.
 *
 * Phân loại:
 *  A. physical Android (device thật qua USB)
 *  B. emulator (emulator-*, model sdk_*, waydroid)
 *  C. unauthorized
 *  D. offline / trạng thái khác
 */

const EMULATOR_SERIAL_RE = /^emulator-/i;
const EMULATOR_LINE_RE = /waydroid/i;
const EMULATOR_MODEL_RE = /\bmodel:sdk_/i;

/** Dòng này có phải emulator (không bao giờ được chọn làm target USB)? */
export function isEmulatorLine(serial, line) {
  return (
    EMULATOR_SERIAL_RE.test(serial) ||
    EMULATOR_LINE_RE.test(line) ||
    EMULATOR_MODEL_RE.test(line)
  );
}

/**
 * Parse output thô của `adb devices -l`.
 * @returns {{ connected, physical, emulators, unauthorized, offline }}
 * mỗi entry: { serial, line }
 */
export function classifyAdbDevices(output, requestedSerial) {
  const lines = String(output ?? '')
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  const unauthorized = [];
  const offline = [];
  const connected = [];

  for (const line of lines) {
    const serial = line.split(/\s+/)[0];
    if (!serial) continue;
    if (/\bunauthorized\b/.test(line)) {
      unauthorized.push({ serial, line });
    } else if (/\boffline\b/.test(line)) {
      offline.push({ serial, line });
    } else if (/\bdevice\b/.test(line)) {
      connected.push({ serial, line });
    }
    // Các trạng thái khác (no device, recovery, ...) bị bỏ qua có chủ đích.
  }

  const physical = connected.filter(
    ({ serial, line }) => !isEmulatorLine(serial, line),
  );
  const emulators = connected.filter(({ serial, line }) =>
    isEmulatorLine(serial, line),
  );

  return { connected, physical, emulators, unauthorized, offline, requestedSerial };
}

/**
 * Chọn 1 physical device hoặc throw lỗi có hướng dẫn khắc phục.
 * Không bao giờ trả về emulator.
 */
export function selectPhysicalDevice(parsed) {
  const { physical, emulators, unauthorized, offline } = parsed;
  const requested = parsed.requestedSerial?.trim();

  if (unauthorized.length > 0) {
    throw new Error(
      'Điện thoại đang unauthorized. Mở khóa điện thoại và bấm "Allow USB debugging", sau đó chạy lại `pnpm mobile:usb`.',
    );
  }

  if (requested) {
    const match = physical.find((item) => item.serial === requested);
    if (!match) {
      throw new Error(
        `ANDROID_SERIAL=${requested} không ở trạng thái device. Kiểm tra lại \`adb devices -l\`.`,
      );
    }
    return match;
  }

  if (physical.length === 0 && offline.length > 0) {
    const list = offline.map((item) => item.serial).join(', ');
    throw new Error(
      `Điện thoại đang offline (${list}). Rút cáp USB, cắm lại, chạy \`adb reconnect\` rồi thử lại \`pnpm mobile:usb\`.`,
    );
  }

  if (physical.length === 0 && emulators.length > 0) {
    throw new Error(
      'ADB chỉ thấy emulator, chưa thấy điện thoại USB thật. Cắm điện thoại thật qua USB, bật USB debugging rồi chạy lại `pnpm mobile:usb`.',
    );
  }

  if (physical.length === 0) {
    throw new Error(
      'ADB chưa thấy điện thoại thật. Cắm USB, bật USB debugging, mở khóa màn hình rồi chạy `adb devices -l` để kiểm tra.',
    );
  }

  if (physical.length > 1) {
    const list = physical.map((item) => item.serial).join(', ');
    throw new Error(
      `Có nhiều điện thoại USB thật (${list}). Chạy lại với ANDROID_SERIAL=<serial>, ví dụ: $env:ANDROID_SERIAL="${physical[0].serial}" rồi pnpm mobile:usb`,
    );
  }

  return physical[0];
}
