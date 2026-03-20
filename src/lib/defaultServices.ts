import { ServiceProduct } from '@/types';

export const DEFAULT_SERVICES: ServiceProduct[] = [
  {
    id: '1',
    title: 'Seguro Obrigatório DPEM (Caiaque/Motor)',
    description: 'Seguro obrigatório para embarcações com motor. Evite multas e navegue legalizado.',
    price: 150.0,
    category: 'insurance',
    requiredDocuments: ['Nome Completo', 'RG e CPF', 'Comprovante de Endereço', 'Documento da Embarcação'],
    image: 'https://images.unsplash.com/photo-1564419434663-c49967363849?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    title: 'Licença Pescador Profissional',
    description: 'Carteira de Pescador Profissional (Artesanal). Necessário para pesca com redes, tarrafas.',
    price: 220.0,
    category: 'license',
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'NIT/PIS', 'Foto 3x4'],
    image: 'https://images.unsplash.com/photo-1534951475654-20a22eb28dfb?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    title: 'Licença Pescador Amador/Esportivo',
    description: 'Para pesca embarcada ou desembarcada com carretilhas e molinetes.',
    price: 80.0,
    category: 'license',
    requiredDocuments: ['RG', 'CPF', 'Endereço Completo'],
    image: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    title: 'Transferência de Propriedade',
    description: 'Regularize a compra da sua embarcação. Transferência de titularidade na Capitania.',
    price: 450.0,
    category: 'bureaucracy',
    requiredDocuments: ['Documento Original', 'Recibo de Compra e Venda (Reconhecido)', 'RG e CPF Comprador', 'RG e CPF Vendedor', 'Comprovante Residência', 'Vistoria'],
    image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe79b9b7?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '5',
    title: 'Inscrição de Embarcação Nova',
    description: 'Primeiro registro da embarcação junto à Marinha.',
    price: 500.0,
    category: 'bureaucracy',
    requiredDocuments: ['Nota Fiscal do Casco', 'Nota Fiscal do Motor', 'Manual/Memorial Descritivo', 'RG e CPF', 'Comprovante Residência'],
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=800'
  }
];
