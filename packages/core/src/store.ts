/** Next/Expo inline `process.env.NEXT_PUBLIC_*` at build time; core has no @types/node. */
declare const process: { env: Record<string, string | undefined> }

/**
 * One store identity for the storefront, the console and every printed document.
 * Legal fields are optional on purpose: the demo has no registered company, and inventing a
 * name, address, hotline or tax code would put fabricated legal text on a document.
 */
export interface StoreInfo {
  name: string
  legalName: string
  address: string
  hotline: string
  email: string
  website: string
  taxCode: string
}

export const STORE: StoreInfo = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? 'AgriMarket',
  legalName: process.env.NEXT_PUBLIC_STORE_LEGAL_NAME ?? '',
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? '',
  hotline: process.env.NEXT_PUBLIC_STORE_HOTLINE ?? '',
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? '',
  website: process.env.NEXT_PUBLIC_STORE_WEBSITE ?? '',
  taxCode: process.env.NEXT_PUBLIC_STORE_TAX_CODE ?? '',
}

/** Only the fields that were actually configured — documents skip the rest instead of printing "—". */
export function storeContactLines(info: StoreInfo = STORE): string[] {
  return [
    info.address && `Địa chỉ: ${info.address}`,
    info.hotline && `Điện thoại: ${info.hotline}`,
    info.email && `Email: ${info.email}`,
    info.website && `Website: ${info.website}`,
    info.taxCode && `Mã số thuế: ${info.taxCode}`,
  ].filter(Boolean) as string[]
}
