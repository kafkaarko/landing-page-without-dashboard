/**
 * Accept an international number (or an Indonesian 08... local number).
 * Invalid input produces no link. The build validator reports the field to fix.
 */
export function buildWhatsAppUrl(phone, message = '') {
  if (phone == null) return undefined;
  let digits = String(phone).replace(/[\s()+.-]/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (!/^[1-9]\d{8,14}$/.test(digits)) return undefined;
  const encoded = encodeURIComponent(String(message).trim());
  return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
}
