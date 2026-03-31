/**
 * Utilitários para formatação e máscaras de dados sensíveis e comuns.
 */

export const formatPhone = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value; // Retorna original se não bater o padrão
};

export const formatPix = (value: string): string => {
  if (!value) return '';
  const clean = value.replace(/\s/g, '');
  const digits = value.replace(/\D/g, '');

  // CPF
  if (digits.length === 11 && !value.includes('@')) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  
  // CNPJ
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  // Telefone (Celular) - Geralmente começa com dígito ou possui DDD
  if ((digits.length === 10 || digits.length === 11) && !value.includes('@')) {
     return formatPhone(digits);
  }

  // E-mail ou Chave Aleatória (EVP) costumam manter o original ou ser apenas o que foi digitado
  return value;
};
