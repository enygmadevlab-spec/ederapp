// Minimal BR Code (EMV) generator for PIX QR (BR Code)
// Implements EMV payload assembly and CRC16-CCITT (false) calculation

function field(id: string, value: string) {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function crc16(payload: string) {
  // CRC-16/CCITT-FALSE
  const poly = 0x1021;
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(payload);
  for (let i = 0; i < bytes.length; i++) {
    crc ^= (bytes[i] << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ poly) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildBRCode({ pixKey, amount, txid = '***', merchantName = 'Loja', merchantCity = 'Cidade' }: {
  pixKey: string;
  amount?: number;
  txid?: string;
  merchantName?: string;
  merchantCity?: string;
}) {
  // Merchant Account Information (GUI + key)
  const mai = field('00', 'BR.GOV.BCB.PIX') + field('01', pixKey);
  let payload = '';
  payload += field('00', '01'); // Payload format indicator
  payload += field('01', '12'); // Point of initiation method: 12 = static QR (common practice)
  payload += field('26', mai);
  payload += field('52', '0000'); // Merchant Category Code (0000 = unspecified)
  payload += field('53', '986'); // Currency: BRL
  if (amount !== undefined && amount !== null) payload += field('54', amount.toFixed(2));
  payload += field('58', 'BR');
  payload += field('59', merchantName.substring(0,25));
  payload += field('60', merchantCity.substring(0,15));
  // Additional data field template: txid
  payload += field('62', field('05', txid.substring(0,25)));
  // CRC placeholder
  const payloadForCrc = payload + '6304';
  const crc = crc16(payloadForCrc);
  payload += field('63', crc);
  return payload;
}

export default buildBRCode;
