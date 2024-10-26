import { promisify } from "node:util";
import { execFile, execFileSync } from "node:child_process";
import { InferSelectModel } from "drizzle-orm";
import { message } from "@shared/schemas/imessage";
const execFileAsync = promisify(execFile);

export async function runAppleScript({
  script,
  humanReadableOutput = true,
}: {
  script: string;
  humanReadableOutput?: boolean;
}): Promise<string> {
  if (process.platform !== `darwin`) {
    throw new Error(`macOS only`);
  }

  const outputArguments = humanReadableOutput ? [] : [`-ss`];

  const { stdout } = await execFileAsync(`osascript`, [
    `-e`,
    script,
    ...outputArguments,
  ]);
  return stdout.trim();
}

export function runAppleScriptSync(
  script,
  { humanReadableOutput = true } = {}
): string {
  if (process.platform !== `darwin`) {
    throw new Error(`macOS only`);
  }

  const outputArguments = humanReadableOutput ? [] : [`-ss`];

  const stdout = execFileSync(`osascript`, [`-e`, script, ...outputArguments], {
    encoding: `utf8`,
    stdio: [`ignore`, `pipe`, `ignore`],
    timeout: 500,
  });

  return stdout.trim();
}

export async function sendIMessage({
  phoneNumber,
  message,
}: {
  phoneNumber: string;
  message: string;
}): Promise<void> {
  await runAppleScript({
    script: `
    tell application "Messages"
        set targetService to 1st service whose service type = iMessage
        set targetBuddy to buddy "${phoneNumber}" of targetService
        send "${message.replace(/"/g, `\\"`)}" to targetBuddy
    end tell`,
  });
}

// TODO: move this to the right place and name it better
export function getContentFromIMessage(
  msg: InferSelectModel<typeof message>
): string {
  if (msg.text !== null) {
    return msg.text;
  }

  return _parseAttributedBody(msg.attributedBody as unknown as Buffer);
}

function _parseAttributedBody(attributedBody: Buffer): string {
  const nsStringIndex = attributedBody.indexOf(`NSString`);
  if (nsStringIndex === -1) {
    throw new Error(`NSString not found in attributedBody`);
  }

  const content = attributedBody.subarray(
    nsStringIndex + `NSString`.length + 5
  );
  let length: number;
  let start: number;

  if (content[0] === 0x81) {
    length = content.readUInt16LE(1);
    start = 3;
  } else {
    length = content[0];
    start = 1;
  }

  return content.subarray(start, start + length).toString(`utf-8`);
}
