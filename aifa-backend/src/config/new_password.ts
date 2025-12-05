import generatePassword from 'generate-password-ts';

export const password = generatePassword.generate({
  length: 12,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true
});

console.log('Generated password:', password);
