const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result?.toString().replace(/^data:(.*,)?/, '') as string);
  reader.onerror = reject;
});

export default toBase64;
