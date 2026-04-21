/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto entre o segundo e o terceiro dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto entre o quinto e o sexto dígitos
    .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca uma barra entre o oitavo e o nono dígitos
    .replace(/(\d{4})(\d)/, '$1-$2') // Coloca um hífen depois do décimo segundo dígito
    .slice(0, 18); // Limita o tamanho
};

/**
 * Aplica máscara de Telefone ((00) 00000-0000 ou (00) 0000-0000)
 */
export const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 10) {
    // Fixo: (00) 0000-0000
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  } else {
    // Celular: (00) 00000-0000
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }
};

/**
 * Valida formato de e-mail
 */
export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
