export const replacePlaceholders = (template: string, data: Record<string, string>) => {
  let message = template;
  for (const key in data) {
    const placeholder = `{{${key}}}`;
    message = message.replaceAll(placeholder, data[key]);
  }
  return message;
};
