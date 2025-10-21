/**
 * CPF validation utility function
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas) format and check digits
 */

/**
 * Validates a CPF string
 * @param cpf - CPF string in format XXX.XXX.XXX-XX or XXXXXXXXXXX
 * @returns true if CPF is valid, false otherwise
 */
export const validateCpf = (cpf: string): boolean => {
  if (!cpf) return false;

  // Remove all non-numeric characters
  const cleanCpf = cpf.replace(/\D/g, '');

  // Check if CPF has 11 digits
  if (cleanCpf.length !== 11) return false;

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCpf.charAt(9)) !== firstCheckDigit) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCpf.charAt(10)) !== secondCheckDigit) return false;

  return true;
};

/**
 * Formats a CPF string to XXX.XXX.XXX-XX format
 * @param cpf - CPF string with only numbers
 * @returns formatted CPF string
 */
export const formatCpf = (cpf: string): string => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return cpf;
  
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Removes formatting from CPF string
 * @param cpf - CPF string with or without formatting
 * @returns clean CPF string with only numbers
 */
export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};