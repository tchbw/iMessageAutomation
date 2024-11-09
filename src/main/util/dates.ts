/**
 * Converts an iMessage timestamp to a JavaScript Date object
 * iMessage timestamps are in nanoseconds since 2001-01-01
 */
export function getDateIMessageInt(iMessageTimestamp: number): Date {
  // Scale down from nanoseconds
  const messageDate = iMessageTimestamp / 1000000000;

  // Get Unix timestamp for 2001-01-01 in seconds
  const baseDate = new Date(`2001-01-01T00:00:00Z`).getTime() / 1000;

  // Add the scaled message date to get Unix timestamp
  const unixTimestamp = messageDate + baseDate;

  // Convert to milliseconds for JS Date
  return new Date(unixTimestamp * 1000);
}
