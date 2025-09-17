import fs from 'fs';
import csvParser from 'csv-parser';

export const parseCSV = (filePath: string, createdBy?: string, direction?: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        results.push({
          ...data,
          createdBy,
          direction,
        });
      })
      .on('end', () => {
        fs.unlinkSync(filePath); // delete after parsing
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
