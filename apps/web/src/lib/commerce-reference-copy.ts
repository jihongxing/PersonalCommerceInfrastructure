export interface ClipboardWriter {
  writeText(value: string): Promise<void>;
}

export async function copyCanonicalCommerceReference(
  clipboard: ClipboardWriter,
  commerceReference: string,
): Promise<void> {
  await clipboard.writeText(commerceReference);
}
