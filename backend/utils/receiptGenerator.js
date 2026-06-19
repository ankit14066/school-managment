const generateReceiptNumber = () => {
  const date = new Date();
  const prefix = 'RCP';
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

module.exports = { generateReceiptNumber };
